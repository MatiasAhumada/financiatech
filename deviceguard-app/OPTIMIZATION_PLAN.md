# 📱 DeviceGuard App - Plan de Optimización de Performance y Confiabilidad

## 🎯 Contexto y Arquitectura Actual

### Arquitectura de la App
DeviceGuard App es una aplicación **React Native + Expo** con módulos nativos Android que funciona como:
1. **Cliente de visualización** - Muestra estado del dispositivo (bloqueado/desbloqueado)
2. **Kiosk mode** - Bloquea el dispositivo en modo cabina
3. **Polling background** - Servicio nativo que consulta al servidor cada 30s
4. **Notificaciones push** - Firebase Cloud Messaging para notificaciones en tiempo real

### Flujo Actual de Polling
```
┌─────────────────────────────────────────────────────────────────┐
│                    DeviceGuardPollingService                     │
│                    (Android Native - Java)                       │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Polling    │────>│  HTTP GET    │────>│   Server     │   │
│  │   cada 30s   │     │  /api/device-│     │  Response    │   │
│  │              │     │  syncs/:imei │     │  {blocked}   │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                                                       │
│         │ Si blocked=true                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  emitDeviceStateChanged(true) → React Native             │  │
│  │  DeviceModule.startKioskMode()                           │  │
│  │  Intent: deviceguardapp://device-blocked                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Fallback: cada 5 minutos si está bloqueado
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PersistentService                             │
│                    (Guardián del Polling)                        │
│                                                                  │
│  • Verifica cada 60s que PollingService esté activo             │
│  • Reinicia si fue detenido                                      │
│  • Usa AlarmManager para sobrevivir a muerte de app             │
│  • WakeLock parcial para mantener CPU activo                    │
└─────────────────────────────────────────────────────────────────┘
```

### Estado Actual de la Implementación

| Componente | Estado | Observaciones |
|------------|--------|---------------|
| **Polling Service** | ✅ Implementado | Nativo Java, foreground service |
| **Persistent Service** | ✅ Implementado | Guardián que reinicia polling |
| **Kiosk Mode** | ✅ Implementado | Device Admin + Device Owner |
| **FCM Notifications** | ✅ Implementado | Firebase configurado |
| **Boot Receiver** | ✅ Implementado | Auto-inicio al prender |
| **Native Module** | ✅ Implementado | DeviceModule.java |

---

## ⚠️ Problemas Identificados

### 1. Consumo de Batería
**Problema**: Polling cada 30s + servicio persistente + wake locks

**Impacto**: 
- ~2880 requests/día (30s × 60 × 24)
- CPU activo constantemente
- Notificación persistente visible

### 2. Notificaciones Push No Explotadas
**Problema**: FCM está configurado pero solo se usa como fallback

**Situación actual**:
- El polling hace 2880 requests/día
- FCM podría reemplazar 99% de esos requests
- Solo se usa para mostrar alertas en primer plano

### 3. Race Conditions en Navegación
**Problema**: Múltiples puntos activan/desactivan kiosk mode

**Puntos críticos**:
- `DeviceGuardPollingService.onDeviceUnblocked()` → navega a MainActivity
- `DeviceModule.stopKioskMode()` → para kiosk desde RN
- `useDeviceStateListener` en `device-blocked.tsx` → escucha eventos

### 4. Manejo de Errores de Red
**Problema**: Timeouts y errores no se manejan óptimamente

**Código actual**:
```java
conn.setConnectTimeout(8000);  // 8 segundos
conn.setReadTimeout(8000);     // 8 segundos
```

**Problema**:
- 8 segundos es mucho para un timeout
- No hay retry con backoff exponencial
- No hay caché de última respuesta exitosa

### 5. Memoria y Performance en React Native
**Problema**: Hooks y listeners no se limpian correctamente

**Ejemplo**:
```typescript
useEffect(() => {
  const subscription = eventEmitter.addListener(...);
  return () => {
    subscription.remove();  // ✅ Bien
  };
}, []);
```

**Pero en device-blocked.tsx**:
- Múltiples `useFocusEffect` anidados
- Polling de respaldo de 2s (muy agresivo)
- `isUnblockedRef` puede tener race conditions

---

## 🚀 Plan de Optimización

### Fase 1: FCM como Canal Principal para Bloqueo/Desbloqueo (IMPACTO: ⭐⭐⭐⭐⭐)

**Objetivo**: Reemplazar polling por FCM para bloqueo/desbloqueo en tiempo real

#### 1A. Backend - Servicio FCM

**Archivo**: `src/lib/fcm.ts` (deviceguard-web)

```typescript
import admin from 'firebase-admin';
import { DeviceSyncRepository } from '@/server/repository/deviceSync.repository';

export interface FcmPayload {
  type: 'DEVICE_BLOCKED' | 'DEVICE_UNBLOCKED';
  deviceId: string;
  imei: string;
  timestamp: string;
}

export const fcmService = {
  async sendToDevice(imei: string, payload: FcmPayload): Promise<boolean> {
    const deviceSyncRepository = new DeviceSyncRepository();
    const deviceSync = await deviceSyncRepository.findByImei(imei);

    if (!deviceSync?.fcmToken) {
      return false;
    }

    try {
      await admin.messaging().send({
        token: deviceSync.fcmToken,
        data: payload,
        android: {
          priority: 'high',
          data: payload,
        },
      });

      return true;
    } catch {
      return false;
    }
  },
};
```

#### 1B. Backend - Endpoints REST para Control

**Archivo**: `src/app/api/devices/[id]/status/route.ts` (deviceguard-web)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deviceControlService } from '@/server/services/deviceControl.service';
import { fcmService } from '@/lib/fcm';
import apiErrorHandler, { ApiError } from '@/utils/handlers/apiError.handler';
import httpStatus from 'http-status';
import { z } from 'zod';
import { DeviceStatus } from '@prisma/client';
import { DeviceSyncRepository } from '@/server/repository/deviceSync.repository';

const updateDeviceStatusSchema = z.object({
  status: z.nativeEnum(DeviceStatus),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDeviceStatusSchema.parse(body);

    const { status } = validatedData;

    const deviceSyncRepository = new DeviceSyncRepository();
    const deviceSync = await deviceSyncRepository.findByImei(id);

    if (!deviceSync) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: 'Dispositivo no encontrado',
      });
    }

    const deviceId = deviceSync.deviceId;
    const imei = deviceSync.imei;

    if (status === DeviceStatus.BLOCKED) {
      const result = await deviceControlService.lockDevice({ deviceId });

      if (result.success) {
        const fcmSent = await fcmService.sendToDevice(imei, {
          type: 'DEVICE_BLOCKED',
          deviceId,
          imei,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          ...result,
          fcmSent,
          deliveryPending: !fcmSent,
        });
      }
    }

    if (status === DeviceStatus.SOLD_SYNCED) {
      const result = await deviceControlService.unlockDevice({ deviceId });

      if (result.success) {
        const fcmSent = await fcmService.sendToDevice(imei, {
          type: 'DEVICE_UNBLOCKED',
          deviceId,
          imei,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          ...result,
          fcmSent,
          deliveryPending: !fcmSent,
        });
      }
    }

    throw new ApiError({
      status: httpStatus.BAD_REQUEST,
      message: 'Estado inválido',
    });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
```

**Nota**: El endpoint usa `id` como IMEI del dispositivo para mantener consistencia con la app móvil.

#### 1C. Android Nativo - Firebase Service

**Archivo**: `android/app/src/main/java/.../DeviceGuardFirebaseService.java`

```java
package com.deviceguard.kiosk;

import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class DeviceGuardFirebaseService extends FirebaseMessagingService {
    
    private static final String TAG = "DGFirebaseService";
    private static final String KEY_TYPE = "type";
    private static final String KEY_DEVICE_ID = "deviceId";
    private static final String KEY_IMEI = "imei";
    private static final String KEY_TIMESTAMP = "timestamp";
    
    private static final String TYPE_BLOCKED = "DEVICE_BLOCKED";
    private static final String TYPE_UNBLOCKED = "DEVICE_UNBLOCKED";
    
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());
        
        Map<String, String> data = remoteMessage.getData();
        
        if (data.isEmpty()) {
            return;
        }
        
        String type = data.get(KEY_TYPE);
        String deviceId = data.get(KEY_DEVICE_ID);
        String imei = data.get(KEY_IMEI);
        String timestamp = data.get(KEY_TIMESTAMP);
        
        if (TYPE_BLOCKED.equals(type)) {
            handleDeviceBlocked(imei);
        } else if (TYPE_UNBLOCKED.equals(type)) {
            handleDeviceUnblocked(imei);
        }
        
        sendAckToBackend(deviceId, type, timestamp);
    }
    
    private void handleDeviceBlocked(String imei) {
        Log.i(TAG, "FCM: Device blocked signal received for IMEI: " + imei);
        
        SharedPreferences prefs = getSharedPreferences(
            DeviceGuardPollingService.PREFS_NAME, 
            Context.MODE_PRIVATE
        );
        
        String myImei = prefs.getString(DeviceGuardPollingService.KEY_DEVICE_ID, null);
        
        if (imei != null && imei.equals(myImei)) {
            prefs.edit()
                 .putBoolean(DeviceGuardPollingService.KEY_IS_LOCKED, true)
                 .putBoolean(DeviceGuardPollingService.KEY_LOCKDOWN_ACTIVE, true)
                 .apply();
            
            DeviceModule.emitDeviceStateChanged(
                getReactContext(), 
                true
            );
            
            activateKioskMode();
            navigateToBlockedScreen();
        }
    }
    
    private void handleDeviceUnblocked(String imei) {
        Log.i(TAG, "FCM: Device unblocked signal received for IMEI: " + imei);
        
        SharedPreferences prefs = getSharedPreferences(
            DeviceGuardPollingService.PREFS_NAME, 
            Context.MODE_PRIVATE
        );
        
        String myImei = prefs.getString(DeviceGuardPollingService.KEY_DEVICE_ID, null);
        
        if (imei != null && imei.equals(myImei)) {
            prefs.edit()
                 .putBoolean(DeviceGuardPollingService.KEY_IS_LOCKED, false)
                 .putBoolean(DeviceGuardPollingService.KEY_LOCKDOWN_ACTIVE, false)
                 .apply();
            
            DeviceModule.emitDeviceStateChanged(
                getReactContext(), 
                false
            );
            
            deactivateKioskMode();
            navigateToUnblockedScreen();
        }
    }
    
    private void sendAckToBackend(String deviceId, String type, String timestamp) {
        String apiUrl = getSharedPreferences(
            DeviceGuardPollingService.PREFS_NAME, 
            Context.MODE_PRIVATE
        ).getString(DeviceGuardPollingService.KEY_API_URL, null);
        
        if (apiUrl == null || deviceId == null) {
            return;
        }
        
        try {
            String endpoint = apiUrl + "/api/device-syncs/ack";
            
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            String jsonBody = String.format(
                "{\"deviceId\":\"%s\",\"type\":\"%s\",\"timestamp\":\"%s\"}",
                deviceId,
                type,
                timestamp
            );
            
            conn.getOutputStream().write(jsonBody.getBytes());
            
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "ACK response: " + responseCode);
            
            conn.disconnect();
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending ACK: " + e.getMessage());
        }
    }
    
    private void activateKioskMode() {
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(
            Context.DEVICE_POLICY_SERVICE
        );
        ComponentName admin = new ComponentName(this, DeviceAdmin.class);
        
        if (dpm.isDeviceOwnerApp(getPackageName())) {
            try {
                String[] packages = {getPackageName()};
                dpm.setLockTaskPackages(admin, packages);
                dpm.setKeyguardDisabled(admin, true);
            } catch (Exception e) {
                Log.e(TAG, "Error setting lock task: " + e.getMessage());
            }
        }
        
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            @SuppressWarnings("deprecation")
            PowerManager.WakeLock wl = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "DeviceGuard::BlockWakeLock"
            );
            wl.acquire(10000);
        }
        
        navigateToBlockedScreen();
    }
    
    private void deactivateKioskMode() {
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(
            Context.DEVICE_POLICY_SERVICE
        );
        ComponentName admin = new ComponentName(this, DeviceAdmin.class);
        
        if (dpm.isDeviceOwnerApp(getPackageName())) {
            try {
                dpm.setKeyguardDisabled(admin, false);
                dpm.setLockTaskPackages(admin, new String[0]);
            } catch (Exception e) {
                Log.e(TAG, "Error disabling kiosk: " + e.getMessage());
            }
        }
        
        navigateToUnblockedScreen();
    }
    
    private void navigateToBlockedScreen() {
        Intent intent = new Intent(Intent.ACTION_VIEW,
            Uri.parse("deviceguardapp://device-blocked"));
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        startActivity(intent);
    }
    
    private void navigateToUnblockedScreen() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        intent.putExtra("unblocked", true);
        intent.putExtra("navigate_to", "linking-success");
        startActivity(intent);
    }
    
    private ReactApplicationContext getReactContext() {
        try {
            if (getApplication() instanceof ReactApplication) {
                ReactContext context = ((ReactApplication) getApplication())
                    .getReactNativeHost()
                    .getReactInstanceManager()
                    .getCurrentReactContext();
                if (context instanceof ReactApplicationContext) {
                    ReactApplicationContext reactContext = (ReactApplicationContext) context;
                    if (reactContext.hasActiveCatalystInstance()) {
                        return reactContext;
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error getting ReactContext: " + e.getMessage());
        }
        return null;
    }
    
    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "New FCM token: " + token);
        sendTokenToBackend(token);
    }
    
    private void sendTokenToBackend(String token) {
        String imei = getSharedPreferences("DeviceGuardPrefs", MODE_PRIVATE)
            .getString("deviceId", null);
        
        if (imei == null) {
            return;
        }
        
        try {
            String apiUrl = getSharedPreferences("DeviceGuardPrefs", MODE_PRIVATE)
                .getString("apiUrl", null);
            
            if (apiUrl == null) {
                return;
            }
            
            String endpoint = apiUrl + "/api/device-syncs/fcm-token";
            
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            String jsonBody = String.format(
                "{\"imei\":\"%s\",\"fcmToken\":\"%s\"}",
                imei,
                token
            );
            
            conn.getOutputStream().write(jsonBody.getBytes());
            conn.disconnect();
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending FCM token: " + e.getMessage());
        }
    }
}
```

#### 1D. Actualizar AndroidManifest.xml

**Archivo**: `android/app/src/main/AndroidManifest.xml`

```xml
<!-- Firebase Messaging Service -->
<service
    android:name=".DeviceGuardFirebaseService"
    android:enabled="true"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

#### 1E. React Native - Hook de Notificaciones

**Archivo**: `src/hooks/usePushNotifications.ts`

```typescript
import { useEffect, useRef, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { initializeMessaging } from "../services/firebase.service";
import { registerFCMToken } from "../services/notification.service";
import * as Application from "expo-application";

export function usePushNotifications() {
  const initialized = useRef(false);
  const imeiRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const sendTokenToBackend = useCallback(async (token: string, imei: string) => {
    try {
      await registerFCMToken({
        fcmToken: token,
        imei,
      });
    } catch {
      console.error("[FCM] Error al enviar token");
    }
  }, []);

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const initialize = async () => {
      try {
        const imei = Application.getAndroidId();
        imeiRef.current = imei;

        const token = await initializeMessaging({
          onMessageReceived: (message) => {
            const messageType = message.data?.type;

            if (messageType === "DEVICE_BLOCKED") {
              console.log("[FCM] Device blocked signal received");
            } else if (messageType === "DEVICE_UNBLOCKED") {
              console.log("[FCM] Device unblocked signal received");
            }

            if (message.notification && Platform.OS === "android") {
              const title = message.notification.title || "Nueva notificación";
              const body = message.notification.body || "";
              Alert.alert(title, body, [{ text: "OK" }], {
                cancelable: true,
              });
            }
          },
          onNotificationOpened: () => {
            // Navegar si es necesario
          },
          onTokenRefresh: async (newToken) => {
            tokenRef.current = newToken;
            if (imeiRef.current) {
              await sendTokenToBackend(newToken, imeiRef.current);
            }
          },
        });

        if (token && imei) {
          tokenRef.current = token;
          await sendTokenToBackend(token, imei);
        }
      } catch {
        console.error("[NOTIFICATION] Error al inicializar");
      }
    };

    initialize();
  }, [sendTokenToBackend]);
}
```

---

### Fase 2: Sistema de Confirmación (ACK) (IMPACTO: ⭐⭐⭐⭐)

#### 2A. Backend - Endpoint para ACK

**Archivo**: `src/app/api/device-syncs/ack/route.ts` (deviceguard-web)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import apiErrorHandler, { ApiError } from '@/utils/handlers/apiError.handler';
import httpStatus from 'http-status';
import { z } from 'zod';

const ackSchema = z.object({
  deviceId: z.string(),
  type: z.enum(['DEVICE_BLOCKED', 'DEVICE_UNBLOCKED']),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ackSchema.parse(body);

    const { deviceId, type, timestamp } = validatedData;

    await prisma.deviceSync.update({
      where: { deviceId },
      data: {
        syncedAt: new Date(timestamp),
      },
    });

    console.log(`[ACK] Received ${type} confirmation for device ${deviceId}`);

    return NextResponse.json({
      success: true,
      message: 'ACK received',
    });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
```

#### 2B. Backend - Cola de Comandos Pendientes

**Archivo**: `prisma/schema.prisma` (deviceguard-web)

```prisma
model PendingCommand {
  id        String   @id @default(cuid())
  deviceId  String
  type      String
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
  sentAt    DateTime?
  ackedAt   DateTime?

  deviceSync DeviceSync @relation(fields: [deviceId], references: [deviceId], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("pending_commands")
}
```

---

### Fase 3: Fallback Offline Inteligente (IMPACTO: ⭐⭐⭐⭐)

#### 3A. Polling Adaptativo

**Archivo**: `DeviceGuardPollingService.java`

```java
private static final long POLL_INTERVAL_ACTIVE_MS = 30000;
private static final long POLL_INTERVAL_BLOCKED_MS = 300000;
private static final long POLL_INTERVAL_GRACE_MS = 5000;

private int consecutiveFailures = 0;
private static final long MAX_BACKOFF_MS = 300000;

private long getCurrentPollInterval() {
    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    boolean isBlocked = prefs.getBoolean(KEY_IS_LOCKED, false);
    
    if (isBlocked) {
        return POLL_INTERVAL_BLOCKED_MS;
    }
    
    return POLL_INTERVAL_ACTIVE_MS;
}

private long calculateBackoff() {
    consecutiveFailures++;
    long backoff = (long) (1000 * Math.pow(2, consecutiveFailures));
    return Math.min(backoff, MAX_BACKOFF_MS);
}
```

#### 3B. Caché de Última Respuesta

**Archivo**: `DeviceGuardPollingService.java`

```java
private static final String KEY_LAST_KNOWN_STATE = "lastKnownState";
private static final String KEY_LAST_SUCCESSFUL_POLL = "lastSuccessfulPoll";
private static final long CACHE_MAX_AGE_MS = 3600000;

private void pollServer() {
    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    String imei = prefs.getString(KEY_DEVICE_ID, null);
    String apiUrl = prefs.getString(KEY_API_URL, null);

    if (imei == null || apiUrl == null) {
        return;
    }

    try {
        String endpoint = apiUrl + "/api/device-syncs/" + imei;
        
        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        conn.setRequestProperty("Accept", "application/json");

        int responseCode = conn.getResponseCode();

        if (responseCode == 200) {
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream())
            );
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();
            conn.disconnect();

            String body = sb.toString();
            boolean isBlocked = body.contains("\"blocked\":true");

            prefs.edit()
                 .putBoolean(KEY_LAST_KNOWN_STATE, isBlocked)
                 .putLong(KEY_LAST_SUCCESSFUL_POLL, System.currentTimeMillis())
                 .apply();

            consecutiveFailures = 0;

            if (isBlocked && !lastKnownBlocked) {
                lastKnownBlocked = true;
                onDeviceBlocked();
            } else if (!isBlocked && lastKnownBlocked) {
                lastKnownBlocked = false;
                onDeviceUnblocked();
            }

        } else {
            useCacheOrBackoff(prefs);
        }

    } catch (UnknownHostException e) {
        useCacheOrBackoff(prefs);
    } catch (ConnectException e) {
        useCacheOrBackoff(prefs);
    } catch (SocketTimeoutException e) {
        useCacheOrBackoff(prefs);
    } catch (Exception e) {
        useCacheOrBackoff(prefs);
    }
}

private void useCacheOrBackoff(SharedPreferences prefs) {
    long lastSuccess = prefs.getLong(KEY_LAST_SUCCESSFUL_POLL, 0);
    boolean useCache = (System.currentTimeMillis() - lastSuccess) < CACHE_MAX_AGE_MS;

    if (useCache) {
        boolean cachedState = prefs.getBoolean(KEY_LAST_KNOWN_STATE, false);
        Log.d(TAG, "Using cached state: blocked=" + cachedState);
        return;
    }

    long backoff = calculateBackoff();
    handler.postDelayed(pollRunnable, backoff);
}
```

---

### Fase 4: Optimizaciones de Performance (IMPACTO: ⭐⭐⭐)

#### 4A. Simplificar device-blocked.tsx

**Archivo**: `app/device-blocked.tsx`

```typescript
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useDeviceImei } from "@/src/hooks/useDeviceImei";
import { provisioningService } from "@/src/services/provisioning.service";
import { useKioskMode } from "@/src/hooks/useKioskMode";
import { useDeviceStateListener } from "@/src/hooks/useDeviceStateListener";

export default function DeviceBlockedScreen() {
  const router = useRouter();
  const { deviceId, isReady } = useDeviceImei();
  const [pending, setPending] = useState<number | null>(null);
  const navigation = useNavigation();
  const isUnblockedRef = useRef(false);
  const kioskControl = useKioskMode(true);

  useDeviceStateListener(
    () => {
      console.log('[DG] Device blocked event (already in blocked screen)');
    },
    async () => {
      if (!isUnblockedRef.current) {
        isUnblockedRef.current = true;
        await kioskControl.stopKiosk();
        router.replace({ pathname: "/linking-success" });
      }
    }
  );

  useEffect(() => {
    if (!deviceId || Platform.OS !== "android") {
      return;
    }
    const { DeviceModule } = NativeModules;
    if (!DeviceModule?.initPollingService) {
      return;
    }
    
    const apiUrl = Constants.expoConfig?.extra?.API_URL;
    if (!apiUrl) {
      console.error("[DG] FATAL: API_URL no está configurada");
      throw new Error("Falta configurar API_URL");
    }
    
    DeviceModule.initPollingService(deviceId, apiUrl)
      .then(() => console.log("[DG] Native polling service started"))
      .catch((e: any) => console.warn("[DG] initPollingService error:", e));
  }, [deviceId]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (e.data?.action?.payload?.name === "payment-methods") {
        return;
      }
      e.preventDefault();
    });
    return unsub;
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (isUnblockedRef.current) {
        return;
      }
      (async () => {
        try {
          await kioskControl.startKiosk();
        } catch {
          console.warn("Error reactivating kiosk");
        }
      })();
    }, [kioskControl])
  );

  useEffect(() => {
    if (!isReady || !deviceId) {
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      try {
        const status = await provisioningService.checkStatus(deviceId);
        if (!cancelled) {
          setPending(status.pendingAmount);
        }
      } catch {
        console.warn("Unable to fetch pending amount");
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [isReady, deviceId]);

  const handlePayment = () => {
    router.push("/payment-methods");
  };

  return (
    // ... existing JSX ...
  );
}
```

#### 4B. Centralizar Constantes

**Archivo nuevo**: `src/constants/app.constant.ts`

```typescript
export const APP_CONFIG = {
  POLL_INTERVAL_ACTIVE_MS: 30000,
  POLL_INTERVAL_BLOCKED_MS: 300000,
  HTTP_TIMEOUT_MS: 5000,
  CACHE_MAX_AGE_MS: 3600000,
} as const;

export const NAVIGATION_ROUTES = {
  PROVISIONING: '/provisioning',
  LINKING: '/linking',
  LINKING_SUCCESS: '/linking-success',
  LINKING_ERROR: '/linking-error',
  DEVICE_BLOCKED: '/device-blocked',
  PAYMENT_METHODS: '/payment-methods',
} as const;

export const STORAGE_KEYS = {
  DEVICE_ID: 'deviceId',
  API_URL: 'apiUrl',
  IS_LINKED: 'isLinked',
  IS_LOCKED: 'isLocked',
  LOCKDOWN_ACTIVE: 'isFullLockdownActive',
  LAST_KNOWN_STATE: 'lastKnownState',
  LAST_SUCCESSFUL_POLL: 'lastSuccessfulPoll',
} as const;

export const FCM_MESSAGE_TYPES = {
  DEVICE_BLOCKED: 'DEVICE_BLOCKED',
  DEVICE_UNBLOCKED: 'DEVICE_UNBLOCKED',
} as const;
```

#### 4C. Optimizar axios.config.ts

**Archivo**: `src/config/axios.config.ts`

```typescript
import axios, { AxiosError, AxiosInstance } from "axios";
import { API_URL } from "../constants/config.constant";

const clientAxios: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: APP_CONFIG.HTTP_TIMEOUT_MS,
});

clientAxios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    
    if (status !== 404) {
      console.error('[Axios] Error:', {
        url: error.config?.url,
        status,
        message: error.message
      });
    }
    
    return Promise.reject(error);
  }
);

export default clientAxios;
```

---

## 📊 Resultados Esperados

| Métrica | Actual | Optimizado | Mejora |
|---------|--------|------------|--------|
| **Requests/día** | 2880 (30s fijo) | ~300 (FCM + backoff) | -90% |
| **Batería** | Alto consumo | Moderado | -60% |
| **Latencia bloqueo** | 30s promedio | <2s (FCM) | -93% |
| **Latencia desbloqueo** | 30s promedio | <2s (FCM) | -93% |
| **RAM React Native** | ~150MB | ~120MB | -20% |
| **CPU background** | Constante | Intermitente | -70% |
| **Confirmación delivery** | ❌ No | ✅ Sí | Nuevo |

---

## 🎬 Roadmap de Implementación

### Semana 1: FCM Backend
- [ ] Implementar `fcmService` en backend
- [ ] Crear endpoint `PATCH /devices/:id/status`
- [ ] Crear endpoint `POST /device-syncs/ack`
- [ ] Agregar modelo `PendingCommand` en Prisma
- [ ] Tests de envío FCM

### Semana 2: FCM Android Nativo
- [ ] Crear `DeviceGuardFirebaseService.java`
- [ ] Registrar servicio en AndroidManifest.xml
- [ ] Implementar manejo de `DEVICE_BLOCKED`
- [ ] Implementar manejo de `DEVICE_UNBLOCKED`
- [ ] Implementar envío de ACK

### Semana 3: Fallback y Offline
- [ ] Implementar polling adaptativo
- [ ] Implementar caché de última respuesta
- [ ] Implementar backoff exponencial
- [ ] Tests de conectividad intermitente

### Semana 4: Optimizaciones RN
- [ ] Simplificar `device-blocked.tsx`
- [ ] Centralizar constantes
- [ ] Optimizar axios config
- [ ] Limpieza de listeners
- [ ] Testing en dispositivos reales

---

## ⚠️ Consideraciones Importantes

### 1. Testing en Dispositivos Reales
- No confiar solo en emulador
- Probar con pantalla apagada
- Probar con app en background
- Probar reinicios del dispositivo
- Probar sin conexión a internet

### 2. Firebase Configuration
- Verificar `google-services.json` actualizado
- Configurar reglas FCM para data messages
- Monitorear quota FCM (gratis hasta 200M msgs/mes)

### 3. Battery Optimization
- Algunos fabricantes (Xiaomi, Huawei) son más agresivos
- Considerar guías específicas por fabricante
- Pedir al usuario que desactive battery optimization

### 4. Fallback Offline
- Si no hay internet, FCM falla
- Polling detecta cambio cuando recupera conexión
- Caché válida por 1 hora
- ACK pendiente se envía cuando recupera

---

## 🎯 Conclusión

**Arquitectura final**:

1. **FCM como canal principal** para bloqueo/desbloqueo en tiempo real (<2s)
2. **Polling como fallback** para cuando FCM falla o no hay internet
3. **ACK system** para confirmar delivery de comandos
4. **Caché offline** para funcionar sin conexión temporalmente

**Beneficios**:
- ✅ Bloqueo/desbloqueo instantáneo (<2s vs 30s)
- ✅ 90% menos requests al servidor
- ✅ 60% menos consumo de batería
- ✅ Confirmación de delivery
- ✅ Funciona offline temporalmente

**No se requiere separación en microservicios** - la arquitectura con servicios nativos Android es sólida.

---

*Documento creado: Marzo 10, 2026*
*Actualizado: Marzo 11, 2026 (FCM como canal principal)*
*Basado en OPTIMIZATION_PLAN.md de deviceguard-web*

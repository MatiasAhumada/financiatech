# 📋 Plan de Implementación: Sincronización Web ↔ App (DeviceGuard)

> **Fecha de elaboración:** 2026-02-25  
> **Proyectos involucrados:** `deviceguard-web` (Next.js + Prisma + PostgreSQL) · `deviceguard-app` (Expo + React Native + Tamagui)

---

## 🔍 Diagnóstico del Estado Actual

### ✅ Lo que ya existe y funciona

| Componente | Descripción |
|---|---|
| `SaleModal` (web, paso 3) | Muestra el `activationCode` generado en la venta via `ActivationCodeDisplay` |
| `POST /api/device-syncs` | Recibe `{ activationCode, imei }`, crea `DeviceSync` en BD y actualiza el estado del `Device` a `SOLD_SYNCED` |
| `deviceActivationService.activate()` | Lógica completa de activación: valida código, detecta duplicados por IMEI, ejecuta transacción en Prisma |
| `provisioning.tsx` (app) | Pantalla con teclado y input del código — al presionar "Verificar y Vincular" llama `router.push("/linking")` (mock, la llamada real está comentada) |
| `linking.tsx` (app) | Stub con timeout de 10s que redirige automáticamente a `linking-success.tsx` |
| `linking-success.tsx` (app) | Pantalla final con datos hardcodeados (`"Corporativo Global S.A."`, `"DG-7724X-PRO"`) |

### ❌ Lo que falta o está roto

- El `provisioningService` en la app llama a `/api/devices/provision`, endpoint que **no existe** en la web.
- La app no obtiene ni envía el **IMEI real** del dispositivo físico.
- El modal de la web **no detecta** cuándo el celular se vincula (no hay polling ni websocket).
- `linking-success.tsx` tiene un bug: el botón "Finalizar Configuración" navega a `/linking-error` en lugar de finalizar correctamente.
- Los datos en `linking-success.tsx` son todos hardcodeados.

---

## 🗺️ Arquitectura de la Solución

```
[WEB - SaleModal paso 3]                    [APP - provisioning.tsx]
        |                                            |
        |  Polling cada ~3s                          | POST /api/device-syncs
        |  GET /api/device-syncs/status              |  { activationCode, imei }
        |  ?activationCode=XYZ                       |
        |                                            |
        |←────── SOLD_SYNCED detectado ─────────────|
        |                                            |
[Web → cambia a vista Success]           [App → navega a /linking-success
                                           con datos reales del dispositivo]
```

---

## 📦 Datos que la App envía a la Web

Basado en el modelo `DeviceSync` del schema de Prisma:

```json
// REQUEST — POST /api/device-syncs
{
  "activationCode": "ABC123",    // De Sale.activationCode (ingresado por el usuario)
  "imei": "123456789012345"      // IMEI real del dispositivo físico
}
```

```json
// RESPONSE (enriquecida tras la Fase 4)
{
  "success": true,
  "deviceName": "Samsung Galaxy A54",
  "deviceId": "clxxxxx...",
  "adminName": "Negocio XYZ",
  "sync": {
    "id": "clxxxxx...",
    "deviceId": "clxxxxx...",
    "imei": "123456789012345",
    "syncedAt": "2026-02-25T12:00:00.000Z"
  }
}
```

---

## 🚧 Fases de Implementación

---

### ✅ FASE 1 — App: Obtener el IMEI real del dispositivo *(COMPLETADA)*

**Archivos creados:**
- `deviceguard-app/src/hooks/useDeviceImei.ts` ✅

**Descripción:**  
La app necesita un identificador único del dispositivo. Se usa `expo-application` + `expo-device` (paquetes oficiales de Expo, compatibles con SDK 54, ya instalados).  
⚠️ El IMEI real en Android 10+ requiere permisos de sistema que Expo no puede obtener en managed workflow. Se usa `androidId` como identificador estándar.  
Si no se puede obtener el id (ej. emulador sin Google Play), usa `Device.modelName + timestamp` como fallback.

```ts
// src/hooks/useDeviceImei.ts
import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';

export function useDeviceImei() {
  const [imei, setImei] = useState<string | null>(null);

  useEffect(() => {
    DeviceInfo.getImei()
      .then(setImei)
      .catch(async () => {
        // Fallback: usar uniqueId si no hay IMEI disponible (emulador, tablets)
        const uid = await DeviceInfo.getUniqueId();
        setImei(uid);
      });
  }, []);

  return imei;
}
```

> ✅ **No se requieren permisos adicionales** — `androidId` y `identifierForVendor` no requieren `READ_PHONE_STATE`. Funciona en cualquier dispositivo Android 6+.

---

### ✅ FASE 2 — App: Conectar `provisioning.tsx` con la API real *(COMPLETADA)*

**Archivos modificados:**
- `deviceguard-app/src/constants/api.constant.ts` ✅
- `deviceguard-app/src/services/provisioning.service.ts` ✅
- `deviceguard-app/app/provisioning.tsx` ✅
- `deviceguard-app/app/linking-error.tsx` ✅ *(fix bonus: mensaje dinámico + retry a /provisioning)*


**Archivos a modificar:**
- `deviceguard-app/src/services/provisioning.service.ts`
- `deviceguard-app/src/constants/api.constant.ts`
- `deviceguard-app/app/provisioning.tsx`

**Cambios en `api.constant.ts`:**
```ts
export const API_ENDPOINTS = {
  DEVICES: {
    SYNC: '/api/device-syncs',          // ← Endpoint correcto
    STATUS: '/api/device-syncs/status', // ← Nuevo endpoint de polling
  },
} as const;
```

**Cambios en `provisioning.service.ts`:**
```ts
import clientAxios from '@/src/config/axios.config';
import { API_ENDPOINTS } from '@/src/constants/api.constant';

export interface SyncResponse {
  success: boolean;
  deviceName: string;
  deviceId: string;
  adminName: string;
}

export const provisioningService = {
  syncDevice: async (activationCode: string, imei: string): Promise<SyncResponse> => {
    const response = await clientAxios.post<SyncResponse>(
      API_ENDPOINTS.DEVICES.SYNC,
      { activationCode, imei }
    );
    return response.data;
  },
};
```

**Cambios en `provisioning.tsx`:**
- Usar el hook `useDeviceImei()` para obtener el IMEI
- Descomentar y activar la lógica real de verificación
- En caso de **éxito**: navegar a `/linking` y pasar los datos de respuesta como params del router para que luego lleguen a `linking-success.tsx`
- En caso de **error**: navegar a `/linking-error` con el mensaje del servidor

```tsx
const handleVerify = async () => {
  const fullCode = getFullCode();

  if (!validateProvisioningCode(fullCode)) return;
  if (!imei) return; // IMEI no disponible aún

  setIsLoading(true);

  try {
    const result = await provisioningService.syncDevice(fullCode, imei);
    router.push({
      pathname: '/linking',
      params: {
        deviceName: result.deviceName,
        deviceId: result.deviceId,
        adminName: result.adminName,
      },
    });
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Error de vinculación';
    router.push({ pathname: '/linking-error', params: { message } });
  } finally {
    setIsLoading(false);
  }
};
```

---

### ✅ FASE 3 — App: `linking-success.tsx` con datos reales y fix del bug *(COMPLETADA)*

**Archivos modificados:**
- `deviceguard-app/app/linking.tsx` ✅
- `deviceguard-app/app/linking-success.tsx` ✅


**Cambios en `linking.tsx`:**  
Remover el timeout hardcodeado de 10s y pasar los params recibidos hacia `linking-success`:

```tsx
// Recibir params y pasarlos a linking-success
const params = useLocalSearchParams();

useEffect(() => {
  // No hay timeout. La pantalla es solo visual mientras la app se inicializa.
  // La navegación fue disparada desde provisioning.tsx ya con éxito confirmado.
  const timeoutId = setTimeout(() => {
    router.replace({
      pathname: '/linking-success',
      params,
    });
  }, 3000); // Solo la duración de la animación

  return () => clearTimeout(timeoutId);
}, [router]);
```

**Cambios en `linking-success.tsx`:**  
- Recibir `deviceName`, `deviceId`, `adminName` via `useLocalSearchParams()`
- Reemplazar los datos hardcodeados
- **Corregir el bug**: `handleFinish` actualmente navega a `/linking-error` → debe finalizar la sesión correctamente (navegar a `/` o simplemente no hacer nada, dejando la app en este estado)

```tsx
const { deviceName, deviceId, adminName } = useLocalSearchParams<{
  deviceName: string;
  deviceId: string;
  adminName: string;
}>();

const handleFinish = () => {
  // El dispositivo está vinculado. La app queda en esta pantalla
  // o navega a la pantalla principal de dispositivo gestionado.
  router.replace('/'); // o la ruta que corresponda al estado "vinculado"
};
```

Reemplazar el texto de la card:
```tsx
// ORGANIZACIÓN → adminName (dinámico)
// ID DEL DISPOSITIVO → deviceName (dinámico)
```

---

### FASE 4 — Web: Enriquecer la respuesta de activación

**Archivo a modificar:**
- `deviceguard-web/src/server/services/deviceActivation.service.ts`

**Cambios:**  
Incluir el nombre del admin/negocio en la respuesta para que la app pueda mostrarlo en `linking-success.tsx`:

```ts
const sync = await tx.deviceSync.create({
  data: { deviceId: sale.deviceId, imei },
  include: {
    device: {
      include: {
        admin: { include: { user: true } },
      },
    },
  },
});

return {
  success: true,
  deviceName: sale.device.name,
  deviceId: sale.deviceId,
  adminName: sync.device.admin.user.name,
  sync,
};
```

---

### FASE 5 — Web: Nuevo endpoint de status por código de activación

**Archivo a crear:**
- `deviceguard-web/src/app/api/device-syncs/status/route.ts`

Este endpoint es consultado periódicamente por el `ActivationCodeDisplay` de la web para saber si el celular ya se vinculó.

```ts
// GET /api/device-syncs/status?activationCode=XYZ
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DeviceStatus } from '@prisma/client';
import httpStatus from 'http-status';
import apiErrorHandler, { ApiError } from '@/utils/handlers/apiError.handler';

export async function GET(request: NextRequest) {
  try {
    const activationCode = request.nextUrl.searchParams.get('activationCode');

    if (!activationCode) {
      throw new ApiError({ status: httpStatus.BAD_REQUEST, message: 'Código requerido' });
    }

    const sale = await prisma.sale.findUnique({
      where: { activationCode },
      include: { device: true },
    });

    if (!sale) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: 'Código no encontrado' });
    }

    const synced = sale.device.status === DeviceStatus.SOLD_SYNCED;

    return NextResponse.json({
      synced,
      deviceName: sale.device.name,
      deviceId: sale.device.id,
    }, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
```

---

### FASE 6 — Web: Polling + Animación + Success State en `ActivationCodeDisplay`

**Archivo a modificar:**
- `deviceguard-web/src/components/sales/ActivationCodeDisplay.tsx`

Este es el **cambio más visible para el usuario web**. El componente debe:

1. **Estado `waiting`** — Mostrar animación de pulso/spinner alrededor del código + texto "Esperando vinculación..."
2. **Hacer polling** cada 3 segundos a `GET /api/device-syncs/status?activationCode=XYZ`
3. **Estado `success`** — Cuando `synced: true`, mostrar checkmark animado + "¡Dispositivo vinculado!" + nombre del dispositivo

**Lógica de polling:**
```tsx
'use client';

import { useEffect, useState, useRef } from 'react';

type SyncStatus = 'waiting' | 'success';

export function ActivationCodeDisplay({ activationCode }: { activationCode: string }) {
  const [status, setStatus] = useState<SyncStatus>('waiting');
  const [deviceName, setDeviceName] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activationCode) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/device-syncs/status?activationCode=${activationCode}`);
        const data = await res.json();

        if (data.synced) {
          setDeviceName(data.deviceName);
          setStatus('success');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Silencioso, sigue reintentando
      }
    };

    intervalRef.current = setInterval(poll, 3000);
    poll(); // Primera llamada inmediata

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activationCode]);

  if (status === 'success') {
    return <ActivationSuccessView deviceName={deviceName} />;
  }

  return <ActivationWaitingView activationCode={activationCode} />;
}
```

**Vista `waiting`** — El código debe tener un borde animado con pulse/glow en rojo carmesí, y un spinner sutil indicando que está esperando.

**Vista `success`** — Checkmark grande con animación de entrada, texto "¡Dispositivo vinculado exitosamente!" y el nombre del dispositivo.

---

## 📁 Resumen Completo de Archivos

### `deviceguard-web`

| Archivo | Acción | Fase |
|---|---|---|
| `src/app/api/device-syncs/status/route.ts` | ✨ Crear | 5 |
| `src/server/services/deviceActivation.service.ts` | ✏️ Modificar | 4 |
| `src/components/sales/ActivationCodeDisplay.tsx` | ✏️ Modificar | 6 |

### `deviceguard-app`

| Archivo | Acción | Fase |
|---|---|---|
| `src/hooks/useDeviceImei.ts` | ✨ Crear | 1 |
| `src/services/provisioning.service.ts` | ✏️ Modificar | 2 |
| `src/constants/api.constant.ts` | ✏️ Modificar | 2 |
| `app/provisioning.tsx` | ✏️ Modificar | 2 |
| `app/linking.tsx` | ✏️ Modificar | 3 |
| `app/linking-success.tsx` | ✏️ Modificar | 3 |

---

## ⚡ Orden de Ejecución Recomendado

```
FASE 5 → Crear GET /api/device-syncs/status  (base del polling de la web)
   ↓
FASE 4 → Enriquecer respuesta POST /api/device-syncs  (adminName + deviceName)
   ↓
FASE 6 → Polling + animación + success state en ActivationCodeDisplay
   ↓
FASE 1 → Hook useDeviceImei en la app
   ↓
FASE 2 → Conectar provisioning.tsx con la API real
   ↓
FASE 3 → linking-success.tsx con datos reales + fix del bug de router
```

---

## 🧪 Criterios de Aceptación

- [ ] Al llegar al paso 3 del `SaleModal`, la web muestra animación de "Esperando vinculación..." con el código pulsando
- [ ] La app puede leer en IMEI real del dispositivo (o fallback a uniqueId)
- [ ] Al ingresar el código correcto y presionar "Verificar y Vincular", la app llama a `POST /api/device-syncs` con `{ activationCode, imei }`
- [ ] El servidor valida el código, registra el `DeviceSync` y actualiza el `Device` a `SOLD_SYNCED`
- [ ] La web detecta el cambio de estado vía polling en ≤ 3 segundos y muestra la vista de éxito
- [ ] La app navega a `linking-success.tsx` mostrando datos reales (nombre del negocio y dispositivo)
- [ ] El botón "Finalizar Configuración" en la app no navega a `/linking-error` (bug corregido)
- [ ] Ante un código inválido, la app muestra la pantalla `/linking-error` con el mensaje del servidor
- [ ] Un IMEI ya registrado retorna error `409 Conflict` y la app lo maneja correctamente

---

## 📝 Notas Adicionales

- **Permisos Android**: `READ_PHONE_STATE` es necesario para acceder al IMEI. En Android 10+ se requiere `READ_PRIVILEGED_PHONE_STATE` que solo apps del sistema pueden tener — en ese caso, usar `getUniqueId()` como identificador principal.
- **Seguridad**: El endpoint `GET /api/device-syncs/status` no requiere auth ya que solo retorna `synced: boolean`, pero se puede agregar validación básica del formato del código si se desea.
- **Polling vs WebSocket/SSE**: Se eligió polling simple por simplicidad. Si se desea tiempo real más estricto, se puede migrar a Server-Sent Events (SSE) en una iteración futura.
- **`linking.tsx`**: Su rol cambia — deja de ser un stub con timeout y pasa a ser una pantalla de transición visual de ~3s mientras la respuesta de éxito ya fue confirmada por el servidor.

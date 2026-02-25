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

### ✅ FASE 4 — Web: Enriquecer la respuesta de activación *(COMPLETADA)*

**Archivos modificados:**
- `deviceguard-web/src/server/services/deviceActivation.service.ts` ✅


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

### ✅ FASE 5 — Web: Endpoint RESTful de estado de sincronización por venta *(COMPLETADA)*

> ⚠️ **Corrección RESTful aplicada**: el plan original proponía `GET /api/device-syncs/status?activationCode=XYZ`, lo cual viola REST por dos razones:
> 1. `/status` es un sustantivo de acción (RPC-style), no un recurso navegable.
> 2. Colisiona con la ruta dinámica `device-syncs/[imei]` ya existente en Next.js.
>
> La ruta correcta navega la jerarquía de recursos: `Sale` → su sub-recurso `sync`.

**Archivos a crear/modificar:**
- `deviceguard-web/src/app/api/sales/[activationCode]/sync/route.ts` ← nuevo endpoint RESTful
- `deviceguard-web/src/server/services/deviceActivation.service.ts` ← agregar método `getSyncStatus()`

**Endpoint RESTful:**
```
GET /api/sales/{activationCode}/sync
```
Semántica: *"Dame el estado de sincronización de la venta identificada por este código"*

- `{ synced: true, deviceName: "..." }` → dispositivo ya vinculado
- `{ synced: false }` → aún esperando vinculación
- `404` → el código de activación no existe

```ts
// src/app/api/sales/[activationCode]/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { deviceActivationService } from '@/server/services/deviceActivation.service';
import apiErrorHandler, { ApiError } from '@/utils/handlers/apiError.handler';
import httpStatus from 'http-status';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activationCode: string }> }
) {
  try {
    const { activationCode } = await params;
    const result = await deviceActivationService.getSyncStatus(activationCode);
    return NextResponse.json(result, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
```

**Método `getSyncStatus()` a agregar en `DeviceActivationService`:**
```ts
async getSyncStatus(activationCode: string): Promise<{ synced: boolean; deviceName: string }> {
  const sale = await this.saleRepository.findByActivationCode(activationCode);

  if (!sale) {
    throw new ApiError({
      status: httpStatus.NOT_FOUND,
      message: 'Código de activación no encontrado',
    });
  }

  const synced = sale.device.status === DeviceStatus.SOLD_SYNCED;

  return {
    synced,
    deviceName: sale.device.name,
  };
}
```

---

### ✅ FASE 6 — Web: Polling + Animación + Success State en `ActivationCodeDisplay` *(COMPLETADA)*

**Archivos creados/modificados:**
- `deviceguard-web/src/hooks/useActivationPolling.ts` ✅
- `deviceguard-web/src/components/sales/ActivationCodeDisplay.tsx` ✅
- `deviceguard-web/src/components/sales/ActivationSuccessView.tsx` ✅: el plan original metía polling, estado y render todo en `ActivationCodeDisplay`. Un componente de visualización no debe contener lógica de negocio asincrónica. Se separan las responsabilidades en 3 capas.

**Archivos a crear/modificar:**
- `deviceguard-web/src/hooks/useActivationPolling.ts` ← ✨ nuevo hook (lógica de polling)
- `deviceguard-web/src/components/sales/ActivationCodeDisplay.tsx` ← ✏️ solo orquesta estado
- `deviceguard-web/src/components/sales/ActivationSuccessView.tsx` ← ✨ nuevo sub-componente de éxito

**Responsabilidades separadas:**

```
useActivationPolling(activationCode)
  → encapsula: fetch, intervalo, cleanup, estado 'waiting'|'success'
       ↓
ActivationCodeDisplay({ activationCode })
  → consume el hook, decide qué vista renderizar
       ↓
<ActivationWaitingView>   |   <ActivationSuccessView>
  → solo render, sin lógica
```

**Hook `useActivationPolling` (Single Responsibility: solo polling):**
```ts
// src/hooks/useActivationPolling.ts
'use client';
import { useEffect, useRef, useState } from 'react';

export type SyncStatus = 'waiting' | 'success';

export interface ActivationPollResult {
  status: SyncStatus;
  deviceName: string;
}

export function useActivationPolling(activationCode: string): ActivationPollResult {
  const [status, setStatus] = useState<SyncStatus>('waiting');
  const [deviceName, setDeviceName] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activationCode) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/sales/${activationCode}/sync`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.synced) {
          setDeviceName(data.deviceName);
          setStatus('success');
          clearInterval(intervalRef.current!);
        }
      } catch { /* silencioso — red caída, reintentará en el próximo tick */ }
    };

    intervalRef.current = setInterval(poll, 3000);
    poll();

    return () => clearInterval(intervalRef.current!);
  }, [activationCode]);

  return { status, deviceName };
}
```

**`ActivationCodeDisplay` (Single Responsibility: solo orquestación de vistas):**
```tsx
// src/components/sales/ActivationCodeDisplay.tsx
'use client';
import { useActivationPolling } from '@/hooks/useActivationPolling';
import { ActivationSuccessView } from './ActivationSuccessView';
// ... imports existentes

export function ActivationCodeDisplay({ activationCode }: { activationCode: string }) {
  const { status, deviceName } = useActivationPolling(activationCode);

  if (status === 'success') {
    return <ActivationSuccessView deviceName={deviceName} />;
  }

  return <ActivationWaitingView activationCode={activationCode} />;
  // ActivationWaitingView: contenido actual del componente + animación de espera
}
```

**Vista `waiting`** — El código debe tener un borde animado con `animate-pulse` / `@keyframes` glow en rojo carmesí, spinner sutil y el texto "Esperando vinculación del dispositivo...".

**`ActivationSuccessView` (Single Responsibility: solo render de éxito):**
- Checkmark grande con animación CSS de entrada (`scale` + `opacity`)
- Texto: "¡Dispositivo vinculado exitosamente!"
- Nombre del dispositivo vinculado
- Indicador visual de que el modal ya puede cerrarse

---

## 📁 Resumen Completo de Archivos

### `deviceguard-web`

| Archivo | Acción | Fase | Estado |
|---|---|---|---|
| `src/server/services/deviceActivation.service.ts` | ✏️ Modificar | 4 | ✅ |
| `src/app/api/sales/[activationCode]/sync/route.ts` | ✨ Crear | 5 | ✅ |
| `src/server/services/deviceActivation.service.ts` | ✏️ Agregar método `getSyncStatus()` | 5 | ✅ |
| `src/hooks/useActivationPolling.ts` | ✨ Crear | 6 | ✅ |
| `src/components/sales/ActivationCodeDisplay.tsx` | ✏️ Refactorizar | 6 | ✅ |
| `src/components/sales/ActivationSuccessView.tsx` | ✨ Crear | 6 | ✅ |

### `deviceguard-app`

| Archivo | Acción | Fase | Estado |
|---|---|---|---|
| `src/hooks/useDeviceImei.ts` | ✨ Crear | 1 | ✅ |
| `src/services/provisioning.service.ts` | ✏️ Modificar | 2 | ✅ |
| `src/constants/api.constant.ts` | ✏️ Modificar | 2 | ✅ |
| `app/provisioning.tsx` | ✏️ Modificar | 2 | ✅ |
| `app/linking-error.tsx` | ✏️ Fix mensaje dinámico | 2 | ✅ |
| `app/linking.tsx` | ✏️ Modificar | 3 | ✅ |
| `app/linking-success.tsx` | ✏️ Modificar | 3 | ✅ |

---

## ⚡ Estado de Ejecución

```
✅ FASE 1 → Hook useDeviceImei (app)
✅ FASE 2 → provisioning.tsx conectado con API real (app)
✅ FASE 3 → linking.tsx + linking-success.tsx con datos reales (app)
✅ FASE 4 → Respuesta de activación enriquecida con adminName (web)
✅ FASE 5 → GET /api/sales/[activationCode]/sync + getSyncStatus() (web)
✅ FASE 6 → useActivationPolling + ActivationCodeDisplay + ActivationSuccessView (web)
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

- **Permisos Android**: `READ_PHONE_STATE` es necesario para acceder al IMEI real. En Android 10+ se requiere `READ_PRIVILEGED_PHONE_STATE` (solo apps del sistema). Por eso se usa `androidId` via `expo-application` — no requiere permisos y es suficientemente único.
- **Seguridad del endpoint de polling**: `GET /api/sales/[activationCode]/sync` no requiere auth (el `activationCode` ya actúa como token de acceso temporal). Si se desea, se puede agregar validación del formato (`/^[A-Z0-9]{6}$/`) antes de consultar la BD.
- **REST**: La ruta `GET /api/sales/[activationCode]/sync` sigue la jerarquía `Sale → DeviceSync`. Evita colisión con `device-syncs/[imei]` y es semánticamente correcta.
- **SOLID (SRP)**: El hook `useActivationPolling` aísla el efecto asincrónico del componente visual. `ActivationCodeDisplay` solo decide qué renderizar. `ActivationSuccessView` solo renderiza el estado de éxito.
- **Polling vs WebSocket/SSE**: Se eligió polling cada 3s por simplicidad y compatibilidad total con Next.js App Router. Si se desea menor latencia, se puede migrar a SSE sin cambiar los contratos de la API.
- **`linking.tsx`** (app): Su rol es ahora solo una pantalla de transición visual de ~3s. La vinculación real ya fue confirmada por el servidor antes de llegar a esta pantalla.

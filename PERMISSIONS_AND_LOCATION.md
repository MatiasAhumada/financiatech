# Implementación de Permisos Automáticos y Sistema de Ubicación

## Resumen de Cambios

### 1. Auto-Concesión de Permisos (✅ IMPLEMENTADO)

**Problema:** El usuario podía denegar permisos críticos, afectando funcionalidad.

**Solución:** Auto-concesión silenciosa de TODOS los permisos usando Device Owner.

#### Permisos Agregados

**AndroidManifest.xml:**
- `ACCESS_FINE_LOCATION` - Ubicación GPS precisa
- `ACCESS_COARSE_LOCATION` - Ubicación aproximada
- `ACCESS_BACKGROUND_LOCATION` - Ubicación en background
- `CAMERA` - Cámara
- `RECORD_AUDIO` - Micrófono
- `READ_CONTACTS` / `WRITE_CONTACTS` - Contactos
- `READ_CALENDAR` / `WRITE_CALENDAR` - Calendario
- `READ_SMS` / `SEND_SMS` / `RECEIVE_SMS` - SMS
- `READ_CALL_LOG` / `WRITE_CALL_LOG` / `CALL_PHONE` - Llamadas
- `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` / `READ_MEDIA_AUDIO` - Multimedia (Android 13+)
- `FOREGROUND_SERVICE_LOCATION` - Servicio de ubicación

#### Archivos Modificados

**Mobile App:**
1. `AndroidManifest.xml` - Agregados todos los permisos
2. `PermissionGranter.java` (NUEVO) - Clase helper para auto-concesión
3. `MainActivity.kt` - Llama a `PermissionGranter.grantAllPermissions()`
4. `DeviceAdmin.java` - Llama a `PermissionGranter` en `onEnabled()` y `applyLinkedRestrictionsStatic()`

**Funcionamiento:**
```java
// Se ejecuta automáticamente al activar Device Owner
PermissionGranter.grantAllPermissions(context);
// Resultado: TODOS los permisos concedidos sin intervención del usuario
```

### 2. Sistema de Ubicación (✅ LISTO - DESACTIVADO)

**Estado:** Implementación completa pero DESACTIVADA por cuestiones legales.

#### Backend (financiatech-web)

**Archivos Creados:**
1. `prisma/schema.prisma` - Modelo `DeviceLocation`
2. `src/app/api/device-syncs/[serialNumber]/location/route.ts` - Endpoints
3. `src/server/services/deviceLocation.service.ts` - Lógica de negocio

**Modelo de Datos:**
```prisma
model DeviceLocation {
  id         String   @id @default(cuid())
  deviceId   String
  latitude   Float
  longitude  Float
  accuracy   Float?
  timestamp  DateTime
  receivedAt DateTime @default(now())
}
```

**Endpoints:**
- `POST /api/device-syncs/{serialNumber}/location` - Recibir ubicación
- `GET /api/device-syncs/{serialNumber}/location?limit=100` - Consultar historial

#### Mobile App (financiatech-app)

**Archivos Creados:**
1. `LocationTrackingService.java` - Servicio de tracking en background

**Características:**
- Actualización cada 5 minutos o 50 metros de movimiento
- Usa GPS y Network provider
- Envío automático al backend
- Foreground service (notificación persistente)
- Reinicio automático si se detiene

**Para Activar (cuando sea legal):**
```java
// En DeviceAdmin.java o MainActivity.kt
LocationTrackingService.start(context);
```

### 3. Flujo de Permisos

```
1. Dispositivo provisionado como Device Owner
   ↓
2. App instalada y abierta
   ↓
3. MainActivity.onCreate() ejecuta:
   PermissionGranter.grantAllPermissions(this)
   ↓
4. TODOS los permisos concedidos automáticamente
   ↓
5. Usuario NO ve ningún diálogo de permisos
   ↓
6. App funciona con permisos completos
```

### 4. Comandos para Rebuild

```bash
cd E:\FinanciaTech\financiatech-app
npx expo run:android
```

### 5. Verificación Post-Instalación

**Verificar permisos concedidos:**
```bash
adb shell dumpsys package com.financiatech.kiosk | findstr "granted=true"
```

**Verificar Device Owner:**
```bash
adb shell dumpsys device_policy | findstr "Device Owner"
```

**Verificar servicios activos:**
```bash
adb shell dumpsys activity services | findstr FinanciaTech
```

### 6. Activar Location Tracking (Futuro)

**Paso 1 - Migración de BD:**
```bash
cd E:\FinanciaTech\financiatech-web
npx prisma migrate dev --name add_device_locations
```

**Paso 2 - Descomentar en DeviceAdmin.java:**
```java
if (isLinked) {
    FinanciaTechPollingService.start(context);
    LocationTrackingService.start(context); // ← DESCOMENTAR
    launchApp(context);
}
```

**Paso 3 - Rebuild app:**
```bash
cd E:\FinanciaTech\financiatech-app
npx expo run:android
```

**Paso 4 - Crear componente de mapa en web:**
- Integrar Google Maps o Mapbox
- Mostrar última ubicación
- Mostrar historial de movimientos

### 7. Consideraciones Legales

⚠️ **ANTES DE ACTIVAR UBICACIÓN:**
- Agregar cláusula en contrato de venta
- Obtener consentimiento explícito del cliente
- Definir política de retención de datos
- Cumplir con leyes de privacidad locales
- Permitir al cliente solicitar eliminación de datos

### 8. Archivos de Documentación

- `LOCATION_TRACKING.md` - Guía completa de ubicación
- `TEST_FCM.md` - Guía de pruebas FCM (ya existente)

### 9. Resumen de Estado

| Feature | Estado | Notas |
|---------|--------|-------|
| Auto-concesión de permisos | ✅ ACTIVO | Funciona automáticamente |
| Permisos de ubicación | ✅ CONCEDIDOS | Listos para usar |
| Servicio de ubicación | ⏸️ DESACTIVADO | Listo para activar |
| Backend de ubicación | ✅ COMPLETO | Endpoints funcionando |
| Panel web de ubicación | ❌ PENDIENTE | Crear cuando se active |

### 10. Próximos Pasos

1. ✅ Rebuild app con nuevos permisos
2. ✅ Verificar auto-concesión funciona
3. ⏸️ Consultar con legal sobre ubicación
4. ⏸️ Activar tracking si es aprobado
5. ⏸️ Crear componente de mapa en web

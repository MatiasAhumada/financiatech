# Feature Flags - FinanciaTech

## Location Tracking (EXPERIMENTAL)

**Estado:** DESACTIVADO (Pendiente de aprobación legal)

**Descripción:** Sistema de seguimiento de ubicación GPS de dispositivos en tiempo real.

### Implementación Actual

#### Backend (✅ COMPLETO)
- Modelo `DeviceLocation` en Prisma schema
- Endpoint `POST /api/device-syncs/[serialNumber]/location` para recibir ubicaciones
- Endpoint `GET /api/device-syncs/[serialNumber]/location` para consultar historial
- Servicio `deviceLocationService` con métodos:
  - `saveLocation()`: Guardar nueva ubicación
  - `getLocations()`: Obtener historial
  - `getLastLocation()`: Obtener última ubicación conocida
  - `getLocationsByDeviceId()`: Obtener por ID de dispositivo

#### Mobile App (✅ COMPLETO)
- Servicio `LocationTrackingService.java` en background
- Permisos agregados en AndroidManifest:
  - `ACCESS_FINE_LOCATION`
  - `ACCESS_COARSE_LOCATION`
  - `ACCESS_BACKGROUND_LOCATION`
- Auto-concesión de permisos vía `PermissionGranter`
- Actualización cada 5 minutos o 50 metros de movimiento
- Envío automático al backend

### Para Activar (Cuando sea legal)

#### 1. Migración de Base de Datos
```bash
cd E:\FinanciaTech\financiatech-web
npx prisma migrate dev --name add_device_locations
```

#### 2. Iniciar Servicio en la App
Descomentar en `DeviceAdmin.java` o `MainActivity.kt`:
```java
// Iniciar servicio de ubicación cuando el dispositivo esté vinculado
LocationTrackingService.start(context);
```

#### 3. Mostrar en Panel Web
Crear componente en `financiatech-web/src/components/devices/DeviceLocationMap.tsx`:
- Integrar Google Maps o Mapbox
- Mostrar última ubicación conocida
- Mostrar historial de movimientos
- Alertas de geofencing (opcional)

### Consideraciones Legales

⚠️ **IMPORTANTE:** Antes de activar, verificar:
- Consentimiento explícito del cliente en contrato de venta
- Cumplimiento con leyes de privacidad locales
- Política de retención de datos (cuánto tiempo guardar ubicaciones)
- Derecho del cliente a solicitar eliminación de datos
- Transparencia sobre uso de datos de ubicación

### Datos Almacenados

Cada registro de ubicación contiene:
- `latitude`: Latitud GPS
- `longitude`: Longitud GPS
- `accuracy`: Precisión en metros
- `timestamp`: Fecha/hora de la ubicación (del dispositivo)
- `receivedAt`: Fecha/hora de recepción en servidor

### Configuración Actual

```java
// LocationTrackingService.java
UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
MIN_DISTANCE = 50; // 50 metros
```

### Endpoints API

```
POST /api/device-syncs/{serialNumber}/location
Body: {
  "latitude": -34.603722,
  "longitude": -58.381592,
  "accuracy": 10.5,
  "timestamp": "2026-04-19T12:00:00.000Z"
}

GET /api/device-syncs/{serialNumber}/location?limit=100
Response: {
  "success": true,
  "locations": [...]
}
```

### Estado de Implementación

- [x] Permisos en AndroidManifest
- [x] Auto-concesión de permisos
- [x] Servicio de tracking en background
- [x] Modelo de base de datos
- [x] Endpoints API
- [x] Servicio backend
- [ ] Migración de base de datos (ejecutar cuando se active)
- [ ] Iniciar servicio en app (descomentar código)
- [ ] Componente de mapa en panel web
- [ ] Documentación legal y consentimiento

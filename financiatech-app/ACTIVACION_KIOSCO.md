# Guía de Activación: Modo Propietario (Device Owner) y Kiosco

Para que **FinanciaTech** tenga control total del dispositivo, impida su desinstalación, inicie automáticamente tras reinicios y pueda bloquear completamente el equipo, la aplicación debe ser configurada como el **Propietario del Dispositivo (Device Owner)**.

> ⚠️ **IMPORTANTE:** Android **solo permite** establecer un Device Owner si el dispositivo **no tiene ninguna cuenta asociada** (ej. cuentas de Google) configurada en el sistema. Debe hacerse preferentemente en un equipo recién reseteado de fábrica o después de eliminar todas las cuentas manualmente.

## Paso 1: Habilitar Depuración USB
1. En el dispositivo Android, ve a **Ajustes > Acerca del teléfono**.
2. Toca 7 veces sobre **Número de compilación** para activar las Opciones de Desarrollador.
3. Ve a **Ajustes > Sistema > Opciones de Desarrollador**.
4. Activa la **Depuración por USB**.

## Paso 2: Conectar el equipo por ADB
Conecta el dispositivo por cable a la PC. En una terminal (PowerShell o CMD), verifica la conexión:

```powershell
adb devices
```
*Si aparece como `unauthorized`, revisa la pantalla del celular y acepta el prompt de permisos de depuración marcando "Permitir siempre desde esta computadora".*

## Paso 3: Asegurar que no haya cuentas
Asegúrate de que no haya cuentas de Google u otras sincronizadas en el equipo. Puedes comprobar si hay cuentas activas a nivel de sistema ejecutando:

```powershell
adb shell dumpsys account
```
*Si la lista no está vacía, ve a **Ajustes > Cuentas** en el celular y elimínalas todas antes de continuar.*

## Paso 4: Instalar la Aplicación
Instala el APK generado (`app-release.apk`) en el dispositivo usando ADB:

```powershell
adb install -r "E:\FinanciaTech\financiatech-app\android\app\build\outputs\apk\release\app-release.apk"
```

## Paso 5: Activar el Device Owner (Comando Crítico)
Este es el comando clave que eleva los privilegios de la aplicación al máximo nivel, permitiéndole ser inborrable e irremplazable:

```powershell
adb shell dpm set-device-owner com.financiatech.kiosk/.DeviceAdmin
```

**Resultados posibles:**
- ✅ `Success: Device owner set to package com.financiatech.kiosk`: ¡Todo salió bien!
- ❌ `Not allowed to set the device owner because there are already some accounts...`: Tienes cuentas o perfiles creados en el celular. Elimina las cuentas desde los Ajustes e inténtalo de nuevo.

## Paso 6: Verificación
Para confirmar que tu aplicación ahora es Device Owner de forma exitosa, ejecuta:

```powershell
adb shell dpm list-owners
```
*Deberías ver una salida indicando: `1 owner: User 0: admin=com.financiatech.kiosk/.DeviceAdmin,DeviceOwner`*

---

### ¿Qué logra esto?
A partir de este momento, FinanciaTech tiene permisos de super-administrador de seguridad para:
- Trabajar en **Lock Task Mode** (Kiosco duro).
- Ocultar la barra de notificaciones y navegación.
- Bloquear accesos del menú de apagado/reinicio.
- **Evitar desinstalaciones** (el botón "Desinstalar" aparecerá desactivado y gris en los ajustes de Android).
- Impedir que el usuario haga Factory Reset desde los ajustes.
- Ejecutar el Foreground Service persistentemente.

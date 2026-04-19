package com.financiatech.kiosk;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.WindowManager;
import android.provider.Settings;
import android.os.UserManager;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

@ReactModule(name = DeviceModule.NAME)
public class DeviceModule extends ReactContextBaseJavaModule {

    private static final String TAG = "FinanciaTechModule";
    public static final String NAME = "DeviceModule";
    
    // Evento para notificar cambios de estado a React Native
    private static final String EVENT_DEVICE_STATE_CHANGED = "onDeviceStateChanged";
    
    private DevicePolicyManager devicePolicyManager;
    private ComponentName deviceAdmin;
    private final ReactApplicationContext reactContext;

    public DeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.deviceAdmin = new ComponentName(reactContext, DeviceAdmin.class);
    }

    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Emite un evento a React Native cuando el estado del dispositivo cambia.
     * @param context ReactApplicationContext (puede ser null si RN no está listo)
     * @param blocked true si el dispositivo está bloqueado, false si está desbloqueado
     */
    public static void emitDeviceStateChanged(ReactApplicationContext context, boolean blocked) {
        if (context == null) {
            Log.d(TAG, "Cannot emit event - React Native not ready (context is null)");
            return;
        }

        if (!context.hasActiveCatalystInstance()) {
            Log.d(TAG, "Cannot emit event - React Native instance not active");
            return;
        }

        // Enviar evento usando el mecanismo de React Native
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(EVENT_DEVICE_STATE_CHANGED, blocked);
        Log.d(TAG, "Emitted device state change: blocked=" + blocked);
    }
    
    @ReactMethod
    public void getDeviceImei(Promise promise) {
        try {
            String deviceId = null;
            
            if (devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        deviceId = Build.getSerial();
                        if (deviceId != null && !deviceId.isEmpty() && !deviceId.equals("unknown")) {
                            Log.i(TAG, "Serial Number obtenido (Device Owner): " + deviceId);
                            promise.resolve(deviceId);
                            return;
                        }
                    } catch (SecurityException e) {
                        Log.w(TAG, "No se pudo obtener Serial Number: " + e.getMessage());
                    }
                }
            }
            
            android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    deviceId = tm.getImei();
                    if (deviceId != null && !deviceId.isEmpty()) {
                        Log.i(TAG, "IMEI obtenido: " + deviceId);
                        promise.resolve(deviceId);
                        return;
                    }
                } catch (SecurityException e) {
                    Log.w(TAG, "IMEI no accesible: " + e.getMessage());
                }
            } else {
                try {
                    @SuppressWarnings("deprecation")
                    String oldDeviceId = tm.getDeviceId();
                    if (oldDeviceId != null && !oldDeviceId.isEmpty()) {
                        deviceId = oldDeviceId;
                        Log.i(TAG, "Device ID obtenido (legacy): " + deviceId);
                        promise.resolve(deviceId);
                        return;
                    }
                } catch (SecurityException e) {
                    Log.w(TAG, "Device ID no accesible: " + e.getMessage());
                }
            }
            
            String androidId = Settings.Secure.getString(reactContext.getContentResolver(), Settings.Secure.ANDROID_ID);
            Log.w(TAG, "Usando Android ID: " + androidId);
            promise.resolve(androidId);
            
        } catch (Exception e) {
            Log.e(TAG, "Error obteniendo identificador: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void lockDevice() {
        if (devicePolicyManager.isAdminActive(deviceAdmin)) {
            devicePolicyManager.lockNow();
        }
    }

    /**
     * Llamado desde React Native (linking-success) después de vincular.
     * Persiste deviceId y apiUrl en SharedPreferences y arranca el foreground
     * service de polling para que funcione sin que la app esté abierta.
     */
    @ReactMethod
    public void initPollingService(String serialNumber, String apiUrl, Promise promise) {
        try {
            Log.i(TAG, "Vinculando dispositivo con Serial Number: " + serialNumber);
            
            reactContext.getSharedPreferences(FinanciaTechPollingService.PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(FinanciaTechPollingService.KEY_DEVICE_ID, serialNumber)
                .putString(FinanciaTechPollingService.KEY_API_URL, apiUrl)
                .putBoolean(FinanciaTechPollingService.KEY_IS_LINKED, true)
                .apply();

            boolean isDeviceOwner = devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName());
            
            if (isDeviceOwner) {
                try {
                    DeviceAdmin.applyLinkedRestrictions(reactContext);
                } catch (SecurityException e) {
                    Log.e(TAG, "SecurityException aplicando restricciones: " + e.getMessage());
                    promise.reject("SECURITY_ERROR", "No se pudieron aplicar las restricciones de seguridad: " + e.getMessage());
                    return;
                } catch (Exception e) {
                    Log.e(TAG, "Error aplicando restricciones: " + e.getMessage());
                    promise.reject("RESTRICTION_ERROR", "Error al aplicar restricciones: " + e.getMessage());
                    return;
                }
            } else {
                promise.reject("NOT_DEVICE_OWNER", "El dispositivo no es Device Owner. Debe activarse primero desde financiatech-desktop.");
                return;
            }

            try {
                FinanciaTechPollingService.start(reactContext);
            } catch (Exception e) {
                Log.e(TAG, "Error iniciando servicio de polling: " + e.getMessage());
                promise.reject("SERVICE_ERROR", "Error al iniciar servicio de monitoreo: " + e.getMessage());
                return;
            }
            
            Log.i(TAG, "Dispositivo vinculado exitosamente con Serial Number: " + serialNumber);
            promise.resolve("Dispositivo vinculado correctamente");
            
        } catch (Exception e) {
            Log.e(TAG, "Error fatal vinculando dispositivo: " + e.getMessage());
            promise.reject("FATAL_ERROR", "Error fatal al vincular dispositivo: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void startKioskMode() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
                String[] packages = {getReactApplicationContext().getPackageName()};
                devicePolicyManager.setLockTaskPackages(deviceAdmin, packages);
                
                // Bloquear el menú de apagado (global actions dialog) que aparece
                // al presionar el power button. LOCK_TASK_FEATURE_NONE deshabilita
                // TODOS los elementos de sistema en Lock Task Mode, incluido el menú
                // de opciones de reinicio/apagado. Requiere API 28 (Android 9+).
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    devicePolicyManager.setLockTaskFeatures(
                        deviceAdmin,
                        DevicePolicyManager.LOCK_TASK_FEATURE_NONE
                    );
                }
                
                activity.startLockTask();
            } else if (devicePolicyManager.isAdminActive(deviceAdmin)) {
                activity.startLockTask();
            }
            getReactApplicationContext().getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("isLocked", true)
                .putBoolean("isFullLockdownActive", true)
                .apply();
        }
    }
    
    @ReactMethod
    public void stopKioskMode() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.stopLockTask();
            if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
                devicePolicyManager.setLockTaskPackages(deviceAdmin, new String[0]);
                
                // Restaurar las features de Lock Task Mode al salir del kiosk
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    devicePolicyManager.setLockTaskFeatures(
                        deviceAdmin,
                        DevicePolicyManager.LOCK_TASK_FEATURE_SYSTEM_INFO |
                        DevicePolicyManager.LOCK_TASK_FEATURE_KEYGUARD
                    );
                }
            }
        }
        getReactApplicationContext().getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("isLocked", false)
            .putBoolean("isFullLockdownActive", false)
            .apply();
    }
    
    @ReactMethod
    public void setStatusBarDisabled(boolean disabled) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                if (disabled) {
                    activity.getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_FULLSCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                    );
                    activity.getWindow().getDecorView().setSystemUiVisibility(
                        android.view.View.SYSTEM_UI_FLAG_FULLSCREEN |
                        android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );
                } else {
                    activity.getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_FULLSCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                    );
                    activity.getWindow().getDecorView().setSystemUiVisibility(0);
                }
            });
        }
    }
    
    @ReactMethod
    public void enableDeviceAdmin(Promise promise) {
        try {
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdmin);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, 
                "FinanciaTech requiere permisos de administrador para garantizar el pago");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            getReactApplicationContext().startActivity(intent);
            promise.resolve("Device admin activation started");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void isDeviceAdminActive(Promise promise) {
        boolean isActive = devicePolicyManager.isAdminActive(deviceAdmin);
        promise.resolve(isActive);
    }
    
    @ReactMethod
    public void isDeviceOwnerActive(Promise promise) {
        boolean isDeviceOwner = devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName());
        promise.resolve(isDeviceOwner);
    }
    
    @ReactMethod
    public void getDeviceStatus(Promise promise) {
        try {
            boolean isDeviceOwner = devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName());
            boolean isDeviceAdmin = devicePolicyManager.isAdminActive(deviceAdmin);
            
            promise.resolve(new java.util.HashMap<String, Object>() {{
                put("isDeviceOwner", isDeviceOwner);
                put("isDeviceAdmin", isDeviceAdmin);
                put("sdkVersion", Build.VERSION.SDK_INT);
            }});
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void preventUninstall() {
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            devicePolicyManager.setUninstallBlocked(deviceAdmin, 
                getReactApplicationContext().getPackageName(), true);
        }
    }
    
    @ReactMethod
    public void enableKioskRestrictions() {
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            devicePolicyManager.setUninstallBlocked(deviceAdmin, 
                getReactApplicationContext().getPackageName(), true);
            
            devicePolicyManager.setKeyguardDisabled(deviceAdmin, true);
            
            String[] packages = {getReactApplicationContext().getPackageName()};
            devicePolicyManager.setLockTaskPackages(deviceAdmin, packages);
            
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_FACTORY_RESET);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_SAFE_BOOT);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_ADD_USER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_REMOVE_USER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_DEBUGGING_FEATURES);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_USB_FILE_TRANSFER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_MODIFY_ACCOUNTS);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_WIFI);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_NETWORK_RESET);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_AIRPLANE_MODE);
        }
    }
    
    /**
     * Activa el bloqueo completo del dispositivo (modo kiosk con Device Owner).
     * Solo funciona si la app es Device Owner.
     */
    @ReactMethod
    public void activateFullLockdown(Promise promise) {
        try {
            if (!devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
                promise.reject("NOT_DEVICE_OWNER", "Esta app no es Device Owner");
                return;
            }
            
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.reject("ERROR", "Activity no disponible");
                return;
            }
            
            // Aplicar todas las restricciones de kiosk
            applyFullRestrictions();
            
            // Iniciar kiosk mode
            activity.startLockTask();
            
            // Guardar estado
            reactContext.getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("isFullLockdownActive", true)
                .apply();
            
            Log.i(TAG, "Full lockdown activated");
            promise.resolve("Bloqueo completo activado");
        } catch (Exception e) {
            Log.e(TAG, "Error activating fullLockdown", e);
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Desactiva el bloqueo completo del dispositivo.
     * Requiere que el admin/propietario lo llame o que sea desde la app.
     */
    @ReactMethod
    public void deactivateFullLockdown(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                activity.stopLockTask();
            }
            
            if (devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
                removeFullRestrictions();
            }
            
            reactContext.getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("isFullLockdownActive", false)
                .apply();
            
            Log.i(TAG, "Full lockdown deactivated");
            promise.resolve("Bloqueo completo desactivado");
        } catch (Exception e) {
            Log.e(TAG, "Error deactivating fullLockdown", e);
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Aplica todas las restricciones de Device Owner para kiosk mode completo.
     * Solo funciona si la app es Device Owner.
     */
    private void applyFullRestrictions() {
        if (!devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
            Log.w(TAG, "App is not Device Owner, cannot apply full restrictions");
            return;
        }
        
        try {
            String packageName = reactContext.getPackageName();
            
            // Deshabilitar desinstalación
            devicePolicyManager.setUninstallBlocked(deviceAdmin, packageName, true);
            
            // Deshabilitar pantalla de bloqueo
            devicePolicyManager.setKeyguardDisabled(deviceAdmin, true);
            
            // Configurar esta app como la única permitida en lock task mode
            String[] lockedPackages = {packageName};
            devicePolicyManager.setLockTaskPackages(deviceAdmin, lockedPackages);
            
            // Aplicar restricciones de usuario exclusivas para cuando está bloqueado
            // Nota: FACTORY_RESET y SAFE_BOOT ya se aplicaron de forma permanente en DeviceAdmin / OnEnabled
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_ADD_USER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_REMOVE_USER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_DEBUGGING_FEATURES);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_USB_FILE_TRANSFER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_MODIFY_ACCOUNTS);
            // NO restringir WiFi ni redes móviles: el dispositivo NECESITA
            // conectividad para recibir la señal de desbloqueo desde la web.
            // devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_WIFI);
            // devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            // devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_NETWORK_RESET);
            // devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_AIRPLANE_MODE);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_SYSTEM_ERROR_DIALOGS);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CREATE_WINDOWS);
            }
            
            // Deshabilitar barra de estado
            devicePolicyManager.setStatusBarDisabled(deviceAdmin, true);
            
            // Configurar ajustes globales
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.STAY_ON_WHILE_PLUGGED_IN, "7");
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.ADB_ENABLED, "0");
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, "0");
            
            Log.i(TAG, "Full restrictions applied successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error applying full restrictions", e);
        }
    }
    
    /**
     * Remueve las restricciones de Device Owner.
     * Solo funciona si la app es Device Owner.
     */
    private void removeFullRestrictions() {
        if (!devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
            Log.w(TAG, "App is not Device Owner, cannot remove full restrictions");
            return;
        }
        
        try {
            String packageName = reactContext.getPackageName();
            
            // Re-habilitar pantalla de bloqueo
            devicePolicyManager.setKeyguardDisabled(deviceAdmin, false);
            
            // Limpiar lock task packages
            devicePolicyManager.setLockTaskPackages(deviceAdmin, new String[0]);
            
            // NO Removemos las restricciones de Device Owner permanentes de seguridad:
            // devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_FACTORY_RESET);
            // devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_SAFE_BOOT);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_ADD_USER);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_REMOVE_USER);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_DEBUGGING_FEATURES);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_USB_FILE_TRANSFER);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_MODIFY_ACCOUNTS);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_SYSTEM_ERROR_DIALOGS);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_CREATE_WINDOWS);
            }
            
            // Re-habilitar barra de estado
            devicePolicyManager.setStatusBarDisabled(deviceAdmin, false);
            
            Log.i(TAG, "Full restrictions removed successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error removing full restrictions", e);
        }
    }
    
    @ReactMethod
    public void disableSystemSettings() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Settings.ACTION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                } catch (Exception e) {
                }
            });
        }
    }
    
    @ReactMethod
    public void getInitialIntent(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                Intent intent = activity.getIntent();
                if (intent != null) {
                    String navigateTo = intent.getStringExtra("navigate_to");
                    boolean unlocked = intent.getBooleanExtra("unlocked", false);
                    
                    java.util.HashMap<String, Object> result = new java.util.HashMap<>();
                    result.put("navigate_to", navigateTo);
                    result.put("unlocked", unlocked);
                    
                    Log.i(TAG, "Initial intent extras: navigate_to=" + navigateTo + ", unlocked=" + unlocked);
                    promise.resolve(result);
                    return;
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error getting initial intent", e);
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void restartApp() {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                Intent intent = reactContext.getPackageManager()
                    .getLaunchIntentForPackage(reactContext.getPackageName());
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.finish();
                    reactContext.startActivity(intent);
                    System.exit(0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error restarting app", e);
        }
    }
}

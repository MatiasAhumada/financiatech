package com.deviceguard.kiosk;

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

public class DeviceModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "DeviceGuardModule";
    private DevicePolicyManager devicePolicyManager;
    private ComponentName deviceAdmin;
    private ReactApplicationContext reactContext;
    
    public DeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.deviceAdmin = new ComponentName(reactContext, DeviceAdmin.class);
    }
    
    @Override
    public String getName() {
        return "DeviceModule";
    }
    
    @ReactMethod
    public void lockDevice() {
        if (devicePolicyManager.isAdminActive(deviceAdmin)) {
            devicePolicyManager.lockNow();
        }
    }
    
    @ReactMethod
    public void startKioskMode() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
                String[] packages = {getReactApplicationContext().getPackageName()};
                devicePolicyManager.setLockTaskPackages(deviceAdmin, packages);
                activity.startLockTask();
                
                getReactApplicationContext().getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean("isLocked", true)
                    .apply();
            } else if (devicePolicyManager.isAdminActive(deviceAdmin)) {
                activity.startLockTask();
            }
        }
    }
    
    @ReactMethod
    public void stopKioskMode() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.stopLockTask();
            if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
                devicePolicyManager.setLockTaskPackages(deviceAdmin, new String[0]);
            }
            
            getReactApplicationContext().getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("isLocked", false)
                .apply();
        }
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
                "DeviceGuard requiere permisos de administrador para garantizar el pago");
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
            reactContext.getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
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
            
            reactContext.getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
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
            
            // Aplicar restricciones de usuario (solo en Device Owner)
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
            
            // Remover restricciones de usuario
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_FACTORY_RESET);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_SAFE_BOOT);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_ADD_USER);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_REMOVE_USER);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_DEBUGGING_FEATURES);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_USB_FILE_TRANSFER);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_MODIFY_ACCOUNTS);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_WIFI);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_NETWORK_RESET);
            devicePolicyManager.clearUserRestriction(deviceAdmin, UserManager.DISALLOW_AIRPLANE_MODE);
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
            
            devicePolicyManager.setStatusBarDisabled(deviceAdmin, true);
            
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.STAY_ON_WHILE_PLUGGED_IN, "7");
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.ADB_ENABLED, "0");
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, "0");
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
}

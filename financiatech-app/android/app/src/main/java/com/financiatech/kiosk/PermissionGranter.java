package com.financiatech.kiosk;

import android.Manifest;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import android.util.Log;

public class PermissionGranter {
    
    private static final String TAG = "PermissionGranter";
    
    private static final String[] RUNTIME_PERMISSIONS = {
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.POST_NOTIFICATIONS,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.ACCESS_BACKGROUND_LOCATION,
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.WRITE_CONTACTS,
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR,
        Manifest.permission.READ_SMS,
        Manifest.permission.SEND_SMS,
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.WRITE_CALL_LOG,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
    };
    
    private static final String[] ANDROID_13_PERMISSIONS = {
        Manifest.permission.READ_MEDIA_IMAGES,
        Manifest.permission.READ_MEDIA_VIDEO,
        Manifest.permission.READ_MEDIA_AUDIO,
    };
    
    public static void grantAllPermissions(Context context) {
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(context, DeviceAdmin.class);
        
        if (dpm == null) {
            Log.e(TAG, "DevicePolicyManager is null");
            return;
        }
        
        if (!dpm.isDeviceOwnerApp(context.getPackageName())) {
            Log.w(TAG, "App is not Device Owner - cannot grant permissions");
            return;
        }
        
        int granted = 0;
        int failed = 0;
        
        for (String permission : RUNTIME_PERMISSIONS) {
            if (grantPermission(dpm, adminComponent, context.getPackageName(), permission)) {
                granted++;
            } else {
                failed++;
            }
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            for (String permission : ANDROID_13_PERMISSIONS) {
                if (grantPermission(dpm, adminComponent, context.getPackageName(), permission)) {
                    granted++;
                } else {
                    failed++;
                }
            }
        }
        
        Log.i(TAG, "Permission grant complete: " + granted + " granted, " + failed + " failed");
    }
    
    private static boolean grantPermission(DevicePolicyManager dpm, ComponentName admin, String packageName, String permission) {
        try {
            dpm.setPermissionGrantState(
                admin,
                packageName,
                permission,
                DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
            );
            Log.d(TAG, "Granted: " + permission);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Failed to grant " + permission + ": " + e.getMessage());
            return false;
        }
    }
}

package com.deviceguard.kiosk;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.PowerManager;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
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

            deactivateKioskMode();

            new Thread(() -> {
                fetchDeviceDataAndNavigate(imei);
            }).start();
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

            OutputStream os = conn.getOutputStream();
            os.write(jsonBody.getBytes());
            os.flush();
            os.close();

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
                Log.i(TAG, "Kiosk mode deactivated successfully");
            } catch (Exception e) {
                Log.e(TAG, "Error disabling kiosk: " + e.getMessage());
            }
        }
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

    private void fetchDeviceDataAndNavigate(String imei) {
        SharedPreferences prefs = getSharedPreferences(
            DeviceGuardPollingService.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String apiUrl = prefs.getString(DeviceGuardPollingService.KEY_API_URL, null);

        if (apiUrl == null) {
            Log.e(TAG, "API URL not found, cannot fetch device data");
            navigateToUnblockedScreenFallback();
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
                java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(conn.getInputStream())
                );
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();
                conn.disconnect();

                String response = sb.toString();
                String deviceName = extractJsonValue(response, "deviceName");
                String adminName = extractJsonValue(response, "adminName");

                navigateToUnblockedScreen(deviceName, adminName, imei);
            } else {
                Log.w(TAG, "Failed to fetch device data: HTTP " + responseCode);
                conn.disconnect();
                navigateToUnblockedScreenFallback();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error fetching device data: " + e.getMessage());
            navigateToUnblockedScreenFallback();
        }
    }

    private String extractJsonValue(String json, String key) {
        try {
            String searchKey = "\"" + key + "\":";
            int startIndex = json.indexOf(searchKey);
            if (startIndex == -1) return "";
            
            startIndex += searchKey.length();
            while (startIndex < json.length() && (json.charAt(startIndex) == ' ' || json.charAt(startIndex) == '\"')) {
                startIndex++;
            }
            
            int endIndex = startIndex;
            while (endIndex < json.length() && json.charAt(endIndex) != '\"' && json.charAt(endIndex) != ',') {
                endIndex++;
            }
            
            return json.substring(startIndex, endIndex);
        } catch (Exception e) {
            return "";
        }
    }

    private void navigateToUnblockedScreen(String deviceName, String adminName, String deviceId) {
        SharedPreferences prefs = getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean("isLinked", true)
             .putBoolean("isLocked", false)
             .putBoolean("isFullLockdownActive", false)
             .apply();

        Log.i(TAG, "Navigating to linking-success with device data");
        
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            @SuppressWarnings("deprecation")
            PowerManager.WakeLock wl = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "DeviceGuard::UnblockWakeLock"
            );
            wl.acquire(3000);
        }

        try {
            String encodedDeviceName = java.net.URLEncoder.encode(deviceName, "UTF-8");
            String encodedAdminName = java.net.URLEncoder.encode(adminName, "UTF-8");
            String encodedDeviceId = java.net.URLEncoder.encode(deviceId, "UTF-8");
            
            String deepLink = String.format(
                "deviceguardapp://linking-success?unlocked=true&deviceName=%s&adminName=%s&deviceId=%s",
                encodedDeviceName,
                encodedAdminName,
                encodedDeviceId
            );
            
            Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(deepLink));
            intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TASK
            );
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error encoding URL parameters: " + e.getMessage());
            navigateToUnblockedScreenFallback();
        }
    }

    private void navigateToUnblockedScreenFallback() {
        Log.w(TAG, "Using fallback navigation without device data");
        
        SharedPreferences prefs = getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean("isLinked", true)
             .putBoolean("isLocked", false)
             .putBoolean("isFullLockdownActive", false)
             .apply();

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TASK
        );
        intent.putExtra("unlocked", true);
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

            OutputStream os = conn.getOutputStream();
            os.write(jsonBody.getBytes());
            os.flush();
            os.close();

            conn.disconnect();

        } catch (Exception e) {
            Log.e(TAG, "Error sending FCM token: " + e.getMessage());
        }
    }
}

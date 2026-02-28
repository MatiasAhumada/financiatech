package com.deviceguard.kiosk;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Foreground Service que mantiene el polling al servidor aunque la app esté
 * cerrada. Detecta cambios de estado (bloqueado/desbloqueado) y activa o
 * desactiva el modo kiosk sin necesidad de que el usuario abra la app.
 *
 * Ciclo de vida:
 *  - Arranca cuando la app termina la vinculación (llamado desde DeviceModule)
 *  - Arranca en BOOT_COMPLETED via DeviceAdmin si el dispositivo ya estaba vinculado
 *  - Se mantiene vivo con START_STICKY (Android lo reinicia si lo mata)
 */
public class DeviceGuardPollingService extends Service {

    private static final String TAG = "DGPollingService";
    private static final String CHANNEL_ID = "deviceguard_polling";
    private static final int NOTIFICATION_ID = 1001;
    private static final long POLL_INTERVAL_MS = 5000; // 5 segundos

    static final String PREFS_NAME = "DeviceGuardPrefs";
    static final String KEY_DEVICE_ID = "deviceId";
    static final String KEY_API_URL = "apiUrl";
    static final String KEY_IS_LINKED = "isLinked";
    static final String KEY_IS_LOCKED = "isLocked";
    static final String KEY_LOCKDOWN_ACTIVE = "isFullLockdownActive";

    private Handler handler;
    private boolean lastKnownBlocked = false;

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            pollServer();
            handler.postDelayed(this, POLL_INTERVAL_MS);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Ciclo de vida del Service
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Verificar que el dispositivo esté vinculado antes de hacer polling
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isLinked = prefs.getBoolean(KEY_IS_LINKED, false);

        if (!isLinked) {
            Log.d(TAG, "Device not linked yet, stopping service.");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Inicializar el último estado conocido de bloqueo desde SharedPreferences
        lastKnownBlocked = prefs.getBoolean(KEY_IS_LOCKED, false);

        // Promover al servicio a foreground (Android exige una notificación)
        startForeground(NOTIFICATION_ID, buildNotification());

        // Iniciar el polling
        handler.removeCallbacks(pollRunnable);
        handler.post(pollRunnable);

        Log.i(TAG, "Polling service started. lastKnownBlocked=" + lastKnownBlocked);
        return START_STICKY; // Android reinicia el servicio si lo mata
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(pollRunnable);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Polling
    // ─────────────────────────────────────────────────────────────────────

    private void pollServer() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String deviceId = prefs.getString(KEY_DEVICE_ID, null);
        String apiUrl = prefs.getString(KEY_API_URL, null);

        if (deviceId == null || apiUrl == null) {
            Log.w(TAG, "Missing deviceId or apiUrl, skipping poll.");
            return;
        }

        try {
            // GET /api/device-syncs/{deviceId}
            String endpoint = apiUrl + "/api/device-syncs/" + deviceId;
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                Log.w(TAG, "Poll returned HTTP " + responseCode);
                conn.disconnect();
                return;
            }

            // Leer respuesta JSON manualmente (sin librería externa)
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            conn.disconnect();

            String body = sb.toString();
            // Parseo simple: buscar "blocked":true o "blocked":false
            boolean isBlocked = body.contains("\"blocked\":true");

            Log.d(TAG, "Poll result — blocked=" + isBlocked + " lastKnown=" + lastKnownBlocked);

            if (isBlocked && !lastKnownBlocked) {
                // Transición: libre → bloqueado
                lastKnownBlocked = true;
                onDeviceBlocked();
            } else if (!isBlocked && lastKnownBlocked) {
                // Transición: bloqueado → libre
                lastKnownBlocked = false;
                onDeviceUnblocked();
            }

        } catch (Exception e) {
            Log.w(TAG, "Poll failed (network?): " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Acciones al cambiar el estado
    // ─────────────────────────────────────────────────────────────────────

    private void onDeviceBlocked() {
        Log.i(TAG, "Device BLOCKED — activating kiosk");

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean(KEY_IS_LOCKED, true)
             .putBoolean(KEY_LOCKDOWN_ACTIVE, true)
             .apply();

        // Activar Lock Task via DevicePolicyManager
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName admin = new ComponentName(this, DeviceAdmin.class);

        if (dpm.isDeviceOwnerApp(getPackageName())) {
            try {
                String[] packages = {getPackageName()};
                dpm.setLockTaskPackages(admin, packages);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
                }
                dpm.setKeyguardDisabled(admin, true);
            } catch (Exception e) {
                Log.e(TAG, "Error setting lock task packages: " + e.getMessage());
            }
        }

        // Abrir la app en la pantalla de bloqueo
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("navigate_to", "device-blocked");
        startActivity(intent);
    }

    private void onDeviceUnblocked() {
        Log.i(TAG, "Device UNBLOCKED — deactivating kiosk");

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean(KEY_IS_LOCKED, false)
             .putBoolean(KEY_LOCKDOWN_ACTIVE, false)
             .apply();

        // El kiosk se detiene desde la app (device-blocked detecta blocked=false
        // via su propio polling y llama stopKiosk + navega a linking-success).
        // Aquí solo actualizamos la SharedPreference para que MainActivity
        // deje de bloquear los botones de hardware.
    }

    // ─────────────────────────────────────────────────────────────────────
    // Notificación silenciosa (requerida por Android para foreground service)
    // ─────────────────────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "DeviceGuard",
                    NotificationManager.IMPORTANCE_MIN // sin sonido ni popup
            );
            channel.setDescription("Monitoreo de seguridad en segundo plano");
            channel.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("DeviceGuard")
                .setContentText("Protección activa")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)     // no se puede descartar
                .setPriority(Notification.PRIORITY_MIN)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helper estático para iniciar/detener el servicio desde otros lugares
    // ─────────────────────────────────────────────────────────────────────

    public static void start(Context context) {
        Intent intent = new Intent(context, DeviceGuardPollingService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, DeviceGuardPollingService.class));
    }
}

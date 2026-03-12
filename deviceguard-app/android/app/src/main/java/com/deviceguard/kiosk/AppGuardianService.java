package com.deviceguard.kiosk;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

/**
 * Servicio guardián simple que asegura que la app SIEMPRE se reabra
 * cuando se cierra desde recent apps, incluso antes de vincular el dispositivo.
 * 
 * Este servicio es más ligero que PersistentService y solo se encarga de
 * reabrir la app cuando el usuario intenta cerrarla.
 */
public class AppGuardianService extends Service {

    private static final String TAG = "AppGuardianService";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "AppGuardianService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "AppGuardianService started");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.w(TAG, "AppGuardianService destroyed");
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.w(TAG, "Task removed. Reopening app...");

        // Despertar pantalla
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            @SuppressWarnings("deprecation")
            PowerManager.WakeLock wl = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "DeviceGuard::AppGuardianWakeLock"
            );
            wl.acquire(2000);
        }

        // Reabrir la app
        Intent launchIntent = getPackageManager()
                .getLaunchIntentForPackage(getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            startActivity(launchIntent);
            Log.i(TAG, "App relaunched after task removal");
        }

        super.onTaskRemoved(rootIntent);
    }

    public static void start(Context context) {
        Intent intent = new Intent(context, AppGuardianService.class);
        context.startService(intent);
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, AppGuardianService.class));
    }
}

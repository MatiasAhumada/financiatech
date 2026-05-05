package com.financiatech.kiosk;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class FinanciaTechFirebaseService extends FirebaseMessagingService {
    
    private static final String TAG = "FTFirebaseService";
    private static final String CHANNEL_ID = "financiatech_alerts";
    
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());
        Log.d(TAG, "Message ID: " + remoteMessage.getMessageId());
        Log.d(TAG, "Message priority: " + remoteMessage.getPriority());
        
        // Siempre procesar data (ahora contiene title y body)
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            handleDataMessage(remoteMessage.getData());
        }
        
        // Mantener compatibilidad con notificaciones antiguas que usan notification
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message notification body: " + remoteMessage.getNotification().getBody());
            showNotification(
                remoteMessage.getNotification().getTitle(),
                remoteMessage.getNotification().getBody()
            );
        }
    }
    
    private void handleDataMessage(Map<String, String> data) {
        String action = data.get("action");
        String type = data.get("type");
        
        Log.d(TAG, "Handling data message - action: " + action + ", type: " + type);
        
        if ("block_device".equals(action) || "DEVICE_BLOCKED".equals(type)) {
            Log.i(TAG, "Received BLOCK command via Firebase");
            blockDevice();
        } else if ("unblock_device".equals(action) || "DEVICE_UNBLOCKED".equals(type)) {
            Log.i(TAG, "Received UNBLOCK command via Firebase");
            unblockDevice();
        }
        
        String title = data.get("title");
        String body = data.get("body");
        if (title != null && body != null) {
            showNotification(title, body);
        }
    }
    
    private void blockDevice() {
        Log.i(TAG, "Executing blockDevice()");
        
        SharedPreferences prefs = getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean("isLocked", true)
             .putBoolean("isFullLockdownActive", true)
             .apply();
        
        Log.d(TAG, "Preferences updated - isLocked: true");
        
        DeviceAdmin.applyFullRestrictions(getApplicationContext());
        DeviceAdmin.startKioskMode(getApplicationContext());
        
        Log.d(TAG, "Restrictions applied, starting MainActivity");
        
        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        intent.putExtra("navigate_to", "device-blocked");
        startActivity(intent);
        
        showNotification(
            "Dispositivo Bloqueado",
            "Tu dispositivo ha sido bloqueado por falta de pago"
        );
        
        Log.i(TAG, "Block device completed");
    }
    
    private void unblockDevice() {
        Log.i(TAG, "Executing unblockDevice()");
        
        SharedPreferences prefs = getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean("isLocked", false)
             .putBoolean("isFullLockdownActive", false)
             .apply();
        
        Log.d(TAG, "Preferences updated - isLocked: false");
        
        DeviceAdmin.stopKioskMode(getApplicationContext());
        
        Log.d(TAG, "Kiosk mode stopped, starting MainActivity");
        
        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        intent.putExtra("unlocked", true);
        intent.putExtra("navigate_to", "linking-success");
        startActivity(intent);
        
        showNotification(
            "Dispositivo Desbloqueado",
            "Tu dispositivo ha sido desbloqueado. ¡Gracias por tu pago!"
        );
        
        Log.i(TAG, "Unblock device completed");
    }
    
    private void showNotification(String title, String body) {
        createNotificationChannel();
        
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(new long[]{0, 500, 200, 500})
            .setTimeoutAfter(10000)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body));
        
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(0, notificationBuilder.build());
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Alertas FinanciaTech",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notificaciones importantes sobre el estado de tu dispositivo");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            channel.setShowBadge(true);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM token: " + token);
        
        SharedPreferences prefs = getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE);
        prefs.edit().putString("fcmToken", token).apply();
        
        sendTokenToServer(token);
    }
    
    private void sendTokenToServer(String token) {
        Log.d(TAG, "TODO: Send token to server: " + token);
    }
}

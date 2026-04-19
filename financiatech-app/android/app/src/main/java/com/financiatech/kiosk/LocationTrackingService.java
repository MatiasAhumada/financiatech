package com.financiatech.kiosk;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class LocationTrackingService extends Service implements LocationListener {
    
    private static final String TAG = "LocationTracking";
    private static final String CHANNEL_ID = "location_tracking";
    private static final int NOTIFICATION_ID = 3;
    private static final long UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
    private static final float MIN_DISTANCE = 50; // 50 metros
    
    private LocationManager locationManager;
    private boolean isTracking = false;
    
    public static void start(Context context) {
        Intent intent = new Intent(context, LocationTrackingService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }
    
    public static void stop(Context context) {
        Intent intent = new Intent(context, LocationTrackingService.class);
        context.stopService(intent);
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        Log.i(TAG, "LocationTrackingService created");
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!isTracking) {
            startLocationTracking();
        }
        return START_STICKY;
    }
    
    private void startLocationTracking() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "Location permission not granted");
            return;
        }
        
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) {
            Log.e(TAG, "LocationManager is null");
            return;
        }
        
        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                UPDATE_INTERVAL,
                MIN_DISTANCE,
                this
            );
            
            locationManager.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                UPDATE_INTERVAL,
                MIN_DISTANCE,
                this
            );
            
            isTracking = true;
            Log.i(TAG, "Location tracking started");
            
            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastKnown == null) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            if (lastKnown != null) {
                sendLocationToServer(lastKnown);
            }
            
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception starting location tracking", e);
        }
    }
    
    @Override
    public void onLocationChanged(Location location) {
        Log.i(TAG, "Location changed: " + location.getLatitude() + ", " + location.getLongitude());
        sendLocationToServer(location);
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "Provider status changed: " + provider + " status: " + status);
    }
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.i(TAG, "Provider enabled: " + provider);
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.w(TAG, "Provider disabled: " + provider);
    }
    
    private void sendLocationToServer(Location location) {
        SharedPreferences prefs = getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE);
        String serialNumber = prefs.getString(FinanciaTechPollingService.KEY_DEVICE_ID, null);
        String apiUrl = prefs.getString(FinanciaTechPollingService.KEY_API_URL, null);
        
        if (serialNumber == null || apiUrl == null) {
            Log.w(TAG, "Device not linked, skipping location update");
            return;
        }
        
        new Thread(() -> {
            try {
                URL url = new URL(apiUrl + "/api/device-syncs/" + serialNumber + "/location");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                
                String jsonPayload = String.format(
                    "{\"latitude\":%f,\"longitude\":%f,\"accuracy\":%f,\"timestamp\":\"%s\"}",
                    location.getLatitude(),
                    location.getLongitude(),
                    location.getAccuracy(),
                    new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new java.util.Date(location.getTime()))
                );
                
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }
                
                int responseCode = conn.getResponseCode();
                if (responseCode == 200 || responseCode == 201) {
                    Log.i(TAG, "Location sent successfully");
                } else {
                    Log.w(TAG, "Failed to send location: " + responseCode);
                }
                
                conn.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "Error sending location to server", e);
            }
        }).start();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Seguimiento de Ubicación",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Servicio de seguimiento de ubicación del dispositivo");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FinanciaTech")
            .setContentText("Servicio de ubicación activo")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (locationManager != null && isTracking) {
            locationManager.removeUpdates(this);
            isTracking = false;
        }
        Log.i(TAG, "LocationTrackingService destroyed");
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

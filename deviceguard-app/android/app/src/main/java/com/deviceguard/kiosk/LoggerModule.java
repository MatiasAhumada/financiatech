package com.deviceguard.kiosk;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = LoggerModule.NAME)
public class LoggerModule extends ReactContextBaseJavaModule {

    public static final String NAME = "LoggerModule";
    private static final String TAG = "DeviceGuardJS";

    public LoggerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void log(String tag, String message) {
        Log.d(tag, message);
    }

    @ReactMethod
    public void info(String tag, String message) {
        Log.i(tag, message);
    }

    @ReactMethod
    public void warn(String tag, String message) {
        Log.w(tag, message);
    }

    @ReactMethod
    public void error(String tag, String message) {
        Log.e(tag, message);
    }
}

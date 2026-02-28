package com.deviceguard.kiosk
import expo.modules.splashscreen.SplashScreenManager

import android.app.ActivityManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.content.Context

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

  private var powerPressCount = 0
  private val powerHandler = Handler(Looper.getMainLooper())
  private val powerResetRunnable = Runnable { powerPressCount = 0 }

  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              super.invokeDefaultOnBackPressed()
          }
          return
      }
      super.invokeDefaultOnBackPressed()
  }

  /**
   * Verifica si el Lock Task Mode está activo consultando directamente
   * el ActivityManager de Android — más confiable que SharedPreferences.
   * Disponible desde API 23 (Android 6.0).
   */
  private fun isKioskActive(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      am.isInLockTaskMode
    } else {
      // Fallback para API < 23 (muy improbable en dispositivos modernos)
      val prefs = getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
      prefs.getBoolean("isFullLockdownActive", false)
    }
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (!isKioskActive()) return super.onKeyDown(keyCode, event)

    return when (keyCode) {
      KeyEvent.KEYCODE_VOLUME_UP,
      KeyEvent.KEYCODE_VOLUME_DOWN,
      KeyEvent.KEYCODE_VOLUME_MUTE -> true  // consumido

      KeyEvent.KEYCODE_POWER -> {
        powerPressCount++
        powerHandler.removeCallbacks(powerResetRunnable)
        powerHandler.postDelayed(powerResetRunnable, 1500)
        true  // consumido — bloquea menú de apagado en press corto
      }

      KeyEvent.KEYCODE_APP_SWITCH,
      KeyEvent.KEYCODE_HOME,
      KeyEvent.KEYCODE_MENU -> true  // doble seguro (Lock Task Mode ya los bloquea)

      else -> super.onKeyDown(keyCode, event)
    }
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
    if (!isKioskActive()) return super.onKeyUp(keyCode, event)

    return when (keyCode) {
      KeyEvent.KEYCODE_VOLUME_UP,
      KeyEvent.KEYCODE_VOLUME_DOWN,
      KeyEvent.KEYCODE_VOLUME_MUTE,
      KeyEvent.KEYCODE_POWER,
      KeyEvent.KEYCODE_APP_SWITCH,
      KeyEvent.KEYCODE_HOME,
      KeyEvent.KEYCODE_MENU -> true

      else -> super.onKeyUp(keyCode, event)
    }
  }

  override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
    if (!isKioskActive()) return super.onKeyLongPress(keyCode, event)

    return when (keyCode) {
      KeyEvent.KEYCODE_POWER,
      KeyEvent.KEYCODE_VOLUME_DOWN,
      KeyEvent.KEYCODE_VOLUME_UP -> true

      else -> super.onKeyLongPress(keyCode, event)
    }
  }
}

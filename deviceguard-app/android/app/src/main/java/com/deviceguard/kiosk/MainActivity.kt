package com.deviceguard.kiosk
import expo.modules.splashscreen.SplashScreenManager

import android.app.ActivityManager
import android.app.KeyguardManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.content.Context
import android.content.SharedPreferences

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

  private var powerPressCount = 0
  private val powerHandler = Handler(Looper.getMainLooper())
  private val powerResetRunnable = Runnable { powerPressCount = 0 }
  private lateinit var prefs: SharedPreferences

  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    super.onCreate(null)

    prefs = getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)

    // Asegurar que la app pueda encender la pantalla y mostrarse sobre el bloqueo
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        keyguardManager.requestDismissKeyguard(this, null)
    } else {
        @Suppress("DEPRECATION")
        window.addFlags(
            android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )
    }

    // 🛡️ REFUERZO: Asegurarnos de que el bloqueo de Reseteo de Fábrica
    // se aplique incondicionalmente cada vez que la app está abierta,
    // por si el perfil de Device Owner se re-asignó sin pasar por onEnabled().
    try {
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
        val adminComponent = android.content.ComponentName(this, DeviceAdmin::class.java)
        if (dpm.isDeviceOwnerApp(packageName)) {
            dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_FACTORY_RESET)
            dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_SAFE_BOOT)
            android.util.Log.i("MainActivity", "Factory Reset restrictions strictly enforced on launch.")
        }
    } catch (e: Exception) {
        android.util.Log.e("MainActivity", "Failed to force restrictions", e)
    }

    // 🛡️ ACTIVAR KIOSK MODE si el dispositivo está bloqueado
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)

    // Iniciar el servicio guardián que reabre la app si se cierra
    try {
      AppGuardianService.start(this)
      android.util.Log.i("MainActivity", "AppGuardianService started")
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "Failed to start AppGuardianService", e)
    }

    // Verificar si venimos de un desbloqueo
    val unlocked = intent?.getBooleanExtra("unlocked", false) ?: false
    if (unlocked) {
      android.util.Log.i("MainActivity", "Device unlocked from server - allowing normal navigation")
    }

    if (isLinked && isLocked && !unlocked) {
        DeviceAdmin.startKioskMode(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                startLockTask()
                android.util.Log.i("MainActivity", "Kiosk mode activated via startLockTask()")
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to start lock task", e)
            }
        }
    }
  }

  override fun onResume() {
    super.onResume()

    // Verificar si debemos activar kiosk mode al volver a la app
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)

    // Verificar si venimos de un desbloqueo (navegación desde el servicio)
    val unlocked = intent?.getStringExtra("unlocked")?.toBoolean() ?: false
    if (unlocked) {
      // El servidor desbloqueó el dispositivo - NO activar kiosk mode
      android.util.Log.i("MainActivity", "Device unlocked from server - allowing normal navigation")
      intent.removeExtra("unlocked")
      return
    }

    if (isLinked && isLocked) {
        // Siempre activar kiosk mode cuando está bloqueado
        DeviceAdmin.startKioskMode(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                // Verificar si ya está en lock task mode
                if (!isKioskActive()) {
                    startLockTask()
                    android.util.Log.i("MainActivity", "Lock Task STARTED in onResume")
                } else {
                    android.util.Log.d("MainActivity", "Lock Task already active")
                }
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to start lock task in onResume", e)
            }
        }
    }
  }

  override fun onPause() {
    super.onPause()
    
    // Mantener kiosk mode activo incluso cuando la app está en pausa
    val isLocked = prefs.getBoolean("isLocked", false)
    if (isLocked && !isKioskActive()) {
        DeviceAdmin.startKioskMode(this)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                startLockTask()
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to restart lock task in onPause", e)
            }
        }
    }
  }

  override fun onStop() {
    super.onStop()
    
    // Si está bloqueado, asegurar que kiosk mode persista
    val isLocked = prefs.getBoolean("isLocked", false)
    if (isLocked) {
        // No hacer nada - Lock Task Mode previene que la app se minimice
        // Si el usuario intenta cerrar desde recent apps, onTaskRemoved se encarga
        android.util.Log.i("MainActivity", "App stopped but kiosk mode active")
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    powerHandler.removeCallbacks(powerResetRunnable)
  }

  /**
   * Previene que la actividad se cierre cuando el dispositivo está bloqueado.
   * Esto bloquea el botón "X" en recent apps y el swipe para cerrar.
   */
  override fun finish() {
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)
    
    if (isLinked && isLocked) {
      // No permitir que la actividad se cierre cuando está bloqueado
      android.util.Log.i("MainActivity", "Blocked finish() call - device is locked")
      return
    }
    super.finish()
  }

  /**
   * Previene que el usuario deje la actividad cuando está bloqueado.
   * Se llama cuando el usuario intenta salir de la app (botón home, recent apps, etc.)
   */
  override fun onUserLeaveHint() {
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)
    
    if (isLinked && isLocked) {
      // Traer la app al frente inmediatamente
      android.util.Log.i("MainActivity", "Blocked user leave - bringing app to front")
      val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
      if (launchIntent != null) {
        launchIntent.addFlags(
          android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
          android.content.Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
        )
        startActivity(launchIntent)
      }
    }
    super.onUserLeaveHint()
  }

  /**
   * Previene que la actividad se pause cuando está bloqueado.
   */
  override fun onUserInteraction() {
    super.onUserInteraction()
    
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)
    
    // Si está bloqueado, asegurar que Lock Task Mode esté activo
    if (isLinked && isLocked && !isKioskActive()) {
      android.util.Log.i("MainActivity", "User interaction detected - reactivating kiosk mode")
      DeviceAdmin.startKioskMode(this)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        try {
          startLockTask()
        } catch (e: Exception) {
          android.util.Log.e("MainActivity", "Failed to start lock task on interaction", e)
        }
      }
    }
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

  // Evita que el botón de retroceso minimice o cierre la app
  override fun onBackPressed() {
      // No hacemos nada para bloquear el botón "Atrás"
  }

  override fun invokeDefaultOnBackPressed() {
      // Tampoco invocamos el comportamiento por defecto
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

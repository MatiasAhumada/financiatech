package com.financiatech.kiosk
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
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)

    prefs = getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE)

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

    // 🛡️ REFUERZO: Aplicar restricciones básicas SIEMPRE que seamos Device Owner
    // Esto previene factory reset y desinstalación incluso antes de vincular
    try {
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
        val adminComponent = android.content.ComponentName(this, DeviceAdmin::class.java)
        if (dpm.isDeviceOwnerApp(packageName)) {
            // Auto-conceder permiso READ_PHONE_STATE para acceder a Serial Number e IMEI
            try {
                dpm.setPermissionGrantState(
                    adminComponent,
                    packageName,
                    android.Manifest.permission.READ_PHONE_STATE,
                    android.app.admin.DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                )
                android.util.Log.i("MainActivity", "READ_PHONE_STATE permission auto-granted")
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to grant READ_PHONE_STATE permission", e)
            }
            
            // Auto-conceder permiso POST_NOTIFICATIONS para enviar notificaciones (Android 13+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                try {
                    dpm.setPermissionGrantState(
                        adminComponent,
                        packageName,
                        android.Manifest.permission.POST_NOTIFICATIONS,
                        android.app.admin.DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                    )
                    android.util.Log.i("MainActivity", "POST_NOTIFICATIONS permission auto-granted")
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "Failed to grant POST_NOTIFICATIONS permission", e)
                }
            }
            
            dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_FACTORY_RESET)
            dpm.setUninstallBlocked(adminComponent, packageName, true)
            dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_SAFE_BOOT)
            android.util.Log.i("MainActivity", "Basic restrictions enforced (no factory reset, no uninstall, no safe boot)")
            
            PermissionGranter.grantAllPermissions(this)
            android.util.Log.i("MainActivity", "All permissions auto-granted")
        }
    } catch (e: Exception) {
        android.util.Log.e("MainActivity", "Failed to force basic restrictions", e)
    }

    // 🛡️ ACTIVAR KIOSK MODE si el dispositivo está bloqueado
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)

    // Iniciar el servicio guardián SIEMPRE (incluso antes de vincular)
    try {
      AppGuardianService.start(this)
      android.util.Log.i("MainActivity", "AppGuardianService started")
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "Failed to start AppGuardianService", e)
    }

    // Verificar si venimos de un desbloqueo
    val unlocked = intent?.getBooleanExtra("unlocked", false) ?: false
    if (unlocked) {
      android.util.Log.i("MainActivity", "Device unlocked from server - stopping kiosk and navigating")
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && isKioskActive()) {
        try {
          stopLockTask()
          android.util.Log.i("MainActivity", "Lock task stopped for unlock")
        } catch (e: Exception) {
          android.util.Log.e("MainActivity", "Failed to stop lock task", e)
        }
      }
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

    // Verificar si venimos de un desbloqueo PRIMERO
    val unlocked = intent?.getBooleanExtra("unlocked", false) ?: false
    if (unlocked) {
      android.util.Log.i("MainActivity", "Device unlocked - clearing intent and allowing navigation")
      intent.removeExtra("unlocked")
      
      // Asegurar que el kiosk mode esté desactivado
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && isKioskActive()) {
        try {
          stopLockTask()
          android.util.Log.i("MainActivity", "Lock task stopped in onResume for unlock")
        } catch (e: Exception) {
          android.util.Log.e("MainActivity", "Failed to stop lock task in onResume", e)
        }
      }
      return
    }

    // Verificar si debemos activar kiosk mode al volver a la app
    val isLocked = prefs.getBoolean("isLocked", false)
    val isLinked = prefs.getBoolean("isLinked", false)

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
      val prefs = getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE)
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

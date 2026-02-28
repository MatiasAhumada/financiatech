import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { DeviceModule } = NativeModules;

export interface DeviceStatus {
  isDeviceOwner: boolean;
  isDeviceAdmin: boolean;
  sdkVersion: number;
}

export interface KioskControlHandle {
  startKiosk: () => Promise<void>;
  stopKiosk: () => Promise<void>;
  disableStatusBar: () => Promise<void>;
  enableStatusBar: () => Promise<void>;
  isDeviceAdminActive: () => Promise<boolean>;
  isDeviceOwnerActive: () => Promise<boolean>;
  getDeviceStatus: () => Promise<DeviceStatus | null>;
  activateFullLockdown: () => Promise<string>;
  deactivateFullLockdown: () => Promise<string>;
}

export interface KioskModeOptions {
  /**
   * Si es true, llama stopKioskMode al desmontar el componente.
   * Por defecto es FALSE para evitar que la navegación entre pantallas
   * kiosk (device-blocked ↔ payment-methods) desactive el bloqueo.
   * Solo pasar true si explícitamente querés desactivar el kiosk al salir.
   */
  stopOnUnmount?: boolean;
}

/**
 * Hook para controlar el modo kiosco en Android.
 * Soporta tanto Device Admin como Device Owner.
 * Solo funciona en Android.
 *
 * @param enabled - Si true, activa el kiosk al montarse
 * @param options - { stopOnUnmount: false } por defecto — no detiene el kiosk
 *                  al navegar entre pantallas del flujo bloqueado
 */
export function useKioskMode(
  enabled: boolean = true,
  options: KioskModeOptions = { stopOnUnmount: false }
): KioskControlHandle {
  const { stopOnUnmount = false } = options;

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;

    (async () => {
      try {
        if (DeviceModule) {
          await DeviceModule.startKioskMode();
          await DeviceModule.setStatusBarDisabled(true);
        }
      } catch (error) {
        console.warn('Error starting kiosk mode:', error);
      }
    })();

    // Solo detener el kiosk al desmontar si se pide explícitamente.
    // En el flujo device-blocked ↔ payment-methods, stopOnUnmount debe
    // ser false para que el Lock Task Mode no se interrumpa entre pantallas.
    if (!stopOnUnmount) return;

    return () => {
      (async () => {
        try {
          if (DeviceModule) {
            await DeviceModule.setStatusBarDisabled(false);
            await DeviceModule.stopKioskMode();
          }
        } catch (error) {
          console.warn('Error stopping kiosk mode:', error);
        }
      })();
    };
  }, [enabled, stopOnUnmount]);

  return {
    startKiosk: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        await DeviceModule.startKioskMode();
        await DeviceModule.setStatusBarDisabled(true);
      }
    },
    stopKiosk: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        await DeviceModule.setStatusBarDisabled(false);
        await DeviceModule.stopKioskMode();
      }
    },
    disableStatusBar: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        await DeviceModule.setStatusBarDisabled(true);
      }
    },
    enableStatusBar: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        await DeviceModule.setStatusBarDisabled(false);
      }
    },
    isDeviceAdminActive: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        return await DeviceModule.isDeviceAdminActive();
      }
      return false;
    },
    isDeviceOwnerActive: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        return await DeviceModule.isDeviceOwnerActive();
      }
      return false;
    },
    getDeviceStatus: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        return await DeviceModule.getDeviceStatus();
      }
      return null;
    },
    activateFullLockdown: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        return await DeviceModule.activateFullLockdown();
      }
      return 'No disponible en esta plataforma';
    },
    deactivateFullLockdown: async () => {
      if (Platform.OS === 'android' && DeviceModule) {
        return await DeviceModule.deactivateFullLockdown();
      }
      return 'No disponible en esta plataforma';
    },
  };
}

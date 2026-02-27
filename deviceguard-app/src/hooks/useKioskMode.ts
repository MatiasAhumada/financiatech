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

/**
 * Hook para controlar el modo kiosco en Android.
 * Soporta tanto Device Admin como Device Owner.
 * Solo funciona en Android.
 */
export function useKioskMode(enabled: boolean = true): KioskControlHandle {
  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;

    let isActive = true;

    (async () => {
      try {
        if (DeviceModule) {
          // Activar modo kiosco
          await DeviceModule.startKioskMode();
          // Desactivar barra de estado para máxima seguridad
          await DeviceModule.setStatusBarDisabled(true);
        }
      } catch (error) {
        console.warn('Error starting kiosk mode:', error);
      }
    })();

    // Cleanup: desactivar al desmontar o cuando enabled sea false
    return () => {
      if (!isActive) return;
      isActive = false;
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
  }, [enabled]);

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

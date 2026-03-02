import { useEffect, useState } from 'react';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform, NativeModules } from 'react-native';

const { DeviceModule } = NativeModules;

export interface DeviceIdentity {
  /** Identificador único del dispositivo usado como "IMEI" en el sistema.
   *  - Android: androidId (único por app + dispositivo, no requiere permisos)
   *  - iOS: identifierForVendor
   *  Nota: el IMEI real requiere permisos de sistema en Android 10+ que Expo
   *  no puede obtener en modo managed. androidId es el estándar recomendado. */
  deviceId: string | null;
  /** Modelo del dispositivo, ej: "Samsung Galaxy A54" */
  deviceModel: string | null;
  /** Indica si el identificador ya fue resuelto (evita renders con null) */
  isReady: boolean;
}

export function useDeviceImei(): DeviceIdentity {
  const [identity, setIdentity] = useState<DeviceIdentity>({
    deviceId: null,
    deviceModel: null,
    isReady: false,
  });

  useEffect(() => {
    async function resolveDeviceIdentity() {
      try {
        let deviceId: string | null = null;

        if (Platform.OS === 'android') {
          // Intentar obtener el IMEI real desde nuestro módulo nativo (Requiere permisos o ser Device Owner)
          if (DeviceModule && DeviceModule.getDeviceImei) {
            try {
              const imei = await DeviceModule.getDeviceImei();
              if (imei) {
                deviceId = imei;
              }
            } catch (err) {
              console.warn('Error al obtener el IMEI real de Android:', err);
            }
          }

          // Fallback al androidId si no se pudo obtener el IMEI
          if (!deviceId) {
            deviceId = Application.getAndroidId();
          }
        } else if (Platform.OS === 'ios') {
          // identifierForVendor: único por (app vendor, dispositivo).
          deviceId = await Application.getIosIdForVendorAsync();
        }

        // Fallback: si por alguna razón no se obtiene el id (emulador sin Google)
        if (!deviceId) {
          deviceId = `${Device.modelName ?? 'unknown'}-${Date.now()}`;
        }

        const deviceModel =
          Device.modelName ??
          Device.deviceName ??
          'Dispositivo desconocido';

        setIdentity({ deviceId, deviceModel, isReady: true });
      } catch (error) {
        // En el peor caso usamos un fallback temporal para no bloquear al usuario
        const fallback = `device-${Platform.OS}-${Date.now()}`;
        setIdentity({
          deviceId: fallback,
          deviceModel: Device.modelName ?? 'Dispositivo desconocido',
          isReady: true,
        });
      }
    }

    resolveDeviceIdentity();
  }, []);

  return identity;
}

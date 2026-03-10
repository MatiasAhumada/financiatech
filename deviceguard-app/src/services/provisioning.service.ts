import clientAxios from '@/src/config/axios.config';
import { API_ENDPOINTS } from '@/src/constants/api.constant';

/**
 * Respuesta del servidor al vincular exitosamente un dispositivo.
 * Ver: POST /api/device-syncs en deviceguard-web
 */
export interface SyncDeviceResponse {
  success: boolean;
  /** Nombre del dispositivo registrado en la venta (ej: "Samsung Galaxy A54") */
  deviceName: string;
  /** ID interno del dispositivo en la BD */
  deviceId: string;
  /** Nombre del admin/negocio propietario del dispositivo */
  adminName: string;
}

export const provisioningService = {
  /**
   * Vincula este dispositivo físico con la venta registrada en la web.
   * @param activationCode Código de 6 caracteres ingresado por el usuario
   * @param deviceId Identificador único del dispositivo (androidId o IDFV)
   * @param fcmToken Token de Firebase Cloud Messaging para notificaciones push
   */
  syncDevice: async (
    activationCode: string,
    deviceId: string,
    fcmToken?: string
  ): Promise<SyncDeviceResponse> => {
    const response = await clientAxios.post<SyncDeviceResponse>(
      API_ENDPOINTS.DEVICES.SYNC,
      { activationCode, imei: deviceId, fcmToken }
    );
    return response.data;
  },

  /**
   * Consulta el estado actual del dispositivo (bloqueado/activo) junto al monto
   * pendiente si existe.
   */
  checkStatus: async (deviceId: string): Promise<{
    blocked: boolean;
    status: string;
    message: string;
    pendingAmount: number;
    deviceName?: string;
    adminName?: string;
  }> => {
    const response = await clientAxios.get<{
      blocked: boolean;
      status: string;
      message: string;
      pendingAmount: number;
      deviceName?: string;
      adminName?: string;
    }>(API_ENDPOINTS.DEVICES.CHECK_STATUS(deviceId));
    return response.data;
  },
};

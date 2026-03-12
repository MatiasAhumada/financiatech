import clientAxios from '@/src/config/axios.config';
import { API_ENDPOINTS } from '@/src/constants/api.constant';
import { API_URL } from '@/src/constants/config.constant';
import { logger } from '@/src/utils/logger.util';

export interface SyncDeviceResponse {
  success: boolean;
  deviceName: string;
  deviceId: string;
  imei: string;
  adminName: string;
}

export const provisioningService = {
  syncDevice: async (
    activationCode: string,
    deviceId: string,
    fcmToken?: string
  ): Promise<SyncDeviceResponse> => {
    logger.info('PROVISIONING', '========== SYNC DEVICE START ==========');
    logger.info('PROVISIONING', `API_URL: ${API_URL}`);
    logger.info('PROVISIONING', `Endpoint: ${API_ENDPOINTS.DEVICES.SYNC}`);
    logger.info('PROVISIONING', `Full URL: ${API_URL}${API_ENDPOINTS.DEVICES.SYNC}`);
    logger.info('PROVISIONING', `Activation Code: ${activationCode}`);
    logger.info('PROVISIONING', `IMEI: ${deviceId}`);
    logger.info('PROVISIONING', `FCM Token: ${fcmToken ? 'YES' : 'NO'}`);

    try {
      const response = await clientAxios.post<SyncDeviceResponse>(
        API_ENDPOINTS.DEVICES.SYNC,
        { activationCode, imei: deviceId, fcmToken }
      );
      logger.info('PROVISIONING', 'Sync successful!');
      logger.info('PROVISIONING', `Response: ${JSON.stringify(response.data)}`);
      logger.info('PROVISIONING', '========== SYNC DEVICE END ==========');
      return response.data;
    } catch (error: any) {
      logger.error('PROVISIONING', '========== SYNC DEVICE ERROR ==========');
      logger.error('PROVISIONING', `Status: ${error.response?.status}`);
      logger.error('PROVISIONING', `Status Text: ${error.response?.statusText}`);
      logger.error('PROVISIONING', `Message: ${error.message}`);
      logger.error('PROVISIONING', `URL: ${error.config?.url}`);
      logger.error('PROVISIONING', `Base URL: ${error.config?.baseURL}`);
      logger.error('PROVISIONING', `Full URL: ${error.config?.baseURL}${error.config?.url}`);
      logger.error('PROVISIONING', `Data: ${JSON.stringify(error.response?.data)}`);
      logger.error('PROVISIONING', '========================================');
      throw error;
    }
  },

  checkStatus: async (deviceId: string): Promise<{
    blocked: boolean;
    status: string;
    message: string;
    pendingAmount: number;
    deviceName?: string;
    adminName?: string;
  }> => {
    logger.info('PROVISIONING', `Calling checkStatus for device: ${deviceId}`);
    
    try {
      const response = await clientAxios.get<{
        blocked: boolean;
        status: string;
        message: string;
        pendingAmount: number;
        deviceName?: string;
        adminName?: string;
      }>(API_ENDPOINTS.DEVICES.CHECK_STATUS(deviceId));
      
      logger.info('PROVISIONING', `Status check result: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      logger.error('PROVISIONING', `Status check failed: ${error.response?.status} - ${error.message}`);
      throw error;
    }
  },
};

export const API_ENDPOINTS = {
  DEVICES: {
    SYNC: '/api/device-syncs',           // POST — vincula dispositivo con código de activación
    SYNC_STATUS: '/api/device-syncs/status', // GET — consulta estado de vinculación (usado por la web)
    CHECK_STATUS: (imei: string) => `/api/device-syncs/${imei}`, // GET — estado bloqueado/pago para este IMEI
  },
} as const;

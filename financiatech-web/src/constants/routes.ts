export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CLIENTS: "/clients",
  DEVICES: "/devices",
  USERS: "/users",
  REPORTS: "/reports",
} as const;

export const ROUTE_LABELS: Record<string, string> = {
  "": "Inicio",
  login: "Iniciar Sesión",
  devices: "Dispositivos",
  users: "Usuarios",
  reports: "Reportes",
} as const;

export const API_ROUTES = {
  AUTH: {
    SESSION: "/api/session",
    REGISTER: "/api/users",
  },
  ADMINS: "/api/admins",
  ADMINS_STATS: "/api/admins/stats",
  CLIENTS: "/api/clients",
  DEVICES: "/api/devices",
  USERS: "/api/users",
  REPORTS: "/api/reports",
  FINANCING_PLANS: "/api/financing-plans",
  SALES: "/api/sales",
  DEVICE_SYNCS: {
    ACTIVATE: "/api/device-syncs",
    FCM_TOKEN: "/api/device-syncs/fcm-token",
    SYNC_STATUS: (activationCode: string) =>
      `/api/sales/${activationCode}/sync`,
    MULTI_SYNC_STATUS: (activationCode: string) =>
      `/api/sales/${activationCode}/multi-sync`,
  },
} as const;

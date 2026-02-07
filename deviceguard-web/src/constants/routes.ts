export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
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
  DEVICES: "/api/devices",
  USERS: "/api/users",
  REPORTS: "/api/reports",
} as const;

export const ROUTES = {
  HOME: "/",
  DEVICES: "/devices",
  USERS: "/users",
  REPORTS: "/reports",
} as const;

export const ROUTE_LABELS: Record<string, string> = {
  "": "Inicio",
  devices: "Dispositivos",
  users: "Usuarios", 
  reports: "Reportes",
} as const;

export const API_ROUTES = {
  DEVICES: "/api/devices",
  USERS: "/api/users",
  REPORTS: "/api/reports",
} as const;
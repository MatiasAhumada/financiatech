import { UserRole } from "@prisma/client";

export const MODULES = {
  DASHBOARD: "dashboard",
  ORGANIZATIONS: "organizations",
  ADMINS: "admins",
  PLANS: "plans",
  LOGS: "logs",
  SETTINGS: "settings",
} as const;

export const MODULE_PERMISSIONS: Record<string, UserRole[]> = {
  [MODULES.DASHBOARD]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [MODULES.ORGANIZATIONS]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [MODULES.ADMINS]: [UserRole.SUPER_ADMIN],
  [MODULES.PLANS]: [UserRole.SUPER_ADMIN],
  [MODULES.LOGS]: [UserRole.SUPER_ADMIN],
  [MODULES.SETTINGS]: [UserRole.SUPER_ADMIN],
};

export const ROUTES_BY_ROLE = {
  [UserRole.SUPER_ADMIN]: [
    {
      path: "/",
      label: "Dashboard Global",
      icon: "LayoutDashboard",
      module: MODULES.DASHBOARD,
    },
    {
      path: "/organizations",
      label: "Organizaciones",
      icon: "Building2",
      module: MODULES.ORGANIZATIONS,
    },
    {
      path: "/admins",
      label: "Gestión de Admins",
      icon: "Users",
      module: MODULES.ADMINS,
    },
    {
      path: "/plans",
      label: "Planes y Suscripciones",
      icon: "CreditCard",
      module: MODULES.PLANS,
    },
    {
      path: "/logs",
      label: "Logs Globales",
      icon: "FileText",
      module: MODULES.LOGS,
    },
    {
      path: "/settings",
      label: "Configuración Maestra",
      icon: "Settings",
      module: MODULES.SETTINGS,
    },
  ],
  [UserRole.ADMIN]: [
    {
      path: "/",
      label: "Dashboard",
      icon: "LayoutDashboard",
      module: MODULES.DASHBOARD,
    },
    {
      path: "/clients",
      label: "Clientes",
      icon: "Users",
      module: MODULES.ORGANIZATIONS,
    },
  ],
} as const;

export function hasModuleAccess(userRole: UserRole, module: string): boolean {
  return MODULE_PERMISSIONS[module]?.includes(userRole) ?? false;
}

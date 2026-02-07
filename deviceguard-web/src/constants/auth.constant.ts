export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || "default-secret-key",
  JWT_EXPIRES_IN: "7d",
  BCRYPT_SALT_ROUNDS: 10,
  TOKEN_COOKIE_NAME: "auth_token",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: "Inicio de sesión exitoso",
  LOGOUT_SUCCESS: "Sesión cerrada exitosamente",
  INVALID_CREDENTIALS: "Credenciales inválidas",
  USER_NOT_FOUND: "Usuario no encontrado",
  EMAIL_ALREADY_EXISTS: "El email ya está registrado",
  UNAUTHORIZED: "No autorizado",
  TOKEN_EXPIRED: "Token expirado",
  TOKEN_INVALID: "Token inválido",
  INSUFFICIENT_PERMISSIONS: "Permisos insuficientes",
} as const;

export const PERMISSIONS = {
  SUPER_ADMIN: {
    CREATE_ADMIN: true,
    DELETE_ADMIN: true,
    VIEW_ALL_ADMINS: true,
    MANAGE_SYSTEM: true,
  },
  ADMIN: {
    CREATE_CLIENT: true,
    UPDATE_CLIENT: true,
    DELETE_CLIENT: true,
    CREATE_DEVICE: true,
    UPDATE_DEVICE: true,
    DELETE_DEVICE: true,
    VIEW_OWN_DATA: true,
  },
} as const;

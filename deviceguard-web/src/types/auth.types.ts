import { UserRole, User as PrismaUser } from "@prisma/client";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  superAdminId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  superAdminId?: string;
  adminId?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  superAdminId?: string;
  adminId?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export type { PrismaUser };

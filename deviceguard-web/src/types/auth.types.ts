import { UserRole, User, Prisma } from "@prisma/client";

export type { User, UserRole };

export type LoginDto = Pick<User, "email" | "password">;
export type RegisterDto = Prisma.UserCreateInput & { superAdminId?: string };

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

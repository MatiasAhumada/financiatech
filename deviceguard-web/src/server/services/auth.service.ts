import { AuthRepository } from "../repository/auth.repository";
import { bcryptUtils } from "@/utils/bcrypt.util";
import { jwtUtils } from "@/utils/jwt.util";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { AUTH_MESSAGES } from "@/constants/auth.constant";
import { LoginDto, RegisterDto, AuthResponse, AuthUser } from "@/types/auth.types";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(data.email);

    if (!user) {
      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const isPasswordValid = await bcryptUtils.compare(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      superAdminId: user.admin?.superAdminId,
      adminId: user.admin?.id,
    };

    const token = jwtUtils.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      superAdminId: user.admin?.superAdminId,
      adminId: user.admin?.id,
    });

    return { user: authUser, token };
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS,
      });
    }

    const hashedPassword = await bcryptUtils.hash(data.password);

    const user = await this.authRepository.createUser({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    if (data.role === UserRole.SUPER_ADMIN) {
      await this.authRepository.createSuperAdmin(user.id);
    } else if (data.role === UserRole.ADMIN && data.superAdminId) {
      await this.authRepository.createAdmin(user.id, data.superAdminId);
    }

    const updatedUser = await this.authRepository.findUserById(user.id);

    if (!updatedUser) {
      throw new ApiError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: AUTH_MESSAGES.USER_NOT_FOUND,
      });
    }

    const authUser: AuthUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      superAdminId: updatedUser.admin?.superAdminId,
      adminId: updatedUser.admin?.id,
    };

    const token = jwtUtils.sign({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      superAdminId: updatedUser.admin?.superAdminId,
      adminId: updatedUser.admin?.id,
    });

    return { user: authUser, token };
  }

  async verifyToken(token: string): Promise<AuthUser> {
    const payload = jwtUtils.verify(token);
    const user = await this.authRepository.findUserById(payload.userId);

    if (!user) {
      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.USER_NOT_FOUND,
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      superAdminId: user.admin?.superAdminId,
      adminId: user.admin?.id,
    };
  }
}

export const authService = new AuthService();

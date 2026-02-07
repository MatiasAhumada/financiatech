import clientAxios from "@/utils/clientAxios.util";
import { LoginDto, RegisterDto, AuthResponse, AuthUser } from "@/types/auth.types";

const API_SESSION_ROUTE = "/api/session";
const API_USERS_ROUTE = "/api/users";

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await clientAxios.post(API_SESSION_ROUTE, dto);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await clientAxios.post(API_USERS_ROUTE, dto);
    return data;
  },

  async logout(): Promise<void> {
    await clientAxios.delete(API_SESSION_ROUTE);
  },

  async me(): Promise<{ user: AuthUser }> {
    const { data } = await clientAxios.get(API_SESSION_ROUTE);
    return data;
  },
};

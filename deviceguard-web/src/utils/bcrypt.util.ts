import bcrypt from "bcryptjs";
import { AUTH_CONSTANTS } from "@/constants/auth.constant";

export const bcryptUtils = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
  },

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },
};

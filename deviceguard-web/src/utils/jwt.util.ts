import jwt from "jsonwebtoken";
import { AUTH_CONSTANTS } from "@/constants/auth.constant";
import { JwtPayload } from "@/types/auth.types";

export const jwtUtils = {
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, AUTH_CONSTANTS.JWT_SECRET, {
      expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN,
    });
  },

  verify(token: string): JwtPayload {
    return jwt.verify(token, AUTH_CONSTANTS.JWT_SECRET) as JwtPayload;
  },

  decode(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  },
};

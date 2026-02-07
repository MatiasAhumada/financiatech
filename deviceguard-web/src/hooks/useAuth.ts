"use client";

import { useState, useEffect } from "react";
import { authService } from "@/services/auth.service";
import { AuthUser } from "@/types/auth.types";
import { clientErrorHandler } from "@/utils/handlers/clientError.handler";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: authUser } = await authService.me();
      setUser(authUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user: authUser } = await authService.login({ email, password });
      setUser(authUser);
      return true;
    } catch (error) {
      clientErrorHandler(error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      return true;
    } catch (error) {
      clientErrorHandler(error);
      return false;
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };
}

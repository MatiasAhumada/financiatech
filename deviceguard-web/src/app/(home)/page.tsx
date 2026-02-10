"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@prisma/client";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }

  return <AdminDashboard />;
}

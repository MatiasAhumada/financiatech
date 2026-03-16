"use client";

import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/constants/routes";
import { PageTransition } from "@/components/layout/PageTransition";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-onyx">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mahogany_red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-silver-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-onyx">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-64">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}

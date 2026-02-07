"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES_BY_ROLE } from "@/constants/permissions.constant";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  Settings,
  LogOut
} from "lucide-react";

const ICONS = {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileText,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const routes = ROUTES_BY_ROLE[user.role] || [];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
            DG
          </div>
          <div>
            <h1 className="font-bold text-white">DeviceGuard</h1>
            <p className="text-xs text-slate-400">{user.role.replace("_", " ")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {routes.map((route) => {
          const Icon = ICONS[route.icon as keyof typeof ICONS];
          const isActive = pathname === route.path;

          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{route.label}</span>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-800" />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-slate-700 text-white">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES_BY_ROLE } from "@/constants/permissions.constant";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DashboardSpeed01Icon,
  Building03Icon,
  UserMultiple02Icon,
  CreditCardIcon,
  FileScriptIcon,
  Settings02Icon,
  Logout01Icon,
  Menu01Icon,
  Cancel01Icon,
  SmartPhone02Icon,
} from "hugeicons-react";
import { Smartphone } from "lucide-react";

const ICONS = {
  LayoutDashboard: DashboardSpeed01Icon,
  Building2: Building03Icon,
  Users: UserMultiple02Icon,
  CreditCard: CreditCardIcon,
  FileText: FileScriptIcon,
  Settings: Settings02Icon,
  Smartphone: SmartPhone02Icon,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push(ROUTES.LOGIN);
    }
  };

  if (!user) return null;

  const routes = ROUTES_BY_ROLE[user.role] || [];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-carbon_black border border-carbon_black-600 rounded-lg text-white hover:bg-onyx-600"
      >
        {isOpen ? <Cancel01Icon size={24} /> : <Menu01Icon size={24} />}
      </button>

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-carbon_black text-white min-h-screen flex flex-col border-r border-carbon_black-600 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mahogany_red rounded-lg flex items-center justify-center font-bold text-sm">
              DG
            </div>
            <div>
              <h1 className="font-bold text-white">DeviceGuard</h1>
              <p className="text-xs text-silver-400 uppercase">
                {user.role.replace("_", " ")}
              </p>
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
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-mahogany_red text-white"
                    : "text-silver-400 hover:bg-onyx-600 hover:text-white"
                )}
              >
                <Icon size={20} />
                <span className="text-sm">{route.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-carbon_black-600" />

        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-onyx-600 text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">
                {user.name}
              </p>
              <p className="text-xs text-silver-400 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-2 text-silver-400 hover:bg-onyx-600 hover:text-white"
          >
            <Logout01Icon size={16} />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}
    </>
  );
}

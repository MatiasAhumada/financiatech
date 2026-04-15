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
  ShoppingCart01Icon,
} from "hugeicons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import logo from "../../../public/logo_f_sf.png";

const ICONS = {
  LayoutDashboard: DashboardSpeed01Icon,
  Building2: Building03Icon,
  Users: UserMultiple02Icon,
  CreditCard: CreditCardIcon,
  FileText: FileScriptIcon,
  Settings: Settings02Icon,
  Smartphone: SmartPhone02Icon,
  Shopping: ShoppingCart01Icon,
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
      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:hidden inset-y-0 left-0 z-40 w-64 bg-carbon_black text-white min-h-screen flex flex-col border-r border-carbon_black-600"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image
                    src={logo}
                    alt="FinanciaTech"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-bold text-white">FinanciaTech</h1>
                  <p className="text-xs text-silver-400 uppercase">
                    {user.role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(false)}
                className="p-2 bg-carbon_black border border-carbon_black-600 rounded-lg text-white hover:bg-onyx-600"
              >
                <Cancel01Icon size={20} />
              </motion.button>
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
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "text-white"
                        : "text-silver-400 hover:bg-onyx-600 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-mahogany_red rounded-lg"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <motion.span
                      className="relative z-10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={20} />
                    </motion.span>
                    <span className="relative z-10 text-sm">{route.label}</span>
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
                  <p className="text-xs text-silver-400 truncate">
                    {user.email}
                  </p>
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-carbon_black text-white min-h-screen flex-col border-r border-carbon_black-600">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src={logo}
                alt="FinanciaTech"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-white">FinanciaTech</h1>
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
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "text-white"
                    : "text-silver-400 hover:bg-onyx-600 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavDesktop"
                    className="absolute inset-0 bg-mahogany_red rounded-lg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.span
                  className="relative z-10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={20} />
                </motion.span>
                <span className="relative z-10 text-sm">{route.label}</span>
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

      {/* Mobile toggle button - positioned on the left edge */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-carbon_black border border-carbon_black-600 rounded-lg text-white hover:bg-onyx-600"
          >
            <Menu01Icon size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}

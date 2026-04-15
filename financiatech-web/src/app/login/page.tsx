"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";
import logo from "../../../public/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push(ROUTES.HOME);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-onyx via-carbon_black to-onyx relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mahogany_red-200/10 via-transparent to-transparent" />
      <Card className="w-full max-w-md bg-carbon_black/80 backdrop-blur-sm border-mahogany_red/20 relative z-10 shadow-2xl shadow-mahogany_red/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-center mb-3">
            <Image
              src={logo}
              alt="FinanciaTech Logo"
              width={200}
              height={80}
              className="object-contain rounded-2xl"
            />
          </div>
          <p className="text-center text-white font-medium">
            Iniciar Sesión
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-silver-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-onyx-600 border-carbon_black-700 text-white placeholder:text-silver-400 focus:border-mahogany_red focus:ring-mahogany_red"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-silver-300">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-onyx-600 border-carbon_black-700 text-white placeholder:text-silver-400 focus:border-mahogany_red focus:ring-mahogany_red pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <ViewOffIcon size={16} className="text-silver-400" />
                  ) : (
                    <ViewIcon size={16} className="text-silver-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-mahogany_red hover:bg-mahogany_red-600 text-white"
              disabled={loading}
            >
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";

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
    <div className="min-h-screen flex items-center justify-center bg-onyx">
      <Card className="w-full max-w-md bg-carbon_black border-carbon_black-600">
        <CardHeader>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-mahogany_red rounded-lg flex items-center justify-center font-bold text-white">
              DG
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-white">
            FinanceTech
          </CardTitle>
          <p className="text-center text-silver-400 text-sm mt-2">
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

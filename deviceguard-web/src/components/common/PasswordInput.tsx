"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ViewIcon, ViewOffIcon, Tick02Icon } from "hugeicons-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showRequirements?: boolean;
}

const PASSWORD_REQUIREMENTS = [
  { label: "Mínimo 8 caracteres", test: (val: string) => val.length >= 8 },
  { label: "Una mayúscula", test: (val: string) => /[A-Z]/.test(val) },
  { label: "Una minúscula", test: (val: string) => /[a-z]/.test(val) },
  {
    label: "Un carácter especial",
    test: (val: string) => /[^A-Za-z0-9]/.test(val),
  },
];

export function PasswordInput({
  value,
  onChange,
  error,
  showRequirements = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Contraseña temporal"
          className={
            error
              ? "pr-10 border-destructive focus:border-destructive focus:ring-destructive"
              : "pr-10"
          }
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
      {error && <p className="text-xs text-destructive">{error}</p>}
      {showRequirements && value && (
        <div className="space-y-1 mt-2">
          {PASSWORD_REQUIREMENTS.map((req, index) => {
            const isValid = req.test(value);
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    isValid ? "bg-success" : "bg-destructive"
                  }`}
                >
                  {isValid && <Tick02Icon size={12} className="text-white" />}
                </div>
                <span
                  className={`text-xs ${
                    isValid ? "text-success" : "text-destructive"
                  }`}
                >
                  {req.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

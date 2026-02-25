"use client";

import { Tick02Icon, SmartPhone02Icon } from "hugeicons-react";

interface ActivationSuccessViewProps {
  deviceName: string;
}

/**
 * Vista de éxito mostrada cuando el dispositivo se vinculó correctamente.
 * SRP: solo renderiza — sin lógica asincrónica ni estado propio.
 */
export function ActivationSuccessView({ deviceName }: ActivationSuccessViewProps) {
  return (
    <div className="space-y-6">
      {/* Icono de éxito con anillo pulsante */}
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          {/* Anillo pulsante exterior */}
          <span className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
          {/* Círculo sólido con checkmark */}
          <div className="relative w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-lg">
            <Tick02Icon size={44} className="text-white" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">
            ¡Dispositivo Vinculado!
          </h3>
          <p className="text-silver-400 text-sm">
            El dispositivo ya está bajo monitoreo de DeviceGuard
          </p>
        </div>
      </div>

      {/* Card con info del dispositivo vinculado */}
      <div className="border border-success/30 rounded-lg p-5 bg-success/5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <SmartPhone02Icon size={20} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-silver-400 uppercase tracking-wider">
              Dispositivo sincronizado
            </p>
            <p className="text-white font-semibold text-lg leading-tight">
              {deviceName}
            </p>
          </div>
        </div>

        <div className="border-t border-success/20 pt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-success font-medium">
            Monitoreo activo — el sistema verificará pagos según el plan configurado
          </p>
        </div>
      </div>

      {/* Instrucción de cierre */}
      <p className="text-center text-xs text-silver-400">
        Podés cerrar esta ventana. La venta ha sido completada exitosamente.
      </p>
    </div>
  );
}

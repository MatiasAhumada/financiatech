"use client";

import { Tick02Icon, SmartPhone02Icon } from "hugeicons-react";

interface LinkedDevice {
  deviceId: string;
  deviceName: string;
}

interface ActivationSuccessViewProps {
  devices: LinkedDevice[];
}

export function ActivationSuccessView({ devices }: ActivationSuccessViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <span className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
          <div className="relative w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-lg">
            <Tick02Icon size={44} className="text-white" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">
            {devices.length === 1
              ? "¡Dispositivo Vinculado!"
              : "¡Dispositivos Vinculados!"}
          </h3>
          <p className="text-silver-400 text-sm">
            {devices.length === 1
              ? "El dispositivo ya está bajo monitoreo de FinanciaTech"
              : `Los ${devices.length} dispositivos ya están bajo monitoreo de FinanciaTech`}
          </p>
        </div>
      </div>

      <div className="border border-success/30 rounded-lg p-5 bg-success/5 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <SmartPhone02Icon size={18} className="text-success" />
          <p className="text-xs text-silver-400 uppercase tracking-wider">
            Dispositivos sincronizados ({devices.length})
          </p>
        </div>

        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20"
            >
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <SmartPhone02Icon size={16} className="text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {device.deviceName}
                </p>
              </div>
              <Tick02Icon size={18} className="text-success flex-shrink-0" />
            </div>
          ))}
        </div>

        <div className="border-t border-success/20 pt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-success font-medium">
            Monitoreo activo — el sistema verificará pagos según el plan
            configurado
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-silver-400">
        Podés cerrar esta ventana. La venta ha sido completada exitosamente.
      </p>
    </div>
  );
}

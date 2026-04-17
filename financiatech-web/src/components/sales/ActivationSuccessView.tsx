"use client";

import { Tick02Icon, SmartPhone02Icon, InformationDiamondIcon } from "hugeicons-react";
import { IDevice } from "@/types";
import { DEVICE_TYPE_LABELS } from "@/schemas/device.schema";

interface ActivationSuccessViewProps {
  device: IDevice;
}

export function ActivationSuccessView({
  device,
}: ActivationSuccessViewProps) {
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
            ¡Dispositivo Vinculado!
          </h3>
          <p className="text-silver-400 text-sm">
            El dispositivo ya está bajo monitoreo de FinanciaTech
          </p>
        </div>
      </div>

      <div className="border border-success/30 rounded-lg p-5 bg-success/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <SmartPhone02Icon size={24} className="text-success" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-silver-400 uppercase tracking-wider">
              Dispositivo sincronizado
            </p>
            <p className="text-white font-bold text-xl leading-tight">
              {device.name}
            </p>
          </div>
        </div>

        <div className="border-t border-success/20 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <SmartPhone02Icon size={16} className="text-success" />
              <div>
                <p className="text-silver-400 text-xs">Tipo</p>
                <p className="text-white font-medium">{DEVICE_TYPE_LABELS[device.type]}</p>
              </div>
            </div>
            {device.model && (
              <div className="flex items-center gap-2">
                <SmartPhone02Icon size={16} className="text-success" />
                <div>
                  <p className="text-silver-400 text-xs">Modelo</p>
                  <p className="text-white font-medium">{device.model}</p>
                </div>
              </div>
            )}
          </div>

          {device.serialNumber && (
            <div className="flex items-center gap-2 text-sm">
              <InformationDiamondIcon size={16} className="text-success" />
              <div className="flex-1">
                <p className="text-silver-400 text-xs">Número de Serie</p>
                <p className="text-white font-mono font-medium">{device.serialNumber}</p>
              </div>
            </div>
          )}

          {device.sync?.imei && (
            <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/30">
              <InformationDiamondIcon size={18} className="text-success" />
              <div className="flex-1">
                <p className="text-silver-400 text-xs uppercase tracking-wider">IMEI Registrado</p>
                <p className="text-white font-mono font-bold text-lg">{device.sync.imei}</p>
              </div>
            </div>
          )}

          {device.sync?.fcmToken && (
            <div className="flex items-center gap-2 text-sm">
              <InformationDiamondIcon size={16} className="text-success" />
              <div className="flex-1">
                <p className="text-silver-400 text-xs">FCM Token</p>
                <p className="text-white font-mono text-xs truncate">{device.sync.fcmToken}</p>
              </div>
            </div>
          )}

          {device.sync?.syncedAt && (
            <div className="flex items-center gap-2 text-sm">
              <InformationDiamondIcon size={16} className="text-success" />
              <div className="flex-1">
                <p className="text-silver-400 text-xs">Fecha de Sincronización</p>
                <p className="text-white font-medium">
                  {new Date(device.sync.syncedAt).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-success/20 pt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-success font-medium">
            Monitoreo activo — el sistema verificará pagos según el plan configurado
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-silver-400">
        Podés cerrar esta ventana. La venta ha sido completada exitosamente.
      </p>
    </div>
  );
}

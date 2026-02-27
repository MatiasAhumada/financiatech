/**
 * Componente: DeviceControlPanel
 * 
 * Panel de control para administradores
 * Permite bloquear/desbloquear dispositivos de forma remota
 * Está diseñado para usarse en el dashboard de ventas
 */

import React, { useState, useEffect } from "react";
import { Lock, LockOpen, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deviceControlService } from "@/services/deviceControl.service";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface DeviceControlPanelProps {
  deviceId: string;
  deviceName: string;
  clientName: string;
  isBlocked: boolean;
  onStatusChange?: (isBlocked: boolean) => void;
}

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({
  deviceId,
  deviceName,
  clientName,
  isBlocked,
  onStatusChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(isBlocked);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [action, setAction] = useState<"lock" | "unlock" | null>(null);

  const handleLockDevice = async () => {
    try {
      setIsLoading(true);
      await deviceControlService.lockDevice(
        deviceId,
        `Bloqueo remoto: ${clientName} - ${new Date().toLocaleString()}`
      );

      clientSuccessHandler(
        `✅ ${deviceName} ha sido bloqueado correctamente`
      );
      setCurrentStatus(true);
      setShowConfirmDialog(false);
      onStatusChange?.(true);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockDevice = async () => {
    try {
      setIsLoading(true);
      await deviceControlService.unlockDevice(deviceId);

      clientSuccessHandler(
        `✅ ${deviceName} ha sido desbloqueado correctamente`
      );
      setCurrentStatus(false);
      setShowConfirmDialog(false);
      onStatusChange?.(false);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (action === "lock") {
      await handleLockDevice();
    } else if (action === "unlock") {
      await handleUnlockDevice();
    }
    setAction(null);
  };

  const getStatusIcon = () => {
    if (currentStatus) {
      return <Lock className="w-5 h-5 text-white" />;
    } else {
      return <LockOpen className="w-5 h-5 text-white" />;
    }
  };

  const getStatusColor = () => {
    return currentStatus
      ? "bg-mahogany_red border-mahogany_red"
      : "bg-green-700 border-green-700";
  };

  const getStatusText = () => {
    return currentStatus ? "BLOQUEADO" : "ACTIVO";
  };

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div
        className={`${getStatusColor()} border rounded-lg px-4 py-3 flex items-center gap-3 transition-all`}
      >
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{deviceName}</p>
          <p className="text-xs text-white/70">{clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white/20 rounded text-xs font-semibold text-white">
            {getStatusText()}
          </span>
          {currentStatus && (
            <AlertCircle className="w-5 h-5 text-white animate-pulse" />
          )}
          {!currentStatus && (
            <CheckCircle className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {/* Botones de control */}
      <div className="grid grid-cols-2 gap-2">
        {!currentStatus && (
          <Button
            onClick={() => {
              setAction("lock");
              setShowConfirmDialog(true);
            }}
            disabled={isLoading}
            className="bg-mahogany_red hover:bg-mahogany_red/90 text-white flex items-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Bloquear
          </Button>
        )}

        {currentStatus && (
          <Button
            onClick={() => {
              setAction("unlock");
              setShowConfirmDialog(true);
            }}
            disabled={isLoading}
            className="bg-green-700 hover:bg-green-700/90 text-white flex items-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <LockOpen className="w-4 h-4" />
            )}
            Desbloquear
          </Button>
        )}

        {/* Botón de estado en tiempo real */}
        <Button
          onClick={() => {}}
          disabled={true}
          className="bg-gray-600 text-white flex items-center gap-2"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          En línea
        </Button>
      </div>

      {/* Dialog de confirmación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon_black border border-carbon_black-600 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {action === "lock" ? "⚠️ Confirmar Bloqueo" : "⚠️ Confirmar Desbloqueo"}
            </h2>

            <p className="text-silver-300">
              {action === "lock"
                ? `¿Deseas bloquear el dispositivo ${deviceName} de ${clientName}?`
                : `¿Deseas desbloquear el dispositivo ${deviceName} de ${clientName}?`}
            </p>

            {action === "lock" && (
              <div className="bg-mahogany_red/20 border border-mahogany_red rounded p-3">
                <p className="text-sm text-white">
                  El dispositivo se bloqueará completamente. El cliente no podrá usar el dispositivo hasta que pague o desbloquees manualmente.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setAction(null);
                }}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>

              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex-1 ${
                  action === "lock"
                    ? "bg-mahogany_red hover:bg-mahogany_red/90"
                    : "bg-green-700 hover:bg-green-700/90"
                } text-white`}
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {action === "lock" ? "Bloquear" : "Desbloquear"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

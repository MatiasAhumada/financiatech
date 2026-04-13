"use client";

import { useState, useEffect } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { IDevice } from "@/types";
import {
  Notification03Icon,
  Shield01Icon,
  Timer01Icon,
  Locker01Icon,
  RefreshIcon,
  Alert02Icon,
} from "hugeicons-react";
import { salesUtils } from "@/utils/sales.util";

interface ManualNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: IDevice;
  onSuccess: () => void;
}

interface NotificationLog {
  id: string;
  type: string;
  trigger: string;
  message: string;
  success: boolean;
  sentAt: string;
  errorMessage: string | null;
  installment: {
    number: number;
    dueDate: string;
  } | null;
}

const INSTANCES = [
  {
    key: "warning1",
    label: "Warning 1",
    description: "Primer aviso de pago",
    icon: Notification03Icon,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    hoverBg: "hover:bg-blue-500/20",
  },
  {
    key: "warning2",
    label: "Warning 2",
    description: "Segundo aviso de pago",
    icon: Alert02Icon,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    hoverBg: "hover:bg-yellow-500/20",
  },
  {
    key: "block_warning",
    label: "Pre-Bloqueo",
    description: "Alerta 4hs antes del bloqueo",
    icon: Timer01Icon,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    hoverBg: "hover:bg-orange-500/20",
  },
  {
    key: "block",
    label: "Bloqueo",
    description: "Bloquear dispositivo ahora",
    icon: Locker01Icon,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    hoverBg: "hover:bg-destructive/20",
  },
];

export function ManualNotificationModal({
  open,
  onOpenChange,
  device,
  onSuccess,
}: ManualNotificationModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (open && device) {
      loadLogs();
    }
  }, [open, device]);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await fetch(
        `/api/devices/${device.id}/notifications?limit=20`
      );
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTriggerInstance = async (instanceKey: string) => {
    try {
      setLoading(instanceKey);
      const response = await fetch(`/api/devices/${device.id}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: instanceKey }),
      });

      const data = await response.json();

      if (data.success) {
        await loadLogs();
        onSuccess();
      }
    } catch (error) {
      console.error("Error triggering notification:", error);
    } finally {
      setLoading(null);
    }
  };

  const formatType = (type: string) => {
    const types: Record<string, string> = {
      WARNING_1: "Warning 1",
      WARNING_2: "Warning 2",
      BLOCKED: "Bloqueo",
    };
    return types[type] || type;
  };

  const formatTrigger = (trigger: string) => {
    return trigger === "SCHEDULED" ? "Automático" : "Manual";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title="Notificaciones Manuales"
      description={`Dispositivo: ${device.name}`}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Instance Buttons */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Disparar Instancia
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {INSTANCES.map((instance) => {
              const Icon = instance.icon;
              const isLoading = loading === instance.key;

              return (
                <button
                  key={instance.key}
                  onClick={() => handleTriggerInstance(instance.key)}
                  disabled={isLoading}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${instance.borderColor} ${instance.bgColor} ${instance.hoverBg} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon size={24} className={instance.color} />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">
                      {instance.label}
                    </p>
                    <p className="text-xs text-silver-400">
                      {instance.description}
                    </p>
                  </div>
                  {isLoading && (
                    <RefreshIcon
                      size={16}
                      className="text-white animate-spin"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Historial de Notificaciones
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadLogs}
              className="text-xs"
            >
              <RefreshIcon size={14} className="mr-1" />
              Actualizar
            </Button>
          </div>

          <div className="border border-carbon_black-600 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-mahogany_red border-t-transparent rounded-full animate-spin" />
                <span className="text-silver-400 ml-3 text-sm">
                  Cargando historial...
                </span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-silver-400 text-sm">
                No hay notificaciones registradas
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-carbon_black border-b border-carbon_black-600">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-silver-400 uppercase">
                      Tipo
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-silver-400 uppercase">
                      Trigger
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-silver-400 uppercase">
                      Fecha
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-silver-400 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-onyx/30">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-carbon_black-600 hover:bg-onyx/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-white">
                        {formatType(log.type)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            log.trigger === "SCHEDULED"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {formatTrigger(log.trigger)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-silver-400 text-xs">
                        {formatDate(log.sentAt)}
                      </td>
                      <td className="px-3 py-2">
                        {log.success ? (
                          <span className="text-success text-xs">✓ Éxito</span>
                        ) : (
                          <span className="text-destructive text-xs">
                            ✗ Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </GenericModal>
  );
}

"use client";

import { Label } from "@/components/ui/label";
import {
  ShoppingCart01Icon,
  SmartPhone02Icon,
  Tick02Icon,
  Loading03Icon,
  InformationDiamondIcon,
} from "hugeicons-react";
import { SALES_MESSAGES } from "@/constants/sales.constant";
import { useMultiActivationPolling } from "@/hooks/useMultiActivationPolling";
import { IDevice } from "@/types";
import { DEVICE_TYPE_LABELS } from "@/schemas/device.schema";

interface MultiActivationStatusProps {
  activationCode: string;
  devices: IDevice[];
  onAllLinked: () => void;
  onLinkingProgress: (linked: number, total: number) => void;
}

export function MultiActivationStatus({
  activationCode,
  devices,
  onAllLinked,
  onLinkingProgress,
}: MultiActivationStatusProps) {
  const { linkedDevices, allLinked } = useMultiActivationPolling(
    activationCode,
    devices.map((d) => d.id)
  );

  if (allLinked && linkedDevices.length === devices.length) {
    onAllLinked();
  }

  if (linkedDevices.length > 0) {
    onLinkingProgress(linkedDevices.length, devices.length);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative w-20 h-20 mx-auto">
          <span className="absolute inset-0 rounded-full bg-mahogany_red/30 animate-ping" />
          <div className="relative w-20 h-20 bg-mahogany_red/10 border-2 border-mahogany_red rounded-full flex items-center justify-center">
            <ShoppingCart01Icon size={36} className="text-mahogany_red" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">
            {SALES_MESSAGES.INFO.SUCCESS_TITLE}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mahogany_red animate-pulse" />
            <p className="text-silver-400 text-sm">
              Esperando vinculación de los dispositivos...
            </p>
          </div>
        </div>
      </div>

      <div className="border border-mahogany_red rounded-lg p-6 bg-mahogany_red/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-mahogany_red to-transparent animate-pulse" />

        <Label className="text-white text-sm uppercase mb-2 block">
          {SALES_MESSAGES.LABELS.ACTIVATION_CODE}
        </Label>
        <div className="bg-carbon_black rounded-lg p-6 text-center ring-1 ring-mahogany_red/40">
          <p className="text-5xl font-bold text-mahogany_red tracking-widest font-mono">
            {activationCode}
          </p>
        </div>
        <p className="text-xs text-silver-400 mt-4 text-center">
          {SALES_MESSAGES.INFO.ACTIVATION_INSTRUCTIONS}
        </p>
      </div>

      <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">
            Dispositivos ({linkedDevices.length}/{devices.length})
          </h4>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-carbon_black-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{
                  width: `${(linkedDevices.length / devices.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-success font-medium">
              {Math.round((linkedDevices.length / devices.length) * 100)}%
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {devices.map((device) => {
            const isLinked = linkedDevices.some(
              (d) => d.deviceId === device.id
            );
            return (
              <div
                key={device.id}
                className={`rounded-lg transition-all duration-300 ${
                  isLinked
                    ? "bg-success/10 border-2 border-success/40"
                    : "bg-onyx-600 border-2 border-transparent"
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    className={`mt-1 flex-shrink-0 ${
                      isLinked ? "animate-bounce" : ""
                    }`}
                  >
                    {isLinked ? (
                      <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                        <Tick02Icon size={24} className="text-success" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-mahogany_red/20 rounded-full flex items-center justify-center">
                        <Loading03Icon
                          size={24}
                          className="text-mahogany_red animate-spin"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p
                        className={`font-semibold text-lg truncate ${
                          isLinked ? "text-success" : "text-white"
                        }`}
                      >
                        {device.name}
                      </p>
                      <p className="text-xs text-silver-400 uppercase tracking-wide">
                        {isLinked
                          ? "✓ Vinculado exitosamente"
                          : "Esperando vinculación..."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <SmartPhone02Icon
                            size={14}
                            className="text-silver-400"
                          />
                          <span className="text-silver-400">Tipo:</span>
                          <span className="text-white font-medium">
                            {DEVICE_TYPE_LABELS[device.type]}
                          </span>
                        </div>
                        {device.model && (
                          <div className="flex items-center gap-1.5">
                            <SmartPhone02Icon
                              size={14}
                              className="text-silver-400"
                            />
                            <span className="text-silver-400">Modelo:</span>
                            <span className="text-white font-medium truncate">
                              {device.model}
                            </span>
                          </div>
                        )}
                      </div>
                      {device.serialNumber && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <InformationDiamondIcon
                            size={14}
                            className="text-silver-400"
                          />
                          <span className="text-silver-400">N° Serie:</span>
                          <span className="text-white font-mono">
                            {device.serialNumber}
                          </span>
                        </div>
                      )}
                      {device.sync?.imei && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <InformationDiamondIcon
                            size={14}
                            className="text-success"
                          />
                          <span className="text-silver-400">IMEI:</span>
                          <span className="text-white font-mono font-semibold">
                            {device.sync.imei}
                          </span>
                        </div>
                      )}
                      {device.sync?.fcmToken && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <InformationDiamondIcon
                            size={14}
                            className="text-success"
                          />
                          <span className="text-silver-400">FCM Token:</span>
                          <span className="text-white font-mono text-[10px] truncate max-w-[200px]">
                            {device.sync.fcmToken}
                          </span>
                        </div>
                      )}
                      {device.sync?.syncedAt && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <InformationDiamondIcon
                            size={14}
                            className="text-success"
                          />
                          <span className="text-silver-400">Sincronizado:</span>
                          <span className="text-white">
                            {new Date(device.sync.syncedAt).toLocaleString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      )}
                      {device.sync?.lastPing && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <InformationDiamondIcon
                            size={14}
                            className="text-success"
                          />
                          <span className="text-silver-400">Último ping:</span>
                          <span className="text-white">
                            {new Date(device.sync.lastPing).toLocaleString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border border-warning/50 rounded-lg p-4 bg-warning/5">
        <div className="flex items-start gap-2">
          <ShoppingCart01Icon
            size={20}
            className="text-warning mt-1 flex-shrink-0"
          />
          <div>
            <p className="text-sm text-white font-medium">
              {SALES_MESSAGES.INFO.IMPORTANT_TITLE}
            </p>
            <p className="text-sm text-silver-400 mt-1">
              {SALES_MESSAGES.INFO.IMPORTANT_MESSAGE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

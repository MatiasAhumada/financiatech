"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IDevice, IClient } from "@/types";
import { SALES_MESSAGES } from "@/constants/sales.constant";
import { SearchableSelect } from "@/components/sales/SearchableSelect";
import { DEVICE_TYPE_LABELS } from "@/schemas/device.schema";
import { salesUtils } from "@/utils/sales.util";
import { Add01Icon, Delete02Icon } from "hugeicons-react";

interface SelectedDeviceItem {
  deviceId: string;
  amount: number;
}

interface MultiDeviceSelectionStepProps {
  devices: IDevice[];
  clients: IClient[];
  selectedDevices: SelectedDeviceItem[];
  selectedClient: string;
  onDevicesChange: (devices: SelectedDeviceItem[]) => void;
  onClientChange: (clientId: string) => void;
  onCreateDevice: () => void;
  onCreateClient: () => void;
}

export function MultiDeviceSelectionStep({
  devices,
  clients,
  selectedDevices,
  selectedClient,
  onDevicesChange,
  onClientChange,
  onCreateDevice,
  onCreateClient,
}: MultiDeviceSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const deviceOptions = devices.map((device) => ({
    id: device.id,
    label: device.name,
    sublabel: `${DEVICE_TYPE_LABELS[device.type]} - ${device.model || "Sin modelo"}`,
  }));

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: client.name,
    sublabel: client.email || "Sin email",
  }));

  const selectedDevicesList = selectedDevices.map((sd) => {
    const device = devices.find((d) => d.id === sd.deviceId);
    return { ...sd, device };
  });

  const totalAmount = selectedDevices.reduce((sum, d) => sum + d.amount, 0);

  const handleAddDevice = (deviceId: string) => {
    const existing = selectedDevices.find((d) => d.deviceId === deviceId);
    if (existing) return;

    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    onDevicesChange([...selectedDevices, { deviceId, amount: 0 }]);
  };

  const handleRemoveDevice = (deviceId: string) => {
    onDevicesChange(selectedDevices.filter((d) => d.deviceId !== deviceId));
  };

  const handleAmountChange = (deviceId: string, value: string) => {
    const rawValue = salesUtils.parseFormattedNumber(value);
    const amount = parseFloat(rawValue) || 0;

    onDevicesChange(
      selectedDevices.map((d) =>
        d.deviceId === deviceId ? { ...d, amount } : d
      )
    );
  };

  const formatAmount = (amount: number) => {
    return salesUtils.formatThousands(amount.toString());
  };

  const availableDevices = devices.filter(
    (d) => !selectedDevices.some((sd) => sd.deviceId === d.id)
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client" className="text-white">
          CLIENTE
        </Label>
        <SearchableSelect
          value={selectedClient}
          onChange={onClientChange}
          options={clientOptions}
          placeholder={SALES_MESSAGES.PLACEHOLDERS.SELECT_CLIENT}
          onCreateNew={onCreateClient}
        />
      </div>

      <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-white">
            DISPOSITIVOS ({selectedDevices.length})
          </Label>
          <Button
            type="button"
            onClick={onCreateDevice}
            variant="outline"
            size="sm"
            className="text-xs border-mahogany_red text-mahogany_red hover:bg-mahogany_red/10"
          >
            <Add01Icon size={14} className="mr-1" />
            Nuevo
          </Button>
        </div>

        {selectedDevicesList.length > 0 && (
          <div className="space-y-3">
            {selectedDevicesList.map(({ deviceId, amount, device }) => (
              <div
                key={deviceId}
                className="flex items-center gap-3 p-3 bg-onyx-600 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {device?.name || "Dispositivo"}
                  </p>
                  <p className="text-xs text-silver-400 truncate">
                    {device
                      ? `${DEVICE_TYPE_LABELS[device.type]} - ${device.model || "Sin modelo"}`
                      : ""}
                  </p>
                </div>
                <div className="w-28">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-mahogany_red text-sm">
                      $
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatAmount(amount)}
                      onChange={(e) =>
                        handleAmountChange(deviceId, e.target.value)
                      }
                      placeholder="0"
                      className="pl-5 text-sm bg-carbon_black border-carbon_black-700 text-white h-9"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDevice(deviceId)}
                  className="text-silver-400 hover:text-mahogany_red hover:bg-transparent"
                >
                  <Delete02Icon size={18} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {availableDevices.length > 0 && (
          <SearchableSelect
            value=""
            onChange={handleAddDevice}
            options={availableDevices.map((d) => ({
              id: d.id,
              label: d.name,
              sublabel: `${DEVICE_TYPE_LABELS[d.type]} - ${d.model || "Sin modelo"}`,
            }))}
            placeholder="Agregar dispositivo..."
            onCreateNew={onCreateDevice}
          />
        )}

        <div className="flex items-center justify-between pt-3 border-t border-carbon_black-600">
          <Label className="text-silver-400">TOTAL</Label>
          <p className="text-2xl font-bold text-mahogany_red">
            {salesUtils.formatCurrency(totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

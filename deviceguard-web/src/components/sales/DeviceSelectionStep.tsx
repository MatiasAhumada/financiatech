import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IDevice, IClient } from "@/types";
import { SALES_MESSAGES } from "@/constants/sales.constant";

interface DeviceSelectionStepProps {
  devices: IDevice[];
  clients: IClient[];
  selectedDevice: string;
  selectedClient: string;
  amount: string;
  onDeviceChange: (deviceId: string) => void;
  onClientChange: (clientId: string) => void;
  onAmountChange: (amount: string) => void;
}

export function DeviceSelectionStep({
  devices,
  clients,
  selectedDevice,
  selectedClient,
  amount,
  onDeviceChange,
  onClientChange,
  onAmountChange,
}: DeviceSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="device" className="text-white">
          {SALES_MESSAGES.STEPS.DEVICE}
        </Label>
        <select
          id="device"
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
        >
          <option value="">{SALES_MESSAGES.PLACEHOLDERS.SELECT_DEVICE}</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name} - {device.model || "Sin modelo"}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client" className="text-white">
          CLIENTE
        </Label>
        <select
          id="client"
          value={selectedClient}
          onChange={(e) => onClientChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
        >
          <option value="">{SALES_MESSAGES.PLACEHOLDERS.SELECT_CLIENT}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-white">
          VALOR DEL EQUIPO
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-lg">
            $
          </span>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={SALES_MESSAGES.PLACEHOLDERS.AMOUNT}
            className="pl-8 text-lg bg-carbon_black border-carbon_black-600 text-white"
          />
        </div>
      </div>
    </div>
  );
}

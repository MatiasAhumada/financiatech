"use client";

import { useState } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deviceService } from "@/services/device.service";
import {
  createDeviceSchema,
  DEVICE_TYPE_LABELS,
  DEVICE_STATUS_LABELS,
} from "@/schemas/device.schema";
import { DeviceStatus, DeviceType } from "@prisma/client";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface CreateDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDeviceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateDeviceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: DeviceType.SMARTPHONE as DeviceType,
    model: "",
    serialNumber: "",
    status: DeviceStatus.ACTIVE as DeviceStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: "",
      type: DeviceType.SMARTPHONE as DeviceType,
      model: "",
      serialNumber: "",
      status: DeviceStatus.ACTIVE as DeviceStatus,
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const result = createDeviceSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await deviceService.create(result.data);
      clientSuccessHandler("Dispositivo creado exitosamente");
      handleClose();
      onSuccess();
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="Nuevo Dispositivo"
      description="Crear un nuevo dispositivo en el sistema"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="bg-mahogany_red hover:bg-mahogany_red-600 text-amber-50"
            onClick={handleSubmit}
          >
            Crear Dispositivo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            placeholder="Ingrese el nombre del dispositivo"
            className={
              errors.name
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => {
              setFormData({ ...formData, type: e.target.value as DeviceType });
              if (errors.type) setErrors({ ...errors, type: "" });
            }}
            className={`w-full px-3 py-2 rounded-md border bg-background text-sm ${
              errors.type
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }`}
          >
            {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-xs text-destructive">{errors.type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modelo (Opcional)</Label>
          <Input
            id="model"
            value={formData.model || ""}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            placeholder="Ej: MacBook Pro 2023"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">Número de Serie (Opcional)</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber || ""}
            onChange={(e) =>
              setFormData({ ...formData, serialNumber: e.target.value })
            }
            placeholder="Ej: ABC123XYZ"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as DeviceStatus,
              })
            }
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          >
            {Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </GenericModal>
  );
}

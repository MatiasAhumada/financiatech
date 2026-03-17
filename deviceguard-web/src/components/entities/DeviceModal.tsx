"use client";

import { useState, useEffect } from "react";
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
import { IDevice, IDeviceFormValues } from "@/types";
import { DeviceStatus, DeviceType } from "@prisma/client";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface DeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: IDevice | null;
  viewMode?: boolean;
  onSuccess: () => void;
}

export function DeviceModal({
  open,
  onOpenChange,
  device,
  viewMode = false,
  onSuccess,
}: DeviceModalProps) {
  const [formData, setFormData] = useState<IDeviceFormValues>({
    name: "",
    type: DeviceType.SMARTPHONE as DeviceType,
    model: "",
    serialNumber: "",
    status: DeviceStatus.ACTIVE as DeviceStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isViewMode, setIsViewMode] = useState(viewMode);

  useEffect(() => {
    if (device && open) {
      setFormData({
        name: device.name,
        type: device.type,
        model: device.model || "",
        serialNumber: device.serialNumber || "",
        status: device.status,
      });
      setIsViewMode(viewMode);
    } else if (open) {
      setFormData({
        name: "",
        type: DeviceType.SMARTPHONE as DeviceType,
        model: "",
        serialNumber: "",
        status: DeviceStatus.ACTIVE as DeviceStatus,
      });
      setIsViewMode(false);
    }
    setErrors({});
  }, [device, viewMode, open]);

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
      if (device) {
        await deviceService.update(device.id, result.data);
        clientSuccessHandler("Dispositivo actualizado exitosamente");
      } else {
        await deviceService.create(result.data);
        clientSuccessHandler("Dispositivo creado exitosamente");
      }
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
      title={
        device
          ? isViewMode
            ? "Ver Dispositivo"
            : "Editar Dispositivo"
          : "Nuevo Dispositivo"
      }
      description={
        device
          ? isViewMode
            ? "Información del dispositivo"
            : "Actualizar información del dispositivo"
          : "Crear un nuevo dispositivo en el sistema"
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            {isViewMode ? "Cerrar" : "Cancelar"}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit}>
              {device ? "Actualizar" : "Crear Dispositivo"}
            </Button>
          )}
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
            disabled={isViewMode}
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
            disabled={isViewMode}
            className={`w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm ${
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
            disabled={isViewMode}
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
            disabled={isViewMode}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => {
              setFormData({
                ...formData,
                status: e.target.value as DeviceStatus,
              });
            }}
            disabled={isViewMode}
            className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
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

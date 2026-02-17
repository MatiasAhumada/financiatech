import { z } from "zod";
import { DeviceStatus, DeviceType } from "@prisma/client";

export const createDeviceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.nativeEnum(DeviceType, { required_error: "El tipo es requerido" }),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(DeviceStatus).default(DeviceStatus.ACTIVE),
});

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  [DeviceType.SMARTPHONE]: "Smartphone",
  [DeviceType.TABLET]: "Tablet",
  [DeviceType.LAPTOP]: "Laptop",
  [DeviceType.DESKTOP]: "PC Escritorio",
  [DeviceType.SMARTWATCH]: "Smartwatch",
  [DeviceType.OTHER]: "Otro",
};

export type CreateDeviceDto = z.infer<typeof createDeviceSchema>;

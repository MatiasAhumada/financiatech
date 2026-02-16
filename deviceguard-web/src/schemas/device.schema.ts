import { z } from "zod";
import { DeviceStatus } from "@prisma/client";

export const createDeviceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.string().min(1, "El tipo es requerido"),
  model: z.string().optional().or(z.literal("")).default(""),
  serialNumber: z.string().optional().or(z.literal("")).default(""),
  status: z.nativeEnum(DeviceStatus).default(DeviceStatus.ACTIVE),
  clientId: z.string().nullable().default(null),
});

export type CreateDeviceDto = z.infer<typeof createDeviceSchema>;

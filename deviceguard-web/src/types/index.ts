import { Device, Admin, SuperAdmin, Client, Prisma } from "@prisma/client";

export type { Device, Admin, SuperAdmin, Client };

export type CreateDeviceDto = Prisma.DeviceCreateInput;
export type UpdateDeviceDto = Prisma.DeviceUpdateInput;

import { User, Device, Admin, SuperAdmin, Client } from "@prisma/client";

export type { User, Device, Admin, SuperAdmin, Client };

export interface CreateDeviceDto {
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  status?: string;
  adminId: string;
  clientId: string;
}

export interface UpdateDeviceDto {
  name?: string;
  type?: string;
  model?: string;
  serialNumber?: string;
  status?: string;
}

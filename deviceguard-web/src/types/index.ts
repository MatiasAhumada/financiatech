import { Device, Admin, SuperAdmin, Client, Prisma } from "@prisma/client";

export type { Device, Admin, SuperAdmin, Client };

export type CreateDeviceDto = Prisma.DeviceCreateInput;
export type UpdateDeviceDto = Prisma.DeviceUpdateInput;

export type CreateClientDto = Prisma.ClientCreateInput & {
  adminId?: string;
  phones?: Prisma.PhoneCreateWithoutClientInput[];
  addresses?: Prisma.AddressCreateWithoutClientInput[];
};

export type UpdateClientDto = Prisma.ClientUpdateInput & {
  adminId?: string;
  phones?: Prisma.PhoneCreateWithoutClientInput[];
  addresses?: Prisma.AddressCreateWithoutClientInput[];
};

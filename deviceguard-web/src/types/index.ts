import {
  Device as PrismaDevice,
  Admin as PrismaAdmin,
  SuperAdmin as PrismaSuperAdmin,
  Client as PrismaClient,
  Phone as PrismaPhone,
  Address as PrismaAddress,
} from "@prisma/client";

export type {
  PrismaDevice,
  PrismaAdmin,
  PrismaSuperAdmin,
  PrismaClient,
  PrismaPhone,
  PrismaAddress,
};

export interface IClient extends PrismaClient {
  phones: PrismaPhone[];
  addresses: PrismaAddress[];
  devices: PrismaDevice[];
}

export interface IClientFormValues extends Omit<
  PrismaClient,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "adminId"
> {
  phones?: Array<{
    number: string;
    type: "MOBILE" | "HOME" | "WORK";
    referencia?: string;
  }>;
  addresses?: Array<{
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country?: string;
    nota?: string;
  }>;
}

export interface IDevice extends PrismaDevice {
  admin: PrismaAdmin;
  client: PrismaClient | null;
}

export interface IDeviceFormValues extends Omit<
  PrismaDevice,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "adminId" | "clientId"
> {}

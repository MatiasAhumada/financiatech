import { ClientRepository } from "../repository/client.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { prisma } from "@/lib/prisma";
import { PhoneType } from "@prisma/client";
import httpStatus from "http-status";

export class ClientService {
  private clientRepository: ClientRepository;

  constructor() {
    this.clientRepository = new ClientRepository();
  }

  async create(data: {
    name: string;
    email?: string;
    adminId: string;
    phones?: Array<{ number: string; type: PhoneType }>;
    addresses?: Array<{
      street: string;
      city: string;
      state?: string;
      zipCode?: string;
      country?: string;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: data.name,
          email: data.email || null,
          adminId: data.adminId,
        },
      });

      if (data.phones?.length) {
        await tx.phone.createMany({
          data: data.phones.map((phone) => ({
            ...phone,
            clientId: client.id,
          })),
        });
      }

      if (data.addresses?.length) {
        await tx.address.createMany({
          data: data.addresses.map((address) => ({
            ...address,
            clientId: client.id,
          })),
        });
      }

      return tx.client.findUnique({
        where: { id: client.id },
        include: {
          phones: true,
          addresses: true,
        },
      });
    });
  }

  async update(
    id: string,
    data: {
      name: string;
      email?: string;
      adminId: string;
      phones?: Array<{ number: string; type: PhoneType }>;
      addresses?: Array<{
        street: string;
        city: string;
        state?: string;
        zipCode?: string;
        country?: string;
      }>;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email || null,
        },
      });

      await tx.phone.deleteMany({ where: { clientId: id } });
      await tx.address.deleteMany({ where: { clientId: id } });

      if (data.phones?.length) {
        await tx.phone.createMany({
          data: data.phones.map((phone) => ({
            ...phone,
            clientId: client.id,
          })),
        });
      }

      if (data.addresses?.length) {
        await tx.address.createMany({
          data: data.addresses.map((address) => ({
            ...address,
            clientId: client.id,
          })),
        });
      }

      return tx.client.findUnique({
        where: { id: client.id },
        include: {
          phones: true,
          addresses: true,
        },
      });
    });
  }

  async findByAdminId(adminId: string, search?: string) {
    return this.clientRepository.findByAdminId(adminId, search);
  }

  async findById(id: string) {
    const client = await this.clientRepository.findById(id);

    if (!client) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Cliente no encontrado",
      });
    }

    return client;
  }

  async delete(id: string) {
    return this.clientRepository.softDelete(id);
  }

  async restore(id: string) {
    return this.clientRepository.restore(id);
  }
}

export const clientService = new ClientService();

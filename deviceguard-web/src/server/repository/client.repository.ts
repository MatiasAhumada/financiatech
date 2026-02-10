import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ClientRepository {
  async create(data: Prisma.ClientCreateInput) {
    return prisma.client.create({
      data,
      include: {
        phones: true,
        addresses: true,
      },
    });
  }

  async findByAdminId(adminId: string, search?: string) {
    return prisma.client.findMany({
      where: {
        adminId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }),
      },
      include: {
        phones: true,
        addresses: true,
        devices: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });
  }

  async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        phones: true,
        addresses: true,
        devices: true,
      },
    });
  }

  async softDelete(id: string) {
    return prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return prisma.client.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}

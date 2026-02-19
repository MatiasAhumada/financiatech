import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class DevicesRepository {
  async create(data: Prisma.DeviceCreateInput) {
    return prisma.$transaction(async (tx) => {
      return tx.device.create({ data });
    });
  }

  async findByAdminId(adminId: string, search?: string) {
    return prisma.device.findMany({
      where: {
        adminId,
        deletedAt: null,
        OR: [
          { status: "ACTIVE" },
          { status: "SOLD_PENDING" },
        ],
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { serialNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        admin: true,
        client: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.device.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.DeviceUpdateInput) {
    return prisma.$transaction(async (tx) => {
      return tx.device.update({
        where: { id },
        data,
      });
    });
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      return tx.device.delete({
        where: { id },
      });
    });
  }
}

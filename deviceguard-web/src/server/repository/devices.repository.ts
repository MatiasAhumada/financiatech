import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class DevicesRepository {
  async create(data: Prisma.DeviceCreateInput) {
    return prisma.device.create({ data });
  }

  async findAll() {
    return prisma.device.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.device.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.DeviceUpdateInput) {
    return prisma.device.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.device.delete({
      where: { id },
    });
  }
}

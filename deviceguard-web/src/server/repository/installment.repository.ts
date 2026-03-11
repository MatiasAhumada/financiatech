import { prisma } from "@/lib/prisma";
import { Installment, InstallmentStatus } from "@prisma/client";

export class InstallmentRepository {
  async findLastPendingByDeviceId(
    deviceId: string
  ): Promise<Installment | null> {
    return prisma.installment.findFirst({
      where: {
        deviceId,
        status: InstallmentStatus.PENDING,
      },
      orderBy: { number: "desc" },
    });
  }

  async findFirstPendingByDeviceId(
    deviceId: string
  ): Promise<Pick<Installment, "amount"> | null> {
    return prisma.installment.findFirst({
      where: {
        deviceId,
        status: InstallmentStatus.PENDING,
      },
      orderBy: { dueDate: "asc" },
      select: {
        amount: true,
      },
    });
  }
}

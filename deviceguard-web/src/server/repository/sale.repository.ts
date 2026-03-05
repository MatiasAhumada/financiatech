import { prisma } from "@/lib/prisma";
import { ISale } from "@/types";
import { DeviceStatus, PaymentFrequency } from "@prisma/client";

export class SaleRepository {
  async findByActivationCode(activationCode: string): Promise<ISale | null> {
    return prisma.sale.findUnique({
      where: { activationCode },
      include: {
        device: true,
        client: true,
      },
    });
  }

  async findByDeviceId(deviceId: string): Promise<ISale | null> {
    return prisma.sale.findUnique({
      where: { deviceId },
      include: {
        device: true,
        client: true,
      },
    });
  }

  async findByAdminId(adminId: string, search?: string) {
    return prisma.sale.findMany({
      where: {
        device: { adminId },
        deletedAt: null,
        ...(search && {
          OR: [
            { client: { name: { contains: search, mode: "insensitive" } } },
            {
              device: {
                serialNumber: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },
      include: {
        device: {
          include: {
            installments: { orderBy: { number: "asc" } },
          },
        },
        client: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createWithTransaction(data: {
    deviceId: string;
    clientId: string;
    totalAmount: number;
    initialPayment: number;
    installments: number;
    installmentAmount: number;
    paymentFrequency: PaymentFrequency;
    activationCode: string;
    daysPerInstallment: number;
    firstWarningDay: number;
    secondWarningDay: number;
    blockDay: number;
  }): Promise<ISale> {
    return prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: data.deviceId },
        data: {
          clientId: data.clientId,
          status: DeviceStatus.SOLD_PENDING,
        },
      });

      const sale = await tx.sale.create({
        data: {
          deviceId: data.deviceId,
          clientId: data.clientId,
          totalAmount: data.totalAmount,
          initialPayment: data.initialPayment,
          installments: data.installments,
          installmentAmount: data.installmentAmount,
          paymentFrequency: data.paymentFrequency,
          activationCode: data.activationCode,
        },
        include: {
          device: true,
          client: true,
        },
      });

      const financedAmount = data.totalAmount - data.initialPayment;

      await tx.paymentPlan.create({
        data: {
          deviceId: data.deviceId,
          totalAmount: financedAmount,
          installments: data.installments,
          monthlyAmount: data.installmentAmount,
          startDate: sale.saleDate,
          endDate: new Date(
            sale.saleDate.getTime() +
              data.installments * data.daysPerInstallment * 24 * 60 * 60 * 1000
          ),
        },
      });

      const installmentsData = Array.from(
        { length: data.installments },
        (_, i) => ({
          deviceId: data.deviceId,
          number: i + 1,
          amount: data.installmentAmount,
          dueDate: new Date(
            sale.saleDate.getTime() +
              (i + 1) * data.daysPerInstallment * 24 * 60 * 60 * 1000
          ),
          status: "PENDING" as const,
        })
      );

      await tx.installment.createMany({
        data: installmentsData,
      });

      await tx.blockRule.create({
        data: {
          deviceId: data.deviceId,
          firstWarningDay: data.firstWarningDay,
          secondWarningDay: data.secondWarningDay,
          blockDay: data.blockDay,
        },
      });

      return sale;
    });
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id } });

      if (sale) {
        await tx.device.update({
          where: { id: sale.deviceId },
          data: { status: DeviceStatus.ACTIVE, clientId: null },
        });

        await tx.installment.deleteMany({ where: { deviceId: sale.deviceId } });
        await tx.paymentPlan.deleteMany({ where: { deviceId: sale.deviceId } });
        await tx.blockRule.deleteMany({ where: { deviceId: sale.deviceId } });
        await tx.deviceSync.deleteMany({ where: { deviceId: sale.deviceId } });

        return tx.sale.delete({ where: { id } });
      }
    });
  }

  async updateWithTransaction(
    id: string,
    data: {
      deviceId: string;
      clientId: string;
      totalAmount: number;
      initialPayment: number;
      installments: number;
      installmentAmount: number;
      paymentFrequency: PaymentFrequency;
      daysPerInstallment: number;
      firstWarningDay: number;
      secondWarningDay: number;
      blockDay: number;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const oldSale = await tx.sale.findUnique({ where: { id } });

      if (oldSale && oldSale.deviceId !== data.deviceId) {
        await tx.device.update({
          where: { id: oldSale.deviceId },
          data: { status: DeviceStatus.ACTIVE, clientId: null },
        });
      }

      await tx.device.update({
        where: { id: data.deviceId },
        data: { clientId: data.clientId, status: DeviceStatus.SOLD_PENDING },
      });

      const sale = await tx.sale.update({
        where: { id },
        data: {
          deviceId: data.deviceId,
          clientId: data.clientId,
          totalAmount: data.totalAmount,
          initialPayment: data.initialPayment,
          installments: data.installments,
          installmentAmount: data.installmentAmount,
          paymentFrequency: data.paymentFrequency,
        },
        include: { device: true, client: true },
      });

      const financedAmount = data.totalAmount - data.initialPayment;

      await tx.paymentPlan.updateMany({
        where: { deviceId: data.deviceId },
        data: {
          totalAmount: financedAmount,
          installments: data.installments,
          monthlyAmount: data.installmentAmount,
          endDate: new Date(
            Date.now() +
              data.installments * data.daysPerInstallment * 24 * 60 * 60 * 1000
          ),
        },
      });

      await tx.installment.deleteMany({ where: { deviceId: data.deviceId } });

      const updatedSale = await tx.sale.findUnique({ where: { id } });

      const installmentsData = Array.from(
        { length: data.installments },
        (_, i) => ({
          deviceId: data.deviceId,
          number: i + 1,
          amount: data.installmentAmount,
          dueDate: new Date(
            updatedSale!.saleDate.getTime() +
              (i + 1) * data.daysPerInstallment * 24 * 60 * 60 * 1000
          ),
          status: "PENDING" as const,
        })
      );

      await tx.installment.createMany({ data: installmentsData });

      await tx.blockRule.updateMany({
        where: { deviceId: data.deviceId },
        data: {
          firstWarningDay: data.firstWarningDay,
          secondWarningDay: data.secondWarningDay,
          blockDay: data.blockDay,
        },
      });

      return sale;
    });
  }
}

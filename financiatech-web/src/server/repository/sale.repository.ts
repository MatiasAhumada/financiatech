import { prisma } from "@/lib/prisma";
import { ISale, IInstallment, SalesStats } from "@/types";
import { DeviceStatus, PaymentFrequency } from "@prisma/client";

export class SaleRepository {
  async findByActivationCode(activationCode: string) {
    return prisma.sale.findFirst({
      where: { activationCode },
      include: {
        device: {
          include: {
            installments: { orderBy: { number: "asc" } },
          },
        },
        client: true,
      },
    });
  }

  async findByActivationCodeAll(activationCode: string) {
    return prisma.sale.findMany({
      where: { activationCode },
      include: {
        device: {
          include: {
            installments: { orderBy: { number: "asc" } },
          },
        },
        client: true,
      },
    });
  }

  async findByDeviceId(deviceId: string) {
    return prisma.sale.findUnique({
      where: { deviceId },
      include: {
        device: true,
        client: true,
      },
    });
  }

  async findByAdminId(adminId: string, search?: string): Promise<ISale[]> {
    const sales = await prisma.sale.findMany({
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

    return sales as ISale[];
  }

  async getStats(adminId: string): Promise<SalesStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySalesCount, statusCounts, avgTicketResult] = await Promise.all([
      prisma.sale.count({
        where: {
          device: { adminId },
          createdAt: { gte: today },
          deletedAt: null,
        },
      }),
      prisma.sale.groupBy({
        by: ["deviceId"],
        where: {
          device: { adminId },
          deletedAt: null,
        },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          device: { adminId },
          deletedAt: null,
        },
        _avg: { totalAmount: true },
      }),
    ]);

    const deviceIds = statusCounts.map((s) => s.deviceId);
    const devices = await prisma.device.findMany({
      where: { id: { in: deviceIds } },
      select: { id: true, status: true },
    });

    const deviceStatusMap = new Map(devices.map((d) => [d.id, d.status]));

    let newDevices = 0;
    let pendingPayments = 0;

    statusCounts.forEach((item) => {
      const status = deviceStatusMap.get(item.deviceId);
      if (status === DeviceStatus.ACTIVE) {
        newDevices += item._count;
      }
      if (status === DeviceStatus.SOLD_PENDING) {
        pendingPayments += item._count;
      }
    });

    return {
      todaySales: todaySalesCount,
      newDevices,
      pendingPayments,
      avgTicket: Number(avgTicketResult._avg.totalAmount) || 0,
    };
  }

  async getInstallmentsBySaleId(saleId: string): Promise<IInstallment[]> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        device: {
          include: {
            installments: { orderBy: { number: "asc" } },
          },
        },
      },
    });

    if (!sale) {
      return [];
    }

    return sale.device.installments as IInstallment[];
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
  }) {
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

  async createMultipleWithTransaction(data: {
    deviceIds: string[];
    deviceAmounts: number[];
    clientId: string;
    totalAmount: number;
    initialPayment: number;
    installments: number;
    installmentAmount: number;
    paymentFrequency: PaymentFrequency;
    activationCode: string;
    deviceCount: number;
    daysPerInstallment: number;
    firstWarningDay: number;
    secondWarningDay: number;
    blockDay: number;
  }) {
    return prisma.$transaction(async (tx) => {
      for (const deviceId of data.deviceIds) {
        await tx.device.update({
          where: { id: deviceId },
          data: {
            clientId: data.clientId,
            status: DeviceStatus.SOLD_PENDING,
          },
        });
      }

      const salesData = data.deviceIds.map((deviceId, index) => ({
        deviceId,
        clientId: data.clientId,
        totalAmount: data.deviceAmounts[index],
        initialPayment: 0,
        installments: data.installments,
        installmentAmount: data.installmentAmount,
        paymentFrequency: data.paymentFrequency,
        activationCode: data.activationCode,
        deviceCount: data.deviceCount,
      }));

      const sales = await tx.sale.createManyAndReturn({
        data: salesData,
        include: {
          device: true,
          client: true,
        },
      });

      const firstSale = sales[0];
      const saleDate = firstSale?.saleDate;

      for (let i = 0; i < data.deviceIds.length; i++) {
        const deviceId = data.deviceIds[i];
        const deviceAmount = data.deviceAmounts[i];
        const financedAmount = deviceAmount - 0;

        await tx.paymentPlan.create({
          data: {
            deviceId,
            totalAmount: financedAmount,
            installments: data.installments,
            monthlyAmount: data.installmentAmount,
            startDate: saleDate,
            endDate: new Date(
              saleDate.getTime() +
                data.installments *
                  data.daysPerInstallment *
                  24 *
                  60 *
                  60 *
                  1000
            ),
          },
        });

        const installmentsData = Array.from(
          { length: data.installments },
          (_, idx) => ({
            deviceId,
            number: idx + 1,
            amount: data.installmentAmount,
            dueDate: new Date(
              saleDate.getTime() +
                (idx + 1) * data.daysPerInstallment * 24 * 60 * 60 * 1000
            ),
            status: "PENDING" as const,
          })
        );

        await tx.installment.createMany({
          data: installmentsData,
        });

        await tx.blockRule.create({
          data: {
            deviceId,
            firstWarningDay: data.firstWarningDay,
            secondWarningDay: data.secondWarningDay,
            blockDay: data.blockDay,
          },
        });
      }

      return firstSale;
    });
  }

  async updateMultipleWithTransaction(
    id: string,
    data: {
      deviceIds: string[];
      deviceAmounts: number[];
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
      const oldDeviceId = oldSale?.deviceId;

      if (oldDeviceId && !data.deviceIds.includes(oldDeviceId)) {
        await tx.device.update({
          where: { id: oldDeviceId },
          data: { status: DeviceStatus.ACTIVE, clientId: null },
        });
      }

      for (const deviceId of data.deviceIds) {
        await tx.device.update({
          where: { id: deviceId },
          data: { clientId: data.clientId, status: DeviceStatus.SOLD_PENDING },
        });
      }

      const sales = await Promise.all(
        data.deviceIds.map((deviceId, index) =>
          tx.sale.upsert({
            where: { deviceId },
            create: {
              deviceId,
              clientId: data.clientId,
              totalAmount: data.deviceAmounts[index],
              initialPayment: data.initialPayment,
              installments: data.installments,
              installmentAmount: data.installmentAmount,
              paymentFrequency: data.paymentFrequency,
              activationCode: oldSale?.activationCode || "",
              deviceCount: data.deviceIds.length,
            },
            update: {
              clientId: data.clientId,
              totalAmount: data.deviceAmounts[index],
              initialPayment: data.initialPayment,
              installments: data.installments,
              installmentAmount: data.installmentAmount,
              paymentFrequency: data.paymentFrequency,
            },
            include: { device: true, client: true },
          })
        )
      );

      const firstSale = sales[0];
      const saleDate = firstSale?.saleDate;

      for (let i = 0; i < data.deviceIds.length; i++) {
        const deviceId = data.deviceIds[i];
        const deviceAmount = data.deviceAmounts[i];

        await tx.paymentPlan.updateMany({
          where: { deviceId },
          data: {
            totalAmount: deviceAmount - data.initialPayment,
            installments: data.installments,
            monthlyAmount: data.installmentAmount,
            endDate: new Date(
              Date.now() +
                data.installments *
                  data.daysPerInstallment *
                  24 *
                  60 *
                  60 *
                  1000
            ),
          },
        });

        await tx.installment.deleteMany({ where: { deviceId } });

        const installmentsData = Array.from(
          { length: data.installments },
          (_, idx) => ({
            deviceId,
            number: idx + 1,
            amount: data.installmentAmount,
            dueDate: new Date(
              saleDate!.getTime() +
                (idx + 1) * data.daysPerInstallment * 24 * 60 * 60 * 1000
            ),
            status: "PENDING" as const,
          })
        );

        await tx.installment.createMany({ data: installmentsData });

        await tx.blockRule.updateMany({
          where: { deviceId },
          data: {
            firstWarningDay: data.firstWarningDay,
            secondWarningDay: data.secondWarningDay,
            blockDay: data.blockDay,
          },
        });
      }

      return firstSale;
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

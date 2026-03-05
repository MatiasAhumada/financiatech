import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class FinancingPlanRepository {
  async create(data: Prisma.FinancingPlanCreateInput) {
    return prisma.financingPlan.create({ data });
  }

  async findByAdminId(adminId: string) {
    return prisma.financingPlan.findMany({
      where: { adminId, deletedAt: null },
      orderBy: [
        { paymentFrequency: Prisma.SortOrder.asc },
        { installments: Prisma.SortOrder.asc },
      ],
    });
  }

  async findById(id: string) {
    return prisma.financingPlan.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.FinancingPlanUpdateInput) {
    return prisma.financingPlan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.financingPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

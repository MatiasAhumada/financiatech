import { FinancingPlanRepository } from "../repository/financingPlan.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";

export class FinancingPlanService {
  private financingPlanRepository: FinancingPlanRepository;

  constructor() {
    this.financingPlanRepository = new FinancingPlanRepository();
  }

  async create(data: {
    name: string;
    installments: number;
    interestRate: number;
    adminId: string;
  }) {
    return this.financingPlanRepository.create({
      name: data.name,
      installments: data.installments,
      interestRate: data.interestRate,
      admin: { connect: { id: data.adminId } },
    });
  }

  async findByAdminId(adminId: string) {
    return this.financingPlanRepository.findByAdminId(adminId);
  }

  async findById(id: string) {
    const plan = await this.financingPlanRepository.findById(id);

    if (!plan) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Plan de financiamiento no encontrado",
      });
    }

    return plan;
  }

  async update(
    id: string,
    data: { name: string; installments: number; interestRate: number }
  ) {
    await this.findById(id);

    return this.financingPlanRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);

    return this.financingPlanRepository.delete(id);
  }
}

export const financingPlanService = new FinancingPlanService();

import { SaleRepository } from "../repository/sale.repository";
import { DevicesRepository } from "../repository/devices.repository";
import { FinancingPlanRepository } from "../repository/financingPlan.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { ISale } from "@/types";
import { PAYMENT_FREQUENCY_DAYS } from "@/constants/paymentFrequency.constant";
import { BLOCK_RULES_BY_FREQUENCY } from "@/constants/blockRules.constant";
import httpStatus from "http-status";
import { CreateSaleDto } from "@/schemas/sale.schema";

function generateActivationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class SaleService {
  private saleRepository: SaleRepository;
  private devicesRepository: DevicesRepository;
  private financingPlanRepository: FinancingPlanRepository;

  constructor() {
    this.saleRepository = new SaleRepository();
    this.devicesRepository = new DevicesRepository();
    this.financingPlanRepository = new FinancingPlanRepository();
  }

  async create(data: CreateSaleDto): Promise<ISale> {
    const device = await this.devicesRepository.findById(data.deviceId);

    if (!device) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    if (device.clientId && device.status !== "SOLD_PENDING") {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "El dispositivo ya está vendido",
      });
    }

    const plan = await this.financingPlanRepository.findById(data.financingPlanId);

    if (!plan) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Plan de financiamiento no encontrado",
      });
    }

    const financedAmount = data.totalAmount - data.initialPayment;
    const totalWithInterest = financedAmount * (1 + Number(plan.interestRate) / 100);
    const installmentAmount = totalWithInterest / data.installments;
    const activationCode = generateActivationCode();
    const daysPerInstallment = PAYMENT_FREQUENCY_DAYS[data.paymentFrequency];
    const blockRules = BLOCK_RULES_BY_FREQUENCY[data.paymentFrequency];

    return this.saleRepository.createWithTransaction({
      deviceId: data.deviceId,
      clientId: data.clientId,
      totalAmount: data.totalAmount,
      initialPayment: data.initialPayment,
      installments: data.installments,
      installmentAmount,
      paymentFrequency: data.paymentFrequency,
      activationCode,
      daysPerInstallment,
      firstWarningDay: data.firstWarningDay ?? blockRules.firstWarningDay,
      secondWarningDay: data.secondWarningDay ?? blockRules.secondWarningDay,
      blockDay: data.blockDay ?? blockRules.blockDay,
    });
  }

  async findByActivationCode(activationCode: string): Promise<ISale | null> {
    return this.saleRepository.findByActivationCode(activationCode);
  }

  async findByAdminId(adminId: string, search?: string) {
    return this.saleRepository.findByAdminId(adminId, search);
  }

  async delete(id: string) {
    return this.saleRepository.delete(id);
  }

  async update(id: string, data: CreateSaleDto) {
    const sale = await this.saleRepository.findByDeviceId(data.deviceId);

    if (sale && sale.id !== id) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "El dispositivo ya tiene una venta asociada",
      });
    }

    const device = await this.devicesRepository.findById(data.deviceId);

    if (!device) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    const plan = await this.financingPlanRepository.findById(data.financingPlanId);

    if (!plan) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Plan de financiamiento no encontrado",
      });
    }

    const financedAmount = data.totalAmount - data.initialPayment;
    const totalWithInterest = financedAmount * (1 + Number(plan.interestRate) / 100);
    const installmentAmount = totalWithInterest / data.installments;
    const daysPerInstallment = PAYMENT_FREQUENCY_DAYS[data.paymentFrequency];
    const blockRules = BLOCK_RULES_BY_FREQUENCY[data.paymentFrequency];

    return this.saleRepository.updateWithTransaction(id, {
      deviceId: data.deviceId,
      clientId: data.clientId,
      totalAmount: data.totalAmount,
      initialPayment: data.initialPayment,
      installments: data.installments,
      installmentAmount,
      paymentFrequency: data.paymentFrequency,
      daysPerInstallment,
      firstWarningDay: data.firstWarningDay ?? blockRules.firstWarningDay,
      secondWarningDay: data.secondWarningDay ?? blockRules.secondWarningDay,
      blockDay: data.blockDay ?? blockRules.blockDay,
    });
  }
}

export const saleService = new SaleService();

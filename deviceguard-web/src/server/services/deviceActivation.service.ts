import { DeviceSyncRepository } from "../repository/deviceSync.repository";
import { InstallmentRepository } from "../repository/installment.repository";
import { SaleRepository } from "../repository/sale.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { batchUpdater } from "@/lib/batchUpdater";
import { IDeviceSync, DeviceStatusCheckResult } from "@/types";
import httpStatus from "http-status";
import { DeviceStatus, InstallmentStatus } from "@prisma/client";

export interface ActivationResult {
  success: boolean;
  deviceName: string;
  deviceId: string;
  imei: string;
  adminName: string;
  sync: IDeviceSync;
}

export class DeviceActivationService {
  private deviceSyncRepository: DeviceSyncRepository;
  private installmentRepository: InstallmentRepository;
  private saleRepository: SaleRepository;

  constructor() {
    this.deviceSyncRepository = new DeviceSyncRepository();
    this.installmentRepository = new InstallmentRepository();
    this.saleRepository = new SaleRepository();
  }

  async activate(
    activationCode: string,
    imei: string,
    fcmToken?: string
  ): Promise<ActivationResult> {
    const sale = await this.saleRepository.findByActivationCode(activationCode);

    if (!sale) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Código de activación inválido",
      });
    }

    if (sale.device.status === DeviceStatus.SOLD_SYNCED) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "El dispositivo ya está activado",
      });
    }

    const existingSync = await this.deviceSyncRepository.findByImei(imei);

    if (existingSync) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "Este IMEI ya está registrado",
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: sale.deviceId },
        data: { status: DeviceStatus.SOLD_SYNCED },
      });

      const sync = await tx.deviceSync.create({
        data: {
          deviceId: sale.deviceId,
          imei,
          fcmToken: fcmToken || null,
        },
        include: {
          device: true,
        },
      });

      console.log(
        "[ACTIVATION] DeviceSync created with FCM token:",
        fcmToken ? "YES" : "NO"
      );

      const deviceWithAdmin = await tx.device.findUnique({
        where: { id: sale.deviceId },
        select: {
          name: true,
          admin: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      const adminName = deviceWithAdmin?.admin?.user?.name ?? "Administrador";

      return {
        success: true,
        deviceName: sale.device.name,
        deviceId: sale.deviceId,
        imei,
        adminName,
        sync,
      };
    });
  }

  async checkStatus(imei: string): Promise<DeviceStatusCheckResult> {
    const cacheKey = `device:${imei}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      this.addLastPingUpdate(imei);
      return cached;
    }

    const deviceStatus =
      await this.deviceSyncRepository.findDeviceStatusByImei(imei);

    if (!deviceStatus) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    this.addLastPingUpdate(deviceStatus.deviceId);

    const isBlocked = deviceStatus.status === DeviceStatus.BLOCKED;

    let pendingAmount = 0;
    if (isBlocked) {
      const pendingInstallment =
        await this.installmentRepository.findFirstPendingByDeviceId(
          deviceStatus.deviceId
        );

      pendingAmount = pendingInstallment
        ? Number(pendingInstallment.amount)
        : 0;
    }

    const result: DeviceStatusCheckResult = {
      blocked: isBlocked,
      status: deviceStatus.status,
      message: isBlocked
        ? "Dispositivo bloqueado por mora en pagos"
        : "Dispositivo activo",
      pendingAmount,
      deviceName: deviceStatus.deviceName,
      adminName: deviceStatus.adminName,
    };

    cache.set(cacheKey, result);

    return result;
  }

  private addLastPingUpdate(deviceIdOrImei: string): void {
    batchUpdater.addDeviceId(deviceIdOrImei);
  }

  async getSyncStatus(
    activationCode: string
  ): Promise<{ synced: boolean; deviceName: string }> {
    const sale = await this.saleRepository.findByActivationCode(activationCode);

    if (!sale) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Código de activación no encontrado",
      });
    }

    const synced = sale.device.status === DeviceStatus.SOLD_SYNCED;

    return {
      synced,
      deviceName: sale.device.name,
    };
  }
}

export const deviceActivationService = new DeviceActivationService();

import { DeviceSyncRepository } from "../repository/deviceSync.repository";
import { InstallmentRepository } from "../repository/installment.repository";
import { SaleRepository } from "../repository/sale.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { prisma } from "@/lib/prisma";
import { IDeviceSync } from "@/types";
import httpStatus from "http-status";
import { DeviceStatus } from "@prisma/client";

/**
 * Respuesta de la activación enriquecida con los datos que la app mobile
 * necesita mostrar en la pantalla linking-success.tsx
 */
export interface ActivationResult {
  success: boolean;
  /** Nombre del dispositivo registrado en la venta (ej: "Samsung Galaxy A54") */
  deviceName: string;
  /** ID interno del dispositivo en la BD */
  deviceId: string;
  /** Nombre del admin/negocio propietario del plan de financiamiento */
  adminName: string;
  /** Registro de sincronización creado */
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
      // 1. Actualizar el estado del dispositivo a SOLD_SYNCED
      await tx.device.update({
        where: { id: sale.deviceId },
        data: { status: DeviceStatus.SOLD_SYNCED },
      });

      // 2. Crear el registro DeviceSync con el FCM token si se proporcionó
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

      console.log('[ACTIVATION] DeviceSync created with FCM token:', fcmToken ? 'YES' : 'NO');

      // 3. Obtener el nombre del admin/negocio para la respuesta a la app mobile.
      //    Se hace una query separada dentro de la misma transacción para no
      //    alterar la forma de IDeviceSync ni IDevice.
      const deviceWithAdmin = await tx.device.findUnique({
        where: { id: sale.deviceId },
        include: {
          admin: {
            include: { user: true },
          },
        },
      });

      const adminName = deviceWithAdmin?.admin?.user?.name ?? "Administrador";

      return {
        success: true,
        deviceName: sale.device.name,
        deviceId: sale.deviceId,
        adminName,
        sync,
      };
    });
  }

  async checkStatus(imei: string) {
    const sync = await this.deviceSyncRepository.findByImeiWithDetails(imei);

    if (!sync) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    await this.deviceSyncRepository.updateLastPing(sync.deviceId);

    // obtiene la última cuota pendiente usando el repository
    const pendingInstallment =
      await this.installmentRepository.findLastPendingByDeviceId(sync.deviceId);

    const pendingAmount = pendingInstallment
      ? Number(pendingInstallment.amount.toString())
      : 0;

    const deviceName = sync.device.name;
    const adminName = sync.device.admin?.user?.name ?? "Administrador";

    return {
      blocked: sync.device.status === DeviceStatus.BLOCKED,
      status: sync.device.status,
      message:
        sync.device.status === DeviceStatus.BLOCKED
          ? "Dispositivo bloqueado por mora en pagos"
          : "Dispositivo activo",
      pendingAmount,
      deviceName,
      adminName,
    };
  }

  /**
   * Consulta si una venta ya tiene su dispositivo vinculado.
   * Usado por el polling del frontend web (ActivationCodeDisplay)
   * via GET /api/sales/[activationCode]/sync
   */
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

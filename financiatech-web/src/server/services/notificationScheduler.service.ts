import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/services/firebase.service";
import { fcmService } from "@/lib/fcm";
import {
  NotificationType,
  DeviceStatus,
  InstallmentStatus,
  PaymentFrequency,
  NotificationTrigger,
} from "@prisma/client";

interface DeviceWithRelations {
  id: string;
  name: string;
  status: DeviceStatus;
  blockRule: {
    firstWarningDay: number;
    secondWarningDay: number;
    blockDay: number;
  } | null;
  sales: Array<{
    saleDate: Date;
    paymentFrequency: PaymentFrequency;
    installments: number;
  }>;
  installments: Array<{
    id: string;
    number: number;
    status: InstallmentStatus;
    dueDate: Date;
  }>;
  sync: {
    fcmToken: string | null;
    imei: string;
  } | null;
  client: {
    name: string;
  } | null;
}

interface NotificationResult {
  deviceId: string;
  deviceName: string;
  clientName: string;
  installmentNumber?: number;
  instance: "warning1" | "warning2" | "block" | "block_warning";
  success: boolean;
  message: string;
}

export const notificationSchedulerService = {
  async processWarning1(): Promise<NotificationResult[]> {
    const devices = await this.getDevicesNeedingNotification("warning1");
    const results: NotificationResult[] = [];

    for (const device of devices) {
      try {
        const currentInstallment = this.getCurrentInstallment(device);
        const result = await this.sendNotification(
          device,
          NotificationType.WARNING_1,
          "warning1",
          currentInstallment
        );
        results.push(result);
      } catch (error) {
        results.push({
          deviceId: device.id,
          deviceName: device.name,
          clientName: device.client?.name || "Sin cliente",
          instance: "warning1",
          success: false,
          message: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return results;
  },

  async processWarning2(): Promise<NotificationResult[]> {
    const devices = await this.getDevicesNeedingNotification("warning2");
    const results: NotificationResult[] = [];

    for (const device of devices) {
      try {
        const currentInstallment = this.getCurrentInstallment(device);
        const result = await this.sendNotification(
          device,
          NotificationType.WARNING_2,
          "warning2",
          currentInstallment
        );
        results.push(result);
      } catch (error) {
        results.push({
          deviceId: device.id,
          deviceName: device.name,
          clientName: device.client?.name || "Sin cliente",
          instance: "warning2",
          success: false,
          message: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return results;
  },

  async processBlockDay(): Promise<NotificationResult[]> {
    const devices = await this.getDevicesNeedingBlock();
    const results: NotificationResult[] = [];

    for (const device of devices) {
      try {
        const currentInstallment = this.getCurrentInstallment(device);
        const blockResult = await this.executeDeviceBlock(
          device,
          currentInstallment
        );
        results.push(blockResult);
      } catch (error) {
        results.push({
          deviceId: device.id,
          deviceName: device.name,
          clientName: device.client?.name || "Sin cliente",
          instance: "block",
          success: false,
          message: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return results;
  },

  async processBlockWarning(): Promise<NotificationResult[]> {
    const devices = await this.getDevicesNeedingBlockWarning();
    const results: NotificationResult[] = [];

    for (const device of devices) {
      try {
        const currentInstallment = this.getCurrentInstallment(device);
        const result = await this.sendBlockWarningNotification(
          device,
          currentInstallment
        );
        results.push(result);
      } catch (error) {
        results.push({
          deviceId: device.id,
          deviceName: device.name,
          clientName: device.client?.name || "Sin cliente",
          instance: "block_warning",
          success: false,
          message: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return results;
  },

  async getDevicesNeedingNotification(
    instance: "warning1" | "warning2"
  ): Promise<DeviceWithRelations[]> {
    const now = new Date();
    const dayField =
      instance === "warning1" ? "firstWarningDay" : "secondWarningDay";
    const notificationType =
      instance === "warning1"
        ? NotificationType.WARNING_1
        : NotificationType.WARNING_2;

    const devices = await prisma.device.findMany({
      where: {
        status: DeviceStatus.SOLD_SYNCED,
        blockRule: {
          isActive: true,
        },
        sales: {
          some: {},
        },
      },
      include: {
        blockRule: true,
        sales: true,
        installments: {
          where: {
            status: InstallmentStatus.PENDING,
          },
          orderBy: {
            number: "asc",
          },
        },
        sync: true,
        client: true,
      },
    });

    const filteredDevices = devices.filter((device: DeviceWithRelations) => {
      if (
        !device.blockRule ||
        device.sales.length === 0 ||
        device.installments.length === 0
      )
        return false;

      const sale = device.sales[0];
      const currentDay = this.getCurrentDay(sale.paymentFrequency, now);
      const targetDay = device.blockRule[dayField];

      if (currentDay !== targetDay) return false;

      const currentInstallment = this.getCurrentInstallment(device);
      if (!currentInstallment) return false;

      const hasNotification = this.hasNotificationForInstallment(
        device.id,
        notificationType,
        currentInstallment.id
      );

      return !hasNotification;
    });

    return filteredDevices;
  },

  async getDevicesNeedingBlockWarning(): Promise<DeviceWithRelations[]> {
    const devices = await prisma.device.findMany({
      where: {
        status: DeviceStatus.SOLD_SYNCED,
        blockRule: {
          isActive: true,
        },
        sales: {
          some: {},
        },
      },
      include: {
        blockRule: true,
        sales: true,
        installments: {
          where: {
            status: InstallmentStatus.PENDING,
          },
          orderBy: {
            number: "asc",
          },
        },
        sync: true,
        client: true,
      },
    });

    const filteredDevices = devices.filter((device: DeviceWithRelations) => {
      if (
        !device.blockRule ||
        device.sales.length === 0 ||
        device.installments.length === 0
      )
        return false;

      const sale = device.sales[0];
      const now = new Date();
      const currentDay = this.getCurrentDay(sale.paymentFrequency, now);
      const blockWarningDay = device.blockRule.blockDay - 1;

      if (currentDay !== blockWarningDay) return false;

      const currentInstallment = this.getCurrentInstallment(device);
      if (!currentInstallment) return false;

      const hasBlockWarning = this.hasNotificationForInstallment(
        device.id,
        NotificationType.BLOCKED,
        currentInstallment.id,
        true
      );

      return !hasBlockWarning;
    });

    return filteredDevices;
  },

  async getDevicesNeedingBlock(): Promise<DeviceWithRelations[]> {
    const devices = await prisma.device.findMany({
      where: {
        status: DeviceStatus.SOLD_SYNCED,
        blockRule: {
          isActive: true,
        },
        sales: {
          some: {},
        },
      },
      include: {
        blockRule: true,
        sales: true,
        installments: {
          where: {
            status: InstallmentStatus.PENDING,
          },
          orderBy: {
            number: "asc",
          },
        },
        sync: true,
        client: true,
      },
    });

    const filteredDevices = devices.filter((device: DeviceWithRelations) => {
      if (
        !device.blockRule ||
        device.sales.length === 0 ||
        device.installments.length === 0
      )
        return false;

      const sale = device.sales[0];
      const now = new Date();
      const currentDay = this.getCurrentDay(sale.paymentFrequency, now);

      if (currentDay !== device.blockRule.blockDay) return false;

      const currentInstallment = this.getCurrentInstallment(device);
      if (!currentInstallment) return false;

      const hasBlockNotification = this.hasNotificationForInstallment(
        device.id,
        NotificationType.BLOCKED,
        currentInstallment.id
      );

      return !hasBlockNotification;
    });

    return filteredDevices;
  },

  getCurrentDay(frequency: PaymentFrequency, date: Date): number {
    switch (frequency) {
      case PaymentFrequency.WEEKLY:
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 ? 7 : dayOfWeek;

      case PaymentFrequency.BIWEEKLY:
        const dayOfMonth = date.getDate();
        const isSecondFortnight = dayOfMonth > 15;
        return isSecondFortnight ? dayOfMonth - 13 : dayOfMonth;

      case PaymentFrequency.MONTHLY:
        return date.getDate();

      default:
        return date.getDate();
    }
  },

  getCurrentInstallment(device: DeviceWithRelations) {
    if (!device.installments || device.installments.length === 0) return null;
    return device.installments[0];
  },

  async hasNotificationForInstallment(
    deviceId: string,
    type: NotificationType,
    installmentId: string,
    isBlockWarning = false
  ): Promise<boolean> {
    const count = await prisma.notification.count({
      where: {
        deviceId,
        type,
        installmentId: isBlockWarning ? undefined : installmentId,
      },
    });

    return count > 0;
  },

  async sendNotification(
    device: DeviceWithRelations,
    type: NotificationType,
    instance: "warning1" | "warning2",
    installment: { id: string; number: number } | null,
    trigger: NotificationTrigger = NotificationTrigger.SCHEDULED
  ): Promise<NotificationResult> {
    const installmentNumber = installment?.number;
    const now = new Date();
    const messages: Record<string, string> = {
      warning1: `⚠️ Recordatorio: Tu cuota #${installmentNumber || "N"} vence pronto. Por favor realiza el pago para evitar el bloqueo de tu equipo.`,
      warning2: `⚠️ Último aviso: Tu cuota #${installmentNumber || "N"} está por vencer. Realiza el pago inmediatamente para evitar el bloqueo de tu equipo.`,
    };

    const message = messages[instance];

    await prisma.notification.create({
      data: {
        deviceId: device.id,
        installmentId: installment?.id,
        type,
        trigger,
        dayOfWeek: now.getDay() === 0 ? 7 : now.getDay(),
        dayOfMonth: now.getDate(),
        message,
        success: true,
        sentAt: now,
      },
    });

    if (device.sync?.fcmToken) {
      try {
        await sendPushNotification(device.sync.fcmToken, {
          title:
            instance === "warning1"
              ? "⚠️ Primer Aviso de Pago"
              : "⚠️ Segundo Aviso de Pago",
          body: message,
          data: {
            type: instance,
            deviceId: device.id,
            deviceName: device.name,
            installmentNumber: installmentNumber?.toString() || "",
          },
        });
      } catch (error) {
        await prisma.notification.create({
          data: {
            deviceId: device.id,
            installmentId: installment?.id,
            type,
            trigger,
            dayOfWeek: now.getDay() === 0 ? 7 : now.getDay(),
            dayOfMonth: now.getDate(),
            message,
            success: false,
            errorMessage:
              error instanceof Error ? error.message : "Error enviando FCM",
            sentAt: now,
          },
        });
      }
    }

    return {
      deviceId: device.id,
      deviceName: device.name,
      clientName: device.client?.name || "Sin cliente",
      installmentNumber,
      instance,
      success: true,
      message: "Notificación enviada correctamente",
    };
  },

  async sendBlockWarningNotification(
    device: DeviceWithRelations,
    installment: { id: string; number: number } | null,
    trigger: NotificationTrigger = NotificationTrigger.SCHEDULED
  ): Promise<NotificationResult> {
    const installmentNumber = installment?.number;
    const now = new Date();
    const message = `⏰ ATENCIÓN: Tu equipo se bloqueará automáticamente en 4 horas (Cuota #${installmentNumber || "N"}). Realiza el pago inmediatamente para evitar el bloqueo.`;

    await prisma.notification.create({
      data: {
        deviceId: device.id,
        installmentId: installment?.id,
        type: NotificationType.BLOCKED,
        trigger,
        dayOfWeek: now.getDay() === 0 ? 7 : now.getDay(),
        dayOfMonth: now.getDate(),
        message,
        success: true,
        sentAt: now,
      },
    });

    if (device.sync?.fcmToken) {
      try {
        await sendPushNotification(device.sync.fcmToken, {
          title: "⏰ Alerta de Bloqueo Inminente",
          body: message,
          data: {
            type: "block_warning",
            deviceId: device.id,
            deviceName: device.name,
            hoursUntilBlock: "4",
            installmentNumber: installmentNumber?.toString() || "",
          },
        });
      } catch (error) {
        console.error(
          `Error sending block warning FCM to device ${device.id}:`,
          error
        );
      }
    }

    if (device.sync?.imei) {
      try {
        await fcmService.sendToDevice(device.sync.imei, {
          type: "DEVICE_BLOCKED",
          deviceId: device.id,
          imei: device.sync.imei,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          `Error sending block warning command to device ${device.id}:`,
          error
        );
      }
    }

    return {
      deviceId: device.id,
      deviceName: device.name,
      clientName: device.client?.name || "Sin cliente",
      installmentNumber,
      instance: "block_warning",
      success: true,
      message: "Advertencia de bloqueo enviada correctamente",
    };
  },

  async executeDeviceBlock(
    device: DeviceWithRelations,
    installment: { id: string; number: number } | null,
    trigger: NotificationTrigger = NotificationTrigger.SCHEDULED
  ): Promise<NotificationResult> {
    const installmentNumber = installment?.number;
    const now = new Date();
    const message = `🔒 Tu equipo ha sido bloqueado por falta de pago de la cuota #${installmentNumber || "N"}. Contacta con nosotros para regularizar tu situación.`;

    await prisma.notification.create({
      data: {
        deviceId: device.id,
        installmentId: installment?.id,
        type: NotificationType.BLOCKED,
        trigger,
        dayOfWeek: now.getDay() === 0 ? 7 : now.getDay(),
        dayOfMonth: now.getDate(),
        message,
        success: true,
        executedBy:
          trigger === NotificationTrigger.MANUAL ? "admin" : undefined,
        sentAt: now,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: device.id },
        data: { status: DeviceStatus.BLOCKED },
      });

      if (device.sync) {
        await tx.pendingCommand.create({
          data: {
            deviceId: device.id,
            type: "DEVICE_BLOCKED",
            status: "PENDING",
          },
        });
      }
    });

    if (device.sync?.fcmToken) {
      try {
        await sendPushNotification(device.sync.fcmToken, {
          title: "🔒 Equipo Bloqueado",
          body: message,
          data: {
            type: "device_blocked",
            deviceId: device.id,
            deviceName: device.name,
            installmentNumber: installmentNumber?.toString() || "",
          },
        });
      } catch (error) {
        console.error(
          `Error sending block notification FCM to device ${device.id}:`,
          error
        );
      }
    }

    if (device.sync?.imei) {
      try {
        await fcmService.sendToDevice(device.sync.imei, {
          type: "DEVICE_BLOCKED",
          deviceId: device.id,
          imei: device.sync.imei,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          `Error sending block command to device ${device.id}:`,
          error
        );
      }
    }

    return {
      deviceId: device.id,
      deviceName: device.name,
      clientName: device.client?.name || "Sin cliente",
      installmentNumber,
      instance: "block",
      success: true,
      message: "Dispositivo bloqueado correctamente",
    };
  },

  async triggerManualNotification(
    deviceId: string,
    instance: "warning1" | "warning2" | "block_warning" | "block",
    userId: string
  ): Promise<NotificationResult> {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        blockRule: true,
        sales: true,
        installments: {
          where: { status: InstallmentStatus.PENDING },
          orderBy: { number: "asc" },
          take: 1,
        },
        sync: true,
        client: true,
      },
    });

    if (!device || device.sales.length === 0) {
      throw new Error("Dispositivo no encontrado o sin venta activa");
    }

    const deviceWithRelations = device as unknown as DeviceWithRelations;
    const currentInstallment =
      device.installments.length > 0 ? device.installments[0] : null;

    switch (instance) {
      case "warning1":
        return this.sendNotification(
          deviceWithRelations,
          NotificationType.WARNING_1,
          "warning1",
          currentInstallment,
          NotificationTrigger.MANUAL
        );
      case "warning2":
        return this.sendNotification(
          deviceWithRelations,
          NotificationType.WARNING_2,
          "warning2",
          currentInstallment,
          NotificationTrigger.MANUAL
        );
      case "block_warning":
        return this.sendBlockWarningNotification(
          deviceWithRelations,
          currentInstallment,
          NotificationTrigger.MANUAL
        );
      case "block":
        return this.executeDeviceBlock(
          deviceWithRelations,
          currentInstallment,
          NotificationTrigger.MANUAL
        );
      default:
        throw new Error("Instancia de notificación inválida");
    }
  },

  async getDeviceNotificationLogs(deviceId: string, limit = 50) {
    const logs = await prisma.notification.findMany({
      where: { deviceId },
      orderBy: { sentAt: "desc" },
      take: limit,
      include: {
        installment: {
          select: {
            number: true,
            dueDate: true,
          },
        },
      },
    });

    return logs;
  },

  async runFullScheduler(): Promise<{
    warning1: NotificationResult[];
    warning2: NotificationResult[];
    blockWarning: NotificationResult[];
    block: NotificationResult[];
  }> {
    const warning1 = await this.processWarning1();
    const warning2 = await this.processWarning2();
    const blockWarning = await this.processBlockWarning();
    const block = await this.processBlockDay();

    return { warning1, warning2, blockWarning, block };
  },
};

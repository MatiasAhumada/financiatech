import { prisma } from "@/lib/prisma";
import { Installment } from "@prisma/client";

export class InstallmentRepository {
  /**
   * Obtiene la última cuota (greater number) con estado PENDING para un dispositivo.
   * Se usa para saber el monto pendiente a cobrar cuando el equipo está bloqueado.
   */
  async findLastPendingByDeviceId(deviceId: string): Promise<Installment | null> {
    return prisma.installment.findFirst({
      where: {
        deviceId,
        status: "PENDING",
      },
      orderBy: { number: "desc" },
    });
  }
}

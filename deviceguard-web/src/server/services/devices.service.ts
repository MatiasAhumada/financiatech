import { DevicesRepository } from "../repository/devices.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { Prisma } from "@prisma/client";
import httpStatus from "http-status";

export class DevicesService {
  private devicesRepository: DevicesRepository;

  constructor() {
    this.devicesRepository = new DevicesRepository();
  }

  async create(data: Prisma.DeviceCreateInput) {
    try {
      return await this.devicesRepository.create(data);
    } catch (error) {
      this.handlePrismaError(error, "crear");
    }
  }

  async findByAdminId(adminId: string, search?: string) {
    return this.devicesRepository.findByAdminId(adminId, search);
  }

  async findById(id: string) {
    return this.devicesRepository.findById(id);
  }

  async update(id: string, data: Prisma.DeviceUpdateInput) {
    try {
      return await this.devicesRepository.update(id, data);
    } catch (error) {
      this.handlePrismaError(error, "actualizar");
    }
  }

  async delete(id: string) {
    return this.devicesRepository.delete(id);
  }

  /**
   * Convierte errores conocidos de Prisma en ApiError descriptivos.
   * P2002 → unique constraint violation (serial duplicado, etc.)
   */
  private handlePrismaError(error: unknown, action: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Extraer el campo que viola la restricción única
        const fields = (error.meta?.target as string[]) ?? [];
        const fieldLabel = fields.includes("serialNumber")
          ? "número de serie"
          : fields.join(", ");

        throw new ApiError({
          status: httpStatus.CONFLICT,
          message: `Ya existe un dispositivo con ese ${fieldLabel}. Verificá los datos e intentá con uno diferente.`,
        });
      }
    }

    // Cualquier otro error de Prisma o inesperado: re-lanzar para que
    // apiErrorHandler lo convierta en 500
    throw error;
  }
}

export const devicesService = new DevicesService();

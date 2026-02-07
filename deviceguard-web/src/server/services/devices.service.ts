import { DevicesRepository } from "../repository/devices.repository";
import { Prisma } from "@prisma/client";

export class DevicesService {
  private devicesRepository: DevicesRepository;

  constructor() {
    this.devicesRepository = new DevicesRepository();
  }

  async create(data: Prisma.DeviceCreateInput) {
    return this.devicesRepository.create(data);
  }

  async findAll() {
    return this.devicesRepository.findAll();
  }

  async findById(id: string) {
    return this.devicesRepository.findById(id);
  }

  async update(id: string, data: Prisma.DeviceUpdateInput) {
    return this.devicesRepository.update(id, data);
  }

  async delete(id: string) {
    return this.devicesRepository.delete(id);
  }
}

export const devicesService = new DevicesService();

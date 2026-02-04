import { DevicesRepository } from "../repository/devices.repository";

export interface CreateDeviceData {
  name: string;
  type: string;
  status?: string;
}

export interface UpdateDeviceData {
  name?: string;
  type?: string;
  status?: string;
}

export class DevicesService {
  private devicesRepository: DevicesRepository;

  constructor() {
    this.devicesRepository = new DevicesRepository();
  }

  async create(data: CreateDeviceData) {
    return this.devicesRepository.create({
      name: data.name,
      type: data.type,
      status: data.status || "active",
    });
  }

  async findAll() {
    return this.devicesRepository.findAll();
  }

  async findById(id: string) {
    return this.devicesRepository.findById(id);
  }

  async update(id: string, data: UpdateDeviceData) {
    return this.devicesRepository.update(id, data);
  }

  async delete(id: string) {
    return this.devicesRepository.delete(id);
  }
}

export const devicesService = new DevicesService();

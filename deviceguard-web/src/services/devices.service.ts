import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";
import {
  Device,
  CreateDeviceDto,
  UpdateDeviceDto,
} from "@/types";

export const devicesService = {
  async getAll(): Promise<Device[]> {
    const { data } = await clientAxios.get(API_ROUTES.DEVICES);
    return data;
  },

  async getById(id: string): Promise<Device> {
    const { data } = await clientAxios.get(`${API_ROUTES.DEVICES}/${id}`);
    return data;
  },

  async create(dto: CreateDeviceDto): Promise<Device> {
    const { data } = await clientAxios.post(API_ROUTES.DEVICES, dto);
    return data;
  },

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const { data } = await clientAxios.put(`${API_ROUTES.DEVICES}/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await clientAxios.delete(`${API_ROUTES.DEVICES}/${id}`);
  },
};
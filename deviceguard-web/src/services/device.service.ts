import clientAxios from "@/utils/clientAxios.util";
import { CreateDeviceDto } from "@/schemas/device.schema";
import { API_ROUTES } from "@/constants/routes";

export const deviceService = {
  async create(dto: CreateDeviceDto & { clientId: string }) {
    const { data } = await clientAxios.post(API_ROUTES.DEVICES, dto);
    return data;
  },

  async update(id: string, dto: CreateDeviceDto & { clientId: string }) {
    const { data } = await clientAxios.put(`${API_ROUTES.DEVICES}/${id}`, dto);
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`${API_ROUTES.DEVICES}/${id}`);
    return data;
  },

  async getAll(search?: string) {
    const params = search ? { search } : {};
    const { data } = await clientAxios.get(API_ROUTES.DEVICES, { params });
    return data;
  },
};

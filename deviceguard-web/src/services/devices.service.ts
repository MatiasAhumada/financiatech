import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";
import { IDevice, IDeviceFormValues } from "@/types";

export const devicesService = {
  async getAll(): Promise<IDevice[]> {
    const { data } = await clientAxios.get(API_ROUTES.DEVICES);
    return data;
  },

  async getById(id: string): Promise<IDevice> {
    const { data } = await clientAxios.get(`${API_ROUTES.DEVICES}/${id}`);
    return data;
  },

  async create(dto: IDeviceFormValues): Promise<IDevice> {
    const { data } = await clientAxios.post(API_ROUTES.DEVICES, dto);
    return data;
  },

  async update(id: string, dto: IDeviceFormValues): Promise<IDevice> {
    const { data } = await clientAxios.put(`${API_ROUTES.DEVICES}/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await clientAxios.delete(`${API_ROUTES.DEVICES}/${id}`);
  },
};

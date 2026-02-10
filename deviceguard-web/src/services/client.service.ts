import clientAxios from "@/utils/clientAxios.util";
import { CreateClientDto } from "@/schemas/client.schema";
import { API_ROUTES } from "@/constants/routes";

export const clientService = {
  async create(dto: CreateClientDto) {
    const { data } = await clientAxios.post(API_ROUTES.CLIENTS, dto);
    return data;
  },

  async update(id: string, dto: CreateClientDto) {
    const { data } = await clientAxios.put(`${API_ROUTES.CLIENTS}/${id}`, dto);
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`${API_ROUTES.CLIENTS}/${id}`);
    return data;
  },

  async restore(id: string) {
    const { data } = await clientAxios.patch(`${API_ROUTES.CLIENTS}/${id}`);
    return data;
  },

  async getAll(search?: string) {
    const params = search ? { search } : {};
    const { data } = await clientAxios.get(API_ROUTES.CLIENTS, { params });
    return data;
  },
};

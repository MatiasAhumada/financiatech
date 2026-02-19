import clientAxios from "@/utils/clientAxios.util";
import { CreateSaleDto } from "@/schemas/sale.schema";
import { API_ROUTES } from "@/constants/routes";

export const saleService = {
  async create(dto: CreateSaleDto) {
    const { data } = await clientAxios.post(API_ROUTES.SALES, dto);
    return data;
  },

  async getAll(search?: string) {
    const params = search ? { search } : {};
    const { data } = await clientAxios.get(API_ROUTES.SALES, { params });
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`${API_ROUTES.SALES}/${id}`);
    return data;
  },

  async update(id: string, dto: CreateSaleDto) {
    const { data } = await clientAxios.put(`${API_ROUTES.SALES}/${id}`, dto);
    return data;
  },
};

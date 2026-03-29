import clientAxios from "@/utils/clientAxios.util";
import { CreateSaleDto } from "@/schemas/sale.schema";
import { API_ROUTES } from "@/constants/routes";
import { SalesStats, IInstallment } from "@/types";

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

  async getStats() {
    const params = { stats: "true" };
    const { data } = await clientAxios.get(API_ROUTES.SALES, { params });
    return data as SalesStats;
  },

  async getInstallments(saleId: string) {
    const { data } = await clientAxios.get(
      `${API_ROUTES.SALES}/${saleId}/installments`
    );
    return data as IInstallment[];
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

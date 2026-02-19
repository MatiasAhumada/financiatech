import { z } from "zod";

export const createFinancingPlanSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  installments: z.number().int().min(1, "Mínimo 1 cuota"),
  interestRate: z.number().min(0, "El interés no puede ser negativo"),
});

export type CreateFinancingPlanDto = z.infer<typeof createFinancingPlanSchema>;

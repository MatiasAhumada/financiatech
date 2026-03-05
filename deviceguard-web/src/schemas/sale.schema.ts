import { z } from "zod";
import { PaymentFrequency } from "@prisma/client";

export const createSaleSchema = z.object({
  deviceId: z.string().min(1, "El dispositivo es requerido"),
  clientId: z.string().min(1, "El cliente es requerido"),
  totalAmount: z.number().positive("El monto debe ser positivo"),
  initialPayment: z.number().min(0, "El pago inicial no puede ser negativo"),
  installments: z.number().int().min(1, "Mínimo 1 cuota"),
  paymentFrequency: z.nativeEnum(PaymentFrequency),
  financingPlanId: z.string().min(1, "El plan de financiamiento es requerido"),
  firstWarningDay: z.number().int().min(1).max(31, "Día inválido"),
  secondWarningDay: z.number().int().min(1).max(31, "Día inválido"),
  blockDay: z.number().int().min(1).max(31, "Día inválido"),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;

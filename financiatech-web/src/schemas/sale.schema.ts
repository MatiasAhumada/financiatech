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
  firstWarningDay: z.number().int().min(1).max(31, "Día inválido").optional(),
  secondWarningDay: z.number().int().min(1).max(31, "Día inválido").optional(),
  blockDay: z.number().int().min(1).max(31, "Día inválido").optional(),
});

export const createMultipleSaleSchema = z.object({
  deviceIds: z.array(z.string()).min(1, "Al menos un dispositivo es requerido"),
  amounts: z.array(z.number()).min(1, "Los montos son requeridos"),
  clientId: z.string().min(1, "El cliente es requerido"),
  totalAmount: z.number().positive("El monto debe ser positivo"),
  initialPayment: z.number().min(0, "El pago inicial no puede ser negativo"),
  installments: z.number().int().min(1, "Mínimo 1 cuota"),
  paymentFrequency: z.nativeEnum(PaymentFrequency),
  financingPlanId: z.string().min(1, "El plan de financiamiento es requerido"),
  firstWarningDay: z.number().int().min(1).max(31, "Día inválido").optional(),
  secondWarningDay: z.number().int().min(1).max(31, "Día inválido").optional(),
  blockDay: z.number().int().min(1).max(31, "Día inválido").optional(),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
export type CreateMultipleSaleDto = z.infer<typeof createMultipleSaleSchema>;

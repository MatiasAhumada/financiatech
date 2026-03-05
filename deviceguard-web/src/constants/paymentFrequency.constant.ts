import { PaymentFrequency } from "@prisma/client";

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  [PaymentFrequency.WEEKLY]: "Semanal",
  [PaymentFrequency.BIWEEKLY]: "Quincenal",
  [PaymentFrequency.MONTHLY]: "Mensual",
};

export const PAYMENT_FREQUENCY_DAYS: Record<PaymentFrequency, number> = {
  [PaymentFrequency.WEEKLY]: 7,
  [PaymentFrequency.BIWEEKLY]: 15,
  [PaymentFrequency.MONTHLY]: 30,
};

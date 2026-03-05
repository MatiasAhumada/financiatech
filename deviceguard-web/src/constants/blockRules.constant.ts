import { PaymentFrequency } from "@prisma/client";

export const BLOCK_RULES_BY_FREQUENCY: Record<
  PaymentFrequency,
  {
    dueDay: number;
    firstWarningDay: number;
    secondWarningDay: number;
    blockDay: number;
  }
> = {
  [PaymentFrequency.WEEKLY]: {
    dueDay: 7,
    firstWarningDay: 5,
    secondWarningDay: 6,
    blockDay: 7,
  },
  [PaymentFrequency.BIWEEKLY]: {
    dueDay: 15,
    firstWarningDay: 13,
    secondWarningDay: 14,
    blockDay: 15,
  },
  [PaymentFrequency.MONTHLY]: {
    dueDay: 30,
    firstWarningDay: 28,
    secondWarningDay: 29,
    blockDay: 30,
  },
};

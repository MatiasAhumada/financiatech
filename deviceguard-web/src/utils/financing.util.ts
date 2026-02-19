export const financingUtils = {
  calculateFinancedAmount(totalAmount: number, initialPayment: number): number {
    return totalAmount - initialPayment;
  },

  calculateTotalWithInterest(
    financedAmount: number,
    interestRate: number
  ): number {
    return financedAmount * (1 + interestRate / 100);
  },

  calculateMonthlyPayment(
    totalWithInterest: number,
    installments: number
  ): number {
    return totalWithInterest / installments;
  },
};

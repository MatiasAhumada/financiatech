export const salesUtils = {
  getClientInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("ARS", "$")
      .replace(/\s+/g, " ")
      .trim();
  },

  formatNumber(value: number): string {
    return new Intl.NumberFormat("es-AR").format(value);
  },

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },

  calculateDueDate(monthsFromNow: number): Date {
    return new Date(Date.now() + monthsFromNow * 30 * 24 * 60 * 60 * 1000);
  },

  isToday(date: Date | string): boolean {
    return new Date(date).toDateString() === new Date().toDateString();
  },

  getTotalLabel(total: number, perPage: number = 10): string {
    return `REGISTROS: ${total} | PÁGINA 1 DE ${Math.ceil(total / perPage)}`;
  },
};

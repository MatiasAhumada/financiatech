import { IFinancingPlan } from "@/types";
import { salesUtils } from "@/utils/sales.util";
import { SALES_DEFAULTS } from "@/constants/sales.constant";

interface FinancingPlanCardProps {
  plan: IFinancingPlan;
  financedAmount: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function FinancingPlanCard({
  plan,
  financedAmount,
  isSelected,
  onSelect,
}: FinancingPlanCardProps) {
  const planTotal = financedAmount * (1 + Number(plan.interestRate) / 100);
  const planMonthly = planTotal / plan.installments;

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 border rounded-lg mb-2 text-left transition-colors ${
        isSelected
          ? "border-mahogany_red bg-mahogany_red/10"
          : "border-carbon_black-600 hover:border-mahogany_red/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium text-lg">
            {plan.installments} Meses
            {plan.installments === SALES_DEFAULTS.RECOMMENDED_INSTALLMENTS &&
              " (Recomendado)"}
          </p>
          <p className="text-sm text-silver-400">
            Interés: {Number(plan.interestRate)}% total
          </p>
        </div>
        <p className="text-mahogany_red font-bold text-xl">
          {salesUtils.formatCurrency(planMonthly)}/mes
        </p>
      </div>
    </button>
  );
}

import { Label } from "@/components/ui/label";
import { ShoppingCart01Icon } from "hugeicons-react";
import { SALES_MESSAGES } from "@/constants/sales.constant";

interface ActivationCodeDisplayProps {
  activationCode: string;
}

export function ActivationCodeDisplay({
  activationCode,
}: ActivationCodeDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
          <ShoppingCart01Icon size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">
          {SALES_MESSAGES.INFO.SUCCESS_TITLE}
        </h3>
        <p className="text-silver-400">
          {SALES_MESSAGES.INFO.SUCCESS_SUBTITLE}
        </p>
      </div>

      <div className="border border-mahogany_red rounded-lg p-6 bg-mahogany_red/5">
        <Label className="text-white text-sm uppercase mb-2 block">
          {SALES_MESSAGES.LABELS.ACTIVATION_CODE}
        </Label>
        <div className="bg-carbon_black rounded-lg p-6 text-center">
          <p className="text-5xl font-bold text-mahogany_red tracking-widest">
            {activationCode}
          </p>
        </div>
        <p className="text-xs text-silver-400 mt-4 text-center">
          {SALES_MESSAGES.INFO.ACTIVATION_INSTRUCTIONS}
        </p>
      </div>

      <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black space-y-3">
        <h4 className="text-white font-medium">
          {SALES_MESSAGES.INFO.CLIENT_INSTRUCTIONS_TITLE}
        </h4>
        <ol className="text-sm text-silver-400 space-y-2 list-decimal list-inside">
          {SALES_MESSAGES.CLIENT_INSTRUCTIONS.map((instruction, i) => (
            <li key={i}>{instruction}</li>
          ))}
        </ol>
      </div>

      <div className="border border-warning/50 rounded-lg p-4 bg-warning/5">
        <div className="flex items-start gap-2">
          <ShoppingCart01Icon size={20} className="text-warning mt-1" />
          <div>
            <p className="text-sm text-white font-medium">
              {SALES_MESSAGES.INFO.IMPORTANT_TITLE}
            </p>
            <p className="text-sm text-silver-400 mt-1">
              {SALES_MESSAGES.INFO.IMPORTANT_MESSAGE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SALES_MESSAGES } from "@/constants/sales.constant";

interface BlockRulesInputProps {
  firstWarningDay: string;
  secondWarningDay: string;
  blockDay: string;
  onFirstWarningChange: (value: string) => void;
  onSecondWarningChange: (value: string) => void;
  onBlockDayChange: (value: string) => void;
}

export function BlockRulesInput({
  firstWarningDay,
  secondWarningDay,
  blockDay,
}: BlockRulesInputProps) {
  return (
    <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
      <Label className="text-white uppercase mb-3 block">
        {SALES_MESSAGES.LABELS.BLOCK_RULES}
      </Label>
      <div className="space-y-3">
        <div>
          <Label className="text-silver-400 text-xs">
            {SALES_MESSAGES.LABELS.FIRST_WARNING}
          </Label>
          <Input
            type="number"
            value={firstWarningDay}
            disabled
            className="mt-1 bg-onyx-600 border-carbon_black-700 text-white opacity-60 cursor-not-allowed"
          />
        </div>
        <div>
          <Label className="text-silver-400 text-xs">
            {SALES_MESSAGES.LABELS.SECOND_WARNING}
          </Label>
          <Input
            type="number"
            value={secondWarningDay}
            disabled
            className="mt-1 bg-onyx-600 border-carbon_black-700 text-white opacity-60 cursor-not-allowed"
          />
        </div>
        <div>
          <Label className="text-silver-400 text-xs">
            {SALES_MESSAGES.LABELS.AUTO_BLOCK}
          </Label>
          <Input
            type="number"
            value={blockDay}
            disabled
            className="mt-1 bg-onyx-600 border-carbon_black-700 text-white opacity-60 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-silver-400 italic">
          {SALES_MESSAGES.INFO.BLOCK_RULES_EXAMPLE}
        </p>
      </div>
    </div>
  );
}

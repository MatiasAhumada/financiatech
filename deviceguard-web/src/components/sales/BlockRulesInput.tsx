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
  onFirstWarningChange,
  onSecondWarningChange,
  onBlockDayChange,
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
            min="1"
            max="31"
            value={firstWarningDay}
            onChange={(e) => onFirstWarningChange(e.target.value)}
            className="mt-1 bg-onyx-600 border-carbon_black-700 text-white"
          />
        </div>
        <div>
          <Label className="text-silver-400 text-xs">
            {SALES_MESSAGES.LABELS.SECOND_WARNING}
          </Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={secondWarningDay}
            onChange={(e) => onSecondWarningChange(e.target.value)}
            className="mt-1 bg-onyx-600 border-carbon_black-700 text-white"
          />
        </div>
        <div>
          <Label className="text-silver-400 text-xs">
            {SALES_MESSAGES.LABELS.AUTO_BLOCK}
          </Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={blockDay}
            onChange={(e) => onBlockDayChange(e.target.value)}
            className="mt-1 bg-onyx-600 border-carbon_black-700 text-white"
          />
        </div>
        <p className="text-xs text-silver-400 italic">
          {SALES_MESSAGES.INFO.BLOCK_RULES_EXAMPLE}
        </p>
      </div>
    </div>
  );
}

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconColor: string;
}

export function StatCard({ title, value, subtitle, trend, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 uppercase tracking-wide">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

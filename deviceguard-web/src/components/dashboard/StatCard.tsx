import { Card, CardContent } from "@/components/ui/card";
import { ComponentType } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: ComponentType<{ size?: number; color?: string; className?: string }>;
  iconColor: string;
  animationDelay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor,
  animationDelay = 0,
}: StatCardProps) {
  const isZero = value === "0" || value === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card className="border border-carbon_black-600 shadow-lg bg-carbon_black">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-2">
                {title}
              </p>
              <p className="text-4xl font-bold text-white mb-1">{value}</p>
              {subtitle && (
                <p className="text-sm font-semibold text-silver-400 uppercase tracking-wide">
                  {subtitle}
                </p>
              )}
              {trend && (
                <p
                  className={`text-sm mt-2 font-semibold ${
                    isZero
                      ? "text-warning"
                      : trend.isPositive
                        ? "text-success"
                        : "text-destructive"
                  }`}
                >
                  {isZero ? "⚠" : trend.isPositive ? "↑" : "↓"} {trend.value}
                </p>
              )}
            </div>
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconColor}`}
            >
              <Icon size={22} color="currentColor" className="text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

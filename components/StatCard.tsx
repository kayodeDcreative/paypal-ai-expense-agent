import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendData {
  value: number;
  label: string;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: TrendData;
  color?: "blue" | "green" | "red" | "purple";
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-paypal-blue text-white",
    accent: "text-paypal-blue",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-500 text-white",
    accent: "text-green-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-500 text-white",
    accent: "text-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-500 text-white",
    accent: "text-purple-600",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "blue",
}: StatCardProps) {
  const colors = colorMap[color];
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 card-hover ${colors.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>

      <p className={`text-2xl font-bold mb-1 ${colors.accent}`}>{value}</p>

      <div className="flex items-center gap-2">
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trendPositive ? "text-green-600" : "text-red-500"
            }`}
          >
            {trendPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            <span>
              {trendPositive ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

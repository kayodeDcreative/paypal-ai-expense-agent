import { X, AlertTriangle } from "lucide-react";
import { AnomalyAlert as AnomalyAlertType } from "@/lib/types";

interface AnomalyAlertProps {
  anomaly: AnomalyAlertType;
  onDismiss?: (id: string) => void;
}

const severityConfig = {
  high: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    icon: "text-red-500",
    label: "High",
  },
  medium: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    icon: "text-amber-500",
    label: "Medium",
  },
  low: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "text-yellow-500",
    label: "Low",
  },
};

const formatCurrency = (amount: number) => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return amount < 0 ? `-${formatted}` : `+${formatted}`;
};

export default function AnomalyAlertCard({ anomaly, onDismiss }: AnomalyAlertProps) {
  const config = severityConfig[anomaly.severity];

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${config.bg} ${config.border}`}
    >
      <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${config.icon}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
            {config.label} Risk
          </span>
          <span className="text-xs font-medium text-slate-700 truncate">
            {anomaly.transaction.description}
          </span>
          <span
            className={`text-xs font-bold ml-auto flex-shrink-0 ${
              anomaly.transaction.amount < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatCurrency(anomaly.transaction.amount)}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{anomaly.reason}</p>
      </div>

      {onDismiss && (
        <button
          onClick={() => onDismiss(anomaly.transactionId)}
          className="flex-shrink-0 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, AlertTriangle, Zap, TrendingUp, Info } from "lucide-react";
import AnomalyAlertCard from "@/components/AnomalyAlert";
import { AIInsight, InsightSeverity, TransactionsApiResponse } from "@/lib/types";
import { MOCK_AI_INSIGHTS, MOCK_ANOMALIES } from "@/lib/mockData";

// ── Severity config ───────────────────────────────────────────────────────────

const severityConfig: Record<
  InsightSeverity,
  {
    border: string;
    bg: string;
    badge: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  positive: {
    border: "border-green-300",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
    icon: <TrendingUp size={14} className="text-green-600" />,
    label: "Positive",
  },
  warning: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icon: <AlertTriangle size={14} className="text-amber-500" />,
    label: "Warning",
  },
  info: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: <Info size={14} className="text-blue-500" />,
    label: "Info",
  },
  critical: {
    border: "border-red-300",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    icon: <Zap size={14} className="text-red-500" />,
    label: "Critical",
  },
};

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const config = severityConfig[insight.severity];

  return (
    <div
      className={`rounded-xl border-2 p-4 flex flex-col gap-2 card-hover ${config.border} ${config.bg}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
              {config.label}
            </span>
            {insight.actionable && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Actionable
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{insight.title}</h3>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>

      {insight.suggestion && (
        <div className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2 border border-white/80 mt-1">
          <Lightbulb size={12} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <p className="text-xs text-slate-600 leading-relaxed">{insight.suggestion}</p>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function InsightsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-100 rounded-xl h-36 border border-slate-200" />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<string>("mock");
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES);

  const loadInsights = async () => {
    setLoading(true);

    // First, try to get real transactions for the insights call
    let transactions = null;
    try {
      const txRes = await fetch("/api/paypal/transactions");
      if (txRes.ok) {
        const txData: TransactionsApiResponse = await txRes.json();
        transactions = txData.transactions;
        setAnomalies(txData.anomalies);
      }
    } catch {
      // fall through to mock
    }

    // Then POST to insights endpoint
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: transactions ?? [] }),
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.insights) && json.insights.length > 0) {
          setInsights(json.insights);
          setModel(json.model ?? "unknown");
          setLoading(false);
          return;
        }
      }
    } catch {
      // fall through to mock
    }

    // Fallback to mock insights
    setInsights(MOCK_AI_INSIGHTS);
    setModel("mock");
    setLoading(false);
  };

  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLive = model !== "mock" && model !== "mock_fallback";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 gradient-text">AI Financial Insights</h1>
          <p className="text-sm text-slate-400 mt-1">
            Powered by{" "}
            <span
              className={`font-semibold ${isLive ? "text-green-600" : "text-slate-500"}`}
            >
              {isLive ? "GPT-4" : "Mock Data"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
              isLive
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isLive ? "🤖 Powered by GPT-4" : "📊 Demo Data"}
          </span>
          <button
            onClick={loadInsights}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Insights grid */}
      {loading ? (
        <InsightsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Anomaly report section */}
      {!loading && anomalies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Anomaly Report</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {anomalies.length} flagged
            </span>
          </div>
          <div className="space-y-2">
            {anomalies.map((anomaly) => (
              <AnomalyAlertCard key={anomaly.transactionId} anomaly={anomaly} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

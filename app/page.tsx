"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import AnomalyAlertCard from "@/components/AnomalyAlert";
import { TransactionsApiResponse, AnomalyAlert } from "@/lib/types";

// Recharts components need browser — load without SSR
const SpendingChart = dynamic(() => import("@/components/SpendingChart"), { ssr: false });
const CategoryBreakdown = dynamic(() => import("@/components/CategoryBreakdown"), { ssr: false });

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-52 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-36 bg-slate-100 rounded" />
        </div>
        <div className="h-8 w-32 bg-slate-100 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-28" />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-72" />
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-72" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<TransactionsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/transactions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TransactionsApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedAnomalies((prev) => new Set([...prev, id]));
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="text-red-400" size={40} />
        <p className="text-slate-600 font-medium">Failed to load dashboard data</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-paypal-blue text-white rounded-lg text-sm font-medium hover:bg-paypal-darkblue transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, monthlyTrends, categoryBreakdown, anomalies, lastSynced } = data;

  const visibleAnomalies: AnomalyAlert[] = anomalies
    .filter((a) => !dismissedAnomalies.has(a.transactionId))
    .slice(0, 3);

  const formatMoney = (n: number) =>
    `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lastSyncedFormatted = (() => {
    try {
      return format(new Date(lastSynced), "MMM d, h:mm a");
    } catch {
      return "just now";
    }
  })();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 gradient-text">Expense Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Last synced: {lastSyncedFormatted}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spent"
          value={formatMoney(summary.totalSpent)}
          subtitle={`${summary.transactionCount} transactions`}
          icon={<TrendingDown size={16} />}
          color="red"
        />
        <StatCard
          title="Total Income"
          value={formatMoney(summary.totalIncome)}
          subtitle="Freelance + transfers"
          icon={<TrendingUp size={16} />}
          color="green"
        />
        <StatCard
          title="Net Balance"
          value={`${summary.netBalance >= 0 ? "+" : "-"}${formatMoney(summary.netBalance)}`}
          subtitle={summary.netBalance >= 0 ? "Positive month" : "Deficit month"}
          icon={<DollarSign size={16} />}
          color={summary.netBalance >= 0 ? "blue" : "red"}
        />
        <StatCard
          title="Anomalies Detected"
          value={String(summary.anomalyCount)}
          subtitle="AI-flagged transactions"
          icon={<AlertTriangle size={16} />}
          color="purple"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingChart data={monthlyTrends} />
        <CategoryBreakdown data={categoryBreakdown} />
      </div>

      {/* Anomaly alerts */}
      {visibleAnomalies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-700">Anomaly Alerts</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {anomalies.filter((a) => !dismissedAnomalies.has(a.transactionId)).length} active
              </span>
            </div>
            <Link
              href="/transactions"
              className="text-xs text-paypal-blue hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-2">
            {visibleAnomalies.map((anomaly) => (
              <AnomalyAlertCard
                key={anomaly.transactionId}
                anomaly={anomaly}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

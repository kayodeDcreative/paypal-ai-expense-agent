"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ClientSideRowModelModule,
  CommunityFeaturesModule,
  ModuleRegistry,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import { format } from "date-fns";
import { Search, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { CategorizedTransaction, TransactionsApiResponse } from "@/lib/types";

ModuleRegistry.registerModules([ClientSideRowModelModule, CommunityFeaturesModule]);

type Period = "7d" | "30d" | "90d" | "all";

function filterByPeriod(transactions: CategorizedTransaction[], period: Period): CategorizedTransaction[] {
  if (period === "all") return transactions;
  const now = Date.now();
  const msMap: Record<Exclude<Period, "all">, number> = {
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  };
  const cutoff = now - msMap[period as Exclude<Period, "all">];
  return transactions.filter((t) => new Date(t.date).getTime() >= cutoff);
}

// ── Cell renderers ────────────────────────────────────────────────────────────

function AmountCell(params: ICellRendererParams<CategorizedTransaction>) {
  const amount = params.value as number;
  const formatted = `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  return (
    <span className={`font-semibold ${amount >= 0 ? "text-green-600" : "text-red-500"}`}>
      {amount >= 0 ? `+${formatted}` : `-${formatted}`}
    </span>
  );
}

function CategoryCell(params: ICellRendererParams<CategorizedTransaction>) {
  const category = params.value as string;
  return (
    <span className="inline-block text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-full">
      {category}
    </span>
  );
}

function StatusCell(params: ICellRendererParams<CategorizedTransaction>) {
  const status = params.value as string;
  const colorMap: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REFUNDED: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    REVERSED: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
        colorMap[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}

function AnomalyCell(params: ICellRendererParams<CategorizedTransaction>) {
  const isAnomaly = params.value as boolean;
  if (!isAnomaly) return null;
  return (
    <span title={params.data?.anomalyReason ?? "Anomaly detected"}>
      <AlertTriangle size={14} className="text-amber-500" />
    </span>
  );
}

function DateCell(params: ICellRendererParams<CategorizedTransaction>) {
  try {
    return <span>{format(new Date(params.value as string), "MMM d, yyyy")}</span>;
  } catch {
    return <span>{params.value}</span>;
  }
}

// ── Column definitions ────────────────────────────────────────────────────────

const columnDefs: ColDef<CategorizedTransaction>[] = [
  {
    field: "date",
    headerName: "Date",
    width: 120,
    cellRenderer: DateCell,
    sortable: true,
    filter: true,
    sort: "desc",
  },
  {
    field: "description",
    headerName: "Description",
    flex: 2,
    sortable: true,
    filter: true,
    minWidth: 180,
  },
  {
    field: "counterparty",
    headerName: "Counterparty",
    flex: 1,
    sortable: true,
    filter: true,
    minWidth: 130,
  },
  {
    field: "amount",
    headerName: "Amount",
    width: 120,
    cellRenderer: AmountCell,
    sortable: true,
    type: "numericColumn",
  },
  {
    field: "category",
    headerName: "Category",
    width: 170,
    cellRenderer: CategoryCell,
    sortable: true,
    filter: true,
  },
  {
    field: "status",
    headerName: "Status",
    width: 110,
    cellRenderer: StatusCell,
    sortable: true,
    filter: true,
  },
  {
    field: "isAnomaly",
    headerName: "⚠️",
    width: 60,
    cellRenderer: AnomalyCell,
    sortable: true,
    headerTooltip: "Anomaly detected",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const gridRef = useRef<AgGridReact<CategorizedTransaction>>(null);
  const [allTransactions, setAllTransactions] = useState<CategorizedTransaction[]>([]);
  const [rowData, setRowData] = useState<CategorizedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [period, setPeriod] = useState<Period>("30d");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/transactions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TransactionsApiResponse = await res.json();
      setAllTransactions(json.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setRowData(filterByPeriod(allTransactions, period));
  }, [allTransactions, period]);

  const handleExportCsv = () => {
    gridRef.current?.api?.exportDataAsCsv();
  };

  const periods: { label: string; value: Period }[] = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 gradient-text">Transactions</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {rowData.length} transaction{rowData.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-paypal-blue/30 focus:border-paypal-blue bg-white"
          />
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {periods.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === value
                  ? "bg-white text-paypal-blue shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Export CSV */}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors bg-white"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertTriangle size={14} />
          {error}
          <button onClick={fetchTransactions} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* AG Grid */}
      <div className="ag-theme-alpine flex-1 rounded-xl overflow-hidden border border-slate-200 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading transactions…
          </div>
        ) : (
          <div style={{ height: "100%", width: "100%" }}>
            <AgGridReact<CategorizedTransaction>
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              quickFilterText={searchText}
              animateRows={true}
              rowSelection="single"
              defaultColDef={{
                resizable: true,
                suppressMovable: false,
              }}
              domLayout="normal"
            />
          </div>
        )}
      </div>
    </div>
  );
}

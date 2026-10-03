// ─── PayPal Transaction Types ───────────────────────────────────────────────

export type TransactionStatus =
  | "COMPLETED"
  | "PENDING"
  | "REFUNDED"
  | "FAILED"
  | "REVERSED";

export type TransactionType = "PAYMENT" | "REFUND" | "TRANSFER" | "WITHDRAWAL";

export interface PayPalTransaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number; // positive = credit, negative = debit
  currency: string;
  status: TransactionStatus;
  type: TransactionType;
  counterparty: string; // merchant or person name
  counterpartyEmail?: string;
  invoiceId?: string;
  note?: string;
}

// ─── AI-Enriched Transaction ─────────────────────────────────────────────────

export type ExpenseCategory =
  | "Food & Dining"
  | "Shopping"
  | "Software & Subscriptions"
  | "Travel"
  | "Entertainment"
  | "Health & Fitness"
  | "Utilities & Bills"
  | "Business Services"
  | "Freelance Income"
  | "Transfers"
  | "Refunds"
  | "Other";

export interface CategorizedTransaction extends PayPalTransaction {
  category: ExpenseCategory;
  confidence: number; // 0–1
  tags: string[];
  isAnomaly: boolean;
  anomalyReason?: string;
  aiNotes?: string;
}

// ─── Dashboard Summary ───────────────────────────────────────────────────────

export interface SpendingSummary {
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  transactionCount: number;
  averageTransaction: number;
  topCategory: ExpenseCategory;
  anomalyCount: number;
  period: "7d" | "30d" | "90d" | "all";
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string; // e.g. "Jan 2026"
  spent: number;
  income: number;
}

// ─── AI Insight Types ────────────────────────────────────────────────────────

export type InsightSeverity = "info" | "warning" | "critical" | "positive";

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category?: ExpenseCategory;
  actionable: boolean;
  suggestion?: string;
  relatedTransactionIds?: string[];
  createdAt: string;
}

export interface AnomalyAlert {
  transactionId: string;
  transaction: CategorizedTransaction;
  reason: string;
  severity: "low" | "medium" | "high";
  detectedAt: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface TransactionsApiResponse {
  transactions: CategorizedTransaction[];
  summary: SpendingSummary;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  anomalies: AnomalyAlert[];
  lastSynced: string;
  source: "paypal_live" | "paypal_sandbox" | "mock";
}

export interface InsightsApiResponse {
  insights: AIInsight[];
  generatedAt: string;
  model: string;
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export type TimePeriod = "7d" | "30d" | "90d" | "all";

export interface FilterState {
  period: TimePeriod;
  categories: ExpenseCategory[];
  status: TransactionStatus | "ALL";
  search: string;
  minAmount?: number;
  maxAmount?: number;
}

import {
  CategorizedTransaction,
  CategoryBreakdown,
  MonthlyTrend,
  SpendingSummary,
  AIInsight,
  AnomalyAlert,
  TransactionsApiResponse,
} from "./types";

// ─── Category Colors ─────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f97316",
  "Shopping": "#8b5cf6",
  "Software & Subscriptions": "#0070BA",
  "Travel": "#10b981",
  "Entertainment": "#f43f5e",
  "Health & Fitness": "#06b6d4",
  "Utilities & Bills": "#64748b",
  "Business Services": "#f59e0b",
  "Freelance Income": "#22c55e",
  "Transfers": "#a78bfa",
  "Refunds": "#84cc16",
  "Other": "#94a3b8",
};

// ─── Mock Transactions ────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: CategorizedTransaction[] = [
  {
    id: "TXN-001",
    date: "2026-09-28T14:32:00Z",
    description: "Uber Eats - Order #UE98234",
    amount: -42.5,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Uber Eats",
    counterpartyEmail: "payments@ubereats.com",
    category: "Food & Dining",
    confidence: 0.98,
    tags: ["food", "delivery", "restaurant"],
    isAnomaly: false,
  },
  {
    id: "TXN-002",
    date: "2026-09-27T09:15:00Z",
    description: "GitHub Copilot - Monthly Subscription",
    amount: -19.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "GitHub, Inc.",
    counterpartyEmail: "billing@github.com",
    category: "Software & Subscriptions",
    confidence: 0.99,
    tags: ["developer-tools", "ai", "subscription", "monthly"],
    isAnomaly: false,
  },
  {
    id: "TXN-003",
    date: "2026-09-26T16:45:00Z",
    description: "Freelance Payment - Web Design Project",
    amount: 1500.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Acme Corp",
    counterpartyEmail: "accounts@acmecorp.com",
    invoiceId: "INV-2026-089",
    category: "Freelance Income",
    confidence: 0.97,
    tags: ["income", "freelance", "design", "invoice"],
    isAnomaly: false,
  },
  {
    id: "TXN-004",
    date: "2026-09-25T11:20:00Z",
    description: "Amazon - Multiple Items",
    amount: -289.99,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Amazon.com",
    counterpartyEmail: "payments@amazon.com",
    category: "Shopping",
    confidence: 0.95,
    tags: ["retail", "online-shopping", "amazon"],
    isAnomaly: true,
    anomalyReason: "Purchase is 3.2x higher than your average Amazon spend ($90)",
    aiNotes: "This transaction is notably higher than your typical Amazon orders. Verify this was intentional.",
  },
  {
    id: "TXN-005",
    date: "2026-09-24T08:00:00Z",
    description: "Starbucks Coffee",
    amount: -6.75,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Starbucks",
    category: "Food & Dining",
    confidence: 0.99,
    tags: ["coffee", "food", "daily"],
    isAnomaly: false,
  },
  {
    id: "TXN-006",
    date: "2026-09-23T13:55:00Z",
    description: "Vercel Pro - Monthly Plan",
    amount: -20.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Vercel Inc.",
    counterpartyEmail: "billing@vercel.com",
    category: "Software & Subscriptions",
    confidence: 0.98,
    tags: ["hosting", "developer-tools", "subscription"],
    isAnomaly: false,
  },
  {
    id: "TXN-007",
    date: "2026-09-22T20:30:00Z",
    description: "Netflix - Standard Plan",
    amount: -15.49,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Netflix",
    category: "Entertainment",
    confidence: 0.99,
    tags: ["streaming", "entertainment", "subscription"],
    isAnomaly: false,
  },
  {
    id: "TXN-008",
    date: "2026-09-21T10:10:00Z",
    description: "Delta Airlines - Flight Booking",
    amount: -542.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Delta Air Lines",
    counterpartyEmail: "receipts@delta.com",
    category: "Travel",
    confidence: 0.97,
    tags: ["travel", "flight", "airline"],
    isAnomaly: true,
    anomalyReason: "Large travel purchase — first airline transaction in 60 days",
    aiNotes: "Travel expense detected. Consider tracking this against a travel budget.",
  },
  {
    id: "TXN-009",
    date: "2026-09-20T14:00:00Z",
    description: "OpenAI API Credits",
    amount: -50.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "OpenAI",
    counterpartyEmail: "billing@openai.com",
    category: "Software & Subscriptions",
    confidence: 0.98,
    tags: ["ai", "api", "developer-tools"],
    isAnomaly: false,
  },
  {
    id: "TXN-010",
    date: "2026-09-19T07:45:00Z",
    description: "Gym Membership - September",
    amount: -49.99,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Planet Fitness",
    category: "Health & Fitness",
    confidence: 0.96,
    tags: ["health", "gym", "subscription", "monthly"],
    isAnomaly: false,
  },
  {
    id: "TXN-011",
    date: "2026-09-18T12:00:00Z",
    description: "Freelance - Logo Design",
    amount: 350.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "StartupXYZ",
    invoiceId: "INV-2026-088",
    category: "Freelance Income",
    confidence: 0.96,
    tags: ["income", "freelance", "design"],
    isAnomaly: false,
  },
  {
    id: "TXN-012",
    date: "2026-09-17T19:30:00Z",
    description: "DoorDash - Dinner",
    amount: -38.20,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "DoorDash",
    category: "Food & Dining",
    confidence: 0.97,
    tags: ["food", "delivery"],
    isAnomaly: false,
  },
  {
    id: "TXN-013",
    date: "2026-09-15T09:00:00Z",
    description: "Figma - Professional Plan",
    amount: -45.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Figma",
    counterpartyEmail: "billing@figma.com",
    category: "Software & Subscriptions",
    confidence: 0.99,
    tags: ["design-tools", "subscription", "professional"],
    isAnomaly: false,
  },
  {
    id: "TXN-014",
    date: "2026-09-14T15:20:00Z",
    description: "Electricity Bill - September",
    amount: -124.50,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "City Power Co.",
    category: "Utilities & Bills",
    confidence: 0.94,
    tags: ["utilities", "electricity", "bill", "monthly"],
    isAnomaly: false,
  },
  {
    id: "TXN-015",
    date: "2026-09-12T11:00:00Z",
    description: "Zoom Pro - Annual Renewal",
    amount: -149.90,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Zoom Video Communications",
    counterpartyEmail: "billing@zoom.us",
    category: "Software & Subscriptions",
    confidence: 0.98,
    tags: ["video-conferencing", "subscription", "annual", "business"],
    isAnomaly: true,
    anomalyReason: "Annual charge — unusually large for this vendor vs monthly average",
    aiNotes: "Annual subscription renewal. Expected once per year.",
  },
  {
    id: "TXN-016",
    date: "2026-09-10T17:00:00Z",
    description: "Whole Foods Market",
    amount: -87.43,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Whole Foods",
    category: "Food & Dining",
    confidence: 0.93,
    tags: ["groceries", "food", "organic"],
    isAnomaly: false,
  },
  {
    id: "TXN-017",
    date: "2026-09-08T14:00:00Z",
    description: "Spotify Premium",
    amount: -9.99,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Spotify",
    category: "Entertainment",
    confidence: 0.99,
    tags: ["music", "streaming", "subscription"],
    isAnomaly: false,
  },
  {
    id: "TXN-018",
    date: "2026-09-05T10:30:00Z",
    description: "Refund - Cancelled Order",
    amount: 45.0,
    currency: "USD",
    status: "REFUNDED",
    type: "REFUND",
    counterparty: "Best Buy",
    category: "Refunds",
    confidence: 0.99,
    tags: ["refund", "electronics"],
    isAnomaly: false,
  },
  {
    id: "TXN-019",
    date: "2026-09-03T08:00:00Z",
    description: "Internet Bill - September",
    amount: -79.99,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "Comcast",
    category: "Utilities & Bills",
    confidence: 0.97,
    tags: ["utilities", "internet", "bill", "monthly"],
    isAnomaly: false,
  },
  {
    id: "TXN-020",
    date: "2026-09-01T09:00:00Z",
    description: "Consulting Invoice - Strategy Session",
    amount: 800.0,
    currency: "USD",
    status: "COMPLETED",
    type: "PAYMENT",
    counterparty: "TechStart LLC",
    invoiceId: "INV-2026-087",
    category: "Freelance Income",
    confidence: 0.95,
    tags: ["income", "consulting", "invoice"],
    isAnomaly: false,
  },
];

// ─── Category Breakdown ───────────────────────────────────────────────────────

export function computeCategoryBreakdown(
  transactions: CategorizedTransaction[]
): CategoryBreakdown[] {
  const spending = transactions.filter((t) => t.amount < 0);
  const totalSpent = spending.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const grouped: Record<string, { total: number; count: number }> = {};
  for (const t of spending) {
    if (!grouped[t.category]) grouped[t.category] = { total: 0, count: 0 };
    grouped[t.category].total += Math.abs(t.amount);
    grouped[t.category].count += 1;
  }

  return Object.entries(grouped)
    .map(([category, { total, count }]) => ({
      category: category as CategorizedTransaction["category"],
      total: Math.round(total * 100) / 100,
      count,
      percentage: Math.round((total / totalSpent) * 100),
      color: CATEGORY_COLORS[category] ?? "#94a3b8",
    }))
    .sort((a, b) => b.total - a.total);
}

// ─── Monthly Trends ───────────────────────────────────────────────────────────

export const MOCK_MONTHLY_TRENDS: MonthlyTrend[] = [
  { month: "Apr 2026", spent: 1820.4, income: 1200.0 },
  { month: "May 2026", spent: 2104.3, income: 1850.0 },
  { month: "Jun 2026", spent: 1650.8, income: 2000.0 },
  { month: "Jul 2026", spent: 2310.5, income: 1500.0 },
  { month: "Aug 2026", spent: 1945.2, income: 2650.0 },
  { month: "Sep 2026", spent: 1568.73, income: 2650.0 },
];

// ─── Summary ─────────────────────────────────────────────────────────────────

export function computeSummary(
  transactions: CategorizedTransaction[],
  period: SpendingSummary["period"] = "30d"
): SpendingSummary {
  const debits = transactions.filter((t) => t.amount < 0);
  const credits = transactions.filter((t) => t.amount > 0);
  const totalSpent = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
  const breakdown = computeCategoryBreakdown(transactions);
  const anomalyCount = transactions.filter((t) => t.isAnomaly).length;

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    netBalance: Math.round((totalIncome - totalSpent) * 100) / 100,
    transactionCount: transactions.length,
    averageTransaction:
      debits.length > 0
        ? Math.round((totalSpent / debits.length) * 100) / 100
        : 0,
    topCategory: breakdown[0]?.category ?? "Other",
    anomalyCount,
    period,
  };
}

// ─── AI Insights ─────────────────────────────────────────────────────────────

export const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: "INS-001",
    title: "Software subscriptions are your #1 expense",
    description:
      "You spent $283.90 on software subscriptions this month — 26% of your total spending. You have 5 active subscriptions.",
    severity: "warning",
    category: "Software & Subscriptions",
    actionable: true,
    suggestion:
      "Review your active subscriptions. Consider consolidating tools or switching to annual plans for discounts.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "INS-002",
    title: "Income exceeds expenses this month 🎉",
    description:
      "Your net balance is +$1,081.27 this month. Income of $2,650 comfortably covers expenses of $1,568.73.",
    severity: "positive",
    actionable: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "INS-003",
    title: "Food delivery spending is high",
    description:
      "You've spent $87.45 on food delivery apps (Uber Eats, DoorDash) this month — that's $1,049/year annualized.",
    severity: "warning",
    category: "Food & Dining",
    actionable: true,
    suggestion:
      "Setting a weekly food delivery budget of $20 could save you ~$500/year.",
    relatedTransactionIds: ["TXN-001", "TXN-012"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "INS-004",
    title: "3 anomalies detected this month",
    description:
      "The AI agent flagged 3 transactions as unusual: a large Amazon purchase, a Delta flight booking, and an annual Zoom renewal.",
    severity: "warning",
    actionable: true,
    suggestion: "Review the flagged transactions in the Transactions tab to confirm they are legitimate.",
    relatedTransactionIds: ["TXN-004", "TXN-008", "TXN-015"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "INS-005",
    title: "Freelance income trend is positive",
    description:
      "You've earned $2,650 in freelance income across 3 invoices this month. This is your highest freelance month in 6 months.",
    severity: "positive",
    category: "Freelance Income",
    actionable: true,
    suggestion:
      "Consider setting aside 30% for taxes and investing the remainder in a high-yield savings account.",
    relatedTransactionIds: ["TXN-003", "TXN-011", "TXN-020"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "INS-006",
    title: "Utilities trending steady",
    description:
      "Utility bills (electricity + internet) total $204.49 this month, consistent with the 3-month average of $198.",
    severity: "info",
    category: "Utilities & Bills",
    actionable: false,
    createdAt: new Date().toISOString(),
  },
];

// ─── Anomaly Alerts ───────────────────────────────────────────────────────────

export const MOCK_ANOMALIES: AnomalyAlert[] = MOCK_TRANSACTIONS.filter(
  (t) => t.isAnomaly
).map((t) => ({
  transactionId: t.id,
  transaction: t,
  reason: t.anomalyReason ?? "Unusual transaction detected",
  severity:
    Math.abs(t.amount) > 400
      ? "high"
      : Math.abs(t.amount) > 100
      ? "medium"
      : "low",
  detectedAt: new Date().toISOString(),
}));

// ─── Full Response ────────────────────────────────────────────────────────────

export function getMockApiResponse(): TransactionsApiResponse {
  const breakdown = computeCategoryBreakdown(MOCK_TRANSACTIONS);
  const summary = computeSummary(MOCK_TRANSACTIONS, "30d");

  return {
    transactions: MOCK_TRANSACTIONS,
    summary,
    categoryBreakdown: breakdown,
    monthlyTrends: MOCK_MONTHLY_TRENDS,
    anomalies: MOCK_ANOMALIES,
    lastSynced: new Date().toISOString(),
    source: "mock",
  };
}

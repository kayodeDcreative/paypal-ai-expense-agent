import { NextRequest, NextResponse } from "next/server";
import {
  fetchPayPalTransactions,
  hasPayPalCredentials,
} from "@/lib/paypal";
import {
  getMockApiResponse,
  computeCategoryBreakdown,
  computeSummary,
  MOCK_MONTHLY_TRENDS,
  MOCK_ANOMALIES,
} from "@/lib/mockData";
import { categorizeTransactions } from "@/lib/openai";
import { CategorizedTransaction } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const useMock = searchParams.get("mock") === "true" || !hasPayPalCredentials();

  // ── Mock mode: return pre-built data immediately ──
  if (useMock) {
    const data = getMockApiResponse();
    return NextResponse.json({ ...data, source: "mock" });
  }

  // ── Live PayPal sandbox mode ──
  try {
    const startDate = searchParams.get("start_date") ?? undefined;
    const endDate = searchParams.get("end_date") ?? undefined;

    // 1. Fetch raw transactions from PayPal
    const rawTransactions = await fetchPayPalTransactions({
      startDate,
      endDate,
      pageSize: 100,
    });

    if (rawTransactions.length === 0) {
      // No transactions found — fall back to mock to keep demo useful
      const data = getMockApiResponse();
      return NextResponse.json({ ...data, source: "paypal_sandbox_empty" });
    }

    // 2. AI categorization (batch)
    let categorized: CategorizedTransaction[];
    try {
      categorized = await categorizeTransactions(rawTransactions);
    } catch {
      // If AI fails, use simple rule-based fallback
      categorized = rawTransactions.map((t) => ({
        ...t,
        category: "Other" as const,
        confidence: 0.5,
        tags: [],
        isAnomaly: false,
      }));
    }

    // 3. Build derived data
    const summary = computeSummary(categorized, "30d");
    const categoryBreakdown = computeCategoryBreakdown(categorized);
    const anomalies = MOCK_ANOMALIES.filter((a) =>
      categorized.some((t) => t.id === a.transactionId)
    );

    return NextResponse.json({
      transactions: categorized,
      summary,
      categoryBreakdown,
      monthlyTrends: MOCK_MONTHLY_TRENDS,
      anomalies,
      lastSynced: new Date().toISOString(),
      source: "paypal_sandbox",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PayPal transactions]", message);

    // Graceful fallback to mock so the app is always usable
    const data = getMockApiResponse();
    return NextResponse.json({
      ...data,
      source: "mock_fallback",
      error: message,
    });
  }
}

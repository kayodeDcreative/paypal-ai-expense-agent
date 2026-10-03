import { NextRequest, NextResponse } from "next/server";
import { categorizeTransactions, hasOpenAIKey } from "@/lib/openai";
import { PayPalTransaction } from "@/lib/types";
import { MOCK_TRANSACTIONS } from "@/lib/mockData";

export async function POST(req: NextRequest) {
  // If no OpenAI key, return mock categorized transactions
  if (!hasOpenAIKey()) {
    return NextResponse.json({
      transactions: MOCK_TRANSACTIONS,
      source: "mock",
      model: "mock",
    });
  }

  let transactions: PayPalTransaction[];

  try {
    const body = await req.json();
    transactions = body.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'transactions' array" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const categorized = await categorizeTransactions(transactions);
    return NextResponse.json({
      transactions: categorized,
      count: categorized.length,
      source: "openai",
      model: "gpt-4o-mini",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI categorize]", message);
    return NextResponse.json(
      { error: "AI categorization failed", detail: message },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateInsights, hasOpenAIKey } from "@/lib/openai";
import { CategorizedTransaction } from "@/lib/types";
import { MOCK_AI_INSIGHTS } from "@/lib/mockData";

export async function POST(req: NextRequest) {
  // If no OpenAI key, return rich mock insights immediately
  if (!hasOpenAIKey()) {
    return NextResponse.json({
      insights: MOCK_AI_INSIGHTS,
      generatedAt: new Date().toISOString(),
      model: "mock",
      source: "mock",
    });
  }

  let transactions: CategorizedTransaction[];

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
    const insights = await generateInsights(transactions);

    return NextResponse.json({
      insights,
      generatedAt: new Date().toISOString(),
      model: "gpt-4o",
      source: "openai",
      count: insights.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI insights]", message);

    // Graceful fallback to mock insights
    return NextResponse.json({
      insights: MOCK_AI_INSIGHTS,
      generatedAt: new Date().toISOString(),
      model: "mock_fallback",
      source: "mock_fallback",
      error: message,
    });
  }
}

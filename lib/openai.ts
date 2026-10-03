/**
 * OpenAI client + AI agent helpers
 * Handles transaction categorization and financial insight generation
 */

import OpenAI from "openai";
import {
  PayPalTransaction,
  CategorizedTransaction,
  ExpenseCategory,
  AIInsight,
} from "./types";
import { computeCategoryBreakdown, computeSummary } from "./mockData";

// ─── Client ──────────────────────────────────────────────────────────────────

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local to enable AI features."
    );
  }
  return new OpenAI({ apiKey });
}

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// ─── System Prompts ──────────────────────────────────────────────────────────

const CATEGORIZE_SYSTEM_PROMPT = `You are a financial AI agent specializing in expense categorization.
Given a list of PayPal transactions (id, description, amount, counterparty), categorize each one.

Available categories (use EXACTLY these values):
- "Food & Dining"
- "Shopping"
- "Software & Subscriptions"
- "Travel"
- "Entertainment"
- "Health & Fitness"
- "Utilities & Bills"
- "Business Services"
- "Freelance Income"
- "Transfers"
- "Refunds"
- "Other"

Rules:
- Positive amounts = income (use "Freelance Income", "Refunds", or "Transfers" as appropriate)
- Negative amounts = expenses
- For each transaction, also provide:
  - confidence (0.0–1.0)
  - tags (array of 2–4 lowercase strings)
  - isAnomaly (boolean) — flag if amount is unusually large for the category
  - anomalyReason (string, only if isAnomaly is true)

Respond with ONLY a JSON array, no explanation. Format:
[
  {
    "id": "TXN-001",
    "category": "Food & Dining",
    "confidence": 0.97,
    "tags": ["food", "delivery"],
    "isAnomaly": false
  }
]`;

const INSIGHTS_SYSTEM_PROMPT = `You are a senior financial advisor AI. Given a user's expense summary and transaction data, 
generate 4–6 actionable financial insights.

Each insight must include:
- id: unique string like "INS-001"
- title: concise headline (max 10 words)
- description: 1–2 sentences with specific numbers from the data
- severity: "info" | "warning" | "critical" | "positive"
- category: (optional) matching expense category
- actionable: boolean
- suggestion: (optional) concrete action the user can take

Focus on:
1. Unusual spending patterns
2. Subscription audit opportunities
3. Income vs expense balance
4. Budget optimization recommendations
5. Positive financial behaviors worth reinforcing

Respond with ONLY a JSON array of insight objects, no explanation.`;

// ─── Batch Categorization ─────────────────────────────────────────────────────

const BATCH_SIZE = 20; // Avoid hitting token limits

export async function categorizeTransactions(
  transactions: PayPalTransaction[]
): Promise<CategorizedTransaction[]> {
  const client = getOpenAIClient();
  const results: CategorizedTransaction[] = [];

  // Process in batches
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    const batchInput = batch.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      counterparty: t.counterparty,
    }));

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CATEGORIZE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Categorize these transactions:\n${JSON.stringify(batchInput, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temp for consistent categorization
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let parsed: Array<{
      id: string;
      category: ExpenseCategory;
      confidence: number;
      tags: string[];
      isAnomaly: boolean;
      anomalyReason?: string;
    }>;

    try {
      // The model may wrap the array in an object key
      const obj = JSON.parse(raw);
      parsed = Array.isArray(obj) ? obj : (obj.transactions ?? obj.results ?? Object.values(obj)[0] ?? []);
    } catch {
      parsed = [];
    }

    // Merge AI enrichment back into original transactions
    for (const tx of batch) {
      const enrichment = parsed.find((p) => p.id === tx.id);
      results.push({
        ...tx,
        category: enrichment?.category ?? "Other",
        confidence: enrichment?.confidence ?? 0.5,
        tags: enrichment?.tags ?? [],
        isAnomaly: enrichment?.isAnomaly ?? false,
        anomalyReason: enrichment?.anomalyReason,
      });
    }
  }

  return results;
}

// ─── Insights Generation ──────────────────────────────────────────────────────

export async function generateInsights(
  transactions: CategorizedTransaction[]
): Promise<AIInsight[]> {
  const client = getOpenAIClient();

  const summary = computeSummary(transactions, "30d");
  const breakdown = computeCategoryBreakdown(transactions);
  const anomalies = transactions.filter((t) => t.isAnomaly);

  const contextData = {
    summary,
    topCategories: breakdown.slice(0, 6),
    anomalyCount: anomalies.length,
    anomalies: anomalies.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      reason: t.anomalyReason,
    })),
    recentTransactions: transactions.slice(0, 10).map((t) => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
      date: t.date,
    })),
  };

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: INSIGHTS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate financial insights based on this data:\n${JSON.stringify(contextData, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    const obj = JSON.parse(raw);
    const arr: AIInsight[] = Array.isArray(obj)
      ? obj
      : (obj.insights ?? obj.results ?? Object.values(obj)[0] ?? []);
    return arr.map((ins, i) => ({
      ...ins,
      id: ins.id ?? `INS-${String(i + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * AI Abstraction Layer
 * Supports multiple AI providers:
 * 1. Cloudflare Workers AI (primary - free on workers)
 * 2. OpenAI (fallback)
 * 3. Anthropic Claude (fallback)
 */

import { PayPalTransaction, CategorizedTransaction, ExpenseCategory } from "./types";

type AIProvider = "cloudflare-workers" | "openai" | "anthropic";

interface AIConfig {
  provider: AIProvider;
  openaiKey?: string;
  anthropicKey?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
}

let aiConfig: AIConfig = {
  provider: "cloudflare-workers",
  openaiKey: process.env.OPENAI_API_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
};

export function setAIConfig(config: Partial<AIConfig>) {
  aiConfig = { ...aiConfig, ...config };
}

export function getAIProvider(): AIProvider {
  // Determine best available provider
  if (aiConfig.cloudflareAccountId && aiConfig.cloudflareApiToken) {
    return "cloudflare-workers";
  }
  if (aiConfig.openaiKey) {
    return "openai";
  }
  if (aiConfig.anthropicKey) {
    return "anthropic";
  }
  // Default to cloudflare (for edge workers)
  return "cloudflare-workers";
}

/**
 * Categorize transactions using the configured AI provider
 */
export async function categorizeTransactions(
  transactions: PayPalTransaction[]
): Promise<CategorizedTransaction[]> {
  const provider = getAIProvider();

  if (provider === "cloudflare-workers") {
    return await categorizeWithCloudflareAI(transactions);
  } else if (provider === "openai") {
    return await categorizeWithOpenAI(transactions);
  } else if (provider === "anthropic") {
    return await categorizeWithAnthropic(transactions);
  }

  throw new Error("No AI provider configured");
}

/**
 * Generate insights using the configured AI provider
 */
export async function generateInsights(
  transactions: CategorizedTransaction[]
): Promise<any[]> {
  const provider = getAIProvider();

  if (provider === "cloudflare-workers") {
    return await generateInsightsCloudflareAI(transactions);
  } else if (provider === "openai") {
    return await generateInsightsOpenAI(transactions);
  } else if (provider === "anthropic") {
    return await generateInsightsAnthropic(transactions);
  }

  throw new Error("No AI provider configured");
}

// ─── Cloudflare Workers AI ──────────────────────────────────────────────────

async function categorizeWithCloudflareAI(
  transactions: PayPalTransaction[]
): Promise<CategorizedTransaction[]> {
  // For server-side rendering, use OpenAI as fallback since we don't have Cloudflare binding
  // In Cloudflare Workers, this would use the AI binding directly
  if (typeof window !== "undefined") {
    throw new Error("Cloudflare AI only works on server/workers");
  }

  // Call Cloudflare AI API (requires account ID and token)
  try {
    const batchInput = transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      counterparty: t.counterparty,
    }));

    const prompt = `You are a financial AI categorizing PayPal transactions. Categorize each transaction into one of these categories:
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

For each transaction provide: id, category, confidence (0-1), tags (array), isAnomaly (boolean), anomalyReason (optional).

Transactions to categorize:
${JSON.stringify(batchInput, null, 2)}

Return ONLY a JSON array, no explanation.`;

    // Use Cloudflare API endpoint
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${aiConfig.cloudflareAccountId}/ai/run/llama_2_7b_chat_int8`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${aiConfig.cloudflareApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare AI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const text = data.result?.response || "{}";

    try {
      const parsed = JSON.parse(text);
      const categories = Array.isArray(parsed) ? parsed : parsed.transactions || [];

      return transactions.map((tx) => {
        const enrichment = categories.find((c: any) => c.id === tx.id);
        return {
          ...tx,
          category: enrichment?.category || "Other",
          confidence: enrichment?.confidence || 0.5,
          tags: enrichment?.tags || [],
          isAnomaly: enrichment?.isAnomaly || false,
          anomalyReason: enrichment?.anomalyReason,
        } as CategorizedTransaction;
      });
    } catch {
      throw new Error("Failed to parse Cloudflare AI response");
    }
  } catch (err) {
    console.warn("Cloudflare AI failed, falling back to OpenAI");
    return await categorizeWithOpenAI(transactions);
  }
}

async function generateInsightsCloudflareAI(
  _transactions: CategorizedTransaction[]
): Promise<any[]> {
  console.warn("Cloudflare AI insights not implemented, using OpenAI fallback");
  return await generateInsightsOpenAI(_transactions);
}

// ─── OpenAI ────────────────────────────────────────────────────────────────

async function categorizeWithOpenAI(
  transactions: PayPalTransaction[]
): Promise<CategorizedTransaction[]> {
  if (!aiConfig.openaiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: aiConfig.openaiKey });

  const SYSTEM_PROMPT = `You are a financial AI agent specializing in expense categorization.
Given a list of PayPal transactions, categorize each one.

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

For each transaction, provide: id, category, confidence (0-1), tags (2-4 items), isAnomaly, anomalyReason (if anomaly).
Respond with ONLY a JSON array, no explanation.`;

  const results: CategorizedTransaction[] = [];

  // Process in batches
  const BATCH_SIZE = 20;
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
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Categorize these transactions:\n${JSON.stringify(batchInput, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const raw = response.choices[0]?.message?.content || "{}";

    try {
      const obj = JSON.parse(raw);
      const parsed = Array.isArray(obj) ? obj : obj.transactions || Object.values(obj)[0] || [];

      for (const tx of batch) {
        const enrichment = (parsed as any[]).find((p: any) => p.id === tx.id);
        results.push({
          ...tx,
          category: enrichment?.category || "Other",
          confidence: enrichment?.confidence || 0.5,
          tags: enrichment?.tags || [],
          isAnomaly: enrichment?.isAnomaly || false,
          anomalyReason: enrichment?.anomalyReason,
        });
      }
    } catch {
      // Fallback for unparseable response
      batch.forEach((tx) => {
        results.push({
          ...tx,
          category: "Other",
          confidence: 0.5,
          tags: [],
          isAnomaly: false,
        });
      });
    }
  }

  return results;
}

async function generateInsightsOpenAI(
  transactions: CategorizedTransaction[]
): Promise<any[]> {
  if (!aiConfig.openaiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: aiConfig.openaiKey });

  const SYSTEM_PROMPT = `You are a senior financial advisor AI. Generate 4-6 actionable insights.
Each insight must include: id, title (max 10 words), description, severity, category, actionable, suggestion.
Respond with ONLY a JSON array, no explanation.`;

  const contextData = {
    totalSpent: transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalIncome: transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
    topCategories: [...new Set(transactions.map((t) => t.category))].slice(0, 5),
  };

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate insights for this spending data:\n${JSON.stringify(contextData, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const raw = response.choices[0]?.message?.content || "{}";

  try {
    const obj = JSON.parse(raw);
    return Array.isArray(obj) ? obj : obj.insights || Object.values(obj)[0] || [];
  } catch {
    return [];
  }
}

// ─── Anthropic Claude ──────────────────────────────────────────────────────

async function categorizeWithAnthropic(
  transactions: PayPalTransaction[]
): Promise<CategorizedTransaction[]> {
  if (!aiConfig.anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: aiConfig.anthropicKey });

  const SYSTEM_PROMPT = `You are a financial AI agent specializing in expense categorization.
Categorize transactions into: Food & Dining, Shopping, Software & Subscriptions, Travel, Entertainment, Health & Fitness, Utilities & Bills, Business Services, Freelance Income, Transfers, Refunds, Other.
For each, provide: id, category, confidence (0-1), tags (array), isAnomaly (boolean), anomalyReason (optional).
Respond with ONLY a JSON array.`;

  const results: CategorizedTransaction[] = [];

  // Process in batches
  const BATCH_SIZE = 15; // Claude has lower limits than OpenAI
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    const batchInput = batch.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      counterparty: t.counterparty,
    }));

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Categorize:\n${JSON.stringify(batchInput, null, 2)}`,
        },
      ],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";

    try {
      const obj = JSON.parse(raw);
      const parsed = Array.isArray(obj) ? obj : obj.transactions || Object.values(obj)[0] || [];

      for (const tx of batch) {
        const enrichment = (parsed as any[]).find((p: any) => p.id === tx.id);
        results.push({
          ...tx,
          category: enrichment?.category || "Other",
          confidence: enrichment?.confidence || 0.5,
          tags: enrichment?.tags || [],
          isAnomaly: enrichment?.isAnomaly || false,
          anomalyReason: enrichment?.anomalyReason,
        });
      }
    } catch {
      batch.forEach((tx) => {
        results.push({
          ...tx,
          category: "Other",
          confidence: 0.5,
          tags: [],
          isAnomaly: false,
        });
      });
    }
  }

  return results;
}

async function generateInsightsAnthropic(
  transactions: CategorizedTransaction[]
): Promise<any[]> {
  if (!aiConfig.anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: aiConfig.anthropicKey });

  const SYSTEM_PROMPT = `You are a financial advisor. Generate 3-5 actionable financial insights.
Each insight: {id, title, description, severity: "info"|"warning"|"positive", actionable, suggestion}.
Respond with ONLY a JSON array.`;

  const contextData = {
    totalSpent: transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalIncome: transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
  };

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate insights:\n${JSON.stringify(contextData, null, 2)}`,
      },
    ],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";

  try {
    const obj = JSON.parse(raw);
    return Array.isArray(obj) ? obj : obj.insights || [];
  } catch {
    return [];
  }
}

export { AIProvider };

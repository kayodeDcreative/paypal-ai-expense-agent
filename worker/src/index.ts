/**
 * Cloudflare Workers AI Expense Agent
 * 
 * Durable Object: ExpenseAgent
 * - Manages user expense state and history
 * - Fetches PayPal transactions
 * - Caches data in KV namespace
 * - Callable methods for sync + insights
 */

import {
  Agent,
  unstable_callable,
  routeAgentRequest,
  Connection,
} from "agents";

interface ExpenseState {
  userId: string;
  lastSyncedAt: string | null;
  transactionCount: number;
  totalSpent: number;
  totalIncome: number;
  lastError: string | null;
}

export class ExpenseAgent extends Agent<Env, ExpenseState> {
  initialState: ExpenseState = {
    userId: (this as any).ctx?.id?.toString() || "unknown",
    lastSyncedAt: null,
    transactionCount: 0,
    totalSpent: 0,
    totalIncome: 0,
    lastError: null,
  };

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  async onStart(): Promise<void> {
    console.log(`[ExpenseAgent] Started for user: ${this.state.userId}`);
    // Initialize SQL schema on first start
    await this.initializeDatabase();
  }

  async initializeDatabase(): Promise<void> {
    try {
      // Create transactions table if not exists
      await this.sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'USD',
          status TEXT,
          category TEXT,
          confidence REAL,
          is_anomaly BOOLEAN DEFAULT 0,
          tags TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create index for user lookups
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_user_date 
        ON transactions(user_id, date DESC)
      `;

      console.log("[ExpenseAgent] Database initialized");
    } catch (err) {
      console.error("[ExpenseAgent] Database init error:", err);
    }
  }

  validateStateChange(
    nextState: ExpenseState,
    _source: Connection | "server"
  ): void {
    // Ensure required fields exist
    if (!nextState.userId) {
      throw new Error("userId is required");
    }
    if (nextState.transactionCount < 0) {
      throw new Error("transactionCount cannot be negative");
    }
  }

  onStateUpdate(state: ExpenseState, _source: Connection | "server"): void {
    console.log(`[ExpenseAgent] State updated for ${state.userId}:`, state);
  }

  // ─── Callable: Sync Transactions ────────────────────────────────────────

  @unstable_callable()
  async syncTransactions(
    options?: { startDate?: string; endDate?: string }
  ): Promise<{
    success: boolean;
    count: number;
    totalSpent: number;
    totalIncome: number;
    error?: string;
  }> {
    try {
      // Fetch from PayPal API
      const transactions = await this.fetchPayPalTransactions(
        options?.startDate,
        options?.endDate
      );

      if (!transactions || transactions.length === 0) {
        return {
          success: true,
          count: 0,
          totalSpent: 0,
          totalIncome: 0,
        };
      }

      // Store in SQL
      let totalSpent = 0;
      let totalIncome = 0;

      for (const tx of transactions) {
        const amount = parseFloat(tx.amount as any);
        if (amount < 0) {
          totalSpent += Math.abs(amount);
        } else {
          totalIncome += amount;
        }

        // Upsert transaction
        await this.sql`
          INSERT INTO transactions (
            id, user_id, date, description, amount, currency, status, created_at
          ) VALUES (
            ${tx.id},
            ${this.state.userId},
            ${tx.date},
            ${tx.description},
            ${amount},
            ${tx.currency || "USD"},
            ${tx.status},
            ${new Date().toISOString()}
          )
          ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        `;
      }

      // Update state
      this.setState({
        ...this.state,
        lastSyncedAt: new Date().toISOString(),
        transactionCount: transactions.length,
        totalSpent,
        totalIncome,
        lastError: null,
      });

      // Cache in KV
      if ((this as any).env.CACHE) {
        await (this as any).env.CACHE.put(
          `transactions:${this.state.userId}`,
          JSON.stringify({
            transactions,
            cachedAt: new Date().toISOString(),
            count: transactions.length,
          }),
          { expirationTtl: 3600 } // 1 hour cache
        );
      }

      return {
        success: true,
        count: transactions.length,
        totalSpent,
        totalIncome,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.setState({
        ...this.state,
        lastError: error,
      });
      return {
        success: false,
        count: 0,
        totalSpent: 0,
        totalIncome: 0,
        error,
      };
    }
  }

  // ─── Callable: Get Summary ──────────────────────────────────────────────

  @unstable_callable()
  async getSummary(period: "7d" | "30d" | "90d" = "30d"): Promise<{
    totalSpent: number;
    totalIncome: number;
    netBalance: number;
    transactionCount: number;
    period: string;
  }> {
    const daysAgo = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    }[period];

    const cutoffDate = new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await this.sql`
      SELECT 
        COUNT(*) as count,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as spent,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
      FROM transactions
      WHERE user_id = ${this.state.userId} AND date >= ${cutoffDate}
    `;

    const row = result[0] as any;
    const totalSpent = row?.spent || 0;
    const totalIncome = row?.income || 0;

    return {
      totalSpent,
      totalIncome,
      netBalance: totalIncome - totalSpent,
      transactionCount: row?.count || 0,
      period,
    };
  }

  // ─── Callable: Get Transactions ─────────────────────────────────────────

  @unstable_callable()
  async getTransactions(
    options?: { limit?: number; offset?: number; category?: string }
  ): Promise<any[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const category = options?.category;

    let query = this.sql`
      SELECT * FROM transactions
      WHERE user_id = ${this.state.userId}
    `;

    if (category) {
      query = this.sql`
        SELECT * FROM transactions
        WHERE user_id = ${this.state.userId} AND category = ${category}
      `;
    }

    const result = await query;

    return Array.isArray(result)
      ? result.slice(offset, offset + limit)
      : [];
  }

  // ─── Private: Categorize with Workers AI ────────────────────────────────

  private async categorizeWithWorkersAI(
    transactions: any[],
    env: Env
  ): Promise<Array<{ id: string; category: string; confidence: number; isAnomaly: boolean }>> {
    // Build prompt with transaction list
    const txList = transactions.map((tx) => 
      `- ID: ${tx.id}, Description: ${tx.description}, Amount: ${tx.amount} ${tx.currency || "USD"}`
    ).join("\n");

    const prompt = `You are a financial categorization assistant. Categorize each transaction into one of these categories: Food & Dining, Shopping, Transportation, Bills & Utilities, Entertainment, Health & Medical, Travel, Personal, Business, Other.

For each transaction, return a JSON object with:
- id: transaction ID
- category: the category name
- confidence: confidence score between 0 and 1
- isAnomaly: true if the transaction seems unusual or suspicious

Transactions:
${txList}

Return ONLY a valid JSON array of objects, no other text.`;

    // Try Workers AI first
    try {
      const aiResponse = await (env.AI as any).run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
      });
      
      // Parse the response
      let responseText = "";
      if (typeof aiResponse === "string") {
        responseText = aiResponse;
      } else if (aiResponse.response) {
        responseText = aiResponse.response;
      }

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error("[ExpenseAgent] Workers AI error:", err);
      // Fall through to next provider
    }

    // Fallback 1: OpenAI
    const openaiKey = (env as any).OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
        });

        if (openaiResponse.ok) {
          const data = (await openaiResponse.json()) as any;
          const content = data.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.error("[ExpenseAgent] OpenAI error:", err);
        // Fall through to next provider
      }
    }

    // Fallback 2: Anthropic
    const anthropicKey = (env as any).ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (anthropicResponse.ok) {
          const data = (await anthropicResponse.json()) as any;
          const content = data.content?.[0]?.text || "";
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.error("[ExpenseAgent] Anthropic error:", err);
      }
    }

    // If all providers failed, return basic categorization
    return transactions.map((tx) => ({
      id: tx.id,
      category: "Other",
      confidence: 0.1,
      isAnomaly: false,
    }));
  }

  // ─── Private: Fetch PayPal Transactions ─────────────────────────────────

  private async fetchPayPalTransactions(
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    if (!(this as any).env.PAYPAL_CLIENT_ID || !(this as any).env.PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials not configured");
    }

    // Get access token
    const token = await this.getPayPalToken();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const start =
      startDate || thirtyDaysAgo.toISOString().split(".")[0] + "Z";
    const end = endDate || now.toISOString().split(".")[0] + "Z";

    const url = new URL("https://api-m.sandbox.paypal.com/v1/reporting/transactions");
    url.searchParams.set("start_date", start);
    url.searchParams.set("end_date", end);
    url.searchParams.set("page_size", "100");
    url.searchParams.set("fields", "all");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`PayPal API error: ${res.status}`);
    }

    const data = (await res.json()) as any;
    const details = data.transaction_details || [];

    return details.map((item: any) => {
      const info = item.transaction_info;
      const payer = item.payer_info;
      const amount = parseFloat(info.transaction_amount?.value || "0");

      return {
        id: info.transaction_id,
        date: info.transaction_initiation_date,
        description:
          info.transaction_subject ||
          info.transaction_note ||
          "PayPal Transaction",
        amount,
        currency: info.transaction_amount?.currency_code || "USD",
        status: info.transaction_status,
        counterparty:
          payer?.payer_name?.alternate_full_name || payer?.email_address || "Unknown",
        counterpartyEmail: payer?.email_address,
      };
    });
  }

  // ─── Private: Get PayPal Access Token ───────────────────────────────────

  private async getPayPalToken(): Promise<string> {
    // Try to get from KV cache first
    if ((this as any).env.CACHE) {
      const cached = await (this as any).env.CACHE.get("paypal:token");
      if (cached) {
        try {
          const data = JSON.parse(cached) as any;
          if (data.expiresAt > Date.now()) {
            return data.token;
          }
        } catch {
          // Invalid cache, continue
        }
      }
    }

    const credentials = Buffer.from(
      `${(this as any).env.PAYPAL_CLIENT_ID}:${(this as any).env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to get PayPal token");
    }

    const data = (await res.json()) as any;
    const token = data.access_token;
    const expiresIn = data.expires_in || 3600;

    // Cache the token
    if ((this as any).env.CACHE) {
      await (this as any).env.CACHE.put(
        "paypal:token",
        JSON.stringify({
          token,
          expiresAt: Date.now() + (expiresIn - 60) * 1000,
        }),
        { expirationTtl: expiresIn - 60 }
      );
    }

    return token;
  }
}

// ─── HTTP Request Handler ───────────────────────────────────────────────────

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: any
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Route agent requests
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) {
      // Add CORS headers
      const headers = new Headers(agentResponse.headers);
      headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN || "*");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return new Response(agentResponse.body, {
        status: agentResponse.status,
        headers,
      });
    }

    // Health check
    if (request.url.includes("/health")) {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
        },
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      },
    });
  },
};

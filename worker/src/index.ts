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
    userId: this.id?.toString() || "unknown",
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

  @callable()
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
      if (this.env.CACHE) {
        await this.env.CACHE.put(
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

  @callable()
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

  @callable()
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

  // ─── Private: Fetch PayPal Transactions ─────────────────────────────────

  private async fetchPayPalTransactions(
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    if (!this.env.PAYPAL_CLIENT_ID || !this.env.PAYPAL_CLIENT_SECRET) {
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
    if (this.env.CACHE) {
      const cached = await this.env.CACHE.get("paypal:token");
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
      `${this.env.PAYPAL_CLIENT_ID}:${this.env.PAYPAL_CLIENT_SECRET}`
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
    if (this.env.CACHE) {
      await this.env.CACHE.put(
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
    ctx: ExecutionContext
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
    const agentResponse = routeAgentRequest(request, env);
    if (agentResponse) {
      // Add CORS headers
      const response = await agentResponse;
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN || "*");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return new Response(response.body, {
        status: response.status,
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

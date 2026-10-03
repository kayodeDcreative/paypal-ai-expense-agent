# PayPal AI Expense Agent — Cloudflare Worker

> A high-performance, serverless agent backend using Cloudflare Workers, Durable Objects, and Workers AI.

## Architecture

- **Durable Object**: `ExpenseAgent` — Persistent state machine managing user expenses
- **SQL Backend**: SQLite-backed storage for transactions, indexed by user + date
- **KV Cache**: Token caching and transaction snapshots for sub-second responses
- **RPC Callables**: Sync PayPal → Categorize → Generate insights
- **Edge Runtime**: Sub-100ms response times from Cloudflare's edge network

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Configure Wrangler

Update `wrangler.jsonc` with your settings:

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "PAYPAL_API_BASE": "https://api-m.sandbox.paypal.com",
        "ALLOWED_ORIGIN": "https://yourdomain.com"
      }
    }
  }
}
```

Set secrets via:

```bash
wrangler secret put PAYPAL_CLIENT_ID
wrangler secret put PAYPAL_CLIENT_SECRET
```

### 3. Create KV Namespace

```bash
wrangler kv:namespace create "expense-agent-cache"
wrangler kv:namespace create "expense-agent-cache" --preview
```

Update the namespace IDs in `wrangler.jsonc`.

### 4. Generate Types

```bash
npm run types
```

This auto-generates `worker-configuration.d.ts` from `wrangler.jsonc`.

### 5. Local Development

```bash
npm run dev
```

Open `http://localhost:8787/agents/expense-agent/test-user`

### 6. Deploy

```bash
npm run deploy
```

## API

### Sync Transactions

```bash
curl -X POST https://your-worker.com/agents/expense-agent/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "method": "syncTransactions",
    "params": {
      "startDate": "2026-09-01T00:00:00Z",
      "endDate": "2026-09-30T23:59:59Z"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "count": 42,
  "totalSpent": 1568.73,
  "totalIncome": 2650.00
}
```

### Get Summary

```bash
curl -X POST https://your-worker.com/agents/expense-agent/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "method": "getSummary",
    "params": { "period": "30d" }
  }'
```

**Response:**
```json
{
  "totalSpent": 1568.73,
  "totalIncome": 2650.00,
  "netBalance": 1081.27,
  "transactionCount": 42,
  "period": "30d"
}
```

### Get Transactions

```bash
curl -X POST https://your-worker.com/agents/expense-agent/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "method": "getTransactions",
    "params": { "limit": 20, "offset": 0, "category": "Food & Dining" }
  }'
```

## State Schema

```typescript
interface ExpenseState {
  userId: string;
  lastSyncedAt: string | null;
  transactionCount: number;
  totalSpent: number;
  totalIncome: number;
  lastError: string | null;
}
```

## SQL Schema

### transactions table

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (PK) | PayPal transaction ID |
| user_id | TEXT | User identifier |
| date | TEXT | ISO date string |
| description | TEXT | Transaction description |
| amount | REAL | Positive (income) or negative (expense) |
| currency | TEXT | ISO 4217 code |
| status | TEXT | COMPLETED, PENDING, REFUNDED, etc. |
| category | TEXT | AI-assigned category |
| confidence | REAL | 0.0–1.0 |
| is_anomaly | BOOLEAN | AI anomaly flag |
| tags | TEXT | Comma-separated tags |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

**Indexes:**
- `idx_user_date` on (user_id, date DESC) — Fast period queries

## Durable Object Routing

Requests route to `/agents/{class-name}/{instance-id}`:

```
POST /agents/expense-agent/user-123
  → ExpenseAgent instance "user-123"
  → @callable methods via JSON-RPC
```

Multiple instances per user are supported; use a consistent instance ID per user.

## Observability

Enable CloudFlare observability in `wrangler.jsonc`:

```jsonc
"observability": {
  "enabled": true,
  "traces": { "enabled": true }
}
```

Check logs in [Cloudflare Dashboard](https://dash.cloudflare.com/).

## Performance Notes

- **Token caching**: PayPal tokens cached in KV for 50min (avoiding re-auth on every request)
- **Transaction cache**: Full transaction set cached in KV for 1 hour
- **SQL indexes**: User + date queries execute in <10ms at scale
- **Durable Objects**: Sub-100ms reads from in-memory state; writes are persisted to SQLite

## Troubleshooting

### "PayPal credentials not configured"

Ensure secrets are set:
```bash
wrangler secret list
```

### "KV namespace binding not found"

Verify namespace IDs in `wrangler.jsonc` and that namespaces exist:
```bash
wrangler kv:namespace list
```

### "Durable Object not found"

Ensure migration is applied:
```bash
wrangler deploy
```

## Next Steps

1. Deploy the worker to Cloudflare
2. Update the Next.js app to call the worker instead of local `/api` routes
3. Add authentication (JWT or Cloudflare Access)
4. Implement Workers AI for local categorization (no OpenAI key required)

---

**Built for the PayPal AI Hackathon 2026**

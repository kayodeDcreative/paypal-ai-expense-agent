# Cloudflare Worker Integration Guide

This document explains how to integrate the Cloudflare Worker backend with the Next.js frontend.

## Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │
│  (localhost:3000)   │
└──────────┬──────────┘
           │ fetch("/api/paypal/transactions")
           │ (currently: local Next.js API route)
           │
           ├─ Option A: Keep local during dev
           │
           └─ Option B: Proxy to Cloudflare Worker
              (in production)

┌──────────────────────────────────┐
│  Cloudflare Worker (Edge)        │
│  ├─ ExpenseAgent (Durable Object)│
│  │  ├─ @callable syncTransactions│
│  │  ├─ @callable getSummary      │
│  │  └─ @callable getTransactions │
│  ├─ KV Namespace (Cache)         │
│  └─ SQLite (Transactions DB)     │
└──────────────────────────────────┘
           ↓
   ┌──────────────────┐
   │   PayPal API     │
   │   (Sandbox)      │
   └──────────────────┘
```

## Development Setup

During development, continue using the local Next.js API routes (`/api/paypal/transactions`, etc.). This allows you to:
- Test without deploying to Cloudflare
- Use local environment variables
- Iterate quickly

## Production Setup

### 1. Deploy Worker

```bash
cd worker
npm run deploy
```

Record the deployed URL, e.g.: `https://paypal-ai-expense-agent.your-subdomain.workers.dev`

### 2. Update Next.js API Routes (Optional)

Create a proxy layer in the Next.js app to forward requests to the worker:

**`app/api/paypal/transactions/route.ts`** (modify existing):

```typescript
import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:3000"; // Fallback to local

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || "current-user";
  
  // Use worker if configured, otherwise fall back to local logic
  if (process.env.NEXT_PUBLIC_WORKER_URL) {
    const workerUrl = new URL(
      `/agents/expense-agent/${userId}`,
      WORKER_URL
    );
    
    const res = await fetch(workerUrl.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "getSummary",
        params: { period: "30d" },
      }),
    });
    
    return NextResponse.json(await res.json());
  }

  // Local fallback (existing logic)
  return NextResponse.json({ /* existing mock/local code */ });
}
```

### 3. Set Environment Variables

In `.env.local`:
```env
# Worker URL (optional; use local routes by default)
NEXT_PUBLIC_WORKER_URL=https://paypal-ai-expense-agent.your-subdomain.workers.dev

# Keep PayPal credentials here for local development
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
OPENAI_API_KEY=your_openai_key
```

### 4. Authentication (Recommended)

Add Cloudflare Access or JWT auth to secure the worker:

```typescript
// In worker/src/index.ts, add to fetch handler:
const authHeader = request.headers.get("Authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return new Response("Unauthorized", { status: 401 });
}

const token = authHeader.slice(7);
// Verify token (implement with your auth provider)
```

Then update the Next.js client to send auth headers:

```typescript
const res = await fetch(workerUrl, {
  headers: {
    Authorization: `Bearer ${await getAuthToken()}`,
    "Content-Type": "application/json",
  },
});
```

## Testing the Worker

### Local Development

```bash
cd worker
npm run dev
# Opens http://localhost:8787
```

### Remote Testing

```bash
curl -X POST https://paypal-ai-expense-agent.your-subdomain.workers.dev/agents/expense-agent/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "method": "syncTransactions",
    "params": {}
  }'
```

## Comparison: Local vs. Worker

| Aspect | Local API Routes | Cloudflare Worker |
|--------|------------------|-------------------|
| **Latency** | ~50-200ms | <50ms (edge cached) |
| **Scalability** | Limited to server resources | Auto-scales globally |
| **Cost** | Server compute costs | Free tier: 100k req/day |
| **Cold starts** | N/A | <10ms after deploy |
| **State management** | In-memory (resets per deploy) | Persisted in Durable Objects |
| **Database** | None (or external) | SQLite (included) |
| **Setup complexity** | Simple | More infrastructure |

## Recommended Migration Path

1. **Phase 1 (Development)**: Use local Next.js routes
2. **Phase 2 (Staging)**: Deploy worker, test integration
3. **Phase 3 (Production)**: Switch frontend to hit worker; keep local routes as fallback

## Troubleshooting

### Worker times out on PayPal sync

- Check `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` are set correctly
- Verify sandbox API endpoint is accessible
- Worker request timeout is 30s by default

### CORS errors

Ensure `ALLOWED_ORIGIN` is set correctly in `wrangler.jsonc`:

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "ALLOWED_ORIGIN": "https://your-frontend-domain.com"
      }
    }
  }
}
```

### Durable Object not persisting state

- Verify migration in `wrangler.jsonc`:
  ```jsonc
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["ExpenseAgent"] }]
  ```
- Redeploy after migration changes

## Next: Connect to Frontend

Once the worker is deployed and tested:

1. Update `app/api/paypal/transactions/route.ts` to proxy to worker
2. Add `NEXT_PUBLIC_WORKER_URL` environment variable
3. Deploy Next.js frontend
4. Monitor logs in Cloudflare Dashboard

---

**Ready to ship?** See [SUBMISSION.md](./SUBMISSION.md) for hackathon submission checklist.

# Deploying to Cloudflare Workers + Pages

Deploy the PayPal AI Expense Agent to **Cloudflare Workers** (backend) + **Cloudflare Pages** (frontend) for production-grade performance, global edge caching, and zero-config deployment.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Cloudflare Global Network               │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │  Cloudflare Pages (Frontend)           │    │
│  │  ├─ Next.js build output               │    │
│  │  ├─ Static HTML/CSS/JS                 │    │
│  │  ├─ Pages Functions (middleware)       │    │
│  │  └─ 200+ edge locations                │    │
│  └──────────────────┬──────────────────────┘    │
│                     │ fetch("/api/...")         │
│  ┌──────────────────▼──────────────────────┐   │
│  │  Cloudflare Workers (Backend)           │   │
│  │  ├─ Durable Objects (State)             │   │
│  │  ├─ SQLite (Transactions)               │   │
│  │  ├─ KV Namespace (Cache)                │   │
│  │  └─ Edge Compute                        │   │
│  └──────────────────┬──────────────────────┘   │
│                     │                           │
│        ┌────────────┴──────────────┐            │
│        ▼                           ▼            │
│    PayPal API               OpenAI API          │
│    (Sandbox)                (GPT-4o)            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Prerequisites

1. **Cloudflare Account** (free or paid)
   - Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/)

2. **Wrangler CLI**
   ```bash
   npm install -g @cloudflare/wrangler
   # or
   npm install -D wrangler
   ```

3. **Git & GitHub**
   - Public GitHub repo with your code

4. **PayPal Sandbox Credentials**
   - Get from [developer.paypal.com](https://developer.paypal.com/)

5. **OpenAI API Key**
   - Get from [platform.openai.com](https://platform.openai.com/)

## Step 1: Prepare Your Code

### 1a. Update Environment Variables

Create `.env.production` for production secrets:

```env
NEXT_PUBLIC_APP_URL=https://paypal-ai-expense-agent.pages.dev
NEXT_PUBLIC_WORKER_URL=https://paypal-ai-expense-agent-worker.your-subdomain.workers.dev
```

Never commit secrets to git. Cloudflare will handle them via dashboard.

### 1b. Verify Build Works Locally

```bash
npm run build
npm start
# Should work without errors
```

### 1c. Push to GitHub

```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

## Step 2: Deploy Worker Backend

### 2a. Create Worker Project

```bash
cd worker
wrangler init paypal-ai-expense-agent-worker
# Choose: "yes" for TypeScript, "no" for git init
```

### 2b. Configure Worker

Edit `worker/wrangler.jsonc`:

```jsonc
{
  "name": "paypal-ai-expense-agent-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-03",
  "compatibility_flags": ["nodejs_compat"],

  "ai": {
    "binding": "AI"
  },

  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "expense_agent_cache",
      "preview_id": "expense_agent_cache_preview"
    }
  ],

  "durable_objects": {
    "bindings": [
      {
        "name": "EXPENSE_AGENT",
        "class_name": "ExpenseAgent"
      }
    ]
  },

  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["ExpenseAgent"]
    }
  ],

  "observability": {
    "enabled": true,
    "traces": { "enabled": true }
  }
}
```

### 2c. Create KV Namespace

```bash
wrangler kv:namespace create "expense-agent-cache"
wrangler kv:namespace create "expense-agent-cache" --preview

# Copy the IDs into wrangler.jsonc:
# "id": "abc123def456..."
# "preview_id": "xyz789uvw..."
```

### 2d. Set Worker Secrets

```bash
wrangler secret put PAYPAL_CLIENT_ID
# Paste: your PayPal sandbox client ID
# Press Ctrl+D or Ctrl+C when done

wrangler secret put PAYPAL_CLIENT_SECRET
# Paste: your PayPal sandbox secret

wrangler secret put OPENAI_API_KEY
# Paste: your OpenAI API key
```

### 2e. Deploy Worker

```bash
wrangler deploy

# Output:
# ✓ Uploaded paypal-ai-expense-agent-worker
# ✓ Published to https://paypal-ai-expense-agent-worker.your-subdomain.workers.dev
```

**Save the deployed URL** — you'll need it for Pages config.

### 2f. Test Worker

```bash
curl -X POST https://paypal-ai-expense-agent-worker.your-subdomain.workers.dev/agents/expense-agent/test-user \
  -H "Content-Type: application/json" \
  -d '{"method":"getSummary","params":{"period":"30d"}}'

# Should return:
# {"totalSpent":0,"totalIncome":0,"netBalance":0,"transactionCount":0,"period":"30d"}
```

## Step 3: Deploy Pages Frontend

### 3a. Connect GitHub to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. **Pages** → **Create a project** → **Connect to Git**
3. Authorize GitHub
4. Select your `paypal-ai-expense-agent` repo
5. Click **Begin setup**

### 3b. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Framework preset** | `Next.js` |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |

### 3c. Add Environment Variables

Go to **Settings** → **Environment variables** → **Production**

Add:
```
NEXT_PUBLIC_APP_URL=https://paypal-ai-expense-agent.pages.dev
NEXT_PUBLIC_WORKER_URL=https://paypal-ai-expense-agent-worker.your-subdomain.workers.dev
NEXT_PUBLIC_PAYPAL_CLIENT_ID=[your sandbox client ID]
PAYPAL_CLIENT_SECRET=[your sandbox secret]
OPENAI_API_KEY=[your OpenAI key]
```

Also add to **Preview** environment for staging builds.

### 3d. Deploy

Click **Save and Deploy**

Cloudflare will:
1. Clone your repo
2. Install dependencies
3. Run `npm run build`
4. Deploy to global CDN
5. Takes ~2–3 minutes

**Your app is now live at:** `https://paypal-ai-expense-agent.pages.dev`

## Step 4: Configure Pages to Call Worker

### 4a. Update Page Functions

The Pages Functions middleware (in `functions/_middleware.ts`) will proxy API requests:

```typescript
export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  
  // Proxy /api/* to Worker
  if (request.url.includes("/api/")) {
    const workerUrl = new URL(
      request.url.replace(/^.*\/api\//, "/"),
      "https://paypal-ai-expense-agent-worker.your-subdomain.workers.dev"
    );
    
    return fetch(workerUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }
  
  return context.next();
};
```

### 4b. Redeploy Pages

```bash
git add .
git commit -m "Add Cloudflare Pages Functions middleware"
git push origin main
```

Cloudflare will auto-deploy.

## Step 5: Custom Domain (Optional)

### 5a. Add Domain to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. **Pages** → Select your project → **Custom domains**
3. Add your domain (e.g., `expense-agent.mysite.com`)
4. Cloudflare auto-provisions SSL certificate

### 5b. Update DNS

If your domain isn't on Cloudflare, add DNS records pointing to Pages:

```
CNAME  expense-agent.mysite.com  paypal-ai-expense-agent.pages.dev
```

## Monitoring & Logs

### View Logs

```bash
# Pages logs
wrangler pages project download logs

# Worker logs
wrangler tail

# Live streaming:
wrangler tail --follow
```

### Cloudflare Dashboard

Monitor in real-time:
- **Pages** → Select project → **Deployments** (see build history)
- **Workers** → Select worker → **Logs** (live tail)
- **KV** → View key usage

## Cost Analysis

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Pages (Frontend)** | 1 build/day, 500 builds/month | Included |
| **Workers (Backend)** | 100k requests/day | $0.50/M requests over free tier |
| **KV Namespace** | 100k ops/day | $5/month after free tier |
| **Durable Objects** | 1M requests/month | $0.15/M requests after free tier |
| **Total (free tier)** | Fully free | $0 unless you scale massively |

**For the hackathon:** You'll stay in the free tier easily.

## Deployment Checklist

- [ ] Worker deployed and tested
- [ ] KV namespace created
- [ ] Worker secrets set (PayPal, OpenAI)
- [ ] Pages project connected to GitHub
- [ ] Build settings configured (Next.js preset)
- [ ] Environment variables set (WORKER_URL, etc.)
- [ ] Pages deployment successful
- [ ] Custom domain configured (optional)
- [ ] Test end-to-end (Pages → Worker → PayPal → OpenAI)
- [ ] Demo video shows live URL
- [ ] GitHub repo is public

## Troubleshooting

### "Worker deployment failed: 413 Payload Too Large"

Worker code is too large. Remove unused dependencies:

```bash
cd worker
npm prune --production
wrangler deploy
```

### "Pages build failed: memory limit exceeded"

Increase build memory or simplify build:

```bash
# In wrangler.jsonc (root):
"build": {
  "cwd": "."
}
```

### "CORS error when calling Worker from Pages"

Ensure middleware in `functions/_middleware.ts` sets CORS headers:

```typescript
headers.set("Access-Control-Allow-Origin", "*");
```

### "Durable Object state not persisting"

Check migration in `worker/wrangler.jsonc`:

```jsonc
"migrations": [{ "tag": "v1", "new_sqlite_classes": ["ExpenseAgent"] }]
```

Redeploy after migration changes.

## Next: Submit to Hackathon

Your submission URLs:

- **Frontend:** https://paypal-ai-expense-agent.pages.dev
- **Worker:** https://paypal-ai-expense-agent-worker.your-subdomain.workers.dev
- **GitHub:** https://github.com/[you]/paypal-ai-expense-agent
- **Demo Video:** https://youtube.com/watch?v=[id]

See [SUBMISSION.md](./SUBMISSION.md) for complete checklist.

## Scaling Beyond Hackathon

After launch, upgrade to paid plans for:

- **Higher request limits** (free: 100k req/day)
- **Durable Objects** (persistent state)
- **Workers Tail** (production debugging)
- **Email Routing** (for user notifications)
- **R2** (cheap object storage for backups)

---

**Built for PayPal AI Hackathon 2026**

For more info: [Cloudflare Docs](https://developers.cloudflare.com/)

# Complete Setup Guide

Everything you need to get the PayPal AI Expense Agent running and deployed to production.

## Prerequisites

Before you start, make sure you have:

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)
- **Cloudflare Account** — [Free signup](https://dash.cloudflare.com/sign-up)
- **PayPal Developer Account** — [Sandbox setup](https://developer.paypal.com/)
- **OpenAI API Key** — [Create one](https://platform.openai.com/api-keys)

## Phase 1: Local Development

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/paypal-ai-expense-agent.git
cd paypal-ai-expense-agent
```

### Step 2: Initial Setup

Run the setup script to install dependencies and create configuration:

```bash
npm run setup
```

This will:
- ✓ Install all dependencies
- ✓ Install worker dependencies
- ✓ Create `.env.local` from `.env.example`
- ✓ Check for required tools

### Step 3: Configure Environment Variables

Edit `.env.local` and add your credentials:

```bash
# PayPal Sandbox
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_SECRET
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_KEY

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Can't get credentials yet?** Leave them blank and the app will use mock data.

### Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see:
- Dashboard with summary cards
- Transactions table
- Insights page

**✓ You're running locally!**

## Phase 2: Deploy Worker Backend

### Step 1: Install Wrangler CLI

```bash
npm install -g @cloudflare/wrangler
```

Verify:
```bash
wrangler --version
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authorize Wrangler. Grant permission and return to terminal.

### Step 3: Create KV Namespace

The worker uses KV for caching. Create it:

```bash
cd worker

wrangler kv:namespace create "expense-agent-cache"
wrangler kv:namespace create "expense-agent-cache" --preview
```

You'll get namespace IDs. Update `worker/wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CACHE",
    "id": "YOUR_ID_HERE",
    "preview_id": "YOUR_PREVIEW_ID_HERE"
  }
]
```

### Step 4: Set Worker Secrets

Store your PayPal and OpenAI credentials securely:

```bash
wrangler secret put PAYPAL_CLIENT_ID
# Paste your PayPal Client ID and press Enter

wrangler secret put PAYPAL_CLIENT_SECRET
# Paste your PayPal Secret and press Enter

wrangler secret put OPENAI_API_KEY
# Paste your OpenAI API Key and press Enter
```

Verify secrets are set:
```bash
wrangler secret list
```

### Step 5: Deploy Worker

```bash
wrangler deploy
```

You'll see:
```
✓ Published to https://paypal-ai-expense-agent-worker.YOUR_SUBDOMAIN.workers.dev
```

**Save this URL** — you'll need it for the frontend config.

### Step 6: Test Worker

```bash
curl -X POST https://paypal-ai-expense-agent-worker.YOUR_SUBDOMAIN.workers.dev/agents/expense-agent/test-user \
  -H "Content-Type: application/json" \
  -d '{"method":"getSummary","params":{"period":"30d"}}'
```

Should return:
```json
{"totalSpent":0,"totalIncome":0,"netBalance":0,"transactionCount":0,"period":"30d"}
```

**✓ Worker is running!**

## Phase 3: Deploy Pages Frontend

### Step 1: Push Code to GitHub

Make sure your code is committed and pushed:

```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

### Step 2: Connect to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. **Pages** → **Create a project** → **Connect to Git**
3. Authorize GitHub and select your repo
4. Configure build settings:
   - **Production branch:** `main`
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`

### Step 3: Add Environment Variables

Go to **Settings** → **Environment variables** → **Production**

Add:
```
NEXT_PUBLIC_APP_URL=https://paypal-ai-expense-agent.pages.dev
NEXT_PUBLIC_WORKER_URL=https://paypal-ai-expense-agent-worker.YOUR_SUBDOMAIN.workers.dev
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_SECRET
OPENAI_API_KEY=YOUR_OPENAI_KEY
```

Also add to **Preview** environment for staging.

### Step 4: Deploy

Click **Save and Deploy**

Cloudflare will:
- Clone your repo
- Install dependencies
- Build the app
- Deploy to CDN

Takes ~2-3 minutes.

### Step 5: Verify Deployment

Once complete, visit your deployed app:
```
https://paypal-ai-expense-agent.pages.dev
```

**✓ Your app is live!**

## Phase 4: Setup Custom Domain (Optional)

### Add Custom Domain to Cloudflare

1. Go to **Pages** → Select your project → **Custom domains**
2. Add your domain (e.g., `expense-agent.mysite.com`)
3. Cloudflare auto-provisions SSL

Your app is now at: `https://expense-agent.mysite.com`

## Monitoring & Troubleshooting

### View Logs

**Worker logs:**
```bash
wrangler tail
```

**Pages logs:**
- Go to [dash.cloudflare.com](https://dash.cloudflare.com/) → **Pages** → Select project → **Deployments**

### Common Issues

**"Worker deployment failed"**
- Check secrets: `wrangler secret list`
- Check KV namespace ID in `wrangler.jsonc`

**"Pages build failed"**
- Check environment variables are set
- Verify build command: `npm run build`

**"CORS errors"**
- Ensure `NEXT_PUBLIC_WORKER_URL` is set correctly
- Check middleware in `functions/_middleware.ts`

## Continuous Deployment

After initial setup, deployment is automatic:

1. Make code changes
2. Commit and push: `git push origin main`
3. Cloudflare auto-deploys

No manual steps needed!

## Production Checklist

Before submitting to hackathon:

- [ ] App runs locally with `npm run dev`
- [ ] All three pages work (Dashboard, Transactions, Insights)
- [ ] Worker deployed and responding
- [ ] Pages deployment successful
- [ ] Custom domain configured (optional)
- [ ] Environment variables set in Pages
- [ ] Demo video created
- [ ] GitHub repo is public
- [ ] README updated with deployment URLs

## Support

- **Setup issues?** → See [QUICKSTART.md](./QUICKSTART.md)
- **Deployment?** → See [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)
- **Scripts?** → See [scripts/README.md](./scripts/README.md)
- **Full docs?** → See [README.md](./README.md)

## Next Steps

1. **Development:** `npm run dev`
2. **Build:** `npm run build:full`
3. **Deploy:** `npm run deploy`
4. **Monitor:** `wrangler tail`

**Ready to ship? See [SUBMISSION.md](./SUBMISSION.md) for hackathon submission checklist.**

---

Built for PayPal AI Hackathon 2026

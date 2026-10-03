# QuickStart Guide

Get the PayPal AI Expense Agent running in **5 minutes**.

## Step 1: Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **PayPal Sandbox Account** (free, [get one](https://developer.paypal.com/))
- **OpenAI API Key** ([get one](https://platform.openai.com/api-keys))
- **Git** (optional, for cloning)

## Step 2: Clone or Download

```bash
git clone https://github.com/YOUR_USERNAME/paypal-ai-expense-agent.git
cd paypal-ai-expense-agent
```

Or download as ZIP and extract.

## Step 3: Install Dependencies

```bash
npm install
```

Takes ~30 seconds.

## Step 4: Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Get these from https://developer.paypal.com/dashboard/
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AYYQi7...  # Your PayPal Client ID
PAYPAL_CLIENT_SECRET=EEGj5...            # Your PayPal Secret

# Get this from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...               # Your OpenAI API Key
```

**Don't have credentials yet?**
- PayPal: [Create free sandbox account](https://developer.paypal.com/dashboard/accounts)
- OpenAI: [Create free account with $5 trial credit](https://platform.openai.com/signup)

**Want to skip credentials?** The app works in **mock mode**:
- Leave `PAYPAL_CLIENT_SECRET` and `OPENAI_API_KEY` blank
- App will use demo data instead

## Step 5: Start the Dev Server

```bash
npm run dev
```

You'll see:
```
> next dev

 ▲ Next.js 14.2.15
 - Local:        http://localhost:3000
 - Environments: .env.local

 ✓ Ready in 1.2s
```

## Step 6: Open in Browser

Go to: **http://localhost:3000**

You should see the **Expense Dashboard** with:
- Summary cards (spending, income, balance)
- Monthly spending chart
- Category breakdown pie chart
- Recent anomalies

### Explore the App

- **Dashboard** (`/`) — Spending overview and trends
- **Transactions** (`/transactions`) — Full transaction history with search/filter
- **Insights** (`/insights`) — AI-generated financial recommendations

## Troubleshooting

### "NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set"

```bash
# Make sure .env.local exists and has the variable:
cat .env.local | grep NEXT_PUBLIC_PAYPAL_CLIENT_ID

# If missing, add it and restart the dev server:
npm run dev
```

### App shows "No transactions"

1. Check your `.env.local` has valid PayPal credentials
2. Go to **Dashboard** — it will auto-sync
3. Check browser console for errors (F12)

### Slow performance

- Clear browser cache (Ctrl+Shift+Delete)
- Kill dev server (Ctrl+C) and restart (`npm run dev`)

### "Module not found"

```bash
# Reinstall dependencies:
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Next Steps

### 1. Deploy to Production

Want to share a live URL? Deploy to **Render** (sponsor) in 5 minutes:

```bash
git push  # Push to GitHub
# Go to render.com → New Web Service → Select your repo
# Done! Your app is live at https://paypal-ai-expense-agent.onrender.com
```

→ See [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) for detailed steps

### 2. Set Up Cloudflare Worker Backend (Optional)

For production-grade performance with edge caching:

```bash
cd worker
npm install
npm run deploy
```

→ See [WORKER_INTEGRATION.md](./WORKER_INTEGRATION.md) for details

### 3. Prepare for Hackathon Submission

Before submitting on October 31:

1. Read [SUBMISSION.md](./SUBMISSION.md) — complete checklist
2. Record a <3 minute demo video
3. Push code to public GitHub repo
4. Deploy to Render or test locally

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production build locally
npm start

# Check for TypeScript errors
npm run type-check

# Lint code
npm run lint

# Clean up
rm -rf .next node_modules
npm install
```

## File Structure

```
paypal-ai-expense-agent/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (home)
│   ├── transactions/page.tsx     # Transactions table
│   ├── insights/page.tsx         # AI insights
│   ├── api/
│   │   ├── paypal/               # PayPal API routes
│   │   └── ai/                   # AI API routes
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── Sidebar.tsx
│   ├── StatCard.tsx
│   └── ...
├── lib/                          # Utilities
│   ├── types.ts                  # TypeScript types
│   ├── paypal.ts                 # PayPal API helpers
│   ├── openai.ts                 # OpenAI helpers
│   └── mockData.ts               # Demo data
├── worker/                       # Cloudflare Worker (optional)
│   ├── src/index.ts
│   └── wrangler.jsonc
├── .env.example                  # Environment variables
└── README.md                      # Full documentation
```

## Architecture Diagram

```
┌─────────────────────────────┐
│   Browser (localhost:3000)  │
│                             │
│  Dashboard | Transactions   │
│  Insights                   │
└──────────────┬──────────────┘
               │ fetch("/api/")
               ▼
┌─────────────────────────────┐
│   Next.js API Routes        │
│                             │
│  /api/paypal/transactions   │
│  /api/ai/categorize         │
│  /api/ai/insights           │
└──────────────┬──────────────┘
        ┌──────┴──────┐
        ▼             ▼
    PayPal API   OpenAI API
  (Sandbox)    (GPT-4o)
```

## Tips for Success

1. **Use mock mode during development** — Skip API keys, test the UI first
2. **Test on your phone** — The dashboard is responsive
3. **Keep `.env.local` secret** — Never commit it to git
4. **Read error messages carefully** — They often hint at solutions
5. **Check browser console** — F12 opens DevTools with error details

## Need Help?

- **Setup issues?** → See troubleshooting above
- **Deployment?** → See [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)
- **Worker backend?** → See [WORKER_INTEGRATION.md](./WORKER_INTEGRATION.md)
- **Hackathon submission?** → See [SUBMISSION.md](./SUBMISSION.md)
- **Full docs?** → See [README.md](./README.md)

---

**That's it!** You're ready to build. 🚀

**Next:** Go to http://localhost:3000 and start exploring your expenses.

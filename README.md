# 🤖 PayPal AI Expense Agent

> An intelligent expense management system powered by AI that automatically analyzes, categorizes, and provides insights on your PayPal transactions.

**Built for the [PayPal AI Hackathon](https://paypal-ai.devpost.com/) 2026**

---

## 🎯 Overview

PayPal AI Expense Agent connects to your PayPal account, fetches your transaction history, and applies an AI agent to automatically categorize expenses, detect anomalies, and generate actionable financial insights — all in a clean, interactive web dashboard.

## ✨ Features

- 🔄 **Real-time PayPal Sync** — Fetches transactions via PayPal REST API (sandbox)
- 🤖 **AI Categorization** — GPT-4 automatically categorizes every transaction
- 📊 **Interactive Dashboard** — Spending summaries, trend charts, and breakdowns
- 📋 **AG Grid Transactions Table** — Sortable, filterable, exportable transaction log
- 🔍 **Anomaly Detection** — AI flags unusual or suspicious spending patterns
- 💡 **Smart Insights** — Natural language financial recommendations
- 📈 **Spending Trends** — Monthly and category-level charts via Recharts
- 🎯 **Budget Alerts** — Visual warnings when categories exceed thresholds

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data Grid | AG Grid (Sponsor) |
| Charts | Recharts |
| PayPal | PayPal REST API + JS SDK |
| AI | OpenAI GPT-4o |
| Deployment | Render (Sponsor) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [PayPal Developer Account](https://developer.paypal.com/) (free)
- OpenAI API Key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/paypal-ai-expense-agent.git
cd paypal-ai-expense-agent

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# PayPal Sandbox (from https://developer.paypal.com/dashboard/)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# OpenAI
OPENAI_API_KEY=your_openai_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 Architecture

```
app/
├── page.tsx                    # Dashboard (home)
├── transactions/page.tsx       # AG Grid transactions table
├── insights/page.tsx           # AI insights & anomalies
├── layout.tsx                  # Root layout with sidebar nav
├── globals.css                 # Global styles
└── api/
    ├── paypal/
    │   ├── transactions/       # Fetch PayPal transactions
    │   └── token/              # Get PayPal access token
    └── ai/
        ├── categorize/         # AI categorization agent
        └── insights/           # AI insights generator
components/
├── Sidebar.tsx
├── StatCard.tsx
├── SpendingChart.tsx
├── CategoryBreakdown.tsx
└── AnomalyAlert.tsx
lib/
├── paypal.ts                   # PayPal API helpers
├── openai.ts                   # OpenAI client
├── mockData.ts                 # Sandbox demo data
└── types.ts                    # Shared TypeScript types
```

## 🎥 Demo

[YouTube Demo Link - Under 3 minutes]

## 🏆 Hackathon Prize Categories

- ✅ Best Use of PayPal + AI
- ✅ Best Use of Agentic Commerce
- ✅ Best Use of AG Grid
- ✅ Best Use of Render
- ✅ Most Impactful

## 📝 License

[MIT](LICENSE)

---

> **Note**: This project uses PayPal's sandbox environment. No real money is processed during testing.

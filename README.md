# PayPal AI Expense Agent

An intelligent expense management system that connects to your PayPal account, automatically categorizes transactions using GPT-4o, detects anomalies, and surfaces actionable financial insights through an interactive web dashboard.

Built for the [PayPal AI Hackathon 2026](https://paypal-ai.devpost.com/).

---

## Overview

The agent fetches your PayPal transaction history via the REST API, runs each transaction through an AI categorization pipeline, flags unusual spending patterns, and presents everything in a sortable, filterable dashboard — no manual tagging required.

## Features

- Real-time PayPal sync via PayPal REST API (sandbox)
- AI-powered transaction categorization with GPT-4o
- Interactive dashboard with spending summaries and trend charts
- Sortable, filterable, exportable transaction table (AG Grid)
- Anomaly detection with natural language explanations
- Smart financial insights and recommendations
- Monthly and category-level spending trends (Recharts)
- Budget threshold alerts

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Framework  | Next.js 14 (App Router)     |
| Language   | TypeScript                  |
| Styling    | Tailwind CSS                |
| Data Grid  | AG Grid                     |
| Charts     | Recharts                    |
| PayPal     | PayPal REST API + JS SDK    |
| AI         | OpenAI GPT-4o               |
| Deployment | Render                      |

## Getting Started

### Prerequisites

- Node.js 18+
- [PayPal Developer Account](https://developer.paypal.com/) (free sandbox)
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone https://github.com/kayodedcreative/paypal-ai-expense-agent.git
cd paypal-ai-expense-agent

# Install dependencies
npm install

# Copy the environment template and fill in your credentials
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.example` to `.env.local` and set the following values:

```env
# PayPal Sandbox — https://developer.paypal.com/dashboard/
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> This project uses PayPal's sandbox environment. No real money is processed during development or testing.

## Project Structure

```
app/
  page.tsx                    # Dashboard home
  transactions/page.tsx       # AG Grid transactions table
  insights/page.tsx           # AI insights and anomaly view
  layout.tsx                  # Root layout with sidebar navigation
  globals.css
  api/
    paypal/
      transactions/           # Fetch PayPal transactions
      token/                  # Obtain PayPal access token
    ai/
      categorize/             # AI categorization endpoint
      insights/               # AI insights endpoint
components/
  Sidebar.tsx
  StatCard.tsx
  SpendingChart.tsx
  CategoryBreakdown.tsx
  AnomalyAlert.tsx
lib/
  paypal.ts                   # PayPal API helpers
  openai.ts                   # OpenAI client
  mockData.ts                 # Sandbox demo data
  types.ts                    # Shared TypeScript types
worker/                       # Cloudflare Worker (optional edge layer)
```

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # TypeScript check without emit
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

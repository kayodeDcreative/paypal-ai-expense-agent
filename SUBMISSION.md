# PayPal AI Hackathon Submission Checklist

Complete this checklist before submitting your project on October 31, 2026.

## ✅ Project Requirements

- [ ] **Meaningful PayPal Integration**
  - [ ] Uses PayPal REST API (Sandbox)
  - [ ] Fetches real transactions via `/v1/reporting/transactions`
  - [ ] Categorizes transactions with AI
  - [ ] Displays transaction history in UI

- [ ] **Meaningful AI Integration**
  - [ ] Uses OpenAI GPT-4o for transaction categorization
  - [ ] Generates financial insights (anomalies, trends, suggestions)
  - [ ] Provides natural language recommendations

- [ ] **Working Prototype / Proof of Concept**
  - [ ] App runs locally with `npm run dev`
  - [ ] Can connect to PayPal Sandbox (with credentials)
  - [ ] Dashboard displays mock or live transaction data
  - [ ] All three pages work: Dashboard, Transactions, Insights

- [ ] **Documentation**
  - [ ] `README.md` is clear and complete
  - [ ] Setup instructions are tested and work
  - [ ] Environment variables are documented in `.env.example`
  - [ ] Architecture is explained

- [ ] **Compliance**
  - [ ] Code is your own or properly attributed
  - [ ] No hardcoded secrets in repo
  - [ ] Proper error handling (no bare `throw` statements)
  - [ ] Uses HTTPS for external APIs

## ✅ Submission Materials

### 1. Code Repository

- [ ] Public GitHub repo created
- [ ] All source code committed
- [ ] `.gitignore` excludes `.env.local`, `node_modules`, `dist`
- [ ] Repository is **public** and **open source**
- [ ] License file visible (MIT or Apache 2.0 recommended)

**Example:**
```bash
git remote add origin https://github.com/yourname/paypal-ai-expense-agent.git
git push -u origin main
```

### 2. Setup & Run Instructions

- [ ] `.env.example` has all required variables documented
- [ ] `README.md` includes step-by-step setup:
  1. Prerequisites (Node.js 18+, PayPal account, OpenAI API key)
  2. Clone repo
  3. Install: `npm install`
  4. Configure: `cp .env.example .env.local && edit .env.local`
  5. Run: `npm run dev`
  6. Open: `http://localhost:3000`

- [ ] Instructions are tested on a fresh machine

### 3. Functional Demo

Choose ONE of:

**Option A: Hosted Demo URL**
- [ ] App deployed to Render, Vercel, or Cloudflare
- [ ] Live URL works and shows all three pages
- [ ] Demo uses mock data (no credentials needed for judges to test)
- [ ] Submit URL on form

**Option B: Local Setup Instructions**
- [ ] Clear, complete `README.md` with exact commands
- [ ] Includes troubleshooting section
- [ ] Works on Windows, macOS, Linux with Node.js 18+
- [ ] Judges can build and run it themselves

**For judges to test locally:**
```bash
git clone https://github.com/yourname/paypal-ai-expense-agent.git
cd paypal-ai-expense-agent
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Demo Video (< 3 minutes)

- [ ] Video uploaded to YouTube (publicly visible)
- [ ] Shows the app actually running on your device
- [ ] Demo covers:
  - [ ] Dashboard with transaction summary
  - [ ] Transactions table with filtering
  - [ ] Insights page with AI recommendations
  - [ ] Anomaly detection in action
  - [ ] (Optional) Workers backend fetching live PayPal data

- [ ] Video quality ≥ 720p
- [ ] No background noise or distracting audio
- [ ] No third-party copyrighted music
- [ ] No third-party trademarks without permission

**Video script outline (1.5–2 minutes):**
```
0:00–0:15   Intro: "PayPal AI Expense Agent"
0:15–0:45   Dashboard overview: summary cards, spending trends
0:45–1:15   Transactions table: search, filter, categories
1:15–1:45   Insights page: AI recommendations, anomalies
1:45–2:00   Key features recap & call-to-action
```

### 5. Tools Documentation

List the tools used and explain integration:

- [ ] **PayPal REST API**
  - Endpoint: `/v1/reporting/transactions`
  - Used for: Fetching transaction history
  - Integration: `lib/paypal.ts` → `app/api/paypal/transactions/route.ts`

- [ ] **OpenAI GPT-4o**
  - Model: `gpt-4o-mini` (categorization), `gpt-4o` (insights)
  - Used for: Transaction categorization, anomaly detection, insights
  - Integration: `lib/openai.ts` → `app/api/ai/categorize/route.ts`

- [ ] **AG Grid** (Sponsor)
  - Component: `AgGridReact`
  - Used for: Sortable, filterable transaction table
  - Feature: CSV export, quick search, multi-column sort
  - Integration: `app/transactions/page.tsx`

- [ ] **Render** (Sponsor, Optional)
  - Used for: Hosting the Next.js frontend
  - Command: `npm run build && npm start`
  - Integration: `render.yaml` (if deployed)

- [ ] **Cloudflare Workers** (Optional)
  - Durable Object: ExpenseAgent
  - Used for: Edge-cached API, persistent state
  - Integration: `worker/src/index.ts` → Callable methods

### 6. GitHub Repository Checklist

- [ ] Repository is public
- [ ] Has descriptive title: "PayPal AI Expense Agent"
- [ ] Has clear description in About section
- [ ] License is visible (check "Add a license" in repo settings)
- [ ] README has:
  - [ ] Hero image or screenshot
  - [ ] Feature list
  - [ ] Tech stack table
  - [ ] Setup instructions
  - [ ] Demo section with YouTube link
  - [ ] Architecture diagram or file structure
  - [ ] License badge
  - [ ] "Built for PayPal AI Hackathon 2026" badge

**Example README header:**
```markdown
# 🤖 PayPal AI Expense Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built for PayPal AI Hackathon 2026](https://img.shields.io/badge/Built%20for-PayPal%20AI%20Hackathon%202026-blue)](https://paypal-ai.devpost.com/)

> Intelligent expense management powered by AI + PayPal. Automatically categorize, analyze, and get insights on your spending.

**[Demo Video →](#demo) | [Live Preview →](https://demo-url.render.com) | [Docs →](#setup)**
```

## ✅ Submission Form Fields

When submitting on Devpost, provide:

1. **Project Title**
   ```
   PayPal AI Expense Agent
   ```

2. **Project Description** (2–3 sentences)
   ```
   An intelligent expense dashboard that connects to your PayPal account, 
   uses AI to automatically categorize transactions, detect anomalies, and 
   provide personalized financial insights. Built with Next.js, OpenAI, and 
   Cloudflare Workers for production-grade performance.
   ```

3. **How it works** (paragraph)
   ```
   1. Users authenticate and grant read access to PayPal transactions
   2. The app fetches transaction history via PayPal REST API
   3. GPT-4o categorizes each transaction and detects anomalies
   4. Dashboard displays spending trends, category breakdown, and AI-generated insights
   5. Transactions table allows search, filter, and export
   6. Edge-cached backend (Cloudflare Workers) ensures sub-100ms response times
   ```

4. **Inspiration** (paragraph)
   ```
   Managing expenses is a pain point for millions of users. While PayPal 
   makes it easy to spend and send money, understanding *where* that money 
   goes is left to manual spreadsheets. We built this to unlock intelligent 
   expense analytics at the edge, combining PayPal's transaction data with 
   AI to give users immediate, actionable financial insights.
   ```

5. **What we learned** (paragraph)
   ```
   - Integrating real-time transaction data with AI categorization at scale
   - Building fast, cached APIs on the edge (Cloudflare Workers + Durable Objects)
   - Designing UX for financial data (clarity, trust, actionability)
   - Handling sandbox-to-production transitions gracefully
   ```

6. **What's next** (paragraph)
   ```
   - Expand to multi-account support (multiple PayPal accounts, credit cards)
   - Add budget alerts and goal tracking
   - Implement spending forecasts using time-series ML
   - Mobile app (React Native)
   - Multi-currency support
   ```

7. **GitHub Repository Link**
   ```
   https://github.com/yourname/paypal-ai-expense-agent
   ```

8. **Live Demo URL** (if hosted)
   ```
   https://paypal-ai-expense-agent.render.com
   ```

9. **Demo Video Link**
   ```
   https://www.youtube.com/watch?v=XXXXX
   ```

10. **Team Members**
    - Your Name (Role: Full Stack Developer)

## ✅ Quality Checklist

- [ ] Code is clean and readable (proper spacing, comments where needed)
- [ ] No console errors or warnings in browser
- [ ] No console errors in server logs
- [ ] Responsive design works on mobile (375px) and desktop (1440px)
- [ ] All links and buttons work
- [ ] Loading states are visible (spinners, skeletons)
- [ ] Error states are handled gracefully
- [ ] API errors show user-friendly messages
- [ ] No hardcoded test data in production build

## ✅ Pre-Submission Checklist (1 week before)

- [ ] Test entire flow end-to-end (PayPal + OpenAI + UI)
- [ ] Clear browser cache and test from scratch
- [ ] Test on mobile device
- [ ] Verify all environment variables are documented
- [ ] Verify GitHub repo is public and has all files
- [ ] Demo video is uploaded to YouTube (public, no copyright issues)
- [ ] Submission form is filled out completely
- [ ] Proofread all text for typos

## ✅ Day-of Submission

- [ ] Double-check all links work (repo, demo, video)
- [ ] Verify GitHub repo is still public
- [ ] Verify video is still publicly visible on YouTube
- [ ] Submit on Devpost before deadline (October 31, 11:59 PM PT)
- [ ] Screenshot of submission page for your records

## Prize Categories to Target

Based on this project, target these prize categories:

- [ ] **Best Use of PayPal + AI** ($5,000)
- [ ] **Best Use of Agentic Commerce** ($5,000)
- [ ] **Best Use of AG Grid** ($1,000–$5,000)
- [ ] **Most Impactful** ($5,000)
- [ ] **Best Demo Delivery** ($5,000) — *strong potential*
- [ ] **Overall Grand Prize** ($12,000) — *go for it!*

---

**Submission deadline: October 31, 2026, 11:59 PM PT**

**Ready to submit?** Run through this checklist one more time, then head to [paypal-ai.devpost.com](https://paypal-ai.devpost.com/).

Good luck! 🚀

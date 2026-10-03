# Deploying to Render

Deploy your PayPal AI Expense Agent to [Render](https://render.com/) in minutes. Render is a Hackathon sponsor offering free tier deployment credits.

## Quick Start

### 1. Create Render Account

- Go to [render.com](https://render.com)
- Sign up with GitHub (recommended for automatic deployments)

### 2. Create a New Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Fill in the form:

| Field | Value |
|-------|-------|
| Name | `paypal-ai-expense-agent` |
| Environment | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | `Free` (0 hours/month credit) |

### 3. Add Environment Variables

Click **Environment** and add:

```
NODE_ENV=production
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=https://paypal-ai-expense-agent.onrender.com
```

### 4. Deploy

Click **Create Web Service**. Render will:
- Clone your repo
- Install dependencies
- Build the Next.js app
- Start the server

Deployment takes ~2–3 minutes. Once live, you'll see a URL:
```
https://paypal-ai-expense-agent.onrender.com
```

## Automatic Deployments

With GitHub integration, your app auto-deploys on every push to `main`:

1. Push to GitHub: `git push origin main`
2. Render detects the push
3. Builds and deploys automatically
4. Takes ~2 minutes

To disable auto-deploys:
- Go to Service Settings → **Auto-Deploy** → Turn Off

## Custom Domain (Optional)

To use your own domain (e.g., `expense-agent.mysite.com`):

1. Go to Service Settings → **Custom Domain**
2. Add your domain
3. Update DNS records (Render will provide instructions)
4. Wait for SSL certificate (usually immediate)

## Monitoring & Logs

### View Logs

```bash
# Option A: Render Dashboard
# Service → Logs tab → Stream in real-time

# Option B: Render CLI
npm install -g render-cli
render logs --service paypal-ai-expense-agent
```

### Monitor Performance

- Render Dashboard shows CPU, memory, bandwidth
- Set up alerts for error rates

## Troubleshooting

### "Build failed"

Check logs for common issues:

1. **Missing dependencies:**
   ```
   npm ERR! code E404
   npm ERR! 404 Not Found
   ```
   → Ensure `package.json` has all dependencies

2. **Environment variables:**
   ```
   Error: NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set
   ```
   → Add variables in Render dashboard

3. **Port binding:**
   ```
   Error: listen EADDRINUSE :::3000
   ```
   → Render assigns a dynamic port; don't hardcode it

   **Fix:** Update `next.config.js` or use:
   ```bash
   # Start command:
   npm start -- -p ${PORT:-3000}
   ```

### Service keeps crashing

1. Check logs: Click **Logs** tab
2. Look for error traces
3. Common causes:
   - Missing `PAYPAL_CLIENT_SECRET`
   - Unreachable OpenAI API
   - Database connection issues

### Memory issues

Render Free tier has 512MB memory. If you exceed it:
- Upgrade to Pro ($7/month)
- Or optimize code (remove unused dependencies, cache aggressively)

## Performance Tips

1. **Enable Render's cache layer:**
   - Go to Service Settings → **Advanced**
   - Enable **Caching** (caches static assets)

2. **Optimize images:**
   - Use Next.js Image component (automatic optimization)
   - Consider external image CDN (Cloudinary, Imgix)

3. **Database scaling:**
   - For larger deployments, upgrade to Render PostgreSQL

4. **Edge caching:**
   - Deploy Cloudflare Worker in front of Render
   - Cache `/api/paypal/transactions` responses

## Cost Analysis

| Item | Free Tier | Pro Tier |
|------|-----------|----------|
| Compute | $0 (limited) | $7/month |
| Bandwidth | 1 GB/month | $0.10/GB excess |
| Uptime | Paused after 15min inactivity | Always-on |
| Concurrency | Single-threaded | Multi-threaded |

For the hackathon, **Free Tier is sufficient**. Upgrade to Pro if you need:
- Always-on uptime (demo videos might pause the app)
- Higher performance
- More concurrent users

## Production Checklist

Before submitting your hackathon project:

- [ ] App deployed to Render
- [ ] All environment variables set
- [ ] Logs show no errors
- [ ] Dashboard loads in <2s
- [ ] Transactions table loads and filters work
- [ ] Mock mode works (no credentials needed for judges)
- [ ] HTTPS is enabled (automatic with `.onrender.com`)
- [ ] Demo video shows the live URL

## Next: Add to Submission

When submitting to Devpost:

1. **Functional Demo URL:**
   ```
   https://paypal-ai-expense-agent.onrender.com
   ```

2. **In your `README.md`, add:**
   ```markdown
   ## 🚀 Live Demo

   View the live demo hosted on Render (sponsor):
   **https://paypal-ai-expense-agent.onrender.com**

   The demo uses mock PayPal data (no login required).
   ```

3. **In your demo video**, include the Render URL in the description

## Scaling to Production

If your project wins or gets accepted for further development:

1. **Upgrade to Pro** ($7/month) for always-on uptime
2. **Add database** (Render PostgreSQL) for multi-user state
3. **Deploy worker** (Cloudflare) for edge caching
4. **Enable authentication** (Auth0, Firebase) for real user data
5. **Monitor** (Sentry, DataDog) for production issues

---

**Built for the PayPal AI Hackathon 2026**

Questions? Check [Render Docs](https://render.com/docs) or [contact support](https://render.com/support).

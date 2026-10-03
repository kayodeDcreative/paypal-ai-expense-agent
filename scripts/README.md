# Scripts

Helper scripts for building, deploying, and managing the PayPal AI Expense Agent.

## Available Scripts

### `setup.js` — Initial Project Setup

Initializes the project with all dependencies and configuration.

```bash
npm run setup
# or
node scripts/setup.js
```

**What it does:**
- ✓ Installs root dependencies
- ✓ Installs worker dependencies
- ✓ Creates `.env.local` from `.env.example`
- ✓ Checks for Wrangler CLI
- ✓ Provides next steps

**Run this first after cloning the repo.**

### `dev.js` — Development Server

Starts the development server with helpful tips and environment validation.

```bash
npm run dev
# or
node scripts/dev.js
```

**What it does:**
- ✓ Validates `.env.local` exists
- ✓ Starts Next.js dev server on `localhost:3000`
- ✓ Shows helpful tips
- ✓ Works in mock mode without credentials

### `build.js` — Production Build

Builds the complete project (frontend + worker) for production.

```bash
npm run build:full
# or
node scripts/build.js
```

**What it does:**
- ✓ Builds Next.js frontend
- ✓ Runs TypeScript type checking
- ✓ Builds Cloudflare Worker (if exists)
- ✓ Generates worker types
- ✓ Verifies all builds succeed

**Run before deploying to production.**

### `deploy.js` — Deploy to Cloudflare

Deploys both backend (Worker) and frontend (Pages) to Cloudflare.

```bash
npm run deploy
# or
node scripts/deploy.js
```

**What it does:**
- ✓ Checks prerequisites (Wrangler, Git)
- ✓ Verifies no uncommitted changes
- ✓ Validates Worker secrets are set
- ✓ Deploys Worker to Cloudflare
- ✓ Pushes code to GitHub
- ✓ Triggers Pages auto-deployment

**Prerequisites:**
- Git repository initialized
- Wrangler CLI installed (`npm install -g @cloudflare/wrangler`)
- Cloudflare account with Pages + Workers
- Worker secrets configured (`wrangler secret put KEY`)

## Quick Start

```bash
# 1. Setup project
npm run setup

# 2. Start dev server
npm run dev
# Open http://localhost:3000

# 3. Build for production
npm run build:full

# 4. Deploy to Cloudflare
npm run deploy
```

## Troubleshooting

### "wrangler not found"

Install Wrangler globally:
```bash
npm install -g @cloudflare/wrangler
```

### "Cannot find .env.local"

Run setup to create it:
```bash
npm run setup
```

### "Build failed"

Check for TypeScript errors:
```bash
npm run type-check
```

### "Deployment failed: uncommitted changes"

Commit changes before deploying:
```bash
git add .
git commit -m "Your message"
git push origin main
npm run deploy
```

## Cross-Platform Support

All scripts work on:
- ✓ Windows (PowerShell, CMD)
- ✓ macOS (Bash)
- ✓ Linux (Bash)

Scripts use Node.js instead of bash for better compatibility.

## Development

To modify scripts, edit the `.js` files in this directory. Each script has:
- Colored output for readability
- Error handling
- Helpful messages
- Clear exit codes

## Contributing

When adding new scripts:
1. Use Node.js instead of bash
2. Add colored output helpers
3. Include clear error messages
4. Document in this README
5. Test on Windows, macOS, Linux

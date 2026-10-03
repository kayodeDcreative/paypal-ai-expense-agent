#!/usr/bin/env node

/**
 * Setup Script for PayPal AI Expense Agent
 * Initializes the project with all dependencies and configuration
 * Usage: node scripts/setup.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, "red");
  process.exit(1);
}

function success(message) {
  log(`✓ ${message}`, "green");
}

function info(message) {
  log(`ℹ ${message}`, "blue");
}

function run(command, options = {}) {
  try {
    const output = execSync(command, {
      stdio: options.silent ? "pipe" : "inherit",
      cwd: options.cwd || process.cwd(),
      ...options,
    });
    return output ? output.toString().trim() : "";
  } catch (err) {
    if (!options.throwOnError) {
      return null;
    }
    throw err;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("\n");
  log("🚀 Setting up PayPal AI Expense Agent", "blue");
  console.log("");

  // Check Node.js
  try {
    const nodeVersion = run("node --version", { silent: true });
    info(`Node.js version: ${nodeVersion}`);
  } catch {
    error("Node.js is not installed");
  }
  console.log("");

  // Install root dependencies
  info("📦 Installing root dependencies...");
  try {
    run("npm install");
    success("Dependencies installed");
  } catch (err) {
    error(`Failed to install dependencies: ${err.message}`);
  }
  console.log("");

  // Create .env.local if it doesn't exist
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    info("📝 Creating .env.local...");
    const envExample = path.join(process.cwd(), ".env.example");
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      success(".env.local created from .env.example");
      log("⚠ Edit .env.local and add your credentials", "yellow");
    }
  } else {
    info(".env.local already exists");
  }
  console.log("");

  // Setup worker dependencies
  const workerPath = path.join(process.cwd(), "worker");
  const workerPackagePath = path.join(workerPath, "package.json");

  if (fs.existsSync(workerPath) && fs.existsSync(workerPackagePath)) {
    info("🔧 Setting up Cloudflare Worker...");

    try {
      run("npm install", { cwd: workerPath });
      success("Worker dependencies installed");
    } catch (err) {
      log(`⚠ Worker setup skipped: ${err.message}`, "yellow");
    }

    // Check if wrangler is installed
    const wrangler = run("wrangler --version", {
      silent: true,
      throwOnError: false,
    });
    if (!wrangler) {
      log(
        "⚠ Wrangler CLI not installed. Install with: npm install -g @cloudflare/wrangler",
        "yellow"
      );
    } else {
      info(`Wrangler version: ${wrangler}`);
    }

    console.log("");
  }

  // Summary
  console.log("");
  log("✅ Setup complete!", "green");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Edit .env.local with your credentials:");
  console.log("     - NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  console.log("     - PAYPAL_CLIENT_SECRET");
  console.log("     - OPENAI_API_KEY");
  console.log("");
  console.log("  2. Start development server:");
  console.log("     npm run dev");
  console.log("");
  console.log("  3. For production deployment:");
  console.log("     node scripts/build.js");
  console.log("     node scripts/deploy.js");
  console.log("");
  console.log("Documentation:");
  console.log("  • QUICKSTART.md - Get started in 5 minutes");
  console.log("  • DEPLOY_CLOUDFLARE.md - Production deployment");
  console.log("  • README.md - Full documentation");
  console.log("");

  rl.close();
}

main().catch((err) => {
  error(`Setup failed: ${err.message}`);
});

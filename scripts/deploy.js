#!/usr/bin/env node

/**
 * Deploy Script for Cloudflare Workers + Pages
 * Deploys both backend (Worker) and frontend (Pages)
 * Usage: node scripts/deploy.js
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colors for terminal output
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

function warn(message) {
  log(`⚠ ${message}`, "yellow");
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

async function checkPrerequisites() {
  info("📋 Checking prerequisites...");

  // Check wrangler
  const wrangler = run("wrangler --version", { silent: true, throwOnError: false });
  if (!wrangler) {
    error(
      "Wrangler CLI is not installed. Install with: npm install -g @cloudflare/wrangler"
    );
  }
  info(`  Wrangler: ${wrangler}`);

  // Check git
  const git = run("git --version", { silent: true, throwOnError: false });
  if (!git) {
    error("Git is not installed");
  }
  info(`  Git: ${git}`);

  // Check git status
  const gitStatus = run("git status --porcelain", { silent: true });
  if (gitStatus) {
    error(
      "You have uncommitted changes. Commit them before deploying:\n  git add .\n  git commit -m 'Deploy changes'\n  git push origin main"
    );
  }

  const branch = run("git rev-parse --abbrev-ref HEAD", { silent: true });
  info(`  Git branch: ${branch}`);

  console.log("");
  return true;
}

async function deployWorker() {
  const workerPath = path.join(process.cwd(), "worker");
  const workerPackagePath = path.join(workerPath, "package.json");

  if (!fs.existsSync(workerPath) || !fs.existsSync(workerPackagePath)) {
    warn("Worker directory not found, skipping worker deployment...");
    console.log("");
    return null;
  }

  info("🔧 Deploying Cloudflare Worker...");

  // Check secrets
  info("  Checking secrets...");
  const secrets = run("wrangler secret list", {
    silent: true,
    cwd: workerPath,
    throwOnError: false,
  });

  const missingSecrets = [];
  if (!secrets || !secrets.includes("PAYPAL_CLIENT_ID")) {
    missingSecrets.push("PAYPAL_CLIENT_ID");
  }
  if (!secrets || !secrets.includes("PAYPAL_CLIENT_SECRET")) {
    missingSecrets.push("PAYPAL_CLIENT_SECRET");
  }

  if (missingSecrets.length > 0) {
    error(
      `Missing secrets: ${missingSecrets.join(", ")}\nSet them with: wrangler secret put SECRET_NAME`
    );
  }

  success("Secrets configured");

  // Deploy
  info("  Deploying...");
  try {
    run("wrangler deploy", {
      cwd: workerPath,
      throwOnError: true,
    });
    success("Worker deployed");
    console.log("");
    return true;
  } catch (err) {
    error(`Worker deployment failed: ${err.message}`);
  }
}

async function deployPages() {
  info("📱 Deploying Cloudflare Pages...");
  console.log("  Pages auto-deploys on push to main branch");
  console.log("  Pushing changes to GitHub...");

  try {
    run("git push origin main", { throwOnError: true });
    success("Code pushed to GitHub");
    console.log("  Pages will deploy automatically (2-3 minutes)");
    console.log("  Monitor at: https://dash.cloudflare.com/ → Pages");
    console.log("");
    return true;
  } catch (err) {
    error(`Git push failed: ${err.message}`);
  }
}

async function main() {
  console.log("\n");
  log("🚀 Deploying PayPal AI Expense Agent to Cloudflare...", "blue");
  console.log("");

  try {
    // Check prerequisites
    await checkPrerequisites();

    // Deploy worker
    await deployWorker();

    // Deploy pages
    await deployPages();

    // Summary
    log("✅ Deployment initiated!", "green");
    console.log("");
    console.log("Deployment checklist:");
    console.log("  1. Worker deployed to Cloudflare");
    console.log("  2. Code pushed to GitHub");
    console.log("  3. Cloudflare Pages will auto-deploy");
    console.log("");
    console.log("Next steps:");
    console.log("  • Monitor build: https://dash.cloudflare.com/ → Pages");
    console.log("  • Test frontend: https://paypal-ai-expense-agent.pages.dev");
    console.log("  • View logs: wrangler tail");
    console.log("");
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

main();

#!/usr/bin/env node

/**
 * Build Script for PayPal AI Expense Agent
 * Builds both frontend and worker for production
 * Usage: node scripts/build.js
 */

const { execSync } = require("child_process");
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

// Execute command and capture output
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

async function main() {
  console.log("\n");
  log("🔨 Building PayPal AI Expense Agent...", "blue");
  console.log("");

  // Check Node.js
  try {
    const nodeVersion = run("node --version", { silent: true });
    const npmVersion = run("npm --version", { silent: true });
    info(`Node version: ${nodeVersion}`);
    info(`npm version: ${npmVersion}`);
    console.log("");
  } catch {
    error("Node.js is not installed");
  }

  // Build frontend
  info("📦 Building Next.js frontend...");
  try {
    run("npm run build");
    success("Frontend build successful");
  } catch (err) {
    error("Frontend build failed");
  }
  console.log("");

  // Type check
  info("🔍 Running TypeScript check...");
  try {
    run("npm run type-check");
    success("Type check passed");
  } catch (err) {
    error("Type check failed");
  }
  console.log("");

  // Build worker
  const workerPath = path.join(process.cwd(), "worker");
  const workerPackagePath = path.join(workerPath, "package.json");

  if (fs.existsSync(workerPath) && fs.existsSync(workerPackagePath)) {
    info("🚀 Building Cloudflare Worker...");
    try {
      // Install worker dependencies if needed
      const workerNodeModules = path.join(workerPath, "node_modules");
      if (!fs.existsSync(workerNodeModules)) {
        info("  Installing worker dependencies...");
        run("npm install", { cwd: workerPath });
      }

      // Build worker
      run("npm run build", { cwd: workerPath, throwOnError: true });
      success("Worker build successful");
    } catch (err) {
      warn("Worker build skipped or failed (optional)");
      console.log(`  Error: ${err.message}`);
    }
    console.log("");
  }

  // Generate worker types
  const workerTypeScriptPath = path.join(workerPath, "tsconfig.json");
  if (fs.existsSync(workerTypeScriptPath)) {
    info("📝 Generating worker types...");
    try {
      run("npm run types", { cwd: workerPath, throwOnError: false });
      success("Worker types generated");
    } catch {
      warn("Worker types generation skipped");
    }
    console.log("");
  }

  // Summary
  log("✅ Build complete!", "green");
  console.log("");
  console.log("Next steps:");
  console.log("  Development: npm run dev");
  console.log("  Production:  npm start");
  console.log("  Deploy:      node scripts/deploy.js");
  console.log("");
}

main().catch((err) => {
  error(`Build failed: ${err.message}`);
});

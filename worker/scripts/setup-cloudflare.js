#!/usr/bin/env node

/**
 * Cloudflare Resource Setup Script
 * Creates D1 database, KV namespace, and configures Durable Objects
 * Usage: node scripts/setup-cloudflare.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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
  log("🚀 Setting up Cloudflare Resources", "blue");
  console.log("");

  // Check wrangler
  const wrangler = run("wrangler --version", { silent: true, throwOnError: false });
  if (!wrangler) {
    log("❌ Wrangler CLI not installed", "red");
    console.log("Install with: npm install -g @cloudflare/wrangler");
    process.exit(1);
  }
  log(`✓ Wrangler ${wrangler}`, "green");
  console.log("");

  // Check authentication
  log("📋 Checking Cloudflare authentication...", "blue");
  const whoami = run("wrangler whoami", { silent: true, throwOnError: false });
  if (!whoami || whoami.includes("not authenticated")) {
    log("❌ Not logged in to Cloudflare", "red");
    console.log("Run: wrangler login");
    process.exit(1);
  }
  log("✓ Authenticated", "green");
  console.log("");

  // Create D1 Database
  log("📦 Creating D1 Database...", "blue");
  try {
    const d1Output = run("wrangler d1 create paypal-expense-db", { silent: true });
    console.log(d1Output);
    
    // Extract database ID from output
    const dbIdMatch = d1Output.match(/database_id\s*=\s*"([^"]+)"/);
    if (dbIdMatch) {
      const databaseId = dbIdMatch[1];
      log(`✓ D1 Database created: ${databaseId}`, "green");
      
      // Update wrangler.jsonc
      const wranglerPath = path.join(process.cwd(), "wrangler.jsonc");
      let wranglerConfig = fs.readFileSync(wranglerPath, "utf8");
      wranglerConfig = wranglerConfig.replace(
        /"database_id":\s*"REPLACE_AFTER_CREATION"/,
        `"database_id": "${databaseId}"`
      );
      fs.writeFileSync(wranglerPath, wranglerConfig);
      log("✓ Updated wrangler.jsonc with database ID", "green");
    }
  } catch (err) {
    if (err.message.includes("already exists")) {
      log("⚠ D1 Database already exists", "yellow");
    } else {
      log(`❌ Failed to create D1 database: ${err.message}`, "red");
    }
  }
  console.log("");

  // Initialize D1 Schema
  log("🗄️  Initializing D1 Schema...", "blue");
  try {
    const schemaPath = path.join(process.cwd(), "schema.sql");
    if (fs.existsSync(schemaPath)) {
      run(`wrangler d1 execute paypal-expense-db --file=${schemaPath}`);
      log("✓ Schema initialized", "green");
    } else {
      log("⚠ schema.sql not found, skipping schema init", "yellow");
    }
  } catch (err) {
    log(`⚠ Schema initialization failed: ${err.message}`, "yellow");
  }
  console.log("");

  // Create KV Namespace (Production)
  log("💾 Creating KV Namespace (Production)...", "blue");
  try {
    const kvOutput = run('wrangler kv:namespace create "CACHE"', { silent: true });
    console.log(kvOutput);
    
    const kvIdMatch = kvOutput.match(/id\s*=\s*"([^"]+)"/);
    if (kvIdMatch) {
      const kvId = kvIdMatch[1];
      log(`✓ KV Namespace created: ${kvId}`, "green");
      
      // Update wrangler.jsonc
      const wranglerPath = path.join(process.cwd(), "wrangler.jsonc");
      let wranglerConfig = fs.readFileSync(wranglerPath, "utf8");
      wranglerConfig = wranglerConfig.replace(
        /"id":\s*"REPLACE_AFTER_CREATION"/,
        `"id": "${kvId}"`
      );
      fs.writeFileSync(wranglerPath, wranglerConfig);
      log("✓ Updated wrangler.jsonc with KV ID", "green");
    }
  } catch (err) {
    if (err.message.includes("already exists")) {
      log("⚠ KV Namespace already exists", "yellow");
    } else {
      log(`❌ Failed to create KV namespace: ${err.message}`, "red");
    }
  }
  console.log("");

  // Create KV Namespace (Preview)
  log("💾 Creating KV Namespace (Preview)...", "blue");
  try {
    const kvPreviewOutput = run('wrangler kv:namespace create "CACHE" --preview', {
      silent: true,
    });
    console.log(kvPreviewOutput);
    
    const kvPreviewIdMatch = kvPreviewOutput.match(/id\s*=\s*"([^"]+)"/);
    if (kvPreviewIdMatch) {
      const kvPreviewId = kvPreviewIdMatch[1];
      log(`✓ KV Preview Namespace created: ${kvPreviewId}`, "green");
      
      // Update wrangler.jsonc
      const wranglerPath = path.join(process.cwd(), "wrangler.jsonc");
      let wranglerConfig = fs.readFileSync(wranglerPath, "utf8");
      wranglerConfig = wranglerConfig.replace(
        /"preview_id":\s*"REPLACE_AFTER_CREATION_PREVIEW"/,
        `"preview_id": "${kvPreviewId}"`
      );
      fs.writeFileSync(wranglerPath, wranglerConfig);
      log("✓ Updated wrangler.jsonc with KV Preview ID", "green");
    }
  } catch (err) {
    if (err.message.includes("already exists")) {
      log("⚠ KV Preview Namespace already exists", "yellow");
    } else {
      log(`❌ Failed to create KV preview namespace: ${err.message}`, "red");
    }
  }
  console.log("");

  // Summary
  log("✅ Cloudflare resources setup complete!", "green");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Set secrets:");
  console.log("     wrangler secret put PAYPAL_CLIENT_ID");
  console.log("     wrangler secret put PAYPAL_CLIENT_SECRET");
  console.log("     wrangler secret put OPENAI_API_KEY");
  console.log("");
  console.log("  2. Deploy worker:");
  console.log("     wrangler deploy");
  console.log("");
  console.log("  3. Test deployment:");
  console.log("     curl https://paypal-ai-expense-agent-worker.YOUR_SUBDOMAIN.workers.dev/health");
  console.log("");
}

main().catch((err) => {
  log(`❌ Setup failed: ${err.message}`, "red");
  process.exit(1);
});

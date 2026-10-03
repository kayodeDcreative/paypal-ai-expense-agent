#!/usr/bin/env node

/**
 * Development Server Script
 * Starts the development server with helpful tips
 * Usage: node scripts/dev.js
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  const envPath = path.join(process.cwd(), ".env.local");

  console.log("\n");
  log("🚀 Starting development server...", "blue");
  console.log("");

  // Check if .env.local exists
  if (!fs.existsSync(envPath)) {
    log("⚠ .env.local not found. Creating from .env.example...", "yellow");
    const envExample = path.join(process.cwd(), ".env.example");
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      log("✓ .env.local created. Edit it with your credentials.", "green");
    }
  }

  // Start dev server
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const proc = spawn(npm, ["run", "dev"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  // Print tips after a short delay
  setTimeout(() => {
    console.log("");
    log("💡 Tips:", "blue");
    console.log("  • Open http://localhost:3000");
    console.log("  • App works in mock mode without credentials");
    console.log("  • Add PayPal & OpenAI keys to .env.local for live data");
    console.log("  • Press Ctrl+C to stop the server");
    console.log("");
  }, 2000);

  proc.on("exit", (code) => {
    process.exit(code);
  });
}

main();

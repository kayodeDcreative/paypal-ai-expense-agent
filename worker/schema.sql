-- PayPal AI Expense Agent - D1 Database Schema
-- Run with: wrangler d1 execute paypal-expense-db --file=schema.sql

-- Users table (for authentication and user management)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  paypal_account_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Transactions table (PayPal transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT,
  type TEXT, -- PAYMENT, REFUND, TRANSFER, WITHDRAWAL
  counterparty TEXT,
  counterparty_email TEXT,
  invoice_id TEXT,
  category TEXT, -- AI-assigned category
  confidence REAL, -- AI confidence score (0.0-1.0)
  is_anomaly BOOLEAN DEFAULT 0,
  anomaly_reason TEXT,
  tags TEXT, -- Comma-separated tags
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_anomaly ON transactions(is_anomaly) WHERE is_anomaly = 1;

-- AI Insights table (generated insights per user)
CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT, -- info, warning, critical, positive
  category TEXT,
  actionable BOOLEAN DEFAULT 0,
  suggestion TEXT,
  related_transaction_ids TEXT, -- JSON array as text
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT, -- Insights can expire (e.g., monthly insights)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights(severity);

-- Budget Tracking table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  period TEXT, -- monthly, weekly, yearly
  start_date TEXT,
  end_date TEXT,
  alert_threshold REAL DEFAULT 0.8, -- Alert at 80%
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category);

-- Sync History table (track PayPal sync operations)
CREATE TABLE IF NOT EXISTS sync_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sync_type TEXT, -- full, incremental
  status TEXT, -- success, failed, partial
  transactions_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_history_user ON sync_history(user_id, started_at DESC);

-- Auth Sessions table (Gately Auth integration)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

-- Notifications table (budget alerts, anomaly alerts, etc.)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT, -- budget_alert, anomaly_detected, sync_completed
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT 0,
  action_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = 0;

-- Analytics table (for tracking usage and performance)
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- transaction_synced, insight_generated, api_call, etc.
  user_id TEXT,
  metadata TEXT, -- JSON as text
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics(user_id, timestamp DESC);

-- Insert initial data (optional)
-- Example user for testing
INSERT OR IGNORE INTO users (id, email, name) 
VALUES ('test-user-1', 'demo@example.com', 'Demo User');

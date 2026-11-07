-- Shared purchase record for the TELW IELTS diagnostics (D1 database telw-ielts-payments).
-- Bound as PAY_DB to the telw-apps (Reading and payment pages), Listening and Writing Workers.
CREATE TABLE IF NOT EXISTS ielts_pay_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO ielts_pay_settings(key, value) VALUES ('payments_required', 'off');

-- One row per Razorpay order. id is the Razorpay order id. Amounts are in paise.
CREATE TABLE IF NOT EXISTS ielts_pay_orders (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid')),
  payment_id TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS ielts_pay_orders_email ON ielts_pay_orders(email, created_at);

-- One credit = one test of one skill. A paid order creates its credits exactly once.
CREATE TABLE IF NOT EXISTS ielts_pay_credits (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES ielts_pay_orders(id),
  email TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('reading', 'listening', 'writing')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  used_ref TEXT,
  UNIQUE (order_id, skill)
);
CREATE INDEX IF NOT EXISTS ielts_pay_credits_open ON ielts_pay_credits(email, skill, used_at, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS ielts_pay_credits_ref ON ielts_pay_credits(used_ref) WHERE used_ref IS NOT NULL;

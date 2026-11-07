-- Every replacement test issued, with its reference, why, what triggered it, the credit it created,
-- the email service's message id and when the email was accepted, delivered or bounced.
CREATE TABLE IF NOT EXISTS ielts_pay_replacements (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('reading', 'listening', 'writing')),
  reason TEXT NOT NULL,
  source TEXT NOT NULL UNIQUE,
  credit_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  email_id TEXT,
  sent_at INTEGER,
  delivered_at INTEGER,
  bounced_at INTEGER
);
CREATE INDEX IF NOT EXISTS ielts_pay_replacements_email ON ielts_pay_replacements(email, created_at);
CREATE INDEX IF NOT EXISTS ielts_pay_replacements_mail ON ielts_pay_replacements(email_id);

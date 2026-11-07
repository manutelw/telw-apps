-- Problem reports from learners. id is the TELW reference number shown to the learner and emailed to TELW.
CREATE TABLE IF NOT EXISTS ielts_pay_reports (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  test TEXT NOT NULL,
  payment_ref TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  emailed_at INTEGER
);
CREATE INDEX IF NOT EXISTS ielts_pay_reports_email ON ielts_pay_reports(email, created_at);

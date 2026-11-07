-- A replacement test issued by TELW for a report. Recorded with when it was sent and the
-- delivery receipt from the email service, so TELW can show that it was sent and whether it was used.
ALTER TABLE ielts_pay_reports ADD COLUMN replacement_skill TEXT;
ALTER TABLE ielts_pay_reports ADD COLUMN replacement_credit TEXT;
ALTER TABLE ielts_pay_reports ADD COLUMN replaced_at INTEGER;
ALTER TABLE ielts_pay_reports ADD COLUMN replacement_email_id TEXT;

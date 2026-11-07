// Paid access to the TELW IELTS diagnostics. One purchase record (the PAY_DB D1 database)
// is shared by the Reading, Listening and Writing apps. Identical copies of this file live in
// workers/ielts, ielts-listening/server and ielts-writing/server; a test keeps them equal.
// Charging is off until the payments_required setting in PAY_DB is 'on', so the apps can be
// deployed before Razorpay approval without blocking anyone.
export const TRAINER_EMAIL = 'manutelw@gmail.com';
export const PAY_PATH = 'manuvikraman.com/ielts/pay/';
export const SKILLS = ['reading', 'listening', 'writing'];
const LABEL = {reading: 'Reading', listening: 'Listening', writing: 'Writing'};
export const normalEmail = email => String(email || '').trim().toLowerCase();

export class PaymentNeeded extends Error {
  constructor(skill, email) {
    super(`This ${LABEL[skill]} diagnostic has not been paid for yet. Buy it at ${PAY_PATH} using the email address ${normalEmail(email)}, then come back and start the test.`);
    this.status = 402;
  }
}

export async function paymentsRequired(env) {
  if (!env.PAY_DB) return false;
  const row = await env.PAY_DB.prepare(`SELECT value FROM ielts_pay_settings WHERE key='payments_required'`).first();
  return row?.value === 'on';
}

// Uses one unused, unexpired credit for this skill. Returns {free:true} for the trainer or while
// charging is off, {id} for a used credit, or null when nothing has been paid for.
export async function claimCredit(env, email, skill, ref, now) {
  if (!SKILLS.includes(skill)) throw new Error('Unknown skill');
  if (normalEmail(email) === TRAINER_EMAIL || !(await paymentsRequired(env))) return {free: true};
  const row = await env.PAY_DB.prepare(`UPDATE ielts_pay_credits SET used_at=?1,used_ref=?2
    WHERE id=(SELECT id FROM ielts_pay_credits WHERE email=?3 AND skill=?4 AND used_at IS NULL AND expires_at>?1 ORDER BY expires_at,id LIMIT 1)
    AND used_at IS NULL RETURNING id`).bind(now, String(ref), normalEmail(email), skill).first();
  return row ? {id: row.id} : null;
}

// Gives a credit back when the test could not be started after all.
export async function releaseCredit(env, claim, ref) {
  if (!claim?.id) return;
  await env.PAY_DB.prepare(`UPDATE ielts_pay_credits SET used_at=NULL,used_ref=NULL WHERE id=?1 AND used_ref=?2`).bind(claim.id, String(ref)).run();
}

export async function attachCredit(env, claim, from, to) {
  if (!claim?.id) return;
  await env.PAY_DB.prepare(`UPDATE ielts_pay_credits SET used_ref=?1 WHERE id=?2 AND used_ref=?3`).bind(String(to), claim.id, String(from)).run();
}

export async function creditFor(env, ref) {
  if (!env.PAY_DB) return null;
  return env.PAY_DB.prepare(`SELECT id,email,skill,used_at FROM ielts_pay_credits WHERE used_ref=?1`).bind(String(ref)).first();
}

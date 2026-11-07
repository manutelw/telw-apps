// Paid access to the TELW IELTS diagnostics. One purchase record (the PAY_DB D1 database)
// is shared by the Reading, Listening and Writing apps. Identical copies of this file live in
// workers/ielts, ielts-listening/server and ielts-writing/server; a test keeps them equal.
// Charging is off until a setting in PAY_DB is 'on': payments_required for all three skills, or
// payments_required_reading, _listening or _writing for one skill. The trainer is never charged.
export const TRAINER_EMAIL = 'manutelw@gmail.com';
export const PAY_PATH = 'manuvikraman.com/ielts/pay/';
export const SKILLS = ['reading', 'listening', 'writing'];
const LABEL = {reading: 'Reading', listening: 'Listening', writing: 'Writing'};
export const normalEmail = email => String(email || '').trim().toLowerCase();

export class PaymentNeeded extends Error {
  constructor(skill, email) {
    super(`You’re one step away from your ${LABEL[skill]} diagnostic. Use your email when you book, then come back here to begin.`);
    this.status = 402;
  }
}

export async function paymentsRequired(env, skill) {
  if (!env.PAY_DB) return false;
  const row = await env.PAY_DB.prepare(`SELECT count(*) AS n FROM ielts_pay_settings WHERE key IN ('payments_required',?1) AND value='on'`).bind('payments_required_' + skill).first();
  return row?.n > 0;
}

// Uses one unused, unexpired credit for this skill. Returns {free:true} for the trainer or while
// charging is off, {id} for a used credit, or null when nothing has been paid for.
export async function claimCredit(env, email, skill, ref, now) {
  if (!SKILLS.includes(skill)) throw new Error('Unknown skill');
  if (normalEmail(email) === TRAINER_EMAIL || !(await paymentsRequired(env, skill))) return {free: true};
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

// Replacement tests. TELW never relies on a learner's word: a replacement is issued either
// automatically, when the system itself records a fault on TELW's side, or by the trainer from
// the payments admin page. Each one is logged with a reference, the email service's receipt and,
// later, delivery and use, so TELW can show what was sent and when it was used.
const SKILL_LABEL = LABEL;
export function newReference(prefix) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes = crypto.getRandomValues(new Uint8Array(6));
  return prefix + [...bytes].map(b => letters[b % letters.length]).join('');
}
export async function issueReplacement(env, {email, skill, reason, source, now = Math.floor(Date.now() / 1000)}) {
  if (!env.PAY_DB || !SKILLS.includes(skill)) return null;
  email = normalEmail(email);
  const found = await env.PAY_DB.prepare(`SELECT * FROM ielts_pay_replacements WHERE source=?1`).bind(String(source)).first();
  if (found) return found;
  const id = newReference('TELW-R-'), order = 'repl_' + id, credit = crypto.randomUUID();
  await env.PAY_DB.batch([
    env.PAY_DB.prepare(`INSERT INTO ielts_pay_orders(id,email,product,amount,status,created_at,paid_at) VALUES(?1,?2,?3,0,'paid',?4,?4)`).bind(order, email, 'replacement-' + skill, now),
    env.PAY_DB.prepare(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES(?1,?2,?3,?4,?5,?6)`).bind(credit, order, email, skill, now, now + 180 * 86400),
    env.PAY_DB.prepare(`INSERT INTO ielts_pay_replacements(id,email,skill,reason,source,credit_id,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)`).bind(id, email, skill, String(reason).slice(0, 500), String(source), credit, now)
  ]);
  if (env.RESEND_API_KEY && env.TELW_FROM_EMAIL) {
    try {
      const link = 'https://manuvikraman.com/ielts/' + skill + '/';
      const response = await fetch('https://api.resend.com/emails', {method: 'POST', signal: AbortSignal.timeout(15000),
        headers: {authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json', 'idempotency-key': 'replacement-' + id},
        body: JSON.stringify({from: env.TELW_FROM_EMAIL, to: [email], bcc: [TRAINER_EMAIL], reply_to: TRAINER_EMAIL,
          subject: `Your replacement ${SKILL_LABEL[skill]} test is ready (${id})`,
          html: `<p>A replacement ${SKILL_LABEL[skill]} diagnostic has been added to this email address because of a technical problem on TELW's side.</p><p><strong>Reference:</strong> ${id}<br><strong>Reason:</strong> ${String(reason).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))}</p><p>Start it at <a href="${link}">${link}</a> and verify this same email address. It is valid for 6 months.</p><p>TELW The English Workshop</p>`})});
      const sent = response.ok ? await response.json().catch(() => ({})) : {};
      if (sent.id) await env.PAY_DB.prepare(`UPDATE ielts_pay_replacements SET email_id=?1,sent_at=?2 WHERE id=?3`).bind(String(sent.id), now, id).run();
    } catch { /* The replacement still exists; the admin page shows that the email was not confirmed. */ }
  }
  return env.PAY_DB.prepare(`SELECT * FROM ielts_pay_replacements WHERE id=?1`).bind(id).first();
}

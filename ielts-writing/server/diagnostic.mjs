import {getLearner, limit, readJson, reply, requireSameOrigin} from './auth.mjs';
import {setById, setsOfType} from './bank.mjs';
import {markAttempt} from './marking.mjs';

const ROOT = '/ielts/writing/api/';
const TEST_SECONDS = 60 * 60, GRACE_SECONDS = 60, COOLDOWN_SECONDS = 15 * 24 * 60 * 60;
const LEASE_SECONDS = 600, MAX_MARK_TRIES = 5, MAX_CHARS = 15000;
const TRAINER_EMAIL = 'manutelw@gmail.com';

class Refusal extends Error { constructor(message, status) { super(message); this.status = status; } }
const clean = value => {
  if (typeof value !== 'string') throw new Refusal('Your answer could not be read.', 400);
  if (value.length > MAX_CHARS) throw new Refusal('This answer is too long to save.', 413);
  return value;
};
const publicTask = task => ({time: task.time, prompt: task.prompt, instruction: task.instruction, bullets: task.bullets || [], end: task.end || '', words: task.words, extra: task.extra || '', opening: task.opening || '', visual: task.visual || null});

async function latestAttempt(env, learnerId) {
  return env.WRITING_DB.prepare('SELECT * FROM writing_attempts WHERE learner_id=?1 ORDER BY started_at DESC, rowid DESC LIMIT 1').bind(learnerId).first();
}
// When time has run out, the last saved work is what gets marked.
async function closeIfExpired(env, attempt, now) {
  if (attempt?.status !== 'active' || now <= attempt.deadline_at + GRACE_SECONDS) return attempt;
  await env.WRITING_DB.prepare(`UPDATE writing_attempts SET status='submitted',submitted_at=?1 WHERE id=?2 AND status='active'`).bind(attempt.deadline_at, attempt.id).run();
  return env.WRITING_DB.prepare('SELECT * FROM writing_attempts WHERE id=?1').bind(attempt.id).first();
}
function view(attempt, now, trainer) {
  if (!attempt) return {status: 'none', cooldownUntil: 0};
  const set = setById(attempt.set_id);
  const cooldownUntil = trainer ? 0 : attempt.started_at + COOLDOWN_SECONDS;
  if (attempt.status === 'active') return {status: 'active', type: set.type, deadlineAt: attempt.deadline_at, serverNow: now, task1: publicTask(set.task1), task2: publicTask(set.task2), answer1: attempt.answer1, answer2: attempt.answer2, seq: attempt.save_seq};
  if (attempt.status === 'marked') return {status: 'marked', type: set.type, result: JSON.parse(attempt.result_json), cooldownUntil: cooldownUntil > now ? cooldownUntil : 0, emailed: Boolean(attempt.feedback_emailed_at)};
  return {status: attempt.mark_tries >= MAX_MARK_TRIES ? 'delayed' : 'marking', type: set.type};
}

async function start(request, env, learner, now, trainer) {
  const body = await readJson(request);
  if (!['academic', 'general'].includes(body.type)) throw new Refusal('Choose Academic or General Training.', 400);
  const current = await closeIfExpired(env, await latestAttempt(env, learner.id), now);
  if (current && ['active', 'submitted'].includes(current.status)) return reply({ok: true, ...view(current, now, trainer)});
  if (!trainer) {
    if (current && current.started_at + COOLDOWN_SECONDS > now) throw new Refusal('You can take one Writing diagnostic every 15 days.', 409);
    const maximum = Number(env.WRITING_DAILY_LIMIT) || 50;
    const today = await env.WRITING_DB.prepare('SELECT COUNT(*) AS n FROM writing_attempts WHERE started_at>?1 AND trainer_test=0').bind(now - 86400).first();
    if (today.n >= maximum) throw new Refusal('Today’s diagnostic places are full. Please try again tomorrow.', 429);
  }
  const used = await env.WRITING_DB.prepare('SELECT set_id,MAX(started_at) AS last FROM writing_attempts WHERE learner_id=?1 GROUP BY set_id').bind(learner.id).all();
  const seen = new Map(used.results.map(x => [x.set_id, x.last]));
  const chosen = [...setsOfType(body.type)].sort((a, b) => (seen.get(a.id) || 0) - (seen.get(b.id) || 0))[0];
  const id = crypto.randomUUID();
  await env.WRITING_DB.prepare(`INSERT INTO writing_attempts(id,learner_id,set_id,started_at,deadline_at,status,trainer_test) VALUES(?1,?2,?3,?4,?5,'active',?6)`)
    .bind(id, learner.id, chosen.id, now, now + TEST_SECONDS, trainer ? 1 : 0).run();
  return reply({ok: true, ...view(await env.WRITING_DB.prepare('SELECT * FROM writing_attempts WHERE id=?1').bind(id).first(), now, trainer)});
}

async function save(request, env, learner, now, finish) {
  const body = await readJson(request, 64000);
  const attempt = await latestAttempt(env, learner.id);
  if (attempt?.status !== 'active') throw new Refusal('This diagnostic is no longer open.', 409);
  if (now > attempt.deadline_at + GRACE_SECONDS) throw new Refusal('Time has ended. Your last saved work will be marked.', 409);
  const answer1 = clean(body.answer1), answer2 = clean(body.answer2), seq = Number(body.seq);
  if (!Number.isInteger(seq) || seq < 0) throw new Refusal('Invalid save.', 400);
  // Late or out-of-order saves can never overwrite newer writing.
  await env.WRITING_DB.prepare(`UPDATE writing_attempts SET answer1=?1,answer2=?2,save_seq=?3,saved_at=?4 WHERE id=?5 AND status='active' AND save_seq<?3`).bind(answer1, answer2, seq, now, attempt.id).run();
  if (finish) await env.WRITING_DB.prepare(`UPDATE writing_attempts SET status='submitted',submitted_at=?1 WHERE id=?2 AND status='active'`).bind(now, attempt.id).run();
  return reply({ok: true, savedAt: now, submitted: Boolean(finish)});
}

async function mark(env, learner, now, trainer) {
  const attempt = await closeIfExpired(env, await latestAttempt(env, learner.id), now);
  if (attempt?.status === 'marked') return reply({ok: true, trainer, ...view(attempt, now, trainer)});
  if (attempt?.status !== 'submitted') throw new Refusal('There is nothing to mark yet.', 409);
  // One marking run at a time. Closing the page cannot lose or double-charge the marking.
  const claim = await env.WRITING_DB.prepare(`UPDATE writing_attempts SET mark_lease=?1,mark_tries=mark_tries+1
    WHERE id=?2 AND status='submitted' AND mark_tries<?3 AND (mark_lease IS NULL OR mark_lease<?4) RETURNING id`).bind(now + LEASE_SECONDS, attempt.id, MAX_MARK_TRIES, now).first();
  if (!claim) return reply({ok: true, trainer, ...view(attempt, now, trainer)});
  try {
    const result = await markAttempt(env, setById(attempt.set_id), attempt.answer1, attempt.answer2);
    await env.WRITING_DB.prepare(`UPDATE writing_attempts SET status='marked',result_json=?1,marked_at=?2,mark_lease=NULL WHERE id=?3 AND status='submitted'`).bind(JSON.stringify(result), now, attempt.id).run();
  } catch {
    await env.WRITING_DB.prepare('UPDATE writing_attempts SET mark_lease=NULL WHERE id=?1').bind(attempt.id).run();
  }
  return reply({ok: true, trainer, ...view(await env.WRITING_DB.prepare('SELECT * FROM writing_attempts WHERE id=?1').bind(attempt.id).first(), now, trainer)});
}

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export const bandLabel = overall => `${overall.low.toFixed(1)}–${overall.high.toFixed(1)}`;
function feedbackHtml(result) {
  const tasks = result.tasks.map(task => `<h3>Task ${task.task}: about Band ${task.band.toFixed(1)} (${task.words} words)</h3>${task.note ? `<p>${esc(task.note)}</p>` : ''}${task.criteria.map(c => `<p><strong>${esc(c.name)}: Band ${c.band}</strong><br>${esc(c.why)}<br><em>Next step:</em> ${esc(c.improve)}${c.rewrite ? `<br><em>You wrote:</em> ${esc(c.rewrite.original)}<br><em>Try:</em> ${esc(c.rewrite.better)}` : ''}</p>`).join('')}`).join('');
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:680px"><h2>Your TELW IELTS Writing diagnostic</h2><p><strong>Estimated band range: ${bandLabel(result.overall)}</strong></p><p>This TELW diagnostic is marked against TELW's rubric, which is based on the public IELTS Writing band descriptors. It is not an official IELTS score, and your test result may differ. It is a useful guide to your current level and what to work on next.</p>${tasks}<h3>Work on this with Manu</h3><p>This feedback shows what to change. In training, you would practise these changes with Manu Vikraman, a TESOL-certified trainer with experience as an IELTS examiner, and get feedback on each new attempt.</p><p><a href="https://manuvikraman.com/contact/?programme=ielts">Ask TELW about IELTS training</a></p><p>TELW The English Workshop</p></div>`;
}
async function emailFeedback(request, env, learner, now) {
  const body = await readJson(request);
  if (body.consent !== true) throw new Refusal('Please confirm that you would like this email.', 400);
  await limit(env, 'feedback:' + learner.id, 3600, 3, now);
  const attempt = await latestAttempt(env, learner.id);
  if (attempt?.status !== 'marked') throw new Refusal('Your result is not ready yet.', 409);
  if (attempt.feedback_emailed_at) return reply({ok: true, already: true});
  const claim = await env.WRITING_DB.prepare('UPDATE writing_attempts SET feedback_emailed_at=?1 WHERE id=?2 AND feedback_emailed_at IS NULL RETURNING id').bind(now, attempt.id).first();
  if (!claim) return reply({ok: true, already: true});
  let sent = false;
  try {
    const response = await fetch('https://api.resend.com/emails', {method: 'POST', signal: AbortSignal.timeout(15000),
      headers: {authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json', 'idempotency-key': 'writing-feedback-' + attempt.id},
      body: JSON.stringify({from: env.TELW_FROM_EMAIL, to: [learner.email], subject: 'Your TELW IELTS Writing diagnostic feedback', html: feedbackHtml(JSON.parse(attempt.result_json))})});
    sent = response.ok;
  } catch { /* Handled below. */ }
  if (!sent) {
    await env.WRITING_DB.prepare('UPDATE writing_attempts SET feedback_emailed_at=NULL WHERE id=?1').bind(attempt.id).run();
    throw new Refusal('We could not send the email. Please try again shortly.', 502);
  }
  return reply({ok: true});
}

export async function handleDiagnostic(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(ROOT) || url.pathname.startsWith(ROOT + 'auth/')) return null;
  const route = url.pathname.slice(ROOT.length);
  const methods = {state: 'GET', start: 'POST', save: 'POST', submit: 'POST', mark: 'POST', feedback: 'POST'};
  if (!methods[route]) return reply({error: 'Not found'}, 404);
  if (request.method !== methods[route]) return reply({error: 'Method not allowed'}, 405, {allow: methods[route]});
  try {
    if (methods[route] === 'POST') requireSameOrigin(request);
    const now = Math.floor(Date.now() / 1000), learner = await getLearner(request, env, now);
    if (!learner) return reply({ok: false, error: 'Please verify your email first.'}, 401);
    const trainer = learner.email === TRAINER_EMAIL;
    if (route === 'state') return reply({ok: true, trainer, ...view(await closeIfExpired(env, await latestAttempt(env, learner.id), now), now, trainer)});
    if (route === 'start') return await start(request, env, learner, now, trainer);
    if (route === 'save') return await save(request, env, learner, now, false);
    if (route === 'submit') return await save(request, env, learner, now, true);
    if (route === 'mark') return await mark(env, learner, now, trainer);
    return await emailFeedback(request, env, learner, now);
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 503;
    return reply({ok: false, error: Number.isInteger(error?.status) ? error.message : 'This service is temporarily unavailable. Your saved work is safe.'}, status);
  }
}

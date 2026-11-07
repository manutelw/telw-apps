(() => {
'use strict';
const BASE = '/ielts/writing/api/', $ = id => document.getElementById(id);
const SCREENS = ['identity', 'home', 'test', 'marking', 'result'];
let attempt = null, activeTask = 1, seq = 0, dirty = false, saving = false, skew = 0, tick = null, poll = null, challengeId = '', finishing = false;
const answers = {1: '', 2: ''};

const show = name => {
  SCREENS.forEach(id => { $(id).hidden = id !== name; });
  document.body.classList.toggle('testing', name === 'test');
  if (name !== 'test') clearInterval(tick);
  if (name !== 'marking') clearTimeout(poll);
};
const api = async (route, body) => {
  const response = await fetch(BASE + route, body === undefined ? {credentials: 'same-origin'} : {method: 'POST', credentials: 'same-origin', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
  let data = {}; try { data = await response.json(); } catch { /* Handled by status. */ }
  if (!response.ok) { const error = new Error(data.error || 'Something went wrong. Please try again.'); error.status = response.status; throw error; }
  return data;
};
const words = text => (String(text).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
const node = (tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; return el; };

// Visuals are drawn by visuals.js from the task data.
const visual = v => window.TELWVisual.render(v);
function renderTask() {
  const task = attempt['task' + activeTask], box = $('taskText'); box.replaceChildren();
  box.append(node('h2', 'Writing Task ' + activeTask), node('p', task.time));
  // Official IELTS layout: the task, its instruction and any bullet points sit together in the box.
  const framed = node('div', undefined, 'frame'); framed.append(node('p', task.prompt));
  if (task.instruction) framed.append(node('p', task.instruction));
  if (task.bullets?.length) { const ul = node('ul'); task.bullets.forEach(b => ul.append(node('li', b))); framed.append(ul); }
  if (activeTask === 2) box.append(node('p', 'Write about the following topic:'));
  box.append(framed);
  if (task.end) box.append(node('p', task.end));
  box.append(node('p', task.words));
  if (task.extra) box.append(node('p', task.extra));
  if (task.opening) box.append(node('p', task.opening));
  if (task.visual) box.append(visual(task.visual));
  $('tab1').setAttribute('aria-selected', String(activeTask === 1)); $('tab2').setAttribute('aria-selected', String(activeTask === 2));
  $('answerLabel').textContent = `Your answer to Task ${activeTask}`;
  $('answerBox').value = answers[activeTask]; updateCount();
}
function updateCount() {
  const n = words(answers[activeTask]), min = activeTask === 1 ? 150 : 250;
  $('wordCount').textContent = n === 1 ? '1 word' : n + ' words';
  $('wordHint').textContent = n < min ? `${min - n} more to reach the ${min}-word minimum` : `Minimum of ${min} reached`;
}
const remaining = () => Math.max(0, attempt.deadlineAt - (Math.floor(Date.now() / 1000) + skew));
function runTimer() {
  const s = remaining();
  $('timer').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  $('timer').classList.toggle('low', s <= 300);
  if (s === 0 && !finishing) submit();
}
async function save() {
  if (!dirty || saving || !attempt) return;
  saving = true; dirty = false;
  const sent = ++seq;
  try {
    await api('save', {answer1: answers[1], answer2: answers[2], seq: sent});
    $('saved').textContent = 'Saved';
  } catch (error) {
    dirty = true;
    $('saved').textContent = error.status === 409 ? 'Time has ended' : 'Not saved yet. Retrying.';
    if (error.status === 409) load();
  } finally { saving = false; }
}
async function submit() {
  finishing = true; clearInterval(tick); $('confirmFinish').disabled = true;
  try { await api('submit', {answer1: answers[1], answer2: answers[2], seq: ++seq}); }
  catch (error) { if (error.status !== 409) { finishing = false; $('confirmFinish').disabled = false; $('saved').textContent = error.message; startTimers(); return; } }
  beginMarking();
}
function startTimers() { clearInterval(tick); runTimer(); tick = setInterval(() => { runTimer(); if (remaining() % 15 === 0) save(); }, 1000); }
function openTest(state) {
  attempt = state; finishing = false; seq = state.seq || 0; dirty = false;
  answers[1] = state.answer1 || ''; answers[2] = state.answer2 || '';
  skew = state.serverNow - Math.floor(Date.now() / 1000); activeTask = 1;
  $('finishBox').hidden = true; $('confirmFinish').disabled = false;
  show('test'); renderTask(); startTimers(); $('answerBox').focus();
}
async function beginMarking() {
  show('marking');
  $('markingTitle').textContent = 'Marking your work';
  $('markingText').textContent = 'This usually takes up to two minutes. Your answers are saved, so you can close this page and return later using the same email.';
  try {
    const state = await api('mark', {});
    route(state);
  } catch (error) {
    $('markingStatus').textContent = error.message;
    poll = setTimeout(beginMarking, 15000);
  }
}
function renderResult(state) {
  const {overall, tasks, priorities} = state.result;
  $('bandRange').textContent = `${overall.low.toFixed(1)}–${overall.high.toFixed(1)}`;
  $('rangeNote').textContent = overall.wide ? 'This range is wider than usual, so treat it as a broad guide.' : 'This is the band range your writing is most likely to fall in.';
  $('priorities').replaceChildren(...priorities.map(p => { const li = node('li'); li.append(node('strong', `Task ${p.task}, ${p.name}: `), document.createTextNode(p.improve)); return li; }));
  $('taskResults').replaceChildren(...tasks.map(task => {
    const box = node('div', undefined, 'taskResult');
    box.append(node('h3', `Task ${task.task}: about Band ${task.band.toFixed(1)}`), node('p', `${task.words} words, minimum ${task.minimum}.${task.note ? ' ' + task.note : ''}`));
    task.criteria.forEach(c => {
      const item = node('div', undefined, 'criterion'); item.append(node('h4', `${c.name}: Band ${c.band}`), node('p', c.why));
      c.evidence.forEach(q => item.append(node('blockquote', q)));
      const next = node('p'); next.append(node('strong', 'Next step: '), document.createTextNode(c.improve)); item.append(next);
      if (c.rewrite) { const change = node('div', undefined, 'rewrite'); const was = node('p'), now = node('p'); was.append(node('strong', 'You wrote: '), document.createTextNode(c.rewrite.original)); now.append(node('strong', 'Try: '), document.createTextNode(c.rewrite.better)); change.append(was, now); item.append(change); }
      box.append(item);
    });
    return box;
  }));
  $('nextAttempt').textContent = state.cooldownUntil ? `Your next Writing diagnostic is available from ${new Date(state.cooldownUntil * 1000).toLocaleDateString(undefined, {day: 'numeric', month: 'long', year: 'numeric'})}.` : '';
  $('feedbackStatus').textContent = state.emailed ? 'Your feedback has been emailed.' : '';
  $('anotherTest').hidden = !state.trainer;
  show('result');
}
function route(state) {
  if (state.status === 'active') return openTest(state);
  if (state.status === 'marked') return renderResult(state);
  if (state.status === 'marking') { show('marking'); clearTimeout(poll); poll = setTimeout(beginMarking, 8000); return; }
  if (state.status === 'delayed') {
    show('marking'); $('markingTitle').textContent = 'Your marking is delayed';
    $('markingText').textContent = `Marking did not finish because of a technical problem on TELW's side, and TELW has been notified automatically (reference ${state.reference}). `
      + (state.replacement ? `A replacement Writing test has been added to your email address (reference ${state.replacement}), and we have emailed you the details. You can start it now. ` : 'You can start a new Writing test now. ');
    const again = node('button', 'Start a new Writing test'); again.type = 'button'; again.addEventListener('click', () => show('home'));
    $('markingText').append(node('br'), again);
    return;
  }
  if (state.cooldownUntil) $('homeStatus').textContent = '';
  show('home');
}
async function load() {
  try { route(await api('state')); }
  catch (error) { if (error.status === 401) show('identity'); else { show('identity'); $('identityStatus').textContent = error.message; } }
}

$('requestForm').addEventListener('submit', async e => {
  e.preventDefault(); $('sendCode').disabled = true; $('identityStatus').textContent = 'Sending your code…';
  try {
    const data = await api('auth/request-code', {email: $('email').value, consent: $('privacy').checked});
    challengeId = data.challengeId; $('requestForm').hidden = true; $('verifyForm').hidden = false;
    $('identityStatus').textContent = 'Check your email for an eight-digit code.'; $('code').focus();
  } catch (error) { $('identityStatus').textContent = error.message; } finally { $('sendCode').disabled = false; }
});
$('verifyForm').addEventListener('submit', async e => {
  e.preventDefault(); $('verifyCode').disabled = true;
  try { await api('auth/verify-code', {challengeId, code: $('code').value}); $('identityStatus').textContent = ''; await load(); }
  catch (error) { $('identityStatus').textContent = error.message; } finally { $('verifyCode').disabled = false; }
});
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', async () => {
  $('homeStatus').textContent = 'Starting…';
  try { const state = await api('start', {type: button.dataset.type}); $('homeStatus').textContent = ''; route(state); }
  catch (error) {
    $('homeStatus').textContent = error.message;
    if (error.status === 402) { const link = node('a', ' Buy the Writing diagnostic'); link.href = '/ielts/pay/?test=writing'; $('homeStatus').append(link); }
  }
}));
$('answerBox').addEventListener('input', () => { answers[activeTask] = $('answerBox').value; dirty = true; $('saved').textContent = ''; updateCount(); });
[1, 2].forEach(n => $('tab' + n).addEventListener('click', () => { activeTask = n; renderTask(); save(); }));
$('finish').addEventListener('click', () => {
  const a = words(answers[1]), b = words(answers[2]);
  $('finishSummary').textContent = `Task 1: ${a} words (minimum 150). Task 2: ${b} words (minimum 250). You cannot change your answers after submitting.`;
  $('finishBox').hidden = false; window.scrollTo(0, 0); $('confirmFinish').focus();
});
$('cancelFinish').addEventListener('click', () => { $('finishBox').hidden = true; $('answerBox').focus(); });
$('confirmFinish').addEventListener('click', submit);
$('feedbackButton').addEventListener('click', async () => {
  try { await api('feedback', {consent: $('feedbackConsent').checked}); $('feedbackStatus').textContent = 'Your feedback has been emailed.'; }
  catch (error) { $('feedbackStatus').textContent = error.message; }
});
$('anotherTest').addEventListener('click', () => show('home'));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
window.addEventListener('beforeunload', e => { if (dirty && !$('test').hidden) e.preventDefault(); });
load();
})();

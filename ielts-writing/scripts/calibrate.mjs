// Test the live marking prompt against published sample answers that already have examiner bands.
// Usage: OPENAI_API_KEY=... node scripts/calibrate.mjs samples.private.json rubric.private.json
// samples: [{"type":"academic","task":2,"question":{"prompt":"...","instruction":"..."},"script":"...","band":6.5}]. Keep it outside git.
// This prints the marked level, before the half-band strict adjustment shown to learners.
import {readFileSync} from 'node:fs';
import {buildMessages, validPass, roundHalf} from '../server/marking.mjs';
const [samples, rubric] = process.argv.slice(2, 4).map(p => JSON.parse(readFileSync(p, 'utf8')));
const keys = ['fulfilment', 'coherence', 'lexical', 'grammar'], median = a => [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) / 2)];
let close = 0, total = 0, gap = 0;
for (const s of samples) {
  const task = s.question, bands = [];
  for (let i = 0; i < 3; i++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {method: 'POST', headers: {authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'content-type': 'application/json'}, body: JSON.stringify({model: process.env.OPENAI_MARKING_MODEL || 'gpt-4o', response_format: {type: 'json_object'}, messages: buildMessages(rubric, s.type, s.task, task, s.script)})});
    const pass = validPass((await res.json()).choices?.[0]?.message?.content, s.script);
    if (pass) bands.push(keys.reduce((n, k) => n + pass[k].band, 0) / 4);
  }
  if (!bands.length) { console.log('no valid marking', s.band); continue; }
  const got = roundHalf(median(bands)), diff = Math.abs(got - s.band); total++; gap += got - s.band; if (diff <= 0.5) close++;
  console.log(`examiner ${s.band}  app ${got}  markings ${bands.join(', ')}`);
}
console.log(`Within half a band: ${close}/${total}. Average lean: ${(gap / (total || 1)).toFixed(2)} bands (positive means too generous).`);

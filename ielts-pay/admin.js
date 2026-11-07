'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const API = '/api/ielts/pay/admin/';
  const focus = new URLSearchParams(location.search).get('ref');
  const when = s => s ? new Date(s * 1000).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'}) : '';
  const cell = (row, text, cls) => { const td = document.createElement('td'); td.textContent = text ?? ''; if (cls) td.className = cls; row.append(td); return td; };
  const status = (text, bad = false) => { $('status').textContent = text; $('status').className = 'status' + (bad ? ' error' : ''); };

  async function load() {
    const response = await fetch(API + 'overview');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { status(data.error || 'Could not load.', true); return; }
    status('');
    $('reports').replaceChildren(); $('replacements').replaceChildren();
    for (const r of data.reports) {
      const tr = document.createElement('tr'); if (r.id === focus) tr.className = 'focus';
      cell(tr, r.id); cell(tr, when(r.created_at)); cell(tr, r.email); cell(tr, r.test + (r.payment_ref ? ' · ' + r.payment_ref : '')); cell(tr, r.message);
      const td = cell(tr, '');
      if (r.replacement) { td.textContent = 'Sent: ' + r.replacement; td.className = 'ok'; }
      else {
        const pick = document.createElement('select');
        for (const [v, t] of [['', 'Choose test'], ['reading', 'Reading'], ['listening', 'Listening'], ['writing', 'Writing']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; pick.append(o); }
        if (['reading', 'listening', 'writing'].includes(r.test)) pick.value = r.test;
        const go = document.createElement('button'); go.type = 'button'; go.className = 'small'; go.textContent = 'Send replacement';
        go.onclick = async () => {
          if (!pick.value) return status('Choose which test to replace.', true);
          if (!confirm(`Send a replacement ${pick.value} test to ${r.email}?`)) return;
          go.disabled = true;
          const res = await fetch(API + 'replace', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({reference: r.id, skill: pick.value})});
          const out = await res.json().catch(() => ({}));
          if (!res.ok) { go.disabled = false; return status(out.error || 'Could not send.', true); }
          status(`Replacement ${out.replacement.id} sent to ${r.email}.`); load();
        };
        td.append(pick, ' ', go);
      }
      $('reports').append(tr);
    }
    for (const x of data.replacements) {
      const tr = document.createElement('tr');
      cell(tr, x.id); cell(tr, x.email); cell(tr, x.skill); cell(tr, x.reason); cell(tr, when(x.created_at));
      cell(tr, x.sent_at ? when(x.sent_at) : 'Not confirmed', x.sent_at ? 'ok' : 'bad');
      cell(tr, x.bounced_at ? 'Bounced ' + when(x.bounced_at) : x.delivered_at ? when(x.delivered_at) : 'Waiting', x.bounced_at ? 'bad' : x.delivered_at ? 'ok' : '');
      cell(tr, x.used_at ? when(x.used_at) : 'Not yet', x.used_at ? 'ok' : '');
      $('replacements').append(tr);
    }
    if (!data.reports.length) { const tr = document.createElement('tr'); cell(tr, 'No reports yet.').colSpan = 6; $('reports').append(tr); }
    if (!data.replacements.length) { const tr = document.createElement('tr'); cell(tr, 'No replacements yet.').colSpan = 8; $('replacements').append(tr); }
  }
  load().catch(() => status('Could not load. Check your connection.', true));
})();

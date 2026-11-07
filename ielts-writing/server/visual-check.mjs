// Checks that a Task 1 visual is complete and its figures are consistent, so a learner never
// sees a chart that cannot be drawn or does not add up. Used by the tests for every question set.
const inRange = (n, lo, hi) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
export function checkVisual(v, where = 'visual') {
  const problems = [], bad = text => problems.push(`${where}: ${text}`);
  if (!v || typeof v.title !== 'string' || !v.title.trim()) { bad('missing title'); return problems; }
  const axis = () => {
    if (!inRange(v.yMax, 0.0001, 1e9) || !inRange(v.yStep, 0.0001, v.yMax)) bad('axis scale is invalid');
    if (Math.abs(v.yMax / v.yStep - Math.round(v.yMax / v.yStep)) > 1e-9) bad('axis step does not divide the maximum');
    if (!Array.isArray(v.x) || v.x.length < 2) bad('needs at least two categories');
    if (!Array.isArray(v.series) || !v.series.length || v.series.length > 4) bad('needs one to four series');
    for (const s of v.series || []) {
      if (!s.name || !Array.isArray(s.values) || s.values.length !== v.x.length) bad(`series "${s.name}" does not match the categories`);
      for (const n of s.values || []) if (!inRange(n, 0, v.yMax)) bad(`value ${n} in "${s.name}" is outside the axis`);
    }
    if (!v.yLabel) bad('axis label missing');
  };
  if (v.kind === 'line') { axis(); if (v.x.length < 3) bad('a line graph needs at least three points'); }
  else if (v.kind === 'bar') axis();
  else if (v.kind === 'pie') {
    if (!Array.isArray(v.charts) || !v.charts.length || v.charts.length > 3) bad('needs one to three pie charts');
    for (const ch of v.charts || []) {
      const total = (ch.slices || []).reduce((a, s) => a + s.value, 0);
      if (!ch.label) bad('pie chart label missing');
      if (!Array.isArray(ch.slices) || ch.slices.length < 2 || ch.slices.length > 7) bad(`"${ch.label}" needs two to seven slices`);
      if (Math.abs(total - 100) > 0.5) bad(`"${ch.label}" adds up to ${total}, not 100`);
      for (const s of ch.slices || []) if (!s.name || !inRange(s.value, 0.1, 100)) bad(`"${ch.label}" has an invalid slice`);
    }
  } else if (v.kind === 'table') {
    if (!Array.isArray(v.head) || v.head.length < 2) bad('table needs a header row');
    if (!Array.isArray(v.rows) || v.rows.length < 2) bad('table needs at least two rows');
    for (const r of v.rows || []) if (r.length !== v.head.length || r.some(c => typeof c !== 'string' || !c.trim())) bad('a table row does not match the header');
  } else if (v.kind === 'process') {
    const n = (v.steps || []).length;
    if (n < 4 || n > (v.cycle ? 8 : 12)) bad(`process needs 4 to ${v.cycle ? 8 : 12} stages`);
    for (const s of v.steps || []) if (!s.label || s.label.length > 48 || (s.note && s.note.length > 24)) bad(`stage "${s.label}" is too long to fit`);
  } else if (v.kind === 'map') {
    if (!Array.isArray(v.maps) || !v.maps.length || v.maps.length > 2) bad('needs one or two maps');
    for (const m of v.maps || []) {
      if (!m.label) bad('map label missing');
      if (!Array.isArray(m.features) || m.features.filter(f => f.label).length < 3) bad(`map "${m.label}" needs at least three labelled features`);
      for (const f of m.features || []) {
        const pts = f.points || (f.type === 'point' ? [[f.x, f.y]] : [[f.x, f.y], [f.x + f.w, f.y + f.h]]);
        if (!['area', 'building', 'road', 'river', 'rail', 'path', 'point'].includes(f.type)) bad(`unknown map feature "${f.type}"`);
        if (pts.some(p => !inRange(p[0], 0, 100) || !inRange(p[1], 0, 100))) bad(`feature "${f.label || f.type}" in "${m.label}" is off the map`);
      }
    }
  } else if (v.kind === 'mixed') {
    if (!Array.isArray(v.parts) || v.parts.length !== 2) bad('a combined visual needs two parts');
    (v.parts || []).forEach((p, i) => { if (p.kind === 'mixed' || p.kind === 'map') bad('part cannot be combined'); problems.push(...checkVisual(p, `${where} part ${i + 1}`)); });
  } else bad(`unknown kind "${v.kind}"`);
  return problems;
}

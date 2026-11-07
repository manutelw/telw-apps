/* TELW IELTS Writing Task 1 visuals: line graphs, bar charts, pie charts, tables, combined
   visuals, process diagrams, natural cycles and maps. Everything is drawn from the task data,
   in monochrome with patterns, as on an exam paper. Shared by the test page and the review page. */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg', INK = '#17374a', GRID = '#d5dde2', SOFT = '#c9d2d8';
let uid = 0;
const html = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
function canvas(W, H, label) {
  const svg = document.createElementNS(NS, 'svg'), id = 'v' + (++uid);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'chart'); svg.setAttribute('role', 'img'); svg.setAttribute('font-size', '12'); svg.style.maxWidth = W + 'px'; svg.setAttribute('font-family', 'Arial, Helvetica, sans-serif'); svg.setAttribute('aria-label', label);
  const add = (tag, attrs = {}, text, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    parent.append(e); return e;
  };
  const defs = add('defs');
  const pattern = (name, size, draw) => { const p = add('pattern', {id: `${id}-${name}`, width: size, height: size, patternUnits: 'userSpaceOnUse'}, undefined, defs); draw(p); };
  pattern('hatch', 6, p => { add('rect', {width: 6, height: 6, fill: '#fff'}, undefined, p); add('path', {d: 'M0,6 L6,0 M-1,1 L1,-1 M5,7 L7,5', stroke: INK, 'stroke-width': 1.2}, undefined, p); });
  pattern('dots', 6, p => { add('rect', {width: 6, height: 6, fill: '#fff'}, undefined, p); add('circle', {cx: 3, cy: 3, r: 1.1, fill: INK}, undefined, p); });
  pattern('cross', 7, p => { add('rect', {width: 7, height: 7, fill: '#fff'}, undefined, p); add('path', {d: 'M0,3.5 H7 M3.5,0 V7', stroke: INK, 'stroke-width': .9}, undefined, p); });
  pattern('hlines', 5, p => { add('rect', {width: 5, height: 5, fill: '#fff'}, undefined, p); add('path', {d: 'M0,2.5 H5', stroke: INK, 'stroke-width': .9}, undefined, p); });
  pattern('vlines', 5, p => { add('rect', {width: 5, height: 5, fill: '#fff'}, undefined, p); add('path', {d: 'M2.5,0 V5', stroke: INK, 'stroke-width': .9}, undefined, p); });
  pattern('water', 4, p => { add('rect', {width: 4, height: 4, fill: '#eef2f4'}, undefined, p); add('path', {d: 'M0,2 Q1,1 2,2 T4,2', stroke: INK, 'stroke-width': .35, fill: 'none'}, undefined, p); });
  pattern('trees', 6, p => { add('rect', {width: 6, height: 6, fill: '#fff'}, undefined, p); add('circle', {cx: 3, cy: 3, r: 1.6, fill: 'none', stroke: INK, 'stroke-width': .5}, undefined, p); });
  pattern('field', 4, p => { add('rect', {width: 4, height: 4, fill: '#fff'}, undefined, p); add('circle', {cx: 2, cy: 2, r: .35, fill: INK}, undefined, p); });
  pattern('sand', 3, p => { add('rect', {width: 3, height: 3, fill: '#f6f3ea'}, undefined, p); add('circle', {cx: 1, cy: 1, r: .25, fill: INK}, undefined, p); });
  const FILLS = [INK, '#fff', `url(#${id}-hatch)`, SOFT, `url(#${id}-dots)`, `url(#${id}-cross)`, `url(#${id}-hlines)`, `url(#${id}-vlines)`];
  const fill = k => FILLS[k % FILLS.length];
  const areaFill = name => ({water: `url(#${id}-water)`, trees: `url(#${id}-trees)`, field: `url(#${id}-field)`, sand: `url(#${id}-sand)`, park: `url(#${id}-dots)`, parking: '#eef0ea', paved: '#e4e8ea', building: SOFT}[name] || '#fff');
  return {svg, add, fill, areaFill};
}
function legend(items, fillOf, kind) {
  const box = html('div', undefined, 'legend');
  items.forEach((name, k) => {
    const item = html('span'), sw = document.createElementNS(NS, 'svg');
    sw.setAttribute('viewBox', '0 0 28 14'); sw.setAttribute('width', '28'); sw.setAttribute('height', '14'); sw.setAttribute('aria-hidden', 'true');
    sw.innerHTML = kind === 'line'
      ? `<line x1="1" y1="7" x2="27" y2="7" stroke="${INK}" stroke-width="2" stroke-dasharray="${DASHES[k] || ''}"/>${markSvg(k, 14, 7)}`
      : '';
    if (kind !== 'line') sw.append(fillOf(k, sw));
    item.append(sw, document.createTextNode(name)); box.append(item);
  });
  return box;
}
const DASHES = ['', '8 5', '2 4', '12 4 2 4', '4 3'];
function markSvg(k, x, y) {
  if (k === 0) return `<circle cx="${x}" cy="${y}" r="3.5" fill="${INK}"/>`;
  if (k === 1) return `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
  if (k === 2) return `<polygon points="${x},${y - 4.5} ${x + 4.5},${y + 3.5} ${x - 4.5},${y + 3.5}" fill="${INK}"/>`;
  if (k === 3) return `<polygon points="${x},${y - 4.5} ${x + 4.5},${y} ${x},${y + 4.5} ${x - 4.5},${y}" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;
  return `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
}
// Legend swatches for filled shapes reuse the main chart's patterns by drawing a copy of them.
function swatchMaker(chart) {
  return (k, sw) => {
    const defs = chart.svg.querySelector('defs').cloneNode(true), r = document.createElementNS(NS, 'rect');
    sw.append(defs);
    r.setAttribute('x', '6'); r.setAttribute('y', '1'); r.setAttribute('width', '16'); r.setAttribute('height', '12'); r.setAttribute('fill', chart.fill(k)); r.setAttribute('stroke', INK); r.setAttribute('stroke-width', '1');
    return r;
  };
}
function axes(c, v, W, H, L, R, T, B, cats, vertical = true) {
  const max = v.yMax, step = v.yStep;
  if (vertical) {
    const sy = n => T + (max - n) * (H - T - B) / max;
    for (let n = 0; n <= max + 1e-9; n += step) {
      c.add('line', {x1: L, x2: W - R, y1: sy(n), y2: sy(n), stroke: n ? GRID : INK, 'stroke-width': 1});
      c.add('text', {x: L - 8, y: sy(n) + 4, 'text-anchor': 'end'}, fmt(n));
    }
    c.add('line', {x1: L, x2: L, y1: T, y2: H - B, stroke: INK});
    c.add('text', {x: 14, y: (H - B + T) / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${(H - B + T) / 2})`}, v.yLabel);
    if (v.xLabel) c.add('text', {x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle'}, v.xLabel);
    return sy;
  }
  const sx = n => L + n * (W - L - R) / max;
  for (let n = 0; n <= max + 1e-9; n += step) {
    c.add('line', {y1: T, y2: H - B, x1: sx(n), x2: sx(n), stroke: n ? GRID : INK, 'stroke-width': 1});
    c.add('text', {x: sx(n), y: H - B + 18, 'text-anchor': 'middle'}, fmt(n));
  }
  c.add('text', {x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle'}, v.yLabel);
  return sx;
}
const fmt = n => Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
function wrapText(text, max) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/)) { if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  if (line) out.push(line); return out;
}
function multiline(c, text, x, y, max, size, attrs = {}) {
  const lines = wrapText(text, max), lh = size * 1.15, top = y - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => c.add('text', {x, y: top + i * lh + size * .35, 'text-anchor': 'middle', 'font-size': size, ...attrs}, l));
}

function line(v) {
  const W = 560, H = 320, L = 56, R = 18, T = 16, B = v.xLabel ? 58 : 44;
  const c = canvas(W, H, v.title + '. ' + v.series.map(s => s.name + ': ' + s.values.map((n, i) => v.x[i] + ' ' + n).join(', ')).join('. '));
  const sy = axes(c, v, W, H, L, R, T, B), sx = i => L + 14 + i * (W - L - R - 28) / (v.x.length - 1);
  v.x.forEach((label, i) => c.add('text', {x: sx(i), y: H - B + 20, 'text-anchor': 'middle'}, label));
  v.series.forEach((s, k) => {
    c.add('polyline', {points: s.values.map((n, i) => sx(i) + ',' + sy(n)).join(' '), fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': DASHES[k]});
    const g = c.add('g'); g.innerHTML = s.values.map((n, i) => markSvg(k, sx(i), sy(n))).join('');
  });
  return [c.svg, legend(v.series.map(s => s.name), null, 'line')];
}
function bar(v) {
  const n = v.x.length, m = v.series.length;
  if (v.horizontal) {
    const rowH = Math.max(28, m * 14 + 10), W = 560, L = 150, R = 20, T = 10, B = 40, H = T + B + n * rowH;
    const c = canvas(W, H, v.title + '. ' + v.series.map(s => s.name + ': ' + s.values.map((x, i) => v.x[i] + ' ' + x).join(', ')).join('. '));
    const sx = axes(c, v, W, H, L, R, T, B, v.x, false), bh = (rowH - 10) / m;
    v.x.forEach((label, i) => {
      const y0 = T + i * rowH + 5;
      multiline(c, label, L / 2 + 4, y0 + (rowH - 10) / 2, 22, 12);
      v.series.forEach((s, k) => c.add('rect', {x: L, y: y0 + k * bh, width: Math.max(0, sx(s.values[i]) - L), height: bh - 1, fill: c.fill(k), stroke: INK, 'stroke-width': 1}));
    });
    return [c.svg, m > 1 ? legend(v.series.map(s => s.name), swatchMaker(c)) : null];
  }
  const W = 560, H = 330, L = 56, R = 12, T = 16, B = v.xLabel ? 70 : 56;
  const c = canvas(W, H, v.title + '. ' + v.series.map(s => s.name + ': ' + s.values.map((x, i) => v.x[i] + ' ' + x).join(', ')).join('. '));
  const sy = axes(c, v, W, H, L, R, T, B), slot = (W - L - R) / n, bw = Math.min(34, (slot - 12) / m);
  v.x.forEach((label, i) => {
    const x0 = L + i * slot + (slot - bw * m) / 2;
    v.series.forEach((s, k) => c.add('rect', {x: x0 + k * bw, y: sy(s.values[i]), width: bw - 1, height: Math.max(0, sy(0) - sy(s.values[i])), fill: c.fill(k), stroke: INK, 'stroke-width': 1}));
    multiline(c, label, L + i * slot + slot / 2, H - B + 22, Math.max(8, Math.floor(slot / 7)), 12);
  });
  return [c.svg, m > 1 ? legend(v.series.map(s => s.name), swatchMaker(c)) : null];
}
function pie(v) {
  const k = v.charts.length, size = 230, W = size * k + 20 * (k - 1), H = size + 40;
  const c = canvas(W, H, v.title + '. ' + v.charts.map(ch => ch.label + ': ' + ch.slices.map(s => s.name + ' ' + s.value + '%').join(', ')).join('. '));
  const names = [...new Set(v.charts.flatMap(ch => ch.slices.map(s => s.name)))];
  v.charts.forEach((ch, j) => {
    const cx = j * (size + 20) + size / 2, cy = 24 + size / 2, r = 82, total = ch.slices.reduce((a, s) => a + s.value, 0);
    c.add('text', {x: cx, y: 16, 'text-anchor': 'middle', 'font-weight': 700}, ch.label);
    let a0 = -Math.PI / 2;
    ch.slices.forEach(s => {
      const a1 = a0 + 2 * Math.PI * s.value / total, large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (a, rr = r) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      c.add('path', {d: s.value >= total ? `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0` : `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large},1 ${x1},${y1} Z`, fill: c.fill(names.indexOf(s.name)), stroke: INK, 'stroke-width': 1});
      const [lx, ly] = p((a0 + a1) / 2, r + 16);
      c.add('text', {x: lx, y: ly + 4, 'text-anchor': 'middle', 'font-size': 12}, fmt(s.value) + '%');
      a0 = a1;
    });
  });
  return [c.svg, legend(names, swatchMaker(c))];
}
function table(v) {
  const wrap = html('div', undefined, 'tablewrap'), t = html('table', undefined, 'datatable'), head = t.createTHead().insertRow(), body = t.createTBody();
  v.head.forEach(h => { const th = html('th', h); th.scope = 'col'; head.append(th); });
  v.rows.forEach(row => { const tr = body.insertRow(); row.forEach((cell, i) => { if (i) tr.insertCell().textContent = cell; else { const th = html('th', cell); th.scope = 'row'; tr.append(th); } }); });
  wrap.append(t); return [wrap];
}
function process(v) {
  const steps = v.steps;
  if (v.cycle) {
    const W = 560, H = 440, cx = W / 2, cy = H / 2, rx = 200, ry = 160, bw = 128, bh = 56, n = steps.length;
    const c = canvas(W, H, v.title + '. A cycle: ' + steps.map((s, i) => (i + 1) + '. ' + s.label + (s.note ? ' (' + s.note + ')' : '')).join('; '));
    c.add('marker', {id: c.svg.querySelector('pattern').id.split('-')[0] + '-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'}, undefined, c.svg.querySelector('defs')).innerHTML = `<path d="M0,0 L10,5 L0,10 z" fill="${INK}"/>`;
    const arrow = `url(#${c.svg.querySelector('pattern').id.split('-')[0]}-arrow)`;
    const pos = i => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; };
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + 2 * Math.PI * (i + .5) / n - .22, a1 = a0 + .44;
      const [x0, y0] = [cx + (rx - 6) * Math.cos(a0), cy + (ry - 6) * Math.sin(a0)], [x1, y1] = [cx + (rx - 6) * Math.cos(a1), cy + (ry - 6) * Math.sin(a1)];
      c.add('path', {d: `M${x0},${y0} A${rx - 6},${ry - 6} 0 0,1 ${x1},${y1}`, fill: 'none', stroke: INK, 'stroke-width': 1.6, 'marker-end': arrow});
    }
    steps.forEach((s, i) => {
      const [x, y] = pos(i);
      c.add('rect', {x: x - bw / 2, y: y - bh / 2, width: bw, height: bh, rx: 6, fill: '#fff', stroke: INK, 'stroke-width': 1.4});
      multiline(c, s.label, x, y - (s.note ? 7 : 0), 18, 12);
      if (s.note) c.add('text', {x, y: y + bh / 2 - 8, 'text-anchor': 'middle', 'font-size': 10.5, 'font-style': 'italic'}, s.note);
    });
    if (v.centre) multiline(c, v.centre, cx, cy, 20, 13, {'font-weight': 700});
    return [c.svg];
  }
  const per = 4, rows = Math.ceil(steps.length / per), bw = 112, bh = 64, gx = 24, gy = 46, W = 560, padX = (W - (per * bw + (per - 1) * gx)) / 2, H = rows * bh + (rows - 1) * gy + 24;
  const c = canvas(W, H, v.title + '. Stages in order: ' + steps.map((s, i) => (i + 1) + '. ' + s.label + (s.note ? ' (' + s.note + ')' : '')).join('; '));
  const mid = c.svg.querySelector('pattern').id.split('-')[0] + '-arrow';
  c.add('marker', {id: mid, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'}, undefined, c.svg.querySelector('defs')).innerHTML = `<path d="M0,0 L10,5 L0,10 z" fill="${INK}"/>`;
  const place = i => { const r = Math.floor(i / per), col = i % per, cc = r % 2 ? per - 1 - col : col; return [padX + cc * (bw + gx), 12 + r * (bh + gy)]; };
  steps.forEach((s, i) => {
    const [x, y] = place(i);
    c.add('rect', {x, y, width: bw, height: bh, rx: 6, fill: i === 0 || i === steps.length - 1 ? '#eef0ea' : '#fff', stroke: INK, 'stroke-width': 1.4});
    c.add('text', {x: x + 9, y: y + 14, 'font-size': 10.5, 'font-weight': 700}, String(i + 1));
    multiline(c, s.label, x + bw / 2, y + bh / 2 - (s.note ? 6 : 0), 16, 11.5);
    if (s.note) c.add('text', {x: x + bw / 2, y: y + bh - 8, 'text-anchor': 'middle', 'font-size': 10, 'font-style': 'italic'}, s.note);
    if (i < steps.length - 1) {
      const [nx, ny] = place(i + 1);
      if (ny === y) { const right = nx > x; c.add('line', {x1: right ? x + bw + 2 : x - 2, y1: y + bh / 2, x2: right ? nx - 3 : nx + bw + 3, y2: y + bh / 2, stroke: INK, 'stroke-width': 1.6, 'marker-end': `url(#${mid})`}); }
      else c.add('line', {x1: x + bw / 2, y1: y + bh + 2, x2: nx + bw / 2, y2: ny - 3, stroke: INK, 'stroke-width': 1.6, 'marker-end': `url(#${mid})`});
    }
  });
  return [c.svg];
}
function map(v) {
  const k = v.maps.length, panel = k === 1 ? 420 : 300, gap = 18, W = panel * k + gap * (k - 1) + 4, H = panel + 30, fs = k === 1 ? 3 : 3.6;
  const c = canvas(W, H, v.title + '. ' + v.maps.map(m => m.label + ': ' + m.features.map(f => f.label).filter(Boolean).join(', ')).join('. '));
  v.maps.forEach((m, j) => {
    const g = c.add('g', {transform: `translate(${2 + j * (panel + gap)},26) scale(${panel / 100})`});
    c.add('text', {x: 2 + j * (panel + gap) + panel / 2, y: 17, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 14}, m.label);
    c.add('rect', {x: 0, y: 0, width: 100, height: 100, fill: '#fff', stroke: INK, 'stroke-width': .6}, undefined, g);
    const labelAt = (f, x, y) => { if (!f.label) return; const lines = wrapText(f.label, f.wrap || 14), lh = fs * 1.15, top = y - (lines.length - 1) * lh / 2; lines.forEach((l, i) => c.add('text', {x, y: top + i * lh + fs * .35, 'text-anchor': 'middle', 'font-size': fs, 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': fs * .25}, l, g)); };
    // The point halfway along a line, where its label goes.
    const middle = p => { const seg = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1])); let half = seg.reduce((a, b) => a + b, 0) / 2; for (let i = 0; i < seg.length; i++) { if (half <= seg[i]) { const t = seg[i] ? half / seg[i] : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t]; } half -= seg[i]; } return p[0]; };
    const lineLabel = f => { if (!f.label) return; const [mx, my] = middle(f.points); labelAt(f, f.lx ?? mx, f.ly ?? my); };
    const pts = p => p.map(q => q.join(',')).join(' ');
    const order = {area: 0, river: 1, road: 2, rail: 2, path: 3, building: 4, point: 5};
    [...m.features].sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9)).forEach(f => {
      if (f.type === 'area' || f.type === 'building') {
        const fillName = f.type === 'building' ? 'building' : f.fill;
        if (f.points) c.add('polygon', {points: pts(f.points), fill: c.areaFill(fillName), stroke: INK, 'stroke-width': .4}, undefined, g);
        else c.add('rect', {x: f.x, y: f.y, width: f.w, height: f.h, fill: c.areaFill(fillName), stroke: INK, 'stroke-width': f.type === 'building' ? .5 : .4, 'stroke-dasharray': f.dashed ? '1.5 1' : undefined}, undefined, g);
        const [lx, ly] = f.points ? [f.points.reduce((s, q) => s + q[0], 0) / f.points.length, f.points.reduce((s, q) => s + q[1], 0) / f.points.length] : [f.x + f.w / 2, f.y + f.h / 2];
        labelAt(f, f.lx ?? lx, f.ly ?? ly);
      } else if (f.type === 'road') {
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, undefined, g);
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, undefined, g);
        lineLabel(f);
      } else if (f.type === 'river') {
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: INK, 'stroke-width': f.width || 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, undefined, g);
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: '#e7eef2', 'stroke-width': (f.width || 6) - 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, undefined, g);
        lineLabel(f);
      } else if (f.type === 'rail') {
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: INK, 'stroke-width': .9}, undefined, g);
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-dasharray': '.5 2'}, undefined, g);
        lineLabel(f);
      } else if (f.type === 'path') {
        c.add('polyline', {points: pts(f.points), fill: 'none', stroke: INK, 'stroke-width': .7, 'stroke-dasharray': '1.6 1.2'}, undefined, g);
        lineLabel(f);
      } else if (f.type === 'point') {
        if (f.symbol === 'tree') c.add('circle', {cx: f.x, cy: f.y, r: 1.8, fill: '#fff', stroke: INK, 'stroke-width': .5}, undefined, g);
        else if (f.symbol === 'star') c.add('polygon', {points: `${f.x},${f.y - 2.2} ${f.x + .7},${f.y - .6} ${f.x + 2.2},${f.y - .5} ${f.x + 1},${f.y + .6} ${f.x + 1.4},${f.y + 2.2} ${f.x},${f.y + 1.3} ${f.x - 1.4},${f.y + 2.2} ${f.x - 1},${f.y + .6} ${f.x - 2.2},${f.y - .5} ${f.x - .7},${f.y - .6}`, fill: INK}, undefined, g);
        else c.add('circle', {cx: f.x, cy: f.y, r: 1.3, fill: INK}, undefined, g);
        if (f.label) labelAt(f, f.lx ?? f.x, f.ly ?? f.y + 4);
      }
    });
    // North arrow.
    c.add('path', {d: 'M93,11 L95,5 L97,11 L95,9.6 Z', fill: INK}, undefined, g);
    c.add('text', {x: 95, y: 4, 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 700}, 'N', g);
    if (m.scale) { c.add('line', {x1: 4, x2: 24, y1: 96, y2: 96, stroke: INK, 'stroke-width': .6}, undefined, g); c.add('text', {x: 14, y: 94.5, 'text-anchor': 'middle', 'font-size': fs * .9}, m.scale, g); }
  });
  return [c.svg];
}
function render(v) {
  const box = html('div', undefined, 'visual');
  const title = html('p'); title.append(html('strong', v.title)); box.append(title);
  const parts = v.kind === 'mixed' ? v.parts : [v];
  const row = html('div', undefined, v.kind === 'mixed' ? 'visual-parts' : 'visual-one');
  for (const part of parts) {
    const holder = html('div', undefined, 'visual-part');
    if (v.kind === 'mixed') { const sub = html('p'); sub.append(html('strong', part.title)); holder.append(sub); }
    const drawn = ({line, bar, pie, table, process, map})[part.kind]?.(part) || [html('p', 'This visual could not be shown.')];
    drawn.filter(Boolean).forEach(d => holder.append(d));
    if (part.source) holder.append(html('p', part.source, 'source'));
    row.append(holder);
  }
  box.append(row);
  return box;
}
window.TELWVisual = {render};
})();

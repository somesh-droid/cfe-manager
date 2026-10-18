/* ===================== VIDEO DEMO: 100-second scripted walkthrough for screen recording ===================== */
const NAT = {
  customer: { id: 'MH-DC-01', name: 'Hyperscaler A', place: 'Navi Mumbai', state: 'MH', mw: 100 },
  assets: [
    { id: 'RJ-SOL-01', name: 'Bhadla Solar', state: 'RJ', type: 'solar', mw: 180, loss: 3.9 },
    { id: 'GJ-SOL-02', name: 'Kutch Solar', state: 'GJ', type: 'solar', mw: 120, loss: 3.1 },
    { id: 'KA-SOL-03', name: 'Koppal Solar', state: 'KA', type: 'solar', mw: 120, loss: 3.6 },
    { id: 'GJ-WND-04', name: 'Kutch Wind', state: 'GJ', type: 'wind', mw: 30, loss: 3.1 },
    { id: 'TN-WND-05', name: 'Tirunelveli Wind', state: 'TN', type: 'wind', mw: 60, loss: 4.4 },
    { id: 'KA-BES-06', name: 'Koppal Storage', state: 'KA', type: 'bess', mw: 150, mwh: 600, loss: 3.6 },
    { id: 'MH-BES-07', name: 'Navi Mumbai Storage', state: 'MH', type: 'bess', mw: 100, mwh: 400, loss: 1.2 }
  ],
  day: 13, tripFrom: 13 * 96 + 90, tripTo: 14 * 96 + 24
};
const TYPE_COL = { solar: 'var(--solar)', wind: 'var(--wind)', bess: 'var(--bess)', mkt: 'var(--mkt)', grid: 'var(--grid)' };
let NR = null;
const B96 = 96;
const INC = [
  { k: 'windLull', ev: { k: 'windLull', from: 5 * B96 + 72, to: 6 * B96 + 24, factor: 0.35 }, name: 'Wind lull', when: 'Night of 6 Oct', what: 'Wind −65% overnight', did: 'Storage brought forward; intraday green blocks' },
  { k: 'bessPartial', ev: { k: 'bessPartial', from: 13 * B96 + 90, to: 14 * B96 + 24, f: 0.6 }, name: 'Battery trip', when: 'Night of 14 Oct', what: 'Koppal storage, 60% offline', did: 'Maharashtra storage to full output; schedule revised' },
  { k: 'solarDown', ev: { k: 'solarDown', from: 20 * B96 + 36, to: 20 * B96 + 64, factor: 0.5 }, name: 'Cloudy day', when: '21 Oct', what: 'Solar −50%, 09:00–16:00', did: 'Charge target lowered; gap bought on IEX' },
  { k: 'mktSpike', ev: { k: 'mktSpike', from: 26 * B96 + 72, to: 26 * B96 + 96 }, name: 'Exchange doesn’t clear', tag: 'IEX no-clear', when: '27 Oct', what: 'No green blocks within bid limit', did: 'No bid above mandate; grid counted at zero' }
];
const GUARD = 1.5; // month guard: exchange bid volume ×1.5 on the days after an incident, until the next one
function natRun() {
  if (NR) return NR;
  const cfg = { ...SIM.REF }, q = SIM.DT;
  const evs = INC.map(x => x.ev), starts = INC.map(x => Math.floor(x.ev.from / B96) + 1);
  const guard = starts.map((d, j) => ({ k: 'catchUp', from: d * B96, to: (starts[j + 1] || SIM.DAYS) * B96, factor: GUARD }));
  const R1 = SIM.run(P, cfg, [...evs, ...guard]), Rn = SIM.run(P, cfg, evs), R0n = SIM.run(P, cfg, []);
  const daily = Rx => { const o = []; for (let d = 0; d < SIM.DAYS; d++) { let L = 0, c = 0; for (let i = d * B96; i < d * B96 + B96; i++) { const x = Rx.blocks[i]; L += x.L; c += x.solarDir + x.windDir + x.disElig + x.mkt; } o.push(c / L); } return o; };
  const cum = Rx => { const o = []; let L = 0, c = 0; for (let d = 0; d < SIM.DAYS; d++) { for (let i = d * B96; i < d * B96 + B96; i++) { const x = Rx.blocks[i]; L += x.L; c += x.solarDir + x.windDir + x.disElig + x.mkt; } o.push(c / L); } return o; };
  let extra = 0; for (let i = 0; i < SIM.NB; i++) extra += (R1.blocks[i].mkt - Rn.blocks[i].mkt) * q;
  const d0 = daily(R0n), dn = daily(Rn);
  INC.forEach(x => { const a = Math.floor(x.ev.from / B96), b = Math.min(SIM.DAYS - 1, Math.floor((x.ev.to - 1) / B96)); let best = a, drop = -1; for (let d = a; d <= b; d++) if (d0[d] - dn[d] > drop) { drop = d0[d] - dn[d]; best = d; } x.day = best; });
  let gdam = 0; for (let i = NAT.day * B96; i < NAT.day * B96 + B96; i++) gdam += R0n.blocks[i].mkt * q;
  NR = { cfg, R1, Rn, R0n, daily: daily(R1), cum1: cum(R1), cumN: cum(Rn), extra, gdam, load: R1.M.load };
  return NR;
}
/* per-asset MW in a block */
function assetFlows(b) {
  const tripped = b.stranded > 0;
  const out = {};
  NAT.assets.forEach(a => {
    if (a.type === 'solar') out[a.id] = b.solarDir * a.mw / 420;
    else if (a.type === 'wind') out[a.id] = b.windDir * a.mw / 90;
    else out[a.id] = tripped ? (a.state === 'MH' ? b.dis : 0) : b.dis * a.mw / 250;
  });
  out.IEX = b.mkt; out.GRID = b.gridToLoad + b.dis - b.disElig;
  return out;
}

/* ---------- national map (schematic tiles) ---------- */
const NT = { tw: 104, th: 84, gx: 8, ox: 14, oy: 14 };
const tileXY = st => { const t = TILES.find(x => x[0] === st); return [NT.ox + t[2] * (NT.tw + NT.gx), NT.oy + t[3] * (NT.th + NT.gx)]; };
const NODE_OFF = { 'GJ-SOL-02': [28, 40], 'GJ-WND-04': [76, 40], 'KA-SOL-03': [28, 40], 'KA-BES-06': [76, 40], 'RJ-SOL-01': [52, 40], 'TN-WND-05': [52, 40], 'MH-BES-07': [52, 40] };
function nodeXY(a) { const [x, y] = tileXY(a.state), o = NODE_OFF[a.id]; return [x + o[0], y + o[1]]; }
/* the customer sits on the coast, in the empty cell west of the Maharashtra tile */
function custXY() { const [x, y] = tileXY('MH'); return [x - NT.gx - NT.tw / 2 - 6, y + NT.th / 2]; }
function natMap(b, o = {}) {
  const W = NT.ox * 2 + 8 * (NT.tw + NT.gx), H = NT.oy * 2 + 8 * (NT.th + NT.gx);
  const fl = b ? assetFlows(b) : {};
  const [cx, cy] = custXY();
  let g = '';
  TILES.filter(t => t[2] <= 3 && t[3] >= 2).forEach(([c, n, x, y]) => {
    const px = NT.ox + x * (NT.tw + NT.gx), py = NT.oy + y * (NT.th + NT.gx);
    const used = NAT.assets.some(a => a.state === c) || c === 'MH';
    g += `<rect x="${px}" y="${py}" width="${NT.tw}" height="${NT.th}" rx="10" fill="${used ? '#E6EDF6' : 'var(--panel-3)'}" stroke="${used ? '#B9CBE2' : 'none'}"/><text x="${px + 8}" y="${py + 16}" style="font-family:var(--f-body);font-size:11px;font-weight:600;fill:${used ? 'var(--ink-2)' : 'var(--faint)'}">${n.length > 13 ? c : n}</text>`;
  });
  NAT.assets.forEach(a => {
    const [x, y] = nodeXY(a), mw = fl[a.id] || 0, on = mw > 0.5, tripped = o.trip && a.id === 'KA-BES-06';
    const mx = (x + cx) / 2 + (y > cy ? 30 : y < cy - 20 ? 30 : 0), my = (y + cy) / 2 + (Math.abs(y - cy) < 20 ? -30 : 0);
    if (b) g += `<path d="M${x},${y} Q${mx},${my} ${cx + 46},${cy}" fill="none" stroke="${tripped ? 'var(--crit)' : on ? TYPE_COL[a.type] : '#C9D3DD'}" stroke-width="${on ? Math.min(11, 2 + mw / 9) : 1.5}" ${on ? 'class="flow anim"' : `stroke-dasharray="${tripped ? '4 5' : '2 5'}"`} opacity="${on ? .95 : .8}"/>`;
  });
  NAT.assets.forEach((a, k) => {
    const [x, y] = nodeXY(a), tripped = o.trip && a.id === 'KA-BES-06', mw = fl[a.id] || 0;
    const lab = tripped ? 'TRIPPED' : a.name.split(' ').slice(-1)[0];
    g += `<g class="rv" data-at="${o.reveal ? o.reveal + k * 0.9 : 0}"><circle cx="${x}" cy="${y}" r="${tripped ? 14 : 12}" fill="${tripped ? 'var(--crit)' : TYPE_COL[a.type]}" stroke="#fff" stroke-width="3"/>${tripped ? `<circle cx="${x}" cy="${y}" r="14" fill="none" stroke="var(--crit)" stroke-width="3" class="ping"/>` : ''}<text x="${x}" y="${y + 27}" text-anchor="middle" style="font-family:var(--f-body);font-size:10.5px;font-weight:600;paint-order:stroke;stroke:#E6EDF6;stroke-width:4px;fill:${tripped ? 'var(--crit)' : 'var(--ink-2)'}">${lab}</text>${b && !tripped ? `<text x="${x}" y="${y + 40}" text-anchor="middle" style="font-family:var(--f-mono);font-size:11px;font-weight:700;paint-order:stroke;stroke:#E6EDF6;stroke-width:4px;fill:${mw > 0.5 ? 'var(--ink)' : 'var(--faint)'}">${f0(mw)} MW</text>` : ''}</g>`;
  });
  g += `<g class="rv" data-at="${o.custAt || 0}"><rect x="${cx - 46}" y="${cy - 30}" width="92" height="60" rx="12" fill="var(--brand)"/><text x="${cx}" y="${cy - 6}" text-anchor="middle" style="font-family:var(--f-body);font-size:12px;font-weight:700;fill:#fff">Navi Mumbai</text><text x="${cx}" y="${cy + 12}" text-anchor="middle" style="font-family:var(--f-mono);font-size:11px;fill:#CFE0F2">${b ? f0(b.L) : 100} MW load</text></g>`;
  const [mx0, my0] = tileXY('MP'), [tx0, ty0] = tileXY('GA');
  if (b && fl.IEX > 0.5) g += `<g><path d="M${mx0 + 40},${my0 + 50} Q${cx + 60},${cy - 70} ${cx + 10},${cy - 30}" fill="none" stroke="var(--mkt)" stroke-width="${2 + fl.IEX / 9}" class="flow anim"/><rect x="${mx0 - 4}" y="${my0 + 26}" width="120" height="34" rx="10" fill="#fff" stroke="var(--mkt)" stroke-width="2"/><text x="${mx0 + 56}" y="${my0 + 48}" text-anchor="middle" style="font-family:var(--f-body);font-size:12px;font-weight:600;fill:var(--ink)">IEX blocks ${f0(fl.IEX)} MW</text></g>`;
  if (b && fl.GRID > 0.5) g += `<g><path d="M${cx},${cy + 30} Q${cx - 10},${cy + 60} ${tx0 + 52},${ty0 + 40}" fill="none" stroke="var(--grid)" stroke-width="${2 + fl.GRID / 9}" class="flow anim"/><rect x="${tx0 - 12}" y="${ty0 + 30}" width="128" height="34" rx="10" fill="#fff" stroke="var(--grid)" stroke-width="2"/><text x="${tx0 + 52}" y="${ty0 + 52}" text-anchor="middle" style="font-family:var(--f-body);font-size:12px;font-weight:600;fill:var(--ink)">Grid ${f0(fl.GRID)} MW · 0%</text></g>`;
  const vy = NT.oy + 2 * (NT.th + NT.gx) - 10, vw = NT.ox * 2 + 4 * (NT.tw + NT.gx), vh = 6 * (NT.th + NT.gx) + 20;
  return `<svg viewBox="0 ${vy} ${vw} ${vh}" role="img" aria-label="Contracted supply across India flowing to the customer">${g}</svg>`;
}

/* ---------- day-ahead schedule chart ---------- */
function planChart(R0n) {
  const d = NAT.day, bs = R0n.blocks.slice(d * 96, d * 96 + 96), W = 820, H = 330, ml = 44, mr = 10, mt = 14, mb = 28, pw = W - ml - mr, ph = H - mt - mb;
  const lay = [['solarDir', 'var(--solar)'], ['windDir', 'var(--wind)'], ['disElig', 'var(--bess)'], ['mkt', 'var(--mkt)'], ['gridToLoad', 'var(--grid)']];
  const top = 150, x = i => ml + i * pw / 96, y = v => mt + ph * (1 - v / top);
  let g = '', acc = new Array(96).fill(0);
  [0, 50, 100, 150].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end" style="font-size:11px">${v}</text>`);
  lay.forEach(([k, c]) => { const hi = acc.map((a, i) => a + bs[i][k]); let p = `M${x(0)},${y(hi[0])}`; for (let i = 0; i < 96; i++) p += ` L${x(i)},${y(hi[i])} L${x(i + 1)},${y(hi[i])}`; for (let i = 95; i >= 0; i--) p += ` L${x(i + 1)},${y(acc[i])} L${x(i)},${y(acc[i])}`; g += `<path d="${p} Z" fill="${c}"/>`; acc = hi; });
  g += `<path d="${bs.map((b, i) => `${i ? 'L' : 'M'}${x(i)},${y(b.L)} L${x(i + 1)},${y(b.L)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2.4"/>`;
  for (let h = 0; h <= 24; h += 6) g += `<text x="${x(h * 4)}" y="${H - 8}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}" style="font-size:11px">${String(h).padStart(2, '0')}:00</text>`;
  g += `<rect class="sweep" x="${ml}" y="${mt}" width="${pw}" height="${ph}" fill="var(--panel)"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tomorrow's schedule by source">${g}</svg>`;
}

/* ---------- national operations console (video): sources → engine → customer, plus three live charts ---------- */
const NC_W0 = 13 * 96 + 48, NC_N = 96; // chart window: 12:00 on 14 Oct → 12:00 on 15 Oct
const ncTime = i => blkTime(i % 96);
function ncSources(b, trip) {
  const fl = assetFlows(b), ka = trip && b.stranded > 0;
  const rows = NAT.assets.map(a => {
    const st = TILES.find(t => t[0] === a.state)[1], tripped = ka && a.id === 'KA-BES-06';
    const chg = a.type === 'bess' && b.chg > 0.5 ? b.chg * a.mw / 250 * (ka ? (a.state === 'MH' ? 250 / a.mw : 0) : 1) : 0;
    return { k: a.id, name: a.name, sub: st + ' · ' + (a.type === 'bess' ? a.mw + ' MW / ' + a.mwh + ' MWh' : a.type + ' ' + a.mw + ' MW'), col: TYPE_COL[a.type], mw: fl[a.id] || 0, chg, tripped };
  });
  rows.push({ k: 'IEX', name: 'IEX green blocks', sub: 'via our trading member', col: 'var(--mkt)', mw: fl.IEX, backup: true });
  rows.push({ k: 'GRID', name: 'DISCOM grid', sub: 'MSEDCL · counts 0%', col: 'var(--grid)', mw: fl.GRID, backup: true });
  return rows;
}
function ncFlowSVG(b, trip) {
  const rows = ncSources(b, trip), W = 1380, H = 545, cw = 360, rh = 50, gap = 6;
  const ry = k => 8 + k * (rh + gap) + (k >= 7 ? 26 : 0);
  const hx = 600, hy = 125, hw = 250, hh = 280, cx = 1030, cy = 105, cW = 340, cH = 320;
  const clean = b.solarDir + b.windDir + b.disElig + b.mkt, grid = b.gridToLoad + b.dis - b.disElig, share = clean / b.L;
  let g = '', tot = rows.reduce((a, r) => a + (r.mw > 0.5 ? 1 : 0), 0), slot = 0;
  // flows: sources → engine
  rows.forEach((r, k) => {
    const y1 = ry(k) + rh / 2, on = r.mw > 0.5, y2 = hy + 40 + (on ? (slot++ + .5) * (hh - 80) / Math.max(1, tot) : hh / 2);
    const w = on ? Math.max(2.5, Math.min(26, r.mw / 3.6)) : 1.4;
    g += `<path d="M${cw},${y1} C${cw + 130},${y1} ${hx - 120},${y2} ${hx},${y2}" fill="none" stroke="${r.tripped ? 'var(--crit)' : on ? r.col : '#CDD5DD'}" stroke-width="${w}" ${on ? 'class="flow anim"' : `stroke-dasharray="${r.tripped ? '5 6' : '2 6'}"`} opacity="${on ? .9 : .9}"/>`;
  });
  // engine → customer
  const ccy = cy + cH / 2, wc = Math.max(3, clean / 3.6), wg = grid / 3.6;
  g += `<path d="M${hx + hw},${ccy - (wg > 1 ? wg / 2 + 4 : 0)} L${cx},${ccy - (wg > 1 ? wg / 2 + 4 : 0)}" stroke="var(--good)" stroke-width="${wc}" class="flow anim" fill="none"/>`;
  if (wg > 1) g += `<path d="M${hx + hw},${ccy + wc / 2 + 4} L${cx},${ccy + wc / 2 + 4}" stroke="var(--grid)" stroke-width="${wg}" class="flow anim" fill="none"/>`;
  g += `<text x="${(hx + hw + cx) / 2}" y="${ccy - Math.max(wc, 8) / 2 - (wg > 1 ? wg / 2 + 14 : 12)}" text-anchor="middle" style="font:600 15px var(--f-mono);fill:var(--good)">${f0(clean)} MW clean</text>`;
  if (wg > 1) g += `<text x="${(hx + hw + cx) / 2}" y="${ccy + wc / 2 + wg + 26}" text-anchor="middle" style="font:600 15px var(--f-mono);fill:var(--muted)">${f0(grid)} MW grid · 0%</text>`;
  // source cards
  g += `<text x="0" y="${ry(7) - 10}" style="font:600 12px var(--f-mono);letter-spacing:.08em;fill:var(--muted)">BACKUP</text>`;
  rows.forEach((r, k) => {
    const y = ry(k), on = r.mw > 0.5;
    g += `<g><rect x="0" y="${y}" width="${cw}" height="${rh}" rx="10" fill="${r.tripped ? 'var(--crit-bg)' : '#fff'}" stroke="${r.tripped ? 'var(--crit)' : 'var(--line)'}" stroke-width="${r.tripped ? 2 : 1}"/><rect x="0" y="${y}" width="7" height="${rh}" rx="3" fill="${r.tripped ? 'var(--crit)' : r.col}"/>
      <text x="20" y="${y + 21}" style="font:600 16px var(--f-body);fill:var(--ink)">${r.name}</text><text x="20" y="${y + 39}" style="font:400 13px var(--f-body);fill:var(--muted)">${r.sub}</text>
      <text x="${cw - 14}" y="${y + 32}" text-anchor="end" style="font:700 ${r.tripped ? 15 : 22}px var(--f-mono);fill:${r.tripped ? 'var(--crit)' : on ? 'var(--ink)' : 'var(--faint)'}">${r.tripped ? 'TRIPPED' : r.chg > 0.5 && !on ? '↓' + f0(r.chg) + ' in' : f0(r.mw) + ' MW'}</text></g>`;
  });
  // engine
  g += `<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="16" fill="var(--brand)"/>
    <text x="${hx + 22}" y="${hy + 38}" style="font:700 22px var(--f-display);fill:#fff">CFE Manager</text>
    <text x="${hx + 22}" y="${hy + 62}" style="font:500 13px var(--f-mono);fill:#B9CDE4">BLOCK ${ncTime(b.i)}–${ncTime(b.i + 1)}</text>
    ${[['1  Solar + wind', b.solarDir + b.windDir], ['2  Storage', b.disElig], ['3  IEX green blocks', b.mkt], ['4  Grid (counts 0%)', grid]].map(([t, v], j) => `<text x="${hx + 22}" y="${hy + 104 + j * 30}" style="font:${v > 0.5 ? 700 : 400} 16px var(--f-body);fill:${v > 0.5 ? '#FFFFFF' : '#7F98B5'}">${t}${v > 0.5 ? '  ·  ' + f0(v) : ''}</text>`).join('')}
    <text x="${hx + 22}" y="${hy + hh - 20}" style="font:400 12.5px var(--f-body);fill:#B9CDE4">merit order · losses per corridor</text>`;
  // customer
  const segs = [[b.solarDir + b.windDir, 'var(--wind)'], [b.disElig, 'var(--bess)'], [b.mkt, 'var(--mkt)'], [grid, 'var(--grid)']];
  let sx = cx + 24; const bw = cW - 48;
  g += `<rect x="${cx}" y="${cy}" width="${cW}" height="${cH}" rx="16" fill="#fff" stroke="var(--brand)" stroke-width="2.5"/>
    <text x="${cx + 24}" y="${cy + 38}" style="font:700 22px var(--f-display);fill:var(--ink)">Navi Mumbai data centre</text>
    <text x="${cx + 24}" y="${cy + 62}" style="font:400 14px var(--f-body);fill:var(--muted)">Hyperscaler A · Maharashtra · CFE90</text>
    <text x="${cx + 24}" y="${cy + 112}" style="font:500 14px var(--f-body);fill:var(--muted)">Demand this block</text>
    <text x="${cx + 24}" y="${cy + 160}" style="font:700 48px var(--f-display);fill:var(--ink)">${f0(b.L)} MW</text>
    <text x="${cx + 24}" y="${cy + 204}" style="font:500 14px var(--f-body);fill:var(--muted)">Clean this block</text>
    <text x="${cx + cW - 24}" y="${cy + 204}" text-anchor="end" style="font:700 24px var(--f-mono);fill:${share >= .9 ? 'var(--good)' : 'var(--crit)'}">${pc(share, 0)}</text>`;
  segs.forEach(([v, c]) => { const w = v / b.L * bw; if (w > 0.5) g += `<rect x="${sx}" y="${cy + 222}" width="${w}" height="26" fill="${c}"/>`; sx += w; });
  g += `<text x="${cx + 24}" y="${cy + 280}" style="font:400 12.5px var(--f-body);fill:var(--muted)">wind/solar · storage · IEX · grid</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Live flows from contracted suppliers through the dispatch engine to the customer">${g}</svg>`;
}
function ncDayChart(Rx, cur) {
  const W = 440, H = 210, ml = 34, mr = 8, mt = 10, mb = 24, pw = W - ml - mr, ph = H - mt - mb, top = 150;
  const x = j => ml + j * pw / NC_N, y = v => mt + ph * (1 - v / top), n = Math.min(NC_N, cur - NC_W0 + 1), bs = Rx.blocks.slice(NC_W0, NC_W0 + NC_N);
  let g = '', acc = new Array(n).fill(0);
  [0, 50, 100, 150].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 5}" y="${y(v) + 4}" text-anchor="end" style="font-size:11px">${v}</text>`);
  [['solarDir', 'var(--solar)'], ['windDir', 'var(--wind)'], ['disElig', 'var(--bess)'], ['mkt', 'var(--mkt)'], ['gridToLoad', 'var(--grid)']].forEach(([k, c]) => {
    const hi = acc.map((a, j) => a + bs[j][k] + (k === 'gridToLoad' ? bs[j].dis - bs[j].disElig : 0)); if (!n) return;
    let p = `M${x(0)},${y(hi[0])}`; for (let j = 0; j < n; j++) p += ` L${x(j)},${y(hi[j])} L${x(j + 1)},${y(hi[j])}`; for (let j = n - 1; j >= 0; j--) p += ` L${x(j + 1)},${y(acc[j])} L${x(j)},${y(acc[j])}`;
    g += `<path d="${p} Z" fill="${c}"/>`; acc = hi; });
  g += `<path d="${bs.map((b, j) => `${j ? 'L' : 'M'}${x(j)},${y(b.L)} L${x(j + 1)},${y(b.L)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.8" ${''}/>`;
  g += `<line x1="${x(n)}" x2="${x(n)}" y1="${mt}" y2="${mt + ph}" stroke="var(--brand)" stroke-width="2"/>`;
  ['12:00', '18:00', '00:00', '06:00', '12:00'].forEach((t, j) => g += `<text x="${x(j * 24)}" y="${H - 6}" text-anchor="${j === 0 ? 'start' : j === 4 ? 'end' : 'middle'}" style="font-size:11px">${t}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>`;
}
function ncStoreChart(Rx, cur) {
  const W = 440, H = 210, ml = 34, mr = 8, mt = 10, mb = 24, pw = W - ml - mr, ph = H - mt - mb, top = 600;
  const x = j => ml + j * pw / NC_N, y = v => mt + ph * (1 - v / top), n = Math.min(NC_N, cur - NC_W0 + 1);
  const ka = [], mh = [];
  for (let j = 0; j < n; j++) { const b = Rx.blocks[NC_W0 + j]; if (b.stranded > 0) { ka.push(b.stranded); mh.push(b.soc); } else { ka.push(b.soc * .6); mh.push(b.soc * .4); } }
  let g = '';
  [0, 300, 600].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 5}" y="${y(v) + 4}" text-anchor="end" style="font-size:11px">${v}</text>`);
  const line = (arr, c, dashFrom) => { let a = '', bq = ''; arr.forEach((v, j) => { const pt = `${j ? 'L' : 'M'}${x(j + .5)},${y(v)}`; if (dashFrom !== null && j >= dashFrom) bq += (bq ? 'L' : 'M') + `${x(j + .5)},${y(v)}`; else a += pt; }); return `<path d="${a}" fill="none" stroke="${c}" stroke-width="2.6"/>` + (bq ? `<path d="${bq}" fill="none" stroke="var(--crit)" stroke-width="2.6" stroke-dasharray="5 5"/>` : ''); };
  const tripJ = NAT.tripFrom - NC_W0;
  g += line(ka, 'var(--bess)', n > tripJ && Rx.blocks[NAT.tripFrom].stranded > 0 ? tripJ : null) + line(mh, '#A18BE0', null);
  if (n) { g += `<text x="${x(n) + 4}" y="${y(ka[n - 1]) - 6}" style="font:600 11px var(--f-body);fill:${Rx.blocks[NC_W0 + n - 1].stranded > 0 ? 'var(--crit)' : 'var(--bess)'}">KA</text><text x="${x(n) + 4}" y="${y(mh[n - 1]) + 14}" style="font:600 11px var(--f-body);fill:#7E66CF">MH</text>`; }
  g += `<line x1="${x(n)}" x2="${x(n)}" y1="${mt}" y2="${mt + ph}" stroke="var(--brand)" stroke-width="2"/>`;
  ['12:00', '18:00', '00:00', '06:00', '12:00'].forEach((t, j) => g += `<text x="${x(j * 24)}" y="${H - 6}" text-anchor="${j === 0 ? 'start' : j === 4 ? 'end' : 'middle'}" style="font-size:11px">${t}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>`;
}
function ncNight(Rx, cur) {
  let L = 0, c = 0; const a = NC_W0 + 42; // from 22:30
  for (let i = a; i <= cur; i++) { const b = Rx.blocks[i]; L += b.L; c += b.solarDir + b.windDir + b.disElig + b.mkt; }
  return L ? c / L : null;
}
function ncMonth(Rx) { return Rx.M.scoreComplete; }
function natConsole(Rx, cur, trip) {
  const b = Rx.blocks[cur];
  return `<div class="nc-flow">${ncFlowSVG(b, trip)}</div>
    <div class="nc-charts">
      <div class="nc-card"><div class="nc-ch"><b>Demand vs supply</b><span>MW · 14–15 Oct</span></div>${ncDayChart(Rx, cur)}</div>
      <div class="nc-card"><div class="nc-ch"><b>Storage energy</b><span>MWh · Karnataka, Maharashtra</span></div>${ncStoreChart(Rx, cur)}</div>
      <div class="nc-card nc-kpi"><div class="nc-ch"><b>Scorecard</b><span>live</span></div>
        <div><span>Clean this block</span><b style="color:${(b.solarDir + b.windDir + b.disElig + b.mkt) / b.L >= .9 ? 'var(--good)' : 'var(--crit)'}">${pc((b.solarDir + b.windDir + b.disElig + b.mkt) / b.L, 0)}</b></div>
        <div><span>Usable storage left</span><b>${f0(Math.max(0, b.soc - NR.cfg.bessMWh * 0.1 * (b.stranded > 0 ? 0.4 : 1)))} MWh</b></div>
        <div><span>Month forecast vs CFE90</span><b style="color:var(--good)">${pc(ncMonth(Rx))}</b></div></div>
    </div>`;
}

/* ---------- month view: calendar of daily clean share + running month score ---------- */
function monthCal(o = {}) {
  const N = natRun(), first = 3; // 1 Oct 2026 is a Thursday (Mon = 0)
  const incOf = d => INC.find(x => x.day === d);
  let h = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => `<div class="mc-wd">${w}</div>`).join('') + '<div></div>'.repeat(first);
  N.daily.forEach((v, d) => {
    const inc = incOf(d), k = INC.indexOf(inc), cls = v >= 0.9 ? 'g' : v >= 0.8 ? 'a' : 'r';
    const at = (o.tileAt || 0) + d * (o.tileStep ?? 0.05);
    h += `<div class="mc-day ${cls} rv" data-at="${at.toFixed(2)}"><span class="n">${d + 1}</span><b>${Math.round(v * 100)}%</b>${inc ? `<span class="mc-inc rv" data-at="${(o.incAt ? o.incAt[k] : 0).toFixed(2)}">${inc.tag || inc.name}</span>` : ''}</div>`;
  });
  return `<div class="mc">${h}</div>`;
}
function monthScoreSVG(o = {}) {
  const N = natRun(), W = 1300, H = 250, ml = 56, mr = 150, mt = 14, mb = 30, pw = W - ml - mr, ph = H - mt - mb, lo = 0.86, hi = 0.93;
  const x = d => ml + (d + 0.5) * pw / SIM.DAYS, y = v => mt + ph * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo));
  const path = a => a.map((v, d) => `${d ? 'L' : 'M'}${x(d).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  let g = '';
  [0.86, 0.88, 0.9, 0.92].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0.9 ? 'var(--crit)' : 'var(--line-2)'}" ${v === 0.9 ? 'stroke-dasharray="7 5" stroke-width="1.6"' : ''}/><text x="${ml - 8}" y="${y(v) + 5}" text-anchor="end" style="font-size:13px">${Math.round(v * 100)}%</text>`);
  g += `<text x="${ml + 6}" y="${y(0.9) - 7}" style="font:600 13px var(--f-body);fill:var(--crit)">CFE90 target</text>`;
  [1, 8, 15, 22, 29].forEach(d => g += `<text x="${x(d - 1)}" y="${H - 8}" text-anchor="middle" style="font-size:12px">${d} Oct</text>`);
  INC.forEach(i => g += `<line x1="${x(i.day)}" x2="${x(i.day)}" y1="${mt}" y2="${mt + ph}" stroke="var(--crit)" stroke-opacity=".25" stroke-width="10"/>`);
  const nE = N.cumN[SIM.DAYS - 1], gE = N.cum1[SIM.DAYS - 1];
  g += `<defs><clipPath id="mcA"><rect class="growx" style="animation-delay:${o.aAt || 0}s;animation-duration:${o.dur || 3}s" x="${ml}" y="0" width="${pw + mr}" height="${H}"/></clipPath><clipPath id="mcB"><rect class="growx" style="animation-delay:${o.bAt || 0}s;animation-duration:${o.dur || 3}s" x="${ml}" y="0" width="${pw + mr}" height="${H}"/></clipPath></defs>`;
  g += `<g clip-path="url(#mcA)"><path d="${path(N.cumN)}" fill="none" stroke="var(--grid)" stroke-width="3" stroke-dasharray="8 6"/><circle cx="${x(30)}" cy="${y(nE)}" r="5" fill="var(--grid)"/><text x="${x(30) + 12}" y="${y(nE) + 20}" style="font:700 17px var(--f-mono);fill:var(--muted)">${pc(nE)}</text></g>`;
  g += `<g clip-path="url(#mcB)"><path d="${path(N.cum1)}" fill="none" stroke="var(--brand)" stroke-width="4"/><circle cx="${x(30)}" cy="${y(gE)}" r="6" fill="var(--brand)"/><text x="${x(30) + 12}" y="${y(gE) - 4}" style="font:700 19px var(--f-mono);fill:var(--brand)">${pc(gE)}</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Month-to-date score with and without the month guard">${g}</svg>`;
}

/* ---------- beats ---------- */
const BEATS = [
  { at: 0, end: 9, ch: 'October', render: () => {
    const N = natRun();
    return `<div class="rv-split mwide"><div class="rv-calwrap">${monthCal({ tileAt: 0.1, tileStep: 0.025, incAt: [2.3, 1.3, 3.1, 3.6] })}</div><div class="rv-side">
      <div class="rv-kicker rv" data-at="0.2">One month · 31 days · 2,976 blocks</div>
      <h1 class="rv-h rv" data-at="1">Four things break.</h1>
      <div class="rv-hero rv" data-at="4.2"><b>${pc(N.R1.M.scoreComplete)}</b><span>clean, hour by hour, for a Mumbai data centre</span></div>
      <h2 class="rv-sub rv" data-at="5.6">And every clean hour can be proved.</h2></div></div>`; }, cap: [[0.5, 'One month, four incidents'], [6.5, 'Here’s how']] },
  { at: 9, end: 23, ch: 'The platform', render: () => {
    const shots = [['Five doors: one operations console and a portal for every stakeholder', () => V.home()],
      ['Suppliers clear six automatic checks', () => { state.sw = { step: 4, f: { ...SW_PRESETS.bhuj }, gates: null, value: null }; return V.s_onboard().replace(/Inside Gujarat boundary/g, 'Delivery path to customer state').replace('Same-state rule for hourly matching', 'Inter-state corridor (GNA) is schedulable'); }],
      ['Customers see their real hourly gap', () => { state.cw = { step: 2, f: { ...CW_PRESET }, diag: null, prop: null, tierPick: 90 }; cwAdvance(); return V.c_onboard(); }],
      ['Reliance runs it from one console', () => { clearEvents(); state.day = 13; state.block = 84; return V.control(); }]];
    return `<div class="rv-shots">${shots.map(([c, f], k) => `<div class="rv-shot rv" data-at="${k * 3.5}" data-until="${k === 3 ? 99 : (k + 1) * 3.5 + 0.7}"><div class="rv-frame"><div class="rv-inner"><div class="page">${f()}</div></div></div></div>`).join('')}</div>`; },
    cap: [[0, 'One operations console, a portal for every stakeholder'], [3.5, 'Suppliers clear six automatic checks'], [7, 'Customers see their real hourly gap'], [10.5, 'Reliance runs it all from one console']] },
  { at: 23, end: 33, ch: 'The setting', render: () => {
    const N = natRun();
    return `<div class="rv-split"><div class="rv-map">${natMap(null, { reveal: 2.2, custAt: 0.5 })}</div><div class="rv-side">
      <div class="rv-kicker rv" data-at="0.2">A real night · 14 October</div>
      <h1 class="rv-h rv" data-at="0.6">100 MW hyperscaler, Navi Mumbai</h1>
      <div class="rv-list">${NAT.assets.map((a, k) => `<div class="rv-row rv" data-at="${2.2 + k * 0.9}"><span class="dotk" style="background:${TYPE_COL[a.type]}"></span><b>${a.name}</b><span>${TILES.find(t => t[0] === a.state)[1]}</span><span class="mono">${a.mw} MW${a.mwh ? ' / ' + a.mwh + ' MWh' : ''}</span><span class="ok">✓</span></div>`).join('')}</div>
      <p class="rv-note rv" data-at="8.6">Seven contracted assets, five states. Each with a delivery path, exclusive certificates and a scheduling coordinator.</p></div></div>`; },
    cap: [[0.5, 'The customer'], [2.2, 'Seven contracted assets across five states']] },
  { at: 33, end: 47, ch: 'The day before', render: () => {
    const N = natRun();
    const steps = [['Demand forecast', '96 blocks of 15 minutes for 14 Oct'], ['Allocation', 'Solar by day, storage and wind by night, across 7 assets'], ['Corridors checked', 'Capacity headroom and losses per route: RJ 3.9% · GJ 3.1% · KA 3.6% · TN 4.4% (illustrative)'], ['Gaps bid on IEX', f0(N.gdam) + ' MWh green day-ahead blocks, via our licensed trading member'], ['Schedules filed', 'MSEDCL / Maharashtra SLDC, plus WRLDC and SRLDC for inter-state flows']];
    return `<div class="rv-split wide"><div class="rv-chart panel"><div class="ph"><h3>Tomorrow's schedule · 14 Oct</h3><div class="legend" style="font-size:13px"><span>${sw('var(--solar)')}Solar ×3</span><span>${sw('var(--wind)')}Wind ×2</span><span>${sw('var(--bess)')}Storage ×2</span><span>${sw('var(--mkt)')}IEX</span><span>${sw('var(--grid)')}Grid</span></div></div>${planChart(N.R0n)}</div><div class="rv-side">
      <div class="rv-kicker rv" data-at="0.2">13 Oct · day-ahead planning</div>
      <div class="rv-steps">${steps.map(([t, d], k) => `<div class="rv-step rv" data-at="${1.2 + k * 2.4}"><span class="ic">✓</span><span><b>${t}</b><br><span>${d}</span></span></div>`).join('')}</div></div></div>`; },
    cap: [[0.5, 'A day ahead, the engine builds the schedule'], [8.4, 'Gaps bid on IEX · schedules filed with the despatch centres']] },
  { at: 47, end: 57, ch: 'Real time', run: () => natRun().R0n, live: lt => NAT.day * 96 + 72 + Math.min(12, Math.floor(lt / 0.25)), render: () => {
    const N = natRun(), b = N.R0n.blocks[NAT.day * 96 + 84];
    const parts = [['Wind', b.windDir, 'var(--wind)'], ['Stored solar', b.disElig, 'var(--bess)'], ['IEX blocks', b.mkt, 'var(--mkt)'], ['Grid · 0%', b.gridToLoad, 'var(--grid)']];
    return `<div class="nc-wrap"><div class="nc-main" id="ncLive"></div><div class="nc-rail">
      <div class="rv-clock rv" id="ncClock" data-at="0">18:00</div>
      <div class="rv-kicker rv" data-at="0.2">14 Oct · live dispatch</div>
      <h1 class="rv-h rv" data-at="3.2">Demand ${f0(b.L)} MW, filled in order</h1>
      <div class="nc-list">${parts.map(([n, v, c], k) => `<div class="nc-li rv" data-at="${3.8 + k * 1.1}"><span class="dotk" style="background:${c}"></span><span>${k + 1}. ${n}</span><b>${f0(v)} MW</b></div>`).join('')}</div>
      <p class="rv-note rv" data-at="8.2">Every 15 minutes, 96 times a day.</p></div></div>`; },
    cap: [[0.3, 'Block by block, through the evening'], [3.2, '21:00 · every block filled in merit order']] },
  { at: 57, end: 77, ch: 'The month', render: () => {
    const N = natRun(), share = N.extra / N.load;
    return `<div class="nc-wrap"><div class="nc-main">
        <div class="nc-flow mc-panel rv" data-at="0"><div class="nc-ch"><b>October, day by day</b><span>share of each day matched hour by hour</span></div>${monthCal({ tileAt: 0.4, tileStep: 0.07, incAt: [3.4, 4.6, 5.8, 7.0] })}</div>
        <div class="nc-flow rv" data-at="9"><div class="nc-ch"><b>Month-to-date score</b><span class="mc-leg"><i class="dl"></i>Re-plan each night only <i class="sl"></i>With the month guard</span></div>${monthScoreSVG({ aAt: 9.2, bAt: 12, dur: 3 })}</div>
      </div><div class="nc-rail">
      <div class="rv-kicker rv" data-at="0.2">One night × 31</div>
      <div class="mc-incs">${INC.map((x, k) => `<div class="mc-ic rv" data-at="${3.4 + k * 1.2}"><span class="w">${x.when}</span><b>${x.name}</b><span>${x.did}</span></div>`).join('')}</div>
      <div class="mc-guard rv" data-at="12"><b>Month guard</b><span>After each incident, extra green blocks on IEX over the following days: +${f0(N.extra)} MWh, ${(share * 100).toFixed(1)}% of the month’s load.</span></div>
      <div class="nc-big rv" data-at="16.5"><span>The month closes at</span><b style="color:var(--good)">${pc(N.R1.M.scoreComplete)}</b><span>vs CFE90 · ${pc(N.Rn.M.scoreComplete)} without the guard</span></div></div></div>`; },
    cap: [[0.3, 'That’s one night. Now run it for 31.'], [3.2, 'Four incidents in October'], [9, 'Each one re-planned within a block'], [11.5, 'The engine watches the month, not just the hour'], [16.5, 'The month closes above CFE90']] },
  { at: 77, end: 92, ch: 'The proof', render: () => {
    const N = natRun(), M = N.R1.M;
    const chain = [['Generator meters', '7 assets · 15-min data, D+1'], ['Despatch-centre accounts', 'SLDC and RLDC energy accounts'], ['Exchange trades', 'IEX obligation via the member'], ['Customer meter', 'Navi Mumbai site, 15-min'], ['Certificates cancelled', 'to the customer; stored solar keeps its origin'], ['Independent verifier', 'signs off the month']];
    return `<div class="rv-proof"><div class="rv-kicker rv" data-at="0.2">Behind every hour</div><h1 class="rv-h rv" data-at="0.6">Four records must agree before an hour counts</h1>
      <div class="rv-chain">${chain.map(([t, d], k) => `<div class="rv-link rv ${k === 5 ? 'wait' : ''}" data-at="${2 + k * 1.6}"><span class="ic">${k === 5 ? '…' : '✓'}</span><b>${t}</b><span>${d}</span></div>`).join('<span class="rv-arrow">→</span>')}</div>
      <div class="rv proofstage" data-at="11.5">${stageStrip(M)}</div></div>`; },
    cap: [[0.5, 'Meters, despatch accounts and trades must agree'], [9.5, 'Certificates cancelled, then independent sign-off']] },
  { at: 92, end: 100, ch: '', render: () => `<div class="rv-close"><div class="logo rv" data-at="0" style="width:84px;height:84px;border-radius:20px">${ICONS.manager.replace('width="18" height="18"', 'width="44" height="44"').replace('currentColor', '#fff')}</div>
      <h1 class="rv" data-at="0.4">CFE Manager</h1><p class="rv-tag rv" data-at="1.2">Clean energy you can prove, hour by hour.</p>
      <p class="rv-note rv" data-at="3">A new state means new suppliers, not a new system.</p><p class="small muted rv" data-at="4">Prototype · simulated data · Reliance T.U.P XII</p></div>`, cap: [] }
];
const REC_TOTAL = 100;
function recLive(B, lt) {
  if (!B.live) return;
  const cur = B.live(lt), el = $('ncLive'); if (!el || el.dataset.cur == cur) return;
  el.dataset.cur = cur; el.innerHTML = natConsole(B.run(), cur, !!B.trip);
  const c = $('ncClock'); if (c) c.textContent = blkTime(cur % 96);
}

/* ---------- player ---------- */
const REC = { on: false, t0: 0, beat: -1, raf: 0, tc: false, count: 0 };
function recOpen() {
  resetWorld(); NR = null; J1_CACHE = null; natRun();
  REC.on = true; REC.beat = -1; document.body.classList.add('recording');
  $('rec').hidden = false; $('recStage').innerHTML = ''; $('recCap').textContent = '';
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
  let n = 3; $('recCount').hidden = false; $('recCount').textContent = n;
  const tick = () => { n--; if (n > 0) { $('recCount').textContent = n; REC.count = setTimeout(tick, 1000); } else { $('recCount').hidden = true; REC.t0 = performance.now(); recLoop(); } };
  REC.count = setTimeout(tick, 1000);
}
function recClose() {
  REC.on = false; cancelAnimationFrame(REC.raf); clearTimeout(REC.count); $('rec').hidden = true; document.body.classList.remove('recording');
  try { document.fullscreenElement && document.exitFullscreen(); } catch (e) { }
  resetWorld(); state.role = 'home'; state.view = 'home'; render();
}
function recLoop() {
  if (!REC.on) return;
  const t = (performance.now() - REC.t0) / 1000;
  const bi = BEATS.findIndex(b => t >= b.at && t < b.end);
  if (bi === -1 && t >= REC_TOTAL) { $('recProg').style.width = '100%'; return; }
  if (bi !== REC.beat) { REC.beat = bi; const B = BEATS[bi]; $('recStage').innerHTML = `<div class="rv-beat">${B.render()}</div>`; $('recCh').textContent = B.ch; $('recStage').scrollTop = 0; }
  const B = BEATS[REC.beat], lt = t - B.at;
  recLive(B, lt);
  $('recStage').querySelectorAll('.rv').forEach(el => { const a = +el.dataset.at || 0, u = el.dataset.until !== undefined ? +el.dataset.until : 1e9; el.classList.toggle('shown', lt >= a && lt < u); });
  const cap = (B.cap || []).filter(c => lt >= c[0]).pop();
  const cs = cap ? cap[1] : ''; if ($('recCap').textContent !== cs) { $('recCap').textContent = cs; $('recCap').classList.toggle('on', !!cs); }
  $('recProg').style.width = (t / REC_TOTAL * 100) + '%';
  $('recTc').textContent = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') + '.' + Math.floor(t * 10 % 10);
  REC.raf = requestAnimationFrame(recLoop);
}
document.addEventListener('keydown', e => { if (!REC.on) return; if (e.key === 'Escape') recClose(); if (e.key === 't' || e.key === 'T') { REC.tc = !REC.tc; $('recTc').hidden = !REC.tc; } });

/* ---------- frame-exact seek, used to export the video frame by frame ---------- */
function recSeek(t) {
  if (!REC.seek) { resetWorld(); NR = null; J1_CACHE = null; natRun(); REC.seek = true; REC.on = false; REC.beat = -1; document.body.classList.add('recording', 'rec-seek'); $('rec').hidden = false; $('recCount').hidden = true; }
  const bi = Math.max(0, BEATS.findIndex(b => t >= b.at && t < b.end) === -1 ? BEATS.length - 1 : BEATS.findIndex(b => t >= b.at && t < b.end));
  if (bi !== REC.beat) { REC.beat = bi; const B = BEATS[bi]; $('recStage').innerHTML = `<div class="rv-beat">${B.render()}</div>`; $('recCh').textContent = B.ch; }
  recLive(BEATS[REC.beat], t - BEATS[REC.beat].at);
  const B = BEATS[REC.beat], lt = t - B.at, F = 0.55, ease = p => p < 0 ? 0 : p > 1 ? 1 : 1 - Math.pow(1 - p, 3);
  $('recStage').querySelectorAll('.rv').forEach(el => {
    const a = +el.dataset.at || 0, u = el.dataset.until !== undefined ? +el.dataset.until : 1e9;
    const p = Math.min(ease((lt - a) / F), lt < u ? 1 : 1 - ease((lt - u) / F));
    el.style.opacity = p; el.style.transform = p >= 1 ? 'none' : `translateY(${(12 * (1 - p)).toFixed(2)}px)`;
  });
  const cap = (B.cap || []).filter(c => lt >= c[0]).pop(), cs = cap ? cap[1] : '';
  if ($('recCap').textContent !== cs) { $('recCap').textContent = cs; } $('recCap').classList.toggle('on', !!cs);
  $('recProg').style.width = Math.min(100, t / REC_TOTAL * 100) + '%';
  document.getAnimations().forEach(an => { try { an.pause(); an.currentTime = Math.max(0, lt * 1000); } catch (e) { } });
}

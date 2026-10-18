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
function natRun() {
  if (NR) return NR;
  const cfg = { ...SIM.REF };
  const R1 = SIM.run(P, cfg, [{ k: 'bessPartial', from: NAT.tripFrom, to: NAT.tripTo, f: 0.6 }]), R0n = SIM.run(P, cfg, []);
  const q = SIM.DT;
  let dry = null; for (let i = NAT.tripFrom; i < NAT.tripTo; i++) if (R1.blocks[i].soc <= cfg.bessMWh * 0.4 * 0.1 + 0.6) { dry = i; break; }
  const win = (Rx, a, b) => { let L = 0, c = 0, m = 0, g = 0; for (let i = a; i < b; i++) { const x = Rx.blocks[i]; L += x.L; c += x.solarDir + x.windDir + x.disElig + x.mkt; m += x.mkt; g += x.gridToLoad + x.dis - x.disElig; } return { L: L * q, c: c * q, share: c / L, m: m * q, g: g * q }; };
  let gdam = 0; for (let i = NAT.day * 96; i < NAT.day * 96 + 96; i++) gdam += R0n.blocks[i].mkt * q;
  NR = { cfg, R1, R0n, dry, night0: win(R0n, NAT.tripFrom, 14 * 96 + 28), night1: win(R1, NAT.tripFrom, 14 * 96 + 28), gdam };
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
  TILES.forEach(([c, n, x, y]) => {
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
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Contracted supply across India flowing to the customer">${g}</svg>`;
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

/* ---------- beats ---------- */
const BEATS = [
  { at: 0, end: 9, ch: 'Tonight', render: () => {
    const N = natRun(), b = N.R1.blocks[NAT.tripFrom + 1];
    return `<div class="rv-split"><div class="rv-map">${natMap(b, { trip: true })}</div><div class="rv-side">
      <div class="rv-clock rv" data-at="0.3">22:30</div>
      <h1 class="rv-h rv" data-at="1">A 150 MW battery in Karnataka trips.</h1>
      <h2 class="rv-sub rv" data-at="4">A data centre in Mumbai keeps its clean-energy promise, and proves it.</h2></div></div>`; }, cap: [[0.5, 'Tonight, 22:30'], [4.5, 'Here’s how']] },
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
    return `<div class="rv-split"><div class="rv-chart panel"><div class="ph"><h3>Tomorrow's schedule · 14 Oct</h3><div class="legend" style="font-size:13px"><span>${sw('var(--solar)')}Solar ×3</span><span>${sw('var(--wind)')}Wind ×2</span><span>${sw('var(--bess)')}Storage ×2</span><span>${sw('var(--mkt)')}IEX</span><span>${sw('var(--grid)')}Grid</span></div></div>${planChart(N.R0n)}</div><div class="rv-side">
      <div class="rv-kicker rv" data-at="0.2">13 Oct · day-ahead planning</div>
      <div class="rv-steps">${steps.map(([t, d], k) => `<div class="rv-step rv" data-at="${1.2 + k * 2.4}"><span class="ic">✓</span><span><b>${t}</b><br><span>${d}</span></span></div>`).join('')}</div></div></div>`; },
    cap: [[0.5, 'A day ahead, the engine builds the schedule'], [8.4, 'Gaps bid on IEX · schedules filed with the despatch centres']] },
  { at: 47, end: 57, ch: 'Real time', render: () => {
    const N = natRun(), b = N.R1.blocks[NAT.day * 96 + 84];
    const parts = [['Wind', b.windDir, 'var(--wind)'], ['Stored solar', b.disElig, 'var(--bess)'], ['Exchange blocks', b.mkt, 'var(--mkt)'], ['Grid (counts 0%)', b.gridToLoad, 'var(--grid)']];
    return `<div class="rv-split"><div class="rv-map">${natMap(b)}</div><div class="rv-side">
      <div class="rv-clock rv" data-at="0">21:00</div>
      <h1 class="rv-h rv" data-at="0.6">Demand ${f0(b.L)} MW, filled in order</h1>
      <div class="rv-bars">${parts.map(([n, v, c], k) => `<div class="rv-bar rv" data-at="${2 + k * 1.6}"><span>${k + 1}. ${n}</span><div class="bar" style="height:22px"><span style="width:${v / b.L * 100}%;background:${c}"></span></div><b>${f0(v)} MW</b></div>`).join('')}</div>
      <p class="rv-note rv" data-at="8.4">Every 15 minutes, 96 times a day.</p></div></div>`; },
    cap: [[0.3, '21:00 · every block filled in merit order']] },
  { at: 57, end: 77, ch: 'Contingency', render: () => {
    const N = natRun(), b1 = N.R1.blocks[NAT.tripFrom + 1], b2 = N.R1.blocks[14 * 96 + 6], b0 = N.R0n.blocks[NAT.tripFrom + 1];
    const mhBefore = b0.dis * 100 / 250, dryT = N.dry !== null ? blkTime(N.dry % 96) : '—', addM = N.night1.m - N.night0.m;
    const acts = [['Maharashtra storage to full output', f0(mhBefore) + ' → ' + f0(b1.dis) + ' MW, inside its tolling limits'], ['Look-ahead', 'Remaining storage now runs dry at ' + dryT + ', not dawn'], ['Intraday green blocks bought', '+' + f0(addM) + ' MWh on IEX (G-TAM) via the trading member'], ['Revised schedule filed', 'SRLDC and WRLDC, in the next permitted revision'], ['Residual on grid supply', 'Load stays served; these MWh count at zero']];
    return `<div class="rv-split"><div class="rv-map"><div class="rv-layer rv" data-at="0" data-until="11">${natMap(b1, { trip: true })}</div><div class="rv-layer rv" data-at="11">${natMap(b2, { trip: true })}</div><div class="rv-maptime rv" data-at="11">Map at 01:30 · Maharashtra storage now empty</div></div><div class="rv-side">
      <div class="rv-clocks"><div class="rv-clock crit rv" data-at="0" data-until="11">22:30</div><div class="rv-clock crit rv" data-at="11">01:30</div></div>
      <h1 class="rv-h rv" data-at="0.8"><span style="color:var(--crit)">Koppal storage trips.</span> 60% of storage offline.</h1>
      <div class="rv-steps">${acts.map(([t, d], k) => `<div class="rv-step rv" data-at="${3.2 + k * 2.6}"><span class="ic">${k + 1}</span><span><b>${t}</b><br><span>${d}</span></span></div>`).join('')}</div>
      <div class="rv-kpis rv" data-at="16"><div><span>Tonight's clean share</span><b>${pc(N.night0.share, 0)} → <i style="font-style:normal;color:var(--crit)">${pc(N.night1.share, 0)}</i></b></div><div><span>Month vs CFE90</span><b style="color:var(--good)">${pc(N.R1.M.scoreComplete)}</b></div></div></div></div>`; },
    cap: [[0.5, '22:30 · battery trip'], [3.2, 'The engine re-plans within one block'], [16, 'The month still clears CFE90']] },
  { at: 77, end: 92, ch: 'The proof', render: () => {
    const N = natRun(), M = N.R1.M;
    const chain = [['Generator meters', '7 assets · 15-min data, D+1'], ['Despatch-centre accounts', 'SLDC and RLDC energy accounts'], ['Exchange trades', 'IEX obligation via the member'], ['Customer meter', 'Navi Mumbai site, 15-min'], ['Certificates cancelled', 'to the customer; stored solar keeps its origin'], ['Independent verifier', 'signs off the month']];
    return `<div class="rv-proof"><div class="rv-kicker rv" data-at="0.2">After the night</div><h1 class="rv-h rv" data-at="0.6">Four records must agree before an hour counts</h1>
      <div class="rv-chain">${chain.map(([t, d], k) => `<div class="rv-link rv ${k === 5 ? 'wait' : ''}" data-at="${2 + k * 1.6}"><span class="ic">${k === 5 ? '…' : '✓'}</span><b>${t}</b><span>${d}</span></div>`).join('<span class="rv-arrow">→</span>')}</div>
      <div class="rv proofstage" data-at="11.5">${stageStrip(M)}</div></div>`; },
    cap: [[0.5, 'Meters, despatch accounts and trades must agree'], [9.5, 'Certificates cancelled, then independent sign-off']] },
  { at: 92, end: 100, ch: '', render: () => `<div class="rv-close"><div class="logo rv" data-at="0" style="width:84px;height:84px;border-radius:20px">${ICONS.manager.replace('width="18" height="18"', 'width="44" height="44"').replace('currentColor', '#fff')}</div>
      <h1 class="rv" data-at="0.4">CFE Manager</h1><p class="rv-tag rv" data-at="1.2">Clean energy you can prove, hour by hour.</p>
      <p class="rv-note rv" data-at="3">A new state means new suppliers, not a new system.</p><p class="small muted rv" data-at="4">Prototype · simulated data · Reliance T.U.P XII</p></div>`, cap: [] }
];
const REC_TOTAL = 100;

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

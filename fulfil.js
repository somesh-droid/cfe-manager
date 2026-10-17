/* ===================== BLOCK BY BLOCK: how one 15-minute block is filled ===================== */
state.fStep = 6; state.fAnim = false; state.fAuto = false;
let fTimer = null;
function stopF() { clearTimeout(fTimer); fTimer = null; state.fAuto = false; state.fAnim = false; if (state.fStep < 6) state.fStep = 6; }
function playBlock(cb) {
  clearTimeout(fTimer); state.fStep = 0; state.fAnim = true; render({ keepScroll: true, noRe: true });
  const tick = () => {
    if (state.view !== 'blocks') return stopF();
    state.fStep++; if (state.fStep >= 6) state.fAnim = false;
    render({ keepScroll: true, noRe: true });
    if (state.fStep < 6) fTimer = setTimeout(tick, 700); else if (cb) fTimer = setTimeout(cb, 1100);
  };
  fTimer = setTimeout(tick, 450);
}
function autoRun() {
  state.fAuto = true;
  const next = () => { if (!state.fAuto || state.view !== 'blocks') return; if (state.block >= 95) { stopF(); render({ keepScroll: true, noRe: true }); return; } state.block++; playBlock(next); };
  playBlock(next);
}

function blockSteps(i) {
  const b = R.blocks[i], b0 = R0.blocks[i], cfg = state.cfg, cap = cfg.bessMWh || 1;
  const socB = i > 0 ? R.blocks[i - 1].soc : cap * 0.5, ev = state.events.length > 0;
  const plan = (v, v0) => ev && Math.abs(v - v0) > 0.5 ? `Plan without the what-if: ${f0(v0)} MW` : '';
  const fcS = P.solarFc[i] * cfg.solar, fcW = P.windFc[i] * cfg.wind;
  const S = [];
  S.push(b.S < 0.5
    ? { n: 'Kutch Solar Park', a: 'KTC-SOL-01', who: 'Generator', c: 'var(--solar)', verb: 'Idle', mw: 0, st: 'idle', d: 'The sun is down, so there is no output in this block.', p: '' }
    : { n: 'Kutch Solar Park', a: 'KTC-SOL-01', who: 'Generator', c: 'var(--solar)', verb: 'Generated', mw: b.S, st: 'fired', d: `Forecast ${f0(fcS)} MW, actual ${f0(b.S)} MW. ${f0(b.solarDir)} MW reached the site after transmission losses.${b.chg + b.surplusExcl > 0.5 ? ' The rest is more than the site needs: it goes to the battery (step 3) or is surplus.' : ''}`, p: plan(b.S, b0.S) });
  S.push(b.W < 0.5
    ? { n: 'Kutch Wind Farm', a: 'KTC-WND-02', who: 'Generator', c: 'var(--wind)', verb: 'Idle', mw: 0, st: 'idle', d: 'No wind in this block.', p: plan(b.W, b0.W) }
    : { n: 'Kutch Wind Farm', a: 'KTC-WND-02', who: 'Generator', c: 'var(--wind)', verb: 'Generated', mw: b.W, st: b.W < 0.6 * fcW ? 'short' : 'fired', d: `Forecast ${f0(fcW)} MW, actual ${f0(b.W)} MW. ${f0(b.windDir)} MW reached the site after transmission losses.`, p: plan(b.W, b0.W) });
  const out = b.P_b === 0 && cfg.bessMW > 0, disX = b.dis - b.disElig;
  if (out) S.push({ n: 'Jamnagar Battery', a: 'JMN-BES-01', who: 'Storage operator', c: 'var(--bess)', verb: 'Unavailable', mw: 0, st: 'out', d: 'Forced outage. The battery cannot charge or discharge in this block.', p: plan(b.dis, b0.dis) });
  else if (b.dis > 0.05) S.push({ n: 'Jamnagar Battery', a: 'JMN-BES-01', who: 'Storage operator', c: 'var(--bess)', verb: 'Discharged', mw: b.dis, st: 'fired', d: `Filled part of the gap. Charge level ${pc(socB / cap, 0)} → ${pc(b.soc / cap, 0)}. ` + (disX > 0.05 ? `${f1(disX)} MW of this was charged from the grid and does not count.` : 'This energy was stored from surplus solar and wind, so it counts as clean.'), p: plan(b.dis, b0.dis) });
  else if (b.chg + b.gc > 0.05) S.push({ n: 'Jamnagar Battery', a: 'JMN-BES-01', who: 'Storage operator', c: 'var(--bess)', verb: 'Charging', mw: b.chg + b.gc, st: 'charging', d: b.gc > 0.05 ? `Charging from the grid (off-plan). Charge level ${pc(socB / cap, 0)} → ${pc(b.soc / cap, 0)}. Grid-charged energy will not count when discharged.` : `Storing ${f0(b.chg)} MW of surplus clean power for the evening. Charge level ${pc(socB / cap, 0)} → ${pc(b.soc / cap, 0)}.`, p: '' });
  else S.push({ n: 'Jamnagar Battery', a: 'JMN-BES-01', who: 'Storage operator', c: 'var(--bess)', verb: 'Standby', mw: 0, st: 'idle', d: `No surplus to store and no gap to fill. Charge level ${pc(b.soc / cap, 0)}.`, p: '' });
  const gapBeforeMkt = b.L - b.solarDir - b.windDir - b.dis;
  if (b.mkt > 0.05) S.push({ n: 'Green exchange block', a: 'via trading member', who: 'IEX green market', c: 'var(--mkt)', verb: 'Bought', mw: b.mkt, st: 'fired', d: `Delivered through the licensed trading member (order SIM-REQ-${String(b.d + 1).padStart(2, '0')}${String(b.h).padStart(2, '0')}). ${f0(b.mAv)} MW was available within the bid limit.`, p: plan(b.mkt, b0.mkt) });
  else if (gapBeforeMkt > 0.05) S.push({ n: 'Green exchange block', a: 'via trading member', who: 'IEX green market', c: 'var(--mkt)', verb: 'Not cleared', mw: 0, st: 'out', d: 'No green block cleared within the bid limit for this block.', p: plan(b.mkt, b0.mkt) });
  else S.push({ n: 'Green exchange block', a: 'via trading member', who: 'IEX green market', c: 'var(--mkt)', verb: 'Not needed', mw: 0, st: 'idle', d: 'Solar, wind and the battery already covered the demand.', p: '' });
  S.push(b.gridToLoad > 0.05
    ? { n: 'DISCOM grid supply', a: 'residual', who: 'Distribution licensee', c: 'var(--grid)', verb: 'Supplied', mw: b.gridToLoad, st: 'zero', d: 'Covered the remaining gap on normal grid supply. These MW count as 0% clean.', p: plan(b.gridToLoad, b0.gridToLoad) }
    : { n: 'DISCOM grid supply', a: 'residual', who: 'Distribution licensee', c: 'var(--grid)', verb: 'Not needed', mw: 0, st: 'idle', d: 'No grid power needed in this block.', p: plan(b.gridToLoad, b0.gridToLoad) });
  return S;
}

function tankSVG(b, k) {
  const W = 300, H = 380, x0 = 70, cw = 130, top = 46, bot = 340, L = b.L, scale = (bot - top) / (L * 1.12);
  const segs = [[1, b.solarDir, 'var(--solar)', 'Solar'], [2, b.windDir, 'var(--wind)', 'Wind'], [3, b.disElig, 'var(--bess)', 'Battery'], [3, b.dis - b.disElig, 'var(--bess-x)', 'Battery (grid)'], [4, b.mkt, 'var(--mkt)', 'Exchange'], [5, b.gridToLoad, 'var(--grid)', 'Grid']];
  let g = '', y = bot, filled = 0;
  const yL = bot - L * scale;
  g += `<rect x="${x0}" y="${yL}" width="${cw}" height="${L * scale}" rx="6" fill="var(--panel-2)" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  segs.forEach(([st, v, c, lab]) => {
    if (st > k || v < 0.05) return;
    const h = v * scale; y -= h; filled += v;
    g += `<rect x="${x0}" y="${y}" width="${cw}" height="${h}" fill="${c}" ${st === k && state.fAnim ? 'class="segin"' : ''}/>`;
    if (h > 18) g += `<text x="${x0 + cw / 2}" y="${y + h / 2 + 4}" text-anchor="middle" style="font-family:var(--f-body);font-size:12px;font-weight:600;fill:${c === 'var(--grid)' || c === 'var(--bess-x)' ? 'var(--ink)' : '#fff'}">${lab} ${f0(v)}</text>`;
    else g += `<text x="${x0 + cw + 8}" y="${y + h / 2 + 4}" style="font-size:10.5px">${lab} ${f1(v)}</text>`;
  });
  const gap = Math.max(0, L - filled);
  if (gap > 0.5) g += `<text x="${x0 + cw / 2}" y="${(yL + y) / 2 + 4}" text-anchor="middle" style="font-family:var(--f-body);font-size:12.5px;fill:var(--muted)">gap ${f0(gap)} MW</text>`;
  g += `<line x1="${x0 - 12}" x2="${x0 + cw + 12}" y1="${yL}" y2="${yL}" stroke="var(--ink)" stroke-width="2"/><text x="${x0 + cw / 2}" y="${yL - 10}" text-anchor="middle" style="font-family:var(--f-body);font-size:13px;font-weight:600;fill:var(--ink)">Demand ${f0(L)} MW</text>`;
  g += `<line x1="${x0 - 12}" x2="${x0 + cw + 12}" y1="${bot}" y2="${bot}" stroke="var(--line)"/><text x="${x0 + cw / 2}" y="${bot + 20}" text-anchor="middle">Hyperscaler A · JMN-DC-01</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Demand for this block and how it was filled">${g}</svg>`;
}

function blockLog(b, k, S) {
  const t0 = b.b * 15, T = m => hhmm(t0 + m), mw = v => f0(v) + ' MW';
  const L = [];
  L.push([0, T(-15), 'CFE Manager', `Plan locked for ${hhmm(t0)}: demand forecast ${mw(b.L)}, clean supply forecast ${mw(b.fc)}.`]);
  L.push([0, T(0), 'CFE Manager', `Block ${hhmm(t0)}–${hhmm(t0 + 15)} opens.`]);
  L.push([1, T(0), 'Kutch Solar', b.S > 0.5 ? `Injecting ${mw(b.S)} at the Kutch pooling substation (metered).` : 'No output (night).']);
  L.push([2, T(0), 'Kutch Wind', b.W > 0.5 ? `Injecting ${mw(b.W)} (metered).` : 'No output.']);
  if (S[2].verb === 'Discharged') L.push([3, T(0), 'CFE Manager → Battery', `Discharge ${mw(b.dis)} per the signed plan. Operator confirms.`]);
  else if (S[2].verb === 'Charging') L.push([3, T(0), 'CFE Manager → Battery', `Charge ${mw(b.chg + b.gc)} from ${b.gc > 0.05 ? 'the grid (off-plan)' : 'surplus solar and wind'}.`]);
  else if (S[2].verb === 'Unavailable') L.push([3, T(0), 'Battery operator', 'Outage notice in force. Battery isolated.']);
  else L.push([3, T(0), 'Battery', 'Standby.']);
  if (b.mkt > 0.05) L.push([4, T(0), 'Trading member', `${mw(b.mkt)} green block delivered as scheduled with the SLDC.`]);
  else if (S[3].verb === 'Not cleared') L.push([4, T(0), 'Trading member', 'No fill within the bid limit.']);
  if (b.gridToLoad > 0.05) L.push([5, T(0), 'DISCOM', `${mw(b.gridToLoad)} residual drawn from the grid. Tagged 0% clean.`]);
  if (b.surplusExcl > 0.5) L.push([2, T(0), 'CFE Manager', `${mw(b.surplusExcl)} surplus could not be stored. Not counted toward the score.`]);
  if (b.txCurt > 0.5) L.push([2, T(0), 'SLDC', `${mw(b.txCurt)} curtailed at Kutch because of a transmission limit.`]);
  const clean = b.solarDir + b.windDir + b.disElig + b.mkt;
  L.push([6, T(15), 'Site meter', `Block closes: ${f1(b.L * SIM.DT)} MWh drawn. Clean ${f1(clean * SIM.DT)} MWh (${pc(clean / b.L)}).`]);
  return L.filter(x => x[0] <= k).map(([s, t, a, m]) => `<div class="logline ${s === k && state.fAnim ? 'new' : ''}"><span class="mono small muted">${t}</span><span><b>${a}</b> · ${m}</span></div>`).join('');
}

function hourStrip(k) {
  const h = Math.floor(state.block / 4), base = state.day * BPD + h * 4, W = 520, H = 170, cw = 70, gap = 46, x0 = 40, bot = 140, top = 20;
  const bs = [0, 1, 2, 3].map(j => R.blocks[base + j]);
  const max = Math.max(...bs.map(b => b.L)) * 1.1, sc = (bot - top) / max;
  let g = '';
  bs.forEach((b, j) => {
    const x = x0 + j * (cw + gap), bi = h * 4 + j, kk = bi < state.block ? 6 : bi === state.block ? k : -1;
    g += `<rect x="${x}" y="${bot - b.L * sc}" width="${cw}" height="${b.L * sc}" rx="4" fill="var(--panel-2)" stroke="${bi === state.block ? 'var(--brand)' : 'var(--line)'}" stroke-width="${bi === state.block ? 2 : 1}" ${kk < 0 ? 'stroke-dasharray="4 4"' : ''}/>`;
    if (kk >= 0) { let y = bot; [[1, b.solarDir, 'var(--solar)'], [2, b.windDir, 'var(--wind)'], [3, b.disElig, 'var(--bess)'], [3, b.dis - b.disElig, 'var(--bess-x)'], [4, b.mkt, 'var(--mkt)'], [5, b.gridToLoad, 'var(--grid)']].forEach(([s, v, c]) => { if (s <= kk && v > 0.05) { y -= v * sc; g += `<rect x="${x}" y="${y}" width="${cw}" height="${v * sc}" fill="${c}"/>`; } }); }
    g += `<text x="${x + cw / 2}" y="${bot + 16}" text-anchor="middle" ${bi === state.block ? 'style="fill:var(--ink);font-weight:600"' : ''}>${blkTime(bi)}</text>`;
    if (kk >= 6) { const c = (b.solarDir + b.windDir + b.disElig + b.mkt) / b.L; g += `<text x="${x + cw / 2}" y="${bot - b.L * sc - 6}" text-anchor="middle" style="fill:${c >= .9 ? 'var(--good)' : 'var(--crit)'};font-weight:600">${pc(c, 0)}</text>`; }
    else if (kk < 0) g += `<text x="${x + cw / 2}" y="${bot - b.L * sc / 2}" text-anchor="middle" style="font-size:10px">upcoming</text>`;
  });
  const doneBs = bs.filter((b, j) => h * 4 + j < state.block || (h * 4 + j === state.block && k >= 6));
  const ld = doneBs.reduce((a, b) => a + b.L, 0) * SIM.DT, cl = doneBs.reduce((a, b) => a + b.solarDir + b.windDir + b.disElig + b.mkt, 0) * SIM.DT;
  const o = R.hours[state.day * 24 + h], closed = doneBs.length === 4;
  return `<div class="g2" style="align-items:center">
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="The four blocks of this hour">${g}</svg></div>
    <div class="stack" style="gap:8px">
      <div class="row" style="justify-content:space-between"><span class="eyebrow">${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00 ${closed ? 'closed' : 'so far'}</span>${closed ? chip('Hour matched', 'good') : chip(doneBs.length + ' of 4 blocks', 'neutral')}</div>
      <div class="row" style="gap:20px"><div><div class="big" style="font-size:30px">${doneBs.length ? pc(cl / ld) : '—'}</div><div class="small muted">clean share</div></div><div><div class="num" style="font-size:18px;font-weight:600">${f1(cl)} / ${f1(ld)}</div><div class="small muted">clean / demand, MWh</div></div></div>
      ${closed ? `<div class="callout good small">Certificates for this hour are requested on D+1 after meter data arrives: ${[['Solar', o.solar], ['Wind', o.wind], ['Battery', o.bessElig], ['Exchange', o.mkt]].filter(x => x[1] > 0.05).map(([n, v]) => `${n} ${f1(v)} MWh`).join(' · ') || 'none'}${o.grid > 0.05 ? `. Grid ${f1(o.grid)} MWh gets none.` : '.'}</div>` : '<p class="small muted">The score is settled per hour. Four 15-minute blocks make one hour.</p>'}
    </div></div>`;
}

V.blocks = () => {
  const i = state.day * BPD + state.block, b = R.blocks[i], k = state.fStep, S = blockSteps(i);
  const clean = [b.solarDir + b.windDir, b.disElig, b.mkt];
  const cleanSoFar = (k >= 1 ? b.solarDir : 0) + (k >= 2 ? b.windDir : 0) + (k >= 3 ? b.disElig : 0) + (k >= 4 ? b.mkt : 0);
  const metSoFar = cleanSoFar + (k >= 3 ? b.dis - b.disElig : 0) + (k >= 5 ? b.gridToLoad : 0);
  const cleanAll = b.solarDir + b.windDir + b.disElig + b.mkt;
  const stIcon = { fired: '✓', short: '!', charging: '↓', idle: '–', out: '✕', zero: '0' };
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Block by block</div><h1>How one 15-minute block of demand is filled</h1><p class="lead">The customer's demand is split into 96 blocks a day. For each block, CFE Manager fills the demand in a fixed order: clean sources first, the grid last. Press <b>Play this block</b> to watch it happen.</p></div></div>
  <div class="panel" style="padding:12px 14px"><div class="row" style="justify-content:space-between">
    <div class="row"><button class="btn sm" data-act="dayPrev" aria-label="Previous day">‹</button><span style="font-family:var(--f-display);font-weight:600;font-size:18px;min-width:118px;text-align:center">${dayLabel(state.day)}</span><button class="btn sm" data-act="dayNext" aria-label="Next day">›</button>
      <label for="blkSel" class="small muted" style="margin-left:8px">Block</label><select id="blkSel" style="width:auto">${Array.from({ length: 96 }, (_, j) => `<option value="${j}" ${j === state.block ? 'selected' : ''}>${blkTime(j)}–${blkTime(j + 1)}</option>`).join('')}</select>
      <button class="btn sm" data-act="bPrev">◀ Previous</button><button class="btn sm" data-act="bNext">Next ▶</button></div>
    <div class="row">${eventControls()}<button class="btn primary" data-act="bPlay">${state.fAnim && !state.fAuto ? 'Playing…' : '▶ Play this block'}</button><button class="btn" data-act="bAuto">${state.fAuto ? '■ Stop' : '▶▶ Run block after block'}</button></div>
  </div></div>
  ${activeChips()}
  <div class="kpis compact">
    ${kpi('Demand this block', f0(b.L) + ' <small>MW</small>', f1(b.L * SIM.DT) + ' MWh · ' + blkTime(state.block) + '–' + blkTime(state.block + 1))}
    ${kpi('Met so far', f0(metSoFar) + ' <small>MW</small>', k >= 6 ? 'demand fully served' : 'step ' + Math.min(k, 5) + ' of 5', k >= 5 ? 'good' : '')}
    ${kpi('Clean so far', f0(cleanSoFar) + ' <small>MW</small>', pc(cleanSoFar / b.L, 0) + ' of demand')}
    ${kpi('Block result', k >= 6 ? pc(cleanAll / b.L) : '…', k >= 6 ? 'clean share of this block' : 'shown when the block closes', k >= 6 ? (cleanAll / b.L >= .9 ? 'good' : 'crit') : '')}
  </div>
  <div class="fl">
    <div class="panel"><div class="ph"><h3>Merit order · who supplies, in order</h3><span class="sub">MW in this block</span></div>
      <div class="fsteps">${S.map((s, j) => { const n = j + 1, cls = n > k ? 'pending' : (n === k && state.fAnim ? 'active' : 'done'); return `<div class="fstep st-${s.st} ${cls}"><span class="fn">${n > k ? n : stIcon[s.st]}</span><div class="fb"><div class="fh">${sw(s.c)}<b>${s.n}</b> <span class="mono small muted">${s.a}</span></div><div class="small muted">${s.who}</div>${n <= k ? `<div class="small" style="margin-top:3px">${s.d}</div>${s.p ? `<div class="small" style="color:var(--warn);margin-top:2px">${s.p}</div>` : ''}` : ''}</div><div class="fv">${n <= k ? `${chip(s.verb, { fired: 'good', short: 'warn', charging: 'info', idle: 'neutral', out: 'crit', zero: 'neutral' }[s.st])}<span class="mw">${f0(s.mw)}<small> MW</small></span>` : '<span class="small faint">waiting</span>'}</div></div>`; }).join('')}</div>
      ${k >= 6 ? `<div class="callout ${cleanAll / b.L >= .9 ? 'good' : 'warn'}" style="margin-top:10px"><b>Block closed.</b> ${f0(b.L)} MW demand met in full: ${f0(cleanAll)} MW clean (${pc(cleanAll / b.L, 0)})${b.gridToLoad + b.dis - b.disElig > 0.05 ? `, ${f0(b.gridToLoad + b.dis - b.disElig)} MW from the grid at zero` : ''}.${b.surplusExcl > 0.5 ? ` ${f0(b.surplusExcl)} MW of surplus was not counted.` : ''}</div>` : ''}
    </div>
    <div class="panel" style="display:grid;align-content:start"><div class="ph"><h3>The demand bucket</h3></div><div class="chart">${tankSVG(b, k)}</div>
      ${k >= 3 && (b.chg > 0.5 || b.surplusExcl > 0.5) ? `<div class="callout small" style="margin-bottom:8px">Outside the bucket: ${b.chg > 0.5 ? f0(b.chg) + ' MW into the battery' : ''}${b.chg > 0.5 && b.surplusExcl > 0.5 ? ', ' : ''}${b.surplusExcl > 0.5 ? f0(b.surplusExcl) + ' MW surplus, not counted' : ''}.</div>` : ''}<div class="legend" style="justify-content:center">${sw('var(--solar)')}Solar ${sw('var(--wind)')}Wind ${sw('var(--bess)')}Battery ${sw('var(--mkt)')}Exchange ${sw('var(--grid)')}Grid</div></div>
    <div class="panel"><div class="ph"><h3>What happened, in order</h3><span class="sub">messages and meter readings</span></div><div class="stack" style="gap:0">${blockLog(b, k, S)}</div></div>
  </div>
  <div class="panel"><div class="ph"><h3>This hour</h3><span class="sub">four blocks make one hourly match</span></div>${hourStrip(k)}</div>
  <div class="panel"><div class="ph"><h3>The whole day · click any block</h3><div class="legend">${legendHTML()}</div></div>${dayChartSVG(state.day, { block: state.block })}</div>`;
};

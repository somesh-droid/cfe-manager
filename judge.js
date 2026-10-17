/* ===================== JUDGE DEMO: four scenes for a two-minute presentation ===================== */
const SCENES = [
  { id: 'j1', n: 'The problem', t: '0:00–0:20', q: 'What problem do you solve?' },
  { id: 'j2', n: 'The decision', t: '0:20–1:05', q: 'What decision do you make?' },
  { id: 'j3', n: 'The proof', t: '1:05–1:35', q: 'How do you prove the outcome?' },
  { id: 'j4', n: 'The return', t: '1:35–2:00', q: 'Why does Reliance earn an attractive return?' }
];
const J2_STEPS = [
  { n: 'Normal night', ev: [] },
  { n: 'Wind drops 65%', ev: ['windLull'] },
  { n: 'Battery trips', ev: ['windLull', 'bessOut'] }
];
let J1_CACHE = null;
function j1Data() {
  if (J1_CACHE) return J1_CACHE;
  const dg = SIM.diagnostic(P, 60, 'flat', 'solar', 100);
  const z = SIM.size(P, 60, 'flat', 90), Rz = z.R || SIM.run(P, z.cfg, []);
  const after = new Array(24).fill(0), ld = new Array(24).fill(0);
  Rz.hours.forEach(o => { after[o.h] += o.matched; ld[o.h] += o.load; });
  J1_CACHE = { dg, z, after: after.map((v, h) => v / ld[h]), score: Rz.M.scoreComplete };
  return J1_CACHE;
}
function beforeAfterSVG(a, b) {
  const W = 760, H = 300, ml = 46, mr = 10, mt = 16, mb = 30, pw = W - ml - mr, ph = H - mt - mb, bw = pw / 24, y = v => mt + ph * (1 - v);
  let g = '';
  [0, .5, .9, 1].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="${v === .9 ? 'var(--crit)' : 'var(--line-2)'}" ${v === .9 ? 'stroke-dasharray="6 4"' : ''}/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end" style="font-size:12px">${v * 100}%</text>`);
  a.forEach((v, h) => { const x = ml + h * bw; g += `<rect x="${x + 2}" y="${y(v)}" width="${bw / 2 - 2}" height="${y(0) - y(v)}" fill="var(--h1)" rx="2"/><rect x="${x + bw / 2}" y="${y(b[h])}" width="${bw / 2 - 2}" height="${y(0) - y(b[h])}" fill="var(--h3)" rx="2"/>`; });
  for (let h = 0; h < 24; h += 3) g += `<text x="${ml + h * bw + bw / 2}" y="${H - 8}" text-anchor="middle" style="font-size:12px">${String(h).padStart(2, '0')}:00</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of each hour matched, before and after">${g}</svg></div>`;
}

V.j1 = () => {
  const D = j1Data(), dg = D.dg;
  return `<div class="scene">
    <div class="smsg"><span class="eyebrow">Scene 1 · ${SCENES[0].q}</span><h1>100% renewable on paper. <span style="color:var(--crit)">${pc(dg.hourly, 0)}</span> matched hour by hour.</h1></div>
    <div class="sgrid">
      <div class="panel"><div class="ph"><h3>Share of each hour matched</h3><div class="legend" style="font-size:13px"><span>${sw('var(--h1)')}Today: annual solar PPA</span><span>${sw('var(--h3)')}With a CFE90 service</span></div></div>${beforeAfterSVG(dg.profile, D.after)}
        <p class="small muted">Simulated customer: a 60 MW data centre whose annual solar contract covers 100% of its yearly use. Each customer's result will differ.</p></div>
      <div class="stack">
        ${promiseBox(90)}
        <div class="bignum"><span>Matched hour by hour today</span><b style="color:var(--crit)">${pc(dg.hourly, 0)}</b></div>
        <div class="bignum"><span>With a CFE90 portfolio, illustrative month</span><b style="color:var(--good)">${pc(D.score, 0)}</b></div>
      </div>
    </div></div>`;
};

V.j2 = () => {
  const k = state.jStep || 0, i = state.day * BPD + 92, b = R.blocks[i], o = R.hours[state.day * 24 + 23], o0 = R0.hours[state.day * 24 + 23];
  const c = sameAssets(), cr = creditMoney(R.M.scoreComplete, state.tier);
  let dG = 0; for (let x = state.day * BPD + 72; x < state.day * BPD + 120 && x < SIM.NB; x++) dG += (R.blocks[x].gridToLoad - R0.blocks[x].gridToLoad) * SIM.DT;
  const msg = ['At 23:00 wind and solar stored in the afternoon carry the night.', 'Wind drops: the battery steps in and exchange blocks are bought.', 'The battery trips: the grid fills the gap, counted at zero, and the month stays measurable.'][k];
  return `<div class="scene">
    <div class="smsg"><span class="eyebrow">Scene 2 · ${SCENES[1].q}</span><h1>${msg}</h1>
      <div class="row" style="margin-top:10px">${J2_STEPS.map((s, j) => `<button class="btn ${j === k ? 'primary' : ''}" data-act="jStep" data-i="${j}">${j + 1}. ${s.n}</button>`).join('<span class="faint">→</span>')}</div></div>
    <div class="sgrid">
      <div class="panel"><div class="ph"><h3>Live flows · 23:00, ${dayLabel(state.day)}</h3><span class="sub">MW</span></div>${networkSVG(b)}</div>
      <div class="stack">
        <div class="bignum"><span>23:00 clean share</span><b style="color:${o.cfe >= .9 ? 'var(--good)' : 'var(--crit)'}">${pc(o.cfe, 0)}</b>${k ? `<small>plan ${pc(o0.cfe, 0)}</small>` : ''}</div>
        <div class="bignum"><span>Forecast month vs CFE90</span><b style="color:${R.M.scoreComplete >= .9 ? 'var(--good)' : 'var(--crit)'}">${pc(R.M.scoreComplete)}</b><small>${k ? 'extra grid tonight ' + f0(Math.max(0, dG)) + ' MWh · credit exposure ' + cr.creditPct.toFixed(1) + '% of bill' : 'credit exposure 0%'}</small></div>
        <div class="panel" style="padding:14px"><div class="eyebrow" style="margin-bottom:6px">Same assets, same weather</div>
          <div class="cmprow"><span>Fixed schedule</span><b>${pc(c.A.score)}</b></div><div class="cmprow"><span>With CFE Manager</span><b style="color:var(--brand)">${pc(c.B.score)}</b></div>
          <p class="small muted" style="margin-top:6px">The difference comes from decisions, not extra batteries.</p></div>
        ${k ? `<div class="callout small"><b>What we decided:</b> ${state.events.map(x => DECIDED[x.key]).join(' ')}</div>` : ''}
      </div>
    </div></div>`;
};

V.j3 = () => {
  const T = traceFlow(state.day, 22), M = R.M, cr = creditMoney(M.scoreComplete, state.tier);
  return `<div class="scene">
    <div class="smsg"><span class="eyebrow">Scene 3 · ${SCENES[2].q}</span><h1>Every clean MWh traces back to a meter and a certificate. Exceptions are excluded, not guessed.</h1></div>
    <div class="panel"><div class="ph"><h3>One hour: 22:00, ${dayLabel(state.day)}</h3><span class="sub">${T.tr ? 'stored energy traced to its charging source' : ''}</span></div>${T.html}</div>
    <div class="sgrid">
      <div class="panel"><div class="ph"><h3>The month</h3><span class="sub">${PERIOD}</span></div>${stageStrip(M)}</div>
      <div class="stack">
        <div class="bignum"><span>Monthly score, evidence reconciled</span><b style="color:${M.scoreComplete >= .9 ? 'var(--good)' : 'var(--crit)'}">${pc(M.scoreComplete)}</b><small>floor CFE90 · ${SIM.below(R, 90)} of ${R.hours.length} hours below 90%</small></div>
        <div class="bignum"><span>Service credit</span><b>${cr.creditPct.toFixed(1)}%</b><small>of the monthly bill · 2% per point, cap 10% · on the verified result</small></div>
      </div>
    </div></div>`;
};

V.j4 = () => `<div class="scene">
    <div class="smsg"><span class="eyebrow">Scene 4 · ${SCENES[3].q}</span><h1>Reliance earns a service margin on assets it can build, fund and prove, starting at Jamnagar.</h1></div>
    <div class="sgrid">
      <div class="panel"><div class="ph"><h3>Margin per MWh</h3>${FIN.status === 'pending' ? chip('Finance validation pending', 'warn') : ''}</div>${waterfallSVG()}</div>
      <div class="panel"><div class="ph"><h3>How it expands</h3></div>${mapSVG(state.route || 'JMN', true)}
        <div class="legend" style="font-size:12.5px"><span>${sw(ROUTE_COL[1])}Jamnagar proof</span><span>${sw(ROUTE_COL[2])}Gujarat customers</span><span>${sw(ROUTE_COL[3])}Local partners elsewhere</span></div></div>
    </div>
    <div class="advrow">${ADVANTAGE.slice(0, 5).map(([a, , s, t, c]) => `<div class="adv"><b>${a}</b><span class="small muted">${c}</span>${chip(s, t)}</div>`).join('')}</div>
  </div>`;

function judgeBar() {
  const i = SCENES.findIndex(s => s.id === state.view);
  return `<div class="jbar"><div class="row">${SCENES.map((s, j) => `<button class="jscene ${j === i ? 'on' : ''}" data-act="jScene" data-i="${j}"><span class="n">${j + 1}</span><span><b>${s.n}</b><br><span>${s.t}</span></span></button>`).join('')}</div>
    <div class="row"><button class="btn sm" data-act="jPrev" ${i === 0 ? 'disabled' : ''}>← Back</button><button class="btn sm primary" data-act="jNext">${i === 3 ? 'Finish' : 'Next →'}</button><button class="btn sm" data-act="jReset">Reset demo</button><button class="btn sm ghost" data-act="jExit">Explore platform</button></div></div>`;
}
function judgeSetStep(k) {
  clearEvents(); state.jStep = k; state.day = 13; state.block = 92; state.hourSel = 23;
  J2_STEPS[k].ev.forEach(key => addEvent(key, 13));
}
function judgeGo(i) {
  state.role = 'judge'; state.view = SCENES[i].id;
  if (i === 0 || i === 3) { /* keep scenario from scene 2 for scenes 3 */ }
}
function judgeStart() { resetWorld(); state.jStep = 0; judgeSetStep(0); state.route = 'JMN'; judgeGo(0); }

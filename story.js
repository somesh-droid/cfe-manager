/* ===================== STORY: shared promise, status stages, finance inputs ===================== */
const PERIOD = 'Illustrative month · 1–31 Oct 2026 · synthetic data';
const CFE_PROMISE = (t = 90) => `CFE${t} means ${t}% of monthly electricity consumption is matched with eligible clean supply in the hour it is consumed. It does not mean ${t}% clean in every hour.`;

/* Finance inputs: filled from the team's revised business-model deck. null = pending validation. */
const FIN = {
  status: 'pending',               // 'pending' until the finance workstream signs off
  tariffPerMWh: null,              // customer tariff, ₹/MWh
  route: 'Group captive (Gujarat GEOA) · assumed',
  costs: { supply: null, storage: null, delivery: null, service: null }, // ₹/MWh cost to serve
  marginDef: 'Tariff minus cost to serve, per MWh delivered',
  investmentCr: null, fundingSplit: null, irr: null, irrBasis: null,
  gridTariffPerMWh: null,          // DISCOM tariff for residual supply
  exchangePerMWh: null,            // average green exchange price
  monthlyBillCr: null              // monthly electricity bill the credit rule applies to
};
const finReady = k => FIN[k] !== null && FIN[k] !== undefined;
const rupees = v => '₹' + Math.round(v).toLocaleString('en-IN');
const crore = v => '₹' + (v / 1e7).toFixed(2) + ' cr';
const PENDING = '<span class="pend-chip">finance validation pending</span>';

/* Three distinct evidence stages */
function stageStrip(M, compact) {
  const unresolved = M.unresolved || 0;
  const st = [
    ['Operational estimate', 'done', pc(M.physicalMatched / M.load)],
    ['Evidence reconciled', unresolved ? 'part' : 'done', pc(M.scoreComplete) + (unresolved ? ' · ' + unresolved + ' h unresolved' : '')],
    ['Independently verified', 'wait', 'assurance pending']
  ];
  return `<div class="stages ${compact ? 'compact' : ''}">${st.map(([n, s, v], i) => `<div class="stg ${s}"><span class="ic">${s === 'done' ? '✓' : s === 'part' ? '!' : '…'}</span><span><b>${n}</b><br><span class="small muted">${v}</span></span>${i < 2 ? '<span class="arr">→</span>' : ''}</div>`).join('')}</div>`;
}
const promiseBox = (t = 90, extra = '') => `<div class="promise"><b>${CFE_PROMISE(t).split('. ')[0]}.</b> ${CFE_PROMISE(t).split('. ')[1]}${extra}</div>`;

/* Same-assets comparison: fixed-schedule operation vs CFE Manager, identical assets, weather and events */
function sameAssets(events) {
  const ev = events || state.events.flatMap(e => e.ev);
  const A = SIM.run(P, { ...state.cfg, policy: 'naive' }, ev), B = SIM.run(P, state.cfg, ev);
  const row = Rx => ({ score: Rx.M.scoreComplete, grid: Rx.M.grid + Rx.M.bessInelig, mkt: Rx.M.mkt, below: SIM.below(Rx, state.tier), bess: Rx.M.bessElig, surplus: Rx.M.surplusExcl });
  return { A: row(A), B: row(B) };
}

/* Money for a quantity of grid / exchange MWh, or a pending marker */
function costOf(gridMWh, mktMWh) {
  if (!finReady('gridTariffPerMWh') || !finReady('exchangePerMWh')) return null;
  return gridMWh * FIN.gridTariffPerMWh + mktMWh * FIN.exchangePerMWh;
}
function creditMoney(score, tier) {
  const sc = SIM.serviceCredit(score, tier);
  return { ...sc, rupees: finReady('monthlyBillCr') ? sc.creditPct / 100 * FIN.monthlyBillCr * 1e7 : null };
}

/* Scenario brief: what happened → what we decided → what it cost → what the customer can claim */
const DECIDED = {
  windLull: 'Battery discharge brought forward; green intraday blocks requested through the trading member; SLDC schedule revised.',
  bessOut: 'Battery removed from the plan; extra green blocks requested within the bid limit; uncovered demand left on normal grid supply.',
  loadRamp: 'Discharge plan raised; extra blocks requested; drawal schedule revised with the SLDC.',
  solarDown: 'Battery charge target lowered; injection schedule revised.',
  mktSpike: 'No bid above the mandate limit; residual left on grid supply and counted at zero.',
  txConstraint: 'Schedule kept inside the deliverable limit; curtailment logged as an excluded network event.',
  gridCharge: 'Charge-source ledger updated; grid share of the battery excluded; non-conformance raised with the operator.',
  meterOutage: 'Affected hours marked unresolved; backfill requested; certificate issuance held.',
  issuerOutage: 'Matches held as unresolved; no claim published until certificates are cancelled.',
  badWeek: 'Daily re-planning; early-warning notice to the customer under the incident SLA.'
};
function scenarioBrief() {
  if (!state.events.length) return '';
  const e = state.events[state.events.length - 1], from = Math.min(...state.events.flatMap(x => x.ev.map(v => v.from))), to = Math.max(...state.events.flatMap(x => x.ev.map(v => v.to)));
  let g = 0, g0 = 0, m = 0, m0 = 0, L = 0, c = 0;
  for (let i = from; i < Math.min(to, SIM.NB); i++) { const b = R.blocks[i], b0 = R0.blocks[i]; g += b.gridToLoad + b.dis - b.disElig; g0 += b0.gridToLoad + b0.dis - b0.disElig; m += b.mkt; m0 += b0.mkt; L += b.L; c += b.solarDir + b.windDir + b.disElig + b.mkt; }
  const q = SIM.DT, dG = (g - g0) * q, dM = (m - m0) * q, cost = costOf(dG, dM), cr = creditMoney(R.M.scoreComplete, state.tier);
  return `<div class="brief">
    <div><span class="eyebrow">What happened</span><p>${state.events.map(x => EVENTS[x.key].name + ' (' + EVENTS[x.key].desc + ')').join('; ')}.</p></div>
    <div><span class="eyebrow">What we decided</span><p>${state.events.map(x => DECIDED[x.key]).join(' ')}</p></div>
    <div><span class="eyebrow">What it cost</span><p>Additional grid purchases <b>${f0(Math.max(0, dG))} MWh</b>; additional exchange purchases <b>${f0(dM)} MWh</b>. Cost: ${cost === null ? PENDING : '<b>' + rupees(cost) + '</b>'}.</p></div>
    <div><span class="eyebrow">What the customer can claim</span><p>Window ${pc(c / L)} clean. Forecast month <b>${pc(R.M.scoreComplete)}</b> vs CFE${state.tier}. Credit exposure <b>${cr.creditPct.toFixed(1)}% of the bill</b>${cr.rupees !== null ? ' (' + rupees(cr.rupees) + ')' : ''}.</p></div>
  </div>`;
}

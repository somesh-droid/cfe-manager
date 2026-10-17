/* ===================== CORE: data, state, helpers ===================== */
const $ = id => document.getElementById(id);
const P = SIM.genProfiles(2026);
const LIVE_CFG = { ...SIM.REF }; // financial-case portfolio: 420 MWac solar, 90 MW wind, 250 MW / 1,000 MWh storage
const BPD = 96;

const f0 = n => Math.round(n).toLocaleString('en-IN');
const f1 = n => (Math.round(n * 10) / 10).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pc = (x, d = 1) => (x * 100).toFixed(d) + '%';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hhmm = mins => { mins = ((mins % 1440) + 1440) % 1440; return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); };
const blkTime = b => hhmm(b * 15);
const dayDate = d => new Date(Date.UTC(2026, 9, d + 1));
const dayLabel = d => dayDate(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const chip = (t, tone = 'neutral') => `<span class="chip ${tone}">${t}</span>`;
const sw = c => `<span class="dotk" style="background:${c}"></span>`;
const kpi = (l, v, s = '', tone = '') => `<div class="kpi ${tone ? 'tone-' + tone : ''}"><span class="l">${l}</span><span class="v">${v}</span>${s ? `<span class="s">${s}</span>` : ''}</div>`;

/* ---------- reference data (illustrative) ---------- */
const ASSETS = [
  { id: 'KTC-SOL-01', name: 'Kutch Solar Park', owner: 'Reliance affiliate SPV', tech: 'Solar PV', cap: () => state.cfg.solar + ' MWac', state: 'Gujarat', district: 'Kutch', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Monitor', contract: 'Affiliate PPA, energy + attributes, arm’s length', c: 'var(--solar)' },
  { id: 'KTC-WND-02', name: 'Kutch Wind Farm', owner: 'Third-party IPP', tech: 'Wind', cap: () => state.cfg.wind + ' MW', state: 'Gujarat', district: 'Kutch', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Monitor', contract: '15-yr PPA, energy + attributes + data rights', c: 'var(--wind)' },
  { id: 'JMN-BES-01', name: 'Jamnagar Battery', owner: 'Storage operator', tech: 'BESS', cap: () => state.cfg.bessMW + ' MW / ' + state.cfg.bessMWh + ' MWh', state: 'Gujarat', district: 'Jamnagar', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Monitor', contract: 'Tolling: availability, SoC limits, cycling cap', c: 'var(--bess)' },
  { id: 'GTAM-TRD-01', name: 'Green exchange blocks', owner: 'Licensed trading member', tech: 'Exchange (G-DAM / G-TAM)', cap: () => 'up to ' + state.cfg.mkt + ' MW', state: 'Gujarat', district: '—', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Monitor', contract: 'Trading mandate, agency basis', c: 'var(--mkt)' },
  { id: 'KTC-SOL-03', name: 'Kutch Solar Phase 3', owner: 'Reliance affiliate SPV', tech: 'Solar PV', cap: () => '150 MWac', state: 'Gujarat', district: 'Kutch', cod: 0, rights: 1, attrExclusive: 1, meter: 0, sched: 0, stage: 'Negotiate', contract: 'Term sheet; COD pending', c: 'var(--solar)' },
  { id: 'BHJ-WND-05', name: 'Bhuj Wind', owner: 'Third-party IPP', tech: 'Wind', cap: () => '90 MW', state: 'Gujarat', district: 'Kutch', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Simulate', contract: '12-month backtest running', c: 'var(--wind)' },
  { id: 'MRB-HYB-02', name: 'Morbi Hybrid', owner: 'Third-party IPP', tech: 'Solar + wind', cap: () => '120 MW', state: 'Gujarat', district: 'Morbi', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Qualify', contract: 'Diligence: lender consent', c: 'var(--wind)' },
  { id: 'DHJ-BES-03', name: 'Dahej Storage', owner: 'Storage developer', tech: 'BESS', cap: () => '100 MW / 400 MWh', state: 'Gujarat', district: 'Bharuch', cod: 0, rights: 0, attrExclusive: 1, meter: 0, sched: 0, stage: 'Long-list', contract: 'RFI response received', c: 'var(--bess)' },
  { id: 'RJ-WND-07', name: 'Jaisalmer Wind', owner: 'Third-party IPP', tech: 'Wind', cap: () => '100 MW', state: 'Rajasthan', district: 'Jaisalmer', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1, stage: 'Rejected', contract: '—', c: 'var(--wind)' },
  { id: 'TP-SOL-11', name: 'Surendranagar Solar', owner: 'Third-party IPP', tech: 'Solar PV', cap: () => '80 MWac', state: 'Gujarat', district: 'Surendranagar', cod: 1, rights: 1, attrExclusive: 0, meter: 1, sched: 1, stage: 'Rejected', contract: '—', c: 'var(--solar)' }
];
const SUP_STAGES = ['Long-list', 'Qualify', 'Simulate', 'Negotiate', 'Activate', 'Monitor'];

const CUST_STAGES = ['Account mapping', 'Discovery', 'Diagnostic', 'Term sheet', 'Diligence', 'Conditional contract', 'Live service'];
const COMMITTEE = ['Energy procurement', 'Sustainability', 'Facilities / O&M', 'Finance & treasury', 'Legal & regulatory', 'Cybersecurity', 'Global procurement'];
const CUSTOMERS = [
  { id: 'HSA', name: 'Hyperscaler A', site: 'JMN-DC-01 · Jamnagar', state: 'Gujarat', type: 'Hyperscale data centre', mw: 100, tier: 90, stage: 6, icp: [24, 23, 18, 14, 13], committee: [1, 1, 1, 1, 1, 1, 1], next: 'Quarterly performance council, 4 Nov', live: true },
  { id: 'AIC', name: 'AI Campus C (Reliance-controlled)', site: 'Jamnagar', state: 'Gujarat', type: 'Internal AI compute load', mw: 120, tier: 90, stage: 4, icp: [25, 22, 16, 15, 14], committee: [1, 1, 1, 0, 1, 0, 1], next: 'Shadow-mode meter integration; CISO sign-off' },
  { id: 'MFD', name: 'Manufacturer D', site: 'Dahej', state: 'Gujarat', type: 'Continuous-process plant', mw: 45, tier: 70, stage: 3, icp: [20, 21, 12, 12, 11], committee: [1, 1, 0, 0, 0, 1, 0], next: 'Term-sheet review with legal' },
  { id: 'COB', name: 'Colocation B', site: 'Navi Mumbai', state: 'Maharashtra', type: 'Colocation data centre', mw: 60, tier: 90, stage: 2, icp: [18, 9, 17, 13, 12], committee: [1, 1, 0, 0, 0, 0, 0], next: 'State gate: Maharashtra delivery route' },
  { id: 'COE', name: 'Cloud E', site: 'Hyderabad', state: 'Telangana', type: 'Cloud region', mw: 40, tier: 95, stage: 1, icp: [15, 5, 19, 10, 12], committee: [1, 0, 0, 0, 0, 0, 0], next: 'Discovery call; NDA' },
  { id: 'ENF', name: 'Enterprise F', site: 'Pune', state: 'Maharashtra', type: 'Enterprise campus', mw: 25, tier: 70, stage: 0, icp: [10, 8, 8, 9, 8], committee: [0, 0, 0, 0, 0, 0, 0], next: 'Identify power-contract owner' }
];
const ICP_PARTS = [['Procurement authority + contract window', 25], ['Eligible supply / delivery route', 25], ['Time-matched goal + budget owner', 20], ['15-min meter data + evidence rights', 15], ['Load density, credit, tenor', 15]];

const CONTRACT_STACK = [
  { doc: 'Master CFE Services Agreement', parties: 'CF90 Services ↔ Hyperscaler A', status: 'Signed', tone: 'good', terms: 'Monthly CFE90 score, evidence method v1.0, service credits (capped), change-in-law, step-in, termination', owner: 'Commercial + legal' },
  { doc: 'Supply PPA · KTC-SOL-01', parties: 'Solar SPV ↔ buying entity', status: 'Signed', tone: 'good', terms: 'Shape, injection point, curtailment allocation, exclusive attribute transfer, data rights', owner: 'Procurement' },
  { doc: 'Supply PPA · KTC-WND-02', parties: 'Wind IPP ↔ buying entity', status: 'Signed', tone: 'good', terms: 'Availability, scheduling via QCA, outage notice, attribute title, lender consent', owner: 'Procurement' },
  { doc: 'Storage tolling · JMN-BES-01', parties: 'Storage operator ↔ CF90 Services', status: 'Signed', tone: 'good', terms: 'Dispatch rights, SoC 10–95%, cycling cap, charge-source logging, availability SLA', owner: 'Portfolio' },
  { doc: 'Trading mandate', parties: 'Licensed trading member ↔ buying entity', status: 'Signed', tone: 'good', terms: 'Agency basis, bid limits, product list (G-DAM, G-TAM), collateral, confirmations', owner: 'Trading + treasury' },
  { doc: 'Green open access approvals', parties: 'Buying entity ↔ State nodal agency / DISCOM / SLDC', status: 'Approved', tone: 'good', terms: 'Connectivity, scheduling, banking, losses and charges per current GERC GEOA regulations', owner: 'Regulatory' },
  { doc: 'Captive SPV shareholders agreement', parties: 'Hyperscaler A ↔ Solar SPV', status: 'Assumed · under counsel review', tone: 'warn', terms: 'Captive eligibility assumed, not established. ≥26% ownership, ≥51% annual captive consumption, CSS/AS allocation if status fails', owner: 'Legal + SPV governance' },
  { doc: 'Attribute & verification package', parties: 'GC issuer · CF90 · verifier · buyer', status: 'Signed', tone: 'good', terms: 'Issuance, exclusive cancellation to buyer, matching method, verifier access, corrections', owner: 'Sustainability assurance' },
  { doc: 'Data & security schedule', parties: 'CF90 Services ↔ Hyperscaler A', status: 'Signed', tone: 'good', terms: 'Meter data only, read-only APIs, no workload data, incident notice, audit logs', owner: 'CISO' }
];
const RISK_ALLOC = [
  ['Solar / wind under-performance', 'CF90 portfolio (within service-credit cap)'], ['Battery outage', 'Storage operator (tolling SLA) → CF90'], ['Exchange non-clearing', 'CF90; bid limits per mandate'],
  ['Transmission congestion', 'Pass-through as excluded event, logged'], ['Meter data gap', 'Party owning the meter; hours unresolved until backfilled'], ['Captive status failure', 'Allocated in SHA (CSS/AS + carrying cost)'],
  ['Change in law / charges', 'Re-opener and termination rights'], ['Customer load outside band', 'Customer, per deviation band']
];

const ECO = [
  { id: 'cust', name: 'Customers', sub: 'Data centres, AI campuses, plants', kind: 'Platform user', iface: 'Portal + read-only meter API', send: 'Monthly statement (reconciled, then assured), advisories, evidence pack', recv: '15-min meter data, load forecast, optional flexibility envelope', cadence: 'Daily feed · monthly statement', owner: 'Key account' },
  { id: 'sup', name: 'Generators', sub: 'Solar and wind IPPs, affiliate SPVs', kind: 'Platform user', iface: 'Supplier portal + SCADA/forecast feed', send: 'Schedules, curtailment notices, PPA settlement statements', recv: 'Availability, forecasts, meter data, attribute title', cadence: 'Day-ahead + intraday', owner: 'Procurement' },
  { id: 'bess', name: 'Storage operators', sub: 'Tolled batteries', kind: 'Platform user', iface: 'Signed dispatch API (operator confirms)', send: 'Charge/discharge instructions within SoC limits', recv: 'SoC, availability, charge-source log', cadence: 'Every 15-min block', owner: 'Portfolio desk' },
  { id: 'tm', name: 'Licensed trading member', sub: 'Executes on IEX for us', kind: 'Partner', iface: 'Order requests via member terminal / API', send: 'Bid requests within mandate limits', recv: 'Trade confirmations, obligation reports', cadence: 'D-1 10:00 and intraday', owner: 'Trading lead' },
  { id: 'iex', name: 'Power exchange (IEX)', sub: 'G-DAM, G-TAM, RTM', kind: 'Market infrastructure', iface: 'Through member only — no direct link', send: '—', recv: 'Market prices, cleared volumes (via member)', cadence: 'Daily auctions', owner: 'Trading lead' },
  { id: 'sldc', name: 'SLDC Gujarat / WRLDC', sub: 'Scheduling and system operation', kind: 'Statutory', iface: 'Scheduling coordinator submits on standard formats', send: 'Day-ahead schedules, permitted revisions', recv: 'Schedule acceptance, energy accounts, deviation statements', cadence: 'D-1, intraday, weekly accounts', owner: 'Grid interface lead' },
  { id: 'nldc', name: 'NLDC / State nodal agency', sub: 'Captive and open-access verification', kind: 'Statutory', iface: 'Filings and declarations', send: 'Ownership and consumption declarations', recv: 'Captive status verification', cadence: 'Annual', owner: 'Legal + SPV governance' },
  { id: 'ctu', name: 'CTUIL / GETCO (STU)', sub: 'Connectivity and network access', kind: 'Statutory', iface: 'Applications per detailed procedure', send: 'Connectivity / GNA applications', recv: 'Grants, constraints, effective dates', cadence: 'Project stage', owner: 'Grid interface lead' },
  { id: 'reg', name: 'GERC / CERC', sub: 'Regulators', kind: 'Statutory', iface: 'Compliance monitoring, petitions if needed', send: 'Filings where required', recv: 'Regulations, amendments, tariff orders', cadence: 'Per amendment', owner: 'Regulatory counsel' },
  { id: 'discom', name: 'DISCOM', sub: 'Residual and standby supply', kind: 'Statutory', iface: 'Open-access agreement, billing', send: 'Open-access schedules', recv: 'Residual supply bills, standby', cadence: 'Monthly', owner: 'Regulatory' },
  { id: 'gc', name: 'GC issuer / registry', sub: 'Proposed · simulated in this prototype', kind: 'Partner', iface: 'Registry API: issue, transfer, cancel', send: 'Validated meter data, issuance requests', recv: 'Certificate serials, cancellation records', cadence: 'Monthly (target weekly)', owner: 'Claims lead' },
  { id: 'ver', name: 'Independent verifier', sub: 'Claim assurance', kind: 'Partner', iface: 'Read-only ledger access', send: 'Evidence pack, method, exceptions', recv: 'Assurance opinion on monthly score', cadence: 'Monthly / quarterly', owner: 'Sustainability assurance' }
];
const CALENDAR = [
  ['D-1 09:30', 'Generators, customer', 'Availability, generation and load forecasts in'],
  ['D-1 10:00', 'Trading member → IEX', 'G-DAM bid requests within mandate'],
  ['D-1 13:00', 'IEX → trading member', 'Clearing; confirmations to CFE Manager'],
  ['D-1 14:00', 'Scheduling coordinator → SLDC', 'Day-ahead injection and drawal schedules'],
  ['D-1 18:00', 'CFE Manager → battery operator', 'Next-day charge / discharge plan'],
  ['Day D', 'All operating parties', 'Intraday revisions within permitted blocks; G-TAM top-ups'],
  ['D+1 08:00', 'Meters → CFE Manager', '15-minute meter data for generation and customer site'],
  ['D+1 10:00', 'CFE Manager → GC registry', 'Issuance for eligible MWh; cancellation to buyer'],
  ['Weekly', 'SLDC / RLDC → CFE Manager', 'Energy accounts and deviation statements reconciled'],
  ['Monthly', 'CFE Manager → verifier → customer', 'Evidence pack, assurance, verified statement'],
  ['Annually', 'SPV → nodal agency / NLDC', 'Captive ownership and consumption verification']
];
const STATES = ['Gujarat', 'Maharashtra', 'Telangana', 'Tamil Nadu', 'Karnataka'];
const STATE_GATES = ['Customer', 'Regulation', 'Assets', 'Grid route', 'Evidence', 'Counterparties', 'Commercial', 'Governance'];
const STATE_STATUS = {
  'Gujarat': [2, 2, 2, 2, 2, 2, 1, 2], 'Maharashtra': [2, 1, 0, 1, 1, 1, 0, 1], 'Telangana': [1, 1, 0, 0, 1, 0, 0, 0], 'Tamil Nadu': [1, 1, 0, 0, 1, 0, 0, 0], 'Karnataka': [0, 1, 0, 0, 1, 0, 0, 0]
};
const STATE_NOTES = {
  'Gujarat': 'Pilot state. Qualified Kutch supply, Jamnagar storage, GEOA route approved for the live account. Commercial gate re-checked per new customer.',
  'Maharashtra': 'Demand is strong, but no qualified in-state supply yet. Kutch power needs an inter-state route (GNA) and MERC open-access charges must be confirmed. Tata Power–Flexidao hourly matching already serves at least one Mumbai campus.',
  'Telangana': 'Target data-centre market. No qualified supply or delivery route. Offer diagnostic and shadow monitoring only.',
  'Tamil Nadu': 'Strong wind resource, but no contracted assets or local partners. Offer diagnostic only until the gates clear.',
  'Karnataka': 'No named buyer yet. Not in the first wave.'
};

/* ---------- state ---------- */
const state = {
  role: 'manager', view: 'control', cfg: { ...LIVE_CFG }, tier: 90,
  day: 13, block: 84, events: [], evSel: 0, hourSel: 23,
  acct: 'HSA', supSel: 'KTC-WND-02', ecoSel: 'tm',
  newSuppliers: [], newCustomers: [],
  cw: { step: 0, f: null, diag: null, prop: null, tierPick: 90 },
  sw: { step: 0, f: null, gates: null, value: null },
  feas: null, feasForm: { name: 'Colocation B', state: 'Maharashtra', mw: 60, shape: 'flat', tier: 90 },
  acks: {}, playing: false
};
let R, R0;
function recompute() { R = SIM.run(P, state.cfg, state.events.flatMap(e => e.ev)); R0 = SIM.run(P, state.cfg, []); }

/* ---------- event presets (anchored to the selected day) ---------- */
const EVENTS = {
  windLull: { name: 'Wind lull tonight', desc: 'Wind −65% from 18:00 to 06:00', make: d => [{ k: 'windLull', from: d * BPD + 72, to: d * BPD + BPD + 24, factor: 0.35 }], detect: d => d * 1440 + 990 },
  bessOut: { name: 'Battery trips at 22:30', desc: 'JMN-BES-01 unavailable until 06:00', make: d => [{ k: 'bessOut', from: d * BPD + 90, to: d * BPD + BPD + 24 }], detect: d => d * 1440 + 1350 },
  loadRamp: { name: 'Customer AI training run', desc: '+20 MW from 20:00 to 04:00', make: d => [{ k: 'loadRamp', from: d * BPD + 80, to: d * BPD + BPD + 16, mw: 20 }], detect: d => d * 1440 + 1080 },
  solarDown: { name: 'Cloud cover', desc: 'Solar −40% from 08:00 to 17:00', make: d => [{ k: 'solarDown', from: d * BPD + 32, to: d * BPD + 68, factor: 0.6 }], detect: d => d * 1440 + 330 },
  mktSpike: { name: 'Exchange does not clear', desc: 'No green blocks within bid limit, 18:00–24:00', make: d => [{ k: 'mktSpike', from: d * BPD + 72, to: d * BPD + 96 }], detect: d => d * 1440 + 780 },
  txConstraint: { name: 'Transmission constraint', desc: 'Kutch evacuation capped at 150 MW, 09:00–17:00', make: d => [{ k: 'txConstraint', from: d * BPD + 36, to: d * BPD + 68, cap: 150 }], detect: d => d * 1440 + 480 },
  gridCharge: { name: 'Battery charged from grid', desc: 'Off-plan grid charging 02:00–05:00', make: d => [{ k: 'gridCharge', from: d * BPD, to: d * BPD + BPD }], detect: d => d * 1440 + 300 },
  meterOutage: { name: 'Customer meter gap', desc: 'Site meter feed missing 02:00–08:00', make: d => [{ k: 'meterOutage', from: d * BPD + 8, to: d * BPD + 32 }], detect: d => d * 1440 + 500 },
  issuerOutage: { name: 'Certificate issuer delay', desc: 'Issuance backlog for three days', make: d => [{ k: 'issuerOutage', from: d * BPD, to: d * BPD + 3 * BPD }], detect: d => d * 1440 + 1440 + 600 },
  badWeek: { name: 'A bad week of wind', desc: 'Wind −65% for seven days', make: d => [{ k: 'windLull', from: d * BPD, to: Math.min(30, d + 7) * BPD, factor: 0.35 }], detect: d => d * 1440 + 360 }
};
function addEvent(key, d = state.day) {
  if (state.events.some(e => e.key === key && e.d === d)) return;
  state.events.push({ key, d, ev: EVENTS[key].make(d), detect: EVENTS[key].detect(d) });
  state.evSel = state.events.length - 1;
}
function clearEvents() { state.events = []; state.evSel = 0; state.acks = {}; }

/* ---------- small chart helpers ---------- */
const LAYERS = [
  { k: 'solarDir', name: 'Solar', c: 'var(--solar)' }, { k: 'windDir', name: 'Wind', c: 'var(--wind)' },
  { k: 'disElig', name: 'Battery (clean)', c: 'var(--bess)' }, { k: 'disX', name: 'Battery (grid-charged)', c: 'var(--bess-x)', zero: 1 },
  { k: 'mkt', name: 'Green exchange blocks', c: 'var(--mkt)' }, { k: 'gridToLoad', name: 'Grid residual', c: 'var(--grid)', zero: 1 }
];
function legendHTML() {
  return LAYERS.map(L => `<span>${sw(L.c)}${L.name}${L.zero ? '<span class="zero">0 CFE</span>' : ''}</span>`).join('') +
    `<span><svg width="20" height="8" aria-hidden="true"><line x1="0" x2="20" y1="4" y2="4" stroke="var(--load)" stroke-width="2"/></svg> Load</span><span><svg width="20" height="8" aria-hidden="true"><line x1="0" x2="20" y1="4" y2="4" stroke="var(--ink)" stroke-width="1.3" stroke-dasharray="4 3"/></svg> Day-ahead clean forecast</span>`;
}
function dayChartSVG(d, opts = {}) {
  const bs = R.blocks.slice(d * BPD, d * BPD + BPD).map(b => ({ ...b, disX: b.dis - b.disElig }));
  const W = 1000, H = opts.h || 300, ml = 44, mr = 10, mt = 16, mb = 26, pw = W - ml - mr, ph = H - mt - mb;
  const maxPos = Math.max(...bs.map(b => Math.max(b.L, b.fc)));
  const maxNeg = Math.max(...bs.map(b => b.chg + b.gc + b.surplusExcl));
  const top = Math.ceil(Math.max(120, maxPos) / 50) * 50, bot = -Math.ceil(Math.max(50, Math.min(maxNeg, 350)) / 50) * 50;
  const y = v => mt + (top - v) / (top - bot) * ph, bw = pw / 96, x = i => ml + i * bw;
  let g = '';
  bs.forEach((b, i) => { if (b.ev) g += `<rect x="${x(i)}" y="${mt}" width="${bw + .3}" height="${ph}" fill="#B0271E" opacity=".05"/>`; });
  for (let v = bot; v <= top; v += 50) g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? 'var(--muted)' : 'var(--line-2)'}"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  g += `<text x="${ml}" y="${mt - 4}" style="font-size:10px">MW</text>`;
  if (opts.hour != null) g += `<rect x="${x(opts.hour * 4)}" y="${mt}" width="${bw * 4}" height="${ph}" fill="var(--brand-2)" opacity=".1"/>`;
  bs.forEach((b, i) => {
    let a = 0;
    LAYERS.forEach(L => { const v = b[L.k]; if (v > 1e-6) { g += `<rect x="${x(i).toFixed(1)}" y="${y(a + v).toFixed(1)}" width="${(bw + .4).toFixed(1)}" height="${(y(a) - y(a + v)).toFixed(1)}" fill="${L.c}"/>`; a += v; } });
    let n = 0;
    [['chg', 'var(--bess)', .4], ['gc', 'var(--grid)', .7], ['surplusExcl', 'var(--excl)', 1]].forEach(([k, c, o]) => { const v = b[k]; if (v > 1e-6) { g += `<rect x="${x(i).toFixed(1)}" y="${y(n).toFixed(1)}" width="${(bw + .4).toFixed(1)}" height="${(y(n - v) - y(n)).toFixed(1)}" fill="${c}" opacity="${o}"/>`; n -= v; } });
  });
  const step = k => bs.map((b, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(b[k]).toFixed(1)} L${(x(i) + bw).toFixed(1)},${y(b[k]).toFixed(1)}`).join(' ');
  g += `<path d="${step('fc')}" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-dasharray="4 4" opacity=".65"/><path d="${step('L')}" fill="none" stroke="var(--load)" stroke-width="2"/>`;
  if (opts.block != null) g += `<line x1="${x(opts.block) + bw / 2}" x2="${x(opts.block) + bw / 2}" y1="${mt}" y2="${mt + ph}" stroke="var(--brand)" stroke-width="2"/><circle cx="${x(opts.block) + bw / 2}" cy="${mt}" r="4" fill="var(--brand)"/>`;
  for (let hh = 0; hh <= 24; hh += 3) g += `<text x="${x(hh * 4)}" y="${H - 7}" text-anchor="${hh === 0 ? 'start' : hh === 24 ? 'end' : 'middle'}">${String(hh).padStart(2, '0')}:00</text>`;
  g += `<text x="${ml + 4}" y="${y(0) + 13}" style="font-size:10px">below zero: battery charging · surplus not counted</text>`;
  return `<div class="chart" data-daychart="${d}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Dispatch by quarter hour for ${dayLabel(d)}">${g}<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" fill="transparent" class="clickable"/></svg><span class="wm">SIMULATED</span></div>`;
}
function bindDayChart(root, cb) {
  root.querySelectorAll('[data-daychart] svg').forEach(svg => svg.addEventListener('click', e => {
    const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * 1000;
    const blk = Math.floor((vx - 44) / (946 / 96)); if (blk >= 0 && blk < 96) cb(blk);
  }));
}
const bin = c => c >= 0.99 ? 4 : c >= 0.9 ? 3 : c >= 0.7 ? 2 : c >= 0.5 ? 1 : 0;
function heatSVG(Rx, selD, selH) {
  const cw = 34, ch = 15, ml = 50, mt = 18, W = ml + 24 * cw + 4, H = mt + SIM.DAYS * ch + 4;
  let g = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#B0271E" stroke-width="2"/></pattern></defs>`;
  for (let h = 0; h < 24; h += 3) g += `<text x="${ml + h * cw + 2}" y="12">${String(h).padStart(2, '0')}:00</text>`;
  Rx.hours.forEach(o => {
    const xx = ml + o.h * cw, yy = mt + o.d * ch;
    const fill = o.status === 'INCOMPLETE' ? 'fill="url(#hatch)"' : `fill="var(--h${bin(o.cfe)})"`;
    g += `<rect class="hc clickable" data-d="${o.d}" data-h="${o.h}" ${fill} x="${xx + 1}" y="${yy + 1}" width="${cw - 2}" height="${ch - 2}" rx="2" ${o.status === 'PROVISIONAL' ? 'stroke="#C98A12" stroke-width="1.5" stroke-dasharray="2 2"' : ''}><title>${dayLabel(o.d)} ${String(o.h).padStart(2, '0')}:00 · ${pc(o.cfe)} · ${o.status}</title></rect>`;
  });
  for (let d = 0; d < SIM.DAYS; d++) if (d % 3 === 0 || d === selD) g += `<text x="${ml - 6}" y="${mt + d * ch + 11}" text-anchor="end" ${d === selD ? 'style="fill:var(--ink);font-weight:600"' : ''}>${d + 1} Oct</text>`;
  if (selD != null) g += `<rect x="${ml + selH * cw}" y="${mt + selD * ch}" width="${cw}" height="${ch}" fill="none" stroke="var(--ink)" stroke-width="2" rx="2"/>`;
  return `<div class="chart" style="overflow-x:auto"><div style="min-width:680px;position:relative"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hourly CFE across the month">${g}</svg><span class="wm">SIMULATED</span></div></div>`;
}
const heatLegend = () => `<div class="legend">${[['h0', '<50%'], ['h1', '50–70'], ['h2', '70–90'], ['h3', '90–99'], ['h4', '≥99']].map(([c, l]) => `<span>${sw(`var(--${c})`)}${l}</span>`).join('')}<span>${sw('repeating-linear-gradient(45deg,#B0271E 0 2px,#fff 2px 5px)')}meter gap</span><span><span class="dotk" style="border:1.5px dashed #C98A12;background:none"></span>certificates pending</span></div>`;

/* ---------- toast ---------- */
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }

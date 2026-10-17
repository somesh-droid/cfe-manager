/* ===================== BUSINESS: platform value, commercials, Reliance advantage, expansion ===================== */

/* ---------- same-assets comparison ---------- */
function gridByHour(cfgX, ev) {
  const Rx = SIM.run(P, cfgX, ev), out = new Array(24).fill(0);
  Rx.hours.forEach(o => out[o.h] += o.grid + o.bessInelig);
  return out.map(v => v / SIM.DAYS);
}
function pairBarsSVG(a, b, W = 640, H = 220) {
  const ml = 40, mr = 10, mt = 14, mb = 26, pw = W - ml - mr, ph = H - mt - mb, bw = pw / 24, mx = Math.max(5, ...a, ...b) * 1.1, y = v => mt + ph * (1 - v / mx);
  let g = '';
  [0, mx / 2, mx].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end" style="font-size:10px">${Math.round(v)}</text>`);
  a.forEach((v, h) => { const x = ml + h * bw; g += `<rect x="${x + 2}" y="${y(v)}" width="${bw / 2 - 2}" height="${y(0) - y(v)}" fill="var(--grid)" rx="1.5"><title>${h}:00 fixed schedule ${f1(v)} MWh</title></rect><rect x="${x + bw / 2}" y="${y(b[h])}" width="${bw / 2 - 2}" height="${y(0) - y(b[h])}" fill="var(--brand)" rx="1.5"><title>${h}:00 CFE Manager ${f1(b[h])} MWh</title></rect>`; });
  for (let h = 0; h < 24; h += 3) g += `<text x="${ml + h * bw + bw / 2}" y="${H - 8}" text-anchor="middle" style="font-size:10px">${String(h).padStart(2, '0')}</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Average grid MWh by hour, fixed schedule versus CFE Manager">${g}</svg></div>`;
}
V.value = () => {
  const ev = state.events.flatMap(e => e.ev), c = sameAssets(ev), A = c.A, B = c.B;
  const gA = gridByHour({ ...state.cfg, policy: 'naive' }, ev), gB = gridByHour(state.cfg, ev);
  const costA = costOf(A.grid, A.mkt), costB = costOf(B.grid, B.mkt);
  const rows = [
    ['Monthly CFE score', pc(A.score), pc(B.score), (B.score - A.score) * 100 >= 0 ? '+' + ((B.score - A.score) * 100).toFixed(1) + ' pts' : ((B.score - A.score) * 100).toFixed(1) + ' pts'],
    ['Meets CFE' + state.tier + ' floor', A.score * 100 >= state.tier ? 'Yes' : 'No', B.score * 100 >= state.tier ? 'Yes' : 'No', ''],
    ['Hours below ' + state.tier + '%', A.below, B.below, (B.below - A.below) + ' h'],
    ['Grid purchases (count at zero)', f0(A.grid) + ' MWh', f0(B.grid) + ' MWh', f0(B.grid - A.grid) + ' MWh'],
    ['Green exchange purchases', f0(A.mkt) + ' MWh', f0(B.mkt) + ' MWh', (B.mkt - A.mkt >= 0 ? '+' : '') + f0(B.mkt - A.mkt) + ' MWh'],
    ['Stored clean energy used', f0(A.bess) + ' MWh', f0(B.bess) + ' MWh', (B.bess - A.bess >= 0 ? '+' : '') + f0(B.bess - A.bess) + ' MWh'],
    ['Procurement cost', costA === null ? PENDING : rupees(costA), costB === null ? PENDING : rupees(costB), costA === null ? '' : rupees(costB - costA)],
    ['Battery MWh with charge-source evidence', 'not tracked', f0(B.bess) + ' MWh', 'claimable only with tracking']
  ];
  return `
  <div class="toolbar"><div class="ptitle"><h1>Platform value</h1><span class="sub">Same customer, same weather, same assets. Only the operating decisions differ.</span></div><div class="row">${eventControls()}</div></div>
  ${activeChips()}
  <div class="g21">
    <div class="panel"><div class="ph"><h3>Without coordination vs with CFE Manager</h3><span class="sub">${PERIOD}</span></div>
      <div class="tw"><table><thead><tr><th></th><th class="r">Fixed schedule</th><th class="r">With CFE Manager</th><th class="r">Difference</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${r[0]}</td><td class="r num">${r[1]}</td><td class="r num" style="font-weight:600">${r[2]}</td><td class="r num muted">${r[3]}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="small muted" style="margin-top:10px">The score rows assume the same evidence on both sides, so the difference comes from scheduling alone. Without charge-source tracking, the stored energy above could not be claimed at all.</p></div>
    <div class="panel"><div class="ph"><h3>How each side operates</h3></div>
      <div class="stack" style="gap:10px">
        <div class="cmp"><span class="dotk" style="background:var(--grid)"></span><div><b>Fixed schedule</b><p class="small muted">The battery discharges at a constant rate from 18:00 to 06:00, whatever the wind does. Exchange blocks are bought day-ahead for 18:00–24:00 only. Each asset follows its own timetable.</p></div></div>
        <div class="cmp"><span class="dotk" style="background:var(--brand)"></span><div><b>CFE Manager</b><p class="small muted">Discharge follows the forecast gap in each 15-minute block, so stored energy is kept for the hours wind leaves uncovered. Intraday blocks are requested only when a gap remains, within the bid limit.</p></div></div>
        <div class="callout small">We do not count the value of extra assets here. Both sides use ${state.cfg.solar} MWac solar, ${state.cfg.wind} MW wind and ${state.cfg.bessMW} MW / ${state.cfg.bessMWh} MWh storage.</div>
      </div></div>
  </div>
  <div class="panel"><div class="ph"><h3>Where the difference comes from</h3><div class="legend"><span>${sw('var(--grid)')}Fixed schedule</span><span>${sw('var(--brand)')}CFE Manager</span><span class="muted">average grid MWh per hour of day</span></div></div>${pairBarsSVG(gA, gB, 1000, 240)}
    <p class="small muted">Most of the gain falls in the hours before dawn: a fixed schedule spends stored energy early on windy evenings and runs short later.</p></div>`;
};

/* ---------- commercials ---------- */
function waterfallSVG() {
  const W = 640, H = 260, ml = 40, mt = 20, mb = 36, ph = H - mt - mb;
  const ready = finReady('tariffPerMWh') && Object.values(FIN.costs).every(v => v !== null);
  const items = ready ? [['Tariff', FIN.tariffPerMWh, 'base'], ['Supply', -FIN.costs.supply], ['Storage', -FIN.costs.storage], ['Delivery', -FIN.costs.delivery], ['Service', -FIN.costs.service]] : [['Tariff', 100, 'base'], ['Supply', -40], ['Storage', -18], ['Delivery', -14], ['Service', -8]];
  const margin = items.reduce((a, x) => a + x[1], 0); items.push(['Margin', margin, 'end']);
  const mx = items[0][1] * 1.1, bw = (W - ml - 20) / items.length, y = v => mt + ph * (1 - v / mx);
  let g = '', run = 0;
  items.forEach(([n, v, k], i) => {
    const x = ml + i * bw + 8, w = bw - 16; let top, bot, col;
    if (k === 'base') { top = v; bot = 0; run = v; col = 'var(--brand)'; }
    else if (k === 'end') { top = v; bot = 0; col = 'var(--good)'; }
    else { top = run; bot = run + v; run = bot; col = 'var(--crit)'; }
    g += `<rect x="${x}" y="${y(top)}" width="${w}" height="${Math.max(1, y(bot) - y(top))}" rx="3" fill="${col}" opacity="${ready ? 1 : .22}"/>`;
    g += `<text x="${x + w / 2}" y="${H - 18}" text-anchor="middle" style="font-family:var(--f-body);font-size:12px;fill:var(--ink)">${n}</text>`;
    if (ready) g += `<text x="${x + w / 2}" y="${y(top) - 6}" text-anchor="middle" style="font-size:11px;fill:var(--ink)">${rupees(Math.abs(v))}</text>`;
  });
  if (!ready) g += `<text x="${W - 12}" y="${mt + 4}" text-anchor="end" style="font-family:var(--f-body);font-size:13px;font-weight:600;fill:var(--warn)">Illustrative shape only · finance validation pending</text>`;
  g += `<text x="${ml}" y="${H - 4}" style="font-size:10.5px">₹ per MWh delivered</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Margin waterfall per MWh">${g}</svg></div>`;
}
V.commercial = () => {
  const loadMWh = R.M.load, annual = 100 * 8760;
  const val = (k, fmt) => finReady(k) ? fmt(FIN[k]) : PENDING;
  return `
  <div class="toolbar"><div class="ptitle"><h1>Commercials</h1><span class="sub">How Reliance earns on the service · figures from the team's business model</span></div>${FIN.status === 'pending' ? chip('Finance validation pending', 'warn') : chip('Validated by finance workstream', 'good')}</div>
  <div class="g12">
    <div class="panel"><div class="ph"><h3>Commercial summary</h3><span class="sub">100 MW illustrative customer · ${f0(annual)} MWh a year</span></div>
      <div class="tw"><table class="wraptable"><tbody>
        <tr><td>Customer tariff</td><td class="r">${val('tariffPerMWh', v => rupees(v) + ' / MWh')}</td></tr>
        <tr><td>Delivery route</td><td class="r small">${FIN.route}</td></tr>
        <tr><td>Cost to serve</td><td class="r">${Object.values(FIN.costs).every(v => v !== null) ? rupees(Object.values(FIN.costs).reduce((a, b) => a + b, 0)) + ' / MWh' : PENDING}</td></tr>
        <tr><td>Margin <span class="small muted">(${FIN.marginDef.toLowerCase()})</span></td><td class="r">${finReady('tariffPerMWh') && Object.values(FIN.costs).every(v => v !== null) ? rupees(FIN.tariffPerMWh - Object.values(FIN.costs).reduce((a, b) => a + b, 0)) + ' / MWh' : PENDING}</td></tr>
        <tr><td>New investment</td><td class="r">${val('investmentCr', v => '₹' + f0(v) + ' cr')}</td></tr>
        <tr><td>Funding split, Reliance / customer</td><td class="r">${val('fundingSplit', v => v)}</td></tr>
        <tr><td>Project return</td><td class="r">${finReady('irr') ? FIN.irr + ' (' + FIN.irrBasis + ')' : PENDING}</td></tr>
      </tbody></table></div>
      <p class="small muted" style="margin-top:8px">Nothing on this screen is an investment conclusion. Values appear only once the finance workstream has reconciled them with the business-model deck.</p></div>
    <div class="panel"><div class="ph"><h3>Margin per MWh</h3><span class="sub">tariff → cost to serve → margin</span></div>${waterfallSVG()}</div>
  </div>
  <div class="panel"><div class="ph"><h3>Financial effect of the selected what-if</h3><div class="row">${eventControls()}</div></div>
    ${state.events.length ? scenarioBrief() : '<p class="muted">Choose a what-if to see its extra grid and exchange purchases, the forecast score and the credit exposure.</p>'}
    <p class="small muted" style="margin-top:8px">Credit rule: 2% of the monthly electricity bill per point below the floor, capped at 10%, payable only on the independently verified result.</p></div>`;
};

/* ---------- Reliance advantage ---------- */
const ADVANTAGE = [
  ['Solar manufacturing and generation', 'Integrated PV manufacturing at the Jamnagar giga-complex; renewable generation pipeline in Kutch', 'Announced · ramping', 'warn', 'Supply access and a potential module-cost advantage'],
  ['Battery manufacturing', 'Battery giga-factory at Jamnagar. Manufacturing capacity is not the same as batteries installed for a customer.', 'Announced', 'warn', 'Potential storage-cost and supply-chain advantage'],
  ['Jamnagar internal load', 'Refining and petrochemical complex, plus planned AI compute at Jamnagar', 'Existing', 'good', 'The first place to run shadow mode and prove the method'],
  ['Digital capabilities', 'Jio platforms, data engineering and large-scale operations software', 'Existing', 'good', 'Forecasting, scheduling and evidence management'],
  ['Corporate balance sheet', 'Investment-grade group able to sign long-tenor contracts', 'Existing', 'good', 'Ability to fund assets and stand behind contractual commitments'],
  ['CFE orchestration (this platform)', 'Dispatch, evidence and customer service layer described here', 'Proposed', 'info', 'Turns assets into a measurable monthly product']
];
V.advantage = () => `
  <div class="toolbar"><div class="ptitle"><h1>Why Reliance</h1><span class="sub">What another energy-services provider could not easily copy</span></div></div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Capability</th><th>What it is</th><th>Status</th><th>Contribution to this business</th></tr></thead><tbody>
  ${ADVANTAGE.map(([a, b, s, t, c]) => `<tr><td style="font-weight:600">${a}</td><td class="wrap small">${b}</td><td>${chip(s, t)}</td><td class="wrap small">${c}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="small muted" style="margin-top:8px">Status reflects public disclosures as the team understands them; confirm before presenting. Existing = in operation today; Announced = disclosed plans, not yet at scale; Proposed = this business.</p></div>`;

/* ---------- expansion ---------- */
const TILES = [['JK', 'J&K', 3, 0], ['PB', 'Punjab', 2, 1], ['HP', 'Himachal', 3, 1], ['UK', 'Uttarakhand', 4, 1], ['RJ', 'Rajasthan', 1, 2], ['HR', 'Haryana', 2, 2], ['DL', 'Delhi', 3, 2], ['UP', 'Uttar Pradesh', 4, 2], ['BR', 'Bihar', 5, 2], ['NE', 'North-East', 7, 2], ['GJ', 'Gujarat', 0, 3], ['MP', 'Madhya Pradesh', 2, 3], ['JH', 'Jharkhand', 5, 3], ['WB', 'West Bengal', 6, 3], ['MH', 'Maharashtra', 1, 4], ['CG', 'Chhattisgarh', 3, 4], ['OD', 'Odisha', 5, 4], ['GA', 'Goa', 0, 5], ['TG', 'Telangana', 2, 5], ['KA', 'Karnataka', 1, 6], ['AP', 'Andhra Pradesh', 3, 6], ['KL', 'Kerala', 1, 7], ['TN', 'Tamil Nadu', 2, 7]];
const ROUTES = {
  JMN: { name: 'Jamnagar', route: 1, rn: 'Route 1 · internal proof', chain: ['Reliance AI campus and Jamnagar complex loads; first data-centre tenants', 'Kutch solar and wind plus Jamnagar storage, contracted portfolio', 'Intra-state, Gujarat green open access; captive where eligible', 'Lowest delivery cost: same state, contracted assets. Figures pending finance', 'Shadow mode on internal load, then the first independently verified month'] },
  GJ: { name: 'Other Gujarat customers', route: 2, rn: 'Route 2 · Gujarat customers', chain: ['Industrial and data-centre loads: Ahmedabad, Dahej, GIFT City', 'Group-captive SPVs on Kutch and Saurashtra solar and wind', 'Gujarat green open access; group captive only where the ownership and consumption tests can be met', 'Captive status avoids extra surcharges if maintained. Figures pending finance', 'Counsel approves the captive structure; first non-Reliance contract'] },
  MH: { name: 'Maharashtra', route: 3, rn: 'Route 3 · local partners', chain: ['Mumbai and Navi Mumbai data-centre cluster', 'Local generation partners in Maharashtra plus storage, or management of the customer’s existing contracts', 'In-state open access; inter-state only if the economics work', 'Open-access charges to be confirmed. Figures pending finance', 'Qualify an in-state supply partner; review state charges'] },
  TG: { name: 'Telangana', route: 3, rn: 'Route 3 · local partners', chain: ['Hyderabad cloud regions', 'Local solar partners plus storage; manage existing customer contracts', 'In-state open access', 'Pending state charges and partner pricing', 'Diagnostic for an anchor customer; shortlist partners'] },
  TN: { name: 'Tamil Nadu', route: 3, rn: 'Route 3 · local partners', chain: ['Chennai data centres', 'Local wind partners plus storage', 'In-state open access', 'Strong wind may lower storage needs. Figures pending', 'Partner scan; diagnostic for one customer'] },
  KA: { name: 'Karnataka', route: 3, rn: 'Route 3 · later wave', chain: ['Bengaluru enterprise campuses', 'Local partners, to be identified', 'In-state open access', 'Not assessed', 'Not in the first wave'] }
};
const ROUTE_COL = { 1: 'var(--brand)', 2: '#0E7568', 3: 'var(--solar)' };
function mapSVG(sel, small) {
  const tw = 78, th = 58, gx = 6, ox = 10, oy = 10, W = ox * 2 + 8 * (tw + gx), H = oy * 2 + 8 * (th + gx);
  let g = '';
  TILES.forEach(([c, n, x, y]) => {
    const r = ROUTES[c], px = ox + x * (tw + gx), py = oy + y * (th + gx), on = sel === c || (c === 'GJ' && sel === 'JMN');
    g += `<g ${r ? `class="clickable" data-route="${c}"` : ''}><rect x="${px}" y="${py}" width="${tw}" height="${th}" rx="8" fill="${r ? ROUTE_COL[r.route] : 'var(--panel-3)'}" opacity="${r ? (on ? 1 : .8) : 1}" stroke="${on ? 'var(--ink)' : 'none'}" stroke-width="2.5"/><text x="${px + tw / 2}" y="${py + th / 2 + (c === 'GJ' ? -6 : 4)}" text-anchor="middle" style="font-family:var(--f-body);font-size:${small ? 11 : 11.5}px;font-weight:600;fill:${r ? '#fff' : 'var(--faint)'}">${n.length > 11 ? c : n}</text></g>`;
  });
  const gj = TILES.find(t => t[0] === 'GJ'), jx = ox + gj[2] * (tw + gx) + 14, jy = oy + gj[3] * (th + gx) + 42;
  g += `<g class="clickable" data-route="JMN"><circle cx="${jx}" cy="${jy}" r="7" fill="#FFD58A" stroke="var(--brand)" stroke-width="2.5"/><text x="${jx + 10}" y="${jy + 4}" style="font-family:var(--f-body);font-size:10px;font-weight:600;fill:#fff">Jamnagar</text></g>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic India map of expansion routes">${g}</svg></div>`;
}
function routeChain(k) {
  const r = ROUTES[k], steps = ['Customer demand', 'Supply arrangement', 'Delivery route', 'Economics', 'Next requirement'];
  return `<div class="ph"><h3>${r.name}</h3>${chip(r.rn, r.route === 3 ? 'warn' : 'info')}</div>
  <div class="rchain">${steps.map((s, i) => `<div class="rstep"><span class="eyebrow">${s}</span><p>${r.chain[i].replace('Figures pending finance', '<span class="pend-chip">figures pending finance</span>')}</p></div>`).join('<span class="rarr">↓</span>')}</div>
  ${r.route === 3 ? '<p class="small muted" style="margin-top:8px">Conditional route. Kutch is not assumed to supply customers in other states.</p>' : ''}`;
}
V.expansion = () => {
  state.route = state.route || 'JMN';
  return `
  <div class="toolbar"><div class="ptitle"><h1>Expansion</h1><span class="sub">Three routes beyond the first customer · schematic map, not to scale</span></div><button class="btn sm" data-go="feasibility">State gates and sizing →</button></div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Routes</h3><div class="legend"><span>${sw(ROUTE_COL[1])}1 · Jamnagar proof</span><span>${sw(ROUTE_COL[2])}2 · Gujarat customers</span><span>${sw(ROUTE_COL[3])}3 · Local partners elsewhere</span></div></div>${mapSVG(state.route)}<p class="small muted">Click a state or the Jamnagar pin.</p></div>
    <div class="panel">${routeChain(state.route)}</div>
  </div>`;
};

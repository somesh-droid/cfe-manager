/* ===================== CUSTOMER PORTAL ===================== */
const CW_STEPS = ['Company and site', 'Meter data', 'Goals and contracts', 'Hourly diagnostic', 'Proposal', 'Term sheet'];
const CW_PRESET = { name: 'Colocation G', type: 'Colocation data centre', state: 'Gujarat', city: 'Jamnagar', discom: 'PGVCL', kv: '220 kV', mw: 60, shape: 'flat', current: 'solar', share: 100, tier: 90, authority: true, meterOk: true, uploaded: true };
const CW_BLANK = { name: '', type: 'Hyperscale data centre', state: 'Gujarat', city: '', discom: '', kv: '220 kV', mw: 60, shape: 'flat', current: 'solar', share: 100, tier: 90, authority: false, meterOk: false, uploaded: false };
function cwF() { if (!state.cw.f) state.cw.f = { ...CW_BLANK }; return state.cw.f; }

function avgProfileSVG(vals, color, label, max) {
  const W = 1000, H = 170, ml = 40, mb = 24, mt = 12, pw = W - ml - 10, ph = H - mt - mb, bw = pw / 24;
  max = max || Math.max(...vals) * 1.1;
  let g = '';
  [0, .5, 1].forEach(f => g += `<line x1="${ml}" x2="${W - 10}" y1="${mt + ph * (1 - f)}" y2="${mt + ph * (1 - f)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${mt + ph * (1 - f) + 4}" text-anchor="end">${label === '%' ? Math.round(f * 100) + '%' : Math.round(max * f)}</text>`);
  vals.forEach((v, h) => { const hh = v / max * ph; g += `<rect x="${ml + h * bw + 2}" y="${mt + ph - hh}" width="${bw - 4}" height="${hh}" rx="2" fill="${typeof color === 'function' ? color(v) : color}"/>`; });
  for (let h = 0; h < 24; h += 3) g += `<text x="${ml + h * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${String(h).padStart(2, '0')}</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hourly profile">${g}</svg><span class="wm">SIMULATED</span></div>`;
}
function custLoadAvg(mw, shape) {
  const out = new Array(24).fill(0);
  for (let i = 0; i < SIM.NB; i++) { const h = Math.floor((i % BPD) / 4); out[h] += P.load[i] * mw / 100 * (shape === 'day' ? (0.78 + 0.44 * Math.exp(-Math.pow(((i % BPD) / 4 + .125 - 13.5) / 4.2, 2))) / 0.916 : 1); }
  return out.map(v => v / (30 * 4));
}

V.c_onboard = () => {
  const f = cwF(), s = state.cw.step;
  const steps = `<div class="steps">${CW_STEPS.map((t, i) => `<button class="step ${i < s ? 'done' : ''}" ${i === s ? 'aria-current="step"' : ''} data-act="cwGo" data-i="${i}"><span class="n">${i < s ? '✓ ' : ''}Step ${i + 1}</span><span class="t">${t}</span></button>`).join('')}</div>`;
  let body = '';
  if (s === 0) body = `<div class="form">
      <div class="fld"><label for="cw-name">Company</label><input type="text" id="cw-name" value="${esc(f.name)}" placeholder="Legal entity buying power"></div>
      <div class="fld"><label for="cw-type">Facility type</label><select id="cw-type">${['Hyperscale data centre', 'Colocation data centre', 'AI compute campus', 'Continuous-process plant'].map(x => `<option ${x === f.type ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="fld"><label for="cw-state">State</label><select id="cw-state">${STATES.map(x => `<option ${x === f.state ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="fld"><label for="cw-city">City / site</label><input type="text" id="cw-city" value="${esc(f.city)}"></div>
      <div class="fld"><label for="cw-discom">Distribution licensee</label><input type="text" id="cw-discom" value="${esc(f.discom)}" placeholder="e.g. PGVCL"></div>
      <div class="fld"><label for="cw-kv">Connection voltage</label><select id="cw-kv">${['66 kV', '132 kV', '220 kV', '400 kV'].map(x => `<option ${x === f.kv ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="fld"><label for="cw-mw">Average load, MW</label><input type="number" id="cw-mw" min="5" max="500" value="${f.mw}"></div>
      <div class="fld"><label for="cw-shape">Load shape</label><select id="cw-shape"><option value="flat" ${f.shape === 'flat' ? 'selected' : ''}>Flat 24/7</option><option value="day" ${f.shape === 'day' ? 'selected' : ''}>Day-heavy</option></select></div>
    </div>`;
  if (s === 1) body = `<div class="stack">
      <div class="upload"><div><b>12 months of 15-minute interval data</b><br><span class="small muted">CSV export from the site's interface meter. We ask for energy readings only: no workload, server or user data.</span></div>
      <button class="btn ${f.uploaded ? '' : 'primary'}" data-act="cwUpload">${f.uploaded ? '✓ sample_interval_data.csv loaded' : 'Use sample file'}</button></div>
      ${f.uploaded ? `<div class="kpis">${kpi('Intervals received', '35,040', '365 days × 96')}${kpi('Completeness', '99.6%', '140 gaps flagged, not filled', 'good')}${kpi('Average load', f.mw + ' <small>MW</small>', f.shape === 'flat' ? 'flat profile' : 'day-heavy profile')}${kpi('Data shared', 'Meter only', 'read-only, encrypted', 'good')}</div>
      <div class="panel flat"><div class="ph"><h4>Average day</h4><span class="sub">MW by hour</span></div>${avgProfileSVG(custLoadAvg(f.mw, f.shape), 'var(--ink-2)', 'MW', f.mw * 1.4)}</div>` : ''}
    </div>`;
  if (s === 2) body = `<div class="form">
      <div class="fld full"><label>How is the site supplied today?</label><div class="radios">${[['none', 'DISCOM only'], ['solar', 'Annual solar PPA / RECs'], ['rtc', 'Round-the-clock block contract']].map(([v, l]) => `<label><input type="radio" name="cw-current" value="${v}" ${f.current === v ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
      <div class="fld"><label for="cw-share">Share of annual load covered, %</label><input type="number" id="cw-share" min="0" max="100" value="${f.share}" ${f.current === 'none' ? 'disabled' : ''}></div>
      <div class="fld"><label for="cw-tier">Hourly target of interest</label><select id="cw-tier">${[70, 90, 95].map(t => `<option value="${t}" ${+f.tier === t ? 'selected' : ''}>CFE${t}</option>`).join('')}</select></div>
      <div class="fld full"><label class="row" style="font-weight:400"><input type="checkbox" id="cw-authority" ${f.authority ? 'checked' : ''}> We hold procurement authority for this site's power contract</label>
      <label class="row" style="font-weight:400"><input type="checkbox" id="cw-meterOk" ${f.meterOk ? 'checked' : ''}> We permit read-only access to interface meter data under NDA</label>
      <span class="hint">Both are hard requirements. Without them, the account cannot progress past discovery.</span></div>
    </div>`;
  if (s === 3) {
    const dg = state.cw.diag;
    const worst = dg.profile.map((v, h) => [h, v]).sort((a, b) => a[1] - b[1]).slice(0, 4);
    body = `<div class="stack">
      <div class="kpis">${kpi('Renewable on an annual basis', pc(dg.annual, 0), f.current === 'none' ? 'no clean contracts today' : 'what the annual report says')}${kpi('Matched hour by hour', pc(dg.hourly, 0), 'the same energy, measured honestly', 'crit')}${kpi('Gap to CFE' + f.tier, Math.max(0, f.tier - dg.hourly * 100).toFixed(0) + ' <small>pts</small>', 'what a CF90 service closes')}</div>
      <div class="panel flat"><div class="ph"><h4>Share of each hour matched by current contracts</h4><span class="sub">October profile · averaged per hour</span></div>${avgProfileSVG(dg.profile, v => v >= .9 ? 'var(--h3)' : v >= .5 ? 'var(--h2)' : v > .05 ? 'var(--h1)' : 'var(--h0)', '%', 1)}</div>
      <div class="callout warn">Weakest hours: ${worst.map(([h, v]) => `<b>${String(h).padStart(2, '0')}:00</b> (${pc(v, 0)})`).join(', ')}. Night load needs wind, stored solar and evening blocks.</div>
    </div>`;
  }
  if (s === 4) {
    const pr = state.cw.prop, gateOk = f.state === 'Gujarat';
    body = `<div class="stack">
      ${gateOk ? '' : `<div class="callout warn"><b>${f.state}</b> has not cleared the state entry gates. We can offer a diagnostic and shadow monitoring now; a binding proposal follows once supply and a delivery route are qualified.</div>`}
      <div class="g3">${pr.map(p => `<div class="panel" style="${state.cw.tierPick === p.tier ? 'border:2px solid var(--brand)' : ''}">
        <div class="ph"><h3>CFE${p.tier}</h3>${p.feasible ? chip(pc(p.score) + ' back-tested', 'good') : chip('Bespoke', 'crit')}</div>
        <div class="tw"><table><tbody>
          <tr><td>${sw('var(--solar)')}Solar</td><td class="r num">${p.cfg.solar} MWp</td></tr><tr><td>${sw('var(--wind)')}Wind</td><td class="r num">${p.cfg.wind} MW</td></tr>
          <tr><td>${sw('var(--bess)')}Battery</td><td class="r num">${p.cfg.bessMW} / ${p.cfg.bessMWh} MWh</td></tr><tr><td>${sw('var(--mkt)')}Exchange cap</td><td class="r num">${p.cfg.mkt} MW</td></tr>
          <tr><td>Hours below ${p.tier}%</td><td class="r num">${p.below} / 720</td></tr>
        </tbody></table></div>
        <button class="btn ${state.cw.tierPick === p.tier ? 'primary' : ''}" style="width:100%;justify-content:center;margin-top:10px" data-act="cwTier" data-t="${p.tier}">${state.cw.tierPick === p.tier ? 'Selected' : 'Select CFE' + p.tier}</button></div>`).join('')}</div>
      <p class="small muted">Portfolios sized by the same engine that runs live dispatch. Prices come from the finance model and are not shown here.</p>
    </div>`;
  }
  if (s === 5) {
    const p = state.cw.prop.find(x => x.tier === state.cw.tierPick);
    body = `<div class="g21">
      <div class="panel flat" style="background:var(--panel-2)"><div class="ph"><h3>Indicative term sheet · non-binding</h3>${chip('Draft', 'neutral')}</div>
        <dl class="kv">
          <dt>Parties</dt><dd>CF90 Services (Reliance energy-services entity) and ${esc(f.name || 'Customer')}</dd>
          <dt>Site</dt><dd>${esc(f.city || '—')}, ${f.state} · ${f.mw} MW · ${f.kv}</dd>
          <dt>Service</dt><dd>Monthly load-weighted score of hourly-matched eligible MWh, floor CFE${p.tier}</dd>
          <dt>Portfolio</dt><dd>${p.cfg.solar} MWp solar, ${p.cfg.wind} MW wind, ${p.cfg.bessMW} MW / ${p.cfg.bessMWh} MWh storage, exchange blocks up to ${p.cfg.mkt} MW</dd>
          <dt>Evidence</dt><dd>Accredited granular certificates cancelled to the buyer; independent claims verifier</dd>
          <dt>Remedy</dt><dd>Service credit on a verified monthly miss, capped. Rate set by finance.</dd>
          <dt>Reliability</dt><dd>Unchanged: DISCOM and backup supply keep the site running; we never touch IT loads</dd>
          <dt>Tenor</dt><dd>10–15 years, aligned to supply contracts</dd>
          <dt>Conditions</dt><dd>Green open access approval · meter access · verifier appointed · captive structure if chosen · finance sign-off</dd>
        </dl></div>
      <div class="panel"><div class="ph"><h3>Buying committee</h3></div>
        <div class="gates">${COMMITTEE.map((c, i) => `<div class="gate ${i < 2 ? 'pass' : 'wait'}" style="padding:6px 10px"><span class="ic">${i < 2 ? '✓' : '…'}</span><span class="small">${c}</span><span></span></div>`).join('')}</div>
        <button class="btn primary" style="width:100%;justify-content:center;margin-top:12px" data-act="cwSubmit">Submit for diligence</button></div>
    </div>`;
  }
  const canNext = s < 5 && (s !== 1 || f.uploaded) && (s !== 2 || (f.authority && f.meterOk));
  return `
  <div class="phead"><div><div class="eyebrow">Customer portal · Onboarding</div><h1>From meter data to a term sheet</h1><p class="lead">The diagnostic is our main acquisition tool: it shows a buyer what its hourly match really is before anyone commits to infrastructure.</p></div><button class="btn" data-act="cwPreset">Fill with sample customer</button></div>
  ${steps}
  <div class="panel">${body}
    <div class="wnav"><button class="btn" data-act="cwBack" ${s === 0 ? 'disabled' : ''}>Back</button>${s < 5 ? `<button class="btn primary" data-act="cwNext" ${canNext ? '' : 'disabled'}>${s === 2 ? 'Run diagnostic' : s === 3 ? 'Size portfolios' : 'Continue'}</button>` : ''}</div></div>`;
};
function cwAdvance() {
  const f = cwF();
  if (state.cw.step === 2) state.cw.diag = SIM.diagnostic(P, +f.mw, f.shape, f.current, +f.share);
  if (state.cw.step === 3) {
    state.cw.prop = [70, 90, 95].map(t => { const z = SIM.size(P, +f.mw, f.shape, t); return { tier: t, feasible: z.feasible, cfg: z.cfg, score: z.score, below: SIM.below(z.R || SIM.run(P, z.cfg, []), t) }; });
    state.cw.tierPick = +f.tier;
  }
  state.cw.step = Math.min(5, state.cw.step + 1);
}
function cwSubmit() {
  const f = cwF(), id = 'N' + (state.newCustomers.length + 1);
  state.newCustomers.push({ id, isNew: true, name: f.name || 'New customer', site: f.city || '—', state: f.state, type: f.type, mw: +f.mw, tier: state.cw.tierPick, stage: f.state === 'Gujarat' ? 4 : 2, icp: [22, f.state === 'Gujarat' ? 22 : 8, 18, 14, 12], committee: [1, 1, 0, 0, 0, 0, 0], next: f.state === 'Gujarat' ? 'Diligence: facilities, finance, legal, CISO' : 'State gate review' });
  jrSet('customer', 4); state.acct = id; toast('Submitted. ' + (f.name || 'The account') + ' now sits in the CFE Manager pipeline.');
}

V.c_service = () => {
  const M = R.M, below = SIM.below(R, state.tier);
  const notes = state.events.flatMap(eventMessages).filter(m => m.to === 'CUST').sort((a, b) => b.t - a.t);
  return `
  <div class="phead"><div><div class="eyebrow">Customer portal · Hyperscaler A</div><h1>Your clean-energy service</h1><p class="lead">JMN-DC-01, Jamnagar · CFE90 monthly floor · October 2026 (simulated)</p></div><button class="btn" data-role="customer" data-view="c_statement">Open October statement</button></div>
  <div class="kpis">
    ${kpi('Month score, evidence-complete', pc(M.scoreComplete), 'floor CFE' + state.tier, M.scoreComplete * 100 >= state.tier ? 'good' : 'crit')}
    ${kpi('Hours below ' + state.tier + '%', below + ' <small>/ 720</small>', 'monthly average still governs')}
    ${kpi('Certificates cancelled to you', f0(R.certs.filter(c => !c.pending).length), f0(R.certs.filter(c => !c.pending).reduce((a, c) => a + c.mwh, 0)) + ' MWh')}
    ${kpi('Verification', 'Pending', 'month-end review by verifier', 'warn')}
  </div>
  <div class="g21">
    <div class="panel"><div class="ph"><h3>Every hour this month</h3>${heatLegend()}</div>${heatSVG(R, state.day, state.hourSel)}</div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>Notifications</h3></div><div class="msgs" style="max-height:260px">${notes.length ? notes.map(msgHTML).join('') : '<p class="small muted">No advisories this month.</p>'}</div></div>
      <div class="panel"><div class="ph"><h3>Planned load change</h3>${chip('optional', 'neutral')}</div>
        <p class="small muted" style="margin-bottom:10px">Tell us about large planned changes so we can re-plan supply. We never control your servers.</p>
        <button class="btn primary" data-act="custRamp">Notify +20 MW training run tonight (${dayLabel(state.day)})</button></div>
      <div class="panel"><div class="ph"><h3>What we can see</h3></div><ul class="plain small"><li>Interface meter readings, 15-minute</li><li>Optional MW flexibility envelope</li><li class="muted">Not visible: workloads, servers, cooling, UPS, user data</li></ul></div>
    </div>
  </div>`;
};

V.c_statement = () => {
  const M = R.M, sc = SIM.serviceCredit(M.scoreComplete, state.tier), below = SIM.below(R, state.tier);
  const rows = [['Solar · KTC-SOL-01', M.solar, 'var(--solar)'], ['Wind · KTC-WND-02', M.wind, 'var(--wind)'], ['Battery, clean-charged · JMN-BES-01', M.bessElig, 'var(--bess)'], ['Green exchange blocks', M.mkt, 'var(--mkt)'], ['Battery, grid-charged (not counted)', M.bessInelig, 'var(--bess-x)'], ['DISCOM residual (not counted)', M.grid, 'var(--grid)']];
  const ex = R.hours.filter(o => o.exception);
  const exCount = k => ex.filter(o => o.exception === k).length;
  return `
  <div class="phead"><div><div class="eyebrow">Customer portal · Statement</div><h1>October 2026 service statement</h1><p class="lead">Hyperscaler A · JMN-DC-01 · statement CF90-STMT-OCT26 · simulated</p></div>${chip(M.status === 'PROVISIONAL' ? 'Provisional' : 'Claim-ready · awaiting verifier', M.status === 'PROVISIONAL' ? 'warn' : 'info')}</div>
  <div class="g12">
    <div class="panel"><div class="eyebrow">Monthly CFE score</div><div class="big" style="font-size:56px;margin:6px 0;color:${M.scoreComplete * 100 >= state.tier ? 'var(--good)' : 'var(--crit)'}">${pc(M.scoreComplete)}</div>
      <div class="meter" style="margin:10px 0 6px"><div class="f" style="width:${M.scoreComplete * 100}%;background:#0E7568"></div><div class="tk" style="left:${state.tier}%"></div></div>
      <p class="small muted">Floor CFE${state.tier} · ${M.scoreComplete * 100 >= state.tier ? 'met by ' + (M.scoreComplete * 100 - state.tier).toFixed(1) + ' pts' : 'missed by ' + (state.tier - M.scoreComplete * 100).toFixed(1) + ' pts'}</p>
      <dl class="kv" style="margin-top:14px"><dt>Load metered</dt><dd>${f0(M.load)} MWh</dd><dt>Matched, evidence-complete</dt><dd>${f0(M.scoreComplete * M.load)} MWh</dd><dt>Hours below ${state.tier}%</dt><dd>${below} of 720</dd><dt>Provisional hours</dt><dd>${M.provisional}</dd><dt>Meter-gap hours</dt><dd>${M.incomplete}</dd></dl></div>
    <div class="panel"><div class="ph"><h3>Supply that served your load</h3><span class="sub">MWh</span></div>
      <div class="bar" style="height:18px;margin-bottom:12px">${rows.map(r => `<span style="width:${r[1] / M.load * 100}%;background:${r[2]}"></span>`).join('')}</div>
      <div class="tw"><table><tbody>${rows.map(r => `<tr><td>${sw(r[2])}${r[0]}</td><td class="r num">${f0(r[1])}</td><td class="r num muted">${pc(r[1] / M.load)}</td></tr>`).join('')}</tbody></table></div></div>
  </div>
  <div class="g3">
    <div class="panel"><div class="ph"><h3>Exceptions</h3></div><div class="tw"><table><tbody>
      <tr><td>Hours with grid residual</td><td class="r num">${exCount('RESIDUAL-GRID')}</td></tr><tr><td>Hours with grid-charged storage</td><td class="r num">${exCount('BESS-MIXED')}</td></tr><tr><td>Meter-gap hours</td><td class="r num">${exCount('MTR-GAP')}</td></tr><tr><td>Certificates pending</td><td class="r num">${exCount('GC-PENDING')}</td></tr>
    </tbody></table></div></div>
    <div class="panel"><div class="ph"><h3>Service credit</h3>${chip('Illustrative', 'warn')}</div>
      <div class="big" style="font-size:36px;color:${sc.creditPct ? 'var(--crit)' : 'var(--ink)'}">${sc.creditPct.toFixed(1)}%</div><p class="small muted">of monthly service fee · ${sc.shortfallPts.toFixed(1)} pts shortfall. Placeholder rule: 2% per point, cap 20%. Payable only on the verified result.</p></div>
    <div class="panel"><div class="ph"><h3>Verification</h3>${chip('Pending', 'warn')}</div>
      <p class="small">Evidence pack sent to the independent verifier: meter data, schedules, certificate cancellations, method v1.0.</p><p class="small muted" style="margin-top:6px">The prototype cannot issue an opinion. Until a verifier signs, this score is not a public claim.</p></div>
  </div>`;
};

/* ===================== SUPPLIER PORTAL ===================== */
const SW_STEPS = ['Company and asset', 'Grid and metering', 'Rights and attributes', 'Generation data', 'Eligibility gates', 'Portfolio value'];
const SW_PRESETS = {
  bhuj: { label: 'Bhuj Wind · passes', company: 'Bhuj Wind Power Pvt Ltd', asset: 'Bhuj Wind', tech: 'Wind', mw: 90, mwh: 0, state: 'Gujarat', district: 'Kutch', cod: 'yes', sub: 'Bhuj 220 kV', kv: '220 kV', meter: 'SEM-BHJ-WND-05', qca: 'yes', offtake: 'uncontracted', attr: 'unsold', lender: 'yes', data: 'yes', uploaded: true },
  jsm: { label: 'Jaisalmer Wind · out of state', company: 'Thar Wind Energy Ltd', asset: 'Jaisalmer Wind', tech: 'Wind', mw: 100, mwh: 0, state: 'Rajasthan', district: 'Jaisalmer', cod: 'yes', sub: 'Jaisalmer 400 kV', kv: '400 kV', meter: 'SEM-JSM-WND-07', qca: 'yes', offtake: 'uncontracted', attr: 'unsold', lender: 'yes', data: 'yes', uploaded: true },
  rec: { label: 'Surendranagar Solar · RECs sold', company: 'Sun Plains Solar Pvt Ltd', asset: 'Surendranagar Solar', tech: 'Solar PV', mw: 80, mwh: 0, state: 'Gujarat', district: 'Surendranagar', cod: 'yes', sub: 'Limbdi 132 kV', kv: '132 kV', meter: 'SEM-SRN-SOL-11', qca: 'yes', offtake: 'partly', attr: 'sold', lender: 'yes', data: 'yes', uploaded: true }
};
const SW_BLANK = { company: '', asset: '', tech: 'Wind', mw: 50, mwh: 0, state: 'Gujarat', district: '', cod: 'yes', sub: '', kv: '220 kV', meter: '', qca: 'no', offtake: 'uncontracted', attr: 'unsold', lender: 'yes', data: 'yes', uploaded: false };
function swF() { if (!state.sw.f) state.sw.f = { ...SW_BLANK }; return state.sw.f; }
function swAsset(f) { return { id: (f.asset || 'NEW').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) + '-' + (f.tech === 'BESS' ? 'BES' : f.tech === 'Wind' ? 'WND' : 'SOL') + '-' + String(20 + state.newSuppliers.length).padStart(2, '0'), name: f.asset || 'New asset', owner: f.company, tech: f.tech, cap: f.tech === 'BESS' ? f.mw + ' MW / ' + f.mwh + ' MWh' : f.mw + (f.tech === 'Solar PV' ? ' MWp' : ' MW'), state: f.state, district: f.district || '—', cod: f.cod === 'yes', rights: f.offtake !== 'full' && f.lender === 'yes', attrExclusive: f.attr === 'unsold', meter: !!f.meter, sched: f.qca === 'yes', c: f.tech === 'Wind' ? 'var(--wind)' : f.tech === 'BESS' ? 'var(--bess)' : 'var(--solar)' }; }
function swValue(f) {
  const add = { ...state.cfg };
  if (f.tech === 'Wind') add.wind += +f.mw; else if (f.tech === 'Solar PV') add.solar += +f.mw; else { add.bessMW += +f.mw; add.bessMWh += +f.mwh; }
  const R1 = SIM.run(P, add, []), Rb = SIM.run(P, state.cfg, []);
  const night = Rx => { let m = 0, l = 0; Rx.hours.forEach(o => { if (o.h >= 19 || o.h < 6) { m += o.matched; l += o.load; } }); return m / l; };
  return { before: Rb.M.scoreComplete, after: R1.M.scoreComplete, nightB: night(Rb), nightA: night(R1), belowB: SIM.below(Rb, 90), belowA: SIM.below(R1, 90), surplusB: Rb.M.surplusExcl, surplusA: R1.M.surplusExcl };
}
V.s_onboard = () => {
  const f = swF(), s = state.sw.step;
  const steps = `<div class="steps">${SW_STEPS.map((t, i) => `<button class="step ${i < s ? 'done' : ''}" ${i === s ? 'aria-current="step"' : ''} data-act="swGo" data-i="${i}"><span class="n">${i < s ? '✓ ' : ''}Step ${i + 1}</span><span class="t">${t}</span></button>`).join('')}</div>`;
  const sel = (id, opts, v) => `<select id="${id}">${opts.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
  let body = '';
  if (s === 0) body = `<div class="form">
    <div class="fld"><label for="sw-company">Company</label><input type="text" id="sw-company" value="${esc(f.company)}"></div>
    <div class="fld"><label for="sw-asset">Asset name</label><input type="text" id="sw-asset" value="${esc(f.asset)}"></div>
    <div class="fld"><label for="sw-tech">Technology</label>${sel('sw-tech', [['Wind', 'Wind'], ['Solar PV', 'Solar PV'], ['BESS', 'Battery storage']], f.tech)}</div>
    <div class="fld"><label for="sw-mw">Capacity, MW</label><input type="number" id="sw-mw" min="1" value="${f.mw}"></div>
    ${f.tech === 'BESS' ? `<div class="fld"><label for="sw-mwh">Energy, MWh</label><input type="number" id="sw-mwh" min="1" value="${f.mwh}"></div>` : ''}
    <div class="fld"><label for="sw-state">State</label><select id="sw-state">${[...STATES, 'Rajasthan', 'Madhya Pradesh'].map(x => `<option ${x === f.state ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <div class="fld"><label for="sw-district">District</label><input type="text" id="sw-district" value="${esc(f.district)}"></div>
    <div class="fld"><label for="sw-cod">Commissioned?</label>${sel('sw-cod', [['yes', 'Yes, operating'], ['no', 'Under construction']], f.cod)}</div></div>`;
  if (s === 1) body = `<div class="form">
    <div class="fld"><label for="sw-sub">Connecting substation</label><input type="text" id="sw-sub" value="${esc(f.sub)}"></div>
    <div class="fld"><label for="sw-kv">Voltage</label>${sel('sw-kv', [['66 kV', '66 kV'], ['132 kV', '132 kV'], ['220 kV', '220 kV'], ['400 kV', '400 kV']], f.kv)}</div>
    <div class="fld"><label for="sw-meter">Interface meter ID</label><input type="text" id="sw-meter" value="${esc(f.meter)}" placeholder="Special energy meter serial"><span class="hint">Needed to issue certificates against metered output.</span></div>
    <div class="fld"><label for="sw-qca">Scheduling coordinator / QCA appointed?</label>${sel('sw-qca', [['yes', 'Yes'], ['no', 'Not yet']], f.qca)}</div></div>`;
  if (s === 2) body = `<div class="form">
    <div class="fld"><label for="sw-offtake">Current offtake</label>${sel('sw-offtake', [['uncontracted', 'Uncontracted capacity available'], ['partly', 'Partly contracted'], ['full', 'Fully contracted']], f.offtake)}</div>
    <div class="fld"><label for="sw-attr">Environmental attributes</label>${sel('sw-attr', [['unsold', 'Not sold; transferable with energy'], ['sold', 'Sold separately (RECs / another buyer)']], f.attr)}</div>
    <div class="fld"><label for="sw-lender">Lender consent for new PPA</label>${sel('sw-lender', [['yes', 'Available'], ['no', 'Not available']], f.lender)}</div>
    <div class="fld"><label for="sw-data">Share 15-min generation data</label>${sel('sw-data', [['yes', 'Yes'], ['no', 'No']], f.data)}</div>
    <div class="callout full">We buy energy <b>and</b> its attributes together, exclusively for a named buyer. An asset whose certificates are already sold cannot enter the portfolio, however cheap its power.</div></div>`;
  if (s === 3) {
    const prof = new Array(24).fill(0); for (let i = 0; i < SIM.NB; i++) { const h = Math.floor((i % BPD) / 4); prof[h] += (f.tech === 'Wind' ? P.wind[i] : f.tech === 'Solar PV' ? P.solar[i] : 0) * f.mw / 120; }
    body = `<div class="stack"><div class="upload"><div><b>12 months of 15-minute generation</b><br><span class="small muted">SCADA or interface meter export. Used to test complementarity with customer load.</span></div><button class="btn ${f.uploaded ? '' : 'primary'}" data-act="swUpload">${f.uploaded ? '✓ sample_generation.csv loaded' : 'Use sample file'}</button></div>
    ${f.uploaded && f.tech !== 'BESS' ? `<div class="panel flat"><div class="ph"><h4>Average day, MW</h4><span class="sub">${f.tech}</span></div>${avgProfileSVG(prof, f.tech === 'Wind' ? 'var(--wind)' : 'var(--solar)', 'MW', Math.max(...prof) * 1.2)}</div>` : ''}</div>`;
  }
  if (s === 4) {
    const a = swAsset(f), c = SIM.checkAsset(a);
    state.sw.gates = c;
    body = `<div class="gates">${c.checks.map((g, i) => `<div class="gate anim ${g.ok ? 'pass' : 'fail'}" style="animation-delay:${i * 160}ms"><span class="ic">${g.ok ? '✓' : '✕'}</span><span>${g.k}<br><span class="d">${['Operating today, not a pipeline promise', 'Lender consent and uncommitted capacity', 'Certificates transfer with the energy', 'Same-state rule for hourly matching', 'Certificates are issued against meter data', 'Schedules reach the SLDC through a coordinator'][i]}</span></span><span class="small ${g.ok ? 'ok' : 'no'}">${g.ok ? 'pass' : g.fail}</span></div>`).join('')}</div>
      <div class="callout ${c.eligible ? 'good' : 'crit'}" style="margin-top:12px">${c.eligible ? '<b>Qualified.</b> Next: a 12-month backtest against live customer load, then PPA negotiation.' : '<b>Not eligible: ' + c.reason + '.</b> The asset is logged with the reason and can re-apply once it is fixed.'}</div>`;
  }
  if (s === 5) {
    const c = state.sw.gates, v = state.sw.value;
    body = c.eligible ? `<div class="stack">
      <div class="kpis">${kpi('Hyperscaler A monthly score', pc(v.after), 'from ' + pc(v.before) + ' (+' + ((v.after - v.before) * 100).toFixed(1) + ' pts)', 'good')}${kpi('Night hours matched, 19:00–06:00', pc(v.nightA), 'from ' + pc(v.nightB))}${kpi('Hours below 90%', v.belowA + ' <small>/ 720</small>', 'from ' + v.belowB)}${kpi('Surplus not counted', f0(v.surplusA) + ' <small>MWh</small>', 'from ' + f0(v.surplusB), v.surplusA - v.surplusB > 500 ? 'warn' : '')}</div>
      <div class="g2"><div class="panel flat"><div class="ph"><h4>What we offer you</h4></div><ul class="plain small"><li>Long-term offtake for energy plus attributes, 10–15 years</li><li>Agreed delivery profile and curtailment allocation</li><li>Schedules sent through your coordinator; no control of your plant</li><li>Monthly settlement statement and certificate record</li></ul></div>
      <div class="panel flat"><div class="ph"><h4>What we need from you</h4></div><ul class="plain small"><li>Exclusive attribute transfer to our named buyer</li><li>15-minute generation and availability data</li><li>Outage notice and forecast updates</li><li>Lender consent and no double-selling of capacity</li></ul></div></div>
      <button class="btn primary" data-act="swSubmit" style="justify-self:start">Submit to CFE Manager procurement</button></div>`
      : `<div class="stack"><div class="callout crit"><b>${c.reason}.</b></div><div class="panel flat"><div class="ph"><h4>How to re-qualify</h4></div><ul class="plain small">${c.checks.filter(x => !x.ok).map(x => `<li>${{ 'Commissioned': 'Re-apply at commissioning; we can sign a conditional term sheet now.', 'Supply rights executable': 'Obtain lender consent or free up uncontracted capacity.', 'Attributes exclusive': 'Attributes must transfer with energy. Retire existing REC arrangements first.', 'Meter registered': 'Register an interface meter with the SLDC.', 'Scheduling right': 'Appoint a scheduling coordinator / QCA.' }[x.k] || 'Hourly matching is same-state. Out-of-state assets can serve customers in their own state once that state opens.'}</li>`).join('')}</ul></div>
      <button class="btn" data-act="swSubmit" style="justify-self:start">Log application with reason</button></div>`;
  }
  const canNext = s < 5 && (s !== 3 || f.uploaded);
  return `
  <div class="phead"><div><div class="eyebrow">Supplier portal · Onboarding</div><h1>Apply to supply the CF90 portfolio</h1><p class="lead">Generators and storage owners apply here. Qualification is automatic for the hard gates; commercial terms follow with our procurement team.</p></div>
    <div class="row"><span class="small muted">Sample applicant:</span>${Object.entries(SW_PRESETS).map(([k, p]) => `<button class="btn sm" data-act="swPreset" data-k="${k}">${p.label}</button>`).join('')}</div></div>
  ${steps}
  <div class="panel">${body}
    <div class="wnav"><button class="btn" data-act="swBack" ${s === 0 ? 'disabled' : ''}>Back</button>${s < 5 ? `<button class="btn primary" data-act="swNext" ${canNext ? '' : 'disabled'}>${s === 3 ? 'Run eligibility gates' : s === 4 ? (state.sw.gates && state.sw.gates.eligible ? 'Simulate portfolio value' : 'See next steps') : 'Continue'}</button>` : ''}</div></div>`;
};
function swAdvance() {
  if (state.sw.step === 4 && !state.sw.gates) state.sw.gates = SIM.checkAsset(swAsset(swF()));
  if (state.sw.step === 4 && state.sw.gates && state.sw.gates.eligible) state.sw.value = swValue(swF());
  state.sw.step = Math.min(5, state.sw.step + 1);
}
function swSubmit() {
  const f = swF(), a = swAsset(f), c = SIM.checkAsset(a);
  a.stage = c.eligible ? 'Simulate' : 'Rejected'; a.isNew = true; a.contract = c.eligible ? 'Backtest complete; PPA term sheet next' : c.reason;
  if (!state.newSuppliers.some(x => x.name === a.name)) state.newSuppliers.push(a);
  if (c.eligible) jrSet('supplier', 3); state.supSel = a.id; toast(c.eligible ? a.name + ' added to procurement at the Simulate stage.' : a.name + ' logged as not eligible: ' + c.reason + '.');
}

V.s_asset = () => {
  const d = state.day, bs = R.blocks.slice(d * BPD, d * BPD + BPD);
  const inbox = state.events.flatMap(eventMessages).filter(m => m.to === 'SUP' || m.from === 'SUP');
  const genM = R.M.genW, avail = 97.6;
  const W = 1000, H = 220, ml = 40, mt = 12, mb = 24, pw = W - ml - 10, ph = H - mt - mb, bw = pw / 96;
  const cap = state.cfg.wind, y = v => mt + ph * (1 - v / cap);
  let g = '';
  [0, .5, 1].forEach(fq => g += `<line x1="${ml}" x2="${W - 10}" y1="${y(cap * fq)}" y2="${y(cap * fq)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(cap * fq) + 4}" text-anchor="end">${Math.round(cap * fq)}</text>`);
  g += `<path d="M${ml},${y(0)} ${bs.map((b, i) => `L${ml + i * bw},${y(b.W)} L${ml + (i + 1) * bw},${y(b.W)}`).join(' ')} L${ml + pw},${y(0)} Z" fill="var(--wind)" opacity=".35"/>`;
  g += `<path d="${bs.map((b, i) => `${i ? 'L' : 'M'}${ml + i * bw},${y(P.windFc[b.i] * cap)} L${ml + (i + 1) * bw},${y(P.windFc[b.i] * cap)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-dasharray="4 4" stroke-width="1.3"/>`;
  bs.forEach((b, i) => { if (b.ev) g += `<rect x="${ml + i * bw}" y="${mt}" width="${bw}" height="${ph}" fill="#B0271E" opacity=".05"/>`; });
  for (let h = 0; h <= 24; h += 3) g += `<text x="${ml + h * 4 * bw}" y="${H - 6}" text-anchor="middle">${String(h).padStart(2, '0')}:00</text>`;
  return `
  <div class="phead"><div><div class="eyebrow">Supplier portal · Kutch Wind Farm</div><h1>KTC-WND-02 · ${state.cfg.wind} MW</h1><p class="lead">Third-party IPP (illustrative) · 15-year PPA for energy and attributes · scheduling via QCA</p></div>${timeControls().replace(/<label[\s\S]*$/, '</div>')}</div>
  <div class="kpis">
    ${kpi('Generated, October', f0(genM) + ' <small>MWh</small>', 'interface meter')}
    ${kpi('Matched to customer load', f0(R.M.wind) + ' <small>MWh</small>', 'rest stored, lost or surplus')}
    ${kpi('Availability', avail + '%', 'contract floor 95% · illustrative', 'good')}
    ${kpi('Certificates issued', f0(R.certs.filter(c => c.asset === 'KTC-WND-02').length), 'cancelled to SIM-BUYER-HSA')}
  </div>
  <div class="g21">
    <div class="panel"><div class="ph"><h3>Output vs day-ahead forecast · ${dayLabel(d)}</h3><div class="legend"><span>${sw('var(--wind)')}Actual MW</span><span><svg width="20" height="8"><line x1="0" x2="20" y1="4" y2="4" stroke="var(--ink)" stroke-dasharray="4 3"/></svg> Day-ahead forecast</span></div></div><div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Wind output and forecast">${g}</svg><span class="wm">SIMULATED</span></div></div>
    <div class="panel"><div class="ph"><h3>Instructions and messages</h3></div><div class="msgs">${inbox.length ? inbox.map(m => `${msgHTML(m)}${m.to === 'SUP' && m.kind !== 'ack' ? `<div class="row" style="margin:-4px 0 4px 62px">${state.acks[m.label] ? chip('Acknowledged', 'good') : `<button class="btn sm" data-act="ack" data-k="${esc(m.label)}">Acknowledge</button>`}</div>` : ''}`).join('') : '<p class="small muted">No instructions outside the day-ahead schedule. Inject an event in the control room to see one arrive here.</p>'}</div></div>
  </div>`;
};

/* ===================== TRADING MEMBER DESK ===================== */
V.t_desk = () => {
  const d = state.day, H = R.hours.slice(d * 24, d * 24 + 24);
  const evMsgs = state.events.filter(e => e.d === d || e.d === d - 1).flatMap(eventMessages).filter(m => m.to === 'TM' && m.from === 'CFE');
  const rows = H.filter(o => o.mkt > 0.05 || (o.grid > 0.05)).map(o => {
    const bs = R.blocks.slice((d * 24 + o.h) * 4, (d * 24 + o.h) * 4 + 4), offered = bs.reduce((a, b) => a + b.mAv, 0) * SIM.DT, price = bs.reduce((a, b) => a + b.price, 0) / 4;
    const intraday = bs.some(b => b.ev);
    return { h: o.h, prod: intraday ? 'G-TAM intraday' : 'G-DAM', req: Math.min(state.cfg.mkt, (o.mkt + o.grid)), cleared: o.mkt, offered, price, st: o.mkt > 0.05 ? (o.mkt + 0.05 < Math.min(state.cfg.mkt, o.mkt + o.grid) ? 'Part-filled' : 'Filled') : 'Not cleared' };
  });
  const tot = rows.reduce((a, r) => a + r.cleared, 0);
  return `
  <div class="phead"><div><div class="eyebrow">Trading member desk</div><h1>Requests from CFE Manager</h1><p class="lead">We are the licensed exchange member. CFE Manager sends requests within a written mandate; we place, clear and confirm on the exchange.</p></div>${timeControls().replace(/<label[\s\S]*$/, '</div>')}</div>
  <div class="callout warn">CFE Manager holds no exchange membership and cannot trade directly. Every order below is placed by the member under the mandate, and confirmations flow back as evidence.</div>
  <div class="kpis">${kpi('Requests today', rows.length, dayLabel(d))}${kpi('Cleared', f1(tot) + ' <small>MWh</small>', 'green products only')}${kpi('Not cleared', rows.filter(r => r.st === 'Not cleared').length + ' <small>hours</small>', 'no bid above limit')}${kpi('Mandate', state.cfg.mkt + ' <small>MW max</small>', 'agency basis · G-DAM, G-TAM')}</div>
  ${evMsgs.length ? `<div class="panel"><div class="ph"><h3>Intraday requests</h3>${chip(evMsgs.length + ' open', 'info')}</div><div class="msgs">${evMsgs.map(m => `${msgHTML(m)}<div class="row" style="margin:-4px 0 4px 62px">${state.acks[m.label] ? chip('Placed on exchange', 'good') : `<button class="btn sm primary" data-act="ack" data-k="${esc(m.label)}">Place order</button>`}</div>`).join('')}</div></div>` : ''}
  <div class="panel"><div class="ph"><h3>Order book · ${dayLabel(d)}</h3><span class="sub">MWh per hour · price index illustrative</span></div>
    <div class="tw" style="max-height:440px;overflow:auto"><table><thead><tr><th>Request</th><th>Delivery</th><th>Product</th><th class="r">Requested</th><th class="r">Cleared</th><th class="r">Index ₹/MWh</th><th>Status</th><th>Confirmation</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td class="mono small">SIM-REQ-${String(d + 1).padStart(2, '0')}${String(r.h).padStart(2, '0')}</td><td class="num">${String(r.h).padStart(2, '0')}:00–${String(r.h + 1).padStart(2, '0')}:00</td><td>${r.prod}</td><td class="r num">${f1(r.req)}</td><td class="r num">${f1(r.cleared)}</td><td class="r num muted">${f0(r.price)}</td><td>${chip(r.st, r.st === 'Filled' ? 'good' : r.st === 'Part-filled' ? 'warn' : 'neutral')}</td><td class="mono small muted">${r.cleared > 0.05 ? 'SIM-IEX-' + (7000 + d * 24 + r.h) : '—'}</td></tr>`).join('')}
    </tbody></table></div></div>`;
};

/* ===================== VERIFIER ===================== */
V.v_review = () => {
  const M = R.M;
  const reg = SIM.makeRegistry(); let dups = 0; R.certs.forEach(c => { if (!reg.assign(c.serial, c.beneficiary).ok) dups++; });
  const r = (() => { let a = 7 + state.day; return () => (a = (a * 9301 + 49297) % 233280) / 233280; })();
  const sample = Array.from({ length: 12 }, () => R.hours[Math.floor(r() * 720)]);
  const comp = 1 - M.incomplete / 720;
  const items = [
    ['Method v1.0 agreed with buyer', true, 'monthly load-weighted hourly match'],
    ['Meter data completeness', comp > 0.995, pc(comp) + ' of hours metered'],
    ['Certificate uniqueness', dups === 0, f0(R.certs.length) + ' serials · ' + dups + ' duplicates'],
    ['Geography: same-state supply', true, 'all eligible assets in Gujarat'],
    ['Storage charge-source tracking', true, f0(M.bessInelig) + ' MWh grid-charged discharge excluded'],
    ['Grid residual excluded', true, f0(M.grid) + ' MWh at zero'],
    ['Certificates cancelled for all claimed hours', M.provisional === 0, M.provisional + ' hours pending']
  ];
  return `
  <div class="phead"><div><div class="eyebrow">Independent verifier · read-only</div><h1>October 2026 review · Hyperscaler A</h1><p class="lead">We test the method, re-perform a sample of hours from the raw ledgers, and only then sign an opinion. We cannot edit any record.</p></div>${chip('Opinion not issued', 'warn')}</div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Review checklist</h3></div><div class="gates">${items.map(([k, ok, d]) => `<div class="gate ${ok ? 'pass' : 'fail'}"><span class="ic">${ok ? '✓' : '!'}</span><span>${k}<br><span class="d">${d}</span></span><span class="small ${ok ? 'ok' : 'no'}">${ok ? 'pass' : 'finding'}</span></div>`).join('')}</div></div>
    <div class="panel"><div class="ph"><h3>Re-performed sample</h3><button class="btn sm" data-act="resample">Draw a new sample</button></div>
      <div class="tw"><table><thead><tr><th>Hour</th><th class="r">Reported</th><th class="r">Re-performed</th><th>Result</th></tr></thead><tbody>
      ${sample.map(o => { const re = o.status === 'INCOMPLETE' ? 0 : Math.min(o.load, o.solar + o.wind + o.bessElig + o.mkt), rep = o.status === 'INCOMPLETE' ? 0 : o.matched; return `<tr><td class="num">${dayLabel(o.d).replace(/^\w+ /, '')} ${String(o.h).padStart(2, '0')}:00</td><td class="r num">${f1(rep)}</td><td class="r num">${f1(re)}</td><td>${Math.abs(re - rep) < 1e-6 ? chip('Agrees', 'good') : chip('Differs', 'crit')}</td></tr>`; }).join('')}
      </tbody></table></div></div>
  </div>
  <div class="panel"><div class="ph"><h3>Draft opinion</h3>${chip('Draft', 'neutral')}</div>
    <p>Subject to completion of the items above, the reported monthly CFE score of <b>${pc(M.scoreComplete)}</b> for JMN-DC-01 appears to be prepared in accordance with method v1.0. ${M.provisional || M.incomplete ? `<b>${M.provisional + M.incomplete} hours</b> remain open and are excluded until evidence is complete.` : 'No open hours.'}</p>
    <p class="small muted" style="margin-top:8px">Prototype text. A real opinion requires an appointed, independent assurance provider.</p></div>`;
};

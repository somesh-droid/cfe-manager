/* ===================== COORDINATION TIMELINES ===================== */
const ACTORS = [
  { id: 'CFE', name: 'CFE Manager', c: 'var(--r-manager)' }, { id: 'SUP', name: 'Generators', c: 'var(--r-supplier)' },
  { id: 'BESS', name: 'Battery operator', c: 'var(--bess)' }, { id: 'TM', name: 'Trading member', c: 'var(--r-trader)' },
  { id: 'IEX', name: 'Exchange (IEX)', c: 'var(--mkt)' }, { id: 'SLDC', name: 'SLDC Gujarat', c: 'var(--ink-2)' },
  { id: 'CUST', name: 'Customer', c: 'var(--r-customer)' }, { id: 'REG', name: 'Registry · verifier', c: 'var(--r-verifier)' }
];
const ACT = Object.fromEntries(ACTORS.map(a => [a.id, a]));

function windowStats(e) {
  const from = Math.min(...e.ev.map(x => x.from)), to = Math.min(SIM.NB, Math.max(...e.ev.map(x => x.to)));
  const s = { from, to, load: 0, fc: 0, act: 0, act0: 0, bess: 0, bess0: 0, bessX: 0, mkt: 0, mkt0: 0, grid: 0, grid0: 0, curt: 0, gc: 0, matched: 0, matched0: 0 };
  for (let i = from; i < to; i++) {
    const b = R.blocks[i], b0 = R0.blocks[i], q = SIM.DT;
    s.load += b.L * q; s.fc += b.fc * q; s.act += b.delivered * q; s.act0 += b0.delivered * q;
    s.bess += b.disElig * q; s.bess0 += b0.disElig * q; s.bessX += (b.dis - b.disElig) * q; s.mkt += b.mkt * q; s.mkt0 += b0.mkt * q;
    s.grid += b.gridToLoad * q; s.grid0 += b0.gridToLoad * q; s.curt += b.txCurt * q; s.gc += b.gc * q;
  }
  s.cfe = s.load ? 1 - (s.grid + s.bessX) / s.load : 0;
  let l0 = 0; for (let i = from; i < to; i++) l0 += R0.blocks[i].L * SIM.DT;
  s.cfe0 = l0 ? 1 - s.grid0 / l0 : 0;
  s.hours = (to - from) / 4;
  return s;
}
const tag = (d, n) => 'SIM-' + n + '-' + String(d + 1).padStart(2, '0') + '10';

function eventMessages(e) {
  const s = windowStats(e), d = e.d, t0 = e.detect, D1 = (d + 1) * 1440, cfg = state.cfg, score = pc(R.M.scoreComplete);
  const M = (t, from, to, label, sub = '', kind = 'instr') => ({ t, from, to, label, sub, kind, ev: e.key });
  const fromT = hhmm((s.from % BPD) * 15), toT = hhmm((s.to % BPD) * 15);
  const L = [];
  switch (e.key) {
    case 'windLull':
    case 'badWeek':
      L.push(M(t0, 'SUP', 'CFE', 'Intraday forecast update from wind QCA', 'wind −65% for ' + fromT + '–' + toT, 'data'));
      L.push(M(t0 + 2, 'CFE', 'CFE', 'Re-planned · clean supply ' + f0(s.act0 - s.act) + ' MWh below plan', 'merit order: battery → green blocks → grid at 0 CFE', 'note'));
      L.push(M(t0 + 4, 'CFE', 'BESS', 'Discharge plan: up to ' + cfg.bessMW + ' MW from ' + fromT, 'signed instruction ' + tag(d, 'BI-0412')));
      L.push(M(t0 + 6, 'BESS', 'CFE', 'Acknowledged', 'within SoC 10–95%', 'ack'));
      L.push(M(t0 + 8, 'CFE', 'TM', 'Green block request, up to ' + cfg.mkt + ' MW', fromT + '–' + toT + ' · within bid limit'));
      L.push(M(t0 + 14, 'TM', 'IEX', 'Orders placed (G-TAM intraday)', 'member terminal'));
      L.push(M(t0 + 20, 'CFE', 'SLDC', 'Revised schedule submitted', 'scheduling coordinator · rev R2'));
      L.push(M(t0 + 38, 'SLDC', 'CFE', 'Revision accepted', 'effective next permissible block', 'ack'));
      L.push(M(t0 + 48, 'IEX', 'TM', 'Matched ' + f0(s.mkt) + ' MWh', 'clearing confirmed', 'ack'));
      L.push(M(t0 + 50, 'TM', 'CFE', 'Trade confirmation', tag(d, 'IEX-7731'), 'ack'));
      L.push(M(t0 + 60, 'CFE', 'CUST', 'Advisory: window projected ' + pc(s.cfe) + ' CFE', 'month projected ' + score + ' · load unaffected'));
      L.push(M(Math.max(D1, s.to * 15) + 480, 'SUP', 'CFE', '15-minute meter data uploaded', 'generation + interface meters', 'data'));
      L.push(M(Math.max(D1, s.to * 15) + 600, 'CFE', 'REG', 'Issue + cancel ' + f0(s.load - s.grid - s.bessX) + ' MWh to buyer', 'grid ' + f0(s.grid) + ' MWh tagged zero-CFE'));
      break;
    case 'bessOut':
      L.push(M(t0, 'BESS', 'CFE', 'Forced outage: inverter trip', 'unavailable until 06:00', 'data'));
      L.push(M(t0 + 1, 'CFE', 'CFE', 'Battery removed from plan · re-planned', 'lost ' + f0(s.bess0 - s.bess) + ' MWh of clean discharge', 'note'));
      L.push(M(t0 + 3, 'CFE', 'TM', 'Extra green block request', fromT + '–' + toT + ' · mandate cap ' + cfg.mkt + ' MW'));
      L.push(M(t0 + 6, 'CFE', 'SLDC', 'Revision: battery injection withdrawn', 'rev R3'));
      L.push(M(t0 + 8, 'TM', 'IEX', 'Orders placed', 'intraday'));
      L.push(M(t0 + 10, 'CFE', 'CUST', 'Incident notice: night at ' + pc(s.cfe) + ' CFE', 'uncovered demand stays on normal grid supply · month ' + score));
      L.push(M(t0 + 20, 'SLDC', 'CFE', 'Revision accepted', '', 'ack'));
      L.push(M(t0 + 25, 'IEX', 'TM', 'Matched ' + f0(s.mkt) + ' MWh', '', 'ack'));
      L.push(M(t0 + 26, 'TM', 'CFE', 'Trade confirmation', tag(d, 'IEX-7744'), 'ack'));
      L.push(M(D1 + 540, 'BESS', 'CFE', 'Outage report and root cause', 'availability shortfall logged against tolling SLA', 'data'));
      L.push(M(D1 + 600, 'CFE', 'REG', 'Issue + cancel eligible MWh', 'grid ' + f0(s.grid) + ' MWh tagged zero-CFE'));
      break;
    case 'loadRamp':
      L.push(M(t0, 'CUST', 'CFE', 'Load notice: +20 MW AI training run', fromT + '–' + toT + ' · optional flexibility feed', 'data'));
      L.push(M(t0 + 3, 'CFE', 'CFE', 'Re-planned for higher load', '+' + f0(20 * s.hours) + ' MWh to cover', 'note'));
      L.push(M(t0 + 5, 'CFE', 'BESS', 'Raise discharge plan from ' + fromT, ''));
      L.push(M(t0 + 7, 'BESS', 'CFE', 'Acknowledged', '', 'ack'));
      L.push(M(t0 + 9, 'CFE', 'TM', 'Green block request for added load', 'up to ' + cfg.mkt + ' MW'));
      L.push(M(t0 + 15, 'TM', 'IEX', 'Orders placed', ''));
      L.push(M(t0 + 20, 'CFE', 'SLDC', 'Drawal schedule revised', 'rev R2'));
      L.push(M(t0 + 35, 'SLDC', 'CFE', 'Revision accepted', '', 'ack'));
      L.push(M(t0 + 45, 'IEX', 'TM', 'Matched ' + f0(s.mkt) + ' MWh', '', 'ack'));
      L.push(M(t0 + 50, 'CFE', 'CUST', 'Accepted: window matched at ' + pc(s.cfe), 'within contracted deviation band · month ' + score));
      break;
    case 'solarDown':
      L.push(M(t0, 'SUP', 'CFE', 'Intraday forecast update: cloud', 'solar −40% ' + fromT + '–' + toT, 'data'));
      L.push(M(t0 + 2, 'CFE', 'CFE', 'Re-planned · less surplus to store', 'battery charge target lowered', 'note'));
      L.push(M(t0 + 4, 'CFE', 'BESS', 'Revised charge plan', ''));
      L.push(M(t0 + 6, 'BESS', 'CFE', 'Acknowledged', '', 'ack'));
      L.push(M(t0 + 10, 'CFE', 'SLDC', 'Revised injection schedule', 'rev R2'));
      L.push(M(t0 + 28, 'SLDC', 'CFE', 'Accepted', '', 'ack'));
      L.push(M(t0 + 40, 'CFE', 'CUST', 'Advisory: day projected ' + pc(s.cfe), 'month ' + score));
      break;
    case 'mktSpike':
      L.push(M(t0, 'CFE', 'TM', 'Green block request 18:00–24:00', 'bid limit per mandate'));
      L.push(M(t0 + 6, 'TM', 'IEX', 'Orders placed at limit', ''));
      L.push(M(t0 + 60, 'IEX', 'TM', 'Not cleared within limit', 'evening scarcity', 'ack'));
      L.push(M(t0 + 62, 'TM', 'CFE', 'No fill', '', 'ack'));
      L.push(M(t0 + 64, 'CFE', 'CFE', 'No bid above limit (risk mandate)', 'residual ' + f0(s.grid) + ' MWh from grid at 0 CFE', 'note'));
      L.push(M(t0 + 70, 'CFE', 'CUST', 'Advisory: evening at ' + pc(s.cfe), 'month ' + score));
      break;
    case 'txConstraint':
      L.push(M(t0, 'SLDC', 'CFE', 'Constraint: Kutch evacuation 150 MW', fromT + '–' + toT, 'data'));
      L.push(M(t0 + 3, 'CFE', 'CFE', 'Re-planned inside deliverable limit', f0(s.curt) + ' MWh cannot be delivered', 'note'));
      L.push(M(t0 + 6, 'CFE', 'SUP', 'Curtailment schedule', 'per PPA curtailment clause'));
      L.push(M(t0 + 12, 'SUP', 'CFE', 'Acknowledged', '', 'ack'));
      L.push(M(t0 + 15, 'CFE', 'SLDC', 'Revised schedule within limit', 'rev R2'));
      L.push(M(t0 + 30, 'CFE', 'CUST', 'Advisory: excluded network event logged', 'window at ' + pc(s.cfe)));
      break;
    case 'gridCharge':
      L.push(M(t0, 'BESS', 'CFE', 'Charge log: 02:00–05:00 from grid', 'off-plan operator action', 'data'));
      L.push(M(t0 + 2, 'CFE', 'CFE', 'Storage ledger: clean share reduced', f1(s.gc) + ' MWh of grid energy in the battery', 'note'));
      L.push(M(t0 + 5, 'CFE', 'BESS', 'Non-conformance notice', 'tolling clause: charge-source rules'));
      L.push(M(t0 + 20, 'BESS', 'CFE', 'Acknowledged; corrective plan', '', 'ack'));
      L.push(M(D1 + 600, 'CFE', 'REG', 'Discharge attributes pro-rated', f1(s.bessX) + ' MWh discharge carries no certificate'));
      break;
    case 'meterOutage':
      L.push(M(t0, 'CFE', 'CFE', 'Site meter feed missing 02:00–08:00', 'intervals marked INCOMPLETE', 'note'));
      L.push(M(t0 + 5, 'CFE', 'CUST', 'Backfill request', 'validated export from interface meter'));
      L.push(M(t0 + 10, 'CFE', 'REG', 'Hold issuance for affected hours', 'month stays provisional'));
      break;
    case 'issuerOutage':
      L.push(M(t0, 'CFE', 'REG', 'Issuance request', 'validated meter data attached'));
      L.push(M(t0 + 30, 'REG', 'CFE', 'Backlog: issuance delayed', 'three days of certificates pending', 'ack'));
      L.push(M(t0 + 32, 'CFE', 'CFE', 'Matches held provisional', 'no claim published until cancelled', 'note'));
      L.push(M(t0 + 40, 'CFE', 'CUST', 'Statement will show unresolved hours', 'evidence reconciled ' + score));
      break;
  }
  return L.sort((a, b) => a.t - b.t);
}
function dailyCycle(d) {
  const D = d * 1440, M = (t, from, to, label, sub = '', kind = 'instr') => ({ t, from, to, label, sub, kind });
  const H = R.hours.slice(d * 24, d * 24 + 24), mkt = H.reduce((a, o) => a + o.mkt, 0), elig = H.reduce((a, o) => a + o.matched, 0);
  return [
    M(D - 870, 'SUP', 'CFE', 'Availability + generation forecast', 'solar, wind, QCA', 'data'), M(D - 860, 'CUST', 'CFE', 'Load forecast', 'read-only meter / EMS feed', 'data'),
    M(D - 850, 'CFE', 'CFE', 'Day-ahead plan', '96 blocks · rule-based merit order', 'note'), M(D - 840, 'CFE', 'TM', 'G-DAM bid requests', 'within mandate limits'),
    M(D - 830, 'TM', 'IEX', 'Bids submitted', 'green day-ahead market'), M(D - 660, 'IEX', 'TM', 'Cleared ' + f0(mkt) + ' MWh', '', 'ack'), M(D - 655, 'TM', 'CFE', 'Trade confirmations', '', 'ack'),
    M(D - 600, 'CFE', 'SLDC', 'Day-ahead schedules', 'injection + drawal'), M(D - 360, 'SLDC', 'CFE', 'Schedules accepted', '', 'ack'),
    M(D - 350, 'CFE', 'BESS', 'Charge 10:00–16:00, discharge from 18:00', 'signed plan'), M(D - 345, 'BESS', 'CFE', 'Acknowledged', '', 'ack'),
    M(D + 1440 + 480, 'SUP', 'CFE', '15-minute meter data', 'generation + customer site', 'data'),
    M(D + 1440 + 600, 'CFE', 'REG', 'Issue + cancel ' + f0(elig) + ' MWh to buyer', 'certificates per hour, per source')
  ];
}
function tLabel(t) { const d = Math.floor(t / 1440); return dayLabel(d).replace(/^\w+ /, '') + ' ' + hhmm(t); }
function seqSVG(msgs) {
  const W = 1120, ml = 96, lw = (W - ml - 10) / ACTORS.length, top = 46, rh = 42, H = top + msgs.length * rh + 16;
  const ax = id => ml + ACTORS.findIndex(a => a.id === id) * lw + lw / 2;
  let g = '';
  ACTORS.forEach(a => { const x = ax(a.id); g += `<line x1="${x}" x2="${x}" y1="${top - 8}" y2="${H - 6}" stroke="var(--line)" stroke-dasharray="3 4"/><rect x="${x - lw / 2 + 6}" y="6" width="${lw - 12}" height="26" rx="6" fill="#fff" stroke="${a.c}" stroke-width="1.4"/><text x="${x}" y="23" text-anchor="middle" style="font-family:var(--f-body);font-size:11.5px;font-weight:600;fill:${a.c}">${a.name}</text>`; });
  msgs.forEach((m, i) => {
    const y = top + i * rh + 24, x1 = ax(m.from), x2 = ax(m.to);
    g += `<text x="8" y="${y + 4}" style="font-size:10.5px">${tLabel(m.t)}</text>`;
    if (m.from === m.to) {
      const w = Math.min(W - x1 - 20, Math.max(m.label.length, m.sub.length) * 6.3 + 20);
      g += `<rect x="${x1 - 6}" y="${y - 17}" width="${w}" height="34" rx="6" fill="var(--brand-soft)" stroke="var(--brand-2)" stroke-width="1"/><text x="${x1 + 4}" y="${y - 3}" style="font-family:var(--f-body);font-size:12px;font-weight:600;fill:var(--brand)">${esc(m.label)}</text><text x="${x1 + 4}" y="${y + 11}" style="font-size:10.5px">${esc(m.sub)}</text>`;
    } else {
      const dir = x2 > x1 ? 1 : -1, col = ACT[m.from].c;
      g += `<line x1="${x1}" x2="${x2 - dir * 7}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="1.6" ${m.kind === 'ack' ? 'stroke-dasharray="5 4"' : ''}/><path d="M${x2},${y} l${-dir * 9},-5 v10 z" fill="${col}"/><circle cx="${x1}" cy="${y}" r="3" fill="${col}"/>`;
      const est = Math.max(m.label.length * 6.6, m.sub.length * 5.9);
      const lx = Math.min(x1, x2) + 8, anchorEnd = lx + est > W - 6;
      const tx = anchorEnd ? Math.max(x1, x2) - 8 : lx, ta = anchorEnd ? 'end' : 'start';
      g += `<text x="${tx}" y="${y - 6}" text-anchor="${ta}" style="font-family:var(--f-body);font-size:12px;font-weight:500;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:4px">${esc(m.label)}</text>`;
      if (m.sub) g += `<text x="${tx}" y="${y + 14}" text-anchor="${ta}" style="font-size:10.5px;paint-order:stroke;stroke:#fff;stroke-width:4px">${esc(m.sub)}</text>`;
    }
  });
  return `<div class="seqwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordination sequence between CFE Manager and counterparties">${g}</svg></div>`;
}
function feedItems(upto) {
  const all = state.events.length ? state.events.flatMap(eventMessages) : dailyCycle(state.day);
  return all.filter(m => m.t <= upto).sort((a, b) => b.t - a.t);
}
function msgHTML(m) {
  const a = ACT[m.from], b = ACT[m.to];
  return `<div class="msg"><span class="tm">${hhmm(m.t)}</span><span class="tx"><span class="actor" style="color:${a.c};background:var(--panel-3)">${a.name}</span>${m.from !== m.to ? `→ <span class="actor" style="color:${b.c};background:var(--panel-3)">${b.name}</span>` : ''}<br><b>${esc(m.label)}</b></span>${m.sub ? `<span class="rt">${esc(m.sub)}</span>` : ''}</div>`;
}

/* ===================== MANAGER VIEWS ===================== */
const V = {};

function timeControls() {
  return `<div class="row">
    <button class="btn sm" data-act="dayPrev" aria-label="Previous day">‹</button>
    <span style="font-family:var(--f-display);font-weight:600;font-size:18px;min-width:118px;text-align:center">${dayLabel(state.day)}</span>
    <button class="btn sm" data-act="dayNext" aria-label="Next day">›</button>
    <label class="small muted" for="blk" style="margin-left:6px">Time</label>
    <input type="range" id="blk" min="0" max="95" value="${state.block}" style="width:180px">
    <span class="num" style="font-weight:600;min-width:46px">${blkTime(state.block)}</span>
    <button class="btn sm" data-act="play">${state.playing ? 'Pause' : '▶ Run day'}</button>
  </div>`;
}
V.orchestration = () => {
  const has = state.events.length;
  const sel = has ? state.events[Math.min(state.evSel, state.events.length - 1)] : null;
  const msgs = sel ? eventMessages(sel) : dailyCycle(state.day);
  const s = sel ? windowStats(sel) : null;
  const blocks = sel ? R.blocks.slice(s.from, Math.min(s.to, s.from + 48)) : R.blocks.slice(state.day * BPD + 72, state.day * BPD + 96);
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Orchestration</div><h1>${sel ? EVENTS[sel.key].name + ' · how the system responds' : 'A normal day of coordination'}</h1><p class="lead">${sel ? 'The engine re-plans, then each authorised party acts in its own system. CFE Manager never dispatches the grid itself.' : 'From day-ahead forecasts to certificates cancelled to the buyer: who sends what to whom, and when.'}</p></div>
    <div class="row">${eventControls()}${has ? state.events.map((e, i) => `<button class="btn sm ${i === state.evSel ? 'primary' : ''}" data-act="evSel" data-i="${i}">${EVENTS[e.key].name}</button>`).join('') : ''}<button class="btn sm" data-go="control">Back to control room</button></div></div>
  ${activeChips()}
  ${s ? `<div class="kpis">
    ${kpi('Clean supply vs plan', '−' + f0(Math.max(0, s.act0 - s.act)) + ' <small>MWh</small>', 'over ' + s.hours + ' hours', 'warn')}
    ${kpi('Battery, clean', f0(s.bess) + ' <small>MWh</small>', 'plan ' + f0(s.bess0))}
    ${kpi('Green exchange blocks', f0(s.mkt) + ' <small>MWh</small>', 'plan ' + f0(s.mkt0))}
    ${kpi('Grid residual (0 CFE)', f0(s.grid) + ' <small>MWh</small>', 'plan ' + f0(s.grid0), s.grid > s.grid0 + 1 ? 'crit' : '')}
    ${kpi('Window CFE', pc(s.cfe), 'plan ' + pc(s.cfe0), s.cfe >= .9 ? 'good' : 'crit')}
    ${kpi('Month score', pc(R.M.scoreComplete), 'plan ' + pc(R0.M.scoreComplete), R.M.scoreComplete * 100 >= state.tier ? 'good' : 'crit')}
  </div>` : ''}
  <div class="panel"><div class="ph"><h3>Coordination sequence</h3><span class="sub">Solid = instruction or data · dashed = acknowledgement · shaded = internal step</span></div>${seqSVG(msgs)}</div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Dispatch merit order</h3><span class="sub">Applied in every 15-minute block</span></div>
      <ol class="plain" style="padding-left:20px;gap:8px">
        <li><b>Contracted solar and wind</b> serve load directly, after transmission losses.</li>
        <li><b>Surplus charges the battery</b>; the charge source is logged so attributes follow the energy.</li>
        <li><b>Battery discharges</b> into deficits; only the clean-charged share earns certificates.</li>
        <li><b>Green exchange blocks</b> are requested through the trading member, within the bid limit.</li>
        <li><b>Grid supply</b> covers anything left; these MWh count at zero. The model assumes grid fallback; real reliability depends on the customer\u2019s electrical infrastructure and backup.</li>
        <li>Surplus that cannot be stored is <b>excluded</b> from the score, never banked silently.</li>
      </ol></div>
    <div class="panel"><div class="ph"><h3>15-minute schedule</h3><span class="sub">${sel ? 'first 12 hours of the window' : '18:00–24:00'} · MW</span></div>
      <div class="tw" style="max-height:330px;overflow:auto"><table><thead><tr><th>Block</th><th class="r">Load</th><th class="r">Solar</th><th class="r">Wind</th><th class="r">Battery</th><th class="r">Blocks</th><th class="r">Grid</th><th class="r">SoC</th></tr></thead><tbody>
      ${blocks.map(x => `<tr><td class="num">${dayLabel(x.d).replace(/^\w+ /, '')} ${blkTime(x.b)}</td><td class="r num">${f1(x.L)}</td><td class="r num">${f1(x.solarDir)}</td><td class="r num">${f1(x.windDir)}</td><td class="r num">${x.P_b === 0 && state.cfg.bessMW ? '<span class="no">out</span>' : f1(x.dis - x.chg - x.gc)}</td><td class="r num">${f1(x.mkt)}</td><td class="r num">${f1(x.gridToLoad)}</td><td class="r num">${state.cfg.bessMWh ? pc(x.soc / state.cfg.bessMWh, 0) : '—'}</td></tr>`).join('')}
      </tbody></table></div><p class="small muted" style="margin-top:6px">Battery column: positive = discharge, negative = charging.</p></div>
  </div>`;
};

V.customers = () => {
  const all = [...CUSTOMERS, ...state.newCustomers];
  const a = all.find(c => c.id === state.acct) || all[0];
  const icp = a.icp.reduce((x, y) => x + y, 0);
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Customers</div><h1>Demand pipeline</h1><p class="lead">Named-account selling, not self-serve sign-up. An account counts as pipeline only once its power-contract owner is known.</p></div><button class="btn" data-role="customer" data-view="c_onboard">Open customer onboarding</button></div>
  <div class="kanban">${CUST_STAGES.map((st, si) => { const cs = all.filter(c => c.stage === si); return `<div class="kcol"><div class="kh"><span class="eyebrow">${si + 1} · ${st}</span><span class="small muted">${cs.length}</span></div>${cs.map(c => `<button class="card ${c.id === a.id ? 'sel' : ''} ${c.isNew ? 'new' : ''}" data-act="acct" data-id="${c.id}"><span class="t">${esc(c.name)}</span><span class="m">${esc(c.site)}, ${c.state}</span><span class="m">${c.mw} MW · CFE${c.tier}${c.isNew ? ' · new' : ''}</span></button>`).join('')}</div>`; }).join('')}</div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>${esc(a.name)}</h3>${chip(CUST_STAGES[a.stage], a.stage === 6 ? 'good' : 'info')}</div>
      <dl class="kv"><dt>Site</dt><dd>${esc(a.site)}, ${a.state}</dd><dt>Type</dt><dd>${esc(a.type)}</dd><dt>Load</dt><dd>${a.mw} MW</dd><dt>Target</dt><dd>CFE${a.tier}, monthly</dd><dt>Next action</dt><dd>${esc(a.next)}</dd></dl>
      <div style="margin-top:14px" class="stack">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">Ideal-customer score</span><span class="num" style="font-weight:600">${icp} / 100</span></div>
        ${ICP_PARTS.map(([n, mx], i) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) 120px 44px;gap:10px;align-items:center;font-size:12.5px"><span>${n}</span><div class="meter"><div class="f" style="width:${a.icp[i] / mx * 100}%"></div></div><span class="num r" style="text-align:right">${a.icp[i]}/${mx}</span></div>`).join('')}
        ${a.state !== 'Gujarat' ? `<div class="callout warn">State gate: <b>${a.state}</b> is not cleared for supply yet. Offer diagnostic and shadow monitoring; see Feasibility.</div>` : ''}
      </div></div>
    <div class="panel"><div class="ph"><h3>Buying committee</h3><span class="sub">Every function must say yes</span></div>
      <div class="tw"><table><thead><tr><th>Function</th><th>Status</th><th>Proof they need</th></tr></thead><tbody>
      ${COMMITTEE.map((c, i) => `<tr><td>${c}</td><td>${a.committee[i] ? chip('Signed off', 'good') : chip('Open', 'warn')}</td><td class="wrap small muted">${['Like-for-like baseline vs self-procurement', 'Method, registry evidence, independent verifier', 'No touch on servers, cooling or UPS', 'Exposure caps, collateral, termination', 'Licensing route, open access, captive matrix', 'Meter-only data, read-only access, audit logs', 'Fit with global CFE reporting'][i]}</td></tr>`).join('')}
      </tbody></table></div></div>
  </div>`;
};

V.suppliers = () => {
  const all = [...ASSETS, ...state.newSuppliers];
  const a = all.find(x => x.id === state.supSel) || all[1];
  const chk = SIM.checkAsset(a);
  const M = R.M;
  const live = [
    ['KTC-SOL-01', 'Solar', M.genS, M.solar, 'var(--solar)'], ['KTC-WND-02', 'Wind', M.genW, M.wind, 'var(--wind)'],
    ['JMN-BES-01', 'Battery', M.bessElig + M.bessInelig, M.bessElig, 'var(--bess)'], ['GTAM-TRD-01', 'Exchange blocks', M.mkt, M.mkt, 'var(--mkt)']
  ];
  let ape = 0, n = 0; R.hours.forEach(o => { if (o.fcClean > 5) { ape += Math.abs(o.actClean - o.fcClean) / o.fcClean; n++; } });
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Suppliers</div><h1>Contracted portfolio, not an open marketplace</h1><p class="lead">Supply enters the dispatch engine only after it clears every gate. Each stage has an owner and a document.</p></div><button class="btn" data-role="supplier" data-view="s_onboard">Open supplier onboarding</button></div>
  <div class="kanban" style="grid-template-columns:repeat(7,minmax(150px,1fr))">${[...SUP_STAGES, 'Rejected'].map(st => { const xs = all.filter(x => x.stage === st); return `<div class="kcol" ${st === 'Rejected' ? 'style="background:#FFF8F7"' : ''}><div class="kh"><span class="eyebrow">${st}</span><span class="small muted">${xs.length}</span></div>${xs.map(x => `<button class="card ${x.id === a.id ? 'sel' : ''} ${x.isNew ? 'new' : ''}" data-act="sup" data-id="${x.id}"><span class="t">${sw(x.c)}${esc(x.name)}</span><span class="m mono">${x.id}</span><span class="m">${typeof x.cap === 'function' ? x.cap() : x.cap} · ${x.state}</span></button>`).join('')}</div>`; }).join('')}</div>
  <div class="g12">
    <div class="panel"><div class="ph"><h3>${esc(a.name)}</h3>${chk.eligible ? chip(a.stage, 'good') : chip(a.stage === 'Rejected' ? 'Rejected' : 'Gate open', a.stage === 'Rejected' ? 'crit' : 'warn')}</div>
      <dl class="kv"><dt>Asset</dt><dd class="mono">${a.id}</dd><dt>Owner</dt><dd>${esc(a.owner)}</dd><dt>Type</dt><dd>${esc(a.tech)}</dd><dt>Location</dt><dd>${esc(a.district)}, ${esc(a.state)}</dd><dt>Contract</dt><dd>${esc(a.contract)}</dd></dl>
      <div class="gates" style="margin-top:12px">${chk.checks.map(c => `<div class="gate ${c.ok ? 'pass' : 'fail'}"><span class="ic">${c.ok ? '✓' : '✕'}</span><span>${c.k}</span><span class="small ${c.ok ? 'muted' : 'no'}">${c.ok ? 'pass' : c.fail}</span></div>`).join('')}</div></div>
    <div class="panel"><div class="ph"><h3>Live portfolio · October</h3><span class="sub">MWh · day-ahead clean forecast error ${pc(ape / n)} (MAPE, hours > 5 MWh)</span></div>
      <div class="tw"><table><thead><tr><th>Asset</th><th class="r">Generated / supplied</th><th class="r">Matched to load</th><th class="r">Certificates</th><th>Attributes</th></tr></thead><tbody>
      ${live.map(([id, n2, g, m, c]) => `<tr><td>${sw(c)}<span class="mono">${id}</span> <span class="muted small">${n2}</span></td><td class="r num">${f0(g)}</td><td class="r num">${f0(m)}</td><td class="r num">${f0(R.certs.filter(x => x.asset === id).length)}</td><td>${chip('Exclusive to buyer', 'good')}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="callout" style="margin-top:12px">Generated minus matched is surplus stored, lost to losses, or excluded. Battery rows count discharge; grid-charged discharge earns no certificate.</div></div>
  </div>`;
};

V.contracts = () => `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Contracts</div><h1>One commercial interface, nine documents behind it</h1><p class="lead">The customer signs one services agreement. Physical supply, trading, open access and certificates each keep their own legal document and counterparty.</p></div>${chip('Hyperscaler A · illustrative', 'info')}</div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Document</th><th>Parties</th><th>Status</th><th>Key terms (non-price)</th><th>Owner</th></tr></thead><tbody>
  ${CONTRACT_STACK.map(c => `<tr><td style="font-weight:600">${c.doc}</td><td class="small">${c.parties}</td><td>${chip(c.status, c.tone)}</td><td class="wrap small">${c.terms}</td><td class="small muted">${c.owner}</td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Who carries which risk</h3></div><div class="tw"><table><thead><tr><th>Risk</th><th>Allocated to</th></tr></thead><tbody>${RISK_ALLOC.map(([r, w]) => `<tr><td>${r}</td><td class="wrap small">${w}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="panel"><div class="ph"><h3>Service schedule</h3>${chip('Method v1.0', 'neutral')}</div>
      <dl class="kv"><dt>Metric</dt><dd>Monthly load-weighted share of hourly-matched eligible MWh</dd><dt>Floor</dt><dd>CFE${state.tier}</dd><dt>Geography</dt><dd>Same state (Gujarat)</dd><dt>Storage</dt><dd>Charge source tracked; losses applied</dd><dt>Excluded</dt><dd>Grid residual, untracked storage, surplus, unissued certificates</dd><dt>Data gaps</dt><dd>Counted as unmatched until reconciled</dd><dt>Remedy</dt><dd>Service credit on verified month only, capped (illustrative 2% of fee per point, max 20%)</dd><dt>Not promised</dt><dd>90% every hour; server uptime; future regulatory compliance</dd></dl></div>
  </div>`;

V.ecosystem = () => {
  const e = ECO.find(x => x.id === state.ecoSel) || ECO[0];
  const cx = 500, cy = 285, rx = 395, ry = 236;
  let g = '';
  ECO.forEach((n, i) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / ECO.length, x = cx + rx * Math.cos(ang), y = cy + ry * Math.sin(ang);
    const col = n.kind === 'Statutory' ? 'var(--ink-2)' : n.kind === 'Partner' ? 'var(--r-trader)' : n.kind === 'Market infrastructure' ? 'var(--mkt)' : '#0E7568';
    const dash = n.kind === 'Statutory' || n.kind === 'Market infrastructure' ? 'stroke-dasharray="5 5"' : '';
    g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${col}" stroke-width="${n.id === e.id ? 2.6 : 1.3}" ${dash} opacity=".75"/>`;
    g += `<g class="clickable" data-act="eco" data-id="${n.id}"><rect x="${x - 90}" y="${y - 27}" width="180" height="54" rx="9" fill="${n.id === e.id ? 'var(--brand-soft)' : '#fff'}" stroke="${n.id === e.id ? 'var(--brand)' : col}" stroke-width="${n.id === e.id ? 2.4 : 1.3}"/><text x="${x}" y="${y - 3}" text-anchor="middle" style="font-family:var(--f-body);font-size:14px;font-weight:600;fill:var(--ink)">${n.name.replace('Licensed trading member', 'Trading member').replace(' / State nodal agency', ' / nodal agency')}</text><text x="${x}" y="${y + 15}" text-anchor="middle" style="font-size:11.5px">${n.kind}</text></g>`;
  });
  g += `<circle cx="${cx}" cy="${cy}" r="84" fill="var(--brand)"/><text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-family:var(--f-display);font-size:22px;font-weight:700;fill:#fff">CFE Manager</text><text x="${cx}" y="${cy + 20}" text-anchor="middle" style="font-size:11.5px;fill:#CFE0F2">one interface</text>`;
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Ecosystem and compliance</div><h1>We build on India's existing energy stack</h1><p class="lead">Exchanges, system operators and regulators keep their authority. CFE Manager coordinates with them through the channels the rules already define. Only customers, generators and storage operators use our portals.</p></div></div>
  <div class="g21">
    <div class="panel"><div class="ph"><h3>Who we coordinate with</h3><div class="legend"><span><svg width="22" height="6"><line x1="0" x2="22" y1="3" y2="3" stroke="#0E7568" stroke-width="2"/></svg> platform user</span><span><svg width="22" height="6"><line x1="0" x2="22" y1="3" y2="3" stroke="var(--r-trader)" stroke-width="2"/></svg> contracted partner</span><span><svg width="22" height="6"><line x1="0" x2="22" y1="3" y2="3" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="4 3"/></svg> statutory / market body</span></div></div>
      <div class="chart"><svg viewBox="0 0 1000 570" role="img" aria-label="Ecosystem map">${g}</svg></div></div>
    <div class="panel"><div class="ph"><h3>${e.name}</h3>${chip(e.kind, e.kind === 'Statutory' ? 'neutral' : e.kind === 'Partner' ? 'info' : 'good')}</div>
      <p class="muted small" style="margin-bottom:10px">${e.sub}</p>
      <dl class="kv"><dt>Interface</dt><dd>${e.iface}</dd><dt>We send</dt><dd>${e.send}</dd><dt>We receive</dt><dd>${e.recv}</dd><dt>Cadence</dt><dd>${e.cadence}</dd><dt>Owner</dt><dd>${e.owner}</dd></dl>
      ${e.id === 'iex' ? '<div class="callout warn" style="margin-top:12px">CFE Manager holds no exchange membership. Orders go through a licensed trading member under a written mandate.</div>' : ''}
      ${e.kind === 'Statutory' ? '<div class="callout" style="margin-top:12px">No login to our platform. We file, submit and receive through the body’s own process; the record is kept in our compliance ledger.</div>' : ''}</div>
  </div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Coordination calendar</h3><span class="sub">for one delivery day D</span></div>
      <div class="tw"><table><thead><tr><th>When</th><th>Between</th><th>What</th></tr></thead><tbody>${CALENDAR.map(([a, b, c]) => `<tr><td class="num" style="font-weight:600">${a}</td><td class="small">${b}</td><td class="wrap small">${c}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>Captive compliance · Kutch Solar SPV</h3>${chip('Assumed eligibility', 'warn')}</div>
        <p class="small muted" style="margin-bottom:10px">Annual test under the Electricity (Amendment) Rules, 2026. Illustrative figures; counsel confirms the structure.</p>
        ${[['Captive users’ ownership', 26.4, 26, '% of equity'], ['Captive consumption, FY to date', 58.2, 51, '% of generation']].map(([k, v, th, u]) => `<div style="display:grid;gap:4px;margin-bottom:10px"><div class="row" style="justify-content:space-between"><span class="small">${k}</span><span class="num" style="font-weight:600">${v}${u.startsWith('%') ? '%' : ''} <span class="muted small">min ${th}%</span></span></div><div class="meter"><div class="f" style="width:${v}%;background:#0E7568"></div><div class="tk" style="left:${th}%"></div></div></div>`).join('')}
        <div class="callout warn">Alert rule: if forecast consumption falls below 54% by Q3, rebalance offtake. If status fails, CSS and additional surcharge fall on the party named in the SHA.</div></div>
      <div class="panel"><div class="ph"><h3>Approvals register</h3></div>
        <div class="tw"><table><tbody>${[['GEOA approval · JMN-DC-01', 'Approved', 'good'], ['Connectivity · KTC-SOL-01', 'Granted', 'good'], ['Scheduling coordinator appointed', 'Active', 'good'], ['GERC GEOA 6th amendment review', 'Counsel reviewing', 'warn'], ['CEA cyber audit · CF90 platform', 'Due Jan 2027', 'neutral']].map(([a, b, t]) => `<tr><td>${a}</td><td>${chip(b, t)}</td></tr>`).join('')}</tbody></table></div></div>
    </div>
  </div>`;
};

V.feasibility = () => {
  const F = state.feasForm, res = state.feas;
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Feasibility and scale</div><h1>Can we serve this customer?</h1><p class="lead">Enter any request. The engine sizes the portfolio, then each state gate decides whether we quote, shadow, or wait.</p></div></div>
  <div class="g12">
    <div class="panel"><div class="ph"><h3>Request</h3></div>
      <div class="form">
        <div class="fld full"><label for="fz-name">Customer</label><input type="text" id="fz-name" value="${esc(F.name)}"></div>
        <div class="fld"><label for="fz-state">Site state</label><select id="fz-state">${STATES.map(s => `<option ${s === F.state ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="fld"><label for="fz-mw">Average load, MW</label><input type="number" id="fz-mw" min="5" max="500" value="${F.mw}"></div>
        <div class="fld"><label for="fz-shape">Load shape</label><select id="fz-shape"><option value="flat" ${F.shape === 'flat' ? 'selected' : ''}>Flat 24/7 (data centre)</option><option value="day" ${F.shape === 'day' ? 'selected' : ''}>Day-heavy (industrial)</option></select></div>
        <div class="fld"><label for="fz-tier">Target</label><select id="fz-tier">${[70, 80, 90, 95].map(t => `<option value="${t}" ${+F.tier === t ? 'selected' : ''}>CFE${t}</option>`).join('')}</select></div>
      </div>
      <div class="wnav"><span class="small muted">Sizing runs about 15 month-long simulations.</span><button class="btn primary" data-act="runFeas">Assess request</button></div></div>
    <div class="panel">${res ? feasResult(res) : '<div class="ph"><h3>Result</h3></div><p class="muted">Run an assessment to see the sized portfolio, the state gates and the entry route.</p>'}</div>
  </div>
  <div class="panel"><div class="ph"><h3>State entry gates</h3><span class="sub">A state opens only when all eight are green</span></div>
    <div class="tw"><table><thead><tr><th>State</th>${STATE_GATES.map(g => `<th class="c">${g}</th>`).join('')}<th>Position</th></tr></thead><tbody>
    ${STATES.map(s => `<tr><td style="font-weight:600">${s}</td>${STATE_STATUS[s].map(v => `<td class="c">${v === 2 ? '<span class="ok">●</span>' : v === 1 ? '<span class="pend">◐</span>' : '<span class="no">○</span>'}</td>`).join('')}<td class="wrap small muted">${STATE_NOTES[s]}</td></tr>`).join('')}
    </tbody></table></div><p class="small muted" style="margin-top:8px">● cleared · ◐ in progress · ○ not started</p></div>`;
};
function runFeasibility() {
  const F = state.feasForm;
  const z = SIM.size(P, +F.mw, F.shape, +F.tier);
  const gates = STATE_STATUS[F.state];
  const avail = { solar: 450, wind: 300, bessMW: 230, bessMWh: 1000 };
  const needs = F.state === 'Gujarat' ? Object.keys(avail).filter(k => z.cfg[k] > avail[k]) : [];
  let verdict, tone, route;
  if (!z.feasible) { verdict = 'Bespoke only'; tone = 'crit'; route = 'Portfolio alone cannot reach this target. Needs firm clean supply such as hydro or nuclear blocks; quote as a premium, case-by-case tier.'; }
  else if (F.state === 'Gujarat' && !needs.length) { verdict = 'Quote now'; tone = 'good'; route = 'Diagnostic (4–8 weeks) → term sheet → conditional contract. Supply exists in the qualified Gujarat pipeline.'; }
  else if (F.state === 'Gujarat') { verdict = 'Quote with new procurement'; tone = 'warn'; route = 'Run an RFP for ' + needs.join(', ') + ' before signing. Shadow mode meanwhile.'; }
  else if (gates.filter(v => v === 2).length >= 1 && F.state === 'Maharashtra') { verdict = 'Shadow mode first'; tone = 'warn'; route = 'Offer diagnostic and shadow monitoring now. Contract only after an inter-state route (GNA) or in-state supply is qualified and MERC charges are confirmed.'; }
  else { verdict = 'Diagnostic only'; tone = 'neutral'; route = 'No qualified supply or delivery route in ' + F.state + '. Sell the diagnostic, build the state file, revisit at the next gate review.'; }
  state.feas = { F: { ...F }, z, gates, verdict, tone, route, needs, avail };
}
function feasResult(r) {
  const c = r.z.cfg;
  return `<div class="ph"><h3>${esc(r.F.name)} · ${r.F.mw} MW · CFE${r.F.tier}</h3>${chip(r.verdict, r.tone)}</div>
    <div class="callout ${r.tone === 'good' ? 'good' : r.tone === 'crit' ? 'crit' : 'warn'}" style="margin-bottom:12px">${r.route}</div>
    <div class="g2" style="gap:12px">
      <div><div class="eyebrow" style="margin-bottom:6px">Sized portfolio${r.F.state !== 'Gujarat' ? ' (Gujarat-shape proxy)' : ''}</div>
        <div class="tw"><table><tbody>
          <tr><td>${sw('var(--solar)')}Solar</td><td class="r num">${c.solar} MWac</td></tr><tr><td>${sw('var(--wind)')}Wind</td><td class="r num">${c.wind} MW</td></tr>
          <tr><td>${sw('var(--bess)')}Battery</td><td class="r num">${c.bessMW} MW / ${c.bessMWh} MWh</td></tr><tr><td>${sw('var(--mkt)')}Exchange block cap</td><td class="r num">${c.mkt} MW</td></tr>
          <tr><td style="font-weight:600">Backtest score</td><td class="r num" style="font-weight:600">${pc(r.z.score)}</td></tr>
        </tbody></table></div></div>
      <div><div class="eyebrow" style="margin-bottom:6px">Gates in ${r.F.state}</div>
        <div class="gates">${STATE_GATES.map((g, i) => `<div class="gate ${r.gates[i] === 2 ? 'pass' : r.gates[i] === 1 ? 'wait' : 'fail'}" style="padding:5px 10px"><span class="ic">${r.gates[i] === 2 ? '✓' : r.gates[i] === 1 ? '…' : '✕'}</span><span class="small">${g}</span><span></span></div>`).join('')}</div></div>
    </div>
    <div class="eyebrow" style="margin:14px 0 6px">Entry route</div>
    <div class="row small">${['Discovery', 'Diagnostic 4–8 wks', 'Shadow 2–6 months', 'Term sheet', 'Contract 6–24 months', 'Live'].map((s, i) => `<span class="chip ${i < (r.tone === 'good' ? 6 : r.tone === 'warn' ? 3 : 2) ? 'info' : 'neutral'}">${s}</span>${i < 5 ? '<span class="faint">→</span>' : ''}`).join('')}</div>`;
}

V.checks = () => {
  const T = SIM.tests(P, state.cfg), pass = T.filter(t => t.pass).length;
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · System checks</div><h1>The engine won't count what it can't prove</h1><p class="lead">Acceptance tests A–J run against the live engine with the current portfolio every time this page opens.</p></div>${chip(pass + ' of ' + T.length + ' passed', pass === T.length ? 'good' : 'crit')}</div>
  <div class="g2">
    <div class="panel"><div class="gates">${T.map(t => `<div class="gate ${t.pass ? 'pass' : 'fail'}"><span class="ic" style="font-family:var(--f-display);font-size:13px">${t.id}</span><span><b style="font-weight:600">${t.name}</b><br><span class="mono small muted" style="overflow-wrap:anywhere">${esc(t.detail)}</span></span>${chip(t.pass ? 'Pass' : 'Fail', t.pass ? 'good' : 'crit')}</div>`).join('')}</div></div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>What we can and cannot say</h3></div><div class="tw"><table><tbody>
        ${[['“Our prototype estimates a monthly time-matched score for a simulated site.”', 'Allowed, labelled', 'good'], ['“Our shadow pilot measured X% from approved meters.”', 'After a real pilot', 'warn'], ['“An independent verifier confirmed X%.”', 'After sign-off', 'warn'], ['“Every hour is 90% carbon-free.”', 'Misleading', 'crit'], ['“The servers ran on green electrons all night.”', 'Misleading', 'crit'], ['“A certificate issuer verified our SLA.”', 'Unsupported', 'crit']].map(([a, b, t]) => `<tr><td class="wrap">${a}</td><td>${chip(b, t)}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="panel"><div class="ph"><h3>Model limits</h3></div><ul class="plain small muted">
        <li>Synthetic Gujarat-shaped profiles with a fixed seed; not plant or site data.</li>
        <li>A dispatch and sizing prototype: rule-based merit-order dispatch with logged decisions. No optimisation model is connected yet.</li><li>Sizing uses one illustrative month. Full-year and adverse-weather testing is required before offering a monthly guarantee.</li><li>Passing 10 of 10 internal tests does not establish commercial feasibility, regulatory compliance or independent assurance.</li>
        <li>No tariffs or margins. The price index is illustrative; economics sit with the finance model.</li>
        <li>Certificate serials, trade IDs and parties are invented. No registry, exchange or SLDC is connected.</li>
        <li>${SIM.ENGINE_VERSION} · ${SIM.DATA_VERSION}</li>
      </ul></div>
    </div>
  </div>`;
};

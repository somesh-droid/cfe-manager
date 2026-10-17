/* ===================== OPS CONSOLE v4: icons, control room, analytics, home ===================== */
const IC = p => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICONS = {
  control: IC('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  blocks: IC('<path d="M4 20V10M9 20V6M14 20v-8M19 20V4"/>'),
  orchestration: IC('<path d="M4 7h12l-3-3M20 17H8l3 3"/>'),
  evidence: IC('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  analytics: IC('<path d="M3 20h18"/><path d="M5 16l4-5 4 3 6-8"/>'),
  onboarding: IC('<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M19 8v6M16 11h6"/>'),
  customers: IC('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M10 21v-4h4v4"/>'),
  suppliers: IC('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  contracts: IC('<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h7M9 17h5"/>'),
  feasibility: IC('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'),
  ecosystem: IC('<circle cx="12" cy="12" r="2.5"/><circle cx="4.5" cy="5.5" r="2"/><circle cx="19.5" cy="5.5" r="2"/><circle cx="4.5" cy="18.5" r="2"/><circle cx="19.5" cy="18.5" r="2"/><path d="M6 7l4 3.5M18 7l-4 3.5M6 17l4-3.5M18 17l-4-3.5"/>'),
  checks: IC('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
  manager: IC('<path d="M3 14 L7 6 L10 11 L13 4 L17 14"/><circle cx="19" cy="14" r="1.5"/>'),
  customer: IC('<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>'),
  supplier: IC('<path d="M12 21V11"/><path d="M12 11L6 5M12 11l8-1M12 11l-2 8"/><circle cx="12" cy="11" r="1.5"/>'),
  trader: IC('<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>'),
  verifier: IC('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>')
};

/* ---------- what-if menu ---------- */
function eventControls() {
  const n = state.events.length;
  return `<details class="menu" data-menu="whatif" ${state.wOpen ? 'open' : ''}><summary class="btn ${n ? 'danger' : ''}">What-if${n ? ' · ' + n + ' on' : ''} ▾</summary>
  <div class="menu-pop wide" style="left:auto;right:0">
    <div class="ph" style="margin-bottom:10px"><div><h4>What-if scenarios</h4><p class="small muted" style="max-width:62ch">Simulate a disruption on ${dayLabel(state.day)}. Dispatch, instructions and evidence recalculate, and each screen shows plan against what actually happened.</p></div>${n ? '<button class="btn sm" data-act="clearEv">Reset to a normal day</button>' : chip('Normal day', 'good')}</div>
    <div class="scens">${Object.entries(EVENTS).map(([k, e]) => { const on = state.events.some(x => x.key === k && x.d === state.day); return `<button class="scen" data-act="togEv" data-k="${k}" aria-pressed="${on}"><b>${on ? '● ' : ''}${e.name}</b><span>${e.desc}</span></button>`; }).join('')}</div>
  </div></details>`;
}
function activeChips() {
  if (!state.events.length) return '';
  return `<div class="activechips"><span class="small muted">What-if active:</span>${state.events.map((e, i) => `<span class="chip crit">${EVENTS[e.key].name} · ${dayLabel(e.d).replace(/^\w+ /, '')}<button data-act="rmEv" data-i="${i}" aria-label="Remove" style="border:0;background:none;cursor:pointer;color:inherit;padding:0 0 0 6px">✕</button></span>`).join('')}<button class="btn sm ghost" data-act="clearEv">Reset</button></div>`;
}

/* ---------- compact network ---------- */
function networkSVG(b) {
  const W = 640, H = 340;
  const out = b.P_b === 0 && state.cfg.bessMW > 0, cap = state.cfg.bessMWh || 1;
  const node = (x, y, w, h, t, s, v, o = {}) => `<g ${o.go ? `class="clickable" data-go="${o.go}"` : ''}${o.role ? `class="clickable" data-role="${o.role}"` : ''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${o.fill || '#fff'}" stroke="${o.stroke || 'var(--line)'}" stroke-width="${o.sw || 1.2}"/>${o.bar ? `<rect x="${x}" y="${y + 10}" width="4" height="${h - 20}" rx="2" fill="${o.bar}"/>` : ''}<text x="${x + 14}" y="${y + 21}" style="font-family:var(--f-body);font-size:13.5px;font-weight:600;fill:${o.ink || 'var(--ink)'}">${t}</text><text x="${x + 14}" y="${y + 37}" style="font-size:11px;fill:${o.sub || 'var(--muted)'}">${s}</text>${v ? `<text x="${x + 14}" y="${y + h - 12}" style="font-family:var(--f-display);font-size:${o.vs || 20}px;font-weight:600;fill:${o.ink || 'var(--ink)'}">${v}</text>` : ''}</g>`;
  const edge = (d, mw, c, lx, ly) => { const on = mw > 0.05; return `<path d="${d}" class="flow ${mw > 0.5 ? 'anim' : ''}" stroke="${on ? c : 'var(--line)'}" stroke-width="${on ? Math.min(12, 1.8 + mw / 12) : 1.2}" opacity="${on ? .9 : .8}"/><g><rect x="${lx - 27}" y="${ly - 10}" width="54" height="19" rx="9.5" fill="#fff" stroke="var(--line-2)"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" style="font-family:var(--f-mono);font-size:11px;font-weight:600;fill:${on ? 'var(--ink)' : 'var(--faint)'}">${f0(mw)}</text></g>`; };
  const batt = b.dis > 0.05 ? b.dis : (b.chg + b.gc), hubIn = 268, hubY = 170;
  let g = '';
  g += edge(`M186,52 C226,52 230,${hubY - 14} ${hubIn},${hubY - 14}`, b.S, 'var(--solar)', 222, 70);
  g += edge(`M186,128 C226,128 230,${hubY - 4} ${hubIn},${hubY - 4}`, b.W, 'var(--wind)', 222, 134);
  g += edge(b.dis > 0.05 ? `M186,204 C226,204 230,${hubY + 6} ${hubIn},${hubY + 6}` : `M${hubIn},${hubY + 6} C230,${hubY + 6} 226,204 186,204`, batt, 'var(--bess)', 222, 202);
  g += edge(`M186,280 C226,280 230,${hubY + 16} ${hubIn},${hubY + 16}`, b.mkt, 'var(--mkt)', 222, 268);
  const toSite = b.solarDir + b.windDir + b.dis + b.mkt;
  g += edge(`M412,${hubY} C440,${hubY} 440,110 466,110`, toSite, '#0E7568', 440, 140);
  g += edge(`M548,262 L548,176`, b.gridToLoad, 'var(--grid)', 548, 222);
  g += node(16, 20, 170, 64, 'Kutch Solar', 'KTC-SOL-01 · ' + state.cfg.solar + ' MWp', '', { bar: 'var(--solar)', go: 'suppliers' });
  g += node(16, 96, 170, 64, 'Kutch Wind', 'KTC-WND-02 · ' + state.cfg.wind + ' MW', '', { bar: 'var(--wind)', go: 'suppliers' });
  g += node(16, 172, 170, 64, 'Jamnagar Battery', out ? 'OUTAGE' : (b.dis > 0.05 ? 'discharging' : b.chg + b.gc > 0.05 ? 'charging' : 'standby') + ' · ' + pc(b.soc / cap, 0) + ' full', '', { bar: 'var(--bess)', stroke: out ? 'var(--crit)' : 'var(--line)', sub: out ? 'var(--crit)' : 'var(--muted)' });
  g += node(16, 248, 170, 64, 'Exchange blocks', 'IEX via trading member', '', { bar: 'var(--mkt)', role: 'trader' });
  g += node(268, 128, 144, 84, 'Gujarat grid', 'losses ' + (state.cfg.loss * 100).toFixed(1) + '%', b.surplusExcl > 0.5 ? f0(b.surplusExcl) + ' MW surplus' : b.txCurt > 0.5 ? f0(b.txCurt) + ' MW curtailed' : '', { fill: 'var(--panel-2)', vs: 13 });
  g += node(466, 44, 162, 132, 'Hyperscaler A', 'JMN-DC-01 · demand', f0(b.L) + ' MW', { stroke: '#0E7568', sw: 2, bar: '#0E7568', role: 'customer', vs: 26 });
  g += `<text x="480" y="128" style="font-size:11.5px;fill:${(toSite - (b.dis - b.disElig)) / b.L >= .9 ? 'var(--good)' : 'var(--crit)'};font-weight:600">${pc((b.solarDir + b.windDir + b.disElig + b.mkt) / b.L, 0)} clean this block</text>`;
  g += node(466, 262, 162, 58, 'DISCOM supply', 'residual · 0% clean', '', { bar: 'var(--grid)' });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Energy flows at ${blkTime(state.block)}, MW">${g}</svg></div>`;
}

/* ---------- compact demand vs supply ---------- */
function miniDayChart(d, blk) {
  const bs = R.blocks.slice(d * BPD, d * BPD + BPD).map(b => ({ ...b, disX: b.dis - b.disElig }));
  const W = 640, H = 268, ml = 36, mr = 10, mt = 14, mb = 24, pw = W - ml - mr, ph = H - mt - mb;
  const top = Math.ceil(Math.max(120, ...bs.map(b => Math.max(b.L, b.delivered))) / 50) * 50;
  const x = i => ml + i * pw / 96, y = v => mt + ph * (1 - v / top);
  let g = '';
  for (let v = 0; v <= top; v += 50) g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end" style="font-size:10px">${v}</text>`;
  let acc = new Array(96).fill(0);
  LAYERS.forEach(L => {
    const hi = acc.map((a, i) => a + bs[i][L.k]);
    if (hi.some((v, i) => v - acc[i] > 0.05)) {
      let p = `M${x(0)},${y(hi[0])}`; for (let i = 0; i < 96; i++) p += ` L${x(i)},${y(hi[i])} L${x(i + 1)},${y(hi[i])}`;
      for (let i = 95; i >= 0; i--) p += ` L${x(i + 1)},${y(acc[i])} L${x(i)},${y(acc[i])}`;
      g += `<path d="${p} Z" fill="${L.c}"/>`;
    }
    acc = hi;
  });
  const line = k => bs.map((b, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(b[k]).toFixed(1)} L${x(i + 1).toFixed(1)},${y(b[k]).toFixed(1)}`).join(' ');
  g += `<path d="${line('delivered')}" fill="none" stroke="var(--solar)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  g += `<path d="${line('L')}" fill="none" stroke="var(--ink)" stroke-width="2.2"/>`;
  const nx = x(blk + 1);
  if (blk < 95) g += `<rect x="${nx}" y="${mt}" width="${ml + pw - nx}" height="${ph}" fill="#fff" opacity=".55"/><text x="${W - mr - 4}" y="${mt + 12}" text-anchor="end" style="font-size:10px">plan</text>`;
  g += `<line x1="${nx}" x2="${nx}" y1="${mt}" y2="${mt + ph}" stroke="var(--brand)" stroke-width="2"/><rect x="${nx - 22}" y="${mt + ph - 2}" width="44" height="16" rx="8" fill="var(--brand)"/><text x="${nx}" y="${mt + ph + 10}" text-anchor="middle" style="font-size:10px;fill:#fff;font-weight:600">${blkTime(blk)}</text>`;
  for (let h = 0; h <= 24; h += 6) g += `<text x="${x(h * 4)}" y="${H - 6}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}" style="font-size:10px">${String(h).padStart(2, '0')}:00</text>`;
  return `<div class="chart" data-minichart="${d}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Demand and supply through the day">${g}<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" fill="transparent" class="clickable"/></svg></div>`;
}
const miniLegend = () => `<div class="legend" style="font-size:11.5px">${LAYERS.filter(l => l.k !== 'disX').map(L => `<span>${sw(L.c)}${L.name.replace(' (clean)', '').replace('Green exchange blocks', 'Exchange').replace('Grid residual', 'Grid')}</span>`).join('')}<span><svg width="18" height="8" aria-hidden="true"><line x1="0" x2="18" y1="4" y2="4" stroke="var(--ink)" stroke-width="2"/></svg> Demand</span><span><svg width="18" height="8" aria-hidden="true"><line x1="0" x2="18" y1="4" y2="4" stroke="var(--solar)" stroke-width="1.6" stroke-dasharray="4 3"/></svg> Solar + wind output</span></div>`;

/* ---------- control room ---------- */
V.control = () => {
  const i = state.day * BPD + state.block, b = R.blocks[i], o = R.hours[state.day * 24 + b.h];
  const mtd = SIM.scoreThrough(R, state.day, state.block), mtd0 = SIM.scoreThrough(R0, state.day, state.block);
  const clean = b.solarDir + b.windDir + b.disElig + b.mkt, cap = state.cfg.bessMWh || 1;
  const feed = feedItems(state.day * 1440 + state.block * 15 + 14).slice(0, 6);
  const nextH = [1, 2, 3, 4, 5].map(k => b.h + k).filter(h => h < 24).map(h => R.hours[state.day * 24 + h]);
  const today = R.hours.slice(state.day * 24, state.day * 24 + b.h + 1);
  const alerts = [];
  if (b.P_b === 0 && state.cfg.bessMW > 0) alerts.push(['crit', 'Battery JMN-BES-01 in forced outage', 'Exchange blocks and grid cover the gap.']);
  const low = today.filter(x => x.cfe * 100 < state.tier);
  if (low.length) alerts.push(['warn', low.length + ' hour' + (low.length > 1 ? 's' : '') + ' below ' + state.tier + '% today', 'Lowest: ' + String(low.reduce((a, x) => x.cfe < a.cfe ? x : a).h).padStart(2, '0') + ':00 at ' + pc(Math.min(...low.map(x => x.cfe)), 0) + '.']);
  const dev = R.blocks.slice(state.day * BPD, i + 1).filter(x => x.fc > 10 && x.delivered < 0.7 * x.fc).length;
  if (dev) alerts.push(['warn', 'Clean supply below forecast in ' + dev + ' blocks', 'Re-dispatched within the approved schedule.']);
  if (mtd * 100 < state.tier) alerts.push(['crit', 'Month projected below CFE' + state.tier, 'Customer notified under the incident SLA.']);
  if (o.status !== 'CLAIM_READY') alerts.push(['warn', 'Evidence incomplete this hour', o.status === 'INCOMPLETE' ? 'Meter data missing.' : 'Certificates pending.']);
  if (!alerts.length) alerts.push(['good', 'All systems normal', 'Supply, storage and evidence on plan.']);
  const parts = [['Solar', b.solarDir, 'var(--solar)'], ['Wind', b.windDir, 'var(--wind)'], ['Battery', b.disElig, 'var(--bess)'], ['Battery (grid)', b.dis - b.disElig, 'var(--bess-x)'], ['Exchange', b.mkt, 'var(--mkt)'], ['Grid', b.gridToLoad, 'var(--grid)']];
  return `
  <div class="toolbar"><div class="ptitle"><h1>Control room</h1><span class="sub">Hyperscaler A · JMN-DC-01 · CFE${state.tier} contract</span></div><div class="row">${timeControls()}${eventControls()}</div></div>
  ${activeChips()}
  <div class="kpis compact">
    ${kpi('Demand now', f0(b.L) + ' <small>MW</small>', blkTime(state.block) + '–' + blkTime(state.block + 1))}
    ${kpi('Clean now', pc(clean / b.L, 0), f0(clean) + ' of ' + f0(b.L) + ' MW', clean / b.L >= .9 ? 'good' : 'crit')}
    ${kpi('This hour', pc(o.cfe, 0), String(b.h).padStart(2, '0') + ':00 hourly match', o.cfe >= .9 ? 'good' : 'crit')}
    ${kpi('Month to date', pc(mtd), state.events.length ? (mtd - mtd0 >= 0 ? '+' : '−') + Math.abs((mtd - mtd0) * 100).toFixed(2) + ' pts vs plan' : 'floor CFE' + state.tier, mtd * 100 >= state.tier ? 'good' : 'crit')}
    ${kpi('Battery', b.P_b === 0 && state.cfg.bessMW ? 'Out' : pc(b.soc / cap, 0), b.P_b === 0 && state.cfg.bessMW ? 'forced outage' : 'charge level · ' + f0(b.soc) + ' MWh', b.P_b === 0 && state.cfg.bessMW ? 'crit' : '')}
    ${kpi('Exchange index', '₹' + f0(b.price), 'per MWh · illustrative')}
  </div>
  <div class="cr-main">
    <div class="panel"><div class="ph"><h3>Live flows</h3><span class="sub">MW · ${blkTime(state.block)}–${blkTime(state.block + 1)}</span></div>${networkSVG(b)}
      <div style="border-top:1px solid var(--line-2);margin-top:8px;padding-top:10px"><div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="eyebrow">Who is serving the site right now</span><button class="btn sm primary" data-go="blocks">Explain this block →</button></div>
      <div class="nowbar">${parts.filter(p => p[1] > 0.05).map(p => `<span style="width:${p[1] / b.L * 100}%;background:${p[2]}">${p[1] / b.L > .12 ? f0(p[1]) : ''}</span>`).join('')}</div>
      <div class="nowlist">${parts.filter(p => p[0] !== 'Battery (grid)' || p[1] > 0.05).map(p => `<div><span>${sw(p[2])}${p[0]}</span><b>${f0(p[1])} <small style="font-size:12px;color:var(--muted)">MW</small></b></div>`).join('')}</div></div></div>
    <div class="panel"><div class="ph"><h3>Demand vs supply today</h3><button class="btn sm" data-go="analytics">Detailed charts →</button></div>${miniDayChart(state.day, state.block)}${miniLegend()}
      <div style="border-top:1px solid var(--line-2);margin-top:12px;padding-top:12px"><div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="eyebrow">Today so far · 00:00–${blkTime(state.block + 1)}</span><span class="small muted">click the chart to move time</span></div>
      <div class="nowlist">${(() => { const bs = R.blocks.slice(state.day * BPD, i + 1), q = SIM.DT, L = bs.reduce((a, x) => a + x.L, 0) * q, C = bs.reduce((a, x) => a + x.solarDir + x.windDir + x.disElig + x.mkt, 0) * q, G = bs.reduce((a, x) => a + x.gridToLoad + x.dis - x.disElig, 0) * q, S = bs.reduce((a, x) => a + x.surplusExcl, 0) * q; return [['Demand', f0(L), 'MWh'], ['Clean', pc(C / L, 1), f0(C) + ' MWh'], ['Grid at zero', f0(G), 'MWh'], ['Surplus not counted', f0(S), 'MWh']].map(([k, v, u]) => `<div><span>${k}</span><b>${v} <small style="font-size:12px;color:var(--muted)">${u}</small></b></div>`).join(''); })()}</div></div></div>
  </div>
  <div class="g3">
    <div class="panel"><div class="ph"><h3>Next hours</h3><span class="sub">plan · MWh</span></div>
      <div class="tw"><table><thead><tr><th>Hour</th><th class="r">Demand</th><th class="r">Clean</th><th class="r">Grid</th><th class="r">CFE</th></tr></thead><tbody>
      ${nextH.length ? nextH.map(x => `<tr><td class="num">${String(x.h).padStart(2, '0')}:00</td><td class="r num">${f0(x.load)}</td><td class="r num">${f0(x.matched)}</td><td class="r num">${f0(x.grid)}</td><td class="r num" style="font-weight:600;color:${x.cfe >= .9 ? 'var(--good)' : 'var(--crit)'}">${pc(x.cfe, 0)}</td></tr>`).join('') : '<tr><td colspan="5" class="muted">End of day</td></tr>'}
      </tbody></table></div></div>
    <div class="panel"><div class="ph"><h3>Coordination feed</h3><button class="btn sm" data-go="orchestration">Full sequence</button></div>
      <div class="msgs" style="max-height:290px">${feed.length ? feed.map(msgHTML).join('') : '<p class="muted small">No messages yet at this time.</p>'}</div></div>
    <div class="panel"><div class="ph"><h3>Alerts</h3>${chip(alerts[0][0] === 'good' ? 'Normal' : alerts.length + ' open', alerts[0][0] === 'good' ? 'good' : 'warn')}</div>
      ${alerts.map(([t, h, d]) => `<div class="alert"><i style="background:var(--${t === 'good' ? 'good' : t === 'crit' ? 'crit' : 'warn'})"></i><span><b style="font-weight:600">${h}</b><br><span class="small muted">${d}</span></span></div>`).join('')}
      <p class="small muted" style="margin-top:10px">Servers never wait for clean power. Grid MWh keep the site running and count at zero.</p></div>
  </div>`;
};

/* ---------- analytics (detailed charts) ---------- */
function socSVG(d) {
  const bs = R.blocks.slice(d * BPD, d * BPD + BPD), W = 560, H = 210, ml = 40, mr = 10, mt = 14, mb = 24, pw = W - ml - mr, ph = H - mt - mb;
  const cap = Math.max(1, state.cfg.bessMWh), bw = pw / 96, x = i => ml + i * bw, y = v => mt + (1 - v / cap) * ph;
  let g = '';
  [0, .5, 1].forEach(f => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(f * cap)}" y2="${y(f * cap)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(f * cap) + 4}" text-anchor="end">${f * 100}%</text>`);
  const area = k => `M${ml},${y(0)} ` + bs.map((b, i) => `L${x(i).toFixed(1)},${y(b[k]).toFixed(1)} L${(x(i) + bw).toFixed(1)},${y(b[k]).toFixed(1)}`).join(' ') + ` L${ml + pw},${y(0)} Z`;
  g += `<path d="${area('soc')}" fill="var(--bess-x)"/><path d="${area('socClean')}" fill="var(--bess)" opacity=".85"/>`;
  g += `<line x1="${x(state.block) + bw / 2}" x2="${x(state.block) + bw / 2}" y1="${mt}" y2="${mt + ph}" stroke="var(--brand)" stroke-width="2"/>`;
  for (let h = 0; h <= 24; h += 6) g += `<text x="${x(h * 4)}" y="${H - 6}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${String(h).padStart(2, '0')}:00</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Battery charge level through the day">${g}</svg></div>`;
}
function dailyScoreSVG() {
  const W = 560, H = 230, ml = 40, mr = 10, mt = 14, mb = 26, pw = W - ml - mr, ph = H - mt - mb, bw = pw / 30;
  const days = Array.from({ length: 30 }, (_, d) => { const H_ = R.hours.slice(d * 24, d * 24 + 24); return H_.reduce((a, o) => a + (o.status === 'CLAIM_READY' ? o.matched : 0), 0) / H_.reduce((a, o) => a + o.load, 0); });
  const lo = 0.5, y = v => mt + ph * (1 - (Math.max(lo, v) - lo) / (1 - lo));
  let g = '';
  [0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`);
  days.forEach((v, d) => g += `<rect class="clickable" data-day="${d}" x="${ml + d * bw + 3}" y="${y(v)}" width="${bw - 6}" height="${y(lo) - y(v)}" rx="3" fill="${v * 100 >= state.tier ? 'var(--h3)' : 'var(--h1)'}" ${d === state.day ? 'stroke="var(--ink)" stroke-width="2"' : ''}><title>${dayLabel(d)} · ${pc(v)}</title></rect>`);
  g += `<line x1="${ml}" x2="${W - mr}" y1="${y(state.tier / 100)}" y2="${y(state.tier / 100)}" stroke="var(--crit)" stroke-dasharray="6 4" stroke-width="1.5"/><text x="${W - mr - 4}" y="${y(state.tier / 100) - 5}" text-anchor="end" style="fill:var(--crit)">CFE${state.tier} floor</text>`;
  for (let d = 0; d < 30; d += 5) g += `<text x="${ml + d * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${d + 1}</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily CFE score for October">${g}</svg></div>`;
}
function weakHoursSVG() {
  const W = 560, H = 210, ml = 40, mr = 10, mt = 14, mb = 26, pw = W - ml - mr, ph = H - mt - mb, bw = pw / 24;
  const cnt = new Array(24).fill(0); R.hours.forEach(o => { if (o.cfe * 100 < state.tier) cnt[o.h]++; });
  const mx = Math.max(5, ...cnt), y = v => mt + ph * (1 - v / mx);
  let g = '';
  [0, Math.round(mx / 2), mx].forEach(v => g += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`);
  cnt.forEach((v, h) => { g += `<rect x="${ml + h * bw + 4}" y="${y(v)}" width="${bw - 8}" height="${y(0) - y(v)}" rx="3" fill="${h >= 18 || h < 7 ? 'var(--bess)' : 'var(--solar)'}" opacity=".85"><title>${String(h).padStart(2, '0')}:00 · ${v} days</title></rect>`; if (v) g += `<text x="${ml + h * bw + bw / 2}" y="${y(v) - 4}" text-anchor="middle" style="font-size:10px">${v}</text>`; });
  for (let h = 0; h < 24; h += 6) g += `<text x="${ml + h * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${String(h).padStart(2, '0')}</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Days below target by hour of day">${g}</svg></div>`;
}
V.analytics = () => {
  const M = R.M, mix = [['Solar', M.solar, 'var(--solar)'], ['Wind', M.wind, 'var(--wind)'], ['Battery (clean)', M.bessElig, 'var(--bess)'], ['Exchange blocks', M.mkt, 'var(--mkt)'], ['Battery (grid-charged)', M.bessInelig, 'var(--bess-x)'], ['Grid', M.grid, 'var(--grid)']];
  return `
  <div class="toolbar"><div class="ptitle"><h1>Analytics</h1><span class="sub">Detailed charts for ${dayLabel(state.day)} and the month</span></div><div class="row">${timeControls()}${eventControls()}</div></div>
  ${activeChips()}
  <div class="panel"><div class="ph"><h3>Dispatch by quarter hour · ${dayLabel(state.day)}</h3><div class="legend">${legendHTML()}</div></div>${dayChartSVG(state.day, { block: state.block })}</div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Battery charge level</h3><div class="legend">${sw('var(--bess)')}clean-charged ${sw('var(--bess-x)')}grid-charged</div></div>${socSVG(state.day)}</div>
    <div class="panel"><div class="ph"><h3>Supply mix · October</h3><span class="sub">share of ${f0(M.load)} MWh demand</span></div>
      <div class="bar" style="height:18px;margin-bottom:10px">${mix.map(r => `<span style="width:${r[1] / M.load * 100}%;background:${r[2]}"></span>`).join('')}</div>
      <div class="tw"><table><tbody>${mix.map(r => `<tr><td>${sw(r[2])}${r[0]}</td><td class="r num">${f0(r[1])} MWh</td><td class="r num muted">${pc(r[1] / M.load)}</td></tr>`).join('')}</tbody></table></div></div>
  </div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>Daily score · October</h3><span class="sub">click a day to open it</span></div>${dailyScoreSVG()}</div>
    <div class="panel"><div class="ph"><h3>When the month is weakest</h3><span class="sub">days below CFE${state.tier}, by hour</span></div>${weakHoursSVG()}<p class="small muted">Most misses fall before dawn, after the battery has run down and before solar starts. That is the window storage and wind are sized for.</p></div>
  </div>
  <div class="panel"><div class="ph"><h3>Every hour of October</h3>${heatLegend()}</div>${heatSVG(R, state.day, state.hourSel)}</div>`;
};

/* ---------- home ---------- */
const DOORS = [
  { r: 'customer', t: 'Customer portal', for: 'Data centres, AI campuses and continuous industry', li: ['Sign up and share meter data', 'See your real hourly match', 'Track the monthly score and statement'] },
  { r: 'supplier', t: 'Supplier portal', for: 'Solar, wind and storage owners', li: ['Qualify an asset against six gates', 'Sign energy-plus-certificate offtake', 'Follow schedules and settlement'] },
  { r: 'trader', t: 'Trading member desk', for: 'The licensed exchange member we work through', li: ['Receive order requests within the mandate', 'Place them on IEX', 'Return confirmations as evidence'] },
  { r: 'verifier', t: 'Verifier portal', for: 'The independent assurance provider', li: ['Read-only access to every ledger', 'Re-perform sampled hours', 'Issue the monthly opinion'] }
];
V.home = () => {
  const b = R.blocks[state.day * BPD + state.block], clean = b.solarDir + b.windDir + b.disElig + b.mkt;
  return `<div class="home">
  <section class="hero"><div><div class="eyebrow">Reliance · hourly clean energy</div><h1>CFE Manager</h1>
    <p>One platform for everyone who makes a clean hour happen. Customers, generators, the trading member and the verifier each get their own portal. Reliance runs the operations console in the middle.</p>
    <div class="actions"><button class="btn" data-role="manager">Open the operations console</button><button class="btn ghost" data-act="demo">▶ Presentation demo</button><button class="btn ghost" data-act="uc">Q&amp;A use cases</button></div></div>
    <div class="stats">
      <div class="stat"><b>${pc(R.M.scoreComplete)}</b><span>October score, live account</span></div>
      <div class="stat"><b>${pc(clean / b.L, 0)}</b><span>clean right now · ${blkTime(state.block)}</span></div>
      <div class="stat"><b>${f0(state.cfg.solar + state.cfg.wind)} MW</b><span>contracted solar and wind</span></div>
      <div class="stat"><b>${state.cfg.bessMWh} MWh</b><span>contracted storage</span></div>
    </div></section>
  <button class="opsdoor" data-role="manager"><span class="ic">${ICONS.manager}</span><span><span class="eyebrow">Reliance CFE desk</span><h3>Operations console</h3><p>Run live dispatch, onboard customers and suppliers, manage contracts and prove every clean hour.</p>
    <span class="chips">${['Control room', 'Block by block', 'Onboarding queue', 'Evidence', 'Analytics'].map(c => chip(c, 'info')).join('')}</span></span><span class="go" style="font-weight:600;color:var(--brand)">Enter →</span></button>
  <div class="eyebrow">Stakeholder portals</div>
  <div class="doors">${DOORS.map(d => `<button class="door" data-role="${d.r}" style="--rc:${ROLES[d.r].c}"><span class="ic">${ICONS[d.r]}</span><span><h3>${d.t}</h3><span class="for">${d.for}</span></span><ul>${d.li.map(l => `<li>${l}</li>`).join('')}</ul><span class="go">Open →</span></button>`).join('')}</div>
  <p class="small muted" style="text-align:center">Prototype for Reliance T.U.P XII. All data is simulated; no grid, meter, exchange or registry is connected. IEX, the SLDC and regulators do not log in: they appear where we coordinate with them.</p>
  </div>`;
};

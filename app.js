/* ===================== SHELL: roles, routing, events ===================== */
const ROLES = {
  manager: { name: 'CFE Manager', who: 'Reliance energy-services desk', person: 'Portfolio operations lead', c: 'var(--r-manager)', nav: [['control', 'Control room', 'Operate'], ['blocks', 'Block by block', 'Operate'], ['orchestration', 'Orchestration', 'Operate'], ['evidence', 'Evidence', 'Operate'], ['analytics', 'Analytics', 'Operate'], ['onboarding', 'Onboarding queue', 'Grow'], ['customers', 'Customers', 'Grow'], ['suppliers', 'Suppliers', 'Grow'], ['contracts', 'Contracts', 'Grow'], ['feasibility', 'Feasibility and scale', 'Grow'], ['ecosystem', 'Ecosystem and compliance', 'Govern'], ['checks', 'System checks', 'Govern']] },
  customer: { name: 'Customer', portal: 'Customer portal', c: 'var(--r-customer)', live: ['Hyperscaler A · JMN-DC-01', 'Live account (illustrative) · Head of energy procurement'], nav: [['c_start', 'Get started', 'Onboarding'], ['c_onboard', 'Application', 'Onboarding'], ['c_service', 'My service', 'Live account'], ['c_statement', 'Monthly statement', 'Live account']] },
  supplier: { name: 'Supplier', portal: 'Supplier portal', c: 'var(--r-supplier)', live: ['Kutch Wind Farm · KTC-WND-02', 'Live asset (illustrative) · IPP commercial manager'], nav: [['s_start', 'Get started', 'Onboarding'], ['s_onboard', 'Application', 'Onboarding'], ['s_asset', 'My asset', 'Live asset']] },
  trader: { name: 'Trading member', portal: 'Trading member desk', c: 'var(--r-trader)', live: ['Partner trading member (illustrative)', 'Licensed exchange member · power trading desk'], nav: [['t_start', 'Get started', 'Onboarding'], ['t_desk', 'Order desk', 'Live']] },
  verifier: { name: 'Verifier', portal: 'Verifier portal', c: 'var(--r-verifier)', live: ['Assurance firm (illustrative)', 'Independent claims verifier · read-only'], nav: [['v_start', 'Get started', 'Onboarding'], ['v_review', 'Month review', 'Live']] }
};
const LAST_VIEW = { home: 'home', manager: 'control', customer: 'c_start', supplier: 's_start', trader: 't_start', verifier: 'v_start' };

function groupedNav(nav, render1) { let g = null, out = ''; nav.forEach(([v, l, grp]) => { if (grp !== g) { out += `<span class="grp">${grp}</span>`; g = grp; } out += render1(v, l); }); return out; }
function renderSide() {
  const r = ROLES[state.role];
  $('side').innerHTML = `<div class="apptitle"><span class="logo" style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.1);display:grid;place-items:center;color:var(--gold)">${ICONS.manager}</span><span><b>Operations console</b><br><span>Reliance CFE desk</span></span></div>
  <nav class="nav" aria-label="Operations console">${groupedNav(r.nav, (v, l) => `<a data-view="${v}" ${state.view === v ? 'aria-current="page"' : ''} tabindex="0">${ICONS[v] || ''}${l}</a>`)}</nav>
  <div class="who"><div class="eyebrow" style="color:var(--gold)">Signed in</div><div class="n">${r.person}</div><div class="r">${r.who}</div></div>
  <div class="foot">${SIM.ENGINE_VERSION} · synthetic data<br>Jamnagar Jammers · T.U.P XII</div>`;
}
function renderTop() {
  const home = state.role === 'home', r = ROLES[state.role];
  let c = '';
  if (!home) { const item = r.nav.find(x => x[0] === state.view); c = `<span class="sep">/</span><span class="capp"><span class="dot" style="background:${r.c}"></span>${state.role === 'manager' ? 'Operations console' : r.portal}</span>${item ? `<span class="sep">/</span><span>${item[1]}</span>` : ''}`; }
  $('crumb').innerHTML = c;
  const apps = [['home', 'All portals', 'Start screen', 'var(--faint)'], ['manager', 'Operations console', 'Reliance CFE desk', ROLES.manager.c], ...['customer', 'supplier', 'trader', 'verifier'].map(k => [k, ROLES[k].portal, DOORS.find(d => d.r === k).for, ROLES[k].c])];
  $('switchPop').innerHTML = apps.map(([k, n, s, c]) => `<button class="mi" ${k === 'home' ? 'data-home="1"' : `data-role="${k}"`} aria-current="${state.role === k}"><span class="dot" style="background:${c}"></span><b>${n}</b><span class="s">${s}</span></button>`).join('');
}
function portalHeader() {
  const r = ROLES[state.role], item = r.nav.find(x => x[0] === state.view) || r.nav[0], onb = item[2] === 'Onboarding';
  const F = REG[state.role], s = jrS(state.role);
  const name = onb ? (s.reg ? F.org : 'New applicant') : r.live[0];
  const sub = onb ? (s.reg ? F.person + ', ' + F.title + ' · applicant' : 'Not signed up yet') : r.live[1];
  return `<div class="portal" style="--rc:${r.c}"><div class="pin"><div><div class="eyebrow" style="color:${r.c}">${r.portal}</div><div class="pn">${esc(name)}</div><div class="pw">${esc(sub)}</div></div>
    <span class="small muted" style="max-width:52ch">${onb ? 'Onboarding views follow a new applicant through sign-up.' : 'Live views show an account that is already operating.'}</span></div>
    <nav class="ptabs" aria-label="${r.portal} tabs">${groupedNav(r.nav, (v, l) => `<button class="ptab" data-view="${v}" ${state.view === v ? 'aria-current="page"' : ''}>${l}</button>`)}</nav></div>`;
}
function render(opts = {}) {
  if (state.view !== 'blocks' && (fTimer || state.fAuto)) stopF();
  if (!opts.noRe) recompute();
  renderTop(); $('switchMenu').open = false;
  const mgr = state.role === 'manager', home = state.role === 'home';
  $('side').hidden = !mgr; document.querySelector('.app').classList.toggle('noside', !mgr);
  if (mgr) renderSide();
  const fn = home ? V.home : (V[state.view] || V.control);
  $('main').innerHTML = home ? fn() : `<div class="page">${mgr ? '' : portalHeader()}${fn()}</div>`;
  bindMain();
  if (!opts.keepScroll) window.scrollTo({ top: 0 });
}
function setRole(role, view) {
  LAST_VIEW[state.role] = state.view;
  state.role = role; state.view = view || LAST_VIEW[role] || ROLES[role].nav[0][0];
}
function bindMain() {
  const m = $('main');
  const blk = $('blk'); if (blk) blk.addEventListener('input', () => { state.block = +blk.value; render({ keepScroll: true }); $('blk') && $('blk').focus(); });
  bindDayChart(m, b => { stopF(); state.block = b; state.hourSel = Math.floor(b / 4); render({ keepScroll: true }); });
  m.querySelectorAll('[data-minichart] svg').forEach(svg => svg.addEventListener('click', e => { const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * 640, blk = Math.floor((vx - 36) / (594 / 96)); if (blk >= 0 && blk < 96) { state.block = blk; state.hourSel = blk >> 2; render({ keepScroll: true }); } }));
  m.querySelectorAll('rect[data-day]').forEach(r => r.addEventListener('click', () => { state.day = +r.dataset.day; render({ keepScroll: true }); }));
  m.querySelectorAll('details[data-menu]').forEach(d => d.addEventListener('toggle', () => { state.wOpen = d.open; }));
  const bs = $('blkSel'); if (bs) bs.addEventListener('change', () => { stopF(); state.block = +bs.value; state.hourSel = Math.floor(state.block / 4); render({ keepScroll: true }); });
  m.querySelectorAll('rect.hc').forEach(r => r.addEventListener('click', () => { state.day = +r.dataset.d; state.hourSel = +r.dataset.h; state.block = state.hourSel * 4; render({ keepScroll: true }); }));
  m.querySelectorAll('g[data-act="eco"]').forEach(gn => gn.addEventListener('click', () => { state.ecoSel = gn.dataset.id; render({ keepScroll: true }); }));
  m.querySelectorAll('g[data-go], g[data-role]').forEach(gn => gn.addEventListener('click', () => { if (gn.dataset.role) setRole(gn.dataset.role); else state.view = gn.dataset.go; render(); }));
}
/* form inputs */
document.addEventListener('input', e => {
  const t = e.target; if (!t.id) return;
  const val = t.type === 'checkbox' ? t.checked : t.value;
  if (t.id.startsWith('cw-')) { cwF()[t.id.slice(3)] = val; }
  else if (t.name === 'cw-current') { cwF().current = val; render({ keepScroll: true }); }
  else if (t.id.startsWith('sw-')) { const k = t.id.slice(3); swF()[k] = val; if (k === 'tech') render({ keepScroll: true }); }
  else if (t.id.startsWith('fz-')) { state.feasForm[t.id.slice(3)] = val; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'cw-current') { cwF().current = t.value; render({ keepScroll: true }); return; }
  if (t.id && (t.id.startsWith('cw-') || t.id.startsWith('sw-')) && (t.tagName === 'SELECT' || t.type === 'checkbox')) render({ keepScroll: true });
});
/* clicks */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-role],[data-view],[data-go],[data-home]');
  if (!e.target.closest('details.menu')) { document.querySelectorAll('details.menu[open]').forEach(d => d.open = false); state.wOpen = false; }
  if (!el || el.tagName === 'g') return;
  if (el.closest('#narr') || el.closest('#ucDrawer')) return;
  const act = el.dataset.act;
  if (!act) {
    if (el.dataset.home) { LAST_VIEW[state.role] = state.view; state.role = 'home'; state.view = 'home'; }
    else if (el.dataset.role) { setRole(el.dataset.role, el.dataset.view); }
    else if (el.dataset.view) { state.view = el.dataset.view; }
    else if (el.dataset.go) { setRole('manager', el.dataset.go); }
    stopPlay(); render(); return;
  }
  const i = +el.dataset.i;
  switch (act) {
    case 'dayPrev': stopF(); state.day = (state.day + 29) % 30; break;
    case 'dayNext': stopF(); state.day = (state.day + 1) % 30; break;
    case 'play': state.playing ? stopPlay() : startPlay(); break;
    case 'demo': tourStart(DEMO, 'Presentation demo · 2 min', true); return;
    case 'uc': $('ucBtn').click(); return;
    case 'togEv': { const k = el.dataset.k, ix = state.events.findIndex(x => x.key === k && x.d === state.day); if (ix >= 0) { state.events.splice(ix, 1); state.evSel = 0; } else { addEvent(k); toast('What-if on: ' + EVENTS[k].name + ', ' + dayLabel(state.day)); } break; }
    case 'bPrev': stopF(); if (state.block > 0) state.block--; else { state.day = (state.day + 29) % 30; state.block = 95; } state.hourSel = Math.floor(state.block / 4); break;
    case 'bNext': stopF(); if (state.block < 95) state.block++; else { state.day = (state.day + 1) % 30; state.block = 0; } state.hourSel = Math.floor(state.block / 4); break;
    case 'bPlay': stopF(); playBlock(); return;
    case 'bAuto': if (state.fAuto) { stopF(); break; } stopF(); autoRun(); return;
    case 'jReg': { const s = jrS(el.dataset.r); s.reg = true; s.stage = 0; s.view = 0; toast('Account created and email verified. Stage 1 is open.'); break; }
    case 'jDoc': jrDocs(el.dataset.r, jrS(el.dataset.r).stage)[i] = true; break;
    case 'jAll': jrDocs(el.dataset.r, jrS(el.dataset.r).stage).fill(true); break;
    case 'jSub': jrS(el.dataset.r).sub = true; toast('Submitted. It is now in the CFE Manager onboarding queue.'); break;
    case 'jApprove': jrApprove(el.dataset.r); toast('Approved by CFE Manager. Next stage unlocked.'); break;
    case 'jView': jrS(el.dataset.r).view = i; break;
    case 'jToQueue': setRole('manager', 'onboarding'); render(); return;
    case 'jLink': jrLink(el.dataset.r, i); render(); return;
    case 'qApprove': jrApprove(el.dataset.r); toast(REG[el.dataset.r].org + ': stage approved. Their portal shows the next stage.'); break;
    case 'qRemind': toast('Reminder sent to ' + el.dataset.n + '.'); break;
    case 'addEv': addEvent($('evPick').value); toast(EVENTS[$('evPick').value].name + ' injected on ' + dayLabel(state.day)); break;
    case 'rmEv': state.events.splice(i, 1); state.evSel = 0; break;
    case 'clearEv': clearEvents(); break;
    case 'evSel': state.evSel = i; break;
    case 'acct': state.acct = el.dataset.id; break;
    case 'sup': state.supSel = el.dataset.id; break;
    case 'runFeas': runFeasibility(); break;
    case 'cwPreset': state.cw = { step: 0, f: { ...CW_PRESET }, diag: null, prop: null, tierPick: 90 }; break;
    case 'cwUpload': cwF().uploaded = true; break;
    case 'cwNext': cwAdvance(); break;
    case 'cwBack': state.cw.step = Math.max(0, state.cw.step - 1); break;
    case 'cwGo': if (i <= state.cw.step) state.cw.step = i; break;
    case 'cwTier': state.cw.tierPick = +el.dataset.t; break;
    case 'cwSubmit': cwSubmit(); setRole('manager', 'customers'); break;
    case 'swPreset': state.sw = { step: 0, f: { ...SW_PRESETS[el.dataset.k] }, gates: null, value: null }; break;
    case 'swUpload': swF().uploaded = true; break;
    case 'swNext': swAdvance(); break;
    case 'swBack': state.sw.step = Math.max(0, state.sw.step - 1); break;
    case 'swGo': if (i <= state.sw.step) state.sw.step = i; break;
    case 'swSubmit': swSubmit(); setRole('manager', 'suppliers'); break;
    case 'custRamp': addEvent('loadRamp'); toast('Notice sent. CFE Manager is re-planning tonight’s supply.'); break;
    case 'ack': state.acks[el.dataset.k] = true; break;
    case 'resample': state.day = (state.day + 1) % 30; break;
    default: return;
  }
  render({ keepScroll: !['cwSubmit', 'swSubmit', 'cwNext', 'swNext', 'cwBack', 'swBack', 'cwGo', 'swGo', 'jApprove', 'jReg'].includes(act) });
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.nav a')) e.target.click(); if (e.key === 'Escape') $('ucScrim').hidden = true; });

function jrLink(r, stageIdx) {
  const [view, step] = JOURNEYS[r].stages[stageIdx].link;
  if (view === 'c_onboard') { if (!state.cw.f || !state.cw.f.name) state.cw = { step: 0, f: { ...CW_PRESET }, diag: null, prop: null, tierPick: 90 }; cwF().uploaded = true; if (step <= 2) state.cw.step = step; else { state.cw.step = 2; while (state.cw.step < step) cwAdvance(); } }
  if (view === 's_onboard') { if (!state.sw.f || !state.sw.f.company) state.sw = { step: 0, f: { ...SW_PRESETS.bhuj }, gates: null, value: null }; state.sw.step = 4; state.sw.gates = null; if (step === 5) swAdvance(); }
  setRole(r, view);
}
let playT = null;
function startPlay() { state.playing = true; playT = setInterval(() => { state.block++; if (state.block > 95) { state.block = 95; stopPlay(); } render({ keepScroll: true }); }, 450); }
function stopPlay() { state.playing = false; clearInterval(playT); playT = null; }

/* ===================== DEMO + USE CASES ===================== */
const go = (role, view) => () => setRole(role, view);
function resetWorld() { clearEvents(); state.day = 13; state.block = 84; state.hourSel = 23; stopPlay(); stopF(); }

const blockAt = (blk) => () => { state.block = blk; state.hourSel = Math.floor(blk / 4); state.fStep = 6; };
const DEMO = [
  { role: 'home', view: 'home', dur: 6, act: () => { resetWorld(); }, cap: '<b>CFE Manager.</b> One platform, five doors: Reliance\u2019s operations console in the middle, and a portal for each stakeholder around it.' },
  { role: 'manager', view: 'ecosystem', dur: 8, act: () => { resetWorld(); state.ecoSel = 'tm'; }, cap: '<b>Approved tomorrow</b>, this is what Reliance runs: one accountable interface on top of the exchanges, system operators and registries that already exist.' },
  { role: 'supplier', view: 's_start', dur: 8, act: () => { jrSet('supplier', 1); jrDocs('supplier', 1).fill(true); }, cap: '<b>Supply side.</b> A Kutch wind IPP signs up in the supplier portal. Every stage says what they do, what we do, and which documents unlock the next.' },
  { role: 'supplier', view: 's_onboard', dur: 8, act: () => { state.sw = { step: 4, f: { ...SW_PRESETS.bhuj }, gates: null, value: null }; }, cap: 'Six hard gates run automatically: commissioned, rights, <b>exclusive attributes</b>, same-state boundary, meter, scheduling.' },
  { role: 'supplier', view: 's_onboard', dur: 7, act: () => { state.sw.step = 4; swAdvance(); }, cap: () => `Before any price talk, the engine shows what the asset adds: <b>+${((state.sw.value.after - state.sw.value.before) * 100).toFixed(1)} pts</b> for our live customer, mostly at night.` },
  { role: 'customer', view: 'c_start', dur: 8, act: () => { jrSet('customer', 2); }, cap: '<b>Demand side.</b> A data centre signs up in the customer portal: meter data, diagnostic, proposal, diligence, contract, then shadow mode before go-live.' },
  { role: 'customer', view: 'c_onboard', dur: 9, act: () => { state.cw = { step: 2, f: { ...CW_PRESET }, diag: null, prop: null, tierPick: 90 }; cwAdvance(); }, cap: () => `Its meter data shows 100% renewable on paper is only <b>${pc(state.cw.diag.hourly, 0)} hour by hour</b>. That gap is what we sell.` },
  { role: 'customer', view: 'c_onboard', dur: 7, act: () => { cwAdvance(); }, cap: 'We size and back-test a portfolio for each tier with the same engine that runs live dispatch.' },
  { role: 'manager', view: 'onboarding', dur: 7, act: () => { jrS('customer').sub = true; }, cap: 'Both applications land in Reliance’s onboarding queue, with an owner and a two-day review target.' },
  { role: 'manager', view: 'blocks', dur: 10, act: () => { resetWorld(); blockAt(88)(); }, after: () => playBlock(), cap: '<b>Live operations.</b> 22:00, one 15-minute block: 97 MW of demand filled in order. Wind first, then the battery charged by afternoon sun, then exchange blocks.' },
  { role: 'manager', view: 'orchestration', dur: 10, act: () => { resetWorld(); addEvent('windLull'); }, cap: 'Forecast: wind drops 65% tonight. The engine re-plans and instructs the <b>battery operator, trading member and SLDC</b>. Each acts in its own system.' },
  { role: 'manager', view: 'blocks', dur: 11, act: () => { addEvent('bessOut'); blockAt(92)(); }, after: () => playBlock(), cap: '23:00, and the battery has tripped. Wind is short, exchange blocks help, and the grid fills the rest so servers never stop. <b>Grid MW count at zero.</b>' },
  { role: 'trader', view: 't_desk', dur: 6, act: () => { }, cap: 'The licensed trading member places our request on IEX and confirms the fill. We never trade directly.' },
  { role: 'manager', view: 'evidence', dur: 9, act: () => { state.hourSel = 23; }, cap: 'Proving 23:00: generator meters, SLDC accounts, the site meter and certificates must agree before the hour counts.' },
  { role: 'customer', view: 'c_statement', dur: 8, act: () => { }, cap: () => `Month end: one statement, sent to the independent verifier. <b>${pc(R.M.scoreComplete)}</b> against the CFE90 floor, despite the bad night.` }
];

const USE_CASES = [
  { t: 'How one 15-minute block is filled', d: 'Midday surplus, evening hand-off, and a night block, step by step.', steps: [
    { role: 'manager', view: 'blocks', act: () => { resetWorld(); blockAt(52)(); }, after: () => playBlock(), cap: '13:00. Solar exceeds demand. The site is served, the battery charges, and any surplus beyond that is not counted.' },
    { role: 'manager', view: 'blocks', act: blockAt(74), after: () => playBlock(), cap: '18:30. The sun sets; wind and the battery take over.' },
    { role: 'manager', view: 'blocks', act: blockAt(88), after: () => playBlock(), cap: '22:00. Wind plus stored solar carry the night.' },
    { role: 'manager', view: 'blocks', act: blockAt(91), after: () => playBlock(), cap: '22:45. The fourth block closes the hour; certificates per source are requested the next day.' }] },
  { t: 'Customer onboarding, start to finish', d: 'Sign-up, documents, review by CFE Manager, and each stage unlocking.', steps: [
    { role: 'customer', view: 'c_start', act: () => { (state.jr = state.jr || {}).customer = null; }, cap: 'A new customer arrives. Sample details are pre-filled.' },
    { role: 'customer', view: 'c_start', act: () => { const s = jrS('customer'); s.reg = true; s.stage = 0; s.view = 0; }, cap: 'Account created. Stage 1 asks for three documents.' },
    { role: 'customer', view: 'c_start', act: () => { jrDocs('customer', 0).fill(true); jrS('customer').sub = true; }, cap: 'Documents uploaded and submitted. Now it waits on CFE Manager.' },
    { role: 'manager', view: 'onboarding', act: () => { }, cap: 'The key account manager sees it in the queue and approves.' },
    { role: 'customer', view: 'c_start', act: () => { jrApprove('customer'); }, cap: 'Stage 2 opens in the customer’s portal: share meter data.' },
    { role: 'customer', view: 'c_onboard', act: () => { jrLink('customer', 2); }, cap: 'The diagnostic is the main acquisition tool.' },
    { role: 'customer', view: 'c_start', act: () => { jrSet('customer', 6); }, cap: 'Later: shadow mode proves the method on their own meter before credits apply.' }] },
  { t: 'Supplier onboarding, start to finish', d: 'Registration, the six gates, backtest, PPA and integration.', steps: [
    { role: 'supplier', view: 's_start', act: () => { (state.jr = state.jr || {}).supplier = null; }, cap: 'A generator signs up.' },
    { role: 'supplier', view: 's_start', act: () => { jrSet('supplier', 1); }, cap: 'Stage 2 needs six documents, one per gate.' },
    { role: 'supplier', view: 's_onboard', act: () => { jrLink('supplier', 1); }, cap: 'The gates run against those documents.' },
    { role: 'supplier', view: 's_onboard', act: () => { jrLink('supplier', 2); }, cap: 'Backtest against live customer load.' },
    { role: 'supplier', view: 's_start', act: () => { jrSet('supplier', 5); }, cap: 'Integration: forecast feed, schedules via the coordinator, a test day.' },
    { role: 'supplier', view: 's_asset', act: () => { }, cap: 'Live: the supplier sees output against forecast, and instructions from CFE Manager.' }] },
  { t: 'A generator is rejected', d: 'Out-of-state wind, and solar whose certificates are already sold.', steps: [
    { role: 'supplier', view: 's_onboard', act: () => { state.sw = { step: 4, f: { ...SW_PRESETS.jsm }, gates: null, value: null }; }, cap: 'Rajasthan wind fails the same-state boundary. Hourly matching cannot import attributes across states in v1.' },
    { role: 'supplier', view: 's_onboard', act: () => { state.sw = { step: 4, f: { ...SW_PRESETS.rec }, gates: null, value: null }; }, cap: 'Cheap solar with RECs already sold fails on attributes. Buying its energy would let two buyers claim the same MWh.' },
    { role: 'supplier', view: 's_onboard', act: () => { state.sw.step = 5; }, cap: 'The applicant gets a specific remedy and can re-apply.' }] },
  { t: 'Night shortfall: wind lull, then battery trip', d: 'Plan vs actual in each block, the instructions sent, and the proof.', steps: [
    { role: 'manager', view: 'blocks', act: () => { resetWorld(); blockAt(92)(); }, after: () => playBlock(), cap: 'The normal plan for 23:00.' },
    { role: 'manager', view: 'blocks', act: () => { addEvent('windLull'); }, after: () => playBlock(), cap: 'Wind lull: each card shows actual against plan.' },
    { role: 'manager', view: 'orchestration', act: () => { }, cap: 'Who is told what, and when.' },
    { role: 'manager', view: 'blocks', act: () => { addEvent('bessOut'); }, after: () => playBlock(), cap: 'Battery trips too. The grid fills the gap at zero.' },
    { role: 'manager', view: 'evidence', act: () => { state.hourSel = 23; }, cap: 'The 23:00 hour: what counts, what does not, and why.' }] },
  { t: 'Customer adds a 20 MW AI training run', d: 'Optional load notice from the customer triggers a re-plan.', steps: [
    { role: 'customer', view: 'c_service', act: () => { resetWorld(); }, cap: 'The customer can notify planned load changes. We never control its servers.' },
    { role: 'manager', view: 'orchestration', act: () => { addEvent('loadRamp'); }, cap: 'CFE Manager re-plans supply, revises the drawal schedule and confirms back.' },
    { role: 'manager', view: 'blocks', act: blockAt(84), after: () => playBlock(), cap: '21:00: demand is about 117 MW and the merit order serves it.' }] },
  { t: 'Battery charged from the grid', d: 'Why a naive dashboard overstates the score, and how the ledger catches it.', steps: [
    { role: 'manager', view: 'blocks', act: () => { resetWorld(); addEvent('gridCharge'); blockAt(12)(); }, after: () => playBlock(), cap: '03:00. The operator charges the battery from the grid, off-plan.' },
    { role: 'manager', view: 'blocks', act: () => { recompute(); const b = R.blocks.slice(state.day * BPD + 20, state.day * BPD + 96).find(x => x.dis - x.disElig > 0.05); blockAt(b ? b.b : 76)(); }, after: () => playBlock(), cap: 'Later the battery discharges. Only its clean share counts.' },
    { role: 'manager', view: 'evidence', act: () => { state.hourSel = state.block >> 2; }, cap: 'The funnel shows what a naive dashboard would have claimed.' }] },
  { t: 'Meter gap and late certificates', d: 'Evidence failures keep hours provisional instead of guessing.', steps: [
    { role: 'manager', view: 'evidence', act: () => { resetWorld(); addEvent('meterOutage'); addEvent('issuerOutage'); state.hourSel = 4; }, cap: 'Site meter missing 02:00–08:00: the hour is counted as unmatched until backfilled.' },
    { role: 'manager', view: 'evidence', act: () => { state.hourSel = 14; }, cap: 'Certificates pending: matched but not publishable.' },
    { role: 'verifier', view: 'v_review', act: () => { }, cap: 'The verifier’s checklist raises both as findings.' }] },
  { t: 'A bad week: breach and service credit', d: 'Seven days of weak wind push the month below the floor.', steps: [
    { role: 'manager', view: 'control', act: () => { resetWorld(); addEvent('badWeek'); }, cap: 'A week-long wind drought. Month-to-date drifts below CFE90.' },
    { role: 'manager', view: 'orchestration', act: () => { }, cap: 'Early warning goes to the customer under the incident SLA.' },
    { role: 'customer', view: 'c_statement', act: () => { }, cap: 'The statement shows the miss and the illustrative capped credit, payable only on the verified result.' }] },
  { t: 'A Mumbai colocation asks for CFE90', d: 'Feasibility: engine sizing plus state gates.', steps: [
    { role: 'manager', view: 'feasibility', act: () => { state.feasForm = { name: 'Colocation B', state: 'Maharashtra', mw: 60, shape: 'flat', tier: 90 }; runFeasibility(); }, cap: 'The portfolio can be sized, but Maharashtra gates are open: shadow mode first.' }] },
  { t: 'A customer wants CFE95 at 150 MW', d: 'Bigger and cleaner: what changes in procurement.', steps: [
    { role: 'manager', view: 'feasibility', act: () => { state.feasForm = { name: 'Hyperscaler A expansion', state: 'Gujarat', mw: 150, shape: 'flat', tier: 95 }; runFeasibility(); }, cap: 'CFE95 needs far more storage. The verdict names what to procure before quoting.' }] },
  { t: 'How we work with IEX, SLDC and regulators', d: 'No logins: statutory channels, the member, and the daily calendar.', steps: [
    { role: 'manager', view: 'ecosystem', act: () => { resetWorld(); state.ecoSel = 'iex'; }, cap: 'IEX only through a licensed member under mandate.' },
    { role: 'manager', view: 'ecosystem', act: () => { state.ecoSel = 'sldc'; }, cap: 'SLDC: schedules and revisions through the scheduling coordinator; energy accounts weekly.' },
    { role: 'manager', view: 'orchestration', act: () => { }, cap: 'A normal day end to end, D-1 to D+1.' },
    { role: 'trader', view: 't_desk', act: () => { }, cap: 'The member’s view of our requests.' }] },
  { t: 'Contracts, risk and captive compliance', d: 'Nine documents behind one interface; the annual captive test.', steps: [
    { role: 'manager', view: 'contracts', act: () => { }, cap: 'One customer agreement, separate supply, trading, open-access and certificate documents.' },
    { role: 'manager', view: 'ecosystem', act: () => { state.ecoSel = 'nldc'; }, cap: 'Captive status is tested every year; failure costs are pre-allocated.' }] },
  { t: 'Is the maths right?', d: 'Acceptance tests A–J against the live engine.', steps: [
    { role: 'manager', view: 'checks', act: () => { }, cap: 'Energy balance, storage conservation, double-claim block, zero-CFE grid, data gaps and more.' }] }
];
USE_CASES.forEach((u, i) => u.id = 'UC' + (i + 1));

const tour = { list: null, i: 0, auto: false, timer: null, t0: 0, raf: null };
function tourShow(i) {
  const s = tour.list[i]; tour.i = i;
  if (s.act) s.act();
  setRole(s.role, s.view); render();
  if (s.after) s.after();
  $('narr').hidden = false;
  $('narrK').textContent = (tour.name || 'Walkthrough') + ' · ' + (i + 1) + ' / ' + tour.list.length;
  $('narrCap').innerHTML = typeof s.cap === 'function' ? s.cap() : s.cap;
  $('narrBack').disabled = i === 0;
  $('narrNext').textContent = i === tour.list.length - 1 ? 'Finish' : 'Next';
  $('narrPlay').hidden = !tour.timed;
  $('narrPlay').textContent = tour.auto ? 'Pause' : 'Play';
  clearTimeout(tour.timer); cancelAnimationFrame(tour.raf); $('narrProg').style.width = '0';
  if (tour.timed && tour.auto) {
    const dur = (s.dur || 8) * 1000; tour.t0 = performance.now();
    const tick = () => { const p = Math.min(1, (performance.now() - tour.t0) / dur); $('narrProg').style.width = (p * 100) + '%'; if (p < 1) tour.raf = requestAnimationFrame(tick); };
    tick(); tour.timer = setTimeout(() => i < tour.list.length - 1 ? tourShow(i + 1) : tourEnd(), dur);
  }
}
function tourStart(list, name, timed) { tour.list = list; tour.name = name; tour.timed = timed; tour.auto = timed; $('ucScrim').hidden = true; tourShow(0); }
function tourEnd() { stopF(); clearTimeout(tour.timer); cancelAnimationFrame(tour.raf); $('narr').hidden = true; tour.list = null; }
$('narrNext').addEventListener('click', () => tour.i < tour.list.length - 1 ? tourShow(tour.i + 1) : tourEnd());
$('narrBack').addEventListener('click', () => tour.i > 0 && tourShow(tour.i - 1));
$('narrExit').addEventListener('click', tourEnd);
$('narrPlay').addEventListener('click', () => { tour.auto = !tour.auto; tourShow(tour.i); });
$('demoBtn').addEventListener('click', () => tourStart(DEMO, 'Presentation demo · 2 min', true));
$('ucBtn').addEventListener('click', () => {
  $('ucDrawer').innerHTML = `<div class="row" style="justify-content:space-between"><div><div class="eyebrow">Q&amp;A library</div><h2>Use cases</h2></div><button class="btn sm" data-close="1">Close</button></div>
  <p class="small muted">Each one sets up the scenario and walks through it step by step. Use Next and Back at your own pace.</p>
  <button class="uc" data-demo="1"><span class="id">2 MIN</span><span class="t">Presentation demo, manual pace</span><span class="d">The same 15 steps as the timed demo, without the timer.</span><span class="ar">›</span></button>
  ${USE_CASES.map(u => `<button class="uc" data-uc="${u.id}"><span class="id">${u.id}</span><span class="t">${u.t}</span><span class="d">${u.d}</span><span class="ar">›</span></button>`).join('')}`;
  $('ucScrim').hidden = false;
});
$('ucScrim').addEventListener('click', e => {
  if (e.target === $('ucScrim') || e.target.closest('[data-close]')) { $('ucScrim').hidden = true; return; }
  const b = e.target.closest('[data-uc],[data-demo]'); if (!b) return;
  if (b.dataset.demo) return tourStart(DEMO, 'Presentation demo', false);
  const u = USE_CASES.find(x => x.id === b.dataset.uc); tourStart(u.steps, u.id + ' · ' + u.t, false);
});

state.role = 'home'; state.view = 'home';
render();

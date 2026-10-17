/* ===================== ONBOARDING JOURNEYS (per portal) ===================== */
const JOURNEYS = {
  customer: {
    side: 'Customer', owner: 'Key account manager', ttl: 'About 6–12 months to go-live, with shadow mode before any commitment',
    title: 'Get hourly clean energy for your site', lead: 'A named-account journey, not a self-serve checkout. Each stage tells you what you do, what we do, and which documents unlock the next step.',
    why: ['One counterparty for supply, trading, open access and certificates', 'A monthly score your sustainability team can defend, checked by an independent verifier', 'No change to reliability: the grid and your backup keep the site running', 'We see meter data only, never workloads or servers'],
    stages: [
      { t: 'Register and verify', you: 'Create the account, verify the company and add your buying team.', we: 'KYC check; assign a key account manager.', docs: ['Certificate of incorporation', 'GST registration', 'Letter of authority for power procurement'], time: '1–2 days' },
      { t: 'Share meter data', you: 'Sign the NDA and data schedule. Upload 12 months of 15-minute interval data, or grant read-only meter access.', we: 'Check completeness. Gaps are flagged, never filled in.', docs: ['Mutual NDA and data schedule', 'Interval data export (CSV)', 'Single-line diagram of the site connection'], time: '1 week', link: ['c_onboard', 1, 'Open the meter-data upload'] },
      { t: 'Hourly diagnostic', you: 'Tell us about current supply contracts and your goals.', we: 'Measure your real hourly match, your weakest hours and the gap to target.', docs: ['Summary of current PPAs / RECs', 'Sustainability target statement'], time: '4–8 weeks', link: ['c_onboard', 3, 'Open the diagnostic'] },
      { t: 'Proposal and term sheet', you: 'Choose a tier and review the portfolio and non-price terms.', we: 'Size and back-test a portfolio per tier; issue an indicative term sheet.', docs: ['Signed term sheet (non-binding)'], time: '2–4 weeks', link: ['c_onboard', 4, 'Open the proposal'] },
      { t: 'Buying-committee diligence', you: 'Procurement, sustainability, facilities, finance, legal and cyber each sign off.', we: 'Answer diligence questions, run the credit check and the security review.', docs: ['Credit and collateral pack', 'Security questionnaire', 'Facilities no-impact confirmation'], time: '6–12 weeks' },
      { t: 'Contract and approvals', you: 'Sign the master services agreement and authorise the open-access filing.', we: 'File green open access, appoint the verifier, set up a captive SPV if chosen.', docs: ['Master CFE Services Agreement', 'Open-access filing authority', 'Verifier engagement letter'], time: '2–6 months' },
      { t: 'Shadow mode', you: 'Review weekly hourly scores. No service credits apply yet.', we: 'Run live dispatch and evidence on your meter to prove the method.', docs: ['Shadow-mode acceptance note'], time: '1–3 months', link: ['c_service', null, 'See the live service view'] },
      { t: 'Live service', you: 'Receive a monthly statement and the verifier’s opinion.', we: 'Operate, report, verify and settle any credits.', docs: [], time: 'Ongoing', link: ['c_statement', null, 'Open a monthly statement'] }
    ]
  },
  supplier: {
    side: 'Supplier', owner: 'Procurement lead', ttl: 'About 3–6 months from application to first scheduled delivery',
    title: 'Supply the CF90 portfolio', lead: 'For solar, wind and storage owners in a state we serve. We buy energy and its certificates together, under long-term contracts.',
    why: ['10–15 year offtake for energy plus attributes', 'Agreed delivery profile and curtailment terms', 'Your plant stays yours: schedules go through your coordinator', 'Monthly settlement statement and certificate record'],
    stages: [
      { t: 'Register', you: 'Create the account with company and asset basics.', we: 'KYC; assign a procurement lead.', docs: ['Certificate of incorporation', 'GST registration', 'Board resolution or authority letter'], time: '1–2 days' },
      { t: 'Asset qualification', you: 'Submit asset, grid, metering and rights details.', we: 'Run the six eligibility gates automatically.', docs: ['Commissioning certificate', 'Connectivity / GNA approval', 'Interface meter registration', 'Scheduling coordinator (QCA) letter', 'Lender consent', 'Declaration: attributes not sold elsewhere'], time: '1–2 weeks', link: ['s_onboard', 4, 'Open the eligibility gates'] },
      { t: 'Generation data and backtest', you: 'Upload 12 months of 15-minute generation.', we: 'Test how well your output fits live customer load.', docs: ['Generation export (CSV)', 'Availability history'], time: '2–3 weeks', link: ['s_onboard', 5, 'See your portfolio value'] },
      { t: 'Commercial terms', you: 'Negotiate the PPA term sheet.', we: 'Offer energy-plus-attributes offtake with profile and curtailment terms.', docs: ['PPA term sheet'], time: '4–8 weeks' },
      { t: 'Contract signing', you: 'Sign the PPA and the attribute transfer; open a certificate registry account.', we: 'Countersign; link registry accounts.', docs: ['Signed PPA', 'Attribute transfer deed', 'Certificate registry account ID'], time: '4–12 weeks' },
      { t: 'Systems integration', you: 'Connect your forecast feed and confirm schedule exchange through your coordinator.', we: 'Run a test day: schedules, meter upload and a certificate dry-run.', docs: ['Forecast feed test log', 'Test-day sign-off'], time: '2–4 weeks' },
      { t: 'Live supply', you: 'Follow day-ahead schedules and send outage notices.', we: 'Dispatch, settle monthly, issue and cancel certificates.', docs: [], time: 'Ongoing', link: ['s_asset', null, 'Open the live asset view'] }
    ]
  },
  trader: {
    side: 'Partner', owner: 'Trading lead', ttl: 'About 4–8 weeks to the first live order',
    title: 'Execute green exchange trades for CF90', lead: 'CFE Manager does not hold an exchange membership. A licensed trading member places our orders under a written mandate.',
    why: ['Steady daily order flow in green day-ahead and intraday products', 'Clear limits: products, volumes and bid caps set in the mandate', 'Requests and confirmations through one API'],
    stages: [
      { t: 'Empanelment', you: 'Share your exchange membership and trading licence.', we: 'Check licence, financial standing and conflicts.', docs: ['CERC trading licence', 'Exchange membership certificate', 'Net-worth certificate'], time: '1–2 weeks' },
      { t: 'Trading mandate', you: 'Agree agency basis, products, bid limits and collateral.', we: 'Set risk limits; treasury arranges collateral.', docs: ['Signed trading mandate', 'Collateral arrangement'], time: '2–4 weeks' },
      { t: 'Systems link', you: 'Enable order-request intake and the confirmation feed.', we: 'Place test orders and reconcile confirmations.', docs: ['API credentials exchanged', 'Test-order reconciliation'], time: '1–2 weeks' },
      { t: 'Live', you: 'Execute requests within the mandate and confirm fills.', we: 'Send requests day-ahead and intraday; reconcile daily.', docs: [], time: 'Ongoing', link: ['t_desk', null, 'Open the order desk'] }
    ]
  },
  verifier: {
    side: 'Partner', owner: 'Sustainability assurance lead', ttl: 'About 4–8 weeks to the first monthly review',
    title: 'Independently verify CF90 claims', lead: 'An independent assurance provider checks every monthly score before it becomes a public claim. Access is read-only.',
    why: ['Full read-only access to physical, settlement and certificate ledgers', 'A stable written method with exception codes', 'Evidence pack delivered by D+10 each month'],
    stages: [
      { t: 'Appointment', you: 'Confirm independence and agree the scope.', we: 'Issue the engagement letter with customer consent.', docs: ['Independence declaration', 'Engagement letter'], time: '2–3 weeks' },
      { t: 'Method review', you: 'Review method v1.0 and agree the sampling plan.', we: 'Share the method, data dictionary and exception codes.', docs: ['Method v1.0 acknowledgement', 'Sampling plan'], time: '2–4 weeks' },
      { t: 'Read-only access', you: 'Accept the access terms.', we: 'Grant read-only access to ledgers and audit logs.', docs: ['Access agreement'], time: '1 week' },
      { t: 'Monthly review', you: 'Re-perform samples and issue an opinion.', we: 'Deliver the evidence pack by D+10.', docs: [], time: 'Monthly', link: ['v_review', null, 'Open the month review'] }
    ]
  }
};
const REG = {
  customer: { org: 'Colocation G Pvt Ltd', person: 'Ananya Rao', title: 'Head of energy procurement', email: 'ananya.rao@colocation-g.example', k: 'Site', v: 'Jamnagar data centre · 60 MW', team: ['Ananya Rao · procurement (admin)', 'Sustainability lead', 'Facilities head', 'Finance controller'] },
  supplier: { org: 'Bhuj Wind Power Pvt Ltd', person: 'Rahul Mehta', title: 'Commercial manager', email: 'rahul.mehta@bhujwind.example', k: 'Asset', v: 'Bhuj Wind · 90 MW · Kutch, Gujarat', team: ['Rahul Mehta · commercial (admin)', 'Plant manager', 'Scheduling coordinator (QCA)'] },
  trader: { org: 'Partner trading member (illustrative)', person: 'Neha Iyer', title: 'Head of power trading', email: 'neha.iyer@tradingmember.example', k: 'Licence', v: 'Inter-state trading licence · exchange member', team: ['Neha Iyer · trading (admin)', 'Risk officer', 'Settlement desk'] },
  verifier: { org: 'Assurance firm (illustrative)', person: 'Vikram Shah', title: 'Assurance partner', email: 'vikram.shah@assurance.example', k: 'Scope', v: 'Monthly CFE score assurance · Hyperscaler A', team: ['Vikram Shah · partner (admin)', 'Energy data analyst'] }
};
function jrS(r) { state.jr = state.jr || {}; if (!state.jr[r]) state.jr[r] = { reg: false, stage: 0, docs: {}, sub: false, view: 0 }; return state.jr[r]; }
function jrDocs(r, i) { const s = jrS(r), n = JOURNEYS[r].stages[i].docs.length; if (!s.docs[i]) s.docs[i] = new Array(n).fill(false); return s.docs[i]; }
function jrApprove(r) { const s = jrS(r), n = JOURNEYS[r].stages.length; if (s.stage < n - 1) { s.stage++; s.view = s.stage; } s.sub = false; }
function jrSet(r, stage) { const s = jrS(r); s.reg = true; s.stage = stage; s.view = stage; s.sub = false; for (let i = 0; i < stage; i++) jrDocs(r, i).fill(true); }
const FILE_ICON = '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M2 1h8l4 4v12H2z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10 1v4h4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

function startView(r) {
  const J = JOURNEYS[r], s = jrS(r), F = REG[r], st = J.stages, n = st.length, cur = s.stage, v = Math.min(s.view, n - 1), sg = st[v];
  const live = s.reg && cur === n - 1;
  const strip = `<div class="steps">${st.map((x, i) => { const done = s.reg && i < cur, now = s.reg && i === cur; return `<button class="step ${done ? 'done' : ''}" ${i === v ? 'aria-current="step"' : ''} data-act="jView" data-r="${r}" data-i="${i}"><span class="n">${done ? '✓ done' : now ? (live ? '● live' : '● now') : 'Stage ' + (i + 1)}</span><span class="t">${x.t}</span></button>`; }).join('')}</div>`;
  const pct = s.reg ? cur / (n - 1) : 0;
  const account = !s.reg ? `
    <div class="panel"><div class="ph"><h3>Create your account</h3>${chip('Step 1', 'info')}</div>
      <div class="form" style="grid-template-columns:1fr">
        <div class="fld"><label for="jr-org-${r}">Organisation</label><input type="text" id="jr-org-${r}" value="${esc(F.org)}"></div>
        <div class="fld"><label for="jr-person-${r}">Your name and role</label><input type="text" id="jr-person-${r}" value="${esc(F.person + ', ' + F.title)}"></div>
        <div class="fld"><label for="jr-email-${r}">Work email</label><input type="text" id="jr-email-${r}" value="${esc(F.email)}"><span class="hint">A one-time code is sent here to verify the address.</span></div>
        <div class="fld"><label for="jr-k-${r}">${F.k}</label><input type="text" id="jr-k-${r}" value="${esc(F.v)}"></div>
      </div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:12px" data-act="jReg" data-r="${r}">Create account and verify email</button>
      <p class="small muted" style="margin-top:8px">Sample details are filled in. Nothing is sent anywhere.</p></div>`
    : `<div class="panel"><div class="ph"><h3>${esc(F.org)}</h3>${chip('Verified', 'good')}</div>
      <dl class="kv"><dt>Admin</dt><dd>${esc(F.person)}, ${esc(F.title)}</dd><dt>${F.k}</dt><dd>${esc(F.v)}</dd><dt>Your contact</dt><dd>${J.owner}, CFE Manager</dd></dl>
      <div class="eyebrow" style="margin:12px 0 6px">Team on this account</div><ul class="plain small">${F.team.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
  const docs = jrDocs(r, v), allUp = docs.every(Boolean);
  let action = '';
  if (!s.reg) action = `<div class="callout">Create your account on the left to start stage 1.</div>`;
  else if (v < cur) action = `<div class="callout good">Completed. CFE Manager approved this stage.</div>`;
  else if (v > cur) action = `<div class="callout">This stage opens after <b>${st[cur].t}</b> is approved.</div>`;
  else if (live) action = `<div class="callout good"><b>You are live.</b> ${r === 'customer' ? 'Monthly statements and verifier opinions arrive here.' : r === 'supplier' ? 'Schedules and settlement statements arrive here.' : 'Requests and evidence arrive here.'}</div>`;
  else if (s.sub) action = `<div class="callout warn"><b>Under review by CFE Manager.</b> Typical response: two working days. You will be notified here.</div>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="jToQueue">See it in the CFE Manager queue</button><button class="btn primary" data-act="jApprove" data-r="${r}">Approve now (demo shortcut)</button></div>`;
  else action = `<div class="row" style="justify-content:space-between"><span class="small muted">${docs.filter(Boolean).length} of ${docs.length} documents uploaded</span><div class="row">${docs.length && !allUp ? `<button class="btn" data-act="jAll" data-r="${r}">Upload sample files</button>` : ''}<button class="btn primary" data-act="jSub" data-r="${r}" ${allUp ? '' : 'disabled'}>Submit stage for review</button></div></div>`;
  return `
  <div class="phead"><div><div class="eyebrow">${ROLES[r].name} portal · Get started</div><h1>${J.title}</h1><p class="lead">${J.lead}</p></div>
    <div style="min-width:240px"><div class="row" style="justify-content:space-between"><span class="small muted">Progress</span><span class="num small" style="font-weight:600">${s.reg ? (live ? 'Live' : 'Stage ' + (cur + 1) + ' of ' + n) : 'Not started'}</span></div><div class="meter" style="margin-top:6px"><div class="f" style="width:${pct * 100}%;background:${ROLES[r].c}"></div></div><p class="small muted" style="margin-top:6px">${J.ttl}</p></div></div>
  ${strip}
  <div class="g12">
    <div class="stack">${account}
      <div class="panel"><div class="ph"><h3>What you get</h3></div><ul class="plain small">${J.why.map(w => `<li>${w}</li>`).join('')}</ul></div></div>
    <div class="stack">
      <div class="panel"><div class="ph"><div><div class="eyebrow">Stage ${v + 1} of ${n} · typical time ${sg.time}</div><h2>${sg.t}</h2></div>${!s.reg ? chip('Not started', 'neutral') : v < cur ? chip('Done', 'good') : v === cur ? chip(live ? 'Live' : s.sub ? 'In review' : 'Your action', live ? 'good' : s.sub ? 'warn' : 'info') : chip('Locked', 'neutral')}</div>
        <div class="youwe"><div><div class="eyebrow" style="margin-bottom:4px">You do</div><p>${sg.you}</p></div><div><div class="eyebrow" style="margin-bottom:4px">CFE Manager does</div><p>${sg.we}</p></div></div>
        ${sg.docs.length ? `<div class="eyebrow" style="margin:14px 0 6px">Documents for this stage</div><div class="stack" style="gap:6px">${sg.docs.map((d, i) => `<div class="doc ${docs[i] ? 'up' : ''}"><span class="faint">${FILE_ICON}</span><span>${d}${docs[i] ? `<br><span class="mono small muted">${d.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 34)}.pdf · uploaded</span>` : ''}</span>${docs[i] ? chip('Uploaded', 'good') : (s.reg && v === cur && !s.sub ? `<button class="btn sm" data-act="jDoc" data-r="${r}" data-i="${i}">Upload</button>` : chip('Pending', 'neutral'))}</div>`).join('')}</div>` : ''}
        ${sg.link ? `<button class="btn" style="margin-top:12px" data-act="jLink" data-r="${r}" data-i="${v}">${sg.link[2]} →</button>` : ''}
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line-2)">${action}</div></div>
      ${v < n - 1 ? `<div class="panel" style="background:var(--panel-2)"><div class="eyebrow">Next · stage ${v + 2}</div><h4 style="margin:2px 0 4px">${st[v + 1].t}</h4><p class="small muted">${st[v + 1].you}</p></div>` : ''}
    </div>
  </div>`;
}
V.c_start = () => startView('customer');
V.s_start = () => startView('supplier');
V.t_start = () => startView('trader');
V.v_start = () => startView('verifier');

/* ---------- CFE Manager: onboarding queue ---------- */
const QUEUE_STATIC = [
  { name: 'AI Campus C (Reliance-controlled)', side: 'Customer', stage: '5/8 · Buying-committee diligence', waiting: 'Applicant', pend: 'CISO sign-off; finance sign-off', owner: 'Key account manager', age: 41 },
  { name: 'Manufacturer D', side: 'Customer', stage: '4/8 · Proposal and term sheet', waiting: 'CFE Manager', pend: 'Re-size for day-heavy load', owner: 'Key account manager', age: 18 },
  { name: 'Colocation B', side: 'Customer', stage: '3/8 · Hourly diagnostic', waiting: 'CFE Manager', pend: 'Maharashtra state gate review', owner: 'Market entry lead', age: 26 },
  { name: 'Morbi Hybrid', side: 'Supplier', stage: '2/7 · Asset qualification', waiting: 'Applicant', pend: 'Lender consent', owner: 'Procurement lead', age: 12 },
  { name: 'Kutch Solar Phase 3', side: 'Supplier', stage: '4/7 · Commercial terms', waiting: 'Applicant', pend: 'COD date; commissioning certificate', owner: 'Procurement lead', age: 57 },
  { name: 'Dahej Storage', side: 'Supplier', stage: '1/7 · Register', waiting: 'Applicant', pend: 'Board resolution', owner: 'Procurement lead', age: 3 },
  { name: 'Jaisalmer Wind', side: 'Supplier', stage: 'Closed', waiting: '—', pend: 'Rejected: outside Gujarat boundary', owner: 'Procurement lead', age: 9 }
];
V.onboarding = () => {
  const live = ['customer', 'supplier', 'trader', 'verifier'].map(r => {
    const s = jrS(r), J = JOURNEYS[r], n = J.stages.length, sg = J.stages[s.stage];
    const out = jrDocs(r, s.stage).filter(x => !x).length;
    return { r, name: REG[r].org, side: J.side + (r === 'trader' ? ' · trading' : r === 'verifier' ? ' · verifier' : ''), stage: s.reg ? (s.stage + 1) + '/' + n + ' · ' + sg.t : 'Invited',
      waiting: !s.reg ? 'Applicant' : s.stage === n - 1 ? 'Live' : s.sub ? 'CFE Manager' : 'Applicant',
      pend: !s.reg ? 'Account not created yet' : s.stage === n - 1 ? 'Onboarding complete' : s.sub ? 'Review: ' + sg.t.toLowerCase() : out ? out + ' document' + (out > 1 ? 's' : '') + ' outstanding' : 'Ready to submit',
      owner: J.owner, age: s.reg ? 1 + s.stage * 6 : 0, live: true };
  });
  const rows = [...live, ...QUEUE_STATIC];
  const usN = rows.filter(x => x.waiting === 'CFE Manager').length, themN = rows.filter(x => x.waiting === 'Applicant').length;
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Onboarding queue</div><h1>Every applicant, every stage, one queue</h1><p class="lead">Customers, generators and partners each follow their own journey in their portal. Their submissions land here for review. Approving a stage unlocks the next one in their portal.</p></div>
    <div class="row">${['customer', 'supplier', 'trader', 'verifier'].map(r => `<button class="btn sm" data-role="${r}" data-view="${r[0]}_start"><span class="dotk" style="background:${ROLES[r].c};border-radius:50%"></span>${ROLES[r].name} view</button>`).join('')}</div></div>
  <div class="kpis">${kpi('Open applications', rows.filter(x => x.waiting !== 'Live' && x.waiting !== '—').length)}${kpi('Waiting on us', usN, 'target: 2 working days', usN ? 'warn' : 'good')}${kpi('Waiting on applicants', themN, 'reminders sent weekly')}${kpi('Live this quarter', live.filter(x => x.waiting === 'Live').length + 4, 'incl. existing portfolio')}</div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Applicant</th><th>Side</th><th>Stage</th><th>Waiting on</th><th>Pending · owner</th><th class="r">Days</th><th>Action</th></tr></thead><tbody>
  ${rows.map(x => `<tr ${x.live && x.waiting === 'CFE Manager' ? 'class="sel"' : ''}><td style="font-weight:600;white-space:normal;min-width:170px">${esc(x.name)}${x.live ? '<br>' + chip('demo applicant', 'info') : ''}</td><td>${x.side}</td><td class="small">${x.stage}</td><td>${x.waiting === 'CFE Manager' ? chip('CFE Manager', 'warn') : x.waiting === 'Live' ? chip('Live', 'good') : x.waiting === '—' ? chip('Closed', 'neutral') : chip('Applicant', 'neutral')}</td><td class="wrap small">${esc(x.pend)}<br><span class="muted">${x.owner}</span></td><td class="r num">${x.age}</td>
  <td>${x.live && x.waiting === 'CFE Manager' ? `<button class="btn sm primary" data-act="qApprove" data-r="${x.r}">Approve stage</button>` : x.live && x.waiting === 'Applicant' ? `<button class="btn sm" data-role="${x.r}" data-view="${x.r[0]}_start">Open their portal</button>` : x.waiting === 'Applicant' ? `<button class="btn sm" data-act="qRemind" data-n="${esc(x.name)}">Send reminder</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="g2">
    <div class="panel"><div class="ph"><h3>How a stage moves</h3></div><ol class="plain" style="padding-left:20px;gap:6px">
      <li>The applicant uploads documents in their portal and submits the stage.</li><li>It appears here as <b>waiting on CFE Manager</b> with an owner.</li><li>The owner checks the documents and approves, or asks for changes.</li><li>The next stage opens in the applicant's portal.</li></ol>
      <div class="callout" style="margin-top:12px">Try it: open the Customer portal, create the account, upload the sample files, submit, then come back here and approve.</div></div>
    <div class="panel"><div class="ph"><h3>Journey lengths</h3><span class="sub">typical, end to end</span></div><div class="tw"><table><tbody>
      ${['customer', 'supplier', 'trader', 'verifier'].map(r => `<tr><td>${sw(ROLES[r].c)}${ROLES[r].name}</td><td class="r num">${JOURNEYS[r].stages.length} stages</td><td class="wrap small muted">${JOURNEYS[r].ttl}</td></tr>`).join('')}</tbody></table></div></div>
  </div>`;
};

/* ===================== EVIDENCE: one traceable hour + three ledgers ===================== */
function traceStored(d, h) {
  const i0 = (d * 24 + h) * 4, out = R.blocks.slice(i0, i0 + 4);
  const etaC = R.M.etaC, etaD = R.M.etaD;
  const need = out.reduce((a, b) => a + b.disElig * SIM.DT / etaD, 0); // clean energy drawn from storage
  if (need < 0.05) return null;
  let acc = 0, sol = 0, first = null, last = null, drawn = 0;
  for (let i = i0 - 1; i >= Math.max(0, i0 - 192) && acc < need; i--) {
    const b = R.blocks[i]; if (b.chg < 0.05) continue;
    const e = b.chg * etaC * SIM.DT, take = Math.min(e, need - acc);
    acc += take; sol += take * b.sShare; drawn += take / etaC; last = last ?? i; first = i;
  }
  const delivered = out.reduce((a, b) => a + b.disElig, 0) * SIM.DT;
  return { delivered, charged: drawn, loss: drawn - delivered, solShare: acc ? sol / acc : 0, from: first, to: last };
}
const bLabel = i => dayLabel(Math.floor(i / BPD)).replace(/^\w+ /, '') + ' ' + blkTime(i % BPD);

function traceFlow(d, h) {
  const o = R.hours[d * 24 + h], certs = R.certs.filter(c => c.d === d && c.h === h), tr = traceStored(d, h);
  const sched = o.fcClean, dev = o.actClean - sched, gen = o.genS + o.genW;
  const flow = [
    { t: 'Generated', v: f1(gen) + ' MWh', d: `Kutch Solar ${f1(o.genS)} · Kutch Wind ${f1(o.genW)}, generator meters` },
    { t: 'Delivered after losses', v: f1(o.actClean) + ' MWh', d: `${f1(o.losses)} MWh transmission losses · schedule ${f1(sched)} (${dev >= 0 ? '+' : ''}${f1(dev)})` },
    { t: 'Stored or discharged', v: tr ? f1(tr.delivered) + ' MWh out' : (o.charge > 0.05 ? f1(o.charge) + ' MWh in' : '—'), d: tr ? `charged ${f1(tr.charged)} MWh, ${bLabel(tr.from)}–${bLabel(tr.to + 1)} · ${f1(tr.loss)} MWh storage loss · ${pc(tr.solShare, 0)} solar origin` : o.charge > 0.05 ? 'surplus stored for later; the charge source is logged' : 'no storage in this hour' },
    { t: 'Matched to customer', v: f1(o.matched) + ' MWh', d: `of ${f1(o.load)} MWh drawn at the site meter${o.mkt > 0.05 ? ' · incl. ' + f1(o.mkt) + ' MWh exchange blocks' : ''}${o.grid > 0.05 ? ' · ' + f1(o.grid) + ' MWh grid at zero' : ''}` },
    { t: 'Attributes allocated', v: o.status === 'INCOMPLETE' ? 'held' : certs.length + ' batches', d: o.status === 'INCOMPLETE' ? 'meter data missing: no certificates' : certs.map(c => ({ SOL: 'Solar', WND: 'Wind', ST: 'Stored', MKT: 'Exchange' }[c.serial.split('-')[2]]) + ' ' + f1(c.mwh)).join(' · ') + (o.status === 'PROVISIONAL' ? ' · pending' : ' · cancelled to buyer') },
    { t: 'Independently reviewed', v: 'pending', d: 'month-end sampling by the verifier' }
  ];
  const stOf = i => i === 5 ? 'wait' : (i === 4 && o.status !== 'CLAIM_READY') ? (o.status === 'INCOMPLETE' ? 'fail' : 'wait') : (i === 3 && o.status === 'INCOMPLETE') ? 'fail' : 'pass';
  const ic = s => s === 'pass' ? '✓' : s === 'fail' ? '✕' : '…';
  return { tr, html: `<div class="trace">${flow.map((f, i) => `<div class="tstep ${stOf(i)}"><span class="eyebrow">Step ${i + 1}</span><span class="st"><span class="ic">${ic(stOf(i))}</span>${f.t}</span><span class="tv">${f.v}</span><span class="small muted">${f.d}</span></div>`).join('')}</div>` };
}

V.evidence = () => {
  const d = state.day, h = state.hourSel, o = R.hours[d * 24 + h];
  const certs = R.certs.filter(c => c.d === d && c.h === h);
  const T = traceFlow(d, h), tr = T.tr;
  const M = R.M;
  return `
  <div class="phead"><div><div class="eyebrow">CFE Manager · Evidence</div><h1>Tracing ${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00 on ${dayLabel(d)}</h1><p class="lead">Follow one hour from generation to an independently reviewed claim. Click any cell in the month below to trace another hour.</p></div>
    <div class="row"><span class="big" style="font-size:34px;color:${o.cfe >= state.tier / 100 ? 'var(--good)' : 'var(--crit)'}">${pc(o.cfe)}</span><span class="small muted">eligible share<br>of ${f1(o.load)} MWh</span></div></div>
  ${T.html}
  ${tr ? `<div class="callout">Battery electricity in this hour traces back to the solar and wind that charged it, after a ${f1(tr.loss)} MWh storage loss. Its certificates carry that origin; the battery does not create a new renewable attribute.</div>` : ''}
  <div class="ledgers">
    <div class="ledger"><h4>${sw('var(--ink-2)')}Physical ledger</h4><p class="small muted" style="margin-bottom:6px">What flowed, MWh</p>
      ${[['Solar generated', o.genS], ['Wind generated', o.genW], ['Transmission losses', o.losses], ['Battery charged', o.charge + o.gridCharge], ['Battery discharged', o.bessElig + o.bessInelig], ['Exchange blocks', o.mkt], ['Grid residual', o.grid], ['Site load', o.load]].map(([k, v]) => `<div class="row2"><span>${k}</span><span>${f1(v)}</span></div>`).join('')}</div>
    <div class="ledger"><h4>${sw('var(--r-trader)')}Settlement ledger</h4><p class="small muted" style="margin-bottom:6px">Who bills whom · values with finance</p>
      ${[['Solar PPA line', 'PPA-KTC-SOL-01 · ' + f1(o.solar) + ' MWh'], ['Wind PPA line', 'PPA-KTC-WND-02 · ' + f1(o.wind) + ' MWh'], ['Storage tolling', 'TOLL-JMN-01 · availability'], ['Exchange obligation', o.mkt > 0.05 ? 'SIM-IEX-OBL · ' + f1(o.mkt) + ' MWh' : '—'], ['DISCOM residual', o.grid > 0.05 ? f1(o.grid) + ' MWh' : '—'], ['Customer statement', 'CF90-STMT-OCT26']].map(([k, v]) => `<div class="row2"><span>${k}</span><span style="font-size:11.5px">${v}</span></div>`).join('')}</div>
    <div class="ledger"><h4>${sw('var(--r-verifier)')}Attribute ledger</h4><p class="small muted" style="margin-bottom:6px">What can be claimed, MWh</p>
      ${[['Solar, cancelled', o.solar], ['Wind, cancelled', o.wind], ['Stored solar/wind', o.bessElig], ['Exchange blocks', o.mkt], ['Battery, grid share (0)', o.bessInelig], ['Grid residual (0)', o.grid]].map(([k, v]) => `<div class="row2"><span>${k}</span><span>${f1(v)}</span></div>`).join('')}
      <div class="row2" style="font-weight:600"><span>Matched / load</span><span>${f1(o.matched)} / ${f1(o.load)}</span></div></div>
  </div>
  <div class="g12">
    <div class="panel"><div class="ph"><h3>Certificate batches</h3><span class="sub">proposed registry · simulated serials</span></div>
      <p class="small muted" style="margin-bottom:8px">One batch per source per hour. Each batch covers the MWh shown, not a single certificate.</p>
      <div class="tw"><table><thead><tr><th>Batch serial</th><th>Origin</th><th class="r">MWh</th><th>Status</th></tr></thead><tbody>
      ${certs.map(c => `<tr><td class="mono small">${c.serial}</td><td class="small">${c.asset}</td><td class="r num">${f1(c.mwh)}</td><td>${c.pending ? chip('Pending', 'warn') : chip('Cancelled to buyer', 'good')}</td></tr>`).join('') || `<tr><td colspan="4" class="muted">${o.status === 'INCOMPLETE' ? 'No certificates: meter data missing.' : 'No eligible supply this hour.'}</td></tr>`}
      ${o.grid > 0.05 ? `<tr><td class="small muted">no certificate</td><td class="small muted">DISCOM residual</td><td class="r num">${f1(o.grid)}</td><td>${chip('0 CFE', 'crit')}</td></tr>` : ''}
      </tbody></table></div></div>
    <div class="panel"><div class="ph"><h3>Month status</h3><span class="sub">${PERIOD}</span></div>
      ${stageStrip(M, true)}
      <div class="tw" style="margin-top:12px"><table><tbody>
        <tr><td>Physical clean supply matched</td><td class="r num">${f0(M.physicalMatched)} MWh</td></tr>
        <tr><td>− missing meter evidence</td><td class="r num">${f0(M.excludedMissing)} MWh</td></tr>
        <tr><td>− certificates pending</td><td class="r num">${f0(M.excludedPending)} MWh</td></tr>
        <tr style="font-weight:600"><td>= Eligible, claimable</td><td class="r num">${f0(M.scoreComplete * M.load)} MWh</td></tr>
        <tr><td class="muted">Certificate batches</td><td class="r num muted">${f0(R.certs.length)} batches · ${f0(R.certs.reduce((a, c) => a + c.mwh, 0))} MWh</td></tr>
      </tbody></table></div>
      ${M.scoreNaive - M.scoreComplete > 0.0005 ? `<div class="callout crit" style="margin-top:10px">An unchecked dashboard would report <b>${pc(M.scoreNaive)}</b> by counting grid-charged storage and missing meter data. CF90 rejects that number.</div>` : ''}</div>
  </div>
  <div class="panel"><div class="ph"><h3>Every hour of the month</h3>${heatLegend()}</div>${heatSVG(R, d, h)}</div>`;
};

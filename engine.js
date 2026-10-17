/* CF90 orchestration engine — SIMULATED DATA ONLY */
const SIM = (() => {
  const DAYS = 31, BPD = 96, DT = 0.25, NB = DAYS * BPD;
  const ENGINE_VERSION = 'cf90-engine-1.1';
  const DATA_VERSION = 'synthetic 1–31 Oct 2026 · seed 2026';

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- synthetic Gujarat-shaped profiles (per unit) ---------- */
  function genProfiles(seed) {
    const r = mulberry32(seed);
    const g = () => { const u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const P = { load: [], solar: [], wind: [], solarFc: [], windFc: [], mkt: [], price: [] };
    let windAR = 0, fcS = 0, fcW = 0;
    for (let d = 0; d < DAYS; d++) {
      const clear = 0.84 + 0.16 * r();
      const windDay = 0.5 + 0.65 * r();
      const priceDay = 0.85 + 0.3 * r();
      for (let b = 0; b < BPD; b++) {
        const h = b / 4 + 0.125;
        P.load.push(100 + 4 * Math.sin((h - 9) / 24 * 2 * Math.PI) + 1.0 * g());
        const sr = 6.55, ss = 18.15;
        let s = 0;
        if (h > sr && h < ss) s = Math.pow(Math.sin(Math.PI * (h - sr) / (ss - sr)), 1.2) * 0.80 * clear * (0.95 + 0.05 * r());
        P.solar.push(s);
        windAR = 0.985 * windAR + 0.022 * g();
        const base = 0.24 + 0.24 * Math.exp(-Math.pow((h - 20.5) / 3.6, 2)) + 0.07 * Math.exp(-Math.pow((h - 15) / 2.5, 2));
        const w = Math.max(0, Math.min(0.92, base * windDay + windAR));
        P.wind.push(w);
        fcS = 0.9 * fcS + 0.03 * g(); fcW = 0.92 * fcW + 0.05 * g();
        P.solarFc.push(Math.max(0, s * (1 + fcS)));
        P.windFc.push(Math.max(0, Math.min(0.95, w * (1 + fcW))));
        P.mkt.push(r() < 0.8 ? 0.5 + 0.5 * r() : 0);
        // illustrative exchange price index, Rs/MWh: midday solar dip, evening peak
        const pr = (3600 - 1400 * Math.exp(-Math.pow((h - 13) / 3, 2)) + 5600 * Math.exp(-Math.pow((h - 20.5) / 2.2, 2))) * priceDay * (0.94 + 0.12 * r());
        P.price.push(Math.min(10000, Math.max(1500, pr)));
      }
    }
    return P;
  }

  const CONTRACT = {
    site: 'JMN-DC-01', customer: 'Hyperscaler A (illustrative)', boundary: 'Gujarat',
    tz: 'IST (UTC+05:30)', interval: '60-min matching · 15-min dispatch', period: 'Calendar month',
    beneficiary: 'SIM-BUYER-HSA'
  };

  function checkAsset(a, boundary) {
    boundary = boundary || 'Gujarat';
    const checks = [
      { k: 'Commissioned', ok: !!a.cod, fail: 'Not commissioned' },
      { k: 'Supply rights executable', ok: !!a.rights, fail: 'No executable supply rights' },
      { k: 'Attributes exclusive', ok: !!a.attrExclusive, fail: 'Attributes already sold to another buyer' },
      { k: 'Inside ' + boundary + ' boundary', ok: a.state === boundary, fail: 'Outside ' + boundary + ' matching boundary' },
      { k: 'Meter registered', ok: !!a.meter, fail: 'No registered interface meter' },
      { k: 'Scheduling right', ok: !!a.sched, fail: 'No scheduling coordinator appointed' }
    ];
    const fail = checks.find(c => !c.ok);
    return { checks, eligible: !fail, reason: fail ? fail.fail : 'Eligible' };
  }

  /* events: [{k, from, to, factor?, mw?, cap?}] with block indices [from, to) */
  function act(events, k, i) { for (const e of events) if (e.k === k && i >= e.from && i < e.to) return e; return null; }

  function shapeMult(shape, h) {
    if (shape === 'day') return (0.78 + 0.44 * Math.exp(-Math.pow((h - 13.5) / 4.2, 2))) / 0.916;
    return 1;
  }

  function run(P, cfg, events) {
    events = events || [];
    const ls = cfg.loadScale || 1, naive = cfg.policy === 'naive';
    const rte = cfg.rte || 0.88, etaC = Math.sqrt(rte), etaD = Math.sqrt(rte);
    const Emax = cfg.bessMWh * 0.95, Emin = cfg.bessMWh * 0.10;
    let soc = cfg.bessMWh * 0.5, socClean = soc;
    const socStart = soc;
    const blocks = new Array(NB);
    let sumChgIn = 0, sumDisOut = 0;
    for (let i = 0; i < NB; i++) {
      const d = Math.floor(i / BPD), b = i % BPD, h = Math.floor(b / 4), hf = b / 4 + 0.125;
      let L = P.load[i] * ls * shapeMult(cfg.loadShape, hf);
      const ramp = act(events, 'loadRamp', i); if (ramp) L += (ramp.mw || 20);
      let sPU = P.solar[i], wPU = P.wind[i];
      const sd = act(events, 'solarDown', i); if (sd) sPU *= (sd.factor ?? 0.6);
      const wl = act(events, 'windLull', i); if (wl) wPU *= (wl.factor ?? 0.35);
      const S = sPU * cfg.solar, W = wPU * cfg.wind;
      const txE = act(events, 'txConstraint', i);
      const tx = txE ? (txE.cap || 150 * ls) : (cfg.tx || 1e9);
      const P_b = act(events, 'bessOut', i) ? 0 : cfg.bessMW;
      let mAv = P.mkt[i] * cfg.mkt;
      if (act(events, 'mktSpike', i)) mAv = 0;
      const gross = S + W, txOk = Math.min(gross, tx), txCurt = gross - txOk;
      const delivered = txOk * (1 - cfg.loss), losses = txOk * cfg.loss;
      const direct = Math.min(delivered, L);
      const sShare = gross > 0 ? S / gross : 0;
      const solarDir = direct * sShare, windDir = direct - solarDir;
      const surplus = delivered - direct;
      let chg = 0, gc = 0, dis = 0, disElig = 0;
      if (P_b > 0) {
        chg = Math.max(0, Math.min(surplus, P_b, (Emax - soc) / (etaC * DT)));
        soc += chg * etaC * DT; socClean += chg * etaC * DT; sumChgIn += chg;
      }
      const surplusExcl = surplus - chg;
      let deficit = L - direct;
      const gcWin = act(events, 'gridCharge', i) && h >= 2 && h < 5;
      if (P_b > 0 && !gcWin && deficit > 0 && (!naive || h >= 18 || h < 6)) {
        dis = Math.max(0, Math.min(deficit, naive ? (Emax - Emin) * etaD / 12 : P_b, P_b, (soc - Emin) * etaD / DT));
        const out = dis * DT / etaD, frac = soc > 0 ? socClean / soc : 0;
        disElig = dis * frac;
        soc -= out; socClean -= out * frac; sumDisOut += dis; deficit -= dis;
      }
      const mkt = (!naive || h >= 18) ? Math.min(deficit, mAv) : 0; deficit -= mkt;
      const gridToLoad = Math.max(0, deficit);
      if (P_b > 0 && gcWin && soc < 0.6 * cfg.bessMWh) {
        gc = Math.min(P_b * 0.5, (0.6 * cfg.bessMWh - soc) / (etaC * DT));
        soc += gc * etaC * DT; sumChgIn += gc;
      }
      const fc = Math.min(P.solarFc[i] * cfg.solar + P.windFc[i] * cfg.wind, cfg.tx || 1e9) * (1 - cfg.loss);
      blocks[i] = { i, d, b, h, L, S, W, sShare, txCurt, losses, delivered, solarDir, windDir, chg, gc, dis, disElig, mkt, mAv, gridToLoad, surplusExcl, soc, socClean, fc, P_b, price: P.price[i],
        ev: events.some(e => i >= e.from && i < e.to) };
    }
    const hours = [];
    for (let H = 0; H < DAYS * 24; H++) {
      const bs = blocks.slice(H * 4, H * 4 + 4);
      const s = k => (bs[0][k] + bs[1][k] + bs[2][k] + bs[3][k]) * DT;
      const o = { d: Math.floor(H / 24), h: H % 24, load: s('L'), solar: s('solarDir'), wind: s('windDir'), bessElig: s('disElig'), bessInelig: s('dis') - s('disElig'), mkt: s('mkt'), grid: s('gridToLoad'), gridCharge: s('gc'), charge: s('chg'), surplusExcl: s('surplusExcl'), fcClean: s('fc'), actClean: s('delivered'), genS: s('S'), genW: s('W'), losses: s('losses'), ev: bs.some(x => x.ev) };
      o.eligible = o.solar + o.wind + o.bessElig + o.mkt;
      o.matched = Math.min(o.load, o.eligible);
      o.cfe = o.load > 0 ? o.matched / o.load : 0;
      o.naive = Math.min(1, (o.eligible + o.bessInelig) / o.load);
      const meterMissing = bs.some(x => act(events, 'meterOutage', x.i));
      const gcPending = bs.some(x => act(events, 'issuerOutage', x.i));
      o.status = meterMissing ? 'INCOMPLETE' : gcPending ? 'PROVISIONAL' : 'CLAIM_READY';
      o.exception = meterMissing ? 'MTR-GAP' : gcPending ? 'GC-PENDING' : (o.grid > 0.05 ? 'RESIDUAL-GRID' : (o.bessInelig > 0.05 ? 'BESS-MIXED' : ''));
      hours.push(o);
    }
    const certs = [];
    const pad = n => String(n).padStart(2, '0');
    hours.forEach(o => {
      if (o.status === 'INCOMPLETE') return;
      const stamp = '202610' + pad(o.d + 1) + pad(o.h);
      [['SOL', 'KTC-SOL-01', o.solar], ['WND', 'KTC-WND-02', o.wind], ['ST', 'Stored solar/wind via JMN-BES-01', o.bessElig], ['MKT', 'GTAM-TRD-01', o.mkt]].forEach(([c, asset, q]) => {
        if (q > 0.005) certs.push({ serial: 'SIM-GC-' + c + '-' + stamp, asset, d: o.d, h: o.h, mwh: q, pending: o.status === 'PROVISIONAL', beneficiary: CONTRACT.beneficiary });
      });
    });
    const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
    const denom = sum(hours, x => x.load);
    const M = {
      load: denom,
      scoreComplete: sum(hours, x => x.status === 'CLAIM_READY' ? x.matched : 0) / denom,
      scoreProvisional: sum(hours, x => x.status !== 'INCOMPLETE' ? x.matched : 0) / denom,
      scoreNaive: sum(hours, x => x.naive * x.load) / denom,
      grid: sum(hours, x => x.grid), surplusExcl: sum(hours, x => x.surplusExcl),
      incomplete: hours.filter(x => x.status === 'INCOMPLETE').length, provisional: hours.filter(x => x.status === 'PROVISIONAL').length,
      solar: sum(hours, x => x.solar), wind: sum(hours, x => x.wind), bessElig: sum(hours, x => x.bessElig), bessInelig: sum(hours, x => x.bessInelig), mkt: sum(hours, x => x.mkt),
      genS: sum(hours, x => x.genS), genW: sum(hours, x => x.genW),
      physicalMatched: sum(hours, x => x.matched), excludedMissing: sum(hours, x => x.status === 'INCOMPLETE' ? x.matched : 0), excludedPending: sum(hours, x => x.status === 'PROVISIONAL' ? x.matched : 0), nHours: hours.length,
      socStart, socEnd: soc, sumChgIn, sumDisOut, etaC, etaD
    };
    M.unresolved = M.incomplete + M.provisional;
    M.status = M.unresolved ? 'PROVISIONAL' : 'RECONCILED';
    return { blocks, hours, certs, M, cfg, events };
  }

  function scoreThrough(R, dayIdx, block, mode) {
    const lastH = dayIdx * 24 + Math.floor((block ?? 95) / 4);
    let n = 0, dn = 0;
    for (let H = 0; H <= lastH && H < R.hours.length; H++) { const o = R.hours[H]; dn += o.load; if (mode === 'estimate' || o.status === 'CLAIM_READY') n += o.matched; }
    return dn ? n / dn : 0;
  }
  const below = (R, tier) => R.hours.filter(h => h.cfe * 100 < tier).length;

  /* ---------- sizing: scale reference portfolio until target is met ---------- */
  const REF = { solar: 420, wind: 90, bessMW: 250, bessMWh: 1000, mkt: 20, loss: 0.035, tx: 1e9, rte: 0.88 };
  function portfolioFor(k, ls) { return { ...REF, solar: Math.round(REF.solar * k * ls / 5) * 5, wind: Math.round(REF.wind * k * ls / 5) * 5, bessMW: Math.round(REF.bessMW * k * ls / 5) * 5, bessMWh: Math.round(REF.bessMWh * k * ls / 25) * 25, mkt: Math.round(REF.mkt * ls / 5) * 5, loadScale: ls }; }
  function size(P, loadMW, shape, tierPct) {
    const ls = loadMW / 100;
    const scoreAt = k => run(P, { ...portfolioFor(k, ls), loadShape: shape }, []).M.scoreComplete;
    const target = tierPct / 100 + 0.004;
    let lo = 0.2, hi = 3.0;
    if (scoreAt(hi) < target) return { feasible: false, k: hi, cfg: { ...portfolioFor(hi, ls), loadShape: shape }, score: scoreAt(hi) };
    for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (scoreAt(m) >= target) hi = m; else lo = m; }
    const cfg = { ...portfolioFor(hi, ls), loadShape: shape };
    const R = run(P, cfg, []);
    return { feasible: true, k: hi, cfg, score: R.M.scoreComplete, R };
  }

  /* ---------- diagnostic: what the customer's current contracts match hourly ---------- */
  function diagnostic(P, loadMW, shape, current, sharePct) {
    const ls = loadMW / 100, share = (sharePct || 0) / 100;
    let L = 0, S = 0;
    const Ls = [], Ss = [];
    for (let i = 0; i < NB; i++) { const l = P.load[i] * ls * shapeMult(shape, (i % BPD) / 4 + 0.125); Ls.push(l); L += l; S += P.solar[i]; }
    let matched = 0, annual = 0;
    if (current === 'solar') { const cap = share * L / S; for (let i = 0; i < NB; i++) matched += Math.min(Ls[i], P.solar[i] * cap); annual = share; }
    else if (current === 'rtc') { for (let i = 0; i < NB; i++) matched += Math.min(Ls[i], share * L / NB); annual = share; }
    else { matched = 0; annual = 0; }
    const byHour = new Array(24).fill(0), loadHour = new Array(24).fill(0);
    if (current === 'solar') { const cap = share * L / S; for (let i = 0; i < NB; i++) { const h = Math.floor((i % BPD) / 4); byHour[h] += Math.min(Ls[i], P.solar[i] * cap); loadHour[h] += Ls[i]; } }
    else for (let i = 0; i < NB; i++) { const h = Math.floor((i % BPD) / 4); byHour[h] += current === 'rtc' ? Math.min(Ls[i], share * L / NB) : 0; loadHour[h] += Ls[i]; }
    return { annual, hourly: matched / L, profile: byHour.map((m, h) => m / loadHour[h]), loadMWh: L * DT };
  }

  function serviceCredit(score, tier, rule) {
    rule = rule || { perPoint: 2, cap: 10, base: 'monthly electricity bill' };
    const shortfall = Math.max(0, tier - score * 100);
    return { shortfallPts: shortfall, creditPct: Math.min(rule.cap, shortfall * rule.perPoint), rule, illustrative: true, binding: false };
  }

  function makeRegistry() {
    const owner = new Map();
    return { assign(serial, who) { if (owner.has(serial)) return { ok: false, reason: 'already cancelled to ' + owner.get(serial) }; owner.set(serial, who); return { ok: true }; } };
  }

  /* ---------- acceptance tests A–J ---------- */
  function tests(P, cfg) {
    const T = [], pct = x => (x * 100).toFixed(1) + '%';
    const W = (k, d0, d1, extra) => [{ k, from: d0 * BPD, to: d1 * BPD, ...extra }];
    const base = run(P, cfg, []);
    let eA = 0;
    base.blocks.forEach(x => { eA = Math.max(eA, Math.abs(x.solarDir + x.windDir + x.dis + x.mkt + x.gridToLoad - x.L), Math.abs(x.delivered - x.solarDir - x.windDir - x.chg - x.surplusExcl)); });
    T.push({ id: 'A', name: 'Energy balances in every 15-minute block', pass: eA < 1e-6, detail: NB.toLocaleString('en-IN') + ' blocks · max imbalance ' + eA.toExponential(1) + ' MW' });
    const B = base.M, exp = B.socStart + B.sumChgIn * B.etaC * DT - B.sumDisOut * DT / B.etaD, eB = Math.abs(exp - B.socEnd);
    const socOk = base.blocks.every(x => x.soc >= cfg.bessMWh * 0.1 - 1e-6 && x.soc <= cfg.bessMWh * 0.95 + 1e-6);
    T.push({ id: 'B', name: 'Battery energy conserved after round-trip losses', pass: eB < 1e-6 && socOk, detail: 'SoC within 10–95% · closing error ' + eB.toExponential(1) + ' MWh' });
    const reg = makeRegistry(); base.certs.forEach(c => reg.assign(c.serial, c.beneficiary));
    const dup = reg.assign(base.certs[0].serial, 'SIM-BUYER-OTHER');
    T.push({ id: 'C', name: 'The same certificate cannot be claimed twice', pass: !dup.ok, detail: base.certs[0].serial + ' re-assignment → rejected (' + dup.reason + ')' });
    let eD = 0; base.hours.forEach(o => { eD = Math.max(eD, Math.abs(o.matched - (o.load - o.grid - o.bessInelig))); });
    T.push({ id: 'D', name: 'Ordinary grid supply adds zero CFE', pass: eD < 1e-6, detail: 'matched = load − grid − untracked storage, all ' + base.hours.length + ' hours' });
    const e = run(P, cfg, [{ k: 'meterOutage', from: 13 * BPD + 8, to: 13 * BPD + 32 }]);
    const nE = e.hours.filter(x => x.status === 'INCOMPLETE').length;
    T.push({ id: 'E', name: 'Missing meter data is flagged, never counted as clean', pass: nE === 6 && e.M.scoreComplete < base.M.scoreComplete && e.M.status === 'PROVISIONAL', detail: nE + ' hours INCOMPLETE · month PROVISIONAL' });
    const f = run(P, cfg, W('solarDown', 0, 30, { factor: 0.6 }));
    T.push({ id: 'F', name: 'Solar −40% re-run lowers the score', pass: f.M.scoreComplete < base.M.scoreComplete, detail: pct(base.M.scoreComplete) + ' → ' + pct(f.M.scoreComplete) });
    const g = run(P, cfg, W('bessOut', 13, 16));
    const gOk = g.blocks.filter(x => x.ev).every(x => x.dis === 0 && Math.abs(x.solarDir + x.windDir + x.mkt + x.gridToLoad - x.L) < 1e-6);
    T.push({ id: 'G', name: 'Battery outage falls back to market, then grid', pass: gOk && g.M.grid > base.M.grid, detail: 'grid residual ' + Math.round(base.M.grid) + ' → ' + Math.round(g.M.grid) + ' MWh · load always served' });
    const hh = run(P, cfg, W('issuerOutage', 13, 16));
    T.push({ id: 'H', name: 'Late certificate issuance keeps the score provisional', pass: hh.M.provisional === 72 && hh.M.status === 'PROVISIONAL', detail: hh.M.provisional + ' hours pending · evidence-complete ' + pct(hh.M.scoreComplete) });
    const ci = checkAsset({ id: 'RJ-WND-07', state: 'Rajasthan', cod: 1, rights: 1, attrExclusive: 1, meter: 1, sched: 1 });
    T.push({ id: 'I', name: 'Out-of-boundary supply is rejected', pass: !ci.eligible, detail: 'RJ-WND-07 → ' + ci.reason });
    const sc = serviceCredit(0.85, 90);
    T.push({ id: 'J', name: 'Service credit is illustrative, never a signed liability', pass: sc.illustrative && !sc.binding, detail: 'binding = false · applies only to a verified month' });
    return T;
  }

  return { genProfiles, run, scoreThrough, below, size, diagnostic, portfolioFor, REF, checkAsset, CONTRACT, serviceCredit, tests, makeRegistry, DAYS, BPD, DT, NB, ENGINE_VERSION, DATA_VERSION };
})();
if (typeof module !== 'undefined') module.exports = SIM;

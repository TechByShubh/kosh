// Kosh website: the live adviser, the plan table, tilting phones, and the
// hold-to-install card. No framework; every number comes from the report.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // If the 3D hero fails anywhere, show the flat phones instead of a blank stage.
  addEventListener('error', (e) => { if (String(e.filename || '').includes('hero.js') || String(e.message || '').includes('WebGL')) document.documentElement.classList.add('no-webgl'); });
  const rs = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const ord = (d) => d + ((d % 100 >= 11 && d % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[d % 10] || 'th'));

  // ── entrances
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rise').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });

  // ── nav hides while reading down, returns going up
  let lastY = scrollY;
  addEventListener('scroll', () => { const y = scrollY; $('nav.top').classList.toggle('away', y > lastY && y > 300); lastY = y; }, { passive: true });

  // ── where the APK comes from. The public copy of this site (GitHub Pages)
  // has no server: config.js names the release download and the public QR.
  // On the stall's Kosh server, api/info answers and the local copy is used.
  const CFG = window.KOSH_STATIC || {};
  let apkUrl = CFG.apk || 'download/Kosh.apk', onServer = false;
  const showApk = (a) => {
    if (!a) { $('#cardMeta').textContent = 'Android'; return; }
    $('#cardMeta').textContent = `Android · version ${a.version} · ${(a.size / 1e6).toFixed(0)} MB`;
    $('#apkMeta').textContent = `Kosh ${a.version}, built ${a.built}. SHA-256 ${a.sha256}`;
  };
  $('#direct').href = apkUrl;
  // The main download is the arm64 build from a fast CDN; very old 32-bit
  // phones need the full build, which only GitHub carries.
  if (CFG.apkAll) { $('#allAbi').href = CFG.apkAll; $('#allAbi').hidden = false; }
  showApk(CFG.version ? { version: CFG.version, size: CFG.size, built: CFG.built, sha256: CFG.sha256 } : null);
  if (CFG.site) $('#siteAddr').textContent = CFG.site.replace(/^https?:\/\//, '').replace(/\/$/, '');
  fetch('api/info').then((r) => (r.ok ? r.json() : Promise.reject())).then((i) => {
    if (!i || !i.version && !i.apk && !i.urls) return;
    onServer = true; apkUrl = 'download/Kosh.apk'; $('#direct').href = apkUrl; $('#allAbi').hidden = true;
    if (i.admin) $('#adminLink').style.display = 'inline';
    if (i.apk) showApk(i.apk);
  }).catch(() => {});

  // ── tilting phones follow the pointer gently
  if (!still && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach((p) => {
      const wrap = p.parentElement;
      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        p.style.setProperty('--ry', (x * 26) + 'deg');
        p.style.setProperty('--rx', (-y * 14 + 4) + 'deg');
      });
      wrap.addEventListener('pointerleave', () => { p.style.removeProperty('--ry'); p.style.removeProperty('--rx'); });
    });
  }

  // ── the family plan (report §05)
  const plan = [
    ['Groceries', 15000, 9400], ['Education', 12000, 12000], ['Transportation', 6000, 3100],
    ['Utilities', 7000, 4800], ['Savings', 15000, 15000], ['Other expenses', 5000, 4650],
  ];
  const mf = 18 / 31;
  $('#planRows').innerHTML = plan.map(([c, b, s]) => {
    const f = s / b;
    let st = 'On track', warn = false;
    if (c === 'Savings') st = 'Moved to the saving wallet';
    else if (f >= .999) st = 'Fully used, as planned';
    else if (f >= .9) { st = 'Close to limit'; warn = true; }
    else if (f - mf > .2) { st = 'Ahead of pace'; warn = true; }
    return `<tr><td>${c}</td><td class="r">${rs(b)}</td><td class="r">${rs(s)}</td><td class="bar"><div class="ticks"><i class="${warn ? 'warn' : ''}" style="width:${Math.min(100, f * 100)}%"></i></div></td><td><span class="pill ${warn ? 'warn' : 'ok'}">${st}</span></td></tr>`;
  }).join('');

  // ── the adviser, the app's own rules
  const sB = $('#sB'), sS = $('#sS'), sD = $('#sD');
  const dim = 31;
  function advise() {
    const B = +sB.value, S = +sS.value, D = +sD.value;
    $('#vB').textContent = rs(B); $('#vS').textContent = rs(S); $('#vD').textContent = D;
    const rate = S / D, left = Math.max(0, B - S), daysLeft = dim - D;
    const pace = S / B - D / dim;
    let text;
    if (S >= B) text = `The entertainment budget is used up with ${daysLeft} days to go, ${rs(S - B)} over. Pausing spending here keeps the rest of the plan safe.`;
    else {
      const cross = Math.max(D + 1, Math.ceil(B / rate));
      if (rate > 0 && cross <= dim && pace > .15) {
        let safe = left / daysLeft, r5 = Math.round(safe / 5) * 5;
        const daily = safe < 1 ? 'Pausing spending here' : `Reducing to about ${rs(r5 === 0 ? Math.ceil(safe) : r5)} a day`;
        text = `At your current pace you will cross the entertainment budget around the ${ord(cross)}. ${daily} keeps you inside it.`;
      } else if (S / B >= .9) text = `${rs(left)} is left for the remaining ${daysLeft} days. One more outing would take it past the plan.`;
      else text = `You are on plan: ${Math.round(S / B * 100)}% used with ${Math.round(D / dim * 100)}% of the month gone. At this pace the month ends near ${rs(rate * dim)}.`;
    }
    $('#advice').textContent = text;
    $('#chips').innerHTML = [['Spent', rs(S)], ['Budget', rs(B)], ['Day', `${D} of ${dim}`], ['Pace', rs(rate) + '/day']].map(([k, v]) => `<span>${k}<b class="num">${v}</b></span>`).join('');
    // tick chart: spent so far in ink, the pace carried on dashed, red past the budget
    const W = 620, H = 150, ch = 126, step = W / dim, top = Math.max(rate * dim, B) * 1.08;
    const y = (v) => ch - v / top * ch;
    let out = '';
    for (let d = 0; d < dim; d++) {
      const x = step * (d + .5), cum = rate * (d + 1);
      const over = cum > B, col = over ? '#c4423b' : (d < D ? '#2b2a28' : '#8e8b86');
      if (d < D) out += `<line x1="${x}" x2="${x}" y1="${ch}" y2="${y(cum)}" stroke="${col}" stroke-width="${step * .4}"/>`;
      else out += `<line x1="${x}" x2="${x}" y1="${ch}" y2="${y(cum)}" stroke="${col}" stroke-opacity=".55" stroke-width="${step * .3}" stroke-dasharray="3 2"/>`;
    }
    out += `<line x1="0" x2="${W}" y1="${y(B)}" y2="${y(B)}" stroke="#47453f" stroke-width="1" stroke-dasharray="4 4"/>`;
    out += `<text x="0" y="${y(B) - 6}" font-size="12" font-family="Manrope" fill="#47453f">Budget ${rs(B)}</text>`;
    [1, 10, 20, 31].forEach((d) => { out += `<text x="${Math.min(W - 16, step * (d - .5))}" y="146" font-size="11" font-family="Manrope" fill="#6b6863" text-anchor="middle">${d}</text>`; });
    $('#pace').innerHTML = out;
  }
  [sB, sS, sD].forEach((s) => s.addEventListener('input', () => { if (+sS.value > +sB.value * 2) sS.value = sB.value * 2; advise(); }));
  advise();

  // ── the install card: hold to install
  const metal = $('#metal'), prog = $('#prog'), hint = $('#hint');
  const phone = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (phone) {
    $('#backTitle').textContent = isAndroid ? 'Downloading Kosh' : 'Kosh is for Android';
    $('#backText').textContent = isAndroid ? 'When it finishes, open the file to install. Then verify it at the stall.' : 'Open this page on an Android phone to install it.';
  }
  const zone = metal.parentElement;
  if (!still) {
    zone.addEventListener('pointermove', (e) => {
      if (metal.classList.contains('flipped')) return;
      const r = metal.getBoundingClientRect();
      metal.style.setProperty('--mx', Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
      metal.style.setProperty('--my', Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)));
    });
  }
  let t0 = 0, raf = 0;
  const HOLD = 1100, LEN = 176;
  function tick(now) {
    const f = Math.min(1, (now - t0) / HOLD);
    prog.style.strokeDashoffset = LEN * (1 - f);
    if (f >= 1) return done();
    raf = requestAnimationFrame(tick);
  }
  function start(e) {
    if (metal.classList.contains('flipped')) return;
    e.preventDefault();
    t0 = performance.now(); hint.textContent = 'Keep holding…';
    if (navigator.vibrate) navigator.vibrate(8);
    raf = requestAnimationFrame(tick);
  }
  function cancel() {
    if (!raf) return;
    cancelAnimationFrame(raf); raf = 0;
    prog.style.transition = 'stroke-dashoffset .4s'; prog.style.strokeDashoffset = LEN;
    setTimeout(() => (prog.style.transition = ''), 400);
    hint.textContent = 'Press and hold the card';
  }
  function done() {
    cancelAnimationFrame(raf); raf = 0;
    if (navigator.vibrate) navigator.vibrate([16, 40, 24]);
    metal.classList.add('flipped');
    hint.textContent = phone ? 'Your download has started' : 'Scan it with your phone';
    if (isAndroid) setTimeout(() => (location.href = apkUrl), 500);
    else if (!phone) $('#qr').src = onServer ? 'qr/install.svg?' + Date.now() : 'qr-site.svg';
  }
  metal.addEventListener('pointerdown', start);
  metal.addEventListener('contextmenu', (e) => e.preventDefault());
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => metal.addEventListener(ev, cancel));
  metal.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { t0 = performance.now(); raf = requestAnimationFrame(tick); e.preventDefault(); } });
  metal.addEventListener('keyup', cancel);
  $('#flipBack').addEventListener('click', (e) => {
    e.stopPropagation(); metal.classList.remove('flipped'); prog.style.strokeDashoffset = LEN; hint.textContent = 'Press and hold the card';
  });

  if (new URLSearchParams(location.search).get('get')) setTimeout(() => $('#install').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }), 300);
})();

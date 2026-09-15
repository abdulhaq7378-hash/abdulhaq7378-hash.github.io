/* Portfolio — interaction & motion layer.
   Everything degrades: without GSAP/Lenis the page is a plain, fully readable document. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ================= basics (no libraries needed) ================= */
  $('#year').textContent = new Date().getFullYear();

  var istFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  (function clocks() {
    var navClock = $('#clock'), place = $('#placeTime');
    function tick() {
      var t = istFmt.format(new Date());
      if (navClock) navClock.textContent = 'Manipal · ' + t + ' IST';
      if (place) place.textContent = t;
    }
    tick(); setInterval(tick, 15000);
  })();

  var rxDate = $('#rxDate');
  if (rxDate) rxDate.textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  // toast + copy email
  var toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl);
  var toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800); }
  var copyBtn = $('#copyMail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var mail = 'abdulhaq7378@gmail.com';
    if (navigator.clipboard) navigator.clipboard.writeText(mail).then(function () { toast('Email copied'); }, function () { toast(mail); });
    else toast(mail);
  });

  // lightbox for any [data-lb]
  var lb = $('#lb'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbDoc = $('#lbDoc'), lbVerify = $('#lbVerify');
  $$('[data-lb]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (!lb || typeof lb.showModal !== 'function') { window.open(el.dataset.doc, '_blank'); return; }
      lbImg.src = el.dataset.img; lbImg.alt = el.dataset.title;
      lbTitle.textContent = el.dataset.title; lbDoc.href = el.dataset.doc;
      if (el.dataset.verify) { lbVerify.href = el.dataset.verify; lbVerify.hidden = false; } else lbVerify.hidden = true;
      lb.showModal();
    });
  });
  if (lb) {
    $('#lbClose').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { lbImg.src = ''; });
  }

  // custom cursor
  var cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  if (fine && cursor && !reduce) {
    document.body.classList.add('has-cursor');
    var cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy;
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor);
    cursor.style.opacity = 0;
    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; dot.style.left = cx + 'px'; dot.style.top = cy + 'px'; cursor.style.opacity = 1; }, { passive: true });
    (function loop() { rx += (cx - rx) * .18; ry += (cy - ry) * .18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; cursorLabel.style.left = rx + 'px'; cursorLabel.style.top = ry + 'px'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a, button, [data-cursor]');
      var labelled = e.target.closest('[data-cursor]');
      cursor.classList.toggle('is-link', !!t && !labelled);
      cursor.classList.toggle('is-label', !!labelled);
      if (labelled) cursorLabel.textContent = labelled.dataset.cursor;
    });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = 1; });
  }

  // nav: hide on scroll down, solid after top
  var nav = $('#nav'), lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > 160 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  // device mockups: gentle 3D tilt
  if (fine && !reduce) $$('[data-tilt]').forEach(function (stage) {
    var rig = $('.stage__rig', stage);
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      rig.style.transform = 'rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 6) + 'deg)';
    });
    stage.addEventListener('mouseleave', function () { rig.style.transform = ''; });
  });

  // prescription handwriting: reveal once in view
  var rxCard = $('#rx');
  if (rxCard && 'IntersectionObserver' in window && !reduce) {
    $$('[data-ink]', rxCard).forEach(function (el, i) { el.style.animationDelay = (.1 + i * .18) + 's'; });
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { rxCard.classList.add('is-in'); o.disconnect(); } }); }, { threshold: .15 }).observe(rxCard);
  }

  /* ================= GuardianBand exploded view (SVG built once) ================= */
  var gbx = (function buildExploded() {
    var svg = $('#gbxSvg'); if (!svg) return null;
    var CX = 250;
    function el(tag, attrs, parent) { var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
    function iso(cy, w, u, v) { var h = w * .42; return [CX + (u - v) * w / 2, cy + (u + v) * h / 2]; }
    function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
    function rectTop(g, cy, w, u0, v0, u1, v1, fill, stroke) {
      el('polygon', { points: pts([iso(cy, w, u0, v0), iso(cy, w, u1, v0), iso(cy, w, u1, v1), iso(cy, w, u0, v1)]), fill: fill, stroke: stroke || 'none', 'stroke-width': 1 }, g);
    }
    function circTop(g, cy, w, u, v, r, fill, stroke) {
      var a = []; for (var i = 0; i < 28; i++) { var t = i / 28 * Math.PI * 2; a.push(iso(cy, w, u + Math.cos(t) * r, v + Math.sin(t) * r)); }
      return el('polygon', { points: pts(a), fill: fill, stroke: stroke || 'none', 'stroke-width': 1.2 }, g);
    }
    function slab(g, cy, w, t, top, left, right, u0, v0, u1, v1) {
      u0 = u0 == null ? -1 : u0; v0 = v0 == null ? -1 : v0; u1 = u1 == null ? 1 : u1; v1 = v1 == null ? 1 : v1;
      var A = iso(cy, w, u0, v0), B = iso(cy, w, u1, v0), C = iso(cy, w, u1, v1), D = iso(cy, w, u0, v1);
      var s = '#e9e6df', sw = 1.1;
      el('polygon', { points: pts([D, C, [C[0], C[1] + t], [D[0], D[1] + t]]), fill: left, stroke: s, 'stroke-width': sw }, g);
      el('polygon', { points: pts([C, B, [B[0], B[1] + t], [C[0], C[1] + t]]), fill: right, stroke: s, 'stroke-width': sw }, g);
      el('polygon', { points: pts([A, B, C, D]), fill: top, stroke: s, 'stroke-width': sw }, g);
      return B; // right-most corner, used for the callout
    }
    var layers = [
      { cy: 64, name: 'Strap', draw: function (g, cy) { return slab(g, cy, 118, 6, '#2b3237', '#1e2428', '#171c20', -2.3, -.3, 2.3, .3); } },
      { cy: 160, name: 'Top cover', draw: function (g, cy) {
        var c = slab(g, cy, 132, 16, '#1b2226', '#12171a', '#0d1113');
        circTop(g, cy, 132, .45, -.42, .17, '#8fd9a8', '#e9e6df');
        circTop(g, cy, 132, .45, -.02, .09, '#ff5a3c');
        rectTop(g, cy, 132, .75, .45, .95, .85, '#3a4348', '#e9e6df');
        for (var i = 0; i < 5; i++) circTop(g, cy, 132, -.62 + i * .14, .52, .035, '#05070a');
        return c; } },
      { cy: 246, name: 'Buzzer', draw: function (g, cy) {
        var w = 70;
        var top = [], bot = [], i, t;
        for (i = 0; i < 28; i++) { t = i / 28 * Math.PI * 2; top.push(iso(cy, w, Math.cos(t) * .55, Math.sin(t) * .55)); bot.push(iso(cy + 22, w, Math.cos(t) * .55, Math.sin(t) * .55)); }
        var xs = top.map(function (p) { return p[0]; }), minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
        el('polygon', { points: pts(bot), fill: '#07090b', stroke: '#e9e6df', 'stroke-width': 1.1 }, g);
        el('rect', { x: minX, y: cy, width: maxX - minX, height: 22, fill: '#0b0e10' }, g);
        el('path', { d: 'M' + minX + ' ' + cy + 'V' + (cy + 22) + 'M' + maxX + ' ' + cy + 'V' + (cy + 22), stroke: '#e9e6df', 'stroke-width': 1.1 }, g);
        el('polygon', { points: pts(top), fill: '#12171a', stroke: '#e9e6df', 'stroke-width': 1.1 }, g);
        circTop(g, cy, w, 0, 0, .14, '#05070a', 'rgba(255,90,60,.8)');
        return [maxX, cy + 4]; } },
      { cy: 318, name: 'MPU-6050', draw: function (g, cy) {
        var c = slab(g, cy, 62, 5, '#24295a', '#191d3f', '#12152e');
        rectTop(g, cy, 62, -.38, -.38, .38, .38, '#0a0a0d', 'rgba(233,230,223,.4)');
        for (var i = 0; i < 6; i++) circTop(g, cy, 62, -.75 + i * .3, .82, .06, '#c9a24a');
        return c; } },
      { cy: 398, name: 'SIM900A', draw: function (g, cy) {
        var c = slab(g, cy, 112, 7, '#113a2b', '#0b2b1f', '#082118');
        rectTop(g, cy, 112, -.75, -.6, -.1, .12, '#c9cdd1', '#e9e6df');
        rectTop(g, cy, 112, .18, -.55, .72, -.02, '#0a0a0d');
        var a = iso(cy, 112, .82, .78); el('path', { d: 'M' + a[0] + ' ' + a[1] + 'v-46', stroke: '#e9e6df', 'stroke-width': 2 }, g);
        el('circle', { cx: a[0], cy: a[1] - 48, r: 3, fill: '#ff5a3c' }, g);
        return c; } },
      { cy: 486, name: 'Arduino UNO', draw: function (g, cy) {
        var c = slab(g, cy, 146, 8, '#0f4b5d', '#0a3745', '#072b36');
        rectTop(g, cy, 146, -.9, -.92, .9, -.78, '#0a0a0d');
        rectTop(g, cy, 146, -.9, .78, .9, .92, '#0a0a0d');
        rectTop(g, cy, 146, -.15, -.25, .5, .22, '#0a0a0d', 'rgba(233,230,223,.35)');
        rectTop(g, cy, 146, -1, -.35, -.72, .12, '#b8bdc2');
        rectTop(g, cy, 146, -1, .38, -.78, .66, '#0a0a0d');
        return c; } },
      { cy: 580, name: 'Base shell', draw: function (g, cy) {
        var c = slab(g, cy, 156, 26, '#151b1f', '#0f1417', '#0b0f12');
        rectTop(g, cy, 156, -.84, -.84, .84, .84, '#090c0e', 'rgba(233,230,223,.25)');
        return c; } }
    ];
    var LABELS = ['Strap', 'Top cover', 'Buzzer', 'MPU-6050', 'SIM900A GSM', 'Arduino UNO', 'Base shell'];
    var NUMS = ['06', '01', '02', '03', '04', '05', '06'];
    var groups = [], callouts = [];
    var collapsedTop = 290;
    layers.forEach(function (L, i) {
      // insert each layer beneath the previous one so upper parts paint over lower parts
      var g = el('g', { class: 'gl' });
      svg.insertBefore(g, svg.firstChild);
      var corner = L.draw(g, L.cy);
      var co = el('g', { class: 'callout' }, g);
      el('circle', { cx: corner[0], cy: corner[1], r: 2.5, fill: '#ff5a3c' }, co);
      el('path', { d: 'M' + corner[0] + ' ' + corner[1] + 'H520', stroke: 'rgba(255,90,60,.55)', 'stroke-width': 1 }, co);
      var tx = el('text', { x: 528, y: corner[1] + 4, class: 'cl' }, co);
      var n = el('tspan', { class: 'n' }, tx); n.textContent = NUMS[i] + '  ';
      var nm = el('tspan', {}, tx); nm.textContent = LABELS[i];
      groups.push({ g: g, dy: (collapsedTop + i * 16) - L.cy });
      callouts.push(co);
    });
    var bom = $$('#bom li');
    var bomFor = [5, 0, 1, 2, 3, 4, 5]; // layer index -> BOM row
    function set(e) {
      groups.forEach(function (o, i) { o.g.setAttribute('transform', 'translate(0 ' + (o.dy * (1 - e)).toFixed(1) + ')'); });
      var lit = {};
      callouts.forEach(function (co, i) {
        var a = clamp((e - .25 - i * .09) / .12, 0, 1);
        co.setAttribute('opacity', a.toFixed(2));
        if (a > .5) lit[bomFor[i]] = true;
      });
      bom.forEach(function (li, i) { li.classList.toggle('on', !!lit[i]); });
    }
    set(1);
    return { set: set };
  })();

  /* ================= no motion library → plain page ================= */
  if (!hasGsap) { document.body.classList.add('is-ready'); return; }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var target = $(id); if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 }); else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  function split(el) {
    if (el.dataset.done) return $$('.ch', el);
    var text = el.textContent; el.textContent = ''; el.dataset.done = '1';
    // wrap characters in word groups so lines only break between words
    text.split(' ').forEach(function (word, wi, all) {
      var w = document.createElement('span'); w.className = 'wd';
      word.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); });
      el.appendChild(w);
      if (wi < all.length - 1) { var sp = document.createElement('span'); sp.className = 'ch sp'; sp.textContent = ' '; el.appendChild(sp); }
    });
    return $$('.ch', el);
  }

  /* ---------------- boot sequence (unchanged) ---------------- */
  var heroChars = [];
  $$('[data-split]').forEach(function (el) { heroChars = heroChars.concat(split(el)); });
  var heroBits = $$('[data-hero]');
  var seen = false; try { seen = sessionStorage.getItem('mah-seen') === '1'; } catch (e) {}

  function heroIn() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo(heroChars, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: { each: .028, from: 'start' } }, 0)
      .fromTo(heroBits, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .12 }, .5)
      .fromTo('.ticker', { opacity: 0 }, { opacity: 1, duration: .8 }, .9)
      .fromTo('.nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .9 }, .6);
    return tl;
  }

  if (reduce) {
    document.body.classList.add('is-ready');
  } else {
    document.body.classList.add('is-booting');
    if (lenis) lenis.stop();
    gsap.set(heroChars, { yPercent: 110 }); gsap.set(heroBits, { opacity: 0 }); gsap.set('.ticker', { opacity: 0 }); gsap.set('.nav', { opacity: 0 });
    var num = { v: 0 }, numEl = $('#ldNum'), labelEl = $('#ldLabel');
    var boot = gsap.timeline({
      onComplete: function () {
        document.body.classList.remove('is-booting'); document.body.classList.add('is-ready');
        if (lenis) lenis.start();
        try { sessionStorage.setItem('mah-seen', '1'); } catch (e) {}
        ScrollTrigger.refresh();
      }
    });
    var dur = seen ? .55 : 1.5;
    boot.to(num, { v: 100, duration: dur, ease: 'power3.inOut', onUpdate: function () { numEl.textContent = String(Math.round(num.v)).padStart(3, '0'); } })
      .to('#ldScan', { opacity: 1, top: '100%', duration: dur, ease: 'power2.inOut' }, 0);
    if (!seen) boot.call(function () { labelEl.textContent = 'Shimming'; }, null, .6).call(function () { labelEl.textContent = 'Ready'; }, null, 1.3);
    boot.to('.loader__ui', { opacity: 0, duration: .3 }, '>-.1')
      .to('.loader__panel--top', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .to('.loader__panel--bot', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .add(heroIn(), '<+.35');
  }

  var ticker = $('#ticker'); if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* ---------------- nav active state ---------------- */
  var navLinks = $$('.nav__links a');
  navLinks.forEach(function (a) {
    var sec = $(a.getAttribute('href')); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: function (st) { if (st.isActive) { navLinks.forEach(function (l) { l.classList.remove('is-active'); }); a.classList.add('is-active'); } } });
  });

  /* ---------------- profile: statement word by word ---------------- */
  var statement = $('[data-words]');
  if (statement) {
    statement.innerHTML = statement.innerHTML.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var words = $$('.w', statement);
    if (!reduce) ScrollTrigger.create({ trigger: statement, start: 'top 78%', end: 'bottom 50%', scrub: true, onUpdate: function (st) {
      var n = Math.round(st.progress * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    } });
    else words.forEach(function (w) { w.classList.add('on'); });
  }

  /* ---------------- counters + rings (bento score, gauges) ---------------- */
  $$('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, o = { v: 0 };
    if (reduce) return;
    el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    } });
  });
  $$('[data-ring]').forEach(function (el) {
    var end = +el.dataset.ring, o = { v: 0 };
    if (reduce) { el.style.strokeDasharray = end + ' 100'; return; }
    el.style.strokeDasharray = '0 100';
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.style.strokeDasharray = o.v.toFixed(2) + ' 100'; } });
    } });
  });

  /* ---------------- generic reveal ---------------- */
  if (!reduce) $$('[data-reveal], .yr').forEach(function (el, i) {
    gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* ---------------- timeline progress ---------------- */
  var tlFill = $('.tl__fill');
  if (tlFill && !reduce) {
    gsap.fromTo(tlFill, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 80%', end: 'top 35%', scrub: .6 } });
    gsap.fromTo('.tl__now, .tl__span, .tl__dot', { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2)', stagger: .12, scrollTrigger: { trigger: '.tl', start: 'top 45%', once: true } });
  }

  /* ---------------- contact headline ---------------- */
  var cChars = []; $$('[data-split-scroll]').forEach(function (el) { cChars = cChars.concat(split(el)); });
  if (cChars.length && !reduce) gsap.fromTo(cChars, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .02, scrollTrigger: { trigger: '.contact__title', start: 'top 80%', once: true } });

  if (fine && !reduce) $$('[data-magnet]').forEach(function (b) {
    var xTo = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
    b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * .35); yTo((e.clientY - (r.top + r.height / 2)) * .35); });
    b.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
  });

  var mm = gsap.matchMedia();

  /* ---------------- internship: note deck + scanner phases ---------------- */
  var deck = $('#deck'), notes = $$('.note', deck), prog = $$('.deck__prog i'), mri = $('#mri');
  var draws = $$('.draw', mri), chips = $$('.wfchips li');
  function internUpdate(p) {
    var P = Math.min(p * 4.15, 3.9999), seg = Math.floor(P), local = P - seg;
    var f = seg + (seg < 3 ? smooth(.7, 1, local) : 0);
    notes.forEach(function (n, i) {
      var d = i - f, y, s, o;
      if (d < 0) { y = d * 90; s = 1 + d * .05; o = clamp(1 + d * 1.7, 0, 1); }
      else { y = d * 15; s = 1 - d * .045; o = d > 2.7 ? 0 : 1 - d * .24; }
      n.style.transform = 'translateY(' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      n.style.opacity = o.toFixed(3);
      n.style.zIndex = String(20 - Math.round(Math.abs(d) * 4));
      n.classList.toggle('is-open', Math.abs(d) < .5);
    });
    var phase = Math.round(f);
    prog.forEach(function (b, i) { b.classList.toggle('on', i <= phase); });
    mri.dataset.phase = phase;
    var dp = seg === 0 ? clamp(local / .55, 0, 1) : 1;
    draws.forEach(function (d, i) { d.style.strokeDashoffset = (1 - clamp(dp * draws.length - i, 0, 1)).toFixed(3); });
    var ci = seg === 1 ? Math.floor(clamp(local / .7, 0, .999) * chips.length) : (seg > 1 ? chips.length - 1 : -1);
    chips.forEach(function (c, i) { c.classList.toggle('on', i <= ci); });
  }
  if (deck && mri && !reduce) {
    mm.add('(min-width: 901px)', function () {
      deck.classList.add('is-live');
      internUpdate(0);
      ScrollTrigger.create({ trigger: '#internStage', start: 'top top', end: '+=340%', pin: true, scrub: .5, onUpdate: function (st) { internUpdate(st.progress); } });
      return function () {
        deck.classList.remove('is-live');
        notes.forEach(function (n) { n.style.transform = ''; n.style.opacity = ''; n.style.zIndex = ''; n.classList.remove('is-open'); });
        draws.forEach(function (d) { d.style.strokeDashoffset = ''; });
        mri.dataset.phase = '0';
      };
    });
  }

  /* ---------------- guardianband: exploded assembly ---------------- */
  if (gbx && !reduce) {
    mm.add('(min-width: 901px)', function () {
      gbx.set(0);
      ScrollTrigger.create({ trigger: '#gbx', start: 'top top', end: '+=170%', pin: true, scrub: .6, onUpdate: function (st) {
        gbx.set(smooth(0, 1, clamp((st.progress - .06) / .78, 0, 1)));
      } });
      return function () { gbx.set(1); };
    });
    mm.add('(max-width: 900px)', function () {
      gbx.set(.2);
      ScrollTrigger.create({ trigger: '#gbxSvg', start: 'top 85%', end: 'bottom 45%', scrub: .6, onUpdate: function (st) { gbx.set(.2 + .8 * st.progress); } });
      return function () { gbx.set(1); };
    });
  }

  /* ---------------- guardianband: sideways story ---------------- */
  var pin = $('#hzPin'), track = $('#hzTrack');
  if (pin && track && !reduce) {
    mm.add('(min-width: 901px)', function () {
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$('.hz__p', track).forEach(function (p, i) {
        if (!i) return;
        gsap.fromTo(p.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 96%', once: true } });
      });
      return function () { gsap.set(track, { clearProps: 'transform' }); };
    });
  }

  /* ---------------- guardianband: device states ---------------- */
  var gbs = $('#gbs'), stateItems = $$('#states li'), bandWord = $('#bandWord');
  var WORDS = ['Armed', 'Checking', 'Warning', 'Alert sent'];
  function setState(s) {
    if (gbs.dataset.state === String(s)) return;
    gbs.dataset.state = s;
    stateItems.forEach(function (li, i) { li.classList.toggle('on', i === s); });
    if (bandWord) bandWord.textContent = WORDS[s];
  }
  if (gbs && !reduce) {
    mm.add('(min-width: 901px)', function () {
      ScrollTrigger.create({ trigger: gbs, start: 'top top', end: '+=260%', pin: true, onUpdate: function (st) { setState(Math.min(3, Math.floor(st.progress * 4.1))); } });
      return function () { setState(0); };
    });
    mm.add('(max-width: 900px)', function () {
      stateItems.forEach(function (li, i) {
        ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'bottom 60%', onToggle: function (st) { if (st.isActive) setState(i); } });
      });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

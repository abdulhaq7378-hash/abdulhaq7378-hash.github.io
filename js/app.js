/* Portfolio — interaction & motion layer.
   Everything degrades: without GSAP/Lenis the page is a plain, fully readable document. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------------- basics that never depend on libraries ---------------- */
  $('#year').textContent = new Date().getFullYear();

  // Manipal clock (IST)
  (function clock() {
    var el = $('#clock'); if (!el) return;
    var fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
    function tick() { el.textContent = 'Manipal · ' + fmt.format(new Date()) + ' IST'; }
    tick(); setInterval(tick, 15000);
  })();

  // toast
  var toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl);
  var toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800); }
  var copyBtn = $('#copyMail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var mail = 'abdulhaq7378@gmail.com';
    if (navigator.clipboard) navigator.clipboard.writeText(mail).then(function () { toast('Email copied'); }, function () { toast(mail); });
    else toast(mail);
  });

  // credentials: lightbox + hover preview
  var lb = $('#lb'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbDoc = $('#lbDoc'), lbVerify = $('#lbVerify');
  var preview = $('#preview'), previewImg = $('#previewImg');
  $$('.ledger__row').forEach(function (row) {
    row.setAttribute('tabindex', '0'); row.setAttribute('role', 'button');
    function open() {
      lbImg.src = row.dataset.preview; lbImg.alt = row.dataset.title;
      lbTitle.textContent = row.dataset.title; lbDoc.href = row.dataset.doc;
      if (row.dataset.verify) { lbVerify.href = row.dataset.verify; lbVerify.hidden = false; } else lbVerify.hidden = true;
      if (typeof lb.showModal === 'function') lb.showModal(); else window.open(row.dataset.doc, '_blank');
    }
    row.addEventListener('click', open);
    row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    if (fine && preview) {
      row.addEventListener('mouseenter', function () { previewImg.src = row.dataset.preview; preview.classList.add('is-on'); });
      row.addEventListener('mouseleave', function () { preview.classList.remove('is-on'); });
    }
  });
  if (lb) {
    $('#lbClose').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { lbImg.src = ''; });
  }
  if (fine && preview) {
    var px = 0, py = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function (e) { tx = e.clientX + 40; ty = e.clientY; }, { passive: true });
    (function follow() { px += (tx - px) * .12; py += (ty - py) * .12; preview.style.left = (px + 170) + 'px'; preview.style.top = py + 'px'; requestAnimationFrame(follow); })();
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
      var t = e.target.closest('a, button, .ledger__row, [data-cursor]');
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

  /* ---------------- no motion library → plain page ---------------- */
  if (!hasGsap) { document.body.classList.add('is-ready'); return; }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  // smooth scroll
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

  // split text into characters
  function split(el) {
    if (el.dataset.done) return $$('.ch', el);
    var text = el.textContent; el.textContent = ''; el.dataset.done = '1';
    text.split('').forEach(function (c) {
      var s = document.createElement('span'); s.className = 'ch' + (c === ' ' ? ' sp' : ''); s.textContent = c === ' ' ? ' ' : c; el.appendChild(s);
    });
    return $$('.ch', el);
  }

  /* ---------------- boot sequence ---------------- */
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

  /* ---------------- ticker: duplicate for seamless loop ---------------- */
  var ticker = $('#ticker'); if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* ---------------- nav active state ---------------- */
  var navLinks = $$('.nav__links a');
  navLinks.forEach(function (a) {
    var sec = $(a.getAttribute('href')); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: function (st) { if (st.isActive) { navLinks.forEach(function (l) { l.classList.remove('is-active'); }); a.classList.add('is-active'); } } });
  });

  /* ---------------- statement: word by word ---------------- */
  var statement = $('[data-words]');
  if (statement) {
    var html = statement.innerHTML.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    statement.innerHTML = html;
    var words = $$('.w', statement);
    if (!reduce) ScrollTrigger.create({ trigger: statement, start: 'top 78%', end: 'bottom 50%', scrub: true, onUpdate: function (st) {
      var n = Math.round(st.progress * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    } });
    else words.forEach(function (w) { w.classList.add('on'); });
  }

  /* ---------------- counters ---------------- */
  $$('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: reduce ? 0 : 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    } });
  });

  /* ---------------- generic reveal ---------------- */
  if (!reduce) $$('[data-reveal]').forEach(function (el) {
    gsap.fromTo(el, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* ---------------- contact headline ---------------- */
  var cChars = []; $$('[data-split-scroll]').forEach(function (el) { cChars = cChars.concat(split(el)); });
  if (cChars.length && !reduce) gsap.fromTo(cChars, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .02, scrollTrigger: { trigger: '.contact__title', start: 'top 80%', once: true } });

  /* ---------------- magnetic buttons ---------------- */
  if (fine && !reduce) $$('[data-magnet]').forEach(function (b) {
    var xTo = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
    b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * .35); yTo((e.clientY - (r.top + r.height / 2)) * .35); });
    b.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
  });

  /* ---------------- work: image parallax ---------------- */
  if (!reduce) $$('.work__media img').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -14 }, { yPercent: -2, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------------- imaging: scanner drawn on scroll ---------------- */
  var stage = $('#scanStage');
  if (stage) {
    var groups = {}; $$('.s-draw', stage).forEach(function (g) { groups[g.dataset.ph] = $$('path, circle, rect', g); });
    var leads = {}; $$('.s-lead path', stage).forEach(function (p) { leads[p.dataset.ph] = p; });
    var labels = $$('#scanLabels li'), steps = $$('#scanSteps li'), phaseEl = $('#scanPhase');
    var hi = $$('.s-hi', stage);
    var order = ['0', '1', '2', '3', '4', '5'];
    var spans = { '0': [0, .14], '1': [.14, .24], '2': [.24, .4], '3': [.4, .55], '4': [.55, .68], '5': [.68, .82] };
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    order.forEach(function (ph) {
      var s = spans[ph];
      tl.to(groups[ph], { strokeDashoffset: 0, duration: s[1] - s[0], stagger: { each: .02 } }, s[0]);
      if (leads[ph]) tl.to(leads[ph], { strokeDashoffset: 0, duration: .05 }, s[1] - .04);
    });
    tl.to(hi, { opacity: 1, duration: .08 }, .5);
    tl.to({}, { duration: .18 }, .82); // hold
    function update(p) {
      labels.forEach(function (l) { var s = spans[l.dataset.ph]; l.classList.toggle('on', p > s[1] - .03); });
      var stepIdx = p < .55 ? 0 : p < .72 ? 1 : p < .86 ? 2 : 3;
      steps.forEach(function (s, i) { s.classList.toggle('on', i === stepIdx); });
      var phIdx = 1; order.forEach(function (ph, i) { if (p > spans[ph][0]) phIdx = i + 1; });
      phaseEl.textContent = '/ 0' + Math.min(5, phIdx);
    }
    if (reduce) { tl.progress(1); update(1); }
    else {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', function () {
        ScrollTrigger.create({ trigger: stage, start: 'top top', end: '+=230%', pin: true, scrub: .6, animation: tl, onUpdate: function (st) { update(st.progress); } });
      });
      mm.add('(max-width: 900px)', function () {
        ScrollTrigger.create({ trigger: $('.scan__fig'), start: 'top 85%', end: 'bottom 35%', scrub: .6, animation: tl, onUpdate: function (st) { update(st.progress); } });
      });
    }
  }

  /* ---------------- guardianband: horizontal scroll ---------------- */
  var pin = $('#hzPin'), track = $('#hzTrack');
  if (pin && track && !reduce) {
    gsap.matchMedia().add('(min-width: 901px)', function () {
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
      // panel content drifts in as it arrives
      $$('.hz__p', track).forEach(function (p, i) {
        if (!i) return;
        gsap.fromTo(p.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 80%', once: true } });
      });
      return function () { gsap.set(track, { clearProps: 'transform' }); };
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

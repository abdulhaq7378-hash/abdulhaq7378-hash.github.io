/* Portfolio interactions: scope trace, nav state, reveal-on-scroll. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- Oscilloscope: simulated |a| from an IMU ----------------
     Walking → free-fall dip → impact spike → stillness → alert → recovery.
     Purely illustrative of the GuardianBand detection logic. */
  var canvas = document.getElementById('scope');
  var stateEl = document.getElementById('scopeState');
  var clockEl = document.getElementById('scopeClock');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W, H, dpr;
    var FS = 60;            // samples per second
    var WINDOW = 6;         // seconds visible
    var N = FS * WINDOW;
    var CYCLE = 11;         // seconds per scripted scenario
    var G_MAX = 3.5;
    var FREEFALL = 0.4, IMPACT = 2.5;
    var buf = [];
    var t = 0;

    var css = getComputedStyle(document.documentElement);
    var ACCENT = css.getPropertyValue('--accent').trim() || '#ff6a3d';

    function noise() { return (Math.random() - 0.5); }

    function signal(time) {
      var s = time % CYCLE;
      var walk = 1 + 0.28 * Math.sin(time * 2 * Math.PI * 1.8) + 0.08 * Math.sin(time * 2 * Math.PI * 3.6) + 0.05 * noise();
      if (s < 5.2) return walk;
      if (s < 5.55) return 1 - (s - 5.2) / 0.35 * 0.85 + 0.03 * noise();            // free fall
      if (s < 5.7) return 0.15 + Math.sin((s - 5.55) / 0.15 * Math.PI) * 3.0;         // impact
      if (s < 6.1) return 1 + 0.5 * Math.sin((s - 5.7) * 30) * Math.exp(-(s - 5.7) * 9) + 0.03 * noise();
      if (s < 9.4) return 1 + 0.015 * noise();                                         // lying still
      var k = Math.min(1, (s - 9.4) / 0.8);
      return 1 + k * (walk - 1);                                                        // recovery
    }

    function phase(time) {
      var s = time % CYCLE;
      if (s >= 5.6 && s < 7.4) return 'IMPACT · CHECKING POSTURE';
      if (s >= 7.4 && s < 9.4) return 'INACTIVE · ALERT SENT';
      return 'MONITORING';
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.width * 300 / 640));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function y(g) { var pad = 18; return H - pad - (g / G_MAX) * (H - pad * 2); }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // graticule
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(236,233,226,0.06)';
      for (var gx = 0; gx <= 10; gx++) { var xx = Math.round(gx * W / 10) + 0.5; ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, H); ctx.stroke(); }
      for (var gy = 0; gy <= G_MAX; gy += 0.5) { var yy = Math.round(y(gy)) + 0.5; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }

      // thresholds
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = 'rgba(255,106,61,0.45)';
      [FREEFALL, IMPACT].forEach(function (g) { var ty = Math.round(y(g)) + 0.5; ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.font = '10px "Geist Mono", ui-monospace, monospace';
      [['IMPACT 2.5 g', y(IMPACT) - 16], ['FREE-FALL 0.4 g', y(FREEFALL) + 6]].forEach(function (l) {
        var tw = ctx.measureText(l[0]).width;
        ctx.fillStyle = 'rgba(17,19,19,0.9)';
        ctx.fillRect(6, l[1], tw + 8, 14);
        ctx.fillStyle = 'rgba(236,233,226,0.5)';
        ctx.fillText(l[0], 10, l[1] + 10);
      });

      // trace
      if (buf.length > 1) {
        var step = W / (N - 1);
        var offset = N - buf.length;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        for (var i = 0; i < buf.length; i++) {
          var px = (offset + i) * step, py = y(buf[i].g);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = 'rgba(236,233,226,0.85)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // highlight samples that crossed a threshold
        ctx.fillStyle = ACCENT;
        for (var j = 0; j < buf.length; j++) {
          if (buf[j].g > IMPACT || buf[j].g < FREEFALL) {
            ctx.beginPath(); ctx.arc((offset + j) * step, y(buf[j].g), 2, 0, Math.PI * 2); ctx.fill();
          }
        }

        // head
        var last = buf[buf.length - 1];
        var hx = (offset + buf.length - 1) * step, hy = y(last.g);
        ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#ecE9e2'; ctx.fill();
      }
    }

    function tick() {
      var g = signal(t);
      buf.push({ g: g });
      if (buf.length > N) buf.shift();
      t += 1 / FS;
    }

    function updateLabels() {
      var p = phase(t);
      stateEl.textContent = p;
      stateEl.classList.toggle('is-alert', p !== 'MONITORING');
      clockEl.textContent = 't = ' + t.toFixed(2) + ' s';
    }

    resize();
    window.addEventListener('resize', function () { resize(); draw(); });

    if (reduceMotion) {
      // static frame showing a full event
      t = 1.2;
      for (var k = 0; k < N; k++) tick();
      stateEl.textContent = 'IMPACT · CHECKING POSTURE';
      stateEl.classList.add('is-alert');
      clockEl.textContent = 'static frame';
      draw();
    } else {
      for (var m = 0; m < N; m++) tick();
      var last = performance.now(), acc = 0, visible = true;
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }) : null;
      if (io) io.observe(canvas);
      (function loop(now) {
        acc += Math.min(0.1, (now - last) / 1000);
        last = now;
        if (visible) {
          while (acc >= 1 / FS) { tick(); acc -= 1 / FS; }
          draw();
          updateLabels();
        } else {
          acc = 0;
        }
        requestAnimationFrame(loop);
      })(last);
    }
  }

  /* ---------------- top bar border + active section ---------------- */
  var topbar = document.querySelector('.topbar');
  function onScroll() { topbar.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) sectionObs.observe(s); });

    /* ---------------- reveal ---------------- */
    if (!reduceMotion) {
      var targets = document.querySelectorAll('.section__head, .split__body > *, .case, .card, .cred, .contact .wrap > *, .facts');
      var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); revealObs.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('reveal'); revealObs.observe(el); });
    }
  }
})();

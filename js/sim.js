/* GuardianBand detection simulation: a scripted |a| trace through one fall event.
   Walking → free-fall dip → impact → stillness → alert → recovery. Illustrative only. */
(function () {
  'use strict';
  var canvas = document.getElementById('sim');
  var stateEl = document.getElementById('simState');
  var clockEl = document.getElementById('simClock');
  if (!canvas || !canvas.getContext) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var FS = 60, WINDOW = 7, N = FS * WINDOW, CYCLE = 12, G_MAX = 3.6, FREEFALL = 0.4, IMPACT = 2.5;
  var buf = [], t = 0, W, H, dpr;
  var ACCENT = '#ff5a3c', BONE = '#e9e6df';

  function noise() { return Math.random() - 0.5; }
  function signal(time) {
    var s = time % CYCLE;
    var walk = 1 + 0.26 * Math.sin(time * 2 * Math.PI * 1.8) + 0.08 * Math.sin(time * 2 * Math.PI * 3.6) + 0.05 * noise();
    if (s < 5.2) return walk;
    if (s < 5.55) return 1 - (s - 5.2) / 0.35 * 0.85 + 0.03 * noise();
    if (s < 5.7) return 0.15 + Math.sin((s - 5.55) / 0.15 * Math.PI) * 3.05;
    if (s < 6.1) return 1 + 0.5 * Math.sin((s - 5.7) * 30) * Math.exp(-(s - 5.7) * 9) + 0.03 * noise();
    if (s < 10.2) return 1 + 0.015 * noise();
    var k = Math.min(1, (s - 10.2) / 0.9);
    return 1 + k * (walk - 1);
  }
  function phase(time) {
    var s = time % CYCLE;
    if (s >= 5.6 && s < 7.2) return ['Impact · checking posture', true];
    if (s >= 7.2 && s < 8.6) return ['Inactive · warning · press to cancel', true];
    if (s >= 8.6 && s < 10.2) return ['No cancel · SMS sent', true];
    return ['Monitoring', false];
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.width * 380 / 900));
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function y(g) { var pad = 22; return H - pad - (g / G_MAX) * (H - pad * 2); }
  function label(text, yy) {
    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    var tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(16,20,26,.92)'; ctx.fillRect(10, yy - 10, tw + 10, 15);
    ctx.fillStyle = 'rgba(233,230,223,.55)'; ctx.fillText(text, 15, yy + 1);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(233,230,223,.05)';
    for (var gx = 0; gx <= 12; gx++) { var xx = Math.round(gx * W / 12) + .5; ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, H); ctx.stroke(); }
    for (var gy = 0; gy <= G_MAX; gy += .5) { var yy = Math.round(y(gy)) + .5; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,90,60,.5)';
    [FREEFALL, IMPACT].forEach(function (g) { var ty = Math.round(y(g)) + .5; ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke(); });
    ctx.setLineDash([]);
    label('IMPACT  2.5 g', y(IMPACT) - 8); label('FREE-FALL  0.4 g', y(FREEFALL) + 14); label('1 g', y(1) - 8);

    if (buf.length > 1) {
      var step = W / (N - 1), offset = N - buf.length;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // area
      ctx.beginPath();
      for (var i = 0; i < buf.length; i++) { var px = (offset + i) * step, py = y(buf[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.lineTo((offset + buf.length - 1) * step, y(0)); ctx.lineTo(offset * step, y(0)); ctx.closePath();
      var grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, 'rgba(233,230,223,.10)'); grad.addColorStop(1, 'rgba(233,230,223,0)');
      ctx.fillStyle = grad; ctx.fill();
      // trace
      ctx.beginPath();
      for (var j = 0; j < buf.length; j++) { var qx = (offset + j) * step, qy = y(buf[j]); j ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); }
      ctx.strokeStyle = 'rgba(233,230,223,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = ACCENT;
      for (var k = 0; k < buf.length; k++) if (buf[k] > IMPACT || buf[k] < FREEFALL) { ctx.beginPath(); ctx.arc((offset + k) * step, y(buf[k]), 2.2, 0, Math.PI * 2); ctx.fill(); }
      var hx = (offset + buf.length - 1) * step, hy = y(buf[buf.length - 1]);
      ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fillStyle = 'rgba(233,230,223,.12)'; ctx.fill();
      ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, Math.PI * 2); ctx.fillStyle = BONE; ctx.fill();
    }
  }
  function tick() { buf.push(signal(t)); if (buf.length > N) buf.shift(); t += 1 / FS; }
  function labels() { var p = phase(t); stateEl.textContent = p[0]; stateEl.classList.toggle('is-alert', p[1]); clockEl.textContent = 't = ' + t.toFixed(2) + ' s'; }

  resize(); window.addEventListener('resize', function () { resize(); draw(); });
  for (var m = 0; m < N; m++) tick();
  if (reduce) { t = 1.6; for (var s = 0; s < N; s++) tick(); draw(); labels(); return; }
  var last = performance.now(), acc = 0, visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: .05 }).observe(canvas);
  (function loop(now) {
    acc += Math.min(.1, (now - last) / 1000); last = now;
    if (visible && !document.hidden) { while (acc >= 1 / FS) { tick(); acc -= 1 / FS; } draw(); labels(); } else acc = 0;
    requestAnimationFrame(loop);
  })(last);
})();

/* Hero background: iso-contour field rendered with a WebGL2 fragment shader.
   Reads like magnetic field lines / an MR field map. Reacts to the pointer and
   fades out as the hero scrolls away. Falls back to a CSS gradient without WebGL2. */
(function () {
  'use strict';
  var canvas = document.getElementById('field');
  var hero = canvas && canvas.closest('.hero');
  if (!canvas) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { hero.classList.add('no-gl'); return; }

  var VS = '#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }';
  var FS = '#version 300 es\nprecision highp float;\n' +
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uFade; out vec4 o;\n' +
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }\n' +
    'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);\n' +
    '  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }\n' +
    'float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }\n' +
    'void main(){\n' +
    '  vec2 uv = gl_FragCoord.xy/uRes; vec2 p = (gl_FragCoord.xy - .5*uRes)/uRes.y;\n' +
    '  float t = uTime*.05;\n' +
    '  vec2 m = (uMouse-.5)*vec2(uRes.x/uRes.y,1.);\n' +
    '  float d = length(p-m);\n' +
    '  vec2 q = p*1.5 + vec2(t*.5, -t*.3);\n' +
    '  float f = fbm(q + .4*fbm(q*1.2 - t*.8));\n' +
    '  f += .14*exp(-d*d*5.);\n' +
    '  float lines = 16.;\n' +
    '  float v = f*lines; float g = abs(fract(v)-.5); float w = fwidth(v);\n' +
    '  float line = 1. - smoothstep(0., w*1.5, g);\n' +
    '  float major = 1. - smoothstep(0., w*.6, abs(fract(v/4.)-.5)*4.);\n' +
    '  float scanY = fract(uTime*.06);\n' +
    '  float scan = smoothstep(.06,0.,abs(uv.y-scanY));\n' +
    '  float vig = smoothstep(1.25,.25,length(p*vec2(.75,1.)));\n' +
    '  float glow = exp(-d*d*4.);\n' +
    '  vec3 bg = vec3(.0235,.0314,.0392);\n' +
    '  vec3 bone = vec3(.914,.902,.875); vec3 acc = vec3(1.,.353,.235);\n' +
    '  float a = line*(.09 + .16*major) + line*scan*.25;\n' +
    '  vec3 col = bg + bone*a*vig*(1.-uFade);\n' +
    '  col += acc*line*glow*.55*vig*(1.-uFade);\n' +
    '  col += acc*exp(-d*d*9.)*.06*(1.-uFade);\n' +
    '  o = vec4(col,1.);\n' +
    '}';

  function shader(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  var prog = gl.createProgram();
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { hero.classList.add('no-gl'); return; }
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.classList.add('no-gl'); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime'), uMouse = gl.getUniformLocation(prog, 'uMouse'), uFade = gl.getUniformLocation(prog, 'uFade');

  var W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.floor(canvas.clientWidth * dpr); H = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H); }
  }
  var mouse = [0.62, 0.55], target = [0.62, 0.55], fade = 0, visible = true, t0 = performance.now();
  window.addEventListener('pointermove', function (e) { target[0] = e.clientX / window.innerWidth; target[1] = 1 - e.clientY / window.innerHeight; }, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', function () { var h = hero.offsetHeight || 1; fade = Math.min(1, Math.max(0, window.scrollY / (h * .9))); }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);

  resize();
  function frame(now) {
    if (visible && !document.hidden) {
      mouse[0] += (target[0] - mouse[0]) * .06; mouse[1] += (target[1] - mouse[1]) * .06;
      gl.uniform2f(uRes, W, H);
      gl.uniform1f(uTime, reduce ? 12 : (now - t0) / 1000);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.uniform1f(uFade, fade);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__field = { resize: resize };
})();

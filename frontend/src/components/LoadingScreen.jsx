import { useEffect, useState, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import '../landing.css';

const particles = [
  ["landing-particle landing-particle-a", "0.15s"],
  ["landing-particle landing-particle-b", "0.7s"],
  ["landing-particle landing-particle-c", "1.25s"],
  ["landing-particle landing-particle-d", "1.8s"],
  ["landing-particle landing-particle-e", "2.35s"],
];

export default function LoadingScreen({ onDone }) {
  const canvasRef = useRef(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('bb_theme');
      if (saved) return saved === 'dark';
      return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('bb_theme', 'dark'); } catch {}
      } else {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('bb_theme', 'light'); } catch {}
      }
      return next;
    });
  };

  const handleEnter = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    setTimeout(() => {
      if (onDone) onDone();
    }, 450);
  };

  // Auto-redirect after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => handleEnter(), 7000);
    return () => clearTimeout(timer);
  }, []);

  // ── Canvas / WebGL Animation Engine ──
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId = null;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TAU = Math.PI * 2;
    let W = 0, H = 0, R = 0, cx = 0, cy = 0, poolY = 0, aMax = 2.2, narrow = false;
    let y0 = 0, yC = 0, dist = 0;

    // Loop timing (seconds): fall, then sink below surface, ripples continue
    const T = 5.4, TF = 2.2, TS = 0.75;

    function rnd(seed) {
      const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    }
    function smooth(x) {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    }
    function eo(p) {
      return 1 - (1 - p) * (1 - p);
    }

    // Fixed scene data: orbiting cells and splash beads
    const cells = [];
    for (let i = 0; i < 7; i++) {
      cells.push({
        big: true,
        u: rnd(i + 1),
        b: 0.35 + rnd(i + 11) * 0.8,
        rot: -0.9 + rnd(i + 21) * 1.8,
        sp: (0.1 + rnd(i + 31) * 0.14) * (i % 2 ? -1 : 1),
        ph: rnd(i + 41) * TAU,
        s: 0.13 + rnd(i + 51) * 0.08,
        spin: (rnd(i + 61) - 0.5) * 0.5,
        rot0: rnd(i + 71) * TAU,
        tumble: 0.3 + rnd(i + 81) * 0.5
      });
    }
    for (let i = 0; i < 14; i++) {
      cells.push({
        big: false,
        u: rnd(i + 101),
        b: 0.3 + rnd(i + 111) * 0.9,
        rot: -0.9 + rnd(i + 121) * 1.8,
        sp: (0.08 + rnd(i + 131) * 0.18) * (i % 2 ? 1 : -1),
        ph: rnd(i + 141) * TAU,
        s: 0.03 + rnd(i + 151) * 0.04,
        spin: 0,
        rot0: 0,
        tumble: 0
      });
    }

    const beads = [];
    for (let bi = 0; bi < 12; bi++) {
      beads.push({
        dir: bi % 2 ? 1 : -1,
        vx: 0.5 + rnd(bi + 301) * 1.9,
        vy: 2.6 + rnd(bi + 311) * 3.2,
        r: 0.022 + rnd(bi + 321) * 0.03
      });
    }

    // WebGL Glass Drop Shaders
    const VS = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';
    const FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH',
      'precision highp float;',
      '#else',
      'precision mediump float;',
      '#endif',
      'uniform float uTime; uniform vec2 uRes; uniform float uUnit;',
      'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
      'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
      '  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));',
      '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }',
      'float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return v; }',
      'float inv(float lo, float hi, float x){ return 1.0 - smoothstep(lo, hi, x); }',
      'float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }',
      'void main(){',
      '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uUnit;',
      '  float t = uTime;',
      '  vec2 q = p; float sq = sin(t * 1.3);',
      '  q.x /= 1.0 - 0.014 * sq; q.y /= 1.0 + 0.02 * sq;',
      '  float wob = 0.018 * sin(q.y * 4.0 - t * 1.6) + 0.014 * sin(q.y * 7.0 + t * 2.3);',
      '  q.x -= wob * (0.4 + 0.6 * inv(-1.0, 1.0, q.y));',
      '  float tw = smoothstep(-0.2, 1.4, q.y); q.x -= sin(t * 0.8) * 0.035 * tw * tw;',
      '  const float yc = -0.47; const float r1 = 0.88; const float cb = 0.46; const float ca = 0.888;',
      '  const float lin0 = 0.7814;',
      '  float yt = yc + r1 * cb;',
      '  float dy = q.y - yc;',
      '  float lin = max((r1 - cb * dy) / ca, 0.0);',
      '  float m = clamp(lin / lin0, 0.0, 1.0);',
      '  float cv = 1.0 - 0.45 * (1.0 - m) * (1.0 - m);',
      '  float whC = lin0 * m * cv;',
      '  float dwC = (-cb / ca) * (cv + 0.9 * m * (1.0 - m));',
      '  bool low = q.y < yt;',
      '  float d = low ? length(vec2(q.x, dy)) - r1 : (abs(q.x) - whC) / sqrt(1.0 + dwC * dwC);',
      '  d = max(d, q.y - 1.44);',
      '  float px = 1.5 / uUnit;',
      '  float alpha = 1.0 - smoothstep(-px, px, d);',
      '  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }',
      '  float wh = low ? sqrt(max(r1 * r1 - dy * dy, 0.0)) : whC;',
      '  wh = max(wh, 0.02);',
      '  float wp = low ? -dy / wh : dwC;',
      '  float xi = clamp(q.x, -wh * 0.999, wh * 0.999);',
      '  float z = sqrt(max(wh * wh - xi * xi, 0.0001));',
      '  vec3 n = normalize(vec3(xi, -wh * wp, z));',
      '  n.xy += 0.05 * vec2(noise(p * 3.0 + t * 0.2) - 0.5, noise(p * 3.0 + 7.0 - t * 0.2) - 0.5);',
      '  n = normalize(n);',
      '  float depthU = clamp(z / wh, 0.0, 1.0);',
      '  float thick = 2.0 * z + 0.85;',
      '  vec2 ruv = p + n.xy * (0.25 + 0.2 * thick);',
      '  vec3 bg = mix(vec3(0.90, 0.84, 0.84), vec3(1.0, 0.97, 0.96), smoothstep(-1.6, 1.4, ruv.y));',
      '  bg += vec3(1.0, 0.78, 0.65) * exp(-length((ruv - vec2(0.05, -0.95)) * vec2(0.9, 1.3)) * 1.6) * 0.9;',
      '  vec3 sigma = vec3(0.12, 1.6, 1.4);',
      '  vec3 col = bg * exp(-sigma * thick) * 0.88;',
      '  col *= mix(0.5, 1.0, smoothstep(0.0, 0.6, depthU));',
      '  float fb = fbm(p * 3.0 + vec2(0.0, t * 0.06));',
      '  col *= 0.8 + 0.4 * fb;',
      '  float cd = length((p - vec2(0.04, -0.88)) * vec2(1.0, 1.7));',
      '  float caus = exp(-cd * cd * 2.6);',
      '  float fct = abs(noise(p * 8.0 + vec2(t * 0.05, 0.0)) - 0.5) + 0.5 * abs(noise(p * 13.0 - 3.0) - 0.5);',
      '  float cracks = inv(0.0, 0.05, fct);',
      '  col += vec3(1.0, 0.3, 0.2) * caus * (0.55 + 0.5 * fb);',
      '  col += vec3(1.0, 0.55, 0.4) * cracks * caus * 0.5;',
      '  vec2 sv = p - vec2(0.22, -0.1); float sr = length(sv); float sa = atan(sv.y, sv.x);',
      '  float fs = fract(sa / 6.28318 + sr * 1.5 - t * 0.04);',
      '  float band = smoothstep(0.0, 0.1, fs) * inv(0.34, 0.46, fs);',
      '  float prof = max(1.0 - pow(abs(fs - 0.22) / 0.22, 2.0), 0.0);',
      '  float smask = smoothstep(0.18, 0.34, sr) * inv(0.7, 0.95, sr) * smoothstep(0.1, 0.45, depthU) * smoothstep(-0.9, 0.3, sin(sa - 0.6 + t * 0.12));',
      '  col = mix(col, col * 0.62 + vec3(0.08, 0.0, 0.0), band * smask * 0.7);',
      '  col += vec3(1.0, 0.5, 0.45) * pow(prof, 4.0) * band * smask * 0.75;',
      '  col += vec3(1.0, 0.85, 0.8) * pow(prof, 14.0) * band * smask * 0.6;',
      '  for (int i = 0; i < 9; i++){',
      '    float fi = float(i);',
      '    float h1 = hash(vec2(fi, 1.3)); float h2 = hash(vec2(fi, 7.7));',
      '    vec2 c = vec2((h1 - 0.5) * 1.2 + 0.03 * sin(t * 1.5 + fi * 3.0), fract(t * (0.018 + 0.03 * h2) + h1 * 3.7) * 2.9 - 1.45);',
      '    float r = 0.014 + 0.04 * h2 * h2;',
      '    float dd = length(p - c);',
      '    float rim = smoothstep(r * 0.7, r, dd) * inv(r, r * 1.12, dd);',
      '    col += vec3(1.0, 0.72, 0.66) * rim * 0.45;',
      '    col += vec3(1.0, 0.45, 0.4) * inv(0.0, r, dd) * 0.1;',
      '    col += vec3(1.0) * inv(0.0, r * 0.3, length(p - c - vec2(-0.35, 0.35) * r)) * 0.8;',
      '  }',
      '  { vec2 c = vec2(0.30 + 0.02 * sin(t * 0.7), 0.12 + 0.02 * cos(t * 0.6)); float r = 0.065; float dd = length(p - c);',
      '    col += vec3(1.0, 0.7, 0.65) * smoothstep(r * 0.78, r, dd) * inv(r, r * 1.08, dd) * 0.7;',
      '    col += vec3(1.0, 0.4, 0.38) * inv(0.0, r, dd) * 0.18;',
      '    col += vec3(1.0) * inv(0.0, r * 0.25, length(p - c - vec2(-0.35, 0.35) * r)) * 0.9; }',
      '  vec2 g = (p + vec2(0.0, -t * 0.015)) * 60.0; vec2 id = floor(g); vec2 f = fract(g) - 0.5;',
      '  float hh = hash(id); float on = step(0.972, hh);',
      '  vec2 off = (vec2(hash(id + 3.1), hash(id + 7.3)) - 0.5) * 0.6;',
      '  float spk = inv(0.0, 0.14, length(f - off));',
      '  float tws = 0.5 + 0.5 * sin(t * (1.0 + hh * 3.0) + hh * 60.0);',
      '  col += vec3(1.0, 0.55, 0.5) * on * spk * (0.4 + 0.8 * tws) * smoothstep(0.1, 0.4, depthU);',
      '  float edge = pow(1.0 - n.z, 2.2);',
      '  vec2 rd = normalize(n.xy + vec2(0.0001));',
      '  vec2 L1 = normalize(vec2(-0.7, 0.7));',
      '  float l1 = pow(max(dot(rd, L1), 0.0), 3.0);',
      '  float l2 = pow(max(dot(rd, normalize(vec2(0.85, 0.45))), 0.0), 6.0);',
      '  float l3 = pow(max(dot(rd, vec2(0.2, -0.98)), 0.0), 4.0);',
      '  vec3 refl = (l1 * vec3(1.0, 0.98, 0.97) * 1.2 + l2 * vec3(1.0, 0.95, 0.94) * 0.7 + l3 * vec3(1.0, 0.55, 0.45) * 0.55 + 0.18) * edge;',
      '  float F = 0.04 + 0.9 * pow(1.0 - n.z, 4.0);',
      '  col = mix(col, vec3(1.0), clamp(F, 0.0, 1.0) * 0.55);',
      '  col += refl * 1.1;',
      '  col += vec3(1.0, 0.2, 0.2) * pow(1.0 - depthU, 5.0) * 0.35;',
      '  float inl = exp(-pow((depthU - 0.32) / 0.05, 2.0));',
      '  col += vec3(1.0, 0.85, 0.8) * inl * l1 * 0.4;',
      '  vec2 wq = p + n.xy * 0.5 - vec2(-0.42, 0.2);',
      '  float cw = cos(-0.38); float sw = sin(-0.38);',
      '  wq = vec2(cw * wq.x - sw * wq.y, sw * wq.x + cw * wq.y);',
      '  float win = inv(0.0, 0.035, sdBox(wq, vec2(0.09, 0.62)));',
      '  float win2 = inv(0.0, 0.03, sdBox(wq - vec2(0.17, -0.05), vec2(0.02, 0.4)));',
      '  col += vec3(1.0, 0.97, 0.96) * (win * 0.65 + win2 * 0.35) * smoothstep(0.0, 0.25, depthU);',
      '  vec3 H1 = normalize(normalize(vec3(-0.5, 0.6, 0.6)) + vec3(0.0, 0.0, 1.0));',
      '  col += vec3(1.0) * pow(max(dot(n, H1), 0.0), 140.0) * 1.5;',
      '  vec3 H2 = normalize(normalize(vec3(0.6, 0.2, 0.7)) + vec3(0.0, 0.0, 1.0));',
      '  col += vec3(1.0, 0.9, 0.88) * pow(max(dot(n, H2), 0.0), 70.0) * 0.5;',
      '  col = col / (1.0 + 0.12 * col) * 1.1;',
      '  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * alpha, alpha);',
      '}'
    ].join('\n');

    const glc = document.createElement('canvas');
    let gl = null, glOK = false, gdpr = 1;
    const glU = {};

    function initGL() {
      try {
        gl = glc.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      } catch (e) {
        gl = null;
      }
      if (!gl) return;

      function sh(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
        return s;
      }
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return;
      const pr = gl.createProgram();
      gl.attachShader(pr, vs);
      gl.attachShader(pr, fs);
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      glU.t = gl.getUniformLocation(pr, 'uTime');
      glU.res = gl.getUniformLocation(pr, 'uRes');
      glU.unit = gl.getUniformLocation(pr, 'uUnit');
      glOK = true;
    }

    function sizeGL() {
      if (!glOK || !gl) return;
      gdpr = Math.min(window.devicePixelRatio || 1, 1.5);
      glc.width = Math.max(2, Math.ceil(3.0 * R * gdpr));
      glc.height = Math.max(2, Math.ceil(3.3 * R * gdpr));
      gl.viewport(0, 0, glc.width, glc.height);
    }

    function renderGL(t) {
      if (!glOK || !gl) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(glU.t, t);
      gl.uniform2f(glU.res, glc.width, glc.height);
      gl.uniform1f(glU.unit, R * gdpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function drawGlImage(dx, dy, sx, sy) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.scale(sx, sy);
      ctx.drawImage(glc, -1.5 * R, -1.65 * R, 3 * R, 3.3 * R);
      ctx.restore();
    }

    // Canvas fallback if WebGL is disabled
    function drawDropFallback(dx, dy) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.beginPath();
      ctx.moveTo(0, -1.44 * R);
      ctx.bezierCurveTo(0.2 * R, -0.8 * R, 0.88 * R, -0.2 * R, 0.88 * R, 0.47 * R);
      ctx.arc(0, 0.47 * R, 0.88 * R, 0, Math.PI, false);
      ctx.bezierCurveTo(-0.88 * R, -0.2 * R, -0.2 * R, -0.8 * R, 0, -1.44 * R);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -1.4 * R, 0, 1.4 * R);
      g.addColorStop(0, '#a50d1e');
      g.addColorStop(0.5, '#cf1229');
      g.addColorStop(1, '#f2353b');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, R * 0.02);
      ctx.strokeStyle = 'rgba(255,225,220,0.8)';
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-0.5 * R, 0.3 * R, R * 0.06, R * 0.45, 0.15, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
      ctx.restore();
    }

    // Geometry & Rotations
    function rot2(x, y, a) {
      return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    }

    function drawRing(front, t, dx, dy) {
      const rot = 0.28 + Math.sin(t * 0.5) * 0.04, rx = R * 1.75, ry = R * 0.42, oy = dy + R * 0.2;
      const v0 = front ? 0 : Math.PI, S = 60;
      const e0 = rot2(rx * Math.cos(v0), ry * Math.sin(v0), rot);
      const e1 = rot2(rx * Math.cos(v0 + Math.PI), ry * Math.sin(v0 + Math.PI), rot);
      const g = ctx.createLinearGradient(dx + e0[0], oy + e0[1], dx + e1[0], oy + e1[1]);
      const c = front ? '255,225,210' : '255,150,135';
      g.addColorStop(0, `rgba(${c},0)`);
      g.addColorStop(0.5, `rgba(${c},${front ? 0.95 : 0.55})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.save();
      ctx.shadowColor = 'rgba(255,90,80,0.85)';
      ctx.shadowBlur = front ? 14 : 8;
      ctx.strokeStyle = g;
      ctx.lineWidth = front ? 2.4 : 1.6;
      ctx.beginPath();
      for (let i = 0; i <= S; i++) {
        const v = v0 + (i / S) * Math.PI;
        const p = rot2(rx * Math.cos(v), ry * Math.sin(v), rot);
        if (i) ctx.lineTo(dx + p[0], oy + p[1]);
        else ctx.moveTo(dx + p[0], oy + p[1]);
      }
      ctx.stroke();

      const sv = ((t * 0.8) % TAU + TAU) % TAU;
      if ((Math.sin(sv) > 0) === front) {
        const p = rot2(rx * Math.cos(sv), ry * Math.sin(sv), rot);
        const sr = R * 0.08;
        const sg = ctx.createRadialGradient(dx + p[0], oy + p[1], 0, dx + p[0], oy + p[1], sr);
        sg.addColorStop(0, 'rgba(255,255,255,0.95)');
        sg.addColorStop(1, 'rgba(255,120,100,0)');
        ctx.shadowBlur = 0;
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(dx + p[0], oy + p[1], sr, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    function cellPos(c, t, dx, dy) {
      const a = (1.5 + c.u * (aMax - 1.5)) * R;
      const th = c.ph + c.sp * t;
      const p = rot2(a * Math.cos(th), R * c.b * Math.sin(th), c.rot);
      return {
        x: dx + p[0],
        y: dy + R * 0.1 + p[1] + Math.sin(t * 0.9 + c.ph * 3) * R * 0.04,
        depth: Math.sin(th)
      };
    }

    function drawCell(c, pos, t, al) {
      const s = c.s * R * (1 + 0.28 * pos.depth);
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.globalAlpha = (pos.depth < 0 ? 0.8 : 1) * al;
      ctx.shadowColor = 'rgba(150,10,30,0.4)';
      ctx.shadowBlur = s * 0.6;
      ctx.shadowOffsetY = s * 0.15;

      if (c.big) {
        ctx.rotate(c.rot0 + t * c.spin);
        ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.cos(t * c.tumble + c.ph)));
        const g = ctx.createRadialGradient(-s * 0.35, -s * 0.4, s * 0.05, 0, 0, s * 1.05);
        g.addColorStop(0, '#ff8a80');
        g.addColorStop(0.35, '#e0172e');
        g.addColorStop(0.75, '#a30b1f');
        g.addColorStop(1, '#5c0412');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.8, 0, 0, TAU);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        const d = ctx.createRadialGradient(s * 0.08, s * 0.1, 0, s * 0.08, s * 0.1, s * 0.62);
        d.addColorStop(0, 'rgba(60,0,10,0.6)');
        d.addColorStop(0.7, 'rgba(90,0,16,0.25)');
        d.addColorStop(1, 'rgba(90,0,16,0)');
        ctx.fillStyle = d;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.62, s * 0.48, 0, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,140,125,0.4)';
        ctx.lineWidth = s * 0.08;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.55, s * 0.42, 0, 0.2, 1.5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,225,215,0.75)';
        ctx.lineWidth = Math.max(1, s * 0.07);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.92, s * 0.73, 0, Math.PI * 1.05, Math.PI * 1.6);
        ctx.stroke();

        const sg = ctx.createRadialGradient(-s * 0.42, -s * 0.38, 0, -s * 0.42, -s * 0.38, s * 0.25);
        sg.addColorStop(0, 'rgba(255,255,255,0.9)');
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(-s * 0.42, -s * 0.38, s * 0.2, s * 0.11, -0.5, 0, TAU);
        ctx.fill();
      } else {
        const g = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s);
        g.addColorStop(0, '#ff6f69');
        g.addColorStop(0.6, '#d3142b');
        g.addColorStop(1, '#8d0a16');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, TAU);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(-s * 0.35, -s * 0.35, Math.max(0.6, s * 0.18), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // Ribbon flows
    function ribbon(o, t) {
      const S = 56, top = [], bot = [];
      const x0 = o.x0 * W, x1 = o.x1 * W, y = o.y * H, amp = o.amp * H, th0 = o.th * H, wl = o.wl * W;
      for (let i = 0; i <= S; i++) {
        const f = i / S, x = x0 + (x1 - x0) * f;
        const c = y + amp * Math.sin(x / wl + t * o.sp + o.ph) + amp * 0.5 * Math.sin(x / (wl * 0.47) - t * o.sp * 1.3);
        let th = th0 * (0.75 + 0.25 * Math.sin(x / (wl * 1.3) + t * o.sp * 0.7 + o.ph));
        if (o.taper) th *= Math.pow(Math.sin(Math.PI * f), 0.6);
        top.push([x, c - th / 2]);
        bot.push([x, c + th / 2]);
      }
      ctx.beginPath();
      for (let i = 0; i <= S; i++) {
        if (i) ctx.lineTo(top[i][0], top[i][1]);
        else ctx.moveTo(top[i][0], top[i][1]);
      }
      for (let i = S; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y - th0 * 0.8 - amp, 0, y + th0 * 0.8 + amp);
      g.addColorStop(0, `rgba(255,90,95,${(0.15 * o.a).toFixed(3)})`);
      g.addColorStop(0.35, `rgba(200,16,36,${(0.75 * o.a).toFixed(3)})`);
      g.addColorStop(0.7, `rgba(150,8,24,${(0.8 * o.a).toFixed(3)})`);
      g.addColorStop(1, `rgba(255,120,120,${(0.25 * o.a).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= S; i++) {
        if (i) ctx.lineTo(top[i][0], top[i][1]);
        else ctx.moveTo(top[i][0], top[i][1]);
      }
      ctx.strokeStyle = `rgba(255,255,255,${(0.45 * o.a).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const RIB_C = { x0: 0.5, x1: 1.2, y: 0.6, amp: 0.1, th: 0.07, wl: 0.07, sp: 0.5, ph: 0, taper: true, a: 0.7 };
    const RIB_A = { x0: -0.2, x1: 1.2, y: 0.9, amp: 0.045, th: 0.16, wl: 0.12, sp: 0.35, ph: 0, taper: false, a: 1 };
    const RIB_B = { x0: -0.2, x1: 1.2, y: 0.99, amp: 0.04, th: 0.12, wl: 0.09, sp: -0.45, ph: 2, taper: false, a: 0.9 };

    function drawHalo(dx, dy, t) {
      const r = R * 2.25 * (1 + 0.012 * Math.sin(t * 0.7));
      const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, r);
      glow.addColorStop(0, 'rgba(226,17,42,0.12)');
      glow.addColorStop(1, 'rgba(226,17,42,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, TAU);
      ctx.fill();

      const g = ctx.createRadialGradient(dx, dy, r * 0.2, dx, dy, r);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.8, 'rgba(255,255,255,0.3)');
      g.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, TAU);
      ctx.fill();

      const lg = ctx.createLinearGradient(dx - r, dy - r, dx + r, dy + r);
      lg.addColorStop(0, 'rgba(255,255,255,0.9)');
      lg.addColorStop(1, 'rgba(255,160,160,0.12)');
      ctx.strokeStyle = lg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, TAU);
      ctx.stroke();
    }

    // Pool glow, spreading plumes & ripples
    function drawPoolGlow() {
      ctx.save();
      ctx.translate(cx, poolY);
      ctx.scale(1, 0.2);
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 3.8);
      pg.addColorStop(0, 'rgba(255,120,110,0.35)');
      pg.addColorStop(0.5, 'rgba(226,17,42,0.2)');
      pg.addColorStop(1, 'rgba(226,17,42,0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(0, 0, R * 3.8, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    function drawPlume(t) {
      const c0 = Math.floor(t / T);
      for (let c = c0 - 1; c <= c0; c++) {
        const a = t - (c * T + TF);
        if (a < 0 || a > 4.6) continue;
        const rx = R * (0.4 + 2.3 * eo(Math.min(a / 3.2, 1)));
        const al = 0.5 * Math.pow(1 - a / 4.6, 1.3) * smooth(a / 0.25);
        ctx.save();
        ctx.translate(cx, poolY + R * 0.2);
        ctx.scale(1, 0.3);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, `rgba(190,14,34,${al.toFixed(3)})`);
        g.addColorStop(0.6, `rgba(190,14,34,${(al * 0.45).toFixed(3)})`);
        g.addColorStop(1, 'rgba(190,14,34,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    function ripple(x, y, rx, al, lw) {
      const ry = rx * 0.17;
      ctx.lineWidth = lw;
      ctx.strokeStyle = `rgba(210,20,40,${(al * 0.65).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = Math.max(0.8, lw * 0.6);
      ctx.strokeStyle = `rgba(255,255,255,${(al * 0.5).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, rx * 0.97, ry * 0.97, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,120,120,${(al * 0.4).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx * 0.72, ry * 0.72, 0, 0, TAU);
      ctx.stroke();
    }

    function drawRipples(t) {
      const c0 = Math.floor(t / T), life = 4.4;
      for (let c = c0 - 1; c <= c0; c++) {
        const tI = c * T + TF;
        for (let k = 0; k < 4; k++) {
          const a = t - tI - k * 0.32;
          if (a < 0 || a > life) continue;
          const p = a / life;
          ripple(cx, poolY, R * (0.18 + 4.4 * eo(p)), Math.pow(1 - p, 1.5) * Math.pow(0.8, k), 2.2 * (1 - p) + 0.8);
        }
      }
    }

    // Splash, rebound liquid jet & beads
    function drawSplash(t) {
      const c = Math.floor(t / T), a = t - (c * T + TF);
      if (a < 0 || a > 2.0) return;
      const g = 13 * R;

      if (a < 0.3) {
        const al = 1 - a / 0.3;
        ctx.save();
        ctx.translate(cx, poolY);
        ctx.scale(1, 0.22);
        const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.3);
        fg.addColorStop(0, `rgba(255,235,230,${(al * 0.6).toFixed(3)})`);
        fg.addColorStop(1, 'rgba(255,120,110,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.3, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      if (a < 0.5) {
        const p = a / 0.5;
        ripple(cx, poolY, R * (0.3 + 1.0 * eo(p)), (1 - p) * 0.9, 2.6);
      }

      // Rebound jet
      const u = (a - 0.1) / 1.0;
      if (u > 0 && u < 1) {
        const h = R * 0.95 * Math.sin(Math.PI * Math.pow(u, 0.85));
        const bw = R * 0.17 * (1 - 0.35 * u), nw = bw * 0.45, br = Math.max(nw * 1.35, R * 0.05);
        const ty = poolY - h;
        if (h > br * 1.4) {
          const jg = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
          jg.addColorStop(0, '#8d0a1a');
          jg.addColorStop(0.35, '#e3263a');
          jg.addColorStop(1, '#a30b1f');
          ctx.beginPath();
          ctx.moveTo(cx - bw, poolY);
          ctx.quadraticCurveTo(cx - nw, poolY - h * 0.35, cx - br, ty + br);
          ctx.arc(cx, ty + br, br, Math.PI, 0, false);
          ctx.quadraticCurveTo(cx + nw, poolY - h * 0.35, cx + bw, poolY);
          ctx.closePath();
          ctx.fillStyle = jg;
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(255,225,220,0.7)';
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.ellipse(cx - br * 0.4, ty + br * 0.8, br * 0.18, br * 0.4, 0.2, 0, TAU);
          ctx.fill();
        }
      }

      // Flying beads
      for (let i = 0; i < beads.length; i++) {
        const b = beads[i];
        const vx = b.dir * b.vx * R, vy = b.vy * R;
        const tl = (2 * vy) / g;
        if (a < tl) {
          const bx = cx + vx * a, by = poolY - vy * a + 0.5 * g * a * a;
          const ang = Math.atan2(-vy + g * a, vx);
          const s = b.r * R;
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(ang);
          const bg = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s * 1.5);
          bg.addColorStop(0, '#ff7b72');
          bg.addColorStop(0.55, '#d3142b');
          bg.addColorStop(1, '#7e0816');
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 1.5, s * 0.95, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath();
          ctx.arc(-s * 0.45, -s * 0.3, Math.max(0.6, s * 0.22), 0, TAU);
          ctx.fill();
          ctx.restore();
        } else if (a < tl + 0.9) {
          const p = (a - tl) / 0.9;
          ripple(cx + vx * tl, poolY, R * 0.3 * eo(p), (1 - p) * 0.8, 1.4);
        }
      }
    }

    // Drop lifecycle state
    function dropState(t) {
      const tc = ((t % T) + T) % T;
      let y, vis = true, sub = 0;
      if (tc < TF) {
        const u = tc / TF;
        y = y0 + (yC - y0) * Math.pow(u, 1.7);
      } else if (tc < TF + TS) {
        const v = (tc - TF) / TS;
        y = yC + dist * (1.3 * v - 0.3 * v * v);
        sub = v;
      } else {
        y = yC + dist;
        vis = false;
        sub = 1;
      }
      return { tc, y, vis, sub };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      narrow = W < 768;
      R = narrow ? Math.min(W * 0.26, H * 0.17) : Math.min(H * 0.2, W * 0.15);
      cx = narrow ? W * 0.5 : W * 0.7;
      cy = narrow ? H * 0.57 : H * 0.46;
      poolY = H * 0.86;
      y0 = -1.9 * R;
      yC = poolY - 1.35 * R;
      dist = 2.9 * R;
      aMax = Math.max(1.6, Math.min(2.4, (Math.min(cx, W - cx) - R * 0.15) / R));
      sizeGL();
      if (reduce) frame(0);
    }

    function frame(t) {
      let st, tt = t, tR = t;
      if (reduce) {
        st = { tc: 0, y: cy, vis: true, sub: 0 };
        tt = 3.2;
        tR = TF + 1.6;
      } else {
        st = dropState(t);
      }
      const tc = st.tc, dx = cx, dy = st.y;

      ctx.clearRect(0, 0, W, H);
      drawHalo(cx, cy, tt);
      ribbon(RIB_C, tt);
      ribbon(RIB_A, tt);
      ribbon(RIB_B, tt);
      drawPoolGlow();
      drawPlume(tR);
      drawRipples(tR);

      if (st.vis) {
        let attach = 1, f = 0, sx = 1, sy = 1;
        if (!reduce) {
          attach = Math.min(smooth(tc / 0.6), tc < TF ? 1 : 1 - smooth((tc - TF) / 0.45));
          f = tc < TF ? smooth(tc / 1.0) : 1 - smooth((tc - TF) / 0.3);
          sx = 1 - 0.03 * f;
          sy = 1 + 0.06 * f;
        }
        if (glOK) renderGL(tt);

        if (glOK && !reduce) {
          // Water mirror reflection
          if (tc < TF + 0.25) {
            const prox = Math.max(0, Math.min(1, 1 - (poolY - (dy + 1.35 * R)) / (3 * R)));
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, poolY, W, H - poolY);
            ctx.clip();
            ctx.globalAlpha = 0.26 * prox * smooth(tc / 0.8) * (tc < TF ? 1 : 1 - smooth((tc - TF) / 0.25));
            ctx.translate(0, poolY);
            ctx.scale(1, -1);
            ctx.translate(0, -poolY);
            drawGlImage(dx, dy, sx, sy);
            ctx.restore();
          }
          // Sub-surface refraction
          if (tc >= TF) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, poolY, W, H - poolY);
            ctx.clip();
            ctx.globalAlpha = 0.32 * (1 - st.sub * 0.9);
            drawGlImage(dx, dy, 1, 1);
            ctx.restore();
          }
        }

        ctx.save();
        if (!reduce && tc >= TF) {
          ctx.beginPath();
          ctx.rect(0, 0, W, poolY);
          ctx.clip();
        }
        const pos = [];
        for (let i = 0; i < cells.length; i++) pos.push(cellPos(cells[i], tt, dx, dy));
        for (let i = 0; i < cells.length; i++) if (pos[i].depth < 0) drawCell(cells[i], pos[i], tt, attach);

        ctx.globalAlpha = attach;
        drawRing(false, tt, dx, dy);
        ctx.globalAlpha = 1;

        const gg = ctx.createRadialGradient(dx, dy + R * 0.15, R * 0.4, dx, dy + R * 0.15, R * 2.0);
        gg.addColorStop(0, 'rgba(226,17,42,0.32)');
        gg.addColorStop(1, 'rgba(226,17,42,0)');
        ctx.fillStyle = gg;
        ctx.fillRect(dx - 2 * R, dy - 2 * R, 4 * R, 4 * R);

        if (glOK) drawGlImage(dx, dy, sx, sy);
        else drawDropFallback(dx, dy);

        ctx.globalAlpha = attach;
        drawRing(true, tt, dx, dy);
        ctx.globalAlpha = 1;
        for (let i = 0; i < cells.length; i++) if (pos[i].depth >= 0) drawCell(cells[i], pos[i], tt, attach);
        ctx.restore();
      }

      if (!reduce) drawSplash(t);
    }

    function loop(ms) {
      frame(ms / 1000);
      animId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    initGL();
    resize();
    if (!reduce) animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <main className={`landing ${isLeaving ? 'is-leaving' : ''}`}>
      {/* Background WebGL & 2D Canvas Fluid Blood Drop */}
      <canvas
        ref={canvasRef}
        id="c"
        className="landing-canvas"
        role="img"
        aria-label="A glass-like red drop falls into a red pool and sends ripples across the surface"
      />

      {/* Top Header */}
      <header className="landing-header">
        <div className="landing-brand" onClick={handleEnter} aria-label="LifeFlow">
          <svg viewBox="0 0 32 40" aria-hidden="true">
            <path d="M16 1C12 9 3 18 3 27a13 13 0 0 0 26 0C29 18 20 9 16 1Z" />
            <path className="brand-shine" d="M10 27c0 4 3 7 7 8" />
          </svg>
          <span>Life<span>Flow</span></span>
        </div>

        <div className="pulse-label">
          <span className="pulse-dot" />
          LIVE FOR LIFE
        </div>

        <div className="header-actions">
          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-eyebrow">
            <svg viewBox="0 0 88 18" aria-hidden="true">
              <path d="M0 9h19l4-7 6 14 6-12 5 9 4-4h44" />
            </svg>
            ONE GIFT. THREE LIVES.
          </div>
          <div className="landing-headline">
            Every <span className="highlight">Drop</span>
            <br />
            <span className="bold">Matters.</span>
          </div>
          <p>Give blood. Keep life moving.</p>


        </div>

        {/* Visual Layer Accents */}
        <div className="landing-visual" aria-hidden="true">
          <div className="landing-halo landing-halo-one" />
          <div className="landing-halo landing-halo-two" />
          <div className="landing-orbit" />
          <div className="landing-orbit-two" />
          {particles.map(([className, delay]) => (
            <span
              key={className}
              className={className}
              style={{ '--delay': delay }}
            />
          ))}
        </div>
      </section>

      {/* Bottom Timeline Progress Bar */}
      <div className="landing-timeline">
        <span>THE GIFT OF LIFE</span>
        <div><i /></div>
        <span>07 SEC</span>
        <button className="btn-skip-timeline" onClick={handleEnter}>
          Skip to App →
        </button>
      </div>
    </main>
  );
}

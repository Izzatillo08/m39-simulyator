/* =====================================================================
   «БАРҲАМ: М-39» — Three.js r128 3D САҲНА (window.S3D)
   ---------------------------------------------------------------------
   • Координаталар — фақат window.BA (blokada_anchors.js), 1 бирлик = 1 м
   • Гибрид: models/locations/*.glb ва models/units/*.glb (THREE.GLTFLoader
     бўлса ва assets манифестида бўлса) — акс ҳолда процедурал PBR геометрия
   • Оммавий объектлар — InstancedMesh (1 800 техника, 4 200 ходим,
     ~3 000 ҳайдовчи, 1 500 провокатор), заррачалар — битта шейдерда
   • Интерфейс шартномаси: focusZone, highlightErrorZones, onUnitPlaced,
     sync3D, playFx, reset, setPaused, onPick, loadModels
   ===================================================================== */
(function () {
  'use strict';
  var BA = window.BA;
  var T = function (s) { return window.I18N ? window.I18N.T(s) : s; };
  var PI = Math.PI;

  /* ---------------- ёрдамчилар ---------------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry(20261016);
  function R(a, b) { return a + (b - a) * rnd(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function angLerp(a, b, u) { var d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * u; }
  function col(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }

  var renderer, scene, camera, host, overlay, clock, sun, hemi, sky, ground, COMP = null, BLOOM = null, FXAA = null;
  var S = { t: 0, paused: false, fog: 1, fogGoal: 1, bright: 0, brightGoal: 0, ready: false, onPick: null, err: {}, alloc: null, unrest: 1 };
  var C = { t: V(0, 0, 0), d: 3000, tilt: 0.8, yaw: -0.5, g: { t: V(0, 0, 0), d: 3000, tilt: 0.8, yaw: -0.5 }, follow: null };
  var STATIC, DYN, FX;                 // статик олам, динамик объектлар, қарор эффектлари
  var UPDATERS = [];                   // ҳар кадрда чақириладиган функциялар (FX учун — FX.userData.up)
  var MIG = [];                        // мигалкалар
  var LABELS = [];                     // HTML ёрлиқлар
  var SITE_R = { loc_erkin: 420, loc_log: 380, loc_airp_cargo: 650, loc_bypass: 380, loc_fuel: 450, loc_hq: 220 };
  var _o = new THREE.Object3D();

  /* ---------------- геометрия бирлаштириш (вертекс ранглари билан) ---------------- */
  function merge(parts) {
    var tot = 0, gs = parts.map(function (p) {
      var g = p[0].index ? p[0].toNonIndexed() : p[0].clone(), t = p[1] || {};
      var m = new THREE.Matrix4().compose(V.apply(null, t.p || [0, 0, 0]),
        new THREE.Quaternion().setFromEuler(new THREE.Euler((t.r || [0, 0, 0])[0], (t.r || [0, 0, 0])[1], (t.r || [0, 0, 0])[2])),
        V.apply(null, t.s || [1, 1, 1]));
      g.applyMatrix4(m); tot += g.attributes.position.count;
      return [g, col(p[2] == null ? 0xffffff : p[2]), p[3] == null ? 1 : p[3]];
    });
    var P = new Float32Array(tot * 3), N = new Float32Array(tot * 3), Cc = new Float32Array(tot * 3), Tn = new Float32Array(tot), o = 0;
    gs.forEach(function (q) {
      var g = q[0], c = q[1], n = g.attributes.position.count;
      P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3);
      for (var i = 0; i < n; i++) { Cc[(o + i) * 3] = c.r; Cc[(o + i) * 3 + 1] = c.g; Cc[(o + i) * 3 + 2] = c.b; Tn[o + i] = q[2]; }
      o += n; g.dispose();
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    g.setAttribute('tint', new THREE.BufferAttribute(Tn, 1));   // 1 — кийим (instance ранги), 0 — тери, шим, пойабзал
    g.computeBoundingSphere(); return g;
  }
  var BOX = new THREE.BoxGeometry(1, 1, 1);
  function cyl(r1, r2, h, s) { return new THREE.CylinderGeometry(r1, r2, h, s || 12); }
  var WHEEL = cyl(1, 1, 1, 12);
  function wheel(x, z, r, w) { return [WHEEL, { p: [x, r, z], r: [PI / 2, 0, 0], s: [r, w, r] }, 0x151515]; }
  function box(sx, sy, sz, x, y, z, c) { return [BOX, { p: [x, y, z], s: [sx, sy, sz] }, c]; }

  /* ---------------- текстуралар ---------------- */
  function canvasTex(w, h, draw, srgb) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb !== false) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function noise(g, w, h, base, amp, n) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < n; i++) { var v = (rnd() - 0.5) * amp; g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  }
  // йўл текстураси: lanes — бир томондаги йўлаклар сони, med — ўрта ажратгич (м), W — умумий эни (м)
  function roadTex(W, lanesPerSide, med) {
    return canvasTex(512, 256, function (g, w, h) {
      noise(g, w, h, '#3a3d42', 0.12, 9000);
      var px = w / W, sh = 1, lw = 3.5;
      function vline(m, dash, color, wd) {
        g.fillStyle = color; var x = m * px - (wd || 2) / 2;
        if (!dash) g.fillRect(x, 0, wd || 3, h); else { g.fillRect(x, 0, wd || 3, h * 0.25); g.fillRect(x, h * 0.5, wd || 3, h * 0.25); }
      }
      if (med > 0) { g.fillStyle = '#8b8d88'; g.fillRect((W / 2 - med / 2) * px, 0, med * px, h); g.fillStyle = '#c9c4b5'; g.fillRect((W / 2 - 0.25) * px, 0, 0.5 * px, h); }
      [0, 1].forEach(function (side) {
        var a = side ? W / 2 + med / 2 + (lanesPerSide > 1 ? 0.5 : 0) : sh;
        vline(a, false, '#e9e6dc', 3);
        for (var k = 1; k < lanesPerSide; k++) vline(a + k * lw, true, '#e3e0d6', 3);
        vline(a + lanesPerSide * lw, false, '#e9e6dc', 3);
      });
      g.fillStyle = 'rgba(0,0,0,.18)'; for (var i = 0; i < 40; i++) g.fillRect(rnd() * w, 0, 2 + rnd() * 6, h);
    });
  }
  var GLOW_TEX;
  function glowTex() {
    if (GLOW_TEX) return GLOW_TEX;
    GLOW_TEX = canvasTex(64, 64, function (g) {
      var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    });
    return GLOW_TEX;
  }
  function glow(color, size, opacity) {
    var m = new THREE.SpriteMaterial({ map: glowTex(), color: color, transparent: true, opacity: opacity == null ? 1 : opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    var s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
  }

  /* ---------------- йўл эгри чизиқлари ---------------- */
  var RD = {};
  function buildCurve(key, ptsWorld) {
    var c = new THREE.CatmullRomCurve3(ptsWorld.map(function (p) { return V(p.x, 0, p.z); }), false, 'centripetal');
    var L = c.getLength(), n = Math.ceil(L / 2), sp = c.getSpacedPoints(n);
    var xs = new Float32Array(n + 1), zs = new Float32Array(n + 1), yw = new Float32Array(n + 1);
    for (var i = 0; i <= n; i++) { xs[i] = sp[i].x; zs[i] = sp[i].z; }
    for (i = 0; i <= n; i++) { var a = sp[Math.max(0, i - 1)], b = sp[Math.min(n, i + 1)]; yw[i] = Math.atan2(-(b.z - a.z), b.x - a.x); }
    RD[key] = { L: L, n: n, xs: xs, zs: zs, yw: yw, step: L / n };
  }
  // йўл бўйлаб s (м) ва ён силжиш lat (+ чап томон) бўйича нуқта
  function at(key, s, lat) {
    var r = RD[key], f = clamp(s / r.step, 0, r.n), i = Math.min(r.n - 1, Math.floor(f)), u = f - i;
    var x = r.xs[i] + (r.xs[i + 1] - r.xs[i]) * u, z = r.zs[i] + (r.zs[i + 1] - r.zs[i]) * u, yaw = r.yw[i];
    lat = lat || 0;
    return { x: x - Math.sin(yaw) * lat, z: z - Math.cos(yaw) * lat, yaw: yaw };
  }
  function nearestS(key, x, z) {
    var r = RD[key], b = 1e18, bi = 0;
    for (var i = 0; i <= r.n; i++) { var d = (r.xs[i] - x) * (r.xs[i] - x) + (r.zs[i] - z) * (r.zs[i] - z); if (d < b) { b = d; bi = i; } }
    return bi * r.step;
  }
  function distRoad(key, x, z) {
    var r = RD[key], b = 1e18;
    for (var i = 0; i <= r.n; i += 5) { var d = (r.xs[i] - x) * (r.xs[i] - x) + (r.zs[i] - z) * (r.zs[i] - z); if (d < b) b = d; }
    return Math.sqrt(b);
  }
  function ribbon(key, width, y, mat, tile, lat0, s0, s1) {
    var r = RD[key], pos = [], uv = [], nor = [], idx = [], hw = width / 2;
    s0 = s0 || 0; s1 = s1 == null ? r.L : s1;
    var k = 0;
    for (var s = s0; ; s += 8) {
      if (s > s1) s = s1;
      var p = at(key, s, lat0 || 0), lx = -Math.sin(p.yaw), lz = -Math.cos(p.yaw);
      pos.push(p.x + lx * hw, y, p.z + lz * hw, p.x - lx * hw, y, p.z - lz * hw);
      uv.push(0, s / tile, 1, s / tile); nor.push(0, 1, 0, 0, 1, 0);
      if (k) { var a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } // юқорига қараган юзалар
      k++; if (s >= s1) break;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    var m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
  }

  /* ---------------- Instanced гуруҳ ---------------- */
  function IG(geom, mat, max, cast) {
    var m = new THREE.InstancedMesh(geom, mat, max);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
    m.count = 0; m.frustumCulled = false; m.castShadow = !!cast; m.receiveShadow = true;
    this.m = m; this.max = max; this.n = 0; this.dirty = false;
    this.x = new Float32Array(max); this.y = new Float32Array(max); this.z = new Float32Array(max); this.r = new Float32Array(max); this.s = new Float32Array(max);
    this.bx = new Float32Array(max); this.by = new Float32Array(max); this.bz = new Float32Array(max); this.br = new Float32Array(max); this.bs = new Float32Array(max);
    this.tw = new Map();
  }
  IG.prototype.add = function (x, y, z, r, s, c) {
    if (this.n >= this.max) return -1;
    var i = this.n++;
    this.x[i] = this.bx[i] = x; this.y[i] = this.by[i] = y; this.z[i] = this.bz[i] = z; this.r[i] = this.br[i] = r; this.s[i] = this.bs[i] = s == null ? 1 : s;
    if (c) this.m.setColorAt(i, c);
    this.m.count = this.n; this.write(i); this.m.instanceColor.needsUpdate = true; return i;
  };
  IG.prototype.write = function (i) {
    _o.position.set(this.x[i], this.y[i], this.z[i]); _o.rotation.set(0, this.r[i], 0); _o.scale.setScalar(this.s[i]);
    _o.updateMatrix(); this.m.setMatrixAt(i, _o.matrix); this.dirty = true; this.ver = (this.ver || 0) + 1;
  };
  IG.prototype.set = function (i, x, z, r, s, y) {
    this.tw.delete(i); this.x[i] = x; this.z[i] = z; if (r != null) this.r[i] = r; if (s != null) this.s[i] = s; if (y != null) this.y[i] = y; this.write(i);
  };
  IG.prototype.color = function (i, c) { this.m.setColorAt(i, c); this.m.instanceColor.needsUpdate = true; };
  IG.prototype.to = function (i, x, z, r, dur, delay, s, y) {
    this.tw.set(i, { fx: this.x[i], fz: this.z[i], fr: this.r[i], fs: this.s[i], fy: this.y[i], tx: x, tz: z, tr: r == null ? this.r[i] : r, ts: s == null ? this.s[i] : s, ty: y == null ? this.y[i] : y, t0: S.t + (delay || 0), dur: dur || 1 });
  };
  IG.prototype.update = function () {
    if (this.tw.size) {
      var self = this;
      this.tw.forEach(function (w, i) {
        var u = (S.t - w.t0) / w.dur; if (u < 0) return; if (u > 1) u = 1;
        var e = ease(u);
        self.x[i] = w.fx + (w.tx - w.fx) * e; self.z[i] = w.fz + (w.tz - w.fz) * e; self.y[i] = w.fy + (w.ty - w.fy) * e;
        self.r[i] = angLerp(w.fr, w.tr, e); self.s[i] = w.fs + (w.ts - w.fs) * e; self.write(i);
        if (u >= 1) self.tw.delete(i);
      });
    }
    if (this.dirty) { this.m.instanceMatrix.needsUpdate = true; this.dirty = false; }
  };
  IG.prototype.reset = function () {
    this.tw.clear();
    for (var i = 0; i < this.n; i++) { this.x[i] = this.bx[i]; this.y[i] = this.by[i]; this.z[i] = this.bz[i]; this.r[i] = this.br[i]; this.s[i] = this.bs[i]; this.write(i); }
  };
  IG.prototype.clear = function () { this.n = 0; this.m.count = 0; this.tw.clear(); };
  IG.prototype.back = function (i, dur, delay) { this.to(i, this.bx[i], this.bz[i], this.br[i], dur, delay, this.bs[i], this.by[i]); };

  /* ---------------- заррачалар (олов, тутун, сув, газ, учқун) ---------------- */
  var PVS = [
    'attribute float size; attribute float alpha; attribute vec3 pcolor; varying float vA; varying vec3 vC; uniform float uScale;',
    '#include <common>', '#include <logdepthbuf_pars_vertex>',
    'void main(){ vA=alpha; vC=pcolor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(512.0,size*uScale/max(1.0,-mv.z)); gl_Position=projectionMatrix*mv;',
    '#include <logdepthbuf_vertex>', '}'].join('\n');
  var PFS = [
    'varying float vA; varying vec3 vC; uniform float uSoft;',
    '#include <common>', '#include <logdepthbuf_pars_fragment>',
    'void main(){', '#include <logdepthbuf_fragment>',
    ' vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0; if(d>1.0) discard; float a=pow(1.0-d,uSoft)*vA; gl_FragColor=vec4(vC,a); }'].join('\n');
  var PSYS = [];
  function PS(max, additive, soft) {
    this.max = max; this.i = 0;
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3);
    this.age = new Float32Array(max).fill(1); this.life = new Float32Array(max).fill(0.0001);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max);
    this.gr = new Float32Array(max); this.dr = new Float32Array(max);
    this.size = new Float32Array(max); this.alpha = new Float32Array(max); this.c = new Float32Array(max * 3);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.c, 3).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uScale: { value: 500 }, uSoft: { value: soft || 1.2 } } });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = additive ? 3 : 2;
    this.g = g; this.live = 0;
    PSYS.push(this);
  }
  PS.prototype.emit = function (x, y, z, vx, vy, vz, life, s0, s1, a0, c, grav, drag) {
    var i = this.i; this.i = (this.i + 1) % this.max;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.age[i] = 0; this.life[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a0;
    this.c[i * 3] = c.r; this.c[i * 3 + 1] = c.g; this.c[i * 3 + 2] = c.b; this.gr[i] = grav || 0; this.dr[i] = drag || 0;
  };
  PS.prototype.update = function (dt) {
    var live = 0;
    for (var i = 0; i < this.max; i++) {
      if (this.age[i] >= this.life[i]) { if (this.alpha[i] !== 0) { this.alpha[i] = 0; this.size[i] = 0; } continue; }
      live++;
      this.age[i] += dt; var u = this.age[i] / this.life[i];
      if (u >= 1) { this.alpha[i] = 0; this.size[i] = 0; continue; }
      var k = i * 3, dr = 1 - this.dr[i] * dt;
      this.v[k + 1] += this.gr[i] * dt; this.v[k] *= dr; this.v[k + 1] *= dr; this.v[k + 2] *= dr;
      this.p[k] += this.v[k] * dt; this.p[k + 1] += this.v[k + 1] * dt; this.p[k + 2] += this.v[k + 2] * dt;
      if (this.p[k + 1] < 0) { this.p[k + 1] = 0; this.v[k + 1] *= -0.2; }
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * u;
      this.alpha[i] = this.a0[i] * (u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88);
    }
    this.live = live;
    var a = this.g.attributes; a.position.needsUpdate = a.size.needsUpdate = a.alpha.needsUpdate = a.pcolor.needsUpdate = true;
  };
  PS.prototype.clear = function () { this.age.fill(1); this.alpha.fill(0); this.size.fill(0); };
  var PADD, PNRM;                      // қўшилувчи (олов, учқун) ва оддий (тутун, газ, сув)
  var COL = {};

  /* ---------------- олов манбалари ---------------- */
  var FIRES = [];
  function addFire(x, z, k, temp) { var f = { x: x, z: z, k: 0, kg: k, sm: 0, temp: !!temp, steam: 0 }; FIRES.push(f); return f; }
  function fireUpdate(dt) {
    if (!dt) return;
    for (var j = 0; j < FIRES.length; j++) {
      var f = FIRES[j];
      f.k += (f.kg - f.k) * Math.min(1, dt * 1.2);
      f.sm += (Math.max(f.k, 0) - f.sm) * Math.min(1, dt * (f.k > f.sm ? 0.8 : 0.12));
      var nf = f.k * dt * 70, ns = f.sm * dt * 16, nw = f.steam * dt * 14;
      for (var a = 0; a < nf; a++) {
        if (rnd() > nf - a) break;
        PADD.emit(f.x + R(-1.4, 1.4), R(0.2, 1.2), f.z + R(-1.4, 1.4), R(-0.6, 0.6), R(3, 6.5), R(-0.6, 0.6), R(0.5, 1.1), R(2.2, 3.4), 0.4, 0.95, rnd() < 0.5 ? COL.f1 : COL.f2, 1.5, 0.6);
      }
      for (a = 0; a < ns; a++) {
        if (rnd() > ns - a) break;
        PNRM.emit(f.x + R(-1, 1), R(2.5, 4), f.z + R(-1, 1), R(0.6, 2.2), R(3.5, 6.5), R(0.2, 1.4), R(8, 13), R(3, 5), R(20, 34), 0.62, rnd() < 0.5 ? COL.sm1 : COL.sm2, 0.05, 0.08);
      }
      for (a = 0; a < nw; a++) {
        if (rnd() > nw - a) break;
        PNRM.emit(f.x + R(-2, 2), R(1, 3), f.z + R(-2, 2), R(-0.5, 1.5), R(3, 5), R(-0.5, 0.5), R(3, 5), 3, 14, 0.45, COL.steam, 0.2, 0.2);
      }
      if (f.temp && f.kg === 0 && f.sm < 0.02) { FIRES.splice(j, 1); j--; }
    }
  }

  /* ---------------- ҳаракатдаги объектлар (йўл бўйлаб) ---------------- */
  var MOVERS = [];
  function mover(obj, key, s0, s1, lat, speed, t0, onEnd, yOff) {
    var m = { obj: obj, key: key, s0: s0, s1: s1, lat: lat, sp: speed, t0: t0, end: onEnd, y: yOff || 0, done: false };
    MOVERS.push(m); var p = at(key, s0, lat); obj.position.set(p.x, m.y, p.z); obj.rotation.y = p.yaw + (s1 < s0 ? PI : 0); return m;
  }
  function moversUpdate() {
    for (var i = 0; i < MOVERS.length; i++) {
      var m = MOVERS[i]; if (m.done) continue;
      var el = S.t - m.t0; if (el < 0) continue;
      var dir = m.s1 >= m.s0 ? 1 : -1, s = m.s0 + dir * el * m.sp;
      if ((dir > 0 && s >= m.s1) || (dir < 0 && s <= m.s1)) { s = m.s1; m.done = true; }
      var p = at(m.key, s, m.lat); m.obj.position.set(p.x, m.y, p.z); m.obj.rotation.y = p.yaw + (dir < 0 ? PI : 0);
      if (m.done && m.end) m.end(m);
    }
  }
  // оддий чизиқли силжиш (бир нуқтадан иккинчисига)
  var TWS = [];
  function tween(dur, delay, f, done) { TWS.push({ t0: S.t + (delay || 0), dur: dur, f: f, done: done }); }
  function tweensUpdate() {
    for (var i = 0; i < TWS.length; i++) {
      var w = TWS[i], u = (S.t - w.t0) / w.dur; if (u < 0) continue;
      if (u >= 1) u = 1; w.f(ease(u), u);
      if (u >= 1) { TWS.splice(i, 1); i--; if (w.done) w.done(); }
    }
  }
  function moveTo(obj, x, z, dur, delay, yaw) {
    var fx, fz, fy;
    tween(dur, delay, function (e) { if (fx == null) { fx = obj.position.x; fz = obj.position.z; fy = obj.rotation.y; } obj.position.x = fx + (x - fx) * e; obj.position.z = fz + (z - fz) * e; if (yaw != null) obj.rotation.y = angLerp(fy, yaw, Math.min(1, e * 3)); });
  }

  /* ---------------- техника ва одам геометриялари ---------------- */
  var GEO = {}, MAT = {};
  function buildGeoms() {
    GEO.fura = merge([box(15.8, 0.5, 2.4, 0, 0.95, 0, 0x202020), box(12.8, 3.5, 2.5, -1.4, 2.95, 0, 0xe6e6e6), box(2.4, 2.9, 2.45, 6.6, 2.2, 0, 0xffffff),
      box(0.1, 1.1, 2.2, 7.83, 2.85, 0, 0x16202b), box(0.12, 0.35, 2.3, 7.85, 1.25, 0, 0x444444),
      wheel(6.2, 1.15, 0.55, 0.45), wheel(6.2, -1.15, 0.55, 0.45), wheel(-4.6, 1.15, 0.55, 0.45), wheel(-4.6, -1.15, 0.55, 0.45), wheel(-6.0, 1.15, 0.55, 0.45), wheel(-6.0, -1.15, 0.55, 0.45)]);
    GEO.tank = merge([box(14.5, 0.5, 2.4, 0, 0.95, 0, 0x202020), [cyl(1.35, 1.35, 10.6, 16), { p: [-1.6, 2.6, 0], r: [0, 0, PI / 2] }, 0xd5d9de],
      box(0.6, 1.1, 1.0, -1.6, 4.0, 0, 0xb0b5bb), box(2.4, 2.9, 2.45, 5.8, 2.2, 0, 0xffffff), box(0.1, 1.1, 2.2, 7.03, 2.85, 0, 0x16202b),
      [cyl(0.25, 0.25, 2.3, 8), { p: [-1.6, 2.6, 1.42], r: [0, 0, 0] }, 0xd12f2f],
      wheel(5.4, 1.15, 0.55, 0.45), wheel(5.4, -1.15, 0.55, 0.45), wheel(-4.4, 1.15, 0.55, 0.45), wheel(-4.4, -1.15, 0.55, 0.45), wheel(-5.8, 1.15, 0.55, 0.45), wheel(-5.8, -1.15, 0.55, 0.45)]);
    GEO.trac = merge([box(2.8, 1.4, 1.5, 0.8, 1.5, 0, 0xffffff), box(1.5, 1.7, 1.5, -0.7, 2.9, 0, 0xffffff), box(1.45, 1.3, 1.55, -0.7, 3.0, 0, 0x22303a),
      wheel(-0.9, 1.05, 1.05, 0.6), wheel(-0.9, -1.05, 1.05, 0.6), wheel(1.7, 0.95, 0.6, 0.4), wheel(1.7, -0.95, 0.6, 0.4), box(0.15, 1.0, 0.15, 1.6, 2.6, 0.4, 0x333333)]);
    GEO.car = merge([box(4.4, 0.8, 1.8, 0, 0.75, 0, 0xffffff), box(2.3, 0.65, 1.62, -0.25, 1.45, 0, 0x1e252e), wheel(1.4, 0.85, 0.34, 0.25), wheel(1.4, -0.85, 0.34, 0.25), wheel(-1.4, 0.85, 0.34, 0.25), wheel(-1.4, -0.85, 0.34, 0.25)]);
    // одамлар — батафсил: икки оёқ, пойабзал, тана, нур қайтарувчи чизиқлар, қўллар, кафт, бўйин, бош, соч/кепка/дубулға/ниқоб.
    // tint=1 — кийим (instance ранги: сариқ жилет, қора, форма), tint=0 — табиий ранглар (тери, шим, пойабзал)
    function person(head) {
      var bx = function () { return box.apply(null, arguments).concat([0]); };   // tint=0
      var SK = 0xc99b7a, PANTS = 0x2a2c33, BOOT = 0x151515;
      var P = [
        [cyl(0.075, 0.065, 0.78, 5), { p: [0, 0.47, 0.1] }, PANTS, 0], [cyl(0.075, 0.065, 0.78, 5), { p: [0, 0.47, -0.1] }, PANTS, 0],
        bx(0.26, 0.09, 0.12, 0.04, 0.05, 0.1, BOOT), bx(0.26, 0.09, 0.12, 0.04, 0.05, -0.1, BOOT),
        [cyl(0.2, 0.17, 0.26, 6), { p: [0, 0.92, 0] }, PANTS, 0],
        [BOX, { p: [0, 1.2, 0], s: [0.24, 0.56, 0.42] }, 0xffffff, 1],
        [cyl(0.055, 0.05, 0.56, 5), { p: [0.02, 1.17, 0.27], r: [0.12, 0, 0] }, 0xffffff, 1], [cyl(0.055, 0.05, 0.56, 5), { p: [0.02, 1.17, -0.27], r: [-0.12, 0, 0] }, 0xffffff, 1],
        bx(0.09, 0.1, 0.07, 0.03, 0.87, 0.3, SK), bx(0.09, 0.1, 0.07, 0.03, 0.87, -0.3, SK),
        [cyl(0.05, 0.055, 0.1, 5), { p: [0, 1.52, 0] }, SK, 0],
        [new THREE.SphereGeometry(0.11, 8, 6), { p: [0, 1.66, 0], s: [1, 1.1, 0.95] }, head === 'mask' ? 0x141414 : SK, 0]
      ];
      if (head === 'cap') P.push([BOX, { p: [0, 1.06, 0], s: [0.25, 0.05, 0.43] }, 0xdcdcdc, 0], [BOX, { p: [0, 1.28, 0], s: [0.25, 0.05, 0.43] }, 0xdcdcdc, 0]);   // жилет чизиқлари
      if (head === 'pol') P.push([new THREE.SphereGeometry(0.135, 8, 3, 0, PI * 2, 0, PI * 0.55), { p: [0, 1.67, 0] }, 0x2a3240, 0], bx(0.02, 0.06, 0.2, 0.135, 1.64, 0, 0x8fa3b8));
      else if (head === 'mask') P.push([new THREE.SphereGeometry(0.118, 8, 3, 0, PI * 2, 0, PI * 0.5), { p: [0, 1.68, 0] }, 0x0c0c0c, 0], bx(0.02, 0.025, 0.14, 0.11, 1.69, 0, 0xd0d0d0));
      else P.push([new THREE.SphereGeometry(0.115, 8, 3, 0, PI * 2, 0, PI * 0.45), { p: [0, 1.69, 0] }, 0x2b2118, 0], bx(0.12, 0.02, 0.2, 0.1, 1.72, 0, 0x3a3a3a));
      return merge(P);
    }
    GEO.man = person('cap'); GEO.manMask = person('mask'); GEO.manPol = person('pol');
    // узоқдан кўриниш учун содда модел (LOD): оёқ, тана, бош — ~40 учбурчак
    function personLo(hc) { return merge([[BOX, { p: [0, 0.45, 0], s: [0.2, 0.9, 0.34] }, 0x2a2c33, 0], [BOX, { p: [0, 1.2, 0], s: [0.26, 0.6, 0.46] }, 0xffffff, 1], [BOX, { p: [0, 1.65, 0], s: [0.2, 0.24, 0.2] }, hc, 0]]); }
    GEO.manLo = personLo(0xc99b7a); GEO.manMaskLo = personLo(0x141414); GEO.manPolLo = personLo(0x2a3240);    GEO.shield = merge([box(0.07, 1.05, 0.62, 0.32, 0.95, 0, 0x9aa4ae)]);
    GEO.container = merge([box(12, 2.6, 2.44, 0, 1.3, 0, 0xffffff), box(12.05, 0.12, 2.5, 0, 2.6, 0, 0xcccccc)]);
    GEO.bld = merge([box(1, 1, 1, 0, 0.5, 0, 0xffffff)]);
    GEO.house = merge([box(10, 4, 9, 0, 2, 0, 0xffffff), [new THREE.ConeGeometry(7.6, 3.2, 4), { p: [0, 5.6, 0], r: [0, PI / 4, 0] }, 0x8a4a35]]);
    GEO.tree = merge([[cyl(0.25, 0.35, 3, 5), { p: [0, 1.5, 0] }, 0x4a3524], [new THREE.ConeGeometry(2.4, 6.5, 7), { p: [0, 5.6, 0] }, 0x2f5a2c], [new THREE.ConeGeometry(1.8, 4.5, 7), { p: [0, 8.2, 0] }, 0x376b33]]);
    GEO.jersey = merge([box(3.6, 1.05, 0.9, 0, 0.52, 0, 0xc9c6bd), box(3.6, 0.3, 0.55, 0, 1.15, 0, 0xc9c6bd)]);
    GEO.pole = merge([[cyl(0.14, 0.2, 11, 6), { p: [0, 5.5, 0] }, 0x6d737a], box(2.6, 0.15, 0.15, 1.2, 11, 0, 0x6d737a), box(0.9, 0.25, 0.45, 2.4, 10.9, 0, 0xfff1c9)]);
    MAT.veh = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.18 });
    MAT.man = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 });
    // instance ранги фақат кийимга (tint) таъсир қилади — тери ва шим табиий рангда қолади
    MAT.man.onBeforeCompile = function (sh) {
      sh.vertexShader = 'attribute float tint;\n' + sh.vertexShader.replace('#include <color_vertex>',
        '#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n vColor = vec3( 1.0 );\n#endif\n#ifdef USE_COLOR\n vColor *= color;\n#endif\n#ifdef USE_INSTANCING_COLOR\n vColor.xyz = mix( vColor.xyz, vColor.xyz * instanceColor.xyz, tint );\n#endif');
    };
    MAT.bld = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.05 });
  }

  /* ---------------- ялпи техника моделлари (якка) ---------------- */
  function vehModel(kind) {
    var parts, light = null, scale = 1;
    switch (kind) {
      case 'suv_purkagich':
        parts = [box(9.5, 0.6, 2.5, 0, 1, 0, 0x1d1d1d), box(2.6, 2.8, 2.55, 3.6, 2.4, 0, 0x1f3f7a), box(0.1, 1.0, 2.3, 4.92, 3.0, 0, 0x14202c), [cyl(1.25, 1.25, 6, 14), { p: [-1.3, 2.6, 0], r: [0, 0, PI / 2] }, 0xe9eef2],
          [cyl(0.5, 0.6, 0.6, 10), { p: [2.6, 4.1, 0] }, 0x2b2f35], [cyl(0.12, 0.12, 2.6, 8), { p: [3.8, 4.4, 0], r: [0, 0, PI / 2 - 0.25] }, 0x2b2f35], wheel(3.4, 1.2, 0.55, 0.45), wheel(3.4, -1.2, 0.55, 0.45), wheel(-2.6, 1.2, 0.55, 0.45), wheel(-2.6, -1.2, 0.55, 0.45)];
        light = [3.6, 3.9]; break;
      case 'evakuator':
        parts = [box(10, 0.6, 2.5, 0, 1, 0, 0x1d1d1d), box(2.6, 2.8, 2.55, 3.8, 2.4, 0, 0xf2b705), box(0.1, 1.0, 2.3, 5.12, 3.0, 0, 0x14202c), box(6, 0.4, 2.5, -1.8, 1.6, 0, 0x50555c),
          box(0.6, 0.6, 0.6, -0.5, 2.2, 0, 0xf2b705), [cyl(0.22, 0.22, 6, 8), { p: [-2.4, 3.6, 0], r: [0, 0, -1.1] }, 0xf2b705], wheel(3.6, 1.2, 0.55, 0.45), wheel(3.6, -1.2, 0.55, 0.45), wheel(-2.8, 1.2, 0.55, 0.45), wheel(-2.8, -1.2, 0.55, 0.45), wheel(-4.2, 1.2, 0.55, 0.45), wheel(-4.2, -1.2, 0.55, 0.45)];
        light = [3.8, 3.9]; break;
      case 'fvv':
        parts = [box(9.5, 0.6, 2.5, 0, 1, 0, 0x1d1d1d), box(9.2, 2.6, 2.55, -0.2, 2.5, 0, 0xc8241c), box(0.1, 1.0, 2.3, 4.42, 3.0, 0, 0x14202c), box(7, 0.25, 0.9, -0.8, 4.05, 0, 0xbfc3c8),
          box(9.25, 0.25, 2.6, -0.2, 1.7, 0, 0xf2f2f2), wheel(3.2, 1.2, 0.55, 0.45), wheel(3.2, -1.2, 0.55, 0.45), wheel(-2.6, 1.2, 0.55, 0.45), wheel(-2.6, -1.2, 0.55, 0.45)];
        light = [3.6, 3.95]; break;
      case 'avtobus':
        parts = [box(12, 2.9, 2.55, 0, 1.85, 0, 0xf4f4f0), box(11.2, 0.85, 2.6, -0.2, 2.35, 0, 0x16202b), box(12.05, 0.35, 2.6, 0, 0.75, 0, 0x2f8f4e), box(0.1, 1.4, 2.3, 6.02, 2.2, 0, 0x16202b),
          wheel(4, 1.2, 0.5, 0.4), wheel(4, -1.2, 0.5, 0.4), wheel(-3.6, 1.2, 0.5, 0.4), wheel(-3.6, -1.2, 0.5, 0.4)]; break;
      case 'yxxb': case 'ambulance':
        var amb = kind === 'ambulance';
        parts = amb ? [box(5.6, 2.4, 2.1, 0, 1.6, 0, 0xf6f6f6), box(5.65, 0.35, 2.15, 0, 1.4, 0, 0xd12f2f), box(0.1, 0.9, 1.9, 2.82, 2.1, 0, 0x16202b), wheel(1.8, 0.95, 0.38, 0.3), wheel(1.8, -0.95, 0.38, 0.3), wheel(-1.8, 0.95, 0.38, 0.3), wheel(-1.8, -0.95, 0.38, 0.3)]
          : [box(4.7, 0.8, 1.85, 0, 0.75, 0, 0xf3f5f7), box(4.75, 0.22, 1.9, 0, 0.82, 0, 0x1f4fa8), box(2.3, 0.65, 1.65, -0.25, 1.45, 0, 0x1a222c), box(0.6, 0.18, 1.3, -0.2, 1.86, 0, 0x222222),
            wheel(1.45, 0.88, 0.34, 0.25), wheel(1.45, -0.88, 0.34, 0.25), wheel(-1.45, 0.88, 0.34, 0.25), wheel(-1.45, -0.88, 0.34, 0.25)];
        light = amb ? [1.2, 2.95] : [-0.2, 2.05]; break;
      case 'van':
        parts = [box(5.4, 2.3, 2.1, 0, 1.55, 0, 0x22385e), box(0.1, 0.9, 1.9, 2.72, 2.0, 0, 0x16202b), wheel(1.7, 0.95, 0.38, 0.3), wheel(1.7, -0.95, 0.38, 0.3), wheel(-1.7, 0.95, 0.38, 0.3), wheel(-1.7, -0.95, 0.38, 0.3)];
        light = [0, 2.8]; break;
      case 'dron':
        parts = [box(0.7, 0.22, 0.7, 0, 0, 0, 0x1b1f24), box(1.9, 0.07, 0.1, 0, 0.05, 0, 0x2a2f35), box(0.1, 0.07, 1.9, 0, 0.05, 0, 0x2a2f35),
          [cyl(0.42, 0.42, 0.03, 12), { p: [0.95, 0.12, 0] }, 0x8a949e], [cyl(0.42, 0.42, 0.03, 12), { p: [-0.95, 0.12, 0] }, 0x8a949e], [cyl(0.42, 0.42, 0.03, 12), { p: [0, 0.12, 0.95] }, 0x8a949e], [cyl(0.42, 0.42, 0.03, 12), { p: [0, 0.12, -0.95] }, 0x8a949e],
          [new THREE.SphereGeometry(0.16, 8, 6), { p: [0.3, -0.15, 0] }, 0x0b0b0b]];
        scale = 2.2; break;
      default: parts = [box(4, 2, 2, 0, 1, 0, 0x888888)];
    }
    var g = new THREE.Group();
    var vars = UNIT_GLB[kind];
    if (vars && vars.length) {
      // GLB модел: ўлчами ва йўналиши юклашда меъёрлаштирилган (олди +X, пастки нуқта 0); бир нечта бўлса — навбат билан алмашади
      var src = vars[(VARN[kind] = (VARN[kind] || 0) + 1) % vars.length], cl = src.clone(true); g.add(cl); g.userData.glb = true;
      if (light) light = [clamp(light[0], -src.userData.len / 2 + 0.6, src.userData.len / 2 - 0.6), src.userData.h + 0.06];
    } else { var m = new THREE.Mesh(merge(parts), MAT.veh); m.castShadow = true; m.receiveShadow = true; g.add(m); }
    g.scale.setScalar(scale); g.userData.vk = kind;
    if (light) addMigalka(g, light[0], light[1], kind === 'ambulance');
    return g;
  }
  // юклашдан олдин қурилган доимий техника (штаб, «Эркин» кордони) — GLB моделлар келгач алмаштирилади
  var VEH_PERSIST = [], VARN = {};
  function persistVeh(g) { VEH_PERSIST.push(g); return g; }
  function refreshPersistVeh() {
    VEH_PERSIST = VEH_PERSIST.map(function (g) {
      if (g.userData.glb || !g.parent || !(UNIT_GLB[g.userData.vk] || []).length) return g;
      var n = vehModel(g.userData.vk); n.position.copy(g.position); n.rotation.copy(g.rotation);
      g.parent.add(n); g.parent.remove(g);
      for (var i = MIG.length - 1; i >= 0; i--) if (MIG[i].obj === g) MIG.splice(i, 1);
      return n;
    });
  }
  function addMigalka(g, x, y, amb) {
    var r = glow(col(0xff2a2a), 2.6, 0), b = glow(amb ? col(0xff2a2a) : col(0x2a66ff), 2.6, 0);
    r.position.set(x, y, 0.45); b.position.set(x, y, -0.45); g.add(r); g.add(b);
    var red = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0xff2020 })), blu = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: amb ? 0xff2020 : 0x2050ff }));
    red.scale.set(0.3, 0.18, 0.5); blu.scale.set(0.3, 0.18, 0.5); red.position.set(x, y - 0.05, 0.45); blu.position.set(x, y - 0.05, -0.45); g.add(red); g.add(blu);
    MIG.push({ r: r, b: b, ph: rnd() * 10, obj: g });
  }
  function migUpdate() {
    var t = performance.now() / 1000;
    for (var i = 0; i < MIG.length; i++) {
      var m = MIG[i], k = (t * 2.2 + m.ph) % 1;
      m.r.material.opacity = k < 0.25 || (k > 0.32 && k < 0.42) ? 1 : 0.05;
      m.b.material.opacity = (k > 0.5 && k < 0.75) || (k > 0.82 && k < 0.92) ? 1 : 0.05;
    }
  }
  function removeMig(root) { MIG = MIG.filter(function (m) { var o = m.obj; while (o) { if (o === root) return false; o = o.parent; } return true; }); }

  /* ---------------- HTML ёрлиқлар ---------------- */
  function addLabel(html, pos, cls, onclick, pri) {
    var el = document.createElement('div'); el.className = 's3l ' + (cls || ''); el.innerHTML = html;
    if (onclick) { el.style.pointerEvents = 'auto'; el.addEventListener('click', function (e) { e.stopPropagation(); onclick(); }); }
    overlay.appendChild(el);
    var L = { el: el, p: pos.clone ? pos.clone() : V(pos.x, pos.y, pos.z), pri: pri || 0, on: true }; LABELS.push(L); return L;
  }
  function rmLabel(L) { if (!L) return; var i = LABELS.indexOf(L); if (i >= 0) LABELS.splice(i, 1); if (L.el.parentNode) L.el.parentNode.removeChild(L.el); }
  var _v = V(0, 0, 0);
  function labelsUpdate() {
    var w = host.clientWidth, h = host.clientHeight;
    for (var i = 0; i < LABELS.length; i++) {
      var L = LABELS[i];
      if (!L.on) { L.el.style.display = 'none'; continue; }
      _v.copy(L.p).project(camera);
      var dist = camera.position.distanceTo(L.p);
      var hide = _v.z > 1 || _v.x < -1.1 || _v.x > 1.1 || _v.y < -1.1 || _v.y > 1.1 || (L.pri === 1 && dist > 2600) || (L.pri === 2 && dist > 1400);
      if (hide) { if (L.el.style.display !== 'none') L.el.style.display = 'none'; continue; }
      L.el.style.display = '';
      L.el.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-_v.y * 0.5 + 0.5) * h).toFixed(1) + 'px) translate(-50%,-100%)';
    }
  }

  /* =====================================================================
     ОЛАМ ҚУРИЛИШИ
     ===================================================================== */
  var sE = 0;                          // «Эркин» маскани М-39 бўйлаб (м)
  var VEH = [];                        // блокада техникаси: {g, i, s, lat, side}
  var G = {};                          // InstancedMesh гуруҳлари
  var SITE = {};                       // процедурал локация гуруҳлари (glb келса — яширилади)
  var SCR = {};                        // HQ экранлари (canvas)
  var LOCL = {};                       // локация ёрлиқлари
  var LAMPS = [];

  function buildWorld() {
    STATIC = new THREE.Group(); DYN = new THREE.Group(); FX = new THREE.Group();
    scene.add(STATIC); scene.add(DYN); scene.add(FX);
    ['m39', 'bypass', 'airport', 'logi', 'green'].forEach(function (k) { buildCurve(k, BA.roadWorld(k)); });
    // колонна йўли: М-39 → туташма → аэропорт
    // колонна: М-39 → ТАЙ туташмаси → айланма йўл → ёқилғи шохобчалари → аэропорт
    // faqat haqiqiy yo'llar bo'ylab (dala kesib o'tmaydi): M-39 → TAY chorrahasi (CROSS) → halqa yo'l → aeroport yo'li
    var M = BA.ROADS.m39.pts, B = BA.ROADS.bypass.pts, ci = B.findIndex(function (p) { return p[0] === BA.CROSS[0] && p[1] === BA.CROSS[1]; });
    var ai = B.findIndex(function (p) { var a = BA.ROADS.airport.pts[0]; return p[0] === a[0] && p[1] === a[1]; });
    var cv = M.slice(1, 8).concat(B.slice(ci, ai), BA.ROADS.airport.pts).map(function (p) { return BA.enToWorld(p[0], p[1]); });
    buildCurve('convoy', cv);
    sE = nearestS('m39', 0, 0);

    // ер
    var gtex = canvasTex(1024, 1024, function (g, w, h) {
      g.fillStyle = '#6f7a55'; g.fillRect(0, 0, w, h);
      var cs = ['#77824f', '#6a7547', '#857c55', '#5f6b44', '#8a8a5c', '#7b6f4c', '#69794d'];
      for (var i = 0; i < 70; i++) { g.fillStyle = cs[i % cs.length]; g.save(); g.translate(rnd() * w, rnd() * h); g.rotate(R(-0.3, 0.3)); g.fillRect(-R(40, 160), -R(30, 120), R(80, 320), R(60, 240)); g.restore(); }
      for (i = 0; i < 26000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '255,255,255,.05' : '0,0,0,.07') + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    });
    gtex.repeat.set(70, 70);
    ground = new THREE.Mesh(new THREE.PlaneGeometry(70000, 70000), new THREE.MeshStandardMaterial({ map: gtex, roughness: 1, metalness: 0 }));
    ground.rotation.x = -PI / 2; ground.position.set(5000, 0, -4000); ground.receiveShadow = true; STATIC.add(ground);
    // шаҳар ҳудуди (кулранг асфальт қатлами)
    var city = new THREE.Mesh(new THREE.CircleGeometry(3600, 48), new THREE.MeshStandardMaterial({ color: col(0x7b7d78), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    city.rotation.x = -PI / 2; city.position.set(9300, 0.02, -7600); city.receiveShadow = true; STATIC.add(city); G.city = city;

    // йўллар
    var t8 = roadTex(34, 4, 2), t4 = roadTex(18, 2, 2), t2 = roadTex(12, 1, 0), tg = roadTex(7, 1, 0);
    function rmat(t) { return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }
    var shoulder = new THREE.MeshStandardMaterial({ color: col(0x8f8b7e), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    G.roads = [];
    function addRoad(m, kind) { STATIC.add(m); G.roads.push({ m: m, sat: m.material, kind: kind }); return m; }
    addRoad(ribbon('m39', 46, 0.04, shoulder, 30), 'sh');
    addRoad(ribbon('m39', 34, 0.08, rmat(t8), 24), 'm39');
    addRoad(ribbon('bypass', 18, 0.07, rmat(t4), 24), 'r');
    addRoad(ribbon('airport', 18, 0.07, rmat(t4), 24), 'r');
    addRoad(ribbon('logi', 12, 0.07, rmat(t2), 24), 'r');
    G.greenRoad = addRoad(ribbon('green', 7, 0.09, rmat(tg), 24), 'r');

    buildGeoms();
    buildErkin(); buildLogistics(); buildAirport(); buildBypass(); buildFuel(); buildHQ(); buildCityAndNature(); buildExtras(); buildOSM();
    buildBlockade();
    buildLocLabels();
  }

  /* ----- «Эркин» ЙПХ маскани ----- */
  var ERK_SIGN, SIGNS = [];
  // ёзувли материал — тил алмашганда relabelCanvas() барчасини қайта чизади
  function signMat() { var a = [].slice.call(arguments), m = new THREE.MeshBasicMaterial({ map: signTex.apply(null, a) }); SIGNS.push([m, a]); return m; }
  function signTex(text, sub, w, h, bg, fg) {
    return canvasTex(w || 1024, h || 128, function (g, W, H) {
      g.fillStyle = bg || '#0b2a4a'; g.fillRect(0, 0, W, H);
      g.fillStyle = fg || '#ffffff'; g.font = '900 ' + Math.round(H * 0.5) + 'px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(T(text), W / 2, sub ? H * 0.38 : H / 2);
      if (sub) { g.font = '600 ' + Math.round(H * 0.22) + 'px Inter, Arial, sans-serif'; g.fillStyle = '#9fd0ff'; g.fillText(T(sub), W / 2, H * 0.78); }
    });
  }
  function buildErkin() {
    var grp = new THREE.Group(); SITE.loc_erkin = grp; STATIC.add(grp);
    var p = at('m39', sE, 0), yaw = p.yaw;
    var arch = new THREE.Group(); arch.position.set(p.x, 0, p.z); arch.rotation.y = yaw; grp.add(arch);
    var conc = new THREE.MeshStandardMaterial({ color: col(0xd9dde2), roughness: 0.7, metalness: 0.1 });
    var steel = new THREE.MeshStandardMaterial({ color: col(0x1d5fa8), roughness: 0.4, metalness: 0.6 });
    [-21, -7, 7, 21].forEach(function (l) { var c = new THREE.Mesh(cyl(0.7, 0.8, 9, 12), conc); c.position.set(0, 4.5, -l); c.castShadow = true; arch.add(c); });
    var roof = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 50), steel); roof.position.set(0, 9.6, 0); roof.castShadow = true; arch.add(roof);
    var under = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.2, 49.6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: col(0xfff3d6), emissiveIntensity: 0.6 })); under.position.set(0, 8.75, 0); arch.add(under);
    ERK_SIGN = signMat('«ЭРКИН» ЙПХ • М-39', 'ТОШКЕНТ ШАҲРИГА КИРИШ', 1024, 160);
    [8.05, -8.05].forEach(function (x) { var s = new THREE.Mesh(new THREE.PlaneGeometry(40, 6.2), ERK_SIGN); s.position.set(x, 9.6, 0); s.rotation.y = x > 0 ? PI / 2 : -PI / 2; arch.add(s); });
    // кабиналар ва шлагбаумлар
    [-14, -3.5, 3.5, 14].forEach(function (l) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 1.8), conc); b.position.set(0, 1.4, -l); b.castShadow = true; arch.add(b);
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 6.5), new THREE.MeshStandardMaterial({ color: 0xff3b30 })); bar.position.set(2, 1.1, -l - 3.2 * Math.sign(l)); arch.add(bar);
    });
    // ЙПХ биноси (шимолий томон)
    var bp = at('m39', sE + 40, 48);
    var bld = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 16), new THREE.MeshStandardMaterial({ color: col(0xe8e4da), roughness: 0.8 }));
    bld.position.set(bp.x, 4.5, bp.z); bld.rotation.y = yaw; bld.castShadow = true; bld.receiveShadow = true; grp.add(bld);
    var bs = new THREE.Mesh(new THREE.PlaneGeometry(30, 2.4), signMat('ИИББ • ЙПХ «ЭРКИН»', null, 1024, 96, '#0d3b6e'));
    var fp = at('m39', sE + 40, 39.9); bs.position.set(fp.x, 7.6, fp.z); bs.rotation.y = yaw; grp.add(bs);
    var mast = new THREE.Mesh(cyl(0.15, 0.2, 22, 6), new THREE.MeshStandardMaterial({ color: 0x8a9097, metalness: 0.6 })); mast.position.set(bp.x + 10, 11, bp.z); grp.add(mast);
    // кўча чироқлари (М-39, Эркин атрофида)
    var lampG = new IG(GEO.pole, MAT.veh, 260, false); DYN.add(lampG.m);
    var gl = [];
    for (var s = sE - 1500; s <= sE + 1500; s += 55) {
      [1, -1].forEach(function (side) { var q = at('m39', s, side * 19); lampG.add(q.x, 0, q.z, q.yaw + (side > 0 ? -PI / 2 : PI / 2), 1); var h = at('m39', s, side * 16.6); gl.push(h.x, 10.9, h.z); });
    }
    lampG.update();
    var lg = new THREE.BufferGeometry(), n = gl.length / 3;
    lg.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3));
    lg.setAttribute('size', new THREE.Float32BufferAttribute(new Array(n).fill(9), 1));
    lg.setAttribute('alpha', new THREE.Float32BufferAttribute(new Array(n).fill(0.55), 1));
    var lc = []; for (var i = 0; i < n; i++) lc.push(1, 0.78, 0.45);
    lg.setAttribute('pcolor', new THREE.Float32BufferAttribute(lc, 3));
    var lm = new THREE.ShaderMaterial({ vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uScale: { value: 500 }, uSoft: { value: 2.0 } } });
    var lp = new THREE.Points(lg, lm); lp.frustumCulled = false; DYN.add(lp); LAMPS.push(lm);
    G.lampPts = lm;
  }

  /* ----- Логистика маркази ----- */
  function buildLogistics() {
    var L = BA.byId('loc_log'), grp = new THREE.Group(); SITE.loc_log = grp; STATIC.add(grp);
    var cx = L.x - 150, cz = L.z + 250;   // ҳовли айланма йўлдан жанубда
    var yard = new THREE.Mesh(new THREE.PlaneGeometry(720, 420), new THREE.MeshStandardMaterial({ color: col(0x8d8f8c), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    yard.rotation.x = -PI / 2; yard.position.set(cx, 0.05, cz); yard.receiveShadow = true; grp.add(yard);
    var wtex = canvasTex(256, 128, function (g, w, h) { g.fillStyle = '#d7dbe0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b9c0c8'; for (var x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); g.fillStyle = '#3b4a5c'; for (x = 12; x < w; x += 40) g.fillRect(x, h - 46, 24, 46); g.fillStyle = '#1f6fb2'; g.fillRect(0, 0, w, 10); });
    var wm = new THREE.MeshStandardMaterial({ map: wtex, roughness: 0.75, metalness: 0.2 });
    for (var k = 0; k < 5; k++) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(118, 15, 48), wm); b.position.set(cx - 260 + k * 130, 7.5, cz - 120); b.castShadow = true; b.receiveShadow = true; grp.add(b);
      var rf = new THREE.Mesh(new THREE.BoxGeometry(118, 0.6, 50), new THREE.MeshStandardMaterial({ color: col(0x9aa3ad), metalness: 0.5, roughness: 0.4 })); rf.position.set(b.position.x, 15.3, b.position.z); grp.add(rf);
    }
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(110, 9), signMat('ТОШКЕНТ ХАЛҚАРО ЛОГИСТИКА МАРКАЗИ', null, 1024, 96, '#0f3d2a'));
    sign.position.set(cx, 19, cz - 95.5); grp.add(sign);
    SCR.logSign = sign.material;
    var cont = new IG(GEO.container, MAT.veh, 520, true); grp.add(cont.m);
    var cc = [0xb03a2e, 0x1f5fa8, 0x2e8b57, 0xd98c1f, 0x6b6f75, 0xe6e6e6, 0x7b2f6b].map(col);
    for (var r = 0; r < 8; r++) for (var c2 = 0; c2 < 22; c2++) {
      var hgt = 1 + Math.floor(rnd() * 3);
      for (var h = 0; h < hgt; h++) cont.add(cx - 280 + c2 * 14, h * 2.62, cz + 20 + r * 3.2 + (r > 3 ? 8 : 0), 0, 1, cc[Math.floor(rnd() * cc.length)]);
    }
    cont.update(); G.cont = cont;
    // девор
    var fen = new THREE.Mesh(new THREE.BoxGeometry(720, 2.4, 0.3), new THREE.MeshStandardMaterial({ color: col(0x9aa0a6), metalness: 0.4 }));
    fen.position.set(cx, 1.2, cz + 210); grp.add(fen);
  }

  /* ----- Аэропорт юк терминали ----- */
  function buildAirport() {
    var L = BA.byId('loc_airp_cargo'), grp = new THREE.Group(); SITE.loc_airp_cargo = grp; STATIC.add(grp);
    var conc = new THREE.MeshStandardMaterial({ color: col(0xa9aba6), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    var apron = new THREE.Mesh(new THREE.PlaneGeometry(900, 420), conc); apron.rotation.x = -PI / 2; apron.position.set(L.x, 0.05, L.z - 380); apron.receiveShadow = true; grp.add(apron);
    var rtex = canvasTex(1024, 128, function (g, w, h) { noise(g, w, h, '#3d4044', 0.1, 6000); g.fillStyle = '#f2f2f2'; for (var x = 20; x < w; x += 64) g.fillRect(x, h / 2 - 2, 34, 4); g.fillRect(0, 6, w, 3); g.fillRect(0, h - 9, w, 3); });
    rtex.repeat.set(4, 1);
    var rw = new THREE.Mesh(new THREE.PlaneGeometry(3600, 60), new THREE.MeshStandardMaterial({ map: rtex, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    rw.rotation.x = -PI / 2; rw.position.set(L.x - 200, 0.07, L.z - 760); rw.receiveShadow = true; grp.add(rw);
    var term = new THREE.Mesh(new THREE.BoxGeometry(300, 22, 72), new THREE.MeshStandardMaterial({ color: col(0xdfe3e8), roughness: 0.5, metalness: 0.3 }));
    term.position.set(L.x, 11, L.z - 100); term.castShadow = true; term.receiveShadow = true; grp.add(term);
    var glass = new THREE.Mesh(new THREE.BoxGeometry(300.5, 7, 72.5), new THREE.MeshStandardMaterial({ color: col(0x2a4f70), roughness: 0.15, metalness: 0.8 })); glass.position.set(L.x, 14, L.z - 100); grp.add(glass);
    var s = new THREE.Mesh(new THREE.PlaneGeometry(120, 9), signMat('ТОШКЕНТ ХАЛҚАРО АЭРОПОРТИ • ЮК ТЕРМИНАЛИ', null, 1024, 80, '#123a6b'));
    s.position.set(L.x, 26, L.z - 63.6); grp.add(s);
    // юк самолёти
    var pl = new THREE.Group(), wm = new THREE.MeshStandardMaterial({ color: col(0xf4f6f8), roughness: 0.35, metalness: 0.4 });
    var fus = new THREE.Mesh(cyl(3.2, 3.2, 52, 20), wm); fus.rotation.z = PI / 2; fus.position.y = 6; pl.add(fus);
    var nose = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 12), wm); nose.scale.set(1.8, 1, 1); nose.position.set(26, 6, 0); pl.add(nose);
    var tail = new THREE.Mesh(cyl(3.2, 0.8, 12, 16), wm); tail.rotation.z = PI / 2; tail.position.set(-32, 7, 0); pl.add(tail);
    var wing = new THREE.Mesh(new THREE.BoxGeometry(9, 0.7, 60), wm); wing.position.set(0, 4.8, 0); wing.castShadow = true; pl.add(wing);
    var fin = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 0.6), new THREE.MeshStandardMaterial({ color: col(0x1d4f91) })); fin.position.set(-34, 13, 0); pl.add(fin);
    var hs = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 20), wm); hs.position.set(-35, 8, 0); pl.add(hs);
    [-20, -10, 10, 20].forEach(function (z) { var e = new THREE.Mesh(cyl(1.3, 1.3, 4.5, 12), new THREE.MeshStandardMaterial({ color: col(0x9aa3ad), metalness: 0.7 })); e.rotation.z = PI / 2; e.position.set(2, 3.2, z); pl.add(e); });
    var stripe = new THREE.Mesh(cyl(3.22, 3.22, 46, 20, 1, true), new THREE.MeshStandardMaterial({ color: col(0x1d4f91) })); stripe.rotation.z = PI / 2; stripe.position.y = 6; stripe.scale.set(1, 1, 0.25); pl.add(stripe);
    pl.position.set(L.x - 80, 0, L.z - 330); pl.rotation.y = 0.3; pl.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } }); grp.add(pl);
    // ёқилғи омбори
    var tm = new THREE.MeshStandardMaterial({ color: col(0xe8ebee), metalness: 0.5, roughness: 0.4 });
    for (var i = 0; i < 6; i++) { var t = new THREE.Mesh(cyl(11, 11, 13, 24), tm); t.position.set(L.x + 260 + (i % 3) * 30, 6.5, L.z - 40 - Math.floor(i / 3) * 30); t.castShadow = true; grp.add(t); }
    // ULD контейнерлар
    var u = new IG(GEO.container, MAT.veh, 60, true); grp.add(u.m);
    for (i = 0; i < 48; i++) u.add(L.x + 80 + (i % 12) * 13, 0, L.z - 180 - Math.floor(i / 12) * 4, 0, 0.55, col(i % 3 ? 0xb8bfc6 : 0x2b6cb0));
    u.update();
  }

  /* ----- ТАЙ туташмаси («Эркин» постидан 700 м шаҳар томонда, Google Maps бўйича икки катта ҳалқа) ва айланма йўл пости ----- */
  function buildBypass() {
    var L = BA.byId('loc_bypass'), grp = new THREE.Group(); SITE.loc_bypass = grp; STATIC.add(grp);
    var mat = new THREE.MeshStandardMaterial({ map: roadTex(9, 1, 0), roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    var c = BA.enToWorld(BA.CROSS[0], BA.CROSS[1]), dM = V(0.707, 0, -0.707), nW = V(-0.707, 0, -0.707);   // М-39 йўналиши ва унга перпендикуляр
    // OSM бўлса — ҳақиқий туташма рампалари (trunk_link) OSM йўлларидан чизилади
    (window.ATROF ? [] : [[1, 1], [-1, -1]]).forEach(function (q, k) {
      var cx = c.x + dM.x * 175 * q[0] + nW.x * 135 * q[1], cz = c.z + dM.z * 175 * q[0] + nW.z * 135 * q[1], pts = [], a0 = Math.atan2(c.z - cz, c.x - cx);
      for (var a = 0; a <= 20; a++) { var an = a0 + 0.35 + a / 20 * PI * 1.65; pts.push({ x: cx + Math.cos(an) * 118, z: cz + Math.sin(an) * 118 }); }
      buildCurve('ramp' + k, pts); var rm = ribbon('ramp' + k, 9, 0.065, mat, 24); grp.add(rm); G.roads.push({ m: rm, sat: mat, kind: 'r' });
      var lawn = new THREE.Mesh(new THREE.CircleGeometry(112, 40), new THREE.MeshStandardMaterial({ color: col(0x6f8a4e), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      lawn.rotation.x = -PI / 2; lawn.position.set(cx, 0.03, cz); grp.add(lawn);
    });
    // айланма йўлдаги ЙПХ пости
    var post = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 9), new THREE.MeshStandardMaterial({ color: col(0xe6e2d8) })); post.position.set(L.x + 40, 2.25, L.z - 40); post.castShadow = true; grp.add(post);
    var can = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 14), new THREE.MeshStandardMaterial({ color: col(0x1d5fa8), metalness: 0.5 })); can.position.set(L.x + 40, 6.5, L.z - 40); grp.add(can);
  }
  /* ----- Ёқилғи шохобчалари ----- */
  function buildFuel() {
    var L = BA.byId('loc_fuel'), grp = new THREE.Group(); SITE.loc_fuel = grp; STATIC.add(grp);
    var canopyM = new THREE.MeshStandardMaterial({ color: col(0xf2f2f2), roughness: 0.5, emissive: col(0xffffff), emissiveIntensity: 0.08 });
    var stripeM = new THREE.MeshStandardMaterial({ color: col(0x1f7a3a), emissive: col(0x1f7a3a), emissiveIntensity: 0.3 });
    var cars = new IG(GEO.car, MAT.veh, 420, false); DYN.add(cars.m); G.fuelCars = cars;
    var cc = [0xf2f2f2, 0x1b1b1b, 0x9aa3ad, 0x8b1e1e, 0x1f4f8a, 0xc9c1a8, 0x2e5e3a].map(col);
    var sa = nearestS('airport', L.x, L.z), sb = nearestS('bypass', L.x, L.z);
    var spots = [['airport', sa - 700, 32], ['airport', sa - 380, -32], ['airport', sa - 60, 32], ['airport', sa + 260, -32], ['airport', sa + 580, 32], ['airport', sa + 900, -32]];  void sb;
    spots.forEach(function (sp) {
      var p = at(sp[0], sp[1], sp[2]), st = new THREE.Group(); st.position.set(p.x, 0, p.z); st.rotation.y = p.yaw; grp.add(st);
      var pad = new THREE.Mesh(new THREE.PlaneGeometry(60, 36), new THREE.MeshStandardMaterial({ color: col(0x9c9e9a), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); pad.rotation.x = -PI / 2; pad.position.y = 0.05; pad.receiveShadow = true; st.add(pad);
      var can = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 16), canopyM); can.position.y = 6.2; can.castShadow = true; st.add(can);
      var str = new THREE.Mesh(new THREE.BoxGeometry(30.2, 0.5, 16.2), stripeM); str.position.y = 6.0; st.add(str);
      [[-12, -6], [-12, 6], [12, -6], [12, 6]].forEach(function (c) { var pi = new THREE.Mesh(cyl(0.3, 0.3, 6, 8), canopyM); pi.position.set(c[0], 3, c[1]); st.add(pi); });
      for (var k = 0; k < 4; k++) { var pu = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.7), new THREE.MeshStandardMaterial({ color: col(0x2c7a4a) })); pu.position.set(-9 + k * 6, 0.9, 0); st.add(pu); }
      var shop = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 9), new THREE.MeshStandardMaterial({ color: col(0xe0ddd2) })); shop.position.set(0, 2.25, 14); shop.castShadow = true; st.add(shop);
      var sg = glow(col(0xff3b30), 6, 0.9); sg.position.set(14, 8, 0); st.add(sg);  // «ЁҚИЛҒИ ЙЎҚ» сигнали
      // километрлик навбат
      for (var q = 0; q < 60; q++) { var cp = at(sp[0], sp[1] - 40 - q * 6.2, sp[2] > 0 ? 6.5 : -6.5); cars.add(cp.x, 0, cp.z, cp.yaw, 1, cc[Math.floor(rnd() * cc.length)]); }
    });
    cars.update();
  }

  /* ----- ИИББ Вазиятлар маркази ----- */
  function hqScreenTex(mode) {
    return canvasTex(1024, 420, function (g, w, h) {
      g.fillStyle = '#04101f'; g.fillRect(0, 0, w, h);
      if (mode === 'media') {
        g.fillStyle = '#0c4a2c'; g.fillRect(0, 0, w, 70);
        g.fillStyle = '#fff'; g.font = '800 40px Inter, Arial'; g.textAlign = 'left'; g.fillText(T('ЖОНЛИ ЭФИР • БРИФИНГ'), 24, 48);
        g.font = '800 44px Inter, Arial'; g.fillStyle = '#7ff5b4';
        [T('Магистраллар очилди'), T('Ёқилғи ва озиқ-овқат захираси етарли'), T('Ташувчиларга субсидиялар ажратилди')].forEach(function (t, i) { g.fillText('✓ ' + t, 30, 150 + i * 80); });
        g.fillStyle = '#d12f2f'; g.fillRect(w - 130, 18, 100, 36); g.fillStyle = '#fff'; g.font = '800 24px Inter'; g.fillText(T('ЖОНЛИ'), w - 118, 45);
        return;
      }
      g.strokeStyle = '#1d4f7a'; g.lineWidth = 1; for (var x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (var y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.strokeStyle = mode === 'plan' ? '#2fd27a' : '#ff4d4d'; g.lineWidth = 10; g.beginPath(); g.moveTo(40, 360); g.quadraticCurveTo(400, 300, 620, 220); g.quadraticCurveTo(820, 150, 990, 40); g.stroke();
      g.fillStyle = '#fff'; g.font = '800 34px Inter, Arial'; g.fillText(T(mode === 'plan' ? '«БАРҲАМ» РЕЖАСИ • 3-РЕЖИМ' : 'М-39 • ТРАНСПОРТ ТИРБАНДЛИГИ'), 24, 50);
      g.fillStyle = mode === 'plan' ? '#2fd27a' : '#ff4d4d'; g.font = '700 26px Inter, Arial'; g.fillText(mode === 'plan' ? T('✓ МАҚБУЛ ҚАРОР ҚАБУЛ ҚИЛИНДИ') : '⚠ 1 800 / 14 000', 24, 92);
    });
  }
  function buildHQ() {
    var L = BA.byId('loc_hq'), grp = new THREE.Group(); SITE.loc_hq = grp; STATIC.add(grp);
    var wt = canvasTex(256, 512, function (g, w, h) { g.fillStyle = '#c9cdd2'; g.fillRect(0, 0, w, h); for (var y = 8; y < h; y += 26) for (var x = 6; x < w; x += 22) { g.fillStyle = rnd() < 0.35 ? '#ffe3a6' : '#25384d'; g.fillRect(x, y, 14, 16); } });
    var b = new THREE.Mesh(new THREE.BoxGeometry(64, 58, 44), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.6, metalness: 0.2 })); b.position.set(L.x, 29, L.z - 40); b.castShadow = true; b.receiveShadow = true; grp.add(b);
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(200, 140), new THREE.MeshStandardMaterial({ color: col(0xb9b6ad), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); pl.rotation.x = -PI / 2; pl.position.set(L.x, 0.06, L.z + 20); pl.receiveShadow = true; grp.add(pl);
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), signMat('ТОШКЕНТ ШАҲАР ИИББ • ВАЗИЯТЛАР МАРКАЗИ', null, 1024, 100, '#0b2a4a'));
    sign.position.set(L.x, 52, L.z - 17.9); grp.add(sign); SCR.hqSign = sign.material;
    SCR.wall = new THREE.MeshBasicMaterial({ map: hqScreenTex('base') });
    var wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 18), SCR.wall); wall.position.set(L.x, 14, L.z + 55); wall.rotation.y = PI; grp.add(wall);
    var wall2 = new THREE.Mesh(new THREE.PlaneGeometry(44, 18), SCR.wall); wall2.position.set(L.x, 14, L.z + 55.2); grp.add(wall2);
    var frame = new THREE.Mesh(new THREE.BoxGeometry(46, 20, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111 })); frame.position.set(L.x, 14, L.z + 55.1); grp.add(frame);
    var legs = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1), new THREE.MeshStandardMaterial({ color: 0x333333 })); legs.position.set(L.x, 2.5, L.z + 55); grp.add(legs);
    var mast = new THREE.Mesh(cyl(0.3, 0.5, 26, 8), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7 })); mast.position.set(L.x + 20, 71, L.z - 40); grp.add(mast);
    G.beacon = glow(col(0x2fd27a), 18, 0); G.beacon.position.set(L.x + 20, 85, L.z - 40); grp.add(G.beacon);
    var hp = new THREE.Mesh(new THREE.RingGeometry(7, 9, 32), new THREE.MeshBasicMaterial({ color: 0xffd24a })); hp.rotation.x = -PI / 2; hp.position.set(L.x - 22, 58.1, L.z - 40); grp.add(hp);
    for (var i = 0; i < 6; i++) { var c = persistVeh(vehModel('yxxb')); c.position.set(L.x - 60 + i * 7, 0, L.z + 75); c.rotation.y = PI / 2; DYN.add(c); }
  }

  /* ----- шаҳар, қишлоқлар, дарахтлар ----- */
  function buildCityAndNature() {
    var bt = canvasTex(128, 256, function (g, w, h) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (var y = 6; y < h; y += 16) for (var x = 5; x < w; x += 14) { g.fillStyle = rnd() < 0.22 ? '#ffe2a0' : '#5d6c7c'; g.fillRect(x, y, 8, 9); } });
    var bm = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8, metalness: 0.1, vertexColors: true });
    var bld = new IG(GEO.bld, bm, 1700, true); STATIC.add(bld.m); G.bld = bld.m;
    var bc = [0xe8e2d4, 0xd6d9dd, 0xc9bfae, 0xf0ece2, 0xb8c0c8, 0xd9cbb5].map(col);
    var tries = 0;
    while (bld.n < 1650 && tries++ < 20000) {
      var a = rnd() * PI * 2, r = Math.sqrt(rnd()) * 3500, x = 9300 + Math.cos(a) * r, z = -7600 + Math.sin(a) * r;
      if (Math.hypot(x - 9920, z + 8888) < 170) continue;
      if (x > 9300 && z < -3300 && z > -4900) continue; // аэропорт
      if (distRoad('m39', x, z) < 45 || distRoad('airport', x, z) < 40 || distRoad('bypass', x, z) < 40) continue;
      var w = R(18, 46), d = R(14, 40), h = rnd() < 0.15 ? R(45, 90) : R(10, 34);
      var i = bld.add(x, 0, z, R(-0.2, 0.2) + 0.5, 1, bc[Math.floor(rnd() * bc.length)]);
      _o.position.set(x, 0, z); _o.rotation.set(0, bld.r[i], 0); _o.scale.set(w, h, d); _o.updateMatrix(); bld.m.setMatrixAt(i, _o.matrix);
    }
    bld.m.instanceMatrix.needsUpdate = true;
    // қишлоқ уйлари (вилоят томони)
    var hs = new IG(GEO.house, MAT.bld, 600, true); STATIC.add(hs.m); G.houses = hs.m;
    tries = 0;
    while (hs.n < 560 && tries++ < 12000) {
      var cxs = [[-1500, 700], [-900, -800], [800, 900], [2600, -1500], [-2600, 400], [2900, 1300]], c = cxs[Math.floor(rnd() * cxs.length)];
      var hx = c[0] + R(-420, 420), hz = c[1] + R(-320, 320);
      if (distRoad('m39', hx, hz) < 90 || distRoad('bypass', hx, hz) < 40 || distRoad('green', hx, hz) < 30) continue;
      if (Math.hypot(hx - 2150, hz + 800) < 420) continue;
      if (window.ATROF && hx > -900 && hx < 3200 && hz > -2950 && hz < 1100) continue;   // OSM ҳудудида ҳақиқий бинолар бор
      hs.add(hx, 0, hz, R(0, PI), R(0.8, 1.2), col([0xece6d8, 0xe2d6bf, 0xd8d1c4][Math.floor(rnd() * 3)]));
    }
    hs.update();
    // дарахтлар (йўл бўйлаб ва боғлар)
    var tr = new IG(GEO.tree, MAT.bld, 3400, true); STATIC.add(tr.m); G.trees = tr.m;
    ['m39', 'bypass', 'airport'].forEach(function (k) {
      var rr = RD[k];
      for (var s = 0; s < rr.L; s += 14) {
        [1, -1].forEach(function (side) { if (rnd() < 0.35) return; var p = at(k, s, side * R(30, 48)); if (Math.hypot(p.x - 2150, p.z + 800) < 400) return; tr.add(p.x, 0, p.z, R(0, PI), R(0.7, 1.3)); });
      }
    });
    tries = 0;
    while (tr.n < 3350 && tries++ < 20000) {
      var tx = R(-3000, 13000), tz = R(-11000, 1600);
      if (distRoad('m39', tx, tz) < 40 || distRoad('airport', tx, tz) < 30 || distRoad('bypass', tx, tz) < 30) continue;
      if (tx > 9300 && tz < -3300 && tz > -4900) continue;
      tr.add(tx, 0, tz, R(0, PI), R(0.7, 1.4));
    }
    tr.update();
  }

  /* ----- БЛОКАДА: 1 800 техника, иштирокчилар, провокаторлар, олов ----- */
  var PROV_IDX = [], VEST_N = 0, FURA_FRONT = {};
  function buildBlockade() {
    G.fura = new IG(GEO.fura, MAT.veh, 1400, true); G.tank = new IG(GEO.tank, MAT.veh, 300, true); G.trac = new IG(GEO.trac, MAT.veh, 320, true);
    DYN.add(G.fura.m); DYN.add(G.tank.m); DYN.add(G.trac.m);
    var cabC = [0xffffff, 0xd8dde3, 0x1f4f8a, 0xb02a24, 0x2e6b3f, 0xe0b020, 0x9aa3ad, 0x5b2d82, 0xf28c1f].map(col);
    var tracC = [0x2f8f3a, 0xc4261d, 0x1f5fa8, 0xd9a21b].map(col);
    // 8 та йўлак: жанубий 4 таси шаҳар томонга, шимолий 4 таси вилоят томонга. Аксарияти ўз йўлагида навбатда,
    // айримлари қийшиқ, олдинги қаторлар бетартиб (йўлни тўсган) — Google харитасидаги тирбандлик манзараси бўйича
    var LANES = [-3.4, -6.9, -10.4, -13.9, 3.4, 6.9, 10.4, 13.9], k = 0;
    LANES.forEach(function (lat0) {
      var dir = lat0 < 0 ? 1 : -1, s = sE + 62 - R(0, 8);
      for (var n = 0; n < 225; n++) {
        var typ = k % 6 === 5 ? 'trac' : (k % 10 === 3 || k % 10 === 7 ? 'tank' : 'fura'), len = typ === 'trac' ? 6.5 : 17;
        var front = n < 2, jit = front ? R(-0.95, 0.95) : rnd() < 0.12 ? R(-0.4, 0.4) : R(-0.05, 0.05);
        var lat = lat0 + R(-0.45, 0.45) + (front ? R(-1.4, 1.4) : 0), p = at('m39', s, lat), yaw = p.yaw + (dir > 0 ? 0 : PI) + jit;
        var g = G[typ], i = g.add(p.x, 0, p.z, yaw, 1, typ === 'trac' ? tracC[k % 4] : cabC[Math.floor(rnd() * cabC.length)]);
        if (typ === 'fura' && front) FURA_FRONT[i] = 1;
        VEH.push({ g: g, i: i, s: s, lat: lat, side: lat0 > 0 ? 1 : -1, typ: typ }); k++;
        s -= len + R(0.8, 2.6) + (rnd() < 0.03 ? R(4, 14) : 0);
      }
    });    G.fura.update(); G.tank.update(); G.trac.update();

    // одамлар
    G.vest = new IG(GEO.man, MAT.man, 3200, false); G.prov = new IG(GEO.manMask, MAT.man, 1500, false);
    G.offc = new IG(GEO.manPol, MAT.man, 4200, false); G.buf = new IG(GEO.manPol, MAT.man, 120, false); G.shield = new IG(GEO.shield, MAT.veh, 120, false);
    G.civ = new IG(GEO.man, MAT.man, 80, false); G.extra = new IG(GEO.man, MAT.man, 200, false);
    [G.vest, G.prov, G.offc, G.buf, G.shield, G.civ, G.extra].forEach(function (g) { DYN.add(g.m); });
    var vc = [0xf2d21b, 0xf5dc2a, 0xe8c514, 0xf0d43a].map(col), farm = [0x4f6b3a, 0x6a5a3c, 0x3d5a6e].map(col);
    var SC = 1.12, bands = [[-30, -18.5], [18.5, 30], [-1.5, 1.5], [-30, -18.5], [18.5, 30]];
    for (var v = 0; v < 3000; v++) {
      // ҳайдовчилар — йўл чети, ўрта ажратгич ва олдинги қатор атрофида (фуралар устида эмас)
      // ҳайдовчилар провокаторлар билан аралаш: олдинги майдонда (фуралардан олдин) бутун йўл бўйлаб, орқада — йўл чети ва ўрта ажратгичда
      var sv = sE + 185 - Math.pow(rnd(), 1.6) * 980, b = sv > sE + 64 ? [-28, 28] : bands[v % bands.length], lv = R(b[0], b[1]);
      var pv = at('m39', sv, lv);
      G.vest.add(pv.x, 0, pv.z, R(0, PI * 2), SC * R(0.94, 1.06), v % 5 === 4 ? farm[v % 3] : vc[v % 4]);
    }    VEST_N = G.vest.n;
    var blk = col(0x0d0d0f), blk2 = col(0x1a1a1e);
    for (var q = 0; q < 1500; q++) {
      // провокаторлар ҳайдовчилар орасига аралашиб кетган (зичлиги олдинги қаторга қараб ортади)
      var sp = sE + 185 - Math.pow(rnd(), 2.2) * 520, bp = sp > sE + 64 ? [-27, 27] : bands[q % bands.length], lp = R(bp[0], bp[1]), pp = at('m39', sp, lp);
      PROV_IDX.push(G.prov.add(pp.x, 0, pp.z, at('m39', sp, 0).yaw + R(-0.6, 0.6), SC * R(0.95, 1.06), q % 3 ? blk : blk2));
    }
    G.vest.update(); G.prov.update();

    // ёнаётган шиналар саҳнаси олиб ташланди (буюртмачи талаби) — фақат бўш гуруҳ ва рўйхат қолади
    G.tires = new THREE.Group(); DYN.add(G.tires); G.fireBase = [];
    // полиция кордони ва машиналар (Эркин, шаҳар томони)
    G.erkVeh = new THREE.Group(); DYN.add(G.erkVeh);
    [[-12, 'yxxb'], [-6, 'yxxb'], [6, 'van'], [12, 'yxxb'], [-26, 'ambulance'], [26, 'ambulance']].forEach(function (a, i) {
      var p = at('m39', sE + 232 + (i > 3 ? 12 : 0), a[0]), m = persistVeh(vehModel(a[1])); m.position.set(p.x, 0, p.z); m.rotation.y = p.yaw + PI; G.erkVeh.add(m);
    });
    var pf = at('m39', sE + 250, -9), food = new THREE.Mesh(GEO.fura, MAT.veh); food.position.set(pf.x, 0, pf.z); food.rotation.y = pf.yaw + PI; food.castShadow = true; G.erkVeh.add(food);
    // мигалка ёруғлиги
    G.redL = new THREE.PointLight(0xff2a2a, 0, 140, 2); G.bluL = new THREE.PointLight(0x2a5bff, 0, 140, 2);
    var lp1 = at('m39', sE + 232, -12), lp2 = at('m39', sE + 232, 12);
    G.redL.position.set(lp1.x, 4, lp1.z); G.bluL.position.set(lp2.x, 4, lp2.z); DYN.add(G.redL); DYN.add(G.bluL);
    G.alarm = new THREE.PointLight(0xff1a1a, 0, 420, 1.6); var ap = at('m39', sE + 60, 0); G.alarm.position.set(ap.x, 40, ap.z); DYN.add(G.alarm);
  }

  function resetBlockade() {
    ['fura', 'tank', 'trac', 'vest', 'prov'].forEach(function (k) { G[k].reset(); });
    G.buf.clear(); G.shield.clear(); G.civ.clear(); G.extra.clear();
    G.tires.visible = true;
    for (var j = FIRES.length - 1; j >= 0; j--) FIRES.splice(j, 1);
    PADD.clear(); PNRM.clear();
  }

  /* ----- ходимлар жойлашуви (1-модул тақсимотидан) ----- */
  var OFF_COL;
  function layoutOfficers(alloc) {
    S.alloc = alloc;
    if (!OFF_COL) OFF_COL = { iio: col(0x22385e), mg: col(0x2a3324), yx: col(0xb6e03a), fvv: col(0xb3261e) };
    var g = G.offc; g.clear();
    function c(i) { var m = i % 25; return m < 14 ? OFF_COL.iio : m < 20 ? OFF_COL.mg : m < 23 ? OFF_COL.yx : OFF_COL.fvv; }
    var SC = 1.12, gi = 0;
    BA.LOCS.forEach(function (L) {
      var n = Math.max(0, Math.min(4200 - gi, Math.round(alloc[L.id] || 0)));
      if (L.id === 'loc_erkin') {
        var cord = Math.min(n, 320);
        for (var i = 0; i < cord; i++) {
          var row = Math.floor(i / 64), j = i % 64, p = at('m39', sE + 205 + row * 1.6, -31.5 + j * 1.0);
          g.add(p.x, 0, p.z, p.yaw + PI, SC, c(gi++));
        }
        var rest = n - cord, blocks = Math.ceil(rest / 50), done = 0;
        for (var b = 0; b < blocks; b++) {
          var side = b % 2 ? 1 : -1, sb = sE + 330 - Math.floor(b / 2) * 70, nb = Math.min(50, rest - done);
          for (var q = 0; q < nb; q++) { var pp = at('m39', sb + (q % 10) * 1.6, side * (27 + Math.floor(q / 10) * 1.6)); g.add(pp.x, 0, pp.z, pp.yaw + PI, SC, c(gi++)); }
          done += nb;
        }
      } else {
        var Rr = SITE_R[L.id] * (L.id === 'loc_hq' ? 0.45 : 0.62), ringN = Math.max(1, Math.ceil(n / 520));
        for (var k = 0; k < n; k++) {
          var ring = k % ringN, a = (Math.floor(k / ringN) / Math.ceil(n / ringN)) * PI * 2, rr = Rr + ring * 3;
          var x = L.x + Math.cos(a) * rr, z = L.z + Math.sin(a) * rr * 0.75 - (L.id === 'loc_airp_cargo' ? 200 : L.id === 'loc_log' ? -240 : 0);
          g.add(x, 0, z, -a, SC, c(gi++));
        }
      }
    });
    g.update();
  }

  /* ----- локация ёрлиқлари ----- */
  function buildLocLabels() {
    BA.LOCS.forEach(function (L) {
      var y = L.id === 'loc_hq' ? 70 : L.id === 'loc_airp_cargo' ? 40 : 30;
      // пункт ёрлиғида фақат тартиб рақами ва номи (ходимлар сони — «Объект маълумот дисплейи»да)
      var lb = addLabel('<b>' + L.key + '</b><span>' + L.short + '</span>', V(L.x, y, L.z), 'loc', function () { if (S.onPick) S.onPick(L.id); focusZone(L.id); }, 0);
      lb.el.dataset.loc = L.id; LOCL[L.id] = lb;
    });
  }

  /* =====================================================================
     ХАТО ЗОНАЛАР (қизил пульсация)
     ===================================================================== */
  var ERRM = {};
  function highlightErrorZones(ids, info) {
    ids = ids || [];
    Object.keys(ERRM).forEach(function (id) { if (ids.indexOf(id) < 0) { FX.remove(ERRM[id].g); rmLabel(ERRM[id].lb); delete ERRM[id]; } });
    ids.forEach(function (id) {
      if (ERRM[id]) return;
      var L = BA.byId(id); if (!L) return;
      var g = new THREE.Group(), rr = SITE_R[id] * 0.9, fp = focusPoint(id);
      var ring = new THREE.Mesh(new THREE.RingGeometry(rr * 0.94, rr, 96), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -PI / 2; ring.position.y = 1.5; g.add(ring);
      var disc = new THREE.Mesh(new THREE.CircleGeometry(rr, 96), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
      disc.rotation.x = -PI / 2; disc.position.y = 1.2; g.add(disc);
      var beam = new THREE.Mesh(cyl(rr * 0.98, rr * 0.98, 220, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.y = 110; g.add(beam);
      g.position.set(fp.x, 0, fp.z); FX.add(g);
      var lb = addLabel((info && info[id] ? info[id] : 'ХАТО'), V(fp.x, 60, fp.z), 'err', null, 0);
      ERRM[id] = { g: g, ring: ring, disc: disc, beam: beam, lb: lb };
    });
  }
  function errUpdate() {
    var t = performance.now() / 1000, k = 0.5 + 0.5 * Math.sin(t * 6);
    Object.keys(ERRM).forEach(function (id) { var e = ERRM[id]; e.ring.material.opacity = 0.35 + 0.6 * k; e.disc.material.opacity = 0.05 + 0.15 * k; e.beam.material.opacity = 0.03 + 0.09 * k; e.ring.scale.setScalar(1 + 0.04 * k); });
  }

  /* =====================================================================
     1-МОДУЛ: ВОСИТАЛАРНИ ЖОЙЛАШТИРИШ
     ===================================================================== */
  var MEANS = {};                      // калит: id + '@' + loc  → {g, lb, n}
  var M_ORDER = ['drn', 'gas', 'wtr', 'ram', 'evk', 'gun', 'fvv', 'blk', 'yxb', 'lrad', 'amb', 'comm', 'bus', 'k9', 'buf', 'neg'];
  function stagePos(locId, id) {
    var k = Math.max(0, M_ORDER.indexOf(id));
    if (locId === 'loc_erkin') { var p = at('m39', sE + 290 + (k % 8) * 26, (k % 2 ? 50 : -50) + (k > 7 ? (k % 2 ? 14 : -14) : 0)); return { x: p.x, z: p.z, yaw: p.yaw + PI }; }
    var L = BA.byId(locId), a = k / M_ORDER.length * PI * 2 + 0.3, rr = SITE_R[locId] * 0.42;
    return { x: L.x + Math.cos(a) * rr, z: L.z + Math.sin(a) * rr, yaw: -a };
  }
  function meansModel(id, n) {
    var g = new THREE.Group(), kinds = { wtr: 'suv_purkagich', evk: 'evakuator', fvv: 'fvv', yxb: 'yxxb', bus: 'avtobus', drn: 'dron', amb: 'ambulance', ram: 'van' };
    n = Math.max(1, Math.min(8, n || 1));
    if (kinds[id]) {
      for (var i = 0; i < n; i++) { var m = vehModel(kinds[id]); m.position.set(0, id === 'drn' ? 24 + i * 2 : 0, (i - (n - 1) / 2) * (id === 'drn' ? 9 : 5.5)); if (id === 'ram') m.scale.set(1.4, 1.3, 1.4); g.add(m); }
    } else if (id === 'buf' || id === 'neg' || id === 'k9') {
      var cnt = id === 'buf' ? 12 * n : id === 'neg' ? 6 * n : 4 * n, c = col(id === 'buf' ? 0x1b2433 : id === 'neg' ? 0x3b4f6b : 0x22385e);
      for (var j = 0; j < cnt; j++) {
        var p = new THREE.Mesh(GEO.man, new THREE.MeshStandardMaterial({ vertexColors: true, color: c })); p.scale.setScalar(1.12); p.position.set((j % 12) * 1.0 - 6, 0, Math.floor(j / 12) * 1.3); g.add(p);
        if (id === 'buf') { var sh = new THREE.Mesh(GEO.shield, MAT.veh); sh.scale.setScalar(1.12); sh.position.copy(p.position); g.add(sh); }
        if (id === 'k9') { var dog = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0x4a3a28 })); dog.scale.set(0.9, 0.55, 0.3); dog.position.set(p.position.x + 0.8, 0.45, p.position.z); g.add(dog); }
      }
      if (id === 'neg') { var tent = new THREE.Mesh(new THREE.ConeGeometry(5, 4, 4), new THREE.MeshStandardMaterial({ color: col(0xf2f2f2) })); tent.position.set(0, 2, -6); tent.rotation.y = PI / 4; g.add(tent); }
    } else if (id === 'blk') {
      for (var b = 0; b < 6 * n; b++) { var jb = new THREE.Mesh(GEO.jersey, MAT.veh); jb.position.set((b % 10) * 3.7 - 17, 0, Math.floor(b / 10) * 2); g.add(jb); }
    } else if (id === 'comm' || id === 'lrad') {
      for (var q = 0; q < n; q++) { var t = vehModel('van'); t.position.z = q * 5; g.add(t); var mast = new THREE.Mesh(cyl(0.12, 0.15, id === 'comm' ? 9 : 2.5, 6), new THREE.MeshStandardMaterial({ color: 0x9aa0a6 })); mast.position.set(0, id === 'comm' ? 7 : 3.6, q * 5); g.add(mast); }
    } else {
      for (var c2 = 0; c2 < 3 * n; c2++) { var cr = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0x3d4a2a })); cr.scale.set(1.2, 0.8, 0.8); cr.position.set((c2 % 6) * 1.5 - 4, 0.4, Math.floor(c2 / 6) * 1.2); g.add(cr); }
    }
    return g;
  }
  // битта воситани бир неча жойга тақсимлаш: count = 0 бўлса — олиб ташланади
  function placeMeansAt(id, locId, count) {
    var key = id + '@' + locId, cur = MEANS[key];
    if (cur && cur.n === count) return;
    removeMeansKey(key);
    if (!count) return;
    var def = (window.SCN && SCN.PREP.means.filter(function (m) { return m.id === id; })[0]) || { name: id };
    var p = stagePos(locId, id), g = meansModel(id, count);
    g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw; DYN.add(g);
    var lb = addLabel('<span>' + def.name + ' • ' + count + '</span>', V(p.x, id === 'drn' ? 36 : 12, p.z), 'unit', null, 1);
    MEANS[key] = { g: g, lb: lb, n: count };
  }
  function removeMeansKey(key) { var m = MEANS[key]; if (!m) return; removeMig(m.g); DYN.remove(m.g); rmLabel(m.lb); delete MEANS[key]; }
  function removeMeans(id) { Object.keys(MEANS).forEach(function (k) { if (k.split('@')[0] === id) removeMeansKey(k); }); }
  var XTEX;
  function xMarker(size) {
    if (!XTEX) XTEX = canvasTex(128, 128, function (g) { g.strokeStyle = '#ff2a2a'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(24, 24); g.lineTo(104, 104); g.moveTo(104, 24); g.lineTo(24, 104); g.stroke(); });
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: XTEX, transparent: true, depthWrite: false })); s.scale.set(size, size, 1); return s;
  }

  /* =====================================================================
     2-МОДУЛ: ҚАРОРЛАР ЭФФЕКТЛАРИ
     ===================================================================== */
  var DONE = {};                       // бажарилган қарорлар (ҳолат)
  var FXL = [];                        // эффект ёрлиқлари
  function fxLabel(html, x, y, z, cls) { var L = addLabel(html, V(x, y, z), 'fx ' + (cls || ''), null, 0); FXL.push(L); return L; }
  function pulse(x, z, color, r0, r1, dur, delay) {
    var m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -PI / 2; m.position.set(x, 2, z); FX.add(m);
    tween(dur, delay, function (e, u) { var r = r0 + (r1 - r0) * e; m.scale.set(r, r, r); m.material.opacity = 0.9 * (1 - u); }, function () { FX.remove(m); m.geometry.dispose(); });
  }
  function boom(x, y, z, size) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(x, y, z); FX.add(m);
    tween(1.6, 0, function (e, u) { m.scale.setScalar(1 + size * e); m.material.opacity = 1 - u; }, function () { FX.remove(m); });
    for (var i = 0; i < 160; i++) { var a = rnd() * PI * 2, sp = R(6, 26); PADD.emit(x, y, z, Math.cos(a) * sp, R(4, 22), Math.sin(a) * sp, R(0.6, 1.6), R(2, 4), 0.5, 1, rnd() < 0.5 ? COL.f1 : COL.f2, -9.8, 0.8); }
    for (i = 0; i < 50; i++) PNRM.emit(x + R(-3, 3), y + R(0, 4), z + R(-3, 3), R(-3, 3), R(4, 9), R(-3, 3), R(6, 10), 6, 30, 0.7, COL.sm1, 0, 0.15);
    var lf = new THREE.PointLight(0xff8a30, 12, 300, 2); lf.position.set(x, y + 6, z); FX.add(lf);
    tween(1.8, 0, function (e, u) { lf.intensity = 12 * (1 - u); }, function () { FX.remove(lf); });
  }
  function vehAt(sMin, sMax, latSign, typ) { return VEH.filter(function (v) { return v.s >= sMin && v.s <= sMax && (!latSign || Math.sign(v.lat) === latSign) && (!typ || v.typ === typ); }); }
  // нуқтанинг М-39 бўйлаб (s, lat) қиймати — фақат «Эркин» атрофида (тез)
  function nearSRow(x, z) {
    var r = RD.m39, i0 = Math.max(0, Math.floor((sE - 3300) / r.step)), i1 = Math.min(r.n, Math.ceil((sE + 600) / r.step)), b = 1e18, bi = i0;
    for (var i = i0; i <= i1; i += 4) { var d = (r.xs[i] - x) * (r.xs[i] - x) + (r.zs[i] - z) * (r.zs[i] - z); if (d < b) { b = d; bi = i; } }
    for (i = Math.max(i0, bi - 4); i <= Math.min(i1, bi + 4); i++) { d = (r.xs[i] - x) * (r.xs[i] - x) + (r.zs[i] - z) * (r.zs[i] - z); if (d < b) { b = d; bi = i; } }
    var yaw = r.yw[bi], lx = -Math.sin(yaw), lz = -Math.cos(yaw);
    return { s: bi * r.step, lat: (x - r.xs[bi]) * lx + (z - r.zs[bi]) * lz };
  }
  var VEST_SL = null;
  function vestSL() { if (VEST_SL) return VEST_SL; VEST_SL = []; for (var i = 0; i < G.vest.n; i++) VEST_SL.push(nearSRow(G.vest.bx[i], G.vest.bz[i])); return VEST_SL; }

  var FXI = {
    plan: function (inst) {
      SCR.wall.map = hqScreenTex('plan'); SCR.wall.needsUpdate = true; G.beacon.material.opacity = 1;
      if (inst) return;
      BA.LOCS.forEach(function (L, i) { var fp = focusPoint(L.id); for (var k = 0; k < 3; k++) pulse(fp.x, fp.z, 0x2fd27a, 10, SITE_R[L.id] * 1.1, 2.4, i * 0.25 + k * 1.2); });
    },
    buffer: function (inst) {
      var SC = 1.12, dark = col(0x141b26);
      for (var k = 0; k < 104; k++) {
        var row = k % 2, j = Math.floor(k / 2), lat = -25.5 + j * 1.0, s = sE + 96.5 + row * 1.25;
        var p = at('m39', s, lat), side = lat < 0 ? -1 : 1, st = at('m39', s + R(10, 40), side * R(40, 60));
        var i = G.buf.add(inst ? p.x : st.x, 0, inst ? p.z : st.z, p.yaw, SC, dark);
        var ps = at('m39', s + 0.45, lat), i2 = G.shield.add(inst ? ps.x : st.x, 0, inst ? ps.z : st.z, p.yaw, SC);
        if (!inst) { G.buf.to(i, p.x, p.z, p.yaw, 2.2, j * 0.035); G.shield.to(i2, ps.x, ps.z, p.yaw, 2.2, j * 0.035); }
      }
      var lp = at('m39', sE + 97, 0); fxLabel('БУФЕР ЗОНА', lp.x, 14, lp.z, 'ok');
      // провокаторлар чегарадан орқага сурилади
      // буфер: аралаш оломон икки томонга ажратилади — провокаторлар олдинга (шаҳар томони), ҳайдовчилар фуралар томонга
      PROV_IDX.forEach(function (i) { var sl = nearSRow(G.prov.x[i], G.prov.z[i]); if (sl.s < sE + 108) { var q = at('m39', sE + 108 + R(0, 70), clamp(sl.lat, -27, 27)); if (inst) G.prov.set(i, q.x, q.z); else G.prov.to(i, q.x, q.z, null, 2.4, 1.2 + rnd() * 1.5); } });
      var vsl = vestSL(); for (var vi = 0; vi < VEST_N; vi++) { var vq = vsl[vi]; if (vq.s > sE + 86) { var vp = at('m39', sE + 20 + R(0, 66), clamp(vq.lat, -28, 28)); if (inst) G.vest.set(vi, vp.x, vp.z); else G.vest.to(vi, vp.x, vp.z, null, 2.4, 1.2 + rnd() * 1.5); } }
    },
    negot: function (inst) {
      var c = at('m39', sE + 270, 72), g = new THREE.Group(); g.position.set(c.x, 0, c.z); FX.add(g);
      var tent = new THREE.Mesh(new THREE.ConeGeometry(7, 5, 6), new THREE.MeshStandardMaterial({ color: col(0xf4f4f4), roughness: 0.8 })); tent.position.y = 2.5; tent.castShadow = true; g.add(tent);
      var table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 1.6), new THREE.MeshStandardMaterial({ color: col(0x6b4a2b) })); table.position.set(0, 0.45, 8); g.add(table);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(17, 0.35, 8, 96), new THREE.MeshBasicMaterial({ color: 0x2fff8a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = PI / 2; ring.position.y = 0.6; g.add(ring);
      var beam = new THREE.Mesh(cyl(17, 17, 60, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x2fff8a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.y = 30; g.add(beam);
      g.userData.up = function () { var k = 0.5 + 0.5 * Math.sin(performance.now() / 300); ring.material.opacity = 0.5 + 0.5 * k; beam.material.opacity = 0.05 + 0.08 * k; };
      UPDATERS.push(g.userData.up);
      var SC = 1.12, ofc = col(0x22385e), gov = col(0x3c3f46), led = col(0xf2d21b);
      for (var k = 0; k < 28; k++) { var a = k / 28 * PI * 2, x = c.x + Math.cos(a) * 14, z = c.z + Math.sin(a) * 14; G.extra.add(x, 0, z, -a, SC, ofc); }
      for (k = 0; k < 6; k++) { G.extra.add(c.x - 2.5 + k, 0, c.z + 7, PI / 2, SC, gov); G.extra.add(c.x - 2.5 + k, 0, c.z + 9.4, -PI / 2, SC, led); }
      // хавфсиз коридор
      for (k = 0; k < 24; k++) { var p = at('m39', sE + 215 + k * 2.4, 30 + (k % 2 ? 4 : -4) + k * 1.4); G.extra.add(p.x, 0, p.z, p.yaw, SC, ofc); }
      G.extra.update();
      fxLabel('МУЗОКАРА НУҚТАСИ', c.x, 20, c.z, 'ok');
      if (!inst) pulse(c.x, c.z, 0x2fff8a, 2, 60, 2.5, 0);
    },
    water: function (inst) {
      var front = [];
      var veh = [['suv_purkagich', -5], ['suv_purkagich', 5], ['fvv', -14], ['fvv', 14]];
      veh.forEach(function (a, i) {
        var m = vehModel(a[0]); FX.add(m);
        if (inst) { var p = at('m39', sE + 196, a[1]); m.position.set(p.x, 0, p.z); m.rotation.y = p.yaw + PI; }
        else mover(m, 'm39', sE + 460 + i * 20, sE + 196 + (i > 1 ? 8 : 0), a[1], 14, S.t + i * 0.4);   // ≈50 km/soat, ~20 s da yetib keladi
        front.push({ m: m, lat: a[1] });
      });
      // сув оқими
      if (!inst) {
        var t0 = S.t;
        var spray = function (dt) {
          var el = S.t - t0; if (el < 22 || el > 34 || !dt) return;
          front.forEach(function (f, i) {
            if (i > 1 && el < 24) return;
            var o = f.m.position, tgt = G.fireBase.length ? G.fireBase[(i * 3 + Math.floor(el * 0.7)) % G.fireBase.length] : (function () { var q = at('m39', sE + 120 + (i % 3) * 25, (i % 2 ? 1 : -1) * 8); return [q.x, q.z]; })();
            var dx = tgt[0] - o.x, dz = tgt[1] - o.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(34, Math.sqrt(d * 9.8 / Math.sin(2 * 0.35)));
            for (var n = 0; n < 9; n++) PNRM.emit(o.x, 4.6, o.z, dx / d * sp * Math.cos(0.35) + R(-1.5, 1.5), sp * Math.sin(0.35) + R(-1, 1.5), dz / d * sp * Math.cos(0.35) + R(-1.5, 1.5), R(1.2, 2), 0.7, 3.2, 0.7, COL.water, -9.8, 0.05);
          });
        };
        UPDATERS.push(spray); FX.userData.ups = (FX.userData.ups || []).concat([spray]);
      }
      // олов ўчади
      FIRES.forEach(function (f, i) { if (inst) { f.kg = 0; f.k = 0; f.sm = 0; } else { tween(0.1, 24 + i * 0.5, function () { f.kg = 0; f.steam = 1; }); tween(0.1, 33 + i * 0.3, function () { f.steam = 0; }); } });
      if (!inst) tween(1.5, 30, function (e) { G.tires.visible = e < 0.9; }); else G.tires.visible = false;
      // радикал гуруҳ 3 бўлакка
      var cl = [[sE + 150, -42], [sE + 118, 44], [sE + 190, 58]];
      PROV_IDX.forEach(function (i, k) { var c = cl[k % 3], a = rnd() * PI * 2, rr = Math.sqrt(rnd()) * 14, p = at('m39', c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr); if (inst) G.prov.set(i, p.x, p.z); else G.prov.to(i, p.x, p.z, null, 3, 23 + rnd() * 2); });
      var fp = at('m39', sE + 140, 0); fxLabel('ЁНҒИН ЎЧИРИЛДИ', fp.x, 16, fp.z, 'ok');
      S.unrest = Math.min(S.unrest, 0.5);
    },
    // эгасиз фуралар четга олинади — шимолий 4 йўлак очилади (колонна ва оқим учун шарт)
    tow: function (inst) {
      var mv = vehAt(sE - 3200, sE + 95, 1), cols = 5;
      mv.sort(function (a, b) { return b.s - a.s; }).forEach(function (v, k) {
        var lat = 22 + (k % cols) * 3.3, p = at('m39', v.s, lat), yaw = p.yaw + (k % 2 ? 0.04 : -0.04);
        if (inst) v.g.set(v.i, p.x, p.z, yaw); else v.g.to(v.i, p.x, p.z, yaw, 2.4, 3.5 + (sE + 95 - v.s) / 360);
      });
      // эвакуаторлар
      if (!inst) for (var e = 0; e < 3; e++) { var ev = vehModel('evakuator'); FX.add(ev); mover(ev, 'm39', sE + 520 + e * 18, sE - 1400 - e * 40, 9 + (e - 1) * 3.4, 12, S.t + 3 + e * 1.8); }
      // ҳайдовчилар шимолий қатнов қисмидан чиқади
      var sl = vestSL();
      for (var i = 0; i < VEST_N; i++) { var q = sl[i]; if (q.lat > 1) { var np = at('m39', q.s, R(42, 72)); if (inst) G.vest.set(i, np.x, np.z); else G.vest.to(i, np.x, np.z, null, 2, 2 + rnd() * 3); } }
      var lp = at('m39', sE - 300, 9); fxLabel('4 ЙЎЛАК ОЧИЛДИ', lp.x, 12, lp.z, 'ok');
    },
    // тез ёрдам машиналари хизмат йўлаги орқали
    ambul: function (inst) {
      for (var k = 0; k < 3; k++) {
        var a = vehModel('ambulance'); FX.add(a);
        if (inst) { var p = at('green', RD.green.L * 0.2 + k * 14, 0); a.position.set(p.x, 0, p.z); a.rotation.y = p.yaw + PI; }
        else mover(a, 'green', RD.green.L - 20 - k * 16, RD.green.L * 0.25 - k * 16, 0, 14, S.t + k * 1.4);
      }
      var lp = at('m39', sE - 60, -30); fxLabel('ТЕЗ ЁРДАМ ЙЎЛАГИ', lp.x, 14, lp.z, 'ok');
    },
    // логистика марказидан озиқ-овқат ва дори юклари
    logi: function (inst) {
      var L = BA.byId('loc_log');
      for (var k = 0; k < 6; k++) {
        var m = new THREE.Group(), mm = furaMesh(k); m.add(mm); FX.add(m);
        if (k === 0) { var y = vehModel('yxxb'); y.position.x = 10; m.add(y); }
        if (inst) { var p = at('m39', nearestS('m39', L.x, L.z) + 300 + k * 24, 9); m.position.set(p.x, 0, p.z); m.rotation.y = p.yaw; }
        else mover(m, 'logi', RD.logi.L - 5, 0, 0, 8, S.t + k * 3.2, function (mv) { mover(mv.obj, 'm39', nearestS('m39', L.x, L.z), nearestS('m39', L.x, L.z) + 2500, 9, 14, S.t); });
      }
      for (k = 0; k < 2; k++) { var dr = vehModel('dron'); dr.position.set(L.x - 150 + k * 60, 35, L.z + 200); FX.add(dr); }
      fxLabel('ОЗИҚ-ОВҚАТ ВА ДОРИ ЮКЛАРИ', L.x - 150, 30, L.z + 180, 'ok');
    },
    // аэропорт периметри — МГ занжири
    airPerim: function (inst) {
      var L = BA.byId('loc_airp_cargo'), SC = 1.12, c = col(0x2a3324);
      for (var k = 0; k < 120; k++) { var x = L.x - 150 + (k % 60) * 5, z = L.z - 50 + Math.floor(k / 60) * 2; var i = G.extra.add(inst ? x : x, 0, inst ? z : z + 40, PI, SC, c); if (!inst) G.extra.to(i, x, z, PI, 2, k * 0.01); }
      G.extra.update();
      pulse(L.x, L.z - 100, 0xffffff, 20, 380, 2.4, 0);
      fxLabel('ПЕРИМЕТР КУЧАЙТИРИЛДИ', L.x, 40, L.z - 60, 'ok');
    },
    // объезд — айланма йўлда оқим
    transit: function (inst) {
      var B = BA.byId('loc_bypass'), sb = nearestS('bypass', B.x, B.z);
      for (var k = 0; k < 18; k++) {
        var cg = new THREE.Group(), cm = new THREE.Mesh(GEO.car, MAT.veh); cg.add(cm); FX.add(cg);
        var dir = k % 2 ? 1 : -1, s0 = sb + dir * -900 - k * 30 * dir, s1 = sb + dir * 1400;
        mover(cg, 'bypass', s0, s1, dir > 0 ? -4.2 : 4.2, 12 + (k % 3) * 1.5, S.t + (inst ? 0 : k * 1.2), function (mv) { var a = mv.s0; mv.s0 = mv.s1; mv.s1 = a; mv.t0 = S.t; mv.done = false; });
      }
      for (k = 0; k < 3; k++) { var y = vehModel('yxxb'); var p = at('bypass', sb - 200 + k * 200, 13); y.position.set(p.x, 0, p.z); y.rotation.y = p.yaw; FX.add(y); }
      fxLabel('НАЗОРАТЛИ ЙЎЛАКЛАР', B.x, 30, B.z, 'ok');
    },
    // ёқилғи шохобчаларида наряд
    fuelQ: function () {
      var L = BA.byId('loc_fuel'), sa = nearestS('airport', L.x, L.z);
      [-380, -60, 260].forEach(function (o, k) { var p = at('airport', sa + o - 30, k % 2 ? -14 : 14), y = vehModel('yxxb'); y.position.set(p.x, 0, p.z); y.rotation.y = p.yaw; FX.add(y); });
      pulse(L.x, L.z, 0xffffff, 20, 500, 2.4, 0);
      fxLabel('НАВБАТЛАР ТАРТИБГА СОЛИНДИ', L.x, 30, L.z, 'ok');
    },
    restrict: function () {
      var B = BA.byId('loc_bypass'), E = focusPoint('loc_erkin');
      [[B.x, B.z], [E.x, E.z]].forEach(function (c) { pulse(c[0], c[1], 0xffffff, 30, 700, 3, 0); });
      var p = at('m39', nearestS('m39', B.x, B.z) + 400, 0); fxLabel('ҲАРАКАТ ВАҚТИНЧА ЧЕКЛАНГАН', p.x, 20, p.z, 'ok');
    },
    arrest: function () {
      var p = at('m39', sE + 240, -40); for (var k = 0; k < 3; k++) { var v = vehModel('van'); v.position.set(p.x + k * 7, 0, p.z); v.rotation.y = p.yaw; FX.add(v); }
      fxLabel('ҲУЖЖАТЛАШТИРИШ', p.x, 14, p.z, 'ok');
    },
    // генерик: тактик хато (қизил пульс) ва критик хато (портлаш + сирена)
    err: function (inst, loc) { var fp = focusPoint(loc || 'loc_erkin'); pulse(fp.x, fp.z, 0xff2020, 10, SITE_R[loc || 'loc_erkin'], 1.8, 0); pulse(fp.x, fp.z, 0xff2020, 10, SITE_R[loc || 'loc_erkin'], 1.8, 0.7); },
    crit: function (inst, loc) {
      var fp = focusPoint(loc || 'loc_erkin');
      boom(fp.x, 4, fp.z, 30); var f = addFire(fp.x + 6, fp.z + 4, 1.5, true); tween(0.1, 14, function () { f.kg = 0; });
      for (var k = 0; k < 3; k++) pulse(fp.x, fp.z, 0xff0000, 10, SITE_R[loc || 'loc_erkin'] * 1.2, 1.6, k * 0.6);
      alarm(10); S.unrest = 1;
    },
    drones: function (inst) {
      var dr = [];
      var cl = [[sE + 150, -42], [sE + 118, 44], [sE + 190, 58], [sE + 140, 0]];
      // нишонлар: ҳар бир бўлакдан 8 тадан
      var targets = PROV_IDX.filter(function (i, k) { return k % 60 === 0; }).slice(0, 24);
      var van1 = at('m39', sE + 236, -26);
      if (inst) { targets.forEach(function (i) { G.prov.set(i, van1.x, van1.z, null, 0); }); }
      else {
        cl.forEach(function (c, k) {
          var d = vehModel('dron'); FX.add(d); var st = at('m39', sE + 230, (k - 1.5) * 6); d.position.set(st.x, 2, st.z);
          var cone = new THREE.Mesh(new THREE.ConeGeometry(11, 40, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
          cone.position.y = -20 / 2.2; cone.scale.setScalar(1 / 2.2); d.add(cone);
          var dest = at('m39', c[0], c[1]);
          var fx0, fz0, t0 = S.t + k * 0.3;
          var up = function () {
            var el = S.t - t0; if (el < 0) return;
            if (fx0 == null) { fx0 = d.position.x; fz0 = d.position.z; }
            var u = clamp(el / 3, 0, 1), e = ease(u), sw = el > 3 ? el - 3 : 0;
            d.position.x = fx0 + (dest.x - fx0) * e + Math.sin(sw * 0.8) * 8 * Math.min(1, sw);
            d.position.z = fz0 + (dest.z - fz0) * e + Math.cos(sw * 0.8) * 8 * Math.min(1, sw);
            d.position.y = 2 + 40 * Math.min(1, el / 1.5);
            d.rotation.y += 0.02; cone.material.opacity = 0.1 + 0.1 * Math.abs(Math.sin(el * 3));
          };
          UPDATERS.push(up); dr.push(d);
        });
        // белгилаш
        var marks = [];
        targets.forEach(function (i, k) {
          tween(0.1, 3.5 + k * 0.08, function () {
            var m = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.8, 24), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
            m.rotation.x = -PI / 2; m.position.set(G.prov.x[i], 0.4, G.prov.z[i]); FX.add(m);
            var gsp = glow(col(0xff2020), 4, 1); gsp.position.set(G.prov.x[i], 3.6, G.prov.z[i]); FX.add(gsp);
            marks.push([m, gsp, i]);
          });
        });
        // нуқтали қўлга олиш
        targets.forEach(function (i, k) { G.prov.to(i, van1.x + R(-3, 3), van1.z + R(-3, 3), null, 3.2, 8 + k * 0.05); });
        tween(0.1, 8, function () { var up = function () { marks.forEach(function (a) { a[0].position.x = G.prov.x[a[2]]; a[0].position.z = G.prov.z[a[2]]; a[1].position.x = G.prov.x[a[2]]; a[1].position.z = G.prov.z[a[2]]; }); }; UPDATERS.push(up); });
        tween(0.1, 11.5, function () { marks.forEach(function (a) { FX.remove(a[0]); FX.remove(a[1]); }); targets.forEach(function (i) { G.prov.to(i, G.prov.x[i], G.prov.z[i], null, 0.6, 0, 0); }); });
      }
      var v = vehModel('van'); v.position.set(van1.x, 0, van1.z + 4); v.rotation.y = van1.yaw; FX.add(v);
      // қолган провокаторлар тарқалади
      PROV_IDX.forEach(function (i) {
        if (targets.indexOf(i) >= 0) return;
        var side = rnd() < 0.5 ? -1 : 1, p = at('m39', sE + R(60, 400), side * R(110, 260));
        if (inst) G.prov.set(i, p.x, p.z, null, 0); else G.prov.to(i, p.x, p.z, null, 6, 12 + rnd() * 3);
      });
      if (!inst) tween(0.1, 19, function () { PROV_IDX.forEach(function (i) { if (targets.indexOf(i) < 0) G.prov.to(i, G.prov.x[i], G.prov.z[i], null, 2, rnd() * 2, 0); }); });
      var lp = at('m39', sE + 150, 0); fxLabel('ЮЗНИ АНИҚЛАШ: 24 ТА НИШОН', lp.x, 46, lp.z, 'ok');
      S.unrest = 0.15;
    },
    green: function (inst) {
      var gm = new THREE.MeshBasicMaterial({ color: 0x22ff7a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
      var gr = ribbon('green', 8, 0.25, gm, 24); FX.add(gr);
      var up = function () { gm.opacity = 0.28 + 0.22 * (0.5 + 0.5 * Math.sin(performance.now() / 260)); }; UPDATERS.push(up);
      var sg = nearestS('green', 0, 0);
      // тиббиёт чодири
      var tp = at('m39', sE - 200, -46), tent = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 7), new THREE.MeshStandardMaterial({ color: 0xf6f6f6 })); tent.position.set(tp.x, 1.6, tp.z); tent.rotation.y = tp.yaw; FX.add(tent);
      var rc = glow(col(0xff3030), 5, 0.9); rc.position.set(tp.x, 5, tp.z); FX.add(rc);
      var amb = vehModel('ambulance'); var ap = at('m39', sE - 180, -46); amb.position.set(ap.x, 0, ap.z); amb.rotation.y = ap.yaw; FX.add(amb);
      // фуқаролар автобусларга
      var cc = [0xffffff, 0xf2a0b8, 0x9ad0ff, 0xffc88a].map(col);
      for (var k = 0; k < 64; k++) {
        var s0 = sE - 260 + R(-60, 60), p0 = at('m39', s0, R(-14, -4)), p1 = at('m39', sE - 230 + (k % 5) * 16, -28.5 + R(-1, 1));
        var i = G.civ.add(inst ? p1.x : p0.x, 0, inst ? p1.z : p0.z, p0.yaw - PI / 2, k % 4 === 1 ? 0.8 : 1.12, cc[k % 4]);
        if (inst) G.civ.set(i, p1.x, p1.z, null, 0); else { G.civ.to(i, p1.x, p1.z, null, 3, rnd() * 1.5); }
      }
      if (!inst) tween(0.1, 4.8, function () { for (var i = 0; i < G.civ.n; i++) G.civ.to(i, G.civ.x[i], G.civ.z[i], null, 0.4, rnd() * 0.5, 0); });
      for (var b = 0; b < 5; b++) {
        var bus = vehModel('avtobus'); FX.add(bus);
        var s0b = sg - 230 + b * 16, s1b = RD.green.L - 30 - b * 16;
        if (inst) { var pe = at('green', s1b, 0); bus.position.set(pe.x, 0, pe.z); bus.rotation.y = pe.yaw; }
        else mover(bus, 'green', s0b, s1b, 0, 11, S.t + 5.2 + b * 1.6);
      }
      var lp = at('m39', sE - 120, -30); fxLabel('ЯШИЛ ЙЎЛАК', lp.x, 12, lp.z, 'ok');
    },
    convoy: function (inst) {
      var L = RD.convoy.L, fuelS = nearestS('convoy', BA.byId('loc_fuel').x, BA.byId('loc_fuel').z);
      var list = ['yxxb', 'tank', 'tank', 'tank', 'tank', 'yxxb', 'fura', 'fura', 'tank', 'tank', 'fura', 'yxxb', 'yxxb'];
      var lead = null;
      list.forEach(function (k, i) {
        var m;
        if (k === 'yxxb') m = vehModel('yxxb');
        else { m = new THREE.Group(); var mm = new THREE.Mesh(GEO[k], MAT.veh); mm.castShadow = true; m.add(mm); }
        var gsp = glow(col(k === 'yxxb' ? 0x3a7bff : 0xffc24a), 22, 0.85); gsp.position.y = 6; m.add(gsp);
        FX.add(m);
        var j = i === 0 ? 0 : i - 4;   // aeroport guruhidagi tartib raqami (bir-birining ustiga tushmasin)
        var end = i >= 1 && i <= 4 ? fuelS - 40 + i * 20 : L - 40 - j * 22;
        var lat = i >= 1 && i <= 4 ? 13 : 4.5;
        if (inst) { var p = at('convoy', end, lat); m.position.set(p.x, 0, p.z); m.rotation.y = p.yaw; }
        // ikki guruh: sisternalar ~1,2 km dan yoqilg'i shoxobchalariga, qolganlari ~1,6 km dan aeroportga; real tezlik ≈ 65–70 km/soat
        else { var s0 = i >= 1 && i <= 4 ? end - 1200 - i * 8 : end - 1600 - j * 6; var mv = mover(m, 'convoy', Math.max(0, s0), end, lat, 18, S.t + 0.5); if (!lead) lead = m; void mv; }
      });
      if (!inst && lead) { C.follow = lead; C.g.d = 700; C.g.tilt = 0.55; tween(0.1, 90, function () { if (C.follow === lead) C.follow = null; }); }
      var ap = BA.byId('loc_airp_cargo'); fxLabel('ТАЪМИНОТ КОЛОННАСИ', ap.x, 50, ap.z - 200, 'ok');
    },
    media: function (inst) {
      SCR.wall.map = hqScreenTex('media'); SCR.wall.needsUpdate = true;
      S.fogGoal = 0.12; S.brightGoal = 1; if (inst) { S.fog = 0.12; S.bright = 1; }
      // иштирокчилар тарқалади, жанубий фуралар 4 йўлакда тартибга келади
      for (var i = 0; i < VEST_N; i++) { if (rnd() < 0.82) { if (inst) G.vest.set(i, G.vest.x[i], G.vest.z[i], null, 0); else G.vest.to(i, G.vest.x[i], G.vest.z[i], null, 1, rnd() * 8, 0); } }
      var south = vehAt(sE - 3200, sE + 95, -1).sort(function (a, b) { return b.s - a.s; });
      south.forEach(function (v, k) {
        var lane = k % 4, row = Math.floor(k / 4), s = sE + 60 - row * 18, p = at('m39', s, -(3.5 + lane * 3.5));
        if (s < sE - 3100) { if (inst) v.g.set(v.i, p.x, p.z, p.yaw, 0); else v.g.to(v.i, v.g.x[v.i], v.g.z[v.i], null, 1, 4 + rnd() * 4, 0); return; }
        if (inst) v.g.set(v.i, p.x, p.z, p.yaw); else v.g.to(v.i, p.x, p.z, p.yaw, 2.6, 2 + row * 0.01);
      });
      // эркин транспорт оқими
      startFlow();
      var L = BA.byId('loc_hq'); fxLabel('БРИФИНГ • ЖОНЛИ ЭФИР', L.x, 40, L.z + 55, 'ok');
      S.unrest = 0;
    },
    // ---- хато қарорлар (AI блоклайди) ----
    gas_bad: function () {
      var t0 = S.t;
      var gasUp = function (dt) { var el = S.t - t0; if (el > 7 || !dt) return; for (var n = 0; n < 14; n++) { var p = at('m39', sE + R(-140, 95), R(-22, 22)); PNRM.emit(p.x, R(0.5, 3), p.z, R(-1, 1), R(0.3, 1.2), R(-1, 1), R(5, 9), 3, 18, 0.5, COL.gas, 0, 0.1); } };
      UPDATERS.push(gasUp);
      var vs = vehAt(sE - 160, sE + 95);
      vs.forEach(function (v) { var p = at('m39', v.s + R(-3, 3), v.lat + R(-3, 3)); v.g.to(v.i, p.x, p.z, v.g.r[v.i] + R(-0.7, 0.7), 1.4, R(1, 4)); });
      var tk = vs.filter(function (v) { return v.typ === 'tank'; })[0];
      if (tk) tween(0.1, 3.6, function () { boom(tk.g.x[tk.i], 3, tk.g.z[tk.i], 26); var f = addFire(tk.g.x[tk.i], tk.g.z[tk.i], 1.4, true); tween(0.1, 9, function () { f.kg = 0; }); });
      alarm(8);
      tween(0.1, 8.5, function () { vs.forEach(function (v) { v.g.back(v.i, 1.6, rnd() * 0.6); }); });
      var lp = at('m39', sE + 20, 0); var L = fxLabel('ТЎҚНАШУВ ВА ПОРТЛАШ ХАВФИ', lp.x, 30, lp.z, 'bad'); tween(0.1, 10, function () { rmLabel(L); });
    },
    gun_bad: function () {
      var t0 = S.t, pos = new Float32Array(40 * 6), lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xff3030, transparent: true, blending: THREE.AdditiveBlending })); lines.frustumCulled = false; FX.add(lines);
      var up = function (dt) {
        var el = S.t - t0; if (el > 4.5) { lines.visible = false; return; } if (!dt) return;
        for (var k = 0; k < 40; k++) {
          var a = at('m39', sE + 205, R(-28, 28)), b = at('m39', sE + R(60, 170), R(-28, 28));
          pos.set([a.x, 1.6, a.z, b.x, R(0.5, 2.5), b.z], k * 6);
          if (rnd() < 0.15) for (var n = 0; n < 6; n++) PADD.emit(b.x, 1, b.z, R(-6, 6), R(2, 8), R(-6, 6), 0.4, 0.8, 0.2, 1, COL.f2, -9.8, 0.2);
        }
        lg.attributes.position.needsUpdate = true; lines.material.opacity = rnd() < 0.5 ? 1 : 0.2;
      };
      UPDATERS.push(up);
      var vs = vehAt(sE + 40, sE + 95, 0, 'tank').concat(vehAt(sE + 40, sE + 95, 0, 'fura')).slice(0, 2);
      vs.forEach(function (v, k) { tween(0.1, 1.8 + k * 1.2, function () { boom(v.g.x[v.i], 2, v.g.z[v.i], 22); var f = addFire(v.g.x[v.i], v.g.z[v.i], 1.3, true); tween(0.1, 9, function () { f.kg = 0; }); }); });
      var idx = []; var sl = vestSL(); for (var i = 0; i < VEST_N; i++) if (sl[i].s > sE - 120) idx.push(i);
      idx.forEach(function (i) { G.vest.to(i, G.vest.x[i] + R(-14, 14), G.vest.z[i] + R(-14, 14), null, 1.5, 0.6 + rnd()); });
      tween(0.1, 8.5, function () { idx.forEach(function (i) { G.vest.back(i, 2, rnd()); }); });
      alarm(8);
      var lp = at('m39', sE + 120, 0); var L = fxLabel('ҚОНУН БУЗИЛИШИ ВА ЁНҒИН ХАВФИ', lp.x, 30, lp.z, 'bad'); tween(0.1, 10, function () { rmLabel(L); });
    },
    block_bad: function () {
      var jg = new IG(GEO.jersey, MAT.veh, 200, true); FX.add(jg.m);
      var B = BA.byId('loc_bypass'), sb = nearestS('bypass', B.x, B.z), sg = RD.green.L;
      var lines = [['bypass', sb - 220, 18], ['bypass', sb + 220, 18], ['green', sg - 60, 8], ['logi', 40, 12], ['m39', nearestS('m39', B.x, B.z) + 260, 34]];
      var xs = [];
      lines.forEach(function (ln, li) {
        var n = Math.ceil(ln[2] / 3.7) + 1;
        for (var k = 0; k < n; k++) { var p = at(ln[0], ln[1], -ln[2] / 2 + k * 3.7); var i = jg.add(p.x, 30, p.z, p.yaw + PI / 2, 1); jg.to(i, p.x, p.z, null, 0.8, li * 0.3 + k * 0.04, 1, 0); }
        var c = at(ln[0], ln[1], 0), x = xMarker(26); x.position.set(c.x, 22, c.z); FX.add(x); xs.push(x);
      });
      var up = function () { jg.update(); var k = 0.5 + 0.5 * Math.sin(performance.now() / 120); xs.forEach(function (x) { x.material.opacity = 0.4 + 0.6 * k; }); };
      UPDATERS.push(up);
      // айланма йўлда қамалиб қолган техника
      var q = new IG(GEO.fura, MAT.veh, 120, true); FX.add(q.m); var red = col(0xd23a3a);
      for (var k = 0; k < 110; k++) { var lane = k % 4, p = at('bypass', sb - 240 - Math.floor(k / 4) * 17, -6.5 + lane * 4.3); var i = q.add(p.x, 0, p.z, p.yaw, 0.001, red); q.to(i, p.x, p.z, null, 0.6, 0.5 + k * 0.02, 1); }
      var up2 = function () { q.update(); }; UPDATERS.push(up2);
      alarm(8);
      tween(0.1, 9, function () { for (var i = 0; i < jg.n; i++) jg.to(i, jg.x[i], jg.z[i], null, 0.6, i * 0.01, 0.001); for (i = 0; i < q.n; i++) q.to(i, q.x[i], q.z[i], null, 0.6, i * 0.01, 0.001); xs.forEach(function (x) { FX.remove(x); }); });
      var L = fxLabel('ҚУРШОВДАГИ ТРАНСПОРТ ВА ОЛОМОН', B.x, 60, B.z, 'bad'); tween(0.1, 10, function () { rmLabel(L); });
    }
  };
  function alarm(dur) { var t0 = S.t, up = function () { var el = S.t - t0; G.alarm.intensity = el < dur ? (Math.sin(el * 12) > 0 ? 9 : 0) : 0; }; UPDATERS.push(up); }

  // эркин транспорт оқими (11-қарор)
  var FLOW = null;
  function startFlow() {
    if (FLOW) return;
    var g = new IG(GEO.car, MAT.veh, 140, false); DYN.add(g.m);
    var cc = [0xf2f2f2, 0x1b1b1b, 0x9aa3ad, 0x8b1e1e, 0x1f4f8a, 0xc9c1a8].map(col), cars = [];
    for (var k = 0; k < 140; k++) {
      // жанубий қатнов қисмида фуралар тартибли навбатда; очилган шимолий 4 йўлакда икки томонлама оқим (2 + 2)
      var dir = k % 2 ? 1 : -1, lane = Math.floor(rnd() * 2), lat = dir > 0 ? [3.3, 6.8][lane] : [10.3, 13.8][lane];
      cars.push({ i: g.add(0, 0, 0, 0, 1, cc[k % cc.length]), s: R(sE - 3000, sE + 2500), lat: lat, v: dir * R(11, 16) });   // ≈40–58 km/soat
    }
    FLOW = { g: g, cars: cars };
  }
  function flowUpdate(dt) {
    if (!FLOW || !dt) return;
    var a = sE - 3000, b = sE + 2600;
    FLOW.cars.forEach(function (c) { c.s += c.v * dt; if (c.s > b) c.s = a; if (c.s < a) c.s = b; var p = at('m39', c.s, c.lat); FLOW.g.set(c.i, p.x, p.z, p.yaw + (c.v < 0 ? PI : 0)); });
    FLOW.g.update();
  }

  // fx — эффект номи; mode: 'ok' | 'inst' | 'err' | 'crit'; loc — локация (генерик эффектлар учун)
  var ONCE = { plan: 1, buffer: 1, water: 1, tow: 1, drones: 1, green: 1, media: 1, negot: 1, airPerim: 1 };
  function playFx(fx, mode, loc) {
    if (mode === 'err') { FXI.err(false, loc); return; }
    if (mode === 'crit') { if (fx && FXI[fx] && /_bad$/.test(fx)) FXI[fx](); else FXI.crit(false, loc); return; }
    if (!fx || !FXI[fx]) return;
    if (ONCE[fx]) { if (DONE[fx]) return; DONE[fx] = true; }
    // колонна ва эркин оқим учун йўлаклар очиқ бўлиши керак
    if ((fx === 'convoy' || fx === 'media') && !DONE.tow) { DONE.tow = true; FXI.tow(true); }
    FXI[fx](mode === 'inst', loc);
  }

  function reset() {
    while (FX.children.length) { var o = FX.children[0]; removeMig(o); FX.remove(o); }
    FXL.forEach(function (L) { rmLabel(L); }); FXL = [];
    Object.keys(ERRM).forEach(function (id) { rmLabel(ERRM[id].lb); }); ERRM = {};
    UPDATERS.length = 0; TWS.length = 0; MOVERS.length = 0; DONE = {};
    if (FLOW) { DYN.remove(FLOW.g.m); FLOW = null; }
    resetBlockade();
    SCR.wall.map = hqScreenTex('base'); SCR.wall.needsUpdate = true; G.beacon.material.opacity = 0;
    S.fog = S.fogGoal = 1; S.bright = S.brightGoal = 0; S.unrest = 1; C.follow = null;
    G.alarm.intensity = 0;
  }
  function clearMeans() { Object.keys(MEANS).forEach(removeMeansKey); }

  /* =====================================================================
     КАМЕРА ВА БОШҚАРУВ
     ===================================================================== */
  function focusPoint(id) {
    if (id === 'loc_erkin') { var p = at('m39', sE + 110, 0); return { x: p.x, z: p.z }; }
    var L = BA.byId(id); if (!L) return { x: 0, z: 0 };
    if (id === 'loc_airp_cargo') return { x: L.x, z: L.z - 220 };
    if (id === 'loc_log') return { x: L.x - 150, z: L.z + 220 };
    return { x: L.x, z: L.z };
  }
  function focusZone(id, o) {
    o = o || {}; C.follow = null; S.cine = false; if (id) S.lastFocus = id;
    if (id === 'all' || !id) { C.g.t.set(5200, 0, -4300); C.g.d = 15500; C.g.tilt = 0.98; C.g.yaw = -0.35; return; }
    var L = BA.byId(id); if (!L) return;
    var fp = focusPoint(id), cam = o.cam || L.cam;
    C.g.t.set(fp.x, 0, fp.z); C.g.d = cam.d; C.g.tilt = cam.tilt; C.g.yaw = cam.yaw;
    if (o.instant) { C.t.copy(C.g.t); C.d = C.g.d; C.tilt = C.g.tilt; C.yaw = C.g.yaw; }
  }
  function focusPointAt(x, z, cam) { C.follow = null; C.g.t.set(x, 0, z); if (cam) { C.g.d = cam.d; C.g.tilt = cam.tilt; C.g.yaw = cam.yaw; } }
  function camUpdate(dt) {
    freeFly(dt); cinematic(dt);
    if (S.spin) C.g.yaw += dt * 0.12;
    if (C.follow) C.g.t.set(C.follow.position.x, 0, C.follow.position.z);
    var k = 1 - Math.exp(-dt * 2.4);
    C.t.lerp(C.g.t, k); C.d += (C.g.d - C.d) * k; C.tilt += (C.g.tilt - C.tilt) * k; C.yaw = angLerp(C.yaw, C.g.yaw, k);
    var ct = Math.cos(C.tilt), st = Math.sin(C.tilt);
    camera.position.set(C.t.x + C.d * ct * Math.sin(C.yaw), C.t.y + C.d * st, C.t.z + C.d * ct * Math.cos(C.yaw));
    camera.lookAt(C.t);
    // соя камераси нишон ортидан юради
    var sz = clamp(C.d * 0.75, 120, 1800);
    sun.target.position.copy(C.t); sun.position.copy(C.t).add(SUN_DIR.clone().multiplyScalar(3000));
    var sc = sun.shadow.camera;
    if (Math.abs(sc.right - sz) > 1) { sc.left = -sz; sc.right = sz; sc.top = sz; sc.bottom = -sz; sc.updateProjectionMatrix(); }
  }
  function bindInput(el) {
    var ptrs = new Map(), last = null, moved = 0, pinch0 = 0;
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('pointerdown', function (e) {
      try { el.setPointerCapture(e.pointerId); } catch (er) { /* синтетик ҳодиса */ } ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey });
      last = { x: e.clientX, y: e.clientY }; moved = 0;
      if (ptrs.size === 2) { var a = Array.from(ptrs.values()); pinch0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
    });
    el.addEventListener('pointermove', function (e) {
      var p = ptrs.get(e.pointerId); if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4) C.follow = null;
      if (ptrs.size === 2) {
        var a = Array.from(ptrs.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        if (pinch0) { C.g.d = clamp(C.g.d * pinch0 / d, 25, 30000); } pinch0 = d; return;
      }
      if (p.b === 2 || p.b === 1 || p.sh) {
        // ўнг вектор (cos, -sin), олдинга (−sin, −cos) — ерда «ушлаб суриш»
        var f = C.g.d / el.clientHeight * 1.2, cy = Math.cos(C.yaw), sy = Math.sin(C.yaw);
        C.g.t.x += -dx * cy * f - dy * sy * f;
        C.g.t.z += dx * sy * f - dy * cy * f;
      } else { C.g.yaw -= dx * 0.005; C.g.tilt = clamp(C.g.tilt + dy * 0.004, 0.08, 1.55); S.cine = false; }
    });
    function up(e) {
      var p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); pinch0 = 0;
      if (p && moved < 5 && p.b === 0) pick(e);
    }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', function (e) { ptrs.delete(e.pointerId); });
    el.addEventListener('wheel', function (e) { e.preventDefault(); C.g.d = clamp(C.g.d * Math.exp(e.deltaY * 0.0012), 25, 30000); }, { passive: false });
    void last;
  }
  var RAY = new THREE.Raycaster(), PLANE = new THREE.Plane(V(0, 1, 0), 0);
  function pick(e) {
    var r = renderer.domElement.getBoundingClientRect();
    var m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    RAY.setFromCamera(m, camera); var hit = V(0, 0, 0); if (!RAY.ray.intersectPlane(PLANE, hit)) return;
    if (RUL.on) { rulerAdd(hit); return; }
    var best = null, bd = 1e18;
    BA.LOCS.forEach(function (L) { var fp = focusPoint(L.id), d = Math.hypot(fp.x - hit.x, fp.z - hit.z); if (d < SITE_R[L.id] * 1.6 && d < bd) { bd = d; best = L.id; } });
    if (best && S.onPick) S.onPick(best, { x: hit.x, z: hit.z });
  }

  /* =====================================================================
     OPENSTREETMAP: ҳақиқий бинолар, йўллар, ер қоплами ва дарахтлар (js/atrof_osm.js)
     ===================================================================== */
  function osmPoly(a, off) { var o = []; for (var i = off; i + 1 < a.length; i += 2) o.push([a[i], a[i + 1]]); if (o.length > 2 && o[0][0] === o[o.length - 1][0] && o[0][1] === o[o.length - 1][1]) o.pop(); return o; }
  function inPoly(p, x, y) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) c = !c; } return c; }
  function buildOSM() {
    var A = window.ATROF; if (!A) return;
    var Lg = BA.byId('loc_log'), skip = [[Lg.x - 520, Lg.z + 30, Lg.x + 220, Lg.z + 470]];   // логистика ҳовлиси (процедурал)
    var WALL = [[0xf1ece0, 0xe6dcc8, 0xefe6d6, 0xd9d4cc, 0xf4f1ea], [0xd8dadc, 0xc9ced4, 0xe2e4e6], [0xf4f4f2, 0xe8eef3], [0xefe5d0, 0xe2d8c4, 0xf0ece4], [0xe6dcc8], [0xf2efe6]].map(function (a) { return a.map(col); });
    var ROOF = [[0x9c3b2c, 0xa8452f, 0x8a3a2a, 0x7d7f84, 0x6e7378, 0x5f7a5a, 0xb24a32], [0xbfc5cc, 0x9aa3ad, 0x2b4f78, 0x8f979f], [0xcfd3d8, 0x3c6e9e, 0x9aa3ad], [0xa04a34, 0x8a8f96, 0x7d7f84], [0x9c3b2c], [0x3f8f6a]].map(function (a) { return a.map(col); });
    var P = [], Cl = [];
    A.b.forEach(function (b) {
      var poly = osmPoly(b, 2); if (poly.length < 3) return;
      var cx = 0, cz = 0; poly.forEach(function (p) { cx += p[0]; cz -= p[1]; }); cx /= poly.length; cz /= poly.length;
      if (skip.some(function (r) { return cx > r[0] && cx < r[2] && cz > r[1] && cz < r[3]; })) return;
      if (distRoad('m39', cx, cz) < 24) return;            // магистраль ўқи (блокада майдони)
      var g; try { var sh = new THREE.Shape(); sh.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < poly.length; i++) sh.lineTo(poly[i][0], poly[i][1]); g = new THREE.ExtrudeGeometry(sh, { depth: b[0], bevelEnabled: false }); } catch (e) { return; }
      g.rotateX(-PI / 2);
      var ar = 0; for (var ai = 0, aj = poly.length - 1; ai < poly.length; aj = ai++) ar += (poly[aj][0] + poly[ai][0]) * (poly[aj][1] - poly[ai][1]); ar = Math.abs(ar / 2);
      var k = b[1] === 0 && ar > 450 ? (ar > 1500 ? 1 : 2) : b[1];   // катта «yes» бинолар — омбор/савдо (кулранг томлар)
      var wc = WALL[k][Math.floor(rnd() * WALL[k].length)], rc = ROOF[k][Math.floor(rnd() * ROOF[k].length)];
      var pa = g.attributes.position.array, na = g.attributes.normal.array;
      for (var v = 0; v < pa.length; v += 3) { P.push(pa[v], pa[v + 1], pa[v + 2]); var c = na[v + 1] > 0.5 ? rc : wc, sh2 = na[v + 1] > 0.5 ? 1 : 0.86 + 0.14 * Math.abs(na[v]); Cl.push(c.r * sh2, c.g * sh2, c.b * sh2); }
      g.dispose();
    });
    var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); bg.computeVertexNormals();
    var bm = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.05 })); bm.castShadow = true; bm.receiveShadow = true; STATIC.add(bm); G.mahalla = bm;
    // ер қоплами (экин майдони, боғ, саноат, қабристон, сув)
    var AC = { farm: 0x8b9a5b, orch: 0x5d7d3d, grass: 0x7c9e5c, ind: 0x9b9b95, com: 0xa9a69f, res: 0x9da385, cem: 0x7b8a68, wood: 0x4d6e38, water: 0x4c7fa4, canal: 0x4c7fa4 };
    var AP = [], ACl = [], trees = [];
    A.a.forEach(function (a) {
      var c = col(AC[a[0]] || 0x888888);
      if (a[0] === 'canal') return;
      var poly = osmPoly(a, 1); if (poly.length < 3) return;
      var g; try { var sh = new THREE.Shape(); sh.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < poly.length; i++) sh.lineTo(poly[i][0], poly[i][1]); g = new THREE.ShapeGeometry(sh); } catch (e) { return; }
      g.rotateX(-PI / 2); var gi = g.index ? g.toNonIndexed() : g, pa = gi.attributes.position.array, jit = 0.92 + rnd() * 0.16;
      for (var v = 0; v < pa.length; v += 3) { AP.push(pa[v], 0.03, pa[v + 2]); ACl.push(c.r * jit, c.g * jit, c.b * jit); }
      if (a[0] === 'orch' || a[0] === 'wood' || a[0] === 'res') {
        var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; poly.forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); });
        var n = Math.min(400, Math.round((mxx - mnx) * (mxy - mny) / (a[0] === 'res' ? 2500 : 220)));
        for (var t = 0; t < n; t++) { var x = R(mnx, mxx), y = R(mny, mxy); if (inPoly(poly, x, y)) trees.push([x, -y]); }
      }
      g.dispose(); if (gi !== g) gi.dispose();
    });
    var ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(AP, 3)); ag.setAttribute('color', new THREE.Float32BufferAttribute(ACl, 3)); ag.computeVertexNormals();
    var am = new THREE.Mesh(ag, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); am.receiveShadow = true; STATIC.add(am); G.osmA = am;
    // йўллар (М-39 ва ҳалқа йўл ўзимизники — қолганлари OSM дан)
    var RP = [], RC = [], dark = col(0x3b3e43), lite = col(0x5a5d61), mark = col(0x8a8c88);
    A.r.forEach(function (r) {
      if (r[0] === 'm39' || r[0] === 'ring') return;
      var w = r[1] / 2, pts = osmPoly(r, 3), c = r[1] >= 8 ? dark : r[1] >= 5 ? lite : mark, y = r[2] ? 6 : 0.06 + Math.min(0.05, r[1] * 0.004);
      for (var i = 0; i + 1 < pts.length; i++) {
        var ax = pts[i][0], az = -pts[i][1], bx = pts[i + 1][0], bz = -pts[i + 1][1], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w, nz = dx / l * w;
        RP.push(ax + nx, y, az + nz, bx + nx, y, bz + nz, ax - nx, y, az - nz, ax - nx, y, az - nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz);
        for (var q = 0; q < 6; q++) RC.push(c.r, c.g, c.b);
        if (i > 0) { var sg = 10; for (var s = 0; s < sg; s++) { var a0 = s / sg * PI * 2, a1 = (s + 1) / sg * PI * 2; RP.push(ax, y, az, ax + Math.cos(a1) * w, y, az + Math.sin(a1) * w, ax + Math.cos(a0) * w, y, az + Math.sin(a0) * w); for (q = 0; q < 3; q++) RC.push(c.r, c.g, c.b); } }
      }
    });
    var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(RP, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(RC, 3)); rg.computeVertexNormals();
    var rm = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); rm.receiveShadow = true; STATIC.add(rm);
    G.roads.push({ m: rm, sat: rm.material, kind: 'r' });
    // дарахтлар (боғлар, ўрмон, маҳалла ҳовлилари)
    var tr = new IG(GEO.tree, MAT.bld, Math.min(9000, trees.length + 10), true); STATIC.add(tr.m); G.mahTrees = tr.m;
    trees.forEach(function (p) { if (distRoad('m39', p[0], p[1]) > 26) tr.add(p[0], 0, p[1], R(0, PI), R(0.6, 1.15)); });
    tr.update();
  }
  /* ----- «Эркин» атрофи (Google Maps): «Эркин» савдо мажмуаси, қуёш панелли омборлар, зич маҳалла ----- */
  function buildErkinArea() {
    var grp = SITE.loc_erkin;
    if (window.ATROF) { G.mahalla = new THREE.Group(); G.mahTrees = new THREE.Group(); return; }   // OSM бўлса — ҳақиқий бинолар buildOSM() да
    // савдо мажмуаси — шимоли-ғарбий томонда, олдида автотураргоҳ
    var sp = at('m39', sE + 170, 120), mall = new THREE.Group(); mall.position.set(sp.x, 0, sp.z); mall.rotation.y = sp.yaw; grp.add(mall);
    var wm = new THREE.MeshStandardMaterial({ color: col(0xf2f3f4), roughness: 0.6 }), gm = new THREE.MeshStandardMaterial({ color: col(0x2c6fae), roughness: 0.15, metalness: 0.7 });
    var b1 = new THREE.Mesh(new THREE.BoxGeometry(130, 14, 46), wm); b1.position.set(0, 7, 18); b1.castShadow = true; b1.receiveShadow = true; mall.add(b1);
    var b2 = new THREE.Mesh(new THREE.BoxGeometry(130.4, 4, 46.4), gm); b2.position.set(0, 4, 18); mall.add(b2);
    var sg = new THREE.Mesh(new THREE.PlaneGeometry(70, 5), signMat('«ЭРКИН» САВДО МАЖМУАСИ', null, 1024, 72, '#ffffff', '#c81e1e')); sg.position.set(0, 11, -5.3); sg.rotation.y = PI; mall.add(sg);
    var park = new THREE.Mesh(new THREE.PlaneGeometry(140, 42), new THREE.MeshStandardMaterial({ color: col(0x5d6066), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    park.rotation.x = -PI / 2; park.position.set(0, 0.05, -27); mall.add(park);
    var pc = new IG(GEO.car, MAT.veh, 80, false); mall.add(pc.m); var cc = [0xf2f2f2, 0x1b1b1b, 0x9aa3ad, 0x8b1e1e, 0x1f4f8a, 0xc9c1a8].map(col);
    for (var k = 0; k < 64; k++) { if (rnd() < 0.25) continue; pc.add(-62 + (k % 32) * 4, 0, -36 + Math.floor(k / 32) * 14, PI / 2, 1, cc[k % 6]); }
    pc.update();
    // қуёш панелли омборлар («Chinni bozori» ва склад ҳудуди) — М-39 шимол томонида
    var roof = canvasTex(256, 256, function (g, w, h) { g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, w, h); for (var y = 6; y < h; y += 20) for (var x = 6; x < w; x += 30) { g.fillStyle = '#1d3557'; g.fillRect(x, y, 26, 15); g.fillStyle = '#2f5a8a'; g.fillRect(x + 2, y + 2, 22, 3); } });
    var rm = new THREE.MeshStandardMaterial({ map: roof, roughness: 0.4, metalness: 0.3 }), wl = new THREE.MeshStandardMaterial({ color: col(0xd8d8d2) });
    [[sE + 330, 260, 150, 70], [sE + 520, 300, 120, 60], [sE + 300, 380, 110, 55], [sE + 120, 330, 90, 50], [sE - 120, 260, 100, 60]].forEach(function (w2) {
      var p = at('m39', w2[0], w2[1]), wh = new THREE.Group(); wh.position.set(p.x, 0, p.z); wh.rotation.y = p.yaw; grp.add(wh);
      var body = new THREE.Mesh(new THREE.BoxGeometry(w2[2], 9, w2[3]), wl); body.position.y = 4.5; body.castShadow = true; body.receiveShadow = true; wh.add(body);
      var top = new THREE.Mesh(new THREE.PlaneGeometry(w2[2] - 2, w2[3] - 2), rm); top.rotation.x = -PI / 2; top.position.y = 9.05; wh.add(top);
    });
    // зич маҳалла уйлари (томлари қизил, кулранг, яшил), ҳовлилари дарахтли — М-39 нинг иккала томонида
    var hs = new IG(GEO.house, MAT.bld, 3200, true); STATIC.add(hs.m); G.mahalla = hs.m;
    var tr = new IG(GEO.tree, MAT.bld, 700, true); STATIC.add(tr.m); G.mahTrees = tr.m;
    var hc = [0xf1ece0, 0xe6dcc8, 0xd9d4cc, 0xefe6d6, 0xcfc8be].map(col), C = BA.enToWorld(BA.CROSS[0], BA.CROSS[1]);
    for (var s = sE - 1700; s < sE + 1500; s += 22) {
      [1, -1].forEach(function (side) {
        for (var lat = 110; lat < 650; lat += 18) {
          if (rnd() < 0.5) continue;
          if (side > 0 && s > sE - 260 && s < sE + 620 && lat < 470) continue;      // савдо мажмуаси ва омборлар
          var p = at('m39', s + R(-2, 2), side * (lat + R(-2, 2)));
          if (Math.hypot(p.x - C.x, p.z - C.z) < 380) continue;                      // ҳалқали туташма
          if (distRoad('bypass', p.x, p.z) < 40) continue;
          if (rnd() < 0.1) { tr.add(p.x, 0, p.z, R(0, PI), R(0.7, 1.1)); continue; }
          hs.add(p.x, 0, p.z, p.yaw + (rnd() < 0.5 ? 0 : PI / 2), R(0.85, 1.2), hc[Math.floor(rnd() * hc.length)]);
        }
      });
    }
    hs.update(); tr.update();
  }
  /* =====================================================================
     ҚЎШИМЧА ДЕТАЛЛАР: тўсиқлар, ангарлар, самолётлар, юк доклари
     ===================================================================== */
  function buildExtras() {
    buildErkinArea();
    // М-39: ўрта бетон тўсиқ ва четки металл тўсиқлар («Эркин» атрофида 6,5 км)
    var med = new IG(GEO.jersey, MAT.veh, 2000, true); STATIC.add(med.m);
    for (var s = Math.max(10, sE - 3500); s < sE + 3000; s += 3.6) { var p = at('m39', s, 0); med.add(p.x, 0, p.z, p.yaw, 1, col(0xbdb9ae)); }
    med.update();
    var railG = merge([box(8, 0.32, 0.08, 0, 0.72, 0, 0xc7ccd2), box(0.12, 0.75, 0.12, 0, 0.37, 0, 0x8a9097)]);
    var rail = new IG(railG, MAT.veh, 1700, false); STATIC.add(rail.m);
    for (s = Math.max(10, sE - 3500); s < sE + 3000; s += 8) { [17.6, -17.6].forEach(function (l) { var q = at('m39', s, l); rail.add(q.x, 0, q.z, q.yaw, 1); }); }
    rail.update();
    // аэропорт: ангарлар, учиш назорат минораси, қўшимча самолётлар
    var A = BA.byId('loc_airp_cargo'), grp = SITE.loc_airp_cargo;
    var hm = new THREE.MeshStandardMaterial({ color: col(0xb9c0c8), metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide });
    for (var h = 0; h < 3; h++) {
      var hg = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 70, 24, 1, true, 0, PI), hm); hg.rotation.z = PI / 2; hg.rotation.y = PI / 2; hg.position.set(A.x - 380 - h * 62, 0, A.z - 140); hg.castShadow = true; hg.receiveShadow = true; grp.add(hg);
      var back = new THREE.Mesh(new THREE.CircleGeometry(24, 24, 0, PI), hm); back.position.set(A.x - 380 - h * 62, 0, A.z - 105); grp.add(back);
    }
    var tw = new THREE.Mesh(cyl(3, 4, 38, 12), new THREE.MeshStandardMaterial({ color: col(0xe5e7ea) })); tw.position.set(A.x + 180, 19, A.z - 230); tw.castShadow = true; grp.add(tw);
    var cab = new THREE.Mesh(cyl(7, 6, 6, 12), new THREE.MeshStandardMaterial({ color: col(0x2a4f70), metalness: 0.8, roughness: 0.2 })); cab.position.set(A.x + 180, 41, A.z - 230); grp.add(cab);
    var src = null; grp.children.forEach(function (o) { if (o.isGroup && o.children.length > 8) src = o; });
    if (src) [[A.x + 120, A.z - 420, -0.2], [A.x - 260, A.z - 330, 0.5]].forEach(function (c) { var pl = src.clone(); pl.position.set(c[0], 0, c[1]); pl.rotation.y = c[2]; grp.add(pl); });
    // логистика: юк доклари ва уларга қўйилган фуралар
    var Lg = BA.byId('loc_log'), cx = Lg.x - 150, cz = Lg.z + 250;
    var dockM = new THREE.MeshStandardMaterial({ color: col(0x2b3138) });
    for (var w = 0; w < 5; w++) for (var d = 0; d < 6; d++) {
      var dx = cx - 260 + w * 130 - 50 + d * 18;
      var door = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.5), dockM); door.position.set(dx, 2.3, cz - 95.9); SITE.loc_log.add(door);
      if ((w + d) % 3 === 0) { var tr = new THREE.Mesh(GEO.fura, MAT.veh); tr.position.set(dx, 0, cz - 86); tr.rotation.y = -PI / 2; tr.castShadow = true; SITE.loc_log.add(tr); }
    }
  }

  /* =====================================================================
     ХАРИТА КЎРИШ РЕЖИМЛАРИ: Спутник • Рельеф • Йўллар ва схема • Тунги/Тепловизор
     ===================================================================== */
  var VM = 'sat', VMS = null;
  function reliefMat() {
    return new THREE.ShaderMaterial({ extensions: { derivatives: true },
      vertexShader: '#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;\n#include <logdepthbuf_vertex>\n}',
      fragmentShader: '#include <common>\n#include <logdepthbuf_pars_fragment>\nvarying vec3 vW;\nfloat elev(vec2 p){ float E=p.x, N=-p.y; return 430.0+0.0022*E+0.0016*N+6.0*sin(E*0.0009+1.3)*cos(N*0.0011)+2.5*sin((E-N)*0.0031); }\nvoid main(){\n#include <logdepthbuf_fragment>\n float h=elev(vW.xz); float u=clamp((h-420.0)/55.0,0.0,1.0);\n vec3 c=mix(vec3(0.33,0.52,0.28),vec3(0.84,0.78,0.47),smoothstep(0.0,0.55,u)); c=mix(c,vec3(0.6,0.42,0.24),smoothstep(0.55,1.0,u));\n float f2=abs(fract(h/2.0-0.5)-0.5)/fwidth(h/2.0); float l2=1.0-min(f2,1.0);\n float f10=abs(fract(h/10.0-0.5)-0.5)/fwidth(h/10.0); float l10=1.0-min(f10/1.6,1.0);\n c=mix(c,vec3(0.25,0.18,0.1),l2*0.35); c=mix(c,vec3(0.15,0.08,0.04),l10*0.8);\n gl_FragColor=vec4(c,1.0); }' });
  }
  function setViewMode(m) {
    if (!VMS) VMS = { ground: ground.material, bld: G.bld.material, white: new THREE.MeshBasicMaterial({ color: 0xe8e9ec }), red: new THREE.MeshBasicMaterial({ color: 0xc81e1e }),
      dark: new THREE.MeshBasicMaterial({ color: 0x1a1c22 }), sgnd: new THREE.MeshBasicMaterial({ color: 0x0b0c10 }), sbld: new THREE.MeshBasicMaterial({ color: 0x4a4e5a }), relief: reliefMat() };
    VM = m;
    ground.material = VMS.ground; G.bld.material = VMS.bld; G.roads.forEach(function (r) { r.m.material = r.sat; });
    G.city.visible = G.trees.visible = G.houses.visible = G.mahalla.visible = G.mahTrees.visible = true; S.schema = 0; S.night = 0;
    if (G.osmA) G.osmA.visible = m === 'sat' || m === 'thermal';
    MAT.man.emissive.setHex(0); MAT.veh.emissive.setHex(0);
    if (m === 'relief') { ground.material = VMS.relief; G.city.visible = false; }
    else if (m === 'schema') {
      ground.material = VMS.sgnd; G.city.visible = G.trees.visible = G.houses.visible = G.mahTrees.visible = false; G.mahalla.visible = true; G.bld.material = VMS.sbld; S.schema = 1;
      G.roads.forEach(function (r) { r.m.material = r.kind === 'm39' ? VMS.red : r.kind === 'sh' ? VMS.dark : VMS.white; });
    } else if (m === 'thermal') { S.night = 1; MAT.man.emissive.setHex(0x8a8a8a); MAT.veh.emissive.setHex(0x262626); }
    return VM;
  }

  /* =====================================================================
     ЧИЗҒИЧ (масофа ўлчаш): 2 ва ундан ортиқ нуқта, сегментлар ва жами
     ===================================================================== */
  var RUL = { on: false, pts: [], lbl: [], cb: null, svg: null };
  function fmtDist(m) { return m < 1000 ? Math.round(m) + ' м' : (m / 1000).toFixed(2).replace('.', ',') + ' км'; }
  function rulerSet(on) { RUL.on = !!on; renderer.domElement.style.cursor = RUL.on ? 'crosshair' : ''; if (RUL.svg) RUL.svg.style.display = RUL.pts.length ? '' : 'none'; }
  function rulerAdd(p) { RUL.pts.push(V(p.x, 1, p.z)); rulerLabels(); }
  function rulerClear() { RUL.pts = []; rulerLabels(); }
  function rulerTotal() { var t = 0; for (var i = 1; i < RUL.pts.length; i++) t += RUL.pts[i].distanceTo(RUL.pts[i - 1]); return t; }
  function rulerLabels() {
    RUL.lbl.forEach(rmLabel); RUL.lbl = [];
    RUL.pts.forEach(function (p, i) {
      RUL.lbl.push(addLabel('', p, 'rpt', null, 0));
      if (i) { var a = RUL.pts[i - 1], mid = a.clone().add(p).multiplyScalar(0.5); RUL.lbl.push(addLabel(fmtDist(a.distanceTo(p)), mid, 'rseg', null, 0)); }
    });
    if (RUL.pts.length > 1) RUL.lbl.push(addLabel('ЖАМИ: ' + fmtDist(rulerTotal()), RUL.pts[RUL.pts.length - 1].clone().setY(40), 'rtot', null, 0));
    if (RUL.svg) RUL.svg.style.display = RUL.pts.length ? '' : 'none';
    if (RUL.cb) RUL.cb(rulerTotal(), RUL.pts.length);
  }
  var _r = V(0, 0, 0);
  function rulerOverlay() {
    if (!RUL.svg) { RUL.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); RUL.svg.setAttribute('class', 's3d-ruler'); overlay.appendChild(RUL.svg); }
    if (RUL.pts.length < 2) { if (RUL.svg.firstChild) RUL.svg.innerHTML = ''; return; }
    var w = host.clientWidth, h = host.clientHeight, d = '';
    RUL.pts.forEach(function (p, i) { _r.copy(p).project(camera); if (_r.z > 1) return; d += (i ? 'L' : 'M') + ((_r.x * 0.5 + 0.5) * w).toFixed(1) + ' ' + ((-_r.y * 0.5 + 0.5) * h).toFixed(1) + ' '; });
    RUL.svg.innerHTML = '<path d="' + d + '" fill="none" stroke="#000" stroke-width="6" stroke-linejoin="round" opacity=".55"/><path d="' + d + '" fill="none" stroke="#E11D48" stroke-width="3" stroke-dasharray="10 6" stroke-linejoin="round"/>';
  }

  /* =====================================================================
     КАМЕРА РЕЖИМЛАРИ: юқоридан, яқинлаштириш, 360°, эркин парвоз, кино
     ===================================================================== */
  var KEYS = {};
  window.addEventListener('keydown', function (e) {
    if (!S.ff) return; var tg = document.activeElement && document.activeElement.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
    if (/^(KeyW|KeyA|KeyS|KeyD|KeyQ|KeyE|KeyR|KeyF|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|ShiftLeft)$/.test(e.code)) { KEYS[e.code] = true; e.preventDefault(); e.stopPropagation(); }
  }, true);
  window.addEventListener('keyup', function (e) { delete KEYS[e.code]; });
  function freeFly(dt) {
    if (!S.ff) return;
    var sp = C.g.d * 0.7 * dt * (KEYS.ShiftLeft ? 3 : 1), fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw), mvF = 0, mvR = 0;
    if (KEYS.KeyW || KEYS.ArrowUp) mvF += 1; if (KEYS.KeyS || KEYS.ArrowDown) mvF -= 1; if (KEYS.KeyD || KEYS.ArrowRight) mvR += 1; if (KEYS.KeyA || KEYS.ArrowLeft) mvR -= 1;
    C.g.t.x += (fx * mvF + rx * mvR) * sp; C.g.t.z += (fz * mvF + rz * mvR) * sp;
    if (KEYS.KeyQ) C.g.yaw += dt * 0.9; if (KEYS.KeyE) C.g.yaw -= dt * 0.9;
    if (KEYS.KeyR) C.g.d = Math.max(25, C.g.d * (1 - dt * 0.9)); if (KEYS.KeyF) C.g.d = Math.min(30000, C.g.d * (1 + dt * 0.9));
    if (mvF || mvR) C.follow = null;
  }
  function cinematic(dt) {
    if (!S.cine) return;
    var a = Math.max(50, sE - 2600), b = RD.m39.L - 2500;
    S.cineS = (S.cineS == null ? a : S.cineS) + dt * 18; if (S.cineS > b) S.cineS = a;
    var p = at('m39', S.cineS, 0);
    C.g.t.set(p.x, 0, p.z); C.g.yaw = Math.atan2(-Math.cos(p.yaw), Math.sin(p.yaw)) + 0.55; C.g.d = 1500; C.g.tilt = 0.62;
  }
  var CAM = {
    overview: function () { S.cine = false; focusZone('all'); },
    top: function () { S.cine = false; C.g.tilt = 1.54; },
    zoom: function (f) { S.cine = false; C.g.d = clamp(C.g.d * f, 25, 30000); },
    orbit: function (on) { S.cine = false; S.spin = on == null ? !S.spin : !!on; return S.spin; },
    free: function (on) { S.ff = on == null ? !S.ff : !!on; if (!S.ff) KEYS = {}; return S.ff; },
    reset: function () { S.cine = false; S.spin = false; focusZone(S.lastFocus || 'all'); },
    cine: function (on) { S.cine = !!on; if (on) { S.cineS = null; S.spin = false; } }
  };

  /* =====================================================================
     4 ТА ЖОНЛИ КУЗАТУВ ДИСПЛЕЙИ (кичик камералар — render target орқали)
     ===================================================================== */
  var MINI = { cv: [], cams: [], rt: null, buf: null, big: null, bigRt: null, bigBuf: null, f: 0, i: 0, W: 240, H: 135 };
  function miniInit(canvases) {
    MINI.cv = canvases || [];
    if (!MINI.rt) { MINI.rt = new THREE.WebGLRenderTarget(MINI.W, MINI.H); MINI.rt.texture.encoding = THREE.sRGBEncoding; MINI.buf = new Uint8Array(MINI.W * MINI.H * 4); }
    var A = BA.byId('loc_airp_cargo'), Lg = BA.byId('loc_log'), F = BA.byId('loc_fuel'), sa = nearestS('airport', F.x, F.z);
    var e1 = at('m39', sE + 360, 75), e1t = at('m39', sE + 120, 0), f1 = at('airport', sa - 250, 95), f1t = at('airport', sa - 380, 25);
    var defs = [[e1.x, 42, e1.z, e1t.x, 0, e1t.z], (function () { var a = at('m39', sE - 260, -60), b = at('m39', sE + 60, 0); return [a.x, 70, a.z, b.x, 0, b.z]; })(), [A.x + 330, 70, A.z - 120, A.x - 80, 5, A.z - 330], [f1.x, 38, f1.z, f1t.x, 0, f1t.z]];
    MINI.cams = defs.map(function (d) { var c = new THREE.PerspectiveCamera(52, 16 / 9, 1, 25000); c.position.set(d[0], d[1], d[2]); c.userData.t = V(d[3], d[4], d[5]); c.lookAt(c.userData.t); return c; });
  }
  function blit(cv, buf, W, H) {
    var g = cv.getContext('2d'); if (cv.width !== W) { cv.width = W; cv.height = H; }
    var img = g.createImageData(W, H), row = W * 4;
    for (var y = 0; y < H; y++) img.data.set(buf.subarray((H - 1 - y) * row, (H - y) * row), y * row);
    for (var a = 3; a < img.data.length; a += 4) img.data[a] = 255;   // шаффоф зарралар ортидаги алфа — тўлиқ кўринадиган кадр
    g.putImageData(img, 0, 0);
  }
  function miniRender(i, rt, buf, W, H, cv) {
    var c = MINI.cams[i], t = performance.now() / 1000; if (!c) return;
    var tg = c.userData.t; c.lookAt(tg.x + Math.sin(t * 0.25 + i) * 25, tg.y, tg.z + Math.cos(t * 0.21 + i) * 18);
    renderer.setRenderTarget(rt); renderer.render(scene, c); renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf); renderer.setRenderTarget(null);
    blit(cv, buf, W, H);
  }
  function miniUpdate() {
    if (!MINI.cams.length || S.idle) return;
    MINI.f++;
    if (Q.tier === 0 && !MINI.big) return;   // kuchsiz qurilmada kichik kameralar 3D'da qayta chizilmaydi (GPU'dan o'qish og'ir)
    if (Q.tier === 1 && !MINI.big && MINI.f % 40) return;
    if (MINI.big) {
      if (MINI.f % 6 === 0) {
        if (!MINI.bigRt) { MINI.bigRt = new THREE.WebGLRenderTarget(640, 360); MINI.bigRt.texture.encoding = THREE.sRGBEncoding; MINI.bigBuf = new Uint8Array(640 * 360 * 4); }
        miniRender(MINI.big.i, MINI.bigRt, MINI.bigBuf, 640, 360, MINI.big.cv);
      }
      return;
    }
    if (MINI.f % 15) return;
    for (var k = 0; k < 4; k++) {
      MINI.i = (MINI.i + 1) % 4; var cv = MINI.cv[MINI.i];
      if (cv && cv.offsetParent && cv.dataset.video !== '1') { miniRender(MINI.i, MINI.rt, MINI.buf, MINI.W, MINI.H, cv); return; }
    }
  }
  /* =====================================================================
     ОСМОН, ТУМАН, ЁРУҒЛИК
     ===================================================================== */
  var SUN_DIR = V(0.82, 0.32, 0.45).normalize();
  var SKY = { top0: col(0x8d9aa6), hor0: col(0xc7c9c4), top1: col(0x3f7fc6), hor1: col(0xcfe1ef) };
  function buildSky() {
    var g = new THREE.SphereGeometry(45000, 32, 16);
    var m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: SKY.top0.clone() }, hor: { value: SKY.hor0.clone() }, sunDir: { value: SUN_DIR }, sunK: { value: 0.3 } },
      vertexShader: '#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 vW; void main(){ vW=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);\n#include <logdepthbuf_vertex>\n}',
      fragmentShader: '#include <common>\n#include <logdepthbuf_pars_fragment>\nuniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform float sunK; varying vec3 vW; void main(){\n#include <logdepthbuf_fragment>\n float h=clamp(vW.y,0.0,1.0); vec3 c=mix(hor,top,pow(h,0.55)); float s=max(dot(normalize(vW),sunDir),0.0); c+=vec3(1.0,0.82,0.6)*(pow(s,600.0)*2.5+pow(s,8.0)*0.35)*sunK; gl_FragColor=vec4(c,1.0); }' });
    sky = new THREE.Mesh(g, m); sky.renderOrder = -1; scene.add(sky);
  }
  var FOGC = { a: col(0xb9bdbd), b: col(0xcbdbe7) };
  function atmosUpdate(dt) {
    S.fog += (S.fogGoal - S.fog) * Math.min(1, dt * 0.35);
    S.bright += (S.brightGoal - S.bright) * Math.min(1, dt * 0.35);
    var b = S.tod === 'day' ? Math.max(S.bright, 1) : S.bright;   // кундузги режимда — очиқ ҳаво
    scene.fog.color.copy(FOGC.a).lerp(FOGC.b, b);
    scene.fog.density = S.fog * (S.tod === 'day' ? 0.22 : S.tod === 'night' ? 0.45 : 0.62) / (C.d + 380) + 0.000012;
    sky.material.uniforms.top.value.copy(SKY.top0).lerp(SKY.top1, b);
    sky.material.uniforms.hor.value.copy(SKY.hor0).lerp(SKY.hor1, b);
    sky.material.uniforms.sunK.value = 0.35 + 0.65 * b;
    sky.position.copy(camera.position);
    sun.intensity = 1.0 + 0.9 * b; hemi.intensity = 0.55 + 0.25 * b; G.amb.intensity = 0.25; sun.color.setHex(0xffdcb0);
    renderer.toneMappingExposure = 0.92 + 0.14 * b;
    if (S.night || S.tod === 'night') {
      scene.fog.color.setHex(S.night ? 0x05070a : 0x070b16); scene.fog.density *= 0.7; sky.material.uniforms.top.value.setRGB(0.005, 0.007, 0.012); sky.material.uniforms.hor.value.setRGB(0.02, 0.025, 0.035); sky.material.uniforms.sunK.value = 0;
      // тун: ой нури (кўкиш), паст фон ёруғлиги — чироқлар ва мигалкалар ажралиб туради
      sun.intensity = S.night ? 0.06 : 0.22; sun.color.setHex(0x9fb4ff); hemi.intensity = S.night ? 0.12 : 0.07; G.amb.intensity = S.night ? 0.25 : 0.04; renderer.toneMappingExposure = S.night ? 1.25 : 1.1;
    } else if (S.schema) {
      scene.fog.color.setHex(0x090a0d); scene.fog.density *= 0.35; sky.material.uniforms.top.value.setRGB(0.035, 0.04, 0.05); sky.material.uniforms.hor.value.setRGB(0.035, 0.04, 0.05); sky.material.uniforms.sunK.value = 0; renderer.toneMappingExposure = 1.0;
    }
  }

  /* =====================================================================
     GLB МОДЕЛЛАР (ихтиёрий)
     ===================================================================== */
  var UNIT_GLB = {};
  var LOC_GLB = { loc_erkin: 'm39_erkin_ypx.glb', loc_log: 'logistika_markazi.glb', loc_airp_cargo: 'aeroport_yuk_terminali.glb' };
  function loadGLB(url) {
    return new Promise(function (res) {
      if (!THREE.GLTFLoader || location.protocol === 'file:') return res(null);
      try {
        var ld = new THREE.GLTFLoader();
        if (window.MeshoptDecoder && ld.setMeshoptDecoder) ld.setMeshoptDecoder(window.MeshoptDecoder);   // siqilgan geometriya (meshopt)
        ld.load(url, function (g) { res(g.scene); }, undefined, function (e) { console.warn('GLB:', url, e); res(null); });
      } catch (e) { res(null); }
    });
  }
  function prepGLB(obj, zoneId) { obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.zoneId = zoneId; } }); return obj; }
  // list: {locations:['m39_erkin_ypx.glb',...], units:['fura.glb',...]} — фақат мавжуд файллар (404 бўлмаслиги учун)
  function loadModels(list) {
    list = list || {}; var jobs = [], loaded = [];
    var locs = list.locations || [], units = list.units || [];
    // kuchsiz qurilmada og'ir modellar yuklanmaydi (dasturiy shakl yoki yengil varianti qoladi)
    if (Q.tier === 0) units = units.filter(function (f) { return !/^(fura_hero_\d+|avtobus|yxxb_2|traktor_\d+)\.glb$/i.test(f); });
    else if (Q.tier === 1) units = units.filter(function (f) { return !/^fura_hero_1\.glb$/i.test(f); });
    Object.keys(LOC_GLB).forEach(function (id) {
      var f = LOC_GLB[id]; if (locs.indexOf(f) < 0) return;
      jobs.push(loadGLB('models/locations/' + f).then(function (obj) {
        if (!obj) return; var L = BA.byId(id); prepGLB(obj, id); obj.position.set(L.x, 0, L.z); STATIC.add(obj);
        if (SITE[id]) SITE[id].visible = false; loaded.push(f);
      }));
    });
    units.forEach(function (f) {
      var name = f.replace(/\.glb$/i, '');
      jobs.push(loadGLB('models/units/' + f).then(function (obj) {
        if (!obj) return; prepGLB(obj, 'unit');
        // fura_1.glb, fura_2.glb … (оммавий) ва fura_hero_1.glb … (олдинги қаторлар) — турли русумдаги юк машиналари
        var fm = /^fura_(hero_)?\d+$/i.exec(name);
        if (fm) {
          var fv = furaVariant(obj, name); if (!fv) return;
          var arr = fm[1] ? FV.hero : FV.mass; arr.push(fv); loaded.push(f);
          // текстурасиз кузов («body/paint/cab» материал) бўлса — яна 2 та ранг варианти (бир хил бўлиб қолмаслиги учун)
          [0x1f4f8a, 0xa8231d, 0x2e6b3f, 0xd9a21b].slice(0, 2 + (name.length % 2)).forEach(function (hex, ci) {
            var c = furaRecolor(fv, hex, ci); if (c) arr.push(c);
          });
          return;
        }
        // traktor.glb, traktor_1.glb … — фермер тракторлари (текстуралари билан, оммавий нусхада)
        // xodim.glb, xodim_1.glb … — ҳуқуқ-тартибот ходимлари (текстура билан; фақат камерага яқинлари батафсил чизилади)
        var vm = /^(traktor|xodim)(?:_\d+)?$/i.exec(name);
        if (vm) {
          var isP = vm[1].toLowerCase() === 'xodim', keys = isP ? ['offc', 'buf'] : ['trac'];
          var pp = glbParts(obj, isP ? 1.8 : 5, isP); if (!pp) return;
          // иккаласи ҳам масофага қараб (LOD): одамлар — 900 тагача, тракторлар — 50 тагача яқин нусха батафсил, қолганлари содда шаклда
          keys.forEach(function (key) { (VG[key] = VG[key] || { list: [], on: false, ver: -1, people: true, cap: isP ? 900 : 50, rMin: isP ? 140 : 220, near: [] }).list.push(instVariant(pp, isP ? 900 : 50, !isP)); });
          loaded.push(f); return;
        }
        // якка техника: suv_purkagich, evakuator, avtobus, dron, yxxb, fvv, tez_yordam (+ _2, _3 … вариантлари)
        var um = /^(suv_purkagich|evakuator|avtobus|dron|yxxb|fvv|tez_yordam)(?:_\d+)?$/i.exec(name);
        if (um) {
          var kind = um[1].toLowerCase() === 'tez_yordam' ? 'ambulance' : um[1].toLowerCase();
          (UNIT_GLB[kind] = UNIT_GLB[kind] || []).push(normUnit(obj, UNIT_LEN[kind] || 6));
          loaded.push(f); return;
        }
        // Кўп нусхали (InstancedMesh) моделлар: барча қисмлари битта геометрияга бирлаштирилади (материал ранглари вертексга ўтади)
        var inst = { fura: ['fura'], sisterna: ['tank'], traktor: ['trac'], haydovchi: ['vest', 'civ', 'extra'], provokator: ['prov'], xodim: ['offc', 'buf'] };
        var target = { fura: 16.5, sisterna: 15, traktor: 5, haydovchi: 1.75, provokator: 1.75, xodim: 1.78 };
        if (inst[name]) {
          var P = [], N = [], Cc = [];
          obj.updateMatrixWorld(true);
          obj.traverse(function (o) {
            if (!o.isMesh) return;
            var g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g0.applyMatrix4(o.matrixWorld);
            if (!g0.attributes.normal) g0.computeVertexNormals();
            var mt = Array.isArray(o.material) ? o.material[0] : o.material, c = mt && mt.color ? mt.color.clone() : new THREE.Color(1, 1, 1);
            var pa = g0.attributes.position.array, na = g0.attributes.normal.array, vc = g0.attributes.color;
            for (var v = 0; v < pa.length / 3; v++) {
              P.push(pa[v * 3], pa[v * 3 + 1], pa[v * 3 + 2]); N.push(na[v * 3], na[v * 3 + 1], na[v * 3 + 2]);
              if (vc) Cc.push(vc.getX(v) * c.r, vc.getY(v) * c.g, vc.getZ(v) * c.b); else Cc.push(c.r, c.g, c.b);
            }
          });
          if (!P.length) return;
          var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
          g.computeBoundingBox(); var bb = g.boundingBox, sz = V(0, 0, 0); bb.getSize(sz);
          var person = /haydovchi|provokator|xodim/.test(name);
          if (!person && sz.z > sz.x) { g.rotateY(PI / 2); g.computeBoundingBox(); bb = g.boundingBox; bb.getSize(sz); }   // узунлиги X ўқи бўйлаб бўлиши керак
          var k = target[name] / (person ? sz.y : Math.max(sz.x, sz.z));
          g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); g.scale(k, k, k);
          if (person) { var Tn = new Float32Array(g.attributes.position.count).fill(0.35); g.setAttribute('tint', new THREE.BufferAttribute(Tn, 1)); }   // форма рангини енгил сақлаш
          inst[name].forEach(function (key) { G[key].m.geometry = g; G[key].m.material = person ? MAT.man : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.25 }); if (person) G[key].glb = true; });
          GLB_PEOPLE = GLB_PEOPLE || person;
        } else return;
        loaded.push(f);
      }));
    });
    return Promise.all(jobs).then(function () { furaAssign(); Object.keys(VG).forEach(vgAssign); refreshPersistVeh(); return loaded; });
  }

  /* ----- Якка техника: GLB ни меъёрлаштириш (марказ, пастки нуқта 0, узунлиги X бўйлаб, ҳақиқий узунликка) ----- */
  var UNIT_LEN = { suv_purkagich: 9.5, evakuator: 10.5, fvv: 9.5, avtobus: 12.5, yxxb: 4.9, ambulance: 5.6, dron: 1.9 };
  function normUnit(obj, len) {
    obj.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(obj), sz = V(0, 0, 0), c = V(0, 0, 0); box.getSize(sz); box.getCenter(c);
    var inner = new THREE.Group(), outer = new THREE.Group();
    obj.position.sub(V(c.x, box.min.y, c.z)); inner.add(obj);
    if (sz.z > sz.x * 1.15) inner.rotation.y = PI / 2;                 // узунлиги Z бўйлаб бўлса — X га бурилади
    var L0 = Math.max(sz.x, sz.z), k = len / L0; outer.add(inner); outer.scale.setScalar(k);
    outer.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; var ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(function (m) { if (m && m.map) m.map.anisotropy = 4; }); } });
    outer.userData.h = sz.y * k; outer.userData.len = len;
    return outer;
  }

  /* ----- Умумий GLB вариантлар (IG гуруҳлари учун): тракторлар — барча нусхалар моделга ўтади;
     одамлар — фақат камерага яқин (радиус ичидаги) нусхалар батафсил модел билан, қолганлари содда шаклда ----- */
  var VG = {};
  function glbParts(obj, target, person) {
    obj.updateMatrixWorld(true);
    var parts = [], box = new THREE.Box3();
    obj.traverse(function (o) {
      if (!o.isMesh) return;
      var g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g.computeBoundingBox(); box.union(g.boundingBox);
      parts.push({ g: g, m: o.material });
    });
    if (!parts.length) return null;
    var sz = V(0, 0, 0); box.getSize(sz);
    var rot = !person && sz.z > sz.x * 1.15 ? PI / 2 : 0, k = target / (person ? sz.y : Math.max(sz.x, sz.z));
    parts.forEach(function (p) {
      p.g.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2); p.g.rotateY(rot); p.g.scale(k, k, k);
      (Array.isArray(p.m) ? p.m : [p.m]).forEach(function (m) { if (m && m.map) m.map.anisotropy = 4; });
    });
    return parts;
  }
  function instVariant(parts, max, cast) {
    var v = { parts: [], idx: [] };
    parts.forEach(function (p) {
      var im = new THREE.InstancedMesh(p.g, p.m, max);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = !!cast; im.receiveShadow = true;
      v.parts.push(im); DYN.add(im);
    });
    return v;
  }
  function vgAssign(key) {
    var V2 = VG[key], g = G[key]; if (!V2 || !g || !V2.list.length) return;
    V2.on = true; V2.ver = -1; V2.capT = Math.round((V2.cap || 900) * [0.3, 0.6, 1][Q.tier]);
    if (V2.people) return;                               // одамлар — ҳар кадрда яқинлик бўйича (vgSync)
    V2.list.forEach(function (v) { v.idx = []; });
    for (var i = 0, prev = -1; i < g.n; i++) { var j = Math.floor(rnd() * V2.list.length); if (V2.list.length > 1 && j === prev) j = (j + 1) % V2.list.length; prev = j; V2.list[j].idx.push(i); }
    V2.list.forEach(function (v) { v.parts.forEach(function (im) { im.count = v.idx.length; }); });
    g.m.visible = false;
  }
  var _zero = new Float32Array(16), vgFrame = 0;
  function vgCopy(v, src) {
    v.parts.forEach(function (im) {
      var a = im.instanceMatrix.array;
      for (var k = 0; k < v.idx.length; k++) { var o = v.idx[k] * 16; for (var e = 0; e < 16; e++) a[k * 16 + e] = src[o + e]; }
      im.count = v.idx.length; im.instanceMatrix.needsUpdate = true;
    });
  }
  function vgSync() {
    vgFrame++;
    Object.keys(VG).forEach(function (key) {
      var V2 = VG[key], g = G[key]; if (!V2.on || !g) return;
      if (!V2.people) { if (V2.ver !== g.ver) { V2.ver = g.ver; V2.list.forEach(function (v) { vgCopy(v, g.m.instanceMatrix.array); }); } return; }
      // одамлар: камера нишони атрофидаги R радиусдаги нусхалар (кўпи билан CAP та) — GLB, қолганлари — оддий шакл
      var near = C.d < 900, src = g.m.instanceMatrix.array, i;
      if (!near) {
        if (V2.near.length) { V2.near.forEach(function (j) { g.write(j); }); V2.near = []; V2.list.forEach(function (v) { v.idx = []; v.parts.forEach(function (im) { im.count = 0; }); }); g.update(); V2.ver = g.ver; }
        return;
      }
      if (V2.ver === g.ver && vgFrame % 15) return;
      var R = Math.max(V2.rMin || 140, C.d * 0.9), R2 = R * R, CAP = V2.capT || V2.cap || 900, tx = C.t.x, tz = C.t.z, list = [];
      for (i = 0; i < g.n && list.length < CAP; i++) { if (g.s[i] <= 0) continue; var dx = g.x[i] - tx, dz = g.z[i] - tz; if (dx * dx + dz * dz < R2) list.push(i); }
      V2.near.forEach(function (j) { g.write(j); });     // аввалги рўйхатдагилар оддий шаклга қайтарилади (матрица қайта ҳисобланади)
      V2.list.forEach(function (v) { v.idx = []; });
      list.forEach(function (j, n) { V2.list[n % V2.list.length].idx.push(j); });
      V2.list.forEach(function (v) { vgCopy(v, src); });
      list.forEach(function (j) { src.set(_zero, j * 16); }); // оддий шакл яширилади (матрица 0)
      g.m.instanceMatrix.needsUpdate = true; g.dirty = false;
      V2.near = list; V2.ver = g.ver;
    });
  }

  /* ----- Юк машиналари русумлари: ҳар бир модел (текстуралари билан) алоҳида InstancedMesh гуруҳи,
     жойлашуви G.fura дан нусхаланади (эвакуация ва бошқа ҳаракатлар ҳам шу орқали кўринади) ----- */
  var FV = { mass: [], hero: [], on: false, ver: -1 };
  // Моделнинг олди (кабина) қайси томонда — автоматик аниқланади: кабина томони кузов/тиркамадан пастроқ бўлади.
  // Аниқлаш хато бўлса, шу ерда қўлда белгиланади: 1 — 180° буриш, 0 — бурмаслик
  var FURA_FLIP = {};
  function furaVariant(obj, name) {
    obj.updateMatrixWorld(true);
    var parts = [], box = new THREE.Box3();
    obj.traverse(function (o) {
      if (!o.isMesh) return;
      var g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g.computeBoundingBox(); box.union(g.boundingBox);
      parts.push({ g: g, m: o.material });
    });
    if (!parts.length) return null;
    var sz = V(0, 0, 0); box.getSize(sz);
    var rot = sz.z > sz.x ? PI / 2 : 0, cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
    var len = Math.max(sz.x, sz.z), k = len > 4 && len < 22 ? 1 : 16.5 / len;     // ҳақиқий ўлчамда (метр) — бўлмаса 16,5 м га келтирилади
    var v = { name: name, parts: [], idx: [] };
    parts.forEach(function (p) { p.g.translate(-cx, -box.min.y, -cz); p.g.rotateY(rot); p.g.scale(k, k, k); });
    // олд томонни аниқлаш: учлардаги энг баланд нуқта. Иккала учи ҳам баланд — кузовли машина, кабина пастроқ томонда;
    // бир учи жуда паст (≤40%) — тиркамасиз тягач, у ер орқа (эгар), кабина баланд томонда
    var hx = 0, hn = 0, hm = 0, L2 = len * k / 2;
    parts.forEach(function (p) {
      var a = p.g.attributes.position;
      for (var q = 0; q < a.count; q++) { var x = a.getX(q), y = a.getY(q); if (y > hm) hm = y; if (x > L2 * 0.76 && y > hx) hx = y; if (x < -L2 * 0.76 && y > hn) hn = y; }
    });
    var cabPlus = Math.min(hx, hn) < hm * 0.4 ? hx > hn : hx < hn;
    var flip = FURA_FLIP[name] != null ? FURA_FLIP[name] : (cabPlus ? 0 : 1);
    parts.forEach(function (p) {
      if (flip) p.g.rotateY(PI);
      var mats = Array.isArray(p.m) ? p.m : [p.m];
      mats.forEach(function (mt) { if (mt && mt.map) mt.map.anisotropy = 4; });
      var im = new THREE.InstancedMesh(p.g, p.m, G.fura.max);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = !/^fura_hero_/i.test(name); im.receiveShadow = true;
      v.parts.push(im); DYN.add(im);
    });
    return v;
  }
  function furaRecolor(v, hex, ci) {
    var hit = false, nv = { name: v.name + '_c' + ci, parts: [], idx: [] };
    v.parts.forEach(function (im) {
      var mt = im.material;
      if (!Array.isArray(mt) && !mt.map && /body|paint|cab|kuzov/i.test(mt.name || '')) { mt = mt.clone(); mt.color.setHex(hex); hit = true; }
      var n = new THREE.InstancedMesh(im.geometry, mt, im.instanceMatrix.count);
      n.instanceMatrix.setUsage(THREE.DynamicDrawUsage); n.count = 0; n.frustumCulled = false; n.castShadow = true; n.receiveShadow = true;
      nv.parts.push(n);
    });
    if (!hit) return null;
    nv.parts.forEach(function (n) { DYN.add(n); });
    return nv;
  }
  function furaAssign() {
    var all = FV.mass.concat(FV.hero); if (!all.length || !G.fura) return;
    var mass = FV.mass.length ? FV.mass : FV.hero, hero = FV.hero.length ? FV.hero : FV.mass;
    all.forEach(function (v) { v.idx = []; });
    // ҳар хил русум аралаш: қўшни машиналар бир хил бўлиб қолмаслиги учун тасодифий, лекин кетма-кет такрорланмайди
    var prev = -1;
    for (var i = 0; i < G.fura.n; i++) {
      var pool = FURA_FRONT[i] ? hero : mass, j = Math.floor(rnd() * pool.length);
      if (pool.length > 1 && j === prev) j = (j + 1) % pool.length;
      prev = j; pool[j].idx.push(i);
    }
    all.forEach(function (v) { v.parts.forEach(function (im) { im.count = v.idx.length; }); });
    G.fura.m.visible = false; FV.on = true; FV.ver = -1; furaSync();
  }
  function furaSync() {
    if (!FV.on || FV.ver === G.fura.ver) return; FV.ver = G.fura.ver;
    var src = G.fura.m.instanceMatrix.array;
    FV.mass.concat(FV.hero).forEach(function (v) {
      v.parts.forEach(function (im) {
        var a = im.instanceMatrix.array;
        for (var k = 0; k < v.idx.length; k++) { var o = v.idx[k] * 16; for (var e = 0; e < 16; e++) a[k * 16 + e] = src[o + e]; }
        im.instanceMatrix.needsUpdate = true;
      });
    });
  }
  // битта юк машинаси (эффектлар учун): русумли модел бўлса — ўшандан нусха
  function furaMesh(n) {
    var all = FV.mass.concat(FV.hero);
    if (!all.length) { var mm = new THREE.Mesh(GEO.fura, MAT.veh); mm.castShadow = true; return mm; }
    var v = all[(n || 0) % all.length], grp = new THREE.Group();
    v.parts.forEach(function (im) { var m = new THREE.Mesh(im.geometry, im.material); m.castShadow = true; grp.add(m); });
    return grp;
  }

  /* =====================================================================
     ИШГА ТУШИРИШ ВА ЦИКЛ
     ===================================================================== */
  // одамлар LOD: камера яқин бўлса — батафсил модел, узоқда — содда (6 млн → 0,5 млн учбурчак)
  var LOD = null, GLB_PEOPLE = false;
  var FAR = null;
  function lodPeople() {
    // juda uzoqdan (3,5 km+) odamlar piksel o'lchamidan ham kichik — ular umuman chizilmaydi (minglab nusxa tejaladi)
    var far = C.d > 3500;
    if (far !== FAR) { FAR = far; ['vest', 'prov', 'offc', 'buf', 'shield', 'civ', 'extra'].forEach(function (k) { if (G[k]) G[k].m.visible = !far; }); }
    var near = C.d < 900;
    if (LOD === near || !GEO.manLo) return; LOD = near;
    if (!G.vest.glb) G.vest.m.geometry = G.civ.m.geometry = G.extra.m.geometry = near ? GEO.man : GEO.manLo;
    if (!G.prov.glb) G.prov.m.geometry = near ? GEO.manMask : GEO.manMaskLo;
    if (!G.offc.glb) G.offc.m.geometry = G.buf.m.geometry = near ? GEO.manPol : GEO.manPolLo;
  }
  function resize() {
    var w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setPixelRatio(S.lite ? 0.5 : Math.min(window.devicePixelRatio || 1, [0.75, 1, 1.5][Q.tier]));   // yengil rejimda past aniqlik
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    var sc = h * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * PI / 360));
    if (COMP) { COMP.setPixelRatio(renderer.getPixelRatio()); COMP.setSize(w, h); FXAA.material.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio())); }
    PSYS.forEach(function (p) { p.mat.uniforms.uScale.value = sc; }); LAMPS.forEach(function (m) { m.uniforms.uScale.value = sc; });
  }
  /* ----- SIFAT DARAJASI (qurilmaga moslashuv) -----
     0 — kuchsiz (telefon, integrallashgan GPU): 0,75 piksel, soyasiz, effektsiz, 24 kadr/s, batafsil modellar kam
     1 — o'rta: 1,0 piksel, yengil soya, 30 kadr/s;   2 — kuchli: to'liq sifat, 60 kadr/s.
     Ishlash davomida FPS uzoq vaqt past bo'lsa — daraja avtomatik pasayadi (sayt qotmasligi uchun). */
  var Q = { tier: 2, maxFps: 60, auto: true, lowN: 0, lastT: 0 };
  function detectTier() {
    var ua = navigator.userAgent || '', mob = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua));
    var cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8, gpu = '';
    try { var gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { /* йўқ */ }
    var t = 2;
    if (mob || cores <= 4 || mem <= 4 || /Intel|UHD|Iris|Mali|Adreno|PowerVR|Apple GPU/i.test(gpu)) t = 1;
    if (/SwiftShader|llvmpipe|Microsoft Basic|Mali-[4T]|Adreno \(TM\) [1-5]/i.test(gpu) || (mob && mem <= 3) || cores <= 2) t = 0;
    var forced = null; try { forced = localStorage.getItem('m39_q'); } catch (e) { /* хусусий режим */ }
    if (forced != null && /^[012]$/.test(forced)) { t = +forced; Q.auto = false; }
    Q.gpu = gpu; return t;
  }
  function applyTier(t) {
    Q.tier = t; Q.maxFps = [24, 30, 60][t];
    var sh = t >= 1;
    if (renderer.shadowMap.enabled !== sh) { renderer.shadowMap.enabled = sh; scene.traverse(function (o) { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.needsUpdate = true; }); }); }
    sun.castShadow = sh;
    // o'rta/kuchsiz darajada ≈7 300 bino va ≈9 000 daraxt soya tashlamaydi (soya xaritasi har yangilanishda ularni qayta chizmaydi)
    if (G.mahalla && G.mahalla.isMesh) G.mahalla.castShadow = t === 2;
    if (G.mahTrees && G.mahTrees.isMesh) G.mahTrees.castShadow = t === 2;
    var ms = t === 2 ? 2048 : 1024; if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    Object.keys(VG).forEach(function (k) { var v = VG[k]; v.capT = Math.round((v.cap || 900) * [0.3, 0.6, 1][t]); v.ver = -1; });
    resize();
  }
  // FPS uzoq past bo'lsa — darajani pasaytirish (oshirish yo'q: tebranib turmasligi uchun)
  function autoQuality() {
    if (!Q.auto || S.idle || S.lite || document.hidden || Q.tier === 0) return;   // yengil rejimda sifat pasaytirilmaydi
    if (FPS < Q.maxFps * 0.6) Q.lowN++; else Q.lowN = Math.max(0, Q.lowN - 1);
    if (Q.lowN >= 4) { Q.lowN = 0; applyTier(Q.tier - 1); console.info('M39: sifat pasaytirildi →', Q.tier); }
  }
  var lastFrame = 0, shFrame = 0, fpsAcc = 0, fpsN = 0, FPS = 60, idleDrawn = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || S.lost) return;
    now = now || performance.now();
    // Sahna to'liq yopilgan (video, natija oynasi) yoki bosh ekran — sekundiga 2 marta, aks holda daraja chegarasida
    var minDt = S.idle ? 500 : S.lite ? 1000 / 12 : 1000 / Q.maxFps - 1;   // yengil rejim: 12 kadr/s
    if (now - Q.lastT < minDt) return;
    Q.lastT = now;
    var dtR = Math.min(0.05, clock.getDelta()), dt = S.paused ? 0 : dtR;
    S.t += dt;
    fpsAcc += dtR; fpsN++; if (fpsAcc > 1) { FPS = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; autoQuality(); }
    if (S.idle && idleDrawn > 2 && !S.cine) return;   // yopiq holatda statik kadr yetarli — hech narsa qayta chizilmaydi
    idleDrawn = S.idle ? idleDrawn + 1 : 0;
    tweensUpdate(); moversUpdate();
    for (var i = 0; i < UPDATERS.length; i++) UPDATERS[i](dt);
    fireUpdate(dt);
    // провокаторлар тебраниши (тартибсизлик даражасига кўра)
    if (dt && S.unrest > 0.2 && (lastFrame++ % 3 === 0)) {
      for (var k = 0; k < PROV_IDX.length; k += 3) { var j = PROV_IDX[k]; if (G.prov.tw.has(j) || G.prov.s[j] === 0) continue; G.prov.r[j] += R(-0.25, 0.25); G.prov.write(j); }
    }
    ['fura', 'tank', 'trac', 'vest', 'prov', 'offc', 'buf', 'shield', 'civ', 'extra'].forEach(function (key) { G[key].update(); });
    furaSync(); vgSync(); lodPeople();
    flowUpdate(dt);
    if (dt) { PADD.update(dt); PNRM.update(dt); }
    migUpdate(); errUpdate();
    var t = performance.now() / 1000, fl = S.unrest > 0 ? 1 : 0.3;
    G.redL.intensity = (Math.sin(t * 9) > 0 ? 3 : 0) * fl; G.bluL.intensity = (Math.sin(t * 9) <= 0 ? 3 : 0) * fl;
    camUpdate(dtR); atmosUpdate(dtR);
    if (renderer.shadowMap.enabled && (shFrame++ % (Q.tier === 2 ? 20 : 45)) === 0) renderer.shadowMap.needsUpdate = true;
    if (COMP && Q.tier === 2 && S.fx !== false && (S.night || S.tod === 'night')) { BLOOM.strength = S.night ? 0.5 : 0.95; COMP.render(); } else renderer.render(scene, camera);
    miniUpdate();
    labelsUpdate(); rulerOverlay();
  }

  function init(container) {
    if (S.ready) return true;
    host = container;
    try {
      // antialias faqat kuchli qurilmada (keyin FXAA yoki tabiiy); WebGL xatosida — soddalashtirilgan sozlama bilan qayta urinish
      var hiDpi = (window.devicePixelRatio || 1) > 1.4;
      try { renderer = new THREE.WebGLRenderer({ antialias: !hiDpi, logarithmicDepthBuffer: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }); }
      catch (e1) { renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: true, powerPreference: 'default' }); }
    } catch (e) { console.warn('WebGL йўқ:', e); return false; }
    // WebGL konteksti yo'qolsa (drayver qayta ishga tushsa) — sahifa qotib qolmasin, avtomatik tiklanadi
    renderer.domElement.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); S.lost = true; console.warn('M39: WebGL konteksti yo\'qoldi'); }, false);
    renderer.domElement.addEventListener('webglcontextrestored', function () { S.lost = false; applyTier(Math.max(0, Q.tier - 1)); }, false);
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    renderer.domElement.className = 's3d-canvas'; host.appendChild(renderer.domElement);
    overlay = document.createElement('div'); overlay.className = 's3d-labels'; host.appendChild(overlay);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xb9bdbd, 0.00042);
    camera = new THREE.PerspectiveCamera(42, 1, 1, 60000);
    hemi = new THREE.HemisphereLight(0xd4e1ed, 0x5a5140, 0.72); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xffdfb5, 1.25); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.35;
    sun.shadow.camera.near = 100; sun.shadow.camera.far = 6500; scene.add(sun); scene.add(sun.target);
    G.amb = new THREE.AmbientLight(0x404650, 0.25); scene.add(G.amb);
    // постпроцессинг: нур ёғдуси (bloom) — чироқ, мигалка, олов; гамма; FXAA текислаш (js/fx/*.js бўлса)
    if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.GammaCorrectionShader && THREE.FXAAShader) {
      try {
        COMP = new THREE.EffectComposer(renderer); COMP.addPass(new THREE.RenderPass(scene, camera));
        BLOOM = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.42, 0.8); COMP.addPass(BLOOM);
        COMP.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
        FXAA = new THREE.ShaderPass(THREE.FXAAShader); COMP.addPass(FXAA);
      } catch (e) { console.warn('Постпроцессинг ўчирилди:', e); COMP = null; }
    }
    PADD = new PS(7000, true, 1.4); PNRM = new PS(9000, false, 1.1);
    scene.add(PADD.pts); scene.add(PNRM.pts);
    COL = { f1: col(0xffb347), f2: col(0xff5a1f), sm1: col(0x1a1a1c), sm2: col(0x2e2c2a), steam: col(0xdfe6ea), water: col(0xcfe6ff), gas: col(0xd8e2c4) };
    buildSky(); buildWorld();
    var norm = {}; (window.SCN ? SCN.PREP.zones : []).forEach(function (z) { norm[z[0]] = z[1]; }); layoutOfficers(norm);
    reset();
    focusZone('all', {}); C.t.copy(C.g.t); C.d = C.g.d; C.tilt = C.g.tilt; C.yaw = C.g.yaw;
    bindInput(renderer.domElement);
    clock = new THREE.Clock();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    applyTier(detectTier());   // qurilma kuchiga qarab boshlang'ich sifat (resize ham chaqiriladi)
    loop();
    if (window.I18N) I18N.onChange(function () { relabelCanvas(); });
    S.ready = true;
    return true;
  }
  function relabelCanvas() {
    SIGNS.forEach(function (s) { var old = s[0].map; s[0].map = signTex.apply(null, s[1]); s[0].needsUpdate = true; if (old) old.dispose(); });
    if (SCR.wall) { SCR.wall.map = hqScreenTex(DONE.media ? 'media' : DONE.plan ? 'plan' : 'base'); SCR.wall.needsUpdate = true; }
  }

  /* ---------------- ташқи интерфейс ---------------- */
  window.S3D = {
    init: init,
    get ready() { return S.ready; },
    focusZone: focusZone,
    focusPoint: focusPointAt,
    highlightErrorZones: highlightErrorZones,
    onUnitPlaced: function (locId, unitId, count) {
      if (unitId === 'xodim') { var a = Object.assign({}, S.alloc || {}); a[locId] = count; layoutOfficers(a); }
      else if (locId) placeMeansAt(unitId, locId, count == null ? 1 : count); else removeMeans(unitId);
    },
    // st.means: { id: { loc_id: сони, ... } }
    sync3D: function (st) {
      st = st || {};
      if (st.alloc) layoutOfficers(st.alloc);
      if (st.means) Object.keys(st.means).forEach(function (id) { var m = st.means[id] || {}; BA.LOCS.forEach(function (L) { placeMeansAt(id, L.id, m[L.id] || 0); }); });
      if (st.fog != null) S.fogGoal = st.fog;
    },
    clearMeans: clearMeans,
    playFx: playFx,
    reset: reset,
    setPaused: function (b) { S.paused = !!b; },
    // yengil rejim (devordagi kichik ekran): soyasiz, 0,5 piksel zichlik, 12 kadr/s — har qanday kompyuterda silliq
    lite: function (on) { S.lite = !!on; renderer.shadowMap.enabled = !on && Q.tier >= 1; sun.castShadow = renderer.shadowMap.enabled; scene.traverse(function (o) { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.needsUpdate = true; }); }); resize(); },
    // idle: sahna ustida to'liq oyna (bosh ekran, video, natija) — chizish deyarli to'xtatiladi
    setIdle: function (b) { S.idle = !!b; Q.lastT = 0; },
    quality: function (t) { if (t == null) return { tier: Q.tier, fps: FPS, gpu: Q.gpu, auto: Q.auto }; Q.auto = false; try { localStorage.setItem('m39_q', String(t)); } catch (e) { /* йўқ */ } applyTier(clamp(+t, 0, 2)); return Q.tier; },
    setSpin: function (b) { S.spin = !!b; },
    // кун вақти: 'morning' (стандарт, тонгги туман), 'day' (кундузги), 'night' (тунги — чироқлар ва мигалкалар)
    setTimeOfDay: function (t) { S.tod = t; },
    setFx: function (on) { S.fx = !!on; },
    // сертификат учун саҳна сурати (JPEG dataURL, марказдан кесилган w×h)
    snapshot: function (w, h) {
      try {
        renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera);
        var src = renderer.domElement, sw = src.width, sh = src.height, k = Math.min(sw / w, sh / h), cw = w * k, ch = h * k;
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h);
        return c.toDataURL('image/jpeg', 0.86);
      } catch (e) { return null; }
    },
    cam: CAM,
    _dbg: function () { return { G: G, FV: FV, VG: VG, UNIT: UNIT_GLB, C: C }; },
    setViewMode: setViewMode,
    get viewMode() { return VM; },
    ruler: { set: rulerSet, clear: rulerClear, onChange: function (cb) { RUL.cb = cb; }, get on() { return RUL.on; }, fmt: fmtDist },
    miniInit: miniInit,
    miniBig: function (cv, i) { MINI.big = cv ? { cv: cv, i: i } : null; },
    onPick: function (cb) { S.onPick = cb; },
    getCamTarget: function () { return { x: C.t.x, z: C.t.z, d: C.d, yaw: C.yaw }; },
    loadModels: loadModels,
    stats: function () {
      return { fps: FPS, trucks: G.fura.n + G.tank.n + G.trac.n, vests: G.vest.n, provocateurs: G.prov.n, officers: G.offc.n, fires: FIRES.length,
        particles: (PADD ? PADD.live : 0) + (PNRM ? PNRM.live : 0), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, done: Object.keys(DONE) };
    }
  };
})();

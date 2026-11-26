/* =====================================================================
   АУДИО/ВИДЕО ЗАХИРА ТИЗИМИ (window.AUD, window.ASSETS)
   ---------------------------------------------------------------------
   1) ASSETS.detect() — қайси файллар борлигини аниқлайди:
        • assets.json (қўлда рўйхат) +
        • HTTP сервер папка рўйхати (python -m http.server, serve.ps1):
          videos/, audio/, audio/ogoh/, models/locations/, models/units/
      file:// режимида ҳеч нарса сўралмайди (консолда хато бўлмайди).
   2) Файл бўлса — MP3/MP4 ижро этилади; бўлмаса — Web Audio синтези:
        штаб пульти сигнали, рация «пш-пш», сирена, паст частотали хавф
        сигнали, шамол/шаҳар/рация фони (алоҳида ёқиб-ўчирилади).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- файллар рўйхати ---------------- */
  var LIST = { videos: [], audio: [], ogoh: [], lok: [], locations: [], units: [], js: [] };
  var DIRS = { videos: 'videos/', audio: 'audio/', ogoh: 'audio/ogoh/', lok: 'audio/lok/', locations: 'models/locations/', units: 'models/units/', js: 'js/' };
  var EXT = { videos: /\.(mp4|webm|jpe?g|webp|png)$/i, audio: /\.(mp3|ogg|m4a|wav)$/i, ogoh: /\.(mp3|ogg|m4a|wav)$/i, lok: /\.(mp3|ogg|m4a|wav)$/i, locations: /\.glb$/i, units: /\.glb$/i, js: /^GLTFLoader\.js$/i };
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function parseListing(html, re) {
    var out = [], m, rx = /href="([^"?#]+)"/gi;
    while ((m = rx.exec(html))) { var f = decodeURIComponent(m[1]).split('/').pop(); if (f && re.test(f)) out.push(f); }
    return out;
  }
  function detect() {
    if (location.protocol === 'file:' || !window.fetch) return Promise.resolve(LIST);
    var jobs = [fetch('assets.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      Object.keys(LIST).forEach(function (k) { if (Array.isArray(j[k])) LIST[k] = uniq(LIST[k].concat(j[k])); });
    }).catch(function () { /* assets.json йўқ — папка рўйхатига таянамиз */ })];
    Object.keys(DIRS).forEach(function (k) {
      jobs.push(fetch(DIRS[k], { cache: 'no-store' }).then(function (r) {
        var ct = r.headers.get('content-type') || '';
        return r.ok && ct.indexOf('html') >= 0 ? r.text() : '';
      }).then(function (h) { if (h) LIST[k] = uniq(LIST[k].concat(parseListing(h, EXT[k]))); }).catch(function () { /* рўйхат берилмади */ }));
    });
    return Promise.all(jobs).then(function () { loadSamples(); return LIST; });
  }
  function has(kind, file) { return LIST[kind] && LIST[kind].indexOf(file) >= 0; }

  /* ---------------- Web Audio ---------------- */
  var ctx = null, master = null, sfx = null, amb = null, noiseBuf = null, brownBuf = null;
  var muted = false, ambOn = false, ambWanted = true, ambNodes = [], chatterT = 0;
  try { muted = localStorage.getItem('m39_mute') === '1'; ambWanted = localStorage.getItem('m39_amb') !== '0'; } catch (e) { /* хусусий режим */ }

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(function () {}); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(comp);
    amb = ctx.createGain(); amb.gain.value = 0; amb.connect(comp);
    var n = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    brownBuf = ctx.createBuffer(1, n, ctx.sampleRate); var b = brownBuf.getChannelData(0), last = 0;
    for (i = 0; i < n; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; b[i] = last * 3.5; }
    loadSamples();
  }
  function now() { return ctx.currentTime; }
  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }
  function tone(f, dur, type, vol, t0, f2) {
    if (!ctx) return; var t = now() + (t0 || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.008, vol || 0.2, dur * 0.4, dur * 0.6); o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, freq, q, vol, t0, type, dest) {
    if (!ctx) return; var t = now() + (t0 || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    env(g, t, 0.005, vol || 0.2, dur * 0.5, dur * 0.5); s.connect(f); f.connect(g); g.connect(dest || sfx);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  /* ---------------- тайёр овоз эффектлари (audio/sfx_*.mp3|wav) ----------------
     Файл бўлса — шу ижро этилади, бўлмаса — пастдаги синтез. Номлар:
       sfx_radio — рация босилиши, sfx_tirbandlik — магистрал тирбандлик ва сигналлар (кириш фони),
       sfx_alarm — огоҳлантирувчи сирена (критик хато), sfx_qalqon — қалқонлар зарби (буфер),
       sfx_dron — дрон учиши, sfx_suv — сув сепувчи машина. */
  var SAMP = {}, SAMP_FILES = { radio: 'sfx_radio', tirbandlik: 'sfx_tirbandlik', alarm: 'sfx_alarm', qalqon: 'sfx_qalqon', dron: 'sfx_dron', suv: 'sfx_suv' };
  function sampFile(k) { var b = SAMP_FILES[k]; return LIST.audio.filter(function (f) { return f.replace(/\.\w+$/, '') === b; })[0]; }
  function loadSamples() {
    if (!ctx || !window.fetch || location.protocol === 'file:') return;
    Object.keys(SAMP_FILES).forEach(function (k) {
      var f = sampFile(k); if (!f || SAMP[k]) return; SAMP[k] = 'loading';
      fetch(DIRS.audio + encodeURIComponent(f)).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (res, rej) { ctx.decodeAudioData(b, res, rej); }); })
        .then(function (buf) { SAMP[k] = buf; }).catch(function () { delete SAMP[k]; });
    });
  }
  // o: {vol, t0, dur, loop, rate, dest} — dur берилса, охирида равон сўнади
  function samp(k, o) {
    o = o || {}; var b = SAMP[k]; if (!ctx || !b || b === 'loading' || muted) return false;
    var s = ctx.createBufferSource(), g = ctx.createGain(), t = now() + (o.t0 || 0), v = o.vol == null ? 0.9 : o.vol;
    s.buffer = b; s.loop = !!o.loop; if (o.rate) s.playbackRate.value = o.rate;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.fadeIn || 0.02));
    if (o.dur) { g.gain.setValueAtTime(v, t + Math.max(0.05, o.dur - 0.5)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur); }
    s.connect(g); g.connect(o.dest || sfx); s.start(t); if (o.dur) s.stop(t + o.dur + 0.05);
    return true;
  }
  // кириш фони: тирбандлик сигналлари вақти-вақти билан, турли баландлик ва тезликда (бир хил такрорланмасин)
  var introT = null;
  function introBed(on) {
    clearInterval(introT); introT = null; if (!on) return;
    var hit = function () { samp('tirbandlik', { vol: 0.25 + Math.random() * 0.45, rate: 0.86 + Math.random() * 0.22, dest: amb }); };
    hit(); setTimeout(hit, 900); introT = setInterval(function () { if (Math.random() < 0.8) hit(); }, 1700);
  }
  // 3D эффектлар билан бирга ижро этиладиган овозлар
  function fxSound(name, mode) {
    if (name === 'buffer') samp('qalqon', { vol: 0.85 }) || SND.stamp();
    else if (name === 'drones') samp('dron', { vol: 0.55, loop: true, dur: 7, fadeIn: 0.6 });
    else if (name === 'water') samp('suv', { vol: 0.8 }) || noise(4, 1800, 0.4, 0.25);
    else if (name === 'crit' || mode === 'crit') samp('alarm', { vol: 0.9 });
  }

  var SND = {
    click: function () { tone(1600, 0.035, 'square', 0.05); },
    tick: function () { tone(2200, 0.02, 'square', 0.035); },
    select: function () { tone(660, 0.06, 'triangle', 0.12); tone(990, 0.06, 'triangle', 0.1, 0.05); },
    // штаб пульти сигнали + рация «пш-пш»
    confirm: function () { tone(880, 0.09, 'sine', 0.22); tone(1320, 0.12, 'sine', 0.2, 0.1); SND.radio(0.28); },
    radio: function (t0) {
      t0 = t0 || 0;
      if (samp('radio', { t0: t0, vol: 0.75 })) return;
      noise(0.16, 1900, 0.7, 0.35, t0); noise(0.12, 2600, 1.2, 0.25, t0 + 0.22);
      tone(1150, 0.05, 'sine', 0.12, t0 + 0.36); noise(0.32, 1400, 0.5, 0.12, t0 + 0.42);
    },
    radioEnd: function () { noise(0.1, 2200, 1, 0.3); tone(980, 0.06, 'sine', 0.12, 0.12); },
    // огоҳлантирувчи сирена + паст частотали хавф сигнали
    alarm: function (dur) {
      if (!ctx) return; dur = dur || 2.6;
      if (samp('alarm', { vol: 0.95, loop: dur > 3.2, dur: dur > 3.2 ? dur : 0 })) return;
      var t = now(), o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 900; lfo.type = 'triangle'; lfo.frequency.value = 1.1; lg.gain.value = 380;
      lfo.connect(lg); lg.connect(o.frequency); f.type = 'lowpass'; f.frequency.value = 2600;
      env(g, t, 0.05, 0.11, dur - 0.4, 0.35); o.connect(f); f.connect(g); g.connect(sfx);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
      for (var i = 0; i < 4; i++) { tone(110, 0.24, 'square', 0.16, i * 0.5); tone(55, 0.3, 'sine', 0.25, i * 0.5); }
    },
    warn: function () { tone(660, 0.14, 'square', 0.1); tone(440, 0.16, 'square', 0.1, 0.16); tone(220, 0.4, 'sawtooth', 0.12, 0.34); },
    stamp: function () { tone(140, 0.25, 'sine', 0.4, 0, 50); noise(0.08, 400, 0.6, 0.25); },
    success: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.15, i * 0.12); }); }
  };

  /* ---------------- фон: шамол + шаҳар + рация ---------------- */
  function ambientStart() {
    if (!ctx || ambOn) return; ambOn = true;
    var wind = ctx.createBufferSource(); wind.buffer = brownBuf; wind.loop = true;
    var wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 520;
    var wg = ctx.createGain(); wg.gain.value = 0.35;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.18; lfo.connect(lg); lg.connect(wg.gain);
    wind.connect(wf); wf.connect(wg); wg.connect(amb); wind.start(); lfo.start();
    var hum = ctx.createBufferSource(); hum.buffer = noiseBuf; hum.loop = true;
    var hf = ctx.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 180; hf.Q.value = 0.6;
    var hg = ctx.createGain(); hg.gain.value = 0.05; hum.connect(hf); hf.connect(hg); hg.connect(amb); hum.start();
    ambNodes = [wind, lfo, hum];
    amb.gain.cancelScheduledValues(now()); amb.gain.setTargetAtTime(0.5, now(), 0.8);
    var tick = 0;
    chatterT = setInterval(function () {
      if (!ambOn || muted) return;
      // узоқдаги тирбандлик сигналлари (файл бўлса) — ҳар 2–3 тактда, паст овозда
      if (++tick % 2 === 0 && Math.random() < 0.7) samp('tirbandlik', { vol: 0.08 + Math.random() * 0.1, rate: 0.85 + Math.random() * 0.2, dest: amb });
      // узоқдаги рация гап-сўзлари (модуляцияли шовқин)
      var t0 = 0; noise(0.08, 2300, 1, 0.05, 0, 'bandpass', amb);
      for (var k = 0; k < 5 + Math.random() * 6; k++) { t0 += 0.09 + Math.random() * 0.12; noise(0.07 + Math.random() * 0.1, 700 + Math.random() * 1400, 3, 0.03, t0, 'bandpass', amb); }
      noise(0.1, 2300, 1, 0.04, t0 + 0.2, 'bandpass', amb);
    }, 5200);
  }
  function ambientStop() {
    if (!ctx || !ambOn) return; ambOn = false; clearInterval(chatterT);
    amb.gain.setTargetAtTime(0, now(), 0.3);
    var nodes = ambNodes; ambNodes = [];
    setTimeout(function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) { /* аллақачон тўхтаган */ } }); }, 1200);
  }

  /* ---------------- файл бўлса — MP3, бўлмаса — синтез ---------------- */
  var CUR = null;
  function playFile(kind, file, fallback) {
    if (has(kind, file) && !muted) {
      stopFile();   // аввалги овоз (савол/натижа) устма-уст тушмасин
      var a = new Audio(DIRS[kind] + file); a.volume = 0.95; CUR = a;
      return a.play().then(function () { return true; }).catch(function () { if (fallback) fallback(); return false; });
    }
    if (fallback && !muted) fallback();
    return Promise.resolve(false);
  }
  function stopFile() { if (CUR) { try { CUR.pause(); } catch (e) { /* йўқ */ } CUR = null; } }

  function setMuted(b) {
    muted = !!b; try { localStorage.setItem('m39_mute', muted ? '1' : '0'); } catch (e) { /* хусусий режим */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.05);
    if (muted) stopFile();
    document.querySelectorAll('video').forEach(function (v) { v.muted = muted; });
  }

  window.ASSETS = { detect: detect, has: has, list: LIST, dirs: DIRS };
  window.AUD = {
    unlock: unlock,
    get muted() { return muted; },
    get ambient() { return ambWanted; },
    setMuted: setMuted, toggle: function () { unlock(); setMuted(!muted); return muted; },
    sfx: function (name, a) { unlock(); if (muted || !ctx || !SND[name]) return; SND[name](a); },
    ambientOn: function () { unlock(); if (ambWanted) ambientStart(); },
    ambientOff: ambientStop,
    toggleAmbient: function () { unlock(); ambWanted = !ambWanted; try { localStorage.setItem('m39_amb', ambWanted ? '1' : '0'); } catch (e) { /* хусусий режим */ } if (ambWanted) ambientStart(); else ambientStop(); return ambWanted; },
    playFile: playFile, stopFile: stopFile,
    current: function () { return CUR; },
    fx: function (name, mode) { unlock(); if (!muted && ctx) fxSound(name, mode); },
    intro: function (on) { unlock(); introBed(on); },
    sample: function (k, o) { unlock(); return samp(k, o); },
    video: function (n) { var f = 'd' + (n < 10 ? '0' : '') + n + '.mp4'; return has('videos', f) ? 'videos/' + f : null; }
  };
})();

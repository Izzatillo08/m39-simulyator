/* =====================================================================
   М-39 ТРАНСПОРТ БЛОКАДАСИ — ИЛОВА МАНТИҚИ (3-таҳрир)
   Оқим: кириш → битта кириш видеоси → 1-модул (харита + чап/ўнг тортма
   панеллар) → 2-модул (ҳар локацияда 1–2 савол × 2 вариант) →
   «Натижа ҳисобланмоқда» → сертификат кўринишидаги баҳо (DOCX / PDF)
   + «Тўлиқ ҳисобот». Матн кам, маъно пиктограммаларда.
   ===================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SC = window.SCN, BA = window.BA, P = SC.PREP, SIM = SC.SIM, LAW = SC.LAW, Q = SC.Q;
  var T = function (s) { return window.I18N ? I18N.T(s) : s; };
  var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU'); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var NN = function (n) { return (n < 10 ? '0' : '') + n; };
  var has3D = false;
  var S3 = function (fn) { if (!has3D) return; try { var f = fn.split('.'), o = window.S3D; for (var i = 0; i < f.length - 1; i++) o = o[f[i]]; return o[f[f.length - 1]].apply(o, [].slice.call(arguments, 1)); } catch (e) { console.error('S3D.' + fn, e); } };
  var meansDef = function (id) { return P.means.filter(function (m) { return m.id === id; })[0]; };
  var qById = function (id) { return Q.filter(function (q) { return q.id === id; })[0]; };
  var locName = function (id) { var L = BA.byId(id); return L ? L.short : id; };
  var lawShort = function (id) { var l = LAW[id]; if (!l) return ''; var m = l.t.match(/\(([^,)]+)[^)]*\)(?:,\s*(.+))?$/); return m ? m[1] + (m[2] ? ', ' + m[2] : '') : l.t; };
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------------- ҳолат ---------------- */
  var ST;
  function fresh() {
    var alloc = {}; P.zones.forEach(function (z) { alloc[z[0]] = 0; });
    var means = {}; P.means.forEach(function (m) { means[m.id] = {}; });
    var order = {}; Q.forEach(function (q) { order[q.id] = shuffle(q.opts.map(function (_, i) { return i; })); });
    ST = {
      who: '', phase: 'start', paused: false, t0: Date.now(), pauseMs: 0, pauseAt: 0, endAt: null, shot: null,
      m1: { alloc: alloc, means: means, tries: 0, score: null, scoreA: null, scoreM: null, done: false, norm: false, chk: null, err0: null, pick: null, firstErr: [] },
      m2: { min: 0, delay: 0, stab: SIM.stab0, sup: SIM.sup0, panic: SIM.panic0 || 25, inj: 0, res: {}, pts: {}, log: [], cur: null, sel: null, plan: false, crit: null, order: order, cascade: {}, nextPen: null, timer: null, tLeft: SIM.ooda, tMax: SIM.ooda, answered: false }
    };
  }
  fresh();

  /* ---------------- умумий UI ---------------- */
  function toast(t, ms) { var e = $('toast'); e.innerHTML = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(function () { e.classList.remove('on'); }, ms || 2400); }
  function panel(html) {
    var P = $('panel'); P.innerHTML = html; $('main').classList.toggle('nopanel', !html); P.classList.remove('mini');
    if (!document.getElementById('phCss')) { var st = document.createElement('style'); st.id = 'phCss';
      st.textContent = '.ph{position:relative;padding-left:52px!important;padding-right:52px!important;min-height:46px}' +
        '.phb{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#fff;cursor:pointer;z-index:3}' +
        '.phb:hover{background:rgba(255,255,255,.16)}.phb svg{width:18px;height:18px}.phb.bk{left:10px}.phb.mn{right:10px}.phb[hidden]{display:none}' +
        '#panel.mini>*:not(.ph){display:none!important}#panel.mini{height:auto!important;max-height:none!important;bottom:auto!important}' +
        '#panel .scroll>.back.dup{display:none}';
      document.head.appendChild(st); }
    var ph = P.querySelector('.ph'); if (!ph) return;
    var inner = P.querySelector('.scroll .back, .back');
    var bk = document.createElement('button'); bk.className = 'phb bk'; bk.title = T('Орқага');
    bk.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    if (inner) { inner.classList.add('dup'); bk.onclick = function () { inner.click(); }; } else bk.hidden = true;
    var mn = document.createElement('button'); mn.className = 'phb mn'; mn.title = T('Кичрайтириш');
    var icMin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 12h12"/></svg>', icMax = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';
    mn.innerHTML = icMin; mn.onclick = function () { var on = P.classList.toggle('mini'); mn.innerHTML = on ? icMax : icMin; mn.title = on ? T('Катталаштириш') : T('Кичрайтириш'); };
    ph.appendChild(bk); ph.appendChild(mn);
  }
  function clockText(min) { var t = 7 * 60 + 30 + (min || 0), h = Math.floor(t / 60), m = t % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function setClock(min) { $('clock').textContent = clockText(min); }
  function sfx(n, a) { window.AUD && AUD.sfx(n, a); }
  function overlay(id, on) { $(id).classList.toggle('on', !!on); }
  var fxT = 0;
  function alertFx(cls, a, b, ms) {
    var e = $('fxAlert'); e.className = 'on ' + cls;
    e.querySelector('b').textContent = a; e.querySelector('span').textContent = b || ''; e.querySelector('small').textContent = '';
    clearTimeout(fxT); fxT = setTimeout(function () { e.className = ''; }, ms || 2600);
  }

  /* ---------------- 2D тактик харита ---------------- */
  var LBL_OFF = { loc_erkin: [-8, -24, 'end'], loc_log: [-24, 6, 'end'], loc_bypass: [22, 30, 'start'], loc_fuel: [24, 6, 'start'], loc_airp_cargo: [0, 36, 'middle'], loc_hq: [-24, 6, 'end'] };
  function buildMap() {
    var s = '<rect width="800" height="470" fill="#090A0D"/>';
    for (var x = 0; x <= 800; x += 50) s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="470" stroke="#161920"/>';
    for (var y = 0; y <= 470; y += 50) s += '<line x1="0" y1="' + y + '" x2="800" y2="' + y + '" stroke="#161920"/>';
    var city = BA.worldToSvg(9300, -7600);
    s += '<circle cx="' + city.x.toFixed(1) + '" cy="' + city.y.toFixed(1) + '" r="' + (3600 * BA.K).toFixed(1) + '" fill="#12141A" stroke="#242833"/>';
    ['bypass', 'airport', 'logi'].forEach(function (k) { s += '<path d="' + BA.roadSvgPath(k) + '" stroke="#A1A6B3" stroke-width="4" fill="none" stroke-linecap="round"/>'; });
    s += '<path d="' + BA.roadSvgPath('m39') + '" stroke="#F5F6F8" stroke-width="7" fill="none" stroke-linecap="round"/>';
    // блокада: постдан ≈4 км жануби-ғарбга М-39 бўйлаб
    var bd = BA.ROADS.m39.pts.slice(1, 5).map(function (p, i) { var s2 = BA.enToSvg(p[0], p[1]); return (i ? 'L' : 'M') + s2.x.toFixed(1) + ' ' + s2.y.toFixed(1); }).join(' ');
    s += '<path d="' + bd + '" stroke="#E11D48" stroke-width="10" fill="none" stroke-linecap="round"><animate attributeName="opacity" values=".45;1;.45" dur="1.2s" repeatCount="indefinite"/></path>';
    BA.LOCS.forEach(function (L) {
      var o = LBL_OFF[L.id];
      s += '<g class="ml" id="ml_' + L.id + '" data-loc="' + L.id + '" transform="translate(' + L.sx + ',' + L.sy + ')"><circle class="pr" r="16"/><rect class="m" x="-13" y="-13" width="26" height="26" rx="2"/><text class="k" y="6" text-anchor="middle" font-size="16" font-weight="900">' + L.key + '</text>' +
        '<text x="' + o[0] + '" y="' + o[1] + '" text-anchor="' + o[2] + '" fill="#F5F6F8" font-size="16" font-weight="800">' + L.short + '</text></g>';
    });
    s += '<g id="mCam"><circle r="7" fill="none" stroke="#E11D48" stroke-width="2.5"/><line x1="0" y1="0" x2="0" y2="-20" stroke="#E11D48" stroke-width="2.5"/></g>';
    $('mapSvg').innerHTML = s;
    [].forEach.call(document.querySelectorAll('.ml'), function (g) { g.addEventListener('click', function () { pickLoc(g.dataset.loc); }); });
    $('map2d').classList.remove('min'); $('mapHead').style.cursor = 'default';   // xarita doim ochiq turadi (yig'ilmaydi)

    var controls = document.createElement('div');
    controls.id = 'mapControls';
    controls.innerHTML = '<button type="button" data-map-action="in" title="Kattalashtirish">+</button><button type="button" data-map-action="out" title="Kichraytirish">−</button><button type="button" data-map-action="reset" title="Xaritani markazga qaytarish">⌂</button>';
    $('map2d').appendChild(controls);

    var svg = $('mapSvg'), state = { zoom: 1, cx: 400, cy: 235, drag: null };
    function setView() {
      var w = 800 / state.zoom, h = 470 / state.zoom;
      var x = Math.max(0, Math.min(800 - w, state.cx - w / 2));
      var y = Math.max(0, Math.min(470 - h, state.cy - h / 2));
      svg.setAttribute('viewBox', x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1));
    }
    function zoomMap(factor, sx, sy) {
      var vb = svg.viewBox.baseVal;
      var px = vb.x + (sx == null ? .5 : sx) * vb.width;
      var py = vb.y + (sy == null ? .5 : sy) * vb.height;
      state.zoom = clamp(state.zoom * factor, 1, 5);
      var w = 800 / state.zoom, h = 470 / state.zoom;
      var nx = (sx == null ? .5 : sx), ny = (sy == null ? .5 : sy);
      state.cx = px - (nx - .5) * w;
      state.cy = py - (ny - .5) * h;
      state.cx = clamp(state.cx, w / 2, 800 - w / 2);
      state.cy = clamp(state.cy, h / 2, 470 - h / 2);
      setView();
    }
    function resetMap() { state.zoom = 1; state.cx = 400; state.cy = 235; setView(); }
    controls.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.dataset.mapAction;
      if (a === 'in') zoomMap(1.35);
      else if (a === 'out') zoomMap(1 / 1.35);
      else resetMap();
    });
    svg.classList.add('map-ready');
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = svg.getBoundingClientRect(), sx = clamp((e.clientX - r.left) / r.width, 0, 1), sy = clamp((e.clientY - r.top) / r.height, 0, 1);
      zoomMap(e.deltaY < 0 ? 1.22 : 1 / 1.22, sx, sy);
    }, { passive: false });
    svg.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.ml')) return;
      state.drag = { x: e.clientX, y: e.clientY, cx: state.cx, cy: state.cy };
      svg.setPointerCapture(e.pointerId); svg.classList.add('map-dragging');
    });
    svg.addEventListener('pointermove', function (e) {
      if (!state.drag) return;
      var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      state.cx = clamp(state.drag.cx - (e.clientX - state.drag.x) * vb.width / r.width, vb.width / 2, 800 - vb.width / 2);
      state.cy = clamp(state.drag.cy - (e.clientY - state.drag.y) * vb.height / r.height, vb.height / 2, 470 - vb.height / 2);
      setView();
    });
    function endDrag(e) { state.drag = null; svg.classList.remove('map-dragging'); try { svg.releasePointerCapture(e.pointerId); } catch (_) {} }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('dblclick', resetMap);
  }
  function mapState(bad, cur) {
    BA.LOCS.forEach(function (L) { var g = $('ml_' + L.id); if (!g) return; g.classList.toggle('bad', (bad || []).indexOf(L.id) >= 0); g.classList.toggle('cur', cur === L.id); });
    [].forEach.call(document.querySelectorAll('.s3l.loc'), function (e) { e.classList.toggle('bad', (bad || []).indexOf(e.dataset.loc) >= 0); e.classList.toggle('cur', e.dataset.loc === cur); });
  }
  function camMarker() {
    if (!has3D) return;
    var c = S3D.getCamTarget(), p = BA.worldToSvg(c.x, c.z), g = $('mCam');
    if (g) g.setAttribute('transform', 'translate(' + clamp(p.x, 0, 800).toFixed(1) + ',' + clamp(p.y, 0, 470).toFixed(1) + ') rotate(' + (180 - c.yaw * 180 / Math.PI).toFixed(1) + ')');
    $('mapInfo').textContent = c.d > 1000 ? (c.d / 1000).toFixed(1).replace('.', ',') + ' ' + T('км') : Math.round(c.d) + ' ' + T('м');
  }

  /* ---------------- локациялар панели, камера ва харита асбоблари ---------------- */
  function buildLocBar() {
    $('locBar').innerHTML = BA.LOCS.map(function (L) { return '<button class="ov-card" data-l="' + L.id + '" title="' + L.name + '"><b>' + L.key + '</b><span>' + L.short + '</span></button>'; }).join('');
    [].forEach.call($('locBar').querySelectorAll('button'), function (b) { b.onclick = function () { pickLoc(b.dataset.l); }; });
  }
  function markLoc(id) { [].forEach.call($('locBar').querySelectorAll('button'), function (b) { b.classList.toggle('on', b.dataset.l === id); }); }
  // локация танланганда: 1-модулда — восита жойлаш ёки ходимлар сони, 2-модулда — шу локация саволлари
  // Вазиятлар маркази: харита/3D ҳаракатланмайди — штаб тасвири чиқади
  function hqImg(on) {
    var e = $('hqImg');
    if (!e) { e = document.createElement('div'); e.id = 'hqImg'; e.innerHTML = '<button aria-label="Ёпиш">' + ICON('cross') + '</button><span>' + T('Тошкент шаҳар ИИББ Вазиятлар маркази') + '</span>'; $('stage').appendChild(e); e.querySelector('button').onclick = function () { hqImg(false); }; }
    e.classList.toggle('on', !!on);
  }
  function pickLoc(id, noFocus) {
    var hq = id === 'loc_hq'; if (window.ROOM) ROOM.loc(id); else hqImg(hq && ST.phase !== 'start');   // 2-версия: девор экранлари
    if (!noFocus && !hq) S3('focusZone', id); markLoc(id); sfx('click');
    if (ST.phase === 'm1') return m1LocClick(id);
    // 2-модул: локация (харита, 3D ёки панел) босилса — доим шу жойдаги вазифалар чиқади ва муаммо овозда қисқача айтилади
    if (ST.phase === 'm2') { if (ST.m2.cur && ST.m2.answered) return; locVoice(id); return renderLoc(id); }
    showInfo(id);
  }
  function buildTools() {
    $('toolBox').querySelector('.tl').onclick = function () { var o = $('toolBox').classList.toggle('open'); if (o && ST.phase === 'm1') drw(null); };
    [].forEach.call($('vmSeg').querySelectorAll('button'), function (b) {
      b.onclick = function () {
        var m = b.dataset.vm; S3('setViewMode', m); $('stage').classList.toggle('thermal', m === 'thermal'); $('camBig').classList.toggle('thermal', m === 'thermal');
        $('relLeg').classList.toggle('hide', m !== 'relief');
        [].forEach.call($('vmSeg').querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); }); sfx('click');
      };
    });
    [].forEach.call($('camTools').querySelectorAll('button'), function (b) {
      b.onclick = function () {
        var c = b.dataset.c; sfx('click');
        if (c === 'overview') { S3('cam.overview'); markLoc(null); }
        else if (c === 'top') S3('cam.top');
        else if (c === 'in') S3('cam.zoom', 0.6);
        else if (c === 'out') S3('cam.zoom', 1.65);
        else if (c === 'orbit') b.classList.toggle('on', !!S3('cam.orbit'));
        else if (c === 'free') { var on = !!S3('cam.free'); b.classList.toggle('on', on); $('ffHint').classList.toggle('hide', !on); }
        else if (c === 'reset') { S3('cam.reset'); $('camTools').querySelector('[data-c=orbit]').classList.remove('on'); }
        else if (c === 'ruler') { var r = !S3D.ruler.on; S3('ruler.set', r); b.classList.toggle('on', r); $('rulBox').classList.toggle('hide', !r); }
      };
    });
    $('rulClr').onclick = function () { S3('ruler.clear'); };
    if (has3D) S3D.ruler.onChange(function (tot, n) { $('rulTot').innerHTML = n < 2 ? T('Харитада нуқталарни босинг') : T('Жами') + ': <b>' + S3D.ruler.fmt(tot) + '</b>'; });
  }

  /* ---------------- Объект маълумот дисплейи (иконлар билан) ---------------- */
  function riskOf(id) {
    var open = Q.filter(function (q) { return q.loc === id && !ST.m2.res[q.id]; }).length;
    return ST.phase !== 'm2' ? 'mid' : open >= 2 ? 'hi' : open ? 'mid' : 'lo';
  }
  function showInfo(id) {
    var L = BA.byId(id), el = $('info'); if (!L || ST.phase === 'start') { el.classList.add('hide'); return; }
    var used = P.means.filter(function (m) { return (ST.m1.means[m.id][id] || 0) > 0; }), rk = riskOf(id);
    el.innerHTML = '<button class="x" id="infoX" aria-label="Ёпиш">' + ICON('cross') + '</button><h4><b>' + L.key + '</b>' + L.name + '</h4>' +
      '<div class="istat"><span title="Ходимлар">' + ICON('users') + '<b>' + fmt(ST.m1.alloc[id] || 0) + '</b></span><span title="Хавф">' + ICON('heart') + '<b class="risk ' + rk + '">' + T({ hi: 'ЮҚОРИ', mid: 'ЎРТА', lo: 'ПАСТ' }[rk]) + '</b></span></div>' +
      '<div class="ichips">' + (used.length ? used.map(function (m) { return '<span title="' + m.name + '">' + ICON(m.id) + '<i>' + ST.m1.means[m.id][id] + '</i></span>'; }).join('') : '<small>' + T('Восита йўқ') + '</small>') + '</div>' +
      '<small class="iresp">' + L.resp + '</small>';
    el.style.top = ($('toolBox').offsetHeight + 20) + 'px'; el.classList.remove('hide');
    $('infoX').onclick = function () { el.classList.add('hide'); };
  }

  /* ---------------- 4 та жонли кузатув дисплейи ---------------- */
  var CAMS = [['loc_erkin', '«Эркин» ЙПХ'], ['loc_erkin', '«Эркин» • ҳаводан'], ['loc_airp_cargo', 'Аэропорт'], ['loc_fuel', 'Ёқилғи']];
  function buildCams() {
    $('camStrip').innerHTML = CAMS.map(function (c, i) { return '<div class="cam" data-i="' + i + '" role="button" aria-label="' + c[1] + '"><canvas width="320" height="180"></canvas><div class="cl"><i></i>' + (i + 1) + ' • ' + c[1] + '</div><div class="ct">07:30</div></div>'; }).join('');
    S3('miniInit', [].slice.call($('camStrip').querySelectorAll('.cam canvas')));
    [].forEach.call($('camStrip').querySelectorAll('.cam'), function (el) { el.onclick = function () { camBig(+el.dataset.i); }; });
    setInterval(function () { var t = clockText(ST.phase === 'm2' || ST.phase === 'final' ? ST.m2.min : 0) + ':' + NN(new Date().getSeconds()); [].forEach.call($('camStrip').querySelectorAll('.ct'), function (e) { e.textContent = t; }); }, 1000);
  }
  function camVideo(i, file) {
    var el = $('camStrip').querySelectorAll('.cam')[i]; if (!el || !ASSETS.has('videos', file)) return false;
    var v = el.querySelector('video');
    if (!v) { v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; el.insertBefore(v, el.firstChild.nextSibling); }
    if (v.dataset.f !== file) { v.dataset.f = file; v.src = 'videos/' + file; v.play().catch(function () {}); }
    var cv = el.querySelector('canvas'); cv.dataset.video = '1'; cv.style.visibility = 'hidden'; return true;
  }
  function lowTier() { try { return has3D && S3D.quality().tier === 0; } catch (e) { return false; } }
  function camVideosInit() { if (lowTier()) return; CAMS.forEach(function (c, i) { camVideo(i, 'cam_' + (i + 1) + '.mp4'); }); }
  function camVideosAfter(n) { CAMS.forEach(function (c, i) { camVideo(i, 'cam_' + (i + 1) + '_q' + NN(n) + '.mp4'); }); }
  function camBig(i) {
    var w = $('camBigW'), el = $('camStrip').querySelectorAll('.cam')[i], v = el.querySelector('video');
    w.innerHTML = ''; $('camBigT').textContent = T((i + 1) + ' • ' + CAMS[i][1]);
    if (v) { var bv = v.cloneNode(); bv.muted = true; bv.loop = true; bv.autoplay = true; w.appendChild(bv); bv.play().catch(function () {}); }
    else { var cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; w.appendChild(cv); S3('miniBig', cv, i); }
    overlay('camBig', true); sfx('click');
  }
  $('camBigX').onclick = function () { S3('miniBig', null); overlay('camBig', false); $('camBigW').innerHTML = ''; };

  /* =====================================================================
     КИРИШ ВА КИРИШ ВИДЕОСИ
     ===================================================================== */
  try { $('who').value = localStorage.getItem('m39_who') || ''; } catch (e) { /* хусусий режим */ }
  // tinglovchi rasmi: 240 px gacha kichraytirib, qaydnomada 3D surat o'rniga ko'rsatiladi (eslab qolinadi)
  try { ST.photo = localStorage.getItem('m39_photo') || null; if (ST.photo) $('phv').style.backgroundImage = 'url(' + ST.photo + ')'; } catch (e) { /* xususiy rejim */ }
  $('whoPhoto').onchange = function () {
    var f = this.files && this.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 240 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ST.photo = c.toDataURL('image/jpeg', 0.85); $('phv').style.backgroundImage = 'url(' + ST.photo + ')'; try { localStorage.setItem('m39_photo', ST.photo); } catch (e) { /* joy yo'q */ } }; im.src = rd.result; };
    rd.readAsDataURL(f);
  };
  $('bStart').onclick = start;
  function start() {
    window.AUD && AUD.unlock();
    var who = $('who').value.trim();
    if (!who) { $('who').focus(); toast(T('ФИШ ва унвонни киритинг')); sfx('warn'); return; }
    try { localStorage.setItem('m39_who', who); } catch (e) { /* хусусий режим */ }
    fresh(); ST.who = who; ST.t0 = Date.now();
    S3('reset'); S3('clearMeans'); S3('highlightErrorZones', []); S3('sync3D', { alloc: ST.m1.alloc });
    overlay('start', false); sfx('select'); window.AUD && AUD.ambientOn();
    ST.phase = 'intro'; if (window.ROOM && ROOM.leave) ROOM.leave();   // intro doim to'liq ekranda (qayta boshlanganda ham)
    // Кириш: ketma-ket lavhalar (video + harakatlanuvchi rasmlar) + штаб диктори овози + тирбандлик фони.
    // Ketma-ketlik bo'lmasa — yagona intro.mp4; u ham bo'lmasa — «Видео кутилмоқда» (3D кино фонида) + диктор.
    var caps = {}, cap = SC.INTRO.cap || {};
    var seq = (SC.INTRO.seq || []).filter(function (f) { return /^3d:/.test(f) ? has3D : ASSETS.has('videos', f); }).map(function (f) {
      var s = /^3d:/.test(f) ? f : 'videos/' + f; if (cap[f] && BA.byId(cap[f])) caps[s] = BA.byId(cap[f]).name; return s;
    });
    if (!seq.length && ASSETS.has('videos', SC.INTRO.video)) seq = ['videos/' + SC.INTRO.video];
    window.AUD && AUD.intro(true);
    playMedia(seq.length ? seq : null, function () { window.AUD && AUD.intro(false); openM1(); m1Skip(); },   // 3-версия: 1-модул йўқ — me'yoriy taqsimot avtomatik, darhol 2-modul
      { voice: { kind: 'audio', file: SC.INTRO.voice || 'intro.mp3' }, imgDur: SC.INTRO.imgDur || 5, d3Dur: SC.INTRO.d3Dur || 7, caps: caps, stopVoice: true, untilVoice: true });
  }
  // Тўлиқ экран медиа. src — битта файл ёки рўйхат: .mp4 — видео, .jpg/.png/.webp — секин яқинлашувчи/узоқлашувчи расм.
  // opt.voice — бирга эшитиладиган овоз ({kind, file}); видеонинг ўз овози шунда пастроқ (фон) бўлади.
  function isImg(s) { return /\.(jpe?g|png|webp)$/i.test(s); }
  function playMedia(src, done, opt) {
    opt = opt || {};
    var o = $('vidOv'), v = $('vid'), img = $('vidImg'), capEl = $('vidCap'), fin = false, i = -1, tm = null, voiceTm = null, in3d = false;
    var list = (Array.isArray(src) ? src : [src]).filter(Boolean), hasVoice = false;
    var voiceEl = null;
    if (opt.voice && window.AUD && ASSETS.has(opt.voice.kind, opt.voice.file)) {
      hasVoice = true; AUD.playFile(opt.voice.kind, opt.voice.file); voiceEl = AUD.current();
      // untilVoice: диктор овози тугаши билан медиа якунланади ва автоматик кейинги босқичга (кириш → 1-модул) ўтилади
      if (opt.untilVoice && voiceEl) {
        voiceEl.addEventListener('ended', function () { end(); });
        voiceEl.addEventListener('error', function () { if (i >= list.length - 1) end(); });
        // заҳира: 'ended' ҳодисаси келмаса ҳам (браузер, тармоқ) — овоз давомийлигидан кейин барибир ўтилади
        voiceEl.addEventListener('loadedmetadata', function () {
          if (isFinite(voiceEl.duration)) { clearTimeout(voiceTm); voiceTm = setTimeout(function () { if (!ST.paused) end(); }, (voiceEl.duration + 1.5) * 1000); }
        });
      }
    }
    var voiceOn = function () { return opt.untilVoice && voiceEl && !voiceEl.ended && !voiceEl.paused; };
    var leave3d = function () {
      if (!in3d) return; in3d = false; o.classList.remove('d3'); S3('cam.orbit', false); S3('setPaused', true); S3('setIdle', true);
    };
    var end = function () {
      if (fin) return; fin = true; clearTimeout(tm); clearTimeout(voiceTm); leave3d();
      v.onended = v.onerror = null; v.pause(); v.removeAttribute('src'); v.load();
      img.className = ''; img.style.backgroundImage = ''; if (capEl) { capEl.textContent = ''; capEl.classList.remove('on'); }
      overlay('vidOv', false); o.classList.remove('wait', 'img', 'd3'); S3('cam.cine', false);
      if (hasVoice && opt.stopVoice && window.AUD) AUD.stopFile();
      S3('setPaused', false); S3('setIdle', false); done && done();
    };
    var next = function () {
      clearTimeout(tm); if (fin) return; i++;
      if (i >= list.length) {
        // лавҳалар тугади, диктор ҳали гапирмоқда — охирги кадр ушлаб турилади (бошидан такрорланмайди), овоз тугагач ўтилади
        if (voiceOn()) { i = list.length; return; }
        return end();
      }
      var s = list[i], nx = list[i + 1];
      // keyingi video oldindan yuklab qo'yiladi — lavhalar orasida qora uzilish bo'lmasin
      if (nx && /\.(mp4|webm)$/i.test(nx)) { var pre = document.createElement('video'); pre.preload = 'auto'; pre.muted = true; pre.src = nx; pre.load(); playMedia._pre = pre; }
      // кейинги лавҳа 3D бўлса — 3D саҳна олдиндан (қора фон ортида) ишга туширилади: биринчи чизиш оғир, кўринганда қотмасин
      if (nx && /^3d:/.test(nx) && !/^3d:/.test(s)) {
        var nL = BA.byId(nx.slice(3));
        S3('setPaused', false); S3('setIdle', false);
        if (nL) S3('focusZone', nL.id, { cam: { d: nL.cam.d * 1.15, tilt: 0.5, yaw: nL.cam.yaw }, instant: true });
      }
      if (capEl) { var ct = (opt.caps || {})[s]; capEl.textContent = ct ? T(ct) : ''; capEl.classList.toggle('on', !!ct); }
      if (/^3d:/.test(s)) {
        // 3D саҳна: камера шу жой атрофида секин айланади
        var id = s.slice(3), L = BA.byId(id);
        o.classList.remove('img', 'wait'); o.classList.add('d3'); v.pause(); v.removeAttribute('src');
        in3d = true; S3('setPaused', false); S3('setIdle', false);
        if (L) { if (i === 0) S3('focusZone', id, { cam: { d: L.cam.d * 1.15, tilt: 0.5, yaw: L.cam.yaw }, instant: true }); S3('cam.orbit', true); }
        // вақт ҳисоби 3D кадрлар ҳақиқатан чизила бошлагандан кейин бошланади
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          if (!fin && in3d) tm = setTimeout(function () { leave3d(); next(); }, (opt.d3Dur || 7) * 1000);
        }); });
      } else if (isImg(s)) {
        leave3d(); o.classList.add('img'); o.classList.remove('wait'); v.pause(); v.removeAttribute('src');
        var d = opt.imgDur || 6; img.className = ''; img.style.backgroundImage = 'url("' + s + '")'; img.style.animationDuration = d + 's';
        void img.offsetWidth; img.className = 'on k' + (i % 3);
        tm = setTimeout(next, d * 1000);
      } else {
        // видеонинг ўз овози қўйилмайди — фақат диктор ва фон
        leave3d(); o.classList.remove('img', 'wait'); v.src = s; v.muted = true; v.volume = 0;
        v.onended = next; v.onerror = next;
        v.play().catch(next);
        tm = setTimeout(next, 20000);   // nosoz fayl tiqilib qolmasin
      }
    };
    $('vidSkip').onclick = end;
    S3('setPaused', true); S3('setIdle', true);   // media vaqtida 3D sahna to'xtatiladi (qurilma yuklanmaydi)
    if (list.length) { overlay('vidOv', true); next(); }
    else { S3('setPaused', false); S3('setIdle', false); o.classList.add('wait'); overlay('vidOv', true); S3('cam.cine', true); }
    $('vidSkip').focus();
  }

  /* =====================================================================
     1-МОДУЛ: харита + чап (ходимлар) ва ўнг (воситалар) тортма панеллар
     ===================================================================== */
  function allocSum() { var s = 0; P.zones.forEach(function (z) { s += ST.m1.alloc[z[0]] || 0; }); return s; }
  function zStat(z, v) { return v < z[2] ? 'lo' : v > z[3] ? 'hi' : 'ok'; }
  function zById(id) { return P.zones.filter(function (z) { return z[0] === id; })[0]; }
  function usedOf(id) { var s = 0, m = ST.m1.means[id]; Object.keys(m).forEach(function (k) { s += m[k] || 0; }); return s; }
  function openM1() {
    if (window.ROOM) ROOM.enter();   // 2-версия: introdan keyin boshqaruv xonasiga o'tiladi
    ST.phase = 'm1'; setClock(0); $('metrics').classList.add('hide'); showWorkUI(true); panel('');
    $('stage').classList.add('m1'); $('stage').classList.add('nocams');
    $('drL').innerHTML = '<div class="dh">' + ICON('users') + '<b>ХОДИМЛАР</b><button class="dx" data-c="1" aria-label="Ёпиш">' + ICON('cross') + '</button></div>' +
      '<div class="plans" id="plZ"></div>' +
      '<div class="remain"><span><small>ТАҚСИМЛАНМАГАН</small><b id="aRem">0</b></span><span><small>ЖАМИ</small><b>' + fmt(P.total) + '</b></span></div>' +
      '<div class="zl">' + P.zones.map(function (z) { var L = BA.byId(z[0]); return '<div class="zr" id="zr_' + z[0] + '"><i>' + L.key + '</i><span>' + L.short + '</span><button data-z="' + z[0] + '" data-d="-50" aria-label="−">−</button><input id="zi_' + z[0] + '" inputmode="numeric" maxlength="4" aria-label="' + L.short + '"><button data-z="' + z[0] + '" data-d="50" aria-label="+">+</button><em id="zt_' + z[0] + '"></em></div>'; }).join('') + '</div>';
    $('drR').innerHTML = '<div class="dh">' + ICON('truck') + '<b>ВОСИТАЛАР</b><button class="dx" data-c="1" aria-label="Ёпиш">' + ICON('cross') + '</button></div><div class="plans" id="plM"></div><div class="mtray" id="mTray"></div>';
    ST.m1.plans = ST.m1.plans || makePlans(); plansRender();
    [].forEach.call(document.querySelectorAll('.dx'), function (b) { b.onclick = function () { drw(null); }; });
    [].forEach.call($('drL').querySelectorAll('.zr button'), function (b) { b.onclick = function () { setZ(b.dataset.z, (ST.m1.alloc[b.dataset.z] || 0) + +b.dataset.d); sfx('tick'); }; });
    P.zones.forEach(function (z) { var i = $('zi_' + z[0]); i.oninput = function () { var v = i.value.replace(/\D/g, '').slice(0, 4); i.value = v; setZ(z[0], +v || 0, true); }; i.onblur = function () { i.value = ST.m1.alloc[z[0]]; }; });
    $('dkL').onclick = function () { drw('l'); }; $('dkR').onclick = function () { drw('r'); };
    $('pOk').onclick = m1Check; $('pNorm').onclick = m1Norm; $('pSkip').onclick = m1Skip; $('pickbar').onclick = function () { ST.m1.pick = null; m1Refresh(); };
    $('verd').className = 'verd ov-card'; $('verd').innerHTML = '';
    m1Refresh(); S3('focusZone', 'loc_erkin', { cam: { d: 1500, tilt: 0.8, yaw: -0.5 } }); markLoc('loc_erkin'); sfx('radio');
    toast(ICON('pin') + ' ' + T('Локацияни босинг — ходимлар сонини танланг'), 3500);
  }
  /* ----- Тайёр A / B / C режалар: ходимлар ва воситаларни бир босишда тақсимлаш.
     Ҳар бир машғулотда биттаси тўғри (меъёр бўйича), иккитаси — хатоли (ҳарфлар тасодифий алмашади). Танлангандан кейин қўлда тузатиш мумкин. */
  function makePlans() {
    var r10 = function (v) { return Math.round(v / 10) * 10; };
    var fit = function (a) {   // йиғинди аниқ жами ходимга тенг бўлсин
      var s = 0; P.zones.forEach(function (z) { s += a[z[0]]; }); a[P.zones[0][0]] += P.total - s; return a;
    };
    // ходимлар: 1) меъёр бўйича  2) деярли ҳаммаси «Эркин»га  3) барча жойга тенг
    var zOk = {}, zFront = {}, zEq = {}, first = P.zones[0][0], restN = 0;
    P.zones.forEach(function (z) { zOk[z[0]] = z[1]; if (z[0] !== first) restN += z[1]; });
    P.zones.forEach(function (z) {
      zFront[z[0]] = z[0] === first ? r10(P.total * 0.74) : r10(P.total * 0.26 * z[1] / restN);
      zEq[z[0]] = r10(P.total / P.zones.length);
    });
    var Z = [{ k: 'ok', a: zOk }, { k: 'front', a: fit(zFront) }, { k: 'eq', a: fit(zEq) }];
    // воситалар: 1) қонуний ва етарли  2) қонунга зид воситалар қўшилган, айримлари жалб этилмаган  3) нотўғри жой / етарли эмас
    var okM = P.means.filter(function (m) { return m.ok; }), badM = P.means.filter(function (m) { return !m.ok; });
    var mOk = {}, mForb = {}, mWeak = {};
    P.means.forEach(function (m) { mOk[m.id] = m.ok ? Object.assign({}, m.req) : {}; mForb[m.id] = {}; mWeak[m.id] = {}; });
    okM.forEach(function (m, i) {
      if (i % 3 !== 2) mForb[m.id] = Object.assign({}, m.req);
      var v = meansVariants(m).filter(function (x) { return Object.keys(x).some(function (l) { return x[l] !== m.req[l]; }) || Object.keys(x).length !== Object.keys(m.req).length; });
      mWeak[m.id] = i % 2 && v[0] ? Object.assign({}, v[0]) : Object.assign({}, m.req);
    });
    badM.slice(0, 3).forEach(function (m) { mForb[m.id] = { loc_erkin: Math.min(2, m.stock) }; });
    var M = [{ k: 'ok', a: mOk }, { k: 'forb', a: mForb }, { k: 'weak', a: mWeak }];
    return { z: shuffle(Z), m: shuffle(M), cz: -1, cm: -1 };
  }
  var PL = ['A', 'B', 'C'];
  function plansRender() {
    var pl = ST.m1.plans, mx = 0;
    pl.z.forEach(function (p) { P.zones.forEach(function (z) { mx = Math.max(mx, p.a[z[0]]); }); });
    if ($('plZ')) $('plZ').innerHTML = '<small>' + T('ТАЙЁР РЕЖАЛАР') + '</small><div class="pg">' + pl.z.map(function (p, i) {
      return '<button data-i="' + i + '" class="' + (pl.cz === i ? 'cur' : '') + '"><b>' + PL[i] + '</b><span class="bars">' + P.zones.map(function (z) {
        var v = p.a[z[0]]; return '<i title="' + BA.byId(z[0]).short + ': ' + fmt(v) + '"><u style="height:' + Math.max(6, Math.round(v / mx * 100)) + '%"></u><em>' + BA.byId(z[0]).key + '</em></i>';
      }).join('') + '</span></button>';
    }).join('') + '</div>';
    if ($('plM')) $('plM').innerHTML = '<small>' + T('ТАЙЁР РЕЖАЛАР') + '</small><div class="pg">' + pl.m.map(function (p, i) {
      var ids = P.means.filter(function (m) { return Object.keys(p.a[m.id]).length; }).map(function (m) { return m.id; });
      return '<button data-i="' + i + '" class="' + (pl.cm === i ? 'cur' : '') + '"><b>' + PL[i] + '</b><span class="ics">' + ids.map(function (id) { return '<i title="' + meansDef(id).name + '">' + ICON(id) + '</i>'; }).join('') + '</span><em>' + ICON('truck') + ids.length + '</em></button>';
    }).join('') + '</div>';
    [].forEach.call(document.querySelectorAll('#plZ button'), function (b) { b.onclick = function () { planZ(+b.dataset.i); }; });
    [].forEach.call(document.querySelectorAll('#plM button'), function (b) { b.onclick = function () { planM(+b.dataset.i); }; });
  }
  function planZ(i) {
    var M = ST.m1; if (M.done) return; var p = M.plans.z[i];
    P.zones.forEach(function (z) { M.alloc[z[0]] = p.a[z[0]]; if (M.chk) delete M.chk.z[z[0]]; });
    M.plans.cz = i; M.planLog = (M.planLog || []).concat('Z' + PL[i] + ':' + p.k);
    S3('sync3D', { alloc: M.alloc }); sfx('select'); plansRender(); m1Refresh();
    toast(ICON('users') + ' ' + T('Режа') + ' ' + PL[i], 1600);
  }
  function planM(i) {
    var M = ST.m1; if (M.done) return; var p = M.plans.m[i], sm = {};
    P.means.forEach(function (m) { M.means[m.id] = Object.assign({}, p.a[m.id]); sm[m.id] = M.means[m.id]; if (M.chk) delete M.chk.m[m.id]; });
    M.pick = null; M.plans.cm = i; M.planLog = (M.planLog || []).concat('M' + PL[i] + ':' + p.k);
    S3('clearMeans'); S3('sync3D', { means: sm }); sfx('select'); popClose(); plansRender(); m1Refresh();
    toast(ICON('truck') + ' ' + T('Режа') + ' ' + PL[i], 1600);
  }
  // тортма панел очилганда асбоблар панели ёпилади (устма-уст тушмаслиги учун)
  function drw(k) { var s = $('stage'); if (k && s.classList.contains('d' + k)) k = null; s.classList.toggle('dl', k === 'l'); s.classList.toggle('dr', k === 'r'); if (k) $('toolBox').classList.remove('open'); popClose(); }
  var syncT = 0;
  function setZ(id, v, typing) {
    if (ST.m1.done) return;
    ST.m1.alloc[id] = clamp(Math.round(v), 0, 4200); if (ST.m1.chk) delete ST.m1.chk.z[id];
    if (ST.m1.plans && ST.m1.plans.cz >= 0) { ST.m1.plans.cz = -1; plansRender(); }   // қўлда ўзгартирилди — режа белгиси олинади
    var keep = typing && document.activeElement === $('zi_' + id); m1Refresh(); if (keep) $('zi_' + id).focus();
    clearTimeout(syncT); syncT = setTimeout(function () { S3('sync3D', { alloc: ST.m1.alloc }); }, 150);
  }
  function popClose() { [].forEach.call(document.querySelectorAll('.pop'), function (p) { p.remove(); }); }
  function popAt(html) {
    popClose(); var p = document.createElement('div'); p.className = 'pop ov-card'; p.id = 'pop'; p.innerHTML = html; $('stage').appendChild(p);
    setTimeout(function () { document.addEventListener('pointerdown', function out(e) { if (!p.contains(e.target)) { popClose(); document.removeEventListener('pointerdown', out, true); } }, true); }, 0);
    return p;
  }
  function m1LocClick(id) {
    var M = ST.m1, L = BA.byId(id);
    if (M.done) { showInfo(id); return; }
    if (M.pick) {   // восита жойлаштириш режими
      var def = meansDef(M.pick), m = M.means[M.pick];
      if (usedOf(M.pick) >= def.stock) { toast(T('Захира тугади')); sfx('warn'); M.pick = null; m1Refresh(); return; }
      m[id] = (m[id] || 0) + 1; if (M.chk) delete M.chk.m[M.pick];
      S3('onUnitPlaced', id, M.pick, m[id]); sfx('select');
      if (usedOf(M.pick) >= def.stock) M.pick = null;
      m1Refresh(); return;
    }
    var z = zById(id);
    if (!z) { showInfo(id); toast(ICON('users') + ' ' + T('Вазиятлар марказига ходим ажратилмайди'), 2200); return; }   // бошқарув пункти
    var r10 = function (v) { return Math.max(0, Math.round(v / 10) * 10); }, vals = shuffle([z[1], r10(z[2] * 0.7), r10(z[3] * 1.3)]);
    var p = popAt('<div class="ph2"><b>' + L.key + '</b>' + L.short + '</div><div class="pv">' + vals.map(function (v) { return '<button data-v="' + v + '" class="' + (v === M.alloc[id] ? 'cur' : '') + '">' + ICON('users') + fmt(v) + '</button>'; }).join('') + '</div>');
    [].forEach.call(p.querySelectorAll('.pv button'), function (b) { b.onclick = function () { setZ(id, +b.dataset.v); sfx('select'); popClose(); }; });
  }
  // воситанинг тайёр жойлаштириш вариантлари (вазиятга қараб 2–3 та): битта тўғри, қолганлари — нотўғри жой ёки етарли эмас
  var MVAR = {};
  function meansVariants(m) {
    if (MVAR[m.id]) return MVAR[m.id];
    var v = [], ids = BA.LOCS.map(function (L) { return L.id; });
    if (m.ok) {
      var req = Object.assign({}, m.req), tot = 0; Object.keys(req).forEach(function (l) { tot += req[l]; });
      v.push(req);                                                              // тўғри
      var wrong = ids.filter(function (l) { return m.allow.indexOf(l) < 0; })[0];
      if (wrong) { var w = {}; w[wrong] = tot; v.push(w); }                    // нотўғри жой
      var k0 = Object.keys(req)[0], low = {}; if (req[k0] > 1 || Object.keys(req).length > 1) { low[k0] = Math.max(1, Math.floor(req[k0] / 2)); v.push(low); }   // етарли эмас
      if (v.length < 2) { var alt = {}; alt[m.allow[m.allow.length - 1] === k0 ? 'loc_hq' : m.allow[m.allow.length - 1]] = tot; v.push(alt); }
    } else {
      var a = {}, b = {}; a.loc_erkin = 2; b[['loc_bypass', 'loc_log', 'loc_fuel'][m.id.length % 3]] = 2; v.push(a, b);   // қонунга зид — иккаласи ҳам хато
    }
    return (MVAR[m.id] = shuffle(v));
  }
  function varLabel(v) { return Object.keys(v).map(function (l) { return '<i>' + BA.byId(l).key + '</i>' + locName(l) + ' <b>×' + v[l] + '</b>'; }).join('<br>'); }
  function mPick(id) {
    var M = ST.m1; if (M.done) return;
    var def = meansDef(id), used = usedOf(id), m = M.means[id], vars = meansVariants(def);
    var same = function (v) { var a = Object.keys(v), b = Object.keys(m); return a.length === b.length && a.every(function (l) { return m[l] === v[l]; }); };
    var p = popAt('<div class="ph2">' + ICON(id) + def.name + '</div><div class="pv col vars">' +
      vars.map(function (v, i) { return '<button data-i="' + i + '" class="' + (same(v) ? 'cur' : '') + '">' + varLabel(v) + '</button>'; }).join('') +
      (used ? '<button data-i="rm" class="rm">' + ICON('cross') + T('Олиб ташлаш') + '</button>' : '') + '</div>');
    [].forEach.call(p.querySelectorAll('button'), function (b) {
      b.onclick = function () {
        BA.LOCS.forEach(function (L) { delete m[L.id]; });
        if (b.dataset.i !== 'rm') Object.assign(m, vars[+b.dataset.i]);
        var sm = {}; sm[id] = m; S3('sync3D', { means: sm });
        if (M.chk) delete M.chk.m[id]; M.pick = null; sfx('select'); popClose(); m1Refresh();
      };
    });
  }
  function badZones() { var C = ST.m1.chk; if (!C) return []; return P.zones.filter(function (z) { return C.z[z[0]] && C.z[z[0]] !== 'ok'; }).map(function (z) { return z[0]; }); }
  function m1Refresh() {
    var M = ST.m1, rem = P.total - allocSum();
    if ($('aRem')) { $('aRem').textContent = fmt(rem); $('aRem').style.color = rem < 0 ? 'var(--r2)' : ''; }
    $('dkLn').textContent = fmt(rem); $('dkLn').style.color = rem < 0 ? 'var(--r2)' : rem === 0 ? '' : 'var(--w)';
    var n = P.means.filter(function (m) { return usedOf(m.id) > 0; }).length; $('dkRn').textContent = n + ' / ' + P.means.length;
    var zb = badZones().length, mb = M.chk ? Object.keys(M.chk.m).filter(function (k) { return M.chk.m[k].k !== 'ok'; }).length : 0;
    $('dkLb').textContent = zb || ''; $('dkLb').classList.toggle('on', !!zb && !M.done); $('dkRb').textContent = mb || ''; $('dkRb').classList.toggle('on', !!mb && !M.done);
    $('dkL').classList.toggle('pulse', !M.done && rem !== 0 && !M.chk); $('dkR').classList.toggle('pulse', !M.done && !n && !M.chk);
    P.zones.forEach(function (z) {
      var i = $('zi_' + z[0]), r = $('zr_' + z[0]); if (!i) return; if (document.activeElement !== i) i.value = M.alloc[z[0]];
      var c = M.chk && M.chk.z[z[0]]; r.classList.remove('ok', 'lo', 'hi'); if (c) r.classList.add(c);
      $('zt_' + z[0]).innerHTML = c === 'ok' ? ICON('check') : c ? ICON('cross') : '';
      $('zt_' + z[0]).title = c && c !== 'ok' ? T('Меъёр') + ': ' + fmt(z[2]) + '–' + fmt(z[3]) : '';
    });
    if ($('mTray')) $('mTray').innerHTML = P.means.map(function (m) {
      var u = usedOf(m.id), mk = M.chk && M.chk.m[m.id];
      var cls = (u ? ' done' : '') + (M.pick === m.id ? ' pk' : '') + (mk && mk.k !== 'ok' ? ' bad' : mk ? ' okk' : '');
      return '<button class="mtk' + cls + '" data-m="' + m.id + '" title="' + m.d + '"><span class="mi">' + ICON(m.id) + '</span><span class="mc">' + u + '/' + m.stock + '</span><b>' + m.name + '</b></button>';
    }).join('');
    [].forEach.call(document.querySelectorAll('.mtk'), function (b) { b.onclick = function () { mPick(b.dataset.m); }; });
    var pb = $('pickbar'); pb.classList.toggle('on', !!M.pick);
    if (M.pick) { var d = meansDef(M.pick); pb.innerHTML = ICON(M.pick) + '<b>' + d.name + '</b><span>' + usedOf(M.pick) + '/' + d.stock + '</span>' + ICON('cross'); }
    $('pOk').textContent = T(M.done ? '2-МОДУЛГА ЎТИШ' : 'ТАСДИҚЛАШ'); $('pOk').classList.toggle('white', M.done);
    if ($('pSkip')) $('pSkip').classList.toggle('hide', M.done);   // tasdiqlangach asosiy tugmaning o'zi 2-modulga o'tkazadi
    $('pscore').textContent = M.score == null ? '—' : M.score + '%';
  }
  function evalMeans(m) {
    var used = usedOf(m.id), map = ST.m1.means[m.id];
    if (!m.ok) return used ? { k: 'forb' } : { k: 'ok' };
    if (!used) return { k: 'miss' };
    if (Object.keys(map).some(function (l) { return m.allow.indexOf(l) < 0; })) return { k: 'place' };
    if (Object.keys(m.req).some(function (l) { return (map[l] || 0) < m.req[l]; })) return { k: 'low' };
    return { k: 'ok' };
  }
  function m1Check() {
    var M = ST.m1; if (M.done) return openM2();
    popClose(); M.pick = null;
    var rem = P.total - allocSum();
    // ходимлар ҳеч қаерга ажратилмаган бўлса — аввал тақсимлаш керак; қолган ҳолатларда тасдиқлаш тўхтамайди,
    // жами мос келмаса (ортиқча ёки тақсимланмаган) — бу ҳам камчилик сифатида кўрсатилади
    // ҳеч нарса тақсимланмаган бўлса — бир марта огоҳлантирилади, қайта босилса шу ҳолатда тасдиқланади
    var empty = rem === P.total || !P.means.some(function (m) { return usedOf(m.id); });
    if (empty && !M.warned) { M.warned = true; sfx('warn'); toast(ICON('warn') + ' ' + T(rem === P.total ? 'Ходимлар тақсимланмаган' : 'Воситалар жойлаштирилмаган') + ' — ' + T('яна босилса, шу ҳолатда тасдиқланади'), 3600); drw(rem === P.total ? 'l' : 'r'); return; }
    M.tries++;
    var C = M.chk = { z: {}, m: {} };
    P.zones.forEach(function (z) { C.z[z[0]] = zStat(z, M.alloc[z[0]]); });
    P.means.forEach(function (m) { C.m[m.id] = evalMeans(m); });
    var zE = badZones(), mE = Object.keys(C.m).filter(function (k) { return C.m[k].k !== 'ok'; });
    // ортиқча ходим (бор кучдан кўп) — ҳар доим хато; тақсимланмаган захира — барча жойлар меъёрда бўлмаса хато
    C.rem = rem < 0 || (rem > 0 && zE.length) ? rem : 0;
    if (M.tries === 1) {
      var s = 0, w = 0;
      P.zones.forEach(function (z) { var v = M.alloc[z[0]], wt = z[0] === 'loc_erkin' ? 2 : 1, st = zStat(z, v), sc = 1; if (st !== 'ok') { var d = st === 'lo' ? z[2] - v : v - z[3]; sc = Math.max(0, 1 - d / (z[1] * 0.35)); } s += sc * wt; w += wt; });
      M.scoreA = Math.round(100 * s / w);
      var okM = P.means.filter(function (m) { return m.ok; }), pts = 0, forb = 0;
      okM.forEach(function (m) { var k = C.m[m.id].k; pts += k === 'ok' ? 1 : k === 'low' || k === 'place' ? 0.5 : 0; });
      P.means.forEach(function (m) { if (!m.ok && C.m[m.id].k === 'forb') forb++; });
      M.scoreM = clamp(Math.round(pts / okM.length * 100 - forb * 15), 0, 100);
      M.score = Math.round(M.scoreA * 0.6 + M.scoreM * 0.4);
      M.err0 = { z: zE.length, m: mE.length };
      M.firstErr = P.means.filter(function (m) { return !m.ok && C.m[m.id].k === 'forb'; }).map(function (m) { return m.id; });
    }
    var bad = zE.slice(); P.means.forEach(function (m) { if (C.m[m.id].k === 'forb') Object.keys(M.means[m.id]).forEach(function (l) { if (bad.indexOf(l) < 0) bad.push(l); }); });
    S3('highlightErrorZones', bad, {}); mapState(bad); m1Refresh();
    var v = $('verd');
    if (!zE.length && !mE.length && !C.rem) {
      M.done = true; S3('highlightErrorZones', []); mapState([]); $('pNorm').classList.add('hide'); sfx('stamp'); setTimeout(function () { sfx('success'); }, 300);
      v.innerHTML = '<div class="vh ok">' + ICON('shield2') + '<b>' + M.score + '%</b><span>' + T('Тайёргарлик') + '</span></div>'; v.className = 'verd ov-card on';
      m1Refresh(); S3('focusZone', 'all'); markLoc(null); return;
    }
    sfx('warn');
    var KM = { forb: 'Қонунга зид', miss: 'Жалб этилмаган', place: 'Нотўғри жой', low: 'Етарли эмас' };
    v.innerHTML = '<div class="vh bad">' + ICON('cross') + '<b>' + (zE.length + mE.length + (C.rem ? 1 : 0)) + '</b><span>' + T('камчилик') + '</span></div><div class="vl">' +
      (C.rem ? '<span title="' + T('Жами') + ': ' + fmt(P.total) + '">' + ICON('users') + T(C.rem > 0 ? 'Тақсимланмаган' : 'Ортиқча') + ' ' + fmt(Math.abs(C.rem)) + '</span>' : '') +
      zE.map(function (id) { return '<span>' + '<i>' + BA.byId(id).key + '</i>' + ICON('users') + T(C.z[id] === 'lo' ? 'кам' : 'ортиқ') + '</span>'; }).join('') +
      mE.map(function (id) { var k = C.m[id].k; return '<span class="' + (k === 'forb' ? 'f' : '') + '" title="' + T(KM[k]) + (k === 'forb' ? ': ' + meansDef(id).why : '') + '">' + ICON(id) + T(KM[k]) + '</span>'; }).join('') + '</div>';
    // Нотўғри тақсимот ҳам ҚАБУЛ ҚИЛИНАДИ ва қулфланади: 2-модулда етишмаган восита/ходимга боғлиқ буйруқлар ишламайди
    v.innerHTML += '<div class="vnote">' + ICON('warn') + T('Тақсимот шу ҳолатда қабул қилинди. 2-модулда етишмаган восита ва ходимларга боғлиқ буйруқлар мавжуд бўлмайди.') + '</div>';
    M.done = true; v.className = 'verd ov-card on'; $('pNorm').classList.add('hide'); m1Refresh();
    if (bad[0]) { S3('focusZone', bad[0]); markLoc(bad[0]); }
  }
  // «2-модулга ўтиш»: hali tasdiqlanmagan bo'lsa — to'g'ri (me'yoriy) taqsimot qo'llanadi va darhol 2-modulga o'tiladi;
  // allaqachon tasdiqlangan bo'lsa — shu taqsimot bilan o'tiladi
  function m1Skip() {
    var M = ST.m1;
    if (!M.done) {
      P.zones.forEach(function (z) { M.alloc[z[0]] = z[1]; });
      P.means.forEach(function (m) { M.means[m.id] = m.ok ? Object.assign({}, m.req) : {}; });
      var sm = {}; P.means.forEach(function (m) { sm[m.id] = M.means[m.id]; });
      M.skip = true; M.chk = null; S3('sync3D', { alloc: M.alloc, means: sm });
      if (M.plans) { M.plans.cz = M.plans.z.findIndex(function (p) { return p.k === 'ok'; }); M.plans.cm = M.plans.m.findIndex(function (p) { return p.k === 'ok'; }); }
      m1Check();
    }
    if (M.done) openM2();
  }
  function m1Norm() {
    var M = ST.m1; if (M.done || M.tries < 1) return;
    P.zones.forEach(function (z) { M.alloc[z[0]] = z[1]; });
    P.means.forEach(function (m) { M.means[m.id] = m.ok ? Object.assign({}, m.req) : {}; });
    var sm = {}; P.means.forEach(function (m) { sm[m.id] = M.means[m.id]; });
    M.norm = true; M.chk = null; S3('sync3D', { alloc: M.alloc, means: sm }); sfx('select'); m1Check();
  }

  /* =====================================================================
     2-МОДУЛ: 3 вариантли каскад симуляция алгоритми
     • 1-модул воситаси ёки ходимлари етишмаса — мос вариант КЎРИНМАЙДИ
     • Тартиб бузилиши тугмаларни блокмайди — ваҳимани оширади ва кейинги
       буйруқ ҳамда натижага тўғридан-тўғри таъсир қилади
     • Ваҳима >= 90%, барқарорлик <= 5%, таъминот <= 0% ёки талофат >= 12
       бўлганда ўйин дарҳол қониқарсиз (2) якунланади
     ===================================================================== */
  function openQ(loc) { return Q.filter(function (q) { return q.loc === loc && !ST.m2.res[q.id]; }); }
  function okRes(id) { return ST.m2.res[id] === 'opt'; }
  function hasMean(id, loc, min) {
    var m = ST.m1.means[id] || {};
    if (Array.isArray(loc)) {
      var s = 0; loc.forEach(function (l) { s += m[l] || 0; }); return s >= (min || 1);
    }
    return (m[loc] || 0) >= (min || 1);
  }
  function staffOk(loc) {
    var z = zById(loc);
    return !z || (ST.m1.alloc[loc] || 0) >= z[2];
  }
  function meansOk(need) {
    if (!need) return true;
    return Object.keys(need).every(function (id) {
      var spec = need[id];
      if (spec._any) {
        var min = spec[Object.keys(spec).filter(function (k) { return k !== '_any'; })[0]] || 1;
        return hasMean(id, spec._any, min);
      }
      return Object.keys(spec).every(function (l) { return hasMean(id, l, spec[l]); });
    });
  }
  // Вариант кўринадими? 1-модул воситаси ёки локация ходимлари етишмаса — ўчирилади (кўринмайди)
  function optVisible(q, o) {
    if (!o) return false;
    if (o.needStaff && !staffOk(q.loc)) return false;
    if (o.need && !meansOk(o.need)) return false;
    return true;
  }
  function oodaFor() {
    var p = ST.m2.panic;
    return p >= 78 ? (SIM.oodaCrit || 20) : p >= 60 ? (SIM.oodaWarn || 30) : SIM.ooda;
  }
  function checkFail(D) {
    var F = SIM.fail || { panic: 90, stab: 5, sup: 0, inj: 12 };
    if (D.panic >= F.panic) return 'Ваҳима ' + F.panic + '% дан ошди — вазият назоратдан чиқди';
    if (D.stab <= F.stab) return 'Барқарорлик критик даражага тушди (' + Math.round(D.stab) + '%)';
    if (D.sup <= F.sup) return 'Шаҳар таъминоти тўлиқ узилди (0%)';
    if (D.inj >= F.inj) return 'Талофат критик чегарадан ошди (' + D.inj + ' нафар жабрланган)';
    return null;
  }

  function ensurePanicMetric() {
    if ($('mPanic') || !$('metrics')) return;
    var el = document.createElement('div');
    el.className = 'mt'; el.id = 'mPanic';
    el.innerHTML = '<small>ВАҲИМА</small><b>' + (SIM.panic0 || 25) + '%</b><i><u></u></i>';
    var ref = $('mInj');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(el, ref);
    else $('metrics').appendChild(el);
  }
  function openM2() {
    ST.phase = 'm2'; drw(null); popClose(); $('stage').classList.remove('m1', 'nocams'); $('verd').className = 'verd ov-card'; $('m1ui').classList.add('hide');
    $('metrics').classList.remove('hide'); S3('highlightErrorZones', []); S3('clearMeans');
    ensurePanicMetric();
    var forbN = P.means.filter(function (m) { return !m.ok && usedOf(m.id) > 0; }).length;
    if (forbN) {
      ST.m2.panic = clamp(ST.m2.panic + forbN * 9, 0, 100);
      ST.m2.stab = clamp(ST.m2.stab - forbN * 5, 0, 100);
      toast(ICON('warn') + ' ' + T('Қонунга зид воситалар сабаб ваҳима ортди'), 3600);
    }
    metrics(); setClock(0); renderHome();
  }
  function metrics(flash) {
    var D = ST.m2; D.stab = clamp(D.stab, 0, 100); D.sup = clamp(D.sup, 0, 100); D.panic = clamp(D.panic, 0, 100);
    var set = function (id, v, pct, hiBad) {
      var e = $(id); if (!e) return;
      e.querySelector('b').textContent = v;
      var u = e.querySelector('u');
      if (u) { u.style.width = pct + '%'; e.classList.toggle('low', hiBad ? pct >= 60 : pct < 40); }
    };
    set('mStab', Math.round(D.stab) + '%', D.stab, false);
    set('mSup', Math.round(D.sup) + '%', D.sup, false);
    set('mPanic', Math.round(D.panic) + '%', D.panic, true);
    set('mInj', D.inj); $('mInj').querySelector('b').style.color = D.inj ? 'var(--r2)' : '';
    set('mDone', Object.keys(D.res).length + '/' + Q.length);
    setClock(D.min); if (window.ROOM) ROOM.mood(D.panic);
    if (flash) flash.forEach(function (f) { var e = $(f[0]); if (!e) return; e.classList.remove('flash', 'up'); void e.offsetWidth; e.classList.add(f[1] ? 'up' : 'flash'); });
  }
  function dotsHtml(loc) { return Q.filter(function (q) { return q.loc === loc; }).map(function (q) { var r = ST.m2.res[q.id]; return '<i class="' + (r ? (r === 'opt' ? 'ok' : 'bad') : '') + '"></i>'; }).join(''); }
  /* ----- Ovozli yordamchi: lokatsiya muammosi, xato izohi, kechikish ogohlantirishi ----- */
  function locVoice(id) { if (window.AUD && ASSETS.has('lok', id + '.mp3')) AUD.playFile('lok', id + '.mp3'); }
  var IDLE = { t: null, n: 0 };
  function idleClear() { clearTimeout(IDLE.t); IDLE.t = null; }
  // lokatsiya/vazifa tanlanmay turilsa — 25 s dan keyin, so'ng har 40 s da (ko'pi bilan 3 marta) ovozli ogohlantirish
  function idleArm() {
    idleClear(); if (ST.phase !== 'm2' || IDLE.n >= 3) return;
    IDLE.t = setTimeout(function () {
      if (ST.phase !== 'm2' || ST.paused || (ST.m2.cur && !ST.m2.answered)) return idleArm();
      IDLE.n++;
      toast(ICON('clock') + ' ' + T('Вазият кескинлашмоқда — локацияни танланг ва қарор қабул қилинг'), 3800);
      var f = 'kut_' + (1 + (IDLE.n - 1) % 2) + '.mp3';
      if (window.AUD && ASSETS.has('ogoh', f)) AUD.playFile('ogoh', f); else sfx('warn');
      idleArm();
    }, IDLE.n ? 40000 : 25000);
  }
  // natija ovozi: to'g'ri qaror — buyruq (natija_NN), xato/qisman — xato izohi (xato_NN)
  function resultVoice(q, k) {
    if (k === 'opt') return ASSETS.has('audio', 'natija_' + NN(q.n) + '.mp3') ? { kind: 'audio', file: 'natija_' + NN(q.n) + '.mp3' } : null;
    if (k === 'err' || k === 'alt' || k === 'fail') return ASSETS.has('audio', 'xato_' + NN(q.n) + '.mp3') ? { kind: 'audio', file: 'xato_' + NN(q.n) + '.mp3' } : null;
    return null;
  }
  function renderHome() {
    var D = ST.m2; D.cur = null; D.sel = null; stopTimer(); mapState([], null); idleArm();
    var hints = [];
    if (!D.plan) hints.push('<div class="hint">' + ICON('plan') + T('Аввал бошқарувни ташкил этинг («Барҳам» режаси)') + '</div>');
    if (D.nextPen) hints.push('<div class="hint">' + ICON('clock') + T(D.nextPen.msg) + '</div>');
    if (D.panic >= 60) hints.push('<div class="hint">' + ICON('heart') + T('Ваҳима юқори (' + Math.round(D.panic) + '%) — қарор вақти ' + oodaFor() + ' с') + '</div>');
    panel('<div class="ph"><small>2-МОДУЛ</small><h2>' + ICON('pin') + ' Локацияни танланг</h2></div>' +
      '<div class="scroll"><div class="ltiles">' + BA.LOCS.map(function (L) {
        var op = openQ(L.id).length;
        return '<button data-l="' + L.id + '" class="' + (op ? '' : 'done') + '"><b>' + L.key + '</b><span>' + L.short + '</span><em>' + dotsHtml(L.id) + '</em></button>';
      }).join('') + '</div>' + hints.join('') + '</div>');
    [].forEach.call(document.querySelectorAll('.ltiles button'), function (b) { b.onclick = function () { pickLoc(b.dataset.l); }; });
  }
  function renderLoc(loc) {
    var D = ST.m2, L = BA.byId(loc), list = Q.filter(function (q) { return q.loc === loc; }); D.sel = loc; D.cur = null; stopTimer();
    mapState([], loc); idleArm();
    var nxt = openQ(loc)[0];
    var lockOf = function () { return []; };   // qulf yo'q — ketma-ketlik buzilsa vahima oshadi   // 3-версия: qat'iy ketma-ketlik
    if (nxt && list.length === 1 && !lockOf(nxt).length) return openSit(nxt.id);
    panel('<div class="ph"><small>' + L.key + ' • ' + L.short + '</small><h2>' + L.name + '</h2></div>' +
      '<div class="scroll"><button class="back" id="bBack">' + ICON('pin') + T('Локациялар') + '</button><div class="qtiles">' + list.map(function (q) {
        var r = D.res[q.id];
        var lk = r ? [] : lockOf(q);
        return '<button data-q="' + q.id + '"' + (r || lk.length ? ' disabled' : '') + ' class="' + (r ? (r === 'opt' ? 'ok' : 'bad') : lk.length ? 'lock' : '') + '"' + (lk.length ? ' title="' + T('Аввал') + ': ' + lk.map(function (x) { return qById(x).title; }).join(', ') + '"' : '') + '>' + ICON(lk.length ? 'lock' : q.ic) + '<span>' + q.title + (lk.length ? '<small class="lk">' + T('Аввал') + ': ' + lk.map(function (x) { return qById(x).title; }).join(', ') + '</small>' : '') + '</span>' + (r ? ICON(r === 'opt' ? 'check' : 'cross') : '') + '</button>';
      }).join('') + '</div></div>');
    $('bBack').onclick = renderHome;
    [].forEach.call(document.querySelectorAll('.qtiles button'), function (b) { b.onclick = function () { openSit(b.dataset.q); }; });
  }
  function openSit(id) {
    var D = ST.m2, q = qById(id), L = BA.byId(q.loc);
    if (D.res[id]) return renderLoc(q.loc);
    // 3-версия: аввалги босқичлар бажарилмаган бўлса — бу қарор очилмайди
    var miss = (q.orderReq || []).filter(function (r) { return !D.res[r]; });
    if (miss.length) { sfx('warn'); toast(ICON('warn') + ' ' + T('Кетма-кетлик бузилмоқда — аввал') + ': ' + miss.map(function (r) { return qById(r).title; }).join(', ') + '. ' + T('Ваҳима ортади'), 3600); }
    D.cur = id; D.answered = false; idleClear();
    var oodaSec = oodaFor(); D.tMax = oodaSec;
    // Восита ёки ходим етишмаслиги сабаб ўчирилган вариантлар КЎРИНМАЙДИ
    var vis = D.order[id].filter(function (oi) { return optVisible(q, q.opts[oi]); });
    // 1-модул оқибати: қайси восита/ходим етишмагани учун буйруқ мавжуд эмаслиги кўрсатилади (жавоб ошкор қилинмайди)
    var miss = [], staffMiss = false;
    q.opts.forEach(function (o) {
      if (optVisible(q, o)) return;
      if (o.needStaff && !staffOk(q.loc)) staffMiss = true;
      if (o.need) Object.keys(o.need).forEach(function (mid) { if (!meansOk((function () { var x = {}; x[mid] = o.need[mid]; return x; })()) && miss.indexOf(mid) < 0) miss.push(mid); });
    });
    var missHtml = miss.length || staffMiss ? '<div class="hint miss">' + ICON('lock') + T('1-модулда етишмади — айрим буйруқлар мавжуд эмас') + ':<span class="mi">' + (staffMiss ? ICON('users') : '') + miss.map(function (mid) { return '<i title="' + esc(meansDef(mid).name) + '">' + ICON(mid) + '</i>'; }).join('') + '</span></div>' : '';
    if (miss.length || staffMiss) { D.blocked = D.blocked || {}; D.blocked[id] = { means: miss, staff: staffMiss }; }
    panel('<div class="ph"><small>' + L.key + ' • ' + L.short + '</small></div>' +
      '<div class="scroll" id="m2body"><button class="back" id="bBack">' + ICON('pin') + T('Локациялар') + '</button>' +
      '<div class="qcard"><div class="qi">' + ICON(q.ic) + '</div><div class="qt"><h3>' + q.title + '</h3><p>' + q.situ + '</p></div>' +
      '<div class="ooda" id="ooda"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" stroke="#242833" stroke-width="4" fill="none"/><circle id="oodaC" cx="22" cy="22" r="19" stroke="#F5F6F8" stroke-width="4" fill="none" stroke-dasharray="119.4" stroke-dashoffset="0"/></svg><span class="t" id="oodaT">' + oodaSec + '</span></div></div>' + missHtml +
      '<div class="opts2" id="opts" style="grid-template-columns:1fr;gap:8px">' + vis.map(function (oi) {
        var o = q.opts[oi];
        return '<button data-o="' + oi + '" style="min-height:auto;flex-direction:row;text-align:left;padding:12px 14px;justify-content:flex-start"><span class="oi" style="width:42px;height:42px;flex:none">' + ICON(o.ic) + '</span><span class="ot">' + o.t + '</span></button>';
      }).join('') + '</div>' +
      '<div id="out"></div></div><div class="foot hide" id="m2foot"><button class="btn" id="bNext">ДАВОМ ЭТИШ</button></div>');
    $('bBack').onclick = function () { if (!D.answered) renderHome(); else { var nx = $('bNext'); if (nx) nx.click(); } };
    [].forEach.call(document.querySelectorAll('#opts button'), function (b) { b.onclick = function () { answer(+b.dataset.o); }; });
    var fz = q.fxLoc || q.loc; if (window.ROOM) { ROOM.loc(q.loc); if (fz !== 'loc_hq') S3('focusZone', fz); } else if (fz === 'loc_hq') hqImg(true); else { hqImg(false); S3('focusZone', fz); } markLoc(q.loc); mapState([], q.loc);
    // savol ovozi: lokatsiya muammosi aytilayotgan bo'lsa — u tugagach (bir-birini bo'lmasin)
    if (window.AUD) {
      var qv = function () { AUD.playFile('audio', 'q_' + NN(q.n) + '.mp3', function () { sfx('radio'); }); };
      var cv0 = AUD.current();
      if (cv0 && /\/lok\//.test(cv0.src) && !cv0.ended && !cv0.paused) cv0.addEventListener('ended', function () { if (ST.m2.cur === id && !ST.m2.answered) qv(); });
      else qv();
    }
    startTimer(oodaSec);
  }
  function stopTimer() { clearInterval(ST.m2.timer); ST.m2.timer = null; }
  function startTimer(sec) {
    var D = ST.m2; stopTimer(); var lim = sec || oodaFor(); D.tMax = lim; D.tLeft = lim;
    D.timer = setInterval(function () {
      if (ST.paused || D.answered) return;
      D.tLeft = Math.max(0, D.tLeft - 0.25);
      var u = D.tLeft / D.tMax, c = $('oodaC'); if (!c) return stopTimer();
      c.setAttribute('stroke-dashoffset', (119.4 * (1 - u)).toFixed(1)); c.setAttribute('stroke', u > 0.25 ? '#F5F6F8' : '#E11D48');
      $('oodaT').textContent = Math.ceil(D.tLeft); $('ooda').classList.toggle('warn', D.tLeft <= 10);
      if (D.tLeft <= 10 && Math.abs(D.tLeft - Math.round(D.tLeft)) < 0.01 && D.tLeft > 0) sfx('tick');
      if (D.tLeft <= 0) answer(null);
    }, 250);
  }
  function fxList(f) { return f == null ? [] : Array.isArray(f) ? f : [f]; }
  // oi — вариант индекси, null — вақт тугади
  function answer(oi) {
    var D = ST.m2, q = qById(D.cur); if (!q || D.answered) return; D.answered = true; stopTimer(); IDLE.n = 0;
    var o = oi == null ? null : q.opts[oi], k = o ? o.k : 'timeout', d = o ? o.d : {}, notes = [];
    var st0 = D.stab, su0 = D.sup, in0 = D.inj, pa0 = D.panic;
    var pts = SIM.points[k] != null ? SIM.points[k] : 0, fx = o ? o.fx : null, extraDelay = 0;

    // osonlashtirilgan: dastlabki 2 ta kritik xato o'yinni tugatmaydi — og'ir jazo bilan davom etadi (SIM.critLives)
    var LIVES = SIM.critLives != null ? SIM.critLives : 2;
    if (k === 'crit' && (D.critN || 0) < LIVES) {
      D.critN = (D.critN || 0) + 1; k = 'err'; pts = 0; fx = null; d = { stab: -12, panic: 20, inj: 2, delay: 15 };
      notes.push(['warn', 'Критик хато (' + D.critN + ' / ' + (LIVES + 1) + ') — оғир оқибатлар. ' + (LIVES + 1) + '-критик хатода машғулот якунланади']);
      sfx('alarm', 1.5);
    }
    if (k === 'crit') {
      D.res[q.id] = 'crit'; D.pts[q.id] = 0; D.crit = { q: q, o: o }; logIt(q, o, k, notes);
      var cv = resVideo(q.n, false); if (cv && window.ROOM) ROOM.result(q.fxLoc || q.loc, cv); return cv ? playMedia(cv, function () { critical(q, o); }) : critical(q, o);
    }

    // 1) Олдинги нотўғри/тартибсиз буйруқдан ўтган каскад таъсири (кейинги буйруққа таъсир)
    if (D.nextPen) {
      var np = D.nextPen; D.nextPen = null;
      D.panic += np.panic || 0; extraDelay += np.delay || 0; D.stab += np.stab || 0; D.inj += np.inj || 0; pts -= 8;
      notes.push(['clock', np.msg]);
    }

    // 2) Қатъий кетма-кетликка риоя қилинмаслиги (тугма блокланмайди, лекин ваҳима ортади ва кейинги амалга таъсир қилади)
    // бажарилмаган (ёки хато/кечиктирилган) шарт — «бузилди»; муқобил вариант билан бажарилган — «қисман»
    var reqIds = q.orderReq || [], ORD = D.ord = D.ord || { early: 0, late: 0, inOrder: 0, partial: 0 };
    var missedOrder = reqIds.filter(function (rid) { var r = D.res[rid]; return r !== 'opt' && r !== 'alt'; });
    var partialOrder = reqIds.filter(function (rid) { return D.res[rid] === 'alt'; });
    var supMult = 1;
    if (missedOrder.length) ORD.early++;
    if (missedOrder.length) {
      var missNames = missedOrder.map(function (rid) { var rq = qById(rid); return rq ? rq.title : rid; }).join(', ');
      if (missedOrder.indexOf('hq_plan') >= 0 && !D.plan) {
        extraDelay += SIM.coordPenalty.min; D.stab += SIM.coordPenalty.stab; D.panic += SIM.coordPenalty.panic; pts -= SIM.coordPenalty.pts;
      }
      var otherMiss = missedOrder.filter(function (rid) { return rid !== 'hq_plan'; });
      if (otherMiss.length) {
        extraDelay += otherMiss.length * 10; D.panic += otherMiss.length * 15;   // 3-versiya: tartib buzilsa vahima kuchliroq D.stab -= otherMiss.length * 4; pts -= otherMiss.length * 10;
      }
      notes.push(['plan', 'Тартиб бузилди (аввал: ' + missNames + ') — ваҳима ва кечикиш ортди']);

      // Муайян босқичлар учун чуқур каскад оқибатлари
      if (q.id === 'erk_negot' && missedOrder.indexOf('erk_buffer') >= 0 && k !== 'err') {
        k = 'fail'; pts = SIM.points.fail; fx = null; supMult = 0;
        D.stab -= 10; D.panic += 14; D.inj += 2;
        notes.push(['buf', 'Провокаторлар ажратилмасдан музокара бошланди — мулоқот бузилди']);
        D.nextPen = { panic: 12, delay: 10, stab: -5, inj: 1, msg: 'Олдинги музокара бузилгани сабаб кейинги буйруқ оғирлашди' };
      } else if (q.id === 'byp_green' && (missedOrder.indexOf('log_water') >= 0 || missedOrder.indexOf('byp_exits') >= 0) && k !== 'err') {
        k = 'fail'; pts = SIM.points.fail; fx = null; supMult = 0;
        extraDelay += 12; D.panic += 12; D.inj += 2;
        notes.push(['bus', 'Йўлаклар очилмасдан эвакуация бошланди — автобуслар тиқилиб қолди']);
        D.nextPen = { panic: 10, delay: 10, stab: -4, inj: 1, msg: 'Эвакуация тиқилинчи кейинги буйруқни кечиктирди' };
      } else if (q.id === 'log_water' && missedOrder.indexOf('byp_exits') >= 0) {
        D.cascade.jammed = true;
        D.nextPen = { panic: 10, delay: 10, stab: -4, inj: 0, msg: 'Чиқиш йўлакларисиз йўл очилгани сабаб айланма тиқилиб қолди' };
      } else if ((q.id === 'air_kero' || q.id === 'fuel_conv') && (missedOrder.indexOf('byp_exits') >= 0 || missedOrder.indexOf('log_water') >= 0)) {
        supMult = 0.5; D.inj += 1;
        D.nextPen = { panic: 10, delay: 8, stab: -4, inj: 0, msg: 'Колонна тиқилинчга тушгани сабаб кейинги босқич кечикди' };
      } else if (!D.nextPen) {
        D.nextPen = { panic: 8, delay: 8, stab: -3, inj: 0, msg: 'Аввалги амал тартиби бузилгани кейинги буйруққа таъсир қилди' };
      }
    }

    var qName = function (ids) { return ids.map(function (rid) { var rq = qById(rid); return rq ? rq.title : rid; }).join(', '); };
    // 2б) Аввалги шарт қисман бажарилган — самара пасаяди
    if (partialOrder.length && k !== 'timeout') {
      var PP = SIM.partial || { panic: 5, min: 4, pts: 4 };
      D.panic += PP.panic * partialOrder.length; extraDelay += PP.min * partialOrder.length; pts -= PP.pts * partialOrder.length; ORD.partial++;
      if (q.id === 'erk_negot' && partialOrder.indexOf('erk_buffer') >= 0) supMult *= 0.5;
      notes.push(['order', 'Аввалги босқич қисман бажарилган (' + qName(partialOrder) + ') — самара пасайди']);
    }
    // 2в) КЕЧ берилган қарор: кейинги босқичдаги қарорлар аввал бажарилган бўлса — ҳар бири учун ваҳима ва кечикиш
    var PH = SIM.phase || {}, ph = PH[q.id] || 0, passed = ph ? Object.keys(D.res).filter(function (rid) { return (PH[rid] || 0) > ph; }) : [];
    if (passed.length) {
      var LT = SIM.late || { panic: 5, min: 4, pts: 5, max: 3 }, nL = Math.min(passed.length, LT.max);
      D.panic += LT.panic * nL; extraDelay += LT.min * nL; pts -= LT.pts * nL; ORD.late++;
      notes.push(['order', 'Кеч берилди: аввал кейинги босқич бажарилган (' + qName(passed.slice(0, 3)) + ')']);
    }
    // 2г) Тўғри кетма-кетлик: барча шартлар оптимал бажарилган ва кечикмаган — самара ошади
    if (reqIds.length && !missedOrder.length && !partialOrder.length && !passed.length && (k === 'opt' || k === 'alt')) {
      var IO = SIM.inOrder || { stab: 4, panic: -5, pts: 6 };
      D.stab += IO.stab; D.panic += IO.panic; pts += IO.pts; ORD.inOrder++;
      notes.push(['check', 'Тўғри кетма-кетлик (' + qName(reqIds) + ' дан кейин) — самара ошди']);
    }

    // Йўл тиқилиб қолган каскад ҳаракат буйруқларига таъсир қилади
    if (D.cascade.jammed && (q.id === 'byp_green' || q.id === 'air_kero' || q.id === 'fuel_conv')) {
      D.cascade.jammed = false; supMult *= 0.6; extraDelay += 10; D.panic += 8;
      notes.push(['lanes', 'Олдинги тиқилинч сабаб таъминот ва ҳаракат сустлашди']);
    }

    // 3) Асосий қадам вақти ва вариант натижаси
    extraDelay += d.delay || 0;
    if (k === 'timeout') {
      extraDelay += 12; D.stab -= 8; D.panic += 18; D.inj += 1;
      notes.push(['clock', 'Қарор вақтида қабул қилинмади (+12 дақ, +1 жабрланган)']);
      D.nextPen = { panic: 10, delay: 8, stab: -4, inj: 0, msg: 'Кечиктирилган қарор кейинги босқичда ваҳимани оширди' };
    } else if (k === 'fail') {
      D.panic += d.panic > 0 ? d.panic : 8;
    } else {
      D.stab += d.stab || 0;
      D.sup += Math.round((d.sup || 0) * supMult);
      D.inj += d.inj || 0;
      D.panic += d.panic != null ? d.panic : (k === 'opt' ? -8 : 12);
    }
    D.min += SIM.stepMin + extraDelay;
    D.delay += extraDelay;

    // 4) Муддатлардан ўтиб кетиш каскади
    if (q.deadline && D.min > q.deadline) {
      D.panic += 14; D.sup -= 8; pts -= 15;
      notes.push(['clock', 'Муддат (' + clockText(q.deadline) + ') бузилди — оқибатлар кучайди']);
    }
    if (!D.res.hq_info && q.id !== 'hq_info' && D.min > 45) {
      D.panic += 10; D.sup -= 4;
      notes.push(['media', '08:15 дан ўтди — фейклар сабаб ваҳима ортмоқда (+10%)']);
    }
    if (!D.res.air_kero && q.id !== 'air_kero' && D.min > 120) {
      D.panic += 14; D.sup -= 8;
      notes.push(['plane', '09:30 дан ўтди — авиакеросин захираси тугади']);
    }
    if (!D.res.fuel_conv && q.id !== 'fuel_conv' && D.min > 145) {
      D.panic += 12; D.sup -= 6;
      notes.push(['fuel', '09:55 дан ўтди — шохобчаларда тиқилинч кучайди']);
    }

    // 4б) Yengillashtirilgan balans: vahima o'sishi 40 % ga kamaytiriladi (pasayishi o'zgarmaydi)
    if (D.panic > pa0) D.panic = pa0 + (D.panic - pa0) * (SIM.panicK || 0.45);
    // 5) Юқори ваҳима талофатлари ва тиббий/ёнғин хизмати етишмаслиги
    D.panic = clamp(D.panic, 0, 100);
    D.stab = clamp(D.stab, 0, 100);
    D.sup = clamp(D.sup, 0, 100);
    if (D.panic >= 75 && k !== 'opt') {
      D.inj += 2; D.stab = clamp(D.stab - 5, 0, 100);
      notes.push(['heart', 'Юқори ваҳима — оломонда тиқилинч (+2 жабрланган)']);
    } else if (D.panic >= 60 && k !== 'opt') {
      D.inj += 1;
      notes.push(['heart', 'Ваҳима фонида +1 жабрланган']);
    }
    var newInj = D.inj - in0;
    if (newInj > 0 && !hasMean('amb', 'loc_erkin', 2)) {
      D.inj += newInj;
      notes.push(['amb', 'Тез ёрдам етишмагани сабаб талофат 2 баробар ортди']);
    }
    if (k !== 'opt' && (q.loc === 'loc_erkin' || q.loc === 'loc_fuel') && !hasMean('fvv', 'loc_erkin', 2)) {
      D.inj += 1; D.panic = clamp(D.panic + 10, 0, 100);
      notes.push(['fvv', 'ФВВ экипажи йўқлиги сабаб хавф ортди (+1 жабрланган)']);
    }

    if (q.id === 'hq_plan' && (k === 'opt' || k === 'alt')) D.plan = true;
    D.res[q.id] = k; D.pts[q.id] = clamp(pts, 0, 100);
    logIt(q, o, k, notes);

    var fl = [];
    if (D.stab !== st0) fl.push(['mStab', D.stab > st0]);
    if (D.sup !== su0) fl.push(['mSup', D.sup > su0]);
    if (D.panic !== pa0) fl.push(['mPanic', D.panic < pa0]);
    if (D.inj !== in0) fl.push(['mInj', false]);

    // 6) КРИТИК ЧЕГАРАЛАР: ваҳима >= 90% ёки кўрсаткичлар тушиб кетса — дарҳол қониқарсиз якунлаш
    var failMsg = checkFail(D);
    if (failMsg) {
      metrics(fl);
      var fo = { ic: 'heart', t: q.title, out: failMsg, law: o ? o.law : [] };
      D.res[q.id] = 'crit'; D.pts[q.id] = 0; D.crit = { q: q, o: fo };
      return critical(q, fo);
    }

    var go = function () { outcome(q, o, k, notes, fx); metrics(fl); camVideosAfter(q.n); };
    var vs = k === 'timeout' ? null : resVideo(q.n, k === 'opt' ? true : k === 'alt' ? 'alt' : false);
    if (vs && window.ROOM) ROOM.result(q.fxLoc || q.loc, vs);   // shu lokatsiyaning «eng so'nggi holati»
    // natija sahnasi (video yoki harakatlanuvchi rasm) bilan birga buyruq ovozi (natija_NN) eshitiladi
    var rv = resultVoice(q, k);
    if (vs) { D.voiced = rv ? q.id : null; playMedia(vs, go, { voice: rv, imgDur: 7 }); } else go();
  }
  // натижа саҳнаси: dNN_ok / dNN_qisman / dNN_xato — .mp4 (видео) ёки .jpg (ҳаракатланувчи расм); бўлмаса — умумий dNN.mp4
  function resVideo(n, ok) {
    var b = 'd' + NN(n), sfx2 = ok === true ? ['_ok'] : ok === 'alt' ? ['_qisman', '_xato'] : ['_xato'];
    for (var i = 0; i < sfx2.length; i++) { if ((window.ROOM_SKIP || []).indexOf(b + sfx2[i]) >= 0) continue; for (var e = 0; e < 3; e++) { var f = b + sfx2[i] + ['.mp4', '.jpg', '.webp'][e]; if (ASSETS.has('videos', f)) return 'videos/' + f; } }   // ROOM_SKIP: boshliq ko'rinadigan sahnalar
    if (window.ROOM_SKIP) return null;
    return window.AUD ? AUD.video(n) : null;
  }
  function logIt(q, o, k, notes) {
    var D = ST.m2;
    D.log.push({ n: q.n, id: q.id, dec: q.dec, time: clockText(D.min), loc: q.loc, title: q.title, opt: o ? o.t : 'Қарор қабул қилинмади', ic: o ? o.ic : 'clock', k: k, law: o ? o.law : [], notes: notes.map(function (n) { return n[1]; }), best: q.opts.filter(function (x) { return x.k === 'opt'; })[0] });
  }
  function outcome(q, o, k, notes, fx) {
    var ok = k === 'opt', best = q.opts.filter(function (x) { return x.k === 'opt'; })[0];
    [].forEach.call(document.querySelectorAll('#opts button'), function (b) {
      var oo = q.opts[+b.dataset.o]; b.disabled = true;
      if (o && oo === o) b.classList.add('sel', ok ? 'k-ok' : 'k-bad'); else if (oo === best) b.classList.add('best');
    });
    $('bBack').classList.add('hide');
    var laws = (o ? o.law : best.law).map(function (l) { return '<span class="lchip" title="' + esc(T(LAW[l].s)) + '">' + ICON('law') + lawShort(l) + '</span>'; }).join('');
    $('out').innerHTML = '<div class="res ' + (ok ? 'ok' : 'bad') + '">' + ICON(ok ? 'check' : 'cross') + '<span>' + (o ? o.out : T('Буйруқ берилмади')) + '</span></div>' +
      (notes.length ? '<div class="notes">' + notes.map(function (n) { return '<div>' + ICON(n[0]) + T(n[1]) + '</div>'; }).join('') + '</div>' : '') +
      (laws ? '<div class="lchips">' + laws + '</div>' : '');
    $('m2foot').classList.remove('hide');
    $('bNext').onclick = function () { if (Object.keys(ST.m2.res).length >= Q.length) finish(); else if (openQ(q.loc).length) renderLoc(q.loc); else renderHome(); };
    if (ok || k === 'alt') fxList(fx).forEach(function (f, i) { S3('playFx', f, ok ? 'ok' : 'err', q.fxLoc || q.loc); if (window.AUD) setTimeout(function () { AUD.fx(f); }, 600 + i * 900); });
    else { S3('playFx', null, 'err', q.fxLoc || q.loc); mapState([q.loc], q.loc); }
    var rv = resultVoice(q, k);
    if (ST.m2.voiced === q.id || !rv) sfx(ok ? 'confirm' : 'warn');   // ovoz natija sahnasi bilan birga allaqachon eshitildi yoki fayl yo'q
    else window.AUD && AUD.playFile(rv.kind, rv.file, function () { sfx(ok ? 'confirm' : 'warn'); });
  }
  // критик хато ёки кўрсаткичлар қулаши — дарҳол қониқарсиз якунлаш
  function critical(q, o) {
    [].forEach.call(document.querySelectorAll('#opts button'), function (b) { b.disabled = true; if (q.opts[+b.dataset.o] === o) b.classList.add('sel', 'k-bad'); });
    fxList(o.fx).forEach(function (f) { S3('playFx', f, 'crit', q.fxLoc || q.loc); }); S3('focusZone', q.fxLoc || q.loc); mapState([q.loc], q.loc);
    sfx('alarm', 3.5); alertFx('bad', T('ҚОНИҚАРСИЗ ЯКУН • НАЗОРАТ ЙЎҚОТИЛДИ'), T(o.out), 4600);
    // огоҳлантирувчи овоз (audio/ogoh/): критик буйруқ тури ёки кўрсаткичлар қулаши бўйича
    var ogoh = { gas: 'crit_gas', gun: 'crit_gun', blk: 'crit_block', comm: 'crit_comm' }[o.ic] || (/Ваҳима/.test(o.out) ? 'fail_panic' : 'fail_metrics');
    if (window.AUD) setTimeout(function () { AUD.playFile('ogoh', ogoh + '.mp3'); }, 700);
    $('out').innerHTML = '<div class="res bad">' + ICON('cross') + '<span>' + o.out + '</span></div>' + (o.law && o.law.length ? '<div class="lchips">' + o.law.map(function (l) { return '<span class="lchip">' + ICON('law') + lawShort(l) + '</span>'; }).join('') + '</div>' : '');
    $('bBack').classList.add('hide');
    setTimeout(finish, 4800);
  }

  /* =====================================================================
     ЯКУН: «Натижа ҳисобланмоқда» → сертификат → тўлиқ ҳисобот
     ===================================================================== */
  function results() {
    var M = ST.m1, D = ST.m2, ids = Object.keys(D.pts), sum = 0;
    ids.forEach(function (id) { sum += D.pts[id]; });
    var m2 = Math.round(sum / Q.length), m1 = M.score || 0;
    var late = Math.max(0, D.min - (SIM.maxMin || 180));
    var latePen = late > 0 ? Math.min(15, Math.ceil(late / 10) * 3) : 0;
    // Қарорлар кетма-кетлиги (0–100 %): эрта/кеч берилган ва қисман бажарилган шартлар камайтиради, тўғри тартиб оширади;
    // барча қарорлар қабул қилинмаган бўлса — улуши бўйича камаяди (критик хато билан тез якунлаш юқори баҳо олмасин)
    var O = D.ord || { early: 0, late: 0, inOrder: 0, partial: 0 }, cnt = function (k) { return D.log.filter(function (l) { return l.k === k; }).length; };
    var ordP = clamp(Math.round((100 - O.early * 14 - O.late * 10 - O.partial * 6 + O.inOrder * 3) * D.log.length / Q.length), 0, 100);
    // Умумий баҳо: 1-модул 25 % + 2-модул қарорлари 55 % + қарорлар кетма-кетлиги 20 %
    var W = SIM.weights || { m1: 0.25, m2: 0.55, ord: 0.2 };
    var total = clamp(Math.round(m1 * W.m1 + m2 * W.m2 + ordP * W.ord) - latePen, 0, 100); if (D.crit) total = Math.min(total, 54);
    var g = SC.grade(total, !!D.crit, D.inj, D.panic, late, ordP), okN = D.log.filter(function (l) { return l.k === 'opt'; }).length;
    var status = D.crit ? 'МАҒЛУБИЯТ • КРИТИК ХАТО' : g[0] === 5 ? 'ТЎЛИҚ НАЗОРАТ' : g[0] >= 3 ? 'ҚИСМАН НАЗОРАТ' : 'МАҒЛУБИЯТ';
    var sec = Math.round(((ST.endAt || Date.now()) - ST.t0 - ST.pauseMs) / 1000);
    // Қўшимча кўрсаткичлар: қонунийлик, тезкорлик (ҳар бири 0–100 %, қайдномада 2,0–5,0 шкалада)
    var legP = clamp(100 - (M.firstErr || []).length * 18 - cnt('err') * 12 - (D.crit ? 40 : 0), 0, 100);
    var spdP = clamp(Math.round(100 - cnt('timeout') * 20 - Math.max(0, D.delay - 20) * 0.8 - late * 0.5), 0, 100);
    var blocked = Object.keys(D.blocked || {}).length;
    return { m1: m1, m2: m2, total: total, grade: g, status: status, okN: okN, n: Q.length, dur: Math.floor(sec / 60) + ' ' + T('дақ'), end: clockText(D.min), panic: Math.round(D.panic), delay: D.delay, late: late,
      ordP: ordP, legP: legP, spdP: spdP, ord: O, blocked: blocked, done: D.log.length };
  }
  function band(p) { return (Math.round((2 + clamp(p, 0, 100) * 3 / 100) * 2) / 2).toFixed(1); }
  function finish() {
    var D = ST.m2; if (ST.phase === 'final') return; ST.phase = 'final'; ST.endAt = Date.now(); stopTimer();
    metrics(); panel(''); $('stage').classList.add('nocams'); showWorkUI(false);
    S3('cam.cine', false); S3('focusZone', 'loc_erkin', { cam: { d: 240, tilt: 0.36, yaw: 0.6 }, instant: true });
    $('certOv').innerHTML = '<div class="calc"><div class="bars"><i></i><i></i><i></i><i></i><i></i></div><b>' + T('НАТИЖА ҲИСОБЛАНМОҚДА') + '</b></div>';
    overlay('certOv', true);
    setTimeout(function () { ST.shot = has3D ? S3D.snapshot(960, 540) : null; scoreScreen(); }, 2200);
    void D;
  }
  // 2-версия: avval katta ball ekrani (doira + baho + qisqa xulosa), so'ng «Natija varaqasi» tugmasi bilan qaydnoma
  function scoreScreen() {
    var R = results(), D = ST.m2, g = R.grade[0];
    var cls = g >= 5 ? 'g5' : g === 4 ? 'g4' : g === 3 ? 'g3' : 'g2';
    var why = D.crit ? D.crit.o.out : g >= 5 ? 'Вазият тўлиқ назоратга олинди, талофатларсиз.' : g === 4 ? 'Вазият назоратга олинди, айрим кечикишлар бўлди.' : g === 3 ? 'Вазият қисман назоратга олинди: кечикиш ва жабрланганлар бор.' : 'Йўл тўсилди, тўқнашувлар ва жароҳатлар юз берди.';
    var C = 2 * Math.PI * 120, off = C * (1 - R.total / 100);
    $('certOv').innerHTML = '<div class="score ' + cls + '"><small>' + T('МАШҒУЛОТ ЯКУНЛАНДИ') + ' • ' + esc(ST.who) + '</small>' +
      '<div class="ring"><svg viewBox="0 0 280 280"><circle cx="140" cy="140" r="120" class="bg"/><circle cx="140" cy="140" r="120" class="fg" style="stroke-dasharray:' + C.toFixed(1) + ';stroke-dashoffset:' + C.toFixed(1) + '" data-off="' + off.toFixed(1) + '"/></svg>' +
      '<div class="num"><b id="scNum">0</b><span>/ 100 ' + T('балл') + '</span></div></div>' +
      '<div class="lvl">' + T(R.grade[1]).toUpperCase() + '</div><p>' + T(why) + '</p>' +
      '<button class="btn" id="scNext">' + T('НАТИЖА ВАРАҚАСИ') + ' ▶</button></div>';
    var fgc = $('certOv').querySelector('.ring .fg'); requestAnimationFrame(function () { fgc.style.strokeDashoffset = fgc.dataset.off; });
    var n = 0, it = setInterval(function () { n = Math.min(R.total, n + Math.max(1, Math.ceil(R.total / 40))); $('scNum').textContent = n; if (n >= R.total) clearInterval(it); }, 30);
    sfx(g >= 4 && !D.crit ? 'success' : 'warn');
    $('scNext').onclick = function () { clearInterval(it); renderCert(); };
  }
  // Натижалар қайдномаси — халқаро тест ҳисоботи варағи услубида (ўз дизайнимиз, барча матнлар T() орқали)
  function formData(R) {
    var D = ST.m2, M = ST.m1, dt = new Date(), dd = dt.toLocaleDateString('ru-RU');
    var t0 = new Date(ST.t0 || Date.now()), stamp = t0.getFullYear() % 100 * 1e8 + (t0.getMonth() + 1) * 1e6 + t0.getDate() * 1e4 + t0.getHours() * 100 + t0.getMinutes();
    var parts = String(ST.who || '').trim().split(/\s*[,•]\s*/), who = parts[0] || '—', rank = parts.slice(1).join(', ');
    var cm = [T(R.status)];
    if (D.crit) cm.push(T('Критик хато') + ': ' + T(D.crit.o.out));
    cm.push(T('Тўғри қарорлар') + ': ' + R.okN + ' / ' + R.n + (R.done < R.n ? ' (' + T('якунланмаган') + ': ' + (R.n - R.done) + ')' : ''));
    if (R.blocked) cm.push(T('1-модул камчилиги сабаб') + ' ' + R.blocked + ' ' + T('та вазиятда оптимал буйруқ мавжуд бўлмади'));
    if (R.ord.early || R.ord.late) cm.push(T('Кетма-кетлик бузилди') + ': ' + T('эрта') + ' ' + R.ord.early + ', ' + T('кеч') + ' ' + R.ord.late);
    if (R.ord.inOrder) cm.push(T('Тўғри кетма-кетликда') + ': ' + R.ord.inOrder + ' ' + T('та қарор'));
    cm.push(T('Талофат') + ': ' + D.inj + ' • ' + T('Ваҳима') + ': ' + R.panic + '%');
    var shield = '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/></svg>';
    return {
      brand: 'М-39', brandSub: T('ТАКТИК ТРЕНАЖЁР'), kind: T('ТЕЗКОР ШТАБ'), title: T('Натижалар қайдномаси'),
      noteLbl: T('ИЗОҲ'), note: T('Қайднома тингловчининг «М-39 транспорт тирбандлиги» сценарийси бўйича тактик тренажёрдаги натижаларини акс эттиради. Кўрсаткичлар 2,0–5,0 шкаласида, умумий баҳо 2–5 баллда берилади.'),
      L: { centre: T('Марказ рақами'), date: T('Сана'), cand: T('Тингловчи рақами'), details: T('Тингловчи маълумотлари'), who: T('Ф.И.Ш.'), rank: T('Унвони'), id: T('Тингловчи ID'), photo: T('Саҳна'),
        results: T('Натижалар'), overall: T('Умумий баҳо'), level: T('Даража'), comments: T('Раҳбар изоҳи'), stamp1: T('Марказ муҳри'), stamp2: T('Тасдиқ муҳри'), sign: T('Раҳбар имзоси'), reportNo: T('Қайднома рақами') },
      centre: 'M39-01', date: dd, cand: String(1000 + (stamp % 9000)), who: who, rank: rank, id: 'T' + stamp, photo: ST.photo || ST.shot,
      info: [[T('Сценарий'), T('М-39 транспорт тирбандлиги')], [T('Машғулот тури'), T('Индивидуал')], [T('Давомийлиги'), R.dur], [T('Вазият назоратга олинди'), R.end]],
      scores: [[T('Тайёргарлик'), band(R.m1)], [T('Қарорлар'), band(R.m2)], [T('Кетма-кетлик'), band(R.ordP)], [T('Қонунийлик'), band(R.legP)], [T('Тезкорлик'), band(R.spdP)]],
      grade: String(R.grade[0]), level: T(R.grade[1]).toUpperCase(), lose: R.grade[0] === 2 || !!D.crit, comments: cm,
      stamp1: T('ТЕЗКОР ШТАБ • ТАСДИҚЛАНДИ •'), stampSub1: T('МАРКАЗ'), stamp2: T('ТАКТИК ТРЕНАЖЁР • НАЗОРАТ •'), stampSub2: R.total + '%',
      signMark: 'M-39', reportNo: 'M39-' + stamp + '-' + R.grade[0],
      footer: [shield + T('ТЕЗКОР ШТАБ'), shield + T('ТАКТИК ТАЙЁРГАРЛИК'), shield + T('М-39 ТРЕНАЖЁРИ')],
      foot: T('Қайднома тренажёр томонидан автоматик яратилди. Ҳақиқийлиги машғулот журнали ва қайднома рақами орқали текширилади.')
    };
  }
  function certHtml(R) {
    if (!document.getElementById('rfCss')) { var st = document.createElement('style'); st.id = 'rfCss'; st.textContent = EXPORT.RF_CSS; document.head.appendChild(st); }
    return '<div class="rfwrap"><div class="rfscale" id="rfScale">' + EXPORT.formHtml(formData(R)) + '</div>' +
      '<div class="cbtns"><button class="btn white" id="cDocx">' + ICON('media') + 'Қайднома DOCX</button><button class="btn white" id="cPdf">' + ICON('media') + 'Қайднома PDF</button>' +
      '<button class="btn ghost" id="cFull">' + ICON('law') + 'ТЎЛИҚ ҲИСОБОТ</button><button class="btn" id="cAgain">ҚАЙТА БОШЛАШ</button></div></div>';
  }
  function fitForm() {
    var s = $('rfScale'); if (!s) return;
    var f = s.firstChild, k = Math.min(1, (window.innerWidth - 32) / 794, Math.max(0.55, (window.innerHeight - 110) / f.offsetHeight));
    f.style.transform = 'scale(' + k + ')'; f.style.transformOrigin = '0 0'; s.style.width = (794 * k) + 'px'; s.style.height = (f.offsetHeight * k) + 'px';
  }
  window.addEventListener('resize', fitForm);
  function renderCert() {
    var R = results(); $('certOv').innerHTML = certHtml(R); fitForm(); S3('setIdle', true);   // varaq ostida sahna statik
    $('cDocx').onclick = function () { EXPORT.formDocx(formData(R), fileName()); toast(T('Юклаб олинди')); };
    $('cPdf').onclick = function () { EXPORT.formPdf(formData(R), fileName()); };
    $('cFull').onclick = fullReport; $('cAgain').onclick = toStart;
    if (R.grade[0] >= 4 && !ST.m2.crit) { sfx('success'); window.AUD && setTimeout(function () { AUD.playFile('audio', 'yakun.mp3'); }, 900); }   // ғалаба: штаб диктори якуний матни
    else sfx('warn');
  }
  function certData(R) {
    var D = ST.m2;
    return { title: T('ТАКТИК ТАЙЁРГАРЛИК СЕРТИФИКАТИ'), course: T('М-39 транспорт тирбандлигини бартараф этиш'), who: ST.who, date: new Date().toLocaleDateString('ru-RU'), grade: R.grade[0], gradeT: T(R.grade[1]), pct: R.total, status: T(R.status),
      ind: [[T('1-модул (тайёргарлик)'), R.m1 + '%'], [T('2-модул (қарорлар)'), R.m2 + '%'], [T('Қарорлар кетма-кетлиги'), R.ordP + '%'], [T('Тўғри қарорлар'), R.okN + ' / ' + R.n], [T('Талофат'), String(D.inj)], [T('Вазият назоратга олинди'), R.end]],
      why: D.crit ? T(D.crit.o.out) + ' (' + D.crit.o.law.map(lawShort).join('; ') + ')' : '', img: ST.shot, sign: [T('Раҳбар'), T('Тингловчи')] };
  }
  function fullReport() {
    var D = ST.m2, M = ST.m1, R = results();
    $('certOv').innerHTML = '<div class="full ov-card"><div class="fh"><b>' + T('ТЎЛИҚ ҲИСОБОТ') + '</b><button class="btn ghost" id="fBack">' + ICON('cross') + '</button></div><div class="fb">' +
      '<div class="tl">1-МОДУЛ • ' + R.m1 + '%</div><div class="frow">' + P.zones.map(function (z) { var s = zStat(z, M.alloc[z[0]]); return '<span class="' + (s === 'ok' ? '' : 'bad') + '"><i>' + BA.byId(z[0]).key + '</i>' + ICON('users') + fmt(M.alloc[z[0]]) + '</span>'; }).join('') + '</div>' +
      '<div class="frow">' + P.means.filter(function (m) { return usedOf(m.id); }).map(function (m) { return '<span class="' + (m.ok ? '' : 'bad') + '" title="' + m.name + '">' + ICON(m.id) + usedOf(m.id) + '</span>'; }).join('') + '</div>' +
      '<div class="tl">2-МОДУЛ • ' + R.m2 + '% • ' + T('КЕТМА-КЕТЛИК') + ' ' + R.ordP + '%</div><div class="flog">' + D.log.map(function (l) {
        return '<div class="' + (l.k === 'opt' ? '' : 'bad') + '"><i>' + l.time + '</i>' + ICON(l.ic) + '<span><b>' + l.title + '</b>' + l.opt + (l.notes.length ? '<small>' + l.notes.join(' • ') + '</small>' : '') + '<small>' + (l.law.length ? l.law : l.best.law).map(lawShort).join('; ') + '</small></span>' + ICON(l.k === 'opt' ? 'check' : 'cross') + '</div>';
      }).join('') + '</div></div><div class="cbtns"><button class="btn white" id="fDocx">' + ICON('media') + 'Тўлиқ ҳисобот DOCX</button><button class="btn white" id="fPdf">' + ICON('media') + 'Тўлиқ ҳисобот PDF</button></div></div>';
    $('fBack').onclick = renderCert;
    $('fDocx').onclick = function () { EXPORT.docx(reportBlocks(), fileName() + '_tuliq'); toast(T('Юклаб олинди')); };
    $('fPdf').onclick = function () { EXPORT.pdf(reportBlocks(), fileName() + '_tuliq'); };
  }
  function fileName() { return 'M39_' + I18N.translit(ST.who).replace(/[^\wʻʼ\-]+/g, '_').slice(0, 40) + '_' + new Date().toISOString().slice(0, 10); }
  function reportBlocks() {
    var M = ST.m1, D = ST.m2, R = results(), dt = new Date(), b = [];
    b.push({ t: 'h1', text: T('М-39 ТРАНСПОРТ ТИРБАНДЛИГИ') }, { t: 'sub', text: T('Тактик тренажёр машғулоти — тўлиқ ҳисобот') });
    b.push({ t: 'kv', rows: [[T('Тингловчи'), ST.who], [T('Сана'), dt.toLocaleDateString('ru-RU') + ' ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })], [T('Баҳо'), R.grade[0] + ' (' + T(R.grade[1]) + ') • ' + R.total + '%'], [T('Ҳолат'), T(R.status)], [T('Қарорлар кетма-кетлиги'), R.ordP + '% (' + T('умумий баҳонинг 20 %') + ')']] });
    b.push({ t: 'h2', text: T('1-модул: кучлар ва воситалар') + ' — ' + R.m1 + '%' });
    b.push({ t: 'table', widths: [4200, 1700, 2000, 1700], rows: [[T('Локация'), T('Тақсимланди'), T('Меъёр'), T('Ҳолат')]].concat(P.zones.map(function (z) { var v = M.alloc[z[0]], s = zStat(z, v); return [T(BA.byId(z[0]).name), fmt(v), fmt(z[2]) + '–' + fmt(z[3]), T(s === 'ok' ? 'Меъёрда' : s === 'lo' ? 'Кам' : 'Ортиқча')]; })) });
    b.push({ t: 'table', widths: [4600, 3200, 1800], rows: [[T('Восита'), T('Жойлар'), T('Баҳо')]].concat(P.means.filter(function (m) { return usedOf(m.id); }).map(function (m) { return [T(m.name), Object.keys(M.means[m.id]).map(function (l) { return T(locName(l)) + ' — ' + M.means[m.id][l]; }).join('\n'), T(m.ok ? 'Рухсат этилган' : 'Қонунга зид')]; })) });
    b.push({ t: 'h2', text: T('2-модул: қарорлар') + ' — ' + R.m2 + '%' });
    b.push({ t: 'table', widths: [800, 1500, 1700, 3200, 2400], rows: [[T('Вақт'), T('Локация'), T('Вазият'), T('Қарор'), T('Қонун (lex.uz)')]].concat(D.log.map(function (l) {
      return [l.time, T(locName(l.loc)), T(l.title), (l.k === 'opt' ? '✓ ' : '✗ ') + T(l.opt) + (l.notes.length ? '\n' + l.notes.map(T).join('\n') : ''), (l.law.length ? l.law : l.best.law).map(function (x) { return T(LAW[x].t); }).join('\n')];
    })) });
    if (D.crit) b.push({ t: 'p', red: true, b: true, text: T('Критик хато') + ': ' + T(D.crit.o.t) + ' — ' + T(D.crit.o.out) });
    return b;
  }
  function toStart() {
    stopTimer(); ST.phase = 'start'; panel(''); $('metrics').classList.add('hide'); setClock(0); showWorkUI(false); overlay('certOv', false);
    overlay('start', true); S3('reset'); S3('clearMeans'); S3('highlightErrorZones', []); mapState([]); S3('cam.cine', false); S3('focusZone', 'all'); S3('setIdle', true);
    window.AUD && (AUD.ambientOff(), AUD.stopFile(), AUD.intro(false));
  }
  function showWorkUI(on) {
    $('toolBox').classList.toggle('hide', !on); $('info').classList.add('hide');
    $('locBar').classList.toggle('hide', !on); $('map2d').classList.toggle('hide', !on);
    $('m1ui').classList.toggle('hide', !(on && ST.phase === 'm1'));
    if (!on) { $('stage').classList.add('nocams'); $('stage').classList.remove('m1', 'dl', 'dr'); }
  }

  /* ---------------- пауза, овоз, тил ---------------- */
  function setPause(on) {
    if (ST.phase === 'start' || ST.paused === on) return;
    ST.paused = on; overlay('pauseOv', on); S3('setPaused', on);
    $('bPause').querySelector('.pa').classList.toggle('hide', on); $('bPause').querySelector('.pl').classList.toggle('hide', !on);
    if (on) { ST.pauseAt = Date.now(); window.AUD && AUD.ambientOff(); var v = $('vid'); if (!v.paused) v.pause(); }
    else { ST.pauseMs += Date.now() - ST.pauseAt; window.AUD && AUD.ambientOn(); if ($('vidOv').classList.contains('on') && $('vid').src) $('vid').play().catch(function () {}); }
  }
  function updSnd() { var m = window.AUD && AUD.muted; $('bSnd').querySelector('.wv').classList.toggle('hide', m); $('bSnd').querySelector('.mu').classList.toggle('hide', !m); $('bAmb').classList.toggle('off', !(window.AUD && AUD.ambient)); }
  $('bPause').onclick = function () { setPause(!ST.paused); };
  $('pauseOv').onclick = function () { setPause(false); };
  $('bSnd').onclick = function () { AUD.toggle(); updSnd(); };
  $('bAmb').onclick = function () { AUD.toggleAmbient(); updSnd(); };
  $('bLang').onclick = function () { I18N.toggle(); };
  // мавзу: стандарт (тонгги туман) → кундузги → тунги; 3D ёруғлик ҳам мос равишда ўзгаради
  var THEMES = ['default', 'day', 'night'], TH_N = { default: 'Стандарт', day: 'Кундузги', night: 'Тунги' };
  function setTheme(t) {
    if (THEMES.indexOf(t) < 0) t = 'default';
    document.documentElement.dataset.theme = t; try { localStorage.setItem('m39_theme', t); } catch (e) { /* хусусий режим */ }
    [].forEach.call(document.querySelectorAll('#bTheme .ti'), function (s) { s.classList.toggle('on', s.dataset.t === t); });
    $('thT').textContent = T(TH_N[t]); S3('setTimeOfDay', t === 'default' ? 'morning' : t);
  }
  $('bTheme').onclick = function () { var c = document.documentElement.dataset.theme || 'default'; setTheme(THEMES[(THEMES.indexOf(c) + 1) % 3]); sfx('click'); };
  function fs() { var d = document; if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || function () {}).call(d.documentElement); } else d.exitFullscreen(); }
  $('bFs').onclick = fs;
  I18N.onChange(function (l) {
    $('bLang').querySelector('b').style.color = l === 'cyr' ? 'var(--r2)' : ''; $('bLang').querySelector('span').style.color = l === 'lat' ? 'var(--r2)' : '';
    if (ST.phase === 'final' && $('certOv').querySelector('.cert')) renderCert();
  });

  /* ---------------- клавиатура (кўринмас) ---------------- */
  document.addEventListener('keydown', function (e) {
    var tg = document.activeElement && document.activeElement.tagName, k = e.key, code = e.code;
    if (tg === 'INPUT' || tg === 'TEXTAREA') { if (k === 'Enter' && document.activeElement.id === 'who') start(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === 'Escape') { if ($('camBig').classList.contains('on')) $('camBigX').click(); else if ($('pop')) popClose(); else if (ST.m1.pick) { ST.m1.pick = null; m1Refresh(); } else if (!$('info').classList.contains('hide')) $('info').classList.add('hide'); else if (ST.paused) setPause(false); return; }
    if (code === 'KeyP') { setPause(!ST.paused); e.preventDefault(); return; }
    if (code === 'KeyM') { $('bSnd').click(); return; }
    if (code === 'KeyL') { $('bLang').click(); return; }
    if ($('camTools').querySelector('[data-c=free]').classList.contains('on')) return;
    if (code === 'KeyF') { fs(); return; }
    if (ST.paused) return;
    if ((ST.phase === 'm1' || ST.phase === 'm2') && /^(Digit|Numpad)[0-6]$/.test(code)) { var n = +code.slice(-1); if (n === 0) { S3('cam.overview'); markLoc(null); } else pickLoc(BA.LOCS[n - 1].id); }
  });
  document.addEventListener('pointerdown', function () { window.AUD && AUD.unlock(); }, { once: true });

  /* =====================================================================
     ИШГА ТУШИРИШ
     ===================================================================== */
  // 3D моделлар юклангач, биринчи (оғир, шейдер тайёрлаш) чизиш бош экранда бажарилади —
  // кириш лавҳалари ва 1-модул бошида саҳна қотиб қолмасин
  function warm3D() {
    if (!has3D || ST.phase !== 'start') return;
    S3D.setIdle(false); S3D.focusZone('loc_log', { instant: true });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      S3D.focusZone('all', { instant: true });
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (ST.phase === 'start') S3D.setIdle(true); }); });
    }); });
  }
  function boot() {
    I18N.start();
    buildMap(); buildLocBar(); updSnd();
    var refImages = [
      'Gemini_Generated_Image_1m88e41m88e41m88.jpg',
      'Gemini_Generated_Image_17w7dp17w7dp17w7.jpg',
      'Gemini_Generated_Image_9zpaiw9zpaiw9zpa.jpg',
      'Gemini_Generated_Image_a0378ya0378ya037.jpg',
      'Gemini_Generated_Image_hledhfhledhfhled.jpg',
      'Gemini_Generated_Image_hccpl3hccpl3hccp.jpg',
      'Gemini_Generated_Image_wsh0vkwsh0vkwsh0.jpg'
    ];
    var refIndex = 0;
    var setStartScene = function () {
      var start = $('start');
      if (!start) return;
      start.style.backgroundImage = 'linear-gradient(90deg, rgba(4,7,12,.92) 0%, rgba(4,7,12,.58) 48%, rgba(4,7,12,.82) 100%), url("media/reference/' + refImages[refIndex] + '")';
      start.style.backgroundSize = 'cover';
      start.style.backgroundPosition = 'center';
      start.style.transition = 'background-image .8s ease';
      refIndex = (refIndex + 1) % refImages.length;
    };
    setStartScene();
    setInterval(setStartScene, 7000);
    try { has3D = !!window.S3D && S3D.init($('view3d')); } catch (e) { console.error(e); has3D = false; }
    if (!has3D) $('noGL').classList.remove('hide');
    else { S3D.onPick(function (id) { pickLoc(id, true); }); S3D.setIdle(true); }   // bosh ekranda fon statik (doim yangilanib turmaydi)
    buildTools(); buildCams(); showWorkUI(false);
    var th = 'default'; try { th = localStorage.getItem('m39_theme') || 'default'; } catch (e) { /* хусусий режим */ } setTheme(th);
    setInterval(camMarker, 150);
    // файл тўғридан-тўғри очилган бўлса (file://) — браузер моделлар ва видеоларни юкламайди
    if (location.protocol === 'file:') setTimeout(function () { toast(T('Юк машиналари моделлари ва видеолар учун ISHGA_TUSHIRISH.bat орқали очинг'), 9000); }, 1500);
    ASSETS.detect().then(function (L) {
      camVideosInit();
      if (has3D && (L.locations.length || L.units.length)) {
        var go = function () { S3D.loadModels(L).then(function (ok) { if (ok.length) { console.info('GLB:', ok); warm3D(); } }); };
        if (window.THREE && THREE.GLTFLoader) go();
        else if (L.js.indexOf('GLTFLoader.js') >= 0) { var s = document.createElement('script'); s.src = 'js/GLTFLoader.js'; s.onload = go; document.head.appendChild(s); }
      }
    });
    window._m39 = { state: function () { return ST; }, start: start, answer: answer, openSit: openSit, check: m1Check, norm: m1Norm, setZ: setZ, locClick: m1LocClick, openM1: openM1, openM2: openM2, finish: finish, results: results, report: reportBlocks, cert: certData };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

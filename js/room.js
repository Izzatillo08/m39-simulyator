/* =====================================================================
   М-39 • 2-ВЕРСИЯ: «ВАЗИЯТЛАР МАРКАЗИ» ХОНАСИ
   Ўйинчи — штаб бошлиғи. Ҳамма нарса хона девордаги экранларда кўрсатилади:
   • асосий катта экран — танланган локациянинг энг сўнгги ҳолати, кириш ва натижа саҳналари;
   • ўнг юқори экран — тактик харита (ёки «Умумий харита» режимида локация);
   • ўнг пастки чап экран — 3D саҳна (кичик, енгил). Босилса — катта 3D ойна очилади (харита асбоблари фақат шу ерда);
   • ўнг пастки ўнг экран — кузатув камералари навбати.
   Чап ёнда — вертикал локациялар рўйхати, тепасида «УМУМИЙ ХАРИТА».
   Хона фони ваҳима даражасига қараб алмашади (тинч / жиддий / ғазабли) — файллар бўлса.
   Барча экран бурчаклари расмдаги пиксел координаталарида (ROOM.cfg) — бошқа хона расми қўйилса, фақат шу рақамлар ўзгаради.
   ===================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // boshliq (o'yinchi) o'zi xonada turibdi — u ko'rinadigan natija sahnalari markaziy ekranga chiqmaydi
  // (shtabdagi boshliq, brifingdagi general, aynan shu boshqaruv xonasi)
  window.ROOM_SKIP = ['d01_ok', 'd01_xato', 'd02_ok', 'd07_ok'];
  var T = function (s) { return window.I18N ? I18N.T(s) : s; };

  /* ---------- хона расми ва экранлар (расм ўлчами 1600×893 px) ----------
     q: [чап-юқори, ўнг-юқори, чап-паст, ўнг-паст] — расмдаги экран бурчаклари */
  // xona rasmi: videos/room_base.jpg (Gemini, 2752×1536) — to'g'ri qaralgan devor, 5 ta ekran
  var CFG = {
    w: 2752, h: 1536, center: 1380,
    bg: { calm: ['room_calm.mp4', 'room_calm.jpg'], tense: ['room_tense.mp4', 'room_tense.jpg'], angry: ['room_angry.mp4', 'room_angry.jpg', 'room_tense.mp4', 'room_tense.jpg'], base: 'room_base.jpg' },   // g'azab rasmi bo'lmasa — jiddiy rasm + qizil signal
    screens: {
      main: { q: [[894, 322], [1867, 322], [894, 896], [1867, 896]], w: 1360, h: 802 },   // markaziy katta ekran
      s1:   { q: [[1914, 325], [2342, 325], [1914, 579], [2342, 579]], w: 800, h: 474 },  // o'ng yuqori — xarita
      s2:   { q: [[1915, 637], [2347, 637], [1915, 896], [2347, 896]], w: 640, h: 384 },  // o'ng pastki — 3D
      s3:   { q: [[413, 638], [845, 638], [413, 896], [845, 896]], w: 800, h: 478 },     // chap pastki — kameralar
      s4:   { q: [[417, 325], [846, 325], [417, 579], [846, 579]], w: 800, h: 474 }      // chap yuqori — lokatsiya
    },
    // олдинги план: бошлиқнинг боши ва елкалари (катта экран пастки қисми устида туради)
    // rahbar ishora qilganda: bosh + ko'tarilgan o'ng qo'l zonasi (rahbar_ratsiya.mp4 qatlami)
    // rahbar ratsiyada gapirganda: bosh + yuzi yonidagi ratsiya (rahbar_ratsiya.mp4 qatlami)
    // faqat ekranlar chizig'idan pastda (y ≥ 900): klipdagi bo'sh qora ekran asosiy ekran ustida dog' qoldirmasin
    chiefGesture: [[1160, 1536], [1165, 945], [1215, 912], [1300, 900], [1590, 900], [1600, 965], [1610, 1536]],
    chief: [[1181, 1536], [1183, 949], [1222, 919], [1307, 894], [1328, 881], [1324, 826], [1328, 764], [1355, 743], [1410, 743], [1438, 771], [1442, 826], [1431, 881], [1459, 901], [1534, 925], [1580, 963], [1582, 1536]]
  };
  // ҳар бир локациянинг бошланғич ҳолати (кейин натижалар билан янгиланади)
  var DEF = {
    loc_erkin: 'videos/intro_m39.mp4', loc_log: 'videos/d05_qisman.jpg', loc_airp_cargo: 'videos/intro_aeroport.mp4',
    loc_bypass: 'videos/intro_07.mp4', loc_fuel: 'videos/intro_yoqilgi.mp4', loc_hq: 'videos/d01_ok.mp4'
  };
  var CAMS = ['videos/cam_1.mp4', 'videos/cam_2.mp4', 'videos/intro_olomon.mp4', 'videos/intro_megafon.mp4', 'videos/cam_3.mp4', 'videos/cam_4.mp4'];
  var LAST = {}, MODE = 'general', CUR = null, MOOD = null, has = function (k, f) { return window.ASSETS && ASSETS.has(k, f); };

  /* ---------- квадратга проекция (CSS matrix3d) ---------- */
  function adj(m) { return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]]; }
  function mm(a, b) { var c = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) { var s = 0; for (var k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; } return c; }
  function mv(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function basis(p) { var m = [p[0], p[2], p[4], p[1], p[3], p[5], 1, 1, 1], v = mv(adj(m), [p[6], p[7], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); }
  function quad(w, h, q) {
    var t = mm(basis([q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]]), adj(basis([0, 0, w, 0, 0, h, w, h])));
    for (var i = 0; i < 9; i++) t[i] /= t[8];
    return 'matrix3d(' + [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(',') + ')';
  }

  /* ---------- қуриш ---------- */
  var room, S = {}, bgA, bgB, fg, big3d;
  function build() {
    var stage = $('stage');
    room = document.createElement('div'); room.id = 'room'; room.style.width = CFG.w + 'px'; room.style.height = CFG.h + 'px';
    room.innerHTML = '<div class="bg" id="rBg"></div><div class="glare"></div>';
    stage.insertBefore(room, stage.firstChild);
    Object.keys(CFG.screens).forEach(function (k) {
      var c = CFG.screens[k], e = document.createElement('div');
      e.className = 'scr'; e.id = 'scr_' + k; e.style.width = c.w + 'px'; e.style.height = c.h + 'px'; e.style.transform = quad(c.w, c.h, c.q);
      e.innerHTML = '<div class="media"></div><div class="hud"><i></i><span></span></div>';
      room.appendChild(e); S[k] = e;
    });
    fg = document.createElement('div'); fg.className = 'fg'; fg.style.clipPath = 'polygon(' + CFG.chief.map(function (p) { return p[0] + 'px ' + p[1] + 'px'; }).join(',') + ')';
    room.appendChild(fg);
    setBg(CFG.bg.base);

    // 3D — кичик экранга; босилса — катта ойна
    S.s2.appendChild($('view3d')); S.s2.classList.add('d3');
    S.s2.addEventListener('click', function () { open3d(true); });
    big3d = document.createElement('div'); big3d.id = 'big3d';
    big3d.innerHTML = '<div class="bh"><b>' + T('3D ВАЗИЯТ ХАРИТАСИ') + '</b><button class="btn ghost" id="b3x">' + T('Девор экранига қайтариш') + '</button></div><div class="bw" id="b3w"></div>';
    stage.appendChild(big3d); $('b3x').onclick = function () { open3d(false); };

    // intro odatdagidek to'liq ekranda o'ynaydi; boshqaruv xonasiga o'tilgach (ROOM.enter) natija sahnalari asosiy ekranda

    // харита — бошида асосий экранда («Умумий харита»)
    // локациялар — чапда вертикал, тепада «Умумий харита»
    var lb = $('locBar'), head = document.createElement('button');
    head.id = 'locAll'; head.innerHTML = '<span>' + T('УМУМИЙ ХАРИТА') + '</span>';
    head.onclick = function () { general(); window.AUD && AUD.sfx('click'); };
    lb.parentNode.insertBefore(head, lb); lb.classList.add('vert');
    general();
    fit(); window.addEventListener('resize', fit); if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
    setInterval(camCycle, 7000); camCycle(); hookAudio();
    liveBuild();
    var cw8 = 0, cwT = setInterval(function () { chiefInit(); if (CH.on || ++cw8 > 40) clearInterval(cwT); }, 300);
    if (window.S3D && S3D.lite) S3D.lite(true);   // 3D boshidan yengil rejimda (devordagi kichik ekran)
    // fayllar ro'yxati aniqlangach — tinch xona (jonli video bo'lsa, u) boshidanoq qo'yiladi
    var tries = 0, w8 = setInterval(function () { if (has('videos', 'room_base.jpg') || ++tries > 40) { clearInterval(w8); if (!MOOD) mood(0); } }, 250);
  }
  // хона саҳнага сиғади (бўш жойсиз, марказда)
  function fit() {
    var st = $('stage'), W = st.clientWidth, H = st.clientHeight; if (!W || !H) return;
    var k = Math.max(W / CFG.w, H / CFG.h);   // экранни тўлиқ қоплайди
    // devor ekranlari o'ng tomonda — tor oynada chap qism (xodimlar) kesiladi, ekranlar to'liq ko'rinadi
    // devor markazi ekranda markazda; chetlar (shisha devorlar) kesilishi mumkin
    var tx = Math.max(W - CFG.w * k, Math.min(0, W / 2 - CFG.center * k));
    st.classList.toggle('narrow', W < 1000);   // tor oynada lokatsiyalar faqat raqam bilan
    room.style.transform = 'translate(' + tx + 'px,' + ((H - CFG.h * k) / 2) + 'px) scale(' + k + ')';
  }

  /* ---------- экран мазмуни ---------- */
  function show(k, src, cap) {
    var m = S[k].querySelector('.media'), old = m.firstChild;
    if (old && old.dataset.src === src) { setCap(k, cap); return; }
    var el;
    if (!src) el = document.createElement('div');
    else if (/\.(mp4|webm)$/i.test(src)) { el = document.createElement('video'); el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.src = src; el.play().catch(function () {}); }
    else { el = document.createElement('div'); el.className = 'img'; el.style.backgroundImage = 'url("' + src + '")'; }
    el.dataset.src = src || '';
    m.innerHTML = ''; m.appendChild(el); setCap(k, cap);
  }
  function setCap(k, cap) { var h = S[k].querySelector('.hud span'); h.textContent = cap ? T(cap) : ''; S[k].querySelector('.hud').classList.toggle('on', !!cap); }
  function mapTo(k) {
    var mp = $('map2d'); if (mp.parentNode !== S[k]) S[k].appendChild(mp);
    S[k].classList.add('hasmap'); ['main', 's1'].forEach(function (o) { if (o !== k) S[o].classList.remove('hasmap'); });
  }
  function locMedia(id) { return LAST[id] || DEF[id]; }
  function name(id) { var L = window.BA && BA.byId(id); return L ? L.name : id; }
  // «Умумий харита»: харита катта экранда, ўнг юқорида — «Эркин»
  function general() {
    // hech narsa tanlanmagan: o'rtada sputnik xarita (shtab devoridagi kabi), taktik xarita o'ng yuqorida
    MODE = 'general'; CUR = null; mapTo('s1'); show('main', 'videos/xarita_sputnik.jpg', 'Умумий харита');
    show('s4', locMedia('loc_erkin'), name('loc_erkin'));
    $('locAll').classList.add('on');
  }
  // локация танланди: унинг энг сўнгги ҳолати катта экранда, харита ўнг юқорига кўчади
  function loc(id) {
    if (id === 'loc_hq') return general();
    MODE = 'loc'; CUR = id; mapTo('s1'); show('main', locMedia(id), name(id));
    var other = id === 'loc_erkin' ? 'loc_fuel' : 'loc_erkin'; show('s4', locMedia(other), name(other));
    $('locAll').classList.remove('on');
  }
  // ўнг пастки экран: камералар (умумий режимда — локациялар навбати)
  var ci = 0, GEN = ['loc_fuel', 'loc_airp_cargo', 'loc_bypass', 'loc_log'];
  function camCycle() {
    if (MODE === 'general') { var id = GEN[ci++ % GEN.length]; show('s3', locMedia(id), name(id)); }
    else {
      // fayl .mp4 yoki .jpg bo'lishi mumkin (masalan, cam_2 rasmga almashtirilgan) — bori olinadi
      var src = CAMS[ci++ % CAMS.length], b = src.replace(/^videos\//, '').replace(/\.\w+$/, '');
      var f = ['.mp4', '.jpg', '.webp'].map(function (e) { return b + e; }).filter(function (x) { return has('videos', x); })[0];
      if (f) show('s3', 'videos/' + f, 'Кузатув камераси');
    }
  }

  /* ---------- 3D катта ойна ---------- */
  function open3d(on) {
    var v = $('view3d');
    // katta oynada — to'liq sifat; devordagi kichik ekranda — yengil rejim
    if (on) { $('b3w').appendChild(v); big3d.classList.add('on'); $('stage').classList.add('big3d'); $('toolBox').classList.remove('hide'); window.S3D && S3D.lite && S3D.lite(false); }
    else { S.s2.appendChild(v); big3d.classList.remove('on'); $('stage').classList.remove('big3d'); $('toolBox').classList.add('hide'); window.S3D && S3D.lite && S3D.lite(true); }
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30);
  }

  /* ---------- хона кайфияти: ваҳима даражасига кўра ---------- */
  function firstHave(list) { for (var i = 0; i < list.length; i++) if (has('videos', list[i])) return list[i]; return null; }
  function setBg(file) {
    if (!file || (bgA && bgA.dataset.f === file)) return;
    var isV = /\.mp4$/i.test(file), mk = function () {
      var e = isV ? document.createElement('video') : document.createElement('div');
      if (isV) { e.src = 'videos/' + file; e.muted = true; e.loop = true; e.autoplay = true; e.playsInline = true; e.play().catch(function () {}); }
      else e.style.backgroundImage = 'url("videos/' + file + '")';
      e.className = 'layer'; e.dataset.f = file; return e;
    };
    var b = $('rBg'), n = mk(); n.classList.add('in'); b.appendChild(n);
    setTimeout(function () { if (bgA && bgA.parentNode) bgA.parentNode.removeChild(bgA); bgA = n; n.classList.remove('in'); }, 1200);
    // олдинги план (бошлиқ) ҳам шу файлдан
    fg.innerHTML = ''; var f2 = mk(); f2.classList.remove('in'); fg.appendChild(f2);
    if (isV && n.play) { n.currentTime = 0; f2.currentTime = 0; }
  }
  function mood(panic) {
    var m = panic >= 65 ? 'angry' : panic >= 40 ? 'tense' : 'calm';
    if (m === MOOD) return; MOOD = m;
    room.dataset.mood = m;
    // xona rasmi almashmaydi (boshliq qatlamlari bilan mos qolsin) — keskinlik yorug'lik va signal bilan beriladi
    setBg(firstHave(CFG.bg.calm) || CFG.bg.base);
  }

  /* ---------- rahbar ratsiya orqali buyruq beradi ----------
     videos/rahbar_ratsiya.mp4 — xona bilan bir xil kadr, rahbar ratsiyani ko'tarib gapiradi.
     Buyruq ovozi (audio/natija_NN.mp3) qancha davom etsa, klip shuncha o'ynaydi (kerak bo'lsa takrorlanadi);
     ovoz tugagach xona avvalgi holatiga qaytadi. Yangi buyruq tez berilsa — klip boshidan boshlanadi. */
  var RADIO = { on: false, a: null };
  function radioStart(audio) {
    if (CH.on && chiefFile('radio')) {
      function stop() {
        audio.removeEventListener('playing', start);
        audio.removeEventListener('ended', stop);
        audio.removeEventListener('pause', stop);
        audio.removeEventListener('error', stop);
        if (CH.radioAudio === audio) {
          CH.radioAudio = null;
          chiefPlay('idle');
        }
      }
      function start() {
        CH.radioAudio = audio;
        chiefPlay('radio');
        var v = CH.v;
        v.onloadedmetadata = function () {
          if (CH.radioAudio !== audio) return;
          var span = 4.6, duration = audio.duration;
          v.playbackRate = Number.isFinite(duration) && duration > 0 ? Math.min(3, Math.max(0.25, span / duration)) : 1;
          v.currentTime = Math.min(6.1, 1.5 + audio.currentTime * v.playbackRate);
        };
        v.ontimeupdate = function () { if (v.currentTime >= 6.1) v.pause(); };
      }
      audio.addEventListener('playing', start, { once: true });
      audio.addEventListener('ended', stop, { once: true });
      audio.addEventListener('pause', stop, { once: true });
      audio.addEventListener('error', stop, { once: true });
      return;
    }
    if (!has('videos', 'rahbar_ratsiya.mp4')) return;
    if (RADIO.a && RADIO.a !== audio) RADIO.a.removeEventListener('ended', radioStop);
    RADIO.a = audio; RADIO.on = true;
    var v = gestureVideo(); if (!v) return;
    v.loop = true; v.currentTime = 0; v.play().catch(function () {}); RADIO.layer.classList.add('on');
    audio.addEventListener('ended', radioStop); audio.addEventListener('pause', radioStop);
    window.AUD && AUD.sfx('radio');
  }
  function radioStop() {
    RADIO.on = false;
    if (RADIO.layer) { RADIO.layer.classList.remove('on'); var v = RADIO.v; setTimeout(function () { if (!RADIO.on && v) v.pause(); }, 500); }
  }
  // rahbar klipi uchun alohida qatlam: faqat rahbar va ko'tarilgan o'ng qo'li atrofi (qolgan xona jonli videoda qoladi)
  // ishora klipi ikki joyda: xona fonida (ekranlar ostida) va rahbar qatlamida (ekranlar ustida, bosh + qo'l chizig'i).
  // Shunda asosiy ekran mazmuni to'silmaydi, rahbarning ko'tarilgan qo'li esa ekran oldida ko'rinadi.
  function gestureVideo() {
    if (!has('videos', 'rahbar_ratsiya.mp4')) return null;
    if (!RADIO.layer) {
      var mk = function (host, cls, clip) {
        var L = document.createElement('div'); L.className = 'radioL ' + cls; if (clip) L.style.clipPath = clip;
        var v = document.createElement('video'); v.src = 'videos/rahbar_ratsiya.mp4'; v.muted = true; v.playsInline = true; v.preload = 'auto';
        L.appendChild(v); host.appendChild(L); return { L: L, v: v };
      };
      var poly = function (a) { return 'polygon(' + a.map(function (p) { return p[0] + 'px ' + p[1] + 'px'; }).join(',') + ')'; };
      var b = mk(room, 'rb', null), f = mk(room, 'rf', poly(CFG.chiefGesture));
      // fon qatlami ekranlar ostida, rahbar qatlami ekranlar ustida
      room.insertBefore(b.L, room.querySelector('.scr'));
      // ikki klip bir xil vaqtda yursin (fon klipi — asosiy soat)
      // tez-tez o'rash videoni qotiradi — faqat sezilarli farq bo'lsa va ko'pi bilan 1,5 s da bir marta tuzatiladi
      var lastSync = 0, sync = function () {
        var now = performance.now(); if (b.v.paused || now - lastSync < 1500) return;
        if (Math.abs(f.v.currentTime - b.v.currentTime) > 0.2) { f.v.currentTime = b.v.currentTime; lastSync = now; }
      };
      b.v.addEventListener('timeupdate', sync);
      RADIO.layer = { classList: { add: function (c) { b.L.classList.add(c); f.L.classList.add(c); }, remove: function (c) { b.L.classList.remove(c); f.L.classList.remove(c); } } };
      RADIO.v = { set loop(x) { b.v.loop = f.v.loop = x; }, set currentTime(t) { b.v.currentTime = f.v.currentTime = t; },
        play: function () { f.v.play().catch(function () {}); return b.v.play(); }, pause: function () { b.v.pause(); f.v.pause(); },
        set onended(fn) { b.v.onended = fn; } };
    }
    return RADIO.v;
  }
  // buyruq ovozlarini ushlab olish (ilova kodiga tegmasdan)
  function hookAudio() {
    if (!window.AUD || AUD._roomHook) return; AUD._roomHook = true;
    var orig = AUD.playFile;
    AUD.playFile = function (kind, file) {
      var r = orig.apply(AUD, arguments);
      if (kind === 'audio' && /^natija_\d+\.mp3$/.test(file)) { var a = AUD.current(); if (a) radioStart(a); }
      return r;
    };
  }

  /* ---------- иловадан келадиган ҳодисалар ---------- */
  /* ---------- JONLI XONA: signal chirog'i, ekran HUD, xabarlar lentasi, devor soati, kamera, fon ovozlari ---------- */
  var LIVE = { tick: null, msgs: [], ctx: null };
  var FEED = {
    calm: ['Навбатчи: «Эркин» постида ҳолат назоратда', 'ЙПХ: М-39 шимолий қаторида ҳаракат секинлашди', 'Логистика маркази: кириш йўли қисман очиқ',
      'Аэропорт: авиакеросин захираси назоратда', 'Шохобчалар: навбатлар ўртача', 'Тезкор гуруҳ: дрон кузатуви давом этмоқда', 'Штаб: ахборот хизмати брифингга тайёр'],
    tense: ['Навбатчи: «Эркин»да олломон кўпаймоқда', 'ЙПХ: айланма йўлда 3 км тирбандлик', 'Шохобча №4: навбатда жанжал', 'Аэропорт: захира 2 соатга етади',
      'Тезкор гуруҳ: ижтимоий тармоқларда ёлғон хабар тарқалмоқда', 'Тез ёрдам: 2 нафар ҳайдовчи ҳушдан кетган', 'Логистика: 40 та TIR тўхтаб қолди'],
    angry: ['ДИҚҚАТ! «Эркин» постида тўқнашув хавфи', 'ШОШИЛИНЧ: провокаторлар тўсиқни ёриб ўтишга уринмоқда', 'Шохобчалар: ёқилғи тугади, ҳайдовчилар норози',
      'Тез ёрдам: жабрланганлар сони ортмоқда', 'Вазирлик: вазият бўйича зудлик билан ахборот талаб қилинмоқда', 'ЙПХ: М-39 тўлиқ тўсилди']
  };
  function liveBuild() {
    // signal chirog'lari (shiftda) va qizil yorug'lik
    var bc = document.createElement('div'); bc.className = 'beacons';
    [[520, 70], [2230, 70]].forEach(function (p) { var b = document.createElement('i'); b.style.left = p[0] + 'px'; b.style.top = p[1] + 'px'; bc.appendChild(b); });
    room.appendChild(bc);
    // devor soati (asosiy ekran ustida)
    var ck = document.createElement('div'); ck.className = 'wclock'; ck.innerHTML = '<b id="wcT">07:30</b><small>' + T('ТОШКЕНТ') + '</small><em id="wcD"></em>'; room.appendChild(ck);
    // ekranlarda REC va vaqt
    Object.keys(S).forEach(function (k) { if (!S[k] || !S[k].classList || !S[k].classList.contains('scr')) return; var r = document.createElement('div'); r.className = 'rec'; r.innerHTML = '<i></i>REC <span></span>'; S[k].appendChild(r); });
    // xabarlar lentasi (asosiy ekran ostida)
    var tk = document.createElement('div'); tk.className = 'ticker'; tk.innerHTML = '<b>' + T('ТЕЗКОР ХАБАРЛАР') + '</b><div class="tw"><div class="tt" id="tkT"></div></div>'; S.main.appendChild(tk);
    room.classList.add('live');
    LIVE.tick = setInterval(liveTick, 1000); liveTick(); feedNext();
    setInterval(feedNext, 9000);
    setInterval(ambient, 6000);
  }
  function liveTick() {
    var c = document.getElementById('clock'), t = c ? c.textContent : '';
    var s = (new Date()).getSeconds(), ss = (s < 10 ? '0' : '') + s;
    var wt = document.getElementById('wcT'); if (wt) wt.textContent = t;
    var wd = document.getElementById('wcD'); if (wd) wd.textContent = '16.10.2026';
    [].forEach.call(room.querySelectorAll('.rec span'), function (e) { e.textContent = t + ':' + ss; });
  }
  function feedNext() {
    var pool = FEED[MOOD || 'calm']; var m = pool[Math.floor(Math.random() * pool.length)];
    LIVE.msgs.unshift(T(m)); LIVE.msgs = LIVE.msgs.slice(0, 4);
    var e = document.getElementById('tkT'); if (!e) return;
    e.innerHTML = LIVE.msgs.map(function (x, i) { return '<span' + (i ? '' : ' class="nw"') + '>' + x + '</span>'; }).join('<i>•</i>');
    e.style.animation = 'none'; void e.offsetWidth; e.style.animation = '';
  }
  // fon ovozlari: telefon jiringlashi, klaviatura, uzoq ratsiya — juda past ovozda
  function actx() { if (LIVE.ctx) return LIVE.ctx; var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; LIVE.ctx = new A(); return LIVE.ctx; }
  function beep(f, t0, d, v, type) { var c = actx(); if (!c) return; var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, c.currentTime + t0); g.gain.linearRampToValueAtTime(v, c.currentTime + t0 + 0.01); g.gain.setValueAtTime(v, c.currentTime + t0 + Math.max(0.012, d - 0.02)); g.gain.linearRampToValueAtTime(0, c.currentTime + t0 + d); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + d + 0.05); }
  function ambient() {
    if (!window.AUD || AUD.muted || document.hidden) return; var c = actx(); if (!c) return; if (c.state === 'suspended') c.resume().catch(function () {});
    var r = Math.random(), k = MOOD === 'angry' ? 1.6 : MOOD === 'tense' ? 1.2 : 1;
    if (r < 0.18 * k) { for (var i = 0; i < 2; i++) { beep(440, i * 0.5, 0.35, 0.012, 'square'); beep(480, i * 0.5, 0.35, 0.012, 'square'); } }   // telefon
    else if (r < 0.55) { for (var j = 0; j < 7 + Math.random() * 8; j++) beep(1800 + Math.random() * 900, j * (0.07 + Math.random() * 0.08), 0.015, 0.008, 'square'); }   // klaviatura
    else if (r < 0.75 * k) { AUD.sfx && AUD.sfx('radio', 0.25); }   // uzoqdagi ratsiya
  }
  var _mood0 = mood;
  mood = function (panic) {
    var prev = MOOD; _mood0(panic);
    if (MOOD === 'angry' && prev !== 'angry') { window.AUD && AUD.sfx('alarm', 0.8); feedNext(); }
    if (room) room.classList.toggle('alarm', MOOD === 'angry');
  };

  /* ---------- BOSHLIQ — ALOHIDA QATLAM (kliplar mavjud bo'lsa) ----------
     videos/chief_plate.jpg  — boshliqsiz xona (xona rasmi bilan bir xil kadr)
     videos/chief_<holat>.webm — shaffof fonli (alpha) kliplar: idle (doimiy), radio, point, nod, slam, turn
     Fayllar bo'lmasa — eski usul (rasm ichidagi boshliq + ratsiya klipi) ishlayveradi. */
  var CH = { on: false, cur: null, v: null, box: [-420, 0, 2752, 1536], busy: false };
  function chiefFile(n) { var f = 'chief_' + n + '.webm'; return has('videos', f) ? 'videos/' + f : null; }
  function chiefInit() {
    if (CH.on || !has('videos', 'chief_plate.jpg') || !chiefFile('idle')) return;
    CH.on = true; room.classList.add('chiefL');
    var pl = document.createElement('div'); pl.className = 'chPlate'; pl.style.backgroundImage = 'url("videos/chief_plate.jpg")';
    // Fon rasmi eski siluetni yopadi, devor ekranlari esa yuqorida qoladi.
    pl.style.clipPath = 'inset(715px 1090px 0 1120px)';
    room.appendChild(pl);
    var host = document.createElement('div'); host.className = 'chief';
    host.style.left = CH.box[0] + 'px'; host.style.top = CH.box[1] + 'px'; host.style.width = CH.box[2] + 'px'; host.style.height = CH.box[3] + 'px';
    room.appendChild(host);
    // ikki qatlam (A/B): yangi klip yashirin qatlamda tayyor bo'lgach ustma-ust silliq almashadi — uzilish va miltillash yo'q
    CH.vs = [0, 1].map(function () { var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.className = 'chv'; host.appendChild(v); return v; });
    CH.front = 0; CH.url = {};
    // kliplar oldindan xotiraga yuklanadi (almashishda tarmoq kutilmaydi)
    ['idle', 'radio', 'point', 'turn', 'nod', 'slam'].forEach(function (n) {
      var f = chiefFile(n); if (!f) return;
      fetch(f).then(function (r) { return r.blob(); }).then(function (b) { CH.url[n] = URL.createObjectURL(b); }).catch(function () {});
    });
    CH.vs.forEach(function (v) {
      v.addEventListener('timeupdate', function () {
        // harakat klipi tugashiga 0,4 s qolganda — jim turishga silliq qaytish (ratsiya ovozi davomida emas)
        if (v !== CH.vs[CH.front] || v.loop || CH.cur === 'idle' || CH.radioAudio || CH.leaving) return;
        if (v.duration && v.duration - v.currentTime < 0.4) { CH.leaving = true; chiefPlay('idle'); }
      });
    });
    chiefPlay('idle');
  }
  function chiefPlay(n, loopFor) {
    if (!CH.on) return false; var f = CH.url[n] || chiefFile(n); if (!f) return false;
    if (CH.radioAudio && n !== 'radio') return false;
    clearTimeout(CH.t);
    if (n === 'idle' && CH.cur === 'idle') return true;
    var back = CH.vs[1 - CH.front], front = CH.vs[CH.front], tok = (CH.tok || 0) + 1; CH.tok = tok;
    CH.cur = n; CH.busy = n !== 'idle'; CH.leaving = false;
    back.onloadedmetadata = back.ontimeupdate = null; back.playbackRate = 1;
    back.loop = !!loopFor; back.style.transition = 'none'; back.style.opacity = '0';
    CH.v = back;   // ratsiya sinxronizatsiyasi shu (kelayotgan) qatlam bilan ishlaydi
    var swapped = false, swap = function () {
      if (tok !== CH.tok || swapped) return; swapped = true;
      back.removeEventListener('playing', swap); back.removeEventListener('loadeddata', swap);
      back.style.transition = front.style.transition = 'opacity .35s ease';
      back.style.zIndex = 2; front.style.zIndex = 1; back.style.opacity = '1';
      setTimeout(function () { if (tok !== CH.tok) return; front.style.opacity = '0'; front.pause(); }, 360);
      CH.front = 1 - CH.front;
    };
    back.addEventListener(n === 'idle' ? 'loadeddata' : 'playing', swap);
    back.src = f;
    if (n !== 'idle') back.play().catch(function () { swap(); });
    else { try { back.currentTime = 0; } catch (e) { /* yuklanmoqda */ } }
    if (loopFor) CH.t = setTimeout(function () { chiefPlay('idle'); }, loopFor);
    return true;
  }
  window.ROOM = {
    cfg: CFG, chief: function (n, ms) { return chiefPlay(n, ms); }, loc: loc, general: general, mood: mood, open3d: open3d,
    enter: function () { var vo = $('vidOv'); if (vo.parentNode !== S.main) S.main.appendChild(vo); },
    leave: function () { var vo = $('vidOv'); if (vo.parentNode !== document.body) document.body.appendChild(vo); },
    // қарор натижаси: шу локациянинг «энг сўнгги ҳолати» янгиланади
    result: function (locId, src) { if (!src) return; LAST[locId] = src; if (MODE === 'loc' && CUR === locId) show('main', src, name(locId)); if (MODE === 'general' && locId === 'loc_erkin') show('s1', src, name(locId)); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

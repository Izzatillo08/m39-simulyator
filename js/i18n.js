/* =====================================================================
   Икки тилли тизим: Ўзбек (Кирилл) <-> O'zbek (Lotin)
   Барча матнлар манбада кирилл ёзувида сақланади. Lotin режимида
   саҳифадаги ҳар бир матн тугуни ва атрибут (title, placeholder,
   aria-label) жонли транслитерация қилинади; янги қўшилган тугунлар
   MutationObserver орқали дарҳол ўгирилади — қайта юклаш керак эмас.
   ===================================================================== */
(function () {
  'use strict';
  var O = 'ʻ', A = 'ʼ'; // oʻ gʻ ва ъ (ʼ)
  var MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ц': 's', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': A, 'ы': 'i', 'ь': '', 'э': 'e',
    'ю': 'yu', 'я': 'ya', 'ў': 'o' + O, 'қ': 'q', 'ғ': 'g' + O, 'ҳ': 'h'
  };
  var CYR = /[Ѐ-ӿ]/;
  var VOW = 'аеёиоуэюяўАЕЁИОУЭЮЯЎ';
  function isUp(c) { return c && c !== c.toLowerCase(); }
  function isLetter(c) { return !!c && (CYR.test(c) || /[A-Za-z]/.test(c)); }

  function translit(s) {
    if (!s || !CYR.test(s)) return s;
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i], lc = c.toLowerCase(), prev = s[i - 1], next = s[i + 1];
      var r;
      if (lc === 'е') {
        // сўз бошида, унлидан, ъ/ь дан кейин — "ye"
        r = (!isLetter(prev) || VOW.indexOf(prev) >= 0 || prev === 'ъ' || prev === 'ь' || prev === 'Ъ' || prev === 'Ь') ? 'ye' : 'e';
      } else if (lc === 'ц') {
        // унлидан кейин — "ts" (эвакуация → evakuatsiya), сўз бошида ва ундошдан кейин — "s"
        r = VOW.indexOf(prev) >= 0 ? 'ts' : 's';
      } else if (MAP.hasOwnProperty(lc)) r = MAP[lc];
      else { out += c; continue; }
      if (isUp(c) && r.length) {
        // бутун сўз бош ҳарфда бўлса — ҳаммаси катта (SH), акс ҳолда фақат биринчиси (Sh)
        var allUp = (isUp(next) && isLetter(next)) || (isUp(prev) && isLetter(prev) && !isLetter(next));
        r = allUp ? r.toUpperCase() : r.charAt(0).toUpperCase() + r.slice(1);
      }
      out += r;
    }
    return out;
  }

  var lang = 'cyr';
  try { var sv = localStorage.getItem('m39_lang'); if (sv === 'lat' || sv === 'cyr') lang = sv; } catch (e) { /* хусусий режим */ }

  var SRC = new WeakMap();      // матн тугуни -> {src, out}
  var ATTRS = ['title', 'placeholder', 'aria-label', 'data-tip'];
  var busy = false;

  function T(s) { return lang === 'lat' ? translit(s) : s; }

  function doText(node) {
    var rec = SRC.get(node), d = node.data;
    if (lang === 'lat') {
      if (rec && d === rec.out) return;
      if (!CYR.test(d)) return;
      var o = translit(d); SRC.set(node, { src: d, out: o }); node.data = o;
    } else if (rec) {
      if (d === rec.out) node.data = rec.src;
      SRC.delete(node);
    }
  }
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i]; if (!el.hasAttribute(a)) continue;
      var key = 'data-src-' + a, v = el.getAttribute(a);
      if (lang === 'lat') {
        if (CYR.test(v)) { el.setAttribute(key, v); el.setAttribute(a, translit(v)); }
      } else if (el.hasAttribute(key)) {
        el.setAttribute(a, el.getAttribute(key)); el.removeAttribute(key);
      }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    if (root.hasAttribute && root.hasAttribute('data-noi18n')) return;
    doAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) {
          if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.hasAttribute('data-noi18n')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(doText);
    var els = root.querySelectorAll('[' + ATTRS.join('],[') + ']');
    for (var i = 0; i < els.length; i++) doAttrs(els[i]);
  }

  var mo = new MutationObserver(function (muts) {
    if (busy || lang !== 'lat') return;
    busy = true;
    try {
      muts.forEach(function (m) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') { if (ATTRS.indexOf(m.attributeName) >= 0 && m.target.nodeType === 1) doAttrs(m.target); }
        else m.addedNodes.forEach(walk);
      });
    } finally { busy = false; mo.takeRecords(); }
  });

  var listeners = [];
  function setLang(l) {
    if (l !== 'lat' && l !== 'cyr') return;
    lang = l;
    try { localStorage.setItem('m39_lang', l); } catch (e) { /* хусусий режим */ }
    busy = true; try { walk(document.body); } finally { busy = false; mo.takeRecords(); }
    document.documentElement.lang = l === 'lat' ? 'uz-Latn' : 'uz-Cyrl';
    document.title = T('М-39 транспорт тирбандлиги');
    listeners.forEach(function (f) { try { f(l); } catch (e) { console.error(e); } });
  }
  function start() {
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    setLang(lang);
  }

  window.I18N = {
    T: T, translit: translit, setLang: setLang, start: start,
    get lang() { return lang; },
    onChange: function (f) { listeners.push(f); },
    toggle: function () { setLang(lang === 'lat' ? 'cyr' : 'lat'); }
  };
})();

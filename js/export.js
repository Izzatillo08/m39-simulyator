/* =====================================================================
   ҲИСОБОТ ЭКСПОРТИ (оффлайн): DOCX ва PDF
   • DOCX — WordprocessingML + ўз ZIP ёзувчимиз (сиқилмаган, CRC32)
   • PDF  — A4 босма саҳифаси (браузернинг «PDF сифатида сақлаш»)
   Кирилл ва лотин ҳарфлари учун Times New Roman / Arial шрифтлари.
   Кириш: blocks = [{t:'h1'|'h2'|'p'|'kv'|'table'|'list', ...}]
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- ZIP (store) ---------------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  var enc = new TextEncoder();
  function zip(files) {
    var parts = [], central = [], off = 0;
    var d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (s, a) { return s + a.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  /* ---------------- DOCX ---------------- */
  function x(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function run(text, o) {
    o = o || {};
    var rp = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' + (o.b ? '<w:b/>' : '') + (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + '<w:sz w:val="' + (o.sz || 24) + '"/></w:rPr>';
    return String(text).split('\n').map(function (ln, i) { return (i ? '<w:r>' + rp + '<w:br/></w:r>' : '') + '<w:r>' + rp + '<w:t xml:space="preserve">' + x(ln) + '</w:t></w:r>'; }).join('');
  }
  function para(text, o) {
    o = o || {};
    return '<w:p><w:pPr>' + (o.center ? '<w:jc w:val="center"/>' : '<w:jc w:val="both"/>') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 120 : o.after) + '"/></w:pPr>' + (o.runs || run(text, o)) + '</w:p>';
  }
  function cell(text, w, head) {
    return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (head ? '<w:shd w:val="clear" w:color="auto" w:fill="E6E6E6"/>' : '') + '</w:tcPr>' +
      '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>' + run(text, { sz: 20, b: head }) + '</w:p></w:tc>';
  }
  function table(rows, widths) {
    var tot = widths.reduce(function (a, b) { return a + b; }, 0);
    var b = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="808080"/>'; }).join('') + '</w:tblBorders>';
    return '<w:tbl><w:tblPr><w:tblW w:w="' + tot + '" w:type="dxa"/>' + b + '<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>' + widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>' +
      rows.map(function (r, i) { return '<w:tr>' + r.map(function (c, j) { return cell(c, widths[j], i === 0); }).join('') + '</w:tr>'; }).join('') + '</w:tbl>' + para('', { after: 60 });
  }
  function docxXml(blocks) {
    var body = blocks.map(function (b) {
      switch (b.t) {
        case 'h1': return para(b.text, { b: true, sz: 30, center: true, after: 80 });
        case 'sub': return para(b.text, { sz: 22, center: true, after: 240 });
        case 'h2': return para(b.text, { b: true, sz: 26, before: 200, after: 100 });
        case 'p': return para(b.text, { b: b.b, color: b.red ? 'B00000' : null });
        case 'kv': return b.rows.map(function (r) { return para('', { after: 40, runs: run(r[0] + ': ', { b: true }) + run(r[1]) }); }).join('');
        case 'list': return b.items.map(function (it, i) { return para((b.num ? (i + 1) + '. ' : '— ') + it, { after: 60 }); }).join('');
        case 'table': return table(b.rows, b.widths || b.rows[0].map(function () { return Math.floor(9600 / b.rows[0].length); }));
        default: return '';
      }
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
  }
  function docx(blocks, fileName) {
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/document.xml', data: docxXml(blocks) }
    ];
    save(zip(files), fileName + '.docx');
  }
  function save(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  }

  /* ---------------- PDF (A4 босма) ---------------- */
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function html(blocks, title) {
    var body = blocks.map(function (b) {
      switch (b.t) {
        case 'h1': return '<h1>' + h(b.text) + '</h1>';
        case 'sub': return '<div class="sub">' + h(b.text) + '</div>';
        case 'h2': return '<h2>' + h(b.text) + '</h2>';
        case 'p': return '<p class="' + (b.red ? 'red' : '') + (b.b ? ' b' : '') + '">' + h(b.text).replace(/\n/g, '<br>') + '</p>';
        case 'kv': return '<table class="kv">' + b.rows.map(function (r) { return '<tr><th>' + h(r[0]) + '</th><td>' + h(r[1]) + '</td></tr>'; }).join('') + '</table>';
        case 'list': return (b.num ? '<ol>' : '<ul>') + b.items.map(function (i) { return '<li>' + h(i) + '</li>'; }).join('') + (b.num ? '</ol>' : '</ul>');
        case 'table': return '<table class="t">' + b.rows.map(function (r, i) { return '<tr>' + r.map(function (c) { return (i ? '<td>' : '<th>') + h(c).replace(/\n/g, '<br>') + (i ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</table>';
        default: return '';
      }
    }).join('');
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + h(title) + '</title><style>' +
      '@page{size:A4;margin:18mm 15mm 18mm 22mm}body{font:11pt/1.45 "Times New Roman",Times,serif;color:#000}' +
      'h1{font-size:15pt;text-align:center;margin:0 0 4pt}.sub{text-align:center;font-size:11pt;margin-bottom:14pt}h2{font-size:12.5pt;margin:14pt 0 6pt;border-bottom:1px solid #000;padding-bottom:2pt}' +
      'p{margin:0 0 6pt;text-align:justify}p.red{color:#a00000}p.b{font-weight:bold}table{width:100%;border-collapse:collapse;margin:4pt 0 8pt;page-break-inside:auto}tr{page-break-inside:avoid}' +
      '.t th,.t td{border:1px solid #555;padding:3pt 4pt;font-size:9.5pt;vertical-align:top;text-align:left}.t th{background:#e6e6e6}' +
      '.kv th{text-align:left;width:38%;padding:2pt 6pt 2pt 0;font-weight:bold;vertical-align:top}.kv td{padding:2pt 0}ul,ol{margin:0 0 6pt 18pt}li{margin-bottom:3pt}' +
      '</style></head><body>' + body + '</body></html>';
  }
  function pdf(blocks, fileName) {
    var f = document.getElementById('printFrame');
    if (f) f.remove();
    f = document.createElement('iframe'); f.id = 'printFrame'; f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html(blocks, fileName)); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { console.error(e); } }, 350);
  }

  /* ---------------- СЕРТИФИКАТ (CEFR / IELTS услубида — 1 саҳифа) ---------------- */
  function b64bytes(dataUrl) { var b = atob(dataUrl.split(',')[1]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function certDocx(d, fileName) {
    var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    var red = 'C81E1E', body = '';
    body += para('', { center: true, after: 0, runs: run(d.title, { b: true, sz: 34, color: red }) });
    body += para(d.course, { center: true, sz: 24, after: 280 });
    body += para('', { center: true, after: 0, runs: run(d.who, { b: true, sz: 40 }) });
    body += para(d.status, { center: true, b: true, sz: 24, color: d.grade === 2 ? red : null, after: 200 });
    body += para('', { center: true, after: 0, runs: run(String(d.grade), { b: true, sz: 120, color: d.grade === 2 ? red : '111111' }) });
    body += para(d.gradeT.toUpperCase() + ' • ' + d.pct + '%', { center: true, b: true, sz: 26, after: 200 });
    if (d.img) {
      var cx = 5400000, cy = 3037500;
      body += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="1" name="shot"/>' +
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="shot.jpeg"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    }
    body += table(d.ind.map(function (r) { return [r[0], r[1]]; }), [5200, 3200]).replace(/w:fill="E6E6E6"/, 'w:fill="FFFFFF"');
    if (d.why) body += para(d.why, { color: red, sz: 22, after: 160 });
    body += para('', { after: 0, runs: run(d.sign[0] + ': ____________________          ' + d.sign[1] + ': ____________________', { sz: 22 }) });
    body += para(d.date, { center: true, sz: 20, before: 200 });
    var border = '<w:pgBorders w:offsetFrom="page">' + ['top', 'left', 'bottom', 'right'].map(function (s) { return '<w:' + s + ' w:val="double" w:sz="18" w:space="24" w:color="' + red + '"/>'; }).join('') + '</w:pgBorders>';
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + '><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/>' + border + '</w:sectPr></w:body></w:document>';
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/_rels/document.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + (d.img ? '<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/shot.jpeg"/>' : '') + '</Relationships>' },
      { name: 'word/document.xml', data: doc }
    ];
    if (d.img) files.push({ name: 'word/media/shot.jpeg', data: b64bytes(d.img) });
    save(zip(files), fileName + '_sertifikat.docx');
  }
  function certPdf(d, fileName) {
    var lose = d.grade === 2;
    var page = '<!doctype html><html><head><meta charset="utf-8"><title>' + h(fileName) + '</title><style>' +
      '@page{size:A4 landscape;margin:10mm}body{margin:0;font:12pt/1.4 Arial,Helvetica,sans-serif;color:#090A0D}' +
      '.c{border:5px double #C81E1E;padding:12mm 14mm;height:170mm;box-sizing:border-box;display:grid;grid-template-columns:1.25fr 1fr;gap:10mm}' +
      '.t{font-size:10pt;letter-spacing:.18em;font-weight:700;color:#C81E1E}.co{font-size:19pt;font-weight:900;margin:2mm 0 8mm}' +
      '.l small{display:block;font-size:9pt;letter-spacing:.16em;color:#6E7380;font-weight:700}.l h1{font-size:26pt;margin:1mm 0 3mm}' +
      '.st{display:inline-block;padding:2mm 4mm;border:2px solid ' + (lose ? '#C81E1E;color:#C81E1E' : '#090A0D') + ';font-weight:900;letter-spacing:.1em;font-size:11pt}' +
      '.ind{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:7mm}.ind div{border:1px solid #c9ccd3;padding:3mm}.ind small{display:block;font-size:8.5pt;color:#6E7380;font-weight:700}.ind b{font-size:15pt}' +
      '.g{border:4px solid ' + (lose ? '#C81E1E' : '#090A0D') + ';width:58mm;height:58mm;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center}.g b{font-size:76pt;line-height:1;color:' + (lose ? '#C81E1E' : '#090A0D') + '}.g small{font-weight:900;letter-spacing:.16em}' +
      '.p{text-align:center;font-size:16pt;font-weight:900;margin:3mm 0 5mm}.img{width:100%;border:1px solid #999}.why{color:#C81E1E;margin-top:5mm;font-size:10.5pt}' +
      '.sg{margin-top:8mm;font-size:10pt;display:flex;justify-content:space-between}.dt{text-align:right;font-size:10pt;color:#6E7380}' +
      '</style></head><body><div class="c"><div class="l"><div class="t">' + h(d.title) + '</div><div class="co">' + h(d.course) + '</div><small>' + h(d.sign[1]).toUpperCase() + '</small><h1>' + h(d.who) + '</h1><span class="st">' + h(d.status) + '</span>' +
      '<div class="ind">' + d.ind.map(function (r) { return '<div><small>' + h(r[0]) + '</small><b>' + h(r[1]) + '</b></div>'; }).join('') + '</div>' + (d.why ? '<div class="why">' + h(d.why) + '</div>' : '') +
      '<div class="sg"><span>' + h(d.sign[0]) + ': ______________</span><span>' + h(d.sign[1]) + ': ______________</span></div></div>' +
      '<div><div class="dt">' + h(d.date) + '</div><div class="g"><b>' + d.grade + '</b><small>' + h(d.gradeT).toUpperCase() + '</small></div><div class="p">' + d.pct + '%</div>' + (d.img ? '<img class="img" src="' + d.img + '">' : '') + '</div></div></body></html>';
    var f = document.getElementById('printFrame'); if (f) f.remove();
    f = document.createElement('iframe'); f.id = 'printFrame'; f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f); var doc = f.contentWindow.document; doc.open(); doc.write(page); doc.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { console.error(e); } }, 500);
  }

  /* ---------------- НАТИЖАЛАР ҚАЙДНОМАСИ (халқаро тест ҳисоботи услубида, ўз дизайнимиз) ----------------
     d: {brand, title, kind, note, centre, date, cand, who, id, photo, info:[[k,v]..], scores:[[name,band]..], grade, gradeT, level,
         comments:[..], reportNo, signLbl, footer:[..], lose} */
  var RF_CSS =
    '.rf{width:794px;min-height:1123px;box-sizing:border-box;padding:30px 34px 22px;color:#111;font:11px/1.35 Arial,Helvetica,sans-serif;position:relative;' +
    'background-color:#eef5ec;background-image:repeating-radial-gradient(circle at 18% 30%,rgba(60,120,70,.07) 0 1px,transparent 1px 7px),repeating-radial-gradient(circle at 82% 70%,rgba(40,90,120,.06) 0 1px,transparent 1px 9px);border:1px solid #b9c9b6}' +
    '.rf *{box-sizing:border-box}.rf .top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}' +
    '.rf .brand{display:flex;align-items:center;gap:10px}.rf .lg{width:46px;height:52px}.rf .bn b{display:block;font:900 30px/1 Arial;letter-spacing:.02em}.rf .bn small{font-size:10px;letter-spacing:.2em;font-weight:700;color:#444}' +
    '.rf .kind{border:1px solid #333;background:#fff;padding:5px 14px;font-weight:700;letter-spacing:.12em;min-width:200px;text-align:center}' +
    '.rf h1{font:700 17px Arial;margin:10px 0 4px}.rf .note{font-size:8.5px;color:#333;border-bottom:1px solid #8a9a88;padding-bottom:6px;margin-bottom:10px}.rf .note b{font-size:9px}' +
    '.rf .row{display:flex;align-items:center;gap:8px;margin:6px 0}.rf .lb{font-size:10px;font-weight:700;color:#222;white-space:nowrap}' +
    '.rf .bx{background:#fff;border:1px solid #9aa79a;padding:4px 8px;min-height:22px;font-size:11px}.rf .bx.dk{background:#1b1f27;color:#fff;font-weight:700}' +
    '.rf .sec{border-top:2px solid #6e8a6c;margin-top:12px;padding-top:6px}.rf .sec>b{display:block;font-size:12.5px;margin-bottom:6px}' +
    '.rf .cd{display:grid;grid-template-columns:1fr 150px;gap:14px}.rf .cd .row .lb{width:120px}.rf .cd .row .bx{flex:1}' +
    '.rf .ph{width:150px;height:170px;border:1px solid #9aa79a;background:#dfe6dd center/cover no-repeat;display:flex;align-items:flex-end;justify-content:center;font-size:8px;color:#444;padding:4px}' +
    '.rf .grid2{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}.rf .grid2 .lb{width:120px}.rf .grid2 .bx{flex:1}' +
    '.rf .res{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px 14px}.rf .sc{display:flex;flex-direction:column;align-items:center;gap:3px}.rf .sc .lb{font-size:9.5px}' +
    '.rf .sc .bx{width:54px;text-align:center;font-weight:700;font-size:13px}.rf .sc.big .bx{width:64px;height:40px;font-size:22px;display:flex;align-items:center;justify-content:center}' +
    '.rf .sc.big .bx.lose{background:#9b1414}.rf .cm{display:grid;grid-template-columns:1fr 130px 130px;gap:12px;margin-top:10px}' +
    '.rf .cbx{background:#fff;border:1px solid #9aa79a;min-height:118px;padding:6px 8px;font-size:9.5px}.rf .cbx div{margin-bottom:3px}' +
    '.rf .stp{border:1px solid #9aa79a;background:#fff;min-height:118px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:9px;font-weight:700}' +
    '.rf .stp svg{width:92px;height:92px}.rf .bot{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:12px;align-items:end}' +
    '.rf .sig{border-bottom:1px solid #333;height:34px;position:relative}.rf .sig i{position:absolute;left:30px;bottom:2px;font:italic 22px "Brush Script MT","Segoe Script",cursive;color:#1b2b6b}' +
    '.rf .ft{display:flex;justify-content:space-around;align-items:center;margin-top:16px;padding-top:8px;border-top:1px solid #8a9a88;font-weight:900;font-size:13px;letter-spacing:.04em}' +
    '.rf .ft span{display:flex;align-items:center;gap:6px}.rf .ft svg{width:20px;height:20px}.rf .fn{font-size:8px;text-align:center;color:#333;margin-top:6px}';
  var LOGO = '<svg class="lg" viewBox="0 0 40 46"><path d="M20 1l18 6v14c0 11-8 20-18 24C10 41 2 32 2 21V7z" fill="#9b1414"/><path d="M20 6l13 4.5v10.5c0 8.5-6 15.5-13 18.5-7-3-13-10-13-18.5V10.5z" fill="#fff"/><text x="20" y="28" text-anchor="middle" font-family="Arial" font-weight="900" font-size="12" fill="#9b1414">М39</text></svg>';
  function stamp(t1, t2, col) {
    return '<svg viewBox="0 0 100 100"><defs><path id="sc' + t2.length + '" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0"/></defs>' +
      '<circle cx="50" cy="50" r="46" fill="none" stroke="' + col + '" stroke-width="2.5"/><circle cx="50" cy="50" r="29" fill="none" stroke="' + col + '" stroke-width="1.5"/>' +
      '<text font-family="Arial" font-size="9" font-weight="700" fill="' + col + '" letter-spacing="1"><textPath href="#sc' + t2.length + '">' + h(t1) + '</textPath></text>' +
      '<text x="50" y="47" text-anchor="middle" font-family="Arial" font-weight="900" font-size="13" fill="' + col + '">М-39</text><text x="50" y="60" text-anchor="middle" font-family="Arial" font-weight="700" font-size="7" fill="' + col + '">' + h(t2) + '</text></svg>';
  }
  function formHtml(d) {
    var row = function (k, v, cls) { return '<div class="row"><span class="lb">' + h(k) + '</span><div class="bx ' + (cls || '') + '">' + h(v) + '</div></div>'; };
    return '<div class="rf">' +
      '<div class="top"><div class="brand">' + LOGO + '<div class="bn"><b>' + h(d.brand) + '</b><small>' + h(d.brandSub) + '</small></div></div><div class="kind">' + h(d.kind) + '</div></div>' +
      '<h1>' + h(d.title) + '</h1><div class="note"><b>' + h(d.noteLbl) + '</b> ' + h(d.note) + '</div>' +
      '<div class="row" style="justify-content:space-between">' + row(d.L.centre, d.centre, 'dk') + row(d.L.date, d.date) + row(d.L.cand, d.cand, 'dk') + '</div>' +
      '<div class="sec"><b>' + h(d.L.details) + '</b><div class="cd"><div>' + row(d.L.who, d.who) + row(d.L.rank, d.rank || '—') + row(d.L.id, d.id, 'dk') + '</div>' +
      '<div class="ph" style="' + (d.photo ? 'background-image:url(' + d.photo + ')' : '') + '">' + (d.photo ? '' : h(d.L.photo)) + '</div></div>' +
      '<div class="grid2" style="margin-top:6px">' + d.info.map(function (r) { return row(r[0], r[1]); }).join('') + '</div></div>' +
      '<div class="sec"><b>' + h(d.L.results) + '</b><div class="res">' + d.scores.map(function (s) { return '<div class="sc"><span class="lb">' + h(s[0]) + '</span><div class="bx">' + h(s[1]) + '</div></div>'; }).join('') +
      '<div class="sc big"><span class="lb">' + h(d.L.overall) + '</span><div class="bx dk' + (d.lose ? ' lose' : '') + '">' + h(d.grade) + '</div></div>' +
      '<div class="sc big"><span class="lb">' + h(d.L.level) + '</span><div class="bx dk' + (d.lose ? ' lose' : '') + '" style="width:auto;padding:0 10px;font-size:14px">' + h(d.level) + '</div></div></div>' +
      '<div class="cm"><div><span class="lb">' + h(d.L.comments) + '</span><div class="cbx">' + d.comments.map(function (c) { return '<div>• ' + h(c) + '</div>'; }).join('') + '</div></div>' +
      '<div><span class="lb">' + h(d.L.stamp1) + '</span><div class="stp">' + stamp(d.stamp1, d.stampSub1, '#1d4f8a') + '</div></div>' +
      '<div><span class="lb">' + h(d.L.stamp2) + '</span><div class="stp">' + stamp(d.stamp2, d.stampSub2, d.lose ? '#9b1414' : '#2e6b3f') + '</div></div></div></div>' +
      '<div class="bot"><div><span class="lb">' + h(d.L.sign) + '</span><div class="sig"><i>' + h(d.signMark || '') + '</i></div>' + row(d.L.date, d.date) + '</div>' +
      '<div>' + row(d.L.reportNo, d.reportNo, 'dk') + '</div></div>' +
      '<div class="ft">' + d.footer.map(function (f) { return '<span>' + f + '</span>'; }).join('') + '</div><div class="fn">' + h(d.foot) + '</div></div>';
  }
  function formPdf(d, fileName) {
    var page = '<!doctype html><html><head><meta charset="utf-8"><title>' + h(fileName) + '</title><style>@page{size:A4 portrait;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' + RF_CSS + '.rf{border:0}</style></head><body>' + formHtml(d) + '</body></html>';
    var f = document.getElementById('printFrame'); if (f) f.remove();
    f = document.createElement('iframe'); f.id = 'printFrame'; f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f); var doc = f.contentWindow.document; doc.open(); doc.write(page); doc.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { console.error(e); } }, 500);
  }
  // DOCX: шу тузилма жадваллар билан (Word'да таҳрирланадиган)
  function formDocx(d, fileName) {
    var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    var red = '9B1414', body = '';
    var tc = function (txt, w, o) {
      o = o || {};
      return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (o.span ? '<w:gridSpan w:val="' + o.span + '"/>' : '') + (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : '') + '<w:vAlign w:val="center"/></w:tcPr>' +
        '<w:p><w:pPr><w:spacing w:after="0"/>' + (o.center ? '<w:jc w:val="center"/>' : '') + '</w:pPr>' + (o.runs || run(txt, { sz: o.sz || 18, b: o.b, color: o.color })) + '</w:p></w:tc>';
    };
    var tbl = function (rows, widths, noBorder) {
      var tot = widths.reduce(function (a, b) { return a + b; }, 0);
      var bd = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="' + (noBorder ? 'nil' : 'single') + '" w:sz="4" w:space="0" w:color="9AA79A"/>'; }).join('') + '</w:tblBorders>';
      return '<w:tbl><w:tblPr><w:tblW w:w="' + tot + '" w:type="dxa"/>' + bd + '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>' + rows.join('') + '</w:tbl>' + para('', { after: 80 });
    };
    var LB = 'EEF5EC', DK = '1B1F27';
    body += tbl(['<w:tr>' + tc('', 7200, { runs: run(d.brand, { b: true, sz: 40 }) + run('   ' + d.brandSub, { sz: 16 }) }) + tc(d.kind, 2400, { center: true, b: true }) + '</w:tr>'], [7200, 2400], false);
    body += para('', { after: 40, runs: run(d.title, { b: true, sz: 28 }) });
    body += para('', { after: 120, runs: run(d.noteLbl + ' ', { b: true, sz: 15 }) + run(d.note, { sz: 15 }) });
    body += tbl(['<w:tr>' + tc(d.L.centre, 1500, { fill: LB, b: true }) + tc(d.centre, 1700, { fill: DK, color: 'FFFFFF', b: true }) + tc(d.L.date, 1100, { fill: LB, b: true }) + tc(d.date, 1700) + tc(d.L.cand, 1700, { fill: LB, b: true }) + tc(d.cand, 1900, { fill: DK, color: 'FFFFFF', b: true }) + '</w:tr>'], [1500, 1700, 1100, 1700, 1700, 1900]);
    body += para('', { after: 60, runs: run(d.L.details, { b: true, sz: 24 }) });
    var img = '';
    if (d.photo) {
      var cx = 1650000, cy = 1870000;
      img = '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="1" name="photo"/>' +
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="shot.jpeg"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="rIdImg"/><a:srcRect l="22000" r="22000"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    }
    var det = [[d.L.who, d.who], [d.L.rank, d.rank || '—'], [d.L.id, d.id]].concat(d.info);
    body += tbl(det.map(function (r, i) { return '<w:tr>' + tc(r[0], 2400, { fill: LB, b: true }) + tc(r[1], 4800) + (i === 0 ? '<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:vMerge w:val="restart"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr>' + img + '</w:p></w:tc>' : '<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:vMerge/></w:tcPr><w:p/></w:tc>') + '</w:tr>'; }), [2400, 4800, 2400]);
    body += para('', { after: 60, runs: run(d.L.results, { b: true, sz: 24 }) });
    var heads = d.scores.map(function (s) { return s[0]; }).concat([d.L.overall, d.L.level]), vals = d.scores.map(function (s) { return s[1]; }).concat([String(d.grade), d.level]);
    var w = Math.floor(9600 / heads.length), ws = heads.map(function () { return w; });
    body += tbl(['<w:tr>' + heads.map(function (x) { return tc(x, w, { fill: LB, b: true, center: true, sz: 16 }); }).join('') + '</w:tr>',
      '<w:tr>' + vals.map(function (x, i) { var big = i >= d.scores.length; return tc(x, w, { center: true, b: true, sz: big ? 34 : 26, fill: big ? (d.lose ? red : DK) : null, color: big ? 'FFFFFF' : null }); }).join('') + '</w:tr>'], ws);
    body += tbl(['<w:tr>' + tc(d.L.comments, 6400, { fill: LB, b: true }) + tc(d.L.stamp1 + ' / ' + d.L.stamp2, 3200, { fill: LB, b: true, center: true }) + '</w:tr>',
      '<w:tr>' + tc('', 6400, { runs: d.comments.map(function (c, i) { return (i ? '<w:r><w:br/></w:r>' : '') + run('• ' + c, { sz: 17 }); }).join('') }) + tc('', 3200, { center: true, runs: run(d.stamp1, { b: true, sz: 18, color: '1D4F8A' }) + '<w:r><w:br/></w:r>' + run(d.stamp2, { b: true, sz: 18, color: d.lose ? red : '2E6B3F' }) }) + '</w:tr>'], [6400, 3200]);
    body += tbl(['<w:tr>' + tc(d.L.sign, 2200, { fill: LB, b: true }) + tc('______________________', 2600) + tc(d.L.reportNo, 2200, { fill: LB, b: true }) + tc(d.reportNo, 2600, { fill: DK, color: 'FFFFFF', b: true }) + '</w:tr>'], [2200, 2600, 2200, 2600]);
    body += para(d.foot, { center: true, sz: 15, before: 120 });
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + '><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="1000" w:bottom="850" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/><w:pgBorders w:offsetFrom="page"><w:top w:val="single" w:sz="12" w:space="20" w:color="6E8A6C"/><w:left w:val="single" w:sz="12" w:space="20" w:color="6E8A6C"/><w:bottom w:val="single" w:sz="12" w:space="20" w:color="6E8A6C"/><w:right w:val="single" w:sz="12" w:space="20" w:color="6E8A6C"/></w:pgBorders></w:sectPr></w:body></w:document>';
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/_rels/document.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + (d.photo ? '<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/shot.jpeg"/>' : '') + '</Relationships>' },
      { name: 'word/document.xml', data: doc }
    ];
    if (d.photo) files.push({ name: 'word/media/shot.jpeg', data: b64bytes(d.photo) });
    save(zip(files), fileName + '_qaydnoma.docx');
  }

  window.EXPORT = { docx: docx, pdf: pdf, html: html, certDocx: certDocx, certPdf: certPdf, formHtml: formHtml, formPdf: formPdf, formDocx: formDocx, RF_CSS: RF_CSS, _zip: zip };
})();

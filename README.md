# «M-39 transport blokadasi» — 3D taktik trenajyor (3-tahrir)

## Ishga tushirish
**Eng oson:** zipni papkaga to'liq chiqaring (zip ichidan to'g'ridan-to'g'ri ochmang) va **`ISHGA_TUSHIRISH.bat`** ni ikki marta bosing — server ishga tushadi va brauzer o'zi ochiladi. Kichraytirilgan PowerShell oynasini yopmang.

`index.html` ni to'g'ridan-to'g'ri ochsangiz ham ishlaydi, lekin brauzer xavfsizlik sababli yuk mashinalari modellari va videolarni yuklamaydi.

Qo'lda:
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8780
```
So'ng `http://localhost:8780/`. (Python bo'lsa: `python -m http.server 8780`.)

## 1-modul: tayyor A / B / C rejalar
«Xodimlar» va «Vositalar» panellarining tepasida uchtadan tayyor reja bor — bir bosishda butun taqsimot to'ldiriladi. Har mashg'ulotda bittasi to'g'ri (me'yor bo'yicha), ikkitasi xatoli, harflar tasodifiy almashadi:
- xodimlar: me'yor bo'yicha / deyarli hammasi «Erkin»ga / hamma joyga teng;
- vositalar: qonuniy va yetarli / qonunga zid vositalar qo'shilgan, ayrimlari jalb etilmagan / noto'g'ri joy yoki yetarli emas.
Rejani tanlagach, qo'lda tuzatish mumkin. Tanlangan rejalar `ST.m1.planLog` da saqlanadi.

## Oqim
Kirish (F.I.Sh. + «Simulyatsiyani boshlash») → bitta kirish videosi `videos/intro.mp4` (bo'lmasa «Video kutilmoqda» + 3D kino fon) → 1-modul → 2-modul → «Natija hisoblanmoqda» → sertifikat (2–5 baho, DOCX / PDF) → «To'liq hisobot» tugmasi.

## 3D (OpenStreetMap + effektlar)
- «Erkin» atrofidagi haqiqiy binolar (≈7 300), yo'llar, chorraha rampalari, dalalar, bog'lar, o'rmon — `js/atrof_osm.js` (© OpenStreetMap hissadorlari, ODbL). Qayta yaratish: `tools/osm2js.ps1`.
- Nol nuqta — haqiqiy post (OSM: «Erkin savdo markazi» yonida, 41.22913, 69.15059); M-39 va Toshkent halqa yo'li (D001) chizig'i OSM bo'yicha, chorraha postdan ≈1,8 km shimoli-sharqda.
- Effektlar (`js/fx/`, three.js r128): nur yog'dusi (bloom), gamma, FXAA; tungi rejimda oy nuri va chiroqlar.
- 3D modellar: `Modellar_qollanma.md` (`js/GLTFLoader.js` bor, fayllar `models/units/` ga). Yuk mashinalari: `fura_1…4.glb` (navbat, aralash) va `fura_hero_1…2.glb` (oldingi qatorlar), teksturalari bilan; manbalar — `models/LITSENZIYA.txt`.

## Transport, odamlar va ovozlar (GLB + audio)
Fayllar nomi bo'yicha avtomatik ulanadi (`models/units/`):
- `yxxb.glb`, `yxxb_2.glb` — patrul mashinalari (shtab, «Erkin» kordoni, aylanma yo'llar, aeroport); navbat bilan almashadi.
- `suv_purkagich.glb`, `evakuator.glb`, `tez_yordam.glb`, `avtobus.glb`/`avtobus_2.glb`, `dron.glb` — vositalar va effektlar (suv sepish, evakuatsiya, tez yordam yo'lagi, avtobus, dronlar).
- `xodim.glb` — huquq-tartibot xodimlari (4 200 ta). Kameraga yaqin 900 tagachasi batafsil model, qolganlari oddiy shaklda (LOD).
- `traktor_1.glb` — fermer traktorlari: yaqin 50 tagachasi batafsil, qolganlari oddiy shaklda.
- Har bir model yuklanganda markazlanadi, yerga qo'yiladi va haqiqiy uzunlikka keltiriladi; mayoqchalar (migalka) model tomiga o'rnatiladi.

Diktor va polkovnik ovozlari (`audio/`):
- `intro.mp3` — kirish (video bo'lmasa ijro etiladi); `yakun.mp3` — g'alaba (baho 4–5, kritik xatosiz).
- `q_01…q_10` — vaziyat axboroti.
- `natija_01…10` — buyruqlar (hammasi ElevenLabs tarixidan matni bo'yicha tekshirilgan).
- `ogoh/crit_gas`, `crit_gun`, `crit_block`, `crit_comm`, `fail_panic`, `fail_metrics` — kritik xato ovozlari.

Video va rasmlar (`videos/`):
- Kirish — `intro_01…11` ketma-ketligi (`.mp4` video + `.jpg` sekin yaqinlashib/uzoqlashib harakatlanadigan rasm), ustidan diktor `intro.mp3`; videolarning o'z ovozi pastroq eshitiladi.
- Natija sahnalari — `dNN_ok|qisman|xato` `.mp4` yoki `.jpg`; buyruq ovozi (`natija_NN`) sahna bilan birga eshitiladi. Hozir: d01–d05 (rasmlar), d09_ok (video).
- Kuzatuv displeylari — `cam_1…4.mp4`.

## Qo'shimcha imkoniyatlar
- Kirish: «Erkin» → provokatorlar → olomon → yoqilg'i shoxobchasi → aeroport → shtab lavhalari; diktor ovozi tugashi bilan 1-modulga o'tiladi.
- 1-modul: **«2-модулга ўтиш»** tugmasi — to'g'ri (me'yoriy) taqsimotni qo'llab, darhol 2-modulga o'tkazadi.
- 2-modul: vahima o'sishi 40 % ga yengillashtirilgan (`SIM.panicK`); lokatsiya (xarita, 3D yoki panel) bosilsa — vazifalar chiqadi va muammo ovozda aytiladi (`audio/lok/`);
  xato/qisman qarorda — xato izohi (`audio/xato_NN.mp3`); 25 s qaror bo'lmasa — ogohlantirish (`audio/ogoh/kut_1|2.mp3`). Barcha 18 ta ovoz qo'yilgan (matnlar: `Qolgan_ovozlar.md`).
- Taktik xarita doim ochiq.
- `ISHGA_TUSHIRISH.bat`: 8780 band bo'lsa keyingi bo'sh portni tanlaydi va brauzerni aynan shu versiya bilan ochadi.

## Tezlik va barqarorlik
- Qurilma kuchi avtomatik aniqlanadi: 0 — kuchsiz (telefon), 1 — o'rta (integrallashgan GPU), 2 — kuchli. Daraja bo'yicha piksel zichligi, soyalar, effektlar, kadr tezligi (24/30/60), batafsil modellar soni va og'ir modellarni yuklash tanlanadi.
- FPS uzoq vaqt past bo'lsa — daraja o'zi pasayadi. Qo'lda: konsolda `S3D.quality(0)` / `1` / `2` (eslab qoladi).
- Bosh ekran, video va natija varag'i ostida 3D sahna to'xtatiladi — fon yangilanib turmaydi, qurilma yuklanmaydi.
- WebGL konteksti yo'qolsa (drayver), sahifa qotib qolmay tiklanadi.
Yetishmagan fayl o'rniga ratsiya signali chalinadi; faylni shu nom bilan qo'ysangiz, dastur o'zi ishlatadi.

Effekt ovozlari (`audio/`): `sfx_radio` — ratsiya, `sfx_tirbandlik` — kirish foni va fondagi signallar, `sfx_alarm` — kritik xato sirenasi, `sfx_qalqon` — bufer (qalqonlar), `sfx_dron` — dronlar, `sfx_suv` — suv sepuvchi. Fayl bo'lmasa — Web Audio sintezi.

## 3D (Google Maps bo'yicha, eski izoh)
- «Erkin» posti haqiqiy joyda: 41.2374, 69.1642. M-39 janubi-g'arbdan shimoli-sharqqa ≈45° diagonal; 700 m shahar tomonda Toshkent aylanma yo'li bilan ikki katta halqali chorraha.
- Atrofda: «Erkin» savdo majmuasi, quyosh panelli omborlar, zich mahalla (≈1 500 uy), daraxtlar.
- 1 800 fura/sisterna/traktor — 8 yo'lakda asosan o'z yo'nalishi bo'yicha navbatda, ayrimlari qiyshiq, oldingi qatorlar betartib.
- Odamlar batafsil (oyoq, qo'l, bosh, kepka/dubulg'a/niqob, jilet chiziqlari); uzoqdan soddalashtirilgan model (60 FPS).
- Yonayotgan shinalar sahnasi olib tashlangan.

## Rejimlar
Tepa paneldagi tugma: **Standart** (tonggi tuman) → **Kunduzgi** (yorug' interfeys, ochiq kun) → **Tungi** (to'q ko'k interfeys, chiroqlar va migalkalar). Tanlov eslab qolinadi.

## 1-modul (namuna bo'yicha)
Markazda 3D xarita, chap va o'ng chetda «Xodimlar» va «Vositalar» tugmalari.
- Lokatsiya bosilsa — xodimlar soni uchun 3 variant.
- Vosita bosilsa — vaziyatga qarab 2–3 tayyor joylashtirish varianti (biri to'g'ri, qolganlari noto'g'ri joy yoki yetarli emas; qonunga zid vositalarda ikkalasi ham xato).
- 16 vosita bitta ro'yxatda (9 to'g'ri, 7 noto'g'ri), belgi yo'q.
- Vaziyatlar markaziga xodim ajratilmaydi (boshqaruv punkti); 4 200 xodim 5 lokatsiyaga taqsimlanadi.
- Haydovchilar va provokatorlar aralash turadi; «Bufer zona» qarorida ikki tomonga ajratiladi.

## 2-modul
10 savol, har lokatsiyada 1–2 ta, har savolda 2 variant (`scenario_m39.js → Q`). Hujjatdagi 11 qaror: 1, 3, 5, 7, 8, 9, 10, 11 — to'g'ri variantlar; 2 (gaz), 4 (o'q), 6 (beton blok) — kritik xato variantlar (darhol mag'lubiyat).
Qoidalar: «Barham» rejasi yoqilmasdan harakat → jarima; bufer zonasiz muzokara → muzokara buziladi.

## Baho
5 — 86–100% (kritik xato va talofat yo'q) • 4 — 71–85% • 3 — 55–70% • 2 — 55% dan past yoki kritik xato. Umumiy = 1-modul × 0,3 + 2-modul × 0,7.
Sertifikat (DOCX/PDF): ism, sana, baho, foiz, 4 ko'rsatkich, 3D sahna surati, imzo joylari.

## Media fayllar (avtomatik aniqlanadi)
| Fayl | Qayerda |
|---|---|
| `videos/intro.mp4` | Kirish videosi (3 kadr bitta videoda; MP4, H.264+AAC, 1920×1080, ~60–90 s, matn videoning o'zida). Bo'lmasa — «Видео кутилмоқда» + «Давом этиш» → 1-modul |
| `videos/dNN_ok.mp4` / `dNN_xato.mp4` (bo'lmasa `dNN.mp4`) | NN-savolda to'g'ri / xato javobdan keyin — promtlar: `Video_promptlar.md` |
| `videos/cam_1.mp4 … cam_4.mp4`, `cam_N_qNN.mp4` | Pastki 4 kuzatuv displeyi |
| `audio/q_01.mp3 … q_10.mp3`, `audio/natija_01.mp3 …` | Savol va natija ovozi |

Savol raqamlari: 1 hq_plan, 2 hq_info, 3 erk_buffer, 4 erk_negot, 5 log_water, 6 log_drones, 7 byp_exits, 8 byp_green, 9 air_kero, 10 fuel_conv.

## Tasdiqlanishi kerak
`PREP.zones` me'yorlari, vosita zaxiralari va to'g'ri joylari hujjatda yo'q — o'quv qiymatlari.

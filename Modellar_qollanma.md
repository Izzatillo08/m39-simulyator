# 3D modellar bo'yicha qadam-baqadam qo'llanma (2-band)

Dastur modellarni **o'zi topadi va ulaydi**: faylni to'g'ri nom bilan `models/units/` ga qo'yib, `serve.ps1` orqali ochsangiz bas. Yuklanganda ekranda «Уч ўлчамли моделлар юкланди: …» xabari chiqadi. Model bo'lmasa, hozirgi dasturiy shakllar ishlayveradi.

---

## 1-qadam. Qaysi modellar kerak (muhimlik tartibida)

| № | Fayl nomi | Nima | O'lcham (m) | Poligon chegarasi | Sahnada |
|---|---|---|---|---|---|
| 1 | `fura_1.glb`, `fura_2.glb`, … | Yuk mashinalari — **har xil rusum** (oddiy navbat) | haqiqiy o'lchamda (4–22 m) | **≤ 20 000** | ≈1 260 ta, aralash |
| 1a | `fura_hero_1.glb`, `fura_hero_2.glb`, … | Batafsil tyagachlar — faqat **oldingi qatorlar** | haqiqiy o'lchamda | ≤ 150 000 | ≈16 ta |
| 2 | `haydovchi.glb` | Erkak, sariq nur qaytaruvchi jilet | bo'yi ≈1,75 | **≤ 1 500** | 3 000 nusxa |
| 3 | `provokator.glb` | Qora kiyim, qora niqob (balaklava) | bo'yi ≈1,75 | **≤ 1 500** | 1 500 nusxa |
| 4 | `xodim.glb`, `xodim_2.glb` … | Militsiya / Milliy gvardiya — **teksturali**, kameraga yaqin 900 tagachasi | bo'yi ≈1,78 | **≤ 2 000** | 4 200 nusxa |
| 5 | `sisterna.glb` | Yoqilg'i sisternasi | uzunligi ≈15 | ≤ 8 000 | 240 nusxa |
| 6 | `traktor_1.glb`, `traktor_2.glb` … | Fermer traktori — **teksturali**, yaqin 50 tagachasi | uzunligi ≈5 | ≤ 25 000 | 300 nusxa |
| 7 | `yxxb.glb`, `yxxb_2.glb` … | YPX patrul mashinasi (variantlar navbat bilan almashadi) | uzunligi ≈4,9 | ≤ 20 000 | bir nechta |
| 8 | `suv_purkagich.glb` | Suv sepuvchi mashina | ≈9,5 | ≤ 20 000 | bir nechta |
| 9 | `evakuator.glb` | Og'ir evakuator | ≈10 | ≤ 20 000 | bir nechta |
| 10 | `fvv.glb` | O't o'chirish mashinasi | ≈9,5 | ≤ 20 000 | bir nechta |
| 11 | `tez_yordam.glb` | Tez yordam | ≈5,6 | ≤ 20 000 | bir nechta |
| 12 | `avtobus.glb` | Evakuatsiya avtobusi | ≈12 | ≤ 20 000 | bir nechta |
| 13 | `dron.glb` | Kvadrokopter | ≈1 | ≤ 5 000 | bir nechta |

**Nega poligon chegarasi muhim:** 1–6-modellar minglab nusxada chiziladi. Masalan, 4 200 xodim × 1 500 poligon = 6,3 mln. Bundan og'ir bo'lsa, sahna sekinlashadi. Uzoqdan ko'rinishda odamlar uchun dastur baribir soddalashtirilgan shaklni ishlatadi.

**Yuk mashinalari (`fura_N` / `fura_hero_N`)** — **teksturalari bilan** to'liq ko'rinadi. Har bir model navbatga tasodifiy, ketma-ket takrorlanmaydigan qilib taqsimlanadi, shuning uchun hammasi bir xil bo'lib qolmaydi. Qancha ko'p model qo'ysangiz, shuncha xilma-xil bo'ladi. Teksturasiz kuzov materiali nomida `body`, `paint` yoki `cab` so'zi bo'lsa, dastur shu modelning yana 2–3 ta rangli (ko'k, qizil, yashil, sariq) variantini o'zi yasaydi. Kabina qaysi tomonda ekanini dastur o'zi aniqlaydi; teskari chiqsa, `js/blokada3d.js` dagi `FURA_FLIP` ga `fura_2: 1` kabi yozing. Eski `fura.glb` nomi ham ishlaydi (bitta model, faqat ranglar).

**Ranglar:** 2–6-modellarda teksturalar (rasmlar) ishlatilmaydi — faqat **material ranglari** olinadi. Shuning uchun har bir qismga alohida rangli material bering: kabina, tirkama, g'ildirak, oyna, jilet, shim, teri va hokazo. 7–13-modellar to'liq (teksturalari bilan) ko'rinadi.

---

## 2-qadam. Modelni qayerdan olish

**A) Tayyor bepul modellar** (eng tez yo'l):
- **Sketchfab** (sketchfab.com) — qidiruvga `truck low poly`, `semi truck`, `police officer low poly`, `riot police`, `crowd man low poly` yozing → **Downloadable** filtrini yoqing → litsenziya **CC0** yoki **CC-BY** → yuklashda **glTF / GLB** formatini tanlang.
- **Poly Pizza** (poly.pizza), **Quaternius** (quaternius.com), **Kenney** (kenney.nl) — CC0 (bepul, mualliflikni ko'rsatish shart emas) past poligonli transport va odamlar.
- **CC-BY** model olsangiz, muallif va havolani `models/LITSENZIYA.txt` fayliga yozib qo'ying — bu litsenziya talabi.

**B) Blender'da o'zingiz yasash** — eng aniq natija (O'zbekiston formasi, «Erkin» posti va hokazo). 3-qadamdagi talablarga rioya qiling.

> Diqqat: o'yinlardan (GTA va boshqalar) model olish — mualliflik huquqini buzish. Faqat litsenziyasi ochiq modellardan foydalaning.

---

## 3-qadam. Blender'da tayyorlash (Blender 3.x / 4.x)

1. **File → Import** orqali modelni oching (glTF, FBX yoki OBJ).
2. **O'lcham:** N panel → Item → Dimensions. Furaning uzunligi ≈16,5 m, odamning bo'yi ≈1,75 m bo'lsin. Aslida dastur o'lchamni o'zi moslaydi, lekin nisbatlar to'g'ri bo'lishi kerak.
3. **Yo'nalish:**
   - transport — **old tomoni +X o'qiga** qaragan (Blender'da qizil o'q);
   - odam — tik turgan holda, **yuzi +X tomonga**;
   - lokatsiya modeli — **X = sharq, Y = shimol**.
   Model yon tomonga burilgan bo'lsa (uzunligi Y bo'ylab), dastur uni o'zi 90° buradi, lekin old/orqa tomonni to'g'ri qilib qo'ying.
4. **Pastki markaz:** model g'ildirak yoki oyog'i bilan yerda (Z = 0) tursin.
5. **Transformlarni qo'llash:** hamma obyektni belgilang (A) → **Ctrl+A → All Transforms**.
6. **Poligonni kamaytirish:** obyekt → Modifiers → **Decimate** → Ratio (masalan 0,3) → Apply. Pastdagi statistikada (Overlays → Statistics) uchburchaklar sonini tekshiring.
7. **Ranglar:** har bir qism uchun Material → Base Color. Teksturani rangga almashtiring (1–6-modellar uchun).
8. **Eksport:** File → Export → **glTF 2.0 (.glb)**:
   - Format: **glTF Binary (.glb)**;
   - Include: Selected Objects (faqat model);
   - Transform: **+Y Up** belgilangan;
   - Geometry: Apply Modifiers ✓, Normals ✓;
   - **Compression (Draco) — O'CHIQ** (dastur Draco'ni o'qimaydi);
   - Animation — o'chiq.
9. Fayl nomini jadvaldagidek qo'ying (masalan `fura.glb`).

---

## 4-qadam. Dasturga ulash va tekshirish

1. Faylni `Barham_M39_Blokada/models/units/` papkasiga qo'ying. `js/GLTFLoader.js` allaqachon loyihada bor.
2. `serve.ps1` ni ishga tushiring va `http://localhost:8780/` ni oching. `index.html` ni to'g'ridan-to'g'ri ochsangiz, modellar aniqlanmaydi.
3. Ekranda «Уч ўлчамли моделлар юкланди: fura.glb» chiqsa — model ulandi.
4. **Tekshirish:** «Эркин» postiga yaqinlashing (sichqoncha g'ildiragi bilan). Kerak bo'lsa, F12 → Console'da `S3D.stats()` — FPS 40 dan past bo'lsa, poligonni kamaytiring.
5. **Muammo bo'lsa:**
   - model ko'rinmaydi → fayl nomi va papkani tekshiring; Console'da qizil xato bormi;
   - teskari turibdi → Blender'da 180° burang (R Z 180), Ctrl+A, qayta eksport;
   - juda katta/kichik → transformlar qo'llanmagan (5-band);
   - qora rangda → material Base Color'ni tekshiring.

**Sinov uchun:** `tools/sinov_glb.ps1` oddiy «quti fura» yasaydi. Ulanish ishlashini shu bilan ko'rish mumkin:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sinov_glb.ps1 -Out models\units\fura.glb
```

---

## 5-qadam (ixtiyoriy). Lokatsiya modellari

`models/locations/` ga qo'yiladi va o'sha joydagi dasturiy binolarni almashtiradi:
- `m39_erkin_ypx.glb` — «Erkin» posti (arka, kabinalar). Markazi postning o'zi.
- `logistika_markazi.glb` — omborlar, konteynerlar.
- `aeroport_yuk_terminali.glb` — terminal, angarlar.

Talablar: o'lchami metrda, X = sharq, Y = shimol, markazi lokatsiya nuqtasi. Atrofdagi haqiqiy binolar OpenStreetMap'dan avtomatik chiziladi.

---

## Ish tartibi bo'yicha maslahat
Hozir `models/units/` da 6 ta yuk mashinasi bor: Mercedes, Scania, Volvo, ZIL (`fura_1…4`) va Volvo FH16, Caterpillar CT680 (`fura_hero_1…2`). Ular Blender'da tayyorlangan: transformlar qo'llangan, ortiqcha nuqtalar olib tashlangan, poligonlar kamaytirilgan, teksturalar 256–512 px. Yangi yuk mashinasini qo'shsangiz, keyingi raqam bilan nomlang (`fura_5.glb`).

Avval yuk mashinalarini ulang — eng katta vizual farqni shu beradi. Keyin `xodim.glb`, `haydovchi.glb`, `provokator.glb`. Har bir modeldan keyin FPS'ni tekshiring.

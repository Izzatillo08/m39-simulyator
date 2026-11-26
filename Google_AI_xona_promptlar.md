# M-39 • 2-versiya — Google AI (Gemini / Flow / Veo) uchun promptlar

Tayyor fayllarni `Barham_M39_v2/videos/` papkasiga **aynan shu nomlar bilan** qo'ying — dastur o'zi topadi.
Yangi xona rasmi (1-qadam) chiqsa, menga yuboring: ekran burchaklarini unga moslab qayta belgilayman (`js/room.js` → `CFG`).

---

## 1. Asosiy xona rasmi (bitta, eng muhimi) → `room_calm.jpg`
Gemini (Nano Banana Pro) — **16:9, eng yuqori sifat**. Reference sifatida `videos/intro_11.jpg` ni bering.

```
A photorealistic wide shot of a modern police situation and command center in Tashkent, Uzbekistan,
seen from directly behind a senior police colonel who stands in the center foreground with his back
to the camera, hands relaxed at his sides, wearing a dark navy Uzbek police uniform jacket.
In front of him a huge curved video wall fills the upper two thirds of the frame: one very large central
display flanked by six smaller displays (three on the left, three on the right), all with thin black bezels,
showing plain dark blue standby screens with faint grid lines.
Below the wall, two rows of modern operator desks with several monitors each; about ten officers in dark navy
uniforms and headsets work at the desks, some typing, some talking on phones, faces seen mostly from behind
or in profile. Clean modern interior: dark acoustic wall panels, cool LED ceiling strips, glass partitions,
an Uzbekistan flag on a stand on the right.
Eye-level camera, straight-on and centered on the video wall, symmetrical composition, the video wall edges
parallel to the frame. Lit by the cool glow of the screens and soft overhead LED light, focused calm atmosphere.
Shot on a 24mm lens, deep depth of field, sharp focus throughout, subtle film grain, realistic skin and fabric.
No readable text on screens, no logos, no watermark. 16:9.
```

## 2. Kayfiyat variantlari (1-rasmni tahrirlash orqali)
Har birida 1-rasmni bering va **o'zgarmas ro'yxatini** albatta qo'shing.

**`room_tense.jpg` — jiddiy:**
```
Change: the officers now look serious and concentrated, several lean toward their monitors, two stand up
holding phones to their ears, one points at a monitor. Slightly warmer amber accent light in the room.
Keep unchanged: camera angle, framing, the colonel in the foreground (pose, back to the camera, uniform),
the video wall position, size, bezels and dark standby screens, desks, room layout and lighting direction.
```

**`room_angry.jpg` — g'azablangan / tahlikali:**
```
Change: the officers look tense and frustrated, faces stern and angry in profile, two officers argue
across a desk, one slams a folder down, several talk loudly on phones; a red alert light pulses on the ceiling,
casting a faint red tint on the room.
Keep unchanged: camera angle, framing, the colonel in the foreground (pose, back to the camera, uniform),
the video wall position, size, bezels and dark standby screens, desks, room layout.
```

## 3. «Jonli» xona — xodimlar qimirlab turishi (Veo, 8 s, aylanma)
Har bir kayfiyat rasmidan **image-to-video** qiling. Nomlari: `room_calm.mp4`, `room_tense.mp4`, `room_angry.mp4`.
```
Locked-off static camera, no camera movement, no zoom. The colonel in the foreground stays completely still.
The officers at the desks move naturally and subtly: typing, turning their heads, picking up a phone,
passing a sheet of paper, one walks slowly between the desks. Screens on the video wall keep their
dark standby image without changes. Seamless loop: the last frame matches the first frame. No sound. 8 seconds.
```
> Muhim: kamera va video devor **qimirlamasin** — aks holda dastur ekranlarni devorga to'g'ri «yopishtira» olmaydi.

---

## 4. Hali yo'q natija videolari (2-modul) — 19 ta
Uslub: oldingi videolar kabi (hujjatli, 16:9, 8 s, O'zbekiston IIV formasi, matn va logotipsiz).

| Fayl | Sahna |
|---|---|
| `d04_ok.mp4` | Hukumat komissiyasi oq chodirda haydovchilar uyushmasi yetakchilari bilan stol atrofida tinch muzokara qilmoqda, IIV xodimlari atrofda |
| `d04_qisman.mp4` | IIV zobiti oq pikap kuzovidan megafon orqali olomonga gapirmoqda, olomon tarqalmayapti |
| `d04_xato.mp4` | Xodimlar haydovchilar yetakchilarini qo'lidan ushlab olib ketmoqda, olomon g'azablanib oldinga intilmoqda |
| `d05_ok.mp4` | Suv sepuvchi mashina va evakuatorlar magistraldagi egasiz furalarni chetga olmoqda, 4 yo'lak ochilmoqda |
| `d05_qisman.mp4` | Xodimlar qo'l kuchi bilan bitta yo'lakni asta ochmoqda, sekin va qiyin |
| `d05_xato.mp4` | To'q yashil zirhli mashina furani itarmoqda, kabinadan haydovchi qo'rqib tushmoqda |
| `d06_qisman.mp4` | Piyoda xodimlar guruhi olomon ichiga kirib hujjat tekshirmoqda, olomon itarishmoqda |
| `d06_xato.mp4` | (kritik) Xodimlar orasida vahima, olomon qochmoqda, yonib turgan yoqilg'i baki tutuni — o'q otish ko'rsatilmasin, faqat oqibati |
| `d07_qisman.mp4` | Chiqish yo'lida belgilangan yo'nalishsiz mashinalar tartibsiz chiqmoqda, tirbandlik |
| `d07_xato.mp4` | (kritik) Kran beton bloklarni barcha chiqish yo'llariga qo'ymoqda, mashinalar qamalib qolgan |
| `d08_ok.mp4` | «Yashil yo'lak»: ayollar, bolalar va bemorlar avtobusga chiqmoqda, yonida tez yordam va shifokor |
| `d08_qisman.mp4` | Xodimlar kuzatuvida oilalar piyoda yo'l chetidan yurmoqda, bolalar charchagan |
| `d08_xato.mp4` | Odamlar umumiy oqimda siqilishmoqda, tiqilinch, xodimlar boshqara olmayapti |
| `d09_qisman.mp4` | Yoqilg'i kolonnasi kuzatuvsiz uzoq aylanma yo'lda sekin ketmoqda |
| `d09_xato.mp4` | Yoqilg'i sisternalari olomon orasida tiqilib qolgan |
| `d10_ok.mp4` | Migalkali YPX mashinasi kuzatuvida sisternalar yoqilg'i shoxobchasiga kirmoqda, navbat yurishmoqda |
| `d10_qisman.mp4` | Faqat katta shoxobchada uzun navbat, kichik shoxobchalar yopiq |
| `d10_xato.mp4` | Barcha shoxobchalar yopiq, to'siq tushirilgan, haydovchilar g'azablangan |
| `d09_ok.mp4` *(almashtirish)* | Migalkali YPX kuzatuvida aviakerosin sisternalari aeroport yuk maydoniga kirmoqda |

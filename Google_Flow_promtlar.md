# M-39 trenajyori — Google Flow uchun to'liq promtlar to'plami

Har bir sahna va har bir qaror varianti uchun tayyor promtlar: **1-kadr (rasm) → oxirgi kadr (rasm) → video (Veo)**.
Promtlar ingliz tilida — Flow (Veo va Nano Banana / Imagen) ularni eng aniq tushunadi. Izohlar o'zbekcha.

Belgilar: ✅ — 1-kadr rasmi allaqachon bor (`videos/` papkasida), faqat videoga aylantirish qoldi · ⚠️ — rasm bor, lekin qayta yaratish tavsiya etiladi · ⬜ — hammasini yangidan yaratish kerak.

---

## 1. Google Flow'da ish tartibi

### Loyiha sozlamalari
| Sozlama | Qiymat |
|---|---|
| Model | **Veo 3.1 — Quality** (yakuniy variant uchun), **Fast** — qoralama va sinov uchun |
| Tomonlar nisbati | **16:9 (landscape)** |
| Natijalar soni | 2 ta (ikkalasidan yaxshisini tanlang) |
| Uzunlik | 8 s (Flow'dagi standart klip) |
| Yuklab olish | **1080p (upscaled)**, MP4 |

### Har bir sahna uchun qadamlar
1. **Rasm yaratish** — Flow'da «Create image» (Nano Banana / Imagen). **1-KADR** promti + `[RASM-USLUB]` blokini bering. Kerakli `[REF-…]` rasmlarini **ingredient** sifatida biriktiring. ✅ belgili sahnalarda bu qadamni o'tkazib yuboring — tayyor rasmni yuklang.
2. **Oxirgi kadr** — xuddi shunday, **OXIRGI KADR** promti bilan. Bunda **1-kadr rasmini ham reference qilib bering** — joy, odamlar va mashinalar o'zgarmasin.
3. **Video** — «**Frames to Video**» rejimi: *Start frame* = 1-kadr, *End frame* = oxirgi kadr. **VIDEO** promti + `[VIDEO-USLUB]` blokini bering.
4. Natija yoqmasa: promtni o'zgartirmasdan yana 1–2 marta yarating; keyin faqat bitta narsani aniqlashtiring (harakat yoki kamera).
5. Yuklab oling, jadvaldagi nom bilan `videos/` papkasiga qo'ying. Dastur `.mp4` ni ham, `.jpg` ni ham o'zi topadi; ikkalasi bo'lsa — `.mp4` ustun.

### Sifat qoidalari
- **Bitta klip — bitta asosiy harakat.** 8 soniyaga uch xil voqeani sig'dirmang.
- Promtdagi vaqt bo'linmasi (`0–3 s / 3–6 s / 6–8 s`) Veo'ga harakat tartibini aniq beradi.
- Oxirgi kadr 1-kadrdan **juda uzoq** bo'lmasin: kamera joyi va burchagi o'xshash, faqat vaziyat o'zgaradi. Aks holda Veo «sakrash» yoki morfing qiladi.
- Videoda **musiqa va nutq so'ramang**: ustidan dastur diktor ovozini qo'yadi. Faqat atrof-muhit ovozi.
- Har bir rasmdan keyin qo'l, yuz, forma va yozuvlarni tekshiring. Xato rasm videoda yanada buziladi.

---

## 2. Reference to'plami (Ingredients) — avval shularni tayyorlang
Bu rasmlarni bir marta yarating yoki tanlang. Keyin har bir sahnada **ingredient** qilib bering — personaj, forma va joy hamma videoda bir xil bo'ladi.

| Kod | Nima | Manba |
|---|---|---|
| `REF-POST` | «Erkin» posti: ko'k soyabonli post, 8 yo'lakli magistral, tizilgan furalar | ✅ `intro_02.jpg` |
| `REF-SHTAB` | Vaziyatlar markazi: katta video devor, uzun stol | ✅ `d01_ok.jpg` |
| `REF-PPX` | PPX xodimi (to'q ko'k forma, furajka) — portret, butun bo'yi | ⬜ quyida |
| `REF-YPX` | YPX xodimi (laym-yashil nimcha) va oq patrul mashinasi | ⬜ quyida |
| `REF-GVARD` | Milliy gvardiya: qalqon va dubulg'ali saf | ✅ `d03_ok.jpg` |
| `REF-OLOMON` | Sariq nimchali haydovchilar va qora niqobli provokatorlar | ✅ `intro_03.jpg` |

**`REF-PPX` — rasm:**
```
Full-body reference photo of an officer of the Uzbekistan Ministry of Internal Affairs patrol-post service standing on a highway
shoulder at dawn: man in his 30s, Central Asian appearance, short dark hair, clean-shaven; plain dark navy-blue uniform jacket and
trousers, dark navy peaked cap with a dark band and a small round cockade, a round shoulder patch with a plain unreadable emblem,
black belt, black boots, handheld radio on the chest. Neutral calm expression, three-quarter view, sharp detail, plain hazy background.
```
**`REF-YPX` — rasm:**
```
Reference photo of a road patrol service officer next to his patrol car at dawn: dark navy uniform with a lime-green high-visibility
reflective vest with silver stripes (no lettering), dark navy peaked cap, white gloves, a black-and-white striped traffic baton in
hand; behind him a white compact crossover patrol car with a dark-blue stripe along the side and a red-blue light bar on the roof,
unreadable licence plate. Three-quarter view, full body, sharp detail.
```

---

## 3. Umumiy bloklar — har bir promt oxiriga qo'shiladi

### `[RASM-USLUB]` — har bir rasm promti oxiriga
```
Photorealistic documentary photograph, 16:9, full-frame cinema camera, natural colour grade, fine detail, subtle film grain.
Mid-October, about 07:30: low warm sun from the left through thin morning haze, soft golden light, long shadows, cool blue
shade, light dust in the air. Suburban edge of Tashkent, Uzbekistan: 8-lane M-39 highway with a concrete median and steel
guardrails, yellowing poplar rows, single-storey houses with red and grey corrugated metal roofs, warehouses, power lines.
People: Central Asian appearance, natural varied faces, realistic proportions. Truck drivers: work jackets, yellow
reflective vests, caps. Provocateurs: black clothes, black balaclavas, gloves. Patrol-post officers (PPX): plain dark navy
uniforms, dark navy peaked caps. Road patrol officers (YPX): the same uniform with lime-green reflective vests, white patrol
cars with a dark-blue stripe and red-blue light bars. National Guard: black tactical uniforms, black helmets, plain dark riot
shields. Fire service: red fire engines. Ambulances: white with red stripes.
No readable text, letters, numbers, logos, flags or emblems with writing anywhere. No blood, no injuries, no weapons aimed at
people. Natural hands and faces, no distortions.
```

### `[VIDEO-USLUB]` — har bir video promti oxiriga
```
Style: photorealistic documentary footage, natural motion blur, realistic physics and crowd behaviour. Faces, uniforms,
vehicles and the location stay identical to the start frame for the whole shot — no morphing, no new objects popping in.
Audio: realistic ambient sound only — no music, no narration, no spoken words, no subtitles or captions.
```

---

## 4. KIRISH — 13 qismli ketma-ketlik
Dastur ularni shu tartibda ko'rsatadi, ustidan diktor (`audio/intro.mp3`) o'qiydi. `.jpg` — sekin yaqinlashuvchi rasm (3,5 s), `.mp4` — video.

| № | Fayl | Sahna | Holat |
|---|---|---|---|
| 1 | `intro_01.mp4` | Havodan «Erkin» postiga yaqinlashish | ⬜ video |
| 2 | `intro_02.jpg` | «Erkin» posti tepadan | ✅ |
| 3 | `intro_03.jpg` | Provokator megafon bilan | ✅ |
| 4 | `intro_04.mp4` | Provokatorlar oldinga suqilmoqda | ⬜ video |
| 5 | `intro_05.jpg` | Minglab odam furalar orasida | ⚠️ hozir `d04_qisman` nusxasi |
| 6 | `intro_06.mp4` | Olomon atrofida dron aylanadi | ⬜ video |
| 7 | `intro_07.mp4` | Logistika markazi darvozasi to'silgan | ⬜ video |
| 8 | `intro_07b.mp4` | Radikal guruh va egasiz furalar | ⬜ video |
| 9 | `intro_08.jpg` | Yoqilg'i shoxobchasi navbati | ✅ |
| 10 | `intro_09.jpg` | Aeroport: yonilg'isiz samolyot | ✅ |
| 11 | `intro_09b.mp4` | Aeroport: dron uzoqlashadi | ⬜ video |
| 12 | `intro_10.mp4` | Shtab: kamera video devorga yaqinlashadi | ⬜ video |
| 13 | `intro_11.jpg` | Polkovnik video devor oldida | ✅ |

### `intro_01.mp4` — Havodan «Erkin» postiga
*Ingredient: `REF-POST`*
- **1-KADR:**
```
Very high aerial drone view, 250 metres up, looking along the M-39 highway toward Tashkent at dawn: all eight lanes packed with
hundreds of heavy semi-trucks, fuel tankers and farm tractors in long queues stretching to the horizon and fading into haze; far
ahead a small checkpoint with a dark-blue canopy across the road; farmland, poplar rows and red-roofed houses on both sides.
[RASM-USLUB]
```
- **OXIRGI KADR:** `intro_02.jpg` dan foydalaning (aynan shu post, 60 m balandlikdan).
- **VIDEO:**
```
Aerial establishing shot. 0–4 s: the drone flies slowly forward along the blocked highway, high above the endless column of trucks.
4–8 s: it gently descends and tilts down toward the checkpoint canopy until the post fills the centre of the frame.
Tiny figures walk between trucks, thin exhaust vapour rises, haze drifts. Camera: smooth, steady, no shake.
Ambient sound: wind, a distant chorus of truck horns, a faint siren far away. [VIDEO-USLUB]
```

### `intro_04.mp4` — Provokatorlar oldinga suqiladi
*1-kadr: ✅ `intro_03.jpg` · Ingredient: `REF-OLOMON`*
- **OXIRGI KADR:**
```
The same place and camera angle as the reference: the masked men in black have pushed two metres closer to the line of officers in
dark navy uniforms; the leader with the megaphone raises his arm; several drivers in yellow vests step back and away from them,
looking worried; a plastic bottle lies on the asphalt in the empty space between the groups. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld news camera at chest height, slight natural shake. 0–3 s: the masked leader shouts into the megaphone and points at the
officers. 3–6 s: the masked group pushes forward through the crowd; drivers in yellow vests step aside. 6–8 s: a plastic bottle
is thrown and lands on the empty asphalt far from anyone; the officers stay in place, calm. Camera slowly moves forward.
Ambient sound: crowd murmur, megaphone noise without clear words, horns. [VIDEO-USLUB]
```

### `intro_05.jpg` — Olomon (⚠️ qayta yarating)
*Ingredientlar: `REF-POST`, `REF-OLOMON`*
- **1-KADR (bu rasmning o'zi `intro_05.jpg` bo'ladi):**
```
Drone view from 30 metres, high three-quarter angle: thousands of people standing on the highway between parked trucks in front of
the checkpoint — truck drivers in yellow vests and farmers, with small groups of men in black balaclavas mixed among them; the crowd
is dense near the front and thins out toward the back; some people stand on truck steps and cab roofs; long morning shadows of the
people on the asphalt; light dust and haze. [RASM-USLUB]
```

### `intro_06.mp4` — Dron olomon atrofida
*1-kadr: yangi `intro_05.jpg`*
- **OXIRGI KADR:**
```
The same crowd and trucks seen from the same height but from a position 40 degrees further around to the right; more people have
raised their fists; dust in the air catches the low sun. [RASM-USLUB]
```
- **VIDEO:**
```
Drone orbit. 0–8 s: the drone slowly circles the crowd 40 degrees to the right at constant height, keeping the front of the
crowd in the centre. Small realistic crowd motion: heads turning, arms waving, a few fists raised, people climbing onto truck steps.
Ambient sound: continuous horns, rhythmic chanting without clear words that grows louder. [VIDEO-USLUB]
```

### `intro_07.mp4` — Logistika markazi to'silgan
- **1-KADR:**
```
High three-quarter aerial view of the entrance road to a large logistics centre beside the M-39: long grey warehouses with
blue roofs and stacks of shipping containers behind a closed gate; the access road is blocked by six abandoned semi-trucks
parked at angles with open cab doors; old tyres and wooden pallets piled across the lanes; a group of about thirty men in dark
clothes, some in balaclavas, stands on the road; empty loading docks. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same scene from the same angle, camera slightly lower and closer to the blocked gate; the group of men has spread across the
road and is waving the trucks back; nothing moves at the loading docks. [RASM-USLUB]
```
- **VIDEO:**
```
Aerial reveal. 0–4 s: the drone glides forward over the warehouses toward the blocked access road. 4–8 s: it slowly descends
toward the gate, showing the abandoned trucks and the group of men standing among the tyres and pallets. Steady, smooth movement.
Ambient sound: wind, distant engines, a dog barking, muffled shouting. [VIDEO-USLUB]
```

### `intro_07b.mp4` — Radikal guruh yaqindan
*1-kadr: `intro_07` ning oxirgi kadri*
- **OXIRGI KADR:**
```
Ground-level shot at the blocked logistics gate: men in black clothes and balaclavas drag another pallet onto the pile; an abandoned
semi-truck with an open, empty cab beside them; a white delivery van waits behind, its driver standing by the door shaking his head.
[RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera at eye level. 0–4 s: two masked men drag a wooden pallet onto the pile of tyres across the road. 4–8 s: the camera
pans to an abandoned truck with an open, empty cab, then to a waiting delivery van whose driver shakes his head.
Ambient sound: dragging wood, footsteps, distant horns, wind. [VIDEO-USLUB]
```

### `intro_09b.mp4` — Aeroport
*1-kadr: ✅ `intro_09.jpg`*
- **OXIRGI KADR:**
```
The same airport cargo apron seen from higher and further back: the large cargo aircraft now small in the centre, the empty apron
around it, no fuel trucks anywhere, the ground crew in orange vests as tiny figures; the empty fuel depot tanks visible at the edge
of the airfield; morning haze. [RASM-USLUB]
```
- **VIDEO:**
```
Drone pull-back. 0–8 s: the camera slowly rises and moves backward from the idle cargo aircraft, revealing the empty apron and
the idle ground crew; one worker looks at his watch. Smooth, steady movement.
Ambient sound: wind, a distant jet engine idling, a faint airport announcement without clear words. [VIDEO-USLUB]
```

### `intro_10.mp4` — Shtab
*Ingredient: `REF-SHTAB`*
- **1-KADR:**
```
Wide shot of the operations centre from the back of the room: a large video wall with an aerial map of the highway and live camera
feeds of the blockade; rows of desks with officers in dark navy uniforms wearing headsets; a senior officer in a dark navy uniform
stands in front of the wall with his back to the camera; cool blue screen light, dim room. [RASM-USLUB]
```
- **OXIRGI KADR:** `intro_11.jpg` dan foydalaning.
- **VIDEO:**
```
Slow dolly push-in. 0–6 s: the camera moves forward between the desks toward the senior officer and the video wall; the screens
show live feeds of the blocked highway. 6–8 s: the officer turns his head slightly toward the camera and stops. Calm, tense mood.
Ambient sound: quiet radio chatter, keyboards, low room hum. [VIDEO-USLUB]
```

---

## 5. NATIJA VIDEOLARI — 10 vaziyat × 3 variant
Fayl nomlari: `dNN_ok` (to'g'ri), `dNN_qisman` (qisman to'g'ri), `dNN_xato` (xato yoki kritik). Hammasi 8 s.
Rasm bor, video yo'q bo'lsa, dastur rasmni ko'rsatadi. Video tayyor bo'lgach, rasmni o'chirmasangiz ham bo'ladi.

---

### 01 • Boshqaruv — Vaziyatlar markazi
*Vaziyat: bo'linmalar tarqoq ishlamoqda · Ingredient: `REF-SHTAB`*

#### `d01_ok` — «Barham» rejasi, shtab 3-rejimda ✅
- **1-KADR:** ✅ `d01_ok.jpg`
- **OXIRGI KADR:**
```
The same operations room and camera angle: all officers at the long table are now upright and focused, several talking into radios
at the same time with calm faces; on the video wall the highway map is divided into clear coloured sectors, all steady green;
a senior officer at the head of the table nods. [RASM-USLUB]
```
- **VIDEO:**
```
Static wide shot with a very slow push-in. 0–3 s: the senior officer at the head of the table gives an order into a desk microphone.
3–6 s: officers around the table nod one by one, pick up their radios and start speaking. 6–8 s: on the video wall the map sectors
turn from red to green one after another. Calm, confident tempo.
Ambient sound: radio squelch, short muffled confirmations without clear words, keyboards. [VIDEO-USLUB]
```

#### `d01_qisman` — faqat ratsiya orqali koordinatsiya ⚠️
*Hozirgi rasmdagi derazadagi olomon salom berayotgandek ko'rinadi — qayta yarating.*
- **1-KADR:**
```
Inside the operations room near a window: an officer in a dark navy uniform with a headset holds a handheld radio and listens with
a tense face; two other officers wait beside her looking at their own radios; through the window, the blocked highway in the haze;
a desk with several radio chargers and a paper map. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same room and angle: the officer is repeating the message into the radio, one of the colleagues checks his watch, the other
shrugs; through the window a single white patrol car is only now starting to move. [RASM-USLUB]
```
- **VIDEO:**
```
Medium shot, static camera. 0–3 s: the officer speaks into the radio and waits. 3–6 s: answers come back slowly; she repeats the
message, a colleague checks his watch. 6–8 s: through the window, a patrol car finally starts moving, late.
Ambient sound: crackling radio, interrupted voices without clear words, clock ticking. [VIDEO-USLUB]
```

#### `d01_xato` — har bo'linma mustaqil ⬜
- **1-KADR:**
```
The same operations room in disorder, same camera angle as the reference: nobody sits at the head of the table; officers in dark navy
uniforms talk on separate phones at the same time and turn their backs to each other; papers scattered across the desks; the map on
the video wall blinks with many red markers. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same room: two officers argue face to face across the desk, one throws a folder down, others stand with phones at their ears
looking lost; the video wall is almost entirely covered in red markers. [RASM-USLUB]
```
- **VIDEO:**
```
Slow sideways pan across the room. 0–3 s: officers talk over each other on separate phones. 3–6 s: one officer throws up his hands,
another hangs up angrily. 6–8 s: the red markers on the video wall multiply; the image slowly darkens.
Ambient sound: overlapping phone calls without clear words, radio noise, a rising alarm tone. [VIDEO-USLUB]
```

---

### 02 • Axborot — Vaziyatlar markazi
*Vaziyat: tarmoqlarda yoqilg'i haqida yolg'on xabarlar*

#### `d02_ok` — jonli brifing va haqqoniy video ✅
- **1-KADR:** ✅ `d02_ok.jpg`
- **OXIRGI KADR:**
```
The same operations room and camera angle: the video wall now shows, side by side, a live TV briefing (a senior officer in a dark
navy uniform at a plain podium with microphones) and a drone feed of trucks moving freely on an open highway lane; the officers at
the desks watch it with relieved faces; one officer gives a short nod. [RASM-USLUB]
```
- **VIDEO:**
```
Static wide shot with a slow push-in toward the video wall. 0–3 s: an officer at the desk presses a key and the live briefing
appears on the wall. 3–6 s: the drone feed beside it shows trucks starting to move on the open lane. 6–8 s: the officers relax and
exchange short nods. Smooth, steady camera.
Ambient sound: room hum, a calm muffled voice from the broadcast without clear words, keyboards. [VIDEO-USLUB]
```

#### `d02_qisman` — faqat matbuot relizi ✅
- **1-KADR:** ✅ `d02_qisman.jpg`
- **OXIRGI KADR:**
```
The same office and angle: a tall stack of printed press releases on the desk, the staff member looking out of the window; outside,
the queue of cars at the fuel station has grown even longer. [RASM-USLUB]
```
- **VIDEO:**
```
Static medium shot. 0–4 s: the printer slowly pushes out sheets, the staff member stacks them. 4–8 s: he looks out of the window —
the queue of cars outside does not move. The pace feels slow and late.
Ambient sound: printer, paper, muffled horns from the street. [VIDEO-USLUB]
```

#### `d02_xato` — aloqa va internetni o'chirish (KRITIK) ⬜
- **1-KADR:**
```
An emergency medical dispatch room: a dispatcher in a headset stares at a dark monitor with no incoming calls, desk phones silent,
a colleague holds up a mobile phone with an empty signal indicator (no text); through the window, people on the street hold up their
phones looking for signal. Cold, tense light. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same room: the dispatcher has taken off the headset and holds a dead desk phone to her ear; outside the window a worried crowd
has gathered and is arguing; the room light is dim and the image is desaturated. [RASM-USLUB]
```
- **VIDEO:**
```
Slow push-in. 0–3 s: the dispatcher taps her headset, nothing happens. 3–6 s: she picks up a desk phone — silence; a colleague
shakes his phone. 6–8 s: outside the window the crowd grows restless; colours slowly drain and the image fades darker.
Ambient sound: dead line tone, rising crowd noise, low heartbeat-like pulse. [VIDEO-USLUB]
```

---

### 03 • Provokatorlar — «Erkin» posti
*Vaziyat: 1 500 niqobli shaxs haydovchilar oldida · Ingredientlar: `REF-POST`, `REF-GVARD`, `REF-OLOMON`*

#### `d03_ok` — qalqonli bufer zona ✅
- **1-KADR:** ✅ `d03_ok.jpg`
- **OXIRGI KADR:**
```
The same aerial angle at the checkpoint: the double line of National Guard officers with plain dark shields stands firmly across
the highway; a clean empty buffer zone of 15 metres on both sides of the line; the masked men in black are far away at the field edge;
drivers in yellow vests sit calmly on the steps of their trucks. [RASM-USLUB]
```
- **VIDEO:**
```
High three-quarter aerial view, very slow drone drift. 0–3 s: the shield line takes three synchronised steps forward. 3–6 s: the
masked group retreats toward the field. 6–8 s: the drivers stay behind the line, several sit down on truck steps; the buffer zone
is empty.
Ambient sound: boots in step, shields knocking, a short command without clear words, distant horns fading. [VIDEO-USLUB]
```

#### `d03_qisman` — qalqonsiz og'zaki ogohlantirish ✅
- **1-KADR:** ✅ `d03_qisman.jpg`
- **OXIRGI KADR:**
```
The same place and angle: the thin line of officers in dark navy uniforms has moved a few metres forward; drivers and masked men are
still partly mixed; at the side, a paramedic helps a man sit down on the guardrail; tension remains. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera at shoulder height. 0–3 s: an officer warns the crowd through a handheld loudspeaker. 3–6 s: the crowd pushes back
and forth, a man stumbles and an officer helps him up. 6–8 s: he is led to a paramedic at the guardrail; the line slowly advances.
Ambient sound: loudspeaker without clear words, shouting, scuffling feet. [VIDEO-USLUB]
```

#### `d03_xato` — kabinalar va olomonga gaz (KRITIK) ✅
- **1-KADR:** ✅ `d03_xato.jpg`
- **OXIRGI KADR:**
```
The same highway and angle: thick white gas covers most of the trucks, visibility is very low; an empty truck has rolled into the
truck in front of it; drivers walk away covering their faces with jackets; in the far background, behind the gas, a bright orange
glow with no people near it; the image is tinted dark red. [RASM-USLUB]
```
- **VIDEO:**
```
High three-quarter angle, slow drone drift. 0–3 s: white gas spreads between the trucks, drivers leave their cabins covering their
faces. 3–6 s: an empty truck rolls forward and bumps into the truck ahead with a heavy metal crunch. 6–8 s: an orange flash far
behind the gas, away from people; the image turns dark red.
Ambient sound: hissing gas, coughing, horns, metal crunch, a low distant boom. [VIDEO-USLUB]
```

---

### 04 • Muzokara — «Erkin» posti
*Vaziyat: uyushma yetakchilari muloqotga tayyor*

#### `d04_ok` — komissiya xavfsiz yo'lak orqali ✅
- **1-KADR:** ✅ `d04_ok.jpg`
- **OXIRGI KADR:**
```
Closer view inside the same white tent: a government official in a dark suit and a union leader in a yellow vest shake hands over the
table, a signed paper between them (no readable text); officers in dark navy uniforms around the tent stand relaxed. [RASM-USLUB]
```
- **VIDEO:**
```
Slow push-in toward the tent. 0–3 s: the official and the union leaders talk, one leader nods. 3–6 s: papers are passed and signed.
6–8 s: a handshake over the table; the officers around the tent relax their posture.
Ambient sound: calm voices without clear words, pen on paper, distant horns going quiet. [VIDEO-USLUB]
```

#### `d04_qisman` — ovoz kuchaytirgich orqali masofadan ⚠️
*Pikap ustidagi so'zlovchi muzokarachi yoki IIV xodimi bo'lishi kerak — kerak bo'lsa qayta yarating.*
- **1-KADR:**
```
An officer in a dark navy IIV uniform and peaked cap stands on the back of a white pickup truck speaking through a megaphone toward a
crowd of drivers 40 metres away; officers stand beside the pickup; the crowd answers with raised arms; no one comes closer.
[RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place and angle: the officer lowers the megaphone; a few drivers at the back of the crowd turn and walk away, but most of
the crowd stays and waves their hands dismissively. [RASM-USLUB]
```
- **VIDEO:**
```
Static wide shot from behind the pickup. 0–4 s: the officer speaks through the megaphone. 4–8 s: the crowd shouts back, some wave
dismissively, a few drivers leave but most stay where they are.
Ambient sound: megaphone echo without clear words, mixed shouting, horns. [VIDEO-USLUB]
```

#### `d04_xato` — yetakchilarni ushlab turish ⬜
*1-kadrni yaratishda ingredient: ✅ `d04_ok.jpg`*
- **1-KADR:**
```
The same white negotiation tent from the reference: officers in dark navy uniforms suddenly take the three union leaders in yellow
vests by the arms and lift them from their chairs; the leaders protest; papers fall from the table. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
Wider view of the same place: the union leaders are being led away toward a van; behind the cordon of officers, the crowd of drivers
surges forward, faces angry, arms raised; the cordon bends. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera. 0–3 s: officers take the leaders by the arms and lead them out of the tent. 3–6 s: the crowd behind the cordon
reacts with anger and pushes forward. 6–8 s: the cordon line bends under the pressure; horns erupt across the highway.
Ambient sound: shouting, horns, scuffle, footsteps. [VIDEO-USLUB]
```

---

### 05 • Yo'lni ochish — logistika markazi yo'nalishi
*Vaziyat: radikal guruh va egasiz furalar yo'lni to'sgan*

#### `d05_ok` — suv sepuvchi va evakuator, 4 yo'lak ✅
- **1-KADR:** ✅ `d05_ok.jpg`
- **OXIRGI KADR:**
```
The same aerial angle: four lanes of the highway are open and clean; the removed trucks stand neatly on the shoulder; the water-
cannon truck and fire engines park at the side; the radical group has split into small groups walking away across the field; the
first cars pass through. [RASM-USLUB]
```
- **VIDEO:**
```
High aerial view, slow forward drift. 0–3 s: water arcs sweep low over the asphalt, smoke clears. 3–6 s: the yellow tow truck pulls
an abandoned trailer onto the shoulder. 6–8 s: the masked group breaks into small groups and leaves; four lanes are open.
Ambient sound: water pressure, engine roar, winch, distant voices. [VIDEO-USLUB]
```

#### `d05_qisman` — qo'l kuchi bilan 1 yo'lak ✅
- **1-KADR:** ✅ `d05_qisman.jpg`
- **OXIRGI KADR:**
```
The same place and angle: only one narrow lane is cleared; a single truck slowly drives through it; exhausted officers rest by the
barriers; a paramedic checks a worker sitting on the kerb; the rest of the road is still blocked. [RASM-USLUB]
```
- **VIDEO:**
```
Static high angle. 0–4 s: officers and workers drag barriers aside by hand. 4–8 s: one truck reverses with difficulty and then
slowly passes through the single cleared lane; a worker sits down on the kerb and a paramedic checks him.
Ambient sound: effort, scraping concrete, engines, horns. [VIDEO-USLUB]
```

#### `d05_xato` — furalarni zirhli texnika bilan surish ⚠️
*Hozirgi zirhli mashina xorijiy modelga o'xshaydi — qayta yaratish tavsiya etiladi.*
- **1-KADR:**
```
A dark-green Uzbek armoured vehicle (Tarlon-type, wheeled, no markings) presses its front bumper against the side of a semi-truck on
the highway; the truck's cab door is open and a frightened driver is climbing out; people run away between the trucks; officers in
dark navy uniforms wave their arms. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place and angle: the semi-truck is tilted and pushed half across the lane, its trailer twisted; the driver has run clear;
dust hangs in the air; the image is tinted red. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera. 0–3 s: the armoured vehicle pushes into the truck, metal scrapes. 3–6 s: the driver jumps out of the cab and runs;
the truck tilts and slides. 6–8 s: dust rises, people scatter; the image shifts to a red tint.
Ambient sound: metal scraping, engine strain, sirens, shouting. [VIDEO-USLUB]
```

---

### 06 • Yetakchilar — dronlar
*Vaziyat: tosh otganlar olomonga yashirinmoqda · Ingredientlar: `REF-OLOMON`, `REF-PPX`*

#### `d06_ok` — yuzni aniqlash droni va nuqtali ushlash ⬜
- **1-KADR:**
```
Over-the-shoulder shot: an officer in a dark navy uniform holds a rugged tablet showing a live drone feed of the crowd on the highway,
with several thin red square outlines around masked men (no text); above the crowd a black quadcopter hovers; in the background a
small team of plain-clothes officers starts walking calmly into the crowd. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The roadside next to the crowd: two masked men are calmly escorted by plain-clothes officers to a white van with open sliding door;
ordinary drivers in yellow vests stand around untouched and watch; the drone hovers above. [RASM-USLUB]
```
- **VIDEO:**
```
0–3 s: on the tablet the red outlines lock onto masked men one by one. 3–6 s: the camera rises from the tablet to the crowd as the
plain-clothes team moves quietly between the drivers. 6–8 s: two masked men are escorted to the van; the crowd stays calm.
Ambient sound: drone hum, quiet radio, footsteps. [VIDEO-USLUB]
```

#### `d06_qisman` — piyoda guruhlar bilan tekshiruv ⬜
- **1-KADR:**
```
Eye-level shot inside a dense crowd on the highway between trucks: a group of officers in dark navy uniforms pushes into the crowd
searching for someone; drivers in yellow vests are pressed together and angry; dust in the air. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place: the officers lead one masked man out of the crowd, while another masked man slips away between two trucks in the
background; a paramedic helps a driver sit down on a truck step. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera inside the crowd. 0–3 s: officers push slowly through, people shout and push back. 3–6 s: one masked man is pulled
out. 6–8 s: another slips away between the trucks; a paramedic helps someone sit down.
Ambient sound: shouting, whistles, shuffling feet. [VIDEO-USLUB]
```

#### `d06_xato` — olomonga o'q uzish (KRITIK) ⬜
- **1-KADR:**
```
Panic on the highway: a dense crowd scattering in all directions between parked trucks, people ducking behind truck wheels, dust and
grey smoke drifting; a fuel tanker in the background starts to smoke; no weapons visible, no injuries shown. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place, now almost empty: dropped bags and caps on the asphalt, thick smoke rising from the fuel tanker in the background with
a strong orange glow behind it; the image is tinted dark red. [RASM-USLUB]
```
- **VIDEO:**
```
High three-quarter angle, slight shake. 0–2 s: a sharp sound off-screen; the crowd freezes. 2–6 s: people run in all directions and
take cover behind trucks. 6–8 s: smoke from the tanker grows, an orange glow appears behind it; the image turns dark red.
Ambient sound: alarm, muffled screaming, a low distant boom. [VIDEO-USLUB]
```

---

### 07 • Chiqish yo'llari — aylanma yo'l
*Vaziyat: haydovchilar uyiga qaytmoqchi · Ingredient: `REF-YPX`*

#### `d07_ok` — nazoratli yo'laklar, YPX yo'nalish ko'rsatadi ⬜
- **1-KADR:**
```
Aerial view of a large cloverleaf interchange of the Tashkent ring road: road patrol officers in lime-green vests with striped batons
direct trucks into separate exit ramps marked with orange traffic cones; a white patrol car with flashing red-blue lights at each
ramp; the trucks move in orderly single lines. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same interchange seen from higher up: the main column of trucks on the M-39 has become much shorter, the ramps carry steady
orderly lines of trucks leaving in different directions, open asphalt is visible where the jam used to be. [RASM-USLUB]
```
- **VIDEO:**
```
Aerial. 0–4 s: trucks leave the highway one by one along the ramps, guided by the officers' batons. 4–8 s: the drone slowly rises to
show the jam dissolving into orderly lines.
Ambient sound: steady engines, short whistle signals, wind. [VIDEO-USLUB]
```

#### `d07_qisman` — yo'l belgilari bilan erkin chiqish ⬜
- **1-KADR:**
```
Exit ramps of the same interchange with only temporary road signs (arrows, no text) and no officers: trucks from several lanes crowd
into one ramp at the same time; a small jam forms at the merge point. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place: two trucks stand nose to nose at the merge point, their drivers leaning out of the cabs and arguing; behind them a
growing line of trucks waits. [RASM-USLUB]
```
- **VIDEO:**
```
High static angle. 0–4 s: trucks squeeze into the ramp from different lanes. 4–8 s: two of them stop nose to nose, drivers lean out
and argue, then one slowly gives way.
Ambient sound: horns, hissing air brakes, engines. [VIDEO-USLUB]
```

#### `d07_xato` — barcha yo'llarni beton blok bilan yopish (KRITIK) ⬜
- **1-KADR:**
```
Concrete barrier blocks close every exit ramp of the cloverleaf interchange; hundreds of trucks are trapped bumper to bumper on the
M-39 with nowhere to go; drivers stand on cab roofs looking around; a crowd is building up at the concrete blocks. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same interchange seen from very high: the whole highway is a solid mass of trapped trucks and people, large crowds pressed
against the concrete blocks at every ramp; the image is tinted dark red. [RASM-USLUB]
```
- **VIDEO:**
```
Aerial. 0–5 s: the drone slowly rises over the trapped column; the crowd pushes against the concrete blocks. 5–8 s: the full scale
of the trap becomes visible; the image turns dark red.
Ambient sound: endless horns, crowd noise, wind. [VIDEO-USLUB]
```

---

### 08 • Fuqarolar — «Yashil yo'lak»
*Vaziyat: tirbandlikda ayollar, bolalar, bemorlar*

#### `d08_ok` — «Yashil yo'lak», avtobus, shifokor ⬜
- **1-KADR:**
```
A service lane beside the highway marked with green traffic cones: officers in dark navy uniforms and paramedics in uniform guide
women, children and elderly people toward three waiting white buses; a medical tent with a stretcher nearby; calm, caring mood;
soft golden morning light. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same lane: the first white bus drives away along the green-coned lane, a paramedic waves to it; the remaining families wait
calmly in an orderly line at the second bus. [RASM-USLUB]
```
- **VIDEO:**
```
Slow lateral tracking shot. 0–3 s: families walk calmly along the lane. 3–6 s: a paramedic helps an elderly man up the bus steps,
an officer carries a child's bag. 6–8 s: the first bus departs along the green lane.
Ambient sound: calm voices without clear words, bus doors, engine, birds. [VIDEO-USLUB]
```

#### `d08_qisman` — xodimlar kuzatuvida piyoda ⬜
- **1-KADR:**
```
A long line of women, children and elderly people walking on foot along the hard shoulder of the highway, escorted by officers in
dark navy uniforms; they carry bags; an old woman rests on the guardrail; a tired child is held by the hand. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place: an officer helps the old woman to stand up and speaks into his radio; another officer carries the tired child;
the line continues slowly into the haze. [RASM-USLUB]
```
- **VIDEO:**
```
Slow tracking shot along the line. 0–4 s: people walk slowly, a child is lifted and carried. 4–8 s: an officer helps the old woman
stand up and calls for a medic on his radio.
Ambient sound: footsteps on gravel, wind, distant horns. [VIDEO-USLUB]
```

#### `d08_xato` — hammani umumiy oqimda chiqarish ⬜
- **1-KADR:**
```
Everyone forced into one narrow passage between two rows of trucks: a dense crowd of families mixed with drivers, people pressed
together, an adult holding a child above the heads; dust in the air. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same passage: an officer pulls a child out of the crowd to safety at the side; the crowd is still pressed together; the image is
tinted red. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera. 0–4 s: the crowd presses forward in the narrow passage, people hold on to each other. 4–8 s: an officer reaches in
and pulls a child out to safety; the image shifts to a red tint.
Ambient sound: shouting, shuffling, horns. [VIDEO-USLUB]
```

---

### 09 • Aviakerosin — aeroport yuk terminali
*Vaziyat: zaxira 2 soatga yetadi · Ingredient: `REF-YPX`, ✅ `intro_09.jpg` (aeroport)*

#### `d09_ok` — migalkali YPX kuzatuvida kolonna ⬜ (rasm)
*`d09_ok.mp4` hozircha vaqtinchalik — qayta yarating.*
- **1-KADR:**
```
A convoy of six fuel tanker trucks escorted front and back by white patrol cars with flashing red-blue lights drives through the open
cargo gate of the airport; the large cargo aircraft waits on the apron in the background; ground crew in orange vests watching.
[RASM-USLUB]
```
- **OXIRGI KADR:**
```
On the apron: a fuel tanker parked beside the cargo aircraft with the hose connected; a ground crew member in an orange vest gives a
thumbs-up; the patrol cars wait nearby. [RASM-USLUB]
```
- **VIDEO:**
```
Aerial tracking shot. 0–4 s: the escorted convoy rolls through the gate in a straight line. 4–8 s: a tanker parks beside the aircraft
and the crew connects the hose; a worker gives a thumbs-up.
Ambient sound: sirens fading, engines, airport ambience, wind. [VIDEO-USLUB]
```

#### `d09_qisman` — uzoq aylanma yo'l, kuzatuvsiz ⬜
- **1-KADR:**
```
Fuel tanker trucks driving slowly on a long narrow rural road through autumn farmland, no escort; one tanker stopped at a narrow
bridge over an irrigation canal, waiting for an oncoming truck; the airport visible far away on the horizon. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same road: the convoy is still far from the airport; a tanker driver stands by his cab looking toward the horizon and checking
his watch. [RASM-USLUB]
```
- **VIDEO:**
```
Aerial side view. 0–5 s: the convoy crawls along the rural road and stops at the narrow bridge. 5–8 s: a driver steps out and looks
at his watch; the airport is still far away.
Ambient sound: engines, wind, a ticking clock. [VIDEO-USLUB]
```

#### `d09_xato` — kolonnani olomon orqali o'tkazish ⬜
- **1-KADR:**
```
Fuel tanker trucks stuck inside the crowd on the M-39 highway: people surround the tankers, some bang on the tanks with their hands,
the convoy cannot move; officers in dark navy uniforms try to clear a path. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same place: people stand on the steps of the tankers, the drivers have locked their doors and sit still; the convoy is completely
stopped; the image is tinted red. [RASM-USLUB]
```
- **VIDEO:**
```
High three-quarter angle. 0–4 s: the crowd closes around the tankers, people bang on the tanks. 4–8 s: some climb onto the steps,
the drivers stop and lock their doors; the image shifts to red.
Ambient sound: horns, banging on metal, shouting. [VIDEO-USLUB]
```

---

### 10 • Yoqilg'i shoxobchalari
*Vaziyat: shoxobchalarning 90 % i bo'sh · Ingredient: ✅ `intro_08.jpg` (shoxobcha)*

#### `d10_ok` — sisternalar kolonnasi, YPX va FVV nazorati ⬜
- **1-KADR:**
```
The same city fuel station from the reference: a fuel tanker is unloading into the station's underground tank, a red fire engine is
parked nearby for safety, road patrol officers in lime-green vests organise the car queue into one orderly line. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same station: the pumps are working again, the first car is refuelling, the driver smiles; the queue moves forward in an orderly
line. [RASM-USLUB]
```
- **VIDEO:**
```
Static wide shot with a slow push-in. 0–4 s: the tanker finishes unloading, an officer waves the first car forward. 4–8 s: the car
fills up, the driver smiles, the queue starts moving.
Ambient sound: pump click, engines, calm city. [VIDEO-USLUB]
```

#### `d10_qisman` — faqat yirik shoxobchalarga ⬜
- **1-KADR:**
```
One large fuel station is working with a very long queue of cars; across the street a small fuel station stays closed with a barrier;
drivers look tired and impatient. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same street: a car that waited at the closed station turns around and joins the end of the long queue; the queue has barely
moved. [RASM-USLUB]
```
- **VIDEO:**
```
Static high angle. 0–4 s: the queue moves very slowly. 4–8 s: a car at the closed station turns around and joins the long line.
Ambient sound: horns, impatient voices without clear words. [VIDEO-USLUB]
```

#### `d10_xato` — barcha shoxobchalarni yopish ⬜
- **1-KADR:**
```
The same city fuel station closed with a lowered barrier; a crowd of drivers argues at the gate; people carry empty plastic canisters
along the street; cars block the road. [RASM-USLUB]
```
- **OXIRGI KADR:**
```
The same street in chaos: cars parked across the lanes, drivers shouting at the closed gate, an officer trying to calm them; the
image is tinted red. [RASM-USLUB]
```
- **VIDEO:**
```
Handheld camera. 0–4 s: drivers shout at the closed gate, one shakes the barrier. 4–8 s: the queue breaks into chaos, cars block the
street; the image shifts to red.
Ambient sound: horns, shouting, city noise. [VIDEO-USLUB]
```

---

## 6. Yakuniy tekshiruv ro'yxati
- [ ] Barcha fayllar `videos/` da, nomlari jadvaldagidek (kichik harflar, `_ok` / `_qisman` / `_xato`).
- [ ] Har bir video 16:9, 1080p, 6–8 s.
- [ ] Videoda yozuv, logotip, subtitr yo'q.
- [ ] Forma: PPX — to'q ko'k va furajka; YPX — laym-yashil nimcha; gvardiya — qora dubulg'a va qalqon.
- [ ] Musiqa va nutq yo'q, faqat atrof-muhit ovozi.
- [ ] Dasturni `ISHGA_TUSHIRISH.bat` orqali ochib, har bir savolda uchala variantni ko'rib chiqing.

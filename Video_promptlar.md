# M-39 trenajyori — rasm → video promtlari (kengaytirilgan)

> **Google Flow uchun to'liq va yakuniy to'plam:** [Google_Flow_promtlar.md](Google_Flow_promtlar.md) — har bir sahna va variant uchun 1-kadr, oxirgi kadr va Veo video promti, kirishning 13 qismi bilan.

## Ish tartibi
1. **RASM (1-kadr)** promtini rasm generatoriga bering: Midjourney v7, Imagen 4 / Nano Banana, Flux, Kling Image. O'lcham — **16:9, 1920×1080 yoki undan katta**.
2. Ba'zi videolarda **OXIRGI KADR** promti ham bor. Video generator «birinchi + oxirgi kadr» rejimini qo'llasa (Kling, Veo/Flow, Runway, Luma), ikkala rasmni ham bering — harakat aniq va boshqariladigan bo'ladi.
3. Rasmni **image-to-video** ga yuklang va **VIDEO** promtini bering: Kling 2.x, Veo 3, Runway Gen-4, Luma, Hailuo.
4. Tayyor faylni jadvaldagi nom bilan `videos/` papkasiga qo'ying — dastur o'zi topadi.

**Maslahatlar:**
- Promtlar **ingliz tilida** — generatorlar uni eng aniq tushunadi.
- Har bir promt oxiriga **USLUB** va **TAQIQLAR** bloklarini qo'shing.
- Bir xil joy va personajlar uchun avval chiqqan yaxshi rasmni **reference** sifatida bering: Midjourney'da `--cref` / `--sref`, Kling'da «Elements», Flow'da «Ingredients». Shunda «Erkin» posti, polkovnik va forma hamma videoda bir xil chiqadi.
- Bitta kadrda bitta asosiy harakat bo'lsin. Ko'p voqeani bitta 8 soniyaga sig'dirmang.
- Rasmda odamlar qo'li va yuzini tekshiring. Xato bo'lsa, videoga bermasdan oldin qayta yarating.

## Fayllar
| Fayl | Qachon chiqadi | Uzunligi |
|---|---|---|
| `intro.mp4` | «Simulyatsiyani boshlash»dan keyin | 6 lavha × 8 s ≈ 50 s, montaj qilib bitta fayl |
| `dNN_ok.mp4` | NN-savolda **to'g'ri** qaror | 6–8 s |
| `dNN_qisman.mp4` | NN-savolda **qisman to'g'ri** qaror (bo'lmasa, `_xato` ko'rsatiladi) | 6–8 s |
| `dNN_xato.mp4` | NN-savolda **xato yoki kritik** qaror | 6–8 s |
| `cam_1…4.mp4` | Pastdagi 4 ta kuzatuv displeyi (takrorlanadi) | 10–15 s |

Format: MP4 (H.264 + AAC), 1920×1080, 24 yoki 25 kadr/s. Ovoz bo'lsa yaxshi, lekin shart emas.

---

## USLUB — har bir promt oxiriga
```
STYLE: ultra-realistic documentary cinematography, as if filmed by a professional news crew and a DJI Inspire drone,
ARRI Alexa look, natural colour grade, subtle film grain, sharp details, realistic scale and physics, 16:9.
TIME & LIGHT: mid-October, 07:30 in the morning, low sun from the east behind light morning haze, soft cold diffused light,
long shadows, breath vapour visible, dew on metal surfaces.
PLACE: the M-39 international highway at the south-western entrance to Tashkent, Uzbekistan — wide 8-lane divided highway with a
concrete median and steel guardrails, flat autumn farmland with yellowing poplar rows, irrigation ditches, low-rise suburban houses
with red and grey corrugated metal roofs, large warehouses and logistics yards, a cloverleaf interchange with the ring road nearby,
power lines, dusty roadside.
PEOPLE: Central Asian appearance, natural faces, realistic clothing. Truck drivers: work jackets with yellow reflective vests,
some in caps. Farmers: practical work clothes. Provocateurs: black clothing, black balaclavas, gloves.
Uzbekistan Ministry of Internal Affairs (IIV) officers — PATROL-POST SERVICE (PPX): plain dark navy-blue uniform jackets and
trousers, dark navy peaked caps with a dark band and a small round cockade, a round shoulder patch with a plain (unreadable) emblem,
black boots, no visible writing; senior officers in the same navy uniform with dark overcoats.
ROAD PATROL SERVICE (YPX): the same dark navy uniform with a lime-green high-visibility reflective vest with silver stripes
(no readable lettering), white gloves, a black-and-white striped baton; YPX patrol cars — white sedans/crossovers (Chevrolet-type)
with a dark-blue side stripe and a red-blue light bar on the roof.
NATIONAL GUARD (Milliy gvardiya) crowd-control units: dark tactical uniforms, black helmets with visors, black body armour,
plain dark rectangular riot shields, standing in disciplined lines — no firearms aimed at people.
Fire and rescue (FVV): red fire engines. Ambulances (Tez yordam): white with red stripes.
VEHICLES: mixed fleet of European and Russian heavy trucks (box trucks, tilt trailers, refrigerated trailers, fuel tankers),
many dusty, Uzbek-style licence plates unreadable.
```

## Rasmlar tahlili — IIV formasi (PPX / YPX / Milliy gvardiya) bo'yicha
Joriy rasmlar (`videos/*.jpg`) tekshirildi. Umumiy holat: xodimlar to'q ko'k formada va furajkada, YPX xodimlari laym-yashil nimchada,
patrul mashinalari oq, ko'k chiziqli va migalkali — bu O'zbekiston IIV ko'rinishiga yaqin. Ko'zga tashlanadigan yozuv, xorijiy
«POLICE» belgisi yoki bayroq yo'q. Rasmiy forma nizomi bo'yicha aniq ranglar ochiq manbada topilmadi — yakuniy tasdiqni IIV
mutaxassisi bersin.

| Rasm | Holat | Tavsiya |
|---|---|---|
| `d01_ok`, `d02_ok` (shtab) | Mos: to'q ko'k forma, YPX nimchasi | Qayta yaratish shart emas |
| `d03_ok` (qalqonli zanjir) | Mos: Milliy gvardiya qalqon va dubulg'ada | — |
| `d03_qisman` | Mos: PPX xodimlari furajkada, megafon | — |
| `d03_xato` (gaz) | Mos | — |
| `d04_ok` (muzokara chodiri) | Mos | — |
| `d04_qisman` | **Diqqat:** pikap ustidagi so'zlovchi fuqaro kiyimida — muzokarachi yoki IIV xodimi bo'lishi kerak | «an officer in a dark navy IIV uniform speaking through a megaphone from the back of a white pickup» deb qayta yarating |
| `d05_ok` (suv purkagich) | Mos, uzoq plan | — |
| `d05_qisman` | Mos | — |
| `d05_xato` (zirhli texnika) | **Diqqat:** zirhli mashina xorijiy (G'arb) modeliga o'xshaydi | «a dark-green Uzbek armoured vehicle (Tarlon-type), no markings» deb aniqlashtiring |
| `d01_qisman` (operator) | Derazadagi olomon salom berayotgandek — sahna mazmuniga mos emas | «officers listening to radios, worried faces» deb qayta yarating |
| `intro_03`, `intro_05` | Mos: niqobli provokatorlar, sariq nimchali haydovchilar | — |
| `intro_11` (shtab, orqadan) | Mos | — |

## TAQIQLAR — har bir promt oxiriga
```
AVOID: readable text, letters, numbers, logos, brand names, flags, insignia with writing, words "POLICE"/"MILITIA" on clothing,
watermarks, blood, gore, visible injuries, weapons pointed at people, burning people, cartoon or CGI look, distorted hands,
extra fingers, duplicated faces, warped vehicles, floating objects, sudden morphing.
```

---

## KIRISH — `intro.mp4`
6 ta lavha. Har birini alohida yarating va ketma-ket montaj qiling (o'tishlar — 0,5 s qora yoki qisqa xira).

### 1-lavha • Magistral to'silgan
**RASM:**
```
High aerial drone shot, 120 metres up, looking down the M-39 highway toward Tashkent at dawn: all eight lanes completely blocked
by hundreds of heavy semi-trucks, fuel tankers and green and red farm tractors standing in long, mostly orderly queues; at the front
of the queue several trucks are parked at angles across the lanes. Ahead, a small highway checkpoint with a dark-blue steel canopy
over the road and a white single-storey post building. Morning haze over the fields, the traffic jam stretching kilometres back
and disappearing into the mist. Golden low sun on the right edge.
```
**VIDEO:**
```
Slow, steady forward drone flight along the blocked highway toward the checkpoint, gently descending from 120 to 60 metres.
Nothing on the road moves except small figures of people walking between trucks and thin exhaust vapour. Light haze drifts.
Sound: distant chorus of truck horns, wind, a faint siren far away. Duration 8 s.
```

### 2-lavha • Oldingi qator
**RASM:**
```
Eye-level shot at the very front of the blockade, 20 metres before the checkpoint: a mixed crowd of truck drivers in yellow vests and
farmers stands in front of the first row of trucks; among them, mixed in, a group of men in black clothes and black balaclavas pushes
forward; one masked man raises a megaphone. In the background, 40 metres away, a calm line of officers in dark navy uniforms near the
blue canopy, an ambulance and a white food delivery truck unable to pass. Shallow depth of field, focus on the crowd.
```
**VIDEO:**
```
Handheld camera slowly moves forward through the edge of the crowd, slight natural shake. The masked man shouts into the megaphone
and points toward the officers; drivers around him look uneasy, some step aside. A plastic bottle is thrown and lands on the asphalt
far from anyone. Sound: crowd murmur, megaphone echo, horns. Duration 8 s.
```

### 3-lavha • Olomon
**RASM:**
```
Drone shot from 25 metres: thousands of people standing on the highway between parked trucks, dense near the front and thinning out
toward the back; some people stand on truck steps and cab roofs; dust and light haze hang in the air; long morning shadows of the
people on the asphalt.
```
**VIDEO:**
```
Slow orbit of the drone around the crowd, 40 degrees over 8 seconds. Small realistic crowd motion: people turning heads, waving arms,
a few raising fists. Sound: continuous horns, rhythmic chanting that grows louder. Duration 8 s.
```

### 4-lavha • Shahar ichida
**RASM:**
```
A city fuel station on the edge of Tashkent in the morning: pumps covered and closed, a lowered barrier at the entrance, a long queue of
ordinary cars (white sedans, small vans) stretching along the street for hundreds of metres; frustrated drivers standing by their open
car doors, a man holding an empty plastic canister. Overcast morning light.
```
**VIDEO:**
```
Slow lateral tracking shot along the queue at car-roof height. Drivers talk and gesture, one honks, one checks his phone and shakes
his head. Nothing moves in the queue. Sound: horns, irritated voices, city ambience. Duration 8 s.
```

### 5-lavha • Aeroport
**RASM:**
```
Cargo apron of a large international airport at dawn: a wide-body cargo aircraft parked with open cargo doors, no fuel truck beside it,
empty refuelling hydrant points, ground crew in orange vests waiting idle with hands in pockets; the terminal building in soft focus
behind; light haze.
```
**VIDEO:**
```
Slow drone pull-back and rise from the aircraft nose, revealing the empty apron and the idle ground crew. One worker looks at his watch.
Sound: wind, distant jet engine idling, airport announcements without clear words. Duration 8 s.
```

### 6-lavha • Shtab
**RASM:**
```
A modern operations centre at dawn: a dim room with a large video wall showing an aerial map of the highway and several camera feeds of
the blocked road, red markers on the map (no text); a senior officer in a dark navy uniform stands in front of the wall, seen from
behind, other officers at desks with headsets; cool blue screen light on faces.
```
**VIDEO:**
```
Slow push-in toward the officer and the video wall. He turns his head slightly toward the camera as if to say "your decision".
Screens flicker with live footage. Sound: low tense music pulse, radio chatter, then silence at the end. Duration 8 s.
```

---

## NATIJA VIDEOLARI
Har savolda 3 ta video: **ok** — to'g'ri, **qisman** — natija bor, lekin kechikish va qiyinchilik bilan, **xato** — noto'g'ri yoki kritik qaror. Hammasi 6–8 s.

---

### 01 • Boshqaruv — Vaziyatlar markazi
*Vaziyat: bo'linmalar tarqoq ishlayapti.*

**`d01_ok.mp4` — «Barham» rejasi, shtab 3-rejimda**
- RASM: ```Operations centre in full coordination: a colonel in a dark navy uniform at the head of a long table speaks into a desk radio microphone; around the table officers from different services (navy uniforms, a National Guard officer in black, a traffic police officer with a lime vest, a fire officer); behind them a video wall where the highway map shows clear coloured sectors (no text); calm, focused faces.```
- OXIRGI KADR: ```The same room, all officers standing and nodding, several leaving the room quickly with tablets and radios; the map sectors on the wall are now steady green.```
- VIDEO: ```The colonel gives an order into the microphone; officers around the table nod one by one and pick up their radios; on the wall the sectors change from red to green in sequence. Calm confident tempo. Sound: radio squelch, short confirmations, steady keyboard sounds. 8 s.```

**`d01_qisman.mp4` — faqat ratsiya orqali umumiy koordinatsiya**
- RASM: ```A field command vehicle by the highway: an officer in navy uniform holds a handheld radio and listens; several radios on the dashboard; through the windshield the blocked highway; he looks tense and checks his watch.```
- VIDEO: ```The officer speaks into the radio, waits, repeats the message; the answers come back slowly and overlap; outside, a patrol car starts moving only after a delay. Sound: crackling radio, interrupted voices. 7 s.```

**`d01_xato.mp4` — har bo'linma mustaqil**
- RASM: ```The operations centre in disorder: officers talking on separate phones at the same time, papers scattered on desks, nobody at the head of the table, the map on the video wall blinking with many red markers.```
- VIDEO: ```Slow pan across the room: people interrupt each other, one officer throws up his hands, another hangs up angrily; the map markers multiply. Sound: overlapping phone calls, radio noise, rising alarm tone. 8 s.```

---

### 02 • Axborot — Vaziyatlar markazi
*Vaziyat: ijtimoiy tarmoqlarda yoqilg'i haqida yolg'on xabarlar.*

**`d02_ok.mp4` — jonli brifing va haqqoniy video**
- RASM: ```Press room: a senior official in a dark navy uniform and a civilian spokesperson at a plain podium with microphones; behind them a large screen showing a drone video of trucks starting to move on an open highway lane; journalists with TV cameras and phones in the foreground, out of focus.```
- VIDEO: ```The spokesperson speaks calmly and points to the screen; camera flashes; on the screen the traffic moves; cut-in feel of a phone in a citizen's hand showing the same live stream. Sound: calm speech without clear words, camera shutters. 8 s.```

**`d02_qisman.mp4` — faqat matbuot relizi**
- RASM: ```An office printer producing sheets of a press release, a staff member stacking them; through the window, a street with a long queue of cars at a fuel station.```
- VIDEO: ```The papers pile up; outside, the queue does not move; a woman on the street scrolls her phone with a worried face. Sound: printer, muffled street horns. 7 s.```

**`d02_xato.mp4` — aloqa va internetni o'chirish (KRITIK)**
- RASM: ```An emergency medical dispatch room: a dispatcher with a headset looks at a dead screen with no incoming calls, phones on the desk silent; through the window, people on the street holding up their phones looking for signal.```
- VIDEO: ```The dispatcher taps the headset, picks up a phone — no tone; outside, people gather and argue; at the end the image slowly desaturates and tints dark red. Sound: dead line tone, rising crowd noise, low heartbeat pulse. 8 s.```

---

### 03 • Provokatorlar — «Erkin» posti
*Vaziyat: 1 500 niqobli shaxs haydovchilar oldida.*

**`d03_ok.mp4` — qalqonli bufer zona**
- RASM: ```Highway at the checkpoint: a continuous line of National Guard officers in black helmets with plain dark shields stands across all lanes, creating a clear 15-metre buffer; on one side drivers in yellow vests stand by their trucks, on the other side the masked men in black are being pushed back toward an open field; officers in navy uniforms guide drivers back to their cabins.```
- OXIRGI KADR: ```Wide view: the buffer zone is empty and clean, the masked group is far away on the field edge, drivers are sitting calmly on truck steps.```
- VIDEO: ```The shield line steps forward in rhythm, three synchronised steps; the masked group retreats; drivers stay behind and watch, some sit down. Sound: boots in step, shields knocking, a short command. 8 s.```

**`d03_qisman.mp4` — qalqonsiz og'zaki ogohlantirish**
- RASM: ```Officers in navy uniforms without shields stand in a thin line facing the masked group, one officer speaking through a handheld loudspeaker; drivers and masked men are still mixed together; tense pushing at the edges.```
- VIDEO: ```The officer warns through the loudspeaker; the crowd pushes back and forth; one man stumbles and is helped up by an officer and taken to a paramedic; the line slowly moves forward. Sound: loudspeaker, shouting, scuffling. 8 s.```

**`d03_xato.mp4` — kabinalar va olomonga gaz (KRITIK)**
- RASM: ```Thick white clouds of tear gas drifting between densely parked heavy trucks and fuel tankers; drivers stepping out of their cabins covering their faces with jackets and walking away; one empty truck starts to roll slowly; strong haze reduces visibility.```
- VIDEO: ```Gas spreads across the lanes, visibility drops; a driverless truck rolls forward and bumps into the truck ahead with a heavy metal crunch; alarms and horns; at the end a bright orange flash far behind (no people near it) and the image tints dark red. 8 s.```

---

### 04 • Muzokara — «Erkin» posti
*Vaziyat: uyushma yetakchilari muloqotga tayyor.*

**`d04_ok.mp4` — komissiya xavfsiz yo'lak orqali**
- RASM: ```A white negotiation tent beside the highway, inside a simple table: two government officials in suits opposite three truck-union leaders in yellow vests; a protective ring of officers in navy uniforms around the tent; the blocked highway in the soft background.```
- OXIRGI KADR: ```Close-up of a handshake over the table between an official and a union leader, a signed paper between them (no readable text).```
- VIDEO: ```The leaders talk, one nods, papers are passed and signed, a handshake; outside the tent the officers relax their posture. Sound: calm voices, pen on paper, distant horns stop. 8 s.```

**`d04_qisman.mp4` — ovoz kuchaytirgich orqali masofadan muloqot**
- RASM: ```An official stands on the back of a pickup truck speaking into a loudspeaker toward the crowd 50 metres away; the crowd answers with shouts; no one comes closer.```
- VIDEO: ```He speaks, the crowd shouts back, some wave their hands dismissively, a few drivers walk away but most stay. Sound: loudspeaker echo, mixed shouting. 7 s.```

**`d04_xato.mp4` — yetakchilarni ushlab turish**
- RASM: ```At the negotiation table officers suddenly take the union leaders by the arms; the leaders protest; behind the cordon the drivers react with anger.```
- VIDEO: ```The leaders are led out of the tent; the crowd surges against the cordon, horns explode across the highway; the cordon bends. Sound: shouting, horns, scuffle. 8 s.```

---

### 05 • Yo'lni ochish — logistika markazi yo'nalishi
*Vaziyat: radikal guruh va egasiz fura yo'lni to'sgan.*

**`d05_ok.mp4` — suv sepuvchi va evakuator, 4 yo'lak**
- RASM: ```Two water-cannon trucks and red fire engines on the highway; a wide fan of water spray in the air catches the low sun and dispersing smoke; a heavy yellow tow truck hooks an abandoned semi-truck; four lanes on the left are already clear; the radical group retreats into the field.```
- OXIRGI KADR: ```Drone view: four clean empty lanes open on the highway, removed trucks parked neatly on the shoulder, first vehicles starting to pass.```
- VIDEO: ```Water arcs sweep low over the asphalt, smoke clears, the tow truck pulls the trailer onto the shoulder, the masked group splits into small groups and walks away. Sound: water pressure, engine roar, winch. 8 s.```

**`d05_qisman.mp4` — qo'l kuchi bilan 1 yo'lak**
- RASM: ```Officers and workers manually pushing barriers and guiding a single truck out of the way, only one narrow lane cleared, exhausted faces, the rest of the road still blocked.```
- VIDEO: ```Slow progress: people push, a truck reverses with difficulty, a worker sits down on the kerb, a paramedic checks him. Sound: effort, engines, horns. 8 s.```

**`d05_xato.mp4` — furalarni zirhli texnika bilan surish**
- RASM: ```A dark armoured vehicle pressing its bumper against the side of a semi-truck; the truck cabin door is open and a driver is climbing out in fear; people running away between the trucks.```
- VIDEO: ```Metal scraping, the truck tilts and slides, the driver jumps clear and runs; dust rises; sirens. At the end a quick red tint. 7 s.```

---

### 06 • Yetakchilar — dronlar
*Vaziyat: tosh otganlar olomonga yashirinyapti.*

**`d06_ok.mp4` — yuzni aniqlash droni va nuqtali ushlash**
- RASM: ```A police quadcopter hovering above the crowd; in the foreground an officer's hands hold a rugged tablet showing the live drone feed of the crowd with several thin red square outlines around masked men (no text); in the background a small team of plain-clothes officers walks calmly into the crowd.```
- OXIRGI KADR: ```Two masked men being calmly escorted by plain-clothes officers to a white van at the roadside, ordinary drivers around them untouched and watching.```
- VIDEO: ```The drone slowly turns, the red outlines lock onto targets one by one; the team moves quietly through the crowd and escorts the men away; the crowd stays calm. Sound: drone hum, quiet radio, footsteps. 8 s.```

**`d06_qisman.mp4` — piyoda guruhlar bilan tekshiruv**
- RASM: ```Officers in navy uniforms push their way into a dense crowd trying to find someone, people pressed together and angry, dust in the air.```
- VIDEO: ```The officers move slowly, people shout and push back; one man is pulled out, another slips away; a medic helps someone sit down. Sound: shouting, whistles. 8 s.```

**`d06_xato.mp4` — olomonga o'q uzish (KRITIK)**
- RASM: ```Panic on the highway: a dense crowd scattering in all directions between trucks, people ducking behind wheels, dust and smoke drifting, a fuel tanker in the background starts to smoke; no weapons visible, no injuries shown.```
- VIDEO: ```A sharp sound off-screen, the crowd breaks and runs; smoke grows from the tanker; at the end a strong orange glow behind the smoke and the image tints dark red. Sound: alarm, screaming muffled by music, low boom. 7 s.```

---

### 07 • Chiqish yo'llari — aylanma yo'l
*Vaziyat: haydovchilar uyiga qaytmoqchi.*

**`d07_ok.mp4` — nazoratli yo'laklar, YPX yo'nalish ko'rsatadi**
- RASM: ```Aerial view of a large cloverleaf interchange: traffic police officers in lime vests with light batons direct trucks into separate exit ramps marked with orange cones; white patrol cars with flashing lights at each ramp; orderly flow.```
- VIDEO: ```Trucks leave the highway one by one along the ramps, the main column slowly shortens; the drone rises to show the jam dissolving. Sound: steady engines, short whistle signals. 8 s.```

**`d07_qisman.mp4` — yo'l belgilari bilan erkin chiqish**
- RASM: ```Exit ramps of the interchange with only temporary road signs (no text) and no officers; trucks crowding into the ramps from several lanes at once, a small jam at the merge point.```
- VIDEO: ```Trucks squeeze in, two of them stop nose to nose, drivers lean out and argue, then slowly give way. Sound: horns, air brakes. 8 s.```

**`d07_xato.mp4` — barcha yo'llarni beton blok bilan yopish (KRITIK)**
- RASM: ```Concrete barrier blocks closing every exit ramp of the interchange; hundreds of trucks trapped bumper to bumper; drivers standing on cab roofs looking around; a crowd building up at the blocks.```
- VIDEO: ```The drone rises slowly over the trapped column; the crowd pushes against the concrete blocks; endless horns; red tint at the end. 8 s.```

---

### 08 • Fuqarolar — «Yashil yo'lak»
*Vaziyat: tirbandlikda ayollar, bolalar, bemorlar bor.*

**`d08_ok.mp4` — «Yashil yo'lak», avtobus, shifokor**
- RASM: ```A service lane beside the highway marked with green cones: officers and paramedics guide women, children and elderly people toward waiting white buses; a medical tent with a stretcher nearby; calm, caring atmosphere; soft morning light.```
- VIDEO: ```Families walk calmly along the lane, a paramedic helps an elderly man up the bus steps, an officer carries a child's bag; the first bus departs. Sound: calm voices, bus doors, birds. 8 s.```

**`d08_qisman.mp4` — xodimlar kuzatuvida piyoda**
- RASM: ```A long line of women, children and elderly people walking on foot along the hard shoulder escorted by officers, carrying bags; an old woman resting on a guardrail.```
- VIDEO: ```The line walks slowly, a child is tired and is carried; an officer helps the old woman stand up and calls for a medic. Sound: footsteps, wind, distant horns. 8 s.```

**`d08_xato.mp4` — hammani umumiy oqimda chiqarish**
- RASM: ```Everyone pushed into one narrow passage between two rows of trucks: a dense crowd of families mixed with drivers, people pressed together, a child lifted above heads.```
- VIDEO: ```The crowd presses forward, people hold on to each other, an officer pulls a child out to safety; shouting. Red tint at the end. 7 s.```

---

### 09 • Aviakerosin — aeroport yuk terminali
*Vaziyat: zaxira 2 soatga yetadi.*

**`d09_ok.mp4` — migalkali YPX kuzatuvida kolonna**
- RASM: ```A convoy of fuel tanker trucks escorted front and back by white patrol cars with flashing red-blue lights drives through the open airport cargo gate; a large cargo aircraft waits on the apron.```
- OXIRGI KADR: ```A tanker connected by hose to the aircraft, a ground crew member giving a thumbs-up.```
- VIDEO: ```The convoy rolls onto the apron in a straight line, a tanker parks beside the aircraft, the crew connects the hose. Sound: sirens fade, engines, airport ambience. 8 s.```

**`d09_qisman.mp4` — uzoq aylanma yo'l, kuzatuvsiz**
- RASM: ```Fuel tankers driving slowly on a long rural road through farmland, no escort, one tanker stopped at a narrow bridge waiting.```
- VIDEO: ```The convoy crawls; a driver checks a paper map; the airport is visible far away on the horizon. Sound: engines, wind, a clock ticking in the music. 8 s.```

**`d09_xato.mp4` — kolonnani olomon orqali o'tkazish**
- RASM: ```Fuel tankers stuck inside the crowd on the highway, people surrounding the trucks and banging on the tanks, the convoy unable to move.```
- VIDEO: ```Horns, people climb onto the steps of a tanker, the drivers stop and lock the doors; red tint at the end. 7 s.```

---

### 10 • Yoqilg'i shoxobchalari
*Vaziyat: shoxobchalarning 90 % i bo'sh.*

**`d10_ok.mp4` — sisternalar kolonnasi, YPX va FVV nazorati**
- RASM: ```A fuel tanker unloading at a city fuel station, a red fire engine parked nearby for safety, traffic police organising the car queue into one orderly line; the pump lights are on again.```
- VIDEO: ```The first car moves to the pump and fills up, the driver smiles, the queue starts moving. Sound: pump click, engines, calm city. 8 s.```

**`d10_qisman.mp4` — faqat yirik shoxobchalarga**
- RASM: ```One large fuel station working with a very long queue, while a small station across the street remains closed with a barrier.```
- VIDEO: ```The queue moves very slowly; a driver at the closed station turns around and joins the long line. Sound: horns, impatient voices. 8 s.```

**`d10_xato.mp4` — barcha shoxobchalarni yopish**
- RASM: ```All fuel stations closed with barriers, crowds of drivers arguing at the gates, people carrying empty canisters along the street.```
- VIDEO: ```Drivers shout at the closed gates, the queue breaks into chaos, cars block the street. Red tint at the end. 8 s.```

---

## KUZATUV DISPLEYLARI — `cam_1…4.mp4` (ixtiyoriy)
Statik, 10–15 s, boshi va oxiri o'xshash bo'lsin — takrorlanganda sakramaydi.

**Umumiy RASM qolipi:**
```
Fixed high-mounted CCTV security camera view, wide-angle lens with slight barrel distortion, slightly desaturated colours, light
digital noise, early-morning haze, static framing, of [JOY]. No text overlays, no timestamps.
```
**Umumiy VIDEO:** ```Completely static camera; only small natural motion (people walking slowly, light haze drifting, a flag-less pole swaying). Seamless loop, 12 s.```

| Fayl | [JOY] |
|---|---|
| `cam_1.mp4` | the front of the highway blockade at the checkpoint canopy, crowd and first rows of trucks |
| `cam_2.mp4` | the gate of a large logistics centre with warehouses and containers, trucks parked outside |
| `cam_3.mp4` | the airport cargo apron with a parked cargo aircraft and idle ground crew |
| `cam_4.mp4` | a city fuel station forecourt with a queue of cars |

Qarordan keyingi holat uchun ham yasash mumkin: `cam_N_qNN.mp4`. Masalan, `cam_1_q03.mp4` — 3-savoldan keyin «Erkin» kamerasi, unda bufer zona ko'rinadi.

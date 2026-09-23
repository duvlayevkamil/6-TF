# `6-sinf.html` platformasi — tahlil va xulosa

Sana: 2026-09-23 · commit `6535c71` · o'lcham 332 KB · barcha tekshiruvlar yashil.

## 1. O'lcham va qurilma

| Qism | Hajmi | Izoh |
|---|---|---|
| `6-sinf.html` | 332 KB (gzip ≈ 92 KB) | bitta fayl, tashqi bog'liqlik yo'q, ofline ishlaydi |
| JSON orol (`topics-data`) | 183 KB | 26 mavzuning butun mazmuni |
| `platform/labs.js` | 75 KB / 1414 qator | 17 turdagi simulyator |
| `platform/app.js` | 44 KB / 986 qator | qobiq: 5 tab, test, slaydlar, chop markazi |
| `platform/styles.css` | 19 KB / 338 qator | 7-sinf palitrasida, 3 media-so'rov + `@media print` |
| `platform/content/bob-*.json` | 12 fayl, 12–20 KB | tahrirlanadigan yagona manba |

Tartib: `data/curriculum/*.topics.json` (kitob — tasdiqlangan struktura) +
`platform/content/*` (o'zimiz yozgan mazmun) → `npm run build` → `6-sinf.html`.
Build **deterministik** (urug'li aralashtirish), shuning uchun Git diff shovqinsiz.

## 2. Mazmun qamrovi (26/26 = to'liq)

| Ko'rsatkich | Qiymat |
|---|---|
| Maydon qamrovi | 13 ta maydonning **barchasi 26/26 mavzuda to'la** (bo'sh yoki qism yo'q) |
| Nazariya | 134 paragraf · 4 084 so'z · o'rtacha 157 so'z/mavzu (eng kam 3.3 — 130, eng ko'p 10.2 — 267) |
| Formulalar | 6–7 ta/mavzu |
| Atamalar | 155 ta (5–7/mavzu) |
| Test banki | 130 savol (5/mavzu) + 53 slayd savoli + 83 o'yin savoli = **266** |
| Savol sifati | 0 takrorlanish · 100% 4 variantli · 100% izohli (`why`) · indekslar chegarada |
| Amaliy topshiriq | 130 bosqich (har mavzuda 5), jihoz 2–5, **xavfsizlik 26/26 mavzuda** |
| Simulyator | 26/26 mavzu, 17 tur, 25 sozlanadigan holat, **26 noyob konfiguratsiya** (bir xil lab takrorlanmagan) |
| Kitob havolalari | 37 o'rganish savoli · 10 qism mavzu · 253 ko'nikma chipi · 50 tatbiq · amaliy ish 26/26 · boshqotirma 26/26 · takrorlash/mustahkamlash 26/26 |
| Vaqt | 4 chorakda 7/7/6/6 mavzu ≈ 102 soatga (3 soat/hafta) mos |

## 3. Ishlash va ishonchlilik (jsdom o'lchovlari)

| O'lchov | Natija |
|---|---|
| Ochilish + boot | 555 ms, boshlang'ich DOM 250 tugun (orol kech bo'ylanadi) |
| Tab ochish | 26 mavzu × 5 tab = 130 almashinuv 3 963 ms (o'rt. 30 ms, eng sekin 73 ms — 1.1 simulyator) |
| Chop markazi «barcha mavzular» | 292 varaq, 292 blok, 267 ms, 169 KB HTML |
| Xatolar | **0** (konsolda faqat ixtiyoriy `warn/error` tarmoqlari) |
| localStorage | 2,7 KB (butun sinf kuzatuviga ham kichik; limit ~5 MB) |
| Yo'l himoyasi (`/../../etc/passwd`) | 404 — server `normalize` bilan himoyalangan |

Darvozalar: `npm run verify` (struktura ↔ kitoblar: 258 matn + 30 amaliy ish +
48 bob beti), `content:check`, `smoke` (25 sim × 333 holat, 291 slayd,
buildTest), `dom:check` (10 bosqichli brauzer sinovi).

## 4. Tahlil **topib, tuzatgan** kamchiliklari

1. **Baholash xolisligi buzilgan edi (jiddiy).** 266 savolning **barchasida**
   to'g'ri javob A variantda (indeks 0) turar edi — kontent yozish an'anasi
   o'zgarmas holda faylga o'tib ketgan. O'quvchi buni bir darsda payqaydi.
   *Tuzatildi:* build har savolni kod+matndan urug' olgan holda
   deterministik aralashtiradi (FNV hash + xorshift + Fisher-Yates), javob
   indeksi qayta hisoblanadi, javob matni yo'qolsa build to'xtaydi.
   Endi A/B/C/D = **64/67/66/69** (eng ko'pi 26%). An'ana (`javob — birinchi`)
   `check-content.mjs`da qoida sifatida yozib qo'yildi, `npm run smoke`
   esa to'planishni qayta payqashini tekshiradi (yangi 1b-bo'lim).
2. **Kitob betlari noto'g'ri taqdim etilgan.** Mundarija bet raqamini **bob**
   darajasida beradi, lekin interfeys uni mavzu oralig'idek ko'rsatardi
   (1.1 va 1.2 — ikkalasi «4–13»), 12-bobda esa «143–» deb qolardi.
   *Tuzatildi:* `betMatn()/bobMatn()` — «Darslik 1-bob · 4–13-betlar»,
   «Darslik 12-bob · 143-betdan boshlanadi»; crumb, slayd muqovasi va chop
   varaqasi sarlavhasi ham endi shu aniq matnda.

## 5. Qolgan kuchsiz tomonlar (ahamiyati bo'yicha tartib)

1. **Variant uzunligi balansi:** 130 test savolining **72%**ida eng uzun
   variant — to'g'ri javob (ideal ≈25%). Joyi aralashtirilgan, lekin
   «uzunroq javob to'g'iroq» belgisi qoldi. *Yechim:* noto'g'ri variantlarni
   ham batafsil yozish (bobma-bob ~1 soat, `content:check` qayta tekshiradi).
2. **Progress ko'chmaydi:** hammasi `localStorage`da — sinf kompyuteridagi
   natija uyga/boshqa kompyuterga o'tmaydi. *Yechim:* «⬇ Progress JSON /
   ⬆ Tiklash» tugmasi (~25 qator, fayl tashqarisiga chiqmaydi).
3. **Ko'nikma statistikasi nozik:** chiplar bob darajasidagi ro'yxatni har
   mavzuga ko'chiradi (112 ko'nikma → 253 chip), shuning uchun boshqaruv
   panelidagi «ko'nikma bo'yicha xatolar» taxminiy. *Yechim:* o'qituvchi
   20 daqiqada `urinish.konikmalar`ni mavzuga bo'lib yozsa, analitik aniqlashadi.
4. **Chop markazi cheklamaydi:** «barcha boblar + hammasini belgilash» = 292
   varaq — printer uchun ogohlantirish kerak (60+ varaqda tasdiq so'rash).
5. **`labTitle` 22/26 mavzuda bo'sh** → simulyator yonida umumiy
   «Interaktiv model» yozuvi. Har mavzuga bir satrli aniq nom foydali.
6. **Ta'lim tizimi bog'lanmagan:** BSB/CHSB sanalari va 102 soatlik kun
   taqvimi platforma ichida yo'q (hozircha `docs/tadqiqot.md`da).
7. **Kirish imtiyozlari (a11y):** `aria-*` va fokus boshqaruvi yo'q; klaviatura
   faqat slaydlarda (← →). Sinf doskasi uchun muammo emas, lekin
   ekranni o'qib beruvchi dastur uchun semantika kuchsiz.
8. **`act.type` hamma joyda `"lab"`** — 7-sinf sxemasiga moslik uchun; kitobdagi
   «model / kuzatish / muhokama» turlarini farqlash keyingi bosqichga qoldi.

## 6. Kuchli tomonlar

- **Bitta fayl, ofline, o'rnatishsiz** — maktab kompyuteri va planshetida ishlaydi,
  GitHub'dan yoki nusxadan ochiladi; hajmi 332 KB.
- **Struktura mashina tasdiqlangan** — platformaning har bir mavzu nomi, beti,
  amaliy ismi kitob mundarijasi bilan qayta solishtiriladi (`npm run verify`).
  Mavzu qamrovi ham shu mundarija bo'yicha hizolangan (10.2, 11.2, 12.1/12.2).
- **Darsning barcha bosqichi bitta oynada:** nazariya → simulyator → o'yin →
  test → amaliy daftara → chop varaqasi. Doskada va qog'ozda parallel yurishadi.
- **26 mavzuning hammasida to'liq material** — bo'sh «tezarda» mavzu yo'q;
  25 simulyator NaN/undefined chiqarmaydi (333 holat sinalgan).
- **Qayta yig'ish oson va xavfsiz:** 4 ta tekshiruv darvozasi, deterministik
  build, kontent — oddiy JSON; `6-sinf.html`ni qo'lda tahrirlash shart emas.
- **Mualliflik huquqi toza:** kitob matni ko'chirilmagan.

## 7. Xulosa

Platforma **maktabda ishlatishga tayyor** (production-ready) va o'z vazifasini
bajaradi: kitobning 12 bobi / 26 mavzusi to'liq qamrab olingan, har mavzuda
dars o'tkazish va baholash uchun material bor, interfeys ishonchli (0 xato),
texnik qarz kichik. Hozirgi holatni **8.5/10** deb baholaymiz: «kontent to'la
va bog'langan, lekin savol banki hali yosh (5 savol/mavzu) va tizimning ikki
tizimi — progress ko'chishi va taqvim — yo'q».

**Keyingi 3 ish (foyda/hajm nisbati bo'yicha):**

1. Variant uzunliklarini tenglashtirish + har mavzuga testni 5→8 savolga
   ko'tarish (baholash sifatini bir pog'ona ko'taradi).
2. «⬇ Progress JSON / ⬆ Tiklash» — 25 qator, sinf↔uy muammosini yopadi.
3. Kun taqvimi moduli: 102 soat, choraklar, BSB 1–5 / CHSB 1–3 sanalari va
   «bugungi dars» ko'rsatkichi (o'qituvchi har darsda ochadigan sahifa).

Ixtiyoriy, keyinroq: bob amaliy ishlarini (2.3, 2.4, 9.3, 10.3) alohida
kartochka qilish, `labTitle`larni to'ldirish, chop markaziga 60+ varaq uchun
tasdiq so'rovi, `aria-label`lar.

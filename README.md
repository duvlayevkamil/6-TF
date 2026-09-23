# 6-TF — 6-sinf «Tabiiy fan» interaktiv platformasi

O'qituvchi uchun 6-sinf Tabiiy fan (Science) darsini yuritish platformasi.
Loyihaning hozirgi bosqichi — **kontent poydevori**: maktablarda o'qilayotgan
ikki kitobning (darslik + mashq daftari) mundarijasi PDF'dan o'qilib,
mashina o'qiydigan struktura (`data/curriculum/6-sinf-science.json`) ga
aylantirildi va kitobning o'zi bilan qayta tekshirildi.

## Kitoblar (strukturaga asos)

| Kitob | Nashr | Hajm |
|-------|-------|------|
| `Darslik.pdf` | NATURE SCIENCE SCHOOLBOOK G6 UZB | 172 bet |
| `Mashq daftari.pdf` | NATURE SCIENCE WORKBOOK G6 UZB | 148 bet |

Ikkalasi ham repozitoriyaning `main` tarmog'ida turibdi; ishchi nusxalar
lokal `sources/` da (`.gitignore` bilan yashirilgan).

## Struktura (mundarijadan tasdiqlangan)

- **12 bob**, **26 mavzu** (N.M), **37 o'rganish savoli**, **10 qism mavzu**
- Har bobda: **Tadqiqotchilik ko'nikmalari** (112 band) va **Ilm-fanning hayotga
  tatbiqi** (23 band) — darslik mundarijasining 2- va 3-ustunlari
- Mashq daftari: **30 amaliy ish** + har bobda boshqotirma, bilimlar xaritasi,
  takrorlash, mustahkamlash (bet raqamlari bilan)

## Konveyer

```
PDF ──(tools/pdf-extract.mjs)──► sahifa matni (JSON)
    ──(tools/lib/pdf-toc.mjs)──► 3 ustunli mundarija o'quvchisi
    ──(tools/extract-toc.mjs)──► data/curriculum/6-sinf-science.json
    ──(tools/verify-curriculum.mjs)──► har bir matn kitobda bormi (tasdiq)
    ──(tools/build-topics.mjs)──► platforma formati (topics-data ormoli)
```

```bash
npm install
npm run verify       # JSON ↔ kitoblar: barcha matn, bet va sanoqlar mosmi
npm run extract:toc  # mundarijadan JSON'ni qayta yasash
npm run topics       # platforma formatidagi mavzu kartalari
npm run extract      # bitta PDF -> sahifa matni (JSON)
npm run selftest     # konveyer ishlayaptimi (namuna PDF bilan)
npm run mundarija    # mundarija ustunlarini ko'z bilan tekshirish
```

Nima uchun ustunlar? Mundarija har sahifada 3 ustunli; oddiy matn oqimida
ular bir-biriga aralashib, savollar va ko'nikmalar noto'g'ri boblarga yozib
qo'yiladi. Shuning uchun itemlar avval Y bo'yicha qatorlarga, so'ng X bo'yicha
ustunlarga bo'linadi (`tools/lib/pdf-toc.mjs`).

## Platforma arxitekturasi

Repozitoriyadagi `7-sinf.html` (Fizika 7 — Interaktiv platforma) namangiz asos
olinadi — yangi texnologiya ixtiro qilinmaydi:

- **bitta HTML fayl**, internet shart emas; ma'lumot — ichida
  `<script id="topics-data" type="application/json">` ormoli;
- `localStorage` (`tabiiy6_progress_v1`): progress, daftarcha, test natijalari va
  kun taqvimi belgilari; boshqa kompyuterga o'tkazish uchun «⬇ Progress JSON /
  ⬆ Tiklash» (fayl tashqarisiga hech narsa chiqmaydi);
- sahifa: `#sidebar` (qidiruv, boblar va mavzular) + `#main` (crumb, 5 tab);
- tablar: 📖 Nazariya · 🔧 Simulyator · 🎡 O'yin · 📝 Test · ✍️ Amaliy topshiriq
  + 📅 Kun taqvimi + 📊 Boshqaruv paneli; har mavzuda 8 savolli test;
- slayd rejimi (`#slides`), bosib chiqarish markazi (`#modal-overlay` →
  `#print-area`): 1 dars yoki butun bob, varaqda 1/2/4 blok;
- mavzu kartasi maydonlari `7-sinf.html` bilan bir xil nomda
  (`d, c, t, theory, formulas, quiz, task, slideQuiz, gameQuiz`), ustiga
  6-sinf uchun: `vocab`, `task.steps/jihoz/xavfsizlik`, `lab`+`labMode`,
  `kitob` (darslik/mashq daftari betlari) va `urinish` (kitobdagi savollar,
  ko'nikmalar, tatbiq).

## Platformani yig'ish va ishga tushirish

```bash
npm install
node tools/build-taqvim.mjs   # kun taqvimi rejasi (platform/content/taqvim.json)
npm run build        # platform/* + data/curriculum → 6-sinf.html (bitta fayl)
npm run serve        # http://localhost:8080/6-sinf.html
npm run content:check # kontent fayllari sxemasi + noto'g'ri yozuv belgilari
node tools/quiz-report.mjs 3 --short   # 3-bob savollarida variant uzunligi balansi
npm run smoke        # JSON orol, id/bog'lanishlar, 25 simulyator holatlari, slaydlar
npm run dom:check    # jsdom'da brauzer sinovi: 26 mavzu × 5 tab, test, slayd, chop
```

O'qituvchi uchun qisqa yo'riqnoma: **`OCHILISH.md`**.

`6-sinf.html` — yig'ilgan mahsulot. uni tahrirlash emas, `platform/` dagi
manbalar tahrirlanadi va `npm run build` qayta yig'adi (fayl Git'da ham
turadi — shuni maktabga berish mumkin).

### `platform/` tarkibi

| Fayl | Vazifa |
|------|--------|
| `platform/index.template.html` | Sahifa qolipi: sidebar, topbar, slaydlar, chop maydoni, `topics-data` ormoli |
| `platform/styles.css` | `7-sinf.html` ranglari va o'lchamlari (amber/cyan, Georgia + Segoe UI) |
| `platform/app.js` | Qobiq: 5 tab, progress, test konstruktori, slaydlar, chop markazi, boshqaruv paneli |
| `platform/labs.js` | 17 turdagi interaktiv simulyator (`lab`+`labMode` bo'yicha) |
| `platform/content/taqvim.json` | Kun taqvimi: 34 hafta × 3 soat = 102 soat (26 mavzu + BSB 1–5 + CHSB 1–3) — `node tools/build-taqvim.mjs` yasadigan fayl |
| `platform/content/bob-01.json … bob-12.json` | 26 mavzuning nazariyasi, formulalari, atamalari, testlari, o'yin va amaliy topshiriqlari — **o'zimiz yozgan matn** |

Kontent `data/curriculum/6-sinf-science.topics.json` (kitob mundarijasi —
tasdiqlangan struktura) bilan birlashtiriladi: mavzu nomi, bobi, betlari va
amaliy ismi kitobdan, o'quv materiali esa `platform/content/` dan keladi.

## Papkalar

| Yo'l | Nima |
|------|------|
| `data/curriculum/6-sinf-science.json` | **Platformaning strukturaviy asosi** (ikkita kitob bog'langan holda) |
| `data/curriculum/6-sinf-science.topics.json` | Shu strukturaning platforma formati (`npm run topics`) |
| `data/curriculum/6-sinf-science.meta.json` | Tahririy qism: kitob tavsifi, arxitektura va platforma talablari — generator shu faylni qo'shadi |
| `data/curriculum/6-sinf-tabiiy-fan.json` | RTM 2022 nashri — faqat qiyos uchun |
| `docs/tadqiqot.md` | Manbalar bo'yicha tadqiqot + arxitektura va modul xaritasi |
| `docs/tahlil.md` | Yig'ilgan platformaning tahlili: qamrov, tezlik, topilgan kamchiliklar va xulosa |
| `sources/` | Kitob PDF lari (lokal, git'da emas) |
| `tools/` | PDF → JSON konveyeri, tekshiruv, kontent/platforma yig'uvchi |
| `platform/` | Platforma manbalari: qolip, CSS, app.js, labs.js, content/ |
| `6-sinf.html` | **Yig'ilgan platforma** — maktabga beriladigan bitta fayl |

## Mualliflik huquqi

Darslik va mashq daftari matni ko'chirilmaydi. Platformada faqat: bob/mavzu
nomlari, bet raqamlari, kitobning qisqa yo'naltiruvchi savoli (havola sifatida),
o'qituvchi o'zi yozgan izoh va topshiriqlar.

## Keyingi qadam

1. `6-sinf.html` yig'ildi: interfeys `7-sinf.html` sxemasi asosida,
   ma'lumot `6-sinf-science.topics.json` + `platform/content/` dan.
2. Kontentni chuqurlashtirish: har mavzuga 2–3 variantli amaliy ish va
   CHSB/BSB turidagi mustahkamlash savollari qo'shish.
3. `labTitle`larni to'ldirish (22/26 mavzuda bo'sh) va chop markaziga 60+
   varaq uchun tasdiq so'rovi qo'shish.
4. Sinovdan o'tkazish: bir guruhda 1 hafta ishlash, `platform/content/` dagi
   matnlarni o'qituvchi bilan birga tahrirlash.

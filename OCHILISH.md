# 6-sinf Tabiiy fan — interaktiv platforma (`6-sinf.html`)

## Tez boshlash

**1-usul (eng oson):** `6-sinf.html` faylini nusxalab oling va brauzerda oching
(ichiga torting yoki ikki marta bosing). Internet, ustun (server), o'rnatish
shart emas. `file://` da ham ishlaydi; faqat progress saqlanishi brauzerning
o'sha holatiga bog'liq bo'lib qoladi.

**2-usul (tavsiflanadi):** loyiha papkasida

```bash
npm install
npm run serve      # http://localhost:8080/6-sinf.html
```

## Tuzilma

| Bo'lim | Nima qiladi |
|--------|-------------|
| 📖 Nazariya | mavzu matni, formulalar, atamalar, kitob betlari; «🎬 Slaydlar» — dars uchun 11 ta blok |
| 🔧 Simulyator | SVG model + slayderlar; har o'lchov «💾 Natijani daftarga» bilan daftarga tushadi |
| 🎡 O'yin | tezkor javob (streak + daraja) va kalit-aniqlagich (atama–ma'no) |
| 📝 Test | har mavzuda **8 savol**; bob/rejim/taymer bo'yicha konstruktor, izohli tekshirish, foiz va baho |
| ✍️ Amaliy topshiriq | bajarish tartibi, jihoz, xavfsizlik, daftarcha jadvali, natija + xulosa |
| 📅 Kun taqvimi | 34 hafta × 3 soat = 102 soat: mavzu haftalari, BSB 1–5, CHSB 1–3, chorak bo'yicha progress; «⚑ Shu haftani 1-hafta qilish», 🖨 varaqa, ⬇ CSV |
| 🖨 Chop markazi | 1 mavzu / bob / barchasi; varaqda 1–2–4 blok; javobli yoki javobsiz |
| 📊 Boshqaruv paneli | progress, ko'nikma bo'yicha xatolar, daftarcha holati, «⬇ Progress JSON / ⬆ Tiklash» |

Progress, daftarcha, test natijalari va taqvim belgilari `localStorage` da
(`tabiiy6_progress_v1`) saqlanadi — faylni o'sha brauzerda qayta ochsangiz
joyida turadi. **Boshqa kompyuterga o'tkazish** uchun: 📊 Boshqaruv paneli →
«⬇ Progress JSON» (faylni saqlang) → ikkinchi kompyuterda «⬆ Tiklash».
Kun taqvimi sanalari o'quv yiliga bog'liq — 📅 tabida «o'quv yili boshi
(dushanba)» kunini bir marta kiritasiz, qolgan barcha sana shundan chiqadi.

## Baholash mezonlari (o'qituvchi qo'yadi, platforma hisoblab beradi)

**Amaliy ish — 8 ball:** jihoz + xavfsizlik 0–1 · jadval/diagramma 0–2 ·
natija (o'lchov, birlik, taqqoslash) 0–2 · xulosa (sabab, isbot) 0–2 ·
kitob ko'nikmasi (kuzatish/tajriba/model/muhokama) 0–1.
→ 7–8 = «5», 5–6 = «4», 3–4 = «3».

**Test:** ≥90% = «5» · ≥75% = «4» · ≥55% = «3».

## Kontentni to'ldirish / tahrirlash

Matnlar `platform/content/bob-01.json … bob-12.json` da. Tahrirlab bo'lgach:

```bash
npm run content:check   # sxema + belgi/typo tekshiruvi
npm run build           # 6-sinf.html qayta yig'iladi
npm run smoke           # bog'lanishlar va simulyatorlar testi
npm run dom:check       # brauzer sinovi (jsdom)
```

Yangi savol yozganda ikkita qoida: (1) to'g'ri javob **eng uzun variant
bo'lmasin** — shovqinli variantlarni ham mazmunan to'ldiring; (2) `izoh`
satri bo'lsin. Tekshirish: `node tools/quiz-report.mjs 3 --short` (3-bob
bo'yicha 1.35× ortiqcha uzunlik farqlari va mavjud savollar ro'yxati).

`6-sinf.html` — yig'ilgan fayl, uni qo'lda tahrirlamang.

## Sinov buyruqlari (repozitoriyda)

```bash
npm run verify          # struktura ↔ kitoblar (mundarija, betlar, sanoqlar)
node tools/check-content.mjs
node tools/smoke-platform.mjs
node tools/dom-smoke.mjs
```

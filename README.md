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
- `localStorage`: progress (`results`, `examResults`), daftarcha, laboratoriya
  holati, savol banki;
- sahifa: `#sidebar` (progress, mavzular ro'yxati, dashboard, print markazi)
  + `#main` (crumb, sarlavha, mezon-chip, tabs, slides);
- tabs: 📖 Nazariya · 🔧 Simulyator · 🎡 O'yin · 📝 Test · ✍️ Amaliy topshiriq;
- bosib chiqarish markazi: bitta dars yoki butun bob, sahifaga 2 yoki 4 slayd.

6-sinf uchun `topics-data` ma'lumoti `npm run topics` bilan yasaladi: maydon
nomlari `7-sinf.html` bilan bir xil (`d, c, t, theory, formulas, quiz, task, act,
slideQuiz, gameQuiz`), ustiga `kitob` (darslik/mashq daftari betlari) va
`urinish` (kitobdagi savollar, ko'nikmalar, tatbiq) qo'shilgan.

`data/curriculum/6-sinf-science.topics.json` — 26 ta mavzu kartasi. `theory`,
`formulas`, `quiz`, `task.a` ataylab **bo'sh**: ularni o'qituvchi yozadi.

## Papkalar

| Yo'l | Nima |
|------|------|
| `data/curriculum/6-sinf-science.json` | **Platformaning strukturaviy asosi** (ikkita kitob bog'langan holda) |
| `data/curriculum/6-sinf-science.topics.json` | Shu strukturaning platforma formati (topics-data ormoli) |
| `data/curriculum/6-sinf-science.meta.json` | Tahririy qism: kitob tavsifi, arxitektura va platforma talablari — generator shu faylni qo'shadi |
| `data/curriculum/6-sinf-tabiiy-fan.json` | RTM 2022 nashri — faqat qiyos uchun |
| `docs/tadqiqot.md` | Manbalar bo'yicha tadqiqot + arxitektura va modul xaritasi |
| `sources/` | Kitob PDF lari (lokal, git'da emas) |
| `tools/` | PDF → JSON konveyeri, tekshiruv va formatga keltirish |

## Mualliflik huquqi

Darslik va mashq daftari matni ko'chirilmaydi. Platformada faqat: bob/mavzu
nomlari, bet raqamlari, kitobning qisqa yo'naltiruvchi savoli (havola sifatida),
o'qituvchi o'zi yozgan izoh va topshiriqlar.

## Keyingi qadam

1. `6-sinf.html` — interfeys `7-sinf.html` sxemasi asosida, ma'lumot
   `6-sinf-science.topics.json` dan.
2. 2025-2026 taqvim-mavzu rejasiga bog'lash (haftasiga 3 soat, 102 soat) va
   BSB/CHSB kunlarini joylashtirish.
3. `theory` / `quiz` / `task` mazmunini o'qituvchi bilan birga to'ldirish.

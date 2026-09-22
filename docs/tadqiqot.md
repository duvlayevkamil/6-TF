# 6-sinf «Tabiiy fan» — manbalar bo'yicha qidiruv natijasi

> **YANGILANGAN (2026-09-23): kitoblar qo'lga kiritildi va struktura ularning
> o'zidan o'qildi.** O'qituvchi bergan fayllar — `Darslik.pdf` va
> `Mashq daftari.pdf` (GitHub repozitoriya, `main` tarmog'i, 9ec3c27). Ular
> «NATURE SCIENCE SCHOOLBOOK G6 UZB» (172PG) va «NATURE SCIENCE WORKBOOK G6 UZB»
> (148PG) nashrlari ekan. **Platformaning strukturaviy asosi:**
> `data/curriculum/6-sinf-science.json` — shu ikki kitobning mundarijasi
> PDF'dan avtomatik o'qilib, `tools/verify-curriculum.mjs` bilan qayta tekshirilgan.
> Quyidagi A qatori (RTM 2022) endi **faqat qiyos uchun** (`6-sinf-tabiiy-fan.json`).

Sana: 2026-09-22 / 2026-09-23. Maqsad: o'qituvchi uchun interaktiv platformani
**haqiqiy o'quv materialiga** (boblar/mavzular, soatlar, baholash, amaliy ishlar) asoslash.

## 0. Asosiy kitob: NATURE SCIENCE 6-sinf (maktablarda o'qilayotgan nashr)

### Kitoblar
| Kitob | Nom (InDesign muhrdan) | Hajm | Fayl |
|-------|------------------------|------|------|
| Darslik | NATURE SCIENCE SCHOOLBOOK G6 UZB, 220×290 mm | 172 bet | `sources/Darslik.pdf` |
| Mashq daftari | NATURE SCIENCE WORKBOOK G6 UZB, 220×290 mm, CMYK | 148 bet | `sources/Mashq daftari.pdf` |

Darslik «Siz tadqiqotchisiz!» (1-bet) bilan ochiladi; mundarija viii–xv betlarda.

### Mundarijaning 3 ustunli tuzilishi (muhim!)
Mundarija sahifasining har yarimbetida **uch ustun** bor. viii betning pastki
qatorida ularning umumiy sarlavhalari chop etilgan:

| Ustun | Nima beradi |
|-------|-------------|
| 1-ustun | `Biologiya, kimyo, fizika, geografiya` — umumiylashtirilgan fan doirasi (har bob uchun alohida berilmagan) + bob/mavzu nomlari va «•» belgisi bilan **o'rganish savollari / qism mavzular** |
| 2-ustun | **Tadqiqotchilik ko'nikmalari** — bob bo'yicha ko'nikmalar ro'yxati (baholash mezonlari uchun tayanch) |
| 3-ustun | **Ilm-fanning hayotga tatbiqi** — kundalik hayot, kasblar, atrof-muhit ta'siri bo'yicha muhokama bandlari |

Bu uchustunlilik oddiy matn chiqarishda buziladi (ustunlar aralashib o'qiladi),
shuning uchun `tools/lib/pdf-toc.mjs` itemlarni avval Y bo'yicha qatorlarga,
so'ng X bo'yicha ustunlarga bo'ladi.

### Tasdiqlangan sanoqlar (`npm run verify` chiqishi)
| Ko'rsatkich | Soni |
|-------------|------|
| Bob (darslik) | **12** |
| Mavzu (N.M kodli) | **26** |
| «Nega bu muhim?» o'rganish savoli | **37** |
| Qism mavzular (savol bo'lmagan «•» bandlar) | **10** |
| Tadqiqotchilik ko'nikmalari bandi | **112** |
| Ilm-fanning hayotga tatbiqi bandi | **23** |
| Mashq daftaridagi amaliy ish | **30** |
| Boshqotirma / Bilimlar xaritasi / Takrorlash / Mustahkamlash | **12 tadan** (har bobda) |

### Boblar va ularning darslikdagi bet oralig'i
| Bob | Nomi | Bet | Mashq daftari (amaliy ish → boshqotirma → takrorlash → mustahkamlash) |
|-----|------|-----|------------------------------------------------------------------------|
| 1 | Ovqat hazm qilish sistemasi | 4–13 | 1.1, 1.2 → 5, 6, 7, 10 |
| 2 | Nafas va qon aylanish sistemalari | 14–31 | 2.1–2.4 → 20, 21, 22, 26 |
| 3 | Kasalliklar | 32–46 | 3.1–3.3 → 35, 36, 37, 40 |
| 4 | Oziq zanjiri va oziq to'ri | 47–59 | 4.1, 4.2 → 45, 46, 47, 49 |
| 5 | Moddaning xossalari | 60–70 | 5.1, 5.2 → 56, 57, 58, 61 |
| 6 | Fizik va kimyoviy o'zgarishlar | 71–86 | 6.1–6.3 → 71, 72, 73, 75 |
| 7 | Kuchlarning ta'siri | 87–97 | 7.1, 7.2 → 82, 83, 84, 86 |
| 8 | Yorug'likning tarqalishi | 98–108 | 8.1, 8.2 → 91, 92, 93, 95 |
| 9 | Elektr zanjirlar | 109–119 | 9.1–9.3 → 102, 103, 104, 107 |
| 10 | Tog' jinslari | 120–131 | 10.1–10.3 → 114, 115, 116, 118 |
| 11 | Tuproq | 132–142 | 11.1, 11.2 → 124, 125, 126, 128 |
| 12 | Quyosh sistemasi | 143– | 12.1, 12.2 → 132, 133, 134, 137 |

`endBet` — keyingi bobning boshlanish betidan olingan (kitobda chop etilmagan).

### Platforma uchun chiqarilgan xulosa
- **Dars birligi = mavzu (N.M)**, kartada: nom, darslik beti, kitobdagi o'rganish
  savollari (darsni muammo bilan ochish uchun aynan shular), qism mavzular.
- **Baholash zinapoyasi kitobda tayyor**: amaliy ish → boshqotirma → takrorlash →
  mustahkamlash. BSB/CHSB slotlarini shu ketma-ketlikka bog'lash mumkin.
- **Ko'nikmalar ro'yxati** (2-ustun) — o'quvchi baholanadigan mezonlar sifatida
  har mavzu kartasiga chiqadi; **tatbiq bandlari** (3-ustun) — «bu hayotda kerakmi?»
  bloki va loyihalar uchun g'oya manbai.
- Mashq daftari betlari — topshiriqni kitobning qaysi betidan olish kerakligini
  ko'rsatish uchun (mualliflik huquqi sababli matn ko'chirilmaydi, havola beriladi).

## 1. Ikki xil «yangi darslik» qatori mavjud — aralashtirmaslik kerak

| # | Qator | Kitob | Nashriyot / yil | Platforma uchun ahamiyati |
|---|-------|-------|-----------------|---------------------------|
| A | **Davlat (rasmiy) qatori** | «Tabiiy fanlar. 6-sinf uchun darslik», K. T. Suyarov va b., 192 bet, **12 bob / 86 mavzu** | Respublika ta'lim markazi, 2022 (Yangi nashr, UNICEF hamkorligida) | Qiyos bazasi. 2025-2026 taqvim-mavzu rejalar aynan shu mundarijaga mos tuzilgan — soatlar va BSB/CHSB kunlarini shu reja beradi |
| B | **Xalqaro (Singapur/Cambridge) qatori** | «NATURE SCIENCE SCHOOLBOOK/WORKBOOK G6 UZB», o'zbek tiliga mahalliylashtirilgan | Novda Edutainment (Marshall Cavendish Education licensiyasi), 2024-08 | **ASOSIY KITOB.** Alohida mashq daftari shu qatorda; struktura `6-sinf-science.json` da |

Xulosa: «mashq daftari» so'rovining javobi — **B qatori** va u endi qo'lدا.
A qatorida mashq daftari alohida kitob sifatida chiqmagan (amaliy va loyiha
ishlari darslik ichida), shuning uchun uning rolini B qatorining mashq daftari bajaradi.

## 2. Topilgan aniq faktlar

### Darslik (A qatori, qiyos uchun)
- Mundarija to'liq o'qildi → `data/curriculum/6-sinf-tabiiy-fan.json`.
- Tuzuvchilar: K. T. Suyarov, Z. B. Sangirova, M. T. Umaraliyeva, S. G'. Xasanova,
  M. K. Yuldasheva, D. T. Hasanova. Xalqaro ekspert: Philippa Gardom Hulme.
- Shartli belgilar: muammoli savol / «bu muhim» / savol-topshiriqlar / uyga vazifa.
- Fizika chizig'i: **2-, 6-, 10-, 11-, 12-boblar** fizikaga oid (NamSPI jurnal
  tahlili). NATURE SCIENCE qatorida ham shunga o'xshash bo'linish: 5–6 (modda,
  o'zgarishlar), 7–9 (kuch, yorug'lik, elektr), 12 (astronomiya).
- Soatlar: haftasiga 3 soat, jami **102 soat** (5-6-sinflar bo'yicha tayanch reja).

### Mashq daftari (B qatori)
- Tasdiqlovchi manba: «Tabiiy fanlardan amaliy mashg'ulotlar to'plami» metodik
  qo'llanmasining adabiyotlar ro'yxati: 5-sinf darslik + 5-sinf mashq daftari,
  6-sinf darslik + **6-sinf mashq daftari** (Aleksandr Grey, Toshkent-2024).
- Singapur Marshall Cavendish to'plami modeli (onlinedu.uz): **darslik + mashq
  daftari + metodik qo'llanma**, elektron versiyada AR, yillik ish rejasini
  tahrirlash, dars ishlanmalari, javoblar kaliti → platformaning ideal modeli.
- Endi bu kitobning o'zi qo'lدا: 30 ta amaliy ish nomi va betlari mundarijadan
  o'qilgan (yuqoridagi jadval).

### Baholash (2025-2026)
- BSB: 1, 2, 3 (demo), 4 (demo), 5 — jami 5 ta nazorat; CHSB: 1, 2, 3 (+ demo variantlar).
- Manbalar: `sor-soch.com/bsb.php?cat=270`, `sor-soch.com/chsb.php?cat=110`, `bsb-chsb.com`.

## 3. Fayllar va havolalar

| Nima | Havola | Holat |
|------|--------|-------|
| Darslik PDF (maktabda o'qilayotgan) | repozitoriyada: `Darslik.pdf` (ildizda) va lokal `sources/Darslik.pdf` | ✅ yuklab olingan, o'qilgan |
| Mashq daftari PDF | repozitoriyada: `Mashq daftari.pdf` | ✅ yuklab olingan, o'qilgan |
| 6-sinf Tabiiy fan darsligi PDF (RTM 2022, 192 b.) | drive.google.com/uc?id=133jck0u-0iOovCobWuo3ofg-085vWZbw&export=download | ✅ o'qildi (qiyos) |
| Test-uz.ru talqih + yuklash sahifasi | https://www.test-uz.ru/book.php?id=519 | ✅ ishlaydi |
| TDPU kutubxonasi | https://elibrary.tdpu.uz/darsliklar/maktab-darsliklari/6-sinf-darsliklar | ✅ mavjud |
| 2025-2026 taqvim-mavzu rejalar (Excel, CHSB/BSB) | https://idum.uz/uz/archives/16801 | ✅ yuklab olish mumkin |
| Metodik qo'llanma (amaliy mashg'ulotlar) | ommalashtirish.uz/backend/api/v2/backend/media/appeals/Metodik_qollanma_JrrsFFX.pdf | ✅ o'qilgan |
| Android ilova «TABIIY FANLAR 6-SINF SCIENCE» | play.google.com/store/apps/details?id=com.Respublikatalimmarkazi.Tabiiyfan6 | ⚠️ raqobatchi tahlili uchun |

## 4. Platforma uchun modul xaritasi (yangilangan)

1. **Mavzu kartasi** — 26 ta mavzu (NATURE SCIENCE), har biri: kod + nom, darslik
   bet oralig'i, kitobdagi o'rganish savollari, qism mavzular, bobning
   tadqiqotchilik ko'nikmalari, tatbiq bandi, mashq daftari havolasi.
2. **Amaliy ishlar reji** — 30 ta amaliy ish (nom + bet), xavfsizlik qoidalari,
   jihozlar ro'yxati, baholash rubrikasi.
3. **Baholash zinapoyasi** — har bobda boshqotirma → takrorlash → mustahkamlash
   uchun alohida rejim; BSB/CHSB slotlariga bog'langan.
4. **Mashq banki** — o'qituvchi to'ldiradigan topshiriqlar (kitob matni
   ko'chirilmaydi), turkumlar: kuzatish, tajriba, model, jadval/diagramma,
   kalit-aniqlagich, muhokama.
5. **Kun taqvimi** — 102 soat / 4 chorak, BSB-1..5 va CHSB-1..3 sanalari.
6. **Sinf jurnali + analitika** — ko'nikma (2-ustun) bo'yicha progress:
   112 ta ko'nikma bandi mezon sifatida.
7. **Ustozlik resursi** — metodik qo'llanma va tayyor dars ishlanmalariga havola.

## 5. Muammolar / cheklovlar

- **Mualliflik huquqi:** darslik va mashq daftari matnini ko'chirish mumkin emas.
  Ruxsat etilgan: bob/mavzu nomlari, bet raqamlari, kitobning qisqa yo'naltiruvchi
  savoli (havola sifatida), o'qituvchi o'zi yozgan izoh va topshiriqlar.
- Mundarijadagi ko'nikmalar ro'yxati **bob darajasida** berilgan; mavzuga
  bog'lash o'qituvchi ixtiyorida (JSON'da ham shunday saqlangan).
- Bob 1 ning «Ilm-fanning hayotga tatbiqi» ro'yxati kitobda bo'sh — bu HTML
  PDF koordinatalari bilan tasdiqlangan, xato emas.
- Full lesson matni (darslik bahslari) hali berilmagan: hozircha faqat mundarija
  o'qilgan. To'liq sahifa matni kerak bo'lsa, `tools/pdf-extract.mjs` tayyor.

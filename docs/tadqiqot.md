# 6-sinf «Tabiiy fan» — manbalar bo'yicha qidiruv natijasi

> **YANGILANGAN (2026-09-22):** o'qituvchi ko'rsatmasiga ko'ra **asosiy kitoblar** —
> Drive papkasidagi `SCIENCE G6 UZB.pdf` (darslik) va `SCIENCE WORKBOOK G6 UZB.pdf`
> (mashq daftari): https://drive.google.com/drive/folders/1HFjpNGOQntClBv1Ek-TBeAexT9DuZ3-o
> Bu papka hozircha yopiq (login so'raydi) — kirish ochilgach yoki fayllar chatga
> tashlangach, `data/curriculum/*.json` shu **ikki kitobning real strukturasi** asosida
> qayta yoziladi. Quyidagi A qatori (RTM 2022) — vaqtinchalik tayanch/solishtiruv.
> Yuklab olish qudasini `tools/pdf-extract.mjs` (PDF → sahifa matni → JSON) o'zi
> `npm run selftest` bilan tekshirilgan holda tayyor turibdi; `sources/README.md` ga qarang.

Sana: 2026-09-22. Maqsad: o'qituvchi uchun interaktiv platformani **haqiqiy o'quv materialsi**ga
(boblar/mavzular, soatlar, baholash, amaliy ishlar) asoslash.

## 1. Ikki xil «yangi darslik» qatori mavjud — aralashtirmaslik kerak

| # | Qator | Kitob | Nashriyot / yil | Platforma uchun ahamiyati |
|---|-------|-------|-----------------|---------------------------|
| A | **Davlat (rasmiy) qatori** | «Tabiiy fanlar. 6-sinf uchun darslik», K. T. Suyarov va b., 192 bet, **12 bob / 86 mavzu** | Respublika ta'lim markazi, 2022 (Yangi nashr, UNICEF hamkorligi) | Asosiy tayanch: 2025-2026 taqvim-mavzu rejalari aynan shu mundarijaga mos (1-dars «Tabiiy fanlarning tadqiqot obyekti», 2-dars «Ilmiy tadqiqotni rejalashtirish»…) |
| B | **Xalqaro (Cambridge/Singapur) qatori** | «Tabiiy fanlar 6-sinf» darslik **+ mashq daftari**, Aleksandr Grey | Novda Edutainment (Marshall Cavendish Education licensiyasi, o'zbek tiliga tarjima + mahalliylashtirilgan), 2024 | Alohida **mashq daftari** shu qatorda bor; topshiriqlar turkumlari (kuzatish, tajriba, freqventlik diagrammasi) va javoblar kaliti bilan keladi |

Xulosa: «mashq daftari» so'roviga rasmiy javob — **B qatori** (Grey/Novda). A qatorida
mashq daftari alohida kitob sifatida chiqmagan, amaliy va loyiha ishlari darslik ichida.

## 2. Topilgan aniq faktlar

### Darslik (A qatori)
- Mundarija to'liq o'qildi → struktura `data/curriculum/6-sinf-tabiiy-fan.json` faylida.
- Tuzuvchilar: K. T. Suyarov, Z. B. Sangirova, M. T. Umaraliyeva, S. G'. Xasanova,
  M. K. Yuldasheva, D. T. Hasanova. Xalqaro ekspert: Philippa Gardom Hulme.
- Shartli belgilar: muammoli savol / «bu muhim» / savol-topshiriqlar / uyga vazifa.
- Har bob oxirida: «Bob yuzasidan mantiqiy fikrlashga yo'naltiruvchi topshiriqlar».
- Fizika chizig'i: **2-, 6-, 10-, 11-, 12-boblar** fizikaga oid (NamSPI jurnal tahlili).
  Bu — fizika o'qituvchisi uchun «o'z» moduli sifatida ajratishga asos.
- Soatlar: haftasiga 3 soat, jami **102 soat** (5-6-sinflar bo'yicha tayanch reja).
  2025-2026 o'quv yilida 5-6-sinflarda fanni fizika/biologiya/geografiya o'qituvchilari o'tadi.

### Mashq daftari (B qatori)
- Tasdiqlovchi manba: «Tabiiy fanlardan amaliy mashg'ulotlar to'plami» metodik qo'llanmasining
  adabiyotlar ro'yxati: 5-sinf darslik + 5-sinf mashq daftari, 6-sinf darslik + **6-sinf mashq daftari**
  (Aleksandr Grey, Toshkent-2024).
- Singapur Marshall Cavendish o'quv to'plami tuzilishi (onlinedu.uz slaydlari):
  **darslik + mashq daftari + o'qituvchi uchun metodik qo'llanma**, elektron versiyada AR
  imkoniyati, yillik ish reja (tahrirlanadigan), dars ishlanmalari (PDF), darslik va mashq
  daftari topshiriqlari javoblari. → Platformaning ideal «kitobxonlik» modeli shu.
- Ochiq PDF nusxa topilmadi (bosma). Yechim: platforma mashq daftari funksiyasini
  **o'qituvchi o'zi to'ldiradigan** topshiriq banki sifatida quriladi (PDF/fayl yuklab,
  mavzuga bog'lab).

### Baholash (2025-2026)
- BSB: 1, 2, 3 (demo), 4 (demo), 5 — jami 5 ta nazorat; CHSB: 1, 2, 3 (+ demo variantlar).
- Manbalar: `sor-soch.com/bsb.php?cat=270`, `sor-soch.com/chsb.php?cat=110`, `bsb-chsb.com`.
- 2024-2025 uchun ham BSB 1-7 va CHSB-1..3 to'plamlari bor (format aralash: test + og'zaki + amaliy).

## 3. Fayllar va havolalar (yuklab olish mumkin bo'lganlar)

| Nima | Havola | Holat |
|------|--------|-------|
| 6-sinf Tabiiy fan darsligi PDF (192 b., to'liq) | drive.google.com/uc?id=133jck0u-0iOovCobWuo3ofg-085vWZbw&export=download | ✅ o'qildi |
| Test-uz.ru talqih + yuklash sahifasi | https://www.test-uz.ru/book.php?id=519 | ✅ ishlaydi |
| Rus tilidagi versiya («Естественные науки») | https://www.test-uz.ru/book.php?id=504 | ✅ mavjud |
| TDPU kutubxonasi: «6-sinf Tabiiy fan.pdf» | https://elibrary.tdpu.uz/darsliklar/maktab-darsliklari/6-sinf-darsliklar | ✅ mavjud |
| O'qituvchi uchun «Tabiiy fanlar» metodika darsligi (test-uz) | https://www.test-uz.ru/book.php?id=530 | ✅ mavjud |
| 6-sinf nazorat ishi daftari (1-8 nazorat ishlari, to'plam) | fliphtml5.com/enfdn/jewu + t.me/oltinchisinflar (PDF 2.7 MB) | ✅ bepul nusxa bor |
| Tabiiy fan (Science) 2025-2026 taqvim-mavzu rejalar (Excel, CHSB/BSB) | https://idum.uz/uz/archives/16801 | ✅ yuklab olish mumkin |
| Android ilova «TABIIY FANLAR 6-SINF SCIENCE | Multimediali» | play.google.com/store/apps/details?id=com.Respublikatalimmarkazi.Tabiiyfan6 | ⚠️ raqobatchi tahlili uchun |
| 5-sinf Grey darsligi fragmenti (59 bet preview) | collegesidekick.com/study-docs/21621093 | ⚠️ qisman ochiladi |

## 4. Platforma uchun tavsiya qilingan modul xaritasi

1. **Mavzu kartasi** — 86 ta mavzu, har biri: ta'riflar bloki, muammoli savol,
   «bu muhim», tajriba/virtual laboratoriya, uyga vazifa, darslik betiga havola (p.6…p.190).
2. **Amaliy ish va loyihalar reji** — 24 ta amaliy + 9 ta loyiha ishi (darslikdagi ro'yxat
   asosida), xavfsizlik qoidalari, baholash rubrikasi bilan.
3. **Test/mashq banki** — BSB/CHSB formatlariga mos: bir tanlovli, ko'p tanlovli,
   juftlash, jadval to'ldirish, grafik chizish, hisob (zichlik, masshtab, o'rtacha qiymat).
4. **Fizika chizig'i filtri** — 2/6/10/11/12-boblar bo'yicha alohida ko'rinish
   (fizika o'qituvchisi uchun).
5. **Kun taqvimi** — 102 soat / 4 chorak, BSB-1..5 va CHSB-1..3 sanalarini avtomatik qo'yish.
6. **Sinf jurnali + analitika** — o'quvchi progressi, xatolar analizi, 100 ballik shkala.
7. **Ustozlik resursi** — o'qituvchi metodik qo'llanmasi va tayyor dars ishlanmalariga havola.

## 5. Muammolar / cheklovlar

- **Mualliflik huquqi:** darslik matnini to'liq kopyalash mumkin emas. Ruxsat etilgan:
  bob/mavzu nomlari, bet raqamlari, o'qituvchi o'zi yozgan izoh va topshiriqlar,
  darslikka **havola** (siljish). Shu rejaga asoslangan holda quriladi.
- Mashq daftari (B qatori) raqamli nusxasi ochiq emas → topshiriqni o'qituvchi kiritadi yoki
  biz avt generator orqali yaratamiz.
- Aynan «qaysi maktablarda Grey/Novda kitobi o'qitilishi» rasmiy ro'yxatdan tasdiqlanmadi
  (buning uchun vazirlik buyruqi / tasdiqlangan darsliklar reyestri kerak).

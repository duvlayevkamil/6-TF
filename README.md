# 6-TF — 6-sinf «Tabiiy fan» interaktiv platformasi

O'qituvchi uchun 6-sinf Tabiiy fan (Science) darsini yuritish platformasi.
Loyihaning hozirgi bosqichi — **kontent poydevori**: maktablarda o'qilayotgan
ikki kitobning (darslik + mashq daftari) mundarijasi PDF'dan o'qilib,
mashina o'qiydigan struktura (`data/curriculum/6-sinf-science.json`) ga aylantirildi.

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
  tatbiqi** (23 band) — darslikning 2- va 3-ustunlari
- Mashq daftari: **30 amaliy ish** + har bobda boshqotirma, bilimlar xaritasi,
  takrorlash, mustahkamlash (bet raqamlari bilan)

## Konveyer

```
PDF ──(tools/pdf-extract.mjs)──► sahifa matni (JSON)
    ──(tools/lib/pdf-toc.mjs)──► 3 ustunli mundarija o'quvchisi
    ──(tools/extract-toc.mjs)──► data/curriculum/6-sinf-science.json
    ──(tools/verify-curriculum.mjs)──► har bir matn kitobda bormi (tasdiq)
```

```bash
npm install
npm run verify       # JSON ↔ kitoblar: barcha matn, bet va sanoqlar mosmi
npm run extract:toc  # mundarijadan JSON'ni qayta yasash
npm run extract      # bitta PDF -> sahifa matni (JSON)
npm run selftest     # konveyer ishlayaptimi (namuna PDF bilan)
npm run mundarija    # mundarija ustunlarini ko'z bilan tekshirish
```

Nima uchun ustunlar? Mundarija har sahifada 3 ustunli; oddiy matn oqimida
ular bir-biriga aralashib, savollar va ko'nikmalar noto'g'ri boblarga yozib
qo'yiladi. Shuning uchun itemlar avval Y bo'yicha qatorlarga, so'ng X bo'yicha
ustunlarga bo'linadi (`tools/lib/pdf-toc.mjs`).

## Papkalar

| Yo'l | Nima |
|------|------|
| `data/curriculum/6-sinf-science.json` | **Platformaning strukturaviy asosi** (ikkita kitob bir-biriga bog'langan holda) |
| `data/curriculum/6-sinf-science.meta.json` | Tahririy qism: kitob tavsifi, platforma talablari — generator shu faylni qo'shadi |
| `data/curriculum/6-sinf-tabiiy-fan.json` | RTM 2022 nashri — faqat qiyos uchun |
| `docs/tadqiqot.md` | Manbalar bo'yicha tadqiqot + modul xaritasi |
| `sources/` | Kitob PDF lari (lokal, git'da emas) |
| `tools/` | PDF → JSON konveyeri va tekshiruvlar |

## Mualliflik huquqi

Darslik va mashq daftari matni ko'chirilmaydi. Platformada faqat: bob/mavzu
nomlari, bet raqamlari, kitobning qisqa yo'naltiruvchi savoli (havola sifatida),
o'qituvchi o'zi yozgan izoh va topshiriqlar.

## Keyingi qadam

Struktura tasdiqlangan — endi uni 2025-2026 o'quv yili taqvim-mavzu rejasiga
(haftasiga 3 soat, 102 soat) va BSB/CHSB slotlariga bog'lash; undan keyin
platformaning o'zi (mavzu kartalari, amaliy ish sahifalari, baholash).

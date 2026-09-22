# sources/ — kitob PDF lari (lokal)

Bu papka `.gitignore` da (`sources/*.pdf`), ya'ni katta fayllar git'ga tushmaydi.

| Fayl | Haqiqiy nomi (kitob muhridan) | Hajm |
|------|------------------------------|------|
| `Darslik.pdf` | NATURE SCIENCE SCHOOLBOOK G6 UZB (220×290, 172PG) | mundarija: 8 PDF bet |
| `Mashq daftari.pdf` | NATURE SCIENCE WORKBOOK G6 UZB (220×290, 148PG, CMYK) | mundarija: 3 PDF bet |

Ikkalasi ham repozitoriyaning `main` tarmog'ida turibdi, shuning uchun lokal
nusxa shu yo'l bilan olinadi:

```bash
git fetch origin main
git show "origin/main:Darslik.pdf" > "sources/Darslik.pdf"
git show "origin/main:Mashq daftari.pdf" > "sources/Mashq daftari.pdf"
```

## Qanday qilib kelib chiqdi (2026-09-23)

1. Google Drive papkasi (`drive.google.com/drive/folders/1HFjpNGOQntClBv1Ek-TBeAexT9DuZ3-o`)
   yopiq chiqdi — `fetch_page` login devoriga urildi, `embeddedfolderview` 500 qaytardi.
2. Chatga ilova qilish usuli ishlamadi (`/home/user/uploads` yaratilmadi).
3. **Ishlagan yo'l:** foydalanuvchi fayllarni to'g'ridan-to'g'ri GitHub repozitsiyasiga
   (`main`) yukladi; biz ularni `git show origin/main:<fayl>` bilan oldik.
   Demak, keyingi fayllar ham shu yo'l bilan keladi — repozitoriyaga tashlang,
   biz `git fetch` qilamiz.

## Yangi nusxa kelsa nima qilish kerak

```bash
# 1) faylni sources/ ga qo'yish (yuqoridagi git show usuli)
# 2) strukturani qayta yasash va tekshirish
npm run extract:toc   # data/curriculum/6-sinf-science.json
npm run verify        # har bir matn kitobda bormi?
```

Mundarija sahifalari dan tashqari to'liq matn kerak bo'lsa:

```bash
node tools/pdf-extract.mjs "sources/Darslik.pdf" data/raw/darslik.json
node tools/debug-page.mjs "sources/Darslik.pdf" 12   # koordinatalar bilan (bir bet)
```

Manbalar: foydalanuvchi bergan fayllar (`SCIENCE G6 UZB.pdf` /
`SCIENCE WORKBOOK G6 UZB.pdf` nomi bilan Drive'da edi) va ularning
repozitoriyadagi `Darslik.pdf` / `Mashq daftari.pdf` ko'rinishi.

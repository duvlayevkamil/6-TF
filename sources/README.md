# sources/ — darslik va mashq daftari fayllari

Bu papkaga 6-sinf SCIENCE kitoblarining PDF nusxasi qo'yiladi (git'ga tushmaydi,
`.gitignore` da `sources/*.pdf`):

| Fayl nomi | Nima |
|-----------|------|
| `SCIENCE G6 UZB.pdf` (darslik) | Asosiy darslik — bob/mavzu strukturasi, atamalar, amaliy ishlar |
| `SCIENCE WORKBOOK G6 UZB.pdf` | Mashq daftari — topshiriq turlari va mashqlar banki |

Manba: https://drive.google.com/drive/folders/1HFjpNGOQntClBv1Ek-TBeAexT9DuZ3-o

## Qanday qilib fayllarni olish

1) **Eng ishonchli yo'l — chatga ilova qilish.** PDF larni shu suhbatga
   tortib tashlasangiz, ular avtomatik ravishda `/home/user/6-TF` ichiga
   tushadi va keyin `sources/` ga ko'chiramiz.

2) **Google Drive orqali.** Papka hozir yopiq (login so'rayapti).
   Ochish uchun: papkani «Ulashish» → **«Havolani bilgan barcha ishtirokchilar — Ko'ruvchi»**
   qiling. Yoki har bir fayl uchun alohida havola oling:
   `https://drive.google.com/file/d/<FILE_ID>/view` — shu FILE_ID ni yuborsangiz,
   faylni to'g'ridan-to'g'ri o'qiy olaman (chunki katta PDF larning faqat
   dastlabki ~30 beti ochiladi, bu usul mundarija uchun yetarli,
   lekin to'liq matn uchun 1-variant kerak).

## Keyin nima bo'ladi

```bash
npm install
node tools/pdf-extract.mjs "sources/SCIENCE G6 UZB.pdf" data/raw/darslik.json
node tools/pdf-extract.mjs "sources/SCIENCE WORKBOOK G6 UZB.pdf" data/raw/workbook.json
```

So'ng `data/curriculum/6-sinf-science.json` fayli shu ikki kitobning
real strukturasi (unit/bob, mavzu, bet raqami, topshiriq turlari) asosida
qayta yoziladi — hozirgi `6-sinf-tabiiy-fan.json` vaqtinchalik tayanch.

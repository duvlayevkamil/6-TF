import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { norm } from './text.mjs';

/**
 * Kitobning «Mundarija» sahifalarini o'qiydi.
 *
 * NATURE SCIENCE 6-sinf darsligida mundarija sahifasi 3 ustunli:
 *   ustun 1 — bob / mavzu nomi / o'rganish savollari va qism mavzular («•»)
 *   ustun 2 — «Tadqiqotchilik ko'nikmalari»
 *   ustun 3 — «Ilm-fanning hayotga tatbiqi»
 * Mashq daftari mundarijasi esa bitta keng ustunli («nom ...... bet»), shuning
 * uchun u yerda edges=[] (hammasi 1-ustunga tushadi).
 *
 * Itemlar avval Y bo'yicha vizual qatorlarga yig'iladi (qo'shni qatorlar orasi
 * ~12pt, bir qator ichidagi farq ~3pt), so'ng har qator ichida X bo'yicha
 * ustunlarga bo'linadi.
 */
export const TOC_IGNORE = [
  /NATURE SCIENCE/i,
  /\.indd/i,
  /^\d{2}\/\d{2}\/\d{2}\s?/,
  /^\d{1,2}:\d{2}(:\d{2})?$/,
  /^[ivxlcdm]{1,4}$/i,
  /^\s*(\d+)\s+\1\s*$/,
  /^\d+(\s+\d+)*$/,
  /^(Umida|Aziza|Akmal|Jasur|Sardor|Doniyor|Nilufar|Shahzod)$/i,
  /^(Bilimlar olamiga|biz bilan qiziqarli|sayohat qilishga|tayyormisiz\?)$/i,
  /^Tadqiqotchilik ko[‘'’`']nikmalari$/i,
  /^Ilm-fanning hayotga tatbiqi$/i,
  /^Biologiya, kimyo, fizika,?$/i,
  /^geografiya$/i,
  /^Mundarija$/i,
];

const LEADER = /\.{2,}|…{2,}/;

/**
 * Ixchim (PDF'da so'z o'rtasi uzilib qolgan bo'limlarni qayta ulash).
 * Kitobdan olingan qatorda «o‘zgari shini» kabi ko'rinish payt bo'ladi —
 * chunki qo'shimcha alohida item bo'lib chiqqan. Ro'yxatga faqat o'zbek
 * tilida MUSTAQIL so'z bo'lmaydigan qo'shimchalar kiritildi.
 */
/**
 * Ixchim — PDF'da so'z o'rtasi uzilib qolgan bo'laklarni qayta ulash.
 * Masalan kitob qatorida «o‘zgari shini» deb chiqadi (qo'shimcha alohida item
 * bo'lib ketgan). Ro'yxatga faqat o'zbek tilida MUSTAQIL so'z bo'lmaydigan
 * qo'shimchalar kiritilgan, shuning uchun biriktirish xavfsiz.
 */
const TIDY = /([a-zá-ÿʻ'’`])\s+(shini|shi|si|ni|lari|lar|ning|dan|tan|ga|qa|da|ta)(?=[\s.,;:!?»„“”()\\/]|$)/giu;
export const tidy = (s) => String(s).replace(TIDY, '$1$2');

export const cut = (t) => tidy(String(t).replace(/\s*[.…]{2,}.{0,80}$/, '')).replace(/\s+/g, ' ').trim();

export async function readToc(pdfPath, { edges = [266, 431], gap = 5, ignore = TOC_IGNORE } = {}) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;
  const colOf = (x) => {
    for (let i = 0; i < edges.length; i++) if (x < edges[i]) return i;
    return edges.length;
  };
  const skip = (s) => ignore.some((re) => re.test(s));
  const pages = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = [];
    for (const it of tc.items) {
      const s = ('str' in it && it.str.replace(/\s+/g, ' ').trim()) || '';
      if (!s || skip(s)) continue;
      items.push({ x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), s });
    }
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    let cur = null;
    for (const it of items) {
      if (!cur || cur.y - it.y > gap) {
        cur = { y: it.y, cols: Array(Math.max(edges.length + 1, 1)).fill(0).map(() => []) };
        rows.push(cur);
      }
      cur.cols[colOf(it.x)].push(it);
    }
    const rowObjs = rows.map((r) => ({
      y: r.y,
      cols: r.cols.map((arr) => arr.sort((a, b) => a.x - b.x).map((k) => k.s).join(' ').trim()),
    }));
    const nCol = Math.max(edges.length + 1, 1);
    const columns = Array.from({ length: nCol }, (_, ci) => rowObjs.map((r) => r.cols[ci]).filter(Boolean));
    pages.push({ page: p, rows: rowObjs, columns });
  }
  return { numPages: doc.numPages, pages, edges };
}

/**
 * Qidiruv uchun matnlar: har ustun uzluksiz o'qiladi (o'ralgan satrlar shu
 * yo'l bilan tiklanadi). Natija — normallashtirilgan satrlar ro'yxati.
 */
export function tocHays({ pages }) {
  return pages.flatMap((p) =>
    p.columns.map((lines) =>
      norm(
        lines
          .map((l) => (LEADER.test(l) ? cut(l) : tidy(l)))
          .join('')
      )
    )
  );
}

/** Butun mundarija matnining normallashtirilgan hujjati. */
export function tocHay(toc) {
  return tocHays(toc).join('');
}

/** Qatorlar ro'yxati (mashq daftari kabi oddiy tuzilma uchun qulay). */
export function tocLines({ pages }) {
  return pages.flatMap((p) => p.rows.flatMap((r) => r.cols).filter(Boolean).map(tidy));
}

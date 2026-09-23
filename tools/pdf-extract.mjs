#!/usr/bin/env node
/**
 * PDF -> JSON konveyer (darslik / mashq daftari uchun).
 *
 * Ishlatish:
 *   node tools/pdf-extract.mjs "sources/SCIENCE G6 UZB.pdf" data/raw/darslik.json
 *
 * Chiqish:
 *   { source, pages, meta, text, pageTexts:[{page,text}] }
 *
 * Nima uchun sahifama-sahifa? Mundarija (Contents) odatda dastlabki 10 betda
 * bo'ladi, har bir unit/mavzu esa PDF bet raqami bilan qayd etiladi — shu
 * orqali platformada «kitobda 42-bet» havolasini beramiz.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [inPdf, outJson] = process.argv.slice(2);

if (!inPdf || !outJson) {
  console.error("Ishlatish: node tools/pdf-extract.mjs <fayl.pdf> <chiqish.json>");
  process.exit(1);
}
if (!fs.existsSync(inPdf)) {
  console.error(`Topilmadi: ${inPdf}`);
  console.error("Kitob PDF larini avval sources/ papkasiga qo'ying (qarang: sources/README.md).");
  process.exit(1);
}

const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(inPdf)), useSystemFonts: true }).promise;
const pageTexts = [];

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  // Bir xil Y koordinatasidagi itemlarni bitta qatorga birlashtiramiz
  const rows = new Map();
  for (const it of tc.items) {
    if (!('str' in it) || !it.str.trim()) continue;
    const y = Math.round(it.transform[5]);
    rows.set(y, (rows.get(y) ?? []).concat({ x: it.transform[4], s: it.str }));
  }
  const text = [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, items]) => items.sort((a, b) => a.x - b.x).map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim())
    .join('\n');
  pageTexts.push({ page: p, text });
}

const out = {
  source: path.basename(inPdf),
  pages: doc.numPages,
  meta: (doc.info ?? {}) && { title: doc.info?.Title, author: doc.info?.Author },
  text: pageTexts.map((p) => `\n===== [PDF bet ${p.page}] =====\n${p.text}`).join('\n'),
  pageTexts,
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(out, null, 2));
const chars = out.text.length;
console.log(`OK  ${out.source}: ${out.pages} bet, ${chars} belgi -> ${outJson}`);
console.log(`    Namuna (1-bet): ${JSON.stringify(pageTexts[0]?.text?.slice(0, 120) ?? '')}`);

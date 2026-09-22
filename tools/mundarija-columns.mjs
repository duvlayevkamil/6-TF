#!/usr/bin/env node
/**
 * Mundarija ustunlarini ko'z bilan tekshirish uchun chizib beradi.
 * Ishlatish: node tools/mundarija-columns.mjs "sources/Darslik.pdf"
 *           node tools/mundarija-columns.mjs "sources/Mashq daftari.pdf" single
 */
import fs from 'node:fs';
import { readToc } from './lib/pdf-toc.mjs';

const [inPdf, mode] = process.argv.slice(2);
if (!inPdf || !fs.existsSync(inPdf)) {
  console.error("Ishlatish: node tools/mundarija-columns.mjs <fayl.pdf> [single]");
  process.exit(1);
}
const toc = await readToc(inPdf, mode === 'single' ? { edges: [] } : { edges: [266, 431] });
for (const p of toc.pages) {
  console.log(`\n########## PDF bet ${p.page} ##########`);
  p.columns.forEach((lines, i) => {
    if (!lines.length) return;
    console.log(`\n--- ustun ${i + 1} ---`);
    lines.forEach((l) => console.log(l));
  });
}

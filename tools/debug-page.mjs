import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
// Ishlatish: node tools/debug-page.mjs <fayl.pdf> <bet-raqami>
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])) }).promise;
const page = await doc.getPage(Number(process.argv[3]));
const tc = await page.getTextContent();
const rows = new Map();
for (const it of tc.items) {
  const s = ('str' in it && it.str.trim()) || '';
  if (!s) continue;
  const key = Math.round(it.transform[5] / 3) * 3;
  rows.set(key, (rows.get(key) ?? []).concat({ x: Math.round(it.transform[4]), s, h: Math.round(it.height) }));
}
for (const [y, arr] of [...rows.entries()].sort((a,b)=>b[0]-a[0])) {
  arr.sort((a,b)=>a.x-b.x);
  console.log(String(Math.round(y)).padStart(4), '|', arr.map(k=>`x${k.x}:${k.s}`).join('  '));
}

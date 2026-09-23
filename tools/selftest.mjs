#!/usr/bin/env node
/**
 * selftest: konveyer ishlayotganini tekshirish uchun 3 betli namunaviy PDF
 * yasaydi, uni tools/pdf-extract.mjs orqali o'qiydi va natijani solishtiradi.
 * Haqiqiy kitoblar bo'lmaganida ham pipeline tayyor turishini tasdiqlaydi.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const esc = (s) => s.replace(/([()\\])/g, '\\$1');

// Obyekt tartibi: 1=Root, 2=Pages, 3=Font, 4..6=Page, 7..9=Contents
function contentStream(lines) {
  let y = 700;
  return lines
    .map((l) => {
      const s = `BT /F1 12 Tf 72 ${y} Td (${esc(l)}) Tj ET`;
      y -= 20;
      return s;
    })
    .join('\n');
}

const pages = [
  ['CONTENTS', 'Unit 6A  Scientists measure things .... 4', 'Unit 6B  States of matter ........... 18'],
  ['Unit 6A  Scientists measure things', 'Key words: length, volume, mass', 'Activity 6A.2 - Measure the volume of a stone'],
  ['Unit 6B  States of matter', 'Exercise 1: Circle the correct word.', 'Workbook reference: WB 6B.1'],
];

const objs = [];
objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i} 0 R`).join(' ')}] /Count ${pages.length} >>`;
objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
pages.forEach((lines, i) => {
  objs[4 + i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${7 + i} 0 R >>`;
});
pages.forEach((lines, i) => {
  const body = contentStream(lines);
  objs[7 + i] = `<< /Length ${Buffer.byteLength(body, 'latin1')} >>\nstream\n${body}\nendstream`;
});

let pdf = '%PDF-1.4\n';
const offsets = [0];
for (let i = 1; i < objs.length; i++) {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`;
}
const xrefAt = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
pdf += offsets
  .slice(1)
  .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
  .join('');
pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;

fs.mkdirSync('/tmp/selftest', { recursive: true });
const pdfPath = '/tmp/selftest/sample.pdf';
const jsonPath = '/tmp/selftest/sample.json';
fs.writeFileSync(pdfPath, pdf, 'latin1');

try {
  const out = execFileSync('node', ['tools/pdf-extract.mjs', pdfPath, jsonPath], { encoding: 'utf8' });
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const ok =
    data.pages === 3 &&
    data.pageTexts[0].text.includes('CONTENTS') &&
    data.pageTexts[1].text.includes('Activity 6A.2') &&
    data.pageTexts[2].text.includes('WB 6B.1');
  console.log(out.trim());
  console.log(ok ? 'SELFTEST: OK — PDF -> sahifa matni -> JSON konveyer ishlayapti.' : 'SELFTEST: XATO — o\'qilgan matn kutilmagan.');
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('SELFTEST: XATO\n' + (e.stdout ?? '') + (e.stderr ?? ''));
  process.exit(1);
}

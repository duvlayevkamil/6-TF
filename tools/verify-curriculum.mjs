#!/usr/bin/env node
/**
 * data/curriculum/6-sinf-science.json — platformaning strukturaviy asosi —
 * haqiqiy kitob PDF lari bilan qayta tekshiriladi.
 *
 *  1. DARSLIK: JSON dagi har bir bob/mavzu nomi, o'rganish savoli, qism mavzu,
 *     tadqiqotchilik ko'nikmasi va tatbiq bandi mundarijada ANIQ topilishi kerak.
 *     Shuningdek kitobdan o'qilgan mavzu kodlari va boblar to'plami JSON bilan
 *     bir xil bo'lishi shart.
 *  2. MASHQ DAFTARI: mundarija qatorlari mustaqil qayta parsesilinadi va har bir
 *     amaliy ish (nom + bet hamda boshqotirma / bilimlar xaritasi / takrorlash /
 *     mustahkamlash betlari) JSON bilan solishtiriladi.
 *  3. meta.hisob sanoqlari va bet tartibi.
 *
 * Ishlatish: npm run verify
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readToc, tocLines } from './lib/pdf-toc.mjs';
import { norm } from './lib/text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const find = (n) => {
  for (const p of [path.join(ROOT, 'sources', n), path.join(ROOT, n)]) if (fs.existsSync(p)) return p;
  throw new Error(`Topilmadi: ${n} (sources/ ga qo'ying)`);
};

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'curriculum', '6-sinf-science.json'), 'utf8'));
const D = await readToc(find('Darslik.pdf'), { edges: [266, 431] });
const W = await readToc(find('Mashq daftari.pdf'), { edges: [] });

// Darslik: ustunlar uzluksiz o'qiladi (satr o'ralgan joylar shu bilan tiklanadi)
const dHays = D.pages.flatMap((p) => p.columns.map((lines) => norm(lines.join(''))));
const dAll = norm(D.pages.flatMap((p) => p.columns.flat()).join(''));

const fail = [];
const has = (needle, where) => {
  const n = norm(needle);
  if (!n) return;
  if (dAll.includes(n) || dHays.some((h) => h.includes(n))) return;
  fail.push(`${where} -> "${needle}"`);
};

for (const b of cur.boblar) {
  has(b.nomi, `bob ${b.id}.nomi`);
  has(`${b.id}-bob`, `bob ${b.id}.nomeri`);
  if (b.startBet) has(`${b.startBet}-bet`, `bob ${b.id}.startBet`);
  for (const m of b.mavzular) {
    has(m.kod, `${m.kod}.kodi`);
    has(m.nomi, `${m.kod}.nomi`);
    for (const q of m.savollar) has(q, `${m.kod}.savol`);
    for (const q of m.qism_mavzular ?? []) has(q, `${m.kod}.qism-mavzu`);
  }
  (b.tadqiqotchilik_konikmalari ?? []).forEach((k, i) => has(k, `${b.id}-bob.konikma[${i}]`));
  (b.ilm_fanning_hayotga_tatbiqi ?? []).forEach((k, i) => has(k, `${b.id}-bob.tatbiq[${i}]`));
}

const kitobKodlari = [...new Set(tocLines(D).filter((l) => /^\d{1,2}\.\d{1,2}\.?\s/.test(l)).map((l) => l.match(/^(\d{1,2}\.\d{1,2})/)[1]))].sort();
const jsonKodlar = cur.boblar.flatMap((b) => b.mavzular.map((m) => m.kod)).sort();
if (kitobKodlari.join() !== jsonKodlar.join()) {
  fail.push(`mavzu kodlari — kitobda: [${kitobKodlari}] / JSON'da: [${jsonKodlar}]`);
}
const kitobBoblari = [...new Set(tocLines(D).filter((l) => /^\d{1,2}-bob\b/.test(l)).map((l) => Number(l.match(/^(\d{1,2})-bob/)[1])))].sort((a, b) => a - b);
if (kitobBoblari.join() !== cur.boblar.map((b) => b.id).join()) fail.push(`boblar to'plami — kitobda: [${kitobBoblari}]`);

/* ---- mashq daftari: mustaqil qayta parse ---- */
const davom = [];
for (const l of tocLines(W)) {
  const prev = davom[davom.length - 1];
  const yangiBob = /^\d{1,2}-bob\b/.test(l);
  if (prev && !/\d\s*$/.test(prev) && !/^\d{1,2}-bob\b/.test(prev) && !yangiBob) davom[davom.length - 1] = `${prev} ${l}`;
  else davom.push(l);
}
const parsed = [];
let pb = null;
for (const l of davom) {
  const bm = l.match(/^(\d{1,2})-bob\.?\s*(.*?)\s*[.…]{2,}\s*(\d+)\s*$/) || l.match(/^(\d{1,2})-bob\.?\s*(.*)$/);
  if (bm) {
    pb = { id: Number(bm[1]), nomi: (bm[2] || '').replace(/[.…]{2,}.*$/, '').trim(), amaliyIshlar: [], sekm: {} };
    parsed.push(pb);
    continue;
  }
  if (!pb) continue;
  const am = l.match(/^(\d{1,2}\.\d{1,2})-amaliy\s*ish\.?\s*(.*?)\s*[.…]{2,}(\d+)\s*$/i);
  if (am) pb.amaliyIshlar.push({ kod: am[1], nomi: am[2].replace(/[.…]{2,}.*$/, '').trim(), bet: Number(am[3]) });
  const sm = l.match(/^(Boshqotirma|Bilimlar\s+xaritasi|Takrorlash|Mustahkamlash)\s*[.…]{2,}(\d+)\s*$/i);
  if (sm) pb.sekm[sm[1].toLowerCase().replace(/\s+/g, '')] = Number(sm[2]);
}
const keyMap = { boshqotirma: 'boshqotirma', bilimlarxaritasi: 'bilimlarXaritasi', takrorlash: 'takrorlash', mustahkamlash: 'mustahkamlash' };

if (parsed.length !== cur.boblar.length) fail.push(`mashq daftari: kitobda ${parsed.length} bob, JSON'da ${cur.boblar.length}`);
for (const k of parsed) {
  const j = cur.boblar.find((b) => b.id === k.id);
  if (!j) {
    fail.push(`mashq daftari: ${k.id}-bob JSON'da yo'q`);
    continue;
  }
  const nomlar = [j.nomi, j.mashq_daftari?.nominvarianti].filter(Boolean).map(norm);
  if (k.nomi && !nomlar.includes(norm(k.nomi))) fail.push(`bob ${k.id} mashq daftari nomi: kitob="${k.nomi}" JSON="${j.nomi}"`);
  if (k.amaliyIshlar.length !== (j.mashq_daftari?.amaliyIshlar?.length ?? 0))
    fail.push(`bob ${k.id}: amaliy ishlar soni — kitob ${k.amaliyIshlar.length}, JSON ${j.mashq_daftari?.amaliyIshlar?.length}`);
  k.amaliyIshlar.forEach((a) => {
    const m = (j.mashq_daftari?.amaliyIshlar ?? []).find((x) => x.kod === a.kod);
    if (!m) return fail.push(`${a.kod}-amaliy ish JSON'da yo'q (kitob: "${a.nomi}")`);
    if (norm(m.nomi) !== norm(a.nomi)) fail.push(`${a.kod}-amaliy ish nomi: kitob="${a.nomi}" JSON="${m.nomi}"`);
    if (m.bet !== a.bet) fail.push(`${a.kod}-amaliy ish bet: kitob=${a.bet} JSON=${m.bet}`);
  });
  for (const [kk, jkey] of Object.entries(keyMap)) {
    if (k.sekm[kk] == null) continue;
    if (j.mashq_daftari?.[jkey] !== k.sekm[kk]) fail.push(`bob ${k.id}.${jkey}: kitob=${k.sekm[kk]} JSON=${j.mashq_daftari?.[jkey]}`);
  }
}

/* ---- sanoqlar va bet tartibi ---- */
const hisob = {
  boblar: cur.boblar.length,
  mavzular_darslikda: cur.boblar.reduce((s, b) => s + b.mavzular.length, 0),
  organish_savollari: cur.boblar.reduce((s, b) => s + b.mavzular.reduce((x, m) => x + m.savollar.length, 0), 0),
  qism_mavzular: cur.boblar.reduce((s, b) => s + b.mavzular.reduce((x, m) => x + (m.qism_mavzular?.length ?? 0), 0), 0),
  tadqiqotchilik_konikmalari: cur.boblar.reduce((s, b) => s + b.tadqiqotchilik_konikmalari.length, 0),
  ilm_fanning_hayotga_tatbiqi: cur.boblar.reduce((s, b) => s + (b.ilm_fanning_hayotga_tatbiqi?.length ?? 0), 0),
  amaliy_ishlar_mashq_daftarida: cur.boblar.reduce((s, b) => s + (b.mashq_daftari?.amaliyIshlar?.length ?? 0), 0),
  boshqotirma: cur.boblar.filter((b) => b.mashq_daftari?.boshqotirma).length,
  bilimlar_xaritasi: cur.boblar.filter((b) => b.mashq_daftari?.bilimlarXaritasi).length,
  takrorlash: cur.boblar.filter((b) => b.mashq_daftari?.takrorlash).length,
  mustahkamlash: cur.boblar.filter((b) => b.mashq_daftari?.mustahkamlash).length,
};
const countErr = Object.entries(hisob).filter(([k, v]) => cur.meta.hisob[k] !== v).map(([k, v]) => `${k}: meta=${cur.meta.hisob[k]}, fakt=${v}`);
const orderErr = [];
for (let i = 1; i < cur.boblar.length; i++) {
  const a = cur.boblar[i - 1];
  const c = cur.boblar[i];
  if (!(c.startBet > a.startBet)) orderErr.push(`bob ${c.id}.startBet (${c.startBet}) <= bob ${a.id} (${a.startBet})`);
  if (a.endBet !== null && c.startBet !== a.endBet + 1) orderErr.push(`bob ${a.id}→${c.id}: ${a.endBet} → ${c.startBet} tutashmagan`);
}
const wbBet = cur.boblar.flatMap((b) => [
  ...(b.mashq_daftari?.amaliyIshlar ?? []).map((a) => a.bet),
  b.mashq_daftari?.boshqotirma,
  b.mashq_daftari?.takrorlash,
  b.mashq_daftari?.mustahkamlash,
].filter((x) => typeof x === 'number'));
if (wbBet.some((v, i) => i && v < wbBet[i - 1])) orderErr.push('mashq daftari betlari o‘sib bormaydi');

const tekshirilgan =
  cur.boblar.length * 2 + hisob.mavzular_darslikda * 2 + hisob.organish_savollari + hisob.qism_mavzular + hisob.tadqiqotchilik_konikmalari + hisob.ilm_fanning_hayotga_tatbiqi;
console.log(`Darslik: ${D.numPages} PDF bet | Mashq daftari: ${W.numPages} PDF bet (qayta parsed boblar: ${parsed.length})`);
console.log(`Sanoqlar: ${JSON.stringify(hisob)}`);
console.log(`Tekshirildi: ${tekshirilgan} ta matn, 30 ta amaliy ish nomi+beti, ${hisob.boblar * 4} ta bob bo'limi beti`);
if (fail.length) console.log(`\nXATO (${fail.length}):\n  ` + fail.join('\n  '));
if (countErr.length) console.log(`\nSANOQ XATOLARI:\n  ` + countErr.join('\n  '));
if (orderErr.length) console.log(`\nBET TARTIBI:\n  ` + orderErr.join('\n  '));
const ok = !fail.length && !countErr.length && !orderErr.length;
console.log(ok ? '\nXULOSA: struktura kitoblar bilan to' + String.fromCharCode(0x2019) + 'liq mos ✓' : '\nXULOSA: tuzatish kerak.');
process.exit(ok ? 0 : 1);

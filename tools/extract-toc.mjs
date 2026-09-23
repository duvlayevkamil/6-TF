#!/usr/bin/env node
/**
 * Darslik va mashq daftari «Mundarija» PDF larini o'qib, platformaning
 * strukturaviy faylini — data/curriculum/6-sinf-science.json — YASAYDI.
 * Tahririy qismlar (kitob tavsifi, platformaga qo'yiladigan talablar)
 * data/curriculum/6-sinf-science.meta.json da saqlanadi va shu yerga qo'shiladi.
 *
 * Ishlatish:
 *   node tools/extract-toc.mjs            -> 6-sinf-science.extracted.json (solishtirish uchun)
 *   node tools/extract-toc.mjs --write    -> 6-sinf-science.json (asosiy fayl)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readToc, cut, tocLines } from './lib/pdf-toc.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const find = (n) => {
  for (const p of [path.join(ROOT, 'sources', n), path.join(ROOT, n)]) if (fs.existsSync(p)) return p;
  throw new Error(`Topilmadi: ${n} (sources/ ga qo'ying)`);
};

/* ============================ 1. DARSLIK ============================ */
const D = await readToc(find('Darslik.pdf'), { edges: [266, 431] });

const bobs = [];
let bob = null;
let mavzu = null;
let mavzuYangi = true; // mavzu sarlavhasi hali to'liq yig'ilmoqda (keyingi qatorlar unga qo'shiladi)

const band = (text, b, key) => {
  if (!text || !b) return;
  const t = cut(text);
  if (!t) return;
  const m = t.match(/^•\s*(.*)$/);
  if (m) b[key].push(m[1].trim());
  else if (b[key].length && !/^•/.test(t)) b[key][b[key].length - 1] = `${b[key][b[key].length - 1]} ${t}`.replace(/\s+/g, ' ').trim();
};

for (const p of D.pages) {
  for (const row of p.rows) {
    const c1 = cut(row.cols[0] ?? '');
    const c2 = row.cols[1] ?? '';
    const c3 = row.cols[2] ?? '';
    const full = row.cols.filter(Boolean).join(' ');
    if (!c1 && !c2 && !c3) continue;

    const bm = c1.match(/^(\d{1,2})-bob\.?\s*(.*)$/);
    if (bm) {
      const bet = (full.match(/(\d+)\s*-?\s*bet/i) || [])[1];
      bob = {
        id: Number(bm[1]),
        nomi: cut(bm[2]).replace(/\.$/, ''),
        startBet: bet ? Number(bet) : null,
        mavzular: [],
        tadqiqotchilik_konikmalari: [],
        ilm_fanning_hayotga_tatbiqi: [],
      };
      bobs.push(bob);
      mavzu = null;
      mavzuYangi = false;
      band(c2, bob, 'tadqiqotchilik_konikmalari');
      band(c3, bob, 'ilm_fanning_hayotga_tatbiqi');
      continue;
    }
    if (!bob) continue;

    const mm = c1.match(/^(\d{1,2}\.\d{1,2})\.?\s*(.*)$/);
    if (mm) {
      mavzu = { kod: mm[1], nomi: cut(mm[2]).replace(/\.$/, ''), bands: [] };
      bob.mavzular.push(mavzu);
      mavzuYangi = true;
      band(c2, bob, 'tadqiqotchilik_konikmalari');
      band(c3, bob, 'ilm_fanning_hayotga_tatbiqi');
      continue;
    }

    const bullet = c1.match(/^•\s*(.*)$/);
    if (bullet && mavzu) {
      mavzu.bands.push(cut(bullet[1]));
      mavzuYangi = false;
    } else if (mavzu && c1) {
      if (mavzu.bands.length) {
        const i = mavzu.bands.length - 1;
        mavzu.bands[i] = `${mavzu.bands[i]} ${c1}`.replace(/\s+/g, ' ').trim();
      } else if (mavzuYangi) mavzu.nomi = `${mavzu.nomi} ${c1}`.replace(/\s+/g, ' ').trim();
      else mavzu.bands.push(c1);
    } else if (!mavzu && c1 && !/-bet\s*$/i.test(c1) && !/^\d{1,2}\./.test(c1)) {
      // bob sarlavhasi ikkinchi qatorga o'tib ketgan holat
      bob.nomi = `${bob.nomi} ${c1}`.replace(/\s+/g, ' ').trim();
    }
    band(c2, bob, 'tadqiqotchilik_konikmalari');
    band(c3, bob, 'ilm_fanning_hayotga_tatbiqi');
  }
}

for (const b of bobs) {
  b.nomi = b.nomi.replace(/\s+/g, ' ').trim();
  b.mavzular = b.mavzular
    .filter((m) => m.nomi && !/^Amaliy ish$/i.test(m.nomi))
    .map(({ kod, nomi, bands }) => ({
      kod,
      nomi,
      savollar: bands.filter((t) => /[?]$/.test(t)),
      qism_mavzular: bands.filter((t) => !/[?]$/.test(t)),
    }));
}

/* ============================ 2. MASHQ DAFTARI ============================ */
const W = await readToc(find('Mashq daftari.pdf'), { edges: [] });
const davom = [];
for (const l of tocLines(W)) {
  const prev = davom[davom.length - 1];
  const yangiBob = /^\d{1,2}-bob\b/.test(l);
  if (prev && !/\d\s*$/.test(prev) && !/^\d{1,2}-bob\b/.test(prev) && !yangiBob) davom[davom.length - 1] = `${prev} ${l}`;
  else davom.push(l);
}

const wb = [];
let w = null;
for (const l of davom) {
  const bm = l.match(/^(\d{1,2})-bob\.?\s*(.*?)\s*[.…]{2,}\s*(\d+)\s*$/) || l.match(/^(\d{1,2})-bob\.?\s*(.*)$/);
  if (bm) {
    w = { id: Number(bm[1]), nomi: (bm[2] || '').replace(/[.…]{2,}.*$/, '').trim(), amaliyIshlar: [], boshqotirma: null, bilimlarXaritasi: null, takrorlash: null, mustahkamlash: null };
    wb.push(w);
    continue;
  }
  if (!w) continue;
  const am = l.match(/^(\d{1,2}\.\d{1,2})-amaliy\s*ish\.?\s*(.*?)\s*[.…]{2,}(\d+)\s*$/i);
  if (am) {
    w.amaliyIshlar.push({ kod: am[1], nomi: am[2].replace(/[.…]{2,}.*$/, '').trim(), bet: Number(am[3]) });
    continue;
  }
  const sm = l.match(/^(Boshqotirma|Bilimlar\s+xaritasi|Takrorlash|Mustahkamlash)\s*[.…]{2,}(\d+)\s*$/i);
  if (sm) {
    const key = { boshqotirma: 'boshqotirma', bilimlarxaritasi: 'bilimlarXaritasi', takrorlash: 'takrorlash', mustahkamlash: 'mustahkamlash' }[sm[1].toLowerCase().replace(/\s+/g, '')];
    w[key] = Number(sm[2]);
  }
}

/* ============================ 3. BIRLASHTIRISH ============================ */
const boblar = bobs.map((b, i) => {
  const out = {
    id: b.id,
    nomi: b.nomi,
    startBet: b.startBet,
    endBet: i + 1 < bobs.length ? bobs[i + 1].startBet - 1 : null,
    mavzular: b.mavzular,
    tadqiqotchilik_konikmalari: b.tadqiqotchilik_konikmalari,
    ilm_fanning_hayotga_tatbiqi: b.ilm_fanning_hayotga_tatbiqi,
  };
  const x = wb.find((k) => k.id === b.id);
  if (x) {
    out.mashq_daftari = {
      amaliyIshlar: x.amaliyIshlar,
      boshqotirma: x.boshqotirma,
      bilimlarXaritasi: x.bilimlarXaritasi,
      takrorlash: x.takrorlash,
      mustahkamlash: x.mustahkamlash,
    };
    if (x.nomi && x.nomi !== out.nomi) out.mashq_daftari.nominvarianti = x.nomi;
  }
  return out;
});

const hisob = {
  boblar: boblar.length,
  mavzular_darslikda: boblar.reduce((s, b) => s + b.mavzular.length, 0),
  organish_savollari: boblar.reduce((s, b) => s + b.mavzular.reduce((x, m) => x + m.savollar.length, 0), 0),
  qism_mavzular: boblar.reduce((s, b) => s + b.mavzular.reduce((x, m) => x + m.qism_mavzular.length, 0), 0),
  tadqiqotchilik_konikmalari: boblar.reduce((s, b) => s + b.tadqiqotchilik_konikmalari.length, 0),
  ilm_fanning_hayotga_tatbiqi: boblar.reduce((s, b) => s + b.ilm_fanning_hayotga_tatbiqi.length, 0),
  amaliy_ishlar_mashq_daftarida: boblar.reduce((s, b) => s + (b.mashq_daftari?.amaliyIshlar.length ?? 0), 0),
  boshqotirma: boblar.filter((b) => b.mashq_daftari?.boshqotirma).length,
  bilimlar_xaritasi: boblar.filter((b) => b.mashq_daftari?.bilimlarXaritasi).length,
  takrorlash: boblar.filter((b) => b.mashq_daftari?.takrorlash).length,
  mustahkamlash: boblar.filter((b) => b.mashq_daftari?.mustahkamlash).length,
};

const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'curriculum', '6-sinf-science.meta.json'), 'utf8'));
const natija = { meta: { ...META.meta, hisob }, boblar, platforma_uchun: META.platforma_uchun };

const outPath = path.join(ROOT, 'data', 'curriculum', WRITE ? '6-sinf-science.json' : '6-sinf-science.extracted.json');
fs.writeFileSync(outPath, JSON.stringify(natija, null, 2) + '\n');
console.log(`yozildi: ${path.relative(ROOT, outPath)}`);
console.log(`Sanoqlar: ${JSON.stringify(hisob)}`);

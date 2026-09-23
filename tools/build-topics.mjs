#!/usr/bin/env node
/**
 * data/curriculum/6-sinf-science.json ni platformaning O'Z ma'lumot sxemasiga
 * (repozitoriyadagi 7-sinf.html → <script id="topics-data" type="application/json">)
 * aylantiradi: data/curriculum/6-sinf-science.topics.json
 *
 * Sxema (7-sinf.html bilan bir xil maydon nomlari):
 *   d       — bob raqami
 *   c       — bob ichidagi tartib
 *   t       — mavzu nomi (kitobda chop etilganidek)
 *   theory  — o'qituvchi yozadigan izoh (bo'sh qoldiriladi, kitob matni KO'CHIRILMAYDI)
 *   formulas— asosiy qoida/atamalar ro'yxati (o'qituvchi to'ldiradi)
 *   quiz / slideQuiz / gameQuiz — [savol, [variantlar], to'g'riIndex, izoh]
 *   task    — {q, a, why} amaliy topshiriq
 *   act     — {type, mode} simulyator/amaliy ish turi
 * Qo'shimcha (6-sinfga xos, kitob bilan bog'lab turadi):
 *   kitob   — {bet, oralig, ustunlar, amaliyIsh, boshqotirma, ...}
 *   urinish — {savollar, qism_mavzular} — kitobdagi yo'naltiruvchi savollar
 *
 * Ishlatish: npm run topics
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(ROOT, 'data', 'curriculum', '6-sinf-science.json');
const out = path.join(ROOT, 'data', 'curriculum', '6-sinf-science.topics.json');

const cur = JSON.parse(fs.readFileSync(src, 'utf8'));
const topics = [];
let n = 0;

for (const b of cur.boblar) {
  const wb = b.mashq_daftari ?? {};
  b.mavzular.forEach((m, i) => {
    n++;
    const amaliy = (wb.amaliyIshlar ?? []).find((a) => a.kod === m.kod) ?? null;
    topics.push({
      d: b.id,
      c: i + 1,
      t: m.nomi,
      theory: '',
      formulas: [],
      quiz: [],
      task: amaliy ? { q: amaliy.nomi, a: '', why: `Mashq daftari, ${amaliy.bet}-bet` } : null,
      act: amaliy ? { type: 'amaliy-ish', mode: amaliy.kod } : { type: 'muhokama', mode: m.kod },
      slideQuiz: [],
      gameQuiz: [],
      kitob: {
        bobNomi: b.nomi,
        bet: b.startBet,
        oralig: b.endBet ? `${b.startBet}–${b.endBet}` : `${b.startBet}–`,
        kod: m.kod,
        amaliyIsh: amaliy ? { kod: amaliy.kod, nomi: amaliy.nomi, bet: amaliy.bet } : null,
        boshqotirma: wb.boshqotirma ?? null,
        bilimlarXaritasi: wb.bilimlarXaritasi ?? null,
        takrorlash: wb.takrorlash ?? null,
        mustahkamlash: wb.mustahkamlash ?? null,
      },
      urinish: {
        savollar: m.savollar,
        qism_mavzular: m.qism_mavzular ?? [],
        konikmalar: b.tadqiqotchilik_konikmalari ?? [],
        tatbiq: b.ilm_fanning_hayotga_tatbiqi ?? [],
      },
    });
  });
}

// Mavzu kodiga to'g'ri kelmay qolgan amaliy ishlar — bob darajasida saqlanadi
// (mashq daftari 30 ta amaliy ish beradi, darslik mundarijasida 26 ta mavzu bor).
const kodlar = new Set(topics.map((t) => t.kitob.kod));
const extra = {};
for (const b of cur.boblar) {
  const q = (b.mashq_daftari?.amaliyIshlar ?? []).filter((a) => !kodlar.has(a.kod));
  if (q.length) extra[b.id] = q;
}

const natija = {
  meta: {
    sxema: '7-sinf.html topics-data bilan bir xil + kitob/urinish maydonlari',
    fan: cur.meta.fan,
    sinf: cur.meta.sinf,
    mavzular: topics.length,
    boblar: cur.boblar.length,
    holat: "theory/formulas/quiz maydonlari bo'sh — ularni o'qituvchi yozadi; kitob matni huquq sababli kiritilmaydi",
    bob_amaliy_ishlari: extra,
    izoh: "bob_amaliy_ishlari — mavzu kodiga to'g'ri kelmay qolgan amaliy ishlar; ular bob sahifasida (mavzulardan keyin) ko'rsatiladi",
  },
  topics,
};

fs.writeFileSync(out, JSON.stringify(natija, null, 1) + '\n');
const toldirilgan = topics.filter((t) => t.task && t.task.a === '').length;
console.log(`yozildi: ${path.relative(ROOT, out)}`);
console.log(`${topics.length} ta mavzu kartasi yasaldi (boblar: ${cur.boblar.length}); amaliy ishi bilan bog'langan: ${topics.filter((t) => t.kitob.amaliyIsh).length} ta`);
console.log(`Bo'sh 'task.javob' (o'qituvchi to'ldiradi): ${toldirilgan} ta`);

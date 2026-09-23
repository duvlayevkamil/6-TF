#!/usr/bin/env node
/**
 * tools/build-taqvim.mjs — kun taqvimi (34 hafta) generatori.
 *
 * Asos (tasdiqlangan manbalar, docs/tadqiqot.md):
 *  - 6-sinf Tabiiy fan: haftasiga 3 soat, jami 102 soat  →  102 / 3 = 34 hafta;
 *  - 26 mavzu (kitob mundarijasi: data/curriculum/…topics.json);
 *  - yillik nazorat: BSB 1..5 va CHSB 1..3  →  8 nazorat haftasi.
 *  Demak 26 + 8 = 34 hafta va 34 × 3 = 102 soat — qatorlar shu hisobga
 *  ko'ra tuziladi va generator aynan shuni tekshiradi.
 *
 * Sana saqlanmaydi: taqvim platformada o'qituvchi kiritgan «o'quv yili boshi»
 * kunidan hisoblanadi (har hafta — dushanba).
 *
 * Ishlatish: node tools/build-taqvim.mjs  →  platform/content/taqvim.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/* mavzu ro'yxati — yig'ilgan platforma orolidan olinadi (chorak bilan birga);
   bo'lmasa struktura fayliga qaytamiz va `bob` dan chorak hisoblaymiz. */
const struct = JSON.parse(readFileSync(join(ROOT, "data/curriculum/6-sinf-science.topics.json"), "utf8"));
let mavzular;
try {
  const island = JSON.parse(
    readFileSync(join(ROOT, "6-sinf.html"), "utf8").match(/<script id="topics-data" type="application\/json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<")
  );
  mavzular = island.topics.map((t) => ({ kod: t.kod || `${t.d}.${t.c}`, t: t.t, d: t.d, chorak: t.chorak }));
  console.log(`  manba: 6-sinf.html oroli (${mavzular.length} mavzu, chorak bilan)`);
} catch {
  mavzular = struct.topics.map((t) => ({ kod: t.kitob?.kod || `${t.d}.${t.c}`, t: t.t, d: t.d, chorak: Math.ceil(t.d / 3) }));
  console.log("  manba: data/curriculum/…topics.json (chorak = bob/3 bo'yicha hisoblandi)");
}

const HAFTA_SOAT = 3;
const JAMI_SOAT = 102;
const JAMI_HAFTA = JAMI_SOAT / HAFTA_SOAT;
const xatolar = [];

const byChorak = new Map();
for (const t of mavzular) {
  const c = t.chorak || Math.ceil(t.d / 3);
  t.kod = t.kod || `${t.d}.${t.c}`;
  if (!byChorak.has(c)) byChorak.set(c, []);
  byChorak.get(c).push(t);
}
const choraklar = [...byChorak.keys()].sort((a, b) => a - b);
if (choraklar.length !== 4) xatolar.push(`chorak soni 4 bo'lishi kerak, ${choraklar.length}`);

/* Har chorakda: BSB lar o'rtada, CHSB chorak oxirida. */
const NAZORAT = {
  1: { BSB: [1], CHSB: [1] },
  2: { BSB: [2], CHSB: [2] },
  3: { BSB: [3], CHSB: [3] },
  4: { BSB: [4, 5], CHSB: [] },
};

const rows = [];
for (const c of choraklar) {
  const ts = byChorak.get(c) || [];
  const { BSB = [], CHSB = [] } = NAZORAT[c] || {};
  /* BSB lar chorak mavzulari orasiga teng joylashtiriladi, CHSB — oxirida */
  const gap = Math.max(1, Math.floor((ts.length + 1) / (BSB.length + 1)));
  let bi = 0;
  ts.forEach((t, i) => {
    rows.push({ tur: "mavzu", kod: t.kod, nom: t.t, bob: t.d, chorak: c, soat: HAFTA_SOAT });
    while (bi < BSB.length && i + 1 === gap * (bi + 1)) {
      rows.push({
        tur: "BSB",
        n: BSB[bi],
        nom: `BSB-${BSB[bi]} — ${c}-chorak bosqichli nazorat ishi`,
        bob: t.d,
        chorak: c,
        soat: HAFTA_SOAT,
        qamrov: ts.slice(0, i + 1).map((x) => x.kod),
      });
      bi++;
    }
  });
  while (bi < BSB.length) {
    rows.push({
      tur: "BSB",
      n: BSB[bi],
      nom: `BSB-${BSB[bi]} — ${c}-chorak bosqichli nazorat ishi`,
      bob: ts.at(-1)?.d || 0,
      chorak: c,
      soat: HAFTA_SOAT,
      qamrov: ts.map((x) => x.kod),
    });
    bi++;
  }
  for (const n of CHSB)
    rows.push({
      tur: "CHSB",
      n,
      nom: `CHSB-${n} — ${c}-chorak yakuniy nazorat ishi`,
      bob: ts.at(-1)?.d || 0,
      chorak: c,
      soat: HAFTA_SOAT,
      qamrov: ts.map((x) => x.kod),
    });
}

/* ---------- tekshiruv ---------- */
const soatJami = rows.reduce((a, r) => a + r.soat, 0);
if (rows.length !== JAMI_HAFTA) xatolar.push(`haftalar soni ${JAMI_HAFTA} bo'lishi kerak, ${rows.length}`);
if (soatJami !== JAMI_SOAT) xatolar.push(`jami soat ${JAMI_SOAT} bo'lishi kerak, ${soatJami}`);
const bsb = rows.filter((r) => r.tur === "BSB").map((r) => r.n);
const chsb = rows.filter((r) => r.tur === "CHSB").map((r) => r.n);
if (bsb.join() !== "1,2,3,4,5") xatolar.push(`BSB tartibi 1,2,3,4,5 bo'lishi kerak, ${bsb.join()} chiqdi`);
if (chsb.join() !== "1,2,3") xatolar.push(`CHSB tartibi 1,2,3 bo'lishi kerak, ${chsb.join()} chiqdi`);
const kodlar = rows.filter((r) => r.tur === "mavzu").map((r) => r.kod);
if (new Set(kodlar).size !== 26) xatolar.push(`26 noyob mavzu kerak, ${new Set(kodlar).size} ta`);
for (const t of mavzular) {
  const kod = t.kod || `${t.d}.${t.c}`;
  if (!kodlar.includes(kod)) xatolar.push(`taqvimda mavzu tushib qolgan: ${kod}`);
}
for (let i = 1; i < kodlar.length; i++) {
  const [pd, pc] = kodlar[i - 1].split(".").map(Number);
  const [nd, nc] = kodlar[i].split(".").map(Number);
  if (nd < pd || (nd === pd && nc <= pc)) xatolar.push(`mavzu tartizi buzildi: ${kodlar[i - 1]} → ${kodlar[i]}`);
}

rows.forEach((r, i) => (r.hafta = i + 1));

if (xatolar.length) {
  console.error("✗ Taqvimda muammo bor:");
  for (const x of xatolar) console.error("   " + x);
  process.exit(1);
}

const perChorak = choraklar.map((c) => `${c}-chorak: ${rows.filter((r) => r.chorak === c).length} hafta`).join(", ");
writeFileSync(
  join(ROOT, "platform", "content", "taqvim.json"),
  JSON.stringify(
    {
      izoh:
        "Taxminiy taqvim: 34 hafta × 3 soat = 102 soat — 26 mavzu haftasi + BSB 1-5 + CHSB 1-3. " +
        "Sanalar platformada «o'quv yili boshi» (dushanba) kunidan hisoblanadi va tahrirlanadi.",
      haftaSoat: HAFTA_SOAT,
      jamiSoat: JAMI_SOAT,
      haftalar: rows.length,
      qatorlar: rows,
    },
    null,
    2
  ) + "\n"
);
console.log(`✓ taqvim.json: ${rows.length} hafta · ${soatJami} soat · ${perChorak}`);
console.log(`  nazorat haftalari: BSB ${bsb.join(",")} · CHSB ${chsb.join(",")} | mavzu haftalari: ${kodlar.length}`);

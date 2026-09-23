#!/usr/bin/env node
/**
 * Platformani yig'adi: data/curriculum/*.topics.json + platform/content/bob-*.json
 * + platform/{styles.css,labs.js,app.js} + platform/index.template.html  →  6-sinf.html
 *
 *   npm run build
 *
 * Natija — bitta o'zini-o'zi yetarli HTML fayl (7-sinf.html arxitekturasi):
 * ma'lumot <script id="topics-data" type="application/json"> orolida,
 * server yo'q, progress localStorage'da saqlanadi.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...a) => join(ROOT, ...a);

const read = (p) => readFileSync(P(p), "utf8");
const jread = (p) => JSON.parse(read(p));

/* ---------- 1. struktura (kitob mundarijasi — tasdiqlangan) ---------- */
const struct = jread("data/curriculum/6-sinf-science.topics.json");

/* ---------- 2. kontent (o'qituvchi matni) ---------- */
const contentDir = "platform/content";
const contentFiles = readdirSync(P(contentDir))
  .filter((f) => /^bob-\d+\.json$/.test(f))
  .sort();
const byKod = new Map();
for (const f of contentFiles) {
  const d = jread(`${contentDir}/${f}`);
  for (const t of d.topics || []) {
    if (byKod.has(t.kod)) fail(`${f}: ${t.kod} bir necha marta uchragan`);
    byKod.set(t.kod, { ...t, _fayl: f, bob: d.bob, chorak: d.chorak });
  }
}

/* ---------- 3. birlashtirish ---------- */
function fail(msg) {
  console.error("✗ " + msg);
  process.exitCode = 1;
  throw new Error(msg);
}
const missing = [];
const topics = struct.topics.map((t) => {
  const kod = t.kitob?.kod || `${t.d}.${t.c}`;
  const c = byKod.get(kod);
  if (!c) {
    missing.push(kod);
    return { ...t, kod };
  }
  if (c.bob !== t.d) fail(`${kod}: kontent fayli ${c._fayl} bob raqami ${c.bob} struktura ${t.d} mos emas`);
  return {
    d: t.d,
    c: t.c,
    kod,
    t: t.t,
    chorak: c.chorak ?? t.chorak,
    lab: c.lab,
    labMode: c.labMode,
    labTitle: c.labTitle || "",
    theory: c.theory,
    formulas: c.formulas,
    vocab: c.vocab,
    quiz: c.quiz,
    slideQuiz: c.slideQuiz,
    game: c.game,
    gameQuiz: c.game, // 7-sinf sxemasi bilan moslik uchun
    task: {
      q: c.task?.q || t.task?.q || "",
      a: c.task?.a || "",
      why: c.task?.why || "",
      steps: c.task?.steps || [],
      jihoz: c.task?.jihoz || [],
      xavfsizlik: c.task?.xavfsizlik || [],
    },
    // 7-sinf sxemasidagi act maydoni — simulyator nomi
    act: { type: "lab", name: c.lab, mode: c.labMode },
    kitob: t.kitob,
    urinish: t.urinish,
  };
});
if (missing.length) fail(`kontenti yo'q mavzular: ${missing.join(", ")}`);
const extra = [...byKod.keys()].filter((k) => !struct.topics.some((t) => (t.kitob?.kod || `${t.d}.${t.c}`) === k));
if (extra.length) fail(`strukturada yo'q, kontentda bor kodlar: ${extra.join(", ")}`);

/* ---------- 3.5 variantlarni aralashtirish ---------- */
/* Kontentda an'ana: to'g'ri javob birinchi (indeks 0) — o'qituvchi uchun o'qish oson.
   Yig'ilgan faylda esa variantlar har savolga urug'li (deterministik) tartibda
   joylashtiriladi, aks holda o'quvchi «har doim A javob to'g'ri» deb o'rganib qoladi. */
function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function rng(seed) {
  let x = (seed || 1) >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}
function shuffleRows(rows, seedKey, kod) {
  return (rows || []).map((row, i) => {
    const [q, opts, idx, why] = row;
    if (!Array.isArray(opts) || opts.length < 2 || !(idx >= 0 && idx < opts.length)) return row;
    const rand = rng(hash32(`${seedKey}|${kod}|${i}|${String(q).slice(0, 40)}`));
    const perm = opts.map((_, k) => k);
    for (let k = perm.length - 1; k > 0; k--) {
      const j = Math.floor(rand() * (k + 1));
      [perm[k], perm[j]] = [perm[j], perm[k]];
    }
    const newOpts = perm.map((p) => opts[p]);
    const newIdx = perm.indexOf(idx);
    if (newOpts[newIdx] !== opts[idx]) fail(`${kod}: ${seedKey}[${i}] variantlarni aralashtirishda javob yo'qoldi`);
    return [q, newOpts, newIdx, why];
  });
}
for (const t of topics) {
  t.quiz = shuffleRows(t.quiz, "quiz", t.kod);
  t.slideQuiz = shuffleRows(t.slideQuiz, "sq", t.kod);
  const g = shuffleRows(t.game, "game", t.kod);
  t.game = g;
  t.gameQuiz = g; // 7-sinf sxemasi bilan moslik uchun — bir xil tartibda
}

/* ---------- 4. LABS ro'yxatini tekshirish ---------- */
const labsSrc = read("platform/labs.js");
// labs.js faylini izolyatsiyada ishga tushirib, REG va ALIAS ro'yxatlarini olamiz
const sandbox = { window: {}, document: { createElement: () => ({}) } };
new Function("window", "document", labsSrc)(sandbox.window, sandbox.document);
const REG_KEYS = Object.keys(sandbox.window.LABS.REG);
const ALIAS = {};
const aStart = labsSrc.indexOf("const ALIAS = {");
if (aStart >= 0) {
  const aliasBlock = labsSrc.slice(aStart, labsSrc.indexOf("};", aStart));
  for (const m of aliasBlock.matchAll(/"([^"]+)"\s*:\s*"(\w+)"/g)) ALIAS[m[1]] = m[2];
}
const noLab = topics.filter((t) => {
  if (!t.lab) return false;
  const key = ALIAS[`${t.lab}:${t.labMode}`] || t.lab;
  return !REG_KEYS.includes(key);
});
if (noLab.length) fail(`labs.js'da bunday simulyator yo'q: ${noLab.map((t) => t.lab + "/" + t.labMode + " (" + t.kod + ")").join(", ")}`);

/* ---------- 5. HTML yig'ish ---------- */
const meta = {
  ...struct.meta,
  holat: "kontent to'ldirilgan: 26/26 mavzu (nazariya, test, simulyator, amaliy topshiriq)",
  manba: "Darslik.pdf va Mashq daftari.pdf mundarijasi (tasdiqlangan) + o'qituvchi yozgan kontent",
  platforma: "7-sinf.html arxitekturasi (bitta fayl, JSON orol, localStorage)",
  yigilgan: new Date().toISOString().slice(0, 10),
  mavzular: topics.length,
  boblar: new Set(topics.map((t) => t.d)).size,
};
const data = JSON.stringify({ meta, topics }).replace(/</g, "\\u003c");
const html = read("platform/index.template.html")
  .replace("/*@@CSS@@*/", () => read("platform/styles.css"))
  .replace("@@DATA@@", () => data)
  .replace("/*@@LABS@@*/", () => labsSrc)
  .replace("/*@@APP@@*/", () => read("platform/app.js"))
  .replace("@@BOBLAR@@", String(meta.boblar))
  .replace("@@MAVZULAR@@", String(meta.mavzular));

if (/<\/script>/i.test(data)) fail("JSON orolida </script> qoldig'i bor");
writeFileSync(P("6-sinf.html"), html);

/* ---------- 6. hisobot ---------- */
const kb = (n) => (n / 1024).toFixed(1) + " KB";
const size = statSync(P("6-sinf.html")).size;
console.log(`✓ 6-sinf.html yig'ildi: ${topics.length} mavzu, ${meta.boblar} bob, ${kb(size)}`);
console.log(
  `  nazariya paragraflari: ${topics.reduce((a, t) => a + t.theory.split("\n\n").length, 0)},` +
    ` test savollari: ${topics.reduce((a, t) => a + t.quiz.length, 0)},` +
    ` o'yin savollari: ${topics.reduce((a, t) => a + (t.game || []).length, 0)},` +
    ` amaliy bosqichlar: ${topics.reduce((a, t) => a + t.task.steps.length, 0)}`
);
console.log(`  simulyatorlar: ${new Set(topics.map((t) => t.lab)).size} tur (${[...new Set(topics.map((t) => t.lab))].join(", ")})`);
const pos = [0, 0, 0, 0];
for (const t of topics) for (const q of t.quiz) if (q[2] >= 0 && q[2] < 4) pos[q[2]]++;
console.log(`  javob pozitsiyalari (A/B/C/D): ${pos.join(" / ")} — har bir savolda variantlar urug'li tartibda`);
console.log("  ochish uchun:  npm run serve  →  http://localhost:8080/6-sinf.html");

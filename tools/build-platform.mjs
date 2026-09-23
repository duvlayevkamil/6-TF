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
console.log("  ochish uchun:  npm run serve  →  http://localhost:8080/6-sinf.html");

#!/usr/bin/env node
/**
 * Platforma tutun-tutun testi (brauzersiz).
 *  1) 6-sinf.html ichidagi JSON orolni o'qiydi, 26 mavzu va maydonlarni tekshiradi;
 *  2) app.js'da ishlatilgan barcha #id lar HTML'da bormi;
 *  3) data-act qiymatlari handler'da bormi;
 *  4) har bir simulyatorning compute()/svg() funksiyalari barcha boshqaruv
 *     qiymatlarida NaN/undefined chiqarmasligini tekshiradi;
 *  5) slaydlar va chop varag'i matnlarini yasab ko'radi.
 *
 * Ishga tushirish: npm run smoke
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "6-sinf.html"), "utf8");
const xatolar = [];
const ok = (m) => console.log("  ✓ " + m);

/* ---------- 1. JSON orol ---------- */
const m = html.match(/<script id="topics-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!m) {
  console.error("✗ topics-data oroli topilmadi");
  process.exit(1);
}
const DATA = JSON.parse(m[1].replace(/\\u003c/g, "<"));
if (DATA.topics.length !== 26) xatolar.push(`topics soni 26 bo'lishi kerak, ${DATA.topics.length}`);
for (const t of DATA.topics) {
  for (const k of ["theory", "formulas", "vocab", "quiz", "slideQuiz", "game", "task", "lab", "labMode", "kitob", "urinish"]) {
    const v = t[k];
    if (v == null || (Array.isArray(v) && !v.length) || (typeof v === "string" && !v.trim()))
      xatolar.push(`${t.kod}: ${k} bo'sh`);
  }
  if (!t.task.steps?.length) xatolar.push(`${t.kod}: task.steps bo'sh`);
  if (!t.task.xavfsizlik?.length && /amaliy|tajriba|suyuq|olov|shisha|termometr|batareya/i.test(t.task.q || ""))
    xatolar.push(`${t.kod}: xavfsizlik bandi yo'q`);
}
ok(`JSON orol: ${DATA.topics.length} mavzu, ${new Set(DATA.topics.map((t) => t.d)).size} bob`);

/* ---------- 2. id lar ---------- */
const appSrc = readFileSync(join(ROOT, "platform/app.js"), "utf8");
const used = [...new Set([...appSrc.matchAll(/\$\("#([\w-]+)"\)/g)].map((x) => x[1]))];
const have = new Set([...html.matchAll(/id="([\w-]+)"/g)].map((x) => x[1]));
const dyn = new Set(["lab-host", "nb-table", "t-timer", "t-body", "g-body", "g-score", "g-bar", "g-why", "modal", "home-hero"]);
const missingIds = used.filter((i) => !have.has(i) && !dyn.has(i));
if (missingIds.length) xatolar.push("HTML'da bu id yo'q: " + missingIds.join(", "));
ok(`id tekshiruvi: ${used.length} ta murojaat, dinamik: ${dyn.size}`);

/* ---------- 3. data-act handler'lari ---------- */
const acts = new Set([...html.matchAll(/data-act="([\w-]+)"/g)].map((x) => x[1]));
const handled = new Set([...appSrc.matchAll(/a === "([\w-]+)"/g)].map((x) => x[1]));
const noHandler = [...acts].filter((a) => !handled.has(a));
if (noHandler.length) xatolar.push("data-act handler'i yo'q: " + noHandler.join(", "));
ok(`data-act: ${acts.size} tur, barchasi bog'langan`);

/* ---------- 4. simulyatorlar ---------- */
const labsSrc = readFileSync(join(ROOT, "platform/labs.js"), "utf8");
globalThis.window = { LABS: null };
new Function("window", "document", labsSrc)(globalThis.window, { createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, append() {}, addEventListener() {} }) });
const { REG } = window.LABS;
let sinov = 0;
for (const [name, cfg] of Object.entries(REG)) {
  const st = { ...cfg.init };
  const sweep = (s) => {
    sinov++;
    let r;
    try {
      r = cfg.compute(s);
    } catch (e) {
      xatolar.push(`LABS.${name}.compute(${JSON.stringify(s)}): ${e.message}`);
      return;
    }
    let out = "";
    try {
      out = cfg.svg(s, r);
    } catch (e) {
      xatolar.push(`LABS.${name}.svg: ${e.message}`);
      return;
    }
    if (/NaN|undefined|null/.test(out)) {
      const at = out.search(/NaN|undefined|null/);
      xatolar.push(`LABS.${name}: svg ichida ${out.slice(at, at + 12)} (state: ${JSON.stringify(s)})`);
    }
    for (const [k, v] of Object.entries(r || {})) {
      if (typeof v === "number" && !isFinite(v)) xatolar.push(`LABS.${name}: readout ${k} = ${v}`);
    }
    for (const rd of cfg.readouts || []) {
      if (!(rd.k in (r || {}))) xatolar.push(`LABS.${name}: readout "${rd.k}" compute natijasida yo'q`);
    }
  };
  sweep(st);
  (cfg.controls || []).forEach((c) => {
    const qat = c.step >= 1;
    const qiymat = (v) => (qat ? Math.round(v) : v);
    for (const v of [c.min, (c.min + c.max) / 2, c.max, c.min + (c.max - c.min) * 0.13]) {
      try { sweep({ ...st, [c.k]: qiymat(v) }); } catch (e) { xatolar.push(`LABS.${name} ${c.k}=${qiymat(v)}: ${e.message}`); }
    }
  });
}
ok(`LABS: ${Object.keys(REG).length} simulyator, ${sinov} holat sinovdan o'tdi`);

/* ---------- 5. slayd va chop varaqalari ---------- */
const doc = {
  querySelector: (sel) => (sel === "#topics-data" ? { textContent: m[1] } : null),
  getElementById: (id) => (id === "topics-data" ? { textContent: m[1] } : null),
  addEventListener() {},
};
globalThis.document = doc;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window.document = doc;
globalThis.window.addEventListener = () => {};
const appFn = new Function("window", "document", "localStorage", appSrc + "\nreturn window.__TF;");
const TF = appFn(globalThis.window, doc, globalThis.localStorage);
if (!TF) xatolar.push("__TF eksport qilinmadi");
else {
  let slaydlar = 0;
  for (const t of TF.TOPICS) {
    const slides = TF.buildSlides(t);
    slaydlar += slides.length;
    if (slides.length < 6) xatolar.push(`${t.kod}: slaydlar soni ${slides.length} (kamida 6 bo'lsin)`);
    slides.forEach((s, i) => {
      const out = TF.slideHTML(s, i, slides.length);
      if (/undefined|NaN/.test(out)) xatolar.push(`${t.kod} slayd ${i}: ${out.slice(out.search(/undefined|NaN/), out.search(/undefined|NaN/) + 20)}`);
      const p = TF.printSheet(s, t, { quiz: "javob" });
      if (/undefined|NaN/.test(p)) xatolar.push(`${t.kod} chop varaqasi ${i}: undefined/NaN`);
    });
  }
  ok(`slaydlar: ${slaydlar} ta, har mavzuda cover + nazariya + formulalar + atamalar + vazifa + test`);
  const testQ = TF.buildTest(TF.TOPICS, { n: 30, mode: "aralash", bob: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] });
  if (testQ.length !== 30) xatolar.push(`buildTest: 30 savol kerak edi, ${testQ.length} chiqdi`);
  for (const mode of ["bilim", "amaliy"]) {
    const q2 = TF.buildTest(TF.TOPICS, { n: 20, mode });
    if (!q2.length) xatolar.push(`buildTest: "${mode}" rejimida savol yo'q`);
  }
  ok("buildTest: 30 savol + bilim/amaliy rejimlar");
}

/* ---------- natija ---------- */
if (xatolar.length) {
  console.log(`\nXATOLAR (${xatolar.length}):`);
  for (const e of [...new Set(xatolar)].slice(0, 40)) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ Platforma testi muvaffaqiyatli.");

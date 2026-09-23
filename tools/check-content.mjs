#!/usr/bin/env node
/**
 * platform/content/bob-*.json fayllarini tekshiradi.
 *
 * Nima tekshiriladi:
 *  1) JSON yaroqliligi va sxema: har mavzuda theory / formulas / vocab / quiz /
 *     slideQuiz / game / task {q,a,why,steps,jihoz,xavfsizlik} hamda lab / labMode.
 *  2) Test tuzilishi: [savol, [4 variant], to'g'ri indeks, izoh].
 *  3) Matn gidienasi: o'zbek lotin yozuviga kirmagan harflar (kirill, turkcha
 *     ı/ğ/ş/ö/ü, boshqa alifbo) va nusxada qolgan texnik shovqin (_ ,  , tab).
 *
 * Ishga tushirish: npm run content:check   (yoki: node tools/check-content.mjs)
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "platform", "content");

// O'zbek lotin alifbosidagi harflar + imlo belgilari va umumiy punktuatsiya.
const ALLOWED = new Set(
  [..."abcdefghijklmnopqrstuvwxyz", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."0123456789"].flatMap((c) => c)
);
const OK_EXTRA = new Set([
  " ", "\n", "\t", "'", "ʻ", "ʼ", "`", ",", ".", ":", ";", "!", "?", "-", "—", "–", "(", ")", "[", "]", "«", "»",
  "%", "°", "≈", "≤", "≥", "±", "×", "·", "→", "↑", "↓", "…", "/", "\\", "*", "#",
  "₀", "₁", "₂", "₃", "²", "³", "℃", "№", "①", "②", "③", "④",
  // fizika-kimyo belgilari: formulalar va burchaklar uchun ruxsat etilgan
  "+", "=", "<", ">", "|", "&", "^", "~", "÷", "−",
  "α", "β", "γ", "ρ", "Ω", "μ", "λ", "ν", "π", "Δ", "θ", "≠",
]);

const xatolar = [];
const ogohlantirish = [];

function push(file, kod, msg) {
  xatolar.push(`${file}${kod ? ` [${kod}]` : ""}: ${msg}`);
}

/** qatorning ruxsatsiz belgilarini qaytaradi */
function yotBelgilar(s) {
  const bad = new Set();
  for (const ch of s) {
    if (ALLOWED.has(ch) || OK_EXTRA.has(ch)) continue;
    if (/[\u0400-\u04FF]/.test(ch)) bad.add("kirill:" + ch);
    else if ("ığşöüäéèêëîïôùûçńđł".includes(ch)) bad.add("yot harf:" + ch);
    else bad.add("belgi:" + ch);
  }
  return [...bad];
}

function textlar(obj, yoL = "") {
  const out = [];
  const tur = Array.isArray(obj) ? "arr" : typeof obj;
  if (tur === "string") out.push([yoL, obj]);
  else if (tur === "object" && obj !== null) {
    for (const [k, v] of Object.entries(obj)) out.push(...textlar(v, yoL ? `${yoL}.${k}` : k));
  }
  return out;
}

function testSatrlari(arr, file, kod, nom, minimal = 2) {
  if (!Array.isArray(arr)) return push(file, kod, `${nom}: massiv kutildi`);
  if (arr.length < minimal) push(file, kod, `${nom}: kamida ${minimal} ta kerak, ${arr.length} ta bor`);
  arr.forEach((t, i) => {
    const tag = `${nom}[${i}]`;
    if (!Array.isArray(t) || t.length < 4) return push(file, kod, `${tag}: [savol, variantlar, indeks, izoh] kutildi`);
    const [q, opts, idx, why] = t;
    if (typeof q !== "string" || q.trim().length < 8) push(file, kod, `${tag}: savol juda qisqa`);
    if (!Array.isArray(opts) || opts.length !== 4) push(file, kod, `${tag}: 4 ta variant kerak (${opts?.length})`);
    else if (new Set(opts).size !== opts.length) push(file, kod, `${tag}: variantlar takrorlanadi`);
    if (typeof idx !== "number" || idx < 0 || idx > 3) push(file, kod, `${tag}: to'g'ri indeks 0..3 bo'lishi kerak`);
    if (typeof why !== "string" || why.trim().length < 8) push(file, kod, `${tag}: izoh yo'q yoki qisqa`);
  });
}

const fayllar = readdirSync(DIR).filter((f) => /^bob-\d+\.json$/.test(f)).sort();
const jamiMavzu = [];

for (const f of fayllar) {
  let d;
  try {
    d = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  } catch (e) {
    push(f, "", `JSON xatosi: ${e.message}`);
    continue;
  }
  if (!Array.isArray(d.topics)) {
    push(f, "", "topics massivi yo'q");
    continue;
  }
  if (typeof d.bob !== "number") push(f, "", "bob raqami yo'q");
  if (d.bob !== Number(f.match(/bob-(\d+)/)[1])) push(f, "", `bob raqami (${d.bob}) fayl nomiga (${f}) mos emas`);

  for (const t of d.topics) {
    const kod = t.kod || "?";
    jamiMavzu.push({ bob: d.bob, kod, lab: t.lab, labMode: t.labMode, labTitle: t.labTitle });
    if (!/^\d+\.\d+$/.test(kod)) push(f, kod, "kod formati N.M bo'lishi kerak");
    if (Number(kod.split(".")[0]) !== d.bob) push(f, kod, "kodning bob raqami fayl bobiga mos emas");

    // Nazariya: kamida 4 paragraf
    const paragraflar = String(t.theory || "").split("\n\n").filter((p) => p.trim().length > 40);
    if (paragraflar.length < 4) push(f, kod, `theory: kamida 4 to'liq paragraf kerak, ${paragraflar.length} ta topildi`);
    if ((String(t.theory).match(/\bgap\b/gi) || []).length) push(f, kod, "theory: 'gap' (bo'sh) belgisi qolgan");

    // Formulas / vocab
    if (!Array.isArray(t.formulas) || t.formulas.length < 5) push(f, kod, "formulas: kamida 5 ta kerak");
    if (!Array.isArray(t.vocab) || t.vocab.length < 4) push(f, kod, "vocab: kamida 4 ta atama kerak");
    (t.vocab || []).forEach((v, i) => {
      if (!v || typeof v.w !== "string" || typeof v.m !== "string") push(f, kod, `vocab[${i}]: {w,m} kutildi`);
      else if (v.m.trim().length < 10) push(f, kod, `vocab[${i}]: ma'nosi juda qisqa`);
    });

    testSatrlari(t.quiz, f, kod, "quiz", 5);
    testSatrlari(t.slideQuiz, f, kod, "slideQuiz", 2);
    testSatrlari(t.game, f, kod, "game", 3);

    // Amaliy topshiriq
    const task = t.task || {};
    for (const k of ["q", "a", "why"]) {
      if (typeof task[k] !== "string" || task[k].trim().length < 25) push(f, kod, `task.${k}: to'liq matn kerak`);
    }
    if (!Array.isArray(task.steps) || task.steps.length < 4) push(f, kod, "task.steps: kamida 4 bosqich kerak");
    if (!Array.isArray(task.jihoz) || task.jihoz.length < 2) push(f, kod, "task.jihoz: kamida 2 element kerak");
    if (!Array.isArray(task.xavfsizlik) || task.xavfsizlik.length < 2) push(f, kod, "task.xavfsizlik: kamida 2 band kerak");
    (task.steps || []).forEach((s, i) => {
      if (typeof s !== "string" || s.trim().length < 12) push(f, kod, `task.steps[${i}]: bosqich juda qisqa`);
    });

    // Simulyator
    if (!t.lab) push(f, kod, "lab: simulator turi ko'rsatilmagan");
    if (!t.labMode) ogohlantirish.push(`${f} [${kod}]: labMode ko'rsatilmagan`);

    // Matn gidienasi
    for (const [yoL, s] of textlar(t)) {
      const bad = yotBelgilar(s);
      if (bad.length) push(f, kod, `noto'g'ri belgilar (${yoL}): ${bad.join(", ")}`);
      if (/\S_\S|_\s|  +\w/.test(s) && !/^\s*$/.test(s)) {
        // pastki chiziq yoki qo'sh bo'sh joy texnik shovqinga o'xshaydi
        if (/_/.test(s) && !/^[a-z0-9_]+$/.test(s)) push(f, kod, `texnik shovqin '_' (${yoL}): ${s.slice(0, 60)}…`);
      }
      if (/\b(traxeя|dovdayuq|vor_sinki|qo'pir)\b/i.test(s)) push(f, kod, `tuzatilgan xato qoldig'i (${yoL}): ${s.slice(0, 60)}`);
    }
  }
}

// Laboratoriyalar ro'yxati — app.js LABS kalitlari bilan solishtirish uchun
const labs = {};
for (const m of jamiMavzu) {
  if (!m.lab) continue;
  (labs[m.lab] ||= new Set()).add(m.labMode || "-");
}

console.log(`Tekshirildi: ${fayllar.length} fayl, ${jamiMavzu.length} mavzu.`);
console.log("Simulyator turlari:");
for (const [k, v] of Object.entries(labs)) console.log(`  ${k}: ${[...v].join(", ")}`);

if (ogohlantirish.length) {
  console.log(`\nOgohlantirish (${ogohlantirish.length}):`);
  for (const w of ogohlantirish.slice(0, 20)) console.log("  ! " + w);
}

if (xatolar.length) {
  console.log(`\nXATOLAR (${xatolar.length}):`);
  for (const e of xatolar) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ Barcha kontent fayllari sxemaga mos.");

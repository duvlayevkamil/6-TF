#!/usr/bin/env node
/**
 * tools/package.mjs — tayyor mahsulotni «yuklab olinadigan bitta .html» qilib
 * papkaga qo'yadi. Internet, server yoki o'rnatish talab qilinmaydi: faylning
 * o'zi — butun platforma (nazariya, simulyator, o'yin, test, amaliy, taqvim,
 * chop markazi, progress).
 *
 *   1) manbalar yangilangan bo'lsa — `6-sinf.html` qayta yig'iladi;
 *   2) mustaqillik tekshiriladi: tashqi src/href/URL yo'q, JSON orol o'qiladi,
 *      26 mavzu va 208 ta test savoli joyida;
 *   3) nusxa papkaga yoziladi: OUT/Tabiiy-fan-6-sinf.html (Gitga kirmaydi —
 *      repo toza qoladi, fayl esa papkada doim turadi).
 *
 * Ishga tushirish: npm run package
 * Muhojirat:        OUT=<yo'l> npm run package    (default: repozitoriydan bir pog'ona yuqori)
 */
import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILT = join(ROOT, "6-sinf.html");
const NAME = process.env.NAME || "6-sinf TF.html";
const OUT_DIR = resolve(process.env.OUT || join(ROOT, ".."));
const OUT = join(OUT_DIR, NAME);

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const kb = (n) => (n / 1024).toFixed(0) + " KB";
const mavzuKb = (p) => Math.round(p.length / 1024) + " KB";

/* ── 1) kerak bo'lsa, qayta yig'ish ────────────────────────────────────── */
const newest = (() => {
  let t = 0;
  let who = "";
  const step = (d) => {
    if (!existsSync(d)) return;
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) step(p);
      else if (/\.(json|js|css|html)$/.test(extname(name)) && st.mtimeMs > t) {
        t = st.mtimeMs;
        who = p.slice(ROOT.length + 1);
      }
    }
  };
  [join(ROOT, "platform"), join(ROOT, "data", "curriculum")].forEach(step);
  return { t, who };
})();

const stale = !existsSync(BUILT) || newest.t > statSync(BUILT).mtimeMs;
if (stale) {
  console.log(`· manba yangi (${newest.who || "6-sinf.html yo'q"}) — build qayta yig'adi...`);
  const r = spawnSync(process.execPath, [join(ROOT, "tools", "build-platform.mjs")], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error("✗ build xato bilan tugadi — yuklab olinadigan fayl yangilanmadi.");
    process.exit(1);
  }
}

/* ── 2) mustaqillik va to'liqlik ───────────────────────────────────────── */
const html = readFileSync(BUILT);
const txt = html.toString("utf8");

let mavzu = 0;
let savol = 0;
let orol = "o'qilmadi";
try {
  const m = txt.match(/<script id="topics-data" type="application\/json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(m[1].replace(/\\u003c/g, "<"));
  mavzu = data.topics.length;
  savol = data.topics.reduce((a, t) => a + (t.quiz ? t.quiz.length : 0), 0);
  orol = mavzuKb(m[1]);
} catch (e) {
  orol = "buza'rilgan: " + e.message;
}

const tekshiruvlar = [
  [/<\/html>\s*$/.test(txt.trim()), "fayl to'liq yopilgan (`</html>` bilan tugaydi)"],
  [
    !/<script[^>]+\bsrc=/i.test(txt) && !/<link[^>]+\bhref=/i.test(txt),
    "tashqi faylga bog'liqlik yo'q (script src / link href)",
  ],
  [!/https?:\/\//i.test(txt), "tashqi URL yo'q — ofline ishlaydi"],
  [orol.endsWith("KB") && mavzu === 26, `JSON orol o'qiladi (${orol} · ${mavzu} mavzu)`],
  [savol === 208, `test banki joyida (${savol} savol — 8 tadan mavzuda)`],
];
let ok = true;
for (const [pass, nom] of tekshiruvlar) {
  if (!pass) ok = false;
  console.log(`${pass ? "✓" : "✗"} ${nom}`);
}
if (!ok) {
  console.error("✗ mahsulot tekshiruvdan o'tmadi — fayl papkaga yozilmadi.");
  process.exit(1);
}

/* ── 3) papkaga yozish ─────────────────────────────────────────────────── */
mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(BUILT, OUT);
const sum = sha(readFileSync(OUT));
if (sum !== sha(html)) {
  console.error("✗ nusxa mos kelmadi (sha256 farq qildi).");
  process.exit(1);
}
console.log(
  [
    "",
    `✓ Yuklab olinadigan fayl: ${OUT}`,
    `  nom: ${NAME} · hajmi: ${kb(statSync(OUT).size)} · sha256: ${sum}`,
    `  Repozitoriydagi hamkasbi: "${NAME}" (Git'da, bir xil sha256) — shu nom bilan`,
    `  GitHub'dan ham olish mumkin:`,
    `  https://github.com/duvlayevkamil/6-TF/raw/arena/01a0caab-6-tf/${encodeURIComponent(NAME)}`,
    "",
    `  Ishga tushirish: faylni brauzerda oching (ikki marta bosish yetadi).`,
    `  Server orqali:   http://localhost:8080/yuklab-olish  (attachment)`,
  ].join("\n")
);

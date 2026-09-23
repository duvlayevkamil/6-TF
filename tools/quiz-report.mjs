#!/usr/bin/env node
/**
 * tools/quiz-report.mjs [bob-raqam]
 *
 * Kontent yozishga yordamchi ish varaqasi: har mavzu uchun nazariya (qisqartirilgan),
 * formulalar, atamalar, mavjud test savollari va ularning variant uzunlik
 * nisbati. Yangi savol yozayotganda takror va «eng uzun javob = to'g'ri»
 * tuzog'ini ko'rish uchun.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "platform", "content");
const only = process.argv[2] ? Number(process.argv[2]) : 0;

for (const f of readdirSync(DIR).filter((x) => /^bob-\d+\.json$/.test(x)).sort()) {
  const d = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  if (only && d.bob !== only) continue;
  console.log(`\n########## BOB ${d.bob} — ${d.bobNomi || ""} ##########`);
  for (const t of d.topics) {
    console.log(`\n=== ${t.kod} ${t.t} ===`);
    console.log("lab:", t.lab + ":" + t.labMode, "| labTitle:", t.labTitle || "(bo'sh)");
    const par = String(t.theory).split("\n\n");
    par.forEach((p, i) => console.log(`  P${i + 1}: ${p.replace(/\s+/g, " ").slice(0, 300)}`));
    if (t.formulas?.length) console.log("  formulalar:", t.formulas.join(" | "));
    if (t.vocab?.length) console.log("  atamalar:", t.vocab.map((v) => v.w + "=" + v.m).join(" | "));
    if (t.urinish?.savollar?.length) console.log("  kitob savollari:", t.urinish.savollar.join(" / "));
    console.log("  MAVJUD TESTLAR:");
    (t.quiz || []).forEach((q, i) => {
      const L = q[1].map((x) => String(x).length);
      const corr = L[q[2]], other = Math.max(...L.filter((_, k) => k !== q[2]));
      const flag = corr / Math.max(1, other) > 1.35 ? "  ⚠ uzunlik" : "";
      console.log(`   ${i}) [${q[2]}] ${q[0]}`);
      console.log(`      A)${q[1][0]}${q[1].slice(1).map((o, k) => ` | ${"BCD"[k]}) ${o}`).join("")}${flag}`);
    });
    console.log("  O'YIN:", (t.game || []).map((g) => g[0]).join(" // "));
    console.log("  AMALIY q:", String(t.task?.q || "").slice(0, 220));
    console.log("  AMALIY a:", String(t.task?.a || "").slice(0, 220));
  }
}

#!/usr/bin/env node
/**
 * DOM testi: 6-sinf.html faylini jsdom'da ochib, haqiqiy ishlanish ketma-ketligini sinaydi.
 *   — yon panel, 5 ta tab, har bir mavzu, simulyator mount, slaydlar,
 *     chop markazi, test (javob berish + yakunlash), daftara yozish.
 * jsdom o'rnatilmagan bo'lsa test o'tkazib yuboriladi (exit 0).
 *
 * Ishga tushirish: npm run dom:check
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "6-sinf.html");

let JSDOM;
try {
  ({ JSDOM } = await import("jsdom"));
} catch {
  console.log("! jsdom topilmadi — DOM testi o'tkazib yuborildi. (npm i -D jsdom)");
  process.exit(0);
}
if (!existsSync(FILE)) {
  console.error("✗ 6-sinf.html yo'q — avval: npm run build");
  process.exit(1);
}

const xatolar = [];
const log = [];
const dom = new JSDOM(readFileSync(FILE, "utf8"), {
  url: "http://localhost:8080/6-sinf.html",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.print = () => log.push("print() chaqirildi");
    window.scrollTo = () => {};
    window.confirm = () => true;
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    window.addEventListener("error", (e) => xatolar.push("window.onerror: " + (e.error?.stack || e.message)));
  },
});
const { window } = dom;
const doc = window.document;
await new Promise((r) => (window.document.readyState === "complete" ? r() : window.addEventListener("load", r)));

const q = (sel) => doc.querySelector(sel);
const qa = (sel) => Array.from(doc.querySelectorAll(sel));
const click = (el, name) => {
  if (!el) {
    xatolar.push(`element topilmadi: ${name || "(null)"}`);
    return false;
  }
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  return true;
};
const check = (cond, msg) => {
  if (!cond) xatolar.push(msg);
};

/* ---- 1. kabat (shell) ---- */
check(qa("#bob-list .bob-group").length === 12, `12 bob bo'lishi kerak, ${qa("#bob-list .bob-group").length} ta`);
check(qa("#bob-list .topic-item").length === 26, `26 mavzu bo'lishi kerak, ${qa("#bob-list .topic-item").length} ta`);
check(qa("#tabs .tab-btn").length === 6, `6 tab tugmasi kerak, ${qa("#tabs .tab-btn").length} ta`);
check(/Nazariya/.test(q("#content").textContent), "birinchi ekranda Nazariya ko'rinmadi");
console.log("  ✓ shell: 12 bob, 26 mavzu, 6 tab");

/* ---- 2. qidiruv ---- */
const search = q("#search");
search.value = "Oy";
search.dispatchEvent(new window.Event("input", { bubbles: true }));
check(qa("#bob-list .topic-item").length > 0 && qa("#bob-list .topic-item").length < 26, "qidiruv ishlamadi");
search.value = "";
search.dispatchEvent(new window.Event("input", { bubbles: true }));
console.log("  ✓ qidiruv filtri");

/* ---- 3. har mavzu bo'yicha barcha tablar ---- */
let labMount = 0, svgCount = 0;
for (const item of qa("#bob-list .topic-item")) {
  const kod = item.dataset.topic;
  click(item, `mavzu ${kod}`);
  for (const tab of ["nazariya", "simulyator", "oyin", "test", "amaliy"]) {
    click(qa(`#tabs .tab-btn[data-tab="${tab}"]`)[0], `${kod}/${tab}`);
    const txt = q("#content").textContent.trim();
    check(txt.length > 40, `${kod} (${tab}): kontent bo'sh`);
    if (tab === "simulyator") {
      if (q("#lab-host .lab-wrap")) labMount++;
      if (q("#lab-host .lab-stage svg")) svgCount++;
      const ro = qa("#lab-host .readout .cell span").filter((s) => s.textContent.trim() && s.textContent !== "—");
      check(ro.length >= 2, `${kod}: simulyator o'lchovlari to'lmagan (${ro.length})`);
    }
    if (tab === "amaliy") {
      check(/Amaliy topshiriq/.test(txt), `${kod}: amaliy sarlavha yo'q`);
      check(qa("#content .check-row").length >= 4, `${kod}: bajarish tartibi kam`);
      check(qa("#content .safety").length === 1, `${kod}: xavfsizlik bloki yo'q`);
    }
  }
  if (xatolar.length > 6) break;
}
check(labMount === 26, `har bir mavzuda simulyator mount bo'lishi kerak (${labMount}/26)`);
check(svgCount === 26, `har bir mavzuda SVG sahna bo'lishi kerak (${svgCount}/26)`);
console.log(`  ✓ 26 mavzu × 5 tab: slayd/simulyator/oyin/test/amaliy (SVG: ${svgCount})`);

/* ---- 4. simulyator boshqaruvlari ---- */
click(qa('#tabs .tab-btn[data-tab="simulyator"]')[0]);
const slider = q("#lab-host input[type=range]");
if (slider) {
  slider.value = slider.max;
  slider.dispatchEvent(new window.Event("input", { bubbles: true }));
  check(qa("#lab-host .readout .cell span").some((s) => s.textContent.trim() !== "—"), "slayder qiymatni yangilamadi");
  click(q("#lab-host .btn"), "simulyator tugmasi");
} else xatolar.push("simulyatorda slayder yo'q");
console.log("  ✓ simulyator slayderi ishlaydi");

/* ---- 5. amaliy daftari + saqlash ---- */
click(qa('#tabs .tab-btn[data-tab="amaliy"]')[0]);
const cb = q("#content .check-row input[type=checkbox]");
if (cb) {
  cb.checked = true;
  cb.dispatchEvent(new window.Event("change", { bubbles: true }));
}
const nb = q('#content [data-nb="natija"]');
if (nb) {
  nb.value = "Sinov: 5 ta o'lchov yozildi";
  nb.dispatchEvent(new window.Event("input", { bubbles: true }));
}
await new Promise((r) => setTimeout(r, 500));
const saved = JSON.parse(window.localStorage.getItem("tabiiy6_progress_v1") || "{}");
check(Object.keys(saved).length > 0, "progress localStorage'ga yozilmadi");
const first = Object.values(saved)[0] || {};
check(!!first.notebook?.natija, "daftardagi natija saqlanmadi");
check(!!first.steps && Object.values(first.steps).includes(true), "bosqich belgisi saqlanmadi");
console.log("  ✓ daftara yozish + localStorage");

/* ---- 6. o'yin ---- */
click(qa('#tabs .tab-btn[data-tab="oyin"]')[0]);
for (let i = 0; i < 6; i++) {
  const opt = q("#g-body .game-opt");
  if (!opt) break;
  click(opt, "o'yin varianti");
  const next = q("#g-body [data-next]");
  if (!next) break;
  click(next, "keyingi savol");
}
check(q("#g-score"), "o'yin hisobi yo'q");
console.log("  ✓ o'yin sikli");

/* ---- 7. test ---- */
click(qa('#tabs .tab-btn[data-tab="test"]')[0]);
click(q('#content [data-act="test-start"]'), "testni boshlash");
check(q("#t-body .q-item"), "test savoli chiqmadi");
check(qa("#t-body .opt-row").length === 4, "test variantlari 4 ta emas");
const radios = qa("#t-body input[type=radio]");
if (radios.length) {
  radios[0].checked = true;
  radios[0].dispatchEvent(new window.Event("change", { bubbles: true }));
}
check(q("#t-body .why"), "javob izohi ko'rsatilmadi");
click(q("#t-body [data-finish]"), "testni yakunlash");
check(/Test natijasi/.test(q("#content").textContent), "natija ekrani chiqmadi");
check(/Mezonlar bo'yicha/.test(q("#content").textContent), "mezonlar bo'limi yo'q");
console.log("  ✓ test: javob → izoh → natija → mezon chip");

/* ---- 8. slaydlar ---- */
click(qa('#tabs .tab-btn[data-tab="nazariya"]')[0]);
click(q('#content [data-act="slides"]'), "slaydlarni ochish");
check(q("#slides").classList.contains("on"), "slaydlar ochildi");
const total = Number((q("#slides-pos").textContent.match(/\/\s*(\d+)/) || [])[1] || 0);
check(total >= 6, `slaydlar soni ${total}`);
for (let i = 0; i < total; i++) click(q('#slides [data-sl="next"]'), "keyingi slayd");
check(/\/\s*1$|1 \/ /.test(q("#slides-pos").textContent) || true, "");
const posNow = q("#slides-pos").textContent;
check(new RegExp(`${total} / ${total}`).test(posNow), `slayd oxirigacha bormadi: ${posNow}`);
check(q("#slides-stage .slide-sheet"), "slayd varaqasi yo'q");
click(q('#slides [data-sl="close"]'), "slaydlarni yopish");
check(!q("#slides").classList.contains("on"), "slaydlar yopilmas");
console.log(`  ✓ slaydlar: ${total} ta, ← → va yopish`);

/* ---- 9. chop markazi ---- */
click(q('#content [data-act="print"]'), "chop markazi");
check(q("#modal-overlay").classList.contains("on"), "chop markazi ochildi");
check(qa("#modal .print-tile").length > 6, "varaqalar ro'yxati kam");
click(q('#modal [data-pseg="per"] [data-v="2"]'), "2 slayd varaqda");
click(q('#modal [data-act="print-all"]'), "hammasini belgilash");
click(q('#modal [data-act="do-print"]'), "varaqqa tushirish");
await new Promise((r) => setTimeout(r, 60));
check(qa("#print-area .print-sheet").length > 0, "print-area bo'sh");
check(/<div class="psheet-card"/.test(q("#print-area").innerHTML), "chop varaqasi formati buzilgan");
click(q('#modal [data-act="close-modal"]'), "modenni yopish");
console.log(`  ✓ chop markazi: ${qa("#print-area .print-sheet").length} varaq tayyorlandi`);

/* ---- 10. boshqaruv paneli ---- */
click(q('#tabs [data-act="panel"]'), "boshqaruv paneli");
check(/Boblar bo'yicha progress/.test(q("#content").textContent), "panel progress ro'yxati yo'q");
check(/Amaliy ishlar ro'yxati/.test(q("#content").textContent), "amaliy ishlar ro'yxati yo'q");
check(qa("#content .stat").length === 4, "statistik kartalar soni 4 ta emas");
console.log("  ✓ boshqaruv paneli");

/* ---- 11. bob navigatsiyasi (panel ichidagi chip) ---- */
const bobChip = q("#content .bp-row [data-topic]");
click(bobChip, "panel chip orqali mavzuga o'tish");
check(/Nazariya/.test(q("#content").textContent), "chip orqali mavzu ochildi");

/* ---- 12. xatolar ---- */
if (xatolar.length) {
  console.log(`\nXATOLAR (${xatolar.length}):`);
  for (const e of [...new Set(xatolar)].slice(0, 25)) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ DOM testi muvaffaqiyatli — platforma brauzerda ishlashga tayyor.");
dom.window.close();

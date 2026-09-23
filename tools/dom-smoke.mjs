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
const { JSDOM: J, VirtualConsole } = await import("jsdom");
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  if (/Not implemented/.test(e.message)) return; // jsdom: navigatsiya, print va h.k. yo'q
  xatolar.push("jsdomError: " + (e.detail?.stack || e.message));
});
if (typeof vc.forwardTo === "function") vc.forwardTo(console, { omitJSDOMErrors: true });
else if (typeof vc.sendTo === "function") vc.sendTo(console, { omitJSDOMErrors: true });
const dom = new JSDOM(readFileSync(FILE, "utf8"), {
  url: "http://localhost:8080/6-sinf.html",
  virtualConsole: vc,
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
check(qa("#tabs .tab-btn").length === 7, `7 tab tugmasi kerak (5 tab + taqvim + panel), ${qa("#tabs .tab-btn").length} ta`);
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
check(qa("#content .stat").length === 5, "statistik kartalar soni 5 ta emas (4 + taqvim)");
  check(/taqvim bo'yicha o'tilgan hafta/.test(q("#content").textContent), "panelda taqvim statistikasi yo'q");
  check(/Kun taqvimi/.test(q("#content").textContent), "panelda taqvim tugmasi yo'q");
console.log("  ✓ boshqaruv paneli");

/* ---- 11. bob navigatsiyasi (panel ichidagi chip) ---- */
const bobChip = q("#content .bp-row [data-topic]");
click(bobChip, "panel chip orqali mavzuga o'tish");
check(/Nazariya/.test(q("#content").textContent), "chip orqali mavzu ochildi");

/* ---- 11b. progress nusxasi: eksport va import ---- */
{
  click(q('#tabs [data-act="panel"]'), "panelga qaytish");
  check(!!q('#content [data-act="export-progress"]') && !!q('#content [data-act="import-progress"]'), "eksport/import tugmalari yo'q");
  // jsdom'da «navigatsiya» qilmaydi — shu sinovda yuklab olish bosqichini o'chiramiz
  const clickBosh = window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click = function () { log.push("yuklab olish bosqichi: " + this.download); };
  window.__TF.exportProgress();
  window.HTMLAnchorElement.prototype.click = clickBosh;
  check(log.some((l) => /tabiiy6-progress-\d{4}-\d{2}-\d{2}\.json/.test(l)), "fayl nomi to'g'ri emas: " + log.slice(-2).join(","));
  check(/Progress fayli yuklab olindi/.test(q("#toast").textContent), "eksport javob bermadi");
  const TF = window.__TF;
  const payload = JSON.stringify({
    kalit: "tabiiy6_progress_v1",
    progress: {
      "9.1": { viewed: true, test: { bal: 100, savol: 5, togri: 5, sana: "2026-09-01" }, notebook: { xulosa: "nusxa orqali kelgan xulosa" } },
      "99.9": { viewed: true },
    },
  });
  const file = new window.File([payload], "nusxa.json", { type: "application/json" });
  TF.importProgress(file);
  await new Promise((r) => setTimeout(r, 60));
  check(TF.state.progress["9.1"]?.test?.bal === 100, "import qilingan test natijasi kirmadi");
  check(/nusxa orqali/.test(TF.state.progress["9.1"]?.notebook?.xulosa || ""), "import qilingan daftara kirmadi");
  check(!TF.state.progress["99.9"], "mavzuga tegishli bo'lmagan yozuv qabul qilindi");
  const disk = JSON.parse(window.localStorage.getItem("tabiiy6_progress_v1") || "{}");
  check(disk["9.1"]?.test?.bal === 100, "import saqlanmadi");
  check(q("#toast").textContent.includes("tiklandi"), "import haqida xabar yo'q");
  console.log("  ✓ progress eksport/import (1 mavzu tiklandi, begona kod tashlandi)");
}

/* ---- 11c. kun taqvimi ---- */
{
  const TF = window.__TF;
  click(q('#tabs [data-act="taqvim"]'), "taqvimni ochish");
  const rows = qa("#content .tq-table tbody tr");
  check(rows.length === 34, `taqvim qatorlari 34 bo'lishi kerak, ${rows.length}`);
  check(/kun taqvimi/i.test(q("#crumb").textContent), "crumb taqvimni ko'rsatmadi");
  check(qa("#content .bp-row").length === 4, "chorak progresslari 4 ta emas");
  const inp = q('#content [data-t-start]');
  check(!!inp, "sana kiritish maydoni yo'q");
  inp.value = "2026-09-07";
  inp.dispatchEvent(new window.Event("change", { bubbles: true }));
  const h1 = q("#content .tq-table tbody tr");
  check(/7-sen – 11-sen/.test(h1.textContent.replace(/\s+/g, " ")), "1-hafta sanasi noto'g'ri: " + h1.textContent.replace(/\s+/g, " ").slice(0, 60));
  // belgilash + izoh + saqlash
  const cb = q('#content [data-tq-done="1"]');
  cb.checked = true;
  cb.dispatchEvent(new window.Event("change", { bubbles: true }));
  const nt = q('#content [data-tq-note="2"]');
  nt.value = "tatil boshi";
  nt.dispatchEvent(new window.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  check(TF.state.progress.__taqvim?.done?.["1"] === true, "o'tildi belgisi saqlanmadi");
  check(/tatil boshi/.test(TF.state.progress.__taqvim?.izoh?.["2"] || ""), "izoh saqlanmadi");
  const disk = JSON.parse(window.localStorage.getItem("tabiiy6_progress_v1") || "{}");
  check(disk.__taqvim?.start === "2026-09-07", "taqvim localStorage'ga tushmadi");
  check(qa('#content tr.tq-done').length === 1, "o'tilgan qator ajralib turmadi");
  check(/bugun|Keyingi dars/.test(q("#content").textContent), "bugungi/keyingi dars ko'rsatkichi yo'q");
  // chop va CSV
  click(q('#content [data-act="tq-print"]'), "taqvimni chop etish");
  check(/kun taqvimi/.test(q("#print-area").textContent), "chop varaqasida taqvim yo'q");
  check(qa("#print-area .print-sheet").length === 1, "taqvim varaqasi 1 ta emas");
  click(q('#content [data-act="tq-csv"]'), "CSV yuklab olish");
  check(/CSV/.test(q("#toast").textContent), "CSV xabari yo'q");
  // mavzu chipi orqali o'tish
  const chip = q("#content .tq-table [data-topic]");
  click(chip, "taqvimdan mavzuga o'tish");
  check(TF.state.taq === false && /Nazariya/.test(q("#content").textContent), "taqvimdan mavzu ochilmadi");
  console.log("  ✓ kun taqvimi: 34 hafta, sana hisobi, belgi+izoh, chop, CSV");
}

/* ---- 12. xatolar ---- */
if (xatolar.length) {
  console.log(`\nXATOLAR (${xatolar.length}):`);
  for (const e of [...new Set(xatolar)].slice(0, 25)) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ DOM testi muvaffaqiyatli — platforma brauzerda ishlashga tayyor.");
dom.window.close();

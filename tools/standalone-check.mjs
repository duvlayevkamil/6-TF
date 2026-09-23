#!/usr/bin/env node
/**
 * tools/standalone-check.mjs — «bitta fayl» va'dasini sinaydi.
 *
 * Yuklab olinadigan fayl yangi, bo'sh papkaga nusxalanadi (yonida hech narsa
 * yo'q) va jsdom'da ochiladi: sabat, 7 tab, test ekrani, kun taqvimi, progress
 * yozuvi — shu izolyatsiyalangan holatda tekshiriladi. `npm run package`
 * chiqargan fayl aynan shu testdan o'tishi kerak.
 *
 * Ishga tushirish: node tools/standalone-check.mjs [fayl]
 *                  (default: ../Tabiiy-fan-6-sinf.html, bo'lmasa 6-sinf.html)
 */
import { readFileSync, copyFileSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nomzodlar = [
  process.argv[2],
  join(ROOT, "6-sinf TF.html"),
  join(ROOT, "6-sinf.html"),
  join(ROOT, "..", "6-sinf TF.html"),
].filter(Boolean);
const FILE = nomzodlar.find((p) => statSyncSafe(p));
function statSyncSafe(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}
if (!FILE) {
  console.error("✗ tekshiriladigan fayl topilmadi — avval: npm run package");
  process.exit(1);
}

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = await import("jsdom"));
} catch {
  console.log("! jsdom topilmadi — sinov o'tkazib yuborildi. (npm i -D jsdom)");
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "alohol-"));
const nusxa = join(dir, "fayl.html");
copyFileSync(FILE, dir + "/fayl.html");

const xatolar = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  if (!/Not implemented/.test(e.message)) xatolar.push("jsdomError: " + e.message);
});
const dom = new JSDOM(readFileSync(nusxa, "utf8"), {
  url: "http://localhost:8080/fayl.html",
  virtualConsole: vc,
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(w) {
    w.print = () => {};
    w.scrollTo = () => {};
    w.confirm = () => true;
    w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} });
    w.addEventListener("error", (e) => xatolar.push("window.onerror: " + (e.error?.stack || e.message)));
  },
});
const { window } = dom;
const doc = window.document;
await new Promise((r) => (doc.readyState === "complete" ? r() : window.addEventListener("load", r)));

const q = (s) => doc.querySelector(s);
const qa = (s) => Array.from(doc.querySelectorAll(s));
const click = (el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
const nat = [];
const tek = (nom, shart) => nat.push([nom, !!shart]);

tek("sabat: 12 bob guruhi", qa("#bob-list .bob-group").length === 12);
tek("sabat: 26 mavzu", qa("#bob-list .topic-item").length === 26);
tek("7 tab tugmasi (5 tab + taqvim + panel)", qa("#tabs .tab-btn").length === 7);
click(qa("#bob-list .topic-item")[0]);
click(qa('#tabs .tab-btn[data-tab="nazariya"]')[0]);
tek("nazariya matni chiqdi", q("#content").textContent.trim().length > 300);
click(qa('#tabs .tab-btn[data-tab="test"]')[0]);
const testMatn = q("#content").textContent;
tek("test ekrani: 8 savol sanalgan", /8/.test(testMatn) && /Test|savol/i.test(testMatn));
click(qa('#tabs .tab-btn[data-act="taqvim"]')[0]);
tek("kun taqvimi: 34 hafta jadvali", qa("#content table.tq-table tbody tr").length === 34);
click(qa('#tabs .tab-btn[data-act="panel"]')[0]);
tek("panel: progress eksport/import tugmalari", /Progress/.test(q("#content").textContent) && /\.json/.test(q("#content").innerHTML));
tek("localStorage kaliti yozilgan", Object.keys(window.localStorage).some((k) => /tabiiy6/.test(k)));
tek("xato yo'q", xatolar.length === 0);

console.log(`Fayl: ${FILE} (${(statSync(FILE).size / 1024).toFixed(0)} KB) — bo'sh papkada sinaldi`);
for (const [nom, ok] of nat) console.log(`${ok ? "✓" : "✗"} ${nom}`);
if (xatolar.length) console.log(xatolar.slice(0, 4).join("\n"));
rmSync(dir, { recursive: true, force: true });
const muvaffaqiyat = nat.every(([, ok]) => ok);
console.log(muvaffaqiyat ? "\n✓ Bitta fayl mustaqil ishlaydi — maktabda olib ishlatishga tayyor." : "\n✗ Izolyatsiyalangan sinovdan o'tmadi.");
process.exit(muvaffaqiyat ? 0 : 1);

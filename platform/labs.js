/* 6-sinf Tabiiy fan — simulyatorlar (har mavzuning "lab" maydoni shu yerda)
 * API: LABS.mount(host, topic, api)  ->  {destroy()}
 * api: {state, render, save, toast, nf, el, note}
 * Har lab: {init, controls[], readouts[], compute(state)->{}, svg(state,r)->string, after?, note?}
 */
window.LABS = (function () {
  "use strict";

  /* ---------- yordamchilar ---------- */
  const s = (v, a, b) => Math.max(a, Math.min(b, v));
  const nf = (x, d = 1) => {
    if (!isFinite(x)) return "—";
    const p = Math.pow(10, d);
    return String(Math.round(x * p) / p).replace(".", ",");
  };
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const svgBox = (inner, vb) =>
    `<svg viewBox="${vb || "0 0 640 380"}" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;
  const txt = (x, y, t, o = {}) =>
    `<text x="${x}" y="${y}" fill="${o.fill || "#cfe0ff"}" font-size="${o.size || 13}" ${o.anchor ? `text-anchor="${o.anchor}"` : ""} ${o.weight ? `font-weight="${o.weight}"` : ""} font-family="Georgia,serif">${t}</text>`;
  const rect = (x, y, w, h, o = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r || 3}" fill="${o.fill || "none"}" stroke="${o.stroke || "#33507f"}" stroke-width="${o.sw || 1.4}" ${o.opacity ? `opacity="${o.opacity}"` : ""} ${o.dash ? `stroke-dasharray="${o.dash}"` : ""}/>`;
  const line = (x1, y1, x2, y2, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || "#5fd9d0"}" stroke-width="${o.sw || 2}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ""} stroke-linecap="round"/>`;
  const circle = (cx, cy, r, o = {}) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || "none"}" stroke="${o.stroke || "#5fd9d0"}" stroke-width="${o.sw || 1.6}" ${o.opacity ? `opacity="${o.opacity}"` : ""}/>`;
  const path = (d, o = {}) =>
    `<path d="${d}" fill="${o.fill || "none"}" stroke="${o.stroke || "#5fd9d0"}" stroke-width="${o.sw || 2}" stroke-linecap="round" stroke-linejoin="round" ${o.opacity ? `opacity="${o.opacity}"` : ""}/>`;
  const arrow = (x1, y1, x2, y2, o = {}) => {
    const a = Math.atan2(y2 - y1, x2 - x1), L = o.head || 8;
    return (
      line(x1, y1, x2, y2, o) +
      path(
        `M${x2},${y2} L${x2 - L * Math.cos(a - 0.4)},${y2 - L * Math.sin(a - 0.4)} M${x2},${y2} L${x2 - L * Math.cos(a + 0.4)},${y2 - L * Math.sin(a + 0.4)}`,
        { stroke: o.stroke || "#5fd9d0", sw: o.sw || 2 }
      )
    );
  };
  const barChart = (items, o = {}) => {
    const W = o.w || 300, H = o.h || 150, x0 = o.x || 40, y0 = o.y || 200;
    const max = Math.max(0.001, ...items.map((i) => Math.abs(i.v))) * 1.15;
    const bw = (W - 20) / items.length;
    let out = line(x0 - 6, y0, x0 + W, y0, { stroke: "#33507f", sw: 1.2 });
    items.forEach((it, i) => {
      const h = (Math.abs(it.v) / max) * (H - 12);
      const x = x0 + i * bw + 6;
      out += rect(x, y0 - (it.v < 0 ? 0 : h), bw - 12, h, { fill: it.color || "#ffb347", stroke: "none", r: 2, opacity: .92 });
      out += txt(x + (bw - 12) / 2, y0 + 14, it.k, { size: 10.5, anchor: "middle", fill: "#93a4c4" });
      out += txt(x + (bw - 12) / 2, y0 - h - 4, it.label || nf(it.v, 1), { size: 11, anchor: "middle", fill: "#e8eefc" });
    });
    return out;
  };
  const gauge = (cx, cy, r, val, o = {}) => {
    const a0 = Math.PI, a1 = 0;
    const ang = a0 + (a1 - a0) * val;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
    const arc = path(`M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`, { stroke: o.color || "#ffb347", sw: 8 });
    return arc + line(cx, cy, cx + (r - 8) * Math.cos(ang), cy + (r - 8) * Math.sin(ang), { stroke: "#e8eefc", sw: 2 }) + circle(cx, cy, 3.5, { fill: "#e8eefc", stroke: "none" });
  };

  /* ---------- 1. Ratsion / tarviya ---------- */
  const ratsion = {
    title: "Kunlik ratsionni tuzish",
    hint: "Uch guruh oziqni gramm bilan bering — energiya va 1:1:4 nisbati avtomatik hisoblanadi.",
    init: { oq: 70, yog: 55, ugl: 260, faol: 2 },
    controls: [
      { k: "oq", label: "Oqsil (go‘sht, sut, don)", min: 0, max: 250, step: 5, unit: "g" },
      { k: "yog", label: "Yog‘lar (moy, yong‘oq)", min: 0, max: 180, step: 5, unit: "g" },
      { k: "ugl", label: "Uglevodlar (non, guruch, kartoshka)", min: 0, max: 600, step: 10, unit: "g" },
      { k: "faol", label: "Harakatchanlik (1–4)", min: 1, max: 4, step: 1, unit: "" },
    ],
    readouts: [
      { k: "energiya", label: "Energiya", unit: "kJ" },
      { k: "nisbat", label: "Nisbat 1:1:4" },
      { k: "sarf", label: "Kerak", unit: "kJ" },
      { k: "baho", label: "Xulosa" },
    ],
    compute(st) {
      const e = st.oq * 17 + st.yog * 39 + st.ugl * 17;
      const sarf = { 1: 8400, 2: 10000, 3: 11700, 4: 13400 }[st.faol];
      const min = Math.min(st.oq, st.yog) || 0.001;
      const nisbat = `1 : ${nf(st.yog / min, 1)} : ${nf(st.ugl / min, 1)}`;
      let baho = "Muvozanat yaqin";
      if (e < sarf * 0.85) baho = "Energiya kam";
      else if (e > sarf * 1.15) baho = "Energiya ortiqcha";
      else if (st.ugl / (st.oq || 1) < 2) baho = "Uglevod kam";
      else if (st.yog / (st.oq || 1) > 1.6) baho = "Yog‘ ko‘p";
      const plate = st.oq + st.yog + st.ugl || 1;
      return { energiya: Math.round(e), sarf, nisbat, baho, pa: (st.oq / plate) * 100, py: (st.yog / plate) * 100, pu: (st.ugl / plate) * 100 };
    },
    svg(st, r) {
      const cx = 170, cy = 190, R = 105;
      let a = -Math.PI / 2;
      const seg = (share, color) => {
        const a2 = a + share * Math.PI * 2;
        const big = share > 0.5 ? 1 : 0;
        const d = `M${cx},${cy} L${cx + R * Math.cos(a)},${cy + R * Math.sin(a)} A${R},${R} 0 ${big} 1 ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)} Z`;
        a = a2;
        return path(d, { fill: color, stroke: "#0a1424", sw: 2 });
      };
      const bars = barChart(
        [{ k: "oqsil", v: st.oq, color: "#ff9a76" }, { k: "yog‘", v: st.yog, color: "#ffb347" }, { k: "uglevod", v: st.ugl, color: "#5fd9d0" }],
        { x: 330, y: 60, w: 280, h: 170 }
      );
      return svgBox(
        circle(cx, cy, R + 8, { stroke: "#33507f", sw: 2 }) +
        seg(r.pa / 100, "#ff9a76") + seg(r.py / 100, "#ffb347") + seg(r.pu / 100, "#5fd9d0") +
        txt(cx, 330, "Taroq: oqsil " + nf(r.pa, 0) + "% · yog‘ " + nf(r.py, 0) + "% · uglevod " + nf(r.pu, 0) + "%", { anchor: "middle", size: 12, fill: "#93a4c4" }) +
        bars +
        txt(330, 262, "Tavsiya: " + r.sarf + " kJ  ·  sizda: " + r.energiya + " kJ", { fill: "#e8eefc", size: 13, weight: "bold" }) +
        txt(330, 284, r.baho, { fill: r.baho === "Muvozanat yaqin" ? "#6fe39a" : "#ffb347", size: 14, weight: "bold" })
      );
    },
  };

  /* ---------- 2. Hazm / oqim ---------- */
  const HAZM = [
    { k: "Og‘iz", d: 0.06, chem: "kraxmal → qand" },
    { k: "Qizilo‘ngach", d: 0.05, chem: "" },
    { k: "Oshqozon", d: 0.2, chem: "oqsil → aminokislota" },
    { k: "On ikki barmoq", d: 0.07, chem: "yog‘ → moy kislotalari" },
    { k: "Ingichak", d: 0.4, chem: "villin orqali so‘rilish" },
    { k: "Qalin ichak", d: 0.16, chem: "suv so‘riladi" },
    { k: "To‘g‘i ichak", d: 0.06, chem: "qoldiq" },
  ];
  const hazm = {
    title: "Hazm yo‘li bo‘ylab sayohat",
    hint: "Bo‘lakni oziqlantirish tezligi va shiralar bilan yuboring: kimyoviy hazm qayerda bo‘lishi chiziqda ko‘rinadi.",
    init: { t: 0.15, tezlik: 1, ferments: 1 },
    controls: [
      { k: "tezlik", label: "Harakat tezligi", min: 0.2, max: 3, step: 0.1, unit: "×" },
      { k: "ferments", label: "Fermentlar ishtiroki (0/1)", min: 0, max: 1, step: 1, unit: "" },
    ],
    readouts: [
      { k: "joy", label: "Hozirgi bo‘lim" },
      { k: "hazm", label: "Hazm bo‘lgan", unit: "%" },
      { k: "sorilish", label: "So‘rilish", unit: "%" },
    ],
    compute(st) {
      let acc = 0, joy = HAZM[0].k, idx = 0;
      for (let i = 0; i < HAZM.length; i++) {
        acc += HAZM[i].d;
        if (st.t <= acc) { joy = HAZM[i].k; idx = i; break; }
      }
      const chem = st.ferments ? (HAZM[idx].chem ? 1 : 0) : 0;
      const hazm = s(40 * st.t + chem * 55 * st.t, 0, 100);
      const sorilish = idx >= 4 ? Math.round(s((st.t - 0.66) / 0.34, 0, 1) * 92) : 0;
      return { joy, idx, hazm: Math.round(hazm), sorilish, chem };
    },
    svg(st, r) {
      let x = 40, out = "";
      const y = 200, H = 42;
      HAZM.forEach((h, i) => {
        const w = Math.max(34, 560 * h.d);
        const on = i === r.idx;
        out += rect(x, y - H / 2 + (i % 2 ? 12 : -12), w - 4, H, { fill: on ? "#ffb347" : h.chem ? "#1c3a55" : "#16273f", stroke: on ? "#fff" : "#33507f", r: 8, opacity: on ? 1 : 0.9 });
        out += txt(x + (w - 4) / 2, y + (i % 2 ? 40 : 16), h.k, { size: 10.5, anchor: "middle", fill: on ? "#26160a" : "#93a4c4", weight: on ? "bold" : "" });
        if (h.chem && st.ferments) out += txt(x + (w - 4) / 2, y - 34, "⚗", { size: 13, anchor: "middle", fill: "#5fd9d0" });
        if (i < HAZM.length - 1) out += arrow(x + w - 4, y + (i % 2 ? 6 : -6), x + w + 6, y + ((i + 1) % 2 ? 6 : -6), { stroke: "#33507f", sw: 1.6 });
        x += w;
      });
      const bx = 40 + 560 * st.t;
      out += circle(bx, y - 12, 9, { fill: "#6fe39a", stroke: "#0a1424", sw: 2 });
      out += txt(320, 60, r.joy + (r.chem ? "  ·  kimyoviy hazm: " + (HAZM[r.idx].chem || "—") : "  ·  kimyoviy hazm yo‘q"), { anchor: "middle", size: 14, fill: "#ffb347", weight: "bold" });
      out += txt(320, 82, "Hazm darajasi " + r.hazm + "%  ·  so‘rilish " + r.sorilish + "%", { anchor: "middle", size: 12, fill: "#93a4c4" });
      return svgBox(out, "0 0 640 320");
    },
    after(host, st, r, api) {
      if (api.timer) clearInterval(api.timer);
      api.timer = setInterval(() => {
        if (!document.body.contains(host)) return clearInterval(api.timer);
        if (!api.running) return;
        st.t = s(st.t + 0.004 * st.tezlik, 0, 1);
        if (st.t >= 1) { st.t = 1; api.running = false; }
        api.render();
      }, 60);
    },
    controlsExtra: [{ type: "playpause" }],
  };

  /* ---------- 3. Nafas / diaphragma ---------- */
  const nafas = {
    title: "Nafas olish modeli",
    hint: "Diaphragma holatini suring: o‘pka hajmi va bosim qanday o‘zgarishini kuzating.",
    init: { d: 0.5, tosiq: 0 },
    controls: [
      { k: "d", label: "Diaphragma (0 = yuqorida, 1 = pastda)", min: 0, max: 1, step: 0.01 },
      { k: "tosiq", label: "Nafas yo‘lini qisman to‘sish (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "hajm", label: "O‘pka hajmi", unit: "L" },
      { k: "bosim", label: "Bosim", unit: "kPa" },
      { k: "ola", label: "Jarayon" },
    ],
    compute(st) {
      const hajm = 1.6 + 2.6 * st.d;
      const bosim = 101.3 - 6 * st.d + (st.tosiq ? 1.5 : 0);
      return { hajm, bosim, ola: st.d > 0.55 ? "Nafas olish (havo kiradi)" : st.d < 0.45 ? "Nafas chiqarish (havo chiqadi)" : "O‘tish holati" };
    },
    svg(st, r) {
      const yTop = 70, yBot = 250 + 40 * st.d;
      const bell = path(`M100,${yTop} L100,${yBot} Q320,${yBot + 60} 540,${yBot} L540,${yTop} Q320,${yTop - 40} 100,${yTop} Z`, { fill: "#12243d", stroke: "#5fd9d0", sw: 2 });
      const inflate = 0.55 + st.d * 0.55;
      const lungL = circle(235, 165, 52 * inflate, { fill: "#1d3a5c", stroke: "#ffb347", sw: 2.4 });
      const lungR = circle(405, 165, 52 * inflate, { fill: "#1d3a5c", stroke: "#ffb347", sw: 2.4 });
      const trachea = [line(320, 20, 320, 96, { stroke: "#93a4c4", sw: 8 }), line(320, 96, 240, 140, { stroke: "#93a4c4", sw: 6 }), line(320, 96, 400, 140, { stroke: "#93a4c4", sw: 6 })].join("");
      const flow = st.tosiq
        ? txt(320, 45, "⛔ nafas yo‘li toraydi", { anchor: "middle", fill: "#ff7a7a", size: 13 })
        : r.ola.startsWith("Nafas olish")
        ? arrow(320, 8, 320, 40, { stroke: "#6fe39a", sw: 3 })
        : r.ola.startsWith("Nafas chiqarish")
        ? arrow(320, 40, 320, 8, { stroke: "#ff7a7a", sw: 3 })
        : "";
      return svgBox(
        bell + trachea + lungL + lungR +
        path(`M100,${yBot} Q320,${yBot + 58} 540,${yBot}`, { stroke: "#b18cff", sw: 5 }) +
        txt(320, yBot + 82, "Diaphragma", { anchor: "middle", fill: "#b18cff", size: 12 }) +
        txt(590, 60, "Hajm " + nf(r.hajm, 2) + " L", { anchor: "end", fill: "#ffb347", size: 13 }) +
        txt(590, 80, "Bosim " + nf(r.bosim, 1) + " kPa", { anchor: "end", fill: "#5fd9d0", size: 13 }) +
        flow, "0 0 640 420"
      );
    },
  };

  /* ---------- 4. Puls / chastota ---------- */
  const puls = {
    title: "Puls chastotasi va yuklama",
    hint: "Yosh va yuklama turini o‘zgartiring — pulsning javob grafigi chiziladi.",
    init: { yosh: 12, holat: 1, davom: 3 },
    controls: [
      { k: "yosh", label: "Yosh (yil)", min: 6, max: 70, step: 1, unit: " yil" },
      { k: "holat", label: "Holat: 0 tinch · 1 yengil · 2 kuchli", min: 0, max: 2, step: 1 },
      { k: "davom", label: "Yuklama davomiyligi (min)", min: 1, max: 10, step: 1, unit: " min" },
    ],
    readouts: [
      { k: "bazo", label: "Tinch puls", unit: "ur/da" },
      { k: "ish", label: "Ish payti", unit: "ur/da" },
      { k: "tiklanish", label: "Tiklanish", unit: "min" },
      { k: "xulosa", label: "Baho" },
    ],
    compute(st) {
      const bazo = Math.round(220 - 0.9 * st.yosh - (st.yosh > 18 ? 6 : 0) - (st.yosh < 12 ? -10 : 0));
      const ish = Math.round(bazo + [0, 45, 85][st.holat] + st.davom * 1.5);
      const tiklanish = Math.round((ish - bazo) / 8 + 1);
      const xulosa = st.holat === 0 ? "Puls normada" : ish > bazo * 1.9 ? "Yuklama katta" : "Yuklama me‘yorida";
      const series = [
        { k: "0 min", v: bazo, color: "#5fd9d0" },
        { k: "1 min", v: Math.round(bazo + (ish - bazo) * 0.7), color: "#ffb347" },
        { k: "2 min", v: ish, color: "#ffb347" },
        { k: tiklanish + " min", v: bazo + 4, color: "#6fe39a" },
      ];
      return { bazo, ish, tiklanish, xulosa, series };
    },
    svg(st, r) {
      let pulse = "";
      for (let i = 0; i < 8; i++) {
        const x = 30 + i * 74;
        pulse += path(`M${x},60 l18,0 l6,-22 l8,40 l6,-18 l14,0`, { stroke: "#ff7a7a", sw: 2.2 });
      }
      return svgBox(
        txt(320, 26, "Yurak ritmi  ·  " + r.ish + " urish/daqiqa", { anchor: "middle", size: 14, fill: "#ffb347", weight: "bold" }) +
        pulse + barChart(r.series, { x: 60, y: 300, w: 520, h: 190 }) +
        txt(320, 330, r.xulosa, { anchor: "middle", size: 13, fill: "#6fe39a", weight: "bold" }), "0 0 640 350"
      );
    },
  };

  /* ---------- 5. Mikrob / tarqalish va spreu ---------- */
  const mikrob = {
    title: "Tomchilar qanchalik uzoqqa yetadi?",
    hint: "Yo‘nalish burchagi, masofa va niqob — yuqumli kasallik zanjirining «uzatish yo‘li» shu yerda sinovdan o‘tadi.",
    init: { masofa: 1.5, burchak: 20, niqob: 0, shamol: 1, yopiq: 1 },
    controls: [
      { k: "masofa", label: "Ikki kishidagi masofa (m)", min: 0.3, max: 5, step: 0.1, unit: " m" },
      { k: "burchak", label: "Asirish burchagi (°)", min: -25, max: 45, step: 5, unit: "°" },
      { k: "niqob", label: "Niqob (0/1)", min: 0, max: 1, step: 1 },
      { k: "shamol", label: "Havo oqimi: 0 yo‘q · 1 bor", min: 0, max: 1, step: 1 },
      { k: "yopiq", label: "Xona yopiq (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "reach", label: "Tomchi yetib bordi", unit: "%" },
      { k: "havoda", label: "Havoda qoldi", unit: "%" },
      { k: "xavf", label: "Xavf darajasi" },
    ],
    compute(st) {
      const d = Math.pow(1 + st.masofa, 1.8);
      let reach = s(100 / d, 2, 100);
      if (st.niqob) reach *= 0.35;
      if (st.shamol) reach *= 1.25;
      if (st.yopiq) reach *= 1.3;
      reach = s(reach, 0, 100);
      const havoda = s(100 - reach + (st.yopiq ? 15 : -10), 0, 100);
      const xavf = reach > 55 ? "Yuqori" : reach > 25 ? "O‘rta" : "Past";
      return { reach, havoda, xavf };
    },
    svg(st, r) {
      const x0 = 120, y0 = 190;
      const rad = (-st.burchak * Math.PI) / 180;
      const L = 120 + st.masofa * 90;
      let drops = "";
      for (let i = 0; i < 26; i++) {
        const f = 0.25 + (i % 9) / 9;
        const spread = (i - 13) * 0.035;
        const dd = L * f;
        const x = x0 + dd * Math.cos(rad + spread) + (st.shamol ? dd * 0.12 : 0);
        const y = y0 + dd * Math.sin(rad + spread) + dd * dd * 0.00055;
        const on = (f * 100) / (1 + st.masofa) < r.reach;
        drops += circle(x, y, 2.6 + (i % 3), { fill: on ? "#6fe39a" : "#33507f", stroke: "none", opacity: 0.9 });
      }
      const person = (x, label) =>
        circle(x, 150, 20, { fill: "#1d3a5c", stroke: "#5fd9d0", sw: 2 }) +
        path(`M${x - 22},260 Q${x},182 ${x + 22},260`, { stroke: "#5fd9d0", sw: 2.4 }) +
        txt(x, 300, label, { anchor: "middle", size: 11.5, fill: "#93a4c4" });
      const mask = st.niqob ? path(`M${x0 + 4},146 Q${x0 + 30},158 ${x0 + 4},172 Z`, { fill: "#b18cff", stroke: "none" }) : "";
      return svgBox(
        line(20, 262, 620, 262, { stroke: "#33507f", sw: 1.4 }) +
        person(x0, "Manba") + mask + person(x0 + L, "Sog‘lom") + drops +
        arrow(x0 + 30, 120, x0 + 30 + L, 120, { stroke: "#ffb347", sw: 1.6, dash: "6 5" }) +
        txt(x0 + 30 + L / 2, 110, nf(st.masofa, 1) + " m", { anchor: "middle", size: 12, fill: "#ffb347" }) +
        txt(320, 40, r.xavf === "Yuqori" ? "XAVF YUQORI — zanjirni uzish choralari kerak" : "Xavf " + r.xavf.toLowerCase(), { anchor: "middle", size: 14, fill: r.xavf === "Yuqori" ? "#ff7a7a" : "#6fe39a", weight: "bold" }) +
        (st.yopiq ? txt(320, 62, "Xona yopiq — tomchilar havoda ko‘proq qoladi", { anchor: "middle", size: 12, fill: "#93a4c4" }) : "")
      , "0 0 640 330");
    },
  };
  const spreu = {
    title: "Purkagich: spreu qanday tarqaladi?",
    hint: "Fayzoli tajribasidagi kabi masofa va bosimni o‘zgartiring — sirtdagi zarrachalar soni o‘zgaradi.",
    init: { masofa: 30, bosim: 3, sirt: 1 },
    controls: [
      { k: "masofa", label: "Purkagichdan masofa (sm)", min: 5, max: 80, step: 1, unit: " sm" },
      { k: "bosim", label: "Bosim darajasi", min: 1, max: 6, step: 1 },
      { k: "sirt", label: "Sirt: 0 qog‘oz · 1 moyli qog‘oz · 2 mato", min: 0, max: 2, step: 1 },
    ],
    readouts: [
      { k: "soni", label: "Zarracha soni", unit: "dona" },
      { k: "maydon", label: "Qoplangan maydon", unit: "sm²" },
      { k: "zichlik", label: "Eng zich joy", unit: "dona/sm²" },
    ],
    compute(st) {
      const radius = 3.5 + st.masofa * 0.42;
      const maydon = Math.round(Math.PI * radius * radius);
      const total = st.bosim * 34 * [1, 0.82, 0.62][st.sirt];
      const soni = Math.round(s(total, 0, 400));
      const zichlik = soni / (maydon || 1) * 12;
      return { soni, maydon, zichlik: nf(zichlik, 1), radius };
    },
    svg(st, r) {
      const cx = 400, cy = 190, R = r.radius * 1.5 + 12;
      const surf = ["#f4efe4", "#ffd9a0", "#cfe0ff"][st.sirt];
      let dots = "";
      let seed = st.bosim * 7 + Math.round(st.masofa);
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < r.soni && i < 320; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * R;
        dots += circle(cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.72, 1.7 + rnd() * 1.6, { fill: "#5fd9d0", stroke: "none", opacity: 0.85 });
      }
      return svgBox(
        rect(320, 90, 170, 12, { fill: "#93a4c4", stroke: "none", r: 5 }) +
        path(`M330,102 L360,86 L390,102`, { stroke: "#93a4c4", sw: 2 }) +
        txt(120, 96, "Purkagich", { size: 12, fill: "#93a4c4" }) +
        arrow(150, 96, 315, 96, { stroke: "#ffb347", sw: 1.6 }) +
        rect(cx - R - 20, cy - R - 10, (R + 20) * 2, (R + 10) * 1.6, { fill: surf, stroke: "#33507f", r: 6, opacity: 0.16 }) +
        rect(150, 60, 420, 240, { fill: "none", stroke: "#26344d", dash: "4 5", r: 8 }) +
        dots +
        txt(360, 320, "Sirtdagi zarrachalar: " + r.soni + " dona  ·  maydon " + r.maydon + " sm²", { anchor: "middle", size: 12.5, fill: "#e8eefc" }), "0 0 640 340"
      );
    },
  };

  /* ---------- 6. Himoya / tosiqlar ---------- */
  const himoya = {
    title: "Organizmning himoya chiziqlari",
    hint: "Mikrob sonini va qaysi himoya chizig‘i ishlayotganini belgilang — qolgan mikroblar soni o‘zgaradi.",
    init: { boshlangich: 1000, teri: 1, shilliq: 1, kisota: 1, yallig: 0, antitel: 0 },
    controls: [
      { k: "boshlangich", label: "Kirgan mikroblar", min: 100, max: 100000, step: 100 },
      { k: "teri", label: "1-chiziq: teri (0/1)", min: 0, max: 1, step: 1 },
      { k: "shilliq", label: "1-chiziq: shilliq qavat (0/1)", min: 0, max: 1, step: 1 },
      { k: "kisota", label: "1-chiziq: oshqozon kislotasi (0/1)", min: 0, max: 1, step: 1 },
      { k: "yallig", label: "2-chiziq: yallig‘lanish + fagotsit (0/1)", min: 0, max: 1, step: 1 },
      { k: "antitel", label: "3-chiziq: antitelalar/xotira (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "qoldiq", label: "Omon qolgan", unit: "dona" },
      { k: "foiz", label: "Omon qolgan", unit: "%" },
      { k: "baho", label: "Natija" },
    ],
    compute(st) {
      let n = st.boshlangich, qatlam = [];
      if (st.teri) { n *= 0.55; qatlam.push("teri 45%"); }
      if (st.shilliq) { n *= 0.6; qatlam.push("shilliq 40%"); }
      if (st.kisota) { n *= 0.35; qatlam.push("kisota 65%"); }
      if (st.yallig) { n *= 0.45; qatlam.push("fagotsit 55%"); }
      if (st.antitel) { n *= 0.08; qatlam.push("antitelalar 92%"); }
      n = Math.round(n);
      const foiz = (n / st.boshlangich) * 100;
      const baho = n < st.boshlangich * 0.02 ? "Organizm mikrobni bartaraf etdi" : n > st.boshlangich * 0.5 ? "Himoya yetarli emas — kasallik xavfi" : "Qisman himoya ishlayapti";
      return { qoldiq: n, foiz, baho, qatlam };
    },
    svg(st, r) {
      const walls = [
        { k: "Teri", x: 90, on: st.teri },
        { k: "Shilliq", x: 190, on: st.shilliq },
        { k: "Kislota", x: 290, on: st.kisota },
        { k: "Fagotsit", x: 390, on: st.yallig },
        { k: "Antitelalar", x: 490, on: st.antitel },
      ];
      let out = "";
      walls.forEach((w, i) => {
        out += rect(w.x, 60, 22, 220, { fill: w.on ? "#5fd9d0" : "#1b2740", stroke: w.on ? "#fff" : "#33507f", r: 5, opacity: w.on ? 0.95 : 0.6 });
        out += txt(w.x + 11, 300, w.k, { anchor: "middle", size: 10, fill: w.on ? "#5fd9d0" : "#5f7295" });
        out += txt(w.x + 11, 44, (i + 1) + "-chiziq", { anchor: "middle", size: 9.5, fill: "#5f7295" });
      });
      let n = r.qoldiq, x = 590, cnt = 0;
      for (let i = 0; i < 60 && cnt < 60; i++) {
        const alive = i < Math.round(s((n / st.boshlangich) * 60, 0, 60));
        cnt++;
        x = 590 - (i % 12) * 26;
        const yy = 70 + Math.floor(i / 12) * 42;
        out += circle(x, yy, 8, { fill: alive ? "#ff7a7a" : "none", stroke: alive ? "#ff7a7a" : "#2b3f5f", sw: 1.4, opacity: alive ? 1 : 0.5 });
        if (alive) out += line(x - 4, yy - 4, x + 4, yy + 4, { stroke: "#0a1424", sw: 1.4 }) + line(x - 4, yy + 4, x + 4, yy - 4, { stroke: "#0a1424", sw: 1.4 });
      }
      out += txt(320, 340, r.qatlam.length ? "Ishlayotgan chiziqlar: " + r.qatlam.join(" · ") : "Himoya chizig‘i tanlanmagan — mikroblar to‘xtovsiz kiradi", { anchor: "middle", size: 12.5, fill: "#ffb347" });
      return svgBox(out, "0 0 640 360");
    },
  };

  /* ---------- 7. Zanjir / tuzish va birikish ---------- */
  const ORGANIZMLAR = [
    { k: "Yong‘oq", tur: "Ishlab chiqaruvchi", e: 10000 },
    { k: "Shovul", tur: "Iste‘molchi I", e: 1000 },
    { k: "Sichqon", tur: "Iste‘molchi II", e: 1000 },
    { k: "Ilon", tur: "Iste‘molchi II–III", e: 100 },
    { k: "Burgut", tur: "Yirtqich", e: 100 },
    { k: "Zamburug‘", tur: "Chiruvchi", e: 0 },
  ];
  const zanjir = {
    title: "Oziq zanjirini tuzish",
    hint: "Zanjirga 4 ta organizm tanlang va tartibini suring. Energiz har bo‘g‘inda ~10 marta kamayadi.",
    init: { tanlangan: [0, 2, 3, 4], buzish: 0 },
    controls: [
      { k: "tanlangan", label: "Zanjir a‘zolari (indekslar: 0..5)", min: 0, max: 5, step: 1, type: "picklist" },
      { k: "buzish", label: "Bo‘g‘inni uzish (0 = yo‘q, 1..4)", min: 0, max: 4, step: 1 },
    ],
    readouts: [
      { k: "energiya", label: "Oxirgi bo‘g‘indagi energiya", unit: "kJ" },
      { k: "sahifalar", label: "Bo‘g‘in soni" },
      { k: "holat", label: "Zanjir holati" },
    ],
    compute(st) {
      const TAN = [0, 2, 3, 4, 5]; // yong'oq → shovul → sichqon → ilon → zamburug'(chiruvchi)
      const tan = TAN.slice(0, st.uzunlik);
      let e = 10000, ok = true;
      const steps = tan.map((ix, i) => {
        if (i > 0) e = Math.round(e / 10);
        if (ORGANIZMLAR[ix].tur === "Chiruvchi" && i < tan.length - 1) ok = false;
        return { ...ORGANIZMLAR[ix], e, i };
      });
      if (st.buzish > 0 && st.buzish <= tan.length) ok = false;
      return {
        steps,
        energiya: st.buzish ? 0 : e,
        sahifalar: tan.length,
        holat: st.buzish ? st.buzish + "-bo‘g‘in uzilgan — oziq zanjiri ishlamaydi" : ok ? "Zanjir to‘g‘ri tuzilgan" : "Chiruvchi zanjir oxirida bo‘lishi kerak",
      };
    },
    svg(st, r) {
      let out = "";
      r.steps.forEach((s2, i) => {
        const x = 60 + i * 140, y = 210 - (i % 2) * 30;
        const dim = st.buzish === i + 1;
        out += circle(x + 42, y, 40, { fill: dim ? "#2b1518" : "#1d3a5c", stroke: dim ? "#ff7a7a" : s2.tur === "Ishlab chiqaruvchi" ? "#6fe39a" : s2.tur === "Chiruvchi" ? "#b18cff" : "#ffb347", sw: 2 });
        out += txt(x + 42, y - 2, s2.k, { anchor: "middle", size: 12.5, fill: "#e8eefc", weight: "bold" });
        out += txt(x + 42, y + 14, s2.tur, { anchor: "middle", size: 9.5, fill: "#93a4c4" });
        out += txt(x + 42, y + 62, (st.buzish ? 0 : s2.e) + " kJ", { anchor: "middle", size: 11.5, fill: "#5fd9d0" });
        if (i < r.steps.length - 1) out += arrow(x + 86, y, x + 130, y - 30 + (i % 2 ? 0 : -0), { stroke: st.buzish === i + 1 ? "#ff7a7a" : "#ffb347", sw: 2.2 });
      });
      out += txt(320, 40, r.holat, { anchor: "middle", size: 13.5, fill: r.holat.includes("to‘g‘ri") ? "#6fe39a" : "#ffb347", weight: "bold" });
      out += txt(320, 62, "10 % qoidasi: har bo‘g‘inga oldingisining ~10% energiyasi yetib boradi", { anchor: "middle", size: 11.5, fill: "#93a4c4" });
      return svgBox(out, "0 0 760 320");
    },
  };
  const zanjir_birikish = {
    title: "Zaharli moddaning to‘planishi",
    hint: "Suvdagi zahar miqdorini oshiring — konsentratsiya bo‘g‘in sayin qancha ko‘payishini ko‘ring.",
    init: { suvda: 0.003, uzunlik: 4 },
    controls: [
      { k: "suvda", label: "Suvda mg/l", min: 0.001, max: 0.05, step: 0.001, unit: " mg/l" },
      { k: "uzunlik", label: "Zanjir bo‘g‘inlari", min: 3, max: 5, step: 1 },
    ],
    readouts: [
      { k: "yirtqich", label: "Yirtqichda", unit: "mg/l" },
      { k: "marta", label: "Necha marta ortdi" },
      { k: "xulosa", label: "Xavf" },
    ],
    compute(st) {
      const levels = ["Suv", "Fitoplankton", "Zooplankton", "Baliq", "Qush"].slice(0, st.uzunlik + 1);
      let c = st.suvda;
      const data = levels.map((k, i) => {
        if (i === 1) c *= 10; else if (i > 1) c *= 9;
        return { k, v: c, color: i === levels.length - 1 ? "#ff7a7a" : "#ffb347" };
      });
      const yirtqich = data[data.length - 1].v;
      return {
        data,
        yirtqich: yirtqich,
        marta: Math.round(yirtqich / st.suvda),
        xulosa: yirtqich > 0.05 ? "Yirtqichlar uchun juda xavfli" : "O‘rtacha yuklama",
      };
    },
    svg(st, r) {
      const items = r.data.map((d) => ({ k: d.k, v: Math.log10(d.v * 1000) + 1, label: nf(d.v, 3), color: d.color }));
      return svgBox(
        txt(320, 34, "Bioakkumulyatsiya (logarifmik o‘lchamda)", { anchor: "middle", size: 13, fill: "#e8eefc" }) +
        barChart(items, { x: 50, y: 270, w: 540, h: 200 }) +
        txt(320, 300, "Yirtqich organizmda: " + nf(r.yirtqich, 3) + " mg/l  (" + r.marta + " marta ko‘p)", { anchor: "middle", size: 13, fill: "#ff7a7a", weight: "bold" }), "0 0 640 320"
      );
    },
  };

  /* ---------- 8. Modda / xossalar va qaynash ---------- */
  const MATERIALLAR = [
    { k: "Mis", rho: 8.9, issiq: 5, elektr: 5, qattiq: 3, suvda: "cho‘kadi" },
    { k: "Alyuminiy", rho: 2.7, issiq: 4, elektr: 4, qattiq: 2, suvda: "cho‘kadi" },
    { k: "Yog‘och (qayin)", rho: 0.8, issiq: 1, elektr: 0, qattiq: 2, suvda: "suzadi" },
    { k: "Plastmassa", rho: 1.1, issiq: 1, elektr: 0, qattiq: 1, suvda: "cho‘kadi" },
    { k: "Muz", rho: 0.92, issiq: 1, elektr: 0, qattiq: 1, suvda: "suzadi" },
    { k: "Parafin", rho: 0.9, issiq: 1, elektr: 0, qattiq: 0, suvda: "suzadi" },
  ];
  const modda = {
    title: "Modda xossalari va suzish",
    hint: "Materialni tanlang: zichlik, o‘tkazuvchanlik va suvda suzish/cho‘kish birga ko‘rinadi.",
    init: { mat: 0, massa: 200, suyuq: 0 },
    controls: [
      { k: "mat", label: "Material (0..5): " + MATERIALLAR.map((m) => m.k).join(", "), min: 0, max: 5, step: 1 },
      { k: "massa", label: "Namuna massasi", min: 20, max: 600, step: 10, unit: " g" },
      { k: "suyuq", label: "Suyuqlik: 0 suv · 1 tuzli suv · 2 spirt", min: 0, max: 2, step: 1 },
    ],
    readouts: [
      { k: "hajm", label: "Hajm", unit: "sm³" },
      { k: "rho", label: "Zichlik", unit: "g/sm³" },
      { k: "suzish", label: "Suvda" },
      { k: "otkaz", label: "O‘tkazuvchanlik" },
    ],
    compute(st) {
      const m = MATERIALLAR[st.mat | 0] || MATERIALLAR[0];
      const rhoSuv = [1, 1.2, 0.79][st.suyuq];
      const hajm = st.massa / m.rho;
      const suzadi = m.rho < rhoSuv;
      return {
        hajm,
        rho: m.rho,
        suzish: suzadi ? "suzadi" : "cho‘kadi",
        otkaz: m.issiq >= 4 ? `issiqlik ↑↑ · tok ↑↑` : "issiqlik ↓ · tok ↓",
        rhoSuv,
        mat: m,
      };
    },
    svg(st, r) {
      const m = r.mat;
      const bars = barChart(
        [
          { k: "issiqlik", v: m.issiq, color: "#ff7a7a", label: m.issiq + "/5" },
          { k: "elektr", v: m.elektr, color: "#5fd9d0", label: m.elektr + "/5" },
          { k: "qattiqlik", v: m.qattiq + 1, color: "#b18cff", label: m.qattiq + 1 + "/5" },
          { k: "zichlik", v: m.rho, color: "#ffb347", label: nf(m.rho, 1) },
        ],
        { x: 40, y: 250, w: 290, h: 180 }
      );
      const tankX = 420, tankY = 90, tankW = 180, tankH = 190;
      const objR = 20 + Math.sqrt(r.hajm) * 0.8;
      const objY = r.suzish === "suzadi" ? tankY + 55 : tankY + tankH - objR - 6;
      return svgBox(
        rect(tankX, tankY, tankW, tankH, { fill: ["#12314f", "#123f4a", "#33244f"][st.suyuq], stroke: "#33507f", r: 6 }) +
        line(tankX, tankY + 26, tankX + tankW, tankY + 26, { stroke: "#5fd9d0", sw: 1.4, dash: "5 4" }) +
        circle(tankX + tankW / 2, objY, objR, { fill: st.suyuq === 2 ? "#ffd7a1" : "#cfe0ff", stroke: "#ffb347", sw: 2, opacity: 0.95 }) +
        txt(tankX + tankW / 2, objY + 4, m.k, { anchor: "middle", size: 11, fill: "#26160a", weight: "bold" }) +
        txt(tankX + tankW / 2, tankY + tankH + 22, (["suv", "tuzli suv", "spirt"][st.suyuq]) + " ρ=" + nf(r.rhoSuv, 2), { anchor: "middle", size: 11, fill: "#93a4c4" }) +
        bars + txt(40, 60, m.k + " — " + nf(m.rho, 1) + " g/sm³ · " + nf(r.hajm, 0) + " sm³ · " + r.suzish, { size: 13, fill: "#ffb347", weight: "bold" }), "0 0 640 300"
      );
    },
  };
  const qaynash = {
    title: "Qizdirish, qaynash va bug‘lanish",
    hint: "Quvvat va massa — harorat egri chizig‘i va qaynash vaqti shundan hisoblanadi.",
    init: { quvvat: 800, massa: 200, suyuqlik: 0, qopqoq: 0 },
    controls: [
      { k: "quvvat", label: "Plitka quvvati (Vt)", min: 200, max: 2200, step: 50, unit: " Vt" },
      { k: "massa", label: "Suv massasi (g)", min: 50, max: 1000, step: 25, unit: " g" },
      { k: "suyuqlik", label: "Suyuqlik: 0 suv · 1 spirt", min: 0, max: 1, step: 1 },
      { k: "qopqoq", label: "Qopqoq (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "vaqt", label: "Qaynashgacha", unit: "min" },
      { k: "qaynash", label: "Qaynash harorati", unit: "°C" },
      { k: "bug", label: "Bug‘lanish" },
      { k: "energiya", label: "Kerak energiya", unit: "kJ" },
    ],
    compute(st) {
      const c = st.suyuqlik ? 2450 : 4200;
      const T0 = 20, Tb = st.suyuqlik ? 78 : 100;
      const E = (c * (st.massa / 1000) * (Tb - T0)) / 1000; // kJ
      const P = st.quvvat * (st.qopqoq ? 1.12 : 0.86);
      const vaqt = (E * 1000) / P / 60;
      return { vaqt, qaynash: Tb, bug: st.qopqoq ? "sekin (qopqoq ostida to‘planadi)" : "tez (ochiq yuza)", energiya: E };
    },
    svg(st, r) {
      const W = 520, H = 190, x0 = 60, y0 = 250;
      const c = st.suyuqlik ? 2450 : 4200;
      const P = st.quvvat * (st.qopqoq ? 1.12 : 0.86);
      const tMax = Math.max(0.5, r.vaqt * 1.4);
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * tMax;
        const T = Math.min(r.qaynash, 20 + (P * t * 60) / (c * (st.massa / 1000)) / 1000);
        pts.push([x0 + (t / tMax) * W, y0 - ((T - 20) / 100) * H]);
      }
      const curve = path("M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L"), { stroke: "#ffb347", sw: 2.4 });
      const boil = line(x0, y0 - ((r.qaynash - 20) / 100) * H, x0 + W, y0 - ((r.qaynash - 20) / 100) * H, { stroke: "#ff7a7a", dash: "6 5", sw: 1.4 });
      const pot = rect(x0 - 4, y0 - 66, 96, 62, { fill: "#1d3a5c", stroke: "#93a4c4", r: 6 }) +
        rect(x0 - 14, y0 - 74, 116, 10, { fill: "#93a4c4", stroke: "none", r: 4 }) +
        (st.qopqoq ? path(`M${x0 - 18},${y0 - 78} Q${x0 + 44},${y0 - 108} ${x0 + 106},${y0 - 78}`, { stroke: "#5fd9d0", sw: 3 }) : "");
      let steam = "";
      for (let i = 0; i < 5; i++) {
        const sx = x0 + 6 + i * 20;
        steam += path(`M${sx},${y0 - 80} q6,-12 -2,-22 q-6,-10 2,-20`, { stroke: "#93a4c4", sw: 1.6, opacity: st.qopqoq ? 0.25 : 0.8 });
      }
      return svgBox(
        line(x0, y0, x0 + W, y0, { stroke: "#33507f" }) + line(x0, y0, x0, y0 - H, { stroke: "#33507f" }) +
        txt(24, 80, "°C", { size: 11, fill: "#93a4c4" }) + txt(x0 + W + 6, y0 + 4, "min", { size: 11, fill: "#93a4c4" }) +
        txt(x0 + W - 4, y0 - ((r.qaynash - 20) / 100) * H - 8, r.qaynash + "°C", { anchor: "end", size: 12, fill: "#ff7a7a" }) +
        boil + curve + pot + steam +
        txt(320, 34, "Qaynashgacha " + nf(r.vaqt, 1) + " min  ·  " + r.bug, { anchor: "middle", size: 13.5, fill: "#ffb347", weight: "bold" }), "0 0 640 300"
      );
    },
  };

  /* ---------- 9. O‘zgarish / fizik va kimyo ---------- */
  const ozgarish = {
    title: "Fizik yoki kimyoviy o‘zgarish?",
    hint: "Hodisani tanlang, belgilarni belgilang — tizim xulosani tekshiradi.",
    init: { hodisa: 0, rang: 0, gaz: 0, harorat: 0, qaytar: 0 },
    controls: [
      { k: "hodisa", label: "Hodisa: 0 muz erishi · 1 sham yonishi · 2 qog‘oz bukilishi · 3 temir zangi", min: 0, max: 3, step: 1 },
      { k: "rang", label: "Rang o‘zgardi (0/1)", min: 0, max: 1, step: 1 },
      { k: "gaz", label: "Gaz chiqdi (0/1)", min: 0, max: 1, step: 1 },
      { k: "harorat", label: "Harorat o‘zgardi (0/1)", min: 0, max: 1, step: 1 },
      { k: "qaytar", label: "Boshlang‘ich holatga qaytariladi (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "turi", label: "To‘g‘ri tasnif" },
      { k: "sizning", label: "Sizning javobingiz" },
      { k: "baho", label: "Baho" },
      { k: "massa", label: "Massa" },
    ],
    compute(st) {
      const H = [
        { nom: "Muzning erishi", tur: "Fizik · qaytar", belgi: [0, 0, 1] },
        { nom: "Shamning yonishi", tur: "Kimyoviy · qaytmas", belgi: [1, 1, 1] },
        { nom: "Qog‘ozning bukilishi", tur: "Fizik · qaytmas (amalda)", belgi: [0, 0, 0] },
        { nom: "Temirning zanglashi", tur: "Kimyoviy · qaytmas", belgi: [1, 0, 0] },
      ][st.hodisa];
      const belgilar = [st.rang, st.gaz, st.harorat];
      const kimyoviy = belgilar[0] + belgilar[1] >= 1;
      const javob = kimyoviy ? "Kimyoviy" : st.qaytar ? "Fizik · qaytar" : "Fizik · qaytmas";
      const togri = H.tur.startsWith("Kimyoviy");
      let baho = "Sizning belgilaringiz H1 va H2 mezoniga asoslangan";
      if (togri && kimyoviy) baho = "To‘g‘ri: yangi modda belgilari qo‘yildi";
      else if (!togri && !kimyoviy) baho = "To‘g‘ri: yangi modda belgisi yo‘q";
      else baho = "Xato: H1 (rang) yoki H2 (gaz) belgisi hodisaga mos kelmadi";
      return { turi: H.tur, nom: H.nom, sizning: javob, baho, massa: kimyoviy ? "yopiq idishda saqlanadi" : "saqlanadi" };
    },
    svg(st, r) {
      const pic = ["❄", "🔥", "📄", "🟤"][st.hodisa];
      const l = { x: 90, y: 120 }, rg = { x: 430, y: 120 };
      return svgBox(
        txt(320, 44, r.nom, { anchor: "middle", size: 15, fill: "#ffb347", weight: "bold" }) +
        rect(l.x - 30, l.y - 20, 150, 120, { fill: "#12243d", stroke: "#5fd9d0", r: 10 }) +
        txt(l.x + 45, l.y + 50, "boshidan", { anchor: "middle", size: 11, fill: "#93a4c4" }) +
        txt(l.x + 45, l.y + 18, pic, { anchor: "middle", size: 30 }) +
        arrow(l.x + 130, l.y + 40, rg.x - 40, l.y + 40, { stroke: "#ffb347", sw: 2.4 }) +
        rect(rg.x - 30, rg.y - 20, 150, 120, { fill: "#1a2a3d", stroke: "#ffb347", r: 10 }) +
        txt(rg.x + 45, rg.y + 18, st.rang ? "🟤" : pic, { anchor: "middle", size: 30 }) +
        txt(rg.x + 45, rg.y + 50, "oxirida", { anchor: "middle", size: 11, fill: "#93a4c4" }) +
        txt(320, 300, "To‘g‘ri tasnif: " + r.turi + "   ·   sizniki: " + r.sizning, { anchor: "middle", size: 13, fill: "#5fd9d0", weight: "bold" }) +
        txt(320, 322, r.baho, { anchor: "middle", size: 12, fill: r.baho.startsWith("To‘g‘ri") ? "#6fe39a" : "#ff7a7a" }), "0 0 640 340"
      );
    },
  };

  /* ---------- 10. Erish / eruvchanlik ---------- */
  const erish = {
    title: "Erish va eruvchanlik",
    hint: "Harorat, maydalash va aralashtirish — shakar necha grammigacha eriydi?",
    init: { harorat: 40, massa: 60, mayda: 1, aralashtirish: 1 },
    controls: [
      { k: "harorat", label: "Harorat (°C)", min: 0, max: 90, step: 1, unit: "°C" },
      { k: "massa", label: "Qo‘shilgan shakar", min: 0, max: 400, step: 5, unit: " g" },
      { k: "mayda", label: "Maydalangan (0/1)", min: 0, max: 1, step: 1 },
      { k: "aralashtirish", label: "Aralashtirilgan (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "chegara", label: "Eruvchanlik chegarasi", unit: "g" },
      { k: "erigan", label: "Eridi", unit: "g" },
      { k: "choqma", label: "Cho‘kma", unit: "g" },
      { k: "tezlik", label: "Erish tezligi", unit: "×" },
    ],
    compute(st) {
      const chegara = 180 + st.harorat * 2.2; // 100 g suvga, taxminiy
      const erigan = Math.min(st.massa, chegara);
      const choqma = st.massa - erigan;
      const tez = 1 + st.mayda * 0.8 + st.aralashtirish * 0.7 + st.harorat / 45;
      return { chegara, erigan, choqma, tezlik: tez };
    },
    svg(st, r) {
      const x = 200, y = 70, w = 220, h = 210;
      let sugar = "";
      const n = Math.round(r.erigan / 12);
      for (let i = 0; i < n; i++) sugar += rect(x + 16 + (i % 9) * 22, y + 46 + Math.floor(i / 9) * 20, st.mayda ? 4 : 9, st.mayda ? 4 : 9, { fill: "#ffffff", stroke: "none", opacity: 0.55 });
      let undissolved = "";
      const u = Math.round(r.choqma / 12);
      for (let i = 0; i < u; i++) undissolved += rect(x + 22 + (i % 8) * 24, y + h - 24 - Math.floor(i / 8) * 12, st.mayda ? 5 : 10, st.mayda ? 5 : 10, { fill: "#fff", stroke: "none", opacity: 0.95 });
      const stir = st.aralashtirish ? path(`M${x + w + 16},${y + 20} q-14,40 0,80 q14,30 0,60`, { stroke: "#b18cff", sw: 2.4 }) : "";
      return svgBox(
        rect(x, y, w, h, { fill: "#12314f", stroke: "#5fd9d0", sw: 2, r: 12 }) +
        line(x, y + 30, x + w, y + 30, { stroke: "#5fd9d0", sw: 1.2, dash: "4 4" }) +
        sugar + undissolved + stir +
        txt(x + w / 2, y - 14, "100 g suv · " + st.harorat + "°C", { anchor: "middle", size: 12, fill: "#93a4c4" }) +
        txt(60, 110, "erigan: " + nf(r.erigan, 0) + " g", { size: 12.5, fill: "#6fe39a" }) +
        txt(60, 132, "cho‘kma: " + nf(r.choqma, 0) + " g", { size: 12.5, fill: r.choqma > 0.5 ? "#ff7a7a" : "#6fe39a" }) +
        txt(60, 154, "chegara: " + nf(r.chegara, 0) + " g", { size: 12.5, fill: "#ffb347" }) +
        txt(60, 176, "tezlik: " + nf(r.tezlik, 1) + "×", { size: 12.5, fill: "#5fd9d0" }) +
        (r.choqma > 0.5 ? txt(x + w / 2, y + h + 26, "Eritma to‘yingan — ortig‘chi erimaydi", { anchor: "middle", size: 12, fill: "#ff7a7a" }) : ""), "0 0 640 320"
      );
    },
  };

  /* ---------- 11. Kuch / massa-og‘irlik ---------- */
  const kuch = {
    title: "Massa va og‘irlik kuchi",
    hint: "Massani o‘zgartiring va sayyorani tanlang: prujina qancha cho‘ziladi?",
    init: { massa: 3, jism: 0 },
    controls: [
      { k: "massa", label: "Massa (kg)", min: 0.5, max: 20, step: 0.5, unit: " kg" },
      { k: "jism", label: "Joy: 0 Yer · 1 Oy · 2 Mars · 3 Yupiter", min: 0, max: 3, step: 1 },
    ],
    readouts: [
      { k: "g", label: "g", unit: "N/kg" },
      { k: "F", label: "Og‘irlik kuchi", unit: "N" },
      { k: "chozilish", label: "Prujina cho‘zilishi", unit: "sm" },
      { k: "massa", label: "Massa", unit: "kg" },
    ],
    compute(st) {
      const g = [9.8, 1.6, 3.7, 24.8][st.jism];
      const F = st.massa * g;
      return { g, F, chozilish: s(F / 4.5, 0.4, 150), massa: st.massa, nom: ["Yer", "Oy", "Mars", "Yupiter"][st.jism] };
    },
    svg(st, r) {
      const x = 300, top = 40, len = 40 + r.chozilish * 6;
      const spring = path(
        "M" + x + "," + top + " " + Array.from({ length: 12 }, (_, i) => `L${x + (i % 2 ? 22 : -22)},${top + 8 + (i * len) / 12}`).join(" ") + ` L${x},${top + len}`,
        { stroke: "#ffb347", sw: 2.6 }
      );
      return svgBox(
        line(x - 60, top, x + 60, top, { stroke: "#93a4c4", sw: 4 }) +
        spring +
        rect(x - 34, top + len, 68, 44, { fill: "#1d3a5c", stroke: "#5fd9d0", sw: 2, r: 8 }) +
        txt(x, top + len + 28, nf(st.massa, 1) + " kg", { anchor: "middle", size: 14, fill: "#e8eefc", weight: "bold" }) +
        arrow(x, top + len + 52, x, top + len + 52 + Math.min(70, r.F / 2.4), { stroke: "#ff7a7a", sw: 3 }) +
        txt(x + 12, top + len + 78, "F = " + nf(r.F, 1) + " N", { size: 13, fill: "#ff7a7a" }) +
        txt(80, 90, r.nom + ": g = " + nf(r.g, 1) + " N/kg", { size: 13, fill: "#ffb347", weight: "bold" }) +
        txt(80, 112, "Massa hamma joyda " + nf(st.massa, 1) + " kg", { size: 12, fill: "#93a4c4" }), "0 0 640 380"
      );
    },
  };

  /* ---------- 12. Suzish / shakl ---------- */
  const suzish = {
    title: "Plastilin: shar yoki kema?",
    hint: "Bir xil massa, turli shakl — suvning itarib chiqarish kuchi qanday o‘zgaradi?",
    init: { massa: 60, shakl: 0, suyuqlik: 0 },
    controls: [
      { k: "massa", label: "Plastilin massasi (g)", min: 20, max: 200, step: 5, unit: " g" },
      { k: "shakl", label: "Shakl: 0 shar · 1 kosa (kema) · 2 tekis plitka", min: 0, max: 2, step: 1 },
      { k: "suyuqlik", label: "Suyuqlik: 0 suv · 1 tuzli suv", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "FA", label: "Arximed kuchi", unit: "N" },
      { k: "F", label: "Og‘irlik kuchi", unit: "N" },
      { k: "holat", label: "Natija" },
      { k: "yuk", label: "Ko‘tara oladigan yuk", unit: "g" },
    ],
    compute(st) {
      const rhoPlast = 1.9, V = st.massa / rhoPlast;
      const suv = st.suyuqlik ? 1.1 : 1.0;
      // suvning itarib chiqarish kuchi: shakl qancha ko'p hajmni siqib chiqarsa, kuch shuncha ortadi
      const Vsil = [V, V * 5.2, V * 1.6][st.shakl];
      const FA = suv * 10 * (Vsil / 1000);
      const F = (st.massa / 1000) * 10;
      const holat = FA > F + 0.01 ? "suzadi" : FA < F - 0.01 ? "cho‘kadi" : "suv ichida muallaq";
      const yuk = Math.max(0, (FA - F) * 100);
      return { FA, F, holat, yuk, Vsil };
    },
    svg(st, r) {
      const tankX = 120, tankY = 90, tankW = 400, tankH = 200;
      const waterTop = tankY + 34;
      const onTop = r.holat === "suzadi";
      const objY = onTop ? waterTop - 6 : tankY + tankH - 34;
      const shape =
        st.shakl === 0
          ? circle(tankX + tankW / 2, objY, 26, { fill: "#c98bff", stroke: "#b18cff", sw: 2 })
          : st.shakl === 1
          ? path(`M${tankX + tankW / 2 - 60},${objY - 26} L${tankX + tankW / 2 + 60},${objY - 26} L${tankX + tankW / 2 + 40},${objY + 20} L${tankX + tankW / 2 - 40},${objY + 20} Z`, { fill: "#c98bff", stroke: "#b18cff", sw: 2 })
          : rect(tankX + tankW / 2 - 54, objY - 10, 108, 18, { fill: "#c98bff", stroke: "#b18cff", sw: 2 });
      return svgBox(
        rect(tankX, tankY, tankW, tankH, { fill: "#12314f", stroke: "#33507f", r: 8, opacity: 0.85 }) +
        line(tankX, waterTop, tankX + tankW, waterTop, { stroke: "#5fd9d0", sw: 1.6, dash: "6 4" }) +
        shape +
        (onTop ? arrow(tankX + tankW / 2, objY + 44, tankX + tankW / 2, objY + 10, { stroke: "#6fe39a", sw: 3 }) : "") +
        arrow(tankX + tankW / 2, objY - (onTop ? 40 : 34), tankX + tankW / 2, objY - (onTop ? 6 : 0) + 30, { stroke: "#ff7a7a", sw: 2.4 }) +
        txt(tankX, tankY - 12, "F(A) = " + nf(r.FA, 2) + " N   ·   og‘irlik = " + nf(r.F, 2) + " N   →   " + r.holat, { size: 13, fill: onTop ? "#6fe39a" : "#ff7a7a", weight: "bold" }) +
        txt(tankX, tankY + tankH + 26, "Qo‘shimcha yuk: " + nf(r.yuk, 0) + " g gacha", { size: 12, fill: "#ffb347" }), "0 0 640 340"
      );
    },
  };

  /* ---------- 13. Yorug‘lik ---------- */
  const yoruglik = {
    title: "Ko‘zgudan qaytish",
    hint: "Tushish burchagini suring — qaytish burchagi har doim unga teng (α = β).",
    init: { burchak: 35 },
    controls: [{ k: "burchak", label: "Tushish burchagi α (°)", min: 0, max: 85, step: 1, unit: "°" }],
    readouts: [
      { k: "alfa", label: "α tushish", unit: "°" },
      { k: "beta", label: "β qaytish", unit: "°" },
      { k: "farq", label: "Farq", unit: "°" },
    ],
    compute(st) {
      return { alfa: st.burchak, beta: st.burchak, farq: 0 };
    },
    svg(st, r) {
      const cx = 320, cy = 250, R = 170;
      const a = (st.burchak * Math.PI) / 180;
      const inX = cx - Math.sin(a) * R, inY = cy - Math.cos(a) * R;
      const outX = cx + Math.sin(a) * R, outY = cy - Math.cos(a) * R;
      return svgBox(
        line(40, cy, 600, cy, { stroke: "#93a4c4", sw: 5 }) +
        line(cx, cy, cx, cy - R - 10, { stroke: "#33507f", sw: 1.4, dash: "5 4" }) +
        arrow(inX, inY, cx, cy, { stroke: "#ffb347", sw: 3 }) +
        arrow(cx, cy, outX, outY, { stroke: "#5fd9d0", sw: 3 }) +
        path(`M${cx - 40},${cy - 44} A58,58 0 0 1 ${cx},${cy - 58}`, { stroke: "#ffb347", sw: 1.6 }) +
        path(`M${cx},${cy - 58} A58,58 0 0 1 ${cx + 40},${cy - 44}`, { stroke: "#5fd9d0", sw: 1.6 }) +
        txt(cx - 52, cy - 66, "α=" + r.alfa + "°", { size: 12, fill: "#ffb347" }) +
        txt(cx + 30, cy - 66, "β=" + r.beta + "°", { size: 12, fill: "#5fd9d0" }) +
        txt(cx + 6, cy - 74, "normal", { size: 10.5, fill: "#5f7295" }) +
        txt(320, 60, "Qaytish qonuni: α = β  (burchaklar normalga nisbatan)", { anchor: "middle", size: 13, fill: "#e8eefc", weight: "bold" }), "0 0 640 320"
      );
    },
  };
  const sinish = {
    title: "Suvga kirgan nur qanday sinadi?",
    hint: "Tushish burchagi va muhitni tanlang — Snell qonuni bo‘yicha sinish burchagi hisoblanadi.",
    init: { burchak: 40, muhit: 0 },
    controls: [
      { k: "burchak", label: "Tushish burchagi (°)", min: 0, max: 85, step: 1, unit: "°" },
      { k: "muhit", label: "Muhit: 0 suv · 1 shisha · 2 olmos", min: 0, max: 2, step: 1 },
    ],
    readouts: [
      { k: "n", label: "Sinish ko‘rsatkichi n" },
      { k: "beta", label: "Sinish burchagi", unit: "°" },
      { k: "tezlik", label: "Yorug‘lik tezligi", unit: "km/s" },
    ],
    compute(st) {
      const n = [1.33, 1.5, 2.42][st.muhit];
      const a = (st.burchak * Math.PI) / 180;
      const sinb = Math.min(1, Math.sin(a) / n);
      return { n, beta: (Math.asin(sinb) * 180) / Math.PI, tezlik: 300000 / n };
    },
    svg(st, r) {
      const cx = 320, cy = 190, R = 150;
      const a = (st.burchak * Math.PI) / 180, b = (r.beta * Math.PI) / 180;
      return svgBox(
        rect(0, cy, 640, 200, { fill: "#12314f", stroke: "none", opacity: 0.75 }) +
        line(0, cy, 640, cy, { stroke: "#93a4c4", sw: 2 }) +
        line(cx, cy - R - 6, cx, cy + R + 6, { stroke: "#33507f", sw: 1.4, dash: "5 4" }) +
        arrow(cx - Math.sin(a) * R, cy - Math.cos(a) * R, cx, cy, { stroke: "#ffb347", sw: 3 }) +
        arrow(cx, cy, cx + Math.sin(b) * R, cy + Math.cos(b) * R, { stroke: "#5fd9d0", sw: 3 }) +
        path(`M${cx},${cy + Math.cos(b) * 56} A56,56 0 0 0 ${cx + Math.sin(b) * 56},${cy}`, { stroke: "#5fd9d0", sw: 1.6 }) +
        txt(cx - Math.sin(a) * R - 6, cy - Math.cos(a) * R - 6, "havo: " + st.burchak + "°", { anchor: "end", size: 12, fill: "#ffb347" }) +
        txt(cx + Math.sin(b) * R + 6, cy + Math.cos(b) * R + 16, "sinish: " + nf(r.beta, 1) + "°", { size: 12, fill: "#5fd9d0" }) +
        txt(320, 40, ["suv", "shisha", "olmos"][st.muhit] + "  n = " + nf(r.n, 2) + " — nur normalga yaqinlashadi", { anchor: "middle", size: 13, fill: "#e8eefc", weight: "bold" }), "0 0 640 390"
      );
    },
  };

  /* ---------- 14. Elektr ---------- */
  const elektr = {
    title: "Zanjir sxemasi: yopiqmi?",
    hint: "Kalit holati, ulanish va materialni o‘zgartiring — lampa yonishi shundan.",
    init: { kalit: 1, material: 0, uzilish: 0, qisqa: 0 },
    controls: [
      { k: "kalit", label: "Kalit yopiq (0/1)", min: 0, max: 1, step: 1 },
      { k: "material", label: "Zanjirga ulangan material: 0 mis · 1 rezina · 2 tuzli suv · 3 yog‘och", min: 0, max: 3, step: 1 },
      { k: "uzilish", label: "Sim uzilgan (0/1)", min: 0, max: 1, step: 1 },
      { k: "qisqa", label: "Qisqa tutashuv (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "holat", label: "Lampa" },
      { k: "oqim", label: "Tok yo‘limi" },
      { k: "xavf", label: "Xavfsizlik" },
    ],
    compute(st) {
      const otkaz = [true, false, true, false][st.material];
      const on = st.kalit && !st.uzilish && otkaz && !st.qisqa;
      return {
        holat: on ? "yonaydi ✓" : st.qisqa ? "o‘chdi (tok o‘tkazgichdan oqib ketdi)" : !otkaz ? "yonmaydi — izolyator" : st.uzilish ? "yonmaydi — sim uzilgan" : "yonmaydi — kalit ochiq",
        oqim: on ? "batareya → sim → material → lampa → batareya" : "yopiq iz yo‘q",
        xavf: st.qisqa ? "XAVFLI: sim qiziydi, zanjirni darhol oching" : "xavfsiz (batareya bilan)",
      };
    },
    svg(st, r) {
      const on = r.holat.includes("yonaydi");
      const lampGlow = on ? circle(430, 120, 34, { fill: "#ffb347", stroke: "none", opacity: 0.3 }) : "";
      return svgBox(
        path("M120,240 L120,120 L380,120", { stroke: "#93a4c4", sw: 3 }) +
        path("M480,120 L560,120 L560,240 L200,240", { stroke: on ? "#ffb347" : "#4a5f82", sw: 3 }) +
        rect(150, 226, 60, 26, { fill: st.material === 1 || st.material === 3 ? "#5f7295" : "#c9a15c", stroke: "#93a4c4", r: 4 }) +
        txt(180, 276, ["mis", "rezina", "tuzli suv", "yog‘och"][st.material], { anchor: "middle", size: 11, fill: "#93a4c4" }) +
        (st.uzilish ? line(300, 240, 340, 240, { stroke: "#ff7a7a", sw: 3, dash: "4 4" }) : path("M200,240 L380,240 L380,120", { stroke: "#93a4c4", sw: 3 })) +
        lampGlow + circle(430, 120, 22, { fill: on ? "#ffd79a" : "#1b2740", stroke: on ? "#ffb347" : "#4a5f82", sw: 2 }) +
        path("M418,108 L442,132 M442,108 L418,132", { stroke: on ? "#26160a" : "#4a5f82", sw: 2 }) +
        path("M120,240 L160,240", { stroke: "#93a4c4", sw: 3 }) +
        rect(104, 236, 130, 34, { fill: "#1d3a5c", stroke: "#93a4c4", r: 4 }) +
        line(110, 240, 110, 226, { stroke: "#5fd9d0", sw: 4 }) + line(124, 240, 124, 232, { stroke: "#5fd9d0", sw: 4 }) +
        txt(170, 200, st.kalit ? "kalit yopiq" : "kalit ochiq", { size: 11, fill: st.kalit ? "#6fe39a" : "#ff7a7a" }) +
        (st.qisqa ? path("M110,262 Q170,300 230,262", { stroke: "#ff7a7a", sw: 3.4 }) : "") +
        txt(320, 40, "Lampa: " + r.holat + "   ·   " + r.xavf, { anchor: "middle", size: 13, fill: on ? "#6fe39a" : "#ff7a7a", weight: "bold" }), "0 0 640 320"
      );
    },
  };
  const qiyos = {
    title: "Ketma-ket yoki parallel?",
    hint: "Ulanish turi va lampa soni — yorqinlik, tok va mustaqillik shundan o‘zgaradi.",
    init: { tur: 0, soni: 2, batareya: 4.5 },
    controls: [
      { k: "tur", label: "Ulanish: 0 ketma-ket · 1 parallel", min: 0, max: 1, step: 1 },
      { k: "soni", label: "Lampa soni", min: 1, max: 5, step: 1 },
      { k: "batareya", label: "Batareya kuchlanishi (V)", min: 1.5, max: 9, step: 0.5, unit: " V" },
    ],
    readouts: [
      { k: "ul", label: "Bir lampadagi U", unit: "V" },
      { k: "I", label: "Umumiy tok", unit: "A" },
      { k: "yorqin", label: "Yorqinlik", unit: "%" },
      { k: "mustaqil", label: "Bittasi o‘chsa" },
    ],
    compute(st) {
      const Rl = 6;
      const ul = st.tur === 0 ? st.batareya / st.soni : st.batareya;
      const R = st.tur === 0 ? Rl * st.soni : (Rl / st.soni);
      const I = st.batareya / R;
      const yorqin = s((ul / st.batareya) * 100 * (st.tur === 1 ? 1 : 0.8), 5, 100);
      return { ul, I, yorqin, mustaqil: st.tur === 0 ? "hammasi o‘chadi" : "qolganlari yonadi" };
    },
    svg(st, r) {
      const n = st.soni;
      let lamps = "";
      for (let i = 0; i < n; i++) {
        const b = r.yorqin / 100;
        const x = st.tur === 0 ? 150 + i * (420 / n) : 150 + i * (420 / n);
        const y = st.tur === 0 ? 130 : 80 + i * 46;
        const glow = b > 0.55 ? 0.34 : b > 0.25 ? 0.18 : 0.05;
        lamps += circle(x, y, 22, { fill: "#ffb347", stroke: "none", opacity: glow }) +
          circle(x, y, 13, { fill: b > 0.3 ? "#ffe1b0" : "#1b2740", stroke: "#93a4c4", sw: 1.6 }) +
          txt(x + 26, y + 4, nf(r.ul, 1) + " V", { size: 10, fill: "#93a4c4" });
      }
      const wire =
        st.tur === 0
          ? path("M60,130 L" + (150 + (n - 1) * (420 / n) + 30) + ",130 L" + (150 + (n - 1) * (420 / n) + 30) + ",260 L60,260 Z", { stroke: "#93a4c4", sw: 2.4 })
          : path("M60,60 L60,290 L600,290 L600,60 Z", { stroke: "#93a4c4", sw: 2.4 });
      return svgBox(
        wire + lamps +
        rect(60, 220, 70, 34, { fill: "#1d3a5c", stroke: "#5fd9d0", r: 4 }) +
        line(70, 220, 70, 208, { stroke: "#5fd9d0", sw: 4 }) + line(86, 220, 86, 214, { stroke: "#5fd9d0", sw: 4 }) +
        txt(320, 320, (st.tur === 0 ? "Ketma-ket" : "Parallel") + "  ·  U(lampa) = " + nf(r.ul, 1) + " V  ·  I = " + nf(r.I, 2) + " A  ·  " + r.mustaqil, { anchor: "middle", size: 12.5, fill: "#ffb347", weight: "bold" }), "0 0 640 340"
      );
    },
  };

  /* ---------- 15. Tog‘ jinslari ---------- */
  const JINSLAR = [
    { k: "Granit", tur: "Magmatik", qattiq: 6.5, dona: "yirik kristalli", qatlam: 0, govak: 0, kislota: 0, rang: "#c8bfae" },
    { k: "Bazalt", tur: "Magmatik", qattiq: 6, dona: "mayda donali", qatlam: 0, govak: 0, kislota: 0, rang: "#4a4f57" },
    { k: "Pemza", tur: "Magmatik", qattiq: 6, dona: "g‘ovak", qatlam: 0, govak: 1, kislota: 0, rang: "#b9b3a8" },
    { k: "Qumtosh", tur: "Cho‘kindi", qattiq: 3, dona: "qum donalari", qatlam: 1, govak: 1, kislota: 0, rang: "#d8b071" },
    { k: "Ohak toshi", tur: "Cho‘kindi", qattiq: 3, dona: "bir jinsli", qatlam: 1, govak: 0, kislota: 1, rang: "#e6e0cf" },
    { k: "Marmar", tur: "Metamorfik", qattiq: 3.5, dona: "kristalli", qatlam: 0, govak: 0, kislota: 1, rang: "#f2f0ea" },
    { k: "Slanets", tur: "Metamorfik", qattiq: 4, dona: "qatlamli", qatlam: 1, govak: 0, kislota: 0, rang: "#7c8b78" },
  ];
  const jins = {
    title: "Jins namunalarini aniqlash",
    hint: "Namuna, qattiqlik sinovi, lupa va sirka — kalit orqali guruhga ajrating.",
    init: { namuna: 0, tirnash: 1, sirka: 0, lupa: 1 },
    controls: [
      { k: "namuna", label: "Namuna (0..6): " + JINSLAR.map((j) => j.k).join(", "), min: 0, max: 6, step: 1 },
      { k: "tirnash", label: "Tirnoq bilan tirnaladi (0/1)", min: 0, max: 1, step: 1 },
      { k: "sirka", label: "Sirkada ko‘pik chiqadi (0/1)", min: 0, max: 1, step: 1 },
      { k: "lupa", label: "Lupada donalar ko‘rinadi (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "nom", label: "Namuna" },
      { k: "guruh", label: "Guruh" },
      { k: "tekshiruv", label: "Belgilarning mosligi" },
    ],
    compute(st) {
      const j = JINSLAR[st.namuna | 0] || JINSLAR[0];
      const kuzatilgan = [st.tirnash ? "yumshoq" : "qattiq", st.sirka ? "kislota bilan g‘illaydi" : "kislota taʼsir etmaydi", st.lupa ? "donalar ko‘rinadi" : "donalar ko‘rinmaydi"];
      const kutilgan = [j.qattiq < 5 ? "yumshoq" : "qattiq", j.kislota ? "kislota bilan g‘illaydi" : "kislota taʼsir etmaydi", j.dona.includes("don") || j.govak ? "donalar ko‘rinadi" : "donalar ko‘rinmaydi"];
      const mos = kuzatilgan.filter((k, i) => k === kutilgan[i]).length;
      return { nom: j.k, guruh: j.tur, mos, tekshiruv: mos + "/3 belgi mos keldi", j };
    },
    svg(st, r) {
      const j = r.j;
      let grains = "";
      for (let i = 0; i < 34; i++) {
        const a = (i * 137.5 * Math.PI) / 180, rr = (i % 7) * 9 + 6;
        const x = 170 + rr * Math.cos(a), y = 190 + rr * Math.sin(a) * 0.75;
        if (st.lupa) grains += circle(x, y, j.govak ? 4.5 : 3, { fill: "#ffffff", stroke: "none", opacity: j.govak ? 0.35 : 0.7 });
      }
      const acid = st.sirka ? "10 130 135" : null;
      return svgBox(
        circle(170, 190, 105, { fill: j.rang, stroke: "#0a1424", sw: 2, opacity: 0.92 }) +
        grains +
        (j.qatlam ? [0, 1, 2].map((i) => line(80, 150 + i * 32, 260, 146 + i * 32, { stroke: "#0a1424", sw: 2, opacity: 0.35 })).join("") : "") +
        txt(170, 320, "Lupa: " + j.dona, { anchor: "middle", size: 11.5, fill: "#93a4c4" }) +
        rect(330, 90, 280, 190, { fill: "#0f1a2e", stroke: "#26344d", r: 10 }) +
        txt(350, 118, j.k, { size: 17, fill: "#ffb347", weight: "bold" }) +
        txt(350, 140, "Guruh: " + j.tur, { size: 12.5, fill: "#5fd9d0" }) +
        txt(350, 162, "Qattiqlik: " + nf(j.qattiq, 1) + " (Mohs)", { size: 12, fill: "#cfe0ff" }) +
        txt(350, 184, "Tuzilishi: " + j.dona, { size: 12, fill: "#cfe0ff" }) +
        txt(350, 206, "Sirka sinovi: " + (j.kislota ? "g‘illaydi (CO₂)" : "reaksiya yo‘q"), { size: 12, fill: "#cfe0ff" }) +
        txt(350, 240, r.tekshiruv, { size: 12.5, fill: r.mos === 3 ? "#6fe39a" : "#ffb347" }) +
        (st.sirka ? circle(240, 120, 5, { fill: "#ffffff", stroke: "none", opacity: 0.8 }) + circle(252, 112, 3, { fill: "#ffffff", stroke: "none", opacity: 0.7 }) : ""), "0 0 640 340"
      );
    },
  };
  const qoldiq = {
    title: "Toshqotgan qoldiq modeli",
    hint: "Qatlam tartibi, qoplanish tezligi va muhitni tanlang — qoldiq saqlanadimi?",
    init: { tezlik: 2, muhit: 1, kislot: 0, qattiqlik: 1 },
    controls: [
      { k: "tezlik", label: "Cho‘kish tezligi (1..5)", min: 1, max: 5, step: 1 },
      { k: "muhit", label: "Muhit: 0 quruqlik · 1 ko‘l/dengiz tubi · 2 muzlik", min: 0, max: 2, step: 1 },
      { k: "kislot", label: "Kislotasi suv (qoldiqni eritadi) (0/1)", min: 0, max: 1, step: 1 },
      { k: "qattiqlik", label: "Qattiq qism (suyuq/chig‘anoq) bormi (0/1)", min: 0, max: 1, step: 1 },
    ],
    readouts: [
      { k: "holat", label: "Saqlanish" },
      { k: "foiz", label: "Saqlanish ehtimoli", unit: "%" },
      { k: "turi", label: "Qoldiq turi" },
    ],
    compute(st) {
      let p = 20 + st.tezlik * 12 + (st.muhit === 1 ? 30 : 0) - (st.kislot ? 25 : 0) + (st.qattiqlik ? 20 : -10);
      p = s(p, 0, 98);
      const holat = p > 70 ? "Yaxshi saqlanadi" : p > 40 ? "Qisman (faqat qolip/iz)" : "Saqlanmaydi";
      const turi = !st.qattiqlik ? (p > 60 ? "iz qoldig‘i" : "yo‘q") : st.kislot ? "erigan — qolip qoladi" : "mineralga aylangan suyak/chig‘anoq";
      return { holat, foiz: p, turi };
    },
    svg(st, r) {
      const layers = [
        { c: "#3a2c22", t: "yuqoridagi qatlam (yangi)" },
        { c: "#6b5638", t: "o‘rta qatlam" },
        { c: "#8a7350", t: "qoldiq qatlami" },
        { c: "#4a5f82", t: "ona jins (eski)" },
      ];
      let out = "";
      layers.forEach((l, i) => {
        const y = 110 + i * 44;
        out += rect(60, y, 380, 42, { fill: l.c, stroke: "#0a1424", sw: 1.2, r: 2 });
        out += txt(452, y + 26, l.t, { size: 11, fill: "#93a4c4" });
      });
      if (r.foiz > 40) out += path("M210,196 q26,-12 52,0 q-26,14 -52,0 Z", { stroke: "#ffb347", sw: 2.4 }) + circle(236, 198, 6, { fill: "#ffb347", stroke: "none" });
      if (r.foiz > 70) out += txt(236, 236, "mineralga aylangan qoldiq", { anchor: "middle", size: 10.5, fill: "#6fe39a" });
      const arrow1 = st.tezlik > 3 ? [0, 1, 2].map((i) => arrow(140 + i * 90, 60, 140 + i * 90, 104, { stroke: "#5fd9d0", sw: 2 })).join("") : arrow(230, 70, 230, 104, { stroke: "#5fd9d0", sw: 2 });
      return svgBox(
        txt(230, 40, "Cho‘kish tezligi " + st.tezlik + " — qoldiq " + r.foiz + "% saqlanadi", { anchor: "middle", size: 13, fill: "#ffb347", weight: "bold" }) +
        arrow1 + out +
        rect(470, 110, 150, 150, { fill: "#0f1a2e", stroke: "#26344d", r: 8 }) +
        txt(484, 136, "Saqlanish", { size: 11, fill: "#93a4c4" }) +
        txt(484, 160, r.holat, { size: 13, fill: r.foiz > 70 ? "#6fe39a" : r.foiz > 40 ? "#ffb347" : "#ff7a7a", weight: "bold" }) +
        txt(484, 186, "Turi:", { size: 11, fill: "#93a4c4" }) +
        txt(484, 208, r.turi, { size: 11.5, fill: "#cfe0ff" }), "0 0 640 340"
      );
    },
  };

  /* ---------- 16. Tuproq ---------- */
  const TUPROQLAR = [
    { k: "Qumli", qum: 85, loy: 10, gumus: 3, suv: 12, havo: 60, ushish: 35, unum: 25 },
    { k: "Loyli (gil)", qum: 20, loy: 65, gumus: 5, suv: 42, havo: 12, ushish: 85, unum: 40 },
    { k: "Qora tuproq", qum: 30, loy: 30, gumus: 12, suv: 34, havo: 28, ushish: 72, unum: 95 },
    { k: "Bog‘ (qorish)", qum: 45, loy: 25, gumus: 9, suv: 28, havo: 34, ushish: 60, unum: 78 },
  ];
  const tuproq = {
    title: "Tuproq turlari va ularning suv saqlashi",
    hint: "Tuproq turini suring — tarkib, suv saqlash va unumdorlik birga o‘zgaradi.",
    init: { tur: 2, yogin: 40 },
    controls: [
      { k: "tur", label: "Tuproq turi (0..3)", min: 0, max: 3, step: 1 },
      { k: "yogin", label: "Sug‘orish/yomg‘ir miqdori (L/m²)", min: 0, max: 120, step: 5, unit: " L" },
    ],
    readouts: [
      { k: "ushish", label: "Suvni ushlab qolish", unit: "%" },
      { k: "oqib", label: "Oqib ketdi (yuvildi)", unit: "L" },
      { k: "unum", label: "Unumdorlik" },
      { k: "havo", label: "Havo ulushi", unit: "%" },
    ],
    compute(st) {
      const t = TUPROQLAR[st.tur | 0] || TUPROQLAR[0];
      const ushish = t.ushish;
      const oqib = Math.max(0, st.yogin * (1 - ushish / 100));
      return { ushish, oqib, unum: t.unum, havo: t.havo, t };
    },
    svg(st, r) {
      const t = r.t;
      let donalar = "";
      for (let i = 0; i < 40; i++) {
        const x = 70 + (i % 10) * 34, y = 210 - Math.floor(i / 10) * 34;
        const isQum = i < 40 * (t.qum / 100) + 4;
        donalar += circle(x, y, isQum ? 11 : 5.5, { fill: isQum ? "#c9a15c" : "#5f7295", stroke: "none", opacity: 0.9 });
      }
      let water = "";
      const dropN = Math.round((r.ushish / 100) * (st.yogin / 6));
      for (let i = 0; i < Math.min(dropN, 14); i++) {
        water += circle(84 + (i % 7) * 46, 228 - Math.floor(i / 7) * 40, 6, { fill: "#5fd9d0", stroke: "none", opacity: 0.85 });
      }
      const run = r.oqib > 0.5 ? arrow(400, 120, 470, 230, { stroke: "#ff7a7a", sw: 3 }) + txt(480, 200, "yuvildi " + nf(r.oqib, 0) + " L", { size: 11, fill: "#ff7a7a" }) : "";
      const plantH = 26 + r.unum * 0.66;
      return svgBox(
        rect(56, 150, 356, 130, { fill: "#241a12", stroke: "#33507f", r: 6 }) +
        donalar + water +
        path(`M420,290 q20,${-plantH / 2} 0,${-plantH}`, { stroke: r.unum > 60 ? "#6fe39a" : "#c9a15c", sw: 3.4 }) +
        circle(420, 290 - plantH - 6, 8, { fill: r.unum > 60 ? "#6fe39a" : "#c9a15c", stroke: "none" }) +
        run +
        txt(234, 128, t.k + "  ·  qum " + t.qum + "% · loy " + t.loy + "% · gumus " + t.gumus + "%", { anchor: "middle", size: 12, fill: "#ffb347" }) +
        txt(234, 320, "Unumdorlik " + r.unum + " · havo " + r.havo + "% · suvni ushlash " + r.ushish + "%", { anchor: "middle", size: 11.5, fill: "#93a4c4" }), "0 0 640 340"
      );
    },
  };
  const singdirish = {
    title: "Suv qaysi tuproqdan qancha tez o‘tadi?",
    hint: "Uch tuproqning singdirish tezligini qiyoslang — sug‘orish rejasi shundan chiqadi.",
    init: { tur: 0, hajm: 100, vaqt: 30 },
    controls: [
      { k: "tur", label: "Tuproq: 0 qumli · 1 loyli · 2 qora", min: 0, max: 2, step: 1 },
      { k: "hajm", label: "Quyilgan suv (ml)", min: 20, max: 300, step: 10, unit: " ml" },
      { k: "vaqt", label: "Kuzatuv vaqti (sekund)", min: 5, max: 300, step: 5, unit: " s" },
    ],
    readouts: [
      { k: "tezlik", label: "Singdirish tezligi", unit: "ml/min" },
      { k: "kirish", label: "Kirgan suv", unit: "ml" },
      { k: "qolgan", label: "Sirtda qoldi", unit: "ml" },
      { k: "tavsiya", label: "Sug‘orish" },
    ],
    compute(st) {
      const sekinlik = [1, 6.5, 2.6][st.tur];
      const maxT = Math.round(st.hajm * sekinlik);
      const kirgan = Math.min(st.hajm, (st.hajm / maxT) * st.vaqt);
      const tez = st.hajm / maxT;
      return {
        tezlik: tez * 60,
        kirish: kirgan,
        qolgan: st.hajm - kirgan,
        tavsiya: st.tur === 0 ? "ko‘p-ko‘p, kam-kam" : st.tur === 1 ? "oz va sekin, ko‘lmak bo‘lmasin" : "o‘rtacha, haftada 2-3 marta",
      };
    },
    svg(st, r) {
      const cols = ["#c9a15c", "#5f7295", "#3a2c22"];
      let out = "";
      [0, 1, 2].forEach((i) => {
        const x = 70 + i * 190, top = 60, bot = 250;
        const speed = [1, 6.5, 2.6][i];
        const f = s(st.vaqt / (st.hajm * speed), 0, 1);
        out += rect(x, top, 130, bot - top, { fill: "#0f1a2e", stroke: "#33507f", r: 6 });
        out += rect(x, top + 30, 130, bot - top - 30, { fill: cols[i], stroke: "none", opacity: 0.85 });
        for (let k = 0; k < 8; k++) out += circle(x + 18 + (k % 4) * 32, top + 50 + Math.floor(k / 4) * 30, i === 0 ? 9 : 5, { fill: "#ffffff", stroke: "none", opacity: 0.2 });
        const w = f * (bot - top - 40);
        out += rect(x + 4, top + 34, 122, w, { fill: "#5fd9d0", stroke: "none", opacity: 0.55, r: 3 });
        out += txt(x + 65, bot + 20, ["qumli", "loyli", "qora"][i], { anchor: "middle", size: 11.5, fill: i === st.tur ? "#ffb347" : "#93a4c4", weight: i === st.tur ? "bold" : "" });
        out += txt(x + 65, top - 8, nf((1 - f) * 100, 0) + "% suv qoldi", { anchor: "middle", size: 10.5, fill: "#93a4c4" });
      });
      return svgBox(out + txt(320, 310, "Suvning kirish darajasi — har bir tuproq uchun o‘lchangan vaqtda", { anchor: "middle", size: 12, fill: "#5fd9d0" }), "0 0 640 330");
    },
  };

  /* ---------- 17. Astronomiya ---------- */
  const astronomiya = {
    title: "Quyosh sistemasi va masshtab",
    hint: "Masshtabni o‘zgartiring — sayyoralarning haqiqiy joylashuvi qanchalik keng ekanini ko‘ring.",
    init: { sayyora: 2, masshtab: 2 },
    controls: [
      { k: "sayyora", label: "Sayyora (0 Merkuriy … 7 Neptun)", min: 0, max: 7, step: 1 },
      { k: "masshtab", label: "Masofa masshtabi (1..6)", min: 1, max: 6, step: 1 },
    ],
    readouts: [
      { k: "a.b.", label: "Quyoshdan", unit: "a.b." },
      { k: "daqiqa", label: "Yorug‘lik boradi", unit: "min" },
      { k: "kun", label: "Aylanish davri", unit: "kun" },
      { k: "yil", label: "Yil uzunligi", unit: "yil" },
    ],
    compute(st) {
      const P = [
        { k: "Merkuriy", a: 0.39, d: 0.24, y: 88, n: 0 },
        { k: "Venera", a: 0.72, d: 0.95, y: 225, n: 0 },
        { k: "Yer", a: 1, d: 1, y: 365, n: 1 },
        { k: "Mars", a: 1.52, d: 0.53, y: 687, n: 2 },
        { k: "Yupiter", a: 5.2, d: 11.2, y: 4333, n: 95 },
        { k: "Saturn", a: 9.58, d: 9.45, y: 10759, n: 146 },
        { k: "Uran", a: 19.2, d: 4.0, y: 30687, n: 28 },
        { k: "Neptun", a: 30.05, d: 3.88, y: 60190, n: 16 },
      ][st.sayyora | 0] || P[0];
      return { p: P, "a.b.": P.a, daqiqa: (P.a * 8.3), kun: P.d, yil: P.y / 365 };
    },
    svg(st, r) {
      const p = r.p;
      let orbits = "", planets = "";
      const cx = 320, cy = 180;
      [[0.39, "#93a4c4"], [0.72, "#c9a15c"], [1, "#5fd9d0"], [1.52, "#ff7a7a"], [5.2, "#ffb347"], [9.58, "#e6d3a3"], [19.2, "#7fd4ff"], [30.05, "#6b7cff"]].forEach(([a, c], i) => {
        const R = 12 + Math.sqrt(a / (st.masshtab * 5)) * 180;
        orbits += circle(cx, cy, R, { stroke: i === st.sayyora ? "#ffb347" : "#22304d", sw: i === st.sayyora ? 2.4 : 1, fill: "none" });
        if (i <= st.sayyora) {
          const ang = (i * 50 * Math.PI) / 180;
          planets += circle(cx + R * Math.cos(ang), cy + R * Math.sin(ang), 3 + p.d * (i === st.sayyora ? 2.2 : 1), { fill: c, stroke: "none", opacity: 0.95 });
        }
      });
      return svgBox(
        orbits + circle(cx, cy, 22, { fill: "#ffb347", stroke: "#fff", sw: 1.6, opacity: 0.95 }) + planets +
        txt(14, 34, p.k + " — Quyoshdan " + nf(p.a, 2) + " a.b. · yil " + nf(p.y / 365, 1) + " yer yili · yo‘ldosh " + p.n, { size: 12.5, fill: "#ffb347", weight: "bold" }) +
        txt(14, 54, "1 a.b. = 150 mln km — yorug‘lik bu masofani 8,3 daqiqada o‘tadi", { size: 11, fill: "#93a4c4" }), "0 0 640 360"
      );
    },
  };
  const fazalar = {
    title: "Oy fazalari, kun va fasllar",
    hint: "Oyning orbita burchagi va Yerning yildagi holati — faza, kunduz uzunligi va fasl shundan o‘zgaradi.",
    init: { burchak: 45, kunOrb: 170 },
    controls: [
      { k: "burchak", label: "Oyning orbitadagi burchagi (°)", min: 0, max: 360, step: 5, unit: "°" },
      { k: "kunOrb", label: "Yil ichida kun (1..365)", min: 1, max: 365, step: 1, unit: " kun" },
    ],
    readouts: [
      { k: "faza", label: "Oy fazasi" },
      { k: "yorug", label: "Yorug‘ qism", unit: "%" },
      { k: "fasl", label: "Fasal (shimol)" },
      { k: "kunduz", label: "Kunduz uzunligi", unit: "soat" },
    ],
    compute(st) {
      const b = st.burchak % 360;
      const yorug = Math.round(((1 - Math.cos((b * Math.PI) / 180)) / 2) * 100);
      const faza = yorug > 96 ? "To‘lin Oy" : yorug < 4 ? "Yangi Oy" : b < 90 ? "O‘sib borayotgan yarim oy" : b < 180 ? "To‘linga yaqin (o‘suvchi)" : b < 270 ? "Kamayayotgan (so‘nggi chorak)" : "Yangi Oyga yaqin";
      const f = (st.kunOrb - 80) / 365 * Math.PI * 2;
      const kunduz = 12 + 6.2 * Math.sin(f);
      const q = Math.sin(f);
      const fasl = q > 0.5 ? "yoz" : q > 0 ? "bahor" : q > -0.5 ? "kuz" : "qish";
      return { faza, yorug, fasl, kunduz };
    },
    svg(st, r) {
      const cx = 460, cy = 180, R = 66;
      const b = ((st.burchak % 360) * Math.PI) / 180;
      const kx = cx + R * Math.cos(b), ky = cy + R * Math.sin(b);
      const illum = r.yorug / 100;
      const moon = circle(kx, ky, 16, { fill: "#0a1424", stroke: "#93a4c4", sw: 1.4 }) +
        path(`M${kx},${ky - 16} A16,16 0 ${illum > 0.5 ? 1 : 0} 0 ${kx},${ky + 16} A${Math.abs(16 * (2 * illum - 1))},16 0 0 ${illum > 0.5 ? 1 : 0} ${kx},${ky - 16} Z`, { fill: "#fff3cf", stroke: "none", opacity: 0.95 });
      const earthX = 110, earthY = 180;
      const tilt = -23.5;
      const dayLen = r.kunduz;
      const dayArc = (dayLen / 24) * 360;
      let out =
        txt(320, 34, "Oy fazasi: " + r.faza + "  ·  yorug‘ qism " + r.yorug + "%", { anchor: "middle", size: 13.5, fill: "#ffb347", weight: "bold" }) +
        circle(earthX, earthY, 44, { fill: "#1d3a5c", stroke: "#5fd9d0", sw: 2 }) +
        path(`M${earthX - 40},${earthY} A44,44 0 0 1 ${earthX + 40},${earthY}`, { stroke: "#ffb347", sw: 4, opacity: 0.85 }) +
        line(earthX - 30, earthY - 52, earthX + 30, earthY + 52, { stroke: "#ff7a7a", sw: 1.6, dash: "5 4" }) +
        txt(earthX, earthY - 64, "o‘q qiyaligi 23,5°", { anchor: "middle", size: 10.5, fill: "#ff7a7a" }) +
        txt(earthX, earthY + 74, "kunduz " + nf(dayLen, 1) + " soat · " + r.fasl, { anchor: "middle", size: 11.5, fill: "#5fd9d0" }) +
        arrow(640 - 40, 90, earthX + 70, earthY - 40, { stroke: "#ffe1b0", sw: 2.4 }) +
        txt(600, 78, "Quyosh nuri", { anchor: "end", size: 11, fill: "#ffe1b0" }) +
        circle(cx, cy, R, { stroke: "#22304d", fill: "none", dash: "4 5" }) +
        circle(cx, cy, 22, { fill: "#1d3a5c", stroke: "#5fd9d0", sw: 2 }) +
        txt(cx, cy + 5, "Yer", { anchor: "middle", size: 11, fill: "#cfe0ff" }) +
        moon;
      return svgBox(out, "0 0 640 340");
    },
  };

  /* ---------- Laboratoriya moslashuvchan ulagichi ---------- */
  const REG = {
    ratsion, hazm, nafas, puls, mikrob, spreu, himoya, zanjir, zanjir_birikish,
    modda, qaynash, ozgarish, erish, kuch, suzish, yoruglik, sinish,
    elektr, qiyos, jins, qoldiq, tuproq, singdirish, astronomiya, fazalar,
  };
  // mavzu labMode bo‘yicha qo‘shma rejimlarni biriktirish
  const ALIAS = {
    "mikrob:spreu": "spreu",
    "zanjir:birikish": "zanjir_birikish",
    "modda:qaynash": "qaynash",
    "ozgarish:kimyo": "ozgarish",
    "suzish:shakl": "suzish",
    "yoruglik:sinish": "sinish",
    "elektr:qiyos": "qiyos",
    "jins:qoldiq": "qoldiq",
    "tuproq:singdirish": "singdirish",
    "astronomiya:fazalar": "fazalar",
  };

  function mount(host, topic, api) {
    const key = ALIAS[topic.lab + ":" + topic.labMode] || topic.lab;
    const cfg = REG[key];
    if (!cfg) {
      host.innerHTML = `<p class="hint">Bu mavzu uchun simulyator tayyorlanmoqda.</p>`;
      return { destroy() {} };
    }
    host.innerHTML = "";
    const state = Object.assign({}, cfg.init);
    const wrap = el("div", "lab-wrap");
    const stage = el("div", "lab-stage");
    const panel = el("div", "lab-panel");
    wrap.append(stage, panel);
    host.append(wrap);

    const head = el("div", "card", `<h2 style="margin-bottom:4px">${cfg.title}</h2><p class="hint" style="margin:0">${cfg.hint || ""}</p>`);
    host.prepend(head);

    // boshqaruv elementlari
    cfg.controls.forEach((c) => {
      const f = el("div", "field");
      const lab = el("label", "", c.label);
      const input = el("input");
      input.type = "range";
      input.min = c.min; input.max = c.max; input.step = c.step;
      input.value = state[c.k];
      const val = el("span", "val", String(state[c.k]).replace(".", ",") + (c.unit || ""));
      input.addEventListener("input", () => {
        state[c.k] = c.step >= 1 && c.max - c.min <= 60 ? parseInt(input.value, 10) : parseFloat(input.value);
        val.innerHTML = (c.max - c.min <= 60 && c.step >= 1 ? state[c.k] : nf(state[c.k], 2)) + (c.unit || "");
        render();
      });
      f.append(lab, input, val);
      panel.append(f);
    });
    if (cfg.controlsExtra) {
      cfg.controlsExtra.forEach((x) => {
        if (x.type === "playpause") {
          const row = el("div", "field");
          const btn = el("button", "btn primary", "▶ Harakatni boshlash");
          btn.addEventListener("click", () => {
            api.running = !api.running;
            btn.innerHTML = api.running ? "⏸ To‘xtatish" : "▶ Harakatni boshlash";
            if (!api.running) { state.t = 0; render(); }
          });
          const rst = el("button", "btn small", "↺ Boshidan");
          rst.addEventListener("click", () => { state.t = 0; render(); });
          row.append(btn, " ", rst);
          panel.append(row);
        }
      });
    }

    // o‘lchov katakchalari
    const ro = el("div", "field");
    const grid = el("div", "readout");
    const cells = {};
    (cfg.readouts || []).forEach((rd) => {
      const cell = el("div", "cell", `<b>${rd.label}${rd.unit ? " (" + rd.unit + ")" : ""}</b><span>—</span>`);
      cells[rd.k] = cell.querySelector("span");
      grid.append(cell);
    });
    ro.append(grid);
    panel.append(ro);

    const actions = el("div", "field");
    const saveBtn = el("button", "btn small", "💾 Natijani daftarga");
    saveBtn.addEventListener("click", () => api.save({ lab: topic.lab, mode: topic.labMode, state: JSON.parse(JSON.stringify(state)), r: lastR }));
    actions.append(saveBtn, " ", el("span", "hint", " — o‘lchovlaringiz Amaliy topshiriq bo‘limidagi daftarga yoziladi."));
    panel.append(actions);

    let lastR = {};
    function render() {
      const r = cfg.compute(state, api);
      lastR = r;
      (cfg.readouts || []).forEach((rd) => {
        if (!(rd.k in r)) return;
        const v = r[rd.k];
        cells[rd.k].innerHTML = typeof v === "number" ? nf(v, rd.d == null ? 1 : rd.d) : String(v);
      });
      stage.innerHTML = cfg.svg(state, r, api);
      if (cfg.after) cfg.after(stage, state, r, api);
    }
    render();
    api.running = false;
    return {
      destroy() {
        api.running = false;
        if (api.timer) clearInterval(api.timer);
      },
    };
  }
  return { mount, REG };
})();

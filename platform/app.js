/* 6-sinf Tabiiy fan platformasi — ilova (7-sinf arxitekturasi asosida)
 * Bitta HTML fayl ichida ishlaydi: ma'lumot <script id="topics-data"> orolida.
 * Saqlash: localStorage (tabiiy6_progress_v1) — server talab qilinmaydi.
 */
(function () {
  "use strict";

  const KEY = "tabiiy6_progress_v1";
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const nf = (x, d = 1) => (!isFinite(x) ? "—" : String(+ (+x).toFixed(d)).replace(".", ","));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- ma'lumot ---------------- */
  let DATA = { meta: {}, topics: [] };
  try {
    DATA = JSON.parse($("#topics-data").textContent);
  } catch (e) {
    console.error("topics-data ajratib bo'lmadi:", e);
  }
  const TOPICS = (DATA.topics || []).map((t) => ({
    ...t,
    kod: t.kitob?.kod || `${t.d}.${t.c}`,
    bobNomi: t.kitob?.bobNomi || `${t.d}-bob`,
  }));
  const BOBS = (() => {
    const m = new Map();
    TOPICS.forEach((t) => {
      if (!m.has(t.d)) m.set(t.d, { n: t.d, nom: t.bobNomi, bet: t.kitob?.oralig || "", mavzular: [], amaliy: (DATA.meta?.bob_amaliy_ishlari || {})[t.d] || [], chorak: t.chorak || Math.ceil(t.d / 3) });
      m.get(t.d).mavzular.push(t);
    });
    return Array.from(m.values()).sort((a, b) => a.n - b.n);
  })();

  /* ---------------- holat / saqlash ---------------- */
  const state = {
    tab: "nazariya",
    topic: TOPICS[0]?.kod || "",
    panel: false,
    progress: load(),
    test: null,
    slides: null,
  };
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.progress));
    } catch (e) {
      console.warn("Saqlanmadi:", e);
    }
  }
  function pOf(kod) {
    if (!state.progress[kod]) state.progress[kod] = { viewed: false, steps: {}, notebook: {}, answers: {}, test: null, slides: 0 };
    return state.progress[kod];
  }
  function viewed(kod) {
    const p = pOf(kod);
    if (!p.viewed) {
      p.viewed = true;
      save();
      renderSidebar();
    }
  }
  function topicByKod(kod) {
    return TOPICS.find((t) => t.kod === kod);
  }
  const cur = () => topicByKod(state.topic);

  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 2000);
  }

  /* ---------------- mezon chip ---------------- */
  function mezonChip(k, bio) {
    return `<span class="mezon-chip ${bio ? "biox" : ""}" title="Darslikdagi ko'nikma: ${esc(k)}">${esc(k)}</span>`;
  }
  function mezonList(topic, limit) {
    const k = (topic.urinish?.konikmalar || []).slice(0, limit || 3);
    if (!k.length) return "";
    return `<div class="chips">${k.map((x, i) => mezonChip(x, i === 1)).join("")}</div>`;
  }

  /* ---------------- sidebar ---------------- */
  function renderSidebar() {
    const list = $("#bob-list");
    if (!list) return;
    const q = ($("#search")?.value || "").trim().toLowerCase();
    list.innerHTML = BOBS.map((b) => {
      const items = b.mavzular.filter(
        (t) => !q || t.t.toLowerCase().includes(q) || t.kod.includes(q) || (t.theory || "").toLowerCase().includes(q)
      );
      if (q && !items.length) return "";
      const done = b.mavzular.filter((t) => state.progress[t.kod]?.viewed).length;
      return `<section class="bob-group">
        <header class="bob-title"><span class="n">${b.n}-bob</span> <span>${esc(b.nom)}</span><b class="b">${done}/${b.mavzular.length}</b></header>
        ${items
          .map(
            (t) => `<button class="topic-item ${t.kod === state.topic ? "active" : ""}" data-topic="${t.kod}">
              <span class="kod">${t.kod}</span><span class="tt">${esc(t.t)}</span>${state.progress[t.kod]?.viewed ? '<span class="tick">✓</span>' : ""}
            </button>`
          )
          .join("")}
      </section>`;
    }).join("");
  }

  /* ---------------- topbar ---------------- */
  function renderTopbar() {
    const t = cur();
    $("#crumb").innerHTML = t
      ? `<b>${esc(t.bobNomi)}</b> · ${t.kod} ${esc(t.t)} · <span class="muted">darslik ${esc(betMatn(t.kitob?.oralig))}</span>`
      : `<b>6-sinf Tabiiy fan</b> · boshqaruv paneli`;
    $$("#tabs .tab-btn").forEach((b) =>
      b.classList.toggle("active", state.panel ? b.dataset.act === "panel" : !state.panel && b.dataset.tab === state.tab)
    );
  }

  /* ---------------- asosiy kontent ---------------- */
  function render() {
    renderTopbar();
    renderSidebar();
    const host = $("#content");
    if (state.panel) return renderPanel(host);
    const t = cur();
    if (!t) {
      host.innerHTML = `<p>Mavzu topilmadi.</p>`;
      return;
    }
    viewed(t.kod);
    if (state.tab === "nazariya") renderTheory(host, t);
    else if (state.tab === "simulyator") renderLab(host, t);
    else if (state.tab === "oyin") renderGame(host, t);
    else if (state.tab === "test") renderTestTab(host, t);
    else renderTask(host, t);
  }

  /* Kitob betlari: mundarija bet raqamini BOB darajasida beradi, shuning uchun
     «4–13» butun bobga tegishli — buni interfeysda shunday ko'rsatamiz. */
  function betMatn(oralig) {
    const o = String(oralig || "").trim();
    if (!o) return "";
    const [a, b] = o.split("–");
    if (!b || b.trim() === "") return `${a}-betdan boshlanadi`;
    return `${a}–${b}-betlar`;
  }
  function bobMatn(t) {
    const b = betMatn(t.kitob?.oralig);
    return b ? `${t.d}-bob · ${b}` : `${t.d}-bob`;
  }
  function head(t, sub) {
    return `<div class="card">
      <h2>${esc(t.t)}</h2>
      <div class="kitob-box">
        <span class="chip">${t.kod}</span>
        <span class="chip cyan">Darslik ${esc(bobMatn(t))}</span>
        ${t.kitob?.amaliyIsh ? `<span class="chip amber">Amaliy ish ${t.kitob.amaliyIsh.kod}: ${esc(t.kitob.amaliyIsh.nomi)}</span>` : ""}
        ${t.kitob?.boshqotirma ? `<span class="chip">Boshqotirma: ${t.kitob.boshqotirma}-bet</span>` : ""}
        ${t.kitob?.mustahkamlash ? `<span class="chip">Mustahkamlash: ${t.kitob.mustahkamlash}-bet</span>` : ""}
      </div>
      ${sub || ""}
    </div>`;
  }

  /* ---- Nazariya ---- */
  function renderTheory(host, t) {
    const paras = (t.theory || "").split("\n\n").filter(Boolean);
    host.innerHTML =
      head(t) +
      `<div class="card theory">
        <h3>Nazariya</h3>
        ${paras.map((p) => `<p>${esc(p)}</p>`).join("") || "<p class='muted'>Matn tayyorlanmoqda.</p>"}
      </div>
      <div class="grid cols-2">
        <div class="card">
          <h3>Asosiy formulalar va qoidalar</h3>
          <div class="formula-list">${(t.formulas || []).map((f) => `<div class="formula">${esc(f)}</div>`).join("")}</div>
        </div>
        <div class="card">
          <h3>Atamalar lug'ati</h3>
          <table class="vocab-table"><tbody>
            ${(t.vocab || []).map((v) => `<tr><td>${esc(v.w)}</td><td>${esc(v.m)}</td></tr>`).join("")}
          </tbody></table>
          <h3>Kitobda</h3>
          <p class="small muted">Darslik savollari: ${esc((t.urinish?.savollar || []).join(" · ") || "mundarijadagi yo'naltiruvchi savollar")}<br>
          ${t.kitob?.amaliyIsh ? `Mashq daftari: ${esc(t.kitob.amaliyIsh.bet || "")}-bet · ${esc(t.kitob.amaliyIsh.nomi || "")}` : ""}
          ${(t.urinish?.qism_mavzular || []).length ? "<br>Qism mavzular: " + esc(t.urinish.qism_mavzular.join(" · ")) : ""}</p>
          ${mezonList(t, 3)}
        </div>
      </div>
      <div class="card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <button class="btn primary" data-act="slides">📽 Slaydlar bilan ishlash</button>
          <button class="btn" data-act="print">🖨 Chop markazi</button>
          <button class="btn ghost" data-go="test">📝 Testga o'tish</button>
          <button class="btn ghost" data-go="amaliy">✍️ Amaliy topshiriq</button>
          <span class="spacer"></span>
          ${progressPill(t.kod)}
        </div>
      </div>`;
  }
  function progressPill(kod) {
    const p = state.progress[kod] || {};
    const steps = Object.keys(p.steps || {}).length;
    const n = (topicByKod(kod)?.task?.steps || []).length || 5;
    const score = p.test ? `${p.test.right}/${p.test.total}` : "—";
    return `<span class="pill" title="Amaliy bosqichlar va test natijasi">Bosqichlar ${steps}/${n} · Test ${score}</span>`;
  }

  /* ---- Amaliy topshiriq ---- */
  function renderTask(host, t) {
    const p = pOf(t.kod);
    const task = t.task || {};
    const steps = task.steps || [];
    host.innerHTML =
      head(t) +
      `<div class="card">
        <h3>✍️ Amaliy topshiriq</h3>
        <p class="quote">${esc(task.q || "")}</p>
        ${task.jihoz?.length ? `<h3>Jihozlar</h3><ul class="task-list">${task.jihoz.map((j) => `<li>${esc(j)}</li>`).join("")}</ul>` : ""}
        ${task.xavfsizlik?.length ? `<div class="safety"><h3>⚠ Xavfsizlik qoidalari</h3><ul class="task-list">${task.xavfsizlik.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        ${steps.length ? `<h3>Bajarish tartibi</h3><div class="task-block">${steps
          .map(
            (st, i) => `<label class="check-row ${p.steps[i] ? "done" : ""}"><input type="checkbox" data-step="${i}" ${p.steps[i] ? "checked" : ""}><span><b>${i + 1}.</b> ${esc(st)}</span></label>`
          )
          .join("")}</div>` : ""}
        ${mezonList(t, 4)}
      </div>
      <div class="grid cols-2">
        <div class="card">
          <h3>O'lchov va kuzatuv jadvali</h3>
          ${tableEditor(t, p)}
          <h3>Natija</h3>
          <textarea class="notebook" data-nb="natija" placeholder="O'lchovlaringiz, jadval va diagramma tavsifi…">${esc(p.notebook.natija || "")}</textarea>
          <h3>Xulosa</h3>
          <textarea class="notebook" data-nb="xulosa" placeholder="Nima aniqladingiz? Maqsutga erishdingizmi?">${esc(p.notebook.xulosa || "")}</textarea>
          <h3>Ustozga javob (tekshirish uchun)</h3>
          <textarea class="notebook" data-nb="javob" placeholder="Topshiriqning kutilayotgan javobi — o'qituvchi bosqichi">${esc(p.notebook.javob || "")}</textarea>
          <div class="chips" style="margin-top:10px">
            <button class="btn primary" data-act="save-task">💾 Saqlash</button>
            <button class="btn" data-act="print">🖨 Chop markazi</button>
            <button class="btn ghost" data-act="clear-task">Tozalash</button>
          </div>
        </div>
        <div class="card">
          <h3>Kutilayotgan javob va baholash</h3>
          <p>${esc(task.a || "")}</p>
          ${task.why ? `<h3>Nega muhim?</h3><p class="small">${esc(task.why)}</p>` : ""}
          <h3>Baholash mezonlari</h3>
          <ol class="task-list small">
            <li>Jihozlar to'plangan, xavfsizlik qoidalari saqlangan — <b>0–1 ball</b></li>
            <li>O'lchov jadvali to'ldirilgan, diagramma chizilgan — <b>0–2 ball</b></li>
            <li>Natija yozilgan, qonuniyat ko'rsatilgan — <b>0–2 ball</b></li>
            <li>Xulosa savolga javob beradi, dalil keltirilgan — <b>0–2 ball</b></li>
            <li>Mezon-kupiklardagi ko'nikma namoyon bo'lgan — <b>0–1 ball</b></li>
          </ol>
          <p class="small muted">Jami 8 ball. 7–8 — «5»; 5–6 — «4»; 3–4 — «3».</p>
        </div>
      </div>`;
  }
  function tableEditor(t, p) {
    const rows = p.notebook.rows || [
      { a: "", b: "", c: "" },
      { a: "", b: "", c: "" },
      { a: "", b: "", c: "" },
      { a: "", b: "", c: "" },
    ];
    return `<table class="data-table" id="nb-table"><thead><tr><th>#</th><th>O'lchov / kuzatuv</th><th>Qiymat</th><th>Izoh</th></tr></thead>
      <tbody>${rows
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td><input data-row="${i}.a" value="${esc(r.a)}"></td><td><input data-row="${i}.b" value="${esc(r.b)}"></td><td><input data-row="${i}.c" value="${esc(r.c)}"></td></tr>`
        )
        .join("")}</tbody></table>
      <button class="btn small" data-act="add-row">+ Qator qo'shish</button>`;
  }

  /* ---- Simulyator ---- */
  let labInstance = null;
  function renderLab(host, t) {
    if (labInstance) {
      try {
        labInstance.destroy();
      } catch (e) {}
      labInstance = null;
    }
    host.innerHTML =
      head(
        t,
        `<p class="hint">${esc(t.labTitle || "Interaktiv model")} — o'zgartirishlarni boshqaring, qiymatlarni kuzating va <b>Amaliy topshiriq</b> bo'limidagi jadvalga yozing.</p>`
      ) + `<div class="card" style="padding:0;border:0;background:none"><div id="lab-host"></div></div>`;
    const labHost = $("#lab-host");
    const api = {
      running: false,
      save(obj) {
        const p = pOf(t.kod);
        p.notebook.lab = obj;
        p.notebook.natija =
          (p.notebook.natija ? p.notebook.natija + "\n" : "") +
          `[${t.kod} simulyator] ` +
          Object.entries(obj.r || {})
            .map(([k, v]) => `${k}=${typeof v === "number" ? nf(v, 2) : JSON.stringify(v)}`)
            .join(" · ");
        save();
        toast("Simulyator qiymatlari daftarga qo'shildi");
      },
    };
    if (window.LABS) {
      try {
        labInstance = LABS.mount(labHost, t, api) || null;
      } catch (e) {
        console.error(e);
        labHost.innerHTML = `<div class="card"><p class="muted">Simulyatorni ochishda xato: ${esc(e.message)}</p></div>`;
      }
    } else {
      labHost.innerHTML = `<div class="card"><p class="muted">LABS moduli yuklanmagan.</p></div>`;
    }
  }

  /* ---- O'yin ---- */
  function renderGame(host, t) {
    const g = (t.game || []).length ? t.game : (t.slideQuiz || []).slice(0, 4);
    host.innerHTML =
      head(t) +
      `<div class="card game-card">
        <div class="game-meter"><span id="g-score">0</span><span class="muted">/ ${g.length}</span>
          <div class="track"><i id="g-bar" style="width:0"></i></div>
          <button class="btn small" data-act="game-reset">↺ Qaytadan</button>
        </div>
        <div id="g-body"></div>
      </div>`;
    const game = { i: 0, right: 0, lock: false };
    const body = $("#g-body");
    function draw() {
      if (game.i >= g.length) {
        body.innerHTML = `<h3 style="margin-top:0">Natija: ${game.right} / ${g.length}</h3>
          <p class="muted small">${game.right === g.length ? "A'lo! Barcha javoblar to'g'ri." : "Xatolarni takrorlab, nazariya bo'limiga qayting."}</p>
          ${mezonList(t, 2)}
          <div class="chips"><button class="btn primary" data-act="game-reset">Yana o'ynash</button><button class="btn" data-go="test">📝 Test</button></div>`;
        $("#g-bar").style.width = "100%";
        return;
      }
      const [q, opts, idx, why] = g[game.i];
      game.lock = false;
      body.innerHTML = `<div class="game-q">${esc(q)}</div>
        <div class="game-opts">${opts.map((o, i) => `<button class="game-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>
        <p class="hint" id="g-why" style="display:none">${esc(why || "")}</p>`;
      $("#g-score").textContent = game.right;
      $("#g-bar").style.width = (game.i / g.length) * 100 + "%";
      $$(".game-opt", body).forEach((btn) =>
        btn.addEventListener("click", () => {
          if (game.lock) return;
          game.lock = true;
          const i = +btn.dataset.i;
          btn.classList.add(i === idx ? "right" : "bad");
          if (i !== idx) $$(".game-opt", body)[idx]?.classList.add("right");
          else game.right++;
          $("#g-score").textContent = game.right;
          $("#g-why").style.display = "block";
          const next = document.createElement("div");
          next.className = "chips";
          next.style.marginTop = "10px";
          next.innerHTML = `<button class="btn primary" data-next>Keyingi →</button>`;
          body.append(next);
          $("[data-next]", next).addEventListener("click", () => {
            game.i++;
            draw();
          });
        })
      );
    }
    draw();
  }

  /* ---- Test bo'limi (sozlash + natija) ---- */
  function renderTestTab(host, t) {
    const cfg = state.test?.cfg || { bob: [t.d], n: 10, mode: "aralash", timer: 0 };
    host.innerHTML =
      head(t) +
      `<div class="card">
        <h3>📝 Test tuzish</h3>
        <div class="field"><label>Boblar</label><div class="seg" data-seg="bob">${BOBS.map(
          (b) => `<button data-v="${b.n}" class="${cfg.bob.includes(b.n) ? "on" : ""}">${b.n}</button>`
        ).join("")}</div></div>
        <div class="grid cols-3" style="margin-top:10px">
          <div class="field"><label>Savollar soni</label><div class="seg" data-seg="n">${[5, 10, 15, 20, 30].map(
            (n) => `<button data-v="${n}" class="${cfg.n === n ? "on" : ""}">${n}</button>`
          ).join("")}</div></div>
          <div class="field"><label>Turi</label><div class="seg" data-seg="mode">${[
            ["aralash", "Aralash"],
            ["bilim", "Bilimlar"],
            ["amaliy", "Amaliy ko'nikma"],
          ]
            .map(([v, l]) => `<button data-v="${v}" class="${cfg.mode === v ? "on" : ""}">${l}</button>`)
            .join("")}</div></div>
          <div class="field"><label>Vaqt (min, 0 — cheksiz)</label><div class="seg" data-seg="timer">${[0, 5, 10, 15, 20].map(
            (n) => `<button data-v="${n}" class="${cfg.timer === n ? "on" : ""}">${n || "∞"}</button>`
          ).join("")}</div></div>
        </div>
        <div class="chips" style="margin-top:10px"><button class="btn primary" data-act="test-start">Testni boshlash</button></div>
      </div>`;
  }
  function buildTest(topics, cfg) {
    let pool = [];
    topics.forEach((t) =>
      (t.quiz || []).forEach((q, i) =>
        pool.push({ q: q[0], opts: q[1], a: q[2], why: q[3], kod: t.kod, bob: t.d, tur: i >= 3 ? "amaliy" : "bilim" })
      )
    );
    if (cfg.mode !== "aralash") pool = pool.filter((q) => q.tur === (cfg.mode === "bilim" ? "bilim" : "amaliy"));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, cfg.n);
  }
  function startTest() {
    if (!state.test || !state.test.cfg) state.test = { cfg: { bob: [cur()?.d || 1], n: 10, mode: "aralash", timer: 0 } };
    const cfg = state.test.cfg;
    const topics = TOPICS.filter((t) => cfg.bob.includes(t.d));
    const questions = buildTest(topics, cfg);
    if (!questions.length) {
      toast("Bu shartlarda savol topilmadi");
      return;
    }
    state.test = { cfg, questions, answers: {}, i: 0, started: Date.now(), left: cfg.timer * 60 };
    renderTest();
  }
  function renderTest() {
    const { questions, answers, cfg } = state.test;
    const host = $("#content");
    const done = Object.keys(answers).length;
    host.innerHTML = `<div class="card">
      <div class="test-head">
        <h2 style="margin:0">Test · ${cfg.bob.length === 1 ? cfg.bob[0] + "-bob" : "boblar " + cfg.bob.join(", ")}</h2>
        <span class="chip">${questions.length} savol</span>
        <span class="chip cyan" id="t-timer">${cfg.timer ? "⏳ " + fmtTime(state.test.left) : "vaqt cheksiz"}</span>
        <span class="muted small">Savol ${state.test.i + 1} / ${questions.length}</span>
        <button class="btn small" data-act="test-exit">✕ Chiqish</button>
      </div>
      <div class="chip-list">${questions
        .map((q, i) => `<button class="chip-num ${i === state.test.i ? "cur" : ""} ${i in answers ? (answers[i] === q.a ? "ok" : "no") : ""}" data-jump="${i}">${i + 1}</button>`)
        .join("")}</div>
      <div id="t-body" style="margin-top:12px"></div>
    </div>`;
    drawQuestion();
    if (cfg.timer && !state.test.tick) {
      state.test.tick = setInterval(() => {
        if (!state.test) return;
        state.test.left--;
        const el = $("#t-timer");
        if (el) el.textContent = "⏳ " + fmtTime(state.test.left);
        if (state.test.left <= 0) {
          finishTest();
        }
      }, 1000);
    }
  }
  const fmtTime = (s) => (s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "0:00");
  function drawQuestion() {
    const { questions, answers, i = 0 } = state.test;
    const q = questions[i];
    const body = $("#t-body");
    if (!body) return;
    const chosen = answers[i];
    body.innerHTML = `<div class="q-item">
      <div class="q-text">${i + 1}. ${esc(q.q)} <span class="chip" style="margin-left:6px">${q.kod}</span></div>
      ${q.opts.map((o, k) => `<label class="opt-row">${chosen != null ? (k === q.a ? "correct" : k === chosen ? "wrong" : "") : ""}">
        <input type="radio" name="q${i}" value="${k}" ${chosen === k ? "checked" : ""} ${chosen != null ? "disabled" : ""}>
        <span>${esc(o)}</span></label>`).join("")}
      ${chosen != null ? `<div class="why"><b>${chosen === q.a ? "To'g'ri ✓" : "Xato ✕"}</b> ${esc(q.why || "")}</div>` : ""}
      <div class="chips" style="margin-top:10px">
        <button class="btn small" data-prev ${i === 0 ? "disabled" : ""}>← Oldingi</button>
        <button class="btn small" data-next ${i >= questions.length - 1 ? "disabled" : ""}>Keyingi →</button>
        <button class="btn small primary" data-finish>${i >= questions.length - 1 ? "Yakunlash" : "Yakunlash (hoziroq)"}</button>
      </div>
    </div>`;
    $$(`#t-body input[name=q${i}]`).forEach((inp) =>
      inp.addEventListener("change", () => {
        state.test.answers[i] = +inp.value;
        const t = topicByKod(q.kod);
        if (t) {
          const p = pOf(t.kod);
          p.answers[i] = +inp.value === q.a;
          save();
        }
        renderTest();
      })
    );
  }
  function finishTest() {
    if (state.test?.tick) clearInterval(state.test.tick);
    const { questions, answers } = state.test;
    const t = cur();
    const right = questions.filter((q, i) => answers[i] === q.a).length;
    const total = questions.length;
    const bal = Math.round((right / total) * 100);
    const baho = bal >= 90 ? "5 (a'lo)" : bal >= 75 ? "4 (yaxshi)" : bal >= 55 ? "3 (qoniqarli)" : "2 (kuchsiz)";
    const mezon = {};
    const topicsTouched = [...new Set(questions.map((q) => q.kod))];
    questions.forEach((q, i) => {
      const tq = topicByKod(q.kod);
      const m = tq?.urinish?.konikmalar?.[0]?.replace(/;$/, "") || q.kod;
      mezon[m] = mezon[m] || { r: 0, n: 0 };
      mezon[m].n++;
      if (answers[i] === q.a) mezon[m].r++;
    });
    const kod = t?.kod;
    if (kod) pOf(kod).test = { right, total, bal, baho, when: new Date().toISOString().slice(0, 10) };
    topicsTouched.forEach((k) => pOf(k).test = pOf(k).test && pOf(k).test.bal > bal ? pOf(k).test : { right, total, bal, baho, when: new Date().toISOString().slice(0, 10) });
    save();
    $("#content").innerHTML = `<div class="card">
      <h2>Test natijasi</h2>
      <div class="score-bar"><b style="font-size:26px;color:var(--amber)">${right}/${total}</b>
        <div class="bar"><i style="width:${bal}%"></i></div><span>${bal}% · ${baho}</span></div>
      <h3>Mezonlar bo'yicha</h3>
      <div class="chips">${Object.entries(mezon)
        .map(([m, v]) => `<span class="mezon-chip ${v.r === v.n ? "biox" : ""}">${esc(m)} — ${v.r}/${v.n}</span>`)
        .join("")}</div>
      <h3>Xatolar tahlili</h3>
      ${questions
        .map(
          (q, i) =>
            answers[i] !== q.a
              ? `<div class="q-item"><div class="q-text">${i + 1}. ${esc(q.q)} <span class="chip">${q.kod}</span></div>
                 <p class="small">Sizning javobingiz: ${esc(q.opts[answers[i]] ?? "—")} · To'g'ri: ${esc(q.opts[q.a])}</p>
                 <div class="why">${esc(q.why || "")}</div></div>`
              : ""
        )
        .join("") || `<p class="muted">Xato yo'q — a'lo natija ✓</p>`}
      <div class="chips" style="margin-top:12px">
        <button class="btn primary" data-act="test-again">↺ Qayta topshirish</button>
        <button class="btn" data-act="test-new">⚙ Sozlamaga qaytish</button>
        <button class="btn ghost" data-act="print">🖨 Xatolarni chop etish</button>
      </div>
    </div>`;
    state.test = null;
    renderSidebar();
  }

  /* ---- Boshqaruv paneli ---- */
  /* ---------------- progress nusxasi: eksport / import ---------------- */
  function exportProgress() {
    const payload = {
      app: "6-sinf Tabiiy fan",
      kalit: KEY,
      tuzilgan: new Date().toISOString(),
      mavzular: TOPICS.length,
      progress: state.progress,
    };
    const matn = JSON.stringify(payload, null, 1);
    const a = document.createElement("a");
    const yangi = typeof URL.createObjectURL === "function";
    try {
      a.href = yangi ? URL.createObjectURL(new Blob([matn], { type: "application/json" })) : "data:application/json;charset=utf-8," + encodeURIComponent(matn);
    } catch (e) {
      a.href = "data:application/json;charset=utf-8," + encodeURIComponent(matn);
    }
    a.download = "tabiiy6-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    try {
      a.click();
    } catch (e) {
      /* ba'zi muhitlarda (masalan, DOM sinovlarida) navigatsiya yo'q */
    }
    setTimeout(() => {
      if (yangi) URL.revokeObjectURL(a.href);
      a.remove();
    }, 2000);
    toast("Progress fayli yuklab olindi — boshqa kompyuterda «⬆ Progres tiklash» bilan kiriting.");
  }
  function importProgress(file) {
    const rd = new FileReader();
    rd.onload = () => {
      let obj;
      try {
        obj = JSON.parse(String(rd.result));
      } catch (e) {
        toast("✗ Fayl o'qilmadi: JSON emas");
        return;
      }
      const src = obj && obj.progress && typeof obj.progress === "object" ? obj.progress : obj;
      if (!src || typeof src !== "object" || Array.isArray(src)) {
        toast("✗ Fayl formati tanilmadi");
        return;
      }
      const codes = new Set(TOPICS.map((t) => t.kod));
      let tiklangan = 0, tashlangan = 0;
      for (const kod of Object.keys(src)) {
        if (!codes.has(kod)) {
          tashlangan++;
          continue;
        }
        const v = src[kod];
        if (!v || typeof v !== "object") {
          tashlangan++;
          continue;
        }
        state.progress[kod] = { ...state.progress[kod], ...v };
        tiklangan++;
      }
      save();
      renderSidebar();
      render();
      toast(`✓ ${tiklangan} mavzu progressi tiklandi` + (tashlangan ? ` · ${tashlangan} yozuv tashlandi` : ""));
    };
    rd.onerror = () => toast("✗ Fayl o'qilmadi");
    rd.readAsText(file, "utf-8");
  }
  function pickProgressFile() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f) importProgress(f);
      inp.remove();
    };
    inp.click();
  }

  function renderPanel(host) {
    const viewed = TOPICS.filter((t) => state.progress[t.kod]?.viewed).length;
    const tests = TOPICS.filter((t) => state.progress[t.kod]?.test);
    const avg = tests.length ? Math.round(tests.reduce((a, t) => a + state.progress[t.kod].test.bal, 0) / tests.length) : 0;
    const filled = TOPICS.filter((t) => (state.progress[t.kod]?.notebook?.natija || "").trim()).length;
    const stepsAll = TOPICS.reduce((a, t) => a + Object.keys(state.progress[t.kod]?.steps || {}).length, 0);
    const stepsMax = TOPICS.reduce((a, t) => a + (t.task?.steps?.length || 0), 0);
    host.innerHTML = `<div class="card" id="home-hero">
        <h2>6-sinf · Tabiiy fan platformasi</h2>
        <p>${TOPICS.length} ta mavzu · ${BOBS.length} ta bob · darslik va mashq daftari mundarijasi asosida. Nazariya, simulyator, o'yin, test va amaliy topshiriq bitta oynada.</p>
        <div class="chips" style="margin-top:10px">
          <button class="btn primary" data-act="slides">📽 Dars slaydlari</button>
          <button class="btn" data-act="print">🖨 Chop markazi</button>
          <button class="btn" data-act="export-progress">⬇ Progress nusxasi (.json)</button>
          <button class="btn" data-act="import-progress">⬆ Progres tiklash</button>
          <button class="btn ghost" data-act="reset">⚠ Progressni tozalash</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat"><b>${viewed}/${TOPICS.length}</b><span>o'qilgan mavzu</span></div>
        <div class="stat"><b>${avg}%</b><span>o'rtacha test natijasi</span></div>
        <div class="stat"><b>${filled}</b><span>to'ldirilgan amaliy ish</span></div>
        <div class="stat"><b>${stepsAll}/${stepsMax}</b><span>bajarilgan bosqich</span></div>
      </div>
      <div class="card">
        <h3>Boblar bo'yicha progress</h3>
        <div class="bob-progress">
          ${BOBS.map((b) => {
            const done = b.mavzular.filter((t) => state.progress[t.kod]?.viewed).length;
            const pct = Math.round((done / b.mavzular.length) * 100);
            return `<div class="bp-row"><span class="kod">${b.n}</span>
              <div><div class="bp-bar"><i style="width:${pct}%"></i></div></div>
              <span class="muted">${pct}%</span>
              <div style="grid-column:1/-1;margin-top:-6px" class="small">${b.mavzular
                .map(
                  (t) =>
                    `<button class="chip" data-topic="${t.kod}" style="cursor:pointer">${t.kod} ${esc(t.t)}</button>`
                )
                .join(" ")}</div></div>`;
          }).join("")}
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card"><h3>Amaliy ishlar ro'yxati</h3>
          <table class="data-table"><tbody>
          ${TOPICS.filter((t) => t.kitob?.amaliyIsh)
            .map(
              (t) =>
                `<tr><td>${t.kitob.amaliyIsh.kod}</td><td>${esc(t.kitob.amaliyIsh.nomi)}</td><td>${
                  (state.progress[t.kod]?.notebook?.natija || "").trim() ? "✓ bajarilgan" : "—"
                }</td></tr>`
            )
            .join("")}
          </tbody></table>
        </div>
        <div class="card"><h3>Daftardan uzundilar</h3>
          ${TOPICS.filter((t) => (state.progress[t.kod]?.notebook?.xulosa || "").trim()).length
            ? TOPICS.filter((t) => state.progress[t.kod]?.notebook?.xulosa)
                .map(
                  (t) =>
                    `<p class="small"><b>${t.kod}</b> ${esc((state.progress[t.kod].notebook.xulosa || "").slice(0, 160))}</p>`
                )
                .join("")
            : `<p class="muted small">Hozircha yozuv yo'q. Amaliy topshiriq bo'limida xulosa yozing — u shu yerda ko'rinadi.</p>`}
        </div>
      </div>`;
  }

  /* ---------------- slaydlar ---------------- */
  function buildSlides(topic) {
    const slides = [];
    slides.push({
      type: "cover",
      title: topic.kod + " · " + topic.t,
      sub: "6-sinf Tabiiy fan · " + topic.bobNomi,
      bet: topic.kitob?.oralig,
      bobText: bobMatn(topic),
      ai: topic.kitob?.amaliyIsh,
      savollar: topic.urinish?.savollar || [],
    });
    (topic.theory || "").split("\n\n").forEach((p, i) => slides.push({ type: "theory", n: i + 1, text: p, title: topic.t }));
    if (topic.formulas?.length) slides.push({ type: "formulas", items: topic.formulas, title: topic.t });
    if (topic.vocab?.length) slides.push({ type: "vocab", items: topic.vocab, title: topic.t });
    if (topic.task?.q)
      slides.push({ type: "task", q: topic.task.q, jihoz: topic.task.jihoz || [], xavfsizlik: topic.task.xavfsizlik || [], steps: topic.task.steps || [], title: topic.t });
    (topic.slideQuiz || []).forEach((q, i) =>
      slides.push({ type: "quiz", n: i + 1, q: q[0], opts: q[1], a: q[2], why: q[3], title: topic.t })
    );
    return slides;
  }
  function slideHTML(s, i, total) {
    let body = "";
    if (s.type === "cover")
      body = `<div class="sub">${esc(s.sub)}</div><h1 class="hd">${esc(s.title)}</h1>
        <p class="muted">Maqsad: mavzuni muhokama qilish, model bilan ishlash va natijani daftarga yozish.</p>
        <div class="kvs">
          <div class="fbox"><b>Darslik</b> ${esc(s.bobText || "")}${s.ai ? " · amaliy ish " + esc(s.ai.kod) : ""}</div>
          ${s.ai ? `<div class="fbox"><b>Amaliy ish:</b> ${esc(s.ai.nomi)}</div>` : ""}
          ${(s.savollar || []).length ? `<div class="fbox"><b>Savollar:</b> ${s.savollar.map(esc).join(" ")}</div>` : ""}
        </div>`;
    else if (s.type === "theory")
      body = `<div class="sub">${esc(s.title)} · nazariya ${s.n}</div><div class="body one"><p>${esc(s.text)}</p></div>`;
    else if (s.type === "formulas")
      body = `<div class="sub">Asosiy qoidalar</div><div class="kvs">${(s.items || []).map((f) => `<div class="fbox">${esc(f)}</div>`).join("")}</div>`;
    else if (s.type === "vocab")
      body = `<div class="sub">Atamalar</div><div class="kvs">${(s.items || []).map((v) => `<div class="fbox"><b>${esc(v.w)}</b><br>${esc(v.m)}</div>`).join("")}</div>`;
    else if (s.type === "task")
      body = `<div class="sub">Amaliy topshiriq</div><p><b>${esc(s.q)}</b></p>
        <div class="body"><ol>${(s.steps || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
        <div><div class="fbox"><b>Jihoz:</b> ${(s.jihoz || []).map(esc).join(", ")}</div><br>
        <div class="fbox" style="border-color:#c0392b;background:#fff2f1"><b>Xavfsizlik:</b> ${(s.xavfsizlik || []).map(esc).join(" · ")}</div></div></div>`;
    else if (s.type === "quiz")
      body = `<div class="sub">Savol ${s.n}</div><div class="qbox"><b>${esc(s.q)}</b>
        <ol style="list-style:upper-alpha">${(s.opts || []).map((o) => `<li>${esc(o)}</li>`).join("")}</ol></div>
        <p class="muted small">Javob: ${esc((s.opts || [])[s.a] || "")} — ${esc(s.why || "")}</p>`;
    return `<div class="slide-sheet" data-slide="${i}">
      ${body}
      <div class="foot"><span>${i + 1} / ${total}</span><span>6-sinf · Tabiiy fan</span></div>
    </div>`;
  }
  function openSlides(list, title) {
    state.slides = { list: list || buildSlides(cur()), i: 0, title: title || (cur() ? cur().kod + " " + cur().t : "Barcha slaydlar") };
    $("#slides").classList.add("on");
    document.body.classList.add("no-scroll");
    drawSlides();
  }
  function drawSlides() {
    const { list, i, title } = state.slides;
    $("#slides-title").textContent = title;
    $("#slides-stage").innerHTML = slideHTML(list[i], i, list.length);
    $("#slides-pos").textContent = `${i + 1} / ${list.length}`;
    $$("#slides [data-sl]").forEach((b) => (b.disabled = false));
  }
  function closeSlides() {
    $("#slides").classList.remove("on");
    document.body.classList.remove("no-scroll");
    state.slides = null;
  }

  /* ---------------- chop markazi ---------------- */
  function printCards() {
    const t = cur();
    const scope = state.print?.scope || "mavzu";
    const topics = scope === "bob" ? TOPICS.filter((x) => x.d === (t?.d || 1)) : scope === "barcha" ? TOPICS : t ? [t] : [];
    const cards = [];
    topics.forEach((tp) => buildSlides(tp).forEach((s, i) => cards.push({ tp, s, i })));
    (t ? [t] : []).forEach((tp) => cards.push({ tp, s: { type: "task", q: tp.task?.q || "", jihoz: tp.task?.jihoz || [], xavfsizlik: tp.task?.xavfsizlik || [], steps: tp.task?.steps || [], title: tp.t }, i: 99 }));
    return cards;
  }
  function openPrint() {
    state.print = state.print || { scope: "mavzu", per: 4, sel: {} };
    const cards = printCards();
    const sel = state.print.sel;
    $("#modal-overlay").innerHTML = `<div id="modal">
      <h2 style="display:flex;align-items:center">🖨 Chop markazi <button class="btn small" style="margin-left:auto" data-act="close-modal">✕ Yopish</button></h2>
      <div class="grid cols-3" style="margin-bottom:10px">
        <div class="field"><label>Qamrov</label><div class="seg" data-pseg="scope">
          ${[["mavzu", "Joriy mavzu"], ["bob", "Butun bob"], ["barcha", "Barcha boblar"]].map(
            ([v, l]) => `<button data-v="${v}" class="${state.print.scope === v ? "on" : ""}">${l}</button>`
          ).join("")}</div></div>
        <div class="field"><label>Bir varaqda</label><div class="seg" data-pseg="per">
          ${[1, 2, 4].map((n) => `<button data-v="${n}" class="${state.print.per === n ? "on" : ""}">${n} slayd</button>`).join("")}</div></div>
        <div class="field"><label>Rejim</label><div class="seg" data-pseg="quiz">
          ${[["javob", "Javoblar bilan"], ["bo'sh", "Bo'sh joy bilan"]].map(
            ([v, l]) => `<button data-v="${v}" class="${(state.print.quiz || "javob") === v ? "on" : ""}">${l}</button>`
          ).join("")}</div></div>
      </div>
      <div class="print-grid">${cards
        .map(
          (c, idx) => `<label class="print-tile ${(idx in sel ? sel[idx] : idx < 8) ? "sel" : ""}">
            <input type="checkbox" data-pick="${idx}" ${idx in sel ? (sel[idx] ? "checked" : "") : idx < 8 ? "checked" : ""}>
            <span class="prev">${miniPrev(c.s)}</span>
            <span><span class="lbl">${c.tp.kod}${c.i === 99 ? " · vazifa" : " · slayd " + (c.i + 1)}</span>${esc(cardText(c.s)).slice(0, 90)}</span>
          </label>`
        )
        .join("")}</div>
      <div class="chips" style="margin-top:12px">
        <button class="btn primary" data-act="do-print">🖨 Varaqqa tushirish</button>
        <button class="btn" data-act="print-all">✓ Hammasini belgilash</button>
        <button class="btn ghost" data-act="print-none">✕ Bekor qilish</button>
      </div>
    </div>`;
    $("#modal-overlay").classList.add("on");
    document.body.classList.add("no-scroll");
  }
  function cardText(s) {
    if (s.type === "cover") return s.title;
    if (s.type === "theory") return s.text;
    if (s.type === "formulas") return s.items.join(" · ");
    if (s.type === "vocab") return s.items.map((v) => v.w).join(", ");
    if (s.type === "task") return "Vazifa: " + s.q;
    return s.q || "";
  }
  function miniPrev(s) {
    return esc(cardText(s).slice(0, 52));
  }
  function printSheet(s, tp, opts) {
    const withAns = (opts.quiz || "javob") === "javob";
    const head = `<div class="phd"><b>${esc(tp.kod)} ${esc(tp.t)}</b><span>${esc(tp.bobNomi)} · darslik ${esc(
      betMatn(tp.kitob?.oralig)
    )}${tp.kitob?.amaliyIsh?.bet ? " · mashq daftari " + esc(tp.kitob.amaliyIsh.bet) + "-bet" : ""}</span></div>`;
    let body = "";
    if (s.type === "cover")
      body = `<h4>${esc(s.title)}</h4><p class="lbl">${esc(s.sub)} · darslik ${esc(s.bobText || "")}</p>
        ${(tp.urinish?.savollar || []).map((q) => `<p>• ${esc(q)}</p>`).join("")}
        ${tp.kitob?.amaliyIsh ? `<p class="lbl">Amaliy ish ${esc(tp.kitob.amaliyIsh.kod)}${tp.kitob.amaliyIsh.nomi ? " — " + esc(tp.kitob.amaliyIsh.nomi) : ""}</p>` : ""}`;
    else if (s.type === "theory") body = `<p>${esc(s.text)}</p>`;
    else if (s.type === "formulas") body = `<ul>${s.items.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`;
    else if (s.type === "vocab")
      body = `<table><tbody>${s.items.map((v) => `<tr><th>${esc(v.w)}</th><td>${esc(v.m)}</td></tr>`).join("")}</tbody></table>`;
    else if (s.type === "task")
      body = `<h4>Amaliy topshiriq</h4><p>${esc(s.q)}</p>
        ${s.steps?.length ? `<ol>${s.steps.map((x) => `<li>☐ ${esc(x)}</li>`).join("")}</ol>` : ""}
        ${s.jihoz?.length ? `<p class="lbl">Jihoz: ${s.jihoz.map(esc).join(", ")}</p>` : ""}
        ${s.xavfsizlik?.length ? `<p class="lbl">Xavfsizlik: ${s.xavfsizlik.map(esc).join(" · ")}</p>` : ""}
        <p class="lbl">Natija:</p><div class="line"></div><div class="line"></div><div class="line"></div>
        <p class="lbl">Xulosa:</p><div class="line"></div><div class="line"></div>`;
    else if (s.type === "quiz")
      body = `<p><b>${esc(s.q)}</b></p><ol style="list-style:upper-alpha">${s.opts
        .map((o, i) => `<li ${withAns && i === s.a ? `style="font-weight:700"` : ""}>${esc(o)}</li>`)
        .join("")}</ol>${withAns ? `<p class="answer-key">Javob: ${"ABCD"[s.a]} — ${esc(s.why || "")}</p>` : `<div class="line"></div>`}`;
    return `<div class="psheet-card">${head}${body}</div>`;
  }
  function doPrint() {
    const cards = printCards();
    const picked = cards
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => (i in state.print.sel ? state.print.sel[i] : i < 8));
    const per = state.print.per || 4;
    const area = $("#print-area");
    let html = "";
    for (let i = 0; i < picked.length; i += per) {
      const chunk = picked.slice(i, i + per);
      html += `<div class="print-sheet"><div class="pgrid n${per}">${chunk
        .map(({ c }) => printSheet(c.s, c.tp, state.print))
        .join("")}</div></div>`;
    }
    area.innerHTML = html || `<div class="print-sheet"><p>Hech narsa tanlanmagan.</p></div>`;
    TOPICS.forEach((t) => {
      const p = pOf(t.kod);
      p.slidesPrinted = true;
    });
    save();
    window.print();
  }

  /* ---------------- hodisalar ---------------- */
  function bind() {
    $("#tabs").addEventListener("click", (e) => {
      const b = e.target.closest(".tab-btn[data-tab]");
      if (!b) return;
      state.tab = b.dataset.tab;
      state.panel = false;
      render();
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-topic]");
      if (!b) return;
      state.topic = b.dataset.topic;
      state.panel = false;
      state.test = null;
      document.body.classList.remove("sb-open");
      render();
      window.scrollTo({ top: 0 });
    });
    $("#search").addEventListener("input", renderSidebar);
    document.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go) {
        state.tab = go.dataset.go;
        render();
        return;
      }
      const tnav = e.target.closest("#t-body [data-prev], #t-body [data-next], #t-body [data-finish]");
      if (tnav && state.test) {
        if (tnav.hasAttribute("data-finish")) finishTest();
        else {
          state.test.i = clamp(state.test.i + (tnav.hasAttribute("data-next") ? 1 : -1), 0, state.test.questions.length - 1);
          renderTest();
        }
        return;
      }
      const jump = e.target.closest("[data-jump]");
      if (jump && state.test) {
        state.test.i = +jump.dataset.jump;
        renderTest();
        return;
      }
      const act = e.target.closest("[data-act]");
      if (act) {
        const a = act.dataset.act;
        const t = cur();
        if (a === "slides") openSlides(t ? buildSlides(t) : TOPICS.flatMap((x) => buildSlides(x)));
        else if (a === "print") openPrint();
        else if (a === "do-print") doPrint();
        else if (a === "export-progress") exportProgress();
        else if (a === "import-progress") pickProgressFile();
        else if (a === "print-all") {
          printCards().forEach((c, i) => (state.print.sel[i] = true));
          openPrint();
        } else if (a === "print-none") {
          printCards().forEach((c, i) => (state.print.sel[i] = false));
          openPrint();
        } else if (a === "close-modal") {
          $("#modal-overlay").classList.remove("on");
          document.body.classList.remove("no-scroll");
        } else if (a === "test-start") {
          startTest();
        } else if (a === "test-exit") {
          if (state.test?.tick) clearInterval(state.test.tick);
          state.test = null;
          render();
        } else if (a === "test-again") {
          startTest();
        } else if (a === "test-new") {
          render();
        } else if (a === "game-reset") {
          render();
        } else if (a === "save-task") {
          save();
          toast("Daftarga saqlandi ✓");
        } else if (a === "clear-task") {
          state.progress[t.kod] = { viewed: true, steps: {}, notebook: {}, answers: {}, test: null };
          save();
          render();
          toast("Tozalandi");
        } else if (a === "reset") {
          if (confirm("Barcha progress va daftarchalar o'chirilsinmi?")) {
            localStorage.removeItem(KEY);
            state.progress = {};
            render();
          }
        } else if (a === "add-row") {
          const p = pOf(t.kod);
          p.notebook.rows = (p.notebook.rows || []).concat({ a: "", b: "", c: "" });
          render();
        } else if (a === "panel") {
          state.panel = !state.panel;
          render();
        } else if (a === "burger") {
          document.body.classList.toggle("sb-open");
        }
      }

      const segBtn = e.target.closest("[data-seg] [data-v]");
      if (segBtn) {
        const seg = segBtn.closest("[data-seg]");
        const v = +segBtn.dataset.v;
        const kind = seg.dataset.seg;
        const cfg = state.test?.cfg || { bob: [cur()?.d || 1], n: 10, mode: "aralash", timer: 0 };
        if (kind === "bob") cfg.bob = cfg.bob.includes(v) ? cfg.bob.filter((x) => x !== v) : cfg.bob.concat(v);
        else cfg[kind] = v;
        state.test = { cfg };
        renderTestTab($("#content"), cur());
      }
      const pBtn = e.target.closest("[data-pseg] [data-v]");
      if (pBtn) {
        const kind = pBtn.closest("[data-pseg]").dataset.pseg;
        state.print[kind] = kind === "scope" ? pBtn.dataset.v : +pBtn.dataset.v;
        openPrint();
      }
      const pick = e.target.closest("[data-pick]");
      if (pick) {
        state.print.sel[pick.dataset.pick] = pick.checked;
        pick.closest(".print-tile").classList.toggle("sel", pick.checked);
      }
    });
    document.addEventListener("change", (e) => {
      const step = e.target.closest("[data-step]");
      if (step) {
        const t = cur();
        if (!t) return;
        const p = pOf(t.kod);
        p.steps[step.dataset.step] = step.checked;
        step.closest(".check-row")?.classList.toggle("done", step.checked);
        save();
      }
    });
    document.addEventListener("input", (e) => {
      const t = cur();
      if (!t) return;
      const nb = e.target.closest("[data-nb]");
      if (nb) {
        pOf(t.kod).notebook[nb.dataset.nb] = e.target.value;
        clearTimeout(save._deb);
        save._deb = setTimeout(save, 400);
      }
      const row = e.target.closest("[data-row]");
      if (row) {
        const p = pOf(t.kod);
        const [i, k] = row.dataset.row.split(".");
        p.notebook.rows = p.notebook.rows || [{ a: "", b: "", c: "" }];
        while (p.notebook.rows.length <= +i) p.notebook.rows.push({ a: "", b: "", c: "" });
        p.notebook.rows[+i][k] = row.value;
        clearTimeout(save._deb);
        save._deb = setTimeout(save, 400);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (!state.slides) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        state.slides.i = clamp(state.slides.i + 1, 0, state.slides.list.length - 1);
        drawSlides();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        state.slides.i = clamp(state.slides.i - 1, 0, state.slides.list.length - 1);
        drawSlides();
      } else if (e.key === "Escape") closeSlides();
    });
    $("#slides").addEventListener("click", (e) => {
      const b = e.target.closest("[data-sl]");
      if (!b || !state.slides) return;
      const k = b.dataset.sl;
      if (k === "next") { state.slides.i = clamp(state.slides.i + 1, 0, state.slides.list.length - 1); drawSlides(); }
      else if (k === "prev") { state.slides.i = clamp(state.slides.i - 1, 0, state.slides.list.length - 1); drawSlides(); }
      else if (k === "close") closeSlides();
      else if (k === "print-now") {
        state.print = state.print || { scope: "mavzu", per: 1, sel: {} };
        const cards = printCards();
        state.print.per = 1;
        cards.forEach((c, i) => (state.print.sel[i] = i === state.slides.i));
        doPrint();
      }
    });
    $("#modal-overlay").addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") {
        e.target.classList.remove("on");
        document.body.classList.remove("no-scroll");
      }
    });
    window.addEventListener("beforeprint", () => {
      // chop paytida tanlanma bo'lmasa — joriy mavzu slaydlarini chiqaramiz
      if (!$("#print-area").innerHTML.trim()) {
        state.print = state.print || { scope: "mavzu", per: 4, sel: {} };
        doPrint();
      }
    });
    window.addEventListener("afterprint", () => {
      $("#print-area").innerHTML = "";
    });
  }

  if (typeof document !== "undefined" && document.getElementById("topics-data")) {
    document.addEventListener("DOMContentLoaded", () => {
      bind();
      render();
    });
  }

  /* test uchun ichki funksiyalar */
  window.__TF = { TOPICS, BOBS, buildTest, buildSlides, slideHTML, printSheet, mezonList, DATA, state, exportProgress, importProgress };
})();

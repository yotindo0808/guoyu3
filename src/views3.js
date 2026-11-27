/* ══════════ 四年級：標準層／基礎層兩條路徑 ══════════
   投影上課：同一套卡片，提問分基礎（👆）與標準（💬）兩種圖示。
   學生練習：老師在後台設定層級，學生畫面不顯示層級名稱。 */

/* ── 層級與報讀 ── */
function tier() {
  if (FORCE_TIER) return FORCE_TIER;
  if (proj()) return "proj";
  return "std";   /* 三年級不分層：同一條練習路線，提示多寡由「提示階梯」調整 */
}
/* 報讀等級：all 全部報讀；q 題目報讀、必學字不報讀；none 不報讀（老師在後台逐步關閉） */
function ttsLevel() {
  if (proj() || !LOCK) return load("demotts") || "all";
  if (ttsLocked()) return "none";
  const s = String(load("who") || "").trim(); const t = CFG.ttsLv || {};
  return (WHOK && t[WHOK]) || (s && t[s]) || t._default || "all";
}
const MUST = () => new Set((L && L.must) || []);
/* 資料字串轉 HTML：【字】必學字標橘色 */
function mk(t) { return String(t).replace(/【([^】]+)】/g, '<span class="must">$1</span>'); }
const unmark = t => String(t).replace(/[【】]/g, "");
/* 報讀文字：必學字不報讀時，把橘色字換成停頓，讓學生自己讀 */
function sayText(t) {
  let s = plainText(String(t).replace(/<span class="must">([^<]+)<\/span>/g, "【$1】"));
  if (ttsLevel() === "q") s = s.replace(/【[^】]+】/g, "，，");
  return s.replace(/[【】]/g, "");
}
/* 填空字串 "…{答案}…" → fillLine 用的 parts */
function bparts(t) { const out = []; String(t).split(/(\{[^}]*\})/).forEach(p => { if (!p) return; const m = p.match(/^\{([^}|]*)(?:\|([^}]*))?\}$/); if (m) out.push({ ans: m[1], h: m[2] || m[1] }); else out.push(mk(p)); }); return out; }
const blankless = t => String(t).replace(/\{([^}|]*)(?:\|[^}]*)?\}/g, "$1");
const IMG = n => `${LBASE}${cur.lesson}/img/${n}.svg`;
function pic(n, alt) { return `<img class="pic" src="${IMG(n)}" alt="${esc(alt || "")}" loading="lazy" draggable="false">`; }
/* 不顯示注音的字（題目在考讀音或寫字時用） */
const nz = t => `<span class="nozy">${t}</span>`;
const ICON_B = '<span class="qi qb" title="基礎提問" aria-label="基礎提問">👆</span>', ICON_S = '<span class="qi qs2" title="標準提問" aria-label="標準提問">💬</span>';

/* ── 自讀成功次數（學生按「我讀完了」）── */
function selfRead(label) { const q = qid(`自讀：${label}`); const r = REC[recKey()] || (REC[recKey()] = {}); const e = r[q.id] || (r[q.id] = { label: q.label, sec: curSec(), selfread: 0 }); return () => { e.selfread++; e.text = `自己讀完 ${e.selfread} 次`; }; }

/* ── 我會的字：看詞寫字累積答對三次，存在這台裝置（依學生名字分開）── */
const KNOWN_N = 3;
function knownKey() { return "known-" + (String(load("who") || "").trim() || "_"); }
function knownGet() { try { return JSON.parse(load(knownKey()) || "{}"); } catch (e) { return {}; } }
function knownHit(ch, word, wh) {
  if (proj()) return null; const k = knownGet(); const o = k[ch] || (k[ch] = { n: 0, w: word, wh, l: cur.lesson });
  o.n++; o.w = word; o.wh = wh; store(knownKey(), JSON.stringify(k)); return o;
}

/* ── 共用題型 ── */
/* 選擇題：選項可配圖；o.auto 題目出現時自動報讀；o.self 自讀挑戰（先按「我讀完了」才能聽） */
function picQ(stem, opts, ans, label, o = {}) {
  const id = qid(label); const q = el("div", { class: "q qs picq" + (o.self ? " selfq" : "") });
  const st = el("div", { class: "stem" }, mk(stem)); const LET = "ABC"; const btns = []; let wrong = 0;
  const say = sayBtn(() => o.say ? o.say : sayText(mk(stem)), "唸題目"); const head = el("div", { class: "stemrow" }); head.append(say, st);
  if (o.self) {
    say.hidden = true; const done = selfRead(label);
    const b = el("button", { type: "button", class: "btn solid readdone only-stu" }, "我讀完了"); b.onclick = () => { done(); b.remove(); say.hidden = false; say.click(); };
    head.append(b);
  }
  const box = el("div", { class: "popts" + (opts.some(x => x[1]) ? " withpic" : "") });
  const order = o.keep ? opts.map((x, k) => k) : shuffle(opts.map((x, k) => k));
  order.forEach((k, i) => {
    const [t, p] = opts[k];
    const b = el("button", { type: "button", class: "popt" }, `<span class="olab">${LET[i]}</span>${p ? pic(p, unmark(t)) : ""}<span class="otx">${mk(t)}</span>`); btns.push([b, k]);
    const cell = el("div", { class: "pcell" }); cell.append(b, sayBtn(() => `${LET[i]}，${sayText(mk(t))}`, `唸選項 ${LET[i]}`)); box.append(cell);
    b.onclick = () => {
      if (proj()) { btns.forEach(([x]) => x.classList.remove("sel")); b.classList.add("sel"); return; }
      if (q.classList.contains("answered")) return;
      logAns(id, k === ans, `${LET[i]} ${unmark(t)}`);
      if (k === ans) { b.classList.add("ok"); q.classList.add("answered"); }
      else { b.classList.add("no", "shake"); setTimeout(() => b.classList.remove("shake"), 400); if (++wrong >= 2) { const r = btns.find(([x, kk]) => kk !== ans && !x.classList.contains("no")); if (r) r[0].classList.add("elim"); } }
    };
  });
  if (o.lead || o.after) { const lc = el("div", { class: "qlead" }); [].concat(o.lead || []).forEach(n => lc.append(n)); lc.append(head); [].concat(o.after || []).forEach(n => lc.append(n)); q.append(lc, box); } else q.append(head, box);
  q.reveal = () => { const r = btns.find(([, k]) => k === ans); r[0].classList.add("ok"); q.classList.add("revealed"); };
  q.autoSay = () => { if (o.auto && !proj() && ttsLevel() !== "none" && !o.self) setTimeout(() => { if (q.isConnected) say.click(); }, 350); };
  return q;
}
function picSlide(stem, opts, ans, label, o) { const q = picQ(stem, opts, ans, label, o); const s = slide("", q); s.reveal = q.reveal; s.onshow = q.autoSay; return s; }
/* 聽一聽再選：大喇叭＋三個字／詞卡 */
function listenQ(sayWhat, opts, ans, label, o = {}) {
  const id = qid(label); const q = el("div", { class: "q lq" }); let wrong = 0;
  const big = sayBtn(() => sayWhat, "再聽一次"); big.classList.add("bigsay");
  const row = el("div", { class: "lqhead" }); row.append(big, el("span", { class: "hint" }, o.hint || "聽一聽，按出正確的答案。"));
  const box = el("div", { class: "lopts" }); const btns = [];
  shuffle(opts.map((x, k) => k)).forEach(k => {
    const b = el("button", { type: "button", class: "lopt" + (o.cls ? " " + o.cls : "") }, o.html ? o.html(opts[k]) : nz(opts[k])); btns.push([b, k]); box.append(b);
    b.onclick = () => { if (proj()) { btns.forEach(([x]) => x.classList.remove("sel")); b.classList.add("sel"); return; } if (q.classList.contains("answered")) return; logAns(id, k === ans, typeof opts[k] === "string" ? opts[k] : opts[k][0]);
      if (k === ans) { b.classList.add("ok"); q.classList.add("answered"); } else { b.classList.add("no", "shake"); setTimeout(() => b.classList.remove("shake"), 400); if (++wrong >= 2) { const r = btns.find(([x, kk]) => kk !== ans && !x.classList.contains("no")); if (r) r[0].classList.add("elim"); } } };
  });
  q.append(row, box); q.reveal = () => btns.find(([, k]) => k === ans)[0].classList.add("ok");
  q.autoSay = () => { if (!proj() && ttsLevel() !== "none") setTimeout(() => { if (q.isConnected) big.click(); }, 350); };
  return q;
}
function listenSlide(sayWhat, opts, ans, label, o) { const q = listenQ(sayWhat, opts, ans, label, o); const st = o && o.stem ? (o.stem instanceof Node ? o.stem : el("div", { class: "stem", style: "text-align:center" }, o.stem)) : null; const s = slide("", st, q); s.reveal = q.reveal; s.onshow = q.autoSay; return s; }

/* 填空＋詞庫（一頁一句） */
function bankSlides(items, bank, label, o = {}) {
  const lk = {}; bank.forEach(b => lk[b] = b);
  return items.map((t, i) => {
    const ctx = {}; const line = fillLine(bparts(t), [], ctx, `${label}${i + 1}`); const stem = el("div", { class: "big-line" }); stem.append(line);
    const chips = bankBox(bank.map(b => ({ t: b, h: b })), ctx);
    const s = slide("", o.kick ? kick(o.kick[i]) : null, sayRow(stem), stem, el("div", { style: "height:.8em" }), chips);
    s.onshow = () => { ctx.slideBlanks = line.blanks; const b = line.blanks.find(x => !x.classList.contains("ok")); if (b) b.click(); };
    s.reveal = () => revealBlanks(line.blanks, lk); return s;
  });
}
/* 開放題：句框＋自我檢核（自閉症學生：指示語字面明確） */
function frameSlide(q, frame, ref, label, checks) {
  const stem = el("div", { class: "stem" }, mk(q));
  const fr = el("div", { class: "frame" }, `<span class="flab">句框</span>${esc(frame)}`);
  const w = writeBox(label); const ta = w.querySelector("textarea"); ta.placeholder = frame;
  const ck = el("div", { class: "selfck only-stu" }); ck.append(el("div", { class: "hint" }, "寫完檢查："), checklist(checks || ["有用到句框", "句子有寫完", "有標點符號"]));
  const s = slide("", sayRow(stem), stem, fr, w, ck, refBox(esc(ref))); return s;
}

/* ══════════ 提示階梯（三年級鷹架）══════════
   同一題有四階：第 4 階是目標（自己說／寫），往下每一階多一層提示。
   老師在後台設定起始階層；學生按「給我提示」往下一階，做完可以按「挑戰下一階」往上。
   用了提示，這一題就不算「第一次就答對」（集花少一朵）。 */
const LADDER_NAMES = { jx: ["詞卡排句", "句框＋詞庫", "句框", "自己造句"], rq: ["選答案", "句框＋詞庫", "句框", "自己回答"] };
function ladderStart(type) {
  let v;
  if (!LOCK) v = load("demoladder");
  else { const s = String(load("who") || "").trim(); const t = CFG.ladder || {}; const o = (WHOK && t[WHOK]) || (s && t[s]) || t._default || {}; v = o[type]; }
  v = parseInt(v, 10); return v >= 1 && v <= 4 ? v : 2;
}
/* 第 1 階（句子）：詞卡排句，做完回呼 */
function ordBox(cards, label, oo = {}) {
  const q = qid(label); const box = el("div", { class: "ord" }); const line = el("div", { class: "ordline big-line" }); const pool = el("div", { class: "bank" });
  let seq = []; const res = el("div", { class: "pres", "aria-live": "polite" });
  const paint = () => { line.innerHTML = seq.length ? seq.map(k => `<span class="wchip">${cards[k]}</span>`).join("") : `<span class="hint">${oo.ph || "按下面的詞卡排成句子"}</span>`; };
  const btns = shuffle(cards.map((c, k) => k)).map(k => { const b = el("button", { type: "button", class: "chip" }, cards[k]); b.onclick = () => { if (box.classList.contains("answered")) return; seq.push(k); b.disabled = true; paint();
      if (seq.length === cards.length) { const ok = seq.every((x, i) => cards[x] === cards[i]); logAns(q, ok, seq.map(x => cards[x]).join(""));
        if (ok) { box.classList.add("answered"); res.innerHTML = `<span class="okmsg">√ 排對了！${oo.ph ? "" : "唸唸看。"}</span>`; if (!oo.ph) res.append(sayBtn(cards.join(""), "唸句子")); }
        else { res.innerHTML = '<span class="nomsg">順序不太對，按「重排」再試一次。</span>'; } } }; return b; });
  btns.forEach(b => pool.append(b));
  const back = el("button", { type: "button", class: "btn" }, "退一張"); back.onclick = () => { if (box.classList.contains("answered") || !seq.length) return; const k = seq.pop(); btns.find(b => b.textContent === cards[k] && b.disabled).disabled = false; res.innerHTML = ""; paint(); };
  const redo = el("button", { type: "button", class: "btn" }, "重排"); redo.onclick = () => { if (box.classList.contains("answered")) return; seq = []; btns.forEach(b => b.disabled = false); res.innerHTML = ""; paint(); };
  paint(); box.append(el("div", { class: "inst" }, oo.inst || "照順序按詞卡，排成一句話。"), line, pool, tools(back, redo), res);
  box.isDone = () => box.classList.contains("answered"); return box;
}
/* 第 2 階：句框＋詞庫 */
function fillBox(fill, bank, label) {
  const ctx = {}; const line = fillLine(bparts(fill), [], ctx, label); const stem = el("div", { class: "big-line" }); stem.append(line);
  const box = el("div", { class: "lfill" }); box.append(el("div", { class: "inst" }, "按空格，再按下面的詞，把句子填完整。"), stem, bankBox(shuffle(bank).map(b => ({ t: b, h: b })), ctx));
  box.onshow = () => { ctx.slideBlanks = line.blanks; const b = line.blanks.find(x => !x.classList.contains("ok")); if (b) b.click(); };
  box.isDone = () => line.blanks.every(b => b.classList.contains("ok")); box.reveal = () => revealBlanks(line.blanks); return box;
}
/* 第 3、4 階：用說的／寫的／打字作答，老師再確認 */
function openBox(inst, frame, kws, label) {
  const p = produce({ label, check: t => { const miss = (kws || []).filter(k => !t.includes(k)); return miss.length ? { st: "no", msg: `要用到「${miss.join("」「")}」` } : { st: "check", msg: "老師會再看看" }; } });
  const box = el("div", { class: "lopen" }); box.append(el("div", { class: "inst" }, inst)); if (frame) box.append(el("div", { class: "frame big-line" }, `<span class="flab">句框</span>${esc(frame)}`)); box.append(p);
  box.isDone = () => p.classList.contains("answered"); return box;
}
/* 階梯外框：makers[0..3] 對應第 1～4 階 */
function ladderSlide(o) {
  const names = LADDER_NAMES[o.type]; const q = qid(`${o.label}（提示階梯）`); let lv = ladderStart(o.type), used = false, doneAt = 0;
  const steps = el("div", { class: "lsteps", "aria-label": "提示階層" }); const area = el("div", { class: "larea" }); const res = el("div", { class: "lres", "aria-live": "polite" });
  const down = el("button", { type: "button", class: "btn lhint" }, "💡 給我提示"); const up = el("button", { type: "button", class: "btn lup" }, "挑戰下一階 ⬆");
  let cur = null; const made = {};
  const paint = () => { steps.innerHTML = ""; names.forEach((n, k) => steps.append(el("span", { class: "lstep" + (k + 1 === lv ? " on" : "") + (k + 1 < lv ? " below" : "") }, `${k + 1} ${n}`))); down.disabled = lv <= 1; up.hidden = !(cur && cur.isDone() && lv < 4); };
  const show = () => { area.innerHTML = ""; res.innerHTML = ""; cur = made[lv] || (made[lv] = o.makers[lv - 1]()); area.append(cur); if (cur.onshow) requestAnimationFrame(cur.onshow); paint(); refit(); };
  /* 換階層後內容高度不同：重新計算字級，放得下就放大 */
  const refit = () => requestAnimationFrame(() => { if (!s || !s.isConnected) return; const v = fitValue(s); if (v) setFit(s, v); });
  down.onclick = () => { if (lv <= 1) return; if (!used) { used = true; logAns(q, false, `用了提示（從第 ${lv} 階往下）`); } lv--; show(); };
  up.onclick = () => { lv++; show(); };
  area.addEventListener("click", () => setTimeout(check, 50)); area.addEventListener("keyup", () => setTimeout(check, 50));
  function check() { if (!cur || !cur.isDone()) return; if (lv > doneAt) { doneAt = lv; logText(qid(`${o.label}（完成的階層）`), `第 ${lv} 階：${names[lv - 1]}`); if (!used && !REC[recKey()]?.[q]) logAns(q, true, `第 ${lv} 階完成，沒有用提示`); }
    res.innerHTML = `<span class="okmsg">√ 完成第 ${lv} 階「${names[lv - 1]}」</span>`; paint(); }
  const head = el("div", { class: "lhead" }); head.append(steps, el("span", { class: "lbtns" }, ""), ""); head.querySelector(".lbtns").append(down, up);
  /* 有圖時橫式左右兩欄（左圖、右作答），避免上下堆疊把字擠小；每張自己算字級 */
  const s = o.stem ? slide("lad ladsplit", o.kick ? kick(o.kick) : null, splitBox([].concat(o.stem), [head, area, res])) : slide("lad", o.kick ? kick(o.kick) : null, head, area, res);
  s.dataset.fg = "lad" + Math.random();
  s.onshow = () => { if (!cur) show(); else { if (cur.onshow) cur.onshow(); refit(); } };
  s.reveal = () => { if (o.ref) res.innerHTML = `<div class="refcard">參考答案：${esc(o.ref)}</div>`; };
  return s;
}
/* 是非／對錯判斷 */
function ynSlide(stemHtml, ans, label, labels = ["用得對", "用得不對"]) {
  const r = pickRow(labels, ans ? 0 : 1, label, "yn"); const stem = el("div", { class: "stem big-line" }, stemHtml);
  const s = slide("", sayRow(stem), stem, el("div", { class: "ynrow" }, ""), r); s.querySelector(".ynrow").append(r); s.reveal = r.reveal; return s;
}

/* ── 寫字格（描寫、看詞寫字共用）：逐步提示＋手寫辨識，寫完讓學生點選自己寫的字 ── */
function inkPad(o) {
  const box = el("div", { class: "ipad" }); const size = Math.max(170, Math.min(260, Math.floor(innerHeight * .32)));
  const cv = el("canvas", { width: String(size * 2), height: String(size * 2), "aria-label": "寫字格，用手指或觸控筆寫" }); cv.style.width = cv.style.height = size + "px"; cv.style.touchAction = "none";
  const g = cv.getContext("2d"); g.scale(2, 2); let ink = [], stroke = null, t0 = 0, hint = 0;
  const FONT = `${size * .8}px "L${cur.lesson}", "IansuiUI", serif`;
  const base = () => {
    g.clearRect(0, 0, size, size); g.fillStyle = "#fff"; g.fillRect(0, 0, size, size);
    g.strokeStyle = "#e3b9b2"; g.lineWidth = 1; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(size / 2, 0); g.lineTo(size / 2, size); g.moveTo(0, size / 2); g.lineTo(size, size / 2); g.moveTo(0, 0); g.lineTo(size, size); g.moveTo(size, 0); g.lineTo(0, size); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#c97a6d"; g.lineWidth = 2; g.strokeRect(1, 1, size - 2, size - 2);
    if (hint && o.ch) {
      g.save(); g.beginPath();
      if (hint === 1) { if (o.st === "上下" || o.st === "上中下") g.rect(0, 0, size, size * .5); else g.rect(0, 0, size * .5, size); } else g.rect(0, 0, size, size);
      g.clip(); g.fillStyle = "#cfd8d6"; g.font = FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(o.ch, size / 2, size / 2 + size * .03); g.restore();
    }
    ink.forEach(s => { g.strokeStyle = "#1f6560"; g.lineWidth = Math.max(6, size / 30); g.lineCap = g.lineJoin = "round"; g.beginPath(); g.moveTo(s[0][0], s[1][0]); for (let k = 1; k < s[0].length; k++) g.lineTo(s[0][k], s[1][k]); g.stroke(); });
  };
  base();
  const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * size / r.width, (e.clientY - r.top) * size / r.height]; };
  cv.onpointerdown = e => { e.stopPropagation(); if (!t0) t0 = Date.now(); const [x, y] = pt(e); stroke = [[x], [y], [Date.now() - t0]]; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!stroke) return; const [x, y] = pt(e); const n = stroke[0].length - 1; g.strokeStyle = "#1f6560"; g.lineWidth = Math.max(6, size / 30); g.lineCap = g.lineJoin = "round"; g.beginPath(); g.moveTo(stroke[0][n], stroke[1][n]); g.lineTo(x, y); g.stroke(); stroke[0].push(x); stroke[1].push(y); stroke[2].push(Date.now() - t0); };
  cv.onpointerup = cv.onpointercancel = e => { e.stopPropagation(); if (stroke && stroke[0].length > 1) ink.push(stroke); stroke = null; };
  const cands = el("div", { class: "cands", "aria-live": "polite" });
  const res = el("div", { class: "pres", "aria-live": "polite" });
  const clr = el("button", { type: "button", class: "btn" }, "擦掉"); clr.onclick = () => { ink = []; t0 = 0; base(); cands.innerHTML = ""; };
  const done = el("button", { type: "button", class: "btn solid" }, "寫好了");
  const hb = el("button", { type: "button", class: "btn" }, "提示");
  hb.onclick = () => { hint = Math.min(2, hint + 1); hb.textContent = hint === 1 ? "再一個提示" : "提示"; hb.disabled = hint >= 2; base(); box.hints = hint; };
  done.onclick = async () => {
    if (!ink.length) { res.innerHTML = '<span class="nomsg">先在格子裡寫字。</span>'; return; }
    cands.innerHTML = '<span class="hint">看看你寫的是哪一個字……</span>';
    let list = [];
    try { list = (await hwRecognize(ink, size, size)).filter(c => [...c].length === 1).slice(0, 5); } catch (e) { list = []; }
    if (o.ch && !list.includes(o.ch) && o.pool) list = list.slice(0, 4);
    if (!list.length) { cands.innerHTML = '<span class="hint">電腦認不出來，擦掉再寫一次，或請老師來看。</span>'; return; }
    cands.innerHTML = ""; cands.append(el("span", { class: "hint" }, "你寫的是哪一個字？按一下："));
    list.forEach(c => { const b = el("button", { type: "button", class: "chip big" }, nz(c)); b.onclick = () => o.onPick(c, hint); cands.append(b); });
  };
  const btns = tools(done, clr); if (o.hints) btns.append(hb);
  box.append(cv, btns, cands, res); box.res = res; box.lock = () => { box.classList.add("pdone"); [done, clr, hb].forEach(b => b.disabled = true); cands.innerHTML = ""; };
  return box;
}

/* ── 必學字五步驟 ── */
function mustSlides(c) {
  const W = L.mustkw[c.c] || [c.word, c.pwh]; const others = L.cards.filter(x => x.c !== c.c);
  const head = t => el("div", { class: "mhead" }, `<span class="mstep">${t}</span>`);
  /* ① 聽字選字 */
  const pool = shuffle(others.map(x => x.c)).slice(0, 2);
  const s1 = listenSlide(`${c.c}，${W[0]}的${c.c}`, [c.c, ...pool], 0, `聽字選字：${c.c}`, { cls: "bigc", stem: head("① 聽一聽，選出這個字") });
  /* ② 看圖選詞 */
  const s2 = picSlide(`看圖，選出對的詞語。`, c.pick.map((w, k) => [w, null]), 0, `看圖選詞：${c.c}`, { keep: false, lead: [head("② 看圖選詞")], after: [el("div", { class: "bigpic" }, pic(c.pic, c.pick[0]))] });
  /* ③ 拼組部件 */
  const s3 = slide("", head("③ 拼出這個字"), assemble(c));
  /* ④ 描寫 */
  const s4 = traceSlide(c, head("④ 照著寫寫看"));
  /* ⑤ 看詞寫字 */
  const s5 = wordWriteSlide(c, W[0], W[1], `看詞寫字：${c.c}`, head("⑤ 看詞寫字"));
  return [s1, s2, s3, s4, s5];
}
function traceSlide(c, head) {
  const q4 = qid(`描寫：${c.c}`); const r4 = el("div");
  /* 旁邊已經有範字可以看，寫字格就不再給提示；範字用部件分色的彩色生字（課文解鎖後才有，沒有時用一般國字） */
  const p4 = inkPad({ ch: c.c, st: c.st, hints: false, onPick: (ch, h) => { const ok = ch === c.c; logAns(q4, ok, ch + (h ? `（用了${h}個提示）` : "")); if (ok) { p4.lock(); p4.res.innerHTML = '<span class="okmsg">√ 寫對了！</span>'; r4.classList.add("answered"); } else p4.res.innerHTML = `<span class="nomsg">這是「${nz(ch)}」，不是我們要寫的字。</span>看看左邊的字，擦掉再寫一次。`; } });
  const model = el("div", { class: "model" + (c.img ? " mcolor" : "") }, c.img ? `<img src="${c.img}" alt="${c.c}（部件分色）">` : `<span class="mch nozy">${c.c}</span>`);
  const w4 = el("div", { class: "wrow" }); w4.append(model, p4); r4.append(w4);
  const s4 = slide("", head, el("div", { class: "inst" }, "看左邊的字，在格子裡寫一次。"), r4); s4.dataset.nofit = "1";
  return s4;
}
function wordWriteSlide(c, word, wh, label, head) {
  const q = qid(label); const r = el("div"); let got = false;
  const sw = el("div", { class: "wword" }, nz(wh.replace("□", '<span class="cpb">□</span>')));
  const sb = sayBtn(() => `${word}的${c.c}`, "唸給我聽"); sb.classList.add("bigsay");
  const p = inkPad({ ch: c.c, st: c.st, hints: false, onPick: ch => {
    const ok = ch === c.c; logAns(q, ok, ch);
    if (ok) { p.lock(); r.classList.add("answered"); if (!got) { got = true; const o = knownHit(c.c, word, wh); const n = o ? Math.min(o.n, KNOWN_N) : 0; p.res.innerHTML = `<span class="okmsg">√ 寫對了！</span>` + (o ? (o.n >= KNOWN_N ? `<div class="known">🌟「${nz(c.c)}」收進「我會的字」了！</div>` : `<div class="hint">再答對 ${KNOWN_N - n} 次，就能收進「我會的字」。</div>`) : ""); } }
    else p.res.innerHTML = `<span class="nomsg">這是「${nz(ch)}」，再想想看。</span>擦掉再寫一次。`;
  } });
  const top = el("div", { class: "wwtop" }); top.append(sb, sw); r.append(top, p);
  const s = slide("", head || null, el("div", { class: "inst" }, "聽一聽，寫出□裡的字。"), r); s.dataset.nofit = "1"; return s;
}
/* 拼組部件：依序按出部件 */
function assemble(c) {
  const q = qid(`拼組部件：${c.c}`); const box = el("div", { class: "asm" }); let pos = 0, wrong = 0, done = false;
  const lay = c.parts.length === 3 ? "l3" : (c.st === "上下" ? "tb" : "lr");
  const slots = el("div", { class: "aslots " + lay }); const ss = c.parts.map(() => { const d = el("span", { class: "aslot" }, ""); slots.append(d); return d; });
  const res = el("div", { class: "pres", "aria-live": "polite" });
  const tiles = el("div", { class: "atiles" });
  shuffle([...c.parts, ...c.pd]).forEach(p => {
    const b = el("button", { type: "button", class: "atile nozy" }, p);
    b.onclick = () => { if (done || proj() && false) return; const ok = p === c.parts[pos];
      if (ok) { ss[pos].textContent = p; ss[pos].classList.add("on"); b.disabled = true; pos++; res.innerHTML = "";
        if (pos >= c.parts.length) { done = true; if (!wrong) logAns(q, true, c.c); else logAns(q, true, c.c); box.classList.add("answered"); res.innerHTML = `<span class="okmsg">√ 拼好了！是「${nz(c.c)}」。</span>`; slots.classList.add("whole"); slots.setAttribute("data-c", c.c); } }
      else { wrong++; logAns(q, false, p); b.classList.add("no", "shake"); setTimeout(() => b.classList.remove("no", "shake"), 500); res.innerHTML = `<span class="nomsg">「${nz(p)}」不在這個字裡，再找找看。</span>`; }
    };
    tiles.append(b);
  });
  const reset = el("button", { type: "button", class: "btn" }, "重來"); reset.onclick = () => { if (done) return; pos = 0; ss.forEach(s => { s.textContent = ""; s.classList.remove("on"); }); tiles.querySelectorAll("button").forEach(b => b.disabled = false); };
  box.append(el("div", { class: "asmtop" }, `<span class="mch nozy">${c.c}</span>`), slots, tiles, tools(reset), res);
  box.reveal = () => { c.parts.forEach((p, k) => { ss[k].textContent = p; ss[k].classList.add("on"); }); };
  return box;
}
/* 我會的字：收集頁＋重複抽考 */
function knownSlides() {
  const k = knownGet(); const got = Object.entries(k).filter(([, o]) => o.n >= KNOWN_N);
  const grid = el("div", { class: "kgrid" });
  if (!got.length) grid.append(el("div", { class: "hint" }, "還沒有收集到字。看詞寫字答對三次，就會收進這裡。"));
  got.forEach(([ch, o]) => grid.append(el("div", { class: "kcard" }, `<span class="kc nozy">${ch}</span><span class="kw">${esc(o.w)}</span>`)));
  const prog = el("div", { class: "kprog" }); (L.must || []).forEach(ch => { const o = k[ch] || { n: 0 }; prog.append(el("span", { class: "kp" + (o.n >= KNOWN_N ? " ok" : "") }, `${nz(ch)} ${"●".repeat(Math.min(o.n, KNOWN_N))}${"○".repeat(Math.max(0, KNOWN_N - o.n))}`)); });
  const s0 = slide("", el("h2", { class: "ktitle" }, "🌟 我會的字"), grid, el("div", { class: "hint" }, "這一課的必學字："), prog);
  /* 抽考：之前收進來的字（不限這一課），最多 3 個 */
  const pickN = shuffle(got).slice(0, 3).map(([ch, o]) => { const c = (L.cards.find(x => x.c === ch)) || { c: ch, st: "左右" }; return wordWriteSlide(c, o.w, o.wh, `複習我會的字：${ch}`, el("div", { class: "mhead" }, '<span class="mstep">複習</span>')); });
  return [s0, ...pickN];
}

/* ── 課文：逐詞亮起朗讀 ── */
function wordReadBtn(container) {
  const b = el("button", { type: "button", class: "btn say-btn wordread" }, `${SPK} 聽課文`);
  b.onclick = () => wordRead(container, b); return b;
}
function wordRead(container, btn) {
  if (btn.classList.contains("on")) { stopSpeak(); btn.classList.remove("on"); return; }
  stopSpeak();
  const map = []; let txt = "";
  const walk = n => { if (n.nodeType === 3) { for (let k = 0; k < n.data.length; k++) { const cp = n.data.codePointAt(k); if (cp > 0xffff) { if (cp >= 0xE0100 && cp <= 0xE01EF) { k++; continue; } txt += n.data.substr(k, 2); map.push([n, k]); map.push([n, k + 1]); k++; continue; } txt += n.data[k]; map.push([n, k]); } } else if (!(n.classList && (n.classList.contains("say") || n.classList.contains("pn") || n.classList.contains("zb")))) n.childNodes.forEach(walk); };
  walk(container);
  let segs = [];
  try { const sg = new Intl.Segmenter("zh-TW", { granularity: "word" }); for (const s of sg.segment(txt)) segs.push([s.index, s.index + s.segment.length, s.isWordLike]); } catch (e) { segs = [...txt].map((c, i) => [i, i + 1, /[一-鿿]/.test(c)]); }
  const sents = []; let st = 0;
  for (let k = 0; k < txt.length; k++) if ("。！？；".includes(txt[k]) || k === txt.length - 1) { let e = k + 1; while (e < txt.length && "」』）".includes(txt[e])) e++; if (txt.slice(st, e).trim()) sents.push([st, e]); st = e; k = e - 1; }
  const hl = (a, b, name) => { if (!(window.CSS && CSS.highlights && window.Highlight)) return; try { const r = new Range(); r.setStart(map[a][0], map[a][1]); const z = map[b - 1]; r.setEnd(z[0], z[1] + 1); CSS.highlights.set(name, new Highlight(r)); } catch (e) {} };
  let i = 0; btn.classList.add("on");
  const nextS = () => {
    if (!btn.classList.contains("on") || i >= sents.length) { stopSpeak(); btn.classList.remove("on"); if (CSS.highlights) CSS.highlights.delete("word"); return; }
    const [a, b] = sents[i++]; hl(a, b, "reading");
    const words = segs.filter(s => s[0] >= a && s[1] <= b && s[2]);
    const han = [...txt.slice(a, b)].filter(c => /[\p{L}\p{N}]/u.test(c)).length || 1;
    let last = -1;
    speak(txt.slice(a, b), { onprog: f => { /* 依時間比例推算唸到第幾個字 */
        let cnt = Math.floor(f * han), k = a; for (; k < b && cnt > 0; k++) if (/[\p{L}\p{N}]/u.test(txt[k])) cnt--;
        const w = words.find(s => k >= s[0] && k < s[1]) || words.find(s => s[0] >= k); if (w && w[0] !== last) { last = w[0]; hl(w[0], w[1], "word"); } },
      onend: () => { if (btn.classList.contains("on")) nextS(); } });
  };
  nextS();
}

/* ── 課文段落（課文未解鎖時顯示提示）── */
function paraHTML(i) { return (L.text && L.text[i]) || ""; }
function lockedText() { return !L.text || !L.text.length || L.text.some(t => t.includes("lockp")); }
function paraSlide(i, o = {}) {
  const para = el("p", { class: "para" }, paraHTML(i));
  const left = el("div"); const rowh = el("div", { class: "rowh" }); rowh.append(lessonHead(), kick(`第 ${i + 1} 段`));
  if (o.word) rowh.append(wordReadBtn(para)); else { const rd = el("button", { type: "button", class: "btn say-btn" }, `${SPK} 逐句朗讀`); rd.onclick = () => readAloud(para, rd); rowh.append(rd); }
  left.append(rowh, para);
  if (o.side === false) return slide("", left);
  const ws = [...new Set([...para.querySelectorAll(".w")].map(b => b.dataset.w))];
  const side = el("aside", { class: "side" }); side.append(el("h3", {}, ws.length ? "詞語：按一下看意思" : "這一段沒有新詞語"));
  const wl = el("div", { class: "wordlist" }); ws.forEach(w => wl.append(el("button", { type: "button", class: "w", "data-w": w, "aria-pressed": "false" }, w))); side.append(wl, el("div", { class: "panel" }, '<span class="hint">按詞語，意思會出現在這裡。</span>'));
  const g = el("div", { class: "sl2 narrow-r" }); g.append(left, side); return slide("", g);
}
function lessonHead() { return el("div", { class: "lhead" }, `<span class="ltitle">${L.title}</span>`); }

/* ── 投影：背景知識卡、提問卡 ── */
function bgSlide(b) {
  const qs = el("div", { class: "pq" });
  b.qb.forEach(t => qs.append(el("div", { class: "pqi" }, ICON_B + `<span>${t}</span>`)));
  b.qs.forEach(t => qs.append(el("div", { class: "pqi" }, ICON_S + `<span>${t}</span>`)));
  const left = el("div", { class: "bgimg" }, pic(b.img, b.title)); const right = el("div");
  right.append(el("div", { class: "bgtext" }, b.text), sayBtn(() => plainText(b.text), "唸卡片"), qs);
  return slide("", kick("背景知識"), el("h2", { class: "bgt" }, b.title), splitBox([left], [right]));
}
function projQSlide(x) {
  const box = el("div", { class: "pq big" });
  x.b.forEach(t => box.append(el("div", { class: "pqi" }, ICON_B + `<span>${t}</span>`)));
  x.s.forEach(t => box.append(el("div", { class: "pqi" }, ICON_S + `<span>${t}</span>`)));
  const para = el("details", { class: "pqpara" }); para.innerHTML = `<summary>看第 ${x.p} 段課文</summary><p class="para">${paraHTML(x.p - 1)}</p>`;
  return slide("", kick(`第 ${x.p} 段提問`), box, para);
}
function iconLegend() { return el("span", { class: "legend ui" }, `${ICON_B}聽得懂、指得出、選得出　${ICON_S}說出原因、用自己的話說`); }

/* ── 結構：總說／分說／總結 ── */
function structSlides() {
  const segs = [...new Set(L.struct.map(x => x.seg))];
  if (proj()) {
    const g = el("div", { class: "tree" });
    segs.forEach(sg => { const ps = L.struct.filter(x => x.seg === sg).map(x => x.p); const c = el("div", { class: "tnode" }); c.append(peekBox(`<b>${sg}</b>`, "tseg"), el("div", { class: "tps" }, ps.length > 2 ? `第 ${ps[0]} 到第 ${ps[ps.length - 1]} 段` : `第 ${ps.join("、")} 段`), el("div", { class: "hint" }, L.structNote[sg])); g.append(c); });
    return [slide("", kick("課文結構"), el("div", { class: "hint" }, L.structIntro || ""), g)];
  }
  /* 學生練習：跟著「起因、經過、收穫」三部分讀懂結構 */
  return L.structQ.map((x, i) => {
    const lb = `課文結構${i + 1}：${x.seg}`; const tag = kick(x.seg);
    const para = x.p.length ? el("details", { class: "pqpara" }, `<summary>看第 ${x.p.join("、")} 段課文</summary>${x.p.map(n => `<p class="para">${paraHTML(n - 1)}</p>`).join("")}`) : null;
    if (x.type === "order") { const stem = el("div", { class: "stem" }, mk(x.q)); const box = ordBox(x.cards, lb, { inst: "依照作者走的順序，一張一張按。", ph: "第一站 → 第二站 → 第三站 → 第四站" }); const s = slide("", tag, sayRow(stem), stem, box, para); s.reveal = () => {}; return s; }
    const c = choiceQ(mk(x.q), x.opts, x.ans, lb); const s = slide("", tag, sayRow(c), c, para); s.reveal = c.reveal; return s;
  });
}
function peekBox(html, cls) { const b = el("button", { type: "button", class: "fpk " + (cls || "") }, `<span class="fpk-c">${html}</span><span class="fpk-h">按一下顯示</span>`); b.onclick = () => b.classList.toggle("open"); return b; }
/* 三座塔表格 */
function towerSlide() {
  /* 參觀路線：一排站點卡片，按一下跳出浮動視窗，逐站看「看到什麼、知道什麼」 */
  const T = L.towers; const blanks = []; const route = el("div", { class: "route", role: "list" });
  const pops = T.cols.map((c, k) => {
    const ctx = {}; const mine = []; const body = el("div", { class: "rbody" });
    T.rows.forEach(r => { const row = el("div", { class: "rrow" }); row.append(el("div", { class: "rh" }, r.h)); const cell = el("div", { class: "rc" }); const v = r.cells[k];
      if (proj()) { String(v).split(/(\{[^}]*\})/).forEach(p => { const m = p.match(/^\{(.*)\}$/); if (m) cell.append(peekBox(m[1], "inl")); else if (p) cell.insertAdjacentHTML("beforeend", p); }); }
      else { const line = fillLine(bparts(v), [], ctx, `參觀路線：${c}${r.h}`); mine.push(...line.blanks); cell.append(line); }
      row.append(cell); body.append(row); });
    blanks.push(...mine);
    const ans = T.rows.map(r => (String(r.cells[k]).match(/\{([^}]*)\}/g) || []).map(x => x.slice(1, -1))).flat();
    const others = shuffle(T.bank.filter(b => !ans.includes(b))).slice(0, 2);
    const close = el("button", { type: "button", class: "btn rclose", "aria-label": "關閉" }, "✕ 關閉");
    const panel = el("div", { class: "rpanel", role: "dialog", "aria-modal": "true", "aria-label": c });
    panel.append(el("div", { class: "rhead" }, `${pic(T.imgs[k], c)}<div class="rname"><span class="rno">第 ${k + 1} 站</span>${c}</div>`), body);
    if (!proj()) panel.append(bankBox(shuffle([...ans, ...others]).map(b => ({ t: b, h: b })), ctx));
    panel.append(el("div", { class: "rfoot" }, "")); panel.lastChild.append(close);
    const wrap = el("div", { class: "rpop", hidden: "" }); wrap.append(panel);
    const card = el("button", { type: "button", class: "rstop", role: "listitem" }, `${pic(T.imgs[k], c)}<div class="rname"><span class="rno">${k + 1}</span>${c}</div><span class="rdone" aria-hidden="true">✓</span>`);
    const hide = () => { wrap.hidden = true; document.removeEventListener("keydown", esc); if (proj() || mine.every(b => b.classList.contains("ok"))) card.classList.add("seen"); card.focus(); };
    const esc = e => { if (e.key === "Escape") hide(); };
    const show = () => { wrap.hidden = false; document.addEventListener("keydown", esc); ctx.slideBlanks = mine; const b = mine.find(x => !x.classList.contains("ok")); if (b) b.click(); else close.focus(); };
    close.onclick = hide; wrap.onclick = e => { if (e.target === wrap) hide(); }; card.onclick = show;
    route.append(card); if (k < T.cols.length - 1) route.append(el("div", { class: "rarrow", "aria-hidden": "true" }, "➜"));
    return wrap;
  });
  const s = slide("", kick("參觀路線"), el("div", { class: "hint" }, "照著作者走的順序，按一下每一站看看。"), route, ...pops);
  s.reveal = () => { revealBlanks(blanks); route.querySelectorAll(".rstop").forEach(c => c.classList.add("seen")); };
  return s;
}

/* ── 習作第 65 頁：行程表（讓學生回家能自己完成習作）── */
const IVS_RE = /[\u{E0100}-\u{E01EF}]/u;
/* 在段落裡把詞語框起來：跨過詞語按鈕、生字標示也找得到；多音字的異體選擇符跟著前一個字，讀音不會跑掉 */
function markWord(root, word) {
  const want = [...String(word)].filter(c => !IVS_RE.test(c)); if (!want.length) return null;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const map = [];
  for (let n; (n = tw.nextNode());) { let i = 0; for (const ch of n.nodeValue) { if (IVS_RE.test(ch)) { const m = map[map.length - 1]; if (m && m[1] === n) m[3] += ch.length; } else map.push([ch, n, i, i + ch.length]); i += ch.length; } }
  let at = -1; for (let k = 0; k + want.length <= map.length; k++) if (want.every((c, j) => map[k + j][0] === c)) { at = k; break; }
  if (at < 0) return null;
  const seg = new Map(); map.slice(at, at + want.length).forEach(([, n, a, b]) => { const s = seg.get(n); if (s) s[1] = b; else seg.set(n, [a, b]); });
  let first = null;
  seg.forEach(([a, b], n) => { const r = document.createRange(); r.setStart(n, a); r.setEnd(n, b); const m = el("mark", { class: "hwmk" }); r.surroundContents(m); first = first || m; });
  return first;
}
const hwAns = t => (String(t).match(/\{[^}]*\}/g) || []).map(x => x.slice(1, -1));
/* 一列一張：和習作同一句話，按空格再按詞語；「給我提示」第一次打開課文段落，第二次把答案框起來 */
function hwRowSlide(r, label) {
  const ctx = {}; const line = fillLine(bparts(r.t), [], ctx, label); const ans = hwAns(r.t);
  const stem = el("div", { class: "big-line hwline" }); stem.append(line);
  const chips = bankBox(shuffle([...ans, ...(r.opts || [])]).map(b => ({ t: b, h: b })), ctx);
  const para = el("div", { class: "rpara hwpara", hidden: "" }, `<div class="hwpl">課文第 ${r.p} 段</div><p class="para">${paraHTML(r.p - 1)}</p>`);
  const tid = qid(`${label}（提示）`); let step = 0;
  const tip = el("button", { type: "button", class: "btn hwtip only-stu" }, "💡 給我提示");
  tip.onclick = () => {
    step++;
    if (lockedText()) {   /* 課文上鎖（例如在家）：改成提示課本段落和答案的第一個字 */
      if (step === 1) { para.innerHTML = `<div class="hwpl">提示</div><p class="hwlk">${L.hw65.tipBook.replace("#", r.p)}</p>`; para.hidden = false; tip.textContent = "💡 再給我提示"; logText(tid, "提示課本段落"); }
      else { para.insertAdjacentHTML("beforeend", `<p class="hwlk">${L.hw65.tipFirst}${ans.map(w => `「${[...w][0]}」`).join("、")}</p>`); tip.disabled = true; tip.textContent = "提示都給你了"; logText(tid, "提示課本段落、答案第一個字"); }
      return;
    }
    if (step === 1) { para.hidden = false; tip.textContent = "💡 再給我提示"; logText(tid, "打開課文段落"); }
    else { let m = null; ans.forEach(w => { const x = markWord(para, w); m = m || x; }); tip.disabled = true; tip.textContent = "答案框起來了"; logText(tid, "打開課文段落、框出答案"); if (m) m.scrollIntoView({ block: "nearest" }); }
  };
  const left = [el("div", { class: "hwhead" }, `${pic(r.pic, r.h)}<b class="hwh">${r.h}</b>`)];
  const s = slide("hwrow", kick("習作 65 頁"), splitBox(left, [sayRow(stem), stem, chips, tip, para]));
  s.onshow = () => { ctx.slideBlanks = line.blanks; const b = line.blanks.find(x => !x.classList.contains("ok")); if (b) b.click(); };
  s.reveal = () => { revealBlanks(line.blanks); para.hidden = false; };
  return s;
}
/* 整張行程表：排法和習作一樣，括號裡的答案按一下才出現，用來對答案、照著抄回習作 */
function hwTableSlide(H, title) {
  const tb = el("div", { class: "hwtable", role: "table", "aria-label": H.title });
  tb.append(el("div", { class: "hwr hwth", role: "row" }, '<span role="columnheader">行程</span><span role="columnheader">活動內容</span>'));
  const boxes = [];
  H.rows.forEach(r => {
    const row = el("div", { class: "hwr" + (hwAns(r.t).length ? "" : " plain"), role: "row" }); row.append(el("span", { class: "hwc1", role: "cell" }, r.h));
    const c = el("span", { class: "hwc2", role: "cell" });
    String(r.t).split(/(\{[^}]*\})/).forEach(p => { const m = p.match(/^\{(.*)\}$/); if (m) { c.append("（"); const b = peekBox(m[1], "inl"); boxes.push(b); c.append(b, "）"); } else if (p) c.insertAdjacentHTML("beforeend", p); });
    row.append(c); tb.append(row);
  });
  const all = el("button", { type: "button", class: "btn hwall" }, "👀 全部顯示");
  all.onclick = () => boxes.forEach(b => b.classList.add("open"));
  const s = slide("hwtab", kick(title || "習作 65 頁"), el("div", { class: "hwq" }, H.q), tb, el("div", { class: "hwfoot" }, ""));
  s.querySelector(".hwfoot").append(all, el("span", { class: "hint only-stu" }, "按一下括號看答案，照著寫到習作上。"));
  s.reveal = () => all.click();
  return s;
}
function hwSlides() {
  const H = L.hw65; if (!H) return [];
  if (proj()) return [hwTableSlide(H)];
  return [...H.rows.filter(r => hwAns(r.t).length).map(r => hwRowSlide(r, `習作65頁：${r.h}`)), hwTableSlide(H, "整張行程表")];
}

/* ══════════ 各分頁 ══════════ */
const VIEWS = {
  text() {
    const T = tier(); const n = (L.text || []).length || 5;
    if (T === "proj") {
      const secs = [
        { name: "背景知識", hint: "先用圖片和生活經驗想一想，再讀課文。", slides: L.bg.map(bgSlide), extra: iconLegend() },
        { name: "分段讀", hint: "畫底線的是詞語，按一下看意思；黃色底的字是本課生字。", slides: [...Array(n).keys()].map(i => paraSlide(i)) },
        { name: "課文結構", slides: structSlides() },
        { name: "參觀路線", hint: "按一下每一站，看看那裡有什麼。", slides: [towerSlide()] },
        ...(L.hw65 ? [{ name: "習作65頁", hint: "和習作第 65 頁一樣的行程表。先讓學生說，再按括號看答案。", slides: hwSlides() }] : []),
        { name: "段落大意", hint: "先按空格，再按詞語。", slides: bankSlides(L.summary.map(x => x.t), L.sumBank, "段落大意", { kick: L.summary.map(x => x.label) }) },
        { name: "提問", slides: L.projq.map(projQSlide), extra: iconLegend() },
      ];
      return deck(secs);
    }
    if (T === "base") {
      const secs = [
        { name: "聽課文", hint: "按「聽課文」，跟著亮起來的字一起看。", slides: [...Array(n).keys()].map(i => paraSlide(i, { word: true, side: false })) },
        { name: "聽題選答", hint: "聽題目，選出答案。", slides: L.readb.map((x, i) => picSlide(x.q, x.opts, 0, `聽題選答${i + 1}`, { auto: true })) },
        { name: "自讀挑戰", hint: "橘色的字先自己讀一次，再按喇叭對答案。", slides: shuffle(L.readb.map((x, i) => picSlide(x.q, x.opts, 0, `自讀挑戰${i + 1}`, { self: true }))) },
        { name: "完成", slides: [finishSlide()] },
      ];
      return deck(secs, { submit: true });
    }
    const R = L.readq.map((x, i) => x.type === "choice" ? (() => { const c = choiceQ(mk(x.q), x.opts, x.ans, `理解與推論${i + 1}`); const s = slide("", sayRow(c), c); s.reveal = c.reveal; return s; })() : (x.opts ? (() => { const lb = `理解與推論${i + 1}：${x.q}`; const stem = el("div", { class: "stem" }, mk(x.q)); return ladderSlide({ type: "rq", label: lb, stem: [sayRow(stem), stem], ref: x.ref,
        makers: [() => { const c = choiceQ("", x.opts, x.ans, `${lb}：選答案`); c.isDone = () => c.classList.contains("answered") || !!c.querySelector(".ok"); return c; },
          () => fillBox(x.fill, x.bank, `${lb}：句框＋詞庫`), () => openBox("用句框說或寫出答案。", x.frame, [], `${lb}：句框`), () => openBox("用自己的話說或寫出答案。", "", [], `${lb}：自己回答`)] }); })() : frameSlide(x.q, x.frame, x.ref, `理解與推論${i + 1}：${x.q}`)));
    const secs = [
      { name: "分段讀", hint: "按詞語可以看意思。", slides: [...Array(n).keys()].map(i => paraSlide(i)) },
      { name: "課文結構", hint: "這一課分成起因、經過、收穫三部分。", slides: structSlides() },
      { name: "段落大意", hint: "先按空格，再按詞語。詞庫裡有用不到的詞。", slides: bankSlides(L.summary.map(x => x.t), L.sumBank, "段落大意", { kick: L.summary.map(x => x.label) }) },
      { name: "參觀路線", hint: "按一下每一站，在跳出來的視窗裡填空。", slides: [towerSlide()] },
      ...(L.hw65 ? [{ name: "習作65頁", hint: "和習作第 65 頁一樣，一列一列填。不會的時候按「給我提示」，最後看整張表抄到習作上。", slides: hwSlides() }] : []),
      { name: "理解與推論", hint: "先自己試試看；需要時按「給我提示」。", slides: R },
      { name: "完成", slides: [finishSlide()] },
    ];
    return deck(secs, { submit: true });
  },

  chars() {
    const T = tier(); const must = MUST();
    if (T === "proj") {
      const slides = L.cards.map(c => {
        const N = (L.net || {})[c.c] || { bj: [], f: [], b: [] };
        // ① 圖解＋彩色生字
        const left = el("div", { class: "cimg" });
        if (L.cpic && L.cpic[c.c]) left.insertAdjacentHTML("beforeend", `<div class="cpic">${pic(L.cpic[c.c], "")}</div>`);
        const r1 = el("div", { class: "row" }); r1.append(c.img ? el("img", { src: c.img, alt: c.c + "（彩色部件）" }) : el("span", { class: "cglyph nozy" }, c.c), zyBox(c.cz)); left.append(r1);
        const rb = el("div", { class: "radb" }); const rbtn = el("button", { type: "button", "aria-label": "部首框，按一下顯示部首" }); rbtn.onclick = () => rbtn.textContent = rbtn.textContent ? "" : c.radb; rb.append(rbtn, "部");
        left.append(rb, sayBtn(() => c.c, "唸這個字"));
        if (must.has(c.c)) left.append(el("div", { class: "mustnote" }, "★"));
        // ② 部件拆解
        const right = el("div", { class: "cteach" });
        const bjRow = el("div", { class: "bjrow" });
        const bjBtn = el("button", { type: "button", class: "btn stepbtn", "aria-label": "拆一拆" }, "✂️");
        const bjs = el("div", { class: "bjs", hidden: "" });
        N.bj.forEach((t, k) => { if (k) bjs.append(el("span", { class: "plus" }, "＋")); const r = t.includes("*"); bjs.append(el("span", { class: "bj nozy" + (r ? " rad" : "") }, t.replace("*", ""))); });
        bjBtn.onclick = () => { bjs.hidden = !bjs.hidden; };
        bjRow.append(bjBtn, bjs);
        // ③ 造詞網
        const net = el("div", { class: "znet" });
        const col = (list, side) => {
          const d = el("div", { class: "zcol " + side });
          d.append(el("div", { class: "zhead nozy" }, side === "f" ? `${c.c}＿` : `＿${c.c}`));
          if (!list.length) d.append(el("div", { class: "zempty" }, "—"));
          list.forEach(x => {
            const card = el("button", { type: "button", class: "zcard" + (x.k ? " kw open" : "") + (x.n ? " chk" : ""), "aria-label": x.k ? x.w : "翻開詞語" });
            const hint = el("span", { class: "zh" }); if (x.pic) hint.innerHTML = pic(x.pic, ""); else hint.textContent = x.e || "";
            const word = el("span", { class: "zw" }, x.w);
            card.append(hint, el("span", { class: "zx" }, "？"), word);
            card.onclick = () => { card.classList.add("open"); if (HAS_TTS) { stopSpeak(); speak(plainText(x.w)); } };
            d.append(card);
          });
          return d;
        };
        const mid = el("div", { class: "zmid nozy" }, c.c);
        const fcol = col(N.f, "f"), bcol = col(N.b, "b");
        net.append(fcol, mid, bcol);
        const flipAll = el("button", { type: "button", class: "btn stepbtn", "aria-label": "全部翻開" }, "👀");
        flipAll.onclick = () => net.querySelectorAll(".zcard").forEach(x => x.classList.add("open"));
        // ④ 還能造什麼詞
        const mine = el("div", { class: "zmine" });
        const inp = el("input", { type: "text", class: "zin", "aria-label": "學生說的詞", maxlength: "6" });
        const add = el("button", { type: "button", class: "btn", "aria-label": "加到造詞網" }, "➕");
        const doAdd = () => { const w = inp.value.trim(); if (!w) return; if (!w.includes(c.c)) { inp.select(); return; }
          const card = el("button", { type: "button", class: "zcard open mine" }); card.append(el("span", { class: "zh" }, "💡"), el("span", { class: "zw" }, w)); card.onclick = () => { if (HAS_TTS) { stopSpeak(); speak(w); } };
          (w.startsWith(c.c) ? fcol : bcol).append(card); inp.value = ""; };
        add.onclick = doAdd; inp.addEventListener("keydown", e => { if (e.key === "Enter") doAdd(); });
        mine.append(el("span", { class: "zq" }, "💬"), inp, add);
        right.append(bjRow, el("div", { class: "znetwrap" }, ""), mine);
        right.querySelector(".znetwrap").append(net, flipAll);
        const g = el("div", { class: "cslide teach" }); g.append(left, right); return slide("", g);
      });
      return deck([{ name: "生字", hint: "看圖認字 → ✂️ 拆一拆 → 翻開造詞網 → 💬 還能造什麼詞？", slides, dotChars: L.cards.map(c => c.c) }]);
    }
    if (T === "base") {
      const ms = L.cards.filter(c => must.has(c.c)); const rest = L.cards.filter(c => !must.has(c.c));
      const secs = ms.map(c => ({ group: "必學字", name: c.c, hint: "聽字選字 → 看圖選詞 → 拼出這個字 → 照著寫 → 看詞寫字", slides: mustSlides(c), seq: true }));
      secs.push({ name: "聽字選字", hint: "聽一聽，選出聽到的字。", slides: rest.map(c => listenSlide(`${c.c}，${c.word}的${c.c}`, [c.c, ...shuffle(L.cards.filter(x => x.c !== c.c).map(x => x.c)).slice(0, 2)], 0, `聽字選字：${c.c}`, { cls: "bigc" })) });
      secs.push({ name: "我會的字", hint: "看詞寫字答對三次的字，會收進這裡。", slides: knownSlides() }, { name: "完成", slides: [finishSlide()] });
      return deck(secs, { submit: true });
    }
    const ps = L.cards.map(c => { const s = charPractice(Object.assign({}, c, { pw: c.word, pwh: c.pwh }), 0); return s; });
    const zc = L.cards.map(c => { const p = produce({ label: `自己造詞：${c.c}`, answer: c.zc.join("、"), hint: `想想生活中哪些詞有「${c.c}」`,
      check: t => !t.includes(c.c) ? { st: "no", msg: `要用到「${c.c}」這個字` } : (t === c.word ? { st: "no", msg: "這是課本的詞，換一個自己想的詞" } : (c.zc.includes(t) ? { st: "ok" } : { st: "check", msg: "老師會再確認這個詞" })) });
      /* 左右兩欄：左邊生字與提示固定大小，右邊作答區；不跟著作答區縮放 */
      const lf = el("div", { class: "zcl" }, `<div class="zct nozy">${c.c}</div><div class="zch">課本的詞：${c.word}</div><div class="zch">用「${c.c}」造一個課本以外的詞。</div>`);
      const g = el("div", { class: "zcgrid" }); const rt = el("div", { class: "zcr" }); rt.append(p); g.append(lf, rt);
      const sl = slide("zcs", g); sl.dataset.nofit = "1"; return sl; });
    const tr = L.cards.map(c => traceSlide(c, el("div", { class: "mhead" }, '<span class="mstep">寫寫看</span>')));
    return deck([{ group: "生字", name: "寫寫看", hint: "看左邊的彩色生字，在格子裡寫一次。", slides: tr }, { name: "生字練習", hint: "每個生字要完成三件事：寫國字、拼注音、選部首。", slides: ps }, { name: "自己造詞", slides: zc }, { name: "完成", slides: [finishSlide()] }], { submit: true });
  },

  words() {
    const T = tier(); const WD = L.words; const lk = {}; WD.forEach(w => lk[w.w] = w);
    const judgeS = L.judge.map((x, i) => ynSlide(`<span class="jsent">${x.s.replace(x.w, `<b class="kw jkw">${x.w}</b>`)}</span>`, x.ok, `情境判斷${i + 1}：${x.w}`));
    // 一詞多義：每個詞自成一節；詞語放大、句子縮小，跟情境判斷一致
    const multiList = Array.isArray(L.multi) ? L.multi : (L.multi ? [L.multi] : []);
    const multiSecs = (stu) => multiList.map((m) => {
      const slides = m.items.map((x, i) => { const stem = el("div", { class: "stem big-line" }, `<span class="jsent">${x.s.replace(m.w, `<b class="kw jkw">${m.w}</b>`)}</span>`); const r = pickRow(m.senses.map((t, k) => `${"①②③④"[k]} ${t}`), x.ans, `「${m.w}」的意思${i + 1}`, "ab wide"); const s = slide("", sayRow(stem), stem, el("div", { class: "ynrow col" }, "")); s.querySelector(".ynrow").append(r); s.reveal = r.reveal; return s; });
      const sec = { name: `「${m.w}」的意思`, slides };
      if (stu) sec.hint = `判斷句子裡的「${m.w}」是哪一個意思。`;
      return sec;
    });
    const fillS = bankSlides(L.fillw.items, L.fillw.bank, "選詞填入");
    if (T === "proj") {
      const flash = WD.map(w => { const d = el("div", { class: "flash wflash" }); d.append(el("div", { class: "t" }, w.w), peekBox(w.def, "def")); if (w.pic) d.append(el("div", { class: "wpic" }, pic(w.pic, `${w.w}的情境圖`))); d.append(sayBtn(() => `${w.w}。${plainText(w.def)}`, "唸詞語和意思")); return slide("", d); });
      return deck([{ name: "詞義", hint: "先猜猜看意思，再按一下打開。", slides: flash }, { name: "情境判斷", slides: judgeS }, ...multiSecs(false), { name: "選詞填入", slides: fillS }]);
    }
    if (T === "base") {
      const kwPics = L.kw.map((x, i) => { const o = shuffle(L.kw.filter(y => y !== x)).slice(0, 2); return listenSlide(x[0], [x, ...o], 0, `聽詞選圖：${x[0]}`, { html: y => pic(y[1], y[0]), cls: "lpic", hint: "聽一聽，按出對的圖。" }); });
      const sent = L.listen.map((x, i) => picSlide(x.t.replace(/\{[^}]*\}/, "（　）"), x.opts.map(w => [w, (L.kw.find(k => k[0] === w) || [])[1]]), 0, `聽句子選詞${i + 1}`, { auto: true, say: blankless(x.t) }));
      return deck([{ name: "聽詞選圖", hint: "聽詞語，選出對的圖。", slides: kwPics }, { name: "聽句子選詞", hint: "聽句子，選出空格裡的詞。", slides: sent }, { name: "完成", slides: [finishSlide()] }], { submit: true });
    }
    const defS = defBankSlides(WD.filter(w => !/^\s*$/.test(w.def)).map(w => ({ t: w.w, h: w.w, def: w.def.replace(/^①/, "").replace(/②.*$/, ""), pic: w.pic })), { label: "詞義", per: 3, extra: 2 });
    return deck([{ name: "詞義", hint: "看解釋，選出詞語。", slides: defS }, { name: "情境判斷", hint: "看句子，判斷詞語用得對不對。", slides: judgeS }, ...multiSecs(true), { name: "選詞填入", hint: "先按空格，再按詞語。", slides: fillS }, { name: "完成", slides: [finishSlide()] }], { submit: true });
  },

  zx() {
    const T = tier();
    const zxS = L.zx.flatMap((g, gi) => g.items.map((t, i) => {
      const ans = (t.match(/\{([^}]*)\}/) || [])[1]; const parts = t.split(/\{[^}]*\}/);
      const r = pickRow(g.set.map(nz), g.set.indexOf(ans), `形近字（${g.set.join("、")}）${i + 1}`, "ab zxc");
      const stem = el("div", { class: "stem big-line" }); stem.append(document.createTextNode("")); stem.insertAdjacentHTML("beforeend", parts[0]); const bl = el("span", { class: "zxbl" }, "＿"); stem.append(bl); stem.insertAdjacentHTML("beforeend", parts[1] || "");
      r.addEventListener("click", () => { const sel = r.querySelector(".ok"); if (sel) bl.innerHTML = nz(ans); });
      const s = slide("", kick(g.set.join("／")), sayRow(stem), stem, el("div", { class: "ynrow" }, "")); s.querySelector(".ynrow").append(r); s.reveal = () => { r.reveal(); bl.innerHTML = nz(ans); }; return s;
    }));
    const P = L.poly;
    const polyTeach = slide("", kick(`多音字「${P.c}」`), el("div", { class: "polybig nozy" }, P.c), el("div", { class: "prs" }, P.rs.map(r => `<div class="pr"><span class="ui bp">${r.z}</span><span>${r.use}</span><span class="pws">${r.ws.join("、")}</span></div>`).join("")), el("div", { class: "src" }, P.src));
    /* 報讀時把要判斷的字換成「嗶」，避免直接聽到讀音 */
    const polyS = P.items.map((x, i) => { const stem = el("div", { class: "stem big-line" }, x.s.replace(/\{([^}]*)\}/, `<span class="pl nozy">$1</span>`)); const r = pickRow(P.rs.map(r => `<span class="ui">${r.z}</span>`), x.ans, `多音字「${P.c}」${i + 1}`, "ab"); const sr = el("div", { class: "sayrow" }); sr.append(sayBtn(() => x.s.replace(/\{[^}]*\}/, "嗶"), "唸題目")); const s = slide("", sr, stem, el("div", { class: "ynrow" }, "")); s.querySelector(".ynrow").append(r); s.reveal = r.reveal; return s; });
    const radS = L.radsort.map(R => radSortSlide(R));
    if (T === "proj") return deck([{ name: "形近字", hint: "先說說看兩個字哪裡不一樣，再判斷句子要用哪一個。", slides: zxS }, { name: "多音字", slides: [polyTeach, ...polyS] }, { name: "部首歸類", slides: radS }]);
    if (T === "base") return deck([{ name: "部首歸類", hint: "找出有這個部首的字。", slides: radS }, { name: "完成", slides: [finishSlide()] }], { submit: true });
    return deck([{ name: "形近字", hint: "選出句子裡要用的字。", slides: zxS }, { name: "多音字", hint: `判斷「${P.c}」在句子裡怎麼讀。`, slides: [polyTeach, ...polyS] }, { name: "完成", slides: [finishSlide()] }], { submit: true });
  },

  jx() {
    const T = tier(); const J = L.jx; const COL = ["b1", "b2", "b3"];
    const blocks = (arr, empty) => { const d = el("div", { class: "blocks" }); arr.forEach((t, k) => d.append(el("span", { class: "blk " + COL[k] + (t ? "" : " empty") }, t || J.blocks[k]))); return d; };
    const legend = el("div", { class: "blegend" }); J.blocks.forEach((t, k) => legend.append(el("span", { class: "blk " + COL[k] }, t)));
    const ck = J.ck;
    /* ① 看示範 */
    const s1 = slide("", kick("① 看示範"), el("div", { class: "stem big-line" }, `${J.demo[0]}，${J.demo[1]}${J.demo[2]}。`), blocks(J.demo), legend.cloneNode(true), sayBtn(`${J.demo[0]}，${J.demo[1]}${J.demo[2]}。`, "唸句子"));
    /* ② 仿寫：換情況 */
    const ctx2 = {}; const s2t = J.s2.stem; const l2 = fillLine([s2t[0], { ans: "", h: "" }, s2t[2]], [], ctx2, "仿寫（換情況）");
    l2.blanks[0].dataset.ans = ""; l2.blanks[0].textContent = "　　　　";
    const chips2 = el("div", { class: "bank" }); J.s2.opts.forEach(t => { const b = el("button", { type: "button", class: "chip" }, t); b.onclick = () => { l2.blanks[0].textContent = t; l2.blanks[0].classList.add("ok"); if (!proj()) logText(qid2, `${s2t[0]}${t}${s2t[2]}`); s2.classList.add("answered"); l2.parentNode.classList.add("answered"); }; chips2.append(b); });
    const qid2 = qid("② 仿寫：只換情況");
    const st2 = el("div", { class: "stem big-line" }); st2.append(l2);
    const s2 = slide("", kick("② 仿寫：只換「情況」"), el("div", { class: "hint" }, "選一個情況放進空格，唸唸看。"), blocks(["", J.demo[1], J.demo[2]]), st2, chips2);
    if (T === "std" && J.ladder) {
      /* 學生練習：看示範之後，每一題都用提示階梯（詞卡排句 → 句框＋詞庫 → 句框 → 自己造句） */
      const jl = (P, k, i, pat) => ladderSlide({ type: "jx", label: `${pat} 第 ${i + 1} 題`, kick: `${pat}　第 ${i + 1} 題`, ref: P.cards.join(""), stem: P.pic ? [el("div", { class: "ladpic" }, pic(P.pic, "看圖說說看")), el("div", { class: "hint", style: "text-align:center" }, "看圖，說說看圖裡有什麼。")] : null,
        makers: [() => ordBox(P.cards, `${pat}${i + 1}：詞卡排句`), () => fillBox(P.fill, P.bank, `${pat}${i + 1}：句框＋詞庫`),
          () => openBox(`照著句框，用「${pat}」說或寫一句。`, k.frame3, k.kws, `${pat}${i + 1}：句框`), () => openBox(`用「${pat}」自己造一句。`, "", k.kws, `${pat}${i + 1}：自己造句`)] });
      const B = L.bd;
      const bd1 = slide("", kick("看示範"), el("div", { class: "stem big-line" }, B.lkws.reduce((t, k) => t.split(k).join(`\u0001${k}\u0002`), B.demo).replace(/\u0001/g, '<b class="kw">').replace(/\u0002/g, "</b>")), el("div", { class: "hint" }, B.hint), sayBtn(B.demo, "唸句子"));
      const secs = [{ name: J.pat, hint: "先看示範，再一題一題練習。需要時按「給我提示」。", slides: [s1, ...J.ladder.map((P, i) => jl(P, J, i, J.pat))] },
        { name: B.pat, hint: "看示範 → 想一想 → 看圖練習。需要時按「給我提示」。", slides: (() => {
          /* ① 看示範：課文句子分成四塊上色 */
          const C4 = ["b1", "b2", "b2", "b3"]; const blk = el("div", { class: "blocks" }); B.demoParts.forEach((t, k) => blk.append(el("span", { class: "blk " + C4[k] }, t))); blk.append(el("span", { class: "blk" }, "。"));
          const lg = el("div", { class: "blegend" }); B.blocks.forEach((t, k) => k !== 2 && lg.append(el("span", { class: "blk " + C4[k] }, t)));
          const b1 = slide("", kick("① 看示範"), el("div", { class: "stem" }, "課文裡的句子："), blk, lg, el("div", { class: "hint big-line" }, B.explain), sayBtn(B.demoParts.join("") + "。", "唸句子"));
          /* ② 想一想：哪一句用對了 */
          const c = choiceQ(mk(B.think.q), B.think.opts, B.think.ans, `${B.pat}：想一想`); const b2 = slide("", kick("② 想一想"), sayRow(c), c, refBox(esc(B.think.why))); b2.reveal = c.reveal;
          return [b1, b2, ...B.ladder.map((P, i) => jl(P, { frame3: B.frame3, kws: B.lkws }, i, B.pat))];
        })() },
        { name: "完成", slides: [finishSlide()] }];
      return deck(secs, { submit: true });
    }
    /* ③ 替換：換情況和做什麼 */
    const s3 = swapSlide(J, T);
    const slides = [s1, s2, s3];
    if (T !== "base") {
      /* ④ 半開放 */
      J.s4.forEach((x, i) => { const w = writeBox(`④ 半開放${i + 1}：${x.pre}`); w.querySelector("textarea").value = x.pre; const s = slide("", kick("④ 補完句子"), el("div", { class: "stem big-line" }, `${x.pre}……`), w, refBox(esc(x.pre + x.ref + "。"))); slides.push(s); });
      /* ⑤ 自己造句 */
      { const w = writeBox(`⑤ 自己造句（${J.pat}）`); const c = el("div", { class: "selfck only-stu" }); c.append(el("div", { class: "hint" }, "寫完檢查："), checklist(ck)); slides.push(slide("", kick("⑤ 自己造句"), el("div", { class: "stem" }, `用「${J.pat}」自己造一句。`), legend.cloneNode(true), w, c, refBox(esc(J.s5ref)))); }
      /* ⑥ 接成兩句 */
      { const w = writeBox("⑥ 接成兩句"); const c = el("div", { class: "selfck only-stu" }); c.append(el("div", { class: "hint" }, "寫完檢查："), checklist([`第一句用到「${J.pat}」`, "第二句和第一句在說同一件事", "兩句都有標點符號"])); slides.push(slide("", kick("⑥ 接成兩句"), el("div", { class: "stem" }, "在自己的句子後面，寫出有關係的第二句。"), w, c, refBox(esc(J.s6ref)))); }
    } else {
      /* 基礎層：詞卡排句、口說，最後給參考例句 */
      slides.push(cardOrderSlide(J.cards, "詞卡排句"));
      slides.push(slide("", kick("參考例句"), el("div", { class: "refcard big-line" }, esc(J.baseRef)), sayBtn(J.baseRef, "唸例句")));
    }
    const secs = [{ name: J.pat, hint: T === "base" ? "看示範 → 換情況 → 換情況和做什麼 → 排排看" : "看示範 → 仿寫 → 替換 → 補完 → 自己造句 → 接成兩句", slides, seq: true }];
    if (T !== "base") {
      const B = L.bd;
      const bd1 = slide("", kick("看示範"), el("div", { class: "stem big-line" }, B.kws.reduce((t, k) => t.split(k).join(`\u0001${k}\u0002`), B.demo).replace(/\u0001/g, '<b class="kw">').replace(/\u0002/g, "</b>")), el("div", { class: "hint" }, B.hint), sayBtn(B.demo, "唸句子"));
      const w2 = writeBox(`${B.pat}：仿寫`); w2.querySelector("textarea").value = B.copy.pre;
      const bd2 = slide("", kick("仿寫"), el("div", { class: "stem big-line" }, `${B.copy.pre}〔　〕。`), w2, refBox(esc(B.copy.pre + B.copy.ref + "。")));
      const w3 = writeBox(`${B.pat}：自己造句`); const c3 = el("div", { class: "selfck only-stu" }); c3.append(el("div", { class: "hint" }, "寫完檢查："), checklist(B.ck));
      const bd3 = slide("", kick("自己造句"), el("div", { class: "stem" }, `用「${B.pat}」自己造一句。`), w3, c3, refBox(esc(B.ownRef)));
      secs.push({ name: B.pat, slides: [bd1, bd2, bd3], seq: true });
      secs.push({ name: "照樣寫", hint: "照著課文的句子，換上自己的詞。", slides: L.phrase.map((p, i) => { const w = writeBox(`照樣寫${i + 1}`); return slide("", kick(p.pat), el("div", { class: "stem big-line" }, `課文：${p.orig}`), el("div", { class: "stem big-line" }, p.stem.map(x => x === 0 ? "〔　〕" : x).join("")), w, refBox(esc(p.ref))); }) });
    }
    if (T !== "proj") secs.push({ name: "完成", slides: [finishSlide()] });
    return deck(secs, { submit: T !== "proj" });
  },

  zyrz() {
    const zq = L.zyq.map((x, i) => listenSlide(x.c, [x.z, ...x.d], 0, `聽音選注音：${x.c}`, { cls: "zyopt", html: z => `<span class="ui zyo">${z}</span>`, stem: el("div", { class: "bigchar nozy" }, x.c), hint: "聽一聽，選出對的注音。" }));
    const zw = L.zyw.map((x, i) => listenSlide(x.w, [x.z, ...x.d], 0, `拼讀詞語：${x.w}`, { cls: "zyopt", html: z => `<span class="ui zyo">${z}</span>`, stem: el("div", { class: "bigword nozy" }, x.w), hint: "聽詞語，選出對的注音。" }));
    const rd = [...L.must.map(ch => { const c = L.cards.find(x => x.c === ch); const done = selfRead(`認讀：${ch}`); const sb = sayBtn(() => `${ch}，${c.word}的${ch}`, "對答案"); sb.hidden = !proj(); sb.classList.add("bigsay");
        const b = el("button", { type: "button", class: "btn solid only-stu" }, "我讀完了"); b.onclick = () => { done(); b.remove(); sb.hidden = false; sb.click(); };
        return slide("", el("div", { class: "flashc" }, `<span class="bigchar nozy must">${ch}</span>`), el("div", { class: "hint", style: "text-align:center" }, "先自己讀一次，再按喇叭對答案。"), tools(b, sb)); }),
      ...L.radsort.map(R => slide("", el("div", { class: "radcard" }, `${pic(R.img, R.r)}<span class="bigchar nozy">${R.r}</span>`), el("div", { class: "hint", style: "text-align:center" }, R.note.replace("這些字", "有這個部首的字")), sayBtn(`${R.r}部`, "唸部首")))];
    const secs = [{ name: "聽音選注音", hint: "每次做一小段就好。", slides: zq }, { name: "拼讀詞語", slides: zw }, { name: "認讀", hint: "必學字與部首卡。", slides: rd }];
    if (!proj()) secs.push({ name: "完成", slides: [finishSlide()] });
    return deck(secs, { submit: !proj() });
  },

  review() {
    const T = tier();
    if (T === "base") {
      const s = L.rvb.map((x, i) => x.pics ? listenSlide(x.say, x.pics, 0, `綜合練習${i + 1}`, { html: y => pic(y[1], y[0]), cls: "lpic", stem: el("div", { class: "stem" }, x.q) }) : listenSlide(x.say, x.opts, 0, `綜合練習${i + 1}`, { cls: "bigc", stem: el("div", { class: "stem" }, mk(x.q)) }));
      return deck([{ name: "聽題點選", hint: "聽題目，按出答案。", slides: s }, { name: "完成", slides: [finishSlide()] }], { submit: true });
    }
    const out = [];
    L.rvs.forEach((x, i) => {
      if (x.type === "write") x.items.forEach((it, k) => { const zyi = it[2]; const show = it.slice(0, 2).map((t, j) => j === zyi ? `<span class="ui zyk">${t}</span>` : nz(t)).join("");
        const p = produce({ only: "write", label: `寫國字：${it.slice(0, 2).join("")}`, answer: it[3], check: t => t === it[3] ? { st: "ok" } : { st: "no", msg: "不是這個字" } });
        const s = slide("", kick(x.k), el("div", { class: "stem big-line" }, `寫出注音的國字：${show}`), p); s.reveal = p.reveal; out.push(s); });
      else if (x.type === "fix") { const p = produce({ label: `改錯字：${x.s}`, answer: x.ans, check: t => t === x.ans ? { st: "ok" } : { st: "no", msg: "再找找看" }, hint: `錯的字是「${x.wrong}」` });
        const s = slide("", kick(x.k), el("div", { class: "stem big-line" }, `句子裡有一個錯字，寫出正確的字：<br>${nz(x.s)}`), p); s.reveal = p.reveal; out.push(s); }
      else if (x.type === "choice") { const poly = x.k === "多音字"; const c = choiceQ(poly ? x.q.replace(/(濟+)/g, m => nz(m)) : x.q, x.opts.map(o => poly ? `<span class="ui">${o}</span>` : o), x.ans, `${x.k}：${plainText(x.q)}`); const s = slide("", kick(x.k), poly ? null : sayRow(c), c); s.reveal = c.reveal; out.push(s); }
      else if (x.type === "own") { const w = writeBox(`造句：${x.pat}`); out.push(slide("", kick(x.k), el("div", { class: "stem" }, `用「${x.pat}」造一句。`), w)); }
    });
    if (T === "proj") return deck([{ name: "綜合練習", slides: out }]);
    return deck([{ name: "綜合練習", hint: "整課重點複習。", slides: out }, { name: "完成", slides: [finishSlide()] }], { submit: true });
  },
};

/* 部首歸類：按出有這個部首的字 */
function radSortSlide(R) {
  const all = L.radsort; const others = all.filter(x => x !== R).flatMap(x => [...x.must, ...x.known]);
  const right = [...R.must, ...R.known]; const opts = shuffle([...right, ...shuffle(others).slice(0, 3)]);
  const qs = {}; const box = el("div", { class: "rsort" }); let left = right.length;
  const res = el("div", { class: "pres", "aria-live": "polite" });
  opts.forEach(ch => { const b = el("button", { type: "button", class: "rchip nozy" + (R.must.includes(ch) ? " must" : "") }, ch); const ok = right.includes(ch);
    b.onclick = () => { if (b.classList.contains("ok")) return; if (proj()) { b.classList.toggle("sel"); return; } const q = qs[ch] || (qs[ch] = qid(`部首歸類「${R.r}」：${ch}`)); logAns(q, ok, ch);
      if (ok) { b.classList.add("ok"); if (--left === 0) { box.classList.add("answered"); res.innerHTML = `<span class="okmsg">√ 全部找到了！</span>${R.note}`; } } else { b.classList.add("no", "shake"); setTimeout(() => b.classList.remove("no", "shake"), 500); res.innerHTML = `<span class="nomsg">「${nz(ch)}」沒有「${R.r}」。</span>`; } };
    box.append(b); });
  const s = slide("", el("div", { class: "radcard sm" }, `${pic(R.img, R.r)}<span class="bigchar nozy">${R.r}</span>`), el("div", { class: "hint", style: "text-align:center" }, `按出有「${R.r}」的字（共 ${right.length} 個）。`), box, res);
  s.reveal = () => { box.querySelectorAll(".rchip").forEach(b => { if (right.includes(b.textContent)) b.classList.add("ok"); }); res.innerHTML = R.note; };
  return s;
}
/* 替換：情況、做什麼兩排詞卡各自打亂，配成合理的一組 */
function swapSlide(J, T) {
  const P = J.s3.pairs; const q = qid("③ 替換：換情況和做什麼"); let selA = null, selB = null, n = 0;
  const line = el("div", { class: "stem big-line" }); const paint = () => { const ST = J.swapT; line.innerHTML = `${ST[0]}<span class="slot2 b1">${selA === null ? "情況" : P[selA][0]}</span>${ST[1]}<span class="slot2 b3">${selB === null ? "做什麼" : P[selB][1]}</span>${ST[2]}`; };
  const msg = el("div", { class: "segmsg", "aria-live": "polite" }); const got = el("ol", { class: "cgot" });
  const colA = el("div", { class: "ccol" }), colB = el("div", { class: "ccol" });
  colA.append(el("div", { class: "chead" }, '<span class="blk b1">情況</span>')); colB.append(el("div", { class: "chead" }, '<span class="blk b3">做什麼</span>'));
  const bA = shuffle(P.map((x, k) => k)).map(k => { const b = el("button", { type: "button", class: "ccard" }, P[k][0]); b.onclick = () => { bA.forEach(x => x.classList.remove("sel")); b.classList.add("sel"); selA = k; paint(); check(); }; colA.append(b); return b; });
  const bB = shuffle(P.map((x, k) => k)).map(k => { const b = el("button", { type: "button", class: "ccard" }, P[k][1]); b.onclick = () => { bB.forEach(x => x.classList.remove("sel")); b.classList.add("sel"); selB = k; paint(); check(); }; colB.append(b); return b; });
  const used = new Set();
  function check() {
    if (selA === null || selB === null) return; const s = J.swapT[0] + P[selA][0] + J.swapT[1] + P[selB][1] + J.swapT[2]; const key = selA + "-" + selB;
    if (used.has(key)) { msg.innerHTML = '<span class="hint">這一句已經組過了。</span>'; return; }
    if (selA === selB) { used.add(key); n++; if (!proj()) logAns(q, true, s); msg.innerHTML = '<span class="okmsg">√ 通順！</span>'; got.append(el("li", {}, s)); }
    else { msg.innerHTML = '<span class="pendmsg">唸唸看：前後合理嗎？</span>'; const a = el("button", { type: "button", class: "btn only-stu" }, "我覺得合理，請老師看"); a.onclick = () => { used.add(key); n++; logText(q, `${s}（學生覺得合理，待老師確認）`); got.append(el("li", { class: "pend" }, s + ' <small>老師會確認</small>')); msg.innerHTML = ""; root.classList.add("pending"); }; msg.append(a); }
    if (n >= 2) root.classList.add("answered");
  }
  paint(); const cols = el("div", { class: "ccols" }); cols.append(colA, colB);
  const root = el("div", { class: "combo" }); root.append(line, msg, cols, got);
  const s = slide("", kick("③ 替換：換「情況」和「做什麼」"), el("div", { class: "hint" }, "左邊選一個情況，右邊選一件事，組成合理的句子。至少組兩句。"), root);
  s.reveal = () => { got.innerHTML = ""; P.forEach(p => got.append(el("li", {}, J.swapT[0] + p[0] + J.swapT[1] + p[1] + J.swapT[2]))); };
  return s;
}
/* 詞卡排句：依序按詞卡排成句子，也可以用說的 */
function cardOrderSlide(cards, label) {
  const q = qid(label); const box = el("div", { class: "ord" }); const line = el("div", { class: "ordline big-line" }); const pool = el("div", { class: "bank" });
  let seq = []; const res = el("div", { class: "pres", "aria-live": "polite" });
  const paint = () => { line.innerHTML = seq.length ? seq.map(k => `<span class="wchip">${cards[k]}</span>`).join("") : '<span class="hint">按下面的詞卡排成句子</span>'; };
  const btns = shuffle(cards.map((c, k) => k)).map(k => { const b = el("button", { type: "button", class: "chip" }, cards[k]); b.onclick = () => { if (box.classList.contains("answered")) return; seq.push(k); b.disabled = true; paint();
      if (seq.length === cards.length) { const ok = seq.every((x, i) => x === i); const s = seq.map(x => cards[x]).join(""); logAns(q, ok, s); if (ok) { box.classList.add("answered"); res.innerHTML = '<span class="okmsg">√ 排對了！唸唸看。</span>'; res.append(sayBtn(cards.join("").replace("放晴", "放晴，"), "唸句子")); } else { res.innerHTML = '<span class="nomsg">唸唸看，順不順？</span>再排一次。'; setTimeout(() => { seq = []; btns.forEach(x => x.disabled = false); paint(); }, 900); } } }; pool.append(b); return b; });
  const back = el("button", { type: "button", class: "btn" }, "退一張"); back.onclick = () => { if (box.classList.contains("answered") || !seq.length) return; const k = seq.pop(); btns.find(b => b.textContent === cards[k]).disabled = false; paint(); };
  paint(); box.append(line, pool, tools(back), res);
  const s = slide("", kick("詞卡排句"), el("div", { class: "inst" }, "照順序按詞卡，排成一句話。排好後大聲唸一次。"), box);
  s.reveal = () => { seq = cards.map((c, k) => k); paint(); }; return s;
}

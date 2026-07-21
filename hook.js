/* kniveswear hook — рамки редкости поверх штатного каталога Tilda.
 * Дизайн: светлый минимализм сайта + цветовой код редкости WoW.
 * Обычные вещи не трогаем вовсе — горят только редкие и выше.
 *
 * Подключён в Настройки сайта → HTML-код для вставки:
 *   <script src="https://dmchinarev-maker.github.io/kniveswear-hook/hook.js" defer></script>
 * Правится этот файл в репо kniveswear-hook; GitHub Pages кэширует ~10 мин.
 */
(() => {
  "use strict";
  const VERSION = "0.3.0";

  /* ==== ДРОП: таймер над каталогом ==== */
  const DROP = {
    title: "Новый дроп — 25 августа",
    doneTitle: "Новый дроп — уже в продаже",
    at: new Date("2026-08-25T00:00:00+03:00"),   // полночь по Москве
  };

  /* ==== ПРАВИЛА РЕДКОСТИ: подстрока названия (lowercase) → грейд ====
   * Первое совпадение побеждает. Нет совпадения — карточка остаётся чистой.
   * Грейды: rare (синий) / epic (фиолетовый) / legend (оранжевый).
   */
  const RARITY_RULES = [
    { match: "сюртук",  rarity: "legend" },
    { match: "пончо",   rarity: "epic"   },
    { match: "плащ",    rarity: "epic"   },
    { match: "куртка",  rarity: "epic"   },
    { match: "брюки",   rarity: "rare"   },
    { match: "туника",  rarity: "rare"   },
    // добавляй свои правила выше этой строки
  ];

  const RAR = {
    rare:   { label: "Редкая вещь",       c: "#0070dd", glow: "rgba(0,112,221,.16)" },
    epic:   { label: "Эпическая вещь",    c: "#a335ee", glow: "rgba(163,53,238,.16)" },
    legend: { label: "Легендарная вещь",  c: "#f07800", glow: "rgba(240,120,0,.18)" },
  };

  /* ==== СТИЛИ: тонко, светло, в шрифте сайта ==== */
  const css = `
  .kw-card{position:relative;transition:transform .22s ease}
  .kw-card:hover{transform:translateY(-3px)}

  /* тонкая рамка: едва заметна в покое, цвет грейда на ховере */
  .kw-card::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:3;
    border:1px solid var(--kw-c);opacity:.22;
    transition:opacity .25s ease, box-shadow .3s ease}
  .kw-card:hover::before{opacity:1;
    box-shadow:0 10px 34px var(--kw-glow), 0 2px 10px var(--kw-glow)}

  /* уголки-визиры — появляются на ховере */
  .kw-tick{position:absolute;width:14px;height:14px;z-index:4;pointer-events:none;
    opacity:0;transition:opacity .25s ease, transform .25s ease;transform:scale(.6)}
  .kw-card:hover .kw-tick{opacity:1;transform:scale(1)}
  .kw-tick::before{content:"";position:absolute;inset:0;
    border-top:2px solid var(--kw-c);border-left:2px solid var(--kw-c)}
  .kw-tick.tl{top:-5px;left:-5px}
  .kw-tick.tr{top:-5px;right:-5px;transform:scale(.6) rotate(90deg)}
  .kw-card:hover .kw-tick.tr{transform:scale(1) rotate(90deg)}
  .kw-tick.br{bottom:-5px;right:-5px;transform:scale(.6) rotate(180deg)}
  .kw-card:hover .kw-tick.br{transform:scale(1) rotate(180deg)}
  .kw-tick.bl{bottom:-5px;left:-5px;transform:scale(.6) rotate(270deg)}
  .kw-card:hover .kw-tick.bl{transform:scale(1) rotate(270deg)}

  /* имя вещи — цвет грейда, всегда (главный вовский сигнал) */
  .kw-card .t-store__card__title,
  .kw-card .js-store-prod-name{color:var(--kw-c)!important}

  /* лейбл: белая плашка, тонкая линия грейда, шрифт сайта */
  .kw-badge{position:absolute;top:10px;left:10px;z-index:4;pointer-events:none;
    font-family:'TildaSans',Arial,sans-serif;font-size:10px;font-weight:600;
    line-height:1;letter-spacing:.14em;text-transform:uppercase;
    color:var(--kw-c);background:rgba(255,255,255,.94);
    border:1px solid var(--kw-c);padding:5px 8px 4px;
    opacity:.92;transition:opacity .25s ease}
  .kw-card:hover .kw-badge{opacity:1}

  /* лёгкий постоянный акцент легендарки — тонкое тёплое свечение */
  .kw-card[data-kw-done="legend"]::before{opacity:.45;
    box-shadow:0 4px 22px rgba(240,120,0,.10)}

  /* полоса дропа: тонкие линии, шрифт сайта, табличные цифры */
  .kw-drop{max-width:1160px;margin:28px auto 6px;padding:13px 20px;
    display:flex;align-items:center;justify-content:center;gap:10px 22px;flex-wrap:wrap;
    border-top:1px solid #111;border-bottom:1px solid #111;background:#fff;
    font-family:'TildaSans',Arial,sans-serif;color:#111}
  .kw-drop i{width:7px;height:7px;background:#f07800;transform:rotate(45deg);flex:none}
  .kw-drop b{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
  .kw-drop time{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums;
    letter-spacing:.06em;white-space:nowrap}
  .kw-drop small{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888}
  @media (max-width:560px){.kw-drop{gap:6px 14px}.kw-drop b{font-size:11.5px}}

  @media (prefers-reduced-motion:reduce){
    .kw-card,.kw-card::before,.kw-tick,.kw-badge{transition:none!important}
  }`;

  function injectStyles() {
    if (document.getElementById("kw-hook-css")) return;
    const s = document.createElement("style");
    s.id = "kw-hook-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ==== ЛОГИКА ==== */
  function rarityFor(title) {
    const t = (title || "").toLowerCase();
    for (const rule of RARITY_RULES)
      if (t.includes(rule.match)) return rule.rarity;
    return null;
  }

  function titleOf(card) {
    const el = card.querySelector(".t-store__card__title, .js-store-prod-name");
    return el ? el.textContent.trim() : "";
  }

  function decorate(card) {
    if (card.dataset.kwDone) return;
    const title = titleOf(card);
    if (!title) return;                 // карточка ещё дорисовывается — зайдём позже
    const rar = rarityFor(title);
    if (!rar) { card.dataset.kwDone = "skip"; return; }
    const r = RAR[rar];
    card.dataset.kwDone = rar;
    card.classList.add("kw-card");
    card.style.setProperty("--kw-c", r.c);
    card.style.setProperty("--kw-glow", r.glow);
    const badge = document.createElement("span");
    badge.className = "kw-badge";
    badge.textContent = r.label;
    card.appendChild(badge);
    for (const pos of ["tl", "tr", "bl", "br"]) {
      const t = document.createElement("span");
      t.className = "kw-tick " + pos;
      card.appendChild(t);
    }
  }

  function scan() {
    document.querySelectorAll(".t-store__card:not([data-kw-done])")
      .forEach(decorate);
    mountDropBar();
  }

  /* ==== таймер дропа: полоса перед блоком каталога ==== */
  function mountDropBar() {
    if (document.getElementById("kw-drop")) return;
    const store = document.querySelector(".t-store");
    if (!store) return;                       // на страницах без каталога не показываем
    const rec = store.closest('[id^="rec"]') || store;
    const bar = document.createElement("div");
    bar.id = "kw-drop";
    bar.className = "kw-drop";
    bar.innerHTML = `<i></i><b></b><time></time><small>дней · часы : мин : сек</small>`;
    rec.parentNode.insertBefore(bar, rec);
    const title = bar.querySelector("b"), t = bar.querySelector("time"),
          hint = bar.querySelector("small");
    const pad = n => String(n).padStart(2, "0");
    function render() {
      let s = Math.floor((DROP.at - Date.now()) / 1000);
      if (s <= 0) {
        title.textContent = DROP.doneTitle;
        t.textContent = ""; hint.textContent = "";
        clearInterval(timerId);
        return;
      }
      title.textContent = DROP.title;
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600);  s %= 3600;
      t.textContent = `${d} · ${pad(h)}:${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    }
    render();
    const timerId = setInterval(render, 1000);
  }

  function start() {
    injectStyles();
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    console.log("[kniveswear-hook] v" + VERSION + " активен");
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();
})();

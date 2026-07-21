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
  const VERSION = "0.9.3";

  /* ==== ДРОП: таймер над каталогом ==== */
  const DROP = {
    title: "Новый дроп — 25 августа",
    doneTitle: "Новый дроп — уже в продаже",
    at: new Date("2026-08-25T00:00:00+03:00"),   // полночь по Москве
  };

  /* ==== ПРАВИЛА РЕДКОСТИ: подстрока названия (lowercase) → грейд ====
   * Первое совпадение побеждает. Нет совпадения — DEFAULT_RARITY (обычная).
   * Грейды: common (серый) / rare (синий) / epic (фиолетовый) / legend (оранжевый).
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
    rare:   { label: "Редкая",       c: "#0070dd", glow: "rgba(0,112,221,.16)" },
    epic:   { label: "Эпическая",    c: "#a335ee", glow: "rgba(163,53,238,.16)" },
    legend: { label: "Легендарная",  c: "#f07800", glow: "rgba(240,120,0,.18)" },
  };
  // всё, что не совпало ни с одним правилом, получает этот грейд
  const DEFAULT_RARITY = "rare";

  /* ==== СТИЛИ: тонко, светло, в шрифте сайта ==== */
  const css = `
  .kw-card{position:relative;transition:transform .22s ease}
  .kw-card:hover{transform:translateY(-3px)}

  /* РЕДКИЕ/ЭПИКИ — «ОРЕОЛ»: ни одной линии, мягкое свечение грейда
     + световая полоса, разгорающаяся под фото */
  .kw-card{transition:transform .22s ease, box-shadow .35s ease}
  .kw-card:hover{box-shadow:0 6px 40px var(--kw-glow), 0 2px 14px var(--kw-glow)}
  .kw-card .t-store__card__imgwrapper::before{content:"";position:absolute;
    left:0;right:0;bottom:0;height:3px;z-index:3;pointer-events:none;
    background:linear-gradient(90deg,transparent,var(--kw-c),transparent);
    transform:scaleX(0);transition:transform .4s cubic-bezier(.22,1,.36,1)}
  .kw-card:hover .t-store__card__imgwrapper::before{transform:scaleX(1)}

  /* ЛЕГЕНДАРКА — «ЖИВАЯ КРОМКА»: градиент грейда бежит по периметру.
     Сама карточка удлинена вниз (padding) — цена не липнет к её краю,
     белое тело доходит до рамки */
  .kw-card[data-kw-done="legend"]{padding-bottom:26px;background:#fff}
  @property --kw-a{syntax:"<angle>";initial-value:0deg;inherits:false}
  .kw-card[data-kw-done="legend"]::before{content:"";position:absolute;
    inset:-2px;padding:2px;pointer-events:none;z-index:3;opacity:0;
    background:conic-gradient(from var(--kw-a),var(--kw-c),transparent 25%,
      var(--kw-c) 50%,transparent 75%,var(--kw-c));
    -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
    -webkit-mask-composite:xor;mask-composite:exclude;
    transition:opacity .3s ease}
  .kw-card[data-kw-done="legend"]:hover::before{opacity:1;
    animation:kwSpin 2.8s linear infinite}
  @keyframes kwSpin{to{--kw-a:360deg}}
  .kw-card[data-kw-done="legend"] .t-store__card__imgwrapper::before{display:none}

  /* имя вещи — чёрное в покое, цвет грейда на ховере */
  .kw-card .t-store__card__title,
  .kw-card .js-store-prod-name{transition:color .25s ease}
  .kw-card:hover .t-store__card__title,
  .kw-card:hover .js-store-prod-name{color:var(--kw-c)!important}

  /* лейбл: у ВСЕХ грейдов — белая плашка сверху по центру, врезанная
     в верхний край (у легендарки она разрезает кант); скрыт до ховера */
  .kw-badge{position:absolute;top:-9px;left:50%;z-index:5;pointer-events:none;
    font-family:'TildaSans',Arial,sans-serif;font-size:10px;font-weight:600;
    line-height:1;letter-spacing:.16em;text-transform:uppercase;
    color:var(--kw-c);background:#fff;padding:3px 12px;
    opacity:0;transform:translate(-50%,4px);white-space:nowrap;
    transition:opacity .25s ease, transform .3s cubic-bezier(.22,1,.36,1)}
  .kw-card:hover .kw-badge{opacity:1;transform:translate(-50%,0)}

  /* блик света по фото на ховере */
  .kw-card .t-store__card__imgwrapper{position:relative;overflow:hidden}
  .kw-card .t-store__card__imgwrapper::after{content:"";position:absolute;inset:0;
    pointer-events:none;z-index:2;transform:translateX(-130%);
    background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.45) 50%,transparent 58%)}
  .kw-card:hover .t-store__card__imgwrapper::after{animation:kwGlint .8s ease}
  @keyframes kwGlint{0%{transform:translateX(-130%)}60%,100%{transform:translateX(130%)}}

  /* полоса дропа: тонкие линии, шрифт сайта, табличные цифры */
  .kw-drop{max-width:1160px;margin:28px auto 6px;padding:13px 20px;
    display:flex;align-items:center;justify-content:center;gap:10px 22px;flex-wrap:wrap;
    border-top:1px solid #111;border-bottom:1px solid #111;background:#fff;
    font-family:'TildaSans',Arial,sans-serif;color:#111}
  .kw-drop i{width:7px;height:7px;background:#f07800;transform:rotate(45deg);flex:none}
  .kw-drop b{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
  .kw-drop time{font-size:15px;font-weight:500;font-variant-numeric:tabular-nums;
    letter-spacing:.04em;white-space:nowrap;color:#111}
  .kw-drop time em{font-style:normal;color:#888;font-size:13px;margin:0 2px}
  @media (max-width:560px){.kw-drop{gap:6px 14px}.kw-drop b{font-size:11.5px}}

  /* тач-устройства: ховера нет — всё видно постоянно */
  @media (hover:none){
    .kw-badge{opacity:1;transform:translate(-50%,0)}
    .kw-card .t-store__card__title,
    .kw-card .js-store-prod-name{color:var(--kw-c)!important}
    .kw-card .t-store__card__imgwrapper::before{transform:scaleX(1)}
    .kw-card[data-kw-done="legend"]::before{opacity:.6}
  }

  @media (prefers-reduced-motion:reduce){
    .kw-card,.kw-card::before,.kw-badge{transition:none!important}
    .kw-card::before,.kw-card .t-store__card__imgwrapper::after{animation:none!important}
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
    return DEFAULT_RARITY;
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
    const r = RAR[rar];
    card.dataset.kwDone = rar;
    card.classList.add("kw-card");
    card.style.setProperty("--kw-c", r.c);
    card.style.setProperty("--kw-glow", r.glow);
    const badge = document.createElement("span");
    badge.className = "kw-badge";
    badge.textContent = r.label;
    card.appendChild(badge);
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
    bar.innerHTML = `<i></i><b></b>`;
    rec.parentNode.insertBefore(bar, rec);
    bar.querySelector("b").textContent =
      Date.now() < DROP.at ? DROP.title : DROP.doneTitle;
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

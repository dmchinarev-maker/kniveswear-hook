/* kniveswear hook — WoW-оклады редкости поверх штатного каталога Tilda.
 * Подключается одной строкой в Настройки сайта → HTML-код для вставки:
 *   <script src="https://<host>/hook.js" defer></script>
 * Ничего в Тильде не ломает: только добавляет классы/стили карточкам
 * t-store. Правится этот файл — сайт подхватывает после обновления CDN.
 */
(() => {
  "use strict";
  const VERSION = "0.1.0";

  /* ==== КОНФИГ: подстрока названия (в нижнем регистре) → грейд ====
   * Грейды: common (серый) / rare (синий) / epic (фиолетовый) / legend (оранжевый).
   * Совпадение ищется по вхождению; первое сработавшее правило побеждает.
   * Всё, что не совпало, остаётся без оклада (обычная карточка Тильды).
   */
  const RARITY_RULES = [
    { match: "плащ с каллиграфией", rarity: "legend" },
    { match: "плащ",                rarity: "epic"   },
    { match: "брюки knives с крестом", rarity: "epic" },
    { match: "брюки",               rarity: "rare"   },
    { match: "куртка",              rarity: "epic"   },
    { match: "худи",                rarity: "rare"   },
    { match: "лонгслив",            rarity: "rare"   },
    { match: "футболка",            rarity: "common" },
    // добавляй свои правила выше этой строки
  ];

  const RAR = {
    common: { label: "Обычная",      c: "#c8c8c8", glow: "rgba(200,200,200,.30)" },
    rare:   { label: "Редкая",       c: "#3f8fe8", glow: "rgba(63,143,232,.45)" },
    epic:   { label: "Эпическая",    c: "#a335ee", glow: "rgba(163,53,238,.50)" },
    legend: { label: "Легендарная",  c: "#ff8000", glow: "rgba(255,128,0,.50)" },
  };

  /* ==== СТИЛИ ==== */
  const css = `
  .kw-card{position:relative;transition:transform .2s ease}
  .kw-card:hover{transform:translateY(-4px)}
  .kw-card::before{content:"";position:absolute;inset:-1px;pointer-events:none;z-index:3;
    border:1px solid var(--kw-c);
    box-shadow:inset 0 0 0 1px rgba(201,162,75,.28), 0 0 0px var(--kw-glow);
    opacity:.55;transition:opacity .25s ease, box-shadow .25s ease}
  .kw-card:hover::before{opacity:1;
    box-shadow:inset 0 0 0 1px var(--kw-c), 0 0 26px var(--kw-glow)}
  .kw-card .t-store__card__title,
  .kw-card .js-store-prod-name{color:var(--kw-c)!important;
    text-shadow:0 0 14px var(--kw-glow)}
  .kw-badge{position:absolute;top:10px;left:10px;z-index:4;pointer-events:none;
    font:700 10.5px/1 Georgia,serif;letter-spacing:.18em;text-transform:uppercase;
    color:var(--kw-c);background:rgba(10,7,4,.85);border:1px solid var(--kw-c);
    padding:4px 9px}
  .kw-gem{position:absolute;width:8px;height:8px;z-index:4;pointer-events:none;
    transform:rotate(45deg);
    background:linear-gradient(135deg,#f2d488,#c9a24b 55%,#6b5323);
    box-shadow:0 0 0 1px #241a0d, 0 0 6px rgba(201,162,75,.5);
    transition:background .25s ease}
  .kw-card:hover .kw-gem{background:linear-gradient(135deg,#fff,var(--kw-c) 55%,#241a0d);
    box-shadow:0 0 0 1px #241a0d, 0 0 9px var(--kw-glow)}
  .kw-gem.tl{top:-4px;left:-4px}.kw-gem.tr{top:-4px;right:-4px}
  .kw-gem.bl{bottom:-4px;left:-4px}.kw-gem.br{bottom:-4px;right:-4px}
  @media (prefers-reduced-motion:reduce){
    .kw-card,.kw-card::before,.kw-gem{transition:none!important}
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
    const rar = rarityFor(titleOf(card));
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
      const g = document.createElement("span");
      g.className = "kw-gem " + pos;
      card.appendChild(g);
    }
  }

  function scan() {
    document.querySelectorAll(".t-store__card:not([data-kw-done])")
      .forEach(decorate);
  }

  function start() {
    injectStyles();
    scan();
    // Каталог Тильды дорисовывается асинхронно — следим за DOM.
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    console.log("[kniveswear-hook] v" + VERSION + " активен");
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();
})();

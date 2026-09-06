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
  const VERSION = "1.8.6";

  /* ==== ДРОП: таймер над каталогом ==== */
  const DROP = {
    title: "Зимний дроп — 1 октября",
    doneTitle: "Зимний дроп — уже в продаже",
    at: new Date("2026-10-01T00:00:00+03:00"),   // полночь по Москве
  };

  /* ==== ПРАВИЛА РЕДКОСТИ: подстрока названия (lowercase) → грейд ====
   * Первое совпадение побеждает. Нет совпадения — DEFAULT_RARITY (обычная).
   * Грейды: common (серый) / rare (синий) / epic (фиолетовый) / legend (оранжевый).
   */
  const RARITY_RULES = [
    { match: "сюртук",  rarity: "legend" },
    { match: "пончо в клетку", rarity: "legend" },  // выше общего «пончо» — правило точнее
    { match: "пончо",   rarity: "epic"   },
    { match: "плащ",    rarity: "epic"   },
    { match: "куртка",  rarity: "epic"   },
    { match: "брюки",   rarity: "rare"   },
    { match: "туника",  rarity: "rare"   },
    // добавляй свои правила выше этой строки
  ];

  // c  — цвет рамки/свечения (яркий, «игровой»)
  // tc — цвет ТЕКСТА (плашка, имя): у легендарки затемнён до контраста ≥4.5:1
  const RAR = {
    rare:   { label: "Редкая",       c: "#0070dd", tc: "#0070dd", glow: "rgba(0,112,221,.16)" },
    epic:   { label: "Эпическая",    c: "#a335ee", tc: "#a335ee", glow: "rgba(163,53,238,.16)" },
    legend: { label: "Легендарная",  c: "#f07800", tc: "#a85400", glow: "rgba(240,120,0,.18)" },
  };
  // всё, что не совпало ни с одним правилом, получает этот грейд
  const DEFAULT_RARITY = "rare";

  /* ==== СТИЛИ: тонко, светло, в шрифте сайта ==== */
  const css = `
  /* убрана промо-плашка «-15% по промокоду firstblood» (Tilda-блок rec1661147731) */
  #rec1661147731{display:none!important}

  /* убраны ЗАЧЁРКНУТЫЕ (старые) цены — на карточках и на странице товара */
  .t-store__card__price_old,
  .t-store__prod-popup__price_old,
  .t-store__prod__price_old,
  .js-store-price-old,
  .js-store-prod-price-old{display:none!important}
  .kw-card{position:relative;transition:transform .22s ease}
  .kw-card:hover{transform:translateY(-3px)}

  /* РЕДКИЕ/ЭПИКИ — «ОРЕОЛ»: ни одной линии, мягкое свечение грейда
     + световая полоса, разгорающаяся под фото */
  /* белые поля карточки: сверху 14px (рамка ложится на белое, а не на фото),
     снизу 26px (цена не липнет к краю) */
  .t-store__card.kw-card{padding-top:14px !important;padding-bottom:26px !important;background:#fff}

  /* тильдовский значок SALE скрыт — редкость говорит сама за себя */
  .t-store__card__mark{display:none !important}
  /* рубрики над каталогом (импорт CSV навесил категории, пустое поле их не снимает) */
  .t-store__parts-switch-wrapper,.js-store-parts-switcher,.t-store__filter-wrapper{display:none !important}
  /* короткое описание на карточке: в каталоге только имя и цена */
  .t-store__card__descr{display:none !important}
  /* «Нет в наличии» на карточке */
  .t-store__card__price_soldout,.t-store__card__sold-out,.t-store__card__soldout,.kw-soldout-hidden{display:none !important}

  /* ==== ЛОР — ПОСЛЕДНИЙ РАЗДЕЛ ПАСПОРТА ====
     Карточка читается сверху вниз: характеристики → проверка → лор.
     Лор свёрнут: числа нужны всем, история — тем, кто задержался. */
  .kw-lore{border-top:1px solid #ececec;margin:0 -26px;padding:0 26px}
  .kw-lore-btn{position:relative;isolation:isolate;overflow:hidden;
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    width:100%;margin:0;padding:16px 0;
    border:0;border-radius:6px;
    background:transparent;color:#111;text-decoration:none;cursor:pointer;
    font-family:'TildaSans',Arial,sans-serif;font-size:12px;font-weight:600;
    letter-spacing:.2em;text-transform:uppercase;min-height:44px;line-height:20px;
    transition:color .18s ease, transform .18s cubic-bezier(.23,1,.32,1)}
  .kw-lore-btn>span{position:relative;z-index:1;padding-left:2px}
  /* шеврон: единственный индикатор состояния, поворачивается на раскрытии */
  .kw-chev{position:relative;z-index:1;width:8px;height:8px;flex:none;margin-right:2px;
    border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;
    transform:rotate(45deg) translateY(-2px);
    transition:transform .26s cubic-bezier(.23,1,.32,1)}
  .kw-lore.open .kw-chev{transform:rotate(-135deg) translateY(-2px)}
  /* раскрытие: grid 0fr→1fr — единственный способ анимировать «высоту по контенту» */
  .kw-lore-body{display:grid;grid-template-rows:0fr;
    transition:grid-template-rows .32s cubic-bezier(.23,1,.32,1)}
  .kw-lore.open .kw-lore-body{grid-template-rows:1fr}
  .kw-lore-in{overflow:hidden;opacity:0;transition:opacity .2s ease}
  .kw-lore.open .kw-lore-in{opacity:1;transition-delay:.1s}
  .kw-lore-tag{font-family:Georgia,serif;font-style:italic;font-size:15px;color:#555;
    margin:0 0 14px}
  .kw-lore-story p{font-size:14.5px;line-height:1.7;color:#333;margin:0 0 13px}
  .kw-lore-h{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8a8a8a;
    margin:20px 0 11px;padding-top:15px;border-top:1px solid #f0f0f0}
  .kw-lr{display:grid;grid-template-columns:120px 1fr;gap:14px;padding:8px 0;font-size:13.5px}
  .kw-lr .k{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;padding-top:3px}
  .kw-lr .v{color:#333;line-height:1.6}
  .kw-draft{display:inline-block;margin-left:8px;font-style:normal;font-size:9px;
    letter-spacing:.1em;text-transform:uppercase;color:#b3362c;border:1px solid #f0d4d0;padding:1px 6px}
  .kw-lore-full{display:inline-block;margin:18px 0 22px;font-size:11px;letter-spacing:.13em;
    text-transform:uppercase;color:#8a8a8a;text-decoration:none;border-bottom:1px solid #ddd;
    padding-bottom:2px;min-height:24px}
  .kw-lore-full:hover{color:#111;border-bottom-color:#111}
  .kw-lore-load{font-size:13px;color:#9a9a9a;padding:4px 0 20px}
  @media (max-width:600px){.kw-lr{grid-template-columns:1fr;gap:2px}}
  /* ховер строки-тоггла: тонкая подсветка полосы, без заливки —
     это строка внутри карточки, а не отдельная кнопка */
  .kw-lore-btn::before{content:"";position:absolute;left:-26px;right:-26px;top:0;bottom:0;
    z-index:-1;background:#fafafa;opacity:0;transition:opacity .18s ease}
  .kw-lore-btn:hover::before{opacity:1}
  .kw-lore-btn:hover>span{transform:translateX(2px)}
  .kw-lore-btn>span{transition:transform .2s cubic-bezier(.23,1,.32,1)}
  .kw-lore-btn:focus-visible{outline:2px solid #111;outline-offset:-2px}

  @media (prefers-reduced-motion: reduce){
    /* движение убираем, СМЕНУ СОСТОЯНИЯ оставляем: раздел всё так же открывается */
    .kw-lore-body{transition:none}
    .kw-lore-in{transition:none}
    .kw-chev{transition:none}
    .kw-lore-btn>span{transition:none}
    .kw-lore-veil{animation:none}
  }
  /* заглушка для вещей без лора — появляется мягко (ease-out, вход 220мс) */
  .kw-lore-veil{margin:0 0 22px;padding:16px 18px;border-left:2px solid #d8d8d8;
    background:#fafafa;font-family:'TildaSans',Arial,sans-serif;max-width:520px;
    animation:kwVeil .22s cubic-bezier(.23,1,.32,1)}
  @keyframes kwVeil{from{opacity:0;transform:translateY(-4px)}}
  .kw-lore-veil b{display:block;font-family:Georgia,serif;font-style:italic;
    font-weight:400;font-size:15px;color:#3c3c3c;line-height:1.5}
  .kw-lore-veil span{display:block;margin-top:7px;font-size:12.5px;color:#8a8a8a;line-height:1.6}

  /* ==== ОКНО СТАТОВ: мягкая карточка (дизайн варианта A), смыслы паспорта ==== */
  .kw-stats{margin:26px 0 8px;border:1px solid #ececec;background:#fff;
    padding:24px 26px 0;box-shadow:0 10px 40px rgba(0,0,0,.06);
    font-family:'TildaSans',Arial,sans-serif;color:#111}
  .kw-stats .kn{font-size:19px;font-weight:700;letter-spacing:.04em;color:var(--kw-sc,#111);
    margin:0;line-height:1.2}
  .kw-stats .ks{font-size:11px;letter-spacing:.16em;text-transform:uppercase;
    color:#6b6b6b;margin:5px 0 20px;line-height:1.8}
  .kw-srow{display:grid;grid-template-columns:128px 1fr 34px;gap:10px;align-items:center;margin-bottom:10px}
  .kw-srow .l{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#555}
  .kw-srow .v{font-size:12.5px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
  .kw-strack{display:block;height:4px;background:#f0f0f0;overflow:hidden}
  .kw-sfill{display:block;height:100%;background:#111;width:var(--w);
    animation:kwGrow .9s cubic-bezier(.22,1,.36,1)}
  @keyframes kwGrow{from{width:0}}
  .kw-foot{margin-top:16px;padding-top:13px;border-top:1px solid #ececec;
    font-size:12.5px;color:#6b6b6b;line-height:1.75}
  .kw-foot b{color:#555;font-weight:600}
  .kw-check{border-top:1px solid #ececec;margin:0 -26px;padding:13px 26px 16px;background:#fafafa}
  .kw-check .kc-t{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8a8a8a}
  .kw-check .kc-row{display:flex;gap:14px;align-items:flex-start;margin-top:9px}
  .kw-roll{font-family:'TildaSans',Arial,sans-serif;font-size:12px;font-weight:600;
    letter-spacing:.1em;text-transform:uppercase;background:#111;color:#fff;
    border:0;padding:12px 16px;min-height:44px;cursor:pointer;white-space:nowrap}
  .kw-roll:hover{background:#333}
  .kw-roll:focus-visible{outline:2px solid var(--kw-sc,#111);outline-offset:2px}
  .kw-res{font-family:Georgia,serif;font-style:italic;font-size:13.5px;color:#3c3c3c;
    line-height:1.5;min-height:38px;flex:1}
  .kw-res b{font-style:normal;font-family:'TildaSans',Arial,sans-serif;
    font-size:11px;letter-spacing:.14em}
  .kw-res b.ok{color:#2e7d32} .kw-res b.no{color:#b3362c}
  .kw-card{transition:transform .3s cubic-bezier(.22,1,.36,1), box-shadow .35s ease}
  /* заметный подъём + свечение вниз (не заливает соседей) */
  .t-store__card.kw-card:hover{transform:translateY(-6px)}
  .kw-card:hover{box-shadow:0 22px 40px -12px var(--kw-glow), 0 6px 16px -8px var(--kw-glow)}
  .kw-card .t-store__card__imgwrapper::before{content:"";position:absolute;
    left:0;right:0;bottom:0;height:3px;z-index:3;pointer-events:none;
    background:linear-gradient(90deg,transparent,var(--kw-c),transparent);
    transform:scaleX(0);transition:transform .4s cubic-bezier(.22,1,.36,1)}
  .kw-card:hover .t-store__card__imgwrapper::before{transform:scaleX(1)}

  /* КОРНЕВОЙ ФИКС: на ховере карточка поднимается НАД соседями —
     раньше их белые тела (впритык, отрисованы позже) закрашивали рамку */
  .t-store__card.kw-card:hover{z-index:20}

  /* ЛЕГЕНДАРКА — «ЖИВАЯ КРОМКА» вокруг ВСЕЙ карточки (фото + имя + цена).
     inset:2px — внутри собственного бокса, а поверх соседей выносит z-index */
  @property --kw-a{syntax:"<angle>";initial-value:0deg;inherits:false}
  .kw-card[data-kw-done="legend"]::before{content:"";position:absolute;
    inset:2px;padding:2px;pointer-events:none;z-index:3;opacity:0;
    background:conic-gradient(from var(--kw-a),
      var(--kw-c), rgba(240,120,0,.4) 25%,
      var(--kw-c) 50%, rgba(240,120,0,.4) 75%, var(--kw-c));
    -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
    -webkit-mask-composite:xor;mask-composite:exclude;
    transition:opacity .3s ease}
  .kw-card[data-kw-done="legend"]:hover::before{opacity:1;
    animation:kwSpin 2.4s linear infinite}
  @keyframes kwSpin{to{--kw-a:360deg}}
  .kw-card[data-kw-done="legend"] .t-store__card__imgwrapper::before{display:none}

  /* имя вещи — чёрное в покое, цвет грейда на ховере */
  .kw-card .t-store__card__title,
  .kw-card .js-store-prod-name{transition:color .25s ease}
  .kw-card:hover .t-store__card__title,
  .kw-card:hover .js-store-prod-name{color:var(--kw-tc)!important}

  /* лейбл: у ВСЕХ грейдов — белая плашка сверху по центру, врезанная
     в верхний край (у легендарки она разрезает кант); скрыт до ховера */
  .kw-badge{position:absolute;top:-9px;left:50%;z-index:5;pointer-events:none;
    font-family:'TildaSans',Arial,sans-serif;font-size:10px;font-weight:600;
    line-height:1;letter-spacing:.16em;text-transform:uppercase;
    color:var(--kw-tc);background:#fff;padding:3px 12px;
    opacity:0;transform:translate(-50%,4px);white-space:nowrap;
    transition:opacity .25s ease, transform .3s cubic-bezier(.22,1,.36,1)}
  .kw-card:hover .kw-badge{opacity:1;transform:translate(-50%,0)}

  /* ОТКЛЮЧАЕМ тильдовскую смену фото на ховере НАГЛУХО:
     второй кадр удаляется из рендера, основной прибит с максимальной
     специфичностью (правило Тильды живёт в кросс-доменном CSS) */
  .t-store__card.kw-card .t-store__card__bgimg_second{display:none !important}
  .t-store__card.kw-card:hover .t-store__card__bgimg.t-store__card__bgimg_hover,
  .t-store__card.kw-card:hover .t-store__card__bgimg,
  .kw-card .t-store__card__bgimg{opacity:1 !important}

  /* блик света по фото на ховере (смена кадра отключена — конфликта нет) */
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
    .kw-card .js-store-prod-name{color:var(--kw-tc)!important}
    .kw-card .t-store__card__imgwrapper::before{transform:scaleX(1)}
    .kw-card[data-kw-done="legend"]::before{opacity:.6}
  }

  @media (prefers-reduced-motion:reduce){
    .kw-card,.kw-card::before,.kw-badge{transition:none!important}
    .kw-card::before,.kw-card .t-store__card__imgwrapper::after{animation:none!important}
  }

  /* ==== СТРАНИЦА «ДОКУМЕНТЫ»: реквизиты, связь, порядок претензий ==== */
  .kw-legal{font-family:'TildaSans',Arial,sans-serif;color:#5f5f5f;font-size:13.5px;line-height:1.7}
  .kw-legal-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:34px 48px}
  .kw-legal h4{margin:0 0 12px;font-size:10px;font-weight:600;letter-spacing:.16em;
    text-transform:uppercase;color:#a0a0a0}
  .kw-legal b{display:block;font-weight:600;color:#222;font-size:15px;margin-bottom:5px}
  .kw-legal a{color:#5f5f5f;text-decoration:none;border-bottom:1px solid #e0e0e0}
  .kw-legal a:hover{color:#111;border-bottom-color:#111}
  .kw-legal .kw-legal-note{margin-top:12px}
  .kw-legal .kw-legal-docs a{display:block;width:fit-content;margin-bottom:8px}
  @media (max-width:640px){.kw-legal-in{grid-template-columns:1fr;gap:28px}}`;

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
    if (card.querySelector(".t-store__card__bgimg_second"))
      card.classList.add("kw-swap");
    card.style.setProperty("--kw-c", r.c);
    card.style.setProperty("--kw-tc", r.tc);
    card.style.setProperty("--kw-glow", r.glow);
    const badge = document.createElement("span");
    badge.className = "kw-badge";
    badge.textContent = r.label;
    card.appendChild(badge);
  }

  /* ==== СТАТЫ ВЕЩЕЙ: паспорт + проверка навыка (2d6 + мод против сложности).
   * match — подстрока названия (lowercase), первое совпадение побеждает. ==== */
  const STATS = [
    // Осенний дроп 2026: тренч, пальто с капюшоном, рубашка из сатина, три цвета брюк.
    // Стоят ВЫШЕ старых записей: «крестом» и «красные» иначе перехватят общие «брюки».
    { match:"тренч", sub:"водостойкая ткань, пелерина", slot:"туловище, плечи, дождь",
      bars:{"Резист холоду":58,"Резист дождю":94,"Ветрозащита":82,"Прочность":84,"Силуэт":90,"Резист к стирке":60},
      pass:[["Диапазон","+2…+16 °C"],["Испытано","мосты, набережные, ноябрь без зонта"]],
      check:{skill:"Невозмутимость",act:"Поднять воротник под дождём",mod:4,diff:11,
        ok:["Воротник встал. Дождь пошёл вокруг тебя, как вокруг фонарного столба.",
            "Капли скатились по пелерине и ушли в ливнёвку. Ты сухой и это заметно."],
        no:["Воротник поднял, а зонт нет. Зонта нет вообще. Ты идёшь медленно, потому что уже всё равно.",
            "Порыв ветра развернул полу тренча на прохожего. Извинился тренч, не ты."]}},
    { match:"капюшоном", sub:"шерсть 65, шёлк 5, капюшон", slot:"туловище, плечи, голова по желанию",
      bars:{"Резист холоду":84,"Резист жаре":16,"Ветрозащита":88,"Прочность":86,"Анонимность":79,"Резист к стирке":12},
      pass:[["Диапазон","−12…+8 °C"],["Испытано","дворы, поздние электрички, чужие подъезды"]],
      check:{skill:"Внутренняя империя",act:"Накинуть капюшон посреди разговора",mod:3,diff:10,
        ok:["Капюшон опустился. Собеседник понял, что разговор окончен, и не обиделся. Почти.",
            "Ты исчез, не сходя с места. Шерсть держит тепло, капюшон держит паузу."],
        no:["Капюшон сполз на глаза. Ты дослушал собеседника вслепую, и он это оценил.",
            "Кто-то сказал монах. Кто-то сказал ассасин. Никто не сказал пальто."]}},
    { match:"сатин", sub:"хлопок 100, сатиновое плетение", slot:"туловище, под пиджак или вместо него",
      bars:{"Резист холоду":22,"Резист жаре":70,"Блеск":66,"Прочность":74,"Осанка":82,"Резист к стирке":88},
      pass:[["Диапазон","+14…+28 °C"],["Носится","под пиджак, под тренч, сама по себе"]],
      check:{skill:"Savoir faire",act:"Застегнуть верхнюю пуговицу",mod:3,diff:9,
        ok:["Пуговица вошла в петлю с первого раза. Сатин поймал свет и отдал его тебе.",
            "Воротник встал ровно. В зеркале человек, которому не нужно объяснять, куда он идёт."],
        no:["Верхняя застёгнута, вторая нет. Ты идёшь так весь день и никто не решается сказать.",
            "Пуговица оторвалась в руке. Сатин блестит, ты нет."]}},
    { match:"красным крестом", sub:"полиэстер с вискозой, красная вышивка", slot:"ноги и последний шаг",
      bars:{"Резист холоду":62,"Резист жаре":40,"Стелс":48,"Знак":90,"Прочность":76,"Резист к стирке":60},
      pass:[["Диапазон","−4…+16 °C"],["Испытано","лестницы, перроны, поворот на каблуке"]],
      check:{skill:"Дерзость",act:"Уйти так, чтобы увидели крест",mod:3,diff:10,
        ok:["Ты развернулся. Красный кинжал на штанине мелькнул и остался у них в памяти дольше, чем твоё лицо.",
            "Кто-то посмотрел вниз. Потом вверх. Потом решил не спрашивать."],
        no:["Штанина зацепилась за ступеньку. Крест увидели, но не так.",
            "Ты ушёл слишком быстро. Вышивку не рассмотрели, запомнили только спину."]}},
    { match:"серебристым крестом", sub:"полиэстер с вискозой, серебряная нить", slot:"ноги и то, что ниже колена",
      bars:{"Резист холоду":62,"Резист жаре":40,"Стелс":74,"Знак":58,"Прочность":76,"Резист к стирке":60},
      pass:[["Диапазон","−4…+16 °C"],["Испытано","вечера, где вспышки запрещены"]],
      check:{skill:"Восприятие",act:"Заметить крест первым",mod:2,diff:11,
        ok:["Серебро блеснуло один раз, под фонарём. Тот, кто увидел, теперь думает о тебе.",
            "Крест читается только с двух шагов. Ближе двух шагов подходят не все."],
        no:["Никто не заметил. Это и был план, но всё равно обидно.",
            "Ты сам забыл, что он там есть. Штаны носили тебя, а не наоборот."]}},
    { match:"красные", sub:"полиэстер с вискозой, чёрная вышивка", slot:"ноги и вся улица",
      bars:{"Резист холоду":62,"Резист жаре":40,"Стелс":6,"Драма":94,"Прочность":76,"Резист к стирке":55},
      pass:[["Диапазон","−4…+16 °C"],["Радиус внимания","весь вагон"]],
      check:{skill:"Драма",act:"Войти в вагон метро",mod:4,diff:12,
        ok:["Вагон посмотрел. Вагон отвёл глаза. Вагон посмотрел снова. Ты сел.",
            "Красное на чёрном фоне толпы. Кто-то сделал фото, ты сделал вид, что не заметил."],
        no:["Ты вошёл в красных брюках и сел напротив человека в красных брюках. Дуэль отложена до следующей станции.",
            "Драма сработала не на тех. Бабушка попросила уступить место. Ты уступил."]}},
    // ВЫШЕ общего «сюртук» — statsFor берёт первое совпадение по подстроке
    { match:"сюртук ii", sub:"шерсть с вискозой, вторая редакция", slot:"туловище, плечи, второй заход",
      bars:{"Резист холоду":80,"Резист жаре":18,"Ветрозащита":86,"Прочность":92,"Авторитет":97,"Резист к стирке":8},
      pass:[["Диапазон","−18…+8 °C"],["Испытано","поздние возвращения, чужие лестницы"]],
      check:{skill:"Авторитет",act:"Уйти, не объяснив причины",mod:5,diff:13,
        ok:["Ты встаёшь на середине чужой фразы. Фраза заканчивается сама — уже без тебя.",
            "Никто не спросил куда. Спросят завтра, и очень вежливо."],
        no:["«Всё в порядке?» — догоняет тебя в дверях. Значит, не в порядке.",
            "Ты ушёл. Через минуту вернулся за шарфом. Эффект аннулирован."]}},
    { match:"сюртук", sub:"итальянская шерсть", slot:"туловище, плечи, эпоха",
      bars:{"Резист холоду":78,"Резист жаре":22,"Ветрозащита":84,"Прочность":90,"Авторитет":95,"Резист к стирке":8},
      pass:[["Диапазон","−15…+10 °C"],["Испытано","зима, переговорные, чужие похороны"]],
      check:{skill:"Авторитет",act:"Войти без стука",mod:4,diff:12,
        ok:["Комната не встаёт. Комната просто замолкает. Этого достаточно.",
            "Кто-то отодвигает стул. Не для себя — для тебя."],
        no:["Ты вошёл без стука. Дверь была не та.",
            "Внутри никого. Авторитет израсходован на пустую комнату."]}},
    { match:"серый меланж", sub:"шерсть, серый меланж", slot:"ноги и полтона города",
      bars:{"Резист холоду":70,"Резист жаре":30,"Стелс":64,"Прочность":75,"Невозмутимость":71,"Резист к стирке":40},
      pass:[["Диапазон","−8…+14 °C"],["Совместимость","туман, бетон, вторник"]],
      check:{skill:"Внутренняя империя",act:"Пройти мимо химчистки",mod:2,diff:9,
        ok:["Меланж скрывает всё, что ты пережил. Даже кофе четверга.",
            "Пятна — это события. Сегодня событий не видно."],
        no:["Приёмщица смотрит сквозь витрину. Она знает.",
            "Ты остановился у витрины. Это уже признание."]}},
    { match:"брюки из шерсти", sub:"плотная шерсть", slot:"ноги, честно обе",
      bars:{"Резист холоду":72,"Резист жаре":28,"Стелс":58,"Прочность":78,"Выдержка":74,"Резист к стирке":40},
      pass:[["Диапазон","−10…+12 °C"],["Испытано","ноябрь, перрон, ожидание"]],
      check:{skill:"Savoir faire",act:"Сесть на корточки, не потеряв лица",mod:2,diff:9,
        ok:["Колени согласны. Стрелки целы. Район уважает.",
            "Ты садишься, как учили деды: спина прямая, взгляд в горизонт."],
        no:["Стрелка дрогнула. Где-то в Милане заплакал портной.",
            "Подъём вышел не таким плавным. Свидетели есть."]}},
    { match:"пончо в клетку", sub:"шерсть, клетка", slot:"туловище и окрестности",
      bars:{"Резист холоду":76,"Резист жаре":14,"Драма":88,"Картография":87,"Прочность":70,"Резист к стирке":10},
      pass:[["Диапазон","−5…+12 °C"],["Испытано","парапеты, октябрь"]],
      check:{skill:"Драма",act:"Опереться о парапет",mod:2,diff:9,
        ok:["Клетка ложится на гранит идеальной сеткой координат. Ты — точка отсчёта.",
            "Прохожий сверил свою жизнь с твоей клеткой. Его жизнь кривее."],
        no:["Парапет мокрый. Клетка теперь содержит реку.",
            "Ты облокотился мимо. Драма превратилась в цирк."]}},
    { match:"пончо", sub:"натуральная шерсть", slot:"туловище и окрестности",
      bars:{"Резист холоду":82,"Резист жаре":11,"Драма":92,"Свобода рук":14,"Прочность":74,"Резист к стирке":10},
      pass:[["Диапазон","−5…+10 °C"],["Радиус драмы","3,5 м при развороте"]],
      check:{skill:"Драма",act:"Развернуться на каблуке",mod:3,diff:10,
        ok:["Пола описывает идеальную дугу. Фотограф, которого не существует, делает снимок.",
            "Ветер подхватывает край точно по нотам. Мост аплодирует опорами."],
        no:["Разворот вышел на 240 градусов вместо 360. Голубь смотрит с осуждением.",
            "Ты запутался. Изнутри пончо темно и пахнет шерстью. Снаружи вежливо кашлянули."]}},
    { match:"орлок", sub:"вельвет", slot:"ноги, тень отдельно",
      bars:{"Резист холоду":66,"Резист жаре":32,"Стелс":81,"Ночное зрение":77,"Прочность":72,"Резист к стирке":45},
      pass:[["Диапазон","−5…+15 °C"],["Испытано","подворотни, полночь"]],
      check:{skill:"Стелс",act:"Не отбросить тень",mod:3,diff:10,
        ok:["Фонарь моргнул — и не нашёл тебя. Вельвет поглощает свет и вопросы.",
            "Кондуктор прошёл мимо. Ты платил, но приятно, что были варианты."],
        no:["Тень легла длинная, острая, с когтями. Все обернулись. Носферату спалился.",
            "Вельвет блеснул рубчиком в свете витрины. Заметен. Красив, но заметен."]}},
    { match:"луи", sub:"версальский крой", slot:"ноги и осанка",
      bars:{"Резист холоду":64,"Резист жаре":36,"Savoir faire":85,"Осанка":80,"Прочность":70,"Резист к стирке":40},
      pass:[["Диапазон","−5…+15 °C"],["Испытано","двери, лестницы, реверансы"]],
      check:{skill:"Savoir faire",act:"Сказать «после вас»",mod:3,diff:9,
        ok:["Дверь удержана. Поклон лёгкий, ироничный, на грани эпохи. Людовик бы кивнул.",
            "«После вас» прозвучало так, что очередь перестроилась сама."],
        no:["Вы столкнулись в дверях. Версаль пал.",
            "«После вас» сказали одновременно. Теперь это дуэль."]}},
    { match:"кушаком", sub:"шерсть, кушак в комплекте", slot:"талия и решимость",
      bars:{"Резист холоду":74,"Резист жаре":26,"Дерзость":78,"Хват":88,"Прочность":76,"Резист к стирке":40},
      pass:[["Диапазон","−10…+12 °C"],["Испытано","решительные утра"]],
      check:{skill:"Дерзость",act:"Затянуть кушак решительно",mod:3,diff:10,
        ok:["Узел лёг с первого раза. День понял, кто здесь главный.",
            "Затяжка прозвучала как выстрел стартового пистолета. Побежали."],
        no:["Кушак затянут криво. День пойдёт так же.",
            "Перетянул. Обед отменяется по техническим причинам."]}},
    { match:"перчатки", sub:"пара, левая помнит правую", slot:"кисти, обе",
      bars:{"Резист холоду":80,"Резист жаре":8,"Хват":90,"Авторитет":72,"Прочность":68,"Резист к стирке":6},
      pass:[["Диапазон","−20…+5 °C"],["Испытано","рукопожатия, дуэли (отменённые)"]],
      check:{skill:"Авторитет",act:"Снять перчатку перед рукопожатием",mod:3,diff:10,
        ok:["Пауза. Перчатка. Рука. Сделка закрыта ещё до слов.",
            "Ты снял её за палец, не глядя. Кто-то решил тебе не врать."],
        no:["Перчатка застряла. Рукопожатие превратилось в спасательную операцию.",
            "Снял и уронил. Поднимать перчатку — значит принять вызов. Свой собственный."]}},
    { match:"туника в клетку", sub:"хлопок, клетка", slot:"торс и расписание",
      bars:{"Резист холоду":38,"Резист жаре":70,"Свобода":86,"Планирование":58,"Прочность":58,"Резист к стирке":30},
      pass:[["Диапазон","+15…+30 °C"],["Испытано","завтраки, балконы"]],
      check:{skill:"Энциклопедия",act:"Сверить клетку с расписанием",mod:2,diff:9,
        ok:["Каждая клетка — час. Все часы твои. Расписание капитулировало.",
            "Тартан этого узора носил клан, не плативший налогов. Ты продолжаешь традицию."],
        no:["Клеток больше, чем часов в сутках. Придётся жить в долг.",
            "Ты сбился на седьмой клетке. Среда отменена."]}},
    { match:"туника", sub:"хлопок", slot:"торс и свобода передвижений",
      bars:{"Резист холоду":36,"Резист жаре":74,"Свобода":90,"Величие":78,"Прочность":56,"Резист к стирке":30},
      pass:[["Диапазон","+15…+30 °C"],["Испытано","подоконники, длинные мысли"]],
      check:{skill:"Внутренняя империя",act:"Выйти к завтраку как к трону",mod:3,diff:9,
        ok:["Кухня преобразилась в тронный зал. Кофе подан. Империя проснулась.",
            "Складки легли античными. Соседи по квартире невольно выпрямились."],
        no:["Трон занят котом. Империя подождёт.",
            "Ты наступил на подол собственного величия. Больно не было. Было громко."]}},
    { match:"топ черный", sub:"чернее договорённостей", slot:"торс, минимально",
      bars:{"Резист холоду":16,"Резист жаре":78,"Стелс":88,"Минимализм":92,"Прочность":60,"Резист к стирке":32},
      pass:[["Диапазон","+18…+30 °C"],["Испытано","бары, тёмные залы"]],
      check:{skill:"Стелс",act:"Раствориться в баре",mod:4,diff:9,
        ok:["Бармен наливает не спрашивая. Ты здесь был всегда.",
            "Тебя не видно на групповом фото. Идеально."],
        no:["Вспышка. Кто-то отметил тебя на фото. Стелс скомпрометирован до утра.",
            "Чёрный топ, белая барная подсветка. Ты — негатив самого себя."]}},
    { match:"березка", sub:"принт: берёза среднерусская", slot:"торс и память о даче",
      bars:{"Резист холоду":18,"Резист жаре":76,"Ностальгия":84,"Искренность":76,"Прочность":60,"Резист к стирке":32},
      pass:[["Диапазон","+18…+30 °C"],["Испытано","дачи, электрички, июль"]],
      check:{skill:"Внутренняя империя",act:"Вспомнить лето",mod:3,diff:9,
        ok:["Запахло грозой и смородиной. Тебе восемь, и всё ещё впереди.",
            "Берёза на груди зашумела. Город на секунду выключили."],
        no:["Вспомнилась только очередь в шиномонтаж. Тоже лето, но не то.",
            "Лето не вспомнилось. Берёзка сочувственно шелестит принтом."]}},
    { match:"лонгслив", sub:"шнуровка в комплекте", slot:"торс и запястья с запасом",
      bars:{"Резист холоду":34,"Резист жаре":52,"Драма":72,"Саспенс":66,"Прочность":62,"Резист к стирке":35},
      pass:[["Диапазон","+5…+20 °C"],["Испытано","свидания, концерты"]],
      check:{skill:"Драма",act:"Затянуть шнуровку до откровения",mod:2,diff:10,
        ok:["Узел лёг асимметрично и честно. Собеседник рассказал лишнее первым.",
            "Шнуровка натянулась как струна. Вечер приобрёл сюжет."],
        no:["Перетянул. Откровение отложено из-за нехватки кислорода.",
            "Шнурок порвался в кульминации. Драма есть, реквизита нет."]}},
    { match:"футболка", sub:"джерси, база", slot:"базовый, несъёмный",
      bars:{"Резист холоду":12,"Резист жаре":80,"Стелс":91,"Алиби":96,"Прочность":60,"Резист к стирке":95},
      pass:[["Диапазон","+15…+35 °C"],["Испытано","всё, что ты помнишь"]],
      check:{skill:"Дерзость",act:"Расправить плечи",mod:1,diff:9,
        ok:["Ты стал на два сантиметра выше. Мир пересчитал тебя заново.",
            "Комната инстинктивно сделала полшага назад. Уважение."],
        no:["Расправил с запасом — швы скрипнули, но выдержали. Джерси прощает всё.",
            "Плечи ушли дальше плана. Ладно. Теперь это твоя новая походка."]}},
  ];

  function statsFor(title) {
    const t = (title || "").toLowerCase();
    for (const s of STATS) if (t.includes(s.match)) return s;
    return null;
  }

  function renderStats(host, st, title) {
    const box = document.createElement("div");
    box.className = "kw-stats";
    box.dataset.for = title;
    const rar = rarityFor(title), rc = RAR[rar] ? RAR[rar].tc : "#111";
    box.style.setProperty("--kw-sc", rc);
    const bars = Object.entries(st.bars).map(([k, v]) =>
      `<div class="kw-srow"><span class="l">${k}</span>` +
      `<span class="kw-strack"><span class="kw-sfill" style="--w:${v}%"></span></span>` +
      `<span class="v">${v}</span></div>`).join("");
    const gradeLabel = RAR[rar] ? RAR[rar].label : "";
    const foot = [`<b>Слот:</b> ${st.slot}`]
      .concat(st.pass.map(p => `<b>${p[0]}:</b> ${p[1]}`)).join(" · ");
    box.innerHTML =
      `<h3 class="kn">${title}</h3>` +
      `<div class="ks">${gradeLabel} · ${st.sub}</div>` +
      bars +
      `<div class="kw-foot">${foot}</div>` +
      `<div class="kw-check"><div class="kc-t">Проверка: ${st.check.skill} · 2d6+${st.check.mod} против ${st.check.diff}</div>` +
      `<div class="kc-row"><button class="kw-roll" type="button">${st.check.act}</button>` +
      `<div class="kw-res" role="status" aria-live="polite"><i>Кубики ждут.</i></div></div></div>`;
    box.querySelector(".kw-roll").addEventListener("click", function () {
      const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
      const total = d1 + d2 + st.check.mod, ok = total >= st.check.diff;
      const pool = ok ? st.check.ok : st.check.no;
      const flav = pool[Math.floor(Math.random() * pool.length)];
      box.querySelector(".kw-res").innerHTML =
        `<b class="${ok ? "ok" : "no"}">${ok ? "УСПЕХ" : "ПРОВАЛ"} — ${d1}+${d2}+${st.check.mod} = ${total}</b><br>${flav}`;
    });
    host.appendChild(box);
  }

  function mountStats() {
    document.querySelectorAll(".t-store__prod-popup__info").forEach(function (info) {
      const nameEl = info.querySelector(".js-store-prod-name, .t-store__prod-popup__name");
      if (!nameEl) return;
      const title = nameEl.textContent.trim();
      if (!title) return;
      const existing = info.querySelector(".kw-stats");
      if (existing && existing.dataset.for === title) return;
      if (existing) existing.remove();
      const st = statsFor(title);
      if (st) renderStats(info, st, title);
      mountLore(info, title);
    });
  }

  /* ==== КНОПКА LORE: ведёт на отдельную лор-страницу вещи ====
   * Страницы серверные (на бэкенде), поэтому у них настоящие мета-теги и
   * микроразметка — в отличие от контента, вставленного скриптом. */
  const LORE_BASE = "https://kniveswear-loyalty.vercel.app/lore/";
  const LORE_API = "https://kniveswear-loyalty.vercel.app/api/lore/";
  const LORE_SLUGS = {
    "Сюртук": "surtuk",
    "Сюртук II": "surtuk-2",   // в каталоге римская цифра: с "Сюртук 2" кнопка вела на заглушку
    "Пончо в клетку": "poncho-kletka",
    "Брюки Луи": "bryuki-lui",
    "Брюки Орлок": "bryuki-orlok",
  };

  /* ЛОР — ПОСЛЕДНИЙ РАЗДЕЛ ПАСПОРТА, а не отдельная кнопка сбоку.
     Порядок на карточке: характеристики (скан) → проверка навыка (игра) →
     лор (погружение, свёрнут). Разворачивается тогглом, без ухода со страницы;
     страницы /lore/<slug> остаются для поисковиков и прямых ссылок. */
  const loreCache = {};

  function mountLore(info, title) {
    const host = info.querySelector(".kw-stats") || info;
    const old = host.querySelector(".kw-lore");
    if (old && old.dataset.for === title) return;
    if (old) old.remove();

    const wrap = document.createElement("div");
    wrap.className = "kw-lore";
    wrap.dataset.for = title;
    const bodyId = "kwlore-" + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML =
      '<button class="kw-lore-btn" type="button" aria-expanded="false" aria-controls="' + bodyId + '">' +
        '<span>Lore</span><i class="kw-chev" aria-hidden="true"></i></button>' +
      '<div class="kw-lore-body" id="' + bodyId + '"><div class="kw-lore-in"></div></div>';

    const btn = wrap.querySelector(".kw-lore-btn");
    const body = wrap.querySelector(".kw-lore-body");
    const inner = wrap.querySelector(".kw-lore-in");
    btn.addEventListener("click", function () {
      const open = wrap.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) fillLore(inner, title);
    });
    // внутри паспорта раздел идёт последним, вне — просто добавляем
    host.appendChild(wrap);
  }

  const VEIL_LINES = [
    "Лор этой вещи пока покрыт тайной.",
    "История ещё не записана. Вещь молчит — и, кажется, нарочно.",
    "Архив на эту вещь пуст. Либо не успели, либо не решились.",
  ];

  function veilHtml(title) {
    const line = VEIL_LINES[(title.length + title.charCodeAt(0)) % VEIL_LINES.length];
    return '<div class="kw-lore-veil"><b>' + esc(line) + "</b><span>Мы дописываем истории " +
      "по одной. Пока — характеристики выше: они не врут.</span></div>";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fillLore(inner, title) {
    if (inner.dataset.loaded === title) return;    // уже показано
    const slug = LORE_SLUGS[title];
    if (!slug) { inner.innerHTML = veilHtml(title); inner.dataset.loaded = title; return; }
    if (loreCache[slug]) { paintLore(inner, loreCache[slug], title); return; }
    inner.innerHTML = '<div class="kw-lore-load">Открываем архив…</div>';
    fetch(LORE_API + slug)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.error) { inner.innerHTML = veilHtml(title); inner.dataset.loaded = title; return; }
        loreCache[slug] = d;
        paintLore(inner, d, title);
      })
      .catch(function () { inner.innerHTML = veilHtml(title); inner.dataset.loaded = title; });
  }

  function paintLore(inner, d, title) {
    const story = (d.story || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    const refs = (d.refs || []).map(function (x) {
      return '<div class="kw-lr"><span class="k">' + esc(x.label) + '</span><span class="v">' +
        esc(x.text) + (x.draft ? '<i class="kw-draft">черновик</i>' : "") + "</span></div>";
    }).join("");
    inner.innerHTML =
      (d.tagline ? '<div class="kw-lore-tag">' + esc(d.tagline) + "</div>" : "") +
      '<div class="kw-lore-story">' + story + "</div>" +
      (refs ? '<div class="kw-lore-h">Референсы при создании</div>' + refs : "") +
      '<a class="kw-lore-full" href="' + esc(d.url) + '">Открыть отдельной страницей →</a>';
    inner.dataset.loaded = title;
  }

  /* ==== SEO: структурированная разметка и гигиена головы документа ====
   * Всё идемпотентно и выполняется на каждом scan() — Google и Яндекс
   * рендерят JS и читают итоговый DOM. */

  /**
   * ⚠️ САЙТ ОБЪЯВЛЯЕТ СЕБЯ ПО HTTP, А ЖИВЁТ ПО HTTPS. Тильда пишет http и в
   * canonical, и в og:url, и в обе карты сайта, а http-адрес при этом отдаёт
   * 200, а не редирект. Для поисковика это две одинаковые копии сайта, где
   * страница показывает пальцем на ту, которую он сам считает неглавной, —
   * отсюда письмо Search Console «Duplicate, Google chose different canonical
   * than user».
   *
   * ⚠️ ЭТО ЗАПЛАТКА, А НЕ ЛЕЧЕНИЕ. Настоящее лечение — включить в Тильде
   * принудительный переход на HTTPS: тогда http начнёт редиректить, а Тильда
   * сама перепишет адреса. Здесь мы правим только то, что видно в отрендеренной
   * странице.
   */
  function seoCanonical() {
    const l = document.querySelector('link[rel="canonical"]');
    if (l && l.href && l.href.indexOf("http://") === 0)
      l.href = l.href.replace("http://", "https://");
    const og = document.querySelector('meta[property="og:url"]');
    if (og && og.content && og.content.indexOf("http://") === 0)
      og.content = og.content.replace("http://", "https://");
  }

  function seoOrg() {
    if (document.getElementById("kw-ld-org")) return;
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "kw-ld-org";
    s.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Knives",
      "url": "https://kniveswear.ru/",
      "sameAs": ["https://www.ozon.ru/seller/knives/"]
    });
    document.head.appendChild(s);
  }

  /* ==== СОСТАВ, РАЗМЕРЫ И УХОД ====
   *
   * ⚠️ ОТДЕЛЬНЫХ ПОЛЕЙ ПОД ЭТО У ТИЛЬДЫ НЕТ. Состав написан прозой внутри
   * описания («Итальянская шерсть, сто процентов»), уход — строкой в конце.
   * Поэтому вытаскиваем из текста, а НЕ из игровых статов: те (Авторитет 95,
   * «Радиус драмы 3,5 м») придуманы для карточки и в машинной разметке были бы
   * ложными характеристиками товара.
   */
  // ⚠️ НАЧАЛО СЛОВА ОБЯЗАТЕЛЬНО. Без этого «льн» ловится в «нормаЛЬНая», и в
  // состав уезжает случайная фраза из описания.
  const FIBRES = /(^|[^а-яёa-z])(шерст|хлоп|виск|льн|лён|полиэстер|акрил|кашемир|вельвет|атлас|джерси|трикотаж|шёлк|шелк|замш|кожа)/i;

  function sentences(text) {
    // Без lookbehind: старые Safari роняют весь скрипт на этапе разбора.
    return text.split(/[\n.]+/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 4; });
  }

  /**
   * ⚠️ СМОТРИМ ТОЛЬКО ПЕРВОЕ ПРЕДЛОЖЕНИЕ АБЗАЦА. Состав у нас всегда стоит
   * первым («Итальянская шерсть, сто процентов. Легче пальтовой ткани…»), а
   * дальше идёт проза, где ткань упоминается вскользь — и она бы засоряла поле.
   */
  // Абзац может начинаться и без названия волокна: «Сшиты из премиальной ткани
  // от Хьюго русскими портными» — это тоже состав, просто без имени нити.
  const MAT_HINT = /^(материал|состав|ткань|сшит|сшито|сшиты|сшит[аи]я|выполнен)/i;

  function materialFrom(text) {
    const hits = [];
    text.split(/\n+/).forEach(function (line) {
      const s = line.trim().split(/\.\s|\.$/)[0].trim();
      // 200 символов, а не 120: «Элегантные брюки… из лёгкого итальянского
      // вельвета… с геометричным принтом» — состав в конце длинной фразы.
      if (s.length > 4 && s.length <= 200 && (FIBRES.test(s) || MAT_HINT.test(s)) &&
          hits.indexOf(s) < 0)
        hits.push(s);
    });
    return hits.slice(0, 3).join(". ");
  }

  function careFrom(text) {
    let care = "";
    sentences(text).forEach(function (s) {
      if (!care && /^уход/i.test(s)) care = s.replace(/^уход\s*[:—-]?\s*/i, "");
    });
    return care;
  }

  /** Варианты товара: размер и цвет лежат в блоках редакций Тильды. */
  function prodOptions(info) {
    const out = [];
    info.querySelectorAll(".js-product-edition-option").forEach(function (o) {
      const nameEl = o.querySelector(".js-product-edition-option-name");
      const label = nameEl ? nameEl.textContent.trim().replace(/:$/, "") : "";
      const vals = [];
      // Тильда рисует варианты либо селектом, либо кнопками — берём оба.
      o.querySelectorAll("select option, .js-product-edition-option-item, .t-product__option-item")
        .forEach(function (v) {
          const t = (v.textContent || "").trim();
          if (t && vals.indexOf(t) < 0) vals.push(t);
        });
      if (label && vals.length) out.push({ label: label, values: vals });
    });
    return out;
  }

  function seoProduct() {
    const info = document.querySelector(".t-store__prod-popup__info");
    if (!info) return;
    const nameEl = info.querySelector(".js-store-prod-name, .t-store__prod-popup__name");
    const name = nameEl ? nameEl.textContent.trim() : "";
    if (!name) return;
    const old = document.getElementById("kw-ld-product");
    if (old && old.dataset.for === name) return;
    if (old) old.remove();

    const priceEl = info.querySelector(".js-product-price, .t-store__prod-popup__price-value");
    // берём ТОЛЬКО первое число — рядом может стоять зачёркнутая старая цена
    const priceMatch = priceEl ? priceEl.textContent.match(/\d[\d\s ]*/) : null;
    const price = priceMatch ? priceMatch[0].replace(/\D/g, "") : "";
    // картинки в галерее Тильды — фоновые дивы; надёжнее взять её же og:image
    const ogImg = document.querySelector('meta[property="og:image"]');
    const img = ogImg && ogImg.content ? ogImg.content : null;
    const descEl = info.querySelector(".t-store__prod-popup__text");
    const st = statsFor(name);
    const desc = (descEl && descEl.textContent.trim()) ||
      (name + (st ? " — " + st.sub : "") + ". Бренд Knives, Москва. Малые партии.");

    const ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": name,
      "brand": { "@type": "Brand", "name": "Knives" },
      // ⚠️ Описание НЕ режем под сниппет: у нас в нём весь смысл вещи — история
      // фасона, состав, крой. Ради этого текста краулер сюда и приходит.
      "description": desc.slice(0, 5000),
      "offers": {
        "@type": "Offer",
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": { "@type": "Organization", "name": "Knives" },
        "url": location.origin + location.pathname
      }
    };
    if (price) ld.offers.price = price;
    if (img) ld.image = [img];

    // innerText, а не textContent: разбор состава опирается на абзацы, а
    // textContent склеивает их в одну строку.
    const full = descEl ? (descEl.innerText || descEl.textContent) : desc;
    const mat = materialFrom(full);
    if (mat) ld.material = mat;
    const care = careFrom(full);
    const extra = [];
    if (care) extra.push({ "@type": "PropertyValue", "name": "Уход", "value": care });
    prodOptions(info).forEach(function (o) {
      if (/размер/i.test(o.label)) ld.size = o.values;
      else if (/цвет/i.test(o.label)) ld.color = o.values.join(", ");
      else extra.push({ "@type": "PropertyValue", "name": o.label, "value": o.values.join(", ") });
    });
    if (extra.length) ld.additionalProperty = extra;
    if (/шь[её]м в россии|сшито в россии|производство: ?росси/i.test(full))
      ld.countryOfOrigin = { "@type": "Country", "name": "Россия" };
    const skuEl = info.querySelector(".js-store-prod-sku, .t-store__prod-popup__sku");
    const sku = skuEl ? skuEl.textContent.replace(/sku:?/i, "").trim() : "";
    if (sku) ld.sku = sku;
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "kw-ld-product";
    s.dataset.for = name;
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);

    // титл и описание — только на отдельных страницах товара
    if (location.pathname.indexOf("/tproduct") === 0) {
      if (document.title.trim() === name)
        document.title = name + " — купить в интернет-магазине Knives";
      const md = document.querySelector('meta[name="description"]');
      if (md && !md.content.trim())
        md.content = (desc.indexOf(name) === 0 ? desc : name + ": " + desc).slice(0, 158);
    }
  }

  function seoAlts() {
    document.querySelectorAll(
      '.t-store__card img:not([alt]), .t-store__card img[alt=""]')
      .forEach(function (img) {
        const card = img.closest(".t-store__card");
        const t = card ? titleOf(card) : "";
        if (t) img.alt = t + " — Knives";
      });
  }

  /**
   * КАТАЛОГ В МАШИННОМ ВИДЕ.
   *
   * ⚠️ ДЛЯ ПАРСЕРА КАТАЛОГА У НАС НЕ БЫЛО НИЧЕГО. Product-разметка есть только
   * у ОТКРЫТОЙ карточки товара, а на витрине краулер видел строку вида
   * «Сюртук 17 200р.» — то есть текст, из которого цену и ссылку надо угадывать.
   * LLM-краулеры (crawl4ai и прочие) в первую очередь читают structured data,
   * поэтому весь каталог отдаём списком: имя, цена, валюта, наличие, ссылка,
   * картинка.
   *
   * ⚠️ Список ПЕРЕСОБИРАЕТСЯ при догрузке. Кнопка «load more» добавляет
   * карточки, и разметка, снятая один раз на старте, соврала бы о размере
   * каталога. Поэтому пишем количество в dataset и обновляем, когда оно
   * изменилось.
   */
  function seoCatalog() {
    const cards = document.querySelectorAll(".t-store__card");
    if (!cards.length) return;
    const old = document.getElementById("kw-ld-catalog");
    if (old && old.dataset.count === String(cards.length)) return;

    const items = [];
    cards.forEach(function (card, i) {
      const name = titleOf(card);
      // ⚠️ Тестовый товар в машинную разметку не пускаем НИКОГДА, даже когда
      // витрина показана по ?test=1: разметку читают краулеры, а не мы.
      if (!name || isTestName(name)) return;
      const priceEl = card.querySelector(".t-store__card__price-value, .js-store-prod-price-value");
      const price = priceEl ? priceEl.textContent.replace(/\D/g, "") : "";
      const link = card.querySelector("a[href]");
      // ⚠️ Картинки товара у Тильды — ФОН дива, а не <img>: тег есть не всегда,
      // а путь лежит в data-original (ленивая загрузка) или в style.
      const bg = card.querySelector(".t-store__card__bgimg, [data-original]");
      let imgUrl = bg ? bg.getAttribute("data-original") : "";
      if (!imgUrl && bg && bg.style.backgroundImage) {
        const m = bg.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (m) imgUrl = m[1];
      }
      const prod = {
        "@type": "Product",
        "name": name,
        "brand": { "@type": "Brand", "name": "Knives" },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "RUB",
          "availability": "https://schema.org/InStock"
        }
      };
      if (price) prod.offers.price = price;
      // ⚠️ Тильда кладёт в карточки http-ссылки; в разметке это лишний редирект
      // и повод для краулера считать страницу другой.
      if (link) prod.offers.url = link.href.replace(/^http:/, "https:");
      if (imgUrl) prod.image = [imgUrl];
      const st = statsFor(name);
      if (st && st.sub) prod.description = name + " — " + st.sub + ". Бренд Knives, Москва.";
      items.push({ "@type": "ListItem", "position": i + 1, "item": prod });
    });
    if (!items.length) return;

    const ld = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Каталог Knives",
      "numberOfItems": items.length,
      "itemListElement": items
    };
    const s = old || document.createElement("script");
    s.type = "application/ld+json";
    s.id = "kw-ld-catalog";
    s.dataset.count = String(cards.length);
    s.textContent = JSON.stringify(ld);
    if (!old) document.head.appendChild(s);
  }

  function seoPatch() {
    seoCanonical();
    seoOrg();
    seoProduct();
    seoCatalog();
    seoAlts();
  }

  /* ==== ПОРЯДОК СЕТКИ: топы → туники → остальное → пончо в хвост ====
   * Внутри групп исходный порядок Тильды сохраняется. Идемпотентно:
   * двигаем DOM только если порядок реально отличается. */
  // Осенний дроп 2026 — первым, в этом порядке. Тильда в порядке каталога новые кладёт
  // в хвост, а переставить их в редакторе можно только руками по одному.
  const NEW_FIRST = ["тренч", "капюшоном", "сатин", "красным крестом", "серебристым крестом", "красные", "сюртук ii"];
  function gridPrio(title) {
    const t = title.toLowerCase();
    for (let i = 0; i < NEW_FIRST.length; i++) if (t.indexOf(NEW_FIRST[i]) >= 0) return -20 + i;
    if (t.indexOf("топ") >= 0) return 0;
    if (t.indexOf("туника") >= 0) return 1;
    if (t.indexOf("пончо") >= 0) return 9;
    return 5;
  }

  function sortCatalog() {
    // Контейнер Тильды — flex, поэтому порядок задаём чистым CSS order,
    // НЕ трогая DOM: перемещение узлов ломало тильдовские grid-separator'ы
    // (пустота над каталогом на широких экранах).
    document.querySelectorAll(".t-store__card-list").forEach(function (list) {
      [].slice.call(list.children).forEach(function (ch) {
        if (ch.classList.contains("t-store__card")) {
          const t = titleOf(ch);
          if (t) ch.style.order = gridPrio(t);
        } else {
          ch.style.order = 50;   // сепараторы и прочее — в хвост, они пустые
        }
      });
    });
  }

  /* ==== ТЕСТОВЫЙ ТОВАР: виден только по ссылке ====
   *
   * Прогон оплаты на живом сайте требует настоящего товара за копейки — но
   * лежать на витрине рядом с сюртуком за 17 200 он не должен: покупатель
   * увидит «Тестовый товар 10 ₽» и сделает свои выводы, а поисковик утащит
   * его в выдачу.
   *
   * Поэтому карточка с названием, начинающимся на «тест», скрыта, пока в
   * адресе нет ?test=1. Флаг запоминается на вкладку, чтобы он не слетал при
   * переходе в корзину и обратно. Сама страница товара открывается по прямой
   * ссылке всегда — прячем только витрину.
   */
  function testMode() {
    try {
      if (/[?&]test=1/.test(location.search)) sessionStorage.setItem("kwTest", "1");
      return sessionStorage.getItem("kwTest") === "1";
    } catch (e) {
      return /[?&]test=1/.test(location.search);
    }
  }

  const isTestName = (t) => /^\s*тест/i.test(t || "");

  function hideTestCards() {
    const show = testMode();
    document.querySelectorAll(".t-store__card").forEach(function (card) {
      if (!isTestName(titleOf(card))) return;
      card.style.display = show ? "" : "none";
      if (show) card.style.order = 99;   // в конец витрины, а не в середину
    });
  }

  function hideSoldOut() {
    document.querySelectorAll(".t-store__card *").forEach(function (el) {
      if (el.children.length) return;
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "нет в наличии" || t === "out of stock") el.classList.add("kw-soldout-hidden");
    });
  }
  function scan() {
    document.querySelectorAll(".t-store__card:not([data-kw-done])")
      .forEach(decorate);
    hideSoldOut();
    hideTestCards();
    fixTypos();
    mountLegal();
    mountDropBar();
    mountStats();
    seoPatch();
    sortCatalog();
  }

  /* ==== ОПЕЧАТКИ В ГОТОВЫХ БЛОКАХ ТИЛЬДЫ ====
   * Правим ТОЛЬКО текстовые узлы и ТОЛЬКО точным совпадением: замена по
   * innerHTML снесла бы вложенную вёрстку блока.
   */
  const TYPOS = [["Contract us", "Contact us"]];

  function fixTypos() {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      for (const [from, to] of TYPOS)
        if (n.nodeValue.indexOf(from) >= 0) hits.push([n, from, to]);
    }
    hits.forEach(function (h) { h[0].nodeValue = h[0].nodeValue.split(h[1]).join(h[2]); });
  }

  /* ==== ДОКУМЕНТЫ: продавец, связь, порядок претензий ====
   *
   * ⚠️ ЖИВЁТ НА ОДНОЙ СТРАНИЦЕ, А НЕ ПОЛОСОЙ ПОД КАЖДОЙ. Первая редакция
   * вешала блок в подвал всего сайта — закон это закрывало, но каталог
   * заканчивался простынёй реквизитов. Решение владельца: отдельный раздел
   * меню, как «О нас» и «Доставка». Роль раздела играет существующая страница
   * «Документы» — она уже в меню и ровно про это.
   *
   * ⚠️ СТАРЫЙ ТЕКСТ СТРАНИЦЫ ЗАМЕЩАЕМ, А НЕ ДОПОЛНЯЕМ: там ровно те же
   * ссылки и контакты, и рядом они читались бы как два разных ответа на один
   * вопрос.
   *
   * ⚠️ Порядок ответа на претензию — это ТРЕБОВАНИЕ, а не вежливость:
   * отвечать нужно ТЕМ ЖЕ способом, каким она пришла, поэтому прямо просим
   * указать способ ответа. Сроки названы раздельно: деньги — 10 дней
   * (ст. 22), замена — 7 дней (ст. 21). Одним числом их писать нельзя.
   */
  const SELLER = {
    name: "ИП Чинарев Дмитрий Алексеевич",
    ogrnip: "324774600504740",
    inn: "744410437156",
    address: "115409, Москва, ул. Кошкина, д. 9, кв. 73",
    email: "kniveswear@gmail.com",
    phone: "+7 925 050-24-11",
    phoneHref: "+79250502411",
    tg: "kniveswear",
  };

  const LEGAL_HTML =
    '<div class="kw-legal-in">' +
      "<div><h4>Продавец</h4>" +
        "<b>" + SELLER.name + "</b>" +
        "ОГРНИП " + SELLER.ogrnip + "<br>ИНН " + SELLER.inn + "<br>" +
        SELLER.address +
      "</div>" +
      "<div><h4>Связь</h4>" +
        '<a href="mailto:' + SELLER.email + '">' + SELLER.email + "</a><br>" +
        '<a href="tel:' + SELLER.phoneHref + '">' + SELLER.phone + "</a><br>" +
        '<a href="https://t.me/' + SELLER.tg + '" rel="noopener">Telegram @' + SELLER.tg + "</a>" +
      "</div>" +
      "<div><h4>Претензии и возврат</h4>" +
        "Претензию можно подать в электронном виде: письмом на " +
        '<a href="mailto:' + SELLER.email + '">' + SELLER.email + "</a> или в Telegram " +
        '<a href="https://t.me/' + SELLER.tg + '" rel="noopener">@' + SELLER.tg + "</a>. " +
        "Укажите номер заказа, суть требования и способ ответа — ответим тем же способом, " +
        "которым пришла претензия." +
        '<div class="kw-legal-note">Сроки по Закону «О защите прав потребителей»: ' +
        "возврат уплаченной суммы — 10 дней, замена товара — 7 дней.</div>" +
      "</div>" +
      '<div><h4>Документы</h4><div class="kw-legal-docs">' +
        '<a href="/oferta">Договор оферты</a>' +
        '<a href="/agreement">Пользовательское соглашение</a>' +
        '<a href="/iddqd">Политика возвратов</a>' +
        '<a href="/showmethemoney">Банковские реквизиты</a>' +
      "</div></div>" +
    "</div>";

  function mountLegal() {
    if (!/^\/docs\/?$/.test(location.pathname)) return;
    if (document.getElementById("kw-legal")) return;
    // Текстовый блок страницы «Документы» — тот самый список ссылок и контактов.
    const host = document.querySelector("#rec1041210936 .t-text") ||
                 document.querySelector(".t-rec .t-text");
    if (!host) return;
    host.id = "kw-legal";
    host.classList.add("kw-legal");
    host.innerHTML = LEGAL_HTML;
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
    bar.setAttribute("role", "note");
    bar.setAttribute("aria-label", DROP.title);
    bar.innerHTML = `<i aria-hidden="true"></i><b></b>`;
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
    loadLoyalty();
  }

  /* Клиент лояльности (Telegram-вход + баллы) — отдельным файлом из этого же репо,
     чтобы правки экономики/UI кабинета не трогали хук рамок. */
  function loadLoyalty() {
    if (document.getElementById("kw-loyalty-js")) return;
    const s = document.createElement("script");
    s.id = "kw-loyalty-js";
    s.defer = true;
    s.src = "https://dmchinarev-maker.github.io/kniveswear-hook/loyalty.js";
    document.head.appendChild(s);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();
})();

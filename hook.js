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
  const VERSION = "1.3.0";

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
  /* все карточки с грейдом удлинены вниз — цена не липнет к краю
     (селектор с запасом специфичности против тильдовского CSS) */
  .t-store__card.kw-card{padding-bottom:26px !important;background:#fff}

  /* тильдовский значок SALE скрыт — редкость говорит сама за себя */
  .t-store__card__mark{display:none !important}

  /* ==== ОКНО СТАТОВ: мягкая карточка (дизайн варианта A), смыслы паспорта ==== */
  .kw-stats{margin:26px 0 8px;border:1px solid #ececec;background:#fff;
    padding:24px 26px 0;box-shadow:0 10px 40px rgba(0,0,0,.06);
    font-family:'TildaSans',Arial,sans-serif;color:#111}
  .kw-stats .kn{font-size:19px;font-weight:700;letter-spacing:.04em;color:var(--kw-sc,#111)}
  .kw-stats .ks{font-size:11px;letter-spacing:.16em;text-transform:uppercase;
    color:#8a8a8a;margin:5px 0 20px;line-height:1.8}
  .kw-srow{display:grid;grid-template-columns:128px 1fr 34px;gap:10px;align-items:center;margin-bottom:10px}
  .kw-srow .l{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#555}
  .kw-srow .v{font-size:12.5px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
  .kw-strack{display:block;height:4px;background:#f0f0f0;overflow:hidden}
  .kw-sfill{display:block;height:100%;background:#111;width:var(--w);
    animation:kwGrow .9s cubic-bezier(.22,1,.36,1)}
  @keyframes kwGrow{from{width:0}}
  .kw-foot{margin-top:16px;padding-top:13px;border-top:1px solid #ececec;
    font-size:12.5px;color:#8a8a8a;line-height:1.75}
  .kw-foot b{color:#555;font-weight:600}
  .kw-check{border-top:1px solid #ececec;margin:0 -26px;padding:13px 26px 16px;background:#fafafa}
  .kw-check .kc-t{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8a8a8a}
  .kw-check .kc-row{display:flex;gap:14px;align-items:flex-start;margin-top:9px}
  .kw-roll{font-family:'TildaSans',Arial,sans-serif;font-size:12px;font-weight:600;
    letter-spacing:.1em;text-transform:uppercase;background:#111;color:#fff;
    border:0;padding:10px 14px;cursor:pointer;white-space:nowrap}
  .kw-roll:hover{background:#333}
  .kw-res{font-family:Georgia,serif;font-style:italic;font-size:13.5px;color:#3c3c3c;
    line-height:1.5;min-height:38px;flex:1}
  .kw-res b{font-style:normal;font-family:'TildaSans',Arial,sans-serif;
    font-size:11px;letter-spacing:.14em}
  .kw-res b.ok{color:#2e7d32} .kw-res b.no{color:#b3362c}
  .kw-card{transition:transform .22s ease, box-shadow .35s ease}
  .kw-card:hover{box-shadow:0 6px 40px var(--kw-glow), 0 2px 14px var(--kw-glow)}
  .kw-card .t-store__card__imgwrapper::before{content:"";position:absolute;
    left:0;right:0;bottom:0;height:3px;z-index:3;pointer-events:none;
    background:linear-gradient(90deg,transparent,var(--kw-c),transparent);
    transform:scaleX(0);transition:transform .4s cubic-bezier(.22,1,.36,1)}
  .kw-card:hover .t-store__card__imgwrapper::before{transform:scaleX(1)}

  /* ЛЕГЕНДАРКА — «ЖИВАЯ КРОМКА»: градиент грейда бежит по периметру */
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

  /* ==== СТАТЫ ВЕЩЕЙ: паспорт + проверка навыка (2d6 + мод против сложности).
   * match — подстрока названия (lowercase), первое совпадение побеждает. ==== */
  const STATS = [
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
    const rar = rarityFor(title), rc = RAR[rar] ? RAR[rar].c : "#111";
    box.style.setProperty("--kw-sc", rc);
    let num = 0;
    for (let i = 0; i < title.length; i++) num = (num * 31 + title.charCodeAt(i)) % 97;
    const bars = Object.entries(st.bars).map(([k, v]) =>
      `<div class="kw-srow"><span class="l">${k}</span>` +
      `<span class="kw-strack"><span class="kw-sfill" style="--w:${v}%"></span></span>` +
      `<span class="v">${v}</span></div>`).join("");
    const gradeLabel = RAR[rar] ? RAR[rar].label : "";
    const foot = [`<b>Слот:</b> ${st.slot}`]
      .concat(st.pass.map(p => `<b>${p[0]}:</b> ${p[1]}`)).join(" · ");
    box.innerHTML =
      `<div class="kn">${title}</div>` +
      `<div class="ks">${gradeLabel} · ${st.sub} · паспорт № 07/${String(num).padStart(2, "0")}</div>` +
      bars +
      `<div class="kw-foot">${foot}</div>` +
      `<div class="kw-check"><div class="kc-t">Проверка: ${st.check.skill} · 2d6+${st.check.mod} против ${st.check.diff}</div>` +
      `<div class="kc-row"><button class="kw-roll" type="button">${st.check.act}</button>` +
      `<div class="kw-res"><i>Кубики ждут.</i></div></div></div>`;
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
    });
  }

  /* ==== SEO: структурированная разметка и гигиена головы документа ====
   * Всё идемпотентно и выполняется на каждом scan() — Google и Яндекс
   * рендерят JS и читают итоговый DOM. */

  function seoCanonical() {
    const l = document.querySelector('link[rel="canonical"]');
    if (l && l.href && l.href.indexOf("http://") === 0)
      l.href = l.href.replace("http://", "https://");
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
      "description": desc.slice(0, 300),
      "offers": {
        "@type": "Offer",
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock",
        "url": location.origin + location.pathname
      }
    };
    if (price) ld.offers.price = price;
    if (img) ld.image = [img];
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

  function seoPatch() {
    seoCanonical();
    seoOrg();
    seoProduct();
    seoAlts();
  }

  /* ==== ПОРЯДОК СЕТКИ: топы → туники → остальное → пончо в хвост ====
   * Внутри групп исходный порядок Тильды сохраняется. Идемпотентно:
   * двигаем DOM только если порядок реально отличается. */
  function gridPrio(title) {
    const t = title.toLowerCase();
    if (t.indexOf("топ") >= 0) return 0;
    if (t.indexOf("туника") >= 0) return 1;
    if (t.indexOf("пончо") >= 0) return 9;
    return 5;
  }

  function sortCatalog() {
    document.querySelectorAll(".t-store__grid-cont").forEach(function (grid) {
      const units = [].slice.call(grid.children).filter(function (ch) {
        return ch.classList.contains("t-store__card") ||
               ch.querySelector(".t-store__card");
      });
      if (units.length < 2) return;
      const cardOf = function (u) {
        return u.classList.contains("t-store__card")
          ? u : u.querySelector(".t-store__card");
      };
      // сортируем только когда все названия уже отрисованы
      if (units.some(function (u) { return !titleOf(cardOf(u)); })) return;
      const sorted = units.slice().sort(function (a, b) {
        return gridPrio(titleOf(cardOf(a))) - gridPrio(titleOf(cardOf(b)));
      });
      const changed = sorted.some(function (u, i) { return u !== units[i]; });
      if (changed) sorted.forEach(function (u) { grid.appendChild(u); });
    });
  }

  function scan() {
    document.querySelectorAll(".t-store__card:not([data-kw-done])")
      .forEach(decorate);
    mountDropBar();
    mountStats();
    seoPatch();
    sortCatalog();
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

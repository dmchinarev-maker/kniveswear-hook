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
  const VERSION = "1.0.3";

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

  /* ==== ОКНО СТАТОВ В ПОПАПЕ ТОВАРА: паспорт изделия с барами ==== */
  .kw-stats{margin:26px 0 8px;border:1.5px solid #111;background:#fff;
    font-family:'TildaSans',Arial,sans-serif;color:#111}
  .kw-stats .ksh{display:flex;justify-content:space-between;align-items:baseline;
    padding:13px 18px;border-bottom:1.5px solid #111}
  .kw-stats .ksh b{font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
  .kw-stats .ksh i{font-style:normal;font-size:11px;color:#8a8a8a;font-variant-numeric:tabular-nums}
  .kw-stats .ksb{padding:16px 18px 6px}
  .kw-srow{display:grid;grid-template-columns:118px 1fr 34px;gap:10px;align-items:center;margin-bottom:9px}
  .kw-srow .l{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#555}
  .kw-srow .v{font-size:12px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
  .kw-strack{display:block;height:4px;background:#f0f0f0;overflow:hidden}
  .kw-sfill{display:block;height:100%;background:#111;width:var(--w);
    animation:kwGrow .9s cubic-bezier(.22,1,.36,1)}
  @keyframes kwGrow{from{width:0}}
  .kw-pass{padding:4px 18px 12px}
  .kw-pass div{display:flex;gap:12px;font-size:12.5px;padding:5px 0;border-top:1px solid #eee}
  .kw-pass span{flex:0 0 118px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a;padding-top:1px}
  .kw-stamp{display:inline-block;margin:2px 18px 14px;border:2px solid var(--kw-sc,#111);
    color:var(--kw-sc,#111);font-size:10px;font-weight:700;letter-spacing:.2em;
    text-transform:uppercase;padding:5px 11px;transform:rotate(-3deg)}
  .kw-check{border-top:1.5px solid #111;padding:13px 18px 16px;background:#fafafa}
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
    { match:"сюртук",
      bars:{"Резист холоду":78,"Резист жаре":22,"Ветрозащита":84,"Прочность":90,"Дерзость":95},
      pass:[["Диапазон","−15…+10 °C"],["Испытано","зима, переговорные, чужие похороны"]],
      check:{skill:"Авторитет",act:"Войти без стука",mod:4,diff:12,
        ok:["Комната не встаёт. Комната просто замолкает. Этого достаточно.",
            "Кто-то отодвигает стул. Не для себя — для тебя."],
        no:["Ты вошёл без стука. Дверь была не та.",
            "Внутри никого. Авторитет израсходован на пустую комнату."]}},
    { match:"серый меланж",
      bars:{"Резист холоду":70,"Резист жаре":30,"Стелс":64,"Прочность":75,"Дерзость":52},
      pass:[["Диапазон","−8…+14 °C"],["Совместимость","туман, бетон, вторник"]],
      check:{skill:"Внутренняя империя",act:"Пройти мимо химчистки",mod:2,diff:9,
        ok:["Меланж скрывает всё, что ты пережил. Даже кофе четверга.",
            "Пятна — это события. Сегодня событий не видно."],
        no:["Приёмщица смотрит сквозь витрину. Она знает.",
            "Ты остановился у витрины. Это уже признание."]}},
    { match:"брюки из шерсти",
      bars:{"Резист холоду":72,"Резист жаре":28,"Стелс":58,"Прочность":78,"Дерзость":55},
      pass:[["Диапазон","−10…+12 °C"],["Испытано","ноябрь, перрон, ожидание"]],
      check:{skill:"Savoir faire",act:"Сесть на корточки, не потеряв лица",mod:2,diff:9,
        ok:["Колени согласны. Стрелки целы. Район уважает.",
            "Ты садишься, как учили деды: спина прямая, взгляд в горизонт."],
        no:["Стрелка дрогнула. Где-то в Милане заплакал портной.",
            "Подъём вышел не таким плавным. Свидетели есть."]}},
    { match:"пончо в клетку",
      bars:{"Резист холоду":76,"Резист жаре":14,"Драма":88,"Прочность":70,"Дерзость":66},
      pass:[["Диапазон","−5…+12 °C"],["Клетка","сверена, замкнута, не выпускает"]],
      check:{skill:"Драма",act:"Опереться о парапет",mod:2,diff:9,
        ok:["Клетка ложится на гранит идеальной сеткой координат. Ты — точка отсчёта.",
            "Прохожий сверил свою жизнь с твоей клеткой. Его жизнь кривее."],
        no:["Парапет мокрый. Клетка теперь содержит реку.",
            "Ты облокотился мимо. Драма превратилась в цирк."]}},
    { match:"пончо",
      bars:{"Резист холоду":82,"Резист жаре":11,"Драма":92,"Прочность":74,"Дерзость":60},
      pass:[["Диапазон","−5…+10 °C"],["Радиус драмы","3,5 м при развороте"]],
      check:{skill:"Драма",act:"Развернуться на каблуке",mod:3,diff:10,
        ok:["Пола описывает идеальную дугу. Фотограф, которого не существует, делает снимок.",
            "Ветер подхватывает край точно по нотам. Мост аплодирует опорами."],
        no:["Разворот вышел на 240 градусов вместо 360. Голубь смотрит с осуждением.",
            "Ты запутался. Изнутри пончо темно и пахнет шерстью. Снаружи вежливо кашлянули."]}},
    { match:"орлок",
      bars:{"Резист холоду":66,"Резист жаре":32,"Стелс":81,"Прочность":72,"Дерзость":58},
      pass:[["Материал","вельвет, помнит немое кино"],["Испытано","подворотни, полночь"]],
      check:{skill:"Стелс",act:"Не отбросить тень",mod:3,diff:10,
        ok:["Фонарь моргнул — и не нашёл тебя. Вельвет поглощает свет и вопросы.",
            "Кондуктор прошёл мимо. Ты платил, но приятно, что были варианты."],
        no:["Тень легла длинная, острая, с когтями. Все обернулись. Носферату спалился.",
            "Вельвет блеснул рубчиком в свете витрины. Заметен. Красив, но заметен."]}},
    { match:"луи",
      bars:{"Резист холоду":64,"Резист жаре":36,"Savoir faire":85,"Прочность":70,"Дерзость":62},
      pass:[["Крой","версальский, адаптирован под метро"],["Испытано","двери, лестницы, реверансы"]],
      check:{skill:"Savoir faire",act:"Сказать «после вас»",mod:3,diff:9,
        ok:["Дверь удержана. Поклон лёгкий, ироничный, на грани эпохи. Людовик бы кивнул.",
            "«После вас» прозвучало так, что очередь перестроилась сама."],
        no:["Вы столкнулись в дверях. Версаль пал.",
            "«После вас» сказали одновременно. Теперь это дуэль."]}},
    { match:"кушаком",
      bars:{"Резист холоду":74,"Резист жаре":26,"Дерзость":78,"Прочность":76,"Хват":88},
      pass:[["Кушак","держит форму и намерения"],["Испытано","решительные утра"]],
      check:{skill:"Дерзость",act:"Затянуть кушак решительно",mod:3,diff:10,
        ok:["Узел лёг с первого раза. День понял, кто здесь главный.",
            "Затяжка прозвучала как выстрел стартового пистолета. Побежали."],
        no:["Кушак затянут криво. День пойдёт так же.",
            "Перетянул. Обед отменяется по техническим причинам."]}},
    { match:"перчатки",
      bars:{"Резист холоду":80,"Резист жаре":8,"Хват":90,"Прочность":68,"Авторитет":72},
      pass:[["Пара","левая помнит правую"],["Испытано","рукопожатия, дуэли (отменённые)"]],
      check:{skill:"Авторитет",act:"Снять перчатку перед рукопожатием",mod:3,diff:10,
        ok:["Пауза. Перчатка. Рука. Сделка закрыта ещё до слов.",
            "Ты снял её за палец, не глядя. Кто-то решил тебе не врать."],
        no:["Перчатка застряла. Рукопожатие превратилось в спасательную операцию.",
            "Снял и уронил. Поднимать перчатку — значит принять вызов. Свой собственный."]}},
    { match:"туника в клетку",
      bars:{"Резист холоду":38,"Резист жаре":70,"Свобода":86,"Прочность":58,"Дерзость":64},
      pass:[["Клетка","совпадает с планами на день"],["Испытано","завтраки, балконы"]],
      check:{skill:"Энциклопедия",act:"Сверить клетку с расписанием",mod:2,diff:9,
        ok:["Каждая клетка — час. Все часы твои. Расписание капитулировало.",
            "Тартан этого узора носил клан, не плативший налогов. Ты продолжаешь традицию."],
        no:["Клеток больше, чем часов в сутках. Придётся жить в долг.",
            "Ты сбился на седьмой клетке. Среда отменена."]}},
    { match:"туника",
      bars:{"Резист холоду":36,"Резист жаре":74,"Свобода":90,"Прочность":56,"Дерзость":60},
      pass:[["Силуэт","не согласован с офисом"],["Испытано","подоконники, длинные мысли"]],
      check:{skill:"Внутренняя империя",act:"Выйти к завтраку как к трону",mod:3,diff:9,
        ok:["Кухня преобразилась в тронный зал. Кофе подан. Империя проснулась.",
            "Складки легли античными. Соседи по квартире невольно выпрямились."],
        no:["Трон занят котом. Империя подождёт.",
            "Ты наступил на подол собственного величия. Больно не было. Было громко."]}},
    { match:"топ черный",
      bars:{"Резист холоду":16,"Резист жаре":78,"Стелс":88,"Прочность":60,"Дерзость":58},
      pass:[["Цвет","чернее договорённостей"],["Испытано","бары, тёмные залы"]],
      check:{skill:"Стелс",act:"Раствориться в баре",mod:4,diff:9,
        ok:["Бармен наливает не спрашивая. Ты здесь был всегда.",
            "Тебя не видно на групповом фото. Идеально."],
        no:["Вспышка. Кто-то отметил тебя на фото. Стелс скомпрометирован до утра.",
            "Чёрный топ, белая барная подсветка. Ты — негатив самого себя."]}},
    { match:"березка",
      bars:{"Резист холоду":18,"Резист жаре":76,"Ностальгия":84,"Прочность":60,"Дерзость":54},
      pass:[["Принт","берёза, среднерусская"],["Испытано","дачи, электрички, июль"]],
      check:{skill:"Внутренняя империя",act:"Вспомнить лето",mod:3,diff:9,
        ok:["Запахло грозой и смородиной. Тебе восемь, и всё ещё впереди.",
            "Берёза на груди зашумела. Город на секунду выключили."],
        no:["Вспомнилась только очередь в шиномонтаж. Тоже лето, но не то.",
            "Лето не вспомнилось. Берёзка сочувственно шелестит принтом."]}},
    { match:"лонгслив",
      bars:{"Резист холоду":34,"Резист жаре":52,"Драма":72,"Прочность":62,"Дерзость":56},
      pass:[["Шнуровка","регулирует степень откровенности"],["Испытано","свидания, концерты"]],
      check:{skill:"Драма",act:"Затянуть шнуровку до откровения",mod:2,diff:10,
        ok:["Узел лёг асимметрично и честно. Собеседник рассказал лишнее первым.",
            "Шнуровка натянулась как струна. Вечер приобрёл сюжет."],
        no:["Перетянул. Откровение отложено из-за нехватки кислорода.",
            "Шнурок порвался в кульминации. Драма есть, реквизита нет."]}},
    { match:"футболка",
      bars:{"Резист холоду":12,"Резист жаре":80,"Стелс":91,"Прочность":60,"Дерзость":40},
      pass:[["Слот","базовый, несъёмный"],["Испытано","всё, что ты помнишь"]],
      check:{skill:"Стелс",act:"Остаться незамеченным",mod:4,diff:8,
        ok:["Никто не запомнит, во что ты был одет. В этом и заключался план.",
            "Свидетели опишут «человека в футболке». Их будет миллион."],
        no:["V-вырез сработал как прицел. Комплимент прилетел точно в него.",
            "Тебя запомнили. Провал операции, успех вечера."]}},
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
    const pass = st.pass.map(p =>
      `<div><span>${p[0]}</span>${p[1]}</div>`).join("");
    box.innerHTML =
      `<div class="ksh"><b>Паспорт изделия</b><i>№ 07/${String(num).padStart(2, "0")}</i></div>` +
      `<div class="ksb">${bars}</div>` +
      `<div class="kw-pass">${pass}</div>` +
      `<span class="kw-stamp">Годен к ношению</span>` +
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

  function scan() {
    document.querySelectorAll(".t-store__card:not([data-kw-done])")
      .forEach(decorate);
    mountDropBar();
    mountStats();
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

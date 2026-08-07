/* kniveswear — ВЫБОР ПУНКТА ВЫДАЧИ OZON в корзине Тильды.
   Грузится из loyalty.js, когда открывается корзина.

   Как это работает:
   • список ПВЗ тянем со своего бэкенда (/api/ozon/points) — OAuth-секрет
     в браузер не уходит;
   • выбранный пункт пишем в скрытое поле ozon_point — его уже читает вебхук
     заказа и после ОПЛАТЫ отдаёт отправление в логистику Ozon;
   • адрес пункта подставляем в поле «Адрес доставки», чтобы заказ был читаем
     и в самой Тильде, без похода в наш бэкенд.

   ⚠️ Модель данных Ozon: point/list отдаёт ВСЕ 92 000 пунктов страны и только
   координаты, без адресов; адреса приходят отдельным методом пачками по 100.
   Поэтому вся страна один раз выгружена в нашу базу, а здесь просто поиск по
   адресу: списка городов у Ozon нет и быть не может, их тысячи. */
(function () {
  "use strict";

  var P = (window.KWL_PVZ = window.KWL_PVZ || {});
  var BACKEND = "https://kniveswear-loyalty.vercel.app";
  var points = null;      // найденные пункты
  var chosen = null;      // выбранный пункт
  var timer = null;       // антидребезг ввода
  var lastQ = "";
  var LS = "kw_pvz_choice";

  /* ---------- утилиты ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function saveChoice(p) {
    try { localStorage.setItem(LS, JSON.stringify(p)); } catch (e) {}
  }
  function loadChoice() {
    try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { return null; }
  }

  /* ---------- стили ---------- */
  function styles() {
    if (document.getElementById("kw-pvz-css")) return;
    var s = document.createElement("style");
    s.id = "kw-pvz-css";
    s.textContent = [
      ".kwp{margin:18px 0;border:1px solid #e6e6e6;background:#fff;",
      "font-family:'TildaSans',Arial,sans-serif;color:#111}",
      ".kwp-h{display:flex;align-items:center;justify-content:space-between;gap:12px;",
      "padding:14px 16px;border-bottom:1px solid #f0f0f0}",
      ".kwp-h b{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}",
      ".kwp-h em{font-style:normal;font-size:11px;color:#8a8a8a}",
      ".kwp-body{padding:14px 16px}",
      ".kwp-q{width:100%;box-sizing:border-box;border:1px solid #ddd;padding:11px 12px;",
      "font:400 14px/1.3 'TildaSans',Arial,sans-serif;min-height:44px}",
      ".kwp-q:focus{outline:0;border-color:#111}",
      ".kwp-list{max-height:230px;overflow-y:auto;margin-top:10px;-webkit-overflow-scrolling:touch}",
      ".kwp-i{display:block;width:100%;text-align:left;background:none;border:0;",
      "border-bottom:1px solid #f4f4f4;padding:11px 4px;cursor:pointer;min-height:44px}",
      ".kwp-i:hover{background:#fafafa}",
      ".kwp-i:focus-visible{outline:2px solid #111;outline-offset:-2px}",
      ".kwp-i .a{display:block;font-size:14px;line-height:1.4}",
      ".kwp-i .m{display:block;font-size:11.5px;color:#8a8a8a;margin-top:3px}",
      ".kwp-none{padding:16px 4px;font-size:13px;color:#9a9a9a}",
      /* выбранный пункт */
      ".kwp-sel{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;background:#fafafa}",
      ".kwp-sel .t{flex:1;min-width:0}",
      ".kwp-sel .a{font-size:14px;font-weight:600;line-height:1.4}",
      ".kwp-sel .m{font-size:11.5px;color:#8a8a8a;margin-top:4px;line-height:1.5}",
      ".kwp-chg{background:none;border:0;color:#8a8a8a;font:600 11px/1 'TildaSans',Arial,sans-serif;",
      "letter-spacing:.1em;text-transform:uppercase;cursor:pointer;text-decoration:underline;",
      "padding:8px;min-height:40px;white-space:nowrap}",
      ".kwp-chg:hover{color:#111}",
      ".kwp-note{margin:0 16px 14px;font-size:11px;color:#b3862c;background:#fff8e8;",
      "border:1px solid #f0e3c4;padding:8px 10px;line-height:1.5}",
    ].join("");
    document.head.appendChild(s);
  }

  /* ---------- данные ---------- */
  // Ищем по всей стране: строка запроса уходит на бэкенд, тот шарит по адресам
  // собственной выгрузки. Меньше трёх букв не ищем — вернётся пол-России.
  function search(q) {
    return fetch(BACKEND + "/api/ozon/points?q=" + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (d) { points = (d && d.points) || []; return d; })
      .catch(function () { points = []; return {}; });
  }

  /* ---------- поле адреса ---------- */
  // Ищем видимое поле доставки по имени, подсказке и подписи над ним.
  function findAddress(form) {
    var found = null;
    var fields = form.querySelectorAll("input:not([type=hidden]), textarea");
    Array.prototype.forEach.call(fields, function (el) {
      if (found) return;
      var hint = (el.name || "") + " " + (el.placeholder || "");
      var wrap = el.closest(".t-input-group");
      if (wrap) { var t = wrap.querySelector(".t-input-title"); if (t) hint += " " + t.textContent; }
      if (/адрес|address|доставк/i.test(hint)) found = el;
    });
    return found;
  }

  // ⚠️ Поле НЕ УДАЛЯЕМ, а прячем: адрес в него по-прежнему пишется из выбранного
  // пункта, иначе заказ в Тильде придёт вообще без адреса доставки. Заодно
  // снимаем обязательность — скрытое обязательное поле не даст отправить форму.
  function hideAddress(form) {
    var addr = findAddress(form);
    if (!addr) return;
    addr.required = false;
    addr.removeAttribute("required");
    var wrap = addr.closest(".t-input-group") || addr.parentNode;
    if (wrap && wrap !== form) wrap.style.display = "none";
  }

  /* ---------- запись выбора в форму ---------- */
  function writeToForm(form, p) {
    var hid = form.querySelector('input[name="ozon_point"]');
    if (!hid) {
      hid = document.createElement("input");
      hid.type = "hidden"; hid.name = "ozon_point";
      form.appendChild(hid);
    }
    hid.value = p ? p.id : "";

    // Адрес пункта пишем в (скрытое) поле доставки — заказ должен читаться
    // и в самой Тильде, без похода в наш бэкенд.
    var addr = findAddress(form);
    if (addr && p) {
      addr.value = "Ozon, " + p.address + " (пункт выдачи)";
      ["input", "change"].forEach(function (t) { addr.dispatchEvent(new Event(t, { bubbles: true })); });
    }
  }

  /* ---------- рендер ---------- */
  function render(box, form) {
    // 1) пункт уже выбран
    if (chosen) {
      box.innerHTML =
        '<div class="kwp-h"><b>Доставка Ozon</b><em>пункт выдачи</em></div>' +
        '<div class="kwp-sel"><div class="t"><div class="a">' + esc(chosen.address) + "</div>" +
        '<div class="m">' + esc(chosen.name) +
          (chosen.fitting ? " · есть примерочная" : "") + "</div></div>" +
        '<button class="kwp-chg" type="button">Изменить</button></div>';
      box.querySelector(".kwp-chg").onclick = function () {
        chosen = null; points = null; lastQ = ""; saveChoice(null); render(box, form);
      };
      writeToForm(form, chosen);
      return;
    }

    // 2) поиск по всей стране
    box.innerHTML =
      '<div class="kwp-h"><b>Доставка Ozon</b><em>пункты по всей России</em></div>' +
      '<div class="kwp-body">' +
        '<input class="kwp-q" type="text" placeholder="Город и улица: Казань Баумана" aria-label="Поиск пункта выдачи" value="' + esc(lastQ) + '">' +
        '<div class="kwp-list"></div>' +
      "</div>";
    var q = box.querySelector(".kwp-q");
    var list = box.querySelector(".kwp-list");

    function draw() {
      if (!points) { list.innerHTML = ""; return; }
      if (!points.length) {
        list.innerHTML = '<div class="kwp-none">Ничего не нашлось. Попробуйте только город или только улицу.</div>';
        return;
      }
      list.innerHTML = points.map(function (p, i) {
        return '<button class="kwp-i" type="button" data-i="' + i + '">' +
          '<span class="a">' + esc(p.address) + "</span>" +
          '<span class="m">' + (p.fitting ? "есть примерочная" : esc(p.name)) + "</span></button>";
      }).join("");
      Array.prototype.forEach.call(list.querySelectorAll(".kwp-i"), function (b) {
        b.onclick = function () {
          chosen = points[parseInt(b.dataset.i, 10)];
          saveChoice(chosen);
          render(box, form);
        };
      });
    }

    q.addEventListener("input", function () {
      lastQ = q.value;
      clearTimeout(timer);
      var v = q.value.trim();
      if (v.length < 3) { points = null; list.innerHTML = '<div class="kwp-none">Введите город или улицу.</div>'; return; }
      list.innerHTML = '<div class="kwp-none">Ищем…</div>';
      // Антидребезг: без него каждая буква уходила бы отдельным запросом.
      timer = setTimeout(function () {
        search(v).then(function () { if (q.value.trim() === v) draw(); });
      }, 280);
    });

    if (lastQ.trim().length >= 3 && points) draw();
    else list.innerHTML = '<div class="kwp-none">Введите город или улицу.</div>';
  }

  /* ---------- монтирование в корзину ---------- */
  P.mount = function (form) {
    if (!form || form.querySelector(".kwp")) return;
    styles();
    var box = document.createElement("div");
    box.className = "kwp";
    // Ставим перед кнопкой оплаты: доставку выбирают ДО оплаты, а не после.
    // Кнопка может быть обёрнута, поэтому поднимаемся до прямого ребёнка формы.
    var submit = form.querySelector('[type=submit], .t-submit, .t706__form-bottom, .t-form__submit');
    if (submit) {
      var anchor = submit;
      while (anchor.parentNode && anchor.parentNode !== form) anchor = anchor.parentNode;
      form.insertBefore(box, anchor);
    } else {
      form.appendChild(box);
    }

    // Адрес больше не вводят руками: его задаёт выбранный пункт выдачи.
    // Тильда перерисовывает корзину, поэтому повторяем несколько раз.
    hideAddress(form);
    [300, 900, 2000].forEach(function (t) { setTimeout(function () { hideAddress(form); }, t); });

    chosen = loadChoice();
    render(box, form);
  };
})();

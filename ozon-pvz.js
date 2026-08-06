/* kniveswear — ВЫБОР ПУНКТА ВЫДАЧИ OZON в корзине Тильды.
   Грузится из loyalty.js, когда открывается корзина.

   Как это работает:
   • список ПВЗ тянем со своего бэкенда (/api/ozon/points) — OAuth-секрет
     в браузер не уходит;
   • выбранный пункт пишем в скрытое поле ozon_point — его уже читает вебхук
     заказа и после ОПЛАТЫ отдаёт отправление в логистику Ozon;
   • адрес пункта подставляем в поле «Адрес доставки», чтобы заказ был читаем
     и в самой Тильде, без похода в наш бэкенд.

   Пока Ozon не выдал токен, бэкенд отдаёт временные точки с флагом mock —
   интерфейс тот же, поэтому при разблокировке менять здесь нечего. */
(function () {
  "use strict";

  var P = (window.KWL_PVZ = window.KWL_PVZ || {});
  var BACKEND = "https://kniveswear-loyalty.vercel.app";
  var points = null;      // весь список
  var isMock = false;
  var chosen = null;      // выбранный пункт
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
  function load() {
    if (points) return Promise.resolve(points);
    return fetch(BACKEND + "/api/ozon/points")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        points = (d && d.points) || [];
        isMock = !!(d && d.mock);
        return points;
      })
      .catch(function () { points = []; return points; });
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

    // Адрес пункта — в видимое поле доставки, чтобы заказ читался и в Тильде.
    var addr = null;
    var fields = form.querySelectorAll("input:not([type=hidden]), textarea");
    Array.prototype.forEach.call(fields, function (el) {
      if (addr) return;
      var hint = (el.name || "") + " " + (el.placeholder || "");
      var wrap = el.closest(".t-input-group");
      if (wrap) { var t = wrap.querySelector(".t-input-title"); if (t) hint += " " + t.textContent; }
      if (/адрес|address|доставк/i.test(hint)) addr = el;
    });
    if (addr && p) {
      addr.value = "Ozon, " + p.address + " (пункт выдачи)";
      ["input", "change"].forEach(function (t) { addr.dispatchEvent(new Event(t, { bubbles: true })); });
    }
  }

  /* ---------- рендер ---------- */
  function render(box, form) {
    if (chosen) {
      box.innerHTML =
        '<div class="kwp-h"><b>Доставка Ozon</b><em>пункт выдачи</em></div>' +
        '<div class="kwp-sel"><div class="t"><div class="a">' + esc(chosen.address) + "</div>" +
        '<div class="m">' + esc(chosen.name) + (chosen.worktime ? " · " + esc(chosen.worktime) : "") + "</div></div>" +
        '<button class="kwp-chg" type="button">Изменить</button></div>' +
        (isMock ? '<div class="kwp-note">Список пунктов временный: Ozon ещё не выдал доступ к API. ' +
          "Выбор сохранится и подставится автоматически, когда доступ откроют.</div>" : "");
      box.querySelector(".kwp-chg").onclick = function () { chosen = null; render(box, form); };
      writeToForm(form, chosen);
      return;
    }

    box.innerHTML =
      '<div class="kwp-h"><b>Доставка Ozon</b><em>' + (points ? points.length + " пунктов" : "загружаем…") + "</em></div>" +
      '<div class="kwp-body">' +
        '<input class="kwp-q" type="text" placeholder="Город или улица" aria-label="Поиск пункта выдачи">' +
        '<div class="kwp-list"></div>' +
      "</div>" +
      (isMock ? '<div class="kwp-note">Список пунктов временный: Ozon ещё не выдал доступ к API.</div>' : "");

    var q = box.querySelector(".kwp-q");
    var list = box.querySelector(".kwp-list");

    function draw(filter) {
      var f = (filter || "").trim().toLowerCase();
      var rows = (points || []).filter(function (p) {
        if (!f) return true;
        return (p.address + " " + p.city + " " + p.name).toLowerCase().indexOf(f) !== -1;
      }).slice(0, 40);
      if (!rows.length) {
        list.innerHTML = '<div class="kwp-none">' +
          (points && points.length ? "Ничего не нашлось. Попробуйте другой город." : "Пункты не загрузились.") +
          "</div>";
        return;
      }
      list.innerHTML = rows.map(function (p, i) {
        return '<button class="kwp-i" type="button" data-i="' + i + '">' +
          '<span class="a">' + esc(p.address) + "</span>" +
          '<span class="m">' + esc(p.name) + (p.worktime ? " · " + esc(p.worktime) : "") + "</span></button>";
      }).join("");
      Array.prototype.forEach.call(list.querySelectorAll(".kwp-i"), function (b) {
        b.onclick = function () {
          chosen = rows[parseInt(b.dataset.i, 10)];
          saveChoice(chosen);
          render(box, form);
        };
      });
    }

    q.addEventListener("input", function () { draw(q.value); });
    draw("");
  }

  /* ---------- монтирование в корзину ---------- */
  P.mount = function (form) {
    if (!form || form.querySelector(".kwp")) return;
    styles();
    var box = document.createElement("div");
    box.className = "kwp";
    // ставим перед кнопкой отправки, если нашли её, иначе в конец формы
    var submit = form.querySelector('[type=submit], .t-submit, .t706__form-bottom');
    if (submit && submit.parentNode) submit.parentNode.insertBefore(box, submit);
    else form.appendChild(box);

    chosen = loadChoice();
    render(box, form);
    load().then(function () { render(box, form); });
  };
})();

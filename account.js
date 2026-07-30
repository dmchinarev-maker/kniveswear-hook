/* kniveswear — ЛИЧНЫЙ КАБИНЕТ (полноэкранный слой поверх сайта).
   Грузится из loyalty.js после входа. Светлый минимализм сайта, шрифт TildaSans.
   Разделы: Баллы · Заказы · Данные для доставки.
   API: GET /api/account, POST /api/profile, POST /api/redeem. */
(function () {
  "use strict";

  var A = (window.KWL_ACCOUNT = window.KWL_ACCOUNT || {});
  var data = null;   // ответ /api/account
  var tab = "points";
  var root = null;

  /* ---------- стили ---------- */
  function styles() {
    if (document.getElementById("kw-acc-css")) return;
    var s = document.createElement("style");
    s.id = "kw-acc-css";
    s.textContent = [
      ".kwa-ov{position:fixed;inset:0;z-index:100000;background:rgba(255,255,255,.98);",
      "overflow-y:auto;font-family:TildaSans,system-ui,-apple-system,sans-serif;color:#111;",
      "animation:kwaIn .22s cubic-bezier(.22,1,.36,1)}",
      "@keyframes kwaIn{from{opacity:0;transform:translateY(8px)}}",
      "@media (prefers-reduced-motion:reduce){.kwa-ov{animation:none}}",
      ".kwa-wrap{max-width:840px;margin:0 auto;padding:38px 22px 80px}",
      ".kwa-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:34px}",
      ".kwa-who{display:flex;align-items:center;gap:13px;min-width:0}",
      ".kwa-ava{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#f0f0f0;flex:none}",
      ".kwa-nm{font-size:19px;font-weight:700;letter-spacing:.01em;line-height:1.2}",
      ".kwa-un{font-size:12px;color:#8a8a8a;margin-top:2px}",
      ".kwa-x{background:none;border:0;font-size:15px;letter-spacing:.14em;text-transform:uppercase;",
      "color:#8a8a8a;cursor:pointer;padding:10px;min-height:44px}",
      ".kwa-x:hover{color:#111}",
      /* карточка баланса */
      ".kwa-bal{border:1px solid #ececec;padding:26px;margin-bottom:26px;background:#fff}",
      ".kwa-bal .n{font-size:44px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}",
      ".kwa-bal .u{font-size:13px;color:#8a8a8a;margin-top:8px;line-height:1.7}",
      ".kwa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#ececec;",
      "border:1px solid #ececec;margin-bottom:30px}",
      ".kwa-cell{background:#fff;padding:16px 18px}",
      ".kwa-cell .k{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#8a8a8a}",
      ".kwa-cell .v{font-size:19px;font-weight:600;margin-top:6px;font-variant-numeric:tabular-nums}",
      /* табы */
      ".kwa-tabs{display:flex;gap:26px;border-bottom:1px solid #ececec;margin-bottom:24px}",
      ".kwa-tab{background:none;border:0;padding:0 0 13px;font:600 13px/1 TildaSans,sans-serif;",
      "letter-spacing:.1em;text-transform:uppercase;color:#a0a0a0;cursor:pointer;",
      "border-bottom:2px solid transparent;margin-bottom:-1px;min-height:44px}",
      ".kwa-tab[aria-selected=true]{color:#111;border-bottom-color:#111}",
      ".kwa-tab:focus-visible{outline:2px solid #111;outline-offset:3px}",
      /* строки истории/заказов */
      ".kwa-row{display:flex;justify-content:space-between;gap:16px;padding:15px 0;",
      "border-bottom:1px solid #f2f2f2;font-size:14px}",
      ".kwa-row .l{min-width:0}",
      ".kwa-row .t{font-weight:600}",
      ".kwa-row .d{font-size:12px;color:#8a8a8a;margin-top:4px;line-height:1.5}",
      ".kwa-row .r{white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}",
      ".kwa-row .r.pos{color:#2e7d32}",
      ".kwa-empty{padding:44px 0;text-align:center;color:#9a9a9a;font-size:14px;line-height:1.7}",
      /* форма профиля */
      ".kwa-form{display:grid;grid-template-columns:1fr 1fr;gap:16px}",
      ".kwa-f{display:flex;flex-direction:column;gap:7px}",
      ".kwa-f.full{grid-column:1/-1}",
      ".kwa-f label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8a8a8a}",
      ".kwa-f input,.kwa-f textarea{border:0;border-bottom:1px solid #dcdcdc;padding:9px 0;",
      "font:400 15px/1.4 TildaSans,sans-serif;color:#111;background:none;min-height:40px}",
      ".kwa-f textarea{resize:vertical;min-height:66px}",
      ".kwa-f input:focus,.kwa-f textarea:focus{outline:0;border-bottom-color:#111}",
      ".kwa-save{margin-top:26px;background:#111;color:#fff;border:0;padding:15px 34px;",
      "font:600 13px/1 TildaSans,sans-serif;letter-spacing:.13em;text-transform:uppercase;",
      "cursor:pointer;min-height:48px}",
      ".kwa-save:hover{background:#333}",
      ".kwa-save[disabled]{opacity:.5;cursor:default}",
      ".kwa-note{margin-top:14px;font-size:13px;color:#2e7d32;min-height:19px}",
      ".kwa-note.err{color:#b3362c}",
      /* списание баллов */
      ".kwa-redeem{border:1px solid #ececec;padding:22px;margin-top:26px;background:#fafafa}",
      ".kwa-redeem h4{margin:0 0 6px;font-size:13px;letter-spacing:.12em;text-transform:uppercase}",
      ".kwa-redeem p{margin:0 0 14px;font-size:13px;color:#777;line-height:1.6}",
      ".kwa-rr{display:flex;gap:12px;flex-wrap:wrap}",
      ".kwa-rr input{flex:1;min-width:150px;border:1px solid #ddd;padding:12px;font:inherit;min-height:46px}",
      ".kwa-rr button{background:#111;color:#fff;border:0;padding:12px 22px;cursor:pointer;",
      "font:600 12px/1 TildaSans,sans-serif;letter-spacing:.12em;text-transform:uppercase;min-height:46px}",
      ".kwa-code{margin-top:14px;background:#fff;border:1px dashed #bbb;padding:15px;text-align:center}",
      ".kwa-code b{font:700 21px/1 monospace;letter-spacing:2px;display:block;margin-bottom:6px}",
      ".kwa-code span{font-size:12px;color:#777}",
      "@media (max-width:620px){.kwa-grid{grid-template-columns:1fr}.kwa-form{grid-template-columns:1fr}",
      ".kwa-bal .n{font-size:36px}.kwa-tabs{gap:18px}.kwa-wrap{padding:26px 16px 70px}}",
    ].join("");
    document.head.appendChild(s);
  }

  /* ---------- утилиты ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return (n || 0).toLocaleString("ru-RU") + " ₽"; }
  function when(d) {
    try {
      return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return ""; }
  }
  var REASONS = {
    welcome: "Приветственные баллы",
    order: "Кэшбэк за заказ",
    redeem: "Списание на промокод",
    manual: "Начисление вручную",
  };

  /* ---------- рендер ---------- */
  function render() {
    if (!root || !data) return;
    var p = data.profile, pt = data.points, st = data.stats;

    root.innerHTML =
      '<div class="kwa-wrap">' +
        '<div class="kwa-top">' +
          '<div class="kwa-who">' +
            (p.photo ? '<img class="kwa-ava" src="' + esc(p.photo) + '" alt="">' : '<div class="kwa-ava"></div>') +
            '<div><div class="kwa-nm">' + esc(p.name || "Личный кабинет") + "</div>" +
            (p.username ? '<div class="kwa-un">@' + esc(p.username) + "</div>" : "") +
            "</div>" +
          "</div>" +
          '<button class="kwa-x" id="kwa-close">Закрыть</button>' +
        "</div>" +

        '<div class="kwa-bal">' +
          '<div class="n">' + pt.balance + " ★</div>" +
          '<div class="u">1 балл = ' + pt.rate + " ₽ · кэшбэк " + pt.accrualPct +
            "% с заказа · баллами можно оплатить до " + pt.maxRedeemPct + "% покупки</div>" +
        "</div>" +

        '<div class="kwa-grid">' +
          '<div class="kwa-cell"><div class="k">Заказов</div><div class="v">' + st.ordersCount + "</div></div>" +
          '<div class="kwa-cell"><div class="k">Куплено на</div><div class="v">' + money(st.totalSpent) + "</div></div>" +
          '<div class="kwa-cell"><div class="k">Баллов</div><div class="v">' + pt.balance + "</div></div>" +
        "</div>" +

        '<div class="kwa-tabs" role="tablist">' +
          tabBtn("points", "Баллы") + tabBtn("orders", "Заказы") + tabBtn("profile", "Мои данные") +
        "</div>" +
        '<div id="kwa-body"></div>' +
      "</div>";

    root.querySelector("#kwa-close").onclick = A.close;
    Array.prototype.forEach.call(root.querySelectorAll(".kwa-tab"), function (b) {
      b.onclick = function () { tab = b.dataset.tab; render(); };
    });
    body();
  }

  function tabBtn(id, label) {
    return '<button class="kwa-tab" role="tab" data-tab="' + id + '" aria-selected="' +
      (tab === id) + '">' + label + "</button>";
  }

  function body() {
    var el = root.querySelector("#kwa-body");
    if (tab === "points") return renderPoints(el);
    if (tab === "orders") return renderOrders(el);
    return renderProfile(el);
  }

  function renderPoints(el) {
    var pt = data.points;
    var rows = (pt.txns || []).map(function (t) {
      return '<div class="kwa-row"><div class="l"><div class="t">' +
        esc(REASONS[t.reason] || t.reason) + '</div><div class="d">' + when(t.at) +
        (t.meta ? " · " + esc(t.meta) : "") + '</div></div><div class="r' +
        (t.delta > 0 ? " pos" : "") + '">' + (t.delta > 0 ? "+" : "") + t.delta + "</div></div>";
    }).join("");

    var active = data.activeCode
      ? '<div class="kwa-code"><b>' + esc(data.activeCode.code) + "</b><span>Скидка " +
        money(data.activeCode.rub) + " · введите код в корзине при заказе</span></div>"
      : "";

    el.innerHTML =
      (rows || '<div class="kwa-empty">Пока пусто. Баллы придут после первой покупки.</div>') +
      '<div class="kwa-redeem"><h4>Потратить баллы</h4>' +
        "<p>Обменяйте баллы на промокод — его нужно ввести в корзине. " +
        "Оплатить баллами можно до " + data.points.maxRedeemPct + "% суммы заказа.</p>" +
        '<div class="kwa-rr">' +
          '<input id="kwa-amt" type="number" min="1" max="' + data.points.balance +
            '" placeholder="Сколько баллов" inputmode="numeric">' +
          '<button id="kwa-redeem-btn">Получить код</button>' +
        "</div>" +
        active +
        '<div class="kwa-note" id="kwa-rnote"></div>' +
      "</div>";

    el.querySelector("#kwa-redeem-btn").onclick = doRedeem;
  }

  function renderOrders(el) {
    var rows = (data.orders || []).map(function (o) {
      return '<div class="kwa-row"><div class="l"><div class="t">' +
        (o.items ? esc(o.items) : "Заказ №" + esc(o.id)) + '</div><div class="d">' +
        when(o.at) + (o.pointsEarned ? " · +" + o.pointsEarned + " баллов" : "") +
        (o.promo ? " · промокод " + esc(o.promo) : "") +
        '</div></div><div class="r">' + money(o.amount) + "</div></div>";
    }).join("");
    el.innerHTML = rows ||
      '<div class="kwa-empty">Здесь появятся ваши заказы.<br>За каждый начислим ' +
      data.points.accrualPct + "% баллами.</div>";
  }

  function renderProfile(el) {
    var p = data.profile;
    function f(name, label, val, type, cls) {
      return '<div class="kwa-f ' + (cls || "") + '"><label for="kwa-' + name + '">' + label +
        '</label><input id="kwa-' + name + '" name="' + name + '" type="' + (type || "text") +
        '" value="' + esc(val || "") + '"></div>';
    }
    el.innerHTML =
      '<div class="kwa-form">' +
        f("fullName", "Имя и фамилия", p.fullName, "text", "full") +
        f("phone", "Телефон", p.phone, "tel") +
        f("email", "Email", p.email, "email") +
        f("city", "Город", p.city) +
        f("postcode", "Индекс", p.postcode) +
        f("street", "Улица", p.street, "text", "full") +
        f("house", "Дом", p.house) +
        f("apartment", "Квартира", p.apartment) +
        '<div class="kwa-f full"><label for="kwa-comment">Пожелания к доставке</label>' +
          '<textarea id="kwa-comment" name="comment">' + esc(p.comment || "") + "</textarea></div>" +
      "</div>" +
      '<button class="kwa-save" id="kwa-save">Сохранить</button>' +
      '<div class="kwa-note" id="kwa-note"></div>';

    el.querySelector("#kwa-save").onclick = saveProfile;
  }

  /* ---------- действия ---------- */
  function saveProfile() {
    var btn = root.querySelector("#kwa-save");
    var note = root.querySelector("#kwa-note");
    var payload = {};
    ["fullName", "phone", "email", "city", "postcode", "street", "house", "apartment", "comment"]
      .forEach(function (n) {
        var i = root.querySelector("#kwa-" + n);
        if (i) payload[n] = i.value;
      });
    btn.disabled = true; note.className = "kwa-note"; note.textContent = "Сохраняем…";
    A.api("/api/profile", { method: "POST", body: payload }).then(function (r) {
      btn.disabled = false;
      if (r && r.ok) {
        note.textContent = "Сохранено";
        Object.keys(payload).forEach(function (k) { data.profile[k] = payload[k]; });
        if (r.phone) data.profile.phone = r.phone;
      } else {
        note.className = "kwa-note err";
        note.textContent = "Не сохранилось: " + ((r && r.error) || "ошибка сети");
      }
    });
  }

  function doRedeem() {
    var amt = parseInt((root.querySelector("#kwa-amt") || {}).value, 10);
    var note = root.querySelector("#kwa-rnote");
    note.className = "kwa-note";
    if (!amt || amt <= 0) { note.className = "kwa-note err"; note.textContent = "Укажите количество баллов"; return; }
    note.textContent = "Выпускаем код…";
    A.api("/api/redeem", { method: "POST", body: { points: amt } }).then(function (r) {
      if (r && r.code) { note.textContent = ""; A.reload(); }
      else {
        note.className = "kwa-note err";
        note.textContent = r && r.error === "insufficient balance" ? "Недостаточно баллов" :
          "Не вышло: " + ((r && r.error) || "ошибка сети");
      }
    });
  }

  /* ---------- публичное API ---------- */
  A.open = function () {
    styles();
    if (!root) {
      root = document.createElement("div");
      root.className = "kwa-ov";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-label", "Личный кабинет");
      document.body.appendChild(root);
    }
    root.style.display = "block";
    document.body.style.overflow = "hidden";
    root.innerHTML = '<div class="kwa-wrap"><div class="kwa-empty">Загружаем кабинет…</div></div>';
    A.reload();
    document.addEventListener("keydown", onKey);
  };

  A.close = function () {
    if (root) root.style.display = "none";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (A.onClose) A.onClose();
  };

  function onKey(e) { if (e.key === "Escape") A.close(); }

  A.reload = function () {
    A.api("/api/account").then(function (r) {
      if (!r || r.error) {
        if (root) root.innerHTML = '<div class="kwa-wrap"><div class="kwa-empty">' +
          (r && r.error === "unauthorized" ? "Сессия истекла — войдите заново." : "Не удалось загрузить кабинет.") +
          '</div></div>';
        return;
      }
      data = r;
      render();
    });
  };
})();

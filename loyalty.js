/* kniveswear loyalty client — вход по Telegram + баллы.
   Подключается вместе с hook.js (hook.js грузит этот файл сам).
   ⚠️ ПОСЛЕ ДЕПЛОЯ бэкенда впиши его домен в BACKEND ниже и запушь. */
(function () {
  "use strict";

  // ── КОНФИГ (заполнить после деплоя kniveswear-loyalty на Vercel) ──
  var ENABLED = true;
  var BACKEND = "https://kniveswear-loyalty.vercel.app"; // боевой бэкенд (Vercel, funwithknives)
  var BOT_NAME = "kniveswearbot";                        // @kniveswearbot — в BotFather /setdomain kniveswear.ru
  var LOYALTY_VERSION = "0.7.0";

  var LS = "kw_loyalty_jwt";
  var me = null;      // {uid,name,balance,rate,maxRedeemPct,txns}
  var profile = null; // данные доставки из ЛК — ими заполняем корзину

  /* ---------- утилиты ---------- */
  function token() { try { return localStorage.getItem(LS); } catch (e) { return null; } }
  function setToken(t) { try { localStorage.setItem(LS, t); } catch (e) {} }
  function clearToken() { try { localStorage.removeItem(LS); } catch (e) {} }

  function api(path, opts) {
    opts = opts || {};
    var h = opts.headers || {};
    var t = token();
    if (t) h["Authorization"] = "Bearer " + t;
    if (opts.body) h["Content-Type"] = "application/json";
    return fetch(BACKEND + path, {
      method: opts.method || "GET",
      headers: h,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      if (r.status === 401) { clearToken(); me = null; }
      return r.json().catch(function () { return {}; });
    });
  }

  /* ---------- перехват JWT (или ошибки) из редиректа Telegram ---------- */
  function grabTokenFromHash() {
    var e = (location.hash || "").match(/loyalty_error=([^&]+)/);
    if (e) {
      console.warn("[loyalty] вход не удался:", decodeURIComponent(e[1]));
      window.__kwlError = decodeURIComponent(e[1]);
      history.replaceState(null, "", location.pathname + location.search);
    }
    var m = (location.hash || "").match(/loyalty=([^&]+)/);
    if (m) {
      setToken(decodeURIComponent(m[1]));
      // почистить фрагмент, не трогая остальной hash
      var clean = location.hash.replace(/[#&]?loyalty=[^&]+/, "");
      history.replaceState(null, "", location.pathname + location.search + (clean && clean !== "#" ? clean : ""));
    }
  }

  /* ---------- вставка loyalty_uid в корзину Тильды ---------- */
  function injectCartField() {
    if (!me || !me.uid) return;
    // Тильдовская корзина — форма .t706__form или любая t-form внутри попапа корзины
    document.querySelectorAll("form").forEach(function (f) {
      if (f.querySelector('input[name="loyalty_uid"]')) return;
      // только формы корзины/заказа
      if (!/t706|cart|order|zakaz/i.test(f.className + " " + (f.id || ""))) return;
      var inp = document.createElement("input");
      inp.type = "hidden"; inp.name = "loyalty_uid"; inp.value = me.uid;
      f.appendChild(inp);
    });
  }

  /* ---------- АВТОЗАПОЛНЕНИЕ КОРЗИНЫ ----------
     Форма корзины Тильды рисуется динамически, а имена полей задаёт владелец
     магазина — поэтому опознаём поля по НЕСКОЛЬКИМ признакам (name, placeholder,
     подпись рядом, type). Заполняем ТОЛЬКО пустые поля: то, что человек ввёл
     руками, не трогаем. */
  var FIELD_RULES = [
    { key: "fullName", type: "text",  re: /(^|[^а-яё])(имя|фио|ф\.и\.о|name|fullname|получател)/i },
    { key: "phone",    type: "tel",   re: /(телефон|phone|тел\.?|моб)/i },
    { key: "email",    type: "email", re: /(e-?mail|почт)/i },
    { key: "city",     type: "text",  re: /(город|city|населённ|населенн)/i },
    { key: "postcode", type: "text",  re: /(индекс|почтовый\s*индекс|zip|postcode|postal)/i },
    { key: "street",   type: "text",  re: /(улиц|street)/i },
    { key: "house",    type: "text",  re: /(^|[^а-яё])(дом|house|стро)/i },
    { key: "apartment",type: "text",  re: /(кварт|квртир|apartment|apt|офис)/i },
    { key: "comment",  type: "text",  re: /(коммент|пожелан|примечан|comment|note)/i },
    // «Telegram для связи» — подставляем @username, с которым человек вошёл
    { key: "_telegram",type: "text",  re: /(telegram|телеграм|тг\b)/i },
    // общий «Адрес» одной строкой — собираем из частей
    { key: "_address", type: "text",  re: /(адрес|address|доставк)/i },
  ];

  function addressLine() {
    if (!profile) return "";
    var p = [profile.postcode, profile.city, profile.street].filter(Boolean);
    if (profile.house) p.push("д. " + profile.house);
    if (profile.apartment) p.push("кв. " + profile.apartment);
    return p.join(", ");
  }

  // Все текстовые подсказки про поле: name, placeholder, aria-label, подпись рядом.
  function hintsOf(el) {
    var h = [el.name || "", el.placeholder || "", el.getAttribute("aria-label") || ""];
    if (el.id) {
      var lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (lab) h.push(lab.textContent || "");
    }
    var wrap = el.closest(".t-input-group, .t-form__inputsbox > div, .t706__form div");
    if (wrap) {
      var t = wrap.querySelector(".t-input-title, label, .t-descr");
      if (t) h.push(t.textContent || "");
    }
    return h.join(" ").slice(0, 300);
  }

  function guessKey(el) {
    var hints = hintsOf(el);
    if (el.type === "email") return "email";
    if (el.type === "tel") return "phone";
    for (var i = 0; i < FIELD_RULES.length; i++) {
      if (FIELD_RULES[i].re.test(hints)) return FIELD_RULES[i].key;
    }
    return null;
  }

  function setVal(el, v) {
    if (!v || el.value) return false;      // пустые значения и занятые поля — мимо
    el.value = v;
    ["input", "change", "blur"].forEach(function (t) {
      el.dispatchEvent(new Event(t, { bubbles: true }));
    });
    return true;
  }

  function autofillCart() {
    if (!profile) return;
    var forms = document.querySelectorAll(
      ".t706__form, .t-form, form[name*='cart' i], form[class*='t706']"
    );
    var filled = 0;
    Array.prototype.forEach.call(forms, function (f) {
      if (!f.offsetParent) return;          // форма скрыта — корзина закрыта
      var inputs = f.querySelectorAll("input:not([type=hidden]), textarea");
      Array.prototype.forEach.call(inputs, function (el) {
        if (el.type === "checkbox" || el.type === "radio" || el.type === "submit") return;
        var key = guessKey(el);
        if (!key) return;
        var v =
          key === "_address" ? addressLine() :
          key === "_telegram" ? (profile.username ? "@" + profile.username : "") :
          profile[key];
        if (setVal(el, v)) filled++;
      });
    });
    if (filled) console.log("[loyalty] автозаполнено полей корзины: " + filled);
    return filled;
  }
  /* ВЫБОР ПВЗ OZON — грузим модуль по требованию, когда корзина открылась.
     Не зависит от входа в ЛК: доставку выбирает любой покупатель. */
  function mountPvz() {
    var form = null;
    var forms = document.querySelectorAll(".t706__form, form[class*='t706']");
    Array.prototype.forEach.call(forms, function (f) { if (!form && f.offsetParent) form = f; });
    if (!form || form.querySelector(".kwp")) return;

    if (window.KWL_PVZ) { window.KWL_PVZ.mount(form); return; }
    if (window.__kwPvzLoading) return;
    window.__kwPvzLoading = true;
    var s = document.createElement("script");
    s.src = "https://dmchinarev-maker.github.io/kniveswear-hook/ozon-pvz.js";
    s.onload = function () { if (window.KWL_PVZ) window.KWL_PVZ.mount(form); };
    document.head.appendChild(s);
  }

  // Корзина открывается динамически — наблюдаем за DOM и добиваем по таймеру.
  function watchCart() {
    try {
      new MutationObserver(function () {
        if (profile) autofillCart();
        mountPvz();
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* старый браузер — хватит интервала */ }
    setInterval(function () { if (profile) autofillCart(); mountPvz(); }, 2000);
  }
  window.kwlAutofill = autofillCart;   // ручной вызов для проверки из консоли

  /* ---------- UI ---------- */
  function styles() {
    if (document.getElementById("kw-loyalty-css")) return;
    var s = document.createElement("style");
    s.id = "kw-loyalty-css";
    s.textContent = [
      ".kwl-btn{position:fixed;right:18px;bottom:18px;z-index:99998;background:#111;color:#fff;",
      "border:none;border-radius:24px;padding:11px 18px;font:600 14px/1 TildaSans,system-ui,sans-serif;",
      "cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.18);transition:transform .18s ease}",
      ".kwl-btn:hover{transform:translateY(-2px)}",
      ".kwl-panel{position:fixed;right:18px;bottom:70px;z-index:99999;width:300px;background:#fff;",
      "color:#111;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.22);padding:20px;",
      "font:400 14px/1.5 TildaSans,system-ui,sans-serif;display:none}",
      ".kwl-panel.open{display:block}",
      ".kwl-bal{font:700 30px/1 TildaSans,system-ui,sans-serif;margin:6px 0 2px}",
      ".kwl-sub{color:#888;font-size:12px;margin-bottom:14px}",
      ".kwl-row{display:flex;justify-content:space-between;font-size:12px;color:#555;padding:4px 0;border-top:1px solid #f0f0f0}",
      ".kwl-in{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:9px 11px;margin:8px 0;font:inherit}",
      ".kwl-act{width:100%;background:#111;color:#fff;border:none;border-radius:10px;padding:10px;cursor:pointer;font:600 14px TildaSans,system-ui,sans-serif}",
      ".kwl-code{font:700 16px/1 monospace;letter-spacing:1px;background:#f5f5f5;border-radius:8px;padding:10px;text-align:center;margin-top:8px}",
      ".kwl-x{position:absolute;top:12px;right:14px;color:#bbb;cursor:pointer;font-size:18px;line-height:1}",
      ".kwl-lnk{color:#888;font-size:12px;cursor:pointer;text-decoration:underline;margin-top:10px;display:inline-block}",
    ].join("");
    document.head.appendChild(s);
  }

  var btn, panel;
  function mount() {
    styles();
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "kwl-btn";
      btn.onclick = function () { panel.classList.toggle("open"); render(); };
      document.body.appendChild(btn);
    }
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "kwl-panel";
      document.body.appendChild(panel);
    }
    render();
  }

  function render() {
    if (!btn || !panel) return;
    btn.textContent = me ? "★ " + me.balance + " баллов" : "Личный кабинет";
    if (!panel.classList.contains("open")) return;

    if (!me) {
      panel.innerHTML =
        '<span class="kwl-x">×</span>' +
        '<div style="font-weight:600;margin-bottom:4px">Личный кабинет</div>' +
        '<div class="kwl-sub">Войдите через Telegram — при регистрации дарим приветственные баллы.</div>' +
        (window.__kwlError ? '<div class="kwl-sub" style="color:#c00">Вход не удался: ' + window.__kwlError + "</div>" : "") +
        '<div id="kwl-tg"></div>';
      panel.querySelector(".kwl-x").onclick = function () { panel.classList.remove("open"); };
      mountTelegramWidget(panel.querySelector("#kwl-tg"));
      return;
    }

    var hist = (me.txns || []).slice(0, 5).map(function (t) {
      var sign = t.delta > 0 ? "+" : "";
      var label = { welcome: "Приветственные", order: "За заказ", redeem: "Списание", manual: "Начисление" }[t.reason] || t.reason;
      return '<div class="kwl-row"><span>' + label + "</span><span>" + sign + t.delta + "</span></div>";
    }).join("");

    panel.innerHTML =
      '<span class="kwl-x">×</span>' +
      '<div style="font-weight:600">' + (me.name ? "Привет, " + me.name : "Личный кабинет") + "</div>" +
      '<div class="kwl-bal">' + me.balance + " ★</div>" +
      '<div class="kwl-sub">1 балл = ' + me.rate + " ₽ · оплата до " + (me.maxRedeemPct || 50) + "% заказа</div>" +
      hist +
      '<button class="kwl-act" id="kwl-open">Открыть кабинет</button>' +
      '<span class="kwl-lnk" id="kwl-out">Выйти</span>';
    panel.querySelector(".kwl-x").onclick = function () { panel.classList.remove("open"); };
    panel.querySelector("#kwl-out").onclick = function () { clearToken(); me = null; render(); };
    panel.querySelector("#kwl-open").onclick = openAccount;
  }

  /* ---------- полноэкранный ЛК (account.js подгружается по требованию) ---------- */
  function openAccount() {
    panel.classList.remove("open");
    withAccount(function (A) { A.open(); });
  }

  function withAccount(cb) {
    if (window.KWL_ACCOUNT) return cb(window.KWL_ACCOUNT);
    var s = document.createElement("script");
    s.src = "https://dmchinarev-maker.github.io/kniveswear-hook/account.js";
    s.onload = function () {
      if (!window.KWL_ACCOUNT) return;
      // мост: кабинет ходит в API через тот же токен, и обновляет баланс на кнопке
      window.KWL_ACCOUNT.api = api;
      window.KWL_ACCOUNT.onClose = refresh;
      cb(window.KWL_ACCOUNT);
    };
    document.head.appendChild(s);
  }

  // Глобальный колбэк для виджета Telegram (data-onauth).
  // Callback-флоу вместо data-auth-url: НЕТ редиректа, поэтому домен бэкенда
  // не обязан совпадать с доменом из /setdomain — нужен только домен страницы.
  window.kwlTgAuth = function (tgUser) {
    var box = document.getElementById("kwl-tg");
    if (box) box.innerHTML = '<div class="kwl-sub">Входим…</div>';
    fetch(BACKEND + "/api/tg/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tgUser),
    })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && r.token) { setToken(r.token); refresh(); }
        else if (box) box.innerHTML = '<div class="kwl-sub" style="color:#c00">Ошибка входа: ' + ((r && r.error) || "неизвестно") + "</div>";
      })
      .catch(function (e) {
        if (box) box.innerHTML = '<div class="kwl-sub" style="color:#c00">Сеть недоступна</div>';
        console.error("[loyalty]", e);
      });
  };

  // Вход через Telegram Web Login (OpenID Connect).
  // Legacy iframe-виджет Телеграм ЗААРХИВИРОВАЛ: oauth.telegram.org/embed отдаёт
  // «Bot domain invalid» даже с верным /setdomain, а /auth?bot_id= — «deprecated».
  // Теперь обычная навигация на бэкенд → страница согласия Телеграма → возврат
  // на сайт с токеном во фрагменте (его подхватывает grabTokenFromHash).
  // ВХОД ЧЕРЕЗ БОТА (без доменов и OIDC).
  // Telegram заархивировал iframe-виджет («Bot domain invalid» при любом /setdomain),
  // а новый Web Login (OIDC) отвечает «redirect_uri required» — раскатан не у всех.
  // Поэтому: сайт берёт одноразовый код → открывает t.me/<bot>?start=<code> →
  // юзер жмёт Start → бот привязывает аккаунт → сайт опрашивает и получает сессию.
  var pollTimer = null;
  function mountTelegramWidget(host) {
    if (!host) return;
    var b = document.createElement("button");
    b.className = "kwl-act";
    b.textContent = "Войти через Telegram";
    b.onclick = function () { startBotLogin(host, b); };
    host.appendChild(b);
  }

  function startBotLogin(host, btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = "Открываем Telegram…";
    fetch(BACKEND + "/api/auth/start", { method: "POST" })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.url) throw new Error((r && r.error) || "no url");
        window.open(r.url, "_blank", "noopener");
        host.innerHTML =
          '<div class="kwl-sub">Подтвердите вход в Telegram — нажмите <b>Start</b> в чате с ботом. ' +
          'Окно не закрывайте, кабинет откроется сам.</div>' +
          '<a class="kwl-lnk" href="' + r.url + '" target="_blank" rel="noopener">Открыть Telegram ещё раз</a>';
        pollFor(r.code, host);
      })
      .catch(function (e) {
        btnEl.disabled = false;
        btnEl.textContent = "Войти через Telegram";
        host.insertAdjacentHTML("beforeend", '<div class="kwl-sub" style="color:#c00">Не вышло начать вход: ' + e.message + "</div>");
      });
  }

  function pollFor(code, host) {
    var tries = 0;
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      tries++;
      if (tries > 100) { // ~5 минут
        clearInterval(pollTimer); pollTimer = null;
        host.insertAdjacentHTML("beforeend", '<div class="kwl-sub">Время ожидания вышло. Откройте кабинет заново.</div>');
        return;
      }
      fetch(BACKEND + "/api/auth/poll?code=" + encodeURIComponent(code))
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r) return;
          if (r.status === "ok" && r.token) {
            clearInterval(pollTimer); pollTimer = null;
            setToken(r.token);
            refresh();
          } else if (r.status === "expired" || r.status === "unknown") {
            clearInterval(pollTimer); pollTimer = null;
            host.insertAdjacentHTML("beforeend", '<div class="kwl-sub" style="color:#c00">Ссылка устарела, начните заново.</div>');
          }
        })
        .catch(function () { /* сеть моргнула — продолжаем опрос */ });
    }, 3000);
  }

  function refresh() {
    if (!token()) { me = null; profile = null; render(); return; }
    // /api/account отдаёт всё сразу: профиль (для автозаполнения корзины) + баллы
    api("/api/account").then(function (r) {
      if (!r || r.error) { me = null; profile = null; render(); return; }
      profile = r.profile || null;
      me = {
        uid: r.profile && r.profile.uid,
        name: r.profile && r.profile.name,
        balance: r.points ? r.points.balance : 0,
        rate: r.points ? r.points.rate : 1,
        maxRedeemPct: r.points ? r.points.maxRedeemPct : 50,
        txns: r.points ? r.points.txns : [],
      };
      render();
      injectCartField();
      autofillCart();
    });
  }

  /* ---------- старт ---------- */
  function boot() {
    if (!ENABLED) { return; } // включить после деплоя бэкенда (ENABLED=true)
    grabTokenFromHash();
    mount();
    refresh();
    // корзина Тильды рисуется динамически — подкладываем поле периодически
    setInterval(injectCartField, 2500);
    watchCart();   // подставляем данные доставки, когда откроется корзина
    console.log("[kniveswear-loyalty] v" + LOYALTY_VERSION + " активен");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

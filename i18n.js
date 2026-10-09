(function(root) {
  "use strict";
  // 画面の日英切り替え。data-i18n（textContent）、data-i18n-html（innerHTML）、
  // data-i18n-attr（"属性:キー,属性:キー"）を見て差し替える。言語は localStorage に残す。
  const MESSAGES = root.InventoryMessages || { ja: {}, en: {} };
  let lang = "ja";
  const listeners = [];

  function dict() { return MESSAGES[lang] || MESSAGES.ja; }

  function t(key) {
    const d = dict();
    if (d && Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    const ja = MESSAGES.ja || {};
    return Object.prototype.hasOwnProperty.call(ja, key) ? ja[key] : key;
  }

  function apply() {
    const d = dict();
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      const k = el.getAttribute("data-i18n");
      if (d[k] != null) el.textContent = d[k];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function(el) {
      const k = el.getAttribute("data-i18n-html");
      if (d[k] != null) el.innerHTML = d[k];
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function(el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function(pair) {
        const p = pair.split(":");
        if (p.length === 2 && d[p[1].trim()] != null) el.setAttribute(p[0].trim(), d[p[1].trim()]);
      });
    });
    document.documentElement.setAttribute("lang", lang);
    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = t("ui.langToggle");
  }

  function set(next) {
    if (next !== "ja" && next !== "en") return;
    lang = next;
    try { localStorage.setItem("lang", lang); } catch (e) { /* 使えない環境でも続行 */ }
    apply();
    for (let i = 0; i < listeners.length; i++) {
      try { listeners[i](lang); } catch (e) { /* 1つで止めない */ }
    }
  }

  function init() {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "ja" || saved === "en") lang = saved;
    } catch (e) { /* 既定のまま */ }
    apply();
    const btn = document.getElementById("langToggle");
    if (btn) btn.addEventListener("click", function() { set(lang === "ja" ? "en" : "ja"); });
  }

  root.I18N = {
    t: t,
    apply: apply,
    set: set,
    get lang() { return lang; },
    onChange: function(fn) { if (typeof fn === "function") listeners.push(fn); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof globalThis === "object" ? globalThis : this);

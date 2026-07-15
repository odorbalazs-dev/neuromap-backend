(function () {
  "use strict";

  const LEGAL_UI_VERSION = "20260715-gdpr-legal-v1";
  const RECEIPT_KEY = "nm_legal_receipt_v1";
  const ANALYTICS_KEY = "nm_analytics_consent_v1";
  const CONTENT_VERSION = "20260715-gdpr-legal-v1";
  const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

  let activeFlow = null;
  let legalConfig = null;
  let currentReceipt = null;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  function apiBase() {
    const configured = window.NM_CONFIG && window.NM_CONFIG.API_BASE_URL;
    if (configured) return String(configured).replace(/\/+$/, "");
    if (/railway\.app$/i.test(window.location.hostname || "")) return window.location.origin;
    return "https://neuromap-backend-production-969d.up.railway.app";
  }

  function normalizeLang(value) {
    const lang = String(value || "en").toLowerCase();
    return SUPPORTED_LANGS.includes(lang) ? lang : "en";
  }

  function readStoredLanguage() {
    try {
      return normalizeLang(window.localStorage && window.localStorage.getItem("nm_lang"));
    } catch (_error) {
      return "en";
    }
  }

  function getContent(lang) {
    const all = window.NM_LEGAL_CONTENT || {};
    return all[normalizeLang(lang)] || all.en || null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadScript(src, marker) {
    if (marker && window[marker]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === src);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        if (marker && window[marker]) resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("The legal information could not be loaded."));
      document.head.appendChild(script);
    });
  }

  async function ensureContent() {
    if (window.NM_LEGAL_CONTENT) return;
    await loadScript(
      `${apiBase()}/public/webflow/legal-content.js?v=${encodeURIComponent(CONTENT_VERSION)}`,
      "NM_LEGAL_CONTENT"
    );
    if (!window.NM_LEGAL_CONTENT) throw new Error("The legal information is unavailable.");
  }

  async function fetchJson(path, options) {
    const response = await fetch(`${apiBase()}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.error || "The legal service is temporarily unavailable.");
      error.code = data.code || "LEGAL_REQUEST_FAILED";
      error.details = data.details || [];
      throw error;
    }
    return data;
  }

  async function getConfig() {
    if (legalConfig) return legalConfig;
    const data = await fetchJson("/legal/config");
    legalConfig = data;
    return legalConfig;
  }

  function readStoredReceipt() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || "null");
      if (!parsed || !parsed.id || !parsed.token) return null;
      return parsed;
    } catch (_error) {
      return null;
    }
  }

  function storeReceipt(receipt) {
    currentReceipt = receipt || null;
    try {
      if (receipt) sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
      else sessionStorage.removeItem(RECEIPT_KEY);
    } catch (_error) {
      // Session storage can be unavailable in restricted browsing modes.
    }
  }

  function readAnalyticsPreference() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || "null");
      if (!parsed || parsed.version !== LEGAL_UI_VERSION) return false;
      return parsed.granted === true;
    } catch (_error) {
      return false;
    }
  }

  function applyAnalyticsPreference(granted, lang) {
    const allowed = granted === true;
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify({
        version: LEGAL_UI_VERSION,
        granted: allowed,
        lang: normalizeLang(lang),
        updatedAt: new Date().toISOString()
      }));
    } catch (_error) {
      // Consent remains valid even if optional preference storage is blocked.
    }
    window.gtag("consent", "update", {
      ad_storage: "denied",
      analytics_storage: allowed ? "granted" : "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  function removeModal() {
    const overlay = document.getElementById("nmLegalOverlay");
    if (overlay) overlay.remove();
    document.documentElement.classList.remove("nm-legal-open");
    document.body.classList.remove("nm-legal-open");
  }

  function installStyles() {
    if (document.getElementById("nm-legal-consent-styles")) return;
    const style = document.createElement("style");
    style.id = "nm-legal-consent-styles";
    style.textContent = `
      html.nm-legal-open, body.nm-legal-open { overflow: hidden !important; }
      #nmLegalOverlay { position: fixed; inset: 0; z-index: 2147483646; display: grid; place-items: center; padding: 16px; background: rgba(15, 29, 45, .76); font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #102033; }
      .nm-legal-dialog { width: min(920px, 100%); max-height: calc(100vh - 32px); display: grid; grid-template-rows: auto minmax(180px, 1fr) auto; overflow: hidden; background: #fff; border: 1px solid #cfe3ef; border-radius: 8px; box-shadow: 0 24px 70px rgba(5, 25, 45, .28); }
      .nm-legal-head { padding: 20px 22px 16px; border-bottom: 1px solid #dbe8f0; background: #f3f9fc; }
      .nm-legal-headline { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .nm-legal-head h2 { margin: 0; font-size: 24px; line-height: 1.25; letter-spacing: 0; }
      .nm-legal-step { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; background: #dff3fb; color: #0877a7; font-size: 12px; font-weight: 800; }
      .nm-legal-meta { margin-top: 10px; font-size: 12px; line-height: 1.55; color: #52677d; overflow-wrap: anywhere; }
      .nm-legal-scroll { overflow: auto; padding: 20px 22px 28px; scroll-behavior: smooth; }
      .nm-legal-section { margin: 0 0 18px; padding-bottom: 16px; border-bottom: 1px solid #e5edf3; }
      .nm-legal-section:last-child { border-bottom: 0; }
      .nm-legal-section h3 { margin: 0 0 7px; font-size: 17px; line-height: 1.35; letter-spacing: 0; }
      .nm-legal-section p { margin: 0; color: #334a60; font-size: 14px; line-height: 1.7; }
      .nm-legal-foot { padding: 16px 22px 20px; border-top: 1px solid #dbe8f0; background: #fff; }
      .nm-legal-read { margin: 0 0 12px; color: #9b4d00; font-size: 13px; font-weight: 750; }
      .nm-legal-actor { margin: 0 0 12px; padding: 12px; background: #f5f9fc; border: 1px solid #dbe8f0; border-radius: 6px; }
      .nm-legal-actor strong { display: block; margin-bottom: 8px; font-size: 14px; }
      .nm-legal-options { display: flex; flex-wrap: wrap; gap: 9px 16px; }
      .nm-legal-check { display: flex; align-items: flex-start; gap: 9px; margin: 9px 0; color: #263d52; font-size: 13px; line-height: 1.45; cursor: pointer; }
      .nm-legal-check input { width: 18px; height: 18px; flex: 0 0 18px; margin: 1px 0 0; accent-color: #0799d2; }
      .nm-legal-optional { margin-top: 12px; padding: 12px; border: 1px solid #b8dcef; border-radius: 6px; background: #f2fbff; }
      .nm-legal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
      .nm-legal-button { min-height: 44px; padding: 10px 17px; border: 1px solid #b9cddd; border-radius: 6px; background: #edf5fa; color: #102033; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
      .nm-legal-button.primary { border-color: #0799d2; background: #0799d2; color: #fff; }
      .nm-legal-button:disabled { opacity: .42; cursor: not-allowed; }
      .nm-legal-error { min-height: 20px; margin-top: 8px; color: #b42318; font-size: 13px; font-weight: 700; }
      #nmLegalLauncher { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; border: 1px solid #c4deeb; border-radius: 6px; padding: 9px 12px; background: rgba(255,255,255,.96); color: #18364f; box-shadow: 0 6px 22px rgba(16,32,51,.12); font: 700 12px/1.2 Inter, system-ui, sans-serif; cursor: pointer; }
      #nmLegalMenu { position: fixed; right: 16px; bottom: 58px; z-index: 2147483001; min-width: 220px; padding: 8px; border: 1px solid #c4deeb; border-radius: 6px; background: #fff; box-shadow: 0 12px 35px rgba(16,32,51,.18); }
      #nmLegalMenu button { display: block; width: 100%; padding: 10px; border: 0; border-radius: 4px; background: transparent; color: #18364f; text-align: left; font: 700 13px/1.3 Inter, system-ui, sans-serif; cursor: pointer; }
      #nmLegalMenu button:hover { background: #eef8fc; }
      [dir="rtl"] #nmLegalLauncher, [dir="rtl"] #nmLegalMenu { right: auto; left: 16px; }
      [dir="rtl"] #nmLegalMenu button { text-align: right; }
      @media (max-width: 640px) { #nmLegalOverlay { padding: 0; } .nm-legal-dialog { max-height: 100vh; height: 100vh; border-radius: 0; } .nm-legal-head, .nm-legal-scroll, .nm-legal-foot { padding-left: 16px; padding-right: 16px; } .nm-legal-head h2 { font-size: 20px; } .nm-legal-actions { flex-direction: column-reverse; } .nm-legal-button { width: 100%; } }
    `;
    document.head.appendChild(style);
  }

  function legalMeta(config, lang) {
    const controller = config.controller || {};
    const authority = config.supervisoryAuthority || {};
    const locale = normalizeLang(lang);
    const parts = [
      controller.name,
      controller.address,
      controller.country,
      controller.privacyEmail,
      authority.name,
      config.policyEffectiveDate,
      config.retentionDays ? String(config.retentionDays) : "",
      locale.toUpperCase()
    ].filter(Boolean);
    return parts.map(escapeHtml).join(" &middot; ");
  }

  function sectionMarkup(sections) {
    return (sections || []).map((section) => `
      <section class="nm-legal-section">
        <h3>${escapeHtml(section[0])}</h3>
        <p>${escapeHtml(section[1])}</p>
      </section>
    `).join("");
  }

  function waitForRead(scrollBox, callback) {
    let done = false;
    const check = () => {
      if (done) return;
      const remaining = scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight;
      if (remaining <= 8) {
        done = true;
        callback();
      }
    };
    scrollBox.addEventListener("scroll", check, { passive: true });
    requestAnimationFrame(check);
  }

  function allRequiredChecked(root) {
    const checks = Array.from(root.querySelectorAll("input[data-required='true']"));
    return checks.length > 0 && checks.every((input) => input.checked);
  }

  function runTermsStep(lang, content, config) {
    return new Promise((resolve) => {
      installStyles();
      removeModal();
      const ui = content.ui || {};
      const overlay = document.createElement("div");
      overlay.id = "nmLegalOverlay";
      overlay.setAttribute("role", "presentation");
      overlay.innerHTML = `
        <div class="nm-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="nmLegalTitle">
          <header class="nm-legal-head">
            <div class="nm-legal-headline"><h2 id="nmLegalTitle">${escapeHtml(ui.termsTitle)}</h2><span class="nm-legal-step">1 / 2</span></div>
            <div class="nm-legal-meta">${legalMeta(config, lang)} &middot; ${escapeHtml(config.termsVersion || "")}</div>
          </header>
          <div class="nm-legal-scroll" tabindex="0">${sectionMarkup(content.terms)}</div>
          <footer class="nm-legal-foot">
            <p class="nm-legal-read">${escapeHtml(ui.readAll || "Scroll to the end to continue.")}</p>
            <div class="nm-legal-actor">
              <strong>${escapeHtml(content.actorLabel)}</strong>
              <div class="nm-legal-options">
                <label class="nm-legal-check"><input type="radio" name="nmActorRole" value="parent_or_legal_guardian"> <span>${escapeHtml(content.actorParent)}</span></label>
                <label class="nm-legal-check"><input type="radio" name="nmActorRole" value="adult_authorized_purchaser"> <span>${escapeHtml(content.actorAdult)}</span></label>
              </div>
            </div>
            <div class="nm-legal-required">${(content.termsChecks || []).map((label, index) => `<label class="nm-legal-check"><input type="checkbox" data-required="true" data-term="${index}" disabled> <span>${escapeHtml(label)}</span></label>`).join("")}</div>
            <div class="nm-legal-actions"><button class="nm-legal-button primary" type="button" disabled>${escapeHtml(ui.continue || "Continue")}</button></div>
          </footer>
        </div>`;
      document.body.appendChild(overlay);
      document.documentElement.classList.add("nm-legal-open");
      document.body.classList.add("nm-legal-open");

      const scrollBox = overlay.querySelector(".nm-legal-scroll");
      const readMessage = overlay.querySelector(".nm-legal-read");
      const button = overlay.querySelector(".nm-legal-button.primary");
      const checks = Array.from(overlay.querySelectorAll("input[type='checkbox']"));
      let read = false;

      const update = () => {
        const actor = overlay.querySelector("input[name='nmActorRole']:checked");
        button.disabled = !(read && actor && allRequiredChecked(overlay));
      };
      waitForRead(scrollBox, () => {
        read = true;
        checks.forEach((input) => { input.disabled = false; });
        readMessage.style.color = "#0a7c45";
        readMessage.textContent = ui.required || "Required";
        update();
      });
      overlay.addEventListener("change", update);
      button.addEventListener("click", () => {
        const actor = overlay.querySelector("input[name='nmActorRole']:checked");
        if (!actor || button.disabled) return;
        removeModal();
        resolve({ actorRole: actor.value, termsScrollCompleted: true });
      });
      scrollBox.focus();
    });
  }

  function runPrivacyStep(lang, content, config, termsResult) {
    return new Promise((resolve) => {
      installStyles();
      removeModal();
      const ui = content.ui || {};
      const overlay = document.createElement("div");
      overlay.id = "nmLegalOverlay";
      overlay.innerHTML = `
        <div class="nm-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="nmLegalTitle">
          <header class="nm-legal-head">
            <div class="nm-legal-headline"><h2 id="nmLegalTitle">${escapeHtml(ui.privacyTitle)}</h2><span class="nm-legal-step">2 / 2</span></div>
            <div class="nm-legal-meta">${legalMeta(config, lang)} &middot; ${escapeHtml(config.privacyPolicyVersion || "")}</div>
          </header>
          <div class="nm-legal-scroll" tabindex="0">${sectionMarkup(content.privacy)}</div>
          <footer class="nm-legal-foot">
            <p class="nm-legal-read">${escapeHtml(ui.readAll || "Scroll to the end to continue.")}</p>
            <div class="nm-legal-required">${(content.privacyChecks || []).map((label, index) => `<label class="nm-legal-check"><input type="checkbox" data-required="true" data-privacy="${index}" disabled> <span>${escapeHtml(label)}</span></label>`).join("")}</div>
            <div class="nm-legal-optional"><label class="nm-legal-check"><input id="nmAnalyticsConsent" type="checkbox" disabled> <span><strong>${escapeHtml(ui.optional || "Optional")}:</strong> ${escapeHtml(content.analytics)}</span></label></div>
            <div class="nm-legal-error" role="alert"></div>
            <div class="nm-legal-actions"><button class="nm-legal-button" type="button" data-action="back">${escapeHtml(ui.back || "Back")}</button><button class="nm-legal-button primary" type="button" disabled>${escapeHtml(ui.accept || "I explicitly consent and continue")}</button></div>
          </footer>
        </div>`;
      document.body.appendChild(overlay);
      document.documentElement.classList.add("nm-legal-open");
      document.body.classList.add("nm-legal-open");

      const scrollBox = overlay.querySelector(".nm-legal-scroll");
      const readMessage = overlay.querySelector(".nm-legal-read");
      const button = overlay.querySelector(".nm-legal-button.primary");
      const backButton = overlay.querySelector("[data-action='back']");
      const inputs = Array.from(overlay.querySelectorAll("input"));
      const errorBox = overlay.querySelector(".nm-legal-error");
      let read = false;

      const update = () => { button.disabled = !(read && allRequiredChecked(overlay)); };
      waitForRead(scrollBox, () => {
        read = true;
        inputs.forEach((input) => { input.disabled = false; });
        readMessage.style.color = "#0a7c45";
        readMessage.textContent = ui.required || "Required";
        update();
      });
      overlay.addEventListener("change", update);
      backButton.addEventListener("click", async () => {
        removeModal();
        const nextTerms = await runTermsStep(lang, content, config);
        resolve({ restart: true, terms: nextTerms });
      });
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        button.disabled = true;
        backButton.disabled = true;
        errorBox.textContent = "";
        try {
          const payload = {
            language: lang,
            actorRole: termsResult.actorRole,
            adultConfirmation: true,
            guardianAuthority: true,
            termsAcknowledged: true,
            informationalPurposeAcknowledged: true,
            digitalPerformanceRequested: true,
            withdrawalRightAcknowledged: true,
            privacyNoticeAcknowledged: true,
            specialCategoryExplicitConsent: true,
            aiTransparencyAcknowledged: true,
            termsScrollCompleted: true,
            privacyScrollCompleted: true,
            analyticsConsent: overlay.querySelector("#nmAnalyticsConsent").checked === true,
            advertisingConsent: false,
            legalUiVersion: LEGAL_UI_VERSION
          };
          const result = await fetchJson("/legal/consent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          removeModal();
          resolve({ receipt: result.receipt, analyticsConsent: payload.analyticsConsent });
        } catch (error) {
          errorBox.textContent = error.message || "The consent could not be saved. Please try again.";
          button.disabled = false;
          backButton.disabled = false;
        }
      });
      scrollBox.focus();
    });
  }

  async function inspectStoredReceipt(lang) {
    const receipt = readStoredReceipt();
    if (!receipt) return null;
    try {
      const result = await fetchJson(`/legal/consent/${encodeURIComponent(receipt.id)}`, {
        headers: { "x-consent-token": receipt.token }
      });
      if (normalizeLang(result.consent && result.consent.language) !== normalizeLang(lang)) {
        storeReceipt(null);
        return null;
      }
      currentReceipt = receipt;
      applyAnalyticsPreference(result.consent.analyticsConsent === true, lang);
      return receipt;
    } catch (_error) {
      storeReceipt(null);
      return null;
    }
  }

  async function ensureConsent(lang) {
    const language = normalizeLang(lang);
    if (activeFlow) return activeFlow;
    activeFlow = (async () => {
      await ensureContent();
      const config = await getConfig();
      installLauncher(language);
      const existing = await inspectStoredReceipt(language);
      if (existing) return existing;
      const content = getContent(language);
      if (!content) throw new Error("The legal information is unavailable in this language.");

      let termsResult = await runTermsStep(language, content, config);
      while (true) {
        const privacyResult = await runPrivacyStep(language, content, config, termsResult);
        if (privacyResult.restart) {
          termsResult = privacyResult.terms;
          continue;
        }
        storeReceipt(privacyResult.receipt);
        applyAnalyticsPreference(privacyResult.analyticsConsent, language);
        return privacyResult.receipt;
      }
    })();
    try {
      return await activeFlow;
    } finally {
      activeFlow = null;
    }
  }

  function showDocument(kind, lang) {
    return Promise.all([ensureContent(), getConfig()]).then(([, config]) => {
      installStyles();
      removeModal();
      const content = getContent(lang);
      const ui = content.ui || {};
      const isPrivacy = kind === "privacy";
      const overlay = document.createElement("div");
      overlay.id = "nmLegalOverlay";
      overlay.innerHTML = `
        <div class="nm-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="nmLegalTitle">
          <header class="nm-legal-head"><div class="nm-legal-headline"><h2 id="nmLegalTitle">${escapeHtml(isPrivacy ? ui.privacyTitle : ui.termsTitle)}</h2></div><div class="nm-legal-meta">${legalMeta(config, lang)}</div></header>
          <div class="nm-legal-scroll" tabindex="0">${sectionMarkup(isPrivacy ? content.privacy : content.terms)}</div>
          <footer class="nm-legal-foot"><div class="nm-legal-actions"><button class="nm-legal-button primary" type="button">${escapeHtml(ui.close || "Close")}</button></div></footer>
        </div>`;
      document.body.appendChild(overlay);
      document.documentElement.classList.add("nm-legal-open");
      document.body.classList.add("nm-legal-open");
      overlay.querySelector("button").addEventListener("click", removeModal);
      overlay.querySelector(".nm-legal-scroll").focus();
    });
  }

  async function withdraw(lang) {
    const receipt = currentReceipt || readStoredReceipt();
    if (!receipt) return false;
    const content = getContent(lang) || getContent("en");
    const question = content && content.ui && content.ui.withdraw
      ? `${content.ui.withdraw}?`
      : "Withdraw consent?";
    if (!window.confirm(question)) return false;
    await fetchJson(`/legal/consent/${encodeURIComponent(receipt.id)}/withdraw`, {
      method: "POST",
      headers: { "x-consent-token": receipt.token }
    });
    storeReceipt(null);
    applyAnalyticsPreference(false, lang);
    return true;
  }

  function installLauncher(lang) {
    installStyles();
    let button = document.getElementById("nmLegalLauncher");
    if (!button) {
      button = document.createElement("button");
      button.id = "nmLegalLauncher";
      button.type = "button";
      document.body.appendChild(button);
    }
    const content = getContent(lang) || getContent("en");
    button.textContent = (content && content.ui && content.ui.legalLinks) || "Legal information";
    button.onclick = () => {
      const existing = document.getElementById("nmLegalMenu");
      if (existing) {
        existing.remove();
        return;
      }
      const menu = document.createElement("div");
      menu.id = "nmLegalMenu";
      menu.innerHTML = `
        <button type="button" data-kind="terms">${escapeHtml(content.ui.termsLink || content.ui.termsTitle)}</button>
        <button type="button" data-kind="privacy">${escapeHtml(content.ui.privacyLink || content.ui.privacyTitle)}</button>
        <button type="button" data-kind="withdraw">${escapeHtml(content.ui.withdraw || "Withdraw consent")}</button>`;
      document.body.appendChild(menu);
      menu.addEventListener("click", async (event) => {
        const target = event.target.closest("button[data-kind]");
        if (!target) return;
        menu.remove();
        if (target.dataset.kind === "withdraw") {
          try { await withdraw(lang); } catch (error) { window.alert(error.message); }
        } else {
          showDocument(target.dataset.kind, lang);
        }
      });
    };
  }

  function getReceipt() {
    const receipt = currentReceipt || readStoredReceipt();
    if (!receipt) return null;
    return { id: receipt.id, token: receipt.token };
  }

  function isAnalyticsAllowed() {
    return readAnalyticsPreference();
  }

  window.NM_LEGAL = Object.freeze({
    version: LEGAL_UI_VERSION,
    ensureConsent,
    getReceipt,
    isAnalyticsAllowed,
    openTerms: (lang) => showDocument("terms", normalizeLang(lang)),
    openPrivacy: (lang) => showDocument("privacy", normalizeLang(lang)),
    withdraw: (lang) => withdraw(normalizeLang(lang)),
    installLauncher: (lang) => installLauncher(normalizeLang(lang))
  });

  applyAnalyticsPreference(readAnalyticsPreference(), readStoredLanguage());
})();

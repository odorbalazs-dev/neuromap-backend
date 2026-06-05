/* =========================
   ENGINE - PRODUCTION FINAL
   Uses window.NM_ADAPTIVE_ENGINE when available.
========================= */

(function () {
  const DISORDERS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
  const ENGINE_VERSION = "20260605-landing-hu-cta-v1";
  const ANALYTICS_SCHEMA_VERSION = "analytics-event-schema-v2";
  const DRAFT_STORAGE_KEY = "nm_questionnaire_draft_v1";
  const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 14;

  const state = {
    lang: "hu",
    step: "triage",

    triageQuestions: [],
    triageAnswers: [],
    triageScores: null,
    triageRanking: null,

    detectedRisk: null,
    secondaryRisk: null,

    specificQuestions: [],
    specificAnswers: [],
    specificScoring: null,
    specificProfile: null,
    resultSummary: null,

    extraQuestions: [],
    extraAnswers: [],
    extraDebug: null,

    needsExtra: false,
    draftRestored: false
  };

  function randomIdPart() {
    return Math.random().toString(36).slice(2, 10);
  }

  function getClientSessionId() {
    const key = "nm_client_session_id";

    try {
      const existing = window.sessionStorage && window.sessionStorage.getItem(key);
      if (existing) return existing;

      const generated = `nmcs_${Date.now()}_${randomIdPart()}`;
      if (window.sessionStorage) window.sessionStorage.setItem(key, generated);
      return generated;
    } catch (_error) {
      return `nmcs_${Date.now()}_${randomIdPart()}`;
    }
  }

  function getAnalyticsPageKind() {
    const path = String(window.location.pathname || "").toLowerCase();
    if (path.includes("checkout-success")) return "checkout_success";
    if (path.includes("checkout-cancel")) return "checkout_cancel";
    return "landing";
  }

  function getAnalyticsBasePayload(extra = {}) {
    const childAge = typeof getChildAgeValue === "function" ? getChildAgeValue() : null;

    return Object.assign({
      event_schema_version: ANALYTICS_SCHEMA_VERSION,
      app_name: "neuromap_kids",
      app_surface: "webflow",
      source: "webflow_engine",
      page_kind: getAnalyticsPageKind(),
      page_path: window.location.pathname || "",
      page_url: window.location.href || "",
      lang: state.lang || getLang(),
      client_session_id: getClientSessionId(),
      questionnaire_version: "v5-browser-adaptive-picker",
      engine_version: ENGINE_VERSION,
      child_age: childAge == null ? "" : childAge,
      detected_risk: state.detectedRisk || "",
      secondary_risk: state.secondaryRisk || "",
      needs_extra: Boolean(state.needsExtra),
      funnel_step: state.step || "landing",
      generated_at: new Date().toISOString()
    }, extra || {});
  }

  function hasSchemaV2Event(eventName, dedupeKey) {
    const dataLayer = Array.isArray(window.dataLayer) ? window.dataLayer : [];

    return dataLayer.some((entry) => {
      if (!entry || entry.event !== eventName) return false;
      if (entry.event_schema_version !== ANALYTICS_SCHEMA_VERSION) return false;
      return !dedupeKey || entry.dedupe_key === dedupeKey;
    });
  }

  function trackSchemaEvent(eventName, payload = {}, options = {}) {
    const dedupeKey = options.dedupeKey || "";

    if (dedupeKey && hasSchemaV2Event(eventName, dedupeKey)) {
      return;
    }

    const enhancedPayload = getAnalyticsBasePayload(Object.assign({
      event_id: `${eventName}_${Date.now()}_${randomIdPart()}`,
      dedupe_key: dedupeKey
    }, payload || {}));

    if (typeof window.nmTrack === "function") {
      window.nmTrack(eventName, enhancedPayload);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, enhancedPayload));
  }

  function getConfig() {
    return window.NM_CONFIG || {};
  }

  function getLang() {
    const saved = localStorage.getItem("nm_lang") || "hu";
    const supported = getConfig().SUPPORTED_LANGS || ["hu"];
    return supported.includes(saved) ? saved : "hu";
  }

  function getUI() {
    const all = window.NM_UI || {};
    const fallback = window.NM_UI_FALLBACK || "en";
    return all[state.lang] || all[fallback] || {};
  }

  function installFrontendDesign() {
    if (document.getElementById("nm-frontend-design-v3")) return;

    const style = document.createElement("style");
    style.id = "nm-frontend-design-v3";
    style.textContent = `
      #nmApp,
      #questionnaireStart {
        color: #142033;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #nmApp *,
      #languageModal *,
      #questionnaireStart * {
        box-sizing: border-box;
      }

      #questionnaireStart {
        overflow-wrap: anywhere;
      }

      #questionnaireStart img {
        height: auto;
        max-width: 100%;
      }

      #nmApp {
        margin: 0 auto;
        max-width: 980px;
        padding: 28px 18px 44px;
      }

      #pageTitle {
        color: #0f2137;
        font-size: 34px;
        font-weight: 900;
        letter-spacing: 0;
        line-height: 1.12;
        margin: 0 0 10px;
        text-wrap: balance;
      }

      #pageIntro {
        color: #4f6478;
        font-size: 17px;
        line-height: 1.65;
        margin: 0 0 24px;
        max-width: 720px;
      }

      #labelName,
      #labelEmail,
      #labelChildAge,
      #progressLabel {
        color: #1c2d42;
        display: block;
        font-size: 14px;
        font-weight: 800;
        margin: 0 0 7px;
      }

      #name,
      #email,
      #childAge,
      .nm-answer-select {
        appearance: none;
        background: #ffffff;
        border: 1px solid #cfe3ef;
        border-radius: 14px;
        color: #162235;
        font: inherit;
        font-size: 15px;
        min-height: 48px;
        outline: none;
        padding: 12px 14px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        width: 100%;
      }

      #childAgeField {
        margin-bottom: 18px;
        max-width: 100%;
      }

      #name:focus,
      #email:focus,
      #childAge:focus,
      .nm-answer-select:focus {
        border-color: #1197d5;
        box-shadow: 0 0 0 4px rgba(17, 151, 213, 0.14);
      }

      .nm-answer-select {
        background-image:
          linear-gradient(45deg, transparent 50%, #1197d5 50%),
          linear-gradient(135deg, #1197d5 50%, transparent 50%);
        background-position:
          calc(100% - 18px) 20px,
          calc(100% - 12px) 20px;
        background-repeat: no-repeat;
        background-size: 6px 6px, 6px 6px;
        cursor: pointer;
        font-weight: 700;
        padding-right: 34px;
      }

      [dir="rtl"] .nm-answer-select {
        background-position: 18px 20px, 24px 20px;
        padding-left: 34px;
        padding-right: 14px;
      }

      #progressText {
        color: #526579;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0;
        margin: 18px 0 8px;
      }

      #progressBar {
        background: linear-gradient(90deg, #1197d5 0%, #72be00 52%, #ff7a00 100%);
        border-radius: 999px;
        min-height: 8px;
      }

      .nm-progress-steps {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 10px 0 4px;
      }

      .nm-progress-step {
        align-items: center;
        background: #f6fbff;
        border: 1px solid #d8edf8;
        border-radius: 999px;
        color: #526579;
        display: flex;
        font-size: 12px;
        font-weight: 850;
        gap: 7px;
        justify-content: center;
        line-height: 1.2;
        min-height: 34px;
        padding: 7px 10px;
        text-align: center;
      }

      .nm-progress-step-index {
        align-items: center;
        background: #e4f5fc;
        border-radius: 50%;
        color: #0b86bf;
        display: inline-flex;
        flex: 0 0 auto;
        font-size: 11px;
        height: 21px;
        justify-content: center;
        width: 21px;
      }

      .nm-progress-step.is-active {
        background: #eff9ff;
        border-color: #9bd8f4;
        color: #142033;
      }

      .nm-progress-step.is-active .nm-progress-step-index {
        background: #1197d5;
        color: #ffffff;
      }

      .nm-step-assist {
        align-items: center;
        background: #f7fbff;
        border: 1px solid #dbeef8;
        border-radius: 16px;
        display: flex;
        gap: 14px;
        justify-content: space-between;
        margin: -6px 0 18px;
        padding: 12px 14px;
      }

      .nm-question-progress {
        align-items: center;
        color: #506578;
        display: inline-flex;
        flex-wrap: wrap;
        font-size: 13px;
        font-weight: 800;
        gap: 8px;
      }

      .nm-question-progress strong {
        background: #e8f7fd;
        border-radius: 999px;
        color: #0b86bf;
        padding: 5px 9px;
      }

      .nm-live-hint {
        color: #667085;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.4;
        text-align: right;
      }

      [dir="rtl"] .nm-live-hint {
        text-align: left;
      }

      #triageSection,
      #specificSection,
      #summarySection {
        margin-top: 24px;
      }

      .nm-step-title-card,
      .nm-summary-hero {
        background: linear-gradient(135deg, #1197d5 0%, #ff7a00 100%);
        border-color: transparent;
      }

      .nm-step-title-card {
        background:
          linear-gradient(135deg, rgba(17, 151, 213, 0.12), rgba(255, 122, 0, 0.12)),
          #ffffff;
        border: 1px solid #d7ecf8;
      }

      .nm-step-title-card,
      .nm-summary-hero {
        border-radius: 22px;
        box-shadow: 0 18px 42px rgba(20, 32, 51, 0.08);
        margin-bottom: 18px;
        overflow: hidden;
        padding: 24px;
        position: relative;
      }

      .nm-step-title-card::before,
      .nm-summary-hero::before {
        background: linear-gradient(180deg, #1197d5, #ff7a00);
        content: "";
        inset: 0 auto 0 0;
        position: absolute;
        width: 6px;
      }

      [dir="rtl"] .nm-step-title-card::before,
      [dir="rtl"] .nm-summary-hero::before {
        inset: 0 0 0 auto;
      }

      .nm-step-title-card h3,
      .nm-summary-hero h3 {
        color: #102033;
        font-size: 23px;
        font-weight: 900;
        line-height: 1.18;
        margin: 0 0 8px;
        text-wrap: balance;
      }

      .nm-step-title-card p,
      .nm-summary-hero p,
      .nm-summary-hero div {
        color: #506578;
        font-size: 15px;
        line-height: 1.65;
        margin: 0;
      }

      .nm-summary-hero h3,
      .nm-summary-hero p,
      .nm-summary-hero div {
        color: #ffffff;
        opacity: 1;
        text-shadow: 0 1px 2px rgba(16, 32, 51, 0.22);
      }

      .nm-q-card {
        align-items: start;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid #d9ecf7;
        border-radius: 18px;
        box-shadow: 0 12px 28px rgba(20, 32, 51, 0.055);
        display: grid;
        gap: 16px;
        grid-template-columns: 44px minmax(0, 1fr);
        margin: 12px 0;
        padding: 18px;
      }

      .nm-q-card:hover {
        border-color: #bfe5f7;
        box-shadow: 0 16px 34px rgba(20, 32, 51, 0.075);
      }

      .nm-q-card.is-answered {
        border-color: #b8e8cb;
        background:
          linear-gradient(135deg, rgba(114, 190, 0, 0.06), rgba(17, 151, 213, 0.04)),
          #ffffff;
      }

      .nm-q-card.is-next {
        border-color: #ffd09b;
        box-shadow: 0 12px 28px rgba(255, 122, 0, 0.1);
      }

      .nm-q-card.is-next .nm-q-number {
        background: #fff4e8;
        border-color: #ffd09b;
        color: #c75f00;
      }

      .nm-q-number {
        align-items: center;
        background: #eff9ff;
        border: 1px solid #caeafa;
        border-radius: 50%;
        color: #0b86bf;
        display: flex;
        font-size: 14px;
        font-weight: 900;
        height: 38px;
        justify-content: center;
        width: 38px;
      }

      .nm-q-text {
        color: #1c2d42;
        font-size: 16px;
        font-weight: 750;
        line-height: 1.52;
        overflow-wrap: anywhere;
      }

      .nm-q-body {
        min-width: 0;
        width: 100%;
      }

      .nm-answer-select {
        block-size: 1px !important;
        inline-size: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
      }

      .nm-answer-scale {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 14px;
      }

      .nm-answer-btn {
        align-items: center;
        background: #f8fcff;
        border: 1px solid #cfeefa;
        border-radius: 14px;
        color: #17304a;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        font: inherit;
        gap: 5px;
        justify-content: center;
        min-height: 58px;
        padding: 9px 8px;
        text-align: center;
        transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease, transform 0.18s ease;
      }

      .nm-answer-btn:hover,
      .nm-answer-btn:focus {
        border-color: #1197d5;
        box-shadow: 0 10px 20px rgba(17, 151, 213, 0.12);
        outline: none;
        transform: translateY(-1px);
      }

      .nm-answer-btn.is-selected,
      .nm-answer-btn[aria-pressed="true"] {
        background: linear-gradient(135deg, #1197d5, #0b86bf);
        border-color: #0b86bf;
        box-shadow: 0 12px 24px rgba(17, 151, 213, 0.22);
        color: #ffffff;
      }

      .nm-answer-value {
        align-items: center;
        background: rgba(255, 255, 255, 0.76);
        border-radius: 999px;
        color: #0b86bf;
        display: inline-flex;
        font-size: 13px;
        font-weight: 950;
        height: 23px;
        justify-content: center;
        min-width: 23px;
        padding: 0 7px;
      }

      .nm-answer-btn.is-selected .nm-answer-value,
      .nm-answer-btn[aria-pressed="true"] .nm-answer-value {
        background: rgba(255, 255, 255, 0.22);
        color: #ffffff;
      }

      .nm-answer-label {
        font-size: 12px;
        font-weight: 850;
        line-height: 1.2;
        overflow-wrap: anywhere;
      }

      #langButtons button.is-active {
        background: #1197d5 !important;
        border-color: #1197d5 !important;
        color: #ffffff !important;
      }

      .nm-summary-card {
        background: #ffffff;
        border: 1px solid #d9ecf7;
        border-radius: 22px;
        box-shadow: 0 14px 32px rgba(20, 32, 51, 0.065);
        margin: 16px 0;
        padding: 22px;
      }

      .nm-summary-card h4 {
        color: #1f2937;
        font-size: 18px;
        font-weight: 900;
        line-height: 1.25;
        margin: 0 0 12px;
      }

      .nm-summary-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 18px;
      }

      .nm-summary-pill {
        align-items: center;
        background: #eff9ff;
        border: 1px solid #cfeefa;
        border-radius: 999px;
        color: #16324c;
        display: inline-flex;
        font-size: 13px;
        font-weight: 850;
        gap: 8px;
        line-height: 1.3;
        padding: 9px 12px;
      }

      .nm-pill-dot {
        border-radius: 50%;
        display: inline-block;
        flex: 0 0 auto;
        height: 9px;
        width: 9px;
      }

      .nm-pill-dot.focus {
        background: #1197d5;
      }

      .nm-pill-dot.secondary {
        background: #ff7a00;
      }

      .nm-pill-dot.signal {
        background: #72be00;
      }

      .nm-summary-text {
        background: #f7fbff;
        border: 1px solid #dbeef8;
        border-left: 5px solid #1197d5;
        border-radius: 16px;
        color: #132235;
        font-size: 16px;
        font-weight: 650;
        line-height: 1.72;
        margin-top: 4px;
        padding: 16px;
      }

      [dir="rtl"] .nm-summary-text {
        border-left-width: 1px;
        border-right: 5px solid #1197d5;
      }

      .nm-report-teaser-card {
        background:
          linear-gradient(135deg, rgba(17, 151, 213, 0.08), rgba(114, 190, 0, 0.08)),
          #ffffff;
        border: 1px solid #cfeefa;
        border-radius: 22px;
        box-shadow: 0 16px 36px rgba(20, 32, 51, 0.07);
        margin: 16px 0;
        overflow: hidden;
        padding: 22px;
      }

      .nm-report-teaser-eyebrow {
        color: #0b86bf;
        display: block;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.06em;
        margin-bottom: 7px;
        text-transform: uppercase;
      }

      .nm-report-teaser-card h4 {
        color: #102033;
        font-size: 20px;
        font-weight: 950;
        line-height: 1.2;
        margin: 0 0 8px;
        text-wrap: balance;
      }

      .nm-report-teaser-lead {
        color: #344054;
        font-size: 15px;
        font-weight: 650;
        line-height: 1.65;
        margin: 0 0 16px;
      }

      .nm-report-teaser-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .nm-report-teaser-item {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid #dbeef8;
        border-radius: 16px;
        padding: 14px;
      }

      .nm-report-teaser-item strong {
        color: #102033;
        display: block;
        font-size: 14px;
        font-weight: 950;
        line-height: 1.3;
        margin-bottom: 6px;
      }

      .nm-report-teaser-item span {
        color: #506578;
        display: block;
        font-size: 13px;
        font-weight: 650;
        line-height: 1.55;
      }

      .nm-summary-cta-strip {
        align-items: center;
        background: #102033;
        border-radius: 16px;
        color: #ffffff;
        display: flex;
        gap: 14px;
        justify-content: space-between;
        line-height: 1.45;
        margin-top: 16px;
        padding: 14px 16px;
      }

      .nm-summary-cta-strip strong {
        display: block;
        font-size: 14px;
        font-weight: 950;
      }

      .nm-summary-cta-strip span {
        color: rgba(255, 255, 255, 0.82);
        display: block;
        font-size: 13px;
        font-weight: 650;
        margin-top: 2px;
      }

      .nm-summary-top-cta {
        align-items: center;
        background: #ffffff;
        border: 1px solid #d9ecf7;
        border-radius: 18px;
        box-shadow: 0 14px 30px rgba(20, 32, 51, 0.06);
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: space-between;
        margin: 0 0 16px;
        padding: 14px 16px;
      }

      .nm-summary-top-cta span {
        color: #506578;
        font-size: 13px;
        font-weight: 750;
        line-height: 1.45;
      }

      .nm-summary-pay-button {
        background: linear-gradient(135deg, #1197d5, #0b86bf);
        border: 0;
        border-radius: 14px;
        box-shadow: 0 14px 28px rgba(17, 151, 213, 0.22);
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 950;
        min-height: 46px;
        padding: 13px 22px;
        text-decoration: none;
        transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      }

      .nm-summary-pay-button:hover {
        box-shadow: 0 16px 32px rgba(17, 151, 213, 0.26);
        transform: translateY(-1px);
      }

      .nm-prepayment-trust-card {
        background:
          linear-gradient(135deg, rgba(255, 122, 0, 0.08), rgba(17, 151, 213, 0.08)),
          #ffffff;
        border: 1px solid #dbeef8;
        border-radius: 20px;
        box-shadow: 0 14px 30px rgba(20, 32, 51, 0.06);
        margin: 16px 0;
        padding: 18px;
      }

      .nm-prepayment-trust-card h4 {
        color: #102033;
        font-size: 18px;
        font-weight: 950;
        line-height: 1.25;
        margin: 0 0 12px;
      }

      .nm-trust-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .nm-trust-item {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #e1edf6;
        border-radius: 15px;
        padding: 12px;
      }

      .nm-trust-item strong {
        color: #102033;
        display: block;
        font-size: 13px;
        font-weight: 950;
        line-height: 1.3;
        margin-bottom: 5px;
      }

      .nm-trust-item span,
      .nm-prepayment-trust-note {
        color: #506578;
        display: block;
        font-size: 12.5px;
        font-weight: 650;
        line-height: 1.5;
      }

      .nm-prepayment-trust-note {
        margin-top: 12px;
      }

      .nm-landing-proof-strip {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 12px auto 0;
        max-width: 720px;
        padding: 0 16px;
      }

      .nm-landing-proof-item {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbeef8;
        border-radius: 999px;
        color: #344054;
        font-size: 12.5px;
        font-weight: 800;
        line-height: 1.25;
        min-height: 34px;
        padding: 8px 12px;
        text-align: center;
      }

      .nm-subdomain-row {
        align-items: center;
        border-bottom: 1px solid #edf3f7;
        display: flex;
        gap: 14px;
        justify-content: space-between;
        padding: 12px 0;
      }

      .nm-subdomain-row:last-child {
        border-bottom: 0;
      }

      .nm-subdomain-row span {
        color: #344054;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .nm-subdomain-label {
        display: block;
      }

      .nm-subdomain-meta {
        color: #6b7f93;
        display: block;
        font-size: 12px;
        font-weight: 700;
        margin-top: 2px;
      }

      .nm-subdomain-row strong {
        color: #0b86bf;
        font-variant-numeric: tabular-nums;
      }

      .nm-summary-warning {
        background: #fff8ed;
        border: 1px solid #ffd6a6;
        border-radius: 16px;
        color: #8a3f00;
        font-size: 14px;
        line-height: 1.6;
        margin-top: 16px;
        padding: 14px 16px;
      }

      .nm-checkout-review {
        background: #f7fbff;
        border: 1px solid #dbeef8;
        border-radius: 18px;
        box-shadow: 0 12px 28px rgba(20, 32, 51, 0.05);
        margin: 18px 0;
        padding: 18px;
      }

      .nm-checkout-review h4 {
        color: #102033;
        font-size: 18px;
        font-weight: 900;
        line-height: 1.25;
        margin: 0 0 12px;
      }

      .nm-review-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .nm-review-item {
        background: #ffffff;
        border: 1px solid #dbeef8;
        border-radius: 14px;
        padding: 12px;
      }

      .nm-review-label {
        color: #667085;
        display: block;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.04em;
        margin-bottom: 5px;
        text-transform: uppercase;
      }

      .nm-review-value {
        color: #102033;
        display: block;
        font-size: 14px;
        font-weight: 850;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .nm-review-note {
        color: #506578;
        font-size: 13px;
        line-height: 1.55;
        margin: 12px 0 0;
      }

      #backBtn,
      #nextBtn,
      #paymentBtn,
      #langSwitch,
      #languageModal button {
        border: 0;
        border-radius: 14px;
        cursor: pointer;
        font: inherit;
        font-weight: 900;
        min-height: 46px;
        text-decoration: none;
        transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      }

      #backBtn,
      #nextBtn,
      #paymentBtn {
        margin: 8px 8px 0 0;
      }

      [dir="rtl"] #backBtn,
      [dir="rtl"] #nextBtn,
      [dir="rtl"] #paymentBtn {
        margin: 8px 0 0 8px;
      }

      #nextBtn,
      #paymentBtn {
        background: linear-gradient(135deg, #1197d5, #0b86bf);
        box-shadow: 0 14px 28px rgba(17, 151, 213, 0.22);
        color: #ffffff;
        padding: 13px 22px;
      }

      #backBtn {
        background: #f2f7fb;
        color: #1d3148;
        padding: 13px 18px;
      }

      #nextBtn:hover,
      #paymentBtn:hover,
      #languageModal button:hover {
        box-shadow: 0 16px 32px rgba(17, 151, 213, 0.26);
        transform: translateY(-1px);
      }

      #backBtn:hover,
      #langSwitch:hover {
        background: #eaf5fb;
      }

      #nextBtn:disabled,
      #paymentBtn:disabled,
      #backBtn:disabled {
        cursor: wait;
        opacity: 0.62;
        transform: none;
      }

      #checkoutStatus {
        color: #0b86bf;
        font-size: 14px;
        font-weight: 800;
        margin-top: 12px;
        min-height: 20px;
      }

      .nm-resume-banner {
        align-items: center;
        background: linear-gradient(135deg, rgba(17, 151, 213, 0.12), rgba(114, 190, 0, 0.10)), #ffffff;
        border: 1px solid #cfe8f6;
        border-radius: 18px;
        box-shadow: 0 18px 38px rgba(20, 32, 51, 0.08);
        display: none;
        gap: 16px;
        justify-content: space-between;
        margin: 0 auto 16px;
        max-width: 980px;
        padding: 14px 16px;
      }

      .nm-resume-banner.is-visible {
        display: flex;
      }

      .nm-resume-copy {
        color: #526579;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.45;
      }

      .nm-resume-copy strong {
        color: #102033;
        display: block;
        font-size: 15px;
        font-weight: 900;
        margin-bottom: 2px;
      }

      .nm-resume-actions {
        display: flex;
        flex: 0 0 auto;
        gap: 8px;
      }

      .nm-resume-actions button {
        border: 0;
        border-radius: 12px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
        min-height: 38px;
        padding: 9px 12px;
      }

      .nm-resume-continue {
        background: #1197d5;
        color: #ffffff;
      }

      .nm-resume-restart {
        background: #eaf3f8;
        color: #173047;
      }

      #langSwitch {
        background: #ffffff;
        border: 1px solid #cfe3ef;
        box-shadow: 0 10px 24px rgba(20, 32, 51, 0.06);
        color: #16324c;
        padding: 10px 14px;
      }

      #languageModal {
        align-items: center;
        backdrop-filter: blur(8px);
        background: rgba(15, 32, 55, 0.52) !important;
        justify-content: center;
        padding: 18px;
      }

      #languageModal > * {
        background: #ffffff;
        border: 1px solid #d9ecf7;
        border-radius: 24px;
        box-shadow: 0 24px 70px rgba(15, 32, 55, 0.24);
        max-height: min(760px, 92vh);
        max-width: 520px;
        overflow: auto;
        padding: 28px !important;
        width: min(520px, 100%);
      }

      #languageModal h1,
      #languageModal h2,
      #languageModal h3 {
        color: #102033;
        font-weight: 900;
        letter-spacing: 0;
        line-height: 1.14;
        margin: 0 0 8px;
        text-align: center;
        text-wrap: balance;
      }

      #languageModal p {
        color: #526579;
        font-size: 15px;
        line-height: 1.55;
        margin: 0 0 16px;
        text-align: center;
      }

      #langButtons {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      #langButtons button {
        background: #f3fbff !important;
        border: 1px solid #caeafa !important;
        color: #15283d !important;
        margin: 0 !important;
        padding: 12px 14px !important;
        width: 100% !important;
      }

      #langButtons button:hover {
        background: #e8f7ff !important;
      }

      @media (max-width: 760px) {
        #nmApp {
          padding: 20px 12px 36px;
        }

        .nm-resume-banner {
          align-items: stretch;
          flex-direction: column;
          margin-left: 12px;
          margin-right: 12px;
        }

        .nm-resume-actions {
          width: 100%;
        }

        .nm-resume-actions button {
          flex: 1 1 0;
        }

        #pageTitle {
          font-size: 28px;
        }

        .nm-q-card {
          align-items: start;
          grid-template-columns: 38px minmax(0, 1fr);
        }

        .nm-answer-scale {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .nm-step-assist {
          align-items: flex-start;
          flex-direction: column;
        }

        .nm-live-hint {
          text-align: left;
        }

        .nm-review-grid {
          grid-template-columns: 1fr;
        }

        .nm-step-title-card,
        .nm-summary-hero,
        .nm-summary-card,
        .nm-prepayment-trust-card,
        .nm-summary-science-card,
        .nm-report-teaser-card {
          border-radius: 18px;
          padding: 18px;
        }

        .nm-report-teaser-grid {
          grid-template-columns: 1fr;
        }

        .nm-summary-science-grid {
          grid-template-columns: 1fr;
        }

        .nm-trust-grid,
        .nm-landing-proof-strip {
          grid-template-columns: 1fr;
        }

        .nm-summary-cta-strip {
          align-items: flex-start;
          flex-direction: column;
        }

        .nm-summary-top-cta {
          align-items: stretch;
          flex-direction: column;
        }

        .nm-summary-pay-button {
          width: 100%;
        }

        .nm-summary-pill {
          border-radius: 14px;
          width: 100%;
        }

        #langButtons {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 480px) {
        #nmApp {
          padding-left: 10px;
          padding-right: 10px;
        }

        #pageTitle {
          font-size: 25px;
        }

        #pageIntro,
        .nm-q-text,
        .nm-summary-text {
          font-size: 15px;
        }

        #backBtn,
        #nextBtn,
        #paymentBtn {
          margin-right: 0;
          width: 100%;
        }

        .nm-step-title-card,
        .nm-summary-hero,
        .nm-summary-card,
        .nm-prepayment-trust-card,
        .nm-report-teaser-card,
        .nm-q-card {
          border-radius: 16px;
        }

        .nm-progress-steps {
          grid-template-columns: 1fr;
        }

        .nm-answer-btn {
          min-height: 54px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #nmApp *,
        #languageModal * {
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function installLandingPolishV2() {
    if (document.getElementById("nm-landing-polish-v2")) return;

    const style = document.createElement("style");
    style.id = "nm-landing-polish-v2";
    style.textContent = `
      body:has(#questionnaireStart),
      body:has(#nmApp) {
        background: #f4f9fc;
        color: #132235;
      }

      #questionnaireStart {
        scroll-margin-top: 96px;
      }

      .nm-landing,
      .nm-social-landing,
      [data-nm-landing],
      [data-nm-section="landing"] {
        color: #132235;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .nm-social-landing,
      .nm-landing {
        min-height: auto !important;
      }

      .nm-social-landing .nm-topbar,
      .nm-landing .nm-topbar {
        align-items: center !important;
        background: rgba(255, 255, 255, 0.94) !important;
        border-bottom: 1px solid rgba(17, 24, 39, 0.08) !important;
        backdrop-filter: blur(14px);
        box-shadow: 0 10px 26px rgba(17, 24, 39, 0.04) !important;
        display: flex !important;
        gap: 16px !important;
        justify-content: space-between !important;
        min-height: 66px !important;
        padding: 9px clamp(16px, 3vw, 34px) !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 999 !important;
      }

      .nm-social-landing .nm-topbar-logo,
      .nm-landing .nm-topbar-logo {
        height: clamp(32px, 4vw, 46px) !important;
        max-height: 46px !important;
        max-width: min(190px, 42vw) !important;
        object-fit: contain !important;
        width: auto !important;
      }

      .nm-topbar.nm-topbar-fixed-brand {
        align-items: center !important;
        background: rgba(255, 255, 255, 0.94) !important;
        border-bottom: 1px solid rgba(17, 24, 39, 0.08) !important;
        box-shadow: 0 10px 26px rgba(17, 24, 39, 0.04) !important;
        display: flex !important;
        gap: 10px !important;
        min-height: 66px !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 999 !important;
      }

      .nm-brand-lockup {
        align-items: baseline !important;
        color: #102033 !important;
        display: inline-flex !important;
        flex: 0 0 auto !important;
        font-size: clamp(17px, 1.6vw, 22px) !important;
        font-weight: 950 !important;
        gap: 2px !important;
        letter-spacing: 0 !important;
        line-height: 1 !important;
        margin-right: auto !important;
        text-decoration: none !important;
        white-space: nowrap !important;
      }

      .nm-brand-neuro {
        color: #1197d5 !important;
      }

      .nm-brand-map {
        color: #ff7a00 !important;
      }

      .nm-brand-kids {
        color: #72b900 !important;
        margin-left: 5px !important;
      }

      .nm-social-landing .nm-section,
      .nm-landing .nm-section {
        display: block;
      }

      .nm-social-landing .nm-hero {
        display: block !important;
        min-height: auto !important;
        padding-top: clamp(24px, 4vh, 42px) !important;
      }

      .nm-social-landing .nm-container {
        margin-left: auto;
        margin-right: auto;
        max-width: 860px;
        padding-left: clamp(18px, 4vw, 32px);
        padding-right: clamp(18px, 4vw, 32px);
      }

      .nm-social-landing .nm-logo-mark {
        margin-left: auto;
        margin-right: auto;
      }

      .nm-landing-hero,
      .nm-social-landing,
      [data-nm-section="hero"] {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 249, 252, 0.88)),
          #f4f9fc;
        min-height: auto !important;
        padding-bottom: clamp(22px, 4vh, 42px) !important;
        padding-top: clamp(26px, 5vh, 52px) !important;
      }

      .nm-landing h1,
      .nm-social-landing h1,
      [data-nm-section="hero"] h1 {
        color: #102033;
        font-size: clamp(30px, 2.6vw, 42px);
        font-weight: 950;
        letter-spacing: 0;
        line-height: 1.08;
        margin: 0 auto 14px;
        max-width: 760px;
        text-wrap: balance;
      }

      .nm-landing p,
      .nm-social-landing p,
      [data-nm-section="hero"] p {
        color: #40566d;
        font-size: clamp(15px, 1.5vw, 18px);
        line-height: 1.55;
        margin-left: auto;
        margin-right: auto;
        max-width: 720px;
        text-wrap: pretty;
      }

      .nm-landing a,
      .nm-social-landing a,
      [data-nm-section="hero"] a,
      [data-nm-cta] {
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
      }

      .nm-landing [data-nm-cta],
      .nm-social-landing [data-nm-cta],
      a[href="#questionnaireStart"],
      a[href*="questionnaireStart"] {
        align-items: center;
        background: linear-gradient(135deg, #1197d5, #0b86bf);
        border-radius: 14px;
        box-shadow: 0 16px 34px rgba(17, 151, 213, 0.22);
        color: #ffffff !important;
        display: inline-flex;
        font-weight: 900;
        justify-content: center;
        max-width: 720px;
        min-height: 46px;
        padding: 12px 20px;
        text-decoration: none !important;
        transition: transform 0.16s ease, box-shadow 0.16s ease;
      }

      .nm-landing [data-nm-cta]:hover,
      .nm-social-landing [data-nm-cta]:hover,
      a[href="#questionnaireStart"]:hover,
      a[href*="questionnaireStart"]:hover {
        box-shadow: 0 18px 38px rgba(17, 151, 213, 0.28);
        transform: translateY(-1px);
      }

      .nm-landing img,
      .nm-social-landing img,
      [data-nm-section="hero"] img {
        height: auto;
        max-width: 100%;
      }

      .nm-landing .w-button,
      .nm-social-landing .w-button {
        letter-spacing: 0;
        white-space: normal;
      }

      .nm-landing-hero,
      .nm-social-landing,
      [data-nm-section="hero"] {
        padding-bottom: clamp(16px, 3vh, 28px) !important;
        padding-top: clamp(18px, 3vh, 32px) !important;
      }

      .nm-social-landing .nm-logo-mark,
      .nm-landing .nm-logo-mark {
        margin-bottom: 12px !important;
        transform: scale(0.82);
        transform-origin: center;
      }

      .nm-landing h1,
      .nm-social-landing h1,
      [data-nm-section="hero"] h1 {
        font-size: clamp(30px, 2.4vw, 40px) !important;
        line-height: 1.08 !important;
        margin-bottom: 10px !important;
        max-width: 680px !important;
      }

      .nm-landing p,
      .nm-social-landing p,
      [data-nm-section="hero"] p {
        font-size: clamp(14px, 1.25vw, 16px) !important;
        line-height: 1.45 !important;
        margin-bottom: 12px !important;
        max-width: 620px !important;
      }

      .nm-landing [data-nm-cta],
      .nm-social-landing [data-nm-cta],
      a[href="#questionnaireStart"],
      a[href*="questionnaireStart"] {
        max-width: 620px !important;
        min-height: 42px !important;
        padding: 10px 18px !important;
      }

      .nm-social-landing .nm-trust-row,
      .nm-landing .nm-trust-row {
        gap: 8px !important;
        margin-top: 12px !important;
      }

      .nm-social-landing .nm-trust-pill,
      .nm-landing .nm-trust-pill {
        min-height: 34px !important;
        padding: 7px 12px !important;
      }

      .nm-report-preview-section {
        margin-left: auto !important;
        margin-right: auto !important;
        max-width: 880px !important;
        padding-left: clamp(18px, 4vw, 32px) !important;
        padding-right: clamp(18px, 4vw, 32px) !important;
        text-align: center !important;
      }

      .nm-report-preview-section [data-nm-i18n="previewTitle"] {
        color: #102033 !important;
        font-size: clamp(24px, 2.4vw, 34px) !important;
        font-weight: 950 !important;
        letter-spacing: 0 !important;
        margin-bottom: 8px !important;
      }

      .nm-report-preview-section [data-nm-i18n="previewCaption"] {
        color: #52677e !important;
        margin-bottom: 18px !important;
      }

      .nm-report-preview-shell {
        align-items: stretch !important;
        background: linear-gradient(135deg, rgba(17, 151, 213, 0.10), rgba(255, 122, 0, 0.10)) !important;
        border: 1px solid rgba(17, 151, 213, 0.18) !important;
        border-radius: 22px !important;
        box-shadow: 0 22px 48px rgba(17, 24, 39, 0.08) !important;
        display: grid !important;
        gap: 16px !important;
        grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr) !important;
        margin: 20px auto 0 !important;
        max-width: 820px !important;
        padding: clamp(14px, 2vw, 20px) !important;
        text-align: left !important;
      }

      .nm-report-preview-page,
      .nm-report-preview-aside {
        background: rgba(255, 255, 255, 0.96) !important;
        border: 1px solid rgba(17, 24, 39, 0.08) !important;
        border-radius: 18px !important;
        box-shadow: 0 12px 26px rgba(17, 24, 39, 0.06) !important;
      }

      .nm-report-preview-page {
        border-left: 6px solid #ff7a00 !important;
        padding: 18px !important;
      }

      .nm-report-preview-head {
        align-items: center !important;
        display: flex !important;
        gap: 10px !important;
        margin-bottom: 14px !important;
      }

      .nm-report-preview-logo {
        align-items: center !important;
        background: linear-gradient(135deg, #1197d5, #ff7a00) !important;
        border-radius: 12px !important;
        color: #ffffff !important;
        display: inline-flex !important;
        font-size: 13px !important;
        font-weight: 950 !important;
        height: 38px !important;
        justify-content: center !important;
        width: 38px !important;
      }

      .nm-report-preview-kicker {
        color: #52677e !important;
        display: block !important;
        font-size: 12px !important;
        font-weight: 750 !important;
        margin-top: 2px !important;
      }

      .nm-report-preview-band {
        background: linear-gradient(135deg, #1197d5, #ff7a00) !important;
        border-radius: 14px !important;
        height: 58px !important;
        margin-bottom: 14px !important;
      }

      .nm-report-preview-line {
        background: #eef5f9 !important;
        border-radius: 999px !important;
        height: 10px !important;
        margin: 10px 0 !important;
      }

      .nm-report-preview-line.short {
        width: 62% !important;
      }

      .nm-report-preview-row {
        align-items: center !important;
        display: grid !important;
        gap: 8px !important;
        grid-template-columns: 82px 1fr !important;
        margin-top: 14px !important;
      }

      .nm-report-preview-pill {
        background: #e9f6fc !important;
        border: 1px solid rgba(17, 151, 213, 0.18) !important;
        border-radius: 999px !important;
        color: #102033 !important;
        display: inline-flex !important;
        font-size: 12px !important;
        font-weight: 850 !important;
        justify-content: center !important;
        padding: 7px 10px !important;
      }

      .nm-report-preview-aside {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        justify-content: center !important;
        padding: 16px !important;
      }

      .nm-report-preview-stat {
        background: #f6fbfd !important;
        border: 1px solid rgba(17, 24, 39, 0.07) !important;
        border-radius: 14px !important;
        padding: 12px !important;
      }

      .nm-report-preview-stat strong {
        color: #102033 !important;
        display: block !important;
        font-size: 14px !important;
        margin-bottom: 7px !important;
      }

      .nm-report-preview-stat span {
        color: #52677e !important;
        display: block !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
      }

      .nm-landing-reason-panel,
      .nm-mini-demo-card,
      .nm-summary-next-card,
      .nm-summary-science-card {
        background: #ffffff !important;
        border: 1px solid rgba(17, 151, 213, 0.16) !important;
        border-radius: 18px !important;
        box-shadow: 0 14px 34px rgba(16, 32, 51, 0.06) !important;
        color: #102033 !important;
        margin: 16px auto 0 !important;
        max-width: 760px !important;
        padding: 18px !important;
        text-align: left !important;
      }

      .nm-landing-reason-panel h3,
      .nm-mini-demo-card h3,
      .nm-summary-next-card h4,
      .nm-summary-science-card h4 {
        color: #102033 !important;
        font-size: 18px !important;
        line-height: 1.25 !important;
        margin: 0 0 8px !important;
      }

      .nm-landing-reason-panel p,
      .nm-mini-demo-card p,
      .nm-summary-next-card p,
      .nm-summary-science-card p {
        color: #52677e !important;
        font-size: 13px !important;
        line-height: 1.55 !important;
        margin: 0 0 12px !important;
      }

      .nm-landing-reason-actions,
      .nm-mini-demo-grid,
      .nm-summary-next-grid {
        display: grid !important;
        gap: 10px !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }

      .nm-landing-reason-button,
      .nm-mini-demo-item,
      .nm-summary-next-item {
        background: #f3fbff !important;
        border: 1px solid rgba(17, 151, 213, 0.16) !important;
        border-radius: 14px !important;
        color: #102033 !important;
        font-size: 13px !important;
        font-weight: 850 !important;
        line-height: 1.35 !important;
        padding: 11px 12px !important;
      }

      .nm-mini-demo-item strong,
      .nm-summary-next-item strong {
        color: #1197d5 !important;
        display: block !important;
        font-size: 12px !important;
        margin-bottom: 5px !important;
        text-transform: uppercase !important;
      }

      .nm-summary-science-grid {
        display: grid !important;
        gap: 10px !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        margin-top: 12px !important;
      }

      .nm-summary-science-item {
        background: #f8fbfd !important;
        border: 1px solid rgba(17, 151, 213, 0.14) !important;
        border-radius: 14px !important;
        color: #102033 !important;
        font-size: 13px !important;
        font-weight: 760 !important;
        line-height: 1.45 !important;
        padding: 12px !important;
      }

      .nm-summary-science-item strong {
        color: #1197d5 !important;
        display: block !important;
        font-size: 12px !important;
        margin-bottom: 5px !important;
        text-transform: uppercase !important;
      }

      .nm-landing-reason-note,
      .nm-mini-demo-note {
        color: #64748b !important;
        display: block !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
        margin-top: 12px !important;
      }

      @media (max-width: 720px) {
        .nm-landing-hero,
        .nm-social-landing,
        [data-nm-section="hero"] {
          min-height: auto;
          padding-bottom: 28px !important;
          padding-top: 34px !important;
        }

        .nm-landing h1,
        .nm-social-landing h1,
        [data-nm-section="hero"] h1 {
          font-size: clamp(27px, 7vw, 36px) !important;
        }

        .nm-landing [data-nm-cta],
        .nm-social-landing [data-nm-cta],
        a[href="#questionnaireStart"],
        a[href*="questionnaireStart"] {
          width: 100%;
        }

        .nm-brand-lockup {
          font-size: 17px !important;
        }

        .nm-report-preview-shell {
          grid-template-columns: 1fr !important;
        }

        .nm-landing-reason-actions,
        .nm-mini-demo-grid,
        .nm-summary-next-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  const LANDING_FALLBACK_TEXT = {
    hu: {
      modalTitle: "Válassz nyelvet",
      heroTitle: "Értsd meg, mi állhat gyermeked viselkedése mögött",
      heroSub: "10 perces kérdőív után személyre szabott, szülőbarát riportot és PDF-et kapsz.",
      primaryCta: "Kezdjük ->",
      microcopy: "Csak $5 - Nincs előfizetés - PDF riport emailben",
      trust1: "kb. 10 perc",
      trust2: "PDF riport emailben",
      trust3: "strukturált elemzés",
      valueTitle: "Mit kapsz pontosan?",
      value1: "személyre szabott értelmezés a válaszok alapján",
      value2: "viselkedési, érzelmi és tanulási mintázatok kiemelve",
      value3: "gyakorlati, szülőként is azonnal használható javaslatok",
      value4: "brandelt PDF riport emailben",
      stepsTitle: "Így működik",
      step1: "1. Kitöltöd a rövid előszűrő kérdőívet",
      step2: "2. A rendszer kiválasztja a releváns specifikus kérdéssort",
      step3: "3. Fizetés után elkészül és emailben megérkezik a riport",
      previewTitle: "Így néz ki a riport",
      previewCaption: "Minta előnézet: a teljes riport személyre szabottan, PDF-ben érkezik.",
      reasonTitle: "Miért éri meg most kitölteni?",
      reasonBody: "A rövid kérdőív után nem csak egy címkét kapsz, hanem egy érthető irányt: mire figyelj otthon, mikor érdemes szakemberhez fordulni, és milyen következő lépés lehet hasznos.",
      reasonParent: "Kevesebb bizonytalanság",
      reasonSchool: "Jobb beszélgetés óvodával vagy iskolával",
      reasonCalm: "Nyugodtabb, rendszerezett kép",
      reasonNote: "A cél nem az ijesztgetés, hanem egy megnyugtató, érthető kép a mintázatokról.",
      demoTitle: "Mit mutat meg a teljes riport?",
      demoLead: "A teljes PDF a válaszokból kirajzolódó fő és másodlagos jelzést, a korosztályi kontextust és a gyakorlati javaslatokat együtt magyarázza el.",
      demoMetric1: "Fő mintázat",
      demoMetric2: "Korosztályi nézőpont",
      demoMetric3: "Következő lépések",
      demoNote: "A riport szülőbarát, strukturált és nem diagnosztikus nyelven készül.",
      trustTitle: "Fontos tudni",
      trustText: "A NeuroMap Kids nem diagnózis, hanem strukturált előszűrés.",
      priceTitle: "Egyszeri díj",
      priceValue: "Csak $5",
      priceCta: "Riport elkészítése ->",
      priceMicrocopy: "Nincs előfizetés - Biztonságos fizetés - PDF emailben",
      stickyCta: "Kezdjük ->"
    },
    en: {
      modalTitle: "Choose language",
      heroTitle: "Understand what may be behind your child's behavior",
      heroSub: "After a 10-minute questionnaire, you receive a personalized, parent-friendly report and PDF.",
      primaryCta: "Start ->",
      microcopy: "Only $5 - No subscription - PDF report by email",
      trust1: "about 10 minutes",
      trust2: "PDF report by email",
      trust3: "structured analysis",
      valueTitle: "What you get",
      value1: "personalized interpretation based on your answers",
      value2: "behavioral, emotional, and learning patterns highlighted",
      value3: "practical parent-friendly suggestions",
      value4: "branded PDF report by email",
      stepsTitle: "How it works",
      step1: "1. Complete the short screening questionnaire",
      step2: "2. The system selects the relevant specific question set",
      step3: "3. After payment, the report is generated and sent by email",
      previewTitle: "What the report looks like",
      previewCaption: "Sample preview: the full report is personalized and delivered as a PDF.",
      reasonTitle: "Why complete it now?",
      reasonBody: "After the short questionnaire, you receive more than a label: a clearer direction for what to observe, when to seek professional guidance, and what next step may be useful.",
      reasonParent: "Less uncertainty",
      reasonSchool: "Better conversations with preschool or school",
      reasonCalm: "A calmer structured picture",
      reasonNote: "The goal is not to alarm you, but to organize the patterns in a parent-friendly way.",
      demoTitle: "What does the full report clarify?",
      demoLead: "The full PDF explains the primary and secondary signals, age context, and practical suggestions together.",
      demoMetric1: "Primary pattern",
      demoMetric2: "Age-aware context",
      demoMetric3: "Next steps",
      demoNote: "The report is parent-friendly, structured, and non-diagnostic.",
      trustTitle: "Important to know",
      trustText: "NeuroMap Kids is not a diagnosis.",
      priceTitle: "One-time payment",
      priceValue: "Only $5",
      priceCta: "Get report ->",
      priceMicrocopy: "No subscription - Secure payment - PDF by email",
      stickyCta: "Start ->"
    }
  };

  Object.assign(LANDING_FALLBACK_TEXT, {
    de: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Sprache wahlen",
      heroTitle: "Verstehe, was hinter dem Verhalten deines Kindes stehen kann",
      heroSub: "Nach einem 10-Minuten-Fragebogen erhaltst du einen personalisierten, elternfreundlichen Bericht als PDF.",
      primaryCta: "Starten ->",
      microcopy: "Nur $5 - Kein Abo - PDF per E-Mail",
      trust1: "ca. 10 Minuten",
      trust2: "PDF per E-Mail",
      trust3: "strukturierte Analyse",
      valueTitle: "Was du bekommst",
      priceTitle: "Einmalige Zahlung",
      priceCta: "Bericht erhalten ->",
      stickyCta: "Starten ->"
    },
    it: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Scegli la lingua",
      heroTitle: "Capisci cosa puo esserci dietro il comportamento di tuo figlio",
      heroSub: "Dopo un questionario di 10 minuti ricevi un report personalizzato e chiaro per genitori.",
      primaryCta: "Inizia ->",
      microcopy: "Solo $5 - Nessun abbonamento - PDF via email",
      trust1: "circa 10 minuti",
      trust2: "PDF via email",
      trust3: "analisi strutturata",
      valueTitle: "Cosa ricevi",
      priceTitle: "Pagamento unico",
      priceCta: "Ricevi il report ->",
      stickyCta: "Inizia ->"
    },
    es: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Elige idioma",
      heroTitle: "Comprende que puede haber detras del comportamiento de tu hijo",
      heroSub: "Tras un cuestionario de 10 minutos recibes un informe personalizado y claro para familias.",
      primaryCta: "Empezar ->",
      microcopy: "Solo $5 - Sin suscripcion - PDF por email",
      trust1: "unos 10 minutos",
      trust2: "PDF por email",
      trust3: "analisis estructurado",
      valueTitle: "Que recibes",
      priceTitle: "Pago unico",
      priceCta: "Recibir informe ->",
      stickyCta: "Empezar ->"
    },
    zh: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Choose language",
      heroTitle: "Understand what may be behind your child's behavior",
      primaryCta: "Start ->"
    },
    ja: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Choose language",
      heroTitle: "Understand what may be behind your child's behavior",
      primaryCta: "Start ->"
    },
    ar: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Choose language",
      heroTitle: "Understand what may be behind your child's behavior",
      primaryCta: "Start ->"
    },
    pl: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Wybierz jezyk",
      heroTitle: "Zrozum, co moze stac za zachowaniem Twojego dziecka",
      heroSub: "Po 10-minutowym kwestionariuszu otrzymasz spersonalizowany raport PDF dla rodzicow.",
      primaryCta: "Zacznij ->",
      microcopy: "Tylko $5 - Bez abonamentu - PDF emailem",
      trust1: "ok. 10 minut",
      trust2: "PDF emailem",
      trust3: "analiza strukturalna",
      valueTitle: "Co otrzymasz",
      priceTitle: "Platnosc jednorazowa",
      priceCta: "Otrzymaj raport ->",
      stickyCta: "Zacznij ->"
    },
    pt: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Escolher idioma",
      heroTitle: "Entenda o que pode estar por tras do comportamento do seu filho",
      heroSub: "Depois de um questionario de 10 minutos, voce recebe um relatorio PDF personalizado.",
      primaryCta: "Comecar ->",
      microcopy: "Apenas $5 - Sem assinatura - PDF por email",
      trust1: "cerca de 10 minutos",
      trust2: "PDF por email",
      trust3: "analise estruturada",
      valueTitle: "O que voce recebe",
      priceTitle: "Pagamento unico",
      priceCta: "Receber relatorio ->",
      stickyCta: "Comecar ->"
    },
    fr: {
      ...LANDING_FALLBACK_TEXT.en,
      modalTitle: "Choisir la langue",
      heroTitle: "Comprendre ce qui peut se cacher derriere le comportement de votre enfant",
      heroSub: "Apres un questionnaire de 10 minutes, vous recevez un rapport PDF personnalise.",
      primaryCta: "Commencer ->",
      microcopy: "Seulement $5 - Sans abonnement - PDF par email",
      trust1: "environ 10 minutes",
      trust2: "PDF par email",
      trust3: "analyse structuree",
      valueTitle: "Ce que vous recevez",
      priceTitle: "Paiement unique",
      priceCta: "Recevoir le rapport ->",
      stickyCta: "Commencer ->"
    }
  });

  function getLandingFallbackText(lang = state.lang) {
    return LANDING_FALLBACK_TEXT[lang] || LANDING_FALLBACK_TEXT.en || null;
  }

  let landingRescueInProgress = false;

  function restoreLandingSections() {
    const app = document.getElementById("nmApp");
    const questionnaireVisible =
      app && app.style.display !== "none" && app.offsetParent !== null;

    if (questionnaireVisible) return;

    document
      .querySelectorAll(".nm-social-landing .nm-section, .nm-landing .nm-section")
      .forEach((section) => {
        section.style.display = "block";
      });

    const hero =
      document.querySelector(".nm-social-landing .nm-hero") ||
      document.querySelector(".nm-landing .nm-hero") ||
      document.querySelector("[data-nm-section='hero']");

    if (hero) {
      hero.style.display = "block";
    }
  }

  function setImportantStyle(element, property, value) {
    if (!element) return;
    element.style.setProperty(property, value, "important");
  }

  function ensureStickyBrandHeader() {
    const topbar =
      document.querySelector("#nmSocialLanding .nm-topbar") ||
      document.querySelector(".nm-social-landing .nm-topbar") ||
      document.querySelector(".nm-landing .nm-topbar") ||
      document.querySelector(".nm-topbar");

    if (!topbar) return;

    topbar.classList.add("nm-topbar-fixed-brand");

    setImportantStyle(topbar, "align-items", "center");
    setImportantStyle(topbar, "background", "rgba(255, 255, 255, 0.94)");
    setImportantStyle(topbar, "border-bottom", "1px solid rgba(17, 24, 39, 0.08)");
    setImportantStyle(topbar, "box-shadow", "0 10px 26px rgba(17, 24, 39, 0.04)");
    setImportantStyle(topbar, "display", "flex");
    setImportantStyle(topbar, "min-height", "66px");
    setImportantStyle(topbar, "position", "sticky");
    setImportantStyle(topbar, "top", "0");
    setImportantStyle(topbar, "z-index", "999");

    const logo = topbar.querySelector(".nm-topbar-logo, img");
    if (logo) {
      logo.classList.add("nm-topbar-logo");
    }

    let brand = topbar.querySelector(".nm-brand-lockup");

    if (!brand) {
      brand = document.createElement("a");
      brand.className = "nm-brand-lockup";
      brand.href = "/";
      brand.setAttribute("aria-label", "NeuroMap Kids");
      brand.innerHTML =
        '<span class="nm-brand-neuro">Neuro</span><span class="nm-brand-map">Map</span><span class="nm-brand-kids">Kids</span>';

      const logoWrapper =
        logo &&
        logo.parentElement &&
        logo.parentElement !== topbar &&
        logo.parentElement.parentElement === topbar
          ? logo.parentElement
          : logo;

      if (logoWrapper && logoWrapper.parentElement === topbar) {
        topbar.insertBefore(brand, logoWrapper.nextSibling);
      } else {
        topbar.insertBefore(brand, topbar.firstChild);
      }
    }

    setImportantStyle(brand, "display", "inline-flex");
    setImportantStyle(brand, "margin-right", "auto");
    setImportantStyle(brand, "text-decoration", "none");
  }

  function getReportPreviewLabels(lang = state.lang) {
    const labels = {
      hu: {
        title: "NeuroMap Kids riport",
        subtitle: "személyre szabott előnézet",
        focus: "Fókusz",
        pattern: "Mintázat",
        suggestions: "Javaslatok",
        next: "Következő lépések",
        parent: "szülőbarát magyarázat",
        action: "gyakorlati ötletek",
        pdf: "brandelt PDF emailben"
      },
      en: {
        title: "NeuroMap Kids report",
        subtitle: "personalized preview",
        focus: "Focus",
        pattern: "Pattern",
        suggestions: "Suggestions",
        next: "Next steps",
        parent: "parent-friendly explanation",
        action: "practical ideas",
        pdf: "branded PDF by email"
      },
      de: {
        title: "NeuroMap Kids Bericht",
        subtitle: "personalisierte Vorschau",
        focus: "Fokus",
        pattern: "Muster",
        suggestions: "Empfehlungen",
        next: "Nachste Schritte",
        parent: "elternfreundliche Erklarung",
        action: "praktische Ideen",
        pdf: "PDF per E-Mail"
      },
      it: {
        title: "Report NeuroMap Kids",
        subtitle: "anteprima personalizzata",
        focus: "Focus",
        pattern: "Schema",
        suggestions: "Suggerimenti",
        next: "Prossimi passi",
        parent: "spiegazione per genitori",
        action: "idee pratiche",
        pdf: "PDF via email"
      },
      es: {
        title: "Informe NeuroMap Kids",
        subtitle: "vista previa personalizada",
        focus: "Foco",
        pattern: "Patron",
        suggestions: "Sugerencias",
        next: "Siguientes pasos",
        parent: "explicacion para familias",
        action: "ideas practicas",
        pdf: "PDF por email"
      },
      pl: {
        title: "Raport NeuroMap Kids",
        subtitle: "spersonalizowany podglad",
        focus: "Obszar",
        pattern: "Wzorzec",
        suggestions: "Wskazowki",
        next: "Kolejne kroki",
        parent: "wyjasnienie dla rodzicow",
        action: "praktyczne pomysly",
        pdf: "PDF emailem"
      },
      pt: {
        title: "Relatorio NeuroMap Kids",
        subtitle: "pre-visualizacao personalizada",
        focus: "Foco",
        pattern: "Padrao",
        suggestions: "Sugestoes",
        next: "Proximos passos",
        parent: "explicacao para pais",
        action: "ideias praticas",
        pdf: "PDF por email"
      },
      fr: {
        title: "Rapport NeuroMap Kids",
        subtitle: "apercu personnalise",
        focus: "Focus",
        pattern: "Schema",
        suggestions: "Pistes",
        next: "Prochaines etapes",
        parent: "explication pour parents",
        action: "idees pratiques",
        pdf: "PDF par email"
      },
      zh: null,
      ja: null,
      ar: null
    };

    return labels[lang] || labels.en;
  }

  function getLandingProofCopy(lang = state.lang) {
    const copies = {
      hu: [
        "szülőbarát, megnyugtató nyelvezet",
        "korosztályi szempontokkal finomítva",
        "nem diagnózis, hanem érthető előszűrés"
      ],
      en: [
        "parent-friendly, non-alarming language",
        "refined with age-aware context",
        "not a diagnosis, but a structured screening"
      ],
      de: [
        "elternfreundliche Sprache",
        "mit Alterskontext verfeinert",
        "strukturierter Screening-Bericht"
      ],
      it: [
        "linguaggio chiaro per genitori",
        "contesto legato all'eta",
        "screening strutturato, non diagnosi"
      ],
      es: [
        "lenguaje claro para familias",
        "con contexto por edad",
        "cribado estructurado, no diagnostico"
      ],
      pl: [
        "jezyk przyjazny rodzicom",
        "z kontekstem wieku",
        "screening, nie diagnoza"
      ],
      pt: [
        "linguagem clara para pais",
        "com contexto por idade",
        "triagem estruturada, nao diagnostico"
      ],
      fr: [
        "langage clair pour les parents",
        "contexte adapte a l'age",
        "depistage structure, pas diagnostic"
      ]
    };

    return copies[lang] || copies.en;
  }

  function ensureLandingTrustStrip(lang = state.lang) {
    const hero =
      document.querySelector("#nmSocialLanding .nm-hero") ||
      document.querySelector(".nm-social-landing .nm-hero") ||
      document.querySelector(".nm-landing .nm-hero") ||
      document.querySelector("[data-nm-section='hero']");

    const copy = getLandingProofCopy(lang);
    if (!hero) return;

    const existing = hero.querySelector(".nm-landing-proof-strip");
    if (existing) {
      existing.innerHTML = copy
        .map((item) => `<div class="nm-landing-proof-item">${escapeHtml(item)}</div>`)
        .join("");
      return;
    }

    const strip = document.createElement("div");
    strip.className = "nm-landing-proof-strip";
    strip.innerHTML = copy
      .map((item) => `<div class="nm-landing-proof-item">${escapeHtml(item)}</div>`)
      .join("");

    const insertAfter =
      hero.querySelector("[data-nm-i18n='microcopy']") ||
      hero.querySelector(".nm-hero-microcopy") ||
      hero.querySelector(".nm-hero-trust") ||
      hero.lastElementChild;

    if (insertAfter) {
      insertAfter.insertAdjacentElement("afterend", strip);
    } else {
      hero.appendChild(strip);
    }
  }

  function ensureLandingReasonPanel(lang = state.lang) {
    const hero =
      document.querySelector("#nmSocialLanding .nm-hero") ||
      document.querySelector(".nm-social-landing .nm-hero") ||
      document.querySelector(".nm-landing .nm-hero") ||
      document.querySelector("[data-nm-section='hero']");

    if (!hero) return;

    const copy = getLandingFallbackText(lang) || getLandingFallbackText("en");
    if (!copy) return;

    let panel = hero.querySelector(".nm-landing-reason-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.className = "nm-landing-reason-panel";

      const insertAfter =
        hero.querySelector(".nm-landing-proof-strip") ||
        hero.querySelector("[data-nm-i18n='microcopy']") ||
        hero.querySelector(".nm-hero-microcopy") ||
        hero.lastElementChild;

      if (insertAfter) {
        insertAfter.insertAdjacentElement("afterend", panel);
      } else {
        hero.appendChild(panel);
      }
    }

    panel.innerHTML = `
      <h3>${escapeHtml(copy.reasonTitle || LANDING_FALLBACK_TEXT.en.reasonTitle)}</h3>
      <p>${escapeHtml(copy.reasonBody || LANDING_FALLBACK_TEXT.en.reasonBody)}</p>
      <div class="nm-landing-reason-actions">
        <div class="nm-landing-reason-button">${escapeHtml(copy.reasonParent || LANDING_FALLBACK_TEXT.en.reasonParent)}</div>
        <div class="nm-landing-reason-button">${escapeHtml(copy.reasonSchool || LANDING_FALLBACK_TEXT.en.reasonSchool)}</div>
        <div class="nm-landing-reason-button">${escapeHtml(copy.reasonCalm || LANDING_FALLBACK_TEXT.en.reasonCalm)}</div>
      </div>
      <span class="nm-landing-reason-note">${escapeHtml(copy.reasonNote || LANDING_FALLBACK_TEXT.en.reasonNote)}</span>
    `;
  }

  function ensureLandingMiniDemo(lang = state.lang) {
    const title = document.querySelector('[data-nm-i18n="previewTitle"]');
    const copy = getLandingFallbackText(lang) || getLandingFallbackText("en");

    if (!title || !copy) return;

    const section =
      title.closest(".nm-section") ||
      title.closest("section") ||
      title.closest("[data-nm-section]") ||
      title.parentElement;

    if (!section) return;

    let card = section.querySelector(".nm-mini-demo-card");

    if (!card) {
      card = document.createElement("div");
      card.className = "nm-mini-demo-card";

      const previewShell = section.querySelector(".nm-report-preview-shell");
      if (previewShell) {
        previewShell.insertAdjacentElement("afterend", card);
      } else {
        section.appendChild(card);
      }
    }

    card.innerHTML = `
      <h3>${escapeHtml(copy.demoTitle || LANDING_FALLBACK_TEXT.en.demoTitle)}</h3>
      <p>${escapeHtml(copy.demoLead || LANDING_FALLBACK_TEXT.en.demoLead)}</p>
      <div class="nm-mini-demo-grid">
        <div class="nm-mini-demo-item"><strong>01</strong>${escapeHtml(copy.demoMetric1 || LANDING_FALLBACK_TEXT.en.demoMetric1)}</div>
        <div class="nm-mini-demo-item"><strong>02</strong>${escapeHtml(copy.demoMetric2 || LANDING_FALLBACK_TEXT.en.demoMetric2)}</div>
        <div class="nm-mini-demo-item"><strong>03</strong>${escapeHtml(copy.demoMetric3 || LANDING_FALLBACK_TEXT.en.demoMetric3)}</div>
      </div>
      <span class="nm-mini-demo-note">${escapeHtml(copy.demoNote || LANDING_FALLBACK_TEXT.en.demoNote)}</span>
    `;
  }

  function ensureReportPreviewMockup(lang = state.lang) {
    const title = document.querySelector('[data-nm-i18n="previewTitle"]');
    if (!title) return;

    const section =
      title.closest(".nm-section") ||
      title.closest("section") ||
      title.closest("[data-nm-section]") ||
      title.parentElement;

    if (!section) return;

    section.classList.add("nm-report-preview-section");

    const caption =
      section.querySelector('[data-nm-i18n="previewCaption"]') ||
      title.nextElementSibling ||
      title;

    let shell = section.querySelector(".nm-report-preview-shell");

    if (!shell) {
      shell = document.createElement("div");
      shell.className = "nm-report-preview-shell";
      shell.innerHTML = `
        <div class="nm-report-preview-page" aria-hidden="true">
          <div class="nm-report-preview-head">
            <div class="nm-report-preview-logo">NM</div>
            <div>
              <strong data-nm-preview-label="title"></strong>
              <span class="nm-report-preview-kicker" data-nm-preview-label="subtitle"></span>
            </div>
          </div>
          <div class="nm-report-preview-band"></div>
          <div class="nm-report-preview-line"></div>
          <div class="nm-report-preview-line"></div>
          <div class="nm-report-preview-line short"></div>
          <div class="nm-report-preview-row">
            <span class="nm-report-preview-pill" data-nm-preview-label="focus"></span>
            <div class="nm-report-preview-line"></div>
          </div>
          <div class="nm-report-preview-row">
            <span class="nm-report-preview-pill" data-nm-preview-label="pattern"></span>
            <div class="nm-report-preview-line"></div>
          </div>
          <div class="nm-report-preview-row">
            <span class="nm-report-preview-pill" data-nm-preview-label="suggestions"></span>
            <div class="nm-report-preview-line"></div>
          </div>
        </div>
        <div class="nm-report-preview-aside" aria-hidden="true">
          <div class="nm-report-preview-stat">
            <strong data-nm-preview-label="next"></strong>
            <span data-nm-preview-label="parent"></span>
          </div>
          <div class="nm-report-preview-stat">
            <strong data-nm-preview-label="suggestions"></strong>
            <span data-nm-preview-label="action"></span>
          </div>
          <div class="nm-report-preview-stat">
            <strong>PDF</strong>
            <span data-nm-preview-label="pdf"></span>
          </div>
        </div>
      `;
      caption.insertAdjacentElement("afterend", shell);
    }

    const labels = getReportPreviewLabels(lang);

    shell.querySelectorAll("[data-nm-preview-label]").forEach((element) => {
      const key = element.getAttribute("data-nm-preview-label");
      if (labels[key]) {
        element.textContent = labels[key];
      }
    });
  }

  function applyLandingCompactLayout() {
    const landing =
      document.getElementById("nmSocialLanding") ||
      document.querySelector(".nm-social-landing") ||
      document.querySelector(".nm-landing") ||
      document.querySelector("[data-nm-landing]");

    if (!landing) return;

    const hero =
      landing.querySelector(".nm-hero") ||
      landing.querySelector("[data-nm-section='hero']") ||
      landing;

    setImportantStyle(landing, "min-height", "auto");
    setImportantStyle(landing, "padding-top", "0");
    setImportantStyle(landing, "padding-bottom", "18px");

    setImportantStyle(hero, "min-height", "auto");
    setImportantStyle(hero, "padding-top", "24px");
    setImportantStyle(hero, "padding-bottom", "22px");

    landing.querySelectorAll("h1").forEach((heading) => {
      setImportantStyle(heading, "font-size", "clamp(30px, 2.4vw, 40px)");
      setImportantStyle(heading, "line-height", "1.08");
      setImportantStyle(heading, "margin-top", "0");
      setImportantStyle(heading, "margin-bottom", "10px");
      setImportantStyle(heading, "max-width", "660px");
    });

    landing.querySelectorAll("p").forEach((paragraph) => {
      setImportantStyle(paragraph, "font-size", "clamp(14px, 1.15vw, 16px)");
      setImportantStyle(paragraph, "line-height", "1.45");
      setImportantStyle(paragraph, "margin-bottom", "12px");
      setImportantStyle(paragraph, "max-width", "620px");
    });

    landing.querySelectorAll("[data-nm-cta], a[href='#questionnaireStart'], a[href*='questionnaireStart']").forEach((cta) => {
      setImportantStyle(cta, "max-width", "560px");
      setImportantStyle(cta, "min-height", "40px");
      setImportantStyle(cta, "padding-top", "9px");
      setImportantStyle(cta, "padding-bottom", "9px");
    });

    const activeLang = getLang() || state.lang || "hu";

    ensureStickyBrandHeader();
    ensureReportPreviewMockup(activeLang);
    ensureLandingTrustStrip(activeLang);
    ensureLandingReasonPanel(activeLang);
    ensureLandingMiniDemo(activeLang);
  }

  function applyLandingFallbackLanguage(lang = state.lang) {
    const copy = getLandingFallbackText(lang);
    let applied = 0;

    if (!copy) {
      applyLandingCompactLayout();
      return applied;
    }

    document.querySelectorAll("[data-nm-i18n]").forEach((element) => {
      const key = element.getAttribute("data-nm-i18n");
      const value = copy[key];
      if (typeof value === "string") {
        element.textContent = value;
        applied += 1;
      }
    });

    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle && copy.modalTitle) {
      modalTitle.textContent = copy.modalTitle;
    }

    const landing = document.getElementById("nmSocialLanding") ||
      document.querySelector(".nm-social-landing") ||
      document.querySelector("[data-nm-landing]");

    if (landing) {
      landing.style.visibility = "visible";
      landing.style.opacity = "1";
      if (landing.style.display === "none") {
        landing.style.display = "block";
      }
    }

    applyLandingCompactLayout();

    return applied;
  }

  function rescueLandingText(lang = state.lang) {
    if (landingRescueInProgress) return 0;

    landingRescueInProgress = true;

    try {
      const activeLang = getLang() || lang || state.lang || "hu";
      state.lang = activeLang;

      restoreLandingSections();

      const applied = applyLandingFallbackLanguage(activeLang);
      ensureLandingStartHandlers();
      bindLanguageSwitchers();
      applyLandingCompactLayout();

      restoreLandingSections();
      applyLandingCompactLayout();

      if (applied > 0) {
        document.documentElement.dataset.nmLandingRescued = "1";
      }

      return applied;
    } finally {
      landingRescueInProgress = false;
    }
  }

  function scheduleLandingTextRescue(lang = state.lang) {
    const resolveLang = () => getLang() || lang || state.lang || "hu";

    rescueLandingText(resolveLang());

    [50, 250, 800, 1600, 2600, 4000].forEach((delay) => {
      window.setTimeout(() => rescueLandingText(resolveLang()), delay);
    });

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => rescueLandingText(resolveLang()), { once: true });
    }

    window.addEventListener("load", () => rescueLandingText(resolveLang()), { once: true });

    if (!window.__nmLandingRescueObserverInstalled && "MutationObserver" in window) {
      window.__nmLandingRescueObserverInstalled = true;

      let rescueTimer = null;
      const queueRescue = () => {
        window.clearTimeout(rescueTimer);
        rescueTimer = window.setTimeout(() => rescueLandingText(resolveLang()), 40);
      };

      const target =
        document.getElementById("nmSocialLanding") ||
        document.querySelector(".nm-social-landing") ||
        document.body;

      if (target) {
        new MutationObserver(queueRescue).observe(target, {
          attributes: true,
          attributeFilter: ["class", "style"],
          childList: true,
          subtree: true
        });
      }
    }
  }

  function showQuestionnaireFromLanding() {
    const app = document.getElementById("nmApp");
    const target =
      document.getElementById("questionnaireStart") ||
      app ||
      document.getElementById("triageSection");

    if (app) {
      app.style.display = "block";
    }

    document.documentElement.classList.add("nm-questionnaire-open");

    trackSchemaEvent("nm_questionnaire_started", {
      funnel_step: "questionnaire_started"
    }, {
      dedupeKey: `questionnaire-started:${state.lang}`
    });

    if (target) {
      setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 20);
    }

    setTimeout(() => {
      const firstField = document.getElementById("name");
      if (firstField && typeof firstField.focus === "function") {
        firstField.focus({ preventScroll: true });
      }
    }, 450);
  }

  function ensureLandingStartHandlers() {
    const selectors = [
      ".nm-start-btn",
      "[data-nm-cta]",
      "a[href='#questionnaireStart']",
      "a[href*='questionnaireStart']"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((element) => {
      if (element.dataset.nmEngineStartBound === "1") return;

      element.dataset.nmEngineStartBound = "1";
      element.addEventListener("click", (event) => {
        event.preventDefault();
        showQuestionnaireFromLanding();
      });
    });
  }

  function getQuestionMark(lang) {
    if (lang === "ar") return "\u061f";
    if (lang === "zh" || lang === "ja") return "\uff1f";
    return "?";
  }

  function normalizeQuestionText(text, lang = state.lang) {
    if (!text) return "";

    let value = String(text).trim();
    if (!value) return "";

    value = value.replace(/\s+/g, " ");

    const firstLetterMatch = value.match(/\p{L}/u);
    if (firstLetterMatch && typeof firstLetterMatch.index === "number") {
      const index = firstLetterMatch.index;
      value =
        value.slice(0, index) +
        value.charAt(index).toLocaleUpperCase(lang || "en") +
        value.slice(index + 1);
    }

    value = value.replace(/[.!\u3002\u061f\uff1f]+$/u, "").trim();

    const questionMark = getQuestionMark(lang);

    if (!/[?\u061f\uff1f]$/u.test(value)) {
      value += questionMark;
    }

    if (lang === "es" && !value.startsWith("\u00bf")) {
      value = "\u00bf" + value;
    }

    return value;
  }

  function disorderLabel(kind) {
    const ui = getUI();
    return (ui.disorderNames && ui.disorderNames[kind]) || kind;
  }

  function getSeverityLabel(severity) {
    const t = getUI();
    const labels =
      t.severityLabels || {
        low: "Low",
        mild: "Mild",
        moderate: "Moderate",
        high: "High"
      };

    return labels[severity] || severity;
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setStatus(message) {
    const el = document.getElementById("checkoutStatus");
    if (el) el.textContent = message || "";
  }

  function getDraftCopy() {
    if (state.lang === "hu") {
      return {
        title: "Folytathatod, ahol abbahagytad",
        body: "A kitoltesedet ezen az eszkozon automatikusan elmentettuk.",
        continueLabel: "Folytatas",
        restartLabel: "Ujrakezdes"
      };
    }

    return {
      title: "Continue where you left off",
      body: "Your questionnaire progress was saved automatically on this device.",
      continueLabel: "Continue",
      restartLabel: "Restart"
    };
  }

  function getInputValue(id) {
    const el = document.getElementById(id);
    return el && typeof el.value === "string" ? el.value : "";
  }

  function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el && typeof el.value === "string") el.value = value || "";
  }

  function collectPartialAnswers(scopeId) {
    const root = scopeId ? document.getElementById(scopeId) : document;
    if (!root) return [];

    return Array.from(root.querySelectorAll(".nm-answer-select")).map((el) => {
      if (el.value === "") return null;
      const value = Number(el.value);
      return Number.isNaN(value) ? null : value;
    });
  }

  function syncPartialAnswersForDraft() {
    if (state.step === "triage") {
      state.triageAnswers = collectPartialAnswers("triageSection");
      return;
    }

    if (state.step === "specific") {
      const values = collectPartialAnswers("specificSection");
      state.specificAnswers = values.slice(0, state.specificQuestions.length);
      state.extraAnswers = state.needsExtra
        ? values.slice(state.specificQuestions.length)
        : [];
    }
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;

      const draft = JSON.parse(raw);
      const savedAt = Number(draft && draft.savedAt ? draft.savedAt : 0);

      if (!draft || !savedAt || Date.now() - savedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return null;
      }

      return draft;
    } catch (_error) {
      return null;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_error) {
      // localStorage can be blocked in strict browser privacy modes.
    }
  }

  function saveDraft(reason = "auto") {
    try {
      if (!state.triageQuestions.length) return;

      syncPartialAnswersForDraft();

      const draft = {
        version: 1,
        reason,
        savedAt: Date.now(),
        lang: state.lang,
        step: state.step,
        name: getInputValue("name"),
        email: getInputValue("email"),
        childAge: getInputValue("childAge"),
        triageQuestions: state.triageQuestions,
        triageAnswers: state.triageAnswers,
        triageScores: state.triageScores,
        triageRanking: state.triageRanking,
        detectedRisk: state.detectedRisk,
        secondaryRisk: state.secondaryRisk,
        needsExtra: state.needsExtra,
        specificQuestions: state.specificQuestions,
        specificAnswers: state.specificAnswers,
        specificScoring: state.specificScoring,
        specificProfile: state.specificProfile,
        resultSummary: state.resultSummary,
        extraQuestions: state.extraQuestions,
        extraAnswers: state.extraAnswers,
        extraDebug: state.extraDebug
      };

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      updateResumeBanner(false);
    } catch (error) {
      console.warn("NeuroMap draft save failed:", error);
    }
  }

  function restoreDraft(draft) {
    if (!draft || draft.version !== 1) return false;

    state.lang = draft.lang || state.lang;
    state.step = draft.step || "triage";
    state.triageQuestions =
      Array.isArray(draft.triageQuestions) && draft.triageQuestions.length
        ? draft.triageQuestions
        : state.triageQuestions;
    state.triageAnswers = Array.isArray(draft.triageAnswers) ? draft.triageAnswers : [];
    state.triageScores = draft.triageScores || null;
    state.triageRanking = draft.triageRanking || null;
    state.detectedRisk = draft.detectedRisk || null;
    state.secondaryRisk = draft.secondaryRisk || null;
    state.needsExtra = !!draft.needsExtra;
    state.specificQuestions = Array.isArray(draft.specificQuestions) ? draft.specificQuestions : [];
    state.specificAnswers = Array.isArray(draft.specificAnswers) ? draft.specificAnswers : [];
    state.specificScoring = draft.specificScoring || null;
    state.specificProfile = draft.specificProfile || null;
    state.resultSummary = draft.resultSummary || null;
    state.extraQuestions = Array.isArray(draft.extraQuestions) ? draft.extraQuestions : [];
    state.extraAnswers = Array.isArray(draft.extraAnswers) ? draft.extraAnswers : [];
    state.extraDebug = draft.extraDebug || null;
    state.draftRestored = true;

    setTimeout(() => {
      setInputValue("name", draft.name);
      setInputValue("email", draft.email);
      setInputValue("childAge", draft.childAge);
      if (typeof updateChildAgeFieldLanguage === "function") updateChildAgeFieldLanguage();
    }, 0);

    return true;
  }

  function resetQuestionnaireDraft() {
    clearDraft();
    state.step = "triage";
    state.triageQuestions = buildTriageQuestions();
    state.triageAnswers = [];
    state.triageScores = null;
    state.triageRanking = null;
    state.detectedRisk = null;
    state.secondaryRisk = null;
    state.specificQuestions = [];
    state.specificAnswers = [];
    state.specificScoring = null;
    state.specificProfile = null;
    state.resultSummary = null;
    state.extraQuestions = [];
    state.extraAnswers = [];
    state.extraDebug = null;
    state.needsExtra = false;
    state.draftRestored = false;
    setStatus("");
    renderCurrentStep();
    updateResumeBanner(false);
  }

  function ensureResumeBanner() {
    let banner = document.getElementById("nmResumeBanner");
    if (banner) return banner;

    const app = document.getElementById("nmApp") || document.getElementById("questionnaireStart");
    if (!app || !app.parentNode) return null;

    banner = document.createElement("div");
    banner.id = "nmResumeBanner";
    banner.className = "nm-resume-banner";
    banner.innerHTML = `
      <div class="nm-resume-copy">
        <strong data-nm-resume-title></strong>
        <span data-nm-resume-body></span>
      </div>
      <div class="nm-resume-actions">
        <button type="button" class="nm-resume-continue" data-nm-resume-continue></button>
        <button type="button" class="nm-resume-restart" data-nm-resume-restart></button>
      </div>
    `;

    app.parentNode.insertBefore(banner, app);

    const continueButton = banner.querySelector("[data-nm-resume-continue]");
    const restartButton = banner.querySelector("[data-nm-resume-restart]");

    if (continueButton) {
      continueButton.addEventListener("click", () => {
        state.draftRestored = false;
        updateResumeBanner(false);
        renderCurrentStep();
        if (typeof showQuestionnaireFromLanding === "function") showQuestionnaireFromLanding();
      });
    }

    if (restartButton) restartButton.addEventListener("click", resetQuestionnaireDraft);

    return banner;
  }

  function updateResumeBanner(shouldShow = null) {
    const banner = ensureResumeBanner();
    if (!banner) return;

    const copy = getDraftCopy();
    const title = banner.querySelector("[data-nm-resume-title]");
    const body = banner.querySelector("[data-nm-resume-body]");
    const continueButton = banner.querySelector("[data-nm-resume-continue]");
    const restartButton = banner.querySelector("[data-nm-resume-restart]");

    if (title) title.textContent = copy.title;
    if (body) body.textContent = copy.body;
    if (continueButton) continueButton.textContent = copy.continueLabel;
    if (restartButton) restartButton.textContent = copy.restartLabel;

    const visible = shouldShow === null ? state.draftRestored : shouldShow;
    banner.classList.toggle("is-visible", Boolean(visible && readDraft()));
  }

  function bindDraftAutosave() {
    if (document.documentElement.dataset.nmDraftAutosaveBound === "1") return;
    document.documentElement.dataset.nmDraftAutosaveBound = "1";

    document.addEventListener("change", (event) => {
      const target = event.target;
      if (!target || !target.matches(".nm-answer-select,#name,#email,#childAge")) return;
      saveDraft("change");
    });

    document.addEventListener(
      "blur",
      (event) => {
        const target = event.target;
        if (!target || !target.matches("#name,#email,#childAge")) return;
        saveDraft("blur");
      },
      true
    );

    window.addEventListener("beforeunload", () => saveDraft("beforeunload"));
  }

  function scrollToQuestionnaireTop() {
    const app = document.getElementById("nmApp");
    const questionnaireVisible =
      app && app.style.display !== "none" && app.offsetParent !== null;

    if (!questionnaireVisible) return;

    const target =
      document.getElementById("questionnaireStart") ||
      document.getElementById("nmApp") ||
      document.getElementById("triageSection");

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function validateRuntimeBanks() {
    const errors = [];

    if (!Array.isArray(window.NM_TRIAGE_BANK)) {
      errors.push("NM_TRIAGE_BANK is missing or not an array.");
    } else if (window.NM_TRIAGE_BANK.length !== 250) {
      errors.push(`NM_TRIAGE_BANK should have 250 items, found ${window.NM_TRIAGE_BANK.length}.`);
    }

    const specific = window.NM_SPECIFIC_BANK || {};

    DISORDERS.forEach((domain) => {
      if (!Array.isArray(specific[domain])) {
        errors.push(`NM_SPECIFIC_BANK.${domain} is missing or not an array.`);
      } else if (specific[domain].length !== 250) {
        errors.push(`NM_SPECIFIC_BANK.${domain} should have 250 items, found ${specific[domain].length}.`);
      }
    });

    if (!window.NM_EXTRA_BANK || typeof window.NM_EXTRA_BANK !== "object") {
      errors.push("NM_EXTRA_BANK is missing.");
    }

    if (errors.length) {
      console.error("NeuroMap runtime bank validation failed:", errors);
      setStatus("A kérdőív betöltése nem sikerült. Kérjük, frissítsd az oldalt, vagy próbáld újra később.");
      return false;
    }

    if (!window.NM_ADAPTIVE_ENGINE) {
      console.warn("NM_ADAPTIVE_ENGINE is not available. Engine will use local fallback picker.");
    }

    console.log("NeuroMap runtime bank validation passed.");
    return true;
  }

  function inferStemKey(item) {
    if (item && item.stemKey) return item.stemKey;

    const text =
      (item && item.text ? item.text.en || item.text.hu || "" : "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .trim();

    const words = text.split(/\s+/).filter(Boolean).slice(0, 6);
    return `${(item && item.subdomain) || "general"}::${words.join("_")}`;
  }

  function pickBalancedTriageQuestions(bank, perDomain = 5) {
    const domains = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

    if (!Array.isArray(bank) || bank.length === 0) return [];

    function pickDiversifiedFromDomain(pool, count) {
      if (!Array.isArray(pool) || pool.length === 0) return [];

      const bySubdomain = {};

      pool.forEach((q) => {
        const key = q && q.subdomain ? q.subdomain : "general";
        if (!bySubdomain[key]) bySubdomain[key] = [];
        bySubdomain[key].push(q);
      });

      const subdomains = Object.keys(bySubdomain);
      const selected = [];
      const selectedIds = new Set();
      const usedStemKeys = new Set();

      for (const subdomain of shuffle(subdomains)) {
        if (selected.length >= count) break;

        const candidates = shuffle(bySubdomain[subdomain]).sort(
          (a, b) => Number(b.weight || 1) - Number(a.weight || 1)
        );

        const candidate = candidates.find((item) => {
          const stemKey = inferStemKey(item);
          return !usedStemKeys.has(stemKey) && !selectedIds.has(item.id);
        });

        if (candidate) {
          selected.push(candidate);
          selectedIds.add(candidate.id);
          usedStemKeys.add(inferStemKey(candidate));
        }
      }

      if (selected.length < count) {
        const remaining = shuffle(pool).sort(
          (a, b) => Number(b.weight || 1) - Number(a.weight || 1)
        );

        for (const item of remaining) {
          if (selected.length >= count) break;
          if (selectedIds.has(item.id)) continue;

          const stemKey = inferStemKey(item);
          if (usedStemKeys.has(stemKey)) continue;

          selected.push(item);
          selectedIds.add(item.id);
          usedStemKeys.add(stemKey);
        }
      }

      if (selected.length < count) {
        for (const item of shuffle(pool)) {
          if (selected.length >= count) break;
          if (selectedIds.has(item.id)) continue;

          selected.push(item);
          selectedIds.add(item.id);
        }
      }

      return selected.slice(0, Math.min(count, selected.length));
    }

    return shuffle(
      domains.flatMap((domain) => {
        const pool = bank.filter((q) => q && q.domain === domain);
        return pickDiversifiedFromDomain(pool, perDomain);
      })
    );
  }

  function pickBalancedSpecificQuestions(bank, count = 30) {
    const browserEngine = window.NM_ADAPTIVE_ENGINE;

    if (
      browserEngine &&
      typeof browserEngine.pickBalancedSpecificQuestions === "function"
    ) {
      const interpretation = state.needsExtra
        ? "mixed_pattern"
        : "coherent_pattern";

      const focusSubdomains =
        typeof browserEngine.getRecommendedFocusAreas === "function"
          ? browserEngine.getRecommendedFocusAreas(
              state.detectedRisk,
              state.secondaryRisk,
              interpretation
            )
          : [];

      const seedParts = [
        "specific",
        state.lang || "hu",
        state.detectedRisk || "unknown",
        state.secondaryRisk || "none",
        (state.triageAnswers || []).join("-")
      ];

      return browserEngine
        .pickBalancedSpecificQuestions(bank, {
          count,
          seed: seedParts.join(":"),
          focusSubdomains,
          avoidStemKeys: [],
          maxPerStem: 1,
          targetReverseRatio: 0.2
        })
        .map((question) => {
          if (question.stemKey) return question;

          return Object.assign({}, question, {
            stemKey:
              typeof browserEngine.inferStemKey === "function"
                ? browserEngine.inferStemKey(question)
                : inferStemKey(question)
          });
        });
    }

    if (!Array.isArray(bank) || bank.length === 0) return [];

    const bySubdomain = {};

    bank.forEach((q) => {
      const key = q.subdomain || "general";
      if (!bySubdomain[key]) bySubdomain[key] = [];
      bySubdomain[key].push(q);
    });

    const subdomains = Object.keys(bySubdomain);

    if (subdomains.length === 0) {
      return shuffle(bank).slice(0, Math.min(count, bank.length));
    }

    function diversifyPool(pool, targetCount) {
      const shuffled = shuffle(pool).sort(
        (a, b) => Number(b.weight || 1) - Number(a.weight || 1)
      );

      const selected = [];
      const usedStemKeys = new Set();
      let reverseCount = 0;

      for (const item of shuffled) {
        if (selected.length >= targetCount) break;

        const stemKey = inferStemKey(item);
        const isReverse = !!item.reverse;

        if (usedStemKeys.has(stemKey)) continue;
        if (isReverse && reverseCount >= Math.max(1, Math.floor(targetCount * 0.25))) continue;

        selected.push(Object.assign({}, item, { stemKey }));
        usedStemKeys.add(stemKey);
        if (isReverse) reverseCount += 1;
      }

      if (selected.length < targetCount) {
        for (const item of shuffled) {
          if (selected.length >= targetCount) break;
          if (selected.some((s) => s.id === item.id)) continue;
          selected.push(Object.assign({}, item, { stemKey: inferStemKey(item) }));
        }
      }

      return selected.slice(0, targetCount);
    }

    const perSubdomain = Math.floor(count / subdomains.length);
    let remainder = count % subdomains.length;
    let selected = [];

    for (const subdomain of subdomains) {
      selected.push(...diversifyPool(bySubdomain[subdomain] || [], perSubdomain));
    }

    if (remainder > 0) {
      const alreadySelectedIds = new Set(selected.map((q) => q.id));
      const leftovers = subdomains.flatMap((subdomain) =>
        (bySubdomain[subdomain] || []).filter((q) => !alreadySelectedIds.has(q.id))
      );

      selected.push(...diversifyPool(leftovers, remainder));
    }

    if (selected.length < count) {
      const alreadySelectedIds = new Set(selected.map((q) => q.id));
      const remaining = bank.filter((q) => !alreadySelectedIds.has(q.id));
      selected.push(...shuffle(remaining).slice(0, count - selected.length));
    }

    return shuffle(selected).slice(0, Math.min(count, selected.length));
  }

  function buildExtraQuestions(primaryKind, secondaryKind = null) {
    const allBanks = window.NM_EXTRA_BANK || {};
    const primaryBank = Array.isArray(allBanks[primaryKind]) ? [...allBanks[primaryKind]] : [];
    const secondaryBank =
      secondaryKind && Array.isArray(allBanks[secondaryKind])
        ? [...allBanks[secondaryKind]]
        : [];

    function pickUnique(pool, count, usedStemKeys = new Set()) {
      const selected = [];
      const selectedIds = new Set();

      const shuffled = shuffle(pool).sort(
        (a, b) => Number(b.weight || 1) - Number(a.weight || 1)
      );

      for (const item of shuffled) {
        if (selected.length >= count) break;
        if (selectedIds.has(item.id)) continue;

        const stemKey = inferStemKey(item);
        if (usedStemKeys.has(stemKey)) continue;

        selected.push(item);
        selectedIds.add(item.id);
        usedStemKeys.add(stemKey);
      }

      if (selected.length < count) {
        for (const item of shuffled) {
          if (selected.length >= count) break;
          if (selectedIds.has(item.id)) continue;

          selected.push(item);
          selectedIds.add(item.id);
        }
      }

      return selected;
    }

    if (!secondaryKind || secondaryKind === primaryKind || secondaryBank.length === 0) {
      return shuffle(pickUnique(primaryBank, 5));
    }

    const usedStemKeys = new Set();
    const primaryPicked = pickUnique(primaryBank, 3, usedStemKeys);
    const secondaryPicked = pickUnique(secondaryBank, 2, usedStemKeys);
    const combined = [...primaryPicked, ...secondaryPicked];

    if (combined.length < 5) {
      const selectedIds = new Set(combined.map((q) => q.id));
      const fallbackPool = shuffle([...primaryBank, ...secondaryBank]);

      for (const item of fallbackPool) {
        if (combined.length >= 5) break;
        if (selectedIds.has(item.id)) continue;

        combined.push(item);
        selectedIds.add(item.id);
      }
    }

    return shuffle(combined).slice(0, 5);
  }

  function normalizeAnswer(value, reverse) {
    const numeric = Number(value || 0);
    return reverse ? 3 - numeric : numeric;
  }

  function evaluateTriage(questions, answers) {
    const result = {
      rawScores: {
        ADHD: 0,
        ASD: 0,
        ANXIETY: 0,
        DEPRESSION: 0,
        LEARNING: 0
      },
      domainStats: {}
    };

    DISORDERS.forEach((domain) => {
      result.domainStats[domain] = {
        itemCount: 0,
        average: 0,
        strongestSubdomain: 0,
        consistency: 0,
        weightedSignal: 0,
        subdomains: {}
      };
    });

    questions.forEach((q, i) => {
      const domain = q && q.domain;
      if (!domain || !(domain in result.rawScores)) return;

      const value = Number(answers[i] || 0);
      const subdomain = q.subdomain || "general";

      result.rawScores[domain] += value;
      result.domainStats[domain].itemCount += 1;

      if (!result.domainStats[domain].subdomains[subdomain]) {
        result.domainStats[domain].subdomains[subdomain] = [];
      }

      result.domainStats[domain].subdomains[subdomain].push(value);
    });

    DISORDERS.forEach((domain) => {
      const stat = result.domainStats[domain];
      const total = result.rawScores[domain];
      const itemCount = stat.itemCount || 1;

      stat.average = total / itemCount;

      const subdomainAverages = Object.values(stat.subdomains).map((values) => {
        if (!values.length) return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      });

      stat.strongestSubdomain = subdomainAverages.length
        ? Math.max(...subdomainAverages)
        : 0;

      stat.consistency =
        subdomainAverages.length > 1
          ? 1 - (Math.max(...subdomainAverages) - Math.min(...subdomainAverages)) / 3
          : 1;

      stat.weightedSignal =
        stat.average * 0.7 +
        stat.strongestSubdomain * 0.2 +
        stat.consistency * 0.1;
    });

    return result;
  }

  function detectRisks(triageResult) {
    const rawScores = triageResult && triageResult.rawScores ? triageResult.rawScores : {};
    const domainStats = triageResult && triageResult.domainStats ? triageResult.domainStats : {};

    const ranked = DISORDERS.map((domain) => {
      const stat = domainStats[domain] || {};
      const raw = Number(rawScores[domain] || 0);
      let weightedSignal = Number(stat.weightedSignal || 0);

      if (domain === "LEARNING" && rawScores.ADHD >= raw - 1) weightedSignal -= 0.08;
      if (domain === "DEPRESSION" && rawScores.ANXIETY >= raw - 1) weightedSignal -= 0.05;
      if (domain === "ANXIETY" && rawScores.DEPRESSION >= raw - 1) weightedSignal -= 0.03;

      return {
        domain,
        raw,
        average: Number(stat.average || 0),
        strongestSubdomain: Number(stat.strongestSubdomain || 0),
        consistency: Number(stat.consistency || 0),
        weightedSignal
      };
    });

    ranked.sort((a, b) => {
      if (b.weightedSignal !== a.weightedSignal) return b.weightedSignal - a.weightedSignal;
      return b.raw - a.raw;
    });

    return {
      primaryRisk: ranked[0] ? ranked[0].domain : "ADHD",
      primaryScore: ranked[0] ? ranked[0].weightedSignal : 0,
      secondaryRisk: ranked[1] ? ranked[1].domain : null,
      secondaryScore: ranked[1] ? ranked[1].weightedSignal : 0,
      rankedDomains: ranked
    };
  }

  function shouldAskExtra(primaryScore, secondaryScore) {
    const primary = Number(primaryScore || 0);
    const secondary = Number(secondaryScore || 0);

    if (!primary || !secondary) return false;

    return Math.abs(primary - secondary) <= 0.04;
  }

  function evaluateSpecificQuestions(questions, answers) {
    const result = {
      totalWeightedScore: 0,
      totalWeight: 0,
      normalizedAverage: 0,
      subdomains: {}
    };

    questions.forEach((q, i) => {
      const rawAnswer = answers[i];
      const reverse = !!q.reverse;
      const weight = Number(q.weight || 1);
      const subdomain = q.subdomain || "general";

      const normalized = normalizeAnswer(rawAnswer, reverse);
      const weighted = normalized * weight;

      if (!result.subdomains[subdomain]) {
        result.subdomains[subdomain] = {
          rawSum: 0,
          weightedSum: 0,
          totalWeight: 0,
          itemCount: 0,
          average: 0
        };
      }

      result.subdomains[subdomain].rawSum += normalized;
      result.subdomains[subdomain].weightedSum += weighted;
      result.subdomains[subdomain].totalWeight += weight;
      result.subdomains[subdomain].itemCount += 1;

      result.totalWeightedScore += weighted;
      result.totalWeight += weight;
    });

    Object.keys(result.subdomains).forEach((key) => {
      const s = result.subdomains[key];
      s.average = s.totalWeight > 0 ? s.weightedSum / s.totalWeight : 0;
    });

    result.normalizedAverage =
      result.totalWeight > 0 ? result.totalWeightedScore / result.totalWeight : 0;

    return result;
  }

  function buildSpecificProfile(kind, scoring) {
    if (!scoring) return null;

    const avg = scoring.normalizedAverage;
    let severity = "low";
    if (avg >= 2.2) severity = "high";
    else if (avg >= 1.4) severity = "moderate";
    else if (avg >= 0.8) severity = "mild";

    return {
      kind,
      severity,
      normalizedAverage: avg,
      subdomains: scoring.subdomains
    };
  }

  function getSignalLevel(score) {
    const value = Number(score || 0);

    if (value >= 2.2) {
      return { key: "high", hu: "magas jelz\u00e9sszint", en: "high signal level" };
    }

    if (value >= 1.4) {
      return { key: "moderate", hu: "k\u00f6zepes jelz\u00e9sszint", en: "moderate signal level" };
    }

    if (value >= 0.8) {
      return { key: "mild", hu: "enyhe jelz\u00e9sszint", en: "mild signal level" };
    }

    return { key: "low", hu: "alacsony jelz\u00e9sszint", en: "low signal level" };
  }

  function getTopSubdomains(scoring, limit = 3) {
    if (!scoring || !scoring.subdomains) return [];

    return Object.entries(scoring.subdomains)
      .map(([key, value]) => ({
        key,
        average: Number(value.average || 0),
        itemCount: Number(value.itemCount || 0)
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, limit);
  }

  const SUBDOMAIN_LABELS = {
    executive: { hu: "V\u00e9grehajt\u00f3 m\u0171k\u00f6d\u00e9s", en: "Executive functioning" },
    inattention: { hu: "Figyelmi szab\u00e1lyoz\u00e1s", en: "Attention regulation" },
    impulsivity: { hu: "Impulzuskontroll", en: "Impulse control" },
    hyperactivity: { hu: "Aktivit\u00e1sszab\u00e1lyoz\u00e1s", en: "Activity regulation" },
    emotional: { hu: "\u00c9rzelmi szab\u00e1lyoz\u00e1s", en: "Emotional regulation" },
    attention_regulation: { hu: "Figyelmi szab\u00e1lyoz\u00e1s", en: "Attention regulation" },
    impulse_control: { hu: "Impulzuskontroll", en: "Impulse control" },
    task_completion: { hu: "Feladatbefejez\u00e9s", en: "Task completion" },
    social_communication: { hu: "T\u00e1rsas kommunik\u00e1ci\u00f3", en: "Social communication" },
    social_reciprocity: { hu: "T\u00e1rsas k\u00f6lcs\u00f6n\u00f6ss\u00e9g", en: "Social reciprocity" },
    nonverbal_communication: { hu: "Nonverb\u00e1lis kommunik\u00e1ci\u00f3", en: "Nonverbal communication" },
    restricted_patterns: { hu: "Rugalmatlan mint\u00e1zatok", en: "Restricted or rigid patterns" },
    sensory_processing: { hu: "Szenzoros feldolgoz\u00e1s", en: "Sensory processing" },
    flexibility: { hu: "Rugalmass\u00e1g", en: "Flexibility" },
    pragmatic_language: { hu: "Pragmatikus nyelvhaszn\u00e1lat", en: "Pragmatic language" },
    general_worry: { hu: "\u00c1ltal\u00e1nos aggodalom", en: "General worry" },
    uncertainty_stress: { hu: "Bizonytalans\u00e1g miatti fesz\u00fclts\u00e9g", en: "Uncertainty stress" },
    physical_arousal: { hu: "Testi fesz\u00fclts\u00e9gjelek", en: "Physical arousal" },
    restlessness_tension: { hu: "Nyugtalans\u00e1g \u00e9s fesz\u00fclts\u00e9g", en: "Restlessness and tension" },
    avoidance: { hu: "Elker\u00fcl\u00e9s", en: "Avoidance" },
    avoidance_safety: { hu: "Elker\u00fcl\u00e9s \u00e9s biztons\u00e1gkeres\u00e9s", en: "Avoidance and safety seeking" },
    reassurance_control: { hu: "Megnyugtat\u00e1s ig\u00e9nye", en: "Reassurance seeking" },
    social_evaluative_anxiety: { hu: "T\u00e1rsas meg\u00edt\u00e9l\u00e9st\u0151l val\u00f3 szorong\u00e1s", en: "Social evaluative anxiety" },
    concentration_sleep: { hu: "Koncentr\u00e1ci\u00f3 \u00e9s alv\u00e1s", en: "Concentration and sleep" },
    low_mood: { hu: "Lehangolts\u00e1g", en: "Low mood" },
    interest_loss: { hu: "\u00c9rdekl\u0151d\u00e9s cs\u00f6kken\u00e9se", en: "Loss of interest" },
    anhedonia_interest_loss: { hu: "\u00d6r\u00f6m \u00e9s \u00e9rdekl\u0151d\u00e9s cs\u00f6kken\u00e9se", en: "Reduced enjoyment and interest" },
    energy_motivation: { hu: "Energia \u00e9s motiv\u00e1ci\u00f3", en: "Energy and motivation" },
    self_worth: { hu: "\u00d6n\u00e9rt\u00e9kel\u00e9s", en: "Self-worth" },
    self_worth_guilt: { hu: "\u00d6n\u00e9rt\u00e9kel\u00e9s \u00e9s b\u0171ntudat", en: "Self-worth and guilt" },
    hopelessness_future: { hu: "Rem\u00e9nytelens\u00e9g \u00e9s j\u00f6v\u0151k\u00e9p", en: "Hopelessness and future view" },
    withdrawal_isolation: { hu: "Visszah\u00faz\u00f3d\u00e1s", en: "Withdrawal" },
    sleep_change: { hu: "Alv\u00e1sv\u00e1ltoz\u00e1s", en: "Sleep changes" },
    appetite_body_change: { hu: "\u00c9tv\u00e1gy \u00e9s testi v\u00e1ltoz\u00e1sok", en: "Appetite and body changes" },
    academic_performance: { hu: "Tanul\u00e1si teljes\u00edtm\u00e9ny", en: "Academic performance" },
    instruction_understanding: { hu: "Utas\u00edt\u00e1sok meg\u00e9rt\u00e9se", en: "Instruction understanding" },
    reading: { hu: "Olvas\u00e1s", en: "Reading" },
    writing: { hu: "\u00cdr\u00e1s", en: "Writing" },
    math: { hu: "Matematika", en: "Math" },
    working_memory: { hu: "Munkamem\u00f3ria", en: "Working memory" },
    processing_speed: { hu: "Feldolgoz\u00e1si temp\u00f3", en: "Processing speed" },
    organization_time_management: { hu: "Szervez\u00e9s \u00e9s id\u0151kezel\u00e9s", en: "Organization and time management" },
    comprehension_language: { hu: "Meg\u00e9rt\u00e9s \u00e9s nyelv", en: "Comprehension and language" },
    learning_strategy: { hu: "Tanul\u00e1si strat\u00e9gia", en: "Learning strategy" },
    self_monitoring_error_awareness: { hu: "\u00d6nellen\u0151rz\u00e9s \u00e9s hibatudat", en: "Self-monitoring and error awareness" },
    general: { hu: "\u00c1ltal\u00e1nos mint\u00e1zat", en: "General pattern" }
  };

  function prettifySubdomainKey(key) {
    return String(key || "general")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (char) => char.toUpperCase());
  }

  function getSubdomainLabel(key, _kind = state.detectedRisk) {
    const labels = SUBDOMAIN_LABELS[key] || null;
    if (labels) return labels[state.lang] || labels.en || prettifySubdomainKey(key);
    return prettifySubdomainKey(key);
  }

  function buildResultSummary(kind, scoring, triageScores, secondaryRisk) {
    const avg = Number(scoring && scoring.normalizedAverage ? scoring.normalizedAverage : 0);
    const signal = getSignalLevel(avg);
    const topSubdomains = getTopSubdomains(scoring, 3);

    const domainCopy = {
      ADHD: {
        hu: "A v\u00e1laszok alapj\u00e1n a leger\u0151sebb mint\u00e1zat a figyelem, impulzivit\u00e1s, aktivit\u00e1sszab\u00e1lyoz\u00e1s vagy v\u00e9grehajt\u00f3 m\u0171k\u00f6d\u00e9s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
        en: "The strongest pattern appears to relate to attention, impulsivity, activity regulation, or executive functioning."
      },
      ASD: {
        hu: "A v\u00e1laszok alapj\u00e1n a leger\u0151sebb mint\u00e1zat a t\u00e1rsas kommunik\u00e1ci\u00f3, rugalmass\u00e1g, rutinok vagy szenzoros feldolgoz\u00e1s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
        en: "The strongest pattern appears to relate to social communication, flexibility, routines, or sensory processing."
      },
      ANXIETY: {
        hu: "A v\u00e1laszok alapj\u00e1n a leger\u0151sebb mint\u00e1zat az aggodalom, fesz\u00fclts\u00e9g, bizonytalans\u00e1g vagy elker\u00fcl\u00e9s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
        en: "The strongest pattern appears to relate to worry, tension, uncertainty, or avoidance."
      },
      DEPRESSION: {
        hu: "A v\u00e1laszok alapj\u00e1n a leger\u0151sebb mint\u00e1zat a hangulat, motiv\u00e1ci\u00f3, \u00e9rdekl\u0151d\u00e9s vagy \u00f6n\u00e9rt\u00e9kel\u00e9s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
        en: "The strongest pattern appears to relate to mood, motivation, interest, or self-view."
      },
      LEARNING: {
        hu: "A v\u00e1laszok alapj\u00e1n a leger\u0151sebb mint\u00e1zat tanul\u00e1si, teljes\u00edtm\u00e9nybeli, olvas\u00e1si, \u00edr\u00e1si, matematikai vagy feladatmeg\u00e9rt\u00e9si neh\u00e9zs\u00e9gekhez kapcsol\u00f3dik.",
        en: "The strongest pattern appears to relate to learning, performance, reading, writing, math, or task-understanding difficulties."
      }
    };

    return {
      kind,
      normalizedAverage: avg,
      signal,
      topSubdomains,
      secondaryRisk: secondaryRisk || null,
      triageScores: triageScores || {},
      summaryText: domainCopy[kind] || {
        hu: "A v\u00e1laszok alapj\u00e1n kirajzol\u00f3dik egy \u00e9rtelmezhet\u0151 mint\u00e1zat.",
        en: "The answers suggest a meaningful pattern."
      }
    };
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getAgeUiText() {
    const t = getUI();

    const fallback = {
      hu: {
        label: "Gyermek \u00e9letkora",
        placeholder: "pl. 7",
        missing: "K\u00e9rlek add meg a gyermek \u00e9letkor\u00e1t.",
        invalid: "A gyermek \u00e9letkora 1 \u00e9s 24 \u00e9v k\u00f6z\u00f6tt legyen."
      },
      en: {
        label: "Child age",
        placeholder: "e.g. 7",
        missing: "Please enter the child's age.",
        invalid: "Child age should be between 1 and 24 years."
      },
      de: {
        label: "Alter des Kindes",
        placeholder: "z. B. 7",
        missing: "Bitte gib das Alter des Kindes ein.",
        invalid: "Das Alter des Kindes sollte zwischen 1 und 24 Jahren liegen."
      },
      it: {
        label: "Et\u00e0 del bambino",
        placeholder: "es. 7",
        missing: "Inserisci l'et\u00e0 del bambino.",
        invalid: "L'et\u00e0 del bambino deve essere compresa tra 1 e 24 anni."
      },
      es: {
        label: "Edad del ni\u00f1o",
        placeholder: "p. ej. 7",
        missing: "Por favor, introduce la edad del ni\u00f1o.",
        invalid: "La edad del ni\u00f1o debe estar entre 1 y 24 a\u00f1os."
      },
      zh: {
        label: "\u513f\u7ae5\u5e74\u9f84",
        placeholder: "\u4f8b\u5982 7",
        missing: "\u8bf7\u8f93\u5165\u513f\u7ae5\u5e74\u9f84\u3002",
        invalid: "\u513f\u7ae5\u5e74\u9f84\u5e94\u5728 1 \u5230 24 \u5c81\u4e4b\u95f4\u3002"
      },
      ja: {
        label: "\u5b50\u3069\u3082\u306e\u5e74\u9f62",
        placeholder: "\u4f8b: 7",
        missing: "\u5b50\u3069\u3082\u306e\u5e74\u9f62\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
        invalid: "\u5b50\u3069\u3082\u306e\u5e74\u9f62\u306f1\u6b73\u304b\u308924\u6b73\u306e\u9593\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002"
      },
      ar: {
        label: "\u0639\u0645\u0631 \u0627\u0644\u0637\u0641\u0644",
        placeholder: "\u0645\u062b\u0627\u0644: 7",
        missing: "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0639\u0645\u0631 \u0627\u0644\u0637\u0641\u0644.",
        invalid: "\u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0639\u0645\u0631 \u0627\u0644\u0637\u0641\u0644 \u0628\u064a\u0646 1 \u064824 \u0633\u0646\u0629."
      },
      pl: {
        label: "Wiek dziecka",
        placeholder: "np. 7",
        missing: "Podaj wiek dziecka.",
        invalid: "Wiek dziecka powinien mie\u015bci\u0107 si\u0119 w zakresie od 1 do 24 lat."
      },
      pt: {
        label: "Idade da crian\u00e7a",
        placeholder: "ex. 7",
        missing: "Por favor, informe a idade da crian\u00e7a.",
        invalid: "A idade da crian\u00e7a deve estar entre 1 e 24 anos."
      },
      fr: {
        label: "\u00c2ge de l'enfant",
        placeholder: "ex. 7",
        missing: "Veuillez indiquer l'\u00e2ge de l'enfant.",
        invalid: "L'\u00e2ge de l'enfant doit \u00eatre compris entre 1 et 24 ans."
      }
    };
    const local = fallback[state.lang] || fallback.en;

    return {
      label: t.labelChildAge || local.label,
      placeholder: t.childAgePlaceholder || local.placeholder,
      missing: t.missingChildAge || local.missing,
      invalid: t.invalidChildAge || local.invalid
    };
  }

  function ensureChildAgeField() {
    const emailInput = document.getElementById("email");
    if (!emailInput || document.getElementById("childAge")) return;

    const ageText = getAgeUiText();
    const labelEmail = document.getElementById("labelEmail");
    const fieldWrapper = document.createElement("div");
    fieldWrapper.id = "childAgeField";
    fieldWrapper.style.marginTop = "14px";

    const label = document.createElement("label");
    label.id = "labelChildAge";
    label.htmlFor = "childAge";
    label.textContent = ageText.label;
    if (labelEmail && labelEmail.className) label.className = labelEmail.className;
    label.style.display = "block";
    label.style.marginBottom = "6px";

    const input = document.createElement("input");
    input.id = "childAge";
    input.name = "childAge";
    input.type = "number";
    input.min = "1";
    input.max = "24";
    input.step = "0.1";
    input.inputMode = "decimal";
    input.placeholder = ageText.placeholder;
    input.autocomplete = "off";
    if (emailInput.className) input.className = emailInput.className;
    input.style.width = "100%";

    fieldWrapper.appendChild(label);
    fieldWrapper.appendChild(input);

    emailInput.insertAdjacentElement("afterend", fieldWrapper);
  }

  function updateChildAgeFieldLanguage() {
    const ageText = getAgeUiText();
    const label = document.getElementById("labelChildAge");
    const input = document.getElementById("childAge");

    if (label) label.textContent = ageText.label;
    if (input) input.placeholder = ageText.placeholder;
  }

  function getChildAgeValue() {
    const input = document.getElementById("childAge");
    if (!input) return null;

    const normalized = String(input.value || "").trim().replace(",", ".");
    if (!normalized) return null;

    const age = Number(normalized);
    return Number.isFinite(age) ? age : null;
  }

  function validateChildAge() {
    const ageText = getAgeUiText();
    const age = getChildAgeValue();

    if (age === null) {
      return { ok: false, message: ageText.missing };
    }

    if (age < 1 || age > 24) {
      return { ok: false, message: ageText.invalid };
    }

    return { ok: true, age };
  }

  function ensureLanguageModal() {
    let modal = document.getElementById("languageModal");
    let buttons = document.getElementById("langButtons");

    if (modal && buttons) return modal;

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "languageModal";
      modal.style.display = "none";
      modal.innerHTML = `
        <div class="nm-language-card">
          <button type="button" class="nm-modal-close" aria-label="Close language selector">x</button>
          <h2 id="modalTitle">Choose language</h2>
          <p>Select your preferred language</p>
          <div id="langButtons"></div>
        </div>
      `;
      document.body.appendChild(modal);
    } else if (!buttons) {
      const card = modal.querySelector(".nm-language-card") || modal.firstElementChild || modal;
      buttons = document.createElement("div");
      buttons.id = "langButtons";
      card.appendChild(buttons);
    }

    modal.querySelectorAll(".nm-modal-close, [data-nm-close-language]").forEach((button) => {
      if (button.dataset.nmCloseBound === "1") return;
      button.dataset.nmCloseBound = "1";
      button.addEventListener("click", hideModal);
    });

    if (modal.dataset.nmBackdropBound !== "1") {
      modal.dataset.nmBackdropBound = "1";
      modal.addEventListener("click", (event) => {
        if (event.target === modal) hideModal();
      });
    }

    return modal;
  }

  function showModal() {
    const el = ensureLanguageModal();
    if (el) el.style.display = "flex";
  }

  function hideModal() {
    const el = document.getElementById("languageModal");
    if (el) el.style.display = "none";
  }

  function buildLangButtons() {
    ensureLanguageModal();

    const container = document.getElementById("langButtons");
    if (!container) return;
    if (container.children.length > 0) {
      syncLanguageButtonState();
      return;
    }

    const labels = {
      hu: "Magyar",
      en: "English",
      de: "Deutsch",
      it: "Italiano",
      es: "Espa\u00f1ol",
      zh: "\u4e2d\u6587",
      ja: "\u65e5\u672c\u8a9e",
      ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
      pl: "Polski",
      pt: "Portugu\u00eas",
      fr: "Fran\u00e7ais"
    };

    const supported = getConfig().SUPPORTED_LANGS || ["hu"];

    container.innerHTML = supported
      .map(
        (lang) => `
      <button data-nm-lang-option="${lang}" onclick="selectLang('${lang}')" style="display:block;width:100%;margin:8px 0;padding:10px;">
        ${labels[lang] || lang.toUpperCase()}
      </button>
    `
      )
      .join("");

    syncLanguageButtonState();
  }

  function syncLanguageButtonState() {
    const activeLang = getLang() || state.lang || "hu";

    document.querySelectorAll("#langButtons [data-nm-lang-option]").forEach((button) => {
      const isActive = button.getAttribute("data-nm-lang-option") === activeLang;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function bindLanguageSwitchers() {
    const selectors = [
      "#langSwitch",
      "#nmOpenLangBtn",
      "[data-nm-language-switch]",
      "[data-nm-open-language]",
      ".nm-language-switch",
      ".nm-lang-switch",
      ".nm-language-button",
      ".nm-lang-button"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((element) => {
      if (element.dataset.nmLanguageSwitchBound === "1") return;
      element.dataset.nmLanguageSwitchBound = "1";
      element.setAttribute("role", element.getAttribute("role") || "button");
      element.addEventListener("click", (event) => {
        event.preventDefault();
        showModal();
      });
    });

    if (document.documentElement.dataset.nmLanguageDelegationBound !== "1") {
      document.documentElement.dataset.nmLanguageDelegationBound = "1";
      document.addEventListener("click", (event) => {
        const trigger = event.target.closest(selectors.join(","));
        if (!trigger) return;
        event.preventDefault();
        showModal();
      });
    }

    if (document.documentElement.dataset.nmLanguageOptionSyncBound !== "1") {
      document.documentElement.dataset.nmLanguageOptionSyncBound = "1";
      document.addEventListener("click", (event) => {
        const option = event.target.closest("#languageModal button");
        if (!option) return;

        const explicitLang = option.getAttribute("data-nm-lang-option");
        const syncSelectedLanguage = () => {
          const activeLang = explicitLang || getLang() || state.lang || "hu";
          state.lang = activeLang;
          scheduleLandingTextRescue(activeLang);
        };

        window.setTimeout(syncSelectedLanguage, 0);
        window.setTimeout(syncSelectedLanguage, 120);
        window.setTimeout(syncSelectedLanguage, 500);
      });
    }
  }

  function responseOptionsHtml(selectedValue = "") {
    const labels = getUI().responseLabels || ["0", "1", "2", "3"];
    const safeValue =
      selectedValue === "" || selectedValue === null || selectedValue === undefined
        ? ""
        : String(selectedValue);

    return `
      <option value="" ${safeValue === "" ? "selected" : ""}>--</option>
      <option value="0" ${safeValue === "0" ? "selected" : ""}>${labels[0]}</option>
      <option value="1" ${safeValue === "1" ? "selected" : ""}>${labels[1]}</option>
      <option value="2" ${safeValue === "2" ? "selected" : ""}>${labels[2]}</option>
      <option value="3" ${safeValue === "3" ? "selected" : ""}>${labels[3]}</option>
    `;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderAnswerScale(index, selectedValue = "") {
    const labels = getUI().responseLabels || ["0", "1", "2", "3"];
    const safeValue =
      selectedValue === "" || selectedValue === null || selectedValue === undefined
        ? ""
        : String(selectedValue);

    const ariaLabel = state.lang === "hu" ? "V\u00e1lasz er\u0151ss\u00e9ge" : "Answer strength";

    return `
      <div class="nm-answer-scale" role="radiogroup" aria-label="${ariaLabel}">
        ${labels
          .map((label, value) => {
            const stringValue = String(value);
            const selected = safeValue === stringValue;
            return `
              <button
                type="button"
                class="nm-answer-btn ${selected ? "is-selected" : ""}"
                data-question-index="${index}"
                data-answer-value="${stringValue}"
                aria-pressed="${selected ? "true" : "false"}"
              >
                <span class="nm-answer-value">${stringValue}</span>
                <span class="nm-answer-label">${escapeHtml(label)}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function bindAnswerScaleButtons(root) {
    const scope = root || document;

    scope.querySelectorAll(".nm-answer-btn").forEach((button) => {
      if (button.dataset.nmAnswerBound === "1") return;
      button.dataset.nmAnswerBound = "1";

      button.addEventListener("click", () => {
        const card = button.closest(".nm-q-card");
        const index = button.getAttribute("data-question-index");
        const value = button.getAttribute("data-answer-value");
        const select = card && card.querySelector(`.nm-answer-select[data-question-index="${index}"]`);

        if (select) {
          select.value = value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (card) {
          card.classList.add("is-answered");
          card.querySelectorAll(".nm-answer-btn").forEach((item) => {
            const isSelected = item === button;
            item.classList.toggle("is-selected", isSelected);
            item.setAttribute("aria-pressed", isSelected ? "true" : "false");
          });

          const section = card.closest("#triageSection, #specificSection");
          if (section && section.id) updateQuestionProgress(section.id);
        }
      });
    });
  }

  function getQuestionText(question) {
    if (!question || !question.text) return "";
    const raw = question.text[state.lang] || question.text.en || question.text.hu || "";
    return normalizeQuestionText(raw, state.lang);
  }

  function buildTriageQuestions() {
    const bank = Array.isArray(window.NM_TRIAGE_BANK) ? window.NM_TRIAGE_BANK : [];
    return pickBalancedTriageQuestions(bank);
  }

  function buildSpecificQuestions(kind) {
    const bank = (window.NM_SPECIFIC_BANK || {})[kind] || [];
    return pickBalancedSpecificQuestions(bank, 30);
  }

  function applyLang(lang) {
    state.lang = lang;
    localStorage.setItem("nm_lang", lang);

    const t = getUI();

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    const mapText = [
      ["pageTitle", t.pageTitle],
      ["pageIntro", t.pageIntro],
      ["labelName", t.labelName],
      ["labelEmail", t.labelEmail],
      ["labelChildAge", t.labelChildAge || getAgeUiText().label],
      ["progressLabel", t.progressLabel || "Step"],
      ["backBtn", t.back],
      ["nextBtn", t.next],
      ["paymentBtn", t.pay]
    ];

    mapText.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && typeof value === "string") el.textContent = value;
    });

    const langSwitch = document.getElementById("langSwitch");
    if (langSwitch) langSwitch.textContent = lang.toUpperCase();

    buildLangButtons();
    syncLanguageButtonState();

    ensureChildAgeField();
    updateChildAgeFieldLanguage();

    renderCurrentStep();
  }

  function updateQuestionProgress(targetId) {
    const root = document.getElementById(targetId);
    if (!root) return;

    const selects = Array.from(root.querySelectorAll(".nm-answer-select"));
    const total = selects.length;
    const answered = selects.filter((select) => select.value !== "").length;
    const remaining = Math.max(0, total - answered);
    const isHu = state.lang === "hu";

    const countEl = root.querySelector("[data-nm-progress-count]");
    const labelEl = root.querySelector("[data-nm-progress-label]");
    const hintEl = root.querySelector("[data-nm-live-hint]");

    if (countEl) countEl.textContent = `${answered} / ${total}`;
    if (labelEl) labelEl.textContent = isHu ? "megv\u00e1laszolva" : "answered";

    if (hintEl) {
      hintEl.textContent = remaining
        ? isHu
          ? `${remaining} k\u00e9rd\u00e9s van h\u00e1tra. A k\u00f6vetkez\u0151 \u00fcres k\u00e9rd\u00e9st kiemelt\u00fck.`
          : `${remaining} questions left. The next unanswered question is highlighted.`
        : isHu
          ? "Minden k\u00e9rd\u00e9s megv\u00e1laszolva, mehetsz tov\u00e1bb."
          : "All questions are answered. You can continue.";
    }

    root.querySelectorAll(".nm-q-card.is-next").forEach((card) => card.classList.remove("is-next"));

    const nextSelect = selects.find((select) => select.value === "");
    const nextCard = nextSelect && nextSelect.closest(".nm-q-card");
    if (nextCard) nextCard.classList.add("is-next");
  }

  function renderQuestionList(targetId, questions, answers, title, intro) {
    const container = document.getElementById(targetId);
    if (!container) return;

    container.innerHTML = `
      <div>
        <div class="nm-step-title-card">
          <h3>${title || ""}</h3>
          <p>${intro || ""}</p>
        </div>

        <div class="nm-step-assist" data-nm-step-assist="${targetId}">
          <div class="nm-question-progress">
            <strong data-nm-progress-count>0 / ${questions.length}</strong>
            <span data-nm-progress-label>${state.lang === "hu" ? "megv\u00e1laszolva" : "answered"}</span>
          </div>
          <div class="nm-live-hint" data-nm-live-hint></div>
        </div>

        ${questions
          .map(
            (q, index) => `
          <div class="nm-q-card ${
            answers[index] === "" || answers[index] === null || answers[index] === undefined ? "" : "is-answered"
          }">
            <div class="nm-q-number">${index + 1}</div>
            <div class="nm-q-body">
              <div class="nm-q-text">${getQuestionText(q)}</div>
              <select data-question-index="${index}" class="nm-answer-select" aria-hidden="true" tabindex="-1">
                ${responseOptionsHtml(answers[index])}
              </select>
              ${renderAnswerScale(index, answers[index])}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    bindAnswerScaleButtons(container);
    updateQuestionProgress(targetId);
  }

  function syncAnswersFromDOM(scopeId = null) {
    const root = scopeId ? document.getElementById(scopeId) : document;
    if (!root) return { ok: false, values: [] };

    const selects = root.querySelectorAll(".nm-answer-select");
    const values = Array.from(selects).map((el) => {
      if (el.value === "") return null;
      return Number(el.value);
    });

    if (values.some((v) => v === null || Number.isNaN(v))) {
      return { ok: false, values: [] };
    }

    return { ok: true, values };
  }

  function getProgressStepLabels() {
    if (state.lang === "hu") return ["Els\u0151 sz\u0171r\u00e9s", "Pontos\u00edt\u00e1s", "\u00d6sszegz\u00e9s"];
    if (state.lang === "de") return ["Screening", "Vertiefung", "Zusammenfassung"];
    if (state.lang === "it") return ["Screening", "Dettagli", "Riepilogo"];
    if (state.lang === "es") return ["Cribado", "Detalle", "Resumen"];
    if (state.lang === "fr") return ["D\u00e9pistage", "D\u00e9tails", "R\u00e9sum\u00e9"];
    if (state.lang === "pt") return ["Triagem", "Detalhe", "Resumo"];
    if (state.lang === "pl") return ["Przesiew", "Doprecyzowanie", "Podsumowanie"];
    if (state.lang === "zh") return ["初筛", "细化", "总结"];
    if (state.lang === "ja") return ["初期確認", "詳細", "要約"];
    if (state.lang === "ar") return ["الفحص", "التفصيل", "الملخص"];
    return ["Screening", "Details", "Summary"];
  }

  function updateProgress() {
    const t = getUI();

    const map = {
      triage: { step: 1, title: t.triageTitle || "Step 1" },
      specific: { step: 2, title: t.specificTitle || "Step 2" },
      summary: { step: 3, title: t.summaryTitle || "Step 3" }
    };

    const currentData = map[state.step] || map.triage;
    const current = currentData.step;

    const textEl = document.getElementById("progressText");
    const barEl = document.getElementById("progressBar");
    const pageTitleEl = document.getElementById("pageTitle");

    if (textEl) textEl.textContent = `${current} / 3 - ${currentData.title}`;

    if (barEl) {
      barEl.style.width = `${current * 33.33}%`;
      barEl.style.transition = "width 0.35s ease";

      let stepsEl = document.getElementById("nmProgressSteps");
      if (!stepsEl && barEl.parentElement) {
        stepsEl = document.createElement("div");
        stepsEl.id = "nmProgressSteps";
        stepsEl.className = "nm-progress-steps";
        barEl.parentElement.insertAdjacentElement("afterend", stepsEl);
      }

      if (stepsEl) {
        const labels = getProgressStepLabels();
        stepsEl.innerHTML = labels
          .map(
            (label, index) => `
              <div class="nm-progress-step ${index + 1 === current ? "is-active" : ""}">
                <span class="nm-progress-step-index">${index + 1}</span>
                <span>${escapeHtml(label)}</span>
              </div>
            `
          )
          .join("");
      }
    }

    if (pageTitleEl) pageTitleEl.textContent = currentData.title;
  }

  function getCheckoutReviewLabels() {
    const labels = {
      hu: {
        title: "Fizetés előtti gyors ellenőrzés",
        nameEmail: "Név / email",
        childAge: "Gyermek életkora",
        focus: "Fő terület",
        questions: "Kitöltött kérdések",
        note: "A részletes riport ezekből az adatokból készül. Ha valamit javítanál, lépj vissza a fizetés előtt."
      },
      en: {
        title: "Quick review before payment",
        nameEmail: "Name / email",
        childAge: "Child age",
        focus: "Primary focus",
        questions: "Completed questions",
        note: "The detailed report will be generated from these answers. If something needs changing, go back before payment."
      },
      de: {
        title: "Kurzer Check vor der Zahlung",
        nameEmail: "Name / E-Mail",
        childAge: "Alter des Kindes",
        focus: "Hauptbereich",
        questions: "Beantwortete Fragen",
        note: "Der detaillierte Bericht wird aus diesen Angaben erstellt. Wenn du etwas ändern möchtest, gehe vor der Zahlung zurück."
      },
      it: {
        title: "Controllo rapido prima del pagamento",
        nameEmail: "Nome / email",
        childAge: "Età del bambino",
        focus: "Area principale",
        questions: "Domande completate",
        note: "Il report dettagliato sarà generato da queste risposte. Se vuoi correggere qualcosa, torna indietro prima del pagamento."
      },
      es: {
        title: "Revisión rápida antes del pago",
        nameEmail: "Nombre / email",
        childAge: "Edad del niño",
        focus: "Área principal",
        questions: "Preguntas completadas",
        note: "El informe detallado se generará a partir de estas respuestas. Si necesitas cambiar algo, vuelve atrás antes del pago."
      },
      zh: {
        title: "付款前快速确认",
        nameEmail: "姓名 / 邮箱",
        childAge: "儿童年龄",
        focus: "主要关注领域",
        questions: "已完成问题",
        note: "详细报告将根据这些回答生成。如需修改，请在付款前返回。"
      },
      ja: {
        title: "支払い前の簡単確認",
        nameEmail: "名前 / メール",
        childAge: "子どもの年齢",
        focus: "主な領域",
        questions: "回答済みの質問",
        note: "詳細レポートはこれらの回答をもとに作成されます。修正したい場合は、支払い前に戻ってください。"
      },
      ar: {
        title: "مراجعة سريعة قبل الدفع",
        nameEmail: "الاسم / البريد الإلكتروني",
        childAge: "عمر الطفل",
        focus: "المجال الرئيسي",
        questions: "الأسئلة المكتملة",
        note: "سيتم إنشاء التقرير التفصيلي من هذه الإجابات. إذا أردت تعديل شيء، فارجع قبل الدفع."
      },
      pl: {
        title: "Szybka kontrola przed płatnością",
        nameEmail: "Imię / email",
        childAge: "Wiek dziecka",
        focus: "Główny obszar",
        questions: "Ukończone pytania",
        note: "Szczegółowy raport zostanie wygenerowany na podstawie tych odpowiedzi. Jeśli chcesz coś zmienić, wróć przed płatnością."
      },
      pt: {
        title: "Revisão rápida antes do pagamento",
        nameEmail: "Nome / email",
        childAge: "Idade da criança",
        focus: "Área principal",
        questions: "Perguntas concluídas",
        note: "O relatório detalhado será gerado a partir destas respostas. Se precisar alterar algo, volte antes do pagamento."
      },
      fr: {
        title: "Vérification rapide avant paiement",
        nameEmail: "Nom / email",
        childAge: "Âge de l'enfant",
        focus: "Domaine principal",
        questions: "Questions complétées",
        note: "Le rapport détaillé sera généré à partir de ces réponses. Si quelque chose doit être modifié, revenez en arrière avant le paiement."
      }
    };

    return labels[state.lang] || labels.en;
  }

  function buildCheckoutReviewHtml(t) {
    const name = (document.getElementById("name")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const childAge = getChildAgeValue();
    const totalQuestions =
      state.triageQuestions.length + state.specificQuestions.length + state.extraQuestions.length;
    const labels = getCheckoutReviewLabels();

    return `
      <div class="nm-checkout-review" aria-label="${escapeHtml(labels.title)}">
        <h4>${escapeHtml(labels.title)}</h4>
        <div class="nm-review-grid">
          <div class="nm-review-item">
            <span class="nm-review-label">${escapeHtml(labels.nameEmail)}</span>
            <span class="nm-review-value">${escapeHtml(name || "-")}<br>${escapeHtml(email || "-")}</span>
          </div>
          <div class="nm-review-item">
            <span class="nm-review-label">${escapeHtml(labels.childAge)}</span>
            <span class="nm-review-value">${childAge == null ? "-" : escapeHtml(String(childAge))}</span>
          </div>
          <div class="nm-review-item">
            <span class="nm-review-label">${escapeHtml(labels.focus)}</span>
            <span class="nm-review-value">${escapeHtml(disorderLabel(state.detectedRisk))}</span>
          </div>
          <div class="nm-review-item">
            <span class="nm-review-label">${escapeHtml(labels.questions)}</span>
            <span class="nm-review-value">${totalQuestions}</span>
          </div>
        </div>
        <p class="nm-review-note">${escapeHtml(labels.note)}</p>
      </div>
    `;
  }

  function getSummaryConversionCopy() {
    const copies = {
      hu: {
        eyebrow: "A teljes riportban",
        title: "Nem csak pontszámokat kapsz, hanem értelmezhető mintázatot",
        lead:
          "A NeuroMap Kids a válaszaidat több terület mentén veti össze. A fizetés után készülő riport azt mutatja meg, hogy a mostani jelzések hogyan kapcsolódhatnak a gyermek mindennapi viselkedéséhez, tanulásához és érzelmi terheléséhez.",
        items: [
          {
            title: "Mintázatalapú értelmezés",
            text: "A riport a fő és másodlagos jelzéseket együtt kezeli, nem egyetlen kérdés vagy pontszám alapján következtet."
          },
          {
            title: "Életkorhoz igazodóbb nézőpont",
            text: "Segít elkülöníteni, mi lehet életkori sajátosság, és mi az, amit érdemes tudatosabban figyelni."
          },
          {
            title: "Szülőbarát következő lépések",
            text: "Otthon, óvodában vagy iskolában is használható, gyakorlatias irányokat kapsz."
          },
          {
            title: "PDF riport emailben",
            text: "A személyre szabott riport a fizetés után készül el, és emailben érkezik meg."
          }
        ],
        ctaTitle: "A részletes riport célja: tisztább képet adni, merre érdemes tovább figyelni.",
        ctaText: "Ez strukturált előszűrés, nem diagnózis. A hangsúly az érthető magyarázaton és a következő lépéseken van."
      },
      en: {
        eyebrow: "Inside the full report",
        title: "You get more than scores: you get an interpretable pattern",
        lead:
          "NeuroMap Kids compares the answers across several developmental and emotional domains. After payment, the report explains how the current signals may relate to everyday behavior, learning, and emotional load.",
        items: [
          {
            title: "Pattern-based interpretation",
            text: "The report considers primary and secondary signals together instead of relying on a single score."
          },
          {
            title: "Age-aware perspective",
            text: "It helps separate age-typical variation from patterns that may deserve closer attention."
          },
          {
            title: "Parent-friendly next steps",
            text: "You receive practical directions that can be used at home, preschool, or school."
          },
          {
            title: "PDF report by email",
            text: "The personalized report is generated after payment and delivered by email."
          }
        ],
        ctaTitle: "The detailed report is designed to make the next step clearer.",
        ctaText: "This is structured screening, not a diagnosis. The focus is clear explanation and practical guidance."
      },
      de: {
        eyebrow: "Im vollständigen Bericht",
        title: "Du erhältst mehr als Werte: ein verständliches Muster",
        lead:
          "NeuroMap Kids vergleicht die Antworten über mehrere entwicklungsbezogene und emotionale Bereiche hinweg. Nach der Zahlung erklärt der Bericht, wie die aktuellen Signale mit Verhalten, Lernen und emotionaler Belastung im Alltag zusammenhängen können.",
        items: [
          {
            title: "Musterbasierte Einordnung",
            text: "Der Bericht betrachtet Haupt- und Nebensignale gemeinsam, statt sich auf einen einzelnen Wert zu stützen."
          },
          {
            title: "Altersbewusste Perspektive",
            text: "Er hilft zu unterscheiden, was altersnah sein kann und welche Muster bewusster beobachtet werden sollten."
          },
          {
            title: "Elternfreundliche nächste Schritte",
            text: "Du erhältst praktische Hinweise für Zuhause, Kindergarten oder Schule."
          },
          {
            title: "PDF-Bericht per E-Mail",
            text: "Der personalisierte Bericht wird nach der Zahlung erstellt und per E-Mail zugestellt."
          }
        ],
        ctaTitle: "Der detaillierte Bericht soll den nächsten Schritt klarer machen.",
        ctaText: "Dies ist ein strukturiertes Screening, keine Diagnose. Im Fokus stehen klare Erklärung und praktische Orientierung."
      },
      it: {
        eyebrow: "Nel report completo",
        title: "Non ricevi solo punteggi, ma un modello interpretabile",
        lead:
          "NeuroMap Kids confronta le risposte in più aree dello sviluppo e del benessere emotivo. Dopo il pagamento, il report spiega come i segnali attuali possano collegarsi al comportamento quotidiano, all'apprendimento e al carico emotivo.",
        items: [
          {
            title: "Interpretazione basata sui pattern",
            text: "Il report considera insieme segnali principali e secondari, senza basarsi su un singolo punteggio."
          },
          {
            title: "Prospettiva legata all'età",
            text: "Aiuta a distinguere ciò che può essere tipico dell'età da ciò che merita maggiore attenzione."
          },
          {
            title: "Passi successivi per i genitori",
            text: "Ricevi indicazioni pratiche utilizzabili a casa, alla scuola dell'infanzia o a scuola."
          },
          {
            title: "Report PDF via email",
            text: "Il report personalizzato viene generato dopo il pagamento e inviato via email."
          }
        ],
        ctaTitle: "Il report dettagliato è pensato per rendere più chiaro il passo successivo.",
        ctaText: "È uno screening strutturato, non una diagnosi. Il focus è spiegazione chiara e orientamento pratico."
      },
      es: {
        eyebrow: "Dentro del informe completo",
        title: "No recibes solo puntuaciones: recibes un patrón interpretable",
        lead:
          "NeuroMap Kids compara las respuestas en varios dominios del desarrollo y emocionales. Después del pago, el informe explica cómo las señales actuales pueden relacionarse con la conducta diaria, el aprendizaje y la carga emocional.",
        items: [
          {
            title: "Interpretación basada en patrones",
            text: "El informe considera señales principales y secundarias juntas, no una sola pregunta o puntuación."
          },
          {
            title: "Perspectiva ajustada a la edad",
            text: "Ayuda a separar variaciones esperables por edad de patrones que conviene observar con más atención."
          },
          {
            title: "Próximos pasos para familias",
            text: "Recibes orientaciones prácticas para casa, preescolar o escuela."
          },
          {
            title: "Informe PDF por email",
            text: "El informe personalizado se genera después del pago y llega por email."
          }
        ],
        ctaTitle: "El informe detallado está diseñado para aclarar el siguiente paso.",
        ctaText: "Es un cribado estructurado, no un diagnóstico. El foco está en la explicación clara y la guía práctica."
      },
      zh: {
        eyebrow: "完整报告包含",
        title: "你获得的不只是分数，而是可理解的模式",
        lead:
          "NeuroMap Kids 会从多个发展和情绪领域比较回答。付款后生成的报告会解释这些信号可能如何关联孩子的日常行为、学习和情绪负荷。",
        items: [
          {
            title: "基于模式的解释",
            text: "报告会同时考虑主要和次要信号，而不是只依赖单一问题或分数。"
          },
          {
            title: "结合年龄的视角",
            text: "帮助区分哪些可能是年龄相关变化，哪些模式值得进一步关注。"
          },
          {
            title: "适合家长的下一步",
            text: "你会获得可在家庭、幼儿园或学校中使用的实用方向。"
          },
          {
            title: "PDF 报告通过邮件发送",
            text: "个性化报告会在付款后生成，并通过电子邮件发送。"
          }
        ],
        ctaTitle: "详细报告的目标是让下一步更清晰。",
        ctaText: "这是结构化筛查，不是诊断。重点是清楚解释和实用建议。"
      },
      ja: {
        eyebrow: "完全版レポートの内容",
        title: "スコアだけでなく、理解しやすいパターンを受け取れます",
        lead:
          "NeuroMap Kids は、複数の発達・情緒領域にわたって回答を比較します。支払い後に作成されるレポートでは、現在のサインが日常行動、学習、情緒的負荷とどのように関係しうるかを説明します。",
        items: [
          {
            title: "パターンに基づく解釈",
            text: "単一の質問や点数ではなく、主なサインと二次的なサインを合わせて見ます。"
          },
          {
            title: "年齢を踏まえた視点",
            text: "年齢相応の変化と、より注意深く見守るべきパターンを分けて考える助けになります。"
          },
          {
            title: "保護者向けの次のステップ",
            text: "家庭、園、学校で使いやすい実践的な方向性を受け取れます。"
          },
          {
            title: "PDFレポートをメールで送付",
            text: "個別化されたレポートは支払い後に作成され、メールで届きます。"
          }
        ],
        ctaTitle: "詳細レポートは、次に何を見るべきかを明確にするためのものです。",
        ctaText: "これは構造化スクリーニングであり、診断ではありません。明確な説明と実践的な案内に重点を置いています。"
      },
      ar: {
        eyebrow: "داخل التقرير الكامل",
        title: "لا تحصل على درجات فقط، بل على نمط يمكن فهمه",
        lead:
          "يقارن NeuroMap Kids الإجابات عبر عدة مجالات نمائية وعاطفية. بعد الدفع، يوضح التقرير كيف قد ترتبط الإشارات الحالية بالسلوك اليومي والتعلم والضغط العاطفي لدى الطفل.",
        items: [
          {
            title: "تفسير قائم على الأنماط",
            text: "ينظر التقرير إلى الإشارات الرئيسية والثانوية معًا، ولا يعتمد على سؤال أو درجة واحدة فقط."
          },
          {
            title: "منظور يراعي العمر",
            text: "يساعد على التمييز بين ما قد يكون مناسبًا للعمر وما يستحق متابعة أكثر وعيًا."
          },
          {
            title: "خطوات تالية مناسبة للوالدين",
            text: "تحصل على اتجاهات عملية يمكن استخدامها في المنزل أو الروضة أو المدرسة."
          },
          {
            title: "تقرير PDF عبر البريد الإلكتروني",
            text: "يتم إنشاء التقرير الشخصي بعد الدفع وإرساله عبر البريد الإلكتروني."
          }
        ],
        ctaTitle: "هدف التقرير التفصيلي هو جعل الخطوة التالية أوضح.",
        ctaText: "هذا فحص منظم وليس تشخيصًا. التركيز على الشرح الواضح والإرشاد العملي."
      },
      pl: {
        eyebrow: "W pełnym raporcie",
        title: "Otrzymujesz nie tylko wyniki, ale zrozumiały wzorzec",
        lead:
          "NeuroMap Kids porównuje odpowiedzi w kilku obszarach rozwojowych i emocjonalnych. Po płatności raport wyjaśnia, jak obecne sygnały mogą wiązać się z codziennym zachowaniem, uczeniem się i obciążeniem emocjonalnym dziecka.",
        items: [
          {
            title: "Interpretacja oparta na wzorcach",
            text: "Raport analizuje sygnały główne i wtórne razem, zamiast opierać się na jednym pytaniu lub wyniku."
          },
          {
            title: "Perspektywa uwzględniająca wiek",
            text: "Pomaga odróżnić zmienność typową dla wieku od wzorców, które warto uważniej obserwować."
          },
          {
            title: "Kolejne kroki dla rodziców",
            text: "Otrzymujesz praktyczne wskazówki do wykorzystania w domu, przedszkolu lub szkole."
          },
          {
            title: "Raport PDF emailem",
            text: "Spersonalizowany raport powstaje po płatności i zostaje wysłany emailem."
          }
        ],
        ctaTitle: "Szczegółowy raport ma pomóc jaśniej zobaczyć następny krok.",
        ctaText: "To uporządkowany screening, nie diagnoza. Najważniejsze są jasne wyjaśnienie i praktyczne wskazówki."
      },
      pt: {
        eyebrow: "No relatório completo",
        title: "Você recebe mais do que pontuações: recebe um padrão interpretável",
        lead:
          "O NeuroMap Kids compara as respostas em vários domínios do desenvolvimento e emocionais. Após o pagamento, o relatório explica como os sinais atuais podem se relacionar ao comportamento diário, à aprendizagem e à carga emocional.",
        items: [
          {
            title: "Interpretação baseada em padrões",
            text: "O relatório considera sinais principais e secundários juntos, em vez de depender de uma única pontuação."
          },
          {
            title: "Perspectiva atenta à idade",
            text: "Ajuda a separar variações típicas da idade de padrões que merecem observação mais cuidadosa."
          },
          {
            title: "Próximos passos para pais",
            text: "Você recebe orientações práticas para casa, pré-escola ou escola."
          },
          {
            title: "Relatório PDF por email",
            text: "O relatório personalizado é gerado após o pagamento e enviado por email."
          }
        ],
        ctaTitle: "O relatório detalhado foi pensado para tornar o próximo passo mais claro.",
        ctaText: "É uma triagem estruturada, não um diagnóstico. O foco é explicação clara e orientação prática."
      },
      fr: {
        eyebrow: "Dans le rapport complet",
        title: "Vous recevez plus que des scores : un schéma interprétable",
        lead:
          "NeuroMap Kids compare les réponses dans plusieurs domaines développementaux et émotionnels. Après le paiement, le rapport explique comment les signaux actuels peuvent être liés au comportement quotidien, aux apprentissages et à la charge émotionnelle.",
        items: [
          {
            title: "Interprétation fondée sur les schémas",
            text: "Le rapport considère les signaux principaux et secondaires ensemble, sans s'appuyer sur un seul score."
          },
          {
            title: "Perspective adaptée à l'âge",
            text: "Il aide à distinguer les variations liées à l'âge des schémas qui méritent une attention plus consciente."
          },
          {
            title: "Prochaines étapes pour les parents",
            text: "Vous recevez des pistes pratiques utilisables à la maison, en maternelle ou à l'école."
          },
          {
            title: "Rapport PDF par email",
            text: "Le rapport personnalisé est généré après le paiement et envoyé par email."
          }
        ],
        ctaTitle: "Le rapport détaillé vise à rendre la prochaine étape plus claire.",
        ctaText: "Il s'agit d'un dépistage structuré, pas d'un diagnostic. L'objectif est une explication claire et des repères pratiques."
      }
    };

    return copies[state.lang] || copies.en;
  }

  function getSummaryWarningText() {
    const warnings = {
      hu:
        "Ez nem diagnózis, hanem strukturált előszűrési összegzés. A részletes, szülőbarát riport és PDF a fizetés után készül el.",
      en:
        "This is not a diagnosis. It is a structured screening summary. The detailed parent-friendly report and PDF are generated after payment.",
      de:
        "Dies ist keine Diagnose, sondern eine strukturierte Screening-Zusammenfassung. Der detaillierte elternfreundliche Bericht und das PDF werden nach der Zahlung erstellt.",
      it:
        "Questa non è una diagnosi, ma una sintesi di screening strutturata. Il report dettagliato e il PDF per i genitori vengono generati dopo il pagamento.",
      es:
        "Esto no es un diagnóstico, sino un resumen de cribado estructurado. El informe detallado y el PDF para familias se generan después del pago.",
      zh:
        "这不是诊断，而是结构化筛查总结。详细的家长友好报告和 PDF 会在付款后生成。",
      ja:
        "これは診断ではなく、構造化されたスクリーニング要約です。保護者向けの詳細レポートとPDFは支払い後に作成されます。",
      ar:
        "هذا ليس تشخيصًا، بل ملخص فحص منظم. يتم إنشاء التقرير التفصيلي المناسب للوالدين وملف PDF بعد الدفع.",
      pl:
        "To nie jest diagnoza, lecz uporządkowane podsumowanie przesiewowe. Szczegółowy raport przyjazny rodzicom i PDF są generowane po płatności.",
      pt:
        "Isto não é um diagnóstico, mas um resumo de triagem estruturado. O relatório detalhado para pais e o PDF são gerados após o pagamento.",
      fr:
        "Ce n'est pas un diagnostic, mais un résumé de dépistage structuré. Le rapport détaillé adapté aux parents et le PDF sont générés après le paiement."
    };

    return warnings[state.lang] || warnings.en;
  }

  function buildSummaryConversionHtml() {
    const copy = getSummaryConversionCopy();

    return `
      <div class="nm-report-teaser-card">
        <span class="nm-report-teaser-eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h4>${escapeHtml(copy.title)}</h4>
        <p class="nm-report-teaser-lead">${escapeHtml(copy.lead)}</p>
        <div class="nm-report-teaser-grid">
          ${copy.items
            .map(
              (item) => `
                <div class="nm-report-teaser-item">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.text)}</span>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="nm-summary-cta-strip">
          <div>
            <strong>${escapeHtml(copy.ctaTitle)}</strong>
            <span>${escapeHtml(copy.ctaText)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function getPrePaymentTrustCopy() {
    const copies = {
      hu: {
        title: "Miért érdemes most elkészíteni a teljes riportot?",
        items: [
          {
            title: "A válaszaidból már látszik egy minta",
            text: "A teljes riport ezt bontja ki érthető, szülőként is használható magyarázattá."
          },
          {
            title: "Nem csak címkét kapsz",
            text: "A rendszer fő és másodlagos jelzéseket, korosztályt és válaszmintázatokat együtt néz."
          },
          {
            title: "Kis lépésekre fordítva",
            text: "A cél az, hogy tudd, mit figyelj meg otthon, óvodában vagy iskolai helyzetekben."
          }
        ],
        note: "A fizetés egyszeri, nincs előfizetés. A PDF riport emailben érkezik."
      },
      en: {
        title: "Why generate the full report now?",
        items: [
          {
            title: "A pattern is already visible",
            text: "The full report turns it into a clear, parent-friendly explanation."
          },
          {
            title: "More than a label",
            text: "It considers primary and secondary signals, age context, and response patterns together."
          },
          {
            title: "Translated into next steps",
            text: "The goal is to help you know what to observe at home, preschool, or school."
          }
        ],
        note: "One-time payment, no subscription. The PDF report arrives by email."
      },
      de: {
        title: "Warum den vollstandigen Bericht jetzt erstellen?",
        items: [
          { title: "Ein Muster ist sichtbar", text: "Der Bericht macht daraus eine klare Erklarung fur Eltern." },
          { title: "Mehr als ein Etikett", text: "Er betrachtet Haupt- und Nebensignale zusammen mit dem Alterskontext." },
          { title: "Konkretere nachste Schritte", text: "Du siehst, worauf du im Alltag bewusster achten kannst." }
        ],
        note: "Einmalige Zahlung, kein Abo. Der PDF-Bericht kommt per E-Mail."
      },
      it: {
        title: "Perche generare ora il report completo?",
        items: [
          { title: "Un pattern e gia visibile", text: "Il report lo trasforma in una spiegazione chiara per genitori." },
          { title: "Piu di un'etichetta", text: "Considera segnali principali, secondari, eta e risposte insieme." },
          { title: "Passi pratici", text: "Aiuta a capire cosa osservare a casa o a scuola." }
        ],
        note: "Pagamento unico, nessun abbonamento. Il PDF arriva via email."
      },
      es: {
        title: "Por que generar ahora el informe completo?",
        items: [
          { title: "Ya se ve un patron", text: "El informe lo convierte en una explicacion clara para familias." },
          { title: "Mas que una etiqueta", text: "Considera senales principales, secundarias, edad y respuestas juntas." },
          { title: "Pasos concretos", text: "Ayuda a saber que observar en casa o en la escuela." }
        ],
        note: "Pago unico, sin suscripcion. El PDF llega por email."
      },
      pl: {
        title: "Dlaczego warto wygenerowac pelny raport teraz?",
        items: [
          { title: "Wzorzec jest juz widoczny", text: "Raport zamienia go w jasne wyjasnienie dla rodzicow." },
          { title: "Wiecej niz etykieta", text: "Laczy sygnaly glowne, poboczne, wiek i odpowiedzi." },
          { title: "Praktyczne kolejne kroki", text: "Pomaga wiedziec, co obserwowac w domu lub szkole." }
        ],
        note: "Platnosc jednorazowa, bez abonamentu. PDF przychodzi emailem."
      },
      pt: {
        title: "Por que gerar o relatorio completo agora?",
        items: [
          { title: "Um padrao ja aparece", text: "O relatorio transforma isso em uma explicacao clara para pais." },
          { title: "Mais que um rotulo", text: "Considera sinais principais, secundarios, idade e respostas juntos." },
          { title: "Proximos passos praticos", text: "Ajuda a saber o que observar em casa ou na escola." }
        ],
        note: "Pagamento unico, sem assinatura. O PDF chega por email."
      },
      fr: {
        title: "Pourquoi generer le rapport complet maintenant ?",
        items: [
          { title: "Un schema est deja visible", text: "Le rapport le transforme en explication claire pour les parents." },
          { title: "Plus qu'une etiquette", text: "Il relie signaux principaux, secondaires, age et reponses." },
          { title: "Des prochaines etapes", text: "Il aide a savoir quoi observer a la maison ou a l'ecole." }
        ],
        note: "Paiement unique, sans abonnement. Le PDF arrive par email."
      }
    };

    return copies[state.lang] || copies.en;
  }

  function buildPrePaymentTrustHtml() {
    const copy = getPrePaymentTrustCopy();

    return `
      <div class="nm-prepayment-trust-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <div class="nm-trust-grid">
          ${copy.items
            .map(
              (item) => `
                <div class="nm-trust-item">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.text)}</span>
                </div>
              `
            )
            .join("")}
        </div>
        <span class="nm-prepayment-trust-note">${escapeHtml(copy.note)}</span>
      </div>
    `;
  }

  function getSummaryNextStepCopy() {
    const copies = {
      hu: {
        title: "Mit tisztaz a teljes riport?",
        lead: "Az előszűrés már mutat egy irányt. A teljes riport abban segít, hogy a jelzés ne csak egy szám vagy címke legyen, hanem érthető, korosztályhoz illesztett mintázat.",
        items: [
          {
            title: "Mi állhat a válaszok mögött?",
            text: "A fő és másodlagos jelzéseket együtt értelmezi, hogy kevesebb legyen a félreértés."
          },
          {
            title: "Mennyire következetes a minta?",
            text: "A válaszok erősségét, átfedését és bizonytalanságát is figyelembe veszi."
          },
          {
            title: "Mit érdemes kipróbálni először?",
            text: "A javaslatok szülőként is használható, kicsi lépésekre vannak bontva."
          }
        ]
      },
      en: {
        title: "What does the full report clarify?",
        lead: "The screening already shows a direction. The full report turns it into an understandable, age-aware pattern instead of just a score or label.",
        items: [
          {
            title: "What may be behind the answers?",
            text: "It interprets primary and secondary signals together to reduce misunderstandings."
          },
          {
            title: "How consistent is the pattern?",
            text: "It considers signal strength, overlap, and uncertainty in the response profile."
          },
          {
            title: "What is worth trying first?",
            text: "Suggestions are translated into small parent-friendly next steps."
          }
        ]
      },
      de: {
        title: "Was klärt der vollständige Bericht?",
        lead: "Das Screening zeigt bereits eine Richtung. Der vollständige Bericht macht daraus ein verständliches, altersbezogenes Muster.",
        items: [
          { title: "Was kann hinter den Antworten stehen?", text: "Haupt- und Nebensignale werden gemeinsam betrachtet." },
          { title: "Wie stabil ist das Muster?", text: "Signalstärke, Überschneidung und Unsicherheit werden berücksichtigt." },
          { title: "Was zuerst ausprobieren?", text: "Die Empfehlungen werden in kleine, elternfreundliche Schritte übersetzt." }
        ]
      },
      it: {
        title: "Cosa chiarisce il report completo?",
        lead: "Lo screening mostra già una direzione. Il report completo la trasforma in un modello comprensibile e adatto all'età.",
        items: [
          { title: "Cosa può esserci dietro le risposte?", text: "Interpreta insieme segnali principali e secondari." },
          { title: "Quanto è coerente il modello?", text: "Considera intensità, sovrapposizioni e incertezza." },
          { title: "Cosa provare per primo?", text: "Le indicazioni sono tradotte in piccoli passi per i genitori." }
        ]
      },
      es: {
        title: "¿Qué aclara el informe completo?",
        lead: "El cribado ya muestra una dirección. El informe completo la convierte en un patrón comprensible y ajustado a la edad.",
        items: [
          { title: "¿Qué puede haber detrás?", text: "Interpreta señales principales y secundarias juntas." },
          { title: "¿Qué tan consistente es?", text: "Tiene en cuenta intensidad, solapamiento e incertidumbre." },
          { title: "¿Qué probar primero?", text: "Las sugerencias se traducen en pasos pequeños para familias." }
        ]
      },
      fr: {
        title: "Que clarifie le rapport complet ?",
        lead: "Le dépistage montre déjà une direction. Le rapport complet la transforme en profil compréhensible et adapté à l'âge.",
        items: [
          { title: "Que peut-il y avoir derrière ?", text: "Il relie les signaux principaux et secondaires." },
          { title: "Le profil est-il cohérent ?", text: "Il tient compte de l'intensité, du recoupement et de l'incertitude." },
          { title: "Que tenter d'abord ?", text: "Les conseils sont formulés en petites étapes pour les parents." }
        ]
      },
      pt: {
        title: "O que o relatório completo esclarece?",
        lead: "A triagem já mostra uma direção. O relatório transforma isso em um padrão compreensível e adequado à idade.",
        items: [
          { title: "O que pode estar por trás?", text: "Interpreta sinais principais e secundários em conjunto." },
          { title: "O padrão é consistente?", text: "Considera força do sinal, sobreposição e incerteza." },
          { title: "O que tentar primeiro?", text: "As sugestões viram pequenos passos para os pais." }
        ]
      },
      pl: {
        title: "Co wyjaśnia pełny raport?",
        lead: "Badanie przesiewowe pokazuje już kierunek. Raport zamienia go w zrozumiały wzorzec dopasowany do wieku.",
        items: [
          { title: "Co może stać za odpowiedziami?", text: "Łączy sygnały główne i poboczne." },
          { title: "Jak spójny jest wzorzec?", text: "Uwzględnia siłę sygnału, nakładanie się i niepewność." },
          { title: "Co spróbować najpierw?", text: "Wskazówki są rozpisane na małe kroki dla rodziców." }
        ]
      },
      zh: {
        title: "完整报告会进一步说明什么？",
        lead: "初筛已经显示方向。完整报告会把它转化为更清晰、符合年龄背景的模式。",
        items: [
          { title: "答案背后可能是什么？", text: "同时解释主要信号和次要信号。" },
          { title: "这个模式有多稳定？", text: "考虑信号强度、重叠和不确定性。" },
          { title: "可以先尝试什么？", text: "建议会转化为家长容易执行的小步骤。" }
        ]
      },
      ja: {
        title: "完全版レポートで何が分かりますか？",
        lead: "スクリーニングは方向性を示します。完全版では年齢背景に合わせて分かりやすく整理します。",
        items: [
          { title: "回答の背景", text: "主なサインと二次的なサインを合わせて解釈します。" },
          { title: "一貫性", text: "強さ、重なり、不確実性も確認します。" },
          { title: "最初の一歩", text: "保護者が使いやすい小さな行動に落とし込みます。" }
        ]
      },
      ar: {
        title: "ما الذي يوضحه التقرير الكامل؟",
        lead: "يعطي الفحص الأولي اتجاها عاما. يحوله التقرير الكامل إلى نمط أوضح ومناسب لعمر الطفل.",
        items: [
          { title: "ما وراء الإجابات؟", text: "يفسر الإشارات الأساسية والثانوية معا." },
          { title: "مدى ثبات النمط", text: "يراعي قوة الإشارة والتداخل ودرجة عدم اليقين." },
          { title: "الخطوة الأولى", text: "يحول النتائج إلى خطوات صغيرة مفهومة للوالدين." }
        ]
      }
    };

    return copies[state.lang] || copies.en;
  }

  function buildSummaryNextStepHtml() {
    const copy = getSummaryNextStepCopy();

    return `
      <div class="nm-summary-next-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <p>${escapeHtml(copy.lead)}</p>
        <div class="nm-summary-next-grid">
          ${copy.items
            .map(
              (item, index) => `
                <div class="nm-summary-next-item">
                  <strong>${String(index + 1).padStart(2, "0")}</strong>
                  ${escapeHtml(item.title)}
                  <span style="display:block;margin-top:6px;color:#52677e;font-size:12px;font-weight:650;line-height:1.45;">${escapeHtml(item.text)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function getSummaryScienceCopy() {
    const copies = {
      hu: {
        title: "Miért ad többet a teljes elemzés?",
        lead: "A rövid összegzés csak a legerősebb mintát mutatja. A teljes riport több válaszréteget néz együtt, ezért árnyaltabb és gyakorlatibb képet ad.",
        items: [
          { title: "Mintázat, nem címke", text: "A rendszer nem diagnózist ad, hanem viselkedési és érzelmi jelzéseket rendez." },
          { title: "Életkori kontextus", text: "Más számít óvodás, kisiskolás vagy idősebb gyermek esetén." },
          { title: "Átfedések kezelése", text: "A hasonló tünetkörök közötti bizonytalanságot is jelzi." },
          { title: "Szülőbarát következő lépés", text: "A riport megfigyelési és támogatási irányokat ad." }
        ]
      },
      en: {
        title: "Why does the full analysis add value?",
        lead: "The short summary only shows the strongest pattern. The full report compares more layers of answers, making the result more nuanced and practical.",
        items: [
          { title: "Pattern, not label", text: "It organizes behavioral and emotional signals without making a diagnosis." },
          { title: "Age context", text: "Preschool, early school age, and older children need different interpretation." },
          { title: "Overlap handling", text: "It highlights uncertainty between similar symptom areas." },
          { title: "Parent-friendly next step", text: "The report gives observation and support directions." }
        ]
      },
      de: {
        title: "Warum bringt die vollstaendige Analyse mehr?",
        lead: "Die kurze Zusammenfassung zeigt nur das staerkste Muster. Der vollstaendige Bericht vergleicht mehrere Antwort-Ebenen und wird dadurch nuancierter und praktischer.",
        items: [
          { title: "Muster statt Etikett", text: "Er ordnet Verhaltens- und emotionale Signale, ohne eine Diagnose zu stellen." },
          { title: "Alterskontext", text: "Vorschulalter, fruehes Schulalter und aeltere Kinder brauchen unterschiedliche Einordnung." },
          { title: "Ueberschneidungen", text: "Aehnliche Signalbereiche und Unsicherheiten werden sichtbar gemacht." },
          { title: "Naechster Schritt", text: "Der Bericht gibt beobachtbare und alltagsnahe Unterstuetzungsrichtungen." }
        ]
      },
      it: {
        title: "Perche l'analisi completa aggiunge valore?",
        lead: "Il riepilogo breve mostra solo il pattern piu forte. Il report completo confronta piu livelli di risposta, rendendo il risultato piu sfumato e pratico.",
        items: [
          { title: "Pattern, non etichetta", text: "Organizza segnali comportamentali ed emotivi senza formulare una diagnosi." },
          { title: "Contesto d'eta", text: "Eta prescolare, primi anni di scuola e bambini piu grandi richiedono letture diverse." },
          { title: "Gestione delle sovrapposizioni", text: "Evidenzia l'incertezza tra aree sintomatiche simili." },
          { title: "Passo successivo", text: "Il report offre direzioni di osservazione e supporto per i genitori." }
        ]
      },
      es: {
        title: "Por que aporta mas valor el analisis completo?",
        lead: "El resumen breve solo muestra el patron mas fuerte. El informe completo compara mas capas de respuestas, por eso ofrece un resultado mas matizado y practico.",
        items: [
          { title: "Patron, no etiqueta", text: "Organiza senales conductuales y emocionales sin emitir un diagnostico." },
          { title: "Contexto de edad", text: "La edad preescolar, la etapa escolar inicial y los ninos mayores requieren interpretaciones distintas." },
          { title: "Solapamientos", text: "Muestra la incertidumbre entre areas de senales parecidas." },
          { title: "Siguiente paso", text: "El informe ofrece orientaciones de observacion y apoyo para familias." }
        ]
      },
      fr: {
        title: "Pourquoi l'analyse complete apporte-t-elle plus?",
        lead: "Le resume court montre seulement le schema le plus fort. Le rapport complet compare davantage de couches de reponses, ce qui rend le resultat plus nuance et pratique.",
        items: [
          { title: "Schema, pas etiquette", text: "Il organise les signaux comportementaux et emotionnels sans poser de diagnostic." },
          { title: "Contexte d'age", text: "L'interpretation differe entre prescolaire, debut de scolarite et enfants plus ages." },
          { title: "Chevauchements", text: "Il met en evidence l'incertitude entre des domaines de signes similaires." },
          { title: "Prochaine etape", text: "Le rapport propose des pistes d'observation et de soutien pour les parents." }
        ]
      },
      pt: {
        title: "Por que a analise completa acrescenta valor?",
        lead: "O resumo curto mostra apenas o padrao mais forte. O relatorio completo compara mais camadas de respostas, tornando o resultado mais nuancado e pratico.",
        items: [
          { title: "Padrao, nao rotulo", text: "Organiza sinais comportamentais e emocionais sem fazer diagnostico." },
          { title: "Contexto de idade", text: "Pre-escola, inicio da vida escolar e criancas mais velhas precisam de leituras diferentes." },
          { title: "Sobreposicoes", text: "Mostra incertezas entre areas de sinais semelhantes." },
          { title: "Proximo passo", text: "O relatorio oferece direcoes de observacao e apoio para os pais." }
        ]
      },
      pl: {
        title: "Dlaczego pelna analiza daje wiecej?",
        lead: "Krotkie podsumowanie pokazuje tylko najsilniejszy wzorzec. Pelny raport porownuje wiecej warstw odpowiedzi, dlatego jest bardziej praktyczny i dokladniejszy.",
        items: [
          { title: "Wzorzec, nie etykieta", text: "Porzadkuje sygnaly zachowania i emocji bez stawiania diagnozy." },
          { title: "Kontekst wieku", text: "Przedszkolak, mlodszy uczen i starsze dziecko wymagaja innej interpretacji." },
          { title: "Nakladanie sie obszarow", text: "Pokazuje niepewnosc miedzy podobnymi obszarami sygnalow." },
          { title: "Kolejny krok", text: "Raport daje rodzicom kierunki obserwacji i wsparcia." }
        ]
      },
      zh: {
        title: "完整分析为什么更有价值？",
        lead: "简短总结只显示最强的模式。完整报告会比较更多回答层次，因此结果更细致，也更实用。",
        items: [
          { title: "模式，而不是标签", text: "它整理行为和情绪信号，但不作诊断。" },
          { title: "年龄背景", text: "学龄前、低年级和较大儿童需要不同的解释方式。" },
          { title: "重叠信号", text: "它会提示相似领域之间的不确定性。" },
          { title: "家长可用的下一步", text: "报告提供观察和支持方向。" }
        ]
      },
      ja: {
        title: "完全な分析にはどんな価値がありますか？",
        lead: "短い要約は最も強い傾向だけを示します。完全版レポートは複数の回答層を比較するため、より実用的で細やかな結果になります。",
        items: [
          { title: "ラベルではなくパターン", text: "診断ではなく、行動面と感情面のサインを整理します。" },
          { title: "年齢の文脈", text: "未就学、低学年、年長の子どもでは解釈が異なります。" },
          { title: "重なりの扱い", text: "似たサイン領域の不確実性も示します。" },
          { title: "保護者向けの次の一歩", text: "観察と支援の方向性をわかりやすく示します。" }
        ]
      },
      ar: {
        title: "لماذا يضيف التحليل الكامل قيمة أكبر؟",
        lead: "يعرض الملخص القصير النمط الأقوى فقط. أما التقرير الكامل فيقارن طبقات أكثر من الإجابات، لذلك يكون أوضح وأكثر فائدة للوالدين.",
        items: [
          { title: "نمط وليس تسمية", text: "ينظم الإشارات السلوكية والعاطفية من دون تقديم تشخيص." },
          { title: "سياق العمر", text: "تختلف القراءة بين مرحلة ما قبل المدرسة والسن المدرسي المبكر والأطفال الأكبر سنا." },
          { title: "التداخل بين الإشارات", text: "يوضح مناطق عدم اليقين بين المجالات المتشابهة." },
          { title: "خطوة تالية للوالدين", text: "يعطي التقرير اتجاهات للملاحظة والدعم اليومي." }
        ]
      }
    };

    return copies[state.lang] || copies.en;
  }

  function buildSummaryScienceHtml() {
    const copy = getSummaryScienceCopy();

    return `
      <div class="nm-summary-science-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <p>${escapeHtml(copy.lead)}</p>
        <div class="nm-summary-science-grid">
          ${copy.items
            .map(
              (item) => `
                <div class="nm-summary-science-item">
                  <strong>${escapeHtml(item.title)}</strong>
                  ${escapeHtml(item.text)}
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderSummary() {
    const t = getUI();
    const container = document.getElementById("summarySection");
    if (!container) return;

    const focus = disorderLabel(state.detectedRisk);
    const secondary = state.secondaryRisk ? disorderLabel(state.secondaryRisk) : "-";
    const signal =
      (state.resultSummary && state.resultSummary.signal && state.resultSummary.signal[state.lang]) ||
      (state.resultSummary && state.resultSummary.signal && state.resultSummary.signal.en) ||
      (state.resultSummary && state.resultSummary.signal && state.resultSummary.signal.key) ||
      "";
    const summaryText =
      (state.resultSummary && state.resultSummary.summaryText && state.resultSummary.summaryText[state.lang]) ||
      (state.resultSummary && state.resultSummary.summaryText && state.resultSummary.summaryText.en) ||
      "";
    const topSubdomains = (state.resultSummary && state.resultSummary.topSubdomains) || [];
    const topPayText =
      state.lang === "hu"
        ? "A részletes, szülőbarát PDF riport a fizetés után készül el."
        : "The detailed parent-friendly PDF report is generated after payment.";
    const topPayLabel =
      t.summaryPayCta ||
      (state.lang === "hu" ? "Fizetés és riport kérése" : t.pay || "Pay");

    container.innerHTML = `
      <div>
        <div class="nm-summary-hero">
          <h3>${t.summaryTitle || "Summary"}</h3>
          <div>
            ${t.summaryNote || ""}
          </div>
        </div>

        <div class="nm-summary-top-cta">
          <span>${escapeHtml(topPayText)}</span>
          <button type="button" class="nm-summary-pay-button" data-nm-summary-pay="top">
            ${escapeHtml(topPayLabel)}
          </button>
        </div>

        <div class="nm-summary-card">
          <div class="nm-summary-pills">
            <div class="nm-summary-pill"><span class="nm-pill-dot focus"></span>${t.possibleFocus || "Likely focus area"}: ${focus}</div>
            <div class="nm-summary-pill"><span class="nm-pill-dot secondary"></span>${t.possibleSecondary || "Secondary signal"}: ${secondary}</div>
            ${signal ? `<div class="nm-summary-pill"><span class="nm-pill-dot signal"></span>${getSeverityLabel(state.specificProfile?.severity || "low")}: ${signal}</div>` : ""}
          </div>

          <div class="nm-summary-text">
            ${escapeHtml(summaryText)}
          </div>
        </div>

        ${buildSummaryConversionHtml()}

        ${buildSummaryNextStepHtml()}

        ${buildSummaryScienceHtml()}

        ${
          topSubdomains.length
            ? `
          <div class="nm-summary-card">
            <h4>
              ${t.specificProfileTitle || "Strongest areas"}
            </h4>

            ${topSubdomains
              .map(
                (item) => `
              <div class="nm-subdomain-row">
                <span>
                  <span class="nm-subdomain-label">${getSubdomainLabel(item.key, state.detectedRisk)}</span>
                  <span class="nm-subdomain-meta">${escapeHtml(item.key)}</span>
                </span>
                <strong>${item.average.toFixed(2)}</strong>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${buildCheckoutReviewHtml(t)}

        ${buildPrePaymentTrustHtml()}

        <div class="nm-summary-warning">
          ${escapeHtml(getSummaryWarningText())}
        </div>
      </div>
    `;

    const topPayButton = container.querySelector("[data-nm-summary-pay]");
    if (topPayButton) {
      topPayButton.addEventListener("click", startCheckout);
    }
  }

  function buildSpecificStepTitle(t) {
    if (!state.needsExtra) return t.specificTitle || "Detailed questionnaire";

    const extraTitle = t.extraTitle || (state.lang === "hu" ? "Kieg\u00e9sz\u00edt\u0151 k\u00e9rd\u00e9sek" : "Additional questions");
    return `${t.specificTitle || "Detailed questionnaire"} + ${extraTitle}`;
  }

  function buildSpecificStepIntro(t) {
    const primary = disorderLabel(state.detectedRisk);
    const secondary = state.secondaryRisk ? disorderLabel(state.secondaryRisk) : "";

    if (state.needsExtra && state.secondaryRisk) {
      if (state.lang === "hu") {
        return `Most a ${primary} ter\u00fcletet pontos\u00edtjuk. A kieg\u00e9sz\u00edt\u0151 k\u00e9rd\u00e9sek abban seg\u00edtenek, hogy elk\u00fcl\u00f6n\u00edts\u00fck a m\u00e1sodlagos ${secondary} jelz\u00e9st\u0151l.`;
      }

      return `We are now clarifying the ${primary} area. The additional questions help separate it from the secondary ${secondary} signal.`;
    }

    if (state.lang === "hu") {
      return `A k\u00f6vetkez\u0151 k\u00e9rd\u00e9sek a val\u00f3sz\u00edn\u0171 ${primary} mint\u00e1zat pontosabb felt\u00e9rk\u00e9pez\u00e9s\u00e9t seg\u00edtik.`;
    }

    return `The next questions help clarify the likely ${primary} pattern in more detail.`;
  }

  function renderCurrentStep() {
    scrollToQuestionnaireTop();

    const t = getUI();

    const triageSection = document.getElementById("triageSection");
    const specificSection = document.getElementById("specificSection");
    const summarySection = document.getElementById("summarySection");

    if (triageSection) triageSection.style.display = state.step === "triage" ? "block" : "none";
    if (specificSection) specificSection.style.display = state.step === "specific" ? "block" : "none";
    if (summarySection) summarySection.style.display = state.step === "summary" ? "block" : "none";

    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");
    const paymentBtn = document.getElementById("paymentBtn");

    if (backBtn) {
      backBtn.style.display = state.step === "triage" ? "none" : "inline-block";
      backBtn.disabled = false;
    }

    if (nextBtn) {
      nextBtn.style.display = state.step === "summary" ? "none" : "inline-block";
      nextBtn.disabled = false;
    }

    if (paymentBtn) {
      paymentBtn.style.display = state.step === "summary" ? "inline-block" : "none";
      paymentBtn.disabled = false;
    }

    if (state.step === "triage") {
      renderQuestionList(
        "triageSection",
        state.triageQuestions,
        state.triageAnswers,
        t.triageTitle,
        t.introTriage
      );
    }

    if (state.step === "specific") {
      const questions = state.needsExtra
        ? [...state.specificQuestions, ...state.extraQuestions]
        : [...state.specificQuestions];

      const answers = state.needsExtra
        ? [...state.specificAnswers, ...state.extraAnswers]
        : [...state.specificAnswers];

      const title = buildSpecificStepTitle(t);
      const intro = buildSpecificStepIntro(t);

      renderQuestionList("specificSection", questions, answers, title, intro);
    }

    if (state.step === "summary") renderSummary();

    updateProgress();
    updateResumeBanner();
  }

  function nextStep() {
    const t = getUI();

    if (state.step === "triage") {
      const sync = syncAnswersFromDOM("triageSection");

      if (!sync.ok) {
        alert(t.answerRequired);
        return;
      }

      state.triageAnswers = sync.values;

      const triageResult = evaluateTriage(state.triageQuestions, state.triageAnswers);
      state.triageScores = triageResult.rawScores;

      const risks = detectRisks(triageResult);

      state.detectedRisk = risks.primaryRisk;
      state.secondaryRisk = risks.secondaryRisk;
      state.needsExtra = shouldAskExtra(risks.primaryScore, risks.secondaryScore);
      state.triageRanking = risks.rankedDomains;

      state.specificQuestions = buildSpecificQuestions(state.detectedRisk);
      state.specificAnswers = [];
      state.specificScoring = null;
      state.specificProfile = null;
      state.resultSummary = null;

      state.extraQuestions = state.needsExtra
        ? buildExtraQuestions(state.detectedRisk, state.secondaryRisk)
        : [];

      state.extraAnswers = [];
      state.extraDebug = state.extraQuestions.map((q) => ({
        id: q.id,
        domain: q.domain,
        subdomain: q.subdomain,
        stemKey: q.stemKey
      }));

      trackSchemaEvent("nm_triage_completed", {
        funnel_step: "triage_completed",
        detected_risk: state.detectedRisk,
        secondary_risk: state.secondaryRisk || "",
        needs_extra: state.needsExtra,
        answer_count: state.triageAnswers.length,
        primary_score: Number(risks.primaryScore || 0),
        secondary_score: Number(risks.secondaryScore || 0)
      });

      state.step = "specific";
      renderCurrentStep();
      saveDraft("triage_completed");
      return;
    }

    if (state.step === "specific") {
      const sync = syncAnswersFromDOM("specificSection");

      if (!sync.ok) {
        alert(t.answerRequired);
        return;
      }

      state.specificAnswers = sync.values.slice(0, state.specificQuestions.length);
      state.extraAnswers = state.needsExtra
        ? sync.values.slice(state.specificQuestions.length)
        : [];

      state.specificScoring = evaluateSpecificQuestions(
        state.specificQuestions,
        state.specificAnswers
      );

      state.specificProfile = buildSpecificProfile(state.detectedRisk, state.specificScoring);
      state.resultSummary = buildResultSummary(
        state.detectedRisk,
        state.specificScoring,
        state.triageScores,
        state.secondaryRisk
      );

      trackSchemaEvent("nm_specific_completed", {
        funnel_step: "specific_completed",
        detected_risk: state.detectedRisk,
        secondary_risk: state.secondaryRisk || "",
        needs_extra: state.needsExtra,
        answer_count: state.specificAnswers.length + state.extraAnswers.length,
        specific_answer_count: state.specificAnswers.length,
        extra_answer_count: state.extraAnswers.length,
        normalized_average: Number(state.specificScoring?.normalizedAverage || 0),
        severity: state.specificProfile?.severity || ""
      });

      state.step = "summary";
      renderCurrentStep();
      saveDraft("specific_completed");
    }
  }

  function prevStep() {
    if (state.step === "specific") {
      state.step = "triage";
    } else if (state.step === "summary") {
      state.step = "specific";
    }

    renderCurrentStep();
    saveDraft("back");
  }

  function validateBeforeCheckout() {
    const errors = [];

    if (!state.triageQuestions.length || state.triageAnswers.length !== state.triageQuestions.length) {
      errors.push("A triage kerdesek nincsenek teljesen kitoltve.");
    }

    if (!state.detectedRisk) {
      errors.push("Nem sikerult meghatarozni a fo teruletet.");
    }

    if (!state.specificQuestions.length || state.specificAnswers.length !== state.specificQuestions.length) {
      errors.push("A specifikus kerdesek nincsenek teljesen kitoltve.");
    }

    if (!state.specificScoring || typeof state.specificScoring.normalizedAverage !== "number") {
      errors.push("Hianyzik a scoring.");
    }

    if (!state.specificProfile || !state.specificProfile.kind) {
      errors.push("Hianyzik a profil.");
    }

    if (state.needsExtra) {
      const expectedExtra = state.extraQuestions.length;
      const answeredExtra = state.extraAnswers.length;

      if (!expectedExtra || answeredExtra !== expectedExtra) {
        console.error("Extra validation detail:", {
          expectedExtra,
          answeredExtra,
          specificQuestions: state.specificQuestions.length,
          specificAnswers: state.specificAnswers.length,
          extraQuestions: state.extraQuestions.length,
          extraAnswers: state.extraAnswers.length
        });

        errors.push("Az extra kerdesek nincsenek kitoltve.");
      }
    }

    if (errors.length) {
      console.error("Checkout validation failed:", errors);
      return { ok: false, errors };
    }

    console.log("Checkout validation passed");
    return { ok: true };
  }

  function buildCheckoutPayload() {
    const childAge = getChildAgeValue();

    return {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      childAge,
      ageYears: childAge,
      lang: state.lang,
      payload: {
        childAge,
        ageYears: childAge,
        triageQuestions: state.triageQuestions.map((q) => ({
          id: q.id,
          text: getQuestionText(q),
          domain: q.domain,
          subdomain: q.subdomain,
          stemKey: inferStemKey(q),
          weight: q.weight
        })),
        triageAnswers: state.triageAnswers,
        triageScores: state.triageScores,
        triageRanking: state.triageRanking,
        detectedRisk: state.detectedRisk,
        secondaryRisk: state.secondaryRisk,

        specificQuestions: state.specificQuestions.map((q) => ({
          id: q.id,
          text: getQuestionText(q),
          subdomain: q.subdomain,
          domain: q.domain,
          weight: q.weight,
          reverse: q.reverse,
          stemKey: inferStemKey(q)
        })),
        specificAnswers: state.specificAnswers,
        specificScoring: state.specificScoring,
        specificProfile: state.specificProfile,
        resultSummary: state.resultSummary,

        extraQuestions: state.extraQuestions.map((q) => ({
          id: q.id,
          text: getQuestionText(q),
          subdomain: q.subdomain,
          domain: q.domain,
          weight: q.weight,
          reverse: q.reverse,
          stemKey: inferStemKey(q)
        })),
        extraAnswers: state.extraAnswers,

        questionnaireVersion: "v5-browser-adaptive-picker"
      }
    };
  }

  function getCheckoutErrorMessage(error, t) {
    const message = String((error && error.message) || "");
    const isHu = state.lang === "hu";

    if (/not a valid url/i.test(message)) {
      return isHu
        ? "A fizetesi link nem erkezett meg megfeleloen. Kerlek probald ujra, vagy jelezd nekunk, ha megismetlodik."
        : "The payment link was not returned correctly. Please try again, or contact us if this repeats.";
    }

    if (/failed to fetch|network|load failed/i.test(message)) {
      return isHu
        ? "Nem sikerult kapcsolodni a fizetesi kiszolgalohoz. Ellenorizd a kapcsolatot, majd probald ujra."
        : "Could not connect to the checkout service. Please check your connection and try again.";
    }

    if (/too many requests/i.test(message)) {
      return isHu
        ? "Tul sok probalkozas tortent rovid idon belul. Kerlek varj egy kicsit, majd probald ujra."
        : "Too many attempts were made in a short time. Please wait a moment and try again.";
    }

    return message || t.checkoutError || (isHu ? "Nem sikerult elinditani a fizetest." : "Could not start checkout.");
  }

  async function startCheckout() {
    const t = getUI();
    const config = getConfig();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const button = document.getElementById("paymentBtn");

    if (!name) {
      alert(t.missingName);
      return;
    }

    if (!email) {
      alert(t.missingEmail);
      return;
    }

    if (!validateEmail(email)) {
      alert(t.invalidEmail);
      return;
    }

    const ageValidation = validateChildAge();

    if (!ageValidation.ok) {
      alert(ageValidation.message);
      return;
    }

    const validation = validateBeforeCheckout();

    if (!validation.ok) {
      alert(validation.errors.join("\n"));
      return;
    }

    const payload = buildCheckoutPayload();
    saveDraft("checkout_started");

    trackSchemaEvent("nm_checkout_started", {
      funnel_step: "checkout_started",
      value: 5,
      currency: "USD",
      detected_risk: state.detectedRisk,
      secondary_risk: state.secondaryRisk || "",
      normalized_average: Number(state.specificScoring?.normalizedAverage || 0),
      severity: state.specificProfile?.severity || ""
    });

    try {
      if (button) button.disabled = true;
      setStatus(t.loading || "Loading...");

      const response = await fetch(`${config.API_BASE_URL}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log("CHECKOUT RESPONSE:", data);

      if (!response.ok) {
        throw new Error((data && data.error) || t.checkoutError || "Checkout error");
      }

      if (!data || !data.checkoutUrl) {
        throw new Error(t.checkoutError || "Checkout error");
      }

      try {
        new URL(data.checkoutUrl);
      } catch (_error) {
        console.error("Invalid checkoutUrl:", data.checkoutUrl);
        throw new Error("Not a valid URL");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      setStatus(getCheckoutErrorMessage(error, t));
      if (button) button.disabled = false;
    }
  }

  window.selectLang = function (lang) {
    const previousLang = state.lang || getLang();

    localStorage.setItem("nm_lang", lang);
    if (window.NM_APP && typeof window.NM_APP === "object") {
      window.NM_APP.lang = lang;
    }

    applyLang(lang);

    trackSchemaEvent("nm_language_selected", {
      funnel_step: state.step || "landing",
      previous_lang: previousLang,
      selected_lang: lang
    });

    if (typeof window.NM_APPLY_LANDING_LANGUAGE === "function") {
      window.NM_APPLY_LANDING_LANGUAGE(lang);
    }

    rescueLandingText(lang);
    scheduleLandingTextRescue(lang);

    hideModal();
  };

  window.NM_SET_LANGUAGE = window.selectLang;

  function init() {
    try {
      installFrontendDesign();
      installLandingPolishV2();
      buildLangButtons();
      bindLanguageSwitchers();
      ensureChildAgeField();
      state.lang = getLang();
      scheduleLandingTextRescue(state.lang);

      if (!validateRuntimeBanks()) {
        return;
      }

      state.triageQuestions = buildTriageQuestions();
      restoreDraft(readDraft());

      const nextBtn = document.getElementById("nextBtn");
      const backBtn = document.getElementById("backBtn");
      const paymentBtn = document.getElementById("paymentBtn");

      bindLanguageSwitchers();
      if (nextBtn) nextBtn.addEventListener("click", nextStep);
      if (backBtn) backBtn.addEventListener("click", prevStep);
      if (paymentBtn) paymentBtn.addEventListener("click", startCheckout);

      applyLang(state.lang);
      bindDraftAutosave();
      updateResumeBanner(Boolean(state.draftRestored));
      scheduleLandingTextRescue(state.lang);

      const specificBankCounts = DISORDERS.reduce((counts, domain) => {
        const bank = (window.NM_SPECIFIC_BANK || {})[domain] || [];
        counts[domain] = Array.isArray(bank) ? bank.length : 0;
        return counts;
      }, {});

      trackSchemaEvent("nm_landing_view", {
        funnel_step: "landing_view"
      }, {
        dedupeKey: `landing:${window.location.pathname || "/"}:${state.lang}`
      });

      trackSchemaEvent("nm_questionnaire_loaded", {
        funnel_step: "questionnaire_loaded",
        triage_question_count: state.triageQuestions.length,
        specific_bank_count: specificBankCounts,
        specific_bank_adhd_count: specificBankCounts.ADHD || 0,
        specific_bank_asd_count: specificBankCounts.ASD || 0,
        specific_bank_anxiety_count: specificBankCounts.ANXIETY || 0,
        specific_bank_depression_count: specificBankCounts.DEPRESSION || 0,
        specific_bank_learning_count: specificBankCounts.LEARNING || 0
      }, {
        dedupeKey: `questionnaire_loaded:${window.location.pathname || "/"}:${state.lang}`
      });
    } catch (error) {
      console.error("NeuroMap engine init failed:", error);
      state.lang = state.lang || "hu";
      scheduleLandingTextRescue(state.lang);
    }
  }

  window.NM_DEBUG_STATE = state;

  init();
})();



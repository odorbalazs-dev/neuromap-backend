/* =========================
   ENGINE - PRODUCTION FINAL
   Uses window.NM_ADAPTIVE_ENGINE when available.
========================= */

(function () {
  const DISORDERS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
  const ENGINE_VERSION = "20260604-customer-experience-v4";
  const ANALYTICS_SCHEMA_VERSION = "analytics-event-schema-v2";

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

    needsExtra: false
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
        background:
          linear-gradient(135deg, rgba(17, 151, 213, 0.12), rgba(255, 122, 0, 0.12)),
          #ffffff;
        border: 1px solid #d7ecf8;
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
        color: #344054;
        font-size: 16px;
        line-height: 1.7;
        margin-top: 4px;
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
        .nm-summary-card {
          border-radius: 18px;
          padding: 18px;
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
      }
    `;

    document.head.appendChild(style);
  }

  const LANDING_FALLBACK_TEXT = {
    hu: {
      modalTitle: "Valassz nyelvet",
      heroTitle: "Ertsd meg, mi allhat gyermeked viselkedese mogott",
      heroSub: "10 perces kerdoiv utan szemelyre szabott, szulobarat riportot es PDF-et kapsz.",
      primaryCta: "Kezdjuk ->",
      microcopy: "Csak $5 - Nincs elofizetes - PDF riport emailben",
      trust1: "kb. 10 perc",
      trust2: "PDF riport emailben",
      trust3: "strukturalt elemzes",
      valueTitle: "Mit kapsz pontosan?",
      value1: "szemelyre szabott ertelmezes a valaszok alapjan",
      value2: "viselkedesi, erzelmi es tanulasi mintazatok kiemelve",
      value3: "gyakorlati, szulokent is azonnal hasznalhato javaslatok",
      value4: "brandelt PDF riport emailben",
      stepsTitle: "Igy mukodik",
      step1: "1. Kitoltod a rovid eloszuro kerdoivet",
      step2: "2. A rendszer kivalasztja a relevans specifikus kerdessort",
      step3: "3. Fizetes utan elkeszul es emailben megerkezik a riport",
      previewTitle: "Igy nez ki a riport",
      previewCaption: "Minta elonezet: a teljes riport szemelyre szabottan, PDF-ben erkezik.",
      trustTitle: "Fontos tudni",
      trustText: "A NeuroMap Kids nem diagnozis, hanem strukturalt eloszures.",
      priceTitle: "Egyszeri dij",
      priceValue: "Csak $5",
      priceCta: "Riport elkeszitese ->",
      priceMicrocopy: "Nincs elofizetes - Biztonsagos fizetes - PDF emailben",
      stickyCta: "Kezdjuk ->"
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
      trustTitle: "Important to know",
      trustText: "NeuroMap Kids is not a diagnosis.",
      priceTitle: "One-time payment",
      priceValue: "Only $5",
      priceCta: "Get report ->",
      priceMicrocopy: "No subscription - Secure payment - PDF by email",
      stickyCta: "Start ->"
    }
  };
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
    if (lang === "hu") {
      return {
        title: "NeuroMap Kids riport",
        subtitle: "szemelyre szabott elonezet",
        focus: "Fokusz",
        pattern: "Mintazat",
        suggestions: "Javaslatok",
        next: "Kovetkezo lepesek",
        parent: "szulobarat magyarazat",
        action: "gyakorlati otletek",
        pdf: "brandelt PDF emailben"
      };
    }

    return {
      title: "NeuroMap Kids report",
      subtitle: "personalized preview",
      focus: "Focus",
      pattern: "Pattern",
      suggestions: "Suggestions",
      next: "Next steps",
      parent: "parent-friendly explanation",
      action: "practical ideas",
      pdf: "branded PDF by email"
    };
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

    ensureStickyBrandHeader();
    ensureReportPreviewMockup(getLang() || state.lang || "hu");
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
      setStatus("A kerdoiv betoltese nem sikerult. Kerjuk, frissitsd az oldalt, vagy probald ujra kesobb.");
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

  function buildCheckoutReviewHtml(t) {
    const name = (document.getElementById("name")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const childAge = getChildAgeValue();
    const totalQuestions =
      state.triageQuestions.length + state.specificQuestions.length + state.extraQuestions.length;
    const isHu = state.lang === "hu";

    const labels = isHu
      ? {
          title: "Fizet\u00e9s el\u0151tti gyors ellen\u0151rz\u00e9s",
          nameEmail: "N\u00e9v / email",
          childAge: "Gyermek \u00e9letkora",
          focus: "F\u0151 ter\u00fclet",
          questions: "Kit\u00f6lt\u00f6tt k\u00e9rd\u00e9sek",
          note: "A r\u00e9szletes riport ezekb\u0151l az adatokb\u00f3l k\u00e9sz\u00fcl. Ha valamit jav\u00edtan\u00e1l, l\u00e9pj vissza a fizet\u00e9s el\u0151tt."
        }
      : {
          title: "Quick review before payment",
          nameEmail: "Name / email",
          childAge: "Child age",
          focus: "Primary focus",
          questions: "Completed questions",
          note: "The detailed report will be generated from these answers. If something needs changing, go back before payment."
        };

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

    container.innerHTML = `
      <div>
        <div class="nm-summary-hero">
          <h3>${t.summaryTitle || "Summary"}</h3>
          <div>
            ${t.summaryNote || ""}
          </div>
        </div>

        <div class="nm-summary-card">
          <div class="nm-summary-pills">
            <div class="nm-summary-pill"><span class="nm-pill-dot focus"></span>${t.possibleFocus || "Likely focus area"}: ${focus}</div>
            <div class="nm-summary-pill"><span class="nm-pill-dot secondary"></span>${t.possibleSecondary || "Secondary signal"}: ${secondary}</div>
            ${signal ? `<div class="nm-summary-pill"><span class="nm-pill-dot signal"></span>${getSeverityLabel(state.specificProfile?.severity || "low")}: ${signal}</div>` : ""}
          </div>

          <div class="nm-summary-text">
            ${summaryText}
          </div>
        </div>

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

        <div class="nm-summary-warning">
          ${
            state.lang === "hu"
              ? "Ez nem diagn\u00f3zis, hanem struktur\u00e1lt el\u0151sz\u0171r\u00e9si \u00f6sszegz\u00e9s. A r\u00e9szletes, sz\u00fcl\u0151bar\u00e1t riport \u00e9s PDF a fizet\u00e9s ut\u00e1n k\u00e9sz\u00fcl el."
              : "This is not a diagnosis. It is a structured screening summary. The detailed parent-friendly report and PDF are generated after payment."
          }
        </div>
      </div>
    `;
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
    }
  }

  function prevStep() {
    if (state.step === "specific") {
      state.step = "triage";
    } else if (state.step === "summary") {
      state.step = "specific";
    }

    renderCurrentStep();
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

      const nextBtn = document.getElementById("nextBtn");
      const backBtn = document.getElementById("backBtn");
      const paymentBtn = document.getElementById("paymentBtn");

      bindLanguageSwitchers();
      if (nextBtn) nextBtn.addEventListener("click", nextStep);
      if (backBtn) backBtn.addEventListener("click", prevStep);
      if (paymentBtn) paymentBtn.addEventListener("click", startCheckout);

      applyLang(state.lang);
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



/* =========================
   ENGINE - PRODUCTION FINAL
   Uses window.NM_ADAPTIVE_ENGINE when available.
========================= */

(function () {
  const DISORDERS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
  const ENGINE_VERSION = "20260603-landing-rescue-v4";
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
        align-items: center;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid #d9ecf7;
        border-radius: 18px;
        box-shadow: 0 12px 28px rgba(20, 32, 51, 0.055);
        display: grid;
        gap: 16px;
        grid-template-columns: 44px minmax(0, 1fr) minmax(190px, 240px);
        margin: 12px 0;
        padding: 16px;
      }

      .nm-q-card:hover {
        border-color: #bfe5f7;
        box-shadow: 0 16px 34px rgba(20, 32, 51, 0.075);
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

        .nm-answer-select {
          grid-column: 1 / -1;
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
        display: flex !important;
        gap: 16px !important;
        justify-content: space-between !important;
        padding: 10px clamp(16px, 3vw, 34px) !important;
      }

      .nm-social-landing .nm-topbar-logo,
      .nm-landing .nm-topbar-logo {
        height: clamp(32px, 4vw, 46px) !important;
        max-height: 46px !important;
        max-width: min(190px, 42vw) !important;
        object-fit: contain !important;
        width: auto !important;
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
        font-size: clamp(34px, 4vw, 52px);
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

      @media (max-width: 720px) {
        .nm-landing-hero,
        .nm-social-landing,
        [data-nm-section="hero"] {
          min-height: auto;
          padding-bottom: 34px;
          padding-top: 52px;
        }

        .nm-landing h1,
        .nm-social-landing h1,
        [data-nm-section="hero"] h1 {
          font-size: clamp(30px, 9vw, 42px);
        }

        .nm-landing [data-nm-cta],
        .nm-social-landing [data-nm-cta],
        a[href="#questionnaireStart"],
        a[href*="questionnaireStart"] {
          width: 100%;
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
      primaryCta: "Kezdjük →",
      microcopy: "Csak $5 • Nincs előfizetés • PDF riport emailben",
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
      trustTitle: "Fontos tudni",
      trustText: "A NeuroMap Kids nem diagnózis, hanem strukturált előszűrés.",
      priceTitle: "Egyszeri díj",
      priceValue: "Csak $5",
      priceCta: "Riport elkészítése →",
      priceMicrocopy: "Nincs előfizetés • Biztonságos fizetés • PDF emailben",
      stickyCta: "Kezdjük →"
    },
    en: {
      modalTitle: "Choose language",
      heroTitle: "Understand what may be behind your child's behavior",
      heroSub: "After a 10-minute questionnaire, you receive a personalized, parent-friendly report and PDF.",
      primaryCta: "Start →",
      microcopy: "Only $5 • No subscription • PDF report by email",
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
      priceCta: "Get report →",
      priceMicrocopy: "No subscription • Secure payment • PDF by email",
      stickyCta: "Start →"
    }
  };

  Object.assign(LANDING_FALLBACK_TEXT, {
    hu: {
      modalTitle: "Válassz nyelvet",
      heroTitle: "Értsd meg, mi állhat gyermeked viselkedése mögött",
      heroSub: "10 perces kérdőív után személyre szabott, szülőbarát riportot és PDF-et kapsz.",
      primaryCta: "Kezdjük →",
      microcopy: "Csak $5 • Nincs előfizetés • PDF riport emailben",
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
      trustTitle: "Fontos tudni",
      trustText: "A NeuroMap Kids nem diagnózis, hanem strukturált előszűrés.",
      priceTitle: "Egyszeri díj",
      priceValue: "Csak $5",
      priceCta: "Riport elkészítése →",
      priceMicrocopy: "Nincs előfizetés • Biztonságos fizetés • PDF emailben",
      stickyCta: "Kezdjük →"
    },
    en: {
      modalTitle: "Choose language",
      heroTitle: "Understand what may be behind your child's behavior",
      heroSub: "After a 10-minute questionnaire, you receive a personalized, parent-friendly report and PDF.",
      primaryCta: "Start →",
      microcopy: "Only $5 • No subscription • PDF report by email",
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
      priceCta: "Get report →",
      priceMicrocopy: "No subscription • Secure payment • PDF by email",
      stickyCta: "Start →"
    }
  });

  Object.assign(LANDING_FALLBACK_TEXT, {
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
  });

  function getLandingFallbackText(lang = state.lang) {
    return LANDING_FALLBACK_TEXT[lang] || LANDING_FALLBACK_TEXT.en;
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

  function applyLandingFallbackLanguage(lang = state.lang) {
    const copy = getLandingFallbackText(lang);
    let applied = 0;

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

    return applied;
  }

  function rescueLandingText(lang = state.lang) {
    if (landingRescueInProgress) return 0;

    landingRescueInProgress = true;

    try {
      restoreLandingSections();

      const applied = applyLandingFallbackLanguage(lang);
      ensureLandingStartHandlers();

      restoreLandingSections();

      if (applied > 0) {
        document.documentElement.dataset.nmLandingRescued = "1";
      }

      return applied;
    } finally {
      landingRescueInProgress = false;
    }
  }

  function scheduleLandingTextRescue(lang = state.lang) {
    rescueLandingText(lang);

    [50, 250, 800, 1600].forEach((delay) => {
      window.setTimeout(() => rescueLandingText(lang), delay);
    });

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => rescueLandingText(lang), { once: true });
    }

    window.addEventListener("load", () => rescueLandingText(lang), { once: true });

    if (!window.__nmLandingRescueObserverInstalled && "MutationObserver" in window) {
      window.__nmLandingRescueObserverInstalled = true;

      let rescueTimer = null;
      const queueRescue = () => {
        window.clearTimeout(rescueTimer);
        rescueTimer = window.setTimeout(() => rescueLandingText(state.lang || lang), 40);
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

    if (target) {
      setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 20);
    }
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
    if (lang === "ar") return "Řź";
    if (lang === "zh" || lang === "ja") return "ďĽź";
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

    value = value.replace(/[.!ă€‚ďĽŽ]+$/u, "").trim();

    const questionMark = getQuestionMark(lang);

    if (!/[?ŘźďĽź]$/u.test(value)) {
      value += questionMark;
    }

    if (lang === "es" && !value.startsWith("Âż")) {
      value = "Âż" + value;
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
      setStatus("A kĂ©rdĹ‘Ă­v betĂ¶ltĂ©se nem sikerĂĽlt. KĂ©rjĂĽk, frissĂ­tsd az oldalt, vagy prĂłbĂˇld Ăşjra kĂ©sĹ‘bb.");
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
      return { key: "high", hu: "magas jelzĂ©sszint", en: "high signal level" };
    }

    if (value >= 1.4) {
      return { key: "moderate", hu: "kĂ¶zepes jelzĂ©sszint", en: "moderate signal level" };
    }

    if (value >= 0.8) {
      return { key: "mild", hu: "enyhe jelzĂ©sszint", en: "mild signal level" };
    }

    return { key: "low", hu: "alacsony jelzĂ©sszint", en: "low signal level" };
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

  function buildResultSummary(kind, scoring, triageScores, secondaryRisk) {
    const avg = Number(scoring && scoring.normalizedAverage ? scoring.normalizedAverage : 0);
    const signal = getSignalLevel(avg);
    const topSubdomains = getTopSubdomains(scoring, 3);

    const domainCopy = {
      ADHD: {
        hu: "A vĂˇlaszok alapjĂˇn a legerĹ‘sebb mintĂˇzat a figyelem, impulzivitĂˇs, aktivitĂˇsszabĂˇlyozĂˇs vagy vĂ©grehajtĂł mĹ±kĂ¶dĂ©s terĂĽletĂ©hez kapcsolĂłdik.",
        en: "The strongest pattern appears to relate to attention, impulsivity, activity regulation, or executive functioning."
      },
      ASD: {
        hu: "A vĂˇlaszok alapjĂˇn a legerĹ‘sebb mintĂˇzat a tĂˇrsas kommunikĂˇciĂł, rugalmassĂˇg, rutinok vagy szenzoros feldolgozĂˇs terĂĽletĂ©hez kapcsolĂłdik.",
        en: "The strongest pattern appears to relate to social communication, flexibility, routines, or sensory processing."
      },
      ANXIETY: {
        hu: "A vĂˇlaszok alapjĂˇn a legerĹ‘sebb mintĂˇzat az aggodalom, feszĂĽltsĂ©g, bizonytalansĂˇg vagy elkerĂĽlĂ©s terĂĽletĂ©hez kapcsolĂłdik.",
        en: "The strongest pattern appears to relate to worry, tension, uncertainty, or avoidance."
      },
      DEPRESSION: {
        hu: "A vĂˇlaszok alapjĂˇn a legerĹ‘sebb mintĂˇzat a hangulat, motivĂˇciĂł, Ă©rdeklĹ‘dĂ©s vagy Ă¶nĂ©rtĂ©kelĂ©s terĂĽletĂ©hez kapcsolĂłdik.",
        en: "The strongest pattern appears to relate to mood, motivation, interest, or self-view."
      },
      LEARNING: {
        hu: "A vĂˇlaszok alapjĂˇn a legerĹ‘sebb mintĂˇzat tanulĂˇsi, teljesĂ­tmĂ©nybeli, olvasĂˇsi, Ă­rĂˇsi, matematikai vagy feladatmegĂ©rtĂ©si nehĂ©zsĂ©gekhez kapcsolĂłdik.",
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
        hu: "A vĂˇlaszok alapjĂˇn kirajzolĂłdik egy Ă©rtelmezhetĹ‘ mintĂˇzat.",
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
        label: "Gyermek életkora",
        placeholder: "pl. 7",
        missing: "Kérlek add meg a gyermek életkorát.",
        invalid: "A gyermek életkora 1 és 24 év között legyen."
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
        label: "Eta del bambino",
        placeholder: "es. 7",
        missing: "Inserisci l'eta del bambino.",
        invalid: "L'eta del bambino deve essere compresa tra 1 e 24 anni."
      },
      es: {
        label: "Edad del niño",
        placeholder: "p. ej. 7",
        missing: "Por favor, introduce la edad del niño.",
        invalid: "La edad del niño debe estar entre 1 y 24 años."
      },
      zh: {
        label: "孩子年龄",
        placeholder: "例如 7",
        missing: "请输入孩子的年龄。",
        invalid: "孩子年龄应在 1 到 24 岁之间。"
      },
      ja: {
        label: "子どもの年齢",
        placeholder: "例: 7",
        missing: "子どもの年齢を入力してください。",
        invalid: "子どもの年齢は1歳から24歳の間で入力してください。"
      },
      ar: {
        label: "عمر الطفل",
        placeholder: "مثال: 7",
        missing: "يرجى إدخال عمر الطفل.",
        invalid: "يجب أن يكون عمر الطفل بين 1 و24 سنة."
      },
      pl: {
        label: "Wiek dziecka",
        placeholder: "np. 7",
        missing: "Podaj wiek dziecka.",
        invalid: "Wiek dziecka powinien mieścić się w zakresie od 1 do 24 lat."
      },
      pt: {
        label: "Idade da criança",
        placeholder: "ex. 7",
        missing: "Por favor, informe a idade da criança.",
        invalid: "A idade da criança deve estar entre 1 e 24 anos."
      },
      fr: {
        label: "Âge de l'enfant",
        placeholder: "ex. 7",
        missing: "Veuillez indiquer l'âge de l'enfant.",
        invalid: "L'âge de l'enfant doit être compris entre 1 et 24 ans."
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

  function showModal() {
    const el = document.getElementById("languageModal");
    if (el) el.style.display = "flex";
  }

  function hideModal() {
    const el = document.getElementById("languageModal");
    if (el) el.style.display = "none";
  }

  function buildLangButtons() {
    const container = document.getElementById("langButtons");
    if (!container) return;
    if (container.children.length > 0) return;

    const labels = {
      hu: "Magyar",
      en: "English",
      de: "Deutsch",
      it: "Italiano",
      es: "EspaĂ±ol",
      zh: "ä¸­ć–‡",
      ja: "ć—Ąćś¬čŞž",
      ar: "Ř§Ů„ŘąŘ±Ř¨ŮŠŘ©",
      pl: "Polski",
      pt: "PortuguĂŞs",
      fr: "FranĂ§ais"
    };

    const supported = getConfig().SUPPORTED_LANGS || ["hu"];

    container.innerHTML = supported
      .map(
        (lang) => `
      <button onclick="selectLang('${lang}')" style="display:block;width:100%;margin:8px 0;padding:10px;">
        ${labels[lang] || lang.toUpperCase()}
      </button>
    `
      )
      .join("");
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

    ensureChildAgeField();
    updateChildAgeFieldLanguage();

    renderCurrentStep();
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

        ${questions
          .map(
            (q, index) => `
          <div class="nm-q-card">
            <div class="nm-q-number">${index + 1}</div>
            <div class="nm-q-text">${getQuestionText(q)}</div>
            <select data-question-index="${index}" class="nm-answer-select">
              ${responseOptionsHtml(answers[index])}
            </select>
          </div>
        `
          )
          .join("")}
      </div>
    `;
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

    if (textEl) textEl.textContent = `${current} / 3 Â· ${currentData.title}`;

    if (barEl) {
      barEl.style.width = `${current * 33.33}%`;
      barEl.style.transition = "width 0.35s ease";
    }

    if (pageTitleEl) pageTitleEl.textContent = currentData.title;
  }

  function renderSummary() {
    const t = getUI();
    const container = document.getElementById("summarySection");
    if (!container) return;

    const focus = disorderLabel(state.detectedRisk);
    const secondary = state.secondaryRisk ? disorderLabel(state.secondaryRisk) : "â€”";
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
                <span>${item.key}</span>
                <strong>${item.average.toFixed(2)}</strong>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <div class="nm-summary-warning">
          ${
            state.lang === "hu"
              ? "Ez nem diagnĂłzis, hanem strukturĂˇlt elĹ‘szĹ±rĂ©si Ă¶sszegzĂ©s. A rĂ©szletes, szĂĽlĹ‘barĂˇt riport Ă©s PDF a fizetĂ©s utĂˇn kĂ©szĂĽl el."
              : "This is not a diagnosis. It is a structured screening summary. The detailed parent-friendly report and PDF are generated after payment."
          }
        </div>
      </div>
    `;
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

      const title = state.needsExtra
        ? `${t.specificTitle || ""} + ${t.extraTitle || ""}`
        : t.specificTitle;

      const intro =
        state.needsExtra && state.secondaryRisk
          ? `${t.introSpecific || ""} ${t.possibleFocus || ""}: ${disorderLabel(state.detectedRisk)}. ${t.possibleSecondary || "Secondary signal"}: ${disorderLabel(state.secondaryRisk)}.`
          : `${t.introSpecific || ""} ${t.possibleFocus || ""}: ${disorderLabel(state.detectedRisk)}.`;

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
      errors.push("Triage kĂ©rdĂ©sek nincsenek teljesen kitĂ¶ltve.");
    }

    if (!state.detectedRisk) {
      errors.push("Nem sikerĂĽlt meghatĂˇrozni a fĹ‘ terĂĽletet.");
    }

    if (!state.specificQuestions.length || state.specificAnswers.length !== state.specificQuestions.length) {
      errors.push("Specifikus kĂ©rdĂ©sek nincsenek teljesen kitĂ¶ltve.");
    }

    if (!state.specificScoring || typeof state.specificScoring.normalizedAverage !== "number") {
      errors.push("HiĂˇnyzik a scoring.");
    }

    if (!state.specificProfile || !state.specificProfile.kind) {
      errors.push("HiĂˇnyzik a profil.");
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

        errors.push("Extra kĂ©rdĂ©sek nincsenek kitĂ¶ltve.");
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
      setStatus(error.message || t.checkoutError || "Checkout error");
      if (button) button.disabled = false;
    }
  }

  window.selectLang = function (lang) {
    const previousLang = state.lang || getLang();

    localStorage.setItem("nm_lang", lang);

    applyLang(lang);
    scheduleLandingTextRescue(lang);

    trackSchemaEvent("nm_language_selected", {
      funnel_step: state.step || "landing",
      previous_lang: previousLang,
      selected_lang: lang
    });

    if (typeof window.NM_APPLY_LANDING_LANGUAGE === "function") {
      window.NM_APPLY_LANDING_LANGUAGE(lang);
    }

    hideModal();
  };

  function init() {
    try {
      installFrontendDesign();
      installLandingPolishV2();
      buildLangButtons();
      ensureChildAgeField();
      state.lang = getLang();
      scheduleLandingTextRescue(state.lang);

      if (!validateRuntimeBanks()) {
        return;
      }

      state.triageQuestions = buildTriageQuestions();

      const langSwitch = document.getElementById("langSwitch");
      const nextBtn = document.getElementById("nextBtn");
      const backBtn = document.getElementById("backBtn");
      const paymentBtn = document.getElementById("paymentBtn");

      if (langSwitch) langSwitch.addEventListener("click", showModal);
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

/* =========================
   CHECKOUT SUCCESS/CANCEL PAGES - WEBFLOW STABLE V1
========================= */

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const CHECKOUT_PAGES_VERSION = "20260603-customer-experience-v1";
  const ANALYTICS_SCHEMA_VERSION = "analytics-event-schema-v2";
  const DEFAULT_API_BASE_URL = "https://neuromap-backend-production-969d.up.railway.app";
  const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

  const BASE_COPY = {
    home: "Home",
    retry: "Try payment again",
    retrying: "Opening checkout...",
    retryError: "Could not restart checkout. Please contact support.",
    support: "Contact support",
    supportHref: "mailto:info@neuromapkids.com",
    sessionLabel: "Session",
    statusReady: "The page is ready.",
    noSession: "Missing checkout session identifier.",
    reportStatusTitle: "Report status",
    reportStatusLead: "We are preparing your personalized PDF and email.",
    statusLoading: "Checking report status...",
    statusUnavailable: "Status is not available yet. Your report is still being processed.",
    statusSent: "Your report email has been sent.",
    statusAttention: "The report needs a quick manual check. We will keep trying automatically.",
    statusPayment: "Payment",
    statusAnalysis: "Analysis",
    statusReport: "PDF report",
    statusEmail: "Email",
    stateComplete: "Done",
    stateActive: "In progress",
    statePending: "Waiting",
    stateFailed: "Needs attention",
    nextTitle: "What happens next?",
    nextItems: [
      "The analysis worker prepares the personalized interpretation.",
      "The PDF report is generated and attached to the email.",
      "Please also check Spam or Promotions if the email is delayed."
    ],
    successTitle: "Payment successful",
    successLead: "Thank you. Your purchase was successful.",
    successBody: "The detailed parent-friendly report and PDF will be sent by email.",
    cancelTitle: "Payment was not completed",
    cancelLead: "No charge was made.",
    cancelBody: "You can safely return to the questionnaire or retry checkout from here."
  };

  const COPY = {
    hu: {
      home: "Vissza a f\u0151oldalra",
      retry: "Fizet\u00e9s \u00fajraind\u00edt\u00e1sa",
      retrying: "\u00c1tir\u00e1ny\u00edt\u00e1s a fizet\u00e9si oldalra...",
      retryError: "Nem siker\u00fclt \u00fajraind\u00edtani a fizet\u00e9st. K\u00e9rlek, \u00edrj az \u00fcgyf\u00e9lszolg\u00e1latnak.",
      support: "Seg\u00edts\u00e9get k\u00e9rek",
      sessionLabel: "Azonos\u00edt\u00f3",
      statusReady: "Az oldal k\u00e9szen \u00e1ll.",
      noSession: "Hi\u00e1nyzik a fizet\u00e9si azonos\u00edt\u00f3.",
      reportStatusTitle: "Riport \u00e1llapota",
      reportStatusLead: "K\u00e9sz\u00edtj\u00fck a szem\u00e9lyre szabott PDF-et \u00e9s az emailt.",
      statusLoading: "Riport \u00e1llapot ellen\u0151rz\u00e9se...",
      statusUnavailable: "Az \u00e1llapot m\u00e9g nem el\u00e9rhet\u0151. A riport feldolgoz\u00e1sa folyamatban van.",
      statusSent: "A riport email elk\u00fcldve.",
      statusAttention: "A riport gyors ellen\u0151rz\u00e9st ig\u00e9nyel. Az automatikus \u00fajrapr\u00f3b\u00e1lkoz\u00e1s fut.",
      statusPayment: "Fizet\u00e9s",
      statusAnalysis: "Elemz\u00e9s",
      statusReport: "PDF riport",
      statusEmail: "Email",
      stateComplete: "K\u00e9sz",
      stateActive: "Folyamatban",
      statePending: "V\u00e1rakozik",
      stateFailed: "Figyelmet ig\u00e9nyel",
      nextTitle: "Mi t\u00f6rt\u00e9nik most?",
      nextItems: [
        "Az elemz\u0151 worker elk\u00e9sz\u00edti a szem\u00e9lyre szabott \u00e9rtelmez\u00e9st.",
        "A PDF riport gener\u00e1l\u00f3dik \u00e9s csatolm\u00e1nyk\u00e9nt ker\u00fcl az emailbe.",
        "Ha p\u00e1r percen bel\u00fcl nem l\u00e1tod, ellen\u0151rizd a Spam vagy Prom\u00f3ci\u00f3k mapp\u00e1t is."
      ],
      successTitle: "K\u00f6sz\u00f6nj\u00fck! A fizet\u00e9s sikeres volt.",
      successLead: "A szem\u00e9lyre szabott NeuroMap Kids riport elk\u00e9sz\u00edt\u00e9se elindult.",
      successBody: "A r\u00e9szletes \u00e9rt\u00e9kel\u00e9s \u00e9s a PDF riport emailben \u00e9rkezik. Ez \u00e1ltal\u00e1ban 1-2 percen bel\u00fcl megt\u00f6rt\u00e9nik.",
      cancelTitle: "A fizet\u00e9s nem fejez\u0151d\u00f6tt be",
      cancelLead: "Nem t\u00f6rt\u00e9nt terhel\u00e9s.",
      cancelBody: "Innen biztons\u00e1gosan visszat\u00e9rhetsz a k\u00e9rd\u0151\u00edvhez, vagy \u00fajraind\u00edthatod a fizet\u00e9st."
    },
    en: {
      successTitle: "Payment successful",
      successLead: "Thank you. Your purchase was successful.",
      successBody: "The detailed parent-friendly report and PDF will be sent by email, usually within 1-2 minutes.",
      cancelTitle: "Payment was not completed",
      cancelLead: "No charge was made.",
      cancelBody: "You can safely return to the questionnaire or retry checkout from here."
    },
    de: {
      home: "Zur Startseite",
      retry: "Zahlung erneut versuchen",
      retrying: "Weiterleitung zur Zahlung...",
      retryError: "Die Zahlung konnte nicht neu gestartet werden.",
      support: "Support kontaktieren",
      successTitle: "Zahlung erfolgreich",
      successLead: "Vielen Dank. Der Kauf war erfolgreich.",
      successBody: "Der detaillierte Bericht und das PDF werden per E-Mail gesendet.",
      cancelTitle: "Zahlung nicht abgeschlossen",
      cancelLead: "Es wurde nichts berechnet.",
      cancelBody: "Du kannst zurueckkehren oder die Zahlung erneut versuchen."
    },
    it: {
      home: "Home",
      retry: "Riprova il pagamento",
      retrying: "Apertura del checkout...",
      retryError: "Impossibile riavviare il pagamento.",
      support: "Contatta il supporto",
      successTitle: "Pagamento riuscito",
      successLead: "Grazie. Il tuo acquisto e riuscito.",
      successBody: "Il report dettagliato e il PDF saranno inviati via email.",
      cancelTitle: "Pagamento non completato",
      cancelLead: "Non e stato effettuato alcun addebito.",
      cancelBody: "Puoi tornare al questionario o riprovare il pagamento."
    },
    es: {
      home: "Inicio",
      retry: "Intentar pago otra vez",
      retrying: "Abriendo checkout...",
      retryError: "No se pudo reiniciar el pago.",
      support: "Contactar soporte",
      successTitle: "Pago realizado correctamente",
      successLead: "Gracias. Tu compra se completo correctamente.",
      successBody: "El informe detallado y el PDF se enviaran por email.",
      cancelTitle: "Pago no completado",
      cancelLead: "No se realizo ningun cargo.",
      cancelBody: "Puedes volver al cuestionario o intentar el pago otra vez."
    },
    zh: {
      home: "\u8fd4\u56de\u9996\u9875",
      retry: "\u91cd\u65b0\u652f\u4ed8",
      retrying: "\u6b63\u5728\u6253\u5f00\u652f\u4ed8\u9875\u9762...",
      retryError: "\u65e0\u6cd5\u91cd\u65b0\u542f\u52a8\u652f\u4ed8\u3002",
      support: "\u8054\u7cfb\u652f\u6301",
      successTitle: "\u652f\u4ed8\u6210\u529f",
      successLead: "\u8c22\u8c22\u3002\u60a8\u7684\u8d2d\u4e70\u5df2\u6210\u529f\u3002",
      successBody: "\u8be6\u7ec6\u62a5\u544a\u548c PDF \u5c06\u901a\u8fc7\u7535\u5b50\u90ae\u4ef6\u53d1\u9001\u3002",
      cancelTitle: "\u652f\u4ed8\u672a\u5b8c\u6210",
      cancelLead: "\u672a\u6263\u6b3e\u3002",
      cancelBody: "\u60a8\u53ef\u4ee5\u8fd4\u56de\u95ee\u5377\u6216\u91cd\u65b0\u5c1d\u8bd5\u652f\u4ed8\u3002"
    },
    ja: {
      home: "\u30db\u30fc\u30e0",
      retry: "\u652f\u6255\u3044\u3092\u3084\u308a\u76f4\u3059",
      retrying: "\u6c7a\u6e08\u30da\u30fc\u30b8\u3092\u958b\u3044\u3066\u3044\u307e\u3059...",
      retryError: "\u6c7a\u6e08\u3092\u518d\u958b\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
      support: "\u30b5\u30dd\u30fc\u30c8\u306b\u9023\u7d61",
      successTitle: "\u652f\u6255\u3044\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f",
      successLead: "\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\u3002\u8cfc\u5165\u306f\u6210\u529f\u3057\u307e\u3057\u305f\u3002",
      successBody: "\u8a73\u7d30\u30ec\u30dd\u30fc\u30c8\u3068 PDF \u306f\u30e1\u30fc\u30eb\u3067\u9001\u4fe1\u3055\u308c\u307e\u3059\u3002",
      cancelTitle: "\u652f\u6255\u3044\u306f\u5b8c\u4e86\u3057\u3066\u3044\u307e\u305b\u3093",
      cancelLead: "\u8acb\u6c42\u306f\u767a\u751f\u3057\u3066\u3044\u307e\u305b\u3093\u3002",
      cancelBody: "\u8cea\u554f\u7968\u306b\u623b\u308b\u304b\u3001\u6c7a\u6e08\u3092\u518d\u8a66\u884c\u3067\u304d\u307e\u3059\u3002"
    },
    ar: {
      home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
      retry: "\u0625\u0639\u0627\u062f\u0629 \u0645\u062d\u0627\u0648\u0644\u0629 \u0627\u0644\u062f\u0641\u0639",
      retrying: "\u062c\u0627\u0631\u064a \u0641\u062a\u062d \u0635\u0641\u062d\u0629 \u0627\u0644\u062f\u0641\u0639...",
      retryError: "\u062a\u0639\u0630\u0631 \u0625\u0639\u0627\u062f\u0629 \u0628\u062f\u0621 \u0627\u0644\u062f\u0641\u0639.",
      support: "\u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645",
      successTitle: "\u062a\u0645 \u0627\u0644\u062f\u0641\u0639 \u0628\u0646\u062c\u0627\u062d",
      successLead: "\u0634\u0643\u0631\u0627\u064b \u0644\u0643. \u062a\u0645\u062a \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 \u0628\u0646\u062c\u0627\u062d.",
      successBody: "\u0633\u064a\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0648 PDF \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a.",
      cancelTitle: "\u0644\u0645 \u064a\u0643\u062a\u0645\u0644 \u0627\u0644\u062f\u0641\u0639",
      cancelLead: "\u0644\u0645 \u064a\u062a\u0645 \u062e\u0635\u0645 \u0623\u064a \u0645\u0628\u0644\u063a.",
      cancelBody: "\u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0639\u0648\u062f\u0629 \u0623\u0648 \u0625\u0639\u0627\u062f\u0629 \u0645\u062d\u0627\u0648\u0644\u0629 \u0627\u0644\u062f\u0641\u0639."
    },
    pl: {
      home: "Strona glowna",
      retry: "Sprobuj zaplacic ponownie",
      retrying: "Otwieranie platnosci...",
      retryError: "Nie udalo sie ponownie uruchomic platnosci.",
      support: "Kontakt z supportem",
      successTitle: "Platnosc zakonczona sukcesem",
      successLead: "Dziekujemy. Zakup zostal zakonczony pomyslnie.",
      successBody: "Szczegolowy raport i PDF zostana wyslane emailem.",
      cancelTitle: "Platnosc nie zostala ukonczona",
      cancelLead: "Nie pobrano oplaty.",
      cancelBody: "Mozesz wrocic do ankiety albo ponowic platnosc."
    },
    pt: {
      home: "Inicio",
      retry: "Tentar pagamento novamente",
      retrying: "Abrindo checkout...",
      retryError: "Nao foi possivel reiniciar o pagamento.",
      support: "Contactar suporte",
      successTitle: "Pagamento concluido",
      successLead: "Obrigado. A compra foi concluida com sucesso.",
      successBody: "O relatorio detalhado e o PDF serao enviados por email.",
      cancelTitle: "Pagamento nao concluido",
      cancelLead: "Nenhuma cobranca foi feita.",
      cancelBody: "Voce pode voltar ao questionario ou tentar o pagamento novamente."
    },
    fr: {
      home: "Accueil",
      retry: "Reessayer le paiement",
      retrying: "Ouverture du paiement...",
      retryError: "Impossible de relancer le paiement.",
      support: "Contacter le support",
      successTitle: "Paiement reussi",
      successLead: "Merci. Votre achat a reussi.",
      successBody: "Le rapport detaille et le PDF seront envoyes par email.",
      cancelTitle: "Paiement non termine",
      cancelLead: "Aucun montant n'a ete debite.",
      cancelBody: "Vous pouvez revenir au questionnaire ou reessayer le paiement."
    }
  };

  function getCopy(lang) {
    return Object.assign({}, BASE_COPY, COPY.en, COPY[lang] || {});
  }

  function getApiBaseUrl() {
    const configUrl = window.NM_CONFIG && window.NM_CONFIG.API_BASE_URL;
    const raw = String(configUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
    return raw || DEFAULT_API_BASE_URL;
  }

  function getPageKind() {
    const path = String(window.location.pathname || "").toLowerCase();
    if (path.includes("cancel")) return "cancel";
    return "success";
  }

  function getLang() {
    const path = String(window.location.pathname || "").toLowerCase();
    const fromPath = path.split("/").filter(Boolean)[0] || "";
    const normalizedPathLang = fromPath.replace(/-checkout-.+$/, "");
    const saved = String(localStorage.getItem("nm_lang") || "").toLowerCase();
    const htmlLang = String(document.documentElement.lang || "").toLowerCase().slice(0, 2);
    const candidates = [normalizedPathLang, saved, htmlLang, "en"];
    return candidates.find((lang) => SUPPORTED_LANGS.includes(lang)) || "en";
  }

  function getSessionId(kind) {
    const params = new URLSearchParams(window.location.search || "");
    return params.get("session_id") || params.get("sid") || params.get("session") || "";
  }

  function safeHref(value, fallback) {
    try {
      const url = new URL(value, window.location.origin);
      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
        return url.href;
      }
    } catch (_error) {
      return fallback;
    }
    return fallback;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function hasDataLayerEvent(eventName, sessionId) {
    const dataLayer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    return dataLayer.some((entry) => {
      if (!entry || entry.event !== eventName) return false;
      if (!sessionId) return true;
      return entry.session_id === sessionId || entry.checkout_session_id === sessionId;
    });
  }

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

  function buildAnalyticsPayload(eventName, payload) {
    return Object.assign({
      event_id: `${eventName}_${Date.now()}_${randomIdPart()}`,
      event_schema_version: ANALYTICS_SCHEMA_VERSION,
      app_name: "neuromap_kids",
      app_surface: "webflow",
      page_kind: getPageKind() === "success" ? "checkout_success" : "checkout_cancel",
      page_path: window.location.pathname || "",
      page_url: window.location.href || "",
      client_session_id: getClientSessionId(),
      source: "webflow_checkout_pages",
      version: CHECKOUT_PAGES_VERSION,
      generated_at: new Date().toISOString()
    }, payload || {});
  }

  function trackOnce(eventName, payload) {
    window.dataLayer = window.dataLayer || [];

    const sessionId = payload && (payload.session_id || payload.checkout_session_id || "");
    const key = ["nm_track", eventName, sessionId || "no-session"].join(":");

    try {
      if (window.sessionStorage && window.sessionStorage.getItem(key)) return;
      if (hasDataLayerEvent(eventName, sessionId)) return;
      if (window.sessionStorage) window.sessionStorage.setItem(key, "1");
    } catch (_error) {
      if (hasDataLayerEvent(eventName, sessionId)) return;
    }

    window.dataLayer.push(Object.assign(
      { event: eventName },
      buildAnalyticsPayload(eventName, payload || {})
    ));
  }

  function installDesign() {
    if (document.getElementById("nm-checkout-pages-stable-v1")) return;

    const style = document.createElement("style");
    style.id = "nm-checkout-pages-stable-v1";
    style.textContent = `
      body.nm-checkout-enhanced {
        margin: 0 !important;
        min-height: 100vh !important;
        background: #f3f8fc !important;
        color: #102033 !important;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      body.nm-checkout-enhanced > :not(#nmCheckoutPage):not(script):not(style):not(noscript) {
        display: none !important;
      }

      .nm-checkout-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 28px 16px;
        box-sizing: border-box;
      }

      .nm-checkout-card {
        width: min(760px, 100%);
        border: 1px solid #dbe8f1;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 18px 45px rgba(16, 32, 51, 0.08);
        padding: clamp(28px, 5vw, 52px);
        text-align: center;
      }

      .nm-checkout-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 18px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        font-size: 28px;
        font-weight: 900;
      }

      .nm-checkout-icon.success {
        color: #fff;
        background: linear-gradient(135deg, #46d18a, #15a66d);
      }

      .nm-checkout-icon.cancel {
        color: #fff;
        background: linear-gradient(135deg, #ff8a34, #ff5b00);
      }

      .nm-checkout-card h1 {
        margin: 0 0 12px;
        font-size: clamp(30px, 4vw, 44px);
        line-height: 1.1;
        letter-spacing: 0;
        color: #102033;
      }

      .nm-checkout-lead {
        margin: 0 0 12px;
        font-size: 18px;
        line-height: 1.55;
        color: #24394d;
      }

      .nm-checkout-body {
        margin: 0 auto 28px;
        max-width: 580px;
        font-size: 15px;
        line-height: 1.65;
        color: #506780;
      }

      .nm-checkout-meta {
        display: inline-flex;
        max-width: 100%;
        margin: 0 0 24px;
        padding: 8px 12px;
        border-radius: 999px;
        background: #eef7fd;
        color: #32526f;
        font-size: 12px;
        line-height: 1.3;
        word-break: break-all;
      }

      .nm-checkout-next,
      .nm-report-status-panel {
        margin: 0 auto 24px;
        max-width: 620px;
        text-align: left;
        border: 1px solid #dbe8f1;
        border-radius: 16px;
        background: #f8fbfe;
        padding: 18px;
      }

      [dir="rtl"] .nm-checkout-next,
      [dir="rtl"] .nm-report-status-panel {
        text-align: right;
      }

      .nm-checkout-next h2,
      .nm-report-status-panel h2 {
        margin: 0 0 8px;
        font-size: 16px;
        line-height: 1.3;
        color: #102033;
      }

      .nm-checkout-next ol {
        margin: 10px 0 0;
        padding-left: 22px;
        color: #506780;
        font-size: 14px;
        line-height: 1.6;
      }

      [dir="rtl"] .nm-checkout-next ol {
        padding-left: 0;
        padding-right: 22px;
      }

      .nm-report-status-lead {
        margin: 0 0 14px;
        color: #506780;
        font-size: 13px;
        line-height: 1.55;
      }

      .nm-status-steps {
        display: grid;
        gap: 9px;
      }

      .nm-status-step {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: #fff;
        border: 1px solid #e6eef5;
      }

      .nm-status-step-main {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        color: #24394d;
        font-weight: 800;
        font-size: 13px;
      }

      .nm-status-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #cbd5e1;
        flex: 0 0 auto;
      }

      .nm-status-step[data-state="complete"] .nm-status-dot {
        background: #15a66d;
      }

      .nm-status-step[data-state="active"] .nm-status-dot {
        background: #1098d5;
        box-shadow: 0 0 0 4px rgba(16, 152, 213, 0.12);
      }

      .nm-status-step[data-state="failed"] .nm-status-dot {
        background: #ff5b00;
      }

      .nm-status-state {
        color: #506780;
        font-size: 12px;
        white-space: nowrap;
      }

      .nm-checkout-actions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .nm-checkout-button {
        appearance: none;
        border: 0;
        border-radius: 10px;
        background: #1098d5;
        color: #fff;
        font-weight: 800;
        font-size: 15px;
        line-height: 1;
        text-decoration: none;
        padding: 15px 19px;
        cursor: pointer;
        min-width: 136px;
      }

      .nm-checkout-button.secondary {
        background: #eef3f7;
        color: #102033;
      }

      .nm-checkout-button.dark {
        background: #102033;
        color: #fff;
      }

      .nm-checkout-button:disabled {
        opacity: .62;
        cursor: wait;
      }

      .nm-checkout-status {
        min-height: 20px;
        margin-top: 18px;
        color: #506780;
        font-size: 13px;
      }

      @media (max-width: 520px) {
        .nm-checkout-card {
          border-radius: 14px;
          padding: 26px 18px;
        }

        .nm-checkout-button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getHomeHref(lang) {
    if (lang === "hu") return "/";
    return "/" + lang;
  }

  function getStateLabel(copy, state) {
    if (state === "complete") return copy.stateComplete;
    if (state === "active") return copy.stateActive;
    if (state === "failed") return copy.stateFailed;
    return copy.statePending;
  }

  function getStageLabel(copy, key, fallback) {
    const labels = {
      payment: copy.statusPayment,
      analysis: copy.statusAnalysis,
      report: copy.statusReport,
      email: copy.statusEmail
    };

    return labels[key] || fallback || key;
  }

  function renderStatusSteps(copy, stages) {
    const safeStages = Array.isArray(stages) && stages.length
      ? stages
      : [
          { key: "payment", label: copy.statusPayment, state: "complete" },
          { key: "analysis", label: copy.statusAnalysis, state: "active" },
          { key: "report", label: copy.statusReport, state: "pending" },
          { key: "email", label: copy.statusEmail, state: "pending" }
        ];

    return safeStages.map((stage) => {
      const state = ["complete", "active", "pending", "failed"].includes(stage.state)
        ? stage.state
        : "pending";

      return `
        <div class="nm-status-step" data-state="${escapeHtml(state)}">
          <div class="nm-status-step-main">
            <span class="nm-status-dot" aria-hidden="true"></span>
            <span>${escapeHtml(getStageLabel(copy, stage.key, stage.label))}</span>
          </div>
          <span class="nm-status-state">${escapeHtml(getStateLabel(copy, state))}</span>
        </div>
      `;
    }).join("");
  }

  function getStatusMessage(copy, status) {
    if (!status) return copy.statusLoading;
    if (status.overall === "sent") return copy.statusSent;
    if (status.overall === "attention") return copy.statusAttention;
    return copy.reportStatusLead;
  }

  function renderSuccessExtras(copy) {
    const nextItems = Array.isArray(copy.nextItems) ? copy.nextItems : BASE_COPY.nextItems;

    return `
      <div class="nm-checkout-next">
        <h2>${escapeHtml(copy.nextTitle)}</h2>
        <ol>
          ${nextItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </div>
      <div class="nm-report-status-panel" id="nmReportStatusPanel">
        <h2>${escapeHtml(copy.reportStatusTitle)}</h2>
        <p class="nm-report-status-lead" id="nmReportStatusLead">${escapeHtml(copy.statusLoading)}</p>
        <div class="nm-status-steps" id="nmReportStatusSteps">
          ${renderStatusSteps(copy)}
        </div>
      </div>
    `;
  }

  function renderPage(kind, lang, sessionId) {
    const copy = getCopy(lang);
    const isSuccess = kind === "success";
    const root = document.getElementById("nmCheckoutPage") || document.createElement("main");
    const icon = isSuccess ? "&#10003;" : "!";

    root.id = "nmCheckoutPage";
    root.className = "nm-checkout-page";
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    root.innerHTML = `
      <section class="nm-checkout-card" aria-live="polite">
        <div class="nm-checkout-icon ${isSuccess ? "success" : "cancel"}" aria-hidden="true">${icon}</div>
        <h1>${escapeHtml(isSuccess ? copy.successTitle : copy.cancelTitle)}</h1>
        <p class="nm-checkout-lead">${escapeHtml(isSuccess ? copy.successLead : copy.cancelLead)}</p>
        <p class="nm-checkout-body">${escapeHtml(isSuccess ? copy.successBody : copy.cancelBody)}</p>
        ${sessionId ? `<div class="nm-checkout-meta">${escapeHtml(copy.sessionLabel)}: ${escapeHtml(sessionId)}</div>` : ""}
        ${isSuccess ? renderSuccessExtras(copy) : ""}
        <div class="nm-checkout-actions">
          <a class="nm-checkout-button dark" href="${escapeHtml(safeHref(getHomeHref(lang), "/"))}">${escapeHtml(copy.home)}</a>
          ${!isSuccess ? `<button class="nm-checkout-button" type="button" id="nmRetryCheckout">${escapeHtml(copy.retry)}</button>` : ""}
          <a class="nm-checkout-button secondary" href="${escapeHtml(safeHref(copy.supportHref, "mailto:info@neuromapkids.com"))}">${escapeHtml(copy.support)}</a>
        </div>
        <div class="nm-checkout-status" id="nmCheckoutStatus">${escapeHtml(copy.statusReady)}</div>
      </section>
    `;

    if (!root.parentNode) {
      document.body.prepend(root);
    }

    const retryButton = document.getElementById("nmRetryCheckout");
    if (retryButton) {
      retryButton.addEventListener("click", function () {
        retryCheckout(sessionId, copy);
      });
    }
  }

  async function loadReportStatus(sessionId, copy, attempt) {
    const lead = document.getElementById("nmReportStatusLead");
    const steps = document.getElementById("nmReportStatusSteps");

    if (!lead || !steps) return;

    if (!sessionId) {
      lead.textContent = copy.noSession;
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/session/status/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        credentials: "omit"
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data || !data.status) {
        throw new Error(copy.statusUnavailable);
      }

      lead.textContent = getStatusMessage(copy, data.status);
      steps.innerHTML = renderStatusSteps(copy, data.status.stages);

      trackOnce("nm_report_status_view", {
        checkout_session_id: sessionId || "",
        session_id: sessionId || "",
        report_status: data.status.overall || "",
        report_email_status: data.status.reportEmailStatus || "",
        lang: data.status.lang || "",
        source: "webflow_success_page",
        version: CHECKOUT_PAGES_VERSION
      });

      if (data.status.overall !== "sent" && data.status.overall !== "attention" && attempt < 5) {
        window.setTimeout(() => loadReportStatus(sessionId, copy, attempt + 1), 12000);
      }
    } catch (_error) {
      lead.textContent = copy.statusUnavailable;
    }
  }

  function setRuntimeStatus(message) {
    const el = document.getElementById("nmCheckoutStatus");
    if (el) el.textContent = message || "";
  }

  async function retryCheckout(sessionId, copy) {
    const button = document.getElementById("nmRetryCheckout");

    if (!sessionId) {
      setRuntimeStatus(copy.noSession);
      return;
    }

    try {
      if (button) button.disabled = true;
      setRuntimeStatus(copy.retrying);

      const response = await fetch(`${getApiBaseUrl()}/checkout/retry/${encodeURIComponent(sessionId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit"
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data && data.error ? data.error : copy.retryError);
      }

      const checkoutUrl = String(data && data.checkoutUrl ? data.checkoutUrl : "");

      try {
        new URL(checkoutUrl);
      } catch (_error) {
        throw new Error(copy.retryError);
      }

      trackOnce("checkout_retry_started", {
        checkout_session_id: sessionId,
        session_id: sessionId,
        source: "webflow_cancel_page",
        version: CHECKOUT_PAGES_VERSION
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      setRuntimeStatus(error && error.message ? error.message : copy.retryError);
      if (button) button.disabled = false;
    }
  }

  function trackPage(kind, lang, sessionId) {
    if (kind === "success") {
      trackOnce("purchase", {
        value: 5,
        currency: "USD",
        checkout_session_id: sessionId || "",
        session_id: sessionId || "",
        lang,
        source: "webflow_success_page",
        version: CHECKOUT_PAGES_VERSION,
        items: [
          {
            item_id: "neuromap_kids_report",
            item_name: "NeuroMap Kids report",
            price: 5,
            quantity: 1
          }
        ]
      });

      trackOnce("nm_checkout_success_view", {
        checkout_session_id: sessionId || "",
        session_id: sessionId || "",
        lang,
        source: "webflow_success_page",
        version: CHECKOUT_PAGES_VERSION
      });

      console.log("PURCHASE EVENT SENT", { sessionId, version: CHECKOUT_PAGES_VERSION });
      return;
    }

    trackOnce("checkout_cancelled", {
      checkout_session_id: sessionId || "",
      session_id: sessionId || "",
      lang,
      source: "webflow_cancel_page",
      version: CHECKOUT_PAGES_VERSION
    });
  }

  function init() {
    const kind = getPageKind();
    const lang = getLang();
    const sessionId = getSessionId(kind);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.add("nm-checkout-enhanced");

    installDesign();
    renderPage(kind, lang, sessionId);
    trackPage(kind, lang, sessionId);

    if (kind === "success") {
      loadReportStatus(sessionId, getCopy(lang), 1);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

/* =========================
   CHECKOUT SUCCESS/CANCEL PAGES - WEBFLOW STABLE V1
========================= */

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const CHECKOUT_PAGES_VERSION = "20260812-status-truth-v2";
  const STATUS_POLL_INTERVAL_MS = 12000;
  const STATUS_POLL_MAX_ATTEMPTS = 10;
  const ANALYTICS_SCHEMA_VERSION = "analytics-event-schema-v2";
  const ANALYTICS_CONSENT_KEY = "nm_analytics_consent_v1";
  const DEFAULT_API_BASE_URL = "https://neuromap-backend-production-969d.up.railway.app";
  const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  function installPrivacyDefaults() {
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
  }

  function isAnalyticsAllowed() {
    try {
      if (window.NM_LEGAL && typeof window.NM_LEGAL.isAnalyticsAllowed === "function") {
        return window.NM_LEGAL.isAnalyticsAllowed();
      }

      const parsed = JSON.parse(localStorage.getItem(ANALYTICS_CONSENT_KEY) || "null");
      return parsed && parsed.allowed === true;
    } catch (_error) {
      return false;
    }
  }

  const BASE_COPY = {
    home: "Home",
    retry: "Try payment again",
    retrying: "Opening checkout...",
    retryError: "Could not restart checkout. Please contact support.",
    support: "Contact support",
    supportHref: "mailto:info@neuromapkids.com",
    supportSubject: "NeuroMap Kids checkout support",
    supportBody: "Hello NeuroMap Kids team,\n\nI need help with my checkout/report.\n\nSession: {{sessionId}}\nPage: {{pageKind}}\nStatus: {{status}}\n\nThank you.",
    sessionLabel: "Session",
    statusReady: "The page is ready.",
    noSession: "Missing checkout session identifier.",
    copySession: "Copy session ID",
    copiedSession: "Session ID copied.",
    refreshStatus: "Refresh status",
    refreshingStatus: "Refreshing status...",
    lastCheckedLabel: "Last checked",
    statusEmailMasked: "Report email",
    statusSupportReference: "Support reference",
    deliveryEstimateTitle: "Estimated delivery",
    deliveryEstimateLoading: "We are checking the current report progress.",
    deliveryEstimateSoon: "Most reports arrive within a few minutes after payment. More complex reports can take a little longer.",
    deliveryEstimateQueued: "Your report is in the processing queue. This is normal right after payment.",
    deliveryEstimateDelayed: "This is taking longer than usual, but the automatic recovery checks are still watching it.",
    deliveryEstimateSent: "The report has been sent. Please check your inbox and Spam or Promotions folders.",
    deliveryEstimateAttention: "The report needs attention from the system. Support can use your session ID to check it quickly.",
    deliveryEstimateNoSession: "Without a session ID we cannot show live progress, but your payment confirmation email remains valid.",
    inboxChecklistTitle: "Before you refresh",
    inboxChecklistItems: [
      "Check the inbox connected to the email address you entered.",
      "Also check Spam, Promotions, Updates, or similar filtered folders.",
      "Keep this page open if you want to refresh the live report status."
    ],
    reportNoDoublePay: "You do not need to pay again while the report is processing.",
    liveStatusNote: "The status panel can be refreshed without repeating checkout.",
    statusShortcutTitle: "Want to watch progress?",
    statusShortcutBody: "The live status panel shows payment, analysis, PDF and email progress. It refreshes without repeating checkout.",
    statusShortcutButton: "Jump to report status",
    delayedHelpTitle: "If the email is delayed",
    delayedHelpItems: [
      "Wait a few minutes while the analysis and PDF generation finish.",
      "Check Spam, Promotions, or Updates folders.",
      "Send the support reference if the email has not arrived after several minutes."
    ],
    delayedHelpNote: "The system keeps retrying eligible report and email steps automatically.",
    pageTipTitle: "Good to know",
    successPageTip: "You can keep this page open and refresh the status without repeating the payment.",
    cancelPageTip: "The payment page can be reopened from this session, so you do not need to restart the questionnaire.",
    feedbackTitle: "Was this page helpful?",
    feedbackPositive: "Looks good",
    feedbackNeedHelp: "I need help",
    feedbackThanks: "Thanks for the feedback.",
    openingSupport: "Opening support email...",
    reportStatusTitle: "Report status",
    reportStatusLead: "We are preparing your personalized PDF and email.",
    statusLoading: "Checking report status...",
    statusUnavailable: "Live status could not be retrieved. Report delivery continues independently; check your email or refresh the status.",
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
    followUpTitle: "A gentle follow-up for the next few days",
    followUpBody: "When the report arrives, keep it nearby and choose one observation or suggestion to try first. Small, calm next steps are usually more useful than changing everything at once.",
    followUpItems: [
      "Read the first summary before the detailed sections.",
      "Mark one pattern that feels most recognizable.",
      "Try one practical suggestion for 2-3 days and notice what changes."
    ],
    cancelRecoveryTitle: "Your answers are safe",
    cancelRecoveryItems: [
      "No payment was completed and no charge was made.",
      "You can retry checkout without filling out the questionnaire again.",
      "If checkout still fails, send the session ID to support."
    ],
    cancelSafeNote: "The saved questionnaire session can be reopened from this page while the session is available.",
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
      supportSubject: "NeuroMap Kids fizet\u00e9si seg\u00edts\u00e9g",
      supportBody: "Szia NeuroMap Kids csapat,\n\nSeg\u00edts\u00e9get k\u00e9rek a fizet\u00e9ssel vagy a riporttal kapcsolatban.\n\nAzonos\u00edt\u00f3: {{sessionId}}\nOldal: {{pageKind}}\n\u00c1llapot: {{status}}\n\nK\u00f6sz\u00f6n\u00f6m.",
      sessionLabel: "Azonos\u00edt\u00f3",
      statusReady: "Az oldal k\u00e9szen \u00e1ll.",
      noSession: "Hi\u00e1nyzik a fizet\u00e9si azonos\u00edt\u00f3.",
      copySession: "Azonos\u00edt\u00f3 m\u00e1sol\u00e1sa",
      copiedSession: "Az azonos\u00edt\u00f3 m\u00e1solva.",
      refreshStatus: "\u00c1llapot friss\u00edt\u00e9se",
      refreshingStatus: "\u00c1llapot friss\u00edt\u00e9se...",
      lastCheckedLabel: "Utols\u00f3 ellen\u0151rz\u00e9s",
      statusEmailMasked: "Riport email",
      statusSupportReference: "Support hivatkoz\u00e1s",
      deliveryEstimateTitle: "V\u00e1rhat\u00f3 \u00e9rkez\u00e9s",
      deliveryEstimateLoading: "Ellen\u0151rizz\u00fck a riport aktu\u00e1lis \u00e1llapot\u00e1t.",
      deliveryEstimateSoon: "A legt\u00f6bb riport a fizet\u00e9s ut\u00e1n n\u00e9h\u00e1ny percen bel\u00fcl meg\u00e9rkezik. Az \u00f6sszetettebb riportok elk\u00e9sz\u00edt\u00e9se tov\u00e1bb tarthat.",
      deliveryEstimateQueued: "A riport feldolgoz\u00e1si sorban van. Ez k\u00f6zvetlen\u00fcl fizet\u00e9s ut\u00e1n norm\u00e1lis.",
      deliveryEstimateDelayed: "Ez most tov\u00e1bb tart a szok\u00e1sosn\u00e1l, de az automatikus helyre\u00e1ll\u00edt\u00e1si ellen\u0151rz\u00e9sek tov\u00e1bb figyelik.",
      deliveryEstimateSent: "A riport elk\u00fcldve. Ellen\u0151rizd a be\u00e9rkez\u0151, Spam \u00e9s Prom\u00f3ci\u00f3k mapp\u00e1t is.",
      deliveryEstimateAttention: "A riport figyelmet ig\u00e9nyel a rendszert\u0151l. A support az azonos\u00edt\u00f3 alapj\u00e1n gyorsabban r\u00e1 tud n\u00e9zni.",
      deliveryEstimateNoSession: "\u00c9l\u0151 \u00e1llapotot azonos\u00edt\u00f3 n\u00e9lk\u00fcl nem tudunk mutatni, de a fizet\u00e9si visszaigazol\u00e1s \u00e9rv\u00e9nyes.",
      inboxChecklistTitle: "Miel\u0151tt friss\u00edten\u00e9l",
      inboxChecklistItems: [
        "Ellen\u0151rizd azt a be\u00e9rkez\u0151 mapp\u00e1t, amelyik email c\u00edmet a k\u00e9rd\u0151\u00edvben megadtad.",
        "N\u00e9zd meg a Spam, Prom\u00f3ci\u00f3k, Friss\u00edt\u00e9sek vagy hasonl\u00f3 sz\u0171rt mapp\u00e1kat is.",
        "Hagyd nyitva ezt az oldalt, ha szeretn\u00e9d friss\u00edteni az \u00e9l\u0151 riport\u00e1llapotot."
      ],
      reportNoDoublePay: "Nem kell \u00fajra fizetned, am\u00edg a riport feldolgoz\u00e1sa folyamatban van.",
      liveStatusNote: "Az \u00e1llapotpanel a checkout ism\u00e9tl\u00e9se n\u00e9lk\u00fcl friss\u00edthet\u0151.",
      statusShortcutTitle: "Szeretn\u00e9d k\u00f6vetni a folyamatot?",
      statusShortcutBody: "Az \u00e9l\u0151 \u00e1llapotpanel mutatja a fizet\u00e9s, elemz\u00e9s, PDF \u00e9s email l\u00e9p\u00e9seit. Friss\u00edthet\u0151 an\u00e9lk\u00fcl, hogy \u00fajra fizetn\u00e9l.",
      statusShortcutButton: "Ugr\u00e1s a riport \u00e1llapot\u00e1hoz",
      delayedHelpTitle: "Ha k\u00e9sik az email",
      delayedHelpItems: [
        "V\u00e1rj n\u00e9h\u00e1ny percet, am\u00edg az elemz\u00e9s \u00e9s a PDF gener\u00e1l\u00e1s befejez\u0151dik.",
        "N\u00e9zd meg a Spam, Prom\u00f3ci\u00f3k vagy Friss\u00edt\u00e9sek mapp\u00e1t is.",
        "Ha t\u00f6bb perc ut\u00e1n sem \u00e9rkezik meg, k\u00fcldd el a support hivatkoz\u00e1st."
      ],
      delayedHelpNote: "A rendszer az alkalmas riport- \u00e9s email-l\u00e9p\u00e9seket automatikusan \u00fajrapr\u00f3b\u00e1lja.",
      pageTipTitle: "J\u00f3 tudni",
      successPageTip: "Ezt az oldalt nyitva hagyhatod, \u00e9s fizet\u00e9s ism\u00e9tl\u00e9se n\u00e9lk\u00fcl friss\u00edtheted az \u00e1llapotot.",
      cancelPageTip: "A fizet\u00e9si oldal ebb\u0151l a sessionb\u0151l \u00fajranyithat\u00f3, ez\u00e9rt nem kell el\u00f6lr\u0151l kezdened a k\u00e9rd\u0151\u00edvet.",
      feedbackTitle: "Hasznos volt ez az oldal?",
      feedbackPositive: "Rendben van",
      feedbackNeedHelp: "Seg\u00edts\u00e9get k\u00e9rek",
      feedbackThanks: "K\u00f6sz\u00f6nj\u00fck a visszajelz\u00e9st.",
      openingSupport: "Support email megnyit\u00e1sa...",
      reportStatusTitle: "Riport \u00e1llapota",
      reportStatusLead: "K\u00e9sz\u00edtj\u00fck a szem\u00e9lyre szabott PDF-et \u00e9s az emailt.",
      statusLoading: "Riport \u00e1llapot ellen\u0151rz\u00e9se...",
      statusUnavailable: "Az \u00e9l\u0151 \u00e1llapotot most nem siker\u00fclt lek\u00e9rni. A riport k\u00e9zbes\u00edt\u00e9se ett\u0151l f\u00fcggetlen\u00fcl folytat\u00f3dik; ellen\u0151rizd az emailedet, vagy friss\u00edtsd az \u00e1llapotot.",
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
      followUpTitle: "K\u00edm\u00e9letes ut\u00f3k\u00f6vet\u00e9s a k\u00f6vetkez\u0151 napokra",
      followUpBody: "Amikor meg\u00e9rkezik a riport, tartsd k\u00e9zn\u00e9l, \u00e9s el\u0151sz\u00f6r csak egy megfigyel\u00e9st vagy javaslatot v\u00e1lassz ki. A kis, nyugodt l\u00e9p\u00e9sek \u00e1ltal\u00e1ban hasznosabbak, mint ha mindent egyszerre pr\u00f3b\u00e1ln\u00e1l megv\u00e1ltoztatni.",
      followUpItems: [
        "El\u0151sz\u00f6r a gyors \u00f6sszefoglal\u00f3t olvasd el, csak ut\u00e1na a r\u00e9szleteket.",
        "Jel\u00f6ld meg azt az egy mint\u00e1t, ami a legink\u00e1bb ismer\u0151snek t\u0171nik.",
        "Pr\u00f3b\u00e1lj ki egy gyakorlati javaslatot 2-3 napig, \u00e9s figyeld, mi v\u00e1ltozik."
      ],
      cancelRecoveryTitle: "A v\u00e1laszaid biztons\u00e1gban vannak",
      cancelRecoveryItems: [
        "A fizet\u00e9s nem fejez\u0151d\u00f6tt be, \u00edgy nem t\u00f6rt\u00e9nt terhel\u00e9s.",
        "\u00dajraind\u00edthatod a fizet\u00e9st an\u00e9lk\u00fcl, hogy \u00fajra ki kellene t\u00f6ltened a k\u00e9rd\u0151\u00edvet.",
        "Ha a fizet\u00e9s tov\u00e1bbra sem indul, k\u00fcldd el az azonos\u00edt\u00f3t az \u00fcgyf\u00e9lszolg\u00e1latnak."
      ],
      cancelSafeNote: "A mentett k\u00e9rd\u0151\u00edv session err\u0151l az oldalr\u00f3l \u00fajraind\u00edthat\u00f3, am\u00edg a session el\u00e9rhet\u0151.",
      successTitle: "K\u00f6sz\u00f6nj\u00fck! A fizet\u00e9s sikeres volt.",
      successLead: "A szem\u00e9lyre szabott NeuroMap Kids riport elk\u00e9sz\u00edt\u00e9se elindult.",
      successBody: "A r\u00e9szletes \u00e9rt\u00e9kel\u00e9s \u00e9s a PDF riport emailben \u00e9rkezik. Az elk\u00e9sz\u00edt\u00e9s \u00e1ltal\u00e1ban n\u00e9h\u00e1ny percet vesz ig\u00e9nybe, az \u00f6sszetettebb riportokn\u00e1l pedig tov\u00e1bb tarthat.",
      cancelTitle: "A fizet\u00e9s nem fejez\u0151d\u00f6tt be",
      cancelLead: "Nem t\u00f6rt\u00e9nt terhel\u00e9s.",
      cancelBody: "Innen biztons\u00e1gosan visszat\u00e9rhetsz a k\u00e9rd\u0151\u00edvhez, vagy \u00fajraind\u00edthatod a fizet\u00e9st."
    },
    en: {
      successTitle: "Payment successful",
      successLead: "Thank you. Your purchase was successful.",
      successBody: "The detailed parent-friendly report and PDF will be sent by email. Preparation usually takes a few minutes, while more complex reports can take longer.",
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
      cancelBody: "Du kannst zurückkehren oder die Zahlung erneut versuchen."
    },
    it: {
      home: "Home",
      retry: "Riprova il pagamento",
      retrying: "Apertura del checkout...",
      retryError: "Impossibile riavviare il pagamento.",
      support: "Contatta il supporto",
      successTitle: "Pagamento riuscito",
      successLead: "Grazie. Il tuo acquisto è riuscito.",
      successBody: "Il report dettagliato e il PDF saranno inviati via email.",
      cancelTitle: "Pagamento non completato",
      cancelLead: "Non è stato effettuato alcun addebito.",
      cancelBody: "Puoi tornare al questionario o riprovare il pagamento."
    },
    es: {
      home: "Inicio",
      retry: "Intentar pago otra vez",
      retrying: "Abriendo checkout...",
      retryError: "No se pudo reiniciar el pago.",
      support: "Contactar soporte",
      successTitle: "Pago realizado correctamente",
      successLead: "Gracias. Tu compra se completó correctamente.",
      successBody: "El informe detallado y el PDF se enviarán por email.",
      cancelTitle: "Pago no completado",
      cancelLead: "No se realizó ningún cargo.",
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
      home: "Strona główna",
      retry: "Spróbuj zapłacić ponownie",
      retrying: "Otwieranie płatności...",
      retryError: "Nie udało się ponownie uruchomić płatności.",
      support: "Kontakt z supportem",
      successTitle: "Płatność zakończona sukcesem",
      successLead: "Dziękujemy. Zakup został zakończony pomyślnie.",
      successBody: "Szczegółowy raport i PDF zostaną wysłane emailem.",
      cancelTitle: "Płatność nie została ukończona",
      cancelLead: "Nie pobrano opłaty.",
      cancelBody: "Możesz wrócić do ankiety albo ponowić płatność."
    },
    pt: {
      home: "Início",
      retry: "Tentar pagamento novamente",
      retrying: "Abrindo checkout...",
      retryError: "Não foi possível reiniciar o pagamento.",
      support: "Contactar suporte",
      successTitle: "Pagamento concluído",
      successLead: "Obrigado. A compra foi concluída com sucesso.",
      successBody: "O relatório detalhado e o PDF serão enviados por email.",
      cancelTitle: "Pagamento não concluído",
      cancelLead: "Nenhuma cobrança foi feita.",
      cancelBody: "Você pode voltar ao questionário ou tentar o pagamento novamente."
    },
    fr: {
      home: "Accueil",
      retry: "Réessayer le paiement",
      retrying: "Ouverture du paiement...",
      retryError: "Impossible de relancer le paiement.",
      support: "Contacter le support",
      successTitle: "Paiement réussi",
      successLead: "Merci. Votre achat a réussi.",
      successBody: "Le rapport détaillé et le PDF seront envoyés par email.",
      cancelTitle: "Paiement non terminé",
      cancelLead: "Aucun montant n'a été débité.",
      cancelBody: "Vous pouvez revenir au questionnaire ou réessayer le paiement."
    }
  };

  const CUSTOMER_JOURNEY_COPY = {
    hu: {
      locale: "hu-HU",
      supportSubject: "NeuroMap Kids fizetési segítség",
      supportBody: "Szia NeuroMap Kids csapat!\n\nSegítséget kérek a fizetéssel vagy a riporttal kapcsolatban.\n\nAzonosító: {{sessionId}}\nOldal: {{pageKind}}\nÁllapot: {{status}}\n\nKöszönöm.",
      successBody: "A részletes értékelést és a PDF riportot emailben küldjük. Ez általában néhány percet vesz igénybe; összetettebb feldolgozás esetén tovább tarthat.",
      session: {
        label: "Azonosító", ready: "Az oldal készen áll.", missing: "Hiányzik a fizetési azonosító.",
        copy: "Azonosító másolása", copied: "Az azonosító másolva.", refresh: "Állapot frissítése",
        refreshing: "Állapot frissítése...", checked: "Utolsó ellenőrzés", email: "Riport email", reference: "Ügyfélszolgálati hivatkozás"
      },
      delivery: {
        title: "Várható érkezés", loading: "Ellenőrizzük a riport aktuális állapotát.",
        soon: "A riport általában néhány percen belül megérkezik; összetettebb feldolgozás esetén ez tovább tarthat.",
        queued: "A riport feldolgozási sorban van. Ez közvetlenül fizetés után normális.",
        delayed: "A feldolgozás most tovább tart a szokásosnál. Az automatikus ellenőrzések tovább figyelik.",
        sent: "A riportot elküldtük. Ellenőrizd a Beérkezett üzenetek, a Spam és a Promóciók mappát is.",
        attention: "A riport kézi ellenőrzést igényelhet. Az ügyfélszolgálat az azonosító alapján gyorsan utánanézhet.",
        missing: "Azonosító nélkül nem tudunk élő állapotot mutatni, de a fizetési visszaigazolás továbbra is érvényes."
      },
      status: {
        title: "Riport állapota", lead: "Készítjük a személyre szabott PDF-et és az emailt.", loading: "Riportállapot ellenőrzése...",
        unavailable: "Az élő állapotot most nem sikerült lekérni. A riport kézbesítése ettől függetlenül folytatódik; ellenőrizd az emailedet, vagy frissítsd az állapotot.", sent: "A riport emailt elküldtük.",
        attention: "A riport ellenőrzést igényel. Az automatikus újrapróbálkozás tovább fut.",
        payment: "Fizetés", analysis: "Elemzés", report: "PDF riport", email: "Email",
        complete: "Kész", active: "Folyamatban", pending: "Várakozik", failed: "Figyelmet igényel"
      },
      next: {
        title: "Mi történik most?",
        items: ["Elkészítjük a személyre szabott értelmezést.", "Létrehozzuk a PDF riportot.", "A riportot a megadott email-címre küldjük."]
      },
      cancel: {
        title: "A válaszaid biztonságban vannak",
        items: ["A fizetés nem fejeződött be, ezért nem történt terhelés.", "A fizetést a kérdőív újbóli kitöltése nélkül újraindíthatod.", "Ha továbbra sem sikerül, küldd el az azonosítót az ügyfélszolgálatnak."],
        note: "A mentett kérdőív erről az oldalról újranyitható, amíg a munkamenet elérhető."
      }
    },
    en: {
      locale: "en-US",
      supportSubject: "NeuroMap Kids checkout support",
      supportBody: "Hello NeuroMap Kids team,\n\nI need help with my checkout or report.\n\nSession: {{sessionId}}\nPage: {{pageKind}}\nStatus: {{status}}\n\nThank you.",
      successBody: "We will send the detailed assessment and PDF report by email. This usually takes a few minutes; more complex processing may take longer.",
      session: {
        label: "Session", ready: "The page is ready.", missing: "The checkout session ID is missing.", copy: "Copy session ID",
        copied: "Session ID copied.", refresh: "Refresh status", refreshing: "Refreshing status...", checked: "Last checked",
        email: "Report email", reference: "Support reference"
      },
      delivery: {
        title: "Estimated delivery", loading: "We are checking the current report progress.",
        soon: "Reports usually arrive within a few minutes; more complex processing may take longer.",
        queued: "Your report is in the processing queue. This is normal just after payment.",
        delayed: "Processing is taking longer than usual. Automatic checks are still monitoring it.",
        sent: "The report has been sent. Please also check Spam or Promotions.",
        attention: "The report may need a manual check. Support can investigate quickly using the session ID.",
        missing: "Without a session ID we cannot show live progress, but your payment confirmation remains valid."
      },
      status: {
        title: "Report status", lead: "We are preparing your personalized PDF and email.", loading: "Checking report status...",
        unavailable: "Live status could not be retrieved. Report delivery continues independently; check your email or refresh the status.", sent: "Your report email has been sent.",
        attention: "The report needs a check. Automatic retries are still running.", payment: "Payment", analysis: "Analysis",
        report: "PDF report", email: "Email", complete: "Done", active: "In progress", pending: "Waiting", failed: "Needs attention"
      },
      next: {
        title: "What happens next?",
        items: ["We prepare the personalized interpretation.", "We generate the PDF report.", "We send the report to the email address you provided."]
      },
      cancel: {
        title: "Your answers are safe",
        items: ["Payment was not completed, so no charge was made.", "You can retry payment without completing the questionnaire again.", "If it still fails, send the session ID to support."],
        note: "The saved questionnaire can be reopened from this page while the session remains available."
      }
    },
    de: {
      locale: "de-DE",
      supportSubject: "NeuroMap Kids Hilfe bei Zahlung oder Bericht",
      supportBody: "Hallo NeuroMap Kids Team,\n\nich brauche Hilfe bei der Zahlung oder beim Bericht.\n\nSitzung: {{sessionId}}\nSeite: {{pageKind}}\nStatus: {{status}}\n\nVielen Dank.",
      successBody: "Wir senden die ausführliche Auswertung und den PDF-Bericht per E-Mail. Das dauert meist wenige Minuten; eine komplexere Verarbeitung kann länger dauern.",
      session: {
        label: "Sitzung", ready: "Die Seite ist bereit.", missing: "Die Zahlungskennung fehlt.", copy: "Sitzungs-ID kopieren",
        copied: "Sitzungs-ID kopiert.", refresh: "Status aktualisieren", refreshing: "Status wird aktualisiert...", checked: "Zuletzt geprüft",
        email: "Berichts-E-Mail", reference: "Support-Referenz"
      },
      delivery: {
        title: "Voraussichtliche Zustellung", loading: "Wir prüfen den aktuellen Stand des Berichts.",
        soon: "Berichte treffen meist innerhalb weniger Minuten ein; eine komplexere Verarbeitung kann länger dauern.",
        queued: "Der Bericht befindet sich in der Warteschlange. Direkt nach der Zahlung ist das normal.",
        delayed: "Die Verarbeitung dauert länger als üblich. Automatische Prüfungen laufen weiter.",
        sent: "Der Bericht wurde gesendet. Bitte prüfe auch Spam und Werbung.",
        attention: "Der Bericht muss möglicherweise manuell geprüft werden. Der Support kann ihn mit der Sitzungs-ID schnell finden.",
        missing: "Ohne Sitzungs-ID können wir keinen Live-Status anzeigen; die Zahlungsbestätigung bleibt gültig."
      },
      status: {
        title: "Berichtsstatus", lead: "Wir erstellen dein persönliches PDF und die E-Mail.", loading: "Berichtsstatus wird geprüft...",
        unavailable: "Der Live-Status konnte nicht abgerufen werden. Die Zustellung läuft unabhängig davon weiter; prüfe deine E-Mails oder aktualisiere den Status.", sent: "Die Berichts-E-Mail wurde gesendet.",
        attention: "Der Bericht muss geprüft werden. Automatische Wiederholungen laufen weiter.", payment: "Zahlung", analysis: "Auswertung",
        report: "PDF-Bericht", email: "E-Mail", complete: "Fertig", active: "In Bearbeitung", pending: "Wartet", failed: "Prüfung nötig"
      },
      next: { title: "Wie geht es weiter?", items: ["Wir erstellen die persönliche Auswertung.", "Wir erzeugen den PDF-Bericht.", "Wir senden den Bericht an die angegebene E-Mail-Adresse."] },
      cancel: {
        title: "Deine Antworten sind sicher", items: ["Die Zahlung wurde nicht abgeschlossen; es erfolgte keine Belastung.", "Du kannst die Zahlung wiederholen, ohne den Fragebogen erneut auszufüllen.", "Wenn es weiterhin nicht klappt, sende die Sitzungs-ID an den Support."],
        note: "Der gespeicherte Fragebogen kann von dieser Seite erneut geöffnet werden, solange die Sitzung verfügbar ist."
      }
    },
    it: {
      locale: "it-IT",
      supportSubject: "Assistenza NeuroMap Kids per pagamento o report",
      supportBody: "Ciao team NeuroMap Kids,\n\nho bisogno di aiuto con il pagamento o il report.\n\nSessione: {{sessionId}}\nPagina: {{pageKind}}\nStato: {{status}}\n\nGrazie.",
      successBody: "Invieremo via email la valutazione dettagliata e il report PDF. Di solito servono pochi minuti; elaborazioni più complesse possono richiedere più tempo.",
      session: {
        label: "Sessione", ready: "La pagina è pronta.", missing: "Manca l'identificativo della sessione di pagamento.", copy: "Copia ID sessione",
        copied: "ID sessione copiato.", refresh: "Aggiorna stato", refreshing: "Aggiornamento in corso...", checked: "Ultimo controllo",
        email: "Email del report", reference: "Riferimento assistenza"
      },
      delivery: {
        title: "Consegna prevista", loading: "Stiamo controllando lo stato attuale del report.",
        soon: "I report arrivano di solito entro pochi minuti; elaborazioni più complesse possono richiedere più tempo.",
        queued: "Il report è in coda di elaborazione. È normale subito dopo il pagamento.",
        delayed: "L'elaborazione richiede più tempo del solito. I controlli automatici continuano.",
        sent: "Il report è stato inviato. Controlla anche Spam o Promozioni.",
        attention: "Il report potrebbe richiedere un controllo manuale. L'assistenza può verificarlo rapidamente con l'ID sessione.",
        missing: "Senza ID sessione non possiamo mostrare lo stato in tempo reale, ma la conferma di pagamento resta valida."
      },
      status: {
        title: "Stato del report", lead: "Stiamo preparando il PDF personalizzato e l'email.", loading: "Controllo dello stato...",
        unavailable: "Non è stato possibile recuperare lo stato in tempo reale. La consegna continua comunque; controlla l'email o aggiorna lo stato.", sent: "L'email con il report è stata inviata.",
        attention: "Il report richiede un controllo. I tentativi automatici continuano.", payment: "Pagamento", analysis: "Analisi",
        report: "Report PDF", email: "Email", complete: "Completato", active: "In corso", pending: "In attesa", failed: "Richiede attenzione"
      },
      next: { title: "Cosa succede ora?", items: ["Prepariamo l'interpretazione personalizzata.", "Generiamo il report PDF.", "Invieremo il report all'indirizzo email indicato."] },
      cancel: {
        title: "Le tue risposte sono al sicuro", items: ["Il pagamento non è stato completato e non è stato effettuato alcun addebito.", "Puoi riprovare senza compilare di nuovo il questionario.", "Se il problema continua, invia l'ID sessione all'assistenza."],
        note: "Il questionario salvato può essere riaperto da questa pagina finché la sessione è disponibile."
      }
    },
    es: {
      locale: "es-ES",
      supportSubject: "Ayuda de NeuroMap Kids con el pago o el informe",
      supportBody: "Hola, equipo de NeuroMap Kids:\n\nNecesito ayuda con el pago o el informe.\n\nSesión: {{sessionId}}\nPágina: {{pageKind}}\nEstado: {{status}}\n\nGracias.",
      successBody: "Enviaremos por email la evaluación detallada y el informe PDF. Normalmente tarda unos minutos; un procesamiento más complejo puede tardar más.",
      session: {
        label: "Sesión", ready: "La página está lista.", missing: "Falta el identificador de la sesión de pago.", copy: "Copiar ID de sesión",
        copied: "ID de sesión copiado.", refresh: "Actualizar estado", refreshing: "Actualizando estado...", checked: "Última comprobación",
        email: "Email del informe", reference: "Referencia de soporte"
      },
      delivery: {
        title: "Entrega estimada", loading: "Estamos comprobando el progreso actual del informe.",
        soon: "Los informes suelen llegar en pocos minutos; un procesamiento más complejo puede tardar más.",
        queued: "El informe está en la cola de procesamiento. Es normal justo después del pago.",
        delayed: "El procesamiento tarda más de lo habitual. Las comprobaciones automáticas continúan.",
        sent: "El informe se ha enviado. Revisa también Spam o Promociones.",
        attention: "El informe puede necesitar una revisión manual. Soporte puede localizarlo con el ID de sesión.",
        missing: "Sin ID de sesión no podemos mostrar el estado en vivo, pero la confirmación de pago sigue siendo válida."
      },
      status: {
        title: "Estado del informe", lead: "Estamos preparando el PDF personalizado y el email.", loading: "Comprobando el estado...",
        unavailable: "No se pudo consultar el estado en tiempo real. La entrega continúa de forma independiente; revisa tu email o actualiza el estado.", sent: "El email del informe se ha enviado.",
        attention: "El informe necesita revisión. Los reintentos automáticos continúan.", payment: "Pago", analysis: "Análisis",
        report: "Informe PDF", email: "Email", complete: "Listo", active: "En curso", pending: "En espera", failed: "Requiere atención"
      },
      next: { title: "¿Qué ocurre ahora?", items: ["Preparamos la interpretación personalizada.", "Generamos el informe PDF.", "Enviamos el informe al email indicado."] },
      cancel: {
        title: "Tus respuestas están seguras", items: ["El pago no se completó y no se realizó ningún cargo.", "Puedes volver a intentarlo sin rellenar otra vez el cuestionario.", "Si sigue fallando, envía el ID de sesión a soporte."],
        note: "El cuestionario guardado puede reabrirse desde esta página mientras la sesión esté disponible."
      }
    },
    zh: {
      locale: "zh-CN",
      supportSubject: "NeuroMap Kids 支付或报告支持",
      supportBody: "NeuroMap Kids 团队：\n\n我需要支付或报告方面的帮助。\n\n会话：{{sessionId}}\n页面：{{pageKind}}\n状态：{{status}}\n\n谢谢。",
      successBody: "详细评估和 PDF 报告将通过电子邮件发送。通常需要几分钟；较复杂的处理可能需要更长时间。",
      session: {
        label: "会话", ready: "页面已准备就绪。", missing: "缺少支付会话标识。", copy: "复制会话标识", copied: "会话标识已复制。",
        refresh: "刷新状态", refreshing: "正在刷新状态…", checked: "上次检查", email: "报告邮箱", reference: "客服参考编号"
      },
      delivery: {
        title: "预计送达", loading: "正在检查报告的当前进度。", soon: "报告通常会在几分钟内送达；较复杂的处理可能需要更长时间。",
        queued: "报告正在处理队列中。付款后出现此状态是正常的。", delayed: "处理时间比平时更长，自动检查仍在继续。",
        sent: "报告已发送。请同时检查垃圾邮件或推广邮件文件夹。", attention: "报告可能需要人工检查。客服可通过会话标识快速查询。",
        missing: "没有会话标识时无法显示实时进度，但付款确认仍然有效。"
      },
      status: {
        title: "报告状态", lead: "正在准备个性化 PDF 和电子邮件。", loading: "正在检查报告状态…", unavailable: "暂时无法获取实时状态。报告发送会独立继续；请检查电子邮件或刷新状态。",
        sent: "报告邮件已发送。", attention: "报告需要检查，系统仍在自动重试。", payment: "付款", analysis: "分析", report: "PDF 报告",
        email: "电子邮件", complete: "完成", active: "处理中", pending: "等待中", failed: "需要处理"
      },
      next: { title: "接下来会怎样？", items: ["准备个性化解读。", "生成 PDF 报告。", "将报告发送到您提供的电子邮箱。"] },
      cancel: {
        title: "您的回答已安全保存", items: ["付款未完成，因此没有扣款。", "无需重新填写问卷即可再次尝试付款。", "如果仍有问题，请将会话标识发送给客服。"],
        note: "只要会话仍然有效，就可以从此页面重新打开已保存的问卷。"
      }
    },
    ja: {
      locale: "ja-JP",
      supportSubject: "NeuroMap Kids 決済・レポートのサポート",
      supportBody: "NeuroMap Kids チームへ\n\n決済またはレポートについてサポートをお願いします。\n\nセッション：{{sessionId}}\nページ：{{pageKind}}\n状態：{{status}}\n\nよろしくお願いします。",
      successBody: "詳細な評価と PDF レポートをメールでお送りします。通常は数分かかり、処理が複雑な場合はさらに時間がかかることがあります。",
      session: {
        label: "セッション", ready: "ページの準備ができました。", missing: "決済セッションIDがありません。", copy: "セッションIDをコピー",
        copied: "セッションIDをコピーしました。", refresh: "状態を更新", refreshing: "状態を更新しています…", checked: "最終確認",
        email: "レポート送信先", reference: "サポート参照番号"
      },
      delivery: {
        title: "配信予定", loading: "現在のレポート進捗を確認しています。", soon: "レポートは通常数分で届きますが、処理が複雑な場合はさらに時間がかかることがあります。",
        queued: "レポートは処理待ちです。決済直後は通常の状態です。", delayed: "通常より処理に時間がかかっています。自動確認は継続しています。",
        sent: "レポートを送信しました。迷惑メールやプロモーションもご確認ください。", attention: "手動確認が必要な場合があります。サポートはセッションIDで迅速に確認できます。",
        missing: "セッションIDがないため進捗を表示できませんが、決済確認は有効です。"
      },
      status: {
        title: "レポートの状態", lead: "個別の PDF とメールを準備しています。", loading: "レポートの状態を確認しています…",
        unavailable: "現在、リアルタイムの状態を取得できません。レポートの送信は継続されます。メールを確認するか、状態を更新してください。", sent: "レポートメールを送信しました。",
        attention: "レポートの確認が必要です。自動再試行は継続しています。", payment: "決済", analysis: "分析", report: "PDF レポート",
        email: "メール", complete: "完了", active: "処理中", pending: "待機中", failed: "確認が必要"
      },
      next: { title: "次に行われること", items: ["個別の解釈を作成します。", "PDF レポートを生成します。", "入力したメールアドレスへ送信します。"] },
      cancel: {
        title: "回答は安全に保存されています", items: ["決済は完了しておらず、請求も発生していません。", "質問票を再入力せずに決済をやり直せます。", "解決しない場合はセッションIDをサポートへお知らせください。"],
        note: "セッションが有効な間は、このページから保存済みの質問票を再度開けます。"
      }
    },
    ar: {
      locale: "ar",
      supportSubject: "دعم NeuroMap Kids للدفع أو التقرير",
      supportBody: "فريق NeuroMap Kids،\n\nأحتاج إلى مساعدة بشأن الدفع أو التقرير.\n\nالجلسة: {{sessionId}}\nالصفحة: {{pageKind}}\nالحالة: {{status}}\n\nشكرا لكم.",
      successBody: "سنرسل التقييم المفصل وتقرير PDF عبر البريد الإلكتروني. يستغرق ذلك عادة بضع دقائق، وقد تستغرق المعالجة الأكثر تعقيدا وقتا أطول.",
      session: {
        label: "الجلسة", ready: "الصفحة جاهزة.", missing: "معرف جلسة الدفع مفقود.", copy: "نسخ معرف الجلسة", copied: "تم نسخ معرف الجلسة.",
        refresh: "تحديث الحالة", refreshing: "جار تحديث الحالة...", checked: "آخر فحص", email: "بريد التقرير", reference: "مرجع الدعم"
      },
      delivery: {
        title: "موعد الوصول المتوقع", loading: "نتحقق من تقدم التقرير حاليا.", soon: "تصل التقارير عادة خلال بضع دقائق، وقد تستغرق المعالجة الأكثر تعقيدا وقتا أطول.",
        queued: "التقرير في قائمة المعالجة. هذا طبيعي بعد الدفع مباشرة.", delayed: "تستغرق المعالجة وقتا أطول من المعتاد، وما زالت الفحوص التلقائية مستمرة.",
        sent: "تم إرسال التقرير. يرجى فحص مجلد الرسائل غير المرغوب فيها أو العروض أيضا.", attention: "قد يحتاج التقرير إلى مراجعة يدوية. يستطيع الدعم التحقق منه عبر معرف الجلسة.",
        missing: "لا يمكن عرض التقدم المباشر دون معرف الجلسة، لكن تأكيد الدفع يظل صالحا."
      },
      status: {
        title: "حالة التقرير", lead: "نجهز ملف PDF المخصص والبريد الإلكتروني.", loading: "جار التحقق من حالة التقرير...",
        unavailable: "تعذر جلب الحالة المباشرة الآن. يستمر إرسال التقرير بشكل مستقل؛ تحقق من بريدك الإلكتروني أو حدّث الحالة.", sent: "تم إرسال بريد التقرير.",
        attention: "يحتاج التقرير إلى مراجعة. تستمر المحاولات التلقائية.", payment: "الدفع", analysis: "التحليل", report: "تقرير PDF",
        email: "البريد الإلكتروني", complete: "مكتمل", active: "قيد التنفيذ", pending: "قيد الانتظار", failed: "يحتاج إلى متابعة"
      },
      next: { title: "ماذا يحدث الآن؟", items: ["نعد التفسير المخصص.", "ننشىء تقرير PDF.", "نرسل التقرير إلى البريد الإلكتروني الذي قدمته."] },
      cancel: {
        title: "إجاباتك محفوظة بأمان", items: ["لم تكتمل عملية الدفع، لذلك لم يتم الخصم.", "يمكنك إعادة محاولة الدفع دون تعبئة الاستبيان مرة أخرى.", "إذا استمرت المشكلة، أرسل معرف الجلسة إلى الدعم."],
        note: "يمكن فتح الاستبيان المحفوظ من هذه الصفحة ما دامت الجلسة متاحة."
      }
    },
    pl: {
      locale: "pl-PL",
      supportSubject: "Pomoc NeuroMap Kids dotycząca płatności lub raportu",
      supportBody: "Dzień dobry,\n\npotrzebuję pomocy z płatnością lub raportem.\n\nSesja: {{sessionId}}\nStrona: {{pageKind}}\nStatus: {{status}}\n\nDziękuję.",
      successBody: "Szczegółową ocenę i raport PDF wyślemy emailem. Zwykle zajmuje to kilka minut; bardziej złożone przetwarzanie może potrwać dłużej.",
      session: {
        label: "Sesja", ready: "Strona jest gotowa.", missing: "Brakuje identyfikatora sesji płatności.", copy: "Kopiuj ID sesji",
        copied: "ID sesji skopiowane.", refresh: "Odśwież status", refreshing: "Odświeżanie statusu...", checked: "Ostatnia kontrola",
        email: "Email raportu", reference: "Numer dla pomocy"
      },
      delivery: {
        title: "Przewidywane dostarczenie", loading: "Sprawdzamy aktualny postęp raportu.",
        soon: "Raport zwykle dociera w ciągu kilku minut; bardziej złożone przetwarzanie może potrwać dłużej.",
        queued: "Raport jest w kolejce przetwarzania. To normalne tuż po płatności.", delayed: "Przetwarzanie trwa dłużej niż zwykle. Automatyczne kontrole nadal działają.",
        sent: "Raport został wysłany. Sprawdź także Spam lub Oferty.", attention: "Raport może wymagać ręcznej kontroli. Pomoc szybko go znajdzie po ID sesji.",
        missing: "Bez ID sesji nie możemy pokazać postępu na żywo, ale potwierdzenie płatności pozostaje ważne."
      },
      status: {
        title: "Status raportu", lead: "Przygotowujemy spersonalizowany PDF i email.", loading: "Sprawdzanie statusu raportu...",
        unavailable: "Nie udało się pobrać bieżącego statusu. Wysyłka raportu trwa niezależnie; sprawdź email lub odśwież status.", sent: "Email z raportem został wysłany.",
        attention: "Raport wymaga kontroli. Automatyczne ponowienia nadal działają.", payment: "Płatność", analysis: "Analiza", report: "Raport PDF",
        email: "Email", complete: "Gotowe", active: "W toku", pending: "Oczekuje", failed: "Wymaga uwagi"
      },
      next: { title: "Co dzieje się teraz?", items: ["Przygotowujemy spersonalizowaną interpretację.", "Generujemy raport PDF.", "Wysyłamy raport na podany adres email."] },
      cancel: {
        title: "Twoje odpowiedzi są bezpieczne", items: ["Płatność nie została ukończona, więc nie pobrano opłaty.", "Możesz ponowić płatność bez ponownego wypełniania ankiety.", "Jeśli problem się powtarza, wyślij ID sesji do pomocy."],
        note: "Zapisaną ankietę można ponownie otworzyć z tej strony, dopóki sesja jest dostępna."
      }
    },
    pt: {
      locale: "pt-PT",
      supportSubject: "Ajuda NeuroMap Kids com pagamento ou relatório",
      supportBody: "Olá, equipa NeuroMap Kids.\n\nPreciso de ajuda com o pagamento ou o relatório.\n\nSessão: {{sessionId}}\nPágina: {{pageKind}}\nEstado: {{status}}\n\nObrigado.",
      successBody: "Enviaremos por email a avaliação detalhada e o relatório PDF. Normalmente demora alguns minutos; um processamento mais complexo pode demorar mais.",
      session: {
        label: "Sessão", ready: "A página está pronta.", missing: "Falta o identificador da sessão de pagamento.", copy: "Copiar ID da sessão",
        copied: "ID da sessão copiado.", refresh: "Atualizar estado", refreshing: "A atualizar o estado...", checked: "Última verificação",
        email: "Email do relatório", reference: "Referência de suporte"
      },
      delivery: {
        title: "Entrega estimada", loading: "Estamos a verificar o progresso atual do relatório.",
        soon: "Os relatórios costumam chegar em poucos minutos; um processamento mais complexo pode demorar mais.",
        queued: "O relatório está na fila de processamento. É normal logo após o pagamento.", delayed: "O processamento está a demorar mais do que o habitual. As verificações automáticas continuam.",
        sent: "O relatório foi enviado. Verifique também Spam ou Promoções.", attention: "O relatório pode precisar de verificação manual. O suporte pode encontrá-lo pelo ID da sessão.",
        missing: "Sem ID da sessão não podemos mostrar o progresso em direto, mas a confirmação de pagamento continua válida."
      },
      status: {
        title: "Estado do relatório", lead: "Estamos a preparar o PDF personalizado e o email.", loading: "A verificar o estado do relatório...",
        unavailable: "Não foi possível obter o estado em tempo real. A entrega continua de forma independente; verifica o email ou atualiza o estado.", sent: "O email do relatório foi enviado.",
        attention: "O relatório precisa de verificação. As novas tentativas automáticas continuam.", payment: "Pagamento", analysis: "Análise", report: "Relatório PDF",
        email: "Email", complete: "Concluído", active: "Em curso", pending: "Em espera", failed: "Requer atenção"
      },
      next: { title: "O que acontece agora?", items: ["Preparamos a interpretação personalizada.", "Geramos o relatório PDF.", "Enviamos o relatório para o email indicado."] },
      cancel: {
        title: "As suas respostas estão seguras", items: ["O pagamento não foi concluído e não houve cobrança.", "Pode tentar novamente sem preencher o questionário outra vez.", "Se continuar a falhar, envie o ID da sessão ao suporte."],
        note: "O questionário guardado pode ser reaberto nesta página enquanto a sessão estiver disponível."
      }
    },
    fr: {
      locale: "fr-FR",
      supportSubject: "Aide NeuroMap Kids pour le paiement ou le rapport",
      supportBody: "Bonjour l'équipe NeuroMap Kids,\n\nj'ai besoin d'aide pour le paiement ou le rapport.\n\nSession : {{sessionId}}\nPage : {{pageKind}}\nStatut : {{status}}\n\nMerci.",
      successBody: "Nous enverrons l'évaluation détaillée et le rapport PDF par email. Cela prend généralement quelques minutes ; un traitement plus complexe peut demander davantage de temps.",
      session: {
        label: "Session", ready: "La page est prête.", missing: "L'identifiant de session de paiement est manquant.", copy: "Copier l'ID de session",
        copied: "ID de session copié.", refresh: "Actualiser le statut", refreshing: "Actualisation du statut...", checked: "Dernière vérification",
        email: "Email du rapport", reference: "Référence du support"
      },
      delivery: {
        title: "Délai estimé", loading: "Nous vérifions l'avancement actuel du rapport.",
        soon: "Les rapports arrivent généralement en quelques minutes ; un traitement plus complexe peut demander davantage de temps.",
        queued: "Le rapport est dans la file de traitement. C'est normal juste après le paiement.", delayed: "Le traitement prend plus de temps que d'habitude. Les vérifications automatiques continuent.",
        sent: "Le rapport a été envoyé. Vérifiez aussi les dossiers Spam ou Promotions.", attention: "Le rapport peut nécessiter une vérification manuelle. Le support peut le retrouver avec l'ID de session.",
        missing: "Sans ID de session, nous ne pouvons pas afficher le suivi en direct, mais la confirmation de paiement reste valable."
      },
      status: {
        title: "Statut du rapport", lead: "Nous préparons le PDF personnalisé et l'email.", loading: "Vérification du statut du rapport...",
        unavailable: "Le statut en direct n'a pas pu être récupéré. L'envoi continue indépendamment ; vérifiez votre email ou actualisez le statut.", sent: "L'email du rapport a été envoyé.",
        attention: "Le rapport nécessite une vérification. Les nouvelles tentatives automatiques continuent.", payment: "Paiement", analysis: "Analyse", report: "Rapport PDF",
        email: "Email", complete: "Terminé", active: "En cours", pending: "En attente", failed: "À vérifier"
      },
      next: { title: "Que se passe-t-il maintenant ?", items: ["Nous préparons l'interprétation personnalisée.", "Nous générons le rapport PDF.", "Nous envoyons le rapport à l'adresse email indiquée."] },
      cancel: {
        title: "Vos réponses sont en sécurité", items: ["Le paiement n'a pas été finalisé et aucun débit n'a eu lieu.", "Vous pouvez réessayer sans remplir à nouveau le questionnaire.", "Si le problème persiste, envoyez l'ID de session au support."],
        note: "Le questionnaire enregistré peut être rouvert depuis cette page tant que la session reste disponible."
      }
    }
  };

  function flattenCustomerJourneyCopy(lang) {
    const source = CUSTOMER_JOURNEY_COPY[lang] || CUSTOMER_JOURNEY_COPY.en;
    const session = source.session;
    const delivery = source.delivery;
    const status = source.status;

    return {
      locale: source.locale,
      supportSubject: source.supportSubject,
      supportBody: source.supportBody,
      successBody: source.successBody,
      sessionLabel: session.label,
      statusReady: session.ready,
      noSession: session.missing,
      copySession: session.copy,
      copiedSession: session.copied,
      refreshStatus: session.refresh,
      refreshingStatus: session.refreshing,
      lastCheckedLabel: session.checked,
      statusEmailMasked: session.email,
      statusSupportReference: session.reference,
      deliveryEstimateTitle: delivery.title,
      deliveryEstimateLoading: delivery.loading,
      deliveryEstimateSoon: delivery.soon,
      deliveryEstimateQueued: delivery.queued,
      deliveryEstimateDelayed: delivery.delayed,
      deliveryEstimateSent: delivery.sent,
      deliveryEstimateAttention: delivery.attention,
      deliveryEstimateNoSession: delivery.missing,
      reportStatusTitle: status.title,
      reportStatusLead: status.lead,
      statusLoading: status.loading,
      statusUnavailable: status.unavailable,
      statusSent: status.sent,
      statusAttention: status.attention,
      statusPayment: status.payment,
      statusAnalysis: status.analysis,
      statusReport: status.report,
      statusEmail: status.email,
      stateComplete: status.complete,
      stateActive: status.active,
      statePending: status.pending,
      stateFailed: status.failed,
      nextTitle: source.next.title,
      nextItems: source.next.items,
      cancelRecoveryTitle: source.cancel.title,
      cancelRecoveryItems: source.cancel.items,
      cancelSafeNote: source.cancel.note
    };
  }

  function getCopy(lang) {
    return Object.assign(
      {},
      BASE_COPY,
      COPY.en,
      COPY[lang] || {},
      flattenCustomerJourneyCopy(lang)
    );
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

  function getHashParams() {
    return new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
  }

  function persistSessionAccessToken(sessionId, hashSessionId, accessToken) {
    if (!sessionId || !accessToken) return false;

    try {
      sessionStorage.setItem(`nm_session_access:${sessionId}`, accessToken);

      if (hashSessionId && hashSessionId !== sessionId) {
        sessionStorage.setItem(`nm_session_access:${hashSessionId}`, accessToken);
      }

      sessionStorage.setItem("nm_last_session_id", sessionId);
      sessionStorage.setItem("nm_last_session_access", accessToken);
      return true;
    } catch (_error) {
      // sessionStorage can be blocked in strict browser privacy modes.
      return false;
    }
  }

  function removeSessionAccessHash() {
    const hashParams = getHashParams();
    if (!hashParams.has("nm_access") && !hashParams.has("nm_session")) return;

    hashParams.delete("nm_access");
    hashParams.delete("nm_session");

    const remainingHash = hashParams.toString();
    const nextUrl = `${window.location.pathname}${window.location.search}${remainingHash ? `#${remainingHash}` : ""}`;

    try {
      window.history.replaceState(window.history.state, document.title, nextUrl);
    } catch (_error) {
      // The status request can still continue with the in-memory token.
    }
  }

  function getSessionAccessToken(sessionId) {
    const hashParams = getHashParams();
    const hashSessionId = hashParams.get("nm_session") || "";
    const hashToken = hashParams.get("nm_access") || "";

    if (hashToken) {
      // Stripe success pages use a public cs_ identifier while the fragment may
      // contain the internal UUID. The API validates the token against either
      // identifier, so the browser must not discard it when those IDs differ.
      const persisted = persistSessionAccessToken(sessionId, hashSessionId, hashToken);
      if (persisted) removeSessionAccessHash();

      return hashToken;
    }

    try {
      const exactToken = sessionStorage.getItem(`nm_session_access:${sessionId}`) || "";
      if (exactToken) return exactToken;

      // Before the Stripe redirect the token is stored with the internal UUID,
      // while the success URL contains Stripe's cs_ identifier. sessionStorage
      // is tab-scoped, so the latest token is a safe recovery path when a browser
      // or privacy extension strips the URL fragment during the redirect.
      const lastToken = sessionStorage.getItem("nm_last_session_access") || "";
      if (lastToken) {
        persistSessionAccessToken(sessionId, "", lastToken);
        return lastToken;
      }

      return "";
    } catch (_error) {
      return "";
    }
  }

  function getSessionHeaders(sessionId, extra = {}) {
    const accessToken = getSessionAccessToken(sessionId);
    return Object.assign(
      {},
      extra,
      accessToken ? { "x-session-token": accessToken } : {}
    );
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

  function buildSupportHref(copy, sessionId, pageKind, statusText) {
    const subject = copy.supportSubject || BASE_COPY.supportSubject;
    const body = String(copy.supportBody || BASE_COPY.supportBody)
      .replace(/\{\{sessionId\}\}/g, sessionId || "missing")
      .replace(/\{\{pageKind\}\}/g, pageKind || getPageKind())
      .replace(/\{\{status\}\}/g, statusText || "unknown");

    const href = `${copy.supportHref || BASE_COPY.supportHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return safeHref(href, BASE_COPY.supportHref);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const trackedCheckoutEvents = new Set();

  function randomIdPart() {
    return Math.random().toString(36).slice(2, 10);
  }

  function sanitizeCheckoutAnalyticsPayload(payload) {
    const allowedKeys = new Set([
      "event_id",
      "page_kind",
      "package_code",
      "offer_version",
      "value",
      "currency",
      "lang",
      "status",
      "feedback",
      "items"
    ]);

    return Object.keys(payload || {}).reduce((safe, key) => {
      if (allowedKeys.has(key)) safe[key] = payload[key];
      return safe;
    }, {});
  }

  function buildAnalyticsPayload(eventName, payload) {
    return Object.assign({
      event_id: `${eventName}_${Date.now()}_${randomIdPart()}`,
      event_schema_version: ANALYTICS_SCHEMA_VERSION,
      app_name: "neuromap_kids",
      app_surface: "webflow",
      page_kind: getPageKind() === "success" ? "checkout_success" : "checkout_cancel",
      source: "webflow_checkout_pages",
      version: CHECKOUT_PAGES_VERSION
    }, sanitizeCheckoutAnalyticsPayload(payload || {}));
  }

  function trackOnce(eventName, payload) {
    if (!isAnalyticsAllowed()) {
      return;
    }

    window.dataLayer = window.dataLayer || [];

    const key = ["nm_track", eventName, getPageKind(), payload?.package_code || "", payload?.status || ""].join(":");

    try {
      if (window.sessionStorage && window.sessionStorage.getItem(key)) return;
      if (window.sessionStorage) window.sessionStorage.setItem(key, "1");
    } catch (_error) {
      if (trackedCheckoutEvents.has(key)) return;
    }

    if (trackedCheckoutEvents.has(key)) return;
    trackedCheckoutEvents.add(key);

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
      .nm-report-status-panel,
      .nm-cancel-recovery,
      .nm-customer-tip,
      .nm-delivery-estimate,
      .nm-status-shortcut,
      .nm-inbox-checklist,
      .nm-delayed-help,
      .nm-follow-up-panel,
      .nm-feedback-panel {
        margin: 0 auto 24px;
        max-width: 620px;
        text-align: left;
        border: 1px solid #dbe8f1;
        border-radius: 16px;
        background: #f8fbfe;
        padding: 18px;
      }

      [dir="rtl"] .nm-checkout-next,
      [dir="rtl"] .nm-report-status-panel,
      [dir="rtl"] .nm-cancel-recovery,
      [dir="rtl"] .nm-customer-tip,
      [dir="rtl"] .nm-delivery-estimate,
      [dir="rtl"] .nm-status-shortcut,
      [dir="rtl"] .nm-inbox-checklist,
      [dir="rtl"] .nm-delayed-help,
      [dir="rtl"] .nm-follow-up-panel,
      [dir="rtl"] .nm-feedback-panel {
        text-align: right;
      }

      .nm-checkout-next h2,
      .nm-report-status-panel h2,
      .nm-cancel-recovery h2,
      .nm-customer-tip h2,
      .nm-delivery-estimate h2,
      .nm-status-shortcut h2,
      .nm-inbox-checklist h2,
      .nm-delayed-help h2,
      .nm-follow-up-panel h2,
      .nm-feedback-panel h2 {
        margin: 0 0 8px;
        font-size: 16px;
        line-height: 1.3;
        color: #102033;
      }

      .nm-customer-tip,
      .nm-delivery-estimate,
      .nm-inbox-checklist {
        border-color: #cfe8f7;
        background: #f3fbff;
      }

      .nm-follow-up-panel {
        border-color: #bcebd5;
        background: #f3fff8;
      }

      .nm-customer-tip p,
      .nm-delivery-estimate p,
      .nm-status-shortcut p,
      .nm-inbox-checklist p,
      .nm-delayed-help p {
        margin: 0;
        color: #506780;
        font-size: 13px;
        line-height: 1.6;
      }

      .nm-follow-up-panel p {
        margin: 0 0 10px;
        color: #506780;
        font-size: 13px;
        line-height: 1.6;
      }

      .nm-delivery-estimate[data-tone="sent"] {
        border-color: #bcebd5;
        background: #f1fcf6;
      }

      .nm-delivery-estimate[data-tone="delayed"],
      .nm-delayed-help {
        border-color: #ffd7b4;
        background: #fff8f1;
      }

      .nm-delivery-estimate[data-tone="attention"] {
        border-color: #ffc6bd;
        background: #fff4f2;
      }

      .nm-checkout-next ol {
        margin: 10px 0 0;
        padding-left: 22px;
        color: #506780;
        font-size: 14px;
        line-height: 1.6;
      }

      .nm-inbox-checklist ul {
        margin: 10px 0 0;
        padding-left: 20px;
        color: #506780;
        font-size: 14px;
        line-height: 1.6;
      }

      [dir="rtl"] .nm-inbox-checklist ul {
        padding-left: 0;
        padding-right: 20px;
      }

      .nm-inbox-note {
        display: block;
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: #ffffff;
        color: #0b86bf;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.45;
      }

      .nm-cancel-recovery ul {
        margin: 10px 0 0;
        padding-left: 20px;
        color: #506780;
        font-size: 14px;
        line-height: 1.6;
      }

      [dir="rtl"] .nm-cancel-recovery ul {
        padding-left: 0;
        padding-right: 20px;
      }

      .nm-cancel-note {
        margin: 12px 0 0;
        color: #32526f;
        font-size: 13px;
        line-height: 1.55;
      }

      .nm-delayed-help[hidden] {
        display: none !important;
      }

      .nm-status-shortcut {
        border-color: #bfe7f8;
        background: linear-gradient(135deg, #f3fbff 0%, #ffffff 68%);
      }

      .nm-status-shortcut-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .nm-status-shortcut-text {
        min-width: 0;
      }

      .nm-status-shortcut-button {
        flex: 0 0 auto;
        border: 0;
        border-radius: 999px;
        background: #102033;
        color: #fff;
        cursor: pointer;
        font-weight: 900;
        font-size: 12px;
        line-height: 1;
        padding: 11px 14px;
        white-space: nowrap;
      }

      .nm-delayed-help ul {
        margin: 10px 0 0;
        padding-left: 20px;
        color: #506780;
        font-size: 14px;
        line-height: 1.6;
      }

      [dir="rtl"] .nm-delayed-help ul {
        padding-left: 0;
        padding-right: 20px;
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

      .nm-status-meta {
        display: grid;
        gap: 7px;
        margin: 13px 0 0;
        padding-top: 13px;
        border-top: 1px solid #e6eef5;
        color: #506780;
        font-size: 12px;
        line-height: 1.45;
      }

      .nm-status-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .nm-mini-button {
        appearance: none;
        border: 1px solid #d7e6f0;
        border-radius: 9px;
        background: #fff;
        color: #102033;
        cursor: pointer;
        font-weight: 800;
        font-size: 12px;
        line-height: 1;
        padding: 10px 12px;
      }

      .nm-mini-button:disabled {
        opacity: .6;
        cursor: wait;
      }

      .nm-feedback-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
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

        .nm-status-shortcut-row {
          align-items: stretch;
          flex-direction: column;
        }

        .nm-status-shortcut-button {
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

  function renderUnavailableStatusSteps(copy) {
    return renderStatusSteps(copy, [
      { key: "payment", label: copy.statusPayment, state: "complete" },
      { key: "analysis", label: copy.statusAnalysis, state: "pending" },
      { key: "report", label: copy.statusReport, state: "pending" },
      { key: "email", label: copy.statusEmail, state: "pending" }
    ]);
  }

  function getStatusMessage(copy, status) {
    if (!status) return copy.statusLoading;
    if (status.overall === "sent") return copy.statusSent;
    if (status.overall === "attention") return copy.statusAttention;
    return copy.reportStatusLead;
  }

  function minutesSince(value) {
    if (!value) return 0;

    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return 0;

    return Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  }

  function getDeliveryEstimate(copy, status, hasSessionId) {
    if (!hasSessionId) {
      return {
        tone: "attention",
        message: copy.deliveryEstimateNoSession
      };
    }

    if (!status) {
      return {
        tone: "active",
        message: copy.deliveryEstimateLoading
      };
    }

    if (status.overall === "sent") {
      return {
        tone: "sent",
        message: copy.deliveryEstimateSent
      };
    }

    if (status.overall === "attention") {
      return {
        tone: "attention",
        message: copy.deliveryEstimateAttention
      };
    }

    const minutesFromPayment = minutesSince(status.paidAt || status.createdAt);
    const analysisStatus = String(status.analysisStatus || "").toLowerCase();

    if (minutesFromPayment >= 5) {
      return {
        tone: "delayed",
        message: copy.deliveryEstimateDelayed
      };
    }

    if (analysisStatus === "queued" || analysisStatus === "pending") {
      return {
        tone: "active",
        message: copy.deliveryEstimateQueued
      };
    }

    return {
      tone: "active",
      message: copy.deliveryEstimateSoon
    };
  }

  function renderCustomerTip(copy, isSuccess) {
    const text = isSuccess ? copy.successPageTip : copy.cancelPageTip;

    return `
      <div class="nm-customer-tip">
        <h2>${escapeHtml(copy.pageTipTitle)}</h2>
        <p>${escapeHtml(text)}</p>
      </div>
    `;
  }

  function renderDeliveryEstimate(copy, sessionId, status) {
    const estimate = getDeliveryEstimate(copy, status, Boolean(sessionId));

    return `
      <div class="nm-delivery-estimate" id="nmDeliveryEstimate" data-tone="${escapeHtml(estimate.tone)}">
        <h2>${escapeHtml(copy.deliveryEstimateTitle)}</h2>
        <p id="nmDeliveryEstimateText">${escapeHtml(estimate.message)}</p>
      </div>
    `;
  }

  function renderStatusShortcut(copy) {
    return `
      <div class="nm-status-shortcut">
        <div class="nm-status-shortcut-row">
          <div class="nm-status-shortcut-text">
            <h2>${escapeHtml(copy.statusShortcutTitle || BASE_COPY.statusShortcutTitle)}</h2>
            <p>${escapeHtml(copy.statusShortcutBody || BASE_COPY.statusShortcutBody)}</p>
          </div>
          <button class="nm-status-shortcut-button" type="button" id="nmJumpToStatus">
            ${escapeHtml(copy.statusShortcutButton || BASE_COPY.statusShortcutButton)}
          </button>
        </div>
      </div>
    `;
  }

  function updateDeliveryEstimate(copy, sessionId, status) {
    const panel = document.getElementById("nmDeliveryEstimate");
    const text = document.getElementById("nmDeliveryEstimateText");
    if (!panel || !text) return;

    const estimate = getDeliveryEstimate(copy, status, Boolean(sessionId));
    panel.setAttribute("data-tone", estimate.tone);
    text.textContent = estimate.message;
  }

  function renderDelayedHelp(copy) {
    const items = Array.isArray(copy.delayedHelpItems)
      ? copy.delayedHelpItems
      : BASE_COPY.delayedHelpItems;

    return `
      <div class="nm-delayed-help" id="nmDelayedHelp" hidden>
        <h2>${escapeHtml(copy.delayedHelpTitle)}</h2>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <p>${escapeHtml(copy.delayedHelpNote)}</p>
      </div>
    `;
  }

  function renderInboxChecklist(copy) {
    const items = Array.isArray(copy.inboxChecklistItems)
      ? copy.inboxChecklistItems
      : BASE_COPY.inboxChecklistItems;

    return `
      <div class="nm-inbox-checklist">
        <h2>${escapeHtml(copy.inboxChecklistTitle || BASE_COPY.inboxChecklistTitle)}</h2>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <span class="nm-inbox-note">${escapeHtml(copy.reportNoDoublePay || BASE_COPY.reportNoDoublePay)}</span>
        <p style="margin-top:10px;">${escapeHtml(copy.liveStatusNote || BASE_COPY.liveStatusNote)}</p>
      </div>
    `;
  }

  function renderFollowUpPanel(copy) {
    const items = Array.isArray(copy.followUpItems)
      ? copy.followUpItems
      : BASE_COPY.followUpItems;

    return `
      <div class="nm-follow-up-panel">
        <h2>${escapeHtml(copy.followUpTitle || BASE_COPY.followUpTitle)}</h2>
        <p>${escapeHtml(copy.followUpBody || BASE_COPY.followUpBody)}</p>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function updateDelayedHelp(status) {
    const panel = document.getElementById("nmDelayedHelp");
    if (!panel) return;

    const minutesFromPayment = status ? minutesSince(status.paidAt || status.createdAt) : 0;
    const shouldShow =
      !status ||
      status.overall === "attention" ||
      (status.overall !== "sent" && minutesFromPayment >= 3);

    panel.hidden = !shouldShow;
  }

  function renderFeedbackPanel(copy) {
    return `
      <div class="nm-feedback-panel">
        <h2>${escapeHtml(copy.feedbackTitle)}</h2>
        <div class="nm-feedback-actions">
          <button class="nm-mini-button" type="button" data-nm-feedback="positive">${escapeHtml(copy.feedbackPositive)}</button>
          <button class="nm-mini-button" type="button" data-nm-feedback="need_help">${escapeHtml(copy.feedbackNeedHelp)}</button>
        </div>
      </div>
    `;
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
      ${renderDeliveryEstimate(copy, getSessionId("success"), null)}
      <div class="nm-report-status-panel" id="nmReportStatusPanel" aria-labelledby="nmReportStatusTitle">
        <h2 id="nmReportStatusTitle">${escapeHtml(copy.reportStatusTitle)}</h2>
        <p class="nm-report-status-lead" id="nmReportStatusLead" role="status" aria-live="polite">${escapeHtml(copy.statusLoading)}</p>
        <div class="nm-status-steps" id="nmReportStatusSteps">
          ${renderStatusSteps(copy)}
        </div>
        <div class="nm-status-meta" id="nmReportStatusMeta" hidden></div>
        <div class="nm-status-controls">
          <button class="nm-mini-button" type="button" id="nmRefreshStatus">${escapeHtml(copy.refreshStatus)}</button>
        </div>
      </div>
    `;
  }

  function renderCancelExtras(copy) {
    const items = Array.isArray(copy.cancelRecoveryItems)
      ? copy.cancelRecoveryItems
      : BASE_COPY.cancelRecoveryItems;

    return `
      <div class="nm-cancel-recovery">
        <h2>${escapeHtml(copy.cancelRecoveryTitle)}</h2>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <p class="nm-cancel-note">${escapeHtml(copy.cancelSafeNote)}</p>
      </div>
    `;
  }

  function renderStatusMeta(copy, sessionId, status) {
    const meta = document.getElementById("nmReportStatusMeta");
    if (!meta) return;

    const rows = [];
    const checkedAt = new Date().toLocaleString(copy.locale || undefined);

    rows.push(`${copy.lastCheckedLabel}: ${checkedAt}`);

    if (status && status.emailMasked) {
      rows.push(`${copy.statusEmailMasked}: ${status.emailMasked}`);
    }

    if (sessionId) {
      rows.push(`${copy.statusSupportReference}: ${sessionId}`);
    }

    meta.innerHTML = rows.map((row) => `<div>${escapeHtml(row)}</div>`).join("");
    meta.hidden = false;
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
      <section class="nm-checkout-card" aria-labelledby="nmCheckoutTitle">
        <div class="nm-checkout-icon ${isSuccess ? "success" : "cancel"}" aria-hidden="true">${icon}</div>
        <h1 id="nmCheckoutTitle">${escapeHtml(isSuccess ? copy.successTitle : copy.cancelTitle)}</h1>
        <p class="nm-checkout-lead">${escapeHtml(isSuccess ? copy.successLead : copy.cancelLead)}</p>
        <p class="nm-checkout-body">${escapeHtml(isSuccess ? copy.successBody : copy.cancelBody)}</p>
        ${sessionId ? `<div class="nm-checkout-meta">${escapeHtml(copy.sessionLabel)}: ${escapeHtml(sessionId)}</div>` : ""}
        ${isSuccess ? renderSuccessExtras(copy) : renderCancelExtras(copy)}
        <div class="nm-checkout-actions">
          <a class="nm-checkout-button dark" href="${escapeHtml(safeHref(getHomeHref(lang), "/"))}">${escapeHtml(copy.home)}</a>
          ${!isSuccess ? `<button class="nm-checkout-button" type="button" id="nmRetryCheckout">${escapeHtml(copy.retry)}</button>` : ""}
          ${sessionId ? `<button class="nm-checkout-button secondary" type="button" id="nmCopySession">${escapeHtml(copy.copySession)}</button>` : ""}
          <a class="nm-checkout-button secondary" id="nmSupportLink" href="${escapeHtml(buildSupportHref(copy, sessionId, kind, isSuccess ? "success_page" : "cancel_page"))}">${escapeHtml(copy.support)}</a>
        </div>
        <div class="nm-checkout-status" id="nmCheckoutStatus" role="status" aria-live="polite">${escapeHtml(copy.statusReady)}</div>
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

    const copyButton = document.getElementById("nmCopySession");
    if (copyButton) {
      copyButton.addEventListener("click", function () {
        copySessionId(sessionId, copy);
      });
    }

  }

  async function loadReportStatus(sessionId, copy, attempt) {
    const lead = document.getElementById("nmReportStatusLead");
    const steps = document.getElementById("nmReportStatusSteps");
    const refreshButton = document.getElementById("nmRefreshStatus");
    const supportLink = document.getElementById("nmSupportLink");

    if (!lead || !steps) return;

    if (!sessionId) {
      lead.textContent = copy.noSession;
      return;
    }

    try {
      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = copy.refreshingStatus;
      }

      const response = await fetch(`${getApiBaseUrl()}/session/status/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        headers: getSessionHeaders(sessionId),
        credentials: "omit"
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data || !data.status) {
        const statusError = new Error(data?.error || copy.statusUnavailable);
        statusError.httpStatus = response.status;
        statusError.errorCode = data?.code || "";
        throw statusError;
      }

      lead.textContent = getStatusMessage(copy, data.status);
      steps.innerHTML = renderStatusSteps(copy, data.status.stages);
      renderStatusMeta(copy, sessionId, data.status);
      updateDeliveryEstimate(copy, sessionId, data.status);
      trackPurchaseFromStatus(data.status.lang || "en", sessionId, data.status);

      if (supportLink) {
        supportLink.href = buildSupportHref(copy, sessionId, "success", data.status.overall || "unknown");
      }

      trackOnce("nm_report_status_view", {
        status: data.status.overall || "",
        lang: data.status.lang || "",
        page_kind: "checkout_success"
      });

      if (
        data.status.overall !== "sent" &&
        data.status.overall !== "attention" &&
        attempt < STATUS_POLL_MAX_ATTEMPTS
      ) {
        window.setTimeout(
          () => loadReportStatus(sessionId, copy, attempt + 1),
          STATUS_POLL_INTERVAL_MS
        );
      }
    } catch (error) {
      const httpStatus = Number(error?.httpStatus || 0);

      console.warn("[checkout-pages] report status lookup failed", {
        httpStatus,
        errorCode: error?.errorCode || "",
        attempt
      });

      lead.textContent = copy.statusUnavailable;
      steps.innerHTML = renderUnavailableStatusSteps(copy);
      renderStatusMeta(copy, sessionId, null);
      updateDeliveryEstimate(copy, sessionId, null);

      trackOnce("nm_report_status_unavailable", {
        http_status: httpStatus,
        attempt,
        page_kind: "checkout_success"
      });

      const retryable = !httpStatus || httpStatus === 404 || httpStatus === 429 || httpStatus >= 500;

      if (retryable && attempt < STATUS_POLL_MAX_ATTEMPTS) {
        window.setTimeout(
          () => loadReportStatus(sessionId, copy, attempt + 1),
          STATUS_POLL_INTERVAL_MS
        );
      }
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = copy.refreshStatus;
      }
    }
  }

  function setRuntimeStatus(message) {
    const el = document.getElementById("nmCheckoutStatus");
    if (el) el.textContent = message || "";
  }

  async function copySessionId(sessionId, copy) {
    if (!sessionId) {
      setRuntimeStatus(copy.noSession);
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sessionId);
      } else {
        const input = document.createElement("input");
        input.value = sessionId;
        input.setAttribute("readonly", "readonly");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }

      setRuntimeStatus(copy.copiedSession);
      trackOnce("nm_support_reference_copied", {
        page_kind: getPageKind() === "success" ? "checkout_success" : "checkout_cancel"
      });
    } catch (_error) {
      setRuntimeStatus(sessionId);
    }
  }

  function handleFeedback(value, copy, sessionId, kind) {
    const normalized = value === "need_help" ? "need_help" : "positive";

    trackOnce(`nm_checkout_page_feedback_${normalized}`, {
      feedback: normalized,
      page_kind: kind === "success" ? "checkout_success" : "checkout_cancel"
    });

    if (normalized === "need_help") {
      setRuntimeStatus(copy.openingSupport);

      const link = document.getElementById("nmSupportLink");
      if (link && link.href) {
        window.location.href = link.href;
      }

      return;
    }

    setRuntimeStatus(copy.feedbackThanks);
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
        headers: getSessionHeaders(sessionId, { "Content-Type": "application/json" }),
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
        page_kind: "checkout_cancel"
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      setRuntimeStatus(error && error.message ? error.message : copy.retryError);
      if (button) button.disabled = false;
    }
  }

  function trackPurchaseFromStatus(lang, sessionId, status) {
    const amountTotal = Number(status?.amountTotal);
    const currency = String(status?.currency || "").trim().toUpperCase();
    const packageCode = String(status?.packageCode || "legacy_500_v1").trim();

    if (
      status?.paymentStatus !== "paid" ||
      !Number.isInteger(amountTotal) ||
      amountTotal <= 0 ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return false;
    }

    const value = amountTotal / 100;
    const isPlus = packageCode === "plus_v1";

    trackOnce("purchase", {
      value,
      currency,
      package_code: packageCode,
      offer_version: status?.offerVersion || "",
      lang: status?.lang || lang,
      items: [
        {
          item_id: packageCode,
          item_name: isPlus ? "NeuroMap Kids Plus" : "NeuroMap Kids Standard",
          item_category: "Digital screening report",
          price: value,
          quantity: 1
        }
      ]
    });

    console.log("PURCHASE EVENT SENT", {
      packageCode,
      value,
      currency,
      version: CHECKOUT_PAGES_VERSION
    });

    return true;
  }

  function trackPage(kind, lang, sessionId) {
    if (kind === "success") {
      trackOnce("nm_checkout_success_view", {
        lang,
        page_kind: "checkout_success"
      });
      return;
    }

    trackOnce("checkout_cancelled", {
      lang,
      page_kind: "checkout_cancel"
    });
  }

  function init() {
    const kind = getPageKind();
    const lang = getLang();
    const sessionId = getSessionId(kind);

    installPrivacyDefaults();

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.add("nm-checkout-enhanced");

    installDesign();
    renderPage(kind, lang, sessionId);
    trackPage(kind, lang, sessionId);

    if (kind === "success") {
      const copy = getCopy(lang);
      const refreshButton = document.getElementById("nmRefreshStatus");

      if (refreshButton) {
        refreshButton.addEventListener("click", function () {
          trackOnce("nm_report_status_refresh", {
            lang,
            page_kind: "checkout_success"
          });
          loadReportStatus(sessionId, copy, 6);
        });
      }

      loadReportStatus(sessionId, copy, 1);
    } else {
      trackOnce("checkout_recovery_view", {
        lang,
        page_kind: "checkout_cancel"
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();


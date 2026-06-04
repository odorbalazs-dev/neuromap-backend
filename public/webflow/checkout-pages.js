/* =========================
   CHECKOUT SUCCESS/CANCEL PAGES - WEBFLOW STABLE V1
========================= */

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const CHECKOUT_PAGES_VERSION = "20260604-cx-top10-v1";
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
    deliveryEstimateSoon: "Most reports arrive within 1-2 minutes after payment.",
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
      deliveryEstimateSoon: "A legt\u00f6bb riport a fizet\u00e9s ut\u00e1n 1-2 percen bel\u00fcl meg\u00e9rkezik.",
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
      cancelRecoveryTitle: "A v\u00e1laszaid biztons\u00e1gban vannak",
      cancelRecoveryItems: [
        "A fizet\u00e9s nem fejez\u0151d\u00f6tt be, \u00edgy nem t\u00f6rt\u00e9nt terhel\u00e9s.",
        "\u00dajraind\u00edthatod a fizet\u00e9st an\u00e9lk\u00fcl, hogy \u00fajra ki kellene t\u00f6ltened a k\u00e9rd\u0151\u00edvet.",
        "Ha a fizet\u00e9s tov\u00e1bbra sem indul, k\u00fcldd el az azonos\u00edt\u00f3t az \u00fcgyf\u00e9lszolg\u00e1latnak."
      ],
      cancelSafeNote: "A mentett k\u00e9rd\u0151\u00edv session err\u0151l az oldalr\u00f3l \u00fajraind\u00edthat\u00f3, am\u00edg a session el\u00e9rhet\u0151.",
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
      .nm-report-status-panel,
      .nm-cancel-recovery,
      .nm-customer-tip,
      .nm-delivery-estimate,
      .nm-status-shortcut,
      .nm-inbox-checklist,
      .nm-delayed-help,
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
      ${renderStatusShortcut(copy)}
      ${renderInboxChecklist(copy)}
      <div class="nm-report-status-panel" id="nmReportStatusPanel">
        <h2>${escapeHtml(copy.reportStatusTitle)}</h2>
        <p class="nm-report-status-lead" id="nmReportStatusLead">${escapeHtml(copy.statusLoading)}</p>
        <div class="nm-status-steps" id="nmReportStatusSteps">
          ${renderStatusSteps(copy)}
        </div>
        <div class="nm-status-meta" id="nmReportStatusMeta" hidden></div>
        <div class="nm-status-controls">
          <button class="nm-mini-button" type="button" id="nmRefreshStatus">${escapeHtml(copy.refreshStatus)}</button>
        </div>
      </div>
      ${renderDelayedHelp(copy)}
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
    const checkedAt = new Date().toLocaleString();

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
      <section class="nm-checkout-card" aria-live="polite">
        <div class="nm-checkout-icon ${isSuccess ? "success" : "cancel"}" aria-hidden="true">${icon}</div>
        <h1>${escapeHtml(isSuccess ? copy.successTitle : copy.cancelTitle)}</h1>
        <p class="nm-checkout-lead">${escapeHtml(isSuccess ? copy.successLead : copy.cancelLead)}</p>
        <p class="nm-checkout-body">${escapeHtml(isSuccess ? copy.successBody : copy.cancelBody)}</p>
        ${renderCustomerTip(copy, isSuccess)}
        ${sessionId ? `<div class="nm-checkout-meta">${escapeHtml(copy.sessionLabel)}: ${escapeHtml(sessionId)}</div>` : ""}
        ${isSuccess ? renderSuccessExtras(copy) : renderCancelExtras(copy)}
        ${renderFeedbackPanel(copy)}
        <div class="nm-checkout-actions">
          <a class="nm-checkout-button dark" href="${escapeHtml(safeHref(getHomeHref(lang), "/"))}">${escapeHtml(copy.home)}</a>
          ${!isSuccess ? `<button class="nm-checkout-button" type="button" id="nmRetryCheckout">${escapeHtml(copy.retry)}</button>` : ""}
          ${sessionId ? `<button class="nm-checkout-button secondary" type="button" id="nmCopySession">${escapeHtml(copy.copySession)}</button>` : ""}
          <a class="nm-checkout-button secondary" id="nmSupportLink" href="${escapeHtml(buildSupportHref(copy, sessionId, kind, isSuccess ? "success_page" : "cancel_page"))}">${escapeHtml(copy.support)}</a>
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

    const copyButton = document.getElementById("nmCopySession");
    if (copyButton) {
      copyButton.addEventListener("click", function () {
        copySessionId(sessionId, copy);
      });
    }

    document.querySelectorAll("[data-nm-feedback]").forEach((button) => {
      button.addEventListener("click", function () {
        handleFeedback(button.getAttribute("data-nm-feedback"), copy, sessionId, kind);
      });
    });

    const jumpToStatus = document.getElementById("nmJumpToStatus");
    if (jumpToStatus) {
      jumpToStatus.addEventListener("click", function () {
        const panel = document.getElementById("nmReportStatusPanel");
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
        credentials: "omit"
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data || !data.status) {
        throw new Error(copy.statusUnavailable);
      }

      lead.textContent = getStatusMessage(copy, data.status);
      steps.innerHTML = renderStatusSteps(copy, data.status.stages);
      renderStatusMeta(copy, sessionId, data.status);
      updateDeliveryEstimate(copy, sessionId, data.status);
      updateDelayedHelp(data.status);

      if (supportLink) {
        supportLink.href = buildSupportHref(copy, sessionId, "success", data.status.overall || "unknown");
      }

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
      renderStatusMeta(copy, sessionId, null);
      updateDeliveryEstimate(copy, sessionId, null);
      updateDelayedHelp(null);
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
        checkout_session_id: sessionId || "",
        session_id: sessionId || "",
        source: "webflow_checkout_pages",
        version: CHECKOUT_PAGES_VERSION
      });
    } catch (_error) {
      setRuntimeStatus(sessionId);
    }
  }

  function handleFeedback(value, copy, sessionId, kind) {
    const normalized = value === "need_help" ? "need_help" : "positive";

    trackOnce(`nm_checkout_page_feedback_${normalized}`, {
      checkout_session_id: sessionId || "",
      session_id: sessionId || "",
      feedback: normalized,
      source: kind === "success" ? "webflow_success_page" : "webflow_cancel_page",
      version: CHECKOUT_PAGES_VERSION
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
      const copy = getCopy(lang);
      const refreshButton = document.getElementById("nmRefreshStatus");

      if (refreshButton) {
        refreshButton.addEventListener("click", function () {
          loadReportStatus(sessionId, copy, 6);
        });
      }

      loadReportStatus(sessionId, copy, 1);
    } else {
      trackOnce("checkout_recovery_view", {
        checkout_session_id: sessionId || "",
        session_id: sessionId || "",
        lang,
        source: "webflow_cancel_page",
        version: CHECKOUT_PAGES_VERSION
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

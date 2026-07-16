/* =========================
   ENGINE - PRODUCTION FINAL
   Uses window.NM_ADAPTIVE_ENGINE when available.
========================= */

(function () {
  const DISORDERS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
  const ENGINE_VERSION = "20260715-gdpr-consent-v1";
  const ANALYTICS_SCHEMA_VERSION = "analytics-event-schema-v2";
  const LEGAL_CONSENT_VERSION = "20260715-gdpr-legal-v1";
  const LANGUAGE_CONFIRMED_KEY = "nm_language_confirmed_v1";
  const DRAFT_STORAGE_KEY = "nm_questionnaire_draft_v1";
  const PACKAGE_STORAGE_KEY = "nm_package_code_v1";
  const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 14;
  const CAMPAIGN_ATTRIBUTION_STORAGE_KEY = "nm_campaign_attribution_v1";
  const CAMPAIGN_ATTRIBUTION_TTL_MS = 1000 * 60 * 60 * 24 * 90;
  const CAMPAIGN_ATTRIBUTION_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "gbraid",
    "wbraid"
  ];
  const CAMPAIGN_SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  let legalManagerPromise = null;
  const trackedSchemaEvents = new Set();

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

  const CLIENT_PACKAGE_CATALOG = Object.freeze({
    standard_v1: Object.freeze({
      code: "standard_v1",
      amount: 799,
      analyticsValue: 7.99,
      currency: "USD"
    }),
    plus_v1: Object.freeze({
      code: "plus_v1",
      amount: 999,
      analyticsValue: 9.99,
      currency: "USD"
    })
  });

  const PACKAGE_SELECTOR_COPY = {
    hu: {
      eyebrow: "Egyszeri vásárlás, nincs előfizetés",
      title: "Válaszd ki, mennyi támogatást szeretnél",
      lead: "Mindkét csomag ugyanarra a személyre szabott kérdőívre épül. A Plus a riport után is segít megfigyelni a változásokat.",
      recommended: "Ajánlott",
      selected: "Kiválasztva",
      select: "Ezt választom",
      standard: {
        name: "Standard riport",
        description: "Részletes, korosztályhoz igazított PDF a legfontosabb mintázatokról.",
        features: ["Személyre szabott PDF riport", "Gyakorlati javaslatok szülőknek", "Emailes kézbesítés és számla"]
      },
      plus: {
        name: "Plus támogatás",
        description: "A teljes riport mellé 14 napos, irányított megfigyelési támogatást kapsz.",
        features: ["Minden, ami a Standardban", "Megosztható egyoldalas összefoglaló", "Helyzettervek és óvoda/iskola beszélgetési útmutató", "14 napos megfigyelési napló és trendkövetés"]
      },
      disclosure: "A Plus kiegészítő tartalma automatizáltan, a szülő válaszai alapján készül. Nem szakember által ellenőrzött értékelés és nem diagnózis.",
      checkout: "Fizetés"
    },
    en: {
      eyebrow: "One-time purchase, no subscription",
      title: "Choose how much ongoing support you want",
      lead: "Both options use the same personalized questionnaire. Plus also helps you observe changes after receiving the report.",
      recommended: "Recommended",
      selected: "Selected",
      select: "Choose this",
      standard: {
        name: "Standard report",
        description: "A detailed, age-aware PDF explaining the most relevant patterns.",
        features: ["Personalized PDF report", "Practical suggestions for parents", "Email delivery and invoice"]
      },
      plus: {
        name: "Plus support",
        description: "The full report plus 14 days of guided observation support.",
        features: ["Everything in Standard", "Shareable one-page summary", "Situation plans and preschool/school conversation guide", "14-day observation diary and trend follow-up"]
      },
      disclosure: "Plus content is generated automatically from the parent's answers. It is not reviewed by a professional and is not a diagnosis.",
      checkout: "Pay"
    },
    de: {
      eyebrow: "Einmalige Zahlung, kein Abo",
      title: "Wähle den gewünschten Umfang der Begleitung",
      lead: "Beide Pakete basieren auf demselben personalisierten Fragebogen. Plus unterstützt auch die Beobachtung nach dem Bericht.",
      recommended: "Empfohlen",
      selected: "Ausgewählt",
      select: "Auswählen",
      standard: {
        name: "Standard-Bericht",
        description: "Ein ausführlicher, altersbezogener PDF-Bericht zu den wichtigsten Mustern.",
        features: ["Personalisierter PDF-Bericht", "Praktische Hinweise für Eltern", "Versand per E-Mail und Rechnung"]
      },
      plus: {
        name: "Plus-Begleitung",
        description: "Der vollständige Bericht plus 14 Tage angeleitete Beobachtung.",
        features: ["Alles aus Standard", "Teilbare einseitige Zusammenfassung", "Situationspläne und Leitfaden für Kita/Schule", "14-Tage-Beobachtungstagebuch und Trendbericht"]
      },
      disclosure: "Die Plus-Inhalte werden automatisch aus den Antworten der Eltern erstellt. Sie werden nicht von Fachpersonal geprüft und sind keine Diagnose.",
      checkout: "Bezahlen"
    },
    it: {
      eyebrow: "Pagamento unico, nessun abbonamento",
      title: "Scegli il livello di supporto che desideri",
      lead: "Entrambe le opzioni usano lo stesso questionario personalizzato. Plus aiuta anche a osservare i cambiamenti dopo il report.",
      recommended: "Consigliato",
      selected: "Selezionato",
      select: "Scegli questo",
      standard: {
        name: "Report Standard",
        description: "Un PDF dettagliato e adatto all'età sui pattern più rilevanti.",
        features: ["Report PDF personalizzato", "Suggerimenti pratici per genitori", "Invio via email e fattura"]
      },
      plus: {
        name: "Supporto Plus",
        description: "Il report completo con 14 giorni di osservazione guidata.",
        features: ["Tutto ciò che include Standard", "Sintesi condivisibile di una pagina", "Piani situazionali e guida per scuola o asilo", "Diario di 14 giorni e andamento finale"]
      },
      disclosure: "I contenuti Plus sono generati automaticamente dalle risposte del genitore. Non sono revisionati da un professionista e non costituiscono una diagnosi.",
      checkout: "Paga"
    },
    es: {
      eyebrow: "Pago único, sin suscripción",
      title: "Elige el nivel de acompañamiento que deseas",
      lead: "Ambas opciones usan el mismo cuestionario personalizado. Plus también ayuda a observar cambios después del informe.",
      recommended: "Recomendado",
      selected: "Seleccionado",
      select: "Elegir",
      standard: {
        name: "Informe Standard",
        description: "Un PDF detallado y adaptado a la edad sobre los patrones más relevantes.",
        features: ["Informe PDF personalizado", "Sugerencias prácticas para familias", "Entrega por email y factura"]
      },
      plus: {
        name: "Acompañamiento Plus",
        description: "El informe completo con 14 días de observación guiada.",
        features: ["Todo lo incluido en Standard", "Resumen compartible de una página", "Planes por situación y guía para la escuela", "Diario de 14 días y seguimiento de tendencias"]
      },
      disclosure: "El contenido Plus se genera automáticamente a partir de las respuestas de la familia. No está revisado por un profesional y no es un diagnóstico.",
      checkout: "Pagar"
    },
    zh: {
      eyebrow: "一次性付款，无订阅",
      title: "选择你需要的后续支持",
      lead: "两个方案都使用同一份个性化问卷。Plus 还会在收到报告后帮助你持续观察变化。",
      recommended: "推荐",
      selected: "已选择",
      select: "选择此方案",
      standard: {
        name: "标准报告",
        description: "一份详细、结合年龄背景的个性化PDF报告。",
        features: ["个性化PDF报告", "给家长的实用建议", "邮件发送和发票"]
      },
      plus: {
        name: "Plus支持",
        description: "完整报告加14天引导式观察支持。",
        features: ["包含标准方案全部内容", "可分享的一页摘要", "情境计划及与幼儿园或学校沟通指南", "14天观察日记和趋势跟进"]
      },
      disclosure: "Plus内容根据家长回答自动生成，未经专业人员审核，也不构成诊断。",
      checkout: "支付"
    },
    ja: {
      eyebrow: "一回払い・サブスクリプションなし",
      title: "必要な継続サポートを選んでください",
      lead: "どちらも同じ個別質問票を使用します。Plusでは、レポート後の変化も継続して観察できます。",
      recommended: "おすすめ",
      selected: "選択中",
      select: "このプランを選ぶ",
      standard: {
        name: "スタンダードレポート",
        description: "重要なパターンを年齢背景とともに説明する詳細なPDFです。",
        features: ["個別PDFレポート", "保護者向けの実践的な提案", "メール送付と請求書"]
      },
      plus: {
        name: "Plusサポート",
        description: "完全版レポートに14日間の観察サポートを追加します。",
        features: ["スタンダードの全内容", "共有できる1ページ要約", "場面別プランと園・学校との会話ガイド", "14日間の観察日記と傾向フォロー"]
      },
      disclosure: "Plusの内容は保護者の回答から自動生成されます。専門家による確認済み評価ではなく、診断でもありません。",
      checkout: "支払う"
    },
    ar: {
      eyebrow: "دفعة واحدة بلا اشتراك",
      title: "اختر مستوى المتابعة الذي تريده",
      lead: "يعتمد الخياران على الاستبيان المخصص نفسه. ويساعد Plus أيضا على متابعة التغيرات بعد استلام التقرير.",
      recommended: "موصى به",
      selected: "تم الاختيار",
      select: "اختر هذه الباقة",
      standard: {
        name: "التقرير القياسي",
        description: "تقرير PDF مفصل يراعي عمر الطفل ويشرح الأنماط الأهم.",
        features: ["تقرير PDF مخصص", "اقتراحات عملية للوالدين", "إرسال بالبريد الإلكتروني وفاتورة"]
      },
      plus: {
        name: "دعم Plus",
        description: "التقرير الكامل مع 14 يوما من المتابعة الموجهة.",
        features: ["كل ما في الباقة القياسية", "ملخص من صفحة واحدة قابل للمشاركة", "خطط للمواقف ودليل للحوار مع الروضة أو المدرسة", "مفكرة ملاحظة لمدة 14 يوما ومتابعة الاتجاه"]
      },
      disclosure: "يتم إنشاء محتوى Plus تلقائيا من إجابات الوالدين. لا يراجعه مختص ولا يعد تشخيصا.",
      checkout: "الدفع"
    },
    pl: {
      eyebrow: "Płatność jednorazowa, bez abonamentu",
      title: "Wybierz poziom dalszego wsparcia",
      lead: "Obie opcje korzystają z tego samego spersonalizowanego kwestionariusza. Plus pomaga też obserwować zmiany po raporcie.",
      recommended: "Polecany",
      selected: "Wybrano",
      select: "Wybierz",
      standard: {
        name: "Raport Standard",
        description: "Szczegółowy PDF uwzględniający wiek i najważniejsze wzorce.",
        features: ["Spersonalizowany raport PDF", "Praktyczne wskazówki dla rodziców", "Wysyłka emailem i faktura"]
      },
      plus: {
        name: "Wsparcie Plus",
        description: "Pełny raport oraz 14 dni ukierunkowanej obserwacji.",
        features: ["Wszystko ze Standard", "Jednostronicowe podsumowanie do udostępnienia", "Plany sytuacyjne i przewodnik do rozmowy ze szkołą", "14-dniowy dziennik i podsumowanie trendu"]
      },
      disclosure: "Treści Plus są generowane automatycznie na podstawie odpowiedzi rodzica. Nie są sprawdzane przez specjalistę i nie stanowią diagnozy.",
      checkout: "Zapłać"
    },
    pt: {
      eyebrow: "Pagamento único, sem assinatura",
      title: "Escolha o nível de acompanhamento desejado",
      lead: "As duas opções usam o mesmo questionário personalizado. O Plus também ajuda a acompanhar mudanças após o relatório.",
      recommended: "Recomendado",
      selected: "Selecionado",
      select: "Escolher",
      standard: {
        name: "Relatório Standard",
        description: "Um PDF detalhado e adaptado à idade sobre os padrões mais relevantes.",
        features: ["Relatório PDF personalizado", "Sugestões práticas para pais", "Envio por email e fatura"]
      },
      plus: {
        name: "Acompanhamento Plus",
        description: "O relatório completo com 14 dias de observação orientada.",
        features: ["Tudo do Standard", "Resumo de uma página para compartilhar", "Planos por situação e guia para conversar com a escola", "Diário de 14 dias e acompanhamento de tendência"]
      },
      disclosure: "O conteúdo Plus é gerado automaticamente a partir das respostas dos pais. Não é revisto por um profissional e não constitui diagnóstico.",
      checkout: "Pagar"
    },
    fr: {
      eyebrow: "Paiement unique, sans abonnement",
      title: "Choisissez le niveau d'accompagnement souhaité",
      lead: "Les deux options utilisent le même questionnaire personnalisé. Plus aide aussi à observer les changements après le rapport.",
      recommended: "Recommandé",
      selected: "Sélectionné",
      select: "Choisir",
      standard: {
        name: "Rapport Standard",
        description: "Un PDF détaillé, adapté à l'âge, sur les schémas les plus pertinents.",
        features: ["Rapport PDF personnalisé", "Conseils pratiques pour les parents", "Envoi par email et facture"]
      },
      plus: {
        name: "Accompagnement Plus",
        description: "Le rapport complet avec 14 jours d'observation guidée.",
        features: ["Tout le contenu Standard", "Résumé partageable d'une page", "Plans par situation et guide de dialogue avec l'école", "Journal de 14 jours et suivi de tendance"]
      },
      disclosure: "Le contenu Plus est généré automatiquement à partir des réponses du parent. Il n'est pas vérifié par un professionnel et ne constitue pas un diagnostic.",
      checkout: "Payer"
    }
  };

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
    packageCode: "standard_v1",
    draftRestored: false
  };

  const engineStatus = {
    version: ENGINE_VERSION,
    phase: "boot",
    level: "loading",
    message: "NeuroMap Kids betöltése...",
    ready: false,
    error: null,
    updatedAt: new Date().toISOString()
  };

  window.NM_ENGINE_STATUS = engineStatus;

  function installEngineBootGate() {
    if (typeof document === "undefined") return;

    document.documentElement.classList.add("nm-engine-loading");
    document.documentElement.classList.remove("nm-engine-ready", "nm-engine-failed");

    if (!document.getElementById("nm-engine-boot-style")) {
      const style = document.createElement("style");
      style.id = "nm-engine-boot-style";
      style.textContent = `
        html.nm-engine-loading {
          scroll-behavior: auto;
        }

        #nmEngineBootGate {
          align-items: center;
          background:
            radial-gradient(circle at 50% 42%, rgba(17, 151, 213, 0.10), transparent 34%),
            linear-gradient(180deg, #ffffff 0%, #f3f9fd 100%);
          color: #102033;
          display: flex;
          inset: 0;
          justify-content: center;
          opacity: 1;
          padding: 24px;
          pointer-events: auto;
          position: fixed;
          transition: opacity 0.26s ease, visibility 0.26s ease;
          visibility: visible;
          z-index: 2147483000;
        }

        html.nm-engine-ready #nmEngineBootGate {
          opacity: 0;
          pointer-events: none;
          visibility: hidden;
        }

        html.nm-engine-failed #nmEngineBootGate {
          background: linear-gradient(180deg, #fff8f4 0%, #fff 100%);
        }

        .nm-engine-boot-card {
          align-items: center;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(17, 151, 213, 0.16);
          border-radius: 22px;
          box-shadow: 0 20px 54px rgba(16, 32, 51, 0.10);
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 360px;
          padding: 24px;
          text-align: center;
          width: min(100%, 360px);
        }

        .nm-engine-boot-mark {
          align-items: center;
          display: grid;
          grid-template-columns: repeat(2, 18px);
          grid-template-rows: repeat(2, 18px);
          height: 44px;
          justify-content: center;
          position: relative;
          width: 52px;
        }

        .nm-engine-boot-mark span {
          border-radius: 999px;
          display: block;
          height: 18px;
          width: 18px;
        }

        .nm-engine-boot-mark span:nth-child(1) { background: #1197d5; }
        .nm-engine-boot-mark span:nth-child(2) { background: #ff7a00; }
        .nm-engine-boot-mark span:nth-child(3) {
          background: #72be00;
          grid-column: 1 / 3;
          justify-self: center;
        }

        .nm-engine-boot-card strong {
          color: #102033;
          font: 950 20px/1.15 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .nm-engine-boot-card p {
          color: #52677e;
          font: 700 13px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          margin: 0;
        }

        .nm-engine-boot-bar {
          background: #e7f3fa;
          border-radius: 999px;
          height: 7px;
          overflow: hidden;
          width: 100%;
        }

        .nm-engine-boot-bar::before {
          animation: nmEngineBootPulse 1.2s ease-in-out infinite;
          background: linear-gradient(90deg, #1197d5, #ff7a00, #72be00);
          border-radius: inherit;
          content: "";
          display: block;
          height: 100%;
          width: 42%;
        }

        html.nm-engine-failed .nm-engine-boot-bar::before {
          animation: none;
          background: #ff7a00;
          width: 100%;
        }

        @keyframes nmEngineBootPulse {
          0% { transform: translateX(-105%); }
          100% { transform: translateX(245%); }
        }
      `;

      (document.head || document.documentElement).appendChild(style);
    }

    if (!document.getElementById("nmEngineBootGate")) {
      const gate = document.createElement("div");
      gate.id = "nmEngineBootGate";
      gate.setAttribute("role", "status");
      gate.setAttribute("aria-live", "polite");
      gate.innerHTML = `
        <div class="nm-engine-boot-card">
          <div class="nm-engine-boot-mark" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <strong>NeuroMap Kids</strong>
          <p data-nm-engine-status-message>Kérdőív betöltése...</p>
          <div class="nm-engine-boot-bar" aria-hidden="true"></div>
        </div>
      `;

      const attach = () => {
        if (!document.body) return;
        if (!document.getElementById("nmEngineBootGate")) {
          document.body.prepend(gate);
        }
      };

      if (document.body) {
        attach();
      } else {
        document.addEventListener("DOMContentLoaded", attach, { once: true });
      }
    }
  }

  function setEngineBootStatus(phase, message, level = "loading") {
    engineStatus.phase = phase || engineStatus.phase;
    engineStatus.level = level || engineStatus.level;
    engineStatus.message = message || engineStatus.message;
    engineStatus.updatedAt = new Date().toISOString();

    const messageEl = document.querySelector("[data-nm-engine-status-message]");
    if (messageEl) messageEl.textContent = engineStatus.message;
  }

  function finishEngineBootGate(delayMs = 850) {
    engineStatus.ready = true;
    engineStatus.error = null;
    setEngineBootStatus("ready", "Kész.");

    window.setTimeout(() => {
      document.documentElement.classList.remove("nm-engine-loading", "nm-engine-failed");
      document.documentElement.classList.add("nm-engine-ready");

      window.setTimeout(() => {
        const gate = document.getElementById("nmEngineBootGate");
        if (gate) gate.remove();
      }, 360);
    }, Math.max(0, Number(delayMs || 0)));
  }

  function failEngineBootGate(message) {
    engineStatus.ready = false;
    engineStatus.error = message || "Engine init failed";
    setEngineBootStatus("failed", message || "A kérdőív betöltése nem sikerült.", "error");
    document.documentElement.classList.remove("nm-engine-ready");
    document.documentElement.classList.add("nm-engine-loading", "nm-engine-failed");
  }

  installEngineBootGate();

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
    return Object.assign({
      event_schema_version: ANALYTICS_SCHEMA_VERSION,
      app_name: "neuromap_kids",
      app_surface: "webflow",
      source: "webflow_engine",
      page_kind: getAnalyticsPageKind(),
      lang: state.lang || getLang(),
      questionnaire_version: "v5-browser-adaptive-picker",
      engine_version: ENGINE_VERSION,
      funnel_step: state.step || "landing"
    }, sanitizeAnalyticsPayload(extra || {}));
  }

  function isAnalyticsAllowed() {
    return Boolean(window.NM_LEGAL && typeof window.NM_LEGAL.isAnalyticsAllowed === "function" && window.NM_LEGAL.isAnalyticsAllowed());
  }

  function sanitizeAnalyticsPayload(payload = {}) {
    const allowedKeys = new Set([
      "event_id",
      "funnel_step",
      "package_code",
      "package_source",
      "value",
      "currency",
      "selected_lang",
      "previous_lang",
      "answer_count",
      "specific_answer_count",
      "extra_answer_count",
      "triage_question_count",
      "specific_bank_adhd_count",
      "specific_bank_asd_count",
      "specific_bank_anxiety_count",
      "specific_bank_depression_count",
      "specific_bank_learning_count"
    ]);

    return Object.keys(payload || {}).reduce((safe, key) => {
      if (allowedKeys.has(key)) safe[key] = payload[key];
      return safe;
    }, {});
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
    if (!isAnalyticsAllowed()) {
      return;
    }

    const dedupeKey = options.dedupeKey || "";
    const dedupeCacheKey = dedupeKey ? `${eventName}:${dedupeKey}` : "";

    if (dedupeCacheKey && (trackedSchemaEvents.has(dedupeCacheKey) || hasSchemaV2Event(eventName, dedupeKey))) {
      return;
    }

    if (dedupeCacheKey) {
      trackedSchemaEvents.add(dedupeCacheKey);
    }

    const enhancedPayload = getAnalyticsBasePayload(Object.assign({
      event_id: `${eventName}_${Date.now()}_${randomIdPart()}`
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

  function getApiBaseUrl() {
    const configured = String(getConfig().API_BASE_URL || "").trim();
    if (configured) return configured.replace(/\/+$/, "");
    return "https://neuromap-backend-production-969d.up.railway.app";
  }

  function loadExternalScriptOnce(src, globalName) {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);

    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === src);

      if (existing) {
        if (globalName && window[globalName]) {
          resolve(window[globalName]);
          return;
        }

        existing.addEventListener("load", () => resolve(globalName ? window[globalName] : true), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(globalName ? window[globalName] : true);
      script.onerror = () => reject(new Error("The legal consent module could not be loaded."));
      document.head.appendChild(script);
    });
  }

  function ensureLegalManager() {
    if (window.NM_LEGAL && typeof window.NM_LEGAL.ensureConsent === "function") {
      return Promise.resolve(window.NM_LEGAL);
    }

    if (!legalManagerPromise) {
      const src = `${getApiBaseUrl()}/public/webflow/legal-consent.js?v=${encodeURIComponent(LEGAL_CONSENT_VERSION)}`;
      legalManagerPromise = loadExternalScriptOnce(src, "NM_LEGAL").then((manager) => {
        if (!manager || typeof manager.ensureConsent !== "function") {
          throw new Error("The legal consent module is unavailable.");
        }
        return manager;
      });
    }

    return legalManagerPromise;
  }

  function hasConfirmedLanguage() {
    try {
      return window.sessionStorage && window.sessionStorage.getItem(LANGUAGE_CONFIRMED_KEY) === "1";
    } catch (_error) {
      return false;
    }
  }

  function markLanguageConfirmed() {
    try {
      if (window.sessionStorage) window.sessionStorage.setItem(LANGUAGE_CONFIRMED_KEY, "1");
    } catch (_error) {
      // Storage failure does not bypass checkout consent validation.
    }
  }

  function getLegalReceipt() {
    if (!window.NM_LEGAL || typeof window.NM_LEGAL.getReceipt !== "function") return null;
    return window.NM_LEGAL.getReceipt();
  }

  async function ensureLegalConsentForCurrentLanguage() {
    const manager = await ensureLegalManager();
    const receipt = await manager.ensureConsent(state.lang || getLang());
    return receipt || getLegalReceipt();
  }

  function getSupportedLanguages() {
    const configured = getConfig().SUPPORTED_LANGS;
    const supported = Array.isArray(configured) && configured.length
      ? configured
      : CAMPAIGN_SUPPORTED_LANGS;

    return supported
      .map((lang) => String(lang || "").trim().toLowerCase())
      .filter(Boolean);
  }

  function normalizeLanguageCode(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .split("-")[0];
  }

  function getRequestedLanguage() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return normalizeLanguageCode(params.get("lang") || params.get("hl"));
    } catch (_error) {
      return "";
    }
  }

  function getBrowserLanguage() {
    const candidates = Array.isArray(window.navigator && window.navigator.languages)
      ? window.navigator.languages
      : [window.navigator && window.navigator.language];

    return candidates.map(normalizeLanguageCode).find(Boolean) || "";
  }

  function getLang() {
    const supported = getSupportedLanguages();
    const requested = getRequestedLanguage();

    if (supported.includes(requested)) {
      try {
        localStorage.setItem("nm_lang", requested);
      } catch (_error) {
        // The URL language still works when storage is unavailable.
      }
      return requested;
    }

    let saved = "";
    try {
      saved = normalizeLanguageCode(localStorage.getItem("nm_lang"));
    } catch (_error) {
      saved = "";
    }

    if (supported.includes(saved)) return saved;

    const browserLanguage = getBrowserLanguage();
    if (supported.includes(browserLanguage)) return browserLanguage;

    return supported.includes("hu") ? "hu" : (supported[0] || "en");
  }

  function cleanCampaignValue(value, maxLength = 300) {
    return String(value || "")
      .trim()
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .slice(0, maxLength);
  }

  function getReferrerOrigin() {
    try {
      return document.referrer ? new URL(document.referrer).origin : "";
    } catch (_error) {
      return "";
    }
  }

  function normalizeCampaignTouch(input = {}) {
    const touch = {};

    CAMPAIGN_ATTRIBUTION_KEYS.forEach((key) => {
      const value = cleanCampaignValue(input[key], key.startsWith("utm_") ? 180 : 300);
      if (value) touch[key] = value;
    });

    const capturedAt = cleanCampaignValue(input.captured_at, 40);
    const landingPath = cleanCampaignValue(input.landing_path, 500);
    const landingUrl = cleanCampaignValue(input.landing_url, 700);
    const referrerOrigin = cleanCampaignValue(input.referrer_origin, 300);
    const lang = normalizeLanguageCode(input.lang);

    if (capturedAt) touch.captured_at = capturedAt;
    if (landingPath) touch.landing_path = landingPath;
    if (landingUrl) touch.landing_url = landingUrl;
    if (referrerOrigin) touch.referrer_origin = referrerOrigin;
    if (lang) touch.lang = lang;

    return touch;
  }

  function readCampaignAttribution() {
    try {
      const raw = localStorage.getItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const updatedAt = Date.parse(parsed && parsed.updated_at);

      if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > CAMPAIGN_ATTRIBUTION_TTL_MS) {
        localStorage.removeItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY);
        return null;
      }

      return {
        schema_version: "campaign-attribution-v1",
        first_touch: normalizeCampaignTouch(parsed.first_touch || {}),
        last_touch: normalizeCampaignTouch(parsed.last_touch || {}),
        updated_at: new Date(updatedAt).toISOString()
      };
    } catch (_error) {
      return null;
    }
  }

  function captureCampaignAttribution() {
    let params;

    try {
      params = new URLSearchParams(window.location.search || "");
    } catch (_error) {
      return readCampaignAttribution();
    }

    const touch = {};
    CAMPAIGN_ATTRIBUTION_KEYS.forEach((key) => {
      const value = cleanCampaignValue(params.get(key), key.startsWith("utm_") ? 180 : 300);
      if (value) touch[key] = value;
    });

    const hasCampaignSignal = CAMPAIGN_ATTRIBUTION_KEYS.some((key) => Boolean(touch[key]));
    if (!hasCampaignSignal) return readCampaignAttribution();

    const now = new Date().toISOString();
    const current = readCampaignAttribution();
    const normalizedTouch = normalizeCampaignTouch(Object.assign(touch, {
      captured_at: now,
      landing_path: `${window.location.pathname || "/"}${window.location.search || ""}`,
      landing_url: `${window.location.origin || ""}${window.location.pathname || "/"}`,
      referrer_origin: getReferrerOrigin(),
      lang: getRequestedLanguage() || getLang()
    }));

    const next = {
      schema_version: "campaign-attribution-v1",
      first_touch: current && Object.keys(current.first_touch || {}).length
        ? current.first_touch
        : normalizedTouch,
      last_touch: normalizedTouch,
      updated_at: now
    };

    try {
      localStorage.setItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
    } catch (_error) {
      return next;
    }

    return next;
  }

  function getCampaignAttribution() {
    return readCampaignAttribution();
  }

  const QUESTIONNAIRE_UI_FALLBACK = {
    hu: {
      pageTitle: "Első szűrőkérdőív",
      pageIntro: "Töltsd ki a kérdőívet, hogy személyre szabott visszajelzést kapj.",
      labelName: "Név",
      labelEmail: "Email",
      progressLabel: "Lépés",
      back: "Vissza",
      next: "Tovább",
      pay: "Fizetés",
      loading: "Átirányítás a fizetési oldalra...",
      missingName: "Kérlek add meg a neved.",
      missingEmail: "Kérlek add meg az email címed.",
      invalidEmail: "Az email cím formátuma nem megfelelő.",
      checkoutError: "Nem sikerült elindítani a fizetést.",
      answerRequired: "Kérlek, válaszolj minden kérdésre.",
      triageTitle: "Első szűrőkérdőív",
      introTriage: "Az első kérdőív segít felismerni, melyik terület igényelhet részletesebb figyelmet.",
      specificTitle: "Részletes kérdőív",
      introSpecific: "A következő kérdések a valószínűsíthető fő terület pontosabb feltérképezését segítik.",
      extraTitle: "Kiegészítő kérdések",
      summaryTitle: "Összegzés",
      summaryNote: "Ez egy előzetes, tájékoztató jellegű összegzés, nem diagnózis.",
      possibleFocus: "Lehetséges fő fókuszterület",
      possibleSecondary: "Másodlagos jelzés",
      specificProfileTitle: "Specifikus profil",
      severityTitle: "Jelzésszint",
      severityLabels: { low: "Alacsony", mild: "Enyhe", moderate: "Közepes", high: "Magas" },
      responseLabels: ["Nem jellemző", "Enyhén jellemző", "Gyakran jellemző", "Kifejezetten jellemző"],
      disorderNames: { ADHD: "ADHD", ASD: "Autizmus spektrum", ANXIETY: "Szorongás", DEPRESSION: "Hangulati nehézség", LEARNING: "Tanulási nehézség" }
    },
    en: {
      pageTitle: "Initial screening questionnaire",
      pageIntro: "Complete the questionnaire to receive personalized feedback.",
      labelName: "Name",
      labelEmail: "Email",
      progressLabel: "Step",
      back: "Back",
      next: "Next",
      pay: "Pay",
      loading: "Redirecting to checkout...",
      missingName: "Please enter your name.",
      missingEmail: "Please enter your email address.",
      invalidEmail: "The email address format is invalid.",
      checkoutError: "Could not start checkout.",
      answerRequired: "Please answer every question.",
      triageTitle: "Initial screening questionnaire",
      introTriage: "The first questionnaire helps identify which area may need deeper attention.",
      specificTitle: "Detailed questionnaire",
      introSpecific: "The next questions help explore the most likely focus area in more detail.",
      extraTitle: "Additional questions",
      summaryTitle: "Summary",
      summaryNote: "This is a preliminary informational summary and not a diagnosis.",
      possibleFocus: "Possible primary focus area",
      possibleSecondary: "Secondary signal",
      specificProfileTitle: "Specific profile",
      severityTitle: "Signal level",
      severityLabels: { low: "Low", mild: "Mild", moderate: "Moderate", high: "High" },
      responseLabels: ["Not typical", "Slightly typical", "Often typical", "Highly typical"],
      disorderNames: { ADHD: "ADHD", ASD: "Autism spectrum", ANXIETY: "Anxiety", DEPRESSION: "Mood difficulty", LEARNING: "Learning difficulty" }
    },
    de: {
      pageTitle: "Erster Screening-Fragebogen",
      pageIntro: "Fülle den Fragebogen aus, um eine personalisierte Rückmeldung zu erhalten.",
      labelName: "Name",
      labelEmail: "E-Mail",
      progressLabel: "Schritt",
      back: "Zurück",
      next: "Weiter",
      pay: "Bezahlen",
      loading: "Weiterleitung zur Zahlung...",
      missingName: "Bitte gib deinen Namen ein.",
      missingEmail: "Bitte gib deine E-Mail-Adresse ein.",
      invalidEmail: "Das Format der E-Mail-Adresse ist ungültig.",
      checkoutError: "Die Zahlung konnte nicht gestartet werden.",
      answerRequired: "Bitte beantworte alle Fragen.",
      triageTitle: "Erster Screening-Fragebogen",
      introTriage: "Der erste Fragebogen hilft zu erkennen, welcher Bereich genauer betrachtet werden sollte.",
      specificTitle: "Detaillierter Fragebogen",
      introSpecific: "Die nächsten Fragen erfassen den wahrscheinlichsten Schwerpunkt genauer.",
      extraTitle: "Zusatzfragen",
      summaryTitle: "Zusammenfassung",
      summaryNote: "Dies ist eine vorläufige informative Zusammenfassung und keine Diagnose.",
      possibleFocus: "Möglicher Hauptschwerpunkt",
      possibleSecondary: "Sekundäres Signal",
      specificProfileTitle: "Spezifisches Profil",
      severityTitle: "Signalstärke",
      severityLabels: { low: "Niedrig", mild: "Leicht", moderate: "Mittel", high: "Hoch" },
      responseLabels: ["Nicht typisch", "Leicht typisch", "Oft typisch", "Sehr typisch"],
      disorderNames: { ADHD: "ADHS", ASD: "Autismus-Spektrum", ANXIETY: "Angst", DEPRESSION: "Stimmungsprobleme", LEARNING: "Lernschwierigkeiten" }
    },
    it: {
      pageTitle: "Questionario di screening iniziale",
      pageIntro: "Compila il questionario per ricevere un feedback personalizzato.",
      labelName: "Nome",
      labelEmail: "Email",
      progressLabel: "Passaggio",
      back: "Indietro",
      next: "Avanti",
      pay: "Paga",
      loading: "Reindirizzamento al pagamento...",
      missingName: "Inserisci il tuo nome.",
      missingEmail: "Inserisci il tuo indirizzo email.",
      invalidEmail: "Il formato dell'email non è valido.",
      checkoutError: "Impossibile avviare il pagamento.",
      answerRequired: "Rispondi a tutte le domande.",
      triageTitle: "Questionario di screening iniziale",
      introTriage: "Il primo questionario aiuta a capire quale area merita maggiore attenzione.",
      specificTitle: "Questionario dettagliato",
      introSpecific: "Le prossime domande esplorano con più precisione l'area più probabile.",
      extraTitle: "Domande aggiuntive",
      summaryTitle: "Riepilogo",
      summaryNote: "Questo è un riepilogo preliminare informativo e non una diagnosi.",
      possibleFocus: "Possibile area principale",
      possibleSecondary: "Segnale secondario",
      specificProfileTitle: "Profilo specifico",
      severityTitle: "Livello del segnale",
      severityLabels: { low: "Basso", mild: "Lieve", moderate: "Moderato", high: "Alto" },
      responseLabels: ["Non tipico", "Lievemente tipico", "Spesso tipico", "Molto tipico"],
      disorderNames: { ADHD: "ADHD", ASD: "Spettro autistico", ANXIETY: "Ansia", DEPRESSION: "Difficoltà dell'umore", LEARNING: "Difficoltà di apprendimento" }
    },
    es: {
      pageTitle: "Cuestionario inicial de cribado",
      pageIntro: "Completa el cuestionario para recibir una orientación personalizada.",
      labelName: "Nombre",
      labelEmail: "Correo electrónico",
      progressLabel: "Paso",
      back: "Atrás",
      next: "Siguiente",
      pay: "Pagar",
      loading: "Redirigiendo al pago...",
      missingName: "Por favor, introduce tu nombre.",
      missingEmail: "Por favor, introduce tu correo electrónico.",
      invalidEmail: "El formato del correo electrónico no es válido.",
      checkoutError: "No se pudo iniciar el pago.",
      answerRequired: "Por favor, responde todas las preguntas.",
      triageTitle: "Cuestionario inicial de cribado",
      introTriage: "El primer cuestionario ayuda a identificar qué área merece más atención.",
      specificTitle: "Cuestionario detallado",
      introSpecific: "Las siguientes preguntas exploran con más detalle el área más probable.",
      extraTitle: "Preguntas adicionales",
      summaryTitle: "Resumen",
      summaryNote: "Este es un resumen preliminar informativo y no un diagnóstico.",
      possibleFocus: "Posible área principal",
      possibleSecondary: "Señal secundaria",
      specificProfileTitle: "Perfil específico",
      severityTitle: "Nivel de señal",
      severityLabels: { low: "Bajo", mild: "Leve", moderate: "Moderado", high: "Alto" },
      responseLabels: ["No típico", "Ligeramente típico", "A menudo típico", "Muy típico"],
      disorderNames: { ADHD: "TDAH", ASD: "Espectro autista", ANXIETY: "Ansiedad", DEPRESSION: "Dificultad del estado de ánimo", LEARNING: "Dificultad de aprendizaje" }
    },
    zh: {
      pageTitle: "初步筛查问卷",
      pageIntro: "完成问卷，获得个性化反馈。",
      labelName: "姓名",
      labelEmail: "电子邮箱",
      progressLabel: "步骤",
      back: "返回",
      next: "继续",
      pay: "支付",
      loading: "正在跳转到支付页面...",
      missingName: "请输入姓名。",
      missingEmail: "请输入电子邮箱地址。",
      invalidEmail: "电子邮箱格式无效。",
      checkoutError: "无法启动支付。",
      answerRequired: "请回答所有问题。",
      triageTitle: "初步筛查问卷",
      introTriage: "第一份问卷帮助识别哪个领域可能需要更深入关注。",
      specificTitle: "详细问卷",
      introSpecific: "接下来的问题将更详细地探索最可能的重点领域。",
      extraTitle: "补充问题",
      summaryTitle: "总结",
      summaryNote: "这是一份初步信息总结，不构成诊断。",
      possibleFocus: "可能的主要关注领域",
      possibleSecondary: "次要信号",
      specificProfileTitle: "具体画像",
      severityTitle: "信号水平",
      severityLabels: { low: "低", mild: "轻度", moderate: "中度", high: "高" },
      responseLabels: ["不典型", "轻微符合", "经常符合", "非常符合"],
      disorderNames: { ADHD: "注意力与多动相关表现", ASD: "自闭症谱系", ANXIETY: "焦虑", DEPRESSION: "情绪困难", LEARNING: "学习困难" }
    },
    ja: {
      pageTitle: "初期スクリーニング質問票",
      pageIntro: "質問票に回答して、個別化されたフィードバックを受け取ってください。",
      labelName: "名前",
      labelEmail: "メールアドレス",
      progressLabel: "ステップ",
      back: "戻る",
      next: "次へ",
      pay: "支払う",
      loading: "決済ページに移動しています...",
      missingName: "名前を入力してください。",
      missingEmail: "メールアドレスを入力してください。",
      invalidEmail: "メールアドレスの形式が正しくありません。",
      checkoutError: "決済を開始できませんでした。",
      answerRequired: "すべての質問に回答してください。",
      triageTitle: "初期スクリーニング質問票",
      introTriage: "最初の質問票は、より詳しく確認すべき領域を見つけるためのものです。",
      specificTitle: "詳細質問票",
      introSpecific: "次の質問は、最も可能性の高い領域をより詳しく確認するためのものです。",
      extraTitle: "追加質問",
      summaryTitle: "要約",
      summaryNote: "これは予備的な参考情報であり、診断ではありません。",
      possibleFocus: "主な可能性のある領域",
      possibleSecondary: "二次的シグナル",
      specificProfileTitle: "特定プロフィール",
      severityTitle: "シグナルレベル",
      severityLabels: { low: "低い", mild: "軽度", moderate: "中等度", high: "高い" },
      responseLabels: ["あまり当てはまらない", "やや当てはまる", "よく当てはまる", "非常によく当てはまる"],
      disorderNames: { ADHD: "ADHD", ASD: "自閉スペクトラム", ANXIETY: "不安", DEPRESSION: "気分の困難", LEARNING: "学習の困難" }
    },
    ar: {
      pageTitle: "استبيان الفحص الأولي",
      pageIntro: "أكمل الاستبيان للحصول على ملاحظات مخصصة.",
      labelName: "الاسم",
      labelEmail: "البريد الإلكتروني",
      progressLabel: "الخطوة",
      back: "رجوع",
      next: "التالي",
      pay: "الدفع",
      loading: "جارٍ التحويل إلى صفحة الدفع...",
      missingName: "يرجى إدخال الاسم.",
      missingEmail: "يرجى إدخال البريد الإلكتروني.",
      invalidEmail: "صيغة البريد الإلكتروني غير صحيحة.",
      checkoutError: "تعذر بدء عملية الدفع.",
      answerRequired: "يرجى الإجابة على جميع الأسئلة.",
      triageTitle: "استبيان الفحص الأولي",
      introTriage: "يساعد الاستبيان الأول في تحديد المجال الذي قد يحتاج إلى متابعة أعمق.",
      specificTitle: "استبيان تفصيلي",
      introSpecific: "تساعد الأسئلة التالية في فهم المجال الأكثر احتمالًا بمزيد من الدقة.",
      extraTitle: "أسئلة إضافية",
      summaryTitle: "الملخص",
      summaryNote: "هذا ملخص أولي لأغراض معلوماتية وليس تشخيصًا.",
      possibleFocus: "المجال الرئيسي المحتمل",
      possibleSecondary: "إشارة ثانوية",
      specificProfileTitle: "الملف النوعي",
      severityTitle: "مستوى الإشارة",
      severityLabels: { low: "منخفض", mild: "خفيف", moderate: "متوسط", high: "مرتفع" },
      responseLabels: ["غير نمطي", "نمطي بشكل خفيف", "نمطي غالبًا", "نمطي جدًا"],
      disorderNames: { ADHD: "فرط الحركة وتشتت الانتباه", ASD: "طيف التوحد", ANXIETY: "القلق", DEPRESSION: "صعوبة مزاجية", LEARNING: "صعوبة تعلم" }
    },
    pl: {
      pageTitle: "Wstępny kwestionariusz przesiewowy",
      pageIntro: "Wypełnij kwestionariusz, aby otrzymać spersonalizowaną informację zwrotną.",
      labelName: "Imię",
      labelEmail: "Email",
      progressLabel: "Krok",
      back: "Wstecz",
      next: "Dalej",
      pay: "Zapłać",
      loading: "Przekierowanie do płatności...",
      missingName: "Proszę podać imię.",
      missingEmail: "Proszę podać adres email.",
      invalidEmail: "Format adresu email jest nieprawidłowy.",
      checkoutError: "Nie udało się rozpocząć płatności.",
      answerRequired: "Proszę odpowiedzieć na wszystkie pytania.",
      triageTitle: "Wstępny kwestionariusz przesiewowy",
      introTriage: "Pierwszy kwestionariusz pomaga określić obszar wymagający większej uwagi.",
      specificTitle: "Szczegółowy kwestionariusz",
      introSpecific: "Kolejne pytania pomagają dokładniej zbadać najbardziej prawdopodobny obszar.",
      extraTitle: "Pytania dodatkowe",
      summaryTitle: "Podsumowanie",
      summaryNote: "To jest wstępne podsumowanie informacyjne i nie stanowi diagnozy.",
      possibleFocus: "Możliwy główny obszar",
      possibleSecondary: "Sygnał wtórny",
      specificProfileTitle: "Profil szczegółowy",
      severityTitle: "Poziom sygnału",
      severityLabels: { low: "Niski", mild: "Łagodny", moderate: "Umiarkowany", high: "Wysoki" },
      responseLabels: ["Nietypowe", "Lekko typowe", "Często typowe", "Bardzo typowe"],
      disorderNames: { ADHD: "ADHD", ASD: "Spektrum autyzmu", ANXIETY: "Lęk", DEPRESSION: "Trudność nastroju", LEARNING: "Trudność w uczeniu się" }
    },
    pt: {
      pageTitle: "Questionário inicial de triagem",
      pageIntro: "Preencha o questionário para receber uma orientação personalizada.",
      labelName: "Nome",
      labelEmail: "Email",
      progressLabel: "Etapa",
      back: "Voltar",
      next: "Avançar",
      pay: "Pagar",
      loading: "Redirecionando para o pagamento...",
      missingName: "Por favor, informe o seu nome.",
      missingEmail: "Por favor, informe o seu email.",
      invalidEmail: "O formato do email é inválido.",
      checkoutError: "Não foi possível iniciar o pagamento.",
      answerRequired: "Por favor, responda a todas as perguntas.",
      triageTitle: "Questionário inicial de triagem",
      introTriage: "O primeiro questionário ajuda a identificar qual área merece mais atenção.",
      specificTitle: "Questionário detalhado",
      introSpecific: "As próximas perguntas exploram com mais detalhe a área mais provável.",
      extraTitle: "Perguntas adicionais",
      summaryTitle: "Resumo",
      summaryNote: "Este é um resumo preliminar informativo e não é um diagnóstico.",
      possibleFocus: "Possível área principal",
      possibleSecondary: "Sinal secundário",
      specificProfileTitle: "Perfil específico",
      severityTitle: "Nível de sinal",
      severityLabels: { low: "Baixo", mild: "Leve", moderate: "Moderado", high: "Alto" },
      responseLabels: ["Não típico", "Levemente típico", "Frequentemente típico", "Muito típico"],
      disorderNames: { ADHD: "TDAH", ASD: "Espectro autista", ANXIETY: "Ansiedade", DEPRESSION: "Dificuldade de humor", LEARNING: "Dificuldade de aprendizagem" }
    },
    fr: {
      pageTitle: "Questionnaire de dépistage initial",
      pageIntro: "Complétez le questionnaire pour recevoir un retour personnalisé.",
      labelName: "Nom",
      labelEmail: "Email",
      progressLabel: "Étape",
      back: "Retour",
      next: "Suivant",
      pay: "Payer",
      loading: "Redirection vers le paiement...",
      missingName: "Veuillez saisir votre nom.",
      missingEmail: "Veuillez saisir votre adresse email.",
      invalidEmail: "Le format de l'adresse email est invalide.",
      checkoutError: "Impossible de démarrer le paiement.",
      answerRequired: "Veuillez répondre à toutes les questions.",
      triageTitle: "Questionnaire de dépistage initial",
      introTriage: "Le premier questionnaire aide à identifier le domaine qui mérite plus d'attention.",
      specificTitle: "Questionnaire détaillé",
      introSpecific: "Les questions suivantes explorent plus précisément le domaine le plus probable.",
      extraTitle: "Questions supplémentaires",
      summaryTitle: "Résumé",
      summaryNote: "Il s'agit d'un résumé préliminaire informatif et non d'un diagnostic.",
      possibleFocus: "Domaine principal possible",
      possibleSecondary: "Signal secondaire",
      specificProfileTitle: "Profil spécifique",
      severityTitle: "Niveau du signal",
      severityLabels: { low: "Faible", mild: "Léger", moderate: "Modéré", high: "Élevé" },
      responseLabels: ["Non typique", "Légèrement typique", "Souvent typique", "Très typique"],
      disorderNames: { ADHD: "TDAH", ASD: "Spectre de l'autisme", ANXIETY: "Anxiété", DEPRESSION: "Difficulté d'humeur", LEARNING: "Difficulté d'apprentissage" }
    }
  };

  function mergeUIFallback(base, override) {
    const merged = Object.assign({}, base || {}, override || {});
    ["severityLabels", "disorderNames"].forEach((key) => {
      merged[key] = Object.assign({}, (base && base[key]) || {}, (override && override[key]) || {});
    });
    return merged;
  }

  function getUI() {
    const all = window.NM_UI || {};
    const fallbackLang = window.NM_UI_FALLBACK || "en";
    const englishBase = QUESTIONNAIRE_UI_FALLBACK.en || {};
    const localBase =
      QUESTIONNAIRE_UI_FALLBACK[state.lang] ||
      QUESTIONNAIRE_UI_FALLBACK[fallbackLang] ||
      englishBase;
    const external =
      all[state.lang] ||
      all[fallbackLang] ||
      {};

    return mergeUIFallback(mergeUIFallback(englishBase, localBase), external);
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

      .nm-report-preview-v2-card,
      .nm-decision-explain-card {
        background: #ffffff;
        border: 1px solid #d9ecf7;
        border-radius: 22px;
        box-shadow: 0 14px 30px rgba(20, 32, 51, 0.06);
        margin: 16px 0;
        padding: 20px;
      }

      .nm-report-preview-v2-card h4,
      .nm-decision-explain-card h4 {
        color: #102033;
        font-size: 18px;
        font-weight: 950;
        line-height: 1.24;
        margin: 0 0 8px;
      }

      .nm-report-preview-v2-card p,
      .nm-decision-explain-card p {
        color: #506578;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.62;
        margin: 0 0 14px;
      }

      .nm-report-preview-v2-grid,
      .nm-decision-explain-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .nm-report-preview-v2-item,
      .nm-decision-explain-item {
        background: #f7fbff;
        border: 1px solid #dbeef8;
        border-radius: 16px;
        min-height: 94px;
        padding: 13px;
      }

      .nm-report-preview-v2-label,
      .nm-decision-explain-label {
        color: #6b7f93;
        display: block;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.03em;
        margin-bottom: 7px;
        text-transform: uppercase;
      }

      .nm-report-preview-v2-value,
      .nm-decision-explain-value {
        color: #102033;
        display: block;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.35;
      }

      .nm-decision-explain-card {
        background:
          linear-gradient(135deg, rgba(17, 151, 213, 0.06), rgba(255, 122, 0, 0.05)),
          #ffffff;
      }

      .nm-draft-progress {
        color: #0b86bf;
        display: block;
        font-size: 12px;
        font-weight: 850;
        margin-top: 4px;
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

      .nm-summary-top-cta-copy {
        display: grid;
        gap: 4px;
        max-width: 620px;
      }

      .nm-summary-top-cta-copy strong {
        color: #102033;
        display: block;
        font-size: 15px;
        font-weight: 950;
        line-height: 1.25;
      }

      .nm-summary-top-cta-copy span {
        display: block;
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
        .nm-report-preview-v2-card,
        .nm-decision-explain-card,
        .nm-report-teaser-card {
          border-radius: 18px;
          padding: 18px;
        }

        .nm-report-teaser-grid,
        .nm-report-preview-v2-grid,
        .nm-decision-explain-grid {
          grid-template-columns: 1fr;
        }

        .nm-summary-science-grid {
          grid-template-columns: 1fr;
        }

        .nm-trust-grid {
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
        left: 0 !important;
        position: fixed !important;
        right: 0 !important;
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
        left: 0 !important;
        position: fixed !important;
        right: 0 !important;
        top: 0 !important;
        z-index: 999 !important;
      }

      html.nm-questionnaire-open .nm-social-landing .nm-hero,
      html.nm-questionnaire-open .nm-landing .nm-hero,
      html.nm-questionnaire-open .nm-social-landing .nm-section:not(.nm-topbar),
      html.nm-questionnaire-open .nm-landing .nm-section:not(.nm-topbar),
      html.nm-questionnaire-open #nmSocialLanding > :not(.nm-topbar):not(#questionnaireStart):not(#nmApp):not(#languageModal),
      html.nm-questionnaire-open .nm-social-landing > :not(.nm-topbar):not(#questionnaireStart):not(#nmApp):not(#languageModal),
      html.nm-questionnaire-open .nm-landing > :not(.nm-topbar):not(#questionnaireStart):not(#nmApp):not(#languageModal),
      html.nm-questionnaire-open [data-nm-section="hero"],
      html.nm-questionnaire-open [data-nm-hidden-for-questionnaire="1"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }

      html.nm-questionnaire-open body {
        background: #f4f9fc !important;
        padding-top: 66px !important;
      }

      html.nm-questionnaire-open #questionnaireStart,
      html.nm-questionnaire-open #nmApp {
        margin-top: 18px !important;
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

      .nm-social-landing .nm-hero .nm-trust-row,
      .nm-landing .nm-hero .nm-trust-row,
      [data-nm-section="hero"] .nm-trust-row {
        display: none !important;
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

      .nm-mini-demo-card h3,
      .nm-summary-next-card h4,
      .nm-summary-science-card h4 {
        color: #102033 !important;
        font-size: 18px !important;
        line-height: 1.25 !important;
        margin: 0 0 8px !important;
      }

      .nm-mini-demo-card p,
      .nm-summary-next-card p,
      .nm-summary-science-card p {
        color: #52677e !important;
        font-size: 13px !important;
        line-height: 1.55 !important;
        margin: 0 0 12px !important;
      }

      .nm-mini-demo-grid,
      .nm-summary-next-grid {
        display: grid !important;
        gap: 10px !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }

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

      .nm-mini-demo-note {
        color: #64748b !important;
        display: block !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
        margin-top: 12px !important;
      }

      @media (max-width: 720px) {
        html.nm-questionnaire-open #questionnaireStart,
        html.nm-questionnaire-open #nmApp {
          margin-top: 76px !important;
        }

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

        .nm-mini-demo-grid,
        .nm-summary-next-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  const LANDING_FALLBACK_TEXT = {
    "hu": {
      "modalTitle": "Válassz nyelvet",
      "modalIntro": "Válaszd ki a kívánt nyelvet.",
      "heroTitle": "Értsd meg, mi állhat gyermeked viselkedése mögött",
      "heroSub": "10 perces kérdőív után személyre szabott, szülőbarát riportot és PDF-et kapsz.",
      "primaryCta": "Kezdjük ->",
      "microcopy": "7,99 USD-től - két csomag - nincs előfizetés",
      "trust1": "kb. 10 perc",
      "trust2": "PDF riport emailben",
      "trust3": "strukturált elemzés",
      "valueTitle": "Mit kapsz pontosan?",
      "value1": "személyre szabott értelmezés a válaszok alapján",
      "value2": "viselkedési, érzelmi és tanulási mintázatok kiemelve",
      "value3": "gyakorlati, szülőként is azonnal használható javaslatok",
      "value4": "brandelt PDF riport emailben",
      "stepsTitle": "Így működik",
      "step1": "1. Kitöltöd a rövid előszűrő kérdőívet",
      "step2": "2. A rendszer kiválasztja a releváns specifikus kérdéssort",
      "step3": "3. Fizetés után elkészül és emailben megérkezik a riport",
      "previewTitle": "Így néz ki a riport",
      "previewCaption": "Minta előnézet: a teljes riport személyre szabottan, PDF-ben érkezik.",
      "reasonTitle": "Miért éri meg most kitölteni?",
      "reasonBody": "A rövid kérdőív után nem csak egy címkét kapsz, hanem érthető irányt: mire figyelj otthon, mikor érdemes szakemberhez fordulni, és milyen következő lépés lehet hasznos.",
      "reasonParent": "Kevesebb bizonytalanság",
      "reasonSchool": "Könnyebb egyeztetés óvodával vagy iskolával",
      "reasonCalm": "Nyugodtabb, rendezettebb kép",
      "reasonNote": "A cél nem a megijesztés, hanem a mintázatok érthető összerendezése.",
      "demoTitle": "Mit mutat meg a teljes riport?",
      "demoLead": "A teljes PDF a válaszokból kirajzolódó fő és másodlagos jelzést, a korosztályi kontextust és a gyakorlati javaslatokat együtt magyarázza el.",
      "demoMetric1": "Fő mintázat",
      "demoMetric2": "Korosztályi nézőpont",
      "demoMetric3": "Következő lépések",
      "demoNote": "A riport szülőbarát, strukturált és nem diagnosztikus nyelven készül.",
      "trustTitle": "Fontos tudni",
      "trustText": "A NeuroMap Kids nem diagnózis, hanem strukturált előszűrés.",
      "priceTitle": "Egyszeri díj",
      "priceValue": "7,99 USD-től",
      "priceCta": "Riport elkészítése ->",
      "priceMicrocopy": "Nincs előfizetés - biztonságos fizetés - PDF emailben",
      "stickyCta": "Kezdjük ->"
    },
    "en": {
      "modalTitle": "Choose language",
      "modalIntro": "Select your preferred language.",
      "heroTitle": "Understand what may be behind your child's behavior",
      "heroSub": "After a 10-minute questionnaire, you receive a personalized, parent-friendly report and PDF.",
      "primaryCta": "Start ->",
      "microcopy": "From $7.99 - two options - no subscription",
      "trust1": "about 10 minutes",
      "trust2": "PDF report by email",
      "trust3": "structured analysis",
      "valueTitle": "What you get",
      "value1": "personalized interpretation based on your answers",
      "value2": "behavioral, emotional, and learning patterns highlighted",
      "value3": "practical parent-friendly suggestions",
      "value4": "branded PDF report by email",
      "stepsTitle": "How it works",
      "step1": "1. Complete the short screening questionnaire",
      "step2": "2. The system selects the relevant specific question set",
      "step3": "3. After payment, the report is generated and sent by email",
      "previewTitle": "What the report looks like",
      "previewCaption": "Sample preview: the full report is personalized and delivered as a PDF.",
      "reasonTitle": "Why complete it now?",
      "reasonBody": "After the short questionnaire, you receive more than a label: a clearer direction for what to observe, when to seek professional guidance, and what next step may be useful.",
      "reasonParent": "Less uncertainty",
      "reasonSchool": "Better conversations with preschool or school",
      "reasonCalm": "A calmer structured picture",
      "reasonNote": "The goal is to organize the patterns in a calm, parent-friendly way.",
      "demoTitle": "What does the full report clarify?",
      "demoLead": "The full PDF explains the primary and secondary signals, age context, and practical suggestions together.",
      "demoMetric1": "Primary pattern",
      "demoMetric2": "Age-aware context",
      "demoMetric3": "Next steps",
      "demoNote": "The report is parent-friendly, structured, and non-diagnostic.",
      "trustTitle": "Important to know",
      "trustText": "NeuroMap Kids is not a diagnosis.",
      "priceTitle": "One-time payment",
      "priceValue": "From $7.99",
      "priceCta": "Get report ->",
      "priceMicrocopy": "No subscription - Secure payment - PDF by email",
      "stickyCta": "Start ->"
    },
    "de": {
      "modalTitle": "Sprache wählen",
      "modalIntro": "Wähle deine bevorzugte Sprache.",
      "heroTitle": "Verstehe, was hinter dem Verhalten deines Kindes stehen kann",
      "heroSub": "Nach einem 10-minütigen Fragebogen erhältst du einen personalisierten, elternfreundlichen PDF-Bericht.",
      "primaryCta": "Starten ->",
      "microcopy": "Ab 7,99 USD - zwei Optionen - kein Abo",
      "trust1": "ca. 10 Minuten",
      "trust2": "PDF-Bericht per E-Mail",
      "trust3": "strukturierte Analyse",
      "valueTitle": "Was bekommst du genau?",
      "value1": "personalisierte Einordnung auf Basis deiner Antworten",
      "value2": "Verhaltens-, Emotions- und Lernmuster hervorgehoben",
      "value3": "praktische, elternfreundliche Empfehlungen",
      "value4": "PDF-Bericht per E-Mail",
      "stepsTitle": "So funktioniert es",
      "step1": "1. Du füllst den kurzen Screening-Fragebogen aus",
      "step2": "2. Das System wählt den passenden Detailfragebogen",
      "step3": "3. Nach der Zahlung wird der Bericht erstellt und per E-Mail gesendet",
      "previewTitle": "So sieht der Bericht aus",
      "previewCaption": "Beispielvorschau: Der vollständige Bericht wird personalisiert als PDF geliefert.",
      "reasonTitle": "Warum jetzt ausfüllen?",
      "reasonBody": "Nach dem kurzen Fragebogen erhältst du mehr als ein Etikett: eine verständliche Richtung für Beobachtung, Beratung und nächste Schritte.",
      "reasonParent": "Weniger Unsicherheit",
      "reasonSchool": "Bessere Gespräche mit Kita oder Schule",
      "reasonCalm": "Ein ruhigeres, geordnetes Bild",
      "reasonNote": "Ziel ist nicht zu erschrecken, sondern Muster verständlich zu ordnen.",
      "demoTitle": "Was erklärt der vollständige Bericht?",
      "demoLead": "Der PDF-Bericht erklärt Haupt- und Nebensignale, Alterskontext und praktische Empfehlungen zusammen.",
      "demoMetric1": "Hauptmuster",
      "demoMetric2": "Alterskontext",
      "demoMetric3": "Nächste Schritte",
      "demoNote": "Der Bericht ist elternfreundlich, strukturiert und nicht diagnostisch.",
      "trustTitle": "Wichtig zu wissen",
      "trustText": "NeuroMap Kids ist keine Diagnose, sondern ein strukturiertes Screening.",
      "priceTitle": "Einmalige Zahlung",
      "priceValue": "Ab 7,99 USD",
      "priceCta": "Bericht erhalten ->",
      "priceMicrocopy": "Kein Abo - sichere Zahlung - PDF per E-Mail",
      "stickyCta": "Starten ->"
    },
    "it": {
      "modalTitle": "Scegli la lingua",
      "modalIntro": "Seleziona la lingua che preferisci.",
      "heroTitle": "Capisci cosa può esserci dietro il comportamento di tuo figlio",
      "heroSub": "Dopo un questionario di 10 minuti ricevi un report PDF personalizzato e chiaro per genitori.",
      "primaryCta": "Inizia ->",
      "microcopy": "Da 7,99 USD - due opzioni - nessun abbonamento",
      "trust1": "circa 10 minuti",
      "trust2": "PDF via email",
      "trust3": "analisi strutturata",
      "valueTitle": "Cosa ricevi?",
      "value1": "interpretazione personalizzata in base alle risposte",
      "value2": "pattern comportamentali, emotivi e di apprendimento evidenziati",
      "value3": "suggerimenti pratici e rassicuranti per genitori",
      "value4": "report PDF brandizzato via email",
      "stepsTitle": "Come funziona",
      "step1": "1. Compili il breve questionario iniziale",
      "step2": "2. Il sistema seleziona le domande specifiche più rilevanti",
      "step3": "3. Dopo il pagamento, il report viene generato e inviato via email",
      "previewTitle": "Come appare il report",
      "previewCaption": "Anteprima di esempio: il report completo arriva come PDF personalizzato.",
      "reasonTitle": "Perché compilarlo ora?",
      "reasonBody": "Dopo il questionario ricevi una direzione chiara su cosa osservare, quando chiedere supporto e quale passo può essere utile.",
      "reasonParent": "Meno incertezza",
      "reasonSchool": "Dialogo più chiaro con scuola o asilo",
      "reasonCalm": "Una visione più ordinata",
      "reasonNote": "L'obiettivo non è spaventare, ma organizzare i pattern in modo comprensibile.",
      "demoTitle": "Cosa chiarisce il report completo?",
      "demoLead": "Il PDF spiega segnali principali e secondari, contesto d'età e suggerimenti pratici.",
      "demoMetric1": "Pattern principale",
      "demoMetric2": "Contesto d'età",
      "demoMetric3": "Prossimi passi",
      "demoNote": "Il report è chiaro per genitori, strutturato e non diagnostico.",
      "trustTitle": "Importante sapere",
      "trustText": "NeuroMap Kids non è una diagnosi, ma uno screening strutturato.",
      "priceTitle": "Pagamento unico",
      "priceValue": "Da 7,99 USD",
      "priceCta": "Ricevi il report ->",
      "priceMicrocopy": "Nessun abbonamento - pagamento sicuro - PDF via email",
      "stickyCta": "Inizia ->"
    },
    "es": {
      "modalTitle": "Elige idioma",
      "modalIntro": "Selecciona tu idioma preferido.",
      "heroTitle": "Comprende qué puede haber detrás del comportamiento de tu hijo",
      "heroSub": "Tras un cuestionario de 10 minutos recibes un informe PDF personalizado y claro para familias.",
      "primaryCta": "Empezar ->",
      "microcopy": "Desde 7,99 USD - dos opciones - sin suscripción",
      "trust1": "unos 10 minutos",
      "trust2": "PDF por email",
      "trust3": "análisis estructurado",
      "valueTitle": "¿Qué recibes?",
      "value1": "interpretación personalizada según tus respuestas",
      "value2": "patrones conductuales, emocionales y de aprendizaje destacados",
      "value3": "sugerencias prácticas y tranquilizadoras para familias",
      "value4": "informe PDF por email",
      "stepsTitle": "Cómo funciona",
      "step1": "1. Completas el breve cuestionario inicial",
      "step2": "2. El sistema selecciona el bloque específico más relevante",
      "step3": "3. Tras el pago, el informe se genera y llega por email",
      "previewTitle": "Así se ve el informe",
      "previewCaption": "Vista previa de ejemplo: el informe completo llega personalizado en PDF.",
      "reasonTitle": "¿Por qué completarlo ahora?",
      "reasonBody": "Después del cuestionario recibes una dirección clara sobre qué observar, cuándo consultar y qué siguiente paso puede ser útil.",
      "reasonParent": "Menos incertidumbre",
      "reasonSchool": "Mejor conversación con la escuela",
      "reasonCalm": "Una imagen más ordenada",
      "reasonNote": "El objetivo no es asustar, sino ordenar los patrones de forma comprensible.",
      "demoTitle": "¿Qué aclara el informe completo?",
      "demoLead": "El PDF explica señales principales y secundarias, contexto de edad y sugerencias prácticas.",
      "demoMetric1": "Patrón principal",
      "demoMetric2": "Contexto de edad",
      "demoMetric3": "Próximos pasos",
      "demoNote": "El informe es claro para familias, estructurado y no diagnóstico.",
      "trustTitle": "Importante",
      "trustText": "NeuroMap Kids no es un diagnóstico, sino un cribado estructurado.",
      "priceTitle": "Pago único",
      "priceValue": "Desde 7,99 USD",
      "priceCta": "Recibir informe ->",
      "priceMicrocopy": "Sin suscripción - pago seguro - PDF por email",
      "stickyCta": "Empezar ->"
    },
    "zh": {
      "modalTitle": "选择语言",
      "modalIntro": "请选择你偏好的语言。",
      "heroTitle": "理解孩子行为背后的可能原因",
      "heroSub": "完成约10分钟的问卷后，你会收到一份个性化、家长友好的PDF报告。",
      "primaryCta": "开始 ->",
      "microcopy": "7.99美元起 - 两种方案 - 无订阅",
      "trust1": "约10分钟",
      "trust2": "PDF报告通过邮件发送",
      "trust3": "结构化分析",
      "valueTitle": "你会得到什么？",
      "value1": "基于回答的个性化解读",
      "value2": "突出行为、情绪和学习模式",
      "value3": "家长可立即使用的实际建议",
      "value4": "品牌化PDF报告通过邮件发送",
      "stepsTitle": "流程说明",
      "step1": "1. 完成简短的初筛问卷",
      "step2": "2. 系统选择最相关的详细问题组",
      "step3": "3. 付款后生成报告并通过邮件发送",
      "previewTitle": "报告预览",
      "previewCaption": "示例预览：完整报告会以个性化PDF形式发送。",
      "reasonTitle": "为什么现在填写？",
      "reasonBody": "简短问卷后，你得到的不只是标签，而是更清晰的观察方向、咨询时机和下一步建议。",
      "reasonParent": "减少不确定感",
      "reasonSchool": "更容易与学校沟通",
      "reasonCalm": "更清晰、更安心的图像",
      "reasonNote": "目标不是制造恐惧，而是把模式整理得更容易理解。",
      "demoTitle": "完整报告会说明什么？",
      "demoLead": "PDF会结合主要和次要信号、年龄背景以及实用建议进行解释。",
      "demoMetric1": "主要模式",
      "demoMetric2": "年龄背景",
      "demoMetric3": "下一步",
      "demoNote": "报告面向家长、结构清晰，且不作诊断。",
      "trustTitle": "重要说明",
      "trustText": "NeuroMap Kids不是诊断，而是结构化初筛。",
      "priceTitle": "一次性付款",
      "priceValue": "7.99美元起",
      "priceCta": "获取报告 ->",
      "priceMicrocopy": "无订阅 - 安全支付 - PDF邮件发送",
      "stickyCta": "开始 ->"
    },
    "ja": {
      "modalTitle": "言語を選択",
      "modalIntro": "希望する言語を選んでください。",
      "heroTitle": "お子さまの行動の背景にある可能性を理解する",
      "heroSub": "約10分の質問票に回答すると、保護者向けにわかりやすい個別PDFレポートを受け取れます。",
      "primaryCta": "開始 ->",
      "microcopy": "7.99米ドルから - 2つのプラン - サブスクなし",
      "trust1": "約10分",
      "trust2": "PDFレポートをメールで送付",
      "trust3": "構造化された分析",
      "valueTitle": "受け取れる内容",
      "value1": "回答に基づく個別の解釈",
      "value2": "行動・感情・学習のパターンを整理",
      "value3": "保護者が使いやすい実践的な提案",
      "value4": "PDFレポートをメールで送付",
      "stepsTitle": "利用の流れ",
      "step1": "1. 短い初期スクリーニングに回答",
      "step2": "2. システムが関連する詳細質問を選択",
      "step3": "3. 支払い後、レポートが作成されメールで届きます",
      "previewTitle": "レポートの見え方",
      "previewCaption": "サンプル表示：完全版は個別PDFとして届きます。",
      "reasonTitle": "なぜ今回答する価値があるのか",
      "reasonBody": "短い質問票の後、単なるラベルではなく、家庭で何を見るか、専門家に相談するタイミング、次の一歩を考える方向性が得られます。",
      "reasonParent": "不安を減らす",
      "reasonSchool": "園や学校との話し合いをしやすくする",
      "reasonCalm": "落ち着いて整理された見通し",
      "reasonNote": "目的は不安にさせることではなく、パターンをわかりやすく整理することです。",
      "demoTitle": "完全版レポートでわかること",
      "demoLead": "PDFでは、主なサインと二次的なサイン、年齢背景、実践的な提案をあわせて説明します。",
      "demoMetric1": "主なパターン",
      "demoMetric2": "年齢に応じた文脈",
      "demoMetric3": "次のステップ",
      "demoNote": "レポートは保護者向けで、構造化されており、診断ではありません。",
      "trustTitle": "大切なこと",
      "trustText": "NeuroMap Kidsは診断ではなく、構造化されたスクリーニングです。",
      "priceTitle": "一回払い",
      "priceValue": "7.99米ドルから",
      "priceCta": "レポートを受け取る ->",
      "priceMicrocopy": "サブスクなし - 安全な支払い - PDFをメールで送付",
      "stickyCta": "開始 ->"
    },
    "ar": {
      "modalTitle": "اختر اللغة",
      "modalIntro": "اختر اللغة التي تفضلها.",
      "heroTitle": "افهم ما قد يكون وراء سلوك طفلك",
      "heroSub": "بعد استبيان يستغرق نحو 10 دقائق، تحصل على تقرير PDF مخصص وواضح للوالدين.",
      "primaryCta": "ابدأ ->",
      "microcopy": "ابتداء من 7.99 دولار - خياران - بدون اشتراك",
      "trust1": "نحو 10 دقائق",
      "trust2": "تقرير PDF عبر البريد الإلكتروني",
      "trust3": "تحليل منظم",
      "valueTitle": "ماذا ستحصل عليه؟",
      "value1": "تفسير مخصص بناء على إجاباتك",
      "value2": "إبراز أنماط السلوك والمشاعر والتعلم",
      "value3": "اقتراحات عملية ومطمئنة للوالدين",
      "value4": "تقرير PDF عبر البريد الإلكتروني",
      "stepsTitle": "كيف يعمل",
      "step1": "1. تكمل استبيان الفرز القصير",
      "step2": "2. يختار النظام مجموعة الأسئلة التفصيلية المناسبة",
      "step3": "3. بعد الدفع، يتم إنشاء التقرير وإرساله بالبريد الإلكتروني",
      "previewTitle": "شكل التقرير",
      "previewCaption": "معاينة نموذجية: يصل التقرير الكامل بصيغة PDF مخصصة.",
      "reasonTitle": "لماذا يستحق تعبئته الآن؟",
      "reasonBody": "بعد الاستبيان القصير لا تحصل على تسمية فقط، بل على اتجاه أوضح لما يجب ملاحظته ومتى قد يكون طلب الإرشاد المتخصص مفيدا.",
      "reasonParent": "تقليل الحيرة",
      "reasonSchool": "حوار أوضح مع الروضة أو المدرسة",
      "reasonCalm": "صورة أهدأ وأكثر تنظيما",
      "reasonNote": "الهدف ليس التخويف، بل ترتيب الأنماط بطريقة مفهومة ومطمئنة.",
      "demoTitle": "ماذا يوضح التقرير الكامل؟",
      "demoLead": "يوضح تقرير PDF الإشارات الأساسية والثانوية والسياق العمري والاقتراحات العملية معا.",
      "demoMetric1": "النمط الأساسي",
      "demoMetric2": "السياق العمري",
      "demoMetric3": "الخطوات التالية",
      "demoNote": "التقرير موجه للوالدين ومنظم وليس تشخيصا.",
      "trustTitle": "معلومة مهمة",
      "trustText": "NeuroMap Kids ليس تشخيصا، بل فرز أولي منظم.",
      "priceTitle": "دفعة واحدة",
      "priceValue": "ابتداء من 7.99 دولار",
      "priceCta": "احصل على التقرير ->",
      "priceMicrocopy": "بدون اشتراك - دفع آمن - PDF عبر البريد الإلكتروني",
      "stickyCta": "ابدأ ->"
    },
    "pl": {
      "modalTitle": "Wybierz język",
      "modalIntro": "Wybierz preferowany język.",
      "heroTitle": "Zrozum, co może stać za zachowaniem Twojego dziecka",
      "heroSub": "Po 10-minutowym kwestionariuszu otrzymasz spersonalizowany raport PDF przyjazny rodzicom.",
      "primaryCta": "Zacznij ->",
      "microcopy": "Od 7,99 USD - dwie opcje - bez abonamentu",
      "trust1": "ok. 10 minut",
      "trust2": "raport PDF emailem",
      "trust3": "analiza strukturalna",
      "valueTitle": "Co otrzymasz?",
      "value1": "spersonalizowaną interpretację na podstawie odpowiedzi",
      "value2": "wyróżnione wzorce zachowania, emocji i uczenia się",
      "value3": "praktyczne, spokojne wskazówki dla rodziców",
      "value4": "raport PDF emailem",
      "stepsTitle": "Jak to działa",
      "step1": "1. Wypełniasz krótki kwestionariusz przesiewowy",
      "step2": "2. System wybiera odpowiedni zestaw pytań szczegółowych",
      "step3": "3. Po płatności raport powstaje i przychodzi emailem",
      "previewTitle": "Jak wygląda raport",
      "previewCaption": "Podgląd przykładowy: pełny raport przychodzi jako spersonalizowany PDF.",
      "reasonTitle": "Dlaczego warto wypełnić teraz?",
      "reasonBody": "Po krótkim kwestionariuszu otrzymujesz nie tylko etykietę, ale jasny kierunek obserwacji, rozmowy ze specjalistą i kolejnych kroków.",
      "reasonParent": "Mniej niepewności",
      "reasonSchool": "Łatwiejsza rozmowa ze szkołą lub przedszkolem",
      "reasonCalm": "Spokojniejszy, uporządkowany obraz",
      "reasonNote": "Celem nie jest straszenie, lecz zrozumiałe uporządkowanie wzorców.",
      "demoTitle": "Co wyjaśnia pełny raport?",
      "demoLead": "PDF łączy sygnały główne i wtórne, kontekst wieku oraz praktyczne wskazówki.",
      "demoMetric1": "Główny wzorzec",
      "demoMetric2": "Kontekst wieku",
      "demoMetric3": "Kolejne kroki",
      "demoNote": "Raport jest przyjazny rodzicom, uporządkowany i niediagnostyczny.",
      "trustTitle": "Ważne",
      "trustText": "NeuroMap Kids nie jest diagnozą, lecz strukturalnym screeningiem.",
      "priceTitle": "Płatność jednorazowa",
      "priceValue": "Od 7,99 USD",
      "priceCta": "Otrzymaj raport ->",
      "priceMicrocopy": "Bez abonamentu - bezpieczna płatność - PDF emailem",
      "stickyCta": "Zacznij ->"
    },
    "pt": {
      "modalTitle": "Escolher idioma",
      "modalIntro": "Escolha o idioma de preferência.",
      "heroTitle": "Entenda o que pode estar por trás do comportamento do seu filho",
      "heroSub": "Após um questionário de 10 minutos, você recebe um relatório PDF personalizado e claro para pais.",
      "primaryCta": "Começar ->",
      "microcopy": "Desde 7,99 USD - duas opções - sem assinatura",
      "trust1": "cerca de 10 minutos",
      "trust2": "PDF por email",
      "trust3": "análise estruturada",
      "valueTitle": "O que você recebe?",
      "value1": "interpretação personalizada com base nas respostas",
      "value2": "padrões comportamentais, emocionais e de aprendizagem destacados",
      "value3": "sugestões práticas e tranquilizadoras para pais",
      "value4": "relatório PDF por email",
      "stepsTitle": "Como funciona",
      "step1": "1. Você preenche o questionário breve",
      "step2": "2. O sistema seleciona o conjunto específico mais relevante",
      "step3": "3. Após o pagamento, o relatório é gerado e enviado por email",
      "previewTitle": "Como é o relatório",
      "previewCaption": "Prévia de exemplo: o relatório completo chega como PDF personalizado.",
      "reasonTitle": "Por que preencher agora?",
      "reasonBody": "Depois do questionário, você recebe uma direção clara sobre o que observar, quando buscar orientação e qual próximo passo pode ajudar.",
      "reasonParent": "Menos incerteza",
      "reasonSchool": "Melhor conversa com escola ou pré-escola",
      "reasonCalm": "Uma visão mais organizada",
      "reasonNote": "O objetivo não é assustar, mas organizar os padrões de forma compreensível.",
      "demoTitle": "O que o relatório completo esclarece?",
      "demoLead": "O PDF explica sinais principais e secundários, contexto de idade e sugestões práticas.",
      "demoMetric1": "Padrão principal",
      "demoMetric2": "Contexto da idade",
      "demoMetric3": "Próximos passos",
      "demoNote": "O relatório é claro para pais, estruturado e não diagnóstico.",
      "trustTitle": "Importante saber",
      "trustText": "NeuroMap Kids não é diagnóstico, mas uma triagem estruturada.",
      "priceTitle": "Pagamento único",
      "priceValue": "Desde 7,99 USD",
      "priceCta": "Receber relatório ->",
      "priceMicrocopy": "Sem assinatura - pagamento seguro - PDF por email",
      "stickyCta": "Começar ->"
    },
    "fr": {
      "modalTitle": "Choisir la langue",
      "modalIntro": "Choisissez votre langue préférée.",
      "heroTitle": "Comprendre ce qui peut se cacher derrière le comportement de votre enfant",
      "heroSub": "Après un questionnaire de 10 minutes, vous recevez un rapport PDF personnalisé et clair pour les parents.",
      "primaryCta": "Commencer ->",
      "microcopy": "À partir de 7,99 USD - deux options - sans abonnement",
      "trust1": "environ 10 minutes",
      "trust2": "PDF par email",
      "trust3": "analyse structurée",
      "valueTitle": "Ce que vous recevez",
      "value1": "interprétation personnalisée selon vos réponses",
      "value2": "mise en évidence des patterns comportementaux, émotionnels et d'apprentissage",
      "value3": "suggestions pratiques et rassurantes pour les parents",
      "value4": "rapport PDF par email",
      "stepsTitle": "Comment ça marche",
      "step1": "1. Vous remplissez le court questionnaire initial",
      "step2": "2. Le système sélectionne le module spécifique pertinent",
      "step3": "3. Après paiement, le rapport est généré et envoyé par email",
      "previewTitle": "À quoi ressemble le rapport",
      "previewCaption": "Aperçu exemple : le rapport complet arrive en PDF personnalisé.",
      "reasonTitle": "Pourquoi le remplir maintenant ?",
      "reasonBody": "Après le questionnaire, vous recevez une direction claire : quoi observer, quand demander conseil et quelle étape peut être utile.",
      "reasonParent": "Moins d'incertitude",
      "reasonSchool": "Dialogue plus clair avec l'école",
      "reasonCalm": "Une vision plus structurée",
      "reasonNote": "L'objectif n'est pas d'inquiéter, mais d'organiser les patterns de façon compréhensible.",
      "demoTitle": "Que clarifie le rapport complet ?",
      "demoLead": "Le PDF explique les signaux principaux et secondaires, le contexte d'âge et les suggestions pratiques.",
      "demoMetric1": "Pattern principal",
      "demoMetric2": "Contexte d'âge",
      "demoMetric3": "Prochaines étapes",
      "demoNote": "Le rapport est clair pour les parents, structuré et non diagnostique.",
      "trustTitle": "Important",
      "trustText": "NeuroMap Kids n'est pas un diagnostic, mais un screening structuré.",
      "priceTitle": "Paiement unique",
      "priceValue": "À partir de 7,99 USD",
      "priceCta": "Recevoir le rapport ->",
      "priceMicrocopy": "Sans abonnement - paiement sécurisé - PDF par email",
      "stickyCta": "Commencer ->"
    }
  };

  function getLandingFallbackText(lang = state.lang) {
    return LANDING_FALLBACK_TEXT[lang] || LANDING_FALLBACK_TEXT.en || null;
  }

  function normalizeClientPackageCode(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return Object.hasOwn(CLIENT_PACKAGE_CATALOG, normalized) ? normalized : "standard_v1";
  }

  function readStoredPackageCode() {
    try {
      const stored = String(localStorage.getItem(PACKAGE_STORAGE_KEY) || "").trim().toLowerCase();
      return Object.hasOwn(CLIENT_PACKAGE_CATALOG, stored) ? stored : null;
    } catch (_error) {
      return null;
    }
  }

  function getStoredPackageCode() {
    return readStoredPackageCode() || "standard_v1";
  }

  function getSelectedClientPackage() {
    return CLIENT_PACKAGE_CATALOG[normalizeClientPackageCode(state.packageCode)];
  }

  function getPackageSelectorCopy(lang = state.lang) {
    return PACKAGE_SELECTOR_COPY[lang] || PACKAGE_SELECTOR_COPY.en;
  }

  function formatPackagePrice(productPackage, lang = state.lang) {
    const localeMap = {
      hu: "hu-HU",
      en: "en-US",
      de: "de-DE",
      it: "it-IT",
      es: "es-ES",
      zh: "zh-CN",
      ja: "ja-JP",
      ar: "ar",
      pl: "pl-PL",
      pt: "pt-PT",
      fr: "fr-FR"
    };

    try {
      return new Intl.NumberFormat(localeMap[lang] || "en-US", {
        style: "currency",
        currency: productPackage.currency,
        minimumFractionDigits: 2
      }).format(productPackage.amount / 100);
    } catch (_error) {
      return `$${(productPackage.amount / 100).toFixed(2)}`;
    }
  }

  function installPackageSelectorStyles() {
    if (document.getElementById("nm-package-selector-style")) return;

    const style = document.createElement("style");
    style.id = "nm-package-selector-style";
    style.textContent = `
      .nm-landing-package-section {
        background: #ffffff;
        border-bottom: 1px solid #e4eef5;
        border-top: 1px solid #e4eef5;
        box-sizing: border-box;
        padding: clamp(26px, 4vw, 42px) clamp(18px, 4vw, 32px);
        width: 100%;
      }

      .nm-package-selector {
        box-sizing: border-box;
        margin: 22px auto;
        max-width: 860px;
        text-align: start;
        width: 100%;
      }

      .nm-landing-package-section .nm-package-selector {
        margin: 0 auto;
      }

      .nm-package-selector * {
        box-sizing: border-box;
      }

      .nm-package-selector-head {
        margin: 0 auto 14px;
        max-width: 720px;
        text-align: center;
      }

      .nm-package-selector-eyebrow {
        color: #087fb7;
        display: block;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0;
        margin-bottom: 5px;
        text-transform: uppercase;
      }

      .nm-package-selector-head h3 {
        color: #102033;
        font-size: 22px;
        line-height: 1.22;
        margin: 0 0 7px;
      }

      .nm-package-selector-head p {
        color: #49627a;
        font-size: 14px;
        line-height: 1.5;
        margin: 0 auto;
      }

      .nm-package-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .nm-package-card {
        appearance: none;
        background: #ffffff;
        border: 1px solid #cfe4f1;
        border-radius: 8px;
        color: #102033;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        font: inherit;
        min-height: 100%;
        padding: 17px;
        position: relative;
        text-align: start;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        width: 100%;
      }

      .nm-package-card:hover {
        border-color: #1197d5;
        box-shadow: 0 8px 22px rgba(16, 32, 51, 0.08);
        transform: translateY(-1px);
      }

      .nm-package-card:focus-visible {
        outline: 3px solid rgba(17, 151, 213, 0.26);
        outline-offset: 2px;
      }

      .nm-package-card.is-selected {
        background: #f3faff;
        border-color: #1197d5;
        box-shadow: 0 8px 24px rgba(17, 151, 213, 0.13);
      }

      .nm-package-card.is-plus {
        border-top: 4px solid #70bf00;
        padding-top: 14px;
      }

      .nm-package-badge {
        background: #eaf7dc;
        border-radius: 999px;
        color: #367400;
        font-size: 11px;
        font-weight: 800;
        inset-inline-end: 13px;
        padding: 4px 8px;
        position: absolute;
        top: 12px;
      }

      .nm-package-card-head {
        align-items: flex-start;
        display: flex;
        gap: 10px;
        justify-content: space-between;
        padding-inline-end: 74px;
      }

      .nm-package-card:not(.is-plus) .nm-package-card-head {
        padding-inline-end: 0;
      }

      .nm-package-name {
        font-size: 17px;
        font-weight: 800;
        line-height: 1.25;
      }

      .nm-package-price {
        color: #087fb7;
        flex: 0 0 auto;
        font-size: 21px;
        font-weight: 900;
        line-height: 1.15;
        white-space: nowrap;
      }

      .nm-package-description {
        color: #49627a;
        font-size: 13px;
        line-height: 1.48;
        margin: 10px 0 12px;
      }

      .nm-package-features {
        display: grid;
        gap: 7px;
        margin: 0 0 14px;
        padding: 0;
      }

      .nm-package-feature {
        color: #243b52;
        display: block;
        font-size: 12px;
        line-height: 1.42;
        padding-inline-start: 19px;
        position: relative;
      }

      .nm-package-feature::before {
        color: #5fa900;
        content: "✓";
        font-weight: 900;
        inset-inline-start: 0;
        position: absolute;
      }

      .nm-package-action {
        align-items: center;
        background: #e9f3f9;
        border-radius: 6px;
        color: #102033;
        display: flex;
        font-size: 12px;
        font-weight: 800;
        justify-content: center;
        margin-top: auto;
        min-height: 36px;
        padding: 8px 10px;
        text-align: center;
      }

      .nm-package-card.is-selected .nm-package-action {
        background: #1197d5;
        color: #ffffff;
      }

      .nm-package-disclosure {
        color: #64748b;
        display: block;
        font-size: 11px;
        line-height: 1.48;
        margin: 10px auto 0;
        max-width: 760px;
        text-align: center;
      }

      html[dir="rtl"] .nm-package-selector,
      html[dir="rtl"] .nm-package-card {
        text-align: right;
      }

      @media (max-width: 680px) {
        .nm-landing-package-section {
          padding: 24px 16px 28px;
        }

        .nm-package-selector {
          margin: 18px auto;
        }

        .nm-package-grid {
          grid-template-columns: 1fr;
        }

        .nm-package-selector-head h3 {
          font-size: 20px;
        }

        .nm-package-card {
          padding: 15px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getPackageSelectorInnerHtml(lang = state.lang) {
    const copy = getPackageSelectorCopy(lang);
    const selectedCode = normalizeClientPackageCode(state.packageCode);

    const cards = ["standard_v1", "plus_v1"].map((code) => {
      const productPackage = CLIENT_PACKAGE_CATALOG[code];
      const packageCopy = code === "plus_v1" ? copy.plus : copy.standard;
      const selected = selectedCode === code;
      const recommended = code === "plus_v1";

      return `
        <button
          type="button"
          class="nm-package-card${selected ? " is-selected" : ""}${recommended ? " is-plus" : ""}"
          data-nm-package-code="${code}"
          role="radio"
          aria-checked="${selected ? "true" : "false"}"
        >
          ${recommended ? `<span class="nm-package-badge">${escapeHtml(copy.recommended)}</span>` : ""}
          <span class="nm-package-card-head">
            <span class="nm-package-name">${escapeHtml(packageCopy.name)}</span>
            <span class="nm-package-price">${escapeHtml(formatPackagePrice(productPackage, lang))}</span>
          </span>
          <span class="nm-package-description">${escapeHtml(packageCopy.description)}</span>
          <span class="nm-package-features" role="list">
            ${packageCopy.features.map((feature) => `<span class="nm-package-feature" role="listitem">${escapeHtml(feature)}</span>`).join("")}
          </span>
          <span class="nm-package-action">${escapeHtml(selected ? copy.selected : copy.select)}</span>
        </button>
      `;
    }).join("");

    return `
      <div class="nm-package-selector-head">
        <span class="nm-package-selector-eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h3>${escapeHtml(copy.title)}</h3>
        <p>${escapeHtml(copy.lead)}</p>
      </div>
      <div class="nm-package-grid" role="radiogroup" aria-label="${escapeHtml(copy.title)}">
        ${cards}
      </div>
      <span class="nm-package-disclosure">${escapeHtml(copy.disclosure)}</span>
    `;
  }

  function buildPackageSelectorHtml(scope, lang = state.lang) {
    return `
      <section class="nm-package-selector" data-nm-package-selector="${escapeHtml(scope || "default")}">
        ${getPackageSelectorInnerHtml(lang)}
      </section>
    `;
  }

  function updatePackageCheckoutButtons() {
    const productPackage = getSelectedClientPackage();
    const copy = getPackageSelectorCopy(state.lang);
    const label = `${copy.checkout} · ${formatPackagePrice(productPackage, state.lang)}`;

    const paymentButton = document.getElementById("paymentBtn");
    if (paymentButton && state.step === "summary") paymentButton.textContent = label;

    document.querySelectorAll("[data-nm-summary-pay]").forEach((button) => {
      button.textContent = label;
    });
  }

  function bindPackageSelector(element) {
    if (!element) return;
    if (element.dataset.nmPackageSelectorBound === "1") return;

    element.dataset.nmPackageSelectorBound = "1";
    element.addEventListener("click", (event) => {
      const button = event.target.closest("[data-nm-package-code]");
      if (!button || !element.contains(button)) return;

      event.preventDefault();
      event.stopPropagation();

      const scope = element.getAttribute("data-nm-package-selector") || "unknown";
      setSelectedPackageCode(button.getAttribute("data-nm-package-code"), scope);
    });
  }

  function renderPackageSelector(element, lang = state.lang) {
    if (!element) return;

    const activeLang = lang || state.lang || "en";
    const selectedCode = normalizeClientPackageCode(state.packageCode);
    const renderKey = `${activeLang}:${selectedCode}`;
    const hasCompleteCards = element.querySelectorAll("[data-nm-package-code]").length === 2;

    if (element.dataset.nmPackageRenderKey !== renderKey || !hasCompleteCards) {
      element.innerHTML = getPackageSelectorInnerHtml(activeLang);
      element.dataset.nmPackageRenderKey = renderKey;
    }

    bindPackageSelector(element);
  }

  function refreshPackageSelectors() {
    document.querySelectorAll("[data-nm-package-selector]").forEach((element) => {
      renderPackageSelector(element, state.lang);
    });
    updatePackageCheckoutButtons();
  }

  function setSelectedPackageCode(value, source = "unknown") {
    const previousCode = normalizeClientPackageCode(state.packageCode);
    const nextCode = normalizeClientPackageCode(value);
    state.packageCode = nextCode;

    try {
      localStorage.setItem(PACKAGE_STORAGE_KEY, nextCode);
    } catch (_error) {
      // The selection still remains available in memory when storage is blocked.
    }

    refreshPackageSelectors();
    saveDraft("package_selected");

    if (previousCode !== nextCode) {
      const productPackage = getSelectedClientPackage();
      trackSchemaEvent("nm_package_selected", {
        funnel_step: state.step || "landing",
        package_code: nextCode,
        package_source: source,
        value: productPackage.analyticsValue,
        currency: productPackage.currency
      });
    }
  }

  function ensureLandingPackageSelector(lang = state.lang) {
    const landing =
      document.getElementById("nmSocialLanding") ||
      document.querySelector(".nm-social-landing") ||
      document.querySelector(".nm-landing") ||
      document.querySelector("[data-nm-landing]");

    const hero =
      landing?.querySelector(".nm-hero") ||
      landing?.querySelector("[data-nm-section='hero']") ||
      document.querySelector("[data-nm-section='hero']");

    if (!landing || !hero) return;
    installPackageSelectorStyles();

    let selector = landing.querySelector('[data-nm-package-selector="landing"]');
    let section = landing.querySelector('[data-nm-package-section="landing"]');

    if (!section) {
      section = document.createElement("section");
      section.className = "nm-landing-package-section";
      section.setAttribute("data-nm-package-section", "landing");
      section.setAttribute("data-nm-hidden-for-questionnaire", "1");
    }

    const reportPreviewSection = landing.querySelector(".nm-report-preview-section");
    const packageAnchor = reportPreviewSection || hero;

    if (packageAnchor === landing) {
      if (section.parentElement !== landing) landing.appendChild(section);
    } else if (
      packageAnchor.parentElement &&
      (section.parentElement !== packageAnchor.parentElement || section.previousElementSibling !== packageAnchor)
    ) {
      packageAnchor.insertAdjacentElement("afterend", section);
    }

    if (!selector) {
      selector = document.createElement("section");
      selector.className = "nm-package-selector";
      selector.setAttribute("data-nm-package-selector", "landing");
    }

    if (selector.parentElement !== section) section.appendChild(selector);
    section.setAttribute("aria-label", getPackageSelectorCopy(lang).title);

    renderPackageSelector(selector, lang);
  }

  window.NM_GET_SELECTED_PACKAGE = function () {
    return { ...getSelectedClientPackage() };
  };

  window.NM_SET_SELECTED_PACKAGE = function (packageCode) {
    setSelectedPackageCode(packageCode, "public_api");
    return { ...getSelectedClientPackage() };
  };

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

    if (topbar.parentElement !== document.body) {
      document.body.insertBefore(topbar, document.body.firstChild);
    }

    topbar.classList.add("nm-topbar-fixed-brand");

    setImportantStyle(topbar, "align-items", "center");
    setImportantStyle(topbar, "background", "rgba(255, 255, 255, 0.94)");
    setImportantStyle(topbar, "border-bottom", "1px solid rgba(17, 24, 39, 0.08)");
    setImportantStyle(topbar, "box-shadow", "0 10px 26px rgba(17, 24, 39, 0.04)");
    setImportantStyle(topbar, "display", "flex");
    setImportantStyle(topbar, "min-height", "66px");
    setImportantStyle(topbar, "left", "0");
    setImportantStyle(topbar, "position", "fixed");
    setImportantStyle(topbar, "right", "0");
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

  function isQuestionnaireShellNode(element) {
    if (!element || element.nodeType !== 1) return false;

    const app = document.getElementById("nmApp");
    const start = document.getElementById("questionnaireStart");
    const modal = document.getElementById("languageModal");
    const topbar = document.querySelector(".nm-topbar");

    return (
      element === app ||
      element === start ||
      element === modal ||
      element === topbar ||
      (app && element.contains(app)) ||
      (start && element.contains(start)) ||
      (modal && element.contains(modal)) ||
      (topbar && element.contains(topbar)) ||
      (topbar && topbar.contains(element)) ||
      element.matches("script, style, link, meta, noscript")
    );
  }

  function hideElementForQuestionnaire(element) {
    if (!element || element.nodeType !== 1 || isQuestionnaireShellNode(element)) return;

    element.setAttribute("aria-hidden", "true");
    element.dataset.nmHiddenForQuestionnaire = "1";
    setImportantStyle(element, "display", "none");
    setImportantStyle(element, "visibility", "hidden");
    setImportantStyle(element, "opacity", "0");
    setImportantStyle(element, "pointer-events", "none");
  }

  function hidePreQuestionnaireSiblings() {
    const anchor =
      document.getElementById("questionnaireStart") ||
      document.getElementById("nmApp") ||
      document.getElementById("triageSection");

    if (!anchor) return;

    let current = anchor;

    while (current && current.parentElement && current.parentElement !== document.body) {
      let sibling = current.previousElementSibling;

      while (sibling) {
        const previous = sibling.previousElementSibling;
        hideElementForQuestionnaire(sibling);
        sibling = previous;
      }

      current = current.parentElement;
    }

    if (current && current.parentElement === document.body) {
      let sibling = current.previousElementSibling;

      while (sibling) {
        const previous = sibling.previousElementSibling;
        hideElementForQuestionnaire(sibling);
        sibling = previous;
      }
    }
  }

  function getQuestionnaireShellRoots() {
    const app = document.getElementById("nmApp");
    const start = document.getElementById("questionnaireStart");
    const roots = [];

    if (start && app && start.contains(app)) {
      roots.push(start);
    } else if (app && start && app.contains(start)) {
      roots.push(app);
    } else {
      if (start) roots.push(start);
      if (app) roots.push(app);
    }

    return roots.filter((root, index, all) => root && all.indexOf(root) === index);
  }

  function ensureQuestionnaireShellMounted() {
    if (!document.body) return [];

    ensureStickyBrandHeader();

    const topbar = document.querySelector(".nm-topbar");
    const roots = getQuestionnaireShellRoots();
    let insertAfter = topbar && topbar.parentElement === document.body ? topbar : null;

    roots.forEach((root) => {
      if (root.parentElement !== document.body) {
        if (insertAfter && insertAfter.nextSibling) {
          document.body.insertBefore(root, insertAfter.nextSibling);
        } else if (insertAfter) {
          document.body.appendChild(root);
        } else {
          document.body.insertBefore(root, document.body.firstChild);
        }
      }

      insertAfter = root;
    });

    const modal = document.getElementById("languageModal");
    if (modal && modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    return roots;
  }

  function isBodyShellChild(element, shellRoots) {
    if (!element || element.nodeType !== 1) return false;

    const topbar = document.querySelector(".nm-topbar");
    const modal = document.getElementById("languageModal");
    const bootGate = document.getElementById("nmEngineBootGate");

    return (
      element === topbar ||
      element === modal ||
      element === bootGate ||
      shellRoots.includes(element) ||
      element.matches("script, style, link, meta, noscript")
    );
  }

  function hideNonQuestionnaireBodyChildren() {
    if (!document.body) return;

    const shellRoots = ensureQuestionnaireShellMounted();

    Array.from(document.body.children || []).forEach((child) => {
      if (isBodyShellChild(child, shellRoots)) return;
      hideElementForQuestionnaire(child);
    });
  }

  function getReportPreviewLabels(lang = state.lang) {
    const labels = {
      hu: {
        title: "NeuroMap Kids riport",
        subtitle: "személyre szabott előnézet",
        focus: "Fókusz",
        pattern: "Minta",
        suggestions: "Javaslatok",
        next: "Következő lépések",
        parent: "szülőbarát magyarázat",
        action: "gyakorlati ötletek",
        pdf: "PDF emailben"
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
        pdf: "PDF by email"
      },
      de: {
        title: "NeuroMap Kids Bericht",
        subtitle: "personalisierte Vorschau",
        focus: "Fokus",
        pattern: "Muster",
        suggestions: "Hinweise",
        next: "Nächste Schritte",
        parent: "elternfreundliche Erklärung",
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
        pattern: "Patrón",
        suggestions: "Sugerencias",
        next: "Próximos pasos",
        parent: "explicación para familias",
        action: "ideas prácticas",
        pdf: "PDF por email"
      },
      zh: {
        title: "NeuroMap Kids 报告",
        subtitle: "个性化预览",
        focus: "重点",
        pattern: "模式",
        suggestions: "建议",
        next: "下一步",
        parent: "家长友好说明",
        action: "实用建议",
        pdf: "PDF 邮件发送"
      },
      ja: {
        title: "NeuroMap Kids レポート",
        subtitle: "個別プレビュー",
        focus: "注目領域",
        pattern: "傾向",
        suggestions: "提案",
        next: "次のステップ",
        parent: "保護者向けの説明",
        action: "実践的なヒント",
        pdf: "PDFをメールで送信"
      },
      ar: {
        title: "تقرير NeuroMap Kids",
        subtitle: "معاينة مخصصة",
        focus: "التركيز",
        pattern: "النمط",
        suggestions: "اقتراحات",
        next: "الخطوات التالية",
        parent: "شرح مناسب للوالدين",
        action: "أفكار عملية",
        pdf: "PDF عبر البريد"
      },
      pl: {
        title: "Raport NeuroMap Kids",
        subtitle: "spersonalizowany podgląd",
        focus: "Obszar",
        pattern: "Wzorzec",
        suggestions: "Wskazówki",
        next: "Kolejne kroki",
        parent: "wyjaśnienie dla rodziców",
        action: "praktyczne pomysły",
        pdf: "PDF emailem"
      },
      pt: {
        title: "Relatório NeuroMap Kids",
        subtitle: "pré-visualização personalizada",
        focus: "Foco",
        pattern: "Padrão",
        suggestions: "Sugestões",
        next: "Próximos passos",
        parent: "explicação para pais",
        action: "ideias práticas",
        pdf: "PDF por email"
      },
      fr: {
        title: "Rapport NeuroMap Kids",
        subtitle: "aperçu personnalisé",
        focus: "Focus",
        pattern: "Schéma",
        suggestions: "Pistes",
        next: "Prochaines étapes",
        parent: "explication pour parents",
        action: "idées pratiques",
        pdf: "PDF par email"
      }
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
        "parent-friendly, calm language",
        "refined with age-aware context",
        "not a diagnosis, but a structured screening"
      ],
      de: [
        "elternfreundliche, beruhigende Sprache",
        "mit altersbezogenem Kontext verfeinert",
        "keine Diagnose, sondern ein strukturiertes Screening"
      ],
      it: [
        "linguaggio rassicurante per genitori",
        "adattato al contesto dell'età",
        "non una diagnosi, ma uno screening strutturato"
      ],
      es: [
        "lenguaje claro y tranquilizador para familias",
        "ajustado al contexto de la edad",
        "no es un diagnóstico, sino un cribado estructurado"
      ],
      zh: [
        "面向家长的安心表达",
        "结合年龄背景理解",
        "不是诊断，而是结构化筛查"
      ],
      ja: [
        "保護者にわかりやすく安心できる表現",
        "年齢に応じた文脈で整理",
        "診断ではなく構造化されたスクリーニング"
      ],
      ar: [
        "لغة مطمئنة ومناسبة للوالدين",
        "مراعاة السياق العمري للطفل",
        "ليس تشخيصًا بل فرز أولي منظم"
      ],
      pl: [
        "spokojny język przyjazny rodzicom",
        "uwzględnia kontekst wieku",
        "nie diagnoza, lecz uporządkowany screening"
      ],
      pt: [
        "linguagem calma e clara para pais",
        "ajustado ao contexto da idade",
        "não é diagnóstico, é triagem estruturada"
      ],
      fr: [
        "langage clair et rassurant pour les parents",
        "adapté au contexte de l'âge",
        "pas un diagnostic, mais un screening structuré"
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
      existing.setAttribute("role", "list");
      existing.innerHTML = copy
        .map((item) => `<div class="nm-landing-proof-item" role="listitem">${escapeHtml(item)}</div>`)
        .join("");
      return;
    }

    const strip = document.createElement("div");
    strip.className = "nm-landing-proof-strip";
    strip.setAttribute("role", "list");
    strip.innerHTML = copy
      .map((item) => `<div class="nm-landing-proof-item" role="listitem">${escapeHtml(item)}</div>`)
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

  function simplifyLandingHero(hero) {
    if (!hero) return;

    hero.querySelectorAll(".nm-landing-reason-panel").forEach((panel) => panel.remove());
    hero.querySelectorAll(".nm-landing-proof-strip").forEach((strip) => strip.remove());
    hero
      .querySelectorAll("[data-nm-i18n='microcopy'], .nm-hero-microcopy, .nm-hero-trust, .nm-trust-row")
      .forEach((detail) => {
        detail.hidden = true;
        detail.setAttribute("aria-hidden", "true");
        detail.setAttribute("data-nm-hero-detail", "hidden");
        setImportantStyle(detail, "display", "none");
      });
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
    setImportantStyle(landing, "padding-top", "66px");
    setImportantStyle(landing, "padding-bottom", "18px");

    setImportantStyle(hero, "min-height", "auto");
    setImportantStyle(hero, "padding-top", "34px");
    setImportantStyle(hero, "padding-bottom", "38px");

    hero.querySelectorAll("h1").forEach((heading) => {
      setImportantStyle(heading, "font-size", "clamp(30px, 2.4vw, 40px)");
      setImportantStyle(heading, "line-height", "1.08");
      setImportantStyle(heading, "margin-top", "0");
      setImportantStyle(heading, "margin-bottom", "10px");
      setImportantStyle(heading, "max-width", "660px");
    });

    hero.querySelectorAll("p").forEach((paragraph) => {
      setImportantStyle(paragraph, "font-size", "clamp(16px, 1.2vw, 18px)");
      setImportantStyle(paragraph, "line-height", "1.5");
      setImportantStyle(paragraph, "margin-bottom", "20px");
      setImportantStyle(paragraph, "max-width", "600px");
    });

    hero.querySelectorAll("[data-nm-cta], a[href='#questionnaireStart'], a[href*='questionnaireStart']").forEach((cta) => {
      setImportantStyle(cta, "max-width", "480px");
      setImportantStyle(cta, "min-height", "48px");
      setImportantStyle(cta, "padding-top", "12px");
      setImportantStyle(cta, "padding-bottom", "12px");
    });

    const activeLang = getLang() || state.lang || "hu";

    ensureStickyBrandHeader();
    ensureReportPreviewMockup(activeLang);
    simplifyLandingHero(hero);
    ensureLandingPackageSelector(activeLang);
    ensureLandingMiniDemo(activeLang);
  }

  function applyLandingFallbackLanguage(lang = state.lang) {
    const copy = getLandingFallbackText(lang);
    let applied = 0;
    const isRtl = lang === "ar";

    if (!copy) {
      applyLandingCompactLayout();
      return applied;
    }

    document.documentElement.lang = lang || "en";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    if (document.body) {
      document.body.dir = isRtl ? "rtl" : "ltr";
    }

    document.querySelectorAll("[data-nm-i18n]").forEach((element) => {
      const key = element.getAttribute("data-nm-i18n");
      const value = copy[key];
      if (typeof value === "string" && element.textContent !== value) {
        element.textContent = value;
        applied += 1;
      }
    });

    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle && copy.modalTitle && modalTitle.textContent !== copy.modalTitle) {
      modalTitle.textContent = copy.modalTitle;
    }

    const modalIntro = document.getElementById("modalIntro");
    if (modalIntro && copy.modalIntro && modalIntro.textContent !== copy.modalIntro) {
      modalIntro.textContent = copy.modalIntro;
    }

    const landing = document.getElementById("nmSocialLanding") ||
      document.querySelector(".nm-social-landing") ||
      document.querySelector("[data-nm-landing]");

    if (landing) {
      landing.lang = lang || "en";
      landing.dir = isRtl ? "rtl" : "ltr";
      landing.classList.toggle("nm-landing-rtl", isRtl);

      if (!document.documentElement.classList.contains("nm-questionnaire-open")) {
        landing.style.visibility = "visible";
        landing.style.opacity = "1";
        if (landing.style.display === "none") {
          landing.style.display = "block";
        }
      }
    }

    applyLandingCompactLayout();

    return applied;
  }

  function rescueLandingText(lang = state.lang) {
    if (document.documentElement.classList.contains("nm-questionnaire-open")) return 0;
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
      // MutationObserver callbacks run before the next task. Keeping the guard
      // active until then prevents the landing rescue from reacting to its own DOM work.
      window.setTimeout(() => {
        landingRescueInProgress = false;
      }, 0);
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
        if (landingRescueInProgress) return;
        if (document.documentElement.classList.contains("nm-questionnaire-open")) return;
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

  function hideLandingForQuestionnaire() {
    ensureStickyBrandHeader();
    const shellRoots = ensureQuestionnaireShellMounted();

    const landingContainers = Array.from(document.querySelectorAll([
      "#nmSocialLanding",
      ".nm-social-landing",
      ".nm-landing",
      "[data-nm-landing]",
      "[data-nm-section='landing']"
    ].join(",")));

    const landingNodes = Array.from(document.querySelectorAll([
      "#nmSocialLanding .nm-hero",
      ".nm-social-landing .nm-hero",
      ".nm-landing .nm-hero",
      "#nmSocialLanding .nm-section:not(.nm-topbar)",
      ".nm-social-landing .nm-section:not(.nm-topbar)",
      ".nm-landing .nm-section:not(.nm-topbar)",
      "[data-nm-section='hero']"
    ].join(",")));

    landingContainers.forEach((container) => {
      Array.from(container.children || []).forEach((child) => {
        if (
          child.matches(".nm-topbar") ||
          child.id === "questionnaireStart" ||
          child.id === "nmApp" ||
          child.id === "languageModal" ||
          child.contains(document.getElementById("nmApp")) ||
          shellRoots.includes(child)
        ) {
          return;
        }

        landingNodes.push(child);
      });
    });

    landingNodes.forEach((landing) => hideElementForQuestionnaire(landing));
    hidePreQuestionnaireSiblings();
    hideNonQuestionnaireBodyChildren();
  }

  function lockQuestionnaireOpenLayout() {
    ensureStickyBrandHeader();
    hideLandingForQuestionnaire();

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      ensureStickyBrandHeader();
      hideLandingForQuestionnaire();

      if (attempts >= 24) {
        window.clearInterval(timer);
      }
    }, 125);
  }

  async function showQuestionnaireFromLanding() {
    if (!hasConfirmedLanguage()) {
      showModal(true);
      return false;
    }

    try {
      await ensureLegalConsentForCurrentLanguage();
    } catch (error) {
      console.error("Legal consent is required before starting the questionnaire:", error);
      setStatus(state.lang === "hu"
        ? "A kérdőív indításához előbb jóvá kell hagyni a jogi és adatvédelmi tájékoztatót."
        : "Please review and approve the legal and privacy information before starting.");
      showModal(true);
      return false;
    }

    const app = document.getElementById("nmApp");
    const target =
      document.getElementById("questionnaireStart") ||
      app ||
      document.getElementById("triageSection");

    document.documentElement.classList.add("nm-questionnaire-open");
    lockQuestionnaireOpenLayout();

    if (app) {
      app.style.display = "block";
    }

    hideNonQuestionnaireBodyChildren();

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

    return true;
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
        void showQuestionnaireFromLanding();
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
        body: "A kitöltésedet ezen az eszközön automatikusan elmentettük.",
        continueLabel: "Folytatás",
        restartLabel: "Újrakezdés"
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
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_error) {
      // localStorage can be blocked in strict browser privacy modes.
    }

    return null;
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
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      updateResumeBanner(false);
    } catch (error) {
      console.warn("NeuroMap draft save failed:", error);
    }
  }

  function restoreDraft(draft) {
    if (!draft || draft.version !== 1) return false;

    state.lang = draft.lang || state.lang;
    state.packageCode = normalizeClientPackageCode(readStoredPackageCode() || draft.packageCode);
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
        if (typeof showQuestionnaireFromLanding === "function") void showQuestionnaireFromLanding();
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
    if (body) {
      const progress = getDraftProgressText();
      body.innerHTML = `${escapeHtml(copy.body)}${progress ? `<span class="nm-draft-progress">${escapeHtml(progress)}</span>` : ""}`;
    }
    if (continueButton) continueButton.textContent = copy.continueLabel;
    if (restartButton) restartButton.textContent = copy.restartLabel;

    const visible = shouldShow === null ? state.draftRestored : shouldShow;
    banner.classList.toggle("is-visible", Boolean(visible && readDraft()));
  }

  function getDraftProgressText() {
    const draft = readDraft();
    if (!draft) return "";

    const answered = (values) =>
      (Array.isArray(values) ? values : []).filter(
        (value) => value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value))
      ).length;

    const triageDone = answered(draft.triageAnswers);
    const triageTotal = Array.isArray(draft.triageQuestions) ? draft.triageQuestions.length : 0;
    const specificDone = answered(draft.specificAnswers) + answered(draft.extraAnswers);
    const specificTotal =
      (Array.isArray(draft.specificQuestions) ? draft.specificQuestions.length : 0) +
      (draft.needsExtra && Array.isArray(draft.extraQuestions) ? draft.extraQuestions.length : 0);

    if (state.lang === "hu" || draft.lang === "hu") {
      return `Mentett állapot: ${triageDone}/${triageTotal || 25} első szűrés, ${specificDone}/${specificTotal || 0} pontosítás.`;
    }

    return `Saved progress: ${triageDone}/${triageTotal || 25} screening answers, ${specificDone}/${specificTotal || 0} detail answers.`;
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
      failEngineBootGate("A kérdésbankok betöltése nem sikerült. Frissítsd az oldalt, vagy próbáld újra később.");
      return false;
    }

    if (!window.NM_ADAPTIVE_ENGINE) {
      console.warn("NM_ADAPTIVE_ENGINE is not available. Engine will use local fallback picker.");
    }

    console.log("NeuroMap runtime bank validation passed.");
    setEngineBootStatus("banks", "Kérdésbankok ellenőrizve.", "loading");
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
          <p id="modalIntro">Select your preferred language</p>
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
      button.addEventListener("click", () => hideModal(false));
    });

    if (modal.dataset.nmBackdropBound !== "1") {
      modal.dataset.nmBackdropBound = "1";
      modal.addEventListener("click", (event) => {
        if (event.target === modal) hideModal(false);
      });
    }

    return modal;
  }

  function showModal(required = false) {
    const el = ensureLanguageModal();
    if (el) {
      el.dataset.nmRequired = required ? "1" : "0";
      el.style.display = "flex";
    }
  }

  function hideModal(force = false) {
    const el = document.getElementById("languageModal");
    if (!el) return;
    if (el.dataset.nmRequired === "1" && !force) return;
    el.style.display = "none";
    el.dataset.nmRequired = "0";
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
        title: "Nem csak pontsz\u00e1mokat kapsz, hanem \u00e9rtelmezhet\u0151 mint\u00e1zatot",
        lead:
          "A NeuroMap Kids a v\u00e1laszaidat t\u00f6bb ter\u00fclet ment\u00e9n veti \u00f6ssze. A fizet\u00e9s ut\u00e1n k\u00e9sz\u00fcl\u0151 riport azt mutatja meg, hogy a mostani jelz\u00e9sek hogyan kapcsol\u00f3dhatnak a gyermek mindennapi viselked\u00e9s\u00e9hez, tanul\u00e1s\u00e1hoz \u00e9s \u00e9rzelmi terhel\u00e9s\u00e9hez.",
        items: [
          { title: "Mint\u00e1zatalap\u00fa \u00e9rtelmez\u00e9s", text: "A riport a f\u0151 \u00e9s m\u00e1sodlagos jelz\u00e9seket egy\u00fctt kezeli, nem egyetlen k\u00e9rd\u00e9s vagy pontsz\u00e1m alapj\u00e1n k\u00f6vetkeztet." },
          { title: "\u00c9letkorhoz igazod\u00f3 n\u00e9z\u0151pont", text: "Seg\u00edt elk\u00fcl\u00f6n\u00edteni, mi lehet \u00e9letkori saj\u00e1toss\u00e1g, \u00e9s mi az, amit \u00e9rdemes tudatosabban figyelni." },
          { title: "Sz\u00fcl\u0151bar\u00e1t k\u00f6vetkez\u0151 l\u00e9p\u00e9sek", text: "Otthon, \u00f3vod\u00e1ban vagy iskol\u00e1ban is haszn\u00e1lhat\u00f3, gyakorlatias ir\u00e1nyokat kapsz." },
          { title: "PDF riport emailben", text: "A szem\u00e9lyre szabott riport a fizet\u00e9s ut\u00e1n k\u00e9sz\u00fcl el, \u00e9s emailben \u00e9rkezik meg." }
        ],
        ctaTitle: "A r\u00e9szletes riport c\u00e9lja: tiszt\u00e1bb k\u00e9pet adni, merre \u00e9rdemes tov\u00e1bb figyelni.",
        ctaText: "Ez struktur\u00e1lt el\u0151sz\u0171r\u00e9s, nem diagn\u00f3zis. A hangs\u00faly az \u00e9rthet\u0151 magyar\u00e1zaton \u00e9s a k\u00f6vetkez\u0151 l\u00e9p\u00e9seken van."
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
        "Ez nem diagn\u00f3zis, hanem struktur\u00e1lt el\u0151sz\u0171r\u00e9si \u00f6sszegz\u00e9s. A r\u00e9szletes, sz\u00fcl\u0151bar\u00e1t riport \u00e9s PDF a fizet\u00e9s ut\u00e1n k\u00e9sz\u00fcl el.",
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

  function getAgeContextLabel() {
    const age = getChildAgeValue();
    const copy = getCustomerCopy({
      hu: {
        missing: "korosztály megadása után pontosabb",
        toddler: "kisgyermekkori kontextus",
        preschool: "óvoda előtti / óvodás korosztály",
        primary: "kisiskolás korosztály",
        adolescent: "serdülőkori kontextus",
        youngAdult: "fiatal felnőtt korosztály"
      },
      en: {
        missing: "refined after age is provided",
        toddler: "early childhood context",
        preschool: "preschool age context",
        primary: "primary school age context",
        adolescent: "adolescent context",
        youngAdult: "young adult context"
      },
      de: {
        missing: "genauer nach Angabe des Alters",
        toddler: "frühkindlicher Kontext",
        preschool: "Vorschulkontext",
        primary: "Grundschulalter",
        adolescent: "Jugendalter",
        youngAdult: "junger Erwachsenen-Kontext"
      },
      it: {
        missing: "più preciso dopo aver indicato l'età",
        toddler: "contesto della prima infanzia",
        preschool: "contesto prescolare",
        primary: "età della scuola primaria",
        adolescent: "contesto adolescenziale",
        youngAdult: "contesto di giovane adulto"
      },
      es: {
        missing: "más preciso al indicar la edad",
        toddler: "contexto de primera infancia",
        preschool: "contexto preescolar",
        primary: "edad de primaria",
        adolescent: "contexto adolescente",
        youngAdult: "contexto de joven adulto"
      },
      zh: {
        missing: "填写年龄后会更精确",
        toddler: "幼儿早期背景",
        preschool: "学前年龄背景",
        primary: "小学年龄背景",
        adolescent: "青春期背景",
        youngAdult: "青年早期背景"
      },
      ja: {
        missing: "年齢を入力するとより正確になります",
        toddler: "乳幼児期の背景",
        preschool: "就学前の年齢背景",
        primary: "小学生期の背景",
        adolescent: "思春期の背景",
        youngAdult: "若年成人期の背景"
      },
      ar: {
        missing: "يصبح أدق بعد إدخال العمر",
        toddler: "سياق الطفولة المبكرة",
        preschool: "سياق ما قبل المدرسة",
        primary: "سياق المرحلة الابتدائية",
        adolescent: "سياق المراهقة",
        youngAdult: "سياق بداية الرشد"
      },
      pl: {
        missing: "dokładniejsze po podaniu wieku",
        toddler: "kontekst wczesnego dzieciństwa",
        preschool: "wiek przedszkolny",
        primary: "wiek wczesnoszkolny",
        adolescent: "kontekst dorastania",
        youngAdult: "kontekst młodej dorosłości"
      },
      pt: {
        missing: "mais preciso após informar a idade",
        toddler: "contexto da primeira infância",
        preschool: "contexto pré-escolar",
        primary: "idade escolar inicial",
        adolescent: "contexto adolescente",
        youngAdult: "contexto de jovem adulto"
      },
      fr: {
        missing: "plus précis après l'âge indiqué",
        toddler: "contexte de petite enfance",
        preschool: "contexte préscolaire",
        primary: "âge de l'école primaire",
        adolescent: "contexte adolescent",
        youngAdult: "contexte jeune adulte"
      }
    });

    if (age === null || Number.isNaN(age)) return copy.missing;
    if (age < 3) return copy.toddler;
    if (age < 6) return copy.preschool;
    if (age < 12) return copy.primary;
    if (age < 18) return copy.adolescent;
    return copy.youngAdult;
  }

  function formatDecisionScore(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    return numeric.toFixed(2);
  }

  function getDecisionRankingTop() {
    if (!Array.isArray(state.triageRanking)) return [];
    return state.triageRanking.slice(0, 2);
  }

  function buildReportPreviewV2Html() {
    const isHu = state.lang === "hu";
    const focus = disorderLabel(state.detectedRisk);
    const secondary = state.secondaryRisk ? disorderLabel(state.secondaryRisk) : (isHu ? "nincs er\u0151s m\u00e1sodlagos jelz\u00e9s" : "no strong secondary signal");
    const signal =
      state.resultSummary?.signal?.[state.lang] ||
      state.resultSummary?.signal?.en ||
      state.resultSummary?.signal?.key ||
      "-";

    const copy = isHu
      ? {
          title: "Mit mutat majd pontosabban a teljes riport?",
          lead:
            "A fizet\u00e9s ut\u00e1ni riport nem \u00fajabb c\u00edmk\u00e9t ad, hanem \u00e9rthet\u0151en \u00f6sszerendezi a v\u00e1laszokat, a koroszt\u00e1lyt \u00e9s az \u00e1tfed\u00e9seket.",
          labels: ["F\u0151 minta", "M\u00e1sodlagos jelz\u00e9s", "Koroszt\u00e1ly", "Jelz\u00e9sszint"]
        }
      : {
          title: "What will the full report clarify?",
          lead:
            "The paid report does not add another label. It organizes the answers, age context, and overlaps into a clear parent-friendly picture.",
          labels: ["Primary pattern", "Secondary signal", "Age context", "Signal level"]
        };

    const values = [focus, secondary, getAgeContextLabel(), signal];

    return `
      <div class="nm-report-preview-v2-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <p>${escapeHtml(copy.lead)}</p>
        <div class="nm-report-preview-v2-grid">
          ${copy.labels
            .map(
              (label, index) => `
                <div class="nm-report-preview-v2-item">
                  <span class="nm-report-preview-v2-label">${escapeHtml(label)}</span>
                  <span class="nm-report-preview-v2-value">${escapeHtml(values[index])}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function buildDecisionExplanationHtml() {
    const isHu = state.lang === "hu";
    const ranking = getDecisionRankingTop();
    const primary = ranking[0] || {};
    const secondary = ranking[1] || {};
    const gap = Number(primary.weightedSignal || 0) - Number(secondary.weightedSignal || 0);
    const confidence =
      gap >= 0.35
        ? isHu ? "magasabb biztonság" : "stronger confidence"
        : gap >= 0.16
          ? isHu ? "közepes biztonság" : "moderate confidence"
          : isHu ? "szoros eredmény" : "close result";

    const copy = isHu
      ? {
          title: "Hogyan döntött az engine?",
          lead:
            "A rendszer nem egyetlen válaszból következtet. A fő és másodlagos területeket a jelzés erőssége, következetessége és átfedése alapján rendezi.",
          labels: ["Fő jelzés", "Másodlagos jelzés", "Biztonság", "Extra pontosítás"]
        }
      : {
          title: "How did the engine decide?",
          lead:
            "The engine does not infer from one answer. It ranks primary and secondary areas using signal strength, consistency, and overlap.",
          labels: ["Primary signal", "Secondary signal", "Confidence", "Extra clarification"]
        };

    const values = [
      `${disorderLabel(primary.domain || state.detectedRisk)} (${formatDecisionScore(primary.weightedSignal)})`,
      secondary.domain ? `${disorderLabel(secondary.domain)} (${formatDecisionScore(secondary.weightedSignal)})` : "-",
      confidence,
      state.needsExtra ? (isHu ? "igen" : "yes") : (isHu ? "nem" : "no")
    ];

    return `
      <div class="nm-decision-explain-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <p>${escapeHtml(copy.lead)}</p>
        <div class="nm-decision-explain-grid">
          ${copy.labels
            .map(
              (label, index) => `
                <div class="nm-decision-explain-item">
                  <span class="nm-decision-explain-label">${escapeHtml(label)}</span>
                  <span class="nm-decision-explain-value">${escapeHtml(values[index])}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }


  function getPrePaymentTrustCopy() {
    const copies = {
      hu: {
        title: "Miért érdemes most elkészíteni a teljes riportot?",
        items: [
          { title: "Személyre szabott értelmezés", text: "A válaszaid alapján már látszik egy minta. A teljes riport ezt fordítja le szülőként is használható magyarázattá." },
          { title: "Több, mint egy címke", text: "A fő és másodlagos jelzéseket, korosztályt és válaszmintázatokat együtt értelmezi." },
          { title: "Konkrét következő lépések", text: "Segít eldönteni, mit figyelj meg otthon, óvodában vagy iskolai helyzetekben." }
        ],
        note: "Egyszeri fizetés, nincs előfizetés. A PDF riport emailben érkezik."
      },
      en: {
        title: "Why generate the full report now?",
        items: [
          { title: "A pattern is already visible", text: "The full report turns it into a clear, parent-friendly explanation." },
          { title: "More than a label", text: "It considers primary and secondary signals, age context, and response patterns together." },
          { title: "Translated into next steps", text: "The goal is to help you know what to observe at home, preschool, or school." }
        ],
        note: "One-time payment, no subscription. The PDF report arrives by email."
      },
      de: {
        title: "Warum den vollständigen Bericht jetzt erstellen?",
        items: [
          { title: "Ein Muster ist sichtbar", text: "Der Bericht macht daraus eine klare, elternfreundliche Erklärung." },
          { title: "Mehr als ein Etikett", text: "Er betrachtet Haupt- und Nebensignale zusammen mit Alter und Antwortmuster." },
          { title: "Konkretere nächste Schritte", text: "Du siehst, worauf du zu Hause, in der Kita oder Schule bewusster achten kannst." }
        ],
        note: "Einmalige Zahlung, kein Abo. Der PDF-Bericht kommt per E-Mail."
      },
      it: {
        title: "Perché generare ora il report completo?",
        items: [
          { title: "Un pattern è già visibile", text: "Il report lo trasforma in una spiegazione chiara e utile per i genitori." },
          { title: "Più di un'etichetta", text: "Considera insieme segnali principali, secondari, età e risposte." },
          { title: "Passi pratici", text: "Aiuta a capire cosa osservare a casa, alla scuola dell'infanzia o a scuola." }
        ],
        note: "Pagamento unico, nessun abbonamento. Il PDF arriva via email."
      },
      es: {
        title: "¿Por qué generar ahora el informe completo?",
        items: [
          { title: "Ya se ve un patrón", text: "El informe lo convierte en una explicación clara para familias." },
          { title: "Más que una etiqueta", text: "Considera señales principales, secundarias, edad y respuestas juntas." },
          { title: "Pasos concretos", text: "Ayuda a saber qué observar en casa, en infantil o en la escuela." }
        ],
        note: "Pago único, sin suscripción. El PDF llega por email."
      },
      zh: {
        title: "为什么现在生成完整报告？",
        items: [
          { title: "模式已经开始显现", text: "完整报告会把它转化为家长容易理解的说明。" },
          { title: "不只是一个标签", text: "它会结合主要信号、次要信号、年龄背景和回答模式。" },
          { title: "可执行的下一步", text: "帮助你知道在家里、幼儿园或学校情境中可以观察什么。" }
        ],
        note: "一次性付款，无订阅。PDF 报告会通过电子邮件发送。"
      },
      ja: {
        title: "なぜ今、完全版レポートを作成する価値があるのか",
        items: [
          { title: "すでに傾向が見えています", text: "完全版レポートでは、その傾向を保護者向けにわかりやすく整理します。" },
          { title: "単なるラベルではありません", text: "主なサイン、二次的なサイン、年齢背景、回答パターンを合わせて見ます。" },
          { title: "次の一歩につなげます", text: "家庭、園、学校で何を観察すればよいかを考える助けになります。" }
        ],
        note: "一回限りの支払いで、サブスクリプションはありません。PDFレポートはメールで届きます。"
      },
      ar: {
        title: "لماذا إنشاء التقرير الكامل الآن؟",
        items: [
          { title: "النمط بدأ يظهر", text: "يحوّل التقرير الكامل هذا النمط إلى شرح واضح ومناسب للوالدين." },
          { title: "أكثر من مجرد تسمية", text: "يربط بين الإشارات الأساسية والثانوية والعمر ونمط الإجابات." },
          { title: "خطوات عملية تالية", text: "يساعدك على معرفة ما يمكن ملاحظته في البيت أو الروضة أو المدرسة." }
        ],
        note: "دفعة واحدة دون اشتراك. يصل تقرير PDF عبر البريد الإلكتروني."
      },
      pl: {
        title: "Dlaczego warto wygenerować pełny raport teraz?",
        items: [
          { title: "Wzorzec jest już widoczny", text: "Raport zamienia go w jasne, przyjazne rodzicom wyjaśnienie." },
          { title: "Więcej niż etykieta", text: "Łączy sygnały główne, poboczne, wiek i odpowiedzi." },
          { title: "Praktyczne kolejne kroki", text: "Pomaga wiedzieć, co obserwować w domu, przedszkolu lub szkole." }
        ],
        note: "Płatność jednorazowa, bez abonamentu. PDF przychodzi emailem."
      },
      pt: {
        title: "Por que gerar o relatório completo agora?",
        items: [
          { title: "Um padrão já aparece", text: "O relatório transforma isso em uma explicação clara para pais." },
          { title: "Mais que um rótulo", text: "Considera sinais principais, secundários, idade e respostas em conjunto." },
          { title: "Próximos passos práticos", text: "Ajuda a saber o que observar em casa, na pré-escola ou na escola." }
        ],
        note: "Pagamento único, sem assinatura. O PDF chega por email."
      },
      fr: {
        title: "Pourquoi générer le rapport complet maintenant ?",
        items: [
          { title: "Un schéma est déjà visible", text: "Le rapport le transforme en explication claire pour les parents." },
          { title: "Plus qu'une étiquette", text: "Il relie signaux principaux, secondaires, âge et réponses." },
          { title: "Des prochaines étapes", text: "Il aide à savoir quoi observer à la maison, en maternelle ou à l'école." }
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
        title: "Mit tisztáz a teljes riport?",
        lead: "Az előszűrés már mutat egy irányt. A teljes riport abban segít, hogy a jelzés ne csak egy szám vagy címke legyen, hanem érthető, korosztályhoz illesztett mintázat.",
        items: [
          { title: "Mi állhat a válaszok mögött?", text: "A fő és másodlagos jelzéseket együtt értelmezi, hogy kevesebb legyen a félreértés." },
          { title: "Mennyire következetes a minta?", text: "A válaszok erősségét, átfedését és bizonytalanságát is figyelembe veszi." },
          { title: "Mit érdemes kipróbálni először?", text: "A javaslatok szülőként is használható, kicsi lépésekre vannak bontva." }
        ]
      },
      en: {
        title: "What does the full report clarify?",
        lead: "The screening already shows a direction. The full report turns it into an understandable, age-aware pattern instead of just a score or label.",
        items: [
          { title: "What may be behind the answers?", text: "It interprets primary and secondary signals together to reduce misunderstandings." },
          { title: "How consistent is the pattern?", text: "It considers signal strength, overlap, and uncertainty in the response profile." },
          { title: "What is worth trying first?", text: "Suggestions are translated into small parent-friendly next steps." }
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
      zh: {
        title: "完整报告会进一步说明什么？",
        lead: "初筛已经显示方向。完整报告会把它整理成更清晰、符合年龄背景的模式，而不只是一个分数或标签。",
        items: [
          { title: "回答背后可能是什么？", text: "同时解释主要信号和次要信号，减少误解。" },
          { title: "这个模式有多稳定？", text: "考虑信号强度、重叠和不确定性。" },
          { title: "可以先尝试什么？", text: "建议会转化为家长容易执行的小步骤。" }
        ]
      },
      ja: {
        title: "完全版レポートで何がわかりますか？",
        lead: "スクリーニングは方向性を示します。完全版では年齢背景に合わせて、点数やラベルだけではない形でわかりやすく整理します。",
        items: [
          { title: "回答の背景", text: "主なサインと二次的なサインを合わせて解釈します。" },
          { title: "一貫性", text: "強さ、重なり、不確実性も確認します。" },
          { title: "最初の一歩", text: "保護者が使いやすい小さな行動に落とし込みます。" }
        ]
      },
      ar: {
        title: "ما الذي يوضحه التقرير الكامل؟",
        lead: "يعطي الفحص الأولي اتجاهاً عاماً. يحوّل التقرير الكامل هذا الاتجاه إلى نمط أوضح ومناسب لعمر الطفل، وليس مجرد رقم أو تسمية.",
        items: [
          { title: "ما وراء الإجابات؟", text: "يفسر الإشارات الأساسية والثانوية معاً لتقليل سوء الفهم." },
          { title: "مدى ثبات النمط", text: "يراعي قوة الإشارة والتداخل ودرجة عدم اليقين." },
          { title: "الخطوة الأولى", text: "يحوّل النتائج إلى خطوات صغيرة مفهومة للوالدين." }
        ]
      },
      pl: {
        title: "Co wyjaśnia pełny raport?",
        lead: "Badanie przesiewowe pokazuje już kierunek. Raport zamienia go w zrozumiały wzorzec dopasowany do wieku, a nie tylko wynik lub etykietę.",
        items: [
          { title: "Co może stać za odpowiedziami?", text: "Łączy sygnały główne i poboczne, aby ograniczyć nieporozumienia." },
          { title: "Jak spójny jest wzorzec?", text: "Uwzględnia siłę sygnału, nakładanie się i niepewność." },
          { title: "Co spróbować najpierw?", text: "Wskazówki są rozpisane na małe kroki dla rodziców." }
        ]
      },
      pt: {
        title: "O que o relatório completo esclarece?",
        lead: "A triagem já mostra uma direção. O relatório transforma isso em um padrão compreensível e adequado à idade, não apenas em uma pontuação ou rótulo.",
        items: [
          { title: "O que pode estar por trás?", text: "Interpreta sinais principais e secundários em conjunto." },
          { title: "O padrão é consistente?", text: "Considera força do sinal, sobreposição e incerteza." },
          { title: "O que tentar primeiro?", text: "As sugestões viram pequenos passos para os pais." }
        ]
      },
      fr: {
        title: "Que clarifie le rapport complet ?",
        lead: "Le dépistage montre déjà une direction. Le rapport complet la transforme en profil compréhensible et adapté à l'âge, pas seulement en score ou étiquette.",
        items: [
          { title: "Que peut-il y avoir derrière ?", text: "Il relie les signaux principaux et secondaires." },
          { title: "Le profil est-il cohérent ?", text: "Il tient compte de l'intensité, du recoupement et de l'incertitude." },
          { title: "Que tenter d'abord ?", text: "Les conseils sont formulés en petites étapes pour les parents." }
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
        title: "Miért ad többet a teljes kiértékelés?",
        lead: "A válaszokból nem egyetlen pontszámot érdemes nézni. A teljes riport a jelzések erősségét, következetességét, átfedését és a gyermek korosztályát együtt értelmezi.",
        items: [
          { title: "Mintázat, nem címke", text: "Rendszerezi a viselkedési és érzelmi jelzéseket anélkül, hogy diagnózist mondana." },
          { title: "Korosztályi kontextus", text: "Az óvodás, kisiskolás és nagyobb gyermekek jelzéseit másként kell értelmezni." },
          { title: "Átfedések kezelése", text: "Láthatóvá teszi, ha több terület közel van egymáshoz." },
          { title: "Szülőbarát következő lépés", text: "A következtetést gyakorlatias, nyugodt nyelvre fordítja." }
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
        title: "Warum bringt die vollständige Analyse mehr?",
        lead: "Die kurze Zusammenfassung zeigt nur das stärkste Muster. Der vollständige Bericht vergleicht mehrere Antwort-Ebenen und wird dadurch nuancierter und praktischer.",
        items: [
          { title: "Muster statt Etikett", text: "Er ordnet Verhaltens- und emotionale Signale, ohne eine Diagnose zu stellen." },
          { title: "Alterskontext", text: "Vorschulalter, frühes Schulalter und ältere Kinder brauchen unterschiedliche Einordnung." },
          { title: "Überschneidungen", text: "Ähnliche Signalbereiche und Unsicherheiten werden sichtbar gemacht." },
          { title: "Nächster Schritt", text: "Der Bericht gibt beobachtbare und alltagsnahe Unterstützungsrichtungen." }
        ]
      },
      it: {
        title: "Perché l'analisi completa aggiunge valore?",
        lead: "Il riepilogo breve mostra solo il pattern più forte. Il report completo confronta più livelli di risposta, rendendo il risultato più sfumato e pratico.",
        items: [
          { title: "Pattern, non etichetta", text: "Organizza segnali comportamentali ed emotivi senza formulare una diagnosi." },
          { title: "Contesto d'età", text: "Età prescolare, primi anni di scuola e bambini più grandi richiedono letture diverse." },
          { title: "Gestione delle sovrapposizioni", text: "Evidenzia l'incertezza tra aree sintomatiche simili." },
          { title: "Passo successivo", text: "Il report offre direzioni di osservazione e supporto per i genitori." }
        ]
      },
      es: {
        title: "¿Por qué aporta más valor el análisis completo?",
        lead: "El resumen breve solo muestra el patrón más fuerte. El informe completo compara más capas de respuestas, por eso ofrece un resultado más matizado y práctico.",
        items: [
          { title: "Patrón, no etiqueta", text: "Organiza señales conductuales y emocionales sin emitir un diagnóstico." },
          { title: "Contexto de edad", text: "La edad preescolar, la etapa escolar inicial y los niños mayores requieren interpretaciones distintas." },
          { title: "Solapamientos", text: "Muestra la incertidumbre entre áreas de señales parecidas." },
          { title: "Siguiente paso", text: "El informe ofrece orientaciones de observación y apoyo para familias." }
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
          { title: "سياق العمر", text: "تختلف القراءة بين مرحلة ما قبل المدرسة والسن المدرسي المبكر والأطفال الأكبر سناً." },
          { title: "التداخل بين الإشارات", text: "يوضح مناطق عدم اليقين بين المجالات المتشابهة." },
          { title: "خطوة تالية للوالدين", text: "يعطي التقرير اتجاهات للملاحظة والدعم اليومي." }
        ]
      },
      pl: {
        title: "Dlaczego pełna analiza daje więcej?",
        lead: "Krótkie podsumowanie pokazuje tylko najsilniejszy wzorzec. Pełny raport porównuje więcej warstw odpowiedzi, dlatego jest bardziej praktyczny i dokładniejszy.",
        items: [
          { title: "Wzorzec, nie etykieta", text: "Porządkuje sygnały zachowania i emocji bez stawiania diagnozy." },
          { title: "Kontekst wieku", text: "Przedszkolak, młodszy uczeń i starsze dziecko wymagają innej interpretacji." },
          { title: "Nakładanie się obszarów", text: "Pokazuje niepewność między podobnymi obszarami sygnałów." },
          { title: "Kolejny krok dla rodzica", text: "Raport daje kierunki obserwacji i wsparcia." }
        ]
      },
      pt: {
        title: "Por que a análise completa acrescenta valor?",
        lead: "O resumo curto mostra apenas o padrão mais forte. O relatório completo compara mais camadas de respostas, tornando o resultado mais nuançado e prático.",
        items: [
          { title: "Padrão, não rótulo", text: "Organiza sinais comportamentais e emocionais sem fazer diagnóstico." },
          { title: "Contexto de idade", text: "Pré-escola, início da vida escolar e crianças mais velhas precisam de leituras diferentes." },
          { title: "Sobreposições", text: "Mostra incertezas entre áreas de sinais semelhantes." },
          { title: "Próximo passo para os pais", text: "O relatório oferece direções de observação e apoio." }
        ]
      },
      fr: {
        title: "Pourquoi l'analyse complète apporte-t-elle plus ?",
        lead: "Le résumé court montre seulement le schéma le plus fort. Le rapport complet compare davantage de couches de réponses, ce qui rend le résultat plus nuancé et pratique.",
        items: [
          { title: "Schéma, pas étiquette", text: "Il organise les signaux comportementaux et émotionnels sans poser de diagnostic." },
          { title: "Contexte d'âge", text: "L'interprétation diffère entre préscolaire, début de scolarité et enfants plus âgés." },
          { title: "Chevauchements", text: "Il met en évidence l'incertitude entre des domaines de signes similaires." },
          { title: "Prochaine étape", text: "Le rapport propose des pistes d'observation et de soutien pour les parents." }
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


  function getSummaryPayCopy(t) {
    const copies = {
      hu: {
        title: "A teljes riport segít érthetően látni a mintázatot.",
        text: "Korosztályi kontextust, részletes területi bontást és gyakorlati következő lépéseket kapsz PDF-ben.",
        label: "Fizetés és teljes riport"
      },
      en: {
        title: "The full report helps make the pattern easier to understand.",
        text: "You get age-aware context, detailed area breakdowns, and practical next steps in a PDF report.",
        label: "Pay and get full report"
      },
      de: {
        title: "Der vollständige Bericht macht das Muster verständlicher.",
        text: "Du erhältst Alterskontext, detaillierte Bereiche und praktische nächste Schritte als PDF.",
        label: "Bezahlen und Bericht erhalten"
      },
      it: {
        title: "Il report completo rende il pattern più comprensibile.",
        text: "Ricevi contesto per età, aree dettagliate e passi pratici in PDF.",
        label: "Paga e ricevi il report"
      },
      es: {
        title: "El informe completo ayuda a entender mejor el patrón.",
        text: "Recibirás contexto por edad, desglose detallado y próximos pasos prácticos en PDF.",
        label: "Pagar y recibir informe"
      },
      zh: {
        title: "完整报告帮助你更容易理解这个模式。",
        text: "你会获得年龄背景、详细领域拆解和实用下一步建议。",
        label: "支付并获取完整报告"
      },
      ja: {
        title: "完全版レポートで傾向をより理解しやすくします。",
        text: "年齢背景、詳しい領域別整理、実用的な次の一歩をPDFで受け取れます。",
        label: "支払い、完全版レポートを受け取る"
      },
      ar: {
        title: "يساعدك التقرير الكامل على فهم النمط بوضوح أكبر.",
        text: "ستحصل على سياق العمر وتفصيل المجالات وخطوات عملية تالية في ملف PDF.",
        label: "الدفع والحصول على التقرير الكامل"
      },
      pl: {
        title: "Pełny raport pomaga lepiej zrozumieć wzorzec.",
        text: "Otrzymasz kontekst wieku, szczegółowy podział obszarów i praktyczne kolejne kroki w PDF.",
        label: "Zapłać i odbierz raport"
      },
      pt: {
        title: "O relatório completo ajuda a entender melhor o padrão.",
        text: "Você recebe contexto de idade, áreas detalhadas e próximos passos práticos em PDF.",
        label: "Pagar e receber relatório"
      },
      fr: {
        title: "Le rapport complet aide à mieux comprendre le schéma.",
        text: "Vous recevez le contexte d'âge, le détail des domaines et des prochaines étapes pratiques en PDF.",
        label: "Payer et recevoir le rapport"
      }
    };

    const copy = copies[state.lang] || copies.en;
    return {
      title: copy.title,
      text: copy.text,
      label: t.summaryPayCta || copy.label || t.pay || copies.en.label
    };
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
    const topPayCopy =
      state.lang === "hu"
        ? {
            title: "A teljes riport seg\u00edt \u00e9rthet\u0151en l\u00e1tni a mint\u00e1zatot.",
            text: "Koroszt\u00e1lyi kontextust, r\u00e9szletes ter\u00fcleti bont\u00e1st \u00e9s gyakorlati k\u00f6vetkez\u0151 l\u00e9p\u00e9seket kapsz PDF-ben.",
            label: t.summaryPayCta || "Fizet\u00e9s \u00e9s teljes riport"
          }
        : {
            title: "The full report helps make the pattern easier to understand.",
            text: "You get age-aware context, detailed area breakdowns, and practical next steps in a PDF report.",
            label: t.summaryPayCta || t.pay || "Pay and get full report"
          };

    container.innerHTML = `
      <div>
        <div class="nm-summary-hero">
          <h3>${t.summaryTitle || "Summary"}</h3>
          <div>
            ${t.summaryNote || ""}
          </div>
        </div>

        <div class="nm-summary-top-cta">
          <div class="nm-summary-top-cta-copy">
            <strong>${escapeHtml(topPayCopy.title)}</strong>
            <span>${escapeHtml(topPayCopy.text)}</span>
          </div>
          <button type="button" class="nm-summary-pay-button" data-nm-summary-pay="top">
            ${escapeHtml(topPayCopy.label)}
          </button>
        </div>

        ${buildPackageSelectorHtml("summary")}

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

        ${buildReportPreviewV2Html()}

        ${buildDecisionExplanationHtml()}

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

    container.querySelectorAll("[data-nm-summary-pay]").forEach((button) => {
      button.addEventListener("click", startCheckout);
    });
    container.querySelectorAll("[data-nm-package-selector]").forEach(bindPackageSelector);
    updatePackageCheckoutButtons();
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
    updatePackageCheckoutButtons();
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
        needs_extra: state.needsExtra,
        answer_count: state.triageAnswers.length
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
        needs_extra: state.needsExtra,
        answer_count: state.specificAnswers.length + state.extraAnswers.length,
        specific_answer_count: state.specificAnswers.length,
        extra_answer_count: state.extraAnswers.length
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
      errors.push("A triage kérdések nincsenek teljesen kitöltve.");
    }

    if (!state.detectedRisk) {
      errors.push("Nem sikerült meghatározni a fő területet.");
    }

    if (!state.specificQuestions.length || state.specificAnswers.length !== state.specificQuestions.length) {
      errors.push("A specifikus kérdések nincsenek teljesen kitöltve.");
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

        errors.push("Az extra kérdések nincsenek kitöltve.");
      }
    }

    if (errors.length) {
      console.error("Checkout validation failed:", errors);
      return { ok: false, errors };
    }

    console.log("Checkout validation passed");
    return { ok: true };
  }

  function buildCheckoutPayload(consentReceipt = null) {
    const childAge = getChildAgeValue();

    return {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      childAge,
      ageYears: childAge,
      lang: state.lang,
      packageCode: normalizeClientPackageCode(state.packageCode),
      consent: consentReceipt
        ? {
            id: consentReceipt.id || consentReceipt.consentId || "",
            token: consentReceipt.token || ""
          }
        : null,
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
        ? "A fizetési link nem érkezett meg megfelelően. Kérlek, próbáld újra, vagy jelezd nekünk, ha megismétlődik."
        : "The payment link was not returned correctly. Please try again, or contact us if this repeats.";
    }

    if (/failed to fetch|network|load failed/i.test(message)) {
      return isHu
        ? "Nem sikerült kapcsolódni a fizetési kiszolgálóhoz. Ellenőrizd a kapcsolatot, majd próbáld újra."
        : "Could not connect to the checkout service. Please check your connection and try again.";
    }

    if (/too many requests/i.test(message)) {
      return isHu
        ? "Túl sok próbálkozás történt rövid időn belül. Kérlek várj egy kicsit, majd próbáld újra."
        : "Too many attempts were made in a short time. Please wait a moment and try again.";
    }

    return message || t.checkoutError || (isHu ? "Nem sikerült elindítani a fizetést." : "Could not start checkout.");
  }

  function getCustomerCopy(copies, lang = state.lang) {
    return copies[lang] || copies.en || copies.hu || {};
  }

  function getLandingProofCopy(lang = state.lang) {
    const copies = {
      hu: ["szülőbarát, megnyugtató nyelvezet", "korosztályi szempontokkal finomítva", "nem diagnózis, hanem érthető előszűrés"],
      en: ["parent-friendly, calm language", "refined with age-aware context", "not a diagnosis, but structured screening"],
      de: ["elternfreundliche, beruhigende Sprache", "altersgerecht eingeordnet", "keine Diagnose, sondern strukturiertes Screening"],
      it: ["linguaggio sereno per i genitori", "adattato all'età", "non una diagnosi, ma uno screening strutturato"],
      es: ["lenguaje claro y tranquilizador", "ajustado a la edad", "no es un diagnóstico, sino un cribado estructurado"],
      zh: ["面向家长的安心表达", "结合年龄背景理解", "不是诊断，而是结构化筛查"],
      ja: ["保護者にわかりやすい安心できる表現", "年齢背景に合わせた整理", "診断ではなく構造化されたスクリーニング"],
      ar: ["لغة مطمئنة ومناسبة للوالدين", "مصمم وفق عمر الطفل", "ليس تشخيصا بل فرز منظم"],
      pl: ["spokojny język przyjazny rodzicom", "dopasowane do wieku dziecka", "nie diagnoza, lecz uporządkowany screening"],
      pt: ["linguagem calma para os pais", "ajustado ao contexto da idade", "não é diagnóstico, é triagem estruturada"],
      fr: ["langage clair et rassurant", "adapté à l'âge de l'enfant", "pas un diagnostic, mais un dépistage structuré"]
    };

    return copies[lang] || copies.en;
  }

  function buildReportPreviewV2Html() {
    const copy = getCustomerCopy({
      hu: {
        title: "Mit mutat majd pontosabban a teljes riport?",
        lead: "A fizetés utáni riport nem újabb címkét ad, hanem érthetően összerendezi a válaszokat, a korosztályt és az átfedéseket.",
        labels: ["Fő minta", "Másodlagos jelzés", "Korosztály", "Jelzésszint"],
        noSecondary: "nincs erős másodlagos jelzés"
      },
      en: {
        title: "What will the full report clarify?",
        lead: "The paid report does not add another label. It organizes the answers, age context, and overlaps into a clear parent-friendly picture.",
        labels: ["Primary pattern", "Secondary signal", "Age context", "Signal level"],
        noSecondary: "no strong secondary signal"
      },
      de: {
        title: "Was klärt der vollständige Bericht?",
        lead: "Der Bericht gibt kein weiteres Etikett, sondern ordnet Antworten, Alter und Überschneidungen verständlich ein.",
        labels: ["Hauptmuster", "Sekundäres Signal", "Alterskontext", "Signalstärke"],
        noSecondary: "kein starkes sekundäres Signal"
      },
      it: {
        title: "Cosa chiarirà il report completo?",
        lead: "Il report non aggiunge un'etichetta, ma organizza risposte, età e sovrapposizioni in modo chiaro per i genitori.",
        labels: ["Pattern principale", "Segnale secondario", "Contesto d'età", "Livello del segnale"],
        noSecondary: "nessun forte segnale secondario"
      },
      es: {
        title: "¿Qué aclarará el informe completo?",
        lead: "El informe no añade otra etiqueta: organiza respuestas, edad y solapamientos en una imagen clara para familias.",
        labels: ["Patrón principal", "Señal secundaria", "Contexto de edad", "Nivel de señal"],
        noSecondary: "sin señal secundaria fuerte"
      },
      zh: {
        title: "完整报告会进一步说明什么？",
        lead: "付费报告不是再给孩子贴标签，而是把回答、年龄背景和重叠信号整理成家长容易理解的图景。",
        labels: ["主要模式", "次要信号", "年龄背景", "信号水平"],
        noSecondary: "没有明显的次要信号"
      },
      ja: {
        title: "完全版レポートで何がより明確になりますか？",
        lead: "有料レポートは新しいラベルを付けるものではなく、回答、年齢背景、重なりを保護者にわかりやすく整理します。",
        labels: ["主な傾向", "二次的なサイン", "年齢背景", "サインの強さ"],
        noSecondary: "強い二次的サインはありません"
      },
      ar: {
        title: "ماذا سيوضح التقرير الكامل؟",
        lead: "التقرير لا يضيف تسمية جديدة، بل ينظم الإجابات وسياق العمر والتداخلات في صورة واضحة ومناسبة للوالدين.",
        labels: ["النمط الرئيسي", "إشارة ثانوية", "سياق العمر", "مستوى الإشارة"],
        noSecondary: "لا توجد إشارة ثانوية قوية"
      },
      pl: {
        title: "Co wyjaśni pełny raport?",
        lead: "Raport nie dodaje kolejnej etykiety, tylko porządkuje odpowiedzi, wiek i nakładanie się sygnałów w jasny obraz dla rodzica.",
        labels: ["Główny wzorzec", "Sygnał wtórny", "Kontekst wieku", "Poziom sygnału"],
        noSecondary: "brak silnego sygnału wtórnego"
      },
      pt: {
        title: "O que o relatório completo esclarece?",
        lead: "O relatório não adiciona outro rótulo. Ele organiza respostas, idade e sobreposições de forma clara para os pais.",
        labels: ["Padrão principal", "Sinal secundário", "Contexto de idade", "Nível do sinal"],
        noSecondary: "sem sinal secundário forte"
      },
      fr: {
        title: "Que clarifie le rapport complet ?",
        lead: "Le rapport n'ajoute pas une étiquette : il organise les réponses, l'âge et les recoupements dans une lecture claire pour les parents.",
        labels: ["Schéma principal", "Signal secondaire", "Contexte d'âge", "Niveau du signal"],
        noSecondary: "pas de signal secondaire fort"
      }
    });

    const signal =
      state.resultSummary?.signal?.[state.lang] ||
      state.resultSummary?.signal?.en ||
      state.resultSummary?.signal?.key ||
      "-";
    const values = [
      disorderLabel(state.detectedRisk),
      state.secondaryRisk ? disorderLabel(state.secondaryRisk) : copy.noSecondary,
      getAgeContextLabel(),
      signal
    ];

    return `
      <div class="nm-report-preview-v2-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <p>${escapeHtml(copy.lead)}</p>
        <div class="nm-report-preview-v2-grid">
          ${copy.labels.map((label, index) => `
            <div class="nm-report-preview-v2-item">
              <span class="nm-report-preview-v2-label">${escapeHtml(label)}</span>
              <span class="nm-report-preview-v2-value">${escapeHtml(values[index])}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function buildDecisionExplanationHtml() {
    const ranking = getDecisionRankingTop();
    const primary = ranking[0] || {};
    const secondary = ranking[1] || {};
    const gap = Number(primary.weightedSignal || 0) - Number(secondary.weightedSignal || 0);
    const copy = getCustomerCopy({
      hu: {
        title: "Hogyan döntött az engine?",
        lead: "A rendszer nem egyetlen válaszból következtet. A fő és másodlagos területeket a jelzés erőssége, következetessége és átfedése alapján rendezi.",
        labels: ["Fő jelzés", "Másodlagos jelzés", "Biztonság", "Extra pontosítás"],
        confidence: ["szoros eredmény", "közepes biztonság", "magasabb biztonság"],
        yes: "igen",
        no: "nem"
      },
      en: {
        title: "How did the engine decide?",
        lead: "The engine does not infer from one answer. It ranks primary and secondary areas using signal strength, consistency, and overlap.",
        labels: ["Primary signal", "Secondary signal", "Confidence", "Extra clarification"],
        confidence: ["close result", "moderate confidence", "stronger confidence"],
        yes: "yes",
        no: "no"
      },
      de: {
        title: "Wie hat die Engine entschieden?",
        lead: "Die Entscheidung basiert nicht auf einer einzelnen Antwort, sondern auf Signalstärke, Konsistenz und Überschneidung.",
        labels: ["Hauptsignal", "Sekundäres Signal", "Sicherheit", "Zusatzklärung"],
        confidence: ["knappes Ergebnis", "mittlere Sicherheit", "höhere Sicherheit"],
        yes: "ja",
        no: "nein"
      },
      it: {
        title: "Come ha deciso il motore?",
        lead: "Il motore non deduce da una sola risposta: ordina le aree secondo intensità, coerenza e sovrapposizione.",
        labels: ["Segnale principale", "Segnale secondario", "Affidabilità", "Chiarimento extra"],
        confidence: ["risultato vicino", "affidabilità moderata", "affidabilità più alta"],
        yes: "sì",
        no: "no"
      },
      es: {
        title: "¿Cómo decidió el motor?",
        lead: "El motor no concluye a partir de una sola respuesta: ordena las áreas según intensidad, consistencia y solapamiento.",
        labels: ["Señal principal", "Señal secundaria", "Confianza", "Aclaración extra"],
        confidence: ["resultado cercano", "confianza moderada", "confianza más alta"],
        yes: "sí",
        no: "no"
      },
      zh: {
        title: "系统是如何判断的？",
        lead: "系统不会根据单一回答判断，而是结合信号强度、一致性和重叠程度来排序。",
        labels: ["主要信号", "次要信号", "可信度", "额外澄清"],
        confidence: ["结果接近", "中等可信度", "较高可信度"],
        yes: "是",
        no: "否"
      },
      ja: {
        title: "エンジンはどのように判断しましたか？",
        lead: "ひとつの回答だけで判断せず、サインの強さ、一貫性、重なりをもとに主な領域と二次的領域を整理します。",
        labels: ["主なサイン", "二次的サイン", "信頼度", "追加確認"],
        confidence: ["近い結果", "中程度の信頼度", "より高い信頼度"],
        yes: "はい",
        no: "いいえ"
      },
      ar: {
        title: "كيف اتخذ النظام قراره؟",
        lead: "لا يعتمد النظام على إجابة واحدة، بل يرتب المجالات حسب قوة الإشارة واتساقها والتداخل بينها.",
        labels: ["الإشارة الرئيسية", "إشارة ثانوية", "درجة الثقة", "توضيح إضافي"],
        confidence: ["نتيجة متقاربة", "ثقة متوسطة", "ثقة أعلى"],
        yes: "نعم",
        no: "لا"
      },
      pl: {
        title: "Jak silnik podjął decyzję?",
        lead: "System nie wnioskuje z jednej odpowiedzi, tylko porządkuje obszary według siły sygnału, spójności i nakładania się.",
        labels: ["Sygnał główny", "Sygnał wtórny", "Pewność", "Dodatkowe doprecyzowanie"],
        confidence: ["bliski wynik", "umiarkowana pewność", "wyższa pewność"],
        yes: "tak",
        no: "nie"
      },
      pt: {
        title: "Como o motor decidiu?",
        lead: "O motor não conclui por uma única resposta. Ele ordena áreas por força do sinal, consistência e sobreposição.",
        labels: ["Sinal principal", "Sinal secundário", "Confiança", "Esclarecimento extra"],
        confidence: ["resultado próximo", "confiança moderada", "confiança maior"],
        yes: "sim",
        no: "não"
      },
      fr: {
        title: "Comment le moteur a-t-il décidé ?",
        lead: "Le moteur ne déduit pas à partir d'une seule réponse. Il classe les domaines selon l'intensité, la cohérence et les recoupements.",
        labels: ["Signal principal", "Signal secondaire", "Confiance", "Clarification supplémentaire"],
        confidence: ["résultat proche", "confiance modérée", "confiance plus élevée"],
        yes: "oui",
        no: "non"
      }
    });

    const confidence =
      gap >= 0.35 ? copy.confidence[2] : gap >= 0.16 ? copy.confidence[1] : copy.confidence[0];
    const values = [
      `${disorderLabel(primary.domain || state.detectedRisk)} (${formatDecisionScore(primary.weightedSignal)})`,
      secondary.domain ? `${disorderLabel(secondary.domain)} (${formatDecisionScore(secondary.weightedSignal)})` : "-",
      confidence,
      state.needsExtra ? copy.yes : copy.no
    ];

    return `
      <div class="nm-decision-explain-card">
        <h4>${escapeHtml(copy.title)}</h4>
        <p>${escapeHtml(copy.lead)}</p>
        <div class="nm-decision-explain-grid">
          ${copy.labels.map((label, index) => `
            <div class="nm-decision-explain-item">
              <span class="nm-decision-explain-label">${escapeHtml(label)}</span>
              <span class="nm-decision-explain-value">${escapeHtml(values[index])}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function getPrePaymentTrustCopy() {
    return getCustomerCopy({
      hu: {
        title: "Miért érdemes most elkészíteni a teljes riportot?",
        items: [
          { title: "Személyre szabott értelmezés", text: "A válaszaid alapján már látszik egy minta. A teljes riport ezt szülőként is használható magyarázattá fordítja." },
          { title: "Több, mint egy címke", text: "A fő és másodlagos jelzéseket, korosztályt és válaszmintázatokat együtt értelmezi." },
          { title: "Konkrét következő lépések", text: "Segít eldönteni, mit figyelj meg otthon, óvodában vagy iskolai helyzetekben." }
        ],
        note: "Egyszeri fizetés, nincs előfizetés. A PDF riport emailben érkezik."
      },
      en: {
        title: "Why generate the full report now?",
        items: [
          { title: "Personalized interpretation", text: "A pattern is already visible. The full report turns it into a clear parent-friendly explanation." },
          { title: "More than a label", text: "It considers primary and secondary signals, age context, and response patterns together." },
          { title: "Concrete next steps", text: "It helps you know what to observe at home, preschool, or school." }
        ],
        note: "One-time payment, no subscription. The PDF report arrives by email."
      },
      de: {
        title: "Warum den vollständigen Bericht jetzt erstellen?",
        items: [
          { title: "Persönliche Einordnung", text: "Ein Muster ist sichtbar. Der Bericht macht daraus eine klare, elternfreundliche Erklärung." },
          { title: "Mehr als ein Etikett", text: "Haupt- und Nebensignale, Alter und Antwortmuster werden gemeinsam betrachtet." },
          { title: "Konkrete nächste Schritte", text: "Du siehst, worauf du zu Hause, in der Kita oder Schule achten kannst." }
        ],
        note: "Einmalige Zahlung, kein Abo. Der PDF-Bericht kommt per E-Mail."
      },
      it: {
        title: "Perché generare ora il report completo?",
        items: [
          { title: "Interpretazione personalizzata", text: "Il pattern visibile diventa una spiegazione chiara e utile per i genitori." },
          { title: "Più di un'etichetta", text: "Segnali principali, secondari, età e risposte vengono letti insieme." },
          { title: "Passi concreti", text: "Aiuta a capire cosa osservare a casa, all'asilo o a scuola." }
        ],
        note: "Pagamento unico, nessun abbonamento. Il PDF arriva via email."
      },
      es: {
        title: "¿Por qué generar ahora el informe completo?",
        items: [
          { title: "Interpretación personalizada", text: "El patrón visible se convierte en una explicación clara para familias." },
          { title: "Más que una etiqueta", text: "Señales principales, secundarias, edad y respuestas se interpretan juntas." },
          { title: "Pasos concretos", text: "Ayuda a saber qué observar en casa, infantil o la escuela." }
        ],
        note: "Pago único, sin suscripción. El PDF llega por email."
      },
      zh: {
        title: "为什么现在生成完整报告？",
        items: [
          { title: "个性化解读", text: "回答中已经出现模式，完整报告会把它整理成家长容易理解的说明。" },
          { title: "不只是标签", text: "同时考虑主要信号、次要信号、年龄背景和回答模式。" },
          { title: "具体下一步", text: "帮助你知道在家、幼儿园或学校情境中可以观察什么。" }
        ],
        note: "一次性付款，无订阅。PDF报告将通过电子邮件发送。"
      },
      ja: {
        title: "なぜ今、完全版レポートを作成する価値があるのか",
        items: [
          { title: "個別化された解釈", text: "回答から見える傾向を、保護者が使いやすい説明に整理します。" },
          { title: "単なるラベルではありません", text: "主なサイン、二次的サイン、年齢背景、回答パターンを合わせて見ます。" },
          { title: "具体的な次の一歩", text: "家庭、園、学校で何を観察すればよいかを考える助けになります。" }
        ],
        note: "一回限りの支払いで、サブスクリプションはありません。PDFレポートはメールで届きます。"
      },
      ar: {
        title: "لماذا يستحق إنشاء التقرير الكامل الآن؟",
        items: [
          { title: "تفسير شخصي", text: "النمط بدأ يظهر من الإجابات، والتقرير يحوله إلى شرح واضح ومفيد للوالدين." },
          { title: "أكثر من تسمية", text: "يربط بين الإشارات الرئيسية والثانوية وسياق العمر ونمط الإجابات." },
          { title: "خطوات تالية ملموسة", text: "يساعدك على معرفة ما يمكن ملاحظته في البيت أو الروضة أو المدرسة." }
        ],
        note: "دفعة واحدة دون اشتراك. يصل تقرير PDF عبر البريد الإلكتروني."
      },
      pl: {
        title: "Dlaczego warto wygenerować pełny raport teraz?",
        items: [
          { title: "Personalizowana interpretacja", text: "Widoczny wzorzec zostaje zamieniony w jasne wyjaśnienie dla rodzica." },
          { title: "Więcej niż etykieta", text: "Sygnały główne, wtórne, wiek i odpowiedzi są interpretowane razem." },
          { title: "Konkretne kolejne kroki", text: "Pomaga wiedzieć, co obserwować w domu, przedszkolu lub szkole." }
        ],
        note: "Płatność jednorazowa, bez abonamentu. PDF przychodzi emailem."
      },
      pt: {
        title: "Por que gerar o relatório completo agora?",
        items: [
          { title: "Interpretação personalizada", text: "O padrão visível vira uma explicação clara e útil para os pais." },
          { title: "Mais que um rótulo", text: "Sinais principais, secundários, idade e respostas são vistos juntos." },
          { title: "Próximos passos concretos", text: "Ajuda a saber o que observar em casa, na pré-escola ou na escola." }
        ],
        note: "Pagamento único, sem assinatura. O PDF chega por email."
      },
      fr: {
        title: "Pourquoi générer le rapport complet maintenant ?",
        items: [
          { title: "Interprétation personnalisée", text: "Le schéma visible devient une explication claire et utile pour les parents." },
          { title: "Plus qu'une étiquette", text: "Signaux principaux, secondaires, âge et réponses sont interprétés ensemble." },
          { title: "Prochaines étapes concrètes", text: "Aide à savoir quoi observer à la maison, en maternelle ou à l'école." }
        ],
        note: "Paiement unique, sans abonnement. Le PDF arrive par email."
      }
    });
  }

  function getSummaryNextStepCopy() {
    return getCustomerCopy({
      hu: {
        title: "Mit tisztáz a teljes riport?",
        lead: "Az előszűrés már mutat egy irányt. A teljes riport abban segít, hogy a jelzés ne csak egy szám vagy címke legyen, hanem érthető, korosztályhoz illesztett mintázat.",
        items: [
          { title: "Mi állhat a válaszok mögött?", text: "A fő és másodlagos jelzéseket együtt értelmezi, hogy kevesebb legyen a félreértés." },
          { title: "Mennyire következetes a minta?", text: "A válaszok erősségét, átfedését és bizonytalanságát is figyelembe veszi." },
          { title: "Mit érdemes kipróbálni először?", text: "A javaslatok szülőként is használható, kicsi lépésekre vannak bontva." }
        ]
      },
      en: {
        title: "What does the full report clarify?",
        lead: "The screening already shows a direction. The full report turns it into an understandable, age-aware pattern instead of just a score or label.",
        items: [
          { title: "What may be behind the answers?", text: "It interprets primary and secondary signals together to reduce misunderstandings." },
          { title: "How consistent is the pattern?", text: "It considers signal strength, overlap, and uncertainty in the response profile." },
          { title: "What is worth trying first?", text: "Suggestions are translated into small parent-friendly next steps." }
        ]
      },
      de: {
        title: "Was klärt der vollständige Bericht?",
        lead: "Das Screening zeigt eine Richtung. Der Bericht macht daraus ein verständliches, altersbezogenes Muster.",
        items: [
          { title: "Was kann hinter den Antworten stehen?", text: "Haupt- und Nebensignale werden gemeinsam betrachtet." },
          { title: "Wie stabil ist das Muster?", text: "Signalstärke, Überschneidung und Unsicherheit werden berücksichtigt." },
          { title: "Was zuerst ausprobieren?", text: "Empfehlungen werden in kleine, elternfreundliche Schritte übersetzt." }
        ]
      },
      it: {
        title: "Cosa chiarisce il report completo?",
        lead: "Lo screening mostra una direzione. Il report la trasforma in un modello comprensibile e adatto all'età.",
        items: [
          { title: "Cosa può esserci dietro le risposte?", text: "Interpreta insieme segnali principali e secondari." },
          { title: "Quanto è coerente il modello?", text: "Considera intensità, sovrapposizioni e incertezza." },
          { title: "Cosa provare per primo?", text: "Le indicazioni diventano piccoli passi per i genitori." }
        ]
      },
      es: {
        title: "¿Qué aclara el informe completo?",
        lead: "El cribado ya muestra una dirección. El informe la convierte en un patrón comprensible y ajustado a la edad.",
        items: [
          { title: "¿Qué puede haber detrás?", text: "Interpreta señales principales y secundarias juntas." },
          { title: "¿Qué tan consistente es?", text: "Considera intensidad, solapamiento e incertidumbre." },
          { title: "¿Qué probar primero?", text: "Las sugerencias se traducen en pasos pequeños para familias." }
        ]
      },
      zh: {
        title: "完整报告会进一步说明什么？",
        lead: "筛查已经显示方向。完整报告会把它整理成年龄适配、可理解的模式，而不仅是分数或标签。",
        items: [
          { title: "回答背后可能是什么？", text: "一起解读主要和次要信号，减少误解。" },
          { title: "模式有多一致？", text: "考虑信号强度、重叠和不确定性。" },
          { title: "可以先尝试什么？", text: "建议会转化为家长容易执行的小步骤。" }
        ]
      },
      ja: {
        title: "完全版レポートで何がわかりますか？",
        lead: "スクリーニングは方向性を示します。完全版では、点数やラベルだけでなく、年齢背景に合わせたわかりやすい傾向として整理します。",
        items: [
          { title: "回答の背景", text: "主なサインと二次的なサインを合わせて解釈します。" },
          { title: "一貫性", text: "強さ、重なり、不確実性も確認します。" },
          { title: "最初の一歩", text: "保護者が使いやすい小さな行動に落とし込みます。" }
        ]
      },
      ar: {
        title: "ماذا يوضح التقرير الكامل؟",
        lead: "الفحص الأولي يعطي اتجاها عاما. التقرير الكامل يحوله إلى نمط واضح ومناسب لعمر الطفل، وليس مجرد رقم أو تسمية.",
        items: [
          { title: "ما وراء الإجابات؟", text: "يفسر الإشارات الرئيسية والثانوية معا لتقليل سوء الفهم." },
          { title: "مدى ثبات النمط", text: "يراعي قوة الإشارة والتداخل ودرجة عدم اليقين." },
          { title: "ما الخطوة الأولى؟", text: "يحول النتيجة إلى خطوات صغيرة يمكن للوالدين استخدامها." }
        ]
      },
      pl: {
        title: "Co wyjaśnia pełny raport?",
        lead: "Screening pokazuje kierunek. Raport zamienia go w zrozumiały wzorzec dopasowany do wieku, nie tylko wynik lub etykietę.",
        items: [
          { title: "Co może stać za odpowiedziami?", text: "Łączy sygnały główne i wtórne, aby ograniczyć nieporozumienia." },
          { title: "Jak spójny jest wzorzec?", text: "Uwzględnia siłę sygnału, nakładanie się i niepewność." },
          { title: "Co spróbować najpierw?", text: "Wskazówki są rozpisane na małe kroki dla rodziców." }
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
      fr: {
        title: "Que clarifie le rapport complet ?",
        lead: "Le dépistage montre une direction. Le rapport la transforme en profil compréhensible et adapté à l'âge.",
        items: [
          { title: "Que peut-il y avoir derrière ?", text: "Il relie les signaux principaux et secondaires." },
          { title: "Le profil est-il cohérent ?", text: "Il tient compte de l'intensité, du recoupement et de l'incertitude." },
          { title: "Que tenter d'abord ?", text: "Les conseils sont formulés en petites étapes pour les parents." }
        ]
      }
    });
  }

  function getSummaryScienceCopy() {
    return getCustomerCopy({
      hu: {
        title: "Miért ad többet a teljes kiértékelés?",
        lead: "A válaszokból nem egyetlen pontszámot érdemes nézni. A teljes riport a jelzések erősségét, következetességét, átfedését és a gyermek korosztályát együtt értelmezi.",
        items: [
          { title: "Mintázat, nem címke", text: "Rendszerezi a viselkedési és érzelmi jelzéseket anélkül, hogy diagnózist mondana." },
          { title: "Korosztályi kontextus", text: "Az óvodás, kisiskolás és nagyobb gyermekek jelzéseit másként kell értelmezni." },
          { title: "Átfedések kezelése", text: "Láthatóvá teszi, ha több terület közel van egymáshoz." },
          { title: "Szülőbarát következő lépés", text: "A következtetést gyakorlatias, nyugodt nyelvre fordítja." }
        ]
      },
      en: {
        title: "Why does the full analysis add value?",
        lead: "The short summary only shows the strongest pattern. The full report compares signal strength, consistency, overlap, and age context.",
        items: [
          { title: "Pattern, not label", text: "It organizes behavioral and emotional signals without making a diagnosis." },
          { title: "Age context", text: "Preschool, early school age, and older children need different interpretation." },
          { title: "Overlap handling", text: "It highlights uncertainty between similar symptom areas." },
          { title: "Parent-friendly next step", text: "The report gives observation and support directions." }
        ]
      },
      de: {
        title: "Warum bringt die vollständige Analyse mehr?",
        lead: "Der Bericht vergleicht Signalstärke, Konsistenz, Überschneidungen und Alterskontext.",
        items: [
          { title: "Muster statt Etikett", text: "Ordnet Verhaltens- und emotionale Signale ohne Diagnose." },
          { title: "Alterskontext", text: "Verschiedene Altersgruppen brauchen unterschiedliche Einordnung." },
          { title: "Überschneidungen", text: "Ähnliche Signalbereiche und Unsicherheiten werden sichtbar." },
          { title: "Nächster Schritt", text: "Die Ergebnisse werden alltagsnah formuliert." }
        ]
      },
      it: {
        title: "Perché l'analisi completa aggiunge valore?",
        lead: "Il report confronta intensità, coerenza, sovrapposizioni e contesto d'età.",
        items: [
          { title: "Pattern, non etichetta", text: "Organizza segnali senza formulare diagnosi." },
          { title: "Contesto d'età", text: "Età diverse richiedono letture diverse." },
          { title: "Sovrapposizioni", text: "Mostra incertezze tra aree simili." },
          { title: "Passo successivo", text: "Traduce il risultato in indicazioni pratiche." }
        ]
      },
      es: {
        title: "¿Por qué aporta más valor el análisis completo?",
        lead: "El informe compara intensidad, consistencia, solapamientos y contexto de edad.",
        items: [
          { title: "Patrón, no etiqueta", text: "Organiza señales sin emitir diagnóstico." },
          { title: "Contexto de edad", text: "Las edades distintas requieren lecturas distintas." },
          { title: "Solapamientos", text: "Muestra incertidumbre entre áreas similares." },
          { title: "Siguiente paso", text: "Convierte el resultado en indicaciones prácticas." }
        ]
      },
      zh: {
        title: "完整分析为什么更有价值？",
        lead: "完整报告会比较信号强度、一致性、重叠情况和年龄背景。",
        items: [
          { title: "模式，不是标签", text: "整理行为和情绪信号，但不作诊断。" },
          { title: "年龄背景", text: "不同年龄阶段需要不同解释。" },
          { title: "处理重叠", text: "显示相似领域之间的不确定性。" },
          { title: "家长可用的下一步", text: "把结果转化为观察和支持方向。" }
        ]
      },
      ja: {
        title: "完全な分析にはどんな価値がありますか？",
        lead: "完全版では、サインの強さ、一貫性、重なり、年齢背景を合わせて確認します。",
        items: [
          { title: "ラベルではなく傾向", text: "診断ではなく、行動面と感情面のサインを整理します。" },
          { title: "年齢背景", text: "年齢段階によって解釈は変わります。" },
          { title: "重なりの扱い", text: "似た領域の不確実性を示します。" },
          { title: "保護者向けの次の一歩", text: "観察と支援の方向性をわかりやすく示します。" }
        ]
      },
      ar: {
        title: "لماذا يضيف التحليل الكامل قيمة أكبر؟",
        lead: "يقارن التقرير قوة الإشارة واتساقها وتداخلها وسياق عمر الطفل.",
        items: [
          { title: "نمط لا تسمية", text: "ينظم الإشارات السلوكية والعاطفية دون تشخيص." },
          { title: "سياق العمر", text: "تختلف القراءة حسب المرحلة العمرية." },
          { title: "التداخلات", text: "يوضح عدم اليقين بين المجالات المتشابهة." },
          { title: "خطوة تالية للوالدين", text: "يقدم اتجاهات للملاحظة والدعم." }
        ]
      },
      pl: {
        title: "Dlaczego pełna analiza daje więcej?",
        lead: "Raport porównuje siłę sygnału, spójność, nakładanie się i kontekst wieku.",
        items: [
          { title: "Wzorzec, nie etykieta", text: "Porządkuje sygnały bez stawiania diagnozy." },
          { title: "Kontekst wieku", text: "Różne etapy wieku wymagają różnej interpretacji." },
          { title: "Nakładanie się", text: "Pokazuje niepewność między podobnymi obszarami." },
          { title: "Kolejny krok", text: "Przekłada wynik na obserwację i wsparcie." }
        ]
      },
      pt: {
        title: "Por que a análise completa acrescenta valor?",
        lead: "O relatório compara força do sinal, consistência, sobreposição e contexto de idade.",
        items: [
          { title: "Padrão, não rótulo", text: "Organiza sinais sem fazer diagnóstico." },
          { title: "Contexto de idade", text: "Idades diferentes pedem leituras diferentes." },
          { title: "Sobreposições", text: "Mostra incertezas entre áreas semelhantes." },
          { title: "Próximo passo", text: "Transforma o resultado em observação e apoio." }
        ]
      },
      fr: {
        title: "Pourquoi l'analyse complète apporte-t-elle plus ?",
        lead: "Le rapport compare l'intensité, la cohérence, les recoupements et le contexte d'âge.",
        items: [
          { title: "Schéma, pas étiquette", text: "Organise les signaux sans poser de diagnostic." },
          { title: "Contexte d'âge", text: "Les âges différents demandent une lecture différente." },
          { title: "Recoupements", text: "Montre l'incertitude entre domaines similaires." },
          { title: "Prochaine étape", text: "Traduit le résultat en pistes d'observation." }
        ]
      }
    });
  }

  function getSummaryPayCopy(t) {
    return getCustomerCopy({
      hu: { title: "A teljes riport segít érthetően látni a mintázatot.", text: "Korosztályi kontextust, részletes területi bontást és gyakorlati következő lépéseket kapsz PDF-ben.", label: "Fizetés és teljes riport" },
      en: { title: "The full report helps make the pattern easier to understand.", text: "You get age-aware context, detailed area breakdowns, and practical next steps in a PDF report.", label: "Pay and get full report" },
      de: { title: "Der vollständige Bericht macht das Muster verständlicher.", text: "Du erhältst Alterskontext, Bereiche und praktische nächste Schritte als PDF.", label: "Bezahlen und Bericht erhalten" },
      it: { title: "Il report completo rende il pattern più comprensibile.", text: "Ricevi contesto per età, aree dettagliate e passi pratici in PDF.", label: "Paga e ricevi il report" },
      es: { title: "El informe completo ayuda a entender mejor el patrón.", text: "Recibirás contexto por edad, desglose detallado y próximos pasos prácticos en PDF.", label: "Pagar y recibir informe" },
      zh: { title: "完整报告帮助你更容易理解这个模式。", text: "你会获得年龄背景、详细领域拆解和实用下一步建议。", label: "支付并获取完整报告" },
      ja: { title: "完全版レポートで傾向をより理解しやすくします。", text: "年齢背景、詳しい領域別整理、実用的な次の一歩をPDFで受け取れます。", label: "支払い、完全版レポートを受け取る" },
      ar: { title: "يساعدك التقرير الكامل على فهم النمط بوضوح أكبر.", text: "ستحصل على سياق العمر وتفصيل المجالات وخطوات عملية تالية في ملف PDF.", label: "الدفع والحصول على التقرير الكامل" },
      pl: { title: "Pełny raport pomaga lepiej zrozumieć wzorzec.", text: "Otrzymasz kontekst wieku, szczegółowy podział obszarów i praktyczne kroki w PDF.", label: "Zapłać i odbierz raport" },
      pt: { title: "O relatório completo ajuda a entender melhor o padrão.", text: "Você recebe contexto de idade, áreas detalhadas e próximos passos práticos em PDF.", label: "Pagar e receber relatório" },
      fr: { title: "Le rapport complet aide à mieux comprendre le schéma.", text: "Vous recevez le contexte d'âge, des domaines détaillés et des étapes pratiques en PDF.", label: "Payer et recevoir le rapport" }
    }) || { title: "", text: "", label: t.pay };
  }

  function getCheckoutErrorMessage(error, t) {
    const message = String((error && error.message) || "");
    const code = String((error && error.code) || "");
    const copy = getCustomerCopy({
      hu: {
        invalidUrl: "A fizetési link nem érkezett meg megfelelően. Kérlek, próbáld újra, vagy jelezd nekünk, ha megismétlődik.",
        network: "Nem sikerült kapcsolódni a fizetési kiszolgálóhoz. Ellenőrizd a kapcsolatot, majd próbáld újra.",
        rate: "Túl sok próbálkozás történt rövid időn belül. Kérlek várj egy kicsit, majd próbáld újra.",
        fallback: "Nem sikerült elindítani a fizetést."
      },
      en: {
        invalidUrl: "The payment link was not returned correctly. Please try again, or contact us if this repeats.",
        network: "Could not connect to the checkout service. Please check your connection and try again.",
        rate: "Too many attempts were made in a short time. Please wait a moment and try again.",
        fallback: "Could not start checkout."
      },
      de: { invalidUrl: "Der Zahlungslink wurde nicht korrekt zurückgegeben. Bitte versuche es erneut.", network: "Die Verbindung zum Zahlungsdienst ist fehlgeschlagen. Bitte prüfe deine Verbindung.", rate: "Zu viele Versuche in kurzer Zeit. Bitte warte kurz und versuche es erneut.", fallback: "Checkout konnte nicht gestartet werden." },
      it: { invalidUrl: "Il link di pagamento non è stato restituito correttamente. Riprova.", network: "Impossibile connettersi al servizio di pagamento. Controlla la connessione.", rate: "Troppi tentativi in poco tempo. Attendi un momento e riprova.", fallback: "Impossibile avviare il pagamento." },
      es: { invalidUrl: "El enlace de pago no se recibió correctamente. Inténtalo de nuevo.", network: "No se pudo conectar con el servicio de pago. Revisa la conexión.", rate: "Demasiados intentos en poco tiempo. Espera un momento y vuelve a intentarlo.", fallback: "No se pudo iniciar el pago." },
      zh: { invalidUrl: "支付链接返回不正确。请重试。", network: "无法连接到支付服务。请检查网络后重试。", rate: "短时间内尝试次数过多。请稍等后重试。", fallback: "无法启动支付。" },
      ja: { invalidUrl: "支払いリンクが正しく返されませんでした。もう一度お試しください。", network: "決済サービスに接続できませんでした。接続を確認してください。", rate: "短時間に試行回数が多すぎます。少し待ってから再試行してください。", fallback: "決済を開始できませんでした。" },
      ar: { invalidUrl: "لم يتم إنشاء رابط الدفع بشكل صحيح. يرجى المحاولة مرة أخرى.", network: "تعذر الاتصال بخدمة الدفع. تحقق من الاتصال ثم حاول مرة أخرى.", rate: "تمت محاولات كثيرة خلال وقت قصير. يرجى الانتظار قليلا ثم المحاولة مرة أخرى.", fallback: "تعذر بدء الدفع." },
      pl: { invalidUrl: "Link płatności nie został zwrócony poprawnie. Spróbuj ponownie.", network: "Nie udało się połączyć z usługą płatności. Sprawdź połączenie.", rate: "Zbyt wiele prób w krótkim czasie. Poczekaj chwilę i spróbuj ponownie.", fallback: "Nie udało się rozpocząć płatności." },
      pt: { invalidUrl: "O link de pagamento não foi retornado corretamente. Tente novamente.", network: "Não foi possível conectar ao serviço de pagamento. Verifique a conexão.", rate: "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.", fallback: "Não foi possível iniciar o pagamento." },
      fr: { invalidUrl: "Le lien de paiement n'a pas été renvoyé correctement. Réessayez.", network: "Impossible de se connecter au service de paiement. Vérifiez la connexion.", rate: "Trop de tentatives en peu de temps. Attendez un moment puis réessayez.", fallback: "Impossible de démarrer le paiement." }
    });

    if (/not a valid url/i.test(message)) return copy.invalidUrl;
    if (/failed to fetch|network|load failed/i.test(message)) return copy.network;
    if (/too many requests/i.test(message)) return copy.rate;
    if (code === "CHECKOUT_NOT_READY" || /checkout is temporarily unavailable/i.test(message)) {
      return t.checkoutError || copy.fallback;
    }
    return message || t.checkoutError || copy.fallback;
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

    let consentReceipt = null;

    try {
      consentReceipt = await ensureLegalConsentForCurrentLanguage();
    } catch (error) {
      console.error("Checkout blocked because legal consent is missing:", error);
      alert(state.lang === "hu"
        ? "A fizetés előtt kérjük, hagyd jóvá a jogi és adatvédelmi tájékoztatót."
        : "Please review and approve the legal and privacy information before checkout.");
      return;
    }

    const payload = buildCheckoutPayload(consentReceipt);
    const selectedPackage = getSelectedClientPackage();
    saveDraft("checkout_started");

    trackSchemaEvent("nm_checkout_started", {
      funnel_step: "checkout_started",
      package_code: selectedPackage.code,
      value: selectedPackage.analyticsValue,
      currency: selectedPackage.currency
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
        const checkoutError = new Error(
          (data && data.error) || t.checkoutError || "Checkout error"
        );
        checkoutError.code = (data && data.code) || "";
        throw checkoutError;
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

      if (data.sessionId && data.sessionAccessToken && window.sessionStorage) {
        try {
          window.sessionStorage.setItem(
            `nm_session_access:${data.sessionId}`,
            data.sessionAccessToken
          );
          window.sessionStorage.setItem("nm_last_session_id", data.sessionId);
          window.sessionStorage.setItem("nm_last_session_access", data.sessionAccessToken);
        } catch (_error) {
          // sessionStorage can be blocked; the Stripe URL fragment still carries access.
        }
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      setStatus(getCheckoutErrorMessage(error, t));
      if (button) button.disabled = false;
    }
  }

  window.selectLang = async function (lang) {
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

    markLanguageConfirmed();
    hideModal(true);

    try {
      await ensureLegalConsentForCurrentLanguage();
    } catch (error) {
      console.error("Legal consent flow failed after language selection:", error);
      showModal(true);
    }
  };

  window.NM_SET_LANGUAGE = window.selectLang;

  async function init() {
    try {
      installPrivacyDefaults();
      installEngineBootGate();
      captureCampaignAttribution();
      setEngineBootStatus("design", "Felület előkészítése...", "loading");
      installFrontendDesign();
      installLandingPolishV2();
      buildLangButtons();
      bindLanguageSwitchers();
      ensureChildAgeField();
      state.lang = getLang();
      state.packageCode = getStoredPackageCode();
      installPackageSelectorStyles();
      scheduleLandingTextRescue(state.lang);

      setEngineBootStatus("banks", "Kérdésbankok ellenőrzése...", "loading");
      if (!validateRuntimeBanks()) {
        return;
      }

      setEngineBootStatus("questions", "Kérdéssor előkészítése...", "loading");
      state.triageQuestions = buildTriageQuestions();
      restoreDraft(readDraft());

      const nextBtn = document.getElementById("nextBtn");
      const backBtn = document.getElementById("backBtn");
      const paymentBtn = document.getElementById("paymentBtn");

      bindLanguageSwitchers();
      if (nextBtn) nextBtn.addEventListener("click", nextStep);
      if (backBtn) backBtn.addEventListener("click", prevStep);
      if (paymentBtn) paymentBtn.addEventListener("click", startCheckout);

      setEngineBootStatus("render", "Nyitóoldal frissítése...", "loading");
      applyLang(state.lang);
      await ensureLegalManager();

      if (!hasConfirmedLanguage()) {
        showModal(true);
      } else {
        try {
          await ensureLegalConsentForCurrentLanguage();
        } catch (error) {
          console.error("Stored legal consent is unavailable or expired:", error);
          showModal(true);
        }
      }

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
        dedupeKey: `landing:${state.lang}`
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
        dedupeKey: `questionnaire_loaded:${state.lang}`
      });

      finishEngineBootGate(650);
    } catch (error) {
      console.error("NeuroMap engine init failed:", error);
      state.lang = state.lang || "hu";
      scheduleLandingTextRescue(state.lang);
      failEngineBootGate("A NeuroMap felület betöltése nem sikerült. Frissítsd az oldalt.");
    }
  }

  window.NM_DEBUG_STATE = state;

  init();
})();

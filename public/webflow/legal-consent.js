(function () {
  "use strict";

  const LEGAL_UI_VERSION = "20260716-privacy-rights-v2";
  const RECEIPT_KEY = "nm_legal_receipt_v1";
  const ANALYTICS_KEY = "nm_analytics_consent_v1";
  const CONTENT_VERSION = "20260716-privacy-rights-v2";
  const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  const PRIVACY_RIGHTS_UI = {
    hu: {
      menu: "Adatvédelmi kérelmek",
      title: "Adatvédelmi jogok gyakorlása",
      intro: "Itt a vásárláshoz tartozó hitelesített munkamenettel nyújthatsz be kérelmet. A rendszer azonosítója helyettesíti az újabb személyes adatok bekérését.",
      unavailable: "Ebben a böngészőben nem található hitelesített vásárlási munkamenet. Írj az adatvédelmi kapcsolattartónak, és add meg a vásárláskor használt email címet.",
      type: "Kérelem típusa",
      details: "Kiegészítő információ",
      placeholder: "Helyesbítésnél írd le pontosan a kért módosítást. Más kérelemnél röviden megadhatod az okot.",
      submit: "Kérelem elküldése",
      close: "Bezárás",
      download: "Adatmásolat letöltése (JSON)",
      confirm: "Ez a kérelem leállíthatja a további elemzést, emailküldést vagy törölheti a kérdőív adatait. Biztosan folytatod?",
      submitted: "A kérelmet rögzítettük.",
      requestId: "Kérelemazonosító",
      status: "Állapot",
      due: "Válaszadási határidő",
      decision: "Intézkedés",
      correctionRequired: "Helyesbítéshez írd le a kért módosítást.",
      contact: "Adatvédelmi kapcsolat",
      types: { access: "Hozzáférési másolat", portability: "Adathordozhatósági másolat", erasure: "Törlési kérelem", restriction: "Adatkezelés korlátozása", rectification: "Helyesbítés", objection: "Tiltakozás", consent_withdrawal: "Hozzájárulás visszavonása" }
    },
    en: {
      menu: "Privacy requests",
      title: "Exercise your data protection rights",
      intro: "Submit a request through the authenticated purchase session. The session identifier avoids asking you for more personal data.",
      unavailable: "No authenticated purchase session is available in this browser. Contact the privacy address and include the email used for the purchase.",
      type: "Request type", details: "Additional information", placeholder: "For rectification, describe the exact correction. For other requests, you may briefly explain the reason.", submit: "Submit request", close: "Close", download: "Download data copy (JSON)", confirm: "This request may stop further analysis or email delivery, or erase questionnaire data. Continue?", submitted: "Your request has been recorded.", requestId: "Request ID", status: "Status", due: "Response deadline", decision: "Action", correctionRequired: "Describe the requested correction.", contact: "Privacy contact",
      types: { access: "Access copy", portability: "Data portability copy", erasure: "Erasure", restriction: "Restriction of processing", rectification: "Rectification", objection: "Objection", consent_withdrawal: "Withdraw consent" }
    },
    de: {
      menu: "Datenschutzanfragen", title: "Datenschutzrechte ausüben", intro: "Sende eine Anfrage über die authentifizierte Kaufsitzung. So müssen keine weiteren personenbezogenen Daten abgefragt werden.", unavailable: "In diesem Browser ist keine authentifizierte Kaufsitzung verfügbar. Kontaktiere die Datenschutzadresse und nenne die beim Kauf verwendete E-Mail-Adresse.", type: "Art der Anfrage", details: "Zusätzliche Angaben", placeholder: "Beschreibe bei einer Berichtigung die genaue Änderung. Bei anderen Anfragen kannst du den Grund kurz angeben.", submit: "Anfrage senden", close: "Schließen", download: "Datenkopie herunterladen (JSON)", confirm: "Diese Anfrage kann die weitere Analyse oder E-Mail-Zustellung stoppen oder Fragebogendaten löschen. Fortfahren?", submitted: "Die Anfrage wurde erfasst.", requestId: "Anfrage-ID", status: "Status", due: "Antwortfrist", decision: "Maßnahme", correctionRequired: "Beschreibe die gewünschte Berichtigung.", contact: "Datenschutzkontakt",
      types: { access: "Auskunftskopie", portability: "Datenübertragbarkeitskopie", erasure: "Löschung", restriction: "Einschränkung der Verarbeitung", rectification: "Berichtigung", objection: "Widerspruch", consent_withdrawal: "Einwilligung widerrufen" }
    },
    it: {
      menu: "Richieste privacy", title: "Esercita i tuoi diritti sulla protezione dei dati", intro: "Invia una richiesta tramite la sessione di acquisto autenticata, senza fornire altri dati personali.", unavailable: "In questo browser non è disponibile una sessione di acquisto autenticata. Contatta l'indirizzo privacy indicando l'email usata per l'acquisto.", type: "Tipo di richiesta", details: "Informazioni aggiuntive", placeholder: "Per la rettifica, descrivi la correzione esatta. Per le altre richieste puoi indicare brevemente il motivo.", submit: "Invia richiesta", close: "Chiudi", download: "Scarica copia dei dati (JSON)", confirm: "Questa richiesta può interrompere analisi o email future oppure cancellare i dati del questionario. Continuare?", submitted: "La richiesta è stata registrata.", requestId: "ID richiesta", status: "Stato", due: "Termine di risposta", decision: "Intervento", correctionRequired: "Descrivi la correzione richiesta.", contact: "Contatto privacy",
      types: { access: "Copia di accesso", portability: "Copia per portabilità", erasure: "Cancellazione", restriction: "Limitazione del trattamento", rectification: "Rettifica", objection: "Opposizione", consent_withdrawal: "Revoca del consenso" }
    },
    es: {
      menu: "Solicitudes de privacidad", title: "Ejercer tus derechos de protección de datos", intro: "Presenta una solicitud mediante la sesión de compra autenticada, sin aportar más datos personales.", unavailable: "No hay una sesión de compra autenticada en este navegador. Contacta con la dirección de privacidad e indica el email usado en la compra.", type: "Tipo de solicitud", details: "Información adicional", placeholder: "Para rectificación, describe el cambio exacto. En otras solicitudes puedes explicar brevemente el motivo.", submit: "Enviar solicitud", close: "Cerrar", download: "Descargar copia de datos (JSON)", confirm: "Esta solicitud puede detener futuros análisis o emails, o borrar los datos del cuestionario. ¿Continuar?", submitted: "La solicitud ha quedado registrada.", requestId: "ID de solicitud", status: "Estado", due: "Plazo de respuesta", decision: "Actuación", correctionRequired: "Describe la rectificación solicitada.", contact: "Contacto de privacidad",
      types: { access: "Copia de acceso", portability: "Copia de portabilidad", erasure: "Supresión", restriction: "Limitación del tratamiento", rectification: "Rectificación", objection: "Oposición", consent_withdrawal: "Retirar el consentimiento" }
    },
    zh: {
      menu: "隐私请求", title: "行使数据保护权利", intro: "通过已验证的购买会话提交请求，无需再次提供更多个人信息。", unavailable: "此浏览器中没有已验证的购买会话。请联系隐私邮箱，并注明购买时使用的电子邮箱。", type: "请求类型", details: "补充信息", placeholder: "如需更正，请准确说明更正内容；其他请求可简要说明原因。", submit: "提交请求", close: "关闭", download: "下载数据副本（JSON）", confirm: "此请求可能停止后续分析或邮件发送，或删除问卷数据。是否继续？", submitted: "请求已记录。", requestId: "请求编号", status: "状态", due: "答复期限", decision: "处理措施", correctionRequired: "请说明需要更正的内容。", contact: "隐私联系方式",
      types: { access: "访问副本", portability: "数据可携副本", erasure: "删除", restriction: "限制处理", rectification: "更正", objection: "反对处理", consent_withdrawal: "撤回同意" }
    },
    ja: {
      menu: "プライバシー申請", title: "データ保護に関する権利の行使", intro: "認証済みの購入セッションから申請できます。追加の個人情報を再入力する必要はありません。", unavailable: "このブラウザーには認証済みの購入セッションがありません。購入時のメールアドレスを添えて、プライバシー窓口へ連絡してください。", type: "申請の種類", details: "補足情報", placeholder: "訂正の場合は、希望する変更を正確に記載してください。その他は理由を簡潔に記載できます。", submit: "申請を送信", close: "閉じる", download: "データのコピーをダウンロード（JSON）", confirm: "この申請により、今後の分析やメール送信が停止したり、質問票データが削除されたりする場合があります。続行しますか？", submitted: "申請を受け付けました。", requestId: "申請ID", status: "状態", due: "回答期限", decision: "対応内容", correctionRequired: "希望する訂正内容を記載してください。", contact: "プライバシー窓口",
      types: { access: "アクセス用コピー", portability: "データポータビリティ用コピー", erasure: "消去", restriction: "処理の制限", rectification: "訂正", objection: "異議申立て", consent_withdrawal: "同意の撤回" }
    },
    ar: {
      menu: "طلبات الخصوصية", title: "ممارسة حقوق حماية البيانات", intro: "يمكنك تقديم الطلب عبر جلسة الشراء الموثقة دون إدخال بيانات شخصية إضافية.", unavailable: "لا توجد جلسة شراء موثقة في هذا المتصفح. تواصل مع عنوان الخصوصية واذكر البريد الإلكتروني المستخدم عند الشراء.", type: "نوع الطلب", details: "معلومات إضافية", placeholder: "عند طلب التصحيح، صف التعديل المطلوب بدقة. ويمكنك ذكر سبب مختصر للطلبات الأخرى.", submit: "إرسال الطلب", close: "إغلاق", download: "تنزيل نسخة البيانات (JSON)", confirm: "قد يؤدي هذا الطلب إلى إيقاف التحليل أو رسائل البريد اللاحقة أو حذف بيانات الاستبيان. هل تريد المتابعة؟", submitted: "تم تسجيل الطلب.", requestId: "معرّف الطلب", status: "الحالة", due: "موعد الرد", decision: "الإجراء", correctionRequired: "صف التصحيح المطلوب.", contact: "جهة اتصال الخصوصية",
      types: { access: "نسخة حق الوصول", portability: "نسخة قابلية نقل البيانات", erasure: "المحو", restriction: "تقييد المعالجة", rectification: "التصحيح", objection: "الاعتراض", consent_withdrawal: "سحب الموافقة" }
    },
    pl: {
      menu: "Wnioski dotyczące prywatności", title: "Skorzystaj z praw ochrony danych", intro: "Złóż wniosek przez uwierzytelnioną sesję zakupu, bez podawania kolejnych danych osobowych.", unavailable: "W tej przeglądarce nie ma uwierzytelnionej sesji zakupu. Skontaktuj się z adresem ds. prywatności i podaj email użyty przy zakupie.", type: "Rodzaj wniosku", details: "Dodatkowe informacje", placeholder: "Przy sprostowaniu dokładnie opisz zmianę. Przy innych wnioskach możesz krótko podać powód.", submit: "Wyślij wniosek", close: "Zamknij", download: "Pobierz kopię danych (JSON)", confirm: "Ten wniosek może zatrzymać dalszą analizę lub wysyłkę emaili albo usunąć dane kwestionariusza. Kontynuować?", submitted: "Wniosek został zarejestrowany.", requestId: "ID wniosku", status: "Status", due: "Termin odpowiedzi", decision: "Działanie", correctionRequired: "Opisz żądane sprostowanie.", contact: "Kontakt ds. prywatności",
      types: { access: "Kopia dostępu", portability: "Kopia do przenoszenia", erasure: "Usunięcie", restriction: "Ograniczenie przetwarzania", rectification: "Sprostowanie", objection: "Sprzeciw", consent_withdrawal: "Wycofanie zgody" }
    },
    pt: {
      menu: "Pedidos de privacidade", title: "Exercer direitos de proteção de dados", intro: "Envia um pedido através da sessão de compra autenticada, sem fornecer mais dados pessoais.", unavailable: "Não existe uma sessão de compra autenticada neste navegador. Contacta o endereço de privacidade e indica o email usado na compra.", type: "Tipo de pedido", details: "Informação adicional", placeholder: "Para retificação, descreve a correção exata. Nos outros pedidos, podes indicar brevemente o motivo.", submit: "Enviar pedido", close: "Fechar", download: "Descarregar cópia dos dados (JSON)", confirm: "Este pedido pode interromper futuras análises ou emails, ou apagar os dados do questionário. Continuar?", submitted: "O pedido foi registado.", requestId: "ID do pedido", status: "Estado", due: "Prazo de resposta", decision: "Medida", correctionRequired: "Descreve a retificação solicitada.", contact: "Contacto de privacidade",
      types: { access: "Cópia de acesso", portability: "Cópia de portabilidade", erasure: "Apagamento", restriction: "Limitação do tratamento", rectification: "Retificação", objection: "Oposição", consent_withdrawal: "Retirar consentimento" }
    },
    fr: {
      menu: "Demandes de confidentialité", title: "Exercer vos droits de protection des données", intro: "Envoyez une demande via la session d'achat authentifiée, sans fournir de nouvelles données personnelles.", unavailable: "Aucune session d'achat authentifiée n'est disponible dans ce navigateur. Contactez l'adresse de confidentialité et indiquez l'email utilisé lors de l'achat.", type: "Type de demande", details: "Informations complémentaires", placeholder: "Pour une rectification, décrivez précisément la correction. Pour les autres demandes, vous pouvez indiquer brièvement le motif.", submit: "Envoyer la demande", close: "Fermer", download: "Télécharger la copie des données (JSON)", confirm: "Cette demande peut arrêter les analyses ou emails futurs, ou effacer les données du questionnaire. Continuer ?", submitted: "La demande a été enregistrée.", requestId: "ID de demande", status: "Statut", due: "Délai de réponse", decision: "Mesure", correctionRequired: "Décrivez la rectification demandée.", contact: "Contact confidentialité",
      types: { access: "Copie d'accès", portability: "Copie de portabilité", erasure: "Effacement", restriction: "Limitation du traitement", rectification: "Rectification", objection: "Opposition", consent_withdrawal: "Retrait du consentement" }
    }
  };

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
      .nm-legal-field { display: grid; gap: 7px; margin: 0 0 14px; color: #263d52; font-size: 13px; font-weight: 800; }
      .nm-legal-field select, .nm-legal-field textarea { width: 100%; border: 1px solid #b9cddd; border-radius: 6px; padding: 10px 11px; background: #fff; color: #102033; font: 500 14px/1.5 Inter, system-ui, sans-serif; }
      .nm-legal-field textarea { min-height: 96px; resize: vertical; }
      .nm-legal-result { margin-top: 14px; padding: 13px; border: 1px solid #b8dcef; border-radius: 6px; background: #f2fbff; color: #263d52; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
      .nm-legal-result strong { color: #102033; }
      .nm-legal-contact { padding: 13px; border: 1px solid #dbe8f0; border-radius: 6px; background: #f5f9fc; color: #334a60; font-size: 14px; line-height: 1.65; overflow-wrap: anywhere; }
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

  function privacyRightsUi(lang) {
    return PRIVACY_RIGHTS_UI[normalizeLang(lang)] || PRIVACY_RIGHTS_UI.en;
  }

  function readSessionCredentials() {
    try {
      const sessionId = String(sessionStorage.getItem("nm_last_session_id") || "").trim();
      const token = String(
        (sessionId && sessionStorage.getItem(`nm_session_access:${sessionId}`)) ||
        sessionStorage.getItem("nm_last_session_access") ||
        ""
      ).trim();
      return sessionId && token ? { sessionId, token } : null;
    } catch (_error) {
      return null;
    }
  }

  function storePrivacyRequestReceipt(request, requestToken) {
    if (!request || !request.id || !requestToken) return;
    try {
      sessionStorage.setItem(`nm_privacy_request:${request.id}`, JSON.stringify({
        id: request.id,
        token: requestToken,
        status: request.status || "",
        storedAt: new Date().toISOString()
      }));
    } catch (_error) {
      // The request remains valid when browser storage is unavailable.
    }
  }

  function readLatestPrivacyRequestReceipt() {
    try {
      let latest = null;
      for (let index = 0; index < sessionStorage.length; index += 1) {
        const key = sessionStorage.key(index);
        if (!key || !key.startsWith("nm_privacy_request:")) continue;
        const parsed = JSON.parse(sessionStorage.getItem(key) || "null");
        if (!parsed?.id || !parsed?.token) continue;
        if (!latest || String(parsed.storedAt || "") > String(latest.storedAt || "")) {
          latest = parsed;
        }
      }
      return latest;
    } catch (_error) {
      return null;
    }
  }

  function downloadJsonFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function formatRequestDate(value, lang) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat(normalizeLang(lang), {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
    } catch (_error) {
      return date.toISOString();
    }
  }

  async function showPrivacyRights(lang) {
    const language = normalizeLang(lang);
    await ensureContent();
    const config = await getConfig();
    const ui = privacyRightsUi(language);
    const credentials = readSessionCredentials();
    const privacyEmail = String(config.controller?.privacyEmail || "privacy@neuromapkids.com");

    installStyles();
    removeModal();

    const overlay = document.createElement("div");
    overlay.id = "nmLegalOverlay";
    overlay.innerHTML = `
      <div class="nm-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="nmLegalTitle">
        <header class="nm-legal-head">
          <div class="nm-legal-headline"><h2 id="nmLegalTitle">${escapeHtml(ui.title)}</h2></div>
          <div class="nm-legal-meta">${legalMeta(config, language)}</div>
        </header>
        <div class="nm-legal-scroll" tabindex="0">
          <section class="nm-legal-section">
            <p>${escapeHtml(ui.intro)}</p>
          </section>
          ${credentials ? `
            <form id="nmPrivacyRightsForm">
              <label class="nm-legal-field">
                <span>${escapeHtml(ui.type)}</span>
                <select name="requestType">
                  ${Object.entries(ui.types).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}
                </select>
              </label>
              <label class="nm-legal-field">
                <span>${escapeHtml(ui.details)}</span>
                <textarea name="details" maxlength="4000" placeholder="${escapeHtml(ui.placeholder)}"></textarea>
              </label>
              <div class="nm-legal-error" role="alert"></div>
              <div class="nm-legal-result" hidden aria-live="polite"></div>
            </form>
          ` : `
            <div class="nm-legal-contact">
              ${escapeHtml(ui.unavailable)}<br>
              <strong>${escapeHtml(ui.contact)}:</strong>
              <a href="mailto:${escapeHtml(privacyEmail)}">${escapeHtml(privacyEmail)}</a>
            </div>
          `}
        </div>
        <footer class="nm-legal-foot">
          <div class="nm-legal-actions">
            <button class="nm-legal-button" type="button" data-action="close">${escapeHtml(ui.close)}</button>
            ${credentials ? `<button class="nm-legal-button primary" type="button" data-action="submit">${escapeHtml(ui.submit)}</button>` : ""}
          </div>
        </footer>
      </div>`;
    document.body.appendChild(overlay);
    document.documentElement.classList.add("nm-legal-open");
    document.body.classList.add("nm-legal-open");

    overlay.querySelector("[data-action='close']").addEventListener("click", removeModal);
    overlay.querySelector(".nm-legal-scroll").focus();
    if (!credentials) return;

    const form = overlay.querySelector("#nmPrivacyRightsForm");
    const submitButton = overlay.querySelector("[data-action='submit']");
    const errorBox = overlay.querySelector(".nm-legal-error");
    const resultBox = overlay.querySelector(".nm-legal-result");
    const destructiveTypes = new Set([
      "erasure",
      "restriction",
      "objection",
      "consent_withdrawal"
    ]);

    const previousReceipt = readLatestPrivacyRequestReceipt();
    if (previousReceipt) {
      try {
        const previousResponse = await fetchJson(
          `/legal/privacy-requests/${encodeURIComponent(previousReceipt.id)}`,
          {
            headers: {
              "x-privacy-request-token": previousReceipt.token
            }
          }
        );
        const previousRequest = previousResponse.request || {};
        resultBox.innerHTML = `
          <strong>${escapeHtml(ui.requestId)}: ${escapeHtml(previousRequest.id || previousReceipt.id)}</strong><br>
          ${escapeHtml(ui.status)}: ${escapeHtml(previousRequest.status || "-")}<br>
          ${escapeHtml(ui.due)}: ${escapeHtml(formatRequestDate(previousRequest.dueAt, language))}<br>
          ${escapeHtml(ui.decision)}: ${escapeHtml(previousRequest.decisionReason || "-")}`;
        resultBox.hidden = false;
      } catch (_error) {
        // A stale browser receipt must not block a new verified request.
      }
    }

    submitButton.addEventListener("click", async () => {
      const requestType = form.elements.requestType.value;
      const details = String(form.elements.details.value || "").trim();
      if (requestType === "rectification" && !details) {
        errorBox.textContent = ui.correctionRequired;
        form.elements.details.focus();
        return;
      }
      if (destructiveTypes.has(requestType) && !window.confirm(ui.confirm)) return;

      errorBox.textContent = "";
      resultBox.hidden = true;
      submitButton.disabled = true;
      try {
        const response = await fetchJson("/legal/privacy-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": credentials.token
          },
          body: JSON.stringify({
            sessionId: credentials.sessionId,
            requestType,
            language,
            details: requestType === "rectification"
              ? { correction: details }
              : { reason: details }
          })
        });
        const request = response.request || {};
        storePrivacyRequestReceipt(request, response.requestToken);
        resultBox.innerHTML = `
          <strong>${escapeHtml(ui.submitted)}</strong><br>
          ${escapeHtml(ui.requestId)}: ${escapeHtml(request.id || "-")}<br>
          ${escapeHtml(ui.status)}: ${escapeHtml(request.status || "-")}<br>
          ${escapeHtml(ui.due)}: ${escapeHtml(formatRequestDate(request.dueAt, language))}<br>
          ${escapeHtml(ui.decision)}: ${escapeHtml(request.decisionReason || "-")}`;
        if (response.exportData) {
          const downloadButton = document.createElement("button");
          downloadButton.type = "button";
          downloadButton.className = "nm-legal-button";
          downloadButton.style.marginTop = "12px";
          downloadButton.textContent = ui.download;
          downloadButton.addEventListener("click", () => {
            downloadJsonFile(
              response.exportData,
              `neuromap-${requestType}-${request.id || "data"}.json`
            );
          });
          resultBox.appendChild(document.createElement("br"));
          resultBox.appendChild(downloadButton);
        }
        resultBox.hidden = false;
        form.elements.requestType.disabled = true;
        form.elements.details.disabled = true;
      } catch (error) {
        errorBox.textContent = error.message || "The request could not be submitted.";
        submitButton.disabled = false;
      }
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
    const rightsUi = privacyRightsUi(lang);
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
        <button type="button" data-kind="rights">${escapeHtml(rightsUi.menu)}</button>
        <button type="button" data-kind="withdraw">${escapeHtml(content.ui.withdraw || "Withdraw consent")}</button>`;
      document.body.appendChild(menu);
      menu.addEventListener("click", async (event) => {
        const target = event.target.closest("button[data-kind]");
        if (!target) return;
        menu.remove();
        if (target.dataset.kind === "withdraw") {
          try { await withdraw(lang); } catch (error) { window.alert(error.message); }
        } else if (target.dataset.kind === "rights") {
          try { await showPrivacyRights(lang); } catch (error) { window.alert(error.message); }
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
    openPrivacyRights: (lang) => showPrivacyRights(normalizeLang(lang)),
    withdraw: (lang) => withdraw(normalizeLang(lang)),
    installLauncher: (lang) => installLauncher(normalizeLang(lang))
  });

  applyAnalyticsPreference(readAnalyticsPreference(), readStoredLanguage());
})();

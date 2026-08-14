(function () {
  "use strict";

  const LEGAL_UI_VERSION = "20260814-mobile-scroll-v2";
  const RECEIPT_KEY = "nm_legal_receipt_v1";
  const ANALYTICS_KEY = "nm_analytics_consent_v1";
  const CONTENT_VERSION = "20260726-verified-rights-v3";
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

  const READ_GATE_UI = {
    hu: { prompt: "Görgess a dokumentum végére az elfogadáshoz.", done: "A dokumentum végére értél. Most megadhatod a szükséges nyilatkozatokat." },
    en: { prompt: "Scroll to the end of the document before accepting.", done: "You reached the end. You can now provide the required acknowledgements." },
    de: { prompt: "Scrolle bis zum Ende des Dokuments, bevor du zustimmst.", done: "Du hast das Ende erreicht. Jetzt kannst du die erforderlichen Bestätigungen abgeben." },
    it: { prompt: "Scorri fino alla fine del documento prima di accettare.", done: "Hai raggiunto la fine. Ora puoi fornire le conferme richieste." },
    es: { prompt: "Desplázate hasta el final del documento antes de aceptar.", done: "Has llegado al final. Ya puedes marcar las confirmaciones obligatorias." },
    zh: { prompt: "接受前，请滚动阅读至文档末尾。", done: "你已阅读至末尾，现在可以作出必需的确认。" },
    ja: { prompt: "同意する前に、文書の最後までスクロールしてください。", done: "文書の最後まで到達しました。必要な確認を行えます。" },
    ar: { prompt: "مرّر حتى نهاية المستند قبل الموافقة.", done: "وصلت إلى نهاية المستند. يمكنك الآن تقديم الإقرارات المطلوبة." },
    pl: { prompt: "Przewiń dokument do końca przed zaakceptowaniem.", done: "Dokument został przewinięty do końca. Możesz teraz zaznaczyć wymagane oświadczenia." },
    pt: { prompt: "Desloca-te até ao fim do documento antes de aceitar.", done: "Chegaste ao fim. Já podes prestar as confirmações obrigatórias." },
    fr: { prompt: "Faites défiler le document jusqu’à la fin avant d’accepter.", done: "Vous avez atteint la fin. Vous pouvez maintenant donner les confirmations requises." }
  };

  const PRIVACY_VERIFICATION_UI = {
    hu: { sent: "Ellenőrzőkódot küldtünk a vásárláskor használt email címre. A kérelem csak sikeres ellenőrzés után hajtható végre.", code: "Hatjegyű ellenőrzőkód", verify: "Kód ellenőrzése", verifying: "Ellenőrzés...", invalid: "Adj meg egy hatjegyű ellenőrzőkódot.", failed: "A kód ellenőrzése nem sikerült.", verified: "Az email címet sikeresen ellenőriztük.", expires: "A kód 15 percig érvényes.", statuses: { verification_pending: "Email-ellenőrzésre vár", processing: "Feldolgozás alatt", completed: "Teljesítve", action_required: "További intézkedés szükséges", rejected: "Elutasítva", failed: "Sikertelen", closed: "Lezárva" } },
    en: { sent: "A verification code was sent to the email used for the purchase. The request is carried out only after successful verification.", code: "Six-digit verification code", verify: "Verify code", verifying: "Verifying...", invalid: "Enter the six-digit verification code.", failed: "The code could not be verified.", verified: "The email address was verified successfully.", expires: "The code is valid for 15 minutes.", statuses: { verification_pending: "Awaiting email verification", processing: "Processing", completed: "Completed", action_required: "Further action required", rejected: "Rejected", failed: "Failed", closed: "Closed" } },
    de: { sent: "Ein Bestätigungscode wurde an die beim Kauf verwendete E-Mail-Adresse gesendet. Die Anfrage wird erst nach erfolgreicher Prüfung ausgeführt.", code: "Sechsstelliger Bestätigungscode", verify: "Code prüfen", verifying: "Prüfung...", invalid: "Gib den sechsstelligen Bestätigungscode ein.", failed: "Der Code konnte nicht bestätigt werden.", verified: "Die E-Mail-Adresse wurde erfolgreich bestätigt.", expires: "Der Code ist 15 Minuten gültig.", statuses: { verification_pending: "E-Mail-Bestätigung ausstehend", processing: "In Bearbeitung", completed: "Erledigt", action_required: "Weitere Maßnahme erforderlich", rejected: "Abgelehnt", failed: "Fehlgeschlagen", closed: "Geschlossen" } },
    it: { sent: "Abbiamo inviato un codice all'email usata per l'acquisto. La richiesta viene eseguita solo dopo la verifica.", code: "Codice di verifica a sei cifre", verify: "Verifica codice", verifying: "Verifica...", invalid: "Inserisci il codice di verifica a sei cifre.", failed: "Non è stato possibile verificare il codice.", verified: "L'indirizzo email è stato verificato.", expires: "Il codice è valido per 15 minuti.", statuses: { verification_pending: "In attesa di verifica email", processing: "In elaborazione", completed: "Completata", action_required: "È necessaria un'altra azione", rejected: "Respinta", failed: "Non riuscita", closed: "Chiusa" } },
    es: { sent: "Hemos enviado un código al correo usado en la compra. La solicitud solo se ejecuta tras verificarlo correctamente.", code: "Código de verificación de seis dígitos", verify: "Verificar código", verifying: "Verificando...", invalid: "Introduce el código de verificación de seis dígitos.", failed: "No se pudo verificar el código.", verified: "El correo se verificó correctamente.", expires: "El código es válido durante 15 minutos.", statuses: { verification_pending: "Pendiente de verificación del correo", processing: "En tramitación", completed: "Completada", action_required: "Se requiere otra actuación", rejected: "Rechazada", failed: "Fallida", closed: "Cerrada" } },
    zh: { sent: "验证码已发送至购买时使用的邮箱。请求仅在验证成功后执行。", code: "六位验证码", verify: "验证代码", verifying: "正在验证…", invalid: "请输入六位验证码。", failed: "验证码验证失败。", verified: "邮箱验证成功。", expires: "验证码有效期为15分钟。", statuses: { verification_pending: "等待邮箱验证", processing: "处理中", completed: "已完成", action_required: "需要进一步处理", rejected: "已拒绝", failed: "失败", closed: "已关闭" } },
    ja: { sent: "購入時のメールアドレスへ確認コードを送信しました。申請は確認成功後にのみ実行されます。", code: "6桁の確認コード", verify: "コードを確認", verifying: "確認中…", invalid: "6桁の確認コードを入力してください。", failed: "コードを確認できませんでした。", verified: "メールアドレスを確認しました。", expires: "コードは15分間有効です。", statuses: { verification_pending: "メール確認待ち", processing: "処理中", completed: "完了", action_required: "追加対応が必要", rejected: "却下", failed: "失敗", closed: "終了" } },
    ar: { sent: "أرسلنا رمز تحقق إلى البريد المستخدم عند الشراء. لا يُنفّذ الطلب إلا بعد نجاح التحقق.", code: "رمز التحقق المكوّن من ستة أرقام", verify: "تحقق من الرمز", verifying: "جارٍ التحقق...", invalid: "أدخل رمز التحقق المكوّن من ستة أرقام.", failed: "تعذر التحقق من الرمز.", verified: "تم التحقق من البريد الإلكتروني بنجاح.", expires: "الرمز صالح لمدة 15 دقيقة.", statuses: { verification_pending: "بانتظار التحقق من البريد", processing: "قيد المعالجة", completed: "مكتمل", action_required: "يلزم إجراء إضافي", rejected: "مرفوض", failed: "فشل", closed: "مغلق" } },
    pl: { sent: "Kod weryfikacyjny wysłano na adres email użyty przy zakupie. Wniosek zostanie wykonany dopiero po weryfikacji.", code: "Sześciocyfrowy kod weryfikacyjny", verify: "Zweryfikuj kod", verifying: "Weryfikacja...", invalid: "Wpisz sześciocyfrowy kod weryfikacyjny.", failed: "Nie udało się zweryfikować kodu.", verified: "Adres email został zweryfikowany.", expires: "Kod jest ważny przez 15 minut.", statuses: { verification_pending: "Oczekuje na weryfikację email", processing: "W realizacji", completed: "Zrealizowany", action_required: "Wymagane dalsze działanie", rejected: "Odrzucony", failed: "Nieudany", closed: "Zamknięty" } },
    pt: { sent: "Enviámos um código para o email usado na compra. O pedido só é executado após a verificação.", code: "Código de verificação de seis dígitos", verify: "Verificar código", verifying: "A verificar...", invalid: "Introduz o código de verificação de seis dígitos.", failed: "Não foi possível verificar o código.", verified: "O email foi verificado com sucesso.", expires: "O código é válido durante 15 minutos.", statuses: { verification_pending: "A aguardar verificação do email", processing: "Em tratamento", completed: "Concluído", action_required: "É necessária outra ação", rejected: "Recusado", failed: "Falhou", closed: "Encerrado" } },
    fr: { sent: "Un code a été envoyé à l'adresse email utilisée lors de l'achat. La demande n'est exécutée qu'après vérification.", code: "Code de vérification à six chiffres", verify: "Vérifier le code", verifying: "Vérification...", invalid: "Saisissez le code de vérification à six chiffres.", failed: "Le code n'a pas pu être vérifié.", verified: "L'adresse email a été vérifiée.", expires: "Le code est valable 15 minutes.", statuses: { verification_pending: "En attente de vérification de l'email", processing: "En cours", completed: "Terminée", action_required: "Une action supplémentaire est requise", rejected: "Refusée", failed: "Échec", closed: "Clôturée" } }
  };

  let activeFlow = null;
  let legalConfig = null;
  let currentReceipt = null;
  let restoreFocusTarget = null;
  let modalKeydownCleanup = null;

  const CANCEL_LABELS = Object.freeze({
    hu: "Mégse",
    en: "Cancel",
    de: "Abbrechen",
    it: "Annulla",
    es: "Cancelar",
    zh: "取消",
    ja: "キャンセル",
    ar: "إلغاء",
    pl: "Anuluj",
    pt: "Cancelar",
    fr: "Annuler"
  });

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

  function removeModal(shouldRestoreFocus = true) {
    const overlay = document.getElementById("nmLegalOverlay");
    if (modalKeydownCleanup) {
      modalKeydownCleanup();
      modalKeydownCleanup = null;
    }
    if (overlay) overlay.remove();
    document.documentElement.classList.remove("nm-legal-open");
    document.body.classList.remove("nm-legal-open");
    if (shouldRestoreFocus && overlay && restoreFocusTarget && typeof restoreFocusTarget.focus === "function") {
      const target = restoreFocusTarget;
      requestAnimationFrame(() => {
        if (document.contains(target)) target.focus();
      });
    }
    if (shouldRestoreFocus) restoreFocusTarget = null;
  }

  function consentCancellation() {
    const error = new Error("The consent flow was cancelled.");
    error.code = "NM_LEGAL_CANCELLED";
    return error;
  }

  function activateModal(overlay, onCancel) {
    const current = document.activeElement;
    if (!restoreFocusTarget) {
      restoreFocusTarget = current && current !== document.body ? current : null;
    }

    const keydown = (event) => {
      if (event.key === "Escape" && typeof onCancel === "function") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(overlay.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
      )).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    overlay.addEventListener("keydown", keydown);
    modalKeydownCleanup = () => overlay.removeEventListener("keydown", keydown);
    requestAnimationFrame(() => {
      const target = overlay.querySelector("[data-autofocus], input, button, select, textarea, [tabindex='0']");
      if (target && typeof target.focus === "function") target.focus();
    });
  }

  function installStyles() {
    if (document.getElementById("nm-legal-consent-styles")) return;
    const style = document.createElement("style");
    style.id = "nm-legal-consent-styles";
    style.textContent = `
      html.nm-legal-open, body.nm-legal-open { overflow: hidden !important; overscroll-behavior: none; }
      #nmLegalOverlay { position: fixed; inset: 0; width: 100%; height: 100vh; height: 100dvh; z-index: 2147483646; display: flex; align-items: center; justify-content: center; box-sizing: border-box; overflow: hidden; padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); background: rgba(15, 29, 45, .76); font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #102033; }
      .nm-legal-dialog { width: min(920px, 100%); height: min(860px, calc(100vh - 32px)); height: min(860px, calc(100dvh - 32px)); min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: #fff; border: 1px solid #cfe3ef; border-radius: 8px; box-shadow: 0 24px 70px rgba(5, 25, 45, .28); }
      .nm-legal-head { flex: 0 0 auto; padding: 20px 22px 16px; border-bottom: 1px solid #dbe8f0; background: #f3f9fc; }
      .nm-legal-headline { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .nm-legal-head h2 { margin: 0; font-size: 24px; line-height: 1.25; letter-spacing: 0; }
      .nm-legal-step { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; background: #dff3fb; color: #0877a7; font-size: 12px; font-weight: 800; }
      .nm-legal-meta { margin-top: 10px; font-size: 12px; line-height: 1.55; color: #52677d; overflow-wrap: anywhere; }
      .nm-legal-scroll { flex: 1 1 44%; min-height: 112px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch; scrollbar-gutter: stable; padding: 20px 22px 28px; scroll-behavior: smooth; }
      .nm-legal-section { margin: 0 0 18px; padding-bottom: 16px; border-bottom: 1px solid #e5edf3; }
      .nm-legal-section:last-child { border-bottom: 0; }
      .nm-legal-section h3 { margin: 0 0 7px; font-size: 17px; line-height: 1.35; letter-spacing: 0; }
      .nm-legal-section p { margin: 0; color: #334a60; font-size: 14px; line-height: 1.7; }
      .nm-legal-foot { flex: 0 1 auto; min-height: 0; max-height: 56%; display: flex; flex-direction: column; overflow: hidden; padding: 16px 22px max(20px, env(safe-area-inset-bottom)); border-top: 1px solid #dbe8f0; background: #fff; }
      .nm-legal-form-scroll { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch; scrollbar-gutter: stable; padding-right: 4px; }
      .nm-legal-read { margin: 0 0 12px; color: #9b4d00; font-size: 13px; font-weight: 750; }
      .nm-legal-read-gate { margin: 0 0 12px; padding: 10px 12px; border: 1px solid #f3c38d; border-radius: 6px; background: #fff7ed; color: #8b4513; font-size: 13px; font-weight: 750; line-height: 1.45; }
      .nm-legal-read-gate.done { border-color: #9bd7b5; background: #eefbf3; color: #16733d; }
      .nm-legal-actor { margin: 0 0 12px; padding: 12px; background: #f5f9fc; border: 1px solid #dbe8f0; border-radius: 6px; }
      .nm-legal-actor strong { display: block; margin-bottom: 8px; font-size: 14px; }
      .nm-legal-options { display: flex; flex-wrap: wrap; gap: 9px 16px; }
      .nm-legal-check { display: flex; align-items: flex-start; gap: 9px; margin: 9px 0; color: #263d52; font-size: 13px; line-height: 1.45; cursor: pointer; }
      .nm-legal-check input { width: 18px; height: 18px; flex: 0 0 18px; margin: 1px 0 0; accent-color: #0799d2; }
      .nm-legal-optional { margin-top: 12px; padding: 12px; border: 1px solid #b8dcef; border-radius: 6px; background: #f2fbff; }
      .nm-legal-actions { flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5edf3; background: #fff; }
      .nm-legal-button { min-height: 44px; padding: 10px 17px; border: 1px solid #b9cddd; border-radius: 6px; background: #edf5fa; color: #102033; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
      .nm-legal-button.primary { border-color: #0799d2; background: #0799d2; color: #fff; }
      .nm-legal-button.cancel { margin-right: auto; background: #fff; }
      .nm-legal-button:disabled { opacity: .42; cursor: not-allowed; }
      .nm-legal-error { min-height: 20px; margin-top: 8px; color: #b42318; font-size: 13px; font-weight: 700; }
      .nm-legal-field { display: grid; gap: 7px; margin: 0 0 14px; color: #263d52; font-size: 13px; font-weight: 800; }
      .nm-legal-field select, .nm-legal-field textarea, .nm-legal-field input { width: 100%; border: 1px solid #b9cddd; border-radius: 6px; padding: 10px 11px; background: #fff; color: #102033; font: 500 14px/1.5 Inter, system-ui, sans-serif; box-sizing: border-box; }
      .nm-legal-field textarea { min-height: 96px; resize: vertical; }
      .nm-legal-result { margin-top: 14px; padding: 13px; border: 1px solid #b8dcef; border-radius: 6px; background: #f2fbff; color: #263d52; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
      .nm-legal-result strong { color: #102033; }
      .nm-legal-verification { margin-top: 13px; padding: 13px; border: 1px solid #f3c38d; border-radius: 6px; background: #fffaf3; }
      .nm-legal-verification p { margin: 0 0 10px; color: #5c3b1f; line-height: 1.55; }
      .nm-legal-verification-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 9px; align-items: end; }
      .nm-legal-verification-row .nm-legal-field { margin: 0; }
      .nm-legal-contact { padding: 13px; border: 1px solid #dbe8f0; border-radius: 6px; background: #f5f9fc; color: #334a60; font-size: 14px; line-height: 1.65; overflow-wrap: anywhere; }
      #nmLegalLauncher { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; border: 1px solid #c4deeb; border-radius: 6px; padding: 9px 12px; background: rgba(255,255,255,.96); color: #18364f; box-shadow: 0 6px 22px rgba(16,32,51,.12); font: 700 12px/1.2 Inter, system-ui, sans-serif; cursor: pointer; }
      #nmLegalMenu { position: fixed; right: 16px; bottom: 58px; z-index: 2147483001; min-width: 220px; padding: 8px; border: 1px solid #c4deeb; border-radius: 6px; background: #fff; box-shadow: 0 12px 35px rgba(16,32,51,.18); }
      #nmLegalMenu button { display: block; width: 100%; padding: 10px; border: 0; border-radius: 4px; background: transparent; color: #18364f; text-align: left; font: 700 13px/1.3 Inter, system-ui, sans-serif; cursor: pointer; }
      #nmLegalMenu button:hover { background: #eef8fc; }
      [dir="rtl"] #nmLegalLauncher, [dir="rtl"] #nmLegalMenu { right: auto; left: 16px; }
      [dir="rtl"] #nmLegalMenu button { text-align: right; }
      @media (max-width: 640px) { #nmLegalOverlay { padding: 0; } .nm-legal-dialog { width: 100%; height: 100vh; height: 100dvh; border: 0; border-radius: 0; } .nm-legal-head { padding: max(14px, env(safe-area-inset-top)) 16px 12px; } .nm-legal-scroll { flex-basis: 34%; min-height: 96px; padding: 14px 16px 18px; } .nm-legal-foot { max-height: 64%; padding: 12px 16px max(12px, env(safe-area-inset-bottom)); } .nm-legal-head h2 { font-size: 20px; } .nm-legal-meta { margin-top: 7px; line-height: 1.4; } .nm-legal-actions { flex-direction: column-reverse; gap: 8px; margin-top: 10px; padding-top: 10px; } .nm-legal-button { width: 100%; min-height: 46px; } .nm-legal-button.cancel { margin-right: 0; } .nm-legal-verification-row { grid-template-columns: 1fr; } }
      @media (max-height: 560px) { .nm-legal-dialog { height: 100vh; height: 100dvh; border-radius: 0; } .nm-legal-head { padding-top: 10px; padding-bottom: 9px; } .nm-legal-head h2 { font-size: 18px; } .nm-legal-meta { display: none; } .nm-legal-scroll { min-height: 82px; padding-top: 10px; padding-bottom: 12px; } .nm-legal-foot { max-height: 68%; padding-top: 10px; } }
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

  function allRequiredChecked(root) {
    const checks = Array.from(root.querySelectorAll("input[data-required='true']"));
    return checks.length > 0 && checks.every((input) => input.checked);
  }

  function readGateUi(lang) {
    return READ_GATE_UI[normalizeLang(lang)] || READ_GATE_UI.en;
  }

  function privacyVerificationUi(lang) {
    return PRIVACY_VERIFICATION_UI[normalizeLang(lang)] || PRIVACY_VERIFICATION_UI.en;
  }

  function localizePrivacyRequestStatus(status, ui) {
    const normalized = String(status || "-");
    const aliases = {
      fulfilled: "completed",
      partially_fulfilled: "completed",
      in_review: "action_required"
    };
    const key = aliases[normalized] || normalized;
    return (ui.statuses && ui.statuses[key]) || normalized;
  }

  function installReadGate(overlay, lang, onChange) {
    const scrollBox = overlay.querySelector(".nm-legal-scroll");
    const gate = overlay.querySelector("[data-read-gate]");
    const gatedControls = Array.from(overlay.querySelectorAll(
      "input[data-required='true'], input[name='nmActorRole']"
    ));
    const labels = readGateUi(lang);
    let completed = false;

    gatedControls.forEach((control) => { control.disabled = true; });

    const update = () => {
      if (!scrollBox || completed) return;
      const reachedEnd = scrollBox.scrollHeight <= scrollBox.clientHeight + 2 ||
        scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 8;
      if (!reachedEnd) return;

      completed = true;
      gatedControls.forEach((control) => { control.disabled = false; });
      if (gate) {
        gate.textContent = labels.done;
        gate.classList.add("done");
      }
      if (typeof onChange === "function") onChange();
    };

    if (scrollBox) scrollBox.addEventListener("scroll", update, { passive: true });
    requestAnimationFrame(update);
    return () => completed;
  }

  function runTermsStep(lang, content, config) {
    return new Promise((resolve, reject) => {
      installStyles();
      removeModal(false);
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
          <div class="nm-legal-scroll" tabindex="0" data-autofocus>${sectionMarkup(content.terms)}</div>
          <footer class="nm-legal-foot">
            <div class="nm-legal-form-scroll" tabindex="0">
              <p class="nm-legal-read-gate" data-read-gate>${escapeHtml(readGateUi(lang).prompt)}</p>
              <p class="nm-legal-read">${escapeHtml(ui.required || "Required acknowledgements")}</p>
              <div class="nm-legal-actor">
                <strong>${escapeHtml(content.actorLabel)}</strong>
                <div class="nm-legal-options">
                  <label class="nm-legal-check"><input type="radio" name="nmActorRole" value="parent_or_legal_guardian"> <span>${escapeHtml(content.actorParent)}</span></label>
                  <label class="nm-legal-check"><input type="radio" name="nmActorRole" value="adult_authorized_purchaser"> <span>${escapeHtml(content.actorAdult)}</span></label>
                </div>
              </div>
              <div class="nm-legal-required">${(content.termsChecks || []).map((label, index) => `<label class="nm-legal-check"><input type="checkbox" data-required="true" data-term="${index}"> <span>${escapeHtml(label)}</span></label>`).join("")}</div>
            </div>
            <div class="nm-legal-actions"><button class="nm-legal-button cancel" type="button" data-action="cancel">${escapeHtml(CANCEL_LABELS[lang] || CANCEL_LABELS.en)}</button><button class="nm-legal-button primary" type="button" disabled>${escapeHtml(ui.continue || "Continue")}</button></div>
          </footer>
        </div>`;
      document.body.appendChild(overlay);
      document.documentElement.classList.add("nm-legal-open");
      document.body.classList.add("nm-legal-open");

      const button = overlay.querySelector(".nm-legal-button.primary");
      const cancelButton = overlay.querySelector("[data-action='cancel']");
      const cancel = () => {
        removeModal();
        reject(consentCancellation());
      };

      let isReadComplete = () => false;
      const update = () => {
        const actor = overlay.querySelector("input[name='nmActorRole']:checked");
        button.disabled = !(isReadComplete() && actor && allRequiredChecked(overlay));
      };
      isReadComplete = installReadGate(overlay, lang, update);
      overlay.addEventListener("change", update);
      cancelButton.addEventListener("click", cancel);
      button.addEventListener("click", () => {
        const actor = overlay.querySelector("input[name='nmActorRole']:checked");
        if (!actor || button.disabled) return;
        removeModal(false);
        resolve({ actorRole: actor.value, termsScrollCompleted: isReadComplete() });
      });
      activateModal(overlay, cancel);
    });
  }

  function runPrivacyStep(lang, content, config, termsResult) {
    return new Promise((resolve, reject) => {
      installStyles();
      removeModal(false);
      const ui = content.ui || {};
      const overlay = document.createElement("div");
      overlay.id = "nmLegalOverlay";
      overlay.innerHTML = `
        <div class="nm-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="nmLegalTitle">
          <header class="nm-legal-head">
            <div class="nm-legal-headline"><h2 id="nmLegalTitle">${escapeHtml(ui.privacyTitle)}</h2><span class="nm-legal-step">2 / 2</span></div>
            <div class="nm-legal-meta">${legalMeta(config, lang)} &middot; ${escapeHtml(config.privacyPolicyVersion || "")}</div>
          </header>
          <div class="nm-legal-scroll" tabindex="0" data-autofocus>${sectionMarkup(content.privacy)}</div>
          <footer class="nm-legal-foot">
            <div class="nm-legal-form-scroll" tabindex="0">
              <p class="nm-legal-read-gate" data-read-gate>${escapeHtml(readGateUi(lang).prompt)}</p>
              <p class="nm-legal-read">${escapeHtml(ui.required || "Required acknowledgements")}</p>
              <div class="nm-legal-required">${(content.privacyChecks || []).map((label, index) => `<label class="nm-legal-check"><input type="checkbox" data-required="true" data-privacy="${index}"> <span>${escapeHtml(label)}</span></label>`).join("")}</div>
              <div class="nm-legal-optional"><label class="nm-legal-check"><input id="nmAnalyticsConsent" type="checkbox"> <span><strong>${escapeHtml(ui.optional || "Optional")}:</strong> ${escapeHtml(content.analytics)}</span></label></div>
              <div class="nm-legal-error" role="alert"></div>
            </div>
            <div class="nm-legal-actions"><button class="nm-legal-button cancel" type="button" data-action="cancel">${escapeHtml(CANCEL_LABELS[lang] || CANCEL_LABELS.en)}</button><button class="nm-legal-button" type="button" data-action="back">${escapeHtml(ui.back || "Back")}</button><button class="nm-legal-button primary" type="button" disabled>${escapeHtml(ui.accept || "I explicitly consent and continue")}</button></div>
          </footer>
        </div>`;
      document.body.appendChild(overlay);
      document.documentElement.classList.add("nm-legal-open");
      document.body.classList.add("nm-legal-open");

      const button = overlay.querySelector(".nm-legal-button.primary");
      const backButton = overlay.querySelector("[data-action='back']");
      const cancelButton = overlay.querySelector("[data-action='cancel']");
      const errorBox = overlay.querySelector(".nm-legal-error");
      const cancel = () => {
        removeModal();
        reject(consentCancellation());
      };

      let isReadComplete = () => false;
      const update = () => {
        button.disabled = !(isReadComplete() && allRequiredChecked(overlay));
      };
      isReadComplete = installReadGate(overlay, lang, update);
      overlay.addEventListener("change", update);
      cancelButton.addEventListener("click", cancel);
      backButton.addEventListener("click", async () => {
        removeModal(false);
        try {
          const nextTerms = await runTermsStep(lang, content, config);
          resolve({ restart: true, terms: nextTerms });
        } catch (error) {
          reject(error);
        }
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
            privacyNoticeAcknowledged: true,
            specialCategoryExplicitConsent: true,
            aiTransparencyAcknowledged: true,
            termsScrollCompleted: termsResult.termsScrollCompleted === true,
            privacyScrollCompleted: isReadComplete(),
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
      activateModal(overlay, cancel);
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
      removeModal(false);
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
      activateModal(overlay, removeModal);
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

  function storePrivacyRequestReceipt(request, requestToken, requestType) {
    if (!request || !request.id || !requestToken) return;
    try {
      sessionStorage.setItem(`nm_privacy_request:${request.id}`, JSON.stringify({
        id: request.id,
        token: requestToken,
        status: request.status || "",
        requestType: requestType || request.requestType || "",
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
    removeModal(false);

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
    activateModal(overlay, removeModal);
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
    const verificationUi = privacyVerificationUi(language);

    const setFormDisabled = (disabled) => {
      form.elements.requestType.disabled = disabled;
      form.elements.details.disabled = disabled;
      submitButton.disabled = disabled;
    };

    const appendDownloadButton = (exportData, requestType, requestId) => {
      if (!exportData) return;
      const downloadButton = document.createElement("button");
      downloadButton.type = "button";
      downloadButton.className = "nm-legal-button";
      downloadButton.style.marginTop = "12px";
      downloadButton.textContent = ui.download;
      downloadButton.addEventListener("click", () => {
        downloadJsonFile(
          exportData,
          `neuromap-${requestType || "privacy"}-${requestId || "data"}.json`
        );
      });
      resultBox.appendChild(document.createElement("br"));
      resultBox.appendChild(downloadButton);
    };

    const renderRequest = ({ request, receipt, requestType, exportData, submitted }) => {
      const currentRequest = request || {};
      const currentType = requestType || currentRequest.requestType || receipt?.requestType || "privacy";
      const status = String(currentRequest.status || receipt?.status || "-");
      const localizedStatus = localizePrivacyRequestStatus(status, verificationUi);
      resultBox.innerHTML = `
        ${submitted ? `<strong>${escapeHtml(ui.submitted)}</strong><br>` : ""}
        <strong>${escapeHtml(ui.requestId)}: ${escapeHtml(currentRequest.id || receipt?.id || "-")}</strong><br>
        ${escapeHtml(ui.status)}: ${escapeHtml(localizedStatus)}<br>
        ${escapeHtml(ui.due)}: ${escapeHtml(formatRequestDate(currentRequest.dueAt, language))}<br>
        ${escapeHtml(ui.decision)}: ${escapeHtml(currentRequest.decisionReason || "-")}`;

      if (status === "verification_pending" && receipt?.token) {
        const verification = document.createElement("div");
        verification.className = "nm-legal-verification";
        verification.innerHTML = `
          <p><strong>${escapeHtml(verificationUi.sent)}</strong><br>${escapeHtml(verificationUi.expires)}</p>
          <div class="nm-legal-verification-row">
            <label class="nm-legal-field">
              <span>${escapeHtml(verificationUi.code)}</span>
              <input type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" data-verification-code>
            </label>
            <button class="nm-legal-button primary" type="button" data-action="verify-code">${escapeHtml(verificationUi.verify)}</button>
          </div>
          <div class="nm-legal-error" role="alert" data-verification-error></div>`;
        resultBox.appendChild(verification);

        const codeInput = verification.querySelector("[data-verification-code]");
        const verifyButton = verification.querySelector("[data-action='verify-code']");
        const verificationError = verification.querySelector("[data-verification-error]");
        const verify = async () => {
          const code = String(codeInput.value || "").replace(/\D/g, "");
          if (!/^\d{6}$/.test(code)) {
            verificationError.textContent = verificationUi.invalid;
            codeInput.focus();
            return;
          }
          verificationError.textContent = "";
          codeInput.disabled = true;
          verifyButton.disabled = true;
          verifyButton.textContent = verificationUi.verifying;
          try {
            const verified = await fetchJson(
              `/legal/privacy-requests/${encodeURIComponent(currentRequest.id || receipt.id)}/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-privacy-request-token": receipt.token
                },
                body: JSON.stringify({ code })
              }
            );
            const verifiedRequest = verified.request || currentRequest;
            storePrivacyRequestReceipt(verifiedRequest, receipt.token, currentType);
            renderRequest({
              request: verifiedRequest,
              receipt: { ...receipt, status: verifiedRequest.status, requestType: currentType },
              requestType: currentType,
              exportData: verified.exportData,
              submitted: false
            });
          } catch (error) {
            verificationError.textContent = error.message || verificationUi.failed;
            codeInput.disabled = false;
            verifyButton.disabled = false;
            verifyButton.textContent = verificationUi.verify;
          }
        };
        verifyButton.addEventListener("click", verify);
        codeInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            verify();
          }
        });
        requestAnimationFrame(() => codeInput.focus());
      } else {
        appendDownloadButton(
          exportData,
          currentType,
          currentRequest.id || receipt?.id
        );
      }
      resultBox.hidden = false;
    };

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
        renderRequest({
          request: previousRequest,
          receipt: previousReceipt,
          requestType: previousRequest.requestType || previousReceipt.requestType,
          submitted: false
        });
        if (previousRequest.status === "verification_pending") setFormDisabled(true);
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
        const receipt = {
          id: request.id,
          token: response.requestToken,
          status: request.status,
          requestType
        };
        storePrivacyRequestReceipt(request, response.requestToken, requestType);
        setFormDisabled(true);
        renderRequest({
          request,
          receipt,
          requestType,
          exportData: response.exportData,
          submitted: true
        });
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

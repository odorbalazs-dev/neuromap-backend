const LOCALES = {
  hu: "hu-HU",
  en: "en-GB",
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

const COPY = {
  hu: {
    subject: "NeuroMap Kids - a vásárlás és a digitális teljesítés visszaigazolása",
    title: "Vásárlási visszaigazolás",
    hello: "Kedves",
    intro: "Köszönjük a vásárlást. Ez az email a megrendelés és a digitális szolgáltatás tartós visszaigazolása.",
    order: "Megrendelés adatai",
    package: "Csomag",
    amount: "Fizetett összeg",
    date: "Vásárlás időpontja",
    reference: "Hivatkozási azonosító",
    includes: "A csomag tartalma",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Személyre szabott, tájékoztató előszűrési riport PDF-ben", "A riport elküldése emailben"],
    plusItems: ["Személyre szabott, tájékoztató előszűrési riport PDF-ben", "Megosztható megfigyelési összefoglaló", "Helyzetalapú következő lépések és óvodai/iskolai beszélgetési útmutató", "14 napos megfigyelési napló, emlékeztetők és trendösszegzés", "Tájékoztató szakemberkeresési segítség"],
    performanceTitle: "Digitális teljesítés és elállás",
    performance: "A fizetéskor kérted a digitális teljesítés azonnali megkezdését, és tudomásul vetted, hogy a teljes digitális szolgáltatás nyújtását követően az elállási jog a vonatkozó jog által megengedett körben megszűnhet. Ez nem érinti a kötelező fogyasztóvédelmi jogaidat és hibás teljesítés esetén fennálló jogorvoslataidat.",
    informationTitle: "Fontos tájékoztatás",
    information: "A NeuroMap Kids tájékoztató előszűrés, nem orvosi diagnózis, nem sürgősségi szolgáltatás és nem helyettesíti képzett szakember vizsgálatát. A riport részben automatizált, mesterséges intelligenciával támogatott feldolgozással készül.",
    policies: "A vásárláskor elfogadott dokumentumok",
    terms: "Felhasználási és vásárlási feltételek",
    privacy: "Adatkezelési tájékoztató",
    contact: "Adatvédelmi vagy vásárlási kérdés esetén írj ide",
    invoice: "A számla külön emailben érkezhet. Őrizd meg ezt a visszaigazolást."
  },
  en: {
    subject: "NeuroMap Kids - purchase and digital performance confirmation",
    title: "Purchase confirmation",
    hello: "Hello",
    intro: "Thank you for your purchase. This email is the durable confirmation of your order and digital service.",
    order: "Order details",
    package: "Package",
    amount: "Amount paid",
    date: "Purchase date",
    reference: "Reference ID",
    includes: "Package contents",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Personalised informational screening report in PDF format", "Report delivery by email"],
    plusItems: ["Personalised informational screening report in PDF format", "Shareable observation summary", "Situation-based next steps and an education conversation guide", "14-day observation diary, reminders and trend summary", "Informational professional-search assistance"],
    performanceTitle: "Digital performance and withdrawal",
    performance: "At checkout you requested immediate digital performance and acknowledged that, once the digital service has been fully supplied, the right of withdrawal may end to the extent permitted by applicable law. This does not affect mandatory consumer rights or remedies for non-conforming performance.",
    informationTitle: "Important information",
    information: "NeuroMap Kids is an informational screening service, not a medical diagnosis or emergency service, and it does not replace assessment by a qualified professional. The report is produced through partly automated, AI-assisted processing.",
    policies: "Documents accepted at purchase",
    terms: "Terms of use and purchase",
    privacy: "Privacy notice",
    contact: "For privacy or purchase questions, contact",
    invoice: "The invoice may arrive in a separate email. Please keep this confirmation."
  },
  de: {
    subject: "NeuroMap Kids - Bestätigung des Kaufs und der digitalen Leistung",
    title: "Kaufbestätigung",
    hello: "Guten Tag",
    intro: "Vielen Dank für Ihren Kauf. Diese E-Mail ist die dauerhafte Bestätigung Ihrer Bestellung und der digitalen Dienstleistung.",
    order: "Bestelldaten",
    package: "Paket",
    amount: "Gezahlter Betrag",
    date: "Kaufdatum",
    reference: "Referenz-ID",
    includes: "Paketinhalt",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Personalisierter informativer Screening-Bericht als PDF", "Versand des Berichts per E-Mail"],
    plusItems: ["Personalisierter informativer Screening-Bericht als PDF", "Teilbare Beobachtungszusammenfassung", "Situationsbezogene nächste Schritte und Gesprächsleitfaden für Kita/Schule", "14-tägiges Beobachtungstagebuch, Erinnerungen und Trendzusammenfassung", "Informative Hilfe bei der Suche nach Fachpersonen"],
    performanceTitle: "Digitale Leistung und Widerruf",
    performance: "Beim Checkout haben Sie den sofortigen Beginn der digitalen Leistung verlangt und bestätigt, dass das Widerrufsrecht nach vollständiger Erbringung im gesetzlich zulässigen Umfang erlöschen kann. Zwingende Verbraucherrechte und Ansprüche bei nicht vertragsgemäßer Leistung bleiben unberührt.",
    informationTitle: "Wichtiger Hinweis",
    information: "NeuroMap Kids ist ein informatives Screening, keine medizinische Diagnose oder Notfallleistung und ersetzt keine Untersuchung durch qualifizierte Fachpersonen. Der Bericht wird teilweise automatisiert und KI-gestützt erstellt.",
    policies: "Beim Kauf akzeptierte Dokumente",
    terms: "Nutzungs- und Kaufbedingungen",
    privacy: "Datenschutzhinweis",
    contact: "Bei Datenschutz- oder Kauffragen kontaktieren Sie",
    invoice: "Die Rechnung kann in einer separaten E-Mail eintreffen. Bitte bewahren Sie diese Bestätigung auf."
  },
  it: {
    subject: "NeuroMap Kids - conferma di acquisto e prestazione digitale",
    title: "Conferma di acquisto",
    hello: "Gentile",
    intro: "Grazie per l'acquisto. Questa email costituisce la conferma durevole dell'ordine e del servizio digitale.",
    order: "Dettagli dell'ordine",
    package: "Pacchetto",
    amount: "Importo pagato",
    date: "Data di acquisto",
    reference: "ID di riferimento",
    includes: "Contenuto del pacchetto",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Report informativo personalizzato di screening in PDF", "Invio del report via email"],
    plusItems: ["Report informativo personalizzato di screening in PDF", "Sintesi osservativa condivisibile", "Passi successivi per situazione e guida al colloquio con scuola", "Diario osservativo di 14 giorni, promemoria e sintesi dell'andamento", "Assistenza informativa nella ricerca di professionisti"],
    performanceTitle: "Prestazione digitale e recesso",
    performance: "Al pagamento hai richiesto l'avvio immediato della prestazione digitale e riconosciuto che, dopo la fornitura completa, il diritto di recesso può cessare nei limiti consentiti dalla legge applicabile. Restano invariati i diritti obbligatori del consumatore e i rimedi per prestazione non conforme.",
    informationTitle: "Informazioni importanti",
    information: "NeuroMap Kids è uno screening informativo, non una diagnosi medica né un servizio di emergenza, e non sostituisce la valutazione di un professionista qualificato. Il report è prodotto con elaborazione in parte automatizzata e assistita dall'IA.",
    policies: "Documenti accettati all'acquisto",
    terms: "Condizioni d'uso e di acquisto",
    privacy: "Informativa sulla privacy",
    contact: "Per domande su privacy o acquisto, contatta",
    invoice: "La fattura può arrivare in un'email separata. Conserva questa conferma."
  },
  es: {
    subject: "NeuroMap Kids - confirmación de compra y prestación digital",
    title: "Confirmación de compra",
    hello: "Hola",
    intro: "Gracias por tu compra. Este correo es la confirmación duradera del pedido y del servicio digital.",
    order: "Datos del pedido",
    package: "Paquete",
    amount: "Importe pagado",
    date: "Fecha de compra",
    reference: "ID de referencia",
    includes: "Contenido del paquete",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Informe informativo personalizado de cribado en PDF", "Envío del informe por correo electrónico"],
    plusItems: ["Informe informativo personalizado de cribado en PDF", "Resumen de observación para compartir", "Próximos pasos por situación y guía para hablar con el centro educativo", "Diario de observación de 14 días, recordatorios y resumen de tendencias", "Ayuda informativa para buscar profesionales"],
    performanceTitle: "Prestación digital y desistimiento",
    performance: "Al pagar solicitaste el inicio inmediato de la prestación digital y reconociste que, una vez suministrado completamente el servicio, el derecho de desistimiento puede finalizar en la medida permitida por la ley aplicable. Esto no afecta a los derechos obligatorios del consumidor ni a los recursos por falta de conformidad.",
    informationTitle: "Información importante",
    information: "NeuroMap Kids es un cribado informativo, no un diagnóstico médico ni un servicio de urgencias, y no sustituye la evaluación de un profesional cualificado. El informe se produce mediante un tratamiento parcialmente automatizado y asistido por IA.",
    policies: "Documentos aceptados al comprar",
    terms: "Condiciones de uso y compra",
    privacy: "Aviso de privacidad",
    contact: "Para consultas de privacidad o compra, escribe a",
    invoice: "La factura puede llegar en un correo separado. Conserva esta confirmación."
  },
  zh: {
    subject: "NeuroMap Kids - 购买与数字服务确认",
    title: "购买确认",
    hello: "您好",
    intro: "感谢您的购买。本邮件是订单及数字服务的持久确认记录。",
    order: "订单详情",
    package: "套餐",
    amount: "已付金额",
    date: "购买日期",
    reference: "参考编号",
    includes: "套餐内容",
    standardName: "NeuroMap Kids 标准版",
    plusName: "NeuroMap Kids Plus 版",
    standardItems: ["个性化信息筛查 PDF 报告", "通过电子邮件发送报告"],
    plusItems: ["个性化信息筛查 PDF 报告", "可分享的观察摘要", "基于情境的后续步骤及与学校沟通指南", "14 天观察日记、提醒与趋势摘要", "信息性质的专业人士查找协助"],
    performanceTitle: "数字服务与撤回权",
    performance: "您在付款时要求立即开始数字服务，并确认在数字服务完全提供后，撤回权可能在适用法律允许的范围内终止。法定消费者权利以及服务不符合约定时的救济不受影响。",
    informationTitle: "重要说明",
    information: "NeuroMap Kids 是信息性质的筛查服务，不是医学诊断或紧急服务，也不能替代合格专业人士的评估。报告由部分自动化、人工智能辅助处理生成。",
    policies: "购买时接受的文件",
    terms: "使用与购买条款",
    privacy: "隐私声明",
    contact: "如有隐私或购买问题，请联系",
    invoice: "发票可能通过另一封邮件发送。请保留本确认邮件。"
  },
  ja: {
    subject: "NeuroMap Kids - 購入およびデジタル提供の確認",
    title: "購入確認",
    hello: "こんにちは",
    intro: "ご購入ありがとうございます。このメールは、注文およびデジタルサービスの永続的な確認です。",
    order: "注文内容",
    package: "パッケージ",
    amount: "支払額",
    date: "購入日時",
    reference: "参照ID",
    includes: "パッケージ内容",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["個別化された情報提供目的のスクリーニングPDFレポート", "メールによるレポート送付"],
    plusItems: ["個別化された情報提供目的のスクリーニングPDFレポート", "共有可能な観察要約", "状況別の次の対応と園・学校との対話ガイド", "14日間の観察日記、リマインダー、傾向要約", "専門家検索に関する情報提供支援"],
    performanceTitle: "デジタル提供と撤回権",
    performance: "決済時にデジタル提供の即時開始を希望し、サービスが完全に提供された後は、適用法で認められる範囲で撤回権が終了する場合があることを確認しました。強行的な消費者の権利および契約不適合に対する救済は影響を受けません。",
    informationTitle: "重要なお知らせ",
    information: "NeuroMap Kids は情報提供目的のスクリーニングであり、医学的診断や緊急サービスではなく、資格を有する専門家の評価に代わるものではありません。レポートは一部自動化されたAI支援処理で作成されます。",
    policies: "購入時に同意した文書",
    terms: "利用・購入条件",
    privacy: "プライバシー通知",
    contact: "プライバシーまたは購入に関するお問い合わせ",
    invoice: "請求書は別のメールで届く場合があります。この確認メールを保管してください。"
  },
  ar: {
    subject: "NeuroMap Kids - تأكيد الشراء وتقديم الخدمة الرقمية",
    title: "تأكيد الشراء",
    hello: "مرحبًا",
    intro: "شكرًا لشرائك. هذه الرسالة تأكيد دائم لطلبك وللخدمة الرقمية.",
    order: "تفاصيل الطلب",
    package: "الباقة",
    amount: "المبلغ المدفوع",
    date: "تاريخ الشراء",
    reference: "الرقم المرجعي",
    includes: "محتويات الباقة",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["تقرير فحص معلوماتي مخصص بصيغة PDF", "إرسال التقرير بالبريد الإلكتروني"],
    plusItems: ["تقرير فحص معلوماتي مخصص بصيغة PDF", "ملخص ملاحظات قابل للمشاركة", "خطوات تالية حسب الموقف ودليل للتحدث مع المدرسة", "سجل ملاحظات لمدة 14 يومًا وتذكيرات وملخص للاتجاهات", "مساعدة معلوماتية للبحث عن مختصين"],
    performanceTitle: "التنفيذ الرقمي وحق العدول",
    performance: "طلبت عند الدفع بدء التنفيذ الرقمي فورًا وأقررت بأن حق العدول قد ينتهي بعد تقديم الخدمة الرقمية بالكامل، بالقدر الذي يسمح به القانون المعمول به. لا يؤثر ذلك في حقوق المستهلك الإلزامية أو وسائل الانتصاف عند عدم المطابقة.",
    informationTitle: "معلومات مهمة",
    information: "NeuroMap Kids خدمة فحص معلوماتية وليست تشخيصًا طبيًا أو خدمة طوارئ، ولا تحل محل تقييم مختص مؤهل. يُنشأ التقرير بمعالجة مؤتمتة جزئيًا ومدعومة بالذكاء الاصطناعي.",
    policies: "المستندات المقبولة عند الشراء",
    terms: "شروط الاستخدام والشراء",
    privacy: "إشعار الخصوصية",
    contact: "لأسئلة الخصوصية أو الشراء تواصل مع",
    invoice: "قد تصل الفاتورة في رسالة منفصلة. يُرجى الاحتفاظ بهذا التأكيد."
  },
  pl: {
    subject: "NeuroMap Kids - potwierdzenie zakupu i świadczenia cyfrowego",
    title: "Potwierdzenie zakupu",
    hello: "Dzień dobry",
    intro: "Dziękujemy za zakup. Ta wiadomość jest trwałym potwierdzeniem zamówienia i usługi cyfrowej.",
    order: "Dane zamówienia",
    package: "Pakiet",
    amount: "Zapłacona kwota",
    date: "Data zakupu",
    reference: "Identyfikator referencyjny",
    includes: "Zawartość pakietu",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Spersonalizowany informacyjny raport przesiewowy PDF", "Wysyłka raportu pocztą elektroniczną"],
    plusItems: ["Spersonalizowany informacyjny raport przesiewowy PDF", "Podsumowanie obserwacji do udostępnienia", "Kolejne kroki zależne od sytuacji i przewodnik rozmowy ze szkołą", "14-dniowy dziennik obserwacji, przypomnienia i podsumowanie trendu", "Informacyjna pomoc w wyszukiwaniu specjalistów"],
    performanceTitle: "Świadczenie cyfrowe i odstąpienie",
    performance: "Podczas płatności zażądano natychmiastowego rozpoczęcia świadczenia cyfrowego i potwierdzono, że po pełnym wykonaniu usługi prawo odstąpienia może wygasnąć w zakresie dozwolonym przez prawo. Nie narusza to bezwzględnie obowiązujących praw konsumenta ani środków ochrony przy niezgodności.",
    informationTitle: "Ważna informacja",
    information: "NeuroMap Kids jest informacyjnym badaniem przesiewowym, a nie diagnozą medyczną ani usługą ratunkową, i nie zastępuje oceny wykwalifikowanego specjalisty. Raport powstaje przy częściowo zautomatyzowanym przetwarzaniu wspieranym przez AI.",
    policies: "Dokumenty zaakceptowane przy zakupie",
    terms: "Warunki użytkowania i zakupu",
    privacy: "Informacja o prywatności",
    contact: "Pytania o prywatność lub zakup kieruj na",
    invoice: "Faktura może przyjść w osobnej wiadomości. Zachowaj to potwierdzenie."
  },
  pt: {
    subject: "NeuroMap Kids - confirmação da compra e prestação digital",
    title: "Confirmação da compra",
    hello: "Olá",
    intro: "Obrigado pela compra. Este email é a confirmação duradoura da encomenda e do serviço digital.",
    order: "Dados da encomenda",
    package: "Pacote",
    amount: "Valor pago",
    date: "Data da compra",
    reference: "ID de referência",
    includes: "Conteúdo do pacote",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Relatório informativo personalizado de rastreio em PDF", "Envio do relatório por email"],
    plusItems: ["Relatório informativo personalizado de rastreio em PDF", "Resumo de observação partilhável", "Próximos passos por situação e guia para conversar com a escola", "Diário de observação de 14 dias, lembretes e resumo de tendências", "Ajuda informativa na procura de profissionais"],
    performanceTitle: "Prestação digital e livre resolução",
    performance: "No pagamento pediu o início imediato da prestação digital e reconheceu que, depois de o serviço ser integralmente fornecido, o direito de livre resolução pode terminar na medida permitida pela lei aplicável. Mantêm-se os direitos obrigatórios do consumidor e os meios de reparação por falta de conformidade.",
    informationTitle: "Informação importante",
    information: "NeuroMap Kids é um rastreio informativo, não um diagnóstico médico ou serviço de emergência, e não substitui a avaliação de um profissional qualificado. O relatório é produzido com processamento parcialmente automatizado e assistido por IA.",
    policies: "Documentos aceites na compra",
    terms: "Termos de utilização e compra",
    privacy: "Aviso de privacidade",
    contact: "Para questões de privacidade ou compra, contacte",
    invoice: "A fatura pode chegar num email separado. Guarde esta confirmação."
  },
  fr: {
    subject: "NeuroMap Kids - confirmation d'achat et d'exécution numérique",
    title: "Confirmation d'achat",
    hello: "Bonjour",
    intro: "Merci pour votre achat. Cet email constitue la confirmation durable de votre commande et du service numérique.",
    order: "Détails de la commande",
    package: "Forfait",
    amount: "Montant payé",
    date: "Date d'achat",
    reference: "Identifiant de référence",
    includes: "Contenu du forfait",
    standardName: "NeuroMap Kids Standard",
    plusName: "NeuroMap Kids Plus",
    standardItems: ["Rapport de dépistage informatif personnalisé en PDF", "Envoi du rapport par email"],
    plusItems: ["Rapport de dépistage informatif personnalisé en PDF", "Synthèse d'observation partageable", "Prochaines étapes selon la situation et guide de discussion avec l'école", "Journal d'observation de 14 jours, rappels et synthèse des tendances", "Aide informative à la recherche de professionnels"],
    performanceTitle: "Exécution numérique et rétractation",
    performance: "Lors du paiement, vous avez demandé le début immédiat de l'exécution numérique et reconnu qu'après la fourniture complète du service, le droit de rétractation peut prendre fin dans la mesure permise par la loi applicable. Les droits impératifs du consommateur et les recours en cas de défaut de conformité restent inchangés.",
    informationTitle: "Information importante",
    information: "NeuroMap Kids est un dépistage informatif, et non un diagnostic médical ou un service d'urgence, et ne remplace pas l'évaluation d'un professionnel qualifié. Le rapport est produit par un traitement partiellement automatisé assisté par IA.",
    policies: "Documents acceptés lors de l'achat",
    terms: "Conditions d'utilisation et d'achat",
    privacy: "Avis de confidentialité",
    contact: "Pour toute question relative à la confidentialité ou à l'achat, contactez",
    invoice: "La facture peut arriver dans un email séparé. Conservez cette confirmation."
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAmount(amountTotal, currency, lang) {
  const amount = Number(amountTotal || 0) / 100;
  try {
    return new Intl.NumberFormat(LOCALES[lang] || LOCALES.en, {
      style: "currency",
      currency: String(currency || "USD").toUpperCase()
    }).format(amount);
  } catch (_error) {
    return `${amount.toFixed(2)} ${String(currency || "USD").toUpperCase()}`;
  }
}

function formatDate(value, lang) {
  const date = value ? new Date(value) : new Date();
  try {
    return new Intl.DateTimeFormat(LOCALES[lang] || LOCALES.en, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC"
    }).format(date);
  } catch (_error) {
    return date.toISOString();
  }
}

function policyLink(url, label, version) {
  const safeLabel = escapeHtml(label);
  const suffix = version ? ` (${escapeHtml(version)})` : "";
  return url
    ? `<a href="${escapeHtml(url)}" style="color:#0877a7;">${safeLabel}${suffix}</a>`
    : `${safeLabel}${suffix}`;
}

export function buildContractConfirmationEmail({
  lang,
  name,
  sessionId,
  packageCode,
  amountTotal,
  currency,
  paidAt,
  termsUrl,
  termsVersion,
  privacyUrl,
  privacyVersion,
  privacyContact
}) {
  const safeLang = Object.hasOwn(COPY, lang) ? lang : "en";
  const copy = COPY[safeLang];
  const isPlus = packageCode === "plus_v1";
  const packageName = isPlus ? copy.plusName : copy.standardName;
  const items = isPlus ? copy.plusItems : copy.standardItems;
  const greeting = String(name || "").trim()
    ? `${copy.hello} ${String(name).trim()}!`
    : `${copy.hello}!`;
  const amount = formatAmount(amountTotal, currency, safeLang);
  const purchaseDate = formatDate(paidAt, safeLang);
  const contact = privacyContact || "privacy@neuromapkids.com";
  const direction = safeLang === "ar" ? "rtl" : "ltr";
  const itemHtml = items.map((item) => `<li style="margin:7px 0;">${escapeHtml(item)}</li>`).join("");
  const itemText = items.map((item) => `- ${item}`).join("\n");
  const termsDocument = policyLink(termsUrl, copy.terms, termsVersion);
  const privacyDocument = policyLink(privacyUrl, copy.privacy, privacyVersion);

  return {
    subject: copy.subject,
    html: `<!doctype html>
      <html lang="${safeLang}" dir="${direction}">
        <body style="margin:0;background:#f4f8fb;font-family:Arial,sans-serif;color:#1f2937;">
          <main style="max-width:680px;margin:0 auto;padding:28px 18px;">
            <section style="background:#fff;border:1px solid #d7e7f0;border-top:5px solid #0799d2;border-radius:8px;padding:26px;">
              <p style="margin:0 0 8px;color:#0877a7;font-weight:800;">NeuroMap Kids</p>
              <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;">${escapeHtml(copy.title)}</h1>
              <p style="margin:0 0 10px;line-height:1.6;">${escapeHtml(greeting)}</p>
              <p style="margin:0 0 22px;line-height:1.6;">${escapeHtml(copy.intro)}</p>
              <h2 style="margin:0 0 12px;font-size:19px;">${escapeHtml(copy.order)}</h2>
              <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px;border-bottom:1px solid #e4edf3;color:#52677d;">${escapeHtml(copy.package)}</td><td style="padding:8px;border-bottom:1px solid #e4edf3;font-weight:700;">${escapeHtml(packageName)}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e4edf3;color:#52677d;">${escapeHtml(copy.amount)}</td><td style="padding:8px;border-bottom:1px solid #e4edf3;font-weight:700;">${escapeHtml(amount)}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e4edf3;color:#52677d;">${escapeHtml(copy.date)}</td><td style="padding:8px;border-bottom:1px solid #e4edf3;">${escapeHtml(purchaseDate)}</td></tr>
                <tr><td style="padding:8px;color:#52677d;">${escapeHtml(copy.reference)}</td><td style="padding:8px;overflow-wrap:anywhere;">${escapeHtml(sessionId)}</td></tr>
              </table>
              <h2 style="margin:24px 0 10px;font-size:19px;">${escapeHtml(copy.includes)}</h2>
              <ul style="margin:0 0 20px;padding-inline-start:22px;line-height:1.55;">${itemHtml}</ul>
              <section style="margin:18px 0;padding:16px;border:1px solid #f1d6b7;border-left:5px solid #ff7a00;border-radius:6px;background:#fff9f2;">
                <h2 style="margin:0 0 8px;font-size:17px;">${escapeHtml(copy.performanceTitle)}</h2>
                <p style="margin:0;line-height:1.62;font-size:14px;">${escapeHtml(copy.performance)}</p>
              </section>
              <section style="margin:18px 0;padding:16px;border:1px solid #cfe7f3;border-left:5px solid #72be00;border-radius:6px;background:#f4fbff;">
                <h2 style="margin:0 0 8px;font-size:17px;">${escapeHtml(copy.informationTitle)}</h2>
                <p style="margin:0;line-height:1.62;font-size:14px;">${escapeHtml(copy.information)}</p>
              </section>
              <h2 style="margin:24px 0 10px;font-size:17px;">${escapeHtml(copy.policies)}</h2>
              <p style="margin:7px 0;line-height:1.5;">${termsDocument}</p>
              <p style="margin:7px 0;line-height:1.5;">${privacyDocument}</p>
              <p style="margin:22px 0 5px;line-height:1.55;font-size:13px;color:#52677d;">${escapeHtml(copy.contact)}: <a href="mailto:${escapeHtml(contact)}" style="color:#0877a7;">${escapeHtml(contact)}</a></p>
              <p style="margin:5px 0 0;line-height:1.55;font-size:13px;color:#52677d;">${escapeHtml(copy.invoice)}</p>
            </section>
          </main>
        </body>
      </html>`,
    text: `${copy.title}\n\n${greeting}\n${copy.intro}\n\n${copy.order}\n${copy.package}: ${packageName}\n${copy.amount}: ${amount}\n${copy.date}: ${purchaseDate}\n${copy.reference}: ${sessionId}\n\n${copy.includes}\n${itemText}\n\n${copy.performanceTitle}\n${copy.performance}\n\n${copy.informationTitle}\n${copy.information}\n\n${copy.policies}\n${copy.terms}: ${termsUrl || "-"} (${termsVersion || "-"})\n${copy.privacy}: ${privacyUrl || "-"} (${privacyVersion || "-"})\n\n${copy.contact}: ${contact}\n${copy.invoice}`
  };
}

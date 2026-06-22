import { buildReportV2EmailContext } from "../services/report-v2.service.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSafeLang(lang) {
  const allowed = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  return allowed.includes(lang) ? lang : "en";
}

function getDomainLabel(domain, lang) {
  const labels = {
    hu: {
      ADHD: "figyelem és impulzivitás",
      ASD: "társas kommunikáció és rugalmasság",
      ANXIETY: "szorongásos jelzések",
      DEPRESSION: "hangulati jelzések",
      LEARNING: "tanulási nehézségek"
    },
    en: {
      ADHD: "attention and impulsivity",
      ASD: "social communication and flexibility",
      ANXIETY: "anxiety signals",
      DEPRESSION: "mood-related signals",
      LEARNING: "learning difficulties"
    },
    de: {
      ADHD: "Aufmerksamkeit und Impulsivität",
      ASD: "soziale Kommunikation und Flexibilität",
      ANXIETY: "Angstsignale",
      DEPRESSION: "stimmungsbezogene Signale",
      LEARNING: "Lernschwierigkeiten"
    },
    it: {
      ADHD: "attenzione e impulsività",
      ASD: "comunicazione sociale e flessibilità",
      ANXIETY: "segnali di ansia",
      DEPRESSION: "segnali legati all'umore",
      LEARNING: "difficoltà di apprendimento"
    },
    es: {
      ADHD: "atención e impulsividad",
      ASD: "comunicación social y flexibilidad",
      ANXIETY: "señales de ansiedad",
      DEPRESSION: "señales relacionadas con el estado de ánimo",
      LEARNING: "dificultades de aprendizaje"
    },
    zh: {
      ADHD: "注意力与冲动性",
      ASD: "社交沟通与灵活性",
      ANXIETY: "焦虑信号",
      DEPRESSION: "情绪相关信号",
      LEARNING: "学习困难"
    },
    ja: {
      ADHD: "注意と衝動性",
      ASD: "社会的コミュニケーションと柔軟性",
      ANXIETY: "不安のサイン",
      DEPRESSION: "気分に関連するサイン",
      LEARNING: "学習の困りごと"
    },
    ar: {
      ADHD: "الانتباه والاندفاعية",
      ASD: "التواصل الاجتماعي والمرونة",
      ANXIETY: "إشارات القلق",
      DEPRESSION: "إشارات مرتبطة بالمزاج",
      LEARNING: "صعوبات التعلم"
    },
    pl: {
      ADHD: "uwaga i impulsywność",
      ASD: "komunikacja społeczna i elastyczność",
      ANXIETY: "sygnały lęku",
      DEPRESSION: "sygnały związane z nastrojem",
      LEARNING: "trudności w uczeniu się"
    },
    pt: {
      ADHD: "atenção e impulsividade",
      ASD: "comunicação social e flexibilidade",
      ANXIETY: "sinais de ansiedade",
      DEPRESSION: "sinais relacionados com o humor",
      LEARNING: "dificuldades de aprendizagem"
    },
    fr: {
      ADHD: "attention et impulsivité",
      ASD: "communication sociale et flexibilité",
      ANXIETY: "signaux d'anxiété",
      DEPRESSION: "signaux liés à l'humeur",
      LEARNING: "difficultés d'apprentissage"
    }
  };

  const safeLang = getSafeLang(lang);
  return labels[safeLang]?.[domain] || labels.en[domain] || null;
}

function buildSubject(baseSubject, payload, lang) {
  const domain = payload?.detectedRisk || payload?.specificProfile?.kind || null;
  const label = getDomainLabel(domain, lang);
  const safeLang = getSafeLang(lang);
  const subjects = {
    hu: "NeuroMap Kids – elkészült a kiértékelés",
    en: "NeuroMap Kids – report ready",
    de: "NeuroMap Kids – Bericht ist fertig",
    it: "NeuroMap Kids – report pronto",
    es: "NeuroMap Kids – informe listo",
    zh: "NeuroMap Kids – 报告已准备好",
    ja: "NeuroMap Kids – レポートが完成しました",
    ar: "NeuroMap Kids – التقرير جاهز",
    pl: "NeuroMap Kids – raport jest gotowy",
    pt: "NeuroMap Kids – relatório pronto",
    fr: "NeuroMap Kids – rapport prêt"
  };

  if (!label) return baseSubject;

  return `${subjects[safeLang] || subjects.en}: ${label}`;
}

function getCustomerExperienceCopy(lang) {
  const safeLang = getSafeLang(lang);
  const copy = {
    en: {
      title: "Your PDF report is attached",
      body: "The attached PDF is designed as the clean, parent-friendly version of the report. You can save it, print it, or share it with a professional if needed.",
      nextTitle: "Suggested next steps",
      nextSteps: [
        "Read the quick overview first, then the age-aware recommendations.",
        "Write down 2-3 everyday situations where the pattern appears most clearly.",
        "If the signals feel strong or persistent, discuss the report with a qualified professional."
      ],
      readingTitle: "How to read the report",
      readingTips: [
        "Start with the main pattern and the strongest everyday examples.",
        "Use the recommendations as small experiments, not as a strict program.",
        "Revisit the report after a few days and mark what feels most useful."
      ],
      includedTitle: "What is included now",
      includedItems: [
        "The full personalized PDF is attached to this email.",
        "The report includes an age-aware overview and practical recommendations.",
        "You can keep the PDF for your own notes or share it with a qualified professional."
      ],
      followUpTitle: "2-3 day follow-up idea",
      followUpBody: "Choose one observation or suggestion from the report and watch how it appears over the next few days.",
      personalNote: "The report is most useful when you connect it to real moments at home, nursery, school, or daily routines.",
      reassurance: "You do not need to solve everything at once. One small, consistent change is often the best first step.",
      support: "Need help or did not receive the attachment? Reply to this email or contact info@neuromapkids.com."
    },
    hu: {
      title: "A PDF riport csatolva van",
      body: "A csatolt PDF a letisztult, szülőbarát riportverzió. Elmentheted, kinyomtathatod, vagy szükség esetén szakemberrel is megoszthatod.",
      nextTitle: "Javasolt következő lépések",
      nextSteps: [
        "Először a gyors áttekintést és a korosztályi javaslatokat olvasd el.",
        "Írd fel azt a 2-3 hétköznapi helyzetet, ahol a minta a legerősebben látszik.",
        "Ha a jelzések erősek vagy tartósak, érdemes szakemberrel is átbeszélni a riportot."
      ],
      readingTitle: "Hogyan olvasd a riportot?",
      readingTips: [
        "Kezdd a fő mintázattal és a legerősebb hétköznapi példákkal.",
        "A javaslatokat kis kipróbálható lépésekként kezeld, ne merev programként.",
        "Pár nap múlva nézd át újra, és jelöld meg, mi tűnt a leghasznosabbnak."
      ],
      includedTitle: "Mit kapsz most?",
      includedItems: [
        "A teljes, személyre szabott PDF riport csatolva van ehhez az emailhez.",
        "A riport tartalmaz korosztályi áttekintést és gyakorlati javaslatokat.",
        "A PDF-et megtarthatod saját jegyzeteléshez, vagy megoszthatod szakemberrel."
      ],
      followUpTitle: "2-3 napos utánkövetési ötlet",
      followUpBody: "Válassz ki egy megfigyelést vagy javaslatot a riportból, és figyeld meg, hogyan jelenik meg a következő napokban.",
      personalNote: "A riport akkor adja a legtöbbet, ha összekötöd a valós otthoni, óvodai, iskolai vagy mindennapi helyzetekkel.",
      reassurance: "Nem kell mindent egyszerre megoldani. Egy kicsi, következetes változtatás gyakran a legjobb első lépés.",
      support: "Segítség kell, vagy nem látszik a csatolmány? Válaszolj erre az emailre, vagy írj az info@neuromapkids.com címre."
    }
  };

  Object.assign(copy, {
    de: {
      title: "Dein PDF-Bericht ist angehängt",
      body: "Das PDF ist die klare, elternfreundliche Version des Berichts. Du kannst es speichern, ausdrucken oder bei Bedarf mit einer Fachperson teilen.",
      nextTitle: "Empfohlene nächste Schritte",
      nextSteps: [
        "Lies zuerst den kurzen Überblick und dann die altersbezogenen Empfehlungen.",
        "Notiere 2-3 Alltagssituationen, in denen das Muster besonders sichtbar ist.",
        "Wenn die Signale stark oder anhaltend wirken, besprich den Bericht mit einer qualifizierten Fachperson."
      ],
      readingTitle: "So liest du den Bericht",
      readingTips: [
        "Beginne mit dem Hauptmuster und den stärksten Alltagsbeispielen.",
        "Nutze Empfehlungen als kleine Experimente, nicht als starres Programm.",
        "Schau nach einigen Tagen erneut hinein und markiere, was am hilfreichsten war."
      ],
      includedTitle: "Was jetzt enthalten ist",
      includedItems: [
        "Der vollständige personalisierte PDF-Bericht ist an diese E-Mail angehängt.",
        "Der Bericht enthält eine altersbezogene Übersicht und praktische Empfehlungen.",
        "Du kannst das PDF für eigene Notizen behalten oder mit einer Fachperson teilen."
      ],
      followUpTitle: "Idee für die Nachbeobachtung nach 2-3 Tagen",
      followUpBody: "Wähle eine Beobachtung oder Empfehlung aus dem Bericht und achte in den nächsten Tagen darauf, wie sie im Alltag erscheint.",
      personalNote: "Der Bericht ist am nützlichsten, wenn du ihn mit echten Situationen zu Hause, in der Kita, Schule oder täglichen Routinen verbindest.",
      reassurance: "Du musst nicht alles auf einmal lösen. Ein kleiner, konsequenter Schritt ist oft der beste Anfang.",
      support: "Brauchst du Hilfe oder fehlt der Anhang? Antworte auf diese E-Mail oder schreibe an info@neuromapkids.com."
    },
    it: {
      title: "Il report PDF è allegato",
      body: "Il PDF è la versione chiara e adatta ai genitori del report. Puoi salvarlo, stamparlo o condividerlo con un professionista.",
      nextTitle: "Prossimi passi suggeriti",
      nextSteps: [
        "Leggi prima la panoramica, poi le raccomandazioni legate all'età.",
        "Annota 2-3 situazioni quotidiane in cui il modello è più evidente.",
        "Se i segnali sono forti o persistenti, parlane con un professionista qualificato."
      ],
      readingTitle: "Come leggere il report",
      readingTips: [
        "Inizia dal modello principale e dagli esempi quotidiani più forti.",
        "Usa i suggerimenti come piccoli esperimenti, non come un programma rigido.",
        "Rileggi il report dopo alcuni giorni e segna ciò che sembra più utile."
      ],
      includedTitle: "Che cosa contiene ora",
      includedItems: [
        "Il report PDF completo e personalizzato è allegato a questa email.",
        "Il report include una panoramica legata all'età e raccomandazioni pratiche.",
        "Puoi conservare il PDF per le tue note o condividerlo con un professionista qualificato."
      ],
      followUpTitle: "Idea di follow-up dopo 2-3 giorni",
      followUpBody: "Scegli un'osservazione o un suggerimento dal report e osserva come compare nei prossimi giorni.",
      personalNote: "Il report funziona meglio quando lo colleghi a momenti reali a casa, a scuola o nelle routine quotidiane.",
      reassurance: "Non devi risolvere tutto subito. Un piccolo cambiamento costante è spesso il miglior primo passo.",
      support: "Hai bisogno di aiuto o non vedi l'allegato? Rispondi a questa email o scrivi a info@neuromapkids.com."
    },
    es: {
      title: "Tu informe PDF está adjunto",
      body: "El PDF es la versión clara y fácil de usar para familias. Puedes guardarlo, imprimirlo o compartirlo con un profesional.",
      nextTitle: "Siguientes pasos sugeridos",
      nextSteps: [
        "Lee primero el resumen rápido y luego las recomendaciones por edad.",
        "Anota 2-3 situaciones diarias donde el patrón aparece con más claridad.",
        "Si las señales parecen fuertes o persistentes, comenta el informe con un profesional cualificado."
      ],
      readingTitle: "Cómo leer el informe",
      readingTips: [
        "Empieza por el patrón principal y los ejemplos cotidianos más claros.",
        "Usa las recomendaciones como pequeños experimentos, no como un programa rígido.",
        "Vuelve al informe después de unos días y marca lo que resulte más útil."
      ],
      includedTitle: "Qué incluye ahora",
      includedItems: [
        "El PDF personalizado completo está adjunto a este email.",
        "El informe incluye una visión por edad y recomendaciones prácticas.",
        "Puedes conservar el PDF para tus notas o compartirlo con un profesional cualificado."
      ],
      followUpTitle: "Idea de seguimiento a los 2-3 días",
      followUpBody: "Elige una observación o recomendación del informe y mira cómo aparece durante los próximos días.",
      personalNote: "El informe aporta más cuando lo conectas con momentos reales en casa, escuela o rutinas diarias.",
      reassurance: "No necesitas resolverlo todo de una vez. Un pequeño cambio constante suele ser el mejor primer paso.",
      support: "¿Necesitas ayuda o no ves el adjunto? Responde a este email o escribe a info@neuromapkids.com."
    },
    zh: {
      title: "PDF报告已作为附件发送",
      body: "附件中的PDF是清晰、适合家长阅读的报告版本。你可以保存、打印，或在需要时与专业人士分享。",
      nextTitle: "建议的下一步",
      nextSteps: [
        "先阅读快速概览，再看按年龄调整的建议。",
        "记录2-3个最能看出该模式的日常情境。",
        "如果信号强烈或持续，请与合格的专业人士讨论报告。"
      ],
      readingTitle: "如何阅读报告",
      readingTips: [
        "从主要模式和最清楚的日常例子开始。",
        "把建议当作小的尝试，而不是严格计划。",
        "几天后再次查看报告，并标记最有帮助的部分。"
      ],
      includedTitle: "现在包含的内容",
      includedItems: [
        "完整的个性化PDF报告已附在这封邮件中。",
        "报告包含按年龄调整的概览和实用建议。",
        "你可以保留PDF作为个人记录，也可以与合格的专业人士分享。"
      ],
      followUpTitle: "2-3天后的跟进想法",
      followUpBody: "从报告中选择一个观察点或建议，看看它在接下来几天如何出现。",
      personalNote: "当你把报告与家庭、幼儿园、学校或日常流程中的真实时刻联系起来时，它最有帮助。",
      reassurance: "你不需要一次解决所有问题。一个小而持续的改变通常是最好的第一步。",
      support: "需要帮助或没有看到附件？请回复此邮件，或联系 info@neuromapkids.com。"
    },
    ja: {
      title: "PDFレポートを添付しました",
      body: "添付のPDFは、保護者が読みやすいように整理したレポート版です。保存、印刷、必要に応じて専門家と共有できます。",
      nextTitle: "おすすめの次のステップ",
      nextSteps: [
        "まず簡単な概要を読み、次に年齢に合わせた提案を確認してください。",
        "パターンが最もはっきり出る日常場面を2-3個書き留めてください。",
        "サインが強い、または続く場合は、資格のある専門家に相談してください。"
      ],
      readingTitle: "レポートの読み方",
      readingTips: [
        "主なパターンと、日常で最もわかりやすい例から読み始めてください。",
        "提案は厳密なプログラムではなく、小さな試しとして使ってください。",
        "数日後にもう一度読み返し、役立った部分に印を付けてください。"
      ],
      includedTitle: "今回含まれている内容",
      includedItems: [
        "個別化されたPDFレポート全体をこのメールに添付しています。",
        "レポートには年齢に合わせた概要と実践的な提案が含まれます。",
        "PDFは手元の記録として保管したり、資格のある専門家と共有したりできます。"
      ],
      followUpTitle: "2-3日後のフォローアップ案",
      followUpBody: "レポートから観察点や提案を一つ選び、数日間どのように現れるかを見てください。",
      personalNote: "家庭、園、学校、日常の流れにある実際の場面と結びつけると、レポートはより役立ちます。",
      reassurance: "すべてを一度に解決する必要はありません。小さく一貫した変化が、最初の一歩として役立つことがよくあります。",
      support: "サポートが必要な場合、または添付が見当たらない場合は、このメールに返信するか info@neuromapkids.com までご連絡ください。"
    },
    ar: {
      title: "تم إرفاق تقرير PDF",
      body: "ملف PDF المرفق هو النسخة الواضحة والمناسبة للوالدين من التقرير. يمكنك حفظه أو طباعته أو مشاركته مع مختص عند الحاجة.",
      nextTitle: "خطوات مقترحة تالية",
      nextSteps: [
        "اقرأ الملخص السريع أولًا، ثم التوصيات المناسبة للعمر.",
        "اكتب 2-3 مواقف يومية يظهر فيها النمط بوضوح.",
        "إذا بدت الإشارات قوية أو مستمرة، ناقش التقرير مع مختص مؤهل."
      ],
      readingTitle: "كيف تقرأ التقرير",
      readingTips: [
        "ابدأ بالنمط الرئيسي وبأوضح الأمثلة اليومية.",
        "استخدم التوصيات كتجارب صغيرة، لا كبرنامج صارم.",
        "ارجع إلى التقرير بعد عدة أيام وحدد ما كان أكثر فائدة."
      ],
      includedTitle: "ما الذي يتضمنه الآن",
      includedItems: [
        "التقرير الكامل والمخصص بصيغة PDF مرفق بهذه الرسالة.",
        "يتضمن التقرير نظرة مناسبة للعمر وتوصيات عملية.",
        "يمكنك الاحتفاظ بملف PDF لملاحظاتك أو مشاركته مع مختص مؤهل."
      ],
      followUpTitle: "فكرة متابعة بعد 2-3 أيام",
      followUpBody: "اختر ملاحظة أو توصية واحدة من التقرير وراقب كيف تظهر خلال الأيام القادمة.",
      personalNote: "يكون التقرير أكثر فائدة عندما تربطه بمواقف حقيقية في البيت أو الروضة أو المدرسة أو الروتين اليومي.",
      reassurance: "لا تحتاج إلى حل كل شيء دفعة واحدة. غالبًا ما تكون خطوة صغيرة وثابتة أفضل بداية.",
      support: "هل تحتاج إلى مساعدة أو لم يظهر المرفق؟ رد على هذه الرسالة أو تواصل عبر info@neuromapkids.com."
    },
    pl: {
      title: "Raport PDF jest załączony",
      body: "PDF to przejrzysta, przyjazna dla rodzica wersja raportu. Możesz go zapisać, wydrukować lub pokazać specjaliście.",
      nextTitle: "Sugerowane kolejne kroki",
      nextSteps: [
        "Najpierw przeczytaj szybki przegląd, potem zalecenia dla wieku dziecka.",
        "Zapisz 2-3 codzienne sytuacje, w których wzorzec jest najbardziej widoczny.",
        "Jeśli sygnały są silne lub stałe, omów raport z wykwalifikowanym specjalistą."
      ],
      readingTitle: "Jak czytać raport",
      readingTips: [
        "Zacznij od głównego wzorca i najsilniejszych przykładów z codzienności.",
        "Traktuj wskazówki jak małe eksperymenty, nie sztywny program.",
        "Wróć do raportu po kilku dniach i zaznacz, co było najbardziej pomocne."
      ],
      includedTitle: "Co zawiera raport",
      includedItems: [
        "Pełny, spersonalizowany raport PDF jest załączony do tego emaila.",
        "Raport zawiera przegląd dopasowany do wieku i praktyczne zalecenia.",
        "Możesz zachować PDF do własnych notatek albo udostępnić go specjaliście."
      ],
      followUpTitle: "Pomysł na obserwację po 2-3 dniach",
      followUpBody: "Wybierz jedną obserwację lub wskazówkę z raportu i zobacz, jak pojawia się w kolejnych dniach.",
      personalNote: "Raport jest najbardziej użyteczny, gdy łączysz go z realnymi sytuacjami w domu, szkole lub codziennych rutynach.",
      reassurance: "Nie trzeba rozwiązać wszystkiego od razu. Jeden mały, konsekwentny krok często jest najlepszym początkiem.",
      support: "Potrzebujesz pomocy albo nie widzisz załącznika? Odpowiedz na ten email lub napisz na info@neuromapkids.com."
    },
    pt: {
      title: "O relatório PDF está anexado",
      body: "O PDF é a versão clara e amigável para pais do relatório. Pode guardar, imprimir ou partilhar com um profissional.",
      nextTitle: "Próximos passos sugeridos",
      nextSteps: [
        "Leia primeiro a visão rápida e depois as recomendações por idade.",
        "Anote 2-3 situações do dia a dia em que o padrão aparece com mais clareza.",
        "Se os sinais forem fortes ou persistentes, fale sobre o relatório com um profissional qualificado."
      ],
      readingTitle: "Como ler o relatório",
      readingTips: [
        "Comece pelo padrão principal e pelos exemplos diários mais claros.",
        "Use as recomendações como pequenos testes, não como um programa rígido.",
        "Volte ao relatório depois de alguns dias e marque o que pareceu mais útil."
      ],
      includedTitle: "O que está incluído agora",
      includedItems: [
        "O relatório PDF completo e personalizado está anexado a este email.",
        "O relatório inclui uma visão por idade e recomendações práticas.",
        "Pode guardar o PDF para as suas notas ou partilhá-lo com um profissional qualificado."
      ],
      followUpTitle: "Ideia de acompanhamento em 2-3 dias",
      followUpBody: "Escolha uma observação ou sugestão do relatório e veja como aparece nos próximos dias.",
      personalNote: "O relatório é mais útil quando ligado a momentos reais em casa, escola ou rotinas diárias.",
      reassurance: "Não precisa resolver tudo de uma vez. Uma pequena mudança consistente costuma ser o melhor primeiro passo.",
      support: "Precisa de ajuda ou não recebeu o anexo? Responda a este email ou escreva para info@neuromapkids.com."
    },
    fr: {
      title: "Votre rapport PDF est joint",
      body: "Le PDF est la version claire et adaptée aux parents du rapport. Vous pouvez l'enregistrer, l'imprimer ou le partager avec un professionnel.",
      nextTitle: "Prochaines étapes suggérées",
      nextSteps: [
        "Lisez d'abord l'aperçu rapide, puis les recommandations adaptées à l'âge.",
        "Notez 2-3 situations quotidiennes où le schéma apparaît le plus clairement.",
        "Si les signaux semblent forts ou persistants, discutez du rapport avec un professionnel qualifié."
      ],
      readingTitle: "Comment lire le rapport",
      readingTips: [
        "Commencez par le schéma principal et les exemples quotidiens les plus parlants.",
        "Utilisez les recommandations comme de petites expériences, pas comme un programme rigide.",
        "Relisez le rapport après quelques jours et marquez ce qui semble le plus utile."
      ],
      includedTitle: "Ce qui est inclus maintenant",
      includedItems: [
        "Le PDF personnalisé complet est joint à cet email.",
        "Le rapport comprend une vue adaptée à l'âge et des recommandations pratiques.",
        "Vous pouvez conserver le PDF pour vos notes ou le partager avec un professionnel qualifié."
      ],
      followUpTitle: "Idée de suivi après 2-3 jours",
      followUpBody: "Choisissez une observation ou une recommandation du rapport et observez comment elle apparaît dans les prochains jours.",
      personalNote: "Le rapport est plus utile quand vous le reliez à des moments réels à la maison, à l'école ou dans les routines.",
      reassurance: "Vous n'avez pas besoin de tout résoudre en une fois. Un petit changement régulier est souvent le meilleur début.",
      support: "Besoin d'aide ou pièce jointe manquante ? Répondez à cet email ou contactez info@neuromapkids.com."
    }
  });

  return copy[safeLang] || copy.en;
}

export function buildReportEmail({ lang, name, reportText, payload = null }) {
  const safeLang = getSafeLang(lang);
  const safeName = escapeHtml(name || "");
  const safeReport = escapeHtml(reportText || "").replaceAll("\n", "<br />");
  const reportV2 = buildReportV2EmailContext(payload || {}, safeLang);
  const ageRecommendationHtml = (reportV2.recommendations || [])
    .slice(0, 3)
    .map((item) => `<li style="margin:0 0 8px 0;">${escapeHtml(item)}</li>`)
    .join("");
  const ageRecommendationText = (reportV2.recommendations || [])
    .slice(0, 3)
    .map((item) => `- ${item}`)
    .join("\n");
  const customerExperience = getCustomerExperienceCopy(safeLang);
  const customerExperienceStepsHtml = customerExperience.nextSteps
    .map((item) => `<li style="margin:0 0 8px 0;">${escapeHtml(item)}</li>`)
    .join("");
  const customerExperienceReadingHtml = customerExperience.readingTips
    .map((item) => `<li style="margin:0 0 8px 0;">${escapeHtml(item)}</li>`)
    .join("");
  const includedTitle = customerExperience.includedTitle || "What is included now";
  const includedItems = Array.isArray(customerExperience.includedItems)
    ? customerExperience.includedItems
    : [
        "The full personalized PDF is attached to this email.",
        "The report includes an age-aware overview and practical recommendations.",
        "You can keep the PDF for your own notes or share it with a qualified professional."
      ];
  const followUpTitle = customerExperience.followUpTitle || "2-3 day follow-up idea";
  const followUpBody = customerExperience.followUpBody || "Choose one observation or suggestion from the report and watch how it appears over the next few days.";
  const microPlanTitle = customerExperience.microPlanTitle || (safeLang === "hu" ? "Mini 3 napos terv" : "Mini 3-day plan");
  const microPlanItems = Array.isArray(customerExperience.microPlanItems)
    ? customerExperience.microPlanItems
    : safeLang === "hu"
      ? [
          "1. nap: olvasd el a fő mintázatot, és válassz ki egyetlen helyzetet, amit megfigyelsz.",
          "2. nap: próbálj ki egy kis, könnyen tartható javaslatot a riportból.",
          "3. nap: jegyezd fel, mi enyhítette vagy erősítette a jelzést."
        ]
      : [
          "Day 1: read the main pattern and choose one everyday situation to observe.",
          "Day 2: try one small, easy recommendation from the report.",
          "Day 3: note what seemed to ease or intensify the signal."
        ];
  const customerExperienceIncludedHtml = includedItems
    .map((item) => `<li style="margin:0 0 8px 0;">${escapeHtml(item)}</li>`)
    .join("");
  const microPlanHtml = microPlanItems
    .map((item) => `<li style="margin:0 0 8px 0;">${escapeHtml(item)}</li>`)
    .join("");
  const customerExperienceText = [
    customerExperience.title,
    customerExperience.body,
    includedTitle,
    ...includedItems.map((item) => `- ${item}`),
    customerExperience.nextTitle,
    ...customerExperience.nextSteps.map((item) => `- ${item}`),
    customerExperience.readingTitle,
    ...customerExperience.readingTips.map((item) => `- ${item}`),
    microPlanTitle,
    ...microPlanItems.map((item) => `- ${item}`),
    followUpTitle,
    followUpBody,
    customerExperience.personalNote,
    customerExperience.reassurance,
    customerExperience.support
  ].filter(Boolean).join("\n");

  const content = {
    hu: {
      subject: "NeuroMap Kids – elkészült a kiértékelés",
      preheader: "A részletes összefoglaló elkészült és ebben az emailben találod.",
      greeting: "Kedves Szülő,",
      intro: safeName
        ? `${safeName} kérdőíves kiértékelése elkészült. Az alábbi összefoglaló egy strukturált, előzetes értelmezés, amely segíthet jobban átlátni a megfigyelt mintázatokat.`
        : "A kérdőíves kiértékelés elkészült. Az alábbi összefoglaló egy strukturált, előzetes értelmezés, amely segíthet jobban átlátni a megfigyelt mintázatokat.",
      reportTitle: "Részletes összefoglaló",
      closing: "Köszönjük, hogy a NeuroMap Kids szolgáltatást választottad.",
      signature: "NeuroMap Kids",
      footer: "Ez az anyag nem minősül diagnózisnak, és nem helyettesíti a személyes szakértői vizsgálatot.",
      plainIntro: safeName
        ? `${safeName} kérdőíves kiértékelése elkészült.`
        : "A kérdőíves kiértékelés elkészült."
    },

    en: {
      subject: "NeuroMap Kids – your report is ready",
      preheader: "Your detailed summary is ready and included in this email.",
      greeting: "Dear Parent,",
      intro: safeName
        ? `The questionnaire-based report for ${safeName} is now ready. The summary below is a structured preliminary interpretation designed to help you better understand the observed patterns.`
        : "The questionnaire-based report is now ready. The summary below is a structured preliminary interpretation designed to help you better understand the observed patterns.",
      reportTitle: "Detailed summary",
      closing: "Thank you for choosing NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "This material is not a diagnosis and does not replace an in-person specialist assessment.",
      plainIntro: safeName
        ? `The questionnaire-based report for ${safeName} is now ready.`
        : "The questionnaire-based report is now ready."
    },

    de: {
      subject: "NeuroMap Kids – deine Auswertung ist fertig",
      preheader: "Die ausführliche Zusammenfassung ist fertig und in dieser E-Mail enthalten.",
      greeting: "Liebe Eltern,",
      intro: safeName
        ? `Die fragebogenbasierte Auswertung für ${safeName} ist fertig. Die folgende Zusammenfassung ist eine strukturierte vorläufige Einordnung, die helfen soll, beobachtete Muster besser zu verstehen.`
        : "Die fragebogenbasierte Auswertung ist fertig. Die folgende Zusammenfassung ist eine strukturierte vorläufige Einordnung, die helfen soll, beobachtete Muster besser zu verstehen.",
      reportTitle: "Ausführliche Zusammenfassung",
      closing: "Vielen Dank, dass du NeuroMap Kids gewählt hast.",
      signature: "NeuroMap Kids",
      footer: "Dieses Material ist keine Diagnose und ersetzt keine persönliche fachliche Untersuchung.",
      plainIntro: safeName
        ? `Die fragebogenbasierte Auswertung für ${safeName} ist fertig.`
        : "Die fragebogenbasierte Auswertung ist fertig."
    },

    it: {
      subject: "NeuroMap Kids – il tuo report è pronto",
      preheader: "Il riepilogo dettagliato è pronto ed è incluso in questa email.",
      greeting: "Gentile genitore,",
      intro: safeName
        ? `La valutazione basata sul questionario per ${safeName} è pronta. Il riepilogo seguente è un'interpretazione preliminare strutturata pensata per aiutarti a comprendere meglio i modelli osservati.`
        : "La valutazione basata sul questionario è pronta. Il riepilogo seguente è un'interpretazione preliminare strutturata pensata per aiutarti a comprendere meglio i modelli osservati.",
      reportTitle: "Riepilogo dettagliato",
      closing: "Grazie per aver scelto NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "Questo materiale non costituisce una diagnosi e non sostituisce una valutazione specialistica in presenza.",
      plainIntro: safeName
        ? `La valutazione basata sul questionario per ${safeName} è pronta.`
        : "La valutazione basata sul questionario è pronta."
    },

    es: {
      subject: "NeuroMap Kids – tu informe está listo",
      preheader: "El resumen detallado está listo y se incluye en este correo.",
      greeting: "Estimado/a padre/madre:",
      intro: safeName
        ? `La evaluación basada en el cuestionario para ${safeName} ya está lista. El resumen que aparece a continuación es una interpretación preliminar estructurada para ayudarte a comprender mejor los patrones observados.`
        : "La evaluación basada en el cuestionario ya está lista. El resumen que aparece a continuación es una interpretación preliminar estructurada para ayudarte a comprender mejor los patrones observados.",
      reportTitle: "Resumen detallado",
      closing: "Gracias por elegir NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "Este material no constituye un diagnóstico y no sustituye una evaluación presencial por un especialista.",
      plainIntro: safeName
        ? `La evaluación basada en el cuestionario para ${safeName} ya está lista.`
        : "La evaluación basada en el cuestionario ya está lista."
    },

    zh: {
      subject: "NeuroMap Kids – 您的报告已生成",
      preheader: "详细摘要已准备好，并包含在这封邮件中。",
      greeting: "亲爱的家长，",
      intro: safeName
        ? `${safeName} 的问卷评估结果已生成。以下内容是一份结构化的初步解读，旨在帮助您更好地理解所观察到的模式。`
        : "问卷评估结果已生成。以下内容是一份结构化的初步解读，旨在帮助您更好地理解所观察到的模式。",
      reportTitle: "详细摘要",
      closing: "感谢您选择 NeuroMap Kids。",
      signature: "NeuroMap Kids",
      footer: "本材料不构成医学诊断，也不能替代线下专业评估。",
      plainIntro: safeName
        ? `${safeName} 的问卷评估结果已生成。`
        : "问卷评估结果已生成。"
    },

    ja: {
      subject: "NeuroMap Kids – レポートの準備ができました",
      preheader: "詳細な要約が完成し、このメールに含まれています。",
      greeting: "保護者の皆さまへ",
      intro: safeName
        ? `${safeName} の質問票に基づくレポートが完成しました。以下の要約は、観察された傾向をより理解しやすくするための構造化された予備的な解釈です。`
        : "質問票に基づくレポートが完成しました。以下の要約は、観察された傾向をより理解しやすくするための構造化された予備的な解釈です。",
      reportTitle: "詳細サマリー",
      closing: "NeuroMap Kids をご利用いただきありがとうございます。",
      signature: "NeuroMap Kids",
      footer: "この内容は診断ではなく、対面での専門評価に代わるものではありません。",
      plainIntro: safeName
        ? `${safeName} の質問票に基づくレポートが完成しました。`
        : "質問票に基づくレポートが完成しました。"
    },

    ar: {
      subject: "NeuroMap Kids – تقريرك جاهز",
      preheader: "الملخص التفصيلي جاهز ومضمن في هذه الرسالة.",
      greeting: "عزيزي ولي الأمر،",
      intro: safeName
        ? `أصبح التقرير المبني على الاستبيان الخاص بـ ${safeName} جاهزًا الآن. الملخص أدناه هو قراءة أولية منظمة تساعدك على فهم الأنماط الملحوظة بشكل أوضح.`
        : "أصبح التقرير المبني على الاستبيان جاهزًا الآن. الملخص أدناه هو قراءة أولية منظمة تساعدك على فهم الأنماط الملحوظة بشكل أوضح.",
      reportTitle: "الملخص التفصيلي",
      closing: "شكرًا لاختيارك NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "هذه المادة ليست تشخيصًا ولا تغني عن التقييم المباشر من مختص مؤهل.",
      plainIntro: safeName
        ? `أصبح التقرير المبني على الاستبيان الخاص بـ ${safeName} جاهزًا الآن.`
        : "أصبح التقرير المبني على الاستبيان جاهزًا الآن."
    },

    pl: {
      subject: "NeuroMap Kids – raport jest gotowy",
      preheader: "Szczegółowe podsumowanie jest gotowe i znajduje się w tej wiadomości.",
      greeting: "Drogi Rodzicu,",
      intro: safeName
        ? `Raport oparty na kwestionariuszu dla ${safeName} jest gotowy. Poniższe podsumowanie stanowi uporządkowaną, wstępną interpretację, która może pomóc lepiej zrozumieć zaobserwowane wzorce.`
        : "Raport oparty na kwestionariuszu jest gotowy. Poniższe podsumowanie stanowi uporządkowaną, wstępną interpretację, która może pomóc lepiej zrozumieć zaobserwowane wzorce.",
      reportTitle: "Szczegółowe podsumowanie",
      closing: "Dziękujemy za wybranie NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "Ten materiał nie stanowi diagnozy i nie zastępuje osobistej oceny specjalisty.",
      plainIntro: safeName
        ? `Raport oparty na kwestionariuszu dla ${safeName} jest gotowy.`
        : "Raport oparty na kwestionariuszu jest gotowy."
    },

    pt: {
      subject: "NeuroMap Kids – o seu relatório está pronto",
      preheader: "O resumo detalhado está pronto e incluído neste email.",
      greeting: "Prezado(a) responsável,",
      intro: safeName
        ? `O relatório baseado no questionário de ${safeName} está pronto. O resumo abaixo é uma interpretação preliminar estruturada para ajudar você a compreender melhor os padrões observados.`
        : "O relatório baseado no questionário está pronto. O resumo abaixo é uma interpretação preliminar estruturada para ajudar você a compreender melhor os padrões observados.",
      reportTitle: "Resumo detalhado",
      closing: "Obrigado por escolher a NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "Este material não constitui diagnóstico e não substitui uma avaliação presencial feita por um especialista.",
      plainIntro: safeName
        ? `O relatório baseado no questionário de ${safeName} está pronto.`
        : "O relatório baseado no questionário está pronto."
    },

    fr: {
      subject: "NeuroMap Kids – votre rapport est prêt",
      preheader: "Le résumé détaillé est prêt et inclus dans cet email.",
      greeting: "Cher parent,",
      intro: safeName
        ? `Le rapport basé sur le questionnaire pour ${safeName} est maintenant prêt. Le résumé ci-dessous est une interprétation préliminaire structurée conçue pour vous aider à mieux comprendre les schémas observés.`
        : "Le rapport basé sur le questionnaire est maintenant prêt. Le résumé ci-dessous est une interprétation préliminaire structurée conçue pour vous aider à mieux comprendre les schémas observés.",
      reportTitle: "Résumé détaillé",
      closing: "Merci d'avoir choisi NeuroMap Kids.",
      signature: "NeuroMap Kids",
      footer: "Ce document ne constitue pas un diagnostic et ne remplace pas une évaluation spécialisée en présentiel.",
      plainIntro: safeName
        ? `Le rapport basé sur le questionnaire pour ${safeName} est maintenant prêt.`
        : "Le rapport basé sur le questionnaire est maintenant prêt."
    }
  };

  const t = content[safeLang] || content.en;
  const subject = buildSubject(t.subject, payload, safeLang);

  const html = `
<!doctype html>
<html lang="${safeLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(t.preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:760px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(15,23,42,0.08);">
            
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#111827 0%,#1f2937 100%);color:#ffffff;">
                <div style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">
                  NeuroMap Kids
                </div>
                <div style="font-family:Arial,sans-serif;font-size:28px;line-height:1.25;font-weight:700;margin-top:10px;">
                  ${escapeHtml(subject)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 18px 32px;">
                <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#1f2937;">
                  <p style="margin:0 0 16px 0;">${escapeHtml(t.greeting)}</p>
                  <p style="margin:0 0 16px 0;">${escapeHtml(t.intro)}</p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 24px 32px;">
                <div style="border:1px solid rgba(17,151,213,0.18);border-radius:18px;background:#f1faff;overflow:hidden;">
                  <div style="padding:16px 20px;border-bottom:1px solid rgba(17,151,213,0.14);font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#102033;">
                    ${escapeHtml(customerExperience.title)}
                  </div>
                  <div style="padding:18px 20px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#334155;">
                    <p style="margin:0 0 12px 0;">${escapeHtml(customerExperience.body)}</p>
                    <div style="font-weight:700;margin:0 0 8px 0;color:#1f2937;">${escapeHtml(includedTitle)}</div>
                    <ul style="margin:0 0 14px 0;padding-left:20px;">${customerExperienceIncludedHtml}</ul>
                    <div style="font-weight:700;margin:0 0 8px 0;color:#1f2937;">${escapeHtml(customerExperience.nextTitle)}</div>
                    <ul style="margin:0 0 14px 0;padding-left:20px;">${customerExperienceStepsHtml}</ul>
                    <div style="font-weight:700;margin:0 0 8px 0;color:#1f2937;">${escapeHtml(customerExperience.readingTitle)}</div>
                    <ul style="margin:0 0 14px 0;padding-left:20px;">${customerExperienceReadingHtml}</ul>
                    <div style="margin:0 0 14px 0;padding:12px 14px;border-radius:14px;background:#fff7ed;border:1px solid rgba(255,122,0,0.20);">
                      <div style="font-weight:700;margin:0 0 8px 0;color:#7a3b00;">${escapeHtml(microPlanTitle)}</div>
                      <ol style="margin:0;padding-left:20px;">${microPlanHtml}</ol>
                    </div>
                    <p style="margin:0 0 12px 0;padding:10px 12px;border-radius:12px;background:#f3fff8;color:#23443a;font-size:13px;"><strong>${escapeHtml(followUpTitle)}:</strong> ${escapeHtml(followUpBody)}</p>
                    ${customerExperience.personalNote ? `<p style="margin:0 0 12px 0;padding:10px 12px;border-radius:12px;background:#ffffff;color:#334155;font-size:13px;">${escapeHtml(customerExperience.personalNote)}</p>` : ""}
                    <p style="margin:0 0 12px 0;color:#0b6f9f;font-size:13px;font-weight:700;">${escapeHtml(customerExperience.reassurance)}</p>
                    <p style="margin:0;color:#506780;font-size:13px;">${escapeHtml(customerExperience.support)}</p>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 24px 32px;">
                <div style="border:1px solid rgba(114,190,0,0.28);border-radius:18px;background:#f8fff4;overflow:hidden;">
                  <div style="padding:14px 20px;border-bottom:1px solid rgba(114,190,0,0.18);font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1f2937;">
                    ${escapeHtml(reportV2.title)}
                  </div>
                  <div style="padding:18px 20px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#334155;">
                    <p style="margin:0 0 10px 0;"><strong>${escapeHtml(reportV2.ageBandLabel)}</strong></p>
                    <p style="margin:0 0 12px 0;">${escapeHtml(reportV2.interpretation)}</p>
                    ${
                      ageRecommendationHtml
                        ? `<div style="font-weight:700;margin:0 0 8px 0;color:#1f2937;">${escapeHtml(reportV2.recommendationTitle)}</div><ul style="margin:0;padding-left:20px;">${ageRecommendationHtml}</ul>`
                        : ""
                    }
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 24px 32px;">
                <div style="border:1px solid rgba(15,23,42,0.08);border-radius:18px;background:#fbfcfe;overflow:hidden;">
                  <div style="padding:16px 20px;background:#eef2ff;border-bottom:1px solid rgba(15,23,42,0.08);font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#111827;">
                    ${escapeHtml(t.reportTitle)}
                  </div>
                  <div style="padding:20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.8;color:#334155;word-break:break-word;">
                    ${safeReport}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 28px 32px;">
                <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">
                  <p style="margin:0 0 12px 0;">${escapeHtml(t.closing)}</p>
                  <p style="margin:0;font-weight:700;color:#111827;">${escapeHtml(t.signature)}</p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 28px 32px;border-top:1px solid rgba(15,23,42,0.08);background:#fafafa;">
                <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#667085;">
                  ${escapeHtml(t.footer)}
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  const text = `
NeuroMap Kids

${t.plainIntro}

${customerExperienceText}

${reportV2.title}
${reportV2.ageBandLabel}
${reportV2.interpretation}
${ageRecommendationText}

${reportText || ""}

${t.footer}
  `.trim();

  return {
    subject,
    html,
    text
  };
}

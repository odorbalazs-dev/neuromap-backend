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
    }
  };

  const safeLang = getSafeLang(lang);
  return labels[safeLang]?.[domain] || labels.en[domain] || null;
}

function buildSubject(baseSubject, payload, lang) {
  const domain = payload?.detectedRisk || payload?.specificProfile?.kind || null;
  const label = getDomainLabel(domain, lang);

  if (!label) return baseSubject;

  if (getSafeLang(lang) === "hu") {
    return `NeuroMap Kids – elkészült a kiértékelés: ${label}`;
  }

  return `NeuroMap Kids – report ready: ${label}`;
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
      title: "Dein PDF-Bericht ist angehaengt",
      body: "Das PDF ist die klare, elternfreundliche Version des Berichts. Du kannst es speichern, ausdrucken oder bei Bedarf mit einer Fachperson teilen.",
      nextTitle: "Empfohlene naechste Schritte",
      nextSteps: [
        "Lies zuerst den kurzen Ueberblick und dann die altersbezogenen Empfehlungen.",
        "Notiere 2-3 Alltagssituationen, in denen das Muster besonders sichtbar ist.",
        "Wenn die Signale stark oder anhaltend wirken, besprich den Bericht mit einer qualifizierten Fachperson."
      ],
      readingTitle: "So liest du den Bericht",
      readingTips: [
        "Beginne mit dem Hauptmuster und den staerksten Alltagsbeispielen.",
        "Nutze Empfehlungen als kleine Experimente, nicht als starres Programm.",
        "Schau nach einigen Tagen erneut hinein und markiere, was am hilfreichsten war."
      ],
      personalNote: "Der Bericht ist am nuetzlichsten, wenn du ihn mit echten Situationen zu Hause, in Kita, Schule oder Routinen verbindest.",
      reassurance: "Du musst nicht alles auf einmal loesen. Ein kleiner, konsequenter Schritt ist oft der beste Anfang.",
      support: "Brauchst du Hilfe oder fehlt der Anhang? Antworte auf diese E-Mail oder schreibe an info@neuromapkids.com."
    },
    it: {
      title: "Il report PDF e allegato",
      body: "Il PDF e la versione chiara e adatta ai genitori del report. Puoi salvarlo, stamparlo o condividerlo con un professionista.",
      nextTitle: "Prossimi passi suggeriti",
      nextSteps: [
        "Leggi prima la panoramica, poi le raccomandazioni per eta.",
        "Annota 2-3 situazioni quotidiane in cui il modello e piu evidente.",
        "Se i segnali sono forti o persistenti, parlane con un professionista qualificato."
      ],
      readingTitle: "Come leggere il report",
      readingTips: [
        "Inizia dal modello principale e dagli esempi quotidiani piu forti.",
        "Usa i suggerimenti come piccoli esperimenti, non come programma rigido.",
        "Rileggi il report dopo alcuni giorni e segna cio che sembra piu utile."
      ],
      personalNote: "Il report funziona meglio quando lo colleghi a momenti reali a casa, a scuola o nelle routine quotidiane.",
      reassurance: "Non devi risolvere tutto subito. Un piccolo cambiamento costante e spesso il miglior primo passo.",
      support: "Hai bisogno di aiuto o non vedi l'allegato? Rispondi a questa email o scrivi a info@neuromapkids.com."
    },
    es: {
      title: "Tu informe PDF esta adjunto",
      body: "El PDF es la version clara y facil de usar para familias. Puedes guardarlo, imprimirlo o compartirlo con un profesional.",
      nextTitle: "Siguientes pasos sugeridos",
      nextSteps: [
        "Lee primero el resumen rapido y luego las recomendaciones por edad.",
        "Anota 2-3 situaciones diarias donde el patron aparece con mas claridad.",
        "Si las senales parecen fuertes o persistentes, comenta el informe con un profesional cualificado."
      ],
      readingTitle: "Como leer el informe",
      readingTips: [
        "Empieza por el patron principal y los ejemplos cotidianos mas claros.",
        "Usa las recomendaciones como pequenos experimentos, no como un programa rigido.",
        "Vuelve al informe despues de unos dias y marca lo que resulte mas util."
      ],
      personalNote: "El informe aporta mas cuando lo conectas con momentos reales en casa, escuela o rutinas diarias.",
      reassurance: "No necesitas resolverlo todo de una vez. Un pequeno cambio constante suele ser el mejor primer paso.",
      support: "Necesitas ayuda o no ves el adjunto? Responde a este email o escribe a info@neuromapkids.com."
    },
    pl: {
      title: "Raport PDF jest zalaczony",
      body: "PDF to przejrzysta, przyjazna dla rodzica wersja raportu. Mozesz go zapisac, wydrukowac lub pokazac specjalisce.",
      nextTitle: "Sugerowane kolejne kroki",
      nextSteps: [
        "Najpierw przeczytaj szybki przeglad, potem zalecenia dla wieku dziecka.",
        "Zapisz 2-3 codzienne sytuacje, w ktorych wzorzec jest najbardziej widoczny.",
        "Jesli sygnaly sa silne lub stale, omow raport z wykwalifikowanym specjalista."
      ],
      readingTitle: "Jak czytac raport",
      readingTips: [
        "Zacznij od glownego wzorca i najsilniejszych przykladow z codziennosci.",
        "Traktuj wskazowki jak male eksperymenty, nie sztywny program.",
        "Wroc do raportu po kilku dniach i zaznacz, co bylo najbardziej pomocne."
      ],
      personalNote: "Raport jest najbardziej uzyteczny, gdy laczysz go z realnymi sytuacjami w domu, szkole lub codziennych rutynach.",
      reassurance: "Nie trzeba rozwiazac wszystkiego od razu. Jeden maly, konsekwentny krok czesto jest najlepszym poczatkiem.",
      support: "Potrzebujesz pomocy albo nie widzisz zalacznika? Odpowiedz na ten email lub napisz na info@neuromapkids.com."
    },
    pt: {
      title: "O relatorio PDF esta anexado",
      body: "O PDF e a versao clara e amigavel para pais do relatorio. Pode guardar, imprimir ou partilhar com um profissional.",
      nextTitle: "Proximos passos sugeridos",
      nextSteps: [
        "Leia primeiro a visao rapida e depois as recomendacoes por idade.",
        "Anote 2-3 situacoes do dia a dia em que o padrao aparece com mais clareza.",
        "Se os sinais forem fortes ou persistentes, fale sobre o relatorio com um profissional qualificado."
      ],
      readingTitle: "Como ler o relatorio",
      readingTips: [
        "Comece pelo padrao principal e pelos exemplos diarios mais claros.",
        "Use as recomendacoes como pequenos testes, nao como um programa rigido.",
        "Volte ao relatorio depois de alguns dias e marque o que pareceu mais util."
      ],
      personalNote: "O relatorio e mais util quando ligado a momentos reais em casa, escola ou rotinas diarias.",
      reassurance: "Nao precisa resolver tudo de uma vez. Uma pequena mudanca consistente costuma ser o melhor primeiro passo.",
      support: "Precisa de ajuda ou nao recebeu o anexo? Responda a este email ou escreva para info@neuromapkids.com."
    },
    fr: {
      title: "Votre rapport PDF est joint",
      body: "Le PDF est la version claire et adaptee aux parents du rapport. Vous pouvez l'enregistrer, l'imprimer ou le partager avec un professionnel.",
      nextTitle: "Prochaines etapes suggerees",
      nextSteps: [
        "Lisez d'abord l'aperçu rapide, puis les recommandations par age.",
        "Notez 2-3 situations quotidiennes ou le schema apparait le plus clairement.",
        "Si les signaux semblent forts ou persistants, discutez du rapport avec un professionnel qualifie."
      ],
      readingTitle: "Comment lire le rapport",
      readingTips: [
        "Commencez par le schema principal et les exemples quotidiens les plus forts.",
        "Utilisez les recommandations comme de petites experiences, pas comme un programme rigide.",
        "Relisez le rapport apres quelques jours et marquez ce qui semble le plus utile."
      ],
      personalNote: "Le rapport est plus utile quand vous le reliez a des moments reels a la maison, a l'ecole ou dans les routines.",
      reassurance: "Vous n'avez pas besoin de tout resoudre en une fois. Un petit changement regulier est souvent le meilleur debut.",
      support: "Besoin d'aide ou piece jointe manquante? Repondez a cet email ou contactez info@neuromapkids.com."
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

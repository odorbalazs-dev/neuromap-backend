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

export function buildReportEmail({ lang, name, reportText }) {
  const safeLang = getSafeLang(lang);
  const safeName = escapeHtml(name || "");
  const safeReport = escapeHtml(reportText || "").replaceAll("\n", "<br />");

  const content = {
    hu: {
      subject: "NeuroMap Kids – elkészült a kiértékelés",
      preheader: "A részletes összefoglaló elkészült és ebben az emailben találod.",
      greeting: safeName ? `Kedves Szülő,` : "Kedves Szülő,",
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

  const html = `
<!doctype html>
<html lang="${safeLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(t.subject)}</title>
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
                  ${escapeHtml(t.subject)}
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

${reportText || ""}

${t.footer}
  `.trim();

  return {
    subject: t.subject,
    html,
    text
  };
}
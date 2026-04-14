function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const ALLOWED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function getSafeLang(lang) {
  return ALLOWED_LANGS.includes(lang) ? lang : "en";
}

export function buildReportEmail({ lang, name, reportText }) {
  const safeLang = getSafeLang(lang);
  const safeName = escapeHtml(name || "");

  const subjectMap = {
    hu: "NeuroMap Kids – elkészült a kiértékelés",
    en: "NeuroMap Kids – your report is ready",
    de: "NeuroMap Kids – Ihr Bericht ist fertig",
    it: "NeuroMap Kids – il tuo report è pronto",
    es: "NeuroMap Kids – tu informe está listo",
    zh: "NeuroMap Kids – 您的报告已准备好",
    ja: "NeuroMap Kids – レポートが完成しました",
    ar: "NeuroMap Kids – التقرير جاهز",
    pl: "NeuroMap Kids – Twój raport jest gotowy",
    pt: "NeuroMap Kids – seu relatório está pronto",
    fr: "NeuroMap Kids – votre rapport est prêt"
  };

  const introMap = {
    hu: `Kedves Szülő! Elkészült ${safeName || "a gyermek"} kiértékelése.`,
    en: `Dear Parent, the report for ${safeName || "your child"} is ready.`,
    de: `Liebe Eltern, der Bericht für ${safeName || "Ihr Kind"} ist fertig.`,
    it: `Gentile genitore, il report per ${safeName || "tuo figlio"} è pronto.`,
    es: `Estimado padre/madre, el informe de ${safeName || "su hijo"} está listo.`,
    zh: `尊敬的家长，${safeName || "您的孩子"} 的报告已完成。`,
    ja: `保護者の皆様、${safeName || "お子様"} のレポートが完成しました。`,
    ar: `عزيزي الوالد، تقرير ${safeName || "طفلك"} جاهز.`,
    pl: `Drogi rodzicu, raport dla ${safeName || "Twojego dziecka"} jest gotowy.`,
    pt: `Caro responsável, o relatório de ${safeName || "seu filho"} está pronto.`,
    fr: `Cher parent, le rapport pour ${safeName || "votre enfant"} est prêt.`
  };

  const footerMap = {
    hu: "Ez az anyag nem minősül diagnózisnak, és nem helyettesíti a személyes szakértői vizsgálatot.",
    en: "This is not a diagnosis and does not replace a professional evaluation.",
    de: "Dies ist keine Diagnose und ersetzt keine fachliche Untersuchung.",
    it: "Questo non è una diagnosi e non sostituisce una valutazione professionale.",
    es: "Esto no es un diagnóstico y no sustituye una evaluación profesional.",
    zh: "此内容不构成诊断，不能替代专业评估。",
    ja: "これは診断ではなく、専門的な評価の代わりにはなりません。",
    ar: "هذا ليس تشخيصًا ولا يغني عن التقييم المهني.",
    pl: "To nie jest diagnoza i nie zastępuje profesjonalnej oceny.",
    pt: "Isto não é um diagnóstico e não substitui uma avaliação profissional.",
    fr: "Ceci n'est pas un diagnostic et ne remplace pas une évaluation professionnelle."
  };

  const safeReportHtml = escapeHtml(reportText).replaceAll("\n", "<br />");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.7;max-width:720px;margin:0 auto;padding:24px;">
      <h1 style="margin:0 0 16px 0;font-size:24px;">NeuroMap Kids</h1>

      <p>${introMap[safeLang]}</p>

      <div style="margin-top:20px;padding:20px;border:1px solid rgba(17,24,39,0.08);border-radius:16px;background:#ffffff;">
        ${safeReportHtml}
      </div>

      <p style="margin-top:24px;font-size:12px;color:#667085;">
        ${footerMap[safeLang]}
      </p>
    </div>
  `.trim();

  const text = `
NeuroMap Kids

${introMap[safeLang]}

${reportText}

${footerMap[safeLang]}
`.trim();

  return {
    subject: subjectMap[safeLang] || subjectMap.en,
    html,
    text
  };
}
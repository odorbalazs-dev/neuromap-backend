function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildReportEmail({ lang, name, reportText }) {
  const subjectMap = {
    hu: "NeuroMap Kids – elkészült a kiértékelés",
    en: "NeuroMap Kids – your evaluation is ready"
  };

  const introMap = {
    hu: `Kedves Szülő! Elkészült ${escapeHtml(name || "")} kérdőíves kiértékelése.`,
    en: `Dear Parent, the questionnaire-based evaluation for ${escapeHtml(name || "")} is ready.`
  };

  const footerMap = {
    hu: "Ez az anyag nem minősül diagnózisnak, és nem helyettesíti a személyes szakértői vizsgálatot.",
    en: "This material is not a diagnosis and does not replace an in-person specialist assessment."
  };

  const safeLang = subjectMap[lang] ? lang : "en";
  const safeReport = escapeHtml(reportText || "").replaceAll("\n", "<br />");

  return {
    subject: subjectMap[safeLang],
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.7;max-width:720px;margin:0 auto;padding:24px;">
        <h1 style="margin:0 0 16px 0;font-size:24px;">NeuroMap Kids</h1>
        <p>${introMap[safeLang]}</p>
        <div style="margin-top:20px;padding:20px;border:1px solid rgba(17,24,39,0.08);border-radius:16px;background:#ffffff;">
          ${safeReport}
        </div>
        <p style="margin-top:24px;font-size:12px;color:#667085;">
          ${footerMap[safeLang]}
        </p>
      </div>
    `.trim()
  };
}
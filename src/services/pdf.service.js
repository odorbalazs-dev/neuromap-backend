import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const BRAND = {
  blue: "#1197D5",
  orange: "#FF7A00",
  green: "#72BE00",
  yellow: "#FFC928",
  pink: "#FF5CA8",
  lightBlue: "#F1FAFF",
  lightOrange: "#FFF4E8",
  dark: "#1F2937",
  muted: "#667085",
  border: "#E5E7EB"
};

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");

const FONT_PATHS = {
  regular: path.join(FONT_DIR, "NotoSans-Regular.ttf"),
  bold: path.join(FONT_DIR, "NotoSans-Bold.ttf"),

  jaRegular: path.join(FONT_DIR, "NotoSansJP-Regular.ttf"),
  jaBold: path.join(FONT_DIR, "NotoSansJP-Bold.ttf"),

  zhRegular: path.join(FONT_DIR, "NotoSansSC-Regular.ttf"),
  zhBold: path.join(FONT_DIR, "NotoSansSC-Bold.ttf"),

  arRegular: path.join(FONT_DIR, "NotoNaskhArabic-Regular.ttf"),
  arBold: path.join(FONT_DIR, "NotoNaskhArabic-Bold.ttf")
};

function clean(value = "") {
  return String(value || "").trim();
}

function stripMarkdown(value = "") {
  return clean(value)
    .replace(/\*\*/g, "")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureFontFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing PDF font file: ${label} at ${filePath}`);
  }
}

function registerFonts(doc) {
  Object.entries(FONT_PATHS).forEach(([label, filePath]) => {
    ensureFontFile(filePath, label);
  });

  doc.registerFont("Regular", FONT_PATHS.regular);
  doc.registerFont("Bold", FONT_PATHS.bold);

  doc.registerFont("JA-Regular", FONT_PATHS.jaRegular);
  doc.registerFont("JA-Bold", FONT_PATHS.jaBold);

  doc.registerFont("ZH-Regular", FONT_PATHS.zhRegular);
  doc.registerFont("ZH-Bold", FONT_PATHS.zhBold);

  doc.registerFont("AR-Regular", FONT_PATHS.arRegular);
  doc.registerFont("AR-Bold", FONT_PATHS.arBold);
}

function getFont(lang = "en", bold = false) {
  if (lang === "ja") return bold ? "JA-Bold" : "JA-Regular";
  if (lang === "zh") return bold ? "ZH-Bold" : "ZH-Regular";
  if (lang === "ar") return bold ? "AR-Bold" : "AR-Regular";

  return bold ? "Bold" : "Regular";
}

function isRtl(lang) {
  return lang === "ar";
}

function getTextAlign(lang) {
  return isRtl(lang) ? "right" : "left";
}

function getLabels(lang = "en") {
  const labels = {
    hu: {
      title: "NeuroMap Kids riport",
      subtitle: "Strukturált, szülőbarát előszűrési összefoglaló",
      greeting: "Kedves",
      parentFallback: "Szülő",
      reportTitle: "Részletes értelmezés",
      summaryLabel: "Előzetes kérdőíves riport",
      disclaimerTitle: "Fontos megjegyzés",
      disclaimer:
        "Ez az anyag nem minősül diagnózisnak, és nem helyettesíti a személyes szakértői vizsgálatot. A teljes értékeléshez szakemberrel történő konzultáció, fejlődéstörténet és tágabb kontextus szükséges.",
      footer: "NeuroMap Kids · Screening report"
    },
    en: {
      title: "NeuroMap Kids Report",
      subtitle: "Structured, parent-friendly screening summary",
      greeting: "Dear",
      parentFallback: "Parent",
      reportTitle: "Detailed interpretation",
      summaryLabel: "Preliminary questionnaire report",
      disclaimerTitle: "Important note",
      disclaimer:
        "This material is not a diagnosis and does not replace an in-person specialist assessment. A full evaluation requires a qualified professional, developmental history, and broader context.",
      footer: "NeuroMap Kids · Screening report"
    },
    de: {
      title: "NeuroMap Kids Bericht",
      subtitle: "Strukturierte, elternfreundliche Screening-Zusammenfassung",
      greeting: "Hallo",
      parentFallback: "Elternteil",
      reportTitle: "Detaillierte Interpretation",
      summaryLabel: "Vorläufiger Fragebogenbericht",
      disclaimerTitle: "Wichtiger Hinweis",
      disclaimer:
        "Dieses Material ist keine Diagnose und ersetzt keine persönliche fachliche Untersuchung. Für eine vollständige Bewertung sind eine qualifizierte Fachperson, die Entwicklungsgeschichte und ein breiterer Kontext erforderlich.",
      footer: "NeuroMap Kids · Screening report"
    },
    it: {
      title: "Report NeuroMap Kids",
      subtitle: "Sintesi di screening strutturata e adatta ai genitori",
      greeting: "Gentile",
      parentFallback: "Genitore",
      reportTitle: "Interpretazione dettagliata",
      summaryLabel: "Report preliminare del questionario",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Questo materiale non è una diagnosi e non sostituisce una valutazione di persona da parte di un professionista qualificato. Una valutazione completa richiede una consulenza specialistica, la storia dello sviluppo e un contesto più ampio.",
      footer: "NeuroMap Kids · Screening report"
    },
    es: {
      title: "Informe NeuroMap Kids",
      subtitle: "Resumen de cribado estructurado y fácil de entender para padres",
      greeting: "Estimado/a",
      parentFallback: "Padre/madre",
      reportTitle: "Interpretación detallada",
      summaryLabel: "Informe preliminar del cuestionario",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Este material no es un diagnóstico y no sustituye una evaluación presencial por parte de un profesional cualificado. Una evaluación completa requiere consulta profesional, historia del desarrollo y un contexto más amplio.",
      footer: "NeuroMap Kids · Screening report"
    },
    fr: {
      title: "Rapport NeuroMap Kids",
      subtitle: "Résumé de dépistage structuré et accessible aux parents",
      greeting: "Bonjour",
      parentFallback: "Parent",
      reportTitle: "Interprétation détaillée",
      summaryLabel: "Rapport préliminaire du questionnaire",
      disclaimerTitle: "Note importante",
      disclaimer:
        "Ce document n’est pas un diagnostic et ne remplace pas une évaluation en personne par un professionnel qualifié. Une évaluation complète nécessite une consultation spécialisée, l’histoire du développement et un contexte plus large.",
      footer: "NeuroMap Kids · Screening report"
    },
    pt: {
      title: "Relatório NeuroMap Kids",
      subtitle: "Resumo de triagem estruturado e amigável para pais",
      greeting: "Olá",
      parentFallback: "Responsável",
      reportTitle: "Interpretação detalhada",
      summaryLabel: "Relatório preliminar do questionário",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Este material não é um diagnóstico e não substitui uma avaliação presencial por um profissional qualificado. Uma avaliação completa requer consulta profissional, histórico de desenvolvimento e contexto mais amplo.",
      footer: "NeuroMap Kids · Screening report"
    },
    pl: {
      title: "Raport NeuroMap Kids",
      subtitle: "Ustrukturyzowane, przyjazne dla rodziców podsumowanie przesiewowe",
      greeting: "Dzień dobry",
      parentFallback: "Rodzic",
      reportTitle: "Szczegółowa interpretacja",
      summaryLabel: "Wstępny raport z kwestionariusza",
      disclaimerTitle: "Ważna informacja",
      disclaimer:
        "Ten materiał nie jest diagnozą i nie zastępuje osobistej oceny przez wykwalifikowanego specjalistę. Pełna ocena wymaga konsultacji specjalistycznej, historii rozwoju i szerszego kontekstu.",
      footer: "NeuroMap Kids · Screening report"
    },
    zh: {
      title: "NeuroMap Kids 报告",
      subtitle: "结构化、家长友好的筛查摘要",
      greeting: "您好",
      parentFallback: "家长",
      reportTitle: "详细解读",
      summaryLabel: "初步问卷报告",
      disclaimerTitle: "重要说明",
      disclaimer:
        "本材料不是诊断，也不能替代合格专业人员的面对面评估。完整评估需要专业咨询、发展史以及更广泛的背景信息。",
      footer: "NeuroMap Kids · Screening report"
    },
    ja: {
      title: "NeuroMap Kids レポート",
      subtitle: "保護者向けの構造化されたスクリーニング概要",
      greeting: "こんにちは",
      parentFallback: "保護者",
      reportTitle: "詳細な解釈",
      summaryLabel: "予備的な質問票レポート",
      disclaimerTitle: "重要なお知らせ",
      disclaimer:
        "この資料は診断ではなく、資格を持つ専門家による対面評価の代わりにはなりません。完全な評価には、専門家による相談、発達歴、より広い背景情報が必要です。",
      footer: "NeuroMap Kids · Screening report"
    },
    ar: {
      title: "تقرير NeuroMap Kids",
      subtitle: "ملخص فحص أولي منظم ومناسب للوالدين",
      greeting: "مرحبًا",
      parentFallback: "ولي الأمر",
      reportTitle: "تفسير تفصيلي",
      summaryLabel: "تقرير أولي للاستبيان",
      disclaimerTitle: "ملاحظة مهمة",
      disclaimer:
        "هذه المادة ليست تشخيصًا ولا تحل محل التقييم الشخصي من قبل مختص مؤهل. يتطلب التقييم الكامل استشارة مختص، وتاريخًا نمائيًا، وسياقًا أوسع.",
      footer: "NeuroMap Kids · Screening report"
    }
  };

  return labels[lang] || labels.en;
}

function addLogoLikeMark(doc, x, y) {
  const safeX = Number.isFinite(Number(x)) ? Number(x) : 72;
  const safeY = Number.isFinite(Number(y)) ? Number(y) : 52;

  doc.circle(safeX, safeY, 16).fill(BRAND.blue);
  doc.circle(safeX + 28, safeY, 16).fill(BRAND.orange);
  doc.circle(safeX + 14, safeY + 18, 8).fill(BRAND.green);

  doc
    .strokeColor("#FFFFFF")
    .lineWidth(2.2)
    .moveTo(safeX, safeY)
    .lineTo(safeX + 28, safeY)
    .lineTo(safeX + 14, safeY + 18)
    .lineTo(safeX, safeY)
    .stroke();

  doc.circle(safeX, safeY, 7).fill("#FFFFFF");
  doc.circle(safeX, safeY, 4).fill(BRAND.yellow);

  doc.circle(safeX + 28, safeY, 7).fill("#FFFFFF");
  doc.circle(safeX + 28, safeY, 4).fill(BRAND.green);

  doc.circle(safeX + 14, safeY + 18, 7).fill("#FFFFFF");
  doc.circle(safeX + 14, safeY + 18, 4).fill(BRAND.pink);
}

function addHeader(doc, labels, lang) {
  doc.rect(0, 0, doc.page.width, 108).fill(BRAND.lightBlue);

  doc.rect(0, 0, doc.page.width, 8).fill(BRAND.blue);
  doc.rect(0, 8, doc.page.width * 0.45, 5).fill(BRAND.orange);
  doc.rect(doc.page.width * 0.45, 8, doc.page.width * 0.22, 5).fill(BRAND.green);
  doc.rect(doc.page.width * 0.67, 8, doc.page.width * 0.33, 5).fill(BRAND.yellow);

  addLogoLikeMark(doc, 72, 52);

  doc
    .fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(lang === "zh" || lang === "ja" ? 20 : 23)
    .text(labels.title, 118, 34, {
      width: doc.page.width - 174,
      align: getTextAlign(lang)
    });

  doc
    .fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(10.5)
    .text(labels.subtitle, 118, 64, {
      width: doc.page.width - 174,
      align: getTextAlign(lang)
    });
}

function addFooter(doc, labels, lang) {
  const y = doc.page.height - 44;

  doc
    .moveTo(56, y - 10)
    .lineTo(doc.page.width - 56, y - 10)
    .strokeColor(BRAND.border)
    .lineWidth(1)
    .stroke();

  doc.circle(58, y + 3, 3).fill(BRAND.blue);
  doc.circle(69, y + 3, 3).fill(BRAND.orange);
  doc.circle(80, y + 3, 3).fill(BRAND.green);

  doc
    .fillColor("#8A8F9C")
    .font(getFont(lang))
    .fontSize(8.5)
    .text(labels.footer, 94, y - 2, {
      align: getTextAlign(lang),
      width: doc.page.width - 150
    });
}

function ensureSpace(doc, neededHeight, labels, lang) {
  if (doc.y + neededHeight > doc.page.height - 74) {
    addFooter(doc, labels, lang);
    doc.addPage();
    addHeader(doc, labels, lang);
    doc.y = 132;
  }
}

function addInfoCard(doc, { name, lang }) {
  const labels = getLabels(lang);
  const safeName = clean(name) || labels.parentFallback;

  const x = 56;
  const y = 132;
  const w = doc.page.width - 112;
  const h = 88;

  doc.roundedRect(x, y, w, h, 16).fill("#FFFFFF");
  doc.roundedRect(x, y, w, h, 16).strokeColor("#D7EEF9").lineWidth(1).stroke();
  doc.rect(x, y, 8, h).fill(BRAND.orange);

  doc
    .fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(14)
    .text(`${labels.greeting} ${safeName}!`, x + 22, y + 20, {
      width: w - 44,
      align: getTextAlign(lang)
    });

  doc
    .fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(10)
    .text(labels.summaryLabel, x + 22, y + 46, {
      width: w - 44,
      align: getTextAlign(lang)
    });

  doc.circle(x + w - 42, y + 30, 9).fill(BRAND.blue);
  doc.circle(x + w - 24, y + 44, 7).fill(BRAND.orange);
  doc.circle(x + w - 54, y + 56, 6).fill(BRAND.green);
}

function addSectionTitle(doc, title, labels, lang) {
  ensureSpace(doc, 54, labels, lang);

  doc.moveDown(1);

  doc.circle(62, doc.y + 8, 5).fill(BRAND.blue);
  doc.circle(76, doc.y + 8, 5).fill(BRAND.orange);

  doc
    .fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(14)
    .text(title, 92, doc.y, {
      width: doc.page.width - 148,
      align: getTextAlign(lang)
    });

  doc.moveDown(0.4);

  doc
    .moveTo(56, doc.y)
    .lineTo(doc.page.width - 56, doc.y)
    .strokeColor("#D7EEF9")
    .lineWidth(1)
    .stroke();

  doc.moveDown(0.65);
}

function addDisclaimerBox(doc, labels, lang) {
  ensureSpace(doc, 130, labels, lang);

  doc.moveDown(1);

  const x = 56;
  const y = doc.y;
  const w = doc.page.width - 112;
  const h = 118;

  doc.roundedRect(x, y, w, h, 14).fill(BRAND.lightOrange);
  doc.roundedRect(x, y, w, h, 14).strokeColor("#FFD2A6").lineWidth(1).stroke();

  doc.circle(x + 21, y + 23, 7).fill(BRAND.orange);

  doc
    .fillColor("#9A3412")
    .font(getFont(lang, true))
    .fontSize(11)
    .text(labels.disclaimerTitle, x + 38, y + 16, {
      width: w - 56,
      align: getTextAlign(lang)
    });

  doc
    .fillColor("#7C2D12")
    .font(getFont(lang))
    .fontSize(9.5)
    .text(labels.disclaimer, x + 18, y + 42, {
      width: w - 36,
      lineGap: 3,
      align: getTextAlign(lang)
    });

  doc.y = y + h;
}

function isHeading(paragraph) {
  const text = clean(paragraph);
  if (!text) return false;

  if (/^\d+\.\s+/.test(text) && text.length < 120) return true;
  if (text.length < 85 && !/[.!?。！？؟]$/u.test(text)) return true;
  if (text === text.toUpperCase() && text.length < 120) return true;

  return false;
}

function addReportText(doc, reportText, labels, lang) {
  const rawParagraphs = stripMarkdown(reportText)
    .split(/\n{2,}/)
    .map((p) => clean(p))
    .filter(Boolean);

  let sectionCounter = 1;

  rawParagraphs.forEach((paragraph) => {
    const headingMatch = paragraph.match(/^#{1,6}\s*(.+)$/);

    if (headingMatch) {
      ensureSpace(doc, 42, labels, lang);

      const cleanHeading = clean(headingMatch[1]);

      doc.moveDown(0.45);

      doc
        .fillColor(BRAND.blue)
        .font(getFont(lang, true))
        .fontSize(13)
        .text(`${sectionCounter}. ${cleanHeading}`, {
          lineGap: 3,
          align: getTextAlign(lang)
        });

      sectionCounter += 1;

      doc
        .moveDown(0.18)
        .moveTo(56, doc.y)
        .lineTo(doc.page.width - 120, doc.y)
        .strokeColor(BRAND.orange)
        .lineWidth(1.2)
        .stroke();

      doc.moveDown(0.55);
      return;
    }

    if (isHeading(paragraph)) {
      ensureSpace(doc, 42, labels, lang);

      doc.moveDown(0.35);

      doc
        .fillColor(BRAND.blue)
        .font(getFont(lang, true))
        .fontSize(12.5)
        .text(`${sectionCounter}. ${paragraph}`, {
          lineGap: 3,
          align: getTextAlign(lang)
        });

      sectionCounter += 1;

      doc
        .moveDown(0.18)
        .moveTo(56, doc.y)
        .lineTo(doc.page.width - 120, doc.y)
        .strokeColor(BRAND.orange)
        .lineWidth(1.2)
        .stroke();

      doc.moveDown(0.55);
      return;
    }

    ensureSpace(doc, 72, labels, lang);

    doc
      .fillColor("#374151")
      .font(getFont(lang))
      .fontSize(lang === "zh" || lang === "ja" ? 10 : 10.4)
      .text(paragraph, {
        align: getTextAlign(lang),
        lineGap: 4
      });

    doc.moveDown(0.55);
  });
}
export async function generatePdfBuffer({ name, reportText, lang = "en", payload = null }) {
  return new Promise((resolve, reject) => {
    try {
      const safeLang = clean(lang) || "en";
      const labels = getLabels(safeLang);
      const chunks = [];

      const doc = new PDFDocument({
        size: "A4",
        margin: 56,
        info: {
          Title: labels.title,
          Author: "NeuroMap Kids",
          Subject: labels.subtitle
        }
      });

      registerFonts(doc);

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      addHeader(doc, labels, safeLang);
      addInfoCard(doc, { name, lang: safeLang });

      doc.y = 252;

      addSectionTitle(doc, labels.reportTitle, labels, safeLang);
      addReportText(doc, reportText, labels, safeLang);
      if (doc.y < doc.page.height - 220) {
  addDisclaimerBox(doc, labels, safeLang);
}

addFooter(doc, labels, safeLang);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getPlusContent } from "./plus-content.service.js";

const BRAND = Object.freeze({
  blue: "#1197D5",
  orange: "#FF7A00",
  green: "#72BE00",
  dark: "#1F2937",
  muted: "#667085",
  lightBlue: "#F1FAFF",
  lightGreen: "#F4FFF0",
  border: "#D7EEF9"
});

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");
const FONT_PATHS = Object.freeze({
  regular: path.join(FONT_DIR, "NotoSans-Regular.ttf"),
  bold: path.join(FONT_DIR, "NotoSans-Bold.ttf"),
  jaRegular: path.join(FONT_DIR, "NotoSansJP-Regular.ttf"),
  jaBold: path.join(FONT_DIR, "NotoSansJP-Bold.ttf"),
  zhRegular: path.join(FONT_DIR, "NotoSansSC-Regular.ttf"),
  zhBold: path.join(FONT_DIR, "NotoSansSC-Bold.ttf"),
  arRegular: path.join(FONT_DIR, "NotoNaskhArabic-Regular.ttf"),
  arBold: path.join(FONT_DIR, "NotoNaskhArabic-Bold.ttf")
});

const LABELS = Object.freeze({
  hu: { focus: "Fő megfigyelési terület", conversation: "Közös megfigyelési cél" },
  en: { focus: "Primary observation area", conversation: "Shared observation goal" },
  de: { focus: "Zentraler Beobachtungsbereich", conversation: "Gemeinsames Beobachtungsziel" },
  it: { focus: "Area principale di osservazione", conversation: "Obiettivo condiviso" },
  es: { focus: "Área principal de observación", conversation: "Objetivo compartido" },
  fr: { focus: "Domaine principal d'observation", conversation: "Objectif commun" },
  pt: { focus: "Área principal de observação", conversation: "Objetivo compartilhado" },
  pl: { focus: "Główny obszar obserwacji", conversation: "Wspólny cel obserwacji" },
  ja: { focus: "主な観察領域", conversation: "共通の観察目標" },
  zh: { focus: "主要观察领域", conversation: "共同观察目标" },
  ar: { focus: "مجال الملاحظة الرئيسي", conversation: "هدف الملاحظة المشترك" }
});

function registerFonts(doc) {
  Object.entries(FONT_PATHS).forEach(([label, filePath]) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing shareable-summary PDF font: ${label}`);
    }
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

function fontFor(lang, bold = false) {
  if (lang === "ja") return bold ? "JA-Bold" : "JA-Regular";
  if (lang === "zh") return bold ? "ZH-Bold" : "ZH-Regular";
  if (lang === "ar") return bold ? "AR-Bold" : "AR-Regular";
  return bold ? "Bold" : "Regular";
}

function focusFromPayload(payload = {}) {
  return String(
    payload?.detectedRisk ||
    payload?.payload?.detectedRisk ||
    payload?.specificProfile?.kind ||
    "GENERAL"
  ).trim().toUpperCase();
}

function drawRoundedBlock(doc, { x, y, width, height, fill, stroke = BRAND.border }) {
  doc
    .roundedRect(x, y, width, height, 10)
    .fillAndStroke(fill, stroke);
}

export function buildShareableSummaryFilename(lang = "en") {
  const suffix = lang === "hu" ? "megfigyelesi-osszefoglalo" : "observation-summary";
  return `neuromap-kids-${suffix}.pdf`;
}

export async function generateShareableSummaryPdf({ lang = "en", payload = null } = {}) {
  const safeLang = Object.hasOwn(LABELS, lang) ? lang : "en";
  const copy = getPlusContent(safeLang);
  const labels = LABELS[safeLang];
  const focus = focusFromPayload(payload);
  const isRtl = safeLang === "ar";
  const align = isRtl ? "right" : "left";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
      info: {
        Title: copy.summaryTitle,
        Author: "NeuroMap Kids",
        Subject: "Automated parent observation aid"
      }
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      registerFonts(doc);

      const pageWidth = doc.page.width;
      const contentX = 48;
      const contentWidth = pageWidth - 96;

      doc.rect(0, 0, pageWidth, 8).fill(BRAND.blue);
      doc.rect(pageWidth * 0.46, 0, pageWidth * 0.32, 8).fill(BRAND.orange);
      doc.rect(pageWidth * 0.78, 0, pageWidth * 0.22, 8).fill(BRAND.green);

      doc
        .font(fontFor(safeLang, true))
        .fontSize(11)
        .fillColor(BRAND.blue)
        .text("NEUROMAP KIDS PLUS", contentX, 34, { width: contentWidth, align });

      doc
        .font(fontFor(safeLang, true))
        .fontSize(21)
        .fillColor(BRAND.dark)
        .text(copy.summaryTitle, contentX, 55, {
          width: contentWidth,
          align,
          lineGap: 2
        });

      drawRoundedBlock(doc, {
        x: contentX,
        y: 112,
        width: contentWidth,
        height: 58,
        fill: BRAND.lightBlue
      });

      doc
        .font(fontFor(safeLang))
        .fontSize(8.5)
        .fillColor(BRAND.muted)
        .text(labels.focus, contentX + 16, 126, { width: contentWidth - 32, align });
      doc
        .font(fontFor(safeLang, true))
        .fontSize(15)
        .fillColor(BRAND.dark)
        .text(focus, contentX + 16, 143, { width: contentWidth - 32, align });

      doc
        .font(fontFor(safeLang, true))
        .fontSize(13)
        .fillColor(BRAND.dark)
        .text(copy.actionTitle, contentX, 194, { width: contentWidth, align });

      let y = 220;
      copy.actions.slice(0, 3).forEach(([title, body], index) => {
        drawRoundedBlock(doc, {
          x: contentX,
          y,
          width: contentWidth,
          height: 80,
          fill: index % 2 === 0 ? "#FFFFFF" : BRAND.lightGreen
        });

        doc.circle(isRtl ? pageWidth - contentX - 18 : contentX + 18, y + 18, 10).fill(BRAND.green);
        doc
          .font(fontFor(safeLang, true))
          .fontSize(9)
          .fillColor("#FFFFFF")
          .text(String(index + 1), isRtl ? pageWidth - contentX - 22 : contentX + 14, y + 12, {
            width: 8,
            align: "center"
          });

        const textX = contentX + 38;
        doc
          .font(fontFor(safeLang, true))
          .fontSize(10.5)
          .fillColor(BRAND.dark)
          .text(title, textX, y + 11, { width: contentWidth - 54, align });
        doc
          .font(fontFor(safeLang))
          .fontSize(8.7)
          .fillColor(BRAND.dark)
          .text(body, textX, y + 31, {
            width: contentWidth - 54,
            height: 39,
            align,
            lineGap: 1
          });
        y += 90;
      });

      drawRoundedBlock(doc, {
        x: contentX,
        y: 494,
        width: contentWidth,
        height: 105,
        fill: BRAND.lightBlue
      });
      doc
        .font(fontFor(safeLang, true))
        .fontSize(11)
        .fillColor(BRAND.dark)
        .text(labels.conversation, contentX + 16, 510, { width: contentWidth - 32, align });
      doc
        .font(fontFor(safeLang))
        .fontSize(8.8)
        .fillColor(BRAND.dark)
        .text(copy.conversation, contentX + 16, 535, {
          width: contentWidth - 32,
          height: 50,
          align,
          lineGap: 2
        });

      drawRoundedBlock(doc, {
        x: contentX,
        y: 620,
        width: contentWidth,
        height: 102,
        fill: "#FFF7ED",
        stroke: "#FED7AA"
      });
      doc
        .font(fontFor(safeLang, true))
        .fontSize(9.2)
        .fillColor("#7C2D12")
        .text(copy.disclosure, contentX + 16, 637, {
          width: contentWidth - 32,
          height: 70,
          align,
          lineGap: 2
        });

      doc
        .font(fontFor(safeLang))
        .fontSize(8)
        .fillColor(BRAND.muted)
        .text("NeuroMap Kids | Plus", contentX, 770, {
          width: contentWidth,
          align: "center"
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

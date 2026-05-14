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

function clean(value = "") {
  return String(value || "").trim();
}

function getLabels(lang = "hu") {
  if (lang === "hu") {
    return {
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
    };
  }

  return {
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
  };
}

function addLogoLikeMark(doc, x, y) {
  doc.circle(x, y, 16).fill(BRAND.blue);
  doc.circle(x + 28, y, 16).fill(BRAND.orange);
  doc.circle(x + 14, y + 18, 8).fill(BRAND.green);

  doc
    .strokeColor("#FFFFFF")
    .lineWidth(2.2)
    .moveTo(x, y)
    .lineTo(x + 28, y)
    .lineTo(x + 14, y + 18)
    .lineTo(x, y)
    .stroke();

  doc.circle(x, y, 6).fill("#FFFFFF").circle(x, y, 4).fill(BRAND.yellow);
  doc.circle(x + 28, y, 6).fill("#FFFFFF").circle(x + 28, y, 4).fill(BRAND.green);
  doc.circle(x + 14, y + 18, 6).fill("#FFFFFF").circle(x + 14, y + 18, 4).fill(BRAND.pink);
}

function addHeader(doc, labels) {
  doc.rect(0, 0, doc.page.width, 108).fill(BRAND.lightBlue);

  doc.rect(0, 0, doc.page.width, 8).fill(BRAND.blue);
  doc.rect(0, 8, doc.page.width * 0.45, 5).fill(BRAND.orange);
  doc.rect(doc.page.width * 0.45, 8, doc.page.width * 0.22, 5).fill(BRAND.green);
  doc.rect(doc.page.width * 0.67, 8, doc.page.width * 0.33, 5).fill(BRAND.yellow);

  addLogoLikeMark(doc, 72, 52);

  doc
    .fillColor(BRAND.dark)
    .font("Helvetica-Bold")
    .fontSize(23)
    .text(labels.title, 118, 34, { width: doc.page.width - 174 });

  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(10.5)
    .text(labels.subtitle, 118, 64, { width: doc.page.width - 174 });
}

function addFooter(doc, labels) {
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
    .font("Helvetica")
    .fontSize(8.5)
    .text(labels.footer, 94, y - 2, {
      align: "left",
      width: doc.page.width - 150
    });
}

function ensureSpace(doc, neededHeight, labels) {
  if (doc.y + neededHeight > doc.page.height - 74) {
    addFooter(doc, labels);
    doc.addPage();
    addHeader(doc, labels);
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
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(`${labels.greeting} ${safeName}!`, x + 22, y + 20);

  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(labels.summaryLabel, x + 22, y + 46, {
      width: w - 44
    });

  doc.circle(x + w - 42, y + 30, 9).fill(BRAND.blue);
  doc.circle(x + w - 24, y + 44, 7).fill(BRAND.orange);
  doc.circle(x + w - 54, y + 56, 6).fill(BRAND.green);
}

function addSectionTitle(doc, title, labels) {
  ensureSpace(doc, 54, labels);

  doc.moveDown(1);

  doc.circle(62, doc.y + 8, 5).fill(BRAND.blue);
  doc.circle(76, doc.y + 8, 5).fill(BRAND.orange);

  doc
    .fillColor(BRAND.dark)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(title, 92, doc.y, {
      width: doc.page.width - 148
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

function addDisclaimerBox(doc, labels) {
  ensureSpace(doc, 116, labels);

  doc.moveDown(1);

  const x = 56;
  const y = doc.y;
  const w = doc.page.width - 112;
  const h = 104;

  doc.roundedRect(x, y, w, h, 14).fill(BRAND.lightOrange);
  doc.roundedRect(x, y, w, h, 14).strokeColor("#FFD2A6").lineWidth(1).stroke();

  doc.circle(x + 21, y + 23, 7).fill(BRAND.orange);

  doc
    .fillColor("#9A3412")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(labels.disclaimerTitle, x + 38, y + 16);

  doc
    .fillColor("#7C2D12")
    .font("Helvetica")
    .fontSize(9.5)
    .text(labels.disclaimer, x + 18, y + 42, {
      width: w - 36,
      lineGap: 3
    });

  doc.y = y + h;
}

function isHeading(paragraph) {
  const text = clean(paragraph);
  if (!text) return false;

  if (/^\d+\.\s+/.test(text) && text.length < 120) return true;
  if (text.length < 85 && !/[.!?]$/.test(text)) return true;
  if (text === text.toUpperCase() && text.length < 120) return true;

  return false;
}

function addReportText(doc, reportText, labels) {
  const paragraphs = clean(reportText)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  paragraphs.forEach((paragraph) => {
    if (isHeading(paragraph)) {
      ensureSpace(doc, 46, labels);

      doc
        .moveDown(0.45)
        .fillColor(BRAND.blue)
        .font("Helvetica-Bold")
        .fontSize(12.5)
        .text(paragraph.replace(/^\d+\.\s+/, ""), {
          lineGap: 3
        });

      doc
        .moveDown(0.2)
        .moveTo(56, doc.y)
        .lineTo(145, doc.y)
        .strokeColor(BRAND.orange)
        .lineWidth(1.4)
        .stroke();

      doc.moveDown(0.55);
      return;
    }

    ensureSpace(doc, 78, labels);

    doc
      .fillColor("#374151")
      .font("Helvetica")
      .fontSize(10.4)
      .text(paragraph, {
        align: "left",
        lineGap: 4
      });

    doc.moveDown(0.7);
  });
}

export async function generatePdfBuffer({ name, reportText, lang = "hu", payload = null }) {
  return new Promise((resolve, reject) => {
    try {
      const labels = getLabels(lang);
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

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      addHeader(doc, labels);
      addInfoCard(doc, { name, lang });

      doc.y = 252;

      addSectionTitle(doc, labels.reportTitle, labels);
      addReportText(doc, reportText, labels);
      addDisclaimerBox(doc, labels);
      addFooter(doc, labels);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
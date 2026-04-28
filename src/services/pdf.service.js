import PDFDocument from "pdfkit";

function clean(value = "") {
  return String(value || "").trim();
}

function getLabels(lang = "hu") {
  if (lang === "hu") {
    return {
      title: "NeuroMap Kids riport",
      subtitle: "Strukturált előszűrési összefoglaló",
      greeting: "Kedves",
      parentFallback: "Szülő",
      reportTitle: "Részletes értelmezés",
      disclaimerTitle: "Fontos megjegyzés",
      disclaimer:
        "Ez az anyag nem minősül diagnózisnak, és nem helyettesíti a személyes szakértői vizsgálatot. A teljes értékeléshez szakemberrel történő konzultáció, fejlődéstörténet és tágabb kontextus szükséges.",
      footer: "NeuroMap Kids · Screening report"
    };
  }

  return {
    title: "NeuroMap Kids Report",
    subtitle: "Structured screening summary",
    greeting: "Dear",
    parentFallback: "Parent",
    reportTitle: "Detailed interpretation",
    disclaimerTitle: "Important note",
    disclaimer:
      "This material is not a diagnosis and does not replace an in-person specialist assessment. A full evaluation requires a qualified professional, developmental history, and broader context.",
    footer: "NeuroMap Kids · Screening report"
  };
}

function addHeader(doc, labels) {
  doc
    .rect(0, 0, doc.page.width, 92)
    .fill("#F7E7D7");

  doc
    .fillColor("#27324A")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(labels.title, 56, 30);

  doc
    .fillColor("#5B6478")
    .font("Helvetica")
    .fontSize(10.5)
    .text(labels.subtitle, 56, 58);
}

function addFooter(doc, labels) {
  const y = doc.page.height - 42;

  doc
    .moveTo(56, y - 10)
    .lineTo(doc.page.width - 56, y - 10)
    .strokeColor("#E5E7EB")
    .lineWidth(1)
    .stroke();

  doc
    .fillColor("#8A8F9C")
    .font("Helvetica")
    .fontSize(8.5)
    .text(labels.footer, 56, y, {
      align: "left",
      width: doc.page.width - 112
    });
}

function addSectionTitle(doc, title) {
  doc.moveDown(1.1);

  doc
    .fillColor("#27324A")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(title);

  doc
    .moveDown(0.35)
    .moveTo(56, doc.y)
    .lineTo(doc.page.width - 56, doc.y)
    .strokeColor("#E9D5C4")
    .lineWidth(1)
    .stroke();

  doc.moveDown(0.7);
}

function addInfoCard(doc, { name, lang }) {
  const labels = getLabels(lang);
  const safeName = clean(name) || labels.parentFallback;

  const x = 56;
  const y = 122;
  const w = doc.page.width - 112;
  const h = 78;

  doc
    .roundedRect(x, y, w, h, 14)
    .fill("#FAFAF9");

  doc
    .roundedRect(x, y, w, h, 14)
    .strokeColor("#E7E5E4")
    .lineWidth(1)
    .stroke();

  doc
    .fillColor("#27324A")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(`${labels.greeting} ${safeName}!`, x + 18, y + 18);

  doc
    .fillColor("#5B6478")
    .font("Helvetica")
    .fontSize(10)
    .text(labels.subtitle, x + 18, y + 42);
}

function addDisclaimerBox(doc, labels) {
  doc.moveDown(1.2);

  const x = 56;
  const y = doc.y;
  const w = doc.page.width - 112;
  const h = 98;

  if (y + h > doc.page.height - 70) {
    doc.addPage();
    addHeader(doc, labels);
    doc.y = 120;
  }

  doc
    .roundedRect(x, doc.y, w, h, 12)
    .fill("#FFF7ED");

  doc
    .roundedRect(x, doc.y, w, h, 12)
    .strokeColor("#FDBA74")
    .lineWidth(1)
    .stroke();

  doc
    .fillColor("#9A3412")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(labels.disclaimerTitle, x + 16, y + 14);

  doc
    .fillColor("#7C2D12")
    .font("Helvetica")
    .fontSize(9.5)
    .text(labels.disclaimer, x + 16, y + 34, {
      width: w - 32,
      lineGap: 3
    });

  doc.y = y + h;
}

function addReportText(doc, reportText, labels) {
  const paragraphs = clean(reportText)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  paragraphs.forEach((paragraph) => {
    const isLikelyHeading =
      paragraph.length < 90 &&
      !paragraph.includes(".") &&
      !paragraph.includes(":") &&
      paragraph === paragraph.toUpperCase();

    const estimatedHeight = isLikelyHeading ? 34 : 72;

    if (doc.y + estimatedHeight > doc.page.height - 70) {
      addFooter(doc, labels);
      doc.addPage();
      addHeader(doc, labels);
      doc.y = 120;
    }

    if (isLikelyHeading) {
      doc
        .moveDown(0.6)
        .fillColor("#27324A")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(paragraph, {
          lineGap: 3
        });
    } else {
      doc
        .fillColor("#374151")
        .font("Helvetica")
        .fontSize(10.2)
        .text(paragraph, {
          align: "left",
          lineGap: 4
        });

      doc.moveDown(0.65);
    }
  });
}

export async function generatePdfBuffer({ name, reportText, lang = "hu" }) {
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

      doc.y = 232;

      addSectionTitle(doc, labels.reportTitle);
      addReportText(doc, reportText, labels);
      addDisclaimerBox(doc, labels);
      addFooter(doc, labels);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
import { Buffer } from "buffer";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildHtml({ name, reportText }) {
  const safeName = escapeHtml(name || "Szülő");
  const safeReport = escapeHtml(reportText || "").replaceAll("\n", "<br>");

  return `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          line-height: 1.6;
          color: #1f2937;
        }
        h1 {
          font-size: 24px;
        }
        .section {
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>NeuroMap Kids Report</h1>

      <div class="section">
        <strong>Kedves ${safeName},</strong>
      </div>

      <div class="section">
        ${safeReport}
      </div>

      <div class="section" style="margin-top:40px;font-size:12px;color:#666;">
        Ez az anyag nem minősül diagnózisnak.
      </div>
    </body>
  </html>
  `;
}

export async function generatePdfBuffer({ name, reportText }) {
  const html = buildHtml({ name, reportText });

  // SIMPLE VERSION: HTML → buffer (MVP)
  // később Puppeteer-rel upgrade-eljük

  return Buffer.from(html);
}
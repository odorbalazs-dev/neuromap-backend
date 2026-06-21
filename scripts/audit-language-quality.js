import fs from "fs";

const checks = [
  {
    file: "public/webflow/engine.js",
    required: [
      "20260621-language-audit-v2",
      "analytics-event-schema-v2",
      "DRAFT_STORAGE_KEY",
      "getCustomerCopy",
      "buildReportPreviewV2Html",
      "buildDecisionExplanationHtml",
      "getCheckoutErrorMessage",
      "getSummaryPayCopy"
    ],
    forbidden: [
      "20260527-age-i18n",
      "20260605-landing-hu-cta-v1",
      "20260621-launch-audit-fixes-v1"
    ]
  },
  {
    file: "public/webflow/checkout-pages.js",
    required: [
      "analytics-event-schema-v2",
      "checkout_cancelled",
      "purchase"
    ],
    forbidden: []
  },
  {
    file: "web/engine-embed.full.html",
    required: [
      "/public/webflow/engine.js",
      "20260621-language-audit-v2"
    ],
    forbidden: [
      "20260527-age-i18n",
      "20260605-landing-hu-cta-v1",
      "20260621-launch-audit-fixes-v1"
    ]
  },
  {
    file: "src/services/analysis.service.js",
    required: [
      "A teljes riportot magyar nyelven írd",
      "natürlichem, korrektem Deutsch",
      "español natural",
      "自然、准确、专业的中文",
      "自然で正確な日本語",
      "باللغة العربية الطبيعية",
      "językiem polskim",
      "português natural",
      "français naturel"
    ],
    forbidden: []
  },
  {
    file: "src/services/report-v2.service.js",
    required: [
      "Korosztályi értelmezés",
      "年齢段階に合わせた理解",
      "تفسير بحسب المرحلة العمرية",
      "buildReportV2Context"
    ],
    forbidden: []
  },
  {
    file: "src/templates/followUpEmail.js",
    required: [
      "Hogyan használd",
      "レポートの使い方",
      "كيفية استخدام",
      "dir = lang === \"ar\" ? \"rtl\" : \"ltr\""
    ],
    forbidden: [
      "Hi ${escapeHtml(safeName)}"
    ]
  },
  {
    file: "src/services/pdf.service.js",
    required: [
      "gyermek viselked\\u00e9se",
      "PDF_REPORT_VERSION",
      "getReportV2PdfLabels",
      "年齢段階に合わせた理解",
      "تفسير بحسب المرحلة العمرية"
    ],
    forbidden: [
      "gyermek működése",
      "gyerek működése",
      "Gyors olvasasi utvonal",
      "Ruta rapida de lectura"
    ]
  },
  {
    file: "src/services/stripe.service.js",
    required: [
      "locale: getStripeCheckoutLocale(safeLang)"
    ],
    forbidden: []
  },
  {
    file: "src/services/invoice.service.js",
    required: [
      "resolveSzamlazzHuInvoiceLanguage(session?.lang)"
    ],
    forbidden: []
  },
  {
    file: "src/api/controllers/admin-dashboard.controller.js",
    required: [
      "<meta charset=\"utf-8\">",
      "NeuroMap Vezérlőközpont",
      "Műveleti panel"
    ],
    forbidden: []
  },
  {
    file: "src/services/email-deliverability.service.js",
    required: [
      "nincs beállítva",
      "küldő domaint",
      "hibaarány"
    ],
    forbidden: [
      "nincs beallitva",
      "hibaarany"
    ]
  }
];

const mojibakePatterns = [
  /Ã[\u0080-\u00ff]/u,
  /Ă[\u0080-\uffff]/u,
  /Ĺ[\u0080-\uffff]/u,
  /â(?:€|„|œ|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099)/u,
  /\uFFFD/u
];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function main() {
  const findings = [];

  for (const check of checks) {
    const source = read(check.file);

    for (const token of check.required) {
      if (!source.includes(token)) {
        findings.push({
          severity: "critical",
          file: check.file,
          token,
          message: `Missing required language/experience marker: ${token}`
        });
      }
    }

    for (const token of check.forbidden) {
      if (source.includes(token)) {
        findings.push({
          severity: "warning",
          file: check.file,
          token,
          message: `Old or unsafe language marker still present: ${token}`
        });
      }
    }

    mojibakePatterns.forEach((pattern) => {
      const match = source.match(pattern);
      if (match) {
        findings.push({
          severity: "critical",
          file: check.file,
          token: match[0],
          message: `Possible mojibake sequence found: ${match[0]}`
        });
      }
    });
  }

  const payload = {
    ok: findings.length === 0,
    version: "language-quality-audit-v2",
    checkedAt: new Date().toISOString(),
    checkedFiles: checks.map((check) => check.file),
    findings
  };

  console.log(JSON.stringify(payload, null, 2));

  if (findings.some((finding) => finding.severity === "critical")) {
    process.exit(1);
  }
}

main();

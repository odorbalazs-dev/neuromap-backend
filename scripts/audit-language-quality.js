import fs from "fs";

const checks = [
  {
    file: "public/webflow/engine.js",
    required: [
      "20260613-cx-i18n-polish-v1",
      "analytics-event-schema-v2",
      "DRAFT_STORAGE_KEY",
      "buildSummaryConversionHtml",
      "buildPrePaymentTrustHtml",
      "buildReportPreviewV2Html",
      "buildDecisionExplanationHtml",
      "getDraftProgressText"
    ],
    forbidden: [
      "20260527-age-i18n",
      "20260605-landing-hu-cta-v1"
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
      "20260613-cx-i18n-polish-v1"
    ],
    forbidden: [
      "20260527-age-i18n",
      "20260605-landing-hu-cta-v1"
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
    file: "src/api/controllers/admin-dashboard.controller.js",
    required: [
      "<meta charset=\"utf-8\">",
      "NeuroMap Vezérlőközpont",
      "Éles működési felület",
      "Műveleti panel"
    ],
    forbidden: []
  },
  {
    file: "src/services/pdf.service.js",
    required: [
      "gyermek viselked\\u00e9se",
      "PDF_REPORT_VERSION"
    ],
    forbidden: [
      "gyermek működése",
      "gyerek működése",
      "â€”",
      "â€"
    ]
  }
];

const mojibakePatterns = [
  /Ã[\u0080-\u00ff]/u,
  /Ă[\u0080-\uffff]/u,
  /Ĺ[\u0080-\uffff]/u,
  /â€[\u0080-\uffff]?/u,
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
          message: `Old Webflow/experience marker still present: ${token}`
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
    version: "language-quality-audit-v1",
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

import fs from "fs";

const checks = [
  {
    file: "public/webflow/engine.js",
    required: [
      "20260605-cx-top10-v1",
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
      "20260605-cx-top10-v1"
    ],
    forbidden: [
      "20260527-age-i18n",
      "20260605-landing-hu-cta-v1"
    ]
  }
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

import fs from "node:fs";
import vm from "node:vm";

const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
const REQUIRED_ENGINE_VERSION = "20260714-landing-minimal-v2";

const checks = [
  {
    file: "public/webflow/engine.js",
    required: [
      REQUIRED_ENGINE_VERSION,
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
      "20260621-launch-audit-fixes-v1",
      "20260621-language-audit-v2"
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
      REQUIRED_ENGINE_VERSION
    ],
    forbidden: [
      "20260527-age-i18n",
      "20260605-landing-hu-cta-v1",
      "20260621-launch-audit-fixes-v1",
      "20260621-language-audit-v2"
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
    file: "src/templates/reportEmail.js",
    required: [
      "NeuroMap Kids – レポートが完成しました",
      "NeuroMap Kids – التقرير جاهز",
      "PDF报告已作为附件发送",
      "PDFレポートを添付しました",
      "تم إرفاق تقرير PDF"
    ],
    forbidden: [
      "angehaengt",
      "esta adjunto",
      "zalaczony"
    ]
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

const languageBlocks = [
  {
    file: "public/webflow/engine.js",
    marker: "const LANDING_FALLBACK_TEXT =",
    label: "landing fallback copy"
  },
  {
    file: "public/webflow/engine.js",
    marker: "function getLandingProofCopy",
    label: "landing proof copy",
    useLast: true
  },
  {
    file: "public/webflow/engine.js",
    marker: "function buildReportPreviewV2Html",
    label: "landing report preview copy",
    useLast: true
  },
  {
    file: "public/webflow/engine.js",
    marker: "function getCheckoutErrorMessage",
    label: "checkout error copy",
    useLast: true
  },
  {
    file: "src/services/report-v2.service.js",
    marker: "const AGE_COPY =",
    label: "PDF/report age copy"
  },
  {
    file: "src/services/report-v2.service.js",
    marker: "const DOMAIN_ACTIONS =",
    label: "PDF/report action copy"
  },
  {
    file: "src/services/pdf.service.js",
    marker: "function getDomainLabel",
    label: "PDF domain labels"
  },
  {
    file: "src/services/pdf.service.js",
    marker: "function getSeverityLabel",
    label: "PDF severity labels"
  },
  {
    file: "src/templates/reportEmail.js",
    marker: "function getDomainLabel",
    label: "email domain labels"
  },
  {
    file: "src/templates/reportEmail.js",
    marker: "const subjects =",
    label: "email subjects"
  },
  {
    file: "src/templates/reportEmail.js",
    marker: "function getCustomerExperienceCopy",
    label: "email customer experience copy"
  }
];

const mojibakePatterns = [
  /\u00c3[\u0080-\u00ff]/u,
  /\u0102[\u0080-\uffff]/u,
  /\u0139[\u0080-\uffff]/u,
  /\u00c5[\u0080-\uffff]/u,
  /\u00e2(?:\u20ac|\u201e|\u0153|[\u0080-\u0089]|[\u0090-\u0099])/u,
  /\uFFFD/u
];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function addFinding(findings, severity, file, message, token = "") {
  findings.push({
    severity,
    file,
    token,
    message
  });
}

function findBlock(source, marker, useLast = false) {
  const start = useLast ? source.lastIndexOf(marker) : source.indexOf(marker);
  if (start < 0) return null;

  const tailStart = start + marker.length;
  const tail = source.slice(tailStart);
  const topLevelBoundary =
    marker.startsWith("function ") || marker.startsWith("export function ")
      ? /\n(?:function|export function)\s/g
      : /\n(?:const|function|export function)\s/g;

  const candidates = [...tail.matchAll(topLevelBoundary)].map(
    (match) => tailStart + match.index
  );

  const end = candidates.length ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
}

function hasLanguageKey(block, lang) {
  return new RegExp(`(^|[\\s,{])["']?${lang}["']?\\s*:`, "m").test(block);
}

function auditLanguageBlocks(findings) {
  for (const blockConfig of languageBlocks) {
    const source = read(blockConfig.file);
    const block = findBlock(source, blockConfig.marker, blockConfig.useLast);

    if (!block) {
      addFinding(
        findings,
        "critical",
        blockConfig.file,
        `Missing language block: ${blockConfig.label}`,
        blockConfig.marker
      );
      continue;
    }

    for (const lang of SUPPORTED_LANGS) {
      if (!hasLanguageKey(block, lang)) {
        addFinding(
          findings,
          "critical",
          blockConfig.file,
          `${blockConfig.label} is missing language key: ${lang}`,
          lang
        );
      }
    }
  }
}

function getLocalizedTextLength(value) {
  if (typeof value === "string") return value.trim().length;
  if (!value || typeof value !== "object") return 0;

  const candidates = [
    value.label,
    value.question,
    value.prompt,
    value.text,
    value.title,
    value.body
  ];

  return candidates
    .filter((candidate) => typeof candidate === "string")
    .join(" ")
    .trim().length;
}

function runBrowserBundle(file) {
  const source = read(file);
  const context = {
    window: {},
    self: {},
    globalThis: {},
    console: {
      log() {},
      warn() {},
      error() {}
    }
  };
  context.globalThis = context.window;
  context.self = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: file, timeout: 5000 });
  return context.window;
}

function auditBankBundle(findings) {
  const triageFile = "public/banks/triage.embed.js";
  const specificFile = "public/banks/all-banks.bundle.js";
  const triageWindow = runBrowserBundle(triageFile);
  const specificWindow = runBrowserBundle(specificFile);

  const specific = specificWindow.NM_SPECIFIC_BANK || {};
  const bankMap = {
    TRIAGE: {
      file: triageFile,
      bank: triageWindow.NM_TRIAGE_BANK || []
    },
    ADHD: {
      file: specificFile,
      bank: specific.ADHD || specificWindow.NM_ADHD_BANK || []
    },
    ASD: {
      file: specificFile,
      bank: specific.ASD || specificWindow.NM_ASD_BANK || []
    },
    ANXIETY: {
      file: specificFile,
      bank: specific.ANXIETY || specificWindow.NM_ANXIETY_BANK || []
    },
    DEPRESSION: {
      file: specificFile,
      bank: specific.DEPRESSION || specificWindow.NM_DEPRESSION_BANK || []
    },
    LEARNING: {
      file: specificFile,
      bank: specific.LEARNING || specificWindow.NM_LEARNING_BANK || []
    }
  };

  for (const [bankName, entry] of Object.entries(bankMap)) {
    const { file, bank } = entry;

    if (!Array.isArray(bank)) {
      addFinding(findings, "critical", file, `${bankName} bank is not an array.`);
      continue;
    }

    if (bank.length !== 250) {
      addFinding(findings, "critical", file, `${bankName} bank should have 250 items, found ${bank.length}.`);
    }

    bank.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        addFinding(findings, "critical", file, `${bankName}[${index}] is not an object.`);
        return;
      }

      if (!item.id) {
        addFinding(findings, "critical", file, `${bankName}[${index}] is missing id.`);
      }

      if (!item.text || typeof item.text !== "object") {
        addFinding(findings, "critical", file, `${bankName}.${item.id || index} is missing text object.`);
        return;
      }

      for (const lang of SUPPORTED_LANGS) {
        const length = getLocalizedTextLength(item.text[lang]);
        if (length < 8) {
          addFinding(
            findings,
            "critical",
            file,
            `${bankName}.${item.id || index} has missing or too short ${lang} question text.`,
            `${bankName}.${item.id || index}.${lang}`
          );
        }
      }
    });
  }
}

function main() {
  const findings = [];

  for (const check of checks) {
    const source = read(check.file);

    for (const token of check.required) {
      if (!source.includes(token)) {
        addFinding(
          findings,
          "critical",
          check.file,
          `Missing required language/experience marker: ${token}`,
          token
        );
      }
    }

    for (const token of check.forbidden) {
      if (source.includes(token)) {
        addFinding(
          findings,
          "warning",
          check.file,
          `Old or unsafe language marker still present: ${token}`,
          token
        );
      }
    }

    mojibakePatterns.forEach((pattern) => {
      const match = source.match(pattern);
      if (match) {
        addFinding(
          findings,
          "critical",
          check.file,
          `Possible mojibake sequence found: ${match[0]}`,
          match[0]
        );
      }
    });
  }

  auditLanguageBlocks(findings);
  auditBankBundle(findings);

  const payload = {
    ok: findings.length === 0,
    version: "language-quality-audit-v3",
    checkedAt: new Date().toISOString(),
    languages: SUPPORTED_LANGS,
    checkedFiles: checks.map((check) => check.file),
    checkedLanguageBlocks: languageBlocks.map((block) => block.label),
    findings
  };

  console.log(JSON.stringify(payload, null, 2));

  if (findings.some((finding) => finding.severity === "critical")) {
    process.exit(1);
  }
}

main();

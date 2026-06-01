import fs from "fs/promises";
import vm from "vm";
import {
  TRIAGE_BANK,
  SPECIFIC_BANKS
} from "../src/data/banks/index.js";

const AUDIT_VERSION = "bank-quality-v3";
const STRICT = process.argv.includes("--strict");
const AS_JSON = process.argv.includes("--json");

const banks = {
  TRIAGE: TRIAGE_BANK,
  ...SPECIFIC_BANKS
};

const EXPECTED_COUNTS = {
  TRIAGE: 250,
  ADHD: 250,
  ASD: 250,
  ANXIETY: 250,
  DEPRESSION: 250,
  LEARNING: 250
};

const REQUIRED_CORE_LANGS = ["hu", "en"];
const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
const REQUIRED_DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

const PUBLIC_BANK_FILES = {
  TRIAGE: {
    file: "public/banks/triage.embed.js",
    globalName: "NM_TRIAGE_BANK"
  },
  ADHD: {
    file: "public/banks/adhd.bank.translated.js",
    globalName: "NM_ADHD_BANK"
  },
  ASD: {
    file: "public/banks/asd.bank.translated.js",
    globalName: "NM_ASD_BANK"
  },
  ANXIETY: {
    file: "public/banks/anxiety.bank.translated.js",
    globalName: "NM_ANXIETY_BANK"
  },
  DEPRESSION: {
    file: "public/banks/depression.bank.translated.js",
    globalName: "NM_DEPRESSION_BANK"
  },
  LEARNING: {
    file: "public/banks/learning.bank.translated.js",
    globalName: "NM_LEARNING_BANK"
  }
};

const DIAGNOSTIC_TERMS = {
  ADHD: [/\badhd\b/i, /attention[-\s]deficit/i],
  ASD: [/\bautis(?:m|tic)\b/i, /spectrum disorder/i],
  ANXIETY: [/anxiety disorder/i],
  DEPRESSION: [/depression disorder/i, /major depressive/i],
  LEARNING: [/learning disorder/i, /dyslexia/i, /dyscalculia/i]
};

const ABSOLUTE_WORDS = [
  /\balways\b/i,
  /\bnever\b/i,
  /\bimpossible\b/i,
  /\bmindig\b/i,
  /\bsoha\b/i,
  /\blehetetlen\b/i
];

const CONNECTOR_PATTERNS = [
  /\band\b/gi,
  /\bor\b/gi,
  /\bve\b/gi,
  /\bvagy\b/gi,
  /\bés\b/gi,
  /\//g,
  /,/g
];

function countBy(items, getValue) {
  return items.reduce((counts, item) => {
    const value = getValue(item) || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function stats(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return { min: 0, max: 0, avg: 0 };

  return {
    min: Math.min(...valid),
    max: Math.max(...valid),
    avg: Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1))
  };
}

function ratio(value, total) {
  return Number((value / Math.max(1, total)).toFixed(3));
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
}

function wordCount(value = "") {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function countPatternMatches(value, pattern) {
  const matches = String(value || "").match(pattern);
  return matches ? matches.length : 0;
}

function getConnectorLoad(value = "") {
  return CONNECTOR_PATTERNS.reduce((sum, pattern) => {
    return sum + countPatternMatches(value, pattern);
  }, 0);
}

function getText(item, lang) {
  return typeof item?.text?.[lang] === "string" ? item.text[lang].trim() : "";
}

function findDuplicateText(items) {
  const seen = new Map();

  for (const item of items) {
    const key = normalizeText(getText(item, "en") || getText(item, "hu"));
    if (!key) continue;
    seen.set(key, [...(seen.get(key) || []), item.id]);
  }

  return [...seen.values()].filter((ids) => ids.length > 1);
}

function getMissingRequiredFields(items) {
  return items.filter((item) => {
    return !item?.id ||
      !item?.domain ||
      !item?.subdomain ||
      !item?.stemKey ||
      !item?.text ||
      REQUIRED_CORE_LANGS.some((lang) => !getText(item, lang));
  });
}

function getCoverage(items, languages) {
  return Object.fromEntries(languages.map((lang) => {
    const count = items.filter((item) => getText(item, lang)).length;
    return [lang, ratio(count, items.length)];
  }));
}

function getBalanceRatio(counts) {
  const values = Object.values(counts).filter((value) => value > 0);
  if (!values.length) return 0;
  return Number((Math.min(...values) / Math.max(...values)).toFixed(3));
}

function topEntries(counts, limit = 5, direction = "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return Object.entries(counts)
    .sort((a, b) => sign * (a[1] - b[1]))
    .slice(0, limit);
}

function getDomainCountFlags(domainCounts) {
  return REQUIRED_DOMAINS
    .filter((domain) => domainCounts[domain] !== 50)
    .map((domain) => ({
      severity: "critical",
      code: "triage_domain_count",
      message: `TRIAGE domain ${domain} should have 50 items, found ${domainCounts[domain] || 0}.`
    }));
}

function hasDiagnosticLabel(name, item) {
  const patterns = DIAGNOSTIC_TERMS[name] || [];
  const text = `${getText(item, "en")} ${getText(item, "hu")}`;
  return patterns.some((pattern) => pattern.test(text));
}

function getItemQualityIssues(name, item) {
  const issues = [];
  const hu = getText(item, "hu");
  const en = getText(item, "en");
  const maxLength = Math.max(hu.length, en.length);
  const minWords = Math.min(wordCount(hu), wordCount(en));
  const connectorLoad = Math.max(getConnectorLoad(hu), getConnectorLoad(en));

  if (minWords > 0 && minWords < 6) {
    issues.push("too_short");
  }

  if (maxLength > 170) {
    issues.push("too_long");
  }

  if (connectorLoad >= 5 || (connectorLoad >= 3 && maxLength > 120)) {
    issues.push("double_barreled_risk");
  }

  if (hasDiagnosticLabel(name, item)) {
    issues.push("diagnostic_label_bias");
  }

  if (ABSOLUTE_WORDS.some((pattern) => pattern.test(`${hu} ${en}`))) {
    issues.push("absolute_wording");
  }

  return issues;
}

function getItemIssueSummary(name, items) {
  const counts = {};
  const examples = {};

  items.forEach((item) => {
    for (const issue of getItemQualityIssues(name, item)) {
      counts[issue] = (counts[issue] || 0) + 1;
      if (!examples[issue]) {
        examples[issue] = {
          id: item.id,
          en: getText(item, "en"),
          hu: getText(item, "hu")
        };
      }
    }
  });

  return { counts, examples };
}

function getTranslationSignals(items) {
  const sameAsEnglish = {};
  const missing = {};

  for (const lang of SUPPORTED_LANGS) {
    if (lang === "en") continue;

    sameAsEnglish[lang] = 0;
    missing[lang] = 0;

    for (const item of items) {
      const value = getText(item, lang);
      const en = getText(item, "en");

      if (!value) {
        missing[lang] += 1;
      } else if (en && normalizeText(value) === normalizeText(en)) {
        sameAsEnglish[lang] += 1;
      }
    }
  }

  return { missing, sameAsEnglish };
}

function scoreBank(metrics, issues) {
  let score = 100;

  score -= Math.min(30, metrics.missingRequiredFields * 2);
  score -= Math.min(18, metrics.duplicateTexts.length * 4);

  if (metrics.items !== metrics.expectedItems) score -= 20;
  if (metrics.weight.min < 0.5 || metrics.weight.max > 2) score -= 8;
  if (metrics.subdomainBalanceRatio < 0.18) score -= 8;
  if (metrics.maxSubdomainRatio > 0.3) score -= 6;
  if (metrics.maxStemRepeat > 10) score -= 6;
  if (metrics.reverseRatio && (metrics.reverseRatio < 0.1 || metrics.reverseRatio > 0.3)) score -= 5;

  score -= Math.min(18, Object.values(metrics.itemIssueCounts).reduce((sum, value) => sum + value, 0) * 0.35);
  score -= Math.min(12, issues.filter((issue) => issue.severity === "warning").length * 2);

  return Math.max(0, Number(score.toFixed(1)));
}

function buildIssues(name, items, metrics) {
  const issues = [];

  if (items.length !== EXPECTED_COUNTS[name]) {
    issues.push({
      severity: "critical",
      code: "item_count",
      message: `Expected ${EXPECTED_COUNTS[name]} items, found ${items.length}.`
    });
  }

  if (metrics.missingRequiredFields > 0) {
    issues.push({
      severity: "critical",
      code: "missing_required_fields",
      message: `${metrics.missingRequiredFields} item(s) are missing required schema fields or HU/EN text.`
    });
  }

  if (name === "TRIAGE") {
    issues.push(...getDomainCountFlags(metrics.domainCounts));
  }

  if (name !== "TRIAGE" && metrics.reverseRatio < 0.1) {
    issues.push({
      severity: "warning",
      code: "low_reverse_ratio",
      message: "Reverse item ratio is low for a specific bank."
    });
  }

  if (name !== "TRIAGE" && metrics.reverseRatio > 0.3) {
    issues.push({
      severity: "warning",
      code: "high_reverse_ratio",
      message: "Reverse item ratio is high; parent response consistency may suffer."
    });
  }

  if (metrics.maxStemRepeat > 10) {
    issues.push({
      severity: "warning",
      code: "stem_repetition",
      message: "One stemKey appears more than 10 times."
    });
  }

  if (name !== "TRIAGE" && metrics.subdomainCount < 4) {
    issues.push({
      severity: "critical",
      code: "low_subdomain_coverage",
      message: "Specific bank covers fewer than 4 subdomains."
    });
  }

  if (name !== "TRIAGE" && metrics.subdomainBalanceRatio < 0.18) {
    issues.push({
      severity: "warning",
      code: "uneven_subdomain_distribution",
      message: "Subdomain distribution is too uneven for stable adaptive picking."
    });
  }

  if (metrics.maxSubdomainRatio > 0.3 && name !== "TRIAGE") {
    issues.push({
      severity: "review",
      code: "subdomain_concentration",
      message: `Largest subdomain holds ${(metrics.maxSubdomainRatio * 100).toFixed(1)}% of the bank.`
    });
  }

  if (metrics.weight.min < 0.5 || metrics.weight.max > 2) {
    issues.push({
      severity: "critical",
      code: "weight_range",
      message: "Question weights fall outside the expected 0.5..2.0 range."
    });
  }

  if (metrics.duplicateTexts.length > 0) {
    issues.push({
      severity: "critical",
      code: "duplicate_text",
      message: `Duplicate English/Hungarian text found: ${metrics.duplicateTexts.slice(0, 3).join("; ")}`
    });
  }

  if (metrics.huLength.min < 20 || metrics.enLength.min < 20) {
    issues.push({
      severity: "warning",
      code: "short_item_text",
      message: "Some items may be too short to be behaviorally specific."
    });
  }

  if (metrics.huLength.max > 170 || metrics.enLength.max > 170) {
    issues.push({
      severity: "warning",
      code: "long_item_text",
      message: "Some items may be too long for smooth parent completion."
    });
  }

  const itemIssueCounts = metrics.itemIssueCounts;

  if ((itemIssueCounts.double_barreled_risk || 0) > 0) {
    issues.push({
      severity: "review",
      code: "double_barreled_risk",
      message: `${itemIssueCounts.double_barreled_risk} item(s) may contain multiple behavioral claims.`
    });
  }

  if ((itemIssueCounts.too_short || 0) >= 20) {
    issues.push({
      severity: "review",
      code: "short_behavioral_specificity",
      message: `${itemIssueCounts.too_short} item(s) are short enough to deserve a behavioral-specificity review.`
    });
  }

  if ((itemIssueCounts.diagnostic_label_bias || 0) > 0) {
    issues.push({
      severity: "warning",
      code: "diagnostic_label_bias",
      message: `${itemIssueCounts.diagnostic_label_bias} item(s) may expose diagnostic labels inside the question text.`
    });
  }

  if ((itemIssueCounts.absolute_wording || 0) > 0) {
    issues.push({
      severity: "review",
      code: "absolute_wording",
      message: `${itemIssueCounts.absolute_wording} item(s) use absolute wording such as always/never.`
    });
  }

  if (metrics.publicTranslationCoverage) {
    const missingCore = SUPPORTED_LANGS.filter((lang) => metrics.publicTranslationCoverage[lang] < 1);

    if (missingCore.length) {
      issues.push({
        severity: "warning",
        code: "public_translation_missing",
        message: `Public translated bank has incomplete language coverage: ${missingCore.join(", ")}.`
      });
    }

    const sameAsEnglish = Object.entries(metrics.publicTranslationSignals.sameAsEnglish)
      .filter(([, count]) => count > 0);

    if (sameAsEnglish.length) {
      issues.push({
        severity: "review",
        code: "translation_same_as_english",
        message: `Some translated texts equal English: ${sameAsEnglish.map(([lang, count]) => `${lang}:${count}`).join(", ")}.`
      });
    }
  } else {
    issues.push({
      severity: "warning",
      code: "public_translation_not_loaded",
      message: "Public translated bank could not be loaded for multilingual coverage checks."
    });
  }

  return issues;
}

async function loadPublicBank(name) {
  const config = PUBLIC_BANK_FILES[name];
  if (!config) return null;

  try {
    const source = await fs.readFile(config.file, "utf8");
    const context = {
      window: {},
      console: {
        log() {},
        error() {},
        warn() {}
      }
    };

    vm.runInNewContext(source, context, {
      filename: config.file,
      timeout: 2000
    });

    const bank = context.window[config.globalName];
    return Array.isArray(bank) ? bank : null;
  } catch {
    return null;
  }
}

function auditBank(name, items, publicItems) {
  const subdomains = countBy(items, (item) => item.subdomain);
  const domainCounts = countBy(items, (item) => item.domain);
  const stemKeys = countBy(items, (item) => item.stemKey);
  const reverseCount = items.filter((item) => item.reverse).length;
  const duplicateTexts = findDuplicateText(items);
  const topStemKey = topEntries(stemKeys, 1)[0] || ["none", 0];
  const topSubdomain = topEntries(subdomains, 1)[0] || ["none", 0];
  const missingRequiredFields = getMissingRequiredFields(items);
  const itemIssues = getItemIssueSummary(name, items);

  const publicTranslationCoverage = publicItems ? getCoverage(publicItems, SUPPORTED_LANGS) : null;
  const publicTranslationSignals = publicItems ? getTranslationSignals(publicItems) : null;

  const metrics = {
    expectedItems: EXPECTED_COUNTS[name],
    items: items.length,
    publicItems: publicItems ? publicItems.length : 0,
    subdomainCount: Object.keys(subdomains).length,
    subdomainBalanceRatio: getBalanceRatio(subdomains),
    maxSubdomain: topSubdomain[0],
    maxSubdomainCount: topSubdomain[1],
    maxSubdomainRatio: ratio(topSubdomain[1], items.length),
    domainCounts,
    reverseRatio: Number((reverseCount / Math.max(1, items.length)).toFixed(3)),
    uniqueStemKeys: Object.keys(stemKeys).length,
    maxStemKey: topStemKey[0],
    maxStemRepeat: topStemKey[1],
    stemRepeatRatio: ratio(topStemKey[1], items.length),
    missingRequiredFields: missingRequiredFields.length,
    sourceTranslationCoverage: getCoverage(items, REQUIRED_CORE_LANGS),
    publicTranslationCoverage,
    publicTranslationSignals,
    weight: stats(items.map((item) => Number(item?.weight || 1))),
    huLength: stats(items.map((item) => getText(item, "hu").length)),
    enLength: stats(items.map((item) => getText(item, "en").length)),
    huWords: stats(items.map((item) => wordCount(getText(item, "hu")))),
    enWords: stats(items.map((item) => wordCount(getText(item, "en")))),
    duplicateTexts: duplicateTexts.map((ids) => ids.join(", ")),
    itemIssueCounts: itemIssues.counts,
    itemIssueExamples: itemIssues.examples,
    smallestSubdomains: topEntries(subdomains, 5, "asc"),
    largestSubdomains: topEntries(subdomains, 5)
  };

  const issues = buildIssues(name, items, metrics);

  return {
    name,
    version: AUDIT_VERSION,
    score: scoreBank(metrics, issues),
    ...metrics,
    issues,
    blockingIssues: issues.filter((issue) => issue.severity === "critical"),
    strictBlockingIssues: issues.filter((issue) => issue.severity !== "review")
  };
}

function summarize(report) {
  const issueCounts = report.reduce((counts, bank) => {
    for (const issue of bank.issues) {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    }
    return counts;
  }, {});

  const averageScore = Number((
    report.reduce((sum, bank) => sum + bank.score, 0) / Math.max(1, report.length)
  ).toFixed(1));

  return {
    version: AUDIT_VERSION,
    strict: STRICT,
    banks: report.length,
    averageScore,
    issueCounts: {
      critical: issueCounts.critical || 0,
      warning: issueCounts.warning || 0,
      review: issueCounts.review || 0
    },
    lowestScoringBanks: report
      .map((bank) => ({ name: bank.name, score: bank.score }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
  };
}

function printReport(report, summary) {
  console.log(`\n${AUDIT_VERSION}`);
  console.log(`Average score: ${summary.averageScore}`);
  console.log(`Issues: critical=${summary.issueCounts.critical}, warning=${summary.issueCounts.warning}, review=${summary.issueCounts.review}`);

  for (const bank of report) {
    console.log(`\n=== ${bank.name} ===`);
    console.log(`Score: ${bank.score}/100`);
    console.log(`Items: ${bank.items} (public: ${bank.publicItems})`);

    if (bank.name === "TRIAGE") {
      console.log(`Domain counts: ${JSON.stringify(bank.domainCounts)}`);
    }

    console.log(`Subdomains: ${bank.subdomainCount}`);
    console.log(`Subdomain balance ratio: ${bank.subdomainBalanceRatio}`);
    console.log(`Largest subdomain: ${bank.maxSubdomain} (${bank.maxSubdomainCount}, ratio ${bank.maxSubdomainRatio})`);
    console.log(`Reverse ratio: ${bank.reverseRatio}`);
    console.log(`Unique stemKeys: ${bank.uniqueStemKeys}`);
    console.log(`Max stemKey repeat: ${bank.maxStemKey} (${bank.maxStemRepeat})`);
    console.log(`Missing required fields: ${bank.missingRequiredFields}`);
    console.log(`Source HU/EN coverage: ${JSON.stringify(bank.sourceTranslationCoverage)}`);
    console.log(`Public translation coverage: ${JSON.stringify(bank.publicTranslationCoverage || {})}`);
    console.log(`Weight stats: ${JSON.stringify(bank.weight)}`);
    console.log(`HU length: ${JSON.stringify(bank.huLength)} | words: ${JSON.stringify(bank.huWords)}`);
    console.log(`EN length: ${JSON.stringify(bank.enLength)} | words: ${JSON.stringify(bank.enWords)}`);
    console.log(`Smallest subdomains: ${JSON.stringify(bank.smallestSubdomains)}`);
    console.log(`Largest subdomains: ${JSON.stringify(bank.largestSubdomains)}`);
    console.log(`Item issue counts: ${JSON.stringify(bank.itemIssueCounts)}`);

    if (bank.issues.length) {
      console.log("Issues:");
      bank.issues.forEach((issue) => {
        console.log(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      });
    } else {
      console.log("Issues: none");
    }
  }

  console.log("\nLowest scoring banks:");
  summary.lowestScoringBanks.forEach((bank) => {
    console.log(`- ${bank.name}: ${bank.score}/100`);
  });
}

async function main() {
  const publicBanks = {};

  for (const name of Object.keys(banks)) {
    publicBanks[name] = await loadPublicBank(name);
  }

  const report = Object.entries(banks).map(([name, items]) => {
    return auditBank(name, items, publicBanks[name]);
  });

  const summary = summarize(report);

  if (AS_JSON) {
    console.log(JSON.stringify({ summary, banks: report }, null, 2));
  } else {
    printReport(report, summary);
  }

  const blockingCount = STRICT
    ? report.reduce((sum, bank) => sum + bank.strictBlockingIssues.length, 0)
    : report.reduce((sum, bank) => sum + bank.blockingIssues.length, 0);

  if (blockingCount > 0) {
    if (!AS_JSON) {
      console.log(`\nQuality audit failed with ${blockingCount} blocking issue(s).`);
    }
    process.exitCode = 1;
  } else if (STRICT && summary.issueCounts.warning > 0) {
    if (!AS_JSON) {
      console.log("\nQuality audit strict mode completed with warning-level findings.");
    }
  } else {
    if (!AS_JSON) {
      console.log("\nQuality audit completed without blocking issues.");
    }
  }
}

main().catch((error) => {
  console.error("Audit failed:", error);
  process.exit(1);
});

import fs from "fs/promises";
import path from "path";
import vm from "vm";
import { TRIAGE_BANK, SPECIFIC_BANKS } from "../data/banks/index.js";

const AUDIT_VERSION = "bank-quality-v4-ux";
const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
const REQUIRED_CORE_LANGS = ["hu", "en"];
const REQUIRED_DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

const BANKS = {
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

const PARENT_FRIENDLY_TERMS = [
  /\bbehavior\b/i,
  /\beveryday\b/i,
  /\bsituation\b/i,
  /\bviselkedes/i,
  /\bhetkoznap/i,
  /\bhelyzet/i,
  /\bmegfigyel/i
];

const STIGMATIZING_TERMS = [
  /\bwrong\b/i,
  /\bbad\b/i,
  /\bproblem child\b/i,
  /\bdefective\b/i,
  /\brossz\b/i,
  /\bhibas\b/i,
  /\bbeteg\b/i,
  /\bmegbelyeg/i
];

const CONNECTOR_PATTERNS = [
  /\band\b/gi,
  /\bor\b/gi,
  /\bve\b/gi,
  /\bvagy\b/gi,
  /\bes\b/gi,
  /\//g,
  /,/g
];

function countBy(items, getValue) {
  return items.reduce((counts, item) => {
    const value = getValue(item) || "unknown";
    counts[value] = Number(counts[value] || 0) + 1;
    return counts;
  }, {});
}

function sortedCounts(counts = {}) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count: Number(count || 0) }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
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
  return Number((Number(value || 0) / Math.max(1, Number(total || 0))).toFixed(3));
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

function topEntries(counts, limit = 5, direction = "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return Object.entries(counts)
    .sort((a, b) => sign * (a[1] - b[1]) || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function getBalanceRatio(counts) {
  const values = Object.values(counts).filter((value) => value > 0);
  if (!values.length) return 0;
  return Number((Math.min(...values) / Math.max(...values)).toFixed(3));
}

function getCoverage(items, languages) {
  return Object.fromEntries(languages.map((lang) => {
    const count = items.filter((item) => getText(item, lang)).length;
    return [lang, ratio(count, items.length)];
  }));
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

  if (minWords > 0 && minWords < 6) issues.push("too_short");
  if (maxLength > 170) issues.push("too_long");
  if (connectorLoad >= 5 || (connectorLoad >= 3 && maxLength > 120)) {
    issues.push("double_barreled_risk");
  }
  if (hasDiagnosticLabel(name, item)) issues.push("diagnostic_label_bias");
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
      counts[issue] = Number(counts[issue] || 0) + 1;
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

function getUxSignals(name, items) {
  const total = Math.max(1, items.length);
  let parentFriendly = 0;
  let nonStigmatizing = 0;
  let conciseBehavior = 0;
  let diagnosticNeutral = 0;

  for (const item of items) {
    const text = `${getText(item, "en")} ${getText(item, "hu")}`;
    const normalized = normalizeText(text);
    const words = wordCount(text);
    const hasFriendlyCue = PARENT_FRIENDLY_TERMS.some((pattern) => pattern.test(text));
    const hasStigmatizingCue = STIGMATIZING_TERMS.some((pattern) => pattern.test(normalized));
    const hasDiagnosticCue = hasDiagnosticLabel(name, item);
    const connectorLoad = getConnectorLoad(text);

    if (hasFriendlyCue || item.subdomain || item.stemKey) parentFriendly += 1;
    if (!hasStigmatizingCue) nonStigmatizing += 1;
    if (words >= 6 && words <= 24 && connectorLoad < 5) conciseBehavior += 1;
    if (!hasDiagnosticCue) diagnosticNeutral += 1;
  }

  const parentFriendlyRatio = ratio(parentFriendly, total);
  const nonStigmatizingRatio = ratio(nonStigmatizing, total);
  const conciseBehaviorRatio = ratio(conciseBehavior, total);
  const diagnosticNeutralRatio = ratio(diagnosticNeutral, total);
  const completionComfortScore = Number(((
    parentFriendlyRatio * 0.25 +
    nonStigmatizingRatio * 0.3 +
    conciseBehaviorRatio * 0.25 +
    diagnosticNeutralRatio * 0.2
  ) * 100).toFixed(1));

  const weakestUxSignal = [
    ["parent_friendly", parentFriendlyRatio],
    ["non_stigmatizing", nonStigmatizingRatio],
    ["concise_behavioral", conciseBehaviorRatio],
    ["diagnostic_neutral", diagnosticNeutralRatio]
  ].sort((a, b) => a[1] - b[1])[0];

  return {
    parentFriendlyRatio,
    nonStigmatizingRatio,
    conciseBehaviorRatio,
    diagnosticNeutralRatio,
    completionComfortScore,
    weakestUxSignal: weakestUxSignal ? weakestUxSignal[0] : "unknown"
  };
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

function buildIssue(severity, code, message) {
  return { severity, code, message };
}

function getDomainCountFlags(domainCounts) {
  return REQUIRED_DOMAINS
    .filter((domain) => domainCounts[domain] !== 50)
    .map((domain) => buildIssue(
      "critical",
      "triage_domain_count",
      `TRIAGE domain ${domain} should have 50 items, found ${domainCounts[domain] || 0}.`
    ));
}

function buildIssues(name, items, metrics) {
  const issues = [];

  if (items.length !== EXPECTED_COUNTS[name]) {
    issues.push(buildIssue("critical", "item_count", `Expected ${EXPECTED_COUNTS[name]} items, found ${items.length}.`));
  }

  if (metrics.missingRequiredFields > 0) {
    issues.push(buildIssue("critical", "missing_required_fields", `${metrics.missingRequiredFields} item(s) are missing required schema fields or HU/EN text.`));
  }

  if (name === "TRIAGE") {
    issues.push(...getDomainCountFlags(metrics.domainCounts));
  }

  if (name !== "TRIAGE" && metrics.reverseRatio < 0.1) {
    issues.push(buildIssue("warning", "low_reverse_ratio", "Reverse item ratio is low for a specific bank."));
  }

  if (name !== "TRIAGE" && metrics.reverseRatio > 0.3) {
    issues.push(buildIssue("warning", "high_reverse_ratio", "Reverse item ratio is high; parent response consistency may suffer."));
  }

  if (metrics.maxStemRepeat > 10) {
    issues.push(buildIssue("warning", "stem_repetition", "One stemKey appears more than 10 times."));
  }

  if (name !== "TRIAGE" && metrics.subdomainCount < 4) {
    issues.push(buildIssue("critical", "low_subdomain_coverage", "Specific bank covers fewer than 4 subdomains."));
  }

  if (name !== "TRIAGE" && metrics.subdomainBalanceRatio < 0.18) {
    issues.push(buildIssue("warning", "uneven_subdomain_distribution", "Subdomain distribution is too uneven for stable adaptive picking."));
  }

  if (metrics.maxSubdomainRatio > 0.3 && name !== "TRIAGE") {
    issues.push(buildIssue("review", "subdomain_concentration", `Largest subdomain holds ${(metrics.maxSubdomainRatio * 100).toFixed(1)}% of the bank.`));
  }

  if (metrics.weight.min < 0.5 || metrics.weight.max > 2) {
    issues.push(buildIssue("critical", "weight_range", "Question weights fall outside the expected 0.5..2.0 range."));
  }

  if (metrics.duplicateTexts.length > 0) {
    issues.push(buildIssue("critical", "duplicate_text", `Duplicate English/Hungarian text found: ${metrics.duplicateTexts.slice(0, 3).join("; ")}`));
  }

  if (metrics.huLength.min < 20 || metrics.enLength.min < 20) {
    issues.push(buildIssue("warning", "short_item_text", "Some items may be too short to be behaviorally specific."));
  }

  if (metrics.huLength.max > 170 || metrics.enLength.max > 170) {
    issues.push(buildIssue("warning", "long_item_text", "Some items may be too long for smooth parent completion."));
  }

  if (metrics.ux?.completionComfortScore < 82) {
    issues.push(buildIssue("review", "parent_completion_ux", "Parent-facing completion comfort score is below the preferred threshold."));
  }

  if (metrics.ux?.nonStigmatizingRatio < 0.98) {
    issues.push(buildIssue("warning", "stigmatizing_language_risk", "Some items may contain wording that feels stigmatizing or alarming to parents."));
  }

  const itemIssueCounts = metrics.itemIssueCounts;

  if ((itemIssueCounts.double_barreled_risk || 0) > 0) {
    issues.push(buildIssue("review", "double_barreled_risk", `${itemIssueCounts.double_barreled_risk} item(s) may contain multiple behavioral claims.`));
  }

  if ((itemIssueCounts.too_short || 0) >= 20) {
    issues.push(buildIssue("review", "short_behavioral_specificity", `${itemIssueCounts.too_short} item(s) are short enough to deserve a behavioral-specificity review.`));
  }

  if ((itemIssueCounts.diagnostic_label_bias || 0) > 0) {
    issues.push(buildIssue("warning", "diagnostic_label_bias", `${itemIssueCounts.diagnostic_label_bias} item(s) may expose diagnostic labels inside the question text.`));
  }

  if ((itemIssueCounts.absolute_wording || 0) > 0) {
    issues.push(buildIssue("review", "absolute_wording", `${itemIssueCounts.absolute_wording} item(s) use absolute wording such as always/never.`));
  }

  if (metrics.publicTranslationCoverage) {
    const missingCore = SUPPORTED_LANGS.filter((lang) => metrics.publicTranslationCoverage[lang] < 1);

    if (missingCore.length) {
      issues.push(buildIssue("warning", "public_translation_missing", `Public translated bank has incomplete language coverage: ${missingCore.join(", ")}.`));
    }

    const sameAsEnglish = Object.entries(metrics.publicTranslationSignals.sameAsEnglish)
      .filter(([, count]) => count > 0);

    if (sameAsEnglish.length) {
      issues.push(buildIssue("review", "translation_same_as_english", `Some translated texts equal English: ${sameAsEnglish.map(([lang, count]) => `${lang}:${count}`).join(", ")}.`));
    }
  } else {
    issues.push(buildIssue("warning", "public_translation_not_loaded", "Public translated bank could not be loaded for multilingual coverage checks."));
  }

  return issues;
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
  if (metrics.ux?.completionComfortScore < 82) score -= 4;
  if (metrics.ux?.nonStigmatizingRatio < 0.98) score -= 6;

  score -= Math.min(18, Object.values(metrics.itemIssueCounts).reduce((sum, value) => sum + value, 0) * 0.35);
  score -= Math.min(12, issues.filter((issue) => issue.severity === "warning").length * 2);

  return Math.max(0, Number(score.toFixed(1)));
}

function getReadiness(score, issues) {
  if (issues.some((issue) => issue.severity === "critical")) return "critical";
  if (score < 80 || issues.some((issue) => issue.severity === "warning")) return "warning";
  if (score < 90 || issues.some((issue) => issue.severity === "review")) return "review";
  return "healthy";
}

async function loadPublicBank(name, includePublic) {
  if (!includePublic) return null;

  const config = PUBLIC_BANK_FILES[name];
  if (!config) return null;

  try {
    const absolutePath = path.join(process.cwd(), config.file);
    const source = await fs.readFile(absolutePath, "utf8");
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
  const safeItems = Array.isArray(items) ? items : [];
  const subdomains = countBy(safeItems, (item) => item.subdomain);
  const domainCounts = countBy(safeItems, (item) => item.domain);
  const stemKeys = countBy(safeItems, (item) => item.stemKey);
  const reverseCount = safeItems.filter((item) => item.reverse).length;
  const duplicateTexts = findDuplicateText(safeItems);
  const topStemKey = topEntries(stemKeys, 1)[0] || ["none", 0];
  const topSubdomain = topEntries(subdomains, 1)[0] || ["none", 0];
  const missingRequiredFields = getMissingRequiredFields(safeItems);
  const itemIssues = getItemIssueSummary(name, safeItems);
  const uxSignals = getUxSignals(name, safeItems);

  const publicTranslationCoverage = publicItems ? getCoverage(publicItems, SUPPORTED_LANGS) : null;
  const publicTranslationSignals = publicItems ? getTranslationSignals(publicItems) : null;

  const metrics = {
    expectedItems: EXPECTED_COUNTS[name],
    items: safeItems.length,
    publicItems: publicItems ? publicItems.length : 0,
    subdomainCount: Object.keys(subdomains).length,
    subdomainBalanceRatio: getBalanceRatio(subdomains),
    maxSubdomain: topSubdomain[0],
    maxSubdomainCount: topSubdomain[1],
    maxSubdomainRatio: ratio(topSubdomain[1], safeItems.length),
    domainCounts,
    reverseRatio: Number((reverseCount / Math.max(1, safeItems.length)).toFixed(3)),
    uniqueStemKeys: Object.keys(stemKeys).length,
    maxStemKey: topStemKey[0],
    maxStemRepeat: topStemKey[1],
    stemRepeatRatio: ratio(topStemKey[1], safeItems.length),
    missingRequiredFields: missingRequiredFields.length,
    sourceTranslationCoverage: getCoverage(safeItems, REQUIRED_CORE_LANGS),
    publicTranslationCoverage,
    publicTranslationSignals,
    weight: stats(safeItems.map((item) => Number(item?.weight || 1))),
    huLength: stats(safeItems.map((item) => getText(item, "hu").length)),
    enLength: stats(safeItems.map((item) => getText(item, "en").length)),
    huWords: stats(safeItems.map((item) => wordCount(getText(item, "hu")))),
    enWords: stats(safeItems.map((item) => wordCount(getText(item, "en")))),
    duplicateTexts: duplicateTexts.map((ids) => ids.join(", ")),
    itemIssueCounts: itemIssues.counts,
    itemIssueExamples: itemIssues.examples,
    ux: uxSignals,
    smallestSubdomains: topEntries(subdomains, 5, "asc"),
    largestSubdomains: topEntries(subdomains, 5)
  };

  const issues = buildIssues(name, safeItems, metrics);
  const score = scoreBank(metrics, issues);

  return {
    name,
    version: AUDIT_VERSION,
    score,
    readiness: getReadiness(score, issues),
    ...metrics,
    issues,
    blockingIssues: issues.filter((issue) => issue.severity === "critical"),
    strictBlockingIssues: issues.filter((issue) => issue.severity !== "review")
  };
}

function buildRecommendations(report) {
  const recommendations = [];
  const criticalBanks = report.filter((bank) => bank.readiness === "critical");
  const warningBanks = report.filter((bank) => bank.readiness === "warning");
  const translationIssues = report.filter((bank) =>
    bank.issues.some((issue) => issue.code === "public_translation_missing" || issue.code === "translation_same_as_english")
  );
  const subdomainIssues = report.filter((bank) =>
    bank.issues.some((issue) => issue.code === "uneven_subdomain_distribution" || issue.code === "subdomain_concentration")
  );
  const wordingIssues = report.filter((bank) =>
    bank.issues.some((issue) =>
      issue.code === "double_barreled_risk" ||
      issue.code === "diagnostic_label_bias" ||
      issue.code === "absolute_wording" ||
      issue.code === "short_behavioral_specificity"
    )
  );
  const uxIssues = report.filter((bank) =>
    bank.issues.some((issue) =>
      issue.code === "parent_completion_ux" ||
      issue.code === "stigmatizing_language_risk"
    )
  );

  if (criticalBanks.length) {
    recommendations.push({
      level: "critical",
      title: "Blocking bank quality issue",
      detail: `${criticalBanks.map((bank) => bank.name).join(", ")} has critical schema, count, duplicate, or coverage findings.`
    });
  }

  if (warningBanks.length) {
    recommendations.push({
      level: "warning",
      title: "Review warning-level bank drift",
      detail: `${warningBanks.map((bank) => bank.name).join(", ")} should be reviewed before the next public question expansion.`
    });
  }

  if (translationIssues.length) {
    recommendations.push({
      level: "review",
      title: "Check multilingual bank coverage",
      detail: `${translationIssues.map((bank) => bank.name).join(", ")} has missing or English-identical translated public items.`
    });
  }

  if (subdomainIssues.length) {
    recommendations.push({
      level: "review",
      title: "Balance adaptive picking inputs",
      detail: `${subdomainIssues.map((bank) => bank.name).join(", ")} has uneven subdomain distribution that can bias random-balanced picking.`
    });
  }

  if (wordingIssues.length) {
    recommendations.push({
      level: "review",
      title: "Tighten behavioral wording",
      detail: `${wordingIssues.map((bank) => bank.name).join(", ")} has wording candidates for short, absolute, diagnostic, or double-barreled review.`
    });
  }

  if (uxIssues.length) {
    recommendations.push({
      level: "review",
      title: "Improve parent completion experience",
      detail: `${uxIssues.map((bank) => bank.name).join(", ")} should be reviewed for calmer, more behavior-focused, parent-friendly question wording.`
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      level: "healthy",
      title: "Bank quality baseline is stable",
      detail: "No blocking bank-quality findings were detected in the current bank set."
    });
  }

  return recommendations;
}

function summarize(report, strict) {
  const issueCounts = report.reduce((counts, bank) => {
    for (const issue of bank.issues) {
      counts[issue.severity] = Number(counts[issue.severity] || 0) + 1;
    }
    return counts;
  }, {});

  const averageScore = Number((
    report.reduce((sum, bank) => sum + bank.score, 0) / Math.max(1, report.length)
  ).toFixed(1));

  const readinessCounts = countBy(report, (bank) => bank.readiness);
  const lowestScoringBanks = report
    .map((bank) => ({ name: bank.name, score: bank.score, readiness: bank.readiness }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const blockingIssueCount = strict
    ? report.reduce((sum, bank) => sum + bank.strictBlockingIssues.length, 0)
    : report.reduce((sum, bank) => sum + bank.blockingIssues.length, 0);

  return {
    version: AUDIT_VERSION,
    strict: Boolean(strict),
    banks: report.length,
    averageScore,
    blockingIssueCount,
    status: blockingIssueCount > 0 ? "blocking" : issueCounts.warning ? "warning" : "ready",
    issueCounts: {
      critical: issueCounts.critical || 0,
      warning: issueCounts.warning || 0,
      review: issueCounts.review || 0
    },
    readinessCounts: {
      critical: readinessCounts.critical || 0,
      warning: readinessCounts.warning || 0,
      review: readinessCounts.review || 0,
      healthy: readinessCounts.healthy || 0
    },
    lowestScoringBanks,
    issueCodes: sortedCounts(countBy(
      report.flatMap((bank) => bank.issues),
      (issue) => issue.code
    )),
    recommendations: buildRecommendations(report)
  };
}

export async function buildBankQualityAudit(options = {}) {
  const strict = Boolean(options.strict);
  const includePublic = options.includePublic !== false;
  const publicBanks = {};

  for (const name of Object.keys(BANKS)) {
    publicBanks[name] = await loadPublicBank(name, includePublic);
  }

  const report = Object.entries(BANKS).map(([name, items]) => {
    return auditBank(name, items, publicBanks[name]);
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: summarize(report, strict),
    banks: report
  };
}

export function printBankQualityAuditReport(payload) {
  const report = payload.banks || [];
  const summary = payload.summary || {};

  console.log(`\n${AUDIT_VERSION}`);
  console.log(`Average score: ${summary.averageScore}`);
  console.log(`Issues: critical=${summary.issueCounts?.critical || 0}, warning=${summary.issueCounts?.warning || 0}, review=${summary.issueCounts?.review || 0}`);

  for (const bank of report) {
    console.log(`\n=== ${bank.name} ===`);
    console.log(`Score: ${bank.score}/100 (${bank.readiness})`);
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
    console.log(`Parent UX signals: ${JSON.stringify(bank.ux || {})}`);

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
  (summary.lowestScoringBanks || []).forEach((bank) => {
    console.log(`- ${bank.name}: ${bank.score}/100 (${bank.readiness})`);
  });

  if (summary.recommendations?.length) {
    console.log("\nRecommendations:");
    summary.recommendations.forEach((item) => {
      console.log(`- [${item.level}] ${item.title}: ${item.detail}`);
    });
  }
}

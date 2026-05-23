import {
  TRIAGE_BANK,
  SPECIFIC_BANKS
} from "../src/data/banks/index.js";

import {
  analyzeAdaptiveState,
  pickBalancedSpecificQuestions
} from "../src/services/adaptive-engine.service.js";

const DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

const EXPECTED_SPECIFIC_COUNT = 30;
const MIN_REVERSE_RATIO = 0.10;
const MAX_REVERSE_RATIO = 0.34;
const MIN_UNIQUE_STEM_RATIO = 0.82;

const SCENARIOS = [
  {
    name: "coherent_primary",
    triageScores: {
      ADHD: 2.45,
      ASD: 1.35,
      ANXIETY: 1.15,
      DEPRESSION: 0.8,
      LEARNING: 1.05
    },
    expectedPrimary: "ADHD",
    expectedExtra: false
  },
  {
    name: "mixed_pattern",
    triageScores: {
      ADHD: 2.15,
      ASD: 2.0,
      ANXIETY: 1.2,
      DEPRESSION: 0.9,
      LEARNING: 1.1
    },
    expectedPrimary: "ADHD",
    expectedSecondary: "ASD",
    expectedExtra: true
  },
  {
    name: "low_signal",
    triageScores: {
      ADHD: 0.65,
      ASD: 0.55,
      ANXIETY: 0.5,
      DEPRESSION: 0.45,
      LEARNING: 0.5
    },
    expectedPrimary: "ADHD",
    expectedExtra: false
  }
];

function countBy(items, getValue) {
  return items.reduce((counts, item) => {
    const value = getValue(item) || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function getDuplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });

  return [...duplicates];
}

function summarizeSelection(domain, selected) {
  const subdomainCounts = countBy(selected, (item) => item.subdomain);
  const stemCounts = countBy(selected, (item) => item.stemKey);
  const duplicateIds = getDuplicateValues(selected.map((item) => item.id));
  const reverseCount = selected.filter((item) => item.reverse).length;
  const maxStemRepeat = Math.max(...Object.values(stemCounts));

  return {
    domain,
    items: selected.length,
    uniqueIds: new Set(selected.map((item) => item.id)).size,
    duplicateIds,
    subdomainCount: Object.keys(subdomainCounts).length,
    subdomainCounts,
    uniqueStemKeys: Object.keys(stemCounts).length,
    uniqueStemRatio: round(Object.keys(stemCounts).length / Math.max(1, selected.length)),
    maxStemRepeat,
    reverseRatio: round(reverseCount / Math.max(1, selected.length))
  };
}

function auditSelection(domain, bank) {
  const focusSubdomains = Object.keys(countBy(bank, (item) => item.subdomain)).slice(0, 5);
  const selected = pickBalancedSpecificQuestions(bank, {
    count: EXPECTED_SPECIFIC_COUNT,
    seed: `engine-audit:${domain}`,
    focusSubdomains,
    maxPerStem: 1,
    targetReverseRatio: 0.2
  });

  const summary = summarizeSelection(domain, selected);
  const errors = [];
  const warnings = [];

  if (summary.items !== EXPECTED_SPECIFIC_COUNT) {
    errors.push(`${domain}: expected ${EXPECTED_SPECIFIC_COUNT} selected items, found ${summary.items}.`);
  }

  if (summary.duplicateIds.length) {
    errors.push(`${domain}: duplicate selected IDs: ${summary.duplicateIds.join(", ")}.`);
  }

  if (summary.uniqueStemRatio < MIN_UNIQUE_STEM_RATIO) {
    errors.push(
      `${domain}: unique stemKey ratio too low: ${summary.uniqueStemRatio}.`
    );
  }

  if (summary.maxStemRepeat > 2) {
    errors.push(`${domain}: one stemKey selected too often: ${summary.maxStemRepeat}.`);
  }

  if (summary.reverseRatio < MIN_REVERSE_RATIO || summary.reverseRatio > MAX_REVERSE_RATIO) {
    warnings.push(
      `${domain}: reverse ratio outside preferred range: ${summary.reverseRatio}.`
    );
  }

  if (summary.subdomainCount < Math.min(4, Object.keys(summary.subdomainCounts).length)) {
    warnings.push(`${domain}: selected questions cover few subdomains: ${summary.subdomainCount}.`);
  }

  return {
    summary,
    errors,
    warnings
  };
}

function auditAdaptiveScenarios() {
  const errors = [];
  const warnings = [];
  const summaries = [];

  SCENARIOS.forEach((scenario) => {
    const result = analyzeAdaptiveState({
      triageScores: scenario.triageScores,
      specificScoring: {
        totalWeight: 30
      }
    });

    const summary = {
      name: scenario.name,
      primaryDomain: result.primaryDomain,
      secondaryDomain: result.secondaryDomain,
      severity: result.severity,
      confidence: result.confidence,
      scoreGap: result.scoreGap,
      interpretation: result.interpretation,
      shouldAskExtra: result.shouldAskExtra,
      focusSubdomains: result.recommendedFocusAreas
    };

    summaries.push(summary);

    if (scenario.expectedPrimary && result.primaryDomain !== scenario.expectedPrimary) {
      errors.push(
        `${scenario.name}: expected primary ${scenario.expectedPrimary}, found ${result.primaryDomain}.`
      );
    }

    if (scenario.expectedSecondary && result.secondaryDomain !== scenario.expectedSecondary) {
      errors.push(
        `${scenario.name}: expected secondary ${scenario.expectedSecondary}, found ${result.secondaryDomain}.`
      );
    }

    if (result.shouldAskExtra !== scenario.expectedExtra) {
      errors.push(
        `${scenario.name}: expected shouldAskExtra=${scenario.expectedExtra}, found ${result.shouldAskExtra}.`
      );
    }

    if (!Array.isArray(result.recommendedFocusAreas) || result.recommendedFocusAreas.length === 0) {
      warnings.push(`${scenario.name}: no recommended focus areas returned.`);
    }
  });

  return { summaries, errors, warnings };
}

function auditTriageShape() {
  const errors = [];
  const domainCounts = countBy(TRIAGE_BANK, (item) => item.domain);

  DOMAINS.forEach((domain) => {
    if (domainCounts[domain] !== 50) {
      errors.push(`TRIAGE: ${domain} should have 50 items, found ${domainCounts[domain] || 0}.`);
    }
  });

  return {
    summary: {
      items: TRIAGE_BANK.length,
      domainCounts
    },
    errors
  };
}

function main() {
  const allErrors = [];
  const allWarnings = [];

  const triageAudit = auditTriageShape();
  allErrors.push(...triageAudit.errors);

  console.log("\n=== TRIAGE SELECTION READINESS ===");
  console.log(`Items: ${triageAudit.summary.items}`);
  console.log(`Domain counts: ${JSON.stringify(triageAudit.summary.domainCounts)}`);

  console.log("\n=== SPECIFIC PICKER READINESS ===");
  DOMAINS.forEach((domain) => {
    const bank = SPECIFIC_BANKS[domain] || [];
    const audit = auditSelection(domain, bank);

    allErrors.push(...audit.errors);
    allWarnings.push(...audit.warnings);

    console.log(`\n${domain}`);
    console.log(`Selected: ${audit.summary.items}`);
    console.log(`Subdomains: ${audit.summary.subdomainCount} ${JSON.stringify(audit.summary.subdomainCounts)}`);
    console.log(`Unique stemKeys: ${audit.summary.uniqueStemKeys}/${audit.summary.items} (${audit.summary.uniqueStemRatio})`);
    console.log(`Max stemKey repeat: ${audit.summary.maxStemRepeat}`);
    console.log(`Reverse ratio: ${audit.summary.reverseRatio}`);
  });

  const adaptiveAudit = auditAdaptiveScenarios();
  allErrors.push(...adaptiveAudit.errors);
  allWarnings.push(...adaptiveAudit.warnings);

  console.log("\n=== ADAPTIVE DECISION READINESS ===");
  adaptiveAudit.summaries.forEach((summary) => {
    console.log(`\n${summary.name}`);
    console.log(JSON.stringify(summary, null, 2));
  });

  if (allWarnings.length) {
    console.log("\nWARNINGS:");
    allWarnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (allErrors.length) {
    console.log("\nERRORS:");
    allErrors.forEach((error) => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log("\nEngine selection audit passed.");
}

main();

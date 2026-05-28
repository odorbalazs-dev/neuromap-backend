import {
  TRIAGE_BANK,
  SPECIFIC_BANKS
} from "../src/data/banks/index.js";

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
const REQUIRED_DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

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

function findDuplicateText(items) {
  const seen = new Map();

  for (const item of items) {
    const key = normalizeText(item?.text?.en || item?.text?.hu || "");
    if (!key) continue;
    seen.set(key, [...(seen.get(key) || []), item.id]);
  }

  return [...seen.values()].filter((ids) => ids.length > 1);
}

function getMissingRequiredFields(items) {
  return items.filter((item) => {
    return !item?.id ||
      !item?.subdomain ||
      !item?.stemKey ||
      !item?.text ||
      REQUIRED_CORE_LANGS.some((lang) => !item.text[lang]);
  });
}

function getTranslationCoverage(items) {
  const languages = [...new Set(items.flatMap((item) => Object.keys(item?.text || {})))].sort();

  return Object.fromEntries(languages.map((lang) => {
    const count = items.filter((item) => typeof item?.text?.[lang] === "string" && item.text[lang].trim()).length;
    return [lang, ratio(count, items.length)];
  }));
}

function getBalanceRatio(counts) {
  const values = Object.values(counts).filter((value) => value > 0);
  if (!values.length) return 0;
  return Number((Math.min(...values) / Math.max(...values)).toFixed(3));
}

function getDomainCountFlags(domainCounts) {
  return REQUIRED_DOMAINS
    .filter((domain) => domainCounts[domain] !== 50)
    .map((domain) => `TRIAGE domain ${domain} should have 50 items, found ${domainCounts[domain] || 0}.`);
}

function getQualityFlags(name, items, metrics) {
  const flags = [];

  if (items.length !== EXPECTED_COUNTS[name]) {
    flags.push(`Expected ${EXPECTED_COUNTS[name]} items, found ${items.length}.`);
  }

  if (metrics.missingRequiredFields > 0) {
    flags.push(`${metrics.missingRequiredFields} item(s) are missing required schema fields or HU/EN text.`);
  }

  if (name === "TRIAGE") {
    flags.push(...getDomainCountFlags(metrics.domainCounts));
  }

  if (name !== "TRIAGE" && metrics.reverseRatio < 0.1) {
    flags.push("Reverse item ratio is low for a specific bank.");
  }

  if (name !== "TRIAGE" && metrics.reverseRatio > 0.3) {
    flags.push("Reverse item ratio is high; parent response consistency may suffer.");
  }

  if (metrics.maxStemRepeat > 10) {
    flags.push("One stemKey appears more than 10 times.");
  }

  if (name !== "TRIAGE" && metrics.subdomainCount < 4) {
    flags.push("Specific bank covers fewer than 4 subdomains.");
  }

  if (name !== "TRIAGE" && metrics.subdomainBalanceRatio < 0.18) {
    flags.push("Subdomain distribution is too uneven for stable adaptive picking.");
  }

  if (metrics.weight.min < 0.5 || metrics.weight.max > 2) {
    flags.push("Question weights fall outside the expected 0.5..2.0 range.");
  }

  if (metrics.duplicateTexts.length > 0) {
    flags.push(`Duplicate English text found: ${metrics.duplicateTexts.slice(0, 3).join("; ")}`);
  }

  if (metrics.huLength.min < 20 || metrics.enLength.min < 20) {
    flags.push("Some items may be too short to be behaviorally specific.");
  }

  if (metrics.huLength.max > 160 || metrics.enLength.max > 160) {
    flags.push("Some items may be too long for smooth parent completion.");
  }

  return flags;
}

function auditBank(name, items) {
  const subdomains = countBy(items, (item) => item.subdomain);
  const domainCounts = countBy(items, (item) => item.domain);
  const stemKeys = countBy(items, (item) => item.stemKey);
  const reverseCount = items.filter((item) => item.reverse).length;
  const duplicateTexts = findDuplicateText(items);
  const topStemKey = Object.entries(stemKeys).sort((a, b) => b[1] - a[1])[0] || ["none", 0];
  const missingRequiredFields = getMissingRequiredFields(items);

  const metrics = {
    items: items.length,
    subdomainCount: Object.keys(subdomains).length,
    subdomainBalanceRatio: getBalanceRatio(subdomains),
    domainCounts,
    reverseRatio: Number((reverseCount / Math.max(1, items.length)).toFixed(3)),
    uniqueStemKeys: Object.keys(stemKeys).length,
    maxStemKey: topStemKey[0],
    maxStemRepeat: topStemKey[1],
    stemRepeatRatio: ratio(topStemKey[1], items.length),
    missingRequiredFields: missingRequiredFields.length,
    translationCoverage: getTranslationCoverage(items),
    weight: stats(items.map((item) => Number(item?.weight || 1))),
    huLength: stats(items.map((item) => item?.text?.hu?.length || 0)),
    enLength: stats(items.map((item) => item?.text?.en?.length || 0)),
    duplicateTexts: duplicateTexts.map((ids) => ids.join(", "))
  };

  return {
    name,
    ...metrics,
    smallestSubdomains: Object.entries(subdomains).sort((a, b) => a[1] - b[1]).slice(0, 5),
    largestSubdomains: Object.entries(subdomains).sort((a, b) => b[1] - a[1]).slice(0, 5),
    flags: getQualityFlags(name, items, metrics)
  };
}

const report = Object.entries(banks).map(([name, items]) => auditBank(name, items));

for (const bank of report) {
  console.log(`\n=== ${bank.name} ===`);
  console.log(`Items: ${bank.items}`);
  if (bank.name === "TRIAGE") {
    console.log(`Domain counts: ${JSON.stringify(bank.domainCounts)}`);
  }
  console.log(`Subdomains: ${bank.subdomainCount}`);
  console.log(`Subdomain balance ratio: ${bank.subdomainBalanceRatio}`);
  console.log(`Reverse ratio: ${bank.reverseRatio}`);
  console.log(`Unique stemKeys: ${bank.uniqueStemKeys}`);
  console.log(`Max stemKey repeat: ${bank.maxStemKey} (${bank.maxStemRepeat})`);
  console.log(`Missing required fields: ${bank.missingRequiredFields}`);
  console.log(`Translation coverage: ${JSON.stringify(bank.translationCoverage)}`);
  console.log(`Weight stats: ${JSON.stringify(bank.weight)}`);
  console.log(`HU length: ${JSON.stringify(bank.huLength)}`);
  console.log(`EN length: ${JSON.stringify(bank.enLength)}`);
  console.log(`Smallest subdomains: ${JSON.stringify(bank.smallestSubdomains)}`);
  console.log(`Largest subdomains: ${JSON.stringify(bank.largestSubdomains)}`);

  if (bank.flags.length) {
    console.log("Flags:");
    bank.flags.forEach((flag) => console.log(`- ${flag}`));
  } else {
    console.log("Flags: none");
  }
}

const totalFlags = report.reduce((sum, bank) => sum + bank.flags.length, 0);

if (totalFlags) {
  console.log(`\nQuality audit completed with ${totalFlags} flag(s).`);
  process.exitCode = 1;
} else {
  console.log("\nQuality audit completed without blocking flags.");
}

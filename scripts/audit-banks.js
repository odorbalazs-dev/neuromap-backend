import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const BANK_FILES = [
  {
    name: "TRIAGE",
    file: "src/data/banks/triage.bank.js",
    exportName: "TRIAGE_BANK",
    expectedCount: 250,
    requireReverse: false,
    requireStemKey: true,
    requireSubdomain: true,
    languages: ["hu", "en"]
  },
  {
    name: "ASD",
    file: "src/data/banks/asd.bank.js",
    exportName: "ASD_BANK",
    expectedCount: 250,
    requireReverse: true,
    requireStemKey: true,
    requireSubdomain: true,
    languages: ["hu", "en"]
  },
  {
    name: "ADHD",
    file: "src/data/banks/adhd.bank.js",
    exportName: "ADHD_BANK",
    expectedCount: 250,
    requireReverse: true,
    requireStemKey: true,
    requireSubdomain: true,
    languages: ["hu", "en"]
  },
  {
    name: "ANXIETY",
    file: "src/data/banks/anxiety.bank.js",
    exportName: "ANXIETY_BANK",
    expectedCount: 250,
    requireReverse: true,
    requireStemKey: true,
    requireSubdomain: true,
    languages: ["hu", "en"]
  },
  {
    name: "DEPRESSION",
    file: "src/data/banks/depression.bank.js",
    exportName: "DEPRESSION_BANK",
    expectedCount: 250,
    requireReverse: true,
    requireStemKey: true,
    requireSubdomain: true,
    languages: ["hu", "en"]
  },
  {
    name: "LEARNING",
    file: "src/data/banks/learning.bank.js",
    exportName: "LEARNING_BANK",
    expectedCount: 250,
    requireReverse: true,
    requireStemKey: true,
    requireSubdomain: true,
    languages: ["hu", "en"]
  }
];

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item?.[key] || "MISSING";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });

  return [...duplicates];
}

function auditBank(config, bank) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(bank)) {
    errors.push(`${config.name}: export is not an array.`);
    return { errors, warnings };
  }

  if (bank.length !== config.expectedCount) {
    errors.push(
      `${config.name}: expected ${config.expectedCount} items, found ${bank.length}.`
    );
  }

  const ids = bank.map((item) => item?.id).filter(Boolean);
  const duplicateIds = findDuplicates(ids);

  if (duplicateIds.length) {
    errors.push(`${config.name}: duplicate IDs: ${duplicateIds.join(", ")}`);
  }

  bank.forEach((item, index) => {
    const label = `${config.name}[${index}] ${item?.id || "NO_ID"}`;

    if (!item?.id) errors.push(`${label}: missing id.`);
    if (!item?.domain) errors.push(`${label}: missing domain.`);
    if (item?.domain && item.domain !== config.name && config.name !== "TRIAGE") {
      errors.push(`${label}: domain should be ${config.name}, found ${item.domain}.`);
    }

    if (config.name === "TRIAGE") {
      const allowed = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
      if (!allowed.includes(item?.domain)) {
        errors.push(`${label}: invalid triage domain: ${item?.domain}`);
      }
    }

    if (config.requireSubdomain && !item?.subdomain) {
      errors.push(`${label}: missing subdomain.`);
    }

    if (typeof item?.weight !== "number") {
      errors.push(`${label}: weight must be number.`);
    }

    if (config.requireReverse && typeof item?.reverse !== "boolean") {
      errors.push(`${label}: reverse must be boolean.`);
    }

    if (config.requireStemKey && !item?.stemKey) {
      errors.push(`${label}: missing stemKey.`);
    }

    if (!isObject(item?.text)) {
      errors.push(`${label}: text must be object.`);
    } else {
      config.languages.forEach((lang) => {
        if (!item.text[lang] || typeof item.text[lang] !== "string") {
          errors.push(`${label}: missing text.${lang}.`);
        }
      });
    }
  });

  const subdomainCounts = countBy(bank, "subdomain");
  const stemKeyCounts = countBy(bank, "stemKey");

  const repeatedStemKeys = Object.entries(stemKeyCounts)
    .filter(([key, count]) => key !== "MISSING" && count > 10)
    .map(([key, count]) => `${key}:${count}`);

  if (repeatedStemKeys.length) {
    warnings.push(`${config.name}: high stemKey repetition: ${repeatedStemKeys.join(", ")}`);
  }

  if (config.requireReverse) {
    const reverseCount = bank.filter((item) => item.reverse === true).length;
    const reverseRatio = reverseCount / bank.length;

    if (reverseRatio > 0.35) {
      warnings.push(`${config.name}: reverse ratio seems high: ${(reverseRatio * 100).toFixed(1)}%`);
    }

    if (reverseRatio < 0.05) {
      warnings.push(`${config.name}: reverse ratio seems low: ${(reverseRatio * 100).toFixed(1)}%`);
    }
  }

  if (config.name === "TRIAGE") {
    const domainCounts = countBy(bank, "domain");
    const expected = {
      ADHD: 50,
      ASD: 50,
      ANXIETY: 50,
      DEPRESSION: 50,
      LEARNING: 50
    };

    Object.entries(expected).forEach(([domain, count]) => {
      if (domainCounts[domain] !== count) {
        errors.push(`${config.name}: ${domain} should have ${count}, found ${domainCounts[domain] || 0}.`);
      }
    });
  }

  console.log(`\n=== ${config.name} ===`);
  console.log(`Items: ${bank.length}`);
  console.log(`Subdomains:`, subdomainCounts);

  return { errors, warnings };
}

async function importBank(filePath, exportName) {
  const absolutePath = path.join(process.cwd(), filePath);
  await fs.access(absolutePath);

  const moduleUrl = pathToFileURL(absolutePath).href + `?t=${Date.now()}`;
  const mod = await import(moduleUrl);

  return mod[exportName];
}

async function main() {
  const allErrors = [];
  const allWarnings = [];

  for (const config of BANK_FILES) {
    try {
      const bank = await importBank(config.file, config.exportName);
      const { errors, warnings } = auditBank(config, bank);

      allErrors.push(...errors);
      allWarnings.push(...warnings);
    } catch (error) {
      allErrors.push(`${config.name}: failed to load ${config.file}: ${error.message}`);
    }
  }

  if (allWarnings.length) {
    console.log("\n⚠️ WARNINGS:");
    allWarnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (allErrors.length) {
    console.log("\n❌ ERRORS:");
    allErrors.forEach((error) => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log("\n✅ Bank audit passed.");
}

main().catch((error) => {
  console.error("Audit failed:", error);
  process.exit(1);
});
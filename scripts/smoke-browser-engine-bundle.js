import fs from "fs";
import vm from "vm";

const DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countBy(items, getValue) {
  return items.reduce((counts, item) => {
    const value = getValue(item) || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function summarizeSelection(engine, selected) {
  const stemCounts = countBy(selected, (item) => engine.inferStemKey(item));
  const subdomainCounts = countBy(selected, (item) => item.subdomain);

  return {
    selected: selected.length,
    uniqueIds: new Set(selected.map((item) => item.id)).size,
    uniqueStemKeys: Object.keys(stemCounts).length,
    maxStemRepeat: Math.max(...Object.values(stemCounts)),
    reverseCount: selected.filter((item) => item.reverse).length,
    subdomainCount: Object.keys(subdomainCounts).length
  };
}

function loadBundle() {
  const code = fs.readFileSync("public/banks/all-banks.bundle.js", "utf8");
  const sandbox = {
    window: {},
    console: {
      log() {},
      warn() {},
      error() {}
    }
  };

  sandbox.window.console = sandbox.console;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {
    filename: "public/banks/all-banks.bundle.js"
  });

  return sandbox.window;
}

function main() {
  const window = loadBundle();

  assert(window.NM_SPECIFIC_BANK, "NM_SPECIFIC_BANK is missing from browser bundle.");
  assert(window.NM_ADAPTIVE_ENGINE, "NM_ADAPTIVE_ENGINE is missing from browser bundle.");
  assert(
    typeof window.NM_ADAPTIVE_ENGINE.pickBalancedSpecificQuestions === "function",
    "NM_ADAPTIVE_ENGINE.pickBalancedSpecificQuestions is missing."
  );

  console.log("\n=== BROWSER ENGINE BUNDLE SMOKE ===");

  DOMAINS.forEach((domain) => {
    const bank = window.NM_SPECIFIC_BANK[domain];
    assert(Array.isArray(bank), `${domain} bank is missing from browser bundle.`);
    assert(bank.length === 250, `${domain} bank should have 250 items, found ${bank.length}.`);

    const selected = window.NM_ADAPTIVE_ENGINE.pickBalancedSpecificQuestions(bank, {
      count: 30,
      seed: `browser-smoke:${domain}`,
      focusSubdomains: window.NM_ADAPTIVE_ENGINE.getRecommendedFocusAreas(domain),
      maxPerStem: 1,
      targetReverseRatio: 0.2
    });

    const summary = summarizeSelection(window.NM_ADAPTIVE_ENGINE, selected);

    assert(summary.selected === 30, `${domain} should select 30 items, found ${summary.selected}.`);
    assert(summary.uniqueIds === 30, `${domain} selected duplicate question IDs.`);
    assert(summary.maxStemRepeat <= 2, `${domain} selected one stemKey too often.`);
    assert(summary.reverseCount >= 4 && summary.reverseCount <= 8, `${domain} reverse count is outside expected range.`);
    assert(summary.subdomainCount >= 4, `${domain} selected too few subdomains.`);

    console.log(domain, summary);
  });

  console.log("Browser engine bundle smoke passed.");
}

try {
  main();
} catch (error) {
  console.error("Browser engine bundle smoke failed:", error.message);
  process.exit(1);
}

import fs from "fs/promises";
import path from "path";

const BANK_MAP = [
  { fileIncludes: "adhd.bank", globalName: "NM_ADHD_BANK" },
  { fileIncludes: "asd.bank", globalName: "NM_ASD_BANK" },
  { fileIncludes: "anxiety.bank", globalName: "NM_ANXIETY_BANK" },
  { fileIncludes: "depression.bank", globalName: "NM_DEPRESSION_BANK" },
  { fileIncludes: "learning.bank", globalName: "NM_LEARNING_BANK" }
];

const BROWSER_ENGINE_UTILS = `
window.NM_ADAPTIVE_ENGINE = (function () {
  function hashSeed(seed) {
    return Array.from(String(seed || "neuromap")).reduce(function (hash, char) {
      return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
    }, 2166136261);
  }

  function seededRandom(seed) {
    var state = hashSeed(seed) || 1;

    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function shuffle(items, seed) {
    var random = seededRandom(seed);
    var copy = Array.isArray(items) ? items.slice() : [];

    for (var index = copy.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(random() * (index + 1));
      var current = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = current;
    }

    return copy;
  }

  function countBy(items, key) {
    return (Array.isArray(items) ? items : []).reduce(function (counts, item) {
      var value = key === "stemKey" ? inferStemKey(item) : item && item[key] ? item[key] : "unknown";
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
  }

  function inferStemKey(item) {
    if (item && item.stemKey) return item.stemKey;

    var rawText =
      item && item.text
        ? item.text.en || item.text.hu || item.text.de || item.text.es || ""
        : "";
    var normalizedText = String(rawText)
      .toLowerCase()
      .replace(/[^\\p{L}\\p{N}\\s]/gu, "")
      .trim();
    var words = normalizedText.split(/\\s+/).filter(Boolean).slice(0, 6).join("_");

    return (item && item.subdomain ? item.subdomain : "general") + "::" + words;
  }

  function getSubdomainTarget(bank, subdomain, count) {
    var total = bank.length || 1;
    var available = bank.filter(function (item) {
      return item && item.subdomain === subdomain;
    }).length;

    return Math.max(1, Math.round((available / total) * count));
  }

  function scoreCandidate(item, selected, bank, options) {
    var count = options.count;
    var focusSubdomains = options.focusSubdomains || [];
    var maxPerStem = options.maxPerStem || 1;
    var targetReverseRatio = options.targetReverseRatio || 0.2;
    var avoidStemKeys = options.avoidStemKeys || [];

    var subdomainCounts = countBy(selected, "subdomain");
    var stemCounts = countBy(selected, "stemKey");
    var reverseCount = selected.filter(function (question) {
      return !!question.reverse;
    }).length;
    var targetSubdomainCount = getSubdomainTarget(bank, item.subdomain, count);
    var currentSubdomainCount = subdomainCounts[item.subdomain] || 0;
    var itemStemKey = inferStemKey(item);
    var currentStemCount = stemCounts[itemStemKey] || 0;
    var currentReverseRatio = selected.length ? reverseCount / selected.length : 0;

    var score = Number(item.weight || 1) * 10;

    if (focusSubdomains.indexOf(item.subdomain) >= 0) score += 18;
    if (currentSubdomainCount < targetSubdomainCount) score += 16;
    if (currentSubdomainCount === 0) score += 10;
    if (item.reverse && currentReverseRatio < targetReverseRatio) score += 8;
    if (!item.reverse && currentReverseRatio > targetReverseRatio) score += 4;

    score -= currentSubdomainCount * 5;
    score -= currentStemCount * 22;

    if (currentStemCount >= maxPerStem) score -= 120;
    if (avoidStemKeys.indexOf(itemStemKey) >= 0) score -= 90;

    return score;
  }

  function pickBalancedSpecificQuestions(bank, options) {
    options = options || {};

    if (!Array.isArray(bank) || bank.length === 0) return [];

    var count = Number(options.count || 30);
    var requestedCount = Math.min(count, bank.length);
    var selected = [];
    var selectedIds = {};
    var randomizedBank = shuffle(bank, options.seed || "neuromap");
    var maxPerStem = Number(options.maxPerStem || 1);
    var targetReverseRatio = Number(options.targetReverseRatio || 0.2);
    var bankStemCount = Object.keys(countBy(bank, "stemKey")).length;

    while (selected.length < requestedCount) {
      var candidates = randomizedBank.filter(function (item) {
        return item && item.id && !selectedIds[item.id];
      });

      if (!candidates.length) break;

      var relaxedMaxPerStem =
        selected.length < Math.min(requestedCount, bankStemCount)
          ? maxPerStem
          : Math.max(maxPerStem, 2);

      candidates.sort(function (a, b) {
        return scoreCandidate(b, selected, bank, {
          count: requestedCount,
          focusSubdomains: options.focusSubdomains || [],
          avoidStemKeys: options.avoidStemKeys || [],
          maxPerStem: relaxedMaxPerStem,
          targetReverseRatio: targetReverseRatio
        }) - scoreCandidate(a, selected, bank, {
          count: requestedCount,
          focusSubdomains: options.focusSubdomains || [],
          avoidStemKeys: options.avoidStemKeys || [],
          maxPerStem: relaxedMaxPerStem,
          targetReverseRatio: targetReverseRatio
        });
      });

      selected.push(candidates[0]);
      selectedIds[candidates[0].id] = true;
    }

    return selected;
  }

  function getRecommendedFocusAreas(primaryDomain, secondaryDomain, interpretation) {
    var focusAreas = {
      ADHD: ["inattention", "executive", "impulsivity", "emotional", "hyperactivity"],
      ASD: ["social_reciprocity", "nonverbal_communication", "relationships", "flexibility", "sensory_processing", "restricted_patterns", "pragmatic_language"],
      ANXIETY: ["general_worry", "intolerance_of_uncertainty", "physical_arousal", "avoidance_safety", "reassurance_control", "social_evaluative_anxiety", "restlessness_tension", "concentration_sleep"],
      DEPRESSION: ["low_mood", "anhedonia_interest_loss", "energy_fatigue", "self_worth_guilt", "hopelessness_future", "withdrawal_isolation", "sleep_change", "concentration_decision"],
      LEARNING: ["attention_focus", "working_memory", "processing_speed", "executive_function", "organization_time_management", "comprehension_language", "self_monitoring_error_awareness", "academic_expression_output"]
    };

    var primaryAreas = focusAreas[primaryDomain] || [];
    var secondaryAreas = focusAreas[secondaryDomain] || [];
    var combined = interpretation === "mixed_pattern" || interpretation === "uncertain_pattern"
      ? primaryAreas.slice(0, 5).concat(secondaryAreas.slice(0, 3))
      : primaryAreas;

    return combined.filter(function (area, index) {
      return area && combined.indexOf(area) === index;
    });
  }

  return {
    inferStemKey: inferStemKey,
    pickBalancedSpecificQuestions: pickBalancedSpecificQuestions,
    getRecommendedFocusAreas: getRecommendedFocusAreas
  };
})();

console.log("NM_ADAPTIVE_ENGINE LOADED");
`;

function convertToBrowserGlobal(content, globalName) {
  let out = content.trim();

  out = out.replace(/export\s+const\s+([A-Z_]+)\s*=/, `window.${globalName} =`);
  out = out.replace(/const\s+([A-Z_]+)\s*=/, `window.${globalName} =`);
  out = out.replace(/console\.log\(.*?\);?/g, "");

  return out;
}

async function main() {
  const publicBanksDir = path.join(process.cwd(), "public", "banks");
  const outputFile = path.join(publicBanksDir, "all-banks.bundle.js");

  const files = await fs.readdir(publicBanksDir);

  const translatedBankFiles = files
    .filter((file) => file.endsWith(".translated.js"))
    .filter((file) => !file.includes("triage"))
    .sort();

  if (translatedBankFiles.length === 0) {
    throw new Error("No translated specific bank files found in public/banks");
  }

  const parts = [];

  parts.push(`/* =========================`);
  parts.push(`   ALL SPECIFIC BANKS BUNDLE`);
  parts.push(`========================= */`);
  parts.push(``);

  for (const mapItem of BANK_MAP) {
    const file = translatedBankFiles.find((f) =>
      f.toLowerCase().includes(mapItem.fileIncludes)
    );

    if (!file) {
      throw new Error(`Missing translated bank file for ${mapItem.fileIncludes}`);
    }

    const fullPath = path.join(publicBanksDir, file);
    const content = await fs.readFile(fullPath, "utf8");

    parts.push(`/* ===== ${file} ===== */`);
    parts.push(convertToBrowserGlobal(content, mapItem.globalName));
    parts.push(``);
  }

  parts.push(`
window.NM_SPECIFIC_BANK = {
  ADHD: window.NM_ADHD_BANK || [],
  ASD: window.NM_ASD_BANK || [],
  ANXIETY: window.NM_ANXIETY_BANK || [],
  DEPRESSION: window.NM_DEPRESSION_BANK || [],
  LEARNING: window.NM_LEARNING_BANK || []
};

console.log("✅ ALL BANKS BUNDLE LOADED", {
  ADHD: window.NM_SPECIFIC_BANK.ADHD.length,
  ASD: window.NM_SPECIFIC_BANK.ASD.length,
  ANXIETY: window.NM_SPECIFIC_BANK.ANXIETY.length,
  DEPRESSION: window.NM_SPECIFIC_BANK.DEPRESSION.length,
  LEARNING: window.NM_SPECIFIC_BANK.LEARNING.length
});
`);
  parts.push(BROWSER_ENGINE_UTILS);

  await fs.writeFile(outputFile, parts.join("\n"), "utf8");

  console.log(`DONE: ${outputFile}`);
  console.log(`Included files:`, translatedBankFiles);
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});

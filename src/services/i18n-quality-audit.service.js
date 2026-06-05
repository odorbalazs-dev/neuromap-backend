import fs from "fs";
import path from "path";

const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function readRepoFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (_error) {
    return "";
  }
}

function addCheck(checks, area, lang, passed, detail, severity = "critical") {
  checks.push({
    area,
    lang,
    status: passed ? "pass" : severity,
    detail
  });
}

function containsAny(source, patterns) {
  return patterns.some((pattern) => source.includes(pattern));
}

export function buildI18nQualityAudit() {
  const engine = readRepoFile("public/webflow/engine.js");
  const checkoutPages = readRepoFile("public/webflow/checkout-pages.js");
  const bundle = readRepoFile("public/banks/all-banks.bundle.js");
  const checks = [];

  for (const lang of SUPPORTED_LANGS) {
    addCheck(
      checks,
      "engine-ui",
      lang,
      containsAny(engine, [`${lang}: {`, `${lang}: {`, `case "${lang}"`, `lang === "${lang}"`]),
      `Engine language coverage for ${lang}`,
      lang === "en" || lang === "hu" ? "critical" : "warning"
    );

    addCheck(
      checks,
      "checkout-pages",
      lang,
      containsAny(checkoutPages, [`${lang}: {`, `"${lang}"`, `'${lang}'`]),
      `Success/cancel page copy coverage for ${lang}`,
      "warning"
    );

    addCheck(
      checks,
      "bank-bundle",
      lang,
      bundle.includes(`${lang}:`) || bundle.includes(`"${lang}"`),
      `Question bank text coverage marker for ${lang}`,
      lang === "en" || lang === "hu" ? "critical" : "warning"
    );
  }

  addCheck(
    checks,
    "engine-runtime",
    "all",
    engine.includes("NM_APPLY_LANDING_LANGUAGE") && engine.includes("selectLang"),
    "Landing language switch hooks are present"
  );

  addCheck(
    checks,
    "checkout-runtime",
    "all",
    checkoutPages.includes("purchase") && checkoutPages.includes("checkout_cancelled"),
    "Checkout analytics event hooks are present"
  );

  const critical = checks.filter((check) => check.status === "critical").length;
  const warning = checks.filter((check) => check.status === "warning").length;
  const pass = checks.filter((check) => check.status === "pass").length;

  const level = critical ? "critical" : warning ? "warning" : "healthy";
  const recommendations = [];

  if (critical) {
    recommendations.push("Fix critical HU/EN language coverage before paid traffic is scaled.");
  }

  if (warning) {
    recommendations.push("Review secondary language fallbacks and success/cancel copy consistency.");
  }

  if (!critical && !warning) {
    recommendations.push("Language coverage markers look consistent across the Webflow runtime.");
  }

  return {
    ok: critical === 0,
    generatedAt: new Date().toISOString(),
    level,
    summary: {
      languages: SUPPORTED_LANGS.length,
      checksTotal: checks.length,
      passed: pass,
      warnings: warning,
      critical
    },
    checks,
    recommendations
  };
}

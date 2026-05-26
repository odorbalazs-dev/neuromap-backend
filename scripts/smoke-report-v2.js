import {
  buildReportV2Context,
  buildReportV2EmailContext,
  buildReportV2PromptContext,
  extractChildAgeYears,
  getAgeBand
} from "../src/services/report-v2.service.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("\n=== STRUCTURED REPORT V2 SMOKE ===");

  const withAge = {
    childAge: "7",
    detectedRisk: "ADHD"
  };

  assert(extractChildAgeYears(withAge) === 7, "Should extract numeric child age.");
  assert(getAgeBand(7) === "early_school", "Age 7 should map to early school.");

  const promptContext = buildReportV2PromptContext(withAge, "hu");
  assert(promptContext.version === "structured_report_v2", "Prompt context should expose v2 version.");
  assert(promptContext.hasAge === true, "Prompt context should mark age as available.");
  assert(promptContext.ageBand === "early_school", "Prompt context should include age band.");
  assert(
    promptContext.recommendations.length >= 3,
    "Prompt context should include age-aware recommendations."
  );

  const emailContext = buildReportV2EmailContext(withAge, "hu");
  assert(emailContext.title, "Email context should include a title.");
  assert(emailContext.recommendationTitle, "Email context should include recommendation title.");

  const withoutAge = buildReportV2Context({ detectedRisk: "ANXIETY" }, "en");
  assert(withoutAge.ageYears === null, "Missing age should stay null.");
  assert(withoutAge.ageBand === "unknown", "Missing age should map to unknown.");
  assert(withoutAge.hasAge === false, "Missing age should not be marked as available.");
  assert(
    withoutAge.interpretation.toLowerCase().includes("age"),
    "Unknown-age interpretation should mention age."
  );

  console.log("Structured report v2 smoke passed.", {
    ageBand: promptContext.ageBand,
    fallbackAgeBand: withoutAge.ageBand
  });
}

try {
  main();
} catch (error) {
  console.error("Structured report v2 smoke failed:", error.message);
  process.exit(1);
}

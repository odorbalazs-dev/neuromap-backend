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
    detectedRisk: "ADHD",
    secondaryRisk: "ANXIETY",
    specificScoring: {
      normalizedAverage: 1.8,
      subdomains: {
        executive_function: {
          average: 2.2,
          itemCount: 6,
          totalWeight: 6
        },
        emotional_regulation: {
          average: 1.4,
          itemCount: 5,
          totalWeight: 5
        }
      }
    }
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
  assert(promptContext.actionPlanTitle, "Prompt context should include an action plan title.");
  assert(
    Array.isArray(promptContext.actionPlan) && promptContext.actionPlan.length >= 3,
    "Prompt context should include a domain-aware action plan."
  );
  assert(promptContext.observationFocus, "Prompt context should include observation guidance.");
  assert(promptContext.escalationNote, "Prompt context should include an escalation note.");
  assert(
    promptContext.primaryFocusLabel.includes("Figyelmi és aktivitásszabályozási terület") &&
      promptContext.primaryFocusLabel.includes("(ADHD-related attention and activity regulation)"),
    "Hungarian primary focus should include its English professional equivalent."
  );
  assert(
    promptContext.secondaryFocusLabel.includes("Szorongásos terület") &&
      promptContext.secondaryFocusLabel.includes("(anxiety-related area)"),
    "Hungarian secondary focus should include its English professional equivalent."
  );
  assert(
    promptContext.focusSubdomains[0]?.label ===
      "Végrehajtó működés (executive functioning)",
    "Hungarian focus areas should use bilingual professional labels."
  );
  assert(
    !promptContext.focusSubdomains.some((item) => item.label.includes("_")),
    "Focus area labels must not expose internal underscore keys."
  );
  assert(
    promptContext.observationFocus.includes("Végrehajtó működés (executive functioning)") &&
      !promptContext.observationFocus.includes("executive_function"),
    "Observation guidance should use bilingual labels instead of internal keys."
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

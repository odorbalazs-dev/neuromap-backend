import {
  REPORT_SECTION_COUNT,
  cleanGeneratedReportText,
  getNumberedReportSections,
  validateReportStructure
} from "../src/services/report-contract.service.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildValidReport() {
  return Array.from({ length: REPORT_SECTION_COUNT }, (_, index) => {
    const number = index + 1;
    return `${number}. Section ${number}\n\nThis is a parent-friendly paragraph for section ${number}. It is short, readable, and intentionally plain.`;
  }).join("\n\n");
}

function main() {
  console.log("\n=== ANALYSIS REPORT CONTRACT SMOKE ===");

  const messy = `
### 1. Short opening summary

**This text has markdown wrappers** but keeps a numbered heading.

---

2. Main observed patterns

The body remains readable.
`;

  const cleaned = cleanGeneratedReportText(messy);

  assert(!cleaned.includes("###"), "Markdown heading markers should be removed.");
  assert(!cleaned.includes("**"), "Bold markdown markers should be removed.");
  assert(!cleaned.includes("---"), "Horizontal rules should be removed.");
  assert(cleaned.startsWith("1. Short opening summary"), "Numbered heading should remain.");

  const valid = buildValidReport();
  const sections = getNumberedReportSections(valid);
  const validation = validateReportStructure(valid, { minLength: 500 });

  assert(sections.length === REPORT_SECTION_COUNT, "Valid report should expose all numbered sections.");
  assert(validation.ok, `Valid report should pass. Errors: ${validation.errors.join("; ")}`);

  const missingSection = valid.replace("\n\n11. Section 11", "\n\n12. Section 12");
  const brokenValidation = validateReportStructure(missingSection);

  assert(!brokenValidation.ok, "Broken numbering should fail validation.");
  assert(
    brokenValidation.errors.some((error) => error.includes("Expected section 11")),
    "Broken numbering should report the missing section position."
  );

  console.log("Analysis report contract smoke passed.", {
    sections: sections.length
  });
}

try {
  main();
} catch (error) {
  console.error("Analysis report contract smoke failed:", error.message);
  process.exit(1);
}

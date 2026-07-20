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
    const disclaimer = number === REPORT_SECTION_COUNT ? " This is not a diagnosis." : "";
    return `${number}. Section ${number}\n\nThis is a parent-friendly paragraph for section ${number}. It is readable, specific, and intentionally plain. It also contains enough context to explain the observed pattern, its everyday relevance, and one practical next step without overstating certainty.${disclaimer}`;
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
  const validation = validateReportStructure(valid, {
    minLength: 2000,
    minSectionLength: 160,
    maxHeadingLength: 180,
    requireBlankLine: true,
    requiredPatterns: [
      {
        label: "the English non-diagnostic disclaimer",
        pattern: /not (?:a )?diagnosis/i
      }
    ]
  });

  assert(sections.length === REPORT_SECTION_COUNT, "Valid report should expose all numbered sections.");
  assert(validation.ok, `Valid report should pass. Errors: ${validation.errors.join("; ")}`);

  const missingSection = valid.replace("\n\n11. Section 11", "\n\n12. Section 12");
  const brokenValidation = validateReportStructure(missingSection);

  assert(!brokenValidation.ok, "Broken numbering should fail validation.");
  assert(
    brokenValidation.errors.some((error) => error.includes("Expected section 11")),
    "Broken numbering should report the missing section position."
  );

  const thinSection = valid.replace(
    "This is a parent-friendly paragraph for section 5. It is readable, specific, and intentionally plain. It also contains enough context to explain the observed pattern, its everyday relevance, and one practical next step without overstating certainty.",
    "Too short."
  );
  const thinValidation = validateReportStructure(thinSection, { minSectionLength: 160 });
  assert(!thinValidation.ok, "A thin section should fail validation.");
  assert(
    thinValidation.errors.some((error) => error.includes("Section 5 is too short")),
    "A thin section should identify the affected section."
  );

  const missingBlankLine = valid.replace("3. Section 3\n\n", "3. Section 3\n");
  const spacingValidation = validateReportStructure(missingBlankLine, { requireBlankLine: true });
  assert(!spacingValidation.ok, "A missing heading separator should fail validation.");

  const missingDisclaimer = valid.replace(" This is not a diagnosis.", "");
  const disclaimerValidation = validateReportStructure(missingDisclaimer, {
    requiredPatterns: [
      {
        label: "the English non-diagnostic disclaimer",
        pattern: /not (?:a )?diagnosis/i
      }
    ]
  });
  assert(!disclaimerValidation.ok, "A report without the required disclaimer should fail validation.");
  assert(
    disclaimerValidation.errors.some((error) => error.includes("non-diagnostic disclaimer")),
    "A missing disclaimer should produce a specific contract error."
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

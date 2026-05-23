export const REPORT_SECTION_COUNT = 11;

export function cleanGeneratedReportText(text = "") {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getNumberedReportSections(text = "") {
  const matches = [...String(text || "").matchAll(/^(\d{1,2})\.\s+\S.*$/gm)];

  return matches.map((match) => ({
    number: Number(match[1]),
    heading: match[0].trim(),
    index: match.index || 0
  }));
}

export function validateReportStructure(text = "", options = {}) {
  const cleaned = String(text || "").trim();
  const sections = getNumberedReportSections(cleaned);
  const errors = [];

  if (!cleaned) {
    errors.push("Report text is empty.");
  }

  if (/^\s*[\[{]/.test(cleaned)) {
    errors.push("Report appears to start as raw JSON.");
  }

  if (/^[ \t]*#{1,6}\s+/m.test(cleaned)) {
    errors.push("Report contains markdown heading markers.");
  }

  if (/\*\*/.test(cleaned)) {
    errors.push("Report contains bold markdown markers.");
  }

  if (/```/.test(cleaned)) {
    errors.push("Report contains fenced code markers.");
  }

  if (sections.length !== REPORT_SECTION_COUNT) {
    errors.push(`Expected ${REPORT_SECTION_COUNT} numbered sections, found ${sections.length}.`);
  }

  const expectedNumbers = Array.from(
    { length: REPORT_SECTION_COUNT },
    (_, index) => index + 1
  );

  const actualNumbers = sections.map((section) => section.number);

  expectedNumbers.forEach((expected, index) => {
    if (actualNumbers[index] !== expected) {
      errors.push(`Expected section ${expected} at position ${index + 1}.`);
    }
  });

  if (options.minLength && cleaned.length < options.minLength) {
    errors.push(`Report is shorter than expected: ${cleaned.length} characters.`);
  }

  return {
    ok: errors.length === 0,
    errors,
    sections
  };
}

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
  const source = String(text || "");
  const matches = [...source.matchAll(/^(\d{1,2})\.\s+([^\r\n]+)[ \t]*$/gm)];

  return matches.map((match, index) => {
    const headingIndex = match.index || 0;
    const headingEnd = headingIndex + match[0].length;
    const bodyEnd = matches[index + 1]?.index ?? source.length;
    const body = source.slice(headingEnd, bodyEnd).trim();

    return {
      number: Number(match[1]),
      title: String(match[2] || "").trim(),
      heading: match[0].trim(),
      index: headingIndex,
      body,
      bodyLength: body.length,
      hasBlankLine: /^\r?\n[ \t]*\r?\n/.test(source.slice(headingEnd))
    };
  });
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

  const maxHeadingLength = options.maxHeadingLength || 0;
  const minSectionLength = options.minSectionLength || 0;

  sections.forEach((section) => {
    if (maxHeadingLength && section.heading.length > maxHeadingLength) {
      errors.push(`Section ${section.number} heading is too long: ${section.heading.length} characters.`);
    }

    if (minSectionLength && section.bodyLength < minSectionLength) {
      errors.push(`Section ${section.number} is too short: ${section.bodyLength} characters.`);
    }

    if (options.requireBlankLine && !section.hasBlankLine) {
      errors.push(`Section ${section.number} heading must be followed by a blank line.`);
    }
  });

  const requiredPatterns = Array.isArray(options.requiredPatterns)
    ? options.requiredPatterns
    : [];

  requiredPatterns.forEach((requirement, index) => {
    const pattern = requirement?.pattern;
    const label = requirement?.label || `required content ${index + 1}`;

    if (!(pattern instanceof RegExp)) {
      errors.push(`Invalid validation pattern for ${label}.`);
      return;
    }

    pattern.lastIndex = 0;
    if (!pattern.test(cleaned)) {
      errors.push(`Report is missing ${label}.`);
    }
    pattern.lastIndex = 0;
  });

  return {
    ok: errors.length === 0,
    errors,
    sections
  };
}

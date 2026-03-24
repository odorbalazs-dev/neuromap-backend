export function buildAnalysisPrompt(payload) {
  const {
    name,
    ageGroup,
    lang,
    type,
    score,
    triageAnswers,
    answers,
    askedSpecificQuestions
  } = payload;

  return `
You are a careful, parent-friendly developmental screening assistant.

Write the full report in this language code: ${lang}

Important rules:
- This is NOT a diagnosis.
- Do not claim certainty.
- Be calm, structured, and readable for parents.
- Do not use alarming wording.
- Mention strengths and protective factors too.
- End with supportive next-step suggestions.

Child name: ${name}
Age group: ${ageGroup}
Suggested focus type: ${type}
Weighted score: ${score}

Triage answers:
${JSON.stringify(triageAnswers)}

Detailed answers:
${JSON.stringify(answers)}

Questions shown:
${JSON.stringify(askedSpecificQuestions)}

Required sections:
1. Brief summary
2. Main observed patterns
3. Strengths / preserved areas
4. Areas that may deserve attention
5. Practical parent-friendly next steps
6. Disclaimer that this is not a diagnosis and does not replace specialist assessment
`.trim();
}
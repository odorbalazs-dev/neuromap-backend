import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

const ALLOWED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function getSafeLang(lang) {
  return ALLOWED_LANGS.includes(lang) ? lang : "en";
}

function buildLanguageInstruction(lang) {
  const map = {
    hu: "A teljes riportot magyar nyelven írd, természetes, helyes, igényes magyar mondatokkal.",
    en: "Write the entire report in natural, polished English.",
    de: "Schreibe den gesamten Bericht in natürlichem, korrektem Deutsch.",
    it: "Scrivi l'intero report in italiano naturale, corretto e professionale.",
    es: "Escribe todo el informe en español natural, correcto y profesional.",
    zh: "请用自然、准确、专业的中文撰写整份报告。",
    ja: "レポート全体を自然で正確な日本語で書いてください。",
    ar: "اكتب التقرير كاملًا باللغة العربية الطبيعية والواضحة والمهنية.",
    pl: "Napisz cały raport naturalnym, poprawnym i profesjonalnym językiem polskim.",
    pt: "Escreva todo o relatório em português natural, correto e profissional.",
    fr: "Rédige tout le rapport en français naturel, correct et professionnel."
  };

  return map[getSafeLang(lang)] || map.en;
}

function toFixedNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number(num.toFixed(digits));
}

function compactQuestionAnswers(questions = [], answers = []) {
  return questions.map((q, index) => ({
    id: q.id || `q_${index + 1}`,
    domain: q.domain || null,
    subdomain: q.subdomain || null,
    stemKey: q.stemKey || null,
    weight: typeof q.weight === "number" ? q.weight : null,
    reverse: typeof q.reverse === "boolean" ? q.reverse : null,
    text: q.text || "",
    answer: typeof answers[index] === "number" ? answers[index] : null
  }));
}

function summarizeSpecificProfile(profile = null) {
  if (!profile) return null;

  const subdomains = Object.entries(profile.subdomains || {}).map(([key, value]) => ({
    name: key,
    average: toFixedNumber(value?.average, 2),
    itemCount: Number(value?.itemCount || 0),
    totalWeight: toFixedNumber(value?.totalWeight, 2)
  }));

  subdomains.sort((a, b) => (b.average || 0) - (a.average || 0));

  return {
    kind: profile.kind || null,
    severity: profile.severity || null,
    normalizedAverage: toFixedNumber(profile.normalizedAverage, 2),
    strongestSubdomains: subdomains.slice(0, 5),
    allSubdomains: subdomains
  };
}

function summarizeSpecificScoring(scoring = null) {
  if (!scoring) return null;

  const subdomains = Object.entries(scoring.subdomains || {}).map(([key, value]) => ({
    name: key,
    average: toFixedNumber(value?.average, 2),
    itemCount: Number(value?.itemCount || 0),
    totalWeight: toFixedNumber(value?.totalWeight, 2)
  }));

  subdomains.sort((a, b) => (b.average || 0) - (a.average || 0));

  return {
    totalWeightedScore: toFixedNumber(scoring.totalWeightedScore, 2),
    totalWeight: toFixedNumber(scoring.totalWeight, 2),
    normalizedAverage: toFixedNumber(scoring.normalizedAverage, 2),
    topSubdomains: subdomains.slice(0, 5),
    allSubdomains: subdomains
  };
}

function buildPrompt(payload = {}, lang = "en") {
  const safeLang = getSafeLang(lang);

  const triage = compactQuestionAnswers(payload.triageQuestions, payload.triageAnswers);
  const specific = compactQuestionAnswers(payload.specificQuestions, payload.specificAnswers);
  const extra = compactQuestionAnswers(payload.extraQuestions, payload.extraAnswers);

  const detectedRisk = payload.detectedRisk || "unknown";
  const secondaryRisk = payload.secondaryRisk || "unknown";

  const specificScoringSummary = summarizeSpecificScoring(payload.specificScoring);
  const specificProfileSummary = summarizeSpecificProfile(payload.specificProfile);

  return `
You are a senior child development and child mental-health screening interpreter writing a paid parent-facing report.

LANGUAGE:
${buildLanguageInstruction(safeLang)}

NON-NEGOTIABLE SAFETY RULES:
- This is NOT a diagnosis.
- Do NOT say the child has ADHD, autism, anxiety, depression, learning disorder, or any condition.
- Use careful wording: "may indicate", "may suggest", "can be consistent with", "appears to show", "screening signal".
- Do NOT recommend medication.
- Do NOT use alarming or deterministic language.
- Do NOT mention AI, prompts, scoring internals, bank names, hidden logic, item IDs, or implementation details.
- Do NOT use markdown headings such as ###, ##, **heading**, or horizontal rules.
- Do NOT output raw JSON.
- Do NOT put section headings in Markdown.
- Use plain numbered section titles only.
- Adapt the interpretation to the developmental stage and likely age-related expectations.
- Distinguish between situational difficulties and persistent patterns.
- Consider masking, compensation, and context-dependent functioning.
- Carefully describe uncertainty when the profile is mixed.
- Avoid repetitive wording.
- Vary sentence structure naturally.
- Write in a psychologically supportive tone.
- Use nuanced language instead of rigid categories.
- If the profile is mild, avoid unnecessarily alarming phrasing.
- If the profile is more severe, remain calm, constructive, and practical.
- Consider emotional regulation, sensory processing, flexibility, executive functioning, and social reciprocity interactions when relevant.
- Highlight whether the observed pattern appears stable, fluctuating, environment-dependent, or stress-dependent.
- Emphasize functional impact more than labels.
- Interpret the child's likely experience, not only observable behaviors.
- Avoid generic filler advice.
- Recommendations must feel personalized to the described profile.

QUALITY REQUIREMENTS:
- The report must feel premium, coherent, personalized, and professionally written.
- Use fluent grammar in the selected language.
- Avoid awkward literal translations.
- Avoid repetitive generic phrases.
- Explain what the pattern may mean in everyday family life.
- Interpret the data instead of merely repeating scores.
- If signals are weak, say they are weak.
- If primary and secondary signals overlap, explain the overlap carefully.
- If the pattern is not conclusive, say so clearly.
- Make recommendations practical and immediately usable.
- Target length: 8500–10500 characters.
- Use paragraphs, with some short bullet lists only where useful.
- Keep tone warm, calm, respectful, and non-alarming.
- Include a clear next-30-days action plan.
- Include developmental and contextual interpretation.
- Avoid sounding like a template.

SCORING INTERPRETATION:
- Answers use a 0–3 intensity scale.
- Higher values usually mean a stronger screening signal.
- Reverse items are already corrected in the scoring.
- Triage scores are broad directional indicators.
- Specific scoring is more important for detailed interpretation.
- Severity labels:
  - low = low signal / weak indication
  - mild = mild signal
  - moderate = moderate signal
  - high = high signal
- Confidence should be described qualitatively:
  - coherent pattern: triage and specific profile align
  - mixed pattern: primary and secondary areas are close
  - weak pattern: overall averages are low
  - stronger pattern: several subdomains are consistently elevated
- If the profile is mild or low, explain that the result is an early signal rather than a strong concern.
- If the profile is mixed, avoid overinterpreting a single category.
- If secondaryRisk is close to the primary area, discuss it as an overlapping or contextual signal, not as a second diagnosis.

DEVELOPMENTAL INTERPRETATION GUIDE:
- Consider that younger children may naturally show more variability in attention, impulse control, emotional regulation, and transitions.
- Consider that older children may show difficulties more clearly in school demands, peer relationships, planning, persistence, and performance.
- Do not infer exact age unless it is present in the data.
- If age is missing, phrase age-related points generally, such as "depending on the child’s age and developmental stage".
- Consider whether difficulties may appear mainly under fatigue, stress, transitions, sensory load, time pressure, or unclear expectations.
- Consider possible compensation: a child may function well in structured settings but struggle when demands increase.
- Consider possible masking: some children may appear outwardly controlled while experiencing internal effort, tension, or overload.

INPUT DATA:
Primary detected focus: ${detectedRisk}
Secondary signal: ${secondaryRisk}
Questionnaire version: ${payload.questionnaireVersion || "unknown"}

TRIAGE SCORES:
${JSON.stringify(payload.triageScores || {}, null, 2)}

TRIAGE RANKING:
${JSON.stringify(payload.triageRanking || [], null, 2)}

FRONTEND RESULT SUMMARY:
${JSON.stringify(payload.resultSummary || null, null, 2)}

SPECIFIC SCORING SUMMARY:
${JSON.stringify(specificScoringSummary, null, 2)}

SPECIFIC PROFILE SUMMARY:
${JSON.stringify(specificProfileSummary, null, 2)}

TRIAGE QUESTION-ANSWER DATA:
${JSON.stringify(triage, null, 2)}

SPECIFIC QUESTION-ANSWER DATA:
${JSON.stringify(specific, null, 2)}

EXTRA QUESTION-ANSWER DATA:
${JSON.stringify(extra, null, 2)}

OUTPUT FORMAT:
Write exactly these 11 numbered sections. Translate the section titles naturally into the selected language, but keep the numbering.

1. Short opening summary
Explain what the report is and what it is not. Summarize the strongest pattern in 2–4 clear sentences.

2. Main observed patterns
Describe the main behavioral, emotional, regulatory, social, or learning patterns suggested by the answers.

3. Primary area of concern
Explain the primary screening area. Describe how it may appear at home, in learning situations, routines, play, and relationships.

4. Secondary or overlapping signals
Explain the secondary signal carefully. If it is weak, say it is weak. If it overlaps with the primary pattern, explain the overlap.

5. Possible impact on everyday life
Describe possible effects on home life, learning, peer relationships, routines, transitions, and emotional wellbeing.

6. Developmental and contextual interpretation
Explain whether the observed pattern may vary across environments. Discuss possible stress sensitivity, transitions, overload, fatigue, masking, or compensation if relevant. Clarify whether the presentation appears persistent or more situational.

7. Strengths and protective factors
Identify realistic strengths, stabilizing factors, or signs of resilience. Do not invent unrealistic strengths.

8. Practical recommendations for parents
Give concrete suggestions parents can use immediately: routines, communication, emotional regulation, structure, observation, and supportive strategies.

9. Suggested next 30 days
Give a realistic, parent-friendly action plan for the next few weeks. Focus on observation, communication, routines, emotional support, and structured tracking.

10. When professional support may be useful
Explain when to consider a pediatrician, psychologist, child psychiatrist, developmental specialist, school specialist, or other qualified professional.

11. Important limitation and disclaimer
Clearly state again that this is not a diagnosis and does not replace professional assessment. Explain that full assessment requires developmental history, observation, professional evaluation, and broader context.

FINAL STYLE RULES:
- Numbered headings only.
- No markdown symbols.
- No ###.
- No bold markdown.
- No diagnosis.
- No excessive bullet lists.
- No fake certainty.
- No medical treatment plan.
- No raw score dumping.
- No generic conclusion paragraph outside the numbered sections.
`;
}

export async function generateAnalysis(payload) {
  const safePayload = payload || {};
  const lang = getSafeLang(safePayload.lang || safePayload.language || "en");
  const prompt = buildPrompt(safePayload, lang);

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
    temperature: 0.32
  });

  const text =
    response.output_text ||
    (Array.isArray(response.output)
      ? response.output
          .flatMap((item) => item.content || [])
          .map((c) => c.text || "")
          .join("\n")
      : "");

  if (!text || !text.trim()) {
    throw new Error("Analysis generation returned empty content.");
  }

  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^---+$/gm, "")
    .trim();
}
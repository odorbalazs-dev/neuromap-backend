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
- Target length: 6500–8500 characters.
- Use paragraphs, with some short bullet lists only where useful.
- Keep tone warm, calm, respectful, and non-alarming.

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
Write exactly these 9 numbered sections. Translate the section titles naturally into the selected language, but keep the numbering.

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

6. Strengths and protective factors
Identify realistic strengths, stabilizing factors, or signs of resilience. Do not invent unrealistic strengths.

7. Practical recommendations for parents
Give concrete suggestions parents can use immediately: routines, communication, emotional regulation, structure, observation, and supportive strategies.

8. When professional support may be useful
Explain when to consider a pediatrician, psychologist, child psychiatrist, developmental specialist, school specialist, or other qualified professional.

9. Important limitation and disclaimer
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
`;
}

export async function generateAnalysis(payload) {
  const safePayload = payload || {};
  const lang = getSafeLang(safePayload.lang || safePayload.language || "en");
  const prompt = buildPrompt(safePayload, lang);

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
    temperature: 0.35
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
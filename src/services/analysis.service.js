import OpenAI from "openai";
import { env } from "../config/env.js";
import { analyzeAdaptiveState } from "./adaptive-engine.service.js";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

const ALLOWED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function getSafeLang(lang) {
  return ALLOWED_LANGS.includes(lang) ? lang : "en";
}

function buildLanguageInstruction(lang) {
  const map = {
    hu: "A teljes riportot magyar nyelven írd, természetes, helyes, igényes magyar mondatokkal. Kerüld a tükörfordításokat és a sablonos, gépies fordulatokat.",
    en: "Write the entire report in natural, polished English. Avoid generic, robotic, or template-like wording.",
    de: "Schreibe den gesamten Bericht in natürlichem, korrektem Deutsch. Vermeide wörtliche Übersetzungen und schablonenhafte Formulierungen.",
    it: "Scrivi l'intero report in italiano naturale, corretto e professionale. Evita frasi generiche o troppo schematiche.",
    es: "Escribe todo el informe en español natural, correcto y profesional. Evita frases genéricas o demasiado mecánicas.",
    zh: "请用自然、准确、专业的中文撰写整份报告，避免生硬翻译和模板化表达。",
    ja: "レポート全体を自然で正確な日本語で書いてください。機械的・定型的な表現は避けてください。",
    ar: "اكتب التقرير كاملًا باللغة العربية الطبيعية والواضحة والمهنية، وتجنب العبارات الجامدة أو المترجمة حرفيًا.",
    pl: "Napisz cały raport naturalnym, poprawnym i profesjonalnym językiem polskim. Unikaj szablonowych i sztucznych sformułowań.",
    pt: "Escreva todo o relatório em português natural, correto e profissional. Evite frases genéricas ou mecânicas.",
    fr: "Rédige tout le rapport en français naturel, correct et professionnel. Évite les formulations génériques ou trop mécaniques."
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

function summarizeSubdomains(source = {}) {
  const subdomains = Object.entries(source || {}).map(([key, value]) => ({
    name: key,
    average: toFixedNumber(value?.average, 2),
    itemCount: Number(value?.itemCount || 0),
    totalWeight: toFixedNumber(value?.totalWeight, 2)
  }));

  subdomains.sort((a, b) => (b.average || 0) - (a.average || 0));

  return subdomains;
}

function summarizeSpecificProfile(profile = null) {
  if (!profile) return null;

  const subdomains = summarizeSubdomains(profile.subdomains);

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

  const subdomains = summarizeSubdomains(scoring.subdomains);

  return {
    totalWeightedScore: toFixedNumber(scoring.totalWeightedScore, 2),
    totalWeight: toFixedNumber(scoring.totalWeight, 2),
    normalizedAverage: toFixedNumber(scoring.normalizedAverage, 2),
    topSubdomains: subdomains.slice(0, 5),
    allSubdomains: subdomains
  };
}

function buildAdaptiveSummary(payload = {}) {
  try {
    return analyzeAdaptiveState({
      triageScores: payload.triageScores || {},
      specificProfile: payload.specificProfile || null,
      specificScoring: payload.specificScoring || null
    });
  } catch (error) {
    console.warn("[analysis] adaptive summary unavailable:", error?.message || error);
    return null;
  }
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
  const adaptiveSummary = buildAdaptiveSummary(payload);

  return `
You are a senior child development and child mental-health screening interpreter writing a paid parent-facing report.

LANGUAGE:
${buildLanguageInstruction(safeLang)}

NON-NEGOTIABLE SAFETY RULES:
- This is NOT a diagnosis.
- Do NOT say the child has ADHD, autism, anxiety, depression, learning disorder, or any condition.
- Do NOT recommend medication.
- Do NOT use alarming, deterministic, or fear-based wording.
- Do NOT mention AI, prompts, scoring internals, bank names, hidden logic, item IDs, or implementation details.
- Do NOT output raw JSON.
- Do NOT use markdown headings such as ###, ##, **heading**, or horizontal rules.
- Do NOT use bold markdown.
- Use careful wording: "may indicate", "may suggest", "can be consistent with", "appears to show", "screening signal", "worth observing".
- Use plain numbered section titles only.
- Make it clear that the report supports parental reflection and next steps, not clinical labeling.

PREMIUM REPORT QUALITY RULES:
- The report must feel human, calm, professional, personalized, and useful.
- Interpret patterns, not labels.
- Explain what the child’s experience may feel like, not only what adults may observe.
- Avoid repeating the same safety disclaimer in every section.
- Avoid generic filler advice.
- Avoid sounding like a template.
- Do not simply list symptoms.
- Connect the answers to everyday family life.
- Give practical, realistic recommendations that a parent can use immediately.
- Use nuanced language instead of rigid categories.
- If the profile is mild, keep the tone reassuring and observation-focused.
- If the profile is moderate or high, stay calm and practical.
- If the profile is mixed, describe uncertainty clearly and respectfully.
- If signals are weak, explicitly say that the pattern is not strong.
- If signals are coherent, explain that the answers form a relatively consistent screening pattern.
- Target length: 8500–10500 characters.

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
- Do not dump raw scores into the report.
- Use numbers only if they help explain uncertainty or signal strength.

ADAPTIVE ENGINE INTERPRETATION:
- The adaptive summary is an internal reasoning aid, not something to quote directly.
- Use it to decide whether the profile appears coherent, mixed, uncertain, overlapping, or context-dependent.
- If confidence is low, describe the result as cautious and preliminary.
- If overlapScore is high, explain that the answers suggest overlap between areas rather than a single clear direction.
- If interpretation is "coherent_pattern", explain that the answers form a relatively consistent screening pattern.
- If interpretation is "mixed_pattern", explain the mixed pattern calmly and avoid overconfidence.
- If interpretation is "uncertain_pattern", emphasize observation and professional context.
- recommendedFocusAreas may guide which everyday examples and recommendations should be emphasized.

DEVELOPMENTAL AND CONTEXTUAL REASONING:
- Adapt the interpretation to the developmental stage when age-related expectations are relevant.
- Do not infer exact age unless it is present in the data.
- If age is missing, use general phrasing such as "depending on the child’s age and developmental stage".
- Younger children may naturally show variability in attention, impulse control, emotional regulation, flexibility, and transitions.
- Older children may show difficulties more clearly in school demands, peer relationships, planning, persistence, and performance.
- Distinguish between situational difficulty and persistent pattern.
- Consider fatigue, stress, transitions, sensory load, time pressure, unclear expectations, social demands, and changes in routine.
- Consider compensation: a child may function well in structured settings but struggle when demands increase.
- Consider masking: a child may look outwardly controlled while experiencing internal effort, tension, or overload.
- Emphasize functional impact more than labels.

INPUT DATA:
Primary detected focus: ${detectedRisk}
Secondary signal: ${secondaryRisk}
Questionnaire version: ${payload.questionnaireVersion || "unknown"}

ADAPTIVE SUMMARY:
${JSON.stringify(adaptiveSummary, null, 2)}

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
Explain what the report is and what it is not. Summarize the strongest pattern in 2–4 clear sentences. Mention whether the pattern looks coherent, mixed, weak, or still preliminary.

2. Main observed patterns
Describe the main behavioral, emotional, regulatory, social, or learning patterns suggested by the answers. Use everyday language and concrete examples.

3. Primary area of concern
Explain the primary screening area. Describe how it may appear at home, in learning situations, routines, play, and relationships. Do not diagnose.

4. Secondary or overlapping signals
Explain the secondary signal carefully. If it is weak, say it is weak. If it overlaps with the primary pattern, explain the overlap in plain language.

5. Possible impact on everyday life
Describe possible effects on home life, learning, peer relationships, routines, transitions, independence, and emotional wellbeing.

6. Developmental and contextual interpretation
Explain whether the observed pattern may vary across environments. Discuss stress sensitivity, transitions, overload, fatigue, masking, compensation, or context-dependence if relevant.

7. Strengths and protective factors
Identify realistic strengths, stabilizing factors, coping signs, supportive conditions, or signs of resilience. Do not invent unrealistic strengths.

8. Practical recommendations for parents
Give concrete suggestions parents can use immediately. Include communication, routines, structure, emotional regulation, sensory or transition support, observation, and supportive responses.

9. Suggested next 30 days
Give a realistic, parent-friendly action plan for the next few weeks. Make it specific enough to be useful. Include what to observe, what to try, and when to review.

10. When professional support may be useful
Explain when to consider a pediatrician, psychologist, child psychiatrist, developmental specialist, school specialist, speech therapist, occupational therapist, or other qualified professional, depending on the pattern.

11. Important limitation and disclaimer
Clearly state again that this is not a diagnosis and does not replace professional assessment. Explain that full assessment requires developmental history, observation, professional evaluation, and broader context.

FINAL STYLE RULES:
- Numbered headings only.
- No markdown symbols.
- No ###.
- No bold markdown.
- No raw JSON.
- No fake certainty.
- No diagnosis.
- No medical treatment plan.
- No excessive bullet lists.
- No raw score dumping.
- No generic conclusion paragraph outside the numbered sections.
`;
}

function cleanGeneratedText(text = "") {
  return String(text || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateAnalysis(payload) {
  const safePayload = payload || {};
  const lang = getSafeLang(safePayload.lang || safePayload.language || "en");
  const prompt = buildPrompt(safePayload, lang);

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
    temperature: 0.28
  });

  const text =
    response.output_text ||
    (Array.isArray(response.output)
      ? response.output
          .flatMap((item) => item.content || [])
          .map((c) => c.text || "")
          .join("\n")
      : "");

  const cleaned = cleanGeneratedText(text);

  if (!cleaned) {
    throw new Error("Analysis generation returned empty content.");
  }

  return cleaned;
}
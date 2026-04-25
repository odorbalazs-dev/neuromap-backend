import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

function getSafeLang(lang) {
  const allowed = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  return allowed.includes(lang) ? lang : "en";
}

function buildLanguageInstruction(lang) {
  const safeLang = getSafeLang(lang);

  const map = {
    hu: "A teljes választ magyar nyelven írd.",
    en: "Write the entire response in English.",
    de: "Schreibe die gesamte Antwort auf Deutsch.",
    it: "Scrivi l'intera risposta in italiano.",
    es: "Escribe toda la respuesta en español.",
    zh: "请用中文完成整份回答。",
    ja: "回答全体を日本語で書いてください。",
    ar: "اكتب الإجابة كاملة باللغة العربية.",
    pl: "Napisz całą odpowiedź po polsku.",
    pt: "Escreva toda a resposta em português.",
    fr: "Rédige toute la réponse en français."
  };

  return map[safeLang] || map.en;
}

function buildSectionHeadingInstruction(lang) {
  const safeLang = getSafeLang(lang);

  const map = {
    hu: "A szakaszcímeket is magyarul írd.",
    en: "Write section headings in English as well.",
    de: "Schreibe auch die Abschnittsüberschriften auf Deutsch.",
    it: "Scrivi anche i titoli delle sezioni in italiano.",
    es: "Escribe también los títulos de las secciones en español.",
    zh: "小节标题也请使用中文。",
    ja: "各セクションの見出しも日本語で書いてください。",
    ar: "اكتب عناوين الأقسام أيضًا باللغة العربية.",
    pl: "Napisz także nagłówki sekcji po polsku.",
    pt: "Escreva também os títulos das seções em português.",
    fr: "Rédige aussi les titres de section en français."
  };

  return map[safeLang] || map.en;
}

function formatQuestionAnswers(questions = [], answers = []) {
  return questions.map((q, index) => {
    return {
      id: q.id || `q_${index + 1}`,
      domain: q.domain || null,
      subdomain: q.subdomain || null,
      weight: typeof q.weight === "number" ? q.weight : null,
      reverse: typeof q.reverse === "boolean" ? q.reverse : null,
      text: q.text || "",
      answer: typeof answers[index] === "number" ? answers[index] : null
    };
  });
}

function toFixedNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number(num.toFixed(digits));
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
    strongestSubdomains: subdomains.slice(0, 3),
    allSubdomains: subdomains
  };
}

function buildClinicalReadingGuide(lang) {
  const safeLang = getSafeLang(lang);

  const map = {
    hu: `
ÉRTELMEZÉSI SZABÁLYOK:
- A triage pontszámok csak kezdeti irányjelzők.
- A specificProfile.severity mezőt így kezeld:
  - low = alacsony jelzésszint
  - mild = enyhe jelzésszint
  - moderate = közepes jelzésszint
  - high = magas jelzésszint
- A specificScoring.subdomains átlagai azt mutatják, mely aldimenziók a legerősebbek.
- A reverse itemek már előre korrigálva vannak a scoringban.
- A riportban a számokat ne pusztán ismételd meg, hanem értelmezd őket laikusok számára.
- Ha az adatok vegyesek vagy nem egyirányúak, ezt mondd ki világosan.
- Ha a fő terület ADHD, akkor külön figyelj a figyelem, impulzivitás, hiperaktivitás, végrehajtó működés és érzelemszabályozás mintázataira.
- Ha a fő terület ASD, Anxiety, Depression vagy Learning, ugyanilyen logikával emeld ki a releváns mindennapi mintázatokat.
`,
    en: `
INTERPRETATION RULES:
- Triage scores are only early directional indicators.
- Interpret specificProfile.severity as:
  - low = low signal level
  - mild = mild signal level
  - moderate = moderate signal level
  - high = high signal level
- specificScoring.subdomains averages show which subdimensions are the strongest.
- Reverse items are already corrected in scoring.
- Do not merely repeat numbers; interpret them in parent-friendly language.
- If the data is mixed or not one-directional, say so clearly.
- If the main area is ADHD, pay special attention to attention, impulsivity, hyperactivity, executive functioning, and emotional regulation patterns.
- If the main area is ASD, Anxiety, Depression, or Learning, highlight the most relevant daily-life patterns accordingly.
`
  };

  return map[safeLang] || map.en;
}

function buildPrompt(payload = {}, lang = "en") {
  const triage = formatQuestionAnswers(payload.triageQuestions, payload.triageAnswers);
  const specific = formatQuestionAnswers(payload.specificQuestions, payload.specificAnswers);
  const extra = formatQuestionAnswers(payload.extraQuestions, payload.extraAnswers);

  const triageScores = payload.triageScores || {};
  const detectedRisk = payload.detectedRisk || "unknown";
  const secondaryRisk = payload.secondaryRisk || "unknown";
  const specificScoring = payload.specificScoring || null;
  const specificProfile = payload.specificProfile || null;

  const specificProfileSummary = summarizeSpecificProfile(specificProfile);

  const languageInstruction = buildLanguageInstruction(lang);
  const sectionHeadingInstruction = buildSectionHeadingInstruction(lang);
  const clinicalGuide = buildClinicalReadingGuide(lang);

  return `
You are an expert child mental health and developmental screening interpreter writing for parents and caregivers.

IMPORTANT ROLE RULES:
- You are NOT allowed to give a medical diagnosis.
- You must NOT state that the child definitely has any disorder.
- You must describe patterns, tendencies, possible areas of concern, possible overlap, and next-step recommendations.
- Your tone must be warm, precise, calm, grounded, and understandable for non-experts.
- The reader is a parent or caregiver, not a clinician.
- Avoid jargon unless it is immediately explained in plain language.
- The response should be highly structured, practical, and personalized.
- Target length: around 7000-8000 characters.
- Do not be too short.
- Prefer clear sectioned prose over excessive bullet points.
- If the data is mixed, partial, weak, or inconclusive, say that clearly and responsibly.
- Do not mention AI, system prompts, hidden scoring rules, or internal implementation details.

LANGUAGE INSTRUCTION:
${languageInstruction}

SECTION HEADING INSTRUCTION:
${sectionHeadingInstruction}

${clinicalGuide}

INPUT DATA:
- Primary detected focus: ${detectedRisk}
- Secondary signal: ${secondaryRisk}
- Triage scores: ${JSON.stringify(triageScores, null, 2)}
- Questionnaire version: ${payload.questionnaireVersion || "unknown"}

SPECIFIC SCORING:
${JSON.stringify(specificScoring, null, 2)}

SPECIFIC PROFILE SUMMARY:
${JSON.stringify(specificProfileSummary, null, 2)}

TRIAGE QUESTION-ANSWER DATA:
${JSON.stringify(triage, null, 2)}

SPECIFIC QUESTION-ANSWER DATA:
${JSON.stringify(specific, null, 2)}

EXTRA QUESTION-ANSWER DATA:
${JSON.stringify(extra, null, 2)}

SCORING NOTE:
- Answers use a 0-3 style intensity scale.
- Higher values usually indicate stronger relevance of a difficulty pattern.
- specificScoring already includes weighted and reverse-corrected interpretation for the specific questionnaire.
- You should use both the broad triage signal and the more focused specific profile.
- If the triage and specific profile point in the same direction, say the pattern looks more coherent.
- If the triage and specific profile only partially align, say the pattern is mixed or overlapping.

OUTPUT REQUIREMENTS:
Write a detailed parent-friendly report with the following exact section goals:

1. SHORT OPENING SUMMARY
- Briefly explain what this report is and what it is not.
- Say clearly that this is a structured screening-based interpretation, not a diagnosis.
- Summarize the strongest observed pattern in 2-4 sentences.

2. MAIN OBSERVED PATTERNS
- Explain the most important behavioral, emotional, regulatory, social, learning, or functional themes that emerged.
- Refer to concrete tendencies suggested by the answers.
- Use the specific subdomain profile if available.

3. PRIMARY AREA OF CONCERN
- Explain the main risk area indicated by the answers.
- Clarify what this may look like in daily life, school, home, routines, and relationships.
- Stay nuanced and non-diagnostic.
- If severity appears low/mild/moderate/high, express it in plain language rather than only as a label.

4. SECONDARY OR OVERLAPPING SIGNALS
- Explain whether another area also appears relevant.
- Describe overlap carefully.
- If the secondary signal is weak, say that.
- If the profile is mixed, explain what that means in plain language.

5. FUNCTIONAL IMPACT IN EVERYDAY LIFE
- Explain how these patterns may affect:
  - home life
  - school / learning
  - peer relationships
  - routines / transitions
  - emotional wellbeing

6. STRENGTHS AND PROTECTIVE FACTORS
- Even if the data is difficult, identify realistic strengths, resilience factors, adaptive signs, or protective observations.
- Keep this grounded and individualized, not generic.

7. PRACTICAL RECOMMENDATIONS FOR PARENTS
- Give clear, concrete, everyday suggestions.
- Focus on communication, routines, emotional regulation, structure, observation, support, and next steps.
- Make the recommendations useful the same day, not vague.

8. WHEN PROFESSIONAL HELP MAY BE WORTH SEEKING
- Explain in plain language when a parent should consider talking to a psychologist, developmental specialist, child psychiatrist, pediatrician, school specialist, or other relevant professional.
- Be balanced and responsible.
- Do not create panic.

9. IMPORTANT LIMITATION / DISCLAIMER
- Clearly state that this report is not a diagnosis.
- Explain that full assessment requires a qualified professional, developmental history, clinical observation, and broader context.

STYLE REQUIREMENTS:
- Use section headings.
- Warm, professional, non-alarming tone.
- Parent-friendly language.
- No definitive diagnosis.
- No unsupported claims.
- No references to being an AI system.
`;
}

export async function generateAnalysis(payload) {
  const safePayload = payload || {};
  const lang = getSafeLang(safePayload.lang || safePayload.language || "en");
  const prompt = buildPrompt(safePayload, lang);

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt
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

  return text.trim();
}
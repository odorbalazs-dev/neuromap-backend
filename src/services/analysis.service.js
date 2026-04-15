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

function formatQuestionAnswers(questions = [], answers = []) {
  return questions.map((q, index) => {
    return {
      id: q.id || `q_${index + 1}`,
      text: q.text || "",
      answer: typeof answers[index] === "number" ? answers[index] : null
    };
  });
}

function buildPrompt(payload = {}, lang = "en") {
  const triage = formatQuestionAnswers(payload.triageQuestions, payload.triageAnswers);
  const specific = formatQuestionAnswers(payload.specificQuestions, payload.specificAnswers);
  const extra = formatQuestionAnswers(payload.extraQuestions, payload.extraAnswers);

  const triageScores = payload.triageScores || {};
  const detectedRisk = payload.detectedRisk || "unknown";
  const secondaryRisk = payload.secondaryRisk || "unknown";

  const languageInstruction = buildLanguageInstruction(lang);

  return `
You are an expert clinical-style child development screening interpreter.

IMPORTANT ROLE RULES:
- You are NOT allowed to give a medical diagnosis.
- You must NOT state that the child definitely has any disorder.
- You must describe patterns, tendencies, possible areas of concern, and next-step recommendations.
- Your tone must be warm, precise, calm, and understandable for non-experts.
- The reader is a parent or caregiver, not a clinician.
- Avoid jargon unless immediately explained in plain language.
- The response should be highly structured and practical.
- Target length: around 7000-8000 characters.
- Do not be too short.
- Do not use bullet overload; use clear sections and readable paragraphs.
- Make sure the text is useful, concrete, and personalized to the questionnaire data.
- If the data is mixed or inconclusive, say so clearly.

LANGUAGE INSTRUCTION:
${languageInstruction}

INPUT DATA:
- Primary detected focus: ${detectedRisk}
- Secondary signal: ${secondaryRisk}
- Triage scores: ${JSON.stringify(triageScores, null, 2)}
- Questionnaire version: ${payload.questionnaireVersion || "unknown"}

TRIAGE QUESTION-ANSWER DATA:
${JSON.stringify(triage, null, 2)}

SPECIFIC QUESTION-ANSWER DATA:
${JSON.stringify(specific, null, 2)}

EXTRA QUESTION-ANSWER DATA:
${JSON.stringify(extra, null, 2)}

SCORING NOTE:
Answers use a 0-3 style intensity scale, where higher values usually indicate stronger relevance of a difficulty pattern.

OUTPUT REQUIREMENTS:
Write a detailed parent-friendly report with the following exact section goals:

1. SHORT OPENING SUMMARY
- Briefly explain what this report is and what it is not.
- Say that this is a structured screening-based interpretation, not a diagnosis.
- Summarize the strongest observed pattern in 2-4 sentences.

2. MAIN OBSERVED PATTERNS
- Explain the most important behavioral or emotional themes that emerged.
- Refer to concrete tendencies suggested by the answers.
- If relevant, mention attention, social communication, emotional regulation, flexibility, learning, anxiety, mood, or functioning.

3. PRIMARY AREA OF CONCERN
- Explain the main risk area indicated by the answers.
- Clarify what this may look like in daily life, school, home, and relationships.
- Stay nuanced and non-diagnostic.

4. SECONDARY OR OVERLAPPING SIGNALS
- Explain whether another area also appears relevant.
- Describe overlap carefully.
- If secondary signal is weak, say that.

5. FUNCTIONAL IMPACT IN EVERYDAY LIFE
- Explain how these patterns may affect:
  - home life
  - school / learning
  - peer relationships
  - routines / transitions
  - emotional wellbeing

6. STRENGTHS AND PROTECTIVE FACTORS
- Even if the data is difficult, identify potential strengths, resilience factors, or helpful observations.
- Keep this realistic, not generic.

7. PRACTICAL RECOMMENDATIONS FOR PARENTS
- Give clear, concrete, everyday suggestions.
- Focus on communication, routines, regulation, support, observation, and next steps.
- Make the recommendations usable.

8. WHEN PROFESSIONAL HELP MAY BE WORTH SEEKING
- Explain in plain language when a parent should consider talking to a psychologist, developmental specialist, child psychiatrist, pediatrician, school specialist, or other relevant professional.
- Do not create panic.
- Be balanced and responsible.

9. IMPORTANT LIMITATION / DISCLAIMER
- Clearly state that this report is not a diagnosis.
- Explain that full assessment requires a qualified professional and broader context.

STYLE REQUIREMENTS:
- Structured with section headings.
- Warm, professional, non-alarming tone.
- Parent-friendly language.
- No definitive diagnosis.
- No unsupported claims.
- No mention of "AI model" or technical system prompts.
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
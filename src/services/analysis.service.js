import OpenAI from "openai";
import { env } from "../config/env.js";
import { analyzeAdaptiveState } from "./adaptive-engine.service.js";
import {
  cleanGeneratedReportText,
  validateReportStructure
} from "./report-contract.service.js";

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

function getDomainInterpretationGuide(primary, secondary) {
  const guides = {
    ADHD: {
      focus:
        "attention regulation, impulse control, activity level, task completion, executive functioning, emotional reactivity, effort regulation",
      avoid:
        "do not treat every attention difficulty as ADHD; consider sleep, stress, task clarity, anxiety, sensory load, motivation, and developmental expectations",
      parentHelp:
        "emphasize predictable routines, reduced friction, one-step instructions, visual structure, transition warnings, movement breaks, emotional co-regulation, and strengths-based scaffolding"
    },
    ASD: {
      focus:
        "social communication, reciprocity, flexibility, routines, sensory processing, literal interpretation, transitions, predictability, peer demands",
      avoid:
        "do not describe autistic traits as deficits only; avoid implying poor motivation or intentional non-cooperation; consider masking, overload, sensory needs, and social fatigue",
      parentHelp:
        "emphasize predictability, clear language, visual supports, sensory-aware routines, transition preparation, respectful social support, and safe recovery time after demanding situations"
    },
    ANXIETY: {
      focus:
        "worry, uncertainty, avoidance, reassurance seeking, physical arousal, perfectionistic pressure, separation or social-evaluative stress, sleep and concentration effects",
      avoid:
        "do not frame anxiety as weakness or stubbornness; distinguish avoidance caused by fear from inattention, opposition, or low motivation",
      parentHelp:
        "emphasize calm validation, gradual exposure, predictable reassurance limits, naming body signals, small brave steps, routines for uncertainty, and avoiding excessive accommodation"
    },
    DEPRESSION: {
      focus:
        "low mood, irritability, reduced interest, low energy, withdrawal, negative self-view, hopelessness signals, concentration changes, sleep or appetite changes",
      avoid:
        "do not overstate risk; do not minimize persistent low mood as laziness; mention urgent support only if safety concerns are present or worsening",
      parentHelp:
        "emphasize connection before correction, gentle activation, predictable supportive routines, reduced shame, monitoring mood and energy, and seeking professional help if low mood persists or functioning declines"
    },
    LEARNING: {
      focus:
        "reading, writing, math, working memory, processing speed, instruction understanding, organization, task persistence, performance inconsistency",
      avoid:
        "do not confuse learning difficulty with lack of effort; consider attention, anxiety, language, sleep, and instruction clarity as possible contributors",
      parentHelp:
        "emphasize breaking tasks down, checking understanding, multisensory practice, short work blocks, error-friendly feedback, school collaboration, and documenting patterns across subjects"
    }
  };

  const primaryGuide = guides[primary] || {
    focus: "the strongest questionnaire pattern and its functional impact",
    avoid: "avoid diagnostic certainty and avoid reducing the child to a label",
    parentHelp: "emphasize practical, observable next steps for family life"
  };

  const secondaryGuide = secondary && guides[secondary] ? guides[secondary] : null;

  return {
    primary,
    primaryGuide,
    secondary: secondaryGuide ? secondary : null,
    secondaryGuide
  };
}

function buildSignalQualityGuide({ specificProfileSummary, specificScoringSummary, adaptiveSummary }) {
  const average = Number(
    specificProfileSummary?.normalizedAverage ??
      specificScoringSummary?.normalizedAverage ??
      0
  );

  const severity = specificProfileSummary?.severity || "unknown";
  const topSubdomains = specificProfileSummary?.strongestSubdomains || [];
  const confidence = adaptiveSummary?.confidence || null;
  const interpretation = adaptiveSummary?.interpretation || null;
  const overlapScore = Number(adaptiveSummary?.overlapScore || 0);

  return {
    severity,
    average,
    confidence,
    interpretation,
    overlapScore,
    topSubdomains: topSubdomains.map((item) => item.name),
    writingInstruction:
      average < 0.8
        ? "Treat the pattern as weak. Keep the report reassuring, observational, and focused on monitoring rather than concern."
        : overlapScore >= 0.25
        ? "Treat the pattern as overlapping. Explain the possible overlap calmly and avoid presenting one single explanation as certain."
        : confidence === "low" || interpretation === "uncertain_pattern"
        ? "Treat the pattern as preliminary. Use careful wording and emphasize context, observation, and professional interpretation if concerns persist."
        : "Treat the pattern as meaningful but still non-diagnostic. Explain the functional pattern with practical parent guidance."
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
  const adaptiveSummary = buildAdaptiveSummary(payload);
  const domainGuide = getDomainInterpretationGuide(detectedRisk, secondaryRisk);
  const signalQualityGuide = buildSignalQualityGuide({
    specificProfileSummary,
    specificScoringSummary,
    adaptiveSummary
  });

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
- Keep sections readable: short paragraphs, concrete examples, and no wall-of-text blocks.
- Target length: 8600-10400 characters.
- Each section should add a distinct kind of value. Do not repeat the same idea under different headings.
- Use the child-centered perspective at least a few times: what the child may be trying to manage internally, not only what adults notice externally.
- Use parent-friendly language without becoming casual, cute, or simplistic.
- Make recommendations concrete enough that a parent could try them this week.
- Prefer "what to observe", "what to try", and "what would suggest escalation" over generic reassurance.

REPORT V2 CONTENT REQUIREMENTS:
- The report must read like a premium paid interpretation, not a generic screening summary.
- Make the primary area specific to the actual top subdomains and strongest patterns.
- Explain why the secondary signal may appear together with the primary one, if present.
- Include at least one paragraph on uncertainty, context, or overlap when the adaptive summary suggests it.
- Include realistic protective factors based on low/medium items, coherent functioning, parent observation, or supportive conditions. If not enough data is available, say "the questionnaire gives limited information about strengths" and then identify likely support conditions instead.
- Include a practical 30-day plan with observation, home support, school/daycare communication if relevant, and review.
- Include a calm professional-support section that explains thresholds for seeking help without creating alarm.

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

DOMAIN-SPECIFIC INTERPRETATION GUIDE:
${JSON.stringify(domainGuide, null, 2)}

SIGNAL QUALITY GUIDE:
${JSON.stringify(signalQualityGuide, null, 2)}

CLINICAL QUALITY GATE BEFORE WRITING:
- First identify the strongest 2-4 subdomains and use them as the backbone of the report.
- Then decide whether the profile is weak, mild, moderate, high, mixed, coherent, or uncertain.
- Then write in a way that matches that signal quality.
- Do not inflate a low or mild profile.
- Do not soften a coherent moderate or high profile so much that the parent loses useful direction.
- Do not over-focus on the diagnostic category name. Focus on functional patterns and next steps.
- Do not overuse the words "may", "can", or "appears" in every sentence; keep the tone careful but readable.

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
Put every numbered heading on its own line, followed by a blank line and then the body text. Do not combine a heading and its paragraph on the same line.
Each section should normally contain 1-3 short paragraphs. Avoid bullet-heavy output because the PDF renderer is optimized for compact paragraphs and numbered section cards.

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
- Put each numbered heading on a separate line.
- Keep paragraphs short enough for comfortable PDF reading.
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

  const cleaned = cleanGeneratedReportText(text);

  if (!cleaned) {
    throw new Error("Analysis generation returned empty content.");
  }

  const reportValidation = validateReportStructure(cleaned, {
    minLength: 5000
  });

  if (!reportValidation.ok) {
    console.warn("[analysis] report structure warning:", reportValidation.errors.join("; "));
  }

  return cleaned;
}

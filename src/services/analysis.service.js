import OpenAI from "openai";
import { env } from "../config/env.js";
import { analyzeAdaptiveState } from "./adaptive-engine.service.js";
import {
  cleanGeneratedReportText,
  validateReportStructure
} from "./report-contract.service.js";
import { buildReportV2PromptContext } from "./report-v2.service.js";

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
    ar: "اكتب التقرير بالكامل باللغة العربية الطبيعية والواضحة والمهنية، وتجنب العبارات الجامدة أو الترجمة الحرفية.",
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
      triageRanking: payload.triageRanking || [],
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

function getParentActionGuide(primary, secondary) {
  const guides = {
    ADHD: {
      homeSupport: [
        "short one-step instructions",
        "visible routines and checklists",
        "movement breaks before demanding tasks",
        "clear start and finish points",
        "emotion coaching before correction"
      ],
      schoolOrDaycareSupport: [
        "seat and task placement with fewer distractions",
        "instructions repeated in brief chunks",
        "checking understanding before independent work",
        "planned transition warnings",
        "feedback focused on process and completion"
      ],
      observeNext30Days: [
        "which routines break down most often",
        "whether difficulty is stronger with multi-step tasks",
        "whether movement or visual structure improves follow-through",
        "how quickly frustration rises after correction"
      ],
      professionalSupportSignals: [
        "persistent impairment across home and school",
        "frequent conflict or loss of confidence",
        "major difficulty completing age-expected routines",
        "concern from educators across several weeks"
      ],
      avoid: [
        "interpreting every lapse as laziness",
        "using only verbal reminders",
        "adding long explanations during dysregulation"
      ]
    },
    ASD: {
      homeSupport: [
        "predictable routines with advance notice for changes",
        "clear literal language",
        "visual supports for transitions",
        "sensory recovery time after demanding situations",
        "respectful support for social demands without forcing performance"
      ],
      schoolOrDaycareSupport: [
        "transition previews",
        "sensory-aware seating and break options",
        "explicit social expectations",
        "safe recovery space after overload",
        "communication about masking or delayed reactions at home"
      ],
      observeNext30Days: [
        "whether difficulty increases after social or sensory load",
        "which changes in routine cause the strongest reaction",
        "whether the child seems controlled outside but exhausted later",
        "which supports reduce rigidity or shutdown"
      ],
      professionalSupportSignals: [
        "persistent social-communication difficulty",
        "intense distress around routine change",
        "sensory overload affecting daily functioning",
        "concern about language, reciprocity, play, or peer relationships"
      ],
      avoid: [
        "treating overload as intentional defiance",
        "forcing eye contact or social performance",
        "removing predictability without preparation"
      ]
    },
    ANXIETY: {
      homeSupport: [
        "calm validation before problem-solving",
        "small brave steps instead of sudden pressure",
        "predictable reassurance limits",
        "naming body signals of stress",
        "gentle routines around uncertainty"
      ],
      schoolOrDaycareSupport: [
        "advance notice for presentations or changes",
        "safe check-in points with adults",
        "gradual participation goals",
        "support for separation or evaluation pressure",
        "monitoring avoidance without shaming"
      ],
      observeNext30Days: [
        "what the child avoids and what happens before avoidance",
        "whether reassurance calms briefly but returns quickly",
        "which body signs appear under stress",
        "which small exposures are tolerated"
      ],
      professionalSupportSignals: [
        "avoidance limiting school, sleep, play, or family routines",
        "frequent distress that does not settle with support",
        "panic-like body symptoms or intense fear",
        "worries becoming persistent and hard to interrupt"
      ],
      avoid: [
        "removing every anxiety trigger permanently",
        "dismissing fear as overreaction",
        "reassuring repeatedly without helping tolerance grow"
      ]
    },
    DEPRESSION: {
      homeSupport: [
        "connection before correction",
        "small predictable activation steps",
        "low-pressure shared time",
        "reduced shame around low energy",
        "consistent sleep and daily rhythm support"
      ],
      schoolOrDaycareSupport: [
        "watching withdrawal or loss of participation",
        "reduced overload during low-energy periods",
        "supportive adult check-ins",
        "tracking changes in concentration and motivation",
        "gentle re-entry into valued activities"
      ],
      observeNext30Days: [
        "whether low mood or irritability persists",
        "whether interest in usual activities returns",
        "changes in sleep, appetite, energy, or self-talk",
        "whether connection improves functioning"
      ],
      professionalSupportSignals: [
        "persistent low mood, irritability, withdrawal, or loss of interest",
        "declining functioning at home or school",
        "strong negative self-statements or hopelessness",
        "any self-harm behavior, talk of wanting to disappear, or safety concern"
      ],
      avoid: [
        "calling low motivation laziness",
        "using pressure as the main strategy",
        "ignoring safety-related statements"
      ]
    },
    LEARNING: {
      homeSupport: [
        "breaking tasks into visible steps",
        "checking understanding before practice",
        "short work blocks with review",
        "multisensory practice",
        "error-friendly feedback"
      ],
      schoolOrDaycareSupport: [
        "documenting subject-specific patterns",
        "checking instruction comprehension",
        "support for working memory and processing speed",
        "alternative ways to show understanding",
        "collaboration with teachers or learning specialists"
      ],
      observeNext30Days: [
        "which subjects or task types are hardest",
        "whether errors repeat in a stable pattern",
        "whether oral understanding differs from written output",
        "whether performance improves with shorter steps"
      ],
      professionalSupportSignals: [
        "persistent academic difficulty despite practice",
        "large gap between effort and output",
        "specific reading, writing, math, or comprehension concerns",
        "school concerns lasting several weeks"
      ],
      avoid: [
        "assuming the child is not trying",
        "repeating the same explanation without changing support",
        "measuring ability only by speed"
      ]
    }
  };

  const primaryGuide = guides[primary] || guides.ADHD;
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
  const parentActionGuide = getParentActionGuide(detectedRisk, secondaryRisk);
  const signalQualityGuide = buildSignalQualityGuide({
    specificProfileSummary,
    specificScoringSummary,
    adaptiveSummary
  });
  const reportV2Context = buildReportV2PromptContext(payload, safeLang);

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
- Every practical recommendation must connect to a likely everyday situation: morning routine, homework, transitions, peer contact, bedtime, school/daycare demands, emotional escalation, sensory load, uncertainty, or task completion.
- When giving advice, explain the parent move and the reason behind it. Avoid isolated tips that feel like a checklist copied from a brochure.
- Include school/daycare communication only when it is relevant, but when relevant make it specific: what to tell adults, what to observe, and what accommodation or support to try.
- Include strengths and protective factors as real stabilizing conditions, not empty praise.

REPORT V2 CONTENT REQUIREMENTS:
- The report must read like a premium paid interpretation, not a generic screening summary.
- The report must include age-group interpretation and age-aware recommendations.
- If the child's age is available, use the age band below to adapt examples, expectations, and next steps.
- If the child's age is not available, explicitly say that age was not provided and keep developmental guidance adaptable.
- Do not infer exact age from questionnaire answers.
- Make the primary area specific to the actual top subdomains and strongest patterns.
- Explain why the secondary signal may appear together with the primary one, if present.
- Include at least one paragraph on uncertainty, context, or overlap when the adaptive summary suggests it.
- Include realistic protective factors based on low/medium items, coherent functioning, parent observation, or supportive conditions. If not enough data is available, say "the questionnaire gives limited information about strengths" and then identify likely support conditions instead.
- Include a practical 30-day plan with observation, home support, school/daycare communication if relevant, and review.
- Include a calm professional-support section that explains thresholds for seeking help without creating alarm.
- Include at least one "this week" action and one "watch over the next month" observation.
- Use the structured v2 actionPlan, observationFocus, and escalationNote as guidance for sections 8-10. Do not copy them mechanically; weave them into natural parent-facing prose.
- If professional support is discussed, keep it non-alarming and tied to persistence, impairment, safety, or cross-context concern.
- For any self-harm, disappearance, or safety-related signal, state that immediate qualified support is important. Do not provide crisis counseling; keep the wording brief and responsible.

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
- patternType, decisionQuality, confidenceLabel, and evidence.scoreSource are Engine Intelligence v2 fields. Use them to calibrate tone, but never mention these technical names in the parent report.
- If patternType is "clear_pattern", write with more practical direction while staying non-diagnostic.
- If patternType is "overlap_pattern" or "needs_observation", explain uncertainty and cross-context observation more clearly.
- If decisionQuality is "low", keep recommendations conservative and observation-focused.
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

PARENT ACTION GUIDE:
Use this as a practical menu. Do not copy it mechanically. Translate it naturally and adapt it to the actual profile strength, top subdomains, and context.
${JSON.stringify(parentActionGuide, null, 2)}

SIGNAL QUALITY GUIDE:
${JSON.stringify(signalQualityGuide, null, 2)}

STRUCTURED REPORT V2 AGE CONTEXT:
${JSON.stringify(reportV2Context, null, 2)}

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

6. Developmental, age-group, and contextual interpretation
Explain how the observed pattern should be understood for the child's age band when age is available. If age is missing, state this briefly and explain that expectations should be adapted to the child's developmental stage. Discuss stress sensitivity, transitions, overload, fatigue, masking, compensation, or context-dependence if relevant.

7. Strengths and protective factors
Identify realistic strengths, stabilizing factors, coping signs, supportive conditions, or signs of resilience. Explain how these strengths can be used in support planning. Do not invent unrealistic strengths.

8. Practical recommendations for parents
Give concrete suggestions parents can use immediately. Include home routines, communication style, emotional regulation, sensory or transition support, observation, supportive responses, and age-aware adaptations. Include at least one recommendation that can be tried this week and explain why it fits the pattern.

9. Suggested next 30 days
Give a realistic, parent-friendly action plan for the next few weeks. Structure it in prose around the first week, the following two weeks, and the review point. Include what to observe, what to try, what to share with school/daycare if relevant, when to review, and how the plan should be adjusted for the age band or developmental stage.

10. When professional support may be useful
Explain when to consider a pediatrician, psychologist, child psychiatrist, developmental specialist, school specialist, speech therapist, occupational therapist, or other qualified professional, depending on the pattern. Tie the recommendation to persistence, impairment, cross-context concerns, declining confidence, safety concerns, or educator observations.

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

  async function runGeneration(inputPrompt, attempt) {
    const response = await openai.responses.create({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      input: inputPrompt,
      temperature: attempt === 1 ? 0.28 : 0.22
    });

    const text =
      response.output_text ||
      (Array.isArray(response.output)
        ? response.output
            .flatMap((item) => item.content || [])
            .map((c) => c.text || "")
            .join("\n")
        : "");

    return cleanGeneratedReportText(text);
  }

  let cleaned = await runGeneration(prompt, 1);

  if (!cleaned) {
    throw new Error("Analysis generation returned empty content.");
  }

  let reportValidation = validateReportStructure(cleaned, {
    minLength: 5000
  });

  if (!reportValidation.ok) {
    console.warn("[analysis] report structure warning, retrying once:", reportValidation.errors.join("; "));

    const retryPrompt = `${prompt}

The previous draft did not satisfy the required report contract.
Rewrite the full report now. Keep the same language, preserve all 11 numbered sections, avoid markdown, and make the content complete enough for PDF delivery.
Missing or weak contract points:
${reportValidation.errors.map((error) => `- ${error}`).join("\n")}
`;

    cleaned = await runGeneration(retryPrompt, 2);
    reportValidation = validateReportStructure(cleaned, {
      minLength: 5000
    });
  }

  if (!reportValidation.ok) {
    console.warn("[analysis] report structure warning after retry:", reportValidation.errors.join("; "));
  }

  return cleaned;
}

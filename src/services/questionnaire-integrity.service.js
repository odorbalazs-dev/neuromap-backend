import { TRIAGE_BANK, SPECIFIC_BANKS } from "../data/banks/index.js";
import { EXTRA_BANKS } from "../data/banks/webflow-bridge.js";

const DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
const TRIAGE_COUNT_PER_DOMAIN = 5;
const SPECIFIC_QUESTION_COUNT = 30;
const EXTRA_QUESTION_COUNT = 5;

export class QuestionnaireIntegrityError extends Error {
  constructor(errors) {
    super("Questionnaire integrity validation failed.");
    this.name = "QuestionnaireIntegrityError";
    this.errors = Array.isArray(errors) ? errors : [String(errors || "Invalid questionnaire.")];
  }
}

function buildQuestionIndex(bank, label) {
  const index = new Map();

  for (const question of bank || []) {
    const id = String(question?.id || "").trim();
    if (!id) throw new Error(`${label} contains a question without an id.`);
    if (index.has(id)) throw new Error(`${label} contains duplicate question id ${id}.`);
    index.set(id, question);
  }

  return index;
}

const TRIAGE_INDEX = buildQuestionIndex(TRIAGE_BANK, "TRIAGE_BANK");
const SPECIFIC_INDEXES = Object.fromEntries(
  DOMAINS.map((domain) => [
    domain,
    buildQuestionIndex(SPECIFIC_BANKS[domain], `SPECIFIC_BANKS.${domain}`)
  ])
);
const EXTRA_INDEXES = Object.fromEntries(
  DOMAINS.map((domain) => [
    domain,
    buildQuestionIndex(EXTRA_BANKS[domain], `EXTRA_BANKS.${domain}`)
  ])
);

function localizedText(question, lang) {
  const text = question?.text;
  if (typeof text === "string") return text.trim();
  if (!text || typeof text !== "object") return "";
  return String(text[lang] || text.en || text.hu || "").trim();
}

function canonicalQuestion(question, lang) {
  return {
    id: question.id,
    domain: question.domain || null,
    subdomain: question.subdomain || "general",
    stemKey: question.stemKey || null,
    weight: Number.isFinite(Number(question.weight)) ? Number(question.weight) : 1,
    reverse: question.reverse === true,
    text: localizedText(question, lang)
  };
}

function requireUniqueIds(questions, label, errors) {
  const ids = questions.map((question) => String(question?.id || "").trim());
  if (new Set(ids).size !== ids.length) errors.push(`${label} contains duplicate question ids.`);
  return ids;
}

function resolveQuestions({ submitted, index, label, expectedCount, lang, errors }) {
  if (!Array.isArray(submitted) || submitted.length !== expectedCount) {
    errors.push(`${label} must contain exactly ${expectedCount} questions.`);
    return [];
  }

  const ids = requireUniqueIds(submitted, label, errors);
  const resolved = [];

  ids.forEach((id, position) => {
    const canonical = index.get(id);
    if (!canonical) {
      errors.push(`${label}[${position}] contains unknown question id ${id || "<empty>"}.`);
      return;
    }
    resolved.push(canonicalQuestion(canonical, lang));
  });

  return resolved;
}

function normalizeAnswer(value, reverse = false) {
  const numeric = Number(value);
  return reverse ? 3 - numeric : numeric;
}

function validateAnswers(answers, expectedCount, label, errors) {
  if (!Array.isArray(answers) || answers.length !== expectedCount) {
    errors.push(`${label} must contain exactly ${expectedCount} answers.`);
    return;
  }

  answers.forEach((answer, index) => {
    const numeric = Number(answer);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 3) {
      errors.push(`${label}[${index}] must be an integer between 0 and 3.`);
    }
  });
}

function evaluateTriage(questions, answers) {
  const rawScores = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]));
  const domainStats = Object.fromEntries(
    DOMAINS.map((domain) => [domain, {
      itemCount: 0,
      average: 0,
      strongestSubdomain: 0,
      consistency: 0,
      weightedSignal: 0,
      subdomains: {}
    }])
  );

  questions.forEach((question, index) => {
    const stat = domainStats[question.domain];
    if (!stat) return;
    const value = Number(answers[index]);
    const subdomain = question.subdomain || "general";

    rawScores[question.domain] += value;
    stat.itemCount += 1;
    if (!stat.subdomains[subdomain]) stat.subdomains[subdomain] = [];
    stat.subdomains[subdomain].push(value);
  });

  DOMAINS.forEach((domain) => {
    const stat = domainStats[domain];
    stat.average = rawScores[domain] / Math.max(1, stat.itemCount);
    const averages = Object.values(stat.subdomains).map((values) => (
      values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
    ));
    stat.strongestSubdomain = averages.length ? Math.max(...averages) : 0;
    stat.consistency = averages.length > 1
      ? 1 - (Math.max(...averages) - Math.min(...averages)) / 3
      : 1;
    stat.weightedSignal =
      stat.average * 0.7 + stat.strongestSubdomain * 0.2 + stat.consistency * 0.1;
  });

  return { rawScores, domainStats };
}

function detectRisks(triageResult) {
  const { rawScores, domainStats } = triageResult;
  const rankedDomains = DOMAINS.map((domain) => {
    const stat = domainStats[domain];
    const raw = rawScores[domain];
    let weightedSignal = stat.weightedSignal;

    if (domain === "LEARNING" && rawScores.ADHD >= raw - 1) weightedSignal -= 0.08;
    if (domain === "DEPRESSION" && rawScores.ANXIETY >= raw - 1) weightedSignal -= 0.05;
    if (domain === "ANXIETY" && rawScores.DEPRESSION >= raw - 1) weightedSignal -= 0.03;

    return {
      domain,
      raw,
      average: stat.average,
      strongestSubdomain: stat.strongestSubdomain,
      consistency: stat.consistency,
      weightedSignal
    };
  }).sort((a, b) => b.weightedSignal - a.weightedSignal || b.raw - a.raw);

  return {
    primaryRisk: rankedDomains[0]?.domain || "ADHD",
    primaryScore: rankedDomains[0]?.weightedSignal || 0,
    secondaryRisk: rankedDomains[1]?.domain || null,
    secondaryScore: rankedDomains[1]?.weightedSignal || 0,
    rankedDomains
  };
}

function evaluateSpecific(questions, answers) {
  const result = {
    totalWeightedScore: 0,
    totalWeight: 0,
    normalizedAverage: 0,
    subdomains: {}
  };

  questions.forEach((question, index) => {
    const normalized = normalizeAnswer(answers[index], question.reverse);
    const weight = question.weight || 1;
    const subdomain = question.subdomain || "general";
    if (!result.subdomains[subdomain]) {
      result.subdomains[subdomain] = {
        rawSum: 0,
        weightedSum: 0,
        totalWeight: 0,
        itemCount: 0,
        average: 0
      };
    }

    const stat = result.subdomains[subdomain];
    stat.rawSum += normalized;
    stat.weightedSum += normalized * weight;
    stat.totalWeight += weight;
    stat.itemCount += 1;
    result.totalWeightedScore += normalized * weight;
    result.totalWeight += weight;
  });

  Object.values(result.subdomains).forEach((stat) => {
    stat.average = stat.totalWeight > 0 ? stat.weightedSum / stat.totalWeight : 0;
  });
  result.normalizedAverage = result.totalWeight > 0
    ? result.totalWeightedScore / result.totalWeight
    : 0;
  return result;
}

function evaluateExtraDecision({ questions, answers, primaryRisk, secondaryRisk }) {
  const domainScores = {};

  questions.forEach((question, index) => {
    const domain = question.domain || "UNKNOWN";
    const normalized = normalizeAnswer(answers[index], question.reverse);
    const weight = question.weight || 1;

    if (!domainScores[domain]) {
      domainScores[domain] = {
        weightedSum: 0,
        totalWeight: 0,
        itemCount: 0,
        average: 0
      };
    }

    domainScores[domain].weightedSum += normalized * weight;
    domainScores[domain].totalWeight += weight;
    domainScores[domain].itemCount += 1;
  });

  Object.values(domainScores).forEach((score) => {
    score.average = score.totalWeight > 0 ? score.weightedSum / score.totalWeight : 0;
  });

  const primaryAverage = domainScores[primaryRisk]?.average || 0;
  const secondaryAverage = secondaryRisk ? domainScores[secondaryRisk]?.average || 0 : 0;
  const scoreGap = primaryAverage - secondaryAverage;
  const secondaryStrengthened = Boolean(
    secondaryRisk &&
    domainScores[secondaryRisk]?.itemCount > 0 &&
    secondaryAverage > primaryAverage + 0.15
  );

  return {
    applied: questions.length > 0,
    primaryRisk,
    secondaryRisk,
    domainScores,
    primaryAverage,
    secondaryAverage,
    scoreGap,
    secondaryStrengthened,
    confidenceModifier: secondaryStrengthened
      ? "lower_primary_confidence"
      : Math.abs(scoreGap) <= 0.2
        ? "close_extra_signal"
        : "supports_primary"
  };
}

function getSeverity(score) {
  if (score >= 2.2) return "high";
  if (score >= 1.4) return "moderate";
  if (score >= 0.8) return "mild";
  return "low";
}

function getSignal(score) {
  const key = getSeverity(score);
  const labels = {
    low: { hu: "alacsony jelz\u00e9sszint", en: "low signal level" },
    mild: { hu: "enyhe jelz\u00e9sszint", en: "mild signal level" },
    moderate: { hu: "k\u00f6zepes jelz\u00e9sszint", en: "moderate signal level" },
    high: { hu: "magas jelz\u00e9sszint", en: "high signal level" }
  };
  return { key, ...labels[key] };
}

function buildResultSummary(kind, scoring, triageScores, secondaryRisk, extraDecision = null) {
  const summaries = {
    ADHD: {
      hu: "A leger\u0151sebb mint\u00e1zat a figyelem, impulzivit\u00e1s, aktivit\u00e1sszab\u00e1lyoz\u00e1s vagy v\u00e9grehajt\u00f3 m\u0171k\u00f6d\u00e9s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
      en: "The strongest pattern relates to attention, impulsivity, activity regulation, or executive functioning."
    },
    ASD: {
      hu: "A leger\u0151sebb mint\u00e1zat a t\u00e1rsas kommunik\u00e1ci\u00f3, rugalmass\u00e1g, rutinok vagy szenzoros feldolgoz\u00e1s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
      en: "The strongest pattern relates to social communication, flexibility, routines, or sensory processing."
    },
    ANXIETY: {
      hu: "A leger\u0151sebb mint\u00e1zat az aggodalom, fesz\u00fclts\u00e9g, bizonytalans\u00e1g vagy elker\u00fcl\u00e9s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
      en: "The strongest pattern relates to worry, tension, uncertainty, or avoidance."
    },
    DEPRESSION: {
      hu: "A leger\u0151sebb mint\u00e1zat a hangulat, motiv\u00e1ci\u00f3, \u00e9rdekl\u0151d\u00e9s vagy \u00f6n\u00e9rt\u00e9kel\u00e9s ter\u00fclet\u00e9hez kapcsol\u00f3dik.",
      en: "The strongest pattern relates to mood, motivation, interest, or self-view."
    },
    LEARNING: {
      hu: "A leger\u0151sebb mint\u00e1zat tanul\u00e1si, olvas\u00e1si, \u00edr\u00e1si, matematikai vagy feladatmeg\u00e9rt\u00e9si neh\u00e9zs\u00e9gekhez kapcsol\u00f3dik.",
      en: "The strongest pattern relates to learning, reading, writing, math, or task-understanding difficulties."
    }
  };
  const topSubdomains = Object.entries(scoring.subdomains)
    .map(([key, value]) => ({ key, average: value.average, itemCount: value.itemCount }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);

  return {
    kind,
    normalizedAverage: scoring.normalizedAverage,
    signal: getSignal(scoring.normalizedAverage),
    topSubdomains,
    secondaryRisk,
    extraDecision,
    decisionConfidence: extraDecision?.secondaryStrengthened
      ? "low"
      : extraDecision?.applied
        ? "moderate"
        : "standard",
    triageScores,
    summaryText: summaries[kind]
  };
}

function validateDomainCoverage(questions, errors) {
  const counts = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]));
  questions.forEach((question) => {
    if (counts[question.domain] !== undefined) counts[question.domain] += 1;
  });
  DOMAINS.forEach((domain) => {
    if (counts[domain] !== TRIAGE_COUNT_PER_DOMAIN) {
      errors.push(`triageQuestions must contain exactly ${TRIAGE_COUNT_PER_DOMAIN} ${domain} questions.`);
    }
  });
}

export function canonicalizeQuestionnairePayload(payload, lang = "en") {
  const errors = [];
  const triageQuestions = resolveQuestions({
    submitted: payload.triageQuestions,
    index: TRIAGE_INDEX,
    label: "triageQuestions",
    expectedCount: DOMAINS.length * TRIAGE_COUNT_PER_DOMAIN,
    lang,
    errors
  });
  validateDomainCoverage(triageQuestions, errors);
  validateAnswers(
    payload.triageAnswers,
    DOMAINS.length * TRIAGE_COUNT_PER_DOMAIN,
    "triageAnswers",
    errors
  );

  if (errors.length) throw new QuestionnaireIntegrityError(errors);

  const triageResult = evaluateTriage(triageQuestions, payload.triageAnswers);
  const risks = detectRisks(triageResult);
  const specificQuestions = resolveQuestions({
    submitted: payload.specificQuestions,
    index: SPECIFIC_INDEXES[risks.primaryRisk],
    label: "specificQuestions",
    expectedCount: SPECIFIC_QUESTION_COUNT,
    lang,
    errors
  });
  validateAnswers(payload.specificAnswers, SPECIFIC_QUESTION_COUNT, "specificAnswers", errors);

  const needsExtra = Boolean(
    risks.primaryScore && risks.secondaryScore &&
    Math.abs(risks.primaryScore - risks.secondaryScore) <= 0.04
  );
  const submittedExtra = Array.isArray(payload.extraQuestions) ? payload.extraQuestions : [];
  let extraQuestions = [];

  if (needsExtra) {
    const combinedExtraIndex = new Map([
      ...EXTRA_INDEXES[risks.primaryRisk],
      ...EXTRA_INDEXES[risks.secondaryRisk]
    ]);
    extraQuestions = resolveQuestions({
      submitted: submittedExtra,
      index: combinedExtraIndex,
      label: "extraQuestions",
      expectedCount: EXTRA_QUESTION_COUNT,
      lang,
      errors
    });

    const primaryExtraCount = extraQuestions.filter(
      (question) => question.domain === risks.primaryRisk
    ).length;
    const secondaryExtraCount = extraQuestions.filter(
      (question) => question.domain === risks.secondaryRisk
    ).length;
    if (primaryExtraCount !== 3 || secondaryExtraCount !== 2) {
      errors.push(
        `extraQuestions must contain 3 ${risks.primaryRisk} and 2 ${risks.secondaryRisk} questions.`
      );
    }
    validateAnswers(payload.extraAnswers, EXTRA_QUESTION_COUNT, "extraAnswers", errors);
  } else if (submittedExtra.length > 0) {
    errors.push("extraQuestions are not allowed when the triage result is unambiguous.");
  } else if (Array.isArray(payload.extraAnswers) && payload.extraAnswers.length > 0) {
    errors.push("extraAnswers are not allowed when the triage result is unambiguous.");
  }

  if (errors.length) throw new QuestionnaireIntegrityError(errors);

  const specificScoring = evaluateSpecific(specificQuestions, payload.specificAnswers);
  const extraDecision = needsExtra
    ? evaluateExtraDecision({
        questions: extraQuestions,
        answers: payload.extraAnswers,
        primaryRisk: risks.primaryRisk,
        secondaryRisk: risks.secondaryRisk
      })
    : {
        applied: false,
        primaryRisk: risks.primaryRisk,
        secondaryRisk: risks.secondaryRisk,
        domainScores: {},
        primaryAverage: 0,
        secondaryAverage: 0,
        scoreGap: null,
        secondaryStrengthened: false,
        confidenceModifier: "not_needed"
      };
  const severity = getSeverity(specificScoring.normalizedAverage);
  const specificProfile = {
    kind: risks.primaryRisk,
    severity,
    normalizedAverage: specificScoring.normalizedAverage,
    subdomains: specificScoring.subdomains
  };

  return {
    ...payload,
    triageQuestions,
    triageScores: triageResult.rawScores,
    triageRanking: risks.rankedDomains,
    detectedRisk: risks.primaryRisk,
    secondaryRisk: risks.secondaryRisk,
    specificQuestions,
    specificScoring,
    specificProfile,
    resultSummary: buildResultSummary(
      risks.primaryRisk,
      specificScoring,
      triageResult.rawScores,
      risks.secondaryRisk,
      extraDecision
    ),
    extraQuestions,
    extraAnswers: needsExtra ? payload.extraAnswers : [],
    extraDecision,
    scoringAuthority: "server-canonical-v2-extra-aware"
  };
}

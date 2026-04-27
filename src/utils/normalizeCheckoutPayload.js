function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function cleanBoolean(value) {
  return value === true;
}

function normalizeQuestion(q = {}) {
  return {
    id: cleanText(q.id),
    domain: q.domain || null,
    subdomain: q.subdomain || null,
    stemKey: q.stemKey || null,
    weight: typeof q.weight === "number" ? q.weight : null,
    reverse: typeof q.reverse === "boolean" ? q.reverse : null,
    text: cleanText(q.text)
  };
}

function normalizeAnswers(answers = []) {
  if (!Array.isArray(answers)) return [];

  return answers.map((value) => {
    const num = cleanNumber(value, 0);
    if (num < 0) return 0;
    if (num > 3) return 3;
    return num;
  });
}

function normalizeTriageScores(scores = {}) {
  const domains = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

  return domains.reduce((acc, domain) => {
    acc[domain] = cleanNumber(scores[domain], 0);
    return acc;
  }, {});
}

function normalizeTriageRanking(ranking = []) {
  if (!Array.isArray(ranking)) return [];

  return ranking.map((item) => ({
    domain: item.domain || null,
    raw: cleanNumber(item.raw, 0),
    average: cleanNumber(item.average, 0),
    strongestSubdomain: cleanNumber(item.strongestSubdomain, 0),
    consistency: cleanNumber(item.consistency, 0),
    weightedSignal: cleanNumber(item.weightedSignal, 0)
  }));
}

function normalizeSpecificScoring(scoring = null) {
  if (!scoring || typeof scoring !== "object") return null;

  const subdomains = {};

  Object.entries(scoring.subdomains || {}).forEach(([key, value]) => {
    subdomains[key] = {
      rawSum: cleanNumber(value.rawSum, 0),
      weightedSum: cleanNumber(value.weightedSum, 0),
      totalWeight: cleanNumber(value.totalWeight, 0),
      itemCount: cleanNumber(value.itemCount, 0),
      average: cleanNumber(value.average, 0)
    };
  });

  return {
    totalWeightedScore: cleanNumber(scoring.totalWeightedScore, 0),
    totalWeight: cleanNumber(scoring.totalWeight, 0),
    normalizedAverage: cleanNumber(scoring.normalizedAverage, 0),
    subdomains
  };
}

function normalizeSpecificProfile(profile = null) {
  if (!profile || typeof profile !== "object") return null;

  return {
    kind: profile.kind || null,
    severity: profile.severity || null,
    normalizedAverage: cleanNumber(profile.normalizedAverage, 0),
    subdomains: profile.subdomains || {}
  };
}

function normalizeResultSummary(summary = null) {
  if (!summary || typeof summary !== "object") return null;

  return {
    kind: summary.kind || null,
    normalizedAverage: cleanNumber(summary.normalizedAverage, 0),
    signal: summary.signal || null,
    topSubdomains: Array.isArray(summary.topSubdomains)
      ? summary.topSubdomains.map((item) => ({
          key: item.key || null,
          average: cleanNumber(item.average, 0),
          itemCount: cleanNumber(item.itemCount, 0)
        }))
      : [],
    secondaryRisk: summary.secondaryRisk || null,
    triageScores: normalizeTriageScores(summary.triageScores || {}),
    summaryText: summary.summaryText || null
  };
}

export function normalizeCheckoutPayload(body = {}) {
  const payload = body.payload || {};

  return {
    email: cleanText(body.email).toLowerCase(),
    name: cleanText(body.name),
    lang: cleanText(body.lang || "en"),

    payload: {
      triageQuestions: Array.isArray(payload.triageQuestions)
        ? payload.triageQuestions.map(normalizeQuestion)
        : [],
      triageAnswers: normalizeAnswers(payload.triageAnswers),
      triageScores: normalizeTriageScores(payload.triageScores),
      triageRanking: normalizeTriageRanking(payload.triageRanking),

      detectedRisk: payload.detectedRisk || null,
      secondaryRisk: payload.secondaryRisk || null,

      specificQuestions: Array.isArray(payload.specificQuestions)
        ? payload.specificQuestions.map(normalizeQuestion)
        : [],
      specificAnswers: normalizeAnswers(payload.specificAnswers),
      specificScoring: normalizeSpecificScoring(payload.specificScoring),
      specificProfile: normalizeSpecificProfile(payload.specificProfile),
      resultSummary: normalizeResultSummary(payload.resultSummary),

      extraQuestions: Array.isArray(payload.extraQuestions)
        ? payload.extraQuestions.map(normalizeQuestion)
        : [],
      extraAnswers: normalizeAnswers(payload.extraAnswers),

      questionnaireVersion: cleanText(payload.questionnaireVersion || "unknown")
    }
  };
}
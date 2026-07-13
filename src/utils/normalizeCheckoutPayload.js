import { normalizePackageCode } from "../config/products.js";

function cleanText(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function cleanBoolean(value) {
  return value === true;
}

function cleanAge(value) {
  if (value === null || value === undefined || value === "") return null;

  const num = Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(num) || num < 1 || num > 24) return null;

  return Math.round(num * 10) / 10;
}

function normalizeQuestion(q = {}) {
  return {
    id: cleanText(q.id, 120),
    domain: cleanText(q.domain, 60) || null,
    subdomain: cleanText(q.subdomain, 80) || null,
    stemKey: cleanText(q.stemKey, 120) || null,
    weight: typeof q.weight === "number" ? q.weight : null,
    reverse: typeof q.reverse === "boolean" ? q.reverse : null,
    text: cleanText(q.text, 1000)
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

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid"
];

function normalizeAttributionTouch(touch = {}) {
  if (!touch || typeof touch !== "object") return {};

  const normalized = {};

  ATTRIBUTION_KEYS.forEach((key) => {
    const maxLength = key.startsWith("utm_") ? 180 : 300;
    const value = cleanText(touch[key], maxLength);
    if (value) normalized[key] = value;
  });

  const capturedAt = cleanText(touch.captured_at, 40);
  const landingPath = cleanText(touch.landing_path, 500);
  const landingUrl = cleanText(touch.landing_url, 700);
  const referrerOrigin = cleanText(touch.referrer_origin, 300);
  const lang = cleanText(touch.lang, 10).toLowerCase();

  if (capturedAt) normalized.captured_at = capturedAt;
  if (landingPath) normalized.landing_path = landingPath;
  if (landingUrl) normalized.landing_url = landingUrl;
  if (referrerOrigin) normalized.referrer_origin = referrerOrigin;
  if (lang) normalized.lang = lang;

  return normalized;
}

function normalizeAcquisition(acquisition = null) {
  if (!acquisition || typeof acquisition !== "object") return null;

  const firstTouch = normalizeAttributionTouch(acquisition.first_touch);
  const lastTouch = normalizeAttributionTouch(acquisition.last_touch);

  if (!Object.keys(firstTouch).length && !Object.keys(lastTouch).length) {
    return null;
  }

  return {
    schema_version: "campaign-attribution-v1",
    first_touch: firstTouch,
    last_touch: lastTouch,
    updated_at: cleanText(acquisition.updated_at, 40) || null
  };
}

export function normalizeCheckoutPayload(body = {}) {
  const payload = body.payload || {};
  const childAge = cleanAge(
    body.childAge ?? body.ageYears ?? payload.childAge ?? payload.ageYears
  );

  return {
    email: cleanText(body.email, 254).toLowerCase(),
    name: cleanText(body.name, 120),
    lang: cleanText(body.lang || "en", 10),
    packageCode: normalizePackageCode(body.packageCode) || null,

    payload: {
      childAge,
      ageYears: childAge,
      acquisition: normalizeAcquisition(payload.acquisition),
      triageQuestions: Array.isArray(payload.triageQuestions)
        ? payload.triageQuestions.slice(0, 40).map(normalizeQuestion)
        : [],
      triageAnswers: normalizeAnswers(payload.triageAnswers),
      triageScores: normalizeTriageScores(payload.triageScores),
      triageRanking: normalizeTriageRanking(payload.triageRanking),

      detectedRisk: payload.detectedRisk || null,
      secondaryRisk: payload.secondaryRisk || null,

      specificQuestions: Array.isArray(payload.specificQuestions)
        ? payload.specificQuestions.slice(0, 60).map(normalizeQuestion)
        : [],
      specificAnswers: normalizeAnswers(payload.specificAnswers),
      specificScoring: normalizeSpecificScoring(payload.specificScoring),
      specificProfile: normalizeSpecificProfile(payload.specificProfile),
      resultSummary: normalizeResultSummary(payload.resultSummary),

      extraQuestions: Array.isArray(payload.extraQuestions)
        ? payload.extraQuestions.slice(0, 10).map(normalizeQuestion)
        : [],
      extraAnswers: normalizeAnswers(payload.extraAnswers),

      questionnaireVersion: cleanText(payload.questionnaireVersion || "unknown", 80)
    }
  };
}

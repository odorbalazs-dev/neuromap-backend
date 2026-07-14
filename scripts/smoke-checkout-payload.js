import { TRIAGE_BANK, SPECIFIC_BANKS } from "../src/data/banks/index.js";
import { EXTRA_BANKS } from "../src/data/banks/webflow-bridge.js";
import { pickBalancedSpecificQuestions } from "../src/services/adaptive-engine.service.js";
import {
  canonicalizeQuestionnairePayload,
  QuestionnaireIntegrityError
} from "../src/services/questionnaire-integrity.service.js";
import { normalizeCheckoutPayload } from "../src/utils/normalizeCheckoutPayload.js";
import { validateCheckoutPayload } from "../src/utils/validateCheckoutPayload.js";

const DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function selectTriageQuestions() {
  return DOMAINS.flatMap((domain) => {
    return TRIAGE_BANK.filter((question) => question.domain === domain).slice(0, 5);
  });
}

function toPayloadQuestion(question, lang = "hu") {
  return {
    id: question.id,
    text: question.text?.[lang] || question.text?.en || question.text?.hu || question.prompt || question.id,
    domain: question.domain || null,
    subdomain: question.subdomain || null,
    stemKey: question.stemKey || null,
    weight: typeof question.weight === "number" ? question.weight : 1,
    reverse: typeof question.reverse === "boolean" ? question.reverse : false
  };
}

function buildScoring(questions, answers) {
  const scoring = {
    totalWeightedScore: 0,
    totalWeight: 0,
    normalizedAverage: 0,
    subdomains: {}
  };

  questions.forEach((question, index) => {
    const rawAnswer = Number(answers[index] || 0);
    const normalized = question.reverse ? 3 - rawAnswer : rawAnswer;
    const weight = Number(question.weight || 1);
    const subdomain = question.subdomain || "general";

    if (!scoring.subdomains[subdomain]) {
      scoring.subdomains[subdomain] = {
        rawSum: 0,
        weightedSum: 0,
        totalWeight: 0,
        itemCount: 0,
        average: 0
      };
    }

    scoring.subdomains[subdomain].rawSum += normalized;
    scoring.subdomains[subdomain].weightedSum += normalized * weight;
    scoring.subdomains[subdomain].totalWeight += weight;
    scoring.subdomains[subdomain].itemCount += 1;

    scoring.totalWeightedScore += normalized * weight;
    scoring.totalWeight += weight;
  });

  Object.values(scoring.subdomains).forEach((subdomain) => {
    subdomain.average = subdomain.totalWeight > 0
      ? subdomain.weightedSum / subdomain.totalWeight
      : 0;
  });

  scoring.normalizedAverage = scoring.totalWeight > 0
    ? scoring.totalWeightedScore / scoring.totalWeight
    : 0;

  return scoring;
}

function getSeverity(score) {
  if (score >= 2.2) return "high";
  if (score >= 1.4) return "moderate";
  if (score >= 0.8) return "mild";
  return "low";
}

function buildSpecificProfile(kind, scoring) {
  return {
    kind,
    severity: getSeverity(scoring.normalizedAverage),
    normalizedAverage: scoring.normalizedAverage,
    subdomains: scoring.subdomains
  };
}

function buildBasePayload({ includeExtra = false, packageCode = "standard_v1" } = {}) {
  const triageQuestions = selectTriageQuestions();
  const triageAnswers = triageQuestions.map((question) => (
    includeExtra || question.domain === "ADHD" ? 3 : 1
  ));
  const triageScores = {
    ADHD: 0,
    ASD: 0,
    ANXIETY: 0,
    DEPRESSION: 0,
    LEARNING: 0
  };
  const detectedRisk = "LEARNING";
  const secondaryRisk = "DEPRESSION";

  const specificQuestions = pickBalancedSpecificQuestions(SPECIFIC_BANKS.ADHD, {
    count: 30,
    seed: "smoke:ADHD",
    focusSubdomains: [],
    maxPerStem: 1,
    targetReverseRatio: 0.2
  });
  const specificAnswers = specificQuestions.map(() => 2);
  const specificScoring = buildScoring(specificQuestions, specificAnswers);
  const specificProfile = buildSpecificProfile("LEARNING", specificScoring);

  const extraQuestions = includeExtra
    ? [...EXTRA_BANKS.ADHD.slice(0, 3), ...EXTRA_BANKS.ASD.slice(0, 2)]
    : [];
  const extraAnswers = extraQuestions.map(() => 1);

  return {
    name: "Smoke Tester",
    email: "smoke@example.com",
    childAge: 7,
    ageYears: 7,
    lang: "hu",
    packageCode,
    payload: {
      childAge: 7,
      ageYears: 7,
      acquisition: {
        schema_version: "campaign-attribution-v1",
        first_touch: {
          utm_source: "google",
          utm_medium: "cpc",
          utm_campaign: "nm_hu_search_core",
          utm_content: "behavior-rsa-a",
          utm_term: "gyerek viselkedes kerdoiv",
          gclid: "test-click-id",
          landing_path: "/?lang=hu&utm_source=google",
          landing_url: "https://neuromap-kids.webflow.io/",
          captured_at: "2026-07-12T08:00:00.000Z",
          lang: "hu"
        },
        last_touch: {
          utm_source: "google",
          utm_medium: "cpc",
          utm_campaign: "nm_hu_search_core",
          captured_at: "2026-07-12T08:00:00.000Z",
          lang: "hu"
        },
        updated_at: "2026-07-12T08:00:00.000Z"
      },
      triageQuestions: triageQuestions.map((question) => toPayloadQuestion(question)),
      triageAnswers,
      triageScores,
      triageRanking: [],
      detectedRisk,
      secondaryRisk,
      specificQuestions: specificQuestions.map((question) => toPayloadQuestion(question)),
      specificAnswers,
      specificScoring,
      specificProfile,
      resultSummary: {
        kind: detectedRisk,
        normalizedAverage: specificScoring.normalizedAverage,
        signal: { key: specificProfile.severity, hu: specificProfile.severity, en: specificProfile.severity },
        topSubdomains: Object.entries(specificScoring.subdomains)
          .slice(0, 3)
          .map(([key, value]) => ({ key, average: value.average, itemCount: value.itemCount })),
        secondaryRisk,
        triageScores,
        summaryText: {
          hu: "Smoke teszt osszegzes.",
          en: "Smoke test summary."
        }
      },
      extraQuestions: extraQuestions.map((question) => toPayloadQuestion(question)),
      extraAnswers,
      questionnaireVersion: "smoke-v1"
    }
  };
}

function expectValidPayload(name, payload) {
  const validation = validateCheckoutPayload(payload);
  assert(validation.ok, `${name} should validate. Errors: ${validation.errors.join("; ")}`);

  const normalized = normalizeCheckoutPayload(payload);
  const canonical = canonicalizeQuestionnairePayload(normalized.payload, normalized.lang);
  assert(normalized.email === payload.email, `${name} should keep lowercase email.`);
  assert(normalized.payload.childAge === 7, `${name} should keep childAge.`);
  assert(normalized.payload.ageYears === 7, `${name} should keep ageYears.`);
  assert(normalized.packageCode === payload.packageCode, `${name} should keep the selected package code.`);
  assert(normalized.payload.acquisition?.first_touch?.utm_source === "google", `${name} should keep campaign source.`);
  assert(normalized.payload.acquisition?.first_touch?.gclid === "test-click-id", `${name} should keep Google click id.`);
  assert(normalized.payload.triageQuestions.length === 25, `${name} should keep 25 triage questions.`);
  assert(normalized.payload.specificQuestions.length === 30, `${name} should keep 30 specific questions.`);
  assert(canonical.detectedRisk === "ADHD", `${name} should derive ADHD on the server.`);
  assert(canonical.specificProfile.kind === "ADHD", `${name} should replace the client profile kind.`);
  assert(canonical.triageScores.ADHD > canonical.triageScores.ANXIETY || payload.payload.extraQuestions.length === 5,
    `${name} should recompute triage scores.`);
  assert(canonical.scoringAuthority === "server-canonical-v1", `${name} should mark server scoring authority.`);
  assert(canonical.extraQuestions.length === payload.payload.extraQuestions.length,
    `${name} should keep only canonical extra questions.`);

  normalized.payload = canonical;
  return normalized;
}

function main() {
  console.log("\n=== CHECKOUT PAYLOAD SMOKE ===");

  const standardPayload = buildBasePayload();
  const standardNormalized = expectValidPayload("standard payload", standardPayload);
  console.log("standard payload ok", {
    triage: standardNormalized.payload.triageQuestions.length,
    specific: standardNormalized.payload.specificQuestions.length,
    extra: standardNormalized.payload.extraQuestions.length,
    detectedRisk: standardNormalized.payload.detectedRisk
  });

  const extraPayload = buildBasePayload({ includeExtra: true });
  const extraNormalized = expectValidPayload("extra payload", extraPayload);
  console.log("extra payload ok", {
    triage: extraNormalized.payload.triageQuestions.length,
    specific: extraNormalized.payload.specificQuestions.length,
    extra: extraNormalized.payload.extraQuestions.length,
    detectedRisk: extraNormalized.payload.detectedRisk,
    secondaryRisk: extraNormalized.payload.secondaryRisk
  });

  const brokenExtraPayload = structuredClone(extraPayload);
  brokenExtraPayload.payload.extraAnswers = brokenExtraPayload.payload.extraAnswers.slice(0, 4);
  const brokenValidation = validateCheckoutPayload(brokenExtraPayload);
  assert(!brokenValidation.ok, "broken extra payload should fail validation.");
  assert(
    brokenValidation.errors.some((error) => error.includes("extraAnswers")),
    "broken extra payload should fail on extraAnswers length."
  );
  console.log("broken extra payload rejected as expected");

  const tamperedQuestionPayload = buildBasePayload();
  tamperedQuestionPayload.payload.specificQuestions[0].id = "UNKNOWN_QUESTION";
  let integrityRejected = false;
  try {
    const normalized = normalizeCheckoutPayload(tamperedQuestionPayload);
    canonicalizeQuestionnairePayload(normalized.payload, normalized.lang);
  } catch (error) {
    integrityRejected = error instanceof QuestionnaireIntegrityError;
  }
  assert(integrityRejected, "unknown question ids should fail canonical integrity validation.");
  console.log("unknown question id rejected as expected");

  const plusPayload = buildBasePayload({ packageCode: "plus_v1" });
  const plusNormalized = expectValidPayload("plus payload", plusPayload);
  assert(plusNormalized.packageCode === "plus_v1", "plus payload should keep plus_v1.");
  console.log("plus payload ok", { packageCode: plusNormalized.packageCode });

  const invalidPackagePayload = buildBasePayload({ packageCode: "custom_price_001" });
  const invalidPackageValidation = validateCheckoutPayload(invalidPackagePayload);
  assert(!invalidPackageValidation.ok, "invalid package payload should fail validation.");
  assert(
    invalidPackageValidation.errors.includes("Invalid packageCode."),
    "invalid package payload should fail on packageCode."
  );
  console.log("invalid package rejected as expected");

  console.log("Checkout payload smoke passed.");
}

try {
  main();
} catch (error) {
  console.error("Checkout payload smoke failed:", error.message);
  process.exit(1);
}

import { normalizePackageCode } from "../config/products.js";

const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isNumberArray(values, expectedLength) {
  return Array.isArray(values) &&
    values.length === expectedLength &&
    values.every((value) => Number.isInteger(value) && value >= 0 && value <= 3);
}

function validateQuestionReferences(name, questions, expectedLength) {
  const errors = [];
  if (!Array.isArray(questions) || questions.length !== expectedLength) {
    return [`${name} must contain exactly ${expectedLength} item(s).`];
  }

  questions.forEach((question, index) => {
    const keys = isObject(question) ? Object.keys(question) : [];
    if (!isObject(question) || typeof question.id !== "string" || !question.id.trim()) {
      errors.push(`${name}[${index}] has invalid id.`);
    } else if (question.id.length > 120) {
      errors.push(`${name}[${index}] id is too long.`);
    }
    if (keys.some((key) => key !== "id")) {
      errors.push(`${name}[${index}] may only contain an id.`);
    }
  });
  return errors;
}

function validateConsent(consent) {
  const errors = [];
  if (!isObject(consent)) return ["Missing consent receipt."];
  if (typeof consent.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(consent.id.trim())) {
    errors.push("Invalid consent receipt id.");
  }
  if (typeof consent.token !== "string" || consent.token.length < 32 || consent.token.length > 128) {
    errors.push("Invalid consent receipt token.");
  }
  return errors;
}

function validatePurchaseConfirmations(confirmations) {
  if (!isObject(confirmations)) return ["Missing purchase confirmations."];
  const errors = [];
  if (confirmations.digitalPerformanceRequested !== true) {
    errors.push("Immediate digital performance must be explicitly requested.");
  }
  if (confirmations.withdrawalRightAcknowledged !== true) {
    errors.push("Withdrawal-right acknowledgement is required.");
  }
  return errors;
}

export function validateCheckoutPayload(body = {}) {
  const errors = [];
  if (!body.name || typeof body.name !== "string" || body.name.length > 120) {
    errors.push("Missing or invalid name.");
  }
  if (!body.email || typeof body.email !== "string" || body.email.length > 254 || !EMAIL_RE.test(body.email)) {
    errors.push("Missing or invalid email.");
  }
  if (!SUPPORTED_LANGS.includes(body.lang)) errors.push("Missing or invalid lang.");
  if (body.packageCode !== undefined && body.packageCode !== null &&
      !normalizePackageCode(body.packageCode, { defaultIfMissing: false })) {
    errors.push("Invalid packageCode.");
  }
  errors.push(...validateConsent(body.consent));
  errors.push(...validatePurchaseConfirmations(body.purchaseConfirmations));

  const payload = body.payload;
  if (!isObject(payload)) return { ok: false, errors: [...errors, "Missing payload."] };

  const age = Number(payload.childAge ?? payload.ageYears ?? body.childAge ?? body.ageYears);
  if (!Number.isFinite(age) || age < 3 || age > 17) {
    errors.push("Child age must be between 3 and 17 years.");
  }

  errors.push(...validateQuestionReferences("triageQuestions", payload.triageQuestions, 25));
  if (!isNumberArray(payload.triageAnswers, 25)) {
    errors.push("triageAnswers must contain exactly 25 integer values from 0 to 3.");
  }
  errors.push(...validateQuestionReferences("specificQuestions", payload.specificQuestions, 30));
  if (!isNumberArray(payload.specificAnswers, 30)) {
    errors.push("specificAnswers must contain exactly 30 integer values from 0 to 3.");
  }

  const extraQuestions = payload.extraQuestions || [];
  const extraAnswers = payload.extraAnswers || [];
  if (extraQuestions.length) {
    errors.push(...validateQuestionReferences("extraQuestions", extraQuestions, 5));
    if (!isNumberArray(extraAnswers, 5)) {
      errors.push("extraAnswers must contain exactly 5 integer values from 0 to 3.");
    }
  } else if (extraAnswers.length) {
    errors.push("extraAnswers are not allowed without extraQuestions.");
  }

  return { ok: errors.length === 0, errors };
}

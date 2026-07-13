import { normalizePackageCode } from "../config/products.js";

const REQUIRED_DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];
const SUPPORTED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isNumberArray(arr, expectedLength) {
  return (
    Array.isArray(arr) &&
    arr.length === expectedLength &&
    arr.every((v) => typeof v === "number" && v >= 0 && v <= 3)
  );
}

function hasInvalidAge(value) {
  if (value === null || value === undefined || value === "") return false;

  const age = Number(String(value).trim().replace(",", "."));
  return !Number.isFinite(age) || age < 1 || age > 24;
}

function validateQuestionArray(name, questions, minLength = 1, maxLength = 60) {
  const errors = [];

  if (!Array.isArray(questions)) {
    errors.push(`${name} must be an array.`);
    return errors;
  }

  if (questions.length < minLength) {
    errors.push(`${name} must contain at least ${minLength} item(s).`);
  }

  if (questions.length > maxLength) {
    errors.push(`${name} must contain at most ${maxLength} item(s).`);
  }

  questions.forEach((q, index) => {
    if (!q || typeof q !== "object" || Array.isArray(q)) {
      errors.push(`${name}[${index}] must be an object.`);
      return;
    }

    if (typeof q.id !== "string" || q.id.length < 1 || q.id.length > 120) {
      errors.push(`${name}[${index}] has invalid id.`);
    }

    if (typeof q.text !== "string" || q.text.length < 1 || q.text.length > 1000) {
      errors.push(`${name}[${index}] has invalid text.`);
    }
  });

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

  if (!body.lang || typeof body.lang !== "string" || !SUPPORTED_LANGS.includes(body.lang)) {
    errors.push("Missing or invalid lang.");
  }

  if (body.packageCode !== undefined && body.packageCode !== null) {
    if (!normalizePackageCode(body.packageCode, { defaultIfMissing: false })) {
      errors.push("Invalid packageCode.");
    }
  }

  const payload = body.payload;

  if (!isObject(payload)) {
    errors.push("Missing payload.");
    return { ok: false, errors };
  }

  if (hasInvalidAge(body.childAge) || hasInvalidAge(body.ageYears) || hasInvalidAge(payload.childAge) || hasInvalidAge(payload.ageYears)) {
    errors.push("Invalid child age.");
  }

  errors.push(...validateQuestionArray("triageQuestions", payload.triageQuestions, 25, 40));

  if (!isNumberArray(payload.triageAnswers, payload.triageQuestions?.length || 25)) {
    errors.push("triageAnswers must match triageQuestions length and contain values 0-3.");
  }

  if (!isObject(payload.triageScores)) {
    errors.push("Missing triageScores.");
  } else {
    REQUIRED_DOMAINS.forEach((domain) => {
      if (typeof payload.triageScores[domain] !== "number") {
        errors.push(`triageScores.${domain} must be a number.`);
      }
    });
  }

  if (!REQUIRED_DOMAINS.includes(payload.detectedRisk)) {
    errors.push("Invalid detectedRisk.");
  }

  if (payload.secondaryRisk !== null && payload.secondaryRisk !== undefined) {
    if (!REQUIRED_DOMAINS.includes(payload.secondaryRisk)) {
      errors.push("Invalid secondaryRisk.");
    }
  }

  errors.push(...validateQuestionArray("specificQuestions", payload.specificQuestions, 1, 60));

  if (!isNumberArray(payload.specificAnswers, payload.specificQuestions?.length || 0)) {
    errors.push("specificAnswers must match specificQuestions length and contain values 0-3.");
  }

  if (!isObject(payload.specificScoring)) {
    errors.push("Missing specificScoring.");
  } else if (typeof payload.specificScoring.normalizedAverage !== "number") {
    errors.push("specificScoring.normalizedAverage must be a number.");
  }

  if (!isObject(payload.specificProfile)) {
    errors.push("Missing specificProfile.");
  } else {
    if (!REQUIRED_DOMAINS.includes(payload.specificProfile.kind)) {
      errors.push("specificProfile.kind is invalid.");
    }

    if (!["low", "mild", "moderate", "high"].includes(payload.specificProfile.severity)) {
      errors.push("specificProfile.severity is invalid.");
    }
  }

  if (Array.isArray(payload.extraQuestions) && payload.extraQuestions.length > 0) {
    errors.push(...validateQuestionArray("extraQuestions", payload.extraQuestions, 1, 10));

    if (!isNumberArray(payload.extraAnswers, payload.extraQuestions.length)) {
      errors.push("extraAnswers must match extraQuestions length and contain values 0-3.");
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

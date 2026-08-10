import { normalizePackageCode } from "../config/products.js";

function cleanText(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .trim()
    .slice(0, maxLength);
}

function cleanAge(value) {
  if (value === null || value === undefined || value === "") return null;
  const age = Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(age) || age < 3 || age > 17) return null;
  return Math.round(age * 10) / 10;
}

function normalizeQuestionReference(question = {}) {
  return { id: cleanText(question.id, 120) };
}

function normalizeAnswers(answers = []) {
  if (!Array.isArray(answers)) return [];
  return answers.map((value) => Number(value));
}

function normalizeConsent(consent = {}) {
  return {
    id: cleanText(consent.id, 80),
    token: cleanText(consent.token, 128)
  };
}

function stripQuestionMetadata(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map((question) => ({
    id: question && typeof question === "object" ? question.id : undefined
  }));
}

export function stripCheckoutQuestionMetadata(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;

  const payload = body.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return body;

  return {
    ...body,
    payload: {
      ...payload,
      triageQuestions: stripQuestionMetadata(payload.triageQuestions),
      specificQuestions: stripQuestionMetadata(payload.specificQuestions),
      extraQuestions: stripQuestionMetadata(payload.extraQuestions)
    }
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
    lang: cleanText(body.lang || "en", 10).toLowerCase(),
    packageCode: normalizePackageCode(body.packageCode) || null,
    consent: normalizeConsent(body.consent),
    payload: {
      childAge,
      ageYears: childAge,
      triageQuestions: Array.isArray(payload.triageQuestions)
        ? payload.triageQuestions.slice(0, 25).map(normalizeQuestionReference)
        : [],
      triageAnswers: normalizeAnswers(payload.triageAnswers),
      specificQuestions: Array.isArray(payload.specificQuestions)
        ? payload.specificQuestions.slice(0, 30).map(normalizeQuestionReference)
        : [],
      specificAnswers: normalizeAnswers(payload.specificAnswers),
      extraQuestions: Array.isArray(payload.extraQuestions)
        ? payload.extraQuestions.slice(0, 5).map(normalizeQuestionReference)
        : [],
      extraAnswers: normalizeAnswers(payload.extraAnswers),
      questionnaireVersion: cleanText(payload.questionnaireVersion || "unknown", 80)
    }
  };
}

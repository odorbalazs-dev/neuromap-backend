import {
  buildRecordEmailIdempotencyKey,
  buildReportEmailIdempotencyKey
} from "../src/services/email-idempotency.service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sessionId = "7e0f2ca9-1561-4fe8-9e42-3c8f4b1c12ce";
const reportA = "A stable report body.";
const reportB = "A revised report body.";

const first = buildReportEmailIdempotencyKey(sessionId, reportA);
const retry = buildReportEmailIdempotencyKey(sessionId, reportA);
const revised = buildReportEmailIdempotencyKey(sessionId, reportB);

assert(first === retry, "Identical report retries must use the same key.");
assert(first !== revised, "Revised report content must use a new key.");
assert(first.startsWith(`report-email/${sessionId}/`), "Report key namespace is invalid.");
assert(
  buildRecordEmailIdempotencyKey("follow-up", sessionId) === `follow-up/${sessionId}`,
  "Record email key should be deterministic."
);

console.log("Email idempotency smoke passed.");

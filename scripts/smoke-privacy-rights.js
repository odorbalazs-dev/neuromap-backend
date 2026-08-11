import fs from "fs";
import path from "path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const service = read("src/services/privacy-rights.service.js");
const controller = read("src/api/controllers/legal.controller.js");
const routes = read("src/api/routes/legal.js");
const server = read("src/app/server.js");
const migration = read("src/db/migrations/020_privacy_request_email_verification.sql");

const supportedLanguages = [
  "hu",
  "en",
  "de",
  "it",
  "es",
  "zh",
  "ja",
  "ar",
  "pl",
  "pt",
  "fr"
];

supportedLanguages.forEach((language) => {
  assert(
    service.includes(`  "${language}"`),
    `Privacy-rights locale is missing: ${language}`
  );
});

assert(
  service.includes("const VERIFICATION_TTL_MINUTES = 15") &&
    service.includes("const MAX_VERIFICATION_ATTEMPTS = 5"),
  "Privacy verification expiry or attempt limit is missing"
);

assert(
  service.includes("UUID_PATTERN") &&
    service.includes('assertUuid(sessionId, "session id")') &&
    service.includes('assertUuid(requestId, "privacy request id")'),
  "Externally supplied privacy identifiers must be validated before database use"
);

assert(
  service.includes("privacy-verification:v1:${requestId}:${requestToken}") &&
    service.includes('createHash("sha256")'),
  "The six-digit code hash must be bound to the request and secret request token"
);

assert(
  service.includes("randomBytes(32).toString(\"base64url\")") &&
    service.includes("hashValue(requestToken)") &&
    service.includes("secureCompare(") &&
    service.includes("request.request_token_hash"),
  "Privacy requests must use a random token stored only as a hash and compared safely"
);

assert(
  service.includes("'verification_pending'") &&
    service.includes("NOW() + INTERVAL '15 minutes'") &&
    service.includes("sendPrivacyRequestVerificationEmail"),
  "New rights requests must wait for an emailed, expiring verification code"
);

assert(
  service.includes("SELECT * FROM privacy_requests WHERE id = $1 FOR UPDATE") &&
    service.includes("verification_code_hash = NULL") &&
    service.includes("verification:succeeded") &&
    service.includes("executeVerifiedPrivacyRequest(request, session)"),
  "Verification must be transactionally claimed, cleared and completed before execution"
);

assert(
  controller.includes("privacyRequestTokenFromRequest(req)") &&
    routes.includes('router.post("/privacy-requests/:id/verify"'),
  "The verified rights-request endpoint or request-token authentication is missing"
);

assert(
  server.includes('app.use("/legal/privacy-requests"') &&
    server.includes('keyPrefix: "privacy-rights"') &&
    server.includes("failClosed: true"),
  "Privacy-rights endpoints require a dedicated fail-closed rate limit"
);

[
  "verification_code_hash",
  "verification_expires_at",
  "verification_attempts",
  "verification_verified_at",
  "idx_privacy_requests_verification_pending"
].forEach((fragment) => {
  assert(migration.includes(fragment), `Privacy verification migration is missing: ${fragment}`);
});

assert(
  service.includes('PRIVACY_RIGHTS_VERSION = "2026-07-26"'),
  "The exported privacy-rights version was not updated"
);

console.log("[smoke:privacy-rights] OK");

import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Synthetic credentials and mocked database/provider only; no live account calls.
Object.assign(process.env, {
  NODE_ENV: "test", DATABASE_URL: "postgresql://localhost/unused_security_fixture",
  DATABASE_SSL_MODE: "disable", OPENAI_API_KEY: "test-openai", STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_fixture", RESEND_API_KEY: "re_fixture", EMAIL_FROM: "test@example.invalid",
  APP_URL: "https://example.invalid", SUCCESS_URL: "https://example.invalid/success", CANCEL_URL: "https://example.invalid/cancel"
});
const { db } = await import("../src/db/db.js");
const { env } = await import("../src/config/env.js");
const { safeError } = await import("../src/utils/safeError.js");
const { securityHeaders } = await import("../src/middleware/security.js");
const { getPublicLegalConfiguration, createConsentReceipt, inspectConsentReceipt } = await import("../src/services/consent.service.js");
const { createAdminSession, getAdminSession } = await import("../src/services/admin-session.service.js");
const { hashSessionAccessToken } = await import("../src/services/session.service.js");
const { createConsentedSession, withCheckoutConsent } = await import("../src/services/checkout-consent.service.js");
const Stripe = (await import("stripe")).default;
const prototype = Object.getPrototypeOf(new Stripe("sk_test_placeholder").checkout.sessions);
const originalCreate = prototype.create;
let stripeCalls = 0;
prototype.create = async () => { stripeCalls++; return { id: "cs_test_mocked", url: "https://checkout.example.invalid/mock" }; };
const { retryCheckout } = await import("../src/api/controllers/checkout.controller.js");
const { stripeWebhookController } = await import("../src/api/controllers/webhook.controller.js");
const originalQuery = db.query, originalConnect = db.connect;
const originalError = console.error, originalWarn = console.warn;
const messages = [];
console.error = (...args) => messages.push(args);
console.warn = (...args) => messages.push(args);
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

try {
  env.LAUNCH_GATE_ENFORCED = false;
  env.PRODUCTION_CHECKOUT_ENABLED = true;
  const config = getPublicLegalConfiguration();
  const confirmations = Object.fromEntries(["adultConfirmation", "guardianAuthority", "termsAcknowledged", "informationalPurposeAcknowledged", "privacyNoticeAcknowledged", "specialCategoryExplicitConsent", "aiTransparencyAcknowledged", "termsScrollCompleted", "privacyScrollCompleted"].map(key => [key, true]));
  const receiptInput = { ...confirmations, actorRole: "parent_or_legal_guardian", language: "hu",
    privacyPolicyVersion: config.privacyPolicyVersion, termsVersion: config.termsVersion,
    consentPolicyVersion: config.consentPolicyVersion, configurationDigest: config.configurationDigest,
    documentDigest: config.documentDigests.hu };
  let writes = 0;
  db.query = async sql => { writes++; return { rows: sql.includes("consent_events") ? [{ analytics_consent: false }] : [] }; };
  for (const field of ["privacyPolicyVersion", "termsVersion", "consentPolicyVersion", "configurationDigest", "documentDigest"]) {
    await assert.rejects(createConsentReceipt({ ...receiptInput, [field]: "obsolete" }), { code: "CONSENT_POLICY_CHANGED" });
  }
  assert.equal(writes, 0, "Stale documents must not create an archive or receipt");
  for (const lang of config.supportedLanguages) {
    await createConsentReceipt({ ...receiptInput, language: lang, documentDigest: config.documentDigests[lang] });
  }
  assert.equal(writes, 22, "Each language archives its document before the receipt");

  env.ADMIN_TOKEN = "synthetic-admin-original-credential-123456789";
  let adminRow;
  db.query = async (sql, values) => {
    if (sql.includes("INSERT INTO admin_sessions")) {
      adminRow = { id: values[0], csrf_token_hash: values[2], user_agent_hash: values[4],
        credential_binding: values[6], expires_at: new Date(Date.now() + 60000) };
      return { rows: [adminRow] };
    }
    if (sql.includes("revoked_at = COALESCE")) { adminRow.revoked = true; return { rows: [] }; }
    return { rows: adminRow.revoked ? [] : [adminRow] };
  };
  const login = await createAdminSession({ userAgent: "fixture-agent" });
  assert.ok(await getAdminSession(login.sessionToken, { userAgent: "fixture-agent" }));
  env.ADMIN_TOKEN = "synthetic-admin-rotated-credential-987654321";
  assert.equal(await getAdminSession(login.sessionToken, { userAgent: "fixture-agent" }), null);
  assert.equal(adminRow.revoked, true);
  const newLogin = await createAdminSession({ userAgent: "fixture-agent" });
  assert.ok(await getAdminSession(newLogin.sessionToken, { userAgent: "fixture-agent" }));
  delete adminRow.credential_binding;
  assert.equal(await getAdminSession(newLogin.sessionToken, { userAgent: "fixture-agent" }), null);

  for (const path of ["/admin", "/admin/dashboard", "/admin/session", "/admin/sessions/recent", "/admin-status", "/ADMIN/sessions/recent"]) {
    const headers = {};
    securityHeaders({ path }, { setHeader: (key, value) => { headers[key] = value; } }, () => {});
    assert.match(headers["Cache-Control"], /no-store/);
    assert.equal(headers.Pragma, "no-cache");
  }

  const token = "synthetic-public-access-token-for-tests";
  const consentToken = "synthetic-consent-access-token-for-tests";
  const consentId = "00000000-0000-4000-8000-000000000002";
  const consent = { id: consentId, token_hash: createHash("sha256").update(consentToken).digest("hex"), language: "hu", expires_at: new Date(Date.now() + 60000),
    consented_at: new Date(), special_category_explicit_consent: true, terms_acknowledged: true,
    privacy_policy_version: config.privacyPolicyVersion, terms_version: config.termsVersion,
    consent_policy_version: config.consentPolicyVersion,
    evidence: { configurationDigest: config.configurationDigest, documentDigest: config.documentDigests.hu } };
  const session = { id: "00000000-0000-4000-8000-000000000001", consent_event_id: consentId,
    email: "fixture@example.invalid", name: "Synthetic", lang: "hu", package_code: "plus_v1",
    payment_status: "pending", analysis_status: "pending", public_access_token_hash: hashSessionAccessToken(token),
    consent_record: { privacyPolicyVersion: config.privacyPolicyVersion, termsVersion: config.termsVersion, consentPolicyVersion: config.consentPolicyVersion } };
  let queries = [], released = false;
  const query = async sql => {
    queries.push(sql);
    if (sql.includes("consent_events")) return { rows: [consent] };
    if (sql.includes("checkout_attempt")) return { rows: [{ checkout_attempt: 2 }] };
    if (sql.includes("sessions")) return { rows: [session] };
    return { rows: [] };
  };
  db.query = query;
  db.connect = async () => ({ query, release() { released = true; } });
  const request = { params: { id: session.id }, headers: { "x-session-token": token } };
  for (const field of ["processing_restricted_at", "sensitive_data_erased_at", "data_redacted_at"]) {
    session[field] = new Date();
    const res = response(); await retryCheckout(request, res);
    assert.equal(res.statusCode, 409); assert.equal(res.body.code, "PROCESSING_RESTRICTED");
    delete session[field];
  }
  consent.withdrawn_at = new Date();
  const withdrawn = response(); await retryCheckout(request, withdrawn);
  assert.equal(withdrawn.statusCode, 409); assert.equal(stripeCalls, 0);
  await assert.rejects(inspectConsentReceipt({ id: consentId, token: consentToken }), { code: "CONSENT_WITHDRAWN" });
  delete consent.withdrawn_at;
  consent.evidence.documentDigest = "outdated-content";
  const outdated = response(); await retryCheckout(request, outdated);
  assert.equal(outdated.statusCode, 409); assert.equal(stripeCalls, 0);
  await assert.rejects(inspectConsentReceipt({ id: consentId, token: consentToken }), { code: "CONSENT_POLICY_CHANGED" });
  consent.evidence.documentDigest = config.documentDigests.hu;
  queries = []; released = false;
  const valid = response(); await retryCheckout(request, valid);
  assert.equal(valid.statusCode, 200); assert.equal(stripeCalls, 1); assert.equal(released, true);
  const locked = queries.filter(sql => sql.includes("FOR UPDATE"));
  assert.match(locked[0], /consent_events/); assert.match(locked[1], /sessions/);
  assert.equal(queries.at(-1), "COMMIT");
  await assert.rejects(withCheckoutConsent(session.id, async () => { throw new Error("synthetic failure"); }));
  assert.equal(queries.at(-1), "ROLLBACK");
  const productPackage = { code: "plus_v1", offerVersion: "fixture", unitAmount: 999, currency: "usd", entitlements: {} };
  await createConsentedSession({ email: session.email, name: session.name, lang: "hu", payload: {}, productPackage },
    { id: consentId, token: consentToken }, { digitalPerformanceRequested: true, withdrawalRightAcknowledged: true });
  assert.equal(queries.at(-1), "COMMIT");

  const secret = "private-customer@example.invalid";
  assert.deepEqual(safeError({ type: "StripeSignatureVerificationError", statusCode: 400, payload: secret, message: secret, stack: secret }), { type: "StripeSignatureVerificationError", status: 400 });
  const invalidWebhook = response();
  await stripeWebhookController({ body: Buffer.from(JSON.stringify({ email: secret })), headers: { "stripe-signature": "invalid-private-signature" } }, invalidWebhook);
  assert.equal(invalidWebhook.statusCode, 400);
  assert.ok(!JSON.stringify(messages).includes(secret));
  assert.ok(!JSON.stringify(messages).includes("invalid-private-signature"));
  console.log("Consent security passed: 11 document languages, stale receipts, withdrawal/restriction guards, transaction boundaries, admin rotation, private headers and redacted Stripe failures (mocked I/O).");
} finally {
  prototype.create = originalCreate;
  db.query = originalQuery; db.connect = originalConnect;
  console.error = originalError; console.warn = originalWarn;
  await db.close();
}

import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const url = new URL(process.env.DATABASE_TEST_URL || "postgresql://localhost/invalid");
if (url.pathname !== "/neuromap_ci" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("Only an isolated local neuromap_ci test database is allowed.");
}
Object.assign(process.env, {
  NODE_ENV: "test", DATABASE_URL: url.href, DATABASE_SSL_MODE: "disable",
  OPENAI_API_KEY: "test", STRIPE_SECRET_KEY: "sk_test_placeholder", STRIPE_WEBHOOK_SECRET: "whsec_test",
  RESEND_API_KEY: "re_test", EMAIL_FROM: "test@example.invalid", APP_URL: "https://example.invalid",
  SUCCESS_URL: "https://example.invalid/success", CANCEL_URL: "https://example.invalid/cancel"
});
const { db } = await import("../src/db/db.js");
const { env } = await import("../src/config/env.js");
const { runMigrations } = await import("../src/db/migrate.js");
const { createConsentReceipt, getPublicLegalConfiguration, withdrawConsentReceipt } = await import("../src/services/consent.service.js");
const { createConsentedSession, withCheckoutConsent } = await import("../src/services/checkout-consent.service.js");
const { createAdminSession, getAdminSession } = await import("../src/services/admin-session.service.js");
const receiptIds = [], adminIds = [];
const config = getPublicLegalConfiguration();
const confirmations = Object.fromEntries(["adultConfirmation", "guardianAuthority", "termsAcknowledged", "informationalPurposeAcknowledged", "privacyNoticeAcknowledged", "specialCategoryExplicitConsent", "aiTransparencyAcknowledged", "termsScrollCompleted", "privacyScrollCompleted"].map(key => [key, true]));
const newReceipt = async () => {
  const receipt = await createConsentReceipt({ ...confirmations, actorRole: "parent_or_legal_guardian", language: "hu",
    privacyPolicyVersion: config.privacyPolicyVersion, termsVersion: config.termsVersion,
    consentPolicyVersion: config.consentPolicyVersion, configurationDigest: config.configurationDigest,
    documentDigest: config.documentDigests.hu });
  receiptIds.push(receipt.id); return receipt;
};
const input = { email: "synthetic@example.invalid", name: "Synthetic", lang: "hu", payload: {},
  productPackage: { code: "plus_v1", offerVersion: "security-test", unitAmount: 999, currency: "usd", entitlements: {} } };
const purchase = { digitalPerformanceRequested: true, withdrawalRightAcknowledged: true };

try {
  await runMigrations();
  await runMigrations();
  const receipt = await newReceipt();
  const created = await createConsentedSession(input, receipt, purchase);
  const archived = await db.query(`SELECT r.revision_id FROM consent_events c
    JOIN legal_document_revisions r ON r.revision_id = c.evidence->>'documentRevisionId' WHERE c.id = $1`, [receipt.id]);
  assert.equal(archived.rowCount, 1);

  let releaseCheckout, announceLocked;
  const locked = new Promise(resolve => { announceLocked = resolve; });
  const release = new Promise(resolve => { releaseCheckout = resolve; });
  const checkout = withCheckoutConsent(created.session.id, async () => { announceLocked(); await release; });
  await Promise.race([locked, checkout]);
  let withdrawalFinished = false;
  const withdrawal = withdrawConsentReceipt(receipt).then(value => { withdrawalFinished = true; return value; });
  try {
    await delay(100);
    assert.equal(withdrawalFinished, false, "Withdrawal cannot overtake a locked checkout operation");
  } finally {
    releaseCheckout();
    await Promise.all([checkout, withdrawal]);
  }
  let providerCalled = false;
  await assert.rejects(withCheckoutConsent(created.session.id, async () => { providerCalled = true; }), { code: "CONSENT_WITHDRAWN" });
  assert.equal(providerCalled, false);
  assert.ok((await db.query("SELECT processing_restricted_at FROM sessions WHERE id = $1", [created.session.id])).rows[0].processing_restricted_at);

  for (let attempt = 0; attempt < 5; attempt++) {
    const raceReceipt = await newReceipt();
    const race = await Promise.allSettled([
      createConsentedSession(input, raceReceipt, purchase), withdrawConsentReceipt(raceReceipt)
    ]);
    assert.equal(race[1].status, "fulfilled");
    if (race[0].status === "rejected") assert.ok(["CONSENT_WITHDRAWN", "CONSENT_CLAIM_FAILED"].includes(race[0].reason.code));
    const unsafe = await db.query("SELECT id FROM sessions WHERE consent_event_id = $1 AND processing_restricted_at IS NULL", [raceReceipt.id]);
    assert.equal(unsafe.rowCount, 0, "Concurrent withdrawal never leaves an unrestricted session");
  }

  env.ADMIN_TOKEN = "synthetic-original-admin-key-123456789";
  const admin = await createAdminSession({ userAgent: "integration-fixture" }); adminIds.push(admin.id);
  assert.ok(await getAdminSession(admin.sessionToken, { userAgent: "integration-fixture" }));
  env.ADMIN_TOKEN = "synthetic-rotated-admin-key-987654321";
  assert.equal(await getAdminSession(admin.sessionToken, { userAgent: "integration-fixture" }), null);
  assert.ok((await db.query("SELECT revoked_at FROM admin_sessions WHERE id = $1", [admin.id])).rows[0].revoked_at);
  console.log("PostgreSQL consent security passed: migration, evidence archive, transaction races, withdrawal and admin rotation. No provider calls.");
} finally {
  try {
    if (receiptIds.length) {
      await db.query("DELETE FROM sessions WHERE consent_event_id = ANY($1::uuid[])", [receiptIds]);
      await db.query("DELETE FROM consent_events WHERE id = ANY($1::uuid[])", [receiptIds]);
    }
    if (adminIds.length) await db.query("DELETE FROM admin_sessions WHERE id = ANY($1::text[])", [adminIds]);
  } finally {
    await db.close();
  }
}

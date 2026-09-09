import assert from "node:assert/strict";
import { TEST_INVOICE_EXCLUSION, isTestInvoicePayment, isVerifiedLiveInvoicePayment } from "../src/services/invoice-payment-policy.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://localhost/neuromap_unit_unused";
process.env.DATABASE_SSL_MODE = "disable";
for (const [key, value] of Object.entries({ OPENAI_API_KEY: "test-openai", STRIPE_SECRET_KEY: "sk_test_placeholder", STRIPE_WEBHOOK_SECRET: "whsec_test", RESEND_API_KEY: "re_test", EMAIL_FROM: "test@example.invalid", APP_URL: "https://example.invalid", SUCCESS_URL: "https://example.invalid/success", CANCEL_URL: "https://example.invalid/cancel" })) process.env[key] = value;

const { db } = await import("../src/db/db.js");
const { env } = await import("../src/config/env.js");
const { invoiceConfig } = await import("../src/config/invoice.js");
const { createInvoiceForPaidSession, createInvoiceForSessionId, retryInvoicesBatch } = await import("../src/services/invoice.service.js");
const liveSession = { id: "unit-session", stripe_session_id: "cs_live_unit", payment_status: "paid", lang: "en", amount_total: 999, currency: "USD" };
const liveCheckout = { id: "cs_live_unit", livemode: true, payment_status: "paid", amount_total: 999, currency: "usd",
  metadata: { internalSessionId: liveSession.id }, customer_details: { name: "Unit test", email: "unit@example.invalid", address: { country: "HU", postal_code: "1011", city: "Budapest", line1: "Test 1" } } };

assert.equal(isVerifiedLiveInvoicePayment(liveSession, liveCheckout), true);
for (const checkout of [null, {}, { ...liveCheckout, livemode: false }, { ...liveCheckout, livemode: "true" },
  { ...liveCheckout, livemode: undefined }, { ...liveCheckout, id: "cs_test_unit" }, { ...liveCheckout, payment_status: "unpaid" },
  { ...liveCheckout, metadata: {} }, { ...liveCheckout, metadata: { internalSessionId: "someone-else" } }]) {
  assert.equal(isVerifiedLiveInvoicePayment(liveSession, checkout), false);
}
assert.equal(isTestInvoicePayment({ stripe_session_id: "cs_test_old" }, liveCheckout), true);
assert.equal(isTestInvoicePayment(liveSession, { livemode: false }), true);

// No network or database connection may escape this unit test.
env.STRIPE_SECRET_KEY = "";
invoiceConfig.autoCreate = true;
invoiceConfig.provider = "szamlazzhu";
invoiceConfig.szamlazzhu.agentKey = "unit-test-agent-not-real";
let invoice, session, snapshot, providerCalls = 0, batchSql = "";
const reset = () => { invoice = null; session = { ...liveSession }; snapshot = null; providerCalls = 0; };
db.query = async (sql, params = []) => {
  if (/SELECT \*\s+FROM invoices/.test(sql)) return { rows: invoice?.status === "issued" ? [invoice] : [] };
  if (/SELECT \*\s+FROM sessions/.test(sql)) return { rows: [session] };
  if (/SELECT payload FROM post_payment_outbox/.test(sql)) return { rows: snapshot ? [{ payload: snapshot }] : [] };
  if (/SELECT s.id\s+FROM sessions/.test(sql)) { batchSql = sql; return { rows: [] }; }
  if (/INSERT INTO invoices/.test(sql)) {
    if (sql.includes("'skipped'")) {
      if (invoice?.status === "issued") return { rows: [] };
      invoice = { id: "unit-invoice", status: "skipped", error_message: params[2] };
    } else invoice = { id: "unit-invoice", status: "processing" };
    return { rows: [invoice] };
  }
  if (/UPDATE invoices/.test(sql) && sql.includes("status = 'issued'")) {
    invoice = { ...invoice, status: "issued", invoice_number: params[3] }; return { rows: [invoice] };
  }
  if (/UPDATE sessions/.test(sql)) return { rows: [] };
  throw new Error("Unexpected database operation in invoice unit test");
};
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(String(url), "https://www.szamlazz.hu/szamla/");
  const xml = await options.body.get("action-xmlagentxmlfile").text();
  assert.ok(xml.includes("unit-test-agent-not-real"));
  providerCalls++;
  return new Response("<xmlszamlavalasz><sikeres>true</sikeres><szamlaszam>UNIT-1</szamlaszam></xmlszamlavalasz>", {
    status: 200, headers: { "content-type": "application/xml", szlahu_szamlaszam: "UNIT-1" }
  });
};
try {
  reset(); session.stripe_session_id = "cs_test_old";
  assert.equal((await createInvoiceForPaidSession({ session })).error_message, TEST_INVOICE_EXCLUSION);
  assert.equal(providerCalls, 0);
  assert.equal((await createInvoiceForSessionId(session.id)).status, "skipped", "Manual retries must use the same guard");
  assert.equal(providerCalls, 0);

  reset();
  assert.equal((await createInvoiceForPaidSession({ session, checkoutSession: { ...liveCheckout, livemode: false } })).status, "skipped");
  assert.equal(providerCalls, 0);

  reset(); snapshot = { ...liveCheckout, id: "cs_test_cached", livemode: undefined };
  assert.equal((await createInvoiceForPaidSession({ session })).error_message, TEST_INVOICE_EXCLUSION);
  assert.equal(providerCalls, 0);

  for (const checkout of [{ ...liveCheckout, livemode: undefined }, { ...liveCheckout, metadata: {} }, { ...liveCheckout, payment_status: "unpaid" }]) {
    reset();
    await assert.rejects(createInvoiceForPaidSession({ session, checkoutSession: checkout }),
      error => error.message === "INVOICE_LIVE_PAYMENT_UNVERIFIED" && error.terminal);
    assert.equal(providerCalls, 0);
  }
  reset(); session.stripe_session_id = null;
  await assert.rejects(createInvoiceForPaidSession({ session }), /INVOICE_LIVE_PAYMENT_UNVERIFIED/);
  assert.equal(providerCalls, 0);

  reset(); session.stripe_session_id = "cs_test_already_issued";
  invoice = { id: "existing", status: "issued", invoice_number: "KEEP-1" };
  assert.equal((await createInvoiceForPaidSession({ session })).invoice_number, "KEEP-1");
  assert.equal(providerCalls, 0);

  reset();
  assert.equal((await createInvoiceForPaidSession({ session, checkoutSession: liveCheckout })).status, "issued");
  assert.equal(providerCalls, 1, "Verified live purchase must still be invoiceable");
  await createInvoiceForPaidSession({ session, checkoutSession: liveCheckout });
  assert.equal(providerCalls, 1, "An issued invoice must not be issued again");

  reset(); await retryInvoicesBatch();
  assert.ok(batchSql.includes("LEFT(s.stripe_session_id, 8) = 'cs_live_'"));
  assert.ok(batchSql.includes("STRIPE_TEST_PAYMENT_EXCLUDED"));
  assert.ok(batchSql.includes("o.payload->>'livemode' = 'false'"));
  assert.equal(providerCalls, 0);
  console.log("Invoice payment guard passed: test IDs/modes, manual retries, cached snapshots, unknown evidence, paid live issuance, idempotency and recovery selection.");
} finally {
  globalThis.fetch = originalFetch;
  await db.close();
}

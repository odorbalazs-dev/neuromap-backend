import assert from "node:assert/strict";
import fs from "node:fs";
process.env.NODE_ENV = "test";
for (const [key, value] of Object.entries({ OPENAI_API_KEY: "test-openai", STRIPE_SECRET_KEY: "sk_test_placeholder", STRIPE_WEBHOOK_SECRET: "whsec_test", RESEND_API_KEY: "re_test", EMAIL_FROM: "test@example.com", APP_URL: "https://example.com", SUCCESS_URL: "https://example.com/success", CANCEL_URL: "https://example.com/cancel" })) process.env[key] = value;
const { renderLegalPage } = await import("../src/services/legal-pages.service.js");
const { buildCustomerStatus } = await import("../src/api/controllers/session.controller.js");
for (const lang of ["hu", "en", "de", "it", "es", "fr", "pt", "pl", "ja", "zh", "ar"]) {
  for (const kind of ["privacy", "terms", "support"]) {
    const page = renderLegalPage(kind, lang);
    assert.ok(page.includes(`lang="${lang}"`));
    assert.ok(page.includes("NeuroMapKids Hungary Kft."));
    assert.ok(page.includes("Falk Miksa"));
    assert.ok(!page.includes("undefined"));
    assert.ok(!page.includes("<script"));
  }
}
assert.ok(!renderLegalPage("privacy", '<script>alert(1)</script>').includes("alert(1)"));
const session = {id:"test", payment_status:"paid", analysis_status:"done", report_email_status:"sending", pdf_status:"pending"};
assert.equal(buildCustomerStatus(session).stages[2].state,"pending");
assert.equal(buildCustomerStatus(session).stages[3].state,"pending");
assert.equal(buildCustomerStatus({...session,pdf_status:"generating"}).stages[2].state,"active");
assert.equal(buildCustomerStatus({...session,pdf_status:"ready",report_email_status:"failed"}).stages[2].state,"complete");
assert.equal(buildCustomerStatus({...session,pdf_status:"failed"}).overall,"attention");
assert.equal(buildCustomerStatus({...session,pdf_status:"ready",report_email_status:"sent"}).overall,"sent");
const analysis=fs.readFileSync("src/services/analysis.service.js","utf8");
assert.ok(/responses\.create\(\{[^}]*\bstore:\s*false/s.test(analysis), "Responses requests must disable application state storage");
const head=fs.readFileSync("web/landing-head.html","utf8");
assert.ok(head.includes('analytics_storage: "denied"'));
assert.ok(!/https:\/\/(www\.)?(googletagmanager|google-analytics|facebook|tiktok)/.test(head));
console.log("Go-live unit checks passed: 33 legal pages, independent PDF states, AI storage, head privacy defaults.");

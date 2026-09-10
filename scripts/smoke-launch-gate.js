process.env.OPENAI_API_KEY ||= "test-openai-key";
process.env.STRIPE_SECRET_KEY ||= "sk_test_launch_gate";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_launch_gate";
process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.EMAIL_FROM ||= "NeuroMap Kids <test@example.com>";
process.env.SUCCESS_URL ||= "https://example.com/success";
process.env.CANCEL_URL ||= "https://example.com/cancel";
process.env.APP_URL ||= "https://example.com";

const {
  assertCheckoutLaunchReady,
  getLaunchGateStatus,
  LaunchGateError
} = await import("../src/services/launch-gate.service.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectBlocked(runtimeEnv, expectedMissing) {
  try {
    assertCheckoutLaunchReady(runtimeEnv);
    throw new Error("Expected checkout launch gate to block");
  } catch (error) {
    assert(error instanceof LaunchGateError, "Expected LaunchGateError");
    assert(
      error.missing.includes(expectedMissing),
      `Expected missing launch check: ${expectedMissing}`
    );
  }
}

const incompleteProductionEnv = {
  NODE_ENV: "production",
  LAUNCH_GATE_ENFORCED: false,
  PRODUCTION_CHECKOUT_ENABLED: true,
  PRIVACY_POLICY_VERSION: "test",
  TERMS_VERSION: "test",
  CONSENT_POLICY_VERSION: "test"
};

const incompleteStatus = getLaunchGateStatus(incompleteProductionEnv);
assert(!incompleteStatus.ready, "Incomplete approvals must remain visible");
assert(incompleteStatus.enforced, "Production must always enforce the launch gate");
assert(incompleteStatus.blocking, "Incomplete production configuration must block checkout");
expectBlocked(incompleteProductionEnv, "legal_review");
assertCheckoutLaunchReady({ ...incompleteProductionEnv, NODE_ENV: "test" });

expectBlocked(
  { ...incompleteProductionEnv, PRODUCTION_CHECKOUT_ENABLED: false },
  "production_checkout"
);
expectBlocked(
  { ...incompleteProductionEnv, LAUNCH_GATE_ENFORCED: true },
  "legal_review"
);

const readyEnv = {
  TAX_CONFIGURATION_APPROVED: true,
  TAX_CONFIGURATION_EVIDENCE: 'synthetic-tax-review-001',
  PAYMENT_REVIEW_OWNER: 'fixture@example.invalid',
  INVOICE_TAX_POLICY_JSON: JSON.stringify({ '*': { vatRate: '27' } }),
  ...incompleteProductionEnv,
  LAUNCH_GATE_ENFORCED: true,
  LEGAL_REVIEW_APPROVED: true,
  LEGAL_REVIEW_EVIDENCE: "review-legal-001",
  DPIA_APPROVED: true,
  DPIA_EVIDENCE: "review-dpia-001",
  CLINICAL_CONTENT_REVIEW_APPROVED: true,
  CLINICAL_CONTENT_REVIEW_EVIDENCE: "review-clinical-001",
  PRIVACY_POLICY_PUBLISHED: true,
  PRIVACY_POLICY_EVIDENCE: "https://example.com/privacy",
  TERMS_PUBLISHED: true,
  TERMS_EVIDENCE: "https://example.com/terms",
  CONSENT_MANAGER_CONFIGURED: true,
  CONSENT_MANAGER_EVIDENCE: "review-consent-001",
  VENDOR_DPA_REVIEWED: true,
  VENDOR_DPA_EVIDENCE: "review-vendors-001",
  SECURITY_REVIEW_APPROVED: true,
  SECURITY_REVIEW_EVIDENCE: "review-security-001",
  PRIVACY_POLICY_URL: "https://example.com/privacy",
  TERMS_URL: "https://example.com/terms",
  DATA_CONTROLLER_NAME: "Example Ltd.",
  DATA_CONTROLLER_ADDRESS: "Example address",
  DATA_CONTROLLER_COUNTRY: "HU",
  PRIVACY_CONTACT_EMAIL: "privacy@example.com",
  SUPERVISORY_AUTHORITY_NAME: "Example authority",
  SUPERVISORY_AUTHORITY_URL: "https://example.com/authority"
};

const readyStatus = getLaunchGateStatus(readyEnv);
assert(readyStatus.ready, `Strict gate should be ready: ${readyStatus.missing.join(", ")}`);
assert(!readyStatus.blocking, "Ready strict gate must allow checkout");
assertCheckoutLaunchReady(readyEnv);
expectBlocked({ ...readyEnv, TAX_CONFIGURATION_APPROVED: false }, 'tax_configuration');
expectBlocked({ ...readyEnv, INVOICE_TAX_POLICY_JSON: '{"HU":{"vatRate":"27"}}' }, 'tax_country_coverage');
expectBlocked({ ...readyEnv, INVOICE_TAX_POLICY_JSON: '{"*":{"vatRate":"invalid"}}' }, 'tax_policy');

console.log("Launch gate smoke test passed.");

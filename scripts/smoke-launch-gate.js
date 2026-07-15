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

const advisoryEnv = {
  NODE_ENV: "production",
  LAUNCH_GATE_ENFORCED: false,
  PRODUCTION_CHECKOUT_ENABLED: true,
  PRIVACY_POLICY_VERSION: "test",
  TERMS_VERSION: "test",
  CONSENT_POLICY_VERSION: "test"
};

const advisoryStatus = getLaunchGateStatus(advisoryEnv);
assert(!advisoryStatus.ready, "Incomplete approvals must remain visible");
assert(!advisoryStatus.blocking, "Advisory approvals must not silently block checkout");
assertCheckoutLaunchReady(advisoryEnv);

expectBlocked(
  { ...advisoryEnv, PRODUCTION_CHECKOUT_ENABLED: false },
  "production_checkout"
);
expectBlocked(
  { ...advisoryEnv, LAUNCH_GATE_ENFORCED: true },
  "legal_review"
);

const readyEnv = {
  ...advisoryEnv,
  LAUNCH_GATE_ENFORCED: true,
  LEGAL_REVIEW_APPROVED: true,
  DPIA_APPROVED: true,
  CLINICAL_CONTENT_REVIEW_APPROVED: true,
  PRIVACY_POLICY_PUBLISHED: true,
  TERMS_PUBLISHED: true,
  CONSENT_MANAGER_CONFIGURED: true,
  VENDOR_DPA_REVIEWED: true,
  SECURITY_REVIEW_APPROVED: true,
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

console.log("Launch gate smoke test passed.");

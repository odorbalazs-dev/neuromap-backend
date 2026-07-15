import { env } from "../config/env.js";

const REQUIRED_APPROVALS = [
  ["legal_review", "LEGAL_REVIEW_APPROVED"],
  ["dpia", "DPIA_APPROVED"],
  ["clinical_content_review", "CLINICAL_CONTENT_REVIEW_APPROVED"],
  ["privacy_policy", "PRIVACY_POLICY_PUBLISHED"],
  ["terms", "TERMS_PUBLISHED"],
  ["consent_manager", "CONSENT_MANAGER_CONFIGURED"],
  ["vendor_dpa", "VENDOR_DPA_REVIEWED"],
  ["security_review", "SECURITY_REVIEW_APPROVED"],
  ["production_checkout", "PRODUCTION_CHECKOUT_ENABLED"]
];

export class LaunchGateError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = "LaunchGateError";
    this.missing = missing;
  }
}

export function getLaunchGateStatus() {
  const checks = Object.fromEntries(
    REQUIRED_APPROVALS.map(([name, envKey]) => [name, env[envKey] === true])
  );
  const missing = Object.entries(checks)
    .filter(([, ready]) => !ready)
    .map(([name]) => name);

  const policyConfigurationReady = Boolean(
    env.PRIVACY_POLICY_URL &&
    env.TERMS_URL &&
    env.PRIVACY_POLICY_VERSION &&
    env.TERMS_VERSION &&
    env.CONSENT_POLICY_VERSION &&
    env.DATA_CONTROLLER_NAME &&
    env.DATA_CONTROLLER_ADDRESS &&
    env.DATA_CONTROLLER_COUNTRY &&
    env.PRIVACY_CONTACT_EMAIL &&
    env.SUPERVISORY_AUTHORITY_NAME &&
    env.SUPERVISORY_AUTHORITY_URL
  );
  if (!policyConfigurationReady) missing.push("policy_configuration");

  return {
    ready: missing.length === 0,
    checks: { ...checks, policy_configuration: policyConfigurationReady },
    missing
  };
}

export function assertCheckoutLaunchReady() {
  if (env.NODE_ENV !== "production") return true;
  const status = getLaunchGateStatus();
  if (!status.ready) {
    throw new LaunchGateError("Checkout is temporarily unavailable.", status.missing);
  }
  return true;
}

export function assertCurrentPolicyAcceptance(consent = {}) {
  const missing = [];
  if (consent.privacyPolicyVersion !== env.PRIVACY_POLICY_VERSION) {
    missing.push("privacy_policy_version");
  }
  if (consent.termsVersion !== env.TERMS_VERSION) {
    missing.push("terms_version");
  }
  if (consent.consentPolicyVersion !== env.CONSENT_POLICY_VERSION) {
    missing.push("consent_policy_version");
  }
  if (missing.length) {
    throw new LaunchGateError("The legal terms have changed. Please review and accept them again.", missing);
  }
  return true;
}

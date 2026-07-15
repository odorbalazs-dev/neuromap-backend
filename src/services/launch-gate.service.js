import { env } from "../config/env.js";

const REQUIRED_APPROVALS = [
  ["legal_review", "LEGAL_REVIEW_APPROVED"],
  ["dpia", "DPIA_APPROVED"],
  ["clinical_content_review", "CLINICAL_CONTENT_REVIEW_APPROVED"],
  ["privacy_policy", "PRIVACY_POLICY_PUBLISHED"],
  ["terms", "TERMS_PUBLISHED"],
  ["consent_manager", "CONSENT_MANAGER_CONFIGURED"],
  ["vendor_dpa", "VENDOR_DPA_REVIEWED"],
  ["security_review", "SECURITY_REVIEW_APPROVED"]
];

let advisoryWarningLogged = false;

export class LaunchGateError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = "LaunchGateError";
    this.missing = missing;
  }
}

export function getLaunchGateStatus(runtimeEnv = env) {
  const checks = Object.fromEntries(
    REQUIRED_APPROVALS.map(([name, envKey]) => [name, runtimeEnv[envKey] === true])
  );

  const checkoutEnabled = runtimeEnv.PRODUCTION_CHECKOUT_ENABLED !== false;
  checks.production_checkout = checkoutEnabled;

  const missing = Object.entries(checks)
    .filter(([, ready]) => !ready)
    .map(([name]) => name);

  const policyConfigurationReady = Boolean(
    runtimeEnv.PRIVACY_POLICY_URL &&
    runtimeEnv.TERMS_URL &&
    runtimeEnv.PRIVACY_POLICY_VERSION &&
    runtimeEnv.TERMS_VERSION &&
    runtimeEnv.CONSENT_POLICY_VERSION &&
    runtimeEnv.DATA_CONTROLLER_NAME &&
    runtimeEnv.DATA_CONTROLLER_ADDRESS &&
    runtimeEnv.DATA_CONTROLLER_COUNTRY &&
    runtimeEnv.PRIVACY_CONTACT_EMAIL &&
    runtimeEnv.SUPERVISORY_AUTHORITY_NAME &&
    runtimeEnv.SUPERVISORY_AUTHORITY_URL
  );
  if (!policyConfigurationReady) missing.push("policy_configuration");

  const enforced = runtimeEnv.LAUNCH_GATE_ENFORCED === true;
  const ready = missing.length === 0;

  return {
    ready,
    enforced,
    checkoutEnabled,
    blocking: !checkoutEnabled || (enforced && !ready),
    checks: { ...checks, policy_configuration: policyConfigurationReady },
    missing
  };
}

export function assertCheckoutLaunchReady(runtimeEnv = env) {
  if (runtimeEnv.NODE_ENV !== "production") return true;

  const status = getLaunchGateStatus(runtimeEnv);

  if (status.blocking) {
    throw new LaunchGateError("Checkout is temporarily unavailable.", status.missing);
  }

  if (!status.ready && !advisoryWarningLogged) {
    advisoryWarningLogged = true;
    console.warn(
      "[launch-gate] Checkout is enabled with outstanding readiness checks:",
      status.missing
    );
  }

  return true;
}

export function assertCurrentPolicyAcceptance(consent = {}, runtimeEnv = env) {
  const missing = [];
  if (consent.privacyPolicyVersion !== runtimeEnv.PRIVACY_POLICY_VERSION) {
    missing.push("privacy_policy_version");
  }
  if (consent.termsVersion !== runtimeEnv.TERMS_VERSION) {
    missing.push("terms_version");
  }
  if (consent.consentPolicyVersion !== runtimeEnv.CONSENT_POLICY_VERSION) {
    missing.push("consent_policy_version");
  }
  if (missing.length) {
    throw new LaunchGateError("The legal terms have changed. Please review and accept them again.", missing);
  }
  return true;
}

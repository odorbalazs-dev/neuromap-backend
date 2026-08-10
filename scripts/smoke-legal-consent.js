import fs from "fs";
import path from "path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const supportedLangs = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

const legalContentSource = read("public/webflow/legal-content.js");
const legalConsentSource = read("public/webflow/legal-consent.js");
const engineSource = read("public/webflow/engine.js");
const checkoutPagesSource = read("public/webflow/checkout-pages.js");

supportedLangs.forEach((lang) => {
  assert(
    legalContentSource.includes(`${lang}: {`),
    `Missing legal content locale: ${lang}`
  );
});

[
  "privacyTitle",
  "termsTitle",
  "withdraw",
  "optional",
  "required"
].forEach((key) => {
  assert(legalContentSource.includes(key), `Missing legal content key: ${key}`);
});

[
  "9(2)(a)",
  "explicit consent",
  "not a diagnosis",
  "analytics"
].forEach((phrase) => {
  assert(
    legalContentSource.toLowerCase().includes(phrase.toLowerCase()),
    `Missing legal content phrase: ${phrase}`
  );
});

assert(
  legalConsentSource.includes('ad_storage: "denied"') &&
    legalConsentSource.includes('analytics_storage: "denied"') &&
    legalConsentSource.includes('ad_user_data: "denied"') &&
    legalConsentSource.includes('ad_personalization: "denied"'),
  "Consent Mode default denied settings are missing"
);

assert(
  legalConsentSource.includes("window.NM_LEGAL") &&
    legalConsentSource.includes("/legal/consent") &&
    legalConsentSource.includes("/legal/config") &&
    legalConsentSource.includes("/legal/privacy-requests") &&
    legalConsentSource.includes("showPrivacyRights") &&
    legalConsentSource.includes("openPrivacyRights"),
  "Legal consent manager API wiring is incomplete"
);

assert(
  engineSource.includes("20260810-checkout-payload-v1") &&
    engineSource.includes("ensureLegalConsentForCurrentLanguage") &&
    engineSource.includes("consentReceipt.token") &&
    engineSource.includes("sanitizeAnalyticsPayload"),
  "Engine legal consent integration is incomplete"
);

[
  "detected_risk",
  "secondary_risk",
  "specific_profile",
  "normalized_average",
  "severity"
].forEach((forbidden) => {
  const checkoutStartedIndex = engineSource.indexOf('trackSchemaEvent("nm_checkout_started"');
  const checkoutStartedBlock = checkoutStartedIndex >= 0
    ? engineSource.slice(checkoutStartedIndex, checkoutStartedIndex + 500)
    : "";

  assert(
    !checkoutStartedBlock.includes(forbidden),
    `Checkout started analytics still includes sensitive field: ${forbidden}`
  );
});

assert(
  checkoutPagesSource.includes("20260715-gdpr-checkout-v1") &&
    checkoutPagesSource.includes("isAnalyticsAllowed") &&
    checkoutPagesSource.includes("sanitizeCheckoutAnalyticsPayload") &&
    checkoutPagesSource.includes("installPrivacyDefaults();"),
  "Checkout pages privacy integration is incomplete"
);

[
  "page_url: window.location.href",
  "page_path: window.location.pathname",
  "client_session_id: getClientSessionId()",
  "checkout_session_id: sessionId",
  "session_id: sessionId",
  "getCampaignAnalyticsFields()"
].forEach((forbidden) => {
  assert(
    !checkoutPagesSource.includes(forbidden),
    `Checkout pages analytics still contains forbidden data source: ${forbidden}`
  );
});

console.log("[smoke:legal-consent] OK");

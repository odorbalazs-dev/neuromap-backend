import fs from "fs";
import path from "path";
import vm from "vm";

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

const legalContext = { window: {} };
vm.createContext(legalContext);
vm.runInContext(legalContentSource, legalContext);

const legalContent = legalContext.window.NM_LEGAL_CONTENT;

assert(
  legalContent && typeof legalContent === "object",
  "Legal content bundle did not expose NM_LEGAL_CONTENT"
);

const requiredUiKeys = [
  "termsTitle",
  "privacyTitle",
  "readAll",
  "back",
  "continue",
  "accept",
  "close",
  "withdraw",
  "optional",
  "required",
  "legalLinks",
  "termsLink",
  "privacyLink"
];

supportedLangs.forEach((lang) => {
  const locale = legalContent[lang];
  assert(locale && typeof locale === "object", `Missing evaluated legal locale: ${lang}`);
  assert(locale.terms.length === 11, `${lang} terms must contain 11 sections`);
  assert(locale.privacy.length === 16, `${lang} privacy notice must contain 16 sections`);
  assert(locale.termsChecks.length === 3, `${lang} terms must contain 3 acknowledgements`);
  assert(locale.privacyChecks.length === 2, `${lang} privacy notice must contain 2 consents`);

  requiredUiKeys.forEach((key) => {
    assert(
      typeof locale.ui[key] === "string" && locale.ui[key].trim().length > 0,
      `${lang} legal UI is missing: ${key}`
    );
  });

  [...locale.terms, ...locale.privacy].forEach((section, index) => {
    assert(
      Array.isArray(section) &&
        section.length === 2 &&
        section.every((value) => typeof value === "string" && value.trim().length > 0),
      `${lang} legal section ${index + 1} is incomplete`
    );
  });

  if (lang !== "en") {
    assert(
      locale.ui.privacyTitle !== legalContent.en.ui.privacyTitle &&
        locale.terms[0][1] !== legalContent.en.terms[0][1],
      `${lang} legal content unexpectedly falls back to English`
    );
  }
});

[legalContentSource, legalConsentSource, engineSource, checkoutPagesSource].forEach(
  (source, index) => {
    ["\uFFFD", "Ã©", "Ã¡", "Ã¼", "Â ", "Â\u00a0", "â€", "ðŸ"].forEach((fragment) => {
      assert(
        !source.includes(fragment),
        `Legal/frontend source ${index + 1} contains a broken encoding marker: ${fragment}`
      );
    });
  }
);

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
  legalConsentSource.includes('role="dialog"') &&
    legalConsentSource.includes('aria-modal="true"') &&
    legalConsentSource.includes('event.key === "Escape"') &&
    legalConsentSource.includes('event.key !== "Tab"') &&
    legalConsentSource.includes("restoreFocusTarget"),
  "Legal consent dialogs must trap focus, support Escape, and restore focus"
);

assert(
  legalConsentSource.includes("installReadGate") &&
    legalConsentSource.includes("termsScrollCompleted: termsResult.termsScrollCompleted === true") &&
    legalConsentSource.includes("privacyScrollCompleted: isReadComplete()") &&
    legalConsentSource.includes('data-action="cancel"'),
  "Legal consent must record actual reading completion and retain an explicit decline path"
);

assert(
  legalConsentSource.includes(".nm-legal-form-scroll") &&
    legalConsentSource.includes("height: 100dvh") &&
    legalConsentSource.includes("overscroll-behavior: contain") &&
    legalConsentSource.includes("-webkit-overflow-scrolling: touch") &&
    legalConsentSource.includes('@media (max-height: 560px)') &&
    legalConsentSource.includes('const LEGAL_UI_VERSION = "20260814-mobile-scroll-v2"') &&
    legalConsentSource.includes('const CONTENT_VERSION = "20260726-verified-rights-v3"') &&
    engineSource.includes('20260814-mobile-scroll-v2'),
  "Legal consent must remain scrollable with visible actions on mobile and short viewports"
);

assert(
  legalConsentSource.includes("/verify") &&
    legalConsentSource.includes('data-verification-code') &&
    legalConsentSource.includes("x-privacy-request-token") &&
    legalConsentSource.includes("20260726-verified-rights-v3"),
  "Verified privacy-rights workflow or legal version marker is incomplete"
);

assert(
  engineSource.includes("20260814-legal-mobile-v2") &&
    engineSource.includes("isCompatibleLegalManager") &&
    engineSource.includes('String(manager.version || "") === LEGAL_CONSENT_VERSION') &&
    engineSource.includes("const forceReload = Boolean(window.NM_LEGAL)") &&
    engineSource.includes("ensureLegalConsentForCurrentLanguage") &&
    engineSource.includes("consentReceipt.token") &&
    engineSource.includes("sanitizeAnalyticsPayload") &&
    engineSource.includes("requestPurchaseConfirmations") &&
    engineSource.includes("digitalPerformanceRequested: true") &&
    engineSource.includes("withdrawalRightAcknowledged: true"),
  "Engine legal consent integration is incomplete"
);

assert(
  engineSource.indexOf("ensureLegalConsentForCurrentLanguage") !==
    engineSource.indexOf("requestPurchaseConfirmations") &&
    engineSource.includes("const purchaseConfirmations = await requestPurchaseConfirmations()"),
  "Purchase confirmations must remain a separate, just-in-time checkout step"
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
  checkoutPagesSource.includes("20260812-status-truth-v2") &&
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

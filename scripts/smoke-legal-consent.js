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
  "privacyLink",
  "versionLabel",
  "effectiveDateLabel",
  "retentionLabel",
  "retentionDaysUnit"
];

supportedLangs.forEach((lang) => {
  const locale = legalContent[lang];
  assert(locale && typeof locale === "object", `Missing evaluated legal locale: ${lang}`);
  assert(locale.terms.length === 12, `${lang} terms must contain 12 sections`);
  assert(locale.terms[5][1].includes('Link') && locale.privacy[7][1].includes('Backblaze'), `${lang} payment and backup roles must be disclosed`);
  assert(locale.terms[11][1].includes('https://support.link.com/topics/sold-through-link'), `${lang} transaction support is missing`);
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
    legalConsentSource.includes('const LEGAL_UI_VERSION = "20261006-public-legal-v5"') &&
    legalConsentSource.includes('const CONTENT_VERSION = "20261006-legal-retention-v2"') &&
    engineSource.includes('20261006-public-legal-v5'),
  "Legal consent must remain scrollable with visible actions on mobile and short viewports"
);

assert(
  legalConsentSource.includes("/verify") &&
    legalConsentSource.includes('data-verification-code') &&
    legalConsentSource.includes("x-privacy-request-token") &&
    legalConsentSource.includes("20261006-legal-retention-v2"),
  "Verified privacy-rights workflow or legal version marker is incomplete"
);

assert(
  engineSource.includes("20261006-public-legal-v5") &&
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
  checkoutPagesSource.includes("20261006-managed-failure-v2") &&
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

const retentionStart = legalConsentSource.indexOf('  function privacyRetentionMarkup(');
const retentionEnd = legalConsentSource.indexOf('  function sectionMarkup(', retentionStart);
assert(retentionStart >= 0 && retentionEnd > retentionStart, 'Retention renderer must be testable');
const retentionContext = vm.createContext({
  getContent: lang => legalContent[lang],
  escapeHtml: value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
});
vm.runInContext(legalConsentSource.slice(retentionStart, retentionEnd), retentionContext);
for (const lang of supportedLangs) {
  const markup = vm.runInContext(`privacyRetentionMarkup({retentionDays: 123}, '${lang}')`, retentionContext);
  assert(markup.includes(`${legalContent[lang].ui.retentionLabel}: 123 ${legalContent[lang].ui.retentionDaysUnit}`), `${lang}: modal retention label/unit missing`);
}
const escapedRetention = vm.runInContext("privacyRetentionMarkup({retentionDays: '<script>'}, 'hu')", retentionContext);
assert(escapedRetention.includes('&lt;script&gt;') && !escapedRetention.includes('<script>'), 'Retention metadata must be escaped');
assert(legalConsentSource.includes('${privacyRetentionMarkup(config, lang)}${sectionMarkup(content.privacy)}'), 'Retention must remain in the scrollable privacy body on short screens');
const launcherStart = legalConsentSource.indexOf('  async function installLauncher(');
const launcherEnd = legalConsentSource.indexOf('  function getReceipt()', launcherStart);
assert(launcherStart >= 0 && launcherEnd > launcherStart, 'Legal launcher must load content independently of purchase');
let navigationButton;
let staleMenuRemoved = false;
const launcherContext = vm.createContext({
  ensureContent: async () => {}, normalizeLang: lang => lang, installStyles() {},
  getContent: lang => legalContent[lang], privacyRightsUi: () => ({menu:'Rights'}),
  document: {
    getElementById: id => id === 'nmLegalLauncher' ? navigationButton : id === 'nmLegalMenu' ? {remove() {staleMenuRemoved=true;}} : null,
    createElement: () => ({}), body: {appendChild(button) {navigationButton=button;}}
  }
});
vm.runInContext(legalConsentSource.slice(launcherStart, launcherEnd), launcherContext);
for (const lang of supportedLangs) {
  await vm.runInContext(`installLauncher('${lang}')`, launcherContext);
  assert(navigationButton.textContent === legalContent[lang].ui.legalLinks, `${lang}: public legal launcher must follow selected language`);
}
assert(staleMenuRemoved, 'An open menu must not keep stale-language labels');
assert(engineSource.includes('await legalManager.installLauncher(state.lang);'), 'Closed checkout must not prevent legal navigation at startup');
console.log("[smoke:legal-consent] OK");

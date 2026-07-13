export const OFFER_VERSION = "2026-07-two-tier-v1";
export const DEFAULT_PACKAGE_CODE = "standard_v1";

const PACKAGE_CATALOG = Object.freeze({
  legacy_500_v1: Object.freeze({
    code: "legacy_500_v1",
    offerVersion: "legacy",
    currency: "usd",
    unitAmount: 500,
    analyticsValue: 5,
    stripePriceEnv: null,
    selectable: false,
    entitlements: Object.freeze({
      reportPdf: true,
      shareableObservationSummary: false,
      situationActionPlans: false,
      educationConversationGuide: false,
      observationDiary14Days: false,
      diaryReminderEmails: false,
      trendFollowUpReport: false,
      nearbyProfessionalSearch: false
    })
  }),
  standard_v1: Object.freeze({
    code: "standard_v1",
    offerVersion: OFFER_VERSION,
    currency: "usd",
    unitAmount: 799,
    analyticsValue: 7.99,
    stripePriceEnv: "STRIPE_PRICE_STANDARD_USD",
    entitlements: Object.freeze({
      reportPdf: true,
      shareableObservationSummary: false,
      situationActionPlans: false,
      educationConversationGuide: false,
      observationDiary14Days: false,
      diaryReminderEmails: false,
      trendFollowUpReport: false,
      nearbyProfessionalSearch: false
    })
  }),
  plus_v1: Object.freeze({
    code: "plus_v1",
    offerVersion: OFFER_VERSION,
    currency: "usd",
    unitAmount: 999,
    analyticsValue: 9.99,
    stripePriceEnv: "STRIPE_PRICE_PLUS_USD",
    entitlements: Object.freeze({
      reportPdf: true,
      shareableObservationSummary: true,
      situationActionPlans: true,
      educationConversationGuide: true,
      observationDiary14Days: true,
      diaryReminderEmails: true,
      trendFollowUpReport: true,
      nearbyProfessionalSearch: true
    })
  })
});

export function listProductPackages() {
  return Object.values(PACKAGE_CATALOG)
    .filter((productPackage) => productPackage.selectable !== false)
    .map(clonePackage);
}

export function isValidPackageCode(value) {
  return (
    typeof value === "string" &&
    Object.hasOwn(PACKAGE_CATALOG, value) &&
    PACKAGE_CATALOG[value].selectable !== false
  );
}

export function normalizePackageCode(value, { defaultIfMissing = true } = {}) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!normalized && defaultIfMissing) return DEFAULT_PACKAGE_CODE;
  return isValidPackageCode(normalized) ? normalized : null;
}

export function getProductPackage(value = DEFAULT_PACKAGE_CODE) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  const code = Object.hasOwn(PACKAGE_CATALOG, normalized)
    ? normalized
    : normalizePackageCode(value);

  if (!code) {
    throw new Error(`Unsupported package code: ${String(value || "<empty>")}`);
  }

  return clonePackage(PACKAGE_CATALOG[code]);
}

export function getPackageSnapshot(value = DEFAULT_PACKAGE_CODE) {
  const productPackage = getProductPackage(value);

  return {
    packageCode: productPackage.code,
    offerVersion: productPackage.offerVersion,
    amountTotal: productPackage.unitAmount,
    currency: productPackage.currency,
    entitlements: productPackage.entitlements
  };
}

export function assertCheckoutMatchesPackage(checkoutSession, productPackage) {
  const amountTotal = Number(checkoutSession?.amount_total);
  const currency = String(checkoutSession?.currency || "").toLowerCase();

  if (!Number.isInteger(amountTotal) || amountTotal !== productPackage.unitAmount) {
    throw new Error(
      `Stripe amount mismatch for ${productPackage.code}: expected ${productPackage.unitAmount}, received ${String(checkoutSession?.amount_total)}`
    );
  }

  if (currency !== productPackage.currency) {
    throw new Error(
      `Stripe currency mismatch for ${productPackage.code}: expected ${productPackage.currency}, received ${currency || "<empty>"}`
    );
  }

  return true;
}

function clonePackage(productPackage) {
  return {
    ...productPackage,
    entitlements: { ...productPackage.entitlements }
  };
}

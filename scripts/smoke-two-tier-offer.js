import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertCheckoutMatchesPackage,
  getPackageSnapshot,
  getProductPackage,
  listProductPackages,
  normalizePackageCode
} from "../src/config/products.js";
import { buildObservationTrend } from "../src/utils/observationTrend.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrow(callback, message) {
  let threw = false;
  try {
    callback();
  } catch (_error) {
    threw = true;
  }
  assert(threw, message);
}

function verifyCatalog() {
  const packages = listProductPackages();
  const standard = getProductPackage("standard_v1");
  const plus = getProductPackage("plus_v1");

  assert(packages.length === 2, "Exactly two selectable packages should be exposed.");
  assert(standard.unitAmount === 799, "Standard must cost 799 cents.");
  assert(plus.unitAmount === 999, "Plus must cost 999 cents.");
  assert(standard.currency === "usd" && plus.currency === "usd", "Both packages must use USD.");
  assert(standard.entitlements.reportPdf, "Standard must include the report PDF.");
  assert(!standard.entitlements.observationDiary14Days, "Standard must not include the Plus diary.");
  assert(!standard.entitlements.nearbyProfessionalSearch, "Standard must not include the Plus professional search aid.");
  assert(plus.entitlements.observationDiary14Days, "Plus must include the 14-day diary.");
  assert(plus.entitlements.trendFollowUpReport, "Plus must include the trend follow-up.");
  assert(plus.entitlements.nearbyProfessionalSearch, "Plus must include the professional search aid.");
  assert(normalizePackageCode(undefined) === "standard_v1", "Missing package must safely default to Standard.");
  assert(normalizePackageCode("plus_v1") === "plus_v1", "Plus package code must remain unchanged.");
  assert(normalizePackageCode("custom_price") === null, "Unknown package codes must be rejected.");

  const snapshot = getPackageSnapshot("plus_v1");
  assert(snapshot.amountTotal === 999 && snapshot.packageCode === "plus_v1", "Package snapshots must preserve price and code.");
  assertCheckoutMatchesPackage({ amount_total: 799, currency: "USD" }, standard);
  expectThrow(
    () => assertCheckoutMatchesPackage({ amount_total: 999, currency: "usd" }, standard),
    "A Stripe amount mismatch must fail closed."
  );
}

function verifyLandingContract() {
  const engine = fs.readFileSync(path.join(root, "public", "webflow", "engine.js"), "utf8");
  const draftStart = engine.indexOf("function saveDraft(");
  const draftEnd = engine.indexOf("function restoreDraft(", draftStart);
  const draftBlock = draftStart >= 0 && draftEnd > draftStart
    ? engine.slice(draftStart, draftEnd)
    : "";

  assert(engine.includes('data-nm-package-selector="landing"'), "Landing must include a dedicated package selector.");
  assert(engine.includes('data-nm-package-section'), "Landing package choice must be separated from the hero.");
  assert(engine.includes('simplifyLandingHero'), "Landing must suppress repeated hero proof content.");
  assert(engine.includes('buildPackageSelectorHtml("summary")'), "Summary must include a package selector.");
  assert(engine.includes('packageCode: normalizeClientPackageCode(state.packageCode)'), "Checkout payload must contain the selected package code.");
  assert(engine.includes('localStorage.setItem(PACKAGE_STORAGE_KEY, nextCode)'), "Landing package selection must persist across questionnaire steps.");
  assert(engine.includes('element.dataset.nmPackageSelectorBound'), "Package cards must use a stable delegated click handler.");
  assert(engine.includes('element.dataset.nmPackageRenderKey'), "Landing rescue must not replace unchanged package cards.");
  assert(engine.includes('if (landingRescueInProgress) return 0;'), "Landing rescue must ignore overlapping rescue passes.");
  assert(!engine.includes('new MutationObserver('), "Landing must not keep a permanent DOM observer alive.");
  assert(engine.includes('[80, 300, 800].forEach'), "Landing rescue must use a short, bounded recovery schedule.");
  assert(engine.includes('readStoredPackageCode() || draft.packageCode'), "A direct package choice must win over an older questionnaire draft.");
  assert(engine.includes('window.sessionStorage.setItem(DRAFT_STORAGE_KEY'), "Questionnaire drafts must stay in the current browser tab.");
  assert(engine.includes('const DRAFT_TTL_MS = 1000 * 60 * 60 * 4'), "Questionnaire drafts must expire after four hours.");
  assert(!engine.includes('localStorage.setItem(DRAFT_STORAGE_KEY'), "Questionnaire answers must not be persisted in localStorage.");
  assert(draftBlock && !draftBlock.includes('name:'), "Questionnaire drafts must not persist the customer name.");
  assert(draftBlock && !draftBlock.includes('email:'), "Questionnaire drafts must not persist the customer email.");
  assert(engine.includes('window.NM_SET_SELECTED_PACKAGE'), "Package selection must expose a browser diagnostic API.");
  assert(engine.includes('standard_v1') && engine.includes('plus_v1'), "Landing must expose Standard and Plus.");
}

function verifyTrendContract() {
  const improving = buildObservationTrend([
    { entryDate: "2026-07-01", context: "morning", signalLevel: 3, strategyUsed: false },
    { entryDate: "2026-07-02", context: "morning", signalLevel: 3, strategyUsed: true },
    { entryDate: "2026-07-03", context: "morning", signalLevel: 1, strategyUsed: true },
    { entryDate: "2026-07-04", context: "morning", signalLevel: 1, strategyUsed: true }
  ]);

  assert(improving.direction === "improving", "A clear reduction must produce an improving trend.");
  assert(improving.completedDays === 4, "Trend must count distinct observation days.");
  assert(improving.strategyUseRate === 0.75, "Trend must calculate support-strategy usage.");

  const insufficient = buildObservationTrend([
    { entryDate: "2026-07-01", context: "other", signalLevel: 2, strategyUsed: false }
  ]);
  assert(insufficient.direction === "insufficient_data", "Short diaries must not claim a trend.");
}

verifyCatalog();
verifyLandingContract();
verifyTrendContract();

console.log("Two-tier offer smoke check passed.");

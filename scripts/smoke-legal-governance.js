import fs from "fs";
import path from "path";

const root = process.cwd();
const languages = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const migration = read("src/db/migrations/019_legal_governance_and_data_subject_rights.sql");
const legalRoutes = read("src/api/routes/legal.js");
const cronRoutes = read("src/api/routes/cron.js");
const legalConsent = read("public/webflow/legal-consent.js");
const engine = read("public/webflow/engine.js");
const dpia = read("docs/DPIA_WORKING_DRAFT.md");
const contractEmail = read("src/templates/contractConfirmationEmail.js");
const dataLifecycle = read("src/services/data-lifecycle.service.js");
const dataGovernance = read("src/services/data-governance.service.js");
const privacyRights = read("src/services/privacy-rights.service.js");
const packageJson = JSON.parse(read("package.json"));

[
  "processing_restricted_at",
  "sensitive_data_erased_at",
  "contract_confirmation_status",
  "CREATE TABLE IF NOT EXISTS privacy_requests",
  "CREATE TABLE IF NOT EXISTS privacy_request_events"
].forEach((marker) => {
  assert(migration.includes(marker), `Missing governance migration marker: ${marker}`);
});

assert(
  legalRoutes.includes("/privacy-requests") &&
    legalRoutes.includes("/privacy-requests/:id"),
  "Privacy rights routes are missing"
);
assert(cronRoutes.includes("/data-lifecycle"), "Data lifecycle cron route is missing");

[
  "/legal/privacy-requests",
  "x-session-token",
  "x-privacy-request-token",
  "showPrivacyRights",
  "openPrivacyRights"
].forEach((marker) => {
  assert(legalConsent.includes(marker), `Missing privacy rights UI marker: ${marker}`);
});

languages.forEach((language) => {
  assert(
    legalConsent.includes(`${language}: {`),
    `Missing privacy-rights locale: ${language}`
  );
});

[
  "Parent / adult purchaser name",
  "Szülő / felnőtt vásárló neve",
  "Name des Elternteils / erwachsenen Käufers"
].forEach((label) => {
  assert(engine.includes(label), `Adult purchaser field is missing label: ${label}`);
});

[
  "CONTROLLER WORKING DRAFT - NOT APPROVED FOR RELIANCE",
  "Risk assessment method",
  "Residual-risk decision",
  "Article 36",
  "Approval record"
].forEach((marker) => {
  assert(dpia.includes(marker), `DPIA is missing required section: ${marker}`);
});

assert(
  dataLifecycle.includes("deletedUnusedConsentReceipts") &&
    dataLifecycle.includes("consent.used_at IS NULL"),
  "Expired unused consent receipts are not covered by lifecycle cleanup"
);
assert(
  dataGovernance.includes("contract_confirmation_provider_id = NULL") &&
    dataGovernance.includes("contract_confirmation_error = NULL"),
  "Erasure does not clear contract-confirmation delivery metadata"
);
assert(
  privacyRights.includes('actorType = "system"') &&
    privacyRights.includes('"data_subject"'),
  "Privacy request audit events do not distinguish system and data-subject actors"
);

[
  "RETENTION_AND_ERASURE_SCHEDULE.md",
  "DATA_SUBJECT_RIGHTS_RUNBOOK.md",
  "RECORD_OF_PROCESSING_ACTIVITIES.md",
  "PERSONAL_DATA_BREACH_RESPONSE_RUNBOOK.md",
  "VENDOR_AND_TRANSFER_REGISTER.md",
  "CONSUMER_RIGHTS_AND_DIGITAL_CONTENT_CHECKLIST.md",
  "LEGAL_RELEASE_SIGNOFF.md"
].forEach((fileName) => {
  assert(
    fs.existsSync(path.join(root, "docs", fileName)),
    `Missing legal governance document: ${fileName}`
  );
});

languages.forEach((language) => {
  assert(
    contractEmail.includes(`${language}: {`),
    `Missing contract-confirmation locale: ${language}`
  );
});

assert(!contractEmail.includes("ï¿½"), "Contract confirmation contains mojibake");
assert(!contractEmail.includes("�"), "Contract confirmation contains replacement characters");
assert(
  packageJson.scripts?.["smoke:legal-governance"],
  "Legal governance smoke script is not registered"
);

console.log("[smoke:legal-governance] OK");

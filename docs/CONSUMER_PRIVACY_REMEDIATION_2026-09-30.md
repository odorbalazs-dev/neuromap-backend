# Consumer And Privacy Remediation - 2026-09-30

Scope: local implementation and synthetic verification. This is not a legal certification, production deployment, provider-contract acceptance or tax approval. Earlier registers describe their dated state, not necessarily the present production state.

## Corrected Defects

| Finding | Correction | Evidence |
|---|---|---|
| Contract emails used current environment policy versions, including when the purchaser accepted an older version | Read the purchaser's consent record and its archived legal_document_revisions row; reject missing/mismatched evidence instead of substituting today's documents | test-contract-evidence.js; JSONB round-trip case in test-payment-lifecycle.js |
| Email contained mutable legal links without the full accepted documents | Attach self-contained UTF-8 HTML containing accepted terms/privacy and controller details, plus a minimal machine-readable purchase receipt | All 11 locales tested; no external resources, scripts, questionnaire answers or access secrets in attachments |
| Purchase-confirmation time was stored in consent event evidence but absent from the session snapshot | Include purchaseConfirmedAt for newly claimed receipts; historic missing times remain null, never fabricated | Isolated PostgreSQL order/receipt test |
| Email withdrawal wording could differ from the accepted terms | Use the archived withdrawal section in both HTML and plain text; underlying legal classification still requires review | Contract evidence and template tests |
| Terms page displayed privacy-policy version | Display the terms version on the terms page | Different-version regression assertion |
| Contract failure storage could include a provider's raw error text | Persist and return bounded internal error codes only | Synthetic sensitive error regression test |

The new contract test is included in CI. No database migration is needed: the archive uses migration 023 already present in this repository.

## Verified Existing Controls

Local run results on 2026-09-30: `npm run audit:all` passed; `node scripts/smoke-consent-security.js` passed; `node scripts/test-payment-lifecycle.js` passed 23 isolated database cases; `node scripts/test-contract-evidence.js` passed all 11 locales and mocked sender cases. Environment warnings in source-only smoke tests describe absent local database configuration, not production health.

- Consent-security synthetic tests cover changed legal versions, withdrawal/restriction, admin credential rotation and private response headers.
- Payment lifecycle tests cover duplicate/lost provider responses, invoice reconciliation, refund restrictions and email failure visibility.
- Added full synthetic erasure test: questionnaire payload and access are removed; pending outbox payloads cleared and jobs blocked; payment history remains accurate.
- These tests use an isolated database and mocked providers. They do not prove current Webflow publication, provider account settings, mailbox delivery or production scheduler operation.

## Rollout And Historical Orders

1. Review this diff and run audit:all, smoke:consent-security, test:payment-lifecycle and test:contract-evidence.
2. Deploy the same reviewed release to web and worker with the existing CI/release procedure. Do not toggle launch approvals as part of this patch.
3. Inspect unsent contract confirmations for missing consent_record.documentRevisionId or missing archive rows. CONTRACT_EVIDENCE_UNAVAILABLE requires manual reconciliation with authentic evidence. Never assign a current document to an old purchase merely to make a retry pass.
4. Do not resend already-sent confirmations blindly. Review historical correction needs separately and preserve provider idempotency.
5. Run an authorized sandbox purchase with a real test inbox. Inspect the attached HTML and JSON, order amount, selected package, language and actual accepted versions. Confirm invoice/report/contract delivery independently.
6. Perform denied/accepted/withdrawn consent network tests on both published domains and mobile. Do not send health-derived events or questionnaire data to advertising services.

## Outstanding Decisions And Evidence

| Item | Current evidence / boundary | Required closure |
|---|---|---|
| DPIA | Owner approval was expressed in the conversation; it must not be erased or described as absent. Exact approved final file/version and current residual-risk decision were not established in this turn | Controller identifies final version; attach approval date/capacity and changes since approval. No fabricated signature or retrospective approval |
| Lawyer review | Owner states original notice was lawyer-reviewed | Distinguish original material from subsequent code, translations and additions; obtain targeted review of changed scope where necessary |
| Vendor processing/transfers | Public terms and owner statements exist; no fresh account-specific contract audit in this turn | Record applicable standard DPA, entity, version/acceptance and transfer basis by actual provider role. Bespoke provider letters are not automatically required |
| Retention | Erasure implementation tested; legal-evidence/accounting retention decisions are outside this code patch | Confirm finite periods and legal holds; align notice, jobs and backup deletion ledger. Verify restored backups before reuse |
| Customer remedies | Support/refund runbook exists | Confirm attended mailbox, responsible operator, statutory deadlines, invoice correction and actual refund rehearsal. Do not perform real refunds without authorization |
| Consumer terms | Immediate performance and withdrawal are represented in consent and checkout | Resolve digital-content/service classification and associated withdrawal wording with counsel; check applicable online withdrawal-function requirements. Never equate withdrawal waiver with loss of conformity remedies |
| Product claims | Professional content validation has not been performed by owner decision | Do not claim it was completed or claim diagnostic/clinical validity. Assess intended purpose separately; a disclaimer is not regulatory classification |
| Countries/languages | Eleven locales implemented, not independently legally certified | Select actual launch countries, review local mandatory information/accessibility obligations and translations; no blanket EU-wide certification |
| Tax | Szamlazz.hu live NRMP account: AAM default, NAV invoice connection active, OSS switch off as observed 2026-09-30 | Actual tax status and applicable OSS/SME or other route require confirmation. Do not infer NAV registration from a UI switch or apply AAM globally |

## Boundaries Of Assurance

An external penetration-test certificate, native legal sign-off for every string or a custom signed letter from every provider is not asserted here as universally mandated by law. Internal release policies can be stricter and must be changed only by an explicit documented decision. Adequate security and legally applicable processing agreements remain necessary.

No customer record, real card charge, refund, tax registration, production setting, or external approval was changed by this remediation.

## Reference Sources

- EU distance-selling information: https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm
- EDPB lawful processing: https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en
- EDPB controller/processor contracts: https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en
- EDPB anonymisation/pseudonymisation: https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_en

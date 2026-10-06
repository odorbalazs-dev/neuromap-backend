# Managed Payments release preparation - 2026-10-05

Status: NOT approved for production Managed Payments traffic. This release keeps
the existing production checkout unchanged and adds a default-off sandbox path.
No live checkout, refund, bank payout or tax approval is evidenced by unit tests.

## Changes

- Sandbox-only Managed Payments checkout with explicit API version and validated
  one-time, inclusive USD prices matching the selected Standard or Plus package.
- Live keys rejected when the sandbox flag is enabled; no inline-price fallback.
- Managed Payments invoice exclusion preserved in the post-payment outbox and
  invoice retry selection to prevent a second customer invoice from Szamlazz.hu.
- Accepted legal documents attached to contract confirmation from their archived
  revision in all 11 locales, rather than substituting current policy versions.
- Missing legal evidence fails explicitly; provider failures use sanitized codes.
- Sandbox checkout creation and subsequent session retrieval/listing use the
  same API version. Invoice recovery uses that shared adapter, and sanitized
  webhook evidence retains the Managed Payments marker.

## Verified locally

- `npm run audit:all`: passed.
- `npm run test:managed-payments`: passed; mocked provider calls only.
- `npm run test:contract-evidence`: passed, 11 locales.
- `npm run test:payment-lifecycle`: passed, 23 isolated database cases.
- `npm run smoke:consent-security`: passed.
- `npm audit --omit=dev --audit-level=moderate`: zero vulnerabilities using
  Node's system CA store. Certificate validation was not disabled.

## Isolated sandbox setup

1. Create an EMPTY Railway test environment, not a production duplicate. Create
   a new database with synthetic data only; do not restore a production backup.
2. Deploy web and worker from the same reviewed commit with distinct roles and
   database credentials. Keep production routing and environment variables intact.
3. Use a separate Stripe sandbox and sandbox-only secret/restricted keys, webhook
   signing secret and price IDs. Credential entry is performed privately by the
   owner. Never commit keys or paste them in chat.
4. Set STRIPE_MANAGED_PAYMENTS_TEST_ENABLED=true only in that sandbox. Create
   Standard 799 and Plus 999 USD one-time inclusive prices with txcd_10503000.
5. Use sandbox success/cancel URLs and webhook endpoint. Configure separate
   budget-limited AI access and controlled email recipients. Do not copy the
   live Szamlazz.hu agent key or production administrative/access secrets.
6. Inspect the launch gate for the sandbox without forging production approvals.

## Required before activation

### Provisioning evidence, 2026-10-05

- Created the EMPTY Railway environment `managed-payments-test`. A fresh
  `Postgres-1Vfj` database is online; no production data was restored.
- Created `neuromap-test-backend` and `neuromap-test-worker`. On 2026-10-06,
  both deployed successfully from the same reviewed commit; startup verified
  runtime privileges and all migration checksums. The worker started normally.
- Both services retain `PRODUCTION_CHECKOUT_ENABLED=false` and
  `INVOICE_AUTO_CREATE=false`; the test-only Managed Payments flag is enabled.
  The worker concurrency is 1. No production configuration was changed.
- The existing Stripe sandbox now displays `Ready to use`. Default activation
  remains off; no Managed Payments transaction has yet been executed.
- Sandbox Standard: `prod_VO3wIxiD0plNj7`, price
  `price_1UNHoEHNvQLFQQSmvlKIkHaY`, USD 7.99 one-time, tax inclusive.
- Sandbox Plus: `prod_VO3yKqJWZVWIzu`, price
  `price_1UNHqAHNvQLFQQSmvx3JYwGK`, USD 9.99 one-time, tax inclusive.
- Both sandbox products use `txcd_10503000` and show Managed Payments
  eligibility. This is not tax-adviser approval.
- Owner entry of the sandbox Stripe key was requested privately in Railway.
  Its test prefix and the presence of the owner-supplied AI key, email key,
  sender address and administrative token were checked without exposing values.
  The administrative token meets the minimum length. These checks do not prove
  provider authentication, sender-domain verification or restricted key scope.
  Worker references to the sandbox credentials were saved. A sandbox webhook
  endpoint and signing secret were subsequently configured privately. Restricted
  runtime database access was verified as described below.
  No credentials are in this file.
- Both GitHub workflows for commit `7f37c30` completed successfully. This is
  automated code verification, not proof of a successful hosted checkout.
- On 2026-10-06 the owner explicitly authorized a temporary account-level SSH
  key for the test database. It was registered, but the connection failed host
  key verification before any database command ran. The temporary key was then
  revoked, its absence checked through the Railway API, and its local files
  removed. No account-level SSH key from this attempt remains active.
- A subsequent certificate-verified TLS relay attempt timed out without a
  command result. It is not evidence of successful database access. Database
  TLS verification, migrations and runtime roles were subsequently completed
  through the isolated database maintenance deployment below. No production
  configuration was changed.
- Following the retrieval/recovery API-version correction, the local mocked
  Managed Payments tests and all 23 isolated payment-lifecycle cases passed.
  Hosted webhook/PDF/email acceptance checks have not yet run.

### Database and hosted-service evidence, 2026-10-06

- Maintenance deployment `23fc245b-9195-4f64-8349-65b0b44ac2cd` applied all 26
  Git-normalized migrations to the empty test database and installed separate
  SCRAM credentials for `neuromap_web_runtime` and `neuromap_worker_runtime`.
  Neither runtime role has schema-management or database-owner privileges.
- The existing certificate authority signed a server certificate with the
  actual private hostname. Application connections use `verify-full`; the
  authority was not rotated and certificate validation was never disabled.
- Verification deployment `ca7e3fb4-385a-4e80-acba-069ae0025ce0` authenticated
  both actual runtime roles over verified TLS and rejected both an unencrypted
  connection and an invalid certificate authority.
- Removed every temporary `NM_TEST_*` maintenance variable. Railway's null
  start-command update did not clear the override, so the original image
  wrapper command was explicitly restored and checked. Database deployment
  `4bfe8854-e3f6-4c61-b421-286eaed17ea4` became ready for connections.
- Backend deployment `c4a76c14-fda4-4507-ac82-bded2380a828` and worker deployment
  `92fbc70e-91e9-4df5-898d-29519d7f132d` both succeeded at commit `49d2697`.
  HTTPS `/health` returned 200. Public checkout availability remained false.
- Test services run from `fix/launch-gates-2026-09-16`; production web/worker
  remain on `main`. Test database region is US West: synthetic fixtures only,
  not an approved location for production customer records.

### Operator checkout and return-page correction, 2026-10-06

- Added default-off, admin-session/CSRF-protected sandbox checkout and retry
  endpoints. Exact project and test-environment IDs, sandbox Stripe credentials,
  disabled production checkout/invoicing and a recipient allowlist are required.
  Legacy raw-token admin authentication alone cannot use these endpoints.
- Public checkout and its production approval gate remain unchanged and closed
  in this sandbox. No production legal or tax approvals are fabricated.
- All 11 test success/cancel locales use the existing responsive status script
  with a same-origin API configuration, a nonce-scoped script policy, no-store
  responses and no tracking scripts or administrative credentials.
- Sandbox alerts use a distinct subject prefix. The test-only alert recipient
  is the owner's requested helpdesk mailbox. Successful scheduling is not proof
  of actual email delivery; that is a separate acceptance check.
- `npm run test:managed-payments` now includes 19 isolated operator/CSRF/guard
  and return-page cases. Full `audit:all` and 23 payment-lifecycle cases passed
  locally. Hosted purchase acceptance remains outstanding at this checkpoint.

### Outstanding acceptance checks

### Remote operator evidence and dependency correction, 2026-10-06

- Backend and worker successfully deployed commit `fc8afa1`. Actual HTTPS
  health and Hungarian return pages responded with 200; public checkout stayed
  closed. Unauthenticated operator requests returned 401, missing CSRF returned
  403, and non-allowlisted recipients could not create an order.
- The four scheduled lifecycle/recovery/alert operations reported healthy.
  Resend accepted a sandbox-labelled alert to the configured helpdesk mailbox;
  mailbox delivery has not been independently verified.
- Actual Standard and Plus Checkout sessions were created in the isolated
  Stripe sandbox. Provider reads confirmed Managed Payments enabled, test mode,
  correct internal order references and inclusive USD totals of 799/999 cents.
  Neither transaction has been submitted at this checkpoint. The Standard
  hosted form awaits owner approval of the displayed checkout terms.
- GitHub CI for `fc8afa1` failed its dependency audit. Updated `compression` to
  1.8.2 and the compatible transitive `proxy-addr` dependency to 2.0.8, addressing
  GHSA-vc2v-76pw-4v95 and GHSA-jqcg-44mw-7w3h. Audit thresholds and certificate
  verification were retained. The production dependency set is not changed by
  this sandbox-branch update and needs a separate reviewed release.
- After the updates, the production-dependency npm audit reported zero known
  vulnerabilities. Local Managed Payments tests (including 19 operator cases),
  23 payment-lifecycle cases, 11-locale contract evidence and consent-security
  checks passed. Remote CI and deployment are checked separately from these
  local results; no completed purchase or report delivery is inferred from them.

### Remaining hosted acceptance

### Standard hosted acceptance, 2026-10-06

- The owner completed the Standard sandbox Checkout. The actual Stripe session
  was complete/paid, Managed Payments enabled and livemode false. Total USD 799
  cents included 170 cents of sandbox tax; this is not a production tax ruling.
- The actual checkout completion webhook was processed. One analysis job
  completed on its first attempt. Payment was recorded at 08:59:50 UTC and the
  report email was submitted at 09:00:16 UTC, approximately 26 seconds later.
- The customer API reached `sent`, PDF `ready`, order confirmation `sent` and
  report email `sent` with delivery status `accepted`. Szamlazz.hu issuance was
  skipped. Resend retrieval returned 401 with the existing limited test key;
  no additional access was granted and mailbox delivery is not yet evidenced.
- Downloaded the synthetic report through authenticated admin access. The PDF
  had 11 A4 pages; all page renders were inspected without observed text overlap.
  Content review found overly definite wording about absent secondary signals;
  this needs a report-safety correction before claiming launch readiness.
- The actual success page showed completion rather than remaining in processing.
  A 393-pixel mobile trial exposed an overflowing support reference. Added
  bounded wrapping and a regression check; the checkout loader version is now
  `20261006-status-mobile-wrap-v1`. The questionnaire engine version is unchanged.
- Plus purchase, hosted refund/cancellation/retry checks, mailbox verification,
  final production release and live acceptance are still outstanding. One
  successful synthetic Standard purchase does not close these checks.

- Real sandbox checkout for both packages and actual webhook delivery; verify
  amount/currency/package, duplicate-event safety and failed/cancelled payments.
- Verify Managed Payments field availability on webhook and recovery API reads;
  the shared versioned adapter is covered by local request-contract tests, but
  actual provider responses must still be inspected through the hosted trial.
- Verify PDF, report email, accepted legal attachments, final customer status,
  retry/recovery and monitoring through actual service interactions.
- Rehearse refund and customer-support routes with synthetic orders; ensure
  there is exactly one customer invoice and correct refund accounting.
- Adapt customer terms, confirmation, privacy/vendor information and refund
  wording to the actual merchant-of-record arrangement, in all launch languages.
  Existing standard-checkout terms are not certified as suitable for that route.
- Confirm product tax classification with a qualified adviser. Dashboard
  eligibility is not an individual tax ruling or clinical-content validation.
- Only then implement/review production activation, deploy the same release to
  web and worker, verify provider configuration and perform an authorized live
  acceptance purchase. A bank payout requires a settled available balance.

## Standard mailbox review and corrections, 2026-10-06

- Verified in the company Gmail inbox: Standard purchase confirmation arrived
  at 10:59 local time with the archived legal HTML and purchase receipt JSON;
  report arrived at 11:00 with an opening, 11-page PDF attachment. This closes
  mailbox arrival for this synthetic Standard order, not Plus or live delivery.
- Tightened report instructions: weak/zero/unassessed signals cannot establish
  absence of a condition, and parental answers are not direct observation.
  Added narrow known-phrase regression guards for 11 languages. A flagged draft
  is rewritten once; a repeated failure keeps `REPORT_CONTRACT_INVALID` and is
  not returned for delivery. These guards are not clinical validation or a
  guarantee that all possible misleading paraphrases will be detected.
- Purchase confirmations now use localized Europe/Budapest time, including
  explicit zone and UTC offset with seasonal daylight-saving adjustment.
  Missing/invalid timestamps show a placeholder rather than an invented time.
- Resend rewrote legal URLs to tracking redirects in the original email.
  Disabled domain click tracking for `neuromapkids.com`; open tracking was
  already off and remains off. Verified both switches on the domain settings
  page without broadening the runtime sending key. Tracking remains a provider
  configuration, not a per-email option in the installed SDK.
- A new, explicitly labelled technical email arrived in the company Gmail
  inbox at 12:04 local time. Its two actual legal link targets were direct
  sandbox `/legal/terms?lang=hu` and `/legal/privacy?lang=hu` URLs, without
  tracking redirects. The synthetic purchase timestamp displayed the localized
  date with `10:59 GMT+2 (Europe/Budapest)`. This was not a new purchase, invoice
  or contract.
- Offline regression tests cover all 11 safety guard examples, cautious text,
  actual generation retry/rejection with a mocked transport, and all 11
  localized confirmations including summer/winter timestamps. Local
  `audit:all`, `test:report-safety`, `test:contract-evidence` and
  `test:managed-payments` passed. GitHub CI run `37447084327` for `64bae01`
  passed all quality steps, including dependency audit and isolated PostgreSQL
  integration. Both sandbox backend and worker successfully deployed that
  commit. These checks do not claim a fresh full purchase or generated report.
- No production checkout activation or rewrite of existing delivered reports
  is included in these corrections.

## External references

- https://docs.stripe.com/payments/managed-payments/eligibility
- https://docs.stripe.com/tax/tax-codes
- https://support.stripe.com/questions/understand-managed-payments-payout-speed
- https://resend.com/changelog/update-click-open-tracking-via-api

No secrets, customer records or backup identities belong in this release.

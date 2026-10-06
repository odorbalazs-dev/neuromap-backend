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

## Hosted lifecycle rehearsal and invoice status correction, 2026-10-06

- Created a separate, synthetic unpaid sandbox fixture. Actual hosted API and
  Stripe checks passed: duplicate creation reuses the order; an invalid access
  token is rejected; an open Checkout is reused; no analysis is queued before
  payment; an expired Checkout gets a new attempt; an already paid Standard
  order cannot be retried; consent withdrawal blocks retry and expires the
  provider Checkout. No payment was submitted for this disposable fixture.
- The Plus form was prepared with Stripe test-card data. Final submission was
  handed to the owner because Checkout displays Link terms. Until that
  submission and subsequent verification, Plus purchase/PDF/email acceptance
  remains outstanding. A fixture creation is not a completed transaction.
- Corrected customer invoice states: test-excluded invoices use `skipped` and
  provider-managed invoices use `external`, rather than pretending a local
  invoice was issued. Only known exclusion reasons finish the local document
  task; unknown exclusions, failed confirmation and financial restrictions
  remain attention states. Provider-managed status is not proof that the buyer
  received a provider invoice. Added render checks in all 11 languages.
- Checkout return script version: `20261006-invoice-disposition-v1`.
  The questionnaire engine version is unchanged. Long invoice state labels wrap
  within their rows with direction-aware alignment.
- Read-only production configuration check found checkout still closed, live
  Stripe credentials, certificate verification `verify-full`, and no production
  source change. Production lacks configured Standard/Plus Stripe price IDs;
  local invoicing remains enabled. Vendor DPA review and security review flags
  are false; tax approval/evidence and reviewed local-tax default are absent.
  Existing privacy/terms approval flags do not prove review of a new
  merchant-of-record arrangement. Do not forge evidence or turn these flags on
  to bypass readiness.
- The adapter currently accepts Managed Payments only with test credentials.
  Production activation requires an explicitly gated live adapter, verified live
  products/prices and merchant eligibility, matching live webhook/recovery
  behavior, and reviewed customer documents. Do not enable the test flag with a
  live key or fall back silently to ordinary Checkout/local invoice issuance.
- Fetched the actual processed Standard test event from Stripe, then replayed
  it twice with an operator-generated signature using the sandbox webhook
  secret. Both calls returned an already-processed result without another
  analysis job, report email attempt or provider email ID. An invalid signature
  was rejected with HTTP 400. This was an operator-signed replay of a real test
  event, not a Dashboard resend or a fabricated successful purchase event.
- Refunded the entire synthetic Standard payment through the Stripe sandbox
  API: 799 USD minor units, provider refund status `succeeded`. Verified the
  actual refund webhook subsequently changed the customer's financial state to
  `refunded` and overall state to `attention`. No real funds were moved. The
  previous sent PDF/email checkpoint remains historical; this test order is
  now refunded. The refund does not erase already delivered email attachments.
- Hosted payment-decline acceptance and Plus purchase/PDF/email acceptance
  remain open. The separate 23-case payment-lifecycle suite passed using
  isolated PostgreSQL and mocked providers; it is not substituted for those
  outstanding hosted checks.
- Local full product audit, Managed Payments policy/operator checks, invoice
  status unit checks and all 11-locale invoice rendering checks passed. An
  initial test-harness failure was fixed by supplying inert DOM event listeners;
  the full audit was rerun successfully on the corrected files.
- Fix commit `dc774d5` was pushed and successfully deployed to both sandbox
  services. GitHub CI runs `37451281950` and `37451277466` passed. Verified the
  actual return page at a 393-pixel mobile viewport: document width 378 pixels,
  invoice row width 298 pixels, no invoice/reference overflow. Its excluded
  invoice label displayed `Nem keszul (teszt)` with the localized accents.
  The viewport override was reset after the check.
- Sandbox operation logs at 10:46 UTC showed successful current lifecycle,
  post-payment recovery and alert runs, plus a healthy confirmation outbox.
  These are sandbox observations, not evidence of production scheduling.
- Stripe documents Adaptive Pricing's Checkout and PaymentIntent amounts in
  the original integration currency; local presentment uses a separate
  `presentment_details` field. The strict USD package comparison is therefore
  not, by itself, evidence of a conversion bug. A completed local-currency
  purchase remains a separate acceptance check. Do not send `adaptive_pricing`
  overrides to Managed Payments: that Checkout parameter is unsupported there.
- Safe evidence files are retained locally under the gitignored
  `work/managed-payments-tools/` directory: lifecycle evidence, webhook replay,
  refund evidence and production gate check dated 2026-10-06. Private access
  tokens and synthetic payload files must not be committed or included in a
  public release archive.

## Live binding preparation and completed Plus acceptance, 2026-10-06

This section supersedes the historical test-only adapter and outstanding Plus
purchase statements above. It does not assert that public sales are enabled.

- The owner completed the hosted Plus sandbox purchase. Read-only provider and
  application checks confirmed payment `paid`, `managed_payments.enabled=true`,
  amount 999 USD minor units, one completed analysis attempt, PDF `ready`, report
  email `sent`/provider accepted, and contract confirmation `sent`. The local
  invoice task was excluded, not falsely marked as an issued invoice. Analysis
  and report submission finished about 22 seconds after the recorded payment.
- The actual stored Plus analysis generated a 10-page, 47,063-byte PDF with
  SHA-256 `7f5ba42642057bf8e26241a2e198d439e09c0ce947add81e07b3538e92d0afbe`.
  Rendered first and last pages were checked for layout and Hungarian glyphs.
  This is not professional validation of every clinical statement, proof of
  inbox delivery, or proof of the 14-day follow-up program's complete lifecycle.
- Added an explicit live Managed Payments flag. Test/live flags are mutually
  exclusive and require matching credential modes. Both live packages must use
  configured active, one-time, inclusive USD prices on an active eligible
  product. Missing or mismatched prices cannot silently use inline ordinary
  Checkout. The provider response must confirm Managed Payments and its mode.
- A distinct live idempotency suffix prevents a previous ordinary or sandbox
  request from being reused as an apparently managed live Checkout. Recovery
  reads retain a Managed Payments-capable API version even after a flag rollback
  so provider invoice ownership is not lost.
- Successful delayed payments now enter the same atomic, idempotent fulfillment
  path as immediate payments. A completed but unpaid Checkout does not queue a
  report; a later `checkout.session.async_payment_succeeded` queues it once.
  The isolated payment-lifecycle suite now has 25 passing cases. Hosted delayed
  payment failure/retry acceptance remains outstanding; do not assume it passed.
- Live readiness additionally requires a dedicated Managed Payments approval
  with evidence and both price IDs. The general tax approval remains required:
  reviewed merchant-of-record coverage replaces local VAT defaults for managed
  live purchases, not the obligation to review supported markets. Existing
  legal/privacy/vendor/security approvals are not bypassed or forged.
- Stripe's live dashboard showed `Ready to use`, not an already transacting
  `Active` merchant-of-record service. Both products were eligible. After the
  owner's approval and authenticator confirmation, only the actual backend
  restricted key received Prices Read. The worker credential was unchanged.
  Provider requests confirmed both live prices as active, inclusive, one-time
  USD 799/999 with tax code `txcd_10503000`.
- Existing Stripe key display names do not match the deployed service roles.
  The actual backend key was identified against its masked provider request,
  not its name. No credentials were copied, rotated, exposed or broadened to
  webhook administration. Webhook changes must use the authenticated dashboard.
- Legacy webhook snapshots cannot decide invoice ownership: fulfillment
  re-fetches the authenticated Checkout using a Managed Payments-capable API
  version. This preserves the existing endpoint and signing secret without
  granting API webhook-administration rights or issuing a duplicate invoice.
  A regression test exercises an old snapshot without the managed field.
- At this checkpoint production checkout remains closed. The live endpoint
  uses API version `2024-06-20` and the original 10 events; its delayed-success
  subscription must be updated with the tested deployment.
  New merchant-of-record customer disclosures, outstanding approval evidence,
  hosted decline/local-currency checks and owner live acceptance must be
  resolved before claiming unrestricted production launch.

## Verified gated production deployment, 2026-10-06 12:19 UTC

- Pushed implementation commits `72d3a57` and `385fe08` on the existing
  `fix/launch-gates-2026-09-16` branch. GitHub CI runs `37461569749` and
  `37461564282` completed successfully for
  `385fe08758bd4fa539932acdb00e72730716ef7b`.
- Both sandbox services automatically deployed that exact commit successfully.
  Read-only rechecks still showed Plus payment clear, report sent, PDF ready,
  one report-email attempt, and its observation program active with zero entries.
  The previously refunded Standard order correctly remained restricted.
- Configured the verified live price IDs in both production application services,
  with live mode on and test mode off. Public checkout and live launch approval
  remain false. No ordinary-invoice automation flag or existing credential was
  removed; historical ordinary orders retain their existing recovery path.
- Deployed the exact CI-verified commit explicitly to production worker
  `6716afce-645a-4efc-80c5-4de3ca5b38d9` and the production backend. Both latest
  deployments reported `SUCCESS` with the expected commit. `verify-full` TLS
  settings remained unchanged. No database, backup service or source branch was
  reconfigured. The source still tracks `main`; PR #13 must be integrated through
  normal protected-branch checks before relying on later automatic deployments.
- Updated the existing live webhook destination in the authenticated Stripe
  dashboard: added only `checkout.session.async_payment_succeeded`, preserving
  all 10 existing refund/dispute/completion events, endpoint and signing secret.
  The saved destination showed `Active` and 11 events. Its historical API
  version is retained; authenticated fulfillment reads now preserve managed
  invoice ownership independently of the webhook snapshot version.
- Actual hosted checks returned `/health` HTTP 200 and public `/checkout` HTTP
  503 with `CHECKOUT_NOT_READY`. Admin status responses had `no-store` protection;
  the verification session was logged out. Schema, database connection, runtime
  assets and critical production-state checks passed. These are deployment and
  operational checks, not a real-money acceptance purchase.
- Production operational evidence showed healthy lifecycle (24/24 successful
  runs), recovery (287/287), production-health alerts (287/287) and operational
  alerts (95/95), plus a healthy confirmation/invoice outbox. Last recovery and
  production-health success was 12:18:59 UTC. Run success does not prove that an
  alert was emailed on every interval: cooldown/no-alert skips are expected.
- The actual launch gate still listed `vendor_dpa`, `security_review`,
  `tax_configuration`, `managed_payments_live`, `production_checkout`,
  `vendor_dpa_evidence` and `tax_configuration_evidence` as missing. These are
  recorded configuration/evidence states, not a new demand for bespoke provider
  letters. Existing accepted provider terms and reviews should be reconciled
  against genuine applicable evidence, never replaced by invented approval.
- Remaining launch work: reflect the new merchant-of-record roles in accepted
  customer documents, review supported selling markets/tax scope, reconcile
  outstanding approval evidence, integrate PR #13, and complete the owner-led
  live acceptance. Hosted decline, delayed-failure/retry and local-presentment
  acceptance remain distinct checks. No real funds were moved in this rollout.

## External references

- https://docs.stripe.com/payments/managed-payments/eligibility
- https://docs.stripe.com/tax/tax-codes
- https://support.stripe.com/questions/understand-managed-payments-payout-speed
- https://resend.com/changelog/update-click-open-tracking-via-api
- https://docs.stripe.com/payments/managed-payments/how-it-works
- https://docs.stripe.com/payments/managed-payments/update-checkout
- https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing?payment-ui=stripe-hosted

No secrets, customer records or backup identities belong in this release.

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
- Created `neuromap-test-backend` and `neuromap-test-worker`. These are empty
  service shells, not running deployments. Source, private test credentials,
  public endpoint and webhook configuration remain outstanding.
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
  Worker references to the sandbox credentials were saved. Webhook signing
  secret, endpoint URLs and restricted runtime database access remain pending.
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
  TLS verification, migrations and runtime roles remain outstanding for this
  new sandbox database. No production configuration was changed.
- Following the retrieval/recovery API-version correction, the local mocked
  Managed Payments tests and all 23 isolated payment-lifecycle cases passed.
  Hosted webhook/PDF/email acceptance checks have not yet run.

### Outstanding acceptance checks

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

## External references

- https://docs.stripe.com/payments/managed-payments/eligibility
- https://docs.stripe.com/tax/tax-codes
- https://support.stripe.com/questions/understand-managed-payments-payout-speed

No secrets, customer records or backup identities belong in this release.

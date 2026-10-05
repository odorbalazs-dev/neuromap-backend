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

- Real sandbox checkout for both packages and actual webhook delivery; verify
  amount/currency/package, duplicate-event safety and failed/cancelled payments.
- Verify Managed Payments field availability on webhook and recovery API reads;
  the legacy API reads must not silently drop the merchant-of-record marker.
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

# Payment Go-Live Runbook

Revision: 2026-09-10. This is an operational checklist, not a legal, tax or clinical certification.

## Release Boundaries

- Engine and checkout loader: `20260910-payment-integrity-v4`.
- Admin assets: `20260910-payment-review-v4`.
- Consent loader stays on `20260909-consent-security-v2`; do not replace its version with the engine version.
- Apply migration `024_payment_lifecycle.sql` before new payment workers run.
- Keep `PRODUCTION_CHECKOUT_ENABLED=false` during deployment. Production launch approvals cannot be bypassed using `LAUNCH_GATE_ENFORCED=false`.
- A green local test suite is not proof of a completed live payment or of provider account compliance.

## Deployment Order

1. Create a fresh encrypted backup, record its retention, and restore it into an isolated database. Verify row counts, constraints and essential session/payment relations. Never restore over production for this check. Delete restored personal data under the agreed retention policy.
2. Confirm the launch countries and invoicing treatment with the responsible tax adviser. Set `INVOICE_TAX_POLICY_JSON`, `TAX_CONFIGURATION_APPROVED` and a durable `TAX_CONFIGURATION_EVIDENCE` reference on both services. The policy schema is a map from country code to `{ "vatRate": "...", "euVat": false }`. A reviewed `*` rule is currently required because Checkout does not limit billing countries. Do not use a global AAM fallback without an applicable written tax determination.
3. Reconcile every existing launch-gate approval with its actual evidence. A flag is not the evidence itself. Unperformed professional reviews must remain unapproved. A decision to change the existing review requirement needs its own documented product/legal review, not a fabricated validation.
4. Ensure web and worker use the same Stripe account and mode, matching Stripe/Resend webhook signing secrets, the same database and the intended role. Store secrets only in the platform's secret configuration. Set `PAYMENT_REVIEW_OWNER` to an attended operational mailbox; verify `ADMIN_ALERT_EMAIL` separately.
5. Deploy the reviewed backend release and additive migration, then the worker release. Confirm both service versions, startup logs, database health and worker scheduler records. Keep checkout closed.
6. Activate the Stripe endpoint at `/webhook`, API version `2024-06-20`, with the events below. Activate the Resend endpoint at `/webhooks/resend`. Validate signed deliveries. Manually reconcile historical payment/refund/dispute events from any period when the endpoints were disabled or absent; the automatic Stripe session scan does not discover missing refund/dispute events.
7. Publish the engine and all 11 language-specific success/cancel pages. Remove native Google/GTM scripts that start before optional tracking consent. Audit the separate marketing site as well as Webflow. Default-denied consent is not equivalent to preventing a script/network request from starting.
8. Verify `GET /checkout/availability` remains closed while required evidence is missing. After evidence, backups, tags and provider checks pass, set `PRODUCTION_CHECKOUT_ENABLED=true`, deploy the changed configuration, and verify readiness again.
9. Perform an explicitly authorized small real purchase. Check one charge, one paid order, one analysis, a ready PDF, report email delivery, one invoice and one contract confirmation. Confirm the success-page state matches these records. Check cancellation, retry and duplicate callbacks separately in sandbox.
10. Inspect scheduled recovery and alert evidence after deployment and after the first live purchase. Monitor manual payment reviews and failed delivery/outbox items before increasing traffic.

## Provider Events

Stripe:

```text
checkout.session.completed
refund.created
refund.updated
refund.failed
charge.refunded
charge.dispute.created
charge.dispute.updated
charge.dispute.closed
charge.dispute.funds_reinstated
charge.dispute.funds_withdrawn
```

Resend:

```text
email.delivered
email.bounced
email.complained
email.failed
```

## Operational Cases

- Checkout retry reuses an open provider session. An expired session gets another recorded attempt. Do not manually create a second live Checkout merely because the response timed out.
- Withdrawal expires open provider sessions where possible. A payment that won a race with withdrawal becomes a manual review, not permission to process withdrawn sensitive data.
- Refund/dispute callbacks refresh the authenticated Stripe object and update the financial restriction. They do not issue refunds, defend disputes or create credit notes automatically. Complete those steps in the appropriate provider console with the operator's authorization.
- The dashboard's payment review closure requires an evidence note and explicit confirmation. Closing the work item does not remove consent, financial or processing restrictions.
- Invoice requests use a stable external reference. After a lost response, the application looks up the invoice before any possible further issue. An unconfirmed outcome requires manual provider reconciliation; never delete the claim to force a retry. Unsupported foreign tax identifiers also require manual review rather than silently being omitted.
- A Resend accepted/sent response is distinct from delivered. Bounce/complaint events remain visible; a delayed delivered callback cannot clear a complaint. Provider event receipts are retained for 90 days with a bounded purge.
- The automatic Stripe Checkout scan has a bounded 28-day initial history, durable cursor and lease. Recoveries use authenticated provider objects; the local reduced webhook snapshot is not authorization evidence.
- Automated analysis recovery is bounded by existing job history and an aggregate eight-attempt budget. Terminal failures require an operator decision; retry does not bypass payment or restriction checks.

## Transport And Backups

`DATABASE_SSL_MODE=auto` is not proof of verified database TLS. The current implementation disables TLS for private database hosts without a supplied CA. Verify the effective runtime mode, not just the variable name. Use a supported CA and verified hostname for a TLS deployment; never fix a certificate error with a global verification bypass. Railway CLI HTTPS trust and PostgreSQL transport are separate controls.

Check plan eligibility before relying on Railway backup/PITR. A visible volume is not a backup. An old snapshot is not a tested recovery point. Paid plan changes and alternative backup storage/key custody require owner approval.

## Verification Commands

```sh
npm ci
npm run audit:all
npm run test:payment-lifecycle
npm run smoke:consent-security
node scripts/smoke-go-live.js
node scripts/smoke-invoice-payment-policy.js
node scripts/smoke-railway-runtime.js
npm audit --omit=dev --audit-level=moderate
```

Browser tests require Playwright and a browser installation. Set `PLAYWRIGHT_MODULE` to an available package and optionally `PLAYWRIGHT_CHANNEL=chrome`:

```sh
node scripts/test-payment-browser.cjs
node scripts/test-payment-admin-browser.cjs
```

`test:payment-lifecycle` uses isolated PGlite PostgreSQL and mocked providers. It does not make financial or email requests. The existing CI PostgreSQL 18 jobs additionally test separate-connection consent races. Browser fixtures intercept all external requests; screenshots are written under ignored `work/`.

## Rollback

Close new checkout creation first. Do not roll back a completed payment by modifying local paid flags. Pause only affected worker tasks if necessary, keeping signed event receipts/reconciliation available. The migration is additive: preserve attempt, review and invoice evidence when rolling code back. Reconcile any in-flight provider side effect before retrying. Never apply an old database snapshot over current paid orders as a routine code rollback.

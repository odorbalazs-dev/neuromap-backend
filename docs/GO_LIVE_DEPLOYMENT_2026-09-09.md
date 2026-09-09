# Go-live remediation deployment

This is a technical deployment guide, not a legal certification or launch approval.

## Release order

1. Keep Railway's **Wait for CI** enabled for both web and worker services.
2. CI runs the existing product checks, dependency audit, go-live unit checks and an isolated PostgreSQL 18 integration. Migration 021 is additive and must finish before traffic reaches new code.
3. Deploy both services from the same successful commit. Production checkout now fails closed when required launch approvals or their evidence are missing, even if an old environment variable requests advisory mode. Existing paid jobs remain processable.
4. Verify `/health`, `/legal/config`, and the public `/legal/privacy`, `/legal/terms`, `/legal/support` pages. Each public page accepts `?lang=hu` (also en, de, it, es, fr, pt, pl, ja, zh, ar).
5. Record only genuine sign-offs in Railway. A supplied lawyer-reviewed notice does not prove clinical validation, provider DPA acceptance, consent-manager publication, independent security testing or completion of a DPIA.
6. Review `/admin/operational-evidence` using the authenticated dashboard. Empty history means missing evidence, not healthy historical operation. Validate alert delivery and an independent external uptime monitor separately.

## Webflow publication

- Home page **Inside head**: use `web/landing-head.html`, before analytics. Remove legacy native Google Analytics/GTM/custom advertising tags. A consent-denied call alone does not prevent already loaded SDKs from making network requests.
- Engine embed: use `web/engine-embed.full.html`. Retain required questionnaire markup and question banks. Do not duplicate the engine loader.
- Every published language-specific success/cancel page: use the shared `web/checkout-pages-embed.html` loader. Publish all affected pages and the correct domains.
- The head snippet hides legacy content before first paint and exposes a reload fallback on a failed boot. Adding it late inside the body cannot reliably prevent the initial flash.
- A verified completed report stops polling. Otherwise polling continues with backoff up to 60 seconds and a 20-second per-request timeout. No new purchase or email is triggered by polling.
- Validate the actual published site with denied/accepted consent, hard reload, mobile navigation, and the network panel. Local fixture checks do not prove that old hosted tags were removed.

## Runtime changes

- Responses API requests explicitly use `store: false`. This is not Zero Data Retention and does not override provider abuse-monitoring retention.
- PDF generation now has independent pending/generating/ready/failed states. Ready proves successful generation, not durable binary storage or inbox delivery.
- Invoice and contract tasks are written to a durable outbox in the transaction acknowledging webhook processing. Unique session/task keys, fenced claims, exponential retries and terminal failure states replace in-memory fire-and-forget execution.
- The worker records lifecycle cleanup (hourly), recovery (5 minutes), health alerts (5 minutes) and operational alerts (15 minutes). Multiple replicas share database leases. Deployment cannot retroactively supply daily operating history.
- Operational evidence retains counters and safe error codes, not customer messages. Outbox billing snapshots are cleared after completion and sensitive-data erasure. Failed tasks require operator review; do not reset every failed invoice blindly.
- Report-email delivery remains separate from invoice delivery. Missing invoice credentials must be resolved before a live sale.
- Only public static assets are compressed. Private report/status responses remain non-cacheable. URL SSL parameters cannot override the explicit PostgreSQL TLS policy.

## Certificate verification

`DATABASE_SSL_MODE=verify-full` enables certificate-chain and hostname checks. For a private CA, set `DATABASE_SSL_CA_BASE64` from an authenticated administrative source. The database hostname must match the certificate SAN. Verify both backend and worker connections before switching. Never use a certificate fetched over an unauthenticated connection as proof of trust. `require`, `auto` on the Railway public proxy, and `no-verify` do not prove certificate validation. No successful production switch is asserted by this guide.

## Recovery rehearsal

Schedule provider backups with a documented RPO and retention. Restore into an isolated, access-restricted destination, never over production. Keep all external provider keys absent; disable workers and customer communication. Compare schema/migration versions, selected aggregate counts and integrity checks, then run synthetic cases. Apply the deletion ledger before any restored data is reused. Record backup ID, timestamps, database version, elapsed restore time, checksum where available, verification results and cleanup. A CI database initialized from migrations is not a production backup-restore rehearsal.

## Support and refunds

The proposed initial-response target is 2 business days, or 1 business day for payment/delivery faults, Monday-Friday 09:00-17:00 Europe/Budapest excluding Hungarian public holidays. Staff coverage and mailbox access require owner confirmation. Statutory deadlines and consumer rights remain applicable. Refund requests go to `info@neuromapkids.com`; an authorized operator verifies the payment, eligibility and absence of a duplicate refund, then uses Stripe's refund operation and arranges invoice correction. No unattended money movement was introduced.

## Authoritative references

- PostgreSQL URL/SSL precedence: https://node-postgres.com/features/ssl
- OpenAI data controls: https://developers.openai.com/api/docs/guides/your-data
- Szamlazz.hu VAT API: https://docs.szamlazz.hu/hu/agent/generating_invoice/vat-rates
- EU OSS: https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en
- Stripe refunds: https://docs.stripe.com/refunds
- Hungarian supervisory authority: https://www.naih.hu/ugyfelszolgalat-kapcsolat
- EEA supervisory authority directory: https://www.edpb.europa.eu/about-edpb/our-members_en

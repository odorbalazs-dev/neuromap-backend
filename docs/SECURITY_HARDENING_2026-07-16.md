# Security Hardening Summary - 2026-07-16

This document records the internal technical security hardening completed before launch.
It is not an external certification, legal opinion, penetration-test report, SOC report, or GDPR compliance certificate.

## What Changed

- Admin access now uses a short-lived HttpOnly cookie session with CSRF protection instead of sending the raw admin token on every dashboard request.
- Legacy admin token headers are disabled unless explicitly re-enabled with `ADMIN_LEGACY_TOKEN_AUTH=true`.
- Customer-facing session lookup and retry checkout endpoints now require a session access token.
- Session access tokens are stored only as SHA-256 hashes in the database.
- Stripe success/cancel links carry the customer session token in the URL hash fragment, so it is not sent to the server by the browser as part of the URL path or query.
- The Webflow engine no longer persists questionnaire draft answers in `localStorage`.
- Webhook events are stored as minimized audit payloads instead of full Stripe objects.
- Rate limiting can use database-backed counters, which works across multiple web replicas.
- Production responses include HSTS when `NODE_ENV=production`.
- Database SSL behavior is explicit and controlled by environment variables.

## Positive Impact

- Lower impact if a browser, analytics script, or extension reads page state.
- Lower risk from leaked admin tokens because the dashboard no longer stores or reuses the raw token.
- Stronger protection around paid session status and checkout recovery links.
- Less sensitive data retained in webhook logs and database tables.
- Rate limits remain consistent if Railway scales the API horizontally.
- Transport and database connection security are easier to verify from configuration.

## Recommended Production Environment

- `ADMIN_LEGACY_TOKEN_AUTH=false`
- `ADMIN_COOKIE_SECURE=true`
- `ADMIN_SESSION_TTL_MINUTES=120`
- `PUBLIC_SESSION_TOKEN_REQUIRED=true`
- `RATE_LIMIT_BACKEND=database`
- `RATE_LIMIT_FAIL_OPEN=false`
- `DATABASE_SSL_MODE=require`
- Use `DATABASE_SSL_CA_BASE64` if the database provider exposes a CA certificate.
- `WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS=90` or shorter if operations allow it.

## Current Internal Validation

The repository includes `npm run audit:security`, which checks for the main hardening invariants:

- no raw admin token header use in the admin dashboard
- admin session and CSRF middleware present
- hashed public session access tokens present
- retry checkout protected by session token
- success/cancel pages pass the token from hash/sessionStorage
- questionnaire draft answers not stored in `localStorage`
- webhook payload minimization present
- database-backed rate limit support present
- database SSL behavior explicit
- security migration present

## External Validation Still Required

For public claims such as "independently audited", "certified", or "security verified", commission an external security review or penetration test and keep the signed report. For legal and GDPR claims, commission a qualified privacy/legal review in the relevant markets.

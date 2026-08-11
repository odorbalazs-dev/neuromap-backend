# Uzemeletetes es deployment

## Railway topologia

Egy Railway projecten belul harom fontos service van:

```text
Postgres
neuromap-backend
neuromap-analysis-worker
```

A web es a worker ugyanazt a GitHub repot es `railway.toml` fajlt hasznalja. A szerepet kornyezeti valtozo valasztja ki:

```text
neuromap-backend:        RAILWAY_SERVICE_ROLE=web
neuromap-analysis-worker: RAILWAY_SERVICE_ROLE=worker
```

A kozos Railway start command:

```text
npm run railway:start
```

Az eloszto script: `scripts/railway-start.js`.

Helyes web log:

```text
Server running on port ...
```

Helyes worker log:

```text
> npm run worker
> node src/jobs/analysis.worker.js
[worker] analysis worker started
```

Ha a worker logban `node src/app/server.js` vagy `Server running on port` jelenik meg, rossz a service role.

## Adatbazis

- PostgreSQL.
- A web es worker ugyanazt az adatbazist hasznalja.
- Elsodleges kapcsolat: `DATABASE_URL`.
- A `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` csak alternativ bontott konfiguracio.
- A migraciok indulaskor futnak a `src/db/migrate.js` alapjan.
- Jelenlegi migracios tartomany: `001`-`019`.

Mar lefutott migraciot ne irj at. Uj valtozashoz uj SQL fajl kell.

## Konfiguracios valtozok

Az ertekeket soha ne masold dokumentacioba. A teljes aktualis lista forrasa a `.env.example` es `src/config/env.js`.

### Alkalmazas es URL-ek

```text
NODE_ENV
PORT
RAILWAY_SERVICE_ROLE
APP_URL
APP_BASE_URL
BACKEND_PUBLIC_URL
CORS_ORIGINS
SUCCESS_URL
CANCEL_URL
```

### Adatbazis es HTTP

```text
DATABASE_URL
PG_POOL_MAX
PG_CONNECTION_TIMEOUT_MS
PG_IDLE_TIMEOUT_MS
PG_QUERY_TIMEOUT_MS
HTTP_JSON_BODY_LIMIT_BYTES
HTTP_HEADERS_TIMEOUT_MS
HTTP_REQUEST_TIMEOUT_MS
HTTP_KEEP_ALIVE_TIMEOUT_MS
HTTP_SHUTDOWN_GRACE_MS
```

### Stripe

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_TIMEOUT_MS
STRIPE_MAX_NETWORK_RETRIES
STRIPE_PRICE_STANDARD_USD
STRIPE_PRICE_PLUS_USD
```

### OpenAI

```text
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_TIMEOUT_MS
OPENAI_MAX_RETRIES
OPENAI_MAX_OUTPUT_TOKENS
```

### Resend

```text
RESEND_API_KEY
EMAIL_FROM
```

### Admin es belso vegpontok

```text
ADMIN_TOKEN
ADMIN_SESSION_TTL_MINUTES
ADMIN_LEGACY_TOKEN_AUTH
ADMIN_COOKIE_SECURE
CRON_SECRET
OBSERVATION_LINK_SECRET
ADMIN_ALERT_EMAIL
ADMIN_ALERT_COOLDOWN_MINUTES
ADMIN_OPERATIONAL_ALERT_MIN_LEVEL
ADMIN_OPERATIONAL_ALERT_WINDOW_HOURS
```

### Worker es kampanykapacitas

```text
WORKER_CONCURRENCY
WORKER_IDLE_SLEEP_MS
WORKER_ERROR_SLEEP_MS
WORKER_STALE_REQUEUE_INTERVAL_MS
WORKER_STALE_JOB_MINUTES
WORKER_HEARTBEAT_INTERVAL_MS
WORKER_MAX_ATTEMPTS
WORKER_RETRY_BASE_SECONDS
WORKER_RETRY_MAX_SECONDS
WORKER_EXPECTED_JOB_SECONDS
ENGINE_LIVE_AUDIT_LIMIT
CAMPAIGN_TARGET_REPORTS_PER_DAY
```

### Szamlazz.hu

```text
INVOICE_PROVIDER
INVOICE_AUTO_CREATE
INVOICE_PRODUCT_NAME
INVOICE_PRODUCT_COMMENT
SZAMLAZZHU_ENDPOINT
SZAMLAZZHU_AGENT_KEY
SZAMLAZZHU_E_INVOICE
SZAMLAZZHU_DOWNLOAD_PDF
SZAMLAZZHU_SEND_EMAIL
SZAMLAZZHU_PAYMENT_METHOD
SZAMLAZZHU_INVOICE_LANGUAGE
SZAMLAZZHU_CURRENCY
SZAMLAZZHU_VAT_RATE
SZAMLAZZHU_SELLER_NAME
SZAMLAZZHU_SELLER_EMAIL_REPLY_TO
SZAMLAZZHU_TIMEOUT_MS
```

### Jogi es adatvedelmi launch gate

```text
PRIVACY_POLICY_URL
PRIVACY_POLICY_VERSION
TERMS_URL
TERMS_VERSION
CONSENT_POLICY_VERSION
POLICY_EFFECTIVE_DATE
CONSENT_RECEIPT_TTL_HOURS
DATA_CONTROLLER_NAME
DATA_CONTROLLER_ADDRESS
DATA_CONTROLLER_COUNTRY
PRIVACY_CONTACT_EMAIL
DPO_CONTACT_EMAIL
EEA_REPRESENTATIVE
SUPERVISORY_AUTHORITY_NAME
SUPERVISORY_AUTHORITY_URL
DATA_RETENTION_DAYS
WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS
LAUNCH_GATE_ENFORCED
PRODUCTION_CHECKOUT_ENABLED
LEGAL_REVIEW_APPROVED
DPIA_APPROVED
CLINICAL_CONTENT_REVIEW_APPROVED
PRIVACY_POLICY_PUBLISHED
TERMS_PUBLISHED
CONSENT_MANAGER_CONFIGURED
VENDOR_DPA_REVIEWED
SECURITY_REVIEW_APPROVED
```

### Marketing

```text
META_PIXEL_ID
META_ACCESS_TOKEN
MARKETING_SERVER_EVENTS_ENABLED
```

Erzekeny gyermek-jolleti adatok miatt a szerveroldali marketing esemenyek alapertelmezetten legyenek kikapcsolva. Ezt ne kapcsold be jogi es privacy review nelkul.

## Statikus assetek es cache

Publikus asset base:

```text
https://neuromap-backend-production-969d.up.railway.app/public/
```

A `/public/webflow` assetek no-cache viselkedessel vannak kiszolgalva, de a bongeszo/CDN cache-busting miatt minden kiadas query-string verziot kap. A loader es a runtime belso verzioja egyezzen.

## Admin Control Center

URL:

```text
https://neuromap-backend-production-969d.up.railway.app/admin/dashboard
```

Az admin token erteket nem szabad atadni chatben. A dashboard login/session flow-jat kell hasznalni. Az admin feluletrol elerheto tobbek kozott:

- rendszerallapot es launch readiness;
- queue es worker;
- session reszletek;
- PDF ujrageneralas;
- elemzes es email ujraprobalas;
- invoice allapot;
- post-payment recovery;
- operational alerts;
- engine es bank audit;
- Webflow embed manager.

## Cron es automation

A cron route-ok `CRON_SECRET` vedelmet hasznalnak. Tipikus feladatok:

- elhagyott checkout recovery;
- adatmegorzesi lifecycle;
- post-payment recovery;
- observation follow-up;
- email retry;
- operational alerts.

Ezeket ne hivd publikus, vedetlen bongeszokodbol.

## Lokalis futtatas

```powershell
npm install
npm run dev
```

A teljes fizetes/riport folyamat lokalisan csak ervenyes szolgaltatoi tesztkulcsokkal es adatbazissal mukodik. A dokumentaciohoz ne hasznald az eles titkokat.

## Kiadas elotti alapellenorzes

```powershell
node --check public\webflow\engine.js
node --check public\webflow\checkout-pages.js
node --check public\webflow\legal-consent.js
npm run smoke:browser-engine
npm run smoke:engine-age-field
npm run smoke:legal-consent
npm run smoke:two-tier-offer
npm run smoke:checkout-pages
npm run audit:language-quality
npm run audit:all
```

Ezutan Railway deploy log, `/health`, `/health/version`, a worker log es az admin launch-readiness panel is ellenorizendo.

## Git es GitHub

Az atadas pillanataban a helyi munkafa nem egyezik teljesen a GitHub HEAD-del, mert vannak meg nem commitolt modositasok. Az uj chat:

1. olvassa a statuszt es diffet;
2. valassza le a sajat landing modositasait az elozetes munkarol;
3. ne tegye stage-be automatikusan az osszes fajlt;
4. commit/push csak felhasznaloi keresre;
5. push utan ellenorizze az uj remote commitot.


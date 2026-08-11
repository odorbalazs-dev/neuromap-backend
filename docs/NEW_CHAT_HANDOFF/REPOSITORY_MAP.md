# Repository terkep

## Gyokerfajlok

| Fajl | Szerep |
| --- | --- |
| `package.json` | Futasi, audit- es smoke parancsok; Node ESM projekt. |
| `railway.toml` | Railway build es kozos `npm run railway:start` inditas. |
| `.env.example` | Konfiguracios valtozok nevei es biztonsagos peldak. |
| `PROJECT_STATE.md` | Regi torteneti osszefoglalo; reszben elavult. |
| `NEW_CHAT_START_HERE.md` | Az uj chat belepesi pontja. |

## Alkalmazas

| Mappa/fajl | Felelosseg |
| --- | --- |
| `src/app/server.js` | Express alkalmazas osszeallitasa, middleware-ek, route-ok, statikus fajlok, migraciok, szerverinditas. |
| `src/api/routes/` | Checkout, webhook, session, legal, observation, jobs, cron, health es admin route-ok. |
| `src/api/controllers/` | HTTP bemenet/kimenet, validalas es szolgaltatasok meghivasa. |
| `src/config/` | Kornyezet, logger, ajanlati katalogus es szamlazasi konfiguracio. |
| `src/middleware/` | Admin hitelesites es biztonsagi middleware-ek. |
| `src/services/` | Uzleti folyamatok: elemzes, queue, email, PDF, riport, beleegyezes, invoice, monitoring, audit, recovery. |
| `src/infrastructure/invoice/` | Szamlazz.hu kliens. |
| `src/jobs/analysis.worker.js` | Kulon hosszu eletu queue worker. |
| `src/utils/validateCheckoutPayload.js` | A kliens checkout payloadjanak szigoru szerzodese. |
| `src/utils/normalizeCheckoutPayload.js` | Bemenet tisztitasa es szerveroldali kanonikus payload. |
| `src/utils/secureCompare.js` | Idobiztos titok-osszehasonlitas. |

## Kerdesbankok es engine-adatok

| Mappa/fajl | Felelosseg |
| --- | --- |
| `src/data/banks/` | Szerkesztheto forrasbankok es bridge forras. |
| `public/banks/*.translated.js` | Leforditott bongeszo-bankok. |
| `public/banks/triage.embed.js` | Webflowba toltheto triage bank. |
| `public/banks/all-banks.bundle.js` | Generalta bongeszo bundle az osszes specifikus bankkal. |
| `scripts/build-banks-bundle.js` | Specifikus bank bundle epitese. |
| `scripts/build-triage-embed.js` | Triage embed epitese. |
| `scripts/translate-bank.js` | Bankforditasi pipeline. |
| `scripts/audit-banks.js` | Szerkezeti es darabszam audit. |
| `scripts/audit-bank-quality.js` | Minosegi, redundancia- es tartalmi audit. |
| `scripts/audit-engine-selection.js` | Kerdesszelekcio determinisztikus/szimulacios auditja. |

Forrasbankot a `src/data/banks/` alatt kell modositani, majd a megfelelo build/audit pipeline-t futtatni. A nagy generalta bundle kezi javitasa elveszhet a kovetkezo buildnel.

## Webflow es publikus frontend

| Mappa/fajl | Felelosseg |
| --- | --- |
| `public/webflow/engine.js` | Landing integracio, i18n, kerdoiv runtime, engine intelligence, osszegzes, csomagvalasztas, checkout inditas. |
| `public/webflow/legal-consent.js` | Nyelvi jogi hozzajarulasi flow es consent receipt. |
| `public/webflow/legal-content.js` | Jogi tartalmak es hivatkozasok. |
| `public/webflow/checkout-pages.js` | Success/cancel oldalak nyelvi es allapotkezelo runtime-ja. |
| `src/services/webflow-embed-manager.service.js` | Admin dashboardon megjeleno aktualis loader snippetek es verzioazonositok. |
| `web/engine-embed.full.html` | Webflow Engine embedbe masolando rovid external-script loader. |
| `web/checkout-*-embed.html` | Success/cancel Webflow oldalak loader mintai. |
| `web/landing-design-variants.html` | Korabbi landing vizualis koncepciok; inspiracio, nem runtime forras. |

## Riport, PDF es email

| Fajl | Felelosseg |
| --- | --- |
| `src/services/analysis.service.js` | OpenAI Responses API alapjan strukturalt, 11 reszes, korosztalyos riport. |
| `src/services/report-contract.service.js` | Riportszerkezet ellenorzese es normalizalasa. |
| `src/services/report-v2.service.js` | Strukturalt riport V2 adatai es kiegeszito tartalom. |
| `src/services/pdf.service.js` | Lokalizalt PDFKit riport generalasa, fontok, oldaltoresek. |
| `src/services/shareable-summary-pdf.service.js` | Plus csomag megoszthato osszefoglaloja. |
| `src/services/plus-content.service.js` | Plus jogosultsagok es kiegeszito tartalom. |
| `src/services/email.service.js` | Riport, szerzodes, emlekezteto es admin email kuldes. |
| `src/templates/` | Email HTML/szoveg sablonok. |

## Fizetes, szamlazas es post-payment

| Fajl | Felelosseg |
| --- | --- |
| `src/config/products.js` | Ketcsomagos ar- es jogosultsagkatalogus. |
| `src/services/stripe.service.js` | Stripe Checkout es sessionmuveletek. |
| `src/services/webhook.service.js` | Stripe webhook idempotencia, fizetesi allapot, queue es invoice claim. |
| `src/services/invoice.service.js` | Szamlazas allapotgep es Szamlazz.hu integracio. |
| `src/services/post-payment-monitoring.service.js` | Fizetes utani lanc megfigyelese. |
| `src/services/post-payment-recovery.service.js` | Elakadt fizetes/riport/email automatikus helyreallitasa. |
| `src/services/report-email-delivery.service.js` | Riport-email allapot es kezbesitesi munka. |
| `src/services/report-email-retry.service.js` | Ujraprobalasi logika. |

## Adatbazis es migraciok

| Mappa/fajl | Felelosseg |
| --- | --- |
| `src/db/db.js` | PostgreSQL pool es query helper. |
| `src/db/migrate.js` | Indulaskori migraciofuttatas. |
| `src/db/migrations/001...019` | Session, webhook, queue, email, invoice, alerts, Plus, consent, retention es security schema. |

Migraciot nem szabad atirni, ha mar eles adatbazison lefutott. Uj valtozashoz uj, monoton novekvo migracio kell.

## Admin Control Center

| Fajl | Felelosseg |
| --- | --- |
| `src/api/controllers/admin-dashboard.controller.js` | Dashboard HTML shell. |
| `public/admin-dashboard.js` | Dashboard UX, adatbetoltes, muveletek es navigacio. |
| `public/admin-dashboard.css` | Dashboard megjelenes. |
| `src/api/routes/admin.js` | Vedett admin API-k. |
| `src/services/admin-session.service.js` | Cookie/session alapu admin hitelesites. |
| `src/services/dashboard-metrics.service.js` | KPI-k es aggregalt statisztikak. |

## Dokumentacio

| Mappa | Tartalom |
| --- | --- |
| `docs/` | DPIA, GDPR, vendor, retention, breach, security es jogi kiadasi dokumentumok. |
| `docs/NEW_CHAT_HANDOFF/` | Aktualis uj-chat atadasi csomag. |

## Nem elsodleges forrasok

- `node_modules/`: telepitett fuggosegek, soha ne szerkeszd.
- `.codex-tmp/`, `tmp/`, `work/`: ideiglenes vagy generalasi kimenetek lehetnek.
- Kepernyokepek es exportok: vizualis referencia, nem futasi szerzodes.


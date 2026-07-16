// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when Railway hasn't expanded a reference variable and the raw
 * placeholder string (e.g. "${{ Postgres.PGHOST }}") was passed to the
 * container instead of the real value.
 */
function isUnexpandedRef(value) {
  return typeof value === "string" && value.trimStart().startsWith("${{");
}

/**
 * Require an env variable. Throws with a clear message that includes the
 * actual value received so unexpanded Railway reference variables are
 * immediately visible in the crash log.
 */
function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env variable: ${name} (received: ${JSON.stringify(value)})`);
  }

  if (isUnexpandedRef(value)) {
    throw new Error(
      `Env variable ${name} contains an unexpanded Railway reference variable: "${value}". ` +
        `Check that the variable is correctly linked in the Railway dashboard and that the ` +
        `referenced service is deployed and healthy.`
    );
  }

  return value;
}

function optional(name, fallback = null) {
  const value = process.env[name];

  if (!value) return fallback;

  if (isUnexpandedRef(value)) {
    throw new Error(
      `Env variable ${name} contains an unexpanded Railway reference variable: "${value}".`
    );
  }

  return value;
}

function optionalInt(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = optional(name, String(fallback));
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

function optionalBoolean(name, fallback = false) {
  const raw = optional(name, String(fallback));
  return String(raw).trim().toLowerCase() === "true";
}

// ---------------------------------------------------------------------------
// Database URL resolution
// ---------------------------------------------------------------------------

function resolveDatabaseUrl() {
  const explicit = process.env.DATABASE_URL;

  if (explicit) {
    if (isUnexpandedRef(explicit)) {
      return {
        error:
          `DATABASE_URL contains an unexpanded Railway reference variable: "${explicit}". ` +
          `Ensure the Postgres service is running and the variable is correctly linked.`
      };
    }

    return { url: explicit };
  }

  const vars = {
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE
  };

  const unexpanded = Object.entries(vars)
    .filter(([, v]) => isUnexpandedRef(v))
    .map(([k, v]) => `  ${k}="${v}"`);

  if (unexpanded.length > 0) {
    return {
      error:
        `The following PG* variables contain unexpanded Railway reference variables:\n` +
        unexpanded.join("\n") +
        `\nEnsure the Postgres service is running and each variable is correctly linked ` +
        `in the Railway dashboard under the neuromap-backend service variables tab.`
    };
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = vars;

  if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
    return {
      url: `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`
    };
  }

  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    error:
      `Missing required database configuration. ` +
      `Set DATABASE_URL or all of PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE. ` +
      `Missing: ${missing.join(", ")}`
  };
}

// ---------------------------------------------------------------------------
// Diagnostic dump
// ---------------------------------------------------------------------------

function logEnvDiagnostics() {
  const dbVars = ["DATABASE_URL", "PGHOST", "PGPORT", "PGUSER", "PGDATABASE"];

  const summary = dbVars.map((k) => {
    const v = process.env[k];

    if (!v) return `  ${k}=<not set>`;
    if (isUnexpandedRef(v)) return `  ${k}=<UNEXPANDED REF: "${v}">`;

    if (k === "DATABASE_URL") {
      return `  ${k}=${v.replace(/:([^:@]+)@/, ":***@")}`;
    }

    return `  ${k}=${v}`;
  });

  console.log("[env] Database variable diagnostics at startup:\n" + summary.join("\n"));
}

// ---------------------------------------------------------------------------
// Build and export the env object
// ---------------------------------------------------------------------------

logEnvDiagnostics();

const dbResult = resolveDatabaseUrl();

if (dbResult.error) {
  console.error(`[env] DATABASE configuration error (app will start in degraded mode):\n${dbResult.error}`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  DATABASE_URL: dbResult.url ?? null,
  DATABASE_ERROR: dbResult.error ?? null,

  OPENAI_API_KEY: required("OPENAI_API_KEY"),
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini",

  STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),
  STRIPE_PRICE_STANDARD_USD: optional("STRIPE_PRICE_STANDARD_USD", null),
  STRIPE_PRICE_PLUS_USD: optional("STRIPE_PRICE_PLUS_USD", null),

  RESEND_API_KEY: required("RESEND_API_KEY"),
  EMAIL_FROM: required("EMAIL_FROM"),

  SUCCESS_URL: required("SUCCESS_URL"),
  CANCEL_URL: required("CANCEL_URL"),

  APP_URL: required("APP_URL"),
  APP_BASE_URL:
    process.env.APP_BASE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3000"),
  BACKEND_PUBLIC_URL:
    optional("BACKEND_PUBLIC_URL", null) ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3000"),
  CORS_ORIGINS: optional(
    "CORS_ORIGINS",
    "https://neuromap-kids.webflow.io,https://neuromapkids.com,https://www.neuromapkids.com"
  ),

  META_PIXEL_ID: optional("META_PIXEL_ID", null),
  META_ACCESS_TOKEN: optional("META_ACCESS_TOKEN", null),

  ADMIN_TOKEN: optional("ADMIN_TOKEN", null),
  ADMIN_SESSION_TTL_MINUTES: optionalInt("ADMIN_SESSION_TTL_MINUTES", 480, {
    min: 5,
    max: 1440
  }),
  ADMIN_LEGACY_TOKEN_AUTH: optionalBoolean("ADMIN_LEGACY_TOKEN_AUTH", false),
  ADMIN_COOKIE_SECURE: optionalBoolean(
    "ADMIN_COOKIE_SECURE",
    (process.env.NODE_ENV || "development") === "production"
  ),
  CRON_SECRET: optional("CRON_SECRET", null),
  OBSERVATION_LINK_SECRET: optional("OBSERVATION_LINK_SECRET", null),

  ADMIN_ALERT_EMAIL: optional("ADMIN_ALERT_EMAIL", null),
  ADMIN_ALERT_COOLDOWN_MINUTES: optional("ADMIN_ALERT_COOLDOWN_MINUTES", "30"),
  ADMIN_OPERATIONAL_ALERT_MIN_LEVEL: optional("ADMIN_OPERATIONAL_ALERT_MIN_LEVEL", "warning"),
  ADMIN_OPERATIONAL_ALERT_WINDOW_HOURS: optional("ADMIN_OPERATIONAL_ALERT_WINDOW_HOURS", "24"),

  PG_POOL_MAX: optionalInt("PG_POOL_MAX", 10, { min: 1, max: 100 }),
  PG_CONNECTION_TIMEOUT_MS: optionalInt("PG_CONNECTION_TIMEOUT_MS", 5000, {
    min: 1000,
    max: 60000
  }),
  PG_IDLE_TIMEOUT_MS: optionalInt("PG_IDLE_TIMEOUT_MS", 30000, {
    min: 1000,
    max: 600000
  }),
  PG_QUERY_TIMEOUT_MS: optionalInt("PG_QUERY_TIMEOUT_MS", 30000, {
    min: 1000,
    max: 300000
  }),
  DATABASE_SSL_MODE: optional(
    "DATABASE_SSL_MODE",
    (process.env.NODE_ENV || "development") === "production" ? "require" : "disable"
  ),
  DATABASE_SSL_CA_BASE64: optional("DATABASE_SSL_CA_BASE64", null),
  RATE_LIMIT_BACKEND: optional("RATE_LIMIT_BACKEND", "database"),
  RATE_LIMIT_FAIL_OPEN: optionalBoolean("RATE_LIMIT_FAIL_OPEN", false),
  PUBLIC_SESSION_TOKEN_REQUIRED: optionalBoolean("PUBLIC_SESSION_TOKEN_REQUIRED", true),

  WORKER_CONCURRENCY: optionalInt("WORKER_CONCURRENCY", 1, { min: 1, max: 64 }),
  WORKER_IDLE_SLEEP_MS: optionalInt("WORKER_IDLE_SLEEP_MS", 4000, { min: 500, max: 60000 }),
  WORKER_ERROR_SLEEP_MS: optionalInt("WORKER_ERROR_SLEEP_MS", 5000, { min: 1000, max: 120000 }),
  WORKER_STALE_REQUEUE_INTERVAL_MS: optionalInt("WORKER_STALE_REQUEUE_INTERVAL_MS", 60000, {
    min: 10000,
    max: 600000
  }),
  WORKER_STALE_JOB_MINUTES: optionalInt("WORKER_STALE_JOB_MINUTES", 15, { min: 2, max: 180 }),
  WORKER_HEARTBEAT_INTERVAL_MS: optionalInt("WORKER_HEARTBEAT_INTERVAL_MS", 30000, {
    min: 5000,
    max: 120000
  }),
  WORKER_MAX_ATTEMPTS: optionalInt("WORKER_MAX_ATTEMPTS", 4, { min: 1, max: 20 }),
  WORKER_RETRY_BASE_SECONDS: optionalInt("WORKER_RETRY_BASE_SECONDS", 60, {
    min: 5,
    max: 3600
  }),
  WORKER_RETRY_MAX_SECONDS: optionalInt("WORKER_RETRY_MAX_SECONDS", 900, {
    min: 30,
    max: 21600
  }),
  WORKER_EXPECTED_JOB_SECONDS: optionalInt("WORKER_EXPECTED_JOB_SECONDS", 90, { min: 20, max: 900 }),
  ENGINE_LIVE_AUDIT_LIMIT: optionalInt("ENGINE_LIVE_AUDIT_LIMIT", 100, {
    min: 1,
    max: 5000
  }),
  CAMPAIGN_TARGET_REPORTS_PER_DAY: optionalInt("CAMPAIGN_TARGET_REPORTS_PER_DAY", 1000, {
    min: 1,
    max: 100000
  }),

  PRIVACY_POLICY_URL: optional("PRIVACY_POLICY_URL", null),
  PRIVACY_POLICY_VERSION: optional("PRIVACY_POLICY_VERSION", "2026-07-15"),
  TERMS_URL: optional("TERMS_URL", null),
  TERMS_VERSION: optional("TERMS_VERSION", "2026-07-15"),
  CONSENT_POLICY_VERSION: optional("CONSENT_POLICY_VERSION", "2026-07-15"),
  POLICY_EFFECTIVE_DATE: optional("POLICY_EFFECTIVE_DATE", "2026-07-15"),
  CONSENT_RECEIPT_TTL_HOURS: optionalInt("CONSENT_RECEIPT_TTL_HOURS", 24, {
    min: 1,
    max: 168
  }),
  DATA_CONTROLLER_NAME: optional("DATA_CONTROLLER_NAME", null),
  DATA_CONTROLLER_ADDRESS: optional("DATA_CONTROLLER_ADDRESS", null),
  DATA_CONTROLLER_COUNTRY: optional("DATA_CONTROLLER_COUNTRY", null),
  PRIVACY_CONTACT_EMAIL: optional("PRIVACY_CONTACT_EMAIL", null),
  DPO_CONTACT_EMAIL: optional("DPO_CONTACT_EMAIL", null),
  EEA_REPRESENTATIVE: optional("EEA_REPRESENTATIVE", null),
  SUPERVISORY_AUTHORITY_NAME: optional("SUPERVISORY_AUTHORITY_NAME", null),
  SUPERVISORY_AUTHORITY_URL: optional("SUPERVISORY_AUTHORITY_URL", null),
  MARKETING_SERVER_EVENTS_ENABLED: optionalBoolean("MARKETING_SERVER_EVENTS_ENABLED", false),
  DATA_RETENTION_DAYS: optionalInt("DATA_RETENTION_DAYS", 90, { min: 7, max: 730 }),
  WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS: optionalInt("WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS", 14, {
    min: 1,
    max: 365
  }),
  LAUNCH_GATE_ENFORCED: optionalBoolean("LAUNCH_GATE_ENFORCED", false),
  PRODUCTION_CHECKOUT_ENABLED: optionalBoolean("PRODUCTION_CHECKOUT_ENABLED", true),
  LEGAL_REVIEW_APPROVED: optionalBoolean("LEGAL_REVIEW_APPROVED", false),
  DPIA_APPROVED: optionalBoolean("DPIA_APPROVED", false),
  CLINICAL_CONTENT_REVIEW_APPROVED: optionalBoolean("CLINICAL_CONTENT_REVIEW_APPROVED", false),
  PRIVACY_POLICY_PUBLISHED: optionalBoolean("PRIVACY_POLICY_PUBLISHED", false),
  TERMS_PUBLISHED: optionalBoolean("TERMS_PUBLISHED", false),
  CONSENT_MANAGER_CONFIGURED: optionalBoolean("CONSENT_MANAGER_CONFIGURED", false),
  VENDOR_DPA_REVIEWED: optionalBoolean("VENDOR_DPA_REVIEWED", false),
  SECURITY_REVIEW_APPROVED: optionalBoolean("SECURITY_REVIEW_APPROVED", false),

  INVOICE_PROVIDER: optional("INVOICE_PROVIDER", null),
  INVOICE_AUTO_CREATE: optional("INVOICE_AUTO_CREATE", null),
  SZAMLAZZHU_AGENT_KEY: optional("SZAMLAZZHU_AGENT_KEY", null)
};

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

  META_PIXEL_ID: optional("META_PIXEL_ID", null),
  META_ACCESS_TOKEN: optional("META_ACCESS_TOKEN", null),

  ADMIN_TOKEN: optional("ADMIN_TOKEN", null),
  CRON_SECRET: optional("CRON_SECRET", null),

  ADMIN_ALERT_EMAIL: optional("ADMIN_ALERT_EMAIL", null),
  ADMIN_ALERT_COOLDOWN_MINUTES: optional("ADMIN_ALERT_COOLDOWN_MINUTES", "30"),
  ADMIN_OPERATIONAL_ALERT_MIN_LEVEL: optional("ADMIN_OPERATIONAL_ALERT_MIN_LEVEL", "warning"),
  ADMIN_OPERATIONAL_ALERT_WINDOW_HOURS: optional("ADMIN_OPERATIONAL_ALERT_WINDOW_HOURS", "24"),

  WORKER_CONCURRENCY: optionalInt("WORKER_CONCURRENCY", 1, { min: 1, max: 8 }),
  WORKER_IDLE_SLEEP_MS: optionalInt("WORKER_IDLE_SLEEP_MS", 4000, { min: 500, max: 60000 }),
  WORKER_ERROR_SLEEP_MS: optionalInt("WORKER_ERROR_SLEEP_MS", 5000, { min: 1000, max: 120000 }),
  WORKER_STALE_REQUEUE_INTERVAL_MS: optionalInt("WORKER_STALE_REQUEUE_INTERVAL_MS", 60000, {
    min: 10000,
    max: 600000
  }),
  WORKER_STALE_JOB_MINUTES: optionalInt("WORKER_STALE_JOB_MINUTES", 15, { min: 2, max: 180 }),
  WORKER_EXPECTED_JOB_SECONDS: optionalInt("WORKER_EXPECTED_JOB_SECONDS", 90, { min: 20, max: 900 }),
  CAMPAIGN_TARGET_REPORTS_PER_DAY: optionalInt("CAMPAIGN_TARGET_REPORTS_PER_DAY", 1000, {
    min: 1,
    max: 100000
  }),

  INVOICE_PROVIDER: optional("INVOICE_PROVIDER", null),
  INVOICE_AUTO_CREATE: optional("INVOICE_AUTO_CREATE", null),
  SZAMLAZZHU_AGENT_KEY: optional("SZAMLAZZHU_AGENT_KEY", null)
};

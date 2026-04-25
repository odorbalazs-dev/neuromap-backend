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
          `Ensure the Postgres service is running and the variable is correctly linked.`,
      };
    }

    return { url: explicit };
  }

  const vars = {
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE,
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
        `in the Railway dashboard under the neuromap-backend service variables tab.`,
    };
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = vars;

  if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
    return {
      url: `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`,
    };
  }

  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    error:
      `Missing required database configuration. ` +
      `Set DATABASE_URL or all of PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE. ` +
      `Missing: ${missing.join(", ")}`,
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

  ADMIN_TOKEN: optional("ADMIN_TOKEN", null),
};
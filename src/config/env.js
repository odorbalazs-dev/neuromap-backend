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
 * Require an env variable.  Throws with a clear message that includes the
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
        `referenced service (e.g. Postgres) is deployed and healthy.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Database URL resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the Postgres connection string from either DATABASE_URL or the
 * individual PG* variables.
 *
 * Returns { url: string } on success, or { error: string } when the config is
 * missing / contains unexpanded Railway reference variables.  A deferred error
 * lets the process start so the /health endpoint can report what it actually
 * received, making remote debugging much easier.
 */
function resolveDatabaseUrl() {
  // --- Prefer an explicit DATABASE_URL ---
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

  // --- Fall back to individual PG* variables ---
  const vars = {
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE,
  };

  // Detect unexpanded reference variables and report each one explicitly.
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
    return { url: `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}` };
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
// Diagnostic dump — always printed at startup so Railway logs show exactly
// what the container received, even when variables look correct on the dashboard.
// ---------------------------------------------------------------------------

function logEnvDiagnostics() {
  const dbVars = ["DATABASE_URL", "PGHOST", "PGPORT", "PGUSER", "PGDATABASE"];
  // Redact secrets but show whether they are set and whether they look like
  // unexpanded reference variables.
  const summary = dbVars.map((k) => {
    const v = process.env[k];
    if (!v) return `  ${k}=<not set>`;
    if (isUnexpandedRef(v)) return `  ${k}=<UNEXPANDED REF: "${v}">`;
    if (k === "DATABASE_URL") {
      // Redact password in connection string
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
  // Log clearly but do NOT throw — the process will start and /health will
  // surface the error so it is visible without needing to inspect crash logs.
  console.error(`[env] DATABASE configuration error (app will start in degraded mode):\n${dbResult.error}`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  // null when database config is missing/broken — callers must guard against this.
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
};
import pg from "pg";
import { env } from "../config/env.js";
import { resolveDatabaseSslConfig } from "../config/database-ssl.js";

function buildSslConfig() {
  return sslDecision.ssl;
}

const sslDecision = resolveDatabaseSslConfig({
  connectionString: env.DATABASE_URL,
  mode: env.DATABASE_SSL_MODE,
  caBase64: env.DATABASE_SSL_CA_BASE64
});

console.log("[db] SSL configuration", {
  host: sslDecision.host || "unavailable",
  requestedMode: sslDecision.requestedMode,
  normalizedMode: sslDecision.normalizedMode,
  effectiveMode: sslDecision.effectiveMode,
  certificateVerified: sslDecision.certificateVerified,
  reason: sslDecision.reason
});

if (sslDecision.deprecatedMode) {
  console.warn(
    "[db] DATABASE_SSL_MODE=no-verify is deprecated and was treated as auto. " +
      "Remove the Railway Shared/Reference Variable or set the service variable to auto."
  );
}

if (
  sslDecision.host?.endsWith(".proxy.rlwy.net") &&
  !sslDecision.certificateVerified
) {
  console.warn(
    "[db] Railway public proxy detected. The connection is encrypted, but the " +
      "provider certificate is not verified. Prefer a Railway Postgres DATABASE_URL " +
      "variable reference/private network for service-to-service traffic."
  );
}

// Pool is only created when a valid DATABASE_URL is available.  When the
// database config is broken (e.g. unexpanded Railway reference variables) the
// module still loads so the rest of the app — including /health — can start.
const pool = env.DATABASE_URL
  ? new pg.Pool({
      connectionString: env.DATABASE_URL,
      max: env.PG_POOL_MAX,
      connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT_MS,
      idleTimeoutMillis: env.PG_IDLE_TIMEOUT_MS,
      query_timeout: env.PG_QUERY_TIMEOUT_MS,
      statement_timeout: env.PG_QUERY_TIMEOUT_MS,
      application_name: `neuromap-${env.SERVICE_ROLE}`,
      ssl: buildSslConfig(),
    })
  : null;

if (pool) {
  pool.on("error", (err) => {
    console.error("Unexpected PG pool error:", err);
  });
} else {
  console.error(
    "[db] Pool not initialised — database is unavailable. Reason:\n" +
      (env.DATABASE_ERROR ?? "DATABASE_URL is null")
  );
}

export const db = {
  query: (text, params) => {
    if (!pool) {
      throw new Error(
        "Database is not available. " +
          (env.DATABASE_ERROR ?? "DATABASE_URL was not set at startup.")
      );
    }
    return pool.query(text, params);
  },
  connect: () => {
    if (!pool) {
      throw new Error(
        "Database is not available. " +
          (env.DATABASE_ERROR ?? "DATABASE_URL was not set at startup.")
      );
    }
    return pool.connect();
  },
  close: () => (pool ? pool.end() : Promise.resolve())
};

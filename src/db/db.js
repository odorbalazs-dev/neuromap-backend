import pg from "pg";
import { env } from "../config/env.js";

function buildSslConfig() {
  const mode = String(env.DATABASE_SSL_MODE || "disable").toLowerCase();

  if (mode === "disable") return false;

  const ssl = {
    rejectUnauthorized: mode !== "no-verify"
  };

  if (env.DATABASE_SSL_CA_BASE64) {
    ssl.ca = Buffer.from(env.DATABASE_SSL_CA_BASE64, "base64").toString("utf8");
  }

  return ssl;
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

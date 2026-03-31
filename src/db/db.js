import pg from "pg";
import { env } from "../config/env.js";

// Pool is only created when a valid DATABASE_URL is available.  When the
// database config is broken (e.g. unexpanded Railway reference variables) the
// module still loads so the rest of the app — including /health — can start.
const pool = env.DATABASE_URL
  ? new pg.Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
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
};
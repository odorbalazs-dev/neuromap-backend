import pg from "pg";
import { env } from "../config/env.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});

export const db = {
  query: (text, params) => pool.query(text, params),
};
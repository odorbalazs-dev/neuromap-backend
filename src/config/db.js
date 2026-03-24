import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.databaseUrl,
  ssl:
    env.nodeEnv === "development"
      ? false
      : { rejectUnauthorized: false }
});

export async function testDb() {
  await db.query("SELECT 1");
}
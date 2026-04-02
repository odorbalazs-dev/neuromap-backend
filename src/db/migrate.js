import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

export async function runMigrations() {
  console.log("[migrate] Starting database migrations...");

  let files;
  try {
    const entries = await readdir(MIGRATIONS_DIR);
    files = entries.filter((f) => f.endsWith(".sql")).sort();
  } catch (err) {
    console.error("[migrate] Failed to read migrations directory:", err);
    throw err;
  }

  if (files.length === 0) {
    console.log("[migrate] No migration files found.");
    return;
  }

  for (const file of files) {
    const filePath = join(MIGRATIONS_DIR, file);
    let sql;
    try {
      sql = await readFile(filePath, "utf8");
    } catch (err) {
      console.error(`[migrate] Failed to read migration file ${file}:`, err);
      throw err;
    }

    try {
      await db.query(sql);
      console.log(`[migrate] ✓ ${file}`);
    } catch (err) {
      // Ignore "already exists" errors so re-running migrations on an
      // existing database is safe.  Any other error is fatal.
      if (isAlreadyExistsError(err)) {
        console.log(`[migrate] ✓ ${file} (skipped — objects already exist)`);
      } else {
        console.error(`[migrate] ✗ ${file} failed:`, err.message);
        throw err;
      }
    }
  }

  console.log("[migrate] All migrations complete.");
}

/**
 * Returns true for Postgres errors that indicate the object being created
 * already exists (duplicate_table, duplicate_object, duplicate_column, etc.).
 * These are safe to ignore when re-running idempotent-ish migrations.
 */
function isAlreadyExistsError(err) {
  const SAFE_CODES = new Set([
    "42P07", // duplicate_table
    "42710", // duplicate_object  (constraint, index, …)
    "42701", // duplicate_column
    "42P06", // duplicate_schema
    "23505", // unique_violation   (e.g. INSERT … ON CONFLICT not used)
  ]);
  return SAFE_CODES.has(err.code);
}

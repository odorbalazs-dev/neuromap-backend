import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { db } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");
const MIGRATION_LOCK_ID = 719_420_613;

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

  const client = await db.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const filePath = join(MIGRATIONS_DIR, file);
      let sql;
      try {
        sql = await readFile(filePath, "utf8");
      } catch (err) {
        console.error(`[migrate] Failed to read migration file ${file}:`, err);
        throw err;
      }

      const checksum = createHash("sha256").update(sql).digest("hex");
      const applied = await client.query(
        "SELECT checksum FROM schema_migrations WHERE filename = $1",
        [file]
      );

      if (applied.rows[0]) {
        if (applied.rows[0].checksum !== checksum) {
          throw new Error(`Applied migration ${file} has changed on disk.`);
        }
        console.log(`[migrate] ok ${file} (already applied)`);
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await recordMigration(client, file, checksum);
        await client.query("COMMIT");
        console.log(`[migrate] ok ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");

        // Existing installations predate schema_migrations. Legacy DDL can
        // therefore report an object that was already created successfully.
        if (isAlreadyExistsError(err)) {
          await client.query("BEGIN");
          try {
            await recordMigration(client, file, checksum);
            await client.query("COMMIT");
            console.log(`[migrate] ok ${file} (legacy schema recorded)`);
          } catch (recordError) {
            await client.query("ROLLBACK");
            throw recordError;
          }
        } else {
          console.error(`[migrate] failed ${file}:`, err.message);
          throw err;
        }
      }
    }

    console.log("[migrate] All migrations complete.");
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      client.release();
    }
  }
}

async function recordMigration(client, filename, checksum) {
  await client.query(
    `
      INSERT INTO schema_migrations (filename, checksum)
      VALUES ($1, $2)
      ON CONFLICT (filename) DO NOTHING
    `,
    [filename, checksum]
  );
}

/**
 * Returns true for Postgres errors that indicate the object being created
 * already exists (duplicate_table, duplicate_object, duplicate_column, etc.).
 * These are safe to ignore when re-running idempotent-ish migrations.
 */
function isAlreadyExistsError(err) {
  const SAFE_CODES = new Set([
    "42P07", // duplicate_table
    "42710", // duplicate_object (constraint, index, ...)
    "42701", // duplicate_column
    "42P06" // duplicate_schema
  ]);

  return SAFE_CODES.has(err.code);
}

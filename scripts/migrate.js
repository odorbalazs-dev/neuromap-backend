import { runMigrations } from "../src/db/migrate.js";
import { db } from "../src/db/db.js";

// Run in an isolated maintenance process; never store owner credentials in a web/worker service.
try {
  await runMigrations();
} catch (error) {
  console.error("[migrate] Maintenance failed", { code: error.code || "MIGRATION_FAILED" });
  process.exitCode = 1;
} finally {
  await db.close();
}

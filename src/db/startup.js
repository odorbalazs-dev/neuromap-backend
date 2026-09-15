import { env } from "../config/env.js";
import { db } from "./db.js";
import { runMigrations, verifyAppliedMigrations } from "./migrate.js";

export async function verifyRuntimePrivileges(client) {
  // Runtime credentials must not be able to assume an owner or maintenance role.
  const { rows: [role] } = await client.query(`
    SELECT r.rolname, r.rolsuper, r.rolcreaterole, r.rolcreatedb,
           r.rolreplication, r.rolbypassrls,
           current_user <> session_user AS changed_identity,
           EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member = r.oid) AS memberships,
           has_database_privilege(current_database(), 'CREATE') AS database_create,
           has_database_privilege(current_database(), 'TEMP') AS database_temp,
           EXISTS (SELECT 1 FROM pg_database d WHERE d.datname = current_database() AND d.datdba = r.oid) AS database_owner,
           EXISTS (SELECT 1 FROM pg_namespace n WHERE n.nspname NOT LIKE 'pg_%'
             AND n.nspname <> 'information_schema' AND has_schema_privilege(n.oid, 'CREATE')) AS schema_create,
           EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relowner = r.oid) AS object_owner,
           EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
               AND has_table_privilege(c.oid, 'TRUNCATE,TRIGGER,REFERENCES')) AS table_ddl,
           has_table_privilege('public.schema_migrations', 'INSERT,UPDATE,DELETE') AS migration_write,
           EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.prosecdef AND has_function_privilege(p.oid, 'EXECUTE')) AS security_definer
    FROM pg_roles r WHERE r.rolname = current_user
  `);
  if (!role || Object.entries(role).some(([key, value]) => key !== "rolname" && value === true)) {
    throw new Error("DATABASE_RUNTIME_PRIVILEGES_UNSAFE");
  }
  return role.rolname;
}

export async function verifyRuntimeDatabase(database = db) {
  const client = await database.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const role = await verifyRuntimePrivileges(client);
    const migrations = await verifyAppliedMigrations(client);
    await client.query("COMMIT");
    return { role, migrations, mode: "verify-only" };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  if (env.NODE_ENV !== "production") return runMigrations();
  const result = await verifyRuntimeDatabase();
  console.log("[db] Runtime privileges and migration checksums verified", result);
  return result;
}

import assert from "node:assert/strict";
import { resolveDatabaseSslConfig } from "../src/config/database-ssl.js";
import { resolveServiceRole } from "../src/config/service-role.js";

const workerByName = resolveServiceRole(
  { RAILWAY_SERVICE_NAME: "neuromap-analysis-worker" },
  ["node", "scripts/railway-start.js"]
);
assert.equal(workerByName.role, "worker");
assert.equal(workerByName.source, "railway-service-name");

const workerByEntrypoint = resolveServiceRole(
  {},
  ["node", "C:\\app\\src\\jobs\\analysis.worker.js"]
);
assert.equal(workerByEntrypoint.role, "worker");
assert.equal(workerByEntrypoint.source, "entrypoint");

const conflict = resolveServiceRole(
  {
    RAILWAY_SERVICE_ROLE: "web",
    RAILWAY_SERVICE_NAME: "neuromap-analysis-worker"
  },
  ["node", "scripts/railway-start.js"]
);
assert.equal(conflict.role, "worker");
assert.ok(conflict.warning);

const invalid = resolveServiceRole(
  { RAILWAY_SERVICE_ROLE: "workre" },
  ["node", "scripts/railway-start.js"]
);
assert.ok(invalid.error);

const privateRailway = resolveDatabaseSslConfig({
  connectionString: "postgresql://user:secret@postgres.railway.internal:5432/railway",
  mode: "auto"
});
assert.equal(privateRailway.effectiveMode, "disable");
assert.equal(privateRailway.ssl, false);

const railwayProxy = resolveDatabaseSslConfig({
  connectionString: "postgresql://user:secret@yamanote.proxy.rlwy.net:38420/railway",
  mode: "auto"
});
assert.equal(railwayProxy.effectiveMode, "require");
assert.equal(railwayProxy.ssl.rejectUnauthorized, false);

const deprecatedNoVerify = resolveDatabaseSslConfig({
  connectionString: "postgresql://user:secret@postgres.railway.internal:5432/railway",
  mode: "no-verify"
});
assert.equal(deprecatedNoVerify.requestedMode, "no-verify");
assert.equal(deprecatedNoVerify.normalizedMode, "auto");
assert.equal(deprecatedNoVerify.deprecatedMode, true);
assert.equal(deprecatedNoVerify.effectiveMode, "disable");
assert.equal(deprecatedNoVerify.ssl, false);

const publicDatabase = resolveDatabaseSslConfig({
  connectionString: "postgresql://user:secret@db.example.com:5432/app",
  mode: "auto"
});
assert.equal(publicDatabase.effectiveMode, "verify-full");
assert.equal(publicDatabase.ssl.rejectUnauthorized, true);

console.log("Railway runtime smoke tests passed.");

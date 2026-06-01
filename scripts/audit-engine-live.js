import "dotenv/config";
import pg from "pg";
import { buildEngineLiveDecisionAudit } from "../src/services/engine-live-audit.service.js";

function getArgValue(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  if (!arg) return fallback;
  return arg.slice(prefix.length);
}

function clampLimit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.min(Math.max(Math.round(number), 10), 1000);
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${Math.round(number * 100)}%`;
}

function printDistribution(title, rows = []) {
  console.log(`\n${title}`);

  if (!rows.length) {
    console.log("- none");
    return;
  }

  rows.forEach((row) => {
    console.log(`- ${row.key}: ${row.count}`);
  });
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

  if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  }

  throw new Error(
    "Missing database config. Set DATABASE_URL or PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE."
  );
}

async function main() {
  const limit = clampLimit(
    getArgValue("limit", process.env.ENGINE_LIVE_AUDIT_LIMIT || 100)
  );
  const strict = process.argv.includes("--strict");

  const pool = new pg.Pool({
    connectionString: getDatabaseUrl(),
    ssl: {
      rejectUnauthorized: false
    }
  });

  let result;

  try {
    result = await pool.query(
      `
      SELECT
        id,
        lang,
        payment_status,
        analysis_status,
        report_email_status,
        payload,
        created_at,
        updated_at,
        paid_at
      FROM sessions
      WHERE payload IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );
  } finally {
    await pool.end();
  }

  const audit = buildEngineLiveDecisionAudit(result.rows);
  const summary = audit.summary;

  console.log("\n=== ENGINE LIVE DECISION AUDIT ===");
  console.log(`Loaded sessions: ${summary.loadedSessions}`);
  console.log(`Auditable sessions: ${summary.auditableSessions}`);
  console.log(`Skipped sessions: ${summary.skippedSessions || summary.nonAuditableSessions || 0}`);
  console.log(`Skipped legacy sessions: ${summary.skippedLegacySessions || 0}`);
  console.log(`Clean sessions: ${summary.cleanSessions}`);
  console.log(`Review sessions: ${summary.reviewSessions}`);
  console.log(`Critical sessions: ${summary.criticalSessions}`);
  console.log(`Warning sessions: ${summary.warningSessions}`);
  console.log(`Info sessions: ${summary.infoSessions || 0}`);
  console.log(`Primary mismatches: ${summary.primaryMismatchCount}`);
  console.log(`Extra decision mismatches: ${summary.extraMismatchCount}`);
  console.log(`Average confidence: ${summary.averageConfidence ?? "-"}`);
  console.log(`Average overlap: ${summary.averageOverlapScore ?? "-"}`);
  console.log(`Review rate: ${formatPercent(
    summary.auditableSessions
      ? summary.reviewSessions / summary.auditableSessions
      : 0
  )}`);

  printDistribution("Issue levels", audit.distributions.issueLevels);
  printDistribution("Issue codes", audit.distributions.issueCodes);
  printDistribution("Stored primary domains", audit.distributions.storedPrimaryDomains);
  printDistribution("Engine v2 primary domains", audit.distributions.enginePrimaryDomains);
  printDistribution("Decision quality", audit.distributions.decisionQuality);

  if (audit.reviewQueue.length) {
    console.log("\nReview queue (PII-redacted)");
    audit.reviewQueue.slice(0, 12).forEach((session) => {
      console.log(
        `- ${session.shortId || session.id}: ${session.issueLevel}; ` +
        `stored=${session.stored?.primaryDomain || "-"} -> engine=${session.engine?.primaryDomain || "-"}; ` +
        `extra stored=${session.stored?.askedExtra ? "yes" : "no"} engine=${session.engine?.shouldAskExtra ? "yes" : "no"}; ` +
        `issues=${session.issueCodes.join(", ")}`
      );
    });
  }

  if (strict && (summary.criticalSessions > 0 || summary.primaryMismatchCount > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Engine live decision audit failed:", error.message);
  process.exit(1);
});

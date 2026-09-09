import { db } from "../db/db.js";
import { runDataLifecycle } from "./data-lifecycle.service.js";
import { runPostPaymentRecoveryV2 } from "./post-payment-recovery.service.js";
import { runProductionHealthAlertCheck, runOperationalAlertCheck } from "./admin-alert.service.js";

export const OPERATIONAL_TASKS = Object.freeze({
  data_lifecycle: { intervalSeconds: 3600, run: () => runDataLifecycle({ sessionLimit: 200, webhookLimit: 2000, observationLimit: 500, operationalLimit: 5000 }) },
  post_payment_recovery: { intervalSeconds: 300, run: () => runPostPaymentRecoveryV2({ limit: 20 }) },
  production_health_alert: { intervalSeconds: 300, run: () => runProductionHealthAlertCheck({ cooldownMinutes: 30 }) },
  operational_alert: { intervalSeconds: 900, run: () => runOperationalAlertCheck({ cooldownMinutes: 30 }) }
});

function countersOnly(value) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([key, v]) =>
    /^[a-zA-Z_]{1,50}$/.test(key) && (typeof v === "number" || typeof v === "boolean")));
}

function hasFailures(value) {
  if (!value || typeof value !== "object") return false;
  if (value.ok === false || Number(value.failed) > 0 || value.reason === "missing_admin_alert_email") return true;
  return Object.entries(value.summary || {}).some(([key, count]) => /Failed$/.test(key) && Number(count) > 0);
}

export async function runRecordedOperation(task, operation, source = "cron") {
  const started = Date.now();
  const inserted = await db.query(`INSERT INTO operational_runs(task, source, status)
    VALUES ($1, $2, 'running') RETURNING id`, [task, source]);
  const id = inserted.rows[0].id;
  try {
    const result = await operation();
    const failed = hasFailures(result);
    const summary = { ...countersOnly(result), ...countersOnly(result?.summary) };
    for (const group of ["sessions", "webhooks", "observations", "operationalState"]) {
      for (const [key, value] of Object.entries(countersOnly(result?.[group]))) summary[`${group}_${key}`] = value;
    }
    const errorCode = result?.reason === "missing_admin_alert_email" ? "MISSING_ALERT_RECIPIENT" : "PARTIAL_FAILURE";
    await db.query(`UPDATE operational_runs SET status = $2, finished_at = NOW(), duration_ms = $3,
      summary = $4, error_code = $5 WHERE id = $1`,
    [id, failed ? "failed" : "succeeded", Date.now() - started, summary, failed ? errorCode : null]);
    console.log("[operations] run complete", { runId: id, task, source, failed });
    return result;
  } catch (error) {
    await db.query(`UPDATE operational_runs SET status = 'failed', finished_at = NOW(),
      duration_ms = $2, error_code = 'OPERATION_FAILED' WHERE id = $1`, [id, Date.now() - started]);
    throw error;
  }
}

export async function runDueOperationalTasks() {
  for (const [task, definition] of Object.entries(OPERATIONAL_TASKS)) {
    await db.query(`INSERT INTO operational_schedule(task) VALUES ($1) ON CONFLICT DO NOTHING`, [task]);
    const claimed = await db.query(`UPDATE operational_schedule SET lease_token = gen_random_uuid(),
      locked_until = NOW() + INTERVAL '15 minutes'
      WHERE task = $1 AND next_run_at <= NOW() AND (locked_until IS NULL OR locked_until < NOW())
      RETURNING lease_token`, [task]);
    const lease = claimed.rows[0]?.lease_token;
    if (!lease) continue;
    const heartbeat = setInterval(() => {
      db.query(`UPDATE operational_schedule SET locked_until = NOW() + INTERVAL '15 minutes'
        WHERE task = $1 AND lease_token = $2`, [task, lease]).catch(error =>
        console.error("[operations] lease heartbeat failed", { task, code: error.code }));
    }, 30000);
    heartbeat.unref();
    let delay = definition.intervalSeconds;
    try {
      const result = await runRecordedOperation(task, definition.run, "worker-scheduler");
      if (hasFailures(result)) delay = Math.min(delay, 300);
    } catch (error) {
      delay = Math.min(delay, 300);
      console.error("[operations] scheduled task failed", { task, code: error.code || "OPERATION_FAILED" });
    } finally {
      clearInterval(heartbeat);
      await db.query(`UPDATE operational_schedule SET next_run_at = NOW() + ($3::int * INTERVAL '1 second'),
        lease_token = NULL, locked_until = NULL WHERE task = $1 AND lease_token = $2`, [task, lease, delay]);
    }
  }
  await db.query(`UPDATE operational_runs SET status = 'abandoned', finished_at = NOW(),
    error_code = 'PROCESS_INTERRUPTED' WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour'`);
  await db.query(`DELETE FROM operational_runs WHERE started_at < NOW() - INTERVAL '180 days'`);
  // An operator or the recovery service may have completed a previously failed delivery.
  await db.query(`UPDATE post_payment_outbox o SET status = 'done', completed_at = NOW(),
    payload = '{}', last_error_code = NULL, lease_token = NULL, locked_until = NULL
    FROM sessions s WHERE s.id = o.session_id AND o.status = 'failed'
    AND o.last_error_code IS DISTINCT FROM 'DATA_ERASED'
    AND ((o.task = 'invoice' AND s.invoice_status = 'issued')
      OR (o.task = 'contract_confirmation' AND s.contract_confirmation_status = 'sent'))`);
  await db.query(`UPDATE post_payment_outbox o SET payload = '{}', status = 'failed',
    last_error_code = 'DATA_ERASED', lease_token = NULL, locked_until = NULL
    FROM sessions s WHERE s.id = o.session_id AND o.payload <> '{}'::jsonb
    AND (s.sensitive_data_erased_at IS NOT NULL OR s.data_redacted_at IS NOT NULL)`);
}

export async function getOperationalEvidence() {
  const [latest, recent, outbox] = await Promise.all([
    db.query(`SELECT DISTINCT ON(task) task, status, started_at, finished_at, duration_ms, summary, error_code
      FROM operational_runs ORDER BY task, started_at DESC`),
    db.query(`SELECT task, COUNT(*)::int AS runs, COUNT(*) FILTER(WHERE status = 'succeeded')::int AS succeeded,
      MAX(finished_at) FILTER(WHERE status = 'succeeded') AS last_success_at
      FROM operational_runs WHERE started_at > NOW() - INTERVAL '24 hours' GROUP BY task`),
    db.query(`SELECT task, status, COUNT(*)::int AS count, MIN(created_at) AS oldest_at
      FROM post_payment_outbox WHERE last_error_code IS DISTINCT FROM 'DATA_ERASED'
      GROUP BY task, status`)
  ]);
  const now = Date.now();
  const checks = Object.entries(OPERATIONAL_TASKS).map(([task, definition]) => {
    const row = recent.rows.find(r => r.task === task);
    const maxAgeSeconds = definition.intervalSeconds * 3;
    return { task, intervalSeconds: definition.intervalSeconds, ...row,
      healthy: Boolean(row?.last_success_at && now - new Date(row.last_success_at).getTime() < maxAgeSeconds * 1000) };
  });
  const outboxHealthy = !outbox.rows.some(row => row.status === "failed" ||
    (row.status !== "done" && now - new Date(row.oldest_at).getTime() > 30 * 60000));
  return { ok: checks.every(c => c.healthy) && outboxHealthy, outboxHealthy, checkedAt: new Date().toISOString(), checks, latest: latest.rows, outbox: outbox.rows };
}

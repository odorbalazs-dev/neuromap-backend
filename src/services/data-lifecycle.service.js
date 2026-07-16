import { db } from "../db/db.js";
import { env } from "../config/env.js";
import { eraseSessionSensitiveData } from "./data-governance.service.js";

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

async function eraseExpiredSessionBatch(limit) {
  const candidates = await db.query(
    `
    SELECT id
    FROM sessions
    WHERE sensitive_data_erased_at IS NULL
      AND data_redacted_at IS NULL
      AND retention_delete_at IS NOT NULL
      AND retention_delete_at <= NOW()
    ORDER BY retention_delete_at ASC
    LIMIT $1::int
    `,
    [limit]
  );

  const items = [];

  for (const row of candidates.rows) {
    try {
      const erased = await eraseSessionSensitiveData(
        row.id,
        "Automated erasure after the configured sensitive-data retention period."
      );
      items.push({ sessionId: row.id, ok: true, erasedAt: erased?.sensitive_data_erased_at });
    } catch (error) {
      items.push({
        sessionId: row.id,
        ok: false,
        error: String(error?.message || "Session erasure failed").slice(0, 500)
      });
    }
  }

  return {
    checked: candidates.rows.length,
    erased: items.filter((item) => item.ok).length,
    failed: items.filter((item) => !item.ok).length,
    items
  };
}

async function redactExpiredWebhookPayloads(limit) {
  const result = await db.query(
    `
    WITH candidates AS (
      SELECT id
      FROM webhook_events
      WHERE payload_redacted_at IS NULL
        AND created_at <= NOW() - ($1::int * INTERVAL '1 day')
      ORDER BY created_at ASC
      LIMIT $2::int
      FOR UPDATE SKIP LOCKED
    )
    UPDATE webhook_events event
    SET payload = jsonb_build_object(
          'redacted', TRUE,
          'provider', event.provider,
          'eventId', event.event_id,
          'eventType', event.event_type
        ),
        payload_redacted_at = NOW()
    FROM candidates
    WHERE event.id = candidates.id
    RETURNING event.id
    `,
    [env.WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS, limit]
  );

  return { redacted: result.rowCount };
}

async function expireObservationPrograms(limit) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const programs = await client.query(
      `
      WITH expired AS (
        SELECT id
        FROM observation_programs
        WHERE status = 'active'
          AND ends_at <= NOW()
        ORDER BY ends_at ASC
        LIMIT $1::int
        FOR UPDATE SKIP LOCKED
      )
      UPDATE observation_programs program
      SET status = 'completed',
          completed_at = COALESCE(program.completed_at, NOW()),
          updated_at = NOW()
      FROM expired
      WHERE program.id = expired.id
      RETURNING program.id
      `,
      [limit]
    );

    const programIds = programs.rows.map((row) => row.id);
    let cancelledFollowUps = 0;

    if (programIds.length > 0) {
      const followUps = await client.query(
        `
        UPDATE observation_follow_ups
        SET status = 'cancelled',
            error_message = 'Observation period ended.',
            updated_at = NOW()
        WHERE program_id = ANY($1::uuid[])
          AND status NOT IN ('sent', 'cancelled')
        `,
        [programIds]
      );
      cancelledFollowUps = followUps.rowCount;
    }

    await client.query("COMMIT");

    return {
      completedPrograms: programIds.length,
      cancelledFollowUps
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function purgeExpiredOperationalState(limit) {
  const [rateLimits, adminSessions, unusedConsentReceipts] = await Promise.all([
    db.query(
      `
      DELETE FROM api_rate_limits
      WHERE bucket_key IN (
        SELECT bucket_key
        FROM api_rate_limits
        WHERE reset_at < NOW() - INTERVAL '1 day'
        ORDER BY reset_at ASC
        LIMIT $1::int
      )
      `,
      [limit]
    ),
    db.query(
      `
      DELETE FROM admin_sessions
      WHERE id IN (
        SELECT id
        FROM admin_sessions
        WHERE expires_at < NOW() - INTERVAL '7 days'
           OR revoked_at < NOW() - INTERVAL '30 days'
        ORDER BY expires_at ASC
        LIMIT $1::int
      )
      `,
      [limit]
    ),
    db.query(
      `
      DELETE FROM consent_events
      WHERE id IN (
        SELECT consent.id
        FROM consent_events consent
        LEFT JOIN sessions session
          ON session.consent_event_id = consent.id
        WHERE session.id IS NULL
          AND consent.used_at IS NULL
          AND consent.expires_at < NOW() - INTERVAL '1 day'
        ORDER BY consent.expires_at ASC
        LIMIT $1::int
      )
      `,
      [limit]
    )
  ]);

  return {
    deletedRateLimitBuckets: rateLimits.rowCount,
    deletedAdminSessions: adminSessions.rowCount,
    deletedUnusedConsentReceipts: unusedConsentReceipts.rowCount
  };
}

export async function runDataLifecycle({
  sessionLimit = 50,
  webhookLimit = 500,
  observationLimit = 100,
  operationalLimit = 1000
} = {}) {
  const limits = {
    sessionLimit: clampInteger(sessionLimit, 50, 1, 200),
    webhookLimit: clampInteger(webhookLimit, 500, 1, 2000),
    observationLimit: clampInteger(observationLimit, 100, 1, 500),
    operationalLimit: clampInteger(operationalLimit, 1000, 1, 5000)
  };

  const startedAt = new Date().toISOString();
  const sessions = await eraseExpiredSessionBatch(limits.sessionLimit);
  const webhooks = await redactExpiredWebhookPayloads(limits.webhookLimit);
  const observations = await expireObservationPrograms(limits.observationLimit);
  const operationalState = await purgeExpiredOperationalState(limits.operationalLimit);

  return {
    ok: sessions.failed === 0,
    version: "data-lifecycle-v1",
    startedAt,
    completedAt: new Date().toISOString(),
    configuredRetentionDays: {
      sensitiveSessionData: env.DATA_RETENTION_DAYS,
      webhookPayload: env.WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS
    },
    limits,
    sessions,
    webhooks,
    observations,
    operationalState
  };
}

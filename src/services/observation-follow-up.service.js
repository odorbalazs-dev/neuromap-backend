import { db } from "../db/db.js";
import { sendObservationFollowUpEmail } from "./email.service.js";
import {
  buildObservationProgramAccess,
  generateObservationTrend,
  getObservationProgramById
} from "./observation-program.service.js";
import { assertSessionProcessingAllowed } from "./data-governance.service.js";

async function claimNextFollowUp({ maxAttempts, staleSendingMinutes }) {
  const result = await db.query(
    `
    UPDATE observation_follow_ups follow_up
    SET
      status = 'sending',
      attempts = attempts + 1,
      last_attempt_at = NOW(),
      error_message = NULL,
      updated_at = NOW()
    WHERE follow_up.id = (
      SELECT candidate.id
      FROM observation_follow_ups candidate
      JOIN observation_programs program ON program.id = candidate.program_id
      JOIN sessions session ON session.id = program.session_id
      WHERE candidate.due_at <= NOW()
        AND candidate.attempts < $1::integer
        AND program.status = 'active'
        AND session.processing_restricted_at IS NULL
        AND session.sensitive_data_erased_at IS NULL
        AND session.data_redacted_at IS NULL
        AND (
          candidate.status IN ('pending', 'failed')
          OR (
            candidate.status = 'sending'
            AND candidate.last_attempt_at < NOW() - ($2::integer * INTERVAL '1 minute')
          )
        )
      ORDER BY candidate.due_at ASC, candidate.created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
    `,
    [maxAttempts, staleSendingMinutes]
  );

  return result.rows[0] || null;
}

async function markFollowUpSent(followUp, trend) {
  await db.query(
    `
    UPDATE observation_follow_ups
    SET status = 'sent', sent_at = NOW(), error_message = NULL, updated_at = NOW()
    WHERE id = $1
    `,
    [followUp.id]
  );

  if (followUp.kind !== "day_14") return;

  await db.query(
    `
    UPDATE observation_trend_reports
    SET status = 'sent', summary = $2, sent_at = NOW(), error_message = NULL, updated_at = NOW()
    WHERE program_id = $1
    `,
    [followUp.program_id, trend]
  );

  await db.query(
    `
    UPDATE observation_programs
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND status = 'active'
    `,
    [followUp.program_id]
  );
}

async function markFollowUpFailed(followUp, error) {
  const message = String(error?.message || "Observation follow-up failed.").slice(0, 1000);

  await db.query(
    `
    UPDATE observation_follow_ups
    SET status = 'failed', error_message = $2, updated_at = NOW()
    WHERE id = $1
    `,
    [followUp.id, message]
  );

  if (followUp.kind === "day_14") {
    await db.query(
      `
      UPDATE observation_trend_reports
      SET status = 'failed', error_message = $2, updated_at = NOW()
      WHERE program_id = $1
      `,
      [followUp.program_id, message]
    );
  }
}

async function deliverFollowUp(followUp) {
  const program = await getObservationProgramById(followUp.program_id);

  if (!program) {
    throw new Error("Observation program was not found.");
  }

  await assertSessionProcessingAllowed(program.session_id);

  if (program.payment_status !== "paid") {
    throw new Error("Observation follow-up requires a paid session.");
  }

  if (!program.email) {
    throw new Error("Observation program has no recipient email.");
  }

  const access = buildObservationProgramAccess(program);
  const trend = followUp.kind === "day_14"
    ? await generateObservationTrend(program.id)
    : null;

  const response = await sendObservationFollowUpEmail({
    to: program.email,
    lang: program.lang,
    name: program.name,
    kind: followUp.kind,
    observationUrl: access.url,
    trend
  });

  await markFollowUpSent(followUp, trend);

  return {
    followUpId: followUp.id,
    programId: followUp.program_id,
    kind: followUp.kind,
    status: "sent",
    providerId: response?.data?.id || response?.id || null
  };
}

export async function processObservationFollowUps({
  limit = 25,
  maxAttempts = 5,
  staleSendingMinutes = 20
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeMaxAttempts = Math.min(Math.max(Number(maxAttempts) || 5, 1), 10);
  const safeStaleMinutes = Math.min(
    Math.max(Number(staleSendingMinutes) || 20, 5),
    1440
  );
  const results = [];

  for (let index = 0; index < safeLimit; index += 1) {
    const followUp = await claimNextFollowUp({
      maxAttempts: safeMaxAttempts,
      staleSendingMinutes: safeStaleMinutes
    });

    if (!followUp) break;

    try {
      results.push(await deliverFollowUp(followUp));
    } catch (error) {
      await markFollowUpFailed(followUp, error);
      results.push({
        followUpId: followUp.id,
        programId: followUp.program_id,
        kind: followUp.kind,
        status: "failed",
        error: error?.message || "Observation follow-up failed."
      });
    }
  }

  return {
    ok: results.every((item) => item.status === "sent"),
    processed: results.length,
    sent: results.filter((item) => item.status === "sent").length,
    failed: results.filter((item) => item.status === "failed").length,
    results
  };
}

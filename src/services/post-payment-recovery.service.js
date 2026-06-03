import { db } from "../db/db.js";
import {
  enqueueAnalysisJob,
  requeueStaleJobs
} from "./analysis-queue.service.js";
import { markAnalysisQueued } from "./session.service.js";
import { retryReportEmailsBatch } from "./report-email-retry.service.js";

function normalizeNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    Math.max(Math.floor(number), min),
    max
  );
}

async function enqueuePaidSessionsWithoutActiveJobs({ limit = 20 } = {}) {
  const result = await db.query(
    `
    SELECT s.*
    FROM sessions s
    WHERE s.payment_status = 'paid'
      AND s.payload IS NOT NULL
      AND s.analysis_status IN ('pending', 'queued', 'processing', 'failed')
      AND NOT EXISTS (
        SELECT 1
        FROM analysis_jobs j
        WHERE j.session_id = s.id
          AND j.status IN ('queued', 'processing')
      )
    ORDER BY
      CASE s.analysis_status
        WHEN 'failed' THEN 1
        WHEN 'processing' THEN 2
        WHEN 'queued' THEN 3
        WHEN 'pending' THEN 4
        ELSE 5
      END,
      s.paid_at ASC NULLS LAST,
      s.updated_at ASC NULLS LAST,
      s.created_at ASC
    LIMIT $1
    `,
    [limit]
  );

  const results = [];

  for (const session of result.rows) {
    const queuedSession = await markAnalysisQueued(session.id);
    const job = await enqueueAnalysisJob(session.id);

    results.push({
      sessionId: session.id,
      previousAnalysisStatus: session.analysis_status,
      analysisStatus: queuedSession?.analysis_status || session.analysis_status,
      jobId: job?.id || null,
      status: job ? "queued" : "already_active_or_skipped"
    });
  }

  return {
    checked: result.rows.length,
    queued: results.filter((item) => item.status === "queued").length,
    results
  };
}

export async function runPostPaymentRecoveryV2(options = {}) {
  const staleJobMinutes = normalizeNumber(
    options.staleJobMinutes,
    20,
    5,
    1440
  );

  const jobLimit = normalizeNumber(
    options.jobLimit,
    20,
    1,
    100
  );

  const emailLimit = normalizeNumber(
    options.emailLimit,
    20,
    1,
    100
  );

  const maxEmailAttempts = normalizeNumber(
    options.maxEmailAttempts,
    3,
    1,
    10
  );

  const retryAfterMinutes = normalizeNumber(
    options.retryAfterMinutes,
    10,
    1,
    1440
  );

  const staleSendingMinutes = normalizeNumber(
    options.staleSendingMinutes,
    15,
    5,
    1440
  );

  const requeuedStaleJobs = await requeueStaleJobs({
    staleMinutes: staleJobMinutes
  });

  const missingJobRecovery = await enqueuePaidSessionsWithoutActiveJobs({
    limit: jobLimit
  });

  const emailRetry = await retryReportEmailsBatch(
    {
      limit: emailLimit,
      maxAttempts: maxEmailAttempts,
      retryAfterMinutes,
      staleSendingMinutes
    },
    { source: "post-payment-recovery-v2" }
  );

  return {
    ok: true,
    version: "post-payment-recovery-v2",
    generatedAt: new Date().toISOString(),
    options: {
      staleJobMinutes,
      jobLimit,
      emailLimit,
      maxEmailAttempts,
      retryAfterMinutes,
      staleSendingMinutes
    },
    summary: {
      staleJobsRequeued: requeuedStaleJobs.length,
      paidSessionsQueued: missingJobRecovery.queued,
      reportEmailsChecked: emailRetry.checked,
      reportEmailsSent: emailRetry.sent,
      reportEmailsFailed: emailRetry.failed
    },
    actions: [
      {
        key: "stale_analysis_jobs",
        label: "Stale processing jobs requeued",
        count: requeuedStaleJobs.length,
        items: requeuedStaleJobs.map((row) => row.id)
      },
      {
        key: "paid_sessions_without_active_job",
        label: "Paid sessions queued for analysis",
        count: missingJobRecovery.queued,
        items: missingJobRecovery.results
      },
      {
        key: "report_email_retry",
        label: "Report email retry batch",
        count: emailRetry.checked,
        items: emailRetry.results
      }
    ]
  };
}

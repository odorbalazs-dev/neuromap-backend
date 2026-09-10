import { db } from "../db/db.js";
import {
  enqueueAnalysisJob,
  requeueStaleJobs
} from "./analysis-queue.service.js";
import { markAnalysisQueued } from "./session.service.js";
import { retryReportEmailsBatch } from "./report-email-retry.service.js";
import { retryContractConfirmationsBatch } from "./contract-confirmation.service.js";
import { retryInvoicesBatch } from "./invoice.service.js";
import { expireRestrictedPayments } from './payment-attempt.service.js';
import { retrieveCheckoutSession, isLiveStripeRuntime } from './stripe.service.js';
import { fulfillVerifiedCheckout } from './payment-fulfillment.service.js';
import { recoverStripeEvents } from './webhook.service.js';
import { reconcileEmailDelivery } from './email-delivery-webhook.service.js';
import { discoverStripePayments } from './payment-discovery.service.js';

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
      AND s.processing_restricted_at IS NULL
      AND s.sensitive_data_erased_at IS NULL
      AND s.data_redacted_at IS NULL
      AND s.financial_status = 'clear'
      AND NOT EXISTS (SELECT 1 FROM analysis_jobs terminal WHERE terminal.session_id=s.id AND terminal.status='failed')
      AND COALESCE((SELECT SUM(history.attempts) FROM analysis_jobs history WHERE history.session_id=s.id),0) < 8
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
    LIMIT $1::int
    `,
    [limit]
  );

  const results = [];

  for (const session of result.rows) {
    const job = await enqueueAnalysisJob(session.id);
    const queuedSession = job ? await markAnalysisQueued(session.id) : null;

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

async function findCheckoutRecoveryCandidates({
  limit = 20,
  staleMinutes = 30
} = {}) {
  const result = await db.query(
    `
    SELECT
      id,
      name,
      email,
      lang,
      payment_status,
      checkout_started_at,
      checkout_cancelled_at,
      created_at,
      updated_at
    FROM sessions
    WHERE checkout_started_at IS NOT NULL
      AND COALESCE(payment_status, '') <> 'paid'
      AND processing_restricted_at IS NULL
      AND sensitive_data_erased_at IS NULL
      AND data_redacted_at IS NULL
      AND checkout_started_at < NOW() - ($1::int * INTERVAL '1 minute')
      AND checkout_started_at > NOW() - INTERVAL '14 days'
    ORDER BY checkout_started_at DESC NULLS LAST
    LIMIT $2::int
    `,
    [staleMinutes, limit]
  );

  return {
    checked: result.rows.length,
    candidates: result.rows.map((row) => ({
      sessionId: row.id,
      name: row.name || "",
      email: row.email || "",
      lang: row.lang || "hu",
      paymentStatus: row.payment_status || "unknown",
      checkoutStartedAt: row.checkout_started_at,
      checkoutCancelledAt: row.checkout_cancelled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  };
}

export async function runPostPaymentRecoveryV2(options = {}) {
  await reconcileEmailDelivery();
  let discovery = { checked: 0, recovered: 0, failed: 0 };
  try { discovery = { ...discovery, ...await discoverStripePayments() }; }
  catch (error) {
    discovery.failed = 1;
    console.error('[payment-discovery] deferred', { type: error?.name || 'Error' });
  }
  const paymentExpiry = await expireRestrictedPayments();
  const webhookRecovery = await recoverStripeEvents();
  const payments = await db.query(`SELECT p.* FROM payment_attempts p JOIN sessions s ON s.id=p.session_id
    WHERE p.livemode=$1 AND (s.payment_status='pending' OR p.status='open')
      AND p.created_at > NOW()-INTERVAL '28 days'
    ORDER BY p.checked_at ASC NULLS FIRST LIMIT 20`, [isLiveStripeRuntime()]);
  let paymentsRecovered = 0, paymentsFailed = 0;
  for (const attempt of payments.rows) {
    try {
      const checkout = await retrieveCheckoutSession(attempt.stripe_session_id);
      if (checkout.payment_status === 'paid') { await fulfillVerifiedCheckout(checkout); paymentsRecovered += 1; }
      await db.query('UPDATE payment_attempts SET checked_at=NOW(),status=$2 WHERE stripe_session_id=$1', [checkout.id,checkout.status]);
    } catch (error) {
      paymentsFailed++;
      await db.query('UPDATE payment_attempts SET checked_at=NOW() WHERE stripe_session_id=$1', [attempt.stripe_session_id]);
      console.error('[payment-recovery] deferred', { type: error?.name || 'Error' });
    }
  }
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

  const contractConfirmationRetry = await retryContractConfirmationsBatch({
    limit: emailLimit,
    maxAttempts: maxEmailAttempts,
    retryAfterMinutes,
    staleSendingMinutes
  });

  const invoiceRetry = await retryInvoicesBatch({
    limit: emailLimit,
    maxAttempts: maxEmailAttempts,
    staleProcessingMinutes: staleSendingMinutes
  });

  const checkoutRecovery = await findCheckoutRecoveryCandidates({
    limit: jobLimit,
    staleMinutes: retryAfterMinutes
  });

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
      discoveryChecked: discovery.checked,
      discoveryRecovered: discovery.recovered,
      discoveryFailed: discovery.failed,
      paymentExpiryFailed: paymentExpiry.failed,
      webhookRecoveryFailed: webhookRecovery.failed,
      paymentsFailed,
      expiredPayments: paymentExpiry.expired,
      webhookEventsRecovered: webhookRecovery.recovered,
      paymentsRecovered,
      staleJobsRequeued: requeuedStaleJobs.length,
      paidSessionsQueued: missingJobRecovery.queued,
      checkoutRecoveryCandidates: checkoutRecovery.checked,
      reportEmailsChecked: emailRetry.checked,
      reportEmailsSent: emailRetry.sent,
      reportEmailsFailed: emailRetry.failed,
      contractConfirmationsChecked: contractConfirmationRetry.checked,
      contractConfirmationsSent: contractConfirmationRetry.sent,
      contractConfirmationsFailed: contractConfirmationRetry.failed,
      invoicesChecked: invoiceRetry.checked,
      invoicesIssued: invoiceRetry.issued,
      invoicesFailed: invoiceRetry.failed,
      invoicesDeferred: invoiceRetry.deferred
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
        key: "checkout_recovery_candidates",
        label: "Started checkout but not paid",
        count: checkoutRecovery.checked,
        items: checkoutRecovery.candidates
      },
      {
        key: "report_email_retry",
        label: "Report email retry batch",
        count: emailRetry.checked,
        items: emailRetry.results
      },
      {
        key: "contract_confirmation_retry",
        label: "Contract confirmation retry batch",
        count: contractConfirmationRetry.checked,
        items: contractConfirmationRetry.results
      },
      {
        key: "invoice_retry",
        label: "Paid sessions missing an issued invoice",
        count: invoiceRetry.checked,
        items: invoiceRetry.results
      }
    ]
  };
}

import { db } from "../db/db.js";
import { getSessionById } from "./session.service.js";
import { sendContractConfirmationForSession } from "./contract-confirmation.service.js";
import { createInvoiceForPaidSession } from "./invoice.service.js";
import { TEST_INVOICE_EXCLUSION, isTestInvoicePayment } from "./invoice-payment-policy.js";

export async function enqueuePostPaymentTasks(client, sessionId, checkout) {
  const billing = checkout?.customer_details || {};
  const payload = {
    id: checkout?.id, amount_total: checkout?.amount_total, currency: checkout?.currency,
    livemode: checkout?.livemode, payment_status: checkout?.payment_status,
    metadata: { internalSessionId: checkout?.metadata?.internalSessionId },
    customer_details: { name: billing.name, email: billing.email,
      address: billing.address, tax_ids: billing.tax_ids }
  };
  const testPayment = isTestInvoicePayment(null, checkout);
  if (testPayment) {
    await client.query(`UPDATE sessions SET invoice_status = 'skipped', invoice_error = $2
      WHERE id = $1 AND payment_status = 'paid' AND invoice_status IS DISTINCT FROM 'issued'
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE session_id = $1 AND status = 'issued')`,
    [sessionId, TEST_INVOICE_EXCLUSION]);
  }
  await client.query(`INSERT INTO post_payment_outbox(session_id, task, payload)
    SELECT id, task, CASE WHEN task = 'invoice' THEN $2::jsonb ELSE '{}'::jsonb END
    FROM sessions CROSS JOIN unnest($3::text[]) AS task
    WHERE id = $1 AND payment_status = 'paid'
      AND sensitive_data_erased_at IS NULL AND data_redacted_at IS NULL
    ON CONFLICT (session_id, task) DO NOTHING`, [sessionId, JSON.stringify(payload),
      testPayment ? ["contract_confirmation"] : ["contract_confirmation", "invoice"]]);
}

export async function processNextPostPaymentTask() {
  const result = await db.query(`UPDATE post_payment_outbox SET status = 'processing',
    attempts = attempts + 1, lease_token = gen_random_uuid(), locked_until = NOW() + INTERVAL '5 minutes'
    WHERE id = (SELECT id FROM post_payment_outbox
      WHERE (status = 'pending' AND available_at <= NOW())
        OR (status = 'processing' AND locked_until < NOW())
      ORDER BY available_at LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING *`);
  const job = result.rows[0];
  if (!job) return { processed: false };
  try {
    let exclusion = null;
    const session = await getSessionById(job.session_id);
    if (!session || session.payment_status !== "paid" || session.sensitive_data_erased_at || session.data_redacted_at) {
      throw Object.assign(new Error("OUTBOX_SESSION_UNAVAILABLE"), { terminal: true });
    }
    if (job.task === "contract_confirmation") {
      if (session.contract_confirmation_status !== "sent") {
        const response = await sendContractConfirmationForSession(session.id, { maxAttempts: 10, retryAfterMinutes: 0, staleSendingMinutes: 5 });
        if (response.status !== "sent") throw new Error("CONTRACT_CONFIRMATION_NOT_SENT");
      }
    } else if (session.invoice_status !== "issued") {
      const checkout = job.payload;
      if (!isTestInvoicePayment(session, checkout) && !checkout.customer_details?.address?.country) {
        throw new Error("INVOICE_BILLING_ADDRESS_MISSING");
      }
      const invoice = await createInvoiceForPaidSession({ session, checkoutSession: checkout, throwOnError: true });
      if (invoice?.status === "skipped" && invoice.error_message === TEST_INVOICE_EXCLUSION) {
        exclusion = TEST_INVOICE_EXCLUSION;
      } else if (invoice?.status !== "issued") throw new Error("INVOICE_NOT_ISSUED");
    }
    await db.query(`UPDATE post_payment_outbox SET status = 'done', completed_at = NOW(),
      lease_token = NULL, locked_until = NULL, payload = '{}', last_error_code = $3
      WHERE id = $1 AND lease_token = $2`, [job.id, job.lease_token, exclusion]);
    return { processed: true, task: job.task, ...(exclusion ? { skipped: true, reason: exclusion } : {}) };
  } catch (error) {
    const terminal = error.terminal === true || job.attempts >= 10;
    const code = /^[A-Z_]{5,80}$/.test(error.message) ? error.message : "PROVIDER_REQUEST_FAILED";
    await db.query(`UPDATE post_payment_outbox SET status = $3, lease_token = NULL,
      locked_until = NULL, last_error_code = $4, available_at = NOW() + ($5::int * INTERVAL '1 second')
      WHERE id = $1 AND lease_token = $2`,
    [job.id, job.lease_token, terminal ? "failed" : "pending", code, Math.min(3600, 60 * 2 ** (job.attempts - 1))]);
    console.warn("[outbox] delivery deferred", { task: job.task, attempt: job.attempts, code });
    return { processed: true, failed: true, task: job.task, terminal };
  }
}

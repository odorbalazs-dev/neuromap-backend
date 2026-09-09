import { db } from "../db/db.js";
import { getSessionById } from "./session.service.js";
import { sendContractConfirmationForSession } from "./contract-confirmation.service.js";
import { createInvoiceForPaidSession } from "./invoice.service.js";

export async function enqueuePostPaymentTasks(client, sessionId, checkout) {
  const billing = checkout?.customer_details || {};
  const payload = {
    id: checkout?.id, amount_total: checkout?.amount_total, currency: checkout?.currency,
    customer_details: { name: billing.name, email: billing.email,
      address: billing.address, tax_ids: billing.tax_ids }
  };
  await client.query(`INSERT INTO post_payment_outbox(session_id, task, payload)
    SELECT id, task, CASE WHEN task = 'invoice' THEN $2::jsonb ELSE '{}'::jsonb END
    FROM sessions CROSS JOIN unnest(ARRAY['contract_confirmation', 'invoice']) AS task
    WHERE id = $1 AND payment_status = 'paid'
      AND sensitive_data_erased_at IS NULL AND data_redacted_at IS NULL
    ON CONFLICT (session_id, task) DO NOTHING`, [sessionId, JSON.stringify(payload)]);
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
      if (!checkout.customer_details?.address?.country) throw new Error("INVOICE_BILLING_ADDRESS_MISSING");
      const invoice = await createInvoiceForPaidSession({ session, checkoutSession: checkout, throwOnError: true });
      if (invoice?.status !== "issued") throw new Error("INVOICE_NOT_ISSUED");
    }
    await db.query(`UPDATE post_payment_outbox SET status = 'done', completed_at = NOW(),
      lease_token = NULL, locked_until = NULL, payload = '{}', last_error_code = NULL
      WHERE id = $1 AND lease_token = $2`, [job.id, job.lease_token]);
    return { processed: true, task: job.task };
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

import { db } from "../db/db.js";
import { sendContractConfirmationEmail } from "./email.service.js";

function normalizeInteger(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.floor(number), min), max);
}

function providerId(response) {
  return response?.data?.id || response?.id || null;
}

async function claimContractConfirmation(sessionId, {
  maxAttempts = 5,
  retryAfterMinutes = 10,
  staleSendingMinutes = 15
} = {}) {
  const result = await db.query(
    `
    UPDATE sessions
    SET contract_confirmation_status = 'sending',
        contract_confirmation_attempts = contract_confirmation_attempts + 1,
        contract_confirmation_last_attempt_at = NOW(),
        contract_confirmation_error = NULL,
        updated_at = NOW()
    WHERE id = $1
      AND payment_status = 'paid'
      AND sensitive_data_erased_at IS NULL
      AND data_redacted_at IS NULL
      AND NULLIF(BTRIM(email), '') IS NOT NULL
      AND contract_confirmation_attempts < $2::int
      AND (
        contract_confirmation_status = 'pending'
        OR (
          contract_confirmation_status = 'failed'
          AND COALESCE(contract_confirmation_last_attempt_at, TIMESTAMPTZ 'epoch')
            <= NOW() - ($3::int * INTERVAL '1 minute')
        )
        OR (
          contract_confirmation_status = 'sending'
          AND COALESCE(contract_confirmation_last_attempt_at, TIMESTAMPTZ 'epoch')
            <= NOW() - ($4::int * INTERVAL '1 minute')
        )
      )
    RETURNING *
    `,
    [sessionId, maxAttempts, retryAfterMinutes, staleSendingMinutes]
  );

  return result.rows[0] || null;
}

export async function sendContractConfirmationForSession(sessionId, options = {}) {
  const claimed = await claimContractConfirmation(sessionId, options);

  if (!claimed) {
    return {
      sessionId,
      status: "skipped"
    };
  }

  const attempt = Number(claimed.contract_confirmation_attempts || 0);

  try {
    const response = await sendContractConfirmationEmail({
      to: claimed.email,
      lang: claimed.lang,
      name: claimed.name,
      sessionId: claimed.id,
      packageCode: claimed.package_code,
      amountTotal: claimed.amount_total,
      currency: claimed.currency,
      paidAt: claimed.paid_at
    });

    await db.query(
      `
      UPDATE sessions
      SET contract_confirmation_status = 'sent',
          contract_confirmation_sent_at = NOW(),
          contract_confirmation_provider_id = $3,
          contract_confirmation_error = NULL,
          updated_at = NOW()
      WHERE id = $1
        AND contract_confirmation_status = 'sending'
        AND contract_confirmation_attempts = $2::int
      `,
      [claimed.id, attempt, providerId(response)]
    );

    return {
      sessionId: claimed.id,
      status: "sent",
      attempt,
      providerId: providerId(response)
    };
  } catch (error) {
    await db.query(
      `
      UPDATE sessions
      SET contract_confirmation_status = 'failed',
          contract_confirmation_error = LEFT($3, 2000),
          updated_at = NOW()
      WHERE id = $1
        AND contract_confirmation_status = 'sending'
        AND contract_confirmation_attempts = $2::int
      `,
      [claimed.id, attempt, error?.message || "Contract confirmation failed"]
    );

    return {
      sessionId: claimed.id,
      status: "failed",
      attempt,
      error: error?.message || "Contract confirmation failed"
    };
  }
}

export async function retryContractConfirmationsBatch(options = {}) {
  const limit = normalizeInteger(options.limit, 20, 1, 100);
  const maxAttempts = normalizeInteger(options.maxAttempts, 5, 1, 10);
  const retryAfterMinutes = normalizeInteger(options.retryAfterMinutes, 10, 1, 1440);
  const staleSendingMinutes = normalizeInteger(options.staleSendingMinutes, 15, 5, 1440);

  const candidates = await db.query(
    `
    SELECT id
    FROM sessions
    WHERE payment_status = 'paid'
      AND sensitive_data_erased_at IS NULL
      AND data_redacted_at IS NULL
      AND contract_confirmation_attempts < $1::int
      AND (
        contract_confirmation_status = 'pending'
        OR (
          contract_confirmation_status = 'failed'
          AND COALESCE(contract_confirmation_last_attempt_at, TIMESTAMPTZ 'epoch')
            <= NOW() - ($2::int * INTERVAL '1 minute')
        )
        OR (
          contract_confirmation_status = 'sending'
          AND COALESCE(contract_confirmation_last_attempt_at, TIMESTAMPTZ 'epoch')
            <= NOW() - ($3::int * INTERVAL '1 minute')
        )
      )
    ORDER BY paid_at ASC NULLS LAST, created_at ASC
    LIMIT $4::int
    `,
    [maxAttempts, retryAfterMinutes, staleSendingMinutes, limit]
  );

  const results = [];
  for (const row of candidates.rows) {
    results.push(await sendContractConfirmationForSession(row.id, {
      maxAttempts,
      retryAfterMinutes,
      staleSendingMinutes
    }));
  }

  return {
    checked: candidates.rows.length,
    sent: results.filter((item) => item.status === "sent").length,
    failed: results.filter((item) => item.status === "failed").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    results
  };
}

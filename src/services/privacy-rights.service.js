import { createHash, randomBytes, randomInt, randomUUID } from "crypto";

import { db } from "../db/db.js";
import { assertSessionAccess } from "./session.service.js";
import {
  eraseSessionSensitiveData,
  restrictSessionProcessing
} from "./data-governance.service.js";
import { secureCompare } from "../utils/secureCompare.js";
import { sendPrivacyRequestVerificationEmail } from "./email.service.js";

export const PRIVACY_RIGHTS_VERSION = "2026-07-26";

const VERIFICATION_TTL_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORTED_LANGUAGES = new Set([
  "hu",
  "en",
  "de",
  "it",
  "es",
  "zh",
  "ja",
  "ar",
  "pl",
  "pt",
  "fr"
]);

const REQUEST_TYPES = new Set([
  "access",
  "portability",
  "erasure",
  "restriction",
  "rectification",
  "objection",
  "consent_withdrawal"
]);

function hashValue(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function assertUuid(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!UUID_PATTERN.test(normalized)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.status = 400;
    error.code = "INVALID_REQUEST_IDENTIFIER";
    throw error;
  }
  return normalized;
}

function verificationCodeHash({ requestId, requestToken, code }) {
  return hashValue(
    `privacy-verification:v1:${requestId}:${requestToken}:${String(code || "")}`
  );
}

function normalizeLanguage(value) {
  const language = String(value || "en").trim().toLowerCase();
  return SUPPORTED_LANGUAGES.has(language) ? language : "en";
}

function normalizeDetails(input) {
  const details = input && typeof input === "object" ? input : {};
  const reason = String(details.reason || "").trim().slice(0, 2000);
  const correction = String(details.correction || "").trim().slice(0, 4000);

  return {
    ...(reason ? { reason } : {}),
    ...(correction ? { correction } : {})
  };
}

async function addRequestEvent(
  executor,
  requestId,
  eventType,
  metadata = {},
  actorType = "system"
) {
  await executor.query(
    `
    INSERT INTO privacy_request_events (
      request_id,
      event_type,
      actor_type,
      metadata
    )
    VALUES ($1, $2, $3, $4)
    `,
    [requestId, eventType, actorType, metadata]
  );
}

async function buildDataExport(sessionId, { portability = false } = {}) {
  const [sessionResult, consentResult, invoiceResult, observationResult] =
    await Promise.all([
      db.query(
        `
        SELECT
          id,
          email,
          name,
          lang,
          payload,
          package_code,
          offer_version,
          amount_total,
          currency,
          entitlements,
          consent_record,
          privacy_policy_version,
          terms_version,
          consented_at,
          payment_status,
          paid_at,
          analysis_status,
          analysis_result,
          analysis_started_at,
          analysis_completed_at,
          report_email_status,
          report_email_sent_at,
          follow_up_email_status,
          follow_up_email_sent_at,
          invoice_status,
          invoice_number,
          invoice_sent_at,
          retention_delete_at,
          processing_restricted_at,
          processing_restriction_reason,
          sensitive_data_erased_at,
          created_at,
          updated_at
        FROM sessions
        WHERE id = $1
        `,
        [sessionId]
      ),
      db.query(
        `
        SELECT
          id,
          language,
          actor_role,
          adult_confirmation,
          guardian_authority,
          terms_acknowledged,
          informational_purpose_acknowledged,
          digital_performance_requested,
          withdrawal_right_acknowledged,
          privacy_notice_acknowledged,
          special_category_explicit_consent,
          ai_transparency_acknowledged,
          analytics_consent,
          advertising_consent,
          privacy_policy_version,
          terms_version,
          consent_policy_version,
          consented_at,
          used_at,
          withdrawn_at,
          withdrawal_reason,
          withdrawal_source,
          expires_at
        FROM consent_events
        WHERE id = (SELECT consent_event_id FROM sessions WHERE id = $1)
        `,
        [sessionId]
      ),
      db.query(
        `
        SELECT
          provider,
          status,
          invoice_number,
          invoice_url,
          currency,
          gross_amount,
          vat_rate,
          billing_name,
          billing_email,
          billing_country,
          billing_zip,
          billing_city,
          billing_address_line1,
          billing_address_line2,
          tax_id,
          issued_at,
          sent_at,
          created_at,
          updated_at
        FROM invoices
        WHERE session_id = $1
        `,
        [sessionId]
      ),
      db.query(
        `
        SELECT
          program.id AS program_id,
          program.status AS program_status,
          program.focus_domain,
          program.starts_at,
          program.ends_at,
          entry.entry_date,
          entry.context,
          entry.signal_level,
          entry.strategy_used,
          entry.note,
          entry.created_at
        FROM observation_programs program
        LEFT JOIN observation_entries entry ON entry.program_id = program.id
        WHERE program.session_id = $1
        ORDER BY entry.entry_date ASC NULLS LAST
        `,
        [sessionId]
      )
    ]);

  const session = sessionResult.rows[0];
  if (!session) {
    const error = new Error("Session not found");
    error.status = 404;
    throw error;
  }

  const controllerData = portability
    ? {
        id: session.id,
        email: session.email,
        name: session.name,
        lang: session.lang,
        payload: session.payload,
        package_code: session.package_code,
        offer_version: session.offer_version,
        amount_total: session.amount_total,
        currency: session.currency,
        consent_record: session.consent_record,
        privacy_policy_version: session.privacy_policy_version,
        terms_version: session.terms_version,
        consented_at: session.consented_at,
        payment_status: session.payment_status,
        paid_at: session.paid_at,
        retention_delete_at: session.retention_delete_at,
        created_at: session.created_at,
        updated_at: session.updated_at
      }
    : session;

  return {
    exportVersion: "2026-07-26",
    exportType: portability ? "portability" : "access",
    generatedAt: new Date().toISOString(),
    controllerData,
    consentHistory: consentResult.rows,
    invoicingData: invoiceResult.rows,
    observationDiary: observationResult.rows,
    explanatoryNotes: {
      screening:
        "Questionnaire answers and generated screening content are informational and are not a medical diagnosis.",
      portability:
        portability
          ? "This machine-readable copy contains data supplied by the adult user or observed through their use of the service. Generated analysis and internal operational assessments are excluded."
          : "This access copy includes generated analysis and operational status information so the processing remains transparent."
    }
  };
}

async function updateRequestStatus(
  requestId,
  status,
  decisionReason,
  { fulfilled = false } = {}
) {
  const result = await db.query(
    `
    UPDATE privacy_requests
    SET status = $2,
        decision_reason = $3,
        fulfilled_at = CASE WHEN $4 THEN NOW() ELSE fulfilled_at END,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [requestId, status, decisionReason || null, fulfilled]
  );

  await addRequestEvent(db, requestId, `status:${status}`, {
    decisionReason: decisionReason || null
  });

  return result.rows[0];
}

export async function createPrivacyRequest({
  sessionId,
  sessionToken,
  requestType,
  language,
  details
}) {
  const normalizedSessionId = assertUuid(sessionId, "session id");
  const normalizedType = String(requestType || "").trim().toLowerCase();
  if (!REQUEST_TYPES.has(normalizedType)) {
    const error = new Error("Unsupported privacy request type");
    error.status = 400;
    throw error;
  }

  const sessionResult = await db.query(
    "SELECT * FROM sessions WHERE id = $1",
    [normalizedSessionId]
  );
  const session = sessionResult.rows[0];
  assertSessionAccess(session, sessionToken);

  const requestId = randomUUID();
  const requestToken = randomBytes(32).toString("base64url");
  const normalizedDetails = normalizeDetails(details);
  const normalizedLanguage = normalizeLanguage(language || session.lang);
  const verificationCode = String(randomInt(100000, 1000000));

  await db.query(
    `
    INSERT INTO privacy_requests (
      id,
      session_id,
      request_type,
      status,
      requester_email_hash,
      request_token_hash,
      language,
      details,
      identity_verified_at,
      verification_code_hash,
      verification_expires_at,
      verification_sent_at,
      verification_channel
    )
    VALUES (
      $1,
      $2,
      $3,
      'verification_pending',
      $4,
      $5,
      $6,
      $7,
      NULL,
      $8,
      NOW() + INTERVAL '15 minutes',
      NOW(),
      'email_otp'
    )
    `,
    [
      requestId,
      session.id,
      normalizedType,
      hashValue(String(session.email || "").trim().toLowerCase()),
      hashValue(requestToken),
      normalizedLanguage,
      normalizedDetails,
      verificationCodeHash({
        requestId,
        requestToken,
        code: verificationCode
      })
    ]
  );
  await addRequestEvent(
    db,
    requestId,
    "request:received",
    {
      requestType: normalizedType,
      verification: "email_otp_pending",
      expiresInMinutes: VERIFICATION_TTL_MINUTES
    },
    "data_subject"
  );

  try {
    await sendPrivacyRequestVerificationEmail({
      to: session.email,
      lang: normalizedLanguage,
      code: verificationCode,
      requestId
    });
  } catch (error) {
    try {
      await db.query("DELETE FROM privacy_requests WHERE id = $1", [requestId]);
    } catch (cleanupError) {
      console.error("[privacy] failed to clean up undelivered verification", {
        requestId,
        message: cleanupError?.message
      });
    }
    error.status = 503;
    throw error;
  }

  return {
    request: {
      id: requestId,
      requestType: normalizedType,
      status: "verification_pending",
      receivedAt: new Date().toISOString(),
      dueAt: null,
      fulfilledAt: null,
      decisionReason: null
    },
    requestToken,
    requiresVerification: true,
    verificationExpiresInMinutes: VERIFICATION_TTL_MINUTES
  };
}

async function executeVerifiedPrivacyRequest(request, session) {
  const requestId = request.id;
  const requestType = request.request_type;
  const details = request.details || {};
  let exportData = null;
  let updatedRequest;

  try {
    if (requestType === "access" || requestType === "portability") {
      exportData = await buildDataExport(session.id, {
        portability: requestType === "portability"
      });
      updatedRequest = await updateRequestStatus(
        requestId,
        "fulfilled",
        "Verified electronic copy supplied through the authenticated request channel.",
        { fulfilled: true }
      );
    } else if (requestType === "restriction" || requestType === "objection") {
      await restrictSessionProcessing(session.id, `${requestType} request ${requestId}`);
      updatedRequest = await updateRequestStatus(
        requestId,
        "fulfilled",
        "Automated analysis, report delivery and follow-up processing were restricted.",
        { fulfilled: true }
      );
    } else if (requestType === "consent_withdrawal") {
      await db.query(
        `UPDATE consent_events
         SET withdrawn_at = COALESCE(withdrawn_at, NOW()),
             withdrawal_reason = $2,
             withdrawal_source = 'privacy_request'
         WHERE id = $1`,
        [session.consent_event_id, details.reason || "Consent withdrawn"]
      );
      await restrictSessionProcessing(
        session.id,
        `Consent withdrawn through privacy request ${requestId}`
      );
      updatedRequest = await updateRequestStatus(
        requestId,
        "fulfilled",
        "Consent was withdrawn and future sensitive-data processing was restricted.",
        { fulfilled: true }
      );
    } else if (requestType === "erasure") {
      const invoiceResult = await db.query(
        `SELECT COUNT(*)::int AS count
         FROM invoices
         WHERE session_id = $1
           AND status IN ('issued', 'processing', 'pending')`,
        [session.id]
      );
      const hasFinancialRecord = Number(invoiceResult.rows[0]?.count || 0) > 0;
      await eraseSessionSensitiveData(session.id, `Erasure request ${requestId}`);
      updatedRequest = await updateRequestStatus(
        requestId,
        hasFinancialRecord ? "partially_fulfilled" : "fulfilled",
        hasFinancialRecord
          ? "Questionnaire, report and observation data were erased. Statutory invoicing records remain restricted to legal retention obligations."
          : "Questionnaire, report and observation data were erased.",
        { fulfilled: true }
      );
    } else {
      updatedRequest = await updateRequestStatus(
        requestId,
        "in_review",
        "The requested rectification requires controller review before changing the evidentiary record."
      );
    }
  } catch (error) {
    await updateRequestStatus(
      requestId,
      "in_review",
      "The verified automated action could not be completed. Controller review is required."
    );
    await addRequestEvent(db, requestId, "action:failed", { action: requestType });
    error.privacyRequestId = requestId;
    throw error;
  }

  return { request: updatedRequest, exportData };
}

export async function verifyPrivacyRequest({ requestId, requestToken, code }) {
  const normalizedRequestId = assertUuid(requestId, "privacy request id");
  const normalizedRequestToken = String(requestToken || "").trim();
  const normalizedCode = String(code || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    const error = new Error("Enter the six-digit verification code");
    error.status = 400;
    error.code = "INVALID_VERIFICATION_CODE_FORMAT";
    throw error;
  }

  const client = await db.connect();
  let request;
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const result = await client.query(
      `SELECT * FROM privacy_requests WHERE id = $1 FOR UPDATE`,
      [normalizedRequestId]
    );
    request = result.rows[0];

    if (
      !request ||
      !normalizedRequestToken ||
      !secureCompare(
        hashValue(normalizedRequestToken),
        request.request_token_hash
      )
    ) {
      const error = new Error("Privacy request access denied");
      error.status = 403;
      throw error;
    }
    if (request.status !== "verification_pending") {
      const error = new Error("This privacy request is no longer awaiting verification");
      error.status = 409;
      error.code = "VERIFICATION_NOT_PENDING";
      throw error;
    }
    if (
      !request.verification_expires_at ||
      new Date(request.verification_expires_at).getTime() <= Date.now()
    ) {
      await client.query(
        `UPDATE privacy_requests
         SET status = 'rejected',
             decision_reason = 'The email verification code expired.',
             verification_code_hash = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [normalizedRequestId]
      );
      await addRequestEvent(
        client,
        normalizedRequestId,
        "verification:expired",
        {},
        "data_subject"
      );
      await client.query("COMMIT");
      transactionOpen = false;
      const error = new Error("The verification code has expired. Submit a new request.");
      error.status = 410;
      error.code = "VERIFICATION_EXPIRED";
      throw error;
    }

    const matches = secureCompare(
      verificationCodeHash({
        requestId: normalizedRequestId,
        requestToken: normalizedRequestToken,
        code: normalizedCode
      }),
      request.verification_code_hash || ""
    );
    if (!matches) {
      const attempts = Number(request.verification_attempts || 0) + 1;
      const rejected = attempts >= MAX_VERIFICATION_ATTEMPTS;
      await client.query(
        `UPDATE privacy_requests
         SET verification_attempts = $2,
             status = CASE WHEN $3 THEN 'rejected' ELSE status END,
             decision_reason = CASE WHEN $3 THEN 'Too many invalid verification attempts.' ELSE decision_reason END,
             verification_code_hash = CASE WHEN $3 THEN NULL ELSE verification_code_hash END,
             updated_at = NOW()
         WHERE id = $1`,
        [normalizedRequestId, attempts, rejected]
      );
      await addRequestEvent(
        client,
        normalizedRequestId,
        rejected ? "verification:locked" : "verification:failed",
        { attempts },
        "data_subject"
      );
      await client.query("COMMIT");
      transactionOpen = false;
      const error = new Error(
        rejected
          ? "Too many invalid attempts. Submit a new request."
          : "The verification code is incorrect."
      );
      error.status = rejected ? 429 : 400;
      error.code = rejected ? "VERIFICATION_LOCKED" : "VERIFICATION_INCORRECT";
      throw error;
    }

    const claimed = await client.query(
      `UPDATE privacy_requests
       SET status = 'processing',
           identity_verified_at = NOW(),
           verification_verified_at = NOW(),
           verification_code_hash = NULL,
           updated_at = NOW()
       WHERE id = $1
         AND status = 'verification_pending'
       RETURNING *`,
      [normalizedRequestId]
    );
    request = claimed.rows[0];
    await addRequestEvent(
      client,
      normalizedRequestId,
      "verification:succeeded",
      {},
      "data_subject"
    );
    await client.query("COMMIT");
    transactionOpen = false;
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch (_rollbackError) {
        // The original error is more useful to the caller.
      }
    }
    throw error;
  } finally {
    client.release();
  }

  const sessionResult = await db.query("SELECT * FROM sessions WHERE id = $1", [request.session_id]);
  const session = sessionResult.rows[0];
  if (!session) {
    await updateRequestStatus(
      normalizedRequestId,
      "in_review",
      "Identity was verified, but the related session is no longer available."
    );
    const error = new Error("The related session is no longer available");
    error.status = 409;
    throw error;
  }

  const executed = await executeVerifiedPrivacyRequest(request, session);
  return {
    request: {
      id: executed.request.id,
      requestType: executed.request.request_type,
      status: executed.request.status,
      receivedAt: executed.request.received_at,
      dueAt: executed.request.due_at,
      fulfilledAt: executed.request.fulfilled_at,
      decisionReason: executed.request.decision_reason
    },
    exportData: executed.exportData
  };
}

export async function getPrivacyRequestStatus(requestId, requestToken) {
  const normalizedRequestId = assertUuid(requestId, "privacy request id");
  const normalizedRequestToken = String(requestToken || "").trim();
  const result = await db.query(
    `
    SELECT
      id,
      request_type,
      status,
      language,
      decision_reason,
      received_at,
      due_at,
      fulfilled_at,
      request_token_hash
    FROM privacy_requests
    WHERE id = $1
    `,
    [normalizedRequestId]
  );
  const request = result.rows[0];

  if (
    !request ||
    !normalizedRequestToken ||
    !secureCompare(
      hashValue(normalizedRequestToken),
      request.request_token_hash
    )
  ) {
    const error = new Error("Privacy request access denied");
    error.status = 403;
    throw error;
  }

  return {
    id: request.id,
    requestType: request.request_type,
    status: request.status,
    language: request.language,
    decisionReason: request.decision_reason,
    receivedAt: request.received_at,
    dueAt: request.due_at,
    fulfilledAt: request.fulfilled_at
  };
}

export function privacyRequestTokenFromRequest(req) {
  const header = req.headers["x-privacy-request-token"];
  return String(Array.isArray(header) ? header[0] : header || "").trim();
}

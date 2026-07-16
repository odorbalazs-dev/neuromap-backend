import { createHash, randomBytes, randomUUID } from "crypto";

import { db } from "../db/db.js";
import { assertSessionAccess } from "./session.service.js";
import {
  eraseSessionSensitiveData,
  restrictSessionProcessing
} from "./data-governance.service.js";
import { secureCompare } from "../utils/secureCompare.js";

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

function normalizeLanguage(value) {
  const language = String(value || "en").trim().toLowerCase();
  return /^[a-z]{2}$/.test(language) ? language : "en";
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
    exportVersion: "2026-07-16",
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
  const normalizedType = String(requestType || "").trim().toLowerCase();
  if (!REQUEST_TYPES.has(normalizedType)) {
    const error = new Error("Unsupported privacy request type");
    error.status = 400;
    throw error;
  }

  const sessionResult = await db.query(
    "SELECT * FROM sessions WHERE id = $1",
    [sessionId]
  );
  const session = sessionResult.rows[0];
  assertSessionAccess(session, sessionToken);

  const requestId = randomUUID();
  const requestToken = randomBytes(32).toString("base64url");
  const normalizedDetails = normalizeDetails(details);
  const normalizedLanguage = normalizeLanguage(language || session.lang);

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
      identity_verified_at
    )
    VALUES ($1, $2, $3, 'identity_verified', $4, $5, $6, $7, NOW())
    `,
    [
      requestId,
      session.id,
      normalizedType,
      hashValue(String(session.email || "").trim().toLowerCase()),
      hashValue(requestToken),
      normalizedLanguage,
      normalizedDetails
    ]
  );
  await addRequestEvent(
    db,
    requestId,
    "request:received",
    {
      requestType: normalizedType,
      verification: "session_access_token"
    },
    "data_subject"
  );

  let exportData = null;
  let request;

  try {
    if (normalizedType === "access" || normalizedType === "portability") {
      exportData = await buildDataExport(session.id, {
        portability: normalizedType === "portability"
      });
      request = await updateRequestStatus(
        requestId,
        "fulfilled",
        "Verified electronic copy supplied through the authenticated request channel.",
        { fulfilled: true }
      );
    } else if (
      normalizedType === "restriction" ||
      normalizedType === "objection"
    ) {
      await restrictSessionProcessing(
        session.id,
        `${normalizedType} request ${requestId}`
      );
      request = await updateRequestStatus(
        requestId,
        "fulfilled",
        "Automated analysis, report delivery and follow-up processing were restricted.",
        { fulfilled: true }
      );
    } else if (normalizedType === "consent_withdrawal") {
      await db.query(
        `
        UPDATE consent_events
        SET withdrawn_at = COALESCE(withdrawn_at, NOW()),
            withdrawal_reason = $2,
            withdrawal_source = 'privacy_request'
        WHERE id = $1
        `,
        [session.consent_event_id, normalizedDetails.reason || "Consent withdrawn"]
      );
      await restrictSessionProcessing(
        session.id,
        `Consent withdrawn through privacy request ${requestId}`
      );
      request = await updateRequestStatus(
        requestId,
        "fulfilled",
        "Consent was withdrawn and future sensitive-data processing was restricted.",
        { fulfilled: true }
      );
    } else if (normalizedType === "erasure") {
      const invoiceResult = await db.query(
        `
        SELECT COUNT(*)::int AS count
        FROM invoices
        WHERE session_id = $1
          AND status IN ('issued', 'processing', 'pending')
        `,
        [session.id]
      );
      const hasFinancialRecord = Number(invoiceResult.rows[0]?.count || 0) > 0;

      await eraseSessionSensitiveData(
        session.id,
        `Erasure request ${requestId}`
      );
      request = await updateRequestStatus(
        requestId,
        hasFinancialRecord ? "partially_fulfilled" : "fulfilled",
        hasFinancialRecord
          ? "Questionnaire, report and observation data were erased. Statutory invoicing records remain restricted to legal retention obligations."
          : "Questionnaire, report and observation data were erased.",
        { fulfilled: true }
      );
    } else {
      request = await updateRequestStatus(
        requestId,
        "in_review",
        "The requested rectification requires controller review before changing the evidentiary record."
      );
    }
  } catch (error) {
    try {
      await updateRequestStatus(
        requestId,
        "in_review",
        "The automated action could not be completed. Controller review is required."
      );
      await addRequestEvent(db, requestId, "action:failed", {
        action: normalizedType
      });
    } catch (statusError) {
      console.error("[privacy] failed to preserve request review status", {
        requestId,
        message: statusError?.message
      });
    }

    error.privacyRequestId = requestId;
    throw error;
  }

  return {
    request: {
      id: request.id,
      requestType: request.request_type,
      status: request.status,
      receivedAt: request.received_at,
      dueAt: request.due_at,
      fulfilledAt: request.fulfilled_at,
      decisionReason: request.decision_reason
    },
    requestToken,
    exportData
  };
}

export async function getPrivacyRequestStatus(requestId, requestToken) {
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
    [requestId]
  );
  const request = result.rows[0];

  if (
    !request ||
    !requestToken ||
    !secureCompare(hashValue(requestToken), request.request_token_hash)
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

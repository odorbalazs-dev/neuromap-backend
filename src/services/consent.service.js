import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";

import { env } from "../config/env.js";
import { db } from "../db/db.js";
import { restrictSessionProcessing } from "./data-governance.service.js";

const SUPPORTED_LANGS = new Set([
  "hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"
]);

const REQUIRED_CONFIRMATIONS = [
  "adultConfirmation",
  "guardianAuthority",
  "termsAcknowledged",
  "informationalPurposeAcknowledged",
  "digitalPerformanceRequested",
  "withdrawalRightAcknowledged",
  "privacyNoticeAcknowledged",
  "specialCategoryExplicitConsent",
  "aiTransparencyAcknowledged",
  "termsScrollCompleted",
  "privacyScrollCompleted"
];

export class ConsentError extends Error {
  constructor(message, { status = 400, code = "CONSENT_INVALID", details = [] } = {}) {
    super(message);
    this.name = "ConsentError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function secureTokenMatches(token, expectedHash) {
  const actual = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(String(expectedHash || ""), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function normalizeLanguage(value) {
  const language = String(value || "en").trim().toLowerCase();
  if (!SUPPORTED_LANGS.has(language)) {
    throw new ConsentError("Unsupported consent language.", {
      code: "CONSENT_LANGUAGE_INVALID"
    });
  }
  return language;
}

function validateConsentInput(input = {}) {
  const missing = REQUIRED_CONFIRMATIONS.filter((key) => input[key] !== true);
  const actorRole = String(input.actorRole || "").trim();

  if (!["parent_or_legal_guardian", "adult_authorized_purchaser"].includes(actorRole)) {
    missing.push("actorRole");
  }

  if (input.advertisingConsent === true) {
    throw new ConsentError(
      "Advertising consent is not collected in this sensitive questionnaire flow.",
      { code: "ADVERTISING_CONSENT_NOT_SUPPORTED" }
    );
  }

  if (missing.length) {
    throw new ConsentError("Required legal confirmations are missing.", {
      code: "CONSENT_CONFIRMATIONS_MISSING",
      details: missing
    });
  }

  return actorRole;
}

function toConsentSnapshot(row) {
  return {
    consentEventId: row.id,
    language: row.language,
    actorRole: row.actor_role,
    adultConfirmation: row.adult_confirmation,
    guardianAuthority: row.guardian_authority,
    termsAcknowledged: row.terms_acknowledged,
    informationalPurposeAcknowledged: row.informational_purpose_acknowledged,
    digitalPerformanceRequested: row.digital_performance_requested,
    withdrawalRightAcknowledged: row.withdrawal_right_acknowledged,
    privacyNoticeAcknowledged: row.privacy_notice_acknowledged,
    specialCategoryExplicitConsent: row.special_category_explicit_consent,
    aiTransparencyAcknowledged: row.ai_transparency_acknowledged,
    analyticsConsent: row.analytics_consent,
    advertisingConsent: false,
    privacyPolicyVersion: row.privacy_policy_version,
    termsVersion: row.terms_version,
    consentPolicyVersion: row.consent_policy_version,
    consentedAt: new Date(row.consented_at).toISOString(),
    source: row.source
  };
}

export function getPublicLegalConfiguration() {
  return {
    supportedLanguages: [...SUPPORTED_LANGS],
    privacyPolicyUrl: env.PRIVACY_POLICY_URL,
    privacyPolicyVersion: env.PRIVACY_POLICY_VERSION,
    termsUrl: env.TERMS_URL,
    termsVersion: env.TERMS_VERSION,
    consentPolicyVersion: env.CONSENT_POLICY_VERSION,
    policyEffectiveDate: env.POLICY_EFFECTIVE_DATE,
    retentionDays: env.DATA_RETENTION_DAYS,
    controller: {
      name: env.DATA_CONTROLLER_NAME,
      address: env.DATA_CONTROLLER_ADDRESS,
      country: env.DATA_CONTROLLER_COUNTRY,
      privacyEmail: env.PRIVACY_CONTACT_EMAIL,
      dpoEmail: env.DPO_CONTACT_EMAIL,
      eeaRepresentative: env.EEA_REPRESENTATIVE
    },
    supervisoryAuthority: {
      name: env.SUPERVISORY_AUTHORITY_NAME,
      url: env.SUPERVISORY_AUTHORITY_URL
    },
    advertisingConsentAvailable: false,
    analyticsConsentOptional: true
  };
}

export async function createConsentReceipt(input = {}) {
  const language = normalizeLanguage(input.language);
  const actorRole = validateConsentInput(input);
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const consentedAt = new Date();
  const expiresAt = new Date(
    consentedAt.getTime() + env.CONSENT_RECEIPT_TTL_HOURS * 60 * 60 * 1000
  );

  const evidence = {
    schemaVersion: "explicit-consent-receipt-v1",
    legalUiVersion: String(input.legalUiVersion || "webflow-legal-v1").slice(0, 80),
    termsScrollCompleted: true,
    privacyScrollCompleted: true,
    locale: language
  };

  const result = await db.query(
    `
    INSERT INTO consent_events (
      id, token_hash, language, actor_role, adult_confirmation,
      guardian_authority, terms_acknowledged, informational_purpose_acknowledged,
      digital_performance_requested, withdrawal_right_acknowledged,
      privacy_notice_acknowledged, special_category_explicit_consent,
      ai_transparency_acknowledged, analytics_consent, advertising_consent,
      privacy_policy_version, terms_version, consent_policy_version,
      consented_at, expires_at, evidence, source
    )
    VALUES (
      $1, $2, $3, $4, TRUE,
      TRUE, TRUE, TRUE,
      TRUE, TRUE,
      TRUE, TRUE,
      TRUE, $5, FALSE,
      $6, $7, $8,
      $9, $10, $11, 'webflow_legal_gate'
    )
    RETURNING *
    `,
    [
      id,
      hashToken(token),
      language,
      actorRole,
      input.analyticsConsent === true,
      env.PRIVACY_POLICY_VERSION,
      env.TERMS_VERSION,
      env.CONSENT_POLICY_VERSION,
      consentedAt.toISOString(),
      expiresAt.toISOString(),
      evidence
    ]
  );

  return {
    id,
    token,
    consentedAt: consentedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    analyticsConsent: result.rows[0].analytics_consent,
    privacyPolicyVersion: env.PRIVACY_POLICY_VERSION,
    termsVersion: env.TERMS_VERSION,
    consentPolicyVersion: env.CONSENT_POLICY_VERSION
  };
}

function validateReceiptShape(receipt = {}) {
  const id = String(receipt.id || "").trim();
  const token = String(receipt.token || "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) || token.length < 32 || token.length > 128) {
    throw new ConsentError("Invalid consent receipt.", {
      code: "CONSENT_RECEIPT_INVALID"
    });
  }

  return { id, token };
}

async function getReceiptRow(id) {
  const result = await db.query(
    `SELECT * FROM consent_events WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

function assertReceiptUsable(row, token, { allowUsed = false } = {}) {
  if (!row || !secureTokenMatches(token, row.token_hash)) {
    throw new ConsentError("Consent receipt was not found.", {
      status: 404,
      code: "CONSENT_RECEIPT_NOT_FOUND"
    });
  }
  if (row.withdrawn_at) {
    throw new ConsentError("Consent has been withdrawn.", {
      status: 410,
      code: "CONSENT_WITHDRAWN"
    });
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new ConsentError("Consent receipt has expired.", {
      status: 410,
      code: "CONSENT_EXPIRED"
    });
  }
  if (row.used_at && !allowUsed) {
    throw new ConsentError("Consent receipt has already been used.", {
      status: 409,
      code: "CONSENT_ALREADY_USED"
    });
  }
  if (
    row.privacy_policy_version !== env.PRIVACY_POLICY_VERSION ||
    row.terms_version !== env.TERMS_VERSION ||
    row.consent_policy_version !== env.CONSENT_POLICY_VERSION
  ) {
    throw new ConsentError("The legal documents have changed. Please review them again.", {
      status: 409,
      code: "CONSENT_POLICY_CHANGED"
    });
  }
  return row;
}

export async function inspectConsentReceipt(receipt = {}) {
  const { id, token } = validateReceiptShape(receipt);
  return toConsentSnapshot(assertReceiptUsable(await getReceiptRow(id), token, {
    allowUsed: true
  }));
}

export async function claimConsentReceipt(receipt = {}) {
  const { id, token } = validateReceiptShape(receipt);
  const tokenHash = hashToken(token);
  const result = await db.query(
    `
    UPDATE consent_events
    SET used_at = NOW()
    WHERE id = $1
      AND token_hash = $2
      AND used_at IS NULL
      AND withdrawn_at IS NULL
      AND expires_at > NOW()
      AND privacy_policy_version = $3
      AND terms_version = $4
      AND consent_policy_version = $5
    RETURNING *
    `,
    [
      id,
      tokenHash,
      env.PRIVACY_POLICY_VERSION,
      env.TERMS_VERSION,
      env.CONSENT_POLICY_VERSION
    ]
  );

  if (!result.rows[0]) {
    assertReceiptUsable(await getReceiptRow(id), token);
    throw new ConsentError("Consent receipt cannot be used.", {
      status: 409,
      code: "CONSENT_CLAIM_FAILED"
    });
  }

  return {
    id: result.rows[0].id,
    snapshot: toConsentSnapshot(result.rows[0])
  };
}

export async function releaseConsentReceipt(id) {
  await db.query(
    `
    UPDATE consent_events
    SET used_at = NULL
    WHERE id = $1
      AND withdrawn_at IS NULL
    `,
    [id]
  );
}

export async function withdrawConsentReceipt(receipt = {}) {
  const { id, token } = validateReceiptShape(receipt);
  const row = await getReceiptRow(id);
  if (!row || !secureTokenMatches(token, row.token_hash)) {
    throw new ConsentError("Consent receipt was not found.", {
      status: 404,
      code: "CONSENT_RECEIPT_NOT_FOUND"
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
      UPDATE consent_events
      SET withdrawn_at = COALESCE(withdrawn_at, NOW()),
          withdrawal_reason = COALESCE(withdrawal_reason, 'Withdrawn by the data subject'),
          withdrawal_source = COALESCE(withdrawal_source, 'consent_manager')
      WHERE id = $1 AND token_hash = $2
      RETURNING withdrawn_at
      `,
      [id, hashToken(token)]
    );

    const sessions = await client.query(
      "SELECT id FROM sessions WHERE consent_event_id = $1 FOR UPDATE",
      [id]
    );

    for (const session of sessions.rows) {
      await restrictSessionProcessing(
        session.id,
        `Special-category consent withdrawn (${id})`,
        { executor: client }
      );
    }

    await client.query("COMMIT");
    return {
      id,
      withdrawnAt: new Date(result.rows[0].withdrawn_at).toISOString(),
      restrictedSessions: sessions.rowCount
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

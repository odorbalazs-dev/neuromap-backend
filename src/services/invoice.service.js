import { db } from "../db/db.js";
import {
  invoiceConfig,
  resolveInvoiceTaxPolicy,
  isInvoiceAutomationConfigured
} from "../config/invoice.js";
import {
  buildBillingInfo,
  buildInvoiceAmounts,
  findSzamlazzHuInvoice,
  createSzamlazzHuInvoice
} from "../infrastructure/invoice/szamlazzhuClient.js";
import { getSessionById } from "./session.service.js";
import { getProductPackage } from "../config/products.js";
import Stripe from "stripe";
import { env } from "../config/env.js";
import {
  TEST_INVOICE_EXCLUSION,
  isTestInvoicePayment,
  isVerifiedLiveInvoicePayment
} from "./invoice-payment-policy.js";

function compactError(error) {
  return String(error?.message || error || "Invoice error").slice(0, 1000);
}

const SZAMLAZZHU_SUPPORTED_INVOICE_LANGS = new Set(["hu", "en", "de", "it", "fr", "es", "pl"]);

const PACKAGE_INVOICE_COPY = {
  it: { standard_v1: 'Report NeuroMap Kids Standard', plus_v1: 'Report NeuroMap Kids Plus e programma di osservazione' },
  fr: { standard_v1: 'Rapport NeuroMap Kids Standard', plus_v1: 'Rapport NeuroMap Kids Plus et programme d’observation' },
  es: { standard_v1: 'Informe NeuroMap Kids Standard', plus_v1: 'Informe NeuroMap Kids Plus y programa de observación' },
  pl: { standard_v1: 'Raport NeuroMap Kids Standard', plus_v1: 'Raport NeuroMap Kids Plus i program obserwacji' },
  hu: {
    standard_v1: "NeuroMap Kids Standard riport",
    plus_v1: "NeuroMap Kids Plus riport és megfigyelési program"
  },
  en: {
    standard_v1: "NeuroMap Kids Standard report",
    plus_v1: "NeuroMap Kids Plus report and observation program"
  },
  de: {
    standard_v1: "NeuroMap Kids Standard-Bericht",
    plus_v1: "NeuroMap Kids Plus-Bericht und Beobachtungsprogramm"
  }
};

function resolveSzamlazzHuInvoiceLanguage(sessionLang) {
  const configured = String(invoiceConfig.szamlazzhu.invoiceLanguage || "auto")
    .trim()
    .toLowerCase();

  if (configured && configured !== "auto") {
    return SZAMLAZZHU_SUPPORTED_INVOICE_LANGS.has(configured) ? configured : 'en';
  }

  const normalized = String(sessionLang || "")
    .trim()
    .toLowerCase();

  if (SZAMLAZZHU_SUPPORTED_INVOICE_LANGS.has(normalized)) {
    return normalized;
  }

  return normalized === "hu" ? "hu" : "en";
}

function getSzamlazzHuConfigForSession(session, country) {
  return {
    ...invoiceConfig.szamlazzhu,
    ...resolveInvoiceTaxPolicy(country),
    invoiceLanguage: resolveSzamlazzHuInvoiceLanguage(session?.lang)
  };
}

function getInvoiceProductCopy(session) {
  const lang = resolveSzamlazzHuInvoiceLanguage(session?.lang);
  const packageCode = getProductPackage(
    session?.package_code || "legacy_500_v1"
  ).code;
  const localized = PACKAGE_INVOICE_COPY[lang] || PACKAGE_INVOICE_COPY.en;

  return {
    name:
      localized[packageCode] ||
      invoiceConfig.productName ||
      "NeuroMap Kids report",
    comment: localized[packageCode] || PACKAGE_INVOICE_COPY.en[packageCode] || invoiceConfig.productComment
  };
}

async function getIssuedInvoice(sessionId) {
  const existing = await db.query(
    `
    SELECT *
    FROM invoices
    WHERE session_id = $1
      AND provider = $2
      AND status = 'issued'
    LIMIT 1
    `,
    [sessionId, invoiceConfig.provider]
  );

  return existing.rows[0] || null;
}

async function upsertInvoiceProcessing({ session, checkoutSession }) {
  const billing = buildBillingInfo({ session, checkoutSession });
  const szamlazzhuConfig = getSzamlazzHuConfigForSession(session, billing.country);
  const amounts = buildInvoiceAmounts({
    session,
    checkoutSession,
    config: szamlazzhuConfig
  });

  const result = await db.query(
    `
    INSERT INTO invoices (
      session_id,
      provider,
      status,
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
      attempts,
      last_attempt_at,
      processing_token,
      processing_started_at,
      error_message,
      updated_at
    )
    VALUES (
      $1, $2, 'processing', $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, 1, NOW(), gen_random_uuid(), NOW(), NULL, NOW()
    )
    ON CONFLICT (session_id, provider)
    DO UPDATE SET
      status = 'processing',
      currency = EXCLUDED.currency,
      gross_amount = EXCLUDED.gross_amount,
      vat_rate = EXCLUDED.vat_rate,
      billing_name = EXCLUDED.billing_name,
      billing_email = EXCLUDED.billing_email,
      billing_country = EXCLUDED.billing_country,
      billing_zip = EXCLUDED.billing_zip,
      billing_city = EXCLUDED.billing_city,
      billing_address_line1 = EXCLUDED.billing_address_line1,
      billing_address_line2 = EXCLUDED.billing_address_line2,
      tax_id = EXCLUDED.tax_id,
      attempts = invoices.attempts + 1,
      last_attempt_at = NOW(),
      processing_token = gen_random_uuid(),
      processing_started_at = NOW(),
      error_message = NULL,
      updated_at = NOW()
    WHERE invoices.status IN ('pending', 'failed', 'skipped')
       OR (
        invoices.status = 'processing'
        AND COALESCE(
          invoices.processing_started_at,
          invoices.last_attempt_at,
          invoices.updated_at,
          invoices.created_at
        ) < NOW() - INTERVAL '15 minutes'
       )
    RETURNING *
    `,
    [
      session.id,
      invoiceConfig.provider,
      amounts.currency,
      amounts.grossAmount,
      amounts.vatRate,
      billing.name,
      billing.email,
      billing.country,
      billing.zip,
      billing.city,
      billing.addressLine1,
      billing.addressLine2,
      billing.taxId
    ]
  );

  const invoiceRow = result.rows[0] || null;

  if (!invoiceRow) {
    return null;
  }

  await db.query(
    `
    UPDATE sessions
    SET invoice_status = 'processing',
        invoice_id = $2,
        invoice_error = NULL
    WHERE id = $1
    `,
    [session.id, invoiceRow.id]
  );

  return invoiceRow;
}

async function markInvoiceSkipped(sessionId, reason) {
  const result = await db.query(
    `
    INSERT INTO invoices (
      session_id,
      provider,
      status,
      error_message,
      updated_at
    )
    VALUES ($1, $2, 'skipped', $3, NOW())
    ON CONFLICT (session_id, provider)
    DO UPDATE SET
      status = 'skipped',
      error_message = EXCLUDED.error_message,
      updated_at = NOW()
    WHERE invoices.status IS DISTINCT FROM 'issued'
    RETURNING *
    `,
    [sessionId, invoiceConfig.provider, reason]
  );

  const invoiceRow = result.rows[0] || await getIssuedInvoice(sessionId);

  if (!invoiceRow || invoiceRow.status === "issued") {
    return invoiceRow || null;
  }

  await db.query(
    `
    UPDATE sessions
    SET invoice_status = 'skipped',
        invoice_id = $2,
        invoice_error = $3
    WHERE id = $1
    `,
    [sessionId, invoiceRow.id, reason]
  );

  return invoiceRow;
}

async function markInvoiceIssued(sessionId, invoiceId, invoiceResult, processingToken) {
  if (!invoiceResult?.invoiceNumber) throw new Error('INVOICE_RESPONSE_UNVERIFIED');
  const result = await db.query(
    `
    WITH updated_invoice AS (UPDATE invoices
    SET status = 'issued',
        provider_invoice_id = $3,
        invoice_number = $4,
        error_message = NULL,
        provider_response = $5,
        issued_at = COALESCE(issued_at, NOW()),
        sent_at = CASE
          WHEN $6::boolean THEN COALESCE(sent_at, NOW())
          ELSE sent_at
        END,
        processing_token = NULL,
        updated_at = NOW()
    WHERE session_id = $1
      AND provider = $2
      AND id = $7
      AND processing_token = $8::uuid
      AND status = 'processing'
    RETURNING *), updated_session AS (
      UPDATE sessions s SET invoice_status='issued',invoice_id=i.id,
        invoice_number=i.invoice_number,invoice_error=NULL,
        invoice_sent_at=CASE WHEN $6::boolean THEN COALESCE(s.invoice_sent_at,NOW()) ELSE s.invoice_sent_at END
      FROM updated_invoice i WHERE s.id=i.session_id RETURNING s.id
    ) SELECT i.* FROM updated_invoice i JOIN updated_session s ON s.id=i.session_id
    `,
    [
      sessionId,
      invoiceConfig.provider,
      invoiceResult.providerInvoiceId || null,
      invoiceResult.invoiceNumber || null,
      invoiceResult.providerResponse || {},
      Boolean(invoiceConfig.szamlazzhu.sendEmail),
      invoiceId,
      processingToken
    ]
  );

  return result.rows[0] || null;
}

async function markInvoiceFailed(sessionId, invoiceId, error, processingToken) {
  const message = compactError(error);

  const result = await db.query(
    `
    WITH updated_invoice AS (UPDATE invoices
    SET status = 'failed',
        error_message = $3,
        processing_token = NULL,
        updated_at = NOW()
    WHERE session_id = $1
      AND provider = $2
      AND id = $4
      AND processing_token = $5::uuid
      AND status = 'processing'
    RETURNING *), updated_session AS (
      UPDATE sessions s SET invoice_status='failed',invoice_id=i.id,invoice_error=i.error_message
      FROM updated_invoice i WHERE s.id=i.session_id RETURNING s.id
    ) SELECT i.* FROM updated_invoice i JOIN updated_session s ON s.id=i.session_id
    `,
    [sessionId, invoiceConfig.provider, message, invoiceId, processingToken]
  );

  return result.rows[0] || null;
}

export async function createInvoiceForPaidSession({
  session,
  checkoutSession = null,
  throwOnError = false
}) {
  if (!session?.id) {
    throw new Error("Missing session for invoice creation.");
  }

  if (session.payment_status !== "paid") {
    return markInvoiceSkipped(session.id, "Session is not paid.");
  }

  if (isTestInvoicePayment(session, checkoutSession)) {
    return markInvoiceSkipped(session.id, TEST_INVOICE_EXCLUSION);
  }

  if (!isInvoiceAutomationConfigured()) {
    return markInvoiceSkipped(
      session.id,
      "Invoice automation is disabled or SZAMLAZZHU_AGENT_KEY is missing."
    );
  }

  const existing = await getIssuedInvoice(session.id);

  if (existing) {
    return existing;
  }

  // Legacy billing snapshots lack mode evidence: verify them with Stripe before invoicing.
  if (!checkoutSession) {
    const queued = await db.query(`SELECT payload FROM post_payment_outbox
      WHERE session_id = $1 AND task = 'invoice'`, [session.id]);
    checkoutSession = queued.rows[0]?.payload || null;
  }
  if (isTestInvoicePayment(session, checkoutSession)) {
    return markInvoiceSkipped(session.id, TEST_INVOICE_EXCLUSION);
  }
  if (!isVerifiedLiveInvoicePayment(session, checkoutSession) ||
      !checkoutSession?.customer_details?.address?.country) {
    if (session.stripe_session_id?.startsWith("cs_live_") && env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY, { timeout: env.STRIPE_TIMEOUT_MS, maxNetworkRetries: 2 });
      checkoutSession = await stripe.checkout.sessions.retrieve(session.stripe_session_id);
    }
  }
  if (isTestInvoicePayment(session, checkoutSession)) {
    return markInvoiceSkipped(session.id, TEST_INVOICE_EXCLUSION);
  }
  if (!isVerifiedLiveInvoicePayment(session, checkoutSession)) {
    throw Object.assign(new Error("INVOICE_LIVE_PAYMENT_UNVERIFIED"), { terminal: true });
  }
  if (!checkoutSession?.customer_details?.address?.country) {
    throw new Error("INVOICE_BILLING_ADDRESS_MISSING");
  }

  const invoiceClaim = await upsertInvoiceProcessing({ session, checkoutSession });

  if (!invoiceClaim) {
    return null;
  }

  try {
    const szamlazzhuConfig = getSzamlazzHuConfigForSession(session, checkoutSession.customer_details.address.country);
    const productCopy = getInvoiceProductCopy(session);
    const externalId = invoiceClaim.external_id || 'nm-' + session.id;
    if (invoiceClaim.submission_started_at || invoiceClaim.attempts > 1) {
      if (!invoiceClaim.external_id) throw Object.assign(new Error('INVOICE_LEGACY_REVIEW_REQUIRED'), { terminal: true });
      const recovered = await findSzamlazzHuInvoice({ config: szamlazzhuConfig, externalId,
        expectedAmount: checkoutSession.amount_total, expectedCurrency: checkoutSession.currency });
      if (!recovered) throw Object.assign(new Error('INVOICE_OUTCOME_UNKNOWN'), { terminal: true });
      return await markInvoiceIssued(session.id, invoiceClaim.id, recovered, invoiceClaim.processing_token);
    }

    const invoiceResult = await createSzamlazzHuInvoice({
      session,
      checkoutSession,
      config: { ...szamlazzhuConfig, externalId },
      productName: productCopy.name,
      productComment: productCopy.comment,
      beforeSubmit: async () => {
        const marked = await db.query(`UPDATE invoices SET external_id=$3,submission_started_at=NOW()
          WHERE id=$1 AND processing_token=$2::uuid AND status='processing' RETURNING id`,
        [invoiceClaim.id,invoiceClaim.processing_token,externalId]);
        if (!marked.rowCount) throw new Error('INVOICE_CLAIM_LOST');
      }
    });

    return await markInvoiceIssued(session.id, invoiceClaim.id, invoiceResult, invoiceClaim.processing_token);
  } catch (error) {
    await markInvoiceFailed(session.id, invoiceClaim.id, error, invoiceClaim.processing_token);
    await db.query(`INSERT INTO payment_reviews(session_id,provider_event_id,reason)
      VALUES ($1,$2,'invoice_reconciliation_required') ON CONFLICT DO NOTHING`, [session.id,'invoice:' + invoiceClaim.id]);

    if (throwOnError) {
      throw error;
    }

    console.error("[invoice] creation failed, continuing:", {
      sessionId: session.id,
      provider: invoiceConfig.provider,
      type: error?.name || 'Error',
      code: /^[A-Z_]{5,80}$/.test(error?.message || '') ? error.message : 'INVOICE_PROVIDER_FAILURE'
    });

    return null;
  }
}

export async function createInvoiceForSessionId(sessionId, options = {}) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found.");
  }

  return createInvoiceForPaidSession({
    session,
    checkoutSession: options.checkoutSession || null,
    throwOnError: options.throwOnError || false
  });
}

export async function retryInvoicesBatch({
  limit = 20,
  maxAttempts = 5,
  staleProcessingMinutes = 15
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeMaxAttempts = Math.min(Math.max(Number(maxAttempts) || 5, 1), 10);
  const safeStaleMinutes = Math.min(
    Math.max(Number(staleProcessingMinutes) || 15, 5),
    1440
  );

  if (!isInvoiceAutomationConfigured()) {
    return {
      configured: false,
      checked: 0,
      issued: 0,
      failed: 0,
      deferred: 0,
      results: []
    };
  }

  const candidates = await db.query(
    `
    SELECT s.id
    FROM sessions s
    LEFT JOIN invoices i
      ON i.session_id = s.id
     AND i.provider = $1::text
    WHERE s.payment_status = 'paid'
      AND LEFT(s.stripe_session_id, 8) = 'cs_live_'
      AND NOT EXISTS (
        SELECT 1 FROM post_payment_outbox o WHERE o.session_id = s.id AND o.task = 'invoice'
          AND (o.payload->>'livemode' = 'false' OR LEFT(o.payload->>'id', 8) = 'cs_test_')
      )
      AND s.invoice_error IS DISTINCT FROM 'STRIPE_TEST_PAYMENT_EXCLUDED'
      AND COALESCE(s.invoice_status, 'pending') <> 'issued'
      AND s.processing_restricted_at IS NULL
      AND s.sensitive_data_erased_at IS NULL
      AND s.data_redacted_at IS NULL
      AND COALESCE(i.attempts, 0) < $2::int
      AND (
        i.id IS NULL
        OR i.status IN ('pending', 'failed', 'skipped')
        OR (
          i.status = 'processing'
          AND COALESCE(
            i.processing_started_at,
            i.last_attempt_at,
            i.updated_at,
            i.created_at
          ) < NOW() - ($3::int * INTERVAL '1 minute')
        )
      )
    ORDER BY s.paid_at ASC NULLS LAST, s.created_at ASC
    LIMIT $4::int
    `,
    [invoiceConfig.provider, safeMaxAttempts, safeStaleMinutes, safeLimit]
  );

  const results = [];

  for (const row of candidates.rows) {
    try {
      const invoice = await createInvoiceForSessionId(row.id, {
        throwOnError: true
      });

      results.push({
        sessionId: row.id,
        status: invoice?.status === "issued" ? "issued" : "deferred",
        invoiceId: invoice?.id || null,
        invoiceNumber: invoice?.invoice_number || null
      });
    } catch (error) {
      results.push({
        sessionId: row.id,
        status: "failed",
        error: compactError(error)
      });
    }
  }

  return {
    configured: true,
    checked: candidates.rows.length,
    issued: results.filter((item) => item.status === "issued").length,
    failed: results.filter((item) => item.status === "failed").length,
    deferred: results.filter((item) => item.status === "deferred").length,
    results
  };
}

export async function getInvoiceForSession(sessionId) {
  const result = await db.query(
    `
    SELECT *
    FROM invoices
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function getRecentInvoices({ limit = 25 } = {}) {
  const safeLimit = Math.min(Number(limit || 25), 100);

  const result = await db.query(
    `
    SELECT
      invoices.*,
      sessions.name,
      sessions.email,
      sessions.lang,
      sessions.payment_status,
      sessions.analysis_status
    FROM invoices
    JOIN sessions ON sessions.id = invoices.session_id
    ORDER BY invoices.updated_at DESC NULLS LAST, invoices.created_at DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
}

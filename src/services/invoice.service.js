import { db } from "../db/db.js";
import {
  invoiceConfig,
  isInvoiceAutomationConfigured
} from "../config/invoice.js";
import {
  buildBillingInfo,
  buildInvoiceAmounts,
  createSzamlazzHuInvoice
} from "../infrastructure/invoice/szamlazzhuClient.js";
import { getSessionById } from "./session.service.js";
import { getProductPackage } from "../config/products.js";

function compactError(error) {
  return String(error?.message || error || "Invoice error").slice(0, 1000);
}

const SZAMLAZZHU_SUPPORTED_INVOICE_LANGS = new Set(["hu", "en", "de"]);

const PACKAGE_INVOICE_COPY = {
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
    return configured;
  }

  const normalized = String(sessionLang || "")
    .trim()
    .toLowerCase();

  if (SZAMLAZZHU_SUPPORTED_INVOICE_LANGS.has(normalized)) {
    return normalized;
  }

  return normalized === "hu" ? "hu" : "en";
}

function getSzamlazzHuConfigForSession(session) {
  return {
    ...invoiceConfig.szamlazzhu,
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
    comment:
      packageCode === "plus_v1"
        ? lang === "hu"
          ? "Egyszeri digitális riport és 14 napos automatikus megfigyelési program, online kérdőív alapján."
          : lang === "de"
            ? "Einmaliger digitaler Bericht und automatisches 14-Tage-Beobachtungsprogramm auf Grundlage eines Online-Fragebogens."
            : "One-time digital report and automated 14-day observation program based on an online questionnaire."
        : invoiceConfig.productComment
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
  const szamlazzhuConfig = getSzamlazzHuConfigForSession(session);
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

async function markInvoiceIssued(sessionId, invoiceId, invoiceResult) {
  const result = await db.query(
    `
    UPDATE invoices
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
      AND status = 'processing'
    RETURNING *
    `,
    [
      sessionId,
      invoiceConfig.provider,
      invoiceResult.providerInvoiceId || null,
      invoiceResult.invoiceNumber || null,
      invoiceResult.providerResponse || {},
      Boolean(invoiceConfig.szamlazzhu.sendEmail),
      invoiceId
    ]
  );

  const invoiceRow = result.rows[0] || null;

  if (!invoiceRow) {
    return null;
  }

  await db.query(
    `
    UPDATE sessions
    SET invoice_status = 'issued',
        invoice_id = $2,
        invoice_number = $3,
        invoice_error = NULL,
        invoice_sent_at = CASE
          WHEN $4::boolean THEN COALESCE(invoice_sent_at, NOW())
          ELSE invoice_sent_at
        END
    WHERE id = $1
    `,
    [
      sessionId,
      invoiceRow.id,
      invoiceResult.invoiceNumber || null,
      Boolean(invoiceConfig.szamlazzhu.sendEmail)
    ]
  );

  return invoiceRow;
}

async function markInvoiceFailed(sessionId, invoiceId, error) {
  const message = compactError(error);

  const result = await db.query(
    `
    UPDATE invoices
    SET status = 'failed',
        error_message = $3,
        processing_token = NULL,
        updated_at = NOW()
    WHERE session_id = $1
      AND provider = $2
      AND id = $4
      AND status = 'processing'
    RETURNING *
    `,
    [sessionId, invoiceConfig.provider, message, invoiceId]
  );

  const invoiceRow = result.rows[0] || null;

  if (!invoiceRow) {
    return null;
  }

  await db.query(
    `
    UPDATE sessions
    SET invoice_status = 'failed',
        invoice_id = COALESCE($2, invoice_id),
        invoice_error = $3
    WHERE id = $1
    `,
    [sessionId, invoiceRow.id, message]
  );

  return invoiceRow;
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

  const invoiceClaim = await upsertInvoiceProcessing({ session, checkoutSession });

  if (!invoiceClaim) {
    return null;
  }

  try {
    const szamlazzhuConfig = getSzamlazzHuConfigForSession(session);
    const productCopy = getInvoiceProductCopy(session);

    const invoiceResult = await createSzamlazzHuInvoice({
      session,
      checkoutSession,
      config: szamlazzhuConfig,
      productName: productCopy.name,
      productComment: productCopy.comment
    });

    return await markInvoiceIssued(session.id, invoiceClaim.id, invoiceResult);
  } catch (error) {
    await markInvoiceFailed(session.id, invoiceClaim.id, error);

    if (throwOnError) {
      throw error;
    }

    console.error("[invoice] creation failed, continuing:", {
      sessionId: session.id,
      provider: invoiceConfig.provider,
      message: compactError(error)
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

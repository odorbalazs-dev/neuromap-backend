import { Resend } from "resend";
import { env } from "../config/env.js";

import { buildReportEmail } from "../templates/reportEmail.js";
import { buildRecoveryEmail } from "../templates/recoveryEmail.js";
import { buildFollowUpEmail } from "../templates/followUpEmail.js";
import { buildContractConfirmationEmail } from "../templates/contractConfirmationEmail.js";

import { generatePdfBuffer } from "./pdf.service.js";
import {
  buildShareableSummaryFilename,
  generateShareableSummaryPdf
} from "./shareable-summary-pdf.service.js";
import { getPlusContent } from "./plus-content.service.js";

const resend = new Resend(env.RESEND_API_KEY);

function getSafeLang(lang) {
  const allowed = [
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
  ];

  return allowed.includes(lang) ? lang : "en";
}

function normalizeRecipients(to) {
  if (!to) return [];

  if (Array.isArray(to)) {
    return to
      .map((v) => String(v).trim())
      .filter(Boolean);
  }

  return String(to)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function maskEmail(value = "") {
  const email = String(value || "").trim();
  const [name, domain] = email.split("@");

  if (!name || !domain) return "";

  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

function maskRecipients(recipients) {
  return normalizeRecipients(recipients)
    .map(maskEmail)
    .filter(Boolean);
}

function summarizeEmailResponse(response) {
  return {
    id: response?.data?.id || response?.id || null,
    hasError: Boolean(response?.error)
  };
}

function buildPdfFilename(lang) {
  const safeLang = getSafeLang(lang);

  const map = {
    hu: "neuromap-kids-riport.pdf",
    en: "neuromap-kids-report.pdf",
    de: "neuromap-kids-bericht.pdf",
    it: "neuromap-kids-report.pdf",
    es: "neuromap-kids-informe.pdf",
    zh: "neuromap-kids-report.pdf",
    ja: "neuromap-kids-report.pdf",
    ar: "neuromap-kids-report.pdf",
    pl: "neuromap-kids-raport.pdf",
    pt: "neuromap-kids-relatorio.pdf",
    fr: "neuromap-kids-rapport.pdf"
  };

  return map[safeLang] || map.en;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appendHtmlBlock(html, block) {
  const source = String(html || "");
  return /<\/body>/i.test(source)
    ? source.replace(/<\/body>/i, `${block}</body>`)
    : `${source}${block}`;
}

function buildPlusEmailContent({ lang, observationUrl }) {
  const copy = getPlusContent(lang);
  const safeUrl = escapeHtml(observationUrl);
  const diaryAction = observationUrl
    ? `<p style="margin:20px 0 8px;"><a href="${safeUrl}" style="display:inline-block;background:#1197d5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">${escapeHtml(copy.diaryTitle)}</a></p>`
    : "";
  const diaryText = observationUrl
    ? `\n${copy.diaryTitle}: ${observationUrl}\n${copy.diaryIntro}`
    : "";

  return {
    html: `
      <section style="margin:28px auto 0;max-width:640px;border:1px solid #d7eef9;border-left:5px solid #72be00;border-radius:8px;padding:20px;background:#f7fcff;color:#1f2937;">
        <h2 style="margin:0 0 10px;font-size:20px;line-height:1.3;">${escapeHtml(copy.packageName)}</h2>
        <p style="margin:0 0 12px;line-height:1.6;">${escapeHtml(copy.diaryIntro)}</p>
        ${diaryAction}
        <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:#667085;">${escapeHtml(copy.disclosure)}</p>
      </section>
    `,
    text: `\n\n${copy.packageName}${diaryText}\n${copy.disclosure}`
  };
}

export async function sendReportEmail({
  to,
  lang,
  name,
  reportText,
  payload,
  productPackage = null,
  observationProgram = null,
  idempotencyKey = null
}) {
  const recipients = normalizeRecipients(to);

  const safeLang = getSafeLang(lang);

  const cleanReportText = String(reportText || "").trim();

  try {
    console.log("[email] start", {
      recipients: maskRecipients(recipients),
      lang: safeLang,
      hasName: Boolean(String(name || "").trim()),
      hasReportText: !!cleanReportText,
      reportLength: cleanReportText.length,
      from: env.EMAIL_FROM
    });

    if (!env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM.");
    }

    if (recipients.length === 0) {
      throw new Error("Missing recipient email address.");
    }

    if (!cleanReportText) {
      throw new Error("Missing reportText for email sending.");
    }

    const template = buildReportEmail({
      lang: safeLang,
      name,
      reportText: cleanReportText,
      payload
    });

    const subject = template.subject;
    let html = template.html;
    let text = template.text;

    const pdfBuffer = await generatePdfBuffer({
      name,
      reportText: cleanReportText,
      lang: safeLang,
      payload
    });

    if (
      !Buffer.isBuffer(pdfBuffer) ||
      pdfBuffer.length === 0
    ) {
      throw new Error(
        "PDF generation returned an empty or invalid buffer."
      );
    }

    const attachments = [
      {
        filename: buildPdfFilename(safeLang),
        content: pdfBuffer.toString("base64")
      }
    ];

    if (productPackage?.entitlements?.shareableObservationSummary === true) {
      const shareableSummary = await generateShareableSummaryPdf({
        lang: safeLang,
        payload
      });

      attachments.push({
        filename: buildShareableSummaryFilename(safeLang),
        content: shareableSummary.toString("base64")
      });
    }

    if (productPackage?.entitlements?.observationDiary14Days === true) {
      const plusContent = buildPlusEmailContent({
        lang: safeLang,
        observationUrl: observationProgram?.url || null
      });
      html = appendHtmlBlock(html, plusContent.html);
      text += plusContent.text;
    }

    console.log("[email] template built", {
      subjectLength: subject.length,
      htmlLength: html.length,
      textLength: text.length,
      pdfBytes: pdfBuffer.length,
      attachmentCount: attachments.length,
      packageCode: productPackage?.code || "legacy_500_v1"
    });

    const email = {
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text,
      attachments
    };
    const response = idempotencyKey
      ? await resend.emails.send(email, { idempotencyKey })
      : await resend.emails.send(email);

    if (response?.error) {
      throw new Error(
        response.error.message ||
        "Resend returned an email sending error."
      );
    }

    console.log("[email] send success", summarizeEmailResponse(response));

    return response;

  } catch (error) {
    console.error("[email] send failed", {
      message:
        error?.message || "Unknown email error",
      stack: error?.stack || null,
      recipients: maskRecipients(recipients),
      lang: safeLang
    });

    throw error;
  }
}

export async function sendContractConfirmationEmail({
  to,
  lang,
  name,
  sessionId,
  packageCode,
  amountTotal,
  currency,
  paidAt
}) {
  const recipients = normalizeRecipients(to);
  const safeLang = getSafeLang(lang);

  if (!env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY.");
  if (!env.EMAIL_FROM) throw new Error("Missing EMAIL_FROM.");
  if (recipients.length === 0) throw new Error("Missing contract confirmation recipient.");
  if (!sessionId) throw new Error("Missing session ID for contract confirmation.");

  const { subject, html, text } = buildContractConfirmationEmail({
    lang: safeLang,
    name,
    sessionId,
    packageCode,
    amountTotal,
    currency,
    paidAt,
    termsUrl: env.TERMS_URL,
    termsVersion: env.TERMS_VERSION,
    privacyUrl: env.PRIVACY_POLICY_URL,
    privacyVersion: env.PRIVACY_POLICY_VERSION,
    privacyContact: env.PRIVACY_CONTACT_EMAIL || env.DPO_CONTACT_EMAIL
  });

  const response = await resend.emails.send(
    {
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text
    },
    {
      idempotencyKey: `contract-confirmation/${sessionId}`
    }
  );

  if (response?.error) {
    throw new Error(response.error.message || "Contract confirmation email failed.");
  }

  console.log("[contract-confirmation-email] send success", {
    sessionId,
    recipients: maskRecipients(recipients),
    ...summarizeEmailResponse(response)
  });

  return response;
}

export async function sendObservationFollowUpEmail({
  to,
  lang,
  name,
  kind,
  observationUrl,
  trend = null,
  idempotencyKey = null
}) {
  const recipients = normalizeRecipients(to);
  const safeLang = getSafeLang(lang);
  const copy = getPlusContent(safeLang);
  const subject = copy.reminderSubjects[kind] || copy.diaryTitle;
  const body = copy.reminderBodies[kind] || copy.diaryIntro;
  const greetingName = String(name || "").trim();
  const trendText = trend
    ? `\nEntries: ${Number(trend.entryCount || 0)} | Direction: ${String(trend.direction || "insufficient_data")}`
    : "";
  const safeUrl = escapeHtml(observationUrl);
  const html = `
    <!doctype html>
    <html lang="${safeLang}">
      <body style="margin:0;background:#f5f9fc;font-family:Arial,sans-serif;color:#1f2937;">
        <main style="max-width:620px;margin:0 auto;padding:32px 20px;">
          <section style="background:#fff;border:1px solid #d7eef9;border-radius:8px;padding:24px;">
            <p style="margin:0 0 8px;color:#1197d5;font-weight:700;">NeuroMap Kids Plus</p>
            <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;">${escapeHtml(subject)}</h1>
            ${greetingName ? `<p style="margin:0 0 12px;">${escapeHtml(greetingName)},</p>` : ""}
            <p style="margin:0;line-height:1.65;">${escapeHtml(body)}</p>
            <p style="margin:20px 0 8px;"><a href="${safeUrl}" style="display:inline-block;background:#1197d5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">${escapeHtml(copy.diaryTitle)}</a></p>
            <p style="margin:18px 0 0;font-size:12px;line-height:1.55;color:#667085;">${escapeHtml(copy.disclosure)}</p>
          </section>
        </main>
      </body>
    </html>
  `;
  const text = `${subject}\n\n${greetingName ? `${greetingName},\n\n` : ""}${body}\n\n${copy.diaryTitle}: ${observationUrl}${trendText}\n\n${copy.disclosure}`;

  if (!env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY.");
  if (!env.EMAIL_FROM) throw new Error("Missing EMAIL_FROM.");
  if (!observationUrl) throw new Error("Missing observation diary URL.");
  if (recipients.length === 0) throw new Error("Missing observation follow-up recipient.");

  const email = {
    from: env.EMAIL_FROM,
    to: recipients,
    subject,
    html,
    text
  };
  const response = idempotencyKey
    ? await resend.emails.send(email, { idempotencyKey })
    : await resend.emails.send(email);

  if (response?.error) {
    throw new Error(response.error.message || "Observation follow-up email failed.");
  }

  return response;
}

export async function sendCheckoutRecoveryEmail({
  to,
  lang,
  name,
  checkoutUrl,
  idempotencyKey = null
}) {
  const recipients = normalizeRecipients(to);

  const safeLang = getSafeLang(lang);

  try {
    console.log("[recovery-email] start", {
      recipients: maskRecipients(recipients),
      lang: safeLang,
      hasName: Boolean(String(name || "").trim()),
      hasCheckoutUrl: !!checkoutUrl,
      from: env.EMAIL_FROM
    });

    if (!env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM.");
    }

    if (recipients.length === 0) {
      throw new Error("Missing recipient email address.");
    }

    if (!checkoutUrl) {
      throw new Error(
        "Missing checkoutUrl for recovery email."
      );
    }

    const { subject, html, text } =
      buildRecoveryEmail({
        lang: safeLang,
        name,
        checkoutUrl
      });

    const email = {
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text
    };
    const response = idempotencyKey
      ? await resend.emails.send(email, { idempotencyKey })
      : await resend.emails.send(email);

    if (response?.error) {
      throw new Error(response.error.message || "Recovery email failed.");
    }

    console.log(
      "[recovery-email] send success",
      summarizeEmailResponse(response)
    );

    return response;

  } catch (error) {
    console.error("[recovery-email] send failed", {
      message:
        error?.message ||
        "Unknown recovery email error",

      stack: error?.stack || null,

      recipients: maskRecipients(recipients),
      lang: safeLang
    });

    throw error;
  }
}

export async function sendAdminAlertEmail({
  to,
  subject,
  html,
  text
}) {
  const recipients = normalizeRecipients(to);

  try {
    console.log("[admin-alert-email] start", {
      recipients: maskRecipients(recipients),
      subject,
      from: env.EMAIL_FROM
    });

    if (!env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM.");
    }

    if (recipients.length === 0) {
      throw new Error("Missing admin alert recipient email address.");
    }

    if (!subject || !html || !text) {
      throw new Error("Missing admin alert email content.");
    }

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text
    });

    if (response?.error) {
      throw new Error(
        response.error.message ||
        "Resend returned an admin alert email sending error."
      );
    }

    console.log("[admin-alert-email] send success", summarizeEmailResponse(response));

    return response;
  } catch (error) {
    console.error("[admin-alert-email] send failed", {
      message: error?.message || "Unknown admin alert email error",
      stack: error?.stack || null,
      recipients: maskRecipients(recipients)
    });

    throw error;
  }
}

export async function sendFollowUpEmail({
  to,
  lang,
  name,
  detectedRisk,
  idempotencyKey = null
}) {
  const recipients = normalizeRecipients(to);
  const safeLang = getSafeLang(lang);

  try {
    console.log("[follow-up-email] start", {
      recipients: maskRecipients(recipients),
      lang: safeLang,
      hasName: Boolean(String(name || "").trim()),
      detectedRisk,
      from: env.EMAIL_FROM
    });

    if (!env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM.");
    }

    if (recipients.length === 0) {
      throw new Error("Missing follow-up recipient email address.");
    }

    const { subject, html, text } = buildFollowUpEmail({
      lang: safeLang,
      name,
      detectedRisk,
      appUrl: env.APP_URL
    });

    const email = {
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text
    };
    const response = idempotencyKey
      ? await resend.emails.send(email, { idempotencyKey })
      : await resend.emails.send(email);

    if (response?.error) {
      throw new Error(
        response.error.message ||
        "Resend returned a follow-up email sending error."
      );
    }

    console.log("[follow-up-email] send success", summarizeEmailResponse(response));

    return response;
  } catch (error) {
    console.error("[follow-up-email] send failed", {
      message: error?.message || "Unknown follow-up email error",
      stack: error?.stack || null,
      recipients: maskRecipients(recipients),
      lang: safeLang
    });

    throw error;
  }
}

import { Resend } from "resend";
import { env } from "../config/env.js";

import { buildReportEmail } from "../templates/reportEmail.js";
import { buildRecoveryEmail } from "../templates/recoveryEmail.js";

import { generatePdfBuffer } from "./pdf.service.js";

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

export async function sendReportEmail({
  to,
  lang,
  name,
  reportText,
  payload
}) {
  const recipients = normalizeRecipients(to);

  const safeLang = getSafeLang(lang);

  const cleanReportText = String(reportText || "").trim();

  try {
    console.log("[email] start", {
      recipients,
      lang: safeLang,
      name,
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

    const { subject, html, text } = buildReportEmail({
      lang: safeLang,
      name,
      reportText: cleanReportText,
      payload
    });

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

    console.log("[email] template built", {
      subjectLength: subject.length,
      htmlLength: html.length,
      textLength: text.length,
      pdfBytes: pdfBuffer.length
    });

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text,
      attachments: [
        {
          filename: buildPdfFilename(safeLang),
          content: pdfBuffer.toString("base64")
        }
      ]
    });

    if (response?.error) {
      throw new Error(
        response.error.message ||
        "Resend returned an email sending error."
      );
    }

    console.log("[email] send success", response);

    return response;

  } catch (error) {
    console.error("[email] send failed", {
      message:
        error?.message || "Unknown email error",
      stack: error?.stack || null,
      recipients,
      lang: safeLang
    });

    throw error;
  }
}

export async function sendCheckoutRecoveryEmail({
  to,
  lang,
  name,
  checkoutUrl
}) {
  const recipients = normalizeRecipients(to);

  const safeLang = getSafeLang(lang);

  try {
    console.log("[recovery-email] start", {
      recipients,
      lang: safeLang,
      name,
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

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text
    });

    console.log(
      "[recovery-email] send success",
      response
    );

    return response;

  } catch (error) {
    console.error("[recovery-email] send failed", {
      message:
        error?.message ||
        "Unknown recovery email error",

      stack: error?.stack || null,

      recipients,
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
      recipients,
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

    console.log("[admin-alert-email] send success", response);

    return response;
  } catch (error) {
    console.error("[admin-alert-email] send failed", {
      message: error?.message || "Unknown admin alert email error",
      stack: error?.stack || null,
      recipients
    });

    throw error;
  }
}

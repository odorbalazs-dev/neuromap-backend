import { Resend } from "resend";
import { env } from "../config/env.js";
import { buildReportEmail } from "../templates/reportEmail.js";
import { generatePdfBuffer } from "./pdf.service.js";

const resend = new Resend(env.RESEND_API_KEY);

function getSafeLang(lang) {
  const allowed = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  return allowed.includes(lang) ? lang : "en";
}

function normalizeRecipients(to) {
  if (!to) return [];
  if (Array.isArray(to)) {
    return to.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(to)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function sendReportEmail({ to, lang, name, reportText, payload }) {
  const recipients = normalizeRecipients(to);
  const safeLang = getSafeLang(lang);

  try {
    console.log("[email] start", {
      recipients,
      lang: safeLang,
      name,
      hasReportText: !!reportText,
      reportLength: reportText ? reportText.length : 0,
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

    if (!reportText || !String(reportText).trim()) {
      throw new Error("Missing reportText for email sending.");
    }

    const { subject, html, text } = buildReportEmail({
  lang: safeLang,
  name,
  reportText: String(reportText).trim(),
  payload
});
const pdfBuffer = await generatePdfBuffer({
  name,
  reportText: String(reportText).trim()
});

    console.log("[email] template built", {
      subjectLength: subject.length,
      htmlLength: html.length,
      textLength: text.length
    });

    const response = await resend.emails.send({
  from: env.EMAIL_FROM,
  to: recipients,
  subject,
  html,
  text,
  attachments: [
    {
      filename: "neuromap-report.html",
      content: pdfBuffer
    }
  ]
});

    console.log("[email] send success", response);

    return response;
  } catch (error) {
    console.error("[email] send failed", {
      message: error?.message || "Unknown email error",
      stack: error?.stack || null,
      recipients,
      lang: safeLang
    });

    throw error;
  }
}
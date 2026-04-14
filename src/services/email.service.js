import { Resend } from "resend";
import { env } from "../config/env.js";
import { buildReportEmail } from "../templates/reportEmail.js";

const resend = new Resend(env.RESEND_API_KEY);

const ALLOWED_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function getSafeLang(lang) {
  if (!lang) return "hu";
  return ALLOWED_LANGS.includes(lang) ? lang : "hu";
}

function normalizeRecipients(to) {
  if (Array.isArray(to)) {
    return to.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof to === "string") {
    return to
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendReportEmail({ to, lang, name, reportText }) {
  try {
    const safeLang = getSafeLang(lang);
    const recipients = normalizeRecipients(to);
    const safeName = typeof name === "string" ? name.trim() : "";

    console.log("[email] start", {
      recipients,
      lang: safeLang,
      name: safeName,
      hasReportText: Boolean(reportText),
      reportLength: reportText ? reportText.length : 0,
      from: env.EMAIL_FROM
    });

    if (!recipients.length) {
      throw new Error("Missing recipient email address.");
    }

    if (!reportText || !String(reportText).trim()) {
      throw new Error("Missing reportText for email sending.");
    }

    const { subject, html, text } = buildReportEmail({
      lang: safeLang,
      name: safeName,
      reportText: String(reportText).trim()
    });

    const finalText = text && text.trim() ? text.trim() : stripHtml(html);

    console.log("[email] template built", {
      subjectLength: subject.length,
      htmlLength: html.length,
      textLength: finalText.length
    });

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text: finalText
    });

    console.log("[email] send success", {
      id: response?.data?.id || response?.id || null,
      recipients
    });

    return response;
  } catch (error) {
    console.error("[email] send failed", {
      message: error.message,
      stack: error.stack
    });

    throw error;
  }
}
import { Resend } from "resend";
import { env } from "../config/env.js";
import { buildReportEmail } from "../templates/reportEmail.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendReportEmail({ to, lang, name, reportText }) {
  try {
    console.log("[email] start", {
      to,
      lang,
      name,
      hasReportText: !!reportText,
      reportLength: reportText ? reportText.length : 0,
      from: env.EMAIL_FROM
    });

    if (!to) {
      throw new Error("Missing recipient email address.");
    }

    if (!reportText) {
      throw new Error("Missing reportText for email sending.");
    }

    const { subject, html } = buildReportEmail({
      lang,
      name,
      reportText
    });

    console.log("[email] template built", {
      subjectLength: subject.length,
      htmlLength: html.length
    });

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html
    });

    console.log("[email] send success", response);

    return response;
  } catch (error) {
    console.error("[email] send failed", {
      message: error.message,
      stack: error.stack
    });

    throw error;
  }
}
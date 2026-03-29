import { Resend } from "resend";
import { env } from "../config/env.js";
import { buildReportEmail } from "../templates/reportEmail.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendReportEmail({ to, lang, name, reportText }) {
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

  const response = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html
  });

  return response;
}
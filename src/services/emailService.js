import { resend } from "../config/resend.js";
import { env } from "../config/env.js";
import { buildReportEmail } from "../templates/reportEmail.js";

export async function sendReportEmail({ to, lang, name, reportText }) {
  const { subject, html } = buildReportEmail({
    lang,
    name,
    reportText
  });

  return resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject,
    html
  });
}
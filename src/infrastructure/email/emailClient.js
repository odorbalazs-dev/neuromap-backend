import { Resend } from "resend";
import { env } from "../config/env.js";
const resend = new Resend(env.RESEND_API_KEY);

export const emailClient = {
  async send({ to, subject, html }) {
    return resend.emails.send({
      from: "noreply@yourapp.com",
      to,
      subject,
      html,
    });
  },
};
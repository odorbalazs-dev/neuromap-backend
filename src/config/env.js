console.log("STRIPE ENV:", process.env.STRIPE_SECRET_KEY);
import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name, fallback = "") {
  return process.env[name] || fallback;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",

  appBaseUrl: optional("APP_BASE_URL", "https://example.com"),
  successUrl: optional("SUCCESS_URL", "https://example.com/success"),
  cancelUrl: optional("CANCEL_URL", "https://example.com/cancel"),

  databaseUrl: optional("DATABASE_URL", ""),

  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: required("STRIPE_WEBHOOK_SECRET"),

  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",

  resendApiKey: required("RESEND_API_KEY"),
  resendFromEmail: required("RESEND_FROM_EMAIL")
};
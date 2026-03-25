import dotenv from "dotenv";

dotenv.config();

function required(name) {
  console.log("ENV CHECK:", name, process.env[name]);
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",

  appBaseUrl: required("APP_BASE_URL"),
  successUrl: required("SUCCESS_URL"),
  cancelUrl: required("CANCEL_URL"),

  databaseUrl: required("DATABASE_URL"),

  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: required("STRIPE_WEBHOOK_SECRET"),

  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",

  resendApiKey: required("RESEND_API_KEY"),
  resendFromEmail: required("RESEND_FROM_EMAIL")
};
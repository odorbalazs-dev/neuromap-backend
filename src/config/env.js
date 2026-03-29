import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] || defaultValue;
}

export const env = {
  // App
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: optional("PORT", 3000),

  // Database
  DATABASE_URL: required("DATABASE_URL"),

  // OpenAI
  OPENAI_API_KEY: required("OPENAI_API_KEY"),
  OPENAI_MODEL: optional("OPENAI_MODEL", "gpt-4.1-mini"),

  // Stripe
  STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),

  // Email (Resend)
  RESEND_API_KEY: required("RESEND_API_KEY"),
  EMAIL_FROM: required("EMAIL_FROM"),

  // Frontend URLs (checkout redirect)
  SUCCESS_URL: required("SUCCESS_URL"),
  CANCEL_URL: required("CANCEL_URL"),

  // App domain (optional but useful)
  APP_URL: optional("APP_URL", "http://localhost:3000")
};
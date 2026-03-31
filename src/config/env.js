function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.PGHOST;
  const port = process.env.PGPORT;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  if (host && port && user && password && database) {
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  throw new Error(
    "Missing required database configuration: set DATABASE_URL or all of PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE"
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  DATABASE_URL: resolveDatabaseUrl(),

  OPENAI_API_KEY: required("OPENAI_API_KEY"),
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini",

  STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),

  RESEND_API_KEY: required("RESEND_API_KEY"),
  EMAIL_FROM: required("EMAIL_FROM"),

  SUCCESS_URL: required("SUCCESS_URL"),
  CANCEL_URL: required("CANCEL_URL"),

  APP_URL: required("APP_URL"),
};
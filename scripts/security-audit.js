import fs from "fs";
import path from "path";

const root = process.cwd();

const checks = [
  {
    name: "Admin dashboard uses session + CSRF instead of raw token headers",
    file: "public/admin-dashboard.js",
    must: ["/admin/login", "x-admin-csrf", "credentials"],
    mustNot: ['"x-admin-token"', "Authorization:", "Bearer "]
  },
  {
    name: "Admin middleware creates HttpOnly session and verifies CSRF",
    file: "src/middleware/adminAuth.js",
    must: ["adminLogin", "nm_admin_session", "nm_admin_csrf", "x-admin-csrf", "httpOnly"]
  },
  {
    name: "Customer session access tokens are hashed and enforced",
    file: "src/services/session.service.js",
    must: ["public_access_token_hash", "hashSessionAccessToken", "assertSessionAccess"]
  },
  {
    name: "Checkout retry requires customer session token",
    file: "src/api/controllers/checkout.controller.js",
    must: ["assertSessionAccess", "getSessionAccessTokenFromRequest", "sessionAccessToken"]
  },
  {
    name: "Success/cancel pages pass session access token only from hash/sessionStorage",
    file: "public/webflow/checkout-pages.js",
    must: ["x-session-token", "nm_session_access", "location.hash"]
  },
  {
    name: "Questionnaire draft answers are not persisted in localStorage",
    file: "public/webflow/engine.js",
    must: ["sessionAccessToken", "sessionStorage"],
    mustNot: ["localStorage.setItem(DRAFT_STORAGE_KEY"]
  },
  {
    name: "Stripe webhook payload is minimized before database persistence",
    file: "src/services/webhook.service.js",
    must: ["sanitizeWebhookPayload", "safePayload", "metadata: {"]
  },
  {
    name: "Rate limiting can use database-backed counters and production HSTS",
    file: "src/middleware/security.js",
    must: ["api_rate_limits", "Strict-Transport-Security", "RATE_LIMIT_BACKEND"]
  },
  {
    name: "Database SSL behavior is explicit and configurable",
    file: "src/db/db.js",
    must: ["buildSslConfig", "DATABASE_SSL_MODE"],
    mustNot: ["rejectUnauthorized: false"]
  },
  {
    name: "Security hardening migration exists",
    file: "src/db/migrations/018_security_hardening.sql",
    must: ["admin_sessions", "api_rate_limits", "public_access_token_hash", "webhook_events"]
  }
];

let failures = 0;

for (const check of checks) {
  const absolutePath = path.join(root, check.file);
  const content = fs.existsSync(absolutePath)
    ? fs.readFileSync(absolutePath, "utf8")
    : "";

  const missing = (check.must || []).filter((needle) => !content.includes(needle));
  const forbidden = (check.mustNot || []).filter((needle) => content.includes(needle));

  if (!content || missing.length || forbidden.length) {
    failures += 1;
    console.error(`FAIL ${check.name}`);
    if (!content) console.error(`  missing file: ${check.file}`);
    if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
    if (forbidden.length) console.error(`  forbidden: ${forbidden.join(", ")}`);
  } else {
    console.log(`PASS ${check.name}`);
  }
}

if (failures) {
  console.error(`Security audit failed with ${failures} failing check(s).`);
  process.exit(1);
}

console.log("Security audit passed.");

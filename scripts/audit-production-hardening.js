import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
let checks = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function includes(relativePath, pattern, message) {
  check(pattern.test(read(relativePath)), message);
}

const worker = read("src/jobs/analysis.worker.js");
check(worker.includes("processNextAnalysisJob"), "Worker must use the governed analysis job service.");
check(!worker.includes("generateAnalysis"), "Worker must not duplicate direct report generation.");
check(!worker.includes("deliverReportEmailForSession"), "Worker must not bypass the governed delivery path.");

const stripe = read("src/services/stripe.service.js");
check(stripe.includes("checkoutAttempt"), "Stripe checkout idempotency must include the explicit attempt number.");
check(!/Date\.now\(|Math\.random\(/.test(stripe), "Stripe idempotency must not contain time or randomness.");
includes("src/services/stripe.service.js", /maxNetworkRetries:\s*env\.STRIPE_MAX_NETWORK_RETRIES/, "Stripe network retries must be configured.");
includes("src/services/stripe.service.js", /timeout:\s*env\.STRIPE_TIMEOUT_MS/, "Stripe timeout must be configured.");

includes("src/services/analysis.service.js", /timeout:\s*env\.OPENAI_TIMEOUT_MS/, "OpenAI timeout must be configured.");
includes("src/services/analysis.service.js", /maxRetries:\s*env\.OPENAI_MAX_RETRIES/, "OpenAI retries must be configured.");
includes("src/services/analysis.service.js", /max_output_tokens:\s*env\.OPENAI_MAX_OUTPUT_TOKENS/, "OpenAI output token budget must be explicit.");
includes("src/services/analysis.service.js", /REPORT_CONTRACT_INVALID/, "Invalid report contracts must fail the job.");

includes("src/services/report-email-delivery.service.js", /buildReportEmailIdempotencyKey/, "Report delivery must use content-aware provider idempotency.");
includes("src/api/controllers/cron.controller.js", /buildRecordEmailIdempotencyKey/, "Checkout recovery email must use provider idempotency.");
includes("src/services/follow-up-email.service.js", /buildRecordEmailIdempotencyKey/, "Customer follow-up email must use provider idempotency.");
includes("src/services/observation-follow-up.service.js", /buildRecordEmailIdempotencyKey/, "Observation follow-up email must use provider idempotency.");
includes("src/api/controllers/observation.controller.js", /clientError \? message : "Failed to save observation\."/, "Public observation errors must not expose internal details.");

includes("src/app/server.js", /express\.json\(\{\s*limit:\s*env\.HTTP_JSON_BODY_LIMIT_BYTES\s*\}\)/, "HTTP JSON body limit must be configured from validated env.");
includes("src/app/server.js", /server\.headersTimeout\s*=\s*env\.HTTP_HEADERS_TIMEOUT_MS/, "HTTP header timeout must be configured.");
includes("src/app/server.js", /server\.requestTimeout\s*=\s*env\.HTTP_REQUEST_TIMEOUT_MS/, "HTTP request timeout must be configured.");
includes("src/app/server.js", /process\.once\("SIGTERM"/, "Server must handle SIGTERM.");
includes("src/app/server.js", /await db\.close\(\)/, "Server shutdown must close the database pool.");

const normalizer = read("src/utils/normalizeCheckoutPayload.js");
check(normalizer.includes('.normalize("NFKC")'), "Checkout text must use Unicode normalization.");
check(normalizer.includes("\\u202A-\\u202E"), "Checkout text must strip bidi override controls.");

[
  "src/services/payment.service.js",
  "src/config/openai.js",
  "src/config/resend.js",
  "src/config/stripe.js"
].forEach((relativePath) => {
  check(!fs.existsSync(path.join(root, relativePath)), `Unused legacy module must be removed: ${relativePath}`);
});

if (failures.length) {
  console.error("Production hardening audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Production hardening audit passed (${checks} checks).`);

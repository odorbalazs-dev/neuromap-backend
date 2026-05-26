import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAdminDashboard } from "../src/api/controllers/admin-dashboard.controller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function createMockResponse() {
  const headers = {};

  return {
    headers,
    statusCode: null,
    body: "",
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    type(value) {
      headers["content-type"] = value;
      return this;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const res = createMockResponse();
getAdminDashboard({}, res);

assert(res.statusCode === 200, "Dashboard should return HTTP 200.");
assert(res.headers["content-type"] === "html", "Dashboard should return HTML.");
assert(
  res.headers["content-security-policy"]?.includes("script-src 'self'"),
  "Dashboard CSP should allow same-origin scripts."
);
assert(
  res.headers["content-security-policy"]?.includes("connect-src 'self'"),
  "Dashboard CSP should allow same-origin API calls."
);
assert(
  res.body.includes('/public/admin-dashboard.css'),
  "Dashboard HTML should reference admin-dashboard.css."
);
assert(
  res.body.includes('/public/admin-dashboard.js'),
  "Dashboard HTML should reference admin-dashboard.js."
);
assert(
  res.body.includes("Production Health Panel"),
  "Dashboard HTML should include the production health panel."
);
assert(
  res.body.includes("Control Center"),
  "Dashboard HTML should include the control center title."
);
assert(
  res.body.includes("controlCenterHeadline"),
  "Dashboard HTML should include the control center headline."
);
assert(
  res.body.includes("Command panel"),
  "Dashboard HTML should include the command panel."
);
assert(
  res.body.includes("Pipeline cockpit"),
  "Dashboard HTML should include the pipeline cockpit."
);
assert(
  res.body.includes("pipelineStages"),
  "Dashboard HTML should include the pipeline stages container."
);
assert(
  res.body.includes("nextAction"),
  "Dashboard HTML should include the recommended next action container."
);
assert(
  res.body.includes("healthRecommendations"),
  "Dashboard HTML should include health recommendations container."
);
assert(
  res.body.includes("Email delivery figyel"),
  "Dashboard HTML should include the email delivery panel."
);
assert(
  res.body.includes("emailIssueRows"),
  "Dashboard HTML should include the email issue rows container."
);
assert(
  res.body.includes("retryEmailBatchBtn"),
  "Dashboard HTML should include the batch email retry button."
);
assert(
  res.body.includes("alertCheckBtn"),
  "Dashboard HTML should include the proactive alert check button."
);
assert(
  res.body.includes("Proactive alerts"),
  "Dashboard HTML should include the proactive alerts panel."
);
assert(
  res.body.includes("alertRows"),
  "Dashboard HTML should include the proactive alert rows container."
);
assert(
  res.body.includes("retryableReportEmails"),
  "Dashboard HTML should include retryable report email metrics."
);
assert(
  res.body.includes("retryLimitReportEmails"),
  "Dashboard HTML should include retry limit report email metrics."
);
assert(
  res.body.includes("operationsLogRows"),
  "Dashboard HTML should include the operations log rows container."
);
assert(
  res.body.includes('data-log-filter="critical"'),
  "Dashboard HTML should include operations log filters."
);
assert(
  !/<script(?![^>]*src=)/i.test(res.body),
  "Dashboard should not contain inline scripts."
);

[
  "public/admin-dashboard.css",
  "public/admin-dashboard.js"
].forEach((relativePath) => {
  const fullPath = path.join(rootDir, relativePath);
  assert(fs.existsSync(fullPath), `${relativePath} should exist.`);
});

console.log("[smoke] admin dashboard assets passed");

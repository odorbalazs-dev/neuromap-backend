import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAdminDashboard } from "../src/api/controllers/admin-dashboard.controller.js";
import { buildAdminSessionReportSummary } from "../src/services/admin-session-summary.service.js";

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
  res.body.includes("Éles rendszer állapota"),
  "Dashboard HTML should include the production health panel."
);
assert(
  res.body.includes("Vezérlőközpont"),
  "Dashboard HTML should include the control center title."
);
assert(
  res.body.includes("controlCenterHeadline"),
  "Dashboard HTML should include the control center headline."
);
assert(
  res.body.includes("Műveleti panel"),
  "Dashboard HTML should include the command panel."
);
assert(
  res.body.includes("Folyamat áttekintés"),
  "Dashboard HTML should include the pipeline cockpit."
);
assert(
  res.body.includes("Élesítési ellenőrzés"),
  "Dashboard HTML should include the launch readiness panel."
);
assert(
  res.body.includes("launchReadinessChecks"),
  "Dashboard HTML should include the launch readiness checks container."
);
assert(
  res.body.includes("launchManualChecks"),
  "Dashboard HTML should include the manual launch checks container."
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
  res.body.includes("Email kézbesítés figyelés"),
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
  res.body.includes("Proaktív riasztások"),
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
  res.body.includes("Session keresés"),
  "Dashboard HTML should include the session search panel."
);
assert(
  res.body.includes("sessionSearchInput"),
  "Dashboard HTML should include the session search input."
);
assert(
  res.body.includes("sessionSearchRows"),
  "Dashboard HTML should include session search rows."
);
assert(
  res.body.includes("Olvasható idővonal"),
  "Dashboard HTML should describe the readable session detail panel."
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

const dashboardJs = fs.readFileSync(
  path.join(rootDir, "public/admin-dashboard.js"),
  "utf8"
);

assert(
  dashboardJs.includes('data-action = "download-pdf"') ||
    dashboardJs.includes('"download-pdf"'),
  "Dashboard JS should include the PDF download action."
);
assert(
  dashboardJs.includes("/report-pdf"),
  "Dashboard JS should call the admin report PDF endpoint."
);
assert(
  dashboardJs.includes("/regenerate-pdf"),
  "Dashboard JS should call the admin PDF regeneration endpoint."
);
assert(
  dashboardJs.includes("/admin/search-sessions"),
  "Dashboard JS should call the admin session search endpoint."
);
assert(
  dashboardJs.includes("renderSessionDetail"),
  "Dashboard JS should render a readable session detail view."
);
assert(
  dashboardJs.includes("renderReportSnapshot"),
  "Dashboard JS should render the report snapshot panel."
);
assert(
  dashboardJs.includes("Engine döntés"),
  "Dashboard JS should expose Engine Intelligence v2 decision fields."
);
assert(
  dashboardJs.includes("Engine fókuszterületek"),
  "Dashboard JS should expose Engine Intelligence v2 focus areas."
);
assert(
  dashboardJs.includes("reportSummary"),
  "Dashboard JS should use the admin report summary payload."
);
assert(
  dashboardJs.includes("Email retry elérhető"),
  "Dashboard JS should expose email retry state in session details."
);
assert(
  dashboardJs.includes("Elemzés retry javasolt"),
  "Dashboard JS should expose analysis retry state in session details."
);
assert(
  dashboardJs.includes("Riport áttekintés"),
  "Dashboard JS should render the session report snapshot in Hungarian."
);
assert(
  dashboardJs.includes("renderSessionDiagnostics"),
  "Dashboard JS should render the session diagnostics panel."
);
assert(
  dashboardJs.includes("Hibakeresési térkép"),
  "Dashboard JS should render the troubleshooting map in Hungarian."
);
assert(
  dashboardJs.includes("Javasolt következő lépések"),
  "Dashboard JS should render recommended next actions in session details."
);
assert(
  dashboardJs.includes("Worker job előzmények"),
  "Dashboard JS should expose worker job history in session details."
);
assert(
  dashboardJs.includes("Webhook események"),
  "Dashboard JS should expose related webhook events in session details."
);
assert(
  dashboardJs.includes("Gyermek életkora"),
  "Dashboard JS should expose child age in Hungarian."
);
assert(
  dashboardJs.includes("A fő rendszerek rendben vannak"),
  "Dashboard JS should render the control center state in Hungarian."
);
assert(
  dashboardJs.includes("Email kézbesítés"),
  "Dashboard JS should render the pipeline stages in Hungarian."
);
assert(
  dashboardJs.includes("/admin/launch-readiness"),
  "Dashboard JS should call the admin launch readiness endpoint."
);
assert(
  dashboardJs.includes("renderLaunchReadiness"),
  "Dashboard JS should render launch readiness results."
);

const summary = buildAdminSessionReportSummary(
  {
    lang: "hu",
    payment_status: "paid",
    analysis_status: "failed",
    report_email_status: "failed",
    report_email_attempts: 3,
    analysis_result: "Riport szöveg",
    payload: {
      childAge: 7,
      detectedRisk: "ADHD",
      secondaryRisk: "ASD",
      questionnaireVersion: "smoke-v1",
      triageScores: {
        ADHD: 11,
        ASD: 9,
        ANXIETY: 4,
        DEPRESSION: 3,
        LEARNING: 2
      },
      triageRanking: [
        {
          domain: "ADHD",
          weightedSignal: 2.25,
          raw: 11,
          average: 2.2,
          strongestSubdomain: 2.4,
          consistency: 0.8
        },
        {
          domain: "ASD",
          weightedSignal: 1.9,
          raw: 9,
          average: 1.8,
          strongestSubdomain: 2,
          consistency: 0.7
        }
      ],
      specificProfile: {
        severity: "moderate",
        normalizedAverage: 1.6
      },
      specificScoring: {
        normalizedAverage: 1.6,
        totalWeight: 30,
        subdomains: {
          inattention: { average: 1.7, itemCount: 4 },
          executive: { average: 1.5, itemCount: 4 }
        }
      },
      resultSummary: {
        signal: {
          key: "moderate",
          hu: "közepes jelzésszint",
          en: "moderate signal level"
        },
        topSubdomains: [
          { key: "inattention", average: 1.7, itemCount: 4 }
        ]
      }
    }
  },
  {
    id: "job_smoke",
    status: "failed",
    attempts: 2,
    last_error: "smoke error"
  }
);

assert(summary.childAge === 7, "Admin report summary should expose child age.");
assert(summary.ageBand === "early_school", "Admin report summary should expose age band.");
assert(summary.detectedRisk === "ADHD", "Admin report summary should expose primary risk.");
assert(summary.secondaryRisk === "ASD", "Admin report summary should expose secondary risk.");
assert(summary.severity === "moderate", "Admin report summary should expose severity.");
assert(summary.engine?.primaryDomain === "ADHD", "Admin report summary should expose engine primary domain.");
assert(summary.engine?.secondaryDomain === "ASD", "Admin report summary should expose engine secondary domain.");
assert(summary.engine?.scoreSource === "triageRanking.weightedSignal", "Admin report summary should expose engine score source.");
assert(summary.engine?.patternType, "Admin report summary should expose engine pattern type.");
assert(summary.engine?.decisionQuality, "Admin report summary should expose engine decision quality.");
assert(summary.email.retryLimitReached === true, "Admin report summary should expose email retry limit.");
assert(summary.analysisRetry.retryRecommended === true, "Admin report summary should expose analysis retry recommendation.");

console.log("[smoke] admin dashboard assets passed");

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
  res.body.includes("Operátori fókusz"),
  "Dashboard HTML should include the operator focus panel."
);
assert(
  res.body.includes("operatorTaskRows"),
  "Dashboard HTML should include the operator task rows container."
);
assert(
  res.body.includes("latestSessionCard"),
  "Dashboard HTML should include the latest session card."
);
assert(
  res.body.includes('data-scroll-target="queuePanel"'),
  "Dashboard HTML should include quick navigation scroll targets."
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
  res.body.includes("Engine analytics"),
  "Dashboard HTML should include the engine analytics panel."
);
assert(
  res.body.includes("engineAnalyticsTotal"),
  "Dashboard HTML should include engine analytics metrics."
);
assert(
  res.body.includes("engineDomainRows"),
  "Dashboard HTML should include engine domain distribution."
);
assert(
  res.body.includes("engineReviewRows"),
  "Dashboard HTML should include engine review queue rows."
);
assert(
  res.body.includes("toggleEngineReviewBtn"),
  "Dashboard HTML should include the engine review collapse toggle."
);
assert(
  res.body.includes("engineReviewPanelBody"),
  "Dashboard HTML should include the collapsible engine review body."
);
assert(
  res.body.includes("engineAuditAudited"),
  "Dashboard HTML should include live engine decision audit metrics."
);
assert(
  res.body.includes("engineDecisionAuditRows"),
  "Dashboard HTML should include live engine decision audit rows."
);
assert(
  res.body.includes("toggleEngineDecisionAuditBtn"),
  "Dashboard HTML should include the engine decision audit collapse toggle."
);
assert(
  res.body.includes("engineDecisionAuditPanelBody"),
  "Dashboard HTML should include the collapsible engine decision audit body."
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
  res.body.includes("emailDeliverabilityLevel"),
  "Dashboard HTML should include the email deliverability monitor metrics."
);
assert(
  res.body.includes("emailDeliverabilityErrorRows"),
  "Dashboard HTML should include email deliverability error rows."
);
assert(
  res.body.includes("emailDeliverabilityRecommendationRows"),
  "Dashboard HTML should include email deliverability recommendations."
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
  res.body.includes("toggleOperationsLogBtn"),
  "Dashboard HTML should include the operations log collapse toggle."
);
assert(
  res.body.includes("operationsLogPanelBody"),
  "Dashboard HTML should include the collapsible operations log body."
);
assert(
  res.body.includes("toggleSessionListsBtn"),
  "Dashboard HTML should include the session lists collapse toggle."
);
assert(
  res.body.includes("sessionListsPanelBody"),
  "Dashboard HTML should include the collapsible session lists body."
);
assert(
  res.body.includes("sessionDetailPanel"),
  "Dashboard HTML should include the session detail scroll target."
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
assert(
  res.body.includes("Control Center v2 pulzus"),
  "Dashboard HTML should include the Control Center v2 pulse panel."
);
assert(
  res.body.includes("controlPulseUpdatedAt"),
  "Dashboard HTML should include the control pulse timestamp."
);
assert(
  res.body.includes("pulseCheckout"),
  "Dashboard HTML should include the checkout pulse card."
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

const dashboardCss = fs.readFileSync(
  path.join(rootDir, "public/admin-dashboard.css"),
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
  dashboardJs.includes("/admin/engine-decision-audit"),
  "Dashboard JS should call the live engine decision audit endpoint."
);
assert(
  dashboardJs.includes("/admin/email-deliverability?hours=168&limit=30"),
  "Dashboard JS should call the email deliverability monitor endpoint."
);
assert(
  dashboardJs.includes("renderEmailDeliverability"),
  "Dashboard JS should render email deliverability monitor results."
);
assert(
  dashboardJs.includes("emailDeliverability"),
  "Dashboard JS should include email deliverability data in the dashboard refresh."
);
assert(
  dashboardJs.includes("renderEngineDecisionAudit"),
  "Dashboard JS should render live engine decision audit results."
);
assert(
  dashboardJs.includes("primaryMismatchCount"),
  "Dashboard JS should surface primary engine decision mismatches."
);
assert(
  dashboardJs.includes("setOperationsLogCollapsed"),
  "Dashboard JS should toggle the operations log body."
);
assert(
  dashboardJs.includes("toggleOperationsLog"),
  "Dashboard JS should expose a dedicated operations log toggle handler."
);
assert(
  dashboardJs.includes("OPERATIONS_LOG_KEY"),
  "Dashboard JS should persist the operations log collapsed state."
);
assert(
  dashboardJs.includes("initCollapsibleSections"),
  "Dashboard JS should initialize generic collapsible dashboard sections."
);
assert(
  dashboardJs.includes("toggleCollapsibleSection"),
  "Dashboard JS should toggle collapsible dashboard sections."
);
assert(
  dashboardJs.includes("COLLAPSIBLE_SECTION_KEY_PREFIX"),
  "Dashboard JS should persist generic collapsible section state."
);
assert(
  dashboardJs.includes("getRowSessionId"),
  "Dashboard JS should normalize session IDs for all dashboard row actions."
);
assert(
  dashboardJs.includes("dataset.sessionId"),
  "Dashboard JS should attach session IDs to action buttons for delegated clicks."
);
assert(
  dashboardJs.includes("renderControlPulse"),
  "Dashboard JS should render the Control Center v2 pulse panel."
);
assert(
  dashboardJs.includes("setPulseCard"),
  "Dashboard JS should update pulse card statuses."
);
assert(
  dashboardJs.includes("bindClick"),
  "Dashboard JS should use guarded click binding for optional controls."
);
assert(
  dashboardJs.includes("handleAction(action, sessionId)"),
  "Dashboard JS should route row actions through a shared action handler."
);
assert(
  dashboardJs.includes('button.addEventListener("click"'),
  "Dashboard JS should bind row action buttons directly."
);
assert(
  dashboardJs.includes("scrollSessionDetailIntoView"),
  "Dashboard JS should scroll to session details after opening them."
);
assert(
  dashboardJs.includes("scrollToPanel"),
  "Dashboard JS should support dashboard quick navigation."
);
assert(
  dashboardJs.includes("renderOperatorFocus"),
  "Dashboard JS should render the operator focus panel."
);
assert(
  dashboardJs.includes("renderLatestSessionCard"),
  "Dashboard JS should render the latest session card."
);
assert(
  dashboardJs.includes("operatorTaskRows"),
  "Dashboard JS should update the operator task rows."
);
assert(
  dashboardJs.includes('document.getElementById("sessionDetailPanel")'),
  "Dashboard JS should scroll to the stable session detail panel target."
);
assert(
  dashboardJs.includes("renderSessionDetail"),
  "Dashboard JS should render a readable session detail view."
);
assert(
  dashboardJs.includes("renderSessionCockpit"),
  "Dashboard JS should render the session cockpit view."
);
assert(
  dashboardJs.includes("renderSessionStageRail"),
  "Dashboard JS should render the session stage rail."
);
assert(
  dashboardJs.includes("renderPriorityFacts"),
  "Dashboard JS should render session priority facts."
);
assert(
  dashboardJs.includes("Részlet fókusz"),
  "Dashboard JS should expose the session detail focus copy."
);
assert(
  dashboardJs.includes("Folyamatlépések"),
  "Dashboard JS should expose the session process stages copy."
);
assert(
  dashboardJs.includes("Prioritás adatok"),
  "Dashboard JS should expose priority session facts."
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
assert(
  dashboardJs.includes("/admin/engine-analytics"),
  "Dashboard JS should call the admin engine analytics endpoint."
);
assert(
  dashboardJs.includes("renderEngineAnalytics"),
  "Dashboard JS should render engine analytics results."
);
assert(
  dashboardJs.includes("reviewQueue"),
  "Dashboard JS should render the engine analytics review queue."
);
assert(
  dashboardJs.includes("engineOverlapRows"),
  "Dashboard JS should render engine overlap rows."
);
assert(
  dashboardCss.includes(".quick-nav"),
  "Dashboard CSS should style the quick navigation."
);
assert(
  dashboardCss.includes(".subpanel-head"),
  "Dashboard CSS should style collapsible subpanel headers."
);
assert(
  dashboardCss.includes(".session-lists-toggle-panel"),
  "Dashboard CSS should style the session lists collapse panel."
);
assert(
  dashboardCss.includes(".operator-panel"),
  "Dashboard CSS should style the operator focus panel."
);
assert(
  dashboardCss.includes(".control-pulse-grid"),
  "Dashboard CSS should style the control pulse grid."
);
assert(
  dashboardCss.includes(".pulse-card"),
  "Dashboard CSS should style the control pulse cards."
);
assert(
  dashboardCss.includes(".latest-row"),
  "Dashboard CSS should highlight the latest session row."
);
assert(
  dashboardCss.includes(".session-cockpit"),
  "Dashboard CSS should style the session cockpit."
);
assert(
  dashboardCss.includes(".session-stage-grid"),
  "Dashboard CSS should style the session stage rail."
);
assert(
  dashboardCss.includes(".priority-facts-grid"),
  "Dashboard CSS should style the session priority facts."
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

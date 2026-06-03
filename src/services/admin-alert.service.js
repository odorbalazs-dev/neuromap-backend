import { db } from "../db/db.js";
import { env } from "../config/env.js";
import { sendAdminAlertEmail } from "./email.service.js";
import { buildBankQualityAudit } from "./bank-quality-audit.service.js";
import { buildEmailDeliverabilityMonitor } from "./email-deliverability.service.js";
import { buildPostPaymentMonitor } from "./post-payment-monitoring.service.js";

function normalizeNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    Math.max(number, min),
    max
  );
}

function minutesSince(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;

  return Math.max(0, Math.round((Date.now() - timestamp) / 60000));
}

function buildReason(key, count, label, recommendation) {
  return {
    key,
    count: Number(count || 0),
    label,
    recommendation
  };
}

function buildAlertReasons(metrics) {
  return [
    buildReason(
      "stale_processing_jobs",
      metrics.staleProcessingJobs,
      "Stale processing jobs",
      "Check the worker logs and run one queued job manually from the admin dashboard."
    ),
    buildReason(
      "failed_webhooks_24h",
      metrics.failedWebhooks24h,
      "Failed Stripe webhooks in the last 24h",
      "Check the Stripe webhook secret, recent webhook logs, and affected sessions."
    ),
    buildReason(
      "failed_report_emails",
      metrics.failedReportEmails,
      "Failed report emails",
      "Use Email retry batch or resend the affected report email from the dashboard."
    ),
    buildReason(
      "retry_limit_report_emails",
      metrics.retryLimitReportEmails,
      "Report emails at retry limit",
      "Inspect these sessions manually, reset retry state if appropriate, then resend."
    )
  ].filter((reason) => reason.count > 0);
}

function resolveHealthLevel(metrics) {
  const reasons = buildAlertReasons(metrics);

  if (reasons.length > 0) {
    return "critical";
  }

  if (
    metrics.failedJobs > 0 ||
    metrics.paidFailedSessions > 0 ||
    metrics.unsentDoneReports > 0
  ) {
    return "warning";
  }

  if (
    metrics.paidQueuedSessions > 0 ||
    metrics.paidProcessingSessions > 0
  ) {
    return "active";
  }

  return "healthy";
}

function buildAlertKey(level, reasons) {
  if (!reasons.length) {
    return `production-health:${level}`;
  }

  return `production-health:${level}:${reasons
    .map((reason) => reason.key)
    .sort()
    .join("+")}`;
}

function severityRank(level) {
  const ranks = {
    healthy: 0,
    active: 1,
    review: 2,
    warning: 3,
    critical: 4
  };

  return ranks[level] ?? 0;
}

function normalizeAlertThreshold(value, fallback = "warning") {
  const normalized = String(value || fallback).toLowerCase();
  return ["review", "warning", "critical"].includes(normalized)
    ? normalized
    : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailContent({ level, metrics, reasons, generatedAt }) {
  const dashboardUrl = `${env.APP_BASE_URL}/admin/dashboard`;
  const subject = `[NeuroMap] ${level.toUpperCase()} production alert`;
  const summary = reasons.length
    ? reasons.map((reason) => `${reason.label}: ${reason.count}`).join("; ")
    : `Production health is ${level}.`;

  const reasonLines = reasons.map((reason) => {
    return `- ${reason.label}: ${reason.count}. ${reason.recommendation}`;
  });

  const metricLines = [
    `staleProcessingJobs=${metrics.staleProcessingJobs}`,
    `failedWebhooks24h=${metrics.failedWebhooks24h}`,
    `failedReportEmails=${metrics.failedReportEmails}`,
    `retryLimitReportEmails=${metrics.retryLimitReportEmails}`,
    `failedJobs=${metrics.failedJobs}`,
    `paidFailedSessions=${metrics.paidFailedSessions}`,
    `unsentDoneReports=${metrics.unsentDoneReports}`,
    `paidQueuedSessions=${metrics.paidQueuedSessions}`,
    `paidProcessingSessions=${metrics.paidProcessingSessions}`
  ];

  const text = [
    `NeuroMap production alert: ${level}`,
    "",
    summary,
    "",
    "Reasons:",
    ...(reasonLines.length ? reasonLines : ["- No critical reason detected."]),
    "",
    "Metrics:",
    ...metricLines.map((line) => `- ${line}`),
    "",
    `Dashboard: ${dashboardUrl}`,
    `Generated at: ${generatedAt}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#102033;">
      <h1 style="margin:0 0 12px;">NeuroMap production alert</h1>
      <p><strong>Level:</strong> ${escapeHtml(level)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(summary)}</p>
      <h2 style="font-size:18px;margin-top:20px;">Reasons</h2>
      <ul>
        ${
          reasons.length
            ? reasons.map((reason) => `
                <li>
                  <strong>${escapeHtml(reason.label)}:</strong>
                  ${escapeHtml(reason.count)}
                  <br>${escapeHtml(reason.recommendation)}
                </li>
              `).join("")
            : "<li>No critical reason detected.</li>"
        }
      </ul>
      <h2 style="font-size:18px;margin-top:20px;">Metrics</h2>
      <ul>
        ${metricLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
      <p>
        <a href="${escapeHtml(dashboardUrl)}" style="color:#1197d5;font-weight:bold;">
          Open admin dashboard
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">Generated at: ${escapeHtml(generatedAt)}</p>
    </div>
  `;

  return {
    subject,
    summary,
    text,
    html
  };
}

function resolveBankQualityLevel(summary = {}) {
  const issueCounts = summary.issueCounts || {};

  if (Number(summary.blockingIssueCount || 0) > 0 || Number(issueCounts.critical || 0) > 0) {
    return "critical";
  }

  if (Number(issueCounts.warning || 0) > 0) {
    return "warning";
  }

  if (Number(issueCounts.review || 0) > 0) {
    return "review";
  }

  return "healthy";
}

function buildBankQualityAlertKey(level, summary = {}) {
  const issueCodes = (summary.issueCodes || [])
    .map((item) => item.key)
    .filter(Boolean)
    .sort()
    .join("+");

  return issueCodes
    ? `bank-quality:${level}:${issueCodes}`
    : `bank-quality:${level}`;
}

function buildBankQualityEmailContent({ level, audit, threshold }) {
  const summary = audit.summary || {};
  const issueCounts = summary.issueCounts || {};
  const lowestScoringBanks = summary.lowestScoringBanks || [];
  const recommendations = summary.recommendations || [];
  const dashboardUrl = `${env.APP_BASE_URL}/admin/dashboard`;

  const subject = `[NeuroMap] ${level.toUpperCase()} bank quality audit`;
  const textLines = [
    `NeuroMap bank quality audit: ${level}`,
    "",
    `Threshold: ${threshold}`,
    `Average score: ${summary.averageScore ?? "-"}/100`,
    `Issues: critical=${Number(issueCounts.critical || 0)}, warning=${Number(issueCounts.warning || 0)}, review=${Number(issueCounts.review || 0)}`,
    `Blocking issues: ${Number(summary.blockingIssueCount || 0)}`,
    "",
    "Lowest scoring banks:",
    ...(lowestScoringBanks.length
      ? lowestScoringBanks.map((bank) => `- ${bank.name}: ${bank.score}/100 (${bank.readiness})`)
      : ["- none"]),
    "",
    "Recommendations:",
    ...(recommendations.length
      ? recommendations.map((item) => `- [${item.level}] ${item.title}: ${item.detail}`)
      : ["- none"]),
    "",
    `Dashboard: ${dashboardUrl}`,
    `Generated at: ${audit.generatedAt}`
  ];

  const summaryText =
    `Bank quality ${level}: average ${summary.averageScore ?? "-"}, ` +
    `critical ${Number(issueCounts.critical || 0)}, warning ${Number(issueCounts.warning || 0)}, review ${Number(issueCounts.review || 0)}.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#102033;">
      <h1 style="margin:0 0 12px;">NeuroMap bank quality audit</h1>
      <p><strong>Level:</strong> ${escapeHtml(level)}</p>
      <p><strong>Threshold:</strong> ${escapeHtml(threshold)}</p>
      <p><strong>Average score:</strong> ${escapeHtml(summary.averageScore ?? "-")}/100</p>
      <p>
        <strong>Issues:</strong>
        critical=${escapeHtml(Number(issueCounts.critical || 0))},
        warning=${escapeHtml(Number(issueCounts.warning || 0))},
        review=${escapeHtml(Number(issueCounts.review || 0))}
      </p>
      <h2 style="font-size:18px;margin-top:20px;">Lowest scoring banks</h2>
      <ul>
        ${
          lowestScoringBanks.length
            ? lowestScoringBanks.map((bank) => `
                <li>${escapeHtml(bank.name)}: ${escapeHtml(bank.score)}/100 (${escapeHtml(bank.readiness)})</li>
              `).join("")
            : "<li>None</li>"
        }
      </ul>
      <h2 style="font-size:18px;margin-top:20px;">Recommendations</h2>
      <ul>
        ${
          recommendations.length
            ? recommendations.map((item) => `
                <li>
                  <strong>${escapeHtml(item.title)}:</strong>
                  ${escapeHtml(item.detail)}
                </li>
              `).join("")
            : "<li>None</li>"
        }
      </ul>
      <p>
        <a href="${escapeHtml(dashboardUrl)}" style="color:#1197d5;font-weight:bold;">
          Open admin dashboard
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">Generated at: ${escapeHtml(audit.generatedAt)}</p>
    </div>
  `;

  return {
    subject,
    summary: summaryText,
    text: textLines.join("\n"),
    html
  };
}

function buildOperationalIssue({
  key,
  level,
  label,
  count = 0,
  detail,
  recommendation
}) {
  return {
    key,
    level,
    label,
    count: Number(count || 0),
    detail: detail || "",
    recommendation: recommendation || ""
  };
}

function buildOperationalIssues({ health, postPayment, emailDeliverability }) {
  const issues = [];

  for (const reason of health.reasons || []) {
    issues.push(
      buildOperationalIssue({
        key: `health_${reason.key}`,
        level: "critical",
        label: reason.label,
        count: reason.count,
        detail: "Production health monitor detected a critical backend condition.",
        recommendation: reason.recommendation
      })
    );
  }

  for (const stage of postPayment.stages || []) {
    if (severityRank(stage.level) < severityRank("warning")) continue;

    issues.push(
      buildOperationalIssue({
        key: `post_payment_${stage.key}`,
        level: stage.level,
        label: stage.label,
        count: stage.count,
        detail: stage.detail,
        recommendation: (postPayment.recommendations || [])[0] || "Open the post-payment monitoring panel and inspect affected sessions."
      })
    );
  }

  const emailMetrics = emailDeliverability.metrics || {};
  if (severityRank(emailDeliverability.level) >= severityRank("warning")) {
    issues.push(
      buildOperationalIssue({
        key: "email_deliverability",
        level: emailDeliverability.level,
        label: "Email deliverability",
        count:
          Number(emailMetrics.failedCount || 0) +
          Number(emailMetrics.retryLimitCount || 0) +
          Number(emailMetrics.staleSendingCount || 0) +
          Number(emailMetrics.unsentDoneCount || 0),
        detail:
          `failed=${Number(emailMetrics.failedCount || 0)}, ` +
          `retryLimit=${Number(emailMetrics.retryLimitCount || 0)}, ` +
          `staleSending=${Number(emailMetrics.staleSendingCount || 0)}, ` +
          `failureRate=${emailMetrics.failureRate === null || emailMetrics.failureRate === undefined
            ? "-"
            : Math.round(Number(emailMetrics.failureRate || 0) * 100) + "%"}`,
        recommendation: (emailDeliverability.recommendations || [])[0] || "Open the email deliverability panel and run retry if appropriate."
      })
    );
  }

  return issues.sort((a, b) => {
    if (severityRank(b.level) !== severityRank(a.level)) {
      return severityRank(b.level) - severityRank(a.level);
    }

    return Number(b.count || 0) - Number(a.count || 0);
  });
}

function resolveOperationalLevel({ health, postPayment, emailDeliverability, issues }) {
  if (issues.length) {
    return issues[0].level;
  }

  const levels = [
    health.level,
    postPayment.level,
    emailDeliverability.level
  ].filter(Boolean);

  return levels.sort((a, b) => severityRank(b) - severityRank(a))[0] || "healthy";
}

function buildOperationalAlertKey(level, issues) {
  if (!issues.length) {
    return `operational:${level}`;
  }

  return `operational:${level}:${issues
    .map((issue) => issue.key)
    .filter(Boolean)
    .sort()
    .join("+")}`;
}

function buildOperationalEmailContent({ snapshot, threshold }) {
  const dashboardUrl = `${env.APP_BASE_URL}/admin/dashboard`;
  const issueLines = snapshot.issues.map((issue) => {
    return `- [${issue.level}] ${issue.label}: ${issue.count}. ${issue.detail} ${issue.recommendation}`.trim();
  });

  const metrics = snapshot.metrics || {};
  const subject = `[NeuroMap] ${snapshot.level.toUpperCase()} operational alert`;
  const summary = snapshot.issues.length
    ? snapshot.issues
        .slice(0, 4)
        .map((issue) => `${issue.label}: ${issue.count}`)
        .join("; ")
    : `Operational health is ${snapshot.level}.`;

  const metricLines = [
    `threshold=${threshold}`,
    `windowHours=${snapshot.window.hours}`,
    `productionHealth=${snapshot.health.level}`,
    `postPayment=${snapshot.postPaymentMonitoring.level}`,
    `emailDeliverability=${snapshot.emailDeliverability.level}`,
    `paidSessions=${metrics.paidSessions}`,
    `postPaymentIssues=${metrics.postPaymentIssueCount}`,
    `emailFailed=${metrics.emailFailedCount}`,
    `emailRetryLimit=${metrics.emailRetryLimitCount}`,
    `staleProcessingJobs=${metrics.staleProcessingJobs}`,
    `failedWebhooks24h=${metrics.failedWebhooks24h}`
  ];

  const text = [
    `NeuroMap operational alert: ${snapshot.level}`,
    "",
    summary,
    "",
    "Issues:",
    ...(issueLines.length ? issueLines : ["- No issue above threshold detected."]),
    "",
    "Metrics:",
    ...metricLines.map((line) => `- ${line}`),
    "",
    `Dashboard: ${dashboardUrl}`,
    `Generated at: ${snapshot.generatedAt}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#102033;">
      <h1 style="margin:0 0 12px;">NeuroMap operational alert</h1>
      <p><strong>Level:</strong> ${escapeHtml(snapshot.level)}</p>
      <p><strong>Threshold:</strong> ${escapeHtml(threshold)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(summary)}</p>
      <h2 style="font-size:18px;margin-top:20px;">Issues</h2>
      <ul>
        ${
          snapshot.issues.length
            ? snapshot.issues.map((issue) => `
                <li>
                  <strong>[${escapeHtml(issue.level)}] ${escapeHtml(issue.label)}:</strong>
                  ${escapeHtml(issue.count)}
                  <br>${escapeHtml(issue.detail)}
                  <br>${escapeHtml(issue.recommendation)}
                </li>
              `).join("")
            : "<li>No issue above threshold detected.</li>"
        }
      </ul>
      <h2 style="font-size:18px;margin-top:20px;">Metrics</h2>
      <ul>
        ${metricLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
      <p>
        <a href="${escapeHtml(dashboardUrl)}" style="color:#1197d5;font-weight:bold;">
          Open admin dashboard
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">Generated at: ${escapeHtml(snapshot.generatedAt)}</p>
    </div>
  `;

  return {
    subject,
    summary,
    text,
    html
  };
}

async function getHealthMetrics() {
  const [
    staleJobs,
    jobCounts,
    webhookTiming,
    sessionCounts,
    reportEmailTiming
  ] = await Promise.all([
    db.query(`
      SELECT COUNT(*)::int AS count
      FROM analysis_jobs
      WHERE status = 'processing'
        AND locked_at < NOW() - INTERVAL '15 minutes'
    `),
    db.query(`
      SELECT
        status,
        COUNT(*)::int AS count
      FROM analysis_jobs
      GROUP BY status
    `),
    db.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'failed'
            AND created_at >= NOW() - INTERVAL '24 hours'
        )::int AS failed_last_24h,
        MAX(created_at) AS last_received_at,
        MAX(processed_at) AS last_processed_at
      FROM webhook_events
    `),
    db.query(`
      SELECT
        payment_status,
        analysis_status,
        COUNT(*)::int AS count
      FROM sessions
      GROUP BY payment_status, analysis_status
    `),
    db.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE report_email_status = 'failed'
        )::int AS failed_count,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND analysis_result IS NOT NULL
            AND LENGTH(TRIM(analysis_result)) > 0
            AND report_email_status IN ('not_sent', 'sending')
        )::int AS unsent_done_count,
        COUNT(*) FILTER (
          WHERE analysis_status = 'done'
            AND analysis_result IS NOT NULL
            AND LENGTH(TRIM(analysis_result)) > 0
            AND report_email_status IN ('failed', 'not_sent', 'sending')
            AND COALESCE(report_email_attempts, 0) >= 3
        )::int AS retry_limit_count,
        MAX(report_email_sent_at) AS last_sent_at,
        MAX(report_email_last_attempt_at) AS last_attempt_at
      FROM sessions
      WHERE payment_status = 'paid'
    `)
  ]);

  const jobs = jobCounts.rows.reduce((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, {});

  const sessions = {};
  for (const row of sessionCounts.rows) {
    const paymentStatus = row.payment_status || "unknown";
    const analysisStatus = row.analysis_status || "unknown";
    sessions[paymentStatus] = sessions[paymentStatus] || {};
    sessions[paymentStatus][analysisStatus] = Number(row.count || 0);
  }

  const webhookRow = webhookTiming.rows[0] || {};
  const emailRow = reportEmailTiming.rows[0] || {};

  const metrics = {
    staleProcessingJobs: Number(staleJobs.rows[0]?.count || 0),
    failedJobs: Number(jobs.failed || 0),
    failedWebhooks24h: Number(webhookRow.failed_last_24h || 0),
    paidFailedSessions: Number(sessions.paid?.failed || 0),
    paidQueuedSessions: Number(sessions.paid?.queued || 0),
    paidProcessingSessions: Number(sessions.paid?.processing || 0),
    failedReportEmails: Number(emailRow.failed_count || 0),
    unsentDoneReports: Number(emailRow.unsent_done_count || 0),
    retryLimitReportEmails: Number(emailRow.retry_limit_count || 0)
  };

  return {
    generatedAt: new Date().toISOString(),
    level: resolveHealthLevel(metrics),
    metrics,
    reasons: buildAlertReasons(metrics),
    timings: {
      lastWebhookReceivedAt: webhookRow.last_received_at || null,
      lastWebhookReceivedMinutesAgo: minutesSince(webhookRow.last_received_at),
      lastWebhookProcessedAt: webhookRow.last_processed_at || null,
      lastWebhookProcessedMinutesAgo: minutesSince(webhookRow.last_processed_at),
      lastReportEmailSentAt: emailRow.last_sent_at || null,
      lastReportEmailSentMinutesAgo: minutesSince(emailRow.last_sent_at),
      lastReportEmailAttemptAt: emailRow.last_attempt_at || null,
      lastReportEmailAttemptMinutesAgo: minutesSince(emailRow.last_attempt_at)
    }
  };
}

export async function buildOperationalAlertSnapshot(options = {}) {
  const windowHours = normalizeNumber(
    options.windowHours ?? options.hours ?? env.ADMIN_OPERATIONAL_ALERT_WINDOW_HOURS,
    24,
    1,
    720
  );

  const [health, postPaymentMonitoring, emailDeliverability] = await Promise.all([
    getHealthMetrics(),
    buildPostPaymentMonitor({
      hours: windowHours,
      limit: normalizeNumber(options.limit, 30, 5, 100)
    }),
    buildEmailDeliverabilityMonitor({
      windowHours,
      limit: normalizeNumber(options.limit, 30, 1, 100)
    })
  ]);

  const issues = buildOperationalIssues({
    health,
    postPayment: postPaymentMonitoring,
    emailDeliverability
  });

  const level = resolveOperationalLevel({
    health,
    postPayment: postPaymentMonitoring,
    emailDeliverability,
    issues
  });

  const postPaymentMetrics = postPaymentMonitoring.metrics || {};
  const emailMetrics = emailDeliverability.metrics || {};

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    level,
    window: {
      hours: windowHours
    },
    issues,
    metrics: {
      paidSessions: Number(postPaymentMetrics.paidSessions || 0),
      postPaymentIssueCount: Number(postPaymentMetrics.issueCount || 0),
      emailFailedCount: Number(emailMetrics.failedCount || 0),
      emailRetryLimitCount: Number(emailMetrics.retryLimitCount || 0),
      emailStaleSendingCount: Number(emailMetrics.staleSendingCount || 0),
      emailFailureRate: emailMetrics.failureRate,
      staleProcessingJobs: Number(health.metrics?.staleProcessingJobs || 0),
      failedWebhooks24h: Number(health.metrics?.failedWebhooks24h || 0)
    },
    health,
    postPaymentMonitoring,
    emailDeliverability
  };
}

async function insertAlertLog({
  alertKey,
  level,
  status,
  subject,
  summary,
  details,
  sentTo,
  errorMessage = null
}) {
  const result = await db.query(
    `
    INSERT INTO admin_alerts (
      alert_key,
      level,
      status,
      subject,
      summary,
      details,
      sent_to,
      error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
    RETURNING *
    `,
    [
      alertKey,
      level,
      status,
      subject,
      summary,
      JSON.stringify(details || {}),
      sentTo || null,
      errorMessage
    ]
  );

  return result.rows[0];
}

export async function getRecentAdminAlerts({ limit = 10 } = {}) {
  const safeLimit = normalizeNumber(limit, 10, 1, 100);

  const result = await db.query(
    `
    SELECT
      id,
      alert_key,
      level,
      status,
      subject,
      summary,
      details,
      sent_to,
      error_message,
      created_at
    FROM admin_alerts
    ORDER BY created_at DESC
    LIMIT $1::int
    `,
    [safeLimit]
  );

  return result.rows;
}

export async function runProductionHealthAlertCheck(options = {}) {
  const cooldownMinutes = normalizeNumber(
    options.cooldownMinutes ?? env.ADMIN_ALERT_COOLDOWN_MINUTES,
    30,
    1,
    1440
  );

  const force = Boolean(options.force);
  const health = await getHealthMetrics();
  const reasons = health.reasons || [];
  const alertKey = buildAlertKey(health.level, reasons);
  const shouldSend = force || health.level === "critical";
  const recipient = env.ADMIN_ALERT_EMAIL;
  const emailContent = buildEmailContent({
    level: health.level,
    metrics: health.metrics,
    reasons,
    generatedAt: health.generatedAt
  });

  if (!recipient) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "missing_admin_alert_email",
      alertKey,
      level: health.level,
      health
    };
  }

  if (!shouldSend) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "health_not_critical",
      alertKey,
      level: health.level,
      health
    };
  }

  if (!force) {
    const recent = await db.query(
      `
      SELECT created_at
      FROM admin_alerts
      WHERE alert_key = $1
        AND status = 'sent'
        AND created_at > NOW() - ($2::int * INTERVAL '1 minute')
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [alertKey, cooldownMinutes]
    );

    if (recent.rows.length > 0) {
      return {
        ok: true,
        sent: false,
        skipped: true,
        reason: "cooldown",
        alertKey,
        level: health.level,
        cooldownMinutes,
        lastSentAt: recent.rows[0].created_at,
        health
      };
    }
  }

  try {
    const emailResponse = await sendAdminAlertEmail({
      to: recipient,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    const alert = await insertAlertLog({
      alertKey,
      level: health.level,
      status: "sent",
      subject: emailContent.subject,
      summary: emailContent.summary,
      details: {
        health,
        emailResponse
      },
      sentTo: recipient
    });

    return {
      ok: true,
      sent: true,
      skipped: false,
      alert,
      alertKey,
      level: health.level,
      health
    };
  } catch (error) {
    const alert = await insertAlertLog({
      alertKey,
      level: health.level,
      status: "failed",
      subject: emailContent.subject,
      summary: emailContent.summary,
      details: { health },
      sentTo: recipient,
      errorMessage: error.message || "Failed to send admin alert"
    });

    return {
      ok: false,
      sent: false,
      skipped: false,
      alert,
      alertKey,
      level: health.level,
      error: error.message || "Failed to send admin alert",
      health
    };
  }
}

export async function runBankQualityAlertCheck(options = {}) {
  const cooldownMinutes = normalizeNumber(
    options.cooldownMinutes ?? env.ADMIN_ALERT_COOLDOWN_MINUTES,
    30,
    1,
    1440
  );

  const threshold = normalizeAlertThreshold(options.minLevel || options.threshold, "warning");
  const force = Boolean(options.force);
  const audit = await buildBankQualityAudit({
    strict: Boolean(options.strict),
    includePublic: options.includePublic !== false
  });

  const level = resolveBankQualityLevel(audit.summary);
  const alertKey = buildBankQualityAlertKey(level, audit.summary);
  const shouldSend =
    force || severityRank(level) >= severityRank(threshold);

  const recipient = env.ADMIN_ALERT_EMAIL;
  const emailContent = buildBankQualityEmailContent({
    level,
    audit,
    threshold
  });

  if (!recipient) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "missing_admin_alert_email",
      alertKey,
      level,
      threshold,
      audit
    };
  }

  if (!shouldSend) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "below_threshold",
      alertKey,
      level,
      threshold,
      audit
    };
  }

  if (!force) {
    const recent = await db.query(
      `
      SELECT created_at
      FROM admin_alerts
      WHERE alert_key = $1
        AND status = 'sent'
        AND created_at > NOW() - ($2::int * INTERVAL '1 minute')
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [alertKey, cooldownMinutes]
    );

    if (recent.rows.length > 0) {
      return {
        ok: true,
        sent: false,
        skipped: true,
        reason: "cooldown",
        alertKey,
        level,
        threshold,
        cooldownMinutes,
        lastSentAt: recent.rows[0].created_at,
        audit
      };
    }
  }

  try {
    const emailResponse = await sendAdminAlertEmail({
      to: recipient,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    const alert = await insertAlertLog({
      alertKey,
      level,
      status: "sent",
      subject: emailContent.subject,
      summary: emailContent.summary,
      details: {
        threshold,
        audit,
        emailResponse
      },
      sentTo: recipient
    });

    return {
      ok: true,
      sent: true,
      skipped: false,
      alert,
      alertKey,
      level,
      threshold,
      audit
    };
  } catch (error) {
    const alert = await insertAlertLog({
      alertKey,
      level,
      status: "failed",
      subject: emailContent.subject,
      summary: emailContent.summary,
      details: {
        threshold,
        audit
      },
      sentTo: recipient,
      errorMessage: error.message || "Failed to send bank quality alert"
    });

    return {
      ok: false,
      sent: false,
      skipped: false,
      alert,
      alertKey,
      level,
      threshold,
      error: error.message || "Failed to send bank quality alert",
      audit
    };
  }
}

export async function runOperationalAlertCheck(options = {}) {
  const cooldownMinutes = normalizeNumber(
    options.cooldownMinutes ?? env.ADMIN_ALERT_COOLDOWN_MINUTES,
    30,
    1,
    1440
  );

  const threshold = normalizeAlertThreshold(
    options.minLevel || options.threshold || env.ADMIN_OPERATIONAL_ALERT_MIN_LEVEL,
    "warning"
  );

  const force = Boolean(options.force);
  const snapshot = await buildOperationalAlertSnapshot(options);
  const alertKey = buildOperationalAlertKey(snapshot.level, snapshot.issues || []);
  const shouldSend =
    force || severityRank(snapshot.level) >= severityRank(threshold);

  const recipient = env.ADMIN_ALERT_EMAIL;
  const emailContent = buildOperationalEmailContent({
    snapshot,
    threshold
  });

  if (!recipient) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "missing_admin_alert_email",
      alertKey,
      level: snapshot.level,
      threshold,
      snapshot
    };
  }

  if (!shouldSend) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "below_threshold",
      alertKey,
      level: snapshot.level,
      threshold,
      snapshot
    };
  }

  if (!force) {
    const recent = await db.query(
      `
      SELECT created_at
      FROM admin_alerts
      WHERE alert_key = $1
        AND status = 'sent'
        AND created_at > NOW() - ($2::int * INTERVAL '1 minute')
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [alertKey, cooldownMinutes]
    );

    if (recent.rows.length > 0) {
      return {
        ok: true,
        sent: false,
        skipped: true,
        reason: "cooldown",
        alertKey,
        level: snapshot.level,
        threshold,
        cooldownMinutes,
        lastSentAt: recent.rows[0].created_at,
        snapshot
      };
    }
  }

  try {
    const emailResponse = await sendAdminAlertEmail({
      to: recipient,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    const alert = await insertAlertLog({
      alertKey,
      level: snapshot.level,
      status: "sent",
      subject: emailContent.subject,
      summary: emailContent.summary,
      details: {
        threshold,
        snapshot,
        emailResponse
      },
      sentTo: recipient
    });

    return {
      ok: true,
      sent: true,
      skipped: false,
      alert,
      alertKey,
      level: snapshot.level,
      threshold,
      snapshot
    };
  } catch (error) {
    const alert = await insertAlertLog({
      alertKey,
      level: snapshot.level,
      status: "failed",
      subject: emailContent.subject,
      summary: emailContent.summary,
      details: {
        threshold,
        snapshot
      },
      sentTo: recipient,
      errorMessage: error.message || "Failed to send operational alert"
    });

    return {
      ok: false,
      sent: false,
      skipped: false,
      alert,
      alertKey,
      level: snapshot.level,
      threshold,
      error: error.message || "Failed to send operational alert",
      snapshot
    };
  }
}

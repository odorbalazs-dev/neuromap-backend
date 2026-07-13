import { db } from "../db/db.js";
import { listProductPackages } from "../config/products.js";

const WINDOW_SQL = {
  last24h: "24 hours",
  last7d: "7 days",
  last30d: "30 days"
};

function number(value) {
  return Number(value || 0);
}

function round(value, digits = 2) {
  const numeric = Number(value || 0);
  const factor = 10 ** digits;
  return Math.round(numeric * factor) / factor;
}

function rate(numerator, denominator) {
  const top = number(numerator);
  const bottom = number(denominator);
  if (!bottom) return 0;
  return round(top / bottom, 4);
}

function withRates(row) {
  const revenueUsd = round(number(row.revenue_minor_usd) / 100, 2);
  const metrics = {
    sessions: number(row.sessions),
    checkoutStarted: number(row.checkout_started),
    checkoutCancelled: number(row.checkout_cancelled),
    paid: number(row.paid),
    analysisDone: number(row.analysis_done),
    analysisFailed: number(row.analysis_failed),
    reportEmailSent: number(row.report_email_sent),
    reportEmailFailed: number(row.report_email_failed),
    reportEmailUnsent: number(row.report_email_unsent),
    revenueUsd,
    estimatedRevenueUsd: revenueUsd
  };
  const checkoutDropoffCount = Math.max(0, metrics.checkoutStarted - metrics.paid);

  return {
    ...metrics,
    checkoutDropoffCount,
    sessionToCheckoutRate: rate(metrics.checkoutStarted, metrics.sessions),
    sessionToPaidRate: rate(metrics.paid, metrics.sessions),
    checkoutToPaidRate: rate(metrics.paid, metrics.checkoutStarted),
    checkoutDropoffRate: rate(checkoutDropoffCount, metrics.checkoutStarted),
    paidToAnalysisDoneRate: rate(metrics.analysisDone, metrics.paid),
    analysisDoneToEmailSentRate: rate(metrics.reportEmailSent, metrics.analysisDone),
    checkoutCancelRate: rate(metrics.checkoutCancelled, metrics.checkoutStarted)
  };
}

function buildFunnel(metrics = {}) {
  const sessions = number(metrics.sessions);
  const checkoutStarted = number(metrics.checkoutStarted);
  const paid = number(metrics.paid);
  const reportEmailSent = number(metrics.reportEmailSent);

  return {
    window: "last7d",
    steps: [
      { key: "sessions", label: "Session", count: sessions },
      { key: "checkout_started", label: "Checkout start", count: checkoutStarted },
      { key: "paid", label: "Paid", count: paid },
      { key: "email_sent", label: "Email sent", count: reportEmailSent }
    ],
    rates: {
      sessionToCheckout: rate(checkoutStarted, sessions),
      checkoutToPaid: rate(paid, checkoutStarted),
      paidToEmail: rate(reportEmailSent, paid)
    },
    dropoffs: {
      landingToCheckout: Math.max(0, sessions - checkoutStarted),
      checkoutToPaid: Math.max(0, checkoutStarted - paid),
      paidToEmail: Math.max(0, paid - reportEmailSent)
    }
  };
}

function buildWindowQuery(intervalText) {
  return `
    WITH metric_window AS (
      SELECT NOW() - INTERVAL '${intervalText}' AS starts_at
    )
    SELECT
      COUNT(*) FILTER (WHERE s.created_at >= metric_window.starts_at)::int AS sessions,
      COUNT(*) FILTER (WHERE s.checkout_started_at >= metric_window.starts_at)::int AS checkout_started,
      COUNT(*) FILTER (WHERE s.checkout_cancelled_at >= metric_window.starts_at)::int AS checkout_cancelled,
      COUNT(*) FILTER (
        WHERE s.payment_status = 'paid'
          AND COALESCE(s.paid_at, s.updated_at, s.created_at) >= metric_window.starts_at
      )::int AS paid,
      COALESCE(SUM(
        CASE
          WHEN s.payment_status = 'paid'
            AND COALESCE(s.paid_at, s.updated_at, s.created_at) >= metric_window.starts_at
            AND LOWER(COALESCE(NULLIF(s.currency, ''), 'usd')) = 'usd'
          THEN COALESCE(s.amount_total, 500)
          ELSE 0
        END
      ), 0)::bigint AS revenue_minor_usd,
      COUNT(*) FILTER (
        WHERE s.analysis_status = 'done'
          AND COALESCE(s.analysis_completed_at, s.updated_at, s.created_at) >= metric_window.starts_at
      )::int AS analysis_done,
      COUNT(*) FILTER (
        WHERE s.analysis_status = 'failed'
          AND COALESCE(s.updated_at, s.created_at) >= metric_window.starts_at
      )::int AS analysis_failed,
      COUNT(*) FILTER (
        WHERE s.report_email_status = 'sent'
          AND COALESCE(s.report_email_sent_at, s.report_email_last_attempt_at, s.updated_at, s.created_at) >= metric_window.starts_at
      )::int AS report_email_sent,
      COUNT(*) FILTER (
        WHERE s.report_email_status = 'failed'
          AND COALESCE(s.report_email_last_attempt_at, s.updated_at, s.created_at) >= metric_window.starts_at
      )::int AS report_email_failed,
      COUNT(*) FILTER (
        WHERE s.analysis_status = 'done'
          AND s.report_email_status <> 'sent'
          AND COALESCE(s.analysis_completed_at, s.updated_at, s.created_at) >= metric_window.starts_at
      )::int AS report_email_unsent
    FROM sessions s, metric_window;
  `;
}

async function getWindowMetrics() {
  const entries = await Promise.all(
    Object.entries(WINDOW_SQL).map(async ([key, intervalText]) => {
      const result = await db.query(buildWindowQuery(intervalText));
      return [key, withRates(result.rows[0] || {})];
    })
  );

  return Object.fromEntries(entries);
}

async function getTrendMetrics() {
  const result = await db.query(`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', NOW()) - INTERVAL '13 days',
        date_trunc('day', NOW()),
        INTERVAL '1 day'
      ) AS day_start
    )
    SELECT
      TO_CHAR(days.day_start, 'YYYY-MM-DD') AS day,
      COUNT(s.id)::int AS sessions,
      COUNT(s.id) FILTER (WHERE s.checkout_started_at IS NOT NULL)::int AS checkout_started,
      COUNT(s.id) FILTER (WHERE s.payment_status = 'paid')::int AS paid,
      COALESCE(SUM(
        CASE
          WHEN s.payment_status = 'paid'
            AND LOWER(COALESCE(NULLIF(s.currency, ''), 'usd')) = 'usd'
          THEN COALESCE(s.amount_total, 500)
          ELSE 0
        END
      ), 0)::bigint AS revenue_minor_usd,
      COUNT(s.id) FILTER (WHERE s.analysis_status = 'done')::int AS analysis_done,
      COUNT(s.id) FILTER (WHERE s.report_email_status = 'sent')::int AS report_email_sent
    FROM days
    LEFT JOIN sessions s
      ON s.created_at >= days.day_start
      AND s.created_at < days.day_start + INTERVAL '1 day'
    GROUP BY days.day_start
    ORDER BY days.day_start ASC;
  `);

  return result.rows.map((row) => ({
    day: row.day,
    sessions: number(row.sessions),
    checkoutStarted: number(row.checkout_started),
    paid: number(row.paid),
    revenueUsd: round(number(row.revenue_minor_usd) / 100, 2),
    analysisDone: number(row.analysis_done),
    reportEmailSent: number(row.report_email_sent)
  }));
}

async function getPackageMetrics() {
  const result = await db.query(`
    SELECT
      COALESCE(NULLIF(s.package_code, ''), 'legacy_500_v1') AS package_code,
      COUNT(*) FILTER (WHERE s.checkout_started_at IS NOT NULL)::int AS checkout_started,
      COUNT(*) FILTER (WHERE s.payment_status = 'paid')::int AS paid,
      COALESCE(SUM(
        CASE
          WHEN s.payment_status = 'paid'
            AND LOWER(COALESCE(NULLIF(s.currency, ''), 'usd')) = 'usd'
          THEN COALESCE(s.amount_total, 500)
          ELSE 0
        END
      ), 0)::bigint AS revenue_minor_usd
    FROM sessions s
    WHERE s.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY COALESCE(NULLIF(s.package_code, ''), 'legacy_500_v1')
    ORDER BY paid DESC, package_code ASC;
  `);

  return result.rows.map((row) => ({
    packageCode: row.package_code,
    checkoutStarted: number(row.checkout_started),
    paid: number(row.paid),
    revenueUsd: round(number(row.revenue_minor_usd) / 100, 2)
  }));
}

async function getQueueMetrics() {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'queued')::int AS queued,
      COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
      COUNT(*) FILTER (WHERE status = 'done')::int AS done,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (
        WHERE status = 'processing'
          AND locked_at < NOW() - INTERVAL '15 minutes'
      )::int AS stale_processing,
      COUNT(*) FILTER (
        WHERE status = 'queued'
          AND created_at < NOW() - INTERVAL '30 minutes'
      )::int AS old_queued
    FROM analysis_jobs;
  `);

  const row = result.rows[0] || {};

  return {
    queued: number(row.queued),
    processing: number(row.processing),
    done: number(row.done),
    failed: number(row.failed),
    staleProcessing: number(row.stale_processing),
    oldQueued: number(row.old_queued)
  };
}

async function getWebhookMetrics() {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS events24h,
      COUNT(*) FILTER (
        WHERE status = 'failed'
          AND created_at >= NOW() - INTERVAL '24 hours'
      )::int AS failed24h,
      COUNT(*) FILTER (
        WHERE event_type = 'checkout.session.completed'
          AND created_at >= NOW() - INTERVAL '24 hours'
      )::int AS checkoutCompleted24h
    FROM webhook_events;
  `);

  const row = result.rows[0] || {};

  return {
    events24h: number(row.events24h),
    failed24h: number(row.failed24h),
    checkoutCompleted24h: number(row.checkoutcompleted24h)
  };
}

async function getAlertMetrics() {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS alerts24h,
      COUNT(*) FILTER (
        WHERE level = 'critical'
          AND created_at >= NOW() - INTERVAL '24 hours'
      )::int AS critical24h,
      COUNT(*) FILTER (
        WHERE level IN ('warning', 'critical')
          AND created_at >= NOW() - INTERVAL '7 days'
      )::int AS warningOrCritical7d
    FROM admin_alerts;
  `);

  const row = result.rows[0] || {};

  return {
    alerts24h: number(row.alerts24h),
    critical24h: number(row.critical24h),
    warningOrCritical7d: number(row.warningorcritical7d)
  };
}

async function getEngineMetrics() {
  const domainResult = await db.query(`
    SELECT
      COALESCE(
        NULLIF(payload->>'detectedRisk', ''),
        NULLIF(payload->'payload'->>'detectedRisk', ''),
        'unknown'
      ) AS domain,
      COUNT(*)::int AS count
    FROM sessions
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND (
        payload ? 'detectedRisk'
        OR payload ? 'payload'
      )
    GROUP BY domain
    ORDER BY count DESC, domain ASC
    LIMIT 10;
  `);

  const qualityResult = await db.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE payload->'triageRanking' IS NOT NULL
          OR payload->'payload'->'triageRanking' IS NOT NULL
      )::int AS sessions_with_engine_input,
      COUNT(*) FILTER (
        WHERE COALESCE(payload->>'needsExtra', payload->'payload'->>'needsExtra') = 'true'
      )::int AS extra_question_sessions,
      COUNT(*) FILTER (
        WHERE COALESCE(payload->>'secondaryRisk', payload->'payload'->>'secondaryRisk') IS NOT NULL
      )::int AS secondary_signal_sessions
    FROM sessions
    WHERE created_at >= NOW() - INTERVAL '30 days';
  `);

  const quality = qualityResult.rows[0] || {};
  const sessionsWithEngineInput = number(quality.sessions_with_engine_input);

  return {
    domainDistribution: domainResult.rows.map((row) => ({
      key: row.domain || "unknown",
      count: number(row.count)
    })),
    sessionsWithEngineInput,
    extraQuestionSessions: number(quality.extra_question_sessions),
    secondarySignalSessions: number(quality.secondary_signal_sessions),
    extraQuestionRate: rate(quality.extra_question_sessions, sessionsWithEngineInput),
    secondarySignalRate: rate(quality.secondary_signal_sessions, sessionsWithEngineInput)
  };
}

function buildRecommendations({ windows, queue, webhook, alerts, engine }) {
  const recommendations = [];
  const last24h = windows.last24h || {};
  const last7d = windows.last7d || {};

  if (queue.staleProcessing > 0) {
    recommendations.push({
      level: "critical",
      title: "Beragadt feldolgozas",
      detail: `${queue.staleProcessing} processing job 15 percnel regebbi lock alatt van.`
    });
  }

  if (last7d.reportEmailUnsent > 0 || last7d.reportEmailFailed > 0) {
    recommendations.push({
      level: "warning",
      title: "Email kezbesitesi teendo",
      detail: `${last7d.reportEmailUnsent} kesz riport nincs elkuldve, ${last7d.reportEmailFailed} email hibas az utolso 7 napban.`
    });
  }

  if (webhook.failed24h > 0) {
    recommendations.push({
      level: "critical",
      title: "Webhook hiba 24 oran belul",
      detail: `${webhook.failed24h} failed webhook esemeny erkezett az utolso 24 oraban.`
    });
  }

  if (last24h.checkoutStarted > 0 && last24h.checkoutToPaidRate < 0.35) {
    recommendations.push({
      level: "info",
      title: "Checkout konverzio figyelendo",
      detail: `Az utolso 24 ora checkout -> paid aranya ${Math.round(last24h.checkoutToPaidRate * 100)}%.`
    });
  }

  if (last7d.sessions >= 5 && last7d.sessionToCheckoutRate < 0.25) {
    recommendations.push({
      level: "info",
      title: "Landing -> checkout dropoff magas",
      detail: `Az utolso 7 nap session -> checkout start aranya ${Math.round(last7d.sessionToCheckoutRate * 100)}%.`
    });
  }

  if (last7d.checkoutStarted >= 3 && last7d.checkoutDropoffRate > 0.5) {
    recommendations.push({
      level: "warning",
      title: "Checkout utan sok lemorzsolodas",
      detail: `${last7d.checkoutDropoffCount} checkout inditas nem jutott el fizetesig az utolso 7 napban.`
    });
  }

  if (engine.sessionsWithEngineInput > 0 && engine.extraQuestionRate > 0.35) {
    recommendations.push({
      level: "info",
      title: "Engine extra kerdes arany magas",
      detail: `Az utolso 30 nap extra kerdes aranya ${Math.round(engine.extraQuestionRate * 100)}%. Erdemes megnezni az atfedo donteseket.`
    });
  }

  if (alerts.critical24h > 0) {
    recommendations.push({
      level: "critical",
      title: "Friss kritikus riasztas",
      detail: `${alerts.critical24h} kritikus admin riasztas keletkezett 24 oran belul.`
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      level: "ok",
      title: "Nincs azonnali metrika-riasztas",
      detail: "A fo vevoi ut es mukodesi metrikak jelenleg nem jeleznek gyors beavatkozast."
    });
  }

  return recommendations.slice(0, 6);
}

function buildLevel({ windows, queue, webhook }) {
  if (queue.staleProcessing > 0 || webhook.failed24h > 0) return "critical";
  if (windows.last7d.reportEmailFailed > 0 || windows.last7d.reportEmailUnsent > 0) return "warning";
  if (windows.last7d.checkoutStarted >= 3 && windows.last7d.checkoutDropoffRate > 0.65) return "warning";
  if (windows.last7d.checkoutStarted > 0 && windows.last7d.checkoutToPaidRate < 0.35) return "watch";
  return "healthy";
}

export async function buildDashboardMetrics() {
  const [
    windows,
    trend,
    queue,
    webhook,
    alerts,
    engine,
    packages
  ] = await Promise.all([
    getWindowMetrics(),
    getTrendMetrics(),
    getQueueMetrics(),
    getWebhookMetrics(),
    getAlertMetrics(),
    getEngineMetrics(),
    getPackageMetrics()
  ]);

  const funnel = buildFunnel(windows.last7d || {});

  const summary = {
    level: buildLevel({ windows, queue, webhook }),
    generatedAt: new Date().toISOString(),
    packagePricesUsd: Object.fromEntries(
      listProductPackages().map((productPackage) => [
        productPackage.code,
        round(productPackage.unitAmount / 100, 2)
      ])
    )
  };

  return {
    ok: true,
    summary,
    windows,
    trend,
    operations: {
      queue,
      webhook,
      alerts
    },
    engine,
    packages,
    funnel,
    recommendations: buildRecommendations({
      windows,
      queue,
      webhook,
      alerts,
      engine
    })
  };
}

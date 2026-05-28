import { buildReportV2Context } from "./report-v2.service.js";
import { analyzeAdaptiveState } from "./adaptive-engine.service.js";

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pickFirst(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "") ?? null;
}

function getSignalLabel(resultSummary, lang) {
  const signal = resultSummary?.signal;

  if (!signal || typeof signal !== "object") {
    return null;
  }

  return pickFirst(signal[lang], signal.en, signal.hu, signal.key);
}

function getTopSubdomains(resultSummary, specificScoring, limit = 3) {
  if (Array.isArray(resultSummary?.topSubdomains)) {
    return resultSummary.topSubdomains.slice(0, limit).map((item) => ({
      key: item.key,
      average: numberOrNull(item.average),
      itemCount: numberOrNull(item.itemCount)
    }));
  }

  const subdomains = specificScoring?.subdomains || {};

  return Object.entries(subdomains)
    .map(([key, value]) => ({
      key,
      average: numberOrNull(value?.average),
      itemCount: numberOrNull(value?.itemCount)
    }))
    .sort((a, b) => Number(b.average || 0) - Number(a.average || 0))
    .slice(0, limit);
}

function buildEmailRetrySummary(sessionRow) {
  const status = sessionRow.report_email_status || "not_sent";
  const attempts = Number(sessionRow.report_email_attempts || 0);
  const hasReport = Boolean(sessionRow.analysis_result);
  const retryableStatus = ["failed", "not_sent", "sending"].includes(status);
  const retryLimitReached = retryableStatus && attempts >= 3;
  const retryAvailable = hasReport && status !== "sent";

  return {
    status,
    attempts,
    providerId: sessionRow.report_email_provider_id || null,
    sentAt: sessionRow.report_email_sent_at || null,
    lastAttemptAt: sessionRow.report_email_last_attempt_at || null,
    error: sessionRow.report_email_error || null,
    retryAvailable,
    retryRecommended: retryAvailable && retryableStatus && !retryLimitReached,
    retryLimitReached,
    nextAction: status === "sent"
      ? "no_action"
      : retryLimitReached
        ? "inspect_then_reset_retry"
        : retryAvailable
          ? "resend_report_email"
          : "wait_for_report"
  };
}

function buildAnalysisRetrySummary(sessionRow, jobRow) {
  const status = sessionRow.analysis_status || "unknown";
  const paymentStatus = sessionRow.payment_status || "unknown";
  const hasPayload = Boolean(sessionRow.payload);
  const retryAvailable = paymentStatus === "paid" && hasPayload;
  const retryRecommended = retryAvailable && status === "failed";

  let reason = "ready";
  if (paymentStatus !== "paid") reason = "payment_not_paid";
  else if (!hasPayload) reason = "missing_payload";
  else if (status === "done") reason = "analysis_done";
  else if (status === "queued" || status === "processing") reason = "analysis_already_running";
  else if (status === "failed") reason = "analysis_failed";

  return {
    status,
    retryAvailable,
    retryRecommended,
    reason,
    job: jobRow
      ? {
          id: jobRow.id || null,
          status: jobRow.status || null,
          attempts: Number(jobRow.attempts || 0),
          lastError: jobRow.last_error || null,
          lockedAt: jobRow.locked_at || null,
          availableAt: jobRow.available_at || null,
          createdAt: jobRow.created_at || null,
          updatedAt: jobRow.updated_at || null
        }
      : null
  };
}

function buildEngineIntelligenceSummary(payload = {}) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  try {
    const adaptive = analyzeAdaptiveState({
      triageScores: payload.triageScores || {},
      triageRanking: payload.triageRanking || [],
      specificProfile: payload.specificProfile || null,
      specificScoring: payload.specificScoring || null
    });

    return {
      primaryDomain: adaptive.primaryDomain,
      secondaryDomain: adaptive.secondaryDomain,
      severity: adaptive.severity,
      confidence: numberOrNull(adaptive.confidence),
      confidenceLabel: adaptive.confidenceLabel,
      scoreGap: numberOrNull(adaptive.scoreGap),
      overlapScore: numberOrNull(adaptive.overlapScore),
      shouldAskExtra: Boolean(adaptive.shouldAskExtra),
      patternType: adaptive.patternType,
      decisionQuality: adaptive.decisionQuality,
      interpretation: adaptive.interpretation,
      scoreSource: adaptive.evidence?.scoreSource || null,
      specificCoherence: adaptive.evidence?.specificCoherence || null,
      recommendedFocusAreas: Array.isArray(adaptive.recommendedFocusAreas)
        ? adaptive.recommendedFocusAreas.slice(0, 8)
        : [],
      extraQuestionPlan: adaptive.extraQuestionPlan || null,
      rankedDomains: Array.isArray(adaptive.rankedDomains)
        ? adaptive.rankedDomains.slice(0, 5).map((item) => ({
            domain: item.domain,
            score: numberOrNull(item.score),
            raw: numberOrNull(item.raw),
            average: numberOrNull(item.average)
          }))
        : []
    };
  } catch (error) {
    return {
      error: error.message || "Engine intelligence summary failed"
    };
  }
}

export function buildAdminSessionReportSummary(sessionRow = {}, jobRow = null) {
  const payload = sessionRow.payload || {};
  const lang = sessionRow.lang || payload.lang || "en";
  const reportV2 = buildReportV2Context(payload, lang);
  const specificProfile = payload.specificProfile || {};
  const specificScoring = payload.specificScoring || {};
  const resultSummary = payload.resultSummary || {};

  return {
    reportVersion: reportV2.version,
    childAge: reportV2.ageYears,
    ageBand: reportV2.ageBand,
    ageBandLabel: reportV2.ageBandLabel,
    hasAge: reportV2.hasAge,
    detectedRisk: pickFirst(payload.detectedRisk, sessionRow.detectedRisk),
    secondaryRisk: pickFirst(payload.secondaryRisk, sessionRow.secondaryRisk),
    severity: pickFirst(specificProfile.severity, resultSummary?.signal?.key),
    signalLabel: getSignalLabel(resultSummary, lang),
    normalizedAverage: numberOrNull(
      pickFirst(
        specificProfile.normalizedAverage,
        specificScoring.normalizedAverage,
        resultSummary.normalizedAverage
      )
    ),
    topSubdomains: getTopSubdomains(resultSummary, specificScoring),
    engine: buildEngineIntelligenceSummary(payload),
    questionnaireVersion: payload.questionnaireVersion || null,
    email: buildEmailRetrySummary(sessionRow),
    analysisRetry: buildAnalysisRetrySummary(sessionRow, jobRow)
  };
}

import { analyzeAdaptiveState } from "./adaptive-engine.service.js";

const DOMAINS = ["ADHD", "ASD", "ANXIETY", "DEPRESSION", "LEARNING"];

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : null;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || "unknown";
    counts[key] = Number(counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortedCounts(counts = {}) {
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      count: Number(count || 0)
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function hasEngineLiveAuditInput(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (Array.isArray(payload.triageRanking) && payload.triageRanking.length > 0) {
    return true;
  }

  const triageScores = payload.triageScores || {};
  return DOMAINS.some((domain) => Number.isFinite(Number(triageScores[domain])));
}

function getStoredDecision(row = {}) {
  const payload = row.payload || {};
  const extraQuestions = Array.isArray(payload.extraQuestions)
    ? payload.extraQuestions
    : [];
  const extraAnswers = Array.isArray(payload.extraAnswers)
    ? payload.extraAnswers
    : [];

  return {
    primaryDomain: payload.detectedRisk || null,
    secondaryDomain: payload.secondaryRisk || null,
    extraQuestionCount: extraQuestions.length,
    extraAnswerCount: extraAnswers.length,
    askedExtra: extraQuestions.length > 0 || extraAnswers.length > 0,
    specificQuestionCount: Array.isArray(payload.specificQuestions)
      ? payload.specificQuestions.length
      : 0,
    specificAnswerCount: Array.isArray(payload.specificAnswers)
      ? payload.specificAnswers.length
      : 0,
    questionnaireVersion: payload.questionnaireVersion || null
  };
}

function buildIssue(code, level, label, detail) {
  return {
    code,
    level,
    label,
    detail
  };
}

function getNonAuditableIssue(payload) {
  if (!payload || typeof payload !== "object") {
    return buildIssue(
      "missing_payload",
      "skipped",
      "Nincs payload",
      "A session nem tartalmaz payloadot, ezert Engine v2 dontesi audit nem futtathato rajta."
    );
  }

  if (
    payload.detectedRisk ||
    payload.secondaryRisk ||
    payload.specificProfile ||
    payload.resultSummary
  ) {
    return buildIssue(
      "legacy_engine_payload",
      "skipped",
      "Legacy engine payload",
      "Ez a session meg az Engine v2 audit inputok elott keszult, ezert nem szamolhato ujra megbizhatoan."
    );
  }

  return buildIssue(
    "missing_engine_input",
    "skipped",
    "Nincs auditalhato engine input",
    "Nem talalhato triageRanking vagy triageScores a payloadban."
  );
}

function isActionableIssueLevel(level) {
  return level === "critical" || level === "warning";
}

function isActionableReviewSession(session) {
  return Boolean(session?.auditable) && isActionableIssueLevel(session.issueLevel);
}

function auditIssues({ stored, engine, payload }) {
  const issues = [];

  if (!stored.primaryDomain) {
    issues.push(buildIssue(
      "missing_stored_primary",
      "critical",
      "Hiányzó mentett fő döntés",
      "A payload nem tartalmaz detectedRisk értéket."
    ));
  } else if (engine.primaryDomain && stored.primaryDomain !== engine.primaryDomain) {
    issues.push(buildIssue(
      "primary_mismatch",
      "critical",
      "Eltérő fő döntés",
      `Mentett: ${stored.primaryDomain}, újraszámolt Engine v2: ${engine.primaryDomain}.`
    ));
  }

  if (
    stored.secondaryDomain &&
    engine.secondaryDomain &&
    stored.secondaryDomain !== engine.secondaryDomain
  ) {
    issues.push(buildIssue(
      "secondary_mismatch",
      "warning",
      "Eltérő másodlagos jelzés",
      `Mentett: ${stored.secondaryDomain}, újraszámolt: ${engine.secondaryDomain}.`
    ));
  }

  if (stored.askedExtra !== Boolean(engine.shouldAskExtra)) {
    issues.push(buildIssue(
      "extra_decision_mismatch",
      "warning",
      "Extra kérdés döntés eltérés",
      `Mentett extra: ${stored.askedExtra ? "igen" : "nem"}, Engine v2 szerint: ${engine.shouldAskExtra ? "igen" : "nem"}.`
    ));
  }

  if (engine.decisionQuality === "low" || engine.confidenceLabel === "low") {
    issues.push(buildIssue(
      "low_confidence",
      "warning",
      "Alacsony döntési magabiztosság",
      `Confidence: ${round(engine.confidence)}, quality: ${engine.decisionQuality}.`
    ));
  }

  if (Number(engine.overlapScore || 0) >= 0.7) {
    issues.push(buildIssue(
      "high_overlap",
      "info",
      "Erős átfedő mintázat",
      `Primary és secondary overlap: ${round(engine.overlapScore)}.`
    ));
  }

  if (!payload.specificScoring || typeof payload.specificScoring !== "object") {
    issues.push(buildIssue(
      "missing_specific_scoring",
      "warning",
      "Hiányzó specifikus scoring",
      "A döntési audit kevesebb bizonyítékból számol, mert nincs specificScoring objektum."
    ));
  }

  if (!Array.isArray(payload.triageRanking) || payload.triageRanking.length === 0) {
    issues.push(buildIssue(
      "missing_triage_ranking",
      "info",
      "Hiányzó triageRanking",
      "Az audit a triageScores alapján számol, nem a frontend weightedSignal rangsorából."
    ));
  }

  if (stored.specificQuestionCount !== stored.specificAnswerCount) {
    issues.push(buildIssue(
      "specific_answer_count_mismatch",
      "warning",
      "Specifikus válasz darabszám eltérés",
      `${stored.specificAnswerCount}/${stored.specificQuestionCount} specifikus válasz látszik.`
    ));
  }

  if (stored.extraQuestionCount !== stored.extraAnswerCount) {
    issues.push(buildIssue(
      "extra_answer_count_mismatch",
      "warning",
      "Extra válasz darabszám eltérés",
      `${stored.extraAnswerCount}/${stored.extraQuestionCount} extra válasz látszik.`
    ));
  }

  return issues;
}

function getIssueLevel(issues = []) {
  if (issues.some((issue) => issue.level === "critical")) return "critical";
  if (issues.some((issue) => issue.level === "warning")) return "warning";
  if (issues.some((issue) => issue.level === "info")) return "info";
  return "clean";
}

export function buildEngineLiveAuditSession(row = {}) {
  const payload = row.payload || {};

  if (!hasEngineLiveAuditInput(payload)) {
    const issue = getNonAuditableIssue(payload);

    return {
      id: row.id,
      shortId: row.id ? String(row.id).slice(0, 8) : null,
      auditable: false,
      issueLevel: issue.level,
      lang: row.lang || payload.lang || null,
      paymentStatus: row.payment_status || null,
      analysisStatus: row.analysis_status || null,
      reportEmailStatus: row.report_email_status || null,
      stored: getStoredDecision(row),
      engine: null,
      issues: [
        buildIssue(
          "missing_engine_input",
          "critical",
          "Nincs auditálható engine input",
          "Nem található triageRanking vagy triageScores a payloadban."
        )
      ],
      issueCodes: ["missing_engine_input"],
      issues: [issue],
      issueCodes: [issue.code],
      nonAuditableReason: issue.code,
      createdAt: row.created_at || null,
      paidAt: row.paid_at || null,
      updatedAt: row.updated_at || null
    };
  }

  const stored = getStoredDecision(row);
  const adaptive = analyzeAdaptiveState({
    triageScores: payload.triageScores || {},
    triageRanking: payload.triageRanking || [],
    specificProfile: payload.specificProfile || null,
    specificScoring: payload.specificScoring || null
  });

  const engine = {
    primaryDomain: adaptive.primaryDomain,
    secondaryDomain: adaptive.secondaryDomain,
    primaryScore: round(adaptive.primaryScore),
    secondaryScore: round(adaptive.secondaryScore),
    scoreGap: round(adaptive.scoreGap),
    confidence: round(adaptive.confidence),
    confidenceLabel: adaptive.confidenceLabel || null,
    overlapScore: round(adaptive.overlapScore),
    shouldAskExtra: Boolean(adaptive.shouldAskExtra),
    severity: adaptive.severity || null,
    patternType: adaptive.patternType || null,
    decisionQuality: adaptive.decisionQuality || null,
    scoreSource: adaptive.evidence?.scoreSource || null,
    specificCoherence: adaptive.evidence?.specificCoherence || null,
    recommendedFocusAreas: Array.isArray(adaptive.recommendedFocusAreas)
      ? adaptive.recommendedFocusAreas.slice(0, 8)
      : []
  };

  const issues = auditIssues({
    stored,
    engine,
    payload
  });

  return {
    id: row.id,
    shortId: row.id ? String(row.id).slice(0, 8) : null,
    auditable: true,
    issueLevel: getIssueLevel(issues),
    lang: row.lang || payload.lang || null,
    paymentStatus: row.payment_status || null,
    analysisStatus: row.analysis_status || null,
    reportEmailStatus: row.report_email_status || null,
    stored,
    engine,
    issues,
    issueCodes: issues.map((issue) => issue.code),
    createdAt: row.created_at || null,
    paidAt: row.paid_at || null,
    updatedAt: row.updated_at || null
  };
}

export function buildEngineLiveDecisionAudit(rows = []) {
  const sessions = rows.map(buildEngineLiveAuditSession);
  const auditableSessions = sessions.filter((session) => session.auditable);
  const skippedSessions = sessions.filter((session) => !session.auditable);
  const reviewSessions = sessions
    .filter(isActionableReviewSession)
    .sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2, skipped: 3, clean: 4 };
      const byLevel = priority[a.issueLevel] - priority[b.issueLevel];
      if (byLevel !== 0) return byLevel;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  const issueCounts = countBy(
    sessions.flatMap((session) => session.issues || []),
    (issue) => issue.code
  );

  const primaryMismatchCount = auditableSessions.filter((session) =>
    session.issueCodes.includes("primary_mismatch")
  ).length;
  const extraMismatchCount = auditableSessions.filter((session) =>
    session.issueCodes.includes("extra_decision_mismatch")
  ).length;
  const criticalSessions = auditableSessions.filter((session) =>
    session.issueLevel === "critical"
  ).length;
  const warningSessions = auditableSessions.filter((session) =>
    session.issueLevel === "warning"
  ).length;
  const infoSessions = auditableSessions.filter((session) =>
    session.issueLevel === "info"
  ).length;

  const confidenceValues = auditableSessions
    .map((session) => numberOrNull(session.engine?.confidence))
    .filter((value) => value !== null);
  const overlapValues = auditableSessions
    .map((session) => numberOrNull(session.engine?.overlapScore))
    .filter((value) => value !== null);

  const average = (values) => {
    if (!values.length) return null;
    return round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      loadedSessions: rows.length,
      auditedSessions: auditableSessions.length,
      auditableSessions: auditableSessions.length,
      nonAuditableSessions: skippedSessions.length,
      skippedSessions: skippedSessions.length,
      skippedLegacySessions: skippedSessions.filter((session) =>
        session.issueCodes.includes("legacy_engine_payload")
      ).length,
      cleanSessions: auditableSessions.filter((session) => session.issueLevel === "clean").length,
      reviewSessions: reviewSessions.length,
      criticalSessions,
      warningSessions,
      infoSessions,
      primaryMismatchCount,
      extraMismatchCount,
      averageConfidence: average(confidenceValues),
      averageOverlapScore: average(overlapValues)
    },
    distributions: {
      issueLevels: sortedCounts(countBy(sessions, (session) => session.issueLevel)),
      issueCodes: sortedCounts(issueCounts),
      storedPrimaryDomains: sortedCounts(countBy(auditableSessions, (session) => session.stored?.primaryDomain)),
      enginePrimaryDomains: sortedCounts(countBy(auditableSessions, (session) => session.engine?.primaryDomain)),
      decisionQuality: sortedCounts(countBy(auditableSessions, (session) => session.engine?.decisionQuality))
    },
    reviewQueue: reviewSessions.slice(0, 30),
    sessions
  };
}

(function () {
  const TOKEN_KEY = "nm_admin_token";
  const OPERATIONS_LOG_KEY = "nm_operations_log_open";
  const COLLAPSIBLE_SECTION_KEY_PREFIX = "nm_dashboard_collapsed_";
  const DEFAULT_COLLAPSED_SECTIONS = new Set([
    "engineReview",
    "engineDecisionAudit",
    "sessionLists"
  ]);

  const els = {
    token: document.getElementById("adminToken"),
    saveTokenBtn: document.getElementById("saveTokenBtn"),
    clearTokenBtn: document.getElementById("clearTokenBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    processOneBtn: document.getElementById("processOneBtn"),
    retryEmailBatchBtn: document.getElementById("retryEmailBatchBtn"),
    alertCheckBtn: document.getElementById("alertCheckBtn"),
    operationalAlertBtn: document.getElementById("operationalAlertBtn"),
    bankQualityAlertBtn: document.getElementById("bankQualityAlertBtn"),
    postPaymentRecoveryBtn: document.getElementById("postPaymentRecoveryBtn"),
    postPaymentRecoveryPanelBtn: document.getElementById("postPaymentRecoveryPanelBtn"),
    refreshLaunchReadinessBtn: document.getElementById("refreshLaunchReadinessBtn"),
    statusText: document.getElementById("statusText"),
    controlCenterHeadline: document.getElementById("controlCenterHeadline"),
    controlCenterSummary: document.getElementById("controlCenterSummary"),
    controlScore: document.getElementById("controlScore"),
    controlPulseUpdatedAt: document.getElementById("controlPulseUpdatedAt"),
    pulseCheckout: document.getElementById("pulseCheckout"),
    pulseWorker: document.getElementById("pulseWorker"),
    pulseEmail: document.getElementById("pulseEmail"),
    pulseEngine: document.getElementById("pulseEngine"),
    pulseAlerts: document.getElementById("pulseAlerts"),
    operatorSummary: document.getElementById("operatorSummary"),
    operatorTaskRows: document.getElementById("operatorTaskRows"),
    latestSessionCard: document.getElementById("latestSessionCard"),
    lastSnapshotAt: document.getElementById("lastSnapshotAt"),
    pipelineStages: document.getElementById("pipelineStages"),
    riskFocus: document.getElementById("riskFocus"),
    nextAction: document.getElementById("nextAction"),
    postPaymentLevel: document.getElementById("postPaymentLevel"),
    postPaymentSummary: document.getElementById("postPaymentSummary"),
    postPaymentWindow: document.getElementById("postPaymentWindow"),
    postPaymentPaid: document.getElementById("postPaymentPaid"),
    postPaymentPaidMeta: document.getElementById("postPaymentPaidMeta"),
    postPaymentWebhookIssues: document.getElementById("postPaymentWebhookIssues"),
    postPaymentWebhookMeta: document.getElementById("postPaymentWebhookMeta"),
    postPaymentAnalysisIssues: document.getElementById("postPaymentAnalysisIssues"),
    postPaymentAnalysisMeta: document.getElementById("postPaymentAnalysisMeta"),
    postPaymentEmailIssues: document.getElementById("postPaymentEmailIssues"),
    postPaymentEmailMeta: document.getElementById("postPaymentEmailMeta"),
    postPaymentStageRows: document.getElementById("postPaymentStageRows"),
    postPaymentRecommendationRows: document.getElementById("postPaymentRecommendationRows"),
    postPaymentIssueRows: document.getElementById("postPaymentIssueRows"),
    webflowEmbedGeneratedAt: document.getElementById("webflowEmbedGeneratedAt"),
    webflowEmbedTotal: document.getElementById("webflowEmbedTotal"),
    webflowEmbedReadyMeta: document.getElementById("webflowEmbedReadyMeta"),
    webflowEmbedLoaders: document.getElementById("webflowEmbedLoaders"),
    webflowEmbedLimit: document.getElementById("webflowEmbedLimit"),
    webflowEmbedRows: document.getElementById("webflowEmbedRows"),
    launchReadinessLevel: document.getElementById("launchReadinessLevel"),
    launchReadinessSummary: document.getElementById("launchReadinessSummary"),
    launchReadinessGeneratedAt: document.getElementById("launchReadinessGeneratedAt"),
    launchReadinessChecks: document.getElementById("launchReadinessChecks"),
    launchManualChecks: document.getElementById("launchManualChecks"),
    apiStatus: document.getElementById("apiStatus"),
    healthLevel: document.getElementById("healthLevel"),
    queuedCount: document.getElementById("queuedCount"),
    processingCount: document.getElementById("processingCount"),
    failedCount: document.getElementById("failedCount"),
    doneCount: document.getElementById("doneCount"),
    lastJobProcessed: document.getElementById("lastJobProcessed"),
    lastJobProcessedMeta: document.getElementById("lastJobProcessedMeta"),
    oldestQueuedJob: document.getElementById("oldestQueuedJob"),
    oldestQueuedJobMeta: document.getElementById("oldestQueuedJobMeta"),
    staleProcessingJobs: document.getElementById("staleProcessingJobs"),
    lastWebhook: document.getElementById("lastWebhook"),
    lastWebhookMeta: document.getElementById("lastWebhookMeta"),
    failedWebhooks24h: document.getElementById("failedWebhooks24h"),
    webhookPendingMeta: document.getElementById("webhookPendingMeta"),
    paidWithoutJob: document.getElementById("paidWithoutJob"),
    lastReportEmailSent: document.getElementById("lastReportEmailSent"),
    lastReportEmailSentMeta: document.getElementById("lastReportEmailSentMeta"),
    failedReportEmails: document.getElementById("failedReportEmails"),
    unsentDoneReports: document.getElementById("unsentDoneReports"),
    retryableReportEmails: document.getElementById("retryableReportEmails"),
    retryLimitReportEmails: document.getElementById("retryLimitReportEmails"),
    healthRecommendations: document.getElementById("healthRecommendations"),
    engineAnalyticsGeneratedAt: document.getElementById("engineAnalyticsGeneratedAt"),
    engineAnalyticsTotal: document.getElementById("engineAnalyticsTotal"),
    engineAnalyticsWindow: document.getElementById("engineAnalyticsWindow"),
    engineAnalyticsConfidence: document.getElementById("engineAnalyticsConfidence"),
    engineAnalyticsScoreGap: document.getElementById("engineAnalyticsScoreGap"),
    engineAnalyticsExtraRate: document.getElementById("engineAnalyticsExtraRate"),
    engineAuditAudited: document.getElementById("engineAuditAudited"),
    engineAuditReview: document.getElementById("engineAuditReview"),
    engineAuditReviewMeta: document.getElementById("engineAuditReviewMeta"),
    engineAuditPrimaryMismatch: document.getElementById("engineAuditPrimaryMismatch"),
    engineAuditExtraMismatch: document.getElementById("engineAuditExtraMismatch"),
    bankQualityGeneratedAt: document.getElementById("bankQualityGeneratedAt"),
    bankQualityAverageScore: document.getElementById("bankQualityAverageScore"),
    bankQualityCritical: document.getElementById("bankQualityCritical"),
    bankQualityWarning: document.getElementById("bankQualityWarning"),
    bankQualityReview: document.getElementById("bankQualityReview"),
    bankQualityRows: document.getElementById("bankQualityRows"),
    engineDomainRows: document.getElementById("engineDomainRows"),
    engineQualityRows: document.getElementById("engineQualityRows"),
    engineOverlapRows: document.getElementById("engineOverlapRows"),
    engineFocusRows: document.getElementById("engineFocusRows"),
    engineReviewRows: document.getElementById("engineReviewRows"),
    engineDecisionAuditRows: document.getElementById("engineDecisionAuditRows"),
    alertRows: document.getElementById("alertRows"),
    operationalAlertLevel: document.getElementById("operationalAlertLevel"),
    operationalAlertSummary: document.getElementById("operationalAlertSummary"),
    operationalAlertWindow: document.getElementById("operationalAlertWindow"),
    operationalAlertMetrics: document.getElementById("operationalAlertMetrics"),
    emailIssueRows: document.getElementById("emailIssueRows"),
    emailDeliverabilityLevel: document.getElementById("emailDeliverabilityLevel"),
    emailDeliverabilityWindow: document.getElementById("emailDeliverabilityWindow"),
    emailDeliverabilitySuccessRate: document.getElementById("emailDeliverabilitySuccessRate"),
    emailDeliverabilityAttempted: document.getElementById("emailDeliverabilityAttempted"),
    emailDeliverabilityFailureRate: document.getElementById("emailDeliverabilityFailureRate"),
    emailDeliverabilityFailures: document.getElementById("emailDeliverabilityFailures"),
    emailDeliverabilityStale: document.getElementById("emailDeliverabilityStale"),
    emailDeliverabilityProviderCoverage: document.getElementById("emailDeliverabilityProviderCoverage"),
    emailDeliverabilityProviderMeta: document.getElementById("emailDeliverabilityProviderMeta"),
    emailDeliverabilityConfig: document.getElementById("emailDeliverabilityConfig"),
    emailDeliverabilityConfigMeta: document.getElementById("emailDeliverabilityConfigMeta"),
    emailDeliverabilityErrorRows: document.getElementById("emailDeliverabilityErrorRows"),
    emailDeliverabilityRecommendationRows: document.getElementById("emailDeliverabilityRecommendationRows"),
    emailDeliveryStatusFilter: document.getElementById("emailDeliveryStatusFilter"),
    refreshEmailDeliveryCenterBtn: document.getElementById("refreshEmailDeliveryCenterBtn"),
    emailDeliverySent: document.getElementById("emailDeliverySent"),
    emailDeliverySentMeta: document.getElementById("emailDeliverySentMeta"),
    emailDeliveryFailed: document.getElementById("emailDeliveryFailed"),
    emailDeliveryRetryLimit: document.getElementById("emailDeliveryRetryLimit"),
    emailDeliveryRetryable: document.getElementById("emailDeliveryRetryable"),
    emailDeliveryLastAttempt: document.getElementById("emailDeliveryLastAttempt"),
    emailDeliveryCenterRows: document.getElementById("emailDeliveryCenterRows"),
    sessionSearchInput: document.getElementById("sessionSearchInput"),
    sessionSearchBtn: document.getElementById("sessionSearchBtn"),
    sessionSearchHint: document.getElementById("sessionSearchHint"),
    sessionSearchRows: document.getElementById("sessionSearchRows"),
    toggleOperationsLogBtn: document.getElementById("toggleOperationsLogBtn"),
    operationsLogPanelBody: document.getElementById("operationsLogPanelBody"),
    operationsLogRows: document.getElementById("operationsLogRows"),
    queueRows: document.getElementById("queueRows"),
    recentRows: document.getElementById("recentRows"),
    failedRows: document.getElementById("failedRows"),
    sessionDetail: document.getElementById("sessionDetail")
  };

  let activeLogFilter = "all";
  let operationsLogCollapsed = readOperationsLogCollapsed();

  function currentEmailDeliveryStatusFilter() {
    return els.emailDeliveryStatusFilter?.value || "actionable";
  }

  function readOperationsLogCollapsed() {
    const value = localStorage.getItem(OPERATIONS_LOG_KEY);
    if (value === "open" || value === "1") return false;
    if (value === "collapsed" || value === "0") return true;
    return true;
  }

  function bindClick(element, handler) {
    if (!element) return;
    element.addEventListener("click", handler);
  }

  function normalizeToken(value) {
    return String(value || "").replace(/\s+/g, "").trim();
  }

  function readSavedToken() {
    return normalizeToken(
      localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("ADMIN_TOKEN") ||
        ""
    );
  }

  function getToken() {
    const fromInput = normalizeToken(els.token?.value || "");
    if (fromInput) return fromInput;

    const saved = readSavedToken();
    if (saved && els.token) {
      els.token.value = saved;
    }

    return saved;
  }

  function setBusy(isBusy) {
    [
      els.saveTokenBtn,
      els.clearTokenBtn,
      els.refreshBtn,
      els.processOneBtn,
      els.retryEmailBatchBtn,
      els.alertCheckBtn,
      els.operationalAlertBtn,
      els.bankQualityAlertBtn,
      els.postPaymentRecoveryBtn,
      els.postPaymentRecoveryPanelBtn,
      els.refreshLaunchReadinessBtn,
      els.refreshEmailDeliveryCenterBtn,
      els.sessionSearchBtn
    ].forEach((button) => {
      if (button) button.disabled = isBusy;
    });

    document.querySelectorAll("[data-control-action]").forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function setStatus(message, isError) {
    if (!els.statusText) return;
    els.statusText.textContent = message || "";
    els.statusText.classList.toggle("error", Boolean(isError));
  }

  function text(value) {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  }

  function compact(value, max = 96) {
    const raw = text(value);
    return raw.length > max ? `${raw.slice(0, max)}...` : raw;
  }

  function summaryChip(label, value) {
    const chip = document.createElement("div");
    chip.className = "summary-chip";

    const title = document.createElement("span");
    title.textContent = label;

    const body = document.createElement("strong");
    body.textContent = text(value);

    chip.append(title, body);
    return chip;
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("hu-HU", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function relativeMinutes(value) {
    if (value === null || value === undefined) return "-";
    const minutes = Number(value);
    if (Number.isNaN(minutes)) return "-";
    if (minutes < 1) return "most";
    if (minutes < 60) return `${minutes} perce`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} óra ${rest} perce` : `${hours} órája`;
  }

  function statusClass(value) {
    const status = String(value || "unknown").toLowerCase();
    if (
      [
        "queued",
        "processing",
        "processed",
        "received",
        "failed",
        "done",
        "completed",
        "paid",
        "unpaid",
        "not_sent",
        "sending",
        "sent",
        "skipped",
        "healthy",
        "critical",
        "warning",
        "ok",
        "problem",
        "waiting",
        "unknown",
        "active",
        "clean",
        "info",
        "email",
        "analysis",
        "webhook",
        "checkout",
        "ready",
        "blocked",
        "pass",
        "warn",
        "fail",
        "high",
        "medium",
        "low"
      ].includes(status)
    ) {
      return status;
    }
    return "unknown";
  }

  function statusLabel(value) {
    const labels = {
      queued: "várakozik",
      processing: "feldolgozás alatt",
      processed: "feldolgozva",
      received: "beérkezett",
      failed: "hibás",
      done: "kész",
      completed: "kész",
      paid: "fizetve",
      unpaid: "nincs fizetve",
      not_sent: "nincs elküldve",
      sending: "küldés alatt",
      sent: "elküldve",
      skipped: "kihagyva",
      healthy: "rendben",
      critical: "kritikus",
      warning: "figyelendő",
      ok: "rendben",
      problem: "hiba",
      waiting: "várakozik",
      unknown: "ismeretlen",
      active: "aktív",
      clean: "rendben",
      info: "információ",
      email: "email",
      analysis: "elemzés",
      webhook: "webhook",
      checkout: "checkout",
      ready: "indításra kész",
      blocked: "blokkolt",
      pass: "rendben",
      warn: "figyelendő",
      fail: "hiba",
      high: "magas",
      medium: "kozepes",
      low: "alacsony",
      open: "nyitott",
      resolved: "lezárva",
      pending: "függőben"
    };

    return labels[String(value || "").toLowerCase()] || text(value);
  }

  async function api(path, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Add meg az ADMIN_TOKEN értékét.");
    }

    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Admin API hiba (${response.status})`);
    }

    return data;
  }

  async function fetchAdmin(path, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Add meg az ADMIN_TOKEN értékét.");
    }

    return fetch(path, {
      ...options,
      headers: {
        "x-admin-token": token,
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  }

  function filenameFromDisposition(value, fallback) {
    const header = String(value || "");
    const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch) {
      return decodeURIComponent(utfMatch[1]);
    }

    const match = header.match(/filename="?([^"]+)"?/i);
    return match ? match[1] : fallback;
  }

  function cell(content) {
    const td = document.createElement("td");
    if (content instanceof Node) {
      td.appendChild(content);
    } else {
      td.textContent = text(content);
    }
    return td;
  }

  function statusPill(status) {
    const span = document.createElement("span");
    span.className = `pill ${statusClass(status)}`;
    span.textContent = statusLabel(status);
    return span;
  }

  function personBlock(row) {
    const wrapper = document.createElement("div");

    const person = document.createElement("div");
    person.className = "person";
    person.textContent = text(row.name);

    const email = document.createElement("div");
    email.className = "subtle";
    email.textContent = text(row.email);

    const id = document.createElement("div");
    id.className = "subtle";
    id.textContent = row.id;

    wrapper.append(person, email, id);
    return wrapper;
  }

  function focusBlock(row) {
    const wrapper = document.createElement("div");

    const primary = document.createElement("div");
    primary.textContent = `Fő: ${text(row.detectedRisk)}`;

    const secondary = document.createElement("div");
    secondary.className = "subtle";
    secondary.textContent = `Másodlagos: ${text(row.secondaryRisk)}`;

    const lang = document.createElement("div");
    lang.className = "subtle";
    lang.textContent = `Nyelv: ${text(row.lang)}`;

    wrapper.append(primary, secondary, lang);
    return wrapper;
  }

  function getRowSessionId(row) {
    if (!row) return "";
    return String(row.id || row.sessionId || row.session_id || row.internal_session_id || "").trim();
  }

  function actionButton(label, action, id, className) {
    const safeId = String(id || "").trim();
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = safeId;
    button.dataset.sessionId = safeId;
    if (!safeId && action !== "toggle-operations-log") {
      button.disabled = true;
      button.title = "Ehhez a sorhoz nem talalhato session ID.";
    }
    if (className) button.className = className;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleAction(action, safeId);
    });
    return button;
  }

  function actions(row, includeResend = true, includeEmailReset = false) {
    const wrapper = document.createElement("div");
    const sessionId = getRowSessionId(row);
    wrapper.className = "actions";
    wrapper.appendChild(actionButton("Részletek", "detail", sessionId, "secondary"));
    wrapper.appendChild(actionButton("PDF", "download-pdf", sessionId, "secondary"));
    wrapper.appendChild(actionButton("PDF újragenerálás", "regenerate-pdf", sessionId, "secondary"));
    wrapper.appendChild(actionButton("Elemzés újraindítása", "retry", sessionId, "warn"));

    if (includeResend) {
      wrapper.appendChild(actionButton("Email újraküldés", "resend", sessionId, "secondary"));
    }

    if (includeEmailReset) {
      wrapper.appendChild(actionButton("Email retry alaphelyzet", "reset-email", sessionId, "secondary"));
    }

    return wrapper;
  }

  function emptyRow(target, colSpan, message) {
    if (!target) return;
    target.replaceChildren();
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "empty";
    td.colSpan = colSpan;
    td.textContent = message;
    tr.appendChild(td);
    target.appendChild(tr);
  }

  function showEmptyDetail(message = "Nincs kiválasztott session.") {
    if (!els.sessionDetail) return;
    els.sessionDetail.className = "session-detail empty-detail";
    els.sessionDetail.textContent = message;
  }

  function showJsonDetail(data) {
    if (!els.sessionDetail) return;
    els.sessionDetail.className = "session-detail";
    const pre = document.createElement("pre");
    pre.className = "raw-json";
    pre.textContent = JSON.stringify(data, null, 2);
    els.sessionDetail.replaceChildren(pre);
  }

  function setOperationsLogCollapsed(collapsed) {
    operationsLogCollapsed = collapsed;
    localStorage.setItem(OPERATIONS_LOG_KEY, collapsed ? "collapsed" : "open");

    if (els.operationsLogPanelBody) {
      els.operationsLogPanelBody.classList.toggle("is-collapsed", collapsed);
      els.operationsLogPanelBody.hidden = collapsed;
    }

    if (els.toggleOperationsLogBtn) {
      els.toggleOperationsLogBtn.setAttribute("aria-expanded", String(!collapsed));
      els.toggleOperationsLogBtn.textContent = collapsed
        ? "Napló megnyitása"
        : "Napló összecsukása";
    }
  }

  function toggleOperationsLog() {
    setOperationsLogCollapsed(!operationsLogCollapsed);
  }

  function readCollapsibleSectionCollapsed(sectionId) {
    const value = localStorage.getItem(`${COLLAPSIBLE_SECTION_KEY_PREFIX}${sectionId}`);

    if (value === "open" || value === "0") return false;
    if (value === "collapsed" || value === "1") return true;

    return DEFAULT_COLLAPSED_SECTIONS.has(sectionId);
  }

  function setCollapsibleSectionCollapsed(sectionId, collapsed) {
    const body = document.querySelector(`[data-collapsible-body="${sectionId}"]`);
    const button = document.querySelector(`[data-collapsible-toggle="${sectionId}"]`);

    localStorage.setItem(
      `${COLLAPSIBLE_SECTION_KEY_PREFIX}${sectionId}`,
      collapsed ? "collapsed" : "open"
    );

    if (body) {
      body.classList.toggle("is-collapsed", collapsed);
      body.hidden = collapsed;
    }

    if (button) {
      button.setAttribute("aria-expanded", String(!collapsed));
      button.textContent = collapsed
        ? button.dataset.openLabel || "Megnyitás"
        : button.dataset.closedLabel || "Összecsukás";
    }
  }

  function toggleCollapsibleSection(sectionId) {
    setCollapsibleSectionCollapsed(
      sectionId,
      !readCollapsibleSectionCollapsed(sectionId)
    );
  }

  function initCollapsibleSections() {
    document.querySelectorAll("[data-collapsible-toggle]").forEach((button) => {
      const sectionId = button.dataset.collapsibleToggle;
      if (!sectionId) return;

      setCollapsibleSectionCollapsed(
        sectionId,
        readCollapsibleSectionCollapsed(sectionId)
      );

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleCollapsibleSection(sectionId);
      });
    });
  }

  function scrollSessionDetailIntoView() {
    const target = document.getElementById("sessionDetailPanel") || els.sessionDetail;
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function scrollToPanel(targetId) {
    if (!targetId) return;

    if (targetId === "operationsLogPanel") {
      setOperationsLogCollapsed(false);
    }

    if (targetId === "sessionListsPanel") {
      setCollapsibleSectionCollapsed("sessionLists", false);
    }

    if (targetId === "engineAnalyticsPanel") {
      setCollapsibleSectionCollapsed("engineReview", false);
      setCollapsibleSectionCollapsed("engineDecisionAudit", false);
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function detailMetric(label, value, options = {}) {
    const card = document.createElement("article");
    card.className = "detail-metric";

    const title = document.createElement("span");
    title.textContent = label;

    const body = document.createElement("strong");
    if (options.pill) {
      body.appendChild(statusPill(value));
    } else {
      body.textContent = text(value);
    }

    card.append(title, body);
    return card;
  }

  function timelineItem(label, value) {
    const item = document.createElement("div");
    item.className = "timeline-item";

    const dot = document.createElement("span");
    dot.className = value ? "timeline-dot active" : "timeline-dot";

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = label;

    const date = document.createElement("span");
    date.textContent = formatDate(value);

    copy.append(title, date);
    item.append(dot, copy);
    return item;
  }

  function formatNumber(value, digits = 2) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : "-";
  }

  function yesNo(value) {
    return value ? "igen" : "nem";
  }

  function retryActionLabel(value) {
    const labels = {
      no_action: "nincs teendő",
      inspect_then_reset_retry: "ellenőrzés, majd retry alaphelyzet",
      resend_report_email: "riport email újraküldése",
      wait_for_report: "riport elkészülésére vár",
      ready: "készen áll",
      payment_not_paid: "nincs kifizetve",
      missing_payload: "hiányzó payload",
      analysis_done: "elemzés kész",
      analysis_already_running: "elemzés már fut",
      analysis_failed: "elemzés hibára futott"
    };

    return labels[value] || text(value);
  }

  function enginePatternLabel(value) {
    const labels = {
      clear_pattern: "tiszta minta",
      overlap_pattern: "atfedo minta",
      needs_observation: "tovabbi megfigyelest igenyel",
      weak_signal: "gyenge jelzes"
    };

    return labels[value] || text(value);
  }

  function decisionQualityLabel(value) {
    const labels = {
      high: "magas",
      medium: "kozepes",
      low: "alacsony"
    };

    return labels[value] || text(value);
  }

  function scoreSourceLabel(value) {
    const labels = {
      "triageRanking.weightedSignal": "sulyozott triage ranking",
      "triageScores.normalizedRaw": "normalizalt triage pontszam"
    };

    return labels[value] || text(value);
  }

  function summaryField(label, value, options = {}) {
    const item = document.createElement("div");
    item.className = "summary-field";

    const title = document.createElement("span");
    title.textContent = label;

    const body = document.createElement("strong");
    if (options.pill) {
      body.appendChild(statusPill(value));
    } else {
      body.textContent = text(value);
    }

    item.append(title, body);
    return item;
  }

  function normalizedStatus(value) {
    return String(value || "").toLowerCase();
  }

  function hasReportMaterial(session) {
    return Boolean(
      session.hasAnalysisResult ||
      session.analysis_result ||
      session.analysisPreview ||
      session.reportSummary?.hasAnalysisResult
    );
  }

  function hasRelatedWebhook(session) {
    return Array.isArray(session.webhookEvents) && session.webhookEvents.length > 0;
  }

  function getSessionNextAction(session) {
    const payment = normalizedStatus(session.payment_status);
    const analysis = normalizedStatus(session.analysis_status);
    const email = normalizedStatus(session.report_email_status);
    const attempts = Number(session.report_email_attempts || 0);

    if (payment && payment !== "paid") {
      return {
        level: "warning",
        title: "Fizetés még nincs lezárva",
        detail: "A session nem tekinthető teljes riportfolyamatnak, amíg a Stripe fizetés nincs fizetett állapotban.",
        meta: "Elsőként a checkout vagy webhook oldalt érdemes ellenőrizni.",
        actions: []
      };
    }

    if (analysis === "failed") {
      return {
        level: "critical",
        title: "Elemzés retry javasolt",
        detail: compact(session.error_message || "Az elemzés hibára futott. A worker újrapróbálása vagy a payload ellenőrzése szükséges.", 170),
        meta: "Tipikus ok: OpenAI/PDF/email előfeltétel, sérült payload vagy worker hiba.",
        actions: [actionButton("Elemzés újraindítása", "retry", session.id, "warn")]
      };
    }

    if (["queued", "processing"].includes(analysis)) {
      return {
        level: "active",
        title: "Worker feldolgozás figyelése",
        detail: "A fizetés megvan, a session elemzésre vár vagy feldolgozás alatt van.",
        meta: "Ha hosszabb ideje nem mozdul, a queue panelen érdemes folytatni.",
        actions: []
      };
    }

    if (["done", "completed"].includes(analysis) && !hasReportMaterial(session)) {
      return {
        level: "warning",
        title: "Riport/PDF alapanyag ellenőrzés",
        detail: "Az elemzés státusza kész, de a dashboard nem lát riportanyag-előnézetet.",
        meta: "PDF újragenerálás vagy session payload ellenőrzés javasolt.",
        actions: [actionButton("PDF újragenerálás", "regenerate-pdf", session.id, "secondary")]
      };
    }

    if (["failed", "not_sent"].includes(email)) {
      return {
        level: attempts >= 3 ? "critical" : "warning",
        title: "Email kézbesítés beavatkozást kér",
        detail: compact(session.report_email_error || "A riport elkészült, de az email nincs sikeresen elküldve.", 170),
        meta: `Email próbálkozások: ${Number.isFinite(attempts) ? attempts : 0}`,
        actions: [
          actionButton("Email újraküldés", "resend", session.id, "secondary"),
          actionButton("Email retry alaphelyzet", "reset-email", session.id, "secondary")
        ]
      };
    }

    if (email === "sent") {
      return {
        level: "ok",
        title: "Riportfolyamat lezárva",
        detail: "A fizetés, elemzés, PDF alapanyag és email kézbesítés alapján ez a session rendben van.",
        meta: "Ellenőrzéshez a PDF letölthető.",
        actions: [actionButton("PDF letöltése", "download-pdf", session.id, "secondary")]
      };
    }

    return {
      level: "info",
      title: "Részletek áttekintése",
      detail: "Nincs egyértelmű kritikus teendő, de a session státuszai még nem adnak teljesen lezárt képet.",
      meta: "A folyamatlépések és az idővonal segítenek a következő pont megtalálásában.",
      actions: []
    };
  }

  function stageTile(label, level, status, detail) {
    const tile = document.createElement("article");
    tile.className = `session-stage-tile ${statusClass(level)}`;

    const head = document.createElement("div");
    head.className = "session-stage-head";

    const title = document.createElement("strong");
    title.textContent = label;

    head.append(title, statusPill(level));

    const statusText = document.createElement("span");
    statusText.className = "session-stage-status";
    statusText.textContent = text(status);

    const copy = document.createElement("p");
    copy.textContent = text(detail);

    tile.append(head, statusText, copy);
    return tile;
  }

  function deriveStageLevel(status, okStatuses = []) {
    const normalized = normalizedStatus(status);
    if (okStatuses.includes(normalized)) return "ok";
    if (["failed", "problem", "blocked", "fail"].includes(normalized)) return "problem";
    if (["queued", "processing", "sending", "received", "not_sent"].includes(normalized)) return "waiting";
    if (!normalized) return "unknown";
    return "info";
  }

  function renderSessionStageRail(session) {
    const card = document.createElement("section");
    card.className = "detail-card session-stage-rail";

    const title = document.createElement("h4");
    title.textContent = "Folyamatlépések";

    const grid = document.createElement("div");
    grid.className = "session-stage-grid";

    const paymentLevel = deriveStageLevel(session.payment_status, ["paid"]);
    const webhookLevel = hasRelatedWebhook(session) ? "ok" : paymentLevel === "ok" ? "waiting" : "unknown";
    const reportLevel = hasReportMaterial(session)
      ? "ok"
      : ["done", "completed"].includes(normalizedStatus(session.analysis_status))
        ? "warning"
        : "waiting";
    const emailLevel = deriveStageLevel(session.report_email_status, ["sent"]);

    grid.append(
      stageTile("Fizetés", paymentLevel, statusLabel(session.payment_status), `Stripe session: ${text(session.stripe_session_id)}`),
      stageTile("Webhook", webhookLevel, hasRelatedWebhook(session) ? "van kapcsolódó esemény" : "nincs közvetlen esemény", "A webhook események a lentebbi táblában is látszanak."),
      stageTile("Elemzés", deriveStageLevel(session.analysis_status, ["done", "completed"]), statusLabel(session.analysis_status), `Worker job: ${Array.isArray(session.analysisJobs) ? session.analysisJobs.length : 0} db`),
      stageTile("Riport/PDF", reportLevel, hasReportMaterial(session) ? "riportalapanyag elérhető" : "riportalapanyag nem látszik", `Kérdőív: ${text(session.questionnaireVersion)}`),
      stageTile("Email", emailLevel, statusLabel(session.report_email_status), `Próbálkozás: ${text(session.report_email_attempts)}`)
    );

    card.append(title, grid);
    return card;
  }

  function renderPriorityFacts(session) {
    const card = document.createElement("section");
    card.className = "detail-card priority-facts-card";

    const title = document.createElement("h4");
    title.textContent = "Prioritás adatok";

    const grid = document.createElement("div");
    grid.className = "priority-facts-grid";

    const summary = session.reportSummary || {};
    grid.append(
      summaryField("Session ID", session.id),
      summaryField("Stripe session", session.stripe_session_id),
      summaryField("Nyelv", session.lang),
      summaryField("Gyermek életkora", summary.hasAge ? `${formatNumber(summary.childAge, 1)} év` : "nincs megadva"),
      summaryField("Fő fókusz", session.detectedRisk || summary.detectedRisk),
      summaryField("Másodlagos fókusz", session.secondaryRisk || summary.secondaryRisk),
      summaryField("Email próbálkozás", session.report_email_attempts),
      summaryField("Utolsó email hiba", compact(session.report_email_error, 90))
    );

    card.append(title, grid);
    return card;
  }

  function renderSessionCockpit(session) {
    const nextAction = getSessionNextAction(session);
    const card = document.createElement("section");
    card.className = `detail-card session-cockpit ${statusClass(nextAction.level)}`;

    const layout = document.createElement("div");
    layout.className = "session-cockpit-layout";

    const focus = document.createElement("div");
    focus.className = "session-action-box";

    const eyebrow = document.createElement("span");
    eyebrow.className = "session-cockpit-eyebrow";
    eyebrow.textContent = "Részlet fókusz";

    const title = document.createElement("h4");
    title.textContent = nextAction.title;

    const detail = document.createElement("p");
    detail.textContent = nextAction.detail;

    const meta = document.createElement("div");
    meta.className = "session-action-meta";
    meta.textContent = nextAction.meta;

    const actionWrap = document.createElement("div");
    actionWrap.className = "actions session-cockpit-actions";
    nextAction.actions.forEach((button) => actionWrap.appendChild(button));

    focus.append(eyebrow, title, detail, meta, actionWrap);

    const strip = document.createElement("div");
    strip.className = "session-status-strip";
    strip.append(
      summaryField("Fizetés", session.payment_status, { pill: true }),
      summaryField("Elemzés", session.analysis_status, { pill: true }),
      summaryField("Email", session.report_email_status, { pill: true }),
      summaryField("Frissítve", formatDate(session.updated_at))
    );

    layout.append(focus, strip);
    card.append(layout);
    return card;
  }

  function renderReportSnapshot(session) {
    const summary = session.reportSummary || {};
    const email = summary.email || {};
    const analysisRetry = summary.analysisRetry || {};
    const engine = summary.engine || {};
    const coherence = engine.specificCoherence || {};
    const job = analysisRetry.job || {};

    const card = document.createElement("section");
    card.className = "detail-card report-summary-card";

    const title = document.createElement("h4");
    title.textContent = "Riport áttekintés";

    const grid = document.createElement("div");
    grid.className = "summary-field-grid";
    grid.append(
      summaryField("Gyermek életkora", summary.hasAge ? `${formatNumber(summary.childAge, 1)} év` : "nincs megadva"),
      summaryField("Korosztály", summary.ageBandLabel || summary.ageBand),
      summaryField("Fő jelzés", summary.detectedRisk),
      summaryField("Másodlagos jelzés", summary.secondaryRisk),
      summaryField("Erősség", summary.severity, { pill: true }),
      summaryField("Jelzésszint", summary.signalLabel),
      summaryField("Specifikus átlag", formatNumber(summary.normalizedAverage)),
      summaryField("Engine döntés", enginePatternLabel(engine.patternType)),
      summaryField("Döntési minőség", decisionQualityLabel(engine.decisionQuality)),
      summaryField("Confidence", engine.confidenceLabel ? `${decisionQualityLabel(engine.confidenceLabel)} (${formatNumber(engine.confidence)})` : "-"),
      summaryField("Pontkülönbség", formatNumber(engine.scoreGap)),
      summaryField("Átfedés", formatNumber(engine.overlapScore)),
      summaryField("Extra kérdés kell", yesNo(engine.shouldAskExtra)),
      summaryField("Pontforrás", scoreSourceLabel(engine.scoreSource)),
      summaryField("Specifikus koherencia", coherence.label ? `${text(coherence.label)} (${formatNumber(coherence.score)})` : "-"),
      summaryField("Kérdőív verzió", summary.questionnaireVersion),
      summaryField("Email retry teendő", retryActionLabel(email.nextAction)),
      summaryField("Email retry elérhető", yesNo(email.retryAvailable)),
      summaryField("Email retry limit", yesNo(email.retryLimitReached)),
      summaryField("Elemzés retry állapot", retryActionLabel(analysisRetry.reason)),
      summaryField("Elemzés retry javasolt", yesNo(analysisRetry.retryRecommended)),
      summaryField("Worker job", job.status || "nincs aktív job"),
      summaryField("Worker próbálkozás", job.attempts ?? "-")
    );

    const topAreas = document.createElement("p");
    topAreas.className = "summary-top-areas";
    const areas = Array.isArray(summary.topSubdomains)
      ? summary.topSubdomains
          .map((item) => `${item.key}: ${formatNumber(item.average)}`)
          .join(", ")
      : "";
    topAreas.textContent = areas
      ? `Legerősebb alterületek: ${areas}`
      : "Legerősebb alterületek: nincs elérhető alterületi profil.";

    const engineAreas = document.createElement("p");
    engineAreas.className = "summary-top-areas";
    const focusAreas = Array.isArray(engine.recommendedFocusAreas)
      ? engine.recommendedFocusAreas.join(", ")
      : "";
    engineAreas.textContent = focusAreas
      ? `Engine fókuszterületek: ${focusAreas}`
      : "Engine fókuszterületek: nincs elérhető engine v2 összegzés.";

    const rankedDomains = document.createElement("p");
    rankedDomains.className = "summary-top-areas";
    const domainText = Array.isArray(engine.rankedDomains)
      ? engine.rankedDomains
          .map((item) => `${item.domain}: ${formatNumber(item.score)}`)
          .join(", ")
      : "";
    rankedDomains.textContent = domainText
      ? `Rangsorolt területek: ${domainText}`
      : "Rangsorolt területek: nincs elérhető ranking.";

    card.append(title, grid, topAreas, engineAreas, rankedDomains);
    return card;
  }

  function renderSessionDiagnostics(session) {
    const diagnostics = session.diagnostics || {};
    const stages = Array.isArray(diagnostics.stages) ? diagnostics.stages : [];
    const actions = Array.isArray(diagnostics.recommendedActions)
      ? diagnostics.recommendedActions
      : [];

    const card = document.createElement("section");
    card.className = "detail-card diagnostics-card";

    const header = document.createElement("div");
    header.className = "diagnostics-header";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = "Hibakeresési térkép";
    const copy = document.createElement("p");
    copy.textContent = "Session szintű folyamatkép: fizetés, webhook, worker, PDF alapanyag és email kézbesítés.";
    titleWrap.append(title, copy);

    const score = document.createElement("span");
    score.className = `pill ${statusClass(diagnostics.overallLevel)}`;
    score.textContent = statusLabel(diagnostics.overallLevel);

    header.append(titleWrap, score);

    const grid = document.createElement("div");
    grid.className = "diagnostic-grid";

    stages.forEach((stage) => {
      const item = document.createElement("article");
      item.className = `diagnostic-stage ${statusClass(stage.level)}`;

      const stageHead = document.createElement("div");
      stageHead.className = "diagnostic-stage-head";

      const label = document.createElement("strong");
      label.textContent = text(stage.label);

      const pill = document.createElement("span");
      pill.className = `pill ${statusClass(stage.level)}`;
      pill.textContent = statusLabel(stage.level);

      stageHead.append(label, pill);

      const status = document.createElement("div");
      status.className = "diagnostic-status";
      status.textContent = statusLabel(stage.status);

      const detail = document.createElement("p");
      detail.textContent = text(stage.detail);

      item.append(stageHead, status, detail);
      grid.appendChild(item);
    });

    const actionBox = document.createElement("div");
    actionBox.className = "recommended-actions";
    const actionTitle = document.createElement("strong");
    actionTitle.textContent = "Javasolt következő lépések";
    const list = document.createElement("ul");
    actions.forEach((action) => {
      const li = document.createElement("li");
      li.textContent = text(action);
      list.appendChild(li);
    });
    actionBox.append(actionTitle, list);

    card.append(header, grid, actionBox);
    return card;
  }

  function renderMiniTable(titleText, rows, columns, emptyText) {
    const card = document.createElement("section");
    card.className = "detail-card mini-table-card";

    const title = document.createElement("h4");
    title.textContent = titleText;

    const wrapper = document.createElement("div");
    wrapper.className = "mini-table-wrap";

    const table = document.createElement("table");
    table.className = "mini-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = columns.length;
      td.className = "empty";
      td.textContent = emptyText;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        columns.forEach((column) => {
          const td = document.createElement("td");
          const value = column.value(row);
          if (value instanceof Node) {
            td.appendChild(value);
          } else {
            td.textContent = text(value);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    table.append(thead, tbody);
    wrapper.appendChild(table);
    card.append(title, wrapper);
    return card;
  }

  function renderAnalysisJobs(session) {
    const rows = Array.isArray(session.analysisJobs) ? session.analysisJobs : [];

    return renderMiniTable(
      "Worker job előzmények",
      rows,
      [
        { label: "Státusz", value: (row) => statusPill(row.status) },
        { label: "Próbálkozás", value: (row) => row.attempts },
        { label: "Worker", value: (row) => row.locked_by },
        { label: "Utolsó hiba", value: (row) => compact(row.last_error, 120) },
        { label: "Frissítve", value: (row) => formatDate(row.updated_at || row.created_at) }
      ],
      "Ehhez a sessionhöz nem találtam worker job előzményt."
    );
  }

  function renderWebhookEvents(session) {
    const rows = Array.isArray(session.webhookEvents) ? session.webhookEvents : [];

    return renderMiniTable(
      "Webhook események",
      rows,
      [
        { label: "Esemény", value: (row) => row.event_type },
        { label: "Státusz", value: (row) => statusPill(row.status) },
        { label: "Stripe session", value: (row) => row.stripe_session_id },
        { label: "Hiba", value: (row) => compact(row.error_message, 120) },
        { label: "Érkezett", value: (row) => formatDate(row.created_at) }
      ],
      "Ehhez a sessionhöz nem találtam közvetlenül kapcsolódó webhook eseményt."
    );
  }

  function renderSessionDetail(session) {
    const root = document.createElement("div");
    root.className = "session-detail-view";

    const header = document.createElement("div");
    header.className = "session-detail-header";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = text(session.name);

    const subtitle = document.createElement("p");
    subtitle.textContent = `${text(session.email)} · ${text(session.id)}`;

    titleWrap.append(title, subtitle);

    const actionWrap = document.createElement("div");
    actionWrap.className = "actions detail-actions";
    actionWrap.append(
      actionButton("Elemzés újraindítása", "retry", session.id, "warn"),
      actionButton("PDF", "download-pdf", session.id, "secondary"),
      actionButton("PDF újragenerálás", "regenerate-pdf", session.id, "secondary"),
      actionButton("Email újraküldés", "resend", session.id, "secondary"),
      actionButton("Email retry alaphelyzet", "reset-email", session.id, "secondary")
    );

    header.append(titleWrap, actionWrap);

    const grid = document.createElement("div");
    grid.className = "detail-grid";
    grid.append(
      detailMetric("Fizetés", session.payment_status, { pill: true }),
      detailMetric("Elemzés", session.analysis_status, { pill: true }),
      detailMetric("Email", session.report_email_status, { pill: true }),
      detailMetric("Email próbálkozások", session.report_email_attempts),
      detailMetric("Nyelv", session.lang),
      detailMetric("Fő fókusz", session.detectedRisk),
      detailMetric("Másodlagos fókusz", session.secondaryRisk),
      detailMetric("Kérdőív", session.questionnaireVersion),
      detailMetric("Riport szöveg", session.hasAnalysisResult ? `${session.analysisResultLength} karakter` : "hiányzik"),
      detailMetric("Payload", session.hasPayload ? "elérhető" : "hiányzik"),
      detailMetric("Stripe session", session.stripe_session_id),
      detailMetric("Email szolgáltatói ID", session.report_email_provider_id)
    );

    const counts = session.counts || {};
    const countsPanel = document.createElement("section");
    countsPanel.className = "detail-card";
    const countsTitle = document.createElement("h4");
    countsTitle.textContent = "Kérdésszámok";
    const countCopy = document.createElement("p");
    countCopy.textContent =
      `Triage ${Number(counts.triageAnswers || 0)}/${Number(counts.triageQuestions || 0)}, ` +
      `specific ${Number(counts.specificAnswers || 0)}/${Number(counts.specificQuestions || 0)}, ` +
      `extra ${Number(counts.extraAnswers || 0)}/${Number(counts.extraQuestions || 0)}.`;
    countsPanel.append(countsTitle, countCopy);

    const timeline = document.createElement("section");
    timeline.className = "detail-card";
    const timelineTitle = document.createElement("h4");
    timelineTitle.textContent = "Idővonal";
    const timelineGrid = document.createElement("div");
    timelineGrid.className = "timeline-grid";
    timelineGrid.append(
      timelineItem("Létrehozva", session.created_at),
      timelineItem("Fizetve", session.paid_at),
      timelineItem("Elemzés indult", session.analysis_started_at),
      timelineItem("Elemzés kész", session.analysis_completed_at),
      timelineItem("Email próbálkozás", session.report_email_last_attempt_at),
      timelineItem("Email elküldve", session.report_email_sent_at),
      timelineItem("Frissítve", session.updated_at)
    );
    timeline.append(timelineTitle, timelineGrid);

    const errors = document.createElement("section");
    errors.className = "detail-card";
    const errorsTitle = document.createElement("h4");
    errorsTitle.textContent = "Hibák";
    const errorText = document.createElement("p");
    errorText.textContent =
      session.report_email_error ||
      session.error_message ||
      "Nincs aktuális rögzített hiba.";
    errors.append(errorsTitle, errorText);

    const preview = document.createElement("section");
    preview.className = "detail-card";
    const previewTitle = document.createElement("h4");
    previewTitle.textContent = "Elemzés előnézet";
    const previewText = document.createElement("p");
    previewText.className = "analysis-preview";
    previewText.textContent = session.analysisPreview || "Nincs elérhető elemzés előnézet.";
    preview.append(previewTitle, previewText);

    const raw = document.createElement("details");
    raw.className = "raw-session";
    const rawSummary = document.createElement("summary");
    rawSummary.textContent = "Nyers session JSON";
    const rawPre = document.createElement("pre");
    rawPre.className = "raw-json";
    rawPre.textContent = JSON.stringify(session, null, 2);
    raw.append(rawSummary, rawPre);

    root.append(
      header,
      renderSessionCockpit(session),
      renderSessionStageRail(session),
      renderPriorityFacts(session),
      grid,
      renderSessionDiagnostics(session),
      renderReportSnapshot(session),
      countsPanel,
      timeline,
      renderAnalysisJobs(session),
      renderWebhookEvents(session),
      errors,
      preview,
      raw
    );
    return root;
  }

  function renderSessionRows(target, items, mode) {
    target.replaceChildren();

    if (!items.length) {
      emptyRow(target, mode === "failed" ? 4 : 5, "Nincs megjeleníthető adat.");
      return;
    }

    items.forEach((row, index) => {
      const tr = document.createElement("tr");
      if (mode === "recent" && index === 0) {
        tr.className = "latest-row";
      }

      if (mode === "failed") {
        tr.append(
          cell(personBlock(row)),
          cell(compact(row.error_message, 120)),
          cell(formatDate(row.updated_at || row.created_at)),
          cell(actions(row, true))
        );
      } else {
        tr.append(
          cell(statusPill(row.analysis_status)),
          cell(personBlock(row)),
          cell(focusBlock(row)),
          cell(formatDate(mode === "queue" ? row.updated_at || row.paid_at : row.created_at)),
          cell(actions(row, true))
        );
      }

      target.appendChild(tr);
    });
  }

  function renderEmailIssueRows(items) {
    els.emailIssueRows.replaceChildren();

    if (!items.length) {
      emptyRow(els.emailIssueRows, 5, "Nincs email delivery teendő.");
      return;
    }

    items.forEach((row) => {
      const tr = document.createElement("tr");
      const attemptInfo = document.createElement("div");

      const attempts = document.createElement("div");
      attempts.textContent = `${Number(row.report_email_attempts || 0)} próbálkozás`;

      const lastAttempt = document.createElement("div");
      lastAttempt.className = "subtle";
      lastAttempt.textContent =
        `Utolsó: ${formatDate(row.report_email_last_attempt_at || row.updated_at)}`;

      attemptInfo.append(attempts, lastAttempt);

      tr.append(
        cell(statusPill(row.report_email_status)),
        cell(personBlock(row)),
        cell(attemptInfo),
        cell(compact(row.report_email_error || row.error_message, 140)),
        cell(actions(row, true, true))
      );

      els.emailIssueRows.appendChild(tr);
    });
  }

  function renderEmailDeliveryCenter(data = {}) {
    data = data || {};
    const summary = data.summary || {};
    const rows = data.items || [];

    if (els.emailDeliverySent) {
      els.emailDeliverySent.textContent = Number(summary.sent || 0);
    }

    if (els.emailDeliverySentMeta) {
      els.emailDeliverySentMeta.textContent =
        `Utolso sikeres: ${relativeMinutes(summary.lastSentMinutesAgo)}`;
    }

    if (els.emailDeliveryFailed) {
      els.emailDeliveryFailed.textContent = Number(summary.failed || 0);
    }

    if (els.emailDeliveryRetryLimit) {
      els.emailDeliveryRetryLimit.textContent = Number(summary.retryLimit || 0);
    }

    if (els.emailDeliveryRetryable) {
      els.emailDeliveryRetryable.textContent = Number(summary.retryable || 0);
    }

    if (els.emailDeliveryLastAttempt) {
      els.emailDeliveryLastAttempt.textContent =
        `Utolso probalkozas: ${relativeMinutes(summary.lastAttemptMinutesAgo)}`;
    }

    if (!els.emailDeliveryCenterRows) return;

    els.emailDeliveryCenterRows.replaceChildren();

    if (!rows.length) {
      emptyRow(els.emailDeliveryCenterRows, 5, "Nincs email delivery sor a jelenlegi szurovel.");
      return;
    }

    rows.forEach((row) => {
      const status = row.report_email_status || "not_sent";
      const priority = row.deliveryPriority || status;

      const statusInfo = document.createElement("div");
      statusInfo.appendChild(statusPill(status));

      const attemptMeta = document.createElement("div");
      attemptMeta.className = "subtle";
      attemptMeta.textContent =
        `${Number(row.report_email_attempts || 0)} probalkozas, utolso: ${relativeMinutes(row.lastAttemptMinutesAgo)}`;
      statusInfo.appendChild(attemptMeta);

      const providerInfo = document.createElement("div");
      const provider = document.createElement("div");
      provider.textContent = `Provider: ${text(row.report_email_provider_id)}`;

      const error = document.createElement("div");
      error.className = "subtle";
      error.textContent = compact(row.report_email_error || row.error_message, 160);

      providerInfo.append(provider, error);

      const tr = document.createElement("tr");
      tr.append(
        cell(statusPill(priority)),
        cell(personBlock(row)),
        cell(statusInfo),
        cell(providerInfo),
        cell(actions(row, true, true))
      );

      els.emailDeliveryCenterRows.appendChild(tr);
    });
  }

  function renderDeliverabilityList(target, items, emptyMessage, renderItem) {
    if (!target) return;

    target.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "engine-empty";
      empty.textContent = emptyMessage;
      target.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "engine-list-row";
      renderItem(row, item);
      target.appendChild(row);
    });
  }

  function renderEmailDeliverability(data = {}) {
    data = data || {};
    const metrics = data.metrics || {};
    const config = data.config || {};
    const windowData = data.window || {};
    const level = data.level || "unknown";

    if (els.emailDeliverabilityLevel) {
      els.emailDeliverabilityLevel.replaceChildren(statusPill(level));
    }

    if (els.emailDeliverabilityWindow) {
      els.emailDeliverabilityWindow.textContent =
        `${Number(windowData.hours || 0)} oras ablak, retry limit: ${Number(windowData.maxRetryAttempts || 0)}`;
    }

    if (els.emailDeliverabilitySuccessRate) {
      els.emailDeliverabilitySuccessRate.textContent = formatPercent(metrics.successRate);
    }

    if (els.emailDeliverabilityAttempted) {
      els.emailDeliverabilityAttempted.textContent =
        `${Number(metrics.attemptedCount || 0)} probalkozas, ${Number(metrics.sentCount || 0)} sikeres`;
    }

    if (els.emailDeliverabilityFailureRate) {
      els.emailDeliverabilityFailureRate.textContent = formatPercent(metrics.failureRate);
    }

    if (els.emailDeliverabilityFailures) {
      els.emailDeliverabilityFailures.textContent =
        `${Number(metrics.failedCount || 0)} hibas, ${Number(metrics.retryableCount || 0)} ujraprobalhato`;
    }

    if (els.emailDeliverabilityStale) {
      els.emailDeliverabilityStale.textContent = Number(metrics.staleSendingCount || 0);
    }

    if (els.emailDeliverabilityProviderCoverage) {
      els.emailDeliverabilityProviderCoverage.textContent = formatPercent(metrics.providerIdCoverage);
    }

    if (els.emailDeliverabilityProviderMeta) {
      els.emailDeliverabilityProviderMeta.textContent =
        `${Number(metrics.sentWithProviderIdCount || 0)} / ${Number(metrics.sentCount || 0)} sent email provider id-val`;
    }

    if (els.emailDeliverabilityConfig) {
      const configOk = config.resendConfigured && config.fromConfigured && config.fromLooksValid;
      els.emailDeliverabilityConfig.replaceChildren(statusPill(configOk ? "ok" : "critical"));
    }

    if (els.emailDeliverabilityConfigMeta) {
      els.emailDeliverabilityConfigMeta.textContent =
        `Resend: ${yesNo(config.resendConfigured)}, from domain: ${text(config.fromDomain)}`;
    }

    renderDeliverabilityList(
      els.emailDeliverabilityErrorRows,
      data.topErrors || [],
      "Nincs friss email hibaminta.",
      (row, item) => {
        const main = document.createElement("strong");
        main.textContent = compact(item.error, 120);

        const meta = document.createElement("span");
        meta.textContent =
          `${Number(item.count || 0)}x, utolso: ${relativeMinutes(item.lastSeenMinutesAgo)}`;

        row.append(main, meta);
      }
    );

    renderDeliverabilityList(
      els.emailDeliverabilityRecommendationRows,
      data.recommendations || [],
      "Nincs deliverability javaslat.",
      (row, item) => {
        const main = document.createElement("strong");
        main.textContent = compact(item, 170);
        row.appendChild(main);
      }
    );
  }

  function renderPostPaymentMonitoring(data = {}) {
    data = data || {};
    const metrics = data.metrics || {};
    const windowData = data.window || {};
    const timestamps = data.timestamps || {};
    const level = data.level || "unknown";
    const webhookIssues =
      Number(metrics.noProcessedWebhook || 0) +
      Number(metrics.failedWebhooks || 0) +
      Number(metrics.staleWebhooks || 0);
    const analysisIssues =
      Number(metrics.paidFailedSessions || 0) +
      Number(metrics.paidWithoutActiveJob || 0) +
      Number(metrics.analysisPending || 0) +
      Number(metrics.staleQueuedSessions || 0) +
      Number(metrics.staleProcessingSessions || 0) +
      Number(metrics.staleProcessingJobs || 0);
    const emailIssues =
      Number(metrics.failedEmails || 0) +
      Number(metrics.unsentDoneReports || 0) +
      Number(metrics.staleSendingEmails || 0) +
      Number(metrics.retryLimitEmails || 0);

    if (els.postPaymentLevel) {
      els.postPaymentLevel.replaceChildren(statusPill(level));
    }

    if (els.postPaymentSummary) {
      els.postPaymentSummary.textContent =
        `${Number(metrics.analysisDone || 0)} kesz elemzes, ${formatPercent(metrics.completionRate)} completion, ${formatPercent(metrics.emailSentRate)} email sent rate.`;
    }

    if (els.postPaymentWindow) {
      els.postPaymentWindow.textContent =
        `${Number(windowData.hours || 0)} oras ablak, frissitve: ${formatDate(data.generatedAt)}`;
    }

    if (els.postPaymentPaid) {
      els.postPaymentPaid.textContent = Number(metrics.paidSessions || 0);
    }

    if (els.postPaymentPaidMeta) {
      els.postPaymentPaidMeta.textContent =
        `Utolsó fizetes: ${relativeMinutes(timestamps.lastPaidMinutesAgo)}`;
    }

    if (els.postPaymentWebhookIssues) {
      els.postPaymentWebhookIssues.textContent = webhookIssues;
    }

    if (els.postPaymentWebhookMeta) {
      els.postPaymentWebhookMeta.textContent =
        `${Number(metrics.noProcessedWebhook || 0)} nincs processed webhook, ${Number(metrics.failedWebhooks || 0)} failed webhook.`;
    }

    if (els.postPaymentAnalysisIssues) {
      els.postPaymentAnalysisIssues.textContent = analysisIssues;
    }

    if (els.postPaymentAnalysisMeta) {
      els.postPaymentAnalysisMeta.textContent =
        `${Number(metrics.analysisPending || 0)} pending, ${Number(metrics.analysisQueued || 0)} queued, ${Number(metrics.analysisProcessing || 0)} processing, ${Number(metrics.paidFailedSessions || 0)} failed.`;
    }

    if (els.postPaymentEmailIssues) {
      els.postPaymentEmailIssues.textContent = emailIssues;
    }

    if (els.postPaymentEmailMeta) {
      els.postPaymentEmailMeta.textContent =
        `${Number(metrics.failedEmails || 0)} failed, ${Number(metrics.unsentDoneReports || 0)} not_sent, ${Number(metrics.retryableEmails || 0)} retryable.`;
    }

    renderDeliverabilityList(
      els.postPaymentStageRows,
      data.stages || [],
      "Nincs post-payment szakaszadat.",
      (row, item) => {
        const main = document.createElement("strong");
        main.textContent = `${text(item.label)}: ${statusLabel(item.level)}`;

        const meta = document.createElement("span");
        meta.textContent = `${Number(item.count || 0)} jelzes - ${compact(item.detail, 130)}`;

        row.append(main, meta);
      }
    );

    renderDeliverabilityList(
      els.postPaymentRecommendationRows,
      data.recommendations || [],
      "Nincs post-payment teendo.",
      (row, item) => {
        const main = document.createElement("strong");
        main.textContent = compact(item, 170);
        row.appendChild(main);
      }
    );

    if (!els.postPaymentIssueRows) return;
    els.postPaymentIssueRows.replaceChildren();

    const issues = data.issues || [];
    if (!issues.length) {
      emptyRow(els.postPaymentIssueRows, 5, "Nincs post-payment teendo.");
      return;
    }

    issues.forEach((row) => {
      const detail = document.createElement("div");
      const issueType = document.createElement("div");
      issueType.className = "person";
      issueType.textContent = text(row.issueType);

      const issueDetail = document.createElement("div");
      issueDetail.className = "subtle";
      issueDetail.textContent = compact(row.detail, 150);

      detail.append(issueType, issueDetail);

      const age = document.createElement("div");
      age.textContent = relativeMinutes(row.ageMinutes);

      const ageMeta = document.createElement("div");
      ageMeta.className = "subtle";
      ageMeta.textContent = `email=${text(row.report_email_status)} analysis=${text(row.analysis_status)}`;
      age.appendChild(ageMeta);

      const tr = document.createElement("tr");
      tr.append(
        cell(statusPill(row.severity)),
        cell(personBlock(row)),
        cell(detail),
        cell(age),
        cell(actions(row, true, true))
      );

      els.postPaymentIssueRows.appendChild(tr);
    });
  }

  function renderWebflowEmbedManager(data = {}) {
    data = data || {};
    const summary = data.summary || {};
    const embeds = Array.isArray(data.embeds) ? data.embeds : [];

    if (els.webflowEmbedGeneratedAt) {
      els.webflowEmbedGeneratedAt.textContent =
        data.generatedAt
          ? `Frissitve: ${formatDate(data.generatedAt)}`
          : "Meg nincs embed allapotkep";
    }

    if (els.webflowEmbedTotal) {
      els.webflowEmbedTotal.textContent = Number(summary.total || embeds.length || 0);
    }

    if (els.webflowEmbedReadyMeta) {
      els.webflowEmbedReadyMeta.textContent =
        `Ready: ${Number(summary.ready || 0)}, limit feletti snippet: ${Number(summary.overLimitSnippets || 0)}`;
    }

    if (els.webflowEmbedLoaders) {
      els.webflowEmbedLoaders.textContent = Number(summary.loaders || 0);
    }

    if (els.webflowEmbedLimit) {
      els.webflowEmbedLimit.textContent =
        Number(data.webflowEmbedCharacterLimit || 50000).toLocaleString("hu-HU");
    }

    if (!els.webflowEmbedRows) return;
    els.webflowEmbedRows.replaceChildren();

    if (!embeds.length) {
      const empty = document.createElement("div");
      empty.className = "empty-detail";
      empty.textContent = "Add meg az admin tokent, majd frissits a Webflow embed allapotkephez.";
      els.webflowEmbedRows.appendChild(empty);
      return;
    }

    embeds.forEach((item) => {
      const card = document.createElement("article");
      card.className = "embed-card";

      const head = document.createElement("div");
      head.className = "embed-card-head";

      const titleWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = text(item.label);

      const meta = document.createElement("p");
      meta.textContent =
        `${text(item.type)} - ${text(item.placement)} - ${compact(item.note, 150)}`;

      titleWrap.append(title, meta);
      head.append(titleWrap, statusPill(item.ready ? "ready" : "blocked"));

      const details = document.createElement("div");
      details.className = "embed-meta";
      details.append(
        summaryChip("Forras", item.source?.path || "-"),
        summaryChip("Forras karakter", Number(item.source?.characters || 0).toLocaleString("hu-HU")),
        summaryChip("Snippet karakter", Number(item.snippet?.characters || 0).toLocaleString("hu-HU")),
        summaryChip("Verzio", item.version || "-")
      );

      const code = document.createElement("textarea");
      code.className = "embed-code";
      code.readOnly = true;
      code.value = item.copyCode || "";

      const actionRow = document.createElement("div");
      actionRow.className = "embed-actions";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "secondary";
      copyButton.dataset.copyCode = item.copyCode || "";
      copyButton.textContent = "Kod masolasa";

      const publicLink = document.createElement("span");
      publicLink.className = "snapshot-time";
      publicLink.textContent = item.publicUrl || "Nincs publikus URL";

      actionRow.append(copyButton, publicLink);
      card.append(head, details, code, actionRow);
      els.webflowEmbedRows.appendChild(card);
    });
  }

  function renderOperationLogRows(items) {
    els.operationsLogRows.replaceChildren();

    if (!items.length) {
      emptyRow(els.operationsLogRows, 5, "Nincs naplo esemeny.");
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      const session = document.createElement("div");

      if (item.sessionId) {
        const link = document.createElement("button");
        link.type = "button";
        link.className = "link-button";
        link.dataset.action = "detail";
        link.dataset.id = item.sessionId;
        link.dataset.sessionId = item.sessionId;
        link.textContent = item.sessionId;
        session.appendChild(link);
      } else {
        session.textContent = "-";
      }

      const person = document.createElement("div");
      person.className = "subtle";
      person.textContent =
        [item.name, item.email].filter(Boolean).join(" / ") || "-";
      session.appendChild(person);

      const detail = document.createElement("div");
      const title = document.createElement("div");
      title.className = "person";
      title.textContent = text(item.title);

      const desc = document.createElement("div");
      desc.className = "subtle";
      desc.textContent = compact(item.detail, 180);
      detail.append(title, desc);

      tr.append(
        cell(formatDate(item.createdAt)),
        cell(statusPill(item.kind)),
        cell(statusPill(item.severity || item.status)),
        cell(session),
        cell(detail)
      );

      els.operationsLogRows.appendChild(tr);
    });
  }

  function renderAlertRows(items) {
    els.alertRows.replaceChildren();

    if (!items.length) {
      emptyRow(els.alertRows, 5, "Még nincs proaktív riasztás.");
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      const summary = document.createElement("div");

      const title = document.createElement("div");
      title.className = "person";
      title.textContent = compact(item.summary, 140);

      const key = document.createElement("div");
      key.className = "subtle";
      key.textContent = item.alert_key || "-";

      summary.append(title, key);

      tr.append(
        cell(formatDate(item.created_at)),
        cell(statusPill(item.level)),
        cell(statusPill(item.status)),
        cell(summary),
        cell(compact(item.sent_to || item.error_message || "-", 120))
      );

      els.alertRows.appendChild(tr);
    });
  }

  function renderOperationalAlertSnapshot(snapshot) {
    if (!els.operationalAlertLevel) return;

    if (!snapshot) {
      els.operationalAlertLevel.textContent = "-";
      els.operationalAlertSummary.textContent = "Még nincs operational snapshot.";
      els.operationalAlertWindow.textContent = "-";
      els.operationalAlertMetrics.textContent = "Post-payment / email / health egyben.";
      return;
    }

    const metrics = snapshot.metrics || {};
    const issues = snapshot.issues || [];
    const firstIssue = issues[0] || null;

    els.operationalAlertLevel.textContent = statusLabel(snapshot.level || "healthy");
    els.operationalAlertSummary.textContent = firstIssue
      ? `${firstIssue.label}: ${firstIssue.count} (${firstIssue.level})`
      : "Nincs threshold feletti operational gond.";
    els.operationalAlertWindow.textContent = `${Number(snapshot.window?.hours || 0)} óra`;
    els.operationalAlertMetrics.textContent =
      `post-payment: ${Number(metrics.postPaymentIssueCount || 0)}, ` +
      `email hiba: ${Number(metrics.emailFailedCount || 0)}, ` +
      `retry limit: ${Number(metrics.emailRetryLimitCount || 0)}, ` +
      `webhook 24h: ${Number(metrics.failedWebhooks24h || 0)}`;
  }

  function renderCounts(counts = {}) {
    els.queuedCount.textContent = Number(counts.queued || 0);
    els.processingCount.textContent = Number(counts.processing || 0);
    els.failedCount.textContent = Number(counts.failed || 0);
    els.doneCount.textContent = Number(counts.completed || counts.done || 0);
  }

  function countValue(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function formatPercent(value) {
    if (value === null || value === undefined || value === "") return "-";
    const number = Number(value);
    return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "-";
  }

  function setPulseCard(card, level, title, detail) {
    if (!card) return;

    card.className = `pulse-card ${statusClass(level)}`;

    const titleEl = card.querySelector("strong");
    const detailEl = card.querySelector("p");

    if (titleEl) titleEl.textContent = title;
    if (detailEl) detailEl.textContent = detail;
  }

  function renderControlPulse(context = null) {
    if (!els.controlPulseUpdatedAt) return;

    if (!context) {
      els.controlPulseUpdatedAt.textContent = "Admin tokenre var";
      setPulseCard(els.pulseCheckout, "waiting", "-", "Add meg az admin tokent.");
      setPulseCard(els.pulseWorker, "waiting", "-", "Add meg az admin tokent.");
      setPulseCard(els.pulseEmail, "waiting", "-", "Add meg az admin tokent.");
      setPulseCard(els.pulseEngine, "waiting", "-", "Add meg az admin tokent.");
      setPulseCard(els.pulseAlerts, "waiting", "-", "Add meg az admin tokent.");
      return;
    }

    const {
      health,
      queue,
      alerts,
      engineAnalytics,
      engineDecisionAudit,
      bankQualityAudit,
      emailDeliverability,
      postPaymentMonitoring
    } = context;

    const queueCounts = queue?.counts || {};
    const healthMetrics = health?.metrics || {};
    const sessions = health?.sessions || {};
    const email = health?.email || {};
    const latestAlert = alerts?.items?.[0] || null;
    const operationalAlert = alerts?.operational || null;
    const auditSummary = engineDecisionAudit?.summary || {};
    const bankQualitySummary = bankQualityAudit?.summary || {};
    const engineReviewCount = countValue(engineAnalytics?.reviewQueue?.length);
    const deliverabilityMetrics = emailDeliverability?.metrics || {};

    const paidWithoutJobCount = countValue(sessions.paidWithoutActiveJob?.length);
    const queuedCount = countValue(queueCounts.queued);
    const processingCount = countValue(queueCounts.processing);
    const failedQueueCount = countValue(queueCounts.failed);
    const staleProcessingCount = countValue(healthMetrics.staleProcessingJobs);

    const checkoutLevel = paidWithoutJobCount > 0
      ? "critical"
      : processingCount > 0 || queuedCount > 0
        ? "active"
        : "healthy";
    setPulseCard(
      els.pulseCheckout,
      checkoutLevel,
      paidWithoutJobCount > 0 ? `${paidWithoutJobCount} gond` : `${queuedCount + processingCount} aktiv`,
      paidWithoutJobCount > 0
        ? "Fizetett session aktiv job nelkul."
        : `${queuedCount} varakozik, ${processingCount} feldolgozas alatt.`
    );

    const workerLevel = staleProcessingCount > 0
      ? "critical"
      : failedQueueCount > 0
        ? "warning"
        : queuedCount > 0 || processingCount > 0
          ? "active"
          : "healthy";
    setPulseCard(
      els.pulseWorker,
      workerLevel,
      staleProcessingCount > 0 ? `${staleProcessingCount} beragadt` : `${failedQueueCount} hiba`,
      staleProcessingCount > 0
        ? "Processing lock 15 percnel regebbi."
        : `${failedQueueCount} hibas job, ${queuedCount} varakozo job.`
    );

    const retryLimitCount = countValue(email.retryLimitCount);
    const failedEmailCount = countValue(email.failedCount);
    const retryableEmailCount = countValue(email.retryableCount);
    const staleEmailCount = countValue(deliverabilityMetrics.staleSendingCount);
    const emailLevel = retryLimitCount > 0 || staleEmailCount > 0
      ? "critical"
      : failedEmailCount > 0 || retryableEmailCount > 0
        ? "warning"
        : "healthy";
    setPulseCard(
      els.pulseEmail,
      emailLevel,
      retryLimitCount > 0 ? `${retryLimitCount} limit` : `${failedEmailCount} hiba`,
      `${retryableEmailCount} ujraprobalhato, ${staleEmailCount} beragadt sending.`
    );

    const criticalEngineCount = countValue(auditSummary.criticalSessions);
    const criticalBankIssueCount = countValue(bankQualitySummary.issueCounts?.critical);
    const warningBankIssueCount = countValue(bankQualitySummary.issueCounts?.warning);
    const reviewBankIssueCount = countValue(bankQualitySummary.issueCounts?.review);
    const reviewEngineCount =
      countValue(auditSummary.reviewSessions) + engineReviewCount + warningBankIssueCount + reviewBankIssueCount;
    const engineLevel = criticalEngineCount > 0 || criticalBankIssueCount > 0
      ? "critical"
      : reviewEngineCount > 0
        ? "warning"
        : "healthy";
    const auditedEngineCount = countValue(
      auditSummary.auditedSessions ?? auditSummary.auditableSessions
    );

    setPulseCard(
      els.pulseEngine,
      engineLevel,
      criticalEngineCount + criticalBankIssueCount > 0
        ? `${criticalEngineCount + criticalBankIssueCount} kritikus`
        : `${reviewEngineCount} atnezes`,
      `${auditedEngineCount} auditolt session, ${engineReviewCount} review queue, bank score ${bankQualitySummary.averageScore ?? "-"}.`
    );

    const alertLevel = operationalAlert?.level || latestAlert?.level || "healthy";
    const operationalIssue = operationalAlert?.issues?.[0] || null;
    setPulseCard(
      els.pulseAlerts,
      alertLevel,
      statusLabel(alertLevel),
      operationalIssue
        ? compact(`${operationalIssue.label}: ${operationalIssue.count}`, 86)
        : latestAlert
          ? compact(latestAlert.summary || latestAlert.alert_key, 86)
          : "Nincs friss proaktiv riasztas."
    );

    els.controlPulseUpdatedAt.textContent = health?.generatedAt
      ? `Pulzus: ${formatDate(health.generatedAt)}`
      : "Pulzus frissitve";
  }

  function renderEngineBars(target, items = []) {
    if (!target) return;

    target.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "engine-empty";
      empty.textContent = "Nincs megjelenitheto engine adat.";
      target.appendChild(empty);
      return;
    }

    const max = Math.max(...items.map((item) => Number(item.count || 0)), 1);

    items.slice(0, 8).forEach((item) => {
      const row = document.createElement("div");
      row.className = "engine-bar-row";

      const label = document.createElement("span");
      label.textContent = item.key;

      const count = document.createElement("strong");
      count.textContent = String(Number(item.count || 0));

      const bar = document.createElement("div");
      bar.className = "engine-bar";
      const fill = document.createElement("i");
      fill.style.width = `${Math.max(6, (Number(item.count || 0) / max) * 100)}%`;
      bar.appendChild(fill);

      row.append(label, count, bar);
      target.appendChild(row);
    });
  }

  function renderEngineList(target, items = [], formatter) {
    if (!target) return;

    target.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "engine-empty";
      empty.textContent = "Nincs megjelenitheto adat.";
      target.appendChild(empty);
      return;
    }

    items.slice(0, 8).forEach((item) => {
      const row = document.createElement("div");
      row.className = "engine-list-row";

      const title = document.createElement("strong");
      const meta = document.createElement("span");
      const formatted = formatter(item);

      title.textContent = formatted.title;
      meta.textContent = formatted.meta;
      row.append(title, meta);
      target.appendChild(row);
    });
  }

  function renderEngineReviewRows(items = []) {
    if (!els.engineReviewRows) return;

    els.engineReviewRows.replaceChildren();

    if (!items.length) {
      emptyRow(els.engineReviewRows, 5, "Nincs ellenorzest igenylo engine dontes.");
      return;
    }

    items.forEach((row) => {
      const tr = document.createElement("tr");

      const engineDecision = document.createElement("div");
      const primary = document.createElement("div");
      primary.textContent = `Fo: ${text(row.primaryDomain)}`;
      const secondary = document.createElement("div");
      secondary.className = "subtle";
      secondary.textContent = `Masodlagos: ${text(row.secondaryDomain)}`;
      const pattern = document.createElement("div");
      pattern.className = "subtle";
      pattern.textContent = `${enginePatternLabel(row.patternType)} / extra: ${yesNo(row.shouldAskExtra)}`;
      engineDecision.append(primary, secondary, pattern);

      const confidence = document.createElement("div");
      const confidenceValue = document.createElement("div");
      confidenceValue.textContent = `${decisionQualityLabel(row.confidenceLabel)} (${formatNumber(row.confidence)})`;
      const scoreGap = document.createElement("div");
      scoreGap.className = "subtle";
      scoreGap.textContent = `gap: ${formatNumber(row.scoreGap)} overlap: ${formatNumber(row.overlapScore)}`;
      confidence.append(confidenceValue, scoreGap);

      tr.append(
        cell(statusPill(row.decisionQuality || "unknown")),
        cell(personBlock(row)),
        cell(engineDecision),
        cell(confidence),
        cell(actions(row, false))
      );

      els.engineReviewRows.appendChild(tr);
    });
  }

  function renderEngineAnalytics(data) {
    const metrics = data?.metrics || {};
    const distributions = data?.distributions || {};

    if (els.engineAnalyticsGeneratedAt) {
      els.engineAnalyticsGeneratedAt.textContent = data?.generatedAt
        ? `Engine allapotkep: ${formatDate(data.generatedAt)}`
        : "Meg nincs engine allapotkep";
    }

    if (els.engineAnalyticsTotal) {
      els.engineAnalyticsTotal.textContent = Number(metrics.sessionsWithEngine || 0);
    }

    if (els.engineAnalyticsWindow) {
      els.engineAnalyticsWindow.textContent =
        `${Number(data?.window?.loadedSessions || 0)} betoltott sessionbol`;
    }

    if (els.engineAnalyticsConfidence) {
      els.engineAnalyticsConfidence.textContent = formatNumber(metrics.averageConfidence);
    }

    if (els.engineAnalyticsScoreGap) {
      els.engineAnalyticsScoreGap.textContent = formatNumber(metrics.averageScoreGap);
    }

    if (els.engineAnalyticsExtraRate) {
      els.engineAnalyticsExtraRate.textContent = formatPercent(metrics.extraQuestionRate);
    }

    renderEngineBars(els.engineDomainRows, distributions.primaryDomains || []);
    renderEngineBars(els.engineQualityRows, distributions.decisionQuality || []);
    renderEngineList(
      els.engineOverlapRows,
      data?.overlapPairs || [],
      (item) => ({
        title: `${item.primaryDomain} -> ${item.secondaryDomain}`,
        meta: `${Number(item.count || 0)} session, overlap ${formatNumber(item.averageOverlap)}, confidence ${formatNumber(item.averageConfidence)}`
      })
    );
    renderEngineList(
      els.engineFocusRows,
      data?.focusAreas || [],
      (item) => ({
        title: item.key,
        meta: `${Number(item.count || 0)} elofordulas`
      })
    );
    renderEngineReviewRows(data?.reviewQueue || []);
  }

  function renderBankQualityAudit(data) {
    const summary = data?.summary || {};
    const issueCounts = summary.issueCounts || {};

    if (els.bankQualityGeneratedAt) {
      els.bankQualityGeneratedAt.textContent = data?.generatedAt
        ? `Bank audit: ${formatDate(data.generatedAt)}`
        : "Meg nincs bank audit";
    }

    if (els.bankQualityAverageScore) {
      els.bankQualityAverageScore.textContent =
        summary.averageScore === undefined ? "-" : `${formatNumber(summary.averageScore, 1)}/100`;
    }

    if (els.bankQualityCritical) {
      els.bankQualityCritical.textContent = Number(issueCounts.critical || 0);
    }

    if (els.bankQualityWarning) {
      els.bankQualityWarning.textContent = Number(issueCounts.warning || 0);
    }

    if (els.bankQualityReview) {
      els.bankQualityReview.textContent = Number(issueCounts.review || 0);
    }

    renderEngineList(
      els.bankQualityRows,
      data?.banks || [],
      (bank) => {
        const topIssue = bank.issues?.[0];
        const readiness = text(bank.readiness || "unknown");
        const score = formatNumber(bank.score, 1);
        const issueMeta = topIssue
          ? `${topIssue.severity}: ${topIssue.code}`
          : "nincs issue";

        return {
          title: `${bank.name}: ${score}/100 (${readiness})`,
          meta: `${Number(bank.items || 0)} item, public ${Number(bank.publicItems || 0)}, ${Number(bank.subdomainCount || 0)} subdomain, reverse ${formatPercent(bank.reverseRatio)} | ${issueMeta}`
        };
      }
    );
  }

  function renderEngineDecisionAudit(data) {
    const summary = data?.summary || {};

    if (els.engineAuditAudited) {
      els.engineAuditAudited.textContent = Number(
        summary.auditedSessions ?? summary.auditableSessions ?? 0
      );
    }

    if (els.engineAuditReview) {
      els.engineAuditReview.textContent = Number(summary.reviewSessions || 0);
    }

    if (els.engineAuditReviewMeta) {
      els.engineAuditReviewMeta.textContent =
        `${Number(summary.criticalSessions || 0)} kritikus, ${Number(summary.warningSessions || 0)} figyelendő`;
    }

    if (els.engineAuditReviewMeta) {
      const skipped = Number(
        summary.skippedLegacySessions ||
        summary.skippedSessions ||
        summary.nonAuditableSessions ||
        0
      );
      const skippedText = skipped ? `, ${skipped} legacy kihagyva` : "";
      els.engineAuditReviewMeta.textContent =
        `${Number(summary.criticalSessions || 0)} kritikus, ${Number(summary.warningSessions || 0)} figyelendo${skippedText}`;
    }

    if (els.engineAuditPrimaryMismatch) {
      els.engineAuditPrimaryMismatch.textContent = Number(summary.primaryMismatchCount || 0);
    }

    if (els.engineAuditExtraMismatch) {
      els.engineAuditExtraMismatch.textContent = Number(summary.extraMismatchCount || 0);
    }

    if (!els.engineDecisionAuditRows) return;
    els.engineDecisionAuditRows.replaceChildren();

    const rows = data?.reviewQueue || [];

    if (!rows.length) {
      emptyRow(els.engineDecisionAuditRows, 6, "Nincs atnezesre varo engine dontesi audit eltérés.");
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const session = document.createElement("div");
      const id = document.createElement("div");
      id.textContent = row.shortId || row.id || "-";
      const meta = document.createElement("div");
      meta.className = "subtle";
      meta.textContent = `${text(row.lang)} · ${formatDate(row.createdAt)}`;
      session.append(id, meta);

      const stored = document.createElement("div");
      const storedPrimary = document.createElement("div");
      storedPrimary.textContent = `Fő: ${text(row.stored?.primaryDomain)}`;
      const storedExtra = document.createElement("div");
      storedExtra.className = "subtle";
      storedExtra.textContent = `extra: ${yesNo(row.stored?.askedExtra)} · ${Number(row.stored?.specificQuestionCount || 0)} specifikus`;
      stored.append(storedPrimary, storedExtra);

      const engine = document.createElement("div");
      const enginePrimary = document.createElement("div");
      enginePrimary.textContent = `Fő: ${text(row.engine?.primaryDomain)}`;
      const engineMeta = document.createElement("div");
      engineMeta.className = "subtle";
      engineMeta.textContent =
        `extra: ${yesNo(row.engine?.shouldAskExtra)} · conf: ${formatNumber(row.engine?.confidence)} · gap: ${formatNumber(row.engine?.scoreGap)}`;
      engine.append(enginePrimary, engineMeta);

      const issue = document.createElement("div");
      const firstIssue = row.issues?.[0];
      issue.textContent = firstIssue?.label || "Audit eltérés";
      const issueDetail = document.createElement("div");
      issueDetail.className = "subtle";
      issueDetail.textContent = firstIssue?.detail || (row.issueCodes || []).join(", ");
      issue.appendChild(issueDetail);

      tr.append(
        cell(statusPill(row.issueLevel || "unknown")),
        cell(session),
        cell(stored),
        cell(engine),
        cell(issue),
        cell(actions(row, false))
      );

      els.engineDecisionAuditRows.appendChild(tr);
    });
  }

  function stageLevel({ critical = 0, warning = 0, active = 0 }) {
    if (critical > 0) return "critical";
    if (warning > 0) return "warning";
    if (active > 0) return "active";
    return "healthy";
  }

  function stageLabel(level) {
    if (level === "critical") return "Beavatkozás kell";
    if (level === "warning") return "Figyelendő";
    if (level === "active") return "Fut";
    return "Rendben";
  }

  function buildPipelineStages(health, queue) {
    const metrics = health?.metrics || {};
    const jobs = health?.jobs || {};
    const webhooks = health?.webhooks || {};
    const email = health?.email || {};
    const sessions = health?.sessions || {};
    const queueCounts = queue?.counts || {};

    return [
      {
        name: "Fizetés indítása",
        level: stageLevel({
          active: countValue(queueCounts.queued) + countValue(queueCounts.processing),
          warning: countValue(queueCounts.failed)
        }),
        detail: `${countValue(queueCounts.queued)} várakozik, ${countValue(queueCounts.processing)} feldolgozás alatt, ${countValue(queueCounts.failed)} hibás`
      },
      {
        name: "Stripe webhook",
        level: stageLevel({
          critical: countValue(webhooks.failedLast24h),
          active: countValue(webhooks.pendingOrProcessing)
        }),
        detail: `${countValue(webhooks.failedLast24h)} hiba 24 órában, ${countValue(webhooks.pendingOrProcessing)} függőben`
      },
      {
        name: "Worker elemzés",
        level: stageLevel({
          critical: countValue(metrics.staleProcessingJobs),
          warning: countValue(jobs.counts?.failed) + countValue(metrics.paidFailedSessions),
          active: countValue(jobs.counts?.queued) + countValue(jobs.counts?.processing)
        }),
        detail: `${countValue(jobs.counts?.queued)} várakozó job, ${countValue(metrics.staleProcessingJobs)} beragadt lock`
      },
      {
        name: "PDF/riport",
        level: stageLevel({
          warning: countValue(sessions.doneWithoutAnalysisResult?.length)
        }),
        detail: `${countValue(sessions.doneWithoutAnalysisResult?.length)} kész session riportszöveg nélkül`
      },
      {
        name: "Email kézbesítés",
        level: stageLevel({
          critical: countValue(email.failedCount) + countValue(email.retryLimitCount),
          warning: countValue(email.unsentDoneCount),
          active: countValue(email.retryableCount)
        }),
        detail: `${countValue(email.failedCount)} hibás, ${countValue(email.retryableCount)} újrapróbálható, ${countValue(email.retryLimitCount)} limitnél`
      }
    ];
  }

  function renderPipelineStages(health, queue) {
    els.pipelineStages.replaceChildren();

    const stages = buildPipelineStages(health, queue);

    stages.forEach((stage, index) => {
      const card = document.createElement("article");
      card.className = `pipeline-stage ${stage.level}`;

      const number = document.createElement("span");
      number.className = "stage-number";
      number.textContent = String(index + 1);

      const body = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = stage.name;

      const detail = document.createElement("p");
      detail.textContent = stage.detail;

      body.append(title, detail);

      const pill = statusPill(stageLabel(stage.level));
      pill.classList.add(stage.level);

      card.append(number, body, pill);
      els.pipelineStages.appendChild(card);
    });
  }

  function renderLaunchReadiness(readiness) {
    if (
      !els.launchReadinessLevel ||
      !els.launchReadinessSummary ||
      !els.launchReadinessGeneratedAt ||
      !els.launchReadinessChecks ||
      !els.launchManualChecks
    ) {
      return;
    }

    const level = readiness?.level || "unknown";
    const summary = readiness?.summary || {};

    els.launchReadinessLevel.className = `launch-score ${statusClass(level)}`;
    els.launchReadinessLevel.querySelector("strong").textContent =
      statusLabel(level).toUpperCase();

    if (readiness?.ok) {
      els.launchReadinessSummary.textContent =
        `${Number(summary.passed || 0)}/${Number(summary.total || 0)} ellenőrzés rendben, ` +
        `${Number(summary.warnings || 0)} figyelmeztetés, ${Number(summary.failed || 0)} blokkoló hiba.`;
      els.launchReadinessGeneratedAt.textContent =
        readiness.generatedAt ? `Ellenőrizve: ${formatDate(readiness.generatedAt)}` : "-";
    } else {
      els.launchReadinessSummary.textContent = "Add meg az admin tokent, majd frissíts.";
      els.launchReadinessGeneratedAt.textContent = "Még nincs ellenőrzés.";
    }

    els.launchReadinessChecks.replaceChildren();
    const checks = readiness?.checks || [];

    if (!checks.length) {
      const empty = document.createElement("div");
      empty.className = "launch-empty";
      empty.textContent = "A launch checklist betöltéséhez frissíts admin tokennel.";
      els.launchReadinessChecks.appendChild(empty);
    }

    checks.forEach((check) => {
      const item = document.createElement("article");
      item.className = `launch-check ${statusClass(check.status)}`;

      const head = document.createElement("div");
      head.className = "launch-check-head";

      const titleWrap = document.createElement("div");
      const group = document.createElement("span");
      group.className = "launch-group";
      group.textContent = check.group || "Ellenőrzés";

      const title = document.createElement("h3");
      title.textContent = check.label || check.id || "Launch check";

      titleWrap.append(group, title);
      head.append(titleWrap, statusPill(check.status));

      const detail = document.createElement("p");
      detail.textContent = check.detail || "-";

      item.append(head, detail);

      if (check.action) {
        const action = document.createElement("strong");
        action.className = "launch-action";
        action.textContent = check.action;
        item.appendChild(action);
      }

      els.launchReadinessChecks.appendChild(item);
    });

    els.launchManualChecks.replaceChildren();
    const manualChecks = readiness?.manualChecks || [];

    if (!manualChecks.length) {
      const li = document.createElement("li");
      li.textContent = "A kézi élesítési kontrollok az ellenőrzés után jelennek meg.";
      els.launchManualChecks.appendChild(li);
      return;
    }

    manualChecks.forEach((check) => {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = check.label || "Kézi kontroll";
      const span = document.createElement("span");
      span.textContent = check.detail || "";
      li.append(strong, span);
      els.launchManualChecks.appendChild(li);
    });
  }

  function renderControlCenter(status, health, queue, alerts) {
    const level = health?.level || "unknown";
    const recommendations = health?.recommendations || [];
    const issues = [
      countValue(health?.metrics?.staleProcessingJobs),
      countValue(health?.metrics?.failedJobs),
      countValue(health?.metrics?.failedWebhooks24h),
      countValue(health?.metrics?.failedReportEmails),
      countValue(health?.metrics?.retryLimitReportEmails)
    ].reduce((sum, value) => sum + value, 0);

    const levelText = level === "healthy"
      ? "A fő rendszerek rendben vannak"
      : level === "active"
        ? "A folyamat aktív"
        : level === "warning"
          ? "Operátori ellenőrzés javasolt"
          : level === "critical"
            ? "Beavatkozás szükséges"
            : "Éles adatokra vár";

    els.controlCenterHeadline.textContent = levelText;
    els.controlCenterSummary.textContent = status?.ok
      ? `${issues} kritikus jelzés. ${countValue(queue?.counts?.queued)} várakozó, ${countValue(queue?.counts?.processing)} feldolgozás alatti, ${countValue(queue?.counts?.failed)} hibás session.`
      : "Az Admin API nem érhető el a jelenlegi tokennel.";

    els.controlScore.className = `control-score ${statusClass(level)}`;
    els.controlScore.querySelector("strong").textContent = statusLabel(level).toUpperCase();

    els.lastSnapshotAt.textContent = health?.generatedAt
      ? `Állapotkép: ${formatDate(health.generatedAt)}`
      : "Még nincs állapotkép";

    els.riskFocus.textContent = alerts?.items?.length
      ? compact(alerts.items[0].summary, 100)
      : recommendations[0] || "Nincs aktuális éles rendszerkockázat.";

    els.nextAction.textContent = recommendations[0] || "Figyeld tovább a rendszert. Jelenleg nincs javasolt kézi teendő.";

    renderPipelineStages(health, queue);
  }

  function renderHealth(health) {
    const level = health?.level || "-";
    const healthMetric = els.healthLevel.closest(".metric");

    els.healthLevel.textContent = statusLabel(level);
    healthMetric.classList.remove("healthy", "active", "warning", "critical");
    if (["healthy", "active", "warning", "critical"].includes(level)) {
      healthMetric.classList.add(level);
    }

    els.lastJobProcessed.textContent = formatDate(health?.jobs?.lastProcessedAt);
    els.lastJobProcessedMeta.textContent =
      `Utolsó kész job: ${relativeMinutes(health?.jobs?.lastProcessedMinutesAgo)}`;

    els.oldestQueuedJob.textContent = formatDate(health?.jobs?.oldestQueuedAt);
    els.oldestQueuedJobMeta.textContent =
      `Feldolgozási sor életkor: ${relativeMinutes(health?.jobs?.oldestQueuedMinutes)}`;

    els.staleProcessingJobs.textContent =
      Number(health?.metrics?.staleProcessingJobs || 0);

    els.lastWebhook.textContent = formatDate(health?.webhooks?.lastReceivedAt);
    els.lastWebhookMeta.textContent =
      `Utolsó beérkezés: ${relativeMinutes(health?.webhooks?.lastReceivedMinutesAgo)}`;

    els.failedWebhooks24h.textContent =
      Number(health?.webhooks?.failedLast24h || 0);
    els.webhookPendingMeta.textContent =
      `Beérkezett/feldolgozás alatt: ${Number(health?.webhooks?.pendingOrProcessing || 0)}`;

    els.paidWithoutJob.textContent =
      Number(health?.sessions?.paidWithoutActiveJob?.length || 0);

    els.lastReportEmailSent.textContent = formatDate(health?.email?.lastSentAt);
    els.lastReportEmailSentMeta.textContent =
      `Utolsó küldés: ${relativeMinutes(health?.email?.lastSentMinutesAgo)}`;

    els.failedReportEmails.textContent =
      Number(health?.email?.failedCount || 0);

    els.unsentDoneReports.textContent =
      Number(health?.email?.unsentDoneCount || 0);

    els.retryableReportEmails.textContent =
      Number(health?.email?.retryableCount || 0);

    els.retryLimitReportEmails.textContent =
      Number(health?.email?.retryLimitCount || 0);

    renderEmailIssueRows(health?.email?.issues || []);

    els.healthRecommendations.replaceChildren();
    const recommendations = health?.recommendations || [
      "A frissítéshez add meg az admin tokent."
    ];

    recommendations.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      els.healthRecommendations.appendChild(li);
    });
  }

  function operatorScrollButton(label, targetId, className = "secondary") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.scrollTarget = targetId;
    button.textContent = label;
    return button;
  }

  function renderOperatorTask(task) {
    const row = document.createElement("article");
    row.className = `operator-task ${statusClass(task.level)}`;

    const head = document.createElement("div");
    head.className = "operator-task-head";

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = task.title;
    const detail = document.createElement("p");
    detail.textContent = task.detail;
    copy.append(title, detail);

    head.append(copy, statusPill(task.level));
    row.appendChild(head);

    if (task.targetId) {
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "operator-task-actions";
      actionsWrap.appendChild(operatorScrollButton(task.actionLabel || "Megnézem", task.targetId));
      row.appendChild(actionsWrap);
    }

    return row;
  }

  function renderLatestSessionCard(row) {
    if (!els.latestSessionCard) return;

    els.latestSessionCard.className = "latest-session-body";
    els.latestSessionCard.replaceChildren();

    if (!row) {
      els.latestSessionCard.classList.add("empty-detail");
      els.latestSessionCard.textContent = "Nincs legutóbbi session a jelenlegi szűrésben.";
      return;
    }

    const sessionId = getRowSessionId(row);

    const title = document.createElement("div");
    title.className = "latest-session-title";
    title.textContent = text(row.name);

    const email = document.createElement("div");
    email.className = "subtle";
    email.textContent = text(row.email);

    const statuses = document.createElement("div");
    statuses.className = "latest-session-statuses";
    statuses.append(
      statusPill(row.payment_status || "unknown"),
      statusPill(row.analysis_status || "unknown"),
      statusPill(row.report_email_status || "unknown")
    );

    const focus = document.createElement("div");
    focus.className = "latest-session-meta";
    focus.textContent =
      `Fókusz: ${text(row.detectedRisk)} · Másodlagos: ${text(row.secondaryRisk)} · Nyelv: ${text(row.lang)}`;

    const updated = document.createElement("div");
    updated.className = "latest-session-meta";
    updated.textContent = `Frissítve: ${formatDate(row.updated_at || row.created_at)}`;

    const actionWrap = document.createElement("div");
    actionWrap.className = "actions";
    actionWrap.appendChild(actionButton("Részletek", "detail", sessionId, "secondary"));
    actionWrap.appendChild(actionButton("PDF", "download-pdf", sessionId, "secondary"));

    els.latestSessionCard.append(title, email, statuses, focus, updated, actionWrap);
  }

  function addOperatorTask(tasks, level, title, detail, targetId, actionLabel) {
    const normalizedDetail =
      level === "critical" && String(title || "").startsWith("Engine live audit")
        ? detail.replace(/ vagy .+$/, ".").replace("nem egyezik", "elter")
        : detail;

    tasks.push({
      level,
      title,
      detail: normalizedDetail,
      targetId,
      actionLabel
    });
  }

  function renderOperatorFocus(context = null) {
    if (!els.operatorSummary || !els.operatorTaskRows || !els.latestSessionCard) return;

    els.operatorTaskRows.replaceChildren();

    if (!context) {
      els.operatorSummary.textContent = "Admin tokenre vár";
      const empty = document.createElement("div");
      empty.className = "operator-empty";
      empty.textContent = "Add meg az admin tokent, majd frissíts az operátori fókusz betöltéséhez.";
      els.operatorTaskRows.appendChild(empty);
      renderLatestSessionCard(null);
      return;
    }

    const {
      health,
      queue,
      alerts,
      launchReadiness,
      engineAnalytics,
      engineDecisionAudit,
      bankQualityAudit,
      emailDeliverability,
      postPaymentMonitoring,
      recent
    } = context;

    const tasks = [];
    const queueCounts = queue?.counts || {};
    const email = health?.email || {};
    const metrics = health?.metrics || {};
    const sessions = health?.sessions || {};
    const latestAlert = alerts?.items?.[0];
    const deliverabilityMetrics = emailDeliverability?.metrics || {};
    const postPaymentMetrics = postPaymentMonitoring?.metrics || {};
    const bankQualitySummary = bankQualityAudit?.summary || {};

    if (postPaymentMonitoring?.level === "critical") {
      addOperatorTask(
        tasks,
        "critical",
        "Post-payment folyamat kritikus",
        `${countValue(postPaymentMetrics.issueCount)} fizetes utani teendo, ${countValue(postPaymentMetrics.paidWithoutActiveJob)} fizetett session aktiv job nelkul, ${countValue(postPaymentMetrics.retryLimitEmails)} email retry limit.`,
        "postPaymentPanel",
        "Post-payment"
      );
    } else if (postPaymentMonitoring?.level === "warning") {
      addOperatorTask(
        tasks,
        "warning",
        "Post-payment folyamat figyelendo",
        `${countValue(postPaymentMetrics.issueCount)} fizetes utani jelzes, ${countValue(postPaymentMetrics.unsentDoneReports)} kesz riport email nelkul.`,
        "postPaymentPanel",
        "Post-payment"
      );
    }

    if (latestAlert) {
      addOperatorTask(
        tasks,
        latestAlert.level || "warning",
        "Legutóbbi proaktív riasztás",
        compact(latestAlert.summary || latestAlert.alert_key, 180),
        "alertsPanel",
        "Riasztások"
      );
    }

    if (emailDeliverability?.level === "critical") {
      addOperatorTask(
        tasks,
        "critical",
        "Email deliverability kritikus",
        `${countValue(deliverabilityMetrics.failedCount)} hibas email, ${countValue(deliverabilityMetrics.staleSendingCount)} beragadt sending, ${countValue(deliverabilityMetrics.retryLimitCount)} retry limit.`,
        "emailDeliveryPanel",
        "Email monitor"
      );
    } else if (emailDeliverability?.level === "warning") {
      addOperatorTask(
        tasks,
        "warning",
        "Email deliverability figyelendo",
        `${formatPercent(deliverabilityMetrics.failureRate)} hibaarany, ${countValue(deliverabilityMetrics.retryableCount)} ujraprobalhato email.`,
        "emailDeliveryPanel",
        "Email monitor"
      );
    }

    if (countValue(metrics.staleProcessingJobs) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Beragadt feldolgozás",
        `${countValue(metrics.staleProcessingJobs)} processing lock 15 percnél régebbi. Ellenőrizd a worker állapotát és a queue sort.`,
        "queuePanel",
        "Queue megnyitása"
      );
    }

    if (countValue(queueCounts.failed) > 0 || countValue(metrics.failedJobs) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Hibás vagy retry-ra váró elemzés",
        `${countValue(queueCounts.failed || metrics.failedJobs)} hibás queue/job jelzés. Nézd meg a hibás sessionöket és indíts célzott retry-t.`,
        "failedAnalysesPanel",
        "Hibák"
      );
    }

    if (countValue(email.retryLimitCount) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Email próbálkozási limit elérve",
        `${countValue(email.retryLimitCount)} riport email elérte a próbálkozási limitet. Kézi ellenőrzés javasolt.`,
        "emailDeliveryPanel",
        "Email panel"
      );
    }

    if (countValue(email.failedCount) > 0 || countValue(email.retryableCount) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Email kézbesítési teendő",
        `${countValue(email.failedCount)} hibás és ${countValue(email.retryableCount)} újrapróbálható riport email.`,
        "emailDeliveryPanel",
        "Email panel"
      );
    }

    if (countValue(sessions.paidWithoutActiveJob?.length) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Fizetett session aktív job nélkül",
        `${countValue(sessions.paidWithoutActiveJob?.length)} fizetett session nincs aktív feldolgozási sorhoz kötve.`,
        "healthPanel",
        "Health panel"
      );
    }

    if (countValue(engineAnalytics?.reviewQueue?.length) > 0) {
      addOperatorTask(
        tasks,
        "info",
        "Engine döntés ellenőrzendő",
        `${countValue(engineAnalytics.reviewQueue.length)} alacsony confidence vagy átfedő mintázat vár kézi átnézésre.`,
        "engineAnalyticsPanel",
        "Engine panel"
      );
    }

    const engineAuditSummary = engineDecisionAudit?.summary || {};

    if (countValue(engineAuditSummary.criticalSessions) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Engine live audit kritikus eltérés",
        `${countValue(engineAuditSummary.criticalSessions)} sessionnel nem egyezik a mentett fő döntés vagy hiányzik a döntési input.`,
        "engineAnalyticsPanel",
        "Engine audit"
      );
    } else if (countValue(engineAuditSummary.reviewSessions) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Engine live audit átnézendő",
        `${countValue(engineAuditSummary.reviewSessions)} éles sessionnél van döntési, extra kérdés vagy confidence jelzés.`,
        "engineAnalyticsPanel",
        "Engine audit"
      );
    }

    if (countValue(bankQualitySummary.issueCounts?.critical) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Bank quality kritikus issue",
        `${countValue(bankQualitySummary.issueCounts?.critical)} kritikus bankminosegi jelzes. Legalacsonyabb score: ${(bankQualitySummary.lowestScoringBanks || []).map((bank) => `${bank.name} ${bank.score}`).join(", ") || "-"}.`,
        "engineAnalyticsPanel",
        "Bank audit"
      );
    } else if (countValue(bankQualitySummary.issueCounts?.warning) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Bank quality figyelendo",
        `${countValue(bankQualitySummary.issueCounts?.warning)} warning es ${countValue(bankQualitySummary.issueCounts?.review)} review bankminosegi jelzes.`,
        "engineAnalyticsPanel",
        "Bank audit"
      );
    }

    if (countValue(launchReadiness?.summary?.failed) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Launch checklist blokkoló hiba",
        `${countValue(launchReadiness.summary.failed)} blokkoló élesítési ellenőrzés hibát jelez.`,
        "launchPanel",
        "Launch panel"
      );
    } else if (countValue(launchReadiness?.summary?.warnings) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Launch checklist figyelmeztetés",
        `${countValue(launchReadiness.summary.warnings)} élesítési figyelmeztetés maradt.`,
        "launchPanel",
        "Launch panel"
      );
    }

    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "operator-empty";
      empty.textContent = "Nincs azonnali operátori teendő. A fő rendszerfolyamatok jelenleg rendben állnak.";
      els.operatorTaskRows.appendChild(empty);
    } else {
      tasks.slice(0, 6).forEach((task) => {
        els.operatorTaskRows.appendChild(renderOperatorTask(task));
      });
    }

    const criticalCount = tasks.filter((task) => statusClass(task.level) === "critical").length;
    const warningCount = tasks.filter((task) => statusClass(task.level) === "warning").length;
    els.operatorSummary.textContent =
      tasks.length
        ? `${criticalCount} kritikus, ${warningCount} figyelendő, ${tasks.length} összes teendő`
        : "Nincs azonnali teendő";

    renderLatestSessionCard(recent?.items?.[0] || null);
  }

  async function refreshDashboard() {
    setBusy(true);
    setStatus("Frissítés...");

    try {
      const [
        status,
        health,
        queue,
        recent,
        failed,
        operations,
        alerts,
        launchReadiness,
        engineAnalytics,
        engineDecisionAudit,
        bankQualityAudit,
        emailDeliveryCenter,
        emailDeliverability,
        postPaymentMonitoring,
        webflowEmbedManager
      ] = await Promise.all([
        api("/admin/status"),
        api("/admin/production-health"),
        api("/admin/queue-status"),
        api("/admin/recent-sessions?limit=30"),
        api("/admin/failed-analyses?limit=30"),
        api(`/admin/operations-log?filter=${encodeURIComponent(activeLogFilter)}&limit=80`),
        api("/admin/alerts?limit=10"),
        api("/admin/launch-readiness"),
        api("/admin/engine-analytics?limit=300"),
        api("/admin/engine-decision-audit?limit=300"),
        api("/admin/bank-quality-audit"),
        api(`/admin/email-delivery-center?status=${encodeURIComponent(currentEmailDeliveryStatusFilter())}&limit=60`),
        api("/admin/email-deliverability?hours=168&limit=30"),
        api("/admin/post-payment-monitoring?hours=168&limit=30"),
        api("/admin/webflow-embed-manager")
      ]);

      els.apiStatus.textContent = status.ok ? "Elérhető" : "Hiba";
      renderHealth(health);
      renderCounts(queue.counts || {});
      renderSessionRows(els.queueRows, queue.items || [], "queue");
      renderSessionRows(els.recentRows, recent.items || [], "recent");
      renderSessionRows(els.failedRows, failed.items || [], "failed");
      renderOperationLogRows(operations.items || []);
      renderAlertRows(alerts.items || []);
      renderOperationalAlertSnapshot(alerts.operational || null);
      renderControlCenter(status, health, queue, alerts);
      renderLaunchReadiness(launchReadiness);
      renderEngineAnalytics(engineAnalytics);
      renderEngineDecisionAudit(engineDecisionAudit);
      renderBankQualityAudit(bankQualityAudit);
      renderEmailDeliveryCenter(emailDeliveryCenter);
      renderEmailDeliverability(emailDeliverability);
      renderPostPaymentMonitoring(postPaymentMonitoring);
      renderWebflowEmbedManager(webflowEmbedManager);
      renderControlPulse({
        health,
        queue,
        alerts,
        engineAnalytics,
        engineDecisionAudit,
        bankQualityAudit,
        emailDeliverability,
        postPaymentMonitoring
      });
      renderOperatorFocus({
        status,
        health,
        queue,
        recent,
        failed,
        operations,
        alerts,
        launchReadiness,
        engineAnalytics,
        engineDecisionAudit,
        bankQualityAudit,
        emailDeliverability,
        postPaymentMonitoring
      });
      setStatus("Frissítve.");
    } catch (error) {
      els.apiStatus.textContent = "Hiba";
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function refreshLaunchReadiness() {
    setBusy(true);
    setStatus("Élesítési ellenőrzés...");

    try {
      const launchReadiness = await api("/admin/launch-readiness");
      renderLaunchReadiness(launchReadiness);
      setStatus("Élesítési ellenőrzés frissítve.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function refreshEmailDeliveryCenter() {
    setBusy(true);
    setStatus("Email center frissitese...");

    try {
      const data = await api(
        `/admin/email-delivery-center?status=${encodeURIComponent(currentEmailDeliveryStatusFilter())}&limit=60`
      );
      renderEmailDeliveryCenter(data);
      setStatus("Email center frissitve.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function runPostPaymentRecovery() {
    await postAction(
      "/admin/post-payment-recovery",
      "Post-payment recovery v2 lefutott."
    );
  }

  async function searchSessions() {
    const query = (els.sessionSearchInput?.value || "").trim();

    if (!query) {
      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent = "Adj meg emailt, nevet, session ID-t vagy Stripe ID-t.";
      }
      emptyRow(els.sessionSearchRows, 5, "Adj meg keresési kifejezést.");
      return;
    }

    setBusy(true);
      setStatus("Session keresése...");

    try {
      const data = await api(
        `/admin/search-sessions?q=${encodeURIComponent(query)}&limit=30`
      );

      renderSessionRows(els.sessionSearchRows, data.items || [], "search");

      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent =
          `${Number(data.count || data.items?.length || 0)} találat: "${query}"`;
      }

      setStatus("Session keresés kész.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function loadSessionDetail(sessionId, options = {}) {
    if (!sessionId) {
      setStatus("Hianyzo session ID.", true);
      return;
    }

    if (options.scroll) {
      showEmptyDetail("Session betoltese...");
      scrollSessionDetailIntoView();
    }

    setBusy(true);
    setStatus("Session betöltése...");

    try {
      const data = await api(`/admin/session/${encodeURIComponent(sessionId)}`);
      if (els.sessionDetail) {
        els.sessionDetail.className = "session-detail";
        els.sessionDetail.replaceChildren(renderSessionDetail(data.session));
      }
      if (options.scroll) {
        window.requestAnimationFrame(scrollSessionDetailIntoView);
      }
      setStatus("Session betöltve.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function postAction(path, successMessage) {
    setBusy(true);
    setStatus("Művelet fut...");

    try {
      const data = await api(path, { method: "POST" });
      setStatus(successMessage || "Művelet kész.");
      showJsonDetail(data);
      scrollSessionDetailIntoView();
      await refreshDashboard();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function downloadReportPdf(sessionId) {
    setBusy(true);
    setStatus("PDF letöltése...");

    try {
      const response = await fetchAdmin(
        `/admin/session/${encodeURIComponent(sessionId)}/report-pdf`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `PDF letöltési hiba (${response.status})`);
      }

      const blob = await response.blob();
      const fallback = `neuromap-kids-report-${sessionId}.pdf`;
      const filename = filenameFromDisposition(
        response.headers.get("content-disposition"),
        fallback
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatus("PDF letöltve.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  function handleAction(action, sessionId) {
    const safeSessionId = String(sessionId || "").trim();

    if (action === "detail") {
      loadSessionDetail(safeSessionId, { scroll: true });
      return;
    }

    if (!safeSessionId) {
      setStatus("Hianyzo session ID.", true);
      return;
    }

    if (action === "retry") {
      postAction(
        `/admin/retry-analysis/${encodeURIComponent(safeSessionId)}`,
        "Elemzés újra queue-ba téve."
      );
      return;
    }

    if (action === "download-pdf") {
      downloadReportPdf(safeSessionId);
      return;
    }

    if (action === "regenerate-pdf") {
      postAction(
        `/admin/session/${encodeURIComponent(safeSessionId)}/regenerate-pdf`,
        "PDF újragenerálás ellenőrizve."
      );
      return;
    }

    if (action === "resend") {
      postAction(
        `/admin/resend-email/${encodeURIComponent(safeSessionId)}`,
        "Riport email újraküldve."
      );
      return;
    }

    if (action === "reset-email") {
      postAction(
        `/admin/reset-email-retry/${encodeURIComponent(safeSessionId)}`,
        "Email retry állapot alaphelyzetbe téve."
      );
    }
  }

  function handleActionClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    handleAction(button.dataset.action, button.dataset.sessionId || button.dataset.id);
  }

  function init() {
    const savedToken = readSavedToken();
    if (savedToken && els.token) {
      els.token.value = savedToken;
      localStorage.setItem(TOKEN_KEY, savedToken);
    }

    bindClick(els.saveTokenBtn, () => {
      const token = getToken();
      if (!token) {
        setStatus("Add meg az ADMIN_TOKEN értékét.", true);
        return;
      }

      localStorage.setItem(TOKEN_KEY, token);
      if (els.token) els.token.value = token;
      setStatus("Token mentve.");
      refreshDashboard();
    });

    bindClick(els.clearTokenBtn, () => {
      localStorage.removeItem(TOKEN_KEY);
      if (els.token) els.token.value = "";
      showEmptyDetail();
      if (els.sessionSearchInput) els.sessionSearchInput.value = "";
      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent = "Még nem indult keresés.";
      }
      emptyRow(els.sessionSearchRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.queueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.emailIssueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.emailDeliveryCenterRows, 5, "A frissiteshez add meg az admin tokent.");
      emptyRow(els.alertRows, 5, "Add meg az admin tokent.");
      emptyRow(els.operationsLogRows, 5, "A frissítéshez add meg az admin tokent.");
      renderCounts({});
      renderHealth(null);
      renderControlCenter(null, null, { counts: {} }, { items: [] });
      renderControlPulse(null);
      renderOperationalAlertSnapshot(null);
      renderLaunchReadiness(null);
      renderEngineAnalytics(null);
      renderEngineDecisionAudit(null);
      renderEmailDeliveryCenter(null);
      renderEmailDeliverability(null);
      renderPostPaymentMonitoring(null);
      renderWebflowEmbedManager(null);
      renderOperatorFocus(null);
      if (els.apiStatus) els.apiStatus.textContent = "-";
      setStatus("Token törölve.");
    });

    bindClick(els.refreshBtn, refreshDashboard);
    bindClick(els.refreshLaunchReadinessBtn, refreshLaunchReadiness);
    bindClick(els.refreshEmailDeliveryCenterBtn, refreshEmailDeliveryCenter);
    bindClick(els.sessionSearchBtn, searchSessions);
    bindClick(els.toggleOperationsLogBtn, (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleOperationsLog();
    });
    setOperationsLogCollapsed(operationsLogCollapsed);
    initCollapsibleSections();

    els.emailDeliveryStatusFilter?.addEventListener("change", refreshEmailDeliveryCenter);

    els.sessionSearchInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchSessions();
      }
    });

    bindClick(els.processOneBtn, () => {
      postAction("/admin/process-one-job", "Egy queued job feldolgozása lefutott.");
    });

    bindClick(els.retryEmailBatchBtn, () => {
      postAction("/admin/retry-report-emails", "Riport email újrapróbálás lefutott.");
    });

    bindClick(els.postPaymentRecoveryBtn, runPostPaymentRecovery);
    bindClick(els.postPaymentRecoveryPanelBtn, runPostPaymentRecovery);

    bindClick(els.alertCheckBtn, () => {
      postAction("/admin/trigger-alert-check", "Riasztásellenőrzés lefutott.");
    });

    bindClick(els.operationalAlertBtn, () => {
      postAction(
        "/admin/trigger-operational-alert-check?minLevel=warning",
        "Operational alert ellenőrzés lefutott."
      );
    });

    bindClick(els.bankQualityAlertBtn, () => {
      postAction(
        "/admin/trigger-bank-quality-alert-check?minLevel=review",
        "Bank audit riasztas lefutott."
      );
    });

    document.querySelectorAll("[data-control-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.controlAction;

        if (action === "refresh") {
          refreshDashboard();
        }

        if (action === "process-job") {
          postAction("/admin/process-one-job", "Egy várakozó job feldolgozva.");
        }

        if (action === "retry-email") {
          postAction("/admin/retry-report-emails", "Riport email újrapróbálás lefutott.");
        }

        if (action === "post-payment-recovery") {
          runPostPaymentRecovery();
        }

        if (action === "alert-check") {
          postAction("/admin/trigger-alert-check", "Riasztásellenőrzés lefutott.");
        }

        if (action === "operational-alert") {
          postAction(
            "/admin/trigger-operational-alert-check?minLevel=warning",
            "Operational alert ellenőrzés lefutott."
          );
        }

        if (action === "bank-quality-alert") {
          postAction(
            "/admin/trigger-bank-quality-alert-check?minLevel=review",
            "Bank audit riasztas lefutott."
          );
        }
      });
    });

    document.querySelectorAll(".log-filter").forEach((button) => {
      button.addEventListener("click", () => {
        activeLogFilter = button.dataset.logFilter || "all";

        document.querySelectorAll(".log-filter").forEach((item) => {
          item.classList.toggle("active", item === button);
        });

        refreshDashboard();
      });
    });

    document.addEventListener("click", handleActionClick);
    document.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-copy-code]");
      if (!button) return;

      event.preventDefault();
      const code = button.dataset.copyCode || "";

      try {
        await navigator.clipboard.writeText(code);
        const originalText = button.textContent;
        button.textContent = "Masolva";
        setTimeout(() => {
          button.textContent = originalText || "Kod masolasa";
        }, 1400);
      } catch (_error) {
        setStatus("A bongeszo nem engedte az automatikus masolast. Jelold ki a kodmezot.", true);
      }
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-scroll-target]");
      if (!button) return;

      event.preventDefault();
      scrollToPanel(button.dataset.scrollTarget);
    });
    emptyRow(els.sessionSearchRows, 5, "Még nem indult keresés.");

    if (savedToken) {
      refreshDashboard();
    } else {
      emptyRow(els.queueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.sessionSearchRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.emailIssueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.alertRows, 5, "Add meg az admin tokent.");
      emptyRow(els.operationsLogRows, 5, "A frissítéshez add meg az admin tokent.");
      renderOperatorFocus(null);
      renderLaunchReadiness(null);
      renderEngineAnalytics(null);
      renderEngineDecisionAudit(null);
      renderEmailDeliverability(null);
      renderPostPaymentMonitoring(null);
      renderControlPulse(null);
      setStatus("Add meg az ADMIN_TOKEN értékét.");
    }
  }

  init();
})();

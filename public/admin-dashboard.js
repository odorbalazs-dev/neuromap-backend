(function () {
  const TOKEN_KEY = "nm_admin_token";
  const TOKEN_STORAGE_KEYS = [TOKEN_KEY, "adminToken", "ADMIN_TOKEN"];
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
    runFollowUpEmailsBtn: document.getElementById("runFollowUpEmailsBtn"),
    runFollowUpEmailsPanelBtn: document.getElementById("runFollowUpEmailsPanelBtn"),
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
    dashboardMetricsUpdatedAt: document.getElementById("dashboardMetricsUpdatedAt"),
    dashboardMetricsLevel: document.getElementById("dashboardMetricsLevel"),
    dashboardMetricsLevelMeta: document.getElementById("dashboardMetricsLevelMeta"),
    dashboardMetricsPaid24h: document.getElementById("dashboardMetricsPaid24h"),
    dashboardMetricsRevenue24h: document.getElementById("dashboardMetricsRevenue24h"),
    dashboardMetricsConversion7d: document.getElementById("dashboardMetricsConversion7d"),
    dashboardMetricsCheckout7d: document.getElementById("dashboardMetricsCheckout7d"),
    dashboardMetricsEmailRate7d: document.getElementById("dashboardMetricsEmailRate7d"),
    dashboardMetricsEmailMeta7d: document.getElementById("dashboardMetricsEmailMeta7d"),
    dashboardMetricsQueueRisk: document.getElementById("dashboardMetricsQueueRisk"),
    dashboardMetricsQueueMeta: document.getElementById("dashboardMetricsQueueMeta"),
    dashboardMetricsWebhookRisk: document.getElementById("dashboardMetricsWebhookRisk"),
    dashboardMetricsWebhookMeta: document.getElementById("dashboardMetricsWebhookMeta"),
    dashboardMetricsTrendRows: document.getElementById("dashboardMetricsTrendRows"),
    dashboardMetricsDomainRows: document.getElementById("dashboardMetricsDomainRows"),
    dashboardMetricsRecommendationRows: document.getElementById("dashboardMetricsRecommendationRows"),
    customerExperienceUpdatedAt: document.getElementById("customerExperienceUpdatedAt"),
    customerExperienceTrust: document.getElementById("customerExperienceTrust"),
    customerExperienceTrustMeta: document.getElementById("customerExperienceTrustMeta"),
    customerExperienceConversion: document.getElementById("customerExperienceConversion"),
    customerExperienceConversionMeta: document.getElementById("customerExperienceConversionMeta"),
    customerExperienceDelivery: document.getElementById("customerExperienceDelivery"),
    customerExperienceDeliveryMeta: document.getElementById("customerExperienceDeliveryMeta"),
    customerExperienceLanguage: document.getElementById("customerExperienceLanguage"),
    customerExperienceLanguageMeta: document.getElementById("customerExperienceLanguageMeta"),
    customerExperienceRecommendationRows: document.getElementById("customerExperienceRecommendationRows"),
    sessionTimelineRows: document.getElementById("sessionTimelineRows"),
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
    followUpGeneratedAt: document.getElementById("followUpGeneratedAt"),
    followUpDue: document.getElementById("followUpDue"),
    followUpSent: document.getElementById("followUpSent"),
    followUpFailed: document.getElementById("followUpFailed"),
    followUpRows: document.getElementById("followUpRows"),
    webflowEmbedGeneratedAt: document.getElementById("webflowEmbedGeneratedAt"),
    webflowEmbedTotal: document.getElementById("webflowEmbedTotal"),
    webflowEmbedReadyMeta: document.getElementById("webflowEmbedReadyMeta"),
    webflowEmbedLoaders: document.getElementById("webflowEmbedLoaders"),
    webflowEmbedLimit: document.getElementById("webflowEmbedLimit"),
    webflowEmbedRows: document.getElementById("webflowEmbedRows"),
    i18nAuditGeneratedAt: document.getElementById("i18nAuditGeneratedAt"),
    i18nAuditLevel: document.getElementById("i18nAuditLevel"),
    i18nAuditSummary: document.getElementById("i18nAuditSummary"),
    i18nAuditRows: document.getElementById("i18nAuditRows"),
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
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
      .replace(/^["'`]+|["'`]+$/g, "");
  }

  function readSavedToken() {
    for (const key of TOKEN_STORAGE_KEYS) {
      const token = normalizeToken(localStorage.getItem(key) || "");
      if (token) return token;
    }

    return "";
  }

  function saveToken(token) {
    const normalized = normalizeToken(token);

    TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    if (normalized) {
      localStorage.setItem(TOKEN_KEY, normalized);
    }

    return normalized;
  }

  function clearSavedTokens() {
    TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
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
      els.runFollowUpEmailsBtn,
      els.runFollowUpEmailsPanelBtn,
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
    return rest ? `${hours} Ăłra ${rest} perce` : `${hours} ĂłrĂˇja`;
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
      queued: "vĂˇrakozik",
      processing: "feldolgozĂˇs alatt",
      processed: "feldolgozva",
      received: "beĂ©rkezett",
      failed: "hibĂˇs",
      done: "kĂ©sz",
      completed: "kĂ©sz",
      paid: "fizetve",
      unpaid: "nincs fizetve",
      not_sent: "nincs elkĂĽldve",
      sending: "kĂĽldĂ©s alatt",
      sent: "elkĂĽldve",
      skipped: "kihagyva",
      healthy: "rendben",
      critical: "kritikus",
      warning: "figyelendĹ‘",
      ok: "rendben",
      problem: "hiba",
      waiting: "vĂˇrakozik",
      unknown: "ismeretlen",
      active: "aktĂ­v",
      clean: "rendben",
      info: "informĂˇciĂł",
      email: "email",
      analysis: "elemzĂ©s",
      webhook: "webhook",
      checkout: "checkout",
      ready: "indĂ­tĂˇsra kĂ©sz",
      blocked: "blokkolt",
      pass: "rendben",
      warn: "figyelendĹ‘",
      fail: "hiba",
      high: "magas",
      medium: "kozepes",
      low: "alacsony",
      open: "nyitott",
      resolved: "lezĂˇrva",
      pending: "fĂĽggĹ‘ben"
    };

    return labels[String(value || "").toLowerCase()] || text(value);
  }

  async function api(path, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Add meg az ADMIN_TOKEN Ă©rtĂ©kĂ©t.");
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
      if (response.status === 401) {
        throw new Error(
          "Az admin token nem egyezik az Ă©les backend ADMIN_TOKEN vĂˇltozĂłjĂˇval. TĂ¶rĂ¶ld a mentett tokent, mĂˇsold be Ăşjra a neuromap-backend service ADMIN_TOKEN Ă©rtĂ©kĂ©t, majd szĂĽksĂ©g esetĂ©n indĂ­ts Ăşj deployt."
        );
      }

      if (response.status === 429) {
        throw new Error("TĂşl sok admin kĂ©rĂ©s futott rĂ¶vid idĹ‘n belĂĽl. VĂˇrj 1-2 percet, majd frissĂ­ts Ăşjra.");
      }

      throw new Error(data.error || `Admin API hiba (${response.status})`);
    }

    return data;
  }

  async function fetchAdmin(path, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Add meg az ADMIN_TOKEN Ă©rtĂ©kĂ©t.");
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
    primary.textContent = `FĹ‘: ${text(row.detectedRisk)}`;

    const secondary = document.createElement("div");
    secondary.className = "subtle";
    secondary.textContent = `MĂˇsodlagos: ${text(row.secondaryRisk)}`;

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
    wrapper.appendChild(actionButton("RĂ©szletek", "detail", sessionId, "secondary"));
    wrapper.appendChild(actionButton("PDF", "download-pdf", sessionId, "secondary"));
    wrapper.appendChild(actionButton("PDF ĂşjragenerĂˇlĂˇs", "regenerate-pdf", sessionId, "secondary"));
    wrapper.appendChild(actionButton("ElemzĂ©s ĂşjraindĂ­tĂˇsa", "retry", sessionId, "warn"));

    if (includeResend) {
      wrapper.appendChild(actionButton("Email ĂşjrakĂĽldĂ©s", "resend", sessionId, "secondary"));
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

  function showEmptyDetail(message = "Nincs kivĂˇlasztott session.") {
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
        ? "NaplĂł megnyitĂˇsa"
        : "NaplĂł Ă¶sszecsukĂˇsa";
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
        ? button.dataset.openLabel || "MegnyitĂˇs"
        : button.dataset.closedLabel || "Ă–sszecsukĂˇs";
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

  function applyDashboardQuickFilter(filter) {
    const filters = {
      "low-confidence": {
        target: "engineAnalyticsPanel",
        status: "Alacsony confidence nezete: engine dontesi audit megnyitva."
      },
      "email-risk": {
        target: "emailDeliveryPanel",
        status: "Email kockazati nezet: kezbesitesi es retry sorok eloterben."
      },
      "checkout-dropoff": {
        target: "customerMetricsPanel",
        status: "Checkout dropoff nezet: vasarloi ut metrikak eloterben."
      }
    };

    const next = filters[filter];
    if (!next) return;

    setStatus(next.status);
    scrollToPanel(next.target);
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
      no_action: "nincs teendĹ‘",
      inspect_then_reset_retry: "ellenĹ‘rzĂ©s, majd retry alaphelyzet",
      resend_report_email: "riport email ĂşjrakĂĽldĂ©se",
      wait_for_report: "riport elkĂ©szĂĽlĂ©sĂ©re vĂˇr",
      ready: "kĂ©szen Ăˇll",
      payment_not_paid: "nincs kifizetve",
      missing_payload: "hiĂˇnyzĂł payload",
      analysis_done: "elemzĂ©s kĂ©sz",
      analysis_already_running: "elemzĂ©s mĂˇr fut",
      analysis_failed: "elemzĂ©s hibĂˇra futott"
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
        title: "FizetĂ©s mĂ©g nincs lezĂˇrva",
        detail: "A session nem tekinthetĹ‘ teljes riportfolyamatnak, amĂ­g a Stripe fizetĂ©s nincs fizetett Ăˇllapotban.",
        meta: "ElsĹ‘kĂ©nt a checkout vagy webhook oldalt Ă©rdemes ellenĹ‘rizni.",
        actions: []
      };
    }

    if (analysis === "failed") {
      return {
        level: "critical",
        title: "ElemzĂ©s retry javasolt",
        detail: compact(session.error_message || "Az elemzĂ©s hibĂˇra futott. A worker ĂşjraprĂłbĂˇlĂˇsa vagy a payload ellenĹ‘rzĂ©se szĂĽksĂ©ges.", 170),
        meta: "Tipikus ok: OpenAI/PDF/email elĹ‘feltĂ©tel, sĂ©rĂĽlt payload vagy worker hiba.",
        actions: [actionButton("ElemzĂ©s ĂşjraindĂ­tĂˇsa", "retry", session.id, "warn")]
      };
    }

    if (["queued", "processing"].includes(analysis)) {
      return {
        level: "active",
        title: "Worker feldolgozĂˇs figyelĂ©se",
        detail: "A fizetĂ©s megvan, a session elemzĂ©sre vĂˇr vagy feldolgozĂˇs alatt van.",
        meta: "Ha hosszabb ideje nem mozdul, a queue panelen Ă©rdemes folytatni.",
        actions: []
      };
    }

    if (["done", "completed"].includes(analysis) && !hasReportMaterial(session)) {
      return {
        level: "warning",
        title: "Riport/PDF alapanyag ellenĹ‘rzĂ©s",
        detail: "Az elemzĂ©s stĂˇtusza kĂ©sz, de a dashboard nem lĂˇt riportanyag-elĹ‘nĂ©zetet.",
        meta: "PDF ĂşjragenerĂˇlĂˇs vagy session payload ellenĹ‘rzĂ©s javasolt.",
        actions: [actionButton("PDF ĂşjragenerĂˇlĂˇs", "regenerate-pdf", session.id, "secondary")]
      };
    }

    if (["failed", "not_sent"].includes(email)) {
      return {
        level: attempts >= 3 ? "critical" : "warning",
        title: "Email kĂ©zbesĂ­tĂ©s beavatkozĂˇst kĂ©r",
        detail: compact(session.report_email_error || "A riport elkĂ©szĂĽlt, de az email nincs sikeresen elkĂĽldve.", 170),
        meta: `Email prĂłbĂˇlkozĂˇsok: ${Number.isFinite(attempts) ? attempts : 0}`,
        actions: [
          actionButton("Email ĂşjrakĂĽldĂ©s", "resend", session.id, "secondary"),
          actionButton("Email retry alaphelyzet", "reset-email", session.id, "secondary")
        ]
      };
    }

    if (email === "sent") {
      return {
        level: "ok",
        title: "Riportfolyamat lezĂˇrva",
        detail: "A fizetĂ©s, elemzĂ©s, PDF alapanyag Ă©s email kĂ©zbesĂ­tĂ©s alapjĂˇn ez a session rendben van.",
        meta: "EllenĹ‘rzĂ©shez a PDF letĂ¶lthetĹ‘.",
        actions: [actionButton("PDF letĂ¶ltĂ©se", "download-pdf", session.id, "secondary")]
      };
    }

    return {
      level: "info",
      title: "RĂ©szletek ĂˇttekintĂ©se",
      detail: "Nincs egyĂ©rtelmĹ± kritikus teendĹ‘, de a session stĂˇtuszai mĂ©g nem adnak teljesen lezĂˇrt kĂ©pet.",
      meta: "A folyamatlĂ©pĂ©sek Ă©s az idĹ‘vonal segĂ­tenek a kĂ¶vetkezĹ‘ pont megtalĂˇlĂˇsĂˇban.",
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
    title.textContent = "FolyamatlĂ©pĂ©sek";

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
      stageTile("FizetĂ©s", paymentLevel, statusLabel(session.payment_status), `Stripe session: ${text(session.stripe_session_id)}`),
      stageTile("Webhook", webhookLevel, hasRelatedWebhook(session) ? "van kapcsolĂłdĂł esemĂ©ny" : "nincs kĂ¶zvetlen esemĂ©ny", "A webhook esemĂ©nyek a lentebbi tĂˇblĂˇban is lĂˇtszanak."),
      stageTile("ElemzĂ©s", deriveStageLevel(session.analysis_status, ["done", "completed"]), statusLabel(session.analysis_status), `Worker job: ${Array.isArray(session.analysisJobs) ? session.analysisJobs.length : 0} db`),
      stageTile("Riport/PDF", reportLevel, hasReportMaterial(session) ? "riportalapanyag elĂ©rhetĹ‘" : "riportalapanyag nem lĂˇtszik", `KĂ©rdĹ‘Ă­v: ${text(session.questionnaireVersion)}`),
      stageTile("Email", emailLevel, statusLabel(session.report_email_status), `PrĂłbĂˇlkozĂˇs: ${text(session.report_email_attempts)}`)
    );

    card.append(title, grid);
    return card;
  }

  function renderPriorityFacts(session) {
    const card = document.createElement("section");
    card.className = "detail-card priority-facts-card";

    const title = document.createElement("h4");
    title.textContent = "PrioritĂˇs adatok";

    const grid = document.createElement("div");
    grid.className = "priority-facts-grid";

    const summary = session.reportSummary || {};
    grid.append(
      summaryField("Session ID", session.id),
      summaryField("Stripe session", session.stripe_session_id),
      summaryField("Nyelv", session.lang),
      summaryField("Gyermek Ă©letkora", summary.hasAge ? `${formatNumber(summary.childAge, 1)} Ă©v` : "nincs megadva"),
      summaryField("FĹ‘ fĂłkusz", session.detectedRisk || summary.detectedRisk),
      summaryField("MĂˇsodlagos fĂłkusz", session.secondaryRisk || summary.secondaryRisk),
      summaryField("Email prĂłbĂˇlkozĂˇs", session.report_email_attempts),
      summaryField("UtolsĂł email hiba", compact(session.report_email_error, 90))
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
    eyebrow.textContent = "RĂ©szlet fĂłkusz";

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
      summaryField("FizetĂ©s", session.payment_status, { pill: true }),
      summaryField("ElemzĂ©s", session.analysis_status, { pill: true }),
      summaryField("Email", session.report_email_status, { pill: true }),
      summaryField("FrissĂ­tve", formatDate(session.updated_at))
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
    title.textContent = "Riport ĂˇttekintĂ©s";

    const grid = document.createElement("div");
    grid.className = "summary-field-grid";
    grid.append(
      summaryField("Gyermek Ă©letkora", summary.hasAge ? `${formatNumber(summary.childAge, 1)} Ă©v` : "nincs megadva"),
      summaryField("KorosztĂˇly", summary.ageBandLabel || summary.ageBand),
      summaryField("FĹ‘ jelzĂ©s", summary.detectedRisk),
      summaryField("MĂˇsodlagos jelzĂ©s", summary.secondaryRisk),
      summaryField("ErĹ‘ssĂ©g", summary.severity, { pill: true }),
      summaryField("JelzĂ©sszint", summary.signalLabel),
      summaryField("Specifikus Ăˇtlag", formatNumber(summary.normalizedAverage)),
      summaryField("Engine dĂ¶ntĂ©s", enginePatternLabel(engine.patternType)),
      summaryField("DĂ¶ntĂ©si minĹ‘sĂ©g", decisionQualityLabel(engine.decisionQuality)),
      summaryField("Confidence", engine.confidenceLabel ? `${decisionQualityLabel(engine.confidenceLabel)} (${formatNumber(engine.confidence)})` : "-"),
      summaryField("PontkĂĽlĂ¶nbsĂ©g", formatNumber(engine.scoreGap)),
      summaryField("ĂtfedĂ©s", formatNumber(engine.overlapScore)),
      summaryField("Extra kĂ©rdĂ©s kell", yesNo(engine.shouldAskExtra)),
      summaryField("PontforrĂˇs", scoreSourceLabel(engine.scoreSource)),
      summaryField("Specifikus koherencia", coherence.label ? `${text(coherence.label)} (${formatNumber(coherence.score)})` : "-"),
      summaryField("KĂ©rdĹ‘Ă­v verziĂł", summary.questionnaireVersion),
      summaryField("Email retry teendĹ‘", retryActionLabel(email.nextAction)),
      summaryField("Email retry elĂ©rhetĹ‘", yesNo(email.retryAvailable)),
      summaryField("Email retry limit", yesNo(email.retryLimitReached)),
      summaryField("ElemzĂ©s retry Ăˇllapot", retryActionLabel(analysisRetry.reason)),
      summaryField("ElemzĂ©s retry javasolt", yesNo(analysisRetry.retryRecommended)),
      summaryField("Worker job", job.status || "nincs aktĂ­v job"),
      summaryField("Worker prĂłbĂˇlkozĂˇs", job.attempts ?? "-")
    );

    const topAreas = document.createElement("p");
    topAreas.className = "summary-top-areas";
    const areas = Array.isArray(summary.topSubdomains)
      ? summary.topSubdomains
          .map((item) => `${item.key}: ${formatNumber(item.average)}`)
          .join(", ")
      : "";
    topAreas.textContent = areas
      ? `LegerĹ‘sebb alterĂĽletek: ${areas}`
      : "LegerĹ‘sebb alterĂĽletek: nincs elĂ©rhetĹ‘ alterĂĽleti profil.";

    const engineAreas = document.createElement("p");
    engineAreas.className = "summary-top-areas";
    const focusAreas = Array.isArray(engine.recommendedFocusAreas)
      ? engine.recommendedFocusAreas.join(", ")
      : "";
    engineAreas.textContent = focusAreas
      ? `Engine fĂłkuszterĂĽletek: ${focusAreas}`
      : "Engine fĂłkuszterĂĽletek: nincs elĂ©rhetĹ‘ engine v2 Ă¶sszegzĂ©s.";

    const rankedDomains = document.createElement("p");
    rankedDomains.className = "summary-top-areas";
    const domainText = Array.isArray(engine.rankedDomains)
      ? engine.rankedDomains
          .map((item) => `${item.domain}: ${formatNumber(item.score)}`)
          .join(", ")
      : "";
    rankedDomains.textContent = domainText
      ? `Rangsorolt terĂĽletek: ${domainText}`
      : "Rangsorolt terĂĽletek: nincs elĂ©rhetĹ‘ ranking.";

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
    title.textContent = "HibakeresĂ©si tĂ©rkĂ©p";
    const copy = document.createElement("p");
    copy.textContent = "Session szintĹ± folyamatkĂ©p: fizetĂ©s, webhook, worker, PDF alapanyag Ă©s email kĂ©zbesĂ­tĂ©s.";
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
    actionTitle.textContent = "Javasolt kĂ¶vetkezĹ‘ lĂ©pĂ©sek";
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
      "Worker job elĹ‘zmĂ©nyek",
      rows,
      [
        { label: "StĂˇtusz", value: (row) => statusPill(row.status) },
        { label: "PrĂłbĂˇlkozĂˇs", value: (row) => row.attempts },
        { label: "Worker", value: (row) => row.locked_by },
        { label: "UtolsĂł hiba", value: (row) => compact(row.last_error, 120) },
        { label: "FrissĂ­tve", value: (row) => formatDate(row.updated_at || row.created_at) }
      ],
      "Ehhez a sessionhĂ¶z nem talĂˇltam worker job elĹ‘zmĂ©nyt."
    );
  }

  function renderWebhookEvents(session) {
    const rows = Array.isArray(session.webhookEvents) ? session.webhookEvents : [];

    return renderMiniTable(
      "Webhook esemĂ©nyek",
      rows,
      [
        { label: "EsemĂ©ny", value: (row) => row.event_type },
        { label: "StĂˇtusz", value: (row) => statusPill(row.status) },
        { label: "Stripe session", value: (row) => row.stripe_session_id },
        { label: "Hiba", value: (row) => compact(row.error_message, 120) },
        { label: "Ă‰rkezett", value: (row) => formatDate(row.created_at) }
      ],
      "Ehhez a sessionhĂ¶z nem talĂˇltam kĂ¶zvetlenĂĽl kapcsolĂłdĂł webhook esemĂ©nyt."
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
    subtitle.textContent = `${text(session.email)} Â· ${text(session.id)}`;

    titleWrap.append(title, subtitle);

    const actionWrap = document.createElement("div");
    actionWrap.className = "actions detail-actions";
    actionWrap.append(
      actionButton("ElemzĂ©s ĂşjraindĂ­tĂˇsa", "retry", session.id, "warn"),
      actionButton("PDF", "download-pdf", session.id, "secondary"),
      actionButton("PDF ĂşjragenerĂˇlĂˇs", "regenerate-pdf", session.id, "secondary"),
      actionButton("Email ĂşjrakĂĽldĂ©s", "resend", session.id, "secondary"),
      actionButton("Email retry alaphelyzet", "reset-email", session.id, "secondary")
    );

    header.append(titleWrap, actionWrap);

    const grid = document.createElement("div");
    grid.className = "detail-grid";
    grid.append(
      detailMetric("FizetĂ©s", session.payment_status, { pill: true }),
      detailMetric("ElemzĂ©s", session.analysis_status, { pill: true }),
      detailMetric("Email", session.report_email_status, { pill: true }),
      detailMetric("Email prĂłbĂˇlkozĂˇsok", session.report_email_attempts),
      detailMetric("Nyelv", session.lang),
      detailMetric("FĹ‘ fĂłkusz", session.detectedRisk),
      detailMetric("MĂˇsodlagos fĂłkusz", session.secondaryRisk),
      detailMetric("KĂ©rdĹ‘Ă­v", session.questionnaireVersion),
      detailMetric("Riport szĂ¶veg", session.hasAnalysisResult ? `${session.analysisResultLength} karakter` : "hiĂˇnyzik"),
      detailMetric("Payload", session.hasPayload ? "elĂ©rhetĹ‘" : "hiĂˇnyzik"),
      detailMetric("Stripe session", session.stripe_session_id),
      detailMetric("Email szolgĂˇltatĂłi ID", session.report_email_provider_id)
    );

    const counts = session.counts || {};
    const countsPanel = document.createElement("section");
    countsPanel.className = "detail-card";
    const countsTitle = document.createElement("h4");
    countsTitle.textContent = "KĂ©rdĂ©sszĂˇmok";
    const countCopy = document.createElement("p");
    countCopy.textContent =
      `Triage ${Number(counts.triageAnswers || 0)}/${Number(counts.triageQuestions || 0)}, ` +
      `specific ${Number(counts.specificAnswers || 0)}/${Number(counts.specificQuestions || 0)}, ` +
      `extra ${Number(counts.extraAnswers || 0)}/${Number(counts.extraQuestions || 0)}.`;
    countsPanel.append(countsTitle, countCopy);

    const timeline = document.createElement("section");
    timeline.className = "detail-card";
    const timelineTitle = document.createElement("h4");
    timelineTitle.textContent = "IdĹ‘vonal";
    const timelineGrid = document.createElement("div");
    timelineGrid.className = "timeline-grid";
    timelineGrid.append(
      timelineItem("LĂ©trehozva", session.created_at),
      timelineItem("Fizetve", session.paid_at),
      timelineItem("ElemzĂ©s indult", session.analysis_started_at),
      timelineItem("ElemzĂ©s kĂ©sz", session.analysis_completed_at),
      timelineItem("Email prĂłbĂˇlkozĂˇs", session.report_email_last_attempt_at),
      timelineItem("Email elkĂĽldve", session.report_email_sent_at),
      timelineItem("FrissĂ­tve", session.updated_at)
    );
    timeline.append(timelineTitle, timelineGrid);

    const errors = document.createElement("section");
    errors.className = "detail-card";
    const errorsTitle = document.createElement("h4");
    errorsTitle.textContent = "HibĂˇk";
    const errorText = document.createElement("p");
    errorText.textContent =
      session.report_email_error ||
      session.error_message ||
      "Nincs aktuĂˇlis rĂ¶gzĂ­tett hiba.";
    errors.append(errorsTitle, errorText);

    const preview = document.createElement("section");
    preview.className = "detail-card";
    const previewTitle = document.createElement("h4");
    previewTitle.textContent = "ElemzĂ©s elĹ‘nĂ©zet";
    const previewText = document.createElement("p");
    previewText.className = "analysis-preview";
    previewText.textContent = session.analysisPreview || "Nincs elĂ©rhetĹ‘ elemzĂ©s elĹ‘nĂ©zet.";
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
      emptyRow(target, mode === "failed" ? 4 : 5, "Nincs megjelenĂ­thetĹ‘ adat.");
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
      emptyRow(els.emailIssueRows, 5, "Nincs email delivery teendĹ‘.");
      return;
    }

    items.forEach((row) => {
      const tr = document.createElement("tr");
      const attemptInfo = document.createElement("div");

      const attempts = document.createElement("div");
      attempts.textContent = `${Number(row.report_email_attempts || 0)} prĂłbĂˇlkozĂˇs`;

      const lastAttempt = document.createElement("div");
      lastAttempt.className = "subtle";
      lastAttempt.textContent =
        `UtolsĂł: ${formatDate(row.report_email_last_attempt_at || row.updated_at)}`;

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
        `UtolsĂł fizetes: ${relativeMinutes(timestamps.lastPaidMinutesAgo)}`;
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
          ? `Friss\u00edtve: ${formatDate(data.generatedAt)}`
          : "M\u00e9g nincs embed \u00e1llapotk\u00e9p";
    }

    if (els.webflowEmbedTotal) {
      els.webflowEmbedTotal.textContent = Number(summary.total || embeds.length || 0);
    }

    if (els.webflowEmbedReadyMeta) {
      els.webflowEmbedReadyMeta.textContent =
        `K\u00e9sz: ${Number(summary.ready || 0)}, limit feletti snippet: ${Number(summary.overLimitSnippets || 0)}`;
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
      empty.textContent = "Add meg az admin tokent, majd friss\u00edts a Webflow embed \u00e1llapotk\u00e9phez.";
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
        `${text(item.placement)} - ${compact(item.note, 150)}`;

      titleWrap.append(title, meta);
      head.append(titleWrap, statusPill(item.ready ? "ready" : "blocked"));

      const details = document.createElement("div");
      details.className = "embed-meta";
      details.append(
        summaryChip("Hov\u00e1 tedd", item.placement || "-"),
        summaryChip("Verzi\u00f3", item.version || "-"),
        summaryChip("Cache bust", item.cacheBust?.version || item.version || "-"),
        summaryChip("T\u00edpus", item.type || "-"),
        summaryChip("Forr\u00e1s", item.source?.path || "-")
      );

      const instruction = document.createElement("p");
      instruction.className = "embed-human-instruction";
      instruction.textContent = item.type === "loader"
        ? "Ezt a r\u00f6vid loadert m\u00e1sold a megadott Webflow embedbe. A hossz\u00fa k\u00f3d a backendr\u0151l t\u00f6lt\u0151dik be, ez\u00e9rt nem \u00fctk\u00f6zik a Webflow 50k limitbe."
        : "Ez az embed csak ellen\u0151rz\u00e9shez jelenik meg. A technikai k\u00f3dot csak akkor nyisd le, ha m\u00e1solni vagy cser\u00e9lni szeretn\u00e9d.";

      const code = document.createElement("textarea");
      code.className = "embed-code";
      code.readOnly = true;
      code.value = item.copyCode || "";

      const codeDetails = document.createElement("details");
      codeDetails.className = "embed-code-details";

      const codeSummary = document.createElement("summary");
      codeSummary.textContent = "K\u00f3d megjelen\u00edt\u00e9se csak m\u00e1sol\u00e1shoz";

      codeDetails.append(codeSummary, code);

      const actionRow = document.createElement("div");
      actionRow.className = "embed-actions";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "secondary";
      copyButton.dataset.copyCode = item.copyCode || "";
      copyButton.textContent = item.type === "loader" ? "Loader m\u00e1sol\u00e1sa" : "K\u00f3d m\u00e1sol\u00e1sa";

      const publicLink = document.createElement("span");
      publicLink.className = "snapshot-time embed-url-meta";
      publicLink.textContent = item.publicUrl
        ? "A verzi\u00f3zott publikus URL k\u00e9szen \u00e1ll."
        : "Nincs publikus URL";

      actionRow.append(copyButton);

      if (item.publicUrl) {
        const urlButton = document.createElement("button");
        urlButton.type = "button";
        urlButton.className = "secondary embed-url-copy";
        urlButton.dataset.copyCode = item.publicUrl;
        urlButton.textContent = "Publikus URL m\u00e1sol\u00e1sa";
        actionRow.append(urlButton);
      }

      actionRow.append(publicLink);
      card.append(head, details, instruction, actionRow, codeDetails);
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
      emptyRow(els.alertRows, 5, "MĂ©g nincs proaktĂ­v riasztĂˇs.");
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
      els.operationalAlertSummary.textContent = "MĂ©g nincs operational snapshot.";
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
    els.operationalAlertWindow.textContent = `${Number(snapshot.window?.hours || 0)} Ăłra`;
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

  function metricLevelLabel(level) {
    const labels = {
      healthy: "Rendben",
      watch: "Figyeles",
      warning: "Teendo",
      critical: "Kritikus",
      ok: "Rendben",
      info: "Info",
      waiting: "Varakozik",
      unknown: "Ismeretlen"
    };

    return labels[level] || level || "-";
  }

  function setMetricText(element, value) {
    if (element) element.textContent = value;
  }

  function renderDashboardTrendRows(items = []) {
    if (!els.dashboardMetricsTrendRows) return;

    els.dashboardMetricsTrendRows.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "engine-empty";
      empty.textContent = "Nincs megjelenitheto trend adat.";
      els.dashboardMetricsTrendRows.appendChild(empty);
      return;
    }

    const max = Math.max(...items.map((item) => countValue(item.checkoutStarted) + countValue(item.paid)), 1);

    items.slice(-14).forEach((item) => {
      const row = document.createElement("div");
      row.className = "metric-trend-row";

      const label = document.createElement("span");
      label.textContent = item.day || "-";

      const value = document.createElement("strong");
      value.textContent = `${countValue(item.paid)} paid / ${countValue(item.checkoutStarted)} checkout`;

      const bars = document.createElement("div");
      bars.className = "metric-trend-bars";

      const checkoutBar = document.createElement("span");
      checkoutBar.className = "checkout";
      checkoutBar.style.width = `${Math.max(4, (countValue(item.checkoutStarted) / max) * 100)}%`;

      const paidBar = document.createElement("span");
      paidBar.className = "paid";
      paidBar.style.width = `${Math.max(4, (countValue(item.paid) / max) * 100)}%`;

      bars.append(checkoutBar, paidBar);
      row.append(label, value, bars);
      els.dashboardMetricsTrendRows.appendChild(row);
    });
  }

  function renderDashboardMetrics(data = null) {
    if (!els.dashboardMetricsUpdatedAt) return;

    if (!data?.ok) {
      setMetricText(els.dashboardMetricsUpdatedAt, "Admin tokenre var");
      setMetricText(els.dashboardMetricsLevel, "-");
      setMetricText(els.dashboardMetricsLevelMeta, "Add meg az admin tokent, majd frissits.");
      setMetricText(els.dashboardMetricsPaid24h, "0");
      setMetricText(els.dashboardMetricsRevenue24h, "Becsult bevetel: $0");
      setMetricText(els.dashboardMetricsConversion7d, "-");
      setMetricText(els.dashboardMetricsCheckout7d, "Checkout inditas: 0");
      setMetricText(els.dashboardMetricsEmailRate7d, "-");
      setMetricText(els.dashboardMetricsEmailMeta7d, "Kesz riport -> sent email");
      setMetricText(els.dashboardMetricsQueueRisk, "0");
      setMetricText(els.dashboardMetricsQueueMeta, "Beragadt / regi job");
      setMetricText(els.dashboardMetricsWebhookRisk, "0");
      setMetricText(els.dashboardMetricsWebhookMeta, "Failed webhook");
      renderDashboardTrendRows([]);
      renderEngineBars(els.dashboardMetricsDomainRows, []);
      renderEngineList(els.dashboardMetricsRecommendationRows, [], () => ({ title: "-", meta: "-" }));
      return;
    }

    const summary = data.summary || {};
    const last24h = data.windows?.last24h || {};
    const last7d = data.windows?.last7d || {};
    const funnel = data.funnel || {};
    const queue = data.operations?.queue || {};
    const webhook = data.operations?.webhook || {};
    const engine = data.engine || {};
    const level = summary.level || "unknown";

    setMetricText(
      els.dashboardMetricsUpdatedAt,
      summary.generatedAt ? `Metrika: ${formatDate(summary.generatedAt)}` : "Metrika frissitve"
    );
    setMetricText(els.dashboardMetricsLevel, metricLevelLabel(level));
    if (els.dashboardMetricsLevel) {
      els.dashboardMetricsLevel.parentElement.className = `health-card metric-kpi ${statusClass(level)}`;
    }
    setMetricText(
      els.dashboardMetricsLevelMeta,
      `${countValue(last7d.sessions)} session / ${countValue(last7d.checkoutStarted)} checkout / ${countValue(last7d.paid)} fizetes. Session -> paid: ${formatPercent(last7d.sessionToPaidRate)}.`
    );
    setMetricText(els.dashboardMetricsPaid24h, String(countValue(last24h.paid)));
    setMetricText(els.dashboardMetricsRevenue24h, `Becsult bevetel: $${countValue(last24h.estimatedRevenueUsd)}`);
    setMetricText(els.dashboardMetricsConversion7d, formatPercent(last7d.checkoutToPaidRate));
    setMetricText(
      els.dashboardMetricsCheckout7d,
      `Checkout inditas: ${countValue(last7d.checkoutStarted)} / dropoff: ${countValue(funnel.dropoffs?.checkoutToPaid ?? last7d.checkoutDropoffCount)}`
    );
    setMetricText(els.dashboardMetricsEmailRate7d, formatPercent(last7d.analysisDoneToEmailSentRate));
    setMetricText(
      els.dashboardMetricsEmailMeta7d,
      `${countValue(last7d.reportEmailSent)} elkuldve, ${countValue(last7d.reportEmailUnsent)} varakozik, ${countValue(last7d.reportEmailFailed)} hibas.`
    );
    setMetricText(els.dashboardMetricsQueueRisk, String(countValue(queue.staleProcessing) + countValue(queue.oldQueued)));
    setMetricText(
      els.dashboardMetricsQueueMeta,
      `${countValue(queue.queued)} queued, ${countValue(queue.processing)} processing, ${countValue(queue.failed)} failed.`
    );
    setMetricText(els.dashboardMetricsWebhookRisk, String(countValue(webhook.failed24h)));
    setMetricText(
      els.dashboardMetricsWebhookMeta,
      `${countValue(webhook.events24h)} event 24h, ${countValue(webhook.checkoutCompleted24h)} checkout completed.`
    );

    renderDashboardTrendRows(data.trend || []);
    renderEngineBars(els.dashboardMetricsDomainRows, engine.domainDistribution || []);
    renderEngineList(
      els.dashboardMetricsRecommendationRows,
      data.recommendations || [],
      (item) => ({
        title: `${metricLevelLabel(item.level)}: ${item.title || "-"}`,
        meta: item.detail || "-"
      })
    );
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
        ? `Engine ĂˇllapotkĂ©p: ${formatDate(data.generatedAt)}`
        : "MĂ©g nincs engine ĂˇllapotkĂ©p";
    }

    if (els.engineAnalyticsTotal) {
      els.engineAnalyticsTotal.textContent = Number(metrics.sessionsWithEngine || 0);
    }

    if (els.engineAnalyticsWindow) {
      els.engineAnalyticsWindow.textContent =
        `${Number(data?.window?.loadedSessions || 0)} betĂ¶ltĂ¶tt sessionbĹ‘l`;
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
        `${Number(summary.criticalSessions || 0)} kritikus, ${Number(summary.warningSessions || 0)} figyelendĹ‘`;
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
      emptyRow(els.engineDecisionAuditRows, 6, "Nincs \u00e1tn\u00e9z\u00e9sre v\u00e1r\u00f3 engine d\u00f6nt\u00e9si audit elt\u00e9r\u00e9s.");
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const session = document.createElement("div");
      const id = document.createElement("div");
      id.textContent = row.shortId || row.id || "-";
      const meta = document.createElement("div");
      meta.className = "subtle";
      meta.textContent = `${text(row.lang)} Â· ${formatDate(row.createdAt)}`;
      session.append(id, meta);

      const stored = document.createElement("div");
      const storedPrimary = document.createElement("div");
      storedPrimary.textContent = `FĹ‘: ${text(row.stored?.primaryDomain)}`;
      const storedExtra = document.createElement("div");
      storedExtra.className = "subtle";
      storedExtra.textContent = `extra: ${yesNo(row.stored?.askedExtra)} Â· ${Number(row.stored?.specificQuestionCount || 0)} specifikus`;
      stored.append(storedPrimary, storedExtra);

      const engine = document.createElement("div");
      const enginePrimary = document.createElement("div");
      enginePrimary.textContent = `FĹ‘: ${text(row.engine?.primaryDomain)}`;
      const engineMeta = document.createElement("div");
      engineMeta.className = "subtle";
      engineMeta.textContent =
        `extra: ${yesNo(row.engine?.shouldAskExtra)} Â· conf: ${formatNumber(row.engine?.confidence)} Â· gap: ${formatNumber(row.engine?.scoreGap)}`;
      const engineReason = document.createElement("div");
      engineReason.className = "subtle";
      engineReason.textContent =
        `D\u00f6nt\u00e9si ok: ${text(row.engine?.primaryDomain)} jelz\u00e9s, confidence ${formatNumber(row.engine?.confidence)}, gap ${formatNumber(row.engine?.scoreGap)}; extra pontos\u00edt\u00e1s: ${yesNo(row.engine?.shouldAskExtra)}.`;
      engine.append(enginePrimary, engineMeta, engineReason);

      const issue = document.createElement("div");
      const firstIssue = row.issues?.[0];
      issue.textContent = firstIssue?.label || "Audit eltĂ©rĂ©s";
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
    if (level === "critical") return "BeavatkozĂˇs kell";
    if (level === "warning") return "FigyelendĹ‘";
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
        name: "FizetĂ©s indĂ­tĂˇsa",
        level: stageLevel({
          active: countValue(queueCounts.queued) + countValue(queueCounts.processing),
          warning: countValue(queueCounts.failed)
        }),
        detail: `${countValue(queueCounts.queued)} vĂˇrakozik, ${countValue(queueCounts.processing)} feldolgozĂˇs alatt, ${countValue(queueCounts.failed)} hibĂˇs`
      },
      {
        name: "Stripe webhook",
        level: stageLevel({
          critical: countValue(webhooks.failedLast24h),
          active: countValue(webhooks.pendingOrProcessing)
        }),
        detail: `${countValue(webhooks.failedLast24h)} hiba 24 ĂłrĂˇban, ${countValue(webhooks.pendingOrProcessing)} fĂĽggĹ‘ben`
      },
      {
        name: "Worker elemzĂ©s",
        level: stageLevel({
          critical: countValue(metrics.staleProcessingJobs),
          warning: countValue(jobs.counts?.failed) + countValue(metrics.paidFailedSessions),
          active: countValue(jobs.counts?.queued) + countValue(jobs.counts?.processing)
        }),
        detail: `${countValue(jobs.counts?.queued)} vĂˇrakozĂł job, ${countValue(metrics.staleProcessingJobs)} beragadt lock`
      },
      {
        name: "PDF/riport",
        level: stageLevel({
          warning: countValue(sessions.doneWithoutAnalysisResult?.length)
        }),
        detail: `${countValue(sessions.doneWithoutAnalysisResult?.length)} kĂ©sz session riportszĂ¶veg nĂ©lkĂĽl`
      },
      {
        name: "Email kĂ©zbesĂ­tĂ©s",
        level: stageLevel({
          critical: countValue(email.failedCount) + countValue(email.retryLimitCount),
          warning: countValue(email.unsentDoneCount),
          active: countValue(email.retryableCount)
        }),
        detail: `${countValue(email.failedCount)} hibĂˇs, ${countValue(email.retryableCount)} ĂşjraprĂłbĂˇlhatĂł, ${countValue(email.retryLimitCount)} limitnĂ©l`
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
        `${Number(summary.passed || 0)}/${Number(summary.total || 0)} ellenĹ‘rzĂ©s rendben, ` +
        `${Number(summary.warnings || 0)} figyelmeztetĂ©s, ${Number(summary.failed || 0)} blokkolĂł hiba.`;
      els.launchReadinessGeneratedAt.textContent =
        readiness.generatedAt ? `EllenĹ‘rizve: ${formatDate(readiness.generatedAt)}` : "-";
    } else {
      els.launchReadinessSummary.textContent = "Add meg az admin tokent, majd frissĂ­ts.";
      els.launchReadinessGeneratedAt.textContent = "MĂ©g nincs ellenĹ‘rzĂ©s.";
    }

    els.launchReadinessChecks.replaceChildren();
    const checks = readiness?.checks || [];

    if (!checks.length) {
      const empty = document.createElement("div");
      empty.className = "launch-empty";
      empty.textContent = "A launch checklist betĂ¶ltĂ©sĂ©hez frissĂ­ts admin tokennel.";
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
      group.textContent = check.group || "EllenĹ‘rzĂ©s";

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
      li.textContent = "A kĂ©zi Ă©lesĂ­tĂ©si kontrollok az ellenĹ‘rzĂ©s utĂˇn jelennek meg.";
      els.launchManualChecks.appendChild(li);
      return;
    }

    manualChecks.forEach((check) => {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = check.label || "KĂ©zi kontroll";
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
      ? "A fĹ‘ rendszerek rendben vannak"
      : level === "active"
        ? "A folyamat aktĂ­v"
        : level === "warning"
          ? "OperĂˇtori ellenĹ‘rzĂ©s javasolt"
          : level === "critical"
            ? "BeavatkozĂˇs szĂĽksĂ©ges"
            : "Ă‰les adatokra vĂˇr";

    els.controlCenterHeadline.textContent = levelText;
    els.controlCenterSummary.textContent = status?.ok
      ? `${issues} kritikus jelzĂ©s. ${countValue(queue?.counts?.queued)} vĂˇrakozĂł, ${countValue(queue?.counts?.processing)} feldolgozĂˇs alatti, ${countValue(queue?.counts?.failed)} hibĂˇs session.`
      : "Az Admin API nem Ă©rhetĹ‘ el a jelenlegi tokennel.";

    els.controlScore.className = `control-score ${statusClass(level)}`;
    els.controlScore.querySelector("strong").textContent = statusLabel(level).toUpperCase();

    els.lastSnapshotAt.textContent = health?.generatedAt
      ? `ĂllapotkĂ©p: ${formatDate(health.generatedAt)}`
      : "MĂ©g nincs ĂˇllapotkĂ©p";

    els.riskFocus.textContent = alerts?.items?.length
      ? compact(alerts.items[0].summary, 100)
      : recommendations[0] || "Nincs aktuĂˇlis Ă©les rendszerkockĂˇzat.";

    els.nextAction.textContent = recommendations[0] || "Figyeld tovĂˇbb a rendszert. Jelenleg nincs javasolt kĂ©zi teendĹ‘.";

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
      `UtolsĂł kĂ©sz job: ${relativeMinutes(health?.jobs?.lastProcessedMinutesAgo)}`;

    els.oldestQueuedJob.textContent = formatDate(health?.jobs?.oldestQueuedAt);
    els.oldestQueuedJobMeta.textContent =
      `FeldolgozĂˇsi sor Ă©letkor: ${relativeMinutes(health?.jobs?.oldestQueuedMinutes)}`;

    els.staleProcessingJobs.textContent =
      Number(health?.metrics?.staleProcessingJobs || 0);

    els.lastWebhook.textContent = formatDate(health?.webhooks?.lastReceivedAt);
    els.lastWebhookMeta.textContent =
      `UtolsĂł beĂ©rkezĂ©s: ${relativeMinutes(health?.webhooks?.lastReceivedMinutesAgo)}`;

    els.failedWebhooks24h.textContent =
      Number(health?.webhooks?.failedLast24h || 0);
    els.webhookPendingMeta.textContent =
      `BeĂ©rkezett/feldolgozĂˇs alatt: ${Number(health?.webhooks?.pendingOrProcessing || 0)}`;

    els.paidWithoutJob.textContent =
      Number(health?.sessions?.paidWithoutActiveJob?.length || 0);

    els.lastReportEmailSent.textContent = formatDate(health?.email?.lastSentAt);
    els.lastReportEmailSentMeta.textContent =
      `UtolsĂł kĂĽldĂ©s: ${relativeMinutes(health?.email?.lastSentMinutesAgo)}`;

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
      "A frissĂ­tĂ©shez add meg az admin tokent."
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
      actionsWrap.appendChild(operatorScrollButton(task.actionLabel || "MegnĂ©zem", task.targetId));
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
      els.latestSessionCard.textContent = "Nincs legutĂłbbi session a jelenlegi szĹ±rĂ©sben.";
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
      `FĂłkusz: ${text(row.detectedRisk)} Â· MĂˇsodlagos: ${text(row.secondaryRisk)} Â· Nyelv: ${text(row.lang)}`;

    const updated = document.createElement("div");
    updated.className = "latest-session-meta";
    updated.textContent = `FrissĂ­tve: ${formatDate(row.updated_at || row.created_at)}`;

    const actionWrap = document.createElement("div");
    actionWrap.className = "actions";
    actionWrap.appendChild(actionButton("RĂ©szletek", "detail", sessionId, "secondary"));
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
      els.operatorSummary.textContent = "Admin tokenre vĂˇr";
      const empty = document.createElement("div");
      empty.className = "operator-empty";
      empty.textContent = "Add meg az admin tokent, majd frissĂ­ts az operĂˇtori fĂłkusz betĂ¶ltĂ©sĂ©hez.";
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
        `${countValue(postPaymentMetrics.issueCount)} fizetĂ©s utĂˇni teendĹ‘, ${countValue(postPaymentMetrics.paidWithoutActiveJob)} fizetett session aktĂ­v job nĂ©lkĂĽl, ${countValue(postPaymentMetrics.retryLimitEmails)} email retry limit.`,
        "postPaymentPanel",
        "Post-payment"
      );
    } else if (postPaymentMonitoring?.level === "warning") {
      addOperatorTask(
        tasks,
        "warning",
        "Post-payment folyamat figyelendĹ‘",
        `${countValue(postPaymentMetrics.issueCount)} fizetĂ©s utĂˇni jelzĂ©s, ${countValue(postPaymentMetrics.unsentDoneReports)} kĂ©sz riport email nĂ©lkĂĽl.`,
        "postPaymentPanel",
        "Post-payment"
      );
    }

    if (latestAlert) {
      addOperatorTask(
        tasks,
        latestAlert.level || "warning",
        "LegutĂłbbi proaktĂ­v riasztĂˇs",
        compact(latestAlert.summary || latestAlert.alert_key, 180),
        "alertsPanel",
        "RiasztĂˇsok"
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
        "Beragadt feldolgozĂˇs",
        `${countValue(metrics.staleProcessingJobs)} processing lock 15 percnĂ©l rĂ©gebbi. EllenĹ‘rizd a worker ĂˇllapotĂˇt Ă©s a queue sort.`,
        "queuePanel",
        "Queue megnyitĂˇsa"
      );
    }

    if (countValue(queueCounts.failed) > 0 || countValue(metrics.failedJobs) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "HibĂˇs vagy retry-ra vĂˇrĂł elemzĂ©s",
        `${countValue(queueCounts.failed || metrics.failedJobs)} hibĂˇs queue/job jelzĂ©s. NĂ©zd meg a hibĂˇs sessionĂ¶ket Ă©s indĂ­ts cĂ©lzott retry-t.`,
        "failedAnalysesPanel",
        "HibĂˇk"
      );
    }

    if (countValue(email.retryLimitCount) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Email prĂłbĂˇlkozĂˇsi limit elĂ©rve",
        `${countValue(email.retryLimitCount)} riport email elĂ©rte a prĂłbĂˇlkozĂˇsi limitet. KĂ©zi ellenĹ‘rzĂ©s javasolt.`,
        "emailDeliveryPanel",
        "Email panel"
      );
    }

    if (countValue(email.failedCount) > 0 || countValue(email.retryableCount) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Email kĂ©zbesĂ­tĂ©si teendĹ‘",
        `${countValue(email.failedCount)} hibĂˇs Ă©s ${countValue(email.retryableCount)} ĂşjraprĂłbĂˇlhatĂł riport email.`,
        "emailDeliveryPanel",
        "Email panel"
      );
    }

    if (countValue(sessions.paidWithoutActiveJob?.length) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Fizetett session aktĂ­v job nĂ©lkĂĽl",
        `${countValue(sessions.paidWithoutActiveJob?.length)} fizetett session nincs aktĂ­v feldolgozĂˇsi sorhoz kĂ¶tve.`,
        "healthPanel",
        "Health panel"
      );
    }

    if (countValue(engineAnalytics?.reviewQueue?.length) > 0) {
      addOperatorTask(
        tasks,
        "info",
        "Engine dĂ¶ntĂ©s ellenĹ‘rzendĹ‘",
        `${countValue(engineAnalytics.reviewQueue.length)} alacsony confidence vagy ĂˇtfedĹ‘ mintĂˇzat vĂˇr kĂ©zi ĂˇtnĂ©zĂ©sre.`,
        "engineAnalyticsPanel",
        "Engine panel"
      );
    }

    const engineAuditSummary = engineDecisionAudit?.summary || {};

    if (countValue(engineAuditSummary.criticalSessions) > 0) {
      addOperatorTask(
        tasks,
        "critical",
        "Engine live audit kritikus eltĂ©rĂ©s",
        `${countValue(engineAuditSummary.criticalSessions)} sessionnel nem egyezik a mentett fĹ‘ dĂ¶ntĂ©s vagy hiĂˇnyzik a dĂ¶ntĂ©si input.`,
        "engineAnalyticsPanel",
        "Engine audit"
      );
    } else if (countValue(engineAuditSummary.reviewSessions) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Engine live audit ĂˇtnĂ©zendĹ‘",
        `${countValue(engineAuditSummary.reviewSessions)} Ă©les sessionnĂ©l van dĂ¶ntĂ©si, extra kĂ©rdĂ©s vagy confidence jelzĂ©s.`,
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
        "Launch checklist blokkolĂł hiba",
        `${countValue(launchReadiness.summary.failed)} blokkolĂł Ă©lesĂ­tĂ©si ellenĹ‘rzĂ©s hibĂˇt jelez.`,
        "launchPanel",
        "Launch panel"
      );
    } else if (countValue(launchReadiness?.summary?.warnings) > 0) {
      addOperatorTask(
        tasks,
        "warning",
        "Launch checklist figyelmeztetĂ©s",
        `${countValue(launchReadiness.summary.warnings)} Ă©lesĂ­tĂ©si figyelmeztetĂ©s maradt.`,
        "launchPanel",
        "Launch panel"
      );
    }

    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "operator-empty";
      empty.textContent = "Nincs azonnali operĂˇtori teendĹ‘. A fĹ‘ rendszerfolyamatok jelenleg rendben Ăˇllnak.";
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
        ? `${criticalCount} kritikus, ${warningCount} figyelendĹ‘, ${tasks.length} Ă¶sszes teendĹ‘`
        : "Nincs azonnali teendĹ‘";

    renderLatestSessionCard(recent?.items?.[0] || null);
  }

  function renderCustomerExperience(context = null) {
    if (!els.customerExperienceUpdatedAt) return;

    if (!context) {
      els.customerExperienceUpdatedAt.textContent = "MĂ©g nincs UX ĂˇllapotkĂ©p";
      els.customerExperienceTrust.textContent = "-";
      els.customerExperienceTrustMeta.textContent = "Admin tokenre vĂˇr.";
      els.customerExperienceConversion.textContent = "-";
      els.customerExperienceConversionMeta.textContent = "Checkout -> paid jelzĂ©s.";
      els.customerExperienceDelivery.textContent = "-";
      els.customerExperienceDeliveryMeta.textContent = "PDF Ă©s email teljesĂĽlĂ©s.";
      els.customerExperienceLanguage.textContent = "-";
      els.customerExperienceLanguageMeta.textContent = "Engine, checkout Ă©s bank bundle.";
      renderDeliverabilityList(els.customerExperienceRecommendationRows, [], "A frissĂ­tĂ©shez add meg az admin tokent.", () => {});
      return;
    }

    const metrics = context.dashboardMetrics?.windows?.last7d || context.dashboardMetrics?.windows?.last30d || {};
    const emailMetrics = context.emailDeliverability?.metrics || {};
    const postSummary = context.postPaymentMonitoring?.summary || {};
    const followSummary = context.followUpEmails?.summary || {};
    const i18nSummary = context.i18nQualityAudit?.summary || {};
    const i18nLevel = context.i18nQualityAudit?.level || "unknown";

    const conversionRate = Number(metrics.checkoutToPaidRate || 0);
    const deliveryRate = Number(metrics.analysisDoneToEmailSentRate || emailMetrics.successRate || 0);
    const failedFollowUps = countValue(followSummary.failed);
    const i18nCritical = countValue(i18nSummary.critical);
    const postPaymentIssues = countValue(postSummary.failed || postSummary.stuck || postSummary.actionable);
    const trustScore = Math.max(0, Math.min(100, 100 - failedFollowUps * 6 - i18nCritical * 5 - postPaymentIssues * 6));

    els.customerExperienceUpdatedAt.textContent = `FrissĂ­tve: ${formatDate(new Date().toISOString())}`;
    els.customerExperienceTrust.textContent = `${trustScore}`;
    els.customerExperienceTrustMeta.textContent =
      trustScore >= 85 ? "Stabil vĂˇsĂˇrlĂłi bizalmi jelzĂ©s." : "Van javĂ­tandĂł pont a fizetĂ©s utĂˇni Ă©lmĂ©nyben.";
    els.customerExperienceConversion.textContent = formatPercent(conversionRate);
    els.customerExperienceConversionMeta.textContent = `7 napos checkout -> paid arany, checkout: ${countValue(metrics.checkoutStarted)}`;
    els.customerExperienceDelivery.textContent = formatPercent(deliveryRate);
    els.customerExperienceDeliveryMeta.textContent = `Email hibĂˇk: ${countValue(emailMetrics.failed || emailMetrics.failures)}, follow-up hibĂˇk: ${failedFollowUps}`;
    els.customerExperienceLanguage.textContent = i18nLevel;
    els.customerExperienceLanguageMeta.textContent =
      i18nCritical ? `${i18nCritical} kritikus nyelvi jelzĂ©s.` : "Nincs kritikus nyelvi jelzĂ©s.";

    const recommendations = [];

    if (conversionRate && conversionRate < 0.45) {
      recommendations.push({
        title: "Ă–sszegzĂ©s oldali CTA tovĂˇbbi erĹ‘sĂ­tĂ©s",
        meta: "A checkout -> paid arĂˇny alacsonyabb, ezĂ©rt a tudomĂˇnyos Ă©s riport-elĹ‘ny copy kulcsfontossĂˇgĂş."
      });
    }

    if (deliveryRate && deliveryRate < 0.9) {
      recommendations.push({
        title: "Email/PDF kĂ©zbesĂ­tĂ©si folyamat figyelĂ©se",
        meta: "A vĂˇsĂˇrlĂłi bizalom legerĹ‘sebb pontja, hogy a riport gyorsan Ă©s biztosan megĂ©rkezzen."
      });
    }

    if (failedFollowUps > 0) {
      recommendations.push({
        title: "Follow-up email hibĂˇk ĂşjraprĂłbĂˇlĂˇsa",
        meta: `${failedFollowUps} follow-up email kĂ©zi ellenĹ‘rzĂ©st vagy ĂşjrafuttatĂˇst igĂ©nyel.`
      });
    }

    if (i18nLevel !== "healthy") {
      recommendations.push({
        title: "TĂ¶bbnyelvĹ± Webflow Ăˇllapot ellenĹ‘rzĂ©se",
        meta: "A nyelvi audit szerint lehet olyan nyelv vagy loader, ami nem teljesen stabil."
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        title: "UX folyamat stabil",
        meta: "A kĂ¶vetkezĹ‘ nyeresĂ©g a riport-elĹ‘nĂ©zet Ă©s a post-payment bizalmi kommunikĂˇciĂł finomĂ­tĂˇsa."
      });
    }

    renderDeliverabilityList(
      els.customerExperienceRecommendationRows,
      recommendations,
      "Nincs UX javaslat.",
      (row, item) => {
        row.innerHTML = `<strong>${compact(item.title, 80)}</strong><span>${compact(item.meta, 180)}</span>`;
      }
    );
  }

  function renderSessionTimeline(context = null) {
    if (!els.sessionTimelineRows) return;

    const items = (context?.recent?.items || []).slice(0, 8);

    renderDeliverabilityList(
      els.sessionTimelineRows,
      items,
      "Nincs session timeline adat.",
      (row, item) => {
        row.className = "engine-list-row timeline-card";

        const paid = Boolean(item.paidAt || item.stripeSessionId || item.paymentStatus === "paid");
        const analyzed = Boolean(item.analysisCompletedAt || item.analysisStatus === "completed" || item.status === "completed");
        const pdf = Boolean(item.pdfGeneratedAt || item.pdfPath || item.reportPdfPath);
        const email = item.reportEmailStatus === "sent" || Boolean(item.reportEmailSentAt);

        row.innerHTML = `
          <div>
            <strong>${compact(item.name || item.email || item.id, 80)}</strong>
            <span>${compact(item.email || item.id, 120)} Â· ${formatDate(item.createdAt)}</span>
          </div>
          <div class="timeline-steps">
            <span class="timeline-step done">Session</span>
            <span class="timeline-step ${paid ? "done" : "waiting"}">Fizetes</span>
            <span class="timeline-step ${analyzed ? "done" : "waiting"}">Elemzes</span>
            <span class="timeline-step ${pdf ? "done" : "waiting"}">PDF</span>
            <span class="timeline-step ${email ? "done" : "waiting"}">Email</span>
          </div>
        `;
      }
    );
  }

  function renderFollowUpEmails(data = null) {
    if (!els.followUpGeneratedAt) return;

    const summary = data?.summary || {};
    const items = data?.items || [];

    els.followUpGeneratedAt.textContent = data?.generatedAt
      ? `Frissitve: ${formatDate(data.generatedAt)}`
      : "MĂ©g nincs follow-up ĂˇllapotkĂ©p";
    els.followUpDue.textContent = countValue(summary.due);
    els.followUpSent.textContent = countValue(summary.sent);
    els.followUpFailed.textContent = countValue(summary.failed);

    renderDeliverabilityList(
      els.followUpRows,
      items,
      "Nincs follow-up email jelzes.",
      (row, item) => {
        row.innerHTML = `
          <div>
            <strong>${compact(item.name || item.email || item.id, 90)}</strong>
            <span>${compact(item.email || item.id, 130)}</span>
          </div>
          <div>
            <strong>${compact(item.followUpEmailStatus || "not_due", 40)}</strong>
            <span>due: ${formatDate(item.followUpEmailDueAt)} Â· sent: ${formatDate(item.followUpEmailSentAt)}</span>
          </div>
        `;
      }
    );
  }

  function renderI18nQualityAudit(data = null) {
    if (!els.i18nAuditGeneratedAt) return;

    const checks = data?.checks || [];
    const summary = data?.summary || {};

    els.i18nAuditGeneratedAt.textContent = data?.generatedAt
      ? `Frissitve: ${formatDate(data.generatedAt)}`
      : "Meg nincs nyelvi audit";
    els.i18nAuditLevel.textContent = data?.level || "-";
    els.i18nAuditSummary.textContent =
      data?.ok === false
        ? `Kritikus: ${countValue(summary.critical)}, warning: ${countValue(summary.warning)}`
        : `OK: ${countValue(summary.ok)}, warning: ${countValue(summary.warning)}`;

    renderDeliverabilityList(
      els.i18nAuditRows,
      checks.slice(0, 40),
      "Nincs nyelvi audit sor.",
      (row, item) => {
        row.innerHTML = `
          <div>
            <strong>${compact(item.label || item.key || "i18n check", 100)}</strong>
            <span>${compact(item.message || item.detail || "-", 180)}</span>
          </div>
          <span class="pill ${statusClass(item.level || item.status || "ok")}">${compact(item.level || item.status || "ok", 32)}</span>
        `;
      }
    );
  }

  async function refreshDashboard() {
    setBusy(true);
    setStatus("FrissĂ­tĂ©s...");

    try {
      const optionalApi = (path) =>
        api(path).catch((error) => ({
          ok: false,
          error: error.message
        }));

      const [
        status,
        health,
        dashboardMetrics,
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
        webflowEmbedManager,
        followUpEmails,
        i18nQualityAudit
      ] = await Promise.all([
        api("/admin/status"),
        api("/admin/production-health"),
        optionalApi("/admin/dashboard-metrics"),
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
        api("/admin/webflow-embed-manager"),
        optionalApi("/admin/follow-up-emails?limit=20"),
        optionalApi("/admin/i18n-quality-audit")
      ]);

      els.apiStatus.textContent = status.ok ? "ElĂ©rhetĹ‘" : "Hiba";
      renderHealth(health);
      renderDashboardMetrics(dashboardMetrics);
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
      renderFollowUpEmails(followUpEmails);
      renderI18nQualityAudit(i18nQualityAudit);
      renderCustomerExperience({
        dashboardMetrics,
        emailDeliverability,
        postPaymentMonitoring,
        followUpEmails,
        i18nQualityAudit
      });
      renderSessionTimeline({ recent, queue, failed });
      renderControlPulse({
        health,
        queue,
        alerts,
        engineAnalytics,
        engineDecisionAudit,
        bankQualityAudit,
        emailDeliverability,
        postPaymentMonitoring,
        followUpEmails,
        i18nQualityAudit
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
        postPaymentMonitoring,
        followUpEmails,
        i18nQualityAudit
      });
      setStatus("FrissĂ­tve.");
    } catch (error) {
      els.apiStatus.textContent = "Hiba";
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function refreshLaunchReadiness() {
    setBusy(true);
    setStatus("Ă‰lesĂ­tĂ©si ellenĹ‘rzĂ©s...");

    try {
      const launchReadiness = await api("/admin/launch-readiness");
      renderLaunchReadiness(launchReadiness);
      setStatus("Ă‰lesĂ­tĂ©si ellenĹ‘rzĂ©s frissĂ­tve.");
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
      emptyRow(els.sessionSearchRows, 5, "Adj meg keresĂ©si kifejezĂ©st.");
      return;
    }

    setBusy(true);
      setStatus("Session keresĂ©se...");

    try {
      const data = await api(
        `/admin/search-sessions?q=${encodeURIComponent(query)}&limit=30`
      );

      renderSessionRows(els.sessionSearchRows, data.items || [], "search");

      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent =
          `${Number(data.count || data.items?.length || 0)} talĂˇlat: "${query}"`;
      }

      setStatus("Session keresĂ©s kĂ©sz.");
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
    setStatus("Session betĂ¶ltĂ©se...");

    try {
      const data = await api(`/admin/session/${encodeURIComponent(sessionId)}`);
      if (els.sessionDetail) {
        els.sessionDetail.className = "session-detail";
        els.sessionDetail.replaceChildren(renderSessionDetail(data.session));
      }
      if (options.scroll) {
        window.requestAnimationFrame(scrollSessionDetailIntoView);
      }
      setStatus("Session betĂ¶ltve.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function postAction(path, successMessage) {
    setBusy(true);
    setStatus("MĹ±velet fut...");

    try {
      const data = await api(path, { method: "POST" });
      setStatus(successMessage || "MĹ±velet kĂ©sz.");
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
    setStatus("PDF letĂ¶ltĂ©se...");

    try {
      const response = await fetchAdmin(
        `/admin/session/${encodeURIComponent(sessionId)}/report-pdf`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `PDF letĂ¶ltĂ©si hiba (${response.status})`);
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

      setStatus("PDF letĂ¶ltve.");
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
        "ElemzĂ©s Ăşjra queue-ba tĂ©ve."
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
        "PDF ĂşjragenerĂˇlĂˇs ellenĹ‘rizve."
      );
      return;
    }

    if (action === "resend") {
      postAction(
        `/admin/resend-email/${encodeURIComponent(safeSessionId)}`,
        "Riport email ĂşjrakĂĽldve."
      );
      return;
    }

    if (action === "reset-email") {
      postAction(
        `/admin/reset-email-retry/${encodeURIComponent(safeSessionId)}`,
        "Email retry Ăˇllapot alaphelyzetbe tĂ©ve."
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
      saveToken(savedToken);
    }

    bindClick(els.saveTokenBtn, () => {
      const token = getToken();
      if (!token) {
        setStatus("Add meg az ADMIN_TOKEN Ă©rtĂ©kĂ©t.", true);
        return;
      }

      const saved = saveToken(token);
      if (els.token) els.token.value = saved;
      setStatus("Token mentve.");
      refreshDashboard();
    });

    bindClick(els.clearTokenBtn, () => {
      clearSavedTokens();
      if (els.token) els.token.value = "";
      showEmptyDetail();
      if (els.sessionSearchInput) els.sessionSearchInput.value = "";
      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent = "MĂ©g nem indult keresĂ©s.";
      }
      emptyRow(els.sessionSearchRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.queueRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.emailIssueRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.emailDeliveryCenterRows, 5, "A frissiteshez add meg az admin tokent.");
      emptyRow(els.alertRows, 5, "Add meg az admin tokent.");
      emptyRow(els.operationsLogRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
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
      renderFollowUpEmails(null);
      renderI18nQualityAudit(null);
      renderCustomerExperience(null);
      renderSessionTimeline(null);
      renderOperatorFocus(null);
      if (els.apiStatus) els.apiStatus.textContent = "-";
      setStatus("Token tĂ¶rĂ¶lve.");
    });

    bindClick(els.refreshBtn, refreshDashboard);
    bindClick(els.refreshLaunchReadinessBtn, refreshLaunchReadiness);
    bindClick(els.refreshEmailDeliveryCenterBtn, refreshEmailDeliveryCenter);
    bindClick(els.runFollowUpEmailsBtn, () => {
      postAction("/admin/run-follow-up-emails", "Follow-up email feldolgozas lefutott.");
    });
    bindClick(els.runFollowUpEmailsPanelBtn, () => {
      postAction("/admin/run-follow-up-emails", "Follow-up email feldolgozas lefutott.");
    });
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
      postAction("/admin/process-one-job", "Egy queued job feldolgozĂˇsa lefutott.");
    });

    bindClick(els.retryEmailBatchBtn, () => {
      postAction("/admin/retry-report-emails", "Riport email ĂşjraprĂłbĂˇlĂˇs lefutott.");
    });

    bindClick(els.postPaymentRecoveryBtn, runPostPaymentRecovery);
    bindClick(els.postPaymentRecoveryPanelBtn, runPostPaymentRecovery);

    bindClick(els.alertCheckBtn, () => {
      postAction("/admin/trigger-alert-check", "RiasztĂˇsellenĹ‘rzĂ©s lefutott.");
    });

    bindClick(els.operationalAlertBtn, () => {
      postAction(
        "/admin/trigger-operational-alert-check?minLevel=warning",
        "Operational alert ellenĹ‘rzĂ©s lefutott."
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
          postAction("/admin/process-one-job", "Egy vĂˇrakozĂł job feldolgozva.");
        }

        if (action === "retry-email") {
          postAction("/admin/retry-report-emails", "Riport email ĂşjraprĂłbĂˇlĂˇs lefutott.");
        }

        if (action === "post-payment-recovery") {
          runPostPaymentRecovery();
        }

        if (action === "alert-check") {
          postAction("/admin/trigger-alert-check", "RiasztĂˇsellenĹ‘rzĂ©s lefutott.");
        }

        if (action === "operational-alert") {
          postAction(
            "/admin/trigger-operational-alert-check?minLevel=warning",
            "Operational alert ellenĹ‘rzĂ©s lefutott."
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
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-dashboard-filter]");
      if (!button) return;

      event.preventDefault();
      applyDashboardQuickFilter(button.dataset.dashboardFilter);
    });
    emptyRow(els.sessionSearchRows, 5, "MĂ©g nem indult keresĂ©s.");

    if (savedToken) {
      refreshDashboard();
    } else {
      emptyRow(els.queueRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.sessionSearchRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.emailIssueRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      emptyRow(els.alertRows, 5, "Add meg az admin tokent.");
      emptyRow(els.operationsLogRows, 5, "A frissĂ­tĂ©shez add meg az admin tokent.");
      renderOperatorFocus(null);
      renderLaunchReadiness(null);
      renderEngineAnalytics(null);
      renderEngineDecisionAudit(null);
      renderEmailDeliverability(null);
      renderPostPaymentMonitoring(null);
      renderFollowUpEmails(null);
      renderI18nQualityAudit(null);
      renderCustomerExperience(null);
      renderSessionTimeline(null);
      renderControlPulse(null);
      setStatus("Add meg az ADMIN_TOKEN Ă©rtĂ©kĂ©t.");
    }
  }

  init();
})();


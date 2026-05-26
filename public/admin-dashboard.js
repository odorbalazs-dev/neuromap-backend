(function () {
  const TOKEN_KEY = "nm_admin_token";

  const els = {
    token: document.getElementById("adminToken"),
    saveTokenBtn: document.getElementById("saveTokenBtn"),
    clearTokenBtn: document.getElementById("clearTokenBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    processOneBtn: document.getElementById("processOneBtn"),
    retryEmailBatchBtn: document.getElementById("retryEmailBatchBtn"),
    alertCheckBtn: document.getElementById("alertCheckBtn"),
    statusText: document.getElementById("statusText"),
    controlCenterHeadline: document.getElementById("controlCenterHeadline"),
    controlCenterSummary: document.getElementById("controlCenterSummary"),
    controlScore: document.getElementById("controlScore"),
    lastSnapshotAt: document.getElementById("lastSnapshotAt"),
    pipelineStages: document.getElementById("pipelineStages"),
    riskFocus: document.getElementById("riskFocus"),
    nextAction: document.getElementById("nextAction"),
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
    alertRows: document.getElementById("alertRows"),
    emailIssueRows: document.getElementById("emailIssueRows"),
    sessionSearchInput: document.getElementById("sessionSearchInput"),
    sessionSearchBtn: document.getElementById("sessionSearchBtn"),
    sessionSearchHint: document.getElementById("sessionSearchHint"),
    sessionSearchRows: document.getElementById("sessionSearchRows"),
    operationsLogRows: document.getElementById("operationsLogRows"),
    queueRows: document.getElementById("queueRows"),
    recentRows: document.getElementById("recentRows"),
    failedRows: document.getElementById("failedRows"),
    sessionDetail: document.getElementById("sessionDetail")
  };

  let activeLogFilter = "all";

  function getToken() {
    return (els.token.value || "").trim();
  }

  function setBusy(isBusy) {
    [
      els.saveTokenBtn,
      els.clearTokenBtn,
      els.refreshBtn,
      els.processOneBtn,
      els.retryEmailBatchBtn,
      els.alertCheckBtn,
      els.sessionSearchBtn
    ].forEach((button) => {
      if (button) button.disabled = isBusy;
    });

    document.querySelectorAll("[data-control-action]").forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function setStatus(message, isError) {
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
        "failed",
        "done",
        "completed",
        "not_sent",
        "sending",
        "sent",
        "skipped",
        "healthy",
        "critical",
        "warning",
        "active",
        "info",
        "email",
        "analysis",
        "webhook",
        "checkout"
      ].includes(status)
    ) {
      return status;
    }
    return "unknown";
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
    span.textContent = text(status);
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

  function actionButton(label, action, id, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = id;
    if (className) button.className = className;
    return button;
  }

  function actions(row, includeResend = true, includeEmailReset = false) {
    const wrapper = document.createElement("div");
    wrapper.className = "actions";
    wrapper.appendChild(actionButton("Részletek", "detail", row.id, "secondary"));
    wrapper.appendChild(actionButton("PDF", "download-pdf", row.id, "secondary"));
    wrapper.appendChild(actionButton("PDF regen", "regenerate-pdf", row.id, "secondary"));
    wrapper.appendChild(actionButton("Retry", "retry", row.id, "warn"));

    if (includeResend) {
      wrapper.appendChild(actionButton("Email újraküldés", "resend", row.id, "secondary"));
    }

    if (includeEmailReset) {
      wrapper.appendChild(actionButton("Email retry reset", "reset-email", row.id, "secondary"));
    }

    return wrapper;
  }

  function emptyRow(target, colSpan, message) {
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
    els.sessionDetail.className = "session-detail empty-detail";
    els.sessionDetail.textContent = message;
  }

  function showJsonDetail(data) {
    els.sessionDetail.className = "session-detail";
    const pre = document.createElement("pre");
    pre.className = "raw-json";
    pre.textContent = JSON.stringify(data, null, 2);
    els.sessionDetail.replaceChildren(pre);
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
      inspect_then_reset_retry: "ellenőrzés, majd retry reset",
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

  function renderReportSnapshot(session) {
    const summary = session.reportSummary || {};
    const email = summary.email || {};
    const analysisRetry = summary.analysisRetry || {};
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

    card.append(title, grid, topAreas);
    return card;
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
      actionButton("Email retry reset", "reset-email", session.id, "secondary")
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

    root.append(header, grid, renderReportSnapshot(session), countsPanel, timeline, errors, preview, raw);
    return root;
  }

  function renderSessionRows(target, items, mode) {
    target.replaceChildren();

    if (!items.length) {
      emptyRow(target, mode === "failed" ? 4 : 5, "Nincs megjeleníthető adat.");
      return;
    }

    items.forEach((row) => {
      const tr = document.createElement("tr");

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
      emptyRow(els.alertRows, 5, "No proactive alerts yet.");
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

  function stageLevel({ critical = 0, warning = 0, active = 0 }) {
    if (critical > 0) return "critical";
    if (warning > 0) return "warning";
    if (active > 0) return "active";
    return "healthy";
  }

  function stageLabel(level) {
    if (level === "critical") return "Needs action";
    if (level === "warning") return "Watch";
    if (level === "active") return "Running";
    return "OK";
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
        name: "Checkout",
        level: stageLevel({
          active: countValue(queueCounts.queued) + countValue(queueCounts.processing),
          warning: countValue(queueCounts.failed)
        }),
        detail: `${countValue(queueCounts.queued)} queued, ${countValue(queueCounts.processing)} processing, ${countValue(queueCounts.failed)} failed`
      },
      {
        name: "Stripe webhook",
        level: stageLevel({
          critical: countValue(webhooks.failedLast24h),
          active: countValue(webhooks.pendingOrProcessing)
        }),
        detail: `${countValue(webhooks.failedLast24h)} failed in 24h, ${countValue(webhooks.pendingOrProcessing)} pending`
      },
      {
        name: "Worker analysis",
        level: stageLevel({
          critical: countValue(metrics.staleProcessingJobs),
          warning: countValue(jobs.counts?.failed) + countValue(metrics.paidFailedSessions),
          active: countValue(jobs.counts?.queued) + countValue(jobs.counts?.processing)
        }),
        detail: `${countValue(jobs.counts?.queued)} queued jobs, ${countValue(metrics.staleProcessingJobs)} stale locks`
      },
      {
        name: "PDF/report",
        level: stageLevel({
          warning: countValue(sessions.doneWithoutAnalysisResult?.length)
        }),
        detail: `${countValue(sessions.doneWithoutAnalysisResult?.length)} done sessions without report text`
      },
      {
        name: "Email delivery",
        level: stageLevel({
          critical: countValue(email.failedCount) + countValue(email.retryLimitCount),
          warning: countValue(email.unsentDoneCount),
          active: countValue(email.retryableCount)
        }),
        detail: `${countValue(email.failedCount)} failed, ${countValue(email.retryableCount)} retryable, ${countValue(email.retryLimitCount)} at limit`
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
      ? "All core systems look clean"
      : level === "active"
        ? "Pipeline is active"
        : level === "warning"
          ? "Operator review recommended"
          : level === "critical"
            ? "Action needed"
            : "Waiting for live data";

    els.controlCenterHeadline.textContent = levelText;
    els.controlCenterSummary.textContent = status?.ok
      ? `${issues} critical signal(s). ${countValue(queue?.counts?.queued)} queued, ${countValue(queue?.counts?.processing)} processing, ${countValue(queue?.counts?.failed)} failed sessions.`
      : "Admin API is not reachable with the current token.";

    els.controlScore.className = `control-score ${statusClass(level)}`;
    els.controlScore.querySelector("strong").textContent = level.toUpperCase();

    els.lastSnapshotAt.textContent = health?.generatedAt
      ? `Snapshot: ${formatDate(health.generatedAt)}`
      : "No snapshot yet";

    els.riskFocus.textContent = alerts?.items?.length
      ? compact(alerts.items[0].summary, 100)
      : recommendations[0] || "No current production risk detected.";

    els.nextAction.textContent = recommendations[0] || "Keep monitoring. No manual action is currently suggested.";

    renderPipelineStages(health, queue);
  }

  function renderHealth(health) {
    const level = health?.level || "-";
    const healthMetric = els.healthLevel.closest(".metric");

    els.healthLevel.textContent = level;
    healthMetric.classList.remove("healthy", "active", "warning", "critical");
    if (["healthy", "active", "warning", "critical"].includes(level)) {
      healthMetric.classList.add(level);
    }

    els.lastJobProcessed.textContent = formatDate(health?.jobs?.lastProcessedAt);
    els.lastJobProcessedMeta.textContent =
      `Utolsó kész job: ${relativeMinutes(health?.jobs?.lastProcessedMinutesAgo)}`;

    els.oldestQueuedJob.textContent = formatDate(health?.jobs?.oldestQueuedAt);
    els.oldestQueuedJobMeta.textContent =
      `Queue életkor: ${relativeMinutes(health?.jobs?.oldestQueuedMinutes)}`;

    els.staleProcessingJobs.textContent =
      Number(health?.metrics?.staleProcessingJobs || 0);

    els.lastWebhook.textContent = formatDate(health?.webhooks?.lastReceivedAt);
    els.lastWebhookMeta.textContent =
      `Utolsó beérkezés: ${relativeMinutes(health?.webhooks?.lastReceivedMinutesAgo)}`;

    els.failedWebhooks24h.textContent =
      Number(health?.webhooks?.failedLast24h || 0);
    els.webhookPendingMeta.textContent =
      `Received/processing: ${Number(health?.webhooks?.pendingOrProcessing || 0)}`;

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

  async function refreshDashboard() {
    setBusy(true);
    setStatus("Frissítés...");

    try {
      const [status, health, queue, recent, failed, operations, alerts] = await Promise.all([
        api("/admin/status"),
        api("/admin/production-health"),
        api("/admin/queue-status"),
        api("/admin/recent-sessions?limit=30"),
        api("/admin/failed-analyses?limit=30"),
        api(`/admin/operations-log?filter=${encodeURIComponent(activeLogFilter)}&limit=80`),
        api("/admin/alerts?limit=10")
      ]);

      els.apiStatus.textContent = status.ok ? "OK" : "Hiba";
      renderHealth(health);
      renderCounts(queue.counts || {});
      renderSessionRows(els.queueRows, queue.items || [], "queue");
      renderSessionRows(els.recentRows, recent.items || [], "recent");
      renderSessionRows(els.failedRows, failed.items || [], "failed");
      renderOperationLogRows(operations.items || []);
      renderAlertRows(alerts.items || []);
      renderControlCenter(status, health, queue, alerts);
      setStatus("Frissítve.");
    } catch (error) {
      els.apiStatus.textContent = "Hiba";
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function searchSessions() {
    const query = (els.sessionSearchInput?.value || "").trim();

    if (!query) {
      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent = "Enter an email, name, session ID, or Stripe ID.";
      }
      emptyRow(els.sessionSearchRows, 5, "Adj meg keresesi kifejezest.");
      return;
    }

    setBusy(true);
    setStatus("Session keresese...");

    try {
      const data = await api(
        `/admin/search-sessions?q=${encodeURIComponent(query)}&limit=30`
      );

      renderSessionRows(els.sessionSearchRows, data.items || [], "search");

      if (els.sessionSearchHint) {
        els.sessionSearchHint.textContent =
          `${Number(data.count || data.items?.length || 0)} talalat: "${query}"`;
      }

      setStatus("Session kereses kesz.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function loadSessionDetail(sessionId) {
    setBusy(true);
    setStatus("Session betöltése...");

    try {
      const data = await api(`/admin/session/${encodeURIComponent(sessionId)}`);
      els.sessionDetail.className = "session-detail";
      els.sessionDetail.replaceChildren(renderSessionDetail(data.session));
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

  function handleActionClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const sessionId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "detail") {
      loadSessionDetail(sessionId);
    }

    if (action === "retry") {
      postAction(
        `/admin/retry-analysis/${encodeURIComponent(sessionId)}`,
        "Elemzés újra queue-ba téve."
      );
    }

    if (action === "download-pdf") {
      downloadReportPdf(sessionId);
    }

    if (action === "regenerate-pdf") {
      postAction(
        `/admin/session/${encodeURIComponent(sessionId)}/regenerate-pdf`,
        "PDF újragenerálás ellenőrizve."
      );
    }

    if (action === "resend") {
      postAction(
        `/admin/resend-email/${encodeURIComponent(sessionId)}`,
        "Riport email újraküldve."
      );
    }

    if (action === "reset-email") {
      postAction(
        `/admin/reset-email-retry/${encodeURIComponent(sessionId)}`,
        "Email retry állapot alaphelyzetbe téve."
      );
    }
  }

  function init() {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      els.token.value = savedToken;
    }

    els.saveTokenBtn.addEventListener("click", () => {
      localStorage.setItem(TOKEN_KEY, getToken());
      setStatus("Token mentve.");
      refreshDashboard();
    });

    els.clearTokenBtn.addEventListener("click", () => {
      localStorage.removeItem(TOKEN_KEY);
      els.token.value = "";
      showEmptyDetail();
      els.sessionSearchInput.value = "";
      els.sessionSearchHint.textContent = "No search yet.";
      emptyRow(els.sessionSearchRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.queueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.emailIssueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.alertRows, 5, "Add meg az admin tokent.");
      emptyRow(els.operationsLogRows, 5, "A frissítéshez add meg az admin tokent.");
      renderCounts({});
      renderHealth(null);
      renderControlCenter(null, null, { counts: {} }, { items: [] });
      els.apiStatus.textContent = "-";
      setStatus("Token törölve.");
    });

    els.refreshBtn.addEventListener("click", refreshDashboard);
    els.sessionSearchBtn.addEventListener("click", searchSessions);
    els.sessionSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchSessions();
      }
    });

    els.processOneBtn.addEventListener("click", () => {
      postAction("/admin/process-one-job", "Egy queued job feldolgozása lefutott.");
    });

    els.retryEmailBatchBtn.addEventListener("click", () => {
      postAction("/admin/retry-report-emails", "Email retry batch lefutott.");
    });

    els.alertCheckBtn.addEventListener("click", () => {
      postAction("/admin/trigger-alert-check", "Alert check lefutott.");
    });

    document.querySelectorAll("[data-control-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.controlAction;

        if (action === "refresh") {
          refreshDashboard();
        }

        if (action === "process-job") {
          postAction("/admin/process-one-job", "Egy queued job processed.");
        }

        if (action === "retry-email") {
          postAction("/admin/retry-report-emails", "Email retry batch lefutott.");
        }

        if (action === "alert-check") {
          postAction("/admin/trigger-alert-check", "Alert check lefutott.");
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
    emptyRow(els.sessionSearchRows, 5, "No search yet.");

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
      setStatus("Add meg az ADMIN_TOKEN értékét.");
    }
  }

  init();
})();

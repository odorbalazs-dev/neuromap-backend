(function () {
  const TOKEN_KEY = "nm_admin_token";

  const els = {
    token: document.getElementById("adminToken"),
    saveTokenBtn: document.getElementById("saveTokenBtn"),
    clearTokenBtn: document.getElementById("clearTokenBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    processOneBtn: document.getElementById("processOneBtn"),
    statusText: document.getElementById("statusText"),
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
    healthRecommendations: document.getElementById("healthRecommendations"),
    queueRows: document.getElementById("queueRows"),
    recentRows: document.getElementById("recentRows"),
    failedRows: document.getElementById("failedRows"),
    sessionDetail: document.getElementById("sessionDetail")
  };

  function getToken() {
    return (els.token.value || "").trim();
  }

  function setBusy(isBusy) {
    [
      els.saveTokenBtn,
      els.clearTokenBtn,
      els.refreshBtn,
      els.processOneBtn
    ].forEach((button) => {
      if (button) button.disabled = isBusy;
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
    if (["queued", "processing", "failed", "done", "completed"].includes(status)) {
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

  function actions(row, includeResend = true) {
    const wrapper = document.createElement("div");
    wrapper.className = "actions";
    wrapper.appendChild(actionButton("Részletek", "detail", row.id, "secondary"));
    wrapper.appendChild(actionButton("Retry", "retry", row.id, "warn"));

    if (includeResend) {
      wrapper.appendChild(actionButton("Email újraküldés", "resend", row.id, "secondary"));
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

  function renderCounts(counts = {}) {
    els.queuedCount.textContent = Number(counts.queued || 0);
    els.processingCount.textContent = Number(counts.processing || 0);
    els.failedCount.textContent = Number(counts.failed || 0);
    els.doneCount.textContent = Number(counts.completed || counts.done || 0);
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
      const [status, health, queue, recent, failed] = await Promise.all([
        api("/admin/status"),
        api("/admin/production-health"),
        api("/admin/queue-status"),
        api("/admin/recent-sessions?limit=30"),
        api("/admin/failed-analyses?limit=30")
      ]);

      els.apiStatus.textContent = status.ok ? "OK" : "Hiba";
      renderHealth(health);
      renderCounts(queue.counts || {});
      renderSessionRows(els.queueRows, queue.items || [], "queue");
      renderSessionRows(els.recentRows, recent.items || [], "recent");
      renderSessionRows(els.failedRows, failed.items || [], "failed");
      setStatus("Frissítve.");
    } catch (error) {
      els.apiStatus.textContent = "Hiba";
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
      els.sessionDetail.textContent = JSON.stringify(data.session, null, 2);
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
      els.sessionDetail.textContent = JSON.stringify(data, null, 2);
      await refreshDashboard();
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

    if (action === "resend") {
      postAction(
        `/admin/resend-email/${encodeURIComponent(sessionId)}`,
        "Riport email újraküldve."
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
      els.sessionDetail.textContent = "Nincs kiválasztott session.";
      emptyRow(els.queueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissítéshez add meg az admin tokent.");
      renderCounts({});
      renderHealth(null);
      els.apiStatus.textContent = "-";
      setStatus("Token törölve.");
    });

    els.refreshBtn.addEventListener("click", refreshDashboard);
    els.processOneBtn.addEventListener("click", () => {
      postAction("/admin/process-one-job", "Egy queued job feldolgozása lefutott.");
    });

    document.addEventListener("click", handleActionClick);

    if (savedToken) {
      refreshDashboard();
    } else {
      emptyRow(els.queueRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.recentRows, 5, "A frissítéshez add meg az admin tokent.");
      emptyRow(els.failedRows, 4, "A frissítéshez add meg az admin tokent.");
      setStatus("Add meg az ADMIN_TOKEN értékét.");
    }
  }

  init();
})();

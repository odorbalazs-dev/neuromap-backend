export function getAdminDashboard(_req, res) {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "connect-src 'self'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'"
    ].join("; ")
  );

  res.type("html").status(200).send(`<!doctype html>
<html lang="hu">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NeuroMap Control Center</title>
    <link rel="stylesheet" href="/public/admin-dashboard.css">
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">NeuroMap Kids</p>
          <h1>Control Center</h1>
          <p class="topbar-copy">Live operations cockpit for checkout, analysis, PDF, email delivery, and alerts.</p>
        </div>
        <div class="token-box">
          <label for="adminToken">Admin token</label>
          <div class="token-row">
            <input id="adminToken" type="password" autocomplete="off" placeholder="ADMIN_TOKEN">
            <button id="saveTokenBtn" type="button">Mentés</button>
          </div>
        </div>
      </header>

      <section class="toolbar" aria-label="Admin műveletek">
        <button id="refreshBtn" type="button">Frissítés</button>
        <button id="processOneBtn" type="button">1 queued job futtatása</button>
        <button id="retryEmailBatchBtn" type="button" class="warn">Email retry batch</button>
        <button id="alertCheckBtn" type="button" class="secondary">Alert check</button>
        <button id="clearTokenBtn" type="button" class="secondary">Token törlése</button>
        <span id="statusText" class="status-text" role="status"></span>
      </section>

      <section class="control-center" aria-label="Control Center overview">
        <article class="control-hero">
          <div>
            <p class="eyebrow">System state</p>
            <h2 id="controlCenterHeadline">Waiting for secure admin token</h2>
            <p id="controlCenterSummary">Add ADMIN_TOKEN, then refresh to load the live production snapshot.</p>
          </div>
          <div class="control-score" id="controlScore">
            <span>Health</span>
            <strong>-</strong>
          </div>
        </article>

        <article class="command-panel">
          <div class="panel-head compact">
            <div>
              <h2>Command panel</h2>
              <p>High-signal operational controls for the full report pipeline.</p>
            </div>
          </div>
          <div class="command-grid">
            <button type="button" data-control-action="refresh">Refresh snapshot</button>
            <button type="button" data-control-action="process-job" class="secondary">Process 1 job</button>
            <button type="button" data-control-action="retry-email" class="warn">Retry report emails</button>
            <button type="button" data-control-action="alert-check" class="secondary">Run alert check</button>
          </div>
        </article>
      </section>

      <section class="pipeline-panel panel" aria-label="Pipeline cockpit">
        <div class="panel-head">
          <div>
            <h2>Pipeline cockpit</h2>
            <p>Checkout -> Stripe webhook -> worker analysis -> PDF/report -> email delivery.</p>
          </div>
          <span id="lastSnapshotAt" class="snapshot-time">No snapshot yet</span>
        </div>
        <div id="pipelineStages" class="pipeline-stages"></div>
        <div class="risk-strip">
          <div>
            <span class="risk-label">Current focus</span>
            <strong id="riskFocus">-</strong>
          </div>
          <div>
            <span class="risk-label">Recommended next action</span>
            <strong id="nextAction">Add ADMIN_TOKEN and refresh.</strong>
          </div>
        </div>
      </section>

      <section class="metrics" aria-label="Állapot összegzés">
        <article class="metric">
          <span>Admin API</span>
          <strong id="apiStatus">-</strong>
        </article>
        <article class="metric health">
          <span>Production health</span>
          <strong id="healthLevel">-</strong>
        </article>
        <article class="metric">
          <span>Queued</span>
          <strong id="queuedCount">0</strong>
        </article>
        <article class="metric">
          <span>Processing</span>
          <strong id="processingCount">0</strong>
        </article>
        <article class="metric danger">
          <span>Failed</span>
          <strong id="failedCount">0</strong>
        </article>
        <article class="metric">
          <span>Done</span>
          <strong id="doneCount">0</strong>
        </article>
      </section>

      <section class="panel health-panel">
        <div class="panel-head">
          <div>
            <h2>Production Health Panel</h2>
            <p>Stripe webhook, worker queue és fizetett session állapotok egy helyen.</p>
          </div>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Worker utolsó kész job</span>
            <strong id="lastJobProcessed">-</strong>
            <p id="lastJobProcessedMeta">-</p>
          </article>
          <article class="health-card">
            <span>Legrégebbi queued job</span>
            <strong id="oldestQueuedJob">-</strong>
            <p id="oldestQueuedJobMeta">-</p>
          </article>
          <article class="health-card">
            <span>Beragadt processing job</span>
            <strong id="staleProcessingJobs">0</strong>
            <p>15 percnél régebbi processing lock.</p>
          </article>
          <article class="health-card">
            <span>Utolsó webhook</span>
            <strong id="lastWebhook">-</strong>
            <p id="lastWebhookMeta">-</p>
          </article>
          <article class="health-card">
            <span>Webhook hiba 24h</span>
            <strong id="failedWebhooks24h">0</strong>
            <p id="webhookPendingMeta">-</p>
          </article>
          <article class="health-card">
            <span>Fizetett, aktív job nélkül</span>
            <strong id="paidWithoutJob">0</strong>
            <p>Queued/processing session aktív queue sor nélkül.</p>
          </article>
          <article class="health-card">
            <span>Utolsó riport email</span>
            <strong id="lastReportEmailSent">-</strong>
            <p id="lastReportEmailSentMeta">-</p>
          </article>
          <article class="health-card">
            <span>Email delivery hiba</span>
            <strong id="failedReportEmails">0</strong>
            <p>Failed riport email küldések.</p>
          </article>
          <article class="health-card">
            <span>Kész, de nincs email</span>
            <strong id="unsentDoneReports">0</strong>
            <p>Done riport sent státusz nélkül.</p>
          </article>
          <article class="health-card">
            <span>Email retryable</span>
            <strong id="retryableReportEmails">0</strong>
            <p>Automatikusan vagy gombbal ujraprobalhato.</p>
          </article>
          <article class="health-card">
            <span>Retry limit</span>
            <strong id="retryLimitReportEmails">0</strong>
            <p>Max probalkozast elert riport emailek.</p>
          </article>
        </div>
        <div class="health-recommendations">
          <h3>Teendők</h3>
          <ul id="healthRecommendations"></ul>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Proactive alerts</h2>
            <p>Critical production health alerts sent to the admin email.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Recipient</th>
              </tr>
            </thead>
            <tbody id="alertRows"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Email delivery figyelés</h2>
            <p>Elkészült riportok, ahol az email küldés hibás, félbemaradt vagy még nincs sent státuszban.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email státusz</th>
                <th>Név / email</th>
                <th>Próbálkozás</th>
                <th>Hiba</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody id="emailIssueRows"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Operations log</h2>
            <p>Webhook, analysis, checkout es email esemenyek idorendben.</p>
          </div>
          <div class="filter-row" aria-label="Operations log filters">
            <button type="button" class="secondary log-filter active" data-log-filter="all">All</button>
            <button type="button" class="secondary log-filter" data-log-filter="critical">Critical</button>
            <button type="button" class="secondary log-filter" data-log-filter="email">Email</button>
            <button type="button" class="secondary log-filter" data-log-filter="analysis">Analysis</button>
            <button type="button" class="secondary log-filter" data-log-filter="webhook">Webhook</button>
            <button type="button" class="secondary log-filter" data-log-filter="checkout">Checkout</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Idopont</th>
                <th>Tipus</th>
                <th>Allapot</th>
                <th>Session</th>
                <th>Reszlet</th>
              </tr>
            </thead>
            <tbody id="operationsLogRows"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Queue figyelés</h2>
            <p>Fizetett, még feldolgozás alatt álló vagy hibás sessionök.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Állapot</th>
                <th>Név / email</th>
                <th>Fókusz</th>
                <th>Frissítve</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody id="queueRows"></tbody>
          </table>
        </div>
      </section>

      <section class="grid">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Legutóbbi sessionök</h2>
              <p>Gyors áttekintés az utolsó aktivitásokról.</p>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Állapot</th>
                  <th>Név / email</th>
                  <th>Fókusz</th>
                  <th>Létrehozva</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody id="recentRows"></tbody>
            </table>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Hibás elemzések</h2>
              <p>Retry vagy részletes hibaszöveg ellenőrzése.</p>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Név / email</th>
                  <th>Hiba</th>
                  <th>Frissítve</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody id="failedRows"></tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="panel detail-panel" aria-live="polite">
        <div class="panel-head">
          <div>
            <h2>Session részletek</h2>
            <p>Válassz egy sort a pontos payload/report állapothoz.</p>
          </div>
        </div>
        <pre id="sessionDetail">Nincs kiválasztott session.</pre>
      </section>
    </main>

    <script src="/public/admin-dashboard.js"></script>
  </body>
</html>`);
}

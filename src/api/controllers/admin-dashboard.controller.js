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
    <title>NeuroMap Vezérlőközpont</title>
    <link rel="stylesheet" href="/public/admin-dashboard.css">
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">NeuroMap Kids</p>
          <h1>Vezérlőközpont</h1>
          <p class="topbar-copy">Éles működési felület a fizetés, elemzés, PDF, email kézbesítés és riasztások követéséhez.</p>
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
        <button id="processOneBtn" type="button">1 várakozó job futtatása</button>
        <button id="retryEmailBatchBtn" type="button" class="warn">Riport emailek újrapróbálása</button>
        <button id="alertCheckBtn" type="button" class="secondary">Riasztásellenőrzés</button>
        <button id="clearTokenBtn" type="button" class="secondary">Token törlése</button>
        <span id="statusText" class="status-text" role="status"></span>
      </section>

      <section class="control-center" aria-label="Vezérlőközpont áttekintés">
        <article class="control-hero">
          <div>
            <p class="eyebrow">Rendszerállapot</p>
            <h2 id="controlCenterHeadline">Biztonságos admin tokenre vár</h2>
            <p id="controlCenterSummary">Add meg az ADMIN_TOKEN értékét, majd frissíts az éles állapot betöltéséhez.</p>
          </div>
          <div class="control-score" id="controlScore">
            <span>Állapot</span>
            <strong>-</strong>
          </div>
        </article>

        <article class="command-panel">
          <div class="panel-head compact">
            <div>
              <h2>Műveleti panel</h2>
              <p>Gyors beavatkozási gombok a teljes riportfolyamathoz.</p>
            </div>
          </div>
          <div class="command-grid">
            <button type="button" data-control-action="refresh">Állapot frissítése</button>
            <button type="button" data-control-action="process-job" class="secondary">1 job feldolgozása</button>
            <button type="button" data-control-action="retry-email" class="warn">Riport emailek újrapróbálása</button>
            <button type="button" data-control-action="alert-check" class="secondary">Riasztásellenőrzés</button>
          </div>
        </article>
      </section>

      <section class="pipeline-panel panel" aria-label="Folyamat áttekintés">
        <div class="panel-head">
          <div>
            <h2>Folyamat áttekintés</h2>
            <p>Fizetés indítása -> Stripe webhook -> worker elemzés -> PDF/riport -> email kézbesítés.</p>
          </div>
          <span id="lastSnapshotAt" class="snapshot-time">Még nincs állapotkép</span>
        </div>
        <div id="pipelineStages" class="pipeline-stages"></div>
        <div class="risk-strip">
          <div>
            <span class="risk-label">Aktuális fókusz</span>
            <strong id="riskFocus">-</strong>
          </div>
          <div>
            <span class="risk-label">Javasolt következő lépés</span>
            <strong id="nextAction">Add meg az ADMIN_TOKEN értékét, majd frissíts.</strong>
          </div>
        </div>
      </section>

      <section class="panel launch-panel" aria-label="Élesítési ellenőrzés">
        <div class="panel-head">
          <div>
            <h2>Élesítési ellenőrzés</h2>
            <p>Automatikus launch checklist a konfiguráció, adatbázis, deploy, assetek és kritikus folyamatállapot ellenőrzéséhez.</p>
          </div>
          <button id="refreshLaunchReadinessBtn" type="button" class="secondary">Launch ellenőrzés</button>
        </div>
        <div class="launch-summary">
          <div class="launch-score" id="launchReadinessLevel">
            <span>Launch állapot</span>
            <strong>-</strong>
          </div>
          <div class="launch-copy">
            <strong id="launchReadinessSummary">Add meg az admin tokent, majd frissíts.</strong>
            <span id="launchReadinessGeneratedAt">Még nincs ellenőrzés.</span>
          </div>
        </div>
        <div id="launchReadinessChecks" class="launch-checks"></div>
        <div class="launch-manual">
          <h3>Kézi élesítési kontrollok</h3>
          <ul id="launchManualChecks"></ul>
        </div>
      </section>

      <section class="metrics" aria-label="Állapot összegzés">
        <article class="metric">
          <span>Admin API</span>
          <strong id="apiStatus">-</strong>
        </article>
        <article class="metric health">
          <span>Éles rendszerállapot</span>
          <strong id="healthLevel">-</strong>
        </article>
        <article class="metric">
          <span>Várakozik</span>
          <strong id="queuedCount">0</strong>
        </article>
        <article class="metric">
          <span>Feldolgozás alatt</span>
          <strong id="processingCount">0</strong>
        </article>
        <article class="metric danger">
          <span>Hibás</span>
          <strong id="failedCount">0</strong>
        </article>
        <article class="metric">
          <span>Kész</span>
          <strong id="doneCount">0</strong>
        </article>
      </section>

      <section class="panel health-panel">
        <div class="panel-head">
          <div>
            <h2>Éles rendszer állapota</h2>
            <p>Stripe webhook, worker feldolgozási sor és fizetett session állapotok egy helyen.</p>
          </div>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Worker utolsó kész job</span>
            <strong id="lastJobProcessed">-</strong>
            <p id="lastJobProcessedMeta">-</p>
          </article>
          <article class="health-card">
            <span>Legrégebbi várakozó job</span>
            <strong id="oldestQueuedJob">-</strong>
            <p id="oldestQueuedJobMeta">-</p>
          </article>
          <article class="health-card">
            <span>Beragadt feldolgozás</span>
            <strong id="staleProcessingJobs">0</strong>
            <p>15 percnél régebbi processing lock.</p>
          </article>
          <article class="health-card">
            <span>Utolsó webhook</span>
            <strong id="lastWebhook">-</strong>
            <p id="lastWebhookMeta">-</p>
          </article>
          <article class="health-card">
            <span>Webhook hiba 24 órában</span>
            <strong id="failedWebhooks24h">0</strong>
            <p id="webhookPendingMeta">-</p>
          </article>
          <article class="health-card">
            <span>Fizetett session aktív job nélkül</span>
            <strong id="paidWithoutJob">0</strong>
            <p>Várakozó vagy feldolgozás alatti session aktív queue sor nélkül.</p>
          </article>
          <article class="health-card">
            <span>Utolsó riport email</span>
            <strong id="lastReportEmailSent">-</strong>
            <p id="lastReportEmailSentMeta">-</p>
          </article>
          <article class="health-card">
            <span>Email kézbesítési hiba</span>
            <strong id="failedReportEmails">0</strong>
            <p>Hibára futott riport email küldések.</p>
          </article>
          <article class="health-card">
            <span>Kész, de nincs email</span>
            <strong id="unsentDoneReports">0</strong>
            <p>Kész riport elküldött státusz nélkül.</p>
          </article>
          <article class="health-card">
            <span>Újrapróbálható email</span>
            <strong id="retryableReportEmails">0</strong>
            <p>Automatikusan vagy gombbal újrapróbálható.</p>
          </article>
          <article class="health-card">
            <span>Próbálkozási limit</span>
            <strong id="retryLimitReportEmails">0</strong>
            <p>Maximum próbálkozást elért riport emailek.</p>
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
            <h2>Proaktív riasztások</h2>
            <p>Kritikus éles rendszerállapot-riasztások az admin email címre.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Időpont</th>
                <th>Szint</th>
                <th>Állapot</th>
                <th>Összegzés</th>
                <th>Címzett</th>
              </tr>
            </thead>
            <tbody id="alertRows"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Email kézbesítés figyelés</h2>
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

      <section class="panel session-search-panel">
        <div class="panel-head">
          <div>
            <h2>Session keresés</h2>
            <p>Session keresése ID, email, név vagy Stripe checkout session ID alapján.</p>
          </div>
          <div class="search-row" role="search">
            <input id="sessionSearchInput" type="search" autocomplete="off" placeholder="Email, név, session ID, Stripe ID">
            <button id="sessionSearchBtn" type="button">Keresés</button>
          </div>
        </div>
        <div class="search-meta">
          <span id="sessionSearchHint">Még nem indult keresés.</span>
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
            <tbody id="sessionSearchRows"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Műveleti napló</h2>
            <p>Webhook, elemzés, checkout és email események időrendben.</p>
          </div>
          <div class="filter-row" aria-label="Műveleti napló szűrők">
            <button type="button" class="secondary log-filter active" data-log-filter="all">Összes</button>
            <button type="button" class="secondary log-filter" data-log-filter="critical">Kritikus</button>
            <button type="button" class="secondary log-filter" data-log-filter="email">Email</button>
            <button type="button" class="secondary log-filter" data-log-filter="analysis">Elemzés</button>
            <button type="button" class="secondary log-filter" data-log-filter="webhook">Webhook</button>
            <button type="button" class="secondary log-filter" data-log-filter="checkout">Fizetés</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Időpont</th>
                <th>Típus</th>
                <th>Állapot</th>
                <th>Session</th>
                <th>Részlet</th>
              </tr>
            </thead>
            <tbody id="operationsLogRows"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Feldolgozási sor figyelés</h2>
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
              <p>Újraindítás vagy részletes hibaszöveg ellenőrzése.</p>
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
            <p>Olvasható idővonal, payload/riport állapot és közvetlen helyreállítási műveletek.</p>
          </div>
        </div>
        <div id="sessionDetail" class="session-detail empty-detail">Nincs kiválasztott session.</div>
      </section>
    </main>

    <script src="/public/admin-dashboard.js"></script>
  </body>
</html>`);
}

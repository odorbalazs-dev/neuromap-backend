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
    <title>NeuroMap Admin</title>
    <link rel="stylesheet" href="/public/admin-dashboard.css">
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">NeuroMap Kids</p>
          <h1>Admin monitor</h1>
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
        <button id="clearTokenBtn" type="button" class="secondary">Token törlése</button>
        <span id="statusText" class="status-text" role="status"></span>
      </section>

      <section class="metrics" aria-label="Állapot összegzés">
        <article class="metric">
          <span>Admin API</span>
          <strong id="apiStatus">-</strong>
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

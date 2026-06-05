const ADMIN_DASHBOARD_ASSET_VERSION = "20260604-customer-experience-v3";

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
    <link rel="stylesheet" href="/public/admin-dashboard.css?v=${ADMIN_DASHBOARD_ASSET_VERSION}">
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
        <button id="postPaymentRecoveryBtn" type="button" class="warn">Post-payment recovery v2</button>
        <button id="alertCheckBtn" type="button" class="secondary">Riasztásellenőrzés</button>
        <button id="operationalAlertBtn" type="button" class="secondary">Operational alert</button>
        <button id="runFollowUpEmailsBtn" type="button" class="secondary">Follow-up email</button>
        <button id="clearTokenBtn" type="button" class="secondary">Token törlése</button>
        <button id="bankQualityAlertBtn" type="button" class="secondary">Bank audit riasztas</button>
        <span id="statusText" class="status-text" role="status"></span>
      </section>

      <nav class="quick-nav" aria-label="Dashboard gyors navigáció">
        <button type="button" data-scroll-target="controlPulsePanel">Pulzus</button>
        <button type="button" data-scroll-target="customerMetricsPanel">Metrikak</button>
        <button type="button" data-scroll-target="customerExperiencePanel">UX KPI</button>
        <button type="button" data-scroll-target="operatorFocusPanel">Teendők</button>
        <button type="button" data-scroll-target="sessionTimelinePanel">Timeline</button>
        <button type="button" data-scroll-target="pipelinePanel">Folyamat</button>
        <button type="button" data-scroll-target="postPaymentPanel">Post-payment</button>
        <button type="button" data-scroll-target="followUpPanel">Follow-up</button>
        <button type="button" data-scroll-target="webflowEmbedPanel">Webflow embedek</button>
        <button type="button" data-scroll-target="i18nAuditPanel">I18n audit</button>
        <button type="button" data-scroll-target="queuePanel">Queue</button>
        <button type="button" data-scroll-target="emailDeliveryPanel">Email</button>
        <button type="button" data-scroll-target="engineAnalyticsPanel">Engine</button>
        <button type="button" data-scroll-target="operationsLogPanel">Napló</button>
        <button type="button" data-scroll-target="sessionListsPanel">Session listák</button>
        <button type="button" data-scroll-target="sessionDetailPanel">Részletek</button>
      </nav>

      <section id="controlCenterPanel" class="control-center" aria-label="Vezérlőközpont áttekintés">
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
            <button type="button" data-control-action="post-payment-recovery" class="warn">Post-payment recovery v2</button>
            <button type="button" data-control-action="alert-check" class="secondary">Riasztásellenőrzés</button>
            <button type="button" data-control-action="operational-alert" class="secondary">Operational alert</button>
            <button type="button" data-control-action="bank-quality-alert" class="secondary">Bank audit riasztas</button>
          </div>
        </article>
      </section>

      <section id="controlPulsePanel" class="panel control-pulse-panel" aria-label="Admin Control Center v2 gyors pulzus">
        <div class="panel-head">
          <div>
            <h2>Control Center v2 pulzus</h2>
            <p>Azonnali, muveleti szintu allapotkep: fizetes, worker, email, engine es riasztasok.</p>
          </div>
          <span id="controlPulseUpdatedAt" class="snapshot-time">Meg nincs pulzus</span>
        </div>
        <div class="control-pulse-grid">
          <article id="pulseCheckout" class="pulse-card">
            <span>Checkout</span>
            <strong>-</strong>
            <p>Fizetett session / aktiv feldolgozas</p>
          </article>
          <article id="pulseWorker" class="pulse-card">
            <span>Worker</span>
            <strong>-</strong>
            <p>Queue, lock es feldolgozasi allapot</p>
          </article>
          <article id="pulseEmail" class="pulse-card">
            <span>Email</span>
            <strong>-</strong>
            <p>Riport kezbesites es retry allapot</p>
          </article>
          <article id="pulseEngine" class="pulse-card">
            <span>Engine</span>
            <strong>-</strong>
            <p>Dontesi audit es atnezendo mintak</p>
          </article>
          <article id="pulseAlerts" class="pulse-card">
            <span>Riasztas</span>
            <strong>-</strong>
            <p>Utolso proaktiv jelzes</p>
          </article>
        </div>
      </section>

      <section id="customerMetricsPanel" class="panel customer-metrics-panel" aria-label="Vasarloi ut metrikak">
        <div class="panel-head">
          <div>
            <h2>Vasarloi ut metrikak</h2>
            <p>Konverzio, riportkeszites, email kezbesites, queue es webhook allapot egy osszefoglalo panelen.</p>
          </div>
          <span id="dashboardMetricsUpdatedAt" class="snapshot-time">Meg nincs metrika</span>
        </div>
        <div class="metrics-kpi-grid">
          <article class="health-card metric-kpi">
            <span>Allapot</span>
            <strong id="dashboardMetricsLevel">-</strong>
            <p id="dashboardMetricsLevelMeta">Admin tokenre var.</p>
          </article>
          <article class="health-card metric-kpi">
            <span>24h fizetett</span>
            <strong id="dashboardMetricsPaid24h">0</strong>
            <p id="dashboardMetricsRevenue24h">Becsult bevetel: $0</p>
          </article>
          <article class="health-card metric-kpi">
            <span>7d checkout -> paid</span>
            <strong id="dashboardMetricsConversion7d">-</strong>
            <p id="dashboardMetricsCheckout7d">Checkout inditas: 0</p>
          </article>
          <article class="health-card metric-kpi">
            <span>Email teljesules</span>
            <strong id="dashboardMetricsEmailRate7d">-</strong>
            <p id="dashboardMetricsEmailMeta7d">Kesz riport -> sent email</p>
          </article>
          <article class="health-card metric-kpi">
            <span>Queue kockazat</span>
            <strong id="dashboardMetricsQueueRisk">0</strong>
            <p id="dashboardMetricsQueueMeta">Beragadt / regi job</p>
          </article>
          <article class="health-card metric-kpi">
            <span>Webhook 24h</span>
            <strong id="dashboardMetricsWebhookRisk">0</strong>
            <p id="dashboardMetricsWebhookMeta">Failed webhook</p>
          </article>
        </div>
        <div class="dashboard-metrics-grid">
          <article class="engine-card">
            <h3>14 napos trend</h3>
            <div id="dashboardMetricsTrendRows" class="metrics-trend-list"></div>
          </article>
          <article class="engine-card">
            <h3>Engine fokuszok</h3>
            <div id="dashboardMetricsDomainRows" class="engine-bars"></div>
          </article>
          <article class="engine-card metrics-recommendations-card">
            <h3>Metrika javaslatok</h3>
            <div id="dashboardMetricsRecommendationRows" class="engine-list"></div>
          </article>
        </div>
      </section>

      <section id="customerExperiencePanel" class="panel" aria-label="Vasarloi elmeny KPI">
        <div class="panel-head">
          <div>
            <h2>Vasarloi elmeny KPI</h2>
            <p>Bizalom, kivancsisag, fizetes utani biztonsag es nyelvi stabilitas egy operativ nezetben.</p>
          </div>
          <span id="customerExperienceUpdatedAt" class="snapshot-time">Meg nincs UX allapotkep</span>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Bizalmi score</span>
            <strong id="customerExperienceTrust">-</strong>
            <p id="customerExperienceTrustMeta">Admin tokenre var.</p>
          </article>
          <article class="health-card">
            <span>Konverzios lendulet</span>
            <strong id="customerExperienceConversion">-</strong>
            <p id="customerExperienceConversionMeta">Checkout -> paid jelzes.</p>
          </article>
          <article class="health-card">
            <span>Riport eleres</span>
            <strong id="customerExperienceDelivery">-</strong>
            <p id="customerExperienceDeliveryMeta">PDF es email teljesules.</p>
          </article>
          <article class="health-card">
            <span>Nyelvi lefedettseg</span>
            <strong id="customerExperienceLanguage">-</strong>
            <p id="customerExperienceLanguageMeta">Engine, checkout es bank bundle.</p>
          </article>
        </div>
        <div id="customerExperienceRecommendationRows" class="engine-list"></div>
      </section>

      <section id="sessionTimelinePanel" class="panel" aria-label="Session timeline">
        <div class="panel-head">
          <div>
            <h2>Session timeline</h2>
            <p>Legutobbi sessionok allapotutja: checkout, fizetes, elemzes, PDF es email.</p>
          </div>
        </div>
        <div id="sessionTimelineRows" class="timeline-list"></div>
      </section>

      <section id="operatorFocusPanel" class="panel operator-panel" aria-label="Operátori fókusz">
        <div class="panel-head">
          <div>
            <h2>Operátori fókusz</h2>
            <p>Azonnali teendők és a legutóbbi session kiemelve, hogy ne kelljen végiggörgetni az oldalt.</p>
          </div>
          <span id="operatorSummary" class="snapshot-time">Admin tokenre vár</span>
        </div>
        <div class="operator-grid">
          <article class="operator-card">
            <h3>Teendőlista</h3>
            <div id="operatorTaskRows" class="operator-task-list"></div>
          </article>
          <article class="operator-card latest-session-card">
            <h3>Legutóbbi session</h3>
            <div id="latestSessionCard" class="latest-session-body empty-detail">Frissítés után jelenik meg.</div>
          </article>
        </div>
      </section>

      <section id="pipelinePanel" class="pipeline-panel panel" aria-label="Folyamat áttekintés">
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

      <section id="postPaymentPanel" class="panel post-payment-panel" aria-label="Post-payment monitoring">
        <div class="panel-head">
          <div>
            <h2>Post-payment monitoring</h2>
            <p>Fizetes utani lanc: Stripe webhook, worker, PDF/riport es email kezbesites egy nezoben.</p>
          </div>
          <div class="panel-actions">
            <button id="postPaymentRecoveryPanelBtn" type="button" class="warn">Recovery v2 futtatasa</button>
            <span id="postPaymentWindow" class="snapshot-time">Meg nincs post-payment allapotkep</span>
          </div>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Post-payment allapot</span>
            <strong id="postPaymentLevel">-</strong>
            <p id="postPaymentSummary">Add meg az admin tokent, majd frissits.</p>
          </article>
          <article class="health-card">
            <span>Fizetett session</span>
            <strong id="postPaymentPaid">0</strong>
            <p id="postPaymentPaidMeta">Monitoring ablak: -</p>
          </article>
          <article class="health-card">
            <span>Webhook gond</span>
            <strong id="postPaymentWebhookIssues">0</strong>
            <p id="postPaymentWebhookMeta">Stripe checkout session completed kovetes.</p>
          </article>
          <article class="health-card">
            <span>Elemzesi gond</span>
            <strong id="postPaymentAnalysisIssues">0</strong>
            <p id="postPaymentAnalysisMeta">Queued / processing / failed / job nelkuli session.</p>
          </article>
          <article class="health-card">
            <span>Email gond</span>
            <strong id="postPaymentEmailIssues">0</strong>
            <p id="postPaymentEmailMeta">Done report, de email nincs sent allapotban.</p>
          </article>
        </div>
        <div class="engine-split">
          <article>
            <div class="subpanel-head">
              <h3>Post-payment szakaszok</h3>
              <p>Hol tud megakadni a fizetes utani folyamat.</p>
            </div>
            <div id="postPaymentStageRows" class="engine-list"></div>
          </article>
          <article>
            <div class="subpanel-head">
              <h3>Javasolt teendok</h3>
              <p>Prioritas szerint rendezett kovetkezo lepesek.</p>
            </div>
            <div id="postPaymentRecommendationRows" class="engine-list"></div>
          </article>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Prioritas</th>
                <th>Nev / email</th>
                <th>Folyamat hiba</th>
                <th>Kor</th>
                <th>Muveletek</th>
              </tr>
            </thead>
            <tbody id="postPaymentIssueRows"></tbody>
          </table>
        </div>
      </section>

      <section id="followUpPanel" class="panel" aria-label="Email follow-up">
        <div class="panel-head">
          <div>
            <h2>Email follow-up</h2>
            <p>Riport utani bizalomepito es visszateresi email folyamat.</p>
          </div>
          <button id="runFollowUpEmailsPanelBtn" type="button" class="secondary">Follow-up futtatasa</button>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Esedekes</span>
            <strong id="followUpDue">-</strong>
            <p>Most futtathato follow-up emailek.</p>
          </article>
          <article class="health-card">
            <span>Elkuldve</span>
            <strong id="followUpSent">-</strong>
            <p>Sikeres follow-upok.</p>
          </article>
          <article class="health-card">
            <span>Hibas</span>
            <strong id="followUpFailed">-</strong>
            <p>Kezi ellenorzest igenyel.</p>
          </article>
        </div>
        <span id="followUpGeneratedAt" class="snapshot-time">Meg nincs follow-up allapotkep</span>
        <div id="followUpRows" class="engine-list"></div>
      </section>

      <section id="webflowEmbedPanel" class="panel webflow-embed-panel" aria-label="Webflow embed manager">
        <div class="panel-head">
          <div>
            <h2>Webflow Embed Manager</h2>
            <p>Bemasolhato loader kodok, forrasfajl-meretek es Webflow 50k limit figyeles egy helyen.</p>
          </div>
          <span id="webflowEmbedGeneratedAt" class="snapshot-time">Meg nincs embed allapotkep</span>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Embedek</span>
            <strong id="webflowEmbedTotal">0</strong>
            <p id="webflowEmbedReadyMeta">Ready: 0</p>
          </article>
          <article class="health-card">
            <span>Loader embedek</span>
            <strong id="webflowEmbedLoaders">0</strong>
            <p>Kulso script loader a Webflow karakterlimit miatt.</p>
          </article>
          <article class="health-card">
            <span>Webflow limit</span>
            <strong id="webflowEmbedLimit">50 000</strong>
            <p>Forras es snippet karakterellenorzes.</p>
          </article>
        </div>
        <div id="webflowEmbedRows" class="embed-manager-list"></div>
      </section>

      <section id="i18nAuditPanel" class="panel" aria-label="Tobbnyelvu minoseg audit">
        <div class="panel-head">
          <div>
            <h2>Tobbnyelvu minoseg audit</h2>
            <p>Engine, checkout es bank bundle nyelvi lefedettseg a Webflow kockazatok kiszuresere.</p>
          </div>
          <span id="i18nAuditGeneratedAt" class="snapshot-time">Meg nincs nyelvi audit</span>
        </div>
        <div class="health-grid">
          <article class="health-card">
            <span>Audit szint</span>
            <strong id="i18nAuditLevel">-</strong>
            <p id="i18nAuditSummary">Admin tokenre var.</p>
          </article>
        </div>
        <div id="i18nAuditRows" class="engine-list"></div>
      </section>

      <section id="launchPanel" class="panel launch-panel" aria-label="Élesítési ellenőrzés">
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

      <section id="metricsPanel" class="metrics" aria-label="Állapot összegzés">
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

      <section id="healthPanel" class="panel health-panel">
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

      <section id="engineAnalyticsPanel" class="panel engine-analytics-panel" aria-label="Engine analytics">
        <div class="panel-head">
          <div>
            <h2>Engine analytics</h2>
            <p>Aggregalt kep az Engine Intelligence v2 donteseirol, atfedeseirol es ellenorzendo sessionjeirol.</p>
          </div>
          <span id="engineAnalyticsGeneratedAt" class="snapshot-time">Meg nincs engine allapotkep</span>
        </div>
        <div class="engine-summary-grid">
          <article class="health-card">
            <span>Elemzett session</span>
            <strong id="engineAnalyticsTotal">0</strong>
            <p id="engineAnalyticsWindow">-</p>
          </article>
          <article class="health-card">
            <span>Atlag confidence</span>
            <strong id="engineAnalyticsConfidence">-</strong>
            <p>Engine dontesi magabiztossag.</p>
          </article>
          <article class="health-card">
            <span>Atlag pontkulonbseg</span>
            <strong id="engineAnalyticsScoreGap">-</strong>
            <p>Primary es secondary jelzes tavolsaga.</p>
          </article>
          <article class="health-card">
            <span>Extra kerdes arany</span>
            <strong id="engineAnalyticsExtraRate">-</strong>
            <p>Kozeli vagy atfedo mintak aranya.</p>
          </article>
        </div>
        <div class="engine-decision-audit-grid">
          <article class="health-card">
            <span>Dontesi audit session</span>
            <strong id="engineAuditAudited">0</strong>
            <p>Valos session payloadok ujraszamolva.</p>
          </article>
          <article class="health-card">
            <span>Atnezesre var</span>
            <strong id="engineAuditReview">0</strong>
            <p id="engineAuditReviewMeta">-</p>
          </article>
          <article class="health-card">
            <span>Fo dontes elteres</span>
            <strong id="engineAuditPrimaryMismatch">0</strong>
            <p>Mentett vs Engine v2 primary.</p>
          </article>
          <article class="health-card">
            <span>Extra kerdes elteres</span>
            <strong id="engineAuditExtraMismatch">0</strong>
            <p>Mentett extra vs ujraszamolt extra.</p>
          </article>
        </div>
        <div class="subpanel-head">
          <div>
            <h3>Bank quality audit</h3>
            <p>Schema, fordítás, subdomain arány és kérdésszöveg minőség bankonként.</p>
          </div>
          <span id="bankQualityGeneratedAt" class="snapshot-time">Meg nincs bank audit</span>
        </div>
        <div class="engine-decision-audit-grid">
          <article class="health-card">
            <span>Atlag bank score</span>
            <strong id="bankQualityAverageScore">-</strong>
            <p>0-100 kozotti minosegi pontszam.</p>
          </article>
          <article class="health-card">
            <span>Kritikus issue</span>
            <strong id="bankQualityCritical">0</strong>
            <p>Blokkolo schema, darabszam vagy duplikacio.</p>
          </article>
          <article class="health-card">
            <span>Figyelmeztetes</span>
            <strong id="bankQualityWarning">0</strong>
            <p>Arany, forditas vagy item hossz jelzesek.</p>
          </article>
          <article class="health-card">
            <span>Review jelzes</span>
            <strong id="bankQualityReview">0</strong>
            <p>Finomhangolasi bankminosegi teendok.</p>
          </article>
        </div>
        <article class="engine-card bank-quality-card">
          <h3>Bank quality sorok</h3>
          <div id="bankQualityRows" class="engine-list"></div>
        </article>
        <div class="engine-analytics-grid">
          <article class="engine-card">
            <h3>Fo teruletek</h3>
            <div id="engineDomainRows" class="engine-bars"></div>
          </article>
          <article class="engine-card">
            <h3>Dontesi minoseg</h3>
            <div id="engineQualityRows" class="engine-bars"></div>
          </article>
          <article class="engine-card">
            <h3>Atfedo mintak</h3>
            <div id="engineOverlapRows" class="engine-list"></div>
          </article>
          <article class="engine-card">
            <h3>Leggyakoribb fokuszok</h3>
            <div id="engineFocusRows" class="engine-list"></div>
          </article>
        </div>
        <div class="subpanel-head">
          <div>
            <h3>Engine review queue</h3>
            <p>Alacsony magabiztosságú vagy átnézést igénylő engine döntések.</p>
          </div>
          <button id="toggleEngineReviewBtn" type="button" class="secondary" data-collapsible-toggle="engineReview" data-open-label="Lista megnyitása" data-closed-label="Lista összecsukása" aria-controls="engineReviewPanelBody" aria-expanded="false">Lista megnyitása</button>
        </div>
        <div id="engineReviewPanelBody" class="collapsible-panel is-collapsed" data-collapsible-body="engineReview">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dontesi minoseg</th>
                  <th>Nev / email</th>
                  <th>Engine dontes</th>
                  <th>Confidence</th>
                  <th>Muveletek</th>
                </tr>
              </thead>
              <tbody id="engineReviewRows"></tbody>
            </table>
          </div>
        </div>
        <div class="subpanel-head">
          <div>
            <h3>Engine döntési audit</h3>
            <p>Mentett döntés és újraszámolt Engine v2 döntés összevetése.</p>
          </div>
          <button id="toggleEngineDecisionAuditBtn" type="button" class="secondary" data-collapsible-toggle="engineDecisionAudit" data-open-label="Lista megnyitása" data-closed-label="Lista összecsukása" aria-controls="engineDecisionAuditPanelBody" aria-expanded="false">Lista megnyitása</button>
        </div>
        <div id="engineDecisionAuditPanelBody" class="collapsible-panel is-collapsed" data-collapsible-body="engineDecisionAudit">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Audit szint</th>
                  <th>Session</th>
                  <th>Mentett dontes</th>
                  <th>Engine v2 dontes</th>
                  <th>Megjegyzes</th>
                  <th>Muveletek</th>
                </tr>
              </thead>
              <tbody id="engineDecisionAuditRows"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="alertsPanel" class="panel">
        <div class="panel-head">
          <div>
            <h2>Proaktív riasztások</h2>
            <p>Kritikus éles rendszerállapot-riasztások az admin email címre.</p>
          </div>
        </div>
        <div class="health-grid compact-grid">
          <article class="health-card">
            <span>Operational szint</span>
            <strong id="operationalAlertLevel">-</strong>
            <p id="operationalAlertSummary">Még nincs operational snapshot.</p>
          </article>
          <article class="health-card">
            <span>Operational ablak</span>
            <strong id="operationalAlertWindow">-</strong>
            <p id="operationalAlertMetrics">Post-payment / email / health egyben.</p>
          </article>
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

      <section id="emailDeliveryPanel" class="panel">
        <div class="panel-head">
          <div>
            <h2>Email kézbesítés figyelés</h2>
            <p>Elkészült riportok, ahol az email küldés hibás, félbemaradt vagy még nincs sent státuszban.</p>
          </div>
          <button id="toggleEmailDeliveryCenterBtn" type="button" class="secondary" data-collapsible-toggle="emailDeliveryCenter" data-open-label="Email center megnyitása" data-closed-label="Email center összecsukása" aria-controls="emailDeliveryPanelBody" aria-expanded="true">Email center összecsukása</button>
        </div>
        <div id="emailDeliveryPanelBody" class="collapsible-panel" data-collapsible-body="emailDeliveryCenter">
          <div class="delivery-center-toolbar">
            <div>
              <label for="emailDeliveryStatusFilter">Email státusz szűrő</label>
              <select id="emailDeliveryStatusFilter">
                <option value="actionable">Teendők</option>
                <option value="failed">Hibás</option>
                <option value="retry_limit">Retry limit</option>
                <option value="sending">Küldés alatt</option>
                <option value="not_sent">Nincs elküldve</option>
                <option value="sent">Elküldve</option>
                <option value="all">Összes</option>
              </select>
            </div>
            <button id="refreshEmailDeliveryCenterBtn" type="button" class="secondary">Email center frissítése</button>
          </div>
          <div class="delivery-center-summary">
            <article class="health-card">
              <span>Elküldve</span>
              <strong id="emailDeliverySent">0</strong>
              <p id="emailDeliverySentMeta">Utolsó sikeres: -</p>
            </article>
            <article class="health-card">
              <span>Hibás</span>
              <strong id="emailDeliveryFailed">0</strong>
              <p>Provider vagy pipeline hiba.</p>
            </article>
            <article class="health-card">
              <span>Retry limit</span>
              <strong id="emailDeliveryRetryLimit">0</strong>
              <p>Kézzel ellenőrizendő.</p>
            </article>
            <article class="health-card">
              <span>Újrapróbálható</span>
              <strong id="emailDeliveryRetryable">0</strong>
              <p id="emailDeliveryLastAttempt">Utolsó próbálkozás: -</p>
            </article>
          </div>
          <div class="table-wrap delivery-center-table">
            <table>
              <thead>
                <tr>
                  <th>Prioritás</th>
                  <th>Név / email</th>
                  <th>Email állapot</th>
                  <th>Provider / hiba</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody id="emailDeliveryCenterRows"></tbody>
            </table>
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
        <div class="deliverability-monitor">
          <article class="health-card deliverability-main">
            <span>Deliverability status</span>
            <strong id="emailDeliverabilityLevel">-</strong>
            <p id="emailDeliverabilityWindow">Monitoring window: -</p>
          </article>
          <article class="health-card">
            <span>Success rate</span>
            <strong id="emailDeliverabilitySuccessRate">-</strong>
            <p id="emailDeliverabilityAttempted">Attempted sends: -</p>
          </article>
          <article class="health-card">
            <span>Failure rate</span>
            <strong id="emailDeliverabilityFailureRate">-</strong>
            <p id="emailDeliverabilityFailures">Failed: -</p>
          </article>
          <article class="health-card">
            <span>Stale sending</span>
            <strong id="emailDeliverabilityStale">0</strong>
            <p>Sending status older than monitor threshold.</p>
          </article>
          <article class="health-card">
            <span>Provider ID coverage</span>
            <strong id="emailDeliverabilityProviderCoverage">-</strong>
            <p id="emailDeliverabilityProviderMeta">Sent emails with provider id.</p>
          </article>
          <article class="health-card">
            <span>Config</span>
            <strong id="emailDeliverabilityConfig">-</strong>
            <p id="emailDeliverabilityConfigMeta">Resend and sender domain check.</p>
          </article>
        </div>
        <div class="deliverability-grid">
          <article class="engine-card">
            <h3>Top email errors</h3>
            <div id="emailDeliverabilityErrorRows" class="engine-list"></div>
          </article>
          <article class="engine-card">
            <h3>Deliverability recommendations</h3>
            <div id="emailDeliverabilityRecommendationRows" class="engine-list"></div>
          </article>
        </div>
        </div>
      </section>

      <section id="sessionSearchPanel" class="panel session-search-panel">
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

      <section id="operationsLogPanel" class="panel">
        <div class="panel-head">
          <div>
            <h2>Műveleti napló</h2>
            <p>Webhook, elemzés, checkout és email események időrendben.</p>
          </div>
          <div class="panel-actions">
            <button id="toggleOperationsLogBtn" type="button" class="secondary" aria-controls="operationsLogPanelBody" aria-expanded="false">Napló megnyitása</button>
            <div class="filter-row" aria-label="Műveleti napló szűrők">
              <button type="button" class="secondary log-filter active" data-log-filter="all">Összes</button>
              <button type="button" class="secondary log-filter" data-log-filter="critical">Kritikus</button>
              <button type="button" class="secondary log-filter" data-log-filter="email">Email</button>
              <button type="button" class="secondary log-filter" data-log-filter="analysis">Elemzés</button>
              <button type="button" class="secondary log-filter" data-log-filter="webhook">Webhook</button>
              <button type="button" class="secondary log-filter" data-log-filter="checkout">Fizetés</button>
            </div>
          </div>
        </div>
        <div id="operationsLogPanelBody" class="collapsible-panel is-collapsed">
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
        </div>
      </section>

      <section id="queuePanel" class="panel">
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

      <section id="sessionListsPanel" class="panel session-lists-toggle-panel">
        <div class="panel-head">
          <div>
            <h2>Session listák</h2>
            <p>Legutóbbi sessionök és hibás elemzések gyors áttekintése.</p>
          </div>
          <button id="toggleSessionListsBtn" type="button" class="secondary" data-collapsible-toggle="sessionLists" data-open-label="Listák megnyitása" data-closed-label="Listák összecsukása" aria-controls="sessionListsPanelBody" aria-expanded="false">Listák megnyitása</button>
        </div>
      </section>

      <section id="sessionListsPanelBody" class="grid collapsible-panel is-collapsed" data-collapsible-body="sessionLists">
        <article id="recentSessionsPanel" class="panel">
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

        <article id="failedAnalysesPanel" class="panel">
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

      <section id="sessionDetailPanel" class="panel detail-panel" aria-live="polite">
        <div class="panel-head">
          <div>
            <h2>Session részletek</h2>
            <p>Olvasható idővonal, payload/riport állapot és közvetlen helyreállítási műveletek.</p>
          </div>
        </div>
        <div id="sessionDetail" class="session-detail empty-detail">Nincs kiválasztott session.</div>
      </section>
    </main>

    <script src="/public/admin-dashboard.js?v=${ADMIN_DASHBOARD_ASSET_VERSION}"></script>
  </body>
</html>`);
}

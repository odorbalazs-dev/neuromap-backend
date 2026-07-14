import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const checks = [
  {
    label: "Worker supports configurable concurrency",
    run: () => {
      const source = read("src/jobs/analysis.worker.js");
      return (
        source.includes("workerConfig.concurrency") &&
        source.includes("workerLane") &&
        source.includes("Promise.all(lanes)")
      );
    }
  },
  {
    label: "Queue claiming uses SKIP LOCKED",
    run: () => read("src/services/analysis-queue.service.js").includes("FOR UPDATE SKIP LOCKED")
  },
  {
    label: "Queue exposes operational snapshot",
    run: () => read("src/services/analysis-queue.service.js").includes("getAnalysisQueueSnapshot")
  },
  {
    label: "Queue supports retry backoff instead of immediate permanent failure",
    run: () => {
      const source = read("src/services/analysis-queue.service.js");
      return (
        source.includes("calculateRetryDelaySeconds") &&
        source.includes("next_attempt_at") &&
        source.includes("WHEN attempts >= $3::int THEN 'failed'") &&
        read("src/jobs/analysis.worker.js").includes("job scheduled for retry")
      );
    }
  },
  {
    label: "Campaign capacity estimator is wired into admin controller",
    run: () => (
      read("src/services/campaign-capacity.service.js").includes("buildCampaignCapacitySnapshot") &&
      read("src/api/controllers/admin.controller.js").includes("buildCampaignCapacitySnapshot")
    )
  },
  {
    label: "Queue performance migration exists",
    run: () => (
      exists("src/db/migrations/010_analysis_jobs_queue_performance.sql") &&
      read("src/db/migrations/010_analysis_jobs_queue_performance.sql").includes("idx_analysis_jobs_queue_claim") &&
      read("src/db/migrations/010_analysis_jobs_queue_performance.sql").includes("idx_analysis_jobs_processing_lock")
    )
  },
  {
    label: "Queue retry backoff migration exists",
    run: () => (
      exists("src/db/migrations/011_analysis_jobs_retry_backoff.sql") &&
      read("src/db/migrations/011_analysis_jobs_retry_backoff.sql").includes("next_attempt_at") &&
      read("src/db/migrations/011_analysis_jobs_retry_backoff.sql").includes("idx_analysis_jobs_queue_retry_claim")
    )
  },
  {
    label: "Campaign env variables are documented",
    run: () => {
      const envExample = read(".env.example");
      return (
        envExample.includes("WORKER_CONCURRENCY") &&
        envExample.includes("WORKER_MAX_ATTEMPTS") &&
        envExample.includes("WORKER_RETRY_BASE_SECONDS") &&
        envExample.includes("WORKER_EXPECTED_JOB_SECONDS") &&
        envExample.includes("CAMPAIGN_TARGET_REPORTS_PER_DAY") &&
        envExample.includes("PG_POOL_MAX")
      );
    }
  },
  {
    label: "Webflow engine supports campaign language URLs",
    run: () => {
      const source = read("public/webflow/engine.js");
      return (
        source.includes("getRequestedLanguage") &&
        source.includes('params.get("lang")') &&
        source.includes('localStorage.setItem("nm_lang", requested)')
      );
    }
  },
  {
    label: "Google click and UTM attribution survive checkout",
    run: () => {
      const engine = read("public/webflow/engine.js");
      const checkoutPages = read("public/webflow/checkout-pages.js");
      const normalizer = read("src/utils/normalizeCheckoutPayload.js");

      return (
        engine.includes("CAMPAIGN_ATTRIBUTION_STORAGE_KEY") &&
        engine.includes("captureCampaignAttribution") &&
        engine.includes("acquisition,") &&
        checkoutPages.includes("getCampaignAnalyticsFields") &&
        normalizer.includes("normalizeAcquisition") &&
        normalizer.includes('"gclid"')
      );
    }
  },
  {
    label: "Webhook keeps paid checkout critical path short",
    run: () => {
      const source = read("src/services/webhook.service.js");
      return (
        source.includes("schedulePostPaymentSideEffects") &&
        source.includes("schedule_post_payment_side_effects") &&
        source.includes("post_payment_side_effects_failed")
      );
    }
  },
  {
    label: "Migration logs are ASCII-safe",
    run: () => {
      const source = read("src/db/migrate.js");
      return !/[^\x00-\x7F]/.test(source);
    }
  }
];

let failed = 0;

console.log("[campaign-readiness] Checking high-load campaign readiness...");

for (const check of checks) {
  let ok = false;

  try {
    ok = Boolean(check.run());
  } catch (error) {
    ok = false;
    console.error(`[campaign-readiness] ${check.label}: ${error.message}`);
  }

  if (ok) {
    console.log(`[campaign-readiness] ok - ${check.label}`);
  } else {
    failed += 1;
    console.error(`[campaign-readiness] failed - ${check.label}`);
  }
}

if (failed > 0) {
  console.error(`[campaign-readiness] ${failed} check(s) failed.`);
  process.exit(1);
}

console.log("[campaign-readiness] All checks passed.");

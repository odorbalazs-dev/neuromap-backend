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
    label: "Campaign env variables are documented",
    run: () => {
      const envExample = read(".env.example");
      return (
        envExample.includes("WORKER_CONCURRENCY") &&
        envExample.includes("WORKER_EXPECTED_JOB_SECONDS") &&
        envExample.includes("CAMPAIGN_TARGET_REPORTS_PER_DAY")
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

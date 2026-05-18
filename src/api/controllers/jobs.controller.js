import { processNextAnalysisJob } from "../../services/analysis-job.service.js";
import { env } from "../../config/env.js";

function isAuthorized(req) {
  const token =
    req.headers["x-cron-secret"] ||
    req.headers["x-admin-token"] ||
    req.query.token;

  return Boolean(env.CRON_SECRET && token === env.CRON_SECRET);
}

export async function processAnalysisJob(req, res) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const result = await processNextAnalysisJob();

    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error("[jobs] process analysis error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to process analysis job"
    });
  }
}
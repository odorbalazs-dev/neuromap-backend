import {
  claimNextAnalysisJob,
  markAnalysisJobDone,
  markAnalysisJobFailed,
  requeueStaleJobs
} from "../services/analysis-queue.service.js";

import {
  getSessionById,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed
} from "../services/session.service.js";

import { generateAnalysis }
  from "../services/analysis.service.js";

import { sendReportEmail }
  from "../services/email.service.js";

async function processSingleJob(job) {
  const session =
    await getSessionById(job.session_id);

  if (!session) {
    throw new Error("Session not found");
  }

  await markAnalysisProcessing(
    session.id
  );

  const resultText =
    await generateAnalysis({
      ...session.payload,
      lang: session.lang
    });

  await markAnalysisDone(
    session.id,
    resultText
  );

  await sendReportEmail({
    to: session.email,
    lang: session.lang,
    name: session.name,
    reportText: resultText,
    payload: session.payload
  });
}

async function workerLoop() {
  console.log(
    "[worker] analysis worker started"
  );

  while (true) {
    try {
      await requeueStaleJobs();

      const job =
        await claimNextAnalysisJob();

      if (!job) {
        await sleep(4000);
        continue;
      }

      console.log(
        "[worker] processing job",
        job.id
      );

      try {
        await processSingleJob(job);

        await markAnalysisJobDone(job.id);

        console.log(
          "[worker] job done",
          job.id
        );

      } catch (error) {
        console.error(
          "[worker] job failed",
          {
            jobId: job.id,
            error: error.message
          }
        );

        await markAnalysisFailed(
          job.session_id,
          error.message
        );

        await markAnalysisJobFailed(
          job.id,
          error.message
        );
      }

    } catch (error) {
      console.error(
        "[worker] loop error",
        error
      );

      await sleep(5000);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

workerLoop().catch((error) => {
  console.error(
    "[worker] fatal error",
    error
  );

  process.exit(1);
});
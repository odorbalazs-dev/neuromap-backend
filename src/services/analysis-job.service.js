import {
  getNextQueuedAnalysisSession,
  markAnalysisDone,
  markAnalysisFailed
} from "./session.service.js";
import { generateAnalysis } from "./analysis.service.js";
import { sendReportEmail } from "./email.service.js";

export async function processNextAnalysisJob() {
  const session = await getNextQueuedAnalysisSession();

  if (!session) {
    return {
      processed: false,
      reason: "no_queued_analysis"
    };
  }

  try {
    const resultText = await generateAnalysis({
      ...(session.payload || {}),
      lang: session.lang
    });

    await markAnalysisDone(session.id, resultText);

    await sendReportEmail({
      to: session.email,
      lang: session.lang,
      name: session.name,
      reportText: resultText,
      payload: session.payload
    });

    return {
      processed: true,
      sessionId: session.id
    };
  } catch (error) {
    const message = error?.message || "Analysis job failed";

    console.error("[analysis-job] failed:", {
      sessionId: session.id,
      message
    });

    await markAnalysisFailed(session.id, message);

    throw error;
  }
}
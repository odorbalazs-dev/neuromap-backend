import { getSessionById, markAnalysisProcessing, markAnalysisDone, markAnalysisFailed } from "../../services/session.service.js";
import { generateAnalysis } from "../../services/analysis.service.js";
import { sendReportEmail } from "../../services/email.service.js";

export async function getAdminSession(req, res) {
  try {
    const { sessionId } = req.params;

    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    return res.status(200).json({
      ok: true,
      session: {
        id: sessionRow.id,
        email: sessionRow.email,
        name: sessionRow.name,
        lang: sessionRow.lang,
        payment_status: sessionRow.payment_status,
        analysis_status: sessionRow.analysis_status,
        stripe_session_id: sessionRow.stripe_session_id,
        paid_at: sessionRow.paid_at,
        analysis_completed_at: sessionRow.analysis_completed_at,
        error_message: sessionRow.error_message,
        detectedRisk: sessionRow.payload?.detectedRisk || null,
        secondaryRisk: sessionRow.payload?.secondaryRisk || null,
        triageScores: sessionRow.payload?.triageScores || null,
        hasAnalysisResult: Boolean(sessionRow.analysis_result)
      }
    });
  } catch (error) {
    console.error("Admin session error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to get session"
    });
  }
}

export async function retryAnalysis(req, res) {
  const { sessionId } = req.params;

  try {
    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    if (sessionRow.payment_status !== "paid") {
      return res.status(400).json({
        ok: false,
        error: "Cannot retry analysis for unpaid session"
      });
    }

    await markAnalysisProcessing(sessionId);

    const resultText = await generateAnalysis({
      ...sessionRow.payload,
      lang: sessionRow.lang
    });

    await markAnalysisDone(sessionId, resultText);

    await sendReportEmail({
      to: sessionRow.email,
      lang: sessionRow.lang,
      name: sessionRow.name,
      reportText: resultText
    });

    return res.status(200).json({
      ok: true,
      sessionId,
      analysisStatus: "done",
      emailSent: true
    });
  } catch (error) {
    console.error("Admin retry analysis error:", error);

    try {
      await markAnalysisFailed(sessionId, error.message || "Admin retry failed");
    } catch (nestedError) {
      console.error("Failed to mark retry failed:", nestedError);
    }

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to retry analysis"
    });
  }
}

export async function resendReportEmail(req, res) {
  try {
    const { sessionId } = req.params;

    const sessionRow = await getSessionById(sessionId);

    if (!sessionRow) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    if (!sessionRow.analysis_result) {
      return res.status(400).json({
        ok: false,
        error: "No analysis result found for this session"
      });
    }

    await sendReportEmail({
      to: sessionRow.email,
      lang: sessionRow.lang,
      name: sessionRow.name,
      reportText: sessionRow.analysis_result
    });

    return res.status(200).json({
      ok: true,
      sessionId,
      emailSent: true
    });
  } catch (error) {
    console.error("Admin resend email error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to resend report email"
    });
  }
}
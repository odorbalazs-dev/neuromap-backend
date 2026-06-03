import {
  getSessionById,
  getSessionByPublicIdentifier
} from "../../services/session.service.js";

function maskEmail(email = "") {
  const value = String(email || "").trim();
  const [name, domain] = value.split("@");

  if (!name || !domain) return "";

  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

function normalizeAnalysisStatus(status) {
  const value = String(status || "pending").toLowerCase();
  if (value === "done" || value === "completed") return "done";
  if (value === "processing") return "processing";
  if (value === "queued") return "queued";
  if (value === "failed") return "failed";
  return "pending";
}

function normalizeEmailStatus(status) {
  const value = String(status || "not_sent").toLowerCase();
  if (["not_sent", "sending", "sent", "failed"].includes(value)) return value;
  return "not_sent";
}

function buildStage({ key, label, state }) {
  return { key, label, state };
}

function buildCustomerStatus(session) {
  const paymentPaid = session.payment_status === "paid";
  const analysisStatus = normalizeAnalysisStatus(session.analysis_status);
  const emailStatus = normalizeEmailStatus(session.report_email_status);
  const analysisDone = analysisStatus === "done";
  const analysisFailed = analysisStatus === "failed";
  const emailSent = emailStatus === "sent";
  const emailFailed = emailStatus === "failed";

  let overall = "processing";

  if (!paymentPaid) {
    overall = "waiting_payment";
  } else if (analysisFailed || emailFailed) {
    overall = "attention";
  } else if (emailSent) {
    overall = "sent";
  }

  const analysisState = analysisFailed
    ? "failed"
    : analysisDone
      ? "complete"
      : paymentPaid
        ? "active"
        : "pending";

  const reportState = analysisDone
    ? "complete"
    : analysisFailed
      ? "failed"
      : paymentPaid
        ? "active"
        : "pending";

  const emailState = emailSent
    ? "complete"
    : emailFailed
      ? "failed"
      : analysisDone || emailStatus === "sending"
        ? "active"
        : "pending";

  return {
    id: session.id,
    checkoutSessionId: session.stripe_session_id || null,
    lang: session.lang || "en",
    overall,
    paymentStatus: session.payment_status || null,
    analysisStatus,
    reportEmailStatus: emailStatus,
    reportEmailAttempts: Number(session.report_email_attempts || 0),
    createdAt: session.created_at || null,
    updatedAt: session.updated_at || null,
    paidAt: session.paid_at || null,
    analysisCompletedAt: session.analysis_completed_at || null,
    emailSentAt: session.report_email_sent_at || null,
    emailMasked: maskEmail(session.email),
    stages: [
      buildStage({
        key: "payment",
        label: "Payment",
        state: paymentPaid ? "complete" : "pending"
      }),
      buildStage({
        key: "analysis",
        label: "Analysis",
        state: analysisState
      }),
      buildStage({
        key: "report",
        label: "PDF report",
        state: reportState
      }),
      buildStage({
        key: "email",
        label: "Email delivery",
        state: emailState
      })
    ]
  };
}

export async function getSession(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Missing session id"
      });
    }

    const session = await getSessionById(id);

    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    return res.status(200).json({
      ok: true,
      session: {
  id: session.id,
  lang: session.lang || "en",
  payment_status: session.payment_status || null,
  analysis_status: session.analysis_status || null,
  created_at: session.created_at || null,
  updated_at: session.updated_at || null
}
    });
  } catch (error) {
    console.error("session controller error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to fetch session"
    });
  }
}

export async function getSessionStatus(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Missing session id"
      });
    }

    const session = await getSessionByPublicIdentifier(id);

    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Session not found"
      });
    }

    return res.status(200).json({
      ok: true,
      status: buildCustomerStatus(session)
    });
  } catch (error) {
    console.error("session status controller error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch session status"
    });
  }
}

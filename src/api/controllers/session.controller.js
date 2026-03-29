import { getSessionById } from "../services/sessionService.js";

export async function getSessionController(req, res) {
  try {
    const { id } = req.params;
    const session = await getSessionById(id);

    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Session not found."
      });
    }

    return res.status(200).json({
      ok: true,
      session: {
        id: session.id,
        email: session.email,
        name: session.name,
        lang: session.lang,
        paymentStatus: session.payment_status,
        analysisStatus: session.analysis_status,
        resultText: session.result_text,
        createdAt: session.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to load session."
    });
  }
}
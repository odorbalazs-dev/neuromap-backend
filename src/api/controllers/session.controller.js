import { getSessionById } from "../../services/session.service.js";

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
        email: session.email,
        name: session.name || null,
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
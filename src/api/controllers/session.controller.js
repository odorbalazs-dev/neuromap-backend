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
      session
    });
  } catch (error) {
    console.error("session controller error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to fetch session"
    });
  }
}
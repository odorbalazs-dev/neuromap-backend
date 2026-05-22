import { env } from "../config/env.js";
import { secureCompare } from "../utils/secureCompare.js";

export function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];

  if (!env.ADMIN_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_TOKEN is not configured"
    });
  }

  if (!secureCompare(token, env.ADMIN_TOKEN)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  next();
}

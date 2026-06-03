import { env } from "../config/env.js";
import { secureCompare } from "../utils/secureCompare.js";

export function adminAuth(req, res, next) {
  const headerToken = req.headers["x-admin-token"];
  const authorization = req.headers.authorization || "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const token = String(
    Array.isArray(headerToken) ? headerToken[0] : headerToken || bearerToken || ""
  ).trim();
  const expectedToken = String(env.ADMIN_TOKEN || "").trim();

  if (!expectedToken) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_TOKEN is not configured"
    });
  }

  if (!secureCompare(token, expectedToken)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  next();
}

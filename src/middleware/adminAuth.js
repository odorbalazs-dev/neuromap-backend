import { env } from "../config/env.js";
import { secureCompare } from "../utils/secureCompare.js";

function normalizeAdminToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
    .replace(/^["'`]+|["'`]+$/g, "");
}

export function adminAuth(req, res, next) {
  const headerToken = req.headers["x-admin-token"];
  const authorization = req.headers.authorization || "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const token = normalizeAdminToken(
    Array.isArray(headerToken) ? headerToken[0] : headerToken || bearerToken || ""
  );
  const expectedToken = normalizeAdminToken(env.ADMIN_TOKEN);

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

import { env } from "../config/env.js";
import { secureCompare } from "../utils/secureCompare.js";
import {
  createAdminSession,
  getAdminSession,
  revokeAdminSession,
  verifySecret
} from "../services/admin-session.service.js";

const SESSION_COOKIE = "nm_admin_session";
const CSRF_COOKIE = "nm_admin_csrf";

function normalizeAdminToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
    .replace(/^["'`]+|["'`]+$/g, "");
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, part) => {
    const index = part.indexOf("=");
    if (index === -1) return acc;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function cookieOptions({ httpOnly = true, expires = null } = {}) {
  const pieces = ["Path=/", "SameSite=Strict"];

  if (httpOnly) pieces.push("HttpOnly");
  if (env.ADMIN_COOKIE_SECURE) pieces.push("Secure");
  if (expires) pieces.push(`Expires=${new Date(expires).toUTCString()}`);

  return pieces.join("; ");
}

function setAdminCookies(res, sessionToken, csrfToken, expiresAt) {
  res.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; ${cookieOptions({
      httpOnly: true,
      expires: expiresAt
    })}`
  );
  res.append(
    "Set-Cookie",
    `${CSRF_COOKIE}=${encodeURIComponent(csrfToken)}; ${cookieOptions({
      httpOnly: false,
      expires: expiresAt
    })}`
  );
}

function clearAdminCookies(res) {
  const expired = new Date(0).toUTCString();
  res.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; SameSite=Strict; HttpOnly; Expires=${expired}`
  );
  res.append("Set-Cookie", `${CSRF_COOKIE}=; Path=/; SameSite=Strict; Expires=${expired}`);
}

function isUnsafeMethod(method) {
  return !["GET", "HEAD", "OPTIONS"].includes(String(method || "").toUpperCase());
}

function getLegacyAdminToken(req) {
  const headerToken = req.headers["x-admin-token"];
  const authorization = req.headers.authorization || "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  return normalizeAdminToken(
    Array.isArray(headerToken) ? headerToken[0] : headerToken || bearerToken || ""
  );
}

function assertExpectedAdminToken(rawToken) {
  const token = normalizeAdminToken(rawToken);
  const expectedToken = normalizeAdminToken(env.ADMIN_TOKEN);

  if (!expectedToken) {
    const error = new Error("ADMIN_TOKEN is not configured");
    error.status = 500;
    throw error;
  }

  if (env.NODE_ENV === "production" && expectedToken.length < 32) {
    const error = new Error("ADMIN_TOKEN must contain at least 32 characters in production");
    error.status = 500;
    throw error;
  }

  if (!secureCompare(token, expectedToken)) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }
}

export async function adminLogin(req, res) {
  try {
    assertExpectedAdminToken(req.body?.adminToken);

    const adminSession = await createAdminSession({
      ip: req.ip || req.socket?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || ""
    });

    setAdminCookies(
      res,
      adminSession.sessionToken,
      adminSession.csrfToken,
      adminSession.expiresAt
    );

    return res.status(200).json({
      ok: true,
      csrfToken: adminSession.csrfToken,
      expiresAt: adminSession.expiresAt
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      error: error.status === 500 ? error.message : "Unauthorized"
    });
  }
}

export async function adminLogout(req, res) {
  const cookies = parseCookies(req);
  await revokeAdminSession(cookies[SESSION_COOKIE]).catch((error) => {
    console.warn("[admin] logout revoke failed:", error?.message || error);
  });
  clearAdminCookies(res);
  return res.status(200).json({ ok: true });
}

export function getAdminAuthStatus(req, res) {
  return res.status(200).json({
    ok: true,
    authenticated: true,
    session: req.adminSession
      ? {
          id: req.adminSession.id,
          expiresAt: req.adminSession.expires_at
        }
      : null
  });
}

export async function adminAuth(req, res, next) {
  try {
    const cookies = parseCookies(req);
    const sessionToken = cookies[SESSION_COOKIE];

    if (sessionToken) {
      const adminSession = await getAdminSession(sessionToken, {
        ip: req.ip || req.socket?.remoteAddress || "",
        userAgent: req.headers["user-agent"] || ""
      });

      if (adminSession) {
        if (isUnsafeMethod(req.method)) {
          const csrfHeader = String(req.headers["x-admin-csrf"] || "");
          const csrfCookie = cookies[CSRF_COOKIE] || "";

          if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
            return res.status(403).json({ ok: false, error: "Invalid CSRF token" });
          }

          if (!verifySecret(csrfHeader, adminSession.csrf_token_hash)) {
            return res.status(403).json({ ok: false, error: "Invalid CSRF token" });
          }
        }

        req.adminSession = adminSession;
        return next();
      }
    }

    if (env.ADMIN_LEGACY_TOKEN_AUTH) {
      assertExpectedAdminToken(getLegacyAdminToken(req));
      return next();
    }

    return res.status(401).json({ ok: false, error: "Unauthorized" });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      error: error.status === 500 ? error.message : "Unauthorized"
    });
  }
}

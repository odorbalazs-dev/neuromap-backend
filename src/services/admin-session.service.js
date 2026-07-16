import { createHash, randomBytes, randomUUID } from "crypto";
import { db } from "../db/db.js";
import { env } from "../config/env.js";
import { secureCompare } from "../utils/secureCompare.js";

export function hashSecret(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function hashOptional(value) {
  const raw = String(value || "").trim();
  return raw ? hashSecret(raw) : null;
}

export function verifySecret(rawValue, storedHash) {
  if (!rawValue || !storedHash) return false;
  return secureCompare(hashSecret(rawValue), storedHash);
}

export async function createAdminSession({ ip = "", userAgent = "" } = {}) {
  const sessionToken = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const ttlMinutes = Number(env.ADMIN_SESSION_TTL_MINUTES || 480);

  const result = await db.query(
    `
    INSERT INTO admin_sessions (
      id,
      session_token_hash,
      csrf_token_hash,
      ip_hash,
      user_agent_hash,
      expires_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      NOW() + ($6::int * INTERVAL '1 minute')
    )
    RETURNING id, expires_at
    `,
    [
      randomUUID(),
      hashSecret(sessionToken),
      hashSecret(csrfToken),
      hashOptional(ip),
      hashOptional(userAgent),
      ttlMinutes
    ]
  );

  return {
    id: result.rows[0].id,
    sessionToken,
    csrfToken,
    expiresAt: result.rows[0].expires_at
  };
}

export async function getAdminSession(sessionToken) {
  const tokenHash = hashSecret(sessionToken);

  const result = await db.query(
    `
    UPDATE admin_sessions
    SET last_seen_at = NOW()
    WHERE session_token_hash = $1
      AND revoked_at IS NULL
      AND expires_at > NOW()
    RETURNING id, csrf_token_hash, expires_at, created_at, last_seen_at
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function revokeAdminSession(sessionToken) {
  if (!sessionToken) return null;

  const result = await db.query(
    `
    UPDATE admin_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE session_token_hash = $1
    RETURNING id
    `,
    [hashSecret(sessionToken)]
  );

  return result.rows[0] || null;
}

export async function cleanupAdminSessions() {
  await db.query(
    `
    DELETE FROM admin_sessions
    WHERE expires_at < NOW() - INTERVAL '7 days'
       OR revoked_at < NOW() - INTERVAL '7 days'
    `
  );
}

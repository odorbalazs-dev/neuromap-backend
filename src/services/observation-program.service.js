import { createHash, createHmac, timingSafeEqual } from "crypto";
import { db } from "../db/db.js";
import { env } from "../config/env.js";
import { buildObservationTrend } from "../utils/observationTrend.js";
import {
  assertSessionProcessingAllowed,
  isSessionProcessingRestricted
} from "./data-governance.service.js";

export { buildObservationTrend } from "../utils/observationTrend.js";

const CONTEXTS = new Set([
  "morning",
  "learning",
  "social",
  "transition",
  "evening",
  "other"
]);

function getLinkSecret() {
  const secret = String(env.OBSERVATION_LINK_SECRET || "").trim();

  if (secret.length < 32) {
    throw new Error("OBSERVATION_LINK_SECRET must contain at least 32 characters.");
  }

  return secret;
}

function parseEntitlements(value) {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
}

function hasObservationEntitlement(session) {
  const entitlements = parseEntitlements(session?.entitlements);
  return entitlements.observationDiary14Days === true;
}

function makeToken(sessionId) {
  return createHmac("sha256", getLinkSecret())
    .update(`neuromap-observation:${sessionId}`)
    .digest("base64url");
}

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function getObservationBaseUrl() {
  const baseUrl = String(env.BACKEND_PUBLIC_URL || "").replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("BACKEND_PUBLIC_URL must be an absolute HTTP(S) URL.");
  }

  return baseUrl;
}

export function buildObservationProgramAccess(program) {
  if (!program?.session_id) {
    throw new Error("Observation program is missing its session id.");
  }

  const token = makeToken(program.session_id);
  const expectedHash = hashToken(token);

  if (program.token_hash && !safeEqual(program.token_hash, expectedHash)) {
    throw new Error("Observation program token does not match its session.");
  }

  return {
    ...program,
    token,
    url: `${getObservationBaseUrl()}/observation/${encodeURIComponent(token)}`
  };
}

function normalizeEntryInput(input = {}) {
  const entryDate = String(input.entryDate || "").trim();
  const context = String(input.context || "other").trim().toLowerCase();
  const signalLevel = Number(input.signalLevel);
  const strategyUsed = input.strategyUsed === true;
  const note = String(input.note || "").trim().slice(0, 500);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    throw new Error("Invalid observation date.");
  }

  if (!CONTEXTS.has(context)) {
    throw new Error("Invalid observation context.");
  }

  if (!Number.isInteger(signalLevel) || signalLevel < 0 || signalLevel > 3) {
    throw new Error("Signal level must be an integer between 0 and 3.");
  }

  return { entryDate, context, signalLevel, strategyUsed, note };
}

export async function ensureObservationProgram(session) {
  if (!session?.id) {
    throw new Error("Missing session for observation program.");
  }

  if (session.payment_status !== "paid") {
    throw new Error("Observation program requires a paid session.");
  }

  await assertSessionProcessingAllowed(session.id);

  if (!hasObservationEntitlement(session)) {
    return null;
  }

  const token = makeToken(session.id);
  const tokenHash = hashToken(token);
  const focusDomain =
    session.payload?.detectedRisk ||
    session.payload?.payload?.detectedRisk ||
    null;

  const programResult = await db.query(
    `
    INSERT INTO observation_programs (
      session_id,
      token_hash,
      focus_domain,
      starts_at,
      ends_at
    )
    VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '14 days')
    ON CONFLICT (session_id)
    DO UPDATE SET
      token_hash = EXCLUDED.token_hash,
      focus_domain = COALESCE(observation_programs.focus_domain, EXCLUDED.focus_domain),
      updated_at = NOW()
    RETURNING *
    `,
    [session.id, tokenHash, focusDomain]
  );

  const program = programResult.rows[0];

  await db.query(
    `
    INSERT INTO observation_follow_ups (program_id, kind, due_at)
    VALUES
      ($1, 'day_1', $2::timestamptz + INTERVAL '1 day'),
      ($1, 'day_7', $2::timestamptz + INTERVAL '7 days'),
      ($1, 'day_14', $2::timestamptz + INTERVAL '14 days')
    ON CONFLICT (program_id, kind) DO NOTHING
    `,
    [program.id, program.starts_at]
  );

  await db.query(
    `
    INSERT INTO observation_trend_reports (program_id)
    VALUES ($1)
    ON CONFLICT (program_id) DO NOTHING
    `,
    [program.id]
  );

  return buildObservationProgramAccess(program);
}

export async function getObservationProgramByToken(token) {
  const normalizedToken = String(token || "").trim();

  if (!/^[A-Za-z0-9_-]{40,100}$/.test(normalizedToken)) {
    return null;
  }

  const result = await db.query(
    `
    SELECT
      p.*,
      s.lang,
      s.package_code,
      s.entitlements,
      s.payment_status,
      s.payload,
      s.email,
      s.name,
      s.processing_restricted_at,
      s.sensitive_data_erased_at,
      s.data_redacted_at
    FROM observation_programs p
    JOIN sessions s ON s.id = p.session_id
    WHERE p.token_hash = $1
    LIMIT 1
    `,
    [hashToken(normalizedToken)]
  );

  const program = result.rows[0] || null;

  if (
    !program ||
    isSessionProcessingRestricted(program) ||
    !safeEqual(program.token_hash, hashToken(normalizedToken))
  ) {
    return null;
  }

  return program;
}

export async function getObservationProgramById(programId) {
  const result = await db.query(
    `
    SELECT
      p.*,
      s.lang,
      s.package_code,
      s.entitlements,
      s.payment_status,
      s.payload,
      s.email,
      s.name
    FROM observation_programs p
    JOIN sessions s ON s.id = p.session_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [programId]
  );

  return result.rows[0] || null;
}

export async function listObservationEntries(programId) {
  const result = await db.query(
    `
    SELECT entry_date, context, signal_level, strategy_used, note, created_at, updated_at
    FROM observation_entries
    WHERE program_id = $1
    ORDER BY entry_date ASC
    `,
    [programId]
  );

  return result.rows;
}

export async function saveObservationEntry(program, input) {
  if (!program?.id || program.status !== "active") {
    throw new Error("Observation program is not active.");
  }

  const normalized = normalizeEntryInput(input);
  const startsAt = toDateKey(program.starts_at);
  const endsAt = toDateKey(program.ends_at);

  if (
    !startsAt ||
    !endsAt ||
    normalized.entryDate < startsAt ||
    normalized.entryDate > endsAt ||
    normalized.entryDate > todayUtc()
  ) {
    throw new Error("Observation date is outside the active program period.");
  }

  const result = await db.query(
    `
    INSERT INTO observation_entries (
      program_id,
      entry_date,
      context,
      signal_level,
      strategy_used,
      note
    )
    VALUES ($1, $2::date, $3, $4, $5, $6)
    ON CONFLICT (program_id, entry_date)
    DO UPDATE SET
      context = EXCLUDED.context,
      signal_level = EXCLUDED.signal_level,
      strategy_used = EXCLUDED.strategy_used,
      note = EXCLUDED.note,
      updated_at = NOW()
    RETURNING entry_date, context, signal_level, strategy_used, note, created_at, updated_at
    `,
    [
      program.id,
      normalized.entryDate,
      normalized.context,
      normalized.signalLevel,
      normalized.strategyUsed,
      normalized.note || null
    ]
  );

  return result.rows[0];
}

export async function generateObservationTrend(programId) {
  const entries = await listObservationEntries(programId);
  const summary = buildObservationTrend(entries);

  await db.query(
    `
    INSERT INTO observation_trend_reports (program_id, status, summary, generated_at, updated_at)
    VALUES ($1, 'ready', $2, NOW(), NOW())
    ON CONFLICT (program_id)
    DO UPDATE SET
      status = 'ready',
      summary = EXCLUDED.summary,
      generated_at = NOW(),
      error_message = NULL,
      updated_at = NOW()
    `,
    [programId, summary]
  );

  return summary;
}

export async function getObservationStatusForSession(sessionId) {
  const result = await db.query(
    `
    SELECT
      p.status,
      p.starts_at,
      p.ends_at,
      p.completed_at,
      COUNT(e.id)::int AS entry_count,
      tr.status AS trend_status,
      tr.summary AS trend_summary
    FROM observation_programs p
    LEFT JOIN observation_entries e ON e.program_id = p.id
    LEFT JOIN observation_trend_reports tr ON tr.program_id = p.id
    WHERE p.session_id = $1
    GROUP BY p.id, tr.status, tr.summary
    LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

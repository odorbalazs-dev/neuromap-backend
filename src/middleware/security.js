import { createHash } from "crypto";

import { env } from "../config/env.js";
import { db } from "../db/db.js";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const buckets = new Map();

function getClientKey(req) {
  if (req.ip) {
    return req.ip;
  }

  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function cleanupBuckets(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function hashRateLimitKey(value) {
  return createHash("sha256")
    .update(String(value || "unknown"), "utf8")
    .digest("hex");
}

function shouldUseDatabaseRateLimit() {
  return env.RATE_LIMIT_BACKEND !== "memory" && Boolean(env.DATABASE_URL);
}

function consumeMemoryBucket({ key, windowMs }) {
  const now = Date.now();

  if (Math.random() < 0.01) {
    cleanupBuckets(now);
  }

  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  return bucket;
}

async function consumeDatabaseBucket({ key, windowMs }) {
  const resetAt = new Date(Date.now() + windowMs);
  const bucketKey = hashRateLimitKey(key);

  const result = await db.query(
    `
    INSERT INTO api_rate_limits (
      bucket_key,
      window_start,
      reset_at,
      request_count
    )
    VALUES ($1, NOW(), $2::timestamptz, 1)
    ON CONFLICT (bucket_key) DO UPDATE
    SET request_count = CASE
          WHEN api_rate_limits.reset_at <= NOW() THEN 1
          ELSE api_rate_limits.request_count + 1
        END,
        window_start = CASE
          WHEN api_rate_limits.reset_at <= NOW() THEN NOW()
          ELSE api_rate_limits.window_start
        END,
        reset_at = CASE
          WHEN api_rate_limits.reset_at <= NOW() THEN $2::timestamptz
          ELSE api_rate_limits.reset_at
        END,
        updated_at = NOW()
    RETURNING request_count, reset_at
    `,
    [bucketKey, resetAt.toISOString()]
  );

  const row = result.rows[0] || {};

  return {
    count: Number(row.request_count || 1),
    resetAt: new Date(row.reset_at || resetAt).getTime()
  };
}

export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

  if (env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

export function createRateLimit({
  windowMs = DEFAULT_WINDOW_MS,
  max = 100,
  keyPrefix = "global",
  skip = null,
  failClosed = false
} = {}) {
  return async function rateLimit(req, res, next) {
    if (typeof skip === "function" && skip(req)) {
      return next();
    }

    const key = `${keyPrefix}:${getClientKey(req)}`;
    let bucket;

    if (shouldUseDatabaseRateLimit()) {
      try {
        bucket = await consumeDatabaseBucket({ key, windowMs });
      } catch (error) {
        console.warn("database rate limit unavailable:", error?.message || error);

        if (env.RATE_LIMIT_FAIL_OPEN) {
          return next();
        }

        if (failClosed && env.NODE_ENV === "production") {
          res.setHeader("Retry-After", "60");
          return res.status(503).json({
            ok: false,
            error: "Request protection is temporarily unavailable. Please try again later."
          });
        }

        bucket = consumeMemoryBucket({ key, windowMs });
      }
    } else if (failClosed && env.NODE_ENV === "production") {
      res.setHeader("Retry-After", "60");
      return res.status(503).json({
        ok: false,
        error: "Request protection is temporarily unavailable. Please try again later."
      });
    } else {
      bucket = consumeMemoryBucket({ key, windowMs });
    }

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({
        ok: false,
        error: "Too many requests. Please try again later."
      });
    }

    return next();
  };
}

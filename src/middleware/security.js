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

export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

  next();
}

export function createRateLimit({
  windowMs = DEFAULT_WINDOW_MS,
  max = 100,
  keyPrefix = "global"
} = {}) {
  return function rateLimit(req, res, next) {
    const now = Date.now();

    if (Math.random() < 0.01) {
      cleanupBuckets(now);
    }

    const key = `${keyPrefix}:${getClientKey(req)}`;
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

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

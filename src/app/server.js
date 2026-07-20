import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
import { db } from "../db/db.js";
import { runMigrations } from "../db/migrate.js";
import {
  createRateLimit,
  securityHeaders
} from "../middleware/security.js";
import checkoutRoutes from "../api/routes/checkout.js";
import sessionRoutes from "../api/routes/session.js";
import webhookRoutes from "../api/routes/webhook.js";
import healthRoutes from "../api/routes/health.js";
import adminStatusRoutes from "../api/routes/admin-status.js";
import adminRoutes from "../api/routes/admin.js";
import cronRoutes from "../api/routes/cron.js";
import jobsRoutes from "../api/routes/jobs.js";
import observationRoutes from "../api/routes/observation.js";
import legalRoutes from "../api/routes/legal.js";

const app = express();

app.set("trust proxy", 1);

function parseCorsOrigins(value) {
  return String(value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const allowedCorsOrigins = new Set(parseCorsOrigins(env.CORS_ORIGINS));

if (env.NODE_ENV !== "production") {
  [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ].forEach((origin) => allowedCorsOrigins.add(origin));
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = String(origin).replace(/\/+$/, "");
    if (allowedCorsOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-token",
    "x-admin-csrf",
    "x-session-token",
    "x-cron-secret",
    "x-consent-token",
    "x-privacy-request-token"
  ]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(securityHeaders);

app.use(createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyPrefix: "global",
  skip: (req) => {
    const path = req.path || "";
    return (
      path === "/admin/dashboard" ||
      path === "/public/admin-dashboard.css" ||
      path === "/public/admin-dashboard.js"
    );
  }
}));

app.use("/public/webflow", express.static("public/webflow", {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
  }
}));

app.use("/public", express.static("public"));

app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: env.HTTP_JSON_BODY_LIMIT_BYTES }));

app.get("/", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "neuromap-backend",
    message: "API is running"
  });
});

app.use("/checkout", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  keyPrefix: "checkout"
}), checkoutRoutes);

app.use("/session", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyPrefix: "session"
}), sessionRoutes);

app.use("/observation", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyPrefix: "observation"
}), observationRoutes);

app.use("/legal", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyPrefix: "legal"
}), legalRoutes);

app.use("/webhook", webhookRoutes);
app.use("/health", healthRoutes);
app.use("/admin-status", adminStatusRoutes);

app.use("/admin", adminRoutes);

app.use("/cron", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "cron"
}), cronRoutes);

app.use("/jobs", createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: "jobs"
}), jobsRoutes);

app.use((_req, res) => {
  return res.status(404).json({
    ok: false,
    error: "Not found"
  });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const payloadTooLarge = error?.type === "entity.too.large";
  const status = payloadTooLarge
    ? 413
    : Number.isInteger(error?.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;

  console.error("[http] request failed", {
    status,
    code: error?.code || null,
    type: error?.type || null,
    message: error?.message || "Unknown request error"
  });

  return res.status(status).json({
    ok: false,
    error: payloadTooLarge
      ? "Request payload is too large"
      : status >= 500
        ? "Internal server error"
        : "Invalid request"
  });
});

let server = null;
let shutdownStarted = false;

async function start() {
  await runMigrations();

  server = app.listen(Number(env.PORT), () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  server.headersTimeout = env.HTTP_HEADERS_TIMEOUT_MS;
  server.requestTimeout = env.HTTP_REQUEST_TIMEOUT_MS;
  server.keepAliveTimeout = env.HTTP_KEEP_ALIVE_TIMEOUT_MS;
}

async function shutdown(signal) {
  if (shutdownStarted) return;
  shutdownStarted = true;

  console.log(`[shutdown] ${signal} received; draining HTTP connections.`);

  const forceTimer = setTimeout(() => {
    console.error("[shutdown] Grace period expired; forcing connection shutdown.");
    server?.closeAllConnections?.();
    process.exit(1);
  }, env.HTTP_SHUTDOWN_GRACE_MS);
  forceTimer.unref?.();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeIdleConnections?.();
      });
    }

    await db.close();
    clearTimeout(forceTimer);
    console.log("[shutdown] HTTP server and database pool closed.");
    process.exit(0);
  } catch (error) {
    clearTimeout(forceTimer);
    console.error("[shutdown] Failed to close cleanly:", error);
    await db.close().catch(() => {});
    process.exit(1);
  }
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  console.error("Failed to start server:", err);
  db.close()
    .catch(() => {})
    .finally(() => process.exit(1));
});

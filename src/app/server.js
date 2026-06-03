import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
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

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin: [
    "https://neuromap-kids.webflow.io"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-token",
    "x-cron-secret"
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
app.use(express.json({ limit: "2mb" }));

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

async function start() {
  await runMigrations();

  app.listen(Number(env.PORT), () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

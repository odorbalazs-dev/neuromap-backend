import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import checkoutRoutes from "../api/routes/checkout.js";
import sessionRoutes from "../api/routes/session.js";
import webhookRoutes from "../api/routes/webhook.js";
import healthRoutes from "../api/routes/health.js";
import adminRoutes from "../api/routes/admin.js";
import adminStatusRoutes from "../api/routes/admin-status.js";

const app = express();

const corsOptions = {
  origin: [
    "https://neuromap-kids.webflow.io"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "neuromap-backend",
    message: "API is running",
    adminTokenConfigured: Boolean(env.ADMIN_TOKEN),
    nodeEnv: env.NODE_ENV
  });
});

app.use("/checkout", checkoutRoutes);
app.use("/session", sessionRoutes);
app.use("/webhook", webhookRoutes);
app.use("/health", healthRoutes);
app.use("/admin/status", adminStatusRoutes);
app.use("/admin", adminRoutes);

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
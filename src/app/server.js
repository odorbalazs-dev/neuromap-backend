import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import checkoutRoutes from "../api/routes/checkout.js";
import sessionRoutes from "../api/routes/session.js";
import webhookRoutes from "../api/routes/webhook.js";
import healthRoutes from "../api/routes/health.js";
import adminRoutes from "../api/routes/admin.js";

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
  const adminTokenRaw = process.env.ADMIN_TOKEN;

  return res.status(200).json({
    ok: true,
    service: "neuromap-backend",
    message: "API is running",
    nodeEnv: env.NODE_ENV,

    adminTokenFromEnvObject: Boolean(env.ADMIN_TOKEN),
    adminTokenFromProcessEnv: Boolean(adminTokenRaw),
    adminTokenLength: adminTokenRaw ? adminTokenRaw.length : 0,

    hasAdminTokenKey: Object.prototype.hasOwnProperty.call(
      process.env,
      "ADMIN_TOKEN"
    )
  });
});

app.use("/checkout", checkoutRoutes);
app.use("/session", sessionRoutes);
app.use("/webhook", webhookRoutes);
app.use("/health", healthRoutes);
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
import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
import { runMigrations } from "../db/migrate.js";
import checkoutRoutes from "../api/routes/checkout.js";
import sessionRoutes from "../api/routes/session.js";
import webhookRoutes from "../api/routes/webhook.js";
import healthRoutes from "../api/routes/health.js";

const app = express();

app.use(cors());

app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "neuromap-backend",
    message: "API is running"
  });
});

app.use("/checkout", checkoutRoutes);
app.use("/session", sessionRoutes);
app.use("/webhook", webhookRoutes);
app.use("/health", healthRoutes);

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
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { testDb } from "./config/db.js";

import healthRoutes from "./routes/health.js";
import checkoutRoutes from "./routes/checkout.js";
import webhookRoutes from "./routes/webhook.js";
import sessionRoutes from "./routes/session.js";

const app = express();

app.use(cors({
  origin: true,
  credentials: false
}));

app.use("/webhook", express.raw({ type: "application/json" }));
app.use("/health", healthRoutes);

app.use(express.json({ limit: "2mb" }));

app.use("/create-checkout-session", checkoutRoutes);
app.use("/sessions", sessionRoutes);
app.use("/webhook", webhookRoutes);

app.get("/version-check", (_req, res) => {
  res.status(200).json({
    ok: true,
    marker: "VERSION_CHECK_2026_03_25_A"
  });
});

app.post("/analyze", async (_req, res) => {
  return res.status(400).json({
    ok: false,
    error: "Use /create-checkout-session in production flow. /analyze direct submit is deprecated."
  });
});

app.use((err, _req, res, _next) => {
  console.error("unhandled express error:", err);
  res.status(500).json({
    ok: false,
    error: "Internal server error."
  });
});

async function boot() {
  if (env.databaseUrl) {
    try {
      await testDb();
      console.log("Database connection OK");
    } catch (error) {
      console.error("Database connection failed:", error.message);
    }
  } else {
    console.log("DATABASE_URL not set, starting without database");
  }

  app.listen(env.port, () => {
    console.log(`NeuroMap backend listening on port ${env.port}`);
  });
}

boot().catch((error) => {
  console.error("boot failed:", error);
  process.exit(1);
});
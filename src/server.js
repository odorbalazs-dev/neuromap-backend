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

// Stripe webhookhoz raw body kell
app.use("/webhook", express.raw({ type: "application/json" }));
app.use("/health", healthRoutes);

// Minden más route JSON
app.use(express.json({ limit: "2mb" }));

app.use("/create-checkout-session", checkoutRoutes);
app.use("/sessions", sessionRoutes);
app.use("/webhook", webhookRoutes);

// ideiglenes backward compatibility a jelenlegi frontendhez
app.post("/analyze", async (req, res) => {
  return res.status(400).json({
    ok: false,
    error: "Use /create-checkout-session in production flow. /analyze direct submit is deprecated."
  });
});

app.get("/version-check", (_req, res) => {
  res.status(200).json({
    ok: true,
    marker: "VERSION_CHECK_2026_03_25_A",
    time: new Date().toISOString()
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
  await testDb();

  app.listen(env.port, () => {
    console.log(`NeuroMap backend listening on port ${env.port}`);
  });
}

boot().catch((error) => {
  console.error("boot failed:", error);
  process.exit(1);
});
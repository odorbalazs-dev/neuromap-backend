import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
import checkoutRoutes from "../api/routes/checkout.js";
import sessionRoutes from "../api/routes/session.js";
import webhookRoutes from "../api/routes/webhook.js";

const app = express();

app.use(cors());

// Stripe webhookhoz RAW body kell, ezt a JSON parser ELŐTT kell feltenni
app.use("/webhook", express.raw({ type: "application/json" }));

// Minden más route JSON-t kap
app.use(express.json({ limit: "2mb" }));

app.use("/checkout", checkoutRoutes);
app.use("/session", sessionRoutes);
app.use("/webhook", webhookRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "neuromap-backend"
  });
});

app.listen(Number(env.PORT), () => {
  console.log(`Server running on port ${env.PORT}`);
});
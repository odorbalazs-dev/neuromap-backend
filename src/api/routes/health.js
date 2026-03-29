import express from "express";
import { env } from "../config/env.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  res.status(200).json({
    ok: true,
    marker: "HEALTH_V2_2026_03_25",
    service: "neuromap-backend",
    env: env.nodeEnv,
    services: {
      openai: !!env.openaiApiKey,
      email: !!env.resendApiKey && !!env.resendFromEmail,
      stripe: !!env.stripeSecretKey,
      database: !!env.databaseUrl
    }
  });
});

export default router;
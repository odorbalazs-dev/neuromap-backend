import express from "express";
import { env } from "../config/env.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const health = {
    ok: true,
    service: "neuromap-backend",
    env: env.nodeEnv,
    services: {
      openai: !!env.openaiApiKey,
      email: !!env.resendApiKey && !!env.resendFromEmail,
      stripe: !!env.stripeSecretKey,
      database: !!env.databaseUrl
    }
  };

  res.status(200).json(health);
});

export default router;
import express from "express";
import { env } from "../../config/env.js";
import { db } from "../../db/db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const status = {
    ok: true,
    service: "neuromap-backend",
    node_env: env.NODE_ENV,
    database: {
      configured: env.DATABASE_URL !== null,
      error: env.DATABASE_ERROR ?? null,
      connected: false,
    },
  };

  if (env.DATABASE_URL) {
    try {
      await db.query("SELECT 1");
      status.database.connected = true;
    } catch (err) {
      status.ok = false;
      status.database.connected = false;
      status.database.connection_error = err.message;
    }
  } else {
    status.ok = false;
  }

  return res.status(status.ok ? 200 : 503).json(status);
});

export default router;
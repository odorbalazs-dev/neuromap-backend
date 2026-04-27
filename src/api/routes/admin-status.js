import express from "express";
import { env } from "../../config/env.js";

const router = express.Router();

router.get("/", (_req, res) => {
  return res.status(200).json({
    ok: true,
    adminTokenConfigured: Boolean(env.ADMIN_TOKEN)
  });
});

export default router;

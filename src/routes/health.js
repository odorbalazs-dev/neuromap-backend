import express from "express";

const router = express.Router();

router.get("/", async (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "neuromap-backend"
  });
});

export default router;
import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "neuromap-backend"
  });
});

export default router;
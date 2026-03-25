import express from "express";
import { createCheckoutSession } from "../services/stripeService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const session = await createCheckoutSession(req.body);

    res.json({
      ok: true,
      url: session.url
    });
  } catch (error) {
    console.error("checkout error:", error);
    res.status(500).json({
      ok: false,
      error: "Checkout failed"
    });
  }
});

export default router;
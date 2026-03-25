import { createCheckoutSession } from "../services/stripeService.js";

export async function createCheckoutSessionController(req, res) {
  try {
    const session = await createCheckoutSession(req.body);

    return res.status(200).json({
      ok: true,
      url: session.url
    });
  } catch (error) {
    console.error("checkout error:", error);

    return res.status(500).json({
      ok: false,
      error: "Checkout failed"
    });
  }
}
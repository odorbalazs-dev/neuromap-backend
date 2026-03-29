import express from "express";
import { createCheckout } from "../controllers/checkout.controller.js";

import { stripe } from "../../infrastructure/stripe/stripeClient.js";
import { PaymentService } from "../../services/payment.service.js";

const router = express.Router();

const paymentService = new PaymentService(stripe);

router.post("/", createCheckout(paymentService));

export default router;
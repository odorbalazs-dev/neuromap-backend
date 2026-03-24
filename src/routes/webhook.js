import express from "express";
import { stripeWebhookController } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/", stripeWebhookController);

export default router;
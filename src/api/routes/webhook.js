import express from "express";
import { stripeWebhookController } from "../controllers/webhook.controller.js";

const router = express.Router();

router.post("/", stripeWebhookController);

export default router;
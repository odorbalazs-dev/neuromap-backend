import express from "express";
import { createCheckoutSessionController } from "../controllers/checkoutController.js";

const router = express.Router();

router.post("/", createCheckoutSessionController);

export default router;
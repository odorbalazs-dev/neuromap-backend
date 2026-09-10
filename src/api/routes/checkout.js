import express from "express";

import {
  createCheckout,
  checkoutAvailability,
  retryCheckout
} from "../controllers/checkout.controller.js";

const router = express.Router();
router.get('/availability', checkoutAvailability);

router.post("/", createCheckout);

router.post("/retry/:id", retryCheckout);

export default router;

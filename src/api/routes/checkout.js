import express from "express";

import {
  createCheckout,
  retryCheckout
} from "../controllers/checkout.controller.js";

const router = express.Router();

router.post("/", createCheckout);

router.post("/retry/:id", retryCheckout);

export default router;
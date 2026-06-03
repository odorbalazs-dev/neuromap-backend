import express from "express";
import {
  getSession,
  getSessionStatus
} from "../controllers/session.controller.js";

const router = express.Router();

router.get("/status/:id", getSessionStatus);
router.get("/:id", getSession);

export default router;

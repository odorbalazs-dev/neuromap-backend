import express from "express";
import { getSessionController } from "../controllers/sessionController.js";

const router = express.Router();

router.get("/:id", getSessionController);

export default router;
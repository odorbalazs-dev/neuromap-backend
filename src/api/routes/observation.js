import { Router } from "express";
import {
  getObservationDiary,
  showObservationDiary,
  upsertObservationEntry
} from "../controllers/observation.controller.js";

const router = Router();

router.get("/api/:token", getObservationDiary);
router.post("/api/:token/entries", upsertObservationEntry);
router.get("/:token", showObservationDiary);

export default router;

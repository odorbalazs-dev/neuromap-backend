import express from "express";
import { processAnalysisJob } from "../controllers/jobs.controller.js";

const router = express.Router();

router.post("/process-analysis", processAnalysisJob);

export default router;
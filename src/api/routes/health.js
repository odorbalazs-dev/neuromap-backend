import express from "express";
import fs from "fs/promises";
import path from "path";
import { db } from "../../db/db.js";

const router = express.Router();

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

router.get("/", async (_req, res) => {
  const status = {
    ok: true,
    service: "neuromap-backend"
  };

  try {
    await db.query("SELECT 1");
  } catch {
    status.ok = false;
  }

  return res.status(status.ok ? 200 : 503).json(status);
});

router.get("/version", async (_req, res) => {
  const packagePath = path.join(process.cwd(), "package.json");

  let packageJson = null;

  if (await fileExists(packagePath)) {
    try {
      packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
    } catch {
      packageJson = null;
    }
  }

  return res.status(200).json({
    ok: true,
    service: "neuromap-backend",
    version: packageJson?.version || "unknown",
    questionnaire: {
      current: "v4-scoring-result",
      triage: "triage.embed.js",
      banks: "all-banks.bundle.js"
    }
  });
});

export default router;

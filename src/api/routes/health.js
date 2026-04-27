import express from "express";
import fs from "fs/promises";
import path from "path";
import { env } from "../../config/env.js";
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

async function getFileInfo(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);

  try {
    const stat = await fs.stat(fullPath);

    return {
      exists: true,
      path: relativePath,
      sizeBytes: stat.size,
      updatedAt: stat.mtime
    };
  } catch {
    return {
      exists: false,
      path: relativePath,
      sizeBytes: 0,
      updatedAt: null
    };
  }
}

router.get("/", async (_req, res) => {
  const status = {
    ok: true,
    service: "neuromap-backend",
    node_env: env.NODE_ENV,
    app_url: env.APP_URL,
    app_base_url: env.APP_BASE_URL,
    database: {
      configured: env.DATABASE_URL !== null,
      error: env.DATABASE_ERROR ?? null,
      connected: false
    },
    env: {
      openaiConfigured: Boolean(env.OPENAI_API_KEY),
      stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
      stripeWebhookConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET),
      resendConfigured: Boolean(env.RESEND_API_KEY),
      adminTokenConfigured: Boolean(env.ADMIN_TOKEN)
    },
    files: {
      triageEmbed: await getFileInfo("public/banks/triage.embed.js"),
      allBanksBundle: await getFileInfo("public/banks/all-banks.bundle.js")
    }
  };

  if (env.DATABASE_URL) {
    try {
      await db.query("SELECT 1");
      status.database.connected = true;
    } catch (err) {
      status.ok = false;
      status.database.connected = false;
      status.database.connection_error = err.message;
    }
  } else {
    status.ok = false;
  }

  const requiredFiles = [
    status.files.triageEmbed,
    status.files.allBanksBundle
  ];

  requiredFiles.forEach((file) => {
    if (!file.exists) {
      status.ok = false;
    }
  });

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
    node_env: env.NODE_ENV,
    questionnaire: {
      current: "v4-scoring-result",
      triage: "triage.embed.js",
      banks: "all-banks.bundle.js"
    }
  });
});

export default router;
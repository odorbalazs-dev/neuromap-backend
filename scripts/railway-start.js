import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const rawRole =
  process.env.RAILWAY_SERVICE_ROLE ||
  process.env.SERVICE_ROLE ||
  process.env.NM_SERVICE_ROLE ||
  "web";

const normalizedRole = String(rawRole).trim().toLowerCase();

const workerRoles = new Set(["worker", "analysis-worker", "analysis_worker", "queue"]);
const webRoles = new Set(["web", "api", "backend", "server", ""]);

let role = normalizedRole;

if (!workerRoles.has(role) && !webRoles.has(role)) {
  console.warn(`[railway-start] unknown role "${rawRole}", defaulting to web`);
  role = "web";
}

const isWorker = workerRoles.has(role);
const entry = isWorker ? "src/jobs/analysis.worker.js" : "src/app/server.js";

console.log(`[railway-start] role=${isWorker ? "worker" : "web"} entry=${entry}`);

const child = spawn(process.execPath, [path.join(rootDir, entry)], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env
});

function forwardSignal(signal) {
  if (!child.killed) {
    child.kill(signal);
  }
}

process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("SIGINT", () => forwardSignal("SIGINT"));

child.on("exit", (code, signal) => {
  if (signal) {
    console.log(`[railway-start] child exited from signal ${signal}`);
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

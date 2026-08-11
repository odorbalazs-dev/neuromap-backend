import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveServiceRole } from "../src/config/service-role.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const resolvedRole = resolveServiceRole();

if (resolvedRole.error) {
  console.error(`[railway-start] ${resolvedRole.error}`);
  process.exit(1);
}

if (resolvedRole.warning) {
  console.warn(`[railway-start] ${resolvedRole.warning}`);
}

const isWorker = resolvedRole.role === "worker";
const entry = isWorker ? "src/jobs/analysis.worker.js" : "src/app/server.js";

console.log(
  `[railway-start] role=${resolvedRole.role} source=${resolvedRole.source} entry=${entry}`
);

const child = spawn(process.execPath, [path.join(rootDir, entry)], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env
});

let terminating = false;

function forwardSignal(signal) {
  if (terminating) return;
  terminating = true;

  if (!child.killed) {
    child.kill(signal);
  }
}

process.once("SIGTERM", () => forwardSignal("SIGTERM"));
process.once("SIGINT", () => forwardSignal("SIGINT"));

child.on("exit", (code, signal) => {
  if (signal) {
    console.log(`[railway-start] child exited from signal ${signal}`);
    process.exit(0);
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[railway-start] child process failed", error);
  process.exit(1);
});

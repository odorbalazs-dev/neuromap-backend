const WORKER_ROLES = new Set([
  "worker",
  "analysis-worker",
  "analysis_worker",
  "queue",
  "consumer"
]);

const WEB_ROLES = new Set(["web", "api", "backend", "server"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function looksLikeWorker(value) {
  return /(?:^|[-_\s])(worker|queue|consumer)(?:$|[-_\s])/i.test(
    ` ${String(value || "")} `
  );
}

export function resolveServiceRole(environment = process.env, argv = process.argv) {
  const explicitRaw =
    environment.RAILWAY_SERVICE_ROLE ||
    environment.SERVICE_ROLE ||
    environment.NM_SERVICE_ROLE ||
    "";
  const explicit = normalize(explicitRaw);
  const railwayServiceName = String(environment.RAILWAY_SERVICE_NAME || "").trim();
  const entrypoint = Array.isArray(argv) ? argv.join(" ").replace(/\\/g, "/") : "";
  const workerEntrypoint = /(?:^|\/)analysis\.worker\.js(?:\s|$)/i.test(entrypoint);
  const workerService = looksLikeWorker(railwayServiceName);

  if (explicit && !WORKER_ROLES.has(explicit) && !WEB_ROLES.has(explicit)) {
    return {
      role: null,
      source: "explicit",
      rawRole: explicitRaw,
      error:
        `Unknown service role "${explicitRaw}". ` +
        "Use web or worker (RAILWAY_SERVICE_ROLE)."
    };
  }

  if (workerEntrypoint || workerService) {
    const source = workerEntrypoint ? "entrypoint" : "railway-service-name";
    const warning =
      explicit && WEB_ROLES.has(explicit)
        ? `Explicit role "${explicitRaw}" conflicts with the worker ${source}; using worker.`
        : null;

    return { role: "worker", source, rawRole: explicitRaw || null, warning };
  }

  if (WORKER_ROLES.has(explicit)) {
    return { role: "worker", source: "explicit", rawRole: explicitRaw, warning: null };
  }

  if (WEB_ROLES.has(explicit)) {
    return { role: "web", source: "explicit", rawRole: explicitRaw, warning: null };
  }

  return { role: "web", source: "default", rawRole: null, warning: null };
}


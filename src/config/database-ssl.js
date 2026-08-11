const VALID_MODES = new Set([
  "auto",
  "disable",
  "require",
  "no-verify",
  "verify-full"
]);

function getDatabaseHost(connectionString) {
  if (!connectionString) return null;

  try {
    return new URL(connectionString).hostname.toLowerCase();
  } catch (_error) {
    return null;
  }
}

function isPrivateDatabaseHost(host) {
  if (!host) return true;

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".railway.internal") ||
    host.endsWith(".internal") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function decodeCertificate(base64Certificate) {
  if (!base64Certificate) return null;
  return Buffer.from(base64Certificate, "base64").toString("utf8");
}

function encryptedConfig({ verifyCertificate, certificate }) {
  const ssl = { rejectUnauthorized: verifyCertificate };
  if (certificate) ssl.ca = certificate;
  return ssl;
}

export function resolveDatabaseSslConfig({
  connectionString,
  mode = "auto",
  caBase64 = null
} = {}) {
  const requestedMode = String(mode || "auto").trim().toLowerCase();

  if (!VALID_MODES.has(requestedMode)) {
    throw new Error(
      `Unsupported DATABASE_SSL_MODE "${mode}". ` +
        `Use one of: ${Array.from(VALID_MODES).join(", ")}.`
    );
  }

  const host = getDatabaseHost(connectionString);
  const certificate = decodeCertificate(caBase64);
  const normalizedMode = requestedMode === "no-verify" ? "auto" : requestedMode;
  const deprecatedMode = requestedMode === "no-verify";
  let effectiveMode = normalizedMode;

  if (normalizedMode === "auto") {
    if (certificate) effectiveMode = "verify-full";
    else if (isPrivateDatabaseHost(host)) effectiveMode = "disable";
    else if (host?.endsWith(".proxy.rlwy.net")) effectiveMode = "require";
    else effectiveMode = "verify-full";
  }

  if (effectiveMode === "disable") {
    return {
      ssl: false,
      host,
      requestedMode,
      normalizedMode,
      deprecatedMode,
      effectiveMode,
      certificateVerified: false,
      reason: isPrivateDatabaseHost(host)
        ? "private database network"
        : "TLS explicitly disabled"
    };
  }

  if (effectiveMode === "require") {
    return {
      ssl: encryptedConfig({ verifyCertificate: false, certificate: null }),
      host,
      requestedMode,
      normalizedMode,
      deprecatedMode,
      effectiveMode,
      certificateVerified: false,
      reason: "encrypted connection with provider-managed certificate chain"
    };
  }

  return {
    ssl: encryptedConfig({ verifyCertificate: true, certificate }),
    host,
    requestedMode,
    normalizedMode,
    deprecatedMode,
    effectiveMode,
    certificateVerified: true,
    reason: certificate ? "custom CA certificate" : "public CA verification"
  };
}

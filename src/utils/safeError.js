const SAFE_TYPES = new Set([
  "StripeSignatureVerificationError", "StripeConnectionError", "StripeAPIError",
  "StripeRateLimitError", "StripeInvalidRequestError", "StripeAuthenticationError",
  "ConsentError", "LaunchGateError", "ProcessingRestrictedError"
]);
const SAFE_CODES = new Set([
  "resource_missing", "api_key_expired", "rate_limit", "idempotency_key_in_use",
  "parameter_missing", "parameter_invalid_integer", "parameter_unknown", "url_invalid",
  "authentication_required", "account_invalid", "amount_too_small", "amount_too_large"
]);

// Provider errors may embed request bodies, signatures and personal data.
export function safeError(error) {
  const type = SAFE_TYPES.has(error?.type) ? error.type : error?.name;
  const result = { type: SAFE_TYPES.has(type) ? type : "RequestError" };
  const status = Number(error?.statusCode || error?.status);
  if (Number.isInteger(status) && status >= 400 && status <= 599) result.status = status;
  if (SAFE_CODES.has(error?.code)) result.code = error.code;
  if (/^req_[a-zA-Z0-9]{5,80}$/.test(error?.requestId || "")) result.requestId = error.requestId;
  return result;
}

export async function sendMetaPurchaseEvent({
  eventId,
  value = 5,
  currency = "USD"
}) {
  // This funnel can reveal inferred child health information. Server-side
  // advertising events are therefore intentionally disabled, even when a
  // browser user separately permits anonymous analytics.
  console.info("[meta] CAPI disabled for sensitive questionnaire funnel", {
    eventId: eventId || null,
    value,
    currency
  });
  return {
    skipped: true,
    reason: "sensitive_health_funnel_disabled"
  };
}

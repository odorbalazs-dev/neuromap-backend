export const TEST_INVOICE_EXCLUSION = "STRIPE_TEST_PAYMENT_EXCLUDED";

export function isTestInvoicePayment(session, checkout) {
  return checkout?.livemode === false ||
    [session?.stripe_session_id, checkout?.id].some(id =>
      typeof id === "string" && id.startsWith("cs_test_"));
}

export function isVerifiedLiveInvoicePayment(session, checkout) {
  return !isTestInvoicePayment(session, checkout) &&
    checkout?.livemode === true && checkout.payment_status === "paid" &&
    typeof checkout.id === "string" && checkout.id.startsWith("cs_live_") &&
    session?.stripe_session_id === checkout.id &&
    checkout.metadata?.internalSessionId === session.id;
}

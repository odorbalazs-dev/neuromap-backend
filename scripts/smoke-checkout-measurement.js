process.env.RAILWAY_SERVICE_ROLE = "worker";
process.env.OPENAI_API_KEY = "smoke-openai-key";
process.env.RESEND_API_KEY = "smoke-resend-key";
process.env.EMAIL_FROM = "smoke@example.com";
process.env.APP_URL = "https://example.com";

const [{ db }, { linkStripeCheckoutSession }] = await Promise.all([
  import("../src/db/db.js"),
  import("../src/services/session.service.js")
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const originalQuery = db.query;
let capturedQuery = null;
let capturedParams = null;

try {
  db.query = async (query, params) => {
    capturedQuery = query;
    capturedParams = params;
    return {
      rows: [{
        id: params[0],
        stripe_session_id: params[1],
        checkout_url: params[2]
      }]
    };
  };

  const linked = await linkStripeCheckoutSession({
    sessionId: "123e4567-e89b-12d3-a456-426614174000",
    stripeSessionId: "cs_test_measurement",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_measurement"
  });

  assert(linked?.stripe_session_id === "cs_test_measurement", "Stripe session id should be returned.");
  assert(
    capturedQuery.includes("checkout_started_at = COALESCE(checkout_started_at, NOW())"),
    "The first checkout start timestamp must be recorded without overwriting retries."
  );
  assert(capturedQuery.includes("checkout_url = $3"), "The current checkout URL must be stored.");
  assert(
    capturedQuery.includes("recovery_token = COALESCE(recovery_token, $4)"),
    "A stable recovery token must be stored."
  );
  assert(capturedParams[1] === "cs_test_measurement", "The Stripe session id must be linked.");
  assert(
    capturedParams[2] === "https://checkout.stripe.com/c/pay/cs_test_measurement",
    "The Stripe checkout URL must be linked."
  );
  assert(/^[a-f0-9]{64}$/.test(capturedParams[3]), "The recovery token must contain 256 bits of entropy.");

  console.log("Checkout measurement smoke check passed.");
} finally {
  db.query = originalQuery;
  await db.close();
}

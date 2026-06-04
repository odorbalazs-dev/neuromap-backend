import fs from "fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("\n=== CHECKOUT PAGES SMOKE ===");

  const currentVersion = "20260604-cx-top10-v1";
  const script = fs.readFileSync("public/webflow/checkout-pages.js", "utf8");
  const sharedEmbed = fs.readFileSync("web/checkout-pages-embed.html", "utf8").trim();
  const successEmbed = fs.readFileSync("web/checkout-success-embed.html", "utf8").trim();
  const cancelEmbed = fs.readFileSync("web/checkout-cancel-embed.html", "utf8").trim();

  new Function(script);

  [sharedEmbed, successEmbed, cancelEmbed].forEach((embed, index) => {
    assert(embed.length < 50000, `Checkout embed ${index + 1} should stay below the Webflow 50k limit.`);
    assert(
      embed.includes("/public/webflow/checkout-pages.js"),
      `Checkout embed ${index + 1} should load the public checkout pages script.`
    );
    assert(
      embed.includes(currentVersion),
      `Checkout embed ${index + 1} should include the current cache-busting version.`
    );
  });

  assert(script.includes(currentVersion), "Checkout pages should expose the current stable version.");
  assert(script.includes("ANALYTICS_SCHEMA_VERSION"), "Checkout pages should define an analytics schema version.");
  assert(script.includes("analytics-event-schema-v2"), "Checkout pages should use analytics event schema v2.");
  assert(script.includes("buildAnalyticsPayload"), "Checkout pages should build normalized analytics payloads.");
  assert(script.includes("event_schema_version"), "Checkout events should include the schema version.");
  assert(script.includes("client_session_id"), "Checkout events should include a client session id.");
  assert(script.includes("nm-checkout-pages-stable-v1"), "Checkout pages should install the stable design layer.");
  assert(!/[\u0102\u00c2\u0103\u00e2\u0107\u0158\u0151\u0170\u0147]/.test(script), "Checkout pages should not contain mojibake characters.");
  assert(script.includes("&#10003;"), "Success page should render a safe checkmark entity.");
  assert(script.includes("trackOnce(\"purchase\""), "Success page should send a purchase event.");
  assert(script.includes("neuromap_kids_report"), "Purchase event should include product item metadata.");
  assert(script.includes("/session/status/"), "Success page should load the customer-facing report status.");
  assert(script.includes("nmReportStatusPanel"), "Success page should render a report status panel.");
  assert(script.includes("What happens next?"), "Success page should explain the post-payment next steps.");
  assert(script.includes("nmRefreshStatus"), "Success page should allow manual report status refresh.");
  assert(script.includes("nmCopySession"), "Checkout pages should allow copying the support session id.");
  assert(script.includes("nmDeliveryEstimate"), "Success page should show customer-facing delivery expectations.");
  assert(script.includes("nmDelayedHelp"), "Success page should explain what to do if the email is delayed.");
  assert(script.includes("data-nm-feedback=\"need_help\""), "Checkout pages should render support-intent feedback.");
  assert(script.includes("nm_checkout_page_feedback_${normalized}"), "Checkout pages should track checkout page feedback.");
  assert(script.includes("nm_support_reference_copied"), "Checkout pages should track copied support references.");
  assert(script.includes("Good to know"), "Checkout pages should include a customer guidance tip.");
  assert(script.includes("checkout_recovery_view"), "Cancel page should track the recovery guidance view.");
  assert(script.includes("Your answers are safe"), "Cancel page should reassure customers after a failed payment.");
  assert(script.includes("trackOnce(\"checkout_cancelled\""), "Cancel page should send a checkout_cancelled event.");
  assert(script.includes("hasDataLayerEvent"), "Checkout tracking should protect against duplicate dataLayer events.");
  assert(script.includes("/checkout/retry/"), "Cancel page should support retry checkout.");
  assert(script.includes("nmRetryCheckout"), "Cancel page should render a retry checkout button.");
  assert(script.includes("SUPPORTED_LANGS"), "Checkout pages should support localized success and cancel pages.");

  console.log("Checkout pages smoke passed.");
}

try {
  main();
} catch (error) {
  console.error("Checkout pages smoke failed:", error.message);
  process.exit(1);
}

import fs from "fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("\n=== CHECKOUT PAGES SMOKE ===");

  const currentVersion = "20260721-customer-experience-v2";
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
  assert(!script.includes("client_session_id"), "Checkout analytics should not include a client session id.");
  assert(script.includes("nm-checkout-pages-stable-v1"), "Checkout pages should install the stable design layer.");
  assert(!/(Ã|Â|Ă|Ĺ|Å|Ä|â€|�)/.test(script), "Checkout pages should not contain mojibake characters.");
  assert(script.includes("&#10003;"), "Success page should render a safe checkmark entity.");
  assert(script.includes("trackPurchaseFromStatus"), "Success page should validate server status before sending purchase.");
  assert(script.includes('status?.paymentStatus !== "paid"'), "Purchase tracking should require a paid session.");
  assert(script.includes("status?.amountTotal"), "Purchase tracking should use the server-confirmed amount.");
  assert(script.includes("package_code: packageCode"), "Purchase tracking should include the selected package.");
  assert(script.includes("NeuroMap Kids Plus"), "Purchase event should distinguish the Plus package.");
  assert(script.includes("/session/status/"), "Success page should load the customer-facing report status.");
  assert(script.includes("nmReportStatusPanel"), "Success page should render a report status panel.");
  assert(script.includes("What happens next?"), "Success page should explain the post-payment next steps.");
  assert(script.includes("nmRefreshStatus"), "Success page should allow manual report status refresh.");
  assert(script.includes("nm_report_status_refresh"), "Manual report status refreshes should be measured.");
  assert(script.includes("nmCopySession"), "Checkout pages should allow copying the support session id.");
  assert(script.includes("nmDeliveryEstimate"), "Success page should show customer-facing delivery expectations.");
  assert(script.includes("nm_support_reference_copied"), "Checkout pages should track copied support references.");
  assert(script.includes("CUSTOMER_JOURNEY_COPY"), "Checkout pages should expose the complete localized customer journey copy.");
  ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"].forEach((lang) => {
    assert(script.includes(`${lang}: {`), `Checkout customer journey copy is missing locale: ${lang}`);
  });
  assert(!script.includes("${renderCustomerTip(copy"), "Success and cancel pages should not render a duplicate guidance card.");
  assert(!script.includes("${renderStatusShortcut(copy"), "Success page should not render a duplicate status shortcut.");
  assert(!script.includes("${renderInboxChecklist(copy"), "Success page should not render a separate inbox checklist.");
  assert(!script.includes("${renderFollowUpPanel(copy"), "Success page should not render a separate follow-up card.");
  assert(!script.includes("${renderFeedbackPanel(copy"), "Checkout pages should not add a distracting feedback survey.");
  assert(!/1[–-]2\s*(minutes?|percen|Minuten|minuti|minutos|minutes)/i.test(script), "Checkout copy must not promise an unreliable 1-2 minute delivery window.");
  assert(script.includes('role="status" aria-live="polite"'), "Checkout runtime updates must be announced accessibly.");
  assert(script.includes("checkout_recovery_view"), "Cancel page should track the recovery guidance view.");
  assert(script.includes("Your answers are safe"), "Cancel page should reassure customers after a failed payment.");
  assert(script.includes("trackOnce(\"checkout_cancelled\""), "Cancel page should send a checkout_cancelled event.");
  assert(script.includes("trackOnce(\"checkout_cancelled\""), "Checkout tracking should protect against duplicate checkout_cancelled events.");
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

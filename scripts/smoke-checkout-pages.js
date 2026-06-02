import fs from "fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("\n=== CHECKOUT PAGES SMOKE ===");

  const currentVersion = "20260602-webflow-stable-v1";
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
  assert(script.includes("nm-checkout-pages-stable-v1"), "Checkout pages should install the stable design layer.");
  assert(!/[\u0102\u00c2\u0103\u00e2\u0107\u0158\u0151\u0170\u0147]/.test(script), "Checkout pages should not contain mojibake characters.");
  assert(script.includes("&#10003;"), "Success page should render a safe checkmark entity.");
  assert(script.includes("trackOnce(\"purchase\""), "Success page should send a purchase event.");
  assert(script.includes("neuromap_kids_report"), "Purchase event should include product item metadata.");
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

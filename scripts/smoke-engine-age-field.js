import fs from "fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("\n=== ENGINE AGE FIELD SMOKE ===");

  const loaderHtml = fs.readFileSync("web/engine-embed.full.html", "utf8").trim();
  const script = fs.readFileSync("public/webflow/engine.js", "utf8");

  new Function(script);

  assert(loaderHtml.length < 50000, "Webflow Engine loader embed should stay below the 50k character limit.");
  assert(
    loaderHtml.includes("/public/webflow/engine.js"),
    "Webflow Engine loader should load the public engine file."
  );
  assert(
    loaderHtml.includes("20260603-landing-polish-analytics-v2"),
    "Webflow Engine loader should include the landing polish and analytics v2 cache-busting version."
  );
  assert(script.includes("ENGINE_VERSION"), "Engine should expose an engine version.");
  assert(script.includes("20260603-landing-polish-analytics-v2"), "Engine should expose the current landing polish version.");
  assert(script.includes("ANALYTICS_SCHEMA_VERSION"), "Engine should define an analytics schema version.");
  assert(script.includes("analytics-event-schema-v2"), "Engine should use analytics event schema v2.");
  assert(script.includes("trackSchemaEvent"), "Engine should send normalized analytics events.");
  assert(script.includes("event_schema_version"), "Engine analytics events should include the schema version.");
  assert(script.includes("client_session_id"), "Engine analytics events should include a client session id.");
  assert(script.includes("installLandingPolishV2"), "Engine should install landing polish v2.");
  assert(script.includes("nm-landing-polish-v2"), "Engine should include the scoped landing polish stylesheet.");
  assert(script.includes("nm_landing_view"), "Engine should send a landing view event.");
  assert(script.includes("nm_questionnaire_loaded"), "Engine should send a questionnaire loaded event.");
  assert(script.includes("specific_bank_adhd_count"), "Engine should expose flat specific bank counts for analytics.");
  assert(script.includes("ensureChildAgeField"), "Engine should create the child age field.");
  assert(script.includes("installFrontendDesign"), "Engine should install the Webflow frontend design layer.");
  assert(script.includes("nm-frontend-design-v3"), "Engine should include the scoped frontend design stylesheet.");
  assert(script.includes(".nm-q-card"), "Engine design should style rendered question cards.");
  assert(script.includes(".nm-summary-pills"), "Engine design should style summary pills.");
  assert(script.includes("#childAgeField"), "Engine design should style the child age field.");
  assert(script.includes("@media (max-width: 480px)"), "Engine design should include a compact mobile breakpoint.");
  assert(script.includes("prefers-reduced-motion"), "Engine design should respect reduced motion preferences.");
  assert(script.includes('input.id = "childAge"'), "Engine should insert #childAge.");
  assert(script.includes("validateChildAge"), "Engine should validate child age before checkout.");
  assert(script.includes("childAge,"), "Engine should include childAge in checkout payload.");
  assert(script.includes("ageYears: childAge"), "Engine should include ageYears in checkout payload.");

  const expectedAgeLabels = [
    "Gyermek életkora",
    "Child age",
    "Alter des Kindes",
    "Eta del bambino",
    "Edad del niño",
    "孩子年龄",
    "子どもの年齢",
    "عمر الطفل",
    "Wiek dziecka",
    "Idade da criança",
    "Âge de l'enfant"
  ];

  expectedAgeLabels.forEach((label) => {
    assert(script.includes(label), `Engine should include localized age label: ${label}`);
  });

  console.log("Engine age field smoke passed.");
}

try {
  main();
} catch (error) {
  console.error("Engine age field smoke failed:", error.message);
  process.exit(1);
}

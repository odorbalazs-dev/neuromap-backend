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
  assert(script.includes("ensureChildAgeField"), "Engine should create the child age field.");
  assert(script.includes("installFrontendDesign"), "Engine should install the Webflow frontend design layer.");
  assert(script.includes("nm-frontend-design-v2"), "Engine should include the scoped frontend design stylesheet.");
  assert(script.includes(".nm-q-card"), "Engine design should style rendered question cards.");
  assert(script.includes(".nm-summary-pills"), "Engine design should style summary pills.");
  assert(script.includes('input.id = "childAge"'), "Engine should insert #childAge.");
  assert(script.includes("validateChildAge"), "Engine should validate child age before checkout.");
  assert(script.includes("childAge,"), "Engine should include childAge in checkout payload.");
  assert(script.includes("ageYears: childAge"), "Engine should include ageYears in checkout payload.");

  console.log("Engine age field smoke passed.");
}

try {
  main();
} catch (error) {
  console.error("Engine age field smoke failed:", error.message);
  process.exit(1);
}

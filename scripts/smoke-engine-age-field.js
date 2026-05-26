import fs from "fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractScript(html) {
  return html
    .replace(/^\s*<script>\s*/i, "")
    .replace(/\s*<\/script>\s*$/i, "");
}

function main() {
  console.log("\n=== ENGINE AGE FIELD SMOKE ===");

  const html = fs.readFileSync("web/engine-embed.full.html", "utf8");
  const script = extractScript(html);

  new Function(script);

  assert(script.includes("ensureChildAgeField"), "Engine should create the child age field.");
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

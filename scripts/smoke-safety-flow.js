import fs from "node:fs";

import { SPECIFIC_BANKS } from "../src/data/banks/index.js";
import { pickBalancedSpecificQuestions } from "../src/services/adaptive-engine.service.js";

const SAFETY_IDS = ["DEP_112", "DEP_114", "DEP_119"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  console.log("\n=== SAFETY FLOW SMOKE ===");

  const depressionBank = SPECIFIC_BANKS.DEPRESSION || [];
  const safetyItems = depressionBank.filter((item) => item?.safetySignal === true);

  assert(safetyItems.length === SAFETY_IDS.length, "Depression bank must expose exactly three safety items.");
  assert(
    SAFETY_IDS.every((id) => safetyItems.some((item) => item.id === id)),
    "All approved safety item IDs must be marked as safety signals."
  );

  for (let index = 0; index < 100; index += 1) {
    const selected = pickBalancedSpecificQuestions(depressionBank, {
      count: 30,
      seed: `safety-smoke-${index}`
    });
    const selectedIds = new Set(selected.map((item) => item.id));
    SAFETY_IDS.forEach((id) => {
      assert(selectedIds.has(id), `${id} was omitted for deterministic seed ${index}.`);
    });
  }

  const engine = fs.readFileSync("public/webflow/engine.js", "utf8");
  assert(engine.includes("urgentSupportNeeded"), "Browser engine must expose urgent support state.");
  assert(engine.includes("criticalSupportNeeded"), "Browser engine must distinguish stronger safety signals.");
  assert(engine.includes("showImmediateSafetySupport"), "Browser engine must show immediate support guidance.");
  assert(engine.includes("safetySupportAcknowledged"), "Browser engine must persist support acknowledgement.");
  assert(
    engine.includes("if (isSafetyQuestion) {") && engine.includes("return;"),
    "Safety items must be excluded from ordinary profile scoring."
  );
  assert(!engine.includes("Math.random"), "Question and identifier selection must not use Math.random.");

  console.log("Safety flow smoke passed.");
}

try {
  main();
} catch (error) {
  console.error("Safety flow smoke failed:", error.message);
  process.exit(1);
}

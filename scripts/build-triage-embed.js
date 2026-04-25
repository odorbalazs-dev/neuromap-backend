import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

async function main() {
  const sourceFile = path.join(process.cwd(), "src", "data", "banks", "triage.bank.js");
  const outputDir = path.join(process.cwd(), "public", "banks");
  const outputFile = path.join(outputDir, "triage.embed.js");

  const mod = await import(pathToFileURL(sourceFile).href + `?t=${Date.now()}`);
  const bank = mod.TRIAGE_BANK;

  if (!Array.isArray(bank)) {
    throw new Error("TRIAGE_BANK export is not an array.");
  }

  if (bank.length !== 250) {
    throw new Error(`TRIAGE_BANK should contain 250 items, found ${bank.length}.`);
  }

  const content = `/* =========================
   NEUROMAP TRIAGE BANK EMBED
   Auto-generated from src/data/banks/triage.bank.js
========================= */

(function () {
  const TRIAGE_BANK = ${JSON.stringify(bank, null, 2)};

  if (typeof window !== "undefined") {
    window.NM_TRIAGE_BANK = TRIAGE_BANK;
    console.log("✅ window.NM_TRIAGE_BANK LOADED:", window.NM_TRIAGE_BANK.length);
  }
})();
`;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, content, "utf8");

  console.log(`DONE: ${outputFile}`);
  console.log(`Items: ${bank.length}`);
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
import fs from "fs/promises";
import path from "path";

const TARGET_TOTAL = 250;
const CORE_COUNT = 120;
const GENERATED_TARGET = TARGET_TOTAL - CORE_COUNT;

const BANK_FILES = [
  "src/data/banks/anxiety.bank.js",
  "src/data/banks/depression.bank.js",
  "src/data/banks/learning.bank.js"
];

async function normalizeFile(filePath) {
  const absolutePath = path.join(process.cwd(), filePath);
  let content = await fs.readFile(absolutePath, "utf8");

  const before = content;

  content = content.replace(
    /return\s+items\s*;\s*\}\)\(\)/g,
    `return items.slice(0, ${GENERATED_TARGET});\n})()`
  );

  content = content.replace(
    /return\s+items\.slice\(0,\s*\d+\)\s*;\s*\}\)\(\)/g,
    `return items.slice(0, ${GENERATED_TARGET});\n})()`
  );

  if (content === before) {
    console.log(`SKIPPED: ${filePath} — no generated return block found.`);
    return;
  }

  await fs.writeFile(absolutePath, content, "utf8");
  console.log(`UPDATED: ${filePath} → generated block limited to ${GENERATED_TARGET}`);
}

async function main() {
  for (const file of BANK_FILES) {
    await normalizeFile(file);
  }

  console.log("\nDone.");
  console.log("Next:");
  console.log("1) node scripts/audit-banks.js");
  console.log("2) node scripts/build-banks-bundle.js");
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
import fs from "fs/promises";
import path from "path";

async function main() {
  const publicBanksDir = path.join(process.cwd(), "public", "banks");
  const outputFile = path.join(publicBanksDir, "all-banks.bundle.js");

  const files = await fs.readdir(publicBanksDir);

  const translatedBankFiles = files
    .filter((file) => file.endsWith(".translated.js"))
    .filter((file) => file !== "all-banks.bundle.js")
    .sort();

  if (translatedBankFiles.length === 0) {
    throw new Error("No translated bank files found in public/banks");
  }

  const parts = [];

  parts.push(`/* =========================`);
  parts.push(`   ALL BANKS BUNDLE`);
  parts.push(`========================= */`);
  parts.push(``);

  for (const file of translatedBankFiles) {
    const fullPath = path.join(publicBanksDir, file);
    const content = await fs.readFile(fullPath, "utf8");

    parts.push(`/* ===== ${file} ===== */`);
    parts.push(content.trim());
    parts.push(``);
  }

  parts.push(`console.log("✅ ALL BANKS BUNDLE LOADED");`);
  parts.push(``);

  await fs.writeFile(outputFile, parts.join("\n"), "utf8");

  console.log(`DONE: ${outputFile}`);
  console.log(`Included files:`, translatedBankFiles);
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
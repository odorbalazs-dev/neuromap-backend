import fs from "fs/promises";
import path from "path";

const BANK_MAP = [
  { fileIncludes: "adhd.bank", globalName: "NM_ADHD_BANK" },
  { fileIncludes: "asd.bank", globalName: "NM_ASD_BANK" },
  { fileIncludes: "anxiety.bank", globalName: "NM_ANXIETY_BANK" },
  { fileIncludes: "depression.bank", globalName: "NM_DEPRESSION_BANK" },
  { fileIncludes: "learning.bank", globalName: "NM_LEARNING_BANK" }
];

function convertToBrowserGlobal(content, globalName) {
  let out = content.trim();

  out = out.replace(/export\s+const\s+([A-Z_]+)\s*=/, `window.${globalName} =`);
  out = out.replace(/const\s+([A-Z_]+)\s*=/, `window.${globalName} =`);
  out = out.replace(/console\.log\(.*?\);?/g, "");

  return out;
}

async function main() {
  const publicBanksDir = path.join(process.cwd(), "public", "banks");
  const outputFile = path.join(publicBanksDir, "all-banks.bundle.js");

  const files = await fs.readdir(publicBanksDir);

  const translatedBankFiles = files
    .filter((file) => file.endsWith(".translated.js"))
    .filter((file) => !file.includes("triage"))
    .sort();

  if (translatedBankFiles.length === 0) {
    throw new Error("No translated specific bank files found in public/banks");
  }

  const parts = [];

  parts.push(`/* =========================`);
  parts.push(`   ALL SPECIFIC BANKS BUNDLE`);
  parts.push(`========================= */`);
  parts.push(``);

  for (const mapItem of BANK_MAP) {
    const file = translatedBankFiles.find((f) =>
      f.toLowerCase().includes(mapItem.fileIncludes)
    );

    if (!file) {
      throw new Error(`Missing translated bank file for ${mapItem.fileIncludes}`);
    }

    const fullPath = path.join(publicBanksDir, file);
    const content = await fs.readFile(fullPath, "utf8");

    parts.push(`/* ===== ${file} ===== */`);
    parts.push(convertToBrowserGlobal(content, mapItem.globalName));
    parts.push(``);
  }

  parts.push(`
window.NM_SPECIFIC_BANK = {
  ADHD: window.NM_ADHD_BANK || [],
  ASD: window.NM_ASD_BANK || [],
  ANXIETY: window.NM_ANXIETY_BANK || [],
  DEPRESSION: window.NM_DEPRESSION_BANK || [],
  LEARNING: window.NM_LEARNING_BANK || []
};

console.log("✅ ALL BANKS BUNDLE LOADED", {
  ADHD: window.NM_SPECIFIC_BANK.ADHD.length,
  ASD: window.NM_SPECIFIC_BANK.ASD.length,
  ANXIETY: window.NM_SPECIFIC_BANK.ANXIETY.length,
  DEPRESSION: window.NM_SPECIFIC_BANK.DEPRESSION.length,
  LEARNING: window.NM_SPECIFIC_BANK.LEARNING.length
});
`);

  await fs.writeFile(outputFile, parts.join("\n"), "utf8");

  console.log(`DONE: ${outputFile}`);
  console.log(`Included files:`, translatedBankFiles);
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
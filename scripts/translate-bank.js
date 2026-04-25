import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TARGET_LANGS = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

/* =========================
   HELPERS
========================= */

function escapeTemplateString(value = "") {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

function isValidTextMap(text) {
  return text && typeof text === "object" && !Array.isArray(text);
}

function getMissingLangs(textMap) {
  return TARGET_LANGS.filter((lang) => !textMap[lang] || !String(textMap[lang]).trim());
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function stripMarkdownCodeFence(value = "") {
  return String(value)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/* =========================
   TRANSLATION
========================= */

async function translateBatch(items) {
  const payload = items.map((item) => ({
    id: item.id,
    source: item.sourceText,
    missingLangs: item.missingLangs
  }));

  const prompt = `
You are translating child development and mental health screening questionnaire items.

Requirements:
- Preserve the psychological meaning exactly.
- Keep the language natural, parent-facing, and clinically neutral.
- Do not diagnose.
- Do not add explanation.
- Return translations only.
- Keep sentence style concise.
- DO NOT use markdown or code blocks.
- Return valid JSON only.

Return JSON array:
[{ id, translations: { lang: text } }]

Input:
${JSON.stringify(payload, null, 2)}
`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt
  });

  const text =
    response.output_text ||
    (Array.isArray(response.output)
      ? response.output
          .flatMap((item) => item.content || [])
          .map((c) => c.text || "")
          .join("\n")
      : "");

  if (!text || !text.trim()) {
    throw new Error("Empty response from model");
  }

  const cleaned = stripMarkdownCodeFence(text);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("JSON parse failed:\n" + text);
  }

  return parsed;
}

/* =========================
   OUTPUT FORMAT
========================= */

function serializeBankModule(exportName, items) {
  const safeName = exportName.replace("_BANK", "");
  const globalName = `window.NM_${safeName}_BANK`;

  const lines = [];

  lines.push(`${globalName} = [`);

  for (const item of items) {
    lines.push(`  {`);
    lines.push(`    id: ${JSON.stringify(item.id)},`);
    lines.push(`    domain: ${JSON.stringify(item.domain)},`);
    lines.push(`    subdomain: ${JSON.stringify(item.subdomain)},`);
    lines.push(`    weight: ${JSON.stringify(item.weight)},`);
    lines.push(`    reverse: ${JSON.stringify(!!item.reverse)},`);
    lines.push(`    text: {`);

    for (const lang of TARGET_LANGS) {
      const value = item.text?.[lang] || "";
      lines.push(`      ${lang}: \`${escapeTemplateString(value)}\`,`);
    }

    lines.push(`    }`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`console.log("✅ ${globalName} LOADED:", ${globalName}.length);`);

  return lines.join("\n");
}

/* =========================
   LOAD INPUT
========================= */

async function loadBankModule(inputPath) {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  const moduleUrl = pathToFileURL(absolutePath).href;
  const mod = await import(moduleUrl);

  const [exportName, items] = Object.entries(mod).find(([, v]) => Array.isArray(v));

  if (!items) {
    throw new Error("No array export found in module");
  }

  return { exportName, items };
}

/* =========================
   MAIN
========================= */

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: node scripts/translate-bank.js <path>");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const { exportName, items } = await loadBankModule(inputPath);

  const normalized = items.map((item) => {
    const source = item.text.en || item.text.hu;

    if (!source) {
      throw new Error(`Missing source text: ${item.id}`);
    }

    return {
      ...item,
      text: { ...item.text },
      sourceText: source,
      missingLangs: getMissingLangs(item.text)
    };
  });

  const toTranslate = normalized.filter((i) => i.missingLangs.length > 0);

  console.log("Total:", normalized.length);
  console.log("Need translation:", toTranslate.length);

  const batches = chunkArray(toTranslate, 10);

  for (let i = 0; i < batches.length; i++) {
    console.log(`Batch ${i + 1}/${batches.length}`);

    const result = await translateBatch(batches[i]);

    const map = new Map(result.map((r) => [r.id, r.translations]));

    for (const item of batches[i]) {
      const tr = map.get(item.id);

      for (const lang of item.missingLangs) {
        item.text[lang] = tr[lang];
      }
    }
  }

  const finalItems = normalized.map(({ sourceText, missingLangs, ...rest }) => rest);

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputDir = path.join(process.cwd(), "public", "banks");

  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${baseName}.translated.js`);

  const output = serializeBankModule(exportName, finalItems);

  await fs.writeFile(outputPath, output, "utf8");

  console.log("DONE:", outputPath);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
});
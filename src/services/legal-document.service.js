import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// One source for the public documents, displayed-content hashes and receipt archive.
const context = { window: {} };
vm.runInNewContext(readFileSync(new URL("../../public/webflow/legal-content.js", import.meta.url), "utf8"), context, { timeout: 1000 });
export const legalContent = context.window.NM_LEGAL_CONTENT;
export function documentDigest(value) {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}
export const legalContentDigests = Object.fromEntries(
  Object.entries(legalContent).map(([lang, content]) => [lang, documentDigest(content)])
);

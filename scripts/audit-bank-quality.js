import {
  buildBankQualityAudit,
  printBankQualityAuditReport
} from "../src/services/bank-quality-audit.service.js";

const STRICT = process.argv.includes("--strict");
const AS_JSON = process.argv.includes("--json");

async function main() {
  const audit = await buildBankQualityAudit({
    strict: STRICT,
    includePublic: true
  });

  if (AS_JSON) {
    console.log(JSON.stringify(audit, null, 2));
  } else {
    printBankQualityAuditReport(audit);
  }

  const blockingCount = Number(audit.summary?.blockingIssueCount || 0);

  if (blockingCount > 0) {
    if (!AS_JSON) {
      console.log(`\nQuality audit failed with ${blockingCount} blocking issue(s).`);
    }
    process.exitCode = 1;
    return;
  }

  if (STRICT && Number(audit.summary?.issueCounts?.warning || 0) > 0) {
    if (!AS_JSON) {
      console.log("\nQuality audit strict mode completed with warning-level findings.");
    }
    return;
  }

  if (!AS_JSON) {
    console.log("\nQuality audit completed without blocking issues.");
  }
}

main().catch((error) => {
  console.error("Audit failed:", error);
  process.exit(1);
});

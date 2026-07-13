import fs from "fs";

const BUILD_PATH = "campaigns/google-ads/google-ads-search-build.json";
const REQUIRED_LANGUAGES = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function characterLength(value) {
  return Array.from(String(value || "")).length;
}

function validateCampaign(campaign) {
  assert(campaign.status === "PAUSED", `${campaign.name}: campaigns must be prepared in PAUSED state.`);
  assert(campaign.dailyBudgetHuf > 0, `${campaign.name}: daily budget must be positive.`);
  assert(Array.isArray(campaign.locations) && campaign.locations.length, `${campaign.name}: locations are required.`);
  assert(Array.isArray(campaign.headlines), `${campaign.name}: headlines are required.`);
  assert(campaign.headlines.length >= 8 && campaign.headlines.length <= 15, `${campaign.name}: use 8-15 headlines.`);
  assert(new Set(campaign.headlines).size === campaign.headlines.length, `${campaign.name}: headlines must be unique.`);

  campaign.headlines.forEach((headline) => {
    assert(characterLength(headline) <= 30, `${campaign.name}: headline exceeds 30 characters: ${headline}`);
  });

  assert(Array.isArray(campaign.descriptions), `${campaign.name}: descriptions are required.`);
  assert(campaign.descriptions.length >= 2 && campaign.descriptions.length <= 4, `${campaign.name}: use 2-4 descriptions.`);
  assert(new Set(campaign.descriptions).size === campaign.descriptions.length, `${campaign.name}: descriptions must be unique.`);

  campaign.descriptions.forEach((description) => {
    assert(characterLength(description) <= 90, `${campaign.name}: description exceeds 90 characters: ${description}`);
  });

  const url = new URL(campaign.finalUrl);
  assert(url.origin === "https://neuromap-kids.webflow.io", `${campaign.name}: final URL must use the production landing origin.`);

  if (campaign.language !== "all") {
    assert(url.searchParams.get("lang") === campaign.language, `${campaign.name}: final URL language mismatch.`);
  }

  assert(Array.isArray(campaign.adGroups) && campaign.adGroups.length, `${campaign.name}: ad groups are required.`);
  campaign.adGroups.forEach((adGroup) => {
    assert(adGroup.name, `${campaign.name}: ad group name is required.`);
    assert(Array.isArray(adGroup.keywords) && adGroup.keywords.length >= 3, `${campaign.name}/${adGroup.name}: at least 3 keyword themes are required.`);
    assert(new Set(adGroup.keywords).size === adGroup.keywords.length, `${campaign.name}/${adGroup.name}: keywords must be unique.`);
  });
}

function main() {
  const build = JSON.parse(fs.readFileSync(BUILD_PATH, "utf8"));

  assert(build.defaultStatus === "PAUSED", "Default campaign status must be PAUSED.");
  assert(build.primaryConversion === "purchase", "Purchase must be the primary conversion.");
  assert(build.finalUrlSuffix.includes("utm_source=google"), "Final URL suffix must identify Google traffic.");
  assert(build.finalUrlSuffix.includes("{campaignid}"), "Final URL suffix must include campaign id.");
  assert(build.finalUrlSuffix.includes("{keyword}"), "Final URL suffix must include keyword.");
  assert(Array.isArray(build.campaigns), "Campaign list is required.");

  const names = build.campaigns.map((campaign) => campaign.name);
  assert(new Set(names).size === names.length, "Campaign names must be unique.");

  const localizedCampaigns = build.campaigns.filter((campaign) => campaign.language !== "all");
  const languages = localizedCampaigns.map((campaign) => campaign.language).sort();
  assert(
    JSON.stringify(languages) === JSON.stringify([...REQUIRED_LANGUAGES].sort()),
    `Localized campaign coverage mismatch. Found: ${languages.join(", ")}`
  );

  build.campaigns.forEach(validateCampaign);

  const pilotBudget = build.campaigns
    .filter((campaign) => build.pilot.campaigns.includes(campaign.name))
    .reduce((sum, campaign) => sum + campaign.dailyBudgetHuf, 0);

  assert(pilotBudget === build.pilot.dailyBudgetHuf, "Pilot campaign budgets must match the declared pilot budget.");
  assert(
    build.pilot.maximumSpendHuf === build.pilot.dailyBudgetHuf * build.pilot.durationDays,
    "Pilot maximum spend must equal daily budget multiplied by duration."
  );

  console.log("[google-ads-build] validation passed", {
    campaigns: build.campaigns.length,
    languages: localizedCampaigns.length,
    pilotBudgetHuf: build.pilot.dailyBudgetHuf,
    maximumPilotSpendHuf: build.pilot.maximumSpendHuf
  });
}

try {
  main();
} catch (error) {
  console.error("[google-ads-build] validation failed:", error.message);
  process.exit(1);
}

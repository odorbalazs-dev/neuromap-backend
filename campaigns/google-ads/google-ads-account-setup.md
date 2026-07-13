# Google Ads account setup runbook

This is the click-by-click setup order for the NeuroMap Kids global Search pilot. Nothing should be enabled before the final review.

## 1. Account foundation

1. Confirm billing country, time zone and account currency before creating campaigns. Recommended account currency: `HUF`.
2. Enable auto-tagging so Google can append `gclid`, `gbraid` or `wbraid` where applicable.
3. Open `Billing > Promotions` and record the exact 120,000 HUF offer terms shown in this account:
   - eligibility status
   - qualifying spend
   - deadline
   - credit expiry
4. Do not spend only to qualify for the promotion if CPA is above the stop limit.

## 2. Measurement

1. Link Google Ads and the production GA4 property.
2. Import or create the `purchase` conversion.
3. Set `purchase` to `Primary`, use the transaction value and count every purchase.
4. Set these events to `Secondary`:
   - `nm_questionnaire_started`
   - `nm_triage_completed`
   - `nm_specific_completed`
   - `nm_checkout_started`
   - `checkout_cancelled`
5. Verify that a test purchase has one transaction ID and does not duplicate after refresh.
6. Confirm EEA consent mode and consent banner behavior before traffic is enabled.

## 3. Campaign creation

Source of truth: `campaigns/google-ads/google-ads-search-build.json`.

1. Create every campaign in `PAUSED` state.
2. Use Search Network only. Disable Display Network expansion.
3. Use the exact final URL from the build file.
4. Apply the account-level Final URL suffix from the build file.
5. Use exact and phrase match only during the pilot.
6. Apply the shared negative keyword list.
7. Location option: target people **in or regularly in** the selected locations, not people merely interested in them.
8. Language setting must match the campaign language.

## 4. Pilot campaigns

Only these four can be enabled after review:

| Campaign | Daily budget |
| --- | ---: |
| `NM_HU_Search_Core` | 3,000 HUF |
| `NM_EN_Search_Core_Tier1` | 4,000 HUF |
| `NM_DE_Search_Core_DACH` | 3,000 HUF |
| `NM_GLOBAL_Search_Brand` | 500 HUF |

Total daily cap: `10,500 HUF`.

Initial bidding: Maximize Clicks with a strict CPC ceiling. Move to Maximize Conversions only after 15-30 verified purchases. Do not use broad match or Performance Max in the pilot.

## 5. Ad assets

1. Create one responsive search ad per ad group from the localized campaign assets.
2. Do not pin headlines unless a legal disclaimer requires it.
3. Add callouts:
   - about 10 minutes
   - parent-friendly PDF
   - report by email
   - no subscription
   - informational screening
4. Use neutral, parent-focused language. Never imply that Google knows the child has a condition.
5. Do not create remarketing, Customer Match or custom health-related audiences from questionnaire behavior.

## 6. Launch gates

Before enabling the pilot, all checks must be true:

- every `?lang=` URL opens in the correct language
- price is visibly `5 USD`
- checkout success and cancel pages match the selected language
- `purchase` appears once in Tag Assistant and GA4 DebugView
- campaign UTM and click IDs reach the purchase event
- Stripe payment, webhook, worker, PDF and email pipeline are healthy
- privacy, terms/refund information and contact details are reachable
- ads contain no diagnosis or guaranteed-outcome claims

## 7. Stop rules

Pause an ad group when any of these occurs:

- 50 clicks with no checkout start
- spend reaches 2,400 HUF with no purchase
- CPA exceeds 1,800 HUF after at least 3 purchases
- landing language mismatch or checkout error is observed
- policy warning appears for personalized health advertising

Scale only when 7-day CPA is at or below 1,200 HUF and the report/email delivery chain remains healthy.

## 8. Promotion handling

The 120,000 HUF credit is treated as pilot extension money, not launch revenue. Once Google confirms and posts the credit, allocate it in this order:

1. expand the best-performing HU/EN/DE ad group
2. test FR
3. test ES
4. test PL

The remaining language campaigns stay paused until the previous phase passes its CPA gate.

## 9. Final approval before activation

Record screenshots of:

- promotion terms
- conversion goal settings
- campaign budgets
- location and language settings
- negative keyword list
- the first responsive search ads

The final activation should be a separate explicit step after reviewing those screenshots.

## Official Google references

- Promotions and new advertiser offers: https://support.google.com/google-ads/answer/6388096
- Promotional code conditions and credit timing: https://support.google.com/google-ads/answer/2393021
- Conversion goals and primary/secondary actions: https://support.google.com/google-ads/answer/10995103
- Responsive Search Ad limits: https://support.google.com/google-ads/answer/7684791
- Personalized advertising and sensitive health categories: https://support.google.com/adspolicy/answer/143465
- Google Ads Editor CSV format: https://support.google.com/google-ads/editor/answer/57747

# Vendor and International Transfer Register

Status: evidence checklist; no vendor is approved solely because it appears here.

| Vendor | Expected role/use | Data exposure to minimize | Required evidence before production approval |
|---|---|---|---|
| Railway | Hosting, runtime, database | Session data, reports, operational logs | Executed DPA, regions, sub-processors, security measures, deletion/backups, incident terms, transfer mechanism and TIA |
| OpenAI | Report text generation | Minimum structured questionnaire context; no billing data | Executed DPA, API data-use/retention settings, region/transfer terms, sub-processors, SCC/TIA, model/version change process |
| Resend | Transactional email | Adult email, localized message, report attachment or secure delivery link | DPA, delivery/log retention, sub-processors, transfer mechanism/TIA, suppression and deletion process |
| Stripe | Checkout/payment | Adult payment/contact and package/amount; no questionnaire answers | Controller/processor role mapping, DPA/terms, webhook minimization, retention, transfer evidence, fraud-processing transparency |
| Szamlazz.hu | Invoicing | Legally required adult billing data and transaction | Contract/DPA or independent-controller analysis, statutory retention, country/hosting, incident and deletion process |
| Google/Meta/TikTok | Optional analytics/advertising | Only consented non-sensitive events; never answers, inferred condition, severity, email or stable session ID | Separate consent configuration, controller-role analysis, platform policy review, transfer evidence, consent-mode test, deletion/opt-out process |

## Approval record per vendor

Record legal entity, service owner, contract date, DPA link, processing locations, sub-processors, transfer tool, SCC module, TIA date/result, encryption, access controls, retention/deletion, breach SLA, audit evidence, termination/export procedure, last review and next review. Privacy and security owners must sign the record.

## Change control

A new model, region, sub-processor, telemetry feature or fallback provider is a vendor change. Block production use until the register, privacy notice, ROPA and DPIA are reviewed. Annually verify that linked evidence is still current and that actual environment configuration matches the approved data flow.

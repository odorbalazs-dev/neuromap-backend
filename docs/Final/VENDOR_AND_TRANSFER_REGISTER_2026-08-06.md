# Vendor, Processor and International Transfer Evidence Register

> **Status: controller evidence working paper - not a vendor approval record**
>
> Version: 2026-07-26-draft-4
> Public-source review date: 2026-07-26
> Scope: the production questionnaire, payment, report, email, invoice, frontend and optional marketing measurement flows.

This register records what can be supported by current public vendor documents and what still requires account-level, contractual or configuration evidence from the controller. A public privacy page, trust-centre badge or standard DPA does **not** prove that the NeuroMap Kids account has accepted the relevant terms, uses the reviewed region and retention settings, or is contractually permitted to submit intentionally collected child-related health inferences.

The controller must preserve signed or accepted agreements, account exports and dated screenshots in its own controlled evidence repository. Links below are references, not archived copies of the source documents.

## 1. Production data-flow inventory

| Service | Current use | Data intentionally exposed | Current evidence decision |
| --- | --- | --- | --- |
| Railway | API, worker, PostgreSQL database and runtime hosting | adult contact data; questionnaire answers; child-related observations and inferred screening results; reports; consent and operational records | **Launch blocker unresolved:** standard DPA schedule describes no intended sensitive/special-category data |
| OpenAI API | Generates the narrative report from structured questionnaire context | translated question text and answers; detected focus/secondary focus; scoring, ranking, profile, age context and report instructions; no billing data required | **Launch blocker unresolved:** standard DPA schedule does not describe intentional sensitive-data submission; account retention and region evidence missing |
| Resend | Sends transactional report email and PDF attachment | adult recipient email; localized message; personalized PDF containing child-related observations and inferences; delivery metadata | **High-risk evidence gap:** written confirmation or contracted coverage for the sensitive attachment is missing |
| Stripe | Checkout, payment, tax/billing collection and webhook | adult email and billing data; package, amount, currency; internal session reference; language; no questionnaire answers or report content | Conditional approval only after account/DPA/security evidence |
| Számlázz.hu / KBOSS.hu Kft. | Invoice generation | adult invoice name, email, address and tax data; paid amount/currency; product description; Stripe and internal transaction references; no questionnaire content | Conditional approval only after role, contract and retention evidence |
| Webflow | Public frontend and script/embed delivery | intended: page requests, consent state and non-sensitive frontend telemetry only; questionnaire payload should post directly to Railway | Conditional approval only after network/form/analytics inspection proves exclusion of questionnaire data |
| Google Analytics / Google tag | Optional consented measurement | permitted design: coarse landing-page events only, without email, child data, answers, focus, severity, report or stable session ID | **Restricted:** no tags on questionnaire, summary, checkout-success or report-access pages until policy/legal review and network proof |
| Meta Business Tools | Not used for server-side sensitive-funnel events; service code returns a disabled status | none from questionnaire/report flow | **Keep disabled:** Meta terms prohibit child and health/sensitive event data |
| TikTok advertiser tools | No production integration identified | none | **Not approved / not integrated:** future integration requires a separate DPIA change review |

## 2. Evidence standard and status meanings

- **Public-source evidence:** official vendor DPA, privacy, security, subprocessor, data-control or product terms reviewed at the URL and date listed below.
- **Account evidence:** dated screenshot/export of the actual production account, entity, region, retention, training/data-use, tracking, access-control and notification settings.
- **Contract evidence:** executed or electronically accepted DPA/terms, correct contracting entity, service schedule, SCC/UK addendum where relevant and any negotiated sensitive-data wording.
- **Operational evidence:** network capture, payload sample, deletion/export test, restore test, access review, breach-contact test and subprocessor-change monitoring.
- **Launch blocker:** the DPIA must not be approved until the issue is closed or the data flow is redesigned so the vendor no longer receives the affected data.

## 3. Core processor due diligence

### 3.1 Railway

**Actual role and payload.** Railway hosts the API, worker and PostgreSQL database. It can therefore process the complete production session, including adult contact data, questionnaire answers, child-related observations and inferences, consent evidence, reports and operational metadata.

**Public evidence reviewed.** Railway's DPA identifies processor/subprocessor roles, international-transfer safeguards and a subprocessor-change mechanism. Its security schedule describes logical isolation, encryption in transit and at rest, access controls, logging, incident response, business continuity, backups and security review. The public DPA also describes the standard processing schedule as containing no intended sensitive or special-category data.

**Finding.** That standard schedule does not match the intentional production processing of child-related health-like observations and inferences. General infrastructure security statements do not cure a scope mismatch in the processing description.

**Required private evidence before approval.** Executed DPA and service schedule; written Railway confirmation or negotiated schedule expressly covering the actual categories and data subjects; production region; infrastructure/subprocessor chain; access and MFA evidence; database encryption; backup retention/deletion and restore evidence; incident contact/SLA; SCC module and transfer impact assessment; termination/export/deletion procedure.

**Decision.** Launch blocker until the contract/schedule is aligned or the sensitive data is moved to an approved architecture.

### 3.2 OpenAI API

**Actual role and payload.** The report service sends structured questionnaire content to the Responses API: localized questions and answers, detected focus and secondary focus, scoring/ranking/profile, result summary, age context and report-generation instructions. Adult billing details are not needed and should remain excluded.

**Public evidence reviewed.** OpenAI's DPA sets out Article 28 processor terms, confidentiality, rights assistance, security, incident, audit, subprocessor and SCC/UK transfer provisions. OpenAI's API data-control documentation states that API data is not used for model training by default unless the customer opts in; it also describes default abuse-monitoring retention, endpoint/application-state retention, `store: false`, Zero Data Retention and regional controls. The public DPA's standard processing description does not present intentionally submitted sensitive data as the expected use case.

**Finding.** The production prompt intentionally contains potentially Article 9 health-related observations/inferences. Default no-training language is valuable but is not the same as zero retention, an approved region, or contractual permission for the intended sensitive-data category.

**Required private evidence before approval.** Executed DPA with the correct entity; written/custom coverage for the actual sensitive categories and child data subject; production project screenshots/exports showing model, region, data-sharing/training status, retention, `store` behaviour and any Modified Abuse Monitoring or Zero Data Retention approval; current subprocessor notice subscription; SCC/TIA; access/MFA and API-key rotation evidence; prompt/payload minimization sample; model/change-control owner.

**Decision.** Launch blocker until the DPA scope and production data-control configuration are evidenced.

### 3.3 Resend

**Actual role and payload.** Resend receives the adult recipient email, localized transactional content and a personalized PDF attachment containing child-related observations and screening inferences. It also processes delivery/bounce metadata.

**Public evidence reviewed.** Resend's DPA describes processor obligations, SCC/transfer provisions, subprocessors and technical/organisational safeguards. Its security material describes access controls, encryption, logging, incident response, penetration testing, deletion/export and continuity controls. The service also publishes a signed form DPA and a subprocessor list.

**Finding.** A public DPA and security page do not establish that the production account has accepted the DPA or that sending a special-category report as an email attachment is within the contracted, suitable use. Email misdelivery has high impact and an attachment persists outside the controller's system.

**Required private evidence before approval.** Accepted/executed DPA; contracting entity; written suitability/coverage for the report attachment; production account MFA/access list; tracking/open/click settings; log/content retention; subprocessor notice subscription; SCC/TIA; bounce/suppression/deletion process; incident contact; misdelivery correction process. Prefer a short-lived authenticated download link over a full sensitive attachment if suitable contractual coverage is not obtained.

**Decision.** High-risk evidence gap; block sensitive attachments until closed or replace attachment delivery with a controlled secure-link design.

### 3.4 Stripe

**Actual role and payload.** Stripe receives adult payment/contact and billing data, package, amount/currency, language and internal transaction/session references. Questionnaire answers, inferred focus and report content must never be included in Checkout metadata, descriptions, webhook logs or support exports.

**Public evidence reviewed.** Stripe's DPA and DPA FAQ describe varying controller/processor roles, international transfer mechanisms, subprocessors and security obligations. Stripe publishes subprocessor-vetting information and a Services Agreement overview.

**Finding.** The designed data boundary is proportionate, but the exact Stripe entity/role, accepted terms, production mode controls and webhook security remain account facts.

**Required private evidence before approval.** Accepted DPA/Services Agreement; production entity and region/transfer mapping; account MFA and least privilege; restricted keys; webhook endpoint and signing-secret rotation evidence; Radar/fraud transparency; retention/export/deletion information; subprocessor notice; minimized metadata sample.

**Decision.** Conditional approval after account and contract evidence; no questionnaire/report fields may cross the boundary.

### 3.5 Számlázz.hu / KBOSS.hu Kft.

**Actual role and payload.** The invoice integration sends only legally necessary adult invoice/contact information, amount/currency, product description and payment/internal references. It should not receive questionnaire answers, child-related inferences or report text.

**Public evidence reviewed.** Számlázz.hu publishes a current privacy notice and general terms identifying KBOSS.hu Kft. and describing controller/processor roles, invoice-data categories, retention and service infrastructure. It also publishes Számla Agent integration documentation.

**Finding.** The exact role depends on the account and transaction. Statutory invoice retention must remain separated from the shorter questionnaire/report retention schedule.

**Required private evidence before approval.** Accepted current terms and any processor agreement; exact controller/processor role; production account/entity; Számla Agent key access/rotation; field-level payload sample; EU/EEA hosting/subprocessor evidence; statutory retention confirmed by accountant/legal counsel; correction/cancellation and incident procedures.

**Decision.** Conditional approval after role/contract and production payload evidence.

### 3.6 Webflow

**Actual role and payload.** Webflow serves the public interface and script loaders. The intended design sends questionnaire answers directly from the browser to the Railway API. Webflow forms, CMS, analytics, session replay and third-party embeds must not capture the questionnaire, focus, report or adult email.

**Public evidence reviewed.** Webflow publishes a DPA, privacy FAQ, privacy notice, security page and subprocessor list. These describe processor/controller roles, transfer mechanisms, US processing, encryption and security assurance.

**Finding.** Public terms do not prove the actual site configuration. A Webflow form binding, analytics feature, custom script or URL parameter could silently change the boundary.

**Required private evidence before approval.** Accepted DPA; workspace/site access list and MFA; site export/custom-code inventory; Webflow Forms/CMS/Analytics/session-replay status; browser network capture for every language and questionnaire step; cookie/storage inventory; published-domain and script-integrity/change procedure; subprocessor notice.

**Decision.** Conditional approval only after the exclusion of questionnaire/report data is demonstrated by configuration and network evidence.

## 4. Marketing and analytics separation

### 4.1 Google Analytics and Google tag

Google's Analytics privacy material describes processor handling under customer instructions and gives customers retention/deletion controls. Google also publishes data-processing terms and regional-processing information. Its Analytics policy prohibits sending recognizable PII and data that reveals sensitive information or identifies a user.

For this product, consent alone does not make child or health-related event data suitable for Google. The approved design is limited to coarse landing-page measurement after valid consent. Do not send email, questionnaire answers, child age/details, selected bank, detected focus, secondary focus, severity, report text, session/access token, invoice/payment reference or URLs/query strings containing them. Keep Google products/services data sharing, Google Signals and ads personalization disabled unless a separate legal review approves them. Do not load measurement tags on questionnaire, summary, checkout-success, report-access or observation pages until a dated network inspection proves the restriction.

Required evidence: accepted Google data-processing terms, legal-entity/contact fields, consent-mode screenshots, retention setting, data-sharing and Signals settings, event/parameter allow-list, live network capture and deletion/opt-out procedure.

### 4.2 Meta Business Tools

Meta's Business Tools terms cover Pixel and Conversions API and prohibit sending information known or reasonably known to relate to children under 13, health information and other sensitive information. The current server-side NeuroMap service intentionally returns a disabled status for the sensitive funnel.

Keep Pixel/CAPI absent or disabled on questionnaire, summary, success/report and observation pages. Any future landing-only measurement requires a new DPIA change review, consent/policy review and event/network proof. No inferred condition, health-related page parameter, child data or stable identifier may be sent.

Required evidence: current Business account/pixel inventory proving disabled/absent state, GTM/custom-code inventory and network capture.

### 4.3 TikTok advertiser tools

TikTok's advertiser guidance prohibits sharing children's information, health/financial information and other prohibited data, and warns against installing or configuring advertiser tools on sensitive pages. No production TikTok integration was identified in the reviewed code.

TikTok remains outside the approved production flow. Adding a pixel, Events API, SDK, enhanced matching or campaign URL parameters is a material processing change and must be blocked until a separate policy, consent, DPA/role, transfer and network review is approved.

## 5. Required controller evidence pack

For each core vendor, store the following under a controlled evidence ID rather than only a web link:

1. signed or electronically accepted agreement/DPA, acceptance date and contracting entity;
2. service schedule that accurately lists data subjects and categories, including intentional Article 9-like data where applicable;
3. production region and transfer-mechanism record, SCC module and dated TIA;
4. current subprocessor list plus change-notification subscription;
5. production account screenshots/exports for MFA, access, retention, training/data-sharing, tracking and deletion settings;
6. minimized sample payload and network capture with secrets and personal data redacted;
7. deletion/export/termination test and backup-deletion position;
8. incident contact, notification commitment and internal escalation owner;
9. last review, next review and accountable approver;
10. architecture fallback if the vendor refuses coverage for the intended category.

Recommended evidence IDs: `VEN-RAILWAY-*`, `VEN-OPENAI-*`, `VEN-RESEND-*`, `VEN-STRIPE-*`, `VEN-SZAMLAZZHU-*`, `VEN-WEBFLOW-*`, `MKT-GOOGLE-*`, `MKT-META-*`, `MKT-TIKTOK-*`.

## 6. Official source registry

All sources below were accessed or rechecked on 2026-07-26. The controller must verify version/date changes during every DPIA review.

| Vendor | Official source | What it supports |
| --- | --- | --- |
| Railway | https://railway.com/legal/dpa | processor terms, security schedule, transfers, subprocessors and the standard data-category schedule |
| OpenAI | https://cdn.openai.com/pdf/openai-data-processing-addendum.pdf | DPA, Article 28 duties, transfers, subprocessors and processing schedule |
| OpenAI | https://developers.openai.com/api/docs/guides/your-data | API training, retention, application state, `store`, ZDR and regional-control descriptions |
| OpenAI | https://openai.com/policies/sub-processor-list/ | current API subprocessor list and locations |
| OpenAI | https://trust.openai.com/ | public security and assurance material |
| Resend | https://resend.com/legal/dpa | DPA, transfer, subprocessor and security commitments |
| Resend | https://resend.com/legal/subprocessors | current subprocessor list |
| Resend | https://resend.com/docs/security | security documentation |
| Resend | https://resend.com/static/documents/resend-dpa-signed.pdf | vendor-signed DPA form; customer acceptance must still be evidenced |
| Stripe | https://stripe.com/legal/dpa | Stripe DPA and role/transfer terms |
| Stripe | https://stripe.com/legal/dpa/faqs | DPA application and role explanation |
| Stripe | https://support.stripe.com/questions/stripe-s-subprocessors-and-vetting-process | subprocessor and vetting information |
| Stripe | https://stripe.com/legal/ssa-overview | Services Agreement overview |
| Számlázz.hu | https://www.szamlazz.hu/adatvedelem/ | privacy roles, categories, infrastructure and contacts |
| Számlázz.hu | https://www.szamlazz.hu/aszf/ | current general terms |
| Számlázz.hu | https://docs.szamlazz.hu/third-party-invoicing/szamla-agent | production integration documentation |
| Webflow | https://webflow.com/legal/dpa | DPA, transfers and processor obligations |
| Webflow | https://webflow.com/legal/privacy-faqs | processing location, transfer and security explanations |
| Webflow | https://webflow.com/legal/subprocessors | current subprocessor list |
| Webflow | https://webflow.com/security | public security assurance |
| Google | https://support.google.com/analytics/answer/3379636?hl=en | Google Ads Data Processing Terms acceptance information |
| Google | https://support.google.com/analytics/answer/6004245?hl=en | Analytics privacy and processor/customer controls |
| Google | https://support.google.com/analytics/answer/13297105?hl=en | prohibition on PII and sensitive/identifying Analytics data |
| Google | https://support.google.com/analytics/answer/12017362?hl=en | EU/UK/Swiss regional collection and processing information |
| Google | https://support.google.com/analytics/answer/9012600?hl=en | Google products/services data-sharing implications |
| Google | https://www.google.com/about/company/user-consent-policy/ | EU user-consent policy |
| Meta | https://www.facebook.com/legal/terms/dataprocessing | Meta data-processing terms |
| Meta | https://www.facebook.com/legal/terms/businesstools/preview | Business Tools terms and restricted-data rules |
| TikTok | https://ads.tiktok.com/i18n/official/policy/controller-to-controller%2Fprivacy | official Business Products data terms entry point |
| TikTok | https://ads.tiktok.com/help/article/tiktok-advertiser-tools-and-related-terms?lang=en | advertiser-tool terms overview |
| TikTok | https://ads.tiktok.com/help/article/about-notifications-of-potentially-prohibited-data-sharing-on-tiktok?lang=en | child, health and sensitive-data restrictions |

## 7. Approval and change control

No row is approved merely because public evidence exists. The privacy owner, security owner, service owner and controller must sign the vendor record after the required private evidence is attached. Railway and OpenAI scope mismatches, and Resend's sensitive-attachment suitability, must be resolved before the DPIA can be approved.

A new model, region, subprocessor, telemetry feature, email-delivery method, Webflow embed, marketing tag or fallback provider is a material vendor change. Block production use until this register, the ROPA, privacy notice, transfer assessment and DPIA are reviewed. At least annually, verify that every link and account setting remains current and that actual network traffic still matches the approved data flow.

## 8. Evidence boundary and public claims

This register is an internal working paper. It records implementation evidence and unresolved controller obligations; it is not legal advice, a conformity assessment, a penetration-test certificate, a clinical validation, a psychometric validation or a vendor approval certificate.

The following statements must not appear on the landing page, report, checkout, email or advertising unless the corresponding signed and dated independent evidence is retained and linked from the approval record: "GDPR certified", "legally approved", "clinically validated", "psychometrically validated", "medical-grade", "secure/penetration-tested", "WCAG compliant", or an equivalent translated claim.

Public claims may describe only verifiable product behavior, for example that the output is a non-diagnostic screening summary, that a privacy-rights request uses email verification, or that the controller has implemented specified technical controls. Final approval requires the independent validation activities listed in `docs/INDEPENDENT_VALIDATION_PLAN.md`.

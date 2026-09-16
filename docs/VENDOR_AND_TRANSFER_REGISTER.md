# Vendor, Processor and International Transfer Evidence Register

> **Status: controller evidence working paper - not a vendor approval record**
>
> Version: 2026-09-16-draft-6
> Public-source review dates: 2026-07-26 baseline; 2026-09-16 targeted update below
> Scope: the production questionnaire, payment, report, email, invoice, frontend and optional marketing measurement flows.

This register records what can be supported by current public vendor documents and what still requires account-level, contractual or configuration evidence from the controller. A public privacy page, trust-centre badge or standard DPA does **not** prove that the NeuroMap Kids account has accepted the relevant terms, uses the reviewed region and retention settings, or is contractually permitted to submit intentionally collected child-related health inferences.

The controller must preserve signed or accepted agreements, account exports and dated screenshots in its own controlled evidence repository. Links below are references, not archived copies of the source documents.

## 2026-09-16 clarification and decision

This section supersedes an implication in the baseline that every processor needs a separately signed, bespoke DPA. An incorporated, electronically accepted agreement can provide the required contractual arrangement. Establish the account/entity, applicable version, acceptance mechanism and actual processing scope; do not mistake a provider's blank template for customer acceptance.

**Owner's subsequent scope decision (2026-09-16):** remove requests for individual provider confirmation letters and bespoke signed certificates from the active launch task list. Their status is **not pursued**, not **received**, **approved** or **legally unnecessary**. Use the existing published/incorporated terms and account records for the controller's review. No automatic vendor-approval flag or checkout activation follows from this administrative decision. A material mismatch between the documented processing scope and actual data flow remains a recorded risk; it can be addressed by a supported interpretation of the existing terms or by changing the data flow, without an open-ended task to obtain a special letter.

| Provider | Current public evidence | What remains to be linked or resolved |
| --- | --- | --- |
| OpenAI | [DPA](https://openai.com/policies/data-processing-addendum/), effective 2026-01-01, incorporated into the services agreement | Production organization/entity and applicable acceptance; Schedule 1 sensitive-data description versus intentional questionnaire inferences; actual retention and regional settings |
| Railway | [DPA](https://railway.com/legal/dpa) and [execution guidance](https://docs.railway.com/enterprise/compliance) | Account-specific execution/acceptance and processing schedule; the public sensitive-data category remains `None` |
| Resend | [DPA](https://resend.com/legal/dpa), updated 2026-08-27; binding through agreement acceptance or execution. Authenticated Documents page also states sign-up executes the provider-signed version | The existence/acceptance mechanism is now evidenced in-account. Company/entity linkage and sensitive PDF coverage remain distinct questions: Exhibit A still lists sensitive data as not applicable |
| Stripe | [DPA FAQ](https://stripe.com/legal/dpa/faqs): DPA forms part of the Services Agreement | Retain the business account's accepted terms/version and transfer record; no new bespoke signature inferred as mandatory |
| Webflow | [DPA](https://webflow.com/legal/dpa) reviewed | Tie applicable version to workspace/entity and confirm questionnaire data remain outside Forms, CMS and tracking |
| Backblaze B2 | [DPA explanation](https://help.backblaze.com/hc/en-us/articles/360004146953-Data-Processing-Addendum) and [EEA DPA](https://www.backblaze.com/company/policy/dpa-for-eea-eu-residents) | Owner has stated that the account and terms are in the company's name. Preserve that statement with account, region, terms and retention evidence; encrypted backups do not become anonymous merely through encryption |
| Google Workspace | [Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum/) reached from the Workspace DPA link | Archive the actual tenant's agreement/acceptance and recovery/access controls. Include support mail and any encrypted recovery-file storage in the inventory, separately from Analytics |
| Squarespace | [DPA](https://www.squarespace.com/dpa), effective 2026-07-15, forms part of the Terms | Tie the public landing/domain account to the company and terms; do not submit questionnaire answers to its forms/chat/analytics |
| Szamlazz.hu | Existing [terms](https://www.szamlazz.hu/aszf/) and [privacy](https://www.szamlazz.hu/adatvedelem/) references | Automated re-fetch returned HTTP 403 on 2026-09-16, so no new version verification is claimed; use the authenticated account's accepted documents |

The original lawyer-authored notice, the later expanded working notice and provider agreements are different evidence types. A statement that counsel reviewed the notice is recorded as the owner's statement, not a forged provider acceptance or independent certification. Retain any written counsel conclusion with its exact scope and document identifiers.

The owner has approved the DPIA in conversation. That decision is retained; it does not by itself resolve missing processor scope/account evidence. `VENDOR_DPA_REVIEWED` must not be switched on until the applicable arrangement and its coverage are supported.

The owner has chosen not to commission professional/clinical review. The corresponding operational launch-gate requirement is removed in the local code on 2026-09-16, not marked as passed. Non-diagnostic limitations and the prohibition on unsupported clinical-validation claims remain. This is not a conclusion about medical-device classification or legal compliance.

Detailed account findings and evidence files belong in the controller's private evidence repository, not the public GitHub repository. The operational evidence package for this review is kept in the ignored local `work/launch-closure-2026-09-16/` directory; arrange controlled off-machine retention before relying on it as a durable archive.

## 1. Production data-flow inventory

| Service | Current use | Data intentionally exposed | Current evidence decision |
| --- | --- | --- | --- |
| Railway | API, worker, PostgreSQL database and runtime hosting | adult contact data; questionnaire answers; child-related observations and inferred screening results; reports; consent and operational records | **Launch blocker unresolved:** standard DPA schedule describes no intended sensitive/special-category data |
| OpenAI API | Generates the narrative report from structured questionnaire context | translated question text and answers; detected focus/secondary focus; scoring, ranking, profile, age context and report instructions; no billing data required | **Launch blocker unresolved:** standard DPA schedule does not describe intentional sensitive-data submission; account retention and region evidence missing |
| Resend | Sends transactional report email and PDF attachment | adult recipient email; localized message; personalized PDF containing child-related observations and inferences; delivery metadata | **Scope review open:** evaluate sensitive-attachment coverage under existing terms or a secure-link alternative; no individual confirmation-letter task |
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
- **Launch blocker:** the affected production data flow remains blocked until the evidence gap is closed or the flow is redesigned. A recorded owner DPIA approval does not automatically close this separate check.

## 3. Core processor due diligence

### 3.1 Railway

**Actual role and payload.** Railway hosts the API, worker and PostgreSQL database. It can therefore process the complete production session, including adult contact data, questionnaire answers, child-related observations and inferences, consent evidence, reports and operational metadata.

**Public evidence reviewed.** Railway's DPA identifies processor/subprocessor roles, international-transfer safeguards and a subprocessor-change mechanism. Its security schedule describes logical isolation, encryption in transit and at rest, access controls, logging, incident response, business continuity, backups and security review. The public DPA also describes the standard processing schedule as containing no intended sensitive or special-category data.

**Finding.** That standard schedule does not match the intentional production processing of child-related health-like observations and inferences. General infrastructure security statements do not cure a scope mismatch in the processing description.

**Existing-document and configuration review.** Applicable DPA/service schedule and account acceptance mechanism; controller's assessment of the actual categories and data subjects against those terms; production region; infrastructure/subprocessor chain; access and MFA evidence; database encryption; backup retention/deletion and restore evidence; incident contact/SLA; SCC module and transfer impact assessment; termination/export/deletion procedure. A request for a new individual Railway confirmation or negotiated certificate is not an active task.

**Decision.** Launch blocker until the contract/schedule is aligned or the sensitive data is moved to an approved architecture.

### 3.2 OpenAI API

**Actual role and payload.** The report service sends structured questionnaire content to the Responses API: localized questions and answers, detected focus and secondary focus, scoring/ranking/profile, result summary, age context and report-generation instructions. Adult billing details are not needed and should remain excluded.

**Public evidence reviewed.** OpenAI's DPA sets out Article 28 processor terms, confidentiality, rights assistance, security, incident, audit, subprocessor and SCC/UK transfer provisions. OpenAI's API data-control documentation states that API data is not used for model training by default unless the customer opts in; it also describes default abuse-monitoring retention, endpoint/application-state retention, `store: false`, Zero Data Retention and regional controls. The public DPA's standard processing description does not present intentionally submitted sensitive data as the expected use case.

**Finding.** The production prompt intentionally contains potentially Article 9 health-related observations/inferences. Default no-training language is valuable but is not the same as zero retention, an approved region, or contractual permission for the intended sensitive-data category.

**Existing-document and configuration review.** Applicable DPA and correct entity; controller's assessment of the sensitive categories/data subjects against the existing schedule; production project screenshots/exports showing model, region, data-sharing/training status, retention and `store` behaviour; evidence for Modified Abuse Monitoring or Zero Data Retention only if actually enabled/claimed; current subprocessor notice subscription; SCC/TIA; access/MFA and API-key rotation evidence; prompt/payload minimization sample; model/change-control owner. No task remains to obtain an individual confirmation letter or bespoke certificate.

**Decision.** Launch blocker until the DPA scope and production data-control configuration are evidenced.

### 3.3 Resend

**Actual role and payload.** Resend receives the adult recipient email, localized transactional content and a personalized PDF attachment containing child-related observations and screening inferences. It also processes delivery/bounce metadata.

**Public evidence reviewed.** Resend's DPA describes processor obligations, SCC/transfer provisions, subprocessors and technical/organisational safeguards. Its security material describes access controls, encryption, logging, incident response, penetration testing, deletion/export and continuity controls. The service also publishes a signed form DPA and a subprocessor list.

**Finding.** A public DPA and security page do not establish that the production account has accepted the DPA or that sending a special-category report as an email attachment is within the contracted, suitable use. Email misdelivery has high impact and an attachment persists outside the controller's system.

**Existing-document and configuration review.** Incorporated DPA and contracting entity; controller's assessment of report attachments against the existing terms; production account MFA/access list; tracking/open/click settings; log/content retention; subprocessor notice subscription; SCC/TIA; bounce/suppression/deletion process; incident contact; misdelivery correction process. An individual suitability-letter request is removed. A short-lived authenticated download link is an architectural alternative when the existing terms do not support the intended attachment flow.

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

1. applicable incorporated or electronically accepted agreement/DPA, acceptance mechanism, available acceptance date and contracting entity; a separate signature is not universally required;
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

No row is approved merely because public evidence exists. The accountable controller must record its approval after the relevant contract, account and scope evidence is attached. Role owners may be the same person in a small company; multiple invented signatures are not required. Railway and OpenAI scope questions, and Resend's sensitive-attachment suitability, remain separate from the owner's recorded DPIA approval.

A new model, region, subprocessor, telemetry feature, email-delivery method, Webflow embed, marketing tag or fallback provider is a material vendor change. Block production use until this register, the ROPA, privacy notice, transfer assessment and DPIA are reviewed. At least annually, verify that every link and account setting remains current and that actual network traffic still matches the approved data flow.

## 8. Evidence boundary and public claims

This register is an internal working paper. It records implementation evidence and unresolved controller obligations; it is not legal advice, a conformity assessment, a penetration-test certificate, a clinical validation, a psychometric validation or a vendor approval certificate.

The following statements must not appear on the landing page, report, checkout, email or advertising unless the corresponding signed and dated independent evidence is retained and linked from the approval record: "GDPR certified", "legally approved", "clinically validated", "psychometrically validated", "medical-grade", "secure/penetration-tested", "WCAG compliant", or an equivalent translated claim.

Public claims may describe only verifiable product behavior, for example that the output is a non-diagnostic screening summary, that a privacy-rights request uses email verification, or that the controller has implemented specified technical controls. The historical `docs/INDEPENDENT_VALIDATION_PLAN.md` records recommendations, not proof that the activities occurred; apply the dated scope decision above to the operational clinical-review item.

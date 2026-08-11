# NeuroMap Kids Data Protection Impact Assessment

> **Status: CONTROLLER WORKING DRAFT - NOT APPROVED FOR RELIANCE**
>
> Version: 2026-07-26-draft-4
> Required approvers: data controller, qualified EU privacy counsel or DPO, security owner, product owner
> This document is an engineering-supported DPIA draft. It is not a legal opinion, certification, supervisory-authority approval, or proof of GDPR compliance.

## 1. Decision and scope

The processing should be treated as requiring a DPIA before production launch. It combines potentially special-category information about a child, vulnerable data subjects, systematic scoring/profiling, AI-assisted report generation, online payments, and processing that is intended to scale across several countries and languages.

This DPIA covers the end-to-end paid questionnaire flow:

1. adult language selection and legal notice;
2. separate terms/privacy acknowledgement, Article 9 explicit consent, and optional analytics choice;
3. adult purchaser contact data and observations about a child;
4. deterministic questionnaire scoring and focus selection;
5. Stripe checkout and payment webhook;
6. queued AI-assisted report generation;
7. PDF and transactional email delivery;
8. invoice generation through Szamlazz.hu;
9. optional observation diary and follow-up messages;
10. support, security logging, privacy rights, retention and erasure;
11. strictly minimised analytics where optional consent has been given.

It does not approve clinical use, diagnosis, treatment selection, automated eligibility decisions, use by schools or employers, advertising based on questionnaire results, or sale of personal data.

## 2. Governance and accountability

| Role | Responsibility | Named owner / status |
| --- | --- | --- |
| Data controller | Determines purposes and means; approves DPIA | **Open - legal entity, registered address and establishment country must be confirmed** |
| Product owner | Product scope, non-diagnostic positioning and release decision | **Open - assign named owner** |
| Privacy lead / DPO | Independent review, advice and monitoring | **Open - determine whether Article 37 requires a DPO and document the decision** |
| Security owner | Access control, incident response, evidence and review | **Open - assign named owner** |
| Clinical/content reviewer | Reviews questionnaire and report claims | **Open - qualified external review required** |
| Processors | Railway, Stripe, OpenAI, Resend, Szamlazz.hu, Webflow and relevant infrastructure | **Contract and transfer review incomplete** |

The controller must maintain the related record of processing activities, processor register, transfer assessment, retention schedule, rights log, breach log, consent evidence and release sign-off referenced by this DPIA.

## 3. Processing description and data flow

### 3.1 Data flow

Adult browser -> Webflow UI -> Railway API -> PostgreSQL -> Stripe checkout -> Stripe webhook -> analysis queue/worker -> OpenAI API -> PDF generator -> Resend email -> adult email address. Invoice data flows from the paid session to Szamlazz.hu. Observation diary data may subsequently return through a tokenised link. Marketing tools must receive only coarse, non-health conversion events and only where the applicable consent/configuration permits it.

### 3.2 Data subjects

- the adult purchaser, parent, legal guardian or authorised adult;
- the child described by the adult, who is not the contracting user;
- support contacts and administrators whose actions appear in security logs.

The service must not request a child name. A nickname may still be personal data when linked with a session, email address, answers or report, so the product should continue requesting only the parent or adult purchaser name.

### 3.3 Data categories

| Category | Examples | Sensitivity |
| --- | --- | --- |
| Adult identity/contact | adult name, email, language | Personal data |
| Child observations | behaviour, emotions, learning, routines, social and sensory observations | Potential Article 9 health-related data |
| Derived screening data | scores, ranking, focus, confidence, report text | Potential Article 9 inferred health-related data |
| Contract/payment | package, price, currency, Stripe references, timestamps | Personal/financial metadata |
| Invoice | billing identity/address/tax data, invoice number and status | Statutory financial record |
| Consent/legal evidence | actor role, policy versions, explicit consent, timestamps, withdrawal | Accountability record |
| Follow-up/diary | strategies, context, notes and changes over time | Potential Article 9 health-related data |
| Operations/security | job status, delivery status, minimised request logs, admin audit events | Personal data where linkable |

No free-form child name, precise location, school name, medical record, genetic data, biometric data, advertising profile or social-media identifier is required for the core report.

## 4. Purposes and proposed legal bases

Final legal bases must be approved for every target establishment and market. The engineering design currently supports the following conservative mapping:

| Purpose | Article 6 basis | Article 9 condition | Notes |
| --- | --- | --- | --- |
| Create paid report, payment, delivery and support | 6(1)(b), contract / pre-contract steps | 9(2)(a), explicit consent for questionnaire and inferred health-related data | Withdrawal stops future sensitive processing; contract cannot override Article 9 |
| Invoice and mandatory accounting/consumer records | 6(1)(c), legal obligation | Not normally required for questionnaire data; isolate invoice records | Exact national retention law must be confirmed |
| Security, abuse prevention and service integrity | 6(1)(f), legitimate interests | Avoid special-category content in logs; if unavoidable obtain legal approval | Requires a documented legitimate-interest assessment |
| Privacy-rights and complaint handling | 6(1)(c), legal obligation | 9(2)(f) may be relevant for legal claims; counsel to confirm | Requests are verified by a one-time code sent to the session email; only a hash is stored, with a 15-minute expiry and five-attempt limit |
| Optional first-party analytics | 6(1)(a), consent | Must not include Article 9 data | Default denied; withdrawal must be as easy as grant |
| Advertising/remarketing | Not enabled for health or child-related profiles | No valid product need identified | Questionnaire answers, inferred focus and report data are prohibited from ad platforms |

Explicit consent must be specific, informed, unambiguous, recorded, language-matched, separate from optional analytics, and capable of withdrawal without detriment to prior lawful processing. Consent is not a substitute for necessity, minimisation or transparent product claims. The checkout separately records the adult's request for immediate digital performance and acknowledgement of the resulting withdrawal-right consequence; these purchase confirmations are not preselected and are not treated as Article 9 consent.

## 5. Necessity and proportionality

### 5.1 Necessity

- Adult email is necessary to deliver the purchased report and contract confirmation.
- Adult name is used for correspondence; a child name is not necessary.
- Questionnaire answers are necessary only for scoring and report generation.
- Package, payment and invoice metadata are necessary for contract performance and statutory records.
- AI receives only the report-generation payload required for the purchased output.
- Operational logs should contain IDs and statuses, not questionnaire text or inferred conditions.

### 5.2 Less intrusive alternatives

- Anonymous local-only scoring would reduce risk but cannot support paid email delivery and personalised reports.
- A static educational guide would avoid profiling but would not deliver the selected service.
- Collecting a child name, exact date of birth, school, address or medical history is unnecessary and rejected.
- Sending raw answers or inferred focus to advertising tools is unnecessary and prohibited.

### 5.3 Accuracy and fairness

The output must be described as an informational, structured screening summary, not a diagnosis, medical device output, treatment recommendation, or substitute for a qualified professional. Age-aware wording, uncertainty, limitations and escalation guidance must be visible. The controller must commission qualified psychological/clinical and linguistic review before relying on the content in each market.

## 6. Transparency and data-subject rights

Implemented controls:

- language selection precedes the legal flow;
- terms and privacy information require an actual scroll-to-end gate and separate acknowledgements;
- Article 9 explicit consent is separate from optional analytics;
- immediate digital performance and withdrawal-right acknowledgements are collected separately at checkout, immediately before payment;
- advertising consent remains denied;
- policy versions, language, actor role and timestamps are stored;
- the UI identifies the contracting person as the parent/adult purchaser;
- an authenticated rights centre supports access, portability, erasure, restriction, rectification, objection and consent withdrawal;
- access and portability produce machine-readable JSON;
- erasure removes questionnaire/report/diary data while segregated statutory invoice records may remain;
- processing restriction blocks analysis, report delivery and follow-up, but does not suppress mandatory contract confirmations;
- requests have an auditable deadline, status and event history.
- privacy-rights requests remain pending until a one-time email code is verified; the code is stored only as a SHA-256 hash, expires after 15 minutes and locks after five failed attempts.

Remaining legal tasks:

- publish controller identity, registered address, country, DPO/representative details where applicable, and lead supervisory authority;
- legally review all 11 language versions and accessibility;
- define and staff a documented manual recovery route for users who cannot receive the verification email, with proportionate identity checks and no disclosure based on email address alone;
- document rules for manifestly unfounded/excessive requests, extensions and refusal notices;
- validate national rules affecting parental authority and children in every marketed country.

## 7. Retention and deletion

Default engineering schedule:

- questionnaire, report and related sensitive session data: 90 days after creation unless a shorter contractual need applies;
- raw webhook payloads: redact after 14 days; retain only event identity/status needed for reconciliation and fraud evidence;
- observation diary: expire with the programme and remove with the linked sensitive session;
- admin/rate-limit operational records: short rolling retention;
- consent and rights evidence: retain only for the period necessary to demonstrate compliance or handle claims;
- invoices/accounting records: retain separately for the statutory period determined by the relevant accounting law.

The `data-lifecycle` cron must run in production, be monitored, and produce evidence. Legal hold must be documented, narrowly scoped, approved and time-limited. Backups require equivalent expiry and restoration controls; deletion from the live database alone is not sufficient.

## 8. Recipients, processors and transfers

Expected vendors include Railway/PostgreSQL, Stripe, OpenAI, Resend, Szamlazz.hu and Webflow. Before launch, the controller must for each vendor verify:

- controller/processor role and signed Article 28 terms where relevant;
- processing locations and subprocessor list;
- EEA adequacy or appropriate transfer safeguard, including SCCs where required;
- transfer impact assessment and supplementary technical/organisational measures;
- retention, deletion, training/use-of-data settings and incident notification terms;
- access controls, encryption, availability and audit evidence;
- whether special-category and child-related data are contractually permitted.

Vendor marketing or model-training use of questionnaire/report data must be disabled or contractually excluded. Exact production regions and account settings must be recorded, not inferred from public vendor documentation.

The detailed vendor due-diligence findings, official-source links, unresolved scope mismatches and required account-level evidence are recorded in Annexes A-C below and in `VENDOR_AND_TRANSFER_REGISTER.md`. Public vendor materials are source evidence only; they do not replace the controller's accepted agreement, account configuration, transfer assessment or legal review.

## 9. Automated processing and AI

Deterministic code selects questions, computes scores and ranks focus areas. OpenAI assists with parent-friendly report text. The service is designed not to make a decision producing legal or similarly significant effects under Article 22: it does not decide treatment, school access, insurance, employment, benefits or eligibility. This conclusion must be re-evaluated if customers or institutions begin using the report for consequential decisions.

Controls:

- non-diagnostic wording and uncertainty requirements;
- structured prompt and output validation;
- deterministic scoring retained separately from generated prose;
- no model access to unnecessary billing or advertising identifiers;
- human escalation route and advice to seek qualified professional help;
- versioned model/prompt/report evidence;
- no online generation of new screening questions during an assessment;
- output and incident monitoring for hallucination, bias, language mixing and unsafe advice.

## 10. Risk assessment method

Likelihood (L) and impact (I) are scored from 1 (low) to 5 (very high). Score = L x I. 1-4 low, 5-9 moderate, 10-15 high, 16-25 very high. Residual scores assume the listed engineering controls are operating and verified. Legal, clinical, vendor and transfer controls marked open cannot be treated as completed.

| Risk scenario | Inherent LxI | Controls / evidence | Residual LxI | Owner / action |
| --- | ---: | --- | ---: | --- |
| Unauthorised access exposes child-related answers/reports | 4x5=20 | tokenised sessions, admin auth, least-data APIs, restricted logs, security audit | 2x5=10 | Security owner; external penetration test and access review open |
| Report sent to mistyped or compromised email | 3x5=15 | email validation, contract confirmation, delivery monitoring | 2x5=10 | Product/privacy; add verified-email or correction workflow before scale |
| User interprets report as diagnosis | 4x5=20 | repeated non-diagnostic wording, limitations, professional escalation | 2x5=10 | Clinical/legal external review open |
| AI produces unsafe, overconfident or incorrect advice | 4x5=20 | structured prompts, output checks, versioning, parent-safe language | 2x5=10 | Clinical QA and sampled human review open |
| Sensitive data reaches ad/analytics platforms | 4x5=20 | consent default denied, payload minimisation, advertising disabled | 1x5=5 | Privacy/security; production network inspection before launch |
| Consent is invalid, bundled or language-mismatched | 4x5=20 | two-step versioned flow, explicit Article 9 consent, separate analytics | 2x5=10 | Privacy counsel and native-language legal review open |
| Child is identifiable through unnecessary name/nickname | 3x4=12 | adult-name label, no child-name field, minimisation statement | 1x4=4 | Product; monitor free-text content |
| Sensitive data is retained beyond necessity | 4x5=20 | retention timestamps, lifecycle cron, erasure service | 2x5=10 | Operations; backup deletion and cron evidence open |
| Erasure removes invoices that law requires, or keeps sensitive data improperly | 3x4=12 | segregated financial retention, sensitive pseudonymisation | 1x4=4 | Privacy/accounting counsel to validate national periods |
| Rights request is disclosed to an impostor | 3x5=15 | high-entropy session token, email-delivered one-time code, SHA-256 code hash, 15-minute expiry, five-attempt lock, request rate limiting, no email-only instant export | 1x5=5 | Privacy; independent abuse testing and manual fallback procedure open |
| Restriction/withdrawal is ignored by worker or email pipeline | 3x5=15 | central governance gates and query filters before processing/send | 1x5=5 | Engineering; recurring integration evidence required |
| Cross-border transfer lacks valid safeguard | 4x5=20 | no complete control until contracts, regions and TIA are verified | 3x5=15 | Controller/privacy counsel - **open high residual risk** |
| Processor uses data for model training or incompatible purpose | 3x5=15 | intended API/business terms and minimised payload | 2x5=10 | Vendor owner; account setting and DPA evidence open |
| Language defects make consent or report misleading | 4x4=16 | 11-language assets, fallback checks, language audits | 2x4=8 | Native legal/clinical review per language open |
| Service outage/payment race loses paid report | 4x3=12 | idempotent webhook, queue, worker, retries, recovery monitoring | 2x3=6 | Operations; production load/DR evidence required |
| Breach is detected or notified too late | 3x5=15 | logging, alerts, breach runbook | 2x5=10 | Controller/security; tabletop exercise and contacts open |
| Product falls within medical-device regulation despite positioning | 3x5=15 | informational scope, no diagnosis/treatment decision, disclaimers | 2x5=10 | Qualified MDR counsel assessment open |
| School/insurer/employer uses report for consequential decisions | 3x5=15 | consumer-facing terms and non-diagnostic limitations | 2x5=10 | Product/legal; prohibit institutional decision use and monitor complaints |

## 11. Security and organisational measures

Current implemented controls include TLS transport, environment-based secrets, production-strength secret validation, hashed access/rights/verification tokens, short-lived one-time verification codes, parameterised SQL, Stripe signature verification, idempotent webhook handling, leased queued workers with heartbeat/retry, time-limited admin sessions bound to the user agent, production fail-closed rate limiting, audit events, CORS allow-listing, processing restriction, sensitive erasure, lifecycle jobs, launch evidence gates and minimised marketing payloads. Purchase confirmations and Article 9 consent are stored as distinct evidence.

Before approval, evidence is required for encryption at rest, secret rotation, least-privilege production access, MFA, dependency/security scans, backup restoration and deletion, penetration testing, logging redaction, incident alerting, disaster recovery, vendor access, and separation of web/worker/database duties.

## 12. Personal-data breach response

The controller must use the breach runbook to contain, preserve evidence, assess confidentiality/integrity/availability effects, identify affected people and data, and decide notification. GDPR supervisory-authority notification is required without undue delay and, where feasible, within 72 hours after awareness when the breach is likely to result in risk. High-risk affected people must be informed without undue delay unless an applicable exception is documented. Processor contracts must support sufficiently fast notification.

## 13. Consumer and digital-content obligations

The checkout must clearly show trader identity, total price, currency, package scope, delivery method, complaint/support route, and digital performance terms before payment. The order button must unambiguously indicate an obligation to pay. Where immediate digital performance affects the withdrawal right, the adult must expressly request immediate performance and acknowledge the consequence; the controller must then provide durable-medium contract confirmation. Mandatory conformity/remedy rights for digital content cannot be waived by UI text.

Exact national implementation, VAT/invoice language and withdrawal exceptions require counsel review for all target markets.

## 14. Consultation

Required consultation before approval:

- qualified EU privacy counsel/DPO;
- security owner and independent penetration tester;
- qualified child-development/psychology reviewer;
- native legal and content reviewers for all offered languages;
- accounting/tax adviser for invoice retention;
- representative adult users where feasible, without exposing real child data.

If the completed DPIA still identifies high risk that the controller cannot mitigate, the controller must obtain advice on prior consultation with the competent supervisory authority under GDPR Article 36 before processing begins.

## 15. Residual-risk decision

**Current decision: DO NOT MARK DPIA APPROVED.** Residual risk remains high because processor/transfer evidence, controller identity, DPO decision, external legal review, clinical/content validation, target-country rules, production security evidence and medical-device classification have not been signed off.

Engineering controls materially reduce risk but do not close these governance items. `DPIA_APPROVED` and related launch-gate variables must remain false until named approvers sign `LEGAL_RELEASE_SIGNOFF.md` with evidence links.

## 16. Review triggers

Review at least annually and immediately when any of the following changes:

- purposes, target users, target countries or advertising strategy;
- questionnaire domains, clinical claims or scoring thresholds;
- AI model, prompt, data use, processor or region;
- retention period, new data category or new integration;
- use by schools, clinicians, insurers, employers or public bodies;
- a significant incident, complaint, rights trend or model safety issue;
- evidence that the report affects consequential decisions;
- legal or regulatory guidance affecting children, AI, health data, digital content or medical devices.

## 17. Approval record

| Approval | Name | Date | Decision | Evidence / conditions |
| --- | --- | --- | --- | --- |
| Controller |  |  | Open |  |
| Privacy counsel / DPO |  |  | Open |  |
| Security owner |  |  | Open |  |
| Clinical/content reviewer |  |  | Open |  |
| Product owner |  |  | Open |  |

No blank row constitutes approval.

### 17.1 Evidence boundary and independent validation

The codebase, automated checks, migration history and generated evidence registers can demonstrate that a control is implemented as designed. They cannot independently certify legal compliance, clinical validity, accessibility, production account settings, vendor contractual coverage or resistance to an external attacker. Those conclusions remain open until signed evidence is supplied by the competent independent reviewer listed in `INDEPENDENT_VALIDATION_PLAN.md` and linked in `LEGAL_REMEDIATION_AND_VALIDATION_REGISTER.md`. Native-language legal review is tracked in `LEGAL_TRANSLATION_VALIDATION_REGISTER.md`, while identity-verification and rights-request operations are governed by `DATA_SUBJECT_RIGHTS_RUNBOOK.md`.

No "GDPR compliant", "clinically validated", "medically approved", "secure/certified" or equivalent public badge may be displayed merely because this working draft or the automated audit passes.

## 18. Annex A - Vendor due-diligence and evidence register

**Review date:** 2026-07-26
**Evidence status:** engineering and privacy working paper based on public vendor documentation; not contractual approval, legal certification or proof of compliance.

The review compared the data flows implemented in the codebase with the vendors' official DPA, privacy, security, subprocessor, transfer and product materials. A public statement evidences only what the vendor publishes. It does not prove that the NeuroMap Kids account contracts with the correct legal entity, has accepted the relevant DPA, uses the reviewed region and retention settings, or is expressly permitted to submit intentional child-related health inferences.

### 18.1 Summary decision matrix

| Vendor | Actual data exposure | What the public evidence supports | DPIA decision / open condition |
| --- | --- | --- | --- |
| Railway | complete session, adult contact data, questionnaire answers, child-related observations and inferences, report, consent and operational records | DPA, SCC/UK transfer mechanisms and detailed security controls are publicly described | **Launch blocker:** the standard processing schedule identifies no intended sensitive/special-category data; written coverage or a different architecture is required |
| OpenAI API | question/answer content, focus and secondary focus, scores, profile, age context and report instructions | API data is not used for training by default; DPA, SCCs, subprocessors and data controls are documented | **Launch blocker:** the standard DPA data description does not align with intentional health-like input; project retention, region and account evidence are missing |
| Resend | adult email, localized message, child-related inferences in the PDF and delivery metadata | DPA, SCC, security and subprocessor materials are available | **High-risk gap:** contractual suitability for the sensitive PDF attachment must be confirmed, or delivery should move to a secure download link |
| Stripe | adult email, billing/payment data, package, amount, currency, language and internal references | DPA, role/transfer explanation and subprocessor controls are available | Conditionally acceptable; no questionnaire or report result may reach Stripe; account evidence is required |
| Számlázz.hu / KBOSS.hu Kft. | adult invoice data, amount/currency, product description and transaction references | privacy notice, terms and Számla Agent documentation are available | Conditionally acceptable; exact role, agreement, retention and payload must be evidenced |
| Webflow | intended: frontend page request, consent state and non-sensitive telemetry only; questionnaire payload posts to Railway | DPA, privacy FAQ, security and subprocessor materials are available | Conditionally acceptable; network capture and configuration export must prove that Forms, Analytics and embeds do not receive sensitive payloads |

### 18.2 Railway

**Official source:** https://railway.com/legal/dpa

Railway's public DPA describes processor obligations, subprocessor change notice, SCC/UK transfer safeguards and technical and organisational measures. Its security schedule describes logical separation, encryption in transit and at rest, access management, logging, incident response, business continuity and backup controls. The standard processing schedule, however, identifies no intentionally processed sensitive or special-category data.

This is a material mismatch because Railway runs the complete database and processing chain. The DPIA must not be approved until the controller holds an executed DPA and written vendor/contractual confirmation covering the actual categories and data subjects, or the sensitive processing has been moved to suitably approved infrastructure.

### 18.3 OpenAI API

**Official sources:**

- DPA: https://cdn.openai.com/pdf/openai-data-processing-addendum.pdf
- API data controls: https://developers.openai.com/api/docs/guides/your-data
- subprocessors: https://openai.com/policies/sub-processor-list/
- security evidence: https://trust.openai.com/

OpenAI's DPA sets out Article 28 processor obligations, confidentiality, data-subject assistance, security, incident notice, audit, subprocessor and SCC/UK provisions. The API data-control guidance states that API data is not used for model training by default unless the customer opts in. It separately describes abuse-monitoring retention, endpoint application state, `store: false`, Zero Data Retention and regional options.

No-training is not the same as zero retention and does not prove the settings of the production project. The production prompt contains child-related information that may fall within Article 9. The mismatch between this intentional use and the standard DPA data description must be resolved in writing or contractually. Evidence of the project's region, retention, data-sharing/training and `store` settings must be attached.

### 18.4 Resend

**Official sources:**

- DPA: https://resend.com/legal/dpa
- subprocessors: https://resend.com/legal/subprocessors
- security documentation: https://resend.com/docs/security
- vendor-signed DPA form: https://resend.com/static/documents/resend-dpa-signed.pdf

Resend's DPA describes processor obligations, SCCs, subprocessors and technical and organisational controls. The security materials describe access management, encryption, logging, incident response, penetration testing, deletion/export and continuity controls.

NeuroMap sends more than a transactional address: it sends a PDF containing sensitive child-related inferences. Whether the accepted DPA and service are suitable for this use is an account and contract fact. A mistyped or compromised address removes the attachment from the controller's practical control. Without written suitability confirmation, the preferred mitigation is a short-lived authenticated download link.

### 18.5 Stripe

**Official sources:**

- DPA: https://stripe.com/legal/dpa
- DPA FAQ: https://stripe.com/legal/dpa/faqs
- subprocessor controls: https://support.stripe.com/questions/stripe-s-subprocessors-and-vetting-process
- Services Agreement overview: https://stripe.com/legal/ssa-overview

Stripe's materials describe service-dependent controller/processor roles, transfer mechanisms, subprocessors and security obligations. The designed payload is proportionate because it excludes questionnaire answers and inferred focus. This must be evidenced with a metadata allow-list and a redacted production Checkout/webhook sample. Evidence is also required for the accepted DPA, contracting entity, MFA, least-privilege access, restricted keys and webhook signing-secret rotation.

### 18.6 Számlázz.hu / KBOSS.hu Kft.

**Official sources:**

- privacy notice: https://www.szamlazz.hu/adatvedelem/
- terms: https://www.szamlazz.hu/aszf/
- Számla Agent: https://docs.szamlazz.hu/third-party-invoicing/szamla-agent

The public materials identify the provider, possible controller/processor roles, invoice-data categories, infrastructure and retention considerations. The exact role depends on the contract and operation. Statutory invoice retention must be separated from the shorter questionnaire/report retention. Account-level evidence is required for Számla Agent key access and rotation, the actual submitted fields, accepted terms and statutory retention.

### 18.7 Webflow

**Official sources:**

- DPA: https://webflow.com/legal/dpa
- privacy FAQ: https://webflow.com/legal/privacy-faqs
- subprocessors: https://webflow.com/legal/subprocessors
- security: https://webflow.com/security

Webflow's materials describe processor/controller roles, transfers, US processing, encryption and security controls. The production privacy boundary is configuration-dependent. Dated browser-network captures, Forms/CMS/Analytics/session-replay settings, a custom-code inventory and cookie/storage inspection must prove that questionnaire answers, focus, report content and the adult email are sent only to the Railway API.

## 19. Annex B - Account- and contract-level evidence pack

The following evidence is mandatory for each core provider. Secrets must not be embedded in the DPIA; store the evidence in a controlled repository and refer to it by identifier.

| Evidence | Required content | Acceptance condition |
| --- | --- | --- |
| Agreement/DPA | accepted or signed copy, date, legal entity and service schedule | covers the actual data subjects and categories; sensitive data is not described as `none` |
| Region and transfer | production region, data route, SCC module, UK addendum and TIA | tied to the actual account and subprocessor chain |
| Account configuration | MFA, access list, retention, training/data sharing, tracking, region and deletion | dated screenshot or export approved by the responsible owner |
| Payload/network | redacted production sample for every integration and language flow | no unnecessary data; no sensitive data or identifiers reach marketing vendors |
| Retention/deletion | export, deletion, backup, termination and restore procedure | test result and vendor position attached |
| Incident response | contact, notification commitment and internal escalation | tabletop or contact-test evidence |
| Subprocessors | current list and change notifications | subscription, last review and objection process recorded |
| Exit alternative | architecture if the provider rejects the use or becomes unavailable | sensitive transfers can be stopped without losing paid customer data |

Suggested evidence IDs: `VEN-RAILWAY-*`, `VEN-OPENAI-*`, `VEN-RESEND-*`, `VEN-STRIPE-*`, `VEN-SZAMLAZZHU-*`, `VEN-WEBFLOW-*`, `MKT-GOOGLE-*`, `MKT-META-*`, `MKT-TIKTOK-*`.

**Mandatory launch gate:** the Railway and OpenAI data-category/contract mismatches, and Resend's suitability for sensitive PDF delivery, must be closed before this DPIA can be signed as approved.

## 20. Annex C - Marketing-platform separation and prohibited payloads

### 20.1 Google Analytics / Google tag

**Official sources:**

- acceptance of data-processing terms: https://support.google.com/analytics/answer/3379636?hl=en
- Analytics privacy and customer controls: https://support.google.com/analytics/answer/6004245?hl=en
- prohibition on PII and sensitive data: https://support.google.com/analytics/answer/13297105?hl=en
- regional data collection: https://support.google.com/analytics/answer/12017362?hl=en
- data sharing with Google products: https://support.google.com/analytics/answer/9012600?hl=en
- EU user-consent policy: https://www.google.com/about/company/user-consent-policy/

Google Analytics rules prohibit recognizable PII and data that identifies a user or reveals sensitive information. NeuroMap may consider only coarse landing-page measurement after valid consent. Consent does not make child- or health-related payloads suitable for Google.

Prohibited data includes email, child data, detailed age context, answers, selected bank/focus, secondary focus, severity, report content, session/access token, invoice/payment references and sensitive URL/query parameters. Tags must not load on questionnaire, summary, checkout-success, report-access or observation pages unless a separate legal/policy review and dated network capture approve the exact implementation.

### 20.2 Meta Business Tools

**Official sources:**

- data-processing terms: https://www.facebook.com/legal/terms/dataprocessing
- Business Tools terms: https://www.facebook.com/legal/terms/businesstools/preview

Meta's Business Tools terms prohibit sending data known or reasonably known to relate to children under 13, health information and other sensitive information. Production server-side Meta event delivery is intentionally disabled. Pixel and Conversions API must not appear on questionnaire, summary, success/report or observation pages. Even landing-only measurement requires a DPIA change review, consent/policy review and network evidence.

### 20.3 TikTok advertiser tools

**Official sources:**

- Business Products data terms: https://ads.tiktok.com/i18n/official/policy/controller-to-controller%2Fprivacy
- advertiser-tool terms: https://ads.tiktok.com/help/article/tiktok-advertiser-tools-and-related-terms?lang=en
- prohibited data sharing: https://ads.tiktok.com/help/article/about-notifications-of-potentially-prohibited-data-sharing-on-tiktok?lang=en

TikTok guidance prohibits sharing children's, health, financial and other sensitive data, and treats pixels/Events API on sensitive pages as a particular risk. No TikTok integration was identified in the reviewed production flow. A new pixel, Events API, SDK, enhanced matching or campaign URL parameter is a material processing change and must not be deployed before an approved DPIA amendment.

### 20.4 Mandatory technical boundary

Marketing events must use an explicit allow-list with consent defaulting to `denied`. Automated build/smoke checks, browser-network inspection and a GTM/Webflow custom-code inventory must evidence the restriction. Marketing performance measurement must not be linked with questionnaire or report data, email, payment data or a stable session identifier.

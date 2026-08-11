# Independent Validation Plan

Version: `2026-07-26-v1`

Purpose: separate implemented engineering controls from conclusions that require a competent, independent third party. This plan is not a certificate and does not itself close any launch gate.

## 1. Evidence rules

1. Every review must identify the reviewer, qualifications, independence, scope, product version, date, method, findings, exclusions and signed decision.
2. A pass without reproducible evidence, sample sizes, test cases or a remediation retest is not accepted.
3. Evidence must be stored outside the public repository with an identifier recorded in `LEGAL_REMEDIATION_AND_VALIDATION_REGISTER.md`.
4. Findings rated critical or high, and any legal/clinical launch blocker, must be closed or formally accepted by the authorised controller before launch.
5. Public badges or claims may use only the exact wording approved by the relevant reviewer. An engineering smoke test is never described as certification.

## 2. Required independent workstreams

| ID | Reviewer | Mandatory scope | Required deliverable | Acceptance condition |
| --- | --- | --- | --- | --- |
| VAL-LEGAL-EU | EU privacy/consumer counsel or qualified DPO | GDPR Articles 5, 6, 8, 9, 12-22, 25, 28, 32, 35-36, international transfers, child representation, consumer digital-content rules, target countries and controller notices | signed legal memorandum, DPIA advice, Article 36 decision, release-gate checklist | no unresolved legal launch blocker; lawful bases, Article 9 condition, rights, retention, transfers and guardian process approved |
| VAL-REG-MD | EU medical-device/regulatory counsel | intended purpose, claims, scoring, reports, advertising and MDR software qualification | signed classification memorandum with permitted/prohibited claims | non-medical-device position supported for the exact product and marketing text, or required MDR path completed |
| VAL-CLIN | qualified child psychologist/psychiatrist and psychometrician | construct/content validity, age bands, wording, overlap, reverse items, scoring, thresholds, safety handling, limitations and report interpretation | protocol, item-level review, validation dataset report, calibration statistics, signed limitations | predefined validity/reliability and safety criteria met; no diagnostic or predictive claim beyond evidence |
| VAL-L10N | native legal translator/reviewer for each launched locale | terms, privacy notice, consent, checkout, safety copy, report limitations, invoices and rights UI | signed bilingual comparison and issue log per locale | legal meaning and plain-language effect equivalent; all issues closed in the released version |
| VAL-PENTEST | independent penetration-testing provider | OWASP ASVS/API Top 10, admin auth, session/rights IDOR, OTP, checkout/webhook, queue, file/report access, rate limits, secrets, cloud and dependency configuration | signed report plus remediation retest | no open critical/high finding; medium findings risk-owned with dates |
| VAL-A11Y | accessibility specialist using disabled testers where practical | WCAG 2.2 AA, keyboard, screen readers, focus, contrast, zoom/reflow, error handling, modals and Arabic RTL | audit report and retest | no A/AA blocker in purchase, consent, questionnaire or rights flows |
| VAL-VENDOR | privacy/security owner with counsel | executed DPAs, SCC/TIA, regions, retention, subprocessors and permission for actual child-related/special-category data | account-level vendor evidence pack | Railway/OpenAI/Resend blockers closed in writing or architecture changed |
| VAL-PAY-TAX | consumer/accounting counsel | Stripe offer, cancellation, immediate performance, withdrawal, invoices, VAT/tax and local currency/country rules | signed checkout and invoicing memorandum | offer and post-payment evidence approved for every launch country |
| VAL-LOAD | independent performance engineer | campaign load, database pool, worker concurrency, OpenAI/Resend/Stripe limits, recovery, queue ageing and degradation | repeatable load report and capacity envelope | target volume met with agreed latency/error/queue-age thresholds and tested rollback |

## 3. Clinical and psychometric minimum protocol

The professional review must not be limited to reading a few questions. It should freeze a versioned bank, define the intended age range and use, inspect every item and translation, establish a representative sample, define comparator measures and pre-register quality thresholds. At minimum, assess content validity, comprehension, internal structure, test-retest reliability where appropriate, differential item functioning across language/age groups, calibration, false reassurance, false alarm, domain overlap and the effect of the adaptive picker.

Until this protocol is complete, the output remains an informational, non-diagnostic screening summary. Terms such as clinically validated, sensitivity, specificity, diagnostic accuracy or medical grade are prohibited.

## 4. Legal localization matrix

Use `LEGAL_TRANSLATION_VALIDATION_REGISTER.md` for HU, EN, DE, IT, ES, ZH, JA, AR, PL, PT and FR. Machine or internal translation may support drafting but cannot close legal equivalence. The reviewer must compare the rendered Webflow flow, not only source strings.

## 5. Security retest boundaries

The penetration test must use a production-like isolated environment and include both authenticated and unauthenticated testing. It must cover horizontal/vertical access control, admin-token and admin-session handling, request-token and OTP replay, webhook signature verification, metadata minimisation, queue double-processing, invoice retry, PDF/object access, log redaction, CORS/CSP, rate-limit failure modes and dependency/cloud configuration. A signed retest is required after remediation.

## 6. Vendor/account validation

Public vendor pages are background evidence only. Capture executed agreements, contracting entity, actual region, data retention/training settings, MFA/access list, subprocessor notice subscription, key rotation, deletion/export tests and a redacted payload/network trace from the production account. Resolve any contract schedule that describes special-category data as absent while the actual service intentionally processes health-like child inferences.

## 7. Public claim gate

The following claims remain prohibited until the corresponding signed evidence is approved: `GDPR certified`, `legally approved`, `clinically validated`, `psychometrically validated`, `medical grade`, `diagnostically accurate`, `penetration tested`, `secure`, `WCAG compliant`, or translated equivalents. Permitted product descriptions must remain factual, narrow and non-diagnostic.

## 8. Revalidation triggers

Repeat the affected review after a material change to intended purpose, claims, question banks, scoring, language, age range, AI model/prompt, provider, region, retention, checkout, legal text, security architecture or target country. Also revalidate after a serious incident, material complaint, regulator guidance or evidence of systematic false reassurance/harm.

# Legal Remediation and Validation Register

Version: `2026-07-26-v1`

This register distinguishes internal implementation evidence from independent approval. Blank evidence or signature fields mean the item remains open.

| Evidence ID | Area | Current engineering evidence | Independent validator | Required signed evidence | Status |
| --- | --- | --- | --- | --- | --- |
| ENG-CONSENT-001 | versioned legal/privacy consent | source, migrations and legal-consent smoke tests | privacy counsel/DPO | lawful-basis and consent-validity memorandum | IMPLEMENTED / EXTERNAL REVIEW OPEN |
| ENG-RIGHTS-001 | email OTP for privacy requests | migration, service code, rate limits and smoke checks | privacy counsel + penetration tester | identity standard approval and abuse-test retest | IMPLEMENTED / EXTERNAL REVIEW OPEN |
| ENG-SAFETY-001 | urgent safety response | safety items, non-scoring branch and acknowledgement block | child clinician + safeguarding counsel | signed safety protocol and localization approval | IMPLEMENTED / EXTERNAL REVIEW OPEN |
| ENG-CHECKOUT-001 | separate purchase confirmations | checkout UI/payload validation and session persistence | consumer counsel | digital-performance/withdrawal approval per market | IMPLEMENTED / EXTERNAL REVIEW OPEN |
| ENG-SEC-001 | access/rate-limit/session hardening | security audit, source and remediation evidence register | independent penetration tester | report with no open critical/high finding | IMPLEMENTED / EXTERNAL REVIEW OPEN |
| ENG-L10N-001 | 11-locale structural coverage | language audit and locale source maps | native legal reviewers | one signed bilingual review per locale | IMPLEMENTED / EXTERNAL REVIEW OPEN |
| ENG-CLIN-001 | bank and picker quality controls | bank audits and engine selection audits | child psychologist + psychometrician | item-level and empirical validation report | INTERNAL QA ONLY / VALIDATION OPEN |
| VEN-CORE-001 | Railway/OpenAI/Resend contracts | public-source vendor register | privacy counsel/security owner | executed DPA/SCC/TIA and sensitive-data suitability | LAUNCH BLOCKER OPEN |
| VEN-PAY-001 | Stripe/Számlázz.hu | minimised payload and invoicing implementation | consumer/accounting counsel | account, tax and consumer-law approval | EXTERNAL REVIEW OPEN |
| VAL-A11Y-001 | accessibility | semantic/keyboard smoke coverage | independent accessibility auditor | WCAG 2.2 AA report and retest | EXTERNAL REVIEW OPEN |
| VAL-LOAD-001 | campaign capacity | internal queue/load tooling | independent performance engineer | signed capacity envelope | EXTERNAL REVIEW OPEN |

## Closure record

For each item attach: reviewer identity and qualification, independence declaration, exact version/hash, scope, exclusions, findings, remediation evidence, signed decision and revalidation date. Store confidential reports in a controlled evidence repository; retain only the evidence identifier here.

No entry may be changed to `VALIDATED` merely because automated tests pass. Public statements must follow the claim gate in `INDEPENDENT_VALIDATION_PLAN.md`.

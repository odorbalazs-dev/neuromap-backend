# Legal Translation Validation Register

Version: `2026-07-26-v1`

The 11-language legal and safety content has automated structural coverage, but that is not native legal validation. Each language remains `PENDING INDEPENDENT REVIEW` until the fields below are completed by a qualified native legal reviewer.

| Locale | Language | Engineering coverage | Independent status | Reviewer / qualification | Reviewed version and hash | Date | Issues / decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hu | Hungarian | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| en | English | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| de | German | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| it | Italian | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| es | Spanish | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| zh | Simplified Chinese | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| ja | Japanese | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| ar | Arabic | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| pl | Polish | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| pt | Portuguese | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |
| fr | French | terms, privacy, consent, checkout, safety and rights UI present | PENDING INDEPENDENT REVIEW |  |  |  |  |

## Review checklist per locale

- Controller identity, contact, supervisory-authority and representative wording is accurate for the actual target market.
- Article 6 and Article 9 wording preserves the same legal meaning and separates required from optional processing.
- Adult/guardian representation is clear and does not imply that email possession alone proves parental responsibility.
- Immediate digital performance and withdrawal acknowledgement is separate from initial privacy consent.
- Non-diagnostic purpose, limitations, emergency/safeguarding wording and professional escalation are natural and unambiguous.
- Retention, rights, complaint, transfer, AI transparency and automated-processing explanations are complete.
- Prices, currency, recurring-payment status, cancellation and invoice wording match the live Stripe flow.
- Privacy-rights OTP instructions and statuses are understandable without exposing security details.
- Text is reviewed in the rendered responsive UI, including Arabic RTL, keyboard flow, line breaks and PDF output.
- No public certification, clinical-validation or guaranteed-outcome claim appears without evidence.

## Approval rule

A locale may be released only when the reviewer signs the exact legal-content version, all critical/high translation issues are closed, and the approval evidence ID is copied into `LEGAL_REMEDIATION_AND_VALIDATION_REGISTER.md`. Product translation quality alone does not substitute for jurisdiction-specific legal advice.

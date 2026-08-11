# Legal Release Sign-off

Release version/date: ____________________

This record is a launch gate, not a compliance certificate. Every required item must have a named approver and evidence link. Keep `LEGAL_REVIEW_APPROVED`, `DPIA_APPROVED`, `PROCESSOR_AGREEMENTS_APPROVED` and `PRIVACY_POLICY_PUBLISHED` false until the corresponding evidence is complete.

## Mandatory approvals

| Gate | Required evidence | Owner | Decision/date |
|---|---|---|---|
| Controller identity | Legal entity, address, country, privacy contact, EEA representative decision, supervisory authority | Controller |  |
| DPO decision | Article 37 assessment; DPO details if required | Privacy counsel/DPO |  |
| DPIA | Approved `DPIA_WORKING_DRAFT.md`, residual risks accepted, Article 36 consultation decision | Controller + privacy counsel/DPO |  |
| Processor/transfers | Executed DPA/SCC/TIA and register entry for each active vendor | Privacy + security |  |
| Intended purpose/classification | Claims policy, medical-device analysis, target-market restrictions | Regulatory counsel |  |
| Questionnaire/report content | Qualified child-psychology/clinical-method review, limitations, localization | Qualified reviewer |  |
| Consumer law | Offer, immediate performance/withdrawal, conformity/remedies and contract confirmation | Consumer counsel |  |
| Local-language law/content | Native review for every launched language and country | Localization/legal owner |  |
| Security evidence | Security audit, access control, secret handling, incident runbook/tabletop, backup/deletion verification | Security owner |  |
| Operational privacy | Rights queue owner, daily lifecycle cron/alerts, retention schedule, breach contacts | Operations + privacy |  |
| Independent validation register | Completed evidence IDs from `INDEPENDENT_VALIDATION_PLAN.md`, including legal, clinical, security, localization and accessibility decisions | Controller |  |

## Deployment verification

- [ ] Production environment contains real controller and authority details, not placeholders.
- [ ] Legal URLs resolve and displayed versions match stored consent versions.
- [ ] Consent defaults deny optional analytics and advertising remains disabled for the sensitive flow.
- [ ] Privacy rights access, restriction, withdrawal and erasure have been exercised in a production-like database using the email OTP, expiry, lockout and request-token controls.
- [ ] Contract confirmation is sent after payment even if report generation is delayed.
- [ ] Lifecycle job is scheduled, monitored and has no overdue backlog.
- [ ] Stripe products/prices, invoice data, landing offer and confirmation match.
- [ ] No questionnaire result or diagnosis-like field reaches analytics/advertising tools.
- [ ] Incident and data-rights escalation contacts are staffed.
- [ ] Rollback owner and stop-processing procedure are documented.
- [ ] Every launched locale has a signed native legal review in `LEGAL_TRANSLATION_VALIDATION_REGISTER.md`.
- [ ] No certification, clinical-validity, medical-grade or guaranteed-outcome claim exceeds the signed independent evidence.

## Residual decision

Residual risk level: ____________________

Article 36 prior-consultation required? Yes / No

Reasoned decision and evidence: ________________________________________________

Controller approval: ____________________  Date: __________

Privacy counsel/DPO advice: ______________  Date: __________

Security approval: _______________________  Date: __________

Product/operations approval: ______________ Date: __________

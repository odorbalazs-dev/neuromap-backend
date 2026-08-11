# Record of Processing Activities

Status: Article 30 working record; controller details and processor evidence must be completed before launch.

## Controller and scope

Controller: configure `DATA_CONTROLLER_NAME`, registered address, country, privacy contact, EEA representative where required, and DPO contact or documented no-DPO decision. Service scope: an adult purchaser completes a child-related informational screening, pays for a report, and may use an optional observation diary.

## Processing activities

| Activity | Purpose | Data and subjects | Legal basis candidate | Recipients | Retention |
|---|---|---|---|---|---|
| Legal gate and accountless session | Verify adult/guardian authority, show terms/privacy information, record choices | Adult role, locale, consent evidence; adult purchaser | Art. 6(1)(b) contract steps; Art. 6(1)(c) where consumer evidence is required; explicit consent for Art. 9 data | Railway/Postgres | Unused receipt until expiry; used evidence for approved limitation period |
| Questionnaire and screening | Generate an informational, non-diagnostic explanation | Child-related behavioural answers, age band, inferred focus; adult purchaser and child | Art. 6(1)(b) plus Art. 9(2)(a) explicit consent, subject to counsel validation | Railway, OpenAI | Default 90 days, earlier on valid erasure |
| Payment | Create and verify checkout, prevent duplicate handling | Adult contact, package, amount, Stripe identifiers | Art. 6(1)(b), Art. 6(1)(c), legitimate interests for fraud/integrity where documented | Stripe, Railway | Contract/accounting periods; raw webhook payload 14 days |
| Report delivery | Create PDF and send purchased output | Adult email, child-related report | Art. 6(1)(b) and Art. 9(2)(a) | OpenAI, Resend, Railway | Default 90 days for sensitive session state; provider logs per approved processor terms |
| Invoicing | Issue and deliver invoice | Adult billing identity/address/tax details, amount | Art. 6(1)(c) and contract | Szamlazz.hu, Stripe as relevant | Statutory accounting period |
| Observation diary | Provide optional structured observation and follow-up | Notes, context, signal level, strategies, adult email | Art. 6(1)(b) and Art. 9(2)(a) | Railway, Resend, OpenAI if report generation uses entries | Session retention deadline or earlier erasure |
| Optional analytics | Measure non-sensitive funnel events | Consent state, coarse technical/event data; no questionnaire result or diagnosis-like field | Art. 6(1)(a) consent | Google/Meta/TikTok only if separately approved and configured | Provider/configuration period; define before activation |
| Security and operations | Prevent abuse, authenticate admin, investigate incidents | Hashed IP/UA, rate-limit state, logs | Art. 6(1)(f), balancing test required | Railway and approved logging providers | Short operational periods in retention schedule |
| Privacy rights | Verify and fulfil requests | Request type, hashed email, status, minimal evidence | Art. 6(1)(c) | Controller/privacy team, Railway | Approved limitation period |

## Data minimization rules

The name field identifies the adult purchaser, not the child. No child full name, address, school, date of birth, clinical record, free-form diagnostic history or advertising profile is required. Analytics must not receive questionnaire answers, inferred domain, severity, session identifier, email or report content. Advertising consent remains disabled in the sensitive flow.

## International transfers and safeguards

For each processor record entity, role, processing location, sub-processors, transfer mechanism, SCC module, supplementary measures, deletion commitments and incident terms. Adequacy or SCC labels alone are insufficient; retain the executed DPA/SCC and transfer-impact assessment. See `VENDOR_AND_TRANSFER_REGISTER.md`.

## Review

Review at least annually and before a new country, model, processor, purpose, data category, retention period or automated decision feature. Link the approved ROPA revision to the privacy notice and DPIA approval record.

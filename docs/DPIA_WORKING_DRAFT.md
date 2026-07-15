# NeuroMap Kids DPIA working draft

This is a working Data Protection Impact Assessment draft for internal readiness. It must be reviewed by a qualified privacy professional before launch.

## Processing description

Parents complete a questionnaire about child behaviour, emotions, learning and everyday functioning. The system stores answers, derives screening patterns, generates a PDF report and sends it by email after payment.

## Data subjects

- parent or adult purchaser
- child described in questionnaire answers

## Data categories

- adult name and email
- language and package choice
- questionnaire answers
- screening profile and report text
- payment status and Stripe references
- transactional email status
- invoice data
- consent receipt and legal version
- operational logs and delivery status

## Special-category data

Questionnaire answers and report outputs may infer health, developmental or psychological information about a child. Treat as GDPR Article 9 special-category data.

## Necessity and proportionality

Only collect data required for:
- report generation
- payment completion
- email delivery
- invoice generation
- support, fraud prevention and security
- proof of consent

Do not collect child names. Do not send questionnaire or profile data to marketing platforms.

## Main risks

- parent misunderstands the report as a diagnosis
- child-related health data is used for marketing
- sensitive data is stored longer than necessary
- report is sent to an incorrect email address
- language mismatch causes misleading consent or report wording
- unauthorized admin access exposes sessions
- automated analysis produces overconfident or clinically framed language

## Controls already implemented

- mandatory legal and privacy consent flow before questionnaire start
- explicit Article 9 consent checkbox
- consent token verification before checkout
- ad/analytics consent defaults denied
- Meta server-side events disabled by default
- marketing event payload minimization
- no child name requirement
- launch-gate checks for legal configuration
- admin token protection for dashboard APIs

## Required controls before launch

- external legal and regulatory review
- published privacy policy and terms in all target languages
- retention/anonymization automation enabled
- incident response procedure
- processor DPA checklist
- admin access rotation and audit log review
- live test of consent withdrawal
- production confirmation that no health-related data reaches ad platforms

## Residual risk

Residual risk remains medium to high until external legal/regulatory review confirms positioning, consent design, retention and cross-border transfer compliance.


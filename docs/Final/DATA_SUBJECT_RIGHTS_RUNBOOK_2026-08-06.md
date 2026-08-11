# Data Subject Rights Runbook

Version: `2026-07-26-verified-rights-v3`

Status: operational draft. Controller and privacy counsel/DPO approval is required before production sign-off.

## 1. Supported rights

The privacy centre supports access, portability, erasure, restriction, rectification, objection and consent withdrawal. A requester must first prove access to the relevant NeuroMap session. Creating a request then produces a separate high-entropy request token and sends a six-digit, single-use verification code to the adult purchaser's recorded email address.

No requested action, disclosure or export is performed before successful email verification. Email verification is a proportionate possession check, not conclusive proof of guardian authority or legal identity.

## 2. Intake and verification flow

1. Accept a request through the in-product privacy centre or the published privacy contact.
2. For an in-product request, verify the session access token before creating the request.
3. Store only a SHA-256 hash of the request token and verification code. Never log either raw value.
4. Send the verification code to the adult email already stored for the session. The code expires after 15 minutes and is locked after five invalid attempts.
5. Keep the request in `verification_pending` until the code succeeds. Status checks require the separate request token.
6. After verification, atomically claim the request as `processing` before any action executes.
7. Record request type, timestamps, verification result, status, decision reason and action events in `privacy_requests` and `privacy_request_events`.
8. Never place raw email addresses, child identifiers, questionnaire answers, reports, request tokens or verification codes in operational tickets or logs.

If email delivery fails, the request is removed because the verification channel was not established. If the code expires or locks, require a new request instead of reusing or manually revealing the code.

## 3. Alternative and disputed verification

Do not ask for identity documents by default. If the requester cannot access the registered email, disputes guardian authority, requests data directly as a child, or presents contradictory information, pause automation and route the case to the privacy lead.

Use a documented, risk-based alternative that collects the least additional data. Never ask for child medical records merely to verify a request. Email possession alone must not be treated as proof of parental responsibility when there is a dispute, safeguarding concern or credible risk of unauthorised access.

## 4. Automated outcomes after verification

- **Access:** supply a structured electronic copy through the authenticated response channel.
- **Portability:** supply user-provided and observed data in machine-readable JSON. Exclude inferred analysis and internal operational assessments, and explain that distinction.
- **Restriction or objection:** stop analysis, report delivery, follow-ups and observation processing immediately.
- **Consent withdrawal:** timestamp withdrawal and stop future special-category processing. Explain that prior lawful processing is not retroactively invalidated.
- **Erasure:** erase questionnaire, generated report and observation data. If statutory invoice records remain, mark the request partially fulfilled and explain the category, legal basis and retention period.
- **Rectification:** place the request in controller review because changing source answers or a generated evidentiary record may affect report integrity.

## 5. Manual review queue

Review `in_review`, `processing`, failed and overdue requests every business day. The owner must resolve rectification, failed automated actions, identity disputes, guardian-authority questions, legal holds and complex objections. An automated failure remains visible as `in_review` and must never disappear after an API error.

The normal GDPR response period is one month, subject to the legally applicable rules on identity clarification and extensions. Record any lawful extension before the original deadline, notify the requester, explain the complexity and never extend automatically. Rejections require a specific reason and information about complaint and judicial-remedy rights. Privacy counsel must validate the deadline calculation used for cases where identity cannot initially be confirmed.

## 6. Disclosure and security checks

Before disclosure, verify that the export belongs only to the authenticated session, contains no other purchaser's data, and reveals no credentials, internal secrets or unnecessary third-party personal data. Do not send an export as an unprotected email attachment. Record the approving reviewer and evidence identifier without copying disclosed content into logs.

The request token and OTP must be subject to endpoint rate limiting. Repeated verification failures, unusual IP/user-agent changes, multiple sessions linked to one requester, or requests following an incident require escalation.

## 7. Escalation

Escalate immediately when a request:

- is made by or directly concerns a child acting independently;
- disputes guardian authority or adult representation;
- alleges harm, discrimination or a consequential decision;
- involves law enforcement, litigation or a legal hold;
- overlaps a suspected personal-data breach;
- requires cross-border legal interpretation;
- cannot be completed within the applicable deadline; or
- indicates that the registered email may be compromised.

Preserve only the evidence required for the escalation.

## 8. Closure evidence

Closure requires the final status, decision reason, completion timestamp, verification method, categories erased or retained, recipient notification where relevant and any exception basis. Sample completed cases quarterly and reconcile restrictions against the queue, email, observation, invoice and retention systems.

## 9. Required validation

Engineering tests can evidence implementation of token hashing, OTP expiry, lockout and status transitions. Privacy counsel/DPO must validate the identity-verification standard, guardian-authority fallback, deadline wording, portability scope and statutory-retention exceptions. Independent abuse testing must cover token guessing, OTP brute force, IDOR, replay, race conditions and cross-session disclosure. Record signed evidence under `docs/LEGAL_REMEDIATION_AND_VALIDATION_REGISTER.md`.

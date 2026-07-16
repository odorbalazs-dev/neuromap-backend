# Data Subject Rights Runbook

Status: operational draft; controller/privacy lead approval required.

## 1. Supported rights

The authenticated privacy centre supports access, portability, erasure, restriction, rectification, objection and consent withdrawal. A purchaser enters through the session-specific access channel. The backend verifies the high-entropy session token and returns a separate request token for later status checks.

## 2. Intake and identity verification

1. Accept requests through the in-product privacy centre or the published privacy email.
2. Do not ask for identity documents by default. Use the existing session token where proportionate.
3. If the requester lacks the token, use a documented alternative verification process that collects the least additional data and never asks for child medical records.
4. Log request type, received date, verification method, due date, status and decision reason in `privacy_requests` and `privacy_request_events`.
5. Never place raw email addresses or questionnaire answers in operational tickets.

## 3. Automated outcomes

- Access: supply a structured electronic copy through the authenticated response.
- Portability: supply user-provided and observed data in machine-readable JSON; exclude inferred analysis and internal operational assessments, and explain that distinction.
- Restriction or objection: immediately stop analysis, report delivery, follow-ups and observation processing.
- Consent withdrawal: timestamp the withdrawal and stop future special-category processing. Explain that prior lawful processing is not retroactively invalidated.
- Erasure: erase questionnaire, generated report and diary data. If statutory invoice records remain, mark the request partially fulfilled and explain the retained category, basis and period.
- Rectification: place in controller review because changing an evidentiary or generated record can affect report integrity.

## 4. Manual review queue

Review `in_review` and overdue requests every business day. The owner must resolve rectification requests, failed automated actions, identity disputes, legal holds and complex objections. Any automated failure is deliberately preserved as `in_review`; it must not disappear after an API error.

The normal deadline is one month from receipt. Record any lawful extension before the original deadline, notify the requester, explain the complexity and never extend automatically. Rejections require a specific legal reason and information about complaint and judicial-remedy rights.

## 5. Quality and security checks

Before disclosure, verify that the export belongs only to the authenticated session, contains no other purchaser's data, and does not reveal secrets, internal credentials or third-party personal data. Send no export as an unprotected email attachment. Record who approved a manual disclosure without copying the disclosed content into logs.

## 6. Escalation

Escalate immediately to the privacy lead when the request concerns a child directly, disputes guardian authority, alleges harm or discrimination, involves law enforcement, overlaps an incident, requires cross-border interpretation, or cannot be completed by the deadline. Preserve only the evidence required for the escalation.

## 7. Closure evidence

Closure requires status, decision reason, completion timestamp, categories erased/retained, recipient notification where relevant, and any exception basis. Sample completed cases quarterly and reconcile restrictions against queue, email and observation systems.

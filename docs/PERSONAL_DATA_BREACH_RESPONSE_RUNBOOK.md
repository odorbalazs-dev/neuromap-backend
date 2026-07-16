# Personal Data Breach Response Runbook

Status: operational draft. Populate named contacts and conduct a tabletop exercise before launch.

## 1. Trigger and immediate actions

Treat loss of confidentiality, integrity or availability of personal data as a potential breach. Examples include exposed database credentials, cross-session report disclosure, misdirected report email, public access-token leakage, processor compromise, unauthorized admin action, deleted-data recovery failure or analytics receiving questionnaire content.

1. Open an incident record and timestamp awareness.
2. Assign incident commander, privacy lead and technical owner.
3. Contain without destroying evidence: revoke credentials/tokens, isolate affected service, stop queues or email, block vulnerable routes and preserve relevant minimal logs.
4. Determine systems, time window, data categories, number and type of affected people, geography and whether children or special-category data are involved.
5. Contact affected processors under contractual incident channels.

## 2. Risk assessment

Assess likelihood and severity of identity exposure, stigma, discrimination, emotional harm, fraud, loss of confidentiality and inability to exercise rights. Special-category child-related inferences, report content and cross-session disclosure raise severity. Record the facts, assumptions, mitigations and decision even when notification is not required.

## 3. Notification decision

The controller must assess supervisory-authority notification without undue delay and, where feasible, within 72 hours after awareness when the breach is likely to risk rights and freedoms. If notification is late, document reasons. Notify affected people without undue delay when high risk is likely, using clear language, consequences, measures and contact details. Counsel/privacy lead owns the legal decision; engineering must not self-certify no notification.

## 4. Technical investigation checklist

- Rotate secrets and verify no secret was committed or logged.
- Check database, Railway, Stripe, OpenAI, Resend and invoicing access/audit logs.
- Trace session authorization and public-token boundaries.
- Identify reports/emails delivered to unintended recipients.
- Check webhook replay/idempotency and queue duplicate processing.
- Check analytics payloads for sensitive fields.
- Verify backups, replicas and deletion propagation.
- Test the corrective change and monitor recurrence indicators.

## 5. Communications

Use one approved factual narrative. Do not minimize uncertainty or speculate. Support messages must not ask users to email questionnaire content. Preserve copies of authority/user notices and processor communications in the incident record.

## 6. Closure

Closure requires root cause, affected scope, notification decision, remediation, credential rotation, data-recovery/deletion outcome, lessons learned, DPIA/ROPA/vendor updates and an owner/date for residual actions. Run a tabletop exercise at least annually and after material architecture change.

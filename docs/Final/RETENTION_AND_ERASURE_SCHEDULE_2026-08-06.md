# Retention and Erasure Schedule

Status: controller working policy; requires legal and finance approval before launch.

## 1. Purpose and ownership

This schedule implements storage limitation for NeuroMap Kids. The controller owns the schedule, the privacy lead approves exceptions, engineering implements deletion, and finance defines mandatory invoice retention by applicable law. No team may extend a period merely because storage is available.

## 2. Production schedule

| Record | Default period or trigger | End-of-period action | Reason |
|---|---|---|---|
| Questionnaire answers, purchaser name/email, generated analysis and report state | 90 days from session creation (`DATA_RETENTION_DAYS`, allowed range 7-730) | Pseudonymize session; clear payload, analysis, report/follow-up errors and public tokens; delete observation diary | Deliver the purchased service, support a short correction window, then minimize sensitive data |
| Observation diary and related follow-ups | Until session retention deadline or earlier erasure/restriction request | Delete diary; cancel pending follow-ups | Optional Plus feature; no independent long-term need |
| Raw Stripe webhook payload | 14 days (`WEBHOOK_EVENT_PAYLOAD_RETENTION_DAYS`) | Replace payload with minimal provider/event identifiers | Debug payment delivery while reducing copied payment metadata |
| Webhook idempotency metadata | Operational necessity, reviewed at least annually | Delete when no longer needed for duplicate prevention or legal claims | Payment integrity and incident evidence |
| Unused consent receipt | Receipt expiry plus short operational cleanup window | Delete expired, unused record | No contract was formed; proof is no longer needed |
| Used consent evidence | Limitation period applicable to the contract/legal claim | Restrict to legal-evidence use, then delete | Demonstrate consent and contract formation |
| Invoice and mandatory accounting data | Period required by the governing tax/accounting law | Delete or irreversibly anonymize after the statutory period | Legal obligation; this period must be set by finance/counsel for each invoicing entity |
| Privacy request and action log | Limitation period for demonstrating compliance | Delete or anonymize after the period | Accountability and dispute handling |
| Admin sessions | Expiry plus 7 days; revoked sessions up to 30 days | Delete | Security investigation with short retention |
| Rate-limit buckets | Reset plus 1 day | Delete | Abuse prevention only |
| Security incident evidence | Case-specific hold approved by privacy/security lead | Delete after incident and legal hold end | Investigation and legal claims |

## 3. Automated controls

`POST /cron/data-lifecycle` invokes `runDataLifecycle()` and performs bounded batches. It erases expired session data, redacts old webhook payloads, deletes expired unused consent receipts after the cleanup window, closes observation programs, cancels follow-ups, and purges expired operational state. The cron must run at least daily and alert when any session erasure fails.

The job is idempotent. A failed record remains eligible for the next run. Batch limits prevent a large backlog from blocking normal service, but the operations owner must increase cadence while a backlog exists.

## 4. Erasure exceptions

An erasure request does not silently remove accounting records where retention is legally mandatory. In that case the request is marked `partially_fulfilled`, questionnaire/report/diary data is erased, and financial data is access-restricted to legal purposes. A documented legal hold pauses only the minimum affected records and must have an owner, basis, start date and review date.

## 5. Verification evidence

Monthly evidence should include lifecycle run counts, failures and oldest overdue item. Quarterly evidence should include a sample showing that payload, analysis, public tokens and observation records were removed. The controller must record changes to the periods in the DPIA, privacy notice and release sign-off.

## 6. Open launch decisions

- Confirm the statutory invoice period and controller limitation period by entity and target country.
- Define a finite deletion period for webhook idempotency metadata, used consent evidence and privacy-request logs.
- Configure a monitored daily scheduler for `/cron/data-lifecycle`.
- Approve any retention above 90 days with necessity evidence and an updated DPIA.

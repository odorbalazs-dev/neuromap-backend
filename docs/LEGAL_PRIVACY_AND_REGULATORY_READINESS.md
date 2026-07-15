# NeuroMap Kids legal, privacy and regulatory readiness

This document is an operational readiness note for the product team. It is not legal advice and does not replace review by a qualified lawyer, data protection officer, or medical-device regulatory specialist.

## Current intended purpose

NeuroMap Kids is positioned as a parent-facing, informational screening and reflection tool. It must not be marketed, worded, or technically presented as a diagnostic, therapeutic, predictive, clinical decision-support, or treatment-selection system.

Allowed wording:
- structured screening summary
- parent-friendly interpretation of questionnaire answers
- patterns that may be worth observing
- practical next steps for parents
- when to consider asking a qualified professional

Forbidden wording:
- diagnosis or likely diagnosis
- medical conclusion
- clinical severity score
- treatment recommendation
- prediction of disorder or disease
- substitute for a professional assessment

## GDPR lawful basis

The service processes parent contact, payment, questionnaire and report data.

Recommended legal bases:
- GDPR Article 6(1)(b): contract performance for checkout, report generation and delivery.
- GDPR Article 6(1)(c): legal obligations for invoicing, accounting and tax records.
- GDPR Article 6(1)(f): limited operational security, fraud prevention and system reliability logs.
- GDPR Article 6(1)(a): optional analytics consent, where enabled.

Questionnaire answers and generated interpretations may reveal information about a child’s health, development or psychological profile. The conservative GDPR Article 9 basis is:
- GDPR Article 9(2)(a): explicit consent for processing special-category data.

The app now records a mandatory legal/privacy consent receipt before questionnaire start and requires an active consent token at checkout.

## Children and naming

The product should ask for the adult purchaser or parent name, not the child’s name. A nickname can still become personal data if it is linked to an email, checkout session, answers, PDF, or support request. Avoid collecting child names or child nicknames unless a lawyer confirms the necessity and retention design.

## Required user-facing flow

Before questionnaire access:
- language selection
- terms and medical-disclaimer acceptance
- privacy notice review
- explicit Article 9 consent for questionnaire/report processing
- optional analytics consent, unchecked by default

Before checkout:
- the frontend includes a consent receipt ID and token
- the backend verifies the consent token before creating checkout

Consent withdrawal:
- must be available from the privacy/legal modal
- withdrawal must stop non-essential future processing where technically and legally possible
- accounting, fraud, tax and already-completed transactional records may remain where legally required

## Marketing and ad-platform restrictions

Do not send questionnaire content, detected focus, specific profile, disorder names, severity, child-related signals, email, session IDs, checkout IDs, PDF status or report outcomes to Meta, TikTok, Google Ads or GA4.

Consent Mode defaults must remain denied:
- `ad_storage: denied`
- `analytics_storage: denied`
- `ad_user_data: denied`
- `ad_personalization: denied`

Analytics events may only use minimal, non-sensitive funnel information after optional analytics consent.

## Processor and transfer map

Core processors:
- Railway: backend hosting and database infrastructure.
- Stripe: payment processing.
- OpenAI: report text generation.
- Resend: transactional report email delivery.
- Szamlazz.hu: invoicing.
- Webflow: landing and embedded frontend hosting.

Before launch, confirm:
- processor agreements or data processing addenda
- EU/EEA transfer terms where relevant
- subprocessors and retention terms
- incident notification commitments

## Retention

Recommended retention policy:
- questionnaire and report processing data: keep only as long as needed for delivery, support and dispute handling.
- invoice/accounting data: retain according to legal obligations.
- operational logs: short retention and minimization.
- consent records: retain while needed to prove consent and compliance.

The database includes consent and lifecycle fields. A production deletion/anonymization job should be enabled before scale campaigns.

## Launch blocker

Before public paid launch, obtain external legal and regulatory review for:
- GDPR privacy notice and consent wording
- Article 9 explicit consent design
- children-related consent requirements by target market
- medical-device / wellness-software classification
- ad platform policy compliance for health and child-related claims


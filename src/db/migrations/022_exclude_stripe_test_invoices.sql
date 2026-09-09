-- Keep test payment/report history, but close its production invoicing work.
CREATE TEMP TABLE excluded_test_invoice_sessions ON COMMIT DROP AS
SELECT s.id FROM sessions s
WHERE LEFT(s.stripe_session_id, 8) = 'cs_test_'
   OR EXISTS (
     SELECT 1 FROM post_payment_outbox o WHERE o.session_id = s.id AND o.task = 'invoice'
       AND (o.payload->>'livemode' = 'false' OR LEFT(o.payload->>'id', 8) = 'cs_test_')
   );

UPDATE invoices i SET status = 'skipped',
  provider_response = COALESCE(i.provider_response, '{}'::jsonb) ||
    jsonb_build_object('excludedPreviousError', i.error_message),
  error_message = 'STRIPE_TEST_PAYMENT_EXCLUDED',
  processing_token = NULL, processing_started_at = NULL, updated_at = NOW()
FROM excluded_test_invoice_sessions t
WHERE i.session_id = t.id AND i.status <> 'issued'
  AND i.error_message IS DISTINCT FROM 'STRIPE_TEST_PAYMENT_EXCLUDED';

UPDATE sessions s SET invoice_status = 'skipped', invoice_error = 'STRIPE_TEST_PAYMENT_EXCLUDED'
FROM excluded_test_invoice_sessions t
WHERE s.id = t.id AND s.payment_status = 'paid' AND s.invoice_status IS DISTINCT FROM 'issued'
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.session_id = s.id AND i.status = 'issued');

UPDATE post_payment_outbox o SET status = 'done', completed_at = COALESCE(completed_at, NOW()),
  payload = '{}', lease_token = NULL, locked_until = NULL,
  last_error_code = 'STRIPE_TEST_PAYMENT_EXCLUDED'
FROM excluded_test_invoice_sessions t
WHERE o.session_id = t.id AND o.task = 'invoice' AND o.status <> 'done';

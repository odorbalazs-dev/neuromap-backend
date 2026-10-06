import { LaunchGateError } from './launch-gate.service.js';

// This operator rehearsal cannot be enabled on the production environment.
export function sandboxCheckoutEnabled(runtimeEnv) {
  return runtimeEnv.SANDBOX_OPERATOR_CHECKOUT_ENABLED === true &&
    runtimeEnv.STRIPE_MANAGED_PAYMENTS_TEST_ENABLED === true &&
    runtimeEnv.PRODUCTION_CHECKOUT_ENABLED === false &&
    String(runtimeEnv.INVOICE_AUTO_CREATE) === 'false' &&
    runtimeEnv.RAILWAY_PROJECT_ID === '3bf10cac-c752-4e28-8a23-eb74f501a3e7' &&
    runtimeEnv.RAILWAY_ENVIRONMENT_ID === '4799561b-655d-463a-8331-49621c18c9ee' &&
    /^(sk|rk)_test_/.test(runtimeEnv.STRIPE_SECRET_KEY || '');
}

export function assertSandboxCheckout(runtimeEnv, adminSession, email) {
  const recipients = String(runtimeEnv.SANDBOX_EMAIL_ALLOWLIST || '')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!sandboxCheckoutEnabled(runtimeEnv) || !adminSession?.id ||
      !recipients.includes(String(email || '').trim().toLowerCase())) {
    throw new LaunchGateError('Sandbox operator checkout is unavailable.', ['sandbox_operator']);
  }
}

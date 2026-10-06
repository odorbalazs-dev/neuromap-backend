import assert from 'node:assert/strict';
import { isManagedCheckout, managedPaymentsMode, managedPaymentsTestEnabled, validateManagedPrice, validateManagedTestPrice, validateManagedCheckout } from '../src/services/managed-payments-policy.js';

assert.equal(managedPaymentsTestEnabled({}), false);
assert.equal(managedPaymentsMode({}), null);
assert.throws(() => managedPaymentsMode({ STRIPE_MANAGED_PAYMENTS_TEST_ENABLED: true, STRIPE_MANAGED_PAYMENTS_LIVE_ENABLED: true }), /MODE_CONFLICT/);
for (const key of ['sk_live_placeholder', 'rk_live_placeholder', '', 'invalid']) {
  assert.throws(() => managedPaymentsTestEnabled({ STRIPE_MANAGED_PAYMENTS_TEST_ENABLED: true, STRIPE_SECRET_KEY: key }), /TEST_KEY_REQUIRED/);
}
for (const key of ['sk_test_placeholder', 'rk_test_placeholder']) {
  assert.equal(managedPaymentsTestEnabled({ STRIPE_MANAGED_PAYMENTS_TEST_ENABLED: true, STRIPE_SECRET_KEY: key }), true);
  assert.throws(() => managedPaymentsMode({ STRIPE_MANAGED_PAYMENTS_LIVE_ENABLED: true, STRIPE_SECRET_KEY: key }), /LIVE_KEY_REQUIRED/);
}
for (const key of ['sk_live_placeholder', 'rk_live_placeholder']) {
  assert.equal(managedPaymentsMode({ STRIPE_MANAGED_PAYMENTS_LIVE_ENABLED: true, STRIPE_SECRET_KEY: key }), 'live');
  assert.equal(managedPaymentsTestEnabled({ STRIPE_MANAGED_PAYMENTS_LIVE_ENABLED: true, STRIPE_SECRET_KEY: key }), false);
}
assert.equal(isManagedCheckout({ managed_payments: { enabled: true } }), true);
for (const checkout of [null, {}, { managed_payments: { enabled: 'true' } }, { metadata: { managed_payments: 'true' } }]) {
  assert.equal(isManagedCheckout(checkout), false);
}
for (const mode of ['live', 'test']) {
  const checkout = { object: 'checkout.session', livemode: mode === 'live', managed_payments: { enabled: true } };
  validateManagedCheckout(checkout, mode);
  for (const change of [{ object: 'payment_intent' }, { livemode: mode !== 'live' }, { managed_payments: null }, { managed_payments: { enabled: false } }]) {
    assert.throws(() => validateManagedCheckout({ ...checkout, ...change }, mode), /CHECKOUT_INVALID/);
  }
}
for (const amount of [799, 999]) {
  const offer = { unitAmount: amount, currency: 'USD' };
  const price = { active: true, livemode: false, type: 'one_time', unit_amount: amount, currency: 'usd', tax_behavior: 'inclusive', product: { active: true, tax_code: 'txcd_10503000' } };
  validateManagedTestPrice(price, offer);
  validateManagedPrice({ ...price, livemode: true }, offer, 'live');
  assert.throws(() => validateManagedPrice(price, offer, 'live'), /LIVE_PRICE_INVALID/);
  assert.throws(() => validateManagedPrice(price, offer, null), /MODE_REQUIRED/);
  for (const change of [{ livemode: true }, { active: false }, { type: 'recurring' }, { unit_amount: 1 }, { currency: 'huf' }, { tax_behavior: 'exclusive' }, { product: 'prod_unexpanded' }, { product: { active: true, tax_code: 'txcd_20030000' } }]) {
    assert.throws(() => validateManagedTestPrice({ ...price, ...change }, offer), /TEST_PRICE_INVALID/);
  }
}
console.log('Managed Payments modes: keys isolated; both prices, tax behavior and product evidence checked.');

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/unused_managed_test', DATABASE_SSL_MODE: 'disable',
  OPENAI_API_KEY: 'fixture', STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  RESEND_API_KEY: 're_fixture', EMAIL_FROM: 'fixture@example.invalid', APP_URL: 'https://example.invalid',
  SUCCESS_URL: 'https://example.invalid/success', CANCEL_URL: 'https://example.invalid/cancel',
  STRIPE_MANAGED_PAYMENTS_TEST_ENABLED: 'true', STRIPE_PRICE_STANDARD_USD: 'price_standard_fixture',
  STRIPE_PRICE_PLUS_USD: 'price_plus_fixture'
});
const { default: Stripe } = await import('stripe');
const client = new Stripe('sk_test_fixture');
let calls = 0;
let requestMode = 'test';
Object.getPrototypeOf(client.prices).retrieve = async id => ({
  active: true, livemode: requestMode === 'live', type: 'one_time', unit_amount: id === 'price_plus_fixture' ? 999 : 799,
  currency: 'usd', tax_behavior: 'inclusive', product: { active: true, tax_code: 'txcd_10503000' }
});
Object.getPrototypeOf(client.checkout.sessions).create = async (params, options) => {
  calls++;
  assert.equal(params.managed_payments.enabled, true);
  for (const key of ['tax_id_collection', 'payment_method_types', 'invoice_creation', 'automatic_tax', 'adaptive_pricing']) {
    assert.equal(Object.hasOwn(params, key), false, `${key} must not leak into Managed Payments`);
  }
  assert.equal(options.apiVersion, '2025-03-31.basil');
  assert.ok(options.idempotencyKey.endsWith(`-managed-${requestMode}`));
  assert.equal(params.mode, 'payment');
  assert.equal(params.line_items[0].quantity, 1);
  return { id: 'cs_test_managed_fixture', object: 'checkout.session', livemode: requestMode === 'live', managed_payments: { enabled: true } };
};
const { createCheckoutSession, retrieveCheckoutSession, listCheckoutSessions } = await import('../src/services/stripe.service.js');
const { env } = await import('../src/config/env.js');
for (const code of ['standard_v1', 'plus_v1']) {
  await createCheckoutSession({ internalSessionId: 'fixture-session', email: 'fixture@example.invalid', lang: 'hu', productPackage: code });
}
assert.equal(calls, 2);
let readCalls = 0;
Object.getPrototypeOf(client.checkout.sessions).retrieve = async (id, params, options) => {
  assert.equal(id, 'cs_test_managed_fixture');
  assert.equal(options.apiVersion, '2025-03-31.basil');
  readCalls++;
  return { id, managed_payments: { enabled: true } };
};
Object.getPrototypeOf(client.checkout.sessions).list = async (params, options) => {
  assert.equal(params.limit, 100);
  assert.equal(options.apiVersion, '2025-03-31.basil');
  readCalls++;
  return { data: [{ id: 'cs_test_managed_fixture', managed_payments: { enabled: true } }] };
};
assert.equal(isManagedCheckout(await retrieveCheckoutSession('cs_test_managed_fixture')), true);
assert.equal(isManagedCheckout((await listCheckoutSessions({})).data[0]), true);
assert.equal(readCalls, 2);
env.STRIPE_SECRET_KEY = 'sk_live_fixture';
await assert.rejects(createCheckoutSession({ internalSessionId: 'fixture-session', email: 'fixture@example.invalid', productPackage: 'standard_v1' }), /TEST_KEY_REQUIRED/);
assert.equal(calls, 2, 'Live attempt must stop before creating a Checkout');
assert.throws(() => retrieveCheckoutSession('cs_live_fixture'), /TEST_KEY_REQUIRED/);
assert.equal(readCalls, 2, 'Live credentials must stop sandbox recovery reads');
console.log('Managed Checkout request contract passed for both packages; no external requests made.');

env.STRIPE_MANAGED_PAYMENTS_TEST_ENABLED = false;
env.STRIPE_MANAGED_PAYMENTS_LIVE_ENABLED = true;
requestMode = 'live';
for (const code of ['standard_v1', 'plus_v1']) {
  await createCheckoutSession({ internalSessionId: 'live-fixture-session', email: 'fixture@example.invalid', productPackage: code });
}
assert.equal(calls, 4, 'Both live packages use the managed request contract');
requestMode = 'test';
await assert.rejects(createCheckoutSession({ internalSessionId: 'fixture-session', email: 'fixture@example.invalid', productPackage: 'standard_v1' }), /LIVE_PRICE_INVALID/);
assert.equal(calls, 4, 'Test prices cannot leak into a live Checkout');
env.STRIPE_PRICE_STANDARD_USD = null;
await assert.rejects(createCheckoutSession({ internalSessionId: 'fixture-session', email: 'fixture@example.invalid', productPackage: 'standard_v1' }), /PRICE_REQUIRED/);
assert.equal(calls, 4, 'Missing managed price cannot fall back to inline ordinary Checkout');
env.STRIPE_SECRET_KEY = 'sk_test_fixture';
await assert.rejects(createCheckoutSession({ internalSessionId: 'fixture-session', email: 'fixture@example.invalid', productPackage: 'plus_v1' }), /LIVE_KEY_REQUIRED/);
console.log('Live adapter regression checks passed with mocked providers; no live charge created.');

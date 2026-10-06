import assert from 'node:assert/strict';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/never_connect_sandbox_test', DATABASE_SSL_MODE: 'disable',
  OPENAI_API_KEY: 'fixture', STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  RESEND_API_KEY: 're_fixture', EMAIL_FROM: 'fixture@example.invalid', APP_URL: 'https://example.invalid',
  SUCCESS_URL: 'https://example.invalid/success', CANCEL_URL: 'https://example.invalid/cancel',
  ADMIN_TOKEN: 'a'.repeat(64), ADMIN_COOKIE_SECURE: 'false', PRODUCTION_CHECKOUT_ENABLED: 'false',
  INVOICE_AUTO_CREATE: 'false', STRIPE_MANAGED_PAYMENTS_TEST_ENABLED: 'true',
  SANDBOX_OPERATOR_CHECKOUT_ENABLED: 'true', SANDBOX_EMAIL_ALLOWLIST: 'fixture@example.invalid',
  RAILWAY_PROJECT_ID: '3bf10cac-c752-4e28-8a23-eb74f501a3e7',
  RAILWAY_ENVIRONMENT_ID: '4799561b-655d-463a-8331-49621c18c9ee'
});
const { env } = await import('../src/config/env.js');
const { sandboxCheckoutEnabled, assertSandboxCheckout } = await import('../src/services/sandbox-checkout-policy.js');
const { getLaunchGateStatus, LaunchGateError } = await import('../src/services/launch-gate.service.js');
const { db } = await import('../src/db/db.js');
const pg = new PGlite({ extensions: { pgcrypto } });
db.query = async (sql, params) => {
  const result = params?.length ? await pg.query(sql, params) : (await pg.exec(sql)).at(-1) || { rows: [] };
  return { ...result, rowCount: Math.max(result.affectedRows || 0, result.rows?.length || 0) };
};
db.connect = async () => ({ query: db.query, release() {} });
const { runMigrations } = await import('../src/db/migrate.js');
const { adminLogin, adminAuth, adminLogout } = await import('../src/middleware/adminAuth.js');
const { createCheckout, createSandboxCheckout, checkoutAvailability } = await import('../src/api/controllers/checkout.controller.js');
const { securityHeaders } = await import('../src/middleware/security.js');
const { default: returnRoutes } = await import('../src/api/routes/sandbox-return.js');
const { adminAlertPrefix } = await import('../src/services/admin-alert.service.js');

let server;
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('PASS', name); }
try {
  await runMigrations();
  await test('sandbox alert subjects distinguish test monitoring from production', () => {
    assert.equal(adminAlertPrefix(env), '[NeuroMap sandbox]');
    assert.equal(adminAlertPrefix({...env, STRIPE_MANAGED_PAYMENTS_TEST_ENABLED:false}), '[NeuroMap]');
    assert.equal(adminAlertPrefix({...env, STRIPE_SECRET_KEY:'sk_live_fixture'}), '[NeuroMap]');
  });
  await test('sandbox flag does not alter public launch readiness', () => {
    assert.ok(sandboxCheckoutEnabled(env));
    assert.ok(getLaunchGateStatus(env).blocking);
    assertSandboxCheckout(env, { id: 'synthetic-admin' }, 'fixture@example.invalid');
  });
  for (const [key, value] of Object.entries({
    SANDBOX_OPERATOR_CHECKOUT_ENABLED: false, STRIPE_MANAGED_PAYMENTS_TEST_ENABLED: false,
    PRODUCTION_CHECKOUT_ENABLED: true, INVOICE_AUTO_CREATE: 'true',
    RAILWAY_PROJECT_ID: 'different-project', RAILWAY_ENVIRONMENT_ID: '2ba9e0f9-ecc3-4139-9bbf-34cce15ffc4b',
    STRIPE_SECRET_KEY: 'sk_live_fixture', SANDBOX_EMAIL_ALLOWLIST: '*'
  })) {
    await test(`sandbox rejects unsafe ${key}`, () => {
      assert.throws(() => assertSandboxCheckout({ ...env, [key]: value }, { id: 'synthetic-admin' }, 'fixture@example.invalid'), LaunchGateError);
    });
  }
  await test('sandbox requires a cookie-bound admin session and exact recipient', () => {
    assert.throws(() => assertSandboxCheckout(env, null, 'fixture@example.invalid'), LaunchGateError);
    assert.throws(() => assertSandboxCheckout(env, {id:'synthetic-admin'}, 'other@example.invalid'), LaunchGateError);
  });
  const app = express();
  app.use(securityHeaders, express.json());
  app.post('/admin/login', adminLogin);
  app.post('/admin/logout', adminLogout);
  app.post('/admin/sandbox/checkout', adminAuth, createSandboxCheckout);
  app.post('/checkout', createCheckout);
  app.get('/checkout/availability', checkoutAvailability);
  app.use(returnRoutes);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'content-type':'application/json', ...headers }, body:JSON.stringify(body) });
  await test('public checkout stays closed even with injected sandbox flags', async () => {
    assert.equal((await post('/checkout', {sandbox:true,email:'fixture@example.invalid',adminSession:{id:'forged'}})).status, 503);
    assert.equal((await (await fetch(base + '/checkout/availability')).json()).available, false);
  });
  await test('unauthenticated operator request is denied', async () => {
    const res = await post('/admin/sandbox/checkout', {email:'fixture@example.invalid',adminSession:{id:'forged'}});
    assert.equal(res.status, 401);
    assert.match(res.headers.get('cache-control'), /no-store/);
  });
  const login = await post('/admin/login', {adminToken:process.env.ADMIN_TOKEN});
  assert.equal(login.status, 200);
  const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const { csrfToken } = await login.json();
  await test('authenticated operator requests still require CSRF', async () => {
    assert.equal((await post('/admin/sandbox/checkout', {email:'fixture@example.invalid'}, {cookie})).status, 403);
    assert.equal((await post('/admin/sandbox/checkout', {email:'fixture@example.invalid'}, {cookie,'x-admin-csrf':'wrong'})).status, 403);
  });
  await test('authorized sandbox request retains normal payload validation', async () => {
    const res = await post('/admin/sandbox/checkout', {email:'fixture@example.invalid'}, {cookie,'x-admin-csrf':csrfToken});
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, 'INVALID_CHECKOUT_PAYLOAD');
    assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM sessions')).rows[0].n, 0);
  });
  await test('authorized sandbox request cannot target an arbitrary email', async () => {
    assert.equal((await post('/admin/sandbox/checkout', {email:'other@example.invalid'}, {cookie,'x-admin-csrf':csrfToken})).status, 503);
  });
  await test('all return locales use same-origin status, no trackers or private credentials', async () => {
    for (const lang of ['hu','en','de','it','es','zh','ja','ar','pl','pt','fr']) {
      for (const kind of ['success','cancel']) {
        const res = await fetch(`${base}/${lang}-checkout-${kind}`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('cache-control'), /no-store/);
        assert.match(res.headers.get('content-security-policy'), /connect-src 'self'/);
        const html = await res.text();
        assert.ok(html.includes('API_BASE_URL:window.location.origin'));
        assert.ok(html.includes('/public/webflow/checkout-pages.js'));
        assert.ok(!/googletagmanager|facebook|tiktok|ADMIN_TOKEN|sk_test_/.test(html));
        assert.ok(!html.includes('neuromap-backend-production'));
      }
    }
  });
  await test('return routes disappear when operator rehearsal is disabled', async () => {
    env.SANDBOX_OPERATOR_CHECKOUT_ENABLED = false;
    assert.equal((await fetch(base + '/hu-checkout-success')).status, 404);
    env.SANDBOX_OPERATOR_CHECKOUT_ENABLED = true;
  });
  await test('logout revokes operator access', async () => {
    await post('/admin/logout', {}, {cookie});
    assert.equal((await post('/admin/sandbox/checkout', {email:'fixture@example.invalid'}, {cookie,'x-admin-csrf':csrfToken})).status, 401);
  });
  console.log(`Sandbox operator tests passed: ${passed}. No external provider calls.`);
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await pg.close();
}

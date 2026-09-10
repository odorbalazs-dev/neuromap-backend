const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const { getAdminDashboard } = await import('../src/api/controllers/admin-dashboard.controller.js');
  let html;
  getAdminDashboard({}, { setHeader() {}, type() { return this; }, status() { return this; }, send(value) { html = value; } });
  const script = fs.readFileSync('public/admin-dashboard.js', 'utf8').replace('  init();',
    '  window.renderPaymentReviewsFixture = renderPaymentReviews;\n  init();');
  const css = fs.readFileSync('public/admin-dashboard.css', 'utf8');
  const output = path.resolve('work/payment-audit-2026-09-10/browser');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  try {
    for (const width of [390, 1365]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [], submissions = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', async route => {
        const req = route.request(), url = new URL(req.url());
        if (url.hostname !== 'fixture.invalid') return route.abort();
        if (url.pathname === '/public/admin-dashboard.js') return route.fulfill({ contentType: 'text/javascript', body: script });
        if (url.pathname === '/public/admin-dashboard.css') return route.fulfill({ contentType: 'text/css', body: css });
        if (url.pathname.endsWith('/resolve')) {
          submissions.push({ body: req.postDataJSON(), csrf: req.headers()['x-admin-csrf'] });
          return route.fulfill({ json: { ok: true } });
        }
        if (url.pathname === '/admin/dashboard') return route.fulfill({ contentType: 'text/html', body: html });
        return route.fulfill({ json: { ok: true, reviews: [], items: [], counts: {}, checks: [] } });
      });
      await page.goto('https://fixture.invalid/admin/dashboard');
      await page.evaluate(() => {
        sessionStorage.setItem('nm_admin_csrf', 'synthetic-csrf');
        window.renderPaymentReviewsFixture({ ok: true, reviews: [{ id: '00000000-0000-4000-8000-000000000001',
          session_id: '00000000-0000-4000-8000-000000000002', reason: '<img src=x onerror=alert(1)>',
          amount: 999, currency: 'usd', created_at: '2026-09-10T12:00:00Z' }] });
      });
      const panel = page.locator('#paymentReviewPanel');
      await panel.scrollIntoViewIfNeeded();
      assert.equal(await panel.locator('img').count(), 0, 'Review text must not become HTML');
      await panel.locator('summary').click();
      await panel.locator('button[type="submit"]').click();
      assert.equal(submissions.length, 0, 'Missing evidence must prevent submission');
      await panel.locator('textarea').fill('Synthetic verified provider evidence reference FIXTURE-123');
      await panel.locator('input[type="checkbox"]').check();
      await panel.screenshot({ path: path.join(output, `admin-review-${width}.png`) });
      await panel.locator('button[type="submit"]').click();
      await page.waitForFunction(() => document.getElementById('statusText').textContent.includes('rögzítve'));
      assert.equal(submissions.length, 1);
      assert.equal(submissions[0].csrf, 'synthetic-csrf');
      assert.equal(submissions[0].body.verified, true);
      assert.equal(errors.length, 0, errors.join('\n'));
      await page.close();
    }
    console.log(JSON.stringify({ adminViewports: 2, evidenceValidation: true, csrf: true, safeText: true, externalRequests: 0 }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

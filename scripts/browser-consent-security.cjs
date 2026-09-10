const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/unused_browser_fixture',
  OPENAI_API_KEY: 'test', STRIPE_SECRET_KEY: 'sk_test_placeholder', RESEND_API_KEY: 're_test',
  STRIPE_WEBHOOK_SECRET: 'whsec_test', EMAIL_FROM: 'test@example.invalid', APP_URL: 'https://example.invalid',
  SUCCESS_URL: 'https://example.invalid/success', CANCEL_URL: 'https://example.invalid/cancel' });

(async () => {
  const { getPublicLegalConfiguration } = await import('../src/services/consent.service.js');
  const config = getPublicLegalConfiguration();
  const legalScript = fs.readFileSync('public/webflow/legal-consent.js', 'utf8');
  const contentScript = fs.readFileSync('public/webflow/legal-content.js', 'utf8');
  const output = path.resolve('output/security-remediation-2026-09-09');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const results = [];
  try {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 360, height: 640 }]) {
      for (const language of config.supportedLanguages) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const posts = [], unexpected = [], errors = [];
        let forceStale = language === 'hu', configReads = 0;
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.hostname !== '127.0.0.1') { unexpected.push(url.origin); return route.abort(); }
          if (url.pathname === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="start">Start</button><script>window.NM_CONFIG={API_BASE_URL:location.origin};localStorage.setItem('nm_analytics_consent_v1',JSON.stringify({version:'20260909-consent-security-v2',granted:true}));</script><script src="/public/webflow/legal-content.js"></script><script src="/public/webflow/legal-consent.js"></script></body></html>` });
          if (url.pathname === '/public/webflow/legal-consent.js') return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: legalScript });
          if (url.pathname === '/public/webflow/legal-content.js') return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: contentScript });
          if (url.pathname === '/legal/config') { configReads++; return route.fulfill({ json: { ok: true, ...config } }); }
          if (url.pathname === '/legal/consent' && route.request().method() === 'POST') {
            const input = route.request().postDataJSON(); posts.push(input);
            if (forceStale) { forceStale = false; return route.fulfill({ status: 409, json: { ok: false, code: 'CONSENT_POLICY_CHANGED' } }); }
            return route.fulfill({ json: { ok: true, receipt: { id: 'synthetic', token: 'synthetic-not-a-real-token' } } });
          }
          unexpected.push(url.pathname); return route.abort();
        });
        await page.goto('http://127.0.0.1:47123/');
        assert.equal(await page.evaluate(() => window.NM_LEGAL.isAnalyticsAllowed()), false);
        await page.evaluate(lang => {
          window.legalDone = false;
          window.NM_LEGAL.ensureConsent(lang).then(() => { window.legalDone = true; }).catch(error => { window.legalFailure = error.message; });
        }, language);
        await page.waitForFunction(() => document.getElementById('nmLegalOverlay') || window.legalFailure);
        assert.equal(await page.evaluate(() => window.legalFailure), undefined, `${language}: initial legal dialog failed`);
        const acceptStep = async isTerms => {
          const overlay = page.locator('#nmLegalOverlay');
          await overlay.locator('.nm-legal-step').filter({ hasText: isTerms ? '1 / 2' : '2 / 2' }).waitFor();
          await overlay.locator('.nm-legal-scroll').evaluate(el => { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event('scroll')); });
          if (isTerms) await overlay.locator('[value="parent_or_legal_guardian"]').check();
          for (const check of await overlay.locator('[data-required]').all()) await check.check();
          if (!isTerms) await overlay.locator('#nmAnalyticsConsent').check();
          const primary = overlay.locator('.nm-legal-button.primary');
          const bounds = await primary.boundingBox();
          assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1, 'Consent action stays inside viewport');
          if (!isTerms && language === 'hu') await page.screenshot({ path: path.join(output, `privacy-${viewport.width}.png`) });
          await primary.click();
        };
        await acceptStep(true); await acceptStep(false);
        if (language === 'hu') {
          await page.locator('#nmLegalOverlay .nm-legal-scroll [role="status"]').waitFor();
          assert.equal(await page.locator('#nmLegalOverlay [data-required]:checked').count(), 0);
          assert.equal(await page.evaluate(() => window.NM_LEGAL.isAnalyticsAllowed()), false);
          await acceptStep(true); await acceptStep(false);
          assert.equal(configReads, 2);
        }
        await page.waitForFunction(() => window.legalDone || window.legalFailure);
        assert.equal(await page.evaluate(() => window.legalFailure), undefined);
        assert.equal(await page.evaluate(() => window.NM_LEGAL.isAnalyticsAllowed()), true);
        for (const input of posts) {
          assert.equal(input.documentDigest, config.documentDigests[language]);
          assert.equal(input.configurationDigest, config.configurationDigest);
          assert.equal(input.privacyPolicyVersion, config.privacyPolicyVersion);
          assert.equal(input.language, language);
        }
        assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
        results.push({ language, viewport, receipts: posts.length, staleReset: language === 'hu', passed: true });
        await context.close();
      }
    }
    fs.writeFileSync(path.join(output, 'browser-consent-results.json'), JSON.stringify({ scope: 'Local browser; mocked endpoints only', results }, null, 2));
    console.log(`Browser consent security passed: ${results.length} flows; stale-document restart, visible mobile controls, no preconsent analytics grant.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

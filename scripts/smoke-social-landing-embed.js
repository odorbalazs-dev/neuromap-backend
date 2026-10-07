import assert from 'node:assert/strict';
import fs from 'node:fs';

const markup = fs.readFileSync('web/social-landing-embed.html', 'utf8');
const engine = fs.readFileSync('public/webflow/engine.js', 'utf8');
const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);

assert.equal(new Set(ids).size, ids.length, 'Landing IDs must be unique');
for (const id of [
  'nmSocialLanding', 'nmAlert', 'nmOpenLangBtn', 'questionnaireStart', 'nmApp',
  'brandTitle', 'langSwitch', 'pageTitle', 'pageIntro', 'identitySection',
  'labelName', 'name', 'labelEmail', 'email', 'progressBarWrap', 'progressLabel',
  'progressText', 'progressBar', 'triageSection', 'specificSection',
  'summarySection', 'checkoutStatus', 'backBtn', 'nextBtn', 'paymentBtn'
]) {
  assert(ids.includes(id), `Required engine mount missing: ${id}`);
}
assert(!/<script\b/i.test(markup), 'Only the separate Engine embed may load runtime code');
assert(!/\bon(?:click|change|load)\s*=/i.test(markup), 'Markup must not bind legacy event handlers');
assert(!/nmDisclaimer|nm_disclaimer_accepted|nmTrack|dataLayer|\$5/.test(markup), 'Legacy consent, tracking or prices remain');
assert(!ids.includes('languageModal') && !ids.includes('langButtons'), 'The engine must own the responsive language dialog');
assert(markup.includes('id="nmApp"') && markup.includes('style="display:none;'), 'Questionnaire must not be visible before the engine gate');
assert(markup.length < 50000, 'Webflow embed character limit exceeded');
assert.equal((markup.match(/class="nm-btn nm-start-btn"/g) || []).length, 3);
assert(engine.includes('function ensureLanguageModal()'));
assert(engine.includes('function bindLanguageSwitchers()'));
assert(engine.includes('function ensureLandingStartHandlers()'));
assert(engine.includes('await legalManager.installLauncher(state.lang)'));
console.log('Social landing embed contract passed: engine-owned language, consent, prices and start flow; no legacy script or duplicate IDs.');

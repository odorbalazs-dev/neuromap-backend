import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/webflow/engine.js', 'utf8');
function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert(from >= 0 && to > from, `Missing engine section: ${start}`);
  return source.slice(from, to);
}

const listeners = [];
const button = { dataset: {}, addEventListener(type, callback, capture) {
  listeners.push({ type, callback, capture });
} };
let starts = 0;
const binding = vm.createContext({
  document: { querySelectorAll: () => [button] },
  showQuestionnaireFromLanding: async () => { starts += 1; }
});
vm.runInContext(section('  function ensureLandingStartHandlers()', '  function getQuestionMark('), binding);
vm.runInContext('ensureLandingStartHandlers(); ensureLandingStartHandlers();', binding);
assert.equal(listeners.length, 1, 'Re-render must not bind duplicate handlers');
assert.equal(listeners[0].capture, true, 'Engine must run before legacy target/bubble handlers');
const event = { prevented: false, stopped: false,
  preventDefault() { this.prevented = true; },
  stopImmediatePropagation() { this.stopped = true; }
};
listeners[0].callback(event);
assert.equal(event.prevented, true);
assert.equal(event.stopped, true);
assert.equal(starts, 1);

const startFunction = section('  async function showQuestionnaireFromLanding()', '  function ensureLandingStartHandlers()');
async function checkStart({ language = true, available = true, consentError = null }) {
  let formAccesses = 0;
  let consentChecks = 0;
  const sandbox = vm.createContext({
    hasConfirmedLanguage: () => language,
    showModal() {},
    checkCheckoutAvailability: async () => available,
    getCheckoutMaintenanceCopy: () => 'Unavailable',
    alert() {},
    ensureLegalConsentForCurrentLanguage: async () => { consentChecks += 1; if (consentError) throw consentError; },
    console: { error() {} },
    setStatus() {},
    getLegalStartErrorMessage: () => 'Consent required',
    document: { getElementById() { formAccesses += 1; throw new Error('Must not open form'); } }
  });
  vm.runInContext(startFunction, sandbox);
  const result = await vm.runInContext('showQuestionnaireFromLanding()', sandbox);
  assert.equal(result, false);
  assert.equal(formAccesses, 0, 'Closed gate must not reveal form');
  return consentChecks;
}
assert.equal(await checkStart({ language: false }), 0);
assert.equal(await checkStart({ available: false }), 0);
assert.equal(await checkStart({ consentError: { code: 'NM_LEGAL_CANCELLED' } }), 1);
assert.equal(await checkStart({ consentError: new Error('Receipt failed') }), 1);

const hero = { prepend(node) { this.notice = node; } };
const unavailableSandbox = vm.createContext({
  fetch: async () => ({ ok: true, json: async () => ({ available: false }) }),
  getApiBaseUrl: () => 'https://example.invalid',
  AbortSignal: { timeout: () => undefined },
  getCheckoutMaintenanceCopy: () => 'Unavailable',
  document: {
    getElementById: () => null,
    querySelector: () => hero,
    createElement: () => ({ style: {}, setAttribute() {} })
  }
});
vm.runInContext(section('  async function checkCheckoutAvailability()', '  async function showQuestionnaireFromLanding()'), unavailableSandbox);
assert.equal(await vm.runInContext('checkCheckoutAvailability()', unavailableSandbox), false);
assert.equal(hero.notice.textContent, 'Unavailable');
assert.equal(hero.notice.hidden, false);
const translatedNotice = { textContent: 'Unavailable', hidden: false };
const languageState = { lang: 'en' };
const legalNavigationLanguages = [];
const languageSandbox = vm.createContext({
  state: languageState,
  localStorage: { setItem() {} },
  getUI: () => ({}),
  getAgeUiText: () => ({}),
  getCheckoutMaintenanceCopy: () => `Unavailable-${languageState.lang}`,
  isCompatibleLegalManager: () => true,
  window: {NM_LEGAL: {installLauncher: lang => {legalNavigationLanguages.push(lang); return Promise.resolve();}}},
  document: { documentElement: {}, getElementById: id => id === 'nmCheckoutAvailability' ? translatedNotice : null },
  buildLangButtons() {}, syncLanguageButtonState() {}, ensureChildAgeField() {},
  updateChildAgeFieldLanguage() {}, renderCurrentStep() {}
});
vm.runInContext(section('  function applyLang(lang)', '  function updateQuestionProgress('), languageSandbox);
for (const lang of ['hu', 'en', 'de', 'it', 'es', 'fr', 'pt', 'pl', 'ja', 'zh', 'ar']) {
  vm.runInContext(`applyLang('${lang}')`, languageSandbox);
  assert.equal(translatedNotice.textContent, `Unavailable-${lang}`);
  assert.equal(translatedNotice.hidden, false, 'Language changes must not open a closed checkout');
  assert.equal(legalNavigationLanguages.at(-1), lang, 'Legal navigation must follow the selected language without consent or payment');
}
console.log('Landing start gate passed: legacy handlers intercepted, closed gates keep form hidden, visible maintenance notice (mocked DOM/I/O).');

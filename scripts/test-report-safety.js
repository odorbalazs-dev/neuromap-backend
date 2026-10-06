import assert from 'node:assert/strict';
import { getReportSafetyRequirements } from '../src/services/report-safety.service.js';
import { validateReportStructure } from '../src/services/report-contract.service.js';

const unsafeExamples = {
  hu: 'A gyermek nem mutat olyan viselkedésmintákat, amelyek nehézséget jeleznének.',
  en: 'The child does not show such behavioral patterns.',
  de: 'Das Kind zeigt keine solchen Verhaltensmuster.',
  it: 'Il bambino non mostra tali modelli comportamentali.',
  es: 'El niño no muestra tales patrones de comportamiento.',
  fr: "L'enfant ne présente pas de tels schémas comportementaux.",
  pt: 'A criança não apresenta tais padrões comportamentais.',
  pl: 'Dziecko nie wykazuje takich wzorców zachowania.',
  zh: '孩子没有表现出这样的行为模式。',
  ja: '子どもはそのような行動パターンを示していません。',
  ar: 'الطفل لا يُظهر مثل هذه الأنماط السلوكية.'
};

function report(body) {
  return Array.from({ length: 11 }, (_, i) => `${i + 1}. Section ${i + 1}\n\n${body.trim()}`).join('\n\n');
}
for (const [lang, unsafe] of Object.entries(unsafeExamples)) {
  const options = { prohibitedPatterns: getReportSafetyRequirements(lang) };
  const failed = validateReportStructure(report(unsafe), options);
  assert.equal(failed.ok, false, lang);
  assert.ok(failed.errors.some(error => error.includes('unsupported categorical conclusions')));
  assert.ok(!failed.errors.join().includes(unsafe), 'Logs must not quote personal report content');
  assert.equal(validateReportStructure(report('The answers give limited information; a difficulty cannot be ruled out.'), options).ok, true);
}
assert.equal(validateReportStructure(report('Az autizmus spektrumhoz kapcsolódó nehézségek jelenleg nem tűnnek relevánsnak.'), {
  prohibitedPatterns: getReportSafetyRequirements('hu')
}).ok, false);
assert.equal(validateReportStructure(report('A kérdőív válaszai kevés jelzést adnak ezen a területen. Ez nem zárja ki a nehézségeket.'), {
  prohibitedPatterns: getReportSafetyRequirements('hu')
}).ok, true);

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/unused_report_fixture', DATABASE_SSL_MODE: 'disable',
  OPENAI_API_KEY: 'fixture', STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  RESEND_API_KEY: 're_fixture', EMAIL_FROM: 'test@example.invalid', APP_URL: 'https://example.invalid',
  SUCCESS_URL: 'https://example.invalid/success', CANCEL_URL: 'https://example.invalid/cancel'
});
const safeBody = 'A szülői válaszok kevés jelzést adnak ezen a területen. A kérdőív nem zárja ki a nehézségeket; érdemes megfigyelni a hétköznapi helyzeteket. Ez nem diagnózis. '.repeat(4);
const drafts = [];
let calls = [];
globalThis.fetch = async (url, request) => {
  assert.equal(String(url), 'https://api.openai.com/v1/responses');
  const body = JSON.parse(request.body);
  assert.equal(body.store, false);
  assert.ok(body.input.includes('Low, zero, missing, or weak questionnaire signals do not prove'));
  calls.push(body.input);
  assert.ok(drafts.length, 'Unexpected external request');
  return new Response(JSON.stringify({
    id: 'synthetic-response', output: [{ type: 'message', role: 'assistant',
      content: [{ type: 'output_text', text: drafts.shift(), annotations: [] }] }]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};
// The installed SDK otherwise uses node-fetch instead of the mocked web transport.
await import('openai/shims/web');
const { generateAnalysis } = await import('../src/services/analysis.service.js');
const unsafeReport = report(`${unsafeExamples.hu} ${safeBody}`);
const safeReport = report(safeBody);
drafts.push(unsafeReport, safeReport);
assert.equal(await generateAnalysis({ lang: 'hu' }), safeReport);
assert.equal(calls.length, 2, 'Unsafe draft must be rewritten, not sent');
assert.ok(calls[1].includes('unsupported categorical conclusions'));
assert.ok(!calls[1].includes(unsafeExamples.hu), 'Retry must not repeat the unsafe personal draft');
calls = [];
drafts.push(unsafeReport, unsafeReport);
await assert.rejects(generateAnalysis({ lang: 'hu' }), { code: 'REPORT_CONTRACT_INVALID' });
assert.equal(calls.length, 2, 'Retry budget must stay bounded');
console.log('PASS: 11-locale certainty regression guards, cautious wording, rewrite/fail-closed generation; no external requests');

import assert from 'node:assert/strict';
import { legalContent, documentDigest } from '../src/services/legal-document.service.js';
import { buildContractEvidence } from '../src/services/contract-evidence.service.js';
import { buildContractConfirmationEmail } from '../src/templates/contractConfirmationEmail.js';

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/unused_contract_fixture', DATABASE_SSL_MODE: 'disable',
  OPENAI_API_KEY: 'fixture', STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  RESEND_API_KEY: 're_fixture', EMAIL_FROM: 'test@example.invalid', APP_URL: 'https://example.invalid',
  SUCCESS_URL: 'https://example.invalid/success', CANCEL_URL: 'https://example.invalid/cancel'
});
let sent = [];
globalThis.fetch = async (url, request) => {
  assert.equal(String(url), 'https://api.resend.com/emails');
  sent.push(JSON.parse(request.body));
  return new Response(JSON.stringify({ id: 'synthetic-mail-id' }), { status: 200, headers: { 'content-type': 'application/json' } });
};
function fixture(lang) {
  const configuration = { configurationDigest: 'accepted-config', documentDigests: { [lang]: documentDigest(legalContent[lang]) },
    termsVersion: 'accepted-terms', privacyPolicyVersion: 'accepted-privacy', consentPolicyVersion: 'accepted-consent',
    controller: { name: '<script>invalid</script>', address: 'Fixture', privacyEmail: 'privacy@example.invalid' },
    termsUrl: 'https://example.invalid/terms', privacyPolicyUrl: 'https://example.invalid/privacy' };
  const revision = { revision_id: documentDigest([configuration.configurationDigest, configuration.documentDigests[lang], lang]),
    language: lang, configuration, content: legalContent[lang] };
  const session = { id: 'synthetic-session', email: 'customer@example.invalid', lang, name: 'Synthetic',
    package_code: 'standard_v1', amount_total: 799, currency: 'usd', paid_at: '2026-09-30T12:00:00Z',
    contract_confirmation_attempts: 1, payload: { health: 'must-not-be-exported' },
    consent_record: { documentRevisionId: revision.revision_id, language: lang, termsVersion: configuration.termsVersion,
      privacyPolicyVersion: configuration.privacyPolicyVersion, consentPolicyVersion: configuration.consentPolicyVersion,
      consentedAt: '2026-09-30T11:00:00Z', purchaseConfirmedAt: '2026-09-30T11:59:00Z',
      digitalPerformanceRequested: true, withdrawalRightAcknowledged: true } };
  return { session, revision };
}
for (const lang of Object.keys(legalContent)) {
  const { session, revision } = fixture(lang);
  const result = buildContractEvidence(session, revision);
  const html = Buffer.from(result.attachments[0].content, 'base64').toString();
  assert.ok(html.includes(`lang="${lang}"`));
  assert.ok(html.includes(lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"'));
  assert.ok(html.includes('&lt;script&gt;invalid&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.equal(result.attachments.length, 2);
  assert.ok(!JSON.stringify(result).includes('must-not-be-exported'));
  const mail = buildContractConfirmationEmail({ lang, name: 'Synthetic', sessionId: session.id,
    packageCode: session.package_code, amountTotal: session.amount_total, currency: session.currency,
    paidAt: session.paid_at, performanceText: result.performanceText });
  assert.ok(mail.text.includes(result.performanceText));
  assert.ok(mail.html.includes(`lang="${lang}"`));
  assert.ok(!mail.text.includes('undefined'));
  assert.ok(mail.text.includes('(Europe/Budapest)'));
  assert.ok(mail.html.includes('(Europe/Budapest)'));
  assert.equal(JSON.parse(Buffer.from(result.attachments[1].content, 'base64')).purchaseConfirmedAt, session.consent_record.purchaseConfirmedAt);
  for (const change of [undefined, { ...revision, language: 'invalid' }, { ...revision, revision_id: 'wrong' },
    { ...revision, configuration: { ...revision.configuration, termsVersion: 'newer-policy' } }]) {
    assert.throws(() => buildContractEvidence(session, change), /CONTRACT_EVIDENCE_UNAVAILABLE/);
  }
  assert.throws(() => buildContractEvidence({ ...session, consent_record: { ...session.consent_record, digitalPerformanceRequested: false } }, revision));
  // JSONB changes key order; the archived digest is the receipt's stable identity.
  const reordered = Object.fromEntries(Object.entries(revision.content).reverse());
  assert.doesNotThrow(() => buildContractEvidence(session, { ...revision, content: reordered }));
}
for (const [paidAt, time] of [
  ['2026-10-06T08:59:00Z', '10:59'],
  ['2026-12-06T08:59:00Z', '09:59']
]) {
  const mail = buildContractConfirmationEmail({ lang: 'hu', paidAt });
  assert.ok(mail.text.includes(time), 'Purchase time must follow Budapest daylight saving time');
  assert.ok(mail.text.includes('(Europe/Budapest)'));
}
for (const paidAt of [undefined, 'invalid-date']) {
  const mail = buildContractConfirmationEmail({ lang: 'hu', paidAt });
  assert.ok(mail.text.includes('Vásárlás időpontja: -'), 'Never invent a missing purchase time');
}
const { db } = await import('../src/db/db.js');
const { env } = await import('../src/config/env.js');
const { sendContractConfirmationForSession } = await import('../src/services/contract-confirmation.service.js');
const { session, revision } = fixture('hu');
let archive = revision;
let updates = [];
db.query = async (sql, params) => {
  if (sql.includes('RETURNING *')) return { rows: [session] };
  if (sql.includes('legal_document_revisions')) return { rows: archive ? [archive] : [] };
  updates.push(params); return { rows: [] };
};
try {
  env.TERMS_VERSION = 'changed-after-purchase';
  const { renderLegalPage } = await import('../src/services/legal-pages.service.js');
  assert.ok(renderLegalPage('terms', 'hu').includes('changed-after-purchase'));
  assert.ok(!renderLegalPage('privacy', 'hu').includes('changed-after-purchase'));
  assert.equal((await sendContractConfirmationForSession(session.id)).status, 'sent');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].attachments.length, 2);
  assert.ok(sent[0].text.includes('accepted-terms'));
  assert.ok(!sent[0].text.includes('changed-after-purchase'));
  archive = null;
  assert.equal((await sendContractConfirmationForSession(session.id)).error, 'CONTRACT_EVIDENCE_UNAVAILABLE');
  assert.equal(sent.length, 1, 'Missing archives must not send invented acceptance');
  archive = revision;
  globalThis.fetch = async () => { throw new Error('secret=customer-sensitive-value'); };
  const failed = await sendContractConfirmationForSession(session.id);
  assert.equal(failed.error, 'CONTRACT_CONFIRMATION_SEND_FAILED');
  assert.ok(!JSON.stringify(updates).includes('customer-sensitive-value'));
  console.log('PASS: 11 locales, archived documents, version changes, missing evidence, sanitized errors; no external requests');
} finally { await db.close(); }

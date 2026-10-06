import { documentDigest } from './legal-document.service.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Never substitute today's policy for the document accepted by this purchaser.
export function buildContractEvidence(session, revision) {
  const receipt = session.consent_record;
  const config = revision?.configuration;
  const content = revision?.content;
  if (!receipt?.documentRevisionId || revision?.revision_id !== receipt.documentRevisionId ||
      revision.language !== receipt.language || !config || !content ||
      receipt.termsVersion !== config.termsVersion || receipt.privacyPolicyVersion !== config.privacyPolicyVersion ||
      receipt.consentPolicyVersion !== config.consentPolicyVersion ||
      documentDigest([config.configurationDigest, config.documentDigests?.[revision.language], revision.language]) !== revision.revision_id ||
      !Array.isArray(content.terms) || !Array.isArray(content.privacy) ||
      receipt.digitalPerformanceRequested !== true || receipt.withdrawalRightAcknowledged !== true) {
    throw new Error('CONTRACT_EVIDENCE_UNAVAILABLE');
  }
  const lang = revision.language;
  const sections = ['terms', 'privacy'].map(kind => `<section><h1>${escape(content.ui[`${kind}Title`])}</h1>${content[kind].map(([heading, text]) => `<h2>${escape(heading)}</h2><p>${escape(text)}</p>`).join('')}</section>`).join('');
  const controller = config.controller || {};
  const html = `<!doctype html><html lang="${escape(lang)}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NeuroMap Kids</title><style>body{max-width:800px;margin:auto;padding:24px;font:16px/1.6 Arial,sans-serif;overflow-wrap:anywhere}h1{font-size:24px}h2{font-size:18px}section{break-before:page}</style></head><body><header><h1>NeuroMap Kids</h1><p>${escape(controller.name)}<br>${escape(controller.address)}<br>${escape(controller.privacyEmail)}</p><p>${escape(config.termsVersion)} / ${escape(config.privacyPolicyVersion)}</p></header>${sections}</body></html>`;
  // Deliberately exclude answers, health inferences, receipt secrets and access tokens.
  const evidence = {
    schema: 'purchase-confirmation-v1', sessionId: session.id, packageCode: session.package_code,
    amountTotal: session.amount_total, currency: session.currency, paidAt: session.paid_at,
    documentRevisionId: revision.revision_id, language: lang,
    termsVersion: config.termsVersion, privacyPolicyVersion: config.privacyPolicyVersion,
    consentPolicyVersion: config.consentPolicyVersion, consentedAt: receipt.consentedAt,
    purchaseConfirmedAt: receipt.purchaseConfirmedAt || null,
    digitalPerformanceRequested: receipt.digitalPerformanceRequested,
    withdrawalRightAcknowledged: receipt.withdrawalRightAcknowledged
  };
  return { config, lang, performanceText: content.terms[6]?.[1], attachments: [
    { filename: `neuromap-legal-${lang}.html`, content: Buffer.from(html).toString('base64') },
    { filename: 'neuromap-purchase-receipt.json', content: Buffer.from(JSON.stringify(evidence, null, 2)).toString('base64') }
  ] };
}

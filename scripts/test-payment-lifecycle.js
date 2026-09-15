import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import Stripe from 'stripe';
import { Webhook } from 'svix';

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/never_connect_payment_test', DATABASE_SSL_MODE: 'disable',
  OPENAI_API_KEY: 'fixture', STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  RESEND_API_KEY: 're_fixture', EMAIL_FROM: 'fixture@example.invalid', APP_URL: 'https://example.invalid',
  SUCCESS_URL: 'https://example.invalid/success', CANCEL_URL: 'https://example.invalid/cancel',
  SZAMLAZZHU_AGENT_KEY: 'fixture', INVOICE_AUTO_CREATE: 'true'
});
process.env.RESEND_WEBHOOK_SECRET = 'whsec_' + Buffer.from('synthetic-delivery-secret-12345678').toString('base64');
const provider = new Map();
let creates = 0;
let loseNextResponse = false;
const stripePrototype = Object.getPrototypeOf(new Stripe('sk_test_fixture').checkout.sessions);
stripePrototype.create = async (params, options) => {
  assert.equal(params.invoice_creation?.enabled, false, 'Stripe must not issue a second invoice');
  if (provider.has(options.idempotencyKey)) return provider.get(options.idempotencyKey);
  creates += 1;
  const result = { id: 'cs_test_' + creates, object: 'checkout.session', status: 'open', payment_status: 'unpaid',
    url: 'https://checkout.stripe.com/test/' + creates, livemode: false, expires_at: Math.floor(Date.now()/1000)+3600,
    client_reference_id: params.client_reference_id, metadata: params.metadata, amount_total: 799, currency: 'usd' };
  provider.set(options.idempotencyKey,result); provider.set(result.id,result);
  if (loseNextResponse) { loseNextResponse=false; throw new Error('Synthetic lost provider response'); }
  return result;
};
stripePrototype.retrieve = async id => { if (!provider.has(id)) throw new Error('Unknown fixture Checkout'); return provider.get(id); };
stripePrototype.expire = async id => { const c=provider.get(id); c.status='expired'; return c; };
stripePrototype.list = async () => ({ data: [...new Map([...provider.values()].map(c=>[c.id,c])).values()], has_more:false });
globalThis.fetch = async () => { throw new Error('Network forbidden in payment tests'); };

const pg = new PGlite({ extensions: { pgcrypto } });
const { db } = await import('../src/db/db.js');
const query = async (sql, params) => {
  const result = params?.length ? await pg.query(sql,params) : (await pg.exec(sql)).at(-1) || { rows: [] };
  return { ...result, rowCount: Math.max(result.affectedRows || 0, result.rows?.length || 0) };
};
db.query = query;
db.connect = async () => ({ query, release() {} });
const { runMigrations } = await import('../src/db/migrate.js');
const { getPublicLegalConfiguration, createConsentReceipt, withdrawConsentReceipt } = await import('../src/services/consent.service.js');
const { createConsentedSession, withCheckoutConsent } = await import('../src/services/checkout-consent.service.js');
const { startOrResumePayment } = await import('../src/services/payment-attempt.service.js');
const { fulfillVerifiedCheckout } = await import('../src/services/payment-fulfillment.service.js');
const { discoverStripePayments } = await import('../src/services/payment-discovery.service.js');
const { synchronizePaymentAdjustment } = await import('../src/services/payment-adjustment.service.js');
const { receiveEmailDelivery, reconcileEmailDelivery } = await import('../src/services/email-delivery-webhook.service.js');
const { enqueueAnalysisJob } = await import('../src/services/analysis-queue.service.js');
const { getProductPackage } = await import('../src/config/products.js');
const { buildCustomerStatus } = await import('../src/api/controllers/session.controller.js');
const { createSzamlazzHuInvoice, findSzamlazzHuInvoice } = await import('../src/infrastructure/invoice/szamlazzhuClient.js');
const { createInvoiceForPaidSession } = await import('../src/services/invoice.service.js');

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('PASS', name); }
const config = getPublicLegalConfiguration();
const legal = { language:'hu',actorRole:'parent_or_legal_guardian',
  privacyPolicyVersion:config.privacyPolicyVersion,termsVersion:config.termsVersion,consentPolicyVersion:config.consentPolicyVersion,
  configurationDigest:config.configurationDigest,documentDigest:config.documentDigests.hu };
for (const key of ['adultConfirmation','guardianAuthority','termsAcknowledged','informationalPurposeAcknowledged',
  'privacyNoticeAcknowledged','specialCategoryExplicitConsent','aiTransparencyAcknowledged','termsScrollCompleted','privacyScrollCompleted']) legal[key]=true;
const confirmations = { digitalPerformanceRequested:true,withdrawalRightAcknowledged:true };
async function order() {
  const receipt = await createConsentReceipt(legal);
  const input = { email:'fixture@example.invalid',name:'Fixture',lang:'hu',payload:{ fixture:true },
    productPackage:getProductPackage('standard_v1'),resumeToken:randomBytes(32).toString('base64url') };
  const created=await createConsentedSession(input,receipt,confirmations);
  return { ...created, receipt,input };
}
const read = async id => (await query('SELECT * FROM sessions WHERE id=$1',[id])).rows[0];
const start = session => withCheckoutConsent(session.id,(locked,executor)=>startOrResumePayment(locked,session.publicAccessToken,executor));
try {
  await test('all migrations apply on isolated PostgreSQL',runMigrations);
  await test('migration replay is idempotent',runMigrations);
  const runtimeRole = process.argv.find(arg=>arg.startsWith('--runtime-role='))?.split('=')[1];
  if (runtimeRole) {
    assert.ok(['neuromap_web_runtime','neuromap_worker_runtime'].includes(runtimeRole));
    await pg.exec(await readFile(new URL('../ops/database/runtime-grants.sql',import.meta.url),'utf8'));
    await pg.exec(`SET SESSION AUTHORIZATION ${runtimeRole}`);
    const { verifyRuntimeDatabase } = await import('../src/db/startup.js');
    await test('least-privilege runtime schema verification',()=>verifyRuntimeDatabase());
  }
  const first = await order();
  await test('lost HTTP response resumes the same consent-bound order', async () => {
    const resumed=await createConsentedSession(first.input,first.receipt,confirmations);
    assert.equal(resumed.session.id,first.session.id);
    await assert.rejects(createConsentedSession({...first.input,name:'Changed'},first.receipt,confirmations),{code:'CHECKOUT_CONTENT_CHANGED'});
  });
  const checkout=await start(first.session);
  await test('retry reuses the existing open Checkout',async()=>{
    assert.equal((await start(first.session)).id,checkout.id); assert.equal(creates,1);
  });
  await test('expired Checkout gets a new attempt without deleting history',async()=>{
    const expired=await order(), previous=await start(expired.session);
    previous.status='expired'; const next=await start(expired.session);
    assert.notEqual(next.id,previous.id);
    assert.equal((await query('SELECT * FROM payment_attempts WHERE session_id=$1',[expired.session.id])).rowCount,2);
  });
  await test('provider discovery recovers a lost creation response without another charge',async()=>{
    const lost=await order();loseNextResponse=true;
    await assert.rejects(start(lost.session),/lost provider response/);
    assert.equal((await read(lost.session.id)).stripe_session_id,null);
    const before=creates;await discoverStripePayments();
    assert.ok((await read(lost.session.id)).stripe_session_id);assert.equal(creates,before);
    await withdrawConsentReceipt(lost.receipt);
    assert.equal(provider.get((await read(lost.session.id)).stripe_session_id).status,'expired');
  });
  await test('test/live mismatch and unknown checkout cannot fulfill',async()=>{
    await assert.rejects(fulfillVerifiedCheckout({...checkout,livemode:true,payment_status:'paid'}),/MODE_MISMATCH/);
    await assert.rejects(fulfillVerifiedCheckout({...checkout,id:'cs_test_unknown',payment_status:'paid'}),/CHECKOUT_MISMATCH/);
    assert.equal((await read(first.session.id)).payment_status,'pending');
  });
  await test('valid payment atomically queues one job and one contract outbox item',async()=>{
    checkout.payment_status='paid';checkout.status='complete';checkout.payment_intent='pi_fixture';
    await fulfillVerifiedCheckout(checkout);await fulfillVerifiedCheckout(checkout);
    assert.equal((await query('SELECT * FROM analysis_jobs WHERE session_id=$1',[first.session.id])).rowCount,1);
    assert.equal((await query('SELECT * FROM post_payment_outbox WHERE session_id=$1',[first.session.id])).rowCount,1);
    assert.equal((await read(first.session.id)).invoice_status,'skipped');
  });
  await test('active-job fallback SQL returns correct job',async()=>{
    const a=await enqueueAnalysisJob(first.session.id),b=await enqueueAnalysisJob(first.session.id);assert.equal(a.id,b.id);
  });
  await test('terminal analysis job cannot be automatically recreated',async()=>{
    await query("UPDATE analysis_jobs SET status='failed',attempts=4 WHERE session_id=$1",[first.session.id]);
    assert.equal(await enqueueAnalysisJob(first.session.id),null);
  });
  await test('manual analysis recovery requires payment and respects the total attempt budget',async()=>{
    const unpaid=await order();
    assert.equal(await enqueueAnalysisJob(unpaid.session.id, { manualRetry:true }),null);
    const manual=await enqueueAnalysisJob(first.session.id, { manualRetry:true });
    assert.ok(manual);
    await query("UPDATE analysis_jobs SET status='failed',attempts=8 WHERE id=$1",[manual.id]);
    assert.equal(await enqueueAnalysisJob(first.session.id, { manualRetry:true }),null);
  });
  await test('refund without livemode verifies charge and preserves financial restriction on replay',async()=>{
    const sdk=new Stripe('sk_test_fixture');
    const refund={id:'re_fixture',object:'refund',charge:'ch_fixture',payment_intent:'pi_fixture',status:'succeeded',amount:799,currency:'usd'};
    Object.getPrototypeOf(sdk.refunds).retrieve=async()=>refund;
    Object.getPrototypeOf(sdk.refunds).list=async()=>({data:[refund],has_more:false});
    Object.getPrototypeOf(sdk.charges).retrieve=async()=>({id:'ch_fixture',object:'charge',livemode:false,payment_intent:'pi_fixture',amount:799,currency:'usd'});
    const event={id:'evt_refund_fixture',type:'refund.updated',livemode:false,data:{object:refund}};
    await synchronizePaymentAdjustment(event);await synchronizePaymentAdjustment(event);
    assert.equal((await read(first.session.id)).financial_status,'refunded');
    await fulfillVerifiedCheckout(checkout);
    assert.equal((await read(first.session.id)).financial_status,'refunded');
    await assert.rejects(synchronizePaymentAdjustment({...event,livemode:true}),/MODE_MISMATCH/);
  });
  await test('signed delivery callbacks are idempotent and reordered delivery cannot clear a complaint',async()=>{
    await query('UPDATE sessions SET report_email_provider_id=$2 WHERE id=$1',[first.session.id,'email_fixture']);
    const response=()=>({statusCode:200,setHeader(){},status(c){this.statusCode=c;return this;},json(body){this.body=body;return this;}});
    async function deliver(type,id,valid=true){
      const date=new Date(),body=JSON.stringify({type,created_at:date.toISOString(),data:{email_id:'email_fixture'}});
      const headers={'svix-id':id,'svix-timestamp':String(Math.floor(date/1000)),
        'svix-signature':valid?new Webhook(process.env.RESEND_WEBHOOK_SECRET).sign(id,date,body):'invalid'};
      const res=response();await receiveEmailDelivery({body:Buffer.from(body),headers},res);return res;
    }
    assert.equal((await deliver('email.delivered','msg_bad',false)).statusCode,400);
    await deliver('email.complained','msg_complaint');await deliver('email.complained','msg_complaint');
    await deliver('email.delivered','msg_delivered');await reconcileEmailDelivery();
    assert.equal((await read(first.session.id)).report_email_delivery_status,'complained');
    assert.equal((await query('SELECT * FROM email_delivery_events')).rowCount,2);
  });
  await test('withdrawal expires the open provider Checkout and blocks retry',async()=>{
    const second=await order(), c=await start(second.session);
    await withdrawConsentReceipt(second.receipt);
    assert.equal(c.status,'expired');
    await assert.rejects(start(second.session),{code:'CONSENT_WITHDRAWN'});
    c.status='complete';c.payment_status='paid';
    const outcome=await fulfillVerifiedCheckout(c);assert.equal(outcome.reviewRequired,true);
    assert.equal((await query('SELECT * FROM analysis_jobs WHERE session_id=$1',[second.session.id])).rowCount,0);
  });
  await test('invoice and email failures remain visible after report completion',async()=>{
    const state=buildCustomerStatus({payment_status:'paid',analysis_status:'done',pdf_status:'ready',report_email_status:'sent',invoice_status:'failed'});
    assert.equal(state.overall,'attention');assert.equal(state.stages.find(s=>s.key==='invoice').state,'failed');
    const bounce=buildCustomerStatus({payment_status:'paid',analysis_status:'done',pdf_status:'ready',report_email_status:'sent',report_email_delivery_status:'bounced'});
    assert.equal(bounce.overall,'attention');
  });
  let xml='';
  const invoiceInput={session:first.session,checkoutSession:{...checkout,customer_details:{name:'Fixture',address:{country:'DE',postal_code:'10115',city:'Berlin',line1:'Fixture 1'},tax_ids:[{type:'eu_vat',value:'DE000000000'}]}},
    config:{agentKey:'fixture',endpoint:'https://invoice.example.invalid',invoiceLanguage:'de',vatRate:'AAM',paymentMethod:'Card',timeoutMs:1000},productName:'Fixture report',productComment:'Fixture'};
  await test('malformed or unidentified invoice response is rejected',async()=>{
    globalThis.fetch=async (_url,req)=>{xml=await req.body.get('action-xmlagentxmlfile').text();return new Response('<unexpected/>',{headers:{'content-type':'text/xml'}});};
    await assert.rejects(createSzamlazzHuInvoice(invoiceInput),/INVOICE_RESPONSE_UNVERIFIED/);
    for(const tag of ['orszag','adoszamEU','szamlaKulsoAzon','rendelesSzam','fizetve'])assert.ok(xml.includes('<'+tag+'>'));
    assert.ok(!xml.includes('<adoszam>DE'));assert.ok(!xml.includes('<szamlaLetoltesPld>'));
  });
  await test('provider lookup validates currency and amount',async()=>{
    globalThis.fetch=async()=>new Response('<szamla><alap><szamlaszam>FIXTURE-1</szamlaszam><devizanem>USD</devizanem><teszt>false</teszt></alap><osszegek><totalossz><brutto>7.99</brutto></totalossz></osszegek></szamla>');
    assert.equal((await findSzamlazzHuInvoice({config:invoiceInput.config,externalId:'fixture',expectedAmount:799,expectedCurrency:'usd'})).invoiceNumber,'FIXTURE-1');
    await assert.rejects(findSzamlazzHuInvoice({config:invoiceInput.config,externalId:'fixture',expectedAmount:999,expectedCurrency:'usd'}),/UNVERIFIED/);
  });
  await test('unsupported foreign tax identifiers stop issuance before contacting the provider',async()=>{
    let called=false;
    globalThis.fetch=async()=>{called=true;throw new Error('Unexpected invoice submission');};
    await assert.rejects(createSzamlazzHuInvoice({...invoiceInput,checkoutSession:{...invoiceInput.checkoutSession,
      customer_details:{...invoiceInput.checkoutSession.customer_details,tax_ids:[{type:'us_ein',value:'00-0000000'}]}}}),/INVOICE_TAX_ID_REVIEW_REQUIRED/);
    assert.equal(called,false);
  });
  async function invoiceOrder() {
    const o=await order();
    const stripeId='cs_live_fixture_'+o.session.id;
    await query("UPDATE sessions SET payment_status='paid',stripe_session_id=$2,paid_at=NOW() WHERE id=$1",[o.session.id,stripeId]);
    return {session:await read(o.session.id),checkoutSession:{...invoiceInput.checkoutSession,id:stripeId,livemode:true,
      payment_status:'paid',metadata:{internalSessionId:o.session.id}},throwOnError:true};
  }
  const recoveredXml='<szamla><alap><szamlaszam>FIXTURE-RECOVERED</szamlaszam><devizanem>USD</devizanem><teszt>false</teszt></alap><osszegek><totalossz><brutto>7.99</brutto></totalossz></osszegek></szamla>';
  await test('uncertain invoice submission is recovered by lookup, never by a second issue request',async()=>{
    const input=await invoiceOrder();let submissions=0,lookups=0;
    globalThis.fetch=async(_url,req)=>{
      if(req.body.has('action-xmlagentxmlfile')){submissions++;throw new Error('Synthetic lost invoice response');}
      lookups++;return new Response(recoveredXml);
    };
    await assert.rejects(createInvoiceForPaidSession(input),/lost invoice response/);
    assert.equal((await read(input.session.id)).invoice_status,'failed');
    assert.equal((await createInvoiceForPaidSession(input)).status,'issued');
    assert.equal((await read(input.session.id)).invoice_number,'FIXTURE-RECOVERED');
    assert.equal(submissions,1);assert.equal(lookups,1);
  });
  await test('unconfirmed invoice outcome becomes manual review without duplicate issuance',async()=>{
    const input=await invoiceOrder();let submissions=0;
    globalThis.fetch=async(_url,req)=>{
      if(req.body.has('action-xmlagentxmlfile')){submissions++;throw new Error('Synthetic lost invoice response');}
      return new Response('<xmlszamlavalasz><sikeres>false</sikeres><hibakod>7</hibakod></xmlszamlavalasz>');
    };
    await assert.rejects(createInvoiceForPaidSession(input));
    await assert.rejects(createInvoiceForPaidSession(input),error=>error.terminal&&error.message==='INVOICE_OUTCOME_UNKNOWN');
    assert.equal(submissions,1);
    assert.equal((await query('SELECT * FROM payment_reviews WHERE session_id=$1',[input.session.id])).rowCount,1);
  });
  await test('a replaced invoice claim cannot overwrite the current owner state',async()=>{
    const input=await invoiceOrder();
    globalThis.fetch=async()=>{
      await query('UPDATE invoices SET processing_token=gen_random_uuid() WHERE session_id=$1',[input.session.id]);
      return new Response('<xmlszamlavalasz><sikeres>true</sikeres><szamlaszam>FIXTURE-STALE</szamlaszam></xmlszamlavalasz>',{headers:{'content-type':'text/xml'}});
    };
    assert.equal(await createInvoiceForPaidSession(input),null);
    assert.equal((await read(input.session.id)).invoice_status,'processing');
    assert.equal((await query('SELECT status FROM invoices WHERE session_id=$1',[input.session.id])).rows[0].status,'processing');
  });
  console.log(JSON.stringify({passed,isolatedPostgres:true,externalProviderCalls:0}));
} finally { await pg.close(); await db.close(); }

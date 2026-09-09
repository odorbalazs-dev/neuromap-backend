import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const url = new URL(process.env.DATABASE_TEST_URL || "postgresql://localhost/invalid");
if (url.pathname !== "/neuromap_ci" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("Use only an isolated local neuromap_ci database; production databases are forbidden.");
}
process.env.DATABASE_URL = url.href;
process.env.DATABASE_SSL_MODE = "disable";
await import("./smoke-go-live.js");
const { db } = await import("../src/db/db.js");
const { runMigrations } = await import("../src/db/migrate.js");
const { enqueuePostPaymentTasks, processNextPostPaymentTask } = await import("../src/services/post-payment-outbox.service.js");
const { recordPdfState } = await import("../src/services/pdf-status.service.js");
const { runRecordedOperation } = await import("../src/services/operational-scheduler.service.js");
const { eraseSessionSensitiveData } = await import("../src/services/data-governance.service.js");
const ids = [];
try {
  await runMigrations();
  await runMigrations();
  const insert = async () => {
    const id=randomUUID(); ids.push(id);
    await db.query(`INSERT INTO sessions(id,email,name,lang,payload,payment_status,contract_confirmation_status,invoice_status,stripe_session_id)
      VALUES($1,'audit@example.invalid','Synthetic audit','hu','{}','paid','sent','issued',$2)`,[id,`cs_live_${id}`]);
    return id;
  };
  const id=await insert();
  const checkout={id:`cs_live_${id}`,livemode:true,payment_status:"paid",metadata:{internalSessionId:id},amount_total:999,currency:"usd",customer_details:{address:{country:"HU"}}};
  const client=await db.connect();
  try {
    await client.query("BEGIN"); await enqueuePostPaymentTasks(client,id,checkout); await client.query("ROLLBACK");
    assert.equal((await db.query("SELECT count(*)::int n FROM post_payment_outbox WHERE session_id=$1",[id])).rows[0].n,0);
  } finally { client.release(); }
  await Promise.all([enqueuePostPaymentTasks(db,id,checkout),enqueuePostPaymentTasks(db,id,checkout)]);
  assert.equal((await db.query("SELECT count(*)::int n FROM post_payment_outbox WHERE session_id=$1",[id])).rows[0].n,2);
  const processed=await Promise.all([processNextPostPaymentTask(),processNextPostPaymentTask(),processNextPostPaymentTask()]);
  assert.equal(processed.filter(r=>r.processed).length,2);
  assert.equal((await db.query("SELECT count(*)::int n FROM post_payment_outbox WHERE session_id=$1 AND status='done' AND payload='{}'",[id])).rows[0].n,2);
  await recordPdfState(id,"generating");
  await recordPdfState(id,"ready",{bytes:1234,sha256:"a".repeat(64)});
  assert.equal((await db.query("SELECT pdf_status FROM sessions WHERE id=$1",[id])).rows[0].pdf_status,"ready");
  const retryId=await insert();
  await db.query("UPDATE sessions SET invoice_status='pending' WHERE id=$1",[retryId]);
  await enqueuePostPaymentTasks(db,retryId,{});
  await processNextPostPaymentTask(); await processNextPostPaymentTask();
  const pending=(await db.query("SELECT * FROM post_payment_outbox WHERE session_id=$1 AND task='invoice'",[retryId])).rows[0];
  assert.equal(pending.status,"pending"); assert.equal(pending.attempts,1);
  assert.ok(new Date(pending.available_at).getTime()>Date.now());
  await db.query("UPDATE sessions SET invoice_status='issued' WHERE id=$1",[retryId]);
  await db.query("UPDATE post_payment_outbox SET status='processing',locked_until=NOW()-INTERVAL '1 minute' WHERE id=$1",[pending.id]);
  assert.equal((await processNextPostPaymentTask()).processed,true);
  assert.equal((await db.query("SELECT status FROM post_payment_outbox WHERE id=$1",[pending.id])).rows[0].status,"done");

  const testId = await insert();
  await db.query("UPDATE sessions SET invoice_status='pending',stripe_session_id=$2 WHERE id=$1", [testId,`cs_test_${testId}`]);
  const testCheckout = { ...checkout, id: `cs_test_${testId}`, livemode: false, metadata: { internalSessionId: testId } };
  await enqueuePostPaymentTasks(db, testId, testCheckout);
  assert.equal((await db.query("SELECT count(*)::int n FROM post_payment_outbox WHERE session_id=$1 AND task='invoice'",[testId])).rows[0].n,0);
  assert.equal((await db.query("SELECT invoice_error FROM sessions WHERE id=$1",[testId])).rows[0].invoice_error,"STRIPE_TEST_PAYMENT_EXCLUDED");
  await processNextPostPaymentTask(); // The contract task remains available in test mode.
  await db.query("INSERT INTO post_payment_outbox(session_id,task,payload) VALUES($1,'invoice',$2)",[testId,testCheckout]);
  const excludedJob=await processNextPostPaymentTask();
  assert.equal(excludedJob.skipped,true);
  assert.equal(excludedJob.failed,undefined);
  assert.equal((await db.query("SELECT last_error_code FROM post_payment_outbox WHERE session_id=$1 AND task='invoice'",[testId])).rows[0].last_error_code,"STRIPE_TEST_PAYMENT_EXCLUDED");

  const legacyId=await insert(), issuedTestId=await insert(), livePendingId=await insert();
  await db.query("UPDATE sessions SET stripe_session_id=$2,invoice_status='failed' WHERE id=$1",[legacyId,`cs_test_${legacyId}`]);
  await db.query("UPDATE sessions SET stripe_session_id=$2 WHERE id=$1",[issuedTestId,`cs_test_${issuedTestId}`]);
  await db.query("UPDATE sessions SET invoice_status='failed' WHERE id=$1",[livePendingId]);
  await db.query("INSERT INTO invoices(session_id,status,error_message) VALUES($1,'failed','previous provider error'),($2,'issued',NULL),($3,'failed','live failure')",[legacyId,issuedTestId,livePendingId]);
  await db.query("INSERT INTO post_payment_outbox(session_id,task,status,payload) VALUES($1,'invoice','failed',$2)",[legacyId,{id:`cs_test_${legacyId}`,customer_details:{email:'test@example.invalid'}}]);
  const exclusionSql=await readFile(new URL('../src/db/migrations/022_exclude_stripe_test_invoices.sql',import.meta.url),'utf8');
  const migrationClient=await db.connect();
  try {
    for(let repeat=0;repeat<2;repeat++){
      await migrationClient.query('BEGIN');
      await migrationClient.query(exclusionSql);
      await migrationClient.query('COMMIT');
    }
  } catch(error) { await migrationClient.query('ROLLBACK'); throw error; }
  finally { migrationClient.release(); }
  const excludedInvoice=(await db.query('SELECT * FROM invoices WHERE session_id=$1',[legacyId])).rows[0];
  assert.equal(excludedInvoice.status,'skipped');
  assert.equal(excludedInvoice.provider_response.excludedPreviousError,'previous provider error');
  assert.equal((await db.query("SELECT status FROM invoices WHERE session_id=$1",[issuedTestId])).rows[0].status,'issued');
  assert.equal((await db.query("SELECT status FROM invoices WHERE session_id=$1",[livePendingId])).rows[0].status,'failed');
  const excludedOutbox=(await db.query("SELECT status,payload FROM post_payment_outbox WHERE session_id=$1",[legacyId])).rows[0];
  assert.equal(excludedOutbox.status,'done');
  assert.deepEqual(excludedOutbox.payload,{});
  await runRecordedOperation("integration_success",async()=>({ok:true,summary:{count:1,email:"must-not-be-stored"}}));
  await runRecordedOperation("integration_lifecycle",async()=>({ok:true,sessions:{checked:2,erased:2,items:[{email:"must-not-be-stored"}]}}));
  await runRecordedOperation("integration_alert",async()=>({ok:true,skipped:true,reason:"missing_admin_alert_email"}));
  await assert.rejects(runRecordedOperation("integration_failure",async()=>{throw new Error("private provider message");}));
  const runs=(await db.query("SELECT * FROM operational_runs WHERE task LIKE 'integration_%'")).rows;
  assert.ok(runs.some(r=>r.status==='succeeded')); assert.ok(runs.some(r=>r.status==='failed'));
  assert.equal(runs.find(r=>r.task==='integration_lifecycle').summary.sessions_erased,2);
  assert.equal(runs.find(r=>r.task==='integration_alert').error_code,'MISSING_ALERT_RECIPIENT');
  assert.ok(!JSON.stringify(runs).includes("must-not-be-stored")); assert.ok(!JSON.stringify(runs).includes("private provider"));
  await eraseSessionSensitiveData(id,"Synthetic integration test");
  assert.equal((await db.query("SELECT count(*)::int n FROM post_payment_outbox WHERE session_id=$1 AND payload <> '{}'",[id])).rows[0].n,0);
  console.log("PostgreSQL integration passed: full migrations, rollback, duplicate events, concurrent workers, lease recovery, retry backoff, PDF status, redacted evidence and erasure.");
} finally {
  if(ids.length) await db.query("DELETE FROM sessions WHERE id=ANY($1::uuid[])",[ids]);
  await db.close();
}

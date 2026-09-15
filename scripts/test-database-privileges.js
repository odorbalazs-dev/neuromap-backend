import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

Object.assign(process.env, { NODE_ENV:'test', DATABASE_URL:'postgresql://localhost/never_connect_privilege_test',
  DATABASE_SSL_MODE:'disable', OPENAI_API_KEY:'fixture', STRIPE_SECRET_KEY:'sk_test_fixture',
  STRIPE_WEBHOOK_SECRET:'whsec_fixture', RESEND_API_KEY:'re_fixture', EMAIL_FROM:'fixture@example.invalid',
  APP_URL:'https://example.invalid', SUCCESS_URL:'https://example.invalid/success', CANCEL_URL:'https://example.invalid/cancel' });
globalThis.fetch = async () => { throw Error('Network forbidden in privilege tests'); };
const pg = new PGlite({ extensions:{pgcrypto} });
const { db } = await import('../src/db/db.js');
const query = async (sql, params) => params?.length ? pg.query(sql,params) : (await pg.exec(sql)).at(-1) || {rows:[]};
db.query = query;
db.connect = async () => ({query,release(){}});
const { runMigrations, verifyAppliedMigrations } = await import('../src/db/migrate.js');
const { verifyRuntimeDatabase } = await import('../src/db/startup.js');
let passed = 0;
const test = async (name, fn) => { await fn();passed++;console.log('PASS',name); };
const reset = () => pg.exec('SET SESSION AUTHORIZATION postgres; RESET ROLE;');
try {
  await runMigrations();
  await test('superuser cannot run the production application', () => assert.rejects(verifyRuntimeDatabase(), /DATABASE_RUNTIME_PRIVILEGES_UNSAFE/));
  await pg.exec(await readFile(new URL('../ops/database/runtime-grants.sql',import.meta.url),'utf8'));
  for (const role of ['neuromap_web_runtime','neuromap_worker_runtime']) {
    await pg.exec(`SET SESSION AUTHORIZATION ${role}`);
    await test(role+' verifies all migration hashes without DDL', async () => {
      const result = await verifyRuntimeDatabase();assert.equal(result.role,role);assert.ok(result.migrations>=24);
    });
    await test(role+' can insert, lock, update and delete application rows', async () => {
      await pg.exec("BEGIN; INSERT INTO api_rate_limits(bucket_key,window_start,request_count,reset_at) VALUES ('privilege-fixture',NOW(),1,NOW()+INTERVAL '1 minute'); SELECT bucket_key FROM api_rate_limits WHERE bucket_key='privilege-fixture' FOR UPDATE; UPDATE api_rate_limits SET request_count=2 WHERE bucket_key='privilege-fixture'; DELETE FROM api_rate_limits WHERE bucket_key='privilege-fixture'; ROLLBACK;");
    });
    for (const sql of ['CREATE TABLE public.forbidden_fixture(id int)','CREATE TEMP TABLE forbidden_fixture(id int)',
      'CREATE ROLE forbidden_fixture',"ALTER TABLE sessions ADD COLUMN forbidden_fixture text",
      'TRUNCATE sessions CASCADE',"DELETE FROM schema_migrations",'SET ROLE postgres']) {
      await test(role+' denies '+sql.split(' ').slice(0,3).join(' '), async () => {
        await assert.rejects(query(sql), error => error.code==='42501');
      });
    }
    await reset();
  }
  await test('missing migration is rejected without mutating history', async () => {
    await pg.exec('BEGIN');
    await pg.exec("DELETE FROM schema_migrations WHERE filename='024_payment_lifecycle.sql'");
    await assert.rejects(verifyAppliedMigrations({query}),/DATABASE_MIGRATION_REQUIRED/);
    await pg.exec('ROLLBACK');
  });
  await test('changed applied checksum is rejected', async () => {
    await pg.exec('BEGIN');
    await pg.exec("UPDATE schema_migrations SET checksum='tampered' WHERE filename='024_payment_lifecycle.sql'");
    await assert.rejects(verifyAppliedMigrations({query}),/DATABASE_MIGRATION_REQUIRED/);
    await pg.exec('ROLLBACK');
  });
  await test('role memberships cannot bypass the startup guard', async () => {
    await pg.exec('CREATE ROLE forbidden_group; GRANT forbidden_group TO neuromap_web_runtime; SET SESSION AUTHORIZATION neuromap_web_runtime;');
    await assert.rejects(verifyRuntimeDatabase(),/DATABASE_RUNTIME_PRIVILEGES_UNSAFE/);
    await reset();
  });
  console.log(JSON.stringify({passed,externalProviderCalls:0,isolatedDatabase:true}));
} catch (error) {
  console.error('FAIL privilege test', {code:error.code,message:error.message});
  process.exitCode=1;
} finally {
  await reset().catch(()=>{});
  await pg.close();
  await db.close();
}

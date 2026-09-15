# Runtime and maintenance database access

Production web/worker startup is read-only with respect to the schema. It checks
every shipped migration checksum and rejects owner/superuser credentials, role
memberships, schema/database creation rights, temporary table creation, table DDL,
executable public security-definer functions, and writable migration history.
Development startup retains the existing automatic migrations.

## Maintenance order

1. Verify an independent encrypted backup and a recent successful restore test.
2. In an isolated operator process, configure the target DB credentials and TLS
   CA with certificate verification. Do not place owner credentials in the web
   or worker environment or in this repository.
3. Run `npm run db:migrate` as the maintenance owner. Review migrations before
   running them. They may change customer data; this is not a dry run.
4. Apply `ops/database/runtime-grants.sql` in a transaction as the current
   maintenance owner (`postgres` in the existing deployment). This grants
   SELECT/INSERT/UPDATE/DELETE on application tables, read-only migration
   history, and USAGE/SELECT on sequences. It removes PUBLIC schema CREATE and
   database CREATE/TEMP privileges. Review other users before applying.
5. Set separate randomly generated SCRAM passwords for `neuromap_web_runtime`
   and `neuromap_worker_runtime`, enable LOGIN, and configure only the matching
   credential on each service. Keep `postgres` restricted to maintenance.
6. Deploy application code and runtime credentials together. Old code attempts
   migrations on boot and must not be restarted with the restricted credentials.
7. Verify successful startup, authorized TLS, real DB roles, negative privilege
   tests, admin access, webhook signature rejection, and worker scheduler/outbox
   activity. Keep the unrelated checkout/legal/tax launch gates unchanged.

If a new migration has not been applied, startup intentionally fails. A rollback
must respect schema compatibility; do not restore the old superuser credentials
as a normal workaround. The script does not rotate or disable the maintenance
owner and never transfers customer-table ownership to the runtime roles.

Both application roles currently share application-table DML scope because
administrative recovery can run through the web process and the worker runs
privacy retention and payment recovery. They do not have DDL privileges. Finer
table-level separation requires separating those job responsibilities first.

Tests: `npm run test:database-privileges` and
`npm run test:payment-lifecycle -- --runtime-role=neuromap_web_runtime`
(repeat with `neuromap_worker_runtime`). These use an isolated PGlite database
and synthetic providers, not real charges or customer data.

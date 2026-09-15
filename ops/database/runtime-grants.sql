-- Run as the database maintenance owner, in a transaction, after db:migrate.
-- Password provisioning and LOGIN activation are separate, private operations.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neuromap_web_runtime') THEN
    CREATE ROLE neuromap_web_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 32;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neuromap_worker_runtime') THEN
    CREATE ROLE neuromap_worker_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 32;
  END IF;
  EXECUTE format('REVOKE CREATE, TEMPORARY ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('REVOKE ALL ON DATABASE %I FROM neuromap_web_runtime, neuromap_worker_runtime', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO neuromap_web_runtime, neuromap_worker_runtime', current_database());
END $$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM neuromap_web_runtime, neuromap_worker_runtime;
GRANT USAGE ON SCHEMA public TO neuromap_web_runtime, neuromap_worker_runtime;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM neuromap_web_runtime, neuromap_worker_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neuromap_web_runtime, neuromap_worker_runtime;
REVOKE INSERT, UPDATE, DELETE ON public.schema_migrations FROM neuromap_web_runtime, neuromap_worker_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM neuromap_web_runtime, neuromap_worker_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neuromap_web_runtime, neuromap_worker_runtime;

-- New tables receive only DML rights; migration history stays read-only.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neuromap_web_runtime, neuromap_worker_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO neuromap_web_runtime, neuromap_worker_runtime;

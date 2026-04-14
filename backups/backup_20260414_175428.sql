--
-- PostgreSQL database dump
--

\restrict SGoxTbHG6DDbWe7gR6ld2n0t8DthBjbc8umDtXXPXrzPof7sdKxS43vz3cBsso5

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg22.04+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgboss; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA pgboss;


ALTER SCHEMA pgboss OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: job_state; Type: TYPE; Schema: pgboss; Owner: postgres
--

CREATE TYPE pgboss.job_state AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE pgboss.job_state OWNER TO postgres;

--
-- Name: job_state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.job_state AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE public.job_state OWNER TO postgres;

--
-- Name: create_queue(text, json); Type: FUNCTION; Schema: pgboss; Owner: postgres
--

CREATE FUNCTION pgboss.create_queue(queue_name text, options json) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    DECLARE
      table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
      queue_created_on timestamptz;
    BEGIN

      WITH q as (
      INSERT INTO pgboss.queue (
        name,
        policy,
        retry_limit,
        retry_delay,
        retry_backoff,
        expire_seconds,
        retention_minutes,
        dead_letter,
        partition_name
      )
      VALUES (
        queue_name,
        options->>'policy',
        (options->>'retryLimit')::int,
        (options->>'retryDelay')::int,
        (options->>'retryBackoff')::bool,
        (options->>'expireInSeconds')::int,
        (options->>'retentionMinutes')::int,
        options->>'deadLetter',
        table_name
      )
      ON CONFLICT DO NOTHING
      RETURNING created_on
      )
      SELECT created_on into queue_created_on from q;

      IF queue_created_on IS NULL THEN
        RETURN;
      END IF;

      EXECUTE format('CREATE TABLE pgboss.%I (LIKE pgboss.job INCLUDING DEFAULTS)', table_name);

      EXECUTE format('ALTER TABLE pgboss.%1$I ADD PRIMARY KEY (name, id)', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i2 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''active'' AND policy = ''singleton''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i3 ON pgboss.%1$I (name, state, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''stately''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i4 ON pgboss.%1$I (name, singleton_on, COALESCE(singleton_key, '''')) WHERE state <> ''cancelled'' AND singleton_on IS NOT NULL', table_name);
      EXECUTE format('CREATE INDEX %1$s_i5 ON pgboss.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);

      EXECUTE format('ALTER TABLE pgboss.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
      EXECUTE format('ALTER TABLE pgboss.job ATTACH PARTITION pgboss.%I FOR VALUES IN (%L)', table_name, queue_name);
    END;
    $_$;


ALTER FUNCTION pgboss.create_queue(queue_name text, options json) OWNER TO postgres;

--
-- Name: delete_queue(text); Type: FUNCTION; Schema: pgboss; Owner: postgres
--

CREATE FUNCTION pgboss.delete_queue(queue_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      table_name varchar;
    BEGIN
      WITH deleted as (
        DELETE FROM pgboss.queue
        WHERE name = queue_name
        RETURNING partition_name
      )
      SELECT partition_name from deleted INTO table_name;

      EXECUTE format('DROP TABLE IF EXISTS pgboss.%I', table_name);
    END;
    $$;


ALTER FUNCTION pgboss.delete_queue(queue_name text) OWNER TO postgres;

--
-- Name: create_queue(text, json); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_queue(queue_name text, options json) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    DECLARE
      table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
      queue_created_on timestamptz;
    BEGIN

      WITH q as (
      INSERT INTO public.queue (
        name,
        policy,
        retry_limit,
        retry_delay,
        retry_backoff,
        expire_seconds,
        retention_minutes,
        dead_letter,
        partition_name
      )
      VALUES (
        queue_name,
        options->>'policy',
        (options->>'retryLimit')::int,
        (options->>'retryDelay')::int,
        (options->>'retryBackoff')::bool,
        (options->>'expireInSeconds')::int,
        (options->>'retentionMinutes')::int,
        options->>'deadLetter',
        table_name
      )
      ON CONFLICT DO NOTHING
      RETURNING created_on
      )
      SELECT created_on into queue_created_on from q;

      IF queue_created_on IS NULL THEN
        RETURN;
      END IF;

      EXECUTE format('CREATE TABLE public.%I (LIKE public.job INCLUDING DEFAULTS)', table_name);

      EXECUTE format('ALTER TABLE public.%1$I ADD PRIMARY KEY (name, id)', table_name);
      EXECUTE format('ALTER TABLE public.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES public.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('ALTER TABLE public.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES public.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON public.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i2 ON public.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''active'' AND policy = ''singleton''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i3 ON public.%1$I (name, state, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''stately''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i4 ON public.%1$I (name, singleton_on, COALESCE(singleton_key, '''')) WHERE state <> ''cancelled'' AND singleton_on IS NOT NULL', table_name);
      EXECUTE format('CREATE INDEX %1$s_i5 ON public.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);

      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
      EXECUTE format('ALTER TABLE public.job ATTACH PARTITION public.%I FOR VALUES IN (%L)', table_name, queue_name);
    END;
    $_$;


ALTER FUNCTION public.create_queue(queue_name text, options json) OWNER TO postgres;

--
-- Name: delete_queue(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_queue(queue_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      table_name varchar;
    BEGIN
      WITH deleted as (
        DELETE FROM public.queue
        WHERE name = queue_name
        RETURNING partition_name
      )
      SELECT partition_name from deleted INTO table_name;

      EXECUTE format('DROP TABLE IF EXISTS public.%I', table_name);
    END;
    $$;


ALTER FUNCTION public.delete_queue(queue_name text) OWNER TO postgres;

--
-- Name: update_acl_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_acl_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_acl_updated_at() OWNER TO postgres;

--
-- Name: update_acls_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_acls_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_acls_updated_at() OWNER TO postgres;

--
-- Name: update_admin_notification_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_admin_notification_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_admin_notification_updated_at() OWNER TO postgres;

--
-- Name: update_admin_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_admin_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_admin_notifications_updated_at() OWNER TO postgres;

--
-- Name: update_agents_groups_agents_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_agents_groups_agents_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_agents_groups_agents_updated_at() OWNER TO postgres;

--
-- Name: update_agents_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_agents_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_agents_groups_updated_at() OWNER TO postgres;

--
-- Name: update_agents_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_agents_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_agents_roles_updated_at() OWNER TO postgres;

--
-- Name: update_agents_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_agents_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_agents_updated_at() OWNER TO postgres;

--
-- Name: update_appointment_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_appointment_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_appointment_notifications_updated_at() OWNER TO postgres;

--
-- Name: update_attachments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_attachments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_attachments_updated_at() OWNER TO postgres;

--
-- Name: update_auto_responses_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_auto_responses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_auto_responses_updated_at() OWNER TO postgres;

--
-- Name: update_calendar_events_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_calendar_events_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_calendar_events_updated_at() OWNER TO postgres;

--
-- Name: update_calendars_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_calendars_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_calendars_updated_at() OWNER TO postgres;

--
-- Name: update_communication_log_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_communication_log_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_communication_log_updated_at() OWNER TO postgres;

--
-- Name: update_communication_notifications_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_communication_notifications_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_communication_notifications_settings_updated_at() OWNER TO postgres;

--
-- Name: update_customer_users_customers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customer_users_customers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customer_users_customers_updated_at() OWNER TO postgres;

--
-- Name: update_customer_users_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customer_users_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customer_users_groups_updated_at() OWNER TO postgres;

--
-- Name: update_customer_users_services_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customer_users_services_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customer_users_services_updated_at() OWNER TO postgres;

--
-- Name: update_customer_users_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customer_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customer_users_updated_at() OWNER TO postgres;

--
-- Name: update_customers_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customers_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customers_groups_updated_at() OWNER TO postgres;

--
-- Name: update_customers_services_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customers_services_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customers_services_updated_at() OWNER TO postgres;

--
-- Name: update_customers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customers_updated_at() OWNER TO postgres;

--
-- Name: update_dynamic_fields_screens_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_dynamic_fields_screens_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_dynamic_fields_screens_updated_at() OWNER TO postgres;

--
-- Name: update_dynamic_fields_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_dynamic_fields_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_dynamic_fields_updated_at() OWNER TO postgres;

--
-- Name: update_email_addresses_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_email_addresses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_email_addresses_updated_at() OWNER TO postgres;

--
-- Name: update_general_catalog_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_general_catalog_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_general_catalog_updated_at() OWNER TO postgres;

--
-- Name: update_generic_agent_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_generic_agent_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_generic_agent_updated_at() OWNER TO postgres;

--
-- Name: update_greetings_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_greetings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_greetings_updated_at() OWNER TO postgres;

--
-- Name: update_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_groups_updated_at() OWNER TO postgres;

--
-- Name: update_oauth2_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_oauth2_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_oauth2_updated_at() OWNER TO postgres;

--
-- Name: update_package_manager_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_package_manager_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_package_manager_updated_at() OWNER TO postgres;

--
-- Name: update_performance_log_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_performance_log_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_performance_log_updated_at() OWNER TO postgres;

--
-- Name: update_pgp_keys_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_pgp_keys_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_pgp_keys_updated_at() OWNER TO postgres;

--
-- Name: update_post_master_filters_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_post_master_filters_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_post_master_filters_updated_at() OWNER TO postgres;

--
-- Name: update_post_master_mail_accounts_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_post_master_mail_accounts_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_post_master_mail_accounts_updated_at() OWNER TO postgres;

--
-- Name: update_priorities_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_priorities_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_priorities_updated_at() OWNER TO postgres;

--
-- Name: update_process_management_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_process_management_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_process_management_updated_at() OWNER TO postgres;

--
-- Name: update_processes_automation_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_processes_automation_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_processes_automation_settings_updated_at() OWNER TO postgres;

--
-- Name: update_queue_auto_response_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_queue_auto_response_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_queue_auto_response_updated_at() OWNER TO postgres;

--
-- Name: update_queues_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_queues_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_queues_updated_at() OWNER TO postgres;

--
-- Name: update_roles_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_roles_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_roles_groups_updated_at() OWNER TO postgres;

--
-- Name: update_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_roles_updated_at() OWNER TO postgres;

--
-- Name: update_services_attachments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_services_attachments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_services_attachments_updated_at() OWNER TO postgres;

--
-- Name: update_services_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_services_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_services_updated_at() OWNER TO postgres;

--
-- Name: update_session_management_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_session_management_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_session_management_updated_at() OWNER TO postgres;

--
-- Name: update_signatures_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_signatures_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_signatures_updated_at() OWNER TO postgres;

--
-- Name: update_sla_services_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_sla_services_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_sla_services_updated_at() OWNER TO postgres;

--
-- Name: update_sla_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_sla_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_sla_updated_at() OWNER TO postgres;

--
-- Name: update_smime_certificates_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_smime_certificates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_smime_certificates_updated_at() OWNER TO postgres;

--
-- Name: update_sql_box_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_sql_box_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_sql_box_updated_at() OWNER TO postgres;

--
-- Name: update_states_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_states_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_states_updated_at() OWNER TO postgres;

--
-- Name: update_support_data_collector_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_support_data_collector_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_support_data_collector_updated_at() OWNER TO postgres;

--
-- Name: update_system_configuration_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_system_configuration_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_system_configuration_updated_at() OWNER TO postgres;

--
-- Name: update_system_file_support_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_system_file_support_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_system_file_support_updated_at() OWNER TO postgres;

--
-- Name: update_system_log_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_system_log_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_system_log_updated_at() OWNER TO postgres;

--
-- Name: update_system_maintenance_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_system_maintenance_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_system_maintenance_updated_at() OWNER TO postgres;

--
-- Name: update_template_attachments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_template_attachments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_template_attachments_updated_at() OWNER TO postgres;

--
-- Name: update_template_queues_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_template_queues_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_template_queues_updated_at() OWNER TO postgres;

--
-- Name: update_templates_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_templates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_templates_updated_at() OWNER TO postgres;

--
-- Name: update_test_entities_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_test_entities_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_test_entities_updated_at() OWNER TO postgres;

--
-- Name: update_ticket_attribute_relations_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ticket_attribute_relations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ticket_attribute_relations_updated_at() OWNER TO postgres;

--
-- Name: update_ticket_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ticket_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ticket_notifications_updated_at() OWNER TO postgres;

--
-- Name: update_ticket_schedules_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ticket_schedules_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ticket_schedules_timestamp() OWNER TO postgres;

--
-- Name: update_translation_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_translation_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_translation_updated_at() OWNER TO postgres;

--
-- Name: update_type_categories_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_type_categories_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_type_categories_updated_at() OWNER TO postgres;

--
-- Name: update_types_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_types_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_types_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: update_users_groups_roles_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_users_groups_roles_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_users_groups_roles_settings_updated_at() OWNER TO postgres;

--
-- Name: update_web_services_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_web_services_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_web_services_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archive; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.archive (
    id uuid CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state pgboss.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    archived_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.archive OWNER TO postgres;

--
-- Name: job; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.job (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text
)
PARTITION BY LIST (name);


ALTER TABLE pgboss.job OWNER TO postgres;

--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer DEFAULT 0 CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer DEFAULT 2 CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer DEFAULT 0 CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer DEFAULT 0 CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean DEFAULT false CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone DEFAULT now() CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone DEFAULT now() CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = '__pgboss__send-it'::text))
);


ALTER TABLE pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 OWNER TO postgres;

--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer DEFAULT 0 CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer DEFAULT 2 CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer DEFAULT 0 CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer DEFAULT 0 CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean DEFAULT false CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone DEFAULT now() CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone DEFAULT now() CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'test-queue'::text))
);


ALTER TABLE pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c OWNER TO postgres;

--
-- Name: queue; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.queue (
    name text NOT NULL,
    policy text,
    retry_limit integer,
    retry_delay integer,
    retry_backoff boolean,
    expire_seconds integer,
    retention_minutes integer,
    dead_letter text,
    partition_name text,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.queue OWNER TO postgres;

--
-- Name: schedule; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.schedule (
    name text NOT NULL,
    cron text NOT NULL,
    timezone text,
    data jsonb,
    options jsonb,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.schedule OWNER TO postgres;

--
-- Name: subscription; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.subscription (
    event text NOT NULL,
    name text NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.subscription OWNER TO postgres;

--
-- Name: version; Type: TABLE; Schema: pgboss; Owner: postgres
--

CREATE TABLE pgboss.version (
    version integer NOT NULL,
    maintained_on timestamp with time zone,
    cron_on timestamp with time zone,
    monitored_on timestamp with time zone
);


ALTER TABLE pgboss.version OWNER TO postgres;

--
-- Name: acl; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acl (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    permissions text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.acl OWNER TO postgres;

--
-- Name: acl_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acl_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.acl_id_seq OWNER TO postgres;

--
-- Name: acl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.acl_id_seq OWNED BY public.acl.id;


--
-- Name: acls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acls (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.acls OWNER TO postgres;

--
-- Name: acls_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.acls_id_seq OWNER TO postgres;

--
-- Name: acls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.acls_id_seq OWNED BY public.acls.id;


--
-- Name: admin_notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notification (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_notification OWNER TO postgres;

--
-- Name: admin_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notification_id_seq OWNER TO postgres;

--
-- Name: admin_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notification_id_seq OWNED BY public.admin_notification.id;


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name character varying(255),
    last_name character varying(255),
    login character varying(255),
    password character varying(255),
    email character varying(255),
    mobile_phone character varying(255),
    telegram_account character varying(255),
    avatar text
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: agents_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents_groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role_id integer
);


ALTER TABLE public.agents_groups OWNER TO postgres;

--
-- Name: agents_groups_agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents_groups_agents (
    id integer NOT NULL,
    agents_group_id integer NOT NULL,
    agent_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents_groups_agents OWNER TO postgres;

--
-- Name: agents_groups_agents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_groups_agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_groups_agents_id_seq OWNER TO postgres;

--
-- Name: agents_groups_agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_groups_agents_id_seq OWNED BY public.agents_groups_agents.id;


--
-- Name: agents_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_groups_id_seq OWNER TO postgres;

--
-- Name: agents_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_groups_id_seq OWNED BY public.agents_groups.id;


--
-- Name: agents_groups_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents_groups_roles (
    id integer NOT NULL,
    agents_group_id integer NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents_groups_roles OWNER TO postgres;

--
-- Name: agents_groups_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_groups_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_groups_roles_id_seq OWNER TO postgres;

--
-- Name: agents_groups_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_groups_roles_id_seq OWNED BY public.agents_groups_roles.id;


--
-- Name: agents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_id_seq OWNER TO postgres;

--
-- Name: agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_id_seq OWNED BY public.agents.id;


--
-- Name: agents_queues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents_queues (
    id integer NOT NULL,
    agent_id integer,
    queue_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents_queues OWNER TO postgres;

--
-- Name: agents_queues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_queues_id_seq OWNER TO postgres;

--
-- Name: agents_queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_queues_id_seq OWNED BY public.agents_queues.id;


--
-- Name: agents_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents_roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents_roles OWNER TO postgres;

--
-- Name: agents_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_roles_id_seq OWNER TO postgres;

--
-- Name: agents_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_roles_id_seq OWNED BY public.agents_roles.id;


--
-- Name: appointment_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_notifications (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.appointment_notifications OWNER TO postgres;

--
-- Name: appointment_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointment_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointment_notifications_id_seq OWNER TO postgres;

--
-- Name: appointment_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointment_notifications_id_seq OWNED BY public.appointment_notifications.id;


--
-- Name: archive; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archive (
    id uuid CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state public.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    archived_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.archive OWNER TO postgres;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    file_name character varying(255),
    type integer,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachments_id_seq OWNER TO postgres;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: auto_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auto_responses (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    trigger character varying(255),
    response text,
    delay integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auto_responses OWNER TO postgres;

--
-- Name: auto_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auto_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auto_responses_id_seq OWNER TO postgres;

--
-- Name: auto_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auto_responses_id_seq OWNED BY public.auto_responses.id;


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    calendar_id integer NOT NULL,
    title character varying(255) NOT NULL,
    start timestamp without time zone NOT NULL,
    event_end timestamp without time zone NOT NULL,
    all_day boolean DEFAULT false,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: calendars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendars (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    timezone character varying(255),
    work_hours character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    work_hours_from time without time zone,
    work_hours_to time without time zone,
    work_days_per_week integer DEFAULT 5,
    color character varying(50) DEFAULT 'primary'::character varying,
    date_from date,
    date_to date,
    include_weekends boolean DEFAULT false,
    CONSTRAINT calendars_work_days_per_week_check CHECK (((work_days_per_week >= 3) AND (work_days_per_week <= 7)))
);


ALTER TABLE public.calendars OWNER TO postgres;

--
-- Name: calendars_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendars_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendars_id_seq OWNER TO postgres;

--
-- Name: calendars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendars_id_seq OWNED BY public.calendars.id;


--
-- Name: communication_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communication_log (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.communication_log OWNER TO postgres;

--
-- Name: communication_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communication_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communication_log_id_seq OWNER TO postgres;

--
-- Name: communication_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communication_log_id_seq OWNED BY public.communication_log.id;


--
-- Name: communication_notifications_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communication_notifications_settings (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.communication_notifications_settings OWNER TO postgres;

--
-- Name: communication_notifications_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communication_notifications_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communication_notifications_settings_id_seq OWNER TO postgres;

--
-- Name: communication_notifications_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communication_notifications_settings_id_seq OWNED BY public.communication_notifications_settings.id;


--
-- Name: customer_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_users (
    id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name character varying(255),
    last_name character varying(255),
    login character varying(255),
    password character varying(255),
    email character varying(255),
    mobile_phone character varying(50),
    telegram_account character varying(100),
    customer_id integer,
    customers_group_id integer
);


ALTER TABLE public.customer_users OWNER TO postgres;

--
-- Name: customer_users_customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_users_customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_users_customers OWNER TO postgres;

--
-- Name: customer_users_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_users_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_users_customers_id_seq OWNER TO postgres;

--
-- Name: customer_users_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_users_customers_id_seq OWNED BY public.customer_users_customers.id;


--
-- Name: customer_users_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_users_groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_users_groups OWNER TO postgres;

--
-- Name: customer_users_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_users_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_users_groups_id_seq OWNER TO postgres;

--
-- Name: customer_users_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_users_groups_id_seq OWNED BY public.customer_users_groups.id;


--
-- Name: customer_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_users_id_seq OWNER TO postgres;

--
-- Name: customer_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_users_id_seq OWNED BY public.customer_users.id;


--
-- Name: customer_users_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_users_services (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_users_services OWNER TO postgres;

--
-- Name: customer_users_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_users_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_users_services_id_seq OWNER TO postgres;

--
-- Name: customer_users_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_users_services_id_seq OWNED BY public.customer_users_services.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    street character varying(255),
    zip character varying(20),
    city character varying(255),
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers_groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    customer_id integer
);


ALTER TABLE public.customers_groups OWNER TO postgres;

--
-- Name: customers_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_groups_id_seq OWNER TO postgres;

--
-- Name: customers_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_groups_id_seq OWNED BY public.customers_groups.id;


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: customers_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers_services (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    service_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers_services OWNER TO postgres;

--
-- Name: TABLE customers_services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.customers_services IS 'Таблица связи между компаниями и сервисами';


--
-- Name: COLUMN customers_services.customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.customers_services.customer_id IS 'ID компании';


--
-- Name: COLUMN customers_services.service_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.customers_services.service_id IS 'ID сервиса';


--
-- Name: customers_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_services_id_seq OWNER TO postgres;

--
-- Name: customers_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_services_id_seq OWNED BY public.customers_services.id;


--
-- Name: dynamic_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dynamic_fields (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    label character varying(255),
    field_type character varying(255),
    default_value character varying(255),
    is_required boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dynamic_fields OWNER TO postgres;

--
-- Name: dynamic_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dynamic_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dynamic_fields_id_seq OWNER TO postgres;

--
-- Name: dynamic_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dynamic_fields_id_seq OWNED BY public.dynamic_fields.id;


--
-- Name: dynamic_fields_screens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dynamic_fields_screens (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    screen_name character varying(255),
    field_name character varying(255),
    field_type character varying(255),
    is_required boolean DEFAULT false,
    "position" integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dynamic_fields_screens OWNER TO postgres;

--
-- Name: dynamic_fields_screens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dynamic_fields_screens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dynamic_fields_screens_id_seq OWNER TO postgres;

--
-- Name: dynamic_fields_screens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dynamic_fields_screens_id_seq OWNED BY public.dynamic_fields_screens.id;


--
-- Name: dynamicfields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dynamicfields (
    id integer NOT NULL,
    name character varying(255),
    label character varying(255),
    fieldtype character varying(255),
    defaultvalue character varying(255),
    isrequired boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status integer DEFAULT 1,
    is_active boolean DEFAULT true
);


ALTER TABLE public.dynamicfields OWNER TO postgres;

--
-- Name: dynamicfields_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dynamicfields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dynamicfields_id_seq OWNER TO postgres;

--
-- Name: dynamicfields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dynamicfields_id_seq OWNED BY public.dynamicfields.id;


--
-- Name: email_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_addresses (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    queue_id integer
);


ALTER TABLE public.email_addresses OWNER TO postgres;

--
-- Name: COLUMN email_addresses.queue_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_addresses.queue_id IS 'ID связанной очереди';


--
-- Name: email_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_addresses_id_seq OWNER TO postgres;

--
-- Name: email_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_addresses_id_seq OWNED BY public.email_addresses.id;


--
-- Name: general_catalog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.general_catalog (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.general_catalog OWNER TO postgres;

--
-- Name: general_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.general_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.general_catalog_id_seq OWNER TO postgres;

--
-- Name: general_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.general_catalog_id_seq OWNED BY public.general_catalog.id;


--
-- Name: generic_agent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.generic_agent (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trigger_type character varying(255),
    schedule character varying(255),
    last_run character varying(255),
    next_run character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.generic_agent OWNER TO postgres;

--
-- Name: generic_agent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.generic_agent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.generic_agent_id_seq OWNER TO postgres;

--
-- Name: generic_agent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.generic_agent_id_seq OWNED BY public.generic_agent.id;


--
-- Name: greetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.greetings (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    content text
);


ALTER TABLE public.greetings OWNER TO postgres;

--
-- Name: greetings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.greetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.greetings_id_seq OWNER TO postgres;

--
-- Name: greetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.greetings_id_seq OWNED BY public.greetings.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state public.job_state DEFAULT 'created'::public.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text
)
PARTITION BY LIST (name);


ALTER TABLE public.job OWNER TO postgres;

--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer DEFAULT 0 CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state public.job_state DEFAULT 'created'::public.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer DEFAULT 2 CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer DEFAULT 0 CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer DEFAULT 0 CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean DEFAULT false CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone DEFAULT now() CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone DEFAULT now() CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = '__pgboss__send-it'::text))
);


ALTER TABLE public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 OWNER TO postgres;

--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer DEFAULT 0 CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state public.job_state DEFAULT 'created'::public.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer DEFAULT 2 CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer DEFAULT 0 CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer DEFAULT 0 CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean DEFAULT false CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone DEFAULT now() CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone DEFAULT now() CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'test-queue'::text))
);


ALTER TABLE public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c OWNER TO postgres;

--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT job_id_not_null NOT NULL,
    name text CONSTRAINT job_name_not_null NOT NULL,
    priority integer DEFAULT 0 CONSTRAINT job_priority_not_null NOT NULL,
    data jsonb,
    state public.job_state DEFAULT 'created'::public.job_state CONSTRAINT job_state_not_null NOT NULL,
    retry_limit integer DEFAULT 2 CONSTRAINT job_retry_limit_not_null NOT NULL,
    retry_count integer DEFAULT 0 CONSTRAINT job_retry_count_not_null NOT NULL,
    retry_delay integer DEFAULT 0 CONSTRAINT job_retry_delay_not_null NOT NULL,
    retry_backoff boolean DEFAULT false CONSTRAINT job_retry_backoff_not_null NOT NULL,
    start_after timestamp with time zone DEFAULT now() CONSTRAINT job_start_after_not_null NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval CONSTRAINT job_expire_in_not_null NOT NULL,
    created_on timestamp with time zone DEFAULT now() CONSTRAINT job_created_on_not_null NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) CONSTRAINT job_keep_until_not_null NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'process-ticket-schedules'::text))
);


ALTER TABLE public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f OWNER TO postgres;

--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_base (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    category_id integer,
    tags text[],
    service_id integer,
    is_published boolean DEFAULT false,
    views_count integer DEFAULT 0,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.knowledge_base OWNER TO postgres;

--
-- Name: TABLE knowledge_base; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.knowledge_base IS 'База знаний - статьи и документация для агентов и клиентов';


--
-- Name: COLUMN knowledge_base.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.title IS 'Заголовок статьи';


--
-- Name: COLUMN knowledge_base.content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.content IS 'Содержание статьи (Markdown/HTML)';


--
-- Name: COLUMN knowledge_base.category_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.category_id IS 'Категория статьи (ссылка на types)';


--
-- Name: COLUMN knowledge_base.tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.tags IS 'Теги для поиска';


--
-- Name: COLUMN knowledge_base.service_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.service_id IS 'Связанный сервис';


--
-- Name: COLUMN knowledge_base.is_published; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.is_published IS 'Опубликована ли статья';


--
-- Name: COLUMN knowledge_base.views_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.views_count IS 'Количество просмотров';


--
-- Name: COLUMN knowledge_base.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.created_by IS 'Автор статьи';


--
-- Name: COLUMN knowledge_base.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.created_at IS 'Дата создания';


--
-- Name: COLUMN knowledge_base.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.updated_at IS 'Дата обновления';


--
-- Name: COLUMN knowledge_base.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.knowledge_base.is_active IS 'Активна ли статья';


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knowledge_base_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_base_id_seq OWNER TO postgres;

--
-- Name: knowledge_base_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knowledge_base_id_seq OWNED BY public.knowledge_base.id;


--
-- Name: oauth2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oauth2 (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    client_id character varying(255),
    client_secret character varying(255),
    authorization_url character varying(255),
    token_url character varying(255),
    scopes text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.oauth2 OWNER TO postgres;

--
-- Name: oauth2_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oauth2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oauth2_id_seq OWNER TO postgres;

--
-- Name: oauth2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oauth2_id_seq OWNED BY public.oauth2.id;


--
-- Name: package_manager; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_manager (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    version character varying(255),
    author character varying(255),
    is_installed boolean DEFAULT false,
    is_upgradable boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.package_manager OWNER TO postgres;

--
-- Name: package_manager_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.package_manager_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.package_manager_id_seq OWNER TO postgres;

--
-- Name: package_manager_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.package_manager_id_seq OWNED BY public.package_manager.id;


--
-- Name: performance_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_log (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.performance_log OWNER TO postgres;

--
-- Name: performance_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_log_id_seq OWNER TO postgres;

--
-- Name: performance_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_log_id_seq OWNED BY public.performance_log.id;


--
-- Name: pgp_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pgp_keys (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pgp_keys OWNER TO postgres;

--
-- Name: pgp_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pgp_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pgp_keys_id_seq OWNER TO postgres;

--
-- Name: pgp_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pgp_keys_id_seq OWNED BY public.pgp_keys.id;


--
-- Name: post_master_filters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_master_filters (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_master_filters OWNER TO postgres;

--
-- Name: post_master_filters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_master_filters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_master_filters_id_seq OWNER TO postgres;

--
-- Name: post_master_filters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_master_filters_id_seq OWNED BY public.post_master_filters.id;


--
-- Name: post_master_mail_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_master_mail_accounts (
    id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(20) DEFAULT 'IMAP'::character varying NOT NULL,
    authentication_type character varying(50) DEFAULT 'password'::character varying NOT NULL,
    login character varying(255) DEFAULT ''::character varying NOT NULL,
    password character varying(500),
    host character varying(255) DEFAULT ''::character varying NOT NULL,
    imap_folder character varying(255),
    trusted boolean DEFAULT false NOT NULL,
    dispatching_by character varying(20) DEFAULT 'Queue'::character varying NOT NULL,
    queue_id integer,
    comment text,
    oauth2_token_config_id integer,
    name character varying(255)
);


ALTER TABLE public.post_master_mail_accounts OWNER TO postgres;

--
-- Name: COLUMN post_master_mail_accounts.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.type IS 'Тип протокола: IMAP, IMAPS, IMAPTLS, MSGraph, POP3, POP3S, POP3TLS';


--
-- Name: COLUMN post_master_mail_accounts.authentication_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.authentication_type IS 'Тип аутентификации: oauth2_token или password';


--
-- Name: COLUMN post_master_mail_accounts.login; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.login IS 'Логин для подключения к почтовому серверу';


--
-- Name: COLUMN post_master_mail_accounts.password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.password IS 'Пароль для подключения (зашифрованный)';


--
-- Name: COLUMN post_master_mail_accounts.host; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.host IS 'Адрес почтового сервера';


--
-- Name: COLUMN post_master_mail_accounts.imap_folder; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.imap_folder IS 'Папка IMAP для получения сообщений (опционально)';


--
-- Name: COLUMN post_master_mail_accounts.trusted; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.trusted IS 'Доверенный аккаунт';


--
-- Name: COLUMN post_master_mail_accounts.dispatching_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.dispatching_by IS 'Метод маршрутизации: Queue или From';


--
-- Name: COLUMN post_master_mail_accounts.queue_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.queue_id IS 'ID очереди для маршрутизации';


--
-- Name: COLUMN post_master_mail_accounts.comment; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.comment IS 'Комментарий к аккаунту';


--
-- Name: COLUMN post_master_mail_accounts.oauth2_token_config_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.oauth2_token_config_id IS 'ID конфигурации OAuth2 токена';


--
-- Name: COLUMN post_master_mail_accounts.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.post_master_mail_accounts.name IS 'Название почтового аккаунта';


--
-- Name: post_master_mail_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_master_mail_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_master_mail_accounts_id_seq OWNER TO postgres;

--
-- Name: post_master_mail_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_master_mail_accounts_id_seq OWNED BY public.post_master_mail_accounts.id;


--
-- Name: priorities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.priorities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(7),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.priorities OWNER TO postgres;

--
-- Name: priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.priorities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.priorities_id_seq OWNER TO postgres;

--
-- Name: priorities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.priorities_id_seq OWNED BY public.priorities.id;


--
-- Name: process_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_management (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    process_type character varying(255),
    last_executed character varying(255),
    next_execution character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.process_management OWNER TO postgres;

--
-- Name: process_management_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.process_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_management_id_seq OWNER TO postgres;

--
-- Name: process_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.process_management_id_seq OWNED BY public.process_management.id;


--
-- Name: processes_automation_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.processes_automation_settings (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.processes_automation_settings OWNER TO postgres;

--
-- Name: processes_automation_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.processes_automation_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.processes_automation_settings_id_seq OWNER TO postgres;

--
-- Name: processes_automation_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.processes_automation_settings_id_seq OWNED BY public.processes_automation_settings.id;


--
-- Name: queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue (
    name text NOT NULL,
    policy text,
    retry_limit integer,
    retry_delay integer,
    retry_backoff boolean,
    expire_seconds integer,
    retention_minutes integer,
    dead_letter text,
    partition_name text,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.queue OWNER TO postgres;

--
-- Name: queue_auto_response; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_auto_response (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.queue_auto_response OWNER TO postgres;

--
-- Name: queue_auto_response_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queue_auto_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queue_auto_response_id_seq OWNER TO postgres;

--
-- Name: queue_auto_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queue_auto_response_id_seq OWNED BY public.queue_auto_response.id;


--
-- Name: queues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queues (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    max_tickets integer,
    priority integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    template_id integer,
    company_id integer,
    service_id integer,
    sla_id integer,
    workflow_id integer,
    agent_group_id integer,
    priority_id integer,
    email_config jsonb DEFAULT '{}'::jsonb,
    keywords text[],
    auto_response_template text,
    quick_answer_article_ids integer[],
    department_id integer,
    executor_group_ids integer[],
    executor_agent_ids integer[],
    observer_agent_ids integer[],
    type_id integer,
    category_id integer,
    post_master_mail_account_id integer,
    template_open_ticket_id integer,
    template_close_ticket_id integer,
    template_confirm_ticket_id integer,
    template_status_change_id integer,
    template_comment_ticket_id integer
);


ALTER TABLE public.queues OWNER TO postgres;

--
-- Name: COLUMN queues.template_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_id IS 'ID шаблона, связанного с очередью';


--
-- Name: COLUMN queues.company_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.company_id IS 'ID организации (клиента)';


--
-- Name: COLUMN queues.service_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.service_id IS 'Ссылка на сервис (services)';


--
-- Name: COLUMN queues.sla_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.sla_id IS 'Ссылка на SLA (sla)';


--
-- Name: COLUMN queues.workflow_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.workflow_id IS 'Ссылка на рабочий процесс (workflows)';


--
-- Name: COLUMN queues.agent_group_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.agent_group_id IS 'Ссылка на группу агентов (agents_groups)';


--
-- Name: COLUMN queues.priority_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.priority_id IS 'Приоритет по умолчанию (priorities)';


--
-- Name: COLUMN queues.email_config; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.email_config IS 'Конфигурация почты для очереди (JSONB)';


--
-- Name: COLUMN queues.keywords; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.keywords IS 'Ключевые слова для авто-маршрутизации';


--
-- Name: COLUMN queues.auto_response_template; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.auto_response_template IS 'Шаблон авто-ответа';


--
-- Name: COLUMN queues.department_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.department_id IS 'ID подразделения (группы клиентов)';


--
-- Name: COLUMN queues.executor_group_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.executor_group_ids IS 'Список ID групп агентов-исполнителей';


--
-- Name: COLUMN queues.executor_agent_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.executor_agent_ids IS 'Список ID агентов-исполнителей';


--
-- Name: COLUMN queues.observer_agent_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.observer_agent_ids IS 'Список ID агентов-наблюдателей';


--
-- Name: COLUMN queues.type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.type_id IS 'Ссылка на тип (types)';


--
-- Name: COLUMN queues.category_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.category_id IS 'Ссылка на категорию типа (type_categories)';


--
-- Name: COLUMN queues.post_master_mail_account_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.post_master_mail_account_id IS 'Ссылка на почтовый аккаунт (post_master_mail_accounts)';


--
-- Name: COLUMN queues.template_open_ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_open_ticket_id IS 'Шаблон открытия обращения';


--
-- Name: COLUMN queues.template_close_ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_close_ticket_id IS 'Шаблон закрытия обращения';


--
-- Name: COLUMN queues.template_confirm_ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_confirm_ticket_id IS 'Шаблон подтверждения обращения';


--
-- Name: COLUMN queues.template_status_change_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_status_change_id IS 'Шаблон изменения статуса';


--
-- Name: COLUMN queues.template_comment_ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_comment_ticket_id IS 'Шаблон получения комментария';


--
-- Name: queues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queues_id_seq OWNER TO postgres;

--
-- Name: queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queues_id_seq OWNED BY public.queues.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission character varying(100) NOT NULL,
    is_granted boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    icon character varying(255),
    photo character varying(500)
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles_groups OWNER TO postgres;

--
-- Name: roles_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_groups_id_seq OWNER TO postgres;

--
-- Name: roles_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_groups_id_seq OWNED BY public.roles_groups.id;


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule (
    name text NOT NULL,
    cron text NOT NULL,
    timezone text,
    data jsonb,
    options jsonb,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schedule OWNER TO postgres;

--
-- Name: schedule_execution_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_execution_logs (
    id integer NOT NULL,
    schedule_id integer,
    ticket_id integer,
    executed_at timestamp with time zone DEFAULT now(),
    success boolean DEFAULT true,
    message text,
    error text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.schedule_execution_logs OWNER TO postgres;

--
-- Name: TABLE schedule_execution_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.schedule_execution_logs IS 'Логи выполнения расписаний тикетов';


--
-- Name: COLUMN schedule_execution_logs.schedule_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_execution_logs.schedule_id IS 'ID расписания';


--
-- Name: COLUMN schedule_execution_logs.ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_execution_logs.ticket_id IS 'ID созданного тикета';


--
-- Name: COLUMN schedule_execution_logs.executed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_execution_logs.executed_at IS 'Время выполнения';


--
-- Name: COLUMN schedule_execution_logs.success; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_execution_logs.success IS 'Успешность выполнения';


--
-- Name: COLUMN schedule_execution_logs.message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_execution_logs.message IS 'Сообщение';


--
-- Name: COLUMN schedule_execution_logs.error; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_execution_logs.error IS 'Ошибка';


--
-- Name: schedule_execution_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_execution_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_execution_logs_id_seq OWNER TO postgres;

--
-- Name: schedule_execution_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_execution_logs_id_seq OWNED BY public.schedule_execution_logs.id;


--
-- Name: service_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_attachments (
    id integer NOT NULL,
    service_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(255),
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.service_attachments OWNER TO postgres;

--
-- Name: TABLE service_attachments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_attachments IS 'Таблица вложений для сервисов';


--
-- Name: COLUMN service_attachments.service_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_attachments.service_id IS 'ID сервиса';


--
-- Name: COLUMN service_attachments.file_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_attachments.file_name IS 'Оригинальное имя файла';


--
-- Name: COLUMN service_attachments.file_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_attachments.file_path IS 'Путь к файлу на сервере';


--
-- Name: COLUMN service_attachments.file_size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_attachments.file_size IS 'Размер файла в байтах';


--
-- Name: COLUMN service_attachments.mime_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_attachments.mime_type IS 'MIME-тип файла';


--
-- Name: COLUMN service_attachments.uploaded_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_attachments.uploaded_by IS 'ID пользователя, загрузившего файл';


--
-- Name: service_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_attachments_id_seq OWNER TO postgres;

--
-- Name: service_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_attachments_id_seq OWNED BY public.service_attachments.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(255),
    sla_id integer
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services_attachments (
    id integer NOT NULL,
    service_id integer NOT NULL,
    attachment_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.services_attachments OWNER TO postgres;

--
-- Name: TABLE services_attachments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.services_attachments IS 'Таблица связи между сервисами и вложениями';


--
-- Name: COLUMN services_attachments.service_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.services_attachments.service_id IS 'ID сервиса';


--
-- Name: COLUMN services_attachments.attachment_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.services_attachments.attachment_id IS 'ID вложения';


--
-- Name: services_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_attachments_id_seq OWNER TO postgres;

--
-- Name: services_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_attachments_id_seq OWNED BY public.services_attachments.id;


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: session_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_management (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    ip_address character varying(255),
    user_agent character varying(255),
    login_time character varying(255),
    last_activity character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.session_management OWNER TO postgres;

--
-- Name: session_management_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_management_id_seq OWNER TO postgres;

--
-- Name: session_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_management_id_seq OWNED BY public.session_management.id;


--
-- Name: signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signatures (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comment text
);


ALTER TABLE public.signatures OWNER TO postgres;

--
-- Name: signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signatures_id_seq OWNER TO postgres;

--
-- Name: signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signatures_id_seq OWNED BY public.signatures.id;


--
-- Name: sla; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sla (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    response_time numeric(10,2),
    resolution_time numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    calendar_id integer,
    notification_percentage integer DEFAULT 0,
    type character varying(255),
    solution_time integer DEFAULT 0,
    min_incident_time integer DEFAULT 10,
    response_notification integer DEFAULT 20,
    update_notification integer DEFAULT 80,
    solution_notification integer DEFAULT 80
);


ALTER TABLE public.sla OWNER TO postgres;

--
-- Name: sla_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sla_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sla_id_seq OWNER TO postgres;

--
-- Name: sla_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sla_id_seq OWNED BY public.sla.id;


--
-- Name: sla_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sla_services (
    id integer NOT NULL,
    sla_id integer NOT NULL,
    service_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sla_services OWNER TO postgres;

--
-- Name: sla_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sla_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sla_services_id_seq OWNER TO postgres;

--
-- Name: sla_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sla_services_id_seq OWNED BY public.sla_services.id;


--
-- Name: smime_certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smime_certificates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.smime_certificates OWNER TO postgres;

--
-- Name: smime_certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.smime_certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.smime_certificates_id_seq OWNER TO postgres;

--
-- Name: smime_certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.smime_certificates_id_seq OWNED BY public.smime_certificates.id;


--
-- Name: sql_box; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sql_box (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sql_box OWNER TO postgres;

--
-- Name: sql_box_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sql_box_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sql_box_id_seq OWNER TO postgres;

--
-- Name: sql_box_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sql_box_id_seq OWNED BY public.sql_box.id;


--
-- Name: state_transitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.state_transitions (
    id integer NOT NULL,
    type_id integer,
    from_state_id integer,
    to_state_id integer NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.state_transitions OWNER TO postgres;

--
-- Name: TABLE state_transitions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.state_transitions IS 'Переходы между статусами для типов инцидентов';


--
-- Name: COLUMN state_transitions.type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.state_transitions.type_id IS 'Тип инцидента (NULL = для всех типов)';


--
-- Name: COLUMN state_transitions.from_state_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.state_transitions.from_state_id IS 'Исходный статус (NULL = начальный статус для нового тикета)';


--
-- Name: COLUMN state_transitions.to_state_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.state_transitions.to_state_id IS 'Целевой статус';


--
-- Name: COLUMN state_transitions.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.state_transitions.name IS 'Название перехода (например: "Открыть", "Закрыть", "В работу")';


--
-- Name: COLUMN state_transitions.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.state_transitions.is_active IS 'Активен ли переход';


--
-- Name: state_transitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.state_transitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.state_transitions_id_seq OWNER TO postgres;

--
-- Name: state_transitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.state_transitions_id_seq OWNED BY public.state_transitions.id;


--
-- Name: states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.states (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(255),
    color character varying(7),
    type_id integer,
    is_initial boolean DEFAULT false
);


ALTER TABLE public.states OWNER TO postgres;

--
-- Name: COLUMN states.is_initial; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.states.is_initial IS 'Является ли статус начальным по умолчанию';


--
-- Name: states_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.states_id_seq OWNER TO postgres;

--
-- Name: states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.states_id_seq OWNED BY public.states.id;


--
-- Name: subscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription (
    event text NOT NULL,
    name text NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription OWNER TO postgres;

--
-- Name: support_data_collector; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_data_collector (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.support_data_collector OWNER TO postgres;

--
-- Name: support_data_collector_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_data_collector_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_data_collector_id_seq OWNER TO postgres;

--
-- Name: support_data_collector_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_data_collector_id_seq OWNED BY public.support_data_collector.id;


--
-- Name: system_configuration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_configuration (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    value character varying(255),
    config_type character varying(255),
    is_editable boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_configuration OWNER TO postgres;

--
-- Name: system_configuration_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_configuration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_configuration_id_seq OWNER TO postgres;

--
-- Name: system_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_configuration_id_seq OWNED BY public.system_configuration.id;


--
-- Name: system_file_support; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_file_support (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_file_support OWNER TO postgres;

--
-- Name: system_file_support_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_file_support_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_file_support_id_seq OWNER TO postgres;

--
-- Name: system_file_support_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_file_support_id_seq OWNED BY public.system_file_support.id;


--
-- Name: system_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_log (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_log OWNER TO postgres;

--
-- Name: system_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_log_id_seq OWNER TO postgres;

--
-- Name: system_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_log_id_seq OWNED BY public.system_log.id;


--
-- Name: system_maintenance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_maintenance (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_time character varying(255),
    end_time character varying(255),
    is_scheduled boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_maintenance OWNER TO postgres;

--
-- Name: system_maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_maintenance_id_seq OWNER TO postgres;

--
-- Name: system_maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_maintenance_id_seq OWNED BY public.system_maintenance.id;


--
-- Name: template_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_attachments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.template_attachments OWNER TO postgres;

--
-- Name: template_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.template_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.template_attachments_id_seq OWNER TO postgres;

--
-- Name: template_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.template_attachments_id_seq OWNED BY public.template_attachments.id;


--
-- Name: template_queues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_queues (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.template_queues OWNER TO postgres;

--
-- Name: template_queues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.template_queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.template_queues_id_seq OWNER TO postgres;

--
-- Name: template_queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.template_queues_id_seq OWNED BY public.template_queues.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.templates OWNER TO postgres;

--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_id_seq OWNER TO postgres;

--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: test_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_entities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.test_entities OWNER TO postgres;

--
-- Name: test_entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_entities_id_seq OWNER TO postgres;

--
-- Name: test_entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_entities_id_seq OWNED BY public.test_entities.id;


--
-- Name: ticket_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_attachments (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    uploaded_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_attachments OWNER TO postgres;

--
-- Name: TABLE ticket_attachments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ticket_attachments IS 'Вложения к тикетам';


--
-- Name: COLUMN ticket_attachments.file_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_attachments.file_name IS 'Имя файла';


--
-- Name: COLUMN ticket_attachments.file_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_attachments.file_path IS 'Путь к файлу на сервере';


--
-- Name: COLUMN ticket_attachments.file_size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_attachments.file_size IS 'Размер файла в байтах';


--
-- Name: COLUMN ticket_attachments.mime_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_attachments.mime_type IS 'MIME-тип файла';


--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_attachments_id_seq OWNER TO postgres;

--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_attachments_id_seq OWNED BY public.ticket_attachments.id;


--
-- Name: ticket_attribute_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_attribute_relations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    source_attribute character varying(255),
    target_attribute character varying(255),
    relation_type character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_attribute_relations OWNER TO postgres;

--
-- Name: ticket_attribute_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_attribute_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_attribute_relations_id_seq OWNER TO postgres;

--
-- Name: ticket_attribute_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_attribute_relations_id_seq OWNED BY public.ticket_attribute_relations.id;


--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comments (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    author_id integer,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_internal boolean DEFAULT false
);


ALTER TABLE public.ticket_comments OWNER TO postgres;

--
-- Name: TABLE ticket_comments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ticket_comments IS 'Комментарии к тикетам (внутренние, только для агентов)';


--
-- Name: COLUMN ticket_comments.ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_comments.ticket_id IS 'Ссылка на тикет';


--
-- Name: COLUMN ticket_comments.author_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_comments.author_id IS 'Автор комментария (агент)';


--
-- Name: COLUMN ticket_comments.content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_comments.content IS 'Текст комментария';


--
-- Name: COLUMN ticket_comments.is_internal; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_comments.is_internal IS 'true = внутренний комментарий (только для агентов), false = внешний комментарий (публичный)';


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_comments_id_seq OWNER TO postgres;

--
-- Name: ticket_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_comments_id_seq OWNED BY public.ticket_comments.id;


--
-- Name: ticket_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_history (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    changed_by integer,
    field_name character varying(100) NOT NULL,
    old_value text,
    new_value text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_history OWNER TO postgres;

--
-- Name: TABLE ticket_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ticket_history IS 'История изменений тикетов';


--
-- Name: COLUMN ticket_history.field_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_history.field_name IS 'Имя измененного поля';


--
-- Name: COLUMN ticket_history.old_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_history.old_value IS 'Старое значение';


--
-- Name: COLUMN ticket_history.new_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_history.new_value IS 'Новое значение';


--
-- Name: ticket_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_history_id_seq OWNER TO postgres;

--
-- Name: ticket_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_history_id_seq OWNED BY public.ticket_history.id;


--
-- Name: ticket_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_notifications (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_notifications OWNER TO postgres;

--
-- Name: ticket_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_notifications_id_seq OWNER TO postgres;

--
-- Name: ticket_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_notifications_id_seq OWNED BY public.ticket_notifications.id;


--
-- Name: ticket_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_number_seq
    START WITH 1000001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_number_seq OWNER TO postgres;

--
-- Name: ticket_schedule_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_schedule_logs (
    id integer NOT NULL,
    schedule_id integer,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_ticket_id integer,
    created_ticket_number character varying(50),
    status character varying(20) NOT NULL,
    error_message text,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_schedule_logs OWNER TO postgres;

--
-- Name: ticket_schedule_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_schedule_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_schedule_logs_id_seq OWNER TO postgres;

--
-- Name: ticket_schedule_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_schedule_logs_id_seq OWNED BY public.ticket_schedule_logs.id;


--
-- Name: ticket_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_schedules (
    id integer NOT NULL,
    ticket_id integer,
    schedule_type character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    schedule_time character varying(5) DEFAULT '09:00'::character varying NOT NULL,
    schedule_days integer[],
    schedule_day_of_month integer,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true NOT NULL,
    last_run_at timestamp without time zone,
    next_run_at timestamp without time zone,
    title character varying(255),
    description text,
    type_id integer,
    category_id integer,
    priority_id integer,
    queue_id integer,
    state_id integer,
    owner_id integer,
    executor_agent_ids integer[],
    executor_group_ids integer[],
    company_id integer,
    service_id integer,
    sla_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title_prefix character varying(50) DEFAULT 'Расписание (Р) '::character varying
);


ALTER TABLE public.ticket_schedules OWNER TO postgres;

--
-- Name: ticket_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_schedules_id_seq OWNER TO postgres;

--
-- Name: ticket_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_schedules_id_seq OWNED BY public.ticket_schedules.id;


--
-- Name: ticket_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_status_history (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    from_status_id integer,
    to_status_id integer NOT NULL,
    transition_id integer,
    changed_by integer,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    transition_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    time_in_previous_status interval,
    action_label character varying(255)
);


ALTER TABLE public.ticket_status_history OWNER TO postgres;

--
-- Name: TABLE ticket_status_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ticket_status_history IS 'История переходов статусов тикетов';


--
-- Name: COLUMN ticket_status_history.ticket_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_status_history.ticket_id IS 'ID тикета';


--
-- Name: COLUMN ticket_status_history.from_status_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_status_history.from_status_id IS 'Исходный статус (NULL для начального статуса)';


--
-- Name: COLUMN ticket_status_history.to_status_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_status_history.to_status_id IS 'Новый статус';


--
-- Name: COLUMN ticket_status_history.transition_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_status_history.transition_id IS 'ID перехода из workflow_transitions (для аудита)';


--
-- Name: COLUMN ticket_status_history.changed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_status_history.changed_by IS 'Кто изменил статус';


--
-- Name: COLUMN ticket_status_history.comment; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ticket_status_history.comment IS 'Комментарий при смене статуса';


--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_status_history_id_seq OWNER TO postgres;

--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_status_history_id_seq OWNED BY public.ticket_status_history.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    ticket_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    type_id integer,
    priority_id integer,
    queue_id integer,
    state_id integer,
    owner_id integer,
    company_id integer,
    sla_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    response_deadline timestamp without time zone,
    resolution_deadline timestamp without time zone,
    first_response_at timestamp without time zone,
    sla_violated boolean DEFAULT false,
    pending_start_at timestamp without time zone,
    service_id integer,
    executor_agent_ids integer[] DEFAULT '{}'::integer[],
    executor_group_ids integer[] DEFAULT '{}'::integer[],
    category_id integer,
    observer_agent_ids integer[] DEFAULT '{}'::integer[],
    observer_group_ids integer[] DEFAULT '{}'::integer[],
    escalation_count integer DEFAULT 0,
    is_escalated boolean DEFAULT false,
    created_by_schedule_id integer
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: TABLE tickets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tickets IS 'Тикеты системы поддержки';


--
-- Name: COLUMN tickets.ticket_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.ticket_number IS 'Номер тикета';


--
-- Name: COLUMN tickets.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.title IS 'Заголовок тикета';


--
-- Name: COLUMN tickets.type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.type_id IS 'Тип тикета (ссылка на types)';


--
-- Name: COLUMN tickets.priority_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.priority_id IS 'Приоритет (ссылка на priorities)';


--
-- Name: COLUMN tickets.queue_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.queue_id IS 'Очередь (ссылка на queues)';


--
-- Name: COLUMN tickets.state_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.state_id IS 'Статус (ссылка на states)';


--
-- Name: COLUMN tickets.owner_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.owner_id IS 'Владелец/создатель (ссылка на agents)';


--
-- Name: COLUMN tickets.company_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.company_id IS 'Компания (ссылка на customers)';


--
-- Name: COLUMN tickets.sla_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.sla_id IS 'SLA (ссылка на sla)';


--
-- Name: COLUMN tickets.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.description IS 'Описание тикета (rich text)';


--
-- Name: COLUMN tickets.response_deadline; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.response_deadline IS 'Крайний срок первого ответа';


--
-- Name: COLUMN tickets.resolution_deadline; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.resolution_deadline IS 'Крайний срок решения тикета';


--
-- Name: COLUMN tickets.first_response_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.first_response_at IS 'Время первого ответа на тикет';


--
-- Name: COLUMN tickets.sla_violated; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.sla_violated IS 'Нарушен ли SLA';


--
-- Name: COLUMN tickets.pending_start_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.pending_start_at IS 'Начало ожидания от клиента';


--
-- Name: COLUMN tickets.executor_agent_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.executor_agent_ids IS 'Список ID исполнителей-агентов';


--
-- Name: COLUMN tickets.executor_group_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.executor_group_ids IS 'Список ID групп исполнителей';


--
-- Name: COLUMN tickets.category_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.category_id IS 'Категория тикета (ссылка на type_categories)';


--
-- Name: COLUMN tickets.observer_agent_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.observer_agent_ids IS 'ID агентов-наблюдателей';


--
-- Name: COLUMN tickets.observer_group_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.observer_group_ids IS 'ID групп-наблюдателей';


--
-- Name: COLUMN tickets.escalation_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.escalation_count IS 'Количество эскалаций тикета';


--
-- Name: COLUMN tickets.is_escalated; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.is_escalated IS 'Флаг эскалированности тикета';


--
-- Name: COLUMN tickets.created_by_schedule_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tickets.created_by_schedule_id IS 'ID расписания, по которому был создан тикет';


--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: translation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.translation (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.translation OWNER TO postgres;

--
-- Name: translation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.translation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translation_id_seq OWNER TO postgres;

--
-- Name: translation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.translation_id_seq OWNED BY public.translation.id;


--
-- Name: type_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    labor_hours numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.type_categories OWNER TO postgres;

--
-- Name: TABLE type_categories; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.type_categories IS 'Категории для типов обращений';


--
-- Name: COLUMN type_categories.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.type_categories.name IS 'Название категории';


--
-- Name: COLUMN type_categories.labor_hours; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.type_categories.labor_hours IS 'Время трудозатрат (в часах)';


--
-- Name: type_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_categories_id_seq OWNER TO postgres;

--
-- Name: type_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_categories_id_seq OWNED BY public.type_categories.id;


--
-- Name: type_category_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_category_relations (
    id integer NOT NULL,
    type_id integer NOT NULL,
    category_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.type_category_relations OWNER TO postgres;

--
-- Name: TABLE type_category_relations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.type_category_relations IS 'Связь между типами и категориями (many-to-many)';


--
-- Name: type_category_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_category_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_category_relations_id_seq OWNER TO postgres;

--
-- Name: type_category_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_category_relations_id_seq OWNED BY public.type_category_relations.id;


--
-- Name: types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    workflow_id integer,
    category_ids integer[] DEFAULT '{}'::integer[]
);


ALTER TABLE public.types OWNER TO postgres;

--
-- Name: COLUMN types.workflow_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.types.workflow_id IS 'ID воркфлоу, определяющего жизненный цикл для этого типа тикетов';


--
-- Name: COLUMN types.category_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.types.category_ids IS 'Массив ID категорий типа';


--
-- Name: types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.types_id_seq OWNER TO postgres;

--
-- Name: types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.types_id_seq OWNED BY public.types.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    email character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_groups_roles_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_groups_roles_settings (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users_groups_roles_settings OWNER TO postgres;

--
-- Name: users_groups_roles_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_groups_roles_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_groups_roles_settings_id_seq OWNER TO postgres;

--
-- Name: users_groups_roles_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_groups_roles_settings_id_seq OWNED BY public.users_groups_roles_settings.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.version (
    version integer NOT NULL,
    maintained_on timestamp with time zone,
    cron_on timestamp with time zone,
    monitored_on timestamp with time zone
);


ALTER TABLE public.version OWNER TO postgres;

--
-- Name: web_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.web_services (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    endpoint character varying(255),
    method character varying(255),
    last_tested character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.web_services OWNER TO postgres;

--
-- Name: web_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.web_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.web_services_id_seq OWNER TO postgres;

--
-- Name: web_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.web_services_id_seq OWNED BY public.web_services.id;


--
-- Name: workflow_transitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_transitions (
    id integer NOT NULL,
    workflow_id integer NOT NULL,
    source_status_id integer,
    target_status_id integer NOT NULL,
    action_label character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflow_transitions OWNER TO postgres;

--
-- Name: TABLE workflow_transitions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.workflow_transitions IS 'Правила переходов между статусами';


--
-- Name: COLUMN workflow_transitions.workflow_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflow_transitions.workflow_id IS 'ID воркфлоу, к которому относится переход';


--
-- Name: COLUMN workflow_transitions.source_status_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflow_transitions.source_status_id IS 'Исходный статус (NULL = начальный статус для нового тикета)';


--
-- Name: COLUMN workflow_transitions.target_status_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflow_transitions.target_status_id IS 'Целевой статус (обязательно)';


--
-- Name: COLUMN workflow_transitions.action_label; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflow_transitions.action_label IS 'Текст кнопки действия (например: "Взять в работу", "Закрыть")';


--
-- Name: COLUMN workflow_transitions.sort_order; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflow_transitions.sort_order IS 'Порядок отображения кнопок';


--
-- Name: workflow_transitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_transitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_transitions_id_seq OWNER TO postgres;

--
-- Name: workflow_transitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_transitions_id_seq OWNED BY public.workflow_transitions.id;


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflows (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflows OWNER TO postgres;

--
-- Name: TABLE workflows; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.workflows IS 'Логические группы правил для управления жизненным циклом тикетов';


--
-- Name: COLUMN workflows.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflows.name IS 'Название воркфлоу (например: Bug Workflow, Incident Workflow)';


--
-- Name: COLUMN workflows.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.workflows.description IS 'Описание назначения воркфлоу';


--
-- Name: workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflows_id_seq OWNER TO postgres;

--
-- Name: workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflows_id_seq OWNED BY public.workflows.id;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE ATTACH; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 FOR VALUES IN ('__pgboss__send-it');


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c; Type: TABLE ATTACH; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c FOR VALUES IN ('test-queue');


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job ATTACH PARTITION public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 FOR VALUES IN ('__pgboss__send-it');


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job ATTACH PARTITION public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c FOR VALUES IN ('test-queue');


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job ATTACH PARTITION public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f FOR VALUES IN ('process-ticket-schedules');


--
-- Name: acl id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acl ALTER COLUMN id SET DEFAULT nextval('public.acl_id_seq'::regclass);


--
-- Name: acls id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acls ALTER COLUMN id SET DEFAULT nextval('public.acls_id_seq'::regclass);


--
-- Name: admin_notification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notification ALTER COLUMN id SET DEFAULT nextval('public.admin_notification_id_seq'::regclass);


--
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- Name: agents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents ALTER COLUMN id SET DEFAULT nextval('public.agents_id_seq'::regclass);


--
-- Name: agents_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups ALTER COLUMN id SET DEFAULT nextval('public.agents_groups_id_seq'::regclass);


--
-- Name: agents_groups_agents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_agents ALTER COLUMN id SET DEFAULT nextval('public.agents_groups_agents_id_seq'::regclass);


--
-- Name: agents_groups_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_roles ALTER COLUMN id SET DEFAULT nextval('public.agents_groups_roles_id_seq'::regclass);


--
-- Name: agents_queues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_queues ALTER COLUMN id SET DEFAULT nextval('public.agents_queues_id_seq'::regclass);


--
-- Name: agents_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_roles ALTER COLUMN id SET DEFAULT nextval('public.agents_roles_id_seq'::regclass);


--
-- Name: appointment_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_notifications ALTER COLUMN id SET DEFAULT nextval('public.appointment_notifications_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: auto_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto_responses ALTER COLUMN id SET DEFAULT nextval('public.auto_responses_id_seq'::regclass);


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: calendars id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendars ALTER COLUMN id SET DEFAULT nextval('public.calendars_id_seq'::regclass);


--
-- Name: communication_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_log ALTER COLUMN id SET DEFAULT nextval('public.communication_log_id_seq'::regclass);


--
-- Name: communication_notifications_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_notifications_settings ALTER COLUMN id SET DEFAULT nextval('public.communication_notifications_settings_id_seq'::regclass);


--
-- Name: customer_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users ALTER COLUMN id SET DEFAULT nextval('public.customer_users_id_seq'::regclass);


--
-- Name: customer_users_customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_customers ALTER COLUMN id SET DEFAULT nextval('public.customer_users_customers_id_seq'::regclass);


--
-- Name: customer_users_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_groups ALTER COLUMN id SET DEFAULT nextval('public.customer_users_groups_id_seq'::regclass);


--
-- Name: customer_users_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_services ALTER COLUMN id SET DEFAULT nextval('public.customer_users_services_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: customers_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_groups ALTER COLUMN id SET DEFAULT nextval('public.customers_groups_id_seq'::regclass);


--
-- Name: customers_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_services ALTER COLUMN id SET DEFAULT nextval('public.customers_services_id_seq'::regclass);


--
-- Name: dynamic_fields id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dynamic_fields ALTER COLUMN id SET DEFAULT nextval('public.dynamic_fields_id_seq'::regclass);


--
-- Name: dynamic_fields_screens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dynamic_fields_screens ALTER COLUMN id SET DEFAULT nextval('public.dynamic_fields_screens_id_seq'::regclass);


--
-- Name: dynamicfields id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dynamicfields ALTER COLUMN id SET DEFAULT nextval('public.dynamicfields_id_seq'::regclass);


--
-- Name: email_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_addresses ALTER COLUMN id SET DEFAULT nextval('public.email_addresses_id_seq'::regclass);


--
-- Name: general_catalog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_catalog ALTER COLUMN id SET DEFAULT nextval('public.general_catalog_id_seq'::regclass);


--
-- Name: generic_agent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_agent ALTER COLUMN id SET DEFAULT nextval('public.generic_agent_id_seq'::regclass);


--
-- Name: greetings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.greetings ALTER COLUMN id SET DEFAULT nextval('public.greetings_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: knowledge_base id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base ALTER COLUMN id SET DEFAULT nextval('public.knowledge_base_id_seq'::regclass);


--
-- Name: oauth2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth2 ALTER COLUMN id SET DEFAULT nextval('public.oauth2_id_seq'::regclass);


--
-- Name: package_manager id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_manager ALTER COLUMN id SET DEFAULT nextval('public.package_manager_id_seq'::regclass);


--
-- Name: performance_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_log ALTER COLUMN id SET DEFAULT nextval('public.performance_log_id_seq'::regclass);


--
-- Name: pgp_keys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pgp_keys ALTER COLUMN id SET DEFAULT nextval('public.pgp_keys_id_seq'::regclass);


--
-- Name: post_master_filters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_master_filters ALTER COLUMN id SET DEFAULT nextval('public.post_master_filters_id_seq'::regclass);


--
-- Name: post_master_mail_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_master_mail_accounts ALTER COLUMN id SET DEFAULT nextval('public.post_master_mail_accounts_id_seq'::regclass);


--
-- Name: priorities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.priorities ALTER COLUMN id SET DEFAULT nextval('public.priorities_id_seq'::regclass);


--
-- Name: process_management id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_management ALTER COLUMN id SET DEFAULT nextval('public.process_management_id_seq'::regclass);


--
-- Name: processes_automation_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processes_automation_settings ALTER COLUMN id SET DEFAULT nextval('public.processes_automation_settings_id_seq'::regclass);


--
-- Name: queue_auto_response id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_auto_response ALTER COLUMN id SET DEFAULT nextval('public.queue_auto_response_id_seq'::regclass);


--
-- Name: queues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues ALTER COLUMN id SET DEFAULT nextval('public.queues_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: roles_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_groups ALTER COLUMN id SET DEFAULT nextval('public.roles_groups_id_seq'::regclass);


--
-- Name: schedule_execution_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_execution_logs ALTER COLUMN id SET DEFAULT nextval('public.schedule_execution_logs_id_seq'::regclass);


--
-- Name: service_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_attachments ALTER COLUMN id SET DEFAULT nextval('public.service_attachments_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: services_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_attachments ALTER COLUMN id SET DEFAULT nextval('public.services_attachments_id_seq'::regclass);


--
-- Name: session_management id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_management ALTER COLUMN id SET DEFAULT nextval('public.session_management_id_seq'::regclass);


--
-- Name: signatures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signatures ALTER COLUMN id SET DEFAULT nextval('public.signatures_id_seq'::regclass);


--
-- Name: sla id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla ALTER COLUMN id SET DEFAULT nextval('public.sla_id_seq'::regclass);


--
-- Name: sla_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla_services ALTER COLUMN id SET DEFAULT nextval('public.sla_services_id_seq'::regclass);


--
-- Name: smime_certificates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smime_certificates ALTER COLUMN id SET DEFAULT nextval('public.smime_certificates_id_seq'::regclass);


--
-- Name: sql_box id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sql_box ALTER COLUMN id SET DEFAULT nextval('public.sql_box_id_seq'::regclass);


--
-- Name: state_transitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_transitions ALTER COLUMN id SET DEFAULT nextval('public.state_transitions_id_seq'::regclass);


--
-- Name: states id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states ALTER COLUMN id SET DEFAULT nextval('public.states_id_seq'::regclass);


--
-- Name: support_data_collector id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_data_collector ALTER COLUMN id SET DEFAULT nextval('public.support_data_collector_id_seq'::regclass);


--
-- Name: system_configuration id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configuration ALTER COLUMN id SET DEFAULT nextval('public.system_configuration_id_seq'::regclass);


--
-- Name: system_file_support id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_file_support ALTER COLUMN id SET DEFAULT nextval('public.system_file_support_id_seq'::regclass);


--
-- Name: system_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_log ALTER COLUMN id SET DEFAULT nextval('public.system_log_id_seq'::regclass);


--
-- Name: system_maintenance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_maintenance ALTER COLUMN id SET DEFAULT nextval('public.system_maintenance_id_seq'::regclass);


--
-- Name: template_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_attachments ALTER COLUMN id SET DEFAULT nextval('public.template_attachments_id_seq'::regclass);


--
-- Name: template_queues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_queues ALTER COLUMN id SET DEFAULT nextval('public.template_queues_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: test_entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_entities ALTER COLUMN id SET DEFAULT nextval('public.test_entities_id_seq'::regclass);


--
-- Name: ticket_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments ALTER COLUMN id SET DEFAULT nextval('public.ticket_attachments_id_seq'::regclass);


--
-- Name: ticket_attribute_relations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attribute_relations ALTER COLUMN id SET DEFAULT nextval('public.ticket_attribute_relations_id_seq'::regclass);


--
-- Name: ticket_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN id SET DEFAULT nextval('public.ticket_comments_id_seq'::regclass);


--
-- Name: ticket_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history ALTER COLUMN id SET DEFAULT nextval('public.ticket_history_id_seq'::regclass);


--
-- Name: ticket_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_notifications ALTER COLUMN id SET DEFAULT nextval('public.ticket_notifications_id_seq'::regclass);


--
-- Name: ticket_schedule_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedule_logs ALTER COLUMN id SET DEFAULT nextval('public.ticket_schedule_logs_id_seq'::regclass);


--
-- Name: ticket_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedules ALTER COLUMN id SET DEFAULT nextval('public.ticket_schedules_id_seq'::regclass);


--
-- Name: ticket_status_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history ALTER COLUMN id SET DEFAULT nextval('public.ticket_status_history_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: translation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation ALTER COLUMN id SET DEFAULT nextval('public.translation_id_seq'::regclass);


--
-- Name: type_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_categories ALTER COLUMN id SET DEFAULT nextval('public.type_categories_id_seq'::regclass);


--
-- Name: type_category_relations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_category_relations ALTER COLUMN id SET DEFAULT nextval('public.type_category_relations_id_seq'::regclass);


--
-- Name: types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.types ALTER COLUMN id SET DEFAULT nextval('public.types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: users_groups_roles_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_roles_settings ALTER COLUMN id SET DEFAULT nextval('public.users_groups_roles_settings_id_seq'::regclass);


--
-- Name: web_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.web_services ALTER COLUMN id SET DEFAULT nextval('public.web_services_id_seq'::regclass);


--
-- Name: workflow_transitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_transitions ALTER COLUMN id SET DEFAULT nextval('public.workflow_transitions_id_seq'::regclass);


--
-- Name: workflows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows ALTER COLUMN id SET DEFAULT nextval('public.workflows_id_seq'::regclass);


--
-- Data for Name: archive; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.archive (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy, archived_on) FROM stdin;
\.


--
-- Data for Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
a619b1a4-6e71-4e72-ae20-efae9fd21e1a	test-queue	0	{"test": true}	completed	2	0	0	f	2026-04-09 23:10:39.946559+03	2026-04-09 23:10:41.94828+03	\N	\N	00:15:00	2026-04-09 23:10:39.946559+03	2026-04-09 23:10:41.956402+03	2026-04-23 23:10:39.946559+03	\N	\N	standard
\.


--
-- Data for Name: queue; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.queue (name, policy, retry_limit, retry_delay, retry_backoff, expire_seconds, retention_minutes, dead_letter, partition_name, created_on, updated_on) FROM stdin;
__pgboss__send-it	standard	\N	\N	\N	\N	\N	\N	j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3	2026-04-09 22:13:37.897967+03	2026-04-09 22:13:37.897967+03
test-queue	standard	\N	\N	\N	\N	\N	\N	j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c	2026-04-09 23:10:39.918807+03	2026-04-09 23:10:39.918807+03
\.


--
-- Data for Name: schedule; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.schedule (name, cron, timezone, data, options, created_on, updated_on) FROM stdin;
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.subscription (event, name, created_on, updated_on) FROM stdin;
\.


--
-- Data for Name: version; Type: TABLE DATA; Schema: pgboss; Owner: postgres
--

COPY pgboss.version (version, maintained_on, cron_on, monitored_on) FROM stdin;
24	2026-04-09 22:44:54.566671+03	2026-04-09 23:10:39.919979+03	\N
\.


--
-- Data for Name: acl; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acl (id, name, description, permissions, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: acls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acls (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admin_notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_notification (id, name, message, is_active, created_at, updated_at) FROM stdin;
1	екнек	некнк	f	2026-01-18 22:40:16.555182	2026-01-18 22:43:21.661697
\.


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_notifications (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, is_active, created_at, updated_at, first_name, last_name, login, password, email, mobile_phone, telegram_account, avatar) FROM stdin;
65	t	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118	Виктория	Козлова	kozlova	password123	kozlova@dreamdesc.ru	+7 (999) 100-12-12	@kozlova	\N
66	t	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118	Павел	Соловьев	soloviev	password123	soloviev@dreamdesc.ru	+7 (999) 100-13-13	@soloviev	\N
67	t	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118	Юлия	Васильева	vasilieva	password123	vasilieva@dreamdesc.ru	+7 (999) 100-14-14	@vasilieva	\N
69	t	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118	Светлана	Павлова	pavlova	password123	pavlova@dreamdesc.ru	+7 (999) 100-16-16	@pavlova	\N
57	t	2026-03-09 14:19:15.455118	2026-03-09 17:23:56.563831	Елена	Кузнецова	kuznetsova	password123	kuznetsova@dreamdesc.ru	+7 (999) 100-04-04	@kuznetsova	\N
58	t	2026-03-09 14:19:15.455118	2026-03-09 17:24:13.229017	Дмитрий	Васильев	vasilev	password123	vasilev@dreamdesc.ru	+7 (999) 100-05-05	@vasilev	\N
56	t	2026-03-09 14:19:15.455118	2026-03-09 21:08:55.983095	Алексей	Сидоров	sidorov	password123	sidorov@dreamdesc.ru	+7 (999) 100-03-03	@sidorov	\N
62	t	2026-03-09 14:19:15.455118	2026-03-09 21:09:12.759931	Сергей	Попов	popov	password123	popov@dreamdesc.ru	+7 (999) 100-09-09	@popov	\N
70	t	2026-03-09 17:06:56.9113	2026-03-09 17:06:56.9113	Е5Е4	45Е45Е						\N
55	t	2026-03-09 14:19:15.455118	2026-04-03 12:44:25.31603	Иван	Иванов	ivanov	password123	ivanov@dreamdesc.ru	+7 (999) 100-01-01	@ivanov	\N
60	t	2026-03-09 14:19:15.455118	2026-04-03 12:50:00.970139	Андрей	Новиков	novikov	Qwerty123	novikov@dreamdesc.ru	+7 (999) 100-07-07	@novikov	\N
68	t	2026-03-09 14:19:15.455118	2026-04-11 19:09:56.922346	Артем	Зайцев	zaitsev	password123	zaitsev@dreamdesc.ru	+7 (999) 100-15-15	@zaitsev	/avatars/avatar1.png
61	t	2026-03-09 14:19:15.455118	2026-04-11 19:10:48.344146	Татьяна	Федорова	fedorova	password123	fedorova@dreamdesc.ru	+7 (999) 100-08-08	@fedorova	/avatars/avatar1.png
63	t	2026-03-09 14:19:15.455118	2026-04-11 19:23:03.877753	Анна	Соколова	sokolova	password123	sokolova@dreamdesc.ru	+7 (999) 100-10-10	@sokolova	/avatars/avatar5.png
59	t	2026-03-09 14:19:15.455118	2026-04-11 20:59:22.997416	Ольга	Морозова	morozova	$2b$10$MDSd15m/gM4dPT0F/l1jFu3tVEK3XB7zsb.TooxJPengdf7.BwIQy	morozova@dreamdesc.ru	+7 (999) 100-06-08	@morozova	/avatars/avatar2.png
64	t	2026-03-09 14:19:15.455118	2026-04-11 21:01:16.323721	Михаил	Лебедев	lebedev	$2b$10$59Ld41BYCnWgo/Q98LkLyOolkttwFadt6AGg.vPSJwv7WI7AFxSfS	lebedev@dreamdesc.ru	+7 (999) 100-11-11	@lebedev	\N
\.


--
-- Data for Name: agents_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents_groups (id, name, is_active, created_at, updated_at, role_id) FROM stdin;
111	Вторая линия поддержки	t	2026-03-09 14:19:15.455118	2026-03-09 17:57:53.511475	2
112	Технический отдел	t	2026-03-09 14:19:15.455118	2026-03-09 17:58:35.614152	10
113	Отдел продаж	t	2026-03-09 14:19:15.455118	2026-03-09 17:58:48.195301	2
114	Менеджеры проектов	t	2026-03-09 14:19:15.455118	2026-03-09 21:07:35.69037	2
115	ллллл	t	2026-03-18 23:53:42.324526	2026-03-18 23:53:42.324526	7
110	Первая линия поддержки	t	2026-03-09 14:19:15.455118	2026-04-06 14:10:20.325897	11
\.


--
-- Data for Name: agents_groups_agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents_groups_agents (id, agents_group_id, agent_id, created_at, updated_at) FROM stdin;
591	111	61	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
593	113	63	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
594	112	64	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
595	113	65	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
596	111	66	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
597	114	67	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
598	112	68	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118
604	111	70	2026-03-09 17:07:19.778869	2026-03-09 17:07:19.778869
605	113	57	2026-03-09 17:23:56.596357	2026-03-09 17:23:56.596357
606	112	58	2026-03-09 17:24:13.258998	2026-03-09 17:24:13.258998
607	113	58	2026-03-09 17:24:13.258998	2026-03-09 17:24:13.258998
608	114	58	2026-03-09 17:24:13.258998	2026-03-09 17:24:13.258998
611	113	56	2026-03-09 21:08:56.028811	2026-03-09 21:08:56.028811
612	114	56	2026-03-09 21:08:56.028811	2026-03-09 21:08:56.028811
615	113	62	2026-03-09 21:09:12.794666	2026-03-09 21:09:12.794666
616	111	63	2026-03-09 21:09:45.49283	2026-03-09 21:09:45.49283
617	111	64	2026-03-10 23:43:02.415437	2026-03-10 23:43:02.415437
629	110	59	2026-04-06 14:08:40.357156	2026-04-06 14:08:40.357156
630	110	66	2026-04-06 14:10:12.514995	2026-04-06 14:10:12.514995
631	110	65	2026-04-06 14:10:15.249025	2026-04-06 14:10:15.249025
632	110	67	2026-04-06 14:10:18.354934	2026-04-06 14:10:18.354934
\.


--
-- Data for Name: agents_groups_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents_groups_roles (id, agents_group_id, role_id, created_at) FROM stdin;
2	112	10	2026-03-09 17:28:14.162385
3	113	2	2026-03-09 17:28:14.162385
8	111	2	2026-03-09 17:57:53.534231
9	114	2	2026-03-09 21:07:35.705237
10	114	4	2026-03-09 21:07:35.70794
11	114	6	2026-03-09 21:07:35.70878
12	115	7	2026-03-18 23:53:42.33588
13	115	10	2026-03-18 23:53:42.340959
17	110	11	2026-04-06 14:10:20.365968
\.


--
-- Data for Name: agents_queues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents_queues (id, agent_id, queue_id, created_at) FROM stdin;
\.


--
-- Data for Name: agents_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents_roles (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: appointment_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointment_notifications (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: archive; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archive (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy, archived_on) FROM stdin;
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, name, file_name, type, comment, is_active, created_at, updated_at) FROM stdin;
7	ПА	icons8-docx-file-50.jpg	1		t	2026-01-23 12:58:43.055493	2026-01-23 13:02:01.590646
\.


--
-- Data for Name: auto_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auto_responses (id, name, trigger, response, delay, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_events (id, calendar_id, title, start, event_end, all_day, description, created_at, updated_at) FROM stdin;
536	4	Рабочие часы	2026-01-01 09:00:00	2026-01-01 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
537	4	Рабочие часы	2026-01-02 09:00:00	2026-01-02 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
538	4	Рабочие часы	2026-01-05 09:00:00	2026-01-05 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
539	4	Рабочие часы	2026-01-06 09:00:00	2026-01-06 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
540	4	Рабочие часы	2026-01-07 09:00:00	2026-01-07 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
541	4	Рабочие часы	2026-01-08 09:00:00	2026-01-08 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
542	4	Рабочие часы	2026-01-09 09:00:00	2026-01-09 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
543	4	Рабочие часы	2026-01-12 09:00:00	2026-01-12 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
544	4	Рабочие часы	2026-01-13 09:00:00	2026-01-13 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
545	4	Рабочие часы	2026-01-14 09:00:00	2026-01-14 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
546	4	Рабочие часы	2026-01-15 09:00:00	2026-01-15 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
547	4	Рабочие часы	2026-01-16 09:00:00	2026-01-16 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
548	4	Рабочие часы	2026-01-19 09:00:00	2026-01-19 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
549	4	Рабочие часы	2026-01-20 09:00:00	2026-01-20 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
550	4	Рабочие часы	2026-01-21 09:00:00	2026-01-21 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
551	4	Рабочие часы	2026-01-22 09:00:00	2026-01-22 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
552	4	Рабочие часы	2026-01-23 09:00:00	2026-01-23 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
553	4	Рабочие часы	2026-01-26 09:00:00	2026-01-26 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
554	4	Рабочие часы	2026-01-27 09:00:00	2026-01-27 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
555	4	Рабочие часы	2026-01-28 09:00:00	2026-01-28 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
556	4	Рабочие часы	2026-01-29 09:00:00	2026-01-29 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
557	4	Рабочие часы	2026-01-30 09:00:00	2026-01-30 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
558	4	Рабочие часы	2026-02-02 09:00:00	2026-02-02 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
559	4	Рабочие часы	2026-02-03 09:00:00	2026-02-03 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
560	4	Рабочие часы	2026-02-04 09:00:00	2026-02-04 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
561	4	Рабочие часы	2026-02-05 09:00:00	2026-02-05 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
562	4	Рабочие часы	2026-02-06 09:00:00	2026-02-06 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
563	4	Рабочие часы	2026-02-09 09:00:00	2026-02-09 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
564	4	Рабочие часы	2026-02-10 09:00:00	2026-02-10 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
565	4	Рабочие часы	2026-02-11 09:00:00	2026-02-11 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
566	4	Рабочие часы	2026-02-12 09:00:00	2026-02-12 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
567	4	Рабочие часы	2026-02-13 09:00:00	2026-02-13 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
568	4	Рабочие часы	2026-02-16 09:00:00	2026-02-16 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
569	4	Рабочие часы	2026-02-17 09:00:00	2026-02-17 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
570	4	Рабочие часы	2026-02-18 09:00:00	2026-02-18 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
571	4	Рабочие часы	2026-02-19 09:00:00	2026-02-19 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
572	4	Рабочие часы	2026-02-20 09:00:00	2026-02-20 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
573	4	Рабочие часы	2026-02-23 09:00:00	2026-02-23 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
574	4	Рабочие часы	2026-02-24 09:00:00	2026-02-24 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
575	4	Рабочие часы	2026-02-25 09:00:00	2026-02-25 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
576	4	Рабочие часы	2026-02-26 09:00:00	2026-02-26 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
577	4	Рабочие часы	2026-02-27 09:00:00	2026-02-27 18:00:00	f		2026-01-23 07:47:12.043462	2026-01-23 07:47:12.043462
\.


--
-- Data for Name: calendars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendars (id, name, description, timezone, work_hours, is_active, created_at, updated_at, work_hours_from, work_hours_to, work_days_per_week, color, date_from, date_to, include_weekends) FROM stdin;
4	Название	Описание	Europe/Moscow	\N	t	2026-01-23 06:32:37.803528	2026-01-23 08:18:49.766336	09:00:00	18:00:00	5	#b92222	2026-01-01	2026-03-01	f
\.


--
-- Data for Name: communication_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communication_log (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: communication_notifications_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communication_notifications_settings (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_users (id, is_active, created_at, updated_at, first_name, last_name, login, password, email, mobile_phone, telegram_account, customer_id, customers_group_id) FROM stdin;
1	t	2026-02-24 14:34:29.362075	2026-03-05 22:23:01.948871	Иван	Иванов	admin@demo.com		ivanov@example.com	+79629007676		\N	1
85	t	2026-03-05 08:36:45.899577	2026-03-05 23:10:31.766039	Борис	Иванов	бориван	\N	борис.иванов@mail.com	+7 (958) 520-15-22	@user2128	\N	6
34	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Екатерина	Попова	ека_попо28	\N	екатерина.попова@mail.com	8 (591) 931-96-92	@user4781	\N	5
7	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Иван	Павлов	ива.павл	\N	иван.павлов@org.net	8 (897) 468-15-75	@dev8823	\N	4
75	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Олег	Попов	оле.попо	\N	олег.попов@corp.io	8 (443) 574-94-70	@user1216	\N	7
35	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Виктор	Кузнецов	вик_кузн55	\N	виктор.кузнецов@org.net	8 (598) 473-78-94	@user5964	\N	5
36	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Елена	Смирнова	елесмир	\N	елена.смирнова@org.net	+7 (551) 166-52-76	@admin9601	\N	5
37	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Дмитрий	Николаев	дми_нико98	\N	дмитрий.николаев@mail.com	8 (520) 503-72-35	@dmitry9639	\N	5
38	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Марина	Петрова	мар.петр	\N	марина.петрова@corp.io	8 (566) 540-82-93	@sergey4469	\N	5
41	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Юрий	Романов	юри_рома11	\N	юрий.романов@example.com	+7 (724) 157-95-73	@manager1985	\N	5
42	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Вера	Макарова	вермака	\N	вера.макарова@corp.io	+7 (366) 815-18-17	@manager5349	\N	5
33	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Антон	Петров	ант.петр	\N	антон.петров@corp.io	8 (946) 916-73-25	@sergey4497	\N	5
5	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Илья	Макаров	иль.мака	\N	илья.макаров@corp.io	+7 (852) 424-96-49	@sergey5330	\N	4
6	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Юлия	Иванова	юли.иван	\N	юлия.иванова@org.net	8 (128) 520-63-10	@admin8441	\N	4
8	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Алиса	Николаева	али_нико9	\N	алиса.николаева@company.ru	8 (619) 463-77-60	@ivan1355	\N	4
9	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Иван	Кузнецов	ивакузн	\N	иван.кузнецов@corp.io	8 (364) 469-25-71	@ivan1247	\N	4
10	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Дарья	Алексеева	даралек	\N	дарья.алексеева@org.net	8 (405) 614-57-80	@sergey6137	\N	4
11	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Юрий	Кузнецов	юри.кузн	\N	юрий.кузнецов@example.com	8 (997) 483-91-24	@admin1912	\N	4
12	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Вера	Захарова	вер.заха	\N	вера.захарова@example.com	+7 (938) 884-34-30	@user9142	\N	4
13	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Владимир	Захаров	влазаха	\N	владимир.захаров@org.net	8 (537) 215-77-62	@user9097	\N	4
14	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Вера	Петрова	вер.петр	\N	вера.петрова@org.net	+7 (272) 719-27-90	@admin9196	\N	4
15	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Николай	Попов	никпопо	\N	николай.попов@org.net	8 (460) 433-48-92	@alex9794	\N	4
16	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Екатерина	Захарова	ека.заха	\N	екатерина.захарова@example.com	8 (781) 433-28-31	@user2772	\N	4
17	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Артем	Павлов	арт.павл	\N	артем.павлов@org.net	+7 (859) 109-28-82	@ivan7061	\N	4
18	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Людмила	Иванова	люд_иван5	\N	людмила.иванова@mail.com	+7 (689) 800-95-62	@sergey3830	\N	4
19	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Илья	Петров	иль.петр	\N	илья.петров@example.com	+7 (382) 930-30-92	@dev3966	\N	4
20	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Дарья	Андреева	дар.андр	\N	дарья.андреева@mail.com	+7 (450) 183-38-26	@manager9638	\N	4
21	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Николай	Кузнецов	ник.кузн	\N	николай.кузнецов@example.com	8 (531) 730-92-24	@admin2615	\N	4
22	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Анастасия	Кузнецова	ана_кузн42	\N	анастасия.кузнецова@company.ru	8 (280) 372-95-37	@alex3794	\N	4
23	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Павел	Николаев	пав.нико	\N	павел.николаев@mail.com	8 (149) 345-69-76	@dmitry8992	\N	4
24	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Алиса	Михайлова	али.миха	\N	алиса.михайлова@org.net	+7 (104) 480-75-47	@alex6278	\N	4
25	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Михаил	Павлов	мих.павл	\N	михаил.павлов@example.com	+7 (841) 981-82-85	@ivan5450	\N	5
26	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Ирина	Васильева	ириваси	\N	ирина.васильева@example.com	+7 (568) 593-12-97	@dev1517	\N	5
27	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Антон	Андреев	ант.андр	\N	антон.андреев@corp.io	+7 (574) 102-94-64	@alex9752	\N	5
28	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Татьяна	Захарова	тат_заха39	\N	татьяна.захарова@example.com	8 (565) 187-65-50	@dev7923	\N	5
29	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Кирилл	Орлов	кир.орло	\N	кирилл.орлов@mail.com	8 (757) 819-98-80	@admin8571	\N	5
30	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Мария	Сидорова	мар.сидо	\N	мария.сидорова@corp.io	8 (776) 180-37-65	@dev6321	\N	5
31	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Евгений	Петров	евг_петр52	\N	евгений.петров@company.ru	8 (505) 290-38-96	@user7496	\N	5
32	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Ирина	Дмитриева	ири.дмит	\N	ирина.дмитриева@example.com	8 (486) 367-98-20	@dmitry3042	\N	5
43	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Виктор	Орлов	вик.орло	\N	виктор.орлов@corp.io	+7 (331) 732-98-43	@sergey3633	\N	5
44	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Дарья	Павлова	дарпавл	\N	дарья.павлова@mail.com	8 (945) 385-75-58	@sergey3186	\N	5
45	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Артем	Макаров	артмака	\N	артем.макаров@mail.com	+7 (215) 261-99-72	@dev1299	\N	6
46	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Екатерина	Захарова	ека_заха20	\N	екатерина.захарова@corp.io	8 (599) 242-36-20	@alex2690	\N	6
47	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Сергей	Андреев	сер.андр	\N	сергей.андреев@company.ru	+7 (428) 263-26-45	@user2762	\N	6
48	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Полина	Соколова	полсоко	\N	полина.соколова@example.com	+7 (301) 494-40-49	@admin9861	\N	6
49	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Антон	Алексеев	ант_алек19	\N	антон.алексеев@org.net	8 (981) 728-86-99	@dmitry4876	\N	6
50	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Юлия	Васильева	юливаси	\N	юлия.васильева@corp.io	+7 (488) 957-60-67	@manager6692	\N	6
51	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Андрей	Дмитриев	анд.дмит	\N	андрей.дмитриев@example.com	8 (501) 414-60-66	@user4104	\N	6
52	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Людмила	Соколова	людсоко	\N	людмила.соколова@example.com	8 (860) 146-27-90	@admin9577	\N	6
53	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Михаил	Соколов	михсоко	\N	михаил.соколов@org.net	8 (366) 338-24-74	@admin8718	\N	6
54	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Алиса	Павлова	али_павл86	\N	алиса.павлова@corp.io	8 (555) 952-56-25	@user6105	\N	6
55	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Илья	Соколов	иль_соко13	\N	илья.соколов@mail.com	+7 (177) 624-82-97	@user2295	\N	6
56	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Анастасия	Михайлова	ана_миха71	\N	анастасия.михайлова@company.ru	+7 (608) 146-88-78	@alex5310	\N	6
57	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Григорий	Иванов	гри.иван	\N	григорий.иванов@example.com	+7 (743) 826-96-40	@sergey1408	\N	6
58	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Галина	Павлова	гал_павл16	\N	галина.павлова@mail.com	8 (439) 417-33-33	@ivan5391	\N	6
59	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Павел	Романов	пав_рома86	\N	павел.романов@mail.com	8 (209) 488-25-61	@alex7449	\N	6
60	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Ирина	Михайлова	иримиха	\N	ирина.михайлова@mail.com	+7 (276) 112-22-95	@ivan8332	\N	6
61	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Виктор	Романов	вик_рома93	\N	виктор.романов@corp.io	+7 (624) 933-74-17	@dmitry7267	\N	6
62	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Дарья	Михайлова	дар.миха	\N	дарья.михайлова@org.net	8 (762) 380-60-84	@dmitry3876	\N	6
63	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Борис	Михайлов	бор.миха	\N	борис.михайлов@mail.com	+7 (928) 247-34-67	@alex9406	\N	6
64	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Екатерина	Захарова	еказаха	\N	екатерина.захарова@mail.com	8 (300) 515-10-25	@admin4991	\N	6
65	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Олег	Павлов	оле_павл75	\N	олег.павлов@org.net	+7 (329) 514-89-80	@admin4859	\N	7
66	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Вера	Соколова	версоко	\N	вера.соколова@org.net	+7 (712) 350-73-51	@admin5242	\N	7
67	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Кирилл	Захаров	кирзаха	\N	кирилл.захаров@company.ru	8 (636) 458-69-84	@sergey9333	\N	7
68	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Дарья	Кузнецова	дар.кузн	\N	дарья.кузнецова@corp.io	8 (817) 932-55-25	@alex7972	\N	7
69	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Юрий	Зайцев	юризайц	\N	юрий.зайцев@org.net	+7 (201) 983-37-11	@dmitry7738	\N	7
70	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Анна	Смирнова	аннсмир	\N	анна.смирнова@org.net	8 (666) 153-16-60	@admin6705	\N	7
71	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Павел	Захаров	пав.заха	\N	павел.захаров@company.ru	8 (633) 792-37-27	@alex1016	\N	7
72	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Вера	Сидорова	версидо	\N	вера.сидорова@org.net	+7 (601) 148-25-86	@sergey6366	\N	7
73	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Григорий	Макаров	гри.мака	\N	григорий.макаров@corp.io	8 (496) 155-64-52	@ivan6668	\N	7
74	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Вера	Зайцева	верзайц	\N	вера.зайцева@mail.com	+7 (115) 898-59-20	@dev5156	\N	7
76	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Елена	Попова	елепопо	\N	елена.попова@example.com	+7 (925) 532-60-75	@dmitry5067	\N	7
77	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Виктор	Смирнов	виксмир	\N	виктор.смирнов@org.net	+7 (216) 137-57-54	@alex5630	\N	7
78	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Алиса	Попова	али.попо	\N	алиса.попова@mail.com	8 (759) 914-76-87	@dev6343	\N	7
79	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Виктор	Иванов	викиван	\N	виктор.иванов@org.net	+7 (532) 222-86-54	@dmitry4593	\N	7
80	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Екатерина	Орлова	ека_орло6	\N	екатерина.орлова@company.ru	8 (425) 539-31-17	@admin6414	\N	7
81	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Евгений	Дмитриев	евг_дмит69	\N	евгений.дмитриев@corp.io	8 (850) 315-51-86	@admin3487	\N	7
82	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Надежда	Павлова	над_павл48	\N	надежда.павлова@example.com	+7 (836) 749-60-59	@ivan1460	\N	7
83	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Олег	Зайцев	олезайц	\N	олег.зайцев@org.net	+7 (274) 217-94-36	@alex3061	\N	7
84	t	2026-03-05 08:36:45.899577	2026-03-05 12:22:45.191252	Татьяна	Алексеева	тат.алек	\N	татьяна.алексеева@corp.io	+7 (629) 542-70-26	@dev6551	\N	7
39	t	2026-03-05 08:36:45.899577	2026-03-05 23:11:35.649783	Григорий	Николаев	гри.нико	\N	григорий.николаев@example.com	+7 (405) 971-75-41	@alex5476	\N	9
87	t	2026-03-05 08:36:45.899577	2026-03-05 23:11:40.575777	Юлия	Соколова	юлисоко	\N	юлия.соколова@corp.io	+7 (270) 120-47-59	@manager1814	\N	9
89	t	2026-03-05 08:36:45.899577	2026-03-05 23:11:44.829034	Ольга	Орлова	ольорло	\N	ольга.орлова@mail.com	8 (346) 242-10-15	@dev4141	\N	9
90	t	2026-03-05 08:36:45.899577	2026-03-05 23:11:49.910136	Кирилл	Фёдоров	кирфёдо	\N	кирилл.фёдоров@company.ru	8 (756) 521-88-19	@dmitry1471	\N	9
91	t	2026-03-05 08:36:45.899577	2026-03-05 23:11:52.05423	Вера	Захарова	верзаха	\N	вера.захарова@org.net	+7 (387) 495-90-17	@ivan7785	\N	9
92	t	2026-03-05 08:36:45.899577	2026-03-05 23:11:55.604895	Константин	Фёдоров	кон.фёдо	\N	константин.фёдоров@org.net	+7 (901) 337-60-66	@dev9430	\N	9
88	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:00.083804	Евгений	Кузнецов	евг_кузн58	\N	евгений.кузнецов@example.com	+7 (909) 328-40-76	@user3305	\N	9
93	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:03.243087	Дарья	Михайлова	дар_миха80	\N	дарья.михайлова@example.com	+7 (752) 714-20-88	@alex7526	\N	9
86	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:05.771412	Татьяна	Васильева	тат.васи	\N	татьяна.васильева@org.net	8 (650) 821-15-68	@user3385	\N	9
96	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:07.674043	Павел	Петров	павпетр	\N	павел.петров@mail.com	8 (422) 254-96-64	@sergey5147	\N	9
97	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:11.270949	Анна	Дмитриева	анндмит	\N	анна.дмитриева@example.com	+7 (713) 822-51-63	@manager4755	\N	9
98	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:13.169305	Артем	Захаров	арт.заха	\N	артем.захаров@company.ru	8 (374) 844-73-15	@user4517	\N	9
99	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:15.917519	Ольга	Соколова	оль.соко	\N	ольга.соколова@company.ru	+7 (404) 691-79-32	@admin3812	\N	9
100	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:19.147017	Григорий	Андреев	гри.андр	\N	григорий.андреев@example.com	8 (583) 202-93-19	@sergey7655	\N	9
95	t	2026-03-05 08:36:45.899577	2026-03-05 23:12:28.025306	Анастасия	Михайлова	ана.миха	\N	анастасия.михайлова@mail.com	+7 (653) 255-17-13	@manager1112	\N	9
94	t	2026-03-05 08:36:45.899577	2026-03-10 23:18:58.351029	Виктор	Николаев	викнико	\N	виктор.николаев@example.com	+7 (905) 358-33-23	@dmitry2879	\N	10
102	t	2026-03-05 08:36:45.899577	2026-03-10 23:19:02.432414	Андрей	Зайцев	анд.зайц	\N	андрей.зайцев@company.ru	8 (393) 827-47-15	@admin4293	\N	10
101	t	2026-03-05 08:36:45.899577	2026-03-10 23:19:06.711846	Марина	Смирнова	мар_смир80	\N	марина.смирнова@company.ru	8 (632) 907-74-27	@admin1750	\N	10
103	t	2026-03-05 08:36:45.899577	2026-03-10 23:19:08.597793	Анна	Захарова	аннзаха	\N	анна.захарова@mail.com	+7 (480) 141-96-78	@manager5887	\N	10
108	t	2026-04-03 10:51:15.618443	2026-04-03 10:51:15.618443	Новый	Сотрудник	rrr@ya.ru	\N	rrr@ya.ru	\N	\N	\N	\N
109	t	2026-04-03 10:54:03.803044	2026-04-03 10:54:03.803044	Новый	Сотрудник	werewr@dsds.ru	\N	werewr@dsds.ru	\N	\N	\N	\N
110	t	2026-04-03 11:34:19.197099	2026-04-03 11:34:19.197099	Новый	Сотрудник		\N		\N	\N	\N	\N
117	t	2026-04-03 11:58:25.10151	2026-04-03 11:58:25.10151	Новый	Сотрудник	dfd@dd.ru	\N	dfd@dd.ru	\N	\N	\N	\N
125	t	2026-04-09 12:02:28.000897	2026-04-09 12:02:28.000897	Новый	Сотрудник	nnn@dd.ru	\N	nnn@dd.ru	\N	\N	\N	\N
\.


--
-- Data for Name: customer_users_customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_users_customers (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_users_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_users_groups (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_users_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_users_services (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, street, zip, city, comment, is_active, created_at, updated_at) FROM stdin;
39	ЗАО "ОбразованиеПлюс"	ул. Чехова, 3	103009	Москва	Образовательные услуги	t	2026-03-05 13:04:01.322977	2026-03-05 13:04:01.322977
\.


--
-- Data for Name: customers_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers_groups (id, name, message, is_active, created_at, updated_at, customer_id) FROM stdin;
3	Отдел  разраблтки		t	2026-03-05 00:32:42.680555	2026-03-05 23:10:31.844947	\N
4	Отдел продаж	Группа Отдел продаж	t	2026-03-05 08:36:45.899577	2026-03-05 23:10:31.844947	\N
5	Техническая поддержка	Группа Техническая поддержка	t	2026-03-05 08:36:45.899577	2026-03-05 23:10:31.844947	\N
6	Бухгалтерия	Группа Бухгалтерия	t	2026-03-05 08:36:45.899577	2026-03-05 23:10:31.844947	\N
7	Маркетинг	Группа Маркетинг	t	2026-03-05 08:36:45.899577	2026-03-05 23:10:31.877151	\N
9	Отдел  IT		t	2026-03-05 23:11:14.477229	2026-03-05 23:11:14.477229	39
1	Отдел разработки		t	2026-03-04 15:22:41.6349	2026-03-08 16:53:42.135321	39
10	Отдел 		t	2026-03-10 23:18:45.996428	2026-03-10 23:18:45.996428	39
\.


--
-- Data for Name: customers_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers_services (id, customer_id, service_id, created_at, updated_at) FROM stdin;
42	39	33	2026-03-10 23:11:30.555296	2026-03-10 23:11:30.555296
43	39	34	2026-03-10 23:15:19.126166	2026-03-10 23:15:19.126166
44	39	37	2026-03-10 23:15:26.715027	2026-03-10 23:15:26.715027
\.


--
-- Data for Name: dynamic_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dynamic_fields (id, name, label, field_type, default_value, is_required, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dynamic_fields_screens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dynamic_fields_screens (id, name, screen_name, field_name, field_type, is_required, "position", is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dynamicfields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dynamicfields (id, name, label, fieldtype, defaultvalue, isrequired, created_at, updated_at, status, is_active) FROM stdin;
\.


--
-- Data for Name: email_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_addresses (id, name, message, is_active, created_at, updated_at, queue_id) FROM stdin;
2	Почта 1 линии 	Почта 1 линии 	t	2026-02-11 14:42:45.656827	2026-04-14 14:09:22.065381	\N
1	Почта 12 линии 	Почта 12 линии 	t	2026-02-11 14:06:38.366177	2026-04-14 14:09:38.158933	\N
\.


--
-- Data for Name: general_catalog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.general_catalog (id, name, message, is_active, created_at, updated_at) FROM stdin;
1	ug		t	2026-01-22 20:00:26.009838	2026-01-22 20:00:26.009838
\.


--
-- Data for Name: generic_agent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.generic_agent (id, name, description, trigger_type, schedule, last_run, next_run, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: greetings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.greetings (id, name, comment, is_active, created_at, updated_at, content) FROM stdin;
1	Добрый день	Стандартное приветствие для дневного времени	t	2026-01-23 08:57:43.771478	2026-01-23 08:57:43.771478	Добрый день!\n\n
2	Здравствуйте	Официальное приветствие	t	2026-01-23 08:57:43.77386	2026-01-23 08:57:43.77386	Здравствуйте!\n\n
3	Привет	Неформальное приветствие	t	2026-01-23 08:57:43.774771	2026-01-23 08:57:43.774771	Привет!\n\n
4	Доброе утро	Приветствие для утреннего времени	t	2026-01-23 08:57:43.77558	2026-01-23 08:57:43.77558	Доброе утро!\n\n
5	Добрый вечер	Приветствие для вечернего времени	t	2026-01-23 08:57:43.776249	2026-01-23 08:57:43.776249	Добрый вечер!\n\n
6	Уважаемый клиент	Официальное приветствие для клиентов	t	2026-01-23 08:57:43.776888	2026-01-23 08:57:43.776888	Уважаемый клиент!\n\n
7	Дорогой пользователь	Приветствие для пользователей системы	t	2026-01-23 08:57:43.777618	2026-01-23 08:57:43.777618	Дорогой пользователь!\n\n
8	Рады приветствовать	Теплое приветствие	t	2026-01-23 08:57:43.778301	2026-01-23 08:57:43.778301	Рады приветствовать Вас!\n\n
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
f396c3c0-a619-4adf-8707-934a412989bd	test-queue	0	{"test": true}	created	2	0	0	f	2026-04-09 23:17:52.951757+03	\N	\N	\N	01:00:00	2026-04-09 23:17:52.951757+03	\N	2026-04-23 23:17:52.951757+03	\N	\N	standard
\.


--
-- Data for Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
0c96f407-bf7e-43db-97ea-5c67105a9dcf	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:34:16.274242+03	\N	\N	\N	01:00:00	2026-04-09 23:10:56.274242+03	\N	2026-04-24 00:34:16.274242+03	\N	\N	standard
88daf815-7f66-4983-9fc5-6f8fda18fd40	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:35:18.511379+03	\N	\N	\N	01:00:00	2026-04-09 23:11:58.511379+03	\N	2026-04-24 00:35:18.511379+03	\N	\N	standard
f5027029-6ec7-41c1-af12-e8e8c4ea98d3	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:35:20.244372+03	\N	\N	\N	01:00:00	2026-04-09 23:12:00.244372+03	\N	2026-04-24 00:35:20.244372+03	\N	\N	standard
904f6316-273e-4974-a1c7-89784cb1aa4f	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:35:40.286311+03	\N	\N	\N	01:00:00	2026-04-09 23:12:20.286311+03	\N	2026-04-24 00:35:40.286311+03	\N	\N	standard
db2d46cc-7bbd-4d9e-b54f-d5ae9ad084af	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:36:09.522314+03	\N	\N	\N	01:00:00	2026-04-09 23:12:49.522314+03	\N	2026-04-24 00:36:09.522314+03	\N	\N	standard
9b858693-8f9a-45a6-8362-4ca553405ed8	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:38:09.792616+03	\N	\N	\N	01:00:00	2026-04-09 23:14:49.792616+03	\N	2026-04-24 00:38:09.792616+03	\N	\N	standard
a7d9a6a2-9f18-401d-82a8-c28f287def17	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:38:41.490663+03	\N	\N	\N	01:00:00	2026-04-09 23:15:21.490663+03	\N	2026-04-24 00:38:41.490663+03	\N	\N	standard
9e5e5bef-aff8-4434-b7b5-82f3284ee1de	process-ticket-schedules	0	{}	created	3	0	60000	f	2026-04-10 00:40:36.127719+03	\N	\N	\N	01:00:00	2026-04-09 23:17:16.127719+03	\N	2026-04-24 00:40:36.127719+03	\N	\N	standard
\.


--
-- Data for Name: knowledge_base; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_base (id, title, content, category_id, tags, service_id, is_published, views_count, created_by, created_at, updated_at, is_active) FROM stdin;
2	Работа с电子邮件 - настройка почтового ящика	<h2>Настройка почтового ящика</h2>\n<p>В этом руководстве описано как настроить почтовый ящик для работы с системой:</p>\n<h3>Шаг 1: Создание почтового ящика</h3>\n<p>Перейдите в раздел "Почтовые ящики" и нажмите "Добавить новый".</p>\n<h3>Шаг 2: Настройка параметров</h3>\n<p>Укажите:</p>\n<ul>\n<li>Email адрес</li>\n<li>Имя пользователя</li>\n<li>Пароль</li>\n<li>IMAP/SMTP серверы</li>\n</ul>\n<h3>Шаг 3: Проверка подключения</h3>\n<p>Нажмите "Проверить подключение" для верификации настроек.</p>	12	{email,почта,настройка,mail}	40	t	89	55	2026-03-22 10:56:50.179195	2026-03-22 10:56:50.179195	t
3	Настройка SLA для заявок	<h2>Что такое SLA?</h2>\n<p>SLA (Service Level Agreement) - соглашение об уровне сервиса, определяющее время реакции на заявки.</p>\n<h3>Основные параметры SLA:</h3>\n<ul>\n<li><strong>Время первого ответа</strong> - максимальное время до первого ответа</li>\n<li><strong>Время решения</strong> - максимальное время полного решения</li>\n<li><strong>Приоритет</strong> - влияет на сроки</li>\n</ul>\n<h3>Настройка в системе:</h3>\n<p>Перейдите в раздел "SLA" и создайте новое правило с нужными параметрами.</p>	12	{sla,настройка,время,приоритет}	41	t	234	55	2026-03-22 10:56:50.187395	2026-03-22 10:56:50.187395	t
4	Управление правами доступа агентов	<h2>Права доступа</h2>\n<p>Система поддерживает гибкую систему прав доступа для агентов.</p>\n<h3>Роли:</h3>\n<ul>\n<li><strong>Администратор</strong> - полный доступ</li>\n<li><strong>Супервизор</strong> - управление агентами</li>\n<li><strong>Агент</strong> - работа с заявками</li>\n</ul>\n<h3>Назначение ролей:</h3>\n<p>Перейдите в профиль агента и выберите нужную роль из списка.</p>	13	{права,доступ,роли,безопасность}	42	t	67	55	2026-03-22 10:56:50.197428	2026-03-22 10:56:50.197428	t
6	Создание шаблонов ответов	<h2>Шаблоны ответов</h2>\n<p>Шаблоны позволяют быстро отвечать на типичные обращения.</p>\n<h3>Создание шаблона:</h3>\n<ol>\n<li>Перейдите в "Шаблоны"</li>\n<li>Нажмите "Создать шаблон"</li>\n<li>Заполните название и содержание</li>\n<li>Используйте переменные: {{ticket.id}}, {{customer.name}}</li>\n</ol>\n<h3>Использование:</h3>\n<p>При ответе на заявку нажмите кнопку "Вставить шаблон" и выберите нужный.</p>	12	{шаблон,ответ,"быстрый ответ"}	44	t	145	55	2026-03-22 10:56:50.214192	2026-03-22 10:56:50.214192	t
7	Настройка уведомлений	<h2>Система уведомлений</h2>\n<p>Настройте уведомления для различных событий в системе.</p>\n<h3>Типы уведомлений:</h3>\n<ul>\n<li>Email - отправка на почту</li>\n<li>SMS - текстовые сообщения</li>\n<li>Telegram - бот уведомлений</li>\n</ul>\n<h3>Настройка:</h3>\n<p>Перейдите в "Настройки" -> "Уведомления" и настройте каналы.</p>	13	{уведомления,email,sms,telegram}	45	f	23	55	2026-03-22 10:56:50.222515	2026-03-22 10:56:50.222515	t
8	Работа с календарями и графиком	<h2>Календари</h2>\n<p>Настройте рабочее время и графики для корректного расчёта SLA.</p>\n<h3>Создание календаря:</h3>\n<ol>\n<li>Перейдите в "Календари"</li>\n<li>Создайте новый календарь</li>\n<li>Настройте рабочие часы</li>\n<li>Добавьте праздничные дни</li>\n</ol>\n<h3>Привязка к SLA:</h3>\n<p>Выберите календарь при настройке правила SLA.</p>	12	{календарь,график,"рабочее время",sla}	46	t	78	55	2026-03-22 10:56:50.229404	2026-03-22 10:56:50.229404	t
5	Интеграция с внешними системами через API	<h2>REST API</h2>\n<p>Система предоставляет REST API для интеграции с внешними системами.</p>\n<h3>Базовый URL:</h3>\n<pre><code>https://api.example.com/v1</code></pre>\n<h3>Аутентификация:</h3>\n<p>Используйте Bearer токен в заголовке:</p>\n<pre><code>Authorization: Bearer YOUR_TOKEN</code></pre>\n<h3>Основные эндпоинты:</h3>\n<ul>\n<li>GET /tickets - список заявок</li>\n<li>POST /tickets - создание заявки</li>\n<li>GET /customers - список клиентов</li>\n</ul>	14	{api,интеграция,rest,разработка}	43	t	313	55	2026-03-22 10:56:50.206779	2026-03-22 10:56:50.206779	t
1	Как создать новую заявку в системе	<h2>Создание новой заявки</h2>\n<p>Для создания новой заявки выполните следующие шаги:</p>\n<ol>\n<li>Перейдите в раздел "Заявки"</li>\n<li>Нажмите кнопку "Создать заявку"</li>\n<li>Заполните обязательные поля:\n    <ul>\n    <li>Тема заявки</li>\n    <li>Описание проблемы</li>\n    <li>Приоритет</li>\n    </ul>\n</li>\n<li>Нажмите "Создать"</li>\n</ol>\n<p>После создания заявки ей будет присвоен уникальный номер и статус "Новая".</p>	14	{заявка,создание,тикет,инструкция}	39	t	157	55	2026-03-22 10:56:50.165804	2026-04-11 17:18:57.464125	t
9	Часто задаваемые вопросы (FAQ)	<h2>FAQ - Часто задаваемые вопросы</h2>\n<h3>Как сбросить пароль?</h3>\n<p>Нажмите "Забыли пароль" на странице входа.</p>\n<h3>Как изменить язык интерфейса?</h3>\n<p>Перейдите в профиль -> Настройки -> Язык.</p>\n<h3>Почему я не вижу заявки?</h3>\n<p>Проверьте ваши права доступа и группу агентов.</p>\n<h3>Как экспортировать данные?</h3>\n<p>Используйте кнопку "Экспорт" в нужном разделе.</p>	15	{faq,вопросы,помощь,поддержка}	39	t	570	55	2026-03-22 10:56:50.23711	2026-03-22 10:56:50.23711	t
10	Миграция данных из другой системы	<h2>Миграция данных</h2>\n<p>Руководство по переносу данных из другой системы поддержки.</p>\n<h3>Подготовка:</h3>\n<ul>\n<li>Экспортируйте данные в CSV/JSON</li>\n<li>Проверьте формат полей</li>\n<li>Создайте резервную копию</p>\n<h3>Импорт:</h3>\n<p>Используйте инструмент миграции в разделе "Настройки" -> "Миграция".</p>\n<h3>После миграции:</h3>\n<ul>\n<li>Проверьте целостность данных</li>\n<li>Обновите нумерацию заявок</li>\n<li>Настройте права доступа</li>\n</ul>	13	{миграция,импорт,данные,перенос}	47	t	46	55	2026-03-22 10:56:50.243696	2026-03-22 10:56:50.243696	t
11	Отвтет1	<p>Текст ответа 1</p>	1	\N	45	t	2	\N	2026-04-11 17:22:42.331786	2026-04-11 17:34:38.950047	t
12	Ответ 2	<p>Ответ 2</p>	1	\N	45	t	4	\N	2026-04-11 17:34:25.074344	2026-04-11 17:35:15.941361	t
\.


--
-- Data for Name: oauth2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oauth2 (id, name, client_id, client_secret, authorization_url, token_url, scopes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: package_manager; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_manager (id, name, description, version, author, is_installed, is_upgradable, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: performance_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_log (id, name, message, is_active, created_at, updated_at) FROM stdin;
1	гшщ	гшщ	t	2026-01-23 08:20:50.645728	2026-01-23 08:20:50.645728
\.


--
-- Data for Name: pgp_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pgp_keys (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: post_master_filters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_master_filters (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: post_master_mail_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_master_mail_accounts (id, is_active, created_at, updated_at, type, authentication_type, login, password, host, imap_folder, trusted, dispatching_by, queue_id, comment, oauth2_token_config_id, name) FROM stdin;
3	t	2026-02-11 16:38:51.755544	2026-04-14 11:52:43.547413	IMAP	password	test@example.com	test123	mail.example.com	INBOX	t	Queue	\N	Test account	12	Почта 1 линии
\.


--
-- Data for Name: priorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.priorities (id, name, color, is_active, created_at, updated_at) FROM stdin;
4	Критический	#dc3545	t	2026-01-19 11:55:29.571122	2026-01-19 11:55:29.571122
5	Очень низкий	#6c757d	t	2026-01-19 11:55:29.575383	2026-01-19 11:55:29.575383
6	Очень высокий	#e83e8c	t	2026-01-19 11:57:26.133467	2026-01-19 11:57:26.133467
7	Срочный	#fd7e14	t	2026-01-19 11:57:26.139886	2026-01-19 11:57:26.139886
8	Блокирующий	#343a40	t	2026-01-19 11:57:26.144136	2026-01-19 11:57:26.144136
9	Нормальный	#007bff	t	2026-01-19 11:57:26.1482	2026-01-19 11:57:26.1482
10	Минимальный	#6c757d	t	2026-01-19 11:57:26.152191	2026-01-19 11:57:26.152191
1	Низкий	#28a745	t	2026-01-19 11:55:29.552544	2026-01-19 11:58:15.124861
2	Средний	#ffc107	f	2026-01-19 11:55:29.561287	2026-01-19 12:12:44.084324
3	Высокий	#fd7e14	f	2026-01-19 11:55:29.565849	2026-01-19 12:12:44.130781
12	у		f	2026-01-19 12:16:26.089023	2026-01-19 12:16:26.089023
13	уу		f	2026-01-19 12:16:33.943985	2026-01-19 12:16:33.943985
\.


--
-- Data for Name: process_management; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_management (id, name, description, process_type, last_executed, next_execution, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: processes_automation_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processes_automation_settings (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue (name, policy, retry_limit, retry_delay, retry_backoff, expire_seconds, retention_minutes, dead_letter, partition_name, created_on, updated_on) FROM stdin;
__pgboss__send-it	standard	\N	\N	\N	\N	\N	\N	j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3	2026-04-09 22:35:24.898715+03	2026-04-09 22:35:24.898715+03
process-ticket-schedules	standard	\N	\N	\N	\N	\N	\N	jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f	2026-04-09 23:10:56.260081+03	2026-04-09 23:10:56.260081+03
test-queue	standard	\N	\N	\N	\N	\N	\N	j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c	2026-04-09 23:17:52.925176+03	2026-04-09 23:17:52.925176+03
\.


--
-- Data for Name: queue_auto_response; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_auto_response (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: queues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queues (id, name, description, max_tickets, priority, is_active, created_at, updated_at, template_id, company_id, service_id, sla_id, workflow_id, agent_group_id, priority_id, email_config, keywords, auto_response_template, quick_answer_article_ids, department_id, executor_group_ids, executor_agent_ids, observer_agent_ids, type_id, category_id, post_master_mail_account_id, template_open_ticket_id, template_close_ticket_id, template_confirm_ticket_id, template_status_change_id, template_comment_ticket_id) FROM stdin;
21	Очередь 3 линии 	Описание http://localhost:5173/apps/Types	150	1	t	2026-04-14 14:34:01.418159	2026-04-14 17:45:17.183757	\N	39	34	7	1	\N	9	{}	{вв,вв}	\N	\N	9	{110,114}	{58,69}	{58,69}	1	3	3	2	2	3	2	2
22	Очередь 3 линии 	Описание http://localhost:5173/apps/Types	150	1	t	2026-04-14 17:45:23.774533	2026-04-14 17:45:23.774533	\N	39	34	7	1	\N	9	{}	{вв,вв}	\N	\N	9	{110,114}	{58,69}	{58,69}	1	3	3	2	2	3	2	2
23	Очередь 3 линии 	Описание http://localhost:5173/apps/Types	150	1	t	2026-04-14 17:45:41.560329	2026-04-14 17:45:41.560329	\N	39	34	7	1	\N	9	{}	{вв,вв}	\N	\N	9	{110,114}	{58,69}	{58,69}	1	3	3	2	2	3	2	2
24	Очередь 3 линии 	Описание http://localhost:5173/apps/Types	150	1	t	2026-04-14 17:46:09.082905	2026-04-14 17:46:09.082905	\N	39	34	7	1	\N	9	{}	{вв,вв}	\N	\N	9	{110,114}	{58,69}	{58,69}	1	3	3	2	2	3	2	2
20	Очередь 1 линии	Очередь 1 линии	1500	0	t	2026-04-14 13:38:04.741938	2026-04-14 17:47:07.453531	\N	39	33	7	2	111	10	\N	{ыыы,ыыы}	\N	\N	10	\N	\N	{65,67}	1	3	3	2	2	2	2	2
19	Очередь 2 линии	ываыва	0	0	t	2026-04-14 13:04:12.875952	2026-04-14 17:49:22.874728	\N	39	33	3	1	111	10	\N	{"{id: 19","name: 'Очередь 2 линии'","description: 'ываыва'","maxTickets: 0",priority:}	\N	{12,9}	9	\N	\N	{56,58}	1	3	3	3	3	3	3	4
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission, is_granted, created_at, updated_at) FROM stdin;
78	2	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
79	2	see_all_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
80	2	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
81	2	internal_notes	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
82	2	change_status	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
83	2	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
84	2	kb_write	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
85	2	view_reports	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
86	3	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
87	3	see_department_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
88	3	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
89	3	internal_notes	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
90	3	change_status	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
91	3	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
92	4	see_all_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
93	4	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
94	4	view_reports	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
95	6	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
96	6	see_all_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
97	6	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
98	6	internal_notes	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
99	6	change_status	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
100	6	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
101	6	kb_write	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
102	6	view_reports	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
103	6	manage_users	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
104	7	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
105	7	see_department_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
106	7	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
107	7	internal_notes	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
108	7	change_status	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
109	7	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
110	7	kb_write	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
111	8	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
112	8	see_own_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
113	8	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
114	8	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
115	10	super_user	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
116	10	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
117	10	see_all_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
118	10	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
119	10	internal_notes	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
120	10	change_status	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
121	10	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
122	10	kb_write	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
123	10	view_reports	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
124	10	system_settings	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
125	10	manage_users	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
126	11	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
127	11	see_own_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
128	11	see_department_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
129	11	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
130	11	internal_notes	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
131	11	change_status	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
132	11	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
133	12	create_ticket	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
134	12	see_own_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
135	12	reply_to_tickets	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
136	12	kb_read	t	2026-04-09 16:52:08.414409	2026-04-09 16:52:08.414409
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, message, is_active, created_at, updated_at, icon, photo) FROM stdin;
4	Аналитик	Просмотр отчетов и статистики	t	2026-01-29 16:53:02.188104	2026-03-08 17:01:50.594754	bx-bar-chart	\N
6	Супервизор	Контроль работы агентов поддержки	t	2026-01-29 16:53:02.195681	2026-03-08 17:01:50.594754	bx-user-check	\N
8	Консультант	Консультации клиентов по продуктам	t	2026-01-29 16:53:02.204276	2026-03-08 17:01:50.594754	bx-chat	\N
7	Технический специалист	Решение технических вопросов	t	2026-01-29 16:53:02.200285	2026-03-08 17:01:50.594754	bx-code	\N
10	Администратор	\N	t	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118	mdi-shield-crown	\N
12	Младший специалист	\N	t	2026-03-09 14:19:15.455118	2026-03-09 14:19:15.455118	mdi-account	\N
2	Менеджер	Управление пользователями и настройками	t	2026-01-29 16:53:02.181803	2026-03-09 21:11:03.334494	bx-user-circle	\N
3	Агент поддержки	Работа с тикетами и обращениями клиентов	t	2026-01-29 16:53:02.184966	2026-03-10 23:41:31.568706	bx-headphone	\N
11	Специалист	\N	t	2026-03-09 14:19:15.455118	2026-04-09 16:49:31.608103	mdi-headset	\N
\.


--
-- Data for Name: roles_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_groups (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule (name, cron, timezone, data, options, created_on, updated_on) FROM stdin;
\.


--
-- Data for Name: schedule_execution_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule_execution_logs (id, schedule_id, ticket_id, executed_at, success, message, error, created_at) FROM stdin;
\.


--
-- Data for Name: service_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_attachments (id, service_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at) FROM stdin;
3	33	Кейс_для_обработки_сводного_отчета_из_ХД.docx	service-1772436137961-628614756.docx	18063	application/vnd.openxmlformats-officedocument.wordprocessingml.document	\N	2026-03-02 10:22:17.964312
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, comment, is_active, created_at, updated_at, type, sla_id) FROM stdin;
33	Резервное копирование	Услуги по резервному копированию данных	t	2026-02-24 17:41:22.165981	2026-03-10 23:11:30.558331	Интерфейсная часть	5
38	Резервное копирование		t	2026-03-10 23:14:12.202414	2026-03-10 23:14:34.760883	Ит	\N
34	Мониторинг	Мониторинг систем и приложений	t	2026-02-24 17:41:22.169307	2026-03-10 23:15:19.138327	Обучение	3
37	Резервное копирование		t	2026-03-10 23:14:04.40691	2026-03-10 23:15:26.730761	Ит	\N
39	Поддержка	\N	t	2026-03-22 10:55:44.428386	2026-03-22 10:55:44.428386	\N	\N
40	Email	\N	t	2026-03-22 10:56:50.176235	2026-03-22 10:56:50.176235	\N	\N
41	SLA	\N	t	2026-03-22 10:56:50.183586	2026-03-22 10:56:50.183586	\N	\N
42	Агенты	\N	t	2026-03-22 10:56:50.194409	2026-03-22 10:56:50.194409	\N	\N
43	API	\N	t	2026-03-22 10:56:50.204249	2026-03-22 10:56:50.204249	\N	\N
44	Шаблоны	\N	t	2026-03-22 10:56:50.211754	2026-03-22 10:56:50.211754	\N	\N
45	Уведомления	\N	t	2026-03-22 10:56:50.219936	2026-03-22 10:56:50.219936	\N	\N
46	Календари	\N	t	2026-03-22 10:56:50.226869	2026-03-22 10:56:50.226869	\N	\N
47	Миграция	\N	t	2026-03-22 10:56:50.241224	2026-03-22 10:56:50.241224	\N	\N
\.


--
-- Data for Name: services_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services_attachments (id, service_id, attachment_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: session_management; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_management (id, username, ip_address, user_agent, login_time, last_activity, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signatures (id, name, content, is_active, created_at, updated_at, comment) FROM stdin;
1	С уважением	\n\nС уважением,\n[Ваше имя]\n[Ваша должность]\n[Название компании]	t	2026-01-23 08:57:57.418438	2026-01-23 08:57:57.418438	Стандартная подпись с уважением
2	Лучшие пожелания	\n\nС лучшими пожеланиями,\n[Ваше имя]\n[Ваша должность]	t	2026-01-23 08:57:57.421207	2026-01-23 08:57:57.421207	Теплая подпись с пожеланиями
3	Спасибо за обращение	\n\nСпасибо за Ваше обращение!\n\nС уважением,\n[Ваше имя]	t	2026-01-23 08:57:57.422078	2026-01-23 08:57:57.422078	Подпись с благодарностью
4	Официальная подпись	\n\nС уважением,\n[Ваше имя]\n[Ваша должность]\n[Контактная информация]\n[Название компании]	t	2026-01-23 08:57:57.422746	2026-01-23 08:57:57.422746	Полная официальная подпись
5	Короткая подпись	\n\nС уважением,\n[Ваше имя]	t	2026-01-23 08:57:57.423351	2026-01-23 08:57:57.423351	Краткая подпись
6	Поддержка клиентов	\n\nКоманда поддержки\n[Название компании]\n[Контактная информация]	t	2026-01-23 08:57:57.424022	2026-01-23 08:57:57.424022	Подпись для службы поддержки
7	Техническая поддержка	\n\nТехническая поддержка\n[Ваше имя]\n[Email]\n[Телефон]	t	2026-01-23 08:57:57.424666	2026-01-23 08:57:57.424666	Подпись для технической поддержки
8	Менеджер по продажам	\n\nМенеджер по продажам\n[Ваше имя]\n[Телефон]\n[Email]	t	2026-01-23 08:57:57.425353	2026-01-23 08:57:57.425353	Подпись для отдела продаж
\.


--
-- Data for Name: sla; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sla (id, name, description, response_time, resolution_time, is_active, created_at, updated_at, calendar_id, notification_percentage, type, solution_time, min_incident_time, response_notification, update_notification, solution_notification) FROM stdin;
3	Основное	Описание	15.00	4.00	t	2026-01-27 13:42:30.561839	2026-01-27 13:42:30.561839	4	0	relative_solution_speed	0	10	20	80	80
5	Стандартный SLA	Стандартное соглашение об уровне сервиса	4.00	24.00	t	2026-03-03 07:42:03.289002	2026-03-03 07:42:03.289002	\N	0	\N	0	10	20	80	80
7	Базовый SLA	Базовое соглашение для простых запросов	8.00	48.00	t	2026-03-03 07:42:03.289002	2026-03-03 07:42:03.289002	\N	0	\N	0	10	20	80	80
6	Премиум SLA	Премиум соглашение с быстрым реагированием	1.00	8.00	t	2026-03-03 07:42:03.289002	2026-03-10 22:42:20.684067	4	0	availability	60	10	20	80	80
\.


--
-- Data for Name: sla_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sla_services (id, sla_id, service_id, created_at, updated_at) FROM stdin;
8	6	34	2026-03-10 22:42:20.684067	2026-03-10 22:42:20.684067
\.


--
-- Data for Name: smime_certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smime_certificates (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sql_box; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sql_box (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: state_transitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.state_transitions (id, type_id, from_state_id, to_state_id, name, is_active, created_at, sort_order) FROM stdin;
1	1	2	4	Открыть	t	2026-02-21 10:44:41.522947+03	1
\.


--
-- Data for Name: states; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.states (id, name, comment, is_active, created_at, updated_at, type, color, type_id, is_initial) FROM stdin;
2	Новый	Новое обращение, поступившее в систему	t	2026-01-19 12:52:09.206925	2026-04-06 17:44:30.890094	Новая	#007bff	\N	f
3	Открыт	Обращение принято в работу	t	2026-01-19 12:52:09.212393	2026-04-06 17:44:31.028953	Открыта	#28a745	\N	f
5	Ожидание клиента	Ожидание дополнительной информации от клиента	t	2026-01-19 12:52:09.220835	2026-04-06 17:44:31.163422	Ожидает автозакрытия	#17a2b8	\N	f
6	Ожидание поставщика	Ожидание ответа от внешнего поставщика услуг	t	2026-01-19 12:52:09.224527	2026-04-06 17:44:31.230269	Объединенные	#6f42c1	\N	f
7	Решен	Проблема решена, ожидание подтверждения от клиента	t	2026-01-19 12:52:09.228559	2026-04-06 17:44:31.296222	Закрыта	#20c997	\N	f
8	Закрыт	Обращение успешно завершено	t	2026-01-19 12:52:09.232434	2026-04-06 17:44:31.363577	Открыта	#6c757d	\N	f
9	Отклонен	Обращение отклонено	t	2026-01-19 12:52:09.235479	2026-04-06 17:44:31.455783	Ожидает напоминания	#dc3545	\N	f
10	На удержании	Обращение временно приостановлено	t	2026-01-19 12:52:09.238478	2026-04-06 17:44:31.552755	Открыта	#fd7e14	\N	f
13	Отменен	Заявка отменена клиентом	t	2026-01-23 08:57:05.509344	2026-04-09 09:03:16.533495	Закрыта	#fd7e14	\N	f
4	Эскалирована	Обращение находится в процессе обработки	t	2026-01-19 12:52:09.216973	2026-04-09 09:04:28.886254	Эскалирована	#ffc107	\N	f
11	В работе	Обращение передано на более высокий уровень поддержки	t	2026-01-19 12:52:09.241649	2026-04-09 10:40:13.397147	Открыта	#e83e8c	\N	f
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription (event, name, created_on, updated_on) FROM stdin;
\.


--
-- Data for Name: support_data_collector; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_data_collector (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_configuration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_configuration (id, name, description, value, config_type, is_editable, is_active, created_at, updated_at) FROM stdin;
1	create_customer_user_by_email	При создании тикета, если автор не найден по email, разрешить создание нового сотрудника	true	boolean	t	t	2026-03-30 17:28:45.623884	2026-03-31 16:49:02.396246
2	agent_auto_assign_as_executor	Автоматически назначать агента как исполнителя при создании им новой заявки	true	boolean	t	t	2026-04-04 08:55:00.517926	2026-04-05 08:34:01.538341
3	allow_multiple_executor_groups	Разрешить назначение нескольких групп исполнителей	true	boolean	t	t	2026-04-05 16:51:31.579784	2026-04-05 16:51:31.579784
4	allow_multiple_executors	Разрешить назначение нескольких исполнителей	true	boolean	t	t	2026-04-05 16:51:31.594583	2026-04-05 16:51:31.594583
\.


--
-- Data for Name: system_file_support; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_file_support (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_log (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_maintenance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_maintenance (id, name, description, start_time, end_time, is_scheduled, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: template_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_attachments (id, name, message, is_active, created_at, updated_at) FROM stdin;
1	мпир	ить	t	2026-02-21 11:56:58.12377	2026-02-21 11:56:58.12377
\.


--
-- Data for Name: template_queues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_queues (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.templates (id, name, message, is_active, created_at, updated_at) FROM stdin;
2	Шаблон ответа на инцидент	Уважаемый клиент, мы получили ваше обращение и уже работаем над решением проблемы.	t	2026-03-03 07:42:03.282944	2026-03-03 07:42:03.282944
3	Шаблон подтверждения	Ваше обращение зарегистрировано под номером #ID.	t	2026-03-03 07:42:03.282944	2026-03-03 07:42:03.282944
4	Шаблон закрытия	Ваше обращение успешно решено. Спасибо за обращение!	t	2026-03-03 07:42:03.282944	2026-03-03 07:42:03.282944
\.


--
-- Data for Name: test_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_entities (id, name, comment, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_attachments (id, ticket_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at) FROM stdin;
2	6	app.txt	ticket-1771613420749-190918309.txt	14998	text/plain	\N	2026-02-20 21:50:20.750789+03
3	20	77777_cleaned.xlsx	ticket-1771690189077-871571115.xlsx	910854	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	\N	2026-02-21 19:09:49.079946+03
5	23	env	ticket-1772482600432-62441597	58	application/octet-stream	\N	2026-03-02 23:16:40.439944+03
11	33	ticket-1774431951254-842793350.jpg	ticket-1774431951254-842793350.jpg	284457	image/jpeg	\N	2026-03-25 12:45:51.255272+03
12	33	ticket-1774431951283-30990455.png	ticket-1774431951283-30990455.png	192061	image/png	\N	2026-03-25 12:45:51.284879+03
13	33	ticket-1774432021669-915317205.jpg	ticket-1774432021669-915317205.jpg	284457	image/jpeg	\N	2026-03-25 12:47:01.670229+03
14	34	ticket-1774445179879-789202092.jpg	ticket-1774445179879-789202092.jpg	284457	image/jpeg	\N	2026-03-25 16:26:19.881025+03
15	34	ticket-1774445179957-950239641.png	ticket-1774445179957-950239641.png	1852051	image/png	\N	2026-03-25 16:26:19.959663+03
16	35	ticket-1774445656588-45730698.jpg	ticket-1774445656588-45730698.jpg	284457	image/jpeg	\N	2026-03-25 16:34:16.589577+03
17	35	ticket-1774446242085-124969765.svg	ticket-1774446242085-124969765.svg	975407	image/svg+xml	\N	2026-03-25 16:44:02.086819+03
18	193	ticket-1775206623882-554213662.jpg	ticket-1775206623882-554213662.jpg	284457	image/jpeg	\N	2026-04-03 11:57:03.884082+03
19	194	ticket-1775206732810-34798326.jpg	ticket-1775206732810-34798326.jpg	284457	image/jpeg	\N	2026-04-03 11:58:52.810874+03
20	195	ticket-1775208718431-629408834.py	ticket-1775208718431-629408834.py	65692	text/x-python	\N	2026-04-03 12:31:58.433538+03
21	206	ticket-1775459934152-295667512.py	ticket-1775459934152-295667512.py	65692	text/x-python	\N	2026-04-06 10:18:54.153751+03
\.


--
-- Data for Name: ticket_attribute_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_attribute_relations (id, name, source_attribute, target_attribute, relation_type, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comments (id, ticket_id, author_id, content, created_at, updated_at, is_internal) FROM stdin;
5	6	\N	уацуацу	2026-02-20 22:40:18.194812+03	2026-02-20 22:40:18.194812+03	f
6	6	\N	цувцувуц	2026-02-20 22:40:37.544143+03	2026-02-20 22:40:37.544143+03	t
7	21	\N	тьб	2026-02-22 15:42:04.127813+03	2026-02-22 15:42:04.127813+03	f
8	21	\N	ьтбь	2026-02-22 15:42:10.898324+03	2026-02-22 15:42:10.898324+03	t
9	22	\N	ропор	2026-02-22 17:49:52.999754+03	2026-02-22 17:49:52.999754+03	f
10	31	\N	ацуацуацйуацйа	2026-03-10 23:07:24.968231+03	2026-03-10 23:07:24.968231+03	f
11	31	\N	йцуацуйа	2026-03-10 23:07:29.663122+03	2026-03-10 23:07:29.663122+03	t
12	206	\N	цукауцка	2026-04-06 10:19:47.863007+03	2026-04-06 10:19:47.863007+03	t
13	206	\N	цуауца	2026-04-06 10:19:52.905165+03	2026-04-06 10:19:52.905165+03	f
16	206	\N	vcnv	2026-04-06 14:50:40.659781+03	2026-04-06 14:50:40.659781+03	f
18	207	\N	bcvbcv	2026-04-06 14:51:44.939674+03	2026-04-06 14:51:44.939674+03	t
19	207	59	ыфчфыч	2026-04-06 15:13:55.160098+03	2026-04-06 15:13:55.160098+03	f
20	209	59	fewsdfaw	2026-04-06 21:53:18.732811+03	2026-04-06 21:53:18.732811+03	f
21	332	59	<p>Ответ 2</p>	2026-04-11 19:06:43.542737+03	2026-04-11 19:06:43.542737+03	f
22	332	59	<p>Текст ответа 1</p>	2026-04-11 19:06:52.875942+03	2026-04-11 19:06:52.875942+03	f
23	332	59	<p>Текст ответа 1</p>	2026-04-11 19:07:04.434144+03	2026-04-11 19:07:04.434144+03	t
28	333	59	<p>Ответ 2</p>	2026-04-11 21:00:18.880902+03	2026-04-11 21:00:18.880902+03	f
29	332	59	<p>Текст ответа 1</p>	2026-04-11 21:00:43.481017+03	2026-04-11 21:00:43.481017+03	f
30	333	64	<p>Текст ответа 1</p>	2026-04-11 21:01:40.122691+03	2026-04-11 21:01:40.122691+03	f
31	342	59	<p>Ответ 2</p>	2026-04-14 12:16:51.582751+03	2026-04-14 12:16:51.582751+03	f
\.


--
-- Data for Name: ticket_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_history (id, ticket_id, changed_by, field_name, old_value, new_value, created_at) FROM stdin;
1	18	\N	stateId	\N	2	2026-02-21 17:18:26.843594+03
2	19	\N	stateId	\N	2	2026-02-21 17:18:52.01038+03
3	19	\N	stateId	2	4	2026-02-21 17:19:58.188814+03
4	20	\N	stateId	\N	2	2026-02-21 19:09:49.01534+03
5	21	\N	stateId	\N	2	2026-02-22 15:36:39.938736+03
6	21	\N	stateId	2	4	2026-02-22 15:37:23.172858+03
7	21	\N	stateId	4	9	2026-02-22 16:14:16.237963+03
8	22	\N	stateId	\N	Новый	2026-02-22 17:39:29.293631+03
9	22	\N	attachment	\N	Добавлен файл: 77777_cleaned.xlsx	2026-02-22 17:39:29.370147+03
10	22	\N	stateId	Новый	В работе	2026-02-22 17:40:26.639269+03
11	22	\N	title	тест 	тест 2	2026-02-22 17:41:08.615887+03
12	22	\N	description	<p>тест</p>	<p style="text-align: center;">тест ловалдыфоалдоф...	2026-02-22 17:53:03.444422+03
13	22	\N	stateId	В работе	Решен	2026-02-22 17:53:27.012968+03
14	22	\N	priorityId	Блокирующий	Срочный	2026-02-22 17:56:00.982294+03
15	22	\N	attachment	Файл: 77777_cleaned.xlsx	Удалён	2026-02-22 17:56:04.263751+03
16	22	\N	description	<p style="text-align: center;">тест ловалдыфоалдоф...	<p style="text-align: left;">тест ловалдыфоалдофыв...	2026-02-22 18:24:40.215322+03
17	23	\N	stateId	\N	Новый	2026-03-02 23:16:40.386006+03
18	23	\N	attachment	\N	Добавлен файл: env	2026-03-02 23:16:40.446311+03
19	23	\N	slaId	Основное	dcasf	2026-03-03 00:58:41.7523+03
20	23	\N	slaId	dcasf	Основное	2026-03-03 00:58:48.324854+03
21	25	\N	stateId	\N	Новый	2026-03-03 09:56:17.620883+03
22	26	\N	stateId	\N	Новый	2026-03-03 10:49:24.832495+03
23	22	\N	title	тест 2	тест 2уцйвцй	2026-03-03 11:31:13.560785+03
24	30	\N	stateId	\N	Новый	2026-03-03 11:35:31.437725+03
25	30	\N	slaId	Основное	Премиум SLA	2026-03-03 11:36:05.415115+03
26	30	\N	responseDeadline	Wed Mar 04 2026 02:35:31 GMT+0300 (Москва, стандартное время)	2026-03-03T23:35:31.431Z	2026-03-03 11:36:05.418213+03
27	30	\N	responseDeadline	Tue Mar 03 2026 12:36:05 GMT+0300 (Москва, стандартное время)	2026-03-03T09:36:05.407Z	2026-03-03 12:27:28.78132+03
28	30	\N	responseDeadline	Tue Mar 03 2026 09:36:05 GMT+0300 (Москва, стандартное время)	2026-03-03T06:36:05.407Z	2026-03-03 12:28:10.538075+03
29	30	\N	responseDeadline	Tue Mar 03 2026 06:36:05 GMT+0300 (Москва, стандартное время)	2026-03-03T03:36:05.407Z	2026-03-03 12:28:20.696994+03
30	30	\N	responseDeadline	Tue Mar 03 2026 03:36:05 GMT+0300 (Москва, стандартное время)	2026-03-03T00:36:05.407Z	2026-03-03 12:46:15.505222+03
31	30	\N	responseDeadline	Tue Mar 03 2026 00:36:05 GMT+0300 (Москва, стандартное время)	2026-03-02T21:36:05.407Z	2026-03-03 12:46:23.176255+03
32	30	\N	serviceId	\N	Мониторинг	2026-03-03 12:51:28.327541+03
33	30	\N	responseDeadline	Mon Mar 02 2026 21:36:05 GMT+0300 (Москва, стандартное время)	2026-03-02T18:36:05.407Z	2026-03-03 12:51:28.330516+03
34	31	\N	stateId	\N	Новый	2026-03-03 12:52:56.528225+03
35	31	\N	queueId	Очередь первой линии поддержки	Техническая поддержка	2026-03-03 23:37:19.425977+03
36	31	\N	responseDeadline	Tue Mar 03 2026 13:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T10:52:56.523Z	2026-03-03 23:37:19.429023+03
37	31	\N	resolutionDeadline	Tue Mar 03 2026 13:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T10:52:56.523Z	2026-03-03 23:37:19.431622+03
38	31	\N	stateId	Новый	В работе	2026-03-10 23:08:40.531718+03
39	31	\N	responseDeadline	Tue Mar 03 2026 10:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T07:52:56.523Z	2026-03-10 23:08:40.541711+03
40	31	\N	resolutionDeadline	Tue Mar 03 2026 10:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T07:52:56.523Z	2026-03-10 23:08:40.543026+03
41	31	\N	queueId	\N	Очередь	2026-03-19 22:16:36.919795+03
42	31	\N	responseDeadline	Tue Mar 03 2026 07:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T04:52:56.523Z	2026-03-19 22:16:36.927435+03
43	31	\N	resolutionDeadline	Tue Mar 03 2026 07:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T04:52:56.523Z	2026-03-19 22:16:36.930161+03
44	31	\N	responseDeadline	Tue Mar 03 2026 04:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T01:52:56.523Z	2026-03-19 22:16:38.601254+03
45	31	\N	resolutionDeadline	Tue Mar 03 2026 04:52:56 GMT+0300 (Москва, стандартное время)	2026-03-03T01:52:56.523Z	2026-03-19 22:16:38.603985+03
46	31	\N	categoryId	\N	категория  1	2026-03-23 16:28:34.878641+03
47	31	\N	responseDeadline	Tue Mar 03 2026 01:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T22:52:56.523Z	2026-03-23 16:28:34.884846+03
48	31	\N	resolutionDeadline	Tue Mar 03 2026 01:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T22:52:56.523Z	2026-03-23 16:28:34.888142+03
49	31	\N	ownerId	\N	Анна Соколова	2026-03-23 16:30:43.96018+03
50	31	\N	companyId	\N	ЗАО "ОбразованиеПлюс"	2026-03-23 16:30:43.963951+03
51	31	\N	responseDeadline	Mon Mar 02 2026 22:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T19:52:56.523Z	2026-03-23 16:30:43.966574+03
52	31	\N	resolutionDeadline	Mon Mar 02 2026 22:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T19:52:56.523Z	2026-03-23 16:30:43.969164+03
53	31	\N	responseDeadline	Mon Mar 02 2026 19:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T16:52:56.523Z	2026-03-23 17:32:13.951907+03
54	31	\N	resolutionDeadline	Mon Mar 02 2026 19:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T16:52:56.523Z	2026-03-23 17:32:13.955218+03
55	31	\N	description	<p>Ghbdnt</p>	<p>Ghbdntфывф</p>	2026-03-23 17:33:25.064665+03
56	31	\N	responseDeadline	Mon Mar 02 2026 16:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T13:52:56.523Z	2026-03-23 17:33:25.067733+03
57	31	\N	resolutionDeadline	Mon Mar 02 2026 16:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T13:52:56.523Z	2026-03-23 17:33:25.075934+03
58	31	\N	responseDeadline	Mon Mar 02 2026 13:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T10:52:56.523Z	2026-03-23 17:33:44.38771+03
59	31	\N	resolutionDeadline	Mon Mar 02 2026 13:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T10:52:56.523Z	2026-03-23 17:33:44.390912+03
60	31	\N	responseDeadline	Mon Mar 02 2026 10:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T07:52:56.523Z	2026-03-25 10:12:06.539078+03
61	31	\N	resolutionDeadline	Mon Mar 02 2026 10:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T07:52:56.523Z	2026-03-25 10:12:06.545809+03
62	31	\N	executorAgentIds	-	-	2026-03-25 10:12:06.548991+03
63	31	\N	executorGroupIds	-	Первая линия поддержки	2026-03-25 10:12:06.554047+03
64	31	\N	responseDeadline	Mon Mar 02 2026 07:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T04:52:56.523Z	2026-03-25 10:26:33.257407+03
65	31	\N	resolutionDeadline	Mon Mar 02 2026 07:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T04:52:56.523Z	2026-03-25 10:26:33.260397+03
66	31	\N	executorAgentIds	-	-	2026-03-25 10:26:33.26359+03
67	31	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-25 10:26:33.269471+03
68	31	\N	responseDeadline	Mon Mar 02 2026 04:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T01:52:56.523Z	2026-03-25 10:38:38.40351+03
69	31	\N	resolutionDeadline	Mon Mar 02 2026 04:52:56 GMT+0300 (Москва, стандартное время)	2026-03-02T01:52:56.523Z	2026-03-25 10:38:38.406713+03
70	31	\N	executorAgentIds	-	-	2026-03-25 10:38:38.409436+03
71	31	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-25 10:38:38.415588+03
72	33	\N	stateId	\N	Новый	2026-03-25 11:38:52.9191+03
73	33	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 11:38:53.129736+03
74	33	\N	attachment	Файл: photo_2026-03-23_09-46-42.jpg	Удалён	2026-03-25 11:46:03.927343+03
75	33	\N	description	\N	\N	2026-03-25 12:15:55.613257+03
76	33	\N	responseDeadline	Thu Mar 26 2026 02:38:52 GMT+0300 (Москва, стандартное время)	2026-03-25T23:38:52.906Z	2026-03-25 12:15:55.616264+03
77	33	\N	executorAgentIds	-	-	2026-03-25 12:15:55.618933+03
78	33	\N	executorGroupIds	-	-	2026-03-25 12:15:55.623479+03
79	33	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 12:15:55.658836+03
80	33	\N	attachment	\N	Добавлен файл: Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð° Ð¾Ñ 2026-01-15 10-15-57.png	2026-03-25 12:15:55.690023+03
81	33	\N	attachment	\N	Добавлен файл: Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð° Ð¾Ñ 2026-02-12 17-51-47.png	2026-03-25 12:15:55.718976+03
82	33	\N	attachment	Файл: photo_2026-03-23_09-46-42.jpg	Удалён	2026-03-25 12:17:34.672448+03
83	33	\N	attachment	Файл: Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð° Ð¾Ñ 2026-01-15 10-15-57.png	Удалён	2026-03-25 12:17:36.367962+03
84	33	\N	attachment	Файл: Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð° Ð¾Ñ 2026-02-12 17-51-47.png	Удалён	2026-03-25 12:17:37.583646+03
85	33	\N	responseDeadline	Wed Mar 25 2026 23:38:52 GMT+0300 (Москва, стандартное время)	2026-03-25T20:38:52.906Z	2026-03-25 12:17:48.868258+03
86	33	\N	executorAgentIds	-	-	2026-03-25 12:17:48.872953+03
87	33	\N	executorGroupIds	-	-	2026-03-25 12:17:48.877534+03
88	33	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 12:17:48.917239+03
89	33	\N	typeId	Инцидент	Запрос на обслуживание	2026-03-25 12:45:51.203479+03
90	33	\N	categoryId	Категория 2	Доступ  пропал	2026-03-25 12:45:51.208503+03
91	33	\N	responseDeadline	Wed Mar 25 2026 20:38:52 GMT+0300 (Москва, стандартное время)	2026-03-25T17:38:52.906Z	2026-03-25 12:45:51.211158+03
92	33	\N	executorAgentIds	-	-	2026-03-25 12:45:51.214137+03
93	33	\N	executorGroupIds	-	-	2026-03-25 12:45:51.219437+03
94	33	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 12:45:51.258186+03
95	33	\N	attachment	\N	Добавлен файл: Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð° Ð¾Ñ 2026-02-12 17-51-47.png	2026-03-25 12:45:51.287644+03
96	33	\N	responseDeadline	Wed Mar 25 2026 17:38:52 GMT+0300 (Москва, стандартное время)	2026-03-25T14:38:52.906Z	2026-03-25 12:47:01.637287+03
97	33	\N	executorAgentIds	-	-	2026-03-25 12:47:01.640235+03
98	33	\N	executorGroupIds	-	-	2026-03-25 12:47:01.644927+03
99	33	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 12:47:01.673446+03
100	34	\N	stateId	\N	Новый	2026-03-25 16:26:19.843484+03
101	34	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 16:26:19.884067+03
102	34	\N	attachment	\N	Добавлен файл: 1768399195.png	2026-03-25 16:26:19.963678+03
103	35	\N	stateId	\N	Новый	2026-03-25 16:33:45.246554+03
104	35	\N	description	\N	\N	2026-03-25 16:34:16.547973+03
105	35	\N	executorAgentIds	-	-	2026-03-25 16:34:16.551179+03
106	35	\N	executorGroupIds	-	-	2026-03-25 16:34:16.558186+03
107	35	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-03-25 16:34:16.592371+03
108	35	\N	executorAgentIds	-	-	2026-03-25 16:44:02.034999+03
109	35	\N	executorGroupIds	-	-	2026-03-25 16:44:02.040431+03
110	35	\N	attachment	\N	Добавлен файл: 1768399195.svg	2026-03-25 16:44:02.089863+03
111	35	\N	executorAgentIds	-	-	2026-03-25 16:49:56.991093+03
112	35	\N	executorGroupIds	-	-	2026-03-25 16:49:56.996669+03
113	33	\N	attachment	Файл: ticket-1774430268913-855445628.jpg	Удалён	2026-03-25 16:50:13.468854+03
114	33	\N	responseDeadline	Wed Mar 25 2026 14:38:52 GMT+0300 (Москва, стандартное время)	2026-03-25T11:38:52.906Z	2026-03-25 17:02:01.223295+03
115	33	\N	executorAgentIds	-	-	2026-03-25 17:02:01.226144+03
116	33	\N	executorGroupIds	-	-	2026-03-25 17:02:01.231608+03
117	33	\N	responseDeadline	Wed Mar 25 2026 11:38:52 GMT+0300 (Москва, стандартное время)	2026-03-25T08:38:52.906Z	2026-03-25 17:03:16.27191+03
118	33	\N	executorAgentIds	-	-	2026-03-25 17:03:16.275381+03
119	33	\N	executorGroupIds	-	-	2026-03-25 17:03:16.280328+03
120	39	\N	stateId	\N	Новый	2026-03-26 14:21:05.377674+03
121	40	\N	stateId	\N	Новый	2026-03-26 14:22:33.40112+03
122	45	\N	stateId	\N	Новый	2026-03-26 14:22:33.585128+03
123	46	\N	stateId	\N	Новый	2026-03-26 14:22:44.079132+03
124	51	\N	stateId	\N	Новый	2026-03-26 14:22:44.213255+03
125	52	\N	stateId	\N	Новый	2026-03-26 14:22:44.250886+03
126	57	\N	stateId	\N	Новый	2026-03-26 14:22:44.376829+03
127	58	\N	stateId	\N	Новый	2026-03-26 14:22:49.990678+03
128	63	\N	stateId	\N	Новый	2026-03-26 14:22:50.149566+03
129	64	\N	stateId	\N	Новый	2026-03-26 14:22:50.18041+03
130	69	\N	stateId	\N	Новый	2026-03-26 14:22:50.323611+03
131	70	\N	stateId	\N	Новый	2026-03-26 14:22:50.35835+03
132	75	\N	stateId	\N	Новый	2026-03-26 14:22:50.48289+03
133	76	\N	stateId	\N	Новый	2026-03-26 14:22:50.511557+03
134	81	\N	stateId	\N	Новый	2026-03-26 14:22:50.64375+03
135	82	\N	stateId	\N	Новый	2026-03-26 14:22:55.45312+03
136	87	\N	stateId	\N	Новый	2026-03-26 14:22:55.603967+03
137	88	\N	stateId	\N	Новый	2026-03-26 14:22:55.638605+03
138	93	\N	stateId	\N	Новый	2026-03-26 14:22:55.762816+03
139	94	\N	stateId	\N	Новый	2026-03-26 14:22:55.787558+03
140	99	\N	stateId	\N	Новый	2026-03-26 14:22:55.924724+03
141	100	\N	stateId	\N	Новый	2026-03-26 14:22:55.95516+03
142	105	\N	stateId	\N	Новый	2026-03-26 14:22:56.087613+03
143	106	\N	stateId	\N	Новый	2026-03-26 14:22:56.119911+03
144	111	\N	stateId	\N	Новый	2026-03-26 14:22:56.239593+03
145	112	\N	stateId	\N	Новый	2026-03-26 14:22:56.268008+03
146	117	\N	stateId	\N	Новый	2026-03-26 14:22:56.39333+03
147	118	\N	stateId	\N	Новый	2026-03-26 14:22:56.421393+03
148	123	\N	stateId	\N	Новый	2026-03-26 14:22:56.542504+03
149	124	\N	stateId	\N	Новый	2026-03-26 14:22:56.570607+03
150	127	\N	stateId	\N	Новый	2026-03-26 14:30:20.499435+03
151	128	\N	stateId	\N	Новый	2026-03-26 14:30:20.544532+03
152	133	\N	stateId	\N	Новый	2026-03-26 14:30:20.6787+03
153	134	\N	stateId	\N	Новый	2026-03-26 14:30:20.714928+03
154	137	\N	stateId	\N	Новый	2026-03-26 14:38:54.435423+03
155	31	\N	isActive	Да	Нет	2026-03-26 14:48:31.252121+03
156	136	\N	description	\N	\N	2026-03-26 14:50:10.653798+03
157	136	\N	stateId	\N	Открыт	2026-03-26 14:50:10.658607+03
158	136	\N	responseDeadline	Fri Mar 27 2026 05:38:54 GMT+0300 (Москва, стандартное время)	2026-03-27T02:38:54.410Z	2026-03-26 14:50:10.666005+03
159	136	\N	executorAgentIds	-	-	2026-03-26 14:50:10.669152+03
160	136	\N	executorGroupIds	-	Первая линия поддержки	2026-03-26 14:50:10.677693+03
161	137	\N	isActive	Да	Нет	2026-03-26 14:50:30.20973+03
162	136	\N	isActive	Да	Нет	2026-03-26 14:51:25.914793+03
163	136	\N	responseDeadline	Fri Mar 27 2026 02:38:54 GMT+0300 (Москва, стандартное время)	2026-03-26T23:38:54.410Z	2026-03-26 14:51:25.918498+03
164	136	\N	executorAgentIds	-	-	2026-03-26 14:51:25.921184+03
165	136	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-26 14:51:25.925847+03
166	138	\N	isActive	Да	Нет	2026-03-26 14:56:18.89532+03
167	138	\N	executorAgentIds	-	-	2026-03-26 14:56:18.90059+03
168	138	\N	executorGroupIds	-	-	2026-03-26 14:56:18.90564+03
169	139	\N	stateId	\N	Новый	2026-03-26 15:32:42.696642+03
170	139	\N	description	\N	\N	2026-03-26 15:33:00.722448+03
171	139	\N	categoryId	\N	Категория 2	2026-03-26 15:33:00.725162+03
172	139	\N	executorAgentIds	-	-	2026-03-26 15:33:00.727662+03
173	139	\N	executorGroupIds	-	-	2026-03-26 15:33:00.731396+03
174	139	\N	isActive	Да	Нет	2026-03-26 15:33:10.051375+03
175	139	\N	executorAgentIds	-	-	2026-03-26 15:33:10.05395+03
176	139	\N	executorGroupIds	-	-	2026-03-26 15:33:10.057873+03
177	140	\N	stateId	\N	Новый	2026-03-26 17:08:37.576658+03
178	141	\N	stateId	\N	Новый	2026-03-26 17:09:49.828552+03
179	142	\N	stateId	\N	Новый	2026-03-26 17:10:23.674692+03
180	142	\N	responseDeadline	Fri Mar 27 2026 08:10:23 GMT+0300 (Москва, стандартное время)	2026-03-27T05:10:23.670Z	2026-03-26 17:10:53.92835+03
181	142	\N	executorAgentIds	-	-	2026-03-26 17:10:53.931464+03
182	142	\N	executorGroupIds	-	Первая линия поддержки	2026-03-26 17:10:53.937949+03
183	141	\N	description	\N	\N	2026-03-26 17:11:17.772831+03
184	141	\N	responseDeadline	Thu Mar 26 2026 21:09:49 GMT+0300 (Москва, стандартное время)	2026-03-26T18:09:49.823Z	2026-03-26 17:11:17.775706+03
185	141	\N	executorAgentIds	-	-	2026-03-26 17:11:17.778356+03
186	141	\N	executorGroupIds	-	Первая линия поддержки, Вторая линия поддержки	2026-03-26 17:11:17.783868+03
187	140	\N	responseDeadline	Thu Mar 26 2026 21:08:37 GMT+0300 (Москва, стандартное время)	2026-03-26T18:08:37.569Z	2026-03-26 17:11:38.876476+03
188	140	\N	executorAgentIds	-	-	2026-03-26 17:11:38.879935+03
189	140	\N	executorGroupIds	-	Менеджеры проектов	2026-03-26 17:11:38.885385+03
190	143	\N	stateId	\N	Новый	2026-03-26 17:11:48.69226+03
191	144	\N	stateId	\N	Новый	2026-03-26 17:11:48.758505+03
192	145	\N	stateId	\N	Новый	2026-03-26 17:11:48.807045+03
193	145	\N	description	\N	\N	2026-03-26 17:11:59.518258+03
194	145	\N	isActive	Да	Нет	2026-03-26 17:11:59.521166+03
195	145	\N	responseDeadline	Thu Mar 26 2026 21:11:48 GMT+0300 (Москва, стандартное время)	2026-03-26T18:11:48.799Z	2026-03-26 17:11:59.523818+03
196	145	\N	executorAgentIds	-	-	2026-03-26 17:11:59.526469+03
197	145	\N	executorGroupIds	-	-	2026-03-26 17:11:59.530307+03
198	140	\N	isActive	Да	Нет	2026-03-26 17:12:13.115513+03
199	140	\N	responseDeadline	Thu Mar 26 2026 18:08:37 GMT+0300 (Москва, стандартное время)	2026-03-26T15:08:37.569Z	2026-03-26 17:12:13.118762+03
200	140	\N	executorAgentIds	-	-	2026-03-26 17:12:13.121664+03
201	140	\N	executorGroupIds	Менеджеры проектов	Менеджеры проектов	2026-03-26 17:12:13.127616+03
202	141	\N	isActive	Да	Нет	2026-03-26 17:12:34.351035+03
203	141	\N	responseDeadline	Thu Mar 26 2026 18:09:49 GMT+0300 (Москва, стандартное время)	2026-03-26T15:09:49.823Z	2026-03-26 17:12:34.354477+03
204	141	\N	executorAgentIds	-	-	2026-03-26 17:12:34.357028+03
205	141	\N	executorGroupIds	Первая линия поддержки, Вторая линия поддержки	Первая линия поддержки, Вторая линия поддержки	2026-03-26 17:12:34.360995+03
206	142	\N	isActive	Да	Нет	2026-03-26 17:31:58.05719+03
207	142	\N	responseDeadline	Fri Mar 27 2026 05:10:23 GMT+0300 (Москва, стандартное время)	2026-03-27T02:10:23.670Z	2026-03-26 17:31:58.062951+03
208	142	\N	executorAgentIds	-	-	2026-03-26 17:31:58.065543+03
209	142	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-26 17:31:58.069794+03
210	144	\N	description	\N	\N	2026-03-27 09:05:47.61454+03
211	144	\N	responseDeadline	Thu Mar 26 2026 21:11:48 GMT+0300 (Москва, стандартное время)	2026-03-26T18:11:48.753Z	2026-03-27 09:05:47.622445+03
212	144	\N	executorAgentIds	-	-	2026-03-27 09:05:47.625539+03
213	144	\N	executorGroupIds	-	Первая линия поддержки, Вторая линия поддержки	2026-03-27 09:05:47.631789+03
214	143	\N	description	\N	\N	2026-03-27 09:06:01.739689+03
215	143	\N	responseDeadline	Fri Mar 27 2026 08:11:48 GMT+0300 (Москва, стандартное время)	2026-03-27T05:11:48.687Z	2026-03-27 09:06:01.742861+03
216	143	\N	executorAgentIds	-	-	2026-03-27 09:06:01.747685+03
217	143	\N	executorGroupIds	-	Первая линия поддержки	2026-03-27 09:06:01.751828+03
218	143	\N	isActive	Да	Нет	2026-03-27 09:12:58.639997+03
219	143	\N	responseDeadline	Fri Mar 27 2026 05:11:48 GMT+0300 (Москва, стандартное время)	2026-03-27T02:11:48.687Z	2026-03-27 09:12:58.64663+03
220	143	\N	executorAgentIds	-	-	2026-03-27 09:12:58.650406+03
221	143	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-27 09:12:58.658459+03
222	146	\N	stateId	\N	Новый	2026-03-27 13:24:21.013364+03
223	147	\N	stateId	\N	Новый	2026-03-27 13:24:24.587612+03
224	148	\N	stateId	\N	Новый	2026-03-27 13:24:24.613793+03
225	149	\N	stateId	\N	Новый	2026-03-27 13:24:27.925943+03
226	150	\N	stateId	\N	Новый	2026-03-27 13:24:27.983864+03
227	151	\N	stateId	\N	Новый	2026-03-27 13:24:28.002281+03
228	152	\N	stateId	\N	Новый	2026-03-27 13:24:28.019918+03
229	152	\N	description	\N	\N	2026-03-27 13:25:42.574087+03
230	152	\N	responseDeadline	Fri Mar 27 2026 17:24:28 GMT+0300 (Москва, стандартное время)	2026-03-27T14:24:28.016Z	2026-03-27 13:25:42.579519+03
231	152	\N	executorAgentIds	-	-	2026-03-27 13:25:42.58391+03
232	152	\N	executorGroupIds	-	Первая линия поддержки	2026-03-27 13:25:42.595355+03
233	156	\N	description	\N	\N	2026-03-31 16:47:26.016748+03
234	156	\N	ownerId	Иван Иванов	\N	2026-03-31 16:47:26.021831+03
235	156	\N	executorAgentIds	Иван Иванов	Иван Иванов	2026-03-31 16:47:26.025551+03
236	156	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-31 16:47:26.032025+03
237	156	\N	executorAgentIds	-	-	2026-03-31 16:47:52.782472+03
238	156	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-03-31 16:47:52.788097+03
239	157	\N	stateId	\N	Новый	2026-03-31 16:49:24.215098+03
240	158	\N	stateId	\N	Новый	2026-03-31 16:53:20.864731+03
241	158	\N	description	\N	\N	2026-03-31 17:18:03.144449+03
242	158	\N	categoryId	\N	Категория 2	2026-03-31 17:18:03.148184+03
243	158	\N	executorAgentIds	-	-	2026-03-31 17:18:03.151417+03
244	158	\N	executorGroupIds	-	-	2026-03-31 17:18:03.157624+03
245	159	\N	stateId	\N	Новый	2026-04-02 08:55:04.42629+03
246	160	\N	stateId	\N	Новый	2026-04-02 09:17:14.266946+03
247	161	\N	stateId	\N	Новый	2026-04-02 17:29:58.341905+03
248	162	\N	stateId	\N	Новый	2026-04-02 17:41:52.480548+03
249	164	\N	stateId	\N	Новый	2026-04-02 17:48:03.873157+03
250	165	\N	stateId	\N	Новый	2026-04-02 17:52:57.390467+03
251	166	\N	stateId	\N	Новый	2026-04-02 17:55:52.086755+03
252	167	\N	stateId	\N	Новый	2026-04-02 17:56:33.858005+03
253	170	\N	stateId	\N	Новый	2026-04-02 19:58:03.335296+03
254	172	\N	stateId	\N	Новый	2026-04-02 20:18:40.726516+03
255	173	\N	stateId	\N	Новый	2026-04-02 20:29:44.515683+03
256	176	\N	stateId	\N	Новый	2026-04-02 20:37:39.616872+03
257	177	\N	description	\N	\N	2026-04-02 20:41:42.816264+03
258	177	\N	ownerId	36	33	2026-04-02 20:41:42.821689+03
259	177	\N	executorAgentIds	-	-	2026-04-02 20:41:42.826671+03
260	177	\N	executorGroupIds	-	-	2026-04-02 20:41:42.832176+03
261	178	\N	stateId	\N	Новый	2026-04-02 20:43:43.501147+03
262	181	\N	stateId	\N	Новый	2026-04-02 20:53:10.663187+03
263	182	\N	stateId	\N	Новый	2026-04-02 20:54:15.537976+03
264	186	\N	stateId	\N	Новый	2026-04-02 22:03:40.352394+03
265	187	\N	stateId	\N	Новый	2026-04-02 22:40:54.452844+03
266	188	\N	stateId	\N	Новый	2026-04-02 22:41:28.391182+03
267	189	\N	stateId	\N	Новый	2026-04-03 10:14:27.636741+03
268	193	\N	stateId	\N	Новый	2026-04-03 11:57:03.823643+03
269	193	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-04-03 11:57:03.888873+03
270	193	\N	responseDeadline	Fri Apr 03 2026 12:57:03 GMT+0300 (Москва, стандартное время)	2026-04-03T09:57:03.818Z	2026-04-03 11:57:26.935005+03
271	193	\N	resolutionDeadline	Fri Apr 03 2026 12:57:03 GMT+0300 (Москва, стандартное время)	2026-04-03T09:57:03.818Z	2026-04-03 11:57:26.93895+03
272	193	\N	executorAgentIds	-	-	2026-04-03 11:57:26.942123+03
273	193	\N	executorGroupIds	-	Первая линия поддержки, Вторая линия поддержки	2026-04-03 11:57:26.947802+03
274	194	\N	stateId	\N	Новый	2026-04-03 11:58:52.773803+03
275	194	\N	attachment	\N	Добавлен файл: photo_2026-03-23_09-46-42.jpg	2026-04-03 11:58:52.813918+03
276	195	\N	stateId	\N	Новый	2026-04-03 12:31:58.382585+03
277	195	\N	attachment	\N	Добавлен файл: jira_downloader.py	2026-04-03 12:31:58.438138+03
278	195	\N	responseDeadline	Fri Apr 03 2026 13:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T10:31:58.376Z	2026-04-05 08:29:57.289371+03
279	195	\N	resolutionDeadline	Fri Apr 03 2026 13:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T10:31:58.376Z	2026-04-05 08:29:57.294035+03
280	195	\N	executorAgentIds	-	-	2026-04-05 08:29:57.296696+03
281	195	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-05 08:29:57.301899+03
282	196	\N	stateId	\N	Новый	2026-04-05 08:49:06.940723+03
283	196	\N	description	\N	\N	2026-04-05 09:20:30.508204+03
284	196	\N	executorAgentIds	-	-	2026-04-05 09:20:30.511771+03
285	196	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-05 09:20:30.517585+03
286	195	\N	responseDeadline	Fri Apr 03 2026 10:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T07:31:58.376Z	2026-04-05 09:20:34.874984+03
287	195	\N	resolutionDeadline	Fri Apr 03 2026 10:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T07:31:58.376Z	2026-04-05 09:20:34.879022+03
288	195	\N	executorAgentIds	-	-	2026-04-05 09:20:34.882801+03
289	195	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-05 09:20:34.888597+03
290	195	\N	responseDeadline	Fri Apr 03 2026 07:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T04:31:58.376Z	2026-04-05 09:20:54.536672+03
291	195	\N	resolutionDeadline	Fri Apr 03 2026 07:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T04:31:58.376Z	2026-04-05 09:20:54.541265+03
292	195	\N	executorAgentIds	-	-	2026-04-05 09:20:54.544291+03
293	195	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-05 09:20:54.549952+03
294	195	\N	responseDeadline	Fri Apr 03 2026 04:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T01:31:58.376Z	2026-04-05 09:20:54.645629+03
295	195	\N	resolutionDeadline	Fri Apr 03 2026 04:31:58 GMT+0300 (Москва, стандартное время)	2026-04-03T01:31:58.376Z	2026-04-05 09:20:54.648547+03
296	195	\N	executorAgentIds	-	-	2026-04-05 09:20:54.651496+03
297	195	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-05 09:20:54.655522+03
298	195	\N	responseDeadline	Fri Apr 03 2026 01:31:58 GMT+0300 (Москва, стандартное время)	2026-04-02T22:31:58.376Z	2026-04-05 09:21:08.950782+03
299	195	\N	resolutionDeadline	Fri Apr 03 2026 01:31:58 GMT+0300 (Москва, стандартное время)	2026-04-02T22:31:58.376Z	2026-04-05 09:21:08.95452+03
300	195	\N	executorAgentIds	-	-	2026-04-05 09:21:08.958701+03
301	195	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-05 09:21:08.964888+03
302	195	\N	responseDeadline	Thu Apr 02 2026 22:31:58 GMT+0300 (Москва, стандартное время)	2026-04-02T19:31:58.376Z	2026-04-05 09:21:09.078893+03
303	195	\N	resolutionDeadline	Thu Apr 02 2026 22:31:58 GMT+0300 (Москва, стандартное время)	2026-04-02T19:31:58.376Z	2026-04-05 09:21:09.081471+03
304	195	\N	executorAgentIds	-	-	2026-04-05 09:21:09.084098+03
305	195	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-05 09:21:09.089017+03
306	197	\N	stateId	\N	Новый	2026-04-05 16:56:16.765582+03
307	197	\N	executorAgentIds	-	-	2026-04-05 18:26:09.330527+03
308	197	\N	executorGroupIds	-	Первая линия поддержки	2026-04-05 18:26:09.340421+03
309	198	\N	executorAgentIds	-	-	2026-04-05 18:28:39.577781+03
310	198	\N	executorGroupIds	-	Первая линия поддержки	2026-04-05 18:28:39.583275+03
311	198	\N	executorAgentIds	-	-	2026-04-05 18:28:55.067317+03
312	198	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-05 18:28:55.075303+03
313	198	\N	executorAgentIds	-	-	2026-04-05 18:28:58.331085+03
314	198	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-05 18:28:58.34475+03
315	198	\N	executorAgentIds	-	-	2026-04-05 18:29:09.134108+03
598	335	64	stateId	\N	Новый	2026-04-11 21:02:47.052343+03
316	198	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-05 18:29:09.140164+03
317	198	\N	executorAgentIds	-	-	2026-04-05 18:29:19.54475+03
318	198	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-05 18:29:19.552541+03
319	199	\N	stateId	\N	Новый	2026-04-05 22:39:15.391304+03
320	200	\N	stateId	\N	Новый	2026-04-06 07:35:49.53648+03
321	200	\N	executorAgentIds	-	-	2026-04-06 09:56:02.376864+03
322	200	\N	executorGroupIds	-	Первая линия поддержки	2026-04-06 09:56:02.3858+03
323	200	\N	categoryId	\N	Категория 2	2026-04-06 09:56:34.894008+03
324	200	\N	executorAgentIds	-	-	2026-04-06 09:56:34.8988+03
325	200	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 09:56:34.904924+03
326	201	\N	stateId	\N	Новый	2026-04-06 09:58:11.311995+03
327	202	\N	stateId	\N	Новый	2026-04-06 09:58:11.345958+03
328	204	\N	stateId	\N	Новый	2026-04-06 09:58:11.420785+03
329	205	\N	stateId	\N	Новый	2026-04-06 09:58:11.465494+03
330	206	\N	stateId	\N	Новый	2026-04-06 09:58:11.51285+03
331	206	\N	description	\N	<p>цкец</p>	2026-04-06 10:18:54.056955+03
332	206	\N	priorityId	\N	Критический	2026-04-06 10:18:54.062578+03
333	206	\N	queueId	\N	Очередь	2026-04-06 10:18:54.068078+03
334	206	\N	responseDeadline	Mon Apr 06 2026 10:58:11 GMT+0300 (Москва, стандартное время)	2026-04-06T07:58:11.507Z	2026-04-06 10:18:54.071053+03
335	206	\N	resolutionDeadline	Mon Apr 06 2026 10:58:11 GMT+0300 (Москва, стандартное время)	2026-04-06T07:58:11.507Z	2026-04-06 10:18:54.073958+03
336	206	\N	executorAgentIds	-	-	2026-04-06 10:18:54.077668+03
337	206	\N	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки	2026-04-06 10:18:54.089146+03
338	206	\N	attachment	\N	Добавлен файл: jira_downloader.py	2026-04-06 10:18:54.168149+03
339	206	\N	stateId	Новый	В работе	2026-04-06 10:19:23.121747+03
340	206	\N	responseDeadline	Mon Apr 06 2026 07:58:11 GMT+0300 (Москва, стандартное время)	2026-04-06T04:58:11.507Z	2026-04-06 10:19:23.132775+03
341	206	\N	resolutionDeadline	Mon Apr 06 2026 07:58:11 GMT+0300 (Москва, стандартное время)	2026-04-06T04:58:11.507Z	2026-04-06 10:19:23.135521+03
342	206	\N	executorAgentIds	-	-	2026-04-06 10:19:23.138118+03
343	206	\N	executorGroupIds	Вторая линия поддержки	Вторая линия поддержки	2026-04-06 10:19:23.142557+03
344	207	\N	description	\N	\N	2026-04-06 14:11:27.480849+03
345	207	\N	executorAgentIds	-	-	2026-04-06 14:11:27.491572+03
346	207	\N	executorGroupIds	-	Первая линия поддержки	2026-04-06 14:11:27.497049+03
347	207	\N	typeId	\N	Инцидент	2026-04-06 14:12:04.823663+03
348	207	\N	categoryId	\N	Категория 2	2026-04-06 14:12:04.828353+03
349	207	\N	priorityId	\N	Критический	2026-04-06 14:12:04.831128+03
350	207	\N	queueId	\N	Очередь	2026-04-06 14:12:04.833928+03
351	207	\N	stateId	\N	Новый	2026-04-06 14:12:04.836647+03
352	207	\N	ownerId	\N	1	2026-04-06 14:12:04.846658+03
353	207	\N	companyId	\N	ЗАО "ОбразованиеПлюс"	2026-04-06 14:12:04.84937+03
354	207	\N	serviceId	\N	Поддержка	2026-04-06 14:12:04.85192+03
355	207	\N	slaId	\N	Базовый SLA	2026-04-06 14:12:04.854603+03
356	207	\N	executorAgentIds	Ольга Морозова	Ольга Морозова	2026-04-06 14:12:04.857177+03
357	207	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 14:12:04.862975+03
358	198	\N	priorityId	\N	Критический	2026-04-06 14:19:59.313262+03
359	198	\N	executorAgentIds	-	-	2026-04-06 14:19:59.316708+03
360	198	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 14:19:59.323666+03
361	207	\N	stateId	Новый	В работе	2026-04-06 14:20:52.462179+03
362	207	\N	responseDeadline	Mon Apr 06 2026 22:12:04 GMT+0300 (Москва, стандартное время)	2026-04-06T19:12:04.764Z	2026-04-06 14:20:52.47435+03
363	207	\N	executorAgentIds	-	-	2026-04-06 14:20:52.477189+03
364	207	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 14:20:52.483611+03
365	198	\N	description	<p>цуйкуцй</p>	<p>цуйкуцй ва </p>	2026-04-06 14:21:45.178387+03
366	198	\N	typeId	Запрос на обслуживание	Инцидент	2026-04-06 14:21:45.182199+03
367	198	\N	queueId	\N	Очередь	2026-04-06 14:21:45.184877+03
368	198	\N	stateId	\N	Новый	2026-04-06 14:21:45.188309+03
369	198	\N	ownerId	\N	1	2026-04-06 14:21:45.195358+03
370	198	\N	companyId	\N	ЗАО "ОбразованиеПлюс"	2026-04-06 14:21:45.198224+03
371	198	\N	serviceId	\N	SLA	2026-04-06 14:21:45.200969+03
372	198	\N	slaId	\N	Премиум SLA	2026-04-06 14:21:45.203633+03
373	198	\N	executorAgentIds	Виктория Козлова, Ольга Морозова	Виктория Козлова, Ольга Морозова	2026-04-06 14:21:45.206476+03
374	198	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 14:21:45.211329+03
375	207	\N	stateId	В работе	Решен	2026-04-06 14:35:29.524547+03
376	207	\N	responseDeadline	Mon Apr 06 2026 19:12:04 GMT+0300 (Москва, стандартное время)	2026-04-06T16:12:04.764Z	2026-04-06 14:35:29.537073+03
377	207	\N	executorAgentIds	-	-	2026-04-06 14:35:29.539932+03
378	207	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 14:35:29.544796+03
379	207	\N	stateId	Решен	Закрыт	2026-04-06 14:35:44.557386+03
380	207	\N	responseDeadline	Mon Apr 06 2026 16:12:04 GMT+0300 (Москва, стандартное время)	2026-04-06T13:12:04.764Z	2026-04-06 14:35:44.566182+03
381	207	\N	executorAgentIds	-	-	2026-04-06 14:35:44.569129+03
382	207	\N	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-06 14:35:44.576291+03
383	208	59	executorAgentIds	-	-	2026-04-06 15:31:15.851507+03
384	208	59	executorGroupIds	-	Первая линия поддержки	2026-04-06 15:31:15.859195+03
385	209	59	stateId	\N	Новый	2026-04-06 15:32:05.416576+03
386	209	59	stateId	Новый	В работе	2026-04-06 15:33:37.366211+03
387	209	59	serviceId	SLA	Агенты	2026-04-06 15:33:37.398157+03
388	209	59	responseDeadline	Mon Apr 06 2026 16:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T13:32:05.405Z	2026-04-06 15:33:37.401724+03
389	209	59	resolutionDeadline	Mon Apr 06 2026 16:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T13:32:05.405Z	2026-04-06 15:33:37.405453+03
390	209	59	executorAgentIds	-	-	2026-04-06 15:33:37.409393+03
391	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-06 15:33:37.418908+03
392	209	59	description	<p style="text-align: left;"><strong>Тикет&nbsp;1<...	<p style="text-align: left;"><strong>Тикет&nbsp;1<...	2026-04-06 15:36:10.324397+03
599	336	64	stateId	\N	Новый	2026-04-11 21:02:47.094224+03
393	209	59	responseDeadline	Mon Apr 06 2026 13:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T10:32:05.405Z	2026-04-06 15:36:10.327603+03
394	209	59	resolutionDeadline	Mon Apr 06 2026 13:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T10:32:05.405Z	2026-04-06 15:36:10.332131+03
395	209	59	executorAgentIds	-	-	2026-04-06 15:36:10.334973+03
396	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-06 15:36:10.340326+03
397	209	59	responseDeadline	Mon Apr 06 2026 10:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T07:32:05.405Z	2026-04-06 16:20:04.606265+03
398	209	59	resolutionDeadline	Mon Apr 06 2026 10:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T07:32:05.405Z	2026-04-06 16:20:04.610399+03
399	209	59	executorAgentIds	-	-	2026-04-06 16:20:04.613358+03
400	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-06 16:20:04.618647+03
401	209	59	typeId	Инцидент	Запрос на обслуживание	2026-04-06 17:07:34.007339+03
402	209	59	categoryId	Категория 2	Доступ  пропал	2026-04-06 17:07:34.012109+03
403	209	59	responseDeadline	Mon Apr 06 2026 07:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T04:32:05.405Z	2026-04-06 17:07:34.015014+03
404	209	59	resolutionDeadline	Mon Apr 06 2026 07:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T04:32:05.405Z	2026-04-06 17:07:34.018049+03
405	209	59	executorAgentIds	-	-	2026-04-06 17:07:34.020911+03
406	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-06 17:07:34.026253+03
407	209	59	responseDeadline	Mon Apr 06 2026 04:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T01:32:05.405Z	2026-04-06 21:52:56.397745+03
408	209	59	resolutionDeadline	Mon Apr 06 2026 04:32:05 GMT+0300 (Москва, стандартное время)	2026-04-06T01:32:05.405Z	2026-04-06 21:52:56.401981+03
409	209	59	executorAgentIds	-	-	2026-04-06 21:52:56.407996+03
410	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-06 21:52:56.414388+03
411	209	59	responseDeadline	Mon Apr 06 2026 01:32:05 GMT+0300 (Москва, стандартное время)	2026-04-05T22:32:05.405Z	2026-04-09 09:02:36.55525+03
412	209	59	resolutionDeadline	Mon Apr 06 2026 01:32:05 GMT+0300 (Москва, стандартное время)	2026-04-05T22:32:05.405Z	2026-04-09 09:02:36.562254+03
413	209	59	executorAgentIds	-	-	2026-04-09 09:02:36.565013+03
414	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-09 09:02:36.570688+03
415	210	59	stateId	\N	Новый	2026-04-09 10:14:57.396476+03
416	210	59	stateId	Новый	На удержании	2026-04-09 10:19:17.710144+03
417	210	59	responseDeadline	Thu Apr 09 2026 14:14:57 GMT+0300 (Москва, стандартное время)	2026-04-09T11:14:57.386Z	2026-04-09 10:19:17.722205+03
418	210	59	executorAgentIds	-	-	2026-04-09 10:19:17.725182+03
419	210	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 10:19:17.731735+03
420	211	59	stateId	\N	Новый	2026-04-09 10:20:14.491136+03
421	211	59	description	\N	\N	2026-04-09 10:20:39.805547+03
422	211	59	stateId	Новый	На удержании	2026-04-09 10:20:39.808768+03
423	211	59	executorAgentIds	-	-	2026-04-09 10:20:39.816289+03
424	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 10:20:39.82639+03
425	211	59	stateId	На удержании	Эскалирован	2026-04-09 10:20:52.212082+03
426	211	59	executorAgentIds	-	-	2026-04-09 10:20:52.219633+03
427	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 10:20:52.225033+03
428	211	59	executorAgentIds	-	-	2026-04-09 10:38:00.5819+03
429	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 10:38:00.588151+03
430	211	59	queueId	\N	Очередь	2026-04-09 11:19:45.140702+03
431	211	59	stateId	В работе	Эскалирована	2026-04-09 11:19:45.151781+03
432	211	59	executorAgentIds	-	-	2026-04-09 11:19:45.162778+03
433	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:19:45.172526+03
434	211	59	stateId	Эскалирована	В работе	2026-04-09 11:21:30.989607+03
435	211	59	executorAgentIds	-	-	2026-04-09 11:21:30.99994+03
436	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:21:31.006267+03
437	211	59	stateId	В работе	Эскалирована	2026-04-09 11:28:10.764845+03
438	211	59	executorAgentIds	-	-	2026-04-09 11:28:10.776969+03
439	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:28:10.782491+03
440	212	59	stateId	\N	Новый	2026-04-09 11:30:56.637732+03
441	212	59	description	\N	\N	2026-04-09 11:31:17.802868+03
442	212	59	stateId	Новый	В работе	2026-04-09 11:31:17.805913+03
443	212	59	executorAgentIds	-	-	2026-04-09 11:31:17.813094+03
444	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:31:17.817669+03
445	212	59	stateId	В работе	Эскалирована	2026-04-09 11:31:30.034791+03
446	212	59	executorAgentIds	-	-	2026-04-09 11:31:30.041046+03
447	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:31:30.04501+03
448	212	59	stateId	Эскалирована	В работе	2026-04-09 11:32:00.88513+03
449	212	59	executorAgentIds	-	-	2026-04-09 11:32:00.891735+03
450	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:32:00.895712+03
451	212	59	stateId	В работе	Эскалирована	2026-04-09 11:32:14.606511+03
452	212	59	executorAgentIds	-	-	2026-04-09 11:32:14.612995+03
453	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:32:14.616938+03
454	212	59	executorAgentIds	-	-	2026-04-09 11:38:27.247344+03
455	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:38:27.253692+03
456	212	59	executorAgentIds	-	-	2026-04-09 11:38:53.863524+03
600	337	64	stateId	\N	Новый	2026-04-11 21:02:47.134607+03
457	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:38:53.869417+03
458	212	59	executorAgentIds	-	-	2026-04-09 11:39:37.47749+03
459	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:39:37.483202+03
460	212	59	executorAgentIds	-	-	2026-04-09 11:40:03.568019+03
461	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:40:03.573341+03
462	212	59	executorAgentIds	-	-	2026-04-09 11:40:07.419858+03
463	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:40:07.424991+03
464	212	59	executorAgentIds	-	-	2026-04-09 11:49:22.250845+03
465	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:49:22.256135+03
466	212	59	executorAgentIds	-	-	2026-04-09 11:49:38.119914+03
467	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:49:38.12559+03
468	212	59	executorAgentIds	-	-	2026-04-09 11:54:25.386425+03
469	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:54:25.394783+03
470	212	59	executorAgentIds	-	-	2026-04-09 11:54:34.634756+03
471	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:54:34.643383+03
472	212	59	executorAgentIds	-	-	2026-04-09 11:54:42.828268+03
473	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:54:42.834257+03
474	212	59	executorAgentIds	-	-	2026-04-09 11:54:53.998917+03
475	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:54:54.008955+03
476	212	59	executorAgentIds	-	-	2026-04-09 11:58:46.145614+03
477	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:58:46.154261+03
478	212	59	stateId	Эскалирована	В работе	2026-04-09 11:58:59.46883+03
479	212	59	executorAgentIds	-	-	2026-04-09 11:58:59.477528+03
480	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:58:59.483964+03
481	212	59	stateId	В работе	Эскалирована	2026-04-09 11:59:28.86497+03
482	212	59	executorAgentIds	-	-	2026-04-09 11:59:28.874332+03
483	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 11:59:28.879025+03
484	212	59	executorAgentIds	-	-	2026-04-09 11:59:47.360519+03
485	212	59	executorGroupIds	Первая линия поддержки	-	2026-04-09 11:59:47.366691+03
486	212	59	executorAgentIds	-	-	2026-04-09 11:59:47.459535+03
487	212	59	executorGroupIds	-	Первая линия поддержки	2026-04-09 11:59:47.464697+03
488	212	59	executorAgentIds	-	-	2026-04-09 12:00:06.44757+03
489	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:00:06.453786+03
490	212	59	executorAgentIds	-	-	2026-04-09 12:00:38.579097+03
491	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:00:38.590917+03
492	212	59	executorAgentIds	-	-	2026-04-09 12:00:48.743647+03
493	212	59	executorGroupIds	Первая линия поддержки	-	2026-04-09 12:00:48.747838+03
494	212	59	executorAgentIds	-	-	2026-04-09 12:00:48.843628+03
495	212	59	executorGroupIds	-	Первая линия поддержки	2026-04-09 12:00:48.847951+03
496	212	59	executorAgentIds	-	-	2026-04-09 12:00:52.690711+03
497	212	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:00:52.696069+03
498	212	59	executorAgentIds	-	-	2026-04-09 12:01:18.488261+03
499	212	59	executorGroupIds	Первая линия поддержки	Вторая линия поддержки	2026-04-09 12:01:18.496275+03
500	212	59	executorAgentIds	-	-	2026-04-09 12:01:29.156979+03
501	212	59	executorGroupIds	Вторая линия поддержки	Вторая линия поддержки	2026-04-09 12:01:29.160807+03
502	213	59	stateId	\N	Новый	2026-04-09 12:03:07.092344+03
503	213	59	description	\N	\N	2026-04-09 12:03:49.075323+03
504	213	59	stateId	Новый	В работе	2026-04-09 12:03:49.078093+03
505	213	59	responseDeadline	Thu Apr 09 2026 13:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T10:03:07.087Z	2026-04-09 12:03:49.084445+03
506	213	59	resolutionDeadline	Thu Apr 09 2026 13:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T10:03:07.087Z	2026-04-09 12:03:49.087302+03
507	213	59	executorAgentIds	-	-	2026-04-09 12:03:49.090099+03
508	213	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:03:49.094221+03
509	213	59	stateId	В работе	Эскалирована	2026-04-09 12:03:59.863608+03
510	213	59	responseDeadline	Thu Apr 09 2026 10:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T07:03:07.087Z	2026-04-09 12:03:59.870396+03
511	213	59	resolutionDeadline	Thu Apr 09 2026 10:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T07:03:07.087Z	2026-04-09 12:03:59.873342+03
512	213	59	executorAgentIds	-	-	2026-04-09 12:03:59.876103+03
513	213	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:03:59.881332+03
514	213	59	responseDeadline	Thu Apr 09 2026 07:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T04:03:07.087Z	2026-04-09 12:04:18.351772+03
515	213	59	resolutionDeadline	Thu Apr 09 2026 07:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T04:03:07.087Z	2026-04-09 12:04:18.355304+03
516	213	59	executorAgentIds	-	-	2026-04-09 12:04:18.358169+03
517	213	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:04:18.362317+03
518	213	59	responseDeadline	Thu Apr 09 2026 04:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T01:03:07.087Z	2026-04-09 12:04:51.736607+03
519	213	59	resolutionDeadline	Thu Apr 09 2026 04:03:07 GMT+0300 (Москва, стандартное время)	2026-04-09T01:03:07.087Z	2026-04-09 12:04:51.742806+03
520	213	59	executorAgentIds	-	-	2026-04-09 12:04:51.745433+03
521	213	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:04:51.749957+03
522	213	59	stateId	Эскалирована	В работе	2026-04-09 12:04:57.427844+03
523	213	59	responseDeadline	Thu Apr 09 2026 01:03:07 GMT+0300 (Москва, стандартное время)	2026-04-08T22:03:07.087Z	2026-04-09 12:04:57.437494+03
601	338	64	stateId	\N	Новый	2026-04-11 21:02:47.166694+03
602	339	64	stateId	\N	Новый	2026-04-11 21:02:47.19396+03
524	213	59	resolutionDeadline	Thu Apr 09 2026 01:03:07 GMT+0300 (Москва, стандартное время)	2026-04-08T22:03:07.087Z	2026-04-09 12:04:57.440208+03
525	213	59	executorAgentIds	-	-	2026-04-09 12:04:57.443081+03
526	213	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:04:57.449716+03
527	212	59	executorAgentIds	-	-	2026-04-09 12:05:09.979124+03
528	212	59	executorGroupIds	Вторая линия поддержки	Вторая линия поддержки	2026-04-09 12:05:09.986167+03
529	211	59	executorAgentIds	-	-	2026-04-09 12:07:04.377021+03
530	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:07:04.38176+03
531	211	59	stateId	Эскалирована	В работе	2026-04-09 12:07:10.739747+03
532	211	59	executorAgentIds	-	-	2026-04-09 12:07:10.747404+03
533	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:07:10.751479+03
534	211	59	stateId	В работе	Решен	2026-04-09 12:07:18.164755+03
535	211	59	executorAgentIds	-	-	2026-04-09 12:07:18.171771+03
536	211	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 12:07:18.176496+03
537	212	59	executorAgentIds	-	-	2026-04-09 12:07:24.295565+03
538	212	59	executorGroupIds	Вторая линия поддержки	Вторая линия поддержки	2026-04-09 12:07:24.300677+03
539	215	59	stateId	\N	Новый	2026-04-09 13:43:18.304795+03
540	216	59	stateId	\N	Новый	2026-04-09 15:40:08.20507+03
541	216	59	categoryId	\N	Категория 2	2026-04-09 15:41:21.160414+03
542	216	59	priorityId	\N	Критический	2026-04-09 15:41:21.166239+03
543	216	59	stateId	Новый	В работе	2026-04-09 15:41:21.169446+03
544	216	59	ownerId	\N	1	2026-04-09 15:41:21.178642+03
545	216	59	companyId	\N	ЗАО "ОбразованиеПлюс"	2026-04-09 15:41:21.18159+03
546	216	59	serviceId	\N	Email	2026-04-09 15:41:21.184385+03
547	216	59	slaId	\N	Базовый SLA	2026-04-09 15:41:21.186989+03
548	216	59	executorAgentIds	-	Ольга Морозова	2026-04-09 15:41:21.189548+03
549	216	59	executorGroupIds	-	Первая линия поддержки	2026-04-09 15:41:21.192206+03
550	216	59	stateId	В работе	Эскалирована	2026-04-09 15:41:32.966102+03
551	216	59	responseDeadline	Thu Apr 09 2026 23:41:21 GMT+0300 (Москва, стандартное время)	2026-04-09T20:41:21.130Z	2026-04-09 15:41:32.975906+03
552	216	59	executorAgentIds	-	-	2026-04-09 15:41:32.978629+03
553	216	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 15:41:32.981512+03
554	216	59	responseDeadline	Thu Apr 09 2026 20:41:21 GMT+0300 (Москва, стандартное время)	2026-04-09T17:41:21.130Z	2026-04-09 15:41:42.463608+03
555	216	59	executorAgentIds	-	-	2026-04-09 15:41:42.466416+03
556	216	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 15:41:42.468922+03
557	216	59	responseDeadline	Thu Apr 09 2026 17:41:21 GMT+0300 (Москва, стандартное время)	2026-04-09T14:41:21.130Z	2026-04-09 15:41:48.694925+03
558	216	59	executorAgentIds	-	-	2026-04-09 15:41:48.697606+03
559	216	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 15:41:48.700114+03
560	216	59	queueId	\N	Очередь	2026-04-09 15:41:58.240649+03
561	216	59	stateId	Эскалирована	В работе	2026-04-09 15:41:58.245164+03
562	216	59	responseDeadline	Thu Apr 09 2026 14:41:21 GMT+0300 (Москва, стандартное время)	2026-04-09T11:41:21.130Z	2026-04-09 15:41:58.25366+03
563	216	59	executorAgentIds	-	-	2026-04-09 15:41:58.25656+03
564	216	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-09 15:41:58.259417+03
565	218	59	stateId	\N	Новый	2026-04-09 22:52:57.556277+03
566	249	59	stateId	\N	Новый	2026-04-10 09:02:50.502135+03
567	252	59	stateId	\N	Новый	2026-04-10 09:02:50.611192+03
568	253	59	stateId	\N	Новый	2026-04-10 09:02:50.652544+03
569	254	59	stateId	\N	Новый	2026-04-10 09:02:50.69548+03
570	255	59	stateId	\N	Новый	2026-04-10 09:02:50.741514+03
571	268	59	stateId	\N	Новый	2026-04-10 09:37:11.263012+03
572	209	59	responseDeadline	Sun Apr 05 2026 22:32:05 GMT+0300 (Москва, стандартное время)	2026-04-05T19:32:05.405Z	2026-04-10 09:42:19.011005+03
573	209	59	resolutionDeadline	Sun Apr 05 2026 22:32:05 GMT+0300 (Москва, стандартное время)	2026-04-05T19:32:05.405Z	2026-04-10 09:42:19.011005+03
574	209	59	executorAgentIds	-	-	2026-04-10 09:42:19.011005+03
575	209	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-10 09:42:19.011005+03
576	195	59	title	sadsadas	Расписание тест 	2026-04-10 11:23:04.281662+03
577	195	59	responseDeadline	Thu Apr 02 2026 19:31:58 GMT+0300 (Москва, стандартное время)	2026-04-02T16:31:58.376Z	2026-04-10 11:23:04.281662+03
578	195	59	resolutionDeadline	Thu Apr 02 2026 19:31:58 GMT+0300 (Москва, стандартное время)	2026-04-02T16:31:58.376Z	2026-04-10 11:23:04.281662+03
579	195	59	executorAgentIds	-	-	2026-04-10 11:23:04.281662+03
580	195	59	executorGroupIds	Вторая линия поддержки, Первая линия поддержки	Вторая линия поддержки, Первая линия поддержки	2026-04-10 11:23:04.281662+03
581	270	59	stateId	\N	Новый	2026-04-10 11:23:10.401399+03
582	296	59	stateId	\N	Новый	2026-04-10 11:50:02.511953+03
583	326	59	stateId	\N	Новый	2026-04-10 14:29:44.480198+03
584	332	59	stateId	\N	Новый	2026-04-11 18:56:24.858611+03
585	332	59	categoryId	\N	Категория 2	2026-04-11 19:06:31.535477+03
586	332	59	queueId	\N	Test Updated	2026-04-11 19:06:31.535477+03
587	332	59	executorAgentIds	-	-	2026-04-11 19:06:31.535477+03
588	332	59	executorGroupIds	-	Вторая линия поддержки	2026-04-11 19:06:31.535477+03
589	333	59	stateId	\N	Новый	2026-04-11 21:00:02.049963+03
590	332	59	description	<p>qdxqw</p>	<p>qdxqwtr</p>	2026-04-11 21:00:45.675909+03
591	332	59	executorAgentIds	-	-	2026-04-11 21:00:45.675909+03
592	332	59	executorGroupIds	Вторая линия поддержки	Вторая линия поддержки	2026-04-11 21:00:45.675909+03
593	333	64	stateId	Новый	В работе	2026-04-11 21:01:58.848839+03
594	333	64	responseDeadline	Sun Apr 12 2026 12:00:02 GMT+0300 (Москва, стандартное время)	2026-04-12T09:00:02.043Z	2026-04-11 21:01:58.848839+03
595	333	64	executorAgentIds	-	-	2026-04-11 21:01:58.848839+03
596	333	64	executorGroupIds	Вторая линия поддержки	Вторая линия поддержки	2026-04-11 21:01:58.848839+03
597	334	64	stateId	\N	Новый	2026-04-11 21:02:23.791228+03
603	340	64	stateId	\N	Новый	2026-04-11 21:02:47.223047+03
604	329	64	executorAgentIds	-	-	2026-04-11 21:03:57.53358+03
605	329	64	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-11 21:03:57.53358+03
606	329	64	title	Расписание (Р) тест	Расписание (Р) тестr	2026-04-11 21:04:32.617119+03
607	329	64	typeId	Инцидент	Запрос на обслуживание	2026-04-11 21:04:32.617119+03
608	329	64	categoryId	Категория 2	Доступ  пропал	2026-04-11 21:04:32.617119+03
609	329	64	executorAgentIds	-	-	2026-04-11 21:04:32.617119+03
610	329	64	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-11 21:04:32.617119+03
611	341	64	stateId	\N	Новый	2026-04-11 21:04:54.346045+03
612	342	59	categoryId	Категория 2	Доступ  пропал	2026-04-14 11:36:55.370287+03
613	342	59	executorAgentIds	-	-	2026-04-14 11:36:55.370287+03
614	342	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-14 11:36:55.370287+03
615	342	59	priorityId	\N	Критический	2026-04-14 11:37:10.255436+03
616	342	59	queueId	\N	Очередь 1 линии	2026-04-14 11:37:10.255436+03
617	342	59	executorAgentIds	-	-	2026-04-14 11:37:10.255436+03
618	342	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-14 11:37:10.255436+03
619	342	59	companyId	\N	ЗАО "ОбразованиеПлюс"	2026-04-14 11:37:29.49411+03
620	342	59	serviceId	\N	SLA	2026-04-14 11:37:29.49411+03
621	342	59	slaId	\N	Базовый SLA	2026-04-14 11:37:29.49411+03
622	342	59	executorAgentIds	-	-	2026-04-14 11:37:29.49411+03
623	342	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-14 11:37:29.49411+03
624	342	59	ownerId	\N	1	2026-04-14 11:38:03.339973+03
625	342	59	responseDeadline	Tue Apr 14 2026 19:37:29 GMT+0300 (Москва, стандартное время)	2026-04-14T16:37:29.459Z	2026-04-14 11:38:03.339973+03
626	342	59	executorAgentIds	Ольга Морозова	Ольга Морозова	2026-04-14 11:38:03.339973+03
627	342	59	executorGroupIds	Первая линия поддержки	Первая линия поддержки	2026-04-14 11:38:03.339973+03
\.


--
-- Data for Name: ticket_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_notifications (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_schedule_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_schedule_logs (id, schedule_id, executed_at, created_ticket_id, created_ticket_number, status, error_message, details, created_at) FROM stdin;
1	33	2026-04-10 11:53:14.549	329	1000332	success	\N	{"originalTicketId": 326}	2026-04-10 14:53:14.566118
2	33	2026-04-10 12:07:11.715	330	1000333	success	\N	{"originalTicketId": 326}	2026-04-10 15:07:11.720515
3	33	2026-04-11 11:31:25.259	331	1000334	success	\N	{"originalTicketId": 326}	2026-04-11 14:31:25.293199
4	33	2026-04-12 08:31:20.451	342	1000345	success	\N	{"originalTicketId": 326}	2026-04-12 11:31:20.504484
\.


--
-- Data for Name: ticket_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_schedules (id, ticket_id, schedule_type, schedule_time, schedule_days, schedule_day_of_month, start_date, end_date, is_active, last_run_at, next_run_at, title, description, type_id, category_id, priority_id, queue_id, state_id, owner_id, executor_agent_ids, executor_group_ids, company_id, service_id, sla_id, created_at, updated_at, title_prefix) FROM stdin;
33	326	daily	14:31	\N	1	2026-04-10	2026-04-12	f	2026-04-12 08:31:20.451	2026-04-13 11:31:00	тест	<p>авмавмавм</p>	1	3	\N	\N	2	\N	{59}	{110}	\N	\N	\N	2026-04-10 14:30:05.647647	2026-04-14 10:26:00.517469	Расписание (Р) 
\.


--
-- Data for Name: ticket_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_status_history (id, ticket_id, from_status_id, to_status_id, transition_id, changed_by, comment, created_at, transition_time, time_in_previous_status, action_label) FROM stdin;
1	22	\N	2	\N	\N	\N	2026-02-22 17:39:29.302718+03	2026-02-22 17:39:29.302718+03	\N	Создание тикета
2	22	2	4	\N	\N	\N	2026-02-22 17:40:26.645348+03	2026-02-22 17:40:26.645348+03	00:00:57.341	\N
3	22	4	7	\N	\N	\N	2026-02-22 17:53:27.020589+03	2026-02-22 17:53:27.020589+03	00:13:00.374	\N
4	23	\N	2	\N	\N	\N	2026-03-02 23:16:40.394321+03	2026-03-02 23:16:40.394321+03	\N	Создание тикета
5	25	\N	2	\N	\N	\N	2026-03-03 09:56:17.625623+03	2026-03-03 09:56:17.625623+03	\N	Создание тикета
6	26	\N	2	\N	\N	\N	2026-03-03 10:49:24.839193+03	2026-03-03 10:49:24.839193+03	\N	Создание тикета
7	30	\N	2	\N	\N	\N	2026-03-03 11:35:31.445973+03	2026-03-03 11:35:31.445973+03	\N	Создание тикета
8	31	\N	2	\N	\N	\N	2026-03-03 12:52:56.535356+03	2026-03-03 12:52:56.535356+03	\N	Создание тикета
9	31	2	4	\N	\N	\N	2026-03-10 23:08:40.538078+03	2026-03-10 23:08:40.538078+03	7 days 10:15:44.001	\N
10	33	\N	2	\N	\N	\N	2026-03-25 11:38:52.93509+03	2026-03-25 11:38:52.93509+03	\N	Создание тикета
11	34	\N	2	\N	\N	\N	2026-03-25 16:26:19.850464+03	2026-03-25 16:26:19.850464+03	\N	Создание тикета
12	35	\N	2	\N	\N	\N	2026-03-25 16:33:45.25012+03	2026-03-25 16:33:45.25012+03	\N	Создание тикета
13	39	\N	2	\N	\N	\N	2026-03-26 14:21:05.394644+03	2026-03-26 14:21:05.394644+03	\N	Создание тикета
14	40	\N	2	\N	\N	\N	2026-03-26 14:22:33.405121+03	2026-03-26 14:22:33.405121+03	\N	Создание тикета
15	45	\N	2	\N	\N	\N	2026-03-26 14:22:33.589878+03	2026-03-26 14:22:33.589878+03	\N	Создание тикета
16	46	\N	2	\N	\N	\N	2026-03-26 14:22:44.082958+03	2026-03-26 14:22:44.082958+03	\N	Создание тикета
17	51	\N	2	\N	\N	\N	2026-03-26 14:22:44.216274+03	2026-03-26 14:22:44.216274+03	\N	Создание тикета
18	52	\N	2	\N	\N	\N	2026-03-26 14:22:44.254087+03	2026-03-26 14:22:44.254087+03	\N	Создание тикета
19	57	\N	2	\N	\N	\N	2026-03-26 14:22:44.379917+03	2026-03-26 14:22:44.379917+03	\N	Создание тикета
20	58	\N	2	\N	\N	\N	2026-03-26 14:22:49.994006+03	2026-03-26 14:22:49.994006+03	\N	Создание тикета
21	63	\N	2	\N	\N	\N	2026-03-26 14:22:50.152683+03	2026-03-26 14:22:50.152683+03	\N	Создание тикета
22	64	\N	2	\N	\N	\N	2026-03-26 14:22:50.183139+03	2026-03-26 14:22:50.183139+03	\N	Создание тикета
23	69	\N	2	\N	\N	\N	2026-03-26 14:22:50.326516+03	2026-03-26 14:22:50.326516+03	\N	Создание тикета
24	70	\N	2	\N	\N	\N	2026-03-26 14:22:50.361314+03	2026-03-26 14:22:50.361314+03	\N	Создание тикета
25	75	\N	2	\N	\N	\N	2026-03-26 14:22:50.486051+03	2026-03-26 14:22:50.486051+03	\N	Создание тикета
26	76	\N	2	\N	\N	\N	2026-03-26 14:22:50.517164+03	2026-03-26 14:22:50.517164+03	\N	Создание тикета
27	81	\N	2	\N	\N	\N	2026-03-26 14:22:50.646744+03	2026-03-26 14:22:50.646744+03	\N	Создание тикета
28	82	\N	2	\N	\N	\N	2026-03-26 14:22:55.456099+03	2026-03-26 14:22:55.456099+03	\N	Создание тикета
29	87	\N	2	\N	\N	\N	2026-03-26 14:22:55.607098+03	2026-03-26 14:22:55.607098+03	\N	Создание тикета
30	88	\N	2	\N	\N	\N	2026-03-26 14:22:55.641483+03	2026-03-26 14:22:55.641483+03	\N	Создание тикета
31	93	\N	2	\N	\N	\N	2026-03-26 14:22:55.765838+03	2026-03-26 14:22:55.765838+03	\N	Создание тикета
32	94	\N	2	\N	\N	\N	2026-03-26 14:22:55.791719+03	2026-03-26 14:22:55.791719+03	\N	Создание тикета
33	99	\N	2	\N	\N	\N	2026-03-26 14:22:55.92797+03	2026-03-26 14:22:55.92797+03	\N	Создание тикета
34	100	\N	2	\N	\N	\N	2026-03-26 14:22:55.958381+03	2026-03-26 14:22:55.958381+03	\N	Создание тикета
35	105	\N	2	\N	\N	\N	2026-03-26 14:22:56.090595+03	2026-03-26 14:22:56.090595+03	\N	Создание тикета
36	106	\N	2	\N	\N	\N	2026-03-26 14:22:56.122863+03	2026-03-26 14:22:56.122863+03	\N	Создание тикета
37	111	\N	2	\N	\N	\N	2026-03-26 14:22:56.242451+03	2026-03-26 14:22:56.242451+03	\N	Создание тикета
38	112	\N	2	\N	\N	\N	2026-03-26 14:22:56.270816+03	2026-03-26 14:22:56.270816+03	\N	Создание тикета
39	117	\N	2	\N	\N	\N	2026-03-26 14:22:56.399364+03	2026-03-26 14:22:56.399364+03	\N	Создание тикета
40	118	\N	2	\N	\N	\N	2026-03-26 14:22:56.423944+03	2026-03-26 14:22:56.423944+03	\N	Создание тикета
41	123	\N	2	\N	\N	\N	2026-03-26 14:22:56.54528+03	2026-03-26 14:22:56.54528+03	\N	Создание тикета
42	124	\N	2	\N	\N	\N	2026-03-26 14:22:56.573387+03	2026-03-26 14:22:56.573387+03	\N	Создание тикета
43	127	\N	2	\N	\N	\N	2026-03-26 14:30:20.505301+03	2026-03-26 14:30:20.505301+03	\N	Создание тикета
44	128	\N	2	\N	\N	\N	2026-03-26 14:30:20.549179+03	2026-03-26 14:30:20.549179+03	\N	Создание тикета
45	133	\N	2	\N	\N	\N	2026-03-26 14:30:20.682401+03	2026-03-26 14:30:20.682401+03	\N	Создание тикета
46	134	\N	2	\N	\N	\N	2026-03-26 14:30:20.717668+03	2026-03-26 14:30:20.717668+03	\N	Создание тикета
47	137	\N	2	\N	\N	\N	2026-03-26 14:38:54.439376+03	2026-03-26 14:38:54.439376+03	\N	Создание тикета
48	136	\N	3	\N	\N	\N	2026-03-26 14:50:10.662759+03	2026-03-26 14:50:10.662759+03	\N	\N
49	139	\N	2	\N	\N	\N	2026-03-26 15:32:42.701399+03	2026-03-26 15:32:42.701399+03	\N	Создание тикета
50	140	\N	2	\N	\N	\N	2026-03-26 17:08:37.582097+03	2026-03-26 17:08:37.582097+03	\N	Создание тикета
51	141	\N	2	\N	\N	\N	2026-03-26 17:09:49.832532+03	2026-03-26 17:09:49.832532+03	\N	Создание тикета
52	142	\N	2	\N	\N	\N	2026-03-26 17:10:23.67929+03	2026-03-26 17:10:23.67929+03	\N	Создание тикета
53	143	\N	2	\N	\N	\N	2026-03-26 17:11:48.69648+03	2026-03-26 17:11:48.69648+03	\N	Создание тикета
54	144	\N	2	\N	\N	\N	2026-03-26 17:11:48.762416+03	2026-03-26 17:11:48.762416+03	\N	Создание тикета
55	145	\N	2	\N	\N	\N	2026-03-26 17:11:48.810368+03	2026-03-26 17:11:48.810368+03	\N	Создание тикета
56	146	\N	2	\N	\N	\N	2026-03-27 13:24:21.018842+03	2026-03-27 13:24:21.018842+03	\N	Создание тикета
57	147	\N	2	\N	\N	\N	2026-03-27 13:24:24.590975+03	2026-03-27 13:24:24.590975+03	\N	Создание тикета
58	148	\N	2	\N	\N	\N	2026-03-27 13:24:24.616665+03	2026-03-27 13:24:24.616665+03	\N	Создание тикета
59	149	\N	2	\N	\N	\N	2026-03-27 13:24:27.929171+03	2026-03-27 13:24:27.929171+03	\N	Создание тикета
60	150	\N	2	\N	\N	\N	2026-03-27 13:24:27.986801+03	2026-03-27 13:24:27.986801+03	\N	Создание тикета
61	151	\N	2	\N	\N	\N	2026-03-27 13:24:28.004843+03	2026-03-27 13:24:28.004843+03	\N	Создание тикета
62	152	\N	2	\N	\N	\N	2026-03-27 13:24:28.022725+03	2026-03-27 13:24:28.022725+03	\N	Создание тикета
63	157	\N	2	\N	\N	\N	2026-03-31 16:49:24.218629+03	2026-03-31 16:49:24.218629+03	\N	Создание тикета
64	158	\N	2	\N	\N	\N	2026-03-31 16:53:20.871858+03	2026-03-31 16:53:20.871858+03	\N	Создание тикета
65	159	\N	2	\N	\N	\N	2026-04-02 08:55:04.436275+03	2026-04-02 08:55:04.436275+03	\N	Создание тикета
66	160	\N	2	\N	\N	\N	2026-04-02 09:17:14.273855+03	2026-04-02 09:17:14.273855+03	\N	Создание тикета
67	161	\N	2	\N	\N	\N	2026-04-02 17:29:58.347349+03	2026-04-02 17:29:58.347349+03	\N	Создание тикета
68	162	\N	2	\N	\N	\N	2026-04-02 17:41:52.485691+03	2026-04-02 17:41:52.485691+03	\N	Создание тикета
69	164	\N	2	\N	\N	\N	2026-04-02 17:48:03.878347+03	2026-04-02 17:48:03.878347+03	\N	Создание тикета
70	165	\N	2	\N	\N	\N	2026-04-02 17:52:57.395436+03	2026-04-02 17:52:57.395436+03	\N	Создание тикета
71	166	\N	2	\N	\N	\N	2026-04-02 17:55:52.090682+03	2026-04-02 17:55:52.090682+03	\N	Создание тикета
72	167	\N	2	\N	\N	\N	2026-04-02 17:56:33.862441+03	2026-04-02 17:56:33.862441+03	\N	Создание тикета
73	170	\N	2	\N	\N	\N	2026-04-02 19:58:03.345467+03	2026-04-02 19:58:03.345467+03	\N	Создание тикета
74	172	\N	2	\N	\N	\N	2026-04-02 20:18:40.734069+03	2026-04-02 20:18:40.734069+03	\N	Создание тикета
75	173	\N	2	\N	\N	\N	2026-04-02 20:29:44.520857+03	2026-04-02 20:29:44.520857+03	\N	Создание тикета
76	176	\N	2	\N	\N	\N	2026-04-02 20:37:39.62353+03	2026-04-02 20:37:39.62353+03	\N	Создание тикета
77	178	\N	2	\N	\N	\N	2026-04-02 20:43:43.506164+03	2026-04-02 20:43:43.506164+03	\N	Создание тикета
78	181	\N	2	\N	\N	\N	2026-04-02 20:53:10.670177+03	2026-04-02 20:53:10.670177+03	\N	Создание тикета
79	182	\N	2	\N	\N	\N	2026-04-02 20:54:15.543031+03	2026-04-02 20:54:15.543031+03	\N	Создание тикета
80	186	\N	2	\N	\N	\N	2026-04-02 22:03:40.365507+03	2026-04-02 22:03:40.365507+03	\N	Создание тикета
81	187	\N	2	\N	\N	\N	2026-04-02 22:40:54.457529+03	2026-04-02 22:40:54.457529+03	\N	Создание тикета
82	188	\N	2	\N	\N	\N	2026-04-02 22:41:28.394983+03	2026-04-02 22:41:28.394983+03	\N	Создание тикета
83	189	\N	2	\N	\N	\N	2026-04-03 10:14:27.646283+03	2026-04-03 10:14:27.646283+03	\N	Создание тикета
84	193	\N	2	\N	\N	\N	2026-04-03 11:57:03.828517+03	2026-04-03 11:57:03.828517+03	\N	Создание тикета
85	194	\N	2	\N	\N	\N	2026-04-03 11:58:52.778169+03	2026-04-03 11:58:52.778169+03	\N	Создание тикета
86	195	\N	2	\N	\N	\N	2026-04-03 12:31:58.387919+03	2026-04-03 12:31:58.387919+03	\N	Создание тикета
87	196	\N	2	\N	\N	\N	2026-04-05 08:49:06.946485+03	2026-04-05 08:49:06.946485+03	\N	Создание тикета
88	197	\N	2	\N	\N	\N	2026-04-05 16:56:16.776383+03	2026-04-05 16:56:16.776383+03	\N	Создание тикета
89	199	\N	2	\N	\N	\N	2026-04-05 22:39:15.402494+03	2026-04-05 22:39:15.402494+03	\N	Создание тикета
90	200	\N	2	\N	\N	\N	2026-04-06 07:35:49.543392+03	2026-04-06 07:35:49.543392+03	\N	Создание тикета
91	201	\N	2	\N	\N	\N	2026-04-06 09:58:11.315964+03	2026-04-06 09:58:11.315964+03	\N	Создание тикета
92	202	\N	2	\N	\N	\N	2026-04-06 09:58:11.349048+03	2026-04-06 09:58:11.349048+03	\N	Создание тикета
93	204	\N	2	\N	\N	\N	2026-04-06 09:58:11.42383+03	2026-04-06 09:58:11.42383+03	\N	Создание тикета
94	205	\N	2	\N	\N	\N	2026-04-06 09:58:11.468499+03	2026-04-06 09:58:11.468499+03	\N	Создание тикета
95	206	\N	2	\N	\N	\N	2026-04-06 09:58:11.518503+03	2026-04-06 09:58:11.518503+03	\N	Создание тикета
96	206	2	4	\N	\N	\N	2026-04-06 10:19:23.129234+03	2026-04-06 10:19:23.129234+03	00:21:11.608	\N
97	207	\N	2	\N	\N	\N	2026-04-06 14:12:04.840684+03	2026-04-06 14:12:04.840684+03	\N	\N
98	207	2	4	\N	\N	\N	2026-04-06 14:20:52.468643+03	2026-04-06 14:20:52.468643+03	00:08:47.626	\N
99	198	\N	2	\N	\N	\N	2026-04-06 14:21:45.192383+03	2026-04-06 14:21:45.192383+03	\N	\N
100	207	4	7	\N	\N	\N	2026-04-06 14:35:29.531246+03	2026-04-06 14:35:29.531246+03	00:14:37.062	\N
101	207	7	8	\N	\N	\N	2026-04-06 14:35:44.56274+03	2026-04-06 14:35:44.56274+03	00:00:15.03	\N
102	209	\N	2	\N	59	\N	2026-04-06 15:32:05.43373+03	2026-04-06 15:32:05.43373+03	\N	Создание тикета
103	209	2	4	\N	59	\N	2026-04-06 15:33:37.388698+03	2026-04-06 15:33:37.388698+03	00:01:31.952	\N
104	210	\N	2	\N	59	\N	2026-04-09 10:14:57.402854+03	2026-04-09 10:14:57.402854+03	\N	Создание тикета
105	210	2	10	\N	59	\N	2026-04-09 10:19:17.718717+03	2026-04-09 10:19:17.718717+03	00:04:20.312	\N
106	211	\N	2	\N	59	\N	2026-04-09 10:20:14.495523+03	2026-04-09 10:20:14.495523+03	\N	Создание тикета
107	211	2	10	\N	59	\N	2026-04-09 10:20:39.813137+03	2026-04-09 10:20:39.813137+03	00:00:25.317	\N
108	211	10	11	\N	59	\N	2026-04-09 10:20:52.216414+03	2026-04-09 10:20:52.216414+03	00:00:12.402	\N
109	211	11	4	\N	59	\N	2026-04-09 11:19:45.15875+03	2026-04-09 11:19:45.15875+03	00:58:52.941	\N
110	211	4	11	\N	59	\N	2026-04-09 11:21:30.996371+03	2026-04-09 11:21:30.996371+03	00:01:45.837	\N
111	211	11	4	\N	59	\N	2026-04-09 11:28:10.771693+03	2026-04-09 11:28:10.771693+03	00:06:39.775	\N
112	212	\N	2	\N	59	\N	2026-04-09 11:30:56.644053+03	2026-04-09 11:30:56.644053+03	\N	Создание тикета
113	212	2	11	\N	59	\N	2026-04-09 11:31:17.81001+03	2026-04-09 11:31:17.81001+03	00:00:21.165	\N
114	212	11	4	\N	59	\N	2026-04-09 11:31:30.038275+03	2026-04-09 11:31:30.038275+03	00:00:12.227	\N
115	212	4	11	\N	59	\N	2026-04-09 11:32:00.889125+03	2026-04-09 11:32:00.889125+03	00:00:30.85	\N
116	212	11	4	\N	59	\N	2026-04-09 11:32:14.610082+03	2026-04-09 11:32:14.610082+03	00:00:13.72	\N
117	212	4	11	\N	59	\N	2026-04-09 11:58:59.474029+03	2026-04-09 11:58:59.474029+03	00:26:44.862	\N
118	212	11	4	\N	59	\N	2026-04-09 11:59:28.870793+03	2026-04-09 11:59:28.870793+03	00:00:29.395	\N
119	213	\N	2	\N	59	\N	2026-04-09 12:03:07.096227+03	2026-04-09 12:03:07.096227+03	\N	Создание тикета
120	213	2	11	\N	59	\N	2026-04-09 12:03:49.081493+03	2026-04-09 12:03:49.081493+03	00:00:41.985	\N
121	213	11	4	\N	59	\N	2026-04-09 12:03:59.867346+03	2026-04-09 12:03:59.867346+03	00:00:10.785	\N
122	213	4	11	\N	59	\N	2026-04-09 12:04:57.432275+03	2026-04-09 12:04:57.432275+03	00:00:57.564	\N
123	211	4	11	\N	59	\N	2026-04-09 12:07:10.744323+03	2026-04-09 12:07:10.744323+03	00:38:59.972	\N
124	211	11	7	\N	59	\N	2026-04-09 12:07:18.168777+03	2026-04-09 12:07:18.168777+03	00:00:07.424	\N
125	215	\N	2	\N	59	\N	2026-04-09 13:43:18.309211+03	2026-04-09 13:43:18.309211+03	\N	Создание тикета
126	216	\N	2	\N	59	\N	2026-04-09 15:40:08.214921+03	2026-04-09 15:40:08.214921+03	\N	Создание тикета
127	216	2	11	\N	59	\N	2026-04-09 15:41:21.174493+03	2026-04-09 15:41:21.174493+03	00:01:12.959	\N
128	216	11	4	\N	59	\N	2026-04-09 15:41:32.972625+03	2026-04-09 15:41:32.972625+03	00:00:11.797	\N
129	216	4	11	\N	59	\N	2026-04-09 15:41:58.249744+03	2026-04-09 15:41:58.249744+03	00:00:25.276	\N
130	218	\N	2	\N	59	\N	2026-04-09 22:52:57.564536+03	2026-04-09 22:52:57.564536+03	\N	Создание тикета
131	249	\N	2	\N	59	\N	2026-04-10 09:02:50.508133+03	2026-04-10 09:02:50.508133+03	\N	Создание тикета
132	252	\N	2	\N	59	\N	2026-04-10 09:02:50.616077+03	2026-04-10 09:02:50.616077+03	\N	Создание тикета
133	253	\N	2	\N	59	\N	2026-04-10 09:02:50.656914+03	2026-04-10 09:02:50.656914+03	\N	Создание тикета
134	254	\N	2	\N	59	\N	2026-04-10 09:02:50.701508+03	2026-04-10 09:02:50.701508+03	\N	Создание тикета
135	255	\N	2	\N	59	\N	2026-04-10 09:02:50.746026+03	2026-04-10 09:02:50.746026+03	\N	Создание тикета
136	268	\N	2	\N	59	\N	2026-04-10 09:37:11.267328+03	2026-04-10 09:37:11.267328+03	\N	Создание тикета
137	270	\N	2	\N	59	\N	2026-04-10 11:23:10.405363+03	2026-04-10 11:23:10.405363+03	\N	Создание тикета
138	296	\N	2	\N	59	\N	2026-04-10 11:50:02.51746+03	2026-04-10 11:50:02.51746+03	\N	Создание тикета
139	326	\N	2	\N	59	\N	2026-04-10 14:29:44.485605+03	2026-04-10 14:29:44.485605+03	\N	Создание тикета
140	332	\N	2	\N	59	\N	2026-04-11 18:56:24.866288+03	2026-04-11 18:56:24.866288+03	\N	Создание тикета
141	333	\N	2	\N	59	\N	2026-04-11 21:00:02.056702+03	2026-04-11 21:00:02.056702+03	\N	Создание тикета
142	333	2	11	\N	64	\N	2026-04-11 21:01:58.843011+03	2026-04-11 21:01:58.843011+03	00:01:56.782	\N
143	334	\N	2	\N	64	\N	2026-04-11 21:02:23.794664+03	2026-04-11 21:02:23.794664+03	\N	Создание тикета
144	335	\N	2	\N	64	\N	2026-04-11 21:02:47.059553+03	2026-04-11 21:02:47.059553+03	\N	Создание тикета
145	336	\N	2	\N	64	\N	2026-04-11 21:02:47.098204+03	2026-04-11 21:02:47.098204+03	\N	Создание тикета
146	337	\N	2	\N	64	\N	2026-04-11 21:02:47.140439+03	2026-04-11 21:02:47.140439+03	\N	Создание тикета
147	338	\N	2	\N	64	\N	2026-04-11 21:02:47.170673+03	2026-04-11 21:02:47.170673+03	\N	Создание тикета
148	339	\N	2	\N	64	\N	2026-04-11 21:02:47.198497+03	2026-04-11 21:02:47.198497+03	\N	Создание тикета
149	340	\N	2	\N	64	\N	2026-04-11 21:02:47.226656+03	2026-04-11 21:02:47.226656+03	\N	Создание тикета
150	341	\N	2	\N	64	\N	2026-04-11 21:04:54.351391+03	2026-04-11 21:04:54.351391+03	\N	Создание тикета
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, title, type_id, priority_id, queue_id, state_id, owner_id, company_id, sla_id, is_active, created_at, updated_at, description, response_deadline, resolution_deadline, first_response_at, sla_violated, pending_start_at, service_id, executor_agent_ids, executor_group_ids, category_id, observer_agent_ids, observer_group_ids, escalation_count, is_escalated, created_by_schedule_id) FROM stdin;
18	1000011	Test Incident	1	\N	\N	2	\N	\N	\N	f	2026-02-21 17:18:26.838132+03	2026-03-03 12:51:56.355996+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
29	1000020	фыйвйцвц	\N	\N	\N	\N	\N	\N	\N	f	2026-03-03 11:34:22.214048+03	2026-03-03 12:51:47.806825+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
19	1000012	Test Incident	1	\N	\N	4	\N	\N	\N	f	2026-02-21 17:18:52.0053+03	2026-03-03 12:51:56.307857+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
8	1000008	Жалоба на качество обслуживания	2	5	\N	11	\N	\N	3	f	2026-02-11 16:34:46.765366+03	2026-03-03 23:36:51.280011+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
5	1000005	Вопрос по доставке товара	2	5	\N	11	\N	\N	3	f	2026-02-09 05:46:58.20379+03	2026-03-03 23:36:51.498517+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
2	1000002	Ошибка при оформлении заказа	2	5	\N	11	\N	\N	3	f	2026-02-08 21:55:15.706642+03	2026-03-03 23:36:51.531014+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
7	1000007	Техническая проблема с сайтом	1	4	\N	2	\N	\N	3	f	2026-02-11 15:22:07.199657+03	2026-03-03 23:36:51.324817+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
4	1000004	Проблема с оплатой картой	1	4	\N	2	\N	\N	3	f	2026-02-11 06:54:16.64372+03	2026-03-03 23:36:51.402458+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
10	1000010	Предложение по улучшению сервиса	1	4	\N	2	\N	\N	3	f	2026-02-08 15:01:17.868364+03	2026-03-03 23:36:51.559506+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
1	1000001	Проблема с авторизацией в системе	1	4	\N	2	\N	\N	3	f	2026-02-07 16:19:39.27061+03	2026-03-03 23:36:51.582754+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
3	1000003	Запрос на изменение пароля	3	6	\N	3	\N	\N	3	f	2026-02-11 20:59:46.441539+03	2026-03-03 12:51:56.434926+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
9	1000009	Запрос информации о продукте	3	6	\N	3	\N	\N	3	f	2026-02-10 18:40:51.697864+03	2026-03-03 23:36:51.455522+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
30	1000021	34567890-х	3	10	\N	2	\N	\N	6	f	2026-03-03 11:35:31.416169+03	2026-03-03 23:36:51.221633+03	<p>кенгшщз</p>	2026-03-02 18:36:05.407	\N	\N	f	\N	34	{}	{}	\N	{}	{}	0	f	\N
6	1000006	Запрос на возврат средств	3	6	\N	4	\N	\N	3	f	2026-02-12 14:23:19.017887+03	2026-03-03 12:51:56.392822+03	<p><em>Запрос на возврат средств</em></p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
22	1000015	тест 2уцйвцй	1	7	\N	7	\N	\N	3	f	2026-02-22 17:39:29.284701+03	2026-03-03 12:51:56.152802+03	<p style="text-align: left;">тест ловалдыфоалдофывлда</p><p style="text-align: left;">фдлвыоадлфоы</p><p style="text-align: left;">щочфлыовфы</p><p style="text-align: left;">офылвофыдвофы</p><p style="text-align: left;">щолод</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
21	1000014	hjhjkhjk	2	5	\N	9	\N	\N	3	f	2026-02-22 15:36:39.929612+03	2026-03-03 12:51:56.218722+03	<p></p><p>вмвы</p><p>вым</p><p>ывмыв</p><p></p><p></p><p>лл</p><p></p><p></p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
20	1000013	епк	1	4	\N	2	\N	\N	3	f	2026-02-21 19:09:49.00867+03	2026-03-03 12:51:56.264389+03	<p>некекн</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
25	1000018	efews	1	6	\N	2	\N	\N	5	f	2026-03-03 09:56:17.603389+03	2026-03-03 11:30:25.535189+03	<p>ewfrew</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
23	1000016	уцкцу	1	4	\N	2	\N	\N	3	f	2026-03-02 23:16:40.372257+03	2026-03-03 12:51:56.078336+03	<p>куцк</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
24	1000017	Тестовый тикет	\N	\N	\N	\N	\N	\N	\N	f	2026-03-03 07:44:57.805821+03	2026-03-03 11:30:28.808205+03	Тестовое описание	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
26	1000019	frgsersd22222	1	4	\N	2	\N	\N	6	f	2026-03-03 10:49:24.786705+03	2026-03-03 11:30:14.942802+03	<p>dfsdfsd</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
189	1000180	fhf	1	\N	\N	2	36	\N	\N	f	2026-04-03 10:14:27.627464+03	2026-04-03 11:45:44.118081+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
185	1000176	asdfa	7	\N	\N	\N	\N	\N	\N	f	2026-04-02 21:47:39.076242+03	2026-04-03 11:45:44.442296+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
32	1000023	куцйкцй	\N	\N	\N	\N	\N	\N	\N	f	2026-03-19 22:18:40.515942+03	2026-03-23 16:30:52.277274+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
215	1000206	ewqrwqrqw	1	4	\N	2	\N	\N	\N	f	2026-04-09 13:43:18.297035+03	2026-04-10 09:12:39.230508+03	<p>ewqrwqerqwe</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
326	1000329	тест	1	\N	\N	2	\N	\N	\N	f	2026-04-10 14:29:44.473281+03	2026-04-11 21:02:53.116949+03	<p>авмавмавм</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
319	1000323	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 12:12:26.265672+03	2026-04-10 14:10:12.030557+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
342	1000345	Расписание (Р) тест	1	4	\N	2	1	39	7	t	2026-04-12 11:31:20.499707+03	2026-04-14 11:38:03.320622+03	<p>авмавмавм</p>	2026-04-14 16:37:29.459	\N	\N	f	\N	41	{59}	{110}	1	{}	{}	0	f	\N
261	1000265	Log test schedule	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:10:15.058214+03	2026-04-10 09:12:38.771754+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
256	1000260	Simple clone test	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:05:44.877673+03	2026-04-10 09:12:39.147672+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
34	1000025	reter	1	\N	\N	2	\N	\N	\N	f	2026-03-25 16:26:19.837663+03	2026-03-25 16:33:26.201142+03	<p>trewter</p>	\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
35	1000026	цвцувуц	3	\N	\N	2	\N	\N	\N	f	2026-03-25 16:33:45.242268+03	2026-03-25 17:34:45.624343+03		\N	\N	\N	f	\N	\N	{}	{}	1	{}	{}	0	f	\N
230	1000221	Simple test schedule	1	4	\N	\N	\N	\N	\N	f	2026-04-10 08:36:27.47409+03	2026-04-10 09:02:44.246391+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
225	1000216	Final test: copy ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:32:03.735618+03	2026-04-10 09:02:58.374461+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
221	1000212	Demo: runs in 1 minute	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 07:56:02.308334+03	2026-04-10 09:02:58.644789+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
267	1000271	Simple test clone	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:16:45.248278+03	2026-04-10 10:01:25.531007+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
234	TEST-001	Test ticket for copy	1	4	\N	\N	\N	\N	\N	f	2026-04-10 08:44:33.567653+03	2026-04-10 09:02:43.88404+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
264	1000268	Clean clone test	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:14:15.182354+03	2026-04-10 10:01:25.75398+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
197	1000188	сапролбдю	1	\N	\N	2	\N	\N	\N	f	2026-04-05 16:56:16.754987+03	2026-04-10 11:49:00.181258+03	<p>митьбю.</p>	\N	\N	\N	f	\N	\N	{59}	{110}	1	{}	{}	0	f	\N
196	1000187	dsfsdafsdf	1	\N	\N	2	\N	39	\N	f	2026-04-05 08:49:06.931566+03	2026-04-10 11:49:00.226103+03		\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
277	1000281	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:28:25.125209+03	2026-04-10 11:48:42.771655+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
190	1000181	dfgdf	7	\N	\N	\N	36	\N	\N	f	2026-04-03 10:21:44.12108+03	2026-04-03 11:45:44.049644+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
327	1000330	Расписание (Р) тест	1	\N	\N	2	\N	\N	\N	f	2026-04-10 14:31:51.074029+03	2026-04-10 15:05:38.33771+03	<p>авмавмавм</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
257	1000261	Debug clone schedule	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:06:44.913659+03	2026-04-10 09:12:39.075363+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
239	1000237	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:53:05.306828+03	2026-04-10 09:02:25.105896+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
238	1000235	Test ticket for copy	1	4	\N	\N	\N	\N	\N	f	2026-04-10 08:44:56.704249+03	2026-04-10 09:02:25.188769+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
235	1000229	Test ticket for copy	1	4	\N	\N	\N	\N	\N	f	2026-04-10 08:44:54.287088+03	2026-04-10 09:02:43.807337+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
268	1000272	авыфафвыа	1	\N	\N	2	\N	\N	\N	f	2026-04-10 09:37:11.257565+03	2026-04-10 10:01:25.442404+03	<p>ывфафвыа</p>	\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
212	1000203	frefer	1	\N	\N	4	\N	\N	\N	f	2026-04-09 11:30:56.628556+03	2026-04-10 10:01:25.919655+03		\N	\N	\N	f	\N	\N	{67}	{111}	3	{59,67}	{110,111}	8	t	\N
56	1000047	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.346408+03	2026-03-26 14:35:42.410713+03	\N	2026-03-27 05:22:44.349	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
54	1000045	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.29999+03	2026-03-26 14:35:42.637717+03	\N	2026-03-27 05:22:44.303	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
206	1000197	sadsadas (копия)	1	4	\N	4	1	39	6	f	2026-04-06 09:58:11.502165+03	2026-04-10 11:48:53.874336+03	<p>цкец</p>	2026-04-06 04:58:11.507	2026-04-06 04:58:11.507	\N	f	\N	42	{59}	{111}	3	{}	{}	0	f	\N
96	1000087	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.838321+03	2026-03-26 14:35:36.670881+03	\N	2026-03-27 05:22:55.841	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
320	1000324	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 12:12:56.231694+03	2026-04-10 14:10:11.982626+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
186	1000177	ewrew	1	9	\N	2	\N	39	6	f	2026-04-02 22:03:40.335664+03	2026-04-03 11:45:44.333723+03	\N	2026-04-02 23:03:40.346	2026-04-02 23:03:40.346	\N	f	\N	41	{}	{}	3	{}	{}	0	f	\N
333	1000336	ttrewtert	1	4	\N	11	\N	39	3	f	2026-04-11 21:00:02.030474+03	2026-04-11 21:02:52.852266+03	<p>tertert</p>	2026-04-12 09:00:02.043	\N	\N	f	\N	34	{}	{111}	3	{}	{}	0	f	\N
262	1000266	расписание (расписание)	1	4	\N	2	36	39	5	f	2026-04-10 09:11:36.146029+03	2026-04-10 09:12:38.677285+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
245	1000249	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:56:44.056662+03	2026-04-10 09:02:24.577555+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
244	1000247	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:56:44.031786+03	2026-04-10 09:02:24.663327+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
291	1000295	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:35:25.352072+03	2026-04-10 11:48:36.511064+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
226	1000217	Final test: copy ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:32:25.344345+03	2026-04-10 09:02:44.552908+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
191	1000182	куеу	\N	\N	\N	\N	\N	\N	\N	f	2026-04-03 10:35:55.045355+03	2026-04-03 11:45:43.981329+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
187	1000178	p]p]	1	\N	\N	2	1	\N	\N	f	2026-04-02 22:40:54.445743+03	2026-04-03 11:45:44.257237+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
236	1000231	Test ticket for copy	1	4	\N	\N	\N	\N	\N	f	2026-04-10 08:44:55.412025+03	2026-04-10 09:02:25.413189+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
208	1000199	Не работает подключение к корпоративной сети через VPN	\N	\N	\N	\N	\N	\N	\N	f	2026-04-06 15:31:12.516487+03	2026-04-06 15:32:18.260512+03	<p><strong>Тикет&nbsp;1</strong></p><ul><li><p><strong>Заголовок:</strong> Не работает подключение к корпоративной сети через VPN</p></li><li><p><strong>Создатель:</strong> Иванов&nbsp;А. С., отдел маркетинга</p></li><li><p><strong>Дата создания:</strong> 06.04.2026</p></li><li><p><strong>Приоритет:</strong> Высокий</p></li><li><p><strong>Статус:</strong> New</p></li><li><p><strong>Описание:</strong> При попытке подключиться к корпоративной сети через VPN (клиент Cisco AnyConnect) появляется ошибка «Unable to establish secure connection». Перезагрузка компьютера и перезапуск клиента VPN не помогли. Интернет‑соединение стабильно, другие онлайн‑сервисы работают.</p></li><li><p><strong>Затронутый ресурс:</strong> Корпоративная сеть, VPN‑доступ</p></li><li><p><strong>Вложения:</strong> Скриншот ошибки (файл <code>vpn_error_060426.png</code>)</p></li></ul><p><strong>Тикет&nbsp;2</strong></p><ul><li><p><strong>Заголовок:</strong> Принтер в кабинете&nbsp;305 не отвечает на запросы печати</p></li><li><p><strong>Создатель:</strong> Петрова&nbsp;М. В., бухгалтерия</p></li><li><p><strong>Дата создания:</strong> 06.04.2026</p></li><li><p><strong>Приоритет:</strong> Средний</p></li><li><p><strong>Статус:</strong> New</p></li><li><p><strong>Описание:</strong> Принтер HP LaserJet&nbsp;Pro&nbsp;M404dn в кабинете&nbsp;305 не принимает задания на печать. Индикатор питания горит зелёным, бумага загружена. На компьютере появляется сообщение «Ошибка печати». Другие принтеры в сети работают штатно.</p></li><li><p><strong>Затронутый ресурс:</strong> Принтер HP LaserJet&nbsp;Pro&nbsp;M404dn (кабинет&nbsp;305)</p></li><li><p><strong>Дополнительные сведения:</strong> Проблема возникла после обновления драйверов на ПК.</p></li></ul>	\N	\N	\N	f	\N	\N	{59}	{110}	\N	{}	{}	0	f	\N
223	1000214	Test: copy from ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:25:43.873766+03	2026-04-10 09:02:58.518741+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
328	1000331	Расписание (Р) тест	1	\N	\N	2	\N	\N	\N	f	2026-04-10 14:36:51.212216+03	2026-04-10 15:05:38.294694+03	<p>авмавмавм</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
240	1000239	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:53:31.272813+03	2026-04-10 09:02:25.008082+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
231	1000223	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:37:17.106561+03	2026-04-10 09:02:44.170162+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
222	1000213	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:20:03.288346+03	2026-04-10 09:02:58.582077+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
265	1000269	расписание (расписание)	1	4	\N	2	36	39	5	f	2026-04-10 09:14:56.970864+03	2026-04-10 10:01:25.67455+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
210	1000201	Эскалация	1	4	\N	10	1	39	5	f	2026-04-09 10:14:57.375164+03	2026-04-10 10:01:26.076379+03	<p>фчс</p>	2026-04-09 11:14:57.386	\N	\N	f	\N	39	{61}	{110}	3	{}	{}	0	f	\N
241	1000241	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:54:01.131427+03	2026-04-10 09:02:24.905413+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
228	1000219	Final test: copy ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:34:59.465567+03	2026-04-10 09:02:44.398911+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
227	1000218	Final test: copy ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:34:50.569783+03	2026-04-10 09:02:44.475638+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
251	1000255	Test schedule - runs immediately (копия)	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:02:50.573853+03	2026-04-10 09:02:59.368288+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
250	1000254	Demo: runs in 1 minute (копия)	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:02:50.535839+03	2026-04-10 09:02:59.468061+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
248	1000252	Test: copy from ticket 218 (копия)	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:02:50.451634+03	2026-04-10 09:02:59.649995+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
247	1000251	Debug: copy ticket 218 (копия)	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:02:50.4255+03	2026-04-10 09:02:59.736599+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
246	1000250	Final test: copy ticket 218 (копия)	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:02:50.381691+03	2026-04-10 09:02:59.815276+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
192	1000183	reterter	10	4	\N	\N	109	\N	\N	f	2026-04-03 10:54:17.542342+03	2026-04-03 11:45:43.882322+03	<p>reter</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
188	1000179	sfsdf	1	\N	\N	2	85	\N	\N	f	2026-04-02 22:41:28.385381+03	2026-04-03 11:45:44.183392+03	\N	\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
138	1000129	ауаука	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 14:56:09.298622+03	2026-03-26 14:56:18.891734+03	<p>аукаука</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
184	1000175	ццц	\N	\N	\N	\N	\N	\N	\N	f	2026-04-02 21:00:38.457829+03	2026-04-03 11:45:44.513818+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
183	1000174	чыфчыф	7	\N	\N	\N	\N	\N	\N	f	2026-04-02 20:59:04.92538+03	2026-04-03 11:45:44.58164+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
139	1000130	gege	1	\N	\N	2	\N	\N	\N	f	2026-03-26 15:32:42.691306+03	2026-03-26 15:33:10.012276+03		\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
181	1000172	уйууйцу	1	\N	\N	2	\N	\N	\N	f	2026-04-02 20:53:10.655766+03	2026-04-03 11:45:51.107253+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
179	1000170	мывмывмвы	6	\N	\N	\N	\N	\N	\N	f	2026-04-02 20:44:01.984114+03	2026-04-03 11:45:51.25722+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
178	1000169	яафыафыаф	1	\N	\N	2	\N	\N	\N	f	2026-04-02 20:43:43.494718+03	2026-04-03 11:45:51.324051+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
176	1000167	авпвапва	1	\N	\N	2	\N	\N	\N	f	2026-04-02 20:37:39.607232+03	2026-04-03 11:45:51.530338+03	\N	\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
175	1000166	с чм	8	\N	\N	\N	\N	\N	\N	f	2026-04-02 20:37:00.853984+03	2026-04-03 11:45:51.615551+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
173	1000164	fdsfds	1	\N	\N	2	\N	\N	\N	f	2026-04-02 20:29:44.504942+03	2026-04-03 11:45:51.684559+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
172	1000163	павып	1	\N	\N	2	\N	\N	\N	f	2026-04-02 20:18:40.718108+03	2026-04-03 11:45:51.744005+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
171	1000162	чсмч	7	\N	\N	\N	\N	\N	\N	f	2026-04-02 20:04:26.09294+03	2026-04-03 11:45:57.359767+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
170	1000161	пукпук	3	\N	\N	2	\N	\N	\N	f	2026-04-02 19:58:03.324326+03	2026-04-03 11:45:57.418371+03	\N	\N	\N	\N	f	\N	\N	{}	{}	1	{}	{}	0	f	\N
169	1000160	фвыафыв	6	\N	\N	\N	\N	\N	\N	f	2026-04-02 18:15:15.282403+03	2026-04-03 11:45:57.46714+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
168	1000159	фысфыс	6	\N	\N	\N	\N	\N	\N	f	2026-04-02 18:00:20.890827+03	2026-04-03 11:45:57.524055+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
167	1000158	вйцвйцвйцвйц	4	\N	\N	2	\N	\N	\N	f	2026-04-02 17:56:33.850517+03	2026-04-03 11:45:57.585168+03	\N	\N	\N	\N	f	\N	\N	{}	{}	1	{}	{}	0	f	\N
166	1000157	цйвйцвцй	1	\N	\N	2	\N	\N	\N	f	2026-04-02 17:55:52.081824+03	2026-04-03 11:45:57.623803+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
165	1000156	высвы	1	\N	\N	2	\N	\N	\N	f	2026-04-02 17:52:57.386022+03	2026-04-03 11:45:57.663026+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
164	1000155	цвцйвцй	1	\N	\N	2	\N	\N	\N	f	2026-04-02 17:48:03.862062+03	2026-04-03 11:45:57.696952+03	<p>цвц</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
214	1000205	tertertert	\N	\N	\N	\N	\N	\N	\N	f	2026-04-09 13:40:57.947712+03	2026-04-10 09:12:39.307306+03	<p>reter</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
260	1000264	Run now test	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:09:45.0507+03	2026-04-10 09:12:38.845208+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
259	1000263	Quick clone test	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:08:44.999367+03	2026-04-10 09:12:38.924263+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
229	1000220	Final test: copy ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:35:44.005643+03	2026-04-10 09:02:44.324496+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
182	1000173	афвыафвыа	1	6	\N	2	\N	\N	\N	f	2026-04-02 20:54:15.528752+03	2026-04-03 11:45:50.915067+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
258	1000262	Final clone test	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:08:14.971173+03	2026-04-10 09:12:38.997695+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
237	1000233	Test ticket for copy	1	4	\N	\N	\N	\N	\N	f	2026-04-10 08:44:55.7117+03	2026-04-10 09:02:25.284421+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
224	1000215	Debug: copy ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 08:27:03.506353+03	2026-04-10 09:02:58.458414+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
220	1000211	Test schedule - runs immediately	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 07:53:15.018959+03	2026-04-10 09:02:58.709622+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
266	1000270	Final demo: clone with (расписание)	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:16:15.22856+03	2026-04-10 10:01:25.601149+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
263	1000267	Final demo: clone ticket 218	\N	\N	\N	\N	\N	\N	\N	f	2026-04-10 09:13:45.156351+03	2026-04-10 10:01:25.826651+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
329	1000332	Расписание (Р) тестr	2	\N	\N	2	\N	\N	\N	f	2026-04-10 14:53:14.561476+03	2026-04-11 21:04:32.554961+03	<p>авмавмавм</p>	\N	\N	\N	f	\N	\N	{59}	{110}	1	{}	{}	0	f	\N
335	1000338	etgert (копия)	1	\N	\N	2	\N	\N	\N	f	2026-04-11 21:02:47.04645+03	2026-04-11 21:02:53.39094+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
270	1000274	Расписание тест  (копия)	1	\N	\N	2	1	39	6	f	2026-04-10 11:23:10.385711+03	2026-04-10 11:48:53.719758+03	\N	2026-04-10 12:23:10.392	2026-04-10 12:23:10.392	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
200	1000191	гшщгш	1	9	\N	2	\N	\N	\N	f	2026-04-06 07:35:49.527252+03	2026-04-10 11:49:00.017527+03	<p>гшщшг</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
284	1000288	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:31:55.256967+03	2026-04-10 11:48:42.230088+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
163	1000154	ыфсфы	6	6	\N	\N	\N	\N	\N	f	2026-04-02 17:42:13.663605+03	2026-04-02 17:47:42.030919+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
161	1000152	sdas	3	\N	\N	2	\N	\N	\N	f	2026-04-02 17:29:58.332139+03	2026-04-02 17:47:42.149711+03	\N	\N	\N	\N	f	\N	\N	{}	{}	1	{}	{}	0	f	\N
159	1000150	dadada	1	\N	\N	2	\N	\N	\N	f	2026-04-02 08:55:04.417497+03	2026-04-02 17:47:42.257748+03	\N	\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
158	1000149	dsdfs	1	\N	\N	2	\N	\N	\N	f	2026-03-31 16:53:20.859332+03	2026-04-02 17:47:42.308472+03		\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
157	1000148	ferfre	1	\N	\N	2	\N	\N	\N	f	2026-03-31 16:49:24.2107+03	2026-04-02 17:47:42.343971+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
137	1000128	Ghbdtn (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:38:54.428902+03	2026-03-26 14:50:30.171123+03	\N	2026-03-26 15:38:54.432	2026-03-26 15:38:54.432	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
180	1000171	ыыыы	6	\N	\N	\N	\N	\N	\N	f	2026-04-02 20:52:49.946601+03	2026-04-03 11:45:51.185596+03	\N	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
177	1000168	ввв	7	\N	\N	\N	\N	\N	\N	f	2026-04-02 20:38:52.77562+03	2026-04-03 11:45:51.434212+03		\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
204	1000195	сапролбдю (копия)	1	\N	\N	2	\N	\N	\N	f	2026-04-06 09:58:11.416921+03	2026-04-10 11:48:59.776844+03	\N	\N	\N	\N	f	\N	\N	{59}	{110}	1	{}	{}	0	f	\N
203	1000194	цукцйук (копия)	2	\N	\N	\N	\N	\N	\N	f	2026-04-06 09:58:11.377143+03	2026-04-10 11:48:59.841916+03	\N	\N	\N	\N	f	\N	\N	{65,59}	{110}	1	{}	{}	0	f	\N
201	1000192	гшщгш (копия)	1	9	\N	2	\N	\N	\N	f	2026-04-06 09:58:11.306535+03	2026-04-10 11:48:59.958079+03	\N	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
269	1000273	цукцйук (копия) (копия)	2	\N	\N	\N	\N	\N	\N	f	2026-04-10 10:01:33.307607+03	2026-04-10 11:48:53.796818+03	\N	\N	\N	\N	f	\N	\N	{65,59}	{110}	1	{}	{}	0	f	\N
330	1000333	Расписание (Р) тест	1	\N	\N	2	\N	\N	\N	f	2026-04-10 15:07:11.711555+03	2026-04-11 21:02:53.062677+03	<p>авмавмавм</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
340	1000343	тест (копия)	1	\N	\N	2	\N	\N	\N	f	2026-04-11 21:02:47.218904+03	2026-04-11 21:02:53.16894+03	\N	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
339	1000342	Расписание (Р) тест (копия)	1	\N	\N	2	\N	\N	\N	f	2026-04-11 21:02:47.189964+03	2026-04-11 21:02:53.223006+03	\N	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
338	1000341	Расписание (Р) тест (копия)	1	\N	\N	2	\N	\N	\N	f	2026-04-11 21:02:47.163528+03	2026-04-11 21:02:53.271899+03	\N	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
207	1000198	ипавиав	1	4	\N	8	1	39	7	f	2026-04-06 13:49:32.005635+03	2026-04-10 11:48:54.04688+03		2026-04-06 13:12:04.764	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
198	1000189	цукцйук	1	4	\N	2	1	39	6	f	2026-04-05 18:28:34.838602+03	2026-04-10 11:49:00.131766+03	<p>цуйкуцй ва </p>	2026-04-06 15:21:45.132	2026-04-06 15:21:45.132	\N	f	\N	41	{65,59}	{110}	1	{}	{}	0	f	\N
218	1000209	расписание	1	4	\N	2	36	39	5	f	2026-04-09 22:52:57.534413+03	2026-04-10 09:02:58.83798+03	\N	2026-04-10 02:52:57.552	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
216	1000207	укеукеук	1	4	\N	11	1	39	7	f	2026-04-09 15:40:08.193561+03	2026-04-10 09:02:58.967419+03	<p>кеуце</p>	2026-04-09 11:41:21.13	\N	\N	f	\N	40	{59}	{110}	3	{59}	{110}	2	t	\N
213	1000204	Эскалада	1	4	\N	11	125	39	6	f	2026-04-09 12:03:07.079819+03	2026-04-10 09:12:39.390272+03		2026-04-08 22:03:07.087	2026-04-08 22:03:07.087	\N	f	\N	40	{59}	{110}	3	{66,59}	{110}	2	t	\N
232	1000225	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:38:08.487202+03	2026-04-10 09:02:44.050401+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
211	1000202	эскал 	1	5	\N	7	1	\N	\N	f	2026-04-09 10:20:14.482952+03	2026-04-10 10:01:25.995855+03		\N	\N	\N	f	\N	\N	{59}	{110}	3	{59}	{110}	1	t	\N
321	1000325	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 12:13:26.265992+03	2026-04-10 14:10:11.932993+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
199	1000190	паоапо	1	4	\N	2	1	39	\N	f	2026-04-05 22:39:15.379415+03	2026-04-10 11:49:00.075889+03	<p>рпопа</p>	\N	\N	\N	f	\N	\N	{}	{111}	\N	{}	{}	0	f	\N
334	1000337	etgert	1	\N	\N	2	\N	\N	\N	f	2026-04-11 21:02:23.786912+03	2026-04-11 21:02:52.773638+03	<p>tertert</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
219	1000210	расписание	1	4	\N	2	36	39	5	f	2026-04-09 23:18:53.525158+03	2026-04-10 09:02:58.773581+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
217	1000208	вввввв (копия) (копия)	1	4	\N	2	55	39	5	f	2026-04-09 16:19:05.223486+03	2026-04-10 09:02:58.902538+03	\N	\N	\N	\N	f	\N	40	{65}	{110,111}	3	{}	{}	0	f	\N
255	1000259	укеукеук (копия)	1	4	\N	2	1	39	7	f	2026-04-10 09:02:50.731861+03	2026-04-10 09:02:59.044864+03	\N	2026-04-10 17:02:50.736	\N	\N	f	\N	40	{59}	{110}	3	{}	{}	0	f	\N
254	1000258	вввввв (копия) (копия) (копия)	1	4	\N	2	55	39	5	f	2026-04-10 09:02:50.684805+03	2026-04-10 09:02:59.12327+03	\N	2026-04-10 13:02:50.69	\N	\N	f	\N	40	{55,65}	{110,111}	3	{}	{}	0	f	\N
253	1000257	расписание (копия)	1	4	\N	2	36	39	5	f	2026-04-10 09:02:50.640991+03	2026-04-10 09:02:59.201046+03	\N	2026-04-10 13:02:50.647	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
323	1000327	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 12:14:26.28449+03	2026-04-10 14:10:11.797803+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
331	1000334	Расписание (Р) тест	1	\N	\N	2	\N	\N	\N	f	2026-04-11 14:31:25.286285+03	2026-04-11 21:02:52.997833+03	<p>авмавмавм</p>	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
252	1000256	расписание (копия)	1	4	\N	2	36	39	5	f	2026-04-10 09:02:50.597141+03	2026-04-10 09:02:59.285775+03	\N	2026-04-10 13:02:50.604	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
249	1000253	расписание (копия)	1	4	\N	2	36	39	5	f	2026-04-10 09:02:50.48593+03	2026-04-10 09:02:59.563757+03	\N	2026-04-10 13:02:50.494	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
322	1000326	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 12:13:56.263023+03	2026-04-10 14:10:11.88309+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
337	1000340	qewsdq (копия)	1	\N	\N	2	\N	\N	\N	f	2026-04-11 21:02:47.131082+03	2026-04-11 21:02:53.310445+03	\N	\N	\N	\N	f	\N	\N	{}	{111}	3	{}	{}	0	f	\N
205	1000196	dsfsdafsdf (копия)	1	\N	\N	2	\N	39	\N	f	2026-04-06 09:58:11.462031+03	2026-04-10 11:48:53.978094+03	\N	\N	\N	\N	f	\N	\N	{59}	{110}	3	{}	{}	0	f	\N
195	1000186	Расписание тест 	1	\N	\N	2	1	39	6	f	2026-04-03 12:31:58.366442+03	2026-04-10 11:49:00.26063+03	<p>dsadasdas</p>	2026-04-02 16:31:58.376	2026-04-02 16:31:58.376	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
336	1000339	ttrewtert (копия)	1	4	\N	2	\N	39	3	f	2026-04-11 21:02:47.084137+03	2026-04-11 21:02:53.350071+03	\N	2026-04-12 12:02:47.09	\N	\N	f	\N	34	{}	{111}	3	{}	{}	0	f	\N
242	1000243	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:54:25.406491+03	2026-04-10 09:02:24.824265+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
233	1000227	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:43:47.127938+03	2026-04-10 09:02:43.958773+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
296	1000300	расписание 	5	4	\N	2	36	39	6	f	2026-04-10 11:50:02.495069+03	2026-04-10 14:22:32.002502+03	<p>выфафвыавыфа</p>	2026-04-10 12:50:02.507	2026-04-10 12:50:02.507	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
341	1000344	ertret	1	4	\N	2	\N	\N	\N	t	2026-04-11 21:04:54.339124+03	2026-04-11 21:04:54.339124+03	<p>terter</p>	\N	\N	\N	f	\N	\N	{}	{}	\N	{}	{}	0	f	\N
303	1000307	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:57:25.631844+03	2026-04-10 12:06:53.928349+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
295	1000299	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:37:25.422914+03	2026-04-10 11:48:36.202979+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
294	1000298	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:36:55.405542+03	2026-04-10 11:48:36.287552+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
293	1000297	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:36:25.425795+03	2026-04-10 11:48:36.364676+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
292	1000296	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:35:55.41065+03	2026-04-10 11:48:36.435574+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
286	1000290	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:32:55.253572+03	2026-04-10 11:48:36.90522+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
280	1000284	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:29:55.214246+03	2026-04-10 11:48:42.518977+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
274	1000278	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:26:55.078301+03	2026-04-10 11:48:53.379668+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
271	1000275	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:25:25.050326+03	2026-04-10 11:48:53.654472+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
290	1000294	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:34:55.335849+03	2026-04-10 11:48:36.592026+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
289	1000293	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:34:25.338066+03	2026-04-10 11:48:36.663577+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
288	1000292	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:33:55.30952+03	2026-04-10 11:48:36.742203+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
287	1000291	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:33:25.2756+03	2026-04-10 11:48:36.820926+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
285	1000289	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:32:25.230954+03	2026-04-10 11:48:42.152024+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
283	1000287	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:31:25.213397+03	2026-04-10 11:48:42.299539+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
281	1000285	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:30:25.201699+03	2026-04-10 11:48:42.444203+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
278	1000282	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:28:55.111396+03	2026-04-10 11:48:42.673911+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
275	1000279	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:27:25.102117+03	2026-04-10 11:48:53.300725+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
272	1000276	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:25:55.042677+03	2026-04-10 11:48:53.584975+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
282	1000286	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:30:55.223227+03	2026-04-10 11:48:42.367139+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
279	1000283	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:29:25.161521+03	2026-04-10 11:48:42.592103+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
276	1000280	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:27:55.119991+03	2026-04-10 11:48:42.842116+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
273	1000277	Расписание тест  (расписание)	1	\N	\N	2	1	39	6	f	2026-04-10 11:26:25.069997+03	2026-04-10 11:48:53.481718+03	<p>dsadasdas</p>	\N	\N	\N	f	\N	42	{59}	{110,111}	3	{}	{}	0	f	\N
194	1000185	dwqedqw	2	4	\N	2	117	39	6	f	2026-04-03 11:58:52.756772+03	2026-04-03 12:32:15.763038+03	<p>wqdqwdqw edew</p>	2026-04-03 12:58:52.767	2026-04-03 12:58:52.767	\N	f	\N	41	{}	{}	1	{}	{}	0	f	\N
243	1000245	расписание	1	4	\N	2	36	39	5	f	2026-04-10 08:55:22.039411+03	2026-04-10 09:02:24.745278+03	\N	\N	\N	\N	f	\N	40	{61}	{111}	3	{}	{}	0	f	\N
156	1000147	вввввв (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-31 16:44:53.847965+03	2026-04-02 17:28:12.714811+03		\N	\N	\N	f	\N	40	{55}	{110}	3	{}	{}	0	f	\N
162	1000153	выфв	1	4	\N	2	\N	\N	\N	f	2026-04-02 17:41:52.472981+03	2026-04-02 17:47:42.096805+03	\N	\N	\N	\N	f	\N	\N	{}	{}	3	{}	{}	0	f	\N
160	1000151	fddsfsd	1	4	\N	2	\N	39	5	f	2026-04-02 09:17:14.248919+03	2026-04-02 17:47:42.201141+03	<p>fsdfsdf</p>	2026-04-02 13:17:14.258	\N	\N	f	\N	38	{}	{}	3	{}	{}	0	f	\N
55	1000046	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.320115+03	2026-03-26 14:35:42.526731+03	\N	2026-03-27 05:22:44.323	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
53	1000044	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.275334+03	2026-03-26 14:35:42.746724+03	\N	2026-03-27 05:22:44.278	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
52	1000043	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:44.239924+03	2026-03-26 14:35:42.858196+03	\N	2026-03-26 15:22:44.247	2026-03-26 15:22:44.247	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
51	1000042	Ghbdtn (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:44.203833+03	2026-03-26 14:35:42.962507+03	\N	2026-03-26 15:22:44.209	2026-03-26 15:22:44.209	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
50	1000041	Тест  2 (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.178631+03	2026-03-26 14:35:43.069709+03	\N	2026-03-27 05:22:44.182	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
49	1000040	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.155642+03	2026-03-26 14:35:43.169074+03	\N	2026-03-27 05:22:44.16	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
48	1000039	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.133604+03	2026-03-26 14:35:43.271555+03	\N	2026-03-27 05:22:44.137	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
47	1000038	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:44.101673+03	2026-03-26 14:35:43.367322+03	\N	2026-03-27 05:22:44.106	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
46	1000037	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:44.060938+03	2026-03-26 14:35:43.465812+03	\N	2026-03-26 15:22:44.074	2026-03-26 15:22:44.074	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
45	1000036	Ghbdtn (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:33.577624+03	2026-03-26 14:35:43.560586+03	\N	2026-03-26 15:22:33.581	2026-03-26 15:22:33.581	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
44	1000035	Тест  2 (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:33.556879+03	2026-03-26 14:35:43.647024+03	\N	2026-03-27 05:22:33.56	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
43	1000034	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:33.536002+03	2026-03-26 14:35:43.72471+03	\N	2026-03-27 05:22:33.539	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
42	1000033	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:33.506123+03	2026-03-26 14:35:43.795794+03	\N	2026-03-27 05:22:33.51	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
41	1000032	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:33.439493+03	2026-03-26 14:35:43.85972+03	\N	2026-03-27 05:22:33.449	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
40	1000031	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:33.347442+03	2026-03-26 14:35:43.928529+03	\N	2026-03-26 15:22:33.393	2026-03-26 15:22:33.393	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
39	1000030	Ghbdtn (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:21:05.369882+03	2026-03-26 14:35:43.981927+03	\N	2026-03-26 15:21:05.373	2026-03-26 15:21:05.373	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
38	1000029	Тест  2 (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:21:05.344455+03	2026-03-26 14:35:44.028489+03	\N	2026-03-27 05:21:05.348	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
37	1000028	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:21:05.320973+03	2026-03-26 14:35:44.0709+03	\N	2026-03-27 05:21:05.327	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
33	1000024	Тест  2	2	4	\N	2	\N	39	3	f	2026-03-25 11:38:52.880621+03	2026-03-26 14:48:25.453632+03		2026-03-25 08:38:52.906	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
36	1000027	Тест  2 (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 13:04:33.728017+03	2026-03-26 14:35:44.11001+03	\N	2026-03-27 04:04:33.744	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
31	1000022	Ghbdtn	1	4	\N	4	\N	39	6	f	2026-03-03 12:52:56.51421+03	2026-03-26 14:48:31.248042+03	<p>Ghbdntфывф</p>	2026-03-02 01:52:56.523	2026-03-02 01:52:56.523	\N	f	\N	33	{66}	{110}	1	{}	{}	0	f	\N
95	1000086	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.808533+03	2026-03-26 14:35:36.838174+03	\N	2026-03-27 05:22:55.812	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
94	1000085	Ghbdtn (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.779129+03	2026-03-26 14:35:37.005899+03	\N	2026-03-26 15:22:55.783	2026-03-26 15:22:55.783	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
93	1000084	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.755002+03	2026-03-26 14:35:37.20199+03	\N	2026-03-26 15:22:55.759	2026-03-26 15:22:55.759	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
92	1000083	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.733196+03	2026-03-26 14:35:37.365022+03	\N	2026-03-27 05:22:55.736	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
91	1000082	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.707549+03	2026-03-26 14:35:37.527029+03	\N	2026-03-27 05:22:55.711	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
90	1000081	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.683514+03	2026-03-26 14:35:37.68821+03	\N	2026-03-27 05:22:55.687	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
89	1000080	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.658849+03	2026-03-26 14:35:37.846345+03	\N	2026-03-27 05:22:55.662	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
88	1000079	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.630868+03	2026-03-26 14:35:38.016686+03	\N	2026-03-26 15:22:55.635	2026-03-26 15:22:55.635	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
87	1000078	Ghbdtn (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.595916+03	2026-03-26 14:35:38.181668+03	\N	2026-03-26 15:22:55.599	2026-03-26 15:22:55.599	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
86	1000077	Тест  2 (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.570092+03	2026-03-26 14:35:38.341382+03	\N	2026-03-27 05:22:55.573	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
85	1000076	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.538498+03	2026-03-26 14:35:38.499202+03	\N	2026-03-27 05:22:55.542	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
84	1000075	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.510969+03	2026-03-26 14:35:38.652851+03	\N	2026-03-27 05:22:55.516	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
83	1000074	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.476662+03	2026-03-26 14:35:38.803455+03	\N	2026-03-27 05:22:55.48	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
82	1000073	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.441274+03	2026-03-26 14:35:38.957262+03	\N	2026-03-26 15:22:55.446	2026-03-26 15:22:55.446	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
81	1000072	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.632674+03	2026-03-26 14:35:39.105979+03	\N	2026-03-26 15:22:50.64	2026-03-26 15:22:50.64	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
80	1000071	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.611399+03	2026-03-26 14:35:39.251691+03	\N	2026-03-27 05:22:50.615	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
79	1000070	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.590435+03	2026-03-26 14:35:39.398385+03	\N	2026-03-27 05:22:50.593	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
78	1000069	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.560373+03	2026-03-26 14:35:39.544681+03	\N	2026-03-27 05:22:50.564	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
77	1000068	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.532281+03	2026-03-26 14:35:39.690143+03	\N	2026-03-27 05:22:50.537	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
76	1000067	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.500651+03	2026-03-26 14:35:39.828545+03	\N	2026-03-26 15:22:50.507	2026-03-26 15:22:50.507	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
75	1000066	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.474696+03	2026-03-26 14:35:39.978192+03	\N	2026-03-26 15:22:50.478	2026-03-26 15:22:50.478	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
74	1000065	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.448642+03	2026-03-26 14:35:40.118658+03	\N	2026-03-27 05:22:50.453	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
73	1000064	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.425472+03	2026-03-26 14:35:40.2595+03	\N	2026-03-27 05:22:50.429	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
72	1000063	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.400715+03	2026-03-26 14:35:40.40283+03	\N	2026-03-27 05:22:50.405	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
71	1000062	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.379651+03	2026-03-26 14:35:40.538137+03	\N	2026-03-27 05:22:50.383	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
70	1000061	Ghbdtn (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.350124+03	2026-03-26 14:35:40.67281+03	\N	2026-03-26 15:22:50.355	2026-03-26 15:22:50.355	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
69	1000060	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.314758+03	2026-03-26 14:35:40.807273+03	\N	2026-03-26 15:22:50.319	2026-03-26 15:22:50.319	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
68	1000059	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.288925+03	2026-03-26 14:35:40.944217+03	\N	2026-03-27 05:22:50.294	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
67	1000058	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.261306+03	2026-03-26 14:35:41.074068+03	\N	2026-03-27 05:22:50.265	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
66	1000057	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.230679+03	2026-03-26 14:35:41.203433+03	\N	2026-03-27 05:22:50.234	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
65	1000056	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.200676+03	2026-03-26 14:35:41.331357+03	\N	2026-03-27 05:22:50.206	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
64	1000055	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.17153+03	2026-03-26 14:35:41.460351+03	\N	2026-03-26 15:22:50.175	2026-03-26 15:22:50.175	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
63	1000054	Ghbdtn (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:50.140442+03	2026-03-26 14:35:41.585693+03	\N	2026-03-26 15:22:50.145	2026-03-26 15:22:50.145	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
62	1000053	Тест  2 (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.115924+03	2026-03-26 14:35:41.707907+03	\N	2026-03-27 05:22:50.125	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
61	1000052	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.092723+03	2026-03-26 14:35:41.829039+03	\N	2026-03-27 05:22:50.096	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
60	1000051	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.062086+03	2026-03-26 14:35:41.950534+03	\N	2026-03-27 05:22:50.071	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
59	1000050	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:50.015635+03	2026-03-26 14:35:42.067809+03	\N	2026-03-27 05:22:50.019	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
58	1000049	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:49.9794+03	2026-03-26 14:35:42.187218+03	\N	2026-03-26 15:22:49.984	2026-03-26 15:22:49.984	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
57	1000048	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:44.367993+03	2026-03-26 14:35:42.300438+03	\N	2026-03-26 15:22:44.372	2026-03-26 15:22:44.372	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
136	1000127	Тест  2 (копия)	2	4	\N	3	\N	39	3	f	2026-03-26 14:38:54.403257+03	2026-03-26 14:51:25.907184+03		2026-03-26 23:38:54.41	\N	\N	f	\N	40	{64}	{110}	1	{}	{}	0	f	\N
134	1000125	Ghbdtn (копия) (копия) (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:30:20.707584+03	2026-03-26 14:35:29.505496+03	\N	2026-03-26 15:30:20.711	2026-03-26 15:30:20.711	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
133	1000124	Ghbdtn (копия) (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:30:20.670236+03	2026-03-26 14:35:29.710117+03	\N	2026-03-26 15:30:20.673	2026-03-26 15:30:20.673	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
132	1000123	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:30:20.640579+03	2026-03-26 14:35:29.926339+03	\N	2026-03-27 05:30:20.644	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
131	1000122	Тест  2 (копия) (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:30:20.615372+03	2026-03-26 14:35:30.143086+03	\N	2026-03-27 05:30:20.621	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
130	1000121	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:30:20.589937+03	2026-03-26 14:35:30.359295+03	\N	2026-03-27 05:30:20.594	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
129	1000120	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:30:20.565551+03	2026-03-26 14:35:30.639495+03	\N	2026-03-27 05:30:20.57	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
128	1000119	Ghbdtn (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:30:20.528807+03	2026-03-26 14:35:30.837413+03	\N	2026-03-26 15:30:20.534	2026-03-26 15:30:20.534	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
127	1000118	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:30:20.490873+03	2026-03-26 14:35:31.029026+03	\N	2026-03-26 15:30:20.495	2026-03-26 15:30:20.495	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
125	1000116	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.597184+03	2026-03-26 14:35:31.43049+03	\N	2026-03-27 05:22:56.602	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
124	1000115	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.563417+03	2026-03-26 14:35:31.613186+03	\N	2026-03-26 15:22:56.567	2026-03-26 15:22:56.567	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
123	1000114	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.535074+03	2026-03-26 14:35:31.796506+03	\N	2026-03-26 15:22:56.539	2026-03-26 15:22:56.539	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
122	1000113	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.505945+03	2026-03-26 14:35:31.982974+03	\N	2026-03-27 05:22:56.51	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
121	1000112	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.482858+03	2026-03-26 14:35:32.181866+03	\N	2026-03-27 05:22:56.486	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
120	1000111	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.465625+03	2026-03-26 14:35:32.377532+03	\N	2026-03-27 05:22:56.469	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
119	1000110	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.440596+03	2026-03-26 14:35:32.554521+03	\N	2026-03-27 05:22:56.443	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
118	1000109	Ghbdtn (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.414512+03	2026-03-26 14:35:32.733433+03	\N	2026-03-26 15:22:56.418	2026-03-26 15:22:56.418	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
117	1000108	Ghbdtn (копия) (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.381944+03	2026-03-26 14:35:32.916003+03	\N	2026-03-26 15:22:56.386	2026-03-26 15:22:56.386	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
116	1000107	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.362195+03	2026-03-26 14:35:33.096745+03	\N	2026-03-27 05:22:56.365	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
115	1000106	Тест  2 (копия) (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.338201+03	2026-03-26 14:35:33.283439+03	\N	2026-03-27 05:22:56.342	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
114	1000105	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.30853+03	2026-03-26 14:35:33.467614+03	\N	2026-03-27 05:22:56.311	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
113	1000104	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.285011+03	2026-03-26 14:35:33.70064+03	\N	2026-03-27 05:22:56.289	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
112	1000103	Ghbdtn (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.260134+03	2026-03-26 14:35:33.875676+03	\N	2026-03-26 15:22:56.264	2026-03-26 15:22:56.264	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
111	1000102	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.231616+03	2026-03-26 14:35:34.051292+03	\N	2026-03-26 15:22:56.236	2026-03-26 15:22:56.236	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
110	1000101	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.205317+03	2026-03-26 14:35:34.232222+03	\N	2026-03-27 05:22:56.208	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
109	1000100	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.184252+03	2026-03-26 14:35:34.421838+03	\N	2026-03-27 05:22:56.187	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
108	1000099	Тест  2 (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.166005+03	2026-03-26 14:35:34.595959+03	\N	2026-03-27 05:22:56.169	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
107	1000098	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.141376+03	2026-03-26 14:35:34.770486+03	\N	2026-03-27 05:22:56.145	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
106	1000097	Ghbdtn (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.111915+03	2026-03-26 14:35:34.947406+03	\N	2026-03-26 15:22:56.116	2026-03-26 15:22:56.116	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
105	1000096	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:56.080164+03	2026-03-26 14:35:35.127663+03	\N	2026-03-26 15:22:56.084	2026-03-26 15:22:56.084	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
104	1000095	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.060185+03	2026-03-26 14:35:35.300082+03	\N	2026-03-27 05:22:56.064	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
103	1000094	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.034844+03	2026-03-26 14:35:35.481509+03	\N	2026-03-27 05:22:56.038	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
102	1000093	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:56.006909+03	2026-03-26 14:35:35.652548+03	\N	2026-03-27 05:22:56.01	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
101	1000092	Тест  2 (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.97852+03	2026-03-26 14:35:35.823789+03	\N	2026-03-27 05:22:55.984	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
100	1000091	Ghbdtn (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.947648+03	2026-03-26 14:35:35.998038+03	\N	2026-03-26 15:22:55.951	2026-03-26 15:22:55.951	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
99	1000090	Ghbdtn (копия) (копия) (копия)	1	4	\N	2	\N	39	6	f	2026-03-26 14:22:55.914747+03	2026-03-26 14:35:36.16784+03	\N	2026-03-26 15:22:55.921	2026-03-26 15:22:55.921	\N	f	\N	33	{}	{}	1	{}	{}	0	f	\N
98	1000089	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.890634+03	2026-03-26 14:35:36.340703+03	\N	2026-03-27 05:22:55.894	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
97	1000088	Тест  2 (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:22:55.865114+03	2026-03-26 14:35:36.507294+03	\N	2026-03-27 05:22:55.868	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
135	1000126	Тест  2 (копия) (копия) (копия) (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:30:20.746818+03	2026-03-26 14:35:29.290381+03	\N	2026-03-27 05:30:20.75	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
126	1000117	Тест  2 (копия) (копия) (копия)	2	4	\N	\N	\N	39	3	f	2026-03-26 14:30:20.462258+03	2026-03-26 14:35:31.224127+03	\N	2026-03-27 05:30:20.47	\N	\N	f	\N	40	{}	{}	1	{}	{}	0	f	\N
145	1000136	вввввв (копия)	1	4	\N	2	\N	39	5	f	2026-03-26 17:11:48.791136+03	2026-03-26 17:11:59.479748+03		2026-03-26 18:11:48.799	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
140	1000131	вввввв	1	4	\N	2	\N	39	5	f	2026-03-26 17:08:37.554536+03	2026-03-26 17:12:13.110655+03	<p>ввввввв</p>	2026-03-26 15:08:37.569	\N	\N	f	\N	40	{66}	{114}	3	{}	{}	0	f	\N
141	1000132	вввввв (копия)	1	4	\N	2	\N	39	5	f	2026-03-26 17:09:49.811992+03	2026-03-26 17:12:34.311932+03		2026-03-26 15:09:49.823	\N	\N	f	\N	40	{66,64}	{110,111}	3	{}	{}	0	f	\N
142	1000133	попо	3	4	\N	2	\N	39	3	f	2026-03-26 17:10:23.658521+03	2026-03-26 17:31:58.05094+03	<p>попоп</p>	2026-03-27 02:10:23.67	\N	\N	f	\N	41	{64}	{110}	1	{}	{}	0	f	\N
143	1000134	попо (копия)	3	4	\N	2	\N	39	3	f	2026-03-26 17:11:48.679625+03	2026-03-27 09:12:58.635129+03		2026-03-27 02:11:48.687	\N	\N	f	\N	41	{55}	{110}	1	{}	{}	0	f	\N
151	1000142	вввввв (копия) (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:27.995223+03	2026-04-02 17:28:29.36934+03	\N	2026-03-27 17:24:27.999	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
155	1000146	вввввв (копия) (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-31 16:44:53.839663+03	2026-04-02 17:28:12.807063+03	\N	\N	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
154	1000145	вввввв (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-31 16:44:53.823109+03	2026-04-02 17:28:12.883406+03	\N	\N	\N	\N	f	\N	40	{65}	{110,111}	3	{}	{}	0	f	\N
153	1000144	вввввв (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-30 14:41:36.398302+03	2026-04-02 17:28:29.179896+03	\N	\N	\N	\N	f	\N	40	{65}	{110,111}	3	{}	{}	0	f	\N
152	1000143	вввввв (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:28.012951+03	2026-04-02 17:28:29.294518+03		2026-03-27 14:24:28.016	\N	\N	f	\N	40	{55}	{110}	3	{}	{}	0	f	\N
150	1000141	вввввв (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:27.976079+03	2026-04-02 17:28:29.452278+03	\N	2026-03-27 17:24:27.98	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
149	1000140	вввввв (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:27.915345+03	2026-04-02 17:28:29.522342+03	\N	2026-03-27 17:24:27.921	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
148	1000139	вввввв (копия) (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:24.605771+03	2026-04-02 17:28:29.583661+03	\N	2026-03-27 17:24:24.61	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
147	1000138	вввввв (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:24.576496+03	2026-04-02 17:28:38.734402+03	\N	2026-03-27 17:24:24.583	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
146	1000137	вввввв (копия) (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-27 13:24:20.993913+03	2026-04-02 17:28:38.792696+03	\N	2026-03-27 17:24:21.006	\N	\N	f	\N	40	{}	{}	3	{}	{}	0	f	\N
144	1000135	вввввв (копия) (копия)	1	4	\N	2	\N	39	5	f	2026-03-26 17:11:48.747809+03	2026-04-02 17:28:38.840068+03		2026-03-26 18:11:48.753	\N	\N	f	\N	40	{65}	{110,111}	3	{}	{}	0	f	\N
202	1000193	паоапо (копия)	1	4	\N	2	1	39	\N	f	2026-04-06 09:58:11.338332+03	2026-04-10 11:48:59.902744+03	\N	\N	\N	\N	f	\N	\N	{}	{111}	\N	{}	{}	0	f	\N
193	1000184	куцкцк	1	4	\N	2	35	39	6	f	2026-04-03 11:57:03.806662+03	2026-04-03 12:32:15.818699+03	<p>куцкцукцу</p>	2026-04-03 09:57:03.818	2026-04-03 09:57:03.818	\N	f	\N	39	{55}	{110,111}	3	{}	{}	0	f	\N
209	1000200	Не работает подключение к корпоративной сети через VPN	2	4	\N	4	1	39	6	f	2026-04-06 15:32:05.383288+03	2026-04-10 10:01:26.15478+03	<p style="text-align: left;"><strong>Тикет&nbsp;1</strong></p><ul><li><p style="text-align: left;"><strong>Заголовок:</strong> Не работает подключение к корпоративной сети через VPN</p></li><li><p style="text-align: left;"><strong>Создатель:</strong> Иванов&nbsp;А. С., отдел маркетинга</p></li><li><p style="text-align: left;"><strong>Дата создания:</strong> 06.04.2026</p></li><li><p style="text-align: left;"><strong>Приоритет:</strong> Высокий</p></li><li><p style="text-align: left;"><strong>Статус:</strong> New</p></li><li><p style="text-align: left;"><strong>Описание:</strong> При попытке подключиться к корпоративной сети через VPN (клиент Cisco AnyConnect) появляется ошибка «Unable to establish secure connection». Перезагрузка компьютера и перезапуск клиента VPN не помогли. Интернет‑соединение стабильно, другие онлайн‑сервисы работают.</p></li><li><p style="text-align: left;"><strong>Затронутый ресурс:</strong> Корпоративная сеть, VPN‑доступ</p></li><li><p style="text-align: left;"><strong>Вложения:</strong> Скриншот ошибки (файл <code>vpn_error_060426.png</code>)</p></li></ul><p style="text-align: left;"></p>	2026-04-05 19:32:05.405	2026-04-05 19:32:05.405	\N	f	\N	42	{59}	{111,110}	1	{59}	{111,110}	1	t	\N
302	1000306	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:56:55.638298+03	2026-04-10 12:06:53.985817+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
301	1000305	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:56:25.599068+03	2026-04-10 12:06:54.042491+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
314	1000318	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:05:25.932375+03	2026-04-10 12:06:53.051606+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
313	1000317	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:04:55.956188+03	2026-04-10 12:06:53.15849+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
312	1000316	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:04:25.909054+03	2026-04-10 12:06:53.253455+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
311	1000315	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:03:55.902668+03	2026-04-10 12:06:53.335938+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
310	1000314	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:03:25.873684+03	2026-04-10 12:06:53.424091+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
309	1000313	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:02:55.849191+03	2026-04-10 12:06:53.506783+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
308	1000312	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:02:25.815151+03	2026-04-10 12:06:53.588058+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
307	1000311	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:01:55.832577+03	2026-04-10 12:06:53.665507+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
318	1000322	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:07:26.042789+03	2026-04-10 12:09:06.490472+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
317	1000321	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:06:56.01146+03	2026-04-10 12:09:06.546361+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
325	1000328	Расписание (Р) расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 14:15:52.758906+03	2026-04-10 14:22:31.946155+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
300	1000304	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:55:55.611678+03	2026-04-10 12:06:54.09653+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
299	1000303	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:55:25.580215+03	2026-04-10 12:06:54.149992+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
298	1000302	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:54:55.570256+03	2026-04-10 12:06:54.198284+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
297	1000301	расписание  (расписание)	5	4	\N	2	36	39	6	f	2026-04-10 11:54:25.550337+03	2026-04-10 12:06:54.236036+03	<p>выфафвыавыфа</p>	\N	\N	\N	f	\N	38	{61}	{112}	\N	{}	{}	0	f	\N
306	1000310	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:01:25.771929+03	2026-04-10 12:06:53.735804+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
305	1000309	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:00:55.744117+03	2026-04-10 12:06:53.802612+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
304	1000308	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:00:25.777376+03	2026-04-10 12:06:53.868976+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
316	1000320	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:06:25.963986+03	2026-04-10 12:06:52.842783+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
315	1000319	ипавиав (расписание)	1	4	\N	8	1	39	7	f	2026-04-10 12:05:55.982408+03	2026-04-10 12:06:52.964528+03	\N	\N	\N	\N	f	\N	39	{59}	{110}	3	{}	{}	0	f	\N
332	1000335	qewsdq	1	\N	\N	2	\N	\N	\N	f	2026-04-11 18:56:24.853486+03	2026-04-11 21:02:52.931996+03	<p>qdxqwtr</p>	\N	\N	\N	f	\N	\N	{}	{111}	3	{}	{}	0	f	\N
\.


--
-- Data for Name: translation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.translation (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: type_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_categories (id, name, labor_hours, is_active, created_at, updated_at) FROM stdin;
3	Категория 2	4.00	t	2026-03-22 12:59:41.278816	2026-03-22 20:20:52.3921
2	Категория 3 	3.00	t	2026-03-22 12:59:33.756764	2026-03-22 20:21:05.462411
4	Категория 4	0.00	t	2026-03-22 20:24:21.23264	2026-03-22 20:24:21.23264
1	Доступ  пропал	1.00	t	2026-03-22 12:52:25.352506	2026-03-25 10:36:57.585756
\.


--
-- Data for Name: type_category_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_category_relations (id, type_id, category_id, created_at) FROM stdin;
\.


--
-- Data for Name: types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.types (id, name, comment, is_active, created_at, updated_at, workflow_id, category_ids) FROM stdin;
12	Инструкции	\N	t	2026-03-22 10:55:44.422502	2026-03-22 10:55:44.422502	\N	{}
13	Администрирование	\N	t	2026-03-22 10:56:50.190776	2026-03-22 10:56:50.190776	\N	{}
14	Разработка	\N	t	2026-03-22 10:56:50.201049	2026-03-22 10:56:50.201049	\N	{}
15	FAQ	\N	t	2026-03-22 10:56:50.234042	2026-03-22 10:56:50.234042	\N	{}
16	Тестовая	тест	t	2026-03-22 11:24:17.202401	2026-03-22 11:24:17.202401	\N	{}
17	weew	weew	t	2026-03-22 11:29:38.913626	2026-03-22 11:29:38.913626	\N	{}
5	Задача	Общая задача или поручение	t	2026-01-19 12:28:17.421488	2026-03-22 21:02:34.026318	1	{}
3	Проблема	Корневая причина инцидентов	t	2026-01-19 12:28:17.415065	2026-03-22 22:24:13.657294	1	{1}
2	Запрос на обслуживание	Стандартный запрос на предоставление информации или услуги	t	2026-01-19 12:28:17.410974	2026-03-22 22:24:16.623197	\N	{1}
4	Изменение	Запрос на изменение в системе	t	2026-01-19 12:28:17.41824	2026-03-22 21:20:57.130842	3	{1}
6	Уведомление	Информационное сообщение	t	2026-01-19 12:28:17.42482	2026-03-22 19:02:08.23504	\N	{}
7	Жалоба	Выражение недовольства качеством обслуживания	t	2026-01-19 12:28:17.428016	2026-03-22 19:02:08.286597	\N	{}
8	Предложение	Предложение по улучшению	t	2026-01-19 12:28:17.432445	2026-03-22 19:02:08.3416	\N	{}
9	Консультация	Запрос на консультацию	t	2026-01-19 12:28:17.437849	2026-03-22 19:02:08.393916	\N	{}
10	Техническая поддержка	Запрос технической помощи	t	2026-01-19 12:28:17.442147	2026-03-22 19:02:08.44538	\N	{}
1	Инцидент	Проблема, требующая немедленного решения	t	2026-01-19 12:28:17.404158	2026-03-25 10:37:22.013884	2	{1,3}
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, login, password, first_name, last_name, email, is_active, created_at, updated_at) FROM stdin;
1	admin	$2b$10$dae2EXFWUdl53VN/ZKMqK.nyMsh99FmabLvaoU1LbTbpyXdY2I1Ii	Admin	User	admin@demo.com	t	2026-01-18 22:01:34.429222	2026-01-18 22:01:34.429222
2	morozova	$2b$10$RSPF3om6xh/arqV5YjcW6ufEo2Uxa6HH.kH3fAiPGSVMG5fax5r0S	Ольга	Морозова	morozova@dreamdesc.ru	t	2026-04-03 12:55:40.911961	2026-04-03 12:55:40.911961
\.


--
-- Data for Name: users_groups_roles_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_groups_roles_settings (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.version (version, maintained_on, cron_on, monitored_on) FROM stdin;
24	2026-04-09 23:29:16.109322+03	2026-04-09 23:30:21.465694+03	\N
\.


--
-- Data for Name: web_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.web_services (id, name, description, endpoint, method, last_tested, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workflow_transitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_transitions (id, workflow_id, source_status_id, target_status_id, action_label, sort_order, is_active, created_at, updated_at) FROM stdin;
3	1	2	4	Взять в работу	3	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
4	1	3	4	Взять в работу	4	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
7	1	7	8	Закрыть	7	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
8	1	7	4	Открыть снова	8	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
9	1	8	4	Переоткрыть	9	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
13	2	7	8	Закрыть	4	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
14	3	\N	2	Создать запрос	1	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
15	3	2	3	Отправить на рассмотрение	2	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
16	3	3	4	Утвердить и начать	3	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
17	3	3	8	Отклонить	4	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
18	3	4	7	Выполнить	5	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
19	3	7	8	Закрыть	6	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
10	2	\N	2	Зарегистрировать	1	t	2026-02-21 17:15:48.025625+03	2026-02-21 19:13:39.813152+03
22	4	2	4	Создан	1	t	2026-03-10 22:47:00.274138+03	2026-03-10 22:47:00.274138+03
2	1	2	3	Открыть	2	t	2026-02-21 17:15:48.025625+03	2026-03-22 08:23:55.710614+03
1	1	\N	2	Создать	1	t	2026-02-21 17:15:48.025625+03	2026-03-22 08:23:55.728386+03
11	2	2	11	Начать расследование	2	t	2026-02-21 17:15:48.025625+03	2026-04-09 10:40:41.696701+03
12	2	11	7	Решить	3	t	2026-02-21 17:15:48.025625+03	2026-04-09 10:40:51.801442+03
23	2	11	4	Два	5	t	2026-04-09 10:17:08.66985+03	2026-04-09 10:41:23.613979+03
24	2	4	11	три	6	t	2026-04-09 10:17:59.819289+03	2026-04-09 10:41:45.927952+03
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflows (id, name, description, is_active, created_at, updated_at) FROM stdin;
2	Incident Workflow	Линейный процесс обработки инцидентов	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
3	Change Request Workflow	Процесс согласования изменений	t	2026-02-21 17:15:48.025625+03	2026-02-21 17:15:48.025625+03
4	eqwewq	q	t	2026-03-10 22:46:37.156516+03	2026-03-10 22:46:37.156516+03
1	Флоу инц	Жизненный цикл багов с возможностью возврата на доработку	t	2026-02-21 17:15:48.025625+03	2026-04-12 11:23:08.440849+03
\.


--
-- Name: acl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acl_id_seq', 1, false);


--
-- Name: acls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acls_id_seq', 1, false);


--
-- Name: admin_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_notification_id_seq', 1, true);


--
-- Name: admin_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_notifications_id_seq', 1, false);


--
-- Name: agents_groups_agents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_groups_agents_id_seq', 632, true);


--
-- Name: agents_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_groups_id_seq', 115, true);


--
-- Name: agents_groups_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_groups_roles_id_seq', 17, true);


--
-- Name: agents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_id_seq', 70, true);


--
-- Name: agents_queues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_queues_id_seq', 1, false);


--
-- Name: agents_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_roles_id_seq', 1, false);


--
-- Name: appointment_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointment_notifications_id_seq', 1, false);


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attachments_id_seq', 8, true);


--
-- Name: auto_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auto_responses_id_seq', 1, false);


--
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 577, true);


--
-- Name: calendars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendars_id_seq', 4, true);


--
-- Name: communication_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communication_log_id_seq', 1, false);


--
-- Name: communication_notifications_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communication_notifications_settings_id_seq', 1, false);


--
-- Name: customer_users_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_users_customers_id_seq', 1, false);


--
-- Name: customer_users_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_users_groups_id_seq', 1, false);


--
-- Name: customer_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_users_id_seq', 125, true);


--
-- Name: customer_users_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_users_services_id_seq', 1, false);


--
-- Name: customers_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_groups_id_seq', 10, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 39, true);


--
-- Name: customers_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_services_id_seq', 44, true);


--
-- Name: dynamic_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dynamic_fields_id_seq', 1, false);


--
-- Name: dynamic_fields_screens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dynamic_fields_screens_id_seq', 1, false);


--
-- Name: dynamicfields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dynamicfields_id_seq', 1, false);


--
-- Name: email_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_addresses_id_seq', 2, true);


--
-- Name: general_catalog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.general_catalog_id_seq', 1, true);


--
-- Name: generic_agent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.generic_agent_id_seq', 1, false);


--
-- Name: greetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.greetings_id_seq', 8, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_base_id_seq', 12, true);


--
-- Name: oauth2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oauth2_id_seq', 1, false);


--
-- Name: package_manager_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.package_manager_id_seq', 1, true);


--
-- Name: performance_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.performance_log_id_seq', 1, true);


--
-- Name: pgp_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pgp_keys_id_seq', 1, false);


--
-- Name: post_master_filters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_master_filters_id_seq', 1, false);


--
-- Name: post_master_mail_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_master_mail_accounts_id_seq', 34, true);


--
-- Name: priorities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.priorities_id_seq', 14, true);


--
-- Name: process_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.process_management_id_seq', 1, false);


--
-- Name: processes_automation_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.processes_automation_settings_id_seq', 1, false);


--
-- Name: queue_auto_response_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queue_auto_response_id_seq', 1, false);


--
-- Name: queues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queues_id_seq', 25, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 136, true);


--
-- Name: roles_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_groups_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 13, true);


--
-- Name: schedule_execution_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schedule_execution_logs_id_seq', 44, true);


--
-- Name: service_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_attachments_id_seq', 3, true);


--
-- Name: services_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_attachments_id_seq', 5, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 47, true);


--
-- Name: session_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_management_id_seq', 1, false);


--
-- Name: signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signatures_id_seq', 8, true);


--
-- Name: sla_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sla_id_seq', 7, true);


--
-- Name: sla_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sla_services_id_seq', 8, true);


--
-- Name: smime_certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smime_certificates_id_seq', 1, false);


--
-- Name: sql_box_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sql_box_id_seq', 1, false);


--
-- Name: state_transitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.state_transitions_id_seq', 2, true);


--
-- Name: states_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.states_id_seq', 13, true);


--
-- Name: support_data_collector_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_data_collector_id_seq', 1, false);


--
-- Name: system_configuration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_configuration_id_seq', 4, true);


--
-- Name: system_file_support_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_file_support_id_seq', 1, false);


--
-- Name: system_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_log_id_seq', 1, false);


--
-- Name: system_maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_maintenance_id_seq', 1, false);


--
-- Name: template_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.template_attachments_id_seq', 1, true);


--
-- Name: template_queues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.template_queues_id_seq', 1, false);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.templates_id_seq', 4, true);


--
-- Name: test_entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_entities_id_seq', 1, false);


--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_attachments_id_seq', 21, true);


--
-- Name: ticket_attribute_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_attribute_relations_id_seq', 1, false);


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_comments_id_seq', 31, true);


--
-- Name: ticket_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_history_id_seq', 627, true);


--
-- Name: ticket_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_notifications_id_seq', 1, false);


--
-- Name: ticket_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_number_seq', 1000345, true);


--
-- Name: ticket_schedule_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_schedule_logs_id_seq', 4, true);


--
-- Name: ticket_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_schedules_id_seq', 33, true);


--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_status_history_id_seq', 150, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 342, true);


--
-- Name: translation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.translation_id_seq', 1, false);


--
-- Name: type_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_categories_id_seq', 4, true);


--
-- Name: type_category_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_category_relations_id_seq', 1, false);


--
-- Name: types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.types_id_seq', 17, true);


--
-- Name: users_groups_roles_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_groups_roles_settings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: web_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.web_services_id_seq', 1, false);


--
-- Name: workflow_transitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_transitions_id_seq', 24, true);


--
-- Name: workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflows_id_seq', 4, true);


--
-- Name: archive archive_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.archive
    ADD CONSTRAINT archive_pkey PRIMARY KEY (name, id);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (name, id);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey PRIMARY KEY (name, id);


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c
    ADD CONSTRAINT j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey PRIMARY KEY (name, id);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (name);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (name);


--
-- Name: subscription subscription_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.subscription
    ADD CONSTRAINT subscription_pkey PRIMARY KEY (event, name);


--
-- Name: version version_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.version
    ADD CONSTRAINT version_pkey PRIMARY KEY (version);


--
-- Name: acl acl_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acl
    ADD CONSTRAINT acl_pkey PRIMARY KEY (id);


--
-- Name: acls acls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acls
    ADD CONSTRAINT acls_pkey PRIMARY KEY (id);


--
-- Name: admin_notification admin_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notification
    ADD CONSTRAINT admin_notification_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: agents agents_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_email_key UNIQUE (email);


--
-- Name: agents_groups_agents agents_groups_agents_agents_group_id_agent_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_agents
    ADD CONSTRAINT agents_groups_agents_agents_group_id_agent_id_key UNIQUE (agents_group_id, agent_id);


--
-- Name: agents_groups_agents agents_groups_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_agents
    ADD CONSTRAINT agents_groups_agents_pkey PRIMARY KEY (id);


--
-- Name: agents_groups agents_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups
    ADD CONSTRAINT agents_groups_pkey PRIMARY KEY (id);


--
-- Name: agents_groups_roles agents_groups_roles_agents_group_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_roles
    ADD CONSTRAINT agents_groups_roles_agents_group_id_role_id_key UNIQUE (agents_group_id, role_id);


--
-- Name: agents_groups_roles agents_groups_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_roles
    ADD CONSTRAINT agents_groups_roles_pkey PRIMARY KEY (id);


--
-- Name: agents agents_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_login_key UNIQUE (login);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: agents_queues agents_queues_agent_id_queue_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_queues
    ADD CONSTRAINT agents_queues_agent_id_queue_id_key UNIQUE (agent_id, queue_id);


--
-- Name: agents_queues agents_queues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_queues
    ADD CONSTRAINT agents_queues_pkey PRIMARY KEY (id);


--
-- Name: agents_roles agents_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_roles
    ADD CONSTRAINT agents_roles_pkey PRIMARY KEY (id);


--
-- Name: appointment_notifications appointment_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_notifications
    ADD CONSTRAINT appointment_notifications_pkey PRIMARY KEY (id);


--
-- Name: archive archive_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archive
    ADD CONSTRAINT archive_pkey PRIMARY KEY (name, id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: auto_responses auto_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto_responses
    ADD CONSTRAINT auto_responses_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: calendars calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_pkey PRIMARY KEY (id);


--
-- Name: communication_log communication_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_log
    ADD CONSTRAINT communication_log_pkey PRIMARY KEY (id);


--
-- Name: communication_notifications_settings communication_notifications_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_notifications_settings
    ADD CONSTRAINT communication_notifications_settings_pkey PRIMARY KEY (id);


--
-- Name: customer_users_customers customer_users_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_customers
    ADD CONSTRAINT customer_users_customers_pkey PRIMARY KEY (id);


--
-- Name: customer_users customer_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT customer_users_email_key UNIQUE (email);


--
-- Name: customer_users_groups customer_users_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_groups
    ADD CONSTRAINT customer_users_groups_pkey PRIMARY KEY (id);


--
-- Name: customer_users customer_users_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT customer_users_login_key UNIQUE (login);


--
-- Name: customer_users customer_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT customer_users_pkey PRIMARY KEY (id);


--
-- Name: customer_users_services customer_users_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_services
    ADD CONSTRAINT customer_users_services_pkey PRIMARY KEY (id);


--
-- Name: customers_groups customers_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_groups
    ADD CONSTRAINT customers_groups_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers_services customers_services_customer_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_services
    ADD CONSTRAINT customers_services_customer_id_service_id_key UNIQUE (customer_id, service_id);


--
-- Name: customers_services customers_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_services
    ADD CONSTRAINT customers_services_pkey PRIMARY KEY (id);


--
-- Name: dynamic_fields dynamic_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dynamic_fields
    ADD CONSTRAINT dynamic_fields_pkey PRIMARY KEY (id);


--
-- Name: dynamic_fields_screens dynamic_fields_screens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dynamic_fields_screens
    ADD CONSTRAINT dynamic_fields_screens_pkey PRIMARY KEY (id);


--
-- Name: dynamicfields dynamicfields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dynamicfields
    ADD CONSTRAINT dynamicfields_pkey PRIMARY KEY (id);


--
-- Name: email_addresses email_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_pkey PRIMARY KEY (id);


--
-- Name: general_catalog general_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_catalog
    ADD CONSTRAINT general_catalog_pkey PRIMARY KEY (id);


--
-- Name: generic_agent generic_agent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_agent
    ADD CONSTRAINT generic_agent_pkey PRIMARY KEY (id);


--
-- Name: greetings greetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.greetings
    ADD CONSTRAINT greetings_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (name, id);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey PRIMARY KEY (name, id);


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c
    ADD CONSTRAINT j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey PRIMARY KEY (name, id);


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f
    ADD CONSTRAINT jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_pkey PRIMARY KEY (name, id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: oauth2 oauth2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth2
    ADD CONSTRAINT oauth2_pkey PRIMARY KEY (id);


--
-- Name: package_manager package_manager_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_manager
    ADD CONSTRAINT package_manager_pkey PRIMARY KEY (id);


--
-- Name: performance_log performance_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_log
    ADD CONSTRAINT performance_log_pkey PRIMARY KEY (id);


--
-- Name: pgp_keys pgp_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pgp_keys
    ADD CONSTRAINT pgp_keys_pkey PRIMARY KEY (id);


--
-- Name: post_master_filters post_master_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_master_filters
    ADD CONSTRAINT post_master_filters_pkey PRIMARY KEY (id);


--
-- Name: post_master_mail_accounts post_master_mail_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_master_mail_accounts
    ADD CONSTRAINT post_master_mail_accounts_pkey PRIMARY KEY (id);


--
-- Name: priorities priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.priorities
    ADD CONSTRAINT priorities_pkey PRIMARY KEY (id);


--
-- Name: process_management process_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_management
    ADD CONSTRAINT process_management_pkey PRIMARY KEY (id);


--
-- Name: processes_automation_settings processes_automation_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processes_automation_settings
    ADD CONSTRAINT processes_automation_settings_pkey PRIMARY KEY (id);


--
-- Name: queue_auto_response queue_auto_response_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_auto_response
    ADD CONSTRAINT queue_auto_response_pkey PRIMARY KEY (id);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (name);


--
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_key UNIQUE (role_id, permission);


--
-- Name: roles_groups roles_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_groups
    ADD CONSTRAINT roles_groups_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schedule_execution_logs schedule_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_execution_logs
    ADD CONSTRAINT schedule_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (name);


--
-- Name: service_attachments service_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_attachments
    ADD CONSTRAINT service_attachments_pkey PRIMARY KEY (id);


--
-- Name: services_attachments services_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_attachments
    ADD CONSTRAINT services_attachments_pkey PRIMARY KEY (id);


--
-- Name: services_attachments services_attachments_service_id_attachment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_attachments
    ADD CONSTRAINT services_attachments_service_id_attachment_id_key UNIQUE (service_id, attachment_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session_management session_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_management
    ADD CONSTRAINT session_management_pkey PRIMARY KEY (id);


--
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- Name: sla sla_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla
    ADD CONSTRAINT sla_pkey PRIMARY KEY (id);


--
-- Name: sla_services sla_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla_services
    ADD CONSTRAINT sla_services_pkey PRIMARY KEY (id);


--
-- Name: sla_services sla_services_sla_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla_services
    ADD CONSTRAINT sla_services_sla_id_service_id_key UNIQUE (sla_id, service_id);


--
-- Name: smime_certificates smime_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smime_certificates
    ADD CONSTRAINT smime_certificates_pkey PRIMARY KEY (id);


--
-- Name: sql_box sql_box_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sql_box
    ADD CONSTRAINT sql_box_pkey PRIMARY KEY (id);


--
-- Name: state_transitions state_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_transitions
    ADD CONSTRAINT state_transitions_pkey PRIMARY KEY (id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: subscription subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription
    ADD CONSTRAINT subscription_pkey PRIMARY KEY (event, name);


--
-- Name: support_data_collector support_data_collector_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_data_collector
    ADD CONSTRAINT support_data_collector_pkey PRIMARY KEY (id);


--
-- Name: system_configuration system_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configuration
    ADD CONSTRAINT system_configuration_pkey PRIMARY KEY (id);


--
-- Name: system_file_support system_file_support_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_file_support
    ADD CONSTRAINT system_file_support_pkey PRIMARY KEY (id);


--
-- Name: system_log system_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_log
    ADD CONSTRAINT system_log_pkey PRIMARY KEY (id);


--
-- Name: system_maintenance system_maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_maintenance
    ADD CONSTRAINT system_maintenance_pkey PRIMARY KEY (id);


--
-- Name: template_attachments template_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_attachments
    ADD CONSTRAINT template_attachments_pkey PRIMARY KEY (id);


--
-- Name: template_queues template_queues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_queues
    ADD CONSTRAINT template_queues_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: test_entities test_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_entities
    ADD CONSTRAINT test_entities_pkey PRIMARY KEY (id);


--
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: ticket_attribute_relations ticket_attribute_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attribute_relations
    ADD CONSTRAINT ticket_attribute_relations_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: ticket_history ticket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_pkey PRIMARY KEY (id);


--
-- Name: ticket_notifications ticket_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_notifications
    ADD CONSTRAINT ticket_notifications_pkey PRIMARY KEY (id);


--
-- Name: ticket_schedule_logs ticket_schedule_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedule_logs
    ADD CONSTRAINT ticket_schedule_logs_pkey PRIMARY KEY (id);


--
-- Name: ticket_schedules ticket_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedules
    ADD CONSTRAINT ticket_schedules_pkey PRIMARY KEY (id);


--
-- Name: ticket_status_history ticket_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_number_key UNIQUE (ticket_number);


--
-- Name: translation translation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation
    ADD CONSTRAINT translation_pkey PRIMARY KEY (id);


--
-- Name: type_categories type_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_categories
    ADD CONSTRAINT type_categories_pkey PRIMARY KEY (id);


--
-- Name: type_category_relations type_category_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_category_relations
    ADD CONSTRAINT type_category_relations_pkey PRIMARY KEY (id);


--
-- Name: type_category_relations type_category_relations_type_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_category_relations
    ADD CONSTRAINT type_category_relations_type_id_category_id_key UNIQUE (type_id, category_id);


--
-- Name: types types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_pkey PRIMARY KEY (id);


--
-- Name: workflow_transitions unique_transition; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_transitions
    ADD CONSTRAINT unique_transition UNIQUE (workflow_id, source_status_id, target_status_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_groups_roles_settings users_groups_roles_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_roles_settings
    ADD CONSTRAINT users_groups_roles_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: version version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version
    ADD CONSTRAINT version_pkey PRIMARY KEY (version);


--
-- Name: web_services web_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.web_services
    ADD CONSTRAINT web_services_pkey PRIMARY KEY (id);


--
-- Name: workflow_transitions workflow_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_transitions
    ADD CONSTRAINT workflow_transitions_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: archive_i1; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE INDEX archive_i1 ON pgboss.archive USING btree (archived_on);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i1; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i1 ON pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i2; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i2 ON pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i3; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i3 ON pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i4; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i4 ON pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i5; Type: INDEX; Schema: pgboss; Owner: postgres
--

CREATE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i5 ON pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: archive_i1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX archive_i1 ON public.archive USING btree (archived_on);


--
-- Name: idx_acl_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acl_is_active ON public.acl USING btree (is_active);


--
-- Name: idx_acl_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acl_name ON public.acl USING btree (name);


--
-- Name: idx_acls_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acls_is_active ON public.acls USING btree (is_active);


--
-- Name: idx_acls_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acls_name ON public.acls USING btree (name);


--
-- Name: idx_admin_notification_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notification_is_active ON public.admin_notification USING btree (is_active);


--
-- Name: idx_admin_notification_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notification_name ON public.admin_notification USING btree (name);


--
-- Name: idx_admin_notifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_is_active ON public.admin_notifications USING btree (is_active);


--
-- Name: idx_admin_notifications_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_name ON public.admin_notifications USING btree (name);


--
-- Name: idx_agents_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_email ON public.agents USING btree (email);


--
-- Name: idx_agents_groups_agents_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_agents_agent_id ON public.agents_groups_agents USING btree (agent_id);


--
-- Name: idx_agents_groups_agents_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_agents_group_id ON public.agents_groups_agents USING btree (agents_group_id);


--
-- Name: idx_agents_groups_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_is_active ON public.agents_groups USING btree (is_active);


--
-- Name: idx_agents_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_name ON public.agents_groups USING btree (name);


--
-- Name: idx_agents_groups_roles_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_roles_group_id ON public.agents_groups_roles USING btree (agents_group_id);


--
-- Name: idx_agents_groups_roles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_roles_role_id ON public.agents_groups_roles USING btree (role_id);


--
-- Name: idx_agents_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_is_active ON public.agents USING btree (is_active);


--
-- Name: idx_agents_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_login ON public.agents USING btree (login);


--
-- Name: idx_agents_queues_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_queues_agent_id ON public.agents_queues USING btree (agent_id);


--
-- Name: idx_agents_queues_queue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_queues_queue_id ON public.agents_queues USING btree (queue_id);


--
-- Name: idx_agents_roles_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_roles_is_active ON public.agents_roles USING btree (is_active);


--
-- Name: idx_agents_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_roles_name ON public.agents_roles USING btree (name);


--
-- Name: idx_appointment_notifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_notifications_is_active ON public.appointment_notifications USING btree (is_active);


--
-- Name: idx_appointment_notifications_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_notifications_name ON public.appointment_notifications USING btree (name);


--
-- Name: idx_attachments_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attachments_is_active ON public.attachments USING btree (is_active);


--
-- Name: idx_attachments_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attachments_name ON public.attachments USING btree (name);


--
-- Name: idx_auto_responses_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auto_responses_is_active ON public.auto_responses USING btree (is_active);


--
-- Name: idx_auto_responses_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auto_responses_name ON public.auto_responses USING btree (name);


--
-- Name: idx_calendar_events_calendar_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_calendar_id ON public.calendar_events USING btree (calendar_id);


--
-- Name: idx_calendar_events_event_end; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_event_end ON public.calendar_events USING btree (event_end);


--
-- Name: idx_calendar_events_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_start ON public.calendar_events USING btree (start);


--
-- Name: idx_calendars_color; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_color ON public.calendars USING btree (color);


--
-- Name: idx_calendars_date_from; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_date_from ON public.calendars USING btree (date_from);


--
-- Name: idx_calendars_date_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_date_to ON public.calendars USING btree (date_to);


--
-- Name: idx_calendars_include_weekends; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_include_weekends ON public.calendars USING btree (include_weekends);


--
-- Name: idx_calendars_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_is_active ON public.calendars USING btree (is_active);


--
-- Name: idx_calendars_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_name ON public.calendars USING btree (name);


--
-- Name: idx_calendars_work_days_per_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_work_days_per_week ON public.calendars USING btree (work_days_per_week);


--
-- Name: idx_calendars_work_hours_from; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_work_hours_from ON public.calendars USING btree (work_hours_from);


--
-- Name: idx_calendars_work_hours_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendars_work_hours_to ON public.calendars USING btree (work_hours_to);


--
-- Name: idx_communication_log_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_log_is_active ON public.communication_log USING btree (is_active);


--
-- Name: idx_communication_log_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_log_name ON public.communication_log USING btree (name);


--
-- Name: idx_communication_notifications_settings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_notifications_settings_is_active ON public.communication_notifications_settings USING btree (is_active);


--
-- Name: idx_communication_notifications_settings_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_notifications_settings_name ON public.communication_notifications_settings USING btree (name);


--
-- Name: idx_customer_users_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_customer_id ON public.customer_users USING btree (customer_id);


--
-- Name: idx_customer_users_customers_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_customers_group_id ON public.customer_users USING btree (customers_group_id);


--
-- Name: idx_customer_users_customers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_customers_is_active ON public.customer_users_customers USING btree (is_active);


--
-- Name: idx_customer_users_customers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_customers_name ON public.customer_users_customers USING btree (name);


--
-- Name: idx_customer_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_email ON public.customer_users USING btree (email);


--
-- Name: idx_customer_users_first_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_first_name ON public.customer_users USING btree (first_name);


--
-- Name: idx_customer_users_groups_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_groups_is_active ON public.customer_users_groups USING btree (is_active);


--
-- Name: idx_customer_users_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_groups_name ON public.customer_users_groups USING btree (name);


--
-- Name: idx_customer_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_is_active ON public.customer_users USING btree (is_active);


--
-- Name: idx_customer_users_last_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_last_name ON public.customer_users USING btree (last_name);


--
-- Name: idx_customer_users_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_login ON public.customer_users USING btree (login);


--
-- Name: idx_customer_users_services_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_services_is_active ON public.customer_users_services USING btree (is_active);


--
-- Name: idx_customer_users_services_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_services_name ON public.customer_users_services USING btree (name);


--
-- Name: idx_customers_groups_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_groups_customer_id ON public.customers_groups USING btree (customer_id);


--
-- Name: idx_customers_groups_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_groups_is_active ON public.customers_groups USING btree (is_active);


--
-- Name: idx_customers_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_groups_name ON public.customers_groups USING btree (name);


--
-- Name: idx_customers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_is_active ON public.customers USING btree (is_active);


--
-- Name: idx_customers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_name ON public.customers USING btree (name);


--
-- Name: idx_customers_services_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_services_customer_id ON public.customers_services USING btree (customer_id);


--
-- Name: idx_customers_services_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_services_service_id ON public.customers_services USING btree (service_id);


--
-- Name: idx_dynamic_fields_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dynamic_fields_is_active ON public.dynamic_fields USING btree (is_active);


--
-- Name: idx_dynamic_fields_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dynamic_fields_name ON public.dynamic_fields USING btree (name);


--
-- Name: idx_dynamic_fields_screens_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dynamic_fields_screens_is_active ON public.dynamic_fields_screens USING btree (is_active);


--
-- Name: idx_dynamic_fields_screens_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dynamic_fields_screens_name ON public.dynamic_fields_screens USING btree (name);


--
-- Name: idx_email_addresses_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_addresses_is_active ON public.email_addresses USING btree (is_active);


--
-- Name: idx_email_addresses_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_addresses_name ON public.email_addresses USING btree (name);


--
-- Name: idx_email_addresses_queue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_addresses_queue_id ON public.email_addresses USING btree (queue_id);


--
-- Name: idx_general_catalog_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_general_catalog_is_active ON public.general_catalog USING btree (is_active);


--
-- Name: idx_general_catalog_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_general_catalog_name ON public.general_catalog USING btree (name);


--
-- Name: idx_generic_agent_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_generic_agent_is_active ON public.generic_agent USING btree (is_active);


--
-- Name: idx_generic_agent_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_generic_agent_name ON public.generic_agent USING btree (name);


--
-- Name: idx_greetings_content; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_greetings_content ON public.greetings USING btree (content);


--
-- Name: idx_greetings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_greetings_is_active ON public.greetings USING btree (is_active);


--
-- Name: idx_greetings_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_greetings_name ON public.greetings USING btree (name);


--
-- Name: idx_groups_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_is_active ON public.groups USING btree (is_active);


--
-- Name: idx_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_name ON public.groups USING btree (name);


--
-- Name: idx_kb_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_active ON public.knowledge_base USING btree (is_active);


--
-- Name: idx_kb_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_category ON public.knowledge_base USING btree (category_id);


--
-- Name: idx_kb_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_created_by ON public.knowledge_base USING btree (created_by);


--
-- Name: idx_kb_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_published ON public.knowledge_base USING btree (is_published);


--
-- Name: idx_kb_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_service ON public.knowledge_base USING btree (service_id);


--
-- Name: idx_kb_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_tags ON public.knowledge_base USING gin (tags);


--
-- Name: idx_kb_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kb_title ON public.knowledge_base USING btree (title);


--
-- Name: idx_oauth2_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth2_is_active ON public.oauth2 USING btree (is_active);


--
-- Name: idx_oauth2_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth2_name ON public.oauth2 USING btree (name);


--
-- Name: idx_package_manager_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_manager_is_active ON public.package_manager USING btree (is_active);


--
-- Name: idx_package_manager_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_manager_name ON public.package_manager USING btree (name);


--
-- Name: idx_performance_log_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_performance_log_is_active ON public.performance_log USING btree (is_active);


--
-- Name: idx_performance_log_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_performance_log_name ON public.performance_log USING btree (name);


--
-- Name: idx_pgp_keys_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pgp_keys_is_active ON public.pgp_keys USING btree (is_active);


--
-- Name: idx_pgp_keys_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pgp_keys_name ON public.pgp_keys USING btree (name);


--
-- Name: idx_post_master_filters_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_master_filters_is_active ON public.post_master_filters USING btree (is_active);


--
-- Name: idx_post_master_filters_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_master_filters_name ON public.post_master_filters USING btree (name);


--
-- Name: idx_post_master_mail_accounts_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_master_mail_accounts_is_active ON public.post_master_mail_accounts USING btree (is_active);


--
-- Name: idx_post_master_mail_accounts_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_master_mail_accounts_name ON public.post_master_mail_accounts USING btree (name);


--
-- Name: idx_priorities_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_priorities_is_active ON public.priorities USING btree (is_active);


--
-- Name: idx_priorities_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_priorities_name ON public.priorities USING btree (name);


--
-- Name: idx_process_management_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_management_is_active ON public.process_management USING btree (is_active);


--
-- Name: idx_process_management_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_management_name ON public.process_management USING btree (name);


--
-- Name: idx_processes_automation_settings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processes_automation_settings_is_active ON public.processes_automation_settings USING btree (is_active);


--
-- Name: idx_processes_automation_settings_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processes_automation_settings_name ON public.processes_automation_settings USING btree (name);


--
-- Name: idx_queue_auto_response_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queue_auto_response_is_active ON public.queue_auto_response USING btree (is_active);


--
-- Name: idx_queue_auto_response_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queue_auto_response_name ON public.queue_auto_response USING btree (name);


--
-- Name: idx_queues_agent_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_agent_group ON public.queues USING btree (agent_group_id);


--
-- Name: idx_queues_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_category_id ON public.queues USING btree (category_id);


--
-- Name: idx_queues_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_company ON public.queues USING btree (company_id);


--
-- Name: idx_queues_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_company_id ON public.queues USING btree (company_id);


--
-- Name: idx_queues_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_department_id ON public.queues USING btree (department_id);


--
-- Name: idx_queues_executor_agents; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_executor_agents ON public.queues USING gin (executor_agent_ids);


--
-- Name: idx_queues_executor_groups; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_executor_groups ON public.queues USING gin (executor_group_ids);


--
-- Name: idx_queues_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_is_active ON public.queues USING btree (is_active);


--
-- Name: idx_queues_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_name ON public.queues USING btree (name);


--
-- Name: idx_queues_observer_agents; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_observer_agents ON public.queues USING gin (observer_agent_ids);


--
-- Name: idx_queues_post_master_mail_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_post_master_mail_account_id ON public.queues USING btree (post_master_mail_account_id);


--
-- Name: idx_queues_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_priority ON public.queues USING btree (priority_id);


--
-- Name: idx_queues_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_service ON public.queues USING btree (service_id);


--
-- Name: idx_queues_sla; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_sla ON public.queues USING btree (sla_id);


--
-- Name: idx_queues_template_close; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_close ON public.queues USING btree (template_close_ticket_id);


--
-- Name: idx_queues_template_comment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_comment ON public.queues USING btree (template_comment_ticket_id);


--
-- Name: idx_queues_template_confirm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_confirm ON public.queues USING btree (template_confirm_ticket_id);


--
-- Name: idx_queues_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_id ON public.queues USING btree (template_id);


--
-- Name: idx_queues_template_open; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_open ON public.queues USING btree (template_open_ticket_id);


--
-- Name: idx_queues_template_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_status ON public.queues USING btree (template_status_change_id);


--
-- Name: idx_queues_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_type_id ON public.queues USING btree (type_id);


--
-- Name: idx_queues_workflow; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_workflow ON public.queues USING btree (workflow_id);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_roles_groups_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_groups_is_active ON public.roles_groups USING btree (is_active);


--
-- Name: idx_roles_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_groups_name ON public.roles_groups USING btree (name);


--
-- Name: idx_roles_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_is_active ON public.roles USING btree (is_active);


--
-- Name: idx_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_name ON public.roles USING btree (name);


--
-- Name: idx_schedule_execution_logs_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_execution_logs_schedule_id ON public.schedule_execution_logs USING btree (schedule_id);


--
-- Name: idx_service_attachments_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_attachments_service_id ON public.service_attachments USING btree (service_id);


--
-- Name: idx_service_attachments_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_attachments_uploaded_by ON public.service_attachments USING btree (uploaded_by);


--
-- Name: idx_services_attachments_attachment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_attachments_attachment_id ON public.services_attachments USING btree (attachment_id);


--
-- Name: idx_services_attachments_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_attachments_service_id ON public.services_attachments USING btree (service_id);


--
-- Name: idx_services_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);


--
-- Name: idx_services_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_name ON public.services USING btree (name);


--
-- Name: idx_services_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_type ON public.services USING btree (type);


--
-- Name: idx_session_management_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_management_is_active ON public.session_management USING btree (is_active);


--
-- Name: idx_signatures_comment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_comment ON public.signatures USING btree (comment);


--
-- Name: idx_signatures_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_is_active ON public.signatures USING btree (is_active);


--
-- Name: idx_signatures_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_name ON public.signatures USING btree (name);


--
-- Name: idx_sla_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sla_is_active ON public.sla USING btree (is_active);


--
-- Name: idx_sla_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sla_name ON public.sla USING btree (name);


--
-- Name: idx_sla_services_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sla_services_service_id ON public.sla_services USING btree (service_id);


--
-- Name: idx_sla_services_sla_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sla_services_sla_id ON public.sla_services USING btree (sla_id);


--
-- Name: idx_smime_certificates_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_smime_certificates_is_active ON public.smime_certificates USING btree (is_active);


--
-- Name: idx_smime_certificates_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_smime_certificates_name ON public.smime_certificates USING btree (name);


--
-- Name: idx_sql_box_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sql_box_is_active ON public.sql_box USING btree (is_active);


--
-- Name: idx_sql_box_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sql_box_name ON public.sql_box USING btree (name);


--
-- Name: idx_state_transitions_from; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_transitions_from ON public.state_transitions USING btree (from_state_id);


--
-- Name: idx_state_transitions_from_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_transitions_from_state ON public.state_transitions USING btree (from_state_id);


--
-- Name: idx_state_transitions_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_transitions_to ON public.state_transitions USING btree (to_state_id);


--
-- Name: idx_state_transitions_to_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_transitions_to_state ON public.state_transitions USING btree (to_state_id);


--
-- Name: idx_state_transitions_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_transitions_type_id ON public.state_transitions USING btree (type_id);


--
-- Name: idx_states_color; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_states_color ON public.states USING btree (color);


--
-- Name: idx_states_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_states_is_active ON public.states USING btree (is_active);


--
-- Name: idx_states_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_states_name ON public.states USING btree (name);


--
-- Name: idx_states_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_states_type ON public.states USING btree (type);


--
-- Name: idx_states_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_states_type_id ON public.states USING btree (type_id);


--
-- Name: idx_support_data_collector_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_data_collector_is_active ON public.support_data_collector USING btree (is_active);


--
-- Name: idx_support_data_collector_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_data_collector_name ON public.support_data_collector USING btree (name);


--
-- Name: idx_system_configuration_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_configuration_is_active ON public.system_configuration USING btree (is_active);


--
-- Name: idx_system_configuration_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_configuration_name ON public.system_configuration USING btree (name);


--
-- Name: idx_system_configuration_name_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_system_configuration_name_unique ON public.system_configuration USING btree (name);


--
-- Name: idx_system_file_support_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_file_support_is_active ON public.system_file_support USING btree (is_active);


--
-- Name: idx_system_file_support_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_file_support_name ON public.system_file_support USING btree (name);


--
-- Name: idx_system_log_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_log_is_active ON public.system_log USING btree (is_active);


--
-- Name: idx_system_log_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_log_name ON public.system_log USING btree (name);


--
-- Name: idx_system_maintenance_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_maintenance_is_active ON public.system_maintenance USING btree (is_active);


--
-- Name: idx_system_maintenance_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_maintenance_name ON public.system_maintenance USING btree (name);


--
-- Name: idx_template_attachments_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_template_attachments_is_active ON public.template_attachments USING btree (is_active);


--
-- Name: idx_template_attachments_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_template_attachments_name ON public.template_attachments USING btree (name);


--
-- Name: idx_template_queues_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_template_queues_is_active ON public.template_queues USING btree (is_active);


--
-- Name: idx_template_queues_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_template_queues_name ON public.template_queues USING btree (name);


--
-- Name: idx_templates_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_is_active ON public.templates USING btree (is_active);


--
-- Name: idx_templates_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_name ON public.templates USING btree (name);


--
-- Name: idx_test_entities_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_entities_is_active ON public.test_entities USING btree (is_active);


--
-- Name: idx_test_entities_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_entities_name ON public.test_entities USING btree (name);


--
-- Name: idx_ticket_attachments_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_attachments_ticket_id ON public.ticket_attachments USING btree (ticket_id);


--
-- Name: idx_ticket_attachments_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_attachments_uploaded_by ON public.ticket_attachments USING btree (uploaded_by);


--
-- Name: idx_ticket_attribute_relations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_attribute_relations_is_active ON public.ticket_attribute_relations USING btree (is_active);


--
-- Name: idx_ticket_attribute_relations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_attribute_relations_name ON public.ticket_attribute_relations USING btree (name);


--
-- Name: idx_ticket_comments_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_comments_author_id ON public.ticket_comments USING btree (author_id);


--
-- Name: idx_ticket_comments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_comments_created_at ON public.ticket_comments USING btree (created_at);


--
-- Name: idx_ticket_comments_is_internal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_comments_is_internal ON public.ticket_comments USING btree (is_internal);


--
-- Name: idx_ticket_comments_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments USING btree (ticket_id);


--
-- Name: idx_ticket_history_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_history_changed_by ON public.ticket_history USING btree (changed_by);


--
-- Name: idx_ticket_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_history_created_at ON public.ticket_history USING btree (created_at);


--
-- Name: idx_ticket_history_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_history_ticket_id ON public.ticket_history USING btree (ticket_id);


--
-- Name: idx_ticket_notifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_notifications_is_active ON public.ticket_notifications USING btree (is_active);


--
-- Name: idx_ticket_notifications_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_notifications_name ON public.ticket_notifications USING btree (name);


--
-- Name: idx_ticket_schedule_logs_executed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedule_logs_executed_at ON public.ticket_schedule_logs USING btree (executed_at);


--
-- Name: idx_ticket_schedule_logs_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedule_logs_schedule_id ON public.ticket_schedule_logs USING btree (schedule_id);


--
-- Name: idx_ticket_schedule_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedule_logs_status ON public.ticket_schedule_logs USING btree (status);


--
-- Name: idx_ticket_schedules_active_next_run; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedules_active_next_run ON public.ticket_schedules USING btree (is_active, next_run_at) WHERE (is_active = true);


--
-- Name: idx_ticket_schedules_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedules_is_active ON public.ticket_schedules USING btree (is_active);


--
-- Name: idx_ticket_schedules_next_run_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedules_next_run_at ON public.ticket_schedules USING btree (next_run_at);


--
-- Name: idx_ticket_schedules_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_schedules_ticket_id ON public.ticket_schedules USING btree (ticket_id);


--
-- Name: idx_ticket_status_history_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_status_history_changed_by ON public.ticket_status_history USING btree (changed_by);


--
-- Name: idx_ticket_status_history_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_status_history_ticket_id ON public.ticket_status_history USING btree (ticket_id);


--
-- Name: idx_ticket_status_history_to_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_status_history_to_status_id ON public.ticket_status_history USING btree (to_status_id);


--
-- Name: idx_tickets_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_category_id ON public.tickets USING btree (category_id);


--
-- Name: idx_tickets_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_company_id ON public.tickets USING btree (company_id);


--
-- Name: idx_tickets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_created_at ON public.tickets USING btree (created_at);


--
-- Name: idx_tickets_created_by_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_created_by_schedule_id ON public.tickets USING btree (created_by_schedule_id);


--
-- Name: idx_tickets_executor_agents; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_executor_agents ON public.tickets USING gin (executor_agent_ids);


--
-- Name: idx_tickets_executor_groups; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_executor_groups ON public.tickets USING gin (executor_group_ids);


--
-- Name: idx_tickets_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_is_active ON public.tickets USING btree (is_active);


--
-- Name: idx_tickets_observer_agent_ids; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_observer_agent_ids ON public.tickets USING gin (observer_agent_ids);


--
-- Name: idx_tickets_observer_group_ids; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_observer_group_ids ON public.tickets USING gin (observer_group_ids);


--
-- Name: idx_tickets_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_owner_id ON public.tickets USING btree (owner_id);


--
-- Name: idx_tickets_pending_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_pending_start ON public.tickets USING btree (pending_start_at);


--
-- Name: idx_tickets_priority_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_priority_id ON public.tickets USING btree (priority_id);


--
-- Name: idx_tickets_queue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_queue_id ON public.tickets USING btree (queue_id);


--
-- Name: idx_tickets_resolution_deadline; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_resolution_deadline ON public.tickets USING btree (resolution_deadline);


--
-- Name: idx_tickets_response_deadline; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_response_deadline ON public.tickets USING btree (response_deadline);


--
-- Name: idx_tickets_sla_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_sla_id ON public.tickets USING btree (sla_id);


--
-- Name: idx_tickets_sla_violated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_sla_violated ON public.tickets USING btree (sla_violated);


--
-- Name: idx_tickets_state_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_state_id ON public.tickets USING btree (state_id);


--
-- Name: idx_tickets_ticket_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_ticket_number ON public.tickets USING btree (ticket_number);


--
-- Name: idx_tickets_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_title ON public.tickets USING btree (title);


--
-- Name: idx_tickets_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_type_id ON public.tickets USING btree (type_id);


--
-- Name: idx_translation_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_translation_is_active ON public.translation USING btree (is_active);


--
-- Name: idx_translation_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_translation_name ON public.translation USING btree (name);


--
-- Name: idx_type_categories_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_type_categories_is_active ON public.type_categories USING btree (is_active);


--
-- Name: idx_type_categories_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_type_categories_name ON public.type_categories USING btree (name);


--
-- Name: idx_type_category_relations_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_type_category_relations_category_id ON public.type_category_relations USING btree (category_id);


--
-- Name: idx_type_category_relations_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_type_category_relations_type_id ON public.type_category_relations USING btree (type_id);


--
-- Name: idx_types_category_ids; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_types_category_ids ON public.types USING gin (category_ids);


--
-- Name: idx_types_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_types_is_active ON public.types USING btree (is_active);


--
-- Name: idx_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_types_name ON public.types USING btree (name);


--
-- Name: idx_types_workflow_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_types_workflow_id ON public.types USING btree (workflow_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_groups_roles_settings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_groups_roles_settings_is_active ON public.users_groups_roles_settings USING btree (is_active);


--
-- Name: idx_users_groups_roles_settings_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_groups_roles_settings_name ON public.users_groups_roles_settings USING btree (name);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_login ON public.users USING btree (login);


--
-- Name: idx_web_services_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_web_services_is_active ON public.web_services USING btree (is_active);


--
-- Name: idx_web_services_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_web_services_name ON public.web_services USING btree (name);


--
-- Name: idx_workflow_transitions_source_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_transitions_source_status ON public.workflow_transitions USING btree (source_status_id);


--
-- Name: idx_workflow_transitions_target_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_transitions_target_status ON public.workflow_transitions USING btree (target_status_id);


--
-- Name: idx_workflow_transitions_workflow_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_transitions_workflow_id ON public.workflow_transitions USING btree (workflow_id);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1 ON public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::public.job_state) AND (policy = 'short'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2 ON public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::public.job_state) AND (policy = 'singleton'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3 ON public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::public.job_state) AND (policy = 'stately'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4 ON public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::public.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5 ON public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::public.job_state);


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i1 ON public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::public.job_state) AND (policy = 'short'::text));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i2 ON public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::public.job_state) AND (policy = 'singleton'::text));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i3 ON public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::public.job_state) AND (policy = 'stately'::text));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i4 ON public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::public.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_i5 ON public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::public.job_state);


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i1 ON public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::public.job_state) AND (policy = 'short'::text));


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i2 ON public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::public.job_state) AND (policy = 'singleton'::text));


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i3 ON public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::public.job_state) AND (policy = 'stately'::text));


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i4 ON public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::public.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_i5 ON public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::public.job_state);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: postgres
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey;


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: postgres
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.job_pkey ATTACH PARTITION public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey;


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.job_pkey ATTACH PARTITION public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c_pkey;


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_pkey; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.job_pkey ATTACH PARTITION public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f_pkey;


--
-- Name: customers_services trigger_customers_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_customers_services_updated_at BEFORE UPDATE ON public.customers_services FOR EACH ROW EXECUTE FUNCTION public.update_customers_services_updated_at();


--
-- Name: services_attachments trigger_services_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_services_attachments_updated_at BEFORE UPDATE ON public.services_attachments FOR EACH ROW EXECUTE FUNCTION public.update_services_attachments_updated_at();


--
-- Name: acl trigger_update_acl_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_acl_updated_at BEFORE UPDATE ON public.acl FOR EACH ROW EXECUTE FUNCTION public.update_acl_updated_at();


--
-- Name: acls trigger_update_acls_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_acls_updated_at BEFORE UPDATE ON public.acls FOR EACH ROW EXECUTE FUNCTION public.update_acls_updated_at();


--
-- Name: admin_notification trigger_update_admin_notification_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_admin_notification_updated_at BEFORE UPDATE ON public.admin_notification FOR EACH ROW EXECUTE FUNCTION public.update_admin_notification_updated_at();


--
-- Name: admin_notifications trigger_update_admin_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_admin_notifications_updated_at BEFORE UPDATE ON public.admin_notifications FOR EACH ROW EXECUTE FUNCTION public.update_admin_notifications_updated_at();


--
-- Name: agents_groups_agents trigger_update_agents_groups_agents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_agents_groups_agents_updated_at BEFORE UPDATE ON public.agents_groups_agents FOR EACH ROW EXECUTE FUNCTION public.update_agents_groups_agents_updated_at();


--
-- Name: agents_groups trigger_update_agents_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_agents_groups_updated_at BEFORE UPDATE ON public.agents_groups FOR EACH ROW EXECUTE FUNCTION public.update_agents_groups_updated_at();


--
-- Name: agents_roles trigger_update_agents_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_agents_roles_updated_at BEFORE UPDATE ON public.agents_roles FOR EACH ROW EXECUTE FUNCTION public.update_agents_roles_updated_at();


--
-- Name: agents trigger_update_agents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_agents_updated_at();


--
-- Name: appointment_notifications trigger_update_appointment_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_appointment_notifications_updated_at BEFORE UPDATE ON public.appointment_notifications FOR EACH ROW EXECUTE FUNCTION public.update_appointment_notifications_updated_at();


--
-- Name: attachments trigger_update_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_attachments_updated_at BEFORE UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.update_attachments_updated_at();


--
-- Name: auto_responses trigger_update_auto_responses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_auto_responses_updated_at BEFORE UPDATE ON public.auto_responses FOR EACH ROW EXECUTE FUNCTION public.update_auto_responses_updated_at();


--
-- Name: calendar_events trigger_update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_calendar_events_updated_at();


--
-- Name: calendars trigger_update_calendars_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_calendars_updated_at BEFORE UPDATE ON public.calendars FOR EACH ROW EXECUTE FUNCTION public.update_calendars_updated_at();


--
-- Name: communication_log trigger_update_communication_log_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_communication_log_updated_at BEFORE UPDATE ON public.communication_log FOR EACH ROW EXECUTE FUNCTION public.update_communication_log_updated_at();


--
-- Name: communication_notifications_settings trigger_update_communication_notifications_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_communication_notifications_settings_updated_at BEFORE UPDATE ON public.communication_notifications_settings FOR EACH ROW EXECUTE FUNCTION public.update_communication_notifications_settings_updated_at();


--
-- Name: customer_users_customers trigger_update_customer_users_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_customer_users_customers_updated_at BEFORE UPDATE ON public.customer_users_customers FOR EACH ROW EXECUTE FUNCTION public.update_customer_users_customers_updated_at();


--
-- Name: customer_users_groups trigger_update_customer_users_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_customer_users_groups_updated_at BEFORE UPDATE ON public.customer_users_groups FOR EACH ROW EXECUTE FUNCTION public.update_customer_users_groups_updated_at();


--
-- Name: customer_users_services trigger_update_customer_users_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_customer_users_services_updated_at BEFORE UPDATE ON public.customer_users_services FOR EACH ROW EXECUTE FUNCTION public.update_customer_users_services_updated_at();


--
-- Name: customer_users trigger_update_customer_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_customer_users_updated_at BEFORE UPDATE ON public.customer_users FOR EACH ROW EXECUTE FUNCTION public.update_customer_users_updated_at();


--
-- Name: customers_groups trigger_update_customers_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_customers_groups_updated_at BEFORE UPDATE ON public.customers_groups FOR EACH ROW EXECUTE FUNCTION public.update_customers_groups_updated_at();


--
-- Name: customers trigger_update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_customers_updated_at();


--
-- Name: dynamic_fields_screens trigger_update_dynamic_fields_screens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_dynamic_fields_screens_updated_at BEFORE UPDATE ON public.dynamic_fields_screens FOR EACH ROW EXECUTE FUNCTION public.update_dynamic_fields_screens_updated_at();


--
-- Name: dynamic_fields trigger_update_dynamic_fields_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_dynamic_fields_updated_at BEFORE UPDATE ON public.dynamic_fields FOR EACH ROW EXECUTE FUNCTION public.update_dynamic_fields_updated_at();


--
-- Name: email_addresses trigger_update_email_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_email_addresses_updated_at BEFORE UPDATE ON public.email_addresses FOR EACH ROW EXECUTE FUNCTION public.update_email_addresses_updated_at();


--
-- Name: general_catalog trigger_update_general_catalog_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_general_catalog_updated_at BEFORE UPDATE ON public.general_catalog FOR EACH ROW EXECUTE FUNCTION public.update_general_catalog_updated_at();


--
-- Name: generic_agent trigger_update_generic_agent_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_generic_agent_updated_at BEFORE UPDATE ON public.generic_agent FOR EACH ROW EXECUTE FUNCTION public.update_generic_agent_updated_at();


--
-- Name: greetings trigger_update_greetings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_greetings_updated_at BEFORE UPDATE ON public.greetings FOR EACH ROW EXECUTE FUNCTION public.update_greetings_updated_at();


--
-- Name: groups trigger_update_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_groups_updated_at();


--
-- Name: oauth2 trigger_update_oauth2_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_oauth2_updated_at BEFORE UPDATE ON public.oauth2 FOR EACH ROW EXECUTE FUNCTION public.update_oauth2_updated_at();


--
-- Name: package_manager trigger_update_package_manager_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_package_manager_updated_at BEFORE UPDATE ON public.package_manager FOR EACH ROW EXECUTE FUNCTION public.update_package_manager_updated_at();


--
-- Name: performance_log trigger_update_performance_log_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_performance_log_updated_at BEFORE UPDATE ON public.performance_log FOR EACH ROW EXECUTE FUNCTION public.update_performance_log_updated_at();


--
-- Name: pgp_keys trigger_update_pgp_keys_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_pgp_keys_updated_at BEFORE UPDATE ON public.pgp_keys FOR EACH ROW EXECUTE FUNCTION public.update_pgp_keys_updated_at();


--
-- Name: post_master_filters trigger_update_post_master_filters_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_post_master_filters_updated_at BEFORE UPDATE ON public.post_master_filters FOR EACH ROW EXECUTE FUNCTION public.update_post_master_filters_updated_at();


--
-- Name: post_master_mail_accounts trigger_update_post_master_mail_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_post_master_mail_accounts_updated_at BEFORE UPDATE ON public.post_master_mail_accounts FOR EACH ROW EXECUTE FUNCTION public.update_post_master_mail_accounts_updated_at();


--
-- Name: priorities trigger_update_priorities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_priorities_updated_at BEFORE UPDATE ON public.priorities FOR EACH ROW EXECUTE FUNCTION public.update_priorities_updated_at();


--
-- Name: process_management trigger_update_process_management_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_process_management_updated_at BEFORE UPDATE ON public.process_management FOR EACH ROW EXECUTE FUNCTION public.update_process_management_updated_at();


--
-- Name: processes_automation_settings trigger_update_processes_automation_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_processes_automation_settings_updated_at BEFORE UPDATE ON public.processes_automation_settings FOR EACH ROW EXECUTE FUNCTION public.update_processes_automation_settings_updated_at();


--
-- Name: queue_auto_response trigger_update_queue_auto_response_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_queue_auto_response_updated_at BEFORE UPDATE ON public.queue_auto_response FOR EACH ROW EXECUTE FUNCTION public.update_queue_auto_response_updated_at();


--
-- Name: queues trigger_update_queues_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_queues_updated_at BEFORE UPDATE ON public.queues FOR EACH ROW EXECUTE FUNCTION public.update_queues_updated_at();


--
-- Name: roles_groups trigger_update_roles_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_roles_groups_updated_at BEFORE UPDATE ON public.roles_groups FOR EACH ROW EXECUTE FUNCTION public.update_roles_groups_updated_at();


--
-- Name: roles trigger_update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_roles_updated_at();


--
-- Name: services trigger_update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_services_updated_at();


--
-- Name: session_management trigger_update_session_management_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_session_management_updated_at BEFORE UPDATE ON public.session_management FOR EACH ROW EXECUTE FUNCTION public.update_session_management_updated_at();


--
-- Name: signatures trigger_update_signatures_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_signatures_updated_at BEFORE UPDATE ON public.signatures FOR EACH ROW EXECUTE FUNCTION public.update_signatures_updated_at();


--
-- Name: sla_services trigger_update_sla_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_sla_services_updated_at BEFORE UPDATE ON public.sla_services FOR EACH ROW EXECUTE FUNCTION public.update_sla_services_updated_at();


--
-- Name: sla trigger_update_sla_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_sla_updated_at BEFORE UPDATE ON public.sla FOR EACH ROW EXECUTE FUNCTION public.update_sla_updated_at();


--
-- Name: smime_certificates trigger_update_smime_certificates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_smime_certificates_updated_at BEFORE UPDATE ON public.smime_certificates FOR EACH ROW EXECUTE FUNCTION public.update_smime_certificates_updated_at();


--
-- Name: sql_box trigger_update_sql_box_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_sql_box_updated_at BEFORE UPDATE ON public.sql_box FOR EACH ROW EXECUTE FUNCTION public.update_sql_box_updated_at();


--
-- Name: states trigger_update_states_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_states_updated_at BEFORE UPDATE ON public.states FOR EACH ROW EXECUTE FUNCTION public.update_states_updated_at();


--
-- Name: support_data_collector trigger_update_support_data_collector_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_support_data_collector_updated_at BEFORE UPDATE ON public.support_data_collector FOR EACH ROW EXECUTE FUNCTION public.update_support_data_collector_updated_at();


--
-- Name: system_configuration trigger_update_system_configuration_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_system_configuration_updated_at BEFORE UPDATE ON public.system_configuration FOR EACH ROW EXECUTE FUNCTION public.update_system_configuration_updated_at();


--
-- Name: system_file_support trigger_update_system_file_support_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_system_file_support_updated_at BEFORE UPDATE ON public.system_file_support FOR EACH ROW EXECUTE FUNCTION public.update_system_file_support_updated_at();


--
-- Name: system_log trigger_update_system_log_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_system_log_updated_at BEFORE UPDATE ON public.system_log FOR EACH ROW EXECUTE FUNCTION public.update_system_log_updated_at();


--
-- Name: system_maintenance trigger_update_system_maintenance_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_system_maintenance_updated_at BEFORE UPDATE ON public.system_maintenance FOR EACH ROW EXECUTE FUNCTION public.update_system_maintenance_updated_at();


--
-- Name: template_attachments trigger_update_template_attachments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_template_attachments_updated_at BEFORE UPDATE ON public.template_attachments FOR EACH ROW EXECUTE FUNCTION public.update_template_attachments_updated_at();


--
-- Name: template_queues trigger_update_template_queues_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_template_queues_updated_at BEFORE UPDATE ON public.template_queues FOR EACH ROW EXECUTE FUNCTION public.update_template_queues_updated_at();


--
-- Name: templates trigger_update_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_templates_updated_at();


--
-- Name: test_entities trigger_update_test_entities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_test_entities_updated_at BEFORE UPDATE ON public.test_entities FOR EACH ROW EXECUTE FUNCTION public.update_test_entities_updated_at();


--
-- Name: ticket_attribute_relations trigger_update_ticket_attribute_relations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_ticket_attribute_relations_updated_at BEFORE UPDATE ON public.ticket_attribute_relations FOR EACH ROW EXECUTE FUNCTION public.update_ticket_attribute_relations_updated_at();


--
-- Name: ticket_notifications trigger_update_ticket_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_ticket_notifications_updated_at BEFORE UPDATE ON public.ticket_notifications FOR EACH ROW EXECUTE FUNCTION public.update_ticket_notifications_updated_at();


--
-- Name: translation trigger_update_translation_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_translation_updated_at BEFORE UPDATE ON public.translation FOR EACH ROW EXECUTE FUNCTION public.update_translation_updated_at();


--
-- Name: type_categories trigger_update_type_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_type_categories_updated_at BEFORE UPDATE ON public.type_categories FOR EACH ROW EXECUTE FUNCTION public.update_type_categories_updated_at();


--
-- Name: types trigger_update_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_types_updated_at BEFORE UPDATE ON public.types FOR EACH ROW EXECUTE FUNCTION public.update_types_updated_at();


--
-- Name: users_groups_roles_settings trigger_update_users_groups_roles_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_users_groups_roles_settings_updated_at BEFORE UPDATE ON public.users_groups_roles_settings FOR EACH ROW EXECUTE FUNCTION public.update_users_groups_roles_settings_updated_at();


--
-- Name: web_services trigger_update_web_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_web_services_updated_at BEFORE UPDATE ON public.web_services FOR EACH ROW EXECUTE FUNCTION public.update_web_services_updated_at();


--
-- Name: role_permissions update_role_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ticket_schedules update_ticket_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ticket_schedules_updated_at BEFORE UPDATE ON public.ticket_schedules FOR EACH ROW EXECUTE FUNCTION public.update_ticket_schedules_timestamp();


--
-- Name: workflow_transitions update_workflow_transitions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_workflow_transitions_updated_at BEFORE UPDATE ON public.workflow_transitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflows update_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: queue queue_dead_letter_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.queue
    ADD CONSTRAINT queue_dead_letter_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name);


--
-- Name: schedule schedule_name_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_name_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE CASCADE;


--
-- Name: subscription subscription_name_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: postgres
--

ALTER TABLE ONLY pgboss.subscription
    ADD CONSTRAINT subscription_name_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE CASCADE;


--
-- Name: agents_groups_agents agents_groups_agents_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_agents
    ADD CONSTRAINT agents_groups_agents_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agents_groups_agents agents_groups_agents_agents_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_agents
    ADD CONSTRAINT agents_groups_agents_agents_group_id_fkey FOREIGN KEY (agents_group_id) REFERENCES public.agents_groups(id) ON DELETE CASCADE;


--
-- Name: agents_groups agents_groups_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups
    ADD CONSTRAINT agents_groups_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: agents_groups_roles agents_groups_roles_agents_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_roles
    ADD CONSTRAINT agents_groups_roles_agents_group_id_fkey FOREIGN KEY (agents_group_id) REFERENCES public.agents_groups(id) ON DELETE CASCADE;


--
-- Name: agents_groups_roles agents_groups_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups_roles
    ADD CONSTRAINT agents_groups_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: agents_queues agents_queues_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_queues
    ADD CONSTRAINT agents_queues_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agents_queues agents_queues_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_queues
    ADD CONSTRAINT agents_queues_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: customer_users customer_users_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT customer_users_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: customer_users customer_users_customers_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT customer_users_customers_group_id_fkey FOREIGN KEY (customers_group_id) REFERENCES public.customers_groups(id) ON DELETE SET NULL;


--
-- Name: customers_groups customers_groups_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_groups
    ADD CONSTRAINT customers_groups_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: customers_services customers_services_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_services
    ADD CONSTRAINT customers_services_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customers_services customers_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_services
    ADD CONSTRAINT customers_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 dlq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES public.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c dlq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES public.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f dlq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES public.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: email_addresses email_addresses_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE SET NULL;


--
-- Name: queues fk_template_close_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT fk_template_close_ticket_id FOREIGN KEY (template_close_ticket_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: queues fk_template_comment_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT fk_template_comment_ticket_id FOREIGN KEY (template_comment_ticket_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: queues fk_template_confirm_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT fk_template_confirm_ticket_id FOREIGN KEY (template_confirm_ticket_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: queues fk_template_open_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT fk_template_open_ticket_id FOREIGN KEY (template_open_ticket_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: queues fk_template_status_change_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT fk_template_status_change_id FOREIGN KEY (template_status_change_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: knowledge_base knowledge_base_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.types(id);


--
-- Name: knowledge_base knowledge_base_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.agents(id);


--
-- Name: knowledge_base knowledge_base_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: post_master_mail_accounts post_master_mail_accounts_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_master_mail_accounts
    ADD CONSTRAINT post_master_mail_accounts_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE SET NULL;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 q_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES public.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c q_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.j5c945284fdfaf41de2c10209ebe65d128ac30b9032b0ff393809697c
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES public.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f q_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jded5cc4b4cb6226baa205ab11b85ee9f40441fa82d852a98b98f9b0f
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES public.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: queue queue_dead_letter_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_dead_letter_fkey FOREIGN KEY (dead_letter) REFERENCES public.queue(name);


--
-- Name: queues queues_agent_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_agent_group_id_fkey FOREIGN KEY (agent_group_id) REFERENCES public.agents_groups(id);


--
-- Name: queues queues_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.type_categories(id) ON DELETE SET NULL;


--
-- Name: queues queues_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.customers(id);


--
-- Name: queues queues_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.customers_groups(id);


--
-- Name: queues queues_post_master_mail_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_post_master_mail_account_id_fkey FOREIGN KEY (post_master_mail_account_id) REFERENCES public.post_master_mail_accounts(id) ON DELETE SET NULL;


--
-- Name: queues queues_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.priorities(id);


--
-- Name: queues queues_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: queues queues_sla_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_sla_id_fkey FOREIGN KEY (sla_id) REFERENCES public.sla(id);


--
-- Name: queues queues_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: queues queues_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON DELETE SET NULL;


--
-- Name: queues queues_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: schedule_execution_logs schedule_execution_logs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_execution_logs
    ADD CONSTRAINT schedule_execution_logs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.ticket_schedules(id) ON DELETE CASCADE;


--
-- Name: schedule_execution_logs schedule_execution_logs_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_execution_logs
    ADD CONSTRAINT schedule_execution_logs_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- Name: schedule schedule_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_name_fkey FOREIGN KEY (name) REFERENCES public.queue(name) ON DELETE CASCADE;


--
-- Name: service_attachments service_attachments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_attachments
    ADD CONSTRAINT service_attachments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: services_attachments services_attachments_attachment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_attachments
    ADD CONSTRAINT services_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES public.attachments(id) ON DELETE CASCADE;


--
-- Name: services_attachments services_attachments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_attachments
    ADD CONSTRAINT services_attachments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: services services_sla_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_sla_id_fkey FOREIGN KEY (sla_id) REFERENCES public.sla(id);


--
-- Name: sla sla_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla
    ADD CONSTRAINT sla_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id);


--
-- Name: sla_services sla_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla_services
    ADD CONSTRAINT sla_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: sla_services sla_services_sla_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sla_services
    ADD CONSTRAINT sla_services_sla_id_fkey FOREIGN KEY (sla_id) REFERENCES public.sla(id) ON DELETE CASCADE;


--
-- Name: state_transitions state_transitions_from_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_transitions
    ADD CONSTRAINT state_transitions_from_state_id_fkey FOREIGN KEY (from_state_id) REFERENCES public.states(id) ON DELETE CASCADE;


--
-- Name: state_transitions state_transitions_to_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_transitions
    ADD CONSTRAINT state_transitions_to_state_id_fkey FOREIGN KEY (to_state_id) REFERENCES public.states(id) ON DELETE CASCADE;


--
-- Name: state_transitions state_transitions_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_transitions
    ADD CONSTRAINT state_transitions_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON DELETE CASCADE;


--
-- Name: states states_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON DELETE SET NULL;


--
-- Name: subscription subscription_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription
    ADD CONSTRAINT subscription_name_fkey FOREIGN KEY (name) REFERENCES public.queue(name) ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: ticket_comments ticket_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_history ticket_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: ticket_history ticket_history_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_schedule_logs ticket_schedule_logs_created_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedule_logs
    ADD CONSTRAINT ticket_schedule_logs_created_ticket_id_fkey FOREIGN KEY (created_ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- Name: ticket_schedule_logs ticket_schedule_logs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedule_logs
    ADD CONSTRAINT ticket_schedule_logs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.ticket_schedules(id) ON DELETE CASCADE;


--
-- Name: ticket_schedules ticket_schedules_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_schedules
    ADD CONSTRAINT ticket_schedules_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_status_history ticket_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: ticket_status_history ticket_status_history_from_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_from_status_id_fkey FOREIGN KEY (from_status_id) REFERENCES public.states(id) ON DELETE SET NULL;


--
-- Name: ticket_status_history ticket_status_history_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_status_history ticket_status_history_to_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_to_status_id_fkey FOREIGN KEY (to_status_id) REFERENCES public.states(id) ON DELETE SET NULL;


--
-- Name: ticket_status_history ticket_status_history_transition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_transition_id_fkey FOREIGN KEY (transition_id) REFERENCES public.workflow_transitions(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.type_categories(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_created_by_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_schedule_id_fkey FOREIGN KEY (created_by_schedule_id) REFERENCES public.ticket_schedules(id);


--
-- Name: tickets tickets_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.customer_users(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.priorities(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: tickets tickets_sla_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_sla_id_fkey FOREIGN KEY (sla_id) REFERENCES public.sla(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON DELETE SET NULL;


--
-- Name: type_category_relations type_category_relations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_category_relations
    ADD CONSTRAINT type_category_relations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.type_categories(id) ON DELETE CASCADE;


--
-- Name: type_category_relations type_category_relations_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_category_relations
    ADD CONSTRAINT type_category_relations_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON DELETE CASCADE;


--
-- Name: types types_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE SET NULL;


--
-- Name: workflow_transitions workflow_transitions_source_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_transitions
    ADD CONSTRAINT workflow_transitions_source_status_id_fkey FOREIGN KEY (source_status_id) REFERENCES public.states(id) ON DELETE CASCADE;


--
-- Name: workflow_transitions workflow_transitions_target_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_transitions
    ADD CONSTRAINT workflow_transitions_target_status_id_fkey FOREIGN KEY (target_status_id) REFERENCES public.states(id) ON DELETE CASCADE;


--
-- Name: workflow_transitions workflow_transitions_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_transitions
    ADD CONSTRAINT workflow_transitions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict SGoxTbHG6DDbWe7gR6ld2n0t8DthBjbc8umDtXXPXrzPof7sdKxS43vz3cBsso5


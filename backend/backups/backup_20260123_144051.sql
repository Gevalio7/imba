--
-- PostgreSQL database dump
--

\restrict sw5XoNBYYYK9G7PhaUi2HrFjohek4ZnKRVPBwWeE4JmOrctR2aTQLdga7ew9ZYy

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

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
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: agents_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents_groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents_groups OWNER TO postgres;

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
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_addresses OWNER TO postgres;

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
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_master_mail_accounts OWNER TO postgres;

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
    template_id integer
);


ALTER TABLE public.queues OWNER TO postgres;

--
-- Name: COLUMN queues.template_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.queues.template_id IS 'ID шаблона, связанного с очередью';


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
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(255)
);


ALTER TABLE public.services OWNER TO postgres;

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
    response_time integer,
    resolution_time integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    color character varying(7)
);


ALTER TABLE public.states OWNER TO postgres;

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
-- Name: types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.types OWNER TO postgres;

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
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: roles_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_groups ALTER COLUMN id SET DEFAULT nextval('public.roles_groups_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


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
-- Name: smime_certificates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smime_certificates ALTER COLUMN id SET DEFAULT nextval('public.smime_certificates_id_seq'::regclass);


--
-- Name: sql_box id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sql_box ALTER COLUMN id SET DEFAULT nextval('public.sql_box_id_seq'::regclass);


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
-- Name: ticket_attribute_relations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attribute_relations ALTER COLUMN id SET DEFAULT nextval('public.ticket_attribute_relations_id_seq'::regclass);


--
-- Name: ticket_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_notifications ALTER COLUMN id SET DEFAULT nextval('public.ticket_notifications_id_seq'::regclass);


--
-- Name: translation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation ALTER COLUMN id SET DEFAULT nextval('public.translation_id_seq'::regclass);


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

COPY public.agents (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agents_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents_groups (id, name, message, is_active, created_at, updated_at) FROM stdin;
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
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, name, file_name, type, comment, is_active, created_at, updated_at) FROM stdin;
6	ФЫВФВЫФ	VSCodeUserSetup-x64-1.108.2.exe	0	ФЫВФЫВФ	f	2026-01-23 12:51:38.058585	2026-01-23 12:55:19.796612
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

COPY public.customer_users (id, name, message, is_active, created_at, updated_at) FROM stdin;
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
\.


--
-- Data for Name: customers_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers_groups (id, name, message, is_active, created_at, updated_at) FROM stdin;
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

COPY public.email_addresses (id, name, message, is_active, created_at, updated_at) FROM stdin;
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

COPY public.post_master_mail_accounts (id, name, message, is_active, created_at, updated_at) FROM stdin;
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
-- Data for Name: queue_auto_response; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_auto_response (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: queues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queues (id, name, description, max_tickets, priority, is_active, created_at, updated_at, template_id) FROM stdin;
1	Очередь первой линии поддержки		0	0	t	2026-01-23 08:51:30.453866	2026-01-23 08:54:02.51997	\N
2	Очередь первой линии поддержки		0	0	t	2026-01-23 10:08:48.325603	2026-01-23 10:08:48.325603	1
3	=-	=-	0	0	t	2026-01-23 10:09:01.421092	2026-01-23 10:09:01.421092	1
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_groups (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, comment, is_active, created_at, updated_at, type) FROM stdin;
3	Разработка ПО	Услуги по разработке программного обеспечения	t	2026-01-23 08:56:51.636751	2026-01-23 08:56:51.636751	\N
4	Системное администрирование	Администрирование серверов и систем	t	2026-01-23 08:56:51.637556	2026-01-23 08:56:51.637556	\N
5	Обучение	Обучение пользователей и специалистов	t	2026-01-23 08:56:51.638109	2026-01-23 08:56:51.638109	\N
6	Аудит безопасности	Проверка и анализ безопасности систем	t	2026-01-23 08:56:51.638776	2026-01-23 08:56:51.638776	\N
7	Оптимизация производительности	Улучшение производительности систем	t	2026-01-23 08:56:51.639508	2026-01-23 08:56:51.639508	\N
8	Резервное копирование	Услуги по резервному копированию данных	t	2026-01-23 08:56:51.640259	2026-01-23 08:56:51.640259	\N
9	Мониторинг	Мониторинг систем и приложений	t	2026-01-23 08:56:51.640981	2026-01-23 08:56:51.640981	\N
10	Интеграция систем	Интеграция различных систем и приложений	t	2026-01-23 08:56:51.641654	2026-01-23 08:56:51.641654	\N
1	Техническая поддержка	Общая техническая поддержка пользователей	t	2026-01-23 08:56:51.633305	2026-01-23 14:38:12.112102	Обучение
2	Консультации	Консультационные услуги	t	2026-01-23 08:56:51.635846	2026-01-23 14:38:27.772288	Демонстрация
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

COPY public.sla (id, name, description, response_time, resolution_time, is_active, created_at, updated_at) FROM stdin;
1	67	876	4	4	f	2026-01-23 10:07:50.79608	2026-01-23 10:07:53.112996
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
-- Data for Name: states; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.states (id, name, comment, is_active, created_at, updated_at, type, color) FROM stdin;
2	Новый	Новое обращение, поступившее в систему	t	2026-01-19 12:52:09.206925	2026-01-19 12:53:17.816125	Новая	#007bff
11	Эскалирован	Обращение передано на более высокий уровень поддержки	t	2026-01-19 12:52:09.241649	2026-01-19 12:55:09.171725	Удалена	#e83e8c
3	Открыт	Обращение принято в работу	f	2026-01-19 12:52:09.212393	2026-01-19 12:56:02.03789	Открыта	#28a745
4	В работе	Обращение находится в процессе обработки	f	2026-01-19 12:52:09.216973	2026-01-19 12:56:02.076953	Ожидает напоминания	#ffc107
5	Ожидание клиента	Ожидание дополнительной информации от клиента	f	2026-01-19 12:52:09.220835	2026-01-19 12:56:02.116864	Ожидает автозакрытия	#17a2b8
6	Ожидание поставщика	Ожидание ответа от внешнего поставщика услуг	f	2026-01-19 12:52:09.224527	2026-01-19 12:56:02.153627	Объединенные	#6f42c1
7	Решен	Проблема решена, ожидание подтверждения от клиента	f	2026-01-19 12:52:09.228559	2026-01-19 12:56:02.192753	Закрыта	#20c997
8	Закрыт	Обращение успешно завершено	f	2026-01-19 12:52:09.232434	2026-01-19 12:56:02.229811	Открыта	#6c757d
9	Отклонен	Обращение отклонено	f	2026-01-19 12:52:09.235479	2026-01-19 12:56:02.266573	Ожидает напоминания	#dc3545
10	На удержании	Обращение временно приостановлено	f	2026-01-19 12:52:09.238478	2026-01-19 12:56:02.31052	Открыта	#fd7e14
13	Отменен	Заявка отменена клиентом	t	2026-01-23 08:57:05.509344	2026-01-23 08:57:05.509344	closed	#fd7e14
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
1	=-	<p>зх</p>	t	2026-01-23 10:08:38.534362	2026-01-23 10:08:38.534362
\.


--
-- Data for Name: test_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_entities (id, name, comment, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_attribute_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_attribute_relations (id, name, source_attribute, target_attribute, relation_type, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_notifications (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: translation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.translation (id, name, message, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.types (id, name, comment, is_active, created_at, updated_at) FROM stdin;
11	уке	уке	f	2026-01-19 12:29:33.702585	2026-01-19 12:29:33.702585
1	Инцидент	Проблема, требующая немедленного решения	f	2026-01-19 12:28:17.404158	2026-01-19 12:33:19.040166
2	Запрос на обслуживание	Стандартный запрос на предоставление информации или услуги	f	2026-01-19 12:28:17.410974	2026-01-19 12:33:19.082416
3	Проблема	Корневая причина инцидентов	f	2026-01-19 12:28:17.415065	2026-01-19 12:33:19.121034
4	Изменение	Запрос на изменение в системе	f	2026-01-19 12:28:17.41824	2026-01-19 12:33:19.154025
5	Задача	Общая задача или поручение	f	2026-01-19 12:28:17.421488	2026-01-19 12:33:19.187875
6	Уведомление	Информационное сообщение	f	2026-01-19 12:28:17.42482	2026-01-19 12:33:19.22014
7	Жалоба	Выражение недовольства качеством обслуживания	f	2026-01-19 12:28:17.428016	2026-01-19 12:33:19.253699
8	Предложение	Предложение по улучшению	f	2026-01-19 12:28:17.432445	2026-01-19 12:33:19.288697
9	Консультация	Запрос на консультацию	f	2026-01-19 12:28:17.437849	2026-01-19 12:33:19.326176
10	Техническая поддержка	Запрос технической помощи	f	2026-01-19 12:28:17.442147	2026-01-19 12:33:19.358634
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, login, password, first_name, last_name, email, is_active, created_at, updated_at) FROM stdin;
1	admin	$2b$10$dae2EXFWUdl53VN/ZKMqK.nyMsh99FmabLvaoU1LbTbpyXdY2I1Ii	Admin	User	admin@demo.com	t	2026-01-18 22:01:34.429222	2026-01-18 22:01:34.429222
\.


--
-- Data for Name: users_groups_roles_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_groups_roles_settings (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: web_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.web_services (id, name, description, endpoint, method, last_tested, is_active, created_at, updated_at) FROM stdin;
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
-- Name: agents_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_groups_id_seq', 1, false);


--
-- Name: agents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.attachments_id_seq', 7, true);


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

SELECT pg_catalog.setval('public.customer_users_id_seq', 1, false);


--
-- Name: customer_users_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_users_services_id_seq', 1, false);


--
-- Name: customers_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_groups_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.email_addresses_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.post_master_mail_accounts_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.queues_id_seq', 3, true);


--
-- Name: roles_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_groups_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 10, true);


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

SELECT pg_catalog.setval('public.sla_id_seq', 1, true);


--
-- Name: smime_certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smime_certificates_id_seq', 1, false);


--
-- Name: sql_box_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sql_box_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.system_configuration_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.template_attachments_id_seq', 1, false);


--
-- Name: template_queues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.template_queues_id_seq', 1, false);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.templates_id_seq', 1, true);


--
-- Name: test_entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_entities_id_seq', 1, false);


--
-- Name: ticket_attribute_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_attribute_relations_id_seq', 1, false);


--
-- Name: ticket_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_notifications_id_seq', 1, false);


--
-- Name: translation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.translation_id_seq', 1, false);


--
-- Name: types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.types_id_seq', 11, true);


--
-- Name: users_groups_roles_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_groups_roles_settings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: web_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.web_services_id_seq', 1, false);


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
-- Name: agents_groups agents_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents_groups
    ADD CONSTRAINT agents_groups_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


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
-- Name: customer_users_groups customer_users_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_users_groups
    ADD CONSTRAINT customer_users_groups_pkey PRIMARY KEY (id);


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
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


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
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


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
-- Name: ticket_attribute_relations ticket_attribute_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attribute_relations
    ADD CONSTRAINT ticket_attribute_relations_pkey PRIMARY KEY (id);


--
-- Name: ticket_notifications ticket_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_notifications
    ADD CONSTRAINT ticket_notifications_pkey PRIMARY KEY (id);


--
-- Name: translation translation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation
    ADD CONSTRAINT translation_pkey PRIMARY KEY (id);


--
-- Name: types types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_pkey PRIMARY KEY (id);


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
-- Name: web_services web_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.web_services
    ADD CONSTRAINT web_services_pkey PRIMARY KEY (id);


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
-- Name: idx_agents_groups_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_is_active ON public.agents_groups USING btree (is_active);


--
-- Name: idx_agents_groups_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_groups_name ON public.agents_groups USING btree (name);


--
-- Name: idx_agents_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_is_active ON public.agents USING btree (is_active);


--
-- Name: idx_agents_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_name ON public.agents USING btree (name);


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
-- Name: idx_customer_users_customers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_customers_is_active ON public.customer_users_customers USING btree (is_active);


--
-- Name: idx_customer_users_customers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_customers_name ON public.customer_users_customers USING btree (name);


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
-- Name: idx_customer_users_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_name ON public.customer_users USING btree (name);


--
-- Name: idx_customer_users_services_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_services_is_active ON public.customer_users_services USING btree (is_active);


--
-- Name: idx_customer_users_services_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_users_services_name ON public.customer_users_services USING btree (name);


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
-- Name: idx_queues_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_is_active ON public.queues USING btree (is_active);


--
-- Name: idx_queues_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_name ON public.queues USING btree (name);


--
-- Name: idx_queues_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_queues_template_id ON public.queues USING btree (template_id);


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
-- Name: idx_ticket_attribute_relations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_attribute_relations_is_active ON public.ticket_attribute_relations USING btree (is_active);


--
-- Name: idx_ticket_attribute_relations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_attribute_relations_name ON public.ticket_attribute_relations USING btree (name);


--
-- Name: idx_ticket_notifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_notifications_is_active ON public.ticket_notifications USING btree (is_active);


--
-- Name: idx_ticket_notifications_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_notifications_name ON public.ticket_notifications USING btree (name);


--
-- Name: idx_translation_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_translation_is_active ON public.translation USING btree (is_active);


--
-- Name: idx_translation_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_translation_name ON public.translation USING btree (name);


--
-- Name: idx_types_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_types_is_active ON public.types USING btree (is_active);


--
-- Name: idx_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_types_name ON public.types USING btree (name);


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
-- Name: calendar_events calendar_events_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: queues queues_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict sw5XoNBYYYK9G7PhaUi2HrFjohek4ZnKRVPBwWeE4JmOrctR2aTQLdga7ew9ZYy


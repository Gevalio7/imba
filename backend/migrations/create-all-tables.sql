-- ============================================
-- Скрипт создания всех таблиц
-- Сгенерирован автоматически: 2026-01-18T17:01:21.860Z
-- Всего таблиц: 61
-- ============================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица: acl (Acl)
CREATE TABLE IF NOT EXISTS acl (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  permissions TEXT[] ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_acl_name ON acl(name);
CREATE INDEX IF NOT EXISTS idx_acl_is_active ON acl(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_acl_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_acl_updated_at ON acl;
CREATE TRIGGER trigger_update_acl_updated_at
  BEFORE UPDATE ON acl
  FOR EACH ROW
  EXECUTE FUNCTION update_acl_updated_at();


-- Таблица: acls (Acls)
CREATE TABLE IF NOT EXISTS acls (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_acls_name ON acls(name);
CREATE INDEX IF NOT EXISTS idx_acls_is_active ON acls(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_acls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_acls_updated_at ON acls;
CREATE TRIGGER trigger_update_acls_updated_at
  BEFORE UPDATE ON acls
  FOR EACH ROW
  EXECUTE FUNCTION update_acls_updated_at();


-- Таблица: admin_notification (AdminNotification)
CREATE TABLE IF NOT EXISTS admin_notification (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notification_name ON admin_notification(name);
CREATE INDEX IF NOT EXISTS idx_admin_notification_is_active ON admin_notification(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_admin_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_notification_updated_at ON admin_notification;
CREATE TRIGGER trigger_update_admin_notification_updated_at
  BEFORE UPDATE ON admin_notification
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_notification_updated_at();


-- Таблица: admin_notifications (AdminNotifications)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_name ON admin_notifications(name);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_active ON admin_notifications(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_notifications_updated_at ON admin_notifications;
CREATE TRIGGER trigger_update_admin_notifications_updated_at
  BEFORE UPDATE ON admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_notifications_updated_at();


-- Таблица: agents (Agents)
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agents_updated_at ON agents;
CREATE TRIGGER trigger_update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_updated_at();


-- Таблица: agents_groups (AgentsGroups)
CREATE TABLE IF NOT EXISTS agents_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_groups_name ON agents_groups(name);
CREATE INDEX IF NOT EXISTS idx_agents_groups_is_active ON agents_groups(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_agents_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agents_groups_updated_at ON agents_groups;
CREATE TRIGGER trigger_update_agents_groups_updated_at
  BEFORE UPDATE ON agents_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_groups_updated_at();


-- Таблица: agents_roles (AgentsRoles)
CREATE TABLE IF NOT EXISTS agents_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_roles_name ON agents_roles(name);
CREATE INDEX IF NOT EXISTS idx_agents_roles_is_active ON agents_roles(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_agents_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agents_roles_updated_at ON agents_roles;
CREATE TRIGGER trigger_update_agents_roles_updated_at
  BEFORE UPDATE ON agents_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_roles_updated_at();


-- Таблица: appointment_notifications (AppointmentNotifications)
CREATE TABLE IF NOT EXISTS appointment_notifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointment_notifications_name ON appointment_notifications(name);
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_is_active ON appointment_notifications(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_appointment_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointment_notifications_updated_at ON appointment_notifications;
CREATE TRIGGER trigger_update_appointment_notifications_updated_at
  BEFORE UPDATE ON appointment_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_notifications_updated_at();


-- Таблица: attachments (Attachments)
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) ,
  type INTEGER ,
  comment TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_name ON attachments(name);
CREATE INDEX IF NOT EXISTS idx_attachments_is_active ON attachments(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attachments_updated_at ON attachments;
CREATE TRIGGER trigger_update_attachments_updated_at
  BEFORE UPDATE ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_attachments_updated_at();


-- Таблица: auto_responses (AutoResponses)
CREATE TABLE IF NOT EXISTS auto_responses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trigger VARCHAR(255) ,
  response TEXT ,
  delay INTEGER ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_responses_name ON auto_responses(name);
CREATE INDEX IF NOT EXISTS idx_auto_responses_is_active ON auto_responses(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_auto_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_auto_responses_updated_at ON auto_responses;
CREATE TRIGGER trigger_update_auto_responses_updated_at
  BEFORE UPDATE ON auto_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_responses_updated_at();


-- Таблица: calendars (Calendars)
CREATE TABLE IF NOT EXISTS calendars (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  timezone VARCHAR(255) ,
  work_hours VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendars_name ON calendars(name);
CREATE INDEX IF NOT EXISTS idx_calendars_is_active ON calendars(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_calendars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_calendars_updated_at ON calendars;
CREATE TRIGGER trigger_update_calendars_updated_at
  BEFORE UPDATE ON calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_calendars_updated_at();


-- Таблица: communication_log (CommunicationLog)
CREATE TABLE IF NOT EXISTS communication_log (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communication_log_name ON communication_log(name);
CREATE INDEX IF NOT EXISTS idx_communication_log_is_active ON communication_log(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_communication_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_communication_log_updated_at ON communication_log;
CREATE TRIGGER trigger_update_communication_log_updated_at
  BEFORE UPDATE ON communication_log
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_log_updated_at();


-- Таблица: communication_notifications_settings (CommunicationNotificationsSettings)
CREATE TABLE IF NOT EXISTS communication_notifications_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communication_notifications_settings_name ON communication_notifications_settings(name);
CREATE INDEX IF NOT EXISTS idx_communication_notifications_settings_is_active ON communication_notifications_settings(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_communication_notifications_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_communication_notifications_settings_updated_at ON communication_notifications_settings;
CREATE TRIGGER trigger_update_communication_notifications_settings_updated_at
  BEFORE UPDATE ON communication_notifications_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_notifications_settings_updated_at();


-- Таблица: customer_users (CustomerUsers)
CREATE TABLE IF NOT EXISTS customer_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_users_name ON customer_users(name);
CREATE INDEX IF NOT EXISTS idx_customer_users_is_active ON customer_users(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customer_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_users_updated_at ON customer_users;
CREATE TRIGGER trigger_update_customer_users_updated_at
  BEFORE UPDATE ON customer_users
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_users_updated_at();


-- Таблица: customer_users_customers (CustomerUsersCustomers)
CREATE TABLE IF NOT EXISTS customer_users_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_users_customers_name ON customer_users_customers(name);
CREATE INDEX IF NOT EXISTS idx_customer_users_customers_is_active ON customer_users_customers(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customer_users_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_users_customers_updated_at ON customer_users_customers;
CREATE TRIGGER trigger_update_customer_users_customers_updated_at
  BEFORE UPDATE ON customer_users_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_users_customers_updated_at();


-- Таблица: customer_users_groups (CustomerUsersGroups)
CREATE TABLE IF NOT EXISTS customer_users_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_users_groups_name ON customer_users_groups(name);
CREATE INDEX IF NOT EXISTS idx_customer_users_groups_is_active ON customer_users_groups(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customer_users_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_users_groups_updated_at ON customer_users_groups;
CREATE TRIGGER trigger_update_customer_users_groups_updated_at
  BEFORE UPDATE ON customer_users_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_users_groups_updated_at();


-- Таблица: customer_users_services (CustomerUsersServices)
CREATE TABLE IF NOT EXISTS customer_users_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_users_services_name ON customer_users_services(name);
CREATE INDEX IF NOT EXISTS idx_customer_users_services_is_active ON customer_users_services(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customer_users_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_users_services_updated_at ON customer_users_services;
CREATE TRIGGER trigger_update_customer_users_services_updated_at
  BEFORE UPDATE ON customer_users_services
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_users_services_updated_at();


-- Таблица: customers (Customers)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  street VARCHAR(255) ,
  zip VARCHAR(20) ,
  city VARCHAR(255) ,
  comment TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customers_updated_at ON customers;
CREATE TRIGGER trigger_update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();


-- Таблица: customers_groups (CustomersGroups)
CREATE TABLE IF NOT EXISTS customers_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_groups_name ON customers_groups(name);
CREATE INDEX IF NOT EXISTS idx_customers_groups_is_active ON customers_groups(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customers_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customers_groups_updated_at ON customers_groups;
CREATE TRIGGER trigger_update_customers_groups_updated_at
  BEFORE UPDATE ON customers_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_groups_updated_at();


-- Таблица: dynamic_fields (DynamicFields)
CREATE TABLE IF NOT EXISTS dynamic_fields (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) ,
  field_type VARCHAR(255) ,
  default_value VARCHAR(255) ,
  is_required BOOLEAN  DEFAULT false,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dynamic_fields_name ON dynamic_fields(name);
CREATE INDEX IF NOT EXISTS idx_dynamic_fields_is_active ON dynamic_fields(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_dynamic_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dynamic_fields_updated_at ON dynamic_fields;
CREATE TRIGGER trigger_update_dynamic_fields_updated_at
  BEFORE UPDATE ON dynamic_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_dynamic_fields_updated_at();


-- Таблица: dynamic_fields_screens (DynamicFieldsScreens)
CREATE TABLE IF NOT EXISTS dynamic_fields_screens (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  screen_name VARCHAR(255) ,
  field_name VARCHAR(255) ,
  field_type VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  is_required BOOLEAN  DEFAULT false,
  position INTEGER ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dynamic_fields_screens_name ON dynamic_fields_screens(name);
CREATE INDEX IF NOT EXISTS idx_dynamic_fields_screens_is_active ON dynamic_fields_screens(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_dynamic_fields_screens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dynamic_fields_screens_updated_at ON dynamic_fields_screens;
CREATE TRIGGER trigger_update_dynamic_fields_screens_updated_at
  BEFORE UPDATE ON dynamic_fields_screens
  FOR EACH ROW
  EXECUTE FUNCTION update_dynamic_fields_screens_updated_at();


-- Таблица: email_addresses (EmailAddresses)
CREATE TABLE IF NOT EXISTS email_addresses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_addresses_name ON email_addresses(name);
CREATE INDEX IF NOT EXISTS idx_email_addresses_is_active ON email_addresses(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_email_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_addresses_updated_at ON email_addresses;
CREATE TRIGGER trigger_update_email_addresses_updated_at
  BEFORE UPDATE ON email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_email_addresses_updated_at();


-- Таблица: general_catalog (GeneralCatalog)
CREATE TABLE IF NOT EXISTS general_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_general_catalog_name ON general_catalog(name);
CREATE INDEX IF NOT EXISTS idx_general_catalog_is_active ON general_catalog(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_general_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_general_catalog_updated_at ON general_catalog;
CREATE TRIGGER trigger_update_general_catalog_updated_at
  BEFORE UPDATE ON general_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_general_catalog_updated_at();


-- Таблица: generic_agent (GenericAgent)
CREATE TABLE IF NOT EXISTS generic_agent (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  trigger_type VARCHAR(255) ,
  schedule VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  last_run VARCHAR(255) ,
  next_run VARCHAR(255) ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generic_agent_name ON generic_agent(name);
CREATE INDEX IF NOT EXISTS idx_generic_agent_is_active ON generic_agent(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_generic_agent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_generic_agent_updated_at ON generic_agent;
CREATE TRIGGER trigger_update_generic_agent_updated_at
  BEFORE UPDATE ON generic_agent
  FOR EACH ROW
  EXECUTE FUNCTION update_generic_agent_updated_at();


-- Таблица: greetings (Greetings)
CREATE TABLE IF NOT EXISTS greetings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  comment TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_greetings_name ON greetings(name);
CREATE INDEX IF NOT EXISTS idx_greetings_is_active ON greetings(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_greetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_greetings_updated_at ON greetings;
CREATE TRIGGER trigger_update_greetings_updated_at
  BEFORE UPDATE ON greetings
  FOR EACH ROW
  EXECUTE FUNCTION update_greetings_updated_at();


-- Таблица: groups (Groups)
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_groups_updated_at ON groups;
CREATE TRIGGER trigger_update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_groups_updated_at();


-- Таблица: oauth2 (Oauth2)
CREATE TABLE IF NOT EXISTS oauth2 (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) ,
  client_secret VARCHAR(255) ,
  authorization_url VARCHAR(255) ,
  token_url VARCHAR(255) ,
  scopes TEXT[] ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth2_name ON oauth2(name);
CREATE INDEX IF NOT EXISTS idx_oauth2_is_active ON oauth2(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_oauth2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_oauth2_updated_at ON oauth2;
CREATE TRIGGER trigger_update_oauth2_updated_at
  BEFORE UPDATE ON oauth2
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth2_updated_at();


-- Таблица: package_manager (PackageManager)
CREATE TABLE IF NOT EXISTS package_manager (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  version VARCHAR(255) ,
  author VARCHAR(255) ,
  is_installed BOOLEAN  DEFAULT false,
  is_upgradable BOOLEAN  DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_package_manager_name ON package_manager(name);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_package_manager_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_package_manager_updated_at ON package_manager;
CREATE TRIGGER trigger_update_package_manager_updated_at
  BEFORE UPDATE ON package_manager
  FOR EACH ROW
  EXECUTE FUNCTION update_package_manager_updated_at();


-- Таблица: performance_log (PerformanceLog)
CREATE TABLE IF NOT EXISTS performance_log (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_log_name ON performance_log(name);
CREATE INDEX IF NOT EXISTS idx_performance_log_is_active ON performance_log(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_performance_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_performance_log_updated_at ON performance_log;
CREATE TRIGGER trigger_update_performance_log_updated_at
  BEFORE UPDATE ON performance_log
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_log_updated_at();


-- Таблица: pgp_keys (PgpKeys)
CREATE TABLE IF NOT EXISTS pgp_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pgp_keys_name ON pgp_keys(name);
CREATE INDEX IF NOT EXISTS idx_pgp_keys_is_active ON pgp_keys(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_pgp_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pgp_keys_updated_at ON pgp_keys;
CREATE TRIGGER trigger_update_pgp_keys_updated_at
  BEFORE UPDATE ON pgp_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_pgp_keys_updated_at();


-- Таблица: post_master_filters (PostMasterFilters)
CREATE TABLE IF NOT EXISTS post_master_filters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_master_filters_name ON post_master_filters(name);
CREATE INDEX IF NOT EXISTS idx_post_master_filters_is_active ON post_master_filters(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_post_master_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_master_filters_updated_at ON post_master_filters;
CREATE TRIGGER trigger_update_post_master_filters_updated_at
  BEFORE UPDATE ON post_master_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_post_master_filters_updated_at();


-- Таблица: post_master_mail_accounts (PostMasterMailAccounts)
CREATE TABLE IF NOT EXISTS post_master_mail_accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_name ON post_master_mail_accounts(name);
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_is_active ON post_master_mail_accounts(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_post_master_mail_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_master_mail_accounts_updated_at ON post_master_mail_accounts;
CREATE TRIGGER trigger_update_post_master_mail_accounts_updated_at
  BEFORE UPDATE ON post_master_mail_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_master_mail_accounts_updated_at();


-- Таблица: priorities (Priorities)
CREATE TABLE IF NOT EXISTS priorities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_priorities_name ON priorities(name);
CREATE INDEX IF NOT EXISTS idx_priorities_is_active ON priorities(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_priorities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_priorities_updated_at ON priorities;
CREATE TRIGGER trigger_update_priorities_updated_at
  BEFORE UPDATE ON priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_priorities_updated_at();


-- Таблица: process_management (ProcessManagement)
CREATE TABLE IF NOT EXISTS process_management (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  process_type VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  last_executed VARCHAR(255) ,
  next_execution VARCHAR(255) ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_process_management_name ON process_management(name);
CREATE INDEX IF NOT EXISTS idx_process_management_is_active ON process_management(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_process_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_process_management_updated_at ON process_management;
CREATE TRIGGER trigger_update_process_management_updated_at
  BEFORE UPDATE ON process_management
  FOR EACH ROW
  EXECUTE FUNCTION update_process_management_updated_at();


-- Таблица: processes_automation_settings (ProcessesAutomationSettings)
CREATE TABLE IF NOT EXISTS processes_automation_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processes_automation_settings_name ON processes_automation_settings(name);
CREATE INDEX IF NOT EXISTS idx_processes_automation_settings_is_active ON processes_automation_settings(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_processes_automation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_processes_automation_settings_updated_at ON processes_automation_settings;
CREATE TRIGGER trigger_update_processes_automation_settings_updated_at
  BEFORE UPDATE ON processes_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_processes_automation_settings_updated_at();


-- Таблица: queue_auto_response (QueueAutoResponse)
CREATE TABLE IF NOT EXISTS queue_auto_response (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queue_auto_response_name ON queue_auto_response(name);
CREATE INDEX IF NOT EXISTS idx_queue_auto_response_is_active ON queue_auto_response(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_queue_auto_response_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_queue_auto_response_updated_at ON queue_auto_response;
CREATE TRIGGER trigger_update_queue_auto_response_updated_at
  BEFORE UPDATE ON queue_auto_response
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_auto_response_updated_at();


-- Таблица: queues (Queues)
CREATE TABLE IF NOT EXISTS queues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  max_tickets INTEGER ,
  priority INTEGER ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queues_name ON queues(name);
CREATE INDEX IF NOT EXISTS idx_queues_is_active ON queues(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_queues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_queues_updated_at ON queues;
CREATE TRIGGER trigger_update_queues_updated_at
  BEFORE UPDATE ON queues
  FOR EACH ROW
  EXECUTE FUNCTION update_queues_updated_at();


-- Таблица: roles (Roles)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_roles_updated_at ON roles;
CREATE TRIGGER trigger_update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();


-- Таблица: roles_groups (RolesGroups)
CREATE TABLE IF NOT EXISTS roles_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_groups_name ON roles_groups(name);
CREATE INDEX IF NOT EXISTS idx_roles_groups_is_active ON roles_groups(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_roles_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_roles_groups_updated_at ON roles_groups;
CREATE TRIGGER trigger_update_roles_groups_updated_at
  BEFORE UPDATE ON roles_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_groups_updated_at();


-- Таблица: services (Services)
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  comment TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON services;
CREATE TRIGGER trigger_update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();


-- Таблица: session_management (SessionManagement)
CREATE TABLE IF NOT EXISTS session_management (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  ip_address VARCHAR(255) ,
  user_agent VARCHAR(255) ,
  login_time VARCHAR(255) ,
  last_activity VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_management_is_active ON session_management(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_session_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_management_updated_at ON session_management;
CREATE TRIGGER trigger_update_session_management_updated_at
  BEFORE UPDATE ON session_management
  FOR EACH ROW
  EXECUTE FUNCTION update_session_management_updated_at();


-- Таблица: signatures (Signatures)
CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signatures_name ON signatures(name);
CREATE INDEX IF NOT EXISTS idx_signatures_is_active ON signatures(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_signatures_updated_at ON signatures;
CREATE TRIGGER trigger_update_signatures_updated_at
  BEFORE UPDATE ON signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_signatures_updated_at();


-- Таблица: sla (Sla)
CREATE TABLE IF NOT EXISTS sla (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  response_time INTEGER ,
  resolution_time INTEGER ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sla_name ON sla(name);
CREATE INDEX IF NOT EXISTS idx_sla_is_active ON sla(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_sla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sla_updated_at ON sla;
CREATE TRIGGER trigger_update_sla_updated_at
  BEFORE UPDATE ON sla
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();


-- Таблица: smime_certificates (SmimeCertificates)
CREATE TABLE IF NOT EXISTS smime_certificates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smime_certificates_name ON smime_certificates(name);
CREATE INDEX IF NOT EXISTS idx_smime_certificates_is_active ON smime_certificates(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_smime_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_smime_certificates_updated_at ON smime_certificates;
CREATE TRIGGER trigger_update_smime_certificates_updated_at
  BEFORE UPDATE ON smime_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_smime_certificates_updated_at();


-- Таблица: sql_box (SqlBox)
CREATE TABLE IF NOT EXISTS sql_box (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sql_box_name ON sql_box(name);
CREATE INDEX IF NOT EXISTS idx_sql_box_is_active ON sql_box(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_sql_box_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sql_box_updated_at ON sql_box;
CREATE TRIGGER trigger_update_sql_box_updated_at
  BEFORE UPDATE ON sql_box
  FOR EACH ROW
  EXECUTE FUNCTION update_sql_box_updated_at();


-- Таблица: states (States)
CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  comment TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);
CREATE INDEX IF NOT EXISTS idx_states_is_active ON states(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_states_updated_at ON states;
CREATE TRIGGER trigger_update_states_updated_at
  BEFORE UPDATE ON states
  FOR EACH ROW
  EXECUTE FUNCTION update_states_updated_at();


-- Таблица: support_data_collector (SupportDataCollector)
CREATE TABLE IF NOT EXISTS support_data_collector (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_data_collector_name ON support_data_collector(name);
CREATE INDEX IF NOT EXISTS idx_support_data_collector_is_active ON support_data_collector(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_support_data_collector_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_support_data_collector_updated_at ON support_data_collector;
CREATE TRIGGER trigger_update_support_data_collector_updated_at
  BEFORE UPDATE ON support_data_collector
  FOR EACH ROW
  EXECUTE FUNCTION update_support_data_collector_updated_at();


-- Таблица: system_configuration (SystemConfiguration)
CREATE TABLE IF NOT EXISTS system_configuration (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  value VARCHAR(255) ,
  config_type VARCHAR(255) ,
  is_editable BOOLEAN  DEFAULT false,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_configuration_name ON system_configuration(name);
CREATE INDEX IF NOT EXISTS idx_system_configuration_is_active ON system_configuration(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_system_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_configuration_updated_at ON system_configuration;
CREATE TRIGGER trigger_update_system_configuration_updated_at
  BEFORE UPDATE ON system_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_system_configuration_updated_at();


-- Таблица: system_file_support (SystemFileSupport)
CREATE TABLE IF NOT EXISTS system_file_support (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_file_support_name ON system_file_support(name);
CREATE INDEX IF NOT EXISTS idx_system_file_support_is_active ON system_file_support(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_system_file_support_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_file_support_updated_at ON system_file_support;
CREATE TRIGGER trigger_update_system_file_support_updated_at
  BEFORE UPDATE ON system_file_support
  FOR EACH ROW
  EXECUTE FUNCTION update_system_file_support_updated_at();


-- Таблица: system_log (SystemLog)
CREATE TABLE IF NOT EXISTS system_log (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_log_name ON system_log(name);
CREATE INDEX IF NOT EXISTS idx_system_log_is_active ON system_log(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_system_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_log_updated_at ON system_log;
CREATE TRIGGER trigger_update_system_log_updated_at
  BEFORE UPDATE ON system_log
  FOR EACH ROW
  EXECUTE FUNCTION update_system_log_updated_at();


-- Таблица: system_maintenance (SystemMaintenance)
CREATE TABLE IF NOT EXISTS system_maintenance (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  start_time VARCHAR(255) ,
  end_time VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  is_scheduled BOOLEAN  DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_maintenance_name ON system_maintenance(name);
CREATE INDEX IF NOT EXISTS idx_system_maintenance_is_active ON system_maintenance(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_system_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_maintenance_updated_at ON system_maintenance;
CREATE TRIGGER trigger_update_system_maintenance_updated_at
  BEFORE UPDATE ON system_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_system_maintenance_updated_at();


-- Таблица: template_attachments (TemplateAttachments)
CREATE TABLE IF NOT EXISTS template_attachments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_template_attachments_name ON template_attachments(name);
CREATE INDEX IF NOT EXISTS idx_template_attachments_is_active ON template_attachments(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_template_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_attachments_updated_at ON template_attachments;
CREATE TRIGGER trigger_update_template_attachments_updated_at
  BEFORE UPDATE ON template_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_template_attachments_updated_at();


-- Таблица: template_queues (TemplateQueues)
CREATE TABLE IF NOT EXISTS template_queues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_template_queues_name ON template_queues(name);
CREATE INDEX IF NOT EXISTS idx_template_queues_is_active ON template_queues(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_template_queues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_queues_updated_at ON template_queues;
CREATE TRIGGER trigger_update_template_queues_updated_at
  BEFORE UPDATE ON template_queues
  FOR EACH ROW
  EXECUTE FUNCTION update_template_queues_updated_at();


-- Таблица: templates (Templates)
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_templates_updated_at ON templates;
CREATE TRIGGER trigger_update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();


-- Таблица: test_entities (TestEntities)
CREATE TABLE IF NOT EXISTS test_entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  comment TEXT ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_entities_name ON test_entities(name);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_test_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_test_entities_updated_at ON test_entities;
CREATE TRIGGER trigger_update_test_entities_updated_at
  BEFORE UPDATE ON test_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_test_entities_updated_at();


-- Таблица: ticket_attribute_relations (TicketAttributeRelations)
CREATE TABLE IF NOT EXISTS ticket_attribute_relations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source_attribute VARCHAR(255) ,
  target_attribute VARCHAR(255) ,
  relation_type VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_attribute_relations_name ON ticket_attribute_relations(name);
CREATE INDEX IF NOT EXISTS idx_ticket_attribute_relations_is_active ON ticket_attribute_relations(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_ticket_attribute_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_attribute_relations_updated_at ON ticket_attribute_relations;
CREATE TRIGGER trigger_update_ticket_attribute_relations_updated_at
  BEFORE UPDATE ON ticket_attribute_relations
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_attribute_relations_updated_at();


-- Таблица: ticket_notifications (TicketNotifications)
CREATE TABLE IF NOT EXISTS ticket_notifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_name ON ticket_notifications(name);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_is_active ON ticket_notifications(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_ticket_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_notifications_updated_at ON ticket_notifications;
CREATE TRIGGER trigger_update_ticket_notifications_updated_at
  BEFORE UPDATE ON ticket_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_notifications_updated_at();


-- Таблица: translation (Translation)
CREATE TABLE IF NOT EXISTS translation (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translation_name ON translation(name);
CREATE INDEX IF NOT EXISTS idx_translation_is_active ON translation(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_translation_updated_at ON translation;
CREATE TRIGGER trigger_update_translation_updated_at
  BEFORE UPDATE ON translation
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_updated_at();


-- Таблица: types (Types)
CREATE TABLE IF NOT EXISTS types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  comment TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_types_name ON types(name);
CREATE INDEX IF NOT EXISTS idx_types_is_active ON types(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_types_updated_at ON types;
CREATE TRIGGER trigger_update_types_updated_at
  BEFORE UPDATE ON types
  FOR EACH ROW
  EXECUTE FUNCTION update_types_updated_at();


-- Таблица: users_groups_roles_settings (UsersGroupsRolesSettings)
CREATE TABLE IF NOT EXISTS users_groups_roles_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  is_active BOOLEAN  DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_groups_roles_settings_name ON users_groups_roles_settings(name);
CREATE INDEX IF NOT EXISTS idx_users_groups_roles_settings_is_active ON users_groups_roles_settings(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_users_groups_roles_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_groups_roles_settings_updated_at ON users_groups_roles_settings;
CREATE TRIGGER trigger_update_users_groups_roles_settings_updated_at
  BEFORE UPDATE ON users_groups_roles_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_users_groups_roles_settings_updated_at();


-- Таблица: web_services (WebServices)
CREATE TABLE IF NOT EXISTS web_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT ,
  endpoint VARCHAR(255) ,
  method VARCHAR(255) ,
  is_active BOOLEAN  DEFAULT true,
  last_tested VARCHAR(255) ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_web_services_name ON web_services(name);
CREATE INDEX IF NOT EXISTS idx_web_services_is_active ON web_services(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_web_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_web_services_updated_at ON web_services;
CREATE TRIGGER trigger_update_web_services_updated_at
  BEFORE UPDATE ON web_services
  FOR EACH ROW
  EXECUTE FUNCTION update_web_services_updated_at();



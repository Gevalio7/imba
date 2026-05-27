-- =====================================================
-- ЕДИНЫЙ КОРРЕКТНЫЙ СКРИПТ СОЗДАНИЯ СХЕМЫ БД
-- Проект: DreamDesc / OTRS-like система
-- Создано на основе анализа моделей, миграций и кода
-- Дата: 2026-05-21
-- =====================================================

-- Отключаем проверку FK на время пересоздания
SET session_replication_role = 'replica';

-- =====================================================
-- 1. УДАЛЕНИЕ ВСЕХ СУЩЕСТВУЮЩИХ ТАБЛИЦ (в любом порядке с CASCADE)
-- =====================================================

DROP TABLE IF EXISTS ticket_schedule_logs CASCADE;
DROP TABLE IF EXISTS ticket_schedules CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_status_history CASCADE;
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TABLE IF EXISTS ticket_attribute_relations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

DROP TABLE IF EXISTS post_master_filters CASCADE;
DROP TABLE IF EXISTS post_master_mail_accounts CASCADE;
DROP TABLE IF EXISTS mail_fetch_logs CASCADE;

DROP TABLE IF EXISTS queue_auto_response CASCADE;
DROP TABLE IF EXISTS queues CASCADE;

DROP TABLE IF EXISTS agents_groups_agents CASCADE;
DROP TABLE IF EXISTS agents_groups_roles CASCADE;
DROP TABLE IF EXISTS agents_groups CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS customers_services CASCADE;
DROP TABLE IF EXISTS customer_users_customers CASCADE;
DROP TABLE IF EXISTS customer_users CASCADE;
DROP TABLE IF EXISTS customers_groups CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS sla CASCADE;
DROP TABLE IF EXISTS types CASCADE;
DROP TABLE IF EXISTS type_categories CASCADE;
DROP TABLE IF EXISTS priorities CASCADE;
DROP TABLE IF EXISTS states CASCADE;

DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS workflow_transitions CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS template_queues CASCADE;
DROP TABLE IF EXISTS template_attachments CASCADE;

DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS calendars CASCADE;

DROP TABLE IF EXISTS knowledge_base CASCADE;
DROP TABLE IF EXISTS greetings CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS auto_responses CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS email_addresses CASCADE;

DROP TABLE IF EXISTS session_management CASCADE;
DROP TABLE IF EXISTS system_log CASCADE;
DROP TABLE IF EXISTS performance_log CASCADE;
DROP TABLE IF EXISTS system_configuration CASCADE;

-- Дополнительные таблицы (чтобы не было ошибок)
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS appointment_notifications CASCADE;
DROP TABLE IF EXISTS communication_log CASCADE;
DROP TABLE IF EXISTS communication_notifications_settings CASCADE;
DROP TABLE IF EXISTS general_catalog CASCADE;
DROP TABLE IF EXISTS process_management CASCADE;
DROP TABLE IF EXISTS processes_automation_settings CASCADE;
DROP TABLE IF EXISTS support_data_collector CASCADE;
DROP TABLE IF EXISTS system_file_support CASCADE;
DROP TABLE IF EXISTS web_services CASCADE;
DROP TABLE IF EXISTS translation CASCADE;

-- Включаем обратно проверку FK
SET session_replication_role = 'origin';

-- =====================================================
-- 2. СОЗДАНИЕ ТАБЛИЦ В ПРАВИЛЬНОМ ПОРЯДКЕ
-- =====================================================

-- === БАЗОВЫЕ СПРАВОЧНИКИ (без зависимостей) ===

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

CREATE TABLE priorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#808080',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_priorities_name ON priorities(name);
CREATE INDEX IF NOT EXISTS idx_priorities_is_active ON priorities(is_active);

CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    comment TEXT,
    type VARCHAR(50),
    color VARCHAR(7) DEFAULT '#808080',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);
CREATE INDEX IF NOT EXISTS idx_states_is_active ON states(is_active);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    street VARCHAR(255),
    zip VARCHAR(20),
    city VARCHAR(255),
    comment TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

CREATE TABLE sla (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    response_time NUMERIC(10,2),
    resolution_time NUMERIC(10,2),
    notification_percentage INTEGER DEFAULT 80,
    type VARCHAR(50),
    solution_time NUMERIC(10,2),
    min_incident_time NUMERIC(10,2),
    response_notification INTEGER DEFAULT 20,
    update_notification INTEGER DEFAULT 80,
    solution_notification INTEGER DEFAULT 80,
    calendar_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sla_name ON sla(name);
CREATE INDEX IF NOT EXISTS idx_sla_is_active ON sla(is_active);

CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);

-- Workflow transitions (правила переходов между статусами в воркфлоу)
CREATE TABLE workflow_transitions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_status_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
    target_status_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    action_label VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_transition UNIQUE (workflow_id, source_status_id, target_status_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow_id ON workflow_transitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_source_status ON workflow_transitions(source_status_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_target_status ON workflow_transitions(target_status_id);

-- Add is_initial to states if not present (used by workflow system)
ALTER TABLE states ADD COLUMN IF NOT EXISTS is_initial BOOLEAN DEFAULT false;

CREATE TABLE calendars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    timezone VARCHAR(100) DEFAULT 'Europe/Moscow',
    work_hours_from TIME DEFAULT '09:00',
    work_hours_to TIME DEFAULT '18:00',
    work_days_per_week INTEGER DEFAULT 5,
    color VARCHAR(7) DEFAULT '#3b82f6',
    date_from DATE,
    date_to DATE,
    work_hours TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendars_name ON calendars(name);
CREATE INDEX IF NOT EXISTS idx_calendars_is_active ON calendars(is_active);

-- Добавляем FK для sla.calendar_id после создания calendars
ALTER TABLE sla ADD COLUMN IF NOT EXISTS calendar_id INTEGER REFERENCES calendars(id) ON DELETE SET NULL;

-- === АГЕНТЫ И РОЛИ (зависимые) ===

CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    login VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile_phone VARCHAR(50),
    telegram_account VARCHAR(100),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_login ON agents(login);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_role_id ON agents(role_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

CREATE TABLE agents_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_groups_name ON agents_groups(name);
CREATE INDEX IF NOT EXISTS idx_agents_groups_is_active ON agents_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_groups_role_id ON agents_groups(role_id);

-- Junction tables
CREATE TABLE agents_groups_roles (
    agents_group_id INTEGER REFERENCES agents_groups(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (agents_group_id, role_id)
);

CREATE TABLE agents_groups_agents (
    agents_group_id INTEGER REFERENCES agents_groups(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    PRIMARY KEY (agents_group_id, agent_id)
);

CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(255) NOT NULL,
    is_granted BOOLEAN DEFAULT true,
    level INTEGER DEFAULT 444,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- === ПОЛЬЗОВАТЕЛИ (не-агенты) ===

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- === ТИПЫ, КАТЕГОРИИ, СЕРВИСЫ ===

CREATE TABLE type_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    labor_hours NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_type_categories_name ON type_categories(name);

CREATE TABLE types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    comment TEXT,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
    category_ids INTEGER[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_types_name ON types(name);
CREATE INDEX IF NOT EXISTS idx_types_is_active ON types(is_active);
CREATE INDEX IF NOT EXISTS idx_types_category_ids ON types USING GIN(category_ids);

COMMENT ON COLUMN types.category_ids IS 'Массив ID категорий типа';

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    comment TEXT,
    type VARCHAR(50),
    sla_id INTEGER REFERENCES sla(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Junction customers <-> services
CREATE TABLE customers_services (
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, service_id)
);

-- === КЛИЕНТЫ И ПОЛЬЗОВАТЕЛИ КЛИЕНТОВ ===

CREATE TABLE customers_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_groups_name ON customers_groups(name);

CREATE TABLE customer_users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    login VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile_phone VARCHAR(50),
    telegram_account VARCHAR(100),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customers_group_id INTEGER REFERENCES customers_groups(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_users_login ON customer_users(login);
CREATE INDEX IF NOT EXISTS idx_customer_users_email ON customer_users(email);
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);

-- === ОЧЕРЕДИ ===

CREATE TABLE queues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    department_id INTEGER,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    sla_id INTEGER REFERENCES sla(id) ON DELETE SET NULL,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
    priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
    executor_group_ids INTEGER[],
    executor_agent_ids INTEGER[],
    observer_group_ids INTEGER[],
    observer_agent_ids INTEGER[],
    approver_group_ids INTEGER[],
    approver_agent_ids INTEGER[],
    keywords TEXT[],
    quick_answer_article_ids INTEGER[],
    type_id INTEGER REFERENCES types(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES type_categories(id) ON DELETE SET NULL,
    post_master_mail_account_id INTEGER,
    template_open_ticket_id INTEGER,
    template_close_ticket_id INTEGER,
    template_confirm_ticket_id INTEGER,
    template_status_change_id INTEGER,
    template_comment_ticket_id INTEGER,
    template_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queues_name ON queues(name);
CREATE INDEX IF NOT EXISTS idx_queues_is_active ON queues(is_active);
CREATE INDEX IF NOT EXISTS idx_queues_company_id ON queues(company_id);
CREATE INDEX IF NOT EXISTS idx_queues_service_id ON queues(service_id);
CREATE INDEX IF NOT EXISTS idx_queues_sla_id ON queues(sla_id);

-- === ПОЧТОВЫЕ АККАУНТЫ ===

CREATE TABLE post_master_mail_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'IMAP',
    authentication_type VARCHAR(50) NOT NULL DEFAULT 'password',
    login VARCHAR(255) NOT NULL DEFAULT '',
    password VARCHAR(500),
    host VARCHAR(255) NOT NULL DEFAULT '',
    port INTEGER DEFAULT 993,
    protocol VARCHAR(50) DEFAULT 'imap',
    imap_folder VARCHAR(255) DEFAULT 'INBOX',
    trusted BOOLEAN NOT NULL DEFAULT false,
    dispatching_by VARCHAR(20) NOT NULL DEFAULT 'Queue',
    queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL,
    comment TEXT,
    oauth2_token_config_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_login ON post_master_mail_accounts(login);
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_is_active ON post_master_mail_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_queue_id ON post_master_mail_accounts(queue_id);

CREATE TABLE post_master_filters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === ТИКЕТЫ И РАСПИСАНИЯ ===

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type_id INTEGER REFERENCES types(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES type_categories(id) ON DELETE SET NULL,
    priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
    queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL,
    state_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES customer_users(id) ON DELETE SET NULL,
    executor_agent_ids INTEGER[],
    executor_group_ids INTEGER[],
    company_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    sla_id INTEGER REFERENCES sla(id) ON DELETE SET NULL,
    response_deadline TIMESTAMP,
    resolution_deadline TIMESTAMP,
    first_response_at TIMESTAMP,
    sla_violated BOOLEAN DEFAULT false,
    pending_start_at TIMESTAMP,
    observer_agent_ids INTEGER[],
    observer_group_ids INTEGER[],
    escalation_count INTEGER DEFAULT 0,
    is_escalated BOOLEAN DEFAULT false,
    created_by_schedule_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    external_id VARCHAR(255), -- message-id письма для дедупликации
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_id ON tickets(queue_id);
CREATE INDEX IF NOT EXISTS idx_tickets_state_id ON tickets(state_id);
CREATE INDEX IF NOT EXISTS idx_tickets_is_active ON tickets(is_active);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_external_id ON tickets(external_id); -- для поиска по message-id

CREATE TABLE ticket_schedules (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) DEFAULT 'daily',
    schedule_time VARCHAR(5) DEFAULT '09:00',
    schedule_days INTEGER[],
    schedule_day_of_month INTEGER,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    title_prefix VARCHAR(100) DEFAULT 'Расписание (Р) ',
    title VARCHAR(500),
    description TEXT,
    type_id INTEGER REFERENCES types(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES type_categories(id) ON DELETE SET NULL,
    priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
    queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL,
    state_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES customer_users(id) ON DELETE SET NULL,
    executor_agent_ids INTEGER[],
    executor_group_ids INTEGER[],
    company_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    sla_id INTEGER REFERENCES sla(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_schedules_ticket_id ON ticket_schedules(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_schedules_next_run_at ON ticket_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_ticket_schedules_is_active ON ticket_schedules(is_active);

CREATE TABLE ticket_schedule_logs (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES ticket_schedules(id) ON DELETE CASCADE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_ticket_id INTEGER,
    created_ticket_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_schedule_logs_schedule_id ON ticket_schedule_logs(schedule_id);

-- === ДРУГИЕ ТАБЛИЦЫ ТИКЕТОВ ===

CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by);

COMMENT ON TABLE ticket_attachments IS 'Вложения к тикетам';
COMMENT ON COLUMN ticket_attachments.file_name IS 'Имя файла на диске';
COMMENT ON COLUMN ticket_attachments.file_path IS 'Путь к файлу на сервере';
COMMENT ON COLUMN ticket_attachments.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN ticket_attachments.mime_type IS 'MIME-тип файла';

CREATE TABLE ticket_status_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    from_status_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
    to_status_id INTEGER NOT NULL REFERENCES states(id) ON DELETE SET NULL,
    transition_id INTEGER REFERENCES workflow_transitions(id) ON DELETE SET NULL,
    changed_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    time_in_previous_status INTERVAL,
    action_label VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN ticket_status_history.transition_id IS 'ID перехода из workflow_transitions (для аудита)';
COMMENT ON COLUMN ticket_status_history.comment IS 'Комментарий при смене статуса';

CREATE TABLE ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by INTEGER REFERENCES agents(id),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    action_label VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === ШАБЛОНЫ, ПРИВЕТСТВИЯ И Т.Д. ===

CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Новые поля по ТЗ TemplateQueues / расширенные шаблоны уведомлений
    subject VARCHAR(500),
    css_styles TEXT,
    event_type VARCHAR(100),
    placeholders JSONB DEFAULT '[]',
    preview_image TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    version INTEGER DEFAULT 1,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    last_tested_at TIMESTAMP
);

-- Индексы для шаблонов
CREATE INDEX IF NOT EXISTS idx_templates_event_type ON templates(event_type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

CREATE TABLE template_queues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Таблица логов отправки уведомлений (по ТЗ)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    queue_id INTEGER,
    ticket_id INTEGER,
    recipients JSONB,
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_event_type ON notification_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template_id ON notification_delivery_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_delivery_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_delivery_logs(status);

-- =====================================================
-- Таблица версий шаблонов (по ТЗ)
-- =====================================================
CREATE TABLE IF NOT EXISTS template_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    message TEXT,
    subject VARCHAR(500),
    css_styles TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(version);

COMMENT ON TABLE notification_delivery_logs IS 'Логи отправки уведомлений по шаблонам (TemplateQueues)';
COMMENT ON TABLE template_versions IS 'История версий HTML-шаблонов';

CREATE TABLE template_attachments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE greetings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    comment TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    comment TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auto_responses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger VARCHAR(255),
    response TEXT,
    delay INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE queue_auto_response (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    type INTEGER,
    comment TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_addresses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT,
    queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    category_id INTEGER,
    tags TEXT[],
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_active ON knowledge_base(is_active);

-- === СИСТЕМНЫЕ ТАБЛИЦЫ ===

CREATE TABLE session_management (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    ip_address VARCHAR(100),
    user_agent TEXT,
    login_time TIMESTAMP,
    last_activity TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    type VARCHAR(20),
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_log (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_log (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_configuration (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value TEXT,
    config_type VARCHAR(50),
    is_editable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mail_fetch_logs (
    id SERIAL PRIMARY KEY,
    account_id INTEGER,
    status VARCHAR(50),
    message TEXT,
    fetched_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применяем триггеры к основным таблицам
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('agents', 'agents_groups', 'roles', 'queues', 'tickets', 'ticket_schedules', 
                             'post_master_mail_accounts', 'customers', 'services', 'sla', 'states', 
                             'priorities', 'types', 'workflows', 'calendars', 'users', 'customer_users')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;
            CREATE TRIGGER trigger_update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =====================================================
-- 4. НАЧАЛЬНЫЕ ДАННЫЕ (ГОТОВАЯ К РАБОТЕ СИСТЕМА)
-- =====================================================

-- 1. Роль Администратор
INSERT INTO roles (id, name, is_active) 
VALUES (1, 'Admin', true)
ON CONFLICT (id) DO UPDATE SET name = 'Admin', is_active = true;

-- 2. Тестовый агент admin / admin123 (сразу с ролью)
INSERT INTO agents (login, password, first_name, last_name, email, is_active, role_id)
VALUES (
    'admin',
    '$2b$10$TBFHhA2N0fkQEP7R5F7v7eIxWN4UUh0ug5KWawQ5Tn7nYqnJqIjZO',
    'Admin',
    'User',
    'admin@example.com',
    true,
    1
)
ON CONFLICT (login) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    is_active = true,
    role_id = 1;

-- 3. Группа "Администраторы" + связи (чтобы права работали через группы)
INSERT INTO agents_groups (name, is_active)
VALUES ('Администраторы', true)
ON CONFLICT DO NOTHING;

-- Связь роли Admin с группой
INSERT INTO agents_groups_roles (agents_group_id, role_id)
SELECT ag.id, 1
FROM agents_groups ag
WHERE ag.name = 'Администраторы'
ON CONFLICT DO NOTHING;

-- Привязка агента admin к группе
INSERT INTO agents_groups_agents (agents_group_id, agent_id)
SELECT ag.id, 1
FROM agents_groups ag, agents a
WHERE ag.name = 'Администраторы' AND a.login = 'admin'
ON CONFLICT DO NOTHING;

-- 4. ПОЛНЫЙ НАБОР ПРАВ ДЛЯ АДМИНИСТРАТОРА (чтобы не настраивать заново)
-- Полный доступ к Агентам, Ролям, Разрешениям + все основные разделы
INSERT INTO role_permissions (role_id, permission, is_granted, level)
VALUES 
    -- === Полный доступ к справочникам (как ты просил) ===
    (1, 'menu_agents_read', true, 444),
    (1, 'menu_agents_write', true, 644),
    (1, 'menu_agents_delete', true, 744),
    
    (1, 'menu_roles_list_read', true, 444),
    (1, 'menu_roles_list_write', true, 644),
    (1, 'menu_roles_list_delete', true, 744),
    
    (1, 'menu_permissions_read', true, 444),
    (1, 'menu_permissions_write', true, 644),
    (1, 'menu_permissions_delete', true, 744),

    -- === Полный доступ ко всему остальному (чтобы админ мог работать сразу) ===
    (1, 'menu_dashboard_read', true, 444),
    (1, 'menu_dashboard_write', true, 644),
    (1, 'menu_dashboard_delete', true, 744),

    (1, 'menu_tickets_list_read', true, 444),
    (1, 'menu_tickets_list_write', true, 644),
    (1, 'menu_tickets_list_delete', true, 744),

    (1, 'menu_tickets_create_read', true, 444),
    (1, 'menu_tickets_create_write', true, 644),
    (1, 'menu_tickets_create_delete', true, 744),

    (1, 'menu_tickets_schedules_read', true, 444),
    (1, 'menu_tickets_schedules_write', true, 644),
    (1, 'menu_tickets_schedules_delete', true, 744),

    (1, 'menu_chat_read', true, 444),
    (1, 'menu_chat_write', true, 644),
    (1, 'menu_chat_delete', true, 744),

    (1, 'menu_kanban_read', true, 444),
    (1, 'menu_kanban_write', true, 644),
    (1, 'menu_kanban_delete', true, 744),

    (1, 'menu_knowledge_base_read', true, 444),
    (1, 'menu_knowledge_base_write', true, 644),
    (1, 'menu_knowledge_base_delete', true, 744),

    (1, 'menu_services_read', true, 444),
    (1, 'menu_services_write', true, 644),
    (1, 'menu_services_delete', true, 744),

    (1, 'menu_companies_list_read', true, 444),
    (1, 'menu_companies_list_write', true, 644),
    (1, 'menu_companies_list_delete', true, 744),

    (1, 'menu_companies_groups_read', true, 444),
    (1, 'menu_companies_groups_write', true, 644),
    (1, 'menu_companies_groups_delete', true, 744),

    (1, 'menu_companies_users_read', true, 444),
    (1, 'menu_companies_users_write', true, 644),
    (1, 'menu_companies_users_delete', true, 744),

    (1, 'menu_queues_read', true, 444),
    (1, 'menu_queues_write', true, 644),
    (1, 'menu_queues_delete', true, 744),

    (1, 'menu_types_read', true, 444),
    (1, 'menu_types_write', true, 644),
    (1, 'menu_types_delete', true, 744),

    (1, 'menu_type_categories_read', true, 444),
    (1, 'menu_type_categories_write', true, 644),
    (1, 'menu_type_categories_delete', true, 744),

    (1, 'menu_states_read', true, 444),
    (1, 'menu_states_write', true, 644),
    (1, 'menu_states_delete', true, 744),

    (1, 'menu_priorities_read', true, 444),
    (1, 'menu_priorities_write', true, 644),
    (1, 'menu_priorities_delete', true, 744),

    (1, 'menu_sla_read', true, 444),
    (1, 'menu_sla_write', true, 644),
    (1, 'menu_sla_delete', true, 744),

    (1, 'menu_templates_read', true, 444),
    (1, 'menu_templates_write', true, 644),
    (1, 'menu_templates_delete', true, 744),

    (1, 'menu_workflows_read', true, 444),
    (1, 'menu_workflows_write', true, 644),
    (1, 'menu_workflows_delete', true, 744),

    (1, 'menu_greetings_read', true, 444),
    (1, 'menu_greetings_write', true, 644),
    (1, 'menu_greetings_delete', true, 744),

    (1, 'menu_signatures_read', true, 444),
    (1, 'menu_signatures_write', true, 644),
    (1, 'menu_signatures_delete', true, 744),

    (1, 'menu_auto_responses_read', true, 444),
    (1, 'menu_auto_responses_write', true, 644),
    (1, 'menu_auto_responses_delete', true, 744),

    (1, 'menu_post_master_mail_accounts_read', true, 444),
    (1, 'menu_post_master_mail_accounts_write', true, 644),
    (1, 'menu_post_master_mail_accounts_delete', true, 744),

    (1, 'menu_calendars_read', true, 444),
    (1, 'menu_calendars_write', true, 644),
    (1, 'menu_calendars_delete', true, 744),

    (1, 'menu_session_management_read', true, 444),
    (1, 'menu_session_management_write', true, 644),
    (1, 'menu_session_management_delete', true, 744)
ON CONFLICT (role_id, permission) 
DO UPDATE SET is_granted = true, level = EXCLUDED.level, updated_at = CURRENT_TIMESTAMP;

-- 5. Базовые справочники (для работы системы)
INSERT INTO priorities (name, color, is_active) VALUES 
    ('Низкий', '#22c55e', true),
    ('Средний', '#eab308', true),
    ('Высокий', '#ef4444', true)
ON CONFLICT DO NOTHING;

INSERT INTO states (name, color, is_active) VALUES 
    ('Новый', '#3b82f6', true),
    ('В работе', '#f59e0b', true),
    ('Решён', '#22c55e', true),
    ('Закрыт', '#6b7280', true)
ON CONFLICT DO NOTHING;

INSERT INTO type_categories (name, is_active) VALUES 
    ('Общий', true),
    ('Инцидент', true),
    ('Запрос', true)
ON CONFLICT DO NOTHING;

-- 6. Полноценные начальные данные для работы системы (НЕ тестовые, а реальные defaults)

-- Минимальные workflow (должны быть первыми, т.к. на них ссылаются types и queues)
INSERT INTO workflows (name, description, is_active) VALUES 
    ('Стандартный процесс', 'Базовый процесс обработки заявок', true),
    ('Инцидент', 'Процесс для инцидентов', true)
ON CONFLICT DO NOTHING;

-- Типы заявок (без color — в таблице его нет)
INSERT INTO types (name, comment, is_active) VALUES 
    ('Запрос', 'Обычный запрос пользователя', true),
    ('Инцидент', 'Сбой в работе сервиса', true),
    ('Проблема', 'Причина инцидента', true),
    ('Изменение', 'Запрос на изменение', true)
ON CONFLICT DO NOTHING;

-- SLA
INSERT INTO sla (name, response_time, resolution_time, is_active) VALUES 
    ('Стандартный', 480, 2880, true),   -- 8 часов / 2 дня
    ('Высокий', 120, 480, true),        -- 2 часа / 8 часов
    ('Критический', 30, 240, true)      -- 30 мин / 4 часа
ON CONFLICT DO NOTHING;

-- Базовые очереди
INSERT INTO queues (name, description, is_active) VALUES 
    ('Общая', 'Общая очередь для всех заявок', true),
    ('Техподдержка', 'Техническая поддержка', true),
    ('Биллинг', 'Вопросы по оплате и счетам', true)
ON CONFLICT DO NOTHING;

-- System Configuration — все ключи, которые реально ищет бэкенд
INSERT INTO system_configuration (name, description, value, config_type, is_editable, is_active) VALUES 
    ('reference_data_cache_enabled', 'Включить кеширование referenceData', 'true', 'system', false, true),
    ('reference_data_cache_ttl_seconds', 'Время жизни кеша referenceData в секундах (0 = без кеша)', '300', 'system', false, true),
    ('mail_fetch_interval_minutes', 'Интервал проверки почты (минуты)', '5', 'mail', true, true),
    ('mail_fetcher_max_retries', 'Максимум попыток при ошибке получения письма', '3', 'mail', true, true),
    ('mail_fetcher_retry_delay_seconds', 'Задержка между попытками (сек)', '30', 'mail', true, true),
    ('mail_fetcher_max_attachment_size_mb', 'Максимальный размер вложения (МБ)', '25', 'mail', true, true),
    ('create_customer_user_by_email', 'Автоматически создавать Customer User при получении письма от нового адреса', 'true', 'mail', true, true),
    ('ticket_auto_assign_on_create', 'Автоматически назначать исполнителя при создании тикета', 'false', 'ticket', true, true),
    ('default_priority', 'Приоритет по умолчанию (ID)', '2', 'ticket', true, true),
    ('default_state', 'Статус по умолчанию (ID)', '1', 'ticket', true, true),
    ('default_type', 'Тип заявки по умолчанию (ID)', '1', 'ticket', true, true),
    ('default_queue', 'Очередь по умолчанию (ID)', '1', 'ticket', true, true),
    ('default_sla', 'SLA по умолчанию (ID)', '1', 'ticket', true, true),
    ('system_name', 'Название системы (отображается в UI и письмах)', 'DreamDesc Helpdesk', 'system', true, true),
    ('company_name', 'Название компании', 'Ваша компания', 'system', true, true)
ON CONFLICT (name) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- ГОТОВО!
-- После выполнения этого скрипта:
-- - Админ (admin / admin123) уже имеет полные права
-- - Группа "Администраторы" + все необходимые связи созданы
-- - Роли и разрешения настраивать заново НЕ нужно
-- - Основные справочники (priorities, states, types, sla, queues, workflows, system_configuration) заполнены
-- =====================================================

SELECT 'Схема + начальные данные успешно созданы. Админ готов к работе!' AS result;

-- =====================================================
-- ГОТОВО
-- =====================================================

SELECT 'Схема БД успешно создана!' AS result;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
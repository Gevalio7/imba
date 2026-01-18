-- ============================================
-- Скрипт удаления всех таблиц
-- Сгенерирован автоматически: 2026-01-18T17:33:08.760Z
-- ============================================

-- Отключаем проверку внешних ключей
SET session_replication_role = 'replica';

DROP TABLE IF EXISTS web_services CASCADE;
DROP TABLE IF EXISTS users_groups_roles_settings CASCADE;
DROP TABLE IF EXISTS types CASCADE;
DROP TABLE IF EXISTS translation CASCADE;
DROP TABLE IF EXISTS ticket_notifications CASCADE;
DROP TABLE IF EXISTS ticket_attribute_relations CASCADE;
DROP TABLE IF EXISTS test_entities CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS template_queues CASCADE;
DROP TABLE IF EXISTS template_attachments CASCADE;
DROP TABLE IF EXISTS system_maintenance CASCADE;
DROP TABLE IF EXISTS system_log CASCADE;
DROP TABLE IF EXISTS system_file_support CASCADE;
DROP TABLE IF EXISTS system_configuration CASCADE;
DROP TABLE IF EXISTS support_data_collector CASCADE;
DROP TABLE IF EXISTS states CASCADE;
DROP TABLE IF EXISTS sql_box CASCADE;
DROP TABLE IF EXISTS smime_certificates CASCADE;
DROP TABLE IF EXISTS sla CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS session_management CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS roles_groups CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS queues CASCADE;
DROP TABLE IF EXISTS queue_auto_response CASCADE;
DROP TABLE IF EXISTS processes_automation_settings CASCADE;
DROP TABLE IF EXISTS process_management CASCADE;
DROP TABLE IF EXISTS priorities CASCADE;
DROP TABLE IF EXISTS post_master_mail_accounts CASCADE;
DROP TABLE IF EXISTS post_master_filters CASCADE;
DROP TABLE IF EXISTS pgp_keys CASCADE;
DROP TABLE IF EXISTS performance_log CASCADE;
DROP TABLE IF EXISTS package_manager CASCADE;
DROP TABLE IF EXISTS oauth2 CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS greetings CASCADE;
DROP TABLE IF EXISTS generic_agent CASCADE;
DROP TABLE IF EXISTS general_catalog CASCADE;
DROP TABLE IF EXISTS email_addresses CASCADE;
DROP TABLE IF EXISTS dynamic_fields_screens CASCADE;
DROP TABLE IF EXISTS dynamic_fields CASCADE;
DROP TABLE IF EXISTS customers_groups CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS customer_users_services CASCADE;
DROP TABLE IF EXISTS customer_users_groups CASCADE;
DROP TABLE IF EXISTS customer_users_customers CASCADE;
DROP TABLE IF EXISTS customer_users CASCADE;
DROP TABLE IF EXISTS communication_notifications_settings CASCADE;
DROP TABLE IF EXISTS communication_log CASCADE;
DROP TABLE IF EXISTS calendars CASCADE;
DROP TABLE IF EXISTS auto_responses CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS appointment_notifications CASCADE;
DROP TABLE IF EXISTS agents_roles CASCADE;
DROP TABLE IF EXISTS agents_groups CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admin_notification CASCADE;
DROP TABLE IF EXISTS acls CASCADE;
DROP TABLE IF EXISTS acl CASCADE;

-- Включаем обратно проверку внешних ключей
SET session_replication_role = 'origin';

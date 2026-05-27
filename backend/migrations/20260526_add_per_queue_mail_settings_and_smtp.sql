-- Миграция: Настройки почты на уровне очереди + SMTP-поля для PostMasterMailAccounts
-- Дата: 2026-05-26
-- Описание: 
--   1. Добавляет в queues поля для per-queue почтового механизма (интервал, папка, авто-флаги, подпись, новый шаблон welcome).
--   2. Добавляет SMTP-поля в post_master_mail_accounts для отправки уведомлений (отдельные от IMAP).
--   3. Подготавливает почву для шифрования паролей (будет использоваться позже).
-- Примечание: mail_fetch_interval_minutes в system_configuration остаётся как fallback (deprecated).

-- =============================================
-- 1. Расширение таблицы queues
-- =============================================
ALTER TABLE queues ADD COLUMN IF NOT EXISTS mail_fetch_interval INTEGER;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS mail_folder VARCHAR(255);
ALTER TABLE queues ADD COLUMN IF NOT EXISTS auto_create_ticket BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS signature_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS signature_text TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS template_customer_welcome_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;

-- Комментарии
COMMENT ON COLUMN queues.mail_fetch_interval IS 'Интервал проверки почты для этой очереди (в секундах). NULL = fallback на глобальную mail_fetch_interval_minutes (deprecated)';
COMMENT ON COLUMN queues.mail_folder IS 'IMAP-папка для сбора писем (по умолчанию INBOX)';
COMMENT ON COLUMN queues.auto_create_ticket IS 'Автоматически создавать тикет из входящего письма';
COMMENT ON COLUMN queues.auto_reply_enabled IS 'Отправлять авто-ответ при создании тикета из письма';
COMMENT ON COLUMN queues.signature_enabled IS 'Добавлять подпись к исходящим письмам';
COMMENT ON COLUMN queues.signature_text IS 'Текст подписи (если не задана — брать из signatures)';
COMMENT ON COLUMN queues.template_customer_welcome_id IS 'Шаблон приветственного письма при авто-создании customer_user (с паролем или ссылкой сброса)';

-- Индекс для быстрого поиска очередей с активной почтой
CREATE INDEX IF NOT EXISTS idx_queues_postmaster_mail ON queues(post_master_mail_account_id) WHERE is_active = true;

-- =============================================
-- 2. Расширение таблицы post_master_mail_accounts (SMTP для отправки)
-- =============================================
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255);
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_port INTEGER;
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255);
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_password VARCHAR(500);
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_auth_type VARCHAR(50) DEFAULT 'password'; -- password | oauth2

-- Комментарии
COMMENT ON COLUMN post_master_mail_accounts.smtp_host IS 'Хост SMTP-сервера для отправки (если отличается от IMAP)';
COMMENT ON COLUMN post_master_mail_accounts.smtp_port IS 'Порт SMTP (обычно 587 или 465)';
COMMENT ON COLUMN post_master_mail_accounts.smtp_secure IS 'Использовать SMTPS (SSL/TLS)';
COMMENT ON COLUMN post_master_mail_accounts.smtp_user IS 'Логин для SMTP (часто совпадает с login)';
COMMENT ON COLUMN post_master_mail_accounts.smtp_password IS 'Пароль для SMTP (будет зашифрован в будущем)';
COMMENT ON COLUMN post_master_mail_accounts.smtp_auth_type IS 'Тип аутентификации для SMTP';

-- =============================================
-- 3. Опционально: добавить системную настройку для дефолтного интервала (уже существует)
-- =============================================
-- Глобальная mail_fetch_interval_minutes остаётся как fallback.
-- Можно добавить:
-- INSERT INTO system_configuration (name, key, value, description, config_type, is_editable, is_active)
-- VALUES ('Mail Fetch Interval (deprecated)', 'mail_fetch_interval_minutes', '5', 'Глобальный интервал (сек). Устаревает в пользу per-queue mail_fetch_interval', 'mail', true, true)
-- ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 4. Подготовка к шифрованию (будущая миграция данных)
-- =============================================
-- ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS password_encrypted BOOLEAN DEFAULT false;
-- ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS smtp_password_encrypted BOOLEAN DEFAULT false;
-- После внедрения crypto — запустить скрипт миграции данных.

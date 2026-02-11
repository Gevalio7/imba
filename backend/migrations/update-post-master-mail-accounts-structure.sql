-- Миграция для изменения структуры таблицы post_master_mail_accounts
-- Обновляет структуру таблицы для хранения настроек почтовых аккаунтов PostMaster

-- Добавляем новые столбцы
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'IMAP';
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS authentication_type VARCHAR(50) NOT NULL DEFAULT 'password';
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS login VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS password VARCHAR(500);
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS host VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS imap_folder VARCHAR(255);
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS trusted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS dispatching_by VARCHAR(20) NOT NULL DEFAULT 'Queue';
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL;
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS oauth2_token_config_id INTEGER;

-- Удаляем старые столбцы которые больше не нужны
ALTER TABLE post_master_mail_accounts DROP COLUMN IF EXISTS name;
ALTER TABLE post_master_mail_accounts DROP COLUMN IF EXISTS message;

-- Обновляем комментарии для столбцов
COMMENT ON COLUMN post_master_mail_accounts.type IS 'Тип протокола: IMAP, IMAPS, IMAPTLS, MSGraph, POP3, POP3S, POP3TLS';
COMMENT ON COLUMN post_master_mail_accounts.authentication_type IS 'Тип аутентификации: oauth2_token или password';
COMMENT ON COLUMN post_master_mail_accounts.login IS 'Логин для подключения к почтовому серверу';
COMMENT ON COLUMN post_master_mail_accounts.password IS 'Пароль для подключения (зашифрованный)';
COMMENT ON COLUMN post_master_mail_accounts.host IS 'Адрес почтового сервера';
COMMENT ON COLUMN post_master_mail_accounts.imap_folder IS 'Папка IMAP для получения сообщений (опционально)';
COMMENT ON COLUMN post_master_mail_accounts.trusted IS 'Доверенный аккаунт';
COMMENT ON COLUMN post_master_mail_accounts.dispatching_by IS 'Метод маршрутизации: Queue или From';
COMMENT ON COLUMN post_master_mail_accounts.queue_id IS 'ID очереди для маршрутизации';
COMMENT ON COLUMN post_master_mail_accounts.comment IS 'Комментарий к аккаунту';
COMMENT ON COLUMN post_master_mail_accounts.oauth2_token_config_id IS 'ID конфигурации OAuth2 токена';

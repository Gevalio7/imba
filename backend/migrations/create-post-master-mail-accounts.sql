-- Миграция для создания таблицы post_master_mail_accounts
-- Создает таблицу для хранения настроек почтовых аккаунтов PostMaster

CREATE TABLE IF NOT EXISTS post_master_mail_accounts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'IMAP',
    authentication_type VARCHAR(50) NOT NULL DEFAULT 'password',
    login VARCHAR(255) NOT NULL,
    password VARCHAR(500),
    host VARCHAR(255) NOT NULL,
    imap_folder VARCHAR(255),
    trusted BOOLEAN NOT NULL DEFAULT false,
    dispatching_by VARCHAR(20) NOT NULL DEFAULT 'Queue',
    queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL,
    comment TEXT,
    oauth2_token_config_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_type ON post_master_mail_accounts(type);
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_host ON post_master_mail_accounts(host);
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_queue_id ON post_master_mail_accounts(queue_id);
CREATE INDEX IF NOT EXISTS idx_post_master_mail_accounts_is_active ON post_master_mail_accounts(is_active);

-- Комментарии для таблицы и столбцов
COMMENT ON TABLE post_master_mail_accounts IS 'Таблица почтовых аккаунтов PostMaster для получения входящих сообщений';
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
COMMENT ON COLUMN post_master_mail_accounts.is_active IS 'Активен ли аккаунт';
COMMENT ON COLUMN post_master_mail_accounts.created_at IS 'Дата создания записи';
COMMENT ON COLUMN post_master_mail_accounts.updated_at IS 'Дата последнего обновления записи';

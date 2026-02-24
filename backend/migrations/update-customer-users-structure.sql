-- Миграция для обновления структуры таблицы customer_users
-- Добавляем поля как в agents: firstName, lastName, login, password, email, mobilePhone, telegramAccount

-- Сначала удаляем старые поля name и message
ALTER TABLE customer_users DROP COLUMN IF EXISTS name;
ALTER TABLE customer_users DROP COLUMN IF EXISTS message;

-- Добавляем новые поля как в agents
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS login VARCHAR(255) UNIQUE;
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50);
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS telegram_account VARCHAR(100);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_customer_users_first_name ON customer_users(first_name);
CREATE INDEX IF NOT EXISTS idx_customer_users_last_name ON customer_users(last_name);
CREATE INDEX IF NOT EXISTS idx_customer_users_email ON customer_users(email);
CREATE INDEX IF NOT EXISTS idx_customer_users_login ON customer_users(login);

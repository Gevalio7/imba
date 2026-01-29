-- Изменение таблицы agents для новых полей агентов
-- Добавление новых полей
ALTER TABLE agents ADD COLUMN first_name VARCHAR(255);
ALTER TABLE agents ADD COLUMN last_name VARCHAR(255);
ALTER TABLE agents ADD COLUMN login VARCHAR(255) UNIQUE;
ALTER TABLE agents ADD COLUMN password VARCHAR(255);
ALTER TABLE agents ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE agents ADD COLUMN mobile_phone VARCHAR(255);
ALTER TABLE agents ADD COLUMN telegram_account VARCHAR(255);

-- Удаление старых полей
ALTER TABLE agents DROP COLUMN IF EXISTS name;
ALTER TABLE agents DROP COLUMN IF EXISTS message;

-- Создание индексов для новых полей
CREATE INDEX IF NOT EXISTS idx_agents_login ON agents(login);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);

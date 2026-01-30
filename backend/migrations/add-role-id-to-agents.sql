-- Добавление поля role_id в таблицу agents
-- Связь с таблицей roles (многие-к-одному: много агентов могут иметь одну роль)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

-- Создание индекса для быстрого поиска по роли
CREATE INDEX IF NOT EXISTS idx_agents_role_id ON agents(role_id);

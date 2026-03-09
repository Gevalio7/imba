-- Добавление поля role_id в таблицу agents_groups для назначения роли группе
ALTER TABLE agents_groups ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

-- Индекс для производительности при фильтрации по роли
CREATE INDEX IF NOT EXISTS idx_agents_groups_role_id ON agents_groups(role_id);

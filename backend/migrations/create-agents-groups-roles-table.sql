-- Создание таблицы для связи групп агентов с несколькими ролями (многие-ко-многим)
CREATE TABLE IF NOT EXISTS agents_groups_roles (
  id SERIAL PRIMARY KEY,
  agents_group_id INTEGER NOT NULL REFERENCES agents_groups(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agents_group_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_agents_groups_roles_group_id ON agents_groups_roles(agents_group_id);
CREATE INDEX IF NOT EXISTS idx_agents_groups_roles_role_id ON agents_groups_roles(role_id);

-- Мигрируем существующие данные из role_id в новую таблицу
INSERT INTO agents_groups_roles (agents_group_id, role_id)
SELECT id, role_id FROM agents_groups WHERE role_id IS NOT NULL
ON CONFLICT (agents_group_id, role_id) DO NOTHING;

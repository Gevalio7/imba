-- Создание junction table для связи агентов и групп агентов
-- Многие ко многим: агент может быть в нескольких группах, группа может иметь несколько агентов

CREATE TABLE IF NOT EXISTS agents_groups_agents (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agents_group_id INTEGER NOT NULL REFERENCES agents_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, agents_group_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_agents_groups_agents_agent_id ON agents_groups_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_groups_agents_group_id ON agents_groups_agents(agents_group_id);

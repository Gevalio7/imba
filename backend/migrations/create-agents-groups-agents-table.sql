-- Создание таблицы связи agents_groups_agents
CREATE TABLE IF NOT EXISTS agents_groups_agents (
  id SERIAL PRIMARY KEY,
  agents_group_id INTEGER NOT NULL REFERENCES agents_groups(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agents_group_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agents_groups_agents_group_id ON agents_groups_agents(agents_group_id);
CREATE INDEX IF NOT EXISTS idx_agents_groups_agents_agent_id ON agents_groups_agents(agent_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_agents_groups_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agents_groups_agents_updated_at ON agents_groups_agents;
CREATE TRIGGER trigger_update_agents_groups_agents_updated_at
  BEFORE UPDATE ON agents_groups_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_groups_agents_updated_at();

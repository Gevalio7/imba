-- Migration: Add escalation fields to tickets table
-- Created: 2026-04-09

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS observer_agent_ids INTEGER[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS observer_group_ids INTEGER[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN tickets.observer_agent_ids IS 'ID агентов-наблюдателей';
COMMENT ON COLUMN tickets.observer_group_ids IS 'ID групп-наблюдателей';
COMMENT ON COLUMN tickets.escalation_count IS 'Количество эскалаций тикета';
COMMENT ON COLUMN tickets.is_escalated IS 'Флаг эскалированности тикета';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_observer_agent_ids ON tickets USING GIN(observer_agent_ids);
CREATE INDEX IF NOT EXISTS idx_tickets_observer_group_ids ON tickets USING GIN(observer_group_ids);
-- Migration: Add executor fields to tickets table
-- Created: 2026-03-17
-- Description: Добавляет поля для хранения исполнителей тикета (агенты и группы агентов)

-- Добавляем поля для исполнителей (массивы ID)
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS executor_agent_ids INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS executor_group_ids INTEGER[] DEFAULT '{}';

-- Комментарии к новым полям
COMMENT ON COLUMN tickets.executor_agent_ids IS 'Список ID исполнителей-агентов';
COMMENT ON COLUMN tickets.executor_group_ids IS 'Список ID групп исполнителей';

-- Индексы для быстрого поиска (GIN индексы для массивов)
CREATE INDEX IF NOT EXISTS idx_tickets_executor_agents ON tickets USING GIN(executor_agent_ids);
CREATE INDEX IF NOT EXISTS idx_tickets_executor_groups ON tickets USING GIN(executor_group_ids);

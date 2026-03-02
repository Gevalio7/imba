-- Миграция: Добавление SLA дедлайнов в таблицу tickets
-- Добавляет поля для отслеживания SLA: дедлайны ответа и решения, время первого ответа, флаг нарушения SLA

-- Дедлайны в тикетах для SLA
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sla_violated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_start_at TIMESTAMP;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_tickets_response_deadline ON tickets(response_deadline);
CREATE INDEX IF NOT EXISTS idx_tickets_resolution_deadline ON tickets(resolution_deadline);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_violated ON tickets(sla_violated);
CREATE INDEX IF NOT EXISTS idx_tickets_pending_start ON tickets(pending_start_at);

-- Комментарии к новым полям
COMMENT ON COLUMN tickets.response_deadline IS 'Крайний срок первого ответа';
COMMENT ON COLUMN tickets.resolution_deadline IS 'Крайний срок решения тикета';
COMMENT ON COLUMN tickets.first_response_at IS 'Время первого ответа на тикет';
COMMENT ON COLUMN tickets.sla_violated IS 'Нарушен ли SLA';
COMMENT ON COLUMN tickets.pending_start_at IS 'Начало ожидания от клиента';

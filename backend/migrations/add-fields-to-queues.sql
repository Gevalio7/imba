-- Миграция: Расширение таблицы queues
-- Добавляет поля для привязки к company, service, SLA, workflow, agent_group, priority
-- А также email конфигурацию, ключевые слова и шаблон авто-ответа

-- Расширение таблицы queues
ALTER TABLE queues 
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id),
  ADD COLUMN IF NOT EXISTS sla_id INTEGER REFERENCES sla(id),
  ADD COLUMN IF NOT EXISTS workflow_id INTEGER REFERENCES workflows(id),
  ADD COLUMN IF NOT EXISTS agent_group_id INTEGER REFERENCES agents_groups(id),
  ADD COLUMN IF NOT EXISTS priority_id INTEGER REFERENCES priorities(id),
  ADD COLUMN IF NOT EXISTS email_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS auto_response_template TEXT;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_queues_company ON queues(company_id);
CREATE INDEX IF NOT EXISTS idx_queues_service ON queues(service_id);
CREATE INDEX IF NOT EXISTS idx_queues_sla ON queues(sla_id);
CREATE INDEX IF NOT EXISTS idx_queues_workflow ON queues(workflow_id);
CREATE INDEX IF NOT EXISTS idx_queues_agent_group ON queues(agent_group_id);
CREATE INDEX IF NOT EXISTS idx_queues_priority ON queues(priority_id);

-- Комментарии к новым полям
COMMENT ON COLUMN queues.company_id IS 'Ссылка на компанию (customers)';
COMMENT ON COLUMN queues.service_id IS 'Ссылка на сервис (services)';
COMMENT ON COLUMN queues.sla_id IS 'Ссылка на SLA (sla)';
COMMENT ON COLUMN queues.workflow_id IS 'Ссылка на рабочий процесс (workflows)';
COMMENT ON COLUMN queues.agent_group_id IS 'Ссылка на группу агентов (agents_groups)';
COMMENT ON COLUMN queues.priority_id IS 'Приоритет по умолчанию (priorities)';
COMMENT ON COLUMN queues.email_config IS 'Конфигурация почты для очереди (JSONB)';
COMMENT ON COLUMN queues.keywords IS 'Ключевые слова для авто-маршрутизации';
COMMENT ON COLUMN queues.auto_response_template IS 'Шаблон авто-ответа';

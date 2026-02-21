-- =====================================================
-- Система динамических воркфлоу (Jira-like)
-- =====================================================
-- Создает таблицы для управления жизненным циклом тикетов
-- с гибкими правилами переходов между статусами

-- =====================================================
-- 1. Таблица workflows - логические группы правил
-- =====================================================
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workflows IS 'Логические группы правил для управления жизненным циклом тикетов';
COMMENT ON COLUMN workflows.name IS 'Название воркфлоу (например: Bug Workflow, Incident Workflow)';
COMMENT ON COLUMN workflows.description IS 'Описание назначения воркфлоу';

-- =====================================================
-- 2. Таблица workflow_transitions - правила переходов
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_status_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
    target_status_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    action_label VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальность перехода в рамках одного воркфлоу
    CONSTRAINT unique_transition UNIQUE (workflow_id, source_status_id, target_status_id)
);

COMMENT ON TABLE workflow_transitions IS 'Правила переходов между статусами';
COMMENT ON COLUMN workflow_transitions.workflow_id IS 'ID воркфлоу, к которому относится переход';
COMMENT ON COLUMN workflow_transitions.source_status_id IS 'Исходный статус (NULL = начальный статус для нового тикета)';
COMMENT ON COLUMN workflow_transitions.target_status_id IS 'Целевой статус (обязательно)';
COMMENT ON COLUMN workflow_transitions.action_label IS 'Текст кнопки действия (например: "Взять в работу", "Закрыть")';
COMMENT ON COLUMN workflow_transitions.sort_order IS 'Порядок отображения кнопок';

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow_id ON workflow_transitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_source_status ON workflow_transitions(source_status_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_target_status ON workflow_transitions(target_status_id);

-- =====================================================
-- 3. Добавляем workflow_id в таблицу types
-- =====================================================
ALTER TABLE types ADD COLUMN IF NOT EXISTS workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_types_workflow_id ON types(workflow_id);

COMMENT ON COLUMN types.workflow_id IS 'ID воркфлоу, определяющего жизненный цикл для этого типа тикетов';

-- =====================================================
-- 4. Добавляем is_initial в таблицу states
-- =====================================================
ALTER TABLE states ADD COLUMN IF NOT EXISTS is_initial BOOLEAN DEFAULT false;
COMMENT ON COLUMN states.is_initial IS 'Является ли статус начальным по умолчанию';

-- =====================================================
-- 5. Таблица ticket_status_history - история смены статусов
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_status_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    from_status_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
    to_status_id INTEGER NOT NULL REFERENCES states(id) ON DELETE SET NULL,
    transition_id INTEGER REFERENCES workflow_transitions(id) ON DELETE SET NULL,
    changed_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ticket_status_history IS 'История смены статусов тикетов';
COMMENT ON COLUMN ticket_status_history.transition_id IS 'ID перехода из workflow_transitions (для аудита)';
COMMENT ON COLUMN ticket_status_history.comment IS 'Комментарий при смене статуса';

CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_changed_by ON ticket_status_history(changed_by);

-- =====================================================
-- 6. Триггер для обновления updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_transitions_updated_at ON workflow_transitions;
CREATE TRIGGER update_workflow_transitions_updated_at
    BEFORE UPDATE ON workflow_transitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

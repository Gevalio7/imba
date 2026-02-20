-- Создание таблицы переходов статусов
-- Связывает переходы между статусами с типами инцидентов

CREATE TABLE IF NOT EXISTS state_transitions (
    id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES types(id) ON DELETE CASCADE,
    from_state_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
    to_state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_state_transitions_type_id ON state_transitions(type_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_from_state ON state_transitions(from_state_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_to_state ON state_transitions(to_state_id);

-- Комментарии к таблице
COMMENT ON TABLE state_transitions IS 'Переходы между статусами для типов инцидентов';
COMMENT ON COLUMN state_transitions.type_id IS 'Тип инцидента (NULL = для всех типов)';
COMMENT ON COLUMN state_transitions.from_state_id IS 'Исходный статус (NULL = начальный статус для нового тикета)';
COMMENT ON COLUMN state_transitions.to_state_id IS 'Целевой статус';
COMMENT ON COLUMN state_transitions.name IS 'Название перехода (например: "Открыть", "Закрыть", "В работу")';
COMMENT ON COLUMN state_transitions.is_active IS 'Активен ли переход';

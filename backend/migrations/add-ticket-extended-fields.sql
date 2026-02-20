-- Migration: Add extended fields for Jira-like tickets
-- Created: 2026-02-20

-- 1. Add description field to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN tickets.description IS 'Описание тикета (rich text)';

-- 2. Create ticket_comments table (internal comments for agents only)
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author_id ON ticket_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);

COMMENT ON TABLE ticket_comments IS 'Комментарии к тикетам (внутренние, только для агентов)';
COMMENT ON COLUMN ticket_comments.ticket_id IS 'Ссылка на тикет';
COMMENT ON COLUMN ticket_comments.author_id IS 'Автор комментария (агент)';
COMMENT ON COLUMN ticket_comments.content IS 'Текст комментария';

-- 3. Create ticket_history table
CREATE TABLE IF NOT EXISTS ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_changed_by ON ticket_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON ticket_history(created_at);

COMMENT ON TABLE ticket_history IS 'История изменений тикетов';
COMMENT ON COLUMN ticket_history.field_name IS 'Имя измененного поля';
COMMENT ON COLUMN ticket_history.old_value IS 'Старое значение';
COMMENT ON COLUMN ticket_history.new_value IS 'Новое значение';

-- 4. Create ticket_attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by);

COMMENT ON TABLE ticket_attachments IS 'Вложения к тикетам';
COMMENT ON COLUMN ticket_attachments.file_name IS 'Имя файла';
COMMENT ON COLUMN ticket_attachments.file_path IS 'Путь к файлу на сервере';
COMMENT ON COLUMN ticket_attachments.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN ticket_attachments.mime_type IS 'MIME-тип файла';

-- 5. Create state_transitions table for workflow
CREATE TABLE IF NOT EXISTS state_transitions (
    id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES types(id) ON DELETE CASCADE,
    from_state_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
    to_state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_state_transitions_type_id ON state_transitions(type_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_from ON state_transitions(from_state_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_to ON state_transitions(to_state_id);

COMMENT ON TABLE state_transitions IS 'Переходы между статусами (workflow) привязанные к типу инцидента';
COMMENT ON COLUMN state_transitions.type_id IS 'Тип инцидента (NULL = общие переходы)';
COMMENT ON COLUMN state_transitions.from_state_id IS 'Исходный статус (NULL = начальный статус)';
COMMENT ON COLUMN state_transitions.to_state_id IS 'Целевой статус';
COMMENT ON COLUMN state_transitions.name IS 'Название перехода';

-- 6. Add type_id to states for categorization
ALTER TABLE states ADD COLUMN IF NOT EXISTS type_id INTEGER REFERENCES types(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_states_type_id ON states(type_id);

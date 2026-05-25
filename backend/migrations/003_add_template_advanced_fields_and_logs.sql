-- =====================================================
-- МИГРАЦИЯ: Расширение шаблонов для системы уведомлений
-- Дата: 2026-05-24
-- Описание: Добавляет поля для HTML-шаблонов, CSS, event_type, плейсхолдеров,
-- версионирование, логи доставки уведомлений.
-- Таблица: templates (используется как TemplateQueues в ТЗ)
-- =====================================================

-- Добавляем новые поля в таблицу templates (существующие поля НЕ удаляем)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS subject VARCHAR(500);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS css_styles TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS event_type VARCHAR(100);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT '[]';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS preview_image TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS updated_by INTEGER;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMP;

-- Индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_templates_event_type ON templates(event_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- =====================================================
-- Таблица логов отправки уведомлений
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    queue_id INTEGER,
    ticket_id INTEGER,
    recipients JSONB,
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_event_type ON notification_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template_id ON notification_delivery_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_delivery_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_delivery_logs(status);

-- =====================================================
-- Таблица версий шаблонов (для истории изменений)
-- =====================================================
CREATE TABLE IF NOT EXISTS template_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    message TEXT,
    subject VARCHAR(500),
    css_styles TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(version);

-- Комментарии для документации
COMMENT ON COLUMN templates.subject IS 'Тема письма/уведомления';
COMMENT ON COLUMN templates.css_styles IS 'CSS стили для HTML шаблона';
COMMENT ON COLUMN templates.event_type IS 'Тип события: ticket_open, ticket_close, request_approve, status_change, comment_add';
COMMENT ON COLUMN templates.placeholders IS 'Список плейсхолдеров в шаблоне (JSON)';
COMMENT ON TABLE notification_delivery_logs IS 'Логи отправки уведомлений по шаблонам';
COMMENT ON TABLE template_versions IS 'История версий шаблонов сообщений';

-- =====================================================
-- Обновление существующих шаблонов (опционально, для обратной совместимости)
-- Устанавливаем event_type на основе имени если возможно (пример)
-- =====================================================
-- UPDATE templates SET event_type = 'ticket_open' WHERE name ILIKE '%открыт%' OR name ILIKE '%open%' AND event_type IS NULL;
-- UPDATE templates SET event_type = 'ticket_close' WHERE name ILIKE '%закрыт%' OR name ILIKE '%close%' AND event_type IS NULL;

-- Готово. Запуск: psql -d yourdb -f 003_add_template_advanced_fields_and_logs.sql

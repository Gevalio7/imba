-- =====================================================
-- МИГРАЦИЯ: Очередь email-уведомлений
-- Описание: Добавляет таблицу durable email-очереди, чтобы SMTP-отправка
-- не блокировала PUT-запросы и письма досылались после появления интернета.
-- =====================================================

ALTER TABLE notification_delivery_logs
ADD COLUMN IF NOT EXISTS message_id TEXT;

CREATE TABLE IF NOT EXISTS email_notification_queue (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    queue_id INTEGER,
    ticket_id INTEGER,
    recipients JSONB NOT NULL,
    subject TEXT NOT NULL,
    html TEXT,
    text TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 8,
    next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    attempt_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notification_queue_status_next ON email_notification_queue(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_email_notification_queue_ticket ON email_notification_queue(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_queue_created ON email_notification_queue(created_at);

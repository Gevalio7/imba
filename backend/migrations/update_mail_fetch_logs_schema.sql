-- =====================================================
-- МИГРАЦИЯ: Расширение таблицы mail_fetch_logs
-- Дата: 2026-05-21
-- Описание: Добавляет недостающие поля для корректного хранения логов сборщика почты
-- =====================================================

-- Drop incorrect columns that were added by mistake
ALTER TABLE mail_fetch_logs 
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS message,
    DROP COLUMN IF EXISTS fetched_count;

-- Ensure columns exist with correct names
ALTER TABLE mail_fetch_logs 
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS emails_found INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tickets_created INTEGER DEFAULT 0;

-- Create indexes for search convenience
CREATE INDEX IF NOT EXISTS idx_mail_fetch_logs_account_id ON mail_fetch_logs(mail_account_id);
CREATE INDEX IF NOT EXISTS idx_mail_fetch_logs_started_at ON mail_fetch_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_mail_fetch_logs_errors ON mail_fetch_logs(errors);
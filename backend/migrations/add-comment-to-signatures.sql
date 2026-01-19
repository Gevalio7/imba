-- Миграция: Добавление поля comment в таблицу signatures
-- Дата: 2026-01-19

-- Добавляем колонку comment
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS comment TEXT;

-- Добавляем индекс для comment
CREATE INDEX IF NOT EXISTS idx_signatures_comment ON signatures(comment);

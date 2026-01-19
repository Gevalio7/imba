-- Миграция: Добавление поля content в таблицу greetings
-- Дата: 2026-01-19

-- Добавляем колонку content
ALTER TABLE greetings ADD COLUMN IF NOT EXISTS content TEXT;

-- Добавляем индекс для content
CREATE INDEX IF NOT EXISTS idx_greetings_content ON greetings(content);

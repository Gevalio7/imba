-- Миграция: Добавление полей type и color в таблицу states
-- Дата: 2026-01-19

-- Добавляем колонку type
ALTER TABLE states ADD COLUMN IF NOT EXISTS type VARCHAR(255);

-- Добавляем колонку color
ALTER TABLE states ADD COLUMN IF NOT EXISTS color VARCHAR(7);

-- Добавляем индекс для type
CREATE INDEX IF NOT EXISTS idx_states_type ON states(type);

-- Добавляем индекс для color
CREATE INDEX IF NOT EXISTS idx_states_color ON states(color);

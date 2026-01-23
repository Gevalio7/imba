-- Миграция: Добавление поля type в таблицу services
-- Дата: 2026-01-23

-- Добавляем колонку type
ALTER TABLE services ADD COLUMN IF NOT EXISTS type VARCHAR(255);

-- Добавляем индекс для type
CREATE INDEX IF NOT EXISTS idx_services_type ON services(type);

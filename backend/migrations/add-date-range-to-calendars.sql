-- Добавление полей dateFrom и dateTo в таблицу calendars
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS date_from DATE,
ADD COLUMN IF NOT EXISTS date_to DATE;

-- Индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_calendars_date_from ON calendars(date_from);
CREATE INDEX IF NOT EXISTS idx_calendars_date_to ON calendars(date_to);

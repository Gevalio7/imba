-- Добавление поля color в таблицу calendars
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT 'primary';

-- Индекс для нового поля
CREATE INDEX IF NOT EXISTS idx_calendars_color ON calendars(color);

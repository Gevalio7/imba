-- Добавление полей для рабочих часов и выходных в таблицу calendars
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS work_hours_from TIME,
ADD COLUMN IF NOT EXISTS work_hours_to TIME,
ADD COLUMN IF NOT EXISTS include_weekends BOOLEAN DEFAULT false;

-- Индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_calendars_work_hours_from ON calendars(work_hours_from);
CREATE INDEX IF NOT EXISTS idx_calendars_work_hours_to ON calendars(work_hours_to);
CREATE INDEX IF NOT EXISTS idx_calendars_include_weekends ON calendars(include_weekends);

-- Обновление таблицы calendars: удаление include_weekends, добавление work_days_per_week
ALTER TABLE calendars
DROP COLUMN IF EXISTS include_weekends,
ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER DEFAULT 5 CHECK (work_days_per_week BETWEEN 3 AND 7);

-- Индекс для нового поля
CREATE INDEX IF NOT EXISTS idx_calendars_work_days_per_week ON calendars(work_days_per_week);

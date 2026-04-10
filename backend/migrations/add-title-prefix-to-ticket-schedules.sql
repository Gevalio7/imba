-- Миграция: добавляем поле title_prefix в таблицу ticket_schedules
-- Поле для хранения префикса названия тикета при клонировании по расписанию

ALTER TABLE ticket_schedules ADD COLUMN title_prefix VARCHAR(50) DEFAULT 'Расписание (Р) ';
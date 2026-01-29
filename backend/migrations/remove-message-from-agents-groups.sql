-- Удаление поля message из таблицы agents_groups
ALTER TABLE agents_groups DROP COLUMN IF EXISTS message;

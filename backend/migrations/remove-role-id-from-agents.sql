-- Удаление поля role_id из таблицы agents
-- После миграции данных агенты будут получать роли только через группы

-- Удаление индекса
DROP INDEX IF EXISTS idx_agents_role_id;

-- Удаление колонки
ALTER TABLE agents DROP COLUMN IF EXISTS role_id;

-- Комментарий: роли агентов теперь определяются через группы (agents_groups_agents + agents_groups_roles)
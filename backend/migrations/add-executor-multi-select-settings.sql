-- Миграция: Добавление настроек для множественного выбора исполнителей и групп

-- Сначала добавляем уникальный индекс для поля name, если его нет
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configuration_name_unique ON system_configuration(name);

-- Добавляем настройку для множественного выбора групп исполнителей
INSERT INTO system_configuration (name, description, value, config_type, is_editable, is_active)
VALUES (
  'allow_multiple_executor_groups',
  'Разрешить назначение нескольких групп исполнителей',
  'true',
  'boolean',
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Добавляем настройку для множественного выбора исполнителей
INSERT INTO system_configuration (name, description, value, config_type, is_editable, is_active)
VALUES (
  'allow_multiple_executors',
  'Разрешить назначение нескольких исполнителей',
  'true',
  'boolean',
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

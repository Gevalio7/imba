-- Миграция: Добавление настройки автоматического назначения агента как исполнителя

-- Сначала добавляем уникальный индекс для поля name, если его нет
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configuration_name_unique ON system_configuration(name);

-- Добавляем настройку
INSERT INTO system_configuration (name, description, value, config_type, is_editable, is_active)
VALUES (
  'agent_auto_assign_as_executor',
  'Автоматически назначать агента как исполнителя при создании им новой заявки',
  'false',
  'boolean',
  true,
  true
)
ON CONFLICT (name) DO NOTHING;
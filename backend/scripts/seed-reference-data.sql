-- =====================================================
-- СКРИПТ НАЧАЛЬНЫХ ДАННЫХ (SEED) ДЛЯ DREAMDESC
-- Безопасно запускать повторно (ON CONFLICT DO NOTHING / DO UPDATE)
-- Дата: 2026-05-21
-- =====================================================

-- 1. Базовые справочники (для работы системы)
INSERT INTO priorities (name, color, is_active) VALUES 
    ('Низкий', '#22c55e', true),
    ('Средний', '#eab308', true),
    ('Высокий', '#ef4444', true)
ON CONFLICT DO NOTHING;

INSERT INTO states (name, color, is_active) VALUES 
    ('Новый', '#3b82f6', true),
    ('В работе', '#f59e0b', true),
    ('Решён', '#22c55e', true),
    ('Закрыт', '#6b7280', true)
ON CONFLICT DO NOTHING;

INSERT INTO type_categories (name, is_active) VALUES 
    ('Общий', true),
    ('Инцидент', true),
    ('Запрос', true)
ON CONFLICT DO NOTHING;

-- 2. Минимальные workflow (должны быть первыми — на них ссылаются types и queues)
INSERT INTO workflows (name, description, is_active) VALUES 
    ('Стандартный процесс', 'Базовый процесс обработки заявок', true),
    ('Инцидент', 'Процесс для инцидентов', true)
ON CONFLICT DO NOTHING;

-- 3. Типы заявок
INSERT INTO types (name, comment, is_active) VALUES 
    ('Запрос', 'Обычный запрос пользователя', true),
    ('Инцидент', 'Сбой в работе сервиса', true),
    ('Проблема', 'Причина инцидента', true),
    ('Изменение', 'Запрос на изменение', true)
ON CONFLICT DO NOTHING;

-- 4. SLA
INSERT INTO sla (name, response_time, resolution_time, is_active) VALUES 
    ('Стандартный', 480, 2880, true),   -- 8 часов / 2 дня
    ('Высокий', 120, 480, true),        -- 2 часа / 8 часов
    ('Критический', 30, 240, true)      -- 30 мин / 4 часа
ON CONFLICT DO NOTHING;

-- 5. Базовые очереди
INSERT INTO queues (name, description, is_active) VALUES 
    ('Общая', 'Общая очередь для всех заявок', true),
    ('Техподдержка', 'Техническая поддержка', true),
    ('Биллинг', 'Вопросы по оплате и счетам', true)
ON CONFLICT DO NOTHING;

-- 6. System Configuration — все ключи, которые реально ищет бэкенд
INSERT INTO system_configuration (name, description, value, config_type, is_editable, is_active) VALUES 
    ('reference_data_cache_enabled', 'Включить кеширование referenceData', 'true', 'system', false, true),
    ('reference_data_cache_ttl_seconds', 'Время жизни кеша referenceData в секундах (0 = без кеша)', '300', 'system', false, true),
    ('mail_fetch_interval_minutes', 'Интервал проверки почты (минуты)', '5', 'mail', true, true),
    ('mail_fetcher_max_retries', 'Максимум попыток при ошибке получения письма', '3', 'mail', true, true),
    ('mail_fetcher_retry_delay_seconds', 'Задержка между попытками (сек)', '30', 'mail', true, true),
    ('mail_fetcher_max_attachment_size_mb', 'Максимальный размер вложения (МБ)', '25', 'mail', true, true),
    ('create_customer_user_by_email', 'Автоматически создавать Customer User при получении письма от нового адреса', 'true', 'mail', true, true),
    ('ticket_auto_assign_on_create', 'Автоматически назначать исполнителя при создании тикета', 'false', 'ticket', true, true),
    ('default_priority', 'Приоритет по умолчанию (ID)', '2', 'ticket', true, true),
    ('default_state', 'Статус по умолчанию (ID)', '1', 'ticket', true, true),
    ('default_type', 'Тип заявки по умолчанию (ID)', '1', 'ticket', true, true),
    ('default_queue', 'Очередь по умолчанию (ID)', '1', 'ticket', true, true),
    ('default_sla', 'SLA по умолчанию (ID)', '1', 'ticket', true, true),
    ('system_name', 'Название системы (отображается в UI и письмах)', 'DreamDesc Helpdesk', 'system', true, true),
    ('company_name', 'Название компании', 'Ваша компания', 'system', true, true),
    -- Флаги управления множественным выбором в очередях (по умолчанию разрешено)
    ('allow_multiple_executor_groups', 'Разрешить выбор нескольких групп исполнителей в очереди', 'true', 'queue', true, true),
    ('allow_multiple_executors', 'Разрешить выбор нескольких исполнителей в очереди', 'true', 'queue', true, true)
ON CONFLICT (name) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- ГОТОВО
-- =====================================================

SELECT 'Seed-данные успешно применены!' AS result;
SELECT COUNT(*) AS system_configuration_count FROM system_configuration;
SELECT COUNT(*) AS types_count FROM types;
SELECT COUNT(*) AS workflows_count FROM workflows;
SELECT COUNT(*) AS queues_count FROM queues;
SELECT COUNT(*) AS sla_count FROM sla;
-- Миграция: Создание таблицы разрешений ролей
-- Таблица для хранения разрешений (привилегий) каждой роли

-- Создаем таблицу role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    is_granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Добавляем стандартные разрешения для существующих ролей
-- Сначала получаем все роли
DO $$
DECLARE
    r RECORD;
    default_permissions TEXT[] := ARRAY[
        'create_ticket',
        'see_own_tickets',
        'reply_to_tickets',
        'internal_notes',
        'change_status',
        'kb_read',
        'kb_write',
        'view_reports',
        'manage_users',
        'see_all_tickets',
        'see_department_tickets',
        'see_company_tickets'
    ];
    perm TEXT;
BEGIN
    -- Для каждой роли добавляем все разрешения по умолчанию
    FOR r IN SELECT id, name FROM roles LOOP
        FOREACH perm IN ARRAY default_permissions LOOP
            INSERT INTO role_permissions (role_id, permission, is_granted)
            VALUES (r.id, perm, false)
            ON CONFLICT (role_id, permission) DO NOTHING;
        END LOOP;
        
        -- Для роли "Admin" даем все разрешения
        IF r.name ILIKE '%admin%' OR r.name ILIKE '%админ%' THEN
            UPDATE role_permissions 
            SET is_granted = true 
            WHERE role_id = r.id;
        END IF;
    END LOOP;
END $$;

-- Выводим результат
SELECT 'Миграция выполнена успешно' as result;

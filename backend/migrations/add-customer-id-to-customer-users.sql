-- Миграция для добавления поля customer_id в таблицу customer_users
-- Это позволит связать сотрудников с компаниями

-- Добавляем поле customer_id
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

-- Создаем индекс для быстрого поиска сотрудников по компании
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);

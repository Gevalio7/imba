-- Миграция для добавления поля customers_group_id в таблицу customer_users
-- Это позволит связать клиентов компании с группами клиентов

-- Добавляем поле customers_group_id
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS customers_group_id INTEGER REFERENCES customers_groups(id) ON DELETE SET NULL;

-- Создаем индекс для быстрого поиска клиентов по группе
CREATE INDEX IF NOT EXISTS idx_customer_users_customers_group_id ON customer_users(customers_group_id);

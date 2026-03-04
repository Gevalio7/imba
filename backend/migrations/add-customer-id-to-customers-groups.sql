-- Миграция для добавления поля customer_id в таблицу customers_groups
-- Это позволит связать группы клиентов с компаниями

-- Добавляем поле customer_id
ALTER TABLE customers_groups ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

-- Создаем индекс для быстрого поиска групп по компании
CREATE INDEX IF NOT EXISTS idx_customers_groups_customer_id ON customers_groups(customer_id);

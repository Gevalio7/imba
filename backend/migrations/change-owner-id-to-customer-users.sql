-- Изменяем внешний ключ owner_id с agents на customer_users

-- Удаляем старый внешний ключ
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_owner_id_fkey;

-- Добавляем новый внешний ключ на customer_users
ALTER TABLE tickets ADD CONSTRAINT tickets_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES customer_users(id) ON DELETE SET NULL;
-- Добавление поля queue_id в таблицу email_addresses
-- Миграция: add-queue-id-to-email-addresses.sql

ALTER TABLE email_addresses
ADD COLUMN queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL;

-- Добавляем индекс для ускорения запросов
CREATE INDEX idx_email_addresses_queue_id ON email_addresses(queue_id);

-- Добавляем комментарий к полю
COMMENT ON COLUMN email_addresses.queue_id IS 'ID связанной очереди';

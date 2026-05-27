-- Миграция: Токены сброса пароля для customer_users
-- Дата: 2026-05-27
-- Описание: Позволяет отправлять ссылки для сброса пароля вместо отправки пароля в письме

ALTER TABLE customer_users 
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Индекс для быстрого поиска токена
CREATE INDEX IF NOT EXISTS idx_customer_users_reset_token ON customer_users(password_reset_token);

-- Комментарий
COMMENT ON COLUMN customer_users.password_reset_token IS 'Одноразовый токен для сброса пароля (отправляется в письме)';
COMMENT ON COLUMN customer_users.password_reset_expires IS 'Срок действия токена сброса пароля';
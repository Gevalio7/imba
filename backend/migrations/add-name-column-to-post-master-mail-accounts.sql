-- Миграция для добавления колонки name в таблицу post_master_mail_accounts
ALTER TABLE post_master_mail_accounts ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';

-- Обновляем комментарий для колонки
COMMENT ON COLUMN post_master_mail_accounts.name IS 'Название почтового аккаунта';
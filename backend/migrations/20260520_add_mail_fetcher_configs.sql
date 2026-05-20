-- backend/migrations/20260520_add_mail_fetcher_configs.sql
INSERT INTO system_configurations (key, value, description, category, is_active) VALUES
('mail_fetcher_max_retries', '3', 'Максимальное количество повторных попыток при ошибках IMAP', 'mail', 1),
('mail_fetcher_retry_delay_seconds', '5', 'Базовая задержка между попытками (сек)', 'mail', 1),
('mail_fetcher_max_attachment_size_mb', '10', 'Максимальный размер вложения (МБ)', 'mail', 1)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;

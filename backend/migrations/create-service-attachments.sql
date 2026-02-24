-- Создание таблицы для вложений сервисов
-- Аналогично ticket_attachments, файлы хранятся на сервере

CREATE TABLE IF NOT EXISTS service_attachments (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(255),
  uploaded_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_service_attachments_service_id ON service_attachments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_attachments_uploaded_by ON service_attachments(uploaded_by);

COMMENT ON TABLE service_attachments IS 'Таблица вложений для сервисов';
COMMENT ON COLUMN service_attachments.service_id IS 'ID сервиса';
COMMENT ON COLUMN service_attachments.file_name IS 'Оригинальное имя файла';
COMMENT ON COLUMN service_attachments.file_path IS 'Путь к файлу на сервере';
COMMENT ON COLUMN service_attachments.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN service_attachments.mime_type IS 'MIME-тип файла';
COMMENT ON COLUMN service_attachments.uploaded_by IS 'ID пользователя, загрузившего файл';

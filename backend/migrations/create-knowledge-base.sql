-- Миграция: Создание таблицы Базы Знаний (knowledge_base)
-- Таблица для хранения статей и документации для агентов и клиентов

-- Таблица базы знаний
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER REFERENCES types(id),
  tags TEXT[],
  service_id INTEGER REFERENCES services(id),
  is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES agents(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_kb_title ON knowledge_base(title);
CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_service ON knowledge_base(service_id);
CREATE INDEX IF NOT EXISTS idx_kb_published ON knowledge_base(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_created_by ON knowledge_base(created_by);
CREATE INDEX IF NOT EXISTS idx_kb_active ON knowledge_base(is_active);

-- Комментарии
COMMENT ON TABLE knowledge_base IS 'База знаний - статьи и документация для агентов и клиентов';
COMMENT ON COLUMN knowledge_base.title IS 'Заголовок статьи';
COMMENT ON COLUMN knowledge_base.content IS 'Содержание статьи (Markdown/HTML)';
COMMENT ON COLUMN knowledge_base.category_id IS 'Категория статьи (ссылка на types)';
COMMENT ON COLUMN knowledge_base.tags IS 'Теги для поиска';
COMMENT ON COLUMN knowledge_base.service_id IS 'Связанный сервис';
COMMENT ON COLUMN knowledge_base.is_published IS 'Опубликована ли статья';
COMMENT ON COLUMN knowledge_base.views_count IS 'Количество просмотров';
COMMENT ON COLUMN knowledge_base.created_by IS 'Автор статьи';
COMMENT ON COLUMN knowledge_base.created_at IS 'Дата создания';
COMMENT ON COLUMN knowledge_base.updated_at IS 'Дата обновления';
COMMENT ON COLUMN knowledge_base.is_active IS 'Активна ли статья';

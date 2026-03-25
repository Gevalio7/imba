-- Миграция: Добавить поле category_id в таблицу tickets
-- Добавлено: 2026-03-22

-- Добавляем поле category_id (ссылка на type_categories)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES type_categories(id) ON DELETE SET NULL;

-- Индекс для быстрого поиска по category_id
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);

-- Комментарий к полю
COMMENT ON COLUMN tickets.category_id IS 'Категория тикета (ссылка на type_categories)';

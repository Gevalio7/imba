-- Миграция для создания справочника категорий типов (type_categories)
-- и добавления связи category_ids в таблицу types

-- Таблица категорий для типов (type_categories)
CREATE TABLE IF NOT EXISTS type_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    labor_hours DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_type_categories_name ON type_categories(name);
CREATE INDEX IF NOT EXISTS idx_type_categories_is_active ON type_categories(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_type_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_type_categories_updated_at ON type_categories;
CREATE TRIGGER trigger_update_type_categories_updated_at
  BEFORE UPDATE ON type_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_type_categories_updated_at();

-- Добавляем поле category_ids в таблицу types (массив ID категорий)
ALTER TABLE types ADD COLUMN IF NOT EXISTS category_ids INTEGER[] DEFAULT '{}';

-- Индекс для быстрого поиска по category_ids
CREATE INDEX IF NOT EXISTS idx_types_category_ids ON types USING GIN(category_ids);

-- Комментарии к таблицам и полям
COMMENT ON TABLE type_categories IS 'Категории для типов обращений';
COMMENT ON COLUMN type_categories.name IS 'Название категории';
COMMENT ON COLUMN type_categories.labor_hours IS 'Время трудозатрат (в часах)';
COMMENT ON COLUMN types.category_ids IS 'Массив ID категорий типа';

-- Добавление колонки template_id в таблицу queues
ALTER TABLE queues ADD COLUMN template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;

-- Индекс для производительности
CREATE INDEX idx_queues_template_id ON queues(template_id);

-- Комментарий к колонке
COMMENT ON COLUMN queues.template_id IS 'ID шаблона, связанного с очередью';

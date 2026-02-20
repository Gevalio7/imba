-- Добавление поля is_internal в таблицу ticket_comments
-- для различения внешних (публичных) и внутренних (только для агентов) комментариев

ALTER TABLE ticket_comments 
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Добавляем комментарий к полю
COMMENT ON COLUMN ticket_comments.is_internal IS 'true = внутренний комментарий (только для агентов), false = внешний комментарий (публичный)';

-- Создаем индекс для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_ticket_comments_is_internal ON ticket_comments(is_internal);

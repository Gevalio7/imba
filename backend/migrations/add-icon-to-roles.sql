-- Добавляем поле icon в таблицу roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS icon VARCHAR(255);

-- Также добавляем поле photo на случай, если нужно будет отображать фото
ALTER TABLE roles ADD COLUMN IF NOT EXISTS photo VARCHAR(500);

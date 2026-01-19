#!/bin/bash

# Скрипт для создания полного бэкапа базы данных PostgreSQL и упаковки

# Загрузка переменных окружения из .env файла
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Файл .env не найден. Используются значения по умолчанию."
fi

# Параметры базы данных (с fallback на значения по умолчанию)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-test_entities_db}

# Директория для бэкапов
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
ARCHIVE_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

# Создание директории для бэкапов, если она не существует
mkdir -p "$BACKUP_DIR"

echo "Создание бэкапа базы данных $DB_NAME..."

# Экспорт пароля для pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Создание бэкапа с помощью pg_dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-password --format=custom --compress=9 --verbose > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Бэкап успешно создан: $BACKUP_FILE"

    # Упаковка бэкапа в tar.gz
    echo "Упаковка бэкапа..."
    tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$(basename "$BACKUP_FILE")"

    if [ $? -eq 0 ]; then
        echo "Бэкап упакован: $ARCHIVE_FILE"

        # Удаление оригинального файла бэкапа (оставляем только архив)
        rm "$BACKUP_FILE"
        echo "Оригинальный файл бэкапа удален. Остался только архив."

        # Вывод размера архива
        ARCHIVE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1)
        echo "Размер архива: $ARCHIVE_SIZE"
    else
        echo "Ошибка при упаковке бэкапа."
        exit 1
    fi
else
    echo "Ошибка при создании бэкапа."
    exit 1
fi

echo "Бэкап завершен успешно."

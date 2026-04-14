#!/bin/bash

# Скрипт для бэкапа базы данных PostgreSQL

# Настройки подключения (можно переопределить через переменные окружения)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-test_entities_db}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Директория для бэкапов
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Создаем директорию для бэкапов, если не существует
mkdir -p "$BACKUP_DIR"

# Экспортируем пароль для pg_dump
export PGPASSWORD="$DB_PASSWORD"

echo "🚀 Начинаем бэкап базы данных $DB_NAME..."
echo "📁 Файл бэкапа: $BACKUP_FILE"

# Выполняем бэкап
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ Бэкап успешно создан: $BACKUP_FILE"
    echo "📊 Размер файла: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Ошибка при создании бэкапа"
    exit 1
fi

# Очищаем переменную пароля
unset PGPASSWORD

echo "🎉 Бэкап завершен!"
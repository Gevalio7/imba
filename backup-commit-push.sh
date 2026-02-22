#!/bin/bash

# Скрипт: Бэкап БД + Git Commit + Push
# Использование: ./backup-commit-push.sh "сообщение коммита"

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Получаем сообщение коммита из аргумента или используем значение по умолчанию
COMMIT_MESSAGE="${1:-Автоматический коммит от $(date '+%Y-%m-%d %H:%M:%S')}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  БЭКАП + COMMIT + PUSH${NC}"
echo -e "${BLUE}========================================${NC}"

# --- ШАГ 1: Бэкап базы данных ---
echo -e "\n${YELLOW}[1/4] Создание бэкапа базы данных...${NC}"

cd backend

# Загрузка переменных окружения из .env файла
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${RED}Файл .env не найден в директории backend.${NC}"
    exit 1
fi

# Параметры базы данных
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

# Создание директории для бэкапов
mkdir -p "$BACKUP_DIR"

echo -e "  База данных: $DB_NAME"
echo -e "  Хост: $DB_HOST:$DB_PORT"

# Экспорт пароля для pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Создание бэкапа
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-password --format=custom --compress=9 > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Бэкап создан: $BACKUP_FILE"
    
    # Упаковка в tar.gz
    tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$(basename "$BACKUP_FILE")" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        rm "$BACKUP_FILE"
        ARCHIVE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1)
        echo -e "  ${GREEN}✓${NC} Архив создан: $ARCHIVE_FILE ($ARCHIVE_SIZE)"
    else
        echo -e "  ${RED}✗${NC} Ошибка при упаковке бэкапа"
        exit 1
    fi
else
    echo -e "  ${RED}✗${NC} Ошибка при создании бэкапа"
    exit 1
fi

cd ..

# --- ШАГ 2: Git Status ---
echo -e "\n${YELLOW}[2/4] Проверка изменений...${NC}"

# Проверяем есть ли изменения
if git diff-index --quiet HEAD -- 2>/dev/null; then
    if [ -z "$(git ls-files --others --exclude-standard)" ]; then
        echo -e "  ${GREEN}Нет изменений для коммита.${NC}"
        echo -e "\n${BLUE}========================================${NC}"
        echo -e "${GREEN}  Готово! Изменений не было.${NC}"
        echo -e "${BLUE}========================================${NC}"
        exit 0
    fi
fi

# Показываем статус
echo -e "  Изменённые файлы:"
git status --short | head -20
if [ $(git status --short | wc -l) -gt 20 ]; then
    echo -e "  ... и ещё $(($(git status --short | wc -l) - 20)) файлов"
fi

# --- ШАГ 3: Git Add + Commit ---
echo -e "\n${YELLOW}[3/4] Добавление и коммит...${NC}"

# Добавляем все изменения
git add -A
echo -e "  ${GREEN}✓${NC} Все файлы добавлены"

# Создаём коммит
git commit -m "$COMMIT_MESSAGE"
echo -e "  ${GREEN}✓${NC} Коммит создан: \"$COMMIT_MESSAGE\""

# --- ШАГ 4: Git Push ---
echo -e "\n${YELLOW}[4/4] Отправка в удалённый репозиторий...${NC}"

# Получаем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo -e "  Текущая ветка: $CURRENT_BRANCH"

# Пуш
if git push origin "$CURRENT_BRANCH"; then
    echo -e "  ${GREEN}✓${NC} Изменения отправлены в origin/$CURRENT_BRANCH"
else
    echo -e "  ${RED}✗${NC} Ошибка при отправке. Проверьте подключение или права доступа."
    exit 1
fi

# --- Итог ---
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}  ✓ Все операции выполнены успешно!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "  Бэкап: backend/$ARCHIVE_FILE"
echo -e "  Коммит: $COMMIT_MESSAGE"
echo -e "  Ветка: $CURRENT_BRANCH"

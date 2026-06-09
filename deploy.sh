#!/bin/bash
#
# deploy.sh
# Универсальный скрипт деплоя Vue/Vite приложения на Docker-сервер
#
# Использование:
#   ./deploy.sh --file src/composables/useTicketForm.ts
#   ./deploy.sh -c abc123
#   ./deploy.sh --interactive
#

set -euo pipefail

# ========================== КОНФИГУРАЦИЯ ==========================
# Можно переопределить в deploy.config.sh

# Сервер
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-212.8.226.71}"
SERVER_PROJECT_PATH="${SERVER_PROJECT_PATH:-/root/dreamdesc}"

# Docker
CONTAINER_NAME="${CONTAINER_NAME:-vue-project_prod}"
IMAGE_NAME="${IMAGE_NAME:-vue-app}"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.prod.yml}"
USE_DOCKER_COMPOSE="${USE_DOCKER_COMPOSE:-true}"

# Сборка
BUILD_COMMAND="${BUILD_COMMAND:-npm run build}"
SKIP_BUILD_DEFAULT=false

# Логи
LOG_FILE="deploy.log"

# Уведомления (опционально)
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# ========================== ПОДКЛЮЧЕНИЕ ХЕЛПЕРОВ ==========================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-helper.sh
source "$SCRIPT_DIR/deploy-helper.sh"

# ========================== ЗАГРУЗКА КОНФИГА ==========================
CONFIG_FILE="$SCRIPT_DIR/deploy.config.sh"
if [ -f "$CONFIG_FILE" ]; then
    # shellcheck source=deploy.config.sh
    source "$CONFIG_FILE"
    log INFO "Загружена конфигурация из $CONFIG_FILE"
fi

# ========================== ПЕРЕМЕННЫЕ ==========================
MODE=""
FILES=()
COMMIT=""
INTERACTIVE=false
DRY_RUN=false
SKIP_BUILD=false
SKIP_BACKUP=false
RESTART_ONLY=false
SHOW_LOGS=false
DO_ROLLBACK=false
DO_MIGRATE=false
ENVIRONMENT="production"
MIGRATE_FILES=()

# ========================== ПАРСИНГ АРГУМЕНТОВ ==========================
print_usage() {
    cat << EOF
Использование: $0 [опции]

Режимы:
  -f, --file FILE          Деплой конкретного файла(ов) (поддерживает glob)
  -c, --commit COMMIT      Деплой изменений из коммита
  -i, --interactive        Интерактивный режим

Опции:
      --dry-run            Показать план действий без выполнения
      --skip-build         Пропустить сборку
      --skip-backup        Не создавать бэкап
      --restart-only       Только перезапустить контейнер
      --logs               Показать логи после деплоя
      --rollback           Откат к последнему бэкапу
      --migrate            Запустить миграции (только .sql файлы)
      --migrate-only       Только применить миграции, без деплоя кода
      --env ENV            Окружение (production/staging/dev)
  -h, --help               Показать эту справку

Примеры:
  $0 -f src/composables/useTicketForm.ts
  $0 -c HEAD~1
  $0 --interactive
  $0 --migrate backend/migrations/003_add_template_advanced_fields_and_logs.sql
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                MODE="file"
                shift
                while [[ $# -gt 0 && ! $1 =~ ^- ]]; do
                    FILES+=("$1")
                    shift
                done
                ;;
            -c|--commit)
                MODE="commit"
                COMMIT="$2"
                shift 2
                ;;
            -i|--interactive)
                INTERACTIVE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --restart-only)
                RESTART_ONLY=true
                shift
                ;;
            --logs)
                SHOW_LOGS=true
                shift
                ;;
            --rollback)
                DO_ROLLBACK=true
                shift
                ;;
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --migrate)
                DO_MIGRATE=true
                shift
                if [[ $# -gt 0 && ! $1 =~ ^- ]]; then
                    while [[ $# -gt 0 && ! $1 =~ ^- ]]; do
                        MIGRATE_FILES+=("$1")
                        shift
                    done
                fi
                ;;
            --migrate-only)
                DO_MIGRATE=true
                MIGRATE_FILES_ONLY=true
                shift
                if [[ $# -gt 0 && ! $1 =~ ^- ]]; then
                    while [[ $# -gt 0 && ! $1 =~ ^- ]]; do
                        MIGRATE_FILES+=("$1")
                        shift
                    done
                fi
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                log ERROR "Неизвестный параметр: $1"
                print_usage
                exit 1
                ;;
        esac
    done
}

# ========================== ИНТЕРАКТИВНЫЙ РЕЖИМ ==========================
interactive_mode() {
    log INFO "=== Интерактивный режим деплоя ==="

    echo "Что деплоить?"
    echo "  1) Файл(ы)"
    echo "  2) Коммит"
    echo "  3) Только перезапуск контейнера"
    read -rp "Выбор [1-3]: " choice

    case $choice in
        1)
            MODE="file"
            read -rp "Путь к файлу(ам) (можно несколько через пробел): " -a FILES
            ;;
        2)
            MODE="commit"
            read -rp "Хеш коммита (или HEAD~1 и т.д.): " COMMIT
            ;;
        3)
            RESTART_ONLY=true
            ;;
        *)
            log ERROR "Неверный выбор"
            exit 1
            ;;
    esac

    read -rp "Выполнить dry-run? [y/N]: " dry
    [[ "$dry" =~ ^[Yy]$ ]] && DRY_RUN=true

    read -rp "Пропустить сборку? [y/N]: " skipb
    [[ "$skipb" =~ ^[Yy]$ ]] && SKIP_BUILD=true

    read -rp "Создать бэкап? [Y/n]: " backup
    [[ "$backup" =~ ^[Nn]$ ]] && SKIP_BACKUP=true

    echo ""
    log INFO "План деплоя:"
    echo "  Режим: $MODE"
    [ ${#FILES[@]} -gt 0 ] && echo "  Файлы: ${FILES[*]}"
    [ -n "$COMMIT" ] && echo "  Коммит: $COMMIT"
    echo "  Dry-run: $DRY_RUN"
    echo "  Skip build: $SKIP_BUILD"
    echo ""

    read -rp "Продолжить? [y/N]: " confirm
    [[ ! "$confirm" =~ ^[Yy]$ ]] && { log INFO "Отменено пользователем"; exit 0; }
}

# ========================== ОСНОВНАЯ ЛОГИКА ==========================
main() {
    parse_args "$@"

    if [ "$INTERACTIVE" = true ] || [ $# -eq 0 ]; then
        interactive_mode
    fi

    if [ "$DO_ROLLBACK" = true ]; then
        rollback
        exit 0
    fi

    # Если --migrate-only — нам не нужен MODE
    if [ "$MIGRATE_FILES_ONLY" = true ]; then
        DO_MIGRATE=true
    fi

    if [ -z "$MODE" ] && [ "$RESTART_ONLY" = false ] && [ "$DO_MIGRATE" = false ]; then
        log ERROR "Не указан режим работы (--file, --commit или --interactive)"
        print_usage
        exit 1
    fi

    local start_time
    start_time=$(date +%s)

    log INFO "🚀 Starting deployment..."
    log INFO "📁 Mode: ${MODE:-restart-only} | Environment: $ENVIRONMENT"

    # Проверки
    check_ssh_connection || exit 1

    if [ "$RESTART_ONLY" = false ]; then
        case $MODE in
            file)
                if [ ${#FILES[@]} -eq 0 ]; then
                    log ERROR "Не указаны файлы для деплоя"
                    exit 1
                fi
                deploy_files
                ;;
            commit)
                if [ -z "$COMMIT" ]; then
                    log ERROR "Не указан коммит"
                    exit 1
                fi
                deploy_commit
                ;;
        esac
    fi

    # Docker операции (если не только миграции)
    if [ "$DRY_RUN" = false ] && [ "$MIGRATE_FILES_ONLY" != true ]; then
        perform_docker_operations
    else
        log INFO "[DRY-RUN] Пропущены операции с Docker"
    fi

    # Миграции (если указаны)
    if [ "$DO_MIGRATE" = true ]; then
        run_migrations || {
            log ERROR "Миграции завершились с ошибкой"
            exit 1
        }
    fi

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log SUCCESS "✅ Deployment completed successfully! (${duration} seconds)"

    if [ "$SHOW_LOGS" = true ]; then
        log INFO "Последние логи контейнера:"
        ssh "$SERVER_USER@$SERVER_HOST" "docker logs --tail 50 $CONTAINER_NAME"
    fi

    send_notification "SUCCESS" "Деплой завершён успешно за ${duration}с"
}

# ========================== ДЕПЛОЙ ФАЙЛОВ ==========================
deploy_files() {
    log INFO "📦 Режим: деплой файлов"

    # Проверка существования файлов локально + синтаксис
    for file in "${FILES[@]}"; do
        if [ ! -e "$file" ]; then
            log ERROR "Файл не найден локально: $file"
            exit 1
        fi
        check_syntax "$file" || exit 1
    done

    # Определяем тип изменений (для DreamDesc проекта)
    local has_frontend=false
    local has_backend=false

    for file in "${FILES[@]}"; do
        if [[ "$file" == backend/* || "$file" == *.js && "$file" == backend/* ]]; then
            has_backend=true
        elif [[ "$file" == src/* || "$file" == *.vue || "$file" == *.ts || "$file" == index.html || "$file" == vite.config.ts ]]; then
            has_frontend=true
        fi
    done

    log INFO "Тип изменений: Frontend=$has_frontend, Backend=$has_backend"

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Будут скопированы файлы:"
        printf '  - %s\n' "${FILES[@]}"
        return 0
    fi

    # Бэкап
    if [ "$SKIP_BACKUP" = false ]; then
        backup_files "${FILES[@]}" || log WARN "Не удалось создать бэкап (продолжаем)"
    fi

    # Оптимальное копирование одним rsync
    log INFO "📤 Копирование файлов на сервер (с сохранением структуры)..."

    # Создаём директории на сервере
    for file in "${FILES[@]}"; do
        local dir
        dir=$(dirname "$file")
        ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p '${SERVER_PROJECT_PATH}/${dir}'" 2>/dev/null || true
    done

    # Копируем все файлы за один проход с --relative
    rsync -avz --relative -e "ssh -o StrictHostKeyChecking=no" \
        "${FILES[@]}" \
        "${SERVER_USER}@${SERVER_HOST}:${SERVER_PROJECT_PATH}/" || {
        log ERROR "Ошибка при копировании файлов на сервер"
        exit 1
    }

    for file in "${FILES[@]}"; do
        log SUCCESS "Скопирован: $file"
    done

    # Сохраняем информацию о типе изменений для последующих шагов
    export HAS_FRONTEND_CHANGE=$has_frontend
    export HAS_BACKEND_CHANGE=$has_backend

    # Автоматически добавить .sql файлы из миграций, если они есть в FILES
    if [ "$DO_MIGRATE" = false ]; then
        for f in "${FILES[@]}"; do
            if [[ "$f" == *.sql ]]; then
                MIGRATE_FILES+=("$f")
            fi
        done
        if [ ${#MIGRATE_FILES[@]} -gt 0 ]; then
            DO_MIGRATE=true
            log INFO "Автоматически найдены SQL миграции в FILES: ${MIGRATE_FILES[*]}"
        fi
    fi
}

# ========================== ДЕПЛОЙ ИЗ КОММИТА ==========================
deploy_commit() {
    log INFO "📦 Режим: деплой из коммита $COMMIT"

    if ! git cat-file -t "$COMMIT" &>/dev/null; then
        log ERROR "Коммит не найден: $COMMIT"
        exit 1
    fi

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Будут извлечены файлы из коммита $COMMIT"
        git diff --name-only "$COMMIT"~1 "$COMMIT" | head -20
        return 0
    fi

    # Получаем список изменённых файлов
    local changed_files
    mapfile -t changed_files < <(git diff --name-only "$COMMIT"~1 "$COMMIT" 2>/dev/null || git show --name-only --pretty="" "$COMMIT")

    if [ ${#changed_files[@]} -eq 0 ]; then
        log WARN "В коммите нет изменённых файлов"
        return 0
    fi

    # Фильтруем только существующие файлы в текущей рабочей директории
    local files_to_deploy=()
    for f in "${changed_files[@]}"; do
        if [ -f "$f" ]; then
            files_to_deploy+=("$f")
        fi
    done

    if [ ${#files_to_deploy[@]} -eq 0 ]; then
        log WARN "Нет файлов для деплоя из коммита"
        return 0
    fi

    # Автоматически добавить .sql файлы из миграций, если они есть в коммите
    if [ "$DO_MIGRATE" = false ]; then
        for f in "${files_to_deploy[@]}"; do
            if [[ "$f" == *.sql && -f "$f" ]]; then
                MIGRATE_FILES+=("$f")
            fi
        done
        if [ ${#MIGRATE_FILES[@]} -gt 0 ]; then
            DO_MIGRATE=true
            log INFO "Автоматически найдены SQL миграции: ${MIGRATE_FILES[*]}"
        fi
    fi

    FILES=("${files_to_deploy[@]}")
    deploy_files
}

# ========================== МИГРАЦИИ ==========================
run_migrations() {
    if [ ${#MIGRATE_FILES[@]} -eq 0 ]; then
        log INFO "Миграционные файлы не указаны явно и не найдены в коммите"
        return 0
    fi

    log INFO "🔄 Выполнение SQL миграций..."

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Будут применены миграции:"
        printf '  - %s\n' "${MIGRATE_FILES[@]}"
        return 0
    fi

    # Проверяем подключение к БД
    log INFO "Проверка соединения с PostgreSQL..."

    # Получаем пароль из .env на сервере
    local db_password
    db_password=$(ssh "$SERVER_USER@$SERVER_HOST" "cat '$SERVER_PROJECT_PATH/.env' | grep DB_PASSWORD | cut -d '=' -f2" 2>/dev/null || echo "postgres")

    for sql_file in "${MIGRATE_FILES[@]}"; do
        # Преобразуем локальный путь в серверный
        local remote_sql_path="${SERVER_PROJECT_PATH}/${sql_file}"

        log INFO "Применение миграции: $sql_file"

        ssh "$SERVER_USER@$SERVER_HOST" "
            PGPASSWORD='$db_password' psql -h localhost -p 5432 -U postgres -d test_entities_db -f '$remote_sql_path'
        " || {
            log ERROR "Ошибка при применении миграции: $sql_file"
            return 1
        }

        log SUCCESS "Миграция применена: $sql_file"
    done

    log SUCCESS "Все миграции успешно применены"
}

# ========================== DOCKER / BACKEND ОПЕРАЦИИ (DreamDesc) ==========================
perform_docker_operations() {
    local has_frontend=${HAS_FRONTEND_CHANGE:-false}
    local has_backend=${HAS_BACKEND_CHANGE:-false}

    log INFO "🐳 Выполнение операций деплоя (DreamDesc)..."

    # === BACKEND (PM2) ===
    if [ "$has_backend" = true ]; then
        log INFO "Обнаружены изменения в backend — перезапуск через PM2..."
        ssh "$SERVER_USER@$SERVER_HOST" "
            pm2 restart dreamdesc-backend --update-env 2>/dev/null || \
            pm2 restart all --update-env 2>/dev/null || \
            echo 'PM2 процесс не найден, пропускаем'
        " || log WARN "Не удалось перезапустить backend через PM2"
    fi

    # === FRONTEND (Docker) ===
    if [ "$has_frontend" = true ] || [ "$RESTART_ONLY" = true ]; then
        if [ "$USE_DOCKER_COMPOSE" = true ]; then
            log INFO "Используется Docker Compose ($DOCKER_COMPOSE_FILE) — frontend"

            if [ "$SKIP_BUILD" = false ]; then
                log INFO "🔨 Сборка Docker образа (может занять 1-3 минуты)..."
                ssh "$SERVER_USER@$SERVER_HOST" "
                    cd '$SERVER_PROJECT_PATH' &&
                    docker compose -f '$DOCKER_COMPOSE_FILE' build --no-cache $CONTAINER_NAME
                " || { log ERROR "Ошибка сборки Docker образа"; exit 1; }
            fi

            log INFO "🔄 Перезапуск frontend контейнера..."
            ssh "$SERVER_USER@$SERVER_HOST" "
                cd '$SERVER_PROJECT_PATH' &&
                docker compose -f '$DOCKER_COMPOSE_FILE' up -d $CONTAINER_NAME
            " || { log ERROR "Ошибка перезапуска контейнера"; exit 1; }
        else
            # fallback на обычный docker (если нужно)
            log INFO "Остановка старого контейнера..."
            ssh "$SERVER_USER@$SERVER_HOST" "docker stop $CONTAINER_NAME || true"

            if [ "$SKIP_BUILD" = false ]; then
                log INFO "Сборка нового образа..."
                ssh "$SERVER_USER@$SERVER_HOST" "
                    cd '$SERVER_PROJECT_PATH' &&
                    docker build -t $IMAGE_NAME .
                " || { log ERROR "Ошибка сборки образа"; exit 1; }
            fi

            log INFO "Запуск нового контейнера..."
            ssh "$SERVER_USER@$SERVER_HOST" "
                docker run -d --name $CONTAINER_NAME --rm -p 8080:80 $IMAGE_NAME
            " || { log ERROR "Ошибка запуска контейнера"; exit 1; }
        fi

        # Healthcheck только для frontend контейнера
        docker_health_check "$CONTAINER_NAME" 80 || {
            log ERROR "Healthcheck frontend контейнера не прошёл!"
            if [ "$SKIP_BACKUP" = false ]; then
                log INFO "Попытка отката..."
                rollback
            fi
            exit 1
        }
    fi

    log SUCCESS "Операции деплоя завершены успешно"
}

# ========================== ЗАПУСК ==========================
main "$@"

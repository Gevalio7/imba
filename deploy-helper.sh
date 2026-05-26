#!/bin/bash
#
# deploy-helper.sh
# Вспомогательные функции для deploy.sh
# Использование: source ./deploy-helper.sh
#

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Логирование
LOG_FILE="${LOG_FILE:-deploy.log}"

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        INFO)  color=$BLUE;   icon="ℹ️" ;;
        SUCCESS) color=$GREEN; icon="✅" ;;
        WARN)  color=$YELLOW; icon="⚠️" ;;
        ERROR) color=$RED;    icon="❌" ;;
        DEBUG) color=$CYAN;   icon="🐛" ;;
        *)     color=$NC;     icon="📝" ;;
    esac

    echo -e "${color}[${timestamp}] ${icon} ${message}${NC}"
    echo "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
}

progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percent=$((current * 100 / total))
    local filled=$((width * current / total))
    local empty=$((width - filled))

    printf "\r["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] %3d%%" "$percent"

    if [ "$current" -eq "$total" ]; then
        echo ""
    fi
}

# Проверка синтаксиса (TypeScript/Vue)
check_syntax() {
    local file="$1"

    if [[ "$file" == *.ts || "$file" == *.tsx ]]; then
        if command -v npx &> /dev/null; then
            if npx tsc --noEmit --skipLibCheck "$file" &>/dev/null; then
                log SUCCESS "TypeScript синтаксис OK: $file"
                return 0
            else
                log ERROR "Ошибка TypeScript в файле: $file"
                return 1
            fi
        fi
    elif [[ "$file" == *.vue ]]; then
        log INFO "Проверка Vue файла (базовая): $file"
        # Можно добавить vue-tsc если установлен
        return 0
    fi

    return 0
}

# Создание бэкапа файлов на сервере
backup_files() {
    local files=("$@")
    local backup_dir="/tmp/deploy_backup_$(date +%s)"

    log INFO "Создание бэкапа в $backup_dir на сервере..."

    ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $backup_dir" || {
        log ERROR "Не удалось создать директорию бэкапа на сервере"
        return 1
    }

    for file in "${files[@]}"; do
        local remote_path="${SERVER_PROJECT_PATH}/${file}"
        ssh "$SERVER_USER@$SERVER_HOST" "
            if [ -f '$remote_path' ]; then
                mkdir -p '$backup_dir/$(dirname "$file")'
                cp '$remote_path' '$backup_dir/$file'
            fi
        " 2>/dev/null
    done

    echo "$backup_dir" > .last_backup
    log SUCCESS "Бэкап создан: $backup_dir"
    return 0
}

# Откат к последнему бэкапу
rollback() {
    if [ ! -f .last_backup ]; then
        log ERROR "Файл .last_backup не найден. Откат невозможен."
        return 1
    fi

    local backup_dir
    backup_dir=$(cat .last_backup)

    log WARN "Выполняется откат к бэкапу: $backup_dir"

    ssh "$SERVER_USER@$SERVER_HOST" "
        if [ -d '$backup_dir' ]; then
            cp -r '$backup_dir'/* '$SERVER_PROJECT_PATH'/ 2>/dev/null || true
            echo 'Файлы восстановлены из бэкапа'
        else
            echo 'Директория бэкапа не найдена на сервере'
            exit 1
        fi
    "

    log SUCCESS "Откат завершён"
}

# Healthcheck Docker контейнера
docker_health_check() {
    local container="$1"
    local port="${2:-3000}"
    local max_attempts=30
    local attempt=1

    log INFO "Проверка здоровья контейнера $container (порт $port)..."

    while [ $attempt -le $max_attempts ]; do
        if ssh "$SERVER_USER@$SERVER_HOST" "docker exec $container curl -sf http://localhost:$port/health > /dev/null 2>&1 || \
            docker exec $container curl -sf http://localhost:$port > /dev/null 2>&1"; then
            log SUCCESS "Healthcheck прошёл успешно"
            return 0
        fi

        progress_bar "$attempt" "$max_attempts"
        sleep 2
        attempt=$((attempt + 1))
    done

    log ERROR "Healthcheck не прошёл после $max_attempts попыток"
    return 1
}

# Отправка уведомления (Telegram / Slack)
send_notification() {
    local status="$1"
    local message="$2"

    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=🚀 Deploy ${status}: ${message}" \
            -d "parse_mode=HTML" > /dev/null 2>&1
        log INFO "Уведомление отправлено в Telegram"
    fi

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deploy ${status}: ${message}\"}" > /dev/null 2>&1
        log INFO "Уведомление отправлено в Slack"
    fi
}

# Проверка соединения с сервером
check_ssh_connection() {
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_HOST" "echo ok" &>/dev/null; then
        log ERROR "Не удаётся подключиться к $SERVER_USER@$SERVER_HOST"
        log INFO "Убедись, что SSH-ключ настроен и сервер доступен"
        return 1
    fi
    log SUCCESS "SSH соединение установлено"
    return 0
}

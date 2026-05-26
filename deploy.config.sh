#!/bin/bash
#
# deploy.config.sh
# Конфигурация для deploy.sh
# Скопируй этот файл и отредактируй под свой сервер
#

# === Сервер ===
SERVER_USER="root"
SERVER_HOST="212.8.226.71"
SERVER_PROJECT_PATH="/root/dreamdesc"

# === Docker ===
CONTAINER_NAME="vue-project_prod"
IMAGE_NAME="vue-app"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
USE_DOCKER_COMPOSE=true

# === Сборка ===
# Для этого проекта сборка происходит внутри Dockerfile,
# поэтому BUILD_COMMAND можно оставить пустым или не использовать
BUILD_COMMAND=""

# === Уведомления (опционально) ===
# TELEGRAM_BOT_TOKEN="123456:ABC-DEF"
# TELEGRAM_CHAT_ID="-1001234567890"
# SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# === Дополнительно ===
LOG_FILE="deploy.log"

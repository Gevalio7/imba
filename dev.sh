#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Функция для вывода цветного текста
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Функция для проверки, запущен ли процесс на порту
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Функция для остановки процесса на порту
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        print_color $YELLOW "⚠️  Останавливаем процесс на порту $port..."
        # Логируем процессы перед убийством
        echo "DEBUG: Процессы на порту $port:" >> logs/debug.log
        for pid in $pids; do
            ps -p $pid -o pid,ppid,cmd 2>/dev/null >> logs/debug.log || echo "PID $pid: не найден" >> logs/debug.log
        done
        kill -9 $pids 2>/dev/null
        sleep 1
        print_color $GREEN "✅ Процесс на порту $port остановлен"
    fi
}

# Функция для очистки при выходе
cleanup() {
    print_color $YELLOW "\n\n🛑 Останавливаем все процессы..."
    
    # Останавливаем фронтенд
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null
        print_color $GREEN "✅ Фронтенд остановлен"
    fi
    
    # Останавливаем бэкенд
    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null
        print_color $GREEN "✅ Бэкенд остановлен"
    fi
    
    # Дополнительная очистка портов
    kill_port 5173
    kill_port 5174
    kill_port 5175
    kill_port 5176
    kill_port 3000
    
    print_color $CYAN "👋 До свидания!"
    exit 0
}

# Устанавливаем обработчик сигналов
trap cleanup SIGINT SIGTERM EXIT

# Заголовок
print_color $MAGENTA "╔════════════════════════════════════════════════════════════╗"
print_color $MAGENTA "║                                                            ║"
print_color $MAGENTA "║          🚀 Development Environment Launcher 🚀            ║"
print_color $MAGENTA "║                                                            ║"
print_color $MAGENTA "╚════════════════════════════════════════════════════════════╝"
echo ""

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    print_color $YELLOW "⚠️  Файл .env не найден. Создаем из .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_color $GREEN "✅ Файл .env создан"
    else
        print_color $RED "❌ Файл .env.example не найден!"
        exit 1
    fi
fi

# Проверка наличия backend/.env файла
if [ ! -f "backend/.env" ]; then
    print_color $YELLOW "⚠️  Файл backend/.env не найден. Создаем из backend/.env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_color $GREEN "✅ Файл backend/.env создан"
    else
        print_color $YELLOW "⚠️  Файл backend/.env.example не найден, пропускаем..."
    fi
fi

# Очистка портов перед запуском
print_color $CYAN "\n🧹 Очистка портов..."
kill_port 5173
kill_port 5174
kill_port 5175
kill_port 5176
kill_port 3000

# Очистка кэша Vite
print_color $CYAN "\n🗑️  Очистка кэша Vite..."
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    print_color $GREEN "✅ Кэш Vite очищен"
else
    print_color $GREEN "✅ Кэш Vite уже пуст"
fi

# Проверка зависимостей
print_color $CYAN "\n📦 Проверка зависимостей..."

if [ ! -d "node_modules" ]; then
    print_color $YELLOW "⚠️  Зависимости фронтенда не установлены. Устанавливаем..."
    npm install
    if [ $? -ne 0 ]; then
        print_color $RED "❌ Ошибка установки зависимостей фронтенда"
        exit 1
    fi
    print_color $GREEN "✅ Зависимости фронтенда установлены"
else
    print_color $GREEN "✅ Зависимости фронтенда уже установлены"
fi

if [ ! -d "backend/node_modules" ]; then
    print_color $YELLOW "⚠️  Зависимости бэкенда не установлены. Устанавливаем..."
    cd backend && npm install && cd ..
    if [ $? -ne 0 ]; then
        print_color $RED "❌ Ошибка установки зависимостей бэкенда"
        exit 1
    fi
    print_color $GREEN "✅ Зависимости бэкенда установлены"
else
    print_color $GREEN "✅ Зависимости бэкенда уже установлены"
fi

# Инициализация базы данных
print_color $CYAN "\n🗄️  Инициализация базы данных..."
cd backend && npm run init-db && cd ..
if [ $? -ne 0 ]; then
    print_color $RED "❌ Ошибка инициализации базы данных"
    exit 1
fi
print_color $GREEN "✅ База данных инициализирована"

# Создание логов директории
mkdir -p logs

# Запуск бэкенда
print_color $CYAN "\n🔧 Запуск бэкенда..."
cd backend
npm run dev 2>&1 | tee ../logs/backend.log &
BACKEND_PID=$!
cd ..

# Ждем запуска бэкенда
print_color $YELLOW "⏳ Ожидание запуска бэкенда..."
for i in {1..30}; do
    if check_port 3000; then
        print_color $GREEN "✅ Бэкенд запущен на http://localhost:3000"
        break
    fi
    if [ $i -eq 30 ]; then
        print_color $RED "❌ Бэкенд не запустился за 30 секунд"
        print_color $YELLOW "📋 Последние строки лога:"
        tail -20 logs/backend.log
        cleanup
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Запуск фронтенда
print_color $CYAN "\n🎨 Запуск фронтенда..."
npm run dev 2>&1 | tee logs/frontend.log &
FRONTEND_PID=$!

# Ждем запуска фронтенда
print_color $YELLOW "⏳ Ожидание запуска фронтенда..."
for i in {1..30}; do
    # Проверяем все возможные порты Vite
    if check_port 5173 || check_port 5174 || check_port 5175 || check_port 5176; then
        # Определяем на каком порту запустился
        for port in 5173 5174 5175 5176; do
            if check_port $port; then
                FRONTEND_PORT=$port
                print_color $GREEN "✅ Фронтенд запущен на http://localhost:$port"
                break 2
            fi
        done
    fi
    if [ $i -eq 30 ]; then
        print_color $RED "❌ Фронтенд не запустился за 30 секунд"
        print_color $YELLOW "📋 Последние строки лога:"
        tail -20 logs/frontend.log
        cleanup
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Информация о запущенных сервисах
print_color $MAGENTA "\n╔════════════════════════════════════════════════════════════╗"
print_color $MAGENTA "║                                                            ║"
print_color $MAGENTA "║                  ✨ Все сервисы запущены! ✨               ║"
print_color $MAGENTA "║                                                            ║"
print_color $MAGENTA "╚════════════════════════════════════════════════════════════╝"
echo ""
print_color $GREEN "🌐 Фронтенд:  http://localhost:${FRONTEND_PORT:-5173}"
print_color $GREEN "🔧 Бэкенд:    http://localhost:3000"
print_color $GREEN "💚 Health:    http://localhost:3000/health"
print_color $GREEN "📊 API:       http://localhost:3000/api"
echo ""
print_color $CYAN "📋 Логи:"
print_color $CYAN "   Фронтенд: logs/frontend.log"
print_color $CYAN "   Бэкенд:   logs/backend.log"
echo ""
print_color $YELLOW "💡 Для просмотра логов в реальном времени:"
print_color $YELLOW "   tail -f logs/frontend.log"
print_color $YELLOW "   tail -f logs/backend.log"
echo ""
print_color $RED "⚠️  Нажмите Ctrl+C для остановки всех сервисов"
echo ""

# Мониторинг процессов
while true; do
    # Проверяем, живы ли процессы
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_color $RED "\n❌ Бэкенд упал! Последние строки лога:"
        tail -20 logs/backend.log
        cleanup
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_color $RED "\n❌ Фронтенд упал! Последние строки лога:"
        tail -20 logs/frontend.log
        cleanup
        exit 1
    fi
    
    sleep 5
done

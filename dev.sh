#!/bin/bash

echo "Starting dev.sh script..."

# Проверка и установка зависимостей для фронтенда
if [ ! -d "node_modules" ]; then
  echo "Установка зависимостей фронтенда..."
  npm install
fi

# Проверка и установка зависимостей для бэкенда
if [ ! -d "backend/node_modules" ]; then
  echo "Установка зависимостей бэкенда..."
  cd backend && npm install && cd ..
fi

# Очистка кэша Vite
echo "Очистка кэша Vite..."
rm -rf node_modules/.vite

# Запуск бэкенда в фоне
echo "Запуск бэкенда..."
cd backend && npm start &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Ожидание 3 секунды
echo "Waiting 3 seconds for backend to initialize..."
sleep 3

# Запуск Vite dev сервера
echo "Запуск Vite dev сервера..."
npm run dev < /dev/null

# Остановка бэкенда при завершении
echo "Остановка бэкенда..."
kill $BACKEND_PID
